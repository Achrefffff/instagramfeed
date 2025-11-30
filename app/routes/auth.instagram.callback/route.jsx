import { redirect, data } from "react-router";
import { instagram } from "../../services/instagram.server";
import prisma from "../../db.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  instagramCallbackSchema,
  validateData,
  sanitizeString,
} from "../../utils/validation.server";
import {
  handleError,
  ValidationError,
  InstagramAPIError,
  DatabaseError,
} from "../../utils/errors.server";
import { logger } from "../../utils/logger.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  const params = {
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    error: url.searchParams.get("error"),
    error_description: url.searchParams.get("error_description"),
  };

  logger.info("Instagram callback received", null, {
    params,
    url: request.url,
  });

  if (params.error) {
    const errorDescription = sanitizeString(
      params.error_description || "Instagram authorization failed",
    );
    logger.error("Instagram OAuth error", null, {
      error: params.error,
      description: errorDescription,
    });
    throw redirect(
      `/app?error=instagram_auth_failed&message=${encodeURIComponent(errorDescription)}`,
    );
  }

  const validation = validateData(instagramCallbackSchema, params);
  logger.info("Validation result", null, {
    success: validation.success,
    errors: validation.errors,
    data: validation.data,
  });

  if (!validation.success) {
    throw new ValidationError(validation.errors[0].message, validation.errors);
  }

  const { code, state } = validation.data;

  try {
    const [shop, timestamp] = state.split("-");
    if (!shop || !timestamp) {
      throw new Response("Invalid state parameter", { status: 400 });
    }

    const stateAge = Date.now() - parseInt(timestamp);
    if (stateAge > 5 * 60 * 1000) {
      throw new Response("Authorization request expired. Please try again.", {
        status: 400,
      });
    }

    let tokenData;
    try {
      tokenData = await instagram.exchangeCodeForToken(code);
    } catch (error) {
      throw new InstagramAPIError(
        "Échec de l'échange du code d'autorisation",
        500,
      );
    }

    const { access_token: accessToken } = tokenData;

    if (!accessToken) {
      throw new InstagramAPIError("Token d'accès Instagram non reçu", 500);
    }

    let pages;
    try {
      pages = await instagram.getInstagramAccounts(accessToken);
    } catch (error) {
      throw new InstagramAPIError(
        "Impossible de récupérer les pages Facebook",
        500,
      );
    }

    if (!Array.isArray(pages) || pages.length === 0) {
      logger.warn("No Facebook pages found", { shop });
      throw new InstagramAPIError(
        "Aucune page Facebook trouvée. Connectez une page avec un compte Instagram Business.",
        404,
      );
    }

    const pageWithInstagram = pages.find(
      (page) =>
        page.instagram_business_account &&
        page.name &&
        page.name.trim().length > 0,
    );

    if (!pageWithInstagram) {
      logger.warn("No Instagram Business account found", {
        shop,
        pagesCount: pages.length,
      });
      throw new InstagramAPIError(
        "Aucun compte Instagram Business trouvé. Connectez votre Instagram à une page Facebook.",
        404,
      );
    }

    const instagramAccountId = pageWithInstagram.instagram_business_account.id;
    let username;
    try {
      username = await instagram.getInstagramUsername(
        instagramAccountId,
        accessToken,
      );
    } catch (error) {
      throw new InstagramAPIError(
        "Impossible de récupérer le nom d'utilisateur Instagram",
        500,
      );
    }

    if (!username || typeof username !== "string") {
      throw new InstagramAPIError("Nom d'utilisateur Instagram invalide", 500);
    }

    const sanitizedUsername = sanitizeString(username);
    if (sanitizedUsername.length > 255) {
      throw new Response("Instagram username too long", { status: 400 });
    }

    logger.info("Saving Instagram configuration", {
      shop,
      username: sanitizedUsername,
    });

    // Calculer la date d'expiration du token (~60 jours)
    const expiresIn = tokenData.expires_in || 5184000; // Par défaut ~60 jours
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    try {
      const result = await prisma.instagramConfig.upsert({
        where: {
          shop_username: {
            shop,
            username: sanitizedUsername,
          },
        },
        update: {
          accessToken,
          isActive: true,
          tokenExpiresAt,
          lastRefreshedAt: new Date(),
        },
        create: {
          shop,
          accessToken,
          username: sanitizedUsername,
          isActive: true,
          tokenExpiresAt,
          lastRefreshedAt: new Date(),
        },
      });
      logger.info("Instagram configuration saved successfully", {
        shop,
        username: sanitizedUsername,
        configId: result.id,
        tokenExpiresAt: tokenExpiresAt.toISOString(),
      });
    } catch (prismaError) {
      throw new DatabaseError(
        "Échec de la sauvegarde de la configuration Instagram",
        prismaError,
      );
    }

    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Connexion réussie</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f6f6f7; }
            .container { text-align: center; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            h1 { color: #008060; margin: 0 0 16px 0; }
            p { color: #202223; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Connexion réussie !</h1>
            <p>Votre compte Instagram a été connecté avec succès.</p>
            <p style="margin-top: 8px; color: #6d7175; font-size: 14px;">Cette fenêtre va se fermer automatiquement...</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    return handleError(error, {
      action: "instagram-callback",
      code: code?.substring(0, 10),
      state: state?.substring(0, 20),
    });
  }
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
