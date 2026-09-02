/**
 * DARSHAN OFFERINGS — the four ritual actions, and the removals around them.
 *
 * The darshan stage offers four offerings — घण्टी (bell), शंख (conch), पुष्प
 * अर्पण (flowers) and दीपदान (deep daan) — and each one must actually SOUND:
 * the bell through chitiAudio's bell sample, the conch through the conch, the
 * flowers through the petal-fall cue and the diya through the lamp cue. A
 * silent ritual button is a dead button.
 *
 * Two controls were removed on purpose and must stay removed: the image/video
 * fallback toggle (darshan is video-first; the toggle invited seekers to
 * "switch back" to a still photo of a live stream) and the standalone mute
 * button (the embedded player carries its own volume control, and autoplay is
 * muted by browser policy regardless). The source-contract tests pin both
 * removals so a future merge cannot quietly resurrect them.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { browserAvailable, BROWSER_SKIP_REASON } from './support/browserAvailable';

const PAGE = path.join(process.cwd(), 'src/app/darshan/page.tsx');
const source = fs.readFileSync(PAGE, 'utf8');

test.describe('DO — the four offerings are wired to their sounds', () => {
  const handlers: Array<[string, string, string]> = [
    ['handleRingBell', 'playBell', 'घण्टी'],
    ['handleBlowShankh', 'playConch', 'शंख'],
    ['handleOfferFlowers', 'playFlowerDrop', 'पुष्प अर्पण'],
    ['handleLightDiya', 'playDiya', 'दीपदान'],
  ];

  for (const [handler, cue, label] of handlers) {
    test(`${label}: ${handler} triggers ${cue}`, () => {
      const body = source.match(new RegExp(`const ${handler} = \\(\\) => \\{([\\s\\S]*?)\\n  \\};`));
      expect(body, `${handler} exists`).toBeTruthy();
      expect(body![1]).toContain(`${cue}();`);
      // and the dock button actually calls the handler
      expect(source).toMatch(new RegExp(`onClick=\\{${handler}\\}`));
    });
  }

  test('the cues come from the shared sensory module, not per-page audio tags', () => {
    expect(source).toContain("from '@/lib/chitiAudio'");
    for (const cue of ['playBell', 'playConch', 'playFlowerDrop', 'playDiya']) {
      expect(source).toContain(cue);
    }
    expect(source).not.toMatch(/<audio/);
  });
});

test.describe('DO — the removals stay removed', () => {
  test('no image/video fallback toggle: darshan is video-first', () => {
    expect(source).not.toContain('साक्षात् छवि');
    expect(source).not.toContain('setDisplayMode');
    expect(source).not.toContain('displayMode');
    expect(source).not.toContain('imgLoadError');
  });

  test('no standalone mute button: the embedded player owns its volume', () => {
    expect(source).not.toContain('ध्वनि बंद करें (Mute)');
    expect(source).not.toContain('videoSoundOn');
    expect(source).not.toContain('🔇 मूक');
  });

  test('the stream stays an autoplay-muted embed with its own source switcher', () => {
    expect(source).toContain('youtube-nocookie.com/embed');
    expect(source).toContain('autoplay=1&mute=1');
    expect(source).toContain('setVideoStreamSource');
  });
});

test.describe('DO — browser: the offering dock is live', () => {
  test.skip(!browserAvailable(), BROWSER_SKIP_REASON);

  test('all four offering buttons render and are clickable', async ({ page }) => {
    await page.goto('/darshan');
    for (const label of ['घण्टी', 'शंख', 'पुष्प अर्पण', 'दीपदान']) {
      await expect(page.getByRole('button', { name: new RegExp(label) }).first()).toBeVisible();
    }
    await page.getByRole('button', { name: /घण्टी/ }).first().click();
    await page.getByRole('button', { name: /पुष्प अर्पण/ }).first().click();
    // Deep daan latches: the button's own label confirms the lamps are lit.
    const diya = page.getByRole('button', { name: /दीपदान/ }).first();
    await diya.click();
    await expect(page.getByRole('button', { name: /दीपदान प्रज्वलित/ }).first()).toBeVisible();
  });

  test('no image toggle or mute control is present in the HUD', async ({ page }) => {
    await page.goto('/darshan');
    await expect(page.getByRole('button', { name: /साक्षात् छवि/ })).toHaveCount(0);
    await expect(page.getByTitle(/ध्वनि बंद करें/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /वीडियो \/ लाइव/ })).toHaveCount(0);
  });
});
