/**
 * PriceBreakdownCard Component - GlamGo Mobile
 * Affichage detaille du calcul de prix
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Card from '../ui/Card';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import { PriceBreakdown, formatPriceBreakdown } from '../../lib/hooks/usePriceCalculation';
import { useCurrency } from '../../contexts/CurrencyContext';

interface PriceBreakdownCardProps {
  breakdown: PriceBreakdown;
  showDetails?: boolean;
}

export default function PriceBreakdownCard({
  breakdown,
  showDetails = true,
}: PriceBreakdownCardProps) {
  const { formatPrice, isLoaded } = useCurrency();

  // Format breakdown items with currency
  const formatBreakdownItems = () => {
    const items: { label: string; value: string; type: 'normal' | 'discount' | 'surcharge' }[] = [];

    items.push({
      label: 'Prix de base',
      value: formatPrice(breakdown.basePrice),
      type: 'normal',
    });

    if (breakdown.formulaModifier !== 1) {
      const modifier = breakdown.formulaModifier > 1 ? 'surcharge' : 'discount';
      const sign = breakdown.formulaModifier > 1 ? '+' : '';
      const diff = breakdown.formulaPrice - breakdown.basePrice;
      items.push({
        label: `Formule (${sign}${Math.round((breakdown.formulaModifier - 1) * 100)}%)`,
        value: `${diff > 0 ? '+' : ''}${formatPrice(Math.abs(diff))}`,
        type: modifier,
      });
    }

    if (breakdown.nightSurcharge > 0) {
      items.push({
        label: 'Majoration nuit (+25%)',
        value: `+${formatPrice(breakdown.nightSurcharge)}`,
        type: 'surcharge',
      });
    }

    if (breakdown.distanceFee > 0) {
      items.push({
        label: 'Frais de deplacement',
        value: `+${formatPrice(breakdown.distanceFee)}`,
        type: 'surcharge',
      });
    }

    if (breakdown.serviceFee > 0) {
      items.push({
        label: 'Dont commission GlamGo (20%)',
        value: formatPrice(breakdown.serviceFee),
        type: 'normal',
      });
    }

    return items;
  };

  const items = formatBreakdownItems();

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Recapitulatif du prix</Text>

      {showDetails && (
        <View style={styles.items}>
          {items.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={[
                styles.value,
                item.type === 'surcharge' && styles.valueSurcharge,
                item.type === 'discount' && styles.valueDiscount,
              ]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(breakdown.total)}</Text>
      </View>

      {/* Savings */}
      {breakdown.savings > 0 && (
        <View style={styles.savingsRow}>
          <Text style={styles.savingsIcon}>🎉</Text>
          <Text style={styles.savingsText}>
            Vous economisez {formatPrice(breakdown.savings)} avec la formule Recurrent !
          </Text>
        </View>
      )}

      {/* Night warning */}
      {breakdown.nightSurcharge > 0 && (
        <View style={styles.warningRow}>
          <Text style={styles.warningIcon}>🌙</Text>
          <Text style={styles.warningText}>
            Majoration nuit appliquee (20h - 8h)
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },

  // Items
  items: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  value: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    fontWeight: '500',
  },
  valueSurcharge: {
    color: colors.error,
  },
  valueDiscount: {
    color: colors.success,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.sm,
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  totalValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Savings
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.md,
  },
  savingsIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  savingsText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: '500',
  },

  // Warning
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: '500',
  },
});
