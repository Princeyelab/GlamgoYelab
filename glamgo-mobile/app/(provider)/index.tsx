/**
 * Provider Dashboard - GlamGo Mobile
 * Tableau de bord du prestataire
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import { useAppSelector } from '../../src/lib/store/hooks';
import { selectUser } from '../../src/lib/store/slices/authSlice';
import { hapticFeedback } from '../../src/lib/utils/haptics';

// Demo data pour le dashboard provider
const DEMO_STATS = {
  todayBookings: 3,
  pendingRequests: 2,
  weeklyEarnings: 1250,
  monthlyEarnings: 4800,
  rating: 4.8,
  totalReviews: 47,
  completedBookings: 156,
};

const DEMO_PENDING_BOOKINGS = [
  {
    id: 1,
    clientName: 'Sarah M.',
    service: 'Coiffure à domicile',
    date: '2024-12-20',
    time: '14:00',
    price: 350,
    status: 'pending',
  },
  {
    id: 2,
    clientName: 'Fatima Z.',
    service: 'Maquillage mariage',
    date: '2024-12-21',
    time: '10:00',
    price: 500,
    status: 'pending',
  },
];

export default function ProviderDashboard() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const [isAvailable, setIsAvailable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(DEMO_STATS);
  const [pendingBookings, setPendingBookings] = useState(DEMO_PENDING_BOOKINGS);

  const onRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.light();
    // Simuler un refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const toggleAvailability = () => {
    hapticFeedback.medium();
    setIsAvailable(!isAvailable);
  };

  const handleAcceptBooking = (bookingId: number) => {
    hapticFeedback.success();
    setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  const handleDeclineBooking = (bookingId: number) => {
    hapticFeedback.warning();
    setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.name}>
            {user?.first_name || user?.name || 'Prestataire'}
          </Text>
        </View>
        <View style={styles.availabilityContainer}>
          <Text style={[styles.availabilityText, !isAvailable && styles.unavailableText]}>
            {isAvailable ? 'Disponible' : 'Indisponible'}
          </Text>
          <Switch
            value={isAvailable}
            onValueChange={toggleAvailability}
            trackColor={{ false: colors.gray[300], true: colors.success }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* Stats rapides */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.todayBookings}</Text>
          <Text style={styles.statLabel}>Aujourd'hui</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingRequests}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, styles.earningsValue]}>
            {stats.weeklyEarnings} DH
          </Text>
          <Text style={styles.statLabel}>Cette semaine</Text>
        </Card>
      </View>

      {/* Demandes en attente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demandes en attente</Text>

        {pendingBookings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucune demande en attente</Text>
          </Card>
        ) : (
          pendingBookings.map(booking => (
            <Card key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.clientName}>{booking.clientName}</Text>
                <Text style={styles.bookingPrice}>{booking.price} DH</Text>
              </View>
              <Text style={styles.serviceName}>{booking.service}</Text>
              <Text style={styles.bookingDateTime}>
                📅 {new Date(booking.date).toLocaleDateString('fr-FR')} à {booking.time}
              </Text>
              <View style={styles.bookingActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleDeclineBooking(booking.id)}
                  style={styles.declineButton}
                  textStyle={styles.declineButtonText}
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
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <Card style={styles.performanceCard}>
          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>⭐ {stats.rating}</Text>
              <Text style={styles.performanceLabel}>{stats.totalReviews} avis</Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{stats.completedBookings}</Text>
              <Text style={styles.performanceLabel}>Réservations</Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{stats.monthlyEarnings} DH</Text>
              <Text style={styles.performanceLabel}>Ce mois</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Actions rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              hapticFeedback.light();
              router.push('/(provider)/bookings');
            }}
          >
            <Text style={styles.quickActionIcon}>📅</Text>
            <Text style={styles.quickActionText}>Mes réservations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              hapticFeedback.light();
              router.push('/(provider)/earnings');
            }}
          >
            <Text style={styles.quickActionIcon}>💰</Text>
            <Text style={styles.quickActionText}>Mes gains</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              hapticFeedback.light();
              router.push('/(provider)/profile');
            }}
          >
            <Text style={styles.quickActionIcon}>👤</Text>
            <Text style={styles.quickActionText}>Mon profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing['3xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
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
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  availabilityText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.success,
  },
  unavailableText: {
    color: colors.gray[500],
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  earningsValue: {
    color: colors.success,
    fontSize: typography.fontSize.lg,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
  },

  // Booking Card
  bookingCard: {
    marginBottom: spacing.md,
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
    marginBottom: spacing.xs,
  },
  bookingDateTime: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineButton: {
    flex: 1,
    borderColor: colors.gray[300],
  },
  declineButtonText: {
    color: colors.gray[700],
  },
  acceptButton: {
    flex: 1,
  },

  // Performance
  performanceCard: {
    padding: spacing.lg,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  performanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  performanceValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  performanceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    textAlign: 'center',
  },
});
