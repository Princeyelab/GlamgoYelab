/**
 * Provider Formulas Management - GlamGo Mobile
 * Gestion des formules de reservation par le prestataire
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../../src/components/ui/Card';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  getAllBookingFormulas,
  getProviderFormulas,
  addProviderFormulas,
  removeProviderFormula,
  BookingFormula,
} from '../../src/lib/api/providerAPI';

// Mapping API formula names to translation keys
const FORMULA_NAME_TO_KEY: Record<string, string> = {
  'standard': 'standard',
  'premium': 'premium',
  'urgent': 'urgent',
  'récurrent': 'recurring',
  'recurrent': 'recurring',
  'nuit': 'night',
};

export default function ProviderFormulasScreen() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

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
  const [allFormulas, setAllFormulas] = useState<BookingFormula[]>([]);
  const [myFormulas, setMyFormulas] = useState<BookingFormula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<number[]>([]);

  const loadFormulas = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [all, mine] = await Promise.all([
        getAllBookingFormulas(),
        getProviderFormulas(),
      ]);
      setAllFormulas(all || []);
      setMyFormulas(mine || []);
    } catch (error) {
      console.error('Erreur chargement formules:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFormulas();
    }, [loadFormulas])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback.light();
    await loadFormulas(false);
  };

  const isFormulaActive = (formulaId: number): boolean => {
    return myFormulas.some(f => f.id === formulaId);
  };

  const handleToggleFormula = async (formula: BookingFormula) => {
    const isActive = isFormulaActive(formula.id);

    // Add to processing
    setProcessingIds(prev => [...prev, formula.id]);

    try {
      if (isActive) {
        // Remove formula
        await removeProviderFormula(formula.id);
        hapticFeedback.success();
        setMyFormulas(prev => prev.filter(f => f.id !== formula.id));
      } else {
        // Add formula
        await addProviderFormulas([formula.id]);
        hapticFeedback.success();
        setMyFormulas(prev => [...prev, formula]);
      }
    } catch (error) {
      hapticFeedback.error();
      Alert.alert(t('common.error'), t('formulas.modifyError'));
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== formula.id));
    }
  };

  const getPriceModifierText = (modifier: number): string => {
    if (modifier === 1) return t('formulas.standardPrice');
    if (modifier > 1) return `+${Math.round((modifier - 1) * 100)}%`;
    return `-${Math.round((1 - modifier) * 100)}%`;
  };

  const getPriceModifierColor = (modifier: number): string => {
    if (modifier === 1) return colors.gray[600];
    if (modifier > 1) return colors.warning;
    return colors.success;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('formulas.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={['#7C3AED', '#A855F7', '#C084FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>{t('formulas.myFormulas')}</Text>
          <Text style={[styles.headerSubtitle, isRTL && styles.rtlText]}>
            {t('formulas.chooseFormulas')}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <LinearGradient
            colors={['#7C3AED', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statValue}>{myFormulas.length}</Text>
            <Text style={styles.statLabel}>{t('formulas.activeFormulas')}</Text>
          </LinearGradient>
          <View style={[styles.statCard, styles.statCardLight]}>
            <Text style={[styles.statValue, styles.statValueDark]}>{allFormulas.length}</Text>
            <Text style={[styles.statLabel, styles.statLabelDark]}>{t('formulas.available')}</Text>
          </View>
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoIcon}>{'💡'}</Text>
          <Text style={[styles.infoText, isRTL && styles.rtlText]}>
            {t('formulas.infoText')}
          </Text>
        </Card>

        {/* All Formulas */}
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('formulas.allFormulas')}</Text>

        {allFormulas.map((formula) => {
          const isActive = isFormulaActive(formula.id);
          const isProcessing = processingIds.includes(formula.id);
          const translated = getFormulaTranslation(formula);

          return (
            <Card key={formula.id} style={[styles.formulaCard, isActive && styles.formulaCardActive]}>
              <View style={styles.formulaHeader}>
                <View style={styles.formulaIconContainer}>
                  <Text style={styles.formulaIcon}>{formula.icon}</Text>
                </View>
                <View style={styles.formulaInfo}>
                  <View style={styles.formulaNameRow}>
                    <Text style={[styles.formulaName, isRTL && styles.rtlText]}>{translated.name}</Text>
                    {formula.badge_text && (
                      <View style={[styles.badge, { backgroundColor: formula.badge_color || colors.primary }]}>
                        <Text style={styles.badgeText}>{formula.badge_text}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.formulaDescription, isRTL && styles.rtlText]} numberOfLines={2}>
                    {translated.description}
                  </Text>
                </View>
                {isProcessing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Switch
                    value={isActive}
                    onValueChange={() => handleToggleFormula(formula)}
                    trackColor={{ false: colors.gray[200], true: colors.primary + '50' }}
                    thumbColor={isActive ? colors.primary : colors.gray[400]}
                  />
                )}
              </View>

              <View style={[styles.formulaDetails, isRTL && styles.rtlRow]}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t('formulas.priceModifier')}</Text>
                  <Text style={[styles.detailValue, { color: getPriceModifierColor(formula.price_modifier) }]}>
                    {getPriceModifierText(formula.price_modifier)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>{t('formulas.status')}</Text>
                  <Text style={[styles.statusText, isActive ? styles.statusActive : styles.statusInactive]}>
                    {isActive ? `✓ ${t('formulas.active')}` : t('formulas.inactive')}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  backIcon: {
    fontSize: 20,
    color: colors.white,
  },
  headerContent: {
    marginTop: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    marginTop: -40,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statCardLight: {
    backgroundColor: colors.white,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
  },
  statValueDark: {
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
  },
  statLabelDark: {
    color: colors.gray[500],
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '20',
    marginBottom: spacing.lg,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: 20,
  },

  // Section
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },

  // Formula card
  formulaCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formulaCardActive: {
    borderColor: colors.primary + '30',
    backgroundColor: colors.primary + '05',
  },
  formulaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formulaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  formulaIcon: {
    fontSize: 24,
  },
  formulaInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  formulaNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  formulaName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
  formulaDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    lineHeight: 18,
  },

  // Formula details
  formulaDetails: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  detailItem: {},
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  statusActive: {
    color: colors.success,
  },
  statusInactive: {
    color: colors.gray[400],
  },

  // Bottom
  bottomSpacer: {
    height: spacing['3xl'],
  },
  // RTL styles
  rtlText: {
    textAlign: 'right',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
});
