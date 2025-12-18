/**
 * Agent de Test Complet - GlamGo Mobile
 * Teste TOUTES les fonctionnalités de l'application
 * Détecte les incompatibilités Mobile <-> Backend
 */

import { apiClient, ENDPOINTS } from '../api';

// === TYPES ===

export type TestStatus = 'pending' | 'running' | 'success' | 'error' | 'warning' | 'skipped';

export interface TestResult {
  id: string;
  category: string;
  name: string;
  status: TestStatus;
  message?: string;
  duration?: number;
  data?: any;
  error?: any;
}

export interface TestReport {
  timestamp: string;
  duration: number;
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  results: TestResult[];
  summary: string;
}

export interface TestAgentOptions {
  skipAuth?: boolean;
  testEmail?: string;
  testPassword?: string;
  verbose?: boolean;
  onProgress?: (result: TestResult) => void;
}

// === TEST AGENT ===

class TestAgent {
  private results: TestResult[] = [];
  private options: TestAgentOptions;
  private authToken: string | null = null;
  private testUserId: number | null = null;
  private startTime: number = 0;

  constructor(options: TestAgentOptions = {}) {
    this.options = {
      testEmail: `test_${Date.now()}@glamgo-test.com`,
      testPassword: 'TestPassword123!',
      verbose: true,
      ...options,
    };
  }

  // === HELPERS ===

  private log(message: string) {
    if (this.options.verbose) {
      console.log(`[TestAgent] ${message}`);
    }
  }

  private async runTest(
    id: string,
    category: string,
    name: string,
    testFn: () => Promise<{ success: boolean; message: string; data?: any }>
  ): Promise<TestResult> {
    const start = Date.now();
    let result: TestResult = {
      id,
      category,
      name,
      status: 'running',
    };

    try {
      const { success, message, data } = await testFn();
      result = {
        ...result,
        status: success ? 'success' : 'error',
        message,
        data,
        duration: Date.now() - start,
      };
    } catch (error: any) {
      result = {
        ...result,
        status: 'error',
        message: error.response?.data?.message || error.message || 'Erreur inconnue',
        error: {
          status: error.response?.status,
          data: error.response?.data,
        },
        duration: Date.now() - start,
      };
    }

    this.results.push(result);
    this.options.onProgress?.(result);
    this.log(`${result.status === 'success' ? '✅' : '❌'} ${name}: ${result.message}`);
    return result;
  }

  private skipTest(id: string, category: string, name: string, reason: string): TestResult {
    const result: TestResult = {
      id,
      category,
      name,
      status: 'skipped',
      message: reason,
    };
    this.results.push(result);
    this.options.onProgress?.(result);
    this.log(`⏭️ ${name}: ${reason}`);
    return result;
  }

  // === TESTS: CONNEXION API ===

  private async testAPIHealth(): Promise<TestResult> {
    return this.runTest('api-health', 'API', 'Health Check', async () => {
      const response = await apiClient.get('/api/health');
      return {
        success: response.status === 200,
        message: `API accessible (${response.status})`,
        data: response.data,
      };
    });
  }

  // === TESTS: AUTHENTIFICATION ===

  private async testRegister(): Promise<TestResult> {
    return this.runTest('auth-register', 'Auth', 'Inscription', async () => {
      const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, {
        first_name: 'Test',
        last_name: 'Agent',
        email: this.options.testEmail,
        password: this.options.testPassword,
      });

      if (response.data?.data?.token) {
        this.authToken = response.data.data.token;
        this.testUserId = response.data.data.user?.id;
      }

      return {
        success: true,
        message: 'Inscription réussie',
        data: {
          userId: response.data?.data?.user?.id,
          hasToken: !!response.data?.data?.token,
        },
      };
    });
  }

  private async testLogin(): Promise<TestResult> {
    return this.runTest('auth-login', 'Auth', 'Connexion', async () => {
      const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        email: this.options.testEmail,
        password: this.options.testPassword,
      });

      if (response.data?.data?.token) {
        this.authToken = response.data.data.token;
        this.testUserId = response.data.data.user?.id;
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
      }

      return {
        success: true,
        message: 'Connexion réussie',
        data: {
          userId: response.data?.data?.user?.id,
          hasToken: !!response.data?.data?.token,
        },
      };
    });
  }

  private async testGetProfile(): Promise<TestResult> {
    if (!this.authToken) {
      return this.skipTest('auth-profile', 'Auth', 'Profil utilisateur', 'Non authentifié');
    }

    return this.runTest('auth-profile', 'Auth', 'Profil utilisateur', async () => {
      const response = await apiClient.get(ENDPOINTS.AUTH.ME);
      const user = response.data?.data;

      // Valider la structure du user
      const requiredFields = ['id', 'email', 'first_name', 'last_name'];
      const missingFields = requiredFields.filter(f => !user?.[f]);

      if (missingFields.length > 0) {
        return {
          success: false,
          message: `Champs manquants: ${missingFields.join(', ')}`,
          data: user,
        };
      }

      return {
        success: true,
        message: 'Profil récupéré',
        data: { id: user.id, email: user.email },
      };
    });
  }

  private async testLogout(): Promise<TestResult> {
    if (!this.authToken) {
      return this.skipTest('auth-logout', 'Auth', 'Déconnexion', 'Non authentifié');
    }

    return this.runTest('auth-logout', 'Auth', 'Déconnexion', async () => {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
      return {
        success: true,
        message: 'Déconnexion réussie',
      };
    });
  }

  // === TESTS: SERVICES ===

  private async testGetServices(): Promise<TestResult> {
    return this.runTest('services-list', 'Services', 'Liste des services', async () => {
      const response = await apiClient.get(ENDPOINTS.SERVICES.LIST);
      const services = response.data?.data || [];

      if (services.length === 0) {
        return {
          success: false,
          message: 'Aucun service trouvé',
        };
      }

      // Valider la structure d'un service
      const service = services[0];
      const requiredFields = ['id', 'title', 'price'];
      const missingFields = requiredFields.filter(f => service[f] === undefined);

      if (missingFields.length > 0) {
        return {
          success: false,
          message: `Structure service invalide - Champs manquants: ${missingFields.join(', ')}`,
          data: { sample: service },
        };
      }

      return {
        success: true,
        message: `${services.length} services chargés`,
        data: {
          count: services.length,
          sample: { id: service.id, title: service.title, price: service.price },
        },
      };
    });
  }

  private async testGetServiceById(): Promise<TestResult> {
    return this.runTest('services-detail', 'Services', 'Détail service', async () => {
      // D'abord récupérer un ID valide
      const listResponse = await apiClient.get(ENDPOINTS.SERVICES.LIST);
      const services = listResponse.data?.data || [];

      if (services.length === 0) {
        return { success: false, message: 'Aucun service pour tester' };
      }

      const serviceId = services[0].id;
      const response = await apiClient.get(ENDPOINTS.SERVICES.DETAIL(serviceId));
      const service = response.data?.data;

      return {
        success: !!service?.id,
        message: service ? `Service "${service.title}" récupéré` : 'Service non trouvé',
        data: service ? { id: service.id, title: service.title } : null,
      };
    });
  }

  private async testSearchServices(): Promise<TestResult> {
    return this.runTest('services-search', 'Services', 'Recherche services', async () => {
      const response = await apiClient.get(ENDPOINTS.SERVICES.SEARCH, {
        params: { q: 'coiffure' },
      });
      const results = response.data?.data || [];

      return {
        success: true,
        message: `${results.length} résultats pour "coiffure"`,
        data: { count: results.length },
      };
    });
  }

  // === TESTS: CATEGORIES ===

  private async testGetCategories(): Promise<TestResult> {
    return this.runTest('categories-list', 'Categories', 'Liste des catégories', async () => {
      const response = await apiClient.get(ENDPOINTS.CATEGORIES.LIST);
      const categories = response.data?.data || response.data || [];

      if (categories.length === 0) {
        return { success: false, message: 'Aucune catégorie trouvée' };
      }

      // Valider la structure
      const category = categories[0];
      const requiredFields = ['id', 'name'];
      const missingFields = requiredFields.filter(f => category[f] === undefined);

      if (missingFields.length > 0) {
        return {
          success: false,
          message: `Structure catégorie invalide - Champs manquants: ${missingFields.join(', ')}`,
          data: { sample: category },
        };
      }

      return {
        success: true,
        message: `${categories.length} catégories chargées`,
        data: {
          count: categories.length,
          names: categories.slice(0, 5).map((c: any) => c.name),
        },
      };
    });
  }

  // === TESTS: PROVIDERS ===

  private async testGetProviders(): Promise<TestResult> {
    return this.runTest('providers-list', 'Providers', 'Liste des prestataires', async () => {
      const response = await apiClient.get(ENDPOINTS.PROVIDERS.LIST);
      const providers = response.data?.data || [];

      return {
        success: true,
        message: `${providers.length} prestataires trouvés`,
        data: { count: providers.length },
      };
    });
  }

  private async testNearbyProviders(): Promise<TestResult> {
    return this.runTest('providers-nearby', 'Providers', 'Prestataires à proximité', async () => {
      const response = await apiClient.get(ENDPOINTS.PROVIDERS.NEARBY, {
        params: {
          latitude: 33.5731,
          longitude: -7.5898,
          radius: 10,
        },
      });
      const providers = response.data?.data || [];

      return {
        success: true,
        message: `${providers.length} prestataires proches (Casablanca)`,
        data: { count: providers.length },
      };
    });
  }

  // === TESTS: BOOKINGS ===

  private async testGetBookings(): Promise<TestResult> {
    if (!this.authToken) {
      return this.skipTest('bookings-list', 'Bookings', 'Liste réservations', 'Non authentifié');
    }

    return this.runTest('bookings-list', 'Bookings', 'Liste réservations', async () => {
      const response = await apiClient.get(ENDPOINTS.BOOKINGS.LIST);
      const bookings = response.data?.data || [];

      return {
        success: true,
        message: `${bookings.length} réservations`,
        data: { count: bookings.length },
      };
    });
  }

  private async testCreateBooking(): Promise<TestResult> {
    if (!this.authToken) {
      return this.skipTest('bookings-create', 'Bookings', 'Créer réservation', 'Non authentifié');
    }

    return this.runTest('bookings-create', 'Bookings', 'Créer réservation', async () => {
      // Récupérer un service et un provider valides
      const servicesRes = await apiClient.get(ENDPOINTS.SERVICES.LIST);
      const services = servicesRes.data?.data || [];

      if (services.length === 0) {
        return { success: false, message: 'Aucun service disponible' };
      }

      const providersRes = await apiClient.get(ENDPOINTS.PROVIDERS.LIST);
      const providers = providersRes.data?.data || [];

      if (providers.length === 0) {
        return { success: false, message: 'Aucun prestataire disponible' };
      }

      // Créer une réservation test (date future)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      try {
        const response = await apiClient.post(ENDPOINTS.BOOKINGS.CREATE, {
          service_id: services[0].id,
          provider_id: providers[0].id,
          date: dateStr,
          start_time: '14:00',
          address: '123 Rue Test, Casablanca',
          latitude: 33.5731,
          longitude: -7.5898,
          notes: '[TEST] Réservation de test agent',
        });

        const booking = response.data?.data;

        return {
          success: true,
          message: `Réservation #${booking?.id} créée`,
          data: { bookingId: booking?.id, status: booking?.status },
        };
      } catch (error: any) {
        // 422 = validation error, analyser les champs requis
        if (error.response?.status === 422) {
          const errors = error.response.data?.errors || {};
          return {
            success: false,
            message: `Validation échouée - Champs: ${Object.keys(errors).join(', ')}`,
            data: errors,
          };
        }
        throw error;
      }
    });
  }

  // === TESTS: FAVORITES ===

  private async testFavorites(): Promise<TestResult> {
    if (!this.authToken) {
      return this.skipTest('favorites', 'Favorites', 'Gestion favoris', 'Non authentifié');
    }

    return this.runTest('favorites', 'Favorites', 'Gestion favoris', async () => {
      // Récupérer un service
      const servicesRes = await apiClient.get(ENDPOINTS.SERVICES.LIST);
      const services = servicesRes.data?.data || [];

      if (services.length === 0) {
        return { success: false, message: 'Aucun service pour tester' };
      }

      const serviceId = services[0].id;

      // Ajouter aux favoris
      await apiClient.post(ENDPOINTS.FAVORITES.ADD, { service_id: serviceId });

      // Lister les favoris
      const favResponse = await apiClient.get(ENDPOINTS.FAVORITES.LIST);
      const favorites = favResponse.data?.data || [];

      // Retirer des favoris
      await apiClient.post(ENDPOINTS.FAVORITES.TOGGLE, { service_id: serviceId });

      return {
        success: true,
        message: 'Add/List/Remove OK',
        data: { tested_service: serviceId, favorites_count: favorites.length },
      };
    });
  }

  // === TESTS: VALIDATION STRUCTURES ===

  private async testMobileBackendCompatibility(): Promise<TestResult> {
    return this.runTest('compat-check', 'Validation', 'Compatibilité Mobile/Backend', async () => {
      const issues: string[] = [];

      // Test 1: Structure User
      try {
        // Essayer de s'inscrire avec la structure attendue
        const testEmail = `compat_${Date.now()}@test.com`;
        await apiClient.post(ENDPOINTS.AUTH.REGISTER, {
          first_name: 'Compat',
          last_name: 'Test',
          email: testEmail,
          password: 'test123456',
        });
      } catch (error: any) {
        if (error.response?.status === 422) {
          const errors = error.response.data?.errors || {};
          if (errors.first_name || errors.last_name) {
            issues.push('Register: Backend attend first_name/last_name');
          }
          if (errors.name) {
            issues.push('Register: Backend attend name (pas first_name/last_name)');
          }
        }
      }

      // Test 2: Structure Booking
      try {
        await apiClient.post(ENDPOINTS.BOOKINGS.CREATE, {
          service_id: 1,
          provider_id: 1,
          date: '2025-12-25',
          start_time: '10:00',
          address: 'Test',
        });
      } catch (error: any) {
        if (error.response?.status === 422) {
          const errors = error.response.data?.errors || {};
          const missingFields = Object.keys(errors);
          if (missingFields.length > 0) {
            issues.push(`Booking: Champs requis manquants - ${missingFields.join(', ')}`);
          }
        }
      }

      if (issues.length === 0) {
        return {
          success: true,
          message: 'Structures compatibles',
        };
      }

      return {
        success: false,
        message: `${issues.length} problème(s) détecté(s)`,
        data: issues,
      };
    });
  }

  // === RUN ALL TESTS ===

  async runAllTests(): Promise<TestReport> {
    this.results = [];
    this.startTime = Date.now();
    this.authToken = null;

    this.log('🚀 Démarrage des tests complets...\n');

    // 1. API Health
    await this.testAPIHealth();

    // 2. Auth Flow
    this.log('\n📱 Tests Authentification...');
    const registerResult = await this.testRegister();

    if (registerResult.status === 'error') {
      // Si register échoue, tenter login avec un compte existant
      this.log('⚠️ Register échoué, tentative avec compte existant...');
      this.options.testEmail = 'test@glamgo.ma';
      this.options.testPassword = 'password123';
    }

    await this.testLogin();
    await this.testGetProfile();

    // 3. Services
    this.log('\n💅 Tests Services...');
    await this.testGetServices();
    await this.testGetServiceById();
    await this.testSearchServices();

    // 4. Categories
    this.log('\n📁 Tests Catégories...');
    await this.testGetCategories();

    // 5. Providers
    this.log('\n👩‍💼 Tests Prestataires...');
    await this.testGetProviders();
    await this.testNearbyProviders();

    // 6. Bookings
    this.log('\n📅 Tests Réservations...');
    await this.testGetBookings();
    await this.testCreateBooking();

    // 7. Favorites
    this.log('\n❤️ Tests Favoris...');
    await this.testFavorites();

    // 8. Compatibility
    this.log('\n🔍 Tests Compatibilité...');
    await this.testMobileBackendCompatibility();

    // 9. Cleanup - Logout
    await this.testLogout();

    // Generate report
    const report = this.generateReport();
    this.printReport(report);

    return report;
  }

  // === REPORT ===

  private generateReport(): TestReport {
    const passed = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'error').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    let summary = '';
    if (failed === 0) {
      summary = '✅ Tous les tests passent !';
    } else {
      const failedTests = this.results.filter(r => r.status === 'error');
      summary = `❌ ${failed} test(s) échoué(s):\n${failedTests.map(t => `  - ${t.name}: ${t.message}`).join('\n')}`;
    }

    return {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      total: this.results.length,
      passed,
      failed,
      warnings,
      skipped,
      results: this.results,
      summary,
    };
  }

  private printReport(report: TestReport) {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RAPPORT DE TESTS - GlamGo Mobile');
    console.log('='.repeat(50));
    console.log(`📅 ${report.timestamp}`);
    console.log(`⏱️  Durée: ${(report.duration / 1000).toFixed(2)}s`);
    console.log(`📈 Total: ${report.total} tests`);
    console.log(`✅ Réussis: ${report.passed}`);
    console.log(`❌ Échoués: ${report.failed}`);
    console.log(`⚠️  Alertes: ${report.warnings}`);
    console.log(`⏭️  Ignorés: ${report.skipped}`);
    console.log('='.repeat(50));
    console.log(report.summary);
    console.log('='.repeat(50) + '\n');
  }
}

// === EXPORT ===

export const createTestAgent = (options?: TestAgentOptions) => new TestAgent(options);

export default TestAgent;
