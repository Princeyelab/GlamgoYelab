/**
 * Helper pour fusionner les données du profil prestataire
 * Solution temporaire en attendant que le backend retourne tous les champs
 */

/**
 * Fusionne les données du backend avec les données stockées localement
 * @param {Object} backendData - Données reçues du backend
 * @returns {Object} - Données complètes fusionnées
 */
export function mergeProviderData(backendData) {
  // Récupérer les données temporaires stockées lors de l'inscription
  const tempDataStr = localStorage.getItem('provider_temp_data');
  let tempData = {};

  if (tempDataStr) {
    try {
      tempData = JSON.parse(tempDataStr);
    } catch (e) {
      console.error('Erreur lors du parsing des données temporaires:', e);
    }
  }

  // Mapper les champs du backend vers les noms attendus par le frontend
  const mappedBackendData = {
    ...backendData,
    // Mapping des noms de champs differents
    intervention_radius: backendData.intervention_radius_km || backendData.intervention_radius || 10,
    is_active: backendData.is_available !== undefined ? backendData.is_available : backendData.is_active,
    latitude: backendData.latitude || backendData.current_latitude,
    longitude: backendData.longitude || backendData.current_longitude,
  };

  // Parser les champs JSON si necessaire
  const jsonFields = ['specialties', 'coverage_area', 'availability_schedule'];
  jsonFields.forEach(field => {
    if (mappedBackendData[field] && typeof mappedBackendData[field] === 'string') {
      try {
        mappedBackendData[field] = JSON.parse(mappedBackendData[field]);
      } catch (e) {
        console.error(`Erreur parsing ${field}:`, e);
      }
    }
  });

  // Fusionner : priorité aux données du backend, puis aux données locales
  const mergedData = {
    ...tempData,
    ...mappedBackendData,
  };

  // Garder les données locales pour les champs non renvoyés par le backend
  const localOnlyFields = [
    'date_of_birth', 'cin_number', 'professional_license',
    'address', 'city', 'bio', 'experience_years', 'starting_price',
    'specialties', 'coverage_area', 'availability_schedule',
    'latitude', 'longitude', 'intervention_radius' // Coordonnées GPS essentielles
  ];

  localOnlyFields.forEach(field => {
    // Si le backend n'a pas renvoyé ce champ ou l'a renvoyé null/vide, utiliser les données locales
    const backendValue = mappedBackendData[field];
    const localValue = tempData[field];

    if ((backendValue === null || backendValue === undefined || backendValue === '') && localValue) {
      mergedData[field] = localValue;
      console.log(`📌 [MERGE] Champ "${field}": backend=${backendValue} → local=${localValue}`);
    }
  });

  // S'assurer que specialties et coverage_area sont des tableaux
  if (mergedData.specialties) {
    if (typeof mergedData.specialties === 'string') {
      try {
        mergedData.specialties = JSON.parse(mergedData.specialties);
      } catch (e) {
        console.error('Erreur parsing specialties:', e);
        mergedData.specialties = [];
      }
    }
  } else {
    mergedData.specialties = [];
  }

  if (mergedData.coverage_area) {
    if (typeof mergedData.coverage_area === 'string') {
      try {
        mergedData.coverage_area = JSON.parse(mergedData.coverage_area);
      } catch (e) {
        console.error('Erreur parsing coverage_area:', e);
        mergedData.coverage_area = [];
      }
    }
  } else {
    mergedData.coverage_area = [];
  }

  console.log('🔄 [PROVIDER DATA HELPER] Données fusionnées:', mergedData);
  console.log('🔄 [PROVIDER DATA HELPER] Specialties:', mergedData.specialties);

  return mergedData;
}

/**
 * Sauvegarde les données temporaires du prestataire
 * À appeler lors de l'inscription ou de la mise à jour du profil
 * @param {Object} data - Données à sauvegarder
 */
export function saveProviderTempData(data) {
  // Récupérer les données existantes pour ne pas les écraser
  const existingDataStr = localStorage.getItem('provider_temp_data');
  let existingData = {};
  if (existingDataStr) {
    try {
      existingData = JSON.parse(existingDataStr);
    } catch (e) {
      console.error('Erreur parsing données existantes:', e);
    }
  }

  // Fusionner avec les nouvelles données (ne pas écraser avec des valeurs vides)
  const tempData = {
    ...existingData,
  };

  // Mettre à jour seulement les champs qui ont une valeur
  const fieldsToSave = [
    'email', 'cin_number', 'date_of_birth',
    'address', 'city', 'latitude', 'longitude',
    'bio', 'experience_years', 'specialties', 'coverage_area',
    'starting_price', 'intervention_radius', 'professional_license',
    'first_name', 'last_name', 'phone', 'availability_schedule'
  ];

  fieldsToSave.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      tempData[field] = data[field];
    }
  });

  localStorage.setItem('provider_temp_data', JSON.stringify(tempData));
  console.log('💾 [PROVIDER DATA HELPER] Données temporaires sauvegardées:', tempData);
}

/**
 * Nettoie les données temporaires
 * À appeler quand le backend retournera tous les champs
 */
export function clearProviderTempData() {
  localStorage.removeItem('provider_temp_data');
  console.log('🗑️ [PROVIDER DATA HELPER] Données temporaires supprimées');
}
