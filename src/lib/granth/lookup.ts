/**
 * Exact, source-resolving lookup over the stored Granth library.
 *
 * Rules that must not be broken:
 *  - A FOUND result contains only stored rows. Nothing is generated.
 *  - Failure modes are distinct (unknown book / invalid chapter / invalid
 *    verse / valid-but-not-stored / unsupported numbering / ambiguous /
 *    unknown section) so the assistant can say the honest thing.
 *  - `isCompleteScope` is true only when the edition manifest exists and every
 *    expected unit for the requested scope is present.
 */
import {
  loadBook,
  getBookMeta,
  getChapterCount,
  getVersesInChapter,
  getEditionManifest,
  listBookMeta,
} from './registry';
import type { Book, LookupFailureCode, LookupResult, PassageRecord, ReadingScopeKind } from './types';

/** Devanagari digits, for user-facing copy (1 -> १). */
export function devanagariNumber(value: number): string {
  return String(value).replace(/\d/g, (d) => '०१२३४५६७८९'[Number(d)]);
}

const BOOK_ALIASES: Array<{ bookId: string; patterns: RegExp[] }> = [
  {
    bookId: 'bhagavad-gita',
    patterns: [
      /^(bhagavad[- ]?gita|bhagwat[- ]?geeta|gita|geeta|shrimad[- ]?bhagavad[- ]?gita)$/i,
      /^(श्रीमद्भगवद्गीता|श्रीमद्\s*भगवद्गीता|भगवद्गीता|भगवत\s*गीता|गीता)$/,
      /\b(gita|geeta|गीता)\b/i,
    ],
  },
  {
    bookId: 'ramcharitmanas',
    patterns: [
      /^(ram[- ]?charit[- ]?manas|ramcharitmanas|manas)$/i,
      /^(रामचरितमानस|श्री\s*रामचरितमानस|मानस)$/,
    ],
  },
  {
    bookId: 'shiva-mahapuran',
    patterns: [
      /^(shiv(a)?[- ]?maha[- ]?puran(a)?|shiva[- ]?mahapurana)$/i,
      /^(शिव\s*महापुराण|शिवमहापुराण|शिव\s*पुराण)$/,
    ],
  },
  {
    bookId: 'devi-bhagavata',
    patterns: [
      /^(devi[- ]?bhagavat(a|am)?|devi[- ]?bhagwat|shrimad[- ]?devi[- ]?bhagavat(a)?)$/i,
      /^(देवी\s*भागवत|देवीभागवत|श्रीमद्\s*देवी\s*भागवत)$/,
    ],
  },
];

/** Resolve a user-supplied book name to a registered book id. */
export function resolveBookId(input: string | undefined | null): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;
  const exact = getBookMeta(raw);
  if (exact) return exact.bookId;
  const normalized = raw.toLowerCase().replace(/[\s.]+/g, ' ').trim();
  for (const entry of BOOK_ALIASES) {
    if (entry.patterns.some((re) => re.test(normalized) || re.test(raw.trim()))) return entry.bookId;
  }
  return null;
}

function fail(
  code: LookupFailureCode,
  messageHi: string,
  messageEn: string,
  known: Record<string, unknown> = {},
): LookupResult {
  return { status: 'FAILURE', code, messageHi, messageEn, known };
}

/** Passages of a chapter, located via the edition manifest's section id. */
function chapterPassages(book: Book, chapter: number): PassageRecord[] {
  const manifest = getEditionManifest(book.bookId);
  const expected = manifest?.expected.chapters.find((c) => c.chapter === chapter);
  const sectionId = expected?.sectionId ?? `gita-ch-${chapter}`;
  const section = book.sections.find((s) => s.sectionId === sectionId);
  return section ? section.passages : [];
}

function versesOf(passages: PassageRecord[]): PassageRecord[] {
  return passages.filter((p) => p.kind === 'verse' || p.kind === 'grouped-verse');
}

function success(
  book: Book,
  scope: { kind: ReadingScopeKind; chapter?: number; fromVerse?: number; toVerse?: number; sectionId?: string },
  passages: PassageRecord[],
  missingVerseNumbers: number[],
): LookupResult {
  const verseNumbers = versesOf(passages)
    .map((p) => p.locator.verse)
    .filter((n): n is number => typeof n === 'number')
    .sort((a, b) => a - b);
  const complete = book.hasEditionManifest && missingVerseNumbers.length === 0 && passages.length > 0;
  return {
    status: 'FOUND',
    bookId: book.bookId,
    bookTitle: book.title,
    editionId: book.editionId,
    editionLabel: book.editionLabel,
    scope,
    passages,
    isCompleteScope: complete,
    verseNumbers,
    missingVerseNumbers,
    attribution: book.attribution,
  };
}

/** Whole book. Only chapters that actually exist in storage are returned. */
export async function lookupBook(bookIdInput: string): Promise<LookupResult> {
  const bookId = resolveBookId(bookIdInput);
  if (!bookId) {
    return fail(
      'UNKNOWN_BOOK',
      `यह ग्रन्थ इस पुस्तकालय में पंजीकृत नहीं है। उपलब्ध ग्रन्थ: ${listBookMeta().map((b) => b.title).join('; ')}`,
      `That book is not registered in this library. Available: ${listBookMeta().map((b) => b.bookId).join(', ')}`,
      { availableBooks: listBookMeta().map((b) => b.bookId) },
    );
  }
  const book = await loadBook(bookId);
  const manifest = getEditionManifest(bookId);
  const missing: number[] = [];
  if (manifest) {
    for (const chapter of manifest.expected.chapters) {
      const present = new Set(
        versesOf(chapterPassages(book, chapter.chapter))
          .map((p) => p.locator.verse)
          .filter((n): n is number => typeof n === 'number'),
      );
      for (const n of chapter.expectedVerseNumbers) if (!present.has(n)) missing.push(n);
    }
  }
  return success(book, { kind: 'book' }, book.passages, missing);
}

export async function lookupChapter(bookIdInput: string, chapter: number): Promise<LookupResult> {
  const bookId = resolveBookId(bookIdInput);
  if (!bookId) {
    return fail('UNKNOWN_BOOK', 'यह ग्रन्थ इस पुस्तकालय में पंजीकृत नहीं है।', 'That book is not registered in this library.', {
      availableBooks: listBookMeta().map((b) => b.bookId),
    });
  }
  const book = await loadBook(bookId);
  const manifest = getEditionManifest(bookId);

  if (!manifest) {
    return fail(
      'UNSUPPORTED_SCOPE',
      `${book.title} के लिए अध्याय/श्लोक संख्यांकन (काण्ड + दोहा/चौपाई क्रम) अभी इस पुस्तकालय में मानचित्रित नहीं है। संग्रहीत अनुभाग ही पढ़े जा सकते हैं।`,
      `${book.title} uses narrative section numbering (kāṇḍa + dohā/chaupāī sequence) that is not mapped yet; only stored sections can be read.`,
      { chapters: undefined },
    );
  }

  if (!Number.isInteger(chapter) || chapter < 1 || chapter > manifest.numbering.chapters) {
    return fail(
      'INVALID_CHAPTER',
      `${book.title} में केवल ${devanagariNumber(manifest.numbering.chapters)} अध्याय हैं (अध्याय ${chapter} उपलब्ध नहीं है)।`,
      `${book.title} has only ${manifest.numbering.chapters} chapters in this edition; chapter ${chapter} does not exist.`,
      { bookId, chapters: manifest.numbering.chapters },
    );
  }

  const expected = manifest.expected.chapters.find((c) => c.chapter === chapter);
  const passages = chapterPassages(book, chapter);
  if (!passages.length) {
    return fail(
      'NOT_STORED',
      `${book.title} अध्याय ${chapter} (${expected?.englishName ?? ''}) इस संस्करण में होना चाहिए, पर संग्रह में सुरक्षित नहीं है।`,
      `${book.title} chapter ${chapter} is expected in this edition but is not stored in the corpus.`,
      { bookId, chapters: manifest.numbering.chapters, versesInChapter: expected?.expectedVerseNumbers.length },
    );
  }

  const present = new Set(
    versesOf(passages)
      .map((p) => p.locator.verse)
      .filter((n): n is number => typeof n === 'number'),
  );
  const missing = (expected?.expectedVerseNumbers ?? []).filter((n) => !present.has(n));
  return success(book, { kind: 'chapter', chapter }, passages, missing);
}

export async function lookupVerse(bookIdInput: string, chapter: number, verse: number): Promise<LookupResult> {
  const bookId = resolveBookId(bookIdInput);
  if (!bookId) {
    return fail('UNKNOWN_BOOK', 'यह ग्रन्थ इस पुस्तकालय में पंजीकृत नहीं है।', 'That book is not registered in this library.', {
      availableBooks: listBookMeta().map((b) => b.bookId),
    });
  }
  const book = await loadBook(bookId);
  const manifest = getEditionManifest(bookId);
  if (!manifest) {
    return fail(
      'UNSUPPORTED_SCOPE',
      `${book.title} के लिए श्लोक संख्यांकन अभी मानचित्रित नहीं है।`,
      `Verse numbering is not mapped for ${book.title} yet.`,
    );
  }
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > manifest.numbering.chapters) {
    return fail(
      'INVALID_CHAPTER',
      `${book.title} में केवल ${devanagariNumber(manifest.numbering.chapters)} अध्याय हैं (अध्याय ${chapter} उपलब्ध नहीं है)।`,
      `${book.title} has only ${manifest.numbering.chapters} chapters in this edition; chapter ${chapter} does not exist.`,
      { bookId, chapters: manifest.numbering.chapters },
    );
  }
  const versesInChapter = getVersesInChapter(bookId, chapter) ?? 0;
  if (!Number.isInteger(verse) || verse < 1 || verse > versesInChapter) {
    return fail(
      'INVALID_VERSE',
      `${book.title} अध्याय ${chapter} में कुल ${versesInChapter} श्लोक हैं (श्लोक ${verse} अस्तित्व में नहीं है)।`,
      `${book.title} chapter ${chapter} has ${versesInChapter} verses in this edition; verse ${verse} does not exist.`,
      { bookId, chapters: manifest.numbering.chapters, versesInChapter },
    );
  }
  const passages = chapterPassages(book, chapter);
  const match = versesOf(passages).find((p) => p.locator.verse === verse);
  if (!match) {
    return fail(
      'NOT_STORED',
      `${book.title} ${chapter}.${verse} इस संस्करण में विद्यमान है, पर अभी संग्रह में सुरक्षित नहीं है। मैं अनुमान से पाठ नहीं सुनाऊँगी।`,
      `${book.title} ${chapter}.${verse} exists in this edition but is not stored in the corpus yet; I will not guess the text.`,
      { bookId, chapters: manifest.numbering.chapters, versesInChapter },
    );
  }
  return success(book, { kind: 'verse', chapter, fromVerse: verse, toVerse: verse }, [match], []);
}

export async function lookupRange(
  bookIdInput: string,
  chapter: number,
  fromVerse: number,
  toVerse: number,
): Promise<LookupResult> {
  if (!Number.isInteger(fromVerse) || !Number.isInteger(toVerse)) {
    return fail('INVALID_RANGE', 'श्लोक सीमा स्पष्ट नहीं है।', 'The verse range is not clear.');
  }
  if (fromVerse > toVerse) {
    return fail(
      'INVALID_RANGE',
      `श्लोक सीमा ${fromVerse}-${toVerse} उल्टी है; कृपया "अध्याय ${chapter} श्लोक ${toVerse} से ${fromVerse}" की तरह बताएं।`,
      `The range ${fromVerse}-${toVerse} is reversed.`,
    );
  }
  const bookId = resolveBookId(bookIdInput);
  if (!bookId) {
    return fail('UNKNOWN_BOOK', 'यह ग्रन्थ इस पुस्तकालय में पंजीकृत नहीं है।', 'That book is not registered in this library.');
  }
  const book = await loadBook(bookId);
  const manifest = getEditionManifest(bookId);
  if (!manifest) {
    return fail('UNSUPPORTED_SCOPE', 'इस ग्रन्थ के लिए श्लोक सीमा अभी समर्थित नहीं है।', 'Verse ranges are not supported for this book yet.');
  }
  const chapters = getChapterCount(bookId) ?? 0;
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > chapters) {
    return fail('INVALID_CHAPTER', `अध्याय ${chapter} इस संस्करण में नहीं है।`, `Chapter ${chapter} does not exist in this edition.`, {
      bookId,
      chapters,
    });
  }
  const versesInChapter = getVersesInChapter(bookId, chapter) ?? 0;
  if (fromVerse < 1 || toVerse > versesInChapter) {
    return fail(
      'INVALID_RANGE',
      `अध्याय ${chapter} में ${versesInChapter} श्लोक हैं, अतः ${fromVerse}-${toVerse} की सीमा अमान्य है।`,
      `Chapter ${chapter} has ${versesInChapter} verses, so ${fromVerse}-${toVerse} is invalid.`,
      { bookId, versesInChapter },
    );
  }
  const passages = chapterPassages(book, chapter);
  const wanted = [];
  for (let n = fromVerse; n <= toVerse; n += 1) wanted.push(n);
  const present = new Set(
    versesOf(passages)
      .map((p) => p.locator.verse)
      .filter((n): n is number => typeof n === 'number'),
  );
  const missing = wanted.filter((n) => !present.has(n));
  const selected = passages.filter((p) => {
    if (p.kind === 'speaker') return false;
    const v = p.locator.verse;
    if (typeof v !== 'number') return false;
    const range = p.locator.verseRange;
    if (range) return range.from <= toVerse && range.to >= fromVerse;
    return v >= fromVerse && v <= toVerse;
  });
  if (!selected.length) {
    return fail(
      'NOT_STORED',
      `${book.title} अध्याय ${chapter} श्लोक ${fromVerse}-${toVerse} संग्रह में सुरक्षित नहीं है।`,
      `${book.title} chapter ${chapter} verses ${fromVerse}-${toVerse} are not stored.`,
      { bookId, versesInChapter },
    );
  }
  return success(book, { kind: 'range', chapter, fromVerse, toVerse }, selected, missing);
}

/** Stored narrative/paratext section (e.g. `gita-dhyanam`, `manas-kanda-5`). */
export async function lookupSection(bookIdInput: string, sectionId: string): Promise<LookupResult> {
  const bookId = resolveBookId(bookIdInput);
  if (!bookId) {
    return fail('UNKNOWN_BOOK', 'यह ग्रन्थ इस पुस्तकालय में पंजीकृत नहीं है।', 'That book is not registered in this library.');
  }
  const book = await loadBook(bookId);
  const section = book.sections.find((s) => s.sectionId === sectionId);
  if (!section) {
    return fail(
      'UNKNOWN_SECTION',
      `यह अनुभाग (${sectionId}) ${book.title} में सुरक्षित नहीं है।`,
      `Section "${sectionId}" is not stored for ${book.title}.`,
      { bookId, availableBooks: book.sections.map((s) => s.sectionId) },
    );
  }
  return success(book, { kind: 'section', sectionId }, section.passages, []);
}

/**
 * Neighbouring context for a passage: the speaker row that introduces it plus
 * the previous/next stored unit inside the same section.
 */
export async function lookupContext(
  bookIdInput: string,
  chapter: number,
  verse: number,
  radius = 1,
): Promise<{ before: PassageRecord[]; current: PassageRecord | null; after: PassageRecord[] }> {
  const bookId = resolveBookId(bookIdInput);
  const empty = { before: [], current: null, after: [] } as {
    before: PassageRecord[];
    current: PassageRecord | null;
    after: PassageRecord[];
  };
  if (!bookId) return empty;
  const book = await loadBook(bookId);
  const passages = chapterPassages(book, chapter);
  const index = passages.findIndex((p) => p.locator.chapter === chapter && p.locator.verse === verse);
  if (index < 0) return empty;
  const before: PassageRecord[] = [];
  for (let i = index - 1; i >= 0 && before.length < radius; i -= 1) {
    if (passages[i].kind === 'speaker' || passages[i].kind === 'verse') before.unshift(passages[i]);
  }
  const after: PassageRecord[] = [];
  for (let i = index + 1; i < passages.length && after.length < radius; i += 1) {
    if (passages[i].kind === 'speaker' || passages[i].kind === 'verse') after.push(passages[i]);
  }
  return { before, current: passages[index], after };
}
