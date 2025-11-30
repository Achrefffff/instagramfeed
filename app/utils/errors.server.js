import { data } from "react-router";
import { logger } from "./logger.server";

// Classes d'erreurs personnalisées
export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

export class InstagramAPIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "InstagramAPIError";
    this.statusCode = statusCode;
  }
}

export class DatabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = "DatabaseError";
    this.originalError = originalError;
  }
}

// Gestionnaire d'erreurs centralisé
export function handleError(error, context = {}) {
  if (error instanceof ValidationError) {
    logger.warn("Validation error", { ...context, errors: error.errors });
    return data(
      { error: error.message, errors: error.errors },
      { status: 400 }
    );
  }

  if (error instanceof InstagramAPIError) {
    logger.error("Instagram API error", error, context);
    return data(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof DatabaseError) {
    logger.error("Database error", error.originalError, context);
    return data(
      { error: "Erreur de base de données" },
      { status: 500 }
    );
  }

  if (error instanceof Response) {
    return error;
  }

  logger.error("Unexpected error", error, context);
  return data(
    { error: "Une erreur inattendue s'est produite" },
    { status: 500 }
  );
}
