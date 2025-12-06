/**
 * Service de traduction DeepL avec cache persistant
 * Permet la traduction à la volée FR <-> AR
 * DeepL est PRIORITAIRE - utilisé pour TOUT le contenu dynamique
 */

// Cache en mémoire pour les traductions
const translationCache = new Map();

// Utiliser l'API route Next.js pour éviter les problèmes CORS
const TRANSLATE_API_URL = '/api/translate';

// Clé localStorage pour le cache persistant
const STORAGE_KEY = 'glamgo_translations_cache';

// Charger le cache depuis localStorage au démarrage
function loadCacheFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]) => {
        translationCache.set(key, value);
      });
    }
  } catch (e) {
    // Ignorer les erreurs de parsing
  }
}

// Sauvegarder le cache dans localStorage (debounced)
let saveTimeout = null;
function saveCacheToStorage() {
  if (typeof window === 'undefined') return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const obj = {};
      translationCache.forEach((value, key) => {
        obj[key] = value;
      });
      // Limiter la taille du cache (garder les 500 dernières entrées)
      const entries = Object.entries(obj);
      if (entries.length > 500) {
        const limited = Object.fromEntries(entries.slice(-500));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      }
    } catch (e) {
      // Ignorer les erreurs de stockage
    }
  }, 1000);
}

// Charger le cache au démarrage
if (typeof window !== 'undefined') {
  loadCacheFromStorage();
}

/**
 * Génère une clé de cache unique
 */
function getCacheKey(text, targetLang) {
  return `${targetLang}:${text}`;
}

/**
 * Traduit un texte via l'API route Next.js
 * @param {string} text - Texte à traduire
 * @param {string} targetLang - Langue cible ('AR' ou 'FR')
 * @returns {Promise<string>} - Texte traduit
 */
export async function translateText(text, targetLang) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return text;
  }

  const normalizedTarget = targetLang.toUpperCase() === 'AR' ? 'AR' : 'FR';

  // Vérifier le cache
  const cacheKey = getCacheKey(text, normalizedTarget);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const response = await fetch(TRANSLATE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: [text], targetLang: normalizedTarget }),
    });

    if (!response.ok) {
      console.error('Translation API error:', response.status);
      return text;
    }

    const data = await response.json();
    const translatedText = data.translations?.[0] || text;

    // Mettre en cache
    translationCache.set(cacheKey, translatedText);
    saveCacheToStorage();

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

/**
 * Traduit plusieurs textes en batch via l'API route Next.js
 * @param {string[]} texts - Tableau de textes à traduire
 * @param {string} targetLang - Langue cible ('AR' ou 'FR')
 * @returns {Promise<string[]>} - Tableau de textes traduits
 */
export async function translateBatch(texts, targetLang) {
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return texts;
  }

  const normalizedTarget = targetLang.toUpperCase() === 'AR' ? 'AR' : 'FR';
  const results = new Array(texts.length);
  const textsToTranslate = [];
  const indexMap = [];

  // Vérifier le cache pour chaque texte
  texts.forEach((text, index) => {
    if (!text || typeof text !== 'string' || !text.trim()) {
      results[index] = text;
      return;
    }

    const cacheKey = getCacheKey(text, normalizedTarget);
    if (translationCache.has(cacheKey)) {
      results[index] = translationCache.get(cacheKey);
    } else {
      textsToTranslate.push(text);
      indexMap.push(index);
    }
  });

  // Si tout est en cache, retourner directement
  if (textsToTranslate.length === 0) {
    return results;
  }

  try {
    const response = await fetch(TRANSLATE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: textsToTranslate, targetLang: normalizedTarget }),
    });

    if (!response.ok) {
      console.error('Translation API error:', response.status);
      indexMap.forEach((originalIndex, i) => {
        results[originalIndex] = textsToTranslate[i];
      });
      return results;
    }

    const data = await response.json();
    const translations = data.translations || [];

    // Remplir les résultats et le cache
    translations.forEach((translatedText, i) => {
      const originalIndex = indexMap[i];
      const originalText = textsToTranslate[i];

      results[originalIndex] = translatedText || originalText;

      // Mettre en cache
      const cacheKey = getCacheKey(originalText, normalizedTarget);
      translationCache.set(cacheKey, translatedText || originalText);
    });

    // Sauvegarder le cache après le batch
    saveCacheToStorage();

    return results;
  } catch (error) {
    console.error('Batch translation error:', error);
    indexMap.forEach((originalIndex, i) => {
      results[originalIndex] = textsToTranslate[i];
    });
    return results;
  }
}

/**
 * Traduit un objet contenant des textes
 * @param {Object} obj - Objet avec des propriétés à traduire
 * @param {string[]} keys - Clés à traduire
 * @param {string} targetLang - Langue cible
 * @returns {Promise<Object>} - Objet avec les propriétés traduites
 */
export async function translateObject(obj, keys, targetLang) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const textsToTranslate = keys.map(key => obj[key] || '');
  const translations = await translateBatch(textsToTranslate, targetLang);

  const result = { ...obj };
  keys.forEach((key, index) => {
    if (translations[index]) {
      result[key] = translations[index];
    }
  });

  return result;
}

/**
 * Vide le cache de traduction
 */
export function clearTranslationCache() {
  translationCache.clear();
}

/**
 * Retourne la taille actuelle du cache
 */
export function getCacheSize() {
  return translationCache.size;
}

/**
 * Hook React pour traduire un texte avec état de chargement
 */
export function useTranslation() {
  const translateWithLoading = async (text, targetLang, onLoading) => {
    if (onLoading) onLoading(true);
    try {
      const result = await translateText(text, targetLang);
      return result;
    } finally {
      if (onLoading) onLoading(false);
    }
  };

  return { translateText, translateBatch, translateWithLoading };
}
