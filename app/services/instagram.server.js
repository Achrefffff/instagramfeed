import { logger } from "../utils/logger.server";

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET || !REDIRECT_URI) {
  const error = new Error(
    "Missing required Instagram environment variables: INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI",
  );
  logger.error("Instagram configuration error", error);
  throw error;
}

const FACEBOOK_API_VERSION = "v18.0";
const FACEBOOK_GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;
const OAUTH_SCOPES = [
  "instagram_basic",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
  "instagram_manage_comments",
  "instagram_manage_insights",
].join(",");

class InstagramAPIError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.name = "InstagramAPIError";
    this.statusCode = statusCode;
    this.response = response;
  }
}

// Retry logic avec exponential backoff
async function retryWithBackoff(
  fn,
  maxRetries = 3,
  initialDelayMs = 1000,
  backoffMultiplier = 2,
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Ne pas retry sur erreurs client (4xx) sauf 429 (rate limit)
      if (
        error instanceof InstagramAPIError &&
        error.statusCode >= 400 &&
        error.statusCode < 500 &&
        error.statusCode !== 429 // 429 est une erreur temporaire, devrait retry
      ) {
        throw error;
      }

      // Si c'est la dernière tentative, throw l'erreur
      if (attempt === maxRetries) {
        logger.error(`API call failed after ${maxRetries} retries`, error, {
          attempt,
        });
        throw error;
      }

      // Calculer le délai avec exponential backoff
      const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
      logger.warn(`API call failed, retrying in ${delayMs}ms`, {
        attempt,
        error: error?.message,
      });

      // Attendre avant la prochaine tentative
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

async function fetchWithErrorHandling(url, options = {}) {
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        const error = new InstagramAPIError(
          data.error?.message || "Instagram API request failed",
          response.status,
          data,
        );
        logger.error("Instagram API error", error, {
          url: url.split("?")[0],
          status: response.status,
        });
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof InstagramAPIError) {
        throw error;
      }
      const networkError = new InstagramAPIError(
        `Network error: ${error.message}`,
        500,
        null,
      );
      logger.error("Instagram network error", error, {
        url: url.split("?")[0],
      });
      throw networkError;
    }
  });
}

export const instagram = {
  getAuthUrl(state) {
    if (!state) {
      throw new Error("State parameter is required for OAuth");
    }

    const params = new URLSearchParams({
      client_id: INSTAGRAM_APP_ID,
      redirect_uri: REDIRECT_URI,
      scope: OAUTH_SCOPES,
      response_type: "code",
      state,
    });

    return `https://www.facebook.com/${FACEBOOK_API_VERSION}/dialog/oauth?${params.toString()}`;
  },

  async exchangeCodeForToken(code) {
    if (!code) {
      throw new Error("Authorization code is required");
    }

    const params = new URLSearchParams({
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    });

    const data = await fetchWithErrorHandling(
      `${FACEBOOK_GRAPH_URL}/oauth/access_token?${params.toString()}`,
    );

    if (!data.access_token) {
      throw new InstagramAPIError("No access token in response", 500, data);
    }

    return this.getLongLivedToken(data.access_token);
  },

  async getLongLivedToken(shortLivedToken) {
    if (!shortLivedToken) {
      throw new Error("Short-lived token is required");
    }

    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    });

    return fetchWithErrorHandling(
      `${FACEBOOK_GRAPH_URL}/oauth/access_token?${params.toString()}`,
    );
  },

  // Refresh un token expirant (appelé automatiquement)
  async refreshToken(currentAccessToken) {
    if (!currentAccessToken) {
      throw new Error("Current access token is required");
    }

    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      fb_exchange_token: currentAccessToken,
    });

    try {
      const result = await fetchWithErrorHandling(
        `${FACEBOOK_GRAPH_URL}/oauth/access_token?${params.toString()}`,
      );

      return {
        access_token: result.access_token,
        token_type: result.token_type,
        expires_in: result.expires_in || 5184000, // ~60 jours par défaut
      };
    } catch (error) {
      logger.error("Token refresh failed", error, { action: "refreshToken" });
      throw new InstagramAPIError(
        "Impossible de rafraîchir le token Instagram",
        500,
      );
    }
  },

  // Vérifier si un token va expirer bientôt et le rafraîchir si nécessaire
  async checkAndRefreshTokenIfNeeded(config, prisma) {
    if (!config || !config.tokenExpiresAt) {
      return config; // Pas de date d'expiration, pas de refresh possible
    }

    const now = Date.now();
    const expiresAt = new Date(config.tokenExpiresAt).getTime();
    const timeUntilExpiry = expiresAt - now;
    const REFRESH_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // Refresh 7 jours avant expiration

    if (timeUntilExpiry > REFRESH_THRESHOLD) {
      return config; // Token valide pour plus de 7 jours
    }

    logger.info("Token expiry approaching, attempting refresh", {
      shop: config.shop,
      expiresIn: Math.ceil(timeUntilExpiry / 1000 / 60) + " minutes",
    });

    try {
      const refreshResult = await this.refreshToken(config.accessToken);
      const newExpiryTime = Date.now() + refreshResult.expires_in * 1000;

      const updatedConfig = await prisma.instagramConfig.update({
        where: { id: config.id },
        data: {
          accessToken: refreshResult.access_token,
          tokenExpiresAt: new Date(newExpiryTime),
          lastRefreshedAt: new Date(),
        },
      });

      logger.info("Token refreshed successfully", {
        shop: config.shop,
        newExpiryTime: new Date(newExpiryTime).toISOString(),
      });

      return updatedConfig;
    } catch (error) {
      logger.warn("Token refresh failed, using existing token", {
        shop: config.shop,
        error: error?.message,
      });
      // Retourner config avec flag d'erreur pour notifier l'utilisateur
      return {
        ...config,
        tokenRefreshFailed: true,
        tokenRefreshError:
          "Unable to refresh Instagram token. Please reconnect your account.",
      };
    }
  },

  async getInstagramAccounts(accessToken) {
    if (!accessToken) {
      throw new Error("Access token is required");
    }

    const fields = "id,name,instagram_business_account";
    const url = `${FACEBOOK_GRAPH_URL}/me/accounts?fields=${fields}&access_token=${accessToken}`;

    const data = await fetchWithErrorHandling(url);
    return data.data || [];
  },

  async getInstagramBusinessAccount(pageId, accessToken) {
    if (!pageId || !accessToken) {
      throw new Error("Page ID and access token are required");
    }

    const url = `${FACEBOOK_GRAPH_URL}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`;
    const data = await fetchWithErrorHandling(url);

    return data.instagram_business_account?.id;
  },

  async getInstagramUsername(instagramAccountId, accessToken) {
    if (!instagramAccountId || !accessToken) {
      throw new Error("Instagram account ID and access token are required");
    }

    try {
      const url = `${FACEBOOK_GRAPH_URL}/${instagramAccountId}?fields=username&access_token=${accessToken}`;
      const data = await fetchWithErrorHandling(url);
      return data.username || null;
    } catch (error) {
      return null;
    }
  },

  async getInstagramPosts(instagramAccountId, accessToken, maxPosts = 500) {
    if (!instagramAccountId || !accessToken) {
      throw new Error("Instagram account ID and access token are required");
    }

    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "thumbnail_url",
      "permalink",
      "timestamp",
      "like_count",
      "comments_count",
    ].join(",");

    let allPosts = [];
    let nextUrl = `${FACEBOOK_GRAPH_URL}/${instagramAccountId}/media?fields=${fields}&access_token=${accessToken}`;
    let pageCount = 0;

    try {
      while (nextUrl && allPosts.length < maxPosts) {
        pageCount++;
        logger.info("Fetching Instagram posts page", {
          page: pageCount,
          postsCount: allPosts.length,
        });

        const data = await fetchWithErrorHandling(nextUrl);
        const posts = data.data || [];
        allPosts = [...allPosts, ...posts];

        // Vérifier s'il y a une page suivante
        if (data.paging?.cursors?.after && allPosts.length < maxPosts) {
          // Construire l'URL de la page suivante avec le cursor
          nextUrl = `${FACEBOOK_GRAPH_URL}/${instagramAccountId}/media?fields=${fields}&after=${data.paging.cursors.after}&access_token=${accessToken}`;
        } else {
          nextUrl = null; // Pas de page suivante
        }
      }

      // Limiter au max de posts demandés
      const finalPosts = allPosts.slice(0, maxPosts);

      logger.info("Instagram posts fetched successfully", {
        totalPages: pageCount,
        totalPosts: finalPosts.length,
        maxLimit: maxPosts,
      });

      return finalPosts;
    } catch (error) {
      logger.error("Failed to fetch Instagram posts", error, {
        accountId: instagramAccountId,
        pagesFetched: pageCount,
        postsFetched: allPosts.length,
      });
      throw error;
    }
  },

  async getPostComments(mediaId, accessToken) {
    if (!mediaId || !accessToken) {
      throw new Error("Media ID and access token are required");
    }

    const fields = "id,text,username,timestamp";
    const url = `${FACEBOOK_GRAPH_URL}/${mediaId}/comments?fields=${fields}&access_token=${accessToken}`;
    const data = await fetchWithErrorHandling(url);

    return data.data || [];
  },

  async getPostInsights(mediaId, accessToken) {
    if (!mediaId || !accessToken) {
      throw new Error("Media ID and access token are required");
    }

    const metrics = "reach,saved";
    const url = `${FACEBOOK_GRAPH_URL}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`;

    try {
      const data = await fetchWithErrorHandling(url);

      const insights = {};
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((metric) => {
          insights[metric.name] = metric.values?.[0]?.value || 0;
        });
      }

      return {
        impressions: null,
        reach: insights.reach || 0,
        saved: insights.saved || 0,
      };
    } catch (error) {
      return {
        impressions: null,
        reach: null,
        saved: null,
      };
    }
  },

  async getTaggedPosts(instagramAccountId, accessToken) {
    if (!instagramAccountId || !accessToken) {
      throw new Error("Instagram account ID and access token are required");
    }

    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "permalink",
      "timestamp",
      "like_count",
      "comments_count",
      "username",
    ].join(",");

    const url = `${FACEBOOK_GRAPH_URL}/${instagramAccountId}/tags?fields=${fields}&access_token=${accessToken}`;

    try {
      const data = await fetchWithErrorHandling(url);
      return data.data || [];
    } catch (error) {
      return [];
    }
  },

  async getMediaOwnerUsername(mediaId, accessToken) {
    if (!mediaId || !accessToken) {
      throw new Error("Media ID and access token are required");
    }

    try {
      const url = `${FACEBOOK_GRAPH_URL}/${mediaId}?fields=username&access_token=${accessToken}`;
      const data = await fetchWithErrorHandling(url);
      return data.username || null;
    } catch (error) {
      return null;
    }
  },

  extractHashtags(caption) {
    if (!caption) {
      return null;
    }

    const hashtagRegex = /#[\wÀ-ſ]+/g;
    const hashtags = caption.match(hashtagRegex);

    return hashtags ? hashtags.join(",") : null;
  },

  async getCarouselChildren(mediaId, accessToken) {
    if (!mediaId || !accessToken) {
      throw new Error("Media ID and access token are required");
    }

    try {
      const fields = "id,media_type,media_url";
      const url = `${FACEBOOK_GRAPH_URL}/${mediaId}/children?fields=${fields}&access_token=${accessToken}`;
      const data = await fetchWithErrorHandling(url);
      return data.data || [];
    } catch (error) {
      return [];
    }
  },
};

export { InstagramAPIError };
