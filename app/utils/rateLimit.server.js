import { logger } from "./logger.server";

// Stockage en mémoire des tentatives (Map: key -> {count, resetTime})
const attempts = new Map();

// Nettoyage automatique toutes les heures
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetTime) {
      attempts.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Vérifie si une requête dépasse la limite de rate limiting
 * @param {string} key - Clé unique (ex: "connect:shop.myshopify.com")
 * @param {number} maxAttempts - Nombre max de tentatives
 * @param {number} windowMs - Fenêtre de temps en millisecondes
 * @returns {{allowed: boolean, remaining: number, resetTime: number}}
 */
export function checkRateLimit(key, maxAttempts, windowMs) {
  // Désactiver le rate limiting en développement
  if (process.env.NODE_ENV === "development") {
    return {
      allowed: true,
      remaining: maxAttempts,
      resetTime: Date.now() + windowMs,
    };
  }

  const now = Date.now();
  const record = attempts.get(key);

  // Première tentative ou fenêtre expirée
  if (!record || now > record.resetTime) {
    attempts.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs,
    };
  }

  // Incrémenter le compteur
  record.count++;
  attempts.set(key, record);

  // Vérifier si limite dépassée
  if (record.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Réinitialise le compteur pour une clé donnée
 * @param {string} key - Clé à réinitialiser
 */
export function resetRateLimit(key) {
  attempts.delete(key);
}

// Limites prédéfinies
export const RATE_LIMITS = {
  CONNECT: { max: 10, window: 60 * 60 * 1000 }, // 10/heure
  SAVE: { max: 20, window: 5 * 60 * 1000 }, // 20/5min
  API: { max: 100, window: 15 * 60 * 1000 }, // 100/15min
  DISCONNECT: { max: 20, window: 15 * 60 * 1000 }, // 20/15min
};
