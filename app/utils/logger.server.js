// Utilitaire de logging centralisé pour l'application

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

function formatLog(level, message, context = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });
}

export const logger = {
  error: (message, error, context = {}) => {
    console.error(formatLog(LOG_LEVELS.ERROR, message, {
      error: error?.message,
      stack: error?.stack,
      ...context,
    }));
  },

  warn: (message, context = {}) => {
    console.warn(formatLog(LOG_LEVELS.WARN, message, context));
  },

  info: (message, context = {}) => {
    console.info(formatLog(LOG_LEVELS.INFO, message, context));
  },

  debug: (message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog(LOG_LEVELS.DEBUG, message, context));
    }
  },
};
