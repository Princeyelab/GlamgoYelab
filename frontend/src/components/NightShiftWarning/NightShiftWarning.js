'use client';

import { useState, useEffect } from 'react';
import styles from './NightShiftWarning.module.css';
import apiClient from '@/lib/apiClient';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * NightShiftWarning - Composant d'avertissement pour interventions nocturnes
 *
 * Affiche un avertissement visuel lorsqu'une prestation est programmée
 * pendant les heures de nuit (22h-6h), avec le calcul des frais associés.
 *
 * @param {string} scheduledTime - Date/heure planifiée (format ISO ou datetime-local)
 * @param {number} duration - Durée estimée en heures (défaut: 2)
 * @param {boolean} compact - Mode compact pour affichage réduit
 * @param {Function} onNightFeeChange - Callback quand les frais changent
 */
export default function NightShiftWarning({
  scheduledTime,
  duration = 2,
  compact = false,
  onNightFeeChange
}) {
  const [nightCalc, setNightCalc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currency } = useCurrency();
  const { toArabicNumerals } = useLanguage();

  useEffect(() => {
    if (!scheduledTime) {
      setNightCalc(null);
      return;
    }

    checkNightShift();
  }, [scheduledTime, duration]);

  // Notifier le parent quand les frais changent
  useEffect(() => {
    if (onNightFeeChange) {
      onNightFeeChange(nightCalc);
    }
  }, [nightCalc, onNightFeeChange]);

  const checkNightShift = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/pricing/check-night', {
        scheduled_time: scheduledTime,
        estimated_duration_hours: duration
      });

      if (response.success) {
        setNightCalc(response.data);
      } else {
        setError(response.error || 'Erreur de vérification');
      }
    } catch (err) {
      console.error('Erreur vérification nuit:', err);
      // Fallback local si API non disponible
      const localCheck = checkNightTimeLocal(scheduledTime);
      setNightCalc(localCheck);
    } finally {
      setLoading(false);
    }
  };

  // Vérification locale (fallback)
  const checkNightTimeLocal = (datetime) => {
    const date = new Date(datetime);
    const hour = date.getHours();
    const isNight = hour >= 22 || hour < 6;

    return {
      type: isNight ? 'single' : 'none',
      fee: isNight ? 30 : 0,
      nights_count: isNight ? 1 : 0,
      explanation: isNight
        ? `Intervention de nuit (22h-6h) : +30 ${currency}`
        : 'Intervention en journée, pas de frais de nuit.',
      is_night_shift: isNight
    };
  };

  // Ne rien afficher si pas de données ou pas de nuit
  if (!nightCalc || nightCalc.type === 'none') {
    return null;
  }

  // Mode compact
  if (compact) {
    return (
      <div className={styles.compactWarning}>
        <span className={styles.compactIcon}>🌙</span>
        <span className={styles.compactText}>
          Nuit : +{toArabicNumerals(nightCalc.fee.toFixed(0))} {currency}
        </span>
        {nightCalc.nights_count > 1 && (
          <span className={styles.nightsBadge}>
            {toArabicNumerals(nightCalc.nights_count)} nuits
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.nightWarning} ${nightCalc.nights_count > 1 ? styles.highSeverity : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <span className={styles.moonIcon}>🌙</span>
        </div>
        <div className={styles.headerText}>
          <h4 className={styles.title}>Intervention de nuit détectée</h4>
          <p className={styles.subtitle}>
            Horaires de nuit : 22h00 - 06h00
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className={styles.content}>
        <p className={styles.explanation}>
          {nightCalc.explanation}
        </p>

        {/* Badge si plusieurs nuits */}
        {nightCalc.nights_count > 1 && (
          <div className={styles.multiNightBadge}>
            <span className={styles.badgeIcon}>⚠️</span>
            <span>{toArabicNumerals(nightCalc.nights_count)} nuits consécutives</span>
          </div>
        )}

        {/* Périodes nocturnes détaillées */}
        {nightCalc.periods && nightCalc.periods.length > 0 && (
          <div className={styles.periodsSection}>
            <h5 className={styles.periodsTitle}>Périodes nocturnes :</h5>
            <ul className={styles.periodsList}>
              {nightCalc.periods.map((period, index) => (
                <li key={index} className={styles.periodItem}>
                  <span className={styles.periodIcon}>🕐</span>
                  <span>{period.start} → {period.end}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Affichage des frais */}
        <div className={styles.feeDisplay}>
          <span className={styles.feeLabel}>Commission de nuit</span>
          <span className={styles.feeAmount}>+{toArabicNumerals(nightCalc.fee.toFixed(2))} {currency}</span>
        </div>
      </div>

      {/* Info box */}
      <div className={styles.infoBox}>
        <span className={styles.infoIcon}>💡</span>
        <p className={styles.infoText}>
          Les interventions de nuit (22h-6h) nécessitent une disponibilité
          particulière des prestataires et sont facturées en conséquence.
        </p>
      </div>
    </div>
  );
}

/**
 * NightShiftBadge - Badge compact pour affichage inline
 */
export function NightShiftBadge({ nightCalc }) {
  if (!nightCalc || nightCalc.type === 'none') {
    return null;
  }

  return (
    <span className={styles.badge}>
      <span className={styles.badgeMoon}>🌙</span>
      <span>+{nightCalc.fee.toFixed(0)} {currency}</span>
      {nightCalc.nights_count > 1 && (
        <span className={styles.badgeNights}>
          ({nightCalc.nights_count} nuits)
        </span>
      )}
    </span>
  );
}

/**
 * NightShiftIndicator - Indicateur simple nuit/jour
 */
export function NightShiftIndicator({ scheduledTime }) {
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    if (!scheduledTime) {
      setIsNight(false);
      return;
    }

    const date = new Date(scheduledTime);
    const hour = date.getHours();
    setIsNight(hour >= 22 || hour < 6);
  }, [scheduledTime]);

  return (
    <span className={`${styles.indicator} ${isNight ? styles.night : styles.day}`}>
      {isNight ? '🌙 Nuit' : '☀️ Jour'}
    </span>
  );
}
