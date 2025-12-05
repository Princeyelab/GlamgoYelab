/**
 * Systeme de priorite et blocage des prestataires
 * Base sur les notes et l'historique des evaluations
 */

// Configuration des seuils
export const PRIORITY_CONFIG = {
  // Seuils de notes pour la priorite (sur 5)
  EXCELLENT_RATING: 4.5,      // Note >= 4.5 = priorite maximale
  GOOD_RATING: 4.0,           // Note >= 4.0 = priorite haute
  AVERAGE_RATING: 3.5,        // Note >= 3.5 = priorite normale
  LOW_RATING: 3.0,            // Note >= 3.0 = priorite basse
  CRITICAL_RATING: 2.5,       // Note < 2.5 = risque de blocage

  // Seuils de blocage automatique
  BLOCK_RATING_THRESHOLD: 2.5,        // Note en dessous de laquelle on bloque
  MIN_REVIEWS_FOR_BLOCK: 5,           // Nombre minimum d'avis avant blocage
  CONSECUTIVE_BAD_REVIEWS: 3,         // Nombre d'avis consecutifs < 3 etoiles pour blocage
  RATING_DROP_THRESHOLD: 1.0,         // Baisse de note declenchant une alerte
  RATING_DROP_PERIOD_DAYS: 30,        // Periode pour mesurer la baisse de note

  // Delais de priorite pour recevoir les commandes (en secondes)
  PRIORITY_DELAYS: {
    EXCELLENT: 0,      // Recoit immediatement
    GOOD: 30,          // Recoit apres 30s
    AVERAGE: 60,       // Recoit apres 1min
    LOW: 120,          // Recoit apres 2min
    CRITICAL: 300      // Recoit apres 5min (si pas bloque)
  },

  // Duree de blocage temporaire (en jours)
  TEMP_BLOCK_DURATION: {
    FIRST_OFFENSE: 7,    // 7 jours pour premiere fois
    SECOND_OFFENSE: 14,  // 14 jours pour deuxieme fois
    THIRD_OFFENSE: 30,   // 30 jours pour troisieme fois
    PERMANENT: -1        // Blocage permanent apres 3 offenses
  }
};

/**
 * Calcule le niveau de priorite d'un prestataire
 * @param {number} rating - Note moyenne du prestataire (0-5)
 * @param {number} reviewCount - Nombre total d'avis
 * @returns {Object} - Niveau de priorite et delai
 */
export function calculatePriorityLevel(rating, reviewCount) {
  // Si pas assez d'avis, priorite normale par defaut
  if (reviewCount < 3) {
    return {
      level: 'NEW',
      label: 'Nouveau prestataire',
      delay: PRIORITY_CONFIG.PRIORITY_DELAYS.AVERAGE,
      color: '#6c757d',
      icon: '🆕'
    };
  }

  if (rating >= PRIORITY_CONFIG.EXCELLENT_RATING) {
    return {
      level: 'EXCELLENT',
      label: 'Priorite maximale',
      delay: PRIORITY_CONFIG.PRIORITY_DELAYS.EXCELLENT,
      color: '#28a745',
      icon: '⭐'
    };
  }

  if (rating >= PRIORITY_CONFIG.GOOD_RATING) {
    return {
      level: 'GOOD',
      label: 'Priorite haute',
      delay: PRIORITY_CONFIG.PRIORITY_DELAYS.GOOD,
      color: '#20c997',
      icon: '✨'
    };
  }

  if (rating >= PRIORITY_CONFIG.AVERAGE_RATING) {
    return {
      level: 'AVERAGE',
      label: 'Priorite normale',
      delay: PRIORITY_CONFIG.PRIORITY_DELAYS.AVERAGE,
      color: '#ffc107',
      icon: '📊'
    };
  }

  if (rating >= PRIORITY_CONFIG.LOW_RATING) {
    return {
      level: 'LOW',
      label: 'Priorite basse',
      delay: PRIORITY_CONFIG.PRIORITY_DELAYS.LOW,
      color: '#fd7e14',
      icon: '⚠️'
    };
  }

  return {
    level: 'CRITICAL',
    label: 'Priorite critique',
    delay: PRIORITY_CONFIG.PRIORITY_DELAYS.CRITICAL,
    color: '#dc3545',
    icon: '🚨'
  };
}

/**
 * Verifie si un prestataire doit etre bloque
 * @param {Object} providerStats - Statistiques du prestataire
 * @returns {Object} - Decision de blocage avec raison
 */
export function checkBlockStatus(providerStats) {
  const {
    rating,
    reviewCount,
    recentReviews = [],
    ratingHistory = [],
    blockHistory = []
  } = providerStats;

  // Pas de blocage si pas assez d'avis
  if (reviewCount < PRIORITY_CONFIG.MIN_REVIEWS_FOR_BLOCK) {
    return {
      shouldBlock: false,
      reason: null,
      blockType: null
    };
  }

  // Verification 1: Note moyenne trop basse
  if (rating < PRIORITY_CONFIG.BLOCK_RATING_THRESHOLD) {
    const offenseCount = blockHistory.length;
    return {
      shouldBlock: true,
      reason: `Note moyenne (${rating.toFixed(1)}) inferieure au seuil minimum (${PRIORITY_CONFIG.BLOCK_RATING_THRESHOLD})`,
      blockType: getBlockType(offenseCount),
      offenseCount
    };
  }

  // Verification 2: Avis consecutifs negatifs
  const recentBadReviews = recentReviews
    .slice(0, PRIORITY_CONFIG.CONSECUTIVE_BAD_REVIEWS)
    .filter(r => r.rating < 3);

  if (recentBadReviews.length >= PRIORITY_CONFIG.CONSECUTIVE_BAD_REVIEWS) {
    const offenseCount = blockHistory.length;
    return {
      shouldBlock: true,
      reason: `${PRIORITY_CONFIG.CONSECUTIVE_BAD_REVIEWS} avis consecutifs avec note inferieure a 3 etoiles`,
      blockType: getBlockType(offenseCount),
      offenseCount
    };
  }

  // Verification 3: Baisse significative de note
  if (ratingHistory.length >= 2) {
    const oldRating = ratingHistory[0]?.rating || rating;
    const ratingDrop = oldRating - rating;

    if (ratingDrop >= PRIORITY_CONFIG.RATING_DROP_THRESHOLD) {
      return {
        shouldBlock: false,
        shouldWarn: true,
        reason: `Baisse de note significative: -${ratingDrop.toFixed(1)} points sur les ${PRIORITY_CONFIG.RATING_DROP_PERIOD_DAYS} derniers jours`,
        blockType: null
      };
    }
  }

  return {
    shouldBlock: false,
    reason: null,
    blockType: null
  };
}

/**
 * Determine le type de blocage selon le nombre d'infractions
 * @param {number} offenseCount - Nombre d'infractions precedentes
 * @returns {Object} - Type et duree du blocage
 */
function getBlockType(offenseCount) {
  switch (offenseCount) {
    case 0:
      return {
        type: 'TEMPORARY',
        duration: PRIORITY_CONFIG.TEMP_BLOCK_DURATION.FIRST_OFFENSE,
        label: 'Suspension temporaire (7 jours)'
      };
    case 1:
      return {
        type: 'TEMPORARY',
        duration: PRIORITY_CONFIG.TEMP_BLOCK_DURATION.SECOND_OFFENSE,
        label: 'Suspension temporaire (14 jours)'
      };
    case 2:
      return {
        type: 'TEMPORARY',
        duration: PRIORITY_CONFIG.TEMP_BLOCK_DURATION.THIRD_OFFENSE,
        label: 'Suspension temporaire (30 jours)'
      };
    default:
      return {
        type: 'PERMANENT',
        duration: PRIORITY_CONFIG.TEMP_BLOCK_DURATION.PERMANENT,
        label: 'Suspension permanente'
      };
  }
}

/**
 * Calcule le score de priorite pour le tri des prestataires
 * @param {Object} provider - Donnees du prestataire
 * @returns {number} - Score de priorite (plus eleve = plus prioritaire)
 */
export function calculatePriorityScore(provider) {
  const {
    rating = 0,
    reviewCount = 0,
    completedOrders = 0,
    responseRate = 0,
    cancellationRate = 0
  } = provider;

  // Score de base sur la note (0-50 points)
  let score = rating * 10;

  // Bonus pour le nombre d'avis (0-15 points)
  const reviewBonus = Math.min(reviewCount / 10, 15);
  score += reviewBonus;

  // Bonus pour les commandes completees (0-15 points)
  const ordersBonus = Math.min(completedOrders / 20, 15);
  score += ordersBonus;

  // Bonus pour le taux de reponse (0-10 points)
  score += (responseRate / 100) * 10;

  // Malus pour le taux d'annulation (0-10 points de penalite)
  score -= (cancellationRate / 100) * 10;

  // Normaliser entre 0 et 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Trie les prestataires par priorite
 * @param {Array} providers - Liste des prestataires
 * @returns {Array} - Liste triee par priorite decroissante
 */
export function sortProvidersByPriority(providers) {
  return [...providers].sort((a, b) => {
    const scoreA = calculatePriorityScore(a);
    const scoreB = calculatePriorityScore(b);
    return scoreB - scoreA;
  });
}

/**
 * Filtre les prestataires bloques
 * @param {Array} providers - Liste des prestataires
 * @returns {Array} - Liste sans les prestataires bloques
 */
export function filterBlockedProviders(providers) {
  return providers.filter(provider => {
    // Verifier si bloque
    if (provider.is_blocked) return false;

    // Verifier si suspension temporaire active
    if (provider.blocked_until) {
      const blockedUntil = new Date(provider.blocked_until);
      if (blockedUntil > new Date()) return false;
    }

    return true;
  });
}

/**
 * Genere un rapport de performance pour un prestataire
 * @param {Object} providerStats - Statistiques du prestataire
 * @returns {Object} - Rapport detaille
 */
export function generatePerformanceReport(providerStats) {
  const {
    rating,
    reviewCount,
    recentReviews = [],
    completedOrders = 0,
    cancelledOrders = 0,
    responseRate = 0
  } = providerStats;

  const priority = calculatePriorityLevel(rating, reviewCount);
  const blockStatus = checkBlockStatus(providerStats);
  const priorityScore = calculatePriorityScore(providerStats);

  // Calcul des tendances
  const last5Reviews = recentReviews.slice(0, 5);
  const avgRecentRating = last5Reviews.length > 0
    ? last5Reviews.reduce((sum, r) => sum + r.rating, 0) / last5Reviews.length
    : rating;

  const trend = avgRecentRating > rating ? 'UP' : avgRecentRating < rating ? 'DOWN' : 'STABLE';

  return {
    priority,
    priorityScore,
    blockStatus,
    metrics: {
      rating,
      reviewCount,
      completedOrders,
      cancelledOrders,
      cancellationRate: completedOrders > 0
        ? (cancelledOrders / (completedOrders + cancelledOrders) * 100).toFixed(1)
        : 0,
      responseRate
    },
    trend: {
      direction: trend,
      recentRating: avgRecentRating.toFixed(1),
      icon: trend === 'UP' ? '📈' : trend === 'DOWN' ? '📉' : '➡️'
    },
    recommendations: generateRecommendations(providerStats, blockStatus)
  };
}

/**
 * Genere des recommandations pour ameliorer la performance
 * @param {Object} providerStats - Statistiques
 * @param {Object} blockStatus - Statut de blocage
 * @returns {Array} - Liste de recommandations
 */
function generateRecommendations(providerStats, blockStatus) {
  const recommendations = [];
  const { rating, responseRate, cancelledOrders, completedOrders } = providerStats;

  if (rating < PRIORITY_CONFIG.GOOD_RATING) {
    recommendations.push({
      type: 'warning',
      message: 'Ameliorez la qualite de vos prestations pour augmenter votre note',
      priority: 'high'
    });
  }

  if (responseRate < 80) {
    recommendations.push({
      type: 'info',
      message: 'Repondez plus rapidement aux demandes pour ameliorer votre taux de reponse',
      priority: 'medium'
    });
  }

  const cancellationRate = completedOrders > 0
    ? (cancelledOrders / (completedOrders + cancelledOrders) * 100)
    : 0;

  if (cancellationRate > 10) {
    recommendations.push({
      type: 'warning',
      message: 'Reduisez vos annulations pour maintenir une bonne reputation',
      priority: 'high'
    });
  }

  if (blockStatus.shouldWarn) {
    recommendations.push({
      type: 'danger',
      message: blockStatus.reason,
      priority: 'critical'
    });
  }

  return recommendations;
}

export default {
  PRIORITY_CONFIG,
  calculatePriorityLevel,
  checkBlockStatus,
  calculatePriorityScore,
  sortProvidersByPriority,
  filterBlockedProviders,
  generatePerformanceReport
};
