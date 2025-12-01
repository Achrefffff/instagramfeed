import { authenticate } from "../shopify.server";
import { logger } from "../utils/logger.server";

export const action = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);

  logger.info("Webhook received", { topic, shop });
  const current = payload.current;

  // Note: Session scope update handled by Shopify automatically
  logger.info("Scopes updated", { shop, newScopes: current });

  return new Response();
};
