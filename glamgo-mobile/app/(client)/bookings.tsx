/**
 * Bookings Screen - GlamGo Mobile
 * Liste des reservations avec tabs (A venir / Historique)
 * Polling pour synchronisation temps reel avec le provider
 * Note: Le modal de satisfaction est maintenant global dans _layout.tsx
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import BookingCard from '../../src/components/features/BookingCard';
import SkeletonBookingCard from '../../src/components/features/SkeletonBookingCard';
import Badge from '../../src/components/ui/Badge';
import { SatisfactionModal } from '../../src/components/features/SatisfactionModal';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import {
  fetchBookings,
  cancelBooking,
  selectUpcomingBookings,
  selectPastBookings,
  selectBookingsLoading,
  selectBookingsError,
} from '../../src/lib/store/slices/bookingsSlice';
import { Booking, submitSatisfaction, SatisfactionData } from '../../src/lib/api/bookingsAPI';

type TabType = 'upcoming' | 'past';

// Intervalle de polling en ms (10 secondes)
const POLLING_INTERVAL = 10000;

export default function BookingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const upcomingBookings = useAppSelector(selectUpcomingBookings);
  const pastBookings = useAppSelector(selectPastBookings);
  const isLoading = useAppSelector(selectBookingsLoading);
  const error = useAppSelector(selectBookingsError);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [initialLoad, setInitialLoad] = useState(true);

  // State pour le modal de satisfaction (avis)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Refs pour le polling
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Demarrer le polling
  const startPolling = useCallback(() => {
    if (pollingInterval.current) return;
    pollingInterval.current = setInterval(() => {
      dispatch(fetchBookings());
    }, POLLING_INTERVAL);
  }, [dispatch]);

  // Arreter le polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // Gerer le changement d'etat de l'app (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App revient en foreground - recharger et redemarrer le polling
        dispatch(fetchBookings());
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        // App passe en background - arreter le polling
        stopPolling();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch, startPolling, stopPolling]);

  // Charger au montage et quand l'ecran devient actif
  useFocusEffect(
    useCallback(() => {
      loadBookings();
      startPolling();

      return () => {
        stopPolling();
      };
    }, [startPolling, stopPolling])
  );

  // Note: Le modal de satisfaction auto-ouvre depuis _layout.tsx (global)

  const loadBookings = async () => {
    try {
      const result = await dispatch(fetchBookings()).unwrap();
      console.log('[Bookings] Loaded:', result.length, 'bookings');
      console.log('[Bookings] Upcoming:', result.filter((b: any) =>
        ['pending', 'confirmed', 'accepted', 'on_way', 'in_progress'].includes(b.status)
      ).length);
      console.log('[Bookings] Past:', result.filter((b: any) =>
        ['completed', 'cancelled', 'rejected', 'no_show'].includes(b.status)
      ).length);
      // Debug: afficher les statuts
      const statusCounts: Record<string, number> = {};
      result.forEach((b: any) => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      });
      console.log('[Bookings] By status:', statusCounts);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
    } finally {
      setInitialLoad(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBookings();
    setIsRefreshing(false);
  };

  const handleCancelBooking = (bookingId: number) => {
    Alert.alert(
      'Annuler la reservation',
      'Etes-vous sur de vouloir annuler cette reservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelBooking({ id: bookingId })).unwrap();
              Alert.alert('Succes', 'Reservation annulee');
            } catch (err: any) {
              Alert.alert('Erreur', err || 'Impossible d\'annuler');
            }
          },
        },
      ]
    );
  };

  const handleContactProvider = (bookingId: number) => {
    // Naviguer vers le chat avec le prestataire
    router.push(`/chat/${bookingId}` as any);
  };

  const handleTrackProvider = (bookingId: number) => {
    router.push(`/booking/track/${bookingId}` as any);
  };

  const handleReview = (bookingId: number) => {
    // Trouver la reservation et ouvrir le modal de satisfaction directement
    const allBookings = [...upcomingBookings, ...pastBookings];
    const booking = allBookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBookingForReview(booking);
      setShowReviewModal(true);
    }
  };

  const handleSubmitReview = async (data: SatisfactionData) => {
    if (!selectedBookingForReview) return;

    try {
      await submitSatisfaction(selectedBookingForReview.id, data);
      Alert.alert('Merci !', 'Votre avis a ete enregistre.');
      setShowReviewModal(false);
      setSelectedBookingForReview(null);
      // Recharger les reservations pour mettre a jour le statut
      dispatch(fetchBookings());
    } catch (err: any) {
      throw err;
    }
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedBookingForReview(null);
  };

  const handleBookingPress = (booking: Booking) => {
    // Naviguer vers le suivi - le modal s'ouvrira automatiquement depuis _layout.tsx si besoin
    router.push(`/booking/track/${booking.id}` as any);
  };

  const bookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Mes Reservations</Text>
      <Text style={styles.subtitle}>Gerez vos rendez-vous beaute</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            A venir
          </Text>
          {upcomingBookings.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{upcomingBookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Historique
          </Text>
          {pastBookings.length > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeGray]}>
              <Text style={[styles.tabBadgeText, styles.tabBadgeTextGray]}>
                {pastBookings.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBooking = ({ item }: { item: Booking }) => (
    <BookingCard
      id={item.id}
      service={item.service ? {
        id: item.service.id,
        title: item.service.title,
        thumbnail: item.service.thumbnail,
      } : undefined}
      provider={item.provider ? {
        id: item.provider.id,
        name: item.provider.name,
        avatar: item.provider.avatar,
      } : undefined}
      date={item.date}
      time={item.start_time}
      status={item.status}
      total={item.total || item.price}
      currency={item.currency}
      address={item.address}
      variant={activeTab}
      onCancel={() => handleCancelBooking(item.id)}
      onContact={() => handleContactProvider(item.id)}
      onViewDetails={() => handleBookingPress(item)}
      onTrackProvider={() => handleTrackProvider(item.id)}
      onReview={() => handleReview(item.id)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'upcoming' ? '📅' : '📋'}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'upcoming' ? 'Aucune reservation a venir' : 'Aucun historique'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'upcoming'
          ? 'Reservez un service pour commencer'
          : 'Vos reservations passees apparaitront ici'}
      </Text>
      {activeTab === 'upcoming' && (
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.push('/(client)/services')}
        >
          <Text style={styles.browseButtonText}>Parcourir les services</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading state
  if (initialLoad && isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingHeader}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
          <View style={styles.skeletonTabs} />
        </View>
        <View style={styles.loadingList}>
          <SkeletonBookingCard />
          <SkeletonBookingCard />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      {/* Modal de satisfaction pour le bouton "Laisser un avis" */}
      {selectedBookingForReview && (
        <SatisfactionModal
          visible={showReviewModal}
          order={{
            id: selectedBookingForReview.id,
            service_name: selectedBookingForReview.service?.title,
            provider_name: selectedBookingForReview.provider?.name,
            price: selectedBookingForReview.price,
            total: selectedBookingForReview.total,
            payment_method: 'cash', // Par defaut cash pour les avis depuis l'historique
          }}
          onClose={handleCloseReviewModal}
          onSubmit={handleSubmitReview}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
  },
  tabTextActive: {
    color: colors.gray[900],
  },
  tabBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeGray: {
    backgroundColor: colors.gray[300],
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.white,
  },
  tabBadgeTextGray: {
    color: colors.gray[700],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  browseButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  // Loading skeleton
  loadingHeader: {
    backgroundColor: colors.white,
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  skeletonTitle: {
    width: 180,
    height: 28,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  skeletonSubtitle: {
    width: 220,
    height: 16,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  skeletonTabs: {
    height: 44,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.lg,
  },
  loadingList: {
    padding: spacing.lg,
  },
});
