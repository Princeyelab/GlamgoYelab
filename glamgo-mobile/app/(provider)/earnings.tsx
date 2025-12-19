/**
 * Provider Earnings - GlamGo Mobile
 * Suivi des gains du prestataire avec graphique et analytics
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { hapticFeedback } from '../../src/lib/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PeriodType = 'week' | 'month' | 'year';

interface Transaction {
  id: number;
  clientName: string;
  service: string;
  date: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'completed' | 'pending_payout' | 'paid';
}

const DEMO_EARNINGS = {
  week: {
    total: 1250,
    commission: 125,
    net: 1125,
    bookings: 5,
  },
  month: {
    total: 4800,
    commission: 480,
    net: 4320,
    bookings: 18,
  },
  year: {
    total: 52000,
    commission: 5200,
    net: 46800,
    bookings: 195,
  },
};

const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    clientName: 'Sarah M.',
    service: 'Coiffure à domicile',
    date: '2024-12-19',
    amount: 350,
    commission: 35,
    netAmount: 315,
    status: 'pending_payout',
  },
  {
    id: 2,
    clientName: 'Nadia K.',
    service: 'Maquillage',
    date: '2024-12-18',
    amount: 250,
    commission: 25,
    netAmount: 225,
    status: 'pending_payout',
  },
  {
    id: 3,
    clientName: 'Fatima Z.',
    service: 'Manucure',
    date: '2024-12-17',
    amount: 150,
    commission: 15,
    netAmount: 135,
    status: 'paid',
  },
  {
    id: 4,
    clientName: 'Amina B.',
    service: 'Coiffure',
    date: '2024-12-16',
    amount: 300,
    commission: 30,
    netAmount: 270,
    status: 'paid',
  },
  {
    id: 5,
    clientName: 'Khadija L.',
    service: 'Soins visage',
    date: '2024-12-15',
    amount: 200,
    commission: 20,
    netAmount: 180,
    status: 'paid',
  },
];

// Weekly chart data
const WEEKLY_DATA = [
  { day: 'Lun', amount: 450, bookings: 2 },
  { day: 'Mar', amount: 280, bookings: 1 },
  { day: 'Mer', amount: 520, bookings: 2 },
  { day: 'Jeu', amount: 0, bookings: 0 },
  { day: 'Ven', amount: 680, bookings: 3 },
  { day: 'Sam', amount: 890, bookings: 4 },
  { day: 'Dim', amount: 320, bookings: 1 },
];

const getStatusColor = (status: Transaction['status']) => {
  switch (status) {
    case 'pending_payout':
      return colors.warning;
    case 'paid':
      return colors.success;
    default:
      return colors.gray[500];
  }
};

const getStatusLabel = (status: Transaction['status']) => {
  switch (status) {
    case 'pending_payout':
      return 'En attente';
    case 'paid':
      return 'Payé';
    default:
      return status;
  }
};

// Simple bar chart component
const WeeklyChart = () => {
  const maxAmount = Math.max(...WEEKLY_DATA.map(d => d.amount));
  const chartHeight = 120;
  const barWidth = (SCREEN_WIDTH - 80) / 7;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.barsContainer}>
        {WEEKLY_DATA.map((day, index) => {
          const barHeight = day.amount > 0 ? (day.amount / maxAmount) * chartHeight : 4;
          const isToday = index === 5; // Saturday as example "today"

          return (
            <View key={day.day} style={chartStyles.barWrapper}>
              <View style={chartStyles.barBackground}>
                <View
                  style={[
                    chartStyles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isToday ? colors.primary : colors.primary + '60',
                    },
                  ]}
                />
              </View>
              <Text style={[chartStyles.dayLabel, isToday && chartStyles.dayLabelActive]}>
                {day.day}
              </Text>
              {day.amount > 0 && (
                <Text style={chartStyles.amountLabel}>{day.amount}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingBottom: 30,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    height: 120,
    width: 24,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 12,
  },
  dayLabel: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    fontWeight: '500',
  },
  dayLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  amountLabel: {
    position: 'absolute',
    top: -16,
    fontSize: 9,
    color: colors.gray[400],
    fontWeight: '500',
  },
});

export default function ProviderEarningsScreen() {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [transactions] = useState(DEMO_TRANSACTIONS);

  const currentEarnings = DEMO_EARNINGS[period];

  const pendingAmount = transactions
    .filter(t => t.status === 'pending_payout')
    .reduce((sum, t) => sum + t.netAmount, 0);

  const totalWeeklyAmount = WEEKLY_DATA.reduce((sum, d) => sum + d.amount, 0);
  const totalWeeklyBookings = WEEKLY_DATA.reduce((sum, d) => sum + d.bookings, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleWithdraw = () => {
    hapticFeedback.medium();
    Alert.alert(
      'Demande de retrait',
      `Retirer ${pendingAmount} DH vers votre compte bancaire ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            hapticFeedback.success();
            Alert.alert('Succès', 'Votre demande de retrait a été envoyée. Vous recevrez les fonds sous 24-48h.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient-like effect */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.title}>Mes gains</Text>
          <Text style={styles.subtitle}>Suivez vos revenus en temps réel</Text>
        </View>

        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Solde disponible</Text>
              <Text style={styles.balanceAmount}>{pendingAmount} DH</Text>
            </View>
            <Button
              variant="primary"
              size="md"
              onPress={handleWithdraw}
              disabled={pendingAmount === 0}
              style={styles.withdrawButton}
            >
              Retirer 💳
            </Button>
          </View>
        </Card>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as PeriodType[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => {
                hapticFeedback.selection();
                setPeriod(p);
              }}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{currentEarnings.net} DH</Text>
            <Text style={styles.statLabel}>Gains nets</Text>
          </Card>
          <Card style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statValue}>{currentEarnings.bookings}</Text>
            <Text style={styles.statLabel}>Réservations</Text>
          </Card>
        </View>

        {/* Weekly Chart */}
        {period === 'week' && (
          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Gains cette semaine</Text>
              <View style={styles.chartSummary}>
                <Text style={styles.chartTotal}>{totalWeeklyAmount} DH</Text>
                <Text style={styles.chartBookings}>{totalWeeklyBookings} réservations</Text>
              </View>
            </View>
            <WeeklyChart />
          </Card>
        )}

        {/* Earnings Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Détails des gains</Text>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total brut</Text>
              <Text style={styles.detailValue}>{currentEarnings.total} DH</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Commission (10%)</Text>
              <Text style={[styles.detailValue, styles.detailNegative]}>
                -{currentEarnings.commission} DH
              </Text>
            </View>
          </View>
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>Gains nets</Text>
            <Text style={styles.netValue}>{currentEarnings.net} DH</Text>
          </View>
        </Card>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historique</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Voir tout →</Text>
            </TouchableOpacity>
          </View>

          {transactions.map(transaction => (
            <Card key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={styles.transactionAvatar}>
                  <Text style={styles.avatarText}>
                    {transaction.clientName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionClient}>{transaction.clientName}</Text>
                  <Text style={styles.transactionService}>{transaction.service}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>+{transaction.netAmount} DH</Text>
                <View
                  style={[
                    styles.transactionStatus,
                    { backgroundColor: getStatusColor(transaction.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.transactionStatusText,
                      { color: getStatusColor(transaction.status) },
                    ]}
                  >
                    {getStatusLabel(transaction.status)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  // Header Gradient Area
  headerGradient: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.white,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: 4,
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadows.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  balanceAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 4,
  },
  withdrawButton: {
    minWidth: 110,
  },

  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
  periodText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontWeight: '500',
  },
  periodTextActive: {
    color: colors.white,
    fontWeight: '600',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  statCardGreen: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  statCardBlue: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginTop: 2,
  },

  // Chart Card
  chartCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chartTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  chartSummary: {
    alignItems: 'flex-end',
  },
  chartTotal: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.success,
  },
  chartBookings: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },

  // Details Card
  detailsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  detailsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 4,
  },
  detailValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  detailNegative: {
    color: colors.error,
  },
  detailDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.md,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  netLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[700],
  },
  netValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.success,
  },

  // Section
  section: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },

  // Transaction Card
  transactionCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
    color: colors.primary,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionClient: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  transactionService: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginTop: 2,
  },
  transactionDate: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 4,
  },
  transactionStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  transactionStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
});
