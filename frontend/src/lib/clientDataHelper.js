/**
 * Helper pour gérer les données client qui peuvent être manquantes dans l'API
 * Similaire à providerDataHelper.js mais pour les clients
 */

const CLIENT_TEMP_DATA_KEY = 'client_temp_data';

/**
 * Sauvegarde les données temporaires du client après l'inscription
 * Ces données seront fusionnées avec les données du backend si celui-ci ne les retourne pas
 */
export function saveClientTempData(data) {
  const tempData = {
    date_of_birth: data.date_of_birth || null,
    address: data.address || null,
    city: data.city || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    phone: data.phone || null,
  };

  try {
    localStorage.setItem(CLIENT_TEMP_DATA_KEY, JSON.stringify(tempData));
    console.log('✅ Données client temporaires sauvegardées:', tempData);
  } catch (error) {
    console.error('❌ Erreur sauvegarde données client:', error);
  }
}

/**
 * Récupère les données temporaires du client
 */
export function getClientTempData() {
  try {
    const data = localStorage.getItem(CLIENT_TEMP_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Erreur lecture données client:', error);
    return null;
  }
}

/**
 * Supprime les données temporaires du client
 */
export function clearClientTempData() {
  try {
    localStorage.removeItem(CLIENT_TEMP_DATA_KEY);
    console.log('🗑️ Données client temporaires supprimées');
  } catch (error) {
    console.error('❌ Erreur suppression données client:', error);
  }
}

/**
 * Fusionne les données du backend avec les données temporaires locales
 * Priorité: Backend > LocalStorage
 * Si un champ est vide/null dans le backend, on utilise la valeur locale
 */
export function mergeClientData(backendData) {
  if (!backendData) return backendData;

  const tempData = getClientTempData();
  if (!tempData) {
    console.log('ℹ️ Pas de données temporaires à fusionner');
    return backendData;
  }

  const merged = { ...backendData };

  // Liste des champs à fusionner
  const fieldsToMerge = ['date_of_birth', 'address', 'city', 'latitude', 'longitude', 'phone'];

  fieldsToMerge.forEach(field => {
    // Si le champ est vide/null dans le backend mais existe en local
    if ((!merged[field] || merged[field] === '') && tempData[field]) {
      merged[field] = tempData[field];
      console.log(`🔄 Champ "${field}" fusionné depuis les données locales:`, tempData[field]);
    }
  });

  console.log('✅ Données client fusionnées:', merged);
  return merged;
}

/**
 * Met à jour les données temporaires avec de nouvelles valeurs
 * Utilisé lors de la mise à jour du profil
 */
export function updateClientTempData(updates) {
  const currentData = getClientTempData() || {};
  const newData = { ...currentData, ...updates };

  try {
    localStorage.setItem(CLIENT_TEMP_DATA_KEY, JSON.stringify(newData));
    console.log('✅ Données client temporaires mises à jour:', newData);
  } catch (error) {
    console.error('❌ Erreur mise à jour données client:', error);
  }
}
