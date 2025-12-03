import {
  useLoaderData,
  useActionData,
  useNavigate,
  useRouteError,
  data,
  useNavigation,
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
import { ErrorBoundary as AppErrorBoundary } from "../../components/ErrorBoundary";
import { EmptyState, ConfiguredState } from "./components";

async function fetchInstagramPosts(config) {
  try {
    logger.info("Fetching posts for account", {
      configId: config.id,
      username: config.username,
    });

    // Vérifier et rafraîchir le token si nécessaire
    let activeConfig = config;
    try {
      logger.info("Checking token refresh", { configId: config.id });
      activeConfig = await instagram.checkAndRefreshTokenIfNeeded(
        config,
        prisma,
      );
      logger.info("Token check completed", { configId: config.id });
    } catch (error) {
      logger.warn("Token refresh check failed", {
        shop: config.shop,
        error: error?.message,
      });
    }

    logger.info("Getting Instagram accounts", { configId: config.id });
    const pages = await instagram.getInstagramAccounts(
      activeConfig.accessToken,
    );
    const pageWithInstagram = pages.find((p) => p.instagram_business_account);

    if (!pageWithInstagram) {
      logger.warn("No Instagram business account found", {
        configId: config.id,
      });
      return [];
    }

    const instagramId = pageWithInstagram.instagram_business_account.id;

    logger.info("Getting Instagram username", { configId: config.id });
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
      logger.info("Username updated", {
        configId: config.id,
        newUsername: actualUsername,
      });
    }

    logger.info("Getting posts (published + tagged)", { configId: config.id });
    const [publishedPosts, taggedPosts] = await Promise.all([
      instagram.getInstagramPosts(instagramId, activeConfig.accessToken),
      instagram.getTaggedPosts(instagramId, activeConfig.accessToken),
    ]);

    logger.info("Posts fetched", {
      configId: config.id,
      publishedCount: publishedPosts.length,
      taggedCount: taggedPosts.length,
    });

    const allPosts = [
      ...publishedPosts.map((p) => ({ ...p, isTagged: false })),
      ...taggedPosts.map((p) => ({ ...p, isTagged: true })),
    ];

    logger.info("Saving posts to database", {
      configId: config.id,
      totalCount: allPosts.length,
    });

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

    logger.info("Posts saved successfully", { configId: config.id });

    return allPosts;
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

    logger.info("Loader started", { shop });

    const config = await prisma.instagramConfig.findFirst({
      where: {
        shop,
        isActive: true,
      },
    });

    logger.info("Config loaded", { shop, hasConfig: !!config });

    let posts = [];
    let errors = [];

    if (config) {
      logger.info("Starting sync for config", {
        shop,
        username: config.username,
      });

      try {
        await fetchInstagramPosts(config);
        logger.info("Sync completed", { shop });
      } catch (error) {
        logger.error("Sync failed", error, {
          configId: config.id,
          username: config.username,
        });
        errors.push({
          username: config.username,
          error: error.message,
        });
      }

      posts = await prisma.instagramPost.findMany({
        where: {
          shop,
          username: config.username,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 100,
      });
    }

    return {
      shop,
      isConfigured: !!config,
      posts,
      username: config?.username || null,
      errors: errors.length > 0 ? errors : null,
    };
  } catch (error) {
    logger.error("Loader error in app._index", error);
    return {
      shop: "unknown",
      isConfigured: false,
      posts: [],
      username: null,
      errors: [{ error: "Échec du chargement des données Instagram" }],
    };
  }
};

export default function Index() {
  const {
    shop,
    isConfigured,
    posts,
    username,
    errors,
  } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Détecter si le loader est en train de charger
  const isLoading = navigation.state === "loading";

  useEffect(() => {
    if (actionData?.redirect) {
      navigate(actionData.redirect, { replace: true });
    }
  }, [actionData, navigate]);

  return (
    <s-page heading={t("app.title")}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {isLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid #e1e3e5",
                borderTop: "4px solid #005bd3",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <p
              style={{
                fontSize: "16px",
                color: "#202223",
                fontWeight: "500",
                margin: 0,
              }}
            >
              Chargement...
            </p>
          </div>
        </div>
      )}

      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        <LanguageSwitcher />
      </div>

      {errors && errors.length > 0 && (
        <s-section variant="critical">
          <s-stack direction="block" gap="tight">
            <s-text variant="headingSm">Erreur de synchronisation</s-text>
            {errors.map((error, index) => (
              <s-text key={index} variant="bodySm">
                {error.error}
              </s-text>
            ))}
          </s-stack>
        </s-section>
      )}

      <AppErrorBoundary>
        {!isConfigured ? (
          <EmptyState shop={shop} />
        ) : (
          <ConfiguredState
            posts={posts}
            username={username}
            shop={shop}
          />
        )}
      </AppErrorBoundary>
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
        try {
          await prisma.instagramConfig.updateMany({
            where: {
              shop,
              isActive: true,
            },
            data: { isActive: false },
          });
        } catch (error) {
          throw new DatabaseError(
            "Erreur lors de la déconnexion du compte",
            error,
          );
        }

        logger.info("Account disconnected", { shop });

        return data({
          success: true,
          message: "Compte Instagram déconnecté avec succès",
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
