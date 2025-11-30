import {
  useLoaderData,
  useActionData,
  useNavigate,
  useRouteError,
  data,
} from "react-router";
import { useEffect } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { instagram } from "../../services/instagram.server";
import { handleError, DatabaseError } from "../../utils/errors.server";
import { logger } from "../../utils/logger.server";
import { checkRateLimit, RATE_LIMITS } from "../../utils/rateLimit.server";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { WelcomeSection, EmptyState, ConfiguredState } from "./components";

async function fetchInstagramPostsForAccount(config) {
  try {
    // Vérifier et rafraîchir le token si nécessaire
    let activeConfig = config;
    let tokenRefreshWarning = null;
    try {
      activeConfig = await instagram.checkAndRefreshTokenIfNeeded(
        config,
        prisma,
      );
      // Capturer le warning si le refresh a échoué
      if (activeConfig.tokenRefreshFailed) {
        tokenRefreshWarning = activeConfig.tokenRefreshError;
      }
    } catch (error) {
      logger.warn("Token refresh check failed", {
        shop: config.shop,
        error: error?.message,
      });
      // Continue with current config even if refresh check fails
    }

    const pages = await instagram.getInstagramAccounts(
      activeConfig.accessToken,
    );
    const pageWithInstagram = pages.find((p) => p.instagram_business_account);

    if (!pageWithInstagram) {
      return [];
    }

    const instagramId = pageWithInstagram.instagram_business_account.id;

    const actualUsername = await instagram.getInstagramUsername(
      instagramId,
      activeConfig.accessToken,
    );
    if (actualUsername && actualUsername !== config.username) {
      await prisma.instagramConfig.update({
        where: { id: config.id },
        data: { username: actualUsername },
      });
      config.username = actualUsername;
    }

    const [publishedPosts, taggedPosts] = await Promise.all([
      instagram.getInstagramPosts(instagramId, activeConfig.accessToken),
      instagram.getTaggedPosts(instagramId, activeConfig.accessToken),
    ]);

    const allPosts = [
      ...publishedPosts.map((p) => ({ ...p, isTagged: false })),
      ...taggedPosts.map((p) => ({ ...p, isTagged: true })),
    ];

    await Promise.all(
      allPosts.map(async (post) => {
        let insights = { impressions: null, reach: null, saved: null };
        try {
          insights = await instagram.getPostInsights(
            post.id,
            activeConfig.accessToken,
          );
        } catch (error) {
          logger.warn("Failed to fetch post insights", {
            postId: post.id,
            shop: config.shop,
            error: error?.message,
          });
        }

        const hashtags = instagram.extractHashtags(post.caption);
        const ownerUsername = post.username || config.username;

        let carouselImages = null;
        if (post.media_type === "CAROUSEL_ALBUM") {
          try {
            const children = await instagram.getCarouselChildren(
              post.id,
              activeConfig.accessToken,
            );
            if (children.length > 0) {
              carouselImages = JSON.stringify(
                children.map((child) => ({
                  url: child.media_url,
                  type: child.media_type,
                })),
              );
            }
          } catch (error) {
            logger.warn("Failed to fetch carousel children", {
              postId: post.id,
              shop: config.shop,
              error: error?.message,
            });
          }
        }

        return prisma.instagramPost.upsert({
          where: { id: post.id },
          update: {
            ownerUsername,
            caption: post.caption || null,
            mediaUrl: post.media_url,
            thumbnailUrl: post.thumbnail_url || null,
            carouselImages,
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
            thumbnailUrl: post.thumbnail_url || null,
            carouselImages,
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
      }),
    );

    return allPosts.map((post) => ({
      ...post,
      accountUsername: config.username,
      configId: config.id,
    }));
  } catch (error) {
    logger.error("Failed to fetch Instagram posts", error, {
      configId: config.id,
      username: config.username,
    });

    if (error.message.includes("token") || error.message.includes("auth")) {
      try {
        await prisma.instagramConfig.update({
          where: { id: config.id },
          data: { isActive: false },
        });
        logger.warn("Instagram config deactivated due to auth error", {
          configId: config.id,
          username: config.username,
        });
      } catch (dbError) {
        logger.error("Failed to deactivate config", dbError, {
          configId: config.id,
        });
      }
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
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let errors = [];
    let warnings = []; // Ajouter un array pour les warnings

    if (configs.length > 0) {
      const syncPromises = configs.map((config) =>
        fetchInstagramPostsForAccount(config),
      );

      const results = await Promise.allSettled(syncPromises);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          errors.push({
            configId: configs[index].id,
            username: configs[index].username,
            error: result.reason.message,
          });
        }
      });

      // Vérifier les tokens refresh qui ont échoué
      for (const config of configs) {
        const refreshCheckConfig = await instagram.checkAndRefreshTokenIfNeeded(
          config,
          prisma,
        );
        if (refreshCheckConfig.tokenRefreshFailed) {
          warnings.push({
            configId: config.id,
            username: config.username,
            message: refreshCheckConfig.tokenRefreshError,
            type: "token_refresh_failed",
          });
        }
      }
    }

    const activeUsernames = configs.map((c) => c.username);
    const posts = await prisma.instagramPost.findMany({
      where: {
        shop,
        username: {
          in: activeUsernames,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 100,
    });

    const postsWithAccount = posts.map((post) => {
      const config = configs.find((c) => c.username === post.username);
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
      accounts: configs.map((config) => ({
        id: config.id,
        username: config.username,
        createdAt: config.createdAt,
      })),
      errors: errors.length > 0 ? errors : null,
      warnings: warnings.length > 0 ? warnings : null, // Ajouter les warnings
    };
  } catch (error) {
    logger.error("Loader error in app._index", error);
    return {
      shop: "unknown",
      isConfigured: false,
      posts: [],
      accountsCount: 0,
      accounts: [],
      errors: [{ error: "Échec du chargement des données Instagram" }],
    };
  }
};

export default function Index() {
  const {
    shop,
    isConfigured,
    posts,
    accountsCount,
    accounts,
    errors,
    warnings,
  } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (actionData?.redirect) {
      navigate(actionData.redirect, { replace: true });
    }
  }, [actionData, navigate]);

  return (
    <s-page heading={t("app.title")}>
      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        <LanguageSwitcher />
      </div>
      {!isConfigured && <WelcomeSection />}

      {warnings && warnings.length > 0 && (
        <s-section variant="warning">
          <s-stack direction="block" gap="tight">
            <s-text variant="headingSm">⚠️ Avertissements</s-text>
            {warnings.map((warning, index) => (
              <s-text key={index} variant="bodySm">
                {warning.username}: {warning.message}
              </s-text>
            ))}
          </s-stack>
        </s-section>
      )}

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

    if (!actionType || typeof actionType !== "string") {
      logger.warn("Invalid action type", { actionType });
      return data({ error: "Action invalide" }, { status: 400 });
    }

    // Rate limiting: 20 déconnexions par 15 minutes
    const rateLimit = checkRateLimit(
      `disconnect:${shop}`,
      RATE_LIMITS.DISCONNECT.max,
      RATE_LIMITS.DISCONNECT.window,
    );

    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded for disconnect", { shop, actionType });
      return data(
        { error: "Trop de déconnexions, veuillez patienter" },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (rateLimit.resetTime - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    switch (actionType) {
      case "disconnect": {
        const accountId = formData.get("accountId");
        if (!accountId || typeof accountId !== "string") {
          logger.warn("Invalid account ID", { accountId });
          return data({ error: "ID de compte invalide" }, { status: 400 });
        }

        let config;
        try {
          config = await prisma.instagramConfig.findFirst({
            where: {
              id: accountId,
              shop,
              isActive: true,
            },
          });
        } catch (error) {
          throw new DatabaseError(
            "Erreur lors de la recherche du compte",
            error,
          );
        }

        if (!config) {
          logger.warn("Account not found for disconnect", { accountId, shop });
          return data(
            { error: "Compte introuvable ou déjà déconnecté" },
            { status: 404 },
          );
        }

        try {
          await prisma.instagramConfig.update({
            where: { id: accountId },
            data: { isActive: false },
          });
        } catch (error) {
          throw new DatabaseError(
            "Erreur lors de la déconnexion du compte",
            error,
          );
        }

        logger.info("Account disconnected successfully", {
          shop,
          accountId,
          username: config.username,
        });

        return data({
          success: true,
          message: `Compte @${config.username} déconnecté avec succès`,
        });
      }

      case "disconnect_all": {
        let result;
        try {
          result = await prisma.instagramConfig.updateMany({
            where: {
              shop,
              isActive: true,
            },
            data: { isActive: false },
          });
        } catch (error) {
          throw new DatabaseError(
            "Erreur lors de la déconnexion des comptes",
            error,
          );
        }

        logger.info("All accounts disconnected", { shop, count: result.count });

        return data({
          success: true,
          message: `${result.count} compte(s) déconnecté(s) avec succès`,
          redirect: "/app",
        });
      }

      default:
        logger.warn("Unknown action type", { actionType });
        return data({ error: "Action non reconnue" }, { status: 400 });
    }
  } catch (error) {
    return handleError(error, { action: "app-index-action" });
  }
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
