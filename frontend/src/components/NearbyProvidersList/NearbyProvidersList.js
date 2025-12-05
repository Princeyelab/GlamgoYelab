'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import styles from './NearbyProvidersList.module.scss';
import ProviderCard from '@/components/ProviderCard';
import { useNearbyProviders, useClientLocation } from '@/hooks/useNearbyProviders';

// Import dynamique de la carte Leaflet (côté client uniquement)
const ProvidersMap = dynamic(() => import('./ProvidersMap'), {
  ssr: false,
  loading: () => (
    <div className={styles.mapLoading}>
      <div className={styles.spinner} />
      <span>Chargement de la carte...</span>
    </div>
  )
});

/**
 * Liste des prestataires à proximité avec carte interactive
 *
 * @param {number} serviceId - ID du service
 * @param {Object} clientLocation - Position du client (optionnel, utilisera géolocalisation)
 * @param {string} formula - Type de formule sélectionné
 * @param {Function} onProviderSelect - Callback de sélection
 * @param {number} selectedProviderId - ID du prestataire sélectionné
 * @param {string} scheduledTime - Heure prévue
 */
export default function NearbyProvidersList({
  serviceId,
  clientLocation: propLocation,
  formula = 'standard',
  onProviderSelect,
  selectedProviderId,
  scheduledTime
}) {
  // État local
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [showMap, setShowMap] = useState(true);
  const [radius, setRadius] = useState(30);

  // Géolocalisation du client
  const {
    location: geoLocation,
    loading: geoLoading,
    error: geoError,
    requestLocation,
    setManualLocation,
    isPermissionDenied
  } = useClientLocation({ autoRequest: !propLocation });

  // Position finale (prop ou géoloc)
  const clientLocation = propLocation || geoLocation;

  // Hook de recherche des prestataires
  const {
    providers,
    nearest,
    loading,
    error,
    totalFound,
    hasProviders,
    refetch,
    getAllProviders,
    getAvailableNow,
    getWithinRadius
  } = useNearbyProviders(serviceId, clientLocation, formula, {
    radius,
    scheduledTime,
    autoFetch: true
  });

  // Liste filtrée et triée
  const filteredProviders = useMemo(() => {
    let result = getAllProviders();

    // Appliquer le filtre
    switch (filter) {
      case 'available_now':
        result = result.filter(p => p.is_available_now);
        break;
      case 'within_5km':
        result = result.filter(p => p.distance <= 5);
        break;
      case 'within_10km':
        result = result.filter(p => p.distance <= 10);
        break;
    }

    // Appliquer le tri
    switch (sortBy) {
      case 'distance':
        result.sort((a, b) => a.distance - b.distance);
        break;
      case 'price':
        result.sort((a, b) => a.calculated_price - b.calculated_price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return result;
  }, [getAllProviders, filter, sortBy]);

  // Gestion de la sélection
  const handleProviderSelect = (provider) => {
    if (onProviderSelect) {
      onProviderSelect(provider);
    }
  };

  // Recharger lors du changement de rayon
  useEffect(() => {
    if (clientLocation) {
      refetch({ radius });
    }
  }, [radius]);

  // Position par défaut (Marrakech - Jemaa el-Fna)
  const defaultLocation = { lat: 31.6258, lng: -7.9891 };

  // Si pas de position et permission refusée
  if (!clientLocation && isPermissionDenied) {
    return (
      <div className={styles.nearbyProviders}>
        <div className={styles.locationError}>
          <div className={styles.errorIcon}>📍</div>
          <h3>Localisation requise</h3>
          <p>Pour voir les prestataires à proximité, nous avons besoin de votre position.</p>
          <div className={styles.locationOptions}>
            <button
              className={styles.btnPrimary}
              onClick={() => setManualLocation(defaultLocation.lat, defaultLocation.lng)}
            >
              Utiliser Marrakech centre
            </button>
            <button
              className={styles.btnSecondary}
              onClick={requestLocation}
            >
              Réessayer la géolocalisation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chargement de la position
  if (!clientLocation && geoLoading) {
    return (
      <div className={styles.nearbyProviders}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Récupération de votre position...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.nearbyProviders}>
      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Prestataires à proximité</h2>
          <span className={styles.count}>
            {totalFound} {totalFound > 1 ? 'prestataires trouvés' : 'prestataire trouvé'}
          </span>
        </div>

        {/* Toggle carte */}
        <button
          className={`${styles.mapToggle} ${showMap ? styles.active : ''}`}
          onClick={() => setShowMap(!showMap)}
        >
          <span className={styles.mapIcon}>🗺️</span>
          {showMap ? 'Masquer carte' : 'Afficher carte'}
        </button>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Filtrer :</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tous</option>
            <option value="available_now">Disponibles maintenant</option>
            <option value="within_5km">À moins de 5 km</option>
            <option value="within_10km">À moins de 10 km</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Trier par :</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="distance">Distance</option>
            <option value="price">Prix</option>
            <option value="rating">Note</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Rayon :</label>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={30}>30 km</option>
            <option value={50}>50 km</option>
          </select>
        </div>
      </div>

      {/* Carte */}
      {showMap && clientLocation && (
        <div className={styles.mapContainer}>
          <ProvidersMap
            clientLocation={clientLocation}
            providers={filteredProviders}
            nearest={nearest}
            radius={radius}
            selectedProviderId={selectedProviderId}
            onProviderSelect={handleProviderSelect}
          />
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
          <button onClick={refetch}>Réessayer</button>
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <span>Recherche des prestataires...</span>
        </div>
      )}

      {/* Liste des prestataires */}
      <div className={styles.providersList}>
        {!loading && filteredProviders.length === 0 ? (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>🔍</div>
            <h3>Aucun prestataire trouvé</h3>
            <p>Essayez d'augmenter le rayon de recherche ou de modifier les filtres.</p>
            <button className={styles.btnSecondary} onClick={() => setRadius(50)}>
              Étendre à 50 km
            </button>
          </div>
        ) : (
          filteredProviders.map((provider, index) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isNearest={nearest && provider.id === nearest.id}
              selected={selectedProviderId === provider.id}
              onSelect={handleProviderSelect}
              serviceId={serviceId}
              formulaType={formula}
              clientLocation={clientLocation}
            />
          ))
        )}
      </div>
    </div>
  );
}
