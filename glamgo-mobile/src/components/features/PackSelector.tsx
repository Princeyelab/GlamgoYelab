/**
 * PackSelector - Selecteur de pack/forfait
 * Utilise pour les services type "Coach Sportif"
 * Packs avec nombre de seances et prix fixes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { hapticFeedback } from '../../lib/utils/haptics';

export interface Pack {
  id: string;
  name: string;
  sessions: number;
  price: number;
  pricePerSession: number;
  discount?: number; // Percentage discount
  popular?: boolean;
  icon?: string;
}

interface PackSelectorProps {
  packs: Pack[];
  selectedPackId: string;
  onChange: (packId: string) => void;
  disabled?: boolean;
}

export const COACH_PACKS: Pack[] = [
  {
    id: 'decouverte',
    name: 'Decouverte',
    sessions: 4,
    price: 700,
    pricePerSession: 175,
    icon: '🎯',
  },
  {
    id: 'classique',
    name: 'Classique',
    sessions: 8,
    price: 1200,
    pricePerSession: 150,
    discount: 17,
    popular: true,
    icon: '⭐',
  },
  {
    id: 'intensif',
    name: 'Intensif',
    sessions: 12,
    price: 1500,
    pricePerSession: 125,
    discount: 29,
    icon: '💪',
  },
];

export default function PackSelector({
  packs,
  selectedPackId,
  onChange,
  disabled = false,
}: PackSelectorProps) {
  const selectedPack = packs.find(p => p.id === selectedPackId);

  const handleSelect = (packId: string) => {
    if (!disabled) {
      hapticFeedback.selection();
      onChange(packId);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>Choisissez votre programme</Text>
      </View>

      {/* Pack Options */}
      <View style={styles.packsContainer}>
        {packs.map((pack) => {
          const isSelected = pack.id === selectedPackId;

          return (
            <TouchableOpacity
              key={pack.id}
              style={[
                styles.packCard,
                isSelected && styles.packCardSelected,
                pack.popular && styles.packCardPopular,
              ]}
              onPress={() => handleSelect(pack.id)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              {/* Popular Badge */}
              {pack.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAIRE</Text>
                </View>
              )}

              {/* Radio Button */}
              <View style={styles.radioContainer}>
                <View style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected
                ]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>

              {/* Pack Info */}
              <View style={styles.packInfo}>
                <View style={styles.packHeader}>
                  <Text style={styles.packIcon}>{pack.icon}</Text>
                  <Text style={[
                    styles.packName,
                    isSelected && styles.packNameSelected
                  ]}>
                    Pack {pack.name}
                  </Text>
                </View>
                <Text style={styles.packSessions}>
                  {pack.sessions} seances
                </Text>
              </View>

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text style={[
                  styles.packPrice,
                  isSelected && styles.packPriceSelected
                ]}>
                  {pack.price} DH
                </Text>
                {pack.discount && (
                  <Text style={styles.discountBadge}>
                    -{pack.discount}%
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Pack Summary */}
      {selectedPack && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Programme selectionne</Text>
            <Text style={styles.summaryValue}>
              {selectedPack.icon} {selectedPack.name} ({selectedPack.sessions} seances)
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Prix par seance</Text>
            <Text style={styles.summaryValue}>{selectedPack.pricePerSession} DH</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Prix total</Text>
            <Text style={styles.totalPrice}>{selectedPack.price} DH</Text>
          </View>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoIcon}>🏋️</Text>
        <Text style={styles.infoText}>
          Minimum 4 seances pour un suivi personnalise efficace. Les seances sont valables 3 mois.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  header: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  packsContainer: {
    gap: spacing.md,
  },
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  packCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  packCardPopular: {
    borderColor: colors.warning,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  radioContainer: {
    marginRight: spacing.md,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  packInfo: {
    flex: 1,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  packIcon: {
    fontSize: 16,
  },
  packName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[800],
  },
  packNameSelected: {
    color: colors.primary,
  },
  packSessions: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  packPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.gray[800],
  },
  packPriceSelected: {
    color: colors.primary,
  },
  discountBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.success,
    marginTop: 2,
  },
  summaryContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.gray[800],
  },
  summaryTotal: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[800],
  },
  totalPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    lineHeight: 20,
  },
});
