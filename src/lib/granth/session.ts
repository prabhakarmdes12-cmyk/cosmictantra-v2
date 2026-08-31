/**
 * One reading session shared by chat, the reader UI and (later) the speech
 * layer.
 *
 * Design decisions that are explicit on purpose:
 *  - RESUME GRANULARITY IS PASSAGE-LEVEL, with chunk-level position inside the
 *    current passage (`chunkIndex`). Word-level resume is NOT implemented and
 *    must not be promised: the browser speech layer gives no trusted word
 *    boundary events here.
 *  - The session is a plain serializable object. The client may persist it
 *    (device-local). Nothing here claims cross-device or account sync.
 *  - Every mutating action bumps `cancellationToken` so stale audio/results
 *    from a previous request can be discarded by the caller.
 */
import {
  devanagariNumber,
  lookupBook,
  lookupChapter,
  lookupRange,
  lookupSection,
  lookupVerse,
  lookupContext,
  resolveBookId,
} from './lookup';
import { loadBook } from './registry';
import type { LookupResult, PassageRecord, ReadingScopeKind } from './types';

export type ReadingState = 'idle' | 'loading' | 'reading' | 'paused' | 'explaining' | 'completed' | 'error';

export const SESSION_SCHEMA_VERSION = 1;

export interface ReadingSession {
  version: number;
  sessionId: string;
  state: ReadingState;
  bookId: string;
  bookTitle: string;
  editionId: string;
  editionLabel: string;
  scope: {
    kind: ReadingScopeKind;
    chapter?: number;
    fromVerse?: number;
    toVerse?: number;
    sectionId?: string;
  };
  /** Passage ids in reading order. */
  queue: string[];
  cursorIndex: number;
  /** Index of the last passage confirmed as read (>=0) or -1. */
  lastCompletedIndex: number;
  /** Chunk index inside the current passage (speech chunks, not words). */
  chunkIndex: number;
  language: 'hi' | 'en';
  includeMeaning: boolean;
  /** Speech rate multiplier. */
  speed: number;
  /** Bumped on every interruption/redirect so stale work can be dropped. */
  cancellationToken: string;
  updatedAt: number;
  /** True when the requested scope is complete for this edition. */
  isCompleteScope: boolean;
  /** Set when the session cannot resolve the request and awaits one answer. */
  pendingClarification?: { questionHi: string; questionEn: string };
  lastError?: string;
}

export interface ReaderTurn {
  session: ReadingSession;
  /** Passages that should be rendered/spoken for this turn (usually 0 or 1). */
  passages: PassageRecord[];
  /** Chat/reader copy for this turn. */
  text: string;
  /** Provenance the caller must attach: stored source vs assistant wording. */
  provenance: 'SOURCE_DOCUMENTED' | 'AI_EXPLANATION';
  /** Tokens the caller should now treat as cancelled (stop stale audio). */
  cancelledTokens: string[];
  needsClarification?: { questionHi: string; questionEn: string };
  /** True when the queue is exhausted. */
  completed?: boolean;
}

export const DEFAULT_SPEED = 1;
const MAX_CHUNK_CHARS = 220;

function newToken(): string {
  return `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function baseSession(bookId: string): ReadingSession {
  return {
    version: SESSION_SCHEMA_VERSION,
    sessionId: `rs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    state: 'idle',
    bookId,
    bookTitle: bookId,
    editionId: 'unversioned',
    editionLabel: '',
    scope: { kind: 'book' },
    queue: [],
    cursorIndex: 0,
    lastCompletedIndex: -1,
    chunkIndex: 0,
    language: 'hi',
    includeMeaning: true,
    speed: DEFAULT_SPEED,
    cancellationToken: newToken(),
    updatedAt: Date.now(),
    isCompleteScope: false,
  };
}

// ---------------------------------------------------------------------------
// Text shaping
// ---------------------------------------------------------------------------

/** Human label for a passage, e.g. "अध्याय २ • श्लोक ४७". */
export function passageLabel(passage: PassageRecord, language: 'hi' | 'en'): string {
  const { locator, kind } = passage;
  if (kind === 'speaker') return locator.label || '';
  if (language === 'en') {
    if (typeof locator.chapter === 'number' && typeof locator.verse === 'number') {
      return locator.verseRange
        ? `Chapter ${locator.chapter}, verses ${locator.verseRange.from}-${locator.verseRange.to}`
        : `Chapter ${locator.chapter}, verse ${locator.verse}`;
    }
    return passage.sectionId;
  }
  if (typeof locator.chapter === 'number' && typeof locator.verse === 'number') {
    return locator.verseRange
      ? `अध्याय ${devanagariNumber(locator.chapter)} • श्लोक ${devanagariNumber(locator.verseRange.from)}-${devanagariNumber(locator.verseRange.to)}`
      : `अध्याय ${devanagariNumber(locator.chapter)} • श्लोक ${devanagariNumber(locator.verse)}`;
  }
  return passage.sectionId;
}

/** Chat/reader rendering of one stored passage. Stored text only. */
export function renderPassage(passage: PassageRecord, opts: { includeMeaning?: boolean; language?: 'hi' | 'en' } = {}): string {
  const includeMeaning = opts.includeMeaning !== false;
  const language = opts.language ?? 'hi';
  const label = passageLabel(passage, language);
  const lines: string[] = [];
  if (label) lines.push(label);
  lines.push(passage.original);
  if (includeMeaning && passage.meaning) {
    lines.push('', language === 'en' ? `Meaning: ${passage.meaning}` : `भावार्थ: ${passage.meaning}`);
  }
  return lines.join('\n');
}

/**
 * Split a passage into speech-sized chunks at sentence/verse-line boundaries.
 * Deterministic; used to report chunk-level position. The browser TTS layer
 * may chunk further for engine limits.
 */
export function chunkPassageForSpeech(passage: PassageRecord, opts: { includeMeaning?: boolean } = {}): string[] {
  const includeMeaning = opts.includeMeaning !== false;
  const source = includeMeaning
    ? `${passage.original}\n${passage.meaning ?? ''}`.trim()
    : passage.original;
  const pieces = source
    .split(/(?<=[।॥.!?])\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const piece of pieces) {
    if (current && (current.length + piece.length + 1) > MAX_CHUNK_CHARS) {
      chunks.push(current);
      current = piece;
    } else {
      current = current ? `${current} ${piece}` : piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Where the reader is, in one line. */
export function describePosition(session: ReadingSession): string {
  const total = session.queue.length;
  const pos = Math.min(session.cursorIndex + 1, Math.max(total, 1));
  if (session.language === 'en') {
    return `${session.bookTitle} — ${session.scope.kind} • ${pos}/${total}`;
  }
  return `${session.bookTitle} — ${session.scope.kind} • ${devanagariNumber(pos)}/${devanagariNumber(total)}`;
}

// ---------------------------------------------------------------------------
// Session construction
// ---------------------------------------------------------------------------

function resultToSession(base: ReadingSession, result: Extract<LookupResult, { status: 'FOUND' }>): ReadingSession {
  const queue = result.passages.map((p) => p.passageId);
  return {
    ...base,
    bookId: result.bookId,
    bookTitle: result.bookTitle,
    editionId: result.editionId,
    editionLabel: result.editionLabel,
    isCompleteScope: result.isCompleteScope,
    queue,
    cursorIndex: 0,
    lastCompletedIndex: -1,
    chunkIndex: 0,
    state: queue.length ? 'reading' : 'error',
    updatedAt: Date.now(),
  };
}

export interface StartReadingOptions {
  bookId: string;
  scope: {
    kind: ReadingScopeKind;
    chapter?: number;
    /** Verse lookups may arrive as `verse` (command parser) or `fromVerse` (session scope). */
    verse?: number;
    fromVerse?: number;
    toVerse?: number;
    sectionId?: string;
  };
  language?: 'hi' | 'en';
  includeMeaning?: boolean;
  speed?: number;
  previousSession?: ReadingSession | null;
}

/** Build a resumable reading queue for a scope. Never returns fabricated text. */
export async function startReading(options: StartReadingOptions): Promise<ReaderTurn> {
  const bookId = resolveBookId(options.bookId);
  const cancelledTokens: string[] = [];
  if (options.previousSession) cancelledTokens.push(options.previousSession.cancellationToken);

  const base: ReadingSession = {
    ...(options.previousSession ? baseSessionFrom(options.previousSession) : baseSession(bookId ?? options.bookId)),
    language: options.language ?? options.previousSession?.language ?? 'hi',
    includeMeaning: options.includeMeaning ?? options.previousSession?.includeMeaning ?? true,
    speed: options.speed ?? options.previousSession?.speed ?? DEFAULT_SPEED,
    cancellationToken: newToken(),
    state: 'loading',
    updatedAt: Date.now(),
  };

  if (!bookId) {
    return {
      session: { ...base, state: 'error', lastError: 'UNKNOWN_BOOK' },
      passages: [],
      text: 'यह ग्रन्थ इस पुस्तकालय में पंजीकृत नहीं है। कृपया गीता, रामचरितमानस, शिव महापुराण या देवी भागवत में से चुनें।',
      provenance: 'AI_EXPLANATION',
      cancelledTokens,
    };
  }

  const { scope } = options;
  let result: LookupResult;
  switch (scope.kind) {
    case 'verse':
      result = await lookupVerse(
        bookId,
        scope.chapter as number,
        ((scope as { verse?: number }).verse ?? scope.fromVerse) as number,
      );
      break;
    case 'range':
      result = await lookupRange(bookId, scope.chapter as number, scope.fromVerse as number, scope.toVerse as number);
      break;
    case 'section':
      result = await lookupSection(bookId, scope.sectionId as string);
      break;
    case 'chapter':
      result = await lookupChapter(bookId, scope.chapter as number);
      break;
    case 'book':
    default:
      result = await lookupBook(bookId);
      break;
  }

  if (result.status === 'FAILURE') {
    const text = base.language === 'en' ? result.messageEn : result.messageHi;
    return {
      session: { ...base, bookId, state: 'error', lastError: result.code, pendingClarification: undefined },
      passages: [],
      text,
      provenance: 'AI_EXPLANATION',
      cancelledTokens,
    };
  }

  const session = resultToSession(base, result);
  session.scope = { ...scope };

  const first = await currentPassage(session);
  const passages = first ? [first] : [];
  const header = session.language === 'en'
    ? `${result.bookTitle} — ${result.scope.kind} ready (${session.queue.length} passages). Edition: ${result.editionLabel}.`
    : `${result.bookTitle} — ${result.scope.kind} पंक्ति तैयार (${devanagariNumber(session.queue.length)} अंश)। संस्करण: ${result.editionLabel}।`;
  const completeness = result.isCompleteScope
    ? ''
    : session.language === 'en'
      ? '\n\nNote: this scope is not complete for this edition — only stored passages are read.'
      : '\n\nध्यान दें: यह अंश इस संस्करण में पूर्ण नहीं है — केवल संग्रहीत पाठ ही पढ़ा जाएगा।';

  return {
    session,
    passages,
    text: [header, ...passages.map((p) => renderPassage(p, { includeMeaning: session.includeMeaning, language: session.language })), completeness]
      .join('\n\n')
      .trim(),
    provenance: 'SOURCE_DOCUMENTED',
    cancelledTokens,
  };
}

function baseSessionFrom(previous: ReadingSession): ReadingSession {
  return { ...previous, cancellationToken: newToken(), updatedAt: Date.now() };
}

/** Load the passage at the cursor. */
export async function currentPassage(session: ReadingSession): Promise<PassageRecord | null> {
  if (!session.queue.length) return null;
  const id = session.queue[session.cursorIndex];
  if (!id) return null;
  const book = await loadBook(session.bookId);
  return book.byId[id] ?? null;
}

function cloneSession(session: ReadingSession, patch: Partial<ReadingSession>): ReadingSession {
  return { ...session, ...patch, cancellationToken: newToken(), updatedAt: Date.now() };
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export async function pauseReading(session: ReadingSession): Promise<ReaderTurn> {
  const next = { ...cloneSession(session, { state: 'paused' as ReadingState }), cancellationToken: newToken() };
  return {
    session: next,
    passages: [],
    text: next.language === 'en'
      ? `Paused at ${describePosition(next)}. Say "resume" to continue.`
      : `${describePosition(next)} पर रोका गया। "आगे पढ़ो" कहें तो वहीं से आगे पढ़ूँगी।`,
    provenance: 'AI_EXPLANATION',
    cancelledTokens: [session.cancellationToken],
  };
}

export async function stopReading(session: ReadingSession): Promise<ReaderTurn> {
  const next = cloneSession(session, { state: 'paused' });
  return {
    session: next,
    passages: [],
    text: next.language === 'en'
      ? `Stopped. Position saved at ${describePosition(next)} (on this device).`
      : `पाठ रोका गया। स्थिति ${describePosition(next)} पर सुरक्षित है (इसी डिवाइस पर)।`,
    provenance: 'AI_EXPLANATION',
    cancelledTokens: [session.cancellationToken],
  };
}

export async function resumeReading(session: ReadingSession): Promise<ReaderTurn> {
  const passage = await currentPassage(session);
  if (!passage) {
    return {
      session: cloneSession(session, { state: 'completed' }),
      passages: [],
      text: session.language === 'en' ? 'This reading is already finished.' : 'यह पाठ पहले ही पूरा हो चुका है।',
      provenance: 'AI_EXPLANATION',
      cancelledTokens: [session.cancellationToken],
    };
  }
  const next = cloneSession(session, { state: 'reading' });
  return {
    session: next,
    passages: [passage],
    text: renderPassage(passage, { includeMeaning: next.includeMeaning, language: next.language }),
    provenance: 'SOURCE_DOCUMENTED',
    cancelledTokens: [session.cancellationToken],
  };
}

/** Move the cursor by `delta` passages and return the passage now current. */
export async function moveCursor(session: ReadingSession, delta: number): Promise<ReaderTurn> {
  const target = session.cursorIndex + delta;
  if (target < 0) {
    return {
      session: cloneSession(session, { state: 'reading' }),
      passages: [],
      text: session.language === 'en' ? 'This is the first passage.' : 'यह पहला अंश है।',
      provenance: 'AI_EXPLANATION',
      cancelledTokens: [session.cancellationToken],
    };
  }
  if (target >= session.queue.length) {
    const next = cloneSession(session, { state: 'completed', cursorIndex: session.queue.length, lastCompletedIndex: session.queue.length - 1 });
    return {
      session: next,
      passages: [],
      text: session.language === 'en'
        ? 'This reading is complete.'
        : 'यह पाठ पूरा हुआ।',
      provenance: 'AI_EXPLANATION',
      cancelledTokens: [session.cancellationToken],
      completed: true,
    };
  }
  const next = cloneSession(session, {
    state: 'reading',
    cursorIndex: target,
    lastCompletedIndex: Math.max(session.lastCompletedIndex, target - 1),
    chunkIndex: 0,
  });
  const passage = await currentPassage(next);
  return {
    session: next,
    passages: passage ? [passage] : [],
    text: passage ? renderPassage(passage, { includeMeaning: next.includeMeaning, language: next.language }) : '',
    provenance: 'SOURCE_DOCUMENTED',
    cancelledTokens: [session.cancellationToken],
  };
}

/** Repeat: re-speak the current passage from its first chunk. */
export async function repeatPassage(session: ReadingSession): Promise<ReaderTurn> {
  const next = cloneSession(session, { state: 'reading', chunkIndex: 0 });
  const passage = await currentPassage(next);
  return {
    session: next,
    passages: passage ? [passage] : [],
    text: passage ? renderPassage(passage, { includeMeaning: next.includeMeaning, language: next.language }) : '',
    provenance: 'SOURCE_DOCUMENTED',
    cancelledTokens: [session.cancellationToken],
  };
}

/**
 * Explain the current passage.
 *
 * The stored meaning is quoted as stored text; everything else is explicitly
 * labelled as the assistant's explanation (no fabricated citation).
 */
export async function explainCurrent(session: ReadingSession): Promise<ReaderTurn> {
  const passage = await currentPassage(session);
  if (!passage) {
    return {
      session: cloneSession(session, { state: 'error', lastError: 'NO_CURRENT_PASSAGE' }),
      passages: [],
      text: session.language === 'en' ? 'There is no passage at the cursor.' : 'इस समय कोई अंश नहीं है।',
      provenance: 'AI_EXPLANATION',
      cancelledTokens: [session.cancellationToken],
    };
  }
  const context =
    typeof passage.locator.chapter === 'number' && typeof passage.locator.verse === 'number'
      ? await lookupContext(session.bookId, passage.locator.chapter, passage.locator.verse, 1)
      : { before: [], current: passage, after: [] };

  const lines: string[] = [];
  const label = passageLabel(passage, session.language);
  if (label) lines.push(label);
  lines.push(passage.original);
  if (passage.meaning) {
    lines.push('', session.language === 'en' ? `Stored meaning: ${passage.meaning}` : `संग्रहीत भावार्थ: ${passage.meaning}`);
  }
  const speaker = context.before.find((p) => p.kind === 'speaker');
  if (speaker) {
    lines.push('', session.language === 'en' ? `Spoken by: ${speaker.locator.label}` : `वक्ता: ${speaker.locator.label}`);
  }
  const nextVerse = context.after.find((p) => p.kind === 'verse');
  if (nextVerse) {
    lines.push(
      '',
      session.language === 'en'
        ? `Next stored unit: ${passageLabel(nextVerse, 'en')}`
        : `अगला संग्रहीत अंश: ${passageLabel(nextVerse, 'hi')}`,
    );
  }
  lines.push(
    '',
    session.language === 'en'
      ? 'The lines above are stored text; any further commentary is mine as an assistant, not a new scripture citation.'
      : 'ऊपर की पंक्तियाँ संग्रहीत पाठ हैं; आगे की कोई भी टिप्पणी मेरी सहायक-व्याख्या है, कोई नया शास्त्र-उद्धरण नहीं।',
  );

  const next = cloneSession(session, { state: 'paused', pendingClarification: undefined });
  return {
    session: next,
    passages: [passage],
    text: lines.join('\n'),
    provenance: 'AI_EXPLANATION',
    cancelledTokens: [session.cancellationToken],
  };
}

/** Cite where the current passage is stored. */
export async function citeCurrent(session: ReadingSession): Promise<ReaderTurn> {
  const passage = await currentPassage(session);
  if (!passage) {
    return {
      session: cloneSession(session, { state: 'error', lastError: 'NO_CURRENT_PASSAGE' }),
      passages: [],
      text: session.language === 'en' ? 'Nothing is being read right now.' : 'अभी कोई पाठ प्रगति में नहीं है।',
      provenance: 'AI_EXPLANATION',
      cancelledTokens: [session.cancellationToken],
    };
  }
  const text = session.language === 'en'
    ? [
        `${passageLabel(passage, 'en')}`,
        `Book: ${passage.bookId}`,
        `Edition: ${passage.editionId}`,
        `Stored section: ${passage.source.sectionId} (row ${passage.source.rowIndex})`,
        `Data file: ${passage.source.dataFile}`,
        `Checksum: ${passage.checksum}`,
        `Attribution as stored: ${passage.source.attribution}`,
      ].join('\n')
    : [
        `${passageLabel(passage, 'hi')}`,
        `ग्रन्थ: ${passage.bookId}`,
        `संस्करण: ${passage.editionId}`,
        `संग्रहीत अनुभाग: ${passage.source.sectionId} (पंक्ति ${passage.source.rowIndex})`,
        `डेटा फ़ाइल: ${passage.source.dataFile}`,
        `चेकसम: ${passage.checksum}`,
        `संग्रहीत श्रेय: ${passage.source.attribution}`,
      ].join('\n');
  const next = cloneSession(session, { state: 'paused' });
  return {
    session: next,
    passages: [passage],
    text,
    provenance: 'SOURCE_DOCUMENTED',
    cancelledTokens: [session.cancellationToken],
  };
}

export function setPreferences(
  session: ReadingSession,
  patch: { language?: 'hi' | 'en'; includeMeaning?: boolean; speed?: number },
): ReaderTurn {
  const next: ReadingSession = {
    ...session,
    language: patch.language ?? session.language,
    includeMeaning: patch.includeMeaning ?? session.includeMeaning,
    speed: patch.speed ?? session.speed,
    cancellationToken: newToken(),
    updatedAt: Date.now(),
  };
  const notes: string[] = [];
  if (patch.language) {
    notes.push(next.language === 'en' ? 'Language set to English.' : 'भाषा हिन्दी कर दी गई।');
  }
  if (patch.includeMeaning !== undefined) {
    notes.push(
      next.language === 'en'
        ? patch.includeMeaning
          ? 'Meaning will be included.'
          : 'Original text only from now on.'
        : patch.includeMeaning
          ? 'अब भावार्थ भी सुनाऊँगी।'
          : 'अब केवल मूल पाठ पढ़ूँगी।',
    );
  }
  if (patch.speed !== undefined) {
    notes.push(next.language === 'en' ? `Speed ${next.speed.toFixed(2)}×.` : `गति ${next.speed.toFixed(2)}×।`);
  }
  return {
    session: next,
    passages: [],
    text: notes.join(' '),
    provenance: 'AI_EXPLANATION',
    cancelledTokens: [session.cancellationToken],
  };
}

/** Validate/upgrade a session that came from an untrusted client. */
export function reviveSession(input: unknown): ReadingSession | null {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as Partial<ReadingSession>;
  if (candidate.version !== SESSION_SCHEMA_VERSION) return null;
  if (typeof candidate.bookId !== 'string' || !Array.isArray(candidate.queue)) return null;
  if (!resolveBookId(candidate.bookId)) return null;
  return { ...(input as ReadingSession) };
}

// ---------------------------------------------------------------------------
// Bounded in-memory server store (device-local sessions are client-held; this
// store only backs a server-issued sessionId and is capped).
// ---------------------------------------------------------------------------

const MAX_SESSIONS = 200;
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const store = new Map<string, { session: ReadingSession; expiresAt: number }>();

export function saveServerSession(session: ReadingSession): ReadingSession {
  if (store.size >= MAX_SESSIONS) {
    const oldest = [...store.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
    if (oldest) store.delete(oldest[0]);
  }
  store.set(session.sessionId, { session, expiresAt: Date.now() + SESSION_TTL_MS });
  return session;
}

export function getServerSession(sessionId: string): ReadingSession | null {
  const entry = store.get(sessionId);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(sessionId);
    return null;
  }
  return entry.session;
}

export function clearServerSessions(): void {
  store.clear();
}

export { devanagariNumber };
