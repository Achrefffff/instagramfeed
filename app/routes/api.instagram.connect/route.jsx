import { redirect } from "react-router";
import { instagram } from "../../services/instagram.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (!shop) {
    throw new Response("Missing shop parameter", { status: 400 });
  }
  
  const state = `${shop}-${Date.now()}`;
  const authUrl = instagram.getAuthUrl(state);
  
  throw redirect(authUrl);
};
