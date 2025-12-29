/**
 * CurrencySelector Component - GlamGo Mobile
 * Selecteur de devise pour les clients
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { useCurrency } from '../../contexts/CurrencyContext';
import { hapticFeedback } from '../../lib/utils/haptics';

export default function CurrencySelector() {
  const { currency, setCurrency, currencies, currencyInfo, showOriginalPrice, toggleShowOriginal } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (code: string) => {
    hapticFeedback.light();
    setCurrency(code);
    setIsOpen(false);
  };

  const openModal = () => {
    hapticFeedback.light();
    setIsOpen(true);
  };

  return (
    <>
      {/* Currency Button - Show currency code */}
      <TouchableOpacity style={styles.selectorButton} onPress={openModal}>
        <Text style={styles.selectorCode}>{currency}</Text>
      </TouchableOpacity>

      {/* Currency Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir la devise</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={currencies}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    item.code === currency && styles.currencyItemActive,
                  ]}
                  onPress={() => handleSelect(item.code)}
                >
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencySymbol}>{item.symbol}</Text>
                    <View>
                      <Text style={styles.currencyCode}>{item.code}</Text>
                      <Text style={styles.currencyName}>{item.name}</Text>
                    </View>
                  </View>
                  {item.code === currency && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.currencyList}
            />

            {/* Option pour afficher le prix original */}
            {currency !== 'MAD' && (
              <TouchableOpacity
                style={styles.originalPriceOption}
                onPress={toggleShowOriginal}
              >
                <View style={styles.checkboxContainer}>
                  <View style={[styles.checkbox, showOriginalPrice && styles.checkboxChecked]}>
                    {showOriginalPrice && <Text style={styles.checkboxMark}>✓</Text>}
                  </View>
                  <Text style={styles.originalPriceText}>
                    Afficher aussi le prix en DH
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Selector Button - Pill shape for currency code
  selectorButton: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorCode: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    ...shadows.lg,
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: 'bold',
  },

  // Currency List
  currencyList: {
    paddingHorizontal: spacing.md,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.xs,
  },
  currencyItemActive: {
    backgroundColor: colors.primary + '15',
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  currencySymbol: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.primary,
    width: 40,
    textAlign: 'center',
  },
  currencyCode: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  currencyName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  checkmark: {
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    fontWeight: 'bold',
  },

  // Original Price Option
  originalPriceOption: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  originalPriceText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
});
