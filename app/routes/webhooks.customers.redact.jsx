import { json } from "react-router";
import { sanitizeString } from "../utils/validation.server";
import { logger } from "../utils/logger.server";

export const action = async ({ request }) => {
  const payload = await request.json();
  const { shop_domain, customer } = payload;

  if (!shop_domain || typeof shop_domain !== "string") {
    logger.warn("Invalid shop_domain in customers.redact webhook", {
      shop_domain,
    });
    return json({ error: "Invalid shop_domain" }, { status: 400 });
  }

  const sanitizedShop = sanitizeString(shop_domain);

  logger.info("Customer redaction request received", {
    shop: sanitizedShop,
    customerId: customer?.id,
  });

  // Ton app ne stocke pas de données clients directement
  // Elle stocke uniquement des données Instagram du marchand
  // Aucune suppression nécessaire pour les données clients

  return json({ message: "No customer data to redact" }, { status: 200 });
};
