/**
 * API Server-side functions pour Next.js Server Components
 * Ces fonctions s'exécutent côté serveur pour améliorer les performances
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Cache en mémoire pour le développement (évite les appels répétés)
const memoryCache = new Map();
const CACHE_DURATION = 30000; // 30 secondes en dev

function getCachedData(key) {
  if (process.env.NODE_ENV === 'production') return null;

  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  if (process.env.NODE_ENV === 'production') return;

  memoryCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Fetch avec timeout pour éviter les blocages
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`Timeout après ${timeout}ms pour ${url}`);
    }
    throw error;
  }
}

/**
 * Récupérer toutes les catégories
 */
export async function getCategories() {
  // Vérifier le cache mémoire en dev
  const cached = getCachedData('categories');
  if (cached) {
    return cached;
  }

  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories`, {
      next: { revalidate: 300 }, // Cache pendant 5 minutes
      cache: 'force-cache', // Force le cache
    }, 10000); // Timeout 10 secondes

    if (!res.ok) {
      throw new Error('Erreur lors de la récupération des catégories');
    }

    const data = await res.json();

    const categories = data.success && data.data
      ? (Array.isArray(data.data) ? data.data : (data.data.categories || []))
      : [];

    // Mettre en cache
    setCachedData('categories', categories);

    return categories;
  } catch (error) {
    console.error('Erreur getCategories:', error);
    return [];
  }
}

/**
 * Récupérer tous les services
 */
export async function getAllServices() {
  // Vérifier le cache mémoire en dev
  const cached = getCachedData('services');
  if (cached) {
    return cached;
  }

  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/services`, {
      next: { revalidate: 300 }, // Cache pendant 5 minutes
      cache: 'force-cache', // Force le cache
    }, 10000); // Timeout 10 secondes

    if (!res.ok) {
      throw new Error('Erreur lors de la récupération des services');
    }

    const data = await res.json();

    const services = data.success && data.data
      ? (Array.isArray(data.data) ? data.data : (data.data.services || []))
      : [];

    // Mettre en cache
    setCachedData('services', services);

    return services;
  } catch (error) {
    console.error('Erreur getAllServices:', error);
    return [];
  }
}

/**
 * Récupérer un service par ID
 */
export async function getServiceById(id) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/services/${id}`, {
      next: { revalidate: 60 },
    }, 10000); // Timeout 10 secondes

    if (!res.ok) {
      throw new Error('Erreur lors de la récupération du service');
    }

    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Erreur getServiceById:', error);
    return null;
  }
}

/**
 * Récupérer une catégorie par ID
 */
export async function getCategoryById(id) {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/categories/${id}`, {
      next: { revalidate: 60 },
    }, 10000); // Timeout 10 secondes

    if (!res.ok) {
      throw new Error('Erreur lors de la récupération de la catégorie');
    }

    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Erreur getCategoryById:', error);
    return null;
  }
}
