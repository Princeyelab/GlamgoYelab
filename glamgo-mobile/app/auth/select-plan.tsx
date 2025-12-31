/**
 * Sélection du plan d'abonnement - GlamGo Mobile
 * Étape obligatoire lors de l'inscription prestataire
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import {
  getSubscriptionPlans,
  subscribeToplan,
  SubscriptionPlan,
} from '../../src/lib/api/providerAPI';

// Icônes pour les plans
const PLAN_ICONS: Record<string, string> = {
  free: '🌱',
  essential: '⭐',
  premium: '💎',
  vip: '👑',
};

// Couleurs des badges
const BADGE_COLORS: Record<string, string> = {
  verified: colors.success,
  gold: '#FFD700',
  vip: '#9333EA',
};

export default function SelectPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await getSubscriptionPlans();
      setPlans(data);
      // Présélectionner le plan recommandé
      const recommended = data.find((p) => p.is_recommended);
      if (recommended) {
        setSelectedPlan(recommended);
      }
    } catch (error) {
      console.error('Erreur chargement plans:', error);
      Alert.alert('Erreur', 'Impossible de charger les plans d\'abonnement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    hapticFeedback.light();
    setSelectedPlan(plan);
  };

  const handleContinue = async () => {
    if (!selectedPlan) {
      Alert.alert('Attention', 'Veuillez sélectionner un plan');
      return;
    }

    hapticFeedback.medium();
    setIsSubmitting(true);

    try {
      // Souscrire au plan
      const result = await subscribeToplan(
        selectedPlan.id,
        selectedPlan.price === 0 ? 'free' : 'card'
      );

      console.log('[SelectPlan] Subscription created:', result);

      if (result.requires_payment && selectedPlan.price > 0) {
        // Rediriger vers la page de paiement
        router.push({
          pathname: '/auth/subscription-payment',
          params: {
            subscription_id: result.subscription_id,
            plan_name: selectedPlan.name,
            plan_price: selectedPlan.price,
          },
        });
      } else {
        // Plan gratuit ou paiement différé - aller au dashboard
        hapticFeedback.success();
        Alert.alert(
          'Bienvenue !',
          `Votre abonnement ${selectedPlan.name} est activé. Vous pouvez maintenant recevoir des réservations.`,
          [
            {
              text: 'Commencer',
              onPress: () => router.replace('/(provider)'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Erreur souscription:', error);
      hapticFeedback.error();
      Alert.alert(
        'Erreur',
        error?.response?.data?.message || 'Impossible de souscrire au plan'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Permettre de passer temporairement (plan gratuit par défaut)
    Alert.alert(
      'Plan Découverte',
      'Vous serez inscrit au plan Découverte gratuit. Vous pourrez changer de plan à tout moment depuis votre profil.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          onPress: async () => {
            const freePlan = plans.find((p) => p.slug === 'free');
            if (freePlan) {
              setSelectedPlan(freePlan);
              await handleContinue();
            } else {
              router.replace('/(provider)');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des formules...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choisissez votre formule</Text>
        <Text style={styles.headerSubtitle}>
          Sélectionnez le plan qui correspond à vos besoins
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            onPress={() => handleSelectPlan(plan)}
            activeOpacity={0.8}
          >
            <Card
              style={[
                styles.planCard,
                selectedPlan?.id === plan.id && styles.planCardSelected,
                plan.is_recommended && styles.planCardRecommended,
              ]}
            >
              {/* Badge recommandé */}
              {plan.is_recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommandé</Text>
                </View>
              )}

              {/* En-tête du plan */}
              <View style={styles.planHeader}>
                <Text style={styles.planIcon}>
                  {PLAN_ICONS[plan.slug] || '📋'}
                </Text>
                <View style={styles.planTitleContainer}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.badge_type && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: BADGE_COLORS[plan.badge_type] || colors.gray[400] },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {plan.badge_type === 'verified'
                          ? 'Vérifié'
                          : plan.badge_type === 'gold'
                          ? 'Gold'
                          : 'VIP'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceContainer}>
                  {plan.price === 0 ? (
                    <Text style={styles.priceFree}>Gratuit</Text>
                  ) : (
                    <>
                      <Text style={styles.price}>{plan.price}</Text>
                      <Text style={styles.priceCurrency}> DH/mois</Text>
                    </>
                  )}
                </View>
              </View>

              {/* Description */}
              <Text style={styles.planDescription}>{plan.description}</Text>

              {/* Avantages */}
              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Indicateurs clés */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {plan.commission_rate}%
                  </Text>
                  <Text style={styles.statLabel}>Commission</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    +{plan.visibility_boost}%
                  </Text>
                  <Text style={styles.statLabel}>Visibilité</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {plan.max_services === null ? '∞' : plan.max_services}
                  </Text>
                  <Text style={styles.statLabel}>Services</Text>
                </View>
              </View>

              {/* Indicateur de sélection */}
              <View
                style={[
                  styles.selectionIndicator,
                  selectedPlan?.id === plan.id && styles.selectionIndicatorActive,
                ]}
              >
                {selectedPlan?.id === plan.id && (
                  <Text style={styles.selectionCheck}>✓</Text>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant="primary"
          fullWidth
          onPress={handleContinue}
          loading={isSubmitting}
          disabled={!selectedPlan || isSubmitting}
        >
          {selectedPlan?.price === 0
            ? 'Commencer gratuitement'
            : `Continuer - ${selectedPlan?.price || 0} DH/mois`}
        </Button>

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Passer pour l'instant</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    opacity: 0.9,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Plan Card
  planCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  planCardRecommended: {
    borderColor: colors.success,
  },

  // Badge recommandé
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  recommendedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },

  // Plan Header
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  planTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planName: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceCurrency: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  priceFree: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.success,
  },

  // Description
  planDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: 20,
  },

  // Features
  featuresContainer: {
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  featureCheck: {
    color: colors.success,
    fontWeight: 'bold',
    marginRight: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
  featureText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: 18,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray[200],
  },

  // Selection indicator
  selectionIndicator: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectionCheck: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Actions
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  skipButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
});
