import { z } from "zod";

// Schéma pour la sélection de posts Instagram
export const saveSelectionSchema = z.object({
  selectedPostIds: z
    .array(
      z
        .string()
        .min(1, "ID du post requis")
        .regex(/^\d+$/, "ID du post doit être numérique"),
    )
    .min(1, "Au moins un post doit être sélectionné")
    .max(50, "Maximum 50 posts peuvent être sélectionnés"),
});

// Schéma pour les paramètres de connexion Instagram
export const instagramConnectSchema = z.object({
  shop: z
    .string()
    .min(1, "Le paramètre shop est requis")
    .regex(/^[a-zA-Z0-9-]+\.myshopify\.com$/, "Format de shop invalide"),
});

// Schéma pour le callback Instagram
export const instagramCallbackSchema = z.object({
  code: z.string().min(1, "Code d'autorisation requis"),
  state: z.string().min(1, "Paramètre state requis"),
  error: z.string().nullable().optional(),
  error_description: z.string().nullable().optional(),
});

// Fonction helper pour valider et retourner les erreurs
export function validateData(schema, data) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error?.issues?.map((issue) => ({
      field: issue.path?.join(".") || "unknown",
      message: issue.message,
      code: issue.code,
    })) || [
      { field: "unknown", message: "Validation failed", code: "unknown" },
    ];

    logger.debug("Validation errors", {
      errors: JSON.stringify(errors, null, 2),
    });
    logger.debug("Validation input data", {
      data: JSON.stringify(data, null, 2),
    });

    return { success: false, errors };
  }

  return { success: true, data: result.data };
} // Sanitization des chaînes de caractères
export function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, 1000);
}

// Validation du format shop Shopify
export function isValidShopDomain(shop) {
  if (!shop || typeof shop !== "string") return false;
  return /^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop);
}
