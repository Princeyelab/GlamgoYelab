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
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/profile',
    CHANGE_PASSWORD: '/api/user/change-password',
    UPLOAD_AVATAR: '/api/user/avatar',
    DELETE_ACCOUNT: '/api/user/account',
  },

  // === SERVICES ===
  SERVICES: {
    LIST: '/api/services',
    DETAIL: (id: number | string) => `/api/services/${id}`,
    BY_CATEGORY: (categoryId: number | string) => `/api/services/category/${categoryId}`,
    SEARCH: '/api/services/search',
    FEATURED: '/api/services/featured',
    POPULAR: '/api/services/popular',
    NEARBY_PROVIDERS: (serviceId: number | string) => `/api/services/${serviceId}/nearby-providers`,
  },

  // === CATEGORIES ===
  CATEGORIES: {
    LIST: '/api/categories',
    DETAIL: (id: number | string) => `/api/categories/${id}`,
    SERVICES: (id: number | string) => `/api/categories/${id}/services`,
  },

  // === PRESTATAIRES (consultation publique) ===
  PROVIDERS: {
    LIST: '/api/providers',
    DETAIL: (id: number | string) => `/api/providers/${id}`,
    NEARBY: '/api/providers/nearby',
    BY_SERVICE: (serviceId: number | string) => `/api/providers/service/${serviceId}`,
    REVIEWS: (id: number | string) => `/api/providers/${id}/reviews`,
    AVAILABILITY: (id: number | string) => `/api/providers/${id}/availability`,
  },

  // === ESPACE PRESTATAIRE (authentifié) ===
  PROVIDER: {
    REGISTER: '/api/provider/register',
    LOGIN: '/api/provider/login',
    PROFILE: '/api/provider/profile',
    UPDATE_PROFILE: '/api/provider/profile',
    UPLOAD_IMAGE: '/api/provider/profile/image',
    UPLOAD_DOCUMENTS: '/api/provider/documents',
    // Services du prestataire
    SERVICES: '/api/provider/services',
    ADD_SERVICE: '/api/provider/services',
    REMOVE_SERVICE: (id: number | string) => `/api/provider/services/${id}`,
    // Commandes du prestataire
    ORDERS: '/api/provider/orders',
    ORDER_DETAIL: (id: number | string) => `/api/provider/orders/${id}`,
    ACCEPT_ORDER: (id: number | string) => `/api/provider/orders/${id}/accept`,
    START_ORDER: (id: number | string) => `/api/provider/orders/${id}/start`,
    ARRIVE_ORDER: (id: number | string) => `/api/provider/orders/${id}/arrive`,
    COMPLETE_ORDER: (id: number | string) => `/api/provider/orders/${id}/complete-service`,
    CANCEL_ORDER: (id: number | string) => `/api/provider/orders/${id}/cancel`,
    // Localisation
    UPDATE_LOCATION: '/api/provider/location',
    CLIENT_LOCATION: (orderId: number | string) => `/api/provider/orders/${orderId}/client-location`,
    // Notifications
    NOTIFICATIONS: '/api/provider/notifications',
    MARK_NOTIFICATION_READ: (id: number | string) => `/api/provider/notifications/${id}/read`,
    MARK_ALL_NOTIFICATIONS_READ: '/api/provider/notifications/read-all',
    UNREAD_COUNT: '/api/provider/notifications/unread-count',
    // Enchères
    AVAILABLE_ORDERS: '/api/provider/available-orders',
    MY_BIDS: '/api/provider/my-bids',
    // Gains et statistiques
    EARNINGS: '/api/provider/earnings',
    EARNINGS_STATS: '/api/provider/earnings/stats',
    TRANSACTIONS: '/api/provider/transactions',
    WITHDRAW: '/api/provider/withdraw',
  },

  // === RESERVATIONS / BOOKINGS (uses /api/orders in backend) ===
  BOOKINGS: {
    LIST: '/api/orders',
    CREATE: '/api/orders',
    DETAIL: (id: number | string) => `/api/orders/${id}`,
    CANCEL: (id: number | string) => `/api/orders/${id}/cancel`,
    CANCELLATION_FEE: (id: number | string) => `/api/orders/${id}/cancellation-info`,
    CONFIRM: (id: number | string) => `/api/orders/${id}/accept`,  // Provider accepts
    CONFIRM_ARRIVAL: (id: number | string) => `/api/orders/${id}/confirm-arrival`,
    COMPLETE: (id: number | string) => `/api/orders/${id}/confirm-complete`,
    SATISFACTION: (id: number | string) => `/api/orders/${id}/satisfaction`,
    HISTORY: '/api/orders',  // Same endpoint with status filter
    UPCOMING: '/api/orders', // Same endpoint with status filter
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
    UNREAD_COUNT: '/api/notifications/unread-count',
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
