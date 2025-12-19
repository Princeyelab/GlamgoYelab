/**
 * App Configuration - GlamGo Mobile
 * Configuration globale et mode demo
 */

// ============================================
// 🚨 DEMO MODE - Mettre true pour tester sans API
// ============================================
export const DEMO_MODE = true;

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://glamgo-api.fly.dev',
  TIMEOUT: 30000,
};

// Demo User (utilisé quand DEMO_MODE = true)
// is_provider: true permet de tester le switch entre modes Client et Prestataire
export const DEMO_USER = {
  id: 999,
  name: 'Utilisateur Demo',
  first_name: 'Demo',
  last_name: 'User',
  email: 'demo@glamgo.ma',
  phone: '+212 6 00 00 00 00',
  avatar: 'https://i.pravatar.cc/150?img=32',
  role: 'user' as const,
  email_verified_at: new Date().toISOString(),
  is_provider: true, // User has provider access
  provider_id: 1, // Associated provider ID
};

// Demo Credentials
export const DEMO_CREDENTIALS = {
  email: 'demo@glamgo.ma',
  password: 'demo123',
};

// Feature Flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_TRACKING: true,
  ENABLE_PAYMENTS: false, // Désactivé en demo
  ENABLE_CHAT: true,
};

export default {
  DEMO_MODE,
  API_CONFIG,
  DEMO_USER,
  DEMO_CREDENTIALS,
  FEATURES,
};
