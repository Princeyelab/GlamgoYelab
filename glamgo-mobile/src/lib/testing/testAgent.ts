/**
 * API Test Agent - GlamGo Mobile
 * Agent de test automatique pour valider l'API avant affichage
 */

import { API_BASE_URL } from '../api/client';

// === TYPES ===

export interface TestResult {
  name: string;
  status: 'success' | 'failed' | 'warning' | 'skipped';
  duration: number;
  message?: string;
  error?: any;
  data?: any;
}

export interface TestReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  apiStatus: 'online' | 'offline' | 'degraded';
}

// === TEST AGENT CLASS ===

class APITestAgent {
  private results: TestResult[] = [];
  private startTime: number = 0;
  private apiStatus: 'online' | 'offline' | 'degraded' = 'offline';

  /**
   * Lancer tous les tests
   */
  async runAllTests(): Promise<TestReport> {
    console.log('🧪 API Test Agent - Demarrage...');
    this.startTime = Date.now();
    this.results = [];
    this.apiStatus = 'offline';

    // Tests sequentiels
    await this.testAPIConnection();
    await this.testAuthEndpoints();
    await this.testServicesEndpoints();
    await this.testCategoriesEndpoints();
    await this.testDataConformity();
    await this.testImageLoading();
    await this.testPerformance();

    const report = this.generateReport();
    this.logReport(report);

    return report;
  }

  /**
   * Test 1: Connexion API
   */
  private async testAPIConnection(): Promise<void> {
    const testName = 'API Connection';
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.apiStatus = 'online';
        this.addResult({
          name: testName,
          status: 'success',
          duration: Date.now() - start,
          message: `API accessible (${response.status})`,
        });
      } else {
        // Meme une erreur 404 signifie que le serveur repond
        this.apiStatus = 'degraded';
        this.addResult({
          name: testName,
          status: 'success',
          duration: Date.now() - start,
          message: `Serveur repond (${response.status})`,
        });
      }
    } catch (error: any) {
      // Verifier si c'est une erreur reseau ou timeout
      if (error.name === 'AbortError') {
        this.addResult({
          name: testName,
          status: 'failed',
          duration: Date.now() - start,
          message: 'Timeout - API trop lente',
          error,
        });
      } else {
        this.addResult({
          name: testName,
          status: 'failed',
          duration: Date.now() - start,
          message: 'API non accessible',
          error,
        });
      }
    }
  }

  /**
   * Test 2: Endpoints Auth
   */
  private async testAuthEndpoints(): Promise<void> {
    const testName = 'Auth Endpoints';
    const start = Date.now();

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@glamgo.com',
          password: 'Test123456',
        }),
      });

      // 401/422 = endpoint fonctionne (credentials invalides attendus)
      // 200 = endpoint fonctionne (credentials valides)
      if ([200, 401, 422].includes(response.status)) {
        this.addResult({
          name: testName,
          status: 'success',
          duration: Date.now() - start,
          message: `Endpoint operationnel (${response.status})`,
        });
      } else {
        this.addResult({
          name: testName,
          status: 'warning',
          duration: Date.now() - start,
          message: `Status inattendu: ${response.status}`,
        });
      }
    } catch (error: any) {
      this.addResult({
        name: testName,
        status: 'failed',
        duration: Date.now() - start,
        message: 'Auth endpoints non accessibles',
        error,
      });
    }
  }

  /**
   * Test 3: Endpoints Services
   */
  private async testServicesEndpoints(): Promise<void> {
    const testName = 'Services Endpoints';
    const start = Date.now();

    try {
      const response = await fetch(`${API_BASE_URL}/api/services`);
      const data = await response.json();

      if (response.ok && data) {
        const services = data.data || data;
        if (Array.isArray(services) && services.length > 0) {
          this.addResult({
            name: testName,
            status: 'success',
            duration: Date.now() - start,
            message: `${services.length} services charges`,
            data: { count: services.length },
          });
        } else {
          this.addResult({
            name: testName,
            status: 'warning',
            duration: Date.now() - start,
            message: 'Aucun service retourne',
          });
        }
      } else {
        this.addResult({
          name: testName,
          status: 'failed',
          duration: Date.now() - start,
          message: `Erreur ${response.status}`,
        });
      }
    } catch (error: any) {
      this.addResult({
        name: testName,
        status: 'failed',
        duration: Date.now() - start,
        message: 'Impossible de charger services',
        error,
      });
    }
  }

  /**
   * Test 4: Endpoints Categories
   */
  private async testCategoriesEndpoints(): Promise<void> {
    const testName = 'Categories Endpoints';
    const start = Date.now();

    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await response.json();

      if (response.ok && data) {
        const categories = data.data || data;
        if (Array.isArray(categories) && categories.length > 0) {
          this.addResult({
            name: testName,
            status: 'success',
            duration: Date.now() - start,
            message: `${categories.length} categories chargees`,
            data: { count: categories.length },
          });
        } else {
          this.addResult({
            name: testName,
            status: 'warning',
            duration: Date.now() - start,
            message: 'Aucune categorie retournee',
          });
        }
      } else {
        this.addResult({
          name: testName,
          status: 'failed',
          duration: Date.now() - start,
          message: `Erreur ${response.status}`,
        });
      }
    } catch (error: any) {
      this.addResult({
        name: testName,
        status: 'failed',
        duration: Date.now() - start,
        message: 'Impossible de charger categories',
        error,
      });
    }
  }

  /**
   * Test 5: Conformite des donnees
   */
  private async testDataConformity(): Promise<void> {
    const testName = 'Data Conformity';
    const start = Date.now();

    try {
      const response = await fetch(`${API_BASE_URL}/api/services`);
      const data = await response.json();
      const services = data.data || data;

      if (!Array.isArray(services) || services.length === 0) {
        this.addResult({
          name: testName,
          status: 'skipped',
          duration: Date.now() - start,
          message: 'Pas de donnees a verifier',
        });
        return;
      }

      const firstService = services[0];
      const requiredFields = ['id', 'name', 'price', 'category_id'];
      const optionalFields = ['description', 'duration_minutes', 'images', 'rating'];

      const missingRequired = requiredFields.filter(field => !(field in firstService));
      const missingOptional = optionalFields.filter(field => !(field in firstService));

      if (missingRequired.length === 0) {
        this.addResult({
          name: testName,
          status: missingOptional.length > 2 ? 'warning' : 'success',
          duration: Date.now() - start,
          message: missingOptional.length > 0
            ? `Structure OK (optionnel manquant: ${missingOptional.join(', ')})`
            : 'Structure donnees conforme',
          data: { sample: firstService },
        });
      } else {
        this.addResult({
          name: testName,
          status: 'warning',
          duration: Date.now() - start,
          message: `Champs requis manquants: ${missingRequired.join(', ')}`,
        });
      }
    } catch (error: any) {
      this.addResult({
        name: testName,
        status: 'skipped',
        duration: Date.now() - start,
        message: 'Impossible de verifier conformite',
        error,
      });
    }
  }

  /**
   * Test 6: Chargement images
   */
  private async testImageLoading(): Promise<void> {
    const testName = 'Image Loading';
    const start = Date.now();

    try {
      const response = await fetch(`${API_BASE_URL}/api/services`);
      const data = await response.json();
      const services = data.data || data;

      if (!Array.isArray(services) || services.length === 0) {
        this.addResult({
          name: testName,
          status: 'skipped',
          duration: Date.now() - start,
          message: 'Pas de services pour tester images',
        });
        return;
      }

      // Trouver une image a tester
      const serviceWithImage = services.find((s: any) =>
        s.images?.[0] || s.thumbnail || s.image
      );

      if (!serviceWithImage) {
        this.addResult({
          name: testName,
          status: 'warning',
          duration: Date.now() - start,
          message: 'Aucune image trouvee dans les services',
        });
        return;
      }

      const imageUrl = serviceWithImage.images?.[0] ||
        serviceWithImage.thumbnail ||
        serviceWithImage.image;

      // Test HEAD request pour verifier accessibilite
      const imageResponse = await fetch(imageUrl, { method: 'HEAD' });

      if (imageResponse.ok) {
        this.addResult({
          name: testName,
          status: 'success',
          duration: Date.now() - start,
          message: 'Images accessibles',
        });
      } else {
        this.addResult({
          name: testName,
          status: 'warning',
          duration: Date.now() - start,
          message: `Image status: ${imageResponse.status}`,
        });
      }
    } catch (error: any) {
      this.addResult({
        name: testName,
        status: 'warning',
        duration: Date.now() - start,
        message: 'Impossible de verifier images',
        error,
      });
    }
  }

  /**
   * Test 7: Performance API
   */
  private async testPerformance(): Promise<void> {
    const testName = 'API Performance';
    const start = Date.now();

    try {
      await fetch(`${API_BASE_URL}/api/services`);
      const duration = Date.now() - start;

      let status: 'success' | 'warning' | 'failed' = 'success';
      let message = `Reponse en ${duration}ms`;

      if (duration > 5000) {
        status = 'failed';
        message = `Tres lent (${duration}ms > 5s)`;
        this.apiStatus = 'degraded';
      } else if (duration > 3000) {
        status = 'warning';
        message = `Lent (${duration}ms > 3s)`;
      } else if (duration < 500) {
        message = `Rapide (${duration}ms)`;
      }

      this.addResult({
        name: testName,
        status,
        duration,
        message,
      });
    } catch (error: any) {
      this.addResult({
        name: testName,
        status: 'failed',
        duration: Date.now() - start,
        message: 'Test performance echoue',
        error,
      });
    }
  }

  /**
   * Ajouter un resultat
   */
  private addResult(result: TestResult): void {
    this.results.push(result);

    const icon = result.status === 'success' ? '✅' :
      result.status === 'warning' ? '⚠️' :
        result.status === 'skipped' ? '⏭️' : '❌';

    console.log(`${icon} ${result.name}: ${result.message} (${result.duration}ms)`);
  }

  /**
   * Generer le rapport
   */
  private generateReport(): TestReport {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    // Determiner status API final
    if (failed > 2) {
      this.apiStatus = 'offline';
    } else if (failed > 0 || warnings > 2) {
      this.apiStatus = 'degraded';
    } else {
      this.apiStatus = 'online';
    }

    return {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed,
      failed,
      warnings,
      skipped,
      duration: totalDuration,
      results: this.results,
      apiStatus: this.apiStatus,
    };
  }

  /**
   * Logger le rapport
   */
  private logReport(report: TestReport): void {
    console.log('\n📊 === RAPPORT TESTS API ===');
    console.log(`📅 ${report.timestamp}`);
    console.log(`⏱️  Duree: ${(report.duration / 1000).toFixed(2)}s`);
    console.log(`✅ Reussis: ${report.passed}/${report.totalTests}`);
    console.log(`❌ Echoues: ${report.failed}`);
    console.log(`⚠️  Alertes: ${report.warnings}`);
    console.log(`🌐 Status API: ${report.apiStatus.toUpperCase()}`);
    console.log('============================\n');
  }
}

// Export singleton
export const testAgent = new APITestAgent();

// Export pour tests individuels
export default testAgent;
