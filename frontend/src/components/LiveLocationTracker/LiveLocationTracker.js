'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './LiveLocationTracker.module.scss';
import Button from '../Button';
import apiClient from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Composant pour le prestataire : Partage de position GPS en temps réel
 * Utilisé quand le prestataire est "en route" vers le client
 */
export default function LiveLocationTracker({
  orderId,
  onLocationUpdate,
  autoStart = false,
  clientAddress = null,
  clientLat = null,
  clientLng = null
}) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [clientLocation, setClientLocation] = useState(null);
  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const clientLocationIntervalRef = useRef(null);
  const { t: translate, toArabicNumerals } = useLanguage();

  // Protection contre t undefined
  const t = (key) => {
    if (typeof translate === 'function') {
      return translate(key);
    }
    // Fallback values
    const fallbacks = {
      'common.seconds': 's',
      'common.min': ' min'
    };
    return fallbacks[key] || '';
  };

  // Utiliser les coordonnées passées en props ou récupérées via API
  const clientLatNum = clientLocation?.latitude ?? (clientLat ? parseFloat(clientLat) : null);
  const clientLngNum = clientLocation?.longitude ?? (clientLng ? parseFloat(clientLng) : null);

  // Récupérer la position du client depuis l'API
  const fetchClientLocation = async () => {
    if (!orderId) return;
    try {
      const response = await apiClient.getClientLocation(orderId);
      if (response.success && response.data) {
        const { client_live_latitude, client_live_longitude, location_sharing_enabled } = response.data;
        if (location_sharing_enabled && client_live_latitude && client_live_longitude) {
          setClientLocation({
            latitude: parseFloat(client_live_latitude),
            longitude: parseFloat(client_live_longitude)
          });
        }
      }
    } catch (err) {
      // Silently ignore - client location not available
    }
  };

  useEffect(() => {
    // Récupérer la position client immédiatement et toutes les 10 secondes
    fetchClientLocation();
    clientLocationIntervalRef.current = setInterval(fetchClientLocation, 10000);

    if (autoStart) {
      startTracking();
    }

    return () => {
      stopTracking();
      if (clientLocationIntervalRef.current) {
        clearInterval(clientLocationIntervalRef.current);
      }
    };
  }, [autoStart, orderId]);

  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      setError('Votre appareil ne supporte pas la géolocalisation');
      return;
    }

    setError('');
    setIsTracking(true);

    // Obtenir la position initiale immédiatement
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePositionUpdate(position);
      },
      (err) => {
        handleGeolocationError(err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000,  // 30 secondes pour la première position
      }
    );

    // Surveiller les changements de position en continu
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        handlePositionUpdate(position);
      },
      (err) => {
        handleGeolocationError(err);
      },
      {
        enableHighAccuracy: true,  // Utiliser le GPS (haute précision)
        maximumAge: 10000,          // Cache de 10 secondes max
        timeout: 20000,             // Timeout de 20 secondes
      }
    );

    console.log('📍 [TRACKING] Started GPS tracking');
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log('📍 [TRACKING] Stopped GPS tracking');
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    setIsTracking(false);
  };

  const handlePositionUpdate = async (position) => {
    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const timestamp = position.timestamp;

    const positionData = {
      latitude,
      longitude,
      accuracy,
      speed: speed || null,         // Vitesse en m/s (peut être null)
      heading: heading || null,     // Direction en degrés (peut être null)
      timestamp,
    };

    setCurrentPosition(positionData);
    setUpdateCount((prev) => prev + 1);

    // Envoyer la position au backend
    try {
      await apiClient.updateProviderLocation(latitude, longitude, orderId);
      console.log(`📍 [TRACKING] Position sent to backend: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } catch (error) {
      console.error('❌ [TRACKING] Failed to send position to backend:', error);
    }

    // Notifier le parent
    if (onLocationUpdate) {
      onLocationUpdate(positionData);
    }

    console.log(`📍 [TRACKING] Position updated: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`);
  };

  const handleGeolocationError = (err) => {
    let errorMessage = '';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Accès à la position refusé';
        setPermissionDenied(true);
        setIsTracking(false);
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Position indisponible. Vérifiez que le GPS est activé';
        break;
      case err.TIMEOUT:
        errorMessage = 'Délai dépassé. Essayez à nouveau';
        break;
      default:
        errorMessage = 'Erreur lors de la récupération de la position';
    }

    setError(errorMessage);
    console.error('❌ [TRACKING] Geolocation error:', err);
  };

  const formatSpeed = (speedMs) => {
    if (!speedMs) return 'N/A';
    const speedKmh = (speedMs * 3.6).toFixed(1);
    return `${toArabicNumerals(speedKmh)} km/h`;
  };

  const formatHeading = (heading) => {
    if (!heading) return 'N/A';

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(heading / 45) % 8;
    return `${directions[index]} (${toArabicNumerals(Math.round(heading))}°)`;
  };

  const getTimeSinceUpdate = () => {
    if (!currentPosition) return 'N/A';

    const seconds = Math.floor((Date.now() - currentPosition.timestamp) / 1000);
    if (seconds < 60) return `${toArabicNumerals(seconds)}${t('common.seconds')}`;
    const minutes = Math.floor(seconds / 60);
    return `${toArabicNumerals(minutes)}${t('common.min')} ${toArabicNumerals(seconds % 60)}${t('common.seconds')}`;
  };

  // Calculer la distance jusqu'au client
  const calculateDistance = () => {
    if (!currentPosition || !clientLatNum || !clientLngNum) return null;

    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(clientLatNum - currentPosition.latitude);
    const dLon = toRad(clientLngNum - currentPosition.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(currentPosition.latitude)) *
        Math.cos(toRad(clientLatNum)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
  };

  const toRad = (value) => {
    return (value * Math.PI) / 180;
  };

  const formatDistance = (distanceKm) => {
    if (!distanceKm) return 'N/A';
    if (distanceKm < 1) {
      return `${toArabicNumerals(Math.round(distanceKm * 1000))} m`;
    }
    return `${toArabicNumerals(distanceKm.toFixed(1))} km`;
  };

  const estimatedTime = (distanceKm) => {
    if (!distanceKm) return 'N/A';
    const hours = distanceKm / 30; // Vitesse moyenne 30 km/h
    const minutes = Math.round(hours * 60);
    if (minutes < 1) return `< ${toArabicNumerals(1)} ${t('common.min')}`;
    return `~${toArabicNumerals(minutes)} ${t('common.min')}`;
  };

  // Navigation vers le client
  const openInGoogleMaps = () => {
    let url;
    if (clientLatNum && clientLngNum) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${clientLatNum},${clientLngNum}`;
    } else if (clientAddress) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clientAddress)}`;
    } else {
      return;
    }
    window.open(url, '_blank');
  };

  const openInWaze = () => {
    let url;
    if (clientLatNum && clientLngNum) {
      url = `https://www.waze.com/ul?ll=${clientLatNum},${clientLngNum}&navigate=yes`;
    } else if (clientAddress) {
      url = `https://www.waze.com/ul?q=${encodeURIComponent(clientAddress)}&navigate=yes`;
    } else {
      return;
    }
    window.open(url, '_blank');
  };

  const distance = calculateDistance();

  return (
    <div className={styles.liveLocationTracker}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.icon}>📍</span>
          <div>
            <h3 className={styles.title}>Partage de position GPS</h3>
            <p className={styles.subtitle}>
              {isTracking
                ? 'Votre position est partagée en temps réel avec le client'
                : 'Activez le partage pour guider le client'}
            </p>
          </div>
        </div>

        {!isTracking ? (
          <Button
            onClick={startTracking}
            variant="primary"
            className={styles.actionButton}
          >
            🚗 Activer le GPS
          </Button>
        ) : (
          <Button
            onClick={stopTracking}
            variant="secondary"
            className={styles.actionButton}
          >
            ⏸️ Désactiver
          </Button>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {/* Instructions si permission refusée */}
      {permissionDenied && (
        <div className={styles.permissionDenied}>
          <div className={styles.permissionIcon}>🔒</div>
          <h4>Autorisation GPS requise</h4>
          <p>Pour partager votre position avec le client, vous devez autoriser l'accès à votre localisation.</p>

          <div className={styles.permissionSteps}>
            <h5>Comment activer :</h5>
            <ol>
              <li>Cliquez sur l'icône 🔒 dans la barre d'adresse de votre navigateur</li>
              <li>Trouvez "Localisation" ou "Position"</li>
              <li>Changez de "Bloquer" à "Autoriser"</li>
              <li>Rechargez la page</li>
            </ol>
          </div>

          <div className={styles.permissionActions}>
            <Button
              onClick={() => {
                setPermissionDenied(false);
                setError('');
                startTracking();
              }}
              variant="primary"
            >
              🔄 Réessayer
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="secondary"
            >
              🔃 Recharger la page
            </Button>
          </div>
        </div>
      )}

      {/* Informations du client et navigation - Visible si coordonnées ou adresse disponibles */}
      {(clientLatNum && clientLngNum) || clientAddress ? (
        <div className={styles.clientSection}>
          <h4 className={styles.clientTitle}>📍 Destination Client</h4>

          <div className={styles.clientInfo}>
            <div className={styles.clientAddress}>
              <strong>Adresse :</strong>
              <span>{clientAddress || 'Adresse du client'}</span>
            </div>

            {clientLatNum && clientLngNum && (
              <div className={styles.clientCoords}>
                <strong>Coordonnées GPS :</strong>
                <span className={styles.coords}>
                  {toArabicNumerals(clientLatNum.toFixed(6))}, {toArabicNumerals(clientLngNum.toFixed(6))}
                </span>
              </div>
            )}

            {distance !== null && isTracking && currentPosition && (
              <div className={styles.distanceInfo}>
                <div className={styles.distanceItem}>
                  <span className={styles.distanceIcon}>📏</span>
                  <div>
                    <div className={styles.distanceLabel}>Distance</div>
                    <div className={styles.distanceValue}>{formatDistance(distance)}</div>
                  </div>
                </div>

                <div className={styles.distanceItem}>
                  <span className={styles.distanceIcon}>⏱️</span>
                  <div>
                    <div className={styles.distanceLabel}>Temps estimé</div>
                    <div className={styles.distanceValue}>{estimatedTime(distance)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.navigationButtons}>
            <button onClick={openInGoogleMaps} className={styles.navButton}>
              🗺️ Naviguer avec Google Maps
            </button>
            <button onClick={openInWaze} className={styles.navButton}>
              🚗 Naviguer avec Waze
            </button>
          </div>
        </div>
      ) : null}

      {/* Statistiques de tracking - Visible uniquement quand GPS activé */}
      {isTracking && currentPosition && (
        <div className={styles.trackingInfo}>
          <div className={styles.statusBadge}>
            <span className={styles.pulse}></span>
            VOTRE POSITION EN TEMPS RÉEL
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Votre Position</span>
              <span className={styles.statValue}>
                {toArabicNumerals(currentPosition.latitude.toFixed(6))}, {toArabicNumerals(currentPosition.longitude.toFixed(6))}
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Précision</span>
              <span className={styles.statValue}>±{toArabicNumerals(Math.round(currentPosition.accuracy))}m</span>
            </div>

            {currentPosition.speed !== null && (
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Vitesse</span>
                <span className={styles.statValue}>{formatSpeed(currentPosition.speed)}</span>
              </div>
            )}

            {currentPosition.heading !== null && (
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Direction</span>
                <span className={styles.statValue}>{formatHeading(currentPosition.heading)}</span>
              </div>
            )}

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Mises à jour</span>
              <span className={styles.statValue}>{toArabicNumerals(updateCount)}</span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Dernière MàJ</span>
              <span className={styles.statValue}>{getTimeSinceUpdate()}</span>
            </div>
          </div>

          <div className={styles.info}>
            <p>
              💡 <strong>Conseil :</strong> Gardez cette page ouverte pendant votre trajet
              pour que le client puisse suivre votre position en temps réel.
            </p>
          </div>
        </div>
      )}

      {/* Instructions - Visible uniquement si GPS pas activé et pas d'erreur */}
      {!isTracking && !error && !clientLatNum && !clientLngNum && (
        <div className={styles.instructions}>
          <h4>Comment ça marche ?</h4>
          <ol>
            <li>Activez le GPS en cliquant sur le bouton ci-dessus</li>
            <li>Autorisez l'accès à votre position quand le navigateur vous le demande</li>
            <li>Votre position sera partagée en continu avec le client</li>
            <li>Le client pourra vous suivre sur une carte en temps réel</li>
            <li>Désactivez le GPS une fois arrivé chez le client</li>
          </ol>
        </div>
      )}
    </div>
  );
}
