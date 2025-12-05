'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '@/lib/apiClient';

/**
 * useNightShiftDetection - Hook pour détecter les interventions de nuit
 *
 * Gère automatiquement la détection des horaires de nuit (22h-6h)
 * et le calcul des frais associés.
 *
 * @param {string} scheduledTime - Date/heure planifiée (format ISO ou datetime-local)
 * @param {number} duration - Durée estimée en heures (défaut: 2)
 * @param {Object} options - Options de configuration
 * @param {boolean} options.autoFetch - Appeler l'API automatiquement (défaut: true)
 * @param {boolean} options.useLocalFallback - Utiliser calcul local si API échoue (défaut: true)
 *
 * @returns {Object} {
 *   isNightShift: boolean - Intervention de nuit détectée
 *   nightFee: number - Montant des frais de nuit
 *   nightDetails: Object - Détails complets du calcul
 *   nightType: 'none'|'single'|'double' - Type d'intervention
 *   nightsCount: number - Nombre de nuits
 *   loading: boolean - Chargement en cours
 *   error: string|null - Erreur éventuelle
 *   checkNight: Function - Fonction pour vérifier manuellement
 *   isNightTime: Function - Vérifie si une heure est en plage nocturne
 * }
 *
 * @example
 * const { isNightShift, nightFee, nightDetails } = useNightShiftDetection(
 *   '2024-01-15 23:00:00',
 *   3
 * );
 */
export const useNightShiftDetection = (scheduledTime, duration = 2, options = {}) => {
  const {
    autoFetch = true,
    useLocalFallback = true
  } = options;

  const [isNightShift, setIsNightShift] = useState(false);
  const [nightFee, setNightFee] = useState(0);
  const [nightDetails, setNightDetails] = useState(null);
  const [nightType, setNightType] = useState('none');
  const [nightsCount, setNightsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Constantes horaires de nuit
  const NIGHT_START = 22;
  const NIGHT_END = 6;

  /**
   * Vérifie si une heure est dans la plage nocturne (22h-6h)
   */
  const isNightTime = useCallback((datetime) => {
    if (!datetime) return false;
    const date = new Date(datetime);
    const hour = date.getHours();
    return hour >= NIGHT_START || hour < NIGHT_END;
  }, [NIGHT_START, NIGHT_END]);

  /**
   * Calcul local des frais de nuit (fallback)
   */
  const calculateLocalNightFee = useCallback((datetime, durationHours) => {
    if (!datetime) {
      return {
        type: 'none',
        fee: 0,
        nights_count: 0,
        is_night_shift: false,
        explanation: 'Aucune date fournie.'
      };
    }

    const start = new Date(datetime);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    // Compter les nuits traversées
    let nightsCount = 0;
    const current = new Date(start);

    while (current < end) {
      const hour = current.getHours();
      if (hour >= NIGHT_START || hour < NIGHT_END) {
        // Vérifier si c'est une nouvelle nuit
        const nightDate = new Date(current);
        if (hour < NIGHT_END) {
          nightDate.setDate(nightDate.getDate() - 1);
        }
        // Simplification: on compte 1 nuit si on traverse la plage nocturne
        if (nightsCount === 0) nightsCount = 1;
        break;
      }
      current.setHours(current.getHours() + 1);
    }

    // Vérifier si on traverse une deuxième nuit
    if (nightsCount === 1 && durationHours > 8) {
      const endHour = end.getHours();
      if (endHour >= NIGHT_START || endHour < NIGHT_END) {
        // On pourrait traverser 2 nuits
        const timeDiffHours = (end - start) / (1000 * 60 * 60);
        if (timeDiffHours > 24) {
          nightsCount = 2;
        }
      }
    }

    // Tarifs par défaut
    const singleNightFee = 30;
    const doubleNightFee = 60;

    if (nightsCount === 0) {
      return {
        type: 'none',
        fee: 0,
        nights_count: 0,
        is_night_shift: false,
        explanation: 'Intervention en journée (6h-22h), aucun frais de nuit.'
      };
    }

    if (nightsCount === 1) {
      return {
        type: 'single',
        fee: singleNightFee,
        nights_count: 1,
        is_night_shift: true,
        explanation: `Intervention de nuit (22h-6h) : +${singleNightFee} MAD`
      };
    }

    return {
      type: 'double',
      fee: doubleNightFee,
      nights_count: nightsCount,
      is_night_shift: true,
      explanation: `Intervention sur ${nightsCount} nuits consécutives (22h-6h) : +${doubleNightFee} MAD`
    };
  }, [NIGHT_START, NIGHT_END]);

  /**
   * Vérifie les frais de nuit via l'API
   */
  const checkNight = useCallback(async (time = scheduledTime, dur = duration) => {
    if (!time) {
      setIsNightShift(false);
      setNightFee(0);
      setNightDetails(null);
      setNightType('none');
      setNightsCount(0);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/pricing/check-night', {
        scheduled_time: time,
        estimated_duration_hours: dur
      });

      if (response.success && response.data) {
        const data = response.data;
        setIsNightShift(data.type !== 'none');
        setNightFee(data.fee || 0);
        setNightDetails(data);
        setNightType(data.type || 'none');
        setNightsCount(data.nights_count || 0);
        return data;
      } else {
        throw new Error(response.error || 'Erreur API');
      }
    } catch (err) {
      console.error('Erreur vérification nuit:', err);

      // Fallback local
      if (useLocalFallback) {
        const localResult = calculateLocalNightFee(time, dur);
        setIsNightShift(localResult.is_night_shift);
        setNightFee(localResult.fee);
        setNightDetails(localResult);
        setNightType(localResult.type);
        setNightsCount(localResult.nights_count);
        return localResult;
      }

      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [scheduledTime, duration, useLocalFallback, calculateLocalNightFee]);

  // Auto-fetch quand scheduledTime ou duration change
  useEffect(() => {
    if (autoFetch && scheduledTime) {
      checkNight();
    } else if (!scheduledTime) {
      // Reset si pas de date
      setIsNightShift(false);
      setNightFee(0);
      setNightDetails(null);
      setNightType('none');
      setNightsCount(0);
    }
  }, [scheduledTime, duration, autoFetch, checkNight]);

  // Warning message memoized
  const warning = useMemo(() => {
    if (!isNightShift) return null;

    return {
      title: 'Intervention de nuit détectée',
      message: nightDetails?.explanation || `Commission de nuit : +${nightFee} MAD`,
      severity: nightsCount > 1 ? 'high' : 'medium',
      fee: nightFee,
      nightsCount
    };
  }, [isNightShift, nightDetails, nightFee, nightsCount]);

  return {
    isNightShift,
    nightFee,
    nightDetails,
    nightType,
    nightsCount,
    loading,
    error,
    warning,
    checkNight,
    isNightTime,
    // Constantes utiles
    NIGHT_START,
    NIGHT_END
  };
};

/**
 * Hook simplifié pour vérification rapide nuit/jour
 */
export const useIsNightTime = (datetime) => {
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    if (!datetime) {
      setIsNight(false);
      return;
    }

    const date = new Date(datetime);
    const hour = date.getHours();
    setIsNight(hour >= 22 || hour < 6);
  }, [datetime]);

  return isNight;
};

export default useNightShiftDetection;
