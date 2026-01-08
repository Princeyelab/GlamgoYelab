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
  I18nManager,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import apiClient from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import { hapticFeedback } from '../../lib/utils/haptics';
import { useLanguage } from '../../contexts/LanguageContext';
import { appEvents, EVENTS } from '../../lib/utils/eventEmitter';
import { addCancelledOrderId, initCancelledOrdersCache } from '../../lib/utils/cancelledOrdersCache';

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

// Motifs d'annulation - Keys pour traduction
const CANCELLATION_REASON_KEYS_CLIENT = [
  'changed_mind',
  'found_another',
  'schedule_conflict',
  'financial',
  'emergency',
  'other',
];

const CANCELLATION_REASON_KEYS_PROVIDER = [
  'emergency',
  'health',
  'vehicle',
  'schedule_conflict',
  'cannot_reach',
  'unsafe_location',
  'other',
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
  const { t, isRTL } = useLanguage();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFee, setIsFetchingFee] = useState(false);
  const [feeInfo, setFeeInfo] = useState<CancellationFeeInfo | null>(null);

  const reasonKeys = userType === 'client' ? CANCELLATION_REASON_KEYS_CLIENT : CANCELLATION_REASON_KEYS_PROVIDER;

  // Get translated reasons
  const getReasonLabel = (key: string) => {
    const prefix = userType === 'client' ? 'cancellation.clientReasons' : 'cancellation.providerReasons';
    return t(`${prefix}.${key}`);
  };

  // Debug logging
  useEffect(() => {
    if (visible) {
      console.log('[CancellationModal] Modal opened with props:', {
        orderId,
        userType,
        orderStatus,
        visible,
      });
    }
  }, [visible, orderId, userType, orderStatus]);

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
      Alert.alert(t('cancellation.reasonRequired'), t('cancellation.pleaseSelectReason'));
      return;
    }

    const reasonText = selectedReason === 'other'
      ? customReason.trim() || t('cancellation.clientReasons.other')
      : getReasonLabel(selectedReason);

    if (selectedReason === 'other' && !customReason.trim()) {
      Alert.alert(t('cancellation.reasonRequired'), t('cancellation.pleaseSpecifyReason'));
      return;
    }

    // Confirmer l'annulation si des frais s'appliquent
    if (feeInfo && feeInfo.fee > 0) {
      Alert.alert(
        t('cancellation.confirmCancellation'),
        t('cancellation.confirmCancellationMessage', { fee: feeInfo.fee.toFixed(2), percentage: feeInfo.percentage.toString() }),
        [
          { text: t('common.no'), style: 'cancel' },
          { text: t('cancellation.confirmCancellationButton'), style: 'destructive', onPress: () => submitCancellation(reasonText) },
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
        // Ajouter au cache AsyncStorage pour éviter réapparition
        await addCancelledOrderId(orderId);
        // Recharger le cache mémoire immédiatement pour que isOrderCancelled() fonctionne
        await initCancelledOrdersCache();
        console.log('[CancellationModal] Order added to cache and cache reloaded:', orderId);
        // Émettre l'événement pour notifier les autres écrans
        appEvents.emit(EVENTS.ORDER_CANCELLED, { orderId, userType });
        Alert.alert(
          t('cancellation.cancellationConfirmed'),
          userType === 'client' && feeInfo && feeInfo.fee > 0
            ? t('cancellation.bookingCancelledWithFee', { fee: feeInfo.fee.toFixed(2) })
            : t('cancellation.bookingCancelled'),
          [{ text: t('common.ok'), onPress: onSuccess }]
        );
      } else {
        throw new Error(response.data?.message || t('common.error'));
      }
    } catch (error: any) {
      console.log('[CancellationModal] Error:', error);
      console.log('[CancellationModal] Response:', error.response?.data);
      hapticFeedback.error();

      // Message d'erreur plus clair
      let errorMessage = t('cancellation.cancellationError');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Traduire certaines erreurs techniques
        if (error.message.includes('Date value')) {
          errorMessage = t('cancellation.technicalError');
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusWarning = () => {
    console.log('[CancellationModal] getStatusWarning called:', { userType, orderStatus });

    if (userType === 'provider') {
      switch (orderStatus) {
        case 'on_way':
          const warningText = t('cancellation.warningOnWayProvider');
          console.log('[CancellationModal] Returning on_way warning:', warningText);
          return warningText;
        case 'accepted':
          return t('cancellation.warningAcceptedProvider');
        case 'arrived':
        case 'in_progress':
          return t('cancellation.warningArrivedProvider');
        default:
          console.log('[CancellationModal] No warning for status:', orderStatus);
          return null;
      }
    } else {
      // Client
      switch (orderStatus) {
        case 'on_way':
          return t('cancellation.warningOnWayClient');
        case 'arrived':
          return t('cancellation.warningArrivedClient');
        case 'in_progress':
          return t('cancellation.warningInProgressClient');
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
        <View style={[styles.container, isRTL && styles.containerRTL]}>
          {/* Header */}
          <View style={[styles.header, isRTL && styles.headerRTL]}>
            <Text style={[styles.title, isRTL && styles.textRTL]}>{t('cancellation.cancelBooking')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Warning si applicable */}
            {(() => {
              const warning = getStatusWarning();
              console.log('[CancellationModal] Warning box check:', {
                hasWarning: !!warning,
                warning,
                orderStatus,
                userType,
                isDangerStyle: orderStatus === 'on_way' && userType === 'provider'
              });

              return warning && (
                <View style={[
                  styles.warningBox,
                  isRTL && styles.warningBoxRTL,
                  orderStatus === 'on_way' && userType === 'provider' && styles.warningBoxDanger
                ]}>
                  <Text style={[
                    styles.warningText,
                    isRTL && styles.textRTL,
                    orderStatus === 'on_way' && userType === 'provider' && styles.warningTextDanger
                  ]}>
                    {warning}
                  </Text>
                </View>
              );
            })()}

            {/* Barème des frais d'annulation CGU - Client uniquement */}
            {userType === 'client' && (
              <View style={[styles.policyBox, isRTL && styles.policyBoxRTL]}>
                <Text style={[styles.policyTitle, isRTL && styles.textRTL]}>
                  ⚠️ {t('cancellation.policyTitle')}
                </Text>
                <View style={styles.policyRow}>
                  <Text style={styles.policyDot}>•</Text>
                  <Text style={[styles.policyText, isRTL && styles.textRTL]}>{t('cancellation.policyMoreThan2h')}</Text>
                </View>
                <View style={styles.policyRow}>
                  <Text style={styles.policyDot}>•</Text>
                  <Text style={[styles.policyText, isRTL && styles.textRTL]}>{t('cancellation.policy1to2h')}</Text>
                </View>
                <View style={styles.policyRow}>
                  <Text style={styles.policyDot}>•</Text>
                  <Text style={[styles.policyText, isRTL && styles.textRTL]}>{t('cancellation.policyLessThan1h')}</Text>
                </View>
                <View style={styles.policyRow}>
                  <Text style={styles.policyDot}>•</Text>
                  <Text style={[styles.policyText, isRTL && styles.textRTL]}>{t('cancellation.policyNoShow')}</Text>
                </View>
              </View>
            )}

            {/* Frais d'annulation calculés */}
            {userType === 'client' && (
              <View style={styles.feeSection}>
                {isFetchingFee ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : feeInfo ? (
                  <>
                    <Text style={[styles.feeLabel, isRTL && styles.textRTL]}>{t('cancellation.yourFee')}</Text>
                    <Text style={[
                      styles.feeAmount,
                      feeInfo.fee > 0 ? styles.feeAmountWarning : styles.feeAmountFree
                    ]}>
                      {feeInfo.fee > 0 ? `${feeInfo.fee.toFixed(2)} MAD` : t('cancellation.free')}
                    </Text>
                    {feeInfo.hours_until_appointment !== undefined && (
                      <Text style={[styles.feeDescription, isRTL && styles.textRTL]}>
                        {t('cancellation.hoursUntilAppointment', { hours: feeInfo.hours_until_appointment.toFixed(1) })}
                      </Text>
                    )}
                    {feeInfo.rule_description && (
                      <Text style={[styles.feeDescription, isRTL && styles.textRTL]}>{feeInfo.rule_description}</Text>
                    )}
                  </>
                ) : null}
              </View>
            )}

            {/* Liste des motifs */}
            {canCancel && (
              <>
                <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('cancellation.reason')} *</Text>
                <View style={styles.reasonsContainer}>
                  {reasonKeys.map((reasonKey) => (
                    <TouchableOpacity
                      key={reasonKey}
                      style={[
                        styles.reasonButton,
                        selectedReason === reasonKey && styles.reasonButtonSelected,
                      ]}
                      onPress={() => {
                        setSelectedReason(reasonKey);
                        hapticFeedback.light();
                      }}
                    >
                      <Text style={[
                        styles.reasonText,
                        isRTL && styles.textRTL,
                        selectedReason === reasonKey && styles.reasonTextSelected,
                      ]}>
                        {getReasonLabel(reasonKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Champ personnalise si "Autre" */}
                {selectedReason === 'other' && (
                  <TextInput
                    style={[styles.customReasonInput, isRTL && styles.inputRTL]}
                    placeholder={t('cancellation.specifyReason')}
                    placeholderTextColor={colors.gray[400]}
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                    maxLength={200}
                    textAlign={isRTL ? 'right' : 'left'}
                  />
                )}
              </>
            )}

            {/* Message si annulation impossible */}
            {!canCancel && (
              <View style={styles.cannotCancelBox}>
                <Text style={styles.cannotCancelIcon}>🚫</Text>
                <Text style={[styles.cannotCancelText, isRTL && styles.textRTL]}>
                  {t('cancellation.cannotCancelNow')}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, isRTL && styles.actionsRTL]}>
            <TouchableOpacity
              style={styles.cancelActionButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelActionText, isRTL && styles.textRTL]}>{t('cancellation.back')}</Text>
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
                  <Text style={[styles.confirmButtonText, isRTL && styles.textRTL]}>{t('cancellation.confirmCancellation')}</Text>
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
  policyBox: {
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  policyBoxRTL: {
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderRightColor: colors.warning,
  },
  policyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600' as const,
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  policyDot: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginRight: spacing.xs,
    width: 12,
  },
  policyText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    flex: 1,
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
  // RTL Styles
  containerRTL: {
    direction: 'rtl',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  warningBoxRTL: {
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderRightColor: colors.warning,
  },
  inputRTL: {
    textAlign: 'right',
  },
  actionsRTL: {
    flexDirection: 'row-reverse',
  },
});
