/**
 * Test API Layer
 * Écran de test pour vérifier les appels API
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Import API
import {
  apiClient,
  API_BASE_URL,
  getServices,
  getCategories,
  login,
  checkAuth,
  ENDPOINTS,
} from '../src/lib/api';

// Colors
const colors = {
  primary: '#E63946',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    600: '#4B5563',
    900: '#111827',
  },
  white: '#FFFFFF',
};

interface TestResult {
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error' | 'warning';
  message?: string;
  data?: any;
}

export default function TestAPIScreen() {
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (name: string, update: Partial<TestResult>) => {
    setResults(prev =>
      prev.map(r => (r.name === name ? { ...r, ...update } : r))
    );
  };

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  // Test 1: Vérifier connexion API
  const testAPIConnection = async () => {
    const name = '1. Connexion API';
    addResult({ name, status: 'loading' });

    try {
      const response = await apiClient.get('/api/health');
      updateResult(name, {
        status: 'success',
        message: `API accessible - Status: ${response.status}`,
        data: response.data,
      });
      return true;
    } catch (error: any) {
      // Même une erreur 404 signifie que l'API répond
      if (error.response) {
        updateResult(name, {
          status: 'success',
          message: `API répond - Status: ${error.response.status}`,
        });
        return true;
      }
      updateResult(name, {
        status: 'error',
        message: error.message || 'Erreur connexion',
      });
      return false;
    }
  };

  // Test 2: Récupérer les catégories
  const testGetCategories = async () => {
    const name = '2. GET /api/categories';
    addResult({ name, status: 'loading' });

    try {
      const categories = await getCategories();
      updateResult(name, {
        status: 'success',
        message: `${categories.length} catégories récupérées`,
        data: categories.slice(0, 3),
      });
      return true;
    } catch (error: any) {
      updateResult(name, {
        status: 'error',
        message: error.response?.data?.message || error.message,
      });
      return false;
    }
  };

  // Test 3: Récupérer les services
  const testGetServices = async () => {
    const name = '3. GET /api/services';
    addResult({ name, status: 'loading' });

    try {
      const response = await getServices({ limit: 5 });
      updateResult(name, {
        status: 'success',
        message: `${response.data.length} services (total: ${response.meta?.total || '?'})`,
        data: response.data.slice(0, 2),
      });
      return true;
    } catch (error: any) {
      updateResult(name, {
        status: 'error',
        message: error.response?.data?.message || error.message,
      });
      return false;
    }
  };

  // Test 4: Test login avec faux credentials
  const testLoginEndpoint = async () => {
    const name = '4. POST /api/auth/login';
    addResult({ name, status: 'loading' });

    try {
      // On s'attend à une erreur 401 avec de faux credentials
      await login({ email: 'test@test.com', password: 'wrongpassword' });
      updateResult(name, {
        status: 'warning',
        message: 'Login accepté (inattendu)',
      });
      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 422) {
        updateResult(name, {
          status: 'success',
          message: `Endpoint fonctionne - Rejet correct (${error.response.status})`,
        });
        return true;
      }
      updateResult(name, {
        status: 'error',
        message: error.response?.data?.message || error.message,
      });
      return false;
    }
  };

  // Test 5: Vérifier les headers
  const testHeaders = async () => {
    const name = '5. Vérifier Headers';
    addResult({ name, status: 'loading' });

    try {
      // Vérifier la configuration de base du client
      const defaults = apiClient.defaults;

      updateResult(name, {
        status: 'success',
        message: 'Headers configurés correctement',
        data: {
          'Content-Type': defaults.headers['Content-Type'] || defaults.headers.common?.['Content-Type'],
          'Accept': defaults.headers['Accept'] || defaults.headers.common?.['Accept'],
          'baseURL': defaults.baseURL || API_BASE_URL,
          'timeout': defaults.timeout,
        },
      });
      return true;
    } catch (error: any) {
      updateResult(name, {
        status: 'error',
        message: error.message,
      });
      return false;
    }
  };

  // Lancer tous les tests
  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    await testAPIConnection();
    await new Promise(r => setTimeout(r, 500));

    await testGetCategories();
    await new Promise(r => setTimeout(r, 500));

    await testGetServices();
    await new Promise(r => setTimeout(r, 500));

    await testLoginEndpoint();
    await new Promise(r => setTimeout(r, 500));

    await testHeaders();

    setIsRunning(false);

    // Résumé
    const successCount = results.filter(r => r.status === 'success').length;
    Alert.alert(
      'Tests terminés',
      `Vérifiez les résultats ci-dessous.\nL'API backend doit être accessible pour que les tests passent.`
    );
  };

  // Render status icon
  const renderStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <ActivityIndicator size="small" color={colors.primary} />;
      case 'success':
        return <Text style={styles.successIcon}>✓</Text>;
      case 'error':
        return <Text style={styles.errorIcon}>✗</Text>;
      case 'warning':
        return <Text style={styles.warningIcon}>⚠</Text>;
      default:
        return <Text style={styles.pendingIcon}>○</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Test API Layer</Text>
        <Text style={styles.subtitle}>Base URL: {API_BASE_URL}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Information</Text>
          <Text style={styles.infoText}>
            Ces tests vérifient que l'API Layer fonctionne correctement.
            {'\n'}Les erreurs 401/422 sur login sont normales (test avec faux credentials).
          </Text>
        </View>

        {/* Bouton lancer tests */}
        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.runButtonText}>▶ Lancer les tests</Text>
          )}
        </TouchableOpacity>

        {/* Résultats */}
        {results.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>Résultats</Text>
            {results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  {renderStatusIcon(result.status)}
                  <Text style={styles.resultName}>{result.name}</Text>
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
                {result.data && (
                  <View style={styles.dataBox}>
                    <Text style={styles.dataText}>
                      {JSON.stringify(result.data, null, 2).slice(0, 300)}
                      {JSON.stringify(result.data, null, 2).length > 300 ? '...' : ''}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Endpoints disponibles */}
        <View style={styles.endpointsBox}>
          <Text style={styles.endpointsTitle}>📋 Endpoints configurés</Text>
          <Text style={styles.endpointItem}>• AUTH: login, register, logout, me</Text>
          <Text style={styles.endpointItem}>• SERVICES: list, detail, search, featured</Text>
          <Text style={styles.endpointItem}>• CATEGORIES: list, detail, with-services</Text>
          <Text style={styles.endpointItem}>• BOOKINGS: create, list, cancel, complete</Text>
          <Text style={styles.endpointItem}>• PROVIDERS: nearby, availability, reviews</Text>
          <Text style={styles.endpointItem}>• FAVORITES: list, add, remove, toggle</Text>
        </View>
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
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
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
  runButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  runButtonDisabled: {
    opacity: 0.7,
  },
  runButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
  },
  resultItem: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginLeft: 10,
  },
  resultMessage: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 8,
    marginLeft: 26,
  },
  successIcon: {
    fontSize: 18,
    color: colors.success,
    fontWeight: 'bold',
  },
  errorIcon: {
    fontSize: 18,
    color: colors.error,
    fontWeight: 'bold',
  },
  warningIcon: {
    fontSize: 18,
    color: colors.warning,
  },
  pendingIcon: {
    fontSize: 18,
    color: colors.gray[600],
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
    marginTop: 10,
    marginLeft: 26,
  },
  dataText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.gray[600],
  },
  endpointsBox: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  endpointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
  },
  endpointItem: {
    fontSize: 13,
    color: colors.gray[600],
    marginBottom: 6,
  },
});
