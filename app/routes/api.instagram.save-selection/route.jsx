import { data } from "react-router";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { saveSelectionSchema, validateData } from "../../utils/validation.server";
import { handleError, ValidationError, DatabaseError } from "../../utils/errors.server";
import { logger } from "../../utils/logger.server";
import { checkRateLimit, RATE_LIMITS } from "../../utils/rateLimit.server";

export const action = async ({ request }) => {
  const startTime = Date.now();
  try {
    const { admin, session } = await authenticate.admin(request);
    const { shop } = session;

    // Rate limiting: 20 sauvegardes par 5 minutes
    const rateLimit = checkRateLimit(
      `save:${shop}`,
      RATE_LIMITS.SAVE.max,
      RATE_LIMITS.SAVE.window
    );

    if (!rateLimit.allowed) {
      logger.warn("Rate limit exceeded for save selection", { shop });
      return data(
        { error: "Trop de sauvegardes, veuillez patienter quelques minutes" },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();
    
    const validation = validateData(saveSelectionSchema, body);
    if (!validation.success) {
      throw new ValidationError(validation.errors[0].message, validation.errors);
    }

    const { selectedPostIds } = validation.data;

    let posts;
    try {
      posts = await prisma.instagramPost.findMany({
        where: {
          shop,
          id: { in: selectedPostIds },
        },
        select: {
          id: true,
          username: true,
          ownerUsername: true,
          isTagged: true,
          mediaUrl: true,
          thumbnailUrl: true,
          mediaType: true,
          carouselImages: true,
          permalink: true,
          caption: true,
          likeCount: true,
          commentsCount: true,
          hashtags: true,
        },
      });
    } catch (error) {
      throw new DatabaseError("Erreur lors de la récupération des posts", error);
    }

    if (posts.length === 0) {
      logger.warn("No posts found for selection", { shop, selectedPostIds });
      return data({ error: "Aucun post trouvé" }, { status: 404 });
    }

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

    await admin.graphql(
      `#graphql
      mutation CreateMetafieldDefinition {
        metafieldDefinitionCreate(definition: {
          name: "Posts Instagram sélectionnés"
          namespace: "custom"
          key: "instagram_selected_posts"
          type: "json"
          ownerType: SHOP
          description: "Posts Instagram sélectionnés pour affichage sur le site"
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

    const metafieldValue = JSON.stringify({ posts });

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
              namespace: "custom",
              key: "instagram_selected_posts",
              type: "json",
              value: metafieldValue,
              ownerId: shopId,
            },
          ],
        },
      }
    );

    const result = await response.json();

    if (result.data?.metafieldsSet?.userErrors?.length > 0) {
      logger.error("GraphQL metafield error", null, {
        shop,
        errors: result.data.metafieldsSet.userErrors,
      });
      return data(
        { error: result.data.metafieldsSet.userErrors[0].message },
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info("Posts selection saved successfully", {
      shop,
      postsCount: posts.length,
      duration,
    });

    return data({ success: true, postsCount: posts.length });
  } catch (error) {
    return handleError(error, { shop: "unknown", action: "save-selection" });
  }
};
