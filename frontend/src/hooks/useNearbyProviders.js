'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '@/lib/apiClient';

/**
 * Hook pour rechercher et gérer les prestataires à proximité
 *
 * @param {number} serviceId - ID du service
 * @param {Object} location - Position du client {lat, lng}
 * @param {string} formula - Type de formule sélectionné
 * @param {Object} options - Options supplémentaires
 * @returns {Object} État et fonctions de gestion
 */
export function useNearbyProviders(serviceId, location, formula = 'standard', options = {}) {
  const [providers, setProviders] = useState([]);
  const [nearest, setNearest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalFound, setTotalFound] = useState(0);
  const [searchParams, setSearchParams] = useState(null);

  // Options par défaut
  // NOTE: Mode test activé pour afficher tous les prestataires (même non vérifiés)
  const {
    radius = 100, // Augmenté à 100km pour le mode test
    onlyAvailable = false, // Mode test: afficher tous les prestataires
    scheduledTime = null,
    autoFetch = true,
    debounceMs = 500,
    testMode = true // Mode test: ignorer la vérification des prestataires
  } = options;

  // Référence pour debounce
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Récupère les prestataires à proximité
   */
  const fetchProviders = useCallback(async (customParams = {}) => {
    // Validation des prérequis
    if (!serviceId || !location?.lat || !location?.lng) {
      return;
    }

    // Annuler la requête précédente si en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const params = {
      lat: location.lat,
      lng: location.lng,
      radius: customParams.radius ?? radius,
      formula: customParams.formula ?? formula,
      only_available: customParams.onlyAvailable ?? onlyAvailable,
      test_mode: customParams.testMode ?? testMode ? 'true' : 'false',
      ...(customParams.scheduledTime || scheduledTime ? {
        scheduled_time: customParams.scheduledTime || scheduledTime
      } : {})
    };

    try {
      console.log('🔍 [NEARBY] Recherche prestataires:', {
        serviceId,
        params,
        url: `/services/${serviceId}/nearby-providers`
      });

      const response = await apiClient.getNearbyProviders(serviceId, params);

      console.log('📍 [NEARBY] Réponse API:', response);

      if (response.success) {
        const data = response.data || response;

        console.log('👥 [NEARBY] Prestataires trouvés:', {
          nearest: data.nearest,
          alternatives: data.alternatives,
          total_found: data.total_found,
          search_params: data.search_params
        });

        setNearest(data.nearest || null);
        setProviders(data.alternatives || []);
        setTotalFound(data.total_found || 0);
        setSearchParams(data.search_params || params);

        return {
          nearest: data.nearest,
          alternatives: data.alternatives,
          totalFound: data.total_found
        };
      } else {
        throw new Error(response.message || 'Erreur lors de la recherche');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Requête annulée, ne pas traiter comme erreur
      }

      console.error('Erreur recherche prestataires:', err);
      setError(err.message || 'Erreur de connexion');
      setNearest(null);
      setProviders([]);
      setTotalFound(0);
    } finally {
      setLoading(false);
    }
  }, [serviceId, location, radius, formula, onlyAvailable, scheduledTime, testMode]);

  /**
   * Version avec debounce pour éviter trop de requêtes
   */
  const fetchProvidersDebounced = useCallback((customParams = {}) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchProviders(customParams);
    }, debounceMs);
  }, [fetchProviders, debounceMs]);

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setProviders([]);
    setNearest(null);
    setError(null);
    setTotalFound(0);
    setSearchParams(null);
  }, []);

  /**
   * Sélectionne un prestataire
   */
  const selectProvider = useCallback((provider) => {
    // Déplace le prestataire sélectionné en "nearest"
    if (provider && provider.id !== nearest?.id) {
      const newAlternatives = [nearest, ...providers].filter(p => p && p.id !== provider.id);
      setNearest(provider);
      setProviders(newAlternatives.slice(0, 5));
    }
    return provider;
  }, [nearest, providers]);

  /**
   * Filtre les prestataires
   */
  const filterProviders = useCallback((filterFn) => {
    if (!filterFn) return [nearest, ...providers].filter(Boolean);
    return [nearest, ...providers].filter(p => p && filterFn(p));
  }, [nearest, providers]);

  /**
   * Obtient tous les prestataires (nearest + alternatives)
   */
  const getAllProviders = useCallback(() => {
    return [nearest, ...providers].filter(Boolean);
  }, [nearest, providers]);

  /**
   * Obtient uniquement les prestataires disponibles maintenant
   */
  const getAvailableNow = useCallback(() => {
    return filterProviders(p => p.is_available_now);
  }, [filterProviders]);

  /**
   * Obtient les prestataires dans un rayon donné
   */
  const getWithinRadius = useCallback((maxDistance) => {
    return filterProviders(p => p.distance <= maxDistance);
  }, [filterProviders]);

  /**
   * Trie les prestataires par critère
   */
  const sortBy = useCallback((criteria = 'distance') => {
    const all = getAllProviders();

    switch (criteria) {
      case 'distance':
        return [...all].sort((a, b) => a.distance - b.distance);
      case 'price':
        return [...all].sort((a, b) => a.calculated_price - b.calculated_price);
      case 'rating':
        return [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return all;
    }
  }, [getAllProviders]);

  // Effet pour le chargement automatique
  useEffect(() => {
    if (autoFetch && serviceId && location?.lat && location?.lng) {
      fetchProvidersDebounced();
    }

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [serviceId, location?.lat, location?.lng, formula, autoFetch, fetchProvidersDebounced]);

  return {
    // État
    providers,
    nearest,
    loading,
    error,
    totalFound,
    searchParams,
    hasProviders: totalFound > 0,

    // Actions
    fetchProviders,
    refetch: fetchProviders,
    reset,
    selectProvider,

    // Utilitaires de filtrage
    getAllProviders,
    getAvailableNow,
    getWithinRadius,
    filterProviders,
    sortBy
  };
}

// =============================================================================
// MODE DÉVELOPPEMENT - Position simulée au Maroc
// Mettre à false pour utiliser la vraie géolocalisation
// =============================================================================
const DEV_MODE_LOCATION = true;
const DEV_LOCATION = {
  lat: 31.6295,  // Marrakech, Maroc (Jemaa el-Fna)
  lng: -7.9811,
  accuracy: 10,
  timestamp: Date.now(),
  manual: true,
  devMode: true
};

/**
 * Hook pour obtenir la géolocalisation du client
 *
 * @param {Object} options - Options de géolocalisation
 * @returns {Object} État de la géolocalisation
 */
export function useClientLocation(options = {}) {
  const [location, setLocation] = useState(DEV_MODE_LOCATION ? DEV_LOCATION : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState(DEV_MODE_LOCATION ? 'granted' : 'prompt');

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes de cache
    autoRequest = true,
    forceDevMode = DEV_MODE_LOCATION // Permet de forcer le mode dev depuis l'appelant
  } = options;

  /**
   * Demande la position du client
   */
  const requestLocation = useCallback(async () => {
    // Mode développement : retourner position simulée au Maroc
    if (forceDevMode) {
      console.log('🗺️ [DEV MODE] Position simulée à Casablanca, Maroc');
      setLocation(DEV_LOCATION);
      setPermissionState('granted');
      return DEV_LOCATION;
    }

    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par ce navigateur');
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          setLocation(loc);
          setLoading(false);
          setPermissionState('granted');
          resolve(loc);
        },
        (err) => {
          let message = 'Erreur de géolocalisation';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = 'Accès à la localisation refusé';
              setPermissionState('denied');
              break;
            case err.POSITION_UNAVAILABLE:
              message = 'Position non disponible';
              break;
            case err.TIMEOUT:
              message = 'Délai d\'attente dépassé';
              break;
          }
          setError(message);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge, forceDevMode]);

  /**
   * Définit manuellement une position
   */
  const setManualLocation = useCallback((lat, lng) => {
    setLocation({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      accuracy: null,
      timestamp: Date.now(),
      manual: true
    });
    setError(null);
  }, []);

  /**
   * Vérifie l'état de la permission
   */
  const checkPermission = useCallback(async () => {
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionState(result.state);

        result.onchange = () => {
          setPermissionState(result.state);
        };

        return result.state;
      } catch {
        // Permissions API non supportée
        return 'unknown';
      }
    }
    return 'unknown';
  }, []);

  // Effet pour le chargement automatique
  useEffect(() => {
    // En mode dev, on a déjà la position, pas besoin de demander
    if (forceDevMode) {
      console.log('🗺️ [DEV MODE] Géolocalisation simulée activée - Casablanca, Maroc');
      return;
    }

    checkPermission();

    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest, requestLocation, checkPermission, forceDevMode]);

  return {
    location,
    loading,
    error,
    permissionState,
    requestLocation,
    setManualLocation,
    checkPermission,
    isLocated: !!location,
    isPermissionDenied: permissionState === 'denied'
  };
}

export default useNearbyProviders;
