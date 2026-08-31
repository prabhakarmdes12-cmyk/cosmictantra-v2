/**
 * Conversational reader-command parsing (Hindi / English / common Hinglish).
 *
 * Scope of this module is *intent detection only*. It never invents a book,
 * chapter or verse: when a reference is missing or ambiguous it says so and
 * the caller asks one clarification instead of guessing.
 */

export type ReadingScopeInput =
  | { kind: 'book' }
  | { kind: 'chapter'; chapter: number }
  | { kind: 'verse'; chapter: number; verse: number }
  | { kind: 'range'; chapter: number; fromVerse: number; toVerse: number }
  | { kind: 'section'; sectionId?: string };

export type ReaderCommand =
  | { type: 'READ'; bookId: string | null; bookToken: string | null; scope: ReadingScopeInput; raw: string }
  | { type: 'CONTINUE'; raw: string }
  | { type: 'PAUSE'; raw: string }
  | { type: 'STOP'; raw: string }
  | { type: 'REPEAT'; raw: string }
  | { type: 'NEXT'; raw: string }
  | { type: 'PREVIOUS'; raw: string }
  | { type: 'EXPLAIN'; raw: string }
  | { type: 'SOURCE'; raw: string }
  | { type: 'MEANING'; include: boolean; raw: string }
  | { type: 'LANGUAGE'; language: 'hi' | 'en'; raw: string }
  | { type: 'SPEED'; delta: number; raw: string }
  | { type: 'UNKNOWN'; raw: string };

const DEVANAGARI_DIGITS = '०१२३४५६७८९';

/** Normalise Devanagari/Arabic numerals, whitespace and common spelling variants. */
export function normalizeQuery(query: string): string {
  let out = String(query || '').replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));
  out = out.replace(/[–—]/g, '-');
  out = out.replace(/\s+/g, ' ').trim().toLowerCase();
  return out;
}

/** Pull the first integer out of a match group safely. */
function num(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

const BOOK_PATTERN =
  /bhagavad[- ]?gita|bhagwat[- ]?geeta|shrimad[- ]?bhagavad[- ]?gita|\bgita\b|\bgeeta\b|ram[- ]?charit[- ]?manas|ramcharitmanas|\bmanas\b|shiv(a)?[- ]?maha[- ]?puran(a)?|devi[- ]?bhagavat(a|am)?|devi[- ]?bhagwat|श्रीमद्भगवद्गीता|भगवद्गीता|भगवत गीता|गीता|रामचरितमानस|मानस|शिव\s*महापुराण|शिवमहापुराण|देवी\s*भागवत|देवीभागवत/;

export interface BookMention {
  token: string;
  /** Resolved later by the caller through the registry (kept as token here). */
  tokenText: string;
}

export function findBookToken(query: string): string | null {
  const match = BOOK_PATTERN.exec(normalizeQuery(query));
  return match ? match[0] : null;
}

export const READ_TRIGGERS =
  /\b(read|recite|full text|padho|sunao|sunaaiye|sunaaiyE|sunaiye)\b|पढ़ो|पढ़ें|पढ़ना|पढ़िए|सुनाओ|सुनाइए|सुनाना|पाठ करो|संपूर्ण पाठ|सम्पूर्ण पाठ|पूरा पाठ/;

const STOP_PATTERNS = /\b(stop|band karo|band kar do|chup)\b|बंद करो|बंद कर दें|बन्द करो|बस करो|बस बहुत|चुप करो|रोक दो/;
const PAUSE_PATTERNS = /\b(pause|ruko|ruk jao|ruk jaao|thoda ruko|wait)\b|रुको|रुक जाओ|रुक जाइए|थोड़ा रुको|विराम|रोकें/;
const RESUME_PATTERNS =
  /आगे पढ़ो|आगे सुनाओ|आगे बताओ|आगे से|जारी रखो|जारी रखें|शुरू करो|शुरू करें|शुरू से|\b(continue|resume|go on|jaari rakho|shuru karo)\b/;
const REPEAT_PATTERNS = /फिर से|दोहराओ|दुबारा|दोहराइए|वही फिर|\b(repeat|again|once more|dohrao|dobara)\b/;
const NEXT_PATTERNS = /अगला श्लोक|अगला|आगे बढ़ो|आगे का|\b(next|agla|aage badho)\b/;
const PREVIOUS_PATTERNS = /पिछला श्लोक|पिछला|पीछे जाओ|पहले वाला|\b(previous|pichhla|peeche|back)\b/;
const EXPLAIN_PATTERNS = /समझाओ|समझाइए|व्याख्या|मतलब बताओ|अर्थ बताओ|\b(explain|what does it mean|samjhao)\b/;
const SOURCE_PATTERNS = /कहाँ लिखा है|कहां लिखा है|कहाँ से है|स्रोत बताओ|प्रमाण|\b(source|where is it written|citation)\b/;
const MEANING_ON_PATTERNS = /अर्थ भी|अर्थ के साथ|भावार्थ भी|हिन्दी अर्थ|हिंदी अर्थ|\b(meaning too|with meaning|include meaning|artha bhi)\b/;
const MEANING_OFF_PATTERNS = /सिर्फ मूल|केवल मूल|बिना अर्थ|सिर्फ श्लोक|सिर्फ संस्कृत|\b(only original|original only|no meaning|sanskrit only)\b/;
const SLOWER_PATTERNS = /धीरे|धीमे|आहिस्ता|\b(slow|slower|slowly|dheere)\b/;
const FASTER_PATTERNS = /तेज|जल्दी|तेज़|\b(fast|faster|quickly|tez)\b/;
const HINDI_PATTERNS = /हिन्दी में|हिंदी में|हिन्दी मे|\b(in hindi|hindi mein|hindi me)\b/;
const ENGLISH_PATTERNS = /अंग्रेजी में|अंग्रेज़ी में|इंग्लिश में|\b(in english|english mein|english me)\b/;

interface ReferenceMatch {
  chapter?: number;
  verse?: number;
  fromVerse?: number;
  toVerse?: number;
  isRange?: boolean;
  isFullBook?: boolean;
}

function extractReference(q: string): ReferenceMatch {
  const out: ReferenceMatch = {};

  // 2.47 / gita 2:47 / अध्याय 2 श्लोक 47
  const dotted = /(?:gita|geeta|गीता)?\s*(\d{1,2})\s*[.:]\s*(\d{1,3})/.exec(q);
  if (dotted) {
    out.chapter = num(dotted[1]);
    out.verse = num(dotted[2]);
    return out;
  }

  const chapterMatch =
    /(?:chapter|adhyay|adhyaya|अध्याय|अध्याय)\s*(\d{1,3})/.exec(q) ||
    /(\d{1,3})\s*(?:वाँ|वां|वें|वा|th|st|nd|rd)?\s*(?:अध्याय|chapter|adhyay)/.exec(q);
  const verseMatch = /(?:verse|shlok|shloka|śloka|श्लोक|श्लोक संख्या|स्लोक)\s*(\d{1,3})/.exec(q);

  const rangeMatch =
    /(?:श्लोक|verse|shlok)\s*(\d{1,3})\s*(?:-|–|से|to|se)\s*(\d{1,3})/.exec(q) ||
    /(\d{1,3})\s*(?:-|–|से|to|se)\s*(\d{1,3})\s*(?:तक)?\s*(?:श्लोक|verse|shlok)/.exec(q);

  if (rangeMatch) {
    out.fromVerse = num(rangeMatch[1]);
    out.toVerse = num(rangeMatch[2]);
    out.isRange = true;
    if (chapterMatch) out.chapter = num(chapterMatch[1]);
    return out;
  }

  if (chapterMatch) out.chapter = num(chapterMatch[1]);
  if (verseMatch) out.verse = num(verseMatch[1]);

  if (/\b(pura|poora|sampurn|sampoorna|full|complete|entire|poori|puri)\b|पूरा|पूरी|पूरे|सम्पूर्ण|संपूर्ण|समूचा/.test(q)) {
    out.isFullBook = true;
  }

  return out;
}

/** Parse a user utterance into a reader command. Never throws. */
export function parseReaderCommand(query: string): ReaderCommand {
  const raw = String(query || '').trim();
  if (!raw) return { type: 'UNKNOWN', raw };
  const q = normalizeQuery(raw);

  if (STOP_PATTERNS.test(q)) return { type: 'STOP', raw };
  if (PAUSE_PATTERNS.test(q)) return { type: 'PAUSE', raw };
  if (MEANING_ON_PATTERNS.test(q)) return { type: 'MEANING', include: true, raw };
  if (MEANING_OFF_PATTERNS.test(q)) return { type: 'MEANING', include: false, raw };
  if (SOURCE_PATTERNS.test(q)) return { type: 'SOURCE', raw };
  if (EXPLAIN_PATTERNS.test(q)) return { type: 'EXPLAIN', raw };
  if (REPEAT_PATTERNS.test(q)) return { type: 'REPEAT', raw };
  if (RESUME_PATTERNS.test(q)) return { type: 'CONTINUE', raw };
  if (NEXT_PATTERNS.test(q)) return { type: 'NEXT', raw };
  if (PREVIOUS_PATTERNS.test(q)) return { type: 'PREVIOUS', raw };
  if (SLOWER_PATTERNS.test(q)) return { type: 'SPEED', delta: -0.1, raw };
  if (FASTER_PATTERNS.test(q)) return { type: 'SPEED', delta: 0.1, raw };
  if (HINDI_PATTERNS.test(q)) return { type: 'LANGUAGE', language: 'hi', raw };
  if (ENGLISH_PATTERNS.test(q)) return { type: 'LANGUAGE', language: 'en', raw };

  if (!READ_TRIGGERS.test(q)) return { type: 'UNKNOWN', raw };

  // A bare reference ("श्लोक ४७ पढ़ो") is allowed through with a null book
  // token; the caller resolves it against an active session. Callers with no
  // session MUST treat a null token as not-a-reading-command rather than guess.
  const bookToken = findBookToken(raw);

  const ref = extractReference(q);
  // Without a book we need at least a reference to be a reading command at all;
  // otherwise "read my report" would become a scripture request.
  const hasReference =
    typeof ref.chapter === 'number' || typeof ref.verse === 'number' || ref.isRange === true || ref.isFullBook === true;
  if (!bookToken && !hasReference) return { type: 'UNKNOWN', raw };

  const scope: ReadingScopeInput = ref.isRange
    ? ref.chapter
      ? { kind: 'range', chapter: ref.chapter, fromVerse: ref.fromVerse as number, toVerse: ref.toVerse as number }
      : { kind: 'range', chapter: 0, fromVerse: ref.fromVerse as number, toVerse: ref.toVerse as number }
    : typeof ref.verse === 'number' && typeof ref.chapter === 'number'
      ? { kind: 'verse', chapter: ref.chapter, verse: ref.verse }
      : typeof ref.chapter === 'number'
        ? { kind: 'chapter', chapter: ref.chapter }
        : ref.isFullBook
          ? { kind: 'book' }
          : typeof ref.verse === 'number'
            ? { kind: 'verse', chapter: 0, verse: ref.verse }
            : { kind: 'chapter', chapter: 0 };

  return {
    type: 'READ',
    // Resolved by the registry in the caller; kept null-safe here.
    bookId: null,
    bookToken,
    scope,
    raw,
  };
}

export const __testPatterns = {
  READ_TRIGGERS,
  STOP_PATTERNS,
  PAUSE_PATTERNS,
  RESUME_PATTERNS,
  REPEAT_PATTERNS,
  NEXT_PATTERNS,
  PREVIOUS_PATTERNS,
  EXPLAIN_PATTERNS,
  SOURCE_PATTERNS,
  MEANING_ON_PATTERNS,
  MEANING_OFF_PATTERNS,
  SLOWER_PATTERNS,
  FASTER_PATTERNS,
  HINDI_PATTERNS,
  ENGLISH_PATTERNS,
};
