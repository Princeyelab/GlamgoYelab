/**
 * RadiusSelector - Selection du perimetre de recherche
 * Permet de choisir le rayon de recherche des prestataires
 * Affiche un avertissement si le perimetre depasse 15km (frais CGU)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';

interface RadiusSelectorProps {
  selectedRadius: number;
  onRadiusChange: (radius: number) => void;
  disabled?: boolean;
}

interface RadiusOption {
  value: number;
  label: string;
  isFree: boolean;
}

// Options de rayon disponibles
const RADIUS_OPTIONS: RadiusOption[] = [
  { value: 5, label: '5 km', isFree: false },
  { value: 10, label: '10 km', isFree: false },
  { value: 15, label: '15 km', isFree: true },
  { value: 20, label: '20 km', isFree: false },
  { value: 30, label: '30 km', isFree: false },
  { value: 50, label: '50 km', isFree: false },
  { value: 100, label: '100 km', isFree: false },
];

// Rayon d'intervention gratuit (selon CGU)
export const FREE_RADIUS_KM = 15;

// Prix par km supplementaire (selon CGU)
export const PRICE_PER_EXTRA_KM = 5;

export default function RadiusSelector({
  selectedRadius,
  onRadiusChange,
  disabled = false,
}: RadiusSelectorProps) {
  const showWarning = selectedRadius > FREE_RADIUS_KM;

  const handlePress = (value: number) => {
    if (!disabled) {
      onRadiusChange(value);
    }
  };

  const renderOption = (option: RadiusOption) => {
    const isSelected = selectedRadius === option.value;
    const optionStyles = [
      styles.option,
      option.isFree && !isSelected ? styles.optionFree : null,
      isSelected ? styles.optionSelected : null,
      disabled ? styles.optionDisabled : null,
    ].filter(Boolean);

    const textStyles = [
      styles.optionText,
      isSelected ? styles.optionTextSelected : null,
    ].filter(Boolean);

    const freeLabelStyles = [
      styles.freeLabel,
      isSelected ? styles.freeLabelSelected : null,
    ].filter(Boolean);

    return (
      <TouchableOpacity
        key={option.value}
        style={optionStyles}
        onPress={() => handlePress(option.value)}
        disabled={disabled}
      >
        <Text style={textStyles}>{option.label}</Text>
        {option.isFree ? (
          <Text style={freeLabelStyles}>Gratuit</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Perimetre de recherche</Text>
        {showWarning ? (
          <View style={styles.warningBadge}>
            <Text style={styles.warningBadgeText}>Frais CGU</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {RADIUS_OPTIONS.map(renderOption)}
      </ScrollView>

      {showWarning ? (
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>{'ℹ️'}</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Frais de deplacement applicables</Text>
            <Text style={styles.warningText}>
              {`Au-dela de 15 km, des frais de ${PRICE_PER_EXTRA_KM} DH/km s'appliquent selon nos CGU.`}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Calcule les frais de deplacement selon la distance
 */
export function calculateDistanceFee(distanceKm: number): {
  fee: number;
  extraKm: number;
  isInFreeRadius: boolean;
} {
  if (distanceKm <= FREE_RADIUS_KM) {
    return {
      fee: 0,
      extraKm: 0,
      isInFreeRadius: true,
    };
  }

  const extraKm = Math.ceil(distanceKm - FREE_RADIUS_KM);
  const fee = extraKm * PRICE_PER_EXTRA_KM;

  return {
    fee,
    extraKm,
    isInFreeRadius: false,
  };
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
  },
  warningBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  warningBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.warning,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionFree: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
  },
  optionTextSelected: {
    color: colors.white,
  },
  freeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    marginTop: 2,
  },
  freeLabelSelected: {
    color: colors.white,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 2,
  },
  warningText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    lineHeight: 18,
  },
});
