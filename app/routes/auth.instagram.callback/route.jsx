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

  if (error) {
    const errorDescription = url.searchParams.get("error_description") || "Instagram authorization failed";
    console.error("OAuth error:", error, errorDescription);
    throw redirect(`/app?error=instagram_auth_failed&message=${encodeURIComponent(errorDescription)}`);
  }

  invariant(code, "Missing authorization code parameter");
  invariant(state, "Missing state parameter");

  try {
    const [shop, timestamp] = state.split("-");
    invariant(shop, "Invalid state parameter: missing shop");
    invariant(timestamp, "Invalid state parameter: missing timestamp");
    
    const stateAge = Date.now() - parseInt(timestamp);
    if (stateAge > 5 * 60 * 1000) {
      throw new Response("Authorization request expired. Please try again.", { status: 400 });
    }

    const tokenData = await instagram.exchangeCodeForToken(code);
    const { access_token: accessToken } = tokenData;
    
    if (!accessToken) {
      throw new Response("Failed to obtain access token from Instagram", { status: 500 });
    }

    const pages = await instagram.getInstagramAccounts(accessToken);
    
    if (!Array.isArray(pages) || pages.length === 0) {
      throw new Response("No Facebook pages found. Please connect a Facebook page with an Instagram Business account.", { status: 404 });
    }

    const pageWithInstagram = pages.find(page => 
      page.instagram_business_account && 
      page.name && 
      page.name.trim().length > 0
    );
    
    if (!pageWithInstagram) {
      throw new Response("No Instagram Business account found. Please connect your Instagram account to a Facebook page.", { status: 404 });
    }

    const username = pageWithInstagram.name.trim();
    if (username.length > 255) {
      throw new Response("Instagram username too long", { status: 400 });
    }

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
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
    
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    
    console.error("Instagram OAuth error:", {
      message: error.message,
      stack: error.stack,
      code,
      state,
      timestamp: new Date().toISOString()
    });
    
    throw new Response(
      `Instagram connection failed: ${error.message || 'Unknown error'}`, 
      { status: 500 }
    );
  }
};

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
