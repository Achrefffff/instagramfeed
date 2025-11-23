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

/**
 * Récupère les posts Instagram pour un compte donné
 */
async function fetchInstagramPostsForAccount(config) {
  try {
    const pages = await instagram.getInstagramAccounts(config.accessToken);
    const pageWithInstagram = pages.find(p => 
      p.instagram_business_account && 
      p.name === config.username
    );
    
    if (!pageWithInstagram) {
      console.warn(`No Instagram page found for username: ${config.username}`);
      return [];
    }

    const instagramId = pageWithInstagram.instagram_business_account.id;
    const posts = await instagram.getInstagramPosts(instagramId, config.accessToken);
    
    // Sauvegarder les posts en base de données
    await Promise.all(
      posts.map(post => 
        prisma.instagramPost.upsert({
          where: { id: post.id },
          update: {
            caption: post.caption || null,
            mediaUrl: post.media_url,
            permalink: post.permalink,
            timestamp: new Date(post.timestamp),
            mediaType: post.media_type,
          },
          create: {
            id: post.id,
            shop: config.shop,
            caption: post.caption || null,
            mediaUrl: post.media_url,
            permalink: post.permalink,
            timestamp: new Date(post.timestamp),
            mediaType: post.media_type,
          },
        })
      )
    );
    
    // Ajouter l'identifiant du compte aux posts pour le tracking
    return posts.map(post => ({
      ...post,
      accountUsername: config.username,
      configId: config.id
    }));
  } catch (error) {
    console.error(`Error fetching posts for account ${config.username}:`, {
      error: error.message,
      configId: config.id,
      timestamp: new Date().toISOString()
    });
    
    // Désactiver le compte si le token est invalide
    if (error.message.includes('token') || error.message.includes('auth')) {
      try {
        await prisma.instagramConfig.update({
          where: { id: config.id },
          data: { isActive: false }
        });
        console.info(`Deactivated invalid Instagram config: ${config.id}`);
      } catch (dbError) {
        console.error('Failed to deactivate invalid config:', dbError);
      }
    }
    
    return [];
  }
}

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    // Récupérer les configurations actives avec index optimisé
    const configs = await prisma.instagramConfig.findMany({
      where: { 
        shop, 
        isActive: true 
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let posts = [];
    let errors = [];

    if (configs.length > 0) {
      // Traitement parallèle des comptes pour de meilleures performances
      const postPromises = configs.map(config => 
        fetchInstagramPostsForAccount(config)
      );
      
      const results = await Promise.allSettled(postPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          posts.push(...result.value);
        } else {
          errors.push({
            configId: configs[index].id,
            username: configs[index].username,
            error: result.reason.message
          });
        }
      });
      
      // Trier les posts par date (plus récents en premier)
      posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    return {
      shop,
      isConfigured: configs.length > 0,
      posts,
      accountsCount: configs.length,
      accounts: configs.map(config => ({
        id: config.id,
        username: config.username,
        createdAt: config.createdAt
      })),
      errors: errors.length > 0 ? errors : null
    };
    
  } catch (error) {
    console.error('Loader error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Retourner un état d'erreur plutôt que de faire planter l'app
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
      <WelcomeSection />
      
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

        // Vérifier que le compte appartient bien au shop
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
    console.error('Action error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
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
