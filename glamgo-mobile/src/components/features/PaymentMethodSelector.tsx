/**
 * PaymentMethodSelector Component - GlamGo Mobile
 * Selection du mode de paiement
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
import { useLanguage } from '../../contexts/LanguageContext';

export type PaymentMethod = 'cash' | 'card';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
}

// Get payment options with translations
const getPaymentOptions = (t: (key: string) => string): PaymentOption[] => [
  {
    id: 'cash',
    name: t('payment.cash'),
    description: t('payment.cashDesc'),
    icon: '💵',
  },
  {
    id: 'card',
    name: t('payment.card'),
    description: t('payment.cardDesc'),
    icon: '💳',
  },
];

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const { t, isRTL } = useLanguage();
  const paymentOptions = getPaymentOptions(t);

  const handleSelect = (method: PaymentMethod) => {
    if (disabled) return;
    hapticFeedback.selection();
    onSelect(method);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isRTL && styles.rtlText]}>{t('payment.paymentMethod')}</Text>

      <View style={styles.options}>
        {paymentOptions.map((option) => {
          const isSelected = selectedMethod === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
                disabled && styles.optionDisabled,
              ]}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionText}>
                  <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                    {option.name}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </View>

              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Card info notice */}
      {selectedMethod === 'card' && (
        <View style={[styles.notice, isRTL && styles.noticeRTL]}>
          <Text style={styles.noticeIcon}>🔒</Text>
          <Text style={[styles.noticeText, isRTL && styles.rtlText]}>
            {t('payment.cardNotice')}
          </Text>
        </View>
      )}

      {/* Cash notice */}
      {selectedMethod === 'cash' && (
        <View style={[styles.notice, isRTL && styles.noticeRTL]}>
          <Text style={styles.noticeIcon}>ℹ️</Text>
          <Text style={[styles.noticeText, isRTL && styles.rtlText]}>
            {t('payment.cashNotice')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },

  // Options
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  optionNameSelected: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // Radio
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  // Notice
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  noticeIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  // RTL Styles
  rtlText: {
    textAlign: 'right',
  },
  noticeRTL: {
    flexDirection: 'row-reverse',
  },
});
