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

export default function SubscriptionPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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
      Alert.alert('Erreur', 'Numéro de carte invalide');
      return;
    }
    if (expiry.length < 5) {
      Alert.alert('Erreur', 'Date d\'expiration invalide');
      return;
    }
    if (cvv.length < 3) {
      Alert.alert('Erreur', 'CVV invalide');
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
        'Paiement réussi !',
        `Votre abonnement ${planName} est maintenant actif. Profitez de tous vos avantages !`,
        [
          {
            text: 'Commencer',
            onPress: () => router.replace('/(provider)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur paiement:', error);
      hapticFeedback.error();
      Alert.alert(
        'Paiement échoué',
        error?.response?.data?.message || 'Une erreur est survenue lors du paiement'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayLater = () => {
    Alert.alert(
      'Payer plus tard',
      'Votre abonnement sera en attente de paiement. Vous ne pourrez pas profiter de tous les avantages tant que le paiement n\'est pas effectué.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          onPress: () => router.replace('/(provider)'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Résumé de la commande */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Résumé de votre abonnement</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>{planName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Durée</Text>
            <Text style={styles.summaryValue}>1 mois</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{planPrice} DH</Text>
          </View>
        </Card>

        {/* Formulaire de carte */}
        <Card style={styles.paymentCard}>
          <Text style={styles.cardTitle}>Informations de paiement</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Numéro de carte</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="numeric"
              maxLength={19}
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.md }]}>
              <Text style={styles.inputLabel}>Expiration</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/AA"
                value={expiry}
                onChangeText={(text) => setExpiry(formatExpiry(text))}
                keyboardType="numeric"
                maxLength={5}
                placeholderTextColor={colors.gray[400]}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                value={cvv}
                onChangeText={(text) => setCvv(text.replace(/\D/g, '').substring(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholderTextColor={colors.gray[400]}
              />
            </View>
          </View>

          <View style={styles.securityNote}>
            <Text style={styles.securityIcon}>{'🔒'}</Text>
            <Text style={styles.securityText}>
              Vos informations de paiement sont sécurisées et chiffrées
            </Text>
          </View>
        </Card>

        {/* Mode démo */}
        <View style={styles.demoNote}>
          <Text style={styles.demoIcon}>{'ℹ️'}</Text>
          <Text style={styles.demoText}>
            Mode démonstration : utilisez n'importe quel numéro de carte valide pour tester
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
          {`Payer ${planPrice} DH`}
        </Button>

        <TouchableOpacity onPress={handlePayLater} style={styles.payLaterButton}>
          <Text style={styles.payLaterText}>Payer plus tard</Text>
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
});
