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
}

// ============================================================================
// HTML Sanitization & Instagram Post Validation
// ============================================================================

/**
 * Sanitize text by escaping HTML entities to prevent XSS
 * Converts: < > & " ' to HTML entities
 * Preserves emojis and unicode characters
 */
export function sanitizeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim()
    .slice(0, 2200); // Instagram caption max ~2200 chars
}

/**
 * Sanitize caption with HTML escaping and validation
 * Handles null/undefined gracefully
 */
export function sanitizeCaption(caption) {
  if (!caption || typeof caption !== "string") return null;
  const sanitized = sanitizeHtml(caption);
  return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate Instagram URL format (basic validation)
 */
export function isValidInstagramUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const urlObj = new URL(url);
    return (
      urlObj.protocol === "http:" ||
      urlObj.protocol === "https:" ||
      urlObj.hostname.includes("instagram") ||
      urlObj.hostname.includes("fbcdn")
    );
  } catch {
    return false;
  }
}

/**
 * Validate carousel children JSON format
 */
export function isValidCarouselChildren(carouselJson) {
  if (!carouselJson) return null;
  try {
    const parsed = JSON.parse(carouselJson);
    if (!Array.isArray(parsed)) return null;
    return parsed.every((item) => item.url && item.type) ? carouselJson : null;
  } catch {
    return null;
  }
}

/**
 * Zod schema for Instagram posts validation
 * Ensures all required fields are present and properly typed
 */
export const instagramPostSchema = z.object({
  id: z.string().min(1, "Post ID requis"),
  caption: z.string().nullable().optional(),
  mediaUrl: z.string().min(1, "Media URL requis"),
  thumbnailUrl: z.string().nullable().optional(),
  permalink: z.string().min(1, "Permalink requis"),
  publishedAt: z.date().or(z.string()),
  mediaType: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]),
  carouselChildren: z.string().nullable().optional(),
  likeCount: z.number().int().min(0).default(0),
  commentsCount: z.number().int().min(0).default(0),
  impressions: z.number().int().min(0).nullable().optional(),
  reach: z.number().int().min(0).nullable().optional(),
  saved: z.number().int().min(0).nullable().optional(),
  isTagged: z.boolean().default(false),
  ownerUsername: z.string().min(1, "Username requis"),
  configId: z.string().min(1, "Config ID requis"),
  shop: z.string().min(1, "Shop requis"),
});

/**
 * Validate and sanitize Instagram post data before storing in DB
 * Applies schema validation + HTML sanitization
 */
export function validateAndSanitizeInstagramPost(postData) {
  // Apply sanitization first
  const sanitized = {
    ...postData,
    caption: sanitizeCaption(postData.caption),
    mediaUrl: isValidInstagramUrl(postData.mediaUrl) ? postData.mediaUrl : null,
    thumbnailUrl: postData.thumbnailUrl
      ? isValidInstagramUrl(postData.thumbnailUrl)
        ? postData.thumbnailUrl
        : null
      : null,
    carouselChildren: isValidCarouselChildren(postData.carouselChildren),
    likeCount: Number.isInteger(postData.likeCount) ? postData.likeCount : 0,
    commentsCount: Number.isInteger(postData.commentsCount)
      ? postData.commentsCount
      : 0,
    impressions:
      postData.impressions && Number.isInteger(postData.impressions)
        ? postData.impressions
        : null,
    reach:
      postData.reach && Number.isInteger(postData.reach)
        ? postData.reach
        : null,
    saved:
      postData.saved && Number.isInteger(postData.saved)
        ? postData.saved
        : null,
  };

  // Validate against schema
  const result = instagramPostSchema.safeParse(sanitized);

  if (!result.success) {
    const errors =
      result.error?.issues?.map((issue) => ({
        field: issue.path?.join(".") || "unknown",
        message: issue.message,
        value: sanitized[issue.path?.[0]],
      })) || [];
    return { success: false, errors, data: null };
  }

  return { success: true, data: result.data, errors: [] };
}

/**
 * Sanitization des chaînes de caractères (legacy, use sanitizeHtml instead)
 */
export function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return sanitizeHtml(str).slice(0, 1000);
}

/**
 * Validation du format shop Shopify
 */
export function isValidShopDomain(shop) {
  if (!shop || typeof shop !== "string") return false;
  return /^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop);
}
