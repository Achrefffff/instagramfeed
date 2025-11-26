import { data } from "react-router";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";

export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const { shop } = session;

    const { selectedPostIds } = await request.json();

    if (!selectedPostIds || selectedPostIds.length === 0) {
      return data({ error: "Aucun post sélectionné" }, { status: 400 });
    }

    const posts = await prisma.instagramPost.findMany({
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

    if (posts.length === 0) {
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
      return data(
        { error: result.data.metafieldsSet.userErrors[0].message },
        { status: 400 }
      );
    }

    return data({ success: true, postsCount: posts.length });
  } catch (error) {
    return data({ error: error.message || "Erreur inconnue" }, { status: 500 });
  }
};
