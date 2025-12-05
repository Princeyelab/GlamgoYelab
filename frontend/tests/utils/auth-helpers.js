/**
 * Helpers authentification
 */

export async function login(page, email = 'test@test.com', password = 'password123') {
  await page.goto('/login');

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL('/', { timeout: 10000 });

  const token = await page.evaluate(() => localStorage.getItem('token'));

  if (!token) {
    throw new Error('Login failed: no token found');
  }

  return token;
}

export async function logout(page) {
  const logoutButton = page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")');

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    await page.click('[data-testid="user-menu"]').catch(() => {});
    await page.click('button:has-text("Déconnexion")');
  }

  await page.waitForURL(/\/login/, { timeout: 5000 });
}

export async function clearAuth(page) {
  // S'assurer qu'on est sur une vraie page avant d'accéder au localStorage
  const currentUrl = page.url();
  if (currentUrl === 'about:blank' || !currentUrl.includes('localhost')) {
    await page.goto('/');
  }

  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
}

export async function isLoggedIn(page) {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  return !!token;
}
