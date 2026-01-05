/**
 * CancellationModal - Modal d'annulation de prestation
 * Utilisable cote client et prestataire
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import apiClient from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import { hapticFeedback } from '../../lib/utils/haptics';

interface CancellationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: number;
  userType: 'client' | 'provider';
  orderStatus: string;
  providerLocation?: { lat: number; lng: number } | null;
}

interface CancellationFeeInfo {
  can_cancel: boolean;
  fee: number;
  percentage: number;
  reason: string;
  rule_description?: string;
  hours_until_appointment?: number;
}

// Motifs d'annulation
const CANCELLATION_REASONS_CLIENT = [
  { key: 'changed_mind', label: 'J\'ai change d\'avis' },
  { key: 'found_another', label: 'J\'ai trouve un autre prestataire' },
  { key: 'schedule_conflict', label: 'Conflit d\'horaire' },
  { key: 'financial', label: 'Raisons financieres' },
  { key: 'emergency', label: 'Urgence personnelle' },
  { key: 'other', label: 'Autre raison' },
];

const CANCELLATION_REASONS_PROVIDER = [
  { key: 'emergency', label: 'Urgence personnelle' },
  { key: 'health', label: 'Probleme de sante' },
  { key: 'vehicle', label: 'Probleme de vehicule' },
  { key: 'schedule_conflict', label: 'Conflit d\'horaire' },
  { key: 'cannot_reach', label: 'Client injoignable' },
  { key: 'unsafe_location', label: 'Lieu non securise' },
  { key: 'other', label: 'Autre raison' },
];

export default function CancellationModal({
  visible,
  onClose,
  onSuccess,
  orderId,
  userType,
  orderStatus,
  providerLocation,
}: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFee, setIsFetchingFee] = useState(false);
  const [feeInfo, setFeeInfo] = useState<CancellationFeeInfo | null>(null);

  const reasons = userType === 'client' ? CANCELLATION_REASONS_CLIENT : CANCELLATION_REASONS_PROVIDER;

  // Charger les infos de frais d'annulation
  useEffect(() => {
    if (visible && userType === 'client') {
      fetchCancellationFee();
    }
  }, [visible, orderId]);

  const fetchCancellationFee = async () => {
    setIsFetchingFee(true);
    try {
      const response = await apiClient.get(ENDPOINTS.BOOKINGS.CANCELLATION_FEE(orderId));
      if (response.data?.success) {
        setFeeInfo(response.data.data);
      }
    } catch (error) {
      console.log('[CancellationModal] Error fetching fee:', error);
      // Ne pas bloquer - permettre l'annulation meme si on ne peut pas recuperer les frais
      setFeeInfo({ can_cancel: true, fee: 0, percentage: 0, reason: 'unknown' });
    } finally {
      setIsFetchingFee(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedReason) {
      Alert.alert('Motif requis', 'Veuillez selectionner un motif d\'annulation');
      return;
    }

    const reasonText = selectedReason === 'other'
      ? customReason.trim() || 'Autre raison'
      : reasons.find(r => r.key === selectedReason)?.label || selectedReason;

    if (selectedReason === 'other' && !customReason.trim()) {
      Alert.alert('Motif requis', 'Veuillez preciser le motif d\'annulation');
      return;
    }

    // Confirmer l'annulation si des frais s'appliquent
    if (feeInfo && feeInfo.fee > 0) {
      Alert.alert(
        'Confirmer l\'annulation',
        `Des frais de ${feeInfo.fee.toFixed(2)} MAD (${feeInfo.percentage}%) seront appliques.\n\nVoulez-vous continuer ?`,
        [
          { text: 'Non', style: 'cancel' },
          { text: 'Oui, annuler', style: 'destructive', onPress: () => submitCancellation(reasonText) },
        ]
      );
    } else {
      submitCancellation(reasonText);
    }
  };

  const submitCancellation = async (reasonText: string) => {
    setIsLoading(true);
    hapticFeedback.light();

    try {
      const endpoint = userType === 'client'
        ? ENDPOINTS.BOOKINGS.CANCEL(orderId)
        : ENDPOINTS.PROVIDER.CANCEL_ORDER(orderId);

      const payload: any = { reason: reasonText };

      // Ajouter la position du prestataire si disponible (pour calcul des frais)
      if (userType === 'client' && providerLocation) {
        payload.provider_lat = providerLocation.lat;
        payload.provider_lng = providerLocation.lng;
      }

      // Client utilise PATCH, Provider utilise POST
      const response = userType === 'client'
        ? await apiClient.patch(endpoint, payload)
        : await apiClient.post(endpoint, payload);

      if (response.data?.success) {
        hapticFeedback.success();
        Alert.alert(
          'Annulation confirmee',
          userType === 'client' && feeInfo && feeInfo.fee > 0
            ? `Votre reservation a ete annulee.\nFrais d'annulation: ${feeInfo.fee.toFixed(2)} MAD`
            : 'Votre reservation a ete annulee.',
          [{ text: 'OK', onPress: onSuccess }]
        );
      } else {
        throw new Error(response.data?.message || 'Erreur lors de l\'annulation');
      }
    } catch (error: any) {
      console.log('[CancellationModal] Error:', error);
      console.log('[CancellationModal] Response:', error.response?.data);
      hapticFeedback.error();

      // Message d'erreur plus clair
      let errorMessage = 'Impossible d\'annuler la reservation';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Traduire certaines erreurs techniques
        if (error.message.includes('Date value')) {
          errorMessage = 'Erreur technique lors de l\'annulation. Veuillez reessayer.';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusWarning = () => {
    if (userType === 'provider') {
      switch (orderStatus) {
        case 'on_way':
          return '⚠️ ATTENTION - Vous etes en route vers le client.\n\n' +
            '• Des points de penalite seront appliques a votre compte\n' +
            '• Votre score prestataire sera impacte\n' +
            '• Plusieurs annulations peuvent entrainer une suspension temporaire\n\n' +
            'Selon les CGU GlamGo, l\'annulation en cours de trajet est reservee aux cas d\'urgence.';
        case 'accepted':
          return '⚠️ Cette commande est deja acceptee.\n\n' +
            '• Des points de penalite peuvent etre appliques\n' +
            '• Le client sera notifie de l\'annulation';
        case 'arrived':
        case 'in_progress':
          return '🚫 L\'annulation n\'est plus possible une fois arrive chez le client ou en cours de prestation.';
        default:
          return null;
      }
    } else {
      // Client
      switch (orderStatus) {
        case 'on_way':
          return '⚠️ Le prestataire est en route. Des frais d\'annulation peuvent s\'appliquer selon la distance parcourue.';
        case 'arrived':
          return '🚫 Le prestataire est arrive. L\'annulation n\'est plus possible.';
        case 'in_progress':
          return '🚫 La prestation est en cours. L\'annulation n\'est plus possible.';
        default:
          return null;
      }
    }
  };

  const canCancel = !['arrived', 'in_progress', 'completed', 'cancelled'].includes(orderStatus);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Annuler la reservation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Warning si applicable */}
            {getStatusWarning() && (
              <View style={[
                styles.warningBox,
                orderStatus === 'on_way' && userType === 'provider' && styles.warningBoxDanger
              ]}>
                <Text style={[
                  styles.warningText,
                  orderStatus === 'on_way' && userType === 'provider' && styles.warningTextDanger
                ]}>
                  {getStatusWarning()}
                </Text>
              </View>
            )}

            {/* Frais d'annulation */}
            {userType === 'client' && (
              <View style={styles.feeSection}>
                {isFetchingFee ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : feeInfo ? (
                  <>
                    <Text style={styles.feeLabel}>Frais d'annulation</Text>
                    <Text style={[
                      styles.feeAmount,
                      feeInfo.fee > 0 ? styles.feeAmountWarning : styles.feeAmountFree
                    ]}>
                      {feeInfo.fee > 0 ? `${feeInfo.fee.toFixed(2)} MAD (${feeInfo.percentage}%)` : 'Gratuit'}
                    </Text>
                    {feeInfo.rule_description && (
                      <Text style={styles.feeDescription}>{feeInfo.rule_description}</Text>
                    )}
                  </>
                ) : null}
              </View>
            )}

            {/* Liste des motifs */}
            {canCancel && (
              <>
                <Text style={styles.sectionTitle}>Motif d'annulation *</Text>
                <View style={styles.reasonsContainer}>
                  {reasons.map((reason) => (
                    <TouchableOpacity
                      key={reason.key}
                      style={[
                        styles.reasonButton,
                        selectedReason === reason.key && styles.reasonButtonSelected,
                      ]}
                      onPress={() => {
                        setSelectedReason(reason.key);
                        hapticFeedback.light();
                      }}
                    >
                      <Text style={[
                        styles.reasonText,
                        selectedReason === reason.key && styles.reasonTextSelected,
                      ]}>
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Champ personnalise si "Autre" */}
                {selectedReason === 'other' && (
                  <TextInput
                    style={styles.customReasonInput}
                    placeholder="Precisez le motif..."
                    placeholderTextColor={colors.gray[400]}
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                    maxLength={200}
                  />
                )}
              </>
            )}

            {/* Message si annulation impossible */}
            {!canCancel && (
              <View style={styles.cannotCancelBox}>
                <Text style={styles.cannotCancelIcon}>🚫</Text>
                <Text style={styles.cannotCancelText}>
                  L'annulation n'est plus possible a ce stade de la prestation.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelActionButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelActionText}>Retour</Text>
            </TouchableOpacity>

            {canCancel && (
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!selectedReason || isLoading) && styles.confirmButtonDisabled,
                ]}
                onPress={handleCancel}
                disabled={!selectedReason || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmer l'annulation</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: colors.gray[600],
  },
  content: {
    padding: spacing.md,
  },
  warningBox: {
    backgroundColor: colors.warning + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningBoxDanger: {
    backgroundColor: colors.error + '15',
    borderLeftColor: colors.error,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[800],
    lineHeight: 22,
  },
  warningTextDanger: {
    color: colors.error,
    fontWeight: '500',
  },
  feeSection: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  feeAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  feeAmountFree: {
    color: colors.success,
  },
  feeAmountWarning: {
    color: colors.error,
  },
  feeDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  reasonsContainer: {
    gap: spacing.xs,
  },
  reasonButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  reasonButtonSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  reasonText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  reasonTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  customReasonInput: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cannotCancelBox: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  cannotCancelIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  cannotCancelText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  cancelActionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[700],
  },
  confirmButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },
});
