/**
 * EmergencyButton Component - GlamGo Mobile
 * Bouton d'urgence visible pendant une prestation en cours
 * Permet d'appeler les urgences et de signaler un probleme
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import * as Location from 'expo-location';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { hapticFeedback } from '../../lib/utils/haptics';
import apiClient from '../../lib/api/client';
import { useLanguage } from '../../contexts/LanguageContext';

// Numeros d'urgence Maroc - Keys pour traduction
const EMERGENCY_NUMBER_KEYS = {
  police: { number: '19', labelKey: 'emergency.police', icon: '👮' },
  european: { number: '112', labelKey: 'emergency.emergenciesEU', icon: '🆘' },
  pompiers: { number: '15', labelKey: 'emergency.fireSAMU', icon: '🚑' },
  gendarmerie: { number: '177', labelKey: 'emergency.gendarmerie', icon: '🛡️' },
};

// Keys pour les raisons d'urgence
const EMERGENCY_REASON_KEYS = [
  { id: 'behavior', labelKey: 'emergency.inappropriateBehavior', icon: '⚠️' },
  { id: 'safety', labelKey: 'emergency.feelInDanger', icon: '🚨' },
  { id: 'service_issue', labelKey: 'emergency.serviceIssue', icon: '❌' },
  { id: 'fraud', labelKey: 'emergency.fraudAttempt', icon: '🚫' },
  { id: 'other', labelKey: 'emergency.otherProblem', icon: '📞' },
];

interface EmergencyButtonProps {
  orderId: number;
  providerName?: string;
  clientName?: string;
  isProvider?: boolean;
  onEmergencyReported?: (data: any) => void;
}

export default function EmergencyButton({
  orderId,
  providerName,
  clientName,
  isProvider = false,
  onEmergencyReported,
}: EmergencyButtonProps) {
  const { t, isRTL } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [notifyPolice, setNotifyPolice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);

  const handleOpenModal = () => {
    hapticFeedback.warning();
    setShowModal(true);
    setSelectedReason(null);
    setAdditionalInfo('');
    setNotifyPolice(false);
    setSuccess(false);
  };

  const handleCloseModal = () => {
    if (!loading) {
      setShowModal(false);
    }
  };

  // Appeler un numero d'urgence
  const handleCall = (number: string) => {
    hapticFeedback.heavy();
    const phoneUrl = Platform.OS === 'ios' ? `telprompt:${number}` : `tel:${number}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert(t('common.error'), t('emergency.errorCalling', { number }));
    });
  };

  // Partager la localisation
  const handleShareLocation = async () => {
    setSharingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('emergency.permissionDenied'), t('emergency.permissionDenied'));
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

      Alert.alert(
        t('emergency.positionShared'),
        `Latitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}`,
        [
          { text: t('common.ok') },
          {
            text: t('emergency.openMaps'),
            onPress: () => Linking.openURL(mapsUrl)
          },
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('emergency.unableToGetLocation'));
    } finally {
      setSharingLocation(false);
    }
  };

  // Envoyer le signalement
  const handleSubmitEmergency = async () => {
    if (!selectedReason) {
      Alert.alert(t('common.error'), t('emergency.selectReason'));
      return;
    }

    setLoading(true);

    try {
      // Recuperer la position si possible
      let location = null;
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        }
      } catch {}

      const response = await apiClient.post(`/api/orders/${orderId}/emergency`, {
        reason: selectedReason,
        additional_info: additionalInfo.trim(),
        notify_police: notifyPolice,
        client_latitude: location?.latitude,
        client_longitude: location?.longitude,
      });

      if (response.data?.success) {
        setSuccess(true);
        hapticFeedback.success();
        onEmergencyReported?.(response.data);
      } else {
        Alert.alert(t('common.error'), response.data?.message || t('emergency.errorSending'));
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message;

      if (status === 409) {
        // Already has an active report
        Alert.alert(
          t('emergency.reportAlreadySent'),
          t('emergency.reportInProgress'),
          [{ text: t('common.ok'), onPress: () => setShowModal(false) }]
        );
      } else {
        Alert.alert(t('common.error'), message || t('emergency.errorSending'));
      }
    } finally {
      setLoading(false);
    }
  };

  const personName = isProvider ? clientName : providerName;

  return (
    <>
      {/* Bouton d'urgence flottant */}
      <TouchableOpacity
        style={[styles.emergencyButton, isRTL && styles.emergencyButtonRTL]}
        onPress={handleOpenModal}
        activeOpacity={0.8}
      >
        <Text style={styles.emergencyIcon}>🆘</Text>
        <Text style={styles.emergencyText}>{t('emergency.buttonText')}</Text>
      </TouchableOpacity>

      {/* Modal d'urgence */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isRTL && styles.modalContentRTL]}>
            {success ? (
              // Ecran de succes
              <View style={styles.successContent}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={[styles.successTitle, isRTL && styles.textRTL]}>{t('emergency.reportSent')}</Text>
                <Text style={[styles.successMessage, isRTL && styles.textRTL]}>
                  {t('emergency.teamAlerted')}
                </Text>

                {notifyPolice && (
                  <View style={[styles.policeAlert, isRTL && styles.policeAlertRTL]}>
                    <Text style={styles.policeAlertIcon}>🚨</Text>
                    <Text style={[styles.policeAlertText, isRTL && styles.textRTL]}>
                      {t('emergency.policeAlertNoted')}
                    </Text>
                  </View>
                )}

                <View style={styles.emergencyNumbersSuccess}>
                  <Text style={[styles.numbersTitle, isRTL && styles.textRTL]}>{t('emergency.emergencyNumbers')}</Text>
                  <View style={[styles.numbersRow, isRTL && styles.numbersRowRTL]}>
                    <TouchableOpacity
                      style={styles.numberButtonSmall}
                      onPress={() => handleCall('19')}
                    >
                      <Text style={styles.numberButtonIcon}>👮</Text>
                      <Text style={styles.numberButtonLabel}>{t('emergency.police')} 19</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.numberButtonSmall}
                      onPress={() => handleCall('15')}
                    >
                      <Text style={styles.numberButtonIcon}>🚑</Text>
                      <Text style={styles.numberButtonLabel}>SAMU 15</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeSuccessButton}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.closeSuccessButtonText}>{t('modals.close')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Formulaire de signalement
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
                  <View style={[styles.headerLeft, isRTL && styles.headerLeftRTL]}>
                    <Text style={styles.headerIcon}>🆘</Text>
                    <View>
                      <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>{t('emergency.title')}</Text>
                      <Text style={[styles.modalSubtitle, isRTL && styles.textRTL]}>
                        {isProvider
                          ? t('emergency.problemWithClient', { name: personName || t('common.client') })
                          : t('emergency.problemWithProvider', { name: personName || t('common.provider') })
                        }
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleCloseModal}
                    disabled={loading}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Section appels d'urgence */}
                <View style={styles.urgentSection}>
                  <Text style={[styles.urgentTitle, isRTL && styles.textRTL]}>🚨 {t('emergency.immediateHelp')}</Text>
                  <View style={[styles.urgentButtons, isRTL && styles.urgentButtonsRTL]}>
                    {Object.entries(EMERGENCY_NUMBER_KEYS).map(([key, info]) => (
                      <TouchableOpacity
                        key={key}
                        style={styles.urgentButton}
                        onPress={() => handleCall(info.number)}
                      >
                        <Text style={styles.urgentButtonIcon}>{info.icon}</Text>
                        <Text style={styles.urgentButtonLabel}>{t(info.labelKey)}</Text>
                        <Text style={styles.urgentButtonNumber}>{info.number}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bouton partager localisation */}
                <TouchableOpacity
                  style={[styles.locationButton, isRTL && styles.locationButtonRTL]}
                  onPress={handleShareLocation}
                  disabled={sharingLocation}
                >
                  {sharingLocation ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>{t('emergency.shareMyLocation')}</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t('emergency.orReportProblem')}</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Raisons du signalement */}
                <View style={styles.reasonsSection}>
                  <Text style={[styles.sectionLabel, isRTL && styles.textRTL]}>{t('emergency.whatIsTheProblem')}</Text>
                  {EMERGENCY_REASON_KEYS.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reasonButton,
                        isRTL && styles.reasonButtonRTL,
                        selectedReason === reason.id && styles.reasonButtonSelected,
                      ]}
                      onPress={() => setSelectedReason(reason.id)}
                      disabled={loading}
                    >
                      <Text style={[styles.reasonIcon, isRTL && styles.reasonIconRTL]}>{reason.icon}</Text>
                      <Text style={[
                        styles.reasonLabel,
                        isRTL && styles.textRTL,
                        selectedReason === reason.id && styles.reasonLabelSelected,
                      ]}>
                        {t(reason.labelKey)}
                      </Text>
                      {selectedReason === reason.id && (
                        <Text style={styles.reasonCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Option alerte police */}
                {(selectedReason === 'safety' || selectedReason === 'fraud') && (
                  <TouchableOpacity
                    style={[styles.policeOption, isRTL && styles.policeOptionRTL]}
                    onPress={() => setNotifyPolice(!notifyPolice)}
                    disabled={loading}
                  >
                    <View style={[styles.checkbox, notifyPolice && styles.checkboxChecked]}>
                      {notifyPolice && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <View style={styles.policeOptionText}>
                      <Text style={[styles.policeOptionLabel, isRTL && styles.textRTL]}>
                        🚔 {t('emergency.requestPoliceIntervention')}
                      </Text>
                      <Text style={[styles.policeOptionHint, isRTL && styles.textRTL]}>
                        {t('emergency.policeWillBeAlerted')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Details supplementaires */}
                <View style={styles.additionalSection}>
                  <Text style={[styles.sectionLabel, isRTL && styles.textRTL]}>{t('emergency.detailsOptional')}</Text>
                  <TextInput
                    style={[styles.textInput, isRTL && styles.inputRTL]}
                    placeholder={t('emergency.describeSituation')}
                    placeholderTextColor={colors.gray[400]}
                    value={additionalInfo}
                    onChangeText={setAdditionalInfo}
                    maxLength={500}
                    multiline
                    numberOfLines={3}
                    editable={!loading}
                    textAlign={isRTL ? 'right' : 'left'}
                  />
                  <Text style={[styles.charCount, isRTL && styles.charCountRTL]}>{additionalInfo.length}/500</Text>
                </View>

                {/* Boutons d'action */}
                <View style={[styles.actionButtons, isRTL && styles.actionButtonsRTL]}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCloseModal}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!selectedReason || loading) && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmitEmergency}
                    disabled={!selectedReason || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>🆘 {t('emergency.send')}</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Support GlamGo */}
                <TouchableOpacity
                  style={[styles.supportButton, isRTL && styles.supportButtonRTL]}
                  onPress={() => handleCall('+212522000000')}
                >
                  <Text style={styles.supportIcon}>📞</Text>
                  <Text style={styles.supportText}>{t('emergency.callGlamGoSupport')}</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Bouton flottant - Plus visible
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    gap: 6,
    ...shadows.lg,
    borderWidth: 2,
    borderColor: colors.white,
  },
  emergencyIcon: {
    fontSize: 18,
  },
  emergencyText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    padding: spacing.lg,
  },

  // Header
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.error,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: 'bold',
  },

  // Section urgence
  urgentSection: {
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  urgentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  urgentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  urgentButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  urgentButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  urgentButtonLabel: {
    fontSize: 11,
    color: colors.gray[600],
  },
  urgentButtonNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },

  // Bouton localisation
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  locationIcon: {
    fontSize: 20,
  },
  locationText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.primary,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // Section raisons
  reasonsSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonButtonSelected: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  reasonIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  reasonLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  reasonLabelSelected: {
    color: colors.error,
    fontWeight: '600',
  },
  reasonCheck: {
    fontSize: 18,
    color: colors.error,
    fontWeight: 'bold',
  },

  // Option police
  policeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  policeOptionText: {
    flex: 1,
  },
  policeOptionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  policeOptionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginTop: 2,
  },

  // Section details
  additionalSection: {
    marginBottom: spacing.md,
  },
  textInput: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    textAlign: 'right',
    marginTop: 4,
  },

  // Boutons d'action
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[600],
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.white,
  },

  // Support
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  supportIcon: {
    fontSize: 18,
  },
  supportText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: '500',
  },

  // Succes
  successContent: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  policeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  policeAlertIcon: {
    fontSize: 24,
  },
  policeAlertText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: '500',
  },
  emergencyNumbersSuccess: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  numbersTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  numberButtonSmall: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    minWidth: 100,
  },
  numberButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  numberButtonLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
  },
  closeSuccessButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
  },
  closeSuccessButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[700],
  },
  // RTL Styles
  emergencyButtonRTL: {
    flexDirection: 'row-reverse',
  },
  modalContentRTL: {
    direction: 'rtl',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  modalHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  headerLeftRTL: {
    flexDirection: 'row-reverse',
  },
  urgentButtonsRTL: {
    flexDirection: 'row-reverse',
  },
  locationButtonRTL: {
    flexDirection: 'row-reverse',
  },
  reasonButtonRTL: {
    flexDirection: 'row-reverse',
  },
  reasonIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  policeOptionRTL: {
    flexDirection: 'row-reverse',
  },
  policeAlertRTL: {
    flexDirection: 'row-reverse',
  },
  inputRTL: {
    textAlign: 'right',
  },
  charCountRTL: {
    textAlign: 'left',
  },
  actionButtonsRTL: {
    flexDirection: 'row-reverse',
  },
  supportButtonRTL: {
    flexDirection: 'row-reverse',
  },
  numbersRowRTL: {
    flexDirection: 'row-reverse',
  },
});
