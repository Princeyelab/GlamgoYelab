/**
 * Provider Bookings Management - GlamGo Mobile
 * Gestion complète des commandes du prestataire
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { hapticFeedback } from '../../src/lib/utils/haptics';

// Types
type BookingTab = 'pending' | 'upcoming' | 'in_progress' | 'completed';
type BookingStatus = 'pending' | 'accepted' | 'on_way' | 'in_progress' | 'completed' | 'cancelled';

interface BookingService {
  title: string;
  duration_minutes: number;
  price: number;
}

interface BookingUser {
  name: string;
  phone: string;
  avatar: string | null;
}

interface Booking {
  id: number;
  order_number: string;
  status: BookingStatus;
  service: BookingService;
  user: BookingUser;
  booking_date: string;
  booking_time: string;
  address: string;
  notes?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  rating?: number;
}

interface BookingsState {
  pending: Booking[];
  upcoming: Booking[];
  in_progress: Booking[];
  completed: Booking[];
}

// Mock bookings par status
const MOCK_BOOKINGS: BookingsState = {
  pending: [
    {
      id: 1,
      order_number: 'BK-2024-001',
      status: 'pending',
      service: { title: 'Coupe Femme', duration_minutes: 60, price: 150 },
      user: { name: 'Sophie Martin', phone: '+212 6 12 34 56 78', avatar: null },
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: '10:00:00',
      address: '15 Rue Mohammed V, Marrakech',
      notes: 'Coupe dégradée avec frange',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      order_number: 'BK-2024-005',
      status: 'pending',
      service: { title: 'Massage Relaxant', duration_minutes: 90, price: 300 },
      user: { name: 'Karim Alami', phone: '+212 6 23 45 67 89', avatar: null },
      booking_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      booking_time: '15:00:00',
      address: '28 Boulevard Hassan II, Marrakech',
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ],
  upcoming: [
    {
      id: 3,
      order_number: 'BK-2024-002',
      status: 'accepted',
      service: { title: 'Manucure', duration_minutes: 45, price: 120 },
      user: { name: 'Amina Idrissi', phone: '+212 6 34 56 78 90', avatar: null },
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: '14:30:00',
      address: '42 Avenue Zerktouni, Marrakech',
      notes: 'Vernis rouge',
    },
  ],
  in_progress: [
    {
      id: 4,
      order_number: 'BK-2024-003',
      status: 'in_progress',
      service: { title: 'Coupe + Brushing', duration_minutes: 90, price: 200 },
      user: { name: 'Fatima Zahra', phone: '+212 6 45 67 89 01', avatar: null },
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: '11:00:00',
      address: '8 Rue Ibn Khaldoun, Marrakech',
      started_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
  ],
  completed: [
    {
      id: 5,
      order_number: 'BK-2024-004',
      status: 'completed',
      service: { title: 'Coupe Homme', duration_minutes: 30, price: 80 },
      user: { name: 'Hassan Benali', phone: '+212 6 56 78 90 12', avatar: null },
      booking_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      booking_time: '16:00:00',
      address: '55 Rue de la Liberté, Marrakech',
      completed_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      rating: 5,
    },
    {
      id: 6,
      order_number: 'BK-2024-006',
      status: 'completed',
      service: { title: 'Maquillage Soirée', duration_minutes: 60, price: 250 },
      user: { name: 'Leila Bennani', phone: '+212 6 67 89 01 23', avatar: null },
      booking_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0],
      booking_time: '18:00:00',
      address: '12 Rue des Roses, Marrakech',
      completed_at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
      rating: 4,
    },
  ],
};

export default function ProviderBookingsScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<BookingTab>('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BookingsState>(MOCK_BOOKINGS);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback.light();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleCallClient = (phone: string) => {
    hapticFeedback.light();
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const handleAcceptBooking = (bookingId: number) => {
    hapticFeedback.success();
    Alert.alert(
      'Accepter la réservation',
      'Confirmez-vous cette réservation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: () => {
            const booking = bookings.pending.find(b => b.id === bookingId);
            if (booking) {
              setBookings(prev => ({
                ...prev,
                pending: prev.pending.filter(b => b.id !== bookingId),
                upcoming: [...prev.upcoming, { ...booking, status: 'accepted' as BookingStatus }],
              }));
            }
          },
        },
      ]
    );
  };

  const handleRejectBooking = (bookingId: number) => {
    hapticFeedback.warning();
    Alert.alert(
      'Refuser la réservation',
      'Êtes-vous sûr ? Le client sera notifié.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: () => {
            setBookings(prev => ({
              ...prev,
              pending: prev.pending.filter(b => b.id !== bookingId),
            }));
          },
        },
      ]
    );
  };

  const handleStartJourney = (bookingId: number) => {
    hapticFeedback.medium();
    const booking = bookings.upcoming.find(b => b.id === bookingId);
    if (booking) {
      setBookings(prev => ({
        ...prev,
        upcoming: prev.upcoming.filter(b => b.id !== bookingId),
        in_progress: [...prev.in_progress, {
          ...booking,
          status: 'on_way' as BookingStatus,
          started_at: new Date().toISOString(),
        }],
      }));
      // Navigate to journey tracking screen
      router.push(`/(provider)/booking/journey/${bookingId}` as any);
    }
  };

  const handleArrived = (bookingId: number) => {
    hapticFeedback.medium();
    setBookings(prev => ({
      ...prev,
      in_progress: prev.in_progress.map(b =>
        b.id === bookingId ? { ...b, status: 'in_progress' as BookingStatus } : b
      ),
    }));
  };

  const handleCompleteBooking = (bookingId: number) => {
    hapticFeedback.success();
    Alert.alert(
      'Terminer le service',
      'Le service est-il terminé ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, terminer',
          onPress: () => {
            const booking = bookings.in_progress.find(b => b.id === bookingId);
            if (booking) {
              setBookings(prev => ({
                ...prev,
                in_progress: prev.in_progress.filter(b => b.id !== bookingId),
                completed: [...prev.completed, {
                  ...booking,
                  status: 'completed' as BookingStatus,
                  completed_at: new Date().toISOString(),
                }],
              }));
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: BookingStatus) => {
    const config: Record<BookingStatus, { color: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'; label: string }> = {
      pending: { color: 'warning', label: '⏳ Nouveau' },
      accepted: { color: 'success', label: '✅ Accepté' },
      on_way: { color: 'accent', label: '🚗 En route' },
      in_progress: { color: 'primary', label: '🔨 En cours' },
      completed: { color: 'default', label: '✓ Terminé' },
      cancelled: { color: 'error', label: '✕ Annulé' },
    };
    return config[status];
  };

  const formatRelativeTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
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
      case 'completed':
        return styles.cardCompleted;
      default:
        return {};
    }
  };

  const renderBookingCard = ({ item: booking }: { item: Booking }) => {
    const statusConfig = getStatusBadge(booking.status);

    return (
      <Card style={[styles.bookingCard, getCardStyle(booking.status)]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.serviceName}>{booking.service.title}</Text>
            <Text style={styles.orderNumber}>#{booking.order_number}</Text>
          </View>
          <Badge color={statusConfig.color} size="sm" variant="soft">
            {statusConfig.label}
          </Badge>
        </View>

        {/* Client */}
        <View style={styles.clientSection}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>
              {booking.user.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{booking.user.name}</Text>
            <Text style={styles.clientPhone}>{booking.user.phone}</Text>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCallClient(booking.user.phone)}
          >
            <Text style={styles.callIcon}>📞</Text>
          </TouchableOpacity>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailRow}>
            📅 {new Date(booking.booking_date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
          <Text style={styles.detailRow}>
            🕐 {booking.booking_time.substring(0, 5)} • {booking.service.duration_minutes} min
          </Text>
          <Text style={styles.detailRow}>📍 {booking.address}</Text>

          {booking.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes du client :</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          )}

          <Text style={styles.price}>💰 {booking.service.price} DH</Text>
        </View>

        {/* Timestamps */}
        {booking.created_at && activeTab === 'pending' && (
          <Text style={styles.timestamp}>
            Reçue {formatRelativeTime(booking.created_at)}
          </Text>
        )}
        {booking.started_at && activeTab === 'in_progress' && (
          <Text style={styles.timestamp}>
            Démarré {formatRelativeTime(booking.started_at)}
          </Text>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
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
              onPress={() => handleStartJourney(booking.id)}
              fullWidth
            >
              🚗 Démarrer le trajet
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
              onPress={() => handleCompleteBooking(booking.id)}
              fullWidth
            >
              ✅ Terminer le service
            </Button>
          )}

          {booking.status === 'completed' && booking.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Note client :</Text>
              <Text style={styles.ratingStars}>{'⭐'.repeat(booking.rating)}</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const tabs: { key: BookingTab; label: string; count: number }[] = [
    { key: 'pending', label: 'Nouveaux', count: bookings.pending.length },
    { key: 'upcoming', label: 'À venir', count: bookings.upcoming.length },
    { key: 'in_progress', label: 'En cours', count: bookings.in_progress.length },
    { key: 'completed', label: 'Terminés', count: bookings.completed.length },
  ];

  const currentBookings = bookings[activeTab];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes Commandes</Text>
        <Text style={styles.subtitle}>
          {bookings.pending.length + bookings.upcoming.length + bookings.in_progress.length} actives
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab(tab.key);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[
                styles.tabBadge,
                activeTab === tab.key && styles.tabBadgeActive,
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  activeTab === tab.key && styles.tabBadgeTextActive,
                ]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={currentBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'pending' ? '⏳' :
               activeTab === 'upcoming' ? '📅' :
               activeTab === 'in_progress' ? '🔨' : '✓'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'pending' ? 'Aucune nouvelle demande' :
               activeTab === 'upcoming' ? 'Aucune réservation à venir' :
               activeTab === 'in_progress' ? 'Aucun service en cours' :
               'Aucun service terminé'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'pending'
                ? 'Les nouvelles demandes apparaîtront ici'
                : 'Cette section est vide pour le moment'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    gap: 4,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[600],
  },
  tabTextActive: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: colors.white,
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabBadgeTextActive: {
    color: colors.primary,
  },

  // List
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
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
  cardCompleted: {
    backgroundColor: colors.gray[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.gray[400],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // Client
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[100],
    marginBottom: spacing.md,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 20,
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
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: {
    fontSize: 20,
  },

  // Details
  detailsSection: {
    gap: 6,
    marginBottom: spacing.md,
  },
  detailRow: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  notesContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  notesLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginBottom: 4,
    fontWeight: '600',
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[800],
    fontStyle: 'italic',
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.sm,
  },

  // Timestamp
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },

  // Actions
  actionsSection: {
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

  // Rating
  ratingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
  },
  ratingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginRight: spacing.sm,
  },
  ratingStars: {
    fontSize: typography.fontSize.base,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
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
  },
});
