/**
 * Test Complet - GlamGo Mobile
 * Interface pour lancer l'agent de test complet
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createTestAgent, TestResult, TestReport } from '../src/lib/utils/testAgent';

// Colors
const colors = {
  primary: '#E63946',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    900: '#111827',
  },
  white: '#FFFFFF',
};

// Status colors
const statusColors: Record<string, string> = {
  pending: colors.gray[500],
  running: colors.info,
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  skipped: colors.gray[500],
};

// Status icons
const statusIcons: Record<string, string> = {
  pending: '○',
  running: '◉',
  success: '✓',
  error: '✗',
  warning: '⚠',
  skipped: '⏭',
};

export default function TestFullScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [report, setReport] = useState<TestReport | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>('');

  const handleProgress = (result: TestResult) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.id === result.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });
    setCurrentCategory(result.category);

    // Auto-scroll
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setReport(null);
    setCurrentCategory('');

    try {
      const agent = createTestAgent({
        verbose: true,
        onProgress: handleProgress,
      });

      const testReport = await agent.runAllTests();
      setReport(testReport);
    } catch (error) {
      console.error('Test agent error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  const renderStatusBadge = (status: string) => (
    <View style={[styles.statusBadge, { backgroundColor: statusColors[status] + '20' }]}>
      <Text style={[styles.statusIcon, { color: statusColors[status] }]}>
        {statusIcons[status]}
      </Text>
      {status === 'running' && (
        <ActivityIndicator size="small" color={statusColors[status]} style={{ marginLeft: 4 }} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Agent de Test Complet</Text>
        <Text style={styles.subtitle}>
          Teste toutes les fonctionnalités Mobile ↔ Backend
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🧪 Tests inclus</Text>
          <Text style={styles.infoText}>
            • Auth: Register, Login, Profile, Logout{'\n'}
            • Services: Liste, Détail, Recherche{'\n'}
            • Catégories: Liste complète{'\n'}
            • Prestataires: Liste, Proximité{'\n'}
            • Réservations: Liste, Création{'\n'}
            • Favoris: Add/Remove/Toggle{'\n'}
            • Validation: Compatibilité structures
          </Text>
        </View>

        {/* Run Button */}
        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <View style={styles.runningContainer}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.runButtonText}>
                {currentCategory ? `Test: ${currentCategory}...` : 'Initialisation...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.runButtonText}>▶ Lancer les tests complets</Text>
          )}
        </TouchableOpacity>

        {/* Results by Category */}
        {Object.entries(groupedResults).map(([category, categoryResults]) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.categoryCount}>
                {categoryResults.filter(r => r.status === 'success').length}/
                {categoryResults.length}
              </Text>
            </View>

            {categoryResults.map((result) => (
              <View
                key={result.id}
                style={[
                  styles.resultItem,
                  result.status === 'error' && styles.resultItemError,
                ]}
              >
                <View style={styles.resultHeader}>
                  {renderStatusBadge(result.status)}
                  <Text style={styles.resultName}>{result.name}</Text>
                  {result.duration && (
                    <Text style={styles.resultDuration}>{result.duration}ms</Text>
                  )}
                </View>

                {result.message && (
                  <Text
                    style={[
                      styles.resultMessage,
                      result.status === 'error' && styles.errorText,
                      result.status === 'success' && styles.successText,
                    ]}
                  >
                    {result.message}
                  </Text>
                )}

                {result.data && result.status === 'error' && (
                  <View style={styles.dataBox}>
                    <Text style={styles.dataText}>
                      {JSON.stringify(result.data, null, 2).slice(0, 500)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Final Report */}
        {report && (
          <View style={[
            styles.reportBox,
            report.failed === 0 ? styles.reportSuccess : styles.reportError,
          ]}>
            <Text style={styles.reportTitle}>
              {report.failed === 0 ? '✅ TESTS RÉUSSIS' : '❌ TESTS ÉCHOUÉS'}
            </Text>

            <View style={styles.reportStats}>
              <View style={styles.reportStat}>
                <Text style={styles.reportStatValue}>{report.passed}</Text>
                <Text style={styles.reportStatLabel}>Réussis</Text>
              </View>
              <View style={styles.reportStat}>
                <Text style={[styles.reportStatValue, { color: colors.error }]}>
                  {report.failed}
                </Text>
                <Text style={styles.reportStatLabel}>Échoués</Text>
              </View>
              <View style={styles.reportStat}>
                <Text style={styles.reportStatValue}>{report.skipped}</Text>
                <Text style={styles.reportStatLabel}>Ignorés</Text>
              </View>
              <View style={styles.reportStat}>
                <Text style={styles.reportStatValue}>
                  {(report.duration / 1000).toFixed(1)}s
                </Text>
                <Text style={styles.reportStatLabel}>Durée</Text>
              </View>
            </View>

            {report.failed > 0 && (
              <View style={styles.failedList}>
                <Text style={styles.failedTitle}>Tests échoués:</Text>
                {report.results
                  .filter(r => r.status === 'error')
                  .map(r => (
                    <Text key={r.id} style={styles.failedItem}>
                      • {r.name}: {r.message}
                    </Text>
                  ))
                }
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backBtn: {
    marginBottom: 10,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
    fontSize: 16,
  },
  infoText: {
    color: '#1E40AF',
    fontSize: 13,
    lineHeight: 20,
  },
  runButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  runButtonDisabled: {
    opacity: 0.8,
  },
  runningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  runButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  categoryCount: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '600',
  },
  resultItem: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  resultItemError: {
    borderColor: colors.error + '40',
    backgroundColor: colors.error + '05',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginLeft: 10,
  },
  resultDuration: {
    fontSize: 12,
    color: colors.gray[500],
  },
  resultMessage: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 6,
    marginLeft: 38,
  },
  successText: {
    color: colors.success,
  },
  errorText: {
    color: colors.error,
  },
  dataBox: {
    backgroundColor: colors.gray[50],
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginLeft: 38,
  },
  dataText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.gray[700],
  },
  reportBox: {
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
  },
  reportSuccess: {
    backgroundColor: colors.success + '15',
    borderWidth: 2,
    borderColor: colors.success,
  },
  reportError: {
    backgroundColor: colors.error + '15',
    borderWidth: 2,
    borderColor: colors.error,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reportStat: {
    alignItems: 'center',
  },
  reportStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  reportStatLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 2,
  },
  failedList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.error + '30',
  },
  failedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 8,
  },
  failedItem: {
    fontSize: 13,
    color: colors.gray[700],
    marginBottom: 4,
  },
});
