/**
 * Provider Bookings - GlamGo Mobile
 * Liste des réservations du prestataire
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { hapticFeedback } from '../../src/lib/utils/haptics';

type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
type TabType = 'upcoming' | 'history';

interface ProviderBooking {
  id: number;
  clientName: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  address: string;
  status: BookingStatus;
  notes?: string;
}

const DEMO_BOOKINGS: ProviderBooking[] = [
  {
    id: 1,
    clientName: 'Sarah M.',
    clientPhone: '0612345678',
    service: 'Coiffure à domicile',
    date: '2024-12-20',
    time: '14:00',
    duration: 90,
    price: 350,
    address: 'Rue Mohammed V, Casablanca',
    status: 'accepted',
  },
  {
    id: 2,
    clientName: 'Fatima Z.',
    clientPhone: '0623456789',
    service: 'Maquillage mariage',
    date: '2024-12-21',
    time: '10:00',
    duration: 120,
    price: 500,
    address: 'Bd Zerktouni, Casablanca',
    status: 'pending',
  },
  {
    id: 3,
    clientName: 'Nadia K.',
    clientPhone: '0634567890',
    service: 'Coiffure',
    date: '2024-12-18',
    time: '16:00',
    duration: 60,
    price: 250,
    address: 'Quartier Gauthier, Casablanca',
    status: 'completed',
  },
  {
    id: 4,
    clientName: 'Amina B.',
    clientPhone: '0645678901',
    service: 'Manucure',
    date: '2024-12-17',
    time: '11:00',
    duration: 45,
    price: 150,
    address: 'Maarif, Casablanca',
    status: 'completed',
  },
];

const getStatusColor = (status: BookingStatus) => {
  switch (status) {
    case 'pending':
      return colors.warning;
    case 'accepted':
      return colors.info;
    case 'in_progress':
      return colors.primary;
    case 'completed':
      return colors.success;
    case 'cancelled':
      return colors.error;
    default:
      return colors.gray[500];
  }
};

const getStatusLabel = (status: BookingStatus) => {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'accepted':
      return 'Acceptée';
    case 'in_progress':
      return 'En cours';
    case 'completed':
      return 'Terminée';
    case 'cancelled':
      return 'Annulée';
    default:
      return status;
  }
};

export default function ProviderBookingsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState(DEMO_BOOKINGS);

  const upcomingBookings = bookings.filter(b =>
    ['pending', 'accepted', 'in_progress'].includes(b.status)
  );

  const historyBookings = bookings.filter(b =>
    ['completed', 'cancelled'].includes(b.status)
  );

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : historyBookings;

  const onRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleStartService = (bookingId: number) => {
    hapticFeedback.medium();
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, status: 'in_progress' as BookingStatus } : b
      )
    );
  };

  const handleCompleteService = (bookingId: number) => {
    hapticFeedback.success();
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, status: 'completed' as BookingStatus } : b
      )
    );
  };

  const handleAcceptBooking = (bookingId: number) => {
    hapticFeedback.success();
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, status: 'accepted' as BookingStatus } : b
      )
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes réservations</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('upcoming');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            À venir ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('history');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historique ({historyBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {displayedBookings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming'
                ? 'Aucune réservation à venir'
                : 'Aucun historique'}
            </Text>
          </Card>
        ) : (
          displayedBookings.map(booking => (
            <Card key={booking.id} style={styles.bookingCard}>
              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(booking.status) + '20' },
                ]}
              >
                <Text
                  style={[styles.statusText, { color: getStatusColor(booking.status) }]}
                >
                  {getStatusLabel(booking.status)}
                </Text>
              </View>

              {/* Booking Info */}
              <View style={styles.bookingHeader}>
                <Text style={styles.clientName}>{booking.clientName}</Text>
                <Text style={styles.bookingPrice}>{booking.price} DH</Text>
              </View>

              <Text style={styles.serviceName}>{booking.service}</Text>

              <View style={styles.bookingDetails}>
                <Text style={styles.detailText}>
                  📅 {new Date(booking.date).toLocaleDateString('fr-FR')} à {booking.time}
                </Text>
                <Text style={styles.detailText}>⏱️ {booking.duration} min</Text>
                <Text style={styles.detailText}>📍 {booking.address}</Text>
                <Text style={styles.detailText}>📞 {booking.clientPhone}</Text>
              </View>

              {/* Actions */}
              {booking.status === 'pending' && (
                <View style={styles.actions}>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onPress={() => handleAcceptBooking(booking.id)}
                  >
                    Accepter la réservation
                  </Button>
                </View>
              )}

              {booking.status === 'accepted' && (
                <View style={styles.actions}>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onPress={() => handleStartService(booking.id)}
                  >
                    Démarrer le service
                  </Button>
                </View>
              )}

              {booking.status === 'in_progress' && (
                <View style={styles.actions}>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onPress={() => handleCompleteService(booking.id)}
                  >
                    Marquer comme terminé
                  </Button>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  // Header
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

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },

  // Booking Card
  bookingCard: {
    marginBottom: spacing.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  clientName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  bookingPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  serviceName: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  bookingDetails: {
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  actions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
