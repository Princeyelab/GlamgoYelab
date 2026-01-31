/**
 * Logger utilitaire - GlamGo Mobile
 *
 * Centralise les logs et les désactive automatiquement en production.
 * Utiliser ce logger au lieu de console.log directement.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Configuration par défaut - désactivé en production
const defaultConfig: LoggerConfig = {
  enabled: __DEV__,
  level: 'debug',
  prefix: '[GlamGo]',
};

let config = { ...defaultConfig };

/**
 * Configure le logger
 */
export const configureLogger = (newConfig: Partial<LoggerConfig>) => {
  config = { ...config, ...newConfig };
};

/**
 * Vérifie si un niveau de log est actif
 */
const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
};

/**
 * Formate le message avec le préfixe
 */
const formatMessage = (tag: string, message: string): string => {
  return `${config.prefix}[${tag}] ${message}`;
};

/**
 * Logger principal
 */
export const logger = {
  /**
   * Log de debug (désactivé en production)
   */
  debug: (tag: string, message: string, ...args: any[]) => {
    if (shouldLog('debug')) {
      console.log(formatMessage(tag, message), ...args);
    }
  },

  /**
   * Log d'info (désactivé en production)
   */
  info: (tag: string, message: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.log(formatMessage(tag, message), ...args);
    }
  },

  /**
   * Log de warning (désactivé en production)
   */
  warn: (tag: string, message: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage(tag, message), ...args);
    }
  },

  /**
   * Log d'erreur (toujours actif, même en production)
   * Utilisé pour les erreurs critiques qui doivent être loggées
   */
  error: (tag: string, message: string, ...args: any[]) => {
    // Les erreurs sont toujours loggées pour le debug
    if (__DEV__) {
      console.error(formatMessage(tag, message), ...args);
    }
    // En production, on pourrait envoyer à un service comme Sentry
    // TODO: Intégrer Sentry pour la production
  },

  /**
   * Log d'API (désactivé en production)
   */
  api: (method: string, url: string, ...args: any[]) => {
    if (shouldLog('debug')) {
      console.log(`${config.prefix}[API] ${method} ${url}`, ...args);
    }
  },

  /**
   * Log conditionnel simple (raccourci)
   */
  log: (message: string, ...args: any[]) => {
    if (__DEV__) {
      console.log(message, ...args);
    }
  },
};

/**
 * Créer un logger avec un tag spécifique
 */
export const createLogger = (tag: string) => ({
  debug: (message: string, ...args: any[]) => logger.debug(tag, message, ...args),
  info: (message: string, ...args: any[]) => logger.info(tag, message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(tag, message, ...args),
  error: (message: string, ...args: any[]) => logger.error(tag, message, ...args),
  log: (message: string, ...args: any[]) => logger.log(`[${tag}] ${message}`, ...args),
});

export default logger;
