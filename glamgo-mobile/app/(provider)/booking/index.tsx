/**
 * Provider Booking/Journey Tab - GlamGo Mobile
 * Ecran d'accueil du tab Trajet - affiche les trajets actifs ou etat vide
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/lib/constants/theme';
import { hapticFeedback } from '../../../src/lib/utils/haptics';
import { getProviderOrders } from '../../../src/lib/api/providerAPI';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { getServiceTranslation } from '../../../src/i18n/translations/services';

interface ActiveJourney {
  id: number;
  clientName: string;
  serviceName: string;
  address: string;
  scheduledTime: string;
  status: 'on_way' | 'arrived' | 'in_progress';
  price: number;
}

export default function BookingIndexScreen() {
  const router = useRouter();
  const { t, isRTL, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeJourneys, setActiveJourneys] = useState<ActiveJourney[]>([]);

  const loadActiveJourneys = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      // Charger TOUTES les commandes puis filtrer cote client
      const orders = await getProviderOrders();
      console.log('[TRAJET TAB] All orders:', orders?.length, orders?.map((o: any) => ({ id: o.id, status: o.status })));

      // Filtrer les commandes avec trajet actif
      const journeys: ActiveJourney[] = (orders || [])
        .filter((order: any) => {
          const validStatuses = ['accepted', 'on_way', 'arrived', 'in_progress', 'started'];
          const isValid = validStatuses.includes(order.status) && !order.cancelled_at;
          console.log('[TRAJET TAB] Order', order.id, 'status:', order.status, 'valid:', isValid);
          return isValid;
        })
        .map((order: any) => {
          // Utiliser price (champ principal) ou service.price
          const price = order.price || order.service?.price || order.total_amount || 0;
          return {
            id: order.id,
            clientName: order.user_name || order.client?.name || order.client_name || 'Client',
            serviceName: order.service?.title || order.service_name || 'Service',
            address: order.address || order.client_address || '',
            scheduledTime: order.start_time || order.scheduled_time || '',
            status: mapOrderStatus(order.status),
            price: typeof price === 'string' ? parseFloat(price) : price,
          };
        });

      setActiveJourneys(journeys);
    } catch (error) {
      console.error('[Booking] Erreur chargement trajets:', error);
      setActiveJourneys([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const mapOrderStatus = (status: string): 'on_way' | 'arrived' | 'in_progress' => {
    switch (status) {
      case 'arrived':
        return 'arrived';
      case 'in_progress':
      case 'started':
        return 'in_progress';
      default:
        return 'on_way';
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadActiveJourneys();
    }, [loadActiveJourneys])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback.light();
    await loadActiveJourneys(false);
  };

  const handleStartJourney = (journeyId: number) => {
    hapticFeedback.medium();
    router.push(`/(provider)/booking/journey/${journeyId}`);
  };

  const handleGoToBookings = () => {
    hapticFeedback.light();
    router.push('/(provider)/bookings');
  };

  const getStatusInfo = (status: 'on_way' | 'arrived' | 'in_progress') => {
    switch (status) {
      case 'on_way':
        return { label: t('journeyTab.onWay'), color: colors.info, icon: '🚗' };
      case 'arrived':
        return { label: t('journeyTab.arrived'), color: colors.warning, icon: '📍' };
      case 'in_progress':
        return { label: t('journeyTab.inProgress'), color: colors.primary, icon: '✂️' };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, isRTL && styles.textRTL]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('journeyTab.title')}</Text>
        <Text style={[styles.headerSubtitle, isRTL && styles.textRTL]}>
          {t('journeyTab.subtitle')}
        </Text>
      </View>

      {activeJourneys.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>🚗</Text>
          </View>
          <Text style={[styles.emptyTitle, isRTL && styles.textRTL]}>{t('journeyTab.noActiveJourney')}</Text>
          <Text style={[styles.emptyDescription, isRTL && styles.textRTL]}>
            {t('journeyTab.emptyDescription')}
          </Text>

          <View style={styles.emptyFeatures}>
            <View style={[styles.featureItem, isRTL && styles.featureItemRTL]}>
              <Text style={[styles.featureIcon, isRTL && styles.featureIconRTL]}>📍</Text>
              <Text style={[styles.featureText, isRTL && styles.textRTL]}>{t('journeyTab.gpsNavigation')}</Text>
            </View>
            <View style={[styles.featureItem, isRTL && styles.featureItemRTL]}>
              <Text style={[styles.featureIcon, isRTL && styles.featureIconRTL]}>📞</Text>
              <Text style={[styles.featureText, isRTL && styles.textRTL]}>{t('journeyTab.quickContact')}</Text>
            </View>
            <View style={[styles.featureItem, isRTL && styles.featureItemRTL]}>
              <Text style={[styles.featureIcon, isRTL && styles.featureIconRTL]}>⏱️</Text>
              <Text style={[styles.featureText, isRTL && styles.textRTL]}>{t('journeyTab.timeTracking')}</Text>
            </View>
          </View>

          <Button
            variant="outline"
            size="lg"
            onPress={handleGoToBookings}
            style={styles.goToBookingsButton}
          >
            {t('journeyTab.viewRequests')}
          </Button>
        </View>
      ) : (
        /* Active Journeys List */
        <View style={styles.journeysContainer}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
            {activeJourneys.length === 1 ? t('journeyTab.activeJourney') : t('journeyTab.activeJourneys', { count: activeJourneys.length })}
          </Text>

          {activeJourneys.map((journey) => {
            const statusInfo = getStatusInfo(journey.status);
            return (
              <TouchableOpacity
                key={journey.id}
                onPress={() => handleStartJourney(journey.id)}
                activeOpacity={0.7}
              >
                <Card style={styles.journeyCard}>
                  <View style={styles.journeyHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                      <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                    <Text style={styles.journeyPrice}>{journey.price} DH</Text>
                  </View>

                  <View style={styles.journeyInfo}>
                    <Text style={styles.clientName}>{journey.clientName}</Text>
                    <Text style={styles.serviceName}>{getServiceTranslation(journey.serviceName, language).title}</Text>
                    <Text style={styles.address} numberOfLines={1}>
                      📍 {journey.address}
                    </Text>
                  </View>

                  <View style={[styles.journeyFooter, isRTL && styles.journeyFooterRTL]}>
                    <Text style={[styles.scheduledTime, isRTL && styles.textRTL]}>
                      🕐 {journey.scheduledTime}
                    </Text>
                    <View style={styles.continueButton}>
                      <Text style={styles.continueText}>{isRTL ? '← ' : ''}{t('journeyTab.continue')}{isRTL ? '' : ' →'}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Tips Card */}
      <Card style={styles.tipsCard}>
        <Text style={[styles.tipsTitle, isRTL && styles.textRTL]}>💡 {t('journeyTab.tips')}</Text>
        <Text style={[styles.tipsText, isRTL && styles.textRTL]}>
          {t('journeyTab.tip1')}{'\n'}
          {t('journeyTab.tip2')}{'\n'}
          {t('journeyTab.tip3')}
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },

  // Header
  header: {
    backgroundColor: colors.white,
    paddingTop: 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  emptyFeatures: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  goToBookingsButton: {
    minWidth: 200,
  },

  // Journeys List
  journeysContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  journeyCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  journeyPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.success,
  },
  journeyInfo: {
    marginBottom: spacing.md,
  },
  clientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginBottom: 4,
  },
  address: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  journeyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  scheduledTime: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  continueButton: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  continueText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },

  // Tips Card
  tipsCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.info + '08',
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  tipsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.info,
    marginBottom: spacing.sm,
  },
  tipsText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    lineHeight: 22,
  },
  // RTL Styles
  textRTL: {
    textAlign: 'right',
  },
  featureItemRTL: {
    flexDirection: 'row-reverse',
  },
  featureIconRTL: {
    marginRight: 0,
    marginLeft: spacing.md,
  },
  journeyFooterRTL: {
    flexDirection: 'row-reverse',
  },
});
