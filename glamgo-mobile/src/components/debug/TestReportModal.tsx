/**
 * Test Report Modal - GlamGo Mobile
 * Affiche le rapport des tests API avec statuts detailles
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';
import { TestReport, TestResult } from '../../lib/testing/testAgent';

interface TestReportModalProps {
  visible: boolean;
  report: TestReport | null;
  onClose: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TestReportModal({
  visible,
  report,
  onClose,
  onContinue,
  onRetry,
}: TestReportModalProps) {
  if (!report) return null;

  const passRate = Math.round((report.passed / report.totalTests) * 100);
  const canContinue = report.failed === 0;

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return colors.success;
      case 'warning': return '#F59E0B';
      case 'failed': return colors.error;
      case 'skipped': return colors.gray[400];
      default: return colors.gray[600];
    }
  };

  const getAPIStatusDisplay = () => {
    switch (report.apiStatus) {
      case 'online':
        return { icon: '🟢', text: 'En ligne', color: colors.success };
      case 'degraded':
        return { icon: '🟡', text: 'Degrade', color: '#F59E0B' };
      case 'offline':
        return { icon: '🔴', text: 'Hors ligne', color: colors.error };
    }
  };

  const apiStatus = getAPIStatusDisplay();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🧪 Rapport Tests API</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* API Status */}
            <View style={[styles.apiStatusBanner, { backgroundColor: `${apiStatus.color}15` }]}>
              <Text style={styles.apiStatusIcon}>{apiStatus.icon}</Text>
              <Text style={[styles.apiStatusText, { color: apiStatus.color }]}>
                API {apiStatus.text}
              </Text>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{report.totalTests}</Text>
                <Text style={styles.summaryLabel}>Tests</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {report.passed}
                </Text>
                <Text style={styles.summaryLabel}>Reussis</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: colors.error }]}>
                  {report.failed}
                </Text>
                <Text style={styles.summaryLabel}>Echoues</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                  {report.warnings}
                </Text>
                <Text style={styles.summaryLabel}>Alertes</Text>
              </View>
            </View>

            {/* Pass Rate */}
            <View style={styles.passRateContainer}>
              <View style={styles.passRateBar}>
                <View
                  style={[
                    styles.passRateFill,
                    {
                      width: `${passRate}%`,
                      backgroundColor: canContinue ? colors.success : colors.error,
                    },
                  ]}
                />
              </View>
              <Text style={styles.passRateText}>
                {passRate}% de reussite
              </Text>
            </View>

            {/* Duration */}
            <Text style={styles.duration}>
              ⏱️ Duree totale : {(report.duration / 1000).toFixed(2)}s
            </Text>

            {/* Results List */}
            <View style={styles.resultsList}>
              <Text style={styles.resultsTitle}>Details des tests</Text>
              {report.results.map((result, index) => (
                <View
                  key={index}
                  style={[
                    styles.resultItem,
                    { borderLeftColor: getStatusColor(result.status) },
                  ]}
                >
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <Text style={styles.resultDuration}>{result.duration}ms</Text>
                  </View>
                  {result.message && (
                    <Text style={styles.resultMessage}>{result.message}</Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {canContinue ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.continueButton]}
                onPress={onContinue}
              >
                <Text style={styles.actionButtonText}>✅ Continuer vers l'app</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.retryButton]}
                  onPress={onRetry}
                >
                  <Text style={styles.actionButtonText}>🔄 Reessayer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.offlineButton]}
                  onPress={onContinue}
                >
                  <Text style={[styles.actionButtonText, { color: colors.gray[700] }]}>
                    Mode hors ligne
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Error Hint */}
          {!canContinue && (
            <Text style={styles.errorHint}>
              ⚠️ Certains tests ont echoue. Verifiez votre connexion internet.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: 34, // Safe area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
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
  closeText: {
    fontSize: 18,
    color: colors.gray[600],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  apiStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  apiStatusIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  apiStatusText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    marginHorizontal: 4,
  },
  summaryValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginTop: 2,
  },
  passRateContainer: {
    marginBottom: spacing.md,
  },
  passRateBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  passRateFill: {
    height: '100%',
    borderRadius: 4,
  },
  passRateText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
  },
  duration: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  resultsList: {
    marginBottom: spacing.lg,
  },
  resultsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  resultItem: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  resultName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
  },
  resultDuration: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  resultMessage: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    marginTop: spacing.xs,
    marginLeft: 28,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: colors.success,
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  offlineButton: {
    backgroundColor: colors.gray[100],
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
});
