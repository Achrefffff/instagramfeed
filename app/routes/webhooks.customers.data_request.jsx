import { data } from "react-router";
import { sanitizeString } from "../utils/validation.server";
import { logger } from "../utils/logger.server";

export const action = async ({ request }) => {
  const payload = await request.json();
  const { shop_domain, customer } = payload;

  if (!shop_domain || typeof shop_domain !== "string") {
    logger.warn("Invalid shop_domain in customers.data_request webhook", { shop_domain });
    return data({ error: "Invalid shop_domain" }, { status: 400 });
  }

  const sanitizedShop = sanitizeString(shop_domain);

  logger.info("Customer data request received", {
    shop: sanitizedShop,
    customerId: customer?.id,
  });

  // Ton app ne stocke pas de données clients directement
  // Elle stocke uniquement des données Instagram liées au marchand
  // Donc il n'y a généralement rien à retourner pour un client final

  return data({ message: "No customer data stored" }, { status: 200 });
};
