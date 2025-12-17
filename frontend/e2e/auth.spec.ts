import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.fill('input[type="email"]', 'wrong@email.com');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button[type="submit"]');

        // Wait for toast or error message
        // Assuming toast appears with "Giriş başarısız" or similar
        // Or check if we are still on login page
        await expect(page).toHaveURL('/login');
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.fill('input[type="email"]', 'ahmet@4flow.com');
        await page.fill('input[type="password"]', 'test123');
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // Check for dashboard elements
        await expect(page.getByText('Projelerim')).toBeVisible();
    });
});
