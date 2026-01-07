/**
 * Cache pour les commandes déjà évaluées
 * Évite que le modal de satisfaction ne réapparaisse
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@glamgo_satisfied_order_ids';

// IDs de commandes déjà évaluées à forcer (pour résoudre les problèmes existants)
const FORCE_SATISFIED_IDS = [219];

// Cache en mémoire pour accès synchrone rapide
let memoryCache: Set<number> = new Set(FORCE_SATISFIED_IDS);
let isInitialized = false;

/**
 * Initialiser le cache depuis AsyncStorage
 */
export const initSatisfiedOrdersCache = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const ids = JSON.parse(stored) as number[];
      // Fusionner avec les IDs forcés
      memoryCache = new Set([...FORCE_SATISFIED_IDS, ...ids]);
    } else {
      memoryCache = new Set(FORCE_SATISFIED_IDS);
    }
    console.log('[SatisfiedOrdersCache] Loaded', memoryCache.size, 'satisfied IDs');
    isInitialized = true;
  } catch (error) {
    console.error('[SatisfiedOrdersCache] Error loading:', error);
    memoryCache = new Set(FORCE_SATISFIED_IDS);
    isInitialized = true;
  }
};

/**
 * Ajouter un ID à la liste des commandes satisfaites
 */
export const addSatisfiedOrderId = async (orderId: number): Promise<void> => {
  console.log('[SatisfiedOrdersCache] Adding satisfied order:', orderId);
  memoryCache.add(orderId);

  try {
    const idsArray = Array.from(memoryCache).slice(-100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(idsArray));
  } catch (error) {
    console.error('[SatisfiedOrdersCache] Error saving:', error);
  }
};

/**
 * Vérifier si un ID est dans la liste des commandes satisfaites
 */
export const isOrderSatisfied = (orderId: number): boolean => {
  return memoryCache.has(orderId);
};

/**
 * Obtenir tous les IDs satisfaits
 */
export const getSatisfiedOrderIds = (): number[] => {
  return Array.from(memoryCache);
};

/**
 * Vider le cache
 */
export const clearSatisfiedOrdersCache = async (): Promise<void> => {
  memoryCache.clear();
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[SatisfiedOrdersCache] Error clearing:', error);
  }
};
