/**
 * Book registry with per-book lazy loading.
 *
 * The library page ships the text it renders. The chat/gateway path must NOT
 * bundle every book, so books are loaded on demand through the dynamic
 * imports below (webpack/Next code-splits them per book).
 */
import type { Book, BookDocument, EditionManifest, RawItem, RawRow, PassageKind, PassageRecord } from './types';
import { sha256Hex, passageFingerprint } from './checksum';
import dataIndex from './data/index';
import gitaEdition from './data/editions/bhagavad-gita';

type DataIndex = typeof dataIndex;

/**
 * Dynamic-import shape helper.
 *
 * `await import('./data/granths/<book>')` resolves to `{ default: document }`
 * under webpack/Next, but the CommonJS transform used by the Playwright suites
 * gives `{ default: module.exports }` where `module.exports.default` is the
 * document. Accept both. (Static default imports are already correct in both
 * environments and must not be passed through here.)
 */
function unwrapDynamicDefault<T>(mod: unknown): T {
  const candidate = (mod as { default?: unknown } | undefined)?.default;
  if (
    candidate &&
    typeof candidate === 'object' &&
    !('schemaVersion' in (candidate as object)) &&
    'default' in (candidate as object)
  ) {
    return (candidate as { default: T }).default;
  }
  return candidate as T;
}

const INDEX = dataIndex;

/** Per-book dynamic loaders. Adding a book = add its extracted JSON + one line here. */
const BOOK_LOADERS: Record<string, () => Promise<{ default: BookDocument }>> = {
  'bhagavad-gita': () => import('./data/granths/bhagavad-gita'),
  ramcharitmanas: () => import('./data/granths/ramcharitmanas'),
  'shiva-mahapuran': () => import('./data/granths/shiva-mahapuran'),
  'devi-bhagavata': () => import('./data/granths/devi-bhagavata'),
};

const EDITION_MANIFESTS: Record<string, EditionManifest> = {
  'bhagavad-gita': gitaEdition,
};

/** Books that participate in conversational reading (the four primary Granths). */
export const READABLE_BOOK_IDS = INDEX.granths.map((g) => g.slug);

export interface BookMeta {
  bookId: string;
  title: string;
  attribution: string;
  sections: Array<{ id: string; rows: number }>;
  rows: number;
  hasEditionManifest: boolean;
}

export function listBookMeta(): BookMeta[] {
  return INDEX.granths.map((g) => ({
    bookId: g.slug,
    title: g.title,
    attribution: g.source,
    sections: g.sections,
    rows: g.rows,
    hasEditionManifest: Boolean(EDITION_MANIFESTS[g.slug]),
  }));
}

export function getBookMeta(bookId: string): BookMeta | undefined {
  return listBookMeta().find((b) => b.bookId === bookId);
}

export function getEditionManifest(bookId: string): EditionManifest | undefined {
  return EDITION_MANIFESTS[bookId];
}

/** Chapter count for a book according to its edition manifest (undefined if none). */
export function getChapterCount(bookId: string): number | undefined {
  const manifest = EDITION_MANIFESTS[bookId];
  return manifest?.numbering.chapters;
}

export function getVersesInChapter(bookId: string, chapter: number): number | undefined {
  const manifest = EDITION_MANIFESTS[bookId];
  return manifest?.expected.chapters.find((c) => c.chapter === chapter)?.expectedVerseNumbers.length;
}

// ---------------------------------------------------------------------------
// Corruption scan
// ---------------------------------------------------------------------------

const DEVANAGARI = /[\u0900-\u097F]/;
const LATIN_IN_DEVANAGARI = /[\u0900-\u097F][A-Za-z]{3,}[\u0900-\u097F]/;
const KNOWN_CORRUPTION_TOKENS = ['source', 'undefined', 'NaN', '[object', 'TODO', 'PLACEHOLDER'];

/** Returns a list of human-readable corruption findings for one text. */
export function scanForCorruption(text: string): string[] {
  const findings: string[] = [];
  if (!text) return findings;
  if (text.includes('\uFFFD')) findings.push('U+FFFD replacement character present');
  if (LATIN_IN_DEVANAGARI.test(text)) {
    const match = LATIN_IN_DEVANAGARI.exec(text);
    findings.push(`Latin token embedded in Devanagari run: ${match?.[0] ?? ''}`);
  }
  for (const token of KNOWN_CORRUPTION_TOKENS) {
    if (text.includes(token)) findings.push(`Suspicious token: ${token}`);
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) findings.push('Control character present');
  return findings;
}

// ---------------------------------------------------------------------------
// Normalisation: stored rows -> typed passage records
// ---------------------------------------------------------------------------

/** Devanagari -> ASCII digits, so labels like `श्लोक २-४७` classify correctly. */
function toAsciiDigits(value: string): string {
  return value.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)));
}

const VERSE_RE = /^श्लोक\s*(\d+)\s*-\s*(\d+)\s*$/;
const GROUPED_VERSE_RE = /^श्लोक\s*(\d+)\s*-\s*(\d+)\s*(?:[-–,]\s*(\d+))?\s*$/;
// Covers both the unsandhied `… उवाच` form and the sandhied `…नुवाच`
// (श्रीभगवानुवाच), where `उ` appears as the combining vowel sign U+0941.
const SPEAKER_RE = /(?:उ|\u0941)वाच|बोले|कहते हैं|कहते हैं।/;

function classifyRow(row: RawRow, sectionId: string): { kind: PassageKind; locator: PassageRecord['locator'] } {
  const label = toAsciiDigits((row.shlokaNo || '').trim());

  const rangeMatch = GROUPED_VERSE_RE.exec(label);
  if (rangeMatch) {
    const chapter = Number(rangeMatch[1]);
    const from = Number(rangeMatch[2]);
    const to = rangeMatch[3] ? Number(rangeMatch[3]) : from;
    if (to > from) {
      return { kind: 'grouped-verse', locator: { chapter, verse: from, verseRange: { from, to } } };
    }
    return { kind: 'verse', locator: { chapter, verse: from } };
  }

  const simpleMatch = VERSE_RE.exec(label);
  if (simpleMatch) {
    return { kind: 'verse', locator: { chapter: Number(simpleMatch[1]), verse: Number(simpleMatch[2]) } };
  }

  if (SPEAKER_RE.test(label)) {
    return { kind: 'speaker', locator: { label } };
  }

  if (/ध्यान|मङ्गल|मंगल|स्तुति|आरती|मन्त्र|सूक्त/i.test(label) || /dhyanam|mangalacharan|invocation/i.test(sectionId)) {
    return { kind: 'invocation', locator: { label } };
  }

  return { kind: 'unclassified', locator: { label: label || undefined } };
}

function devanagariOrdinalFromLabel(label: string | undefined, fallback: number): number {
  if (!label) return fallback;
  const dev = label.match(/[०-९]+/);
  if (dev) {
    return Number(
      dev[0].replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d))),
    );
  }
  const arabic = label.match(/\d+/);
  return arabic ? Number(arabic[0]) : fallback;
}

/** Convert a raw extracted book document into typed, checksummed passage records. */
export function normalizeBook(doc: BookDocument): Book {
  const item: RawItem = doc.item;
  const edition = EDITION_MANIFESTS[item.slug];
  const editionId = edition?.editionId ?? `unversioned:${item.slug}`;
  const editionLabel = edition?.displayName ?? `Unversioned stored text (${item.source})`;

  const sections = (item.sections || []).map((section) => {
    let invocationCounter = 0;
    const passages: PassageRecord[] = (section.verses || []).map((row: RawRow, rowIndex: number) => {
      const { kind, locator } = classifyRow(row, section.id);
      if (kind === 'invocation') {
        invocationCounter += 1;
        locator.invocationIndex = locator.invocationIndex ?? devanagariOrdinalFromLabel(locator.label, invocationCounter);
      }
      locator.sectionId = section.id;
      const corruption = [...scanForCorruption(row.sanskrit || ''), ...scanForCorruption(row.hindi || '')];
      const checksum = sha256Hex(
        passageFingerprint({
          bookId: item.slug,
          editionId,
          sectionId: section.id,
          rowIndex,
          kind,
          original: row.sanskrit,
          meaning: row.hindi,
        }),
      );
      const record: PassageRecord = {
        passageId: `${item.slug}:${section.id}:${rowIndex}`,
        bookId: item.slug,
        editionId,
        sectionId: section.id,
        rowIndex,
        kind,
        locator,
        textChecksum: sha256Hex((row.sanskrit || '').replace(/\s+/g, ' ').trim()),
        original: row.sanskrit,
        meaning: row.hindi || undefined,
        originalLanguage: /[\u0900-\u097F]/.test(row.sanskrit || '') ? 'sa' : 'und',
        meaningLanguage: row.hindi ? 'hi' : undefined,
        checksum,
        source: {
          dataFile: `src/lib/granth/data/granths/${item.slug}.ts`,
          sectionId: section.id,
          rowIndex,
          editionId,
          attribution: item.source,
        },
      };
      if (corruption.length) record.corruption = corruption;
      return record;
    });
    return { sectionId: section.id, title: section.title, subtitle: section.subtitle, passages };
  });

  const passages = sections.flatMap((s) => s.passages);
  const byId: Record<string, PassageRecord> = {};
  for (const p of passages) byId[p.passageId] = p;

  return {
    bookId: item.slug,
    slug: item.slug,
    title: item.title,
    attribution: item.source,
    editionId,
    editionLabel,
    hasEditionManifest: Boolean(edition),
    dataFile: `src/lib/granth/data/granths/${item.slug}.ts`,
    sections,
    passages,
    byId,
  };
}

const bookCache = new Map<string, Book>();

/** Load + normalise a book. Cached per process; text is never mutated after load. */
export async function loadBook(bookId: string): Promise<Book> {
  const cached = bookCache.get(bookId);
  if (cached) return cached;
  const loader = BOOK_LOADERS[bookId];
  if (!loader) {
    throw new GranthBookNotRegisteredError(bookId);
  }
  const mod = await loader();
  const book = normalizeBook(unwrapDynamicDefault<BookDocument>(mod));
  bookCache.set(bookId, book);
  return book;
}

/** Test seam: forget cached books. */
export function __clearBookCache(): void {
  bookCache.clear();
}

export class GranthBookNotRegisteredError extends Error {
  constructor(bookId: string) {
    super(`No granth registered with id "${bookId}"`);
    this.name = 'GranthBookNotRegisteredError';
  }
}

export { INDEX as __granithIndex };
