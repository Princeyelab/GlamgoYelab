/**
 * Cache pour les commandes annulées
 * Utilise AsyncStorage pour persister les IDs même après reload
 * Plus fiable que Redux pour éviter les race conditions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@glamgo_cancelled_order_ids';

// Cache en mémoire pour accès synchrone rapide
let memoryCache: Set<number> = new Set();
let isInitialized = false;

/**
 * Initialiser le cache depuis AsyncStorage
 * Appelé au démarrage de l'app
 */
export const initCancelledOrdersCache = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const ids = JSON.parse(stored) as number[];
      memoryCache = new Set(ids);
      console.log('[CancelledOrdersCache] Loaded', memoryCache.size, 'cancelled IDs');
    }
    isInitialized = true;
  } catch (error) {
    console.error('[CancelledOrdersCache] Error loading:', error);
    isInitialized = true;
  }
};

/**
 * Ajouter un ID à la liste des commandes annulées
 */
export const addCancelledOrderId = async (orderId: number): Promise<void> => {
  console.log('[CancelledOrdersCache] Adding cancelled order:', orderId);
  memoryCache.add(orderId);

  try {
    // Garder seulement les 100 derniers IDs
    const idsArray = Array.from(memoryCache).slice(-100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(idsArray));
  } catch (error) {
    console.error('[CancelledOrdersCache] Error saving:', error);
  }
};

/**
 * Vérifier si un ID est dans la liste des commandes annulées
 * Accès synchrone via le cache mémoire
 */
export const isOrderCancelled = (orderId: number): boolean => {
  return memoryCache.has(orderId);
};

/**
 * Obtenir tous les IDs annulés
 */
export const getCancelledOrderIds = (): number[] => {
  return Array.from(memoryCache);
};

/**
 * Supprimer un ID de la liste (si besoin de "réactiver" une commande)
 */
export const removeCancelledOrderId = async (orderId: number): Promise<void> => {
  memoryCache.delete(orderId);

  try {
    const idsArray = Array.from(memoryCache);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(idsArray));
  } catch (error) {
    console.error('[CancelledOrdersCache] Error removing:', error);
  }
};

/**
 * Vider le cache (pour reset de l'app)
 */
export const clearCancelledOrdersCache = async (): Promise<void> => {
  memoryCache.clear();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[CancelledOrdersCache] Error clearing:', error);
  }
};
