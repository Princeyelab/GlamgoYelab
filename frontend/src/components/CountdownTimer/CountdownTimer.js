'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './CountdownTimer.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * CountdownTimer - Composant de compte à rebours
 *
 * Affiche un timer qui compte jusqu'à une date d'expiration.
 * Utilisé pour les commandes pending (4 minutes de délai de réponse).
 *
 * @param {number|string|Date} expiresAt - Timestamp ou date d'expiration
 * @param {Function} onExpired - Callback appelé quand le timer expire
 * @param {boolean} showIcon - Afficher l'icône timer (défaut: true)
 * @param {string} size - Taille: 'small' | 'medium' | 'large' (défaut: 'medium')
 */
export default function CountdownTimer({
  expiresAt,
  onExpired,
  showIcon = true,
  size = 'medium'
}) {
  const { t, toArabicNumerals } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Calculer le temps restant
  const calculateTimeLeft = useCallback(() => {
    if (!expiresAt) return null;

    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) {
      return { minutes: 0, seconds: 0, expired: true, totalSeconds: 0 };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return {
      minutes,
      seconds,
      expired: false,
      totalSeconds
    };
  }, [expiresAt]);

  // Mettre à jour le timer chaque seconde
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const time = calculateTimeLeft();
      setTimeLeft(time);

      if (time?.expired && !isExpired) {
        setIsExpired(true);
        if (onExpired) {
          onExpired();
        }
      }
    };

    // Initial calculation
    updateTimer();

    // Update every second
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, calculateTimeLeft, onExpired, isExpired]);

  // Ne rien afficher si pas de date ou expiré
  if (!timeLeft || timeLeft.expired) {
    if (isExpired) {
      return (
        <div className={`${styles.countdown} ${styles.expired} ${styles[size]}`}>
          {showIcon && <span className={styles.timerIcon}>⏱️</span>}
          <span className={styles.timerText}>{t('timer.expired') || 'Expiré'}</span>
        </div>
      );
    }
    return null;
  }

  // Déterminer si urgent (< 60 secondes)
  const isUrgent = timeLeft.totalSeconds < 60;

  // Formater les secondes avec un zéro devant si nécessaire
  const formattedSeconds = timeLeft.seconds.toString().padStart(2, '0');

  return (
    <div className={`${styles.countdown} ${isUrgent ? styles.urgent : ''} ${styles[size]}`}>
      {showIcon && <span className={styles.timerIcon}>⏱️</span>}
      <span className={styles.timerText}>
        {t('timer.expiresIn') || 'Expire dans'}{' '}
        <strong>
          {toArabicNumerals(timeLeft.minutes)}:{toArabicNumerals(formattedSeconds)}
        </strong>
      </span>
    </div>
  );
}
