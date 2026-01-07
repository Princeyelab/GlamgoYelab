/**
 * Sélection des formules de réservation - GlamGo Mobile
 * Étape après sélection des services lors de l'inscription prestataire
 * Design moderne avec gradients et cartes attractives
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  getAllBookingFormulas,
  getProviderFormulas,
  updateProviderFormulas,
  BookingFormula,
} from '../../src/lib/api/providerAPI';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mapping API formula names to translation keys
const FORMULA_NAME_TO_KEY: Record<string, string> = {
  'standard': 'standard',
  'premium': 'premium',
  'urgent': 'urgent',
  'récurrent': 'recurring',
  'recurrent': 'recurring',
  'nuit': 'night',
};

// Configuration visuelle des formules
const FORMULA_CONFIG: Record<string, {
  gradient: [string, string];
  accentColor: string;
}> = {
  standard: {
    gradient: ['#6B7280', '#9CA3AF'],
    accentColor: '#6B7280',
  },
  premium: {
    gradient: ['#F59E0B', '#FBBF24'],
    accentColor: '#F59E0B',
  },
  urgent: {
    gradient: ['#EF4444', '#F87171'],
    accentColor: '#EF4444',
  },
  recurring: {
    gradient: ['#10B981', '#34D399'],
    accentColor: '#10B981',
  },
  night: {
    gradient: ['#14B8A6', '#2DD4BF'],
    accentColor: '#14B8A6',
  },
};

export default function SelectFormulasScreen() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const [formulas, setFormulas] = useState<BookingFormula[]>([]);
  const [selectedFormulas, setSelectedFormulas] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get translated formula name and description
  const getFormulaTranslation = (formula: BookingFormula) => {
    const normalizedName = formula.name.toLowerCase().trim();
    const key = FORMULA_NAME_TO_KEY[normalizedName];
    if (key) {
      return {
        name: t(`formulas.${key}`),
        description: t(`formulas.${key}Desc`),
      };
    }
    return { name: formula.name, description: formula.description };
  };

  useEffect(() => {
    loadFormulas();
  }, []);

  const loadFormulas = async () => {
    try {
      // Charger toutes les formules disponibles et celles du prestataire
      const [allFormulas, providerFormulas] = await Promise.all([
        getAllBookingFormulas(),
        getProviderFormulas().catch(() => []),
      ]);

      setFormulas(allFormulas);

      // Si le prestataire a déjà des formules, les présélectionner
      if (providerFormulas && providerFormulas.length > 0) {
        const existingIds = providerFormulas.map((f: BookingFormula) => f.id);
        console.log('[SelectPlan] Provider existing formulas:', existingIds);
        setSelectedFormulas(existingIds);
      } else {
        // Sinon, présélectionner "Standard" par défaut pour les nouveaux
        const standard = allFormulas.find((f) => f.slug === 'standard');
        if (standard) {
          setSelectedFormulas([standard.id]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement formules:', error);
      Alert.alert(t('selectPlan.error'), t('selectPlan.cannotLoadFormulas'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFormula = (formula: BookingFormula) => {
    hapticFeedback.light();
    setSelectedFormulas(prev => {
      if (prev.includes(formula.id)) {
        // Ne pas permettre de tout désélectionner
        if (prev.length === 1) {
          Alert.alert(t('selectPlan.attention'), t('selectPlan.mustSelectOne'));
          return prev;
        }
        return prev.filter(id => id !== formula.id);
      }
      return [...prev, formula.id];
    });
  };

  const handleContinue = async () => {
    if (selectedFormulas.length === 0) {
      Alert.alert(t('selectPlan.attention'), t('selectPlan.selectAtLeastOne'));
      return;
    }

    hapticFeedback.medium();
    setIsSubmitting(true);

    try {
      // Utiliser PUT pour remplacer toutes les formules (gère ajout ET suppression)
      console.log('[SelectPlan] Updating provider formulas:', selectedFormulas);
      await updateProviderFormulas(selectedFormulas);

      hapticFeedback.success();
      Alert.alert(
        t('selectPlan.welcome'),
        t('selectPlan.formulasActivated').replace('{count}', selectedFormulas.length.toString()),
        [
          {
            text: t('selectPlan.start'),
            onPress: () => router.replace('/(provider)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur enregistrement formules:', error);
      hapticFeedback.error();
      Alert.alert(
        t('selectPlan.error'),
        error?.response?.data?.message || t('selectPlan.cannotSaveFormulas')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormulaConfig = (slug: string) => {
    return FORMULA_CONFIG[slug] || FORMULA_CONFIG.standard;
  };

  const getPriceModifierText = (modifier: number): string => {
    if (modifier === 1) return t('selectPlan.standardPriceLabel');
    if (modifier > 1) return t('selectPlan.plusOnPrice').replace('{percent}', Math.round((modifier - 1) * 100).toString());
    return t('selectPlan.minusOnPrice').replace('{percent}', Math.round((1 - modifier) * 100).toString());
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, isRTL && styles.textRTL]}>{t('selectPlan.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={['#7C3AED', '#A855F7', '#C084FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerIcon}>📋</Text>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('selectPlan.title')}</Text>
        <Text style={[styles.headerSubtitle, isRTL && styles.textRTL]}>
          {t('selectPlan.subtitle')}
        </Text>
        <View style={styles.selectedCount}>
          <Text style={[styles.selectedCountText, isRTL && styles.textRTL]}>
            {t('selectPlan.selectedCount').replace('{count}', selectedFormulas.length.toString())}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {formulas.map((formula) => {
          const config = getFormulaConfig(formula.slug);
          const isSelected = selectedFormulas.includes(formula.id);
          const translated = getFormulaTranslation(formula);

          return (
            <TouchableOpacity
              key={formula.id}
              onPress={() => handleToggleFormula(formula)}
              activeOpacity={0.9}
            >
              <View style={[
                styles.formulaCard,
                isSelected && styles.formulaCardSelected,
              ]}>
                {/* Badge prix */}
                {formula.badge_text && (
                  <View style={[styles.priceBadge, { backgroundColor: formula.badge_color || config.accentColor }]}>
                    <Text style={styles.priceBadgeText}>{formula.badge_text}</Text>
                  </View>
                )}

                {/* Header de la formule avec gradient */}
                <LinearGradient
                  colors={config.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.formulaHeader}
                >
                  <View style={[styles.formulaHeaderContent, isRTL && styles.formulaHeaderContentRTL]}>
                    <Text style={[styles.formulaIcon, isRTL && styles.formulaIconRTL]}>{formula.icon}</Text>
                    <View style={styles.formulaTitleContainer}>
                      <Text style={[styles.formulaName, isRTL && styles.textRTL]}>{translated.name}</Text>
                      <Text style={[styles.formulaModifier, isRTL && styles.textRTL]}>
                        {getPriceModifierText(formula.price_modifier)}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Corps de la carte */}
                <View style={styles.formulaBody}>
                  {/* Description */}
                  <Text style={[styles.formulaDescription, isRTL && styles.textRTL]}>{translated.description}</Text>

                  {/* Info modificateur */}
                  <View style={[styles.modifierCard, { backgroundColor: config.accentColor + '15' }, isRTL && styles.modifierCardRTL]}>
                    <Text style={[styles.modifierLabel, isRTL && styles.textRTL]}>{t('selectPlan.priceModifier')}</Text>
                    <Text style={[styles.modifierValue, { color: config.accentColor }]}>
                      x{formula.price_modifier.toFixed(2)}
                    </Text>
                  </View>

                  {/* Exemple de calcul */}
                  <View style={[styles.exampleContainer, isRTL && styles.exampleContainerRTL]}>
                    <Text style={[styles.exampleLabel, isRTL && styles.exampleLabelRTL]}>{t('selectPlan.example')}</Text>
                    <Text style={[styles.exampleText, isRTL && styles.textRTL]}>
                      {t('selectPlan.serviceTo').replace('{price}', '100')} → <Text style={[styles.examplePrice, { color: config.accentColor }]}>
                        {Math.round(100 * formula.price_modifier)} DH
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Indicateur de sélection */}
                <View style={[
                  styles.selectionIndicator,
                  isSelected && [styles.selectionIndicatorActive, { backgroundColor: config.accentColor }]
                ]}>
                  {isSelected && <Text style={styles.selectionCheck}>✓</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Note d'information */}
        <View style={[styles.infoCard, isRTL && styles.infoCardRTL]}>
          <Text style={[styles.infoIcon, isRTL && styles.infoIconRTL]}>💡</Text>
          <Text style={[styles.infoText, isRTL && styles.textRTL]}>
            {t('selectPlan.infoText')}
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedFormulas.length === 0 && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={selectedFormulas.length === 0 || isSubmitting}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={selectedFormulas.length > 0 ? ['#7C3AED', '#A855F7'] : ['#D1D5DB', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButtonGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[
                styles.continueButtonText,
                selectedFormulas.length === 0 && styles.continueButtonTextDisabled,
                isRTL && styles.textRTL
              ]}>
                {selectedFormulas.length > 0
                  ? t('selectPlan.continueWith').replace('{count}', selectedFormulas.length.toString())
                  : t('selectPlan.selectAtLeastOne')}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  selectedCount: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  selectedCountText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Formula Card
  formulaCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadows.lg,
  },
  formulaCardSelected: {
    borderColor: colors.primary,
  },

  // Badge prix
  priceBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomLeftRadius: 12,
    zIndex: 10,
  },
  priceBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.white,
  },

  // Formula Header
  formulaHeader: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  formulaHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formulaIcon: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  formulaTitleContainer: {
    flex: 1,
  },
  formulaName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  formulaModifier: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  // Formula Body
  formulaBody: {
    padding: spacing.lg,
  },
  formulaDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    lineHeight: 22,
    marginBottom: spacing.md,
  },

  // Modifier card
  modifierCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  modifierLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  modifierValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
  },

  // Example
  exampleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  exampleLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginRight: spacing.sm,
  },
  exampleText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  examplePrice: {
    fontWeight: 'bold',
  },

  // Selection indicator
  selectionIndicator: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectionIndicatorActive: {
    borderColor: 'transparent',
  },
  selectionCheck: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 18,
  },

  // Actions
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  continueButtonTextDisabled: {
    color: colors.gray[500],
  },

  // RTL Styles
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  formulaHeaderContentRTL: {
    flexDirection: 'row-reverse',
  },
  formulaIconRTL: {
    marginRight: 0,
    marginLeft: spacing.md,
  },
  modifierCardRTL: {
    flexDirection: 'row-reverse',
  },
  exampleContainerRTL: {
    flexDirection: 'row-reverse',
  },
  exampleLabelRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  infoCardRTL: {
    flexDirection: 'row-reverse',
  },
  infoIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
});
