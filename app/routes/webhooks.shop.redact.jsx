import { data } from "react-router";
import prisma from "../db.server";
import { sanitizeString } from "../utils/validation.server";
import { logger } from "../utils/logger.server";

export const action = async ({ request }) => {
  const payload = await request.json();
  const { shop_domain, shop_id } = payload;

  if (!shop_domain || typeof shop_domain !== "string") {
    logger.warn("Invalid shop_domain in shop.redact webhook", { shop_domain });
    return json({ error: "Invalid shop_domain" }, { status: 400 });
  }

  const sanitizedShop = sanitizeString(shop_domain);

  logger.info("Shop redaction request received", {
    shop: sanitizedShop,
    shopId: shop_id,
  });

  try {
    // Supprimer toutes les données Instagram du marchand
    // 1. Supprimer les images de carrousels
    await prisma.carouselImage.deleteMany({
      where: {
        post: {
          config: {
            shop: sanitizedShop,
          },
        },
      },
    });

    // 2. Supprimer les posts Instagram
    await prisma.instagramPost.deleteMany({
      where: {
        config: {
          shop: sanitizedShop,
        },
      },
    });

    // 3. Supprimer les configurations Instagram
    await prisma.instagramConfig.deleteMany({
      where: {
        shop: sanitizedShop,
      },
    });

    // 4. Supprimer les sessions Shopify
    await prisma.session.deleteMany({
      where: {
        shop: sanitizedShop,
      },
    });

    logger.info("Shop data successfully redacted", { shop: sanitizedShop });

    return json({ message: "Shop data redacted successfully" }, { status: 200 });
  } catch (error) {
    logger.error("Error redacting shop data", error, { shop: sanitizedShop });
    return json({ error: "Failed to redact shop data" }, { status: 500 });
  }
};
