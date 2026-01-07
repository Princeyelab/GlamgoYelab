/**
 * FormulaSelector Component - GlamGo Mobile
 * Selection de formule de reservation (Standard, Premium, Urgent, etc.)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { hapticFeedback } from '../../lib/utils/haptics';
import { useLanguage } from '../../contexts/LanguageContext';

export type FormulaType = 'standard' | 'premium' | 'urgent' | 'recurring' | 'night';

export interface Formula {
  id: FormulaType;
  name: string;
  description: string;
  icon: string;
  priceModifier: number; // 1 = 100%, 1.2 = 120%, etc.
  badge?: string;
  badgeColor?: string;
}

interface FormulaSelectorProps {
  selectedFormula: FormulaType;
  onSelect: (formula: FormulaType) => void;
  basePrice: number;
  disabled?: boolean;
}

// Base formula data without translations
const FORMULA_DATA: Omit<Formula, 'name' | 'description'>[] = [
  { id: 'standard', icon: '📅', priceModifier: 1 },
  { id: 'premium', icon: '⭐', priceModifier: 1.3, badge: '+30%', badgeColor: colors.warning },
  { id: 'urgent', icon: '⚡', priceModifier: 1.5, badge: '+50%', badgeColor: colors.error },
  { id: 'recurring', icon: '🔄', priceModifier: 0.9, badge: '-10%', badgeColor: colors.success },
  { id: 'night', icon: '🌙', priceModifier: 1.25, badge: '+25%', badgeColor: colors.accent },
];

// Get formulas with translations
export const getFormulas = (t: (key: string) => string): Formula[] => [
  { ...FORMULA_DATA[0], name: t('formulas.standard'), description: t('formulas.standardDesc') },
  { ...FORMULA_DATA[1], name: t('formulas.premium'), description: t('formulas.premiumDesc') },
  { ...FORMULA_DATA[2], name: t('formulas.urgent'), description: t('formulas.urgentDesc') },
  { ...FORMULA_DATA[3], name: t('formulas.recurring'), description: t('formulas.recurringDesc') },
  { ...FORMULA_DATA[4], name: t('formulas.night'), description: t('formulas.nightDesc') },
];

// For backward compatibility - default French
export const FORMULAS: Formula[] = [
  { id: 'standard', name: 'Standard', description: 'Reservation classique avec prestataire disponible', icon: '📅', priceModifier: 1 },
  { id: 'premium', name: 'Premium', description: 'Prestataire experimente, produits haut de gamme', icon: '⭐', priceModifier: 1.3, badge: '+30%', badgeColor: colors.warning },
  { id: 'urgent', name: 'Urgent', description: 'Intervention dans les 2 heures', icon: '⚡', priceModifier: 1.5, badge: '+50%', badgeColor: colors.error },
  { id: 'recurring', name: 'Recurrent', description: 'Reservation hebdomadaire ou mensuelle', icon: '🔄', priceModifier: 0.9, badge: '-10%', badgeColor: colors.success },
  { id: 'night', name: 'Nuit', description: 'Service entre 20h et 8h', icon: '🌙', priceModifier: 1.25, badge: '+25%', badgeColor: colors.accent },
];

export const getFormulaById = (id: FormulaType): Formula => {
  return FORMULAS.find(f => f.id === id) || FORMULAS[0];
};

export const calculateFormulaPrice = (basePrice: number, formula: FormulaType): number => {
  const formulaData = getFormulaById(formula);
  return Math.round(basePrice * formulaData.priceModifier);
};

export default function FormulaSelector({
  selectedFormula,
  onSelect,
  basePrice,
  disabled = false,
}: FormulaSelectorProps) {
  const { t, isRTL } = useLanguage();
  const formulas = getFormulas(t);

  const handleSelect = (formula: FormulaType) => {
    if (disabled) return;
    hapticFeedback.selection();
    onSelect(formula);
  };

  // Get formula by id with translations
  const getLocalizedFormula = (id: FormulaType): Formula => {
    return formulas.find(f => f.id === id) || formulas[0];
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isRTL && styles.rtlText]}>{t('formulas.chooseFormula')}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isRTL && styles.scrollContentRTL]}
      >
        {formulas.map((formula) => {
          const isSelected = selectedFormula === formula.id;
          const calculatedPrice = calculateFormulaPrice(basePrice, formula.id);

          return (
            <TouchableOpacity
              key={formula.id}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
                disabled && styles.cardDisabled,
              ]}
              onPress={() => handleSelect(formula.id)}
              activeOpacity={0.7}
              disabled={disabled}
            >
              {/* Badge */}
              {formula.badge && (
                <View style={[styles.badge, { backgroundColor: formula.badgeColor }]}>
                  <Text style={styles.badgeText}>{formula.badge}</Text>
                </View>
              )}

              {/* Icon */}
              <Text style={styles.icon}>{formula.icon}</Text>

              {/* Name */}
              <Text style={[styles.name, isSelected && styles.nameSelected]}>
                {formula.name}
              </Text>

              {/* Description */}
              <Text style={[styles.description, isSelected && styles.descriptionSelected]} numberOfLines={2}>
                {formula.description}
              </Text>

              {/* Price */}
              <Text style={[styles.price, isSelected && styles.priceSelected]}>
                {calculatedPrice} DH
              </Text>

              {/* Selection indicator */}
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected Formula Details */}
      <View style={styles.selectedDetails}>
        <View style={[styles.selectedHeader, isRTL && styles.selectedHeaderRTL]}>
          <Text style={styles.selectedIcon}>{getLocalizedFormula(selectedFormula).icon}</Text>
          <View style={styles.selectedInfo}>
            <Text style={[styles.selectedTitle, isRTL && styles.rtlText]}>
              {t('formulas.formulaLabel')} {getLocalizedFormula(selectedFormula).name}
            </Text>
            <Text style={[styles.selectedDescription, isRTL && styles.rtlText]}>
              {getLocalizedFormula(selectedFormula).description}
            </Text>
          </View>
        </View>
        {getLocalizedFormula(selectedFormula).priceModifier !== 1 && (
          <View style={[styles.modifierBadge, isRTL && styles.modifierBadgeRTL]}>
            <Text style={[styles.modifierBadgeLabel, isRTL && styles.rtlText]}>{t('formulas.priceModification')}</Text>
            <View style={[
              styles.modifierPill,
              getLocalizedFormula(selectedFormula).priceModifier > 1
                ? styles.modifierPillUp
                : styles.modifierPillDown
            ]}>
              <Text style={styles.modifierPillText}>
                {getLocalizedFormula(selectedFormula).priceModifier > 1 ? '+' : ''}
                {Math.round((getLocalizedFormula(selectedFormula).priceModifier - 1) * 100)}%
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingRight: spacing.lg,
    paddingTop: spacing.sm, // Espace pour les badges
    paddingBottom: spacing.xs,
  },

  // Card
  card: {
    width: 130,
    minHeight: 155,
    padding: spacing.sm,
    paddingTop: spacing.md,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    alignItems: 'center',
    position: 'relative',
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '15',
    ...shadows.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
  },
  cardDisabled: {
    opacity: 0.5,
  },

  // Badge
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 36,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.white,
  },

  // Content
  icon: {
    fontSize: 28,
    marginBottom: 6,
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 3,
    textAlign: 'center',
  },
  nameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  description: {
    fontSize: 11,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 6,
    minHeight: 28,
    lineHeight: 14,
  },
  descriptionSelected: {
    color: colors.gray[700],
  },
  price: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 6,
  },
  priceSelected: {
    color: colors.primary,
    fontSize: typography.fontSize.lg,
  },

  // Radio / Checkmark
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioSelected: {
    borderColor: colors.primary,
    borderWidth: 0,
    backgroundColor: colors.primary,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },

  // Selected Details
  selectedDetails: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 22,
    marginRight: spacing.xs,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  selectedDescription: {
    fontSize: 10,
    color: colors.gray[600],
    lineHeight: 14,
  },
  modifierBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.primary + '30',
  },
  modifierBadgeLabel: {
    fontSize: 10,
    color: colors.gray[600],
  },
  modifierPill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  modifierPillUp: {
    backgroundColor: colors.error,
  },
  modifierPillDown: {
    backgroundColor: colors.success,
  },
  modifierPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.white,
  },
  // RTL Styles
  rtlText: {
    textAlign: 'right',
  },
  scrollContentRTL: {
    flexDirection: 'row-reverse',
  },
  selectedHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  modifierBadgeRTL: {
    flexDirection: 'row-reverse',
  },
});
