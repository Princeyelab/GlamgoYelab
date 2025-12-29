/**
 * SatisfactionModal - Questionnaire de satisfaction post-prestation
 *
 * Modal avec stepper en 3 étapes:
 * 1. Note qualité (obligatoire)
 * 2. Détails: ponctualité, prix, professionnalisme
 * 3. Commentaire et pourboire (optionnels)
 *
 * GlamGo Mobile - Marrakech
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, shadows, borderRadius } from '../../lib/constants/theme';

interface Order {
  id: number;
  service_name?: string;
  provider_name?: string;
  provider_first_name?: string;
  provider_last_name?: string;
  price?: number;
  total?: number;
  payment_method?: string;
  completed_at?: string;
}

interface SatisfactionModalProps {
  visible: boolean;
  order: Order;
  onClose: () => void;
  onSubmit: (data: SatisfactionData) => Promise<void>;
}

interface SatisfactionData {
  quality_rating: number;
  punctuality: boolean | null;
  price_respected: boolean | null;
  professionalism_rating: number | null;
  comment: string | null;
  tip: number | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Labels pour les notes
const ratingLabels: Record<number, string> = {
  0: 'Cliquez pour noter',
  1: 'Très insatisfait',
  2: 'Insatisfait',
  3: 'Correct',
  4: 'Satisfait',
  5: 'Excellent !',
};

// Composant StarRating
const StarRating: React.FC<{
  value: number;
  onChange: (value: number) => void;
  size?: 'small' | 'large';
  disabled?: boolean;
}> = ({ value, onChange, size = 'large', disabled = false }) => {
  const fontSize = size === 'large' ? 36 : 24;

  return (
    <View style={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !disabled && onChange(star)}
          disabled={disabled}
          style={styles.starButton}
        >
          <Text style={{ fontSize }}>
            {value >= star ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Composant YesNoButtons
const YesNoButtons: React.FC<{
  value: boolean | null;
  onChange: (value: boolean) => void;
}> = ({ value, onChange }) => (
  <View style={styles.yesNoContainer}>
    <TouchableOpacity
      style={[styles.yesNoButton, value === true && styles.yesNoButtonSelected]}
      onPress={() => onChange(true)}
    >
      <Text style={[styles.yesNoIcon, value === true && styles.yesNoIconSelected]}>✓</Text>
      <Text style={[styles.yesNoText, value === true && styles.yesNoTextSelected]}>
        Oui
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.yesNoButton, value === false && styles.yesNoButtonSelectedNo]}
      onPress={() => onChange(false)}
    >
      <Text style={[styles.yesNoIcon, value === false && styles.yesNoIconSelectedNo]}>✗</Text>
      <Text style={[styles.yesNoText, value === false && styles.yesNoTextSelected]}>
        Non
      </Text>
    </TouchableOpacity>
  </View>
);

// Composant TipSelector
const TipSelector: React.FC<{
  value: number;
  customTip: string;
  showCustom: boolean;
  onSelectAmount: (amount: number) => void;
  onShowCustom: () => void;
  onCustomChange: (value: string) => void;
  paymentMethod?: string;
}> = ({ value, customTip, showCustom, onSelectAmount, onShowCustom, onCustomChange, paymentMethod }) => {
  const tipAmounts = [0, 10, 20, 50];
  const isCard = paymentMethod === 'card';

  return (
    <View style={styles.tipSection}>
      <View style={styles.tipHeader}>
        <Text style={styles.tipIcon}>💝</Text>
        <View style={styles.tipHeaderText}>
          <Text style={styles.tipLabel}>Laisser un pourboire ?</Text>
          <Text style={styles.tipHint}>Pour remercier votre prestataire</Text>
        </View>
      </View>

      <View style={styles.tipOptions}>
        {tipAmounts.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={[
              styles.tipOption,
              value === amount && !showCustom && styles.tipOptionSelected,
            ]}
            onPress={() => onSelectAmount(amount)}
          >
            <Text
              style={[
                styles.tipOptionText,
                value === amount && !showCustom && styles.tipOptionTextSelected,
              ]}
            >
              {amount === 0 ? 'Non merci' : `${amount} DH`}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.tipOption, showCustom && styles.tipOptionSelected]}
          onPress={onShowCustom}
        >
          <Text style={[styles.tipOptionText, showCustom && styles.tipOptionTextSelected]}>
            Autre
          </Text>
        </TouchableOpacity>
      </View>

      {showCustom && (
        <View style={styles.customTipContainer}>
          <TextInput
            style={styles.customTipInput}
            placeholder="Montant..."
            placeholderTextColor={colors.gray[400]}
            keyboardType="numeric"
            value={customTip}
            onChangeText={onCustomChange}
            maxLength={3}
          />
          <Text style={styles.customTipCurrency}>DH</Text>
        </View>
      )}

      {(value > 0 || (showCustom && customTip)) && (
        <View style={styles.tipConfirmation}>
          <Text style={styles.tipConfirmationText}>
            Pourboire : <Text style={styles.tipAmount}>{customTip || value} DH</Text>
          </Text>
          <Text style={styles.tipChargeNote}>
            {isCard ? 'Sera prélevé avec le paiement par carte' : 'À remettre en espèces au prestataire'}
          </Text>
        </View>
      )}
    </View>
  );
};

export const SatisfactionModal: React.FC<SatisfactionModalProps> = ({
  visible,
  order,
  onClose,
  onSubmit,
}) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<SatisfactionData & { customTip: string; showCustomTip: boolean }>({
    quality_rating: 0,
    punctuality: null,
    price_respected: null,
    professionalism_rating: 0,
    comment: '',
    tip: 0,
    customTip: '',
    showCustomTip: false,
  });

  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (formData.quality_rating === 0) {
      setError('Veuillez noter la qualité de la prestation');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.punctuality === null) {
      setError('Veuillez indiquer si le prestataire était ponctuel');
      return false;
    }
    if (formData.price_respected === null) {
      setError('Veuillez indiquer si le prix était respecté');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((prev) => Math.min(prev + 1, 3));
    setError('');
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setSubmitting(true);
    setError('');

    const tipAmount = formData.customTip ? parseInt(formData.customTip) || 0 : (formData.tip || 0);

    try {
      await onSubmit({
        quality_rating: formData.quality_rating,
        punctuality: formData.punctuality,
        price_respected: formData.price_respected,
        professionalism_rating: formData.professionalism_rating > 0 ? formData.professionalism_rating : null,
        comment: formData.comment.trim() || null,
        tip: tipAmount > 0 ? tipAmount : null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      quality_rating: 0,
      punctuality: null,
      price_respected: null,
      professionalism_rating: 0,
      comment: '',
      tip: 0,
      customTip: '',
      showCustomTip: false,
    });
    setError('');
    onClose();
  };

  const providerName = order.provider_name ||
    `${order.provider_first_name || ''} ${order.provider_last_name || ''}`.trim() ||
    'le prestataire';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Évaluez votre prestation</Text>
              <Text style={styles.subtitle}>Votre avis compte !</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Stepper */}
          <View style={styles.stepper}>
            {[1, 2, 3].map((s, index) => (
              <React.Fragment key={s}>
                <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>
                    {s}
                  </Text>
                </View>
                {index < 2 && (
                  <View style={[styles.stepLine, step > s && styles.stepLineActive]} />
                )}
              </React.Fragment>
            ))}
          </View>
          <View style={styles.stepLabels}>
            <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Qualité</Text>
            <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Détails</Text>
            <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>Avis</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Step 1: Quality Rating */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.questionTitle}>
                  Comment évaluez-vous la qualité de la prestation ?
                </Text>

                <View style={styles.ratingContainer}>
                  <StarRating
                    value={formData.quality_rating}
                    onChange={(val) => updateField('quality_rating', val)}
                    size="large"
                  />
                  <Text style={styles.ratingLabel}>
                    {ratingLabels[formData.quality_rating]}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, formData.quality_rating === 0 && styles.buttonDisabled]}
                  onPress={nextStep}
                  disabled={formData.quality_rating === 0}
                >
                  <Text style={styles.buttonText}>Suivant →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <View style={styles.question}>
                  <Text style={styles.questionLabel}>
                    Le prestataire était-il ponctuel ?
                  </Text>
                  <YesNoButtons
                    value={formData.punctuality}
                    onChange={(val) => updateField('punctuality', val)}
                  />
                </View>

                <View style={styles.question}>
                  <Text style={styles.questionLabel}>
                    Le prix annoncé a-t-il été respecté ?
                  </Text>
                  <YesNoButtons
                    value={formData.price_respected}
                    onChange={(val) => updateField('price_respected', val)}
                  />
                </View>

                <View style={styles.question}>
                  <Text style={styles.questionLabel}>
                    Professionnalisme (optionnel)
                  </Text>
                  <StarRating
                    value={formData.professionalism_rating}
                    onChange={(val) => updateField('professionalism_rating', val)}
                    size="small"
                  />
                </View>

                <View style={styles.stepActions}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={prevStep}
                  >
                    <Text style={styles.buttonTextSecondary}>← Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.buttonPrimary,
                      (formData.punctuality === null || formData.price_respected === null) && styles.buttonDisabled,
                    ]}
                    onPress={nextStep}
                    disabled={formData.punctuality === null || formData.price_respected === null}
                  >
                    <Text style={styles.buttonText}>Suivant →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 3: Comment & Tip */}
            {step === 3 && (
              <View style={styles.stepContent}>
                {/* Tip Section - toujours visible */}
                <TipSelector
                  value={formData.tip || 0}
                  customTip={formData.customTip}
                  showCustom={formData.showCustomTip}
                  onSelectAmount={(amount) => {
                    updateField('tip', amount);
                    updateField('customTip', '');
                    updateField('showCustomTip', false);
                  }}
                  onShowCustom={() => {
                    updateField('showCustomTip', true);
                    updateField('tip', 0);
                  }}
                  onCustomChange={(val) => updateField('customTip', val)}
                  paymentMethod={order.payment_method}
                />

                <View style={styles.question}>
                  <Text style={styles.questionLabel}>
                    Laissez un commentaire (optionnel)
                  </Text>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Partagez votre expérience..."
                    placeholderTextColor={colors.gray[400]}
                    multiline
                    numberOfLines={4}
                    maxLength={1000}
                    value={formData.comment}
                    onChangeText={(text) => updateField('comment', text)}
                    textAlignVertical="top"
                  />
                  <Text style={styles.charCount}>{formData.comment.length}/1000</Text>
                </View>

                <View style={styles.stepActions}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={prevStep}
                  >
                    <Text style={styles.buttonTextSecondary}>← Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSuccess]}
                    onPress={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.buttonText}>✓ Valider</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service :</Text>
                <Text style={styles.summaryValue}>{order.service_name || 'N/A'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Prestataire :</Text>
                <Text style={styles.summaryValue}>{providerName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Montant :</Text>
                <Text style={styles.summaryValueBold}>{order.price || order.total || 0} DH</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 4,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeIcon: {
    fontSize: 24,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.bold,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[500],
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.sm,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    flex: 1,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  stepContent: {
    paddingVertical: spacing.md,
  },
  questionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[800],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  starRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  starButton: {
    padding: spacing.xs,
  },
  ratingLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginTop: spacing.md,
    fontWeight: typography.fontWeight.medium,
  },
  question: {
    marginBottom: spacing.lg,
  },
  questionLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[800],
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  yesNoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  yesNoButtonSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  yesNoButtonSelectedNo: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  yesNoIcon: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  yesNoIconSelected: {
    color: colors.white,
  },
  yesNoIconSelectedNo: {
    color: colors.white,
  },
  yesNoText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[700],
  },
  yesNoTextSelected: {
    color: colors.white,
  },
  stepActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonDisabled: {
    backgroundColor: colors.gray[300],
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  buttonTextSecondary: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  tipSection: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  tipHeaderText: {
    flex: 1,
  },
  tipLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
  },
  tipHint: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  tipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tipOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  tipOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tipOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  tipOptionTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  customTipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
    paddingHorizontal: spacing.md,
  },
  customTipInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.sm,
    color: colors.gray[800],
  },
  customTipCurrency: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    fontWeight: typography.fontWeight.semibold,
  },
  tipConfirmation: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
  },
  tipConfirmationText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    textAlign: 'center',
  },
  tipAmount: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  tipChargeNote: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 2,
  },
  commentInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[800],
    minHeight: 100,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '15',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    flex: 1,
  },
  orderSummary: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: spacing.md,
    marginVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    flex: 1,
    textAlign: 'right',
  },
  summaryValueBold: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});

export default SatisfactionModal;
