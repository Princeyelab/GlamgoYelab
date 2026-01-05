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
} from 'react-native';
import * as Location from 'expo-location';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { hapticFeedback } from '../../lib/utils/haptics';
import apiClient from '../../lib/api/client';

// Numeros d'urgence Maroc
const EMERGENCY_NUMBERS = {
  police: { number: '19', label: 'Police', icon: '👮' },
  european: { number: '112', label: 'Urgences EU', icon: '🆘' },
  pompiers: { number: '15', label: 'Pompiers/SAMU', icon: '🚑' },
  gendarmerie: { number: '177', label: 'Gendarmerie', icon: '🛡️' },
};

const EMERGENCY_REASONS = [
  { id: 'behavior', label: 'Comportement inapproprie', icon: '⚠️' },
  { id: 'safety', label: 'Je me sens en danger', icon: '🚨' },
  { id: 'service_issue', label: 'Probleme avec le service', icon: '❌' },
  { id: 'fraud', label: 'Tentative de fraude', icon: '🚫' },
  { id: 'other', label: 'Autre probleme', icon: '📞' },
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
      Alert.alert('Erreur', `Impossible d'appeler le ${number}`);
    });
  };

  // Partager la localisation
  const handleShareLocation = async () => {
    setSharingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusee', 'Activez la localisation pour partager votre position.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

      Alert.alert(
        'Position partagee',
        `Latitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}`,
        [
          { text: 'OK' },
          {
            text: 'Ouvrir Maps',
            onPress: () => Linking.openURL(mapsUrl)
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de recuperer votre position.');
    } finally {
      setSharingLocation(false);
    }
  };

  // Envoyer le signalement
  const handleSubmitEmergency = async () => {
    if (!selectedReason) {
      Alert.alert('Attention', 'Veuillez selectionner un motif.');
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
        Alert.alert('Erreur', response.data?.message || 'Erreur lors de l\'envoi du signalement.');
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message;

      if (status === 409) {
        // Already has an active report
        Alert.alert(
          'Signalement deja envoye',
          'Un signalement est deja en cours pour cette commande. Notre equipe vous contactera rapidement.',
          [{ text: 'OK', onPress: () => setShowModal(false) }]
        );
      } else {
        Alert.alert('Erreur', message || 'Erreur lors de l\'envoi du signalement.');
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
        style={styles.emergencyButton}
        onPress={handleOpenModal}
        activeOpacity={0.8}
      >
        <Text style={styles.emergencyIcon}>🆘</Text>
        <Text style={styles.emergencyText}>Urgence</Text>
      </TouchableOpacity>

      {/* Modal d'urgence */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {success ? (
              // Ecran de succes
              <View style={styles.successContent}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>Signalement envoye</Text>
                <Text style={styles.successMessage}>
                  Notre equipe a ete alertee et vous contactera rapidement.
                </Text>

                {notifyPolice && (
                  <View style={styles.policeAlert}>
                    <Text style={styles.policeAlertIcon}>🚨</Text>
                    <Text style={styles.policeAlertText}>
                      Alerte police notee - Contactez le 19 si necessaire
                    </Text>
                  </View>
                )}

                <View style={styles.emergencyNumbersSuccess}>
                  <Text style={styles.numbersTitle}>Numeros d'urgence :</Text>
                  <View style={styles.numbersRow}>
                    <TouchableOpacity
                      style={styles.numberButtonSmall}
                      onPress={() => handleCall('19')}
                    >
                      <Text style={styles.numberButtonIcon}>👮</Text>
                      <Text style={styles.numberButtonLabel}>Police 19</Text>
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
                  <Text style={styles.closeSuccessButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Formulaire de signalement
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.headerIcon}>🆘</Text>
                    <View>
                      <Text style={styles.modalTitle}>Urgence</Text>
                      <Text style={styles.modalSubtitle}>
                        {isProvider
                          ? `Probleme avec ${personName || 'le client'} ?`
                          : `Probleme avec ${personName || 'le prestataire'} ?`
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
                  <Text style={styles.urgentTitle}>🚨 En cas de danger immediat</Text>
                  <View style={styles.urgentButtons}>
                    {Object.entries(EMERGENCY_NUMBERS).map(([key, info]) => (
                      <TouchableOpacity
                        key={key}
                        style={styles.urgentButton}
                        onPress={() => handleCall(info.number)}
                      >
                        <Text style={styles.urgentButtonIcon}>{info.icon}</Text>
                        <Text style={styles.urgentButtonLabel}>{info.label}</Text>
                        <Text style={styles.urgentButtonNumber}>{info.number}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bouton partager localisation */}
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleShareLocation}
                  disabled={sharingLocation}
                >
                  {sharingLocation ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>Partager ma position</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou signaler un probleme</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Raisons du signalement */}
                <View style={styles.reasonsSection}>
                  <Text style={styles.sectionLabel}>Quel est le probleme ?</Text>
                  {EMERGENCY_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.reasonButton,
                        selectedReason === reason.id && styles.reasonButtonSelected,
                      ]}
                      onPress={() => setSelectedReason(reason.id)}
                      disabled={loading}
                    >
                      <Text style={styles.reasonIcon}>{reason.icon}</Text>
                      <Text style={[
                        styles.reasonLabel,
                        selectedReason === reason.id && styles.reasonLabelSelected,
                      ]}>
                        {reason.label}
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
                    style={styles.policeOption}
                    onPress={() => setNotifyPolice(!notifyPolice)}
                    disabled={loading}
                  >
                    <View style={[styles.checkbox, notifyPolice && styles.checkboxChecked]}>
                      {notifyPolice && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <View style={styles.policeOptionText}>
                      <Text style={styles.policeOptionLabel}>
                        🚔 Demander une intervention police
                      </Text>
                      <Text style={styles.policeOptionHint}>
                        La police sera alertee de votre situation
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Details supplementaires */}
                <View style={styles.additionalSection}>
                  <Text style={styles.sectionLabel}>Details (optionnel)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Decrivez la situation..."
                    placeholderTextColor={colors.gray[400]}
                    value={additionalInfo}
                    onChangeText={setAdditionalInfo}
                    maxLength={500}
                    multiline
                    numberOfLines={3}
                    editable={!loading}
                  />
                  <Text style={styles.charCount}>{additionalInfo.length}/500</Text>
                </View>

                {/* Boutons d'action */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCloseModal}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
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
                      <Text style={styles.submitButtonText}>🆘 Envoyer</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Support GlamGo */}
                <TouchableOpacity
                  style={styles.supportButton}
                  onPress={() => handleCall('+212522000000')}
                >
                  <Text style={styles.supportIcon}>📞</Text>
                  <Text style={styles.supportText}>Appeler le support GlamGo</Text>
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
});
