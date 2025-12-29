/**
 * Utilitaires de géolocalisation - GlamGo Mobile
 * Calcul de distance entre deux points GPS
 */

/**
 * Calcule la distance en km entre deux points GPS (formule de Haversine)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Vérifie si une commande est dans le rayon d'intervention
 */
export const isOrderInRange = (
  providerLat: number,
  providerLon: number,
  orderLat: number | undefined,
  orderLon: number | undefined,
  radiusKm: number = 50
): boolean => {
  // Si pas de coordonnées pour la commande, on l'inclut par défaut
  if (!orderLat || !orderLon) return true;

  const distance = calculateDistance(providerLat, providerLon, orderLat, orderLon);
  return distance <= radiusKm;
};

export default {
  calculateDistance,
  isOrderInRange,
};
