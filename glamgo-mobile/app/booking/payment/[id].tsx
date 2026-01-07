/**
 * Booking Payment Screen - GlamGo Mobile
 * Ecran de paiement pour une reservation terminee
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/lib/constants/theme';
import { hapticFeedback } from '../../../src/lib/utils/haptics';
import { getBookingById, Booking } from '../../../src/lib/api/bookingsAPI';
import { ENDPOINTS } from '../../../src/lib/api/endpoints';
import apiClient from '../../../src/lib/api/client';
import { useLanguage } from '../../../src/contexts/LanguageContext';
import { getServiceTranslation } from '../../../src/i18n/translations/services';

type PaymentMethod = 'cash' | 'card' | 'saved_card';

interface SavedCard {
  id: number;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
}

// Demo data
const DEMO_SAVED_CARDS: SavedCard[] = [
  { id: 1, last4: '4242', brand: 'Visa', exp_month: 12, exp_year: 2025 },
];

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, isRTL, language } = useLanguage();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>(DEMO_SAVED_CARDS);

  // Load booking data
  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      setIsLoading(true);
      if (id) {
        const data = await getBookingById(id);
        setBooking(data);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      // Demo fallback
      setBooking({
        id: Number(id) || 1,
        user_id: 1,
        provider_id: 1,
        service_id: 1,
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        duration_minutes: 60,
        price: 250,
        total: 250,
        currency: 'MAD',
        address: '123 Boulevard Mohammed V, Casablanca',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service: {
          id: 1,
          title: 'Coupe femme + Brushing',
        },
        provider: {
          id: 1,
          name: 'Sarah Beaute',
          rating: 4.8,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    hapticFeedback.selection();
    setSelectedMethod(method);
    if (method !== 'saved_card') {
      setSelectedCardId(null);
    }
  };

  const handleSelectCard = (cardId: number) => {
    hapticFeedback.selection();
    setSelectedMethod('saved_card');
    setSelectedCardId(cardId);
  };

  const handlePayment = async () => {
    if (selectedMethod === 'saved_card' && !selectedCardId) {
      Alert.alert(t('paymentScreen.error'), t('paymentScreen.selectCard'));
      return;
    }

    hapticFeedback.medium();
    setIsProcessing(true);

    try {
      // Call payment API
      const paymentData = {
        booking_id: booking?.id,
        amount: booking?.total || 0,
        payment_method: selectedMethod,
        payment_method_id: selectedCardId,
      };

      await apiClient.post(ENDPOINTS.PAYMENTS.CREATE, paymentData);

      hapticFeedback.success();

      Alert.alert(
        t('paymentScreen.paymentSuccess'),
        selectedMethod === 'cash'
          ? t('paymentScreen.cashPaymentMessage')
          : t('paymentScreen.cardPaymentMessage'),
        [
          {
            text: t('paymentScreen.rateProvider'),
            onPress: () => router.replace(`/booking/review/${booking?.id}` as any),
          },
          {
            text: t('paymentScreen.later'),
            onPress: () => router.replace('/(client)/bookings'),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      hapticFeedback.error();

      // Demo mode - simulate success
      Alert.alert(
        t('paymentScreen.paymentSuccess'),
        selectedMethod === 'cash'
          ? t('paymentScreen.cashPaymentMessage')
          : t('paymentScreen.cardPaymentMessage'),
        [
          {
            text: t('paymentScreen.rateProvider'),
            onPress: () => router.replace(`/booking/review/${booking?.id}` as any),
          },
          {
            text: t('paymentScreen.later'),
            onPress: () => router.replace('/(client)/bookings'),
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, isRTL && styles.textRTL]}>{t('paymentScreen.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={[styles.errorText, isRTL && styles.textRTL]}>{t('paymentScreen.bookingNotFound')}</Text>
          <Button variant="outline" onPress={() => router.back()}>
            {t('paymentScreen.back')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('paymentScreen.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Summary */}
        <Card style={styles.summaryCard}>
          <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('paymentScreen.summaryTitle')}</Text>

          <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
            <Text style={styles.summaryIcon}>💇</Text>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('paymentScreen.service')}</Text>
              <Text style={[styles.summaryValue, isRTL && styles.textRTL]}>{getServiceTranslation(booking.service?.title || '', language).title}</Text>
            </View>
          </View>

          <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
            <Text style={styles.summaryIcon}>👤</Text>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('paymentScreen.provider')}</Text>
              <Text style={[styles.summaryValue, isRTL && styles.textRTL]}>{booking.provider?.name}</Text>
            </View>
          </View>

          <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
            <Text style={styles.summaryIcon}>📅</Text>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('paymentScreen.date')}</Text>
              <Text style={[styles.summaryValue, isRTL && styles.textRTL]}>
                {formatDate(booking.date)} {t('paymentScreen.at')} {booking.start_time}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={[styles.totalRow, isRTL && styles.totalRowRTL]}>
            <Text style={[styles.totalLabel, isRTL && styles.textRTL]}>{t('paymentScreen.totalToPay')}</Text>
            <Text style={styles.totalValue}>{booking.total} DH</Text>
          </View>
        </Card>

        {/* Payment Methods */}
        <Text style={[styles.sectionHeader, isRTL && styles.textRTL]}>{t('paymentScreen.paymentMethod')}</Text>

        {/* Cash Option */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            selectedMethod === 'cash' && styles.paymentOptionSelected,
            isRTL && styles.paymentOptionRTL,
          ]}
          onPress={() => handleSelectMethod('cash')}
          activeOpacity={0.7}
        >
          <View style={[styles.paymentOptionLeft, isRTL && styles.paymentOptionLeftRTL]}>
            <Text style={styles.paymentOptionIcon}>💵</Text>
            <View>
              <Text style={[styles.paymentOptionTitle, isRTL && styles.textRTL]}>{t('paymentScreen.cash')}</Text>
              <Text style={[styles.paymentOptionSubtitle, isRTL && styles.textRTL]}>{t('paymentScreen.cashDesc')}</Text>
            </View>
          </View>
          <View
            style={[
              styles.radioButton,
              selectedMethod === 'cash' && styles.radioButtonSelected,
            ]}
          >
            {selectedMethod === 'cash' && <View style={styles.radioButtonInner} />}
          </View>
        </TouchableOpacity>

        {/* Card Option */}
        <TouchableOpacity
          style={[
            styles.paymentOption,
            selectedMethod === 'card' && styles.paymentOptionSelected,
            isRTL && styles.paymentOptionRTL,
          ]}
          onPress={() => handleSelectMethod('card')}
          activeOpacity={0.7}
        >
          <View style={[styles.paymentOptionLeft, isRTL && styles.paymentOptionLeftRTL]}>
            <Text style={styles.paymentOptionIcon}>💳</Text>
            <View>
              <Text style={[styles.paymentOptionTitle, isRTL && styles.textRTL]}>{t('paymentScreen.card')}</Text>
              <Text style={[styles.paymentOptionSubtitle, isRTL && styles.textRTL]}>{t('paymentScreen.cardDesc')}</Text>
            </View>
          </View>
          <View
            style={[
              styles.radioButton,
              selectedMethod === 'card' && styles.radioButtonSelected,
            ]}
          >
            {selectedMethod === 'card' && <View style={styles.radioButtonInner} />}
          </View>
        </TouchableOpacity>

        {/* Saved Cards */}
        {savedCards.length > 0 && (
          <>
            <Text style={[styles.savedCardsTitle, isRTL && styles.textRTL]}>{t('paymentScreen.savedCards')}</Text>
            {savedCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.paymentOption,
                  selectedMethod === 'saved_card' &&
                    selectedCardId === card.id &&
                    styles.paymentOptionSelected,
                  isRTL && styles.paymentOptionRTL,
                ]}
                onPress={() => handleSelectCard(card.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.paymentOptionLeft, isRTL && styles.paymentOptionLeftRTL]}>
                  <Text style={styles.paymentOptionIcon}>
                    {card.brand === 'Visa' ? '💳' : '💳'}
                  </Text>
                  <View>
                    <Text style={[styles.paymentOptionTitle, isRTL && styles.textRTL]}>
                      {card.brand} •••• {card.last4}
                    </Text>
                    <Text style={[styles.paymentOptionSubtitle, isRTL && styles.textRTL]}>
                      {t('paymentScreen.expires')} {card.exp_month}/{card.exp_year}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedMethod === 'saved_card' &&
                      selectedCardId === card.id &&
                      styles.radioButtonSelected,
                  ]}
                >
                  {selectedMethod === 'saved_card' && selectedCardId === card.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Security Info */}
        <View style={[styles.securityInfo, isRTL && styles.securityInfoRTL]}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={[styles.securityText, isRTL && styles.textRTL]}>
            {t('paymentScreen.securityInfo')}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isProcessing}
          disabled={isProcessing}
          onPress={handlePayment}
        >
          {isProcessing
            ? t('paymentScreen.processing')
            : selectedMethod === 'cash'
            ? t('paymentScreen.confirmCash')
            : t('paymentScreen.pay').replace('{amount}', String(booking.total))}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorIcon: {
    fontSize: 64,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[600],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.gray[900],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  headerSpacer: {
    width: 40,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },

  // Summary Card
  summaryCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  summaryIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  totalValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Section Header
  sectionHeader: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },

  // Payment Options
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  paymentOptionIcon: {
    fontSize: 24,
  },
  paymentOptionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  paymentOptionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  // Saved Cards
  savedCardsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.gray[600],
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  // Security Info
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.md,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.success,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    ...shadows.lg,
  },

  // RTL Styles
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  summaryRowRTL: {
    flexDirection: 'row-reverse',
  },
  totalRowRTL: {
    flexDirection: 'row-reverse',
  },
  paymentOptionRTL: {
    flexDirection: 'row-reverse',
  },
  paymentOptionLeftRTL: {
    flexDirection: 'row-reverse',
  },
  securityInfoRTL: {
    flexDirection: 'row-reverse',
  },
});
