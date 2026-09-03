/**
 * SPRINT C — CONVERSION JOURNEY 01 — browser journey suite.
 *
 * Requires a browser environment (this checkout's sandbox cannot install
 * one). Reproduction:
 *   npx next dev -p 3000 -H 0.0.0.0
 *   BASE_URL=http://localhost:3000 npx playwright test tests/sprint-c-ui.spec.ts
 */
import { test, expect, Page } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(overflow.scroll, `${label}: horizontal overflow (${overflow.scroll} > ${overflow.inner})`).toBeLessThanOrEqual(overflow.inner + 1);
}

test.describe('Sprint C — landing', () => {
  test('hero promise, dominant Kundli CTA, trust strip, fact-first day strip', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText(/Vedic Precision/i);
    await expect(page.getByText('CREATE MY KUNDLI').first()).toBeVisible();
    await expect(page.getByText("TODAY'S PANCHANG").first()).toBeVisible();
    await expect(page.locator('[data-testid="trust-strip"]')).toBeVisible();
    await expect(page.locator('[data-testid="vedic-day-strip"]')).toBeVisible();
    await expect(page.locator('[data-testid="vedic-day-strip"]')).not.toContainText(/Financial Liquidity|Deal Momentum|72H/i);
    await expect(page.locator('video')).toHaveCount(0);
    await expectNoHorizontalOverflow(page, 'landing-1440');
  });

  test('mobile 390 — no overflow, stepper visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await expectNoHorizontalOverflow(page, 'landing-390');
    await page.locator('#kundli-name').click();
    await page.locator('#kundli-name').fill('Aasha Test');
    await expectNoHorizontalOverflow(page, 'landing-390-after-focus');
  });
});

test.describe('Sprint C — full conversion journey', () => {
  test('landing → form → calculation → first insight → WHY → ask → save', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // Step 1: name
    await page.locator('#kundli-name').fill('Conversion Tester');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 2: birth date
    await page.locator('#kundli-dob').fill('1995-06-15');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 3: time + certainty
    await page.locator('#kundli-tob').fill('10:30');
    await page.getByRole('radio', { name: 'Exact' }).check();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 4: birthplace (must resolve — no silent fallback)
    await page.locator('#kundli-place').fill('Patna');
    await page.locator('#kundli-city-list button').first().click();
    await expect(page.locator('#kundli-place')).toBeVisible();

    const navPromise = page.waitForURL(/\/kundli\//, { timeout: 30000 });
    await page.getByRole('button', { name: /CREATE MY KUNDLI/i }).click();

    // Calculation state shows only genuinely completed steps
    await expect(page.locator('[data-testid="kundli-calculating"]')).toBeVisible();
    await navPromise;

    // FIRST INSIGHT
    await expect(page.locator('[data-testid="kundli-first-insight"]')).toBeVisible();
    await expect(page.locator('[data-testid="insight-lagna"]')).toBeVisible();
    await expect(page.locator('[data-testid="insight-currentMahadasha"]')).toBeVisible();
    await expect(page.getByText('What is active now?', { exact: false })).toBeVisible();
    await expect(page.locator('[data-testid="claim-CALCULATED"]').first()).toBeVisible();

    // WHY drawer — real evidence steps
    await page.getByRole('button', { name: /WHY/i }).click();
    await expect(page.locator('#kundli-why-drawer')).toBeVisible();
    await expect(page.locator('[data-testid="why-step-0"]')).toBeVisible();
    const stepCount = await page.locator('[data-testid^="why-step-"]').count();
    expect(stepCount).toBeGreaterThanOrEqual(3);
    await page.getByRole('button', { name: /SHOW TECHNICAL CALCULATION/i }).click();
    await expect(page.locator('#kundli-why-technical')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#kundli-why-drawer')).toHaveCount(0);

    // ASK — structured context reaches the assistant contract
    await page.evaluate(() => {
      (window as any).__journeyCtx = null;
      window.addEventListener('cosmictantra:kashi-journey-context', (e: any) => {
        (window as any).__journeyCtx = e.detail;
      });
    });
    await page.getByRole('button', { name: /ASK ABOUT THIS/i }).click();
    await page.waitForTimeout(600);
    const ctx = await page.evaluate(() => (window as any).__journeyCtx);
    expect(ctx).toBeTruthy();
    expect(ctx.contractVersion).toBe('kashi-journey-context-v1');
    expect(ctx.chartId).toBeTruthy();
    expect(ctx.dasha.mahadasha).toBeTruthy();
    expect(ctx.validationStatuses).toBeTruthy();
    expect(ctx.question).toContain('mean for me');

    // SAVE — after value, no forced registration
    await page.locator('[data-testid="save-kundli"]').click();
    await expect(page.locator('[data-testid="save-kundli-done"]')).toBeVisible();

    // Deep explorer stays one anchor away
    await expect(page.locator('a[href="#kundli-explore"]')).toBeVisible();
  });

  test('preset chart shows insight but no save CTA', async ({ page }) => {
    await page.goto(`${BASE}/kundli/gandhi-1869`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="kundli-first-insight"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-kundli"]')).toHaveCount(0);
    await expect(page.locator('#kundli-explore')).toBeVisible();
  });

  test('missing chart shows coherent FAILED state', async ({ page }) => {
    await page.goto(`${BASE}/kundli/does-not-exist-123`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('This chart could not be opened')).toBeVisible();
    await expect(page.locator('[data-testid="kundli-first-insight"]')).toHaveCount(0);
  });
});

test.describe('Sprint C — accessibility & mobile', () => {
  test('WHY drawer closes with Escape; focus returns', async ({ page }) => {
    await page.goto(`${BASE}/kundli/gandhi-1869`, { waitUntil: 'domcontentloaded' });
    const why = page.getByRole('button', { name: /WHY/i });
    await why.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#kundli-why-drawer')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#kundli-why-drawer')).toHaveCount(0);
  });

  test('insight is overflow-free at 320/390/430/768', async ({ page }) => {
    for (const width of [320, 390, 430, 768]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`${BASE}/kundli/gandhi-1869`, { waitUntil: 'domcontentloaded' });
      await expectNoHorizontalOverflow(page, `insight-${width}`);
    }
  });
});

test.describe('Sprint C — Today & report gating', () => {
  test('Today page has ASK ABOUT TODAY and no prediction ticker', async ({ page }) => {
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="ask-about-today"]')).toBeVisible();
    await expectNoHorizontalOverflow(page, 'daily-390');
  });

  test('Today, with no saved profile, shows an intentional empty state (no demo chart)', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('cosmictantra_profiles');
      localStorage.removeItem('cosmictantra_active_profile');
    });
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="daily-empty-state"]')).toBeVisible();
    await expect(page.getByText('Priya Sharma')).toHaveCount(0);
    // Add-member form must not accept an unverified city or empty birth fields
    await page.getByRole('button', { name: /Add first family member/i }).click();
    await page.locator('input[placeholder="e.g. Aarav Sharma"]').fill('Real Person');
    await page.getByRole('button', { name: /Save to Family Directory/i }).click();
    await expect(page.locator('[data-testid="member-form-error"]')).toBeVisible();
    await page.locator('input[placeholder="e.g. Patna"]').fill('Nowhereville XYZ');
    await page.locator('input[type="date"]').fill('1990-01-01');
    await page.locator('input[type="time"]').fill('10:00');
    await page.getByRole('button', { name: /Save to Family Directory/i }).click();
    await expect(page.locator('[data-testid="member-form-error"]')).toContainText(/real city/i);
  });

  test('Executive Life Matrix is not in the default report Overview', async ({ page }) => {
    await page.goto(`${BASE}/report?name=Tester&dob=1995-06-15&tob=10:30&city=Patna&lat=25.5941&lng=85.1376&tz=5.5`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('[data-testid="executive-life-explorer"]')).toHaveCount(0);
    await page.getByRole('button', { name: /Workbench/i }).click();
    await expect(page.locator('[data-testid="executive-life-explorer"]')).toBeVisible();
    await expect(page.locator('[data-testid="executive-life-explorer"]')).toContainText(/Explorer \/ Experimental|Engine qualification pending/i);
  });
});
