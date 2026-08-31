import { test, expect } from '@playwright/test';

/**
 * Browser-level reader flow: read → pause → explain → resume → advance.
 *
 * This is the flow a person performs, driven through the real chat UI
 * (Kashi Sahayak avatar), not through the API. It needs a browser:
 *
 *   npx playwright install chromium            (or CHROMIUM_PATH=… )
 *   npx next start -H 0.0.0.0 -p 3000
 *   npx playwright test tests/granth-reader-browser.spec.ts
 *
 * When no browser is available the suite SKIPS and reports NOT RUN — it never
 * fakes a pass.
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const SESSION_KEY = 'cosmictantra_granth_reading_session_v1';

test.beforeEach(async ({ page }, testInfo) => {
  let api: any;
  try {
    api = await (await import('@playwright/test')).request.newContext({ baseURL: BASE_URL });
    await api.get('/api/guru/chat');
  } catch {
    test.skip(true, `No server answering on ${BASE_URL} — start it and re-run.`);
  } finally {
    await api?.dispose();
  }
  // Every test starts with no saved reading position. This must clear ONCE, not
  // on every navigation: the second test reloads the page on purpose to check
  // that the saved position is restored.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((key) => {
    try {
      window.localStorage.removeItem(key as string);
    } catch {
      /* storage blocked — the flow still works in memory */
    }
  }, SESSION_KEY);
});

async function openChat(page: any) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('button:has(img[alt="Kashi Sahayak Avatar"])').first().click();
  await expect(page.getByPlaceholder('मन की बात')).toBeVisible({ timeout: 15_000 });
}

async function send(page: any, text: string) {
  const input = page.getByPlaceholder('मन की बात');
  await input.fill(text);
  await page.locator('form button[type="submit"]').click();
}

/** The session the client persisted — the reader's source of truth in the UI. */
async function savedSession(page: any): Promise<any> {
  return page.evaluate((key: string) => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, SESSION_KEY);
}

async function waitForCursor(page: any, cursor: number) {
  await expect
    .poll(async () => (await savedSession(page))?.cursorIndex, {
      message: `reading cursor should reach ${cursor}`,
      timeout: 30_000,
    })
    .toBe(cursor);
}

test('browser: read → pause → explain → resume, then continue reads the next passage', async ({ page }) => {
  test.slow();
  await openChat(page);

  // 1. READ — a stored chapter, quoted from the edition.
  await send(page, 'गीता अध्याय १२ पढ़ो');
  await expect(page.getByText('अध्याय पंक्ति तैयार', { exact: false })).toBeVisible({ timeout: 30_000 });
  const started = await savedSession(page);
  expect(started?.state).toBe('reading');
  expect(started?.cursorIndex).toBe(0);
  expect(started?.queue?.length).toBeGreaterThan(10);

  // 2. PAUSE — and prove the chip sends its own command even though the input
  //    still holds unrelated text (the stale-input defect).
  const input = page.getByPlaceholder('मन की बात');
  await input.fill('यह पाठ मत भेजना');
  // The pause chip. With the stale-input defect this click would send the
  // typed text above instead of the chip's own command.
  await page.locator('button:has-text("रोकें")').last().click();
  await expect(page.getByText('रोका गया', { exact: false })).toBeVisible({ timeout: 30_000 });
  // The typed text must never have been sent as a user message.
  await expect(page.getByText('यह पाठ मत भेजना', { exact: true })).toHaveCount(0);
  const paused = await savedSession(page);
  expect(paused?.state).toBe('paused');
  expect(paused?.cursorIndex).toBe(0);

  // 3. EXPLAIN — stored meaning plus the assistant's own explanation.
  await page.locator('button:has-text("समझाएं")').last().click();
  await expect(page.getByText('संग्रहीत भावार्थ', { exact: false })).toBeVisible({ timeout: 30_000 });
  const explained = await savedSession(page);
  expect(explained?.cursorIndex).toBe(0);

  // 4. RESUME — the interrupted passage is read again, cursor unchanged.
  await page.locator('button:has-text("आगे पढ़ो")').last().click();
  await waitForCursor(page, 0);
  const resumed = await savedSession(page);
  expect(resumed?.state).toBe('reading');

  // 5. CONTINUE while reading — the NEXT stored passage, not a repeat.
  await page.locator('button:has-text("आगे पढ़ो")').last().click();
  await waitForCursor(page, 1);
  const advanced = await savedSession(page);
  expect(advanced?.state).toBe('reading');
  expect(advanced?.cursorIndex).toBe(1);
  // The passage now on screen is different from the one that was resumed.
  await expect(page.getByText('भावार्थ', { exact: false }).last()).toBeVisible();
});

test('browser: the reading position survives a reload (device-local)', async ({ page }) => {
  test.slow();
  await openChat(page);

  await send(page, 'गीता अध्याय १२ पढ़ो');
  await expect(page.getByText('अध्याय पंक्ति तैयार', { exact: false })).toBeVisible({ timeout: 30_000 });
  const started = await savedSession(page);
  expect(started?.cursorIndex).toBe(0);

  // "आगे पढ़ो" while reading advances one stored passage at a time.
  await page.locator('button:has-text("आगे पढ़ो")').last().click();
  await waitForCursor(page, 1);
  await page.locator('button:has-text("आगे पढ़ो")').last().click();
  await waitForCursor(page, 2);

  const before = await savedSession(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('button:has(img[alt="Kashi Sahayak Avatar"])').first().click();
  await expect(page.getByPlaceholder('मन की बात')).toBeVisible({ timeout: 15_000 });

  const after = await savedSession(page);
  expect(after?.sessionId).toBe(before?.sessionId);
  expect(after?.cursorIndex).toBe(2);

  // And the server still accepts the restored session for the next passage.
  await page.locator('button:has-text("आगे पढ़ो")').last().click();
  await waitForCursor(page, 3);
});
