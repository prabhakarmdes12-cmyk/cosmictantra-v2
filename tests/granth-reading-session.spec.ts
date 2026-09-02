import { test, expect } from '@playwright/test';
import {
  chunkPassageForSpeech,
  describePosition,
  explainCurrent,
  moveCursor,
  pauseReading,
  renderPassage,
  repeatPassage,
  resumeReading,
  reviveSession,
  setPreferences,
  startReading,
  stopReading,
  clearServerSessions,
} from '../src/lib/granth/session';
import { handleReaderCommand, parseScriptureReadRequest } from '../src/lib/ai/granthReader';
import { parseReaderCommand } from '../src/lib/granth/commands';

/**
 * Deterministic reading-session tests (no browser, no audio engine).
 *
 * They exercise the state machine and the command layer only. Actual speech
 * output, autoplay rejection and device behaviour are out of scope here and
 * must be verified separately on a device.
 */

test.beforeEach(() => clearServerSessions());

// ---------------------------------------------------------------------------
// 1. Command parsing (Hindi / English / Hinglish / Devanagari digits)
// ---------------------------------------------------------------------------

for (const [query, expectedType] of [
  ['गीता अध्याय २ पढ़ो', 'READ'],
  ['read Gita chapter 2', 'READ'],
  ['गीता २.४७ सुनाओ', 'READ'],
  ['read Gita chapter 2 verse 47', 'READ'],
  ['गीता अध्याय २ श्लोक १ से ५ पढ़ो', 'READ'],
  ['पूरा गीता पढ़ो', 'READ'],
  ['आगे पढ़ो', 'CONTINUE'],
  ['continue', 'CONTINUE'],
  ['रुको', 'PAUSE'],
  ['pause', 'PAUSE'],
  ['बंद करो', 'STOP'],
  ['stop', 'STOP'],
  ['फिर से', 'REPEAT'],
  ['repeat', 'REPEAT'],
  ['अगला श्लोक', 'NEXT'],
  ['next', 'NEXT'],
  ['पिछला श्लोक', 'PREVIOUS'],
  ['previous', 'PREVIOUS'],
  ['यह समझाओ', 'EXPLAIN'],
  ['explain this', 'EXPLAIN'],
  ['ये कहाँ लिखा है?', 'SOURCE'],
  ['source', 'SOURCE'],
  ['अर्थ भी', 'MEANING'],
  ['सिर्फ मूल पढ़ो', 'MEANING'],
  ['धीरे पढ़ो', 'SPEED'],
  ['faster', 'SPEED'],
  ['हिंदी में पढ़ो', 'LANGUAGE'],
  ['in english', 'LANGUAGE'],
  ['read my report', 'UNKNOWN'],
  ['आज मन उदास है', 'UNKNOWN'],
] as const) {
  test(`command: ${query} -> ${expectedType}`, () => {
    expect(parseReaderCommand(query).type).toBe(expectedType);
  });
}

test('Devanagari digits and ordinal chapters resolve to the same reference', () => {
  expect(parseScriptureReadRequest('गीता अध्याय २ श्लोक ४७ पढ़ो')).toMatchObject({ mode: 'verse', chapter: 2, verse: 47 });
  expect(parseScriptureReadRequest('गीता का ११वाँ अध्याय सुनाओ')).toMatchObject({ mode: 'chapter', chapter: 11 });
  expect(parseScriptureReadRequest('read Gita 2.47')).toMatchObject({ mode: 'verse', chapter: 2, verse: 47 });
});

test('a contextless continue never invents a book or chapter', async () => {
  expect(parseScriptureReadRequest('आगे पढ़ो')).toBeNull();
  const turn = await handleReaderCommand('आगे पढ़ो', 'hi', null);
  expect(turn.session).toBeUndefined();
  expect(turn.text).toContain('गीता अध्याय २');
});

// ---------------------------------------------------------------------------
// 2. The documented interruption / resume flow
// ---------------------------------------------------------------------------

test('chapter reading: start -> pause -> explain -> resume -> repeat -> previous', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 } });
  expect(started.session.state).toBe('reading');
  expect(started.session.queue.length).toBe(79);
  expect(started.passages).toHaveLength(1);
  const firstPassageId = started.passages[0].passageId;
  expect(started.text).toContain(started.passages[0].original.slice(0, 12));

  const paused = await pauseReading(started.session);
  expect(paused.session.state).toBe('paused');
  expect(paused.session.cursorIndex).toBe(started.session.cursorIndex);
  expect(paused.passages).toHaveLength(0);
  expect(paused.cancelledTokens).toContain(started.session.cancellationToken);

  const explained = await explainCurrent(paused.session);
  expect(explained.session.state).toBe('paused');
  expect(explained.session.cursorIndex).toBe(paused.session.cursorIndex);
  expect(explained.text).toContain('संग्रहीत');
  expect(explained.provenance).toBe('AI_EXPLANATION');

  const resumed = await resumeReading(explained.session);
  expect(resumed.session.state).toBe('reading');
  expect(resumed.passages[0].passageId).toBe(firstPassageId);

  const repeated = await repeatPassage(resumed.session);
  expect(repeated.passages[0].passageId).toBe(firstPassageId);

  const next = await moveCursor(repeated.session, 1);
  expect(next.session.cursorIndex).toBe(resumed.session.cursorIndex + 1);
  const previous = await moveCursor(next.session, -1);
  expect(previous.session.cursorIndex).toBe(resumed.session.cursorIndex);
  expect(previous.passages[0].passageId).toBe(firstPassageId);

  const atStart = await moveCursor(previous.session, -1);
  expect(atStart.session.cursorIndex).toBe(0);
  expect(atStart.text).toContain('पहला अंश');
});

test('speed, language and meaning preferences change without moving the cursor', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 } });
  const faster = setPreferences(started.session, { speed: 1.2 });
  expect(faster.session.speed).toBe(1.2);
  expect(faster.session.cursorIndex).toBe(started.session.cursorIndex);

  const english = setPreferences(faster.session, { language: 'en' });
  expect(english.session.language).toBe('en');
  const noMeaning = setPreferences(english.session, { includeMeaning: false });
  expect(noMeaning.session.includeMeaning).toBe(false);

  const passage = started.passages[0];
  expect(renderPassage(passage, { includeMeaning: true, language: 'hi' })).toContain('भावार्थ');
  expect(renderPassage(passage, { includeMeaning: false, language: 'hi' })).not.toContain('भावार्थ');
  expect(renderPassage(passage, { includeMeaning: true, language: 'en' })).toContain('Meaning:');
});

test('reading a chapter to the end marks the session completed', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 12 } });
  const jumped = await moveCursor(started.session, started.session.queue.length);
  expect(jumped.session.state).toBe('completed');
  expect(jumped.completed).toBe(true);
  expect(jumped.passages).toHaveLength(0);
});

test('stopping preserves the cursor and cancels outstanding audio', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 } });
  const moved = await moveCursor(started.session, 5);
  const stopped = await stopReading(moved.session);
  expect(stopped.session.cursorIndex).toBe(5);
  expect(stopped.session.state).toBe('paused');
  expect(stopped.cancelledTokens).toContain(moved.session.cancellationToken);
  const resumed = await resumeReading(stopped.session);
  expect(resumed.session.cursorIndex).toBe(5);
});

// ---------------------------------------------------------------------------
// 3. Stale work, ambiguity and persistence
// ---------------------------------------------------------------------------

test('switching books cancels the previous session token', async () => {
  const gita = await handleReaderCommand('गीता अध्याय २ पढ़ो', 'hi', null);
  expect(gita.session?.bookId).toBe('bhagavad-gita');
  const manasBook = await handleReaderCommand('पूरा रामचरितमानस पढ़ो', 'hi', gita.session ?? null);
  // Ramcharitmanas has a full 7-kāṇḍa edition manifest now, so a whole-book
  // request starts a real session with every snapshot entry queued.
  expect(manasBook.session?.bookId).toBe('ramcharitmanas');
  expect(manasBook.found).toBe(true);
  expect(manasBook.provenance).toBe('SOURCE_DOCUMENTED');
  expect(manasBook.session?.queue.length).toBe(2247);
  expect(manasBook.session?.isCompleteScope).toBe(true);
  expect(manasBook.cancelledTokens).toContain(gita.session?.cancellationToken);
});

test('an ambiguous bare verse number asks one question instead of guessing', async () => {
  const withoutSession = await handleReaderCommand('गीता श्लोक ४७ पढ़ो', 'hi', null);
  expect(withoutSession.needsClarification).toBeTruthy();
  expect(withoutSession.found).toBe(false);

  const chapter = await handleReaderCommand('गीता अध्याय २ पढ़ो', 'hi', null);
  const withSession = await handleReaderCommand('श्लोक ४७ पढ़ो', 'hi', chapter.session ?? null);
  expect(withSession.found).toBe(true);
  expect(withSession.passages?.[0]?.locator.verse).toBe(47);
  expect(withSession.passages?.[0]?.original).toContain('कर्मण्येवाधिकारस्ते');
});

test('sessions survive a JSON round trip and reject tampered state', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 } });
  const moved = await moveCursor(started.session, 3);
  const revived = reviveSession(JSON.parse(JSON.stringify(moved.session)));
  expect(revived).toBeTruthy();
  expect(revived!.cursorIndex).toBe(3);
  const resumed = await resumeReading(revived!);
  expect(resumed.passages[0].passageId).toBe(moved.passages[0].passageId);

  expect(reviveSession({ ...moved.session, version: 99 })).toBeNull();
  expect(reviveSession({ ...moved.session, bookId: 'invented-book' })).toBeNull();
  expect(reviveSession({ ...moved.session, queue: 'not-an-array' })).toBeNull();
  expect(reviveSession(null)).toBeNull();
});

test('every turn issues a fresh cancellation token (double-click safe)', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'chapter', chapter: 2 } });
  const a = await resumeReading(started.session);
  const b = await resumeReading(started.session);
  expect(a.session.cancellationToken).not.toBe(b.session.cancellationToken);
  expect(a.cancelledTokens).toContain(started.session.cancellationToken);
  expect(b.cancelledTokens).toContain(started.session.cancellationToken);
});

test('speech chunking is chunk-level and bounded, never word-level', async () => {
  const started = await startReading({ bookId: 'gita', scope: { kind: 'verse', chapter: 2, verse: 47 } });
  const passage = started.passages[0];
  const chunks = chunkPassageForSpeech(passage, { includeMeaning: true });
  expect(chunks.length).toBeGreaterThanOrEqual(1);
  for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(260);
  expect(chunks.join(' ')).toContain('कर्मण्येवाधिकारस्ते');
  expect(describePosition(started.session)).toContain('श्रीमद्भगवद्गीता');
});
