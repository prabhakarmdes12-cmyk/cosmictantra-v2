import { test, expect, request as playwrightRequest, APIRequestContext } from '@playwright/test';

/**
 * HTTP-level verification of the reader through the real chat route.
 *
 * Deterministic (no LLM, no audio). These tests need a running server:
 *   npx next start -H 0.0.0.0 -p 3000   (or BASE_URL=https://… npx playwright test …)
 * When no server answers they skip rather than fail, and the skip is reported
 * as NOT RUN — this is a live-route check, not a substitute for the unit-level
 * session tests in tests/granth-reading-session.spec.ts.
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

async function chat(api: APIRequestContext, message: string, readingSession?: unknown) {
  const response = await api.post('/api/guru/chat', {
    data: { message, history: [], context: { lang: 'hi', city: 'Varanasi', readingSession } },
  });
  expect(response.status(), 'chat route status').toBe(200);
  return (await response.json()) as {
    text: string;
    intent: string;
    provenance: { type: string };
    readingSession?: any;
    cancelledReadingTokens?: string[];
    structuredCard?: { granthReadCard?: { found: boolean; code?: string; passages?: any[]; session?: any } };
  };
}

test.beforeAll(async () => {
  const api = await playwrightRequest.newContext({ baseURL: BASE_URL });
  try {
    const res = await api.get('/api/guru/chat');
    // Any HTTP response means a server is listening; the route itself is POST-only.
    expect([400, 404, 405].includes(res.status()) || res.status() >= 200).toBeTruthy();
  } catch (error) {
    test.skip(true, `No server answering on ${BASE_URL} — start it and re-run to execute the live-route checks.`);
  } finally {
    await api.dispose();
  }
});

test('live route: chapter read -> pause -> explain -> resume keeps the cursor', async ({ request: _unused }) => {
  const api = await playwrightRequest.newContext({ baseURL: BASE_URL });

  const started = await chat(api, 'गीता अध्याय २ पढ़ो');
  expect(started.intent).toBe('GRANTH_READ');
  expect(started.provenance.type).toBe('SOURCE_DOCUMENTED');
  expect(started.structuredCard?.granthReadCard?.found).toBe(true);
  expect(started.readingSession?.state).toBe('reading');
  expect(started.readingSession?.queueLength ?? started.readingSession?.queue?.length).toBeGreaterThan(70);
  const cursorAtStart = started.readingSession?.cursorIndex;

  const paused = await chat(api, 'रुको', started.readingSession);
  expect(paused.readingSession?.state).toBe('paused');
  expect(paused.readingSession?.cursorIndex).toBe(cursorAtStart);
  expect(paused.cancelledReadingTokens).toContain(started.readingSession?.cancellationToken);

  const explained = await chat(api, 'यह समझाओ', paused.readingSession);
  expect(explained.readingSession?.cursorIndex).toBe(cursorAtStart);
  expect(explained.text).toContain('संग्रहीत भावार्थ');

  const resumed = await chat(api, 'आगे पढ़ो', explained.readingSession);
  expect(resumed.readingSession?.state).toBe('reading');
  expect(resumed.readingSession?.cursorIndex).toBe(cursorAtStart);
  expect(resumed.structuredCard?.granthReadCard?.found).toBe(true);

  await api.dispose();
});

test('live route: exact verse, source citation and refusal of an invalid reference', async () => {
  const api = await playwrightRequest.newContext({ baseURL: BASE_URL });

  const verse = await chat(api, 'गीता २.४७ सुनाओ');
  expect(verse.text).toContain('कर्मण्येवाधिकारस्ते');
  expect(verse.structuredCard?.granthReadCard?.passages?.[0]?.checksum).toMatch(/^[0-9a-f]{64}$/);

  const cited = await chat(api, 'ये कहाँ लिखा है?', verse.readingSession);
  expect(cited.text).toContain('ct-gita-bundled-devanagari-hi');
  expect(cited.text).toContain('gita-ch-2');

  const invalid = await chat(api, 'गीता 18.93 पढ़ो');
  expect(invalid.text).toContain('शास्त्र प्रामाणिक सूचना');
  expect(invalid.structuredCard?.granthReadCard?.code).not.toBe('FOUND');

  await api.dispose();
});

test('live route: a tampered client session is rejected, not trusted', async () => {
  const api = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const started = await chat(api, 'गीता अध्याय १२ पढ़ो');
  const tampered = { ...started.readingSession, bookId: 'invented-book' };
  // The gateway must ignore the tampered session and treat the request as new.
  const next = await chat(api, 'आगे पढ़ो', tampered);
  expect(next.readingSession?.bookId).not.toBe('invented-book');
  await api.dispose();
});

test('live route: "आगे पढ़ो" reads on while reading, and resumes after a pause', async () => {
  const api = await playwrightRequest.newContext({ baseURL: BASE_URL });

  const started = await chat(api, 'गीता अध्याय १२ पढ़ो');
  expect(started.readingSession?.state).toBe('reading');
  const firstId = started.structuredCard?.granthReadCard?.passages?.[0]?.passageId;

  // While a reading is in progress the same command must move to the NEXT
  // stored passage, not repeat the one that was just read.
  const advanced = await chat(api, 'आगे पढ़ो', started.readingSession);
  expect(advanced.readingSession?.cursorIndex).toBe((started.readingSession?.cursorIndex ?? 0) + 1);
  expect(advanced.structuredCard?.granthReadCard?.found).toBe(true);
  expect(advanced.structuredCard?.granthReadCard?.passages?.[0]?.passageId).not.toBe(firstId);

  // After a pause the same command resumes the interrupted passage.
  const paused = await chat(api, 'रुको', advanced.readingSession);
  expect(paused.readingSession?.state).toBe('paused');
  const resumed = await chat(api, 'आगे पढ़ो', paused.readingSession);
  expect(resumed.readingSession?.cursorIndex).toBe(advanced.readingSession?.cursorIndex);
  expect(resumed.structuredCard?.granthReadCard?.passages?.[0]?.passageId).toBe(
    advanced.structuredCard?.granthReadCard?.passages?.[0]?.passageId,
  );

  await api.dispose();
});

test('live route: a tampered session (cursor, edition, state, speed) is rejected', async () => {
  const api = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const started = await chat(api, 'गीता अध्याय १२ पढ़ो');
  const good = started.readingSession!;
  const tamperedVariants: Array<Record<string, unknown>> = [
    { ...good, cursorIndex: -3 },
    { ...good, cursorIndex: 99_999 },
    { ...good, editionId: 'ct-gita-forged-2026' },
    { ...good, state: 'singing' },
    { ...good, speed: 42 },
    { ...good, chunkIndex: -1 },
  ];

  for (const tampered of tamperedVariants) {
    const next = await chat(api, 'आगे पढ़ो', tampered);
    // A rejected session yields no stored passage and no echoed forgery.
    expect(next.structuredCard?.granthReadCard?.found ?? false, JSON.stringify(tampered)).toBe(false);
    expect(next.provenance.type, JSON.stringify(tampered)).toBe('AI_EXPLANATION');
    expect(JSON.stringify(next), JSON.stringify(tampered)).not.toContain('ct-gita-forged-2026');
  }

  await api.dispose();
});
