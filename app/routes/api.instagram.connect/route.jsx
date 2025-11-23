import { redirect } from "react-router";
import { instagram } from "../../services/instagram.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (!shop) {
    throw new Response("Missing shop parameter", { status: 400 });
  }
  
  // Générer un state unique pour la sécurité OAuth
  const state = `${shop}-${Date.now()}`;
  
  // Générer l'URL d'autorisation Instagram
  const authUrl = instagram.getAuthUrl(state);
  
  // Rediriger vers Instagram pour l'autorisation
  throw redirect(authUrl);
};
