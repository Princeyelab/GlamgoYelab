/**
 * usePriceCalculation Hook - GlamGo Mobile
 * Calcul du prix en temps reel avec formules, majorations et frais
 */

import { useMemo } from 'react';
import { FormulaType, getFormulaById } from '../../components/features/FormulaSelector';

export interface PriceBreakdown {
  basePrice: number;
  formulaModifier: number;
  formulaPrice: number;
  nightSurcharge: number;
  distanceFee: number;
  serviceFee: number;
  total: number;
  savings: number;
}

export interface PriceCalculationParams {
  basePrice: number;
  formula: FormulaType;
  selectedDateTime?: Date;
  distance?: number; // in km
  includeServiceFee?: boolean;
  distanceFee?: number; // Override: frais CGU calcules externalement
}

// Night hours: 20h - 8h
const isNightHour = (date: Date): boolean => {
  const hours = date.getHours();
  return hours >= 20 || hours < 8;
};

// Calculate night surcharge (25%)
const calculateNightSurcharge = (price: number, date?: Date): number => {
  if (!date) return 0;
  if (!isNightHour(date)) return 0;
  return Math.round(price * 0.25);
};

// Calculate distance fee
const calculateDistanceFee = (distance?: number): number => {
  if (!distance || distance <= 5) return 0; // Free under 5km
  if (distance <= 10) return 20; // 20 DH for 5-10km
  if (distance <= 20) return 40; // 40 DH for 10-20km
  return 60; // 60 DH for 20km+
};

// Commission GlamGo (20%) - incluse dans le prix, pas en supplement
const calculateServiceFee = (subtotal: number): number => {
  return Math.round(subtotal * 0.20);
};

export const usePriceCalculation = ({
  basePrice,
  formula,
  selectedDateTime,
  distance,
  includeServiceFee = true,
  distanceFee: externalDistanceFee,
}: PriceCalculationParams): PriceBreakdown => {
  return useMemo(() => {
    // Get formula data
    const formulaData = getFormulaById(formula);

    // Calculate formula price
    const formulaModifier = formulaData.priceModifier;
    const formulaPrice = Math.round(basePrice * formulaModifier);

    // Calculate night surcharge (on formula price)
    const nightSurcharge = calculateNightSurcharge(formulaPrice, selectedDateTime);

    // Calculate distance fee (utiliser le frais CGU externe si fourni, sinon calcul interne)
    const distanceFee = externalDistanceFee !== undefined
      ? externalDistanceFee
      : calculateDistanceFee(distance);

    // Calculate total (avant commission)
    const total = formulaPrice + nightSurcharge + distanceFee;

    // Calculate commission GlamGo (20% inclus dans le prix, pour info)
    const serviceFee = includeServiceFee ? calculateServiceFee(total) : 0;

    // Calculate savings (for recurring formula)
    const savings = formula === 'recurring' ? Math.round(basePrice * 0.1) : 0;

    return {
      basePrice,
      formulaModifier,
      formulaPrice,
      nightSurcharge,
      distanceFee,
      serviceFee,
      total,
      savings,
    };
  }, [basePrice, formula, selectedDateTime, distance, includeServiceFee, externalDistanceFee]);
};

// Helper to format price breakdown for display
export const formatPriceBreakdown = (breakdown: PriceBreakdown): { label: string; value: string; type: 'normal' | 'discount' | 'surcharge' }[] => {
  const items: { label: string; value: string; type: 'normal' | 'discount' | 'surcharge' }[] = [];

  items.push({
    label: 'Prix de base',
    value: `${breakdown.basePrice} DH`,
    type: 'normal',
  });

  if (breakdown.formulaModifier !== 1) {
    const modifier = breakdown.formulaModifier > 1 ? 'surcharge' : 'discount';
    const sign = breakdown.formulaModifier > 1 ? '+' : '';
    items.push({
      label: `Formule (${sign}${Math.round((breakdown.formulaModifier - 1) * 100)}%)`,
      value: `${breakdown.formulaPrice - breakdown.basePrice > 0 ? '+' : ''}${breakdown.formulaPrice - breakdown.basePrice} DH`,
      type: modifier,
    });
  }

  if (breakdown.nightSurcharge > 0) {
    items.push({
      label: 'Majoration nuit (+25%)',
      value: `+${breakdown.nightSurcharge} DH`,
      type: 'surcharge',
    });
  }

  if (breakdown.distanceFee > 0) {
    items.push({
      label: 'Frais de deplacement (CGU)',
      value: `+${breakdown.distanceFee} DH`,
      type: 'surcharge',
    });
  }

  if (breakdown.serviceFee > 0) {
    items.push({
      label: 'Dont commission GlamGo (20%)',
      value: `${breakdown.serviceFee} DH`,
      type: 'normal',
    });
  }

  return items;
};

export default usePriceCalculation;
