/**
 * Endpoints API GlamGo
 * Centralise tous les endpoints pour faciliter la maintenance
 */

export const ENDPOINTS = {
  // === AUTHENTIFICATION ===
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
  },

  // === UTILISATEURS ===
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/change-password',
    UPLOAD_AVATAR: '/api/users/avatar',
    DELETE_ACCOUNT: '/api/users/account',
  },

  // === SERVICES ===
  SERVICES: {
    LIST: '/api/services',
    DETAIL: (id: number | string) => `/api/services/${id}`,
    BY_CATEGORY: (categoryId: number | string) => `/api/services/category/${categoryId}`,
    SEARCH: '/api/services/search',
    FEATURED: '/api/services/featured',
    POPULAR: '/api/services/popular',
  },

  // === CATEGORIES ===
  CATEGORIES: {
    LIST: '/api/categories',
    DETAIL: (id: number | string) => `/api/categories/${id}`,
    WITH_SERVICES: '/api/categories/with-services',
  },

  // === PRESTATAIRES ===
  PROVIDERS: {
    LIST: '/api/providers',
    DETAIL: (id: number | string) => `/api/providers/${id}`,
    NEARBY: '/api/providers/nearby',
    BY_SERVICE: (serviceId: number | string) => `/api/providers/service/${serviceId}`,
    REVIEWS: (id: number | string) => `/api/providers/${id}/reviews`,
    AVAILABILITY: (id: number | string) => `/api/providers/${id}/availability`,
  },

  // === RESERVATIONS / BOOKINGS ===
  BOOKINGS: {
    LIST: '/api/bookings',
    CREATE: '/api/bookings',
    DETAIL: (id: number | string) => `/api/bookings/${id}`,
    CANCEL: (id: number | string) => `/api/bookings/${id}/cancel`,
    CONFIRM: (id: number | string) => `/api/bookings/${id}/confirm`,
    COMPLETE: (id: number | string) => `/api/bookings/${id}/complete`,
    HISTORY: '/api/bookings/history',
    UPCOMING: '/api/bookings/upcoming',
  },

  // === AVIS / REVIEWS ===
  REVIEWS: {
    CREATE: '/api/reviews',
    LIST: '/api/reviews',
    DETAIL: (id: number | string) => `/api/reviews/${id}`,
    BY_SERVICE: (serviceId: number | string) => `/api/services/${serviceId}/reviews`,
    BY_PROVIDER: (providerId: number | string) => `/api/providers/${providerId}/reviews`,
    MY_REVIEWS: '/api/reviews/my-reviews',
  },

  // === FAVORIS ===
  FAVORITES: {
    LIST: '/api/favorites',
    ADD: '/api/favorites',
    REMOVE: (id: number | string) => `/api/favorites/${id}`,
    TOGGLE: '/api/favorites/toggle',
  },

  // === PAIEMENTS ===
  PAYMENTS: {
    CREATE: '/api/payments',
    LIST: '/api/payments',
    DETAIL: (id: number | string) => `/api/payments/${id}`,
    METHODS: '/api/payments/methods',
    ADD_METHOD: '/api/payments/methods',
    DELETE_METHOD: (id: number | string) => `/api/payments/methods/${id}`,
  },

  // === NOTIFICATIONS ===
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: (id: number | string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    SETTINGS: '/api/notifications/settings',
    UPDATE_SETTINGS: '/api/notifications/settings',
    REGISTER_DEVICE: '/api/notifications/device',
  },

  // === CHAT / MESSAGES ===
  CHAT: {
    CONVERSATIONS: '/api/chat/conversations',
    CONVERSATION: (id: number | string) => `/api/chat/conversations/${id}`,
    MESSAGES: (conversationId: number | string) => `/api/chat/conversations/${conversationId}/messages`,
    SEND: (conversationId: number | string) => `/api/chat/conversations/${conversationId}/messages`,
    START: '/api/chat/conversations',
  },

  // === ADRESSES ===
  ADDRESSES: {
    LIST: '/api/addresses',
    CREATE: '/api/addresses',
    UPDATE: (id: number | string) => `/api/addresses/${id}`,
    DELETE: (id: number | string) => `/api/addresses/${id}`,
    SET_DEFAULT: (id: number | string) => `/api/addresses/${id}/default`,
  },

  // === URGENCES ===
  EMERGENCY: {
    REPORT: '/api/emergency/report',
    STATUS: (id: number | string) => `/api/emergency/${id}/status`,
  },

  // === IMAGES ===
  IMAGES: {
    SERVICES: (filename: string) => `/images/services/${filename}`,
    PROVIDERS: (filename: string) => `/images/providers/${filename}`,
    USERS: (filename: string) => `/images/users/${filename}`,
  },
} as const;

// Type helper pour les endpoints dynamiques
export type EndpointFunction = (id: number | string) => string;

// Base URL pour les images
export const IMAGE_BASE_URL = 'https://glamgo-api.fly.dev';

/**
 * Construire l'URL complete d'une image
 */
export const getImageUrl = (path: string): string => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${IMAGE_BASE_URL}${path}`;
};
