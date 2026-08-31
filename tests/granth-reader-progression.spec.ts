import { test, expect } from '@playwright/test';

/**
 * Review follow-ups on Phase 2 — each test maps to one reported defect:
 *
 *   1. migration baseline (see tests/granth-canonical-library.spec.ts)
 *   2. reader chips must not send stale input
 *   3. speech must drive reading progression, and session speed must apply
 *   4. a client-supplied reading session must be fully validated
 *
 * Tests run offline. Browser rendering of the reader is NOT covered here (no
 * Chromium in this sandbox); the rules that govern it are pinned instead, so a
 * regression fails a test rather than waiting for a device.
 */

import {
  clampSpeed,
  clearServerSessions,
  describePosition,
  explainCurrent,
  moveCursor,
  pauseReading,
  reviveSession,
  reviveVerifiedSession,
  setPreferences,
  shouldAutoAdvance,
  speechRateFor,
  startReading,
  validateSessionShape,
} from '../src/lib/granth/session';
import { handleReaderCommand } from '../src/lib/ai/granthReader';
import * as fs from 'fs';
import * as path from 'path';

test.beforeEach(() => clearServerSessions());

// ---------------------------------------------------------------------------
// 2. Quick chips must not send stale input
// ---------------------------------------------------------------------------

test('reader chips pass their command straight to the sender (no state round trip)', () => {
  // SOURCE-LEVEL GUARD (not a runtime render): the component cannot be mounted
  // without a browser here, so the anti-pattern is pinned in source. Setting
  // React state and reading it in the same tick sends the PREVIOUS value, which
  // is exactly the reported defect.
  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/components/consultation/FloatingAIGuruAvatar.tsx'),
    'utf8',
  );
  expect(source, 'handleSendMessage must accept an explicit command').toContain(
    'const handleSendMessage = async (e?: React.FormEvent, commandText?: string) => {',
  );
  expect(source, 'the sender must prefer the passed command over input state').toContain(
    'const raw = commandText ?? inputVal;',
  );
  expect(source, 'a chip must pass its phrase directly').toContain(
    'void handleSendMessage(undefined, phrase);',
  );
  expect(source, 'the stale setInputVal + setTimeout trick must be gone').not.toContain(
    'setTimeout(() => handleSendMessage(), 0)',
  );
});

// ---------------------------------------------------------------------------
// 3a. Speech drives reading progression (the rule, not the audio)
// ---------------------------------------------------------------------------

test('auto-advance follows the server session state, never a local guess', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 } });
  const total = started.session.queue.length;
  expect(total).toBeGreaterThan(2);

  // Mid-queue, actively reading, a passage was returned → advance.
  expect(shouldAutoAdvance(started.session, 1)).toBe(true);

  // No passage returned (pause / explain / completion) → never advance.
  expect(shouldAutoAdvance(started.session, 0)).toBe(false);

  // Paused stays put.
  const paused = await pauseReading(started.session);
  expect(shouldAutoAdvance(paused.session, 1)).toBe(false);

  // Explain pauses too.
  const explained = await explainCurrent(started.session);
  expect(shouldAutoAdvance(explained.session, 1)).toBe(false);

  // Last queued passage → nothing left to read on.
  const atEnd = await moveCursor(started.session, total - 1);
  expect(shouldAutoAdvance(atEnd.session, 1)).toBe(false);

  // No session at all.
  expect(shouldAutoAdvance(null, 1)).toBe(false);

  // A single-passage reading (one verse) must not auto-continue either.
  const single = await startReading({ bookId: 'gita', scope: { kind: 'verse', chapter: 2, verse: 47 } });
  expect(single.session.queue.length).toBe(1);
  expect(shouldAutoAdvance(single.session, 1)).toBe(false);
});

test('"आगे पढ़ो" advances while reading and resumes after an interruption', async () => {
  const started = await handleReaderCommand('गीता अध्याय २ पढ़ो', 'hi', null);
  const session = started.session!;
  const firstId = started.passages?.[0]?.passageId;
  expect(session.state).toBe('reading');

  // While reading: "continue" must move ON, not repeat what was just spoken.
  const continued = await handleReaderCommand('आगे पढ़ो', 'hi', session);
  expect(continued.session!.cursorIndex).toBe(session.cursorIndex + 1);
  expect(continued.passages?.[0]?.passageId).not.toBe(firstId);
  expect(continued.text).toContain(continued.passages![0].original);

  // After a pause the same words mean "resume here": the interrupted passage
  // is read again from its start, and the cursor does not move.
  const paused = await handleReaderCommand('रुको', 'hi', continued.session!);
  expect(paused.session!.state).toBe('paused');
  const resumed = await handleReaderCommand('आगे पढ़ो', 'hi', paused.session!);
  expect(resumed.session!.cursorIndex).toBe(continued.session!.cursorIndex);
  expect(resumed.passages?.[0]?.passageId).toBe(continued.passages?.[0]?.passageId);

  // Reading past the end completes honestly instead of looping.
  const lastIndex = resumed.session!.queue.length - 1;
  const atEnd = await handleReaderCommand('आगे पढ़ो', 'hi', {
    ...resumed.session!,
    cursorIndex: lastIndex,
    state: 'reading',
  });
  expect(atEnd.session!.state).toBe('completed');
  expect(atEnd.text).toContain('पूरा');
});

// ---------------------------------------------------------------------------
// 3b. Session speed reaches the speech layer
// ---------------------------------------------------------------------------

test('session speed is clamped and handed to the speech layer', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 } });
  expect(speechRateFor(started.session)).toBe(1);

  const slower = setPreferences(started.session, { speed: 0.9 });
  expect(slower.session.speed).toBe(0.9);
  expect(speechRateFor(slower.session)).toBe(0.9);

  // Out-of-range values are clamped, not echoed back.
  expect(setPreferences(started.session, { speed: 0.05 }).session.speed).toBe(0.5);
  expect(setPreferences(started.session, { speed: 9 }).session.speed).toBe(2);
  expect(setPreferences(started.session, { speed: Number.NaN }).session.speed).toBe(1);
  expect(clampSpeed(Number.POSITIVE_INFINITY)).toBe(1);

  // A speed change must not move the reader.
  expect(slower.session.cursorIndex).toBe(started.session.cursorIndex);
  expect(slower.text).toContain('गति');
  expect(describePosition(slower.session)).toBe(describePosition(started.session));
});

test('a reading turn reports the rate the voice should use', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 }, speed: 0.8 });
  expect(speechRateFor(started.session)).toBe(0.8);
  expect(shouldAutoAdvance(started.session, started.passages.length)).toBe(true);
});

// ---------------------------------------------------------------------------
// 4. Client sessions are fully validated
// ---------------------------------------------------------------------------

const TAMPER_CASES: Array<{ name: string; patch: (s: any) => any; reason: string }> = [
  { name: 'negative cursor', patch: (s) => ({ ...s, cursorIndex: -5 }), reason: 'BAD_CURSOR' },
  { name: 'cursor past the queue', patch: (s) => ({ ...s, cursorIndex: 10_000 }), reason: 'BAD_CURSOR' },
  { name: 'fractional cursor', patch: (s) => ({ ...s, cursorIndex: 1.5 }), reason: 'BAD_CURSOR' },
  { name: 'forged edition', patch: (s) => ({ ...s, editionId: 'ct-gita-forged-2026' }), reason: 'BAD_EDITION' },
  { name: 'invented state', patch: (s) => ({ ...s, state: 'singing' }), reason: 'BAD_STATE' },
  { name: 'speed below range', patch: (s) => ({ ...s, speed: 0.01 }), reason: 'BAD_SPEED' },
  { name: 'speed above range', patch: (s) => ({ ...s, speed: 50 }), reason: 'BAD_SPEED' },
  { name: 'non-numeric speed', patch: (s) => ({ ...s, speed: 'fast' }), reason: 'BAD_SPEED' },
  { name: 'negative chunk index', patch: (s) => ({ ...s, chunkIndex: -1 }), reason: 'BAD_CHUNK_INDEX' },
  { name: 'lastCompleted past the queue', patch: (s) => ({ ...s, lastCompletedIndex: 999 }), reason: 'BAD_LAST_COMPLETED' },
  { name: 'queue replaced by an object', patch: (s) => ({ ...s, queue: { 0: 'x' } }), reason: 'BAD_QUEUE' },
  { name: 'queue with an empty id', patch: (s) => ({ ...s, queue: [''] }), reason: 'BAD_QUEUE' },
  { name: 'unknown book', patch: (s) => ({ ...s, bookId: 'invented-book' }), reason: 'UNKNOWN_BOOK' },
  { name: 'wrong schema version', patch: (s) => ({ ...s, version: 99 }), reason: 'WRONG_VERSION' },
  { name: 'empty session id', patch: (s) => ({ ...s, sessionId: '' }), reason: 'BAD_SESSION_ID' },
  { name: 'missing cancellation token', patch: (s) => ({ ...s, cancellationToken: '' }), reason: 'BAD_TOKEN' },
  { name: 'bad timestamp', patch: (s) => ({ ...s, updatedAt: 'yesterday' }), reason: 'BAD_TIMESTAMP' },
  { name: 'bad language', patch: (s) => ({ ...s, language: 'sanskrit' }), reason: 'BAD_LANGUAGE' },
  { name: 'meaning flag not boolean', patch: (s) => ({ ...s, includeMeaning: 'yes' }), reason: 'BAD_PREFERENCES' },
  { name: 'bad scope kind', patch: (s) => ({ ...s, scope: { kind: 'galaxy' } }), reason: 'BAD_SCOPE' },
];

test('a tampered client session is rejected field by field', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 } });
  const good = JSON.parse(JSON.stringify(started.session));
  expect(reviveSession(good)).toBeTruthy();
  expect(validateSessionShape(good).reason).toBeUndefined();

  for (const item of TAMPER_CASES) {
    const tampered = item.patch(JSON.parse(JSON.stringify(started.session)));
    const result = validateSessionShape(tampered);
    expect(result.session, `${item.name} must be rejected`).toBeNull();
    expect(result.reason, `${item.name} rejection reason`).toBe(item.reason);
    expect(reviveSession(tampered), `${item.name} (reviveSession)`).toBeNull();
  }
});

test('a session is checked against the stored corpus, not just its shape', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 } });
  const good = JSON.parse(JSON.stringify(started.session));
  const verified = await reviveVerifiedSession(good);
  expect(verified.session).toBeTruthy();
  expect(verified.reason).toBeUndefined();
  // Labels come from the store, never from the client payload.
  expect(verified.session!.editionId).toBe(started.session.editionId);
  expect(verified.session!.bookTitle).toBe(started.session.bookTitle);

  // A passage id that is not in the stored book is rejected.
  const foreign = await reviveVerifiedSession({ ...good, queue: [...good.queue, 'not-a-passage'] });
  expect(foreign.session).toBeNull();
  expect(foreign.reason).toBe('UNKNOWN_PASSAGE');

  // So is a forged edition, even though the book id is valid.
  const forged = await reviveVerifiedSession({ ...good, editionId: 'ct-gita-forged-2026' });
  expect(forged.session).toBeNull();
  expect(forged.reason).toBe('BAD_EDITION');

  // Non-objects and empty input are rejected, not trusted.
  expect((await reviveVerifiedSession(null)).session).toBeNull();
  expect((await reviveVerifiedSession(undefined)).session).toBeNull();
  expect((await reviveVerifiedSession('rs_1')).session).toBeNull();
});

test('a rejected session does not crash the reader: it answers honestly', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 } });
  const tampered = { ...JSON.parse(JSON.stringify(started.session)), cursorIndex: -3 };
  expect(reviveSession(tampered)).toBeNull();

  const reply = await handleReaderCommand('आगे पढ़ो', 'hi', reviveSession(tampered));
  // The rejected session is dropped, so the reader answers honestly instead of
  // reading from a tampered cursor: no stored passage, no exception.
  expect(reply.handled).toBe(true);
  expect(reply.found).toBe(false);
  expect(reply.passages ?? []).toHaveLength(0);
  expect(reply.text).toContain('प्रगति में नहीं');
  expect(reply.provenance).toBe('AI_EXPLANATION');
});
