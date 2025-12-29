/**
 * CreditCardForm Component - GlamGo Mobile
 * Formulaire de saisie carte bancaire
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Keyboard,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';

export interface CardData {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
}

interface CreditCardFormProps {
  onCardChange: (card: CardData) => void;
  cardData: CardData;
  errors?: Record<string, string>;
  disabled?: boolean;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: String(i + 1).padStart(2, '0'),
}));

const YEARS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: String(year), label: String(year) };
});

export default function CreditCardForm({
  onCardChange,
  cardData,
  errors = {},
  disabled = false,
}: CreditCardFormProps) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length <= 16) {
      onCardChange({ ...cardData, cardNumber: formatCardNumber(cleaned) });
    }
  };

  const handleCvvChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      onCardChange({ ...cardData, cvv: cleaned });
    }
  };

  const openMonthPicker = () => {
    Keyboard.dismiss();
    setShowMonthPicker(true);
  };

  const openYearPicker = () => {
    Keyboard.dismiss();
    setShowYearPicker(true);
  };

  return (
    <View style={styles.container}>
      {/* Test Card Info */}
      <View style={styles.testInfo}>
        <Text style={styles.testInfoIcon}>🧪</Text>
        <Text style={styles.testInfoText}>
          Mode test: utilisez <Text style={styles.testCardNumber}>4242 4242 4242 4242</Text> pour tester
        </Text>
      </View>

      {/* Card Number */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Numero de carte *</Text>
        <TextInput
          style={[styles.input, errors.cardNumber && styles.inputError]}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor={colors.gray[400]}
          value={cardData.cardNumber}
          onChangeText={handleCardNumberChange}
          keyboardType="numeric"
          maxLength={19}
          editable={!disabled}
        />
        {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
      </View>

      {/* Expiry Row */}
      <View style={styles.row}>
        {/* Month */}
        <View style={[styles.formGroup, styles.rowItem]}>
          <Text style={styles.label}>Mois *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.expMonth && styles.inputError]}
            onPress={openMonthPicker}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={[styles.dropdownText, !cardData.expMonth && styles.dropdownPlaceholder]}>
              {cardData.expMonth || 'MM'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          {errors.expMonth && <Text style={styles.errorText}>{errors.expMonth}</Text>}
        </View>

        {/* Year */}
        <View style={[styles.formGroup, styles.rowItem]}>
          <Text style={styles.label}>Annee *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.expYear && styles.inputError]}
            onPress={openYearPicker}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={[styles.dropdownText, !cardData.expYear && styles.dropdownPlaceholder]}>
              {cardData.expYear || 'AAAA'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          {errors.expYear && <Text style={styles.errorText}>{errors.expYear}</Text>}
        </View>

        {/* CVV */}
        <View style={[styles.formGroup, styles.rowItem]}>
          <Text style={styles.label}>CVV *</Text>
          <TextInput
            style={[styles.input, errors.cvv && styles.inputError]}
            placeholder="123"
            placeholderTextColor={colors.gray[400]}
            value={cardData.cvv}
            onChangeText={handleCvvChange}
            keyboardType="numeric"
            maxLength={3}
            secureTextEntry
            editable={!disabled}
          />
          {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
        </View>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>
          Paiement securise. Vos donnees sont chiffrees et protegees.
        </Text>
      </View>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Text style={styles.modalCancel}>Fermer</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Mois d'expiration</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={styles.optionList}>
              {MONTHS.map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={[
                    styles.option,
                    cardData.expMonth === month.value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onCardChange({ ...cardData, expMonth: month.value });
                    setShowMonthPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    cardData.expMonth === month.value && styles.optionTextSelected,
                  ]}>
                    {month.label}
                  </Text>
                  {cardData.expMonth === month.value && (
                    <Text style={styles.optionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Text style={styles.modalCancel}>Fermer</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Annee d'expiration</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={styles.optionList}>
              {YEARS.map((year) => (
                <TouchableOpacity
                  key={year.value}
                  style={[
                    styles.option,
                    cardData.expYear === year.value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onCardChange({ ...cardData, expYear: year.value });
                    setShowYearPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    cardData.expYear === year.value && styles.optionTextSelected,
                  ]}>
                    {year.label}
                  </Text>
                  {cardData.expYear === year.value && (
                    <Text style={styles.optionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },

  // Test Info
  testInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  testInfoIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  testInfoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: 20,
  },
  testCardNumber: {
    fontFamily: 'monospace',
    fontWeight: '600',
    backgroundColor: colors.white,
    paddingHorizontal: 4,
  },

  // Form
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    minHeight: 44,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Row
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  dropdownText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
  },
  dropdownPlaceholder: {
    color: colors.gray[400],
  },
  dropdownIcon: {
    fontSize: 10,
    color: colors.gray[500],
  },

  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  securityIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing['2xl'],
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  modalCancel: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: '500',
  },

  // Options
  optionList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  optionSelected: {
    backgroundColor: colors.primary + '15',
  },
  optionText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});
