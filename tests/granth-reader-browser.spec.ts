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

/**
 * Wait until the NEXT turn has actually been persisted.
 *
 * Cursor alone is NOT enough: after a resume the cursor is unchanged, so
 * waiting on it returns immediately and the test can read the PREVIOUS state
 * (the race that made this flow fail intermittently). A completed turn is
 * therefore proved three ways:
 *   1. the session state is the expected one,
 *   2. the cursor is the expected one, and
 *   3. the session was REVISED by a new response — a fresh cancellation token
 *      (rotated on every mutating turn) and a newer updatedAt than the
 *      snapshot taken before the click.
 *
 * Polling only — no arbitrary sleeps.
 */
async function waitForTurn(
  page: any,
  opts: { state: string; cursor: number; changedFrom?: any },
): Promise<any> {
  const previousToken = opts.changedFrom?.cancellationToken;
  const previousUpdatedAt = opts.changedFrom?.updatedAt ?? 0;
  await expect
    .poll(
      async () => {
        const session = await savedSession(page);
        if (!session) return 'waiting: no session yet';
        if (session.state !== opts.state) return `waiting: state=${session.state}`;
        if (session.cursorIndex !== opts.cursor) return `waiting: cursor=${session.cursorIndex}`;
        if (previousToken && session.cancellationToken === previousToken) {
          return 'waiting: session not revised yet (same cancellation token)';
        }
        if (previousToken && !(session.updatedAt > previousUpdatedAt)) {
          return 'waiting: session not revised yet (updatedAt did not advance)';
        }
        return `done: state=${session.state} cursor=${session.cursorIndex} token=${session.cancellationToken}`;
      },
      {
        message: `next turn should be persisted (state=${opts.state}, cursor=${opts.cursor}, revised from ${previousToken ?? 'none'})`,
        timeout: 30_000,
        intervals: [50, 100, 200, 500],
      },
    )
    .toContain('done:');
  return savedSession(page);
}

test('browser: read → pause → explain → resume, then continue reads the next passage', async ({ page }) => {
  test.slow();
  await openChat(page);

  // 1. READ — a stored chapter, quoted from the edition.
  await send(page, 'गीता अध्याय १२ पढ़ो');
  await expect(page.getByText('अध्याय पंक्ति तैयार', { exact: false })).toBeVisible({ timeout: 30_000 });
  const started = await waitForTurn(page, { state: 'reading', cursor: 0 });
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
  const paused = await waitForTurn(page, { state: 'paused', cursor: 0, changedFrom: started });
  expect(paused?.cancellationToken).not.toBe(started?.cancellationToken);

  // 3. EXPLAIN — stored meaning plus the assistant's own explanation.
  await page.locator('button:has-text("समझाएं")').last().click();
  await expect(page.getByText('संग्रहीत भावार्थ', { exact: false })).toBeVisible({ timeout: 30_000 });
  const explained = await waitForTurn(page, { state: 'paused', cursor: 0, changedFrom: paused });
  expect(explained?.cancellationToken).not.toBe(paused?.cancellationToken);

  // 4. RESUME — the interrupted passage is read again: cursor stays 0, so the
  //    wait must prove a NEW turn (revised token), not just cursor === 0.
  await page.locator('button:has-text("आगे पढ़ो")').last().click();
  const resumed = await waitForTurn(page, { state: 'reading', cursor: 0, changedFrom: explained });
  expect(resumed?.cancellationToken).not.toBe(explained?.cancellationToken);

  // 5. CONTINUE while reading — the NEXT stored passage, not a repeat.
  await page.locator('button:has-text("आगे पढ़ो")').last().click();
  const advanced = await waitForTurn(page, { state: 'reading', cursor: 1, changedFrom: resumed });
  expect(advanced?.cancellationToken).not.toBe(resumed?.cancellationToken);
  // The passage now on screen is different from the one that was resumed.
  await expect(page.getByText('भावार्थ', { exact: false }).last()).toBeVisible();
});

test('browser: the reading position survives a reload (device-local)', async ({ page }) => {
  test.slow();
  await openChat(page);

  await send(page, 'गीता अध्याय १२ पढ़ो');
  await expect(page.getByText('अध्याय पंक्ति तैयार', { exact: false })).toBeVisible({ timeout: 30_000 });
  const started = await waitForTurn(page, { state: 'reading', cursor: 0 });

  // "आगे पढ़ो" while reading advances one stored passage at a time.
  await page.locator('button:has-text("आगे पढ़ो")').last().click();
  const first = await waitForTurn(page, { state: 'reading', cursor: 1, changedFrom: started });
  await page.locator('button:has-text("आगे पढ़ो")').last().click();
  const before = await waitForTurn(page, { state: 'reading', cursor: 2, changedFrom: first });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('button:has(img[alt="Kashi Sahayak Avatar"])').first().click();
  await expect(page.getByPlaceholder('मन की बात')).toBeVisible({ timeout: 15_000 });

  const after = await savedSession(page);
  expect(after?.sessionId).toBe(before?.sessionId);
  expect(after?.cursorIndex).toBe(2);

  // And the server still accepts the restored session for the next passage.
  await page.locator('button:has-text("आगे पढ़ो")').last().click();
  const afterReload = await waitForTurn(page, { state: 'reading', cursor: 3, changedFrom: before });
  expect(afterReload?.cancellationToken).not.toBe(before?.cancellationToken);
});
