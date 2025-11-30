import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { logger } from "../utils/logger.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  logger.info("App uninstalled webhook received", { shop, topic });

  try {
    // Supprimer toutes les données du marchand
    // 1. Supprimer les posts Instagram
    await prisma.instagramPost.deleteMany({
      where: { shop },
    });

    // 2. Supprimer les configurations Instagram
    await prisma.instagramConfig.deleteMany({
      where: { shop },
    });

    // 3. Supprimer les sessions Shopify
    if (session) {
      await prisma.session.deleteMany({ where: { shop } });
    }

    logger.info("App data cleaned successfully on uninstall", { shop });
  } catch (error) {
    logger.error("Error cleaning data on uninstall", error, { shop });
  }

  return new Response();
};
