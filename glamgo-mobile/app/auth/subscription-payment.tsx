/**
 * Paiement de l'abonnement - GlamGo Mobile
 * Confirmer le paiement pour activer l'abonnement
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../src/lib/constants/theme';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import { hapticFeedback } from '../../src/lib/utils/haptics';
import { confirmSubscriptionPayment } from '../../src/lib/api/providerAPI';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function SubscriptionPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t, isRTL } = useLanguage();

  const subscriptionId = Number(params.subscription_id);
  const planName = params.plan_name as string;
  const planPrice = Number(params.plan_price);

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formater le numéro de carte
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 19);
  };

  // Formater la date d'expiration
  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    // Validation basique
    if (cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert(t('subscriptionPayment.error'), t('subscriptionPayment.invalidCard'));
      return;
    }
    if (expiry.length < 5) {
      Alert.alert(t('subscriptionPayment.error'), t('subscriptionPayment.invalidExpiry'));
      return;
    }
    if (cvv.length < 3) {
      Alert.alert(t('subscriptionPayment.error'), t('subscriptionPayment.invalidCvv'));
      return;
    }

    hapticFeedback.medium();
    setIsSubmitting(true);

    try {
      // Simuler le paiement (en production, utiliser un vrai gateway)
      const result = await confirmSubscriptionPayment(subscriptionId, 'mock_token');

      console.log('[Payment] Subscription confirmed:', result);

      hapticFeedback.success();
      Alert.alert(
        t('subscriptionPayment.paymentSuccess'),
        t('subscriptionPayment.subscriptionActive').replace('{plan}', planName),
        [
          {
            text: t('subscriptionPayment.start'),
            onPress: () => router.replace('/(provider)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur paiement:', error);
      hapticFeedback.error();
      Alert.alert(
        t('subscriptionPayment.paymentFailed'),
        error?.response?.data?.message || t('subscriptionPayment.paymentError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayLater = () => {
    Alert.alert(
      t('subscriptionPayment.payLater'),
      t('subscriptionPayment.payLaterMessage'),
      [
        { text: t('subscriptionPayment.cancel'), style: 'cancel' },
        {
          text: t('subscriptionPayment.continue'),
          onPress: () => router.replace('/(provider)'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.textRTL]}>{t('subscriptionPayment.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Résumé de la commande */}
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, isRTL && styles.textRTL]}>{t('subscriptionPayment.summaryTitle')}</Text>
          <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
            <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('subscriptionPayment.plan')}</Text>
            <Text style={[styles.summaryValue, isRTL && styles.textRTL]}>{planName}</Text>
          </View>
          <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
            <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('subscriptionPayment.duration')}</Text>
            <Text style={[styles.summaryValue, isRTL && styles.textRTL]}>{t('subscriptionPayment.oneMonth')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
            <Text style={[styles.totalLabel, isRTL && styles.textRTL]}>{t('subscriptionPayment.total')}</Text>
            <Text style={styles.totalValue}>{planPrice} DH</Text>
          </View>
        </Card>

        {/* Formulaire de carte */}
        <Card style={styles.paymentCard}>
          <Text style={[styles.cardTitle, isRTL && styles.textRTL]}>{t('subscriptionPayment.paymentInfo')}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('subscriptionPayment.cardNumber')}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="numeric"
              maxLength={19}
              placeholderTextColor={colors.gray[400]}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          <View style={[styles.rowInputs, isRTL && styles.rowInputsRTL]}>
            <View style={[styles.inputGroup, { flex: 1 }, isRTL ? { marginLeft: spacing.md } : { marginRight: spacing.md }]}>
              <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('subscriptionPayment.expiration')}</Text>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder="MM/AA"
                value={expiry}
                onChangeText={(text) => setExpiry(formatExpiry(text))}
                keyboardType="numeric"
                maxLength={5}
                placeholderTextColor={colors.gray[400]}
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('subscriptionPayment.cvv')}</Text>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder="123"
                value={cvv}
                onChangeText={(text) => setCvv(text.replace(/\D/g, '').substring(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholderTextColor={colors.gray[400]}
                textAlign={isRTL ? 'right' : 'left'}
              />
            </View>
          </View>

          <View style={[styles.securityNote, isRTL && styles.securityNoteRTL]}>
            <Text style={[styles.securityIcon, isRTL && styles.securityIconRTL]}>{'🔒'}</Text>
            <Text style={[styles.securityText, isRTL && styles.textRTL]}>
              {t('subscriptionPayment.securityNote')}
            </Text>
          </View>
        </Card>

        {/* Mode démo */}
        <View style={[styles.demoNote, isRTL && styles.demoNoteRTL]}>
          <Text style={[styles.demoIcon, isRTL && styles.demoIconRTL]}>{'ℹ️'}</Text>
          <Text style={[styles.demoText, isRTL && styles.textRTL]}>
            {t('subscriptionPayment.demoNote')}
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          variant="primary"
          fullWidth
          onPress={handlePayment}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {t('subscriptionPayment.pay').replace('{amount}', planPrice.toString())}
        </Button>

        <TouchableOpacity onPress={handlePayLater} style={styles.payLaterButton}>
          <Text style={[styles.payLaterText, isRTL && styles.textRTL]}>{t('subscriptionPayment.payLater')}</Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
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
    paddingBottom: spacing['3xl'],
  },

  // Summary Card
  summaryCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
    color: colors.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  totalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Payment Card
  paymentCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  securityIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // Demo note
  demoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  demoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  demoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.info,
    lineHeight: 18,
  },

  // Actions
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  payLaterButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  payLaterText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
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
  rowInputsRTL: {
    flexDirection: 'row-reverse',
  },
  inputRTL: {
    textAlign: 'right',
  },
  securityNoteRTL: {
    flexDirection: 'row-reverse',
  },
  securityIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  demoNoteRTL: {
    flexDirection: 'row-reverse',
  },
  demoIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
});
