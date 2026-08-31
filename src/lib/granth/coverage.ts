/**
 * Per-edition coverage measurement for the stored Granth library.
 *
 * Compares the stored corpus against a book's edition manifest (expected
 * units, grouping rules, provenance). Where no manifest exists the book is
 * reported as `NO_EDITION_MANIFEST` with the stored counts only — never as
 * complete.
 *
 * The report is deterministic: same data + same manifest => same JSON.
 */
import { loadBook, listBookMeta, getEditionManifest, __clearBookCache } from './registry';
import type { EditionManifest, PassageRecord } from './types';

export interface CoverageChapter {
  chapter: number;
  sectionId: string;
  englishName: string;
  expectedVerses: number | null;
  storedVerses: number;
  storedRows: number;
  missingVerseNumbers: number[];
  extraVerseNumbers: number[];
  complete: boolean;
}

export interface BookCoverage {
  bookId: string;
  title: string;
  editionId: string;
  editionLabel: string;
  hasEditionManifest: boolean;
  provenance: EditionManifest['provenance'] | null;
  numbering: EditionManifest['numbering'] | null;
  stored: {
    rows: number;
    verses: number;
    groupedVerses: number;
    speakers: number;
    invocations: number;
    unclassified: number;
    sections: number;
  };
  expected: {
    verses: number | null;
    rows: number | null;
  };
  missingVerses: Array<{ chapter: number; verse: number }>;
  missingRanges: string[];
  extraVerses: Array<{ chapter: number; verse: number }>;
  duplicatePassageIds: string[];
  /** Identical verse/grouped-verse text — a real numbering/text defect. */
  duplicateTexts: Array<{ textChecksum: string; kind: string; passageIds: string[] }>;
  /** Repeated speaker/invocation rows — expected paratext, reported not failed. */
  repeatedParatext: Array<{ textChecksum: string; kind: string; count: number; passageIds: string[] }>;
  corrupted: Array<{ passageId: string; findings: string[] }>;
  chapters: CoverageChapter[];
  status: 'COMPLETE_FOR_EDITION' | 'PARTIAL' | 'NO_EDITION_MANIFEST';
  verificationNotes: string[];
}

export interface CoverageReport {
  schemaVersion: number;
  generatedAt: string;
  generator: string;
  books: BookCoverage[];
  totals: {
    books: number;
    booksWithEditionManifest: number;
    storedRows: number;
    missingVerses: number;
    corruptedRows: number;
  };
}

/** Collapse a sorted list of numbers into compact "1-4, 7" style ranges. */
function toRanges(numbers: number[], prefix: string): string[] {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const out: string[] = [];
  let start: number | null = null;
  let prev: number | null = null;
  const flush = () => {
    if (start === null || prev === null) return;
    out.push(start === prev ? `${prefix}${start}` : `${prefix}${start}-${prev}`);
  };
  for (const n of sorted) {
    if (start === null) {
      start = n;
      prev = n;
      continue;
    }
    if (n === (prev as number) + 1) {
      prev = n;
      continue;
    }
    flush();
    start = n;
    prev = n;
  }
  flush();
  return out;
}

export async function buildCoverageForBook(bookId: string, generatedAt: string): Promise<BookCoverage> {
  const book = await loadBook(bookId);
  const manifest = getEditionManifest(bookId);
  const notes: string[] = [];

  const stored = {
    rows: book.passages.length,
    verses: book.passages.filter((p) => p.kind === 'verse').length,
    groupedVerses: book.passages.filter((p) => p.kind === 'grouped-verse').length,
    speakers: book.passages.filter((p) => p.kind === 'speaker').length,
    invocations: book.passages.filter((p) => p.kind === 'invocation').length,
    unclassified: book.passages.filter((p) => p.kind === 'unclassified').length,
    sections: book.sections.length,
  };

  // Duplicates
  const seenIds = new Set<string>();
  const duplicatePassageIds: string[] = [];
  for (const p of book.passages) {
    if (seenIds.has(p.passageId)) duplicatePassageIds.push(p.passageId);
    seenIds.add(p.passageId);
  }
  const byText = new Map<string, { kind: string; passageIds: string[] }>();
  for (const p of book.passages) {
    const entry = byText.get(p.textChecksum) || { kind: p.kind, passageIds: [] };
    entry.passageIds.push(p.passageId);
    byText.set(p.textChecksum, entry);
  }
  const duplicateGroups = [...byText.entries()]
    .filter(([, entry]) => entry.passageIds.length > 1)
    .map(([textChecksum, entry]) => ({ textChecksum, kind: entry.kind, passageIds: entry.passageIds }));
  const duplicateTexts = duplicateGroups.filter((g) => g.kind === 'verse' || g.kind === 'grouped-verse');
  const repeatedParatext = duplicateGroups
    .filter((g) => g.kind !== 'verse' && g.kind !== 'grouped-verse')
    .map((g) => ({ textChecksum: g.textChecksum, kind: g.kind, count: g.passageIds.length, passageIds: g.passageIds }));

  const corrupted = book.passages
    .filter((p) => p.corruption && p.corruption.length)
    .map((p) => ({ passageId: p.passageId, findings: p.corruption ?? [] }));

  const missingVerses: Array<{ chapter: number; verse: number }> = [];
  const extraVerses: Array<{ chapter: number; verse: number }> = [];
  const chapters: CoverageChapter[] = [];

  if (manifest) {
    const expectedKeys = new Set<string>();
    for (const chapter of manifest.expected.chapters) {
      const section = book.sections.find((s) => s.sectionId === chapter.sectionId);
      const rows: PassageRecord[] = section ? section.passages : [];
      const presentVerses = rows
        .filter((p) => p.kind === 'verse' || p.kind === 'grouped-verse')
        .map((p) => p.locator.verse)
        .filter((n): n is number => typeof n === 'number');
      const presentSet = new Set(presentVerses);
      const missing = chapter.expectedVerseNumbers.filter((n) => !presentSet.has(n));
      const extra = presentVerses.filter((n) => !chapter.expectedVerseNumbers.includes(n));
      for (const n of missing) missingVerses.push({ chapter: chapter.chapter, verse: n });
      for (const n of extra) extraVerses.push({ chapter: chapter.chapter, verse: n });
      for (const n of chapter.expectedVerseNumbers) expectedKeys.add(`${chapter.chapter}:${n}`);

      chapters.push({
        chapter: chapter.chapter,
        sectionId: chapter.sectionId,
        englishName: chapter.englishName,
        expectedVerses: chapter.expectedVerseNumbers.length,
        storedVerses: presentVerses.length,
        storedRows: rows.length,
        missingVerseNumbers: missing,
        extraVerseNumbers: extra,
        complete: section !== undefined && missing.length === 0 && extra.length === 0,
      });

      if (chapter.hindi.missingVerseNumbers.length) {
        notes.push(
          `Chapter ${chapter.chapter}: ${chapter.hindi.missingVerseNumbers.length} verse(s) lack the stored Hindi anuvāda.`,
        );
      }
    }

    // Invocation blocks present in storage but outside the reference snapshot.
    for (const invocation of manifest.expected.invocations) {
      if (!invocation.inReferenceSnapshot) {
        notes.push(
          `Invocation block "${invocation.sectionId}" (${invocation.expectedRows} rows) is stored but is not part of the reference snapshot: ${invocation.verificationStatus}.`,
        );
      }
    }
  } else {
    notes.push(
      'No edition manifest: expected units are unknown, so this book cannot be reported as complete. Stored fragments only.',
    );
  }

  const missingRanges: string[] = [];
  for (const chapter of chapters) {
    if (chapter.missingVerseNumbers.length) {
      missingRanges.push(...toRanges(chapter.missingVerseNumbers, `${chapter.chapter}:`));
    }
  }

  if (!manifest?.provenance.independentCollation) {
    notes.push('Coverage is measured against the bundled repository snapshot, not against a printed/critical edition.');
  }
  if (repeatedParatext.length) {
    notes.push(
      `${repeatedParatext.length} repeated speaker/invocation text group(s) — expected paratext repetition, not a numbering defect.`,
    );
  }
  if (manifest?.provenance.rightsStatus === 'UNKNOWN') {
    notes.push('Display/audio rights for the stored text are UNKNOWN; publishing modern translations needs a permission record.');
  }

  const status: BookCoverage['status'] = !manifest
    ? 'NO_EDITION_MANIFEST'
    : missingVerses.length === 0 && extraVerses.length === 0 && duplicatePassageIds.length === 0
      ? 'COMPLETE_FOR_EDITION'
      : 'PARTIAL';

  return {
    bookId,
    title: book.title,
    editionId: book.editionId,
    editionLabel: book.editionLabel,
    hasEditionManifest: Boolean(manifest),
    provenance: manifest?.provenance ?? null,
    numbering: manifest?.numbering ?? null,
    stored,
    expected: {
      verses: manifest?.numbering.numberedVerses ?? null,
      rows: manifest
        ? manifest.expected.chapters.reduce((n, c) => n + c.expectedRows, 0) +
          manifest.expected.invocations.reduce((n, i) => n + i.expectedRows, 0)
        : null,
    },
    missingVerses,
    missingRanges,
    extraVerses,
    duplicatePassageIds,
    duplicateTexts,
    repeatedParatext,
    corrupted,
    chapters,
    status,
    verificationNotes: notes,
  };
}

export async function buildCoverageReport(options: { fresh?: boolean } = {}): Promise<CoverageReport> {
  if (options.fresh) __clearBookCache();
  const books: BookCoverage[] = [];
  for (const meta of listBookMeta()) {
    books.push(await buildCoverageForBook(meta.bookId, new Date().toISOString()));
  }
  return {
    schemaVersion: 1,
    // Placeholder; callers that persist the report should set a fixed clock for
    // reproducibility (tests pass `generatedAt` explicitly).
    generatedAt: new Date(0).toISOString(),
    generator: 'src/lib/granth/coverage.ts',
    books,
    totals: {
      books: books.length,
      booksWithEditionManifest: books.filter((b) => b.hasEditionManifest).length,
      storedRows: books.reduce((n, b) => n + b.stored.rows, 0),
      missingVerses: books.reduce((n, b) => n + b.missingVerses.length, 0),
      corruptedRows: books.reduce((n, b) => n + b.corrupted.length, 0),
    },
  };
}

/** Deterministic view of a report (used for checksums/regression assertions). */
export function stableCoverageSummary(report: CoverageReport): unknown {
  return report.books.map((b) => ({
    bookId: b.bookId,
    status: b.status,
    stored: b.stored,
    expected: b.expected,
    missingRanges: b.missingRanges,
    extraVerses: b.extraVerses.length,
    duplicates: b.duplicateTexts.length,
    repeatedParatext: b.repeatedParatext.length,
    corrupted: b.corrupted.length,
  }));
}
