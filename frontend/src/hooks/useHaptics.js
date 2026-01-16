'use client';

import { useCallback, useMemo } from 'react';

/**
 * useHaptics - Hook pour le retour haptique via l'API Vibration
 *
 * Fournit des méthodes pour déclencher des vibrations sur les appareils compatibles.
 * Dégradation gracieuse sur les navigateurs/appareils non supportés.
 *
 * @returns {Object} {
 *   isSupported: boolean - API Vibration supportée
 *   vibrate: Function - Vibration personnalisée avec pattern
 *   tap: Function - Vibration légère (sélection, toggle)
 *   success: Function - Vibration de succès (confirmation)
 *   warning: Function - Vibration d'avertissement
 *   error: Function - Vibration d'erreur
 *   selection: Function - Vibration très légère (changement de sélection)
 * }
 *
 * @example
 * const { success, tap, isSupported } = useHaptics();
 *
 * // Sur confirmation de réservation
 * success();
 *
 * // Sur clic de bouton
 * tap();
 */
export const useHaptics = () => {
  // Vérification du support de l'API Vibration
  const isSupported = useMemo(() => {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }, []);

  /**
   * Déclenche une vibration avec un pattern personnalisé
   * @param {number|number[]} pattern - Durée en ms ou tableau [vibration, pause, vibration, ...]
   * @returns {boolean} - Succès de la vibration
   */
  const vibrate = useCallback((pattern = [50]) => {
    if (!isSupported) return false;

    try {
      // Normaliser en tableau si un seul nombre
      const vibrationPattern = Array.isArray(pattern) ? pattern : [pattern];
      return navigator.vibrate(vibrationPattern);
    } catch (err) {
      console.warn('Haptic feedback failed:', err);
      return false;
    }
  }, [isSupported]);

  /**
   * Vibration légère - pour les toggles, checkboxes, sélections rapides
   */
  const tap = useCallback(() => {
    return vibrate([10]);
  }, [vibrate]);

  /**
   * Vibration de succès - pour les confirmations, validations
   */
  const success = useCallback(() => {
    return vibrate([10, 50, 10]);
  }, [vibrate]);

  /**
   * Vibration d'avertissement - pour les alertes, modales d'attention
   */
  const warning = useCallback(() => {
    return vibrate([30, 30, 30]);
  }, [vibrate]);

  /**
   * Vibration d'erreur - pour les erreurs de formulaire, échecs
   */
  const error = useCallback(() => {
    return vibrate([100]);
  }, [vibrate]);

  /**
   * Vibration très légère - pour les changements de sélection subtils
   */
  const selection = useCallback(() => {
    return vibrate([5]);
  }, [vibrate]);

  /**
   * Vibration moyenne - pour les actions principales (boutons primaires)
   */
  const medium = useCallback(() => {
    return vibrate([20]);
  }, [vibrate]);

  /**
   * Vibration forte - pour les actions importantes (urgences, confirmations critiques)
   */
  const heavy = useCallback(() => {
    return vibrate([50]);
  }, [vibrate]);

  return {
    isSupported,
    vibrate,
    tap,
    success,
    warning,
    error,
    selection,
    medium,
    heavy
  };
};

export default useHaptics;
