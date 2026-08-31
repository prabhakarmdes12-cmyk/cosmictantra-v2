import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('REPORT PAGE (qualified client)', () => {
  test('demo profile renders workspace and downloads validated PDF', async ({ page }) => {
    await page.goto(`${BASE}/report`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/COSMICTANTRA MASTER KUNDLI/i).first()).toBeVisible({ timeout: 30000 });

    // Ganesh Vandana opens the Kundli (display requirement)
    await expect(page.getByText('॥ श्री गणेशाय नमः ॥').first()).toBeVisible({ timeout: 10000 });

    // Overview is the default mode; the established switcher is present
    await expect(page.getByText('Kundli at a Glance').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /17-Volume Book/i }).first()).toBeVisible();

    // Vimshottari timeline renders all 9 Mahadashas + NOW marker
    for (const lord of ['Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun']) {
      await expect(page.getByText(new RegExp(`^${lord}$`)).first()).toBeVisible({ timeout: 10000 });
    }
    await expect(page.getByText('● NOW').first()).toBeVisible();

    // Client-side pipeline: download a validated PDF
    const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
    await page.getByRole('button', { name: /DOWNLOAD PDF/i }).first().click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(download.suggestedFilename()).toMatch(/Kundli_.*\.pdf$/);
    const size = fs.statSync(path).size;
    console.log('DOWNLOADED:', download.suggestedFilename(), size, 'bytes');
    expect(size).toBeGreaterThan(100000);
  });

  test('incident-shaped URL (lat only) shows fail-safe, no PDF issued', async ({ page }) => {
    let downloadFired = false;
    page.on('download', () => { downloadFired = true; });
    await page.goto(`${BASE}/report?dob=1995-06-15&tob=10:30&lat=25.5941`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Engineering reason: KUNDLI_[A-Z_]+/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/No PDF was issued/i)).toBeVisible();
    expect(downloadFired).toBe(false);
  });
});
