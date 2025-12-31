/**
 * DistanceFeeAlert - Alerte frais de deplacement
 * Affiche les frais CGU si le prestataire est a plus de 15km
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';
import { FREE_RADIUS_KM, PRICE_PER_EXTRA_KM, calculateDistanceFee } from './RadiusSelector';

interface DistanceFeeAlertProps {
  distanceKm: number;
  providerName?: string;
  compact?: boolean;
}

export default function DistanceFeeAlert({
  distanceKm,
  providerName,
  compact = false,
}: DistanceFeeAlertProps) {
  const { fee, extraKm, isInFreeRadius } = calculateDistanceFee(distanceKm);
  const [showDetails, setShowDetails] = React.useState(false);

  // Si dans le rayon gratuit, afficher un badge de confirmation
  if (isInFreeRadius) {
    if (compact) {
      return (
        <View style={styles.compactSuccess}>
          <Text style={styles.compactSuccessIcon}>✓</Text>
          <Text style={styles.compactSuccessText}>Zone gratuite</Text>
        </View>
      );
    }

    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <View style={styles.successContent}>
          <Text style={styles.successTitle}>Pas de frais de deplacement</Text>
          <Text style={styles.successText}>
            {providerName ? `${providerName} est` : 'Ce prestataire est'} a {distanceKm.toFixed(1)} km,
            dans la zone gratuite de {FREE_RADIUS_KM} km.
          </Text>
        </View>
      </View>
    );
  }

  // Mode compact
  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactWarning}
        onPress={() => setShowDetails(true)}
      >
        <Text style={styles.compactWarningIcon}>ℹ️</Text>
        <Text style={styles.compactWarningText}>+{fee} DH deplacement</Text>
        <Text style={styles.compactArrow}>›</Text>

        <Modal
          visible={showDetails}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDetails(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDetails(false)}
          >
            <View style={styles.modalContent}>
              <DistanceFeeDetails
                distanceKm={distanceKm}
                fee={fee}
                extraKm={extraKm}
                providerName={providerName}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDetails(false)}
              >
                <Text style={styles.modalCloseText}>Compris</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </TouchableOpacity>
    );
  }

  // Mode complet
  return (
    <View style={styles.warningContainer}>
      <DistanceFeeDetails
        distanceKm={distanceKm}
        fee={fee}
        extraKm={extraKm}
        providerName={providerName}
      />
    </View>
  );
}

// Composant interne pour les details des frais
function DistanceFeeDetails({
  distanceKm,
  fee,
  extraKm,
  providerName,
}: {
  distanceKm: number;
  fee: number;
  extraKm: number;
  providerName?: string;
}) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📍</Text>
        <Text style={styles.headerTitle}>Frais de deplacement</Text>
        <View style={styles.feeBadge}>
          <Text style={styles.feeBadgeText}>+{fee} DH</Text>
        </View>
      </View>

      <Text style={styles.explanation}>
        {providerName ? `${providerName} est` : 'Ce prestataire est'} a{' '}
        <Text style={styles.highlight}>{distanceKm.toFixed(1)} km</Text>,
        soit <Text style={styles.highlight}>{extraKm} km</Text> au-dela
        de la zone gratuite de {FREE_RADIUS_KM} km.
      </Text>

      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Distance totale</Text>
          <Text style={styles.breakdownValue}>{distanceKm.toFixed(1)} km</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Zone gratuite (CGU)</Text>
          <Text style={styles.breakdownValue}>{FREE_RADIUS_KM} km</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Distance supplementaire</Text>
          <Text style={styles.breakdownValueHighlight}>{extraKm} km</Text>
        </View>
        <View style={[styles.breakdownRow, styles.breakdownTotal]}>
          <Text style={styles.breakdownLabelBold}>
            Frais ({extraKm} km x {PRICE_PER_EXTRA_KM} DH)
          </Text>
          <Text style={styles.breakdownValueBold}>{fee} DH</Text>
        </View>
      </View>

      <View style={styles.cguNotice}>
        <Text style={styles.cguIcon}>📋</Text>
        <Text style={styles.cguText}>
          Ces frais sont appliques conformement a nos Conditions Generales d'Utilisation (CGU).
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Success states
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.success + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  successIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 2,
  },
  successText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    lineHeight: 18,
  },

  // Compact success
  compactSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  compactSuccessIcon: {
    fontSize: 12,
    color: colors.success,
    fontWeight: 'bold',
  },
  compactSuccessText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: '600',
  },

  // Compact warning
  compactWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  compactWarningIcon: {
    fontSize: 12,
  },
  compactWarningText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    fontWeight: '600',
    flex: 1,
  },
  compactArrow: {
    fontSize: typography.fontSize.base,
    color: colors.warning,
    fontWeight: 'bold',
  },

  // Warning container
  warningContainer: {
    backgroundColor: colors.warning + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },
  feeBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  feeBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
    color: colors.white,
  },

  // Explanation
  explanation: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  highlight: {
    fontWeight: '600',
    color: colors.gray[900],
  },

  // Breakdown
  breakdown: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  breakdownLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  breakdownValue: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
  },
  breakdownValueHighlight: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: '600',
  },
  breakdownLabelBold: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
  },
  breakdownValueBold: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.warning,
  },

  // CGU notice
  cguNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray[100],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  cguIcon: {
    fontSize: 14,
  },
  cguText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    flex: 1,
    lineHeight: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...shadows.lg,
  },
  modalCloseButton: {
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalCloseText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[700],
  },
});
