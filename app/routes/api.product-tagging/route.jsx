import { data } from "react-router";
import { authenticate } from "../../shopify.server";
import { productTagging } from "../../services/productTagging.server";
import { handleError, ValidationError } from "../../utils/errors.server";
import { logger } from "../../utils/logger.server";
import { checkRateLimit, RATE_LIMITS } from "../../utils/rateLimit.server";

export const action = async ({ request }) => {
  const startTime = Date.now();
  try {
    const { admin, session } = await authenticate.admin(request);
    const { shop } = session;

    // Rate limiting: 30 actions par 5 minutes
    const rateLimit = checkRateLimit(
      `product-tag:${shop}`,
      30,
      5 * 60 * 1000
    );

    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded for product tagging", { shop });
      return data(
        { error: "Trop d'actions, veuillez patienter quelques minutes" },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { action: actionType, postId, productIds } = body;

    if (!actionType || !postId) {
      throw new ValidationError("Action et postId requis");
    }

    switch (actionType) {
      case "tag": {
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
          throw new ValidationError("productIds requis pour l'étiquetage");
        }

        const taggedProducts = await productTagging.tagProductsToPost(
          admin, 
          shop, 
          postId, 
          productIds
        );

        const duration = Date.now() - startTime;
        logger.info("Products tagged successfully", {
          shop,
          postId,
          productCount: productIds.length,
          duration,
        });

        return data({ 
          success: true, 
          taggedProducts,
          message: `${productIds.length} produit(s) étiquetés avec succès`
        });
      }

      case "untag": {
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
          throw new ValidationError("productIds requis pour le désétiquetage");
        }

        const taggedProducts = await productTagging.untagProductsFromPost(
          admin, 
          shop, 
          postId, 
          productIds
        );

        const duration = Date.now() - startTime;
        logger.info("Products untagged successfully", {
          shop,
          postId,
          productCount: productIds.length,
          duration,
        });

        return data({ 
          success: true, 
          taggedProducts,
          message: `${productIds.length} produit(s) désétiquetés avec succès`
        });
      }

      case "get": {
        const allTaggedProducts = await productTagging.getTaggedProducts(admin, shop);
        const postProducts = allTaggedProducts[postId] || [];

        return data({ 
          success: true, 
          taggedProducts: postProducts
        });
      }

      default:
        throw new ValidationError(`Action non reconnue: ${actionType}`);
    }
  } catch (error) {
    return handleError(error, { shop: "unknown", action: "product-tagging" });
  }
};

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const { shop } = session;

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "products") {
      // Récupérer les produits de la boutique
      const products = await productTagging.getShopProducts(admin, { first: 100 });
      return data({ 
        success: true, 
        products: products.edges.map(edge => edge.node)
      });
    }

    if (action === "tagged") {
      // Récupérer tous les produits étiquetés
      const taggedProducts = await productTagging.getTaggedProducts(admin, shop);
      return data({ 
        success: true, 
        taggedProducts
      });
    }

    return data({ error: "Action non spécifiée" }, { status: 400 });
  } catch (error) {
    return handleError(error, { shop: "unknown", action: "product-tagging-loader" });
  }
};