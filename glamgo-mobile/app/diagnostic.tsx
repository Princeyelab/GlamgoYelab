/**
 * Écran de Diagnostic API - GlamGo Mobile
 * Tests automatiques de tous les endpoints critiques avant production
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// Note: expo-clipboard non installé, on utilise Share pour le rapport

// Import API
import apiClient, { API_BASE_URL, getToken, isAuthenticated } from '../src/lib/api/client';
import { ENDPOINTS } from '../src/lib/api/endpoints';

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
    600: '#4B5563',
    900: '#111827',
  },
  white: '#FFFFFF',
};

// Types
type TestStatus = 'pending' | 'loading' | 'success' | 'error' | 'warning' | 'skipped';

interface TestResult {
  id: string;
  name: string;
  category: string;
  status: TestStatus;
  message?: string;
  latency?: number;
  data?: any;
}

interface TestCategory {
  id: string;
  name: string;
  icon: string;
  tests: TestResult[];
}

// Définition des tests
const TEST_DEFINITIONS = {
  connection: [
    { id: 'api_accessible', name: 'API accessible', endpoint: '/api/categories', method: 'GET' },
  ],
  auth: [
    { id: 'auth_me', name: 'Get current user', endpoint: ENDPOINTS.AUTH.ME, method: 'GET', requiresAuth: true },
    { id: 'auth_login_endpoint', name: 'Login endpoint', endpoint: ENDPOINTS.AUTH.LOGIN, method: 'POST', testPayload: { email: 'test@test.com', password: 'wrong' }, expectError: [401, 422] },
  ],
  services: [
    { id: 'categories_list', name: 'Liste catégories', endpoint: ENDPOINTS.CATEGORIES.LIST, method: 'GET' },
    { id: 'services_list', name: 'Liste services', endpoint: ENDPOINTS.SERVICES.LIST, method: 'GET' },
    { id: 'services_featured', name: 'Services featured', endpoint: ENDPOINTS.SERVICES.FEATURED, method: 'GET' },
  ],
  providers: [
    { id: 'providers_list', name: 'Liste providers', endpoint: ENDPOINTS.PROVIDERS.LIST, method: 'GET' },
    { id: 'providers_nearby', name: 'Providers nearby', endpoint: ENDPOINTS.PROVIDERS.NEARBY, method: 'GET', params: { latitude: 33.5731, longitude: -7.5898, radius: 50 } },
  ],
  bookings: [
    { id: 'orders_list', name: 'Liste commandes', endpoint: ENDPOINTS.BOOKINGS.LIST, method: 'GET', requiresAuth: true },
  ],
  favorites: [
    { id: 'favorites_list', name: 'Liste favoris', endpoint: ENDPOINTS.FAVORITES.LIST, method: 'GET', requiresAuth: true },
  ],
  chat: [
    { id: 'chat_conversations', name: 'Conversations', endpoint: ENDPOINTS.CHAT.CONVERSATIONS, method: 'GET', requiresAuth: true },
  ],
  notifications: [
    { id: 'notifications_list', name: 'Liste notifications', endpoint: ENDPOINTS.NOTIFICATIONS.LIST, method: 'GET', requiresAuth: true },
    { id: 'notifications_unread', name: 'Unread count', endpoint: ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, method: 'GET', requiresAuth: true },
  ],
  provider_api: [
    { id: 'provider_profile', name: 'Provider profile', endpoint: ENDPOINTS.PROVIDER.PROFILE, method: 'GET', requiresAuth: true, providerOnly: true },
    { id: 'provider_orders', name: 'Provider orders', endpoint: ENDPOINTS.PROVIDER.ORDERS, method: 'GET', requiresAuth: true, providerOnly: true },
    { id: 'provider_earnings', name: 'Provider earnings', endpoint: '/api/provider/earnings/week', method: 'GET', requiresAuth: true, providerOnly: true },
    { id: 'provider_withdraw', name: 'Withdraw endpoint', endpoint: ENDPOINTS.PROVIDER.WITHDRAW, method: 'POST', requiresAuth: true, providerOnly: true, testPayload: { amount: 0 }, checkImplemented: true },
  ],
};

export default function DiagnosticScreen() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0, skipped: 0 });
  const [userInfo, setUserInfo] = useState<{ isAuth: boolean; isProvider: boolean }>({ isAuth: false, isProvider: false });
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Initialiser les catégories
  const initCategories = (): TestCategory[] => [
    { id: 'connection', name: 'Connexion API', icon: '📡', tests: [] },
    { id: 'auth', name: 'Authentification', icon: '🔐', tests: [] },
    { id: 'services', name: 'Services & Catégories', icon: '📦', tests: [] },
    { id: 'providers', name: 'Providers', icon: '👤', tests: [] },
    { id: 'bookings', name: 'Bookings', icon: '📅', tests: [] },
    { id: 'favorites', name: 'Favoris', icon: '❤️', tests: [] },
    { id: 'chat', name: 'Chat', icon: '💬', tests: [] },
    { id: 'notifications', name: 'Notifications', icon: '🔔', tests: [] },
    { id: 'provider_api', name: 'Provider API', icon: '👨‍💼', tests: [] },
  ];

  // Mettre à jour un test
  const updateTest = (categoryId: string, testId: string, update: Partial<TestResult>) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          tests: cat.tests.map(test =>
            test.id === testId ? { ...test, ...update } : test
          ),
        };
      }
      return cat;
    }));
  };

  // Ajouter un test
  const addTest = (categoryId: string, test: TestResult) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, tests: [...cat.tests, test] };
      }
      return cat;
    }));
  };

  // Exécuter un test
  const runTest = async (
    categoryId: string,
    testDef: any,
    isAuth: boolean,
    isProvider: boolean
  ): Promise<TestResult> => {
    const testId = testDef.id;
    const testName = testDef.name;

    // Vérifier si le test doit être skippé
    if (testDef.requiresAuth && !isAuth) {
      return {
        id: testId,
        name: testName,
        category: categoryId,
        status: 'skipped',
        message: 'Requiert authentification',
      };
    }

    if (testDef.providerOnly && !isProvider) {
      return {
        id: testId,
        name: testName,
        category: categoryId,
        status: 'skipped',
        message: 'Provider uniquement',
      };
    }

    // Initialiser le test
    addTest(categoryId, {
      id: testId,
      name: testName,
      category: categoryId,
      status: 'loading',
    });

    const startTime = Date.now();

    try {
      let response;
      const config: any = {};

      if (testDef.params) {
        config.params = testDef.params;
      }

      if (testDef.method === 'GET') {
        response = await apiClient.get(testDef.endpoint, config);
      } else if (testDef.method === 'POST') {
        response = await apiClient.post(testDef.endpoint, testDef.testPayload || {}, config);
      }

      const latency = Date.now() - startTime;

      // Succès
      const result: TestResult = {
        id: testId,
        name: testName,
        category: categoryId,
        status: 'success',
        latency,
        message: formatSuccessMessage(response),
      };

      updateTest(categoryId, testId, result);
      return result;

    } catch (error: any) {
      const latency = Date.now() - startTime;

      // Vérifier si l'erreur est attendue
      if (testDef.expectError && testDef.expectError.includes(error.response?.status)) {
        const result: TestResult = {
          id: testId,
          name: testName,
          category: categoryId,
          status: 'success',
          latency,
          message: `Endpoint OK (${error.response.status} attendu)`,
        };
        updateTest(categoryId, testId, result);
        return result;
      }

      // Vérifier si on teste l'implémentation
      if (testDef.checkImplemented && error.response?.status === 404) {
        const result: TestResult = {
          id: testId,
          name: testName,
          category: categoryId,
          status: 'error',
          latency,
          message: 'NOT IMPLEMENTED (404)',
        };
        updateTest(categoryId, testId, result);
        return result;
      }

      // Si API répond avec un code d'erreur
      if (error.response) {
        const status = error.response.status;

        // 401/403 sans auth = normal
        if ((status === 401 || status === 403) && testDef.requiresAuth) {
          const result: TestResult = {
            id: testId,
            name: testName,
            category: categoryId,
            status: 'warning',
            latency,
            message: `Auth requise (${status})`,
          };
          updateTest(categoryId, testId, result);
          return result;
        }

        const result: TestResult = {
          id: testId,
          name: testName,
          category: categoryId,
          status: 'error',
          latency,
          message: `Erreur ${status}: ${error.response.data?.message || 'Unknown'}`,
        };
        updateTest(categoryId, testId, result);
        return result;
      }

      // Erreur réseau
      const result: TestResult = {
        id: testId,
        name: testName,
        category: categoryId,
        status: 'error',
        message: error.message || 'Erreur réseau',
      };
      updateTest(categoryId, testId, result);
      return result;
    }
  };

  // Formater le message de succès
  const formatSuccessMessage = (response: any): string => {
    const data = response.data;

    if (Array.isArray(data)) {
      return `${data.length} éléments`;
    }
    if (data?.data && Array.isArray(data.data)) {
      return `${data.data.length} éléments${data.meta?.total ? ` (total: ${data.meta.total})` : ''}`;
    }
    if (data?.id || data?.user?.id) {
      return 'Objet récupéré';
    }
    if (data?.count !== undefined) {
      return `Count: ${data.count}`;
    }
    if (data?.unread_count !== undefined) {
      return `Unread: ${data.unread_count}`;
    }
    return 'OK';
  };

  // Lancer tous les tests
  const runAllTests = async () => {
    setIsRunning(true);
    setStartTime(new Date());
    const cats = initCategories();
    setCategories(cats);

    // Vérifier l'authentification
    const isAuth = await isAuthenticated();
    let isProvider = false;

    if (isAuth) {
      try {
        const response = await apiClient.get(ENDPOINTS.AUTH.ME);
        isProvider = response.data?.user?.account_type === 'provider' ||
                     response.data?.data?.user?.account_type === 'provider' ||
                     response.data?.account_type === 'provider';
      } catch (e) {
        // Pas provider
      }
    }

    setUserInfo({ isAuth, isProvider });

    const results: TestResult[] = [];

    // Exécuter les tests par catégorie
    for (const [categoryId, tests] of Object.entries(TEST_DEFINITIONS)) {
      for (const testDef of tests) {
        const result = await runTest(categoryId, testDef, isAuth, isProvider);
        results.push(result);
        // Petit délai pour l'UX
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // Calculer le résumé
    const passed = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skipped' || r.status === 'warning').length;

    setSummary({
      total: results.length,
      passed,
      failed,
      skipped,
    });

    setIsRunning(false);
  };

  // Générer le rapport texte
  const generateReport = (): string => {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════');
    lines.push('  DIAGNOSTIC GLAMGO MOBILE');
    lines.push('═══════════════════════════════════════');
    lines.push(`Date: ${startTime?.toLocaleString() || new Date().toLocaleString()}`);
    lines.push(`API: ${API_BASE_URL}`);
    lines.push(`Auth: ${userInfo.isAuth ? 'Oui' : 'Non'} | Provider: ${userInfo.isProvider ? 'Oui' : 'Non'}`);
    lines.push('');
    lines.push(`RÉSULTAT: ${summary.passed}/${summary.total} tests OK (${Math.round(summary.passed / summary.total * 100)}%)`);
    lines.push(`  ✅ Passed: ${summary.passed}`);
    lines.push(`  ❌ Failed: ${summary.failed}`);
    lines.push(`  ⏭️  Skipped: ${summary.skipped}`);
    lines.push('');
    lines.push('───────────────────────────────────────');
    lines.push('DÉTAILS PAR CATÉGORIE');
    lines.push('───────────────────────────────────────');

    categories.forEach(cat => {
      if (cat.tests.length > 0) {
        lines.push('');
        lines.push(`${cat.icon} ${cat.name.toUpperCase()}`);
        cat.tests.forEach(test => {
          const icon = test.status === 'success' ? '✅' :
                       test.status === 'error' ? '❌' :
                       test.status === 'warning' ? '⚠️' : '⏭️';
          const latency = test.latency ? ` (${test.latency}ms)` : '';
          lines.push(`  ${icon} ${test.name}${latency}`);
          if (test.message) {
            lines.push(`     → ${test.message}`);
          }
        });
      }
    });

    lines.push('');
    lines.push('═══════════════════════════════════════');
    lines.push('Généré par GlamGo Mobile Diagnostic');

    return lines.join('\n');
  };

  // Afficher le rapport complet
  const showFullReport = () => {
    const report = generateReport();
    Alert.alert(
      'Rapport Diagnostic',
      report.substring(0, 1000) + (report.length > 1000 ? '\n\n... (Utilisez Partager pour voir le rapport complet)' : ''),
      [
        { text: 'Fermer', style: 'cancel' },
        { text: 'Partager', onPress: shareReport },
      ]
    );
  };

  // Partager le rapport
  const shareReport = async () => {
    const report = generateReport();
    try {
      await Share.share({
        message: report,
        title: 'Diagnostic GlamGo Mobile',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Render status icon
  const renderStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'loading':
        return <ActivityIndicator size="small" color={colors.primary} />;
      case 'success':
        return <Text style={styles.iconSuccess}>✓</Text>;
      case 'error':
        return <Text style={styles.iconError}>✗</Text>;
      case 'warning':
        return <Text style={styles.iconWarning}>⚠</Text>;
      case 'skipped':
        return <Text style={styles.iconSkipped}>⏭</Text>;
      default:
        return <Text style={styles.iconPending}>○</Text>;
    }
  };

  // Calculer le pourcentage
  const percentage = summary.total > 0
    ? Math.round(summary.passed / summary.total * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🔧 Diagnostic API</Text>
        <Text style={styles.subtitle}>{API_BASE_URL}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Validation Pre-Production</Text>
          <Text style={styles.infoText}>
            Cet écran teste tous les endpoints critiques de l'API.
            {'\n'}Les tests GET ne modifient aucune donnée.
          </Text>
          {userInfo.isAuth && (
            <View style={styles.authBadge}>
              <Text style={styles.authBadgeText}>
                🔐 Connecté {userInfo.isProvider ? '(Provider)' : '(Client)'}
              </Text>
            </View>
          )}
        </View>

        {/* Bouton lancer tests */}
        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <ActivityIndicator color={colors.white} style={{ marginRight: 10 }} />
              <Text style={styles.runButtonText}>Tests en cours...</Text>
            </>
          ) : (
            <Text style={styles.runButtonText}>▶ LANCER TOUS LES TESTS</Text>
          )}
        </TouchableOpacity>

        {/* Résumé */}
        {summary.total > 0 && (
          <View style={[
            styles.summaryBox,
            percentage >= 80 ? styles.summarySuccess :
            percentage >= 50 ? styles.summaryWarning : styles.summaryError
          ]}>
            <Text style={styles.summaryTitle}>
              📊 RÉSULTAT: {summary.passed}/{summary.total} tests OK ({percentage}%)
            </Text>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryItem}>✅ {summary.passed} passed</Text>
              <Text style={styles.summaryItem}>❌ {summary.failed} failed</Text>
              <Text style={styles.summaryItem}>⏭️ {summary.skipped} skipped</Text>
            </View>

            {/* Boutons rapport */}
            <View style={styles.reportButtons}>
              <TouchableOpacity style={styles.reportBtn} onPress={showFullReport}>
                <Text style={styles.reportBtnText}>📋 Voir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reportBtn} onPress={shareReport}>
                <Text style={styles.reportBtnText}>📤 Partager</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Résultats par catégorie */}
        {categories.map(cat => (
          cat.tests.length > 0 && (
            <View key={cat.id} style={styles.categoryBox}>
              <Text style={styles.categoryTitle}>{cat.icon} {cat.name}</Text>
              {cat.tests.map(test => (
                <View key={test.id} style={styles.testItem}>
                  <View style={styles.testHeader}>
                    {renderStatusIcon(test.status)}
                    <Text style={styles.testName}>{test.name}</Text>
                    {test.latency && (
                      <Text style={styles.testLatency}>{test.latency}ms</Text>
                    )}
                  </View>
                  {test.message && (
                    <Text style={[
                      styles.testMessage,
                      test.status === 'success' && styles.textSuccess,
                      test.status === 'error' && styles.textError,
                      test.status === 'warning' && styles.textWarning,
                    ]}>
                      {test.message}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )
        ))}

        {/* Footer */}
        {summary.total > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {percentage >= 80
                ? '✅ Application prête pour les tests manuels'
                : percentage >= 50
                ? '⚠️ Vérifier les endpoints en erreur avant production'
                : '❌ Problèmes critiques détectés - Ne pas déployer'
              }
            </Text>
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
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
  },
  infoText: {
    color: '#1E40AF',
    fontSize: 14,
    lineHeight: 20,
  },
  authBadge: {
    marginTop: 12,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  authBadgeText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '600',
  },
  runButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  runButtonDisabled: {
    opacity: 0.8,
  },
  runButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summarySuccess: {
    backgroundColor: '#D1FAE5',
  },
  summaryWarning: {
    backgroundColor: '#FEF3C7',
  },
  summaryError: {
    backgroundColor: '#FEE2E2',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  summaryDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    fontSize: 14,
    color: colors.gray[600],
  },
  reportButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  reportBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  reportBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  categoryBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray[900],
    padding: 12,
    backgroundColor: colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  testItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testName: {
    fontSize: 14,
    color: colors.gray[900],
    marginLeft: 10,
    flex: 1,
  },
  testLatency: {
    fontSize: 12,
    color: colors.gray[600],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  testMessage: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 26,
    color: colors.gray[600],
  },
  iconSuccess: {
    fontSize: 16,
    color: colors.success,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  iconError: {
    fontSize: 16,
    color: colors.error,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  iconWarning: {
    fontSize: 16,
    color: colors.warning,
    width: 20,
    textAlign: 'center',
  },
  iconSkipped: {
    fontSize: 14,
    color: colors.gray[600],
    width: 20,
    textAlign: 'center',
  },
  iconPending: {
    fontSize: 16,
    color: colors.gray[600],
    width: 20,
    textAlign: 'center',
  },
  textSuccess: {
    color: colors.success,
  },
  textError: {
    color: colors.error,
  },
  textWarning: {
    color: colors.warning,
  },
  footer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  footerText: {
    fontSize: 14,
    color: colors.gray[900],
    textAlign: 'center',
    fontWeight: '500',
  },
});
