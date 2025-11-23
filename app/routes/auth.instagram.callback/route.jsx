import { redirect, data } from "react-router";
import { instagram } from "../../services/instagram.server";
import prisma from "../../db.server";
import invariant from "tiny-invariant";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Gérer les erreurs d'autorisation OAuth
  if (error) {
    const errorDescription = url.searchParams.get("error_description") || "Instagram authorization failed";
    console.error("OAuth error:", error, errorDescription);
    throw redirect(`/app?error=instagram_auth_failed&message=${encodeURIComponent(errorDescription)}`);
  }

  // Validation stricte des paramètres
  invariant(code, "Missing authorization code parameter");
  invariant(state, "Missing state parameter");

  try {
    // Extraire et valider le shop du state
    const [shop, timestamp] = state.split("-");
    invariant(shop, "Invalid state parameter: missing shop");
    invariant(timestamp, "Invalid state parameter: missing timestamp");
    
    // Vérifier que le timestamp n'est pas trop ancien (5 minutes max)
    const stateAge = Date.now() - parseInt(timestamp);
    if (stateAge > 5 * 60 * 1000) {
      throw new Response("Authorization request expired. Please try again.", { status: 400 });
    }

    // Échanger le code contre un access token
    const tokenData = await instagram.exchangeCodeForToken(code);
    const { access_token: accessToken } = tokenData;
    
    if (!accessToken) {
      throw new Response("Failed to obtain access token from Instagram", { status: 500 });
    }

    // Récupérer les pages Facebook liées
    const pages = await instagram.getInstagramAccounts(accessToken);
    
    if (!Array.isArray(pages) || pages.length === 0) {
      throw new Response("No Facebook pages found. Please connect a Facebook page with an Instagram Business account.", { status: 404 });
    }

    // Trouver une page avec un compte Instagram Business
    const pageWithInstagram = pages.find(page => 
      page.instagram_business_account && 
      page.name && 
      page.name.trim().length > 0
    );
    
    if (!pageWithInstagram) {
      throw new Response("No Instagram Business account found. Please connect your Instagram account to a Facebook page.", { status: 404 });
    }

    // Validation des données avant sauvegarde
    const username = pageWithInstagram.name.trim();
    if (username.length > 255) {
      throw new Response("Instagram username too long", { status: 400 });
    }

    // Sauvegarder la configuration avec gestion d'erreur Prisma
    console.log("Attempting to save:", { shop, username, accessToken: accessToken ? 'present' : 'missing' });
    
    try {
      const result = await prisma.instagramConfig.upsert({
        where: { 
          shop_username: {
            shop,
            username
          }
        },
        update: {
          accessToken,
          isActive: true,
        },
        create: {
          shop,
          accessToken,
          username,
          isActive: true,
        },
      });
      console.log("Save successful:", result.id);
    } catch (prismaError) {
      console.error("Database error details:", {
        message: prismaError.message,
        code: prismaError.code,
        meta: prismaError.meta,
        stack: prismaError.stack
      });
      throw new Response(`Failed to save Instagram configuration: ${prismaError.message}`, { status: 500 });
    }

    // Redirection vers la page de succès
    throw redirect("/auth/instagram/success");
    
  } catch (error) {
    // Gestion des redirections et réponses HTTP
    if (error instanceof Response) {
      throw error;
    }
    
    // Log détaillé pour le debugging
    console.error("Instagram OAuth error:", {
      message: error.message,
      stack: error.stack,
      code,
      state,
      timestamp: new Date().toISOString()
    });
    
    // Réponse d'erreur générique
    throw new Response(
      `Instagram connection failed: ${error.message || 'Unknown error'}`, 
      { status: 500 }
    );
  }
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
