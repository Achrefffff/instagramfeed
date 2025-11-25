import { useLoaderData, useActionData, useNavigate, useRouteError, data } from "react-router";
import { useEffect } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { instagram } from "../../services/instagram.server";
import {
  WelcomeSection,
  EmptyState,
  ConfiguredState,
} from "./components";

async function fetchInstagramPostsForAccount(config) {
  try {
    const pages = await instagram.getInstagramAccounts(config.accessToken);
    const pageWithInstagram = pages.find(p => p.instagram_business_account);
    
    if (!pageWithInstagram) {
      return [];
    }

    const instagramId = pageWithInstagram.instagram_business_account.id;
    
    const actualUsername = await instagram.getInstagramUsername(instagramId, config.accessToken);
    if (actualUsername && actualUsername !== config.username) {
      await prisma.instagramConfig.update({
        where: { id: config.id },
        data: { username: actualUsername }
      });
      config.username = actualUsername;
    }
    
    const [publishedPosts, taggedPosts] = await Promise.all([
      instagram.getInstagramPosts(instagramId, config.accessToken),
      instagram.getTaggedPosts(instagramId, config.accessToken)
    ]);
    
    const allPosts = [
      ...publishedPosts.map(p => ({ ...p, isTagged: false })),
      ...taggedPosts.map(p => ({ ...p, isTagged: true }))
    ];
    
    await Promise.all(
      allPosts.map(async (post) => {
        let insights = { impressions: null, reach: null, saved: null };
        try {
          insights = await instagram.getPostInsights(post.id, config.accessToken);
        } catch (error) {}

        const hashtags = instagram.extractHashtags(post.caption);
        const ownerUsername = post.username || config.username;

        return prisma.instagramPost.upsert({
          where: { id: post.id },
          update: {
            username: config.username,
            ownerUsername,
            isTagged: post.isTagged,
            caption: post.caption || null,
            mediaUrl: post.media_url,
            permalink: post.permalink,
            timestamp: new Date(post.timestamp),
            mediaType: post.media_type,
            likeCount: post.like_count ?? 0,
            commentsCount: post.comments_count ?? 0,
            impressions: insights.impressions,
            reach: insights.reach,
            saved: insights.saved,
            hashtags,
          },
          create: {
            id: post.id,
            shop: config.shop,
            username: config.username,
            ownerUsername,
            isTagged: post.isTagged,
            caption: post.caption || null,
            mediaUrl: post.media_url,
            permalink: post.permalink,
            timestamp: new Date(post.timestamp),
            mediaType: post.media_type,
            likeCount: post.like_count ?? 0,
            commentsCount: post.comments_count ?? 0,
            impressions: insights.impressions,
            reach: insights.reach,
            saved: insights.saved,
            hashtags,
          },
        });
      })
    );
    
    return allPosts.map(post => ({
      ...post,
      accountUsername: config.username,
      configId: config.id
    }));
  } catch (error) {
    if (error.message.includes('token') || error.message.includes('auth')) {
      try {
        await prisma.instagramConfig.update({
          where: { id: config.id },
          data: { isActive: false }
        });
      } catch (dbError) {}
    }
    
    return [];
  }
}

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const configs = await prisma.instagramConfig.findMany({
      where: { 
        shop, 
        isActive: true 
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let errors = [];

    if (configs.length > 0) {
      const syncPromises = configs.map(config => 
        fetchInstagramPostsForAccount(config)
      );
      
      const results = await Promise.allSettled(syncPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          errors.push({
            configId: configs[index].id,
            username: configs[index].username,
            error: result.reason.message
          });
        }
      });
    }

    const activeUsernames = configs.map(c => c.username);
    const posts = await prisma.instagramPost.findMany({
      where: { 
        shop,
        username: {
          in: activeUsernames
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100,
    });

    const postsWithAccount = posts.map(post => {
      const config = configs.find(c => c.username === post.username);
      return {
        ...post,
        accountUsername: post.username,
        configId: config?.id,
      };
    });

    return {
      shop,
      isConfigured: configs.length > 0,
      posts: postsWithAccount,
      accountsCount: configs.length,
      accounts: configs.map(config => ({
        id: config.id,
        username: config.username,
        createdAt: config.createdAt
      })),
      errors: errors.length > 0 ? errors : null
    };
    
  } catch (error) {
    return {
      shop: 'unknown',
      isConfigured: false,
      posts: [],
      accountsCount: 0,
      accounts: [],
      errors: [{ error: 'Failed to load Instagram data' }]
    };
  }
};

export default function Index() {
  const { shop, isConfigured, posts, accountsCount, accounts, errors } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData?.redirect) {
      navigate(actionData.redirect, { replace: true });
    }
  }, [actionData, navigate]);

  return (
    <s-page heading="Instagram Feed">
      {!isConfigured && <WelcomeSection />}
      
      {errors && errors.length > 0 && (
        <s-section variant="critical">
          <s-stack direction="block" gap="tight">
            <s-text variant="headingSm">Erreurs de synchronisation</s-text>
            {errors.map((error, index) => (
              <s-text key={index} variant="bodySm">
                {error.username}: {error.error}
              </s-text>
            ))}
          </s-stack>
        </s-section>
      )}

      {!isConfigured ? (
        <EmptyState shop={shop} />
      ) : (
        <ConfiguredState 
          posts={posts} 
          accountsCount={accountsCount}
          accounts={accounts}
          shop={shop}
        />
      )}
    </s-page>
  );
}

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("action");
    const shop = session.shop;

    switch (actionType) {
      case "disconnect": {
        const accountId = formData.get("accountId");
        if (!accountId) {
          return data({ error: "Missing account ID" }, { status: 400 });
        }

        const config = await prisma.instagramConfig.findFirst({
          where: { 
            id: accountId,
            shop,
            isActive: true
          }
        });

        if (!config) {
          return data({ error: "Account not found or already disconnected" }, { status: 404 });
        }

        await prisma.instagramConfig.update({
          where: { id: accountId },
          data: { isActive: false },
        });

        return data({ 
          success: true, 
          message: `Compte @${config.username} déconnecté avec succès` 
        });
      }

      case "disconnect_all": {
        const result = await prisma.instagramConfig.updateMany({
          where: { 
            shop,
            isActive: true
          },
          data: { isActive: false },
        });

        return data({ 
          success: true, 
          message: `${result.count} compte(s) déconnecté(s) avec succès`,
          redirect: "/app"
        });
      }

      default:
        return data({ error: "Action non reconnue" }, { status: 400 });
    }
  } catch (error) {
    return data(
      { error: "Une erreur est survenue lors de la déconnexion" }, 
      { status: 500 }
    );
  }
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
