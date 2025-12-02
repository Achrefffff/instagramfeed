import { productTagging } from "../../services/productTagging.server.js";
import { authenticate } from "../../shopify.server.js";

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    
    if (!shop) {
      return new Response(JSON.stringify({ error: "Shop parameter required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
    }

    // Authentification simple pour le thème
    const { admin } = await authenticate.public.appProxy(request);
    
    // Récupérer les données de tagging avec détails complets
    const taggedProducts = await productTagging.getTaggedProductsWithDetails(admin, shop);
    
    return new Response(JSON.stringify(taggedProducts), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Theme API error:", error);
    return new Response(JSON.stringify({ error: "Failed to load product tags" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function options() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}