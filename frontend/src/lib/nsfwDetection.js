'use client';

/**
 * Module de detection NSFW (Not Safe For Work)
 * Utilise NSFW.js avec TensorFlow.js pour analyser le contenu des images
 */

let nsfwModel = null;
let isModelLoading = false;
let modelLoadPromise = null;

/**
 * Charge le modele NSFW.js (une seule fois)
 */
export async function loadNSFWModel() {
  if (nsfwModel) {
    return nsfwModel;
  }

  if (isModelLoading && modelLoadPromise) {
    return modelLoadPromise;
  }

  isModelLoading = true;

  modelLoadPromise = (async () => {
    try {
      // Import dynamique pour eviter les erreurs SSR
      const nsfwjs = await import('nsfwjs');

      // Charger le modele (utilise le modele par defaut heberge sur jsdelivr)
      nsfwModel = await nsfwjs.load();

      console.log('Modele NSFW charge avec succes');
      return nsfwModel;
    } catch (error) {
      console.error('Erreur chargement modele NSFW:', error);
      isModelLoading = false;
      modelLoadPromise = null;
      throw error;
    }
  })();

  return modelLoadPromise;
}

/**
 * Analyse une image et retourne les predictions NSFW
 * @param {File} imageFile - Le fichier image a analyser
 * @returns {Promise<Object>} Resultat de l'analyse
 */
export async function analyzeImage(imageFile) {
  try {
    // Charger le modele si necessaire
    const model = await loadNSFWModel();

    // Creer une URL pour l'image
    const imageUrl = URL.createObjectURL(imageFile);

    // Creer un element image
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          // Analyser l'image
          const predictions = await model.classify(img);

          // Liberer l'URL
          URL.revokeObjectURL(imageUrl);

          // Traiter les predictions
          const result = processNSFWPredictions(predictions);
          resolve(result);
        } catch (error) {
          URL.revokeObjectURL(imageUrl);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Impossible de charger l\'image'));
      };

      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Erreur analyse NSFW:', error);
    // En cas d'erreur, retourner un resultat neutre mais avec avertissement
    return {
      isAllowed: true,
      warning: 'Analyse non disponible',
      predictions: []
    };
  }
}

/**
 * Traite les predictions NSFW et determine si l'image est autorisee
 * Categories NSFW.js:
 * - Porn: Contenu pornographique explicite
 * - Sexy: Contenu suggestif/sexy
 * - Hentai: Anime/dessin a caractere sexuel
 * - Neutral: Contenu neutre/safe
 * - Drawing: Dessins/illustrations neutres
 */
function processNSFWPredictions(predictions) {
  // Convertir en objet pour acces facile
  const scores = {};
  predictions.forEach(p => {
    scores[p.className.toLowerCase()] = p.probability;
  });

  // Seuils de detection
  const PORN_THRESHOLD = 0.3;      // 30% - tres strict
  const SEXY_THRESHOLD = 0.5;      // 50% - modere
  const HENTAI_THRESHOLD = 0.4;    // 40% - strict

  // Verifier le contenu pornographique
  if (scores.porn >= PORN_THRESHOLD) {
    return {
      isAllowed: false,
      reason: 'Cette image contient du contenu explicite qui n\'est pas autorise.',
      category: 'porn',
      confidence: Math.round(scores.porn * 100),
      predictions
    };
  }

  // Verifier le contenu hentai
  if (scores.hentai >= HENTAI_THRESHOLD) {
    return {
      isAllowed: false,
      reason: 'Cette image contient du contenu a caractere sexuel qui n\'est pas autorise.',
      category: 'hentai',
      confidence: Math.round(scores.hentai * 100),
      predictions
    };
  }

  // Verifier le contenu sexy/suggestif
  if (scores.sexy >= SEXY_THRESHOLD) {
    return {
      isAllowed: false,
      reason: 'Cette image contient du contenu suggestif qui n\'est pas autorise dans le chat professionnel.',
      category: 'sexy',
      confidence: Math.round(scores.sexy * 100),
      predictions
    };
  }

  // Score combine pour contenu inapproprie
  const inappropriateScore = (scores.porn || 0) + (scores.hentai || 0) + (scores.sexy || 0) * 0.5;
  if (inappropriateScore >= 0.6) {
    return {
      isAllowed: false,
      reason: 'Cette image semble contenir du contenu inapproprie.',
      category: 'combined',
      confidence: Math.round(inappropriateScore * 100),
      predictions
    };
  }

  // Image autorisee
  return {
    isAllowed: true,
    category: 'safe',
    confidence: Math.round((scores.neutral || 0) * 100),
    predictions
  };
}

/**
 * Precharge le modele NSFW (appeler au demarrage si necessaire)
 */
export function preloadNSFWModel() {
  // Precharger en arriere-plan sans bloquer
  loadNSFWModel().catch(err => {
    console.warn('Prechargement NSFW echoue:', err);
  });
}

export default analyzeImage;
