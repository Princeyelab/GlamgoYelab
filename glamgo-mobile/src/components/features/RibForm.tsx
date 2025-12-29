/**
 * RibForm Component - GlamGo Mobile
 * Formulaire de saisie RIB bancaire
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

export interface RibData {
  titulaire: string;
  banque: string;
  numero: string;
}

interface RibFormProps {
  onRibChange: (rib: RibData) => void;
  ribData: RibData;
  errors?: Record<string, string>;
  disabled?: boolean;
}

const MOROCCAN_BANKS = [
  { value: 'attijari', label: 'Attijariwafa Bank', code: '007' },
  { value: 'bmce', label: 'BMCE Bank (BOA)', code: '011' },
  { value: 'bp', label: 'Banque Populaire', code: '101' },
  { value: 'cih', label: 'CIH Bank', code: '021' },
  { value: 'sgmb', label: 'Societe Generale', code: '022' },
  { value: 'bmci', label: 'BMCI', code: '013' },
  { value: 'cdm', label: 'Credit du Maroc', code: '013' },
  { value: 'cfg', label: 'CFG Bank', code: '026' },
  { value: 'al_barid', label: 'Al Barid Bank', code: '024' },
  { value: 'cab', label: 'Credit Agricole', code: '004' },
];

// RIB de test pour le developpement
const TEST_RIB = '007 780 0001234567890123 45';

export default function RibForm({
  onRibChange,
  ribData,
  errors = {},
  disabled = false,
}: RibFormProps) {
  const [showBankPicker, setShowBankPicker] = useState(false);

  const formatRibNumber = (value: string) => {
    // Nettoyer et garder que les chiffres
    const cleaned = value.replace(/\D/g, '').slice(0, 24);
    // Format: XXX XXX XXXXXXXXXXXXXXXX XX (3-3-16-2)
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 22) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 22)} ${cleaned.slice(22)}`;
  };

  const handleRibNumberChange = (value: string) => {
    const formatted = formatRibNumber(value);
    onRibChange({ ...ribData, numero: formatted });
  };

  const handleTitulaireChange = (value: string) => {
    onRibChange({ ...ribData, titulaire: value });
  };

  const openBankPicker = () => {
    Keyboard.dismiss();
    setShowBankPicker(true);
  };

  const fillTestRib = () => {
    onRibChange({
      titulaire: 'JEAN DUPONT TEST',
      banque: 'attijari',
      numero: TEST_RIB,
    });
  };

  const selectedBank = MOROCCAN_BANKS.find(b => b.value === ribData.banque);

  return (
    <View style={styles.container}>
      {/* Test RIB Info */}
      <View style={styles.testInfo}>
        <Text style={styles.testInfoIcon}>🧪</Text>
        <View style={styles.testInfoContent}>
          <Text style={styles.testInfoText}>
            Mode test: utilisez le RIB de test
          </Text>
          <TouchableOpacity onPress={fillTestRib} disabled={disabled}>
            <Text style={styles.testRibNumber}>{TEST_RIB}</Text>
          </TouchableOpacity>
          <Text style={styles.testInfoHint}>Appuyez pour remplir automatiquement</Text>
        </View>
      </View>

      {/* Titulaire */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Titulaire du compte *</Text>
        <TextInput
          style={[styles.input, errors.ribTitulaire && styles.inputError]}
          placeholder="Nom et prenom du titulaire"
          placeholderTextColor={colors.gray[400]}
          value={ribData.titulaire}
          onChangeText={handleTitulaireChange}
          autoCapitalize="characters"
          editable={!disabled}
        />
        {errors.ribTitulaire && <Text style={styles.errorText}>{errors.ribTitulaire}</Text>}
      </View>

      {/* Banque */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Banque *</Text>
        <TouchableOpacity
          style={[styles.dropdown, errors.ribBanque && styles.inputError]}
          onPress={openBankPicker}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={[styles.dropdownText, !ribData.banque && styles.dropdownPlaceholder]}>
            {selectedBank?.label || 'Selectionnez votre banque'}
          </Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
        {errors.ribBanque && <Text style={styles.errorText}>{errors.ribBanque}</Text>}
      </View>

      {/* Numero RIB */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Numero RIB *</Text>
        <TextInput
          style={[styles.input, styles.ribInput, errors.ribNumero && styles.inputError]}
          placeholder="XXX XXX XXXXXXXXXXXXXXXX XX"
          placeholderTextColor={colors.gray[400]}
          value={ribData.numero}
          onChangeText={handleRibNumberChange}
          keyboardType="numeric"
          maxLength={27} // 24 chiffres + 3 espaces
          editable={!disabled}
        />
        <Text style={styles.helperText}>24 chiffres (code banque + code ville + numero compte + cle)</Text>
        {errors.ribNumero && <Text style={styles.errorText}>{errors.ribNumero}</Text>}
      </View>

      {/* Info Notice */}
      <View style={styles.infoNotice}>
        <Text style={styles.infoIcon}>🏦</Text>
        <Text style={styles.infoText}>
          Ce compte recevra vos virements sous 7 jours apres chaque prestation payee par carte.
        </Text>
      </View>

      {/* Bank Picker Modal */}
      <Modal
        visible={showBankPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBankPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBankPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Text style={styles.modalCancel}>Fermer</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Choisir une banque</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={styles.optionList}>
              {MOROCCAN_BANKS.map((bank) => (
                <TouchableOpacity
                  key={bank.value}
                  style={[
                    styles.option,
                    ribData.banque === bank.value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onRibChange({ ...ribData, banque: bank.value });
                    setShowBankPicker(false);
                  }}
                >
                  <View style={styles.bankOption}>
                    <Text style={[
                      styles.optionText,
                      ribData.banque === bank.value && styles.optionTextSelected,
                    ]}>
                      {bank.label}
                    </Text>
                    <Text style={styles.bankCode}>Code: {bank.code}</Text>
                  </View>
                  {ribData.banque === bank.value && (
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
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  testInfoIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  testInfoContent: {
    flex: 1,
  },
  testInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  testRibNumber: {
    fontFamily: 'monospace',
    fontWeight: '600',
    fontSize: typography.fontSize.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    color: '#2e7d32',
    overflow: 'hidden',
  },
  testInfoHint: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
    fontStyle: 'italic',
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
  ribInput: {
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
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

  // Info Notice
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  infoText: {
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
    maxHeight: '60%',
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
  bankOption: {
    flex: 1,
  },
  optionText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  bankCode: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  optionCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});
