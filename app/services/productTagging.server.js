import { logger } from "../utils/logger.server.js";

const METAFIELD_NAMESPACE = "custom";
const METAFIELD_KEY = "instagram_tagged_products";

export const productTagging = {
  /**
   * Récupère les produits étiquetés pour un shop
   */
  async getTaggedProducts(admin, shop) {
    try {
      const response = await admin.graphql(
        `#graphql
        query getShopMetafield($namespace: String!, $key: String!) {
          shop {
            metafield(namespace: $namespace, key: $key) {
              id
              value
            }
          }
        }`,
        {
          variables: { 
            namespace: METAFIELD_NAMESPACE, 
            key: METAFIELD_KEY 
          },
        }
      );

      const data = await response.json();
      const metafield = data.data?.shop?.metafield;
      
      if (!metafield?.value) {
        return {};
      }

      return JSON.parse(metafield.value);
    } catch (error) {
      logger.error("Failed to get tagged products", error, { shop });
      return {};
    }
  },

  /**
   * Sauvegarde les produits étiquetés dans les métafields
   */
  async saveTaggedProducts(admin, shop, taggedProducts) {
    try {
      // D'abord créer la définition si elle n'existe pas
      await admin.graphql(
        `#graphql
        mutation CreateMetafieldDefinition {
          metafieldDefinitionCreate(definition: {
            name: "Produits étiquetés Instagram"
            namespace: "custom"
            key: "instagram_tagged_products"
            type: "json"
            ownerType: SHOP
            description: "Association entre posts Instagram et produits de la boutique"
          }) {
            createdDefinition {
              id
            }
            userErrors {
              field
              message
            }
          }
        }`
      );

      // Récupérer l'ID du shop
      const shopResponse = await admin.graphql(
        `#graphql
        query {
          shop {
            id
          }
        }`
      );

      const shopData = await shopResponse.json();
      const shopId = shopData.data.shop.id;

      // Sauvegarder les données
      const response = await admin.graphql(
        `#graphql
        mutation CreateMetafield($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            metafields: [
              {
                namespace: METAFIELD_NAMESPACE,
                key: METAFIELD_KEY,
                type: "json",
                value: JSON.stringify(taggedProducts),
                ownerId: shopId,
              },
            ],
          },
        }
      );

      const data = await response.json();
      
      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        throw new Error(data.data.metafieldsSet.userErrors[0].message);
      }

      return data.data?.metafieldsSet?.metafields[0];
    } catch (error) {
      logger.error("Failed to save tagged products", error, { shop });
      throw error;
    }
  },

  /**
   * Ajoute des produits à un post
   */
  async tagProductsToPost(admin, shop, postId, productIds) {
    try {
      const currentTags = await this.getTaggedProducts(admin, shop);
      
      // Ajouter les nouveaux produits au post
      if (!currentTags[postId]) {
        currentTags[postId] = [];
      }
      
      // Éviter les doublons
      const existingIds = new Set(currentTags[postId]);
      const newIds = productIds.filter(id => !existingIds.has(id));
      
      if (newIds.length > 0) {
        currentTags[postId] = [...currentTags[postId], ...newIds];
        await this.saveTaggedProducts(admin, shop, currentTags);
      }

      return currentTags[postId];
    } catch (error) {
      logger.error("Failed to tag products to post", error, { shop, postId });
      throw error;
    }
  },

  /**
   * Supprime des produits d'un post
   */
  async untagProductsFromPost(admin, shop, postId, productIds) {
    try {
      const currentTags = await this.getTaggedProducts(admin, shop);
      
      if (!currentTags[postId]) {
        return [];
      }
      
      // Supprimer les produits spécifiés
      currentTags[postId] = currentTags[postId].filter(
        id => !productIds.includes(id)
      );
      
      // Si plus de produits, supprimer le post complètement
      if (currentTags[postId].length === 0) {
        delete currentTags[postId];
      }
      
      await this.saveTaggedProducts(admin, shop, currentTags);
      return currentTags[postId] || [];
    } catch (error) {
      logger.error("Failed to untag products from post", error, { shop, postId });
      throw error;
    }
  },

  /**
   * Récupère les produits de la boutique
   */
  /**
   * Récupère les produits de la boutique
   */
  async getShopProducts(admin, { first = 50, query = "", after = null } = {}) {
    try {
      const response = await admin.graphql(
        `#graphql
        query getProducts($first: Int!, $query: String, $after: String) {
          products(first: $first, query: $query, after: $after) {
            edges {
              cursor
              node {
                id
                title
                handle
                status
                featuredImage {
                  url
                  altText
                }
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }`,
        {
          variables: { first, query, after },
        }
      );

      const data = await response.json();
      return data.data?.products || { edges: [], pageInfo: {} };
    } catch (error) {
      logger.error("Failed to fetch shop products", error);
      throw error;
    }
  },
};