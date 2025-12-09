import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { logger } from "../utils/logger.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  logger.info("App uninstalled webhook received", { shop, topic });

  try {
    // Supprimer toutes les données du marchand
    // CASCADE delete sur InstagramConfig supprimera automatiquement les posts
    await prisma.instagramConfig.deleteMany({
      where: { shop },
    });

    // Supprimer les sessions Shopify
    if (session) {
      await prisma.session.deleteMany({ where: { shop } });
    }

    logger.info("App data cleaned successfully on uninstall", { shop });
  } catch (error) {
    logger.error("Error cleaning data on uninstall", error, { shop });
  }

  return new Response();
};
