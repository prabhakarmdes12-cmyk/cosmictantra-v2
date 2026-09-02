import { test, expect } from '@playwright/test';
import { readScriptureText, parseScriptureReadRequest } from '../src/lib/ai/granthReader';
import { processKashiSahayakQuery } from '../src/lib/ai/gateway';

// Retrieval/route tests, NOT an audio or interactive reader qualification.
test('exact stored verse returns its actual text without claiming full book', async () => {
  const r = await readScriptureText({ grantha: 'gita', mode: 'verse', chapter: 2, verse: 47 });
  expect(r.found).toBe(true);
  expect(r.isFull).toBe(false);
  expect(r.isPartial).toBe(true);
  expect(r.text).toContain('कर्मण्येवाधिकारस्ते');
  expect(r.passages?.[0]?.checksum).toBeTruthy();
  expect(r.editionId).toBeTruthy();
});

test('a stored chapter is read from the shared library and reported complete for its edition', async () => {
  const r = await readScriptureText({ grantha: 'gita', mode: 'chapter', chapter: 2 });
  expect(r.found).toBe(true);
  expect(r.code).toBeUndefined();
  expect(r.passages?.length).toBeGreaterThan(70);
  expect(r.text).toContain('कर्मण्येवाधिकारस्ते');
});

test('a kāṇḍa-numbered Ramcharitmanas verse resolves from the shared library', async () => {
  const r = await readScriptureText({ grantha: 'ramcharitmanas', mode: 'verse', chapter: 5, verse: 1 });
  expect(r.found).toBe(true);
  expect(r.code).toBeUndefined();
  expect(r.editionId).toContain('ramcharitmanas');
  expect(r.chapter).toBe(5);
  expect(r.verse).toBe(1);
  expect(r.passages?.[0]?.locator).toMatchObject({ chapter: 5, verse: 1 });
  expect(r.text).toContain('5.1');
});

// Distinct failure modes. None of these may masquerade as stored scripture.
for (const [label, request, code] of [
  ['chapter outside the edition', { grantha: 'gita', mode: 'chapter' as const, chapter: 25 }, 'INVALID_CHAPTER'],
  ['verse outside the chapter', { grantha: 'gita', mode: 'verse' as const, chapter: 2, verse: 999 }, 'INVALID_VERSE'],
  ['unregistered book', { grantha: 'madhurashtakam', mode: 'full' as const }, 'UNKNOWN_BOOK'],
  ['unknown book id', { grantha: 'unknown', mode: 'section' as const, sectionId: 'invented' }, 'UNKNOWN_BOOK'],
  ['unmapped numbering', { grantha: 'devi-bhagavata', mode: 'verse' as const, chapter: 1, verse: 1 }, 'UNSUPPORTED_SCOPE'],
  ['concept retrieval not implemented', { grantha: 'gita', mode: 'condition' as const, condition: 'sadness' }, 'UNSUPPORTED_SCOPE'],
] as const) {
  test(`honest distinct failure — ${label}`, async () => {
    const r = await readScriptureText(request as any);
    expect(r.found).toBe(false);
    expect(r.isFull).toBe(false);
    expect(r.code).toBe(code);
    expect(r.text).toContain('अनुपलब्ध');
    expect(r.text).not.toContain('कर्मण्येवाधिकारस्ते');
  });
}

test('a section id that does not exist is not silently returned as found', async () => {
  const r = await readScriptureText({ grantha: 'gita', mode: 'section', sectionId: 'gita-ch-99' });
  expect(r.found).toBe(false);
  expect(r.code).toBe('UNKNOWN_SECTION');
});

for (const query of ['read Gita chapter 2 verse 47', 'गीता अध्याय २ श्लोक ४७ पढ़ो', 'read Gita 2.47']) {
  test('exact parser: ' + query, () => {
    expect(parseScriptureReadRequest(query)).toEqual({ grantha: expect.any(String), mode: 'verse', chapter: 2, verse: 47 });
  });
}
test('generic read and resume do not invent a book or default chapter', () => {
  expect(parseScriptureReadRequest('read my report')).toBeNull();
  expect(parseScriptureReadRequest('आगे पढ़ो')).toBeNull();
  expect(parseScriptureReadRequest('गीता का 11वाँ अध्याय सुनाओ')?.chapter).toBe(11);
  expect(parseScriptureReadRequest('read Gita chapter 2 verse 47-49')?.mode).toBe('section');
});

test('gateway reads a real chapter instead of refusing it', async () => {
  const r = await processKashiSahayakQuery('गीता का 11वाँ अध्याय सुनाओ');
  expect(r.intent).toBe('GRANTH_READ');
  expect(r.structuredCard.granthReadCard.found).toBe(true);
  // Only the first unit is spoken per turn; the rest stay in the resumable queue.
  expect(r.structuredCard.granthReadCard.passages.length).toBe(1);
  expect(r.structuredCard.granthReadCard.session.queueLength).toBeGreaterThan(50);
  expect(r.text).not.toContain('पूर्ण पाठ (');
  expect(r.provenance.type).toBe('SOURCE_DOCUMENTED');
});

test('gateway returns exact verse text', async () => {
  const r = await processKashiSahayakQuery('read Gita chapter 2 verse 47');
  expect(r.intent).toBe('GRANTH_READ');
  expect(r.text).toContain('कर्मण्येवाधिकारस्ते');
});

test('gateway rejects a reference the edition does not contain (Gita 18.93)', async () => {
  const r = await processKashiSahayakQuery('गीता 18.93 पढ़ो');
  expect(r.text).toContain('शास्त्र प्रामाणिक सूचना');
  expect(r.text).toContain('18');
});

test('gateway issues a resumable reading session and cancels the stale one', async () => {
  const first = await processKashiSahayakQuery('गीता अध्याय २ पढ़ो');
  expect(first.readingSession).toBeTruthy();
  expect(first.readingSession?.bookId).toBe('bhagavad-gita');
  expect(first.cancelledReadingTokens).toEqual([]);

  const paused = await processKashiSahayakQuery('रुको', [], { readingSession: first.readingSession });
  expect(paused.readingSession?.state).toBe('paused');
  expect(paused.cancelledReadingTokens).toContain(first.readingSession?.cancellationToken);

  const resumed = await processKashiSahayakQuery('आगे पढ़ो', [], { readingSession: paused.readingSession });
  expect(resumed.readingSession?.state).toBe('reading');
  expect(resumed.structuredCard.granthReadCard.found).toBe(true);
});
