'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './LocationTracker.module.scss';
import apiClient from '@/lib/apiClient';

export default function LocationTracker({ orderId, clientAddress = null }) {
  const [providerLocation, setProviderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const mapRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    fetchLocation();
    // Polling toutes les 10 secondes
    pollIntervalRef.current = setInterval(fetchLocation, 10000);
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (providerLocation && mapRef.current) {
      updateMap();
    }
  }, [providerLocation]);

  // Empêcher le scroll automatique au chargement de l'iframe
  useEffect(() => {
    const preventScroll = () => {
      const scrollY = window.scrollY;
      const timeout = setTimeout(() => {
        if (Math.abs(window.scrollY - scrollY) > 100) {
          window.scrollTo(0, scrollY);
        }
      }, 100);
      return () => clearTimeout(timeout);
    };

    if (providerLocation) {
      const cleanup = preventScroll();
      return cleanup;
    }
  }, [providerLocation]);

  const fetchLocation = async () => {
    try {
      const response = await apiClient.getProviderLocation(orderId);
      if (response.success && response.data.latitude && response.data.longitude) {
        setProviderLocation({
          lat: parseFloat(response.data.latitude),
          lng: parseFloat(response.data.longitude)
        });
        setLastUpdate(new Date(response.data.updated_at));
        setError('');
      }
    } catch (err) {
      if (!providerLocation) {
        setError('Position du prestataire non disponible');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateMap = () => {
    if (!providerLocation) return;

    // Construire l'URL OpenStreetMap
    const { lat, lng } = providerLocation;
    const zoom = 15;
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;

    if (mapRef.current) {
      mapRef.current.src = mapUrl;
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    const now = new Date();
    const diffMs = now - lastUpdate;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffSecs < 60) return `Il y a ${diffSecs} secondes`;
    if (diffMins < 60) return `Il y a ${diffMins} minutes`;
    return lastUpdate.toLocaleTimeString('fr-FR');
  };

  const openInMaps = () => {
    if (!providerLocation) return;
    const { lat, lng } = providerLocation;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const getDirections = () => {
    if (!providerLocation) return;
    const { lat, lng } = providerLocation;
    // Ouvre Google Maps avec les directions depuis la position du prestataire
    window.open(`https://www.google.com/maps/dir/${lat},${lng}/`, '_blank');
  };

  if (loading) {
    return (
      <div className={styles.trackerContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Localisation du prestataire...</p>
        </div>
      </div>
    );
  }

  if (error && !providerLocation) {
    return (
      <div className={styles.trackerContainer}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>📍</div>
          <p>{error}</p>
          <p className={styles.errorHint}>
            Le prestataire n'a pas encore partagé sa position.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.trackerContainer}>
      <div className={styles.trackerHeader}>
        <h3>Suivi en temps réel</h3>
        {lastUpdate && (
          <span className={styles.lastUpdate}>
            Mis à jour : {formatLastUpdate()}
          </span>
        )}
      </div>

      <div className={styles.mapContainer}>
        {providerLocation ? (
          <iframe
            ref={(el) => {
              if (el && !mapRef.current) {
                scrollPosRef.current = window.scrollY;
              }
              mapRef.current = el;
            }}
            className={styles.map}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${providerLocation.lng - 0.01},${providerLocation.lat - 0.01},${providerLocation.lng + 0.01},${providerLocation.lat + 0.01}&layer=mapnik&marker=${providerLocation.lat},${providerLocation.lng}`}
            frameBorder="0"
            scrolling="no"
            title="Position du prestataire"
            loading="lazy"
            tabIndex="-1"
            onLoad={(e) => {
              e.target.blur();
              window.scrollTo(0, scrollPosRef.current);
            }}
          />
        ) : (
          <div className={styles.noMap}>Carte non disponible</div>
        )}
      </div>

      <div className={styles.locationInfo}>
        <div className={styles.coordinatesGrid}>
          <div className={styles.coordinate}>
            <span className={styles.label}>Latitude</span>
            <span className={styles.value}>
              {providerLocation?.lat.toFixed(6) || 'N/A'}
            </span>
          </div>
          <div className={styles.coordinate}>
            <span className={styles.label}>Longitude</span>
            <span className={styles.value}>
              {providerLocation?.lng.toFixed(6) || 'N/A'}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={openInMaps}
            disabled={!providerLocation}
          >
            🗺️ Voir sur Google Maps
          </button>
          <button
            className={styles.actionBtn}
            onClick={getDirections}
            disabled={!providerLocation}
          >
            🚗 Itinéraire
          </button>
          <button
            className={styles.refreshBtn}
            onClick={fetchLocation}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      <div className={styles.statusIndicator}>
        <span className={styles.pulsingDot}></span>
        <span>Suivi actif - Mise à jour automatique</span>
      </div>
    </div>
  );
}
