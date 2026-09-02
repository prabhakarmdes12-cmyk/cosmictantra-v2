import { test, expect } from '@playwright/test';

test.describe('Kundali Milan Studio & Report Verification', () => {
  test('MILAN_001: /kundali-milan renders full 36-guna report, charts, and download PDF button', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto('http://localhost:3000/kundali-milan', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Verify header title
    const headerTitle = page.locator('h1');
    await expect(headerTitle).toContainText(/Ashtakoota Milan|अष्टकूट मिलान/i);

    // Verify 36 Gunas score is calculated and displayed
    const scoreText = page.locator('text=/36');
    await expect(scoreText.first()).toBeVisible();

    // Verify Download Milan PDF button exists
    const downloadBtn = page.locator('button:has-text("Download Milan PDF"), button:has-text("डाउनलोड मिलान PDF")');
    await expect(downloadBtn.first()).toBeVisible();

    // Take screenshot of Kundali Milan Studio top section with PDF Download Banner
    await page.screenshot({
      path: 'C:/Users/prabh/.gemini/antigravity-ide/brain/50afd9d0-daf4-48f9-8b93-2ba94c9e000b/kundali_milan_report.png',
      fullPage: false,
    });

    // Scroll down to score and koota breakdown
    await page.evaluate(() => window.scrollBy(0, 900));
    await page.waitForTimeout(1000);

    // Take screenshot of the score, dosha layer, and charts
    await page.screenshot({
      path: 'C:/Users/prabh/.gemini/antigravity-ide/brain/50afd9d0-daf4-48f9-8b93-2ba94c9e000b/kundali_milan_kootas.png',
      fullPage: false,
    });
  });

  test('MILAN_002: Menu modal prominently showcases Kundali Milan with REPORT & PDF badge', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Click navigation menu button
    const menuBtn = page.locator('button[aria-label="Open navigation menu"]');
    await menuBtn.click();
    await page.waitForTimeout(1000);

    // Verify 36-Point Kundali Milan entry is visible with REPORT & PDF badge
    const milanLink = page.locator('a[href="/kundali-milan"]');
    await expect(milanLink.first()).toBeVisible();
    await expect(page.locator('text=REPORT & PDF').first()).toBeVisible();

    // Take screenshot of Mega Menu
    await page.screenshot({
      path: 'C:/Users/prabh/.gemini/antigravity-ide/brain/50afd9d0-daf4-48f9-8b93-2ba94c9e000b/kundali_milan_menu.png',
      fullPage: false,
    });
  });

  test('MILAN_003: Direct PDF generation via POST /api/kundli/milan', async ({ request }) => {
    const res = await request.post('http://localhost:3000/api/kundli/milan', {
      data: {
        brideBirth: { name: 'Ananya', birthDate: '1992-11-08', birthTime: '14:45:00', latitude: 25.5941, longitude: 85.1376, timezone: 5.5 },
        groomBirth: { name: 'Prabhakar', birthDate: '1989-05-26', birthTime: '02:20:30', latitude: 22.0797, longitude: 82.1391, timezone: 5.5 },
        mode: 'SCHOLAR',
        locale: 'hi',
      },
    });

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
    const pages = Number(res.headers()['x-milan-pages']);
    expect(pages).toBeGreaterThanOrEqual(1);
    const body = await res.body();
    expect(body.length).toBeGreaterThan(10000);
  });
});
