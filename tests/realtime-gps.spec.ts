import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('CosmicTantra — Universal Real-Time GPS Selector Suite', () => {

  test('Global City Selector Modal acquires live GPS lock and updates app location', async ({ page, context }) => {
    // Grant geolocation permissions and mock coordinates (Varanasi: 25.3176°N, 82.9739°E)
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 25.3176, longitude: 82.9739, accuracy: 5 });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // Open City Selector Modal from header
    const cityModalBtn = page.locator('header button').filter({ hasText: /Dhanbad|धनबाद|GPS/ }).first();
    await expect(cityModalBtn).toBeVisible({ timeout: 10000 });
    await cityModalBtn.click();

    // Click "Use Live GPS" / "लाइव GPS लें"
    const liveGpsBtn = page.locator('.fixed button').filter({ hasText: /Live GPS|लाइव GPS/i }).first();
    await expect(liveGpsBtn).toBeVisible();
    await liveGpsBtn.click();

    // Verify modal closes and header reflects GPS
    await expect(page.locator('header').getByText(/GPS|Varanasi|काशी/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Kundali creation form acquires real-time GPS coordinates and computes sidereal chart', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 23.1765, longitude: 75.7885, accuracy: 8 }); // Ujjain

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    const kundaliSection = page.locator('#kundali-section');
    await kundaliSection.scrollIntoViewIfNeeded();

    // Click GPS button inside Kundli form
    const gpsBtn = kundaliSection.locator('button').filter({ hasText: /GPS/ }).first();
    await expect(gpsBtn).toBeVisible();
    await gpsBtn.click();

    // Verify Latitude and Longitude auto-filled with Ujjain GPS coordinates
    const latInput = kundaliSection.locator('input[type="number"]').first();
    const lngInput = kundaliSection.locator('input[type="number"]').nth(1);

    await expect(latInput).toHaveValue('23.1765', { timeout: 5000 });
    await expect(lngInput).toHaveValue('75.7885', { timeout: 5000 });

    // Submit form and verify chart generation
    const submitBtn = kundaliSection.locator('button[type="submit"]');
    await submitBtn.click();

    await expect(kundaliSection.locator('text=Lahiri Ayanamsha: 24° 16\'')).toBeVisible();
  });

  test('Kundali Milan page supports Live GPS lock for Groom and Bride', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 25.5941, longitude: 85.1376, accuracy: 6 }); // Patna

    await page.goto(`${BASE_URL}/kundali-milan`, { waitUntil: 'domcontentloaded' });

    // Click Live GPS for Groom (Partner A)
    const groomGpsBtn = page.locator('button').filter({ hasText: /Live GPS|लाइव GPS/i }).first();
    await expect(groomGpsBtn).toBeVisible();
    await groomGpsBtn.click();

    // Fill names and birth dates
    const textInputs = page.locator('form input[type="text"], form input:not([type])');
    if (await textInputs.count() >= 2) {
      await textInputs.first().fill('Rahul');
      await textInputs.nth(1).fill('Priya');
    }

    const dateInputs = page.locator('form input[type="date"]');
    await dateInputs.first().fill('1994-04-12');
    await dateInputs.nth(1).fill('1996-08-20');

    // Compute compatibility
    const computeBtn = page.locator('button[type="submit"]');
    await computeBtn.click();

    // Verify 36 Gunas Ashtakoota score rendered
    await expect(page.getByText(/Ashtakoota|अष्टकूट/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Observatory Dome switches observing station to real-time satellite GPS', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 19.8135, longitude: 85.8312, accuracy: 10 }); // Puri

    await page.goto(`${BASE_URL}/observatory`, { waitUntil: 'domcontentloaded' });

    // Click "🛰️ लाइव GPS" in Observatory
    const gpsStationBtn = page.locator('button').filter({ hasText: /लाइव GPS|Live GPS/i }).first();
    await expect(gpsStationBtn).toBeVisible();
    await gpsStationBtn.click();

    // Verify observing station displays GPS coordinates
    const stationSelect = page.locator('select').first();
    await expect(stationSelect).toHaveValue('my-live-gps');
    await expect(page.getByText(/Lat 19.8135°N|near Puri/i).first()).toBeVisible();
  });

});
