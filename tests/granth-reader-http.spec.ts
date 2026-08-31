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
