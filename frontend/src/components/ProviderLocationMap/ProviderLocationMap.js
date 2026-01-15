'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ProviderLocationMap.module.scss';
import apiClient from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Composant pour le client : Visualiser la position du prestataire en temps réel
 * La carte iframe est masquée par défaut pour éviter les problèmes de scroll
 */
export default function ProviderLocationMap({ orderId, clientAddress, clientLat, clientLng, providerName, providerAvatar, uploadsBaseUrl }) {
  const { t, isRTL, toArabicNumerals } = useLanguage();
  const [providerLocation, setProviderLocation] = useState(null);
  const [mapUrl, setMapUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const clientLatNum = clientLat ? parseFloat(clientLat) : null;
  const clientLngNum = clientLng ? parseFloat(clientLng) : null;

  const updateMapUrl = useCallback((lat, lng) => {
    if (!clientLatNum || !clientLngNum) {
      // Si pas de position client, centrer sur le prestataire
      const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
      setMapUrl(url);
      return;
    }

    // Calculer le centre entre prestataire et client
    const centerLat = (lat + clientLatNum) / 2;
    const centerLng = (lng + clientLngNum) / 2;

    // Calculer la distance pour ajuster le zoom
    const latDiff = Math.abs(lat - clientLatNum);
    const lngDiff = Math.abs(lng - clientLngNum);
    const maxDiff = Math.max(latDiff, lngDiff);

    // Ajuster le bbox pour inclure les deux points avec un padding
    const padding = maxDiff * 0.5 + 0.005; // Ajouter 50% + minimum padding

    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - padding},${centerLat - padding},${centerLng + padding},${centerLat + padding}&layer=mapnik&marker=${lat},${lng}`;
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

          // Mettre à jour l'URL de la carte
          updateMapUrl(newLat, newLng);
        } else {
          setError(t('gps.providerNotShared'));
        }
      } else {
        setError(t('gps.cannotGetPosition'));
      }
    } catch (err) {
      // Silently ignore fetch errors
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [orderId, updateMapUrl, t]);

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

  // Générer l'URL de la carte dès qu'on a la position du prestataire
  useEffect(() => {
    if (providerLocation) {
      updateMapUrl(providerLocation.lat, providerLocation.lng);
    }
  }, [providerLocation, updateMapUrl]);

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
    if (distanceKm === null || distanceKm === undefined) return 'N/A';
    if (distanceKm < 1) {
      return `${toArabicNumerals(Math.round(distanceKm * 1000))} m`;
    }
    return `${toArabicNumerals(distanceKm.toFixed(1))} km`;
  };

  const estimatedTime = (distanceKm) => {
    if (distanceKm === null || distanceKm === undefined) return 'N/A';
    const hours = distanceKm / 30;
    const minutes = Math.round(hours * 60);
    if (minutes < 1) return `< ${toArabicNumerals(1)} ${t('common.min')}`;
    return `~${toArabicNumerals(minutes)} ${t('common.min')}`;
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return 'N/A';
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    if (seconds < 60) return `${toArabicNumerals(seconds)}${t('common.seconds')}`;
    const minutes = Math.floor(seconds / 60);
    return `${toArabicNumerals(minutes)}${t('common.min')}`;
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

  const distance = calculateDistance();

  if (loading) {
    return (
      <div className={styles.providerLocationMap} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>{t('gps.loadingPosition')}</p>
        </div>
      </div>
    );
  }

  if (error && !providerLocation) {
    return (
      <div className={styles.providerLocationMap} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>📍</span>
          <h3>{t('gps.positionNotAvailable')}</h3>
          <p>{error}</p>
          <p className={styles.hint}>
            {t('gps.providerWillShare')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.providerLocationMap} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.icon}>🚗</span>
          <div>
            <h3 className={styles.title}>{t('gps.realTimeTracking')}</h3>
            <p className={styles.subtitle}>{t('gps.updatedAgo', { time: getTimeSinceUpdate() })}</p>
          </div>
        </div>
        <div className={styles.statusBadge}>
          <span className={styles.pulse}></span>
          {t('gps.live')}
        </div>
      </div>

      {distance !== null && (
        <div className={styles.distanceInfo}>
          <div className={styles.distanceCard}>
            <span className={styles.distanceIcon}>📏</span>
            <div>
              <div className={styles.distanceValue}>{formatDistance(distance)}</div>
              <div className={styles.distanceLabel}>{t('gps.distance')}</div>
            </div>
          </div>

          <div className={styles.distanceCard}>
            <span className={styles.distanceIcon}>⏱️</span>
            <div>
              <div className={styles.distanceValue}>{estimatedTime(distance)}</div>
              <div className={styles.distanceLabel}>{t('gps.estimatedTime')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Carte en temps réel avec badges */}
      <div className={styles.visualMap}>
        {/* Carte OpenStreetMap en arrière-plan */}
        {mapUrl && (
          <div className={styles.realMapContainer}>
            <iframe
              src={mapUrl}
              className={styles.realMapIframe}
              frameBorder="0"
              scrolling="no"
              title="Carte en temps réel"
              loading="lazy"
            />

            {/* Overlay avec badges par-dessus la carte */}
            <div className={styles.mapOverlayBadges}>
              {/* Badge Prestataire flottant */}
              <div className={styles.floatingProviderBadge}>
                <div className={styles.badgeIcon}>
                  {providerAvatar && uploadsBaseUrl ? (
                    <img
                      src={`${uploadsBaseUrl}${providerAvatar}`}
                      alt={providerName || t('gps.provider')}
                      className={styles.badgeAvatarImg}
                    />
                  ) : (
                    <div className={styles.badgeAvatarPlaceholder}>
                      {providerName?.charAt(0)?.toUpperCase() || '🚗'}
                    </div>
                  )}
                </div>
                <div className={styles.badgeLabel}>{providerName || t('gps.provider')}</div>
                <div className={styles.badgePulse}></div>
              </div>

              {/* Info distance au centre */}
              {distance !== null && (
                <div className={styles.centerDistanceInfo}>
                  <div className={styles.distanceBox}>
                    <div className={styles.distanceValue}>{formatDistance(distance)}</div>
                    <div className={styles.etaValue}>{estimatedTime(distance)}</div>
                  </div>
                </div>
              )}

              {/* Badge Client flottant */}
              {clientLatNum && clientLngNum && (
                <div className={styles.floatingClientBadge}>
                  <div className={styles.badgeIcon}>🏠</div>
                  <div className={styles.badgeLabel}>{t('gps.you')}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Coordonnées détaillées */}
      <div className={styles.mapOverlay}>
        <div className={styles.locationCards}>
          <div className={styles.locationCard}>
            <span className={styles.locationIcon}>🚗</span>
            <div>
              <strong>{t('gps.provider')}</strong>
              <p>{providerLocation?.lat.toFixed(5)}, {providerLocation?.lng.toFixed(5)}</p>
            </div>
          </div>

          {clientLatNum && clientLngNum && (
            <div className={styles.locationCard}>
              <span className={styles.locationIcon}>🏠</span>
              <div>
                <strong>{t('gps.you')}</strong>
                <p>{clientAddress || `${clientLatNum.toFixed(5)}, ${clientLngNum.toFixed(5)}`}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mapActions}>
        <button onClick={openInGoogleMaps} className={styles.mapButton}>
          🗺️ Google Maps
        </button>
        {clientLatNum && clientLngNum && (
          <button onClick={openDirections} className={styles.mapButton}>
            🧭 {t('gps.directions')}
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
        <p>🔄 {t('gps.updateEvery10s')}</p>
      </div>
    </div>
  );
}
