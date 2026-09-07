/**
 * Calendar Paksha "hero mood" — BROWSER suite (requires a real browser).
 *
 * Separated from the pure regression spec (`calendar-paksha-hero-mood.spec.ts`)
 * because it needs a Chromium runtime and a live server. Run in the local or
 * CI release-review environment where Playwright browsers are installed:
 *
 *   npx playwright test tests/calendar-paksha-hero-mood-browser.spec.ts --workers=1
 *
 * Verifies the /calendar today-view hero banner against the engine's paksha
 * computed "now" for Varanasi (the page's default city).
 */

import { test, expect } from '@playwright/test';
import { calculatePanchang } from '../src/lib/panchang.js';

const VARANASI = { lat: 25.3176, lng: 82.9739, tz: 5.5, name: 'Varanasi' };

test.describe('UnifiedPanchangCalendar /calendar?view=today — hero banner seal matches the engine', () => {
  test('seal text and tithi shown match the paksha computed by the engine for Varanasi "now"', async ({ page }) => {
    await page.goto('/calendar?view=today', { waitUntil: 'domcontentloaded' });

    // Banner seal (visible only in the today view) carries the paksha claim.
    const seal = page.getByText(/🪔 शुभ रात्रि 🙏|☀️ शुभ दिवस 🙏|🙏 शुभ दिन/).first();
    await expect(seal).toBeVisible();

    const sealText = (await seal.innerText()).toLowerCase();

    // Compute expectation from the same engine on (approximately) the same instant.
    const expected = calculatePanchang(new Date(), VARANASI);
    const isKrishnaNow = expected.tithi.paksha === 'Krishna Paksha';

    if (isKrishnaNow) {
      expect(sealText).toContain('कृष्ण पक्ष');
      expect(sealText).not.toContain('शुक्ल पक्ष');
    } else {
      expect(sealText).toContain('शुक्ल पक्ष');
      expect(sealText).not.toContain('कृष्ण पक्ष');
    }

    // The visible tithi is the qualified fullName ("Krishna Paksha Dwadashi"),
    // never a bare ambiguous tithi name.
    await expect(page.getByText(expected.tithi.fullName, { exact: false }).first()).toBeVisible();

    // Krishna days render the indigo hero banner, Shukla days the marigold one.
    const banner = seal.locator('xpath=ancestor::div[contains(@class,"rounded-3xl")][1]');
    const bannerClass = (await banner.getAttribute('class')) || '';
    if (isKrishnaNow) {
      expect(bannerClass).toContain('bg-[#0A0E24]');
    } else {
      expect(bannerClass).toContain('bg-white');
    }
  });
});
