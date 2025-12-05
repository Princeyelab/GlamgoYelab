'use client';

import { useState, useCallback, useRef } from 'react';
import apiClient from '@/lib/apiClient';

/**
 * Hook personnalisé pour le calcul de prix en temps réel
 *
 * Ce hook gère :
 * - Le calcul du prix selon la formule sélectionnée
 * - Les frais supplémentaires (distance, nuit, durée)
 * - La commission GlamGo (20%)
 * - Le debounce pour éviter les appels API excessifs
 *
 * @param {number} serviceId - ID du service
 * @returns {Object} - { breakdown, loading, error, calculate, reset }
 *
 * @example
 * const { breakdown, loading, calculate } = usePriceCalculation(serviceId);
 *
 * // Calculer le prix
 * await calculate({
 *   formula_type: 'premium',
 *   scheduled_time: '2025-11-28T22:00:00Z',
 *   duration_hours: 2,
 *   distance_km: 15,
 *   quantity: 1
 * });
 *
 * // breakdown contient:
 * // {
 * //   base_price: 150,
 * //   formula_modifier: 45,
 * //   formula_modifier_display: '+30%',
 * //   distance_fee: 20,
 * //   night_fee: 30,
 * //   subtotal: 245,
 * //   commission_rate: '20%',
 * //   commission_glamgo: 49,
 * //   provider_amount: 196,
 * //   total: 245,
 * //   is_night_service: true
 * // }
 */
export function usePriceCalculation(serviceId) {
  // État du breakdown de prix
  const [breakdown, setBreakdown] = useState(null);

  // État de chargement
  const [loading, setLoading] = useState(false);

  // État d'erreur
  const [error, setError] = useState(null);

  // Référence pour le debounce
  const debounceRef = useRef(null);

  // Derniers paramètres utilisés (pour éviter les appels redondants)
  const lastParamsRef = useRef(null);

  /**
   * Calcule le prix localement (fallback si API échoue)
   * Utilise les mêmes règles que le backend
   */
  const calculateLocally = useCallback((params, servicePrice) => {
    const {
      formula_type = 'standard',
      scheduled_time,
      duration_hours = 1,
      distance_km = 0,
      quantity = 1
    } = params;

    // Prix de base
    let basePrice = parseFloat(servicePrice) || 0;

    // Modificateur de formule
    let formulaModifier = 0;
    let formulaModifierDisplay = '';

    switch (formula_type) {
      case 'recurring':
        formulaModifier = basePrice * -0.10; // -10%
        formulaModifierDisplay = '-10%';
        break;
      case 'premium':
        formulaModifier = basePrice * 0.30; // +30%
        formulaModifierDisplay = '+30%';
        break;
      case 'urgent':
        formulaModifier = 50; // +50 MAD fixe
        formulaModifierDisplay = '+50 MAD';
        break;
      case 'night':
        formulaModifier = 30; // +30 MAD fixe
        formulaModifierDisplay = '+30 MAD';
        break;
      default: // standard
        formulaModifier = 0;
        formulaModifierDisplay = 'Base';
    }

    // Vérifier si c'est un service de nuit (22h - 6h)
    let isNightService = false;
    let nightFee = 0;

    if (scheduled_time) {
      const scheduledDate = new Date(scheduled_time);
      const hour = scheduledDate.getHours();
      isNightService = hour >= 22 || hour < 6;

      // Ajouter supplément nuit si pas déjà en formule nuit
      if (isNightService && formula_type !== 'night') {
        nightFee = 30;
      }
    }

    // Frais de distance (2 MAD/km après 5km gratuits)
    let distanceFee = 0;
    const freeKm = 5;
    const pricePerKm = 2;

    if (distance_km > freeKm) {
      distanceFee = (distance_km - freeKm) * pricePerKm;
    }

    // Calcul du sous-total
    const priceAfterFormula = basePrice + formulaModifier;
    const priceWithDuration = priceAfterFormula * duration_hours;
    const priceWithQuantity = priceWithDuration * quantity;
    const subtotal = priceWithQuantity + distanceFee + nightFee;

    // Commission GlamGo (20%)
    const commissionRate = 0.20;
    const commissionGlamgo = subtotal * commissionRate;
    const providerAmount = subtotal - commissionGlamgo;

    return {
      service_id: serviceId,
      service: null,
      base_price: basePrice,
      formula_type,
      formula_modifier: formulaModifier,
      formula_modifier_display: formulaModifierDisplay,
      duration_hours,
      quantity,
      distance_km,
      distance_fee: distanceFee,
      night_fee: nightFee,
      is_night_service: isNightService,
      subtotal,
      commission_rate: `${commissionRate * 100}%`,
      commission_glamgo: Math.round(commissionGlamgo * 100) / 100,
      provider_amount: Math.round(providerAmount * 100) / 100,
      total: Math.round(subtotal * 100) / 100
    };
  }, [serviceId]);

  /**
   * Fonction principale de calcul de prix
   * Appelle l'API backend avec debounce
   */
  const calculate = useCallback(async (params, servicePrice = null) => {
    // Vérifier si serviceId est valide
    if (!serviceId) {
      setError('Service ID manquant');
      return null;
    }

    // Créer une clé unique pour les paramètres
    const paramsKey = JSON.stringify({ serviceId, ...params });

    // Si mêmes paramètres, ne pas recalculer
    if (lastParamsRef.current === paramsKey && breakdown) {
      return breakdown;
    }

    // Annuler le debounce précédent
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    return new Promise((resolve) => {
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        setError(null);

        try {
          // Préparer les paramètres pour l'API
          const apiParams = {
            service_id: serviceId,
            formula_type: params.formula_type || 'standard',
            scheduled_time: params.scheduled_time || new Date().toISOString(),
            duration_hours: params.duration_hours || 1,
            distance_km: params.distance_km || 0,
            quantity: params.quantity || 1
          };

          // Appel API
          const response = await apiClient.calculatePrice(apiParams);

          if (response.success) {
            const data = response.data?.breakdown || response.breakdown || response.data;
            setBreakdown(data);
            lastParamsRef.current = paramsKey;
            resolve(data);
          } else {
            // Fallback calcul local si erreur API
            console.warn('API pricing failed, using local calculation:', response.message);

            if (servicePrice) {
              const localBreakdown = calculateLocally(params, servicePrice);
              setBreakdown(localBreakdown);
              lastParamsRef.current = paramsKey;
              resolve(localBreakdown);
            } else {
              setError(response.message || 'Erreur de calcul');
              resolve(null);
            }
          }
        } catch (err) {
          console.error('Erreur calcul prix:', err);

          // Fallback calcul local en cas d'erreur réseau
          if (servicePrice) {
            const localBreakdown = calculateLocally(params, servicePrice);
            setBreakdown(localBreakdown);
            lastParamsRef.current = paramsKey;
            resolve(localBreakdown);
          } else {
            setError(err.message || 'Erreur de connexion');
            resolve(null);
          }
        } finally {
          setLoading(false);
        }
      }, 300); // 300ms debounce
    });
  }, [serviceId, breakdown, calculateLocally]);

  /**
   * Réinitialise l'état du hook
   */
  const reset = useCallback(() => {
    setBreakdown(null);
    setError(null);
    setLoading(false);
    lastParamsRef.current = null;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  /**
   * Génère les warnings selon la formule et les paramètres
   */
  const getWarnings = useCallback(() => {
    if (!breakdown) return [];

    const warnings = [];

    // Warning pour service de nuit
    if (breakdown.is_night_service) {
      warnings.push({
        type: 'info',
        icon: '🌙',
        message: 'Service programmé en horaire de nuit (22h-6h). Un supplément de 30 MAD est appliqué.'
      });
    }

    // Warning pour formule urgente
    if (breakdown.formula_type === 'urgent') {
      warnings.push({
        type: 'warning',
        icon: '🚨',
        message: 'Intervention urgente : le prestataire doit arriver dans les 2 heures.'
      });
    }

    // Warning pour formule récurrente
    if (breakdown.formula_type === 'recurring') {
      warnings.push({
        type: 'success',
        icon: '🔄',
        message: 'Formule abonnement : engagement de 4 réservations minimum sur 30 jours.'
      });
    }

    // Warning pour distance importante
    if (breakdown.distance_km > 20) {
      warnings.push({
        type: 'warning',
        icon: '🚗',
        message: `Distance importante (${breakdown.distance_km} km). Frais de déplacement: ${breakdown.distance_fee} MAD.`
      });
    }

    // Warning pour formule premium
    if (breakdown.formula_type === 'premium') {
      warnings.push({
        type: 'info',
        icon: '⭐',
        message: 'Service Premium : produits haut de gamme et garantie satisfaction inclus.'
      });
    }

    return warnings;
  }, [breakdown]);

  return {
    breakdown,
    loading,
    error,
    calculate,
    reset,
    getWarnings
  };
}

export default usePriceCalculation;
