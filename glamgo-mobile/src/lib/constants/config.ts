/**
 * Configuration GlamGo Mobile
 * Parametres globaux de l'application
 */

// Detecter le mode dev
const isDev = __DEV__;

export const CONFIG = {
  // === API ===
  API_BASE_URL: 'https://glamgo-api.fly.dev',
  API_TIMEOUT: 30000, // 30s

  // === TESTING ===
  ENABLE_AUTO_TESTS: isDev, // Tests automatiques en dev seulement
  AUTO_TEST_ON_STARTUP: true, // Lancer tests au demarrage
  SHOW_TEST_REPORT: true, // Afficher rapport modal
  SKIP_TESTS_IF_CACHED: false, // Skip si deja teste recemment

  // === FEATURES ===
  ENABLE_OFFLINE_MODE: true, // Permettre mode hors ligne
  ENABLE_ANALYTICS: !isDev, // Analytics en prod seulement
  ENABLE_CRASH_REPORTING: !isDev, // Crash reports en prod

  // === CACHE ===
  CACHE_SERVICES_DURATION: 1000 * 60 * 5, // 5 minutes
  CACHE_CATEGORIES_DURATION: 1000 * 60 * 30, // 30 minutes

  // === UI ===
  DEFAULT_LOCALE: 'fr-MA',
  DEFAULT_CURRENCY: 'MAD',
  SKELETON_DELAY: 300, // Delai avant affichage skeleton

  // === PAGINATION ===
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,

  // === IMAGES ===
  IMAGE_BASE_URL: 'https://glamgo-api.fly.dev/images',
  DEFAULT_SERVICE_IMAGE: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
  DEFAULT_AVATAR: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop',

  // === LOCATION ===
  DEFAULT_CITY: 'Marrakech',
  DEFAULT_COUNTRY: 'Maroc',
  MAX_SEARCH_RADIUS_KM: 50,

  // === DEBUG ===
  LOG_API_CALLS: isDev,
  LOG_REDUX_ACTIONS: isDev,
  SHOW_DEV_MENU: isDev,
} as const;

// Type helper
export type ConfigKey = keyof typeof CONFIG;

/**
 * Obtenir une valeur de config
 */
export function getConfig<K extends ConfigKey>(key: K): typeof CONFIG[K] {
  return CONFIG[key];
}

/**
 * Verifier si en mode dev
 */
export function isDevMode(): boolean {
  return isDev;
}

/**
 * Verifier si les tests auto sont actives
 */
export function shouldRunAutoTests(): boolean {
  return CONFIG.ENABLE_AUTO_TESTS && CONFIG.AUTO_TEST_ON_STARTUP;
}

export default CONFIG;
