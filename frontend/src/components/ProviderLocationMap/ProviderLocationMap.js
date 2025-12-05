'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ProviderLocationMap.module.scss';
import apiClient from '@/lib/apiClient';

/**
 * Composant pour le client : Visualiser la position du prestataire en temps réel
 * La carte iframe est masquée par défaut pour éviter les problèmes de scroll
 */
export default function ProviderLocationMap({ orderId, clientAddress, clientLat, clientLng }) {
  const [providerLocation, setProviderLocation] = useState(null);
  const [mapUrl, setMapUrl] = useState(null);
  const [showMap, setShowMap] = useState(false); // Carte masquée par défaut
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const clientLatNum = clientLat ? parseFloat(clientLat) : null;
  const clientLngNum = clientLng ? parseFloat(clientLng) : null;

  const updateMapUrl = useCallback((lat, lng) => {
    let centerLat = lat;
    let centerLng = lng;

    if (clientLatNum && clientLngNum) {
      centerLat = (lat + clientLatNum) / 2;
      centerLng = (lng + clientLngNum) / 2;
    }

    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.02},${centerLat - 0.02},${centerLng + 0.02},${centerLat + 0.02}&layer=mapnik&marker=${lat},${lng}`;
    setMapUrl(url);
  }, [clientLatNum, clientLngNum]);

  const fetchProviderLocation = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const response = await apiClient.getProviderLocation(orderId);

      if (!isMountedRef.current) return;

      if (response.success && response.data) {
        const { latitude, longitude, updated_at } = response.data;

        if (latitude && longitude) {
          const newLat = parseFloat(latitude);
          const newLng = parseFloat(longitude);

          setProviderLocation({
            lat: newLat,
            lng: newLng,
            updatedAt: updated_at,
          });
          setLastUpdate(new Date());
          setError('');

          // Mettre à jour l'URL de la carte seulement si elle est affichée
          if (showMap) {
            updateMapUrl(newLat, newLng);
          }
        } else {
          setError('Le prestataire n\'a pas encore partagé sa position');
        }
      } else {
        setError('Impossible de récupérer la position du prestataire');
      }
    } catch (err) {
      // Silently ignore fetch errors
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [orderId, showMap, updateMapUrl]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchProviderLocation();

    // Polling réduit à 10 secondes pour moins de mises à jour
    intervalRef.current = setInterval(fetchProviderLocation, 10000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchProviderLocation]);

  // Générer l'URL de la carte quand on l'affiche
  useEffect(() => {
    if (showMap && providerLocation) {
      updateMapUrl(providerLocation.lat, providerLocation.lng);
    }
  }, [showMap, providerLocation, updateMapUrl]);

  const calculateDistance = () => {
    if (!providerLocation || !clientLatNum || !clientLngNum) return null;

    const R = 6371;
    const dLat = toRad(clientLatNum - providerLocation.lat);
    const dLon = toRad(clientLngNum - providerLocation.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(providerLocation.lat)) *
        Math.cos(toRad(clientLatNum)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value) => (value * Math.PI) / 180;

  const formatDistance = (distanceKm) => {
    if (!distanceKm) return 'N/A';
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  };

  const estimatedTime = (distanceKm) => {
    if (!distanceKm) return 'N/A';
    const hours = distanceKm / 30;
    const minutes = Math.round(hours * 60);
    if (minutes < 1) return '< 1 min';
    return `~${minutes} min`;
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return 'N/A';
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const openInGoogleMaps = () => {
    if (!providerLocation) return;
    const url = `https://www.google.com/maps?q=${providerLocation.lat},${providerLocation.lng}`;
    window.open(url, '_blank');
  };

  const openDirections = () => {
    if (!providerLocation || !clientLatNum || !clientLngNum) return;
    const url = `https://www.google.com/maps/dir/${providerLocation.lat},${providerLocation.lng}/${clientLatNum},${clientLngNum}`;
    window.open(url, '_blank');
  };

  const handleToggleMap = () => {
    setShowMap(prev => !prev);
  };

  const distance = calculateDistance();

  if (loading) {
    return (
      <div className={styles.providerLocationMap}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Chargement de la position...</p>
        </div>
      </div>
    );
  }

  if (error && !providerLocation) {
    return (
      <div className={styles.providerLocationMap}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>📍</span>
          <h3>Position non disponible</h3>
          <p>{error}</p>
          <p className={styles.hint}>
            Le prestataire partagera sa position quand il sera en route vers vous.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.providerLocationMap}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.icon}>🚗</span>
          <div>
            <h3 className={styles.title}>Suivi en temps réel</h3>
            <p className={styles.subtitle}>Mis à jour il y a {getTimeSinceUpdate()}</p>
          </div>
        </div>
        <div className={styles.statusBadge}>
          <span className={styles.pulse}></span>
          EN DIRECT
        </div>
      </div>

      {distance !== null && (
        <div className={styles.distanceInfo}>
          <div className={styles.distanceCard}>
            <span className={styles.distanceIcon}>📏</span>
            <div>
              <div className={styles.distanceValue}>{formatDistance(distance)}</div>
              <div className={styles.distanceLabel}>Distance</div>
            </div>
          </div>

          <div className={styles.distanceCard}>
            <span className={styles.distanceIcon}>⏱️</span>
            <div>
              <div className={styles.distanceValue}>{estimatedTime(distance)}</div>
              <div className={styles.distanceLabel}>Temps estimé</div>
            </div>
          </div>
        </div>
      )}

      {/* Coordonnées du prestataire */}
      <div className={styles.mapOverlay}>
        <div className={styles.locationCards}>
          <div className={styles.locationCard}>
            <span className={styles.locationIcon}>🚗</span>
            <div>
              <strong>Prestataire</strong>
              <p>{providerLocation?.lat.toFixed(5)}, {providerLocation?.lng.toFixed(5)}</p>
            </div>
          </div>

          {clientLatNum && clientLngNum && (
            <div className={styles.locationCard}>
              <span className={styles.locationIcon}>🏠</span>
              <div>
                <strong>Vous</strong>
                <p>{clientAddress || `${clientLatNum.toFixed(5)}, ${clientLngNum.toFixed(5)}`}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton pour afficher/masquer la carte */}
      <div className={styles.mapToggle}>
        <button onClick={handleToggleMap} className={styles.toggleButton}>
          {showMap ? '🗺️ Masquer la carte' : '🗺️ Afficher la carte'}
        </button>
      </div>

      {/* Carte iframe - affichée seulement si showMap est true */}
      {showMap && (
        <div className={styles.mapWrapper}>
          {mapUrl && (
            <iframe
              src={mapUrl}
              className={styles.mapIframe}
              frameBorder="0"
              scrolling="no"
              title="Position du prestataire"
              loading="lazy"
              tabIndex="-1"
            />
          )}
        </div>
      )}

      <div className={styles.mapActions}>
        <button onClick={openInGoogleMaps} className={styles.mapButton}>
          🗺️ Google Maps
        </button>
        {clientLatNum && clientLngNum && (
          <button onClick={openDirections} className={styles.mapButton}>
            🧭 Itinéraire
          </button>
        )}
        {providerLocation && (
          <a
            href={`https://www.waze.com/ul?ll=${providerLocation.lat},${providerLocation.lng}&navigate=yes`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapButton}
          >
            🚗 Waze
          </a>
        )}
      </div>

      <div className={styles.refreshInfo}>
        <p>🔄 Position mise à jour toutes les 10 secondes</p>
      </div>
    </div>
  );
}
