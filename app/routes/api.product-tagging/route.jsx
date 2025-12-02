import { data } from "react-router";
import { authenticate } from "../../shopify.server";
import { productTagging } from "../../services/productTagging.server";
import { handleError, ValidationError } from "../../utils/errors.server";
import { logger } from "../../utils/logger.server";

export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const { shop } = session;

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

        await productTagging.tagProductsToPost(
          admin, 
          shop, 
          postId, 
          productIds
        );

        const taggedProductsWithDetails = await productTagging.getTaggedProductsWithDetails(admin, shop);
        const postProducts = taggedProductsWithDetails[postId] || [];

        return data({ 
          success: true, 
          taggedProducts: postProducts,
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

      case "clear": {
        await productTagging.clearProductsFromPost(admin, shop, postId);

        return data({ 
          success: true, 
          message: "Produits désétiquetés avec succès"
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
      const products = await productTagging.getShopProducts(admin, { first: 100 });
      return data({ 
        success: true, 
        products: products.edges.map(edge => edge.node)
      });
    }

    if (action === "tagged") {
      const taggedProducts = await productTagging.getTaggedProductsWithDetails(admin, shop);
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