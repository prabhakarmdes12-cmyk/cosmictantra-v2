/**
 * SPRINT C.1 — BROWSER ACCEPTANCE (§6–§9, §11, §14).
 * Runs against a production server; exercised for real in GitHub Actions
 * (.github/workflows/browser-acceptance.yml). Screenshots land in
 * artifacts/screenshots/c1/ (gitignored evidence).
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SHOT_DIR = 'artifacts/screenshots/c1';

async function noHorizontalOverflow(page: Page, label: string) {
  const o = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(o.scroll, `${label}: horizontal overflow (${o.scroll} > ${o.inner})`).toBeLessThanOrEqual(o.inner + 1);
}

function shotDir() {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
}

async function capture(page: Page, name: string) {
  shotDir();
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: false });
}

/** Hydration gates (Sprint C.1 §20): client interactions must run after
    React has attached handlers, otherwise clicks silently no-op. */
async function heroHydrated(page: Page) {
  await expect(page.locator('[data-hero-hydrated]')).toHaveAttribute('data-hero-hydrated', 'true', { timeout: 15_000 });
}
async function dailyHydrated(page: Page) {
  await expect(page.locator('[data-daily-hydrated]')).toHaveAttribute('data-daily-hydrated', 'true', { timeout: 15_000 });
}
async function profileHydrated(page: Page) {
  await expect(page.locator('[data-profile-hydrated]')).toHaveAttribute('data-profile-hydrated', 'true', { timeout: 15_000 });
}

test.describe('C.1 — required viewports (§7) & visual acceptance (§8)', () => {
  const VIEWPORTS: Array<[number, number]> = [
    [320, 700],
    [360, 800],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ];

  test('landing is overflow-free and captured at every required viewport', async ({ page }) => {
    for (const [w, h] of VIEWPORTS) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await noHorizontalOverflow(page, `landing-${w}x${h}`);
      await capture(page, `landing-${w}x${h}`);
      // Primary CTA visible without scrolling at all required widths (§16)
      await expect(page.locator('#kundli-name')).toBeVisible();
    }
  });

  test('journey state captures: birth flow, calculation, first insight, WHY, Ask', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await heroHydrated(page);

    await page.locator('#kundli-name').fill('C1 Tester');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-dob').fill('1990-01-15');
    await capture(page, 'birth-flow-390');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-tob').fill('09:30');
    await page.getByRole('radio', { name: 'Exact' }).check();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-place').fill('Patna');
    await page.locator('#kundli-city-list button').first().click();

    const navPromise = page.waitForURL(/\/kundli\//, { timeout: 30000 });
    await page.getByRole('button', { name: /CREATE MY KUNDLI/i }).click();
    await expect(page.locator('[data-testid="kundli-calculating"]')).toBeVisible();
    await capture(page, 'calculation-390');
    await navPromise;

    await expect(page.locator('[data-testid="kundli-first-insight"]')).toBeVisible();
    await capture(page, 'first-insight-390');
    await noHorizontalOverflow(page, 'insight-390');

    // WHY drawer + classification chips (§12)
    await page.getByRole('button', { name: /WHY/i }).click();
    await expect(page.locator('#kundli-why-drawer')).toBeVisible();
    await expect(page.locator('[data-testid^="why-classification-"]').first()).toBeVisible();
    await capture(page, 'why-drawer-390');

    // ASK state (§13 — context carries identifiers only)
    await page.evaluate(() => {
      (window as any).__ctx = null;
      window.addEventListener('cosmictantra:kashi-journey-context', (e: any) => {
        (window as any).__ctx = e.detail;
      });
    });
    await page.getByRole('button', { name: /ASK ABOUT THIS/i }).click();
    await page.waitForTimeout(500);
    const ctx = await page.evaluate(() => (window as any).__ctx);
    expect(ctx).toBeTruthy();
    for (const forbidden of ['personName', 'birthDate', 'birthTime', 'latitude', 'longitude', 'locationName']) {
      expect(JSON.stringify(ctx)).not.toContain(forbidden);
    }
    await capture(page, 'ask-state-390');
  });

  test('Today + mobile nav + desktop Explore captures', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    await noHorizontalOverflow(page, 'daily-360');
    await capture(page, 'today-360');
    await capture(page, 'mobile-nav-360');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await capture(page, 'desktop-landing-1440');

    // Desktop Explore (workspace deep-explorer surface, §7)
    await page.goto(`${BASE}/kundli/gandhi-1869`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="kundli-first-insight"]')).toBeVisible({ timeout: 20_000 });
    await page.locator('#kundli-explore').scrollIntoViewIfNeeded();
    await capture(page, 'desktop-explore-1440');
  });
});

test.describe('C.1 — persistence state machine (§4)', () => {
  test('save failure → SAVE_FAILED, retry → SAVED (never premature "saved")', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await heroHydrated(page);
    await page.locator('#kundli-name').fill('Persistence Tester');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-dob').fill('1988-03-03');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-tob').fill('14:20');
    await page.getByRole('radio', { name: 'Exact' }).check();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-place').fill('Delhi');
    await page.locator('#kundli-city-list button').first().click();
    const nav = page.waitForURL(/\/kundli\//, { timeout: 30000 });
    await page.getByRole('button', { name: /CREATE MY KUNDLI/i }).click();
    await nav;

    await expect(page.locator('[data-testid="kundli-ready"]')).toHaveText(/YOUR KUNDLI IS READY/i);
    await expect(page.locator('[data-testid="save-kundli"]')).toBeVisible();
    // No "SAVED TO MY SPACE ✓" claim before the user explicitly saves (§4).
    await expect(page.locator('[data-testid="save-kundli-done"]')).toHaveCount(0);

    // Force persistence failure
    await page.evaluate(() => {
      const orig = Storage.prototype.setItem;
      (window as any).__origSetItem = orig;
      Storage.prototype.setItem = () => { throw new Error('quota'); };
    });
    await page.locator('[data-testid="save-kundli"]').click();
    await expect(page.locator('[data-testid="save-failed"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-kundli-done"]')).toHaveCount(0);

    // Restore and retry
    await page.evaluate(() => {
      Storage.prototype.setItem = (window as any).__origSetItem;
    });
    await page.locator('[data-testid="save-kundli"]').click();
    await expect(page.locator('[data-testid="save-kundli-done"]')).toHaveText(/SAVED TO MY SPACE/i);
  });
});

test.describe('C.1 — time certainty (§11)', () => {
  test('UNKNOWN time shows limitation note and never claims noon authority', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await heroHydrated(page);
    await page.locator('#kundli-name').fill('Noon Tester');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-dob').fill('1979-07-07');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('label:has(input[value="UNKNOWN"])').click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-place').fill('Mumbai');
    await page.locator('#kundli-city-list button').first().click();
    const nav = page.waitForURL(/\/kundli\//, { timeout: 30000 });
    await page.getByRole('button', { name: /CREATE MY KUNDLI/i }).click();
    await nav;

    await expect(page.locator('[data-testid="time-sensitivity-note"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-sensitivity-note"]')).toContainText(/not authoritative|reference only/i);
    await expect(page.locator('[data-testid="insight-lagna"]')).toContainText(/reference only/i);
    await noHorizontalOverflow(page, 'unknown-time-390');
  });
});

test.describe('C.1 — location UX (§10): GPS allowed / denied, manual fallback', () => {
  async function fillBirthSteps(page: Page) {
    await page.locator('#kundli-name').fill('GPS Tester');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-dob').fill('1992-02-20');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-tob').fill('08:45');
    await page.getByRole('radio', { name: 'Exact' }).check({ force: true });
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }

  test('GPS allowed: truthful live anchor (never a fake city); journey completes', async ({ page, context }) => {
    await context.grantPermissions(['geolocation'], { origin: BASE });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await heroHydrated(page);
    await context.setGeolocation({ latitude: 25.5941, longitude: 85.1376 });

    await fillBirthSteps(page);
    await page.getByRole('button', { name: /use my current location/i }).click();
    await expect(page.locator('#kundli-place')).toHaveValue(/Live GPS Location/i);
    await expect(page.locator('#kundli-place')).not.toHaveValue(/Dhanbad|Patna|Delhi|Mumbai/i);
    await expect(page.getByText(/location permission was not granted/i)).toHaveCount(0);

    const nav = page.waitForURL(/\/kundli\//, { timeout: 30000 });
    await page.getByRole('button', { name: /CREATE MY KUNDLI/i }).click();
    await nav;
    await expect(page.locator('[data-testid="kundli-first-insight"]')).toBeVisible({ timeout: 20_000 });
  });

  test('GPS denied: explicit calm message; manual canonical city still works', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await heroHydrated(page);

    await fillBirthSteps(page);
    await page.getByRole('button', { name: /use my current location/i }).click();
    await expect(page.getByText(/location permission was not granted/i)).toBeVisible();

    // Manual city search remains the canonical fallback — no silent location.
    await page.locator('#kundli-place').fill('Patna');
    await page.locator('#kundli-city-list button').first().click();
    expect(await page.locator('#kundli-place').inputValue()).toContain('Patna');
    const nav = page.waitForURL(/\/kundli\//, { timeout: 30000 });
    await page.getByRole('button', { name: /CREATE MY KUNDLI/i }).click();
    await nav;
    await expect(page.locator('[data-testid="kundli-first-insight"]')).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('C.1 — demo contamination & language (§2, §3)', () => {
  test('daily page: neutral member state + "Your Next Three Vedic Days"', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('cosmictantra_profiles');
      localStorage.removeItem('cosmictantra_active_profile');
      localStorage.removeItem('cosmictantra_active_kundli');
    });
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    await dailyHydrated(page);
    await expect(page.locator('[data-testid="daily-no-member"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Your Next Three Vedic Days/i })).toBeVisible();
    await expect(page.getByText(/72-Hour|Daily \(72 Hours\)/i)).toHaveCount(0);
    await expect(page.getByText('Priya Sharma')).toHaveCount(0);
  });

  test('consumer profile pages never fabricate a demo user', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('cosmictantra_profiles');
      localStorage.removeItem('cosmictantra_active_profile');
    });
    for (const route of ['/dashboard', '/family-panchang', '/family', '/profile']) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Priya Sharma')).toHaveCount(0);
      await expect(page.getByText('Amit Sharma')).toHaveCount(0);
    }
    await page.goto(`${BASE}/family`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="family-id-placeholder"]')).toBeVisible();
    await page.goto(`${BASE}/family-panchang`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="family-empty-state"]')).toBeVisible();
    await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' });
    await profileHydrated(page);
    await page.getByRole('button', { name: /ई-पूजा व सामग्री ऑर्डर इतिहास/ }).click();
    await expect(page.locator('[data-testid="orders-empty-state"]')).toBeVisible();
  });
});
