/**
 * Provider Dashboard - GlamGo Mobile
 * Tableau de bord complet du prestataire
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { selectUser, switchRole } from '../../src/lib/store/slices/authSlice';
import { hapticFeedback } from '../../src/lib/utils/haptics';

// Types
type PeriodType = 'today' | 'week' | 'month';
type BookingStatus = 'pending' | 'accepted' | 'on_way' | 'in_progress' | 'completed' | 'cancelled';

interface BookingService {
  title: string;
  duration_minutes: number;
  price: number;
}

interface BookingUser {
  name: string;
  phone: string;
}

interface TodayBooking {
  id: number;
  order_number: string;
  status: BookingStatus;
  service: BookingService;
  user: BookingUser;
  booking_date: string;
  booking_time: string;
  address: string;
}

// Mock data stats par période
const MOCK_STATS = {
  today: {
    bookings: 3,
    earnings: 850,
    completed: 2,
  },
  week: {
    bookings: 12,
    earnings: 3200,
    completed: 10,
  },
  month: {
    bookings: 48,
    earnings: 14500,
    completed: 42,
  },
  rating: 4.8,
  reviews_count: 156,
  completion_rate: 95,
};

// Mock reservations du jour
const MOCK_TODAY_BOOKINGS: TodayBooking[] = [
  {
    id: 1,
    order_number: 'BK-2024-001',
    status: 'pending',
    service: { title: 'Coupe Femme', duration_minutes: 60, price: 150 },
    user: { name: 'Sophie Martin', phone: '+212 6 12 34 56 78' },
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '10:00:00',
    address: '15 Rue Mohammed V, Marrakech',
  },
  {
    id: 2,
    order_number: 'BK-2024-002',
    status: 'accepted',
    service: { title: 'Manucure', duration_minutes: 45, price: 120 },
    user: { name: 'Amina Idrissi', phone: '+212 6 23 45 67 89' },
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '14:30:00',
    address: '28 Avenue Hassan II, Marrakech',
  },
  {
    id: 3,
    order_number: 'BK-2024-003',
    status: 'in_progress',
    service: { title: 'Coupe + Brushing', duration_minutes: 90, price: 200 },
    user: { name: 'Karim Bensaid', phone: '+212 6 34 56 78 90' },
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '16:00:00',
    address: '42 Boulevard Zerktouni, Marrakech',
  },
];

export default function ProviderDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('today');
  const [bookings, setBookings] = useState<TodayBooking[]>(MOCK_TODAY_BOOKINGS);

  const stats = MOCK_STATS[selectedPeriod];

  // Switch to client mode
  const handleSwitchToClient = () => {
    hapticFeedback.medium();
    Alert.alert(
      'Mode Client',
      'Basculer vers l\'espace client ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            dispatch(switchRole('user'));
            router.replace('/(client)');
          },
        },
      ]
    );
  };

  // Pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback.light();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // Status helpers
  const getStatusColor = (status: BookingStatus): 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'on_way': return 'accent';
      case 'in_progress': return 'primary';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: BookingStatus): string => {
    switch (status) {
      case 'pending': return '⏳ En attente';
      case 'accepted': return '✅ Accepté';
      case 'on_way': return '🚗 En route';
      case 'in_progress': return '🔨 En cours';
      case 'completed': return '✓ Terminé';
      case 'cancelled': return '✕ Annulé';
      default: return status;
    }
  };

  // Booking actions
  const handleAcceptBooking = (id: number) => {
    hapticFeedback.success();
    setBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'accepted' as BookingStatus } : b)
    );
  };

  const handleRejectBooking = (id: number) => {
    hapticFeedback.warning();
    Alert.alert(
      'Refuser la réservation',
      'Êtes-vous sûr de vouloir refuser cette réservation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: () => {
            setBookings(prev =>
              prev.map(b => b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b)
            );
          },
        },
      ]
    );
  };

  const handleStartRoute = (id: number) => {
    hapticFeedback.medium();
    setBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'on_way' as BookingStatus } : b)
    );
    // Navigate to journey mode with booking ID
    router.push(`/(provider)/booking/journey/${id}` as any);
  };

  const handleArrived = (id: number) => {
    hapticFeedback.medium();
    setBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'in_progress' as BookingStatus } : b)
    );
  };

  const handleCompleteService = (id: number) => {
    hapticFeedback.success();
    setBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'completed' as BookingStatus } : b)
    );
  };

  const getCardStyle = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return styles.cardPending;
      case 'accepted':
        return styles.cardAccepted;
      case 'on_way':
        return styles.cardOnWay;
      case 'in_progress':
        return styles.cardInProgress;
      default:
        return {};
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={handleSwitchToClient}
          >
            <Text style={styles.switchModeIcon}>👤</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.name}>{user?.first_name || user?.name || 'Prestataire'} 👋</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as PeriodType[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => {
              hapticFeedback.selection();
              setSelectedPeriod(period);
            }}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period === 'today' ? "Aujourd'hui" : period === 'week' ? 'Semaine' : 'Mois'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, styles.statCardBlue]}>
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statValue}>{stats.bookings}</Text>
          <Text style={styles.statLabel}>Réservations</Text>
        </Card>

        <Card style={[styles.statCard, styles.statCardGreen]}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={[styles.statValue, styles.statValueGreen]}>{stats.earnings} DH</Text>
          <Text style={styles.statLabel}>Revenus</Text>
        </Card>

        <Card style={[styles.statCard, styles.statCardPurple]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Complétés</Text>
        </Card>

        <Card style={[styles.statCard, styles.statCardYellow]}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={[styles.statValue, styles.statValueYellow]}>{MOCK_STATS.rating}</Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </Card>
      </View>

      {/* Performance */}
      <Card style={styles.performanceCard}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceRow}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Taux de complétion</Text>
            <Text style={styles.performanceValue}>{MOCK_STATS.completion_rate}%</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Total avis</Text>
            <Text style={styles.performanceValue}>{MOCK_STATS.reviews_count}</Text>
          </View>
        </View>
      </Card>

      {/* Today's Bookings */}
      <View style={styles.todaySection}>
        <View style={styles.todaySectionHeader}>
          <Text style={styles.sectionTitle}>Réservations du jour</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/bookings')}>
            <Text style={styles.viewAll}>Voir tout →</Text>
          </TouchableOpacity>
        </View>

        {bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length === 0 ? (
          <Card>
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>Aucune réservation active</Text>
            </View>
          </Card>
        ) : (
          bookings
            .filter(b => b.status !== 'completed' && b.status !== 'cancelled')
            .map((booking) => (
              <Card key={booking.id} style={[styles.bookingCard, getCardStyle(booking.status)]}>
                {/* Header */}
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingHeaderLeft}>
                    <Text style={styles.bookingService}>{booking.service.title}</Text>
                    <Text style={styles.bookingOrder}>#{booking.order_number}</Text>
                  </View>
                  <Badge color={getStatusColor(booking.status)} size="sm" variant="soft">
                    {getStatusLabel(booking.status)}
                  </Badge>
                </View>

                {/* Client Info */}
                <View style={styles.bookingClient}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {booking.user.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{booking.user.name}</Text>
                    <Text style={styles.clientPhone}>{booking.user.phone}</Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingDetail}>
                    🕐 {booking.booking_time.substring(0, 5)} • {booking.service.duration_minutes} min
                  </Text>
                  <Text style={styles.bookingDetail}>
                    📍 {booking.address}
                  </Text>
                  <Text style={styles.bookingPrice}>
                    💰 {booking.service.price} DH
                  </Text>
                </View>

                {/* Actions based on status */}
                <View style={styles.bookingActions}>
                  {booking.status === 'pending' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => handleRejectBooking(booking.id)}
                        style={styles.rejectButton}
                        textStyle={styles.rejectButtonText}
                      >
                        Refuser
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onPress={() => handleAcceptBooking(booking.id)}
                        style={styles.acceptButton}
                      >
                        Accepter
                      </Button>
                    </>
                  )}

                  {booking.status === 'accepted' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() => handleStartRoute(booking.id)}
                      fullWidth
                    >
                      🚗 Démarrer (En route)
                    </Button>
                  )}

                  {booking.status === 'on_way' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() => handleArrived(booking.id)}
                      fullWidth
                    >
                      📍 Je suis arrivé
                    </Button>
                  )}

                  {booking.status === 'in_progress' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() => handleCompleteService(booking.id)}
                      fullWidth
                    >
                      ✅ Terminer le service
                    </Button>
                  )}
                </View>
              </Card>
            ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              hapticFeedback.light();
              router.push('/(provider)/bookings');
            }}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionLabel}>Commandes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              hapticFeedback.light();
              router.push('/(provider)/earnings');
            }}
          >
            <Text style={styles.quickActionIcon}>💰</Text>
            <Text style={styles.quickActionLabel}>Revenus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              hapticFeedback.light();
              router.push('/settings');
            }}
          >
            <Text style={styles.quickActionIcon}>⚙️</Text>
            <Text style={styles.quickActionLabel}>Paramètres</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              hapticFeedback.light();
              Alert.alert('Aide', 'Support: support@glamgo.ma');
            }}
          >
            <Text style={styles.quickActionIcon}>❓</Text>
            <Text style={styles.quickActionLabel}>Aide</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spacer for tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 60,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  switchModeIcon: {
    fontSize: 20,
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  name: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  notificationButton: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
  },
  periodButtonTextActive: {
    color: colors.white,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    padding: spacing.lg,
  },
  statCardBlue: {
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 3,
    borderBottomColor: '#3B82F6',
  },
  statCardGreen: {
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 3,
    borderBottomColor: colors.success,
  },
  statCardPurple: {
    backgroundColor: '#FAF5FF',
    borderBottomWidth: 3,
    borderBottomColor: '#A855F7',
  },
  statCardYellow: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 3,
    borderBottomColor: '#F59E0B',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  statValueGreen: {
    color: colors.success,
  },
  statValueYellow: {
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    textAlign: 'center',
  },

  // Performance
  performanceCard: {
    marginBottom: spacing.lg,
  },
  performanceRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  performanceItem: {
    flex: 1,
  },
  performanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Section Title
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },

  // Today Section
  todaySection: {
    marginBottom: spacing.lg,
  },
  todaySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  // Booking Card
  bookingCard: {
    marginBottom: spacing.md,
  },
  cardPending: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  cardAccepted: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  cardOnWay: {
    backgroundColor: '#F0FDFA',
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  cardInProgress: {
    backgroundColor: '#FFF1F2',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bookingHeaderLeft: {
    flex: 1,
  },
  bookingService: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  bookingOrder: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  bookingClient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[100],
    marginBottom: spacing.md,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  bookingDetails: {
    gap: 4,
    marginBottom: spacing.md,
  },
  bookingDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  bookingPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  rejectButtonText: {
    color: colors.gray[700],
  },
  acceptButton: {
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },

  // Quick Actions
  quickActions: {
    marginBottom: spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickActionButton: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    fontWeight: '500',
  },
});
