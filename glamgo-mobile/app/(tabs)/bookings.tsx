/**
 * Bookings Screen - GlamGo Mobile
 * Liste des reservations avec tabs (A venir / Historique)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import BookingCard from '../../src/components/features/BookingCard';
import SkeletonBookingCard from '../../src/components/features/SkeletonBookingCard';
import Badge from '../../src/components/ui/Badge';
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
import { Booking } from '../../src/lib/api/bookingsAPI';

type TabType = 'upcoming' | 'past';

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

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      await dispatch(fetchBookings()).unwrap();
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

  const handleContactProvider = (providerId: number) => {
    console.log('Contact provider:', providerId);
    // TODO: Navigation vers chat
  };

  const handleTrackProvider = (bookingId: number) => {
    console.log('Track provider:', bookingId);
    // TODO: Navigation vers map
  };

  const handleBookingPress = (booking: Booking) => {
    console.log('Booking pressed:', booking.id);
    // TODO: Navigation vers details
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
      total={item.price}
      currency={item.currency}
      address={item.address}
      variant={activeTab}
      onCancel={() => handleCancelBooking(item.id)}
      onContact={() => handleContactProvider(item.provider_id)}
      onViewDetails={() => handleBookingPress(item)}
      onTrackProvider={() => handleTrackProvider(item.id)}
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
          onPress={() => router.push('/(tabs)/services')}
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
