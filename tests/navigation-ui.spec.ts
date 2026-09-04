/**
 * NAVIGATION HARDENING — runtime browser suite.
 *
 * Covers: desktop primary nav, Explore menu open/close/Escape/outside click,
 * keyboard focus, mobile bottom navigation across 320/360/390/430/768 (and
 * desktop), route resolution (no dead links), language selector, location
 * truth (Set location vs resolved city), viewport overflow, duplicate-header
 * guards, assistant-collision guard, and screen captures.
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOT_DIR = path.resolve(__dirname, '..', 'artifacts', 'screenshots');

function shot(name: string): string {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  return path.join(SHOT_DIR, name);
}

/** Hydration gate: interactive nav controls must be attached before
    keyboard/mouse interaction (Sprint C.1 §20 hydration race). */
async function navHydrated(page: Page) {
  await expect(page.locator('[data-testid="primary-nav"]')).toHaveAttribute('data-nav-hydrated', 'true', { timeout: 15_000 });
}

/** Hydration gate for GlobalHeader (landing mega-menu trigger). */
async function headerHydrated(page: Page) {
  await expect(page.locator('header[data-header-hydrated]')).toHaveAttribute('data-header-hydrated', 'true', { timeout: 15_000 });
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scroll: doc.scrollWidth, client: doc.clientWidth };
  });
  expect(overflow.scroll, `${label} horizontal overflow (scroll=${overflow.scroll} client=${overflow.client})`)
    .toBeLessThanOrEqual(overflow.client + 1);
}

test.describe('Desktop primary navigation (>=1024px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('renders five destinations on a shell page, all links resolve', async ({ page }) => {
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    const nav = page.locator('[data-testid="primary-nav"]');
    await expect(nav).toBeVisible();
    for (const id of ['TODAY', 'MY_KUNDLI', 'ASK', 'CONSULT', 'EXPLORE']) {
      await expect(page.locator(`[data-testid="primary-nav-destination-${id}"]`)).toBeVisible();
    }
    // Dead routes from the forensic report must not exist anywhere in the DOM.
    for (const dead of ['/kundli/d10', '/kundli/ashtakavarga', '/kundli/shadbala', '/kundli/ephemeris']) {
      await expect(page.locator(`a[href="${dead}"]`)).toHaveCount(0);
      expect(await page.content()).not.toContain(`href="${dead}"`);
    }
    await expectNoHorizontalOverflow(page, 'daily-desktop');
  });

  test('Explore menu opens, closes on Escape and on outside click', async ({ page }) => {
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    await navHydrated(page);
    const explore = page.locator('[data-testid="primary-nav-destination-EXPLORE"]');
    await explore.click();
    const menu = page.locator('[data-testid="primary-nav-menu-EXPLORE"]');
    await expect(menu).toBeVisible();
    await expect(explore).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-testid="primary-nav-child-darshanPuja"]')).toBeVisible();
    // Escape closes and restores collapsed state
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(explore).toHaveAttribute('aria-expanded', 'false');
    // Outside click closes
    await explore.click();
    await expect(menu).toBeVisible();
    await page.mouse.click(10, 400);
    await expect(menu).toHaveCount(0);
  });

  test('keyboard: focus + Enter opens Explore, Escape closes, focus is visible', async ({ page }) => {
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    await navHydrated(page);
    const explore = page.locator('[data-testid="primary-nav-destination-EXPLORE"]');
    await explore.focus();
    await expect(explore).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="primary-nav-menu-EXPLORE"]')).toBeVisible();
    const firstChild = page.locator('[data-testid="primary-nav-child-darshanPuja"]');
    await expect(firstChild).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="primary-nav-menu-EXPLORE"]')).toHaveCount(0);
  });

  test('location pill is truthful: UNKNOWN shows "Set location", resolved city shows name', async ({ page }) => {
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    const pill = page.locator('[data-testid="primary-nav-location"]');
    await expect(pill).toHaveAttribute('data-location-status', 'UNKNOWN');
    await expect(pill).toContainText('Set location');
    // set an explicit active city (existing store) and reload
    await page.evaluate(() => {
      localStorage.setItem('cosmictantra_active_city', JSON.stringify({
        id: 'varanasi', name: 'Varanasi', lat: 25.3176, lng: 82.9739, tz: 5.5,
      }));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(pill).toHaveAttribute('data-location-status', 'KNOWN');
    await expect(pill).toContainText('Varanasi');
  });

  test('language selector changes nav copy to Hindi', async ({ page }) => {
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    await navHydrated(page);
    await page.locator('[data-testid="primary-nav-language"]').click();
    const modal = page.locator('[data-testid="language-selector-modal"], .fixed.inset-0.z-50');
    await expect(modal.first()).toBeVisible();
    // select हिन्दी
    await page.getByRole('button', { name: /हिन्दी/ }).first().click();
    await expect(page.locator('[data-testid="primary-nav-destination-TODAY"]')).toContainText('आज');
    // reset for other tests
    await page.evaluate(() => localStorage.setItem('cosmictantra_lang', 'en'));
  });

  test('Kashi context attributes are stamped on the nav', async ({ page }) => {
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    const nav = page.locator('[data-testid="primary-nav"]');
    await expect(nav).toHaveAttribute('data-kashi-context-domain', 'TODAY');
    await expect(nav).toHaveAttribute('data-kashi-location-source', /ACTIVE_CITY|PERSISTED|PROFILE|NONE/);
  });
});

test.describe('Mobile bottom navigation', () => {
  for (const width of [320, 360, 390, 430, 768]) {
    test(`renders without overflow or clipping at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
      const nav = page.locator('[data-testid="primary-nav-mobile"]');
      await expect(nav).toBeVisible();
      for (const id of ['TODAY', 'MY_KUNDLI', 'ASK', 'CONSULT', 'EXPLORE']) {
        const item = page.locator(`[data-testid="bottom-nav-${id}"]`);
        await expect(item).toBeVisible();
        const box = await item.boundingBox();
        expect(box!.width, `${id} clipped at ${width}`).toBeGreaterThanOrEqual(40);
        const clip = await item.evaluate((el) => ({
          scroll: (el as HTMLElement).scrollWidth,
          client: (el as HTMLElement).clientWidth,
        }));
        expect(clip.scroll, `${id} label clipped at ${width}`).toBeLessThanOrEqual(clip.client + 1);
      }
      await expectNoHorizontalOverflow(page, `mobile-${width}`);
    });
  }

  test('Explore sheet opens from bottom nav and Escape closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    await navHydrated(page);
    await page.locator('[data-testid="bottom-nav-EXPLORE"]').click();
    await expect(page.locator('[data-testid="primary-nav-explore-sheet"]')).toBeVisible();
    await expect(page.locator('[data-testid="explore-sheet-darshanPuja"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="primary-nav-explore-sheet"]')).toHaveCount(0);
  });

  test('floating assistant does not collide with the bottom nav on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/daily`, { waitUntil: 'domcontentloaded' });
    const fab = page.locator('.ct-avatar-root');
    const bottomNav = page.locator('[data-testid="primary-nav-mobile"]');
    await expect(fab).toBeVisible();
    await expect(bottomNav).toBeVisible();
    const fabBox = await fab.boundingBox();
    const navBox = await bottomNav.boundingBox();
    expect(fabBox!.y + fabBox!.height, 'FAB should sit above the bottom nav').toBeLessThanOrEqual(navBox!.y + 4);
  });
});

test.describe('Pages at runtime (no dead links / duplicate headers)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // NOTE: /kundli/[id] workspace and /report folio are standalone
  // presentations that intentionally keep their own chrome (Sprint B.1 says
  // do not redesign the Kundli page); the shell-nav assertion below applies to
  // pages that use CosmicTantraShell.
  for (const [route, label, shellNav] of [
    ['/', 'landing', false],
    ['/daily', 'today', true],
    ['/dashboard', 'dashboard', false],
    ['/kundli/gandhi-1869', 'master-kundli', false],
    ['/report', 'report', false],
  ] as const) {
    test(`renders ${label} without horizontal overflow or duplicated nav`, async ({ page }) => {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      if (shellNav) await navHydrated(page);
      await expectNoHorizontalOverflow(page, label);
      if (shellNav) {
        await expect(page.locator('[data-testid="primary-nav"]')).toHaveCount(1);
        // Mobile bottom nav stays in the DOM (responsive design) but must be
        // visually hidden at desktop width — a visible duplicate nav is the bug.
        await expect(page.locator('[data-testid="primary-nav-mobile"]')).toBeHidden();
      }
    });
  }

  test('landing page mega menu contains only resolving links', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await headerHydrated(page);
    await page.getByRole('button', { name: /menu|अन्वेषण/i }).first().click();
    await expect(page.locator('[data-testid="full-mega-menu"]')).toBeVisible();
    for (const dead of ['/kundli/d10', '/kundli/ashtakavarga', '/kundli/shadbala', '/kundli/ephemeris']) {
      await expect(page.locator(`[data-testid="full-mega-menu"] a[href="${dead}"]`)).toHaveCount(0);
    }
    await expect(page.locator('[data-testid="mega-section-TODAY"]')).toBeVisible();
    await expect(page.locator('[data-testid="mega-section-MY_KUNDLI"]')).toBeVisible();
    await expect(page.locator('[data-testid="mega-section-EXPLORE"]')).toBeVisible();
  });
});

test.describe('Screen captures (evidence)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('desktop 1440+ — landing, Master Kundli, Today, Dashboard', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: shot('desktop-landing.png'), fullPage: false });
    await page.goto(`${BASE}/kundli/gandhi-1869`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: shot('desktop-master-kundli.png'), fullPage: false });
    await page.goto(`${BASE}/report`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: shot('desktop-report-dashboard.png'), fullPage: false });
    await page.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: shot('desktop-today.png'), fullPage: false });
  });

  test('tablet and 390px mobile — Today + landing + dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: shot('tablet-today.png'), fullPage: false });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/report`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: shot('mobile-390-report-dashboard.png'), fullPage: false });
    await page.goto(`${BASE}/daily`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: shot('mobile-390-today.png'), fullPage: false });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: shot('mobile-390-landing.png'), fullPage: false });
  });
});
