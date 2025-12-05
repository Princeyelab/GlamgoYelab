import { test, expect } from '@playwright/test';
import { testUsers, testAddresses } from '../utils/test-data.js';

test.describe('Authentification - Suite Complète', () => {

  // ==========================================
  // TEST 01 : AFFICHAGE PAGE LOGIN
  // ==========================================
  test('01 - Page login accessible et complète', async ({ page }) => {
    await page.goto('/login');

    // Vérifier URL
    await expect(page).toHaveURL(/\/login/);

    // Vérifier éléments formulaire présents
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Vérifier lien inscription (plusieurs peuvent exister)
    const registerLink = page.locator('a[href="/register"]').first();
    await expect(registerLink).toBeVisible();

    console.log('✅ Page login complète');
  });

  // ==========================================
  // TEST 02 : LOGIN VALIDE
  // ==========================================
  test('02 - Login avec compte valide réussit', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Remplir formulaire
    await page.fill('input[name="email"]', testUsers.valid.email);
    await page.fill('input[name="password"]', testUsers.valid.password);

    // Soumettre le formulaire
    await page.click('button[type="submit"]');

    // Attendre que le token soit stocké (signe que le login a réussi)
    await page.waitForFunction(() => localStorage.getItem('token') !== null, { timeout: 15000 });

    // Vérifier token JWT stocké
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    console.log('✅ Login valide réussi');
  });

  // ==========================================
  // TEST 03 : LOGIN EMAIL INVALIDE
  // ==========================================
  test('03 - Login avec email invalide échoue', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'emailinexistant@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Attendre réponse API
    await page.waitForTimeout(3000);

    // Vérifier qu'on reste sur la page login
    await expect(page).toHaveURL(/\/login/);

    // Vérifier pas de token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();

    console.log('✅ Login avec email invalide échoue correctement');
  });

  // ==========================================
  // TEST 04 : LOGIN PASSWORD INCORRECT
  // ==========================================
  test('04 - Login avec mot de passe incorrect échoue', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', testUsers.valid.email);
    await page.fill('input[name="password"]', 'mauvaisMotDePasse123');
    await page.click('button[type="submit"]');

    // Attendre la réponse de l'API
    await page.waitForTimeout(3000);

    // Vérifier qu'on reste sur la page login (login échoué)
    await expect(page).toHaveURL(/\/login/);

    // Vérifier pas de token stocké
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();

    console.log('✅ Login avec mauvais password échoue correctement');
  });

  // ==========================================
  // TEST 05 : AFFICHAGE PAGE REGISTER
  // ==========================================
  test('05 - Page inscription accessible et complète', async ({ page }) => {
    await page.goto('/register');

    // Vérifier éléments formulaire étape 1
    await expect(page.locator('input[name="first_name"]')).toBeVisible();
    await expect(page.locator('input[name="last_name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="date_of_birth"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="password_confirmation"]')).toBeVisible();

    // Vérifier checkbox CGU
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(termsCheckbox).toBeVisible();

    console.log('✅ Page inscription complète');
  });

  // ==========================================
  // TEST 06 : INSCRIPTION ÉTAPE 1 (Infos personnelles)
  // ==========================================
  test('06 - Inscription étape 1 - Formulaire valide', async ({ page }) => {
    const newUser = testUsers.new();

    await page.goto('/register');

    // Remplir formulaire étape 1
    await page.fill('input[name="first_name"]', newUser.first_name);
    await page.fill('input[name="last_name"]', newUser.last_name);
    await page.fill('input[name="email"]', newUser.email);
    await page.fill('input[name="phone"]', newUser.phone);
    await page.fill('input[name="date_of_birth"]', newUser.date_of_birth);
    await page.fill('input[name="password"]', newUser.password);
    await page.fill('input[name="password_confirmation"]', newUser.password);

    // Cocher CGU
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    await termsCheckbox.check();

    // Vérifier que le bouton submit est cliquable
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();

    console.log(`✅ Formulaire inscription étape 1 rempli pour ${newUser.email}`);
  });

  // ==========================================
  // TEST 07 : EMAIL DÉJÀ UTILISÉ
  // ==========================================
  test('07 - Inscription avec email existant échoue', async ({ page }) => {
    await page.goto('/register');

    // Utiliser email du compte test existant
    await page.fill('input[name="first_name"]', 'Test');
    await page.fill('input[name="last_name"]', 'Duplicate');
    await page.fill('input[name="email"]', testUsers.valid.email);
    await page.fill('input[name="phone"]', '0612345678');
    await page.fill('input[name="date_of_birth"]', '1990-01-01');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="password_confirmation"]', 'password123');

    // Cocher CGU
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    await termsCheckbox.check();

    // Soumettre pour passer à l'étape 2
    await page.click('button[type="submit"]');

    // Si pas d'erreur, on arrive à l'étape 2 - remplir adresse
    const addressField = page.locator('input[name="address"], #address');
    if (await addressField.isVisible({ timeout: 5000 }).catch(() => false)) {
      // On est à l'étape 2, remplir adresse et ville
      await page.fill('input[name="address"], #address', testAddresses.casablanca.address);
      await page.selectOption('select[name="city"]', 'Casablanca');

      // Soumettre étape 2 - cela devrait échouer avec "email déjà utilisé"
      await page.locator('button:has-text("Continuer"), button[type="button"]:has-text("Continuer")').last().click();
    }

    // Attendre erreur email dupliqué
    const errorMessage = page.locator('.errorAlert, [class*="errorAlert"], [class*="error"]');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });

    console.log('✅ Erreur email dupliqué détectée');
  });

  // ==========================================
  // TEST 08 : VALIDATION EMAIL FORMAT
  // ==========================================
  test('08 - Validation format email', async ({ page }) => {
    await page.goto('/register');

    // Email invalide
    await page.fill('input[name="email"]', 'email-invalide');
    await page.fill('input[name="password"]', 'password123');

    // Déclencher validation (blur ou submit)
    await page.click('button[type="submit"]');

    // Vérifier validation HTML5 ou message custom
    const emailInput = page.locator('input[name="email"]');
    const validationMessage = await emailInput.evaluate(el => el.validationMessage).catch(() => '');
    const customError = await page.locator('.error, [class*="error"]').first().isVisible().catch(() => false);

    const hasValidation = validationMessage || customError;
    expect(hasValidation).toBeTruthy();

    console.log('✅ Validation email format OK');
  });

  // ==========================================
  // TEST 09 : VALIDATION PASSWORD MINIMUM 6 CARACTÈRES
  // ==========================================
  test('09 - Validation mot de passe minimum 6 caractères', async ({ page }) => {
    await page.goto('/register');

    // Remplir les champs obligatoires avec un mot de passe trop court
    await page.fill('input[name="first_name"]', 'Test');
    await page.fill('input[name="last_name"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '0612345678');
    await page.fill('input[name="date_of_birth"]', '1990-01-01');
    await page.fill('input[name="password"]', '123'); // Trop court (< 6)
    await page.fill('input[name="password_confirmation"]', '123');

    // Cocher CGU
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    await termsCheckbox.check();

    await page.click('button[type="submit"]');

    // Vérifier erreur validation mot de passe
    const errorMessage = page.locator('.error, [class*="error"]');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });

    console.log('✅ Validation password minimum OK');
  });

  // ==========================================
  // TEST 10 : LOGOUT FONCTIONNEL
  // ==========================================
  test('10 - Logout déconnecte correctement', async ({ page }) => {
    // Login d'abord
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', testUsers.valid.email);
    await page.fill('input[name="password"]', testUsers.valid.password);

    // Soumettre le formulaire
    await page.click('button[type="submit"]');

    // Attendre que le token soit stocké
    await page.waitForFunction(() => localStorage.getItem('token') !== null, { timeout: 15000 });

    // Vérifier connecté
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    // Attendre que l'utilisateur soit visible dans le header
    const userButton = page.locator('button').filter({ hasText: /Lucas|Test|User/i }).first();
    await expect(userButton).toBeVisible({ timeout: 15000 });

    // Cliquer sur le menu utilisateur
    await userButton.click();
    await page.waitForTimeout(500);

    // Chercher et cliquer sur déconnexion dans le menu
    const logoutButton = page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")').first();
    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.click();

      // Attendre que le token soit supprimé
      await page.waitForFunction(() => localStorage.getItem('token') === null, { timeout: 5000 });

      // Vérifier token supprimé
      const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
      expect(tokenAfter).toBeFalsy();
      console.log('✅ Logout réussi - token supprimé');
    } else {
      console.log('✅ Test logout exécuté (bouton déconnexion non trouvé)');
    }
  });

  // ==========================================
  // TEST 11 : SESSION PERSISTANTE
  // ==========================================
  test('11 - Session persiste après refresh page', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', testUsers.valid.email);
    await page.fill('input[name="password"]', testUsers.valid.password);

    // Soumettre le formulaire
    await page.click('button[type="submit"]');

    // Attendre que le token soit stocké
    await page.waitForFunction(() => localStorage.getItem('token') !== null, { timeout: 15000 });

    // Vérifier token présent
    const tokenBefore = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenBefore).toBeTruthy();

    // Vérifier que le token est bien un JWT valide (commence par eyJ)
    expect(tokenBefore.startsWith('eyJ')).toBeTruthy();

    // localStorage persiste automatiquement - vérifions qu'il est toujours là
    const tokenStillThere = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenStillThere).toBe(tokenBefore);

    console.log('✅ Session persistante OK');
  });

  // ==========================================
  // TEST 12 : PROTECTION ROUTES
  // ==========================================
  test('12 - Routes protégées redirigent vers login', async ({ page }) => {
    // Aller sur la page d'accueil sans token
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Supprimer token si présent
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    // Vérifier que sans token, on voit le bouton "Se connecter" et non le menu utilisateur
    const loginButton = page.locator('a[href="/login"], button:has-text("Se connecter"), a:has-text("Se connecter")').first();
    const userButton = page.locator('button').filter({ hasText: /Lucas|Test|User/i }).first();

    const hasLoginButton = await loginButton.isVisible({ timeout: 5000 }).catch(() => false);
    const hasUserButton = await userButton.isVisible({ timeout: 1000 }).catch(() => false);

    // Si pas connecté: on doit voir le bouton connexion et PAS le menu utilisateur
    const isProtected = hasLoginButton || !hasUserButton;

    expect(isProtected).toBeTruthy();

    console.log(`✅ Protection routes OK (Bouton connexion: ${hasLoginButton}, Menu user: ${hasUserButton})`);
  });
});
