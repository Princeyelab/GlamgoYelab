/**
 * Provider Earnings - GlamGo Mobile
 * Suivi des gains du prestataire
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

export default function ProviderEarningsScreen() {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [transactions] = useState(DEMO_TRANSACTIONS);

  const currentEarnings = DEMO_EARNINGS[period];

  const pendingAmount = transactions
    .filter(t => t.status === 'pending_payout')
    .reduce((sum, t) => sum + t.netAmount, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleWithdraw = () => {
    hapticFeedback.medium();
    // TODO: Implement withdrawal
    alert('Fonctionnalité de retrait à venir');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes gains</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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

        {/* Earnings Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Gains nets</Text>
          <Text style={styles.summaryAmount}>{currentEarnings.net} DH</Text>
          <View style={styles.summaryDetails}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryDetailLabel}>Total brut</Text>
              <Text style={styles.summaryDetailValue}>{currentEarnings.total} DH</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryDetailLabel}>Commission (10%)</Text>
              <Text style={styles.summaryDetailValue}>-{currentEarnings.commission} DH</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryDetailLabel}>Réservations</Text>
              <Text style={styles.summaryDetailValue}>{currentEarnings.bookings}</Text>
            </View>
          </View>
        </Card>

        {/* Pending Payout */}
        {pendingAmount > 0 && (
          <Card style={styles.payoutCard}>
            <View style={styles.payoutInfo}>
              <Text style={styles.payoutLabel}>Solde disponible</Text>
              <Text style={styles.payoutAmount}>{pendingAmount} DH</Text>
            </View>
            <Button
              variant="primary"
              size="sm"
              onPress={handleWithdraw}
            >
              Retirer
            </Button>
          </Card>
        )}

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des transactions</Text>

          {transactions.map(transaction => (
            <Card key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View>
                  <Text style={styles.transactionClient}>{transaction.clientName}</Text>
                  <Text style={styles.transactionService}>{transaction.service}</Text>
                </View>
                <View style={styles.transactionAmounts}>
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
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString('fr-FR')}
                </Text>
                <Text style={styles.transactionCommission}>
                  Commission: {transaction.commission} DH
                </Text>
              </View>
            </Card>
          ))}
        </View>
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

  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  periodButtonActive: {
    backgroundColor: colors.white,
  },
  periodText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontWeight: '500',
  },
  periodTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Summary Card
  summaryCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: spacing.lg,
  },
  summaryDetails: {
    width: '100%',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  summaryDetailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  summaryDetailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    fontWeight: '500',
  },

  // Payout Card
  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  payoutInfo: {},
  payoutLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  payoutAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Section
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },

  // Transaction Card
  transactionCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  transactionClient: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  transactionService: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  transactionAmounts: {
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
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  transactionDate: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  transactionCommission: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
});
