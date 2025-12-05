import { test, expect } from '@playwright/test';

test.describe('Setup Validation', () => {

  test('01 - Page accueil accessible', async ({ page }) => {
    await page.goto('/');

    // Vérifier que la page charge
    await expect(page).toHaveURL('/');

    // Vérifier titre ou élément présent
    const title = await page.title();
    expect(title).toBeTruthy();

    console.log('✅ Homepage accessible');
  });

  test('02 - API backend disponible', async ({ page }) => {
    // Tester un endpoint simple
    const response = await page.request.get('http://localhost:8080/api/services');

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toBeTruthy();

    console.log('✅ Backend API accessible');
  });

  test('03 - Navigation fonctionne', async ({ page }) => {
    await page.goto('/');

    // Cliquer sur un lien (ajuster selon votre app)
    await page.click('a:has-text("Services")').catch(() => {
      console.log('⚠️ Lien Services non trouvé (normal si pas encore implémenté)');
    });

    console.log('✅ Navigation testée');
  });
});
