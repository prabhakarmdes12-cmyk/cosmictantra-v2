/**
 * Conversational Granth reader.
 *
 * Retrieval only ever returns rows that are actually stored in the shared
 * library (`src/lib/granth`). Failure modes are distinct and never collapse
 * into a placeholder "success":
 *
 *   UNKNOWN_BOOK        — book not registered
 *   INVALID_CHAPTER     — chapter outside the edition
 *   INVALID_VERSE       — verse outside the chapter
 *   INVALID_RANGE       — malformed / reversed / out-of-bounds range
 *   NOT_STORED          — the edition has it, our corpus does not (yet)
 *   UNSUPPORTED_SCOPE   — numbering for this book is not mapped yet
 *   UNKNOWN_SECTION     — section id does not exist in storage
 *   AMBIGUOUS           — needs one clarification
 */
import { lookupBook, lookupChapter, lookupRange, lookupSection, lookupVerse, resolveBookId } from '@/lib/granth/lookup';
import type { LookupFailureCode, PassageRecord, ReadingScopeKind } from '@/lib/granth/types';
import { parseReaderCommand, normalizeQuery } from '@/lib/granth/commands';
import { READ_TRIGGERS } from '@/lib/granth/commands';
import type { ReadingScopeInput } from '@/lib/granth/commands';
import {
  citeCurrent,
  explainCurrent,
  moveCursor,
  pauseReading,
  repeatPassage,
  resumeReading,
  setPreferences,
  startReading,
  stopReading,
} from '@/lib/granth/session';
import type { ReadingSession, ReaderTurn, StartReadingOptions } from '@/lib/granth/session';

export interface ReadRequest {
  grantha: string;
  mode: 'full' | 'chapter' | 'verse' | 'section' | 'condition';
  chapter?: number;
  verse?: number;
  sectionId?: string;
  condition?: string;
}

export interface ReadResponse {
  found: boolean;
  text: string;
  sourceName: string;
  chapter?: number;
  verse?: number;
  section?: string;
  /** Partial relative to the whole book, not a truncated verse. */
  isPartial: boolean;
  /** True only when every unit the edition expects for the scope was returned. */
  isFull: boolean;
  note: string;
  /** Distinct failure code (undefined when found). */
  code?: LookupFailureCode;
  editionId?: string;
  passages?: PassageRecord[];
  scopeKind?: ReadingScopeKind;
}

const UNAVAILABLE_PREFIX_HI = 'अनुरोधित पाठ अनुपलब्ध है।';

function failureResponse(code: LookupFailureCode, messageHi: string, book: string, note: string): ReadResponse {
  return {
    found: false,
    text: `${UNAVAILABLE_PREFIX_HI} ${messageHi}`,
    sourceName: book,
    isPartial: false,
    isFull: false,
    note,
    code,
  };
}

/**
 * Conservative "new reading request" parser.
 * Returns null unless the user names a book AND asks to read it — so generic
 * "read my report" or a contextless "आगे पढ़ो" never becomes a scripture read.
 */
export function parseScriptureReadRequest(query: string): ReadRequest | null {
  const command = parseReaderCommand(query);
  if (command.type !== 'READ' || !command.bookToken) return null;
  const grantha = command.bookToken;
  const scope = command.scope as ReadingScopeInput;
  switch (scope.kind) {
    case 'verse':
      return { grantha, mode: 'verse', chapter: scope.chapter, verse: scope.verse };
    case 'range':
      return { grantha, mode: 'section', chapter: scope.chapter, sectionId: 'range' };
    case 'chapter':
      return { grantha, mode: 'chapter', chapter: scope.chapter };
    case 'section':
      return { grantha, mode: 'section', sectionId: scope.sectionId };
    case 'book':
    default:
      return { grantha, mode: 'full' };
  }
}

/** Resolve the stored passages for a read request. */
export async function readScriptureText(req: ReadRequest): Promise<ReadResponse> {
  const bookId = resolveBookId(req.grantha);
  if (!bookId) {
    return failureResponse(
      'UNKNOWN_BOOK',
      'यह ग्रन्थ इस पुस्तकालय में पंजीकृत नहीं है। गीता, रामचरितमानस, शिव महापुराण या देवी भागवत में से चुनें।',
      req.grantha,
      'पंजीकृत ग्रन्थ: bhagavad-gita, ramcharitmanas, shiva-mahapuran, devi-bhagavata.',
    );
  }

  switch (req.mode) {
    case 'verse': {
      const result = await lookupVerse(bookId, Number(req.chapter), Number(req.verse));
      return toResponse(result, 'verse');
    }
    case 'chapter': {
      const result = await lookupChapter(bookId, Number(req.chapter));
      return toResponse(result, 'chapter');
    }
    case 'section': {
      if (req.sectionId && req.sectionId !== 'range' && typeof req.chapter === 'number') {
        const result = await lookupRange(bookId, req.chapter, Number(req.verse), Number(req.verse));
        return toResponse(result, 'range');
      }
      const result = req.sectionId && req.sectionId !== 'range'
        ? await lookupSection(bookId, req.sectionId)
        : await lookupBook(bookId);
      return toResponse(result, 'section');
    }
    case 'full': {
      const result = await lookupBook(bookId);
      return toResponse(result, 'book');
    }
    case 'condition':
    default:
      return failureResponse(
        'UNSUPPORTED_SCOPE',
        'परिस्थिति-आधारित (भाव/विषय) खोज अभी लागू नहीं है; कृपया अध्याय, श्लोक या अनुभाग बताएं।',
        req.grantha,
        'Concept/semantic retrieval requires an identified index and permission; not implemented.',
      );
  }
}

function toResponse(result: Awaited<ReturnType<typeof lookupVerse>>, scopeKind: ReadingScopeKind): ReadResponse {
  if (result.status === 'FAILURE') {
    return failureResponse(result.code, result.messageHi, '', result.messageEn);
  }

  const passageText = result.passages
    .map((p) => {
      const label =
        typeof p.locator.chapter === 'number' && typeof p.locator.verse === 'number'
          ? `${p.locator.chapter}.${p.locator.verse}`
          : p.locator.label || p.sectionId;
      const head = p.kind === 'speaker' ? `${label}` : `${label}`;
      return p.meaning ? `${head}\n${p.original}\nभावार्थ: ${p.meaning}` : `${head}\n${p.original}`;
    })
    .join('\n\n');

  const header =
    result.scope.kind === 'verse' && result.scope.chapter && result.scope.fromVerse
      ? `${result.bookTitle} ${result.scope.chapter}.${result.scope.fromVerse}`
      : `${result.bookTitle} — ${result.scope.kind}${result.scope.chapter ? ` ${result.scope.chapter}` : ''}`;

  return {
    found: true,
    text: `${header}\n\n${passageText}`,
    sourceName: result.bookTitle,
    chapter: result.scope.chapter,
    verse: result.scope.fromVerse,
    section: result.scope.sectionId,
    isPartial: result.scope.kind !== 'book',
    isFull: result.scope.kind === 'book' && result.isCompleteScope,
    note: result.isCompleteScope
      ? `संस्करण: ${result.editionId} — अनुरोधित अंश पूर्ण रूप से संग्रहीत है।`
      : `संस्करण: ${result.editionId} — यह अंश इस संस्करण में आंशिक है; केवल संग्रहीत पाठ दिया गया है।`,
    editionId: result.editionId,
    passages: result.passages,
    scopeKind: result.scope.kind,
  };
}

/** Exposed for the gateway's adversarial "invalid reference" check. */
export async function validateReference(bookToken: string, chapter: number, verse: number): Promise<ReadResponse> {
  const bookId = resolveBookId(bookToken);
  if (!bookId) return failureResponse('UNKNOWN_BOOK', 'यह ग्रन्थ पंजीकृत नहीं है।', bookToken, 'unknown book');
  return toResponse(await lookupVerse(bookId, chapter, verse), 'verse');
}

// ---------------------------------------------------------------------------
// Conversational reader turns (chat + reader UI share this)
// ---------------------------------------------------------------------------

export interface ReaderGatewayResult {
  /** True when this utterance was a reader command (handled or clarified). */
  handled: boolean;
  text: string;
  /** True when `text` contains stored scripture text. */
  found: boolean;
  code?: LookupFailureCode;
  session?: ReadingSession;
  passages?: PassageRecord[];
  provenance: 'SOURCE_DOCUMENTED' | 'AI_EXPLANATION';
  cancelledTokens: string[];
  /** Ask exactly one question instead of guessing. */
  needsClarification?: { questionHi: string; questionEn: string };
}

/** Does the utterance clearly talk about reading/listening to scripture? */
function isReadingUtterance(query: string): boolean {
  const q = normalizeQuery(query);
  if (READ_TRIGGERS.test(q)) return true;
  return /श्लोक|अध्याय|पाठ|सुनाओ|सुनाएं|chapter|verse|shlok|recite|reading/i.test(q);
}

function clarification(language: 'hi' | 'en', session: ReadingSession | null): ReaderGatewayResult {
  return {
    handled: true,
    found: false,
    text:
      language === 'en'
        ? 'Which chapter should I read? For example: "Gita chapter 2" or "Gita 2.47".'
        : 'कृपया अध्याय बताएं — जैसे "गीता अध्याय २" या "गीता २.४७"।',
    provenance: 'AI_EXPLANATION',
    cancelledTokens: session ? [session.cancellationToken] : [],
    needsClarification: {
      questionHi: 'कौन सा अध्याय पढ़ूँ?',
      questionEn: 'Which chapter should I read?',
    },
  };
}

/**
 * Handle one user utterance in the context of an active reading session.
 * Control commands (continue/pause/repeat/next/previous/explain/source/
 * language/speed) only make sense with a session; without one we ask, we do
 * not invent a starting point.
 */
export async function handleReaderCommand(
  query: string,
  language: 'hi' | 'en',
  session: ReadingSession | null,
): Promise<ReaderGatewayResult> {
  const command = parseReaderCommand(query);
  if (command.type === 'UNKNOWN') return { handled: false, text: '', found: false, provenance: 'AI_EXPLANATION', cancelledTokens: [] };

  // Control commands ("previous", "faster", "continue"…) only belong to an
  // active reading session or to an utterance that is clearly about reading.
  // Without that, ordinary sentences such as "previous consultation history"
  // or "invent a muhurat quickly" must stay on their normal intent path.
  if (command.type !== 'READ' && !session && !isReadingUtterance(query)) {
    return { handled: false, text: '', found: false, provenance: 'AI_EXPLANATION', cancelledTokens: [] };
  }

  const lang = session?.language ?? language;
  const requireSession = (what: string): ReaderGatewayResult => ({
    handled: true,
    found: false,
    text:
      lang === 'en'
        ? `There is no active reading to ${what}. Tell me what to read, e.g. "Gita chapter 2".`
        : `${what} के लिए अभी कोई पाठ प्रगति में नहीं है। कृपया बताएं क्या पढ़ूँ — जैसे "गीता अध्याय २"।`,
    provenance: 'AI_EXPLANATION',
    cancelledTokens: [],
  });

  switch (command.type) {
    case 'READ': {
      const bookToken = command.bookToken ?? session?.bookId ?? null;
      if (!bookToken) {
        return { handled: false, text: '', found: false, provenance: 'AI_EXPLANATION', cancelledTokens: [] };
      }
      const scope = command.scope as ReadingScopeInput;
      let resolved = scope;
      if ((scope.kind === 'verse' || scope.kind === 'range') && (!scope.chapter || scope.chapter === 0)) {
        const activeChapter = session?.scope?.chapter;
        if (typeof activeChapter === 'number' && activeChapter > 0) {
          resolved = { ...scope, chapter: activeChapter } as ReadingScopeInput;
        } else {
          return clarification(lang, session);
        }
      }
      if (scope.kind === 'chapter' && (!scope.chapter || scope.chapter === 0)) {
        return clarification(lang, session);
      }
      const turn = await startReading({
        bookId: bookToken,
        scope: resolved as StartReadingOptions['scope'],
        language: lang,
        previousSession: session,
      });
      return {
        handled: true,
        found: turn.provenance === 'SOURCE_DOCUMENTED' && turn.passages.length > 0,
        text: turn.text,
        session: turn.session,
        passages: turn.passages,
        provenance: turn.provenance,
        cancelledTokens: turn.cancelledTokens,
      };
    }
    case 'CONTINUE':
      if (!session) return requireSession('continue');
      return turnToResult(await resumeReading(session));
    case 'PAUSE':
      if (!session) return requireSession('pause');
      return turnToResult(await pauseReading(session));
    case 'STOP':
      if (!session) return requireSession('stop');
      return turnToResult(await stopReading(session));
    case 'REPEAT':
      if (!session) return requireSession('repeat');
      return turnToResult(await repeatPassage(session));
    case 'NEXT':
      if (!session) return requireSession('move forward in');
      return turnToResult(await moveCursor(session, 1));
    case 'PREVIOUS':
      if (!session) return requireSession('move back in');
      return turnToResult(await moveCursor(session, -1));
    case 'EXPLAIN':
      if (!session) return requireSession('explain');
      return turnToResult(await explainCurrent(session));
    case 'SOURCE':
      if (!session) return requireSession('cite');
      return turnToResult(await citeCurrent(session));
    case 'MEANING':
      if (!session) return requireSession('change');
      return turnToResult(setPreferences(session, { includeMeaning: command.include }));
    case 'LANGUAGE':
      if (!session) return requireSession('change language in');
      return turnToResult(setPreferences(session, { language: command.language }));
    case 'SPEED': {
      if (!session) return requireSession('change speed in');
      const next = Math.min(2, Math.max(0.5, Number((session.speed + command.delta).toFixed(2))));
      return turnToResult(setPreferences(session, { speed: next }));
    }
    default:
      return { handled: false, text: '', found: false, provenance: 'AI_EXPLANATION', cancelledTokens: [] };
  }
}

function turnToResult(turn: ReaderTurn): ReaderGatewayResult {
  return {
    handled: true,
    found: turn.provenance === 'SOURCE_DOCUMENTED' && turn.passages.length > 0,
    text: turn.text,
    session: turn.session,
    passages: turn.passages,
    provenance: turn.provenance,
    cancelledTokens: turn.cancelledTokens,
  };
}

export { normalizeQuery };
