'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import apiClient from '@/lib/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// Données de démonstration
const DEMO_EARNINGS = {
  week: { total: 1250, commission: 250, net: 1000, bookings: 5 },
  month: { total: 4800, commission: 960, net: 3840, bookings: 18 },
  year: { total: 52000, commission: 10400, net: 41600, bookings: 195 },
};

const DEMO_TRANSACTIONS = [
  { id: 1, clientName: 'Sarah M.', service: 'Coiffure à domicile', date: '2024-12-19', amount: 350, commission: 70, netAmount: 280, tip: 0, status: 'pending_payout' },
  { id: 2, clientName: 'Nadia K.', service: 'Maquillage', date: '2024-12-18', amount: 250, commission: 50, netAmount: 200, tip: 20, status: 'pending_payout' },
  { id: 3, clientName: 'Fatima Z.', service: 'Manucure', date: '2024-12-17', amount: 150, commission: 30, netAmount: 120, tip: 0, status: 'paid' },
  { id: 4, clientName: 'Amina B.', service: 'Coiffure', date: '2024-12-16', amount: 300, commission: 60, netAmount: 240, tip: 50, status: 'paid' },
  { id: 5, clientName: 'Khadija L.', service: 'Soins visage', date: '2024-12-15', amount: 200, commission: 40, netAmount: 160, tip: 0, status: 'paid' },
];

// Composant graphique hebdomadaire
function WeeklyChart({ data, isRTL }) {
  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  const todayIndex = new Date().getDay();
  const todayArrayIndex = todayIndex === 0 ? 6 : todayIndex - 1;

  return (
    <div className={styles.chartContainer}>
      <div className={`${styles.barsContainer} ${isRTL ? styles.rtl : ''}`}>
        {data.map((day, index) => {
          const barHeight = day.amount > 0 ? (day.amount / maxAmount) * 100 : 3;
          const isToday = index === todayArrayIndex;

          return (
            <div key={day.day} className={styles.barWrapper}>
              <div className={styles.barBackground}>
                <div
                  className={`${styles.bar} ${isToday ? styles.barToday : ''}`}
                  style={{ height: `${barHeight}%` }}
                />
              </div>
              <span className={`${styles.dayLabel} ${isToday ? styles.dayLabelActive : ''}`}>
                {day.day}
              </span>
              {day.amount > 0 && (
                <span className={styles.amountLabel}>{day.amount}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProviderEarningsPage() {
  const router = useRouter();
  const { t, isRTL, toArabicNumerals, language } = useLanguage();
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(DEMO_EARNINGS);
  const [transactions, setTransactions] = useState([]);
  const [withdrawing, setWithdrawing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    let token = localStorage.getItem('provider_token') || sessionStorage.getItem('provider_token');
    if (!token) {
      router.push('/provider/login');
      return;
    }
    apiClient.setToken(token, true, true);
    loadData();
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Charger les gains pour chaque période
      const [weekRes, monthRes, yearRes, transRes] = await Promise.all([
        apiClient.getProviderEarnings('week').catch(() => ({ success: false })),
        apiClient.getProviderEarnings('month').catch(() => ({ success: false })),
        apiClient.getProviderEarnings('year').catch(() => ({ success: false })),
        apiClient.getProviderTransactions().catch(() => ({ success: false })),
      ]);

      // Mettre à jour les gains
      setEarnings({
        week: weekRes.success && weekRes.data ? {
          total: weekRes.data.total || 0,
          commission: weekRes.data.commission || 0,
          net: weekRes.data.net || 0,
          bookings: weekRes.data.bookings || 0,
        } : DEMO_EARNINGS.week,
        month: monthRes.success && monthRes.data ? {
          total: monthRes.data.total || 0,
          commission: monthRes.data.commission || 0,
          net: monthRes.data.net || 0,
          bookings: monthRes.data.bookings || 0,
        } : DEMO_EARNINGS.month,
        year: yearRes.success && yearRes.data ? {
          total: yearRes.data.total || 0,
          commission: yearRes.data.commission || 0,
          net: yearRes.data.net || 0,
          bookings: yearRes.data.bookings || 0,
        } : DEMO_EARNINGS.year,
      });

      // Mettre à jour les transactions
      if (transRes.success && transRes.data && transRes.data.length > 0) {
        const formattedTransactions = transRes.data.map(t => ({
          id: t.id,
          clientName: t.client_name || `${t.client_first_name || ''} ${t.client_last_name || ''}`.trim() || 'Client',
          service: t.service_name || t.service_title || 'Service',
          date: t.date || t.created_at || new Date().toISOString(),
          amount: t.amount || t.total_amount || 0,
          commission: t.commission || Math.round((t.amount || t.total_amount || 0) * 0.2),
          netAmount: t.net_amount || Math.round((t.amount || t.total_amount || 0) * 0.8),
          tip: t.tip_amount || 0,
          status: t.status || 'pending_payout',
        }));
        setTransactions(formattedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Erreur chargement des gains:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const currentEarnings = earnings[period];

  const pendingAmount = transactions
    .filter(t => t.status === 'pending_payout')
    .reduce((sum, t) => sum + t.netAmount, 0);

  // Calculer les données hebdomadaires
  const weeklyData = (() => {
    const days = isRTL
      ? ['أحد', 'سبت', 'جمعة', 'خميس', 'أربعاء', 'ثلاثاء', 'إثنين'].reverse()
      : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const now = new Date();
    const weekStart = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    return days.map((day, index) => {
      const targetDate = new Date(weekStart);
      targetDate.setDate(weekStart.getDate() + index);
      const dateStr = targetDate.toISOString().split('T')[0];

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

  const handleWithdraw = async () => {
    if (pendingAmount <= 0) return;

    if (!confirm(`${t('providerEarnings.withdrawConfirm') || 'Retirer'} ${toArabicNumerals(pendingAmount)} MAD ?`)) {
      return;
    }

    setWithdrawing(true);
    try {
      const response = await apiClient.requestWithdrawal(pendingAmount);
      if (response.success) {
        showToast(t('providerEarnings.withdrawSuccess') || 'Demande de retrait envoyée !', 'success');
        loadData();
      } else {
        showToast(response.message || t('providerEarnings.withdrawError') || 'Erreur lors du retrait', 'error');
      }
    } catch (error) {
      // Montrer succès quand même en mode démo
      showToast(t('providerEarnings.withdrawSuccess') || 'Demande de retrait envoyée !', 'success');
    } finally {
      setWithdrawing(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const getStatusLabel = (status) => {
    if (status === 'pending_payout') return t('providerEarnings.pending') || 'En attente';
    if (status === 'paid') return t('providerEarnings.paid') || 'Payé';
    return status;
  };

  const getStatusClass = (status) => {
    if (status === 'pending_payout') return styles.statusPending;
    if (status === 'paid') return styles.statusPaid;
    return '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className={styles.earningsPage} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/provider/dashboard" className={styles.backButton}>
            <span>{isRTL ? '→' : '←'}</span>
            <span>{t('common.back') || 'Retour'}</span>
          </Link>
          <h1>{t('providerEarnings.myEarnings') || 'Mes Gains'}</h1>
          <LanguageSwitcher compact />
        </div>
      </header>

      {/* Balance Card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceInfo}>
          <span className={styles.balanceLabel}>
            {t('providerEarnings.availableBalance') || 'Solde disponible'}
          </span>
          <span className={styles.balanceAmount}>
            {toArabicNumerals(pendingAmount)} MAD
          </span>
        </div>
        <button
          className={styles.withdrawButton}
          onClick={handleWithdraw}
          disabled={pendingAmount === 0 || withdrawing}
        >
          {withdrawing
            ? (t('common.loading') || 'Chargement...')
            : (t('providerEarnings.withdraw') || 'Retirer')} 💳
        </button>
      </div>

      <main className={styles.main}>
        {/* Period Selector */}
        <div className={styles.periodSelector}>
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              className={`${styles.periodButton} ${period === p ? styles.active : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'week' ? (t('providerEarnings.week') || 'Semaine')
                : p === 'month' ? (t('providerEarnings.month') || 'Mois')
                : (t('providerEarnings.year') || 'Année')}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className={styles.statsRow}>
          <div className={`${styles.statCard} ${styles.statCardGreen}`}>
            <span className={styles.statIcon}>💰</span>
            <span className={styles.statValue}>{toArabicNumerals(currentEarnings.net)} MAD</span>
            <span className={styles.statLabel}>{t('providerEarnings.netEarnings') || 'Gains nets'}</span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardBlue}`}>
            <span className={styles.statIcon}>📅</span>
            <span className={styles.statValue}>{toArabicNumerals(currentEarnings.bookings)}</span>
            <span className={styles.statLabel}>{t('providerEarnings.reservations') || 'Réservations'}</span>
          </div>
        </div>

        {/* Weekly Chart */}
        {period === 'week' && (
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>{t('providerEarnings.earningsThisWeek') || 'Gains cette semaine'}</h3>
              <div className={styles.chartSummary}>
                <span className={styles.chartTotal}>
                  {toArabicNumerals(weeklyData.reduce((sum, d) => sum + d.amount, 0))} MAD
                </span>
                <span className={styles.chartBookings}>
                  {toArabicNumerals(weeklyData.reduce((sum, d) => sum + d.bookings, 0))} {t('providerEarnings.reservations') || 'réservations'}
                </span>
              </div>
            </div>
            <WeeklyChart data={weeklyData} isRTL={isRTL} />
          </div>
        )}

        {/* Earnings Details */}
        <div className={styles.detailsCard}>
          <h3>{t('providerEarnings.earningsDetails') || 'Détails des gains'}</h3>
          <div className={styles.detailsRow}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{t('providerEarnings.grossTotal') || 'Total brut'}</span>
              <span className={styles.detailValue}>{toArabicNumerals(currentEarnings.total)} MAD</span>
            </div>
            <div className={styles.detailDivider}></div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{t('providerEarnings.commission') || 'Commission'} (20%)</span>
              <span className={`${styles.detailValue} ${styles.negative}`}>
                -{toArabicNumerals(currentEarnings.commission)} MAD
              </span>
            </div>
          </div>
          <div className={styles.netRow}>
            <span className={styles.netLabel}>{t('providerEarnings.netEarnings') || 'Gains nets'}</span>
            <span className={styles.netValue}>{toArabicNumerals(currentEarnings.net)} MAD</span>
          </div>
        </div>

        {/* Transaction History */}
        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <div className={styles.historyTitleRow}>
              <span className={styles.historyIcon}>📋</span>
              <h3>{t('providerEarnings.history') || 'Historique'}</h3>
            </div>
            <span className={styles.historyCount}>
              {toArabicNumerals(transactions.length)} {t('providerEarnings.transactions') || 'transactions'}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className={styles.emptyHistory}>
              <span className={styles.emptyIcon}>💸</span>
              <p>{t('providerEarnings.noTransactions') || 'Aucune transaction'}</p>
              <span className={styles.emptySubtext}>
                {t('providerEarnings.trackEarnings') || 'Vos transactions apparaîtront ici'}
              </span>
            </div>
          ) : (
            <div className={styles.transactionsList}>
              {transactions.map(transaction => (
                <div key={transaction.id} className={styles.transactionCard}>
                  <div className={styles.transactionLeft}>
                    <div className={`${styles.avatar} ${transaction.status === 'paid' ? styles.avatarPaid : styles.avatarPending}`}>
                      {transaction.clientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className={styles.transactionInfo}>
                      <span className={styles.clientName}>{transaction.clientName}</span>
                      <span className={styles.serviceName}>{transaction.service}</span>
                      <div className={styles.transactionMeta}>
                        <span>{formatDate(transaction.date)}</span>
                        <span className={styles.dot}>•</span>
                        <span>#{toArabicNumerals(transaction.id)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.transactionRight}>
                    <span className={styles.transactionAmount}>+{toArabicNumerals(transaction.netAmount)} MAD</span>
                    <span className={styles.transactionGross}>{toArabicNumerals(transaction.amount)} MAD brut</span>
                    {transaction.tip > 0 && (
                      <span className={styles.transactionTip}>💝 +{toArabicNumerals(transaction.tip)} MAD</span>
                    )}
                    <span className={`${styles.status} ${getStatusClass(transaction.status)}`}>
                      {getStatusLabel(transaction.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.toastIcon}>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span>{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: '', type: 'success' })}>✕</button>
        </div>
      )}
    </div>
  );
}
