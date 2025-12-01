import { redirect, data } from "react-router";
import { instagram } from "../../services/instagram.server";
import { instagramConnectSchema, validateData } from "../../utils/validation.server";
import { handleError, ValidationError } from "../../utils/errors.server";
import { logger } from "../../utils/logger.server";
import { checkRateLimit, RATE_LIMITS } from "../../utils/rateLimit.server";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    
    const validation = validateData(instagramConnectSchema, { shop });
    if (!validation.success) {
      throw new ValidationError(validation.errors[0].message, validation.errors);
    }

    // Rate limiting: 10 tentatives par heure
    const rateLimit = checkRateLimit(
      `connect:${shop}`,
      RATE_LIMITS.CONNECT.max,
      RATE_LIMITS.CONNECT.window
    );

    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded for Instagram connect", { shop });
      return data(
        { error: "Trop de tentatives de connexion, réessayez dans 1 heure" },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    
    const state = `${shop}-${Date.now()}`;
    const authUrl = instagram.getAuthUrl(state);
    
    console.log("🔗 URL OAuth générée:", authUrl);
    logger.info("Instagram OAuth initiated", { shop });
    
    throw redirect(authUrl);
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    return handleError(error, { action: "instagram-connect" });
  }
};
