/**
 * Source-grounded retrieval over the STORED corpus.
 *
 * Pipeline, in order:
 *   1. EXACT_LOOKUP   — an explicit reference in the query (गीता २.४७, अध्याय २…)
 *   2. LEXICAL_STORED_CORPUS — token/phrase search over stored mūla + stored
 *      meaning, with metadata filters (book, chapter) and idf weighting
 *   3. NONE
 *
 * WHAT THIS IS NOT: there is no embedding model, no vector index, no LLM
 * re-ranking and therefore no semantic search. `mode` always states which
 * stage produced the results so callers cannot over-claim. If semantic
 * retrieval is wanted it needs an explicit provider/index and its own budget
 * and permissions — that is a separate decision, not this function.
 */
import { loadBook, listBookMeta } from './registry';
import { lookupChapter, lookupVerse, resolveBookId, devanagariNumber } from './lookup';
import type { PassageRecord } from './types';

export type RetrievalMode = 'EXACT_LOOKUP' | 'LEXICAL_STORED_CORPUS' | 'NONE';

export interface RetrievedPassage {
  passage: PassageRecord;
  score: number;
  matchedTerms: string[];
  /** Human-readable locator, e.g. "गीता २.४७". */
  reference: string;
  bookId: string;
  bookTitle: string;
  editionId: string;
}

export interface RetrievalOutcome {
  mode: RetrievalMode;
  results: RetrievedPassage[];
  terms: string[];
  searchedBooks: string[];
  /** Honest description of how the results were produced. */
  note: string;
}

const STOPWORDS = new Set([
  'मैं', 'मुझे', 'मेरा', 'मेरी', 'है', 'हैं', 'था', 'थी', 'थे', 'हूँ', 'हूं', 'कर', 'करूँ', 'करूं', 'क्या', 'कैसे',
  'के', 'की', 'का', 'में', 'से', 'को', 'और', 'या', 'बहुत', 'थोड़ा', 'जी', 'please', 'tell', 'about', 'some',
  'any', 'give', 'want', 'need', 'बताओ', 'बताइए', 'कुछ', 'कोई', 'लिए', 'बारे', 'एक', 'भी', 'हो', 'हैं',
]);

/**
 * Word split that keeps Devanagari intact: vowel signs and the virama are
 * combining marks (\p{M}), not letters, so excluding them would shatter every
 * Devanagari word ("आत्मा" would become "आत" + "म").
 */
const TOKEN_RE = /[^\p{L}\p{N}\p{M}]+/u;

/** Minimum distinct informative terms that must match before we quote anything. */
const MIN_MATCHED_TERMS = 2;
/** Minimum idf-weighted score for a lexical hit to be offered as grounded. */
const MIN_SCORE = 8;

function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .split(TOKEN_RE)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

interface BookIndex {
  bookId: string;
  bookTitle: string;
  editionId: string;
  passages: PassageRecord[];
  tokensByPassage: Map<string, string[]>;
  df: Map<string, number>;
  /** Terms too common to carry meaning (e.g. मन, आज, कर) — ignored in scoring. */
  backgroundTerms: Set<string>;
}

/**
 * A term appearing in more than this share of a book's passages cannot
 * discriminate between passages, so treating it as a search term produces
 * noise that looks like relevance. This is a data-driven stop list, not a
 * hand-written one.
 */
const BACKGROUND_TERM_SHARE = 0.3;

const indexCache = new Map<string, BookIndex>();

async function getIndex(bookId: string): Promise<BookIndex> {
  const cached = indexCache.get(bookId);
  if (cached) return cached;
  const book = await loadBook(bookId);
  const passages = book.passages.filter((p) => p.kind === 'verse' || p.kind === 'grouped-verse');
  const tokensByPassage = new Map<string, string[]>();
  const df = new Map<string, number>();
  for (const passage of passages) {
    const tokens = [...tokenize(passage.original), ...tokenize(passage.meaning ?? '')];
    tokensByPassage.set(passage.passageId, tokens);
    for (const term of new Set(tokens)) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const backgroundTerms = new Set<string>();
  const cutoff = Math.max(40, Math.floor(passages.length * BACKGROUND_TERM_SHARE));
  for (const [term, count] of df) if (count > cutoff) backgroundTerms.add(term);

  const index: BookIndex = {
    bookId,
    bookTitle: book.title,
    editionId: book.editionId,
    passages,
    tokensByPassage,
    df,
    backgroundTerms,
  };
  indexCache.set(bookId, index);
  return index;
}

/** Test seam: drop cached indexes (call after mutating stored data). */
export function __clearRetrievalIndex(): void {
  indexCache.clear();
}

function referenceFor(passage: PassageRecord): string {
  if (typeof passage.locator.chapter === 'number' && typeof passage.locator.verse === 'number') {
    const range = passage.locator.verseRange;
    return range
      ? `गीता ${devanagariNumber(passage.locator.chapter)}.${devanagariNumber(range.from)}-${devanagariNumber(range.to)}`
      : `गीता ${devanagariNumber(passage.locator.chapter)}.${devanagariNumber(passage.locator.verse)}`;
  }
  return `${passage.bookId} • ${passage.sectionId}`;
}

const EXACT_REFERENCE_RE =
  /(?:गीता|gita)\s*(?:अध्याय)?\s*([०-९0-9]{1,2})\s*(?:[:.]|\s+श्लोक\s*|\s+verse\s*)\s*([०-९0-9]{1,3})/i;

function toAsciiDigits(value: string): string {
  return value.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)));
}

export interface RetrieveOptions {
  bookId?: string;
  limit?: number;
  /** Include invocation/paratext rows in lexical search (default false). */
  includeParatext?: boolean;
}

/**
 * Retrieve stored passages for a free-text query.
 * Never returns text that is not in the stored corpus.
 */
export async function retrieveGroundedPassages(query: string, options: RetrieveOptions = {}): Promise<RetrievalOutcome> {
  const limit = options.limit ?? 3;
  const normalized = toAsciiDigits(String(query || ''));

  // 1. Exact lookup first: an explicit reference beats any fuzzy matching.
  const exact = EXACT_REFERENCE_RE.exec(normalized);
  if (exact) {
    const chapter = Number(exact[1]);
    const verse = Number(exact[2]);
    const result = await lookupVerse(options.bookId ?? 'bhagavad-gita', chapter, verse);
    if (result.status === 'FOUND') {
      return {
        mode: 'EXACT_LOOKUP',
        results: result.passages.map((passage) => ({
          passage,
          score: 1,
          matchedTerms: [],
          reference: referenceFor(passage),
          bookId: result.bookId,
          bookTitle: result.bookTitle,
          editionId: result.editionId,
        })),
        terms: [],
        searchedBooks: [result.bookId],
        note: 'Exact stored reference from the edition manifest.',
      };
    }
  }

  // Chapter-only reference.
  const chapterOnly = /(?:गीता|gita)\s*(?:अध्याय|chapter)?\s*([०-९0-9]{1,2})\s*(?:अध्याय|chapter)/i.exec(normalized);
  if (chapterOnly) {
    const result = await lookupChapter(options.bookId ?? 'bhagavad-gita', Number(chapterOnly[1]));
    if (result.status === 'FOUND') {
      return {
        mode: 'EXACT_LOOKUP',
        results: result.passages.slice(0, limit).map((passage) => ({
          passage,
          score: 1,
          matchedTerms: [],
          reference: referenceFor(passage),
          bookId: result.bookId,
          bookTitle: result.bookTitle,
          editionId: result.editionId,
        })),
        terms: [],
        searchedBooks: [result.bookId],
        note: 'Exact stored chapter from the edition manifest.',
      };
    }
  }

  // 2. Lexical search over the stored corpus.
  const terms = [...new Set(tokenize(normalized))];
  if (!terms.length) {
    return { mode: 'NONE', results: [], terms: [], searchedBooks: [], note: 'No usable search terms.' };
  }

  const bookIds = options.bookId
    ? [resolveBookId(options.bookId) ?? options.bookId]
    : listBookMeta().map((b) => b.bookId);

  const scored: RetrievedPassage[] = [];
  const searchedBooks: string[] = [];

  for (const bookId of bookIds) {
    let index: BookIndex;
    try {
      index = await getIndex(bookId);
    } catch {
      continue;
    }
    searchedBooks.push(bookId);
    const total = index.passages.length || 1;
    const queryBigrams = new Set<string>();
    for (let i = 0; i + 1 < terms.length; i += 1) queryBigrams.add(`${terms[i]} ${terms[i + 1]}`);

    const informativeTerms = terms.filter((t) => !index.backgroundTerms.has(t));
    if (!informativeTerms.length) continue;

    for (const passage of index.passages) {
      const tokens = index.tokensByPassage.get(passage.passageId) ?? [];
      if (!tokens.length) continue;
      const tokenSet = new Set(tokens);
      // Only informative (non-background) terms count as evidence.
      const matchedTerms = [...new Set(informativeTerms.filter((t) => tokenSet.has(t)))];
      if (matchedTerms.length < MIN_MATCHED_TERMS) continue;

      let score = 0;
      for (const term of matchedTerms) {
        const df = index.df.get(term) ?? 1;
        score += 2 + 2 * Math.log(total / df);
      }
      // Phrase bonus: a query bigram appearing inside the passage text.
      const haystack = tokens.join(' ');
      for (const bigram of queryBigrams) if (haystack.includes(bigram)) score += 3;

      if (score < MIN_SCORE) continue;

      scored.push({
        passage,
        score,
        matchedTerms,
        reference: referenceFor(passage),
        bookId: index.bookId,
        bookTitle: index.bookTitle,
        editionId: index.editionId,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.passage.passageId.localeCompare(b.passage.passageId));
  const results = scored.slice(0, limit);
  return {
    mode: results.length ? 'LEXICAL_STORED_CORPUS' : 'NONE',
    results,
    terms,
    searchedBooks,
    note: results.length
      ? 'Lexical (term/phrase) match over the stored corpus — not semantic/embedding search.'
      : 'No stored passage matched the terms.',
  };
}

export function extractQuotedFragment(query: string): string | null {
  const trimmed = String(query || '').trim();
  if (trimmed.length < 16) return null;
  const patterns = [
    // "गीता में लिखा है: …" / "शास्त्र में कहा गया है …"
    /(?:गीता|ग्रन्थ|ग्रंथ|शास्त्र|पुराण|मानस|उपनिषद)\s*(?:में|मे)\s*(?:लिखा|कहा|वर्णित)\s*(?:है|गया\s*है|था|हैं)\s*[:\-–—"“']?\s*(.{12,})$/,
    // "the Gita says …" / "scripture says that …"
    /(?:gita|geeta|granth|scripture|purana|upanishad)\s+(?:says?|said|states?)\s*(?:that)?\s*[:\-–—"“']?\s*(.{12,})$/i,
    // Anything inside quotation marks.
    /["“']([^"”']{12,})["”']/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(trimmed);
    const fragment = match && match[1] ? match[1].trim() : '';
    if (!fragment) continue;
    const words = fragment.split(/\s+/);
    if (words.length < 3) continue;
    // A real quotation carries either Devanagari text or several words.
    if (!/[\u0900-\u097F]/.test(fragment) && words.length < 4) continue;
    return fragment;
  }
  return null;
}

/**
 * Verify whether a quoted fragment exists in the stored corpus.
 * Returns the best stored match, or null when nothing matches.
 */
export async function verifyQuotation(fragment: string, options: { bookId?: string } = {}): Promise<RetrievalOutcome> {
  const outcome = await retrieveGroundedPassages(fragment, { ...options, limit: 1 });
  if (outcome.mode === 'NONE' || !outcome.results.length) {
    return { ...outcome, mode: 'NONE', results: [] };
  }
  const best = outcome.results[0];
  const normalizedFragment = tokenize(toAsciiDigits(fragment)).join(' ');
  const normalizedPassage = tokenize(toAsciiDigits(`${best.passage.original} ${best.passage.meaning ?? ''}`)).join(' ');
  const coverage = normalizedFragment
    ? normalizedFragment.split(' ').filter((t) => normalizedPassage.includes(t)).length / normalizedFragment.split(' ').length
    : 0;
  // Require most of the quoted words to appear in the stored passage before we
  // say "yes, this is in the corpus".
  if (coverage < 0.7) return { ...outcome, mode: 'NONE', results: [] };
  return outcome;
}
