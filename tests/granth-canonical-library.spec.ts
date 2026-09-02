import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import * as ts from 'typescript';
import { loadBook, scanForCorruption, __clearBookCache } from '../src/lib/granth/registry';
import { lookupChapter, lookupRange, lookupSection, lookupVerse, resolveBookId } from '../src/lib/granth/lookup';
import { VERIFIED_SCRIPTURE_CORPUS, validateAndRetrieveScripture } from '../src/lib/ai/scriptureCorpus';
import dataIndex from '../src/lib/granth/data/index';
import { GRANTHS_DATA, STOTRAS_DATA, AARTIS_DATA, SIDDHA_STUTI_DATA } from '../src/lib/granth/libraryData';
import extractionManifest from '../src/lib/granth/data/manifest';

/**
 * Canonical-library checks: the stored corpus must actually contain the
 * scripture the edition snapshot says it contains, every passage must be
 * attributable, and legacy fabrication paths must stay dead.
 */

const RAW = path.resolve(__dirname, '../gita_raw');
const SPEAKER_RE = /^(श्रीभगवानुवाच|श्रीभगवान् उवाच|धृतराष्ट्र उवाच|सञ्जय उवाच|अर्जुन उवाच)\s*।\s*$/;

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

test('the extracted corpus matches the bundled edition snapshot verse for verse', async () => {
  __clearBookCache();
  const raw = JSON.parse(fs.readFileSync(path.join(RAW, 'gita.json'), 'utf8'));
  const book = await loadBook('bhagavad-gita');

  let compared = 0;
  for (const key of Object.keys(raw).map(Number).sort((a, b) => a - b)) {
    const chapter = raw[String(key)];
    const section = book.sections.find((s) => s.sectionId === `gita-ch-${key}`);
    expect(section, `chapter ${key} stored`).toBeTruthy();
    for (const item of chapter.items) {
      if (item.type !== 'verse') continue;
      const lines = String(item.text).split('\n');
      const sanskrit = lines.filter((l: string) => !SPEAKER_RE.test(l.trim())).join('\n').trim();
      const passage = section!.passages.find((p) => p.locator.chapter === Number(key) && p.locator.verse === item.n);
      expect(passage, `gita ${key}.${item.n} stored`).toBeTruthy();
      expect(normalize(passage!.original), `gita ${key}.${item.n} text matches the snapshot`).toBe(normalize(sanskrit));
      expect(passage!.meaning && passage!.meaning.length > 0, `gita ${key}.${item.n} has a stored meaning`).toBeTruthy();
      compared += 1;
    }
  }
  expect(compared).toBe(701);
});

test('stored Hindi anuvada exists for every verse of every chapter', async () => {
  const book = await loadBook('bhagavad-gita');
  const verses = book.passages.filter((p) => p.kind === 'verse');
  expect(verses).toHaveLength(701);
  for (const verse of verses) {
    expect(verse.meaning, `${verse.passageId} hindi`).toBeTruthy();
    expect(verse.meaningLanguage).toBe('hi');
  }
});

test('extraction manifest records a checksum per data module', () => {
  expect(extractionManifest.files).toHaveLength(7);
  for (const file of extractionManifest.files) {
    expect(fs.existsSync(path.resolve(__dirname, '..', file.file))).toBe(true);
    expect(file.sha256).toMatch(/^[0-9a-f]{64}$/);
  }
  expect(dataIndex.granths).toHaveLength(4);
  expect(dataIndex.collections.aartis.items).toHaveLength(15);
  expect(dataIndex.collections.stotras.items).toHaveLength(5);
  expect(dataIndex.collections['siddha-stuti'].items).toHaveLength(5);
});

test('corruption scanner flags the historical injected token and clears the corpus', async () => {
  expect(scanForCorruption('मृत्यsourceर्मुक्षीय माऽमृतात्').length).toBeGreaterThan(0);
  expect(scanForCorruption('मृत्योर्मुक्षीय माऽमृतात्')).toEqual([]);
  for (const bookId of ['bhagavad-gita', 'ramcharitmanas', 'shiva-mahapuran', 'devi-bhagavata']) {
    const book = await loadBook(bookId);
    for (const passage of book.passages) expect(passage.corruption ?? []).toEqual([]);
  }
});

test('the legacy chat corpus no longer contains the corrupted mantra', () => {
  const mantra = VERIFIED_SCRIPTURE_CORPUS['RV_7_59_12'];
  expect(mantra.sanskrit).toContain('मृत्योर्मुक्षीय');
  expect(mantra.sanskrit).not.toContain('source');
});

test('legacy reference validation refuses to fabricate a missing verse', () => {
  const missing = validateAndRetrieveScripture('gita', 5, 3);
  expect(missing.isValid).toBe(false);
  expect(missing.status).toBe('NOT_STORED');
  expect(missing.entry).toBeUndefined();
  expect(JSON.stringify(missing)).not.toContain('[श्रीमद्भगवद्गीता अध्याय 5');

  const invalidVerse = validateAndRetrieveScripture('gita', 18, 93);
  expect(invalidVerse.status).toBe('INVALID_VERSE');
  expect(invalidVerse.isValid).toBe(false);

  const invalidChapter = validateAndRetrieveScripture('gita', 19, 1);
  expect(invalidChapter.status).toBe('INVALID_CHAPTER');

  expect(validateAndRetrieveScripture('gita', 2, 47).status).toBe('STORED');
});

test('book aliases resolve in Hindi, English and Hinglish', () => {
  for (const token of ['gita', 'Gita', 'Bhagavad Gita', 'गीता', 'श्रीमद्भगवद्गीता', 'bhagwat geeta']) {
    expect(resolveBookId(token)).toBe('bhagavad-gita');
  }
  expect(resolveBookId('रामचरितमानस')).toBe('ramcharitmanas');
  expect(resolveBookId('शिव महापुराण')).toBe('shiva-mahapuran');
  expect(resolveBookId('देवी भागवत')).toBe('devi-bhagavata');
  expect(resolveBookId('madhurashtakam')).toBeNull();
  expect(resolveBookId(undefined)).toBeNull();
});

test('chapter, range, verse and section lookups return stored records with provenance', async () => {
  const chapter = await lookupChapter('gita', 18);
  expect(chapter.status).toBe('FOUND');
  if (chapter.status !== 'FOUND') return;
  expect(chapter.isCompleteScope).toBe(true);
  expect(chapter.verseNumbers).toHaveLength(78);
  for (const passage of chapter.passages) {
    expect(passage.editionId).toBeTruthy();
    expect(passage.source.dataFile).toBe('src/lib/granth/data/granths/bhagavad-gita.json'.replace('.json', '.ts'));
  }

  const range = await lookupRange('gita', 2, 47, 49);
  expect(range.status).toBe('FOUND');
  if (range.status !== 'FOUND') return;
  expect(range.verseNumbers).toEqual([47, 48, 49]);

  const verse = await lookupVerse('gita', 6, 5);
  expect(verse.status).toBe('FOUND');
  if (verse.status !== 'FOUND') return;
  expect(verse.passages[0].original).toContain('उद्धरेदात्मनात्मानं');

  const dhyanam = await lookupSection('gita', 'gita-dhyanam');
  expect(dhyanam.status).toBe('FOUND');
  if (dhyanam.status !== 'FOUND') return;
  expect(dhyanam.passages).toHaveLength(9);
  expect(dhyanam.passages.every((p) => p.kind === 'invocation')).toBe(true);
});

test('kāṇḍa-numbered Ramcharitmanas rows resolve through the edition manifest', async () => {
  const verse = await lookupVerse('ramcharitmanas', 1, 1);
  expect(verse.status).toBe('FOUND');
  if (verse.status !== 'FOUND') return;
  expect(verse.isCompleteScope).toBe(true);
  expect(verse.verseNumbers).toEqual([1]);
  expect(verse.passages[0].locator).toMatchObject({ chapter: 1, verse: 1 });
  expect(verse.passages[0].original).toContain('वर्णानामर्थसंघानां');
  expect(verse.passages[0].meaning).toBeUndefined();

  const chapter = await lookupChapter('ramcharitmanas', 5);
  expect(chapter.status).toBe('FOUND');
  if (chapter.status !== 'FOUND') return;
  expect(chapter.isCompleteScope).toBe(true);
  expect(chapter.verseNumbers).toHaveLength(121);
});

test('a valid-but-unstored unit is never returned as stored content', async () => {
  // Simulated by pointing at a verse outside the edition, and by an
  // out-of-edition reference: both must fail with distinct codes.
  const outsideEdition = await lookupVerse('ramcharitmanas', 1, 999);
  expect(outsideEdition.status).toBe('FAILURE');
  if (outsideEdition.status === 'FAILURE') expect(outsideEdition.code).toBe('INVALID_VERSE');

  const impossible = await lookupRange('gita', 2, 60, 40);
  expect(impossible.status).toBe('FAILURE');
  if (impossible.status === 'FAILURE') expect(impossible.code).toBe('INVALID_RANGE');
});

test('the extracted modules still match the pre-migration page literals byte for byte', () => {
  // Fidelity proof: parse the page as it was committed BEFORE the migration and
  // compare every string to what the library page now renders from the shared
  // modules. Guards against silent text drift during extraction.
  //
  // The baseline is PINNED to ca5951c (the reviewed main this branch is based
  // on), not HEAD: HEAD now contains the migrated page, which imports the
  // extracted modules instead of declaring the literals — comparing against it
  // would prove nothing and could pass with an empty comparison.
  const MIGRATION_BASELINE = 'ca5951c';
  const repoRoot = path.resolve(__dirname, '..');
  let original = '';
  try {
    original = execFileSync('git', ['show', `${MIGRATION_BASELINE}:src/app/aarti-stotra/page.tsx`], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    // No skip here: a missing baseline means the fidelity check cannot run and
    // that must be visible, not silently green.
    throw new Error(
      `Migration baseline ${MIGRATION_BASELINE}:src/app/aarti-stotra/page.tsx unavailable — ` +
        `cannot verify extraction fidelity (${String(error)}).`,
    );
  }

  // The baseline must really be the pre-migration page (literals inline).
  expect(
    original.includes(`from '@/lib/granth/libraryData'`) || original.includes('granthLibrary'),
    `${MIGRATION_BASELINE} must be the PRE-migration page (literals inline, no library import)`,
  ).toBe(false);

  const tree = ts.createSourceFile('page.tsx', original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function literal(node: ts.Node): any {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
    if (ts.isObjectLiteralExpression(node)) {
      const out: Record<string, unknown> = {};
      for (const p of node.properties) {
        if (!ts.isPropertyAssignment(p)) throw new Error('unexpected property');
        out[p.name.getText(tree)] = literal(p.initializer);
      }
      return out;
    }
    throw new Error('unexpected node');
  }

  const wanted: Record<string, any> = {};
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const d of statement.declarationList.declarations) {
      const name = d.name.getText(tree);
      if (['granthsData', 'stotrasData', 'aartisData', 'siddhaStutiData'].includes(name) && d.initializer) {
        wanted[name] = literal(d.initializer);
      }
    }
  }

  // If the pinned baseline ever stops carrying the four literals, this guard has
  // nothing to compare: fail loudly instead of passing on an empty comparison.
  expect(
    Object.keys(wanted).sort(),
    `${MIGRATION_BASELINE} must declare all four data literals`,
  ).toEqual(['aartisData', 'granthsData', 'siddhaStutiData', 'stotrasData']);

  // The three collections and the books still sourced from the page must match
  // the pre-migration literals byte for byte. Ramcharitmanas is deliberately
  // EXCLUDED here: it was upgraded on purpose (14 curated fragment rows ->
  // the full 7-kāṇḍa ODbL DharmicData snapshot), so its stored text moves away
  // from the page literal; the next test verifies the upgrade against the
  // snapshot itself instead.
  const keepFromPage = new Set(['bhagavad-gita', 'shiva-mahapuran', 'devi-bhagavata']);
  const comparable = (items: any[]) => items.filter((g) => keepFromPage.has(g.slug));

  expect(JSON.stringify(comparable(GRANTHS_DATA))).toBe(JSON.stringify(comparable(wanted.granthsData)));
  expect(JSON.stringify(STOTRAS_DATA)).toBe(JSON.stringify(wanted.stotrasData));
  expect(JSON.stringify(AARTIS_DATA)).toBe(JSON.stringify(wanted.aartisData));
  expect(JSON.stringify(SIDDHA_STUTI_DATA)).toBe(JSON.stringify(wanted.siddhaStutiData));

  // IDs, slugs and section ids used by bookmarks are unchanged.
  expect(GRANTHS_DATA.map((g) => [g.id, g.slug])).toEqual(wanted.granthsData.map((g: any) => [g.id, g.slug]));
  for (const [extracted, originalItem] of GRANTHS_DATA.map((g, i) => [g, wanted.granthsData[i]] as const)) {
    if (!keepFromPage.has(extracted.slug)) continue;
    expect(extracted.sections.map((s) => s.id)).toEqual(originalItem.sections.map((s: any) => s.id));
  }
});

test('the ramcharitmanas corpus matches the DharmicData ODbL snapshot entry for entry', async () => {
  __clearBookCache();
  const book = await loadBook('ramcharitmanas');
  const files = [
    { file: '1_बाल_काण्ड_data.json', chapter: 1 },
    { file: '2_अयोध्या_काण्ड_data.json', chapter: 2 },
    { file: '3_अरण्य_काण्ड_data.json', chapter: 3 },
    { file: '4_किष्किन्धा_काण्ड_data.json', chapter: 4 },
    { file: '5_सुंदर_काण्ड_data.json', chapter: 5 },
    { file: '6_लंका_काण्ड_data.json', chapter: 6 },
    { file: '7_उत्तर_काण्ड_data.json', chapter: 7 },
  ];
  const RAW_DIR = path.resolve(__dirname, '../granth_raw/ramcharitmanas');
  let compared = 0;
  for (const { file, chapter } of files) {
    const entries = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf8'));
    const section = book.sections.find((s) => s.sectionId === `manas-kanda-${chapter}`);
    expect(section, `${file} section`).toBeTruthy();
    expect(section!.passages).toHaveLength(entries.length);
    entries.forEach((entry: any, i: number) => {
      const passage = section!.passages[i];
      expect(passage.locator.chapter).toBe(chapter);
      expect(passage.locator.verse).toBe(i + 1);
      expect(passage.original).toBe(String(entry.content));
      expect(passage.meaning).toBeUndefined();
      compared += 1;
    });
  }
  expect(compared).toBe(2247);
});
