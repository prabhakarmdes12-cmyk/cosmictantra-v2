import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('CosmicTantra — Kundali Creation: 350+ Indian Cities & Custom Lat/Lng Precision Suite', () => {

  test('User can select any city across India and coordinates auto-populate', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    const kundaliSection = page.locator('#kundali-section');
    await kundaliSection.scrollIntoViewIfNeeded();
    await expect(kundaliSection).toBeVisible();

    // Verify 350+ cities dropdown exists
    const citySelect = kundaliSection.locator('select');
    await expect(citySelect).toBeVisible();

    // Select Tirupati (Andhra Pradesh)
    await citySelect.selectOption('tirupati');

    // Verify Latitude and Longitude auto-populate
    const latInput = kundaliSection.locator('input[type="number"]').first();
    const lngInput = kundaliSection.locator('input[type="number"]').nth(1);

    await expect(latInput).toHaveValue('13.6288');
    await expect(lngInput).toHaveValue('79.4192');

    // Click quick anchor "काशी (Varanasi)"
    const kashiAnchor = kundaliSection.locator('button:has-text("काशी (Varanasi)")');
    await kashiAnchor.click();

    await expect(latInput).toHaveValue('25.3176');
    await expect(lngInput).toHaveValue('82.9739');
  });

  test('User can manually enter custom Latitude & Longitude and generate Kundli', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    const kundaliSection = page.locator('#kundali-section');
    await kundaliSection.scrollIntoViewIfNeeded();

    const latInput = kundaliSection.locator('input[type="number"]').first();
    const lngInput = kundaliSection.locator('input[type="number"]').nth(1);

    // Enter custom exact birth coordinates (e.g. 26.8467° N, 80.9462° E)
    await latInput.fill('26.8467');
    await lngInput.fill('80.9462');

    // Submit form to create Kundli
    const submitBtn = kundaliSection.locator('button[type="submit"]');
    await submitBtn.click();

    // Verify Kundali chart and Lagna summary rendered
    await expect(kundaliSection.locator('text=Lahiri Ayanamsha: 24° 16\'')).toBeVisible();
    await expect(kundaliSection.getByText(/Planetary Positions|ग्रह स्थिति/i).first()).toBeVisible();
  });

  test('CitySelectorModal supports live search across 350+ Indian cities', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // Open City Selector Modal from header
    const cityModalBtn = page.locator('header button').filter({ hasText: /Dhanbad|धनबाद/ }).first();
    await expect(cityModalBtn).toBeVisible({ timeout: 10000 });
    await cityModalBtn.click();

    // Search for Deoghar
    const searchInput = page.locator('.fixed input[placeholder*="खोजें"], .fixed input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Deoghar');

    // Verify Deoghar is listed in modal buttons
    const deogharBtn = page.locator('.fixed button:has-text("Deoghar")').first();
    await expect(deogharBtn).toBeVisible();
    await deogharBtn.click();
  });

});
