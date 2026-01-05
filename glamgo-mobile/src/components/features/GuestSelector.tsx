/**
 * GuestSelector - Selecteur de nombre de personnes
 * Utilise pour les services type "Chef a domicile"
 * Prix = prix_par_personne x nombre_de_personnes
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

interface GuestSelectorProps {
  value: number;
  onChange: (value: number) => void;
  minGuests?: number;
  maxGuests?: number;
  pricePerPerson: number;
  disabled?: boolean;
}

export default function GuestSelector({
  value,
  onChange,
  minGuests = 2,
  maxGuests = 12,
  pricePerPerson,
  disabled = false,
}: GuestSelectorProps) {
  const totalPrice = value * pricePerPerson;

  const handleDecrement = () => {
    if (value > minGuests && !disabled) {
      hapticFeedback.selection();
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < maxGuests && !disabled) {
      hapticFeedback.selection();
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>Nombre de personnes</Text>
        <Text style={styles.pricePerPerson}>{pricePerPerson} DH/pers</Text>
      </View>

      {/* Stepper */}
      <View style={styles.stepperContainer}>
        <TouchableOpacity
          style={[
            styles.stepperButton,
            value <= minGuests && styles.stepperButtonDisabled,
          ]}
          onPress={handleDecrement}
          disabled={disabled || value <= minGuests}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.stepperButtonText,
            value <= minGuests && styles.stepperButtonTextDisabled,
          ]}>
            -
          </Text>
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>{value}</Text>
          <Text style={styles.valueLabel}>
            personne{value > 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.stepperButton,
            value >= maxGuests && styles.stepperButtonDisabled,
          ]}
          onPress={handleIncrement}
          disabled={disabled || value >= maxGuests}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.stepperButtonText,
            value >= maxGuests && styles.stepperButtonTextDisabled,
          ]}>
            +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Total Price */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Prix total service</Text>
        <Text style={styles.totalPrice}>{totalPrice} DH</Text>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoIcon}>👨‍🍳</Text>
        <Text style={styles.infoText}>
          Le chef preparera un menu personnalise pour {value} personne{value > 1 ? 's' : ''}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  pricePerPerson: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stepperButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  stepperButtonDisabled: {
    backgroundColor: colors.gray[200],
  },
  stepperButtonText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.white,
    lineHeight: 32,
  },
  stepperButtonTextDisabled: {
    color: colors.gray[400],
  },
  valueContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  valueText: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.gray[900],
  },
  valueLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: -4,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
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
