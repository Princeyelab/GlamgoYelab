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
import { useLanguage } from '../../contexts/LanguageContext';

interface PriceBreakdownCardProps {
  breakdown: PriceBreakdown;
  showDetails?: boolean;
}

export default function PriceBreakdownCard({
  breakdown,
  showDetails = true,
}: PriceBreakdownCardProps) {
  const { formatPrice, isLoaded } = useCurrency();
  const { t, isRTL } = useLanguage();

  // Format breakdown items with currency
  const formatBreakdownItems = () => {
    const items: { label: string; value: string; type: 'normal' | 'discount' | 'surcharge' }[] = [];

    items.push({
      label: t('priceBreakdown.basePrice'),
      value: formatPrice(breakdown.basePrice),
      type: 'normal',
    });

    if (breakdown.formulaModifier !== 1) {
      const modifier = breakdown.formulaModifier > 1 ? 'surcharge' : 'discount';
      const sign = breakdown.formulaModifier > 1 ? '+' : '';
      const diff = breakdown.formulaPrice - breakdown.basePrice;
      items.push({
        label: `${t('priceBreakdown.formula')} (${sign}${Math.round((breakdown.formulaModifier - 1) * 100)}%)`,
        value: `${diff > 0 ? '+' : ''}${formatPrice(Math.abs(diff))}`,
        type: modifier,
      });
    }

    if (breakdown.nightSurcharge > 0) {
      items.push({
        label: t('priceBreakdown.nightSurcharge'),
        value: `+${formatPrice(breakdown.nightSurcharge)}`,
        type: 'surcharge',
      });
    }

    if (breakdown.distanceFee > 0) {
      items.push({
        label: t('priceBreakdown.distanceFee'),
        value: `+${formatPrice(breakdown.distanceFee)}`,
        type: 'surcharge',
      });
    }

    if (breakdown.serviceFee > 0) {
      items.push({
        label: t('priceBreakdown.commission'),
        value: formatPrice(breakdown.serviceFee),
        type: 'normal',
      });
    }

    return items;
  };

  const items = formatBreakdownItems();

  return (
    <Card style={styles.container}>
      <Text style={[styles.title, isRTL && styles.rtlText]}>{t('priceBreakdown.title')}</Text>

      {showDetails && (
        <View style={styles.items}>
          {items.map((item, index) => (
            <View key={index} style={[styles.row, isRTL && styles.rowRTL]}>
              <Text style={[styles.label, isRTL && styles.rtlText]}>{item.label}</Text>
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
      <View style={[styles.totalRow, isRTL && styles.rowRTL]}>
        <Text style={[styles.totalLabel, isRTL && styles.rtlText]}>{t('priceBreakdown.total')}</Text>
        <Text style={styles.totalValue}>{formatPrice(breakdown.total)}</Text>
      </View>

      {/* Savings */}
      {breakdown.savings > 0 && (
        <View style={[styles.savingsRow, isRTL && styles.rowRTL]}>
          <Text style={styles.savingsIcon}>🎉</Text>
          <Text style={[styles.savingsText, isRTL && styles.rtlText]}>
            {t('priceBreakdown.savings', { amount: formatPrice(breakdown.savings) })}
          </Text>
        </View>
      )}

      {/* Night warning */}
      {breakdown.nightSurcharge > 0 && (
        <View style={[styles.warningRow, isRTL && styles.rowRTL]}>
          <Text style={styles.warningIcon}>🌙</Text>
          <Text style={[styles.warningText, isRTL && styles.rtlText]}>
            {t('priceBreakdown.nightWarning')}
          </Text>
        </View>
      )}

      {/* Distance fee warning (CGU) */}
      {breakdown.distanceFee > 0 && (
        <View style={[styles.distanceFeeRow, isRTL && styles.rowRTL]}>
          <Text style={styles.distanceFeeIcon}>📍</Text>
          <Text style={[styles.distanceFeeText, isRTL && styles.rtlText]}>
            {t('priceBreakdown.distanceWarning')}
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

  // Distance Fee (CGU)
  distanceFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  distanceFeeIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  distanceFeeText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: '500',
  },
  // RTL Styles
  rtlText: {
    textAlign: 'right',
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
});
