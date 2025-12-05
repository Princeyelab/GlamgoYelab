'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ClientLocationSharing.module.scss';
import apiClient from '@/lib/apiClient';

/**
 * Composant pour le client : Partager sa position GPS en temps réel
 * Utilisé quand le prestataire est "en route" vers le client
 */
export default function ClientLocationSharing({ orderId }) {
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
      setError('Votre appareil ne supporte pas la géolocalisation');
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
        errorMessage = 'Vous avez refusé l\'accès à votre position';
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
  };

  return (
    <div className={styles.clientLocationSharing}>
      <div className={styles.header}>
        <span className={styles.icon}>📍</span>
        <div className={styles.headerText}>
          <h3>Partager votre position</h3>
          <p>Aidez le prestataire à vous trouver facilement</p>
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
            En activant le partage, le prestataire pourra voir votre position exacte en temps réel pour arriver plus facilement.
          </p>
          <button onClick={startSharing} className={styles.shareButton}>
            🛰️ Activer le partage GPS
          </button>
        </div>
      ) : (
        <div className={styles.sharingActive}>
          <div className={styles.statusBadge}>
            <span className={styles.pulse}></span>
            PARTAGE ACTIF
          </div>

          {currentPosition && (
            <div className={styles.positionInfo}>
              <p>
                <strong>Votre position :</strong><br />
                {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
              </p>
              <p className={styles.accuracy}>
                Précision : ±{Math.round(currentPosition.accuracy)}m
              </p>
              <p className={styles.updates}>
                Mises à jour : {updateCount}
              </p>
            </div>
          )}

          <button onClick={stopSharing} className={styles.stopButton}>
            ⏹️ Arrêter le partage
          </button>
        </div>
      )}
    </div>
  );
}
