'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ClientLocationSharing.module.scss';
import apiClient from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Composant pour le client : Partager sa position GPS en temps réel
 * Utilisé quand le prestataire est "en route" vers le client
 */
export default function ClientLocationSharing({ orderId }) {
  const { t, isRTL } = useLanguage();
  const [isSharing, setIsSharing] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [error, setError] = useState('');
  const [updateCount, setUpdateCount] = useState(0);
  const watchIdRef = useRef(null);

  useEffect(() => {
    return () => {
      stopSharing();
    };
  }, []);

  const startSharing = () => {
    if (!('geolocation' in navigator)) {
      setError(t('gps.deviceNotSupported'));
      return;
    }

    setError('');
    setIsSharing(true);

    // Obtenir la position initiale
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
        timeout: 10000,
      }
    );

    // Surveiller les changements de position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        handlePositionUpdate(position);
      },
      (err) => {
        handleGeolocationError(err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
  };

  const handlePositionUpdate = async (position) => {
    const { latitude, longitude, accuracy } = position.coords;

    setCurrentPosition({
      latitude,
      longitude,
      accuracy,
      timestamp: position.timestamp,
    });
    setUpdateCount((prev) => prev + 1);

    // Envoyer la position au backend
    try {
      await apiClient.updateClientLocation(orderId, latitude, longitude);
      console.log(`📍 [CLIENT] Position envoyée: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } catch (error) {
      console.error('❌ [CLIENT] Erreur envoi position:', error);
    }
  };

  const handleGeolocationError = (err) => {
    let errorMessage = '';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = t('gps.permissionDenied');
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = t('gps.positionUnavailable');
        break;
      case err.TIMEOUT:
        errorMessage = t('gps.timeout');
        break;
      default:
        errorMessage = t('gps.genericError');
    }

    setError(errorMessage);
  };

  return (
    <div className={styles.clientLocationSharing} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={styles.header}>
        <span className={styles.icon}>📍</span>
        <div className={styles.headerText}>
          <h3>{t('gps.shareYourPosition')}</h3>
          <p>{t('gps.helpProviderFind')}</p>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {!isSharing ? (
        <div className={styles.content}>
          <p className={styles.description}>
            {t('gps.shareDescription')}
          </p>
          <button onClick={startSharing} className={styles.shareButton}>
            🛰️ {t('gps.enableGpsSharing')}
          </button>
        </div>
      ) : (
        <div className={styles.sharingActive}>
          <div className={styles.statusBadge}>
            <span className={styles.pulse}></span>
            {t('gps.sharingActive')}
          </div>

          {currentPosition && (
            <div className={styles.positionInfo}>
              <p>
                <strong>{t('gps.yourPosition')} :</strong><br />
                {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
              </p>
              <p className={styles.accuracy}>
                {t('gps.accuracy')} : ±{Math.round(currentPosition.accuracy)}m
              </p>
              <p className={styles.updates}>
                {t('gps.updates')} : {updateCount}
              </p>
            </div>
          )}

          <button onClick={stopSharing} className={styles.stopButton}>
            ⏹️ {t('gps.stopSharing')}
          </button>
        </div>
      )}
    </div>
  );
}
