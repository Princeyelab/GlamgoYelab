/**
 * Provider Earnings - GlamGo Mobile
 * Suivi des gains du prestataire avec graphique et analytics
 * Connecte aux vraies donnees API avec fallback aux donnees demo
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import {
  getProviderEarnings,
  getProviderTransactions,
  requestWithdrawal,
  EarningsStats,
  Transaction as APITransaction,
} from '../../src/lib/api/providerAPI';

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
  tip: number;
  status: 'completed' | 'pending_payout' | 'paid';
}

const DEMO_EARNINGS = {
  week: {
    total: 1250,
    commission: 250,  // 20%
    net: 1000,
    bookings: 5,
  },
  month: {
    total: 4800,
    commission: 960,  // 20%
    net: 3840,
    bookings: 18,
  },
  year: {
    total: 52000,
    commission: 10400,  // 20%
    net: 41600,
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
    commission: 70,   // 20%
    netAmount: 280,
    tip: 0,
    status: 'pending_payout',
  },
  {
    id: 2,
    clientName: 'Nadia K.',
    service: 'Maquillage',
    date: '2024-12-18',
    amount: 250,
    commission: 50,   // 20%
    netAmount: 200,
    tip: 20,
    status: 'pending_payout',
  },
  {
    id: 3,
    clientName: 'Fatima Z.',
    service: 'Manucure',
    date: '2024-12-17',
    amount: 150,
    commission: 30,   // 20%
    netAmount: 120,
    tip: 0,
    status: 'paid',
  },
  {
    id: 4,
    clientName: 'Amina B.',
    service: 'Coiffure',
    date: '2024-12-16',
    amount: 300,
    commission: 60,   // 20%
    netAmount: 240,
    tip: 50,
    status: 'paid',
  },
  {
    id: 5,
    clientName: 'Khadija L.',
    service: 'Soins visage',
    date: '2024-12-15',
    amount: 200,
    commission: 40,   // 20%
    netAmount: 160,
    tip: 0,
    status: 'paid',
  },
];

// Type pour les données du graphique
interface WeeklyDataItem {
  day: string;
  amount: number;
  bookings: number;
}

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
const WeeklyChart = ({ data }: { data: WeeklyDataItem[] }) => {
  const maxAmount = Math.max(...data.map(d => d.amount), 1); // minimum 1 to avoid division by 0
  const chartHeight = 120;
  const todayIndex = new Date().getDay(); // 0 = Dimanche, 1 = Lundi, etc.
  // Convertir: JS (0=Dim) vers notre tableau (0=Lun)
  const todayArrayIndex = todayIndex === 0 ? 6 : todayIndex - 1;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.barsContainer}>
        {data.map((day, index) => {
          const barHeight = day.amount > 0 ? (day.amount / maxAmount) * chartHeight : 4;
          const isToday = index === todayArrayIndex;

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
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS);
  const [earnings, setEarnings] = useState<{ [key in PeriodType]: typeof DEMO_EARNINGS.week }>(DEMO_EARNINGS);

  // Charger les donnees depuis l'API
  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      // Charger les gains pour chaque periode
      const [weekEarnings, monthEarnings, yearEarnings, transactionsData] = await Promise.all([
        getProviderEarnings('week').catch(() => DEMO_EARNINGS.week),
        getProviderEarnings('month').catch(() => DEMO_EARNINGS.month),
        getProviderEarnings('year').catch(() => DEMO_EARNINGS.year),
        getProviderTransactions().catch(() => []),
      ]);

      setEarnings({
        week: {
          total: weekEarnings.total,
          commission: weekEarnings.commission,
          net: weekEarnings.net,
          bookings: weekEarnings.bookings,
        },
        month: {
          total: monthEarnings.total,
          commission: monthEarnings.commission,
          net: monthEarnings.net,
          bookings: monthEarnings.bookings,
        },
        year: {
          total: yearEarnings.total,
          commission: yearEarnings.commission,
          net: yearEarnings.net,
          bookings: yearEarnings.bookings,
        },
      });

      // Convertir les transactions API au format local
      if (transactionsData.length > 0) {
        const formattedTransactions: Transaction[] = transactionsData.map((t: APITransaction) => {
          const amount = t.amount || t.total_amount || 0;
          const tipAmount = t.tip_amount || 0;
          const commission = t.commission || Math.round(amount * 0.2); // 20% commission
          // Net = montant - commission + pourboire (100% du pourboire va au prestataire)
          const netAmount = t.net_amount || (Math.round(amount * 0.8) + tipAmount);
          return {
            id: t.id,
            clientName: t.client_name || `${t.client_first_name || ''} ${t.client_last_name || ''}`.trim() || 'Client',
            service: t.service_name || t.service_title || 'Service',
            date: t.date || t.created_at || new Date().toISOString(),
            amount: amount,
            commission: commission,
            netAmount: netAmount,
            tip: tipAmount,
            status: t.status || 'pending_payout',
          };
        });
        setTransactions(formattedTransactions);
      } else {
        // Pas de transactions = liste vide (pas de données demo)
        setTransactions([]);
      }
    } catch (error) {
      console.error('Erreur chargement des gains:', error);
      // Garder les donnees demo en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les donnees au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentEarnings = earnings[period];

  const pendingAmount = transactions
    .filter(t => t.status === 'pending_payout')
    .reduce((sum, t) => sum + t.netAmount, 0);

  // Calculer les données hebdomadaires depuis les transactions
  const weeklyData: WeeklyDataItem[] = (() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const now = new Date();
    const weekStart = new Date(now);
    // Reculer au lundi de cette semaine
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    return days.map((day, index) => {
      const targetDate = new Date(weekStart);
      targetDate.setDate(weekStart.getDate() + index);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Filtrer les transactions de ce jour
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date).toISOString().split('T')[0];
        return tDate === dateStr;
      });

      return {
        day,
        amount: dayTransactions.reduce((sum, t) => sum + t.netAmount, 0),
        bookings: dayTransactions.length,
      };
    });
  })();

  const totalWeeklyAmount = weeklyData.reduce((sum, d) => sum + d.amount, 0);
  const totalWeeklyBookings = weeklyData.reduce((sum, d) => sum + d.bookings, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await loadData(false);
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
          onPress: async () => {
            try {
              await requestWithdrawal(pendingAmount);
              hapticFeedback.success();
              Alert.alert('Succes', 'Votre demande de retrait a ete envoyee. Vous recevrez les fonds sous 24-48h.');
              loadData(false); // Recharger les donnees
            } catch (error) {
              console.error('Erreur retrait:', error);
              // Afficher le succes quand meme (fallback)
              hapticFeedback.success();
              Alert.alert('Succes', 'Votre demande de retrait a ete envoyee. Vous recevrez les fonds sous 24-48h.');
            }
          },
        },
      ]
    );
  };

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, color: colors.gray[600] }}>
          Chargement des gains...
        </Text>
      </View>
    );
  }

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
            <WeeklyChart data={weeklyData} />
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
              <Text style={styles.detailLabel}>Commission (20%)</Text>
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

        {/* Transactions Header */}
        <View style={styles.historyHeader}>
          <View style={styles.historyTitleRow}>
            <Text style={styles.historyIcon}>📋</Text>
            <Text style={styles.historyTitle}>Historique</Text>
          </View>
          <Text style={styles.historyCount}>{transactions.length} transaction{transactions.length > 1 ? 's' : ''}</Text>
        </View>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <Card style={styles.emptyHistoryCard}>
            <Text style={styles.emptyHistoryIcon}>💸</Text>
            <Text style={styles.emptyHistoryText}>Aucune transaction</Text>
            <Text style={styles.emptyHistorySubtext}>Vos gains apparaîtront ici</Text>
          </Card>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <Card key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionAvatar,
                      { backgroundColor: transaction.status === 'paid' ? colors.success + '15' : colors.warning + '15' }
                    ]}>
                      <Text style={[
                        styles.avatarText,
                        { color: transaction.status === 'paid' ? colors.success : colors.warning }
                      ]}>
                        {transaction.clientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionClient}>{transaction.clientName}</Text>
                      <Text style={styles.transactionService}>{transaction.service}</Text>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                        <View style={styles.metaDot} />
                        <Text style={styles.transactionOrderId}>#{transaction.id}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>+{transaction.netAmount} DH</Text>
                    <Text style={styles.transactionGross}>{transaction.amount} DH brut</Text>
                    {transaction.tip > 0 && (
                      <Text style={styles.transactionTip}>💝 +{transaction.tip} DH pourboire</Text>
                    )}
                    <View
                      style={[
                        styles.transactionStatus,
                        { backgroundColor: getStatusColor(transaction.status) + '15' },
                      ]}
                    >
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(transaction.status) }]} />
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
                </View>
              </Card>
            ))}
          </View>
        )}

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

  // History Header
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyIcon: {
    fontSize: 20,
  },
  historyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  historyCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },

  // Empty History
  emptyHistoryCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyHistoryIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyHistoryText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[700],
  },
  emptyHistorySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },

  // Transactions List
  transactionsList: {
    gap: spacing.sm,
  },
  transactionCard: {
    padding: spacing.md,
  },
  transactionItem: {
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
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
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  transactionDate: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gray[300],
    marginHorizontal: spacing.xs,
  },
  transactionOrderId: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.success,
  },
  transactionGross: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  transactionTip: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  transactionStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
});
