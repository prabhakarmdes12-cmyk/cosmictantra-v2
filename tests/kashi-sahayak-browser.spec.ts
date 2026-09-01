/**
 * KASHI SAHAYAK — real-browser companion tests.
 *
 * Waiting discipline (per the owner's correction): every wait after an
 * action must prove the NEW state completed — a session revision bump plus
 * the expected visible element. No arbitrary sleeps anywhere in this file.
 * A green run therefore carries information: it cannot pass by reading state
 * that was already true before the action.
 */
import { test, expect, type Page } from '@playwright/test';
import { GRANTHS_DATA } from '../src/lib/granth/libraryData';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

/** Reads the companion's monotone revision counter. */
async function revision(page: Page): Promise<number> {
  const el = page.locator('[data-testid="kashi-companion"]');
  const raw = await el.getAttribute('data-revision');
  return Number(raw ?? '0');
}

/**
 * Waits until the revision has advanced beyond `changedFrom`.
 * This is the anti-race guard: a revision only changes when the hook
 * actually applied a new state, so it cannot be satisfied before the action.
 */
async function waitForRevision(page: Page, changedFrom: number, timeout = 10_000): Promise<number> {
  const started = Date.now();
  let last = changedFrom;
  while (Date.now() - started < timeout) {
    last = await revision(page);
    if (last > changedFrom) return last;
    await page.waitForTimeout(50);
  }
  throw new Error(`companion revision did not advance past ${changedFrom} (last seen ${last})`);
}

/** Opens the Kashi Sahayak chat from the homepage avatar. */
async function openCompanion(page: Page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('button[title="काशी सहायक से बात करें"]').first().click();
  await expect(page.locator('[data-testid="kashi-companion"]')).toBeVisible();
  await expect(page.locator('[data-testid="kashi-input"]')).toBeVisible();
  // The emotional check-in chips must be present before we select one.
  await expect(page.getByRole('button', { name: /मन उदास/ }).first()).toBeVisible();
}

/** The sadness mood chip, which maps to the Gaja-Kesari-negative Gita 2.14 path. */
const SAD_CHIP = /मन उदास/;

test.describe('KASHI SAHAYAK — companion in a real browser', () => {
  test('sadness selection shows a verified verse from the canonical store', async ({ page }) => {
    await openCompanion(page);
    const before = await revision(page);

    await page.getByRole('button', { name: SAD_CHIP }).first().click();

    const after = await waitForRevision(page, before);
    expect(after).toBeGreaterThan(before);

    const card = page.locator('[data-testid="kashi-verse-card"]');
    await expect(card).toBeVisible();

    const original = (await page.locator('[data-testid="kashi-verse-original"]').innerText()).trim();
    const source = await page.locator('[data-testid="kashi-verse-source"]').innerText();

    // The verse must exist verbatim in the canonical store.
    const gita: any = (GRANTHS_DATA as any[]).find((b) => b.slug === 'bhagavad-gita');
    const stored: string[] = [];
    for (const sec of gita.sections) for (const v of sec.verses) stored.push((v.sanskrit ?? '').trim());
    expect(stored).toContain(original);

    expect(source).toContain('२-१४');
    // Meaning is rendered separately from the original.
    await expect(page.locator('[data-testid="kashi-verse-meaning"]')).toBeVisible();
    // Autoplay is not assumed: the prominent fallback action is offered.
    await expect(page.locator('[data-testid="kashi-listen-verse"]')).toBeVisible();
  });

  test('conversation-only request produces no verse card', async ({ page }) => {
    await openCompanion(page);
    const before = await revision(page);

    const input = page.locator('[data-testid="kashi-input"]');
    await input.fill('बस मुझसे बात करो');
    await page.locator('[data-testid="kashi-send"]').click();

    await waitForRevision(page, before);
    await expect(page.locator('[data-testid="kashi-verse-card"]')).toHaveCount(0);
  });

  test('crisis language shows safety guidance and no verse', async ({ page }) => {
    await openCompanion(page);
    const before = await revision(page);

    const input = page.locator('[data-testid="kashi-input"]');
    await input.fill('मैं खुदकुशी करने की सोच रही हूँ');
    await page.locator('[data-testid="kashi-send"]').click();

    await waitForRevision(page, before);
    const safety = page.locator('[data-testid="kashi-safety"]');
    await expect(safety).toBeVisible();
    await expect(safety).toContainText('14416');
    await expect(page.locator('[data-testid="kashi-verse-card"]')).toHaveCount(0);
  });

  test('microphone control reports its state and never claims to hear when unsupported', async ({ page }) => {
    await openCompanion(page);

    const mic = page.locator('[data-testid="kashi-mic"]');
    await expect(mic).toBeVisible();

    await mic.click();

    // The control must settle into a definite state, not stay ambiguous.
    await expect(mic).not.toHaveAttribute('data-voice-state', 'idle', { timeout: 10_000 });
    const state = await mic.getAttribute('data-voice-state');
    expect(['listening', 'unsupported', 'unavailable', 'permission-denied', 'network-error', 'uncertain', 'processing'])
      .toContain(state);

    // When speech recognition is unavailable the UI must not claim audio input.
    if (state === 'unsupported' || state === 'unavailable') {
      await expect(page.locator('[data-testid="kashi-voice-message"]')).toContainText('लिखकर');
      // Typing must remain available.
      await expect(page.locator('[data-testid="kashi-input"]')).toBeEnabled();
    }
  });

  test('mute toggles state and is reflected in the companion revision', async ({ page }) => {
    await openCompanion(page);
    const before = await revision(page);
    await page.locator('[data-testid="kashi-mute"]').click();
    const after = await waitForRevision(page, before);
    expect(after).toBeGreaterThan(before);
    await expect(page.locator('[data-testid="kashi-mute"]')).toHaveAttribute('aria-pressed', 'true');
  });
});
