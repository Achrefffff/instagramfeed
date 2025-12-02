import { logger } from "../utils/logger.server.js";

const METAFIELD_NAMESPACE = "custom";
const METAFIELD_KEY = "instagram_tagged_products";
const METAFIELD_KEY_DETAILS = "instagram_product_tags"; // Pour le thème

/**
 * Service de tagging de produits Shopify aux posts Instagram
 *
 * Optimisations implémentées :
 * 1. Batch querying avec nodes() pour éviter N+1 queries
 * 2. Gestion d'erreurs améliorée avec tracking des IDs manquants
 * 3. Logging détaillé pour la production
 * 4. Validation stricte des IDs GraphQL
 *
 * API Shopify documentée :
 * - GraphQL Admin API v2025-10
 * - Metafields API (JSON type)
 * - Nodes() query pour batch fetch
 */
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
            key: METAFIELD_KEY,
          },
        },
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
        }`,
      );

      // Récupérer l'ID du shop
      const shopResponse = await admin.graphql(
        `#graphql
        query {
          shop {
            id
          }
        }`,
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
        },
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

      // Nettoyer et filtrer les IDs pour ne garder que les strings valides
      const cleanProductIds = productIds
        .filter(
          (id) =>
            typeof id === "string" && id.includes("gid://shopify/Product/"),
        )
        .map((id) => String(id));

      // Sauvegarder seulement les IDs (comme avant)
      currentTags[postId] = cleanProductIds;

      await this.saveTaggedProducts(admin, shop, currentTags);

      // Sauvegarder aussi les détails pour le thème
      await this.saveProductDetailsForTheme(admin, shop);

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
        (id) => !productIds.includes(id),
      );

      // Si plus de produits, supprimer le post complètement
      if (currentTags[postId].length === 0) {
        delete currentTags[postId];
      }

      await this.saveTaggedProducts(admin, shop, currentTags);
      return currentTags[postId] || [];
    } catch (error) {
      logger.error("Failed to untag products from post", error, {
        shop,
        postId,
      });
      throw error;
    }
  },

  /**
   * Efface tous les produits d'un post
   */
  async clearProductsFromPost(admin, shop, postId) {
    try {
      const currentTags = await this.getTaggedProducts(admin, shop);

      if (currentTags[postId]) {
        delete currentTags[postId];
        await this.saveTaggedProducts(admin, shop, currentTags);

        // Mettre à jour aussi les détails pour le thème
        await this.saveProductDetailsForTheme(admin, shop);
      }

      return true;
    } catch (error) {
      logger.error("Failed to clear products from post", error, {
        shop,
        postId,
      });
      throw error;
    }
  },

  /**
   * Récupère les produits étiquetés avec leurs détails complets
   * Retourne aussi les warnings si certains produits n'ont pas pu être récupérés
   */
  async getTaggedProductsWithDetails(admin, shop) {
    try {
      const taggedProductIds = await this.getTaggedProducts(admin, shop);
      const result = {};
      const warnings = {};

      // Pour chaque post, récupérer les détails des produits
      for (const [postId, productIds] of Object.entries(taggedProductIds)) {
        if (productIds && productIds.length > 0) {
          const productDetails = await this.getProductsByIds(admin, productIds);
          result[postId] = productDetails;

          // Tracker si certains produits n'ont pas pu être récupérés
          if (productDetails.length < productIds.length) {
            warnings[postId] = {
              message: `${productIds.length - productDetails.length} produit(s) non trouvé(s)`,
              requestedCount: productIds.length,
              foundCount: productDetails.length,
            };
          }
        }
      }

      // Logger les avertissements
      if (Object.keys(warnings).length > 0) {
        logger.warn("Some tagged products could not be retrieved", {
          shop,
          warnings,
          totalPosts: Object.keys(result).length,
          postsWithWarnings: Object.keys(warnings).length,
        });
      }

      return result;
    } catch (error) {
      logger.error("Failed to get tagged products with details", error, {
        shop,
      });
      return {};
    }
  },

  /**
   * Récupère les détails des produits par leurs IDs
   * Utilise batch querying pour éviter les N+1 queries
   * Max 10 produits par batch pour rester sous la limite de coût GraphQL
   */
  async getProductsByIds(admin, productIds) {
    try {
      if (!productIds || productIds.length === 0) {
        return [];
      }

      // Filtrer et valider les IDs
      const validIds = productIds.filter(
        (id) => typeof id === "string" && id.includes("gid://shopify/Product/"),
      );

      if (validIds.length === 0) {
        return [];
      }

      const products = [];
      const failedIds = [];
      const BATCH_SIZE = 10; // Respecter la limite de coût Shopify

      // Traiter les produits par batch
      for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
        const batch = validIds.slice(i, i + BATCH_SIZE);

        try {
          // Utiliser nodes() pour récupérer plusieurs produits en une seule requête
          const response = await admin.graphql(
            `#graphql
            query getProductsBatch($ids: [ID!]!) {
              nodes(ids: $ids) {
                ... on Product {
                  id
                  title
                  handle
                  status
                  featuredMedia {
                    ... on MediaImage {
                      image {
                        url
                        altText
                      }
                    }
                  }
                  priceRangeV2 {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }`,
            {
              variables: { ids: batch },
            },
          );

          const data = await response.json();

          if (data.errors && data.errors.length > 0) {
            logger.warn("GraphQL error fetching batch of products", {
              error: data.errors[0].message,
              batchSize: batch.length,
              attempt: Math.ceil((i + 1) / BATCH_SIZE),
            });
            // Ajouter les IDs du batch aux failures
            batch.forEach((id) => failedIds.push(id));
            continue;
          }

          // Traiter les résultats (null pour les produits non trouvés)
          if (data.data?.nodes) {
            data.data.nodes.forEach((product, index) => {
              if (product) {
                products.push({
                  id: product.id,
                  title: product.title,
                  handle: product.handle,
                  price: product.priceRangeV2?.minVariantPrice?.amount || "0",
                  currency:
                    product.priceRangeV2?.minVariantPrice?.currencyCode ||
                    "EUR",
                  image: product.featuredMedia?.image?.url || null,
                });
              } else {
                // Produit non trouvé (null retourné par Shopify)
                failedIds.push(batch[index]);
              }
            });
          }
        } catch (error) {
          logger.error("Failed to fetch batch of products", error, {
            batchSize: batch.length,
            attempt: Math.ceil((i + 1) / BATCH_SIZE),
          });
          // Ajouter les IDs du batch aux failures
          batch.forEach((id) => failedIds.push(id));
        }
      }

      // Logger un avertissement si certains produits n'ont pas pu être récupérés
      if (failedIds.length > 0) {
        logger.warn("Some products could not be fetched", {
          failedCount: failedIds.length,
          totalRequested: validIds.length,
          successCount: products.length,
        });
      }

      return products;
    } catch (error) {
      logger.error("Failed to get products by IDs", error);
      return [];
    }
  },

  /**
   * Sauvegarde les détails des produits pour le thème
   * Utilise la méthode batch optimisée pour récupérer les produits
   */
  async saveProductDetailsForTheme(admin, shop) {
    try {
      const taggedProductIds = await this.getTaggedProducts(admin, shop);
      const productDetailsForTheme = {};

      // Pour chaque post, récupérer les détails des produits
      for (const [postId, productIds] of Object.entries(taggedProductIds)) {
        if (productIds && productIds.length > 0) {
          // Filtrer pour ne garder que les IDs valides (strings)
          const validIds = productIds.filter(
            (id) =>
              typeof id === "string" && id.includes("gid://shopify/Product/"),
          );

          if (validIds.length > 0) {
            // Utiliser la méthode batch optimisée
            const productDetails = await this.getProductsByIds(admin, validIds);
            productDetailsForTheme[postId] = productDetails;
          }
        }
      }

      // Récupérer l'ID du shop
      const shopResponse = await admin.graphql(
        `#graphql
        query {
          shop {
            id
          }
        }`,
      );

      const shopData = await shopResponse.json();

      if (shopData.errors && shopData.errors.length > 0) {
        logger.error("Failed to get shop ID", {
          error: shopData.errors[0].message,
          shop,
        });
        return null;
      }

      const shopId = shopData.data?.shop?.id;

      if (!shopId) {
        logger.error("Shop ID not returned from API", { shop });
        return null;
      }

      // Sauvegarder dans un metafield séparé
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
                key: METAFIELD_KEY_DETAILS,
                type: "json",
                value: JSON.stringify(productDetailsForTheme),
                ownerId: shopId,
              },
            ],
          },
        },
      );

      const data = await response.json();

      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        logger.error("Metafield save returned errors", {
          errors: data.data.metafieldsSet.userErrors,
          shop,
        });
        return null;
      }

      logger.info("Product details saved to metafield for theme", {
        shop,
        totalPosts: Object.keys(productDetailsForTheme).length,
        totalProducts: Object.values(productDetailsForTheme).reduce(
          (sum, posts) => sum + posts.length,
          0,
        ),
      });

      return data.data?.metafieldsSet?.metafields[0];
    } catch (error) {
      logger.error("Failed to save product details for theme", error, { shop });
      // Ne pas faire échouer le processus principal - retourner null au lieu de thrower
      return null;
    }
  },

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
                featuredMedia {
                  ... on MediaImage {
                    image {
                      url
                      altText
                    }
                  }
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
        },
      );

      const data = await response.json();
      return data.data?.products || { edges: [], pageInfo: {} };
    } catch (error) {
      logger.error("Failed to fetch shop products", error);
      throw error;
    }
  },
};
