import { test, expect } from '@playwright/test';
import { readScriptureText, parseScriptureReadRequest } from '../src/lib/ai/granthReader';
import { processKashiSahayakQuery } from '../src/lib/ai/gateway';

// Retrieval/route tests, NOT an audio or interactive reader qualification.
test('exact stored verse returns its actual text without claiming full book', () => {
  const r = readScriptureText({ grantha: 'gita', mode: 'verse', chapter: 2, verse: 47 });
  expect(r.found).toBe(true);
  expect(r.isFull).toBe(false);
  expect(r.isPartial).toBe(true);
  expect(r.text).toContain('कर्मण्येवाधिकारस्ते');
});
for (const request of [
  { grantha: 'gita', mode: 'chapter' as const, chapter: 2 },
  { grantha: 'gita', mode: 'chapter' as const, chapter: 25 },
  { grantha: 'gita', mode: 'verse' as const, chapter: 25, verse: 10 },
  { grantha: 'gita', mode: 'verse' as const, chapter: 2, verse: 48 },
  { grantha: 'madhurashtakam', mode: 'full' as const },
  { grantha: 'unknown', mode: 'section' as const, sectionId: 'invented' },
  { grantha: 'ramcharitmanas', mode: 'verse' as const, chapter: 2, verse: 47 },
  { grantha: 'gita', mode: 'condition' as const, condition: 'sadness' },
]) {
  test('unconnected content fails honestly: ' + JSON.stringify(request), () => {
    const r = readScriptureText(request);
    expect(r.found).toBe(false);
    expect(r.isFull).toBe(false);
    expect(r.text).toContain('अनुपलब्ध');
    expect(r.text).not.toContain('कर्मण्येवाधिकारस्ते');
  });
}
for (const query of ['read Gita chapter 2 verse 47', 'गीता अध्याय २ श्लोक ४७ पढ़ो', 'read Gita 2.47']) {
  test('exact parser: ' + query, () => {
    expect(parseScriptureReadRequest(query)).toEqual({ grantha: 'gita', mode: 'verse', chapter: 2, verse: 47 });
  });
}
test('generic read and resume do not invent a book or default chapter', () => {
  expect(parseScriptureReadRequest('read my report')).toBeNull();
  expect(parseScriptureReadRequest('आगे पढ़ो')).toBeNull();
  expect(parseScriptureReadRequest('गीता का 11वाँ अध्याय सुनाओ')?.chapter).toBe(11);
  expect(parseScriptureReadRequest('read Gita chapter 2 verse 47-49')?.mode).toBe('section');
});
test('gateway routes explicit Hindi chapter request to honest unavailable response', async () => {
  const r = await processKashiSahayakQuery('गीता का 11वाँ अध्याय सुनाओ');
  expect(r.intent).toBe('GRANTH_READ');
  expect(r.structuredCard.granthReadCard.found).toBe(false);
  expect(r.text).not.toContain('पूर्ण पाठ (');
});
test('gateway returns exact verse text', async () => {
  const r = await processKashiSahayakQuery('read Gita chapter 2 verse 47');
  expect(r.intent).toBe('GRANTH_READ');
  expect(r.text).toContain('कर्मण्येवाधिकारस्ते');
});
