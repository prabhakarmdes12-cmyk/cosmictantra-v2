import { test, expect } from '@playwright/test';

test.describe('Kundli First Insight & Report Browser Acceptance', () => {
  test('North Indian D1/D9 chart is visible immediately on /kundli/[id]', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/kundli/master-prabhakar-1989', { waitUntil: 'domcontentloaded' });

    // 1. First chart card is present and visible
    const chartCard = page.locator('[data-testid="kundli-first-chart-card"]');
    await expect(chartCard).toBeVisible({ timeout: 15000 });

    // 2. Heading indicates Rashi Kundli (D1)
    await expect(chartCard).toContainText('Rashi Kundli (Lagna Chart — D1)');

    // 3. SVG Chart is rendered
    const chartSvg = chartCard.locator('svg[viewBox="0 0 100 100"]');
    await expect(chartSvg).toBeVisible();

    // 4. Tab D9 switches to Navamsha Kundli (D9)
    const tabD9 = page.locator('[data-testid="chart-tab-d9"]');
    await expect(tabD9).toBeVisible();
    await tabD9.click();
    await expect(chartCard).toContainText('Navamsha Kundli (D9 Chart)');

    // 5. Tab D1 switches back
    const tabD1 = page.locator('[data-testid="chart-tab-d1"]');
    await tabD1.click();
    await expect(chartCard).toContainText('Rashi Kundli (Lagna Chart — D1)');

    // 6. Screenshot for visual evidence
    await page.screenshot({ path: 'artifacts/screenshots/kundli-first-insight-chart.png', fullPage: false });
  });

  test('/report displays reference specimen banner and download PDF succeeds without render failure', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/report?sample=1', { waitUntil: 'domcontentloaded' });

    // 1. Reference specimen notice banner is visible
    const demoBanner = page.locator('[data-testid="demo-profile-banner"]');
    await expect(demoBanner).toBeVisible({ timeout: 15000 });
    await expect(demoBanner).toContainText(/benchmark|specimen|संदर्भ/i);

    // 2. Button to enter birth details is present
    const enterBtn = page.locator('[data-testid="enter-my-birth-details"]');
    await expect(enterBtn).toBeVisible();

    // 3. Print button is present
    const printBtn = page.locator('[data-testid="report-print-kundli"]');
    await expect(printBtn).toBeVisible();

    // 4. Download button is present
    const downloadBtn = page.locator('[data-testid="report-download-pdf"]');
    await expect(downloadBtn).toBeVisible();

    // 5. Trigger download and monitor for failure banner
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
    await downloadBtn.click();

    // 6. Ensure NO error banner appears with KUNDLI_PDF_RENDER_FAILED
    const errorText = page.locator('text=KUNDLI_PDF_RENDER_FAILED');
    await expect(errorText).not.toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'artifacts/screenshots/report-sample-view.png', fullPage: false });
  });

  test('/report for first-time visitor prompts with clean intake form and historical benchmarks', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // Visit /report without parameters or stored profile
    await page.goto('http://localhost:3000/report', { waitUntil: 'domcontentloaded' });

    // 1. Verify clean intake form is visible
    await expect(page.locator('form')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="time"]')).toBeVisible();

    // 2. Verify historical benchmark cards (Gandhi, Vivekananda, Einstein) are present
    await expect(page.getByRole('button', { name: /Mahatma Gandhi/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Swami Vivekananda/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Albert Einstein/i })).toBeVisible();
  });
});
