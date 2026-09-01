/**
 * KASHI SAHAYAK — interaction state: modes, consent, voice input,
 * clarification, and non-sensitive session persistence.
 *
 * Design rules:
 *  - No long recitation starts without explicit, scoped consent.
 *  - A low-confidence transcript is never auto-sent; the user edits it first.
 *  - Clarification choices are generated from the current conversation
 *    context, not a fixed list, and always offer an escape ("इनमें से कोई
 *    नहीं"), a retry and a text-entry path.
 *  - Only non-sensitive reading state is persisted; emotional transcripts are
 *    never written to storage. Forged or malformed session data is rejected.
 *  - Speech failure is never treated as successful delivery: the cursor does
 *    not advance.
 */

import type { EmotionId, PassageRef, UserMode } from './emotionalSupport';

/* ------------------------------------------------------------------ */
/* Voice input                                                         */
/* ------------------------------------------------------------------ */

export type VoiceInputState =
  | 'idle'
  | 'requesting-permission'
  | 'listening'
  | 'processing'
  | 'understood'
  | 'uncertain'
  | 'permission-denied'
  | 'unavailable'
  | 'unsupported'
  | 'network-error';

export const VOICE_INPUT_STATES: VoiceInputState[] = [
  'idle',
  'requesting-permission',
  'listening',
  'processing',
  'understood',
  'uncertain',
  'permission-denied',
  'unavailable',
  'unsupported',
  'network-error',
];

export type VoiceEvent =
  | 'request'
  | 'permission-granted'
  | 'permission-denied'
  | 'mic-unavailable'
  | 'unsupported'
  | 'speech-start'
  | 'speech-end'
  | 'result-final'
  | 'result-uncertain'
  | 'network-error'
  | 'cancel'
  | 'reset';

/** Deterministic voice-input state machine. */
export function nextVoiceState(current: VoiceInputState, event: VoiceEvent): VoiceInputState {
  switch (event) {
    case 'request':
      return current === 'unsupported' ? 'unsupported' : 'requesting-permission';
    case 'permission-granted':
      return 'listening';
    case 'permission-denied':
      return 'permission-denied';
    case 'mic-unavailable':
      return 'unavailable';
    case 'unsupported':
      return 'unsupported';
    case 'speech-start':
      return current === 'unsupported' ? 'unsupported' : 'listening';
    case 'speech-end':
      return current === 'unsupported' ? 'unsupported' : 'processing';
    case 'result-final':
      return 'understood';
    case 'result-uncertain':
      return 'uncertain';
    case 'network-error':
      return 'network-error';
    case 'cancel':
    case 'reset':
      return 'idle';
    default:
      return current;
  }
}

export const AUTO_SEND_CONFIDENCE = 0.6;

export interface Transcript {
  text: string;
  confidence: number;
}

/**
 * A transcript may only be auto-sent when recognition is confident AND the
 * text is non-trivial. Anything else requires the user to edit or confirm.
 */
export function classifyTranscript(t: Transcript): { state: 'understood' | 'uncertain'; canAutoSend: boolean } {
  const text = (t.text ?? '').trim();
  if (!text || t.confidence < AUTO_SEND_CONFIDENCE) return { state: 'uncertain', canAutoSend: false };
  return { state: 'understood', canAutoSend: true };
}

/** Voice-state messages, including the honest "I cannot hear you" fallbacks. */
export function voiceStateMessage(state: VoiceInputState, language: 'hi' | 'en' = 'hi'): string {
  const hi: Record<VoiceInputState, string> = {
    idle: 'बोलने के लिए माइक दबाएँ — आप चाहें तो लिख भी सकती हैं।',
    'requesting-permission': 'माइक की अनुमति माँगी जा रही है…',
    listening: 'मैं सुन रही हूँ…',
    processing: 'मैं समझ रही हूँ…',
    understood: 'मैं समझ गयी — भेजने से पहले आप इसे बदल भी सकती हैं।',
    uncertain: 'मुझे पूरी बात स्पष्ट नहीं मिली — कृपया इसे सुधारें या लिखकर बताएँ।',
    'permission-denied': 'माइक की अनुमति नहीं मिली — आप लिखकर बता सकती हैं, या ब्राउज़र सेटिंग से अनुमति दे सकती हैं।',
    unavailable: 'इस डिवाइस पर माइक उपलब्ध नहीं है — कृपया लिखकर बताएँ।',
    unsupported: 'इस ब्राउज़र में बोलकर बताने की सुविधा उपलब्ध नहीं है — कृपया लिखकर बताएँ।',
    'network-error': 'पहचान सेवा से संपर्क नहीं हो पाया — कृपया फिर से बोलें या लिखकर बताएँ।',
  };
  const en: Record<VoiceInputState, string> = {
    idle: 'Tap the mic to speak — you can always type instead.',
    'requesting-permission': 'Requesting microphone permission…',
    listening: 'I am listening…',
    processing: 'Understanding…',
    understood: 'Understood — you can edit this before sending.',
    uncertain: 'I did not catch that clearly — please edit or type it.',
    'permission-denied': 'Microphone permission was denied — you can type, or enable it in browser settings.',
    unavailable: 'No microphone is available on this device — please type.',
    unsupported: 'Speech recognition is not supported in this browser — please type.',
    'network-error': 'The recognition service could not be reached — please retry or type.',
  };
  return language === 'hi' ? hi[state] : en[state];
}

/** Detects Hinglish / Hindi / English from the recognised or typed text. */
export function detectLanguage(text: string): 'hi' | 'en' {
  const t = text ?? '';
  if (/[\u0900-\u097F]/.test(t)) return 'hi';
  return 'en';
}

/* ------------------------------------------------------------------ */
/* Recitation consent                                                  */
/* ------------------------------------------------------------------ */

export type ReadingScope = 'verse' | 'short-passage' | 'chapter' | 'book';

/** Long scopes require explicit consent; short ones do not. */
export function requiresConsent(scope: ReadingScope): boolean {
  return scope === 'chapter' || scope === 'book';
}

export interface AutoplayDecision {
  shouldRecite: boolean;
  /** Shown when autoplay is blocked. */
  fallbackLabel: string | null;
  reason: string;
}

export const LISTEN_VERSE_LABEL = 'श्लोक सुनें';

/**
 * Decides whether recitation may start automatically.
 * A long scope is never auto-started, even with a gesture.
 */
export function decideAutoplay(options: {
  scope: ReadingScope;
  userGesture: boolean;
  autoplayAllowed: boolean;
  mode: UserMode;
}): AutoplayDecision {
  const { scope, userGesture, autoplayAllowed, mode } = options;
  if (mode === 'conversation-only' || mode === 'silent') {
    return { shouldRecite: false, fallbackLabel: null, reason: 'mode does not include audio' };
  }
  if (requiresConsent(scope)) {
    return {
      shouldRecite: false,
      fallbackLabel: null,
      reason: 'long reading requires explicit consent, never autoplay',
    };
  }
  if (!userGesture) {
    return { shouldRecite: false, fallbackLabel: LISTEN_VERSE_LABEL, reason: 'no direct user gesture' };
  }
  if (!autoplayAllowed) {
    return { shouldRecite: false, fallbackLabel: LISTEN_VERSE_LABEL, reason: 'browser rejected autoplay' };
  }
  return { shouldRecite: true, fallbackLabel: null, reason: 'short recitation after a direct gesture' };
}

/* ------------------------------------------------------------------ */
/* Clarification                                                       */
/* ------------------------------------------------------------------ */

export interface ClarificationContext {
  emotion?: EmotionId | null;
  hasPendingOffer?: boolean;
  hasPausedPassage?: boolean;
  mode?: UserMode;
  lastQuestion?: string | null;
  language?: 'hi' | 'en';
}

export const CLARIFY_PREFIX =
  'क्षमा कीजिए, मैं पूरी बात स्पष्ट नहीं समझ पायी। क्या आप इनमें से कुछ कहना चाह रही थीं?';
export const NO_MATCH_CHOICE = 'इनमें से कोई नहीं';
export const RETRY_VOICE_CHOICE = 'फिर से बोलूँगी';
export const TYPE_CHOICE = 'लिखकर बताऊँगी';

/**
 * Builds 3-5 context-sensitive clarification choices.
 * The escape, retry and text-entry options are always present.
 */
export function buildClarificationChoices(ctx: ClarificationContext = {}): string[] {
  const lang = ctx.language ?? 'hi';
  const choices: string[] = [];

  if (ctx.hasPausedPassage) choices.push('पाठ आगे बढ़ाइए');
  if (ctx.hasPendingOffer) choices.push('हाँ, पढ़िए');
  if (ctx.emotion === 'just-talk' || ctx.mode === 'conversation-only') choices.push('मेरी बात सुनिए');

  if (choices.length === 0) {
    choices.push('मेरी बात सुनिए', 'कोई श्लोक सुनाइए', 'कुण्डली के बारे में पूछना है');
  }
  if (!choices.includes('श्लोक का अर्थ समझाइए') && choices.length < 5) {
    choices.push('श्लोक का अर्थ समझाइए');
  }

  // The escape, retry and text-entry options are ALWAYS appended, after the
  // contextual choices are capped — they are never dropped by the cap.
  const core = [...new Set(choices)].slice(0, 5);
  const all = [...core, NO_MATCH_CHOICE, RETRY_VOICE_CHOICE, TYPE_CHOICE];
  return lang === 'en' ? all.map(translateChoice) : all;
}

function translateChoice(choice: string): string {
  const map: Record<string, string> = {
    'पाठ आगे बढ़ाइए': 'Continue the reading',
    'हाँ, पढ़िए': 'Yes, please read',
    'मेरी बात सुनिए': 'Just listen to me',
    'कोई श्लोक सुनाइए': 'Recite a verse',
    'श्लोक का अर्थ समझाइए': 'Explain the meaning',
    'कुण्डली के बारे में पूछना है': 'Ask about my Kundli',
    [NO_MATCH_CHOICE]: 'None of these',
    [RETRY_VOICE_CHOICE]: 'Let me speak again',
    [TYPE_CHOICE]: 'I will type it',
  };
  return map[choice] ?? choice;
}

/* ------------------------------------------------------------------ */
/* Session state (non-sensitive)                                       */
/* ------------------------------------------------------------------ */

export const KASHI_SESSION_SCHEMA = 1;

export interface KashiSession {
  schemaVersion: number;
  language: 'hi' | 'en';
  /** Voluntarily provided preferred name; never required. */
  preferredName?: string;
  emotionContext?: EmotionId | null;
  mode: UserMode;
  passageRef?: PassageRef | null;
  cursor: number;
  paused: boolean;
  speed: number;
  includeMeaning: boolean;
  muted: boolean;
  /** Monotonic counter used to guard against stale browser writes. */
  revision: number;
  pendingConsent?: { scope: ReadingScope; label: string; offeredAt: string } | null;
}

export const DEFAULT_SESSION: KashiSession = {
  schemaVersion: KASHI_SESSION_SCHEMA,
  language: 'hi',
  emotionContext: null,
  mode: 'verse-with-meaning',
  passageRef: null,
  cursor: 0,
  paused: false,
  speed: 1,
  includeMeaning: true,
  muted: false,
  revision: 1,
  pendingConsent: null,
};

const MIN_SPEED = 0.5;
const MAX_SPEED = 2;

const clampSpeed = (v: number) => Math.min(MAX_SPEED, Math.max(MIN_SPEED, v));

/**
 * Validates persisted session data. Returns null for forged or malformed
 * input rather than repairing it — the caller then starts a fresh session.
 */
export function validateSession(raw: unknown): KashiSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (s.schemaVersion !== KASHI_SESSION_SCHEMA) return null;
  if (typeof s.revision !== 'number' || !Number.isFinite(s.revision) || s.revision < 1) return null;
  if (typeof s.cursor !== 'number' || !Number.isFinite(s.cursor) || s.cursor < 0) return null;
  if (s.language !== 'hi' && s.language !== 'en') return null;
  const modes: UserMode[] = [
    'conversation-only', 'verse-only', 'verse-with-meaning',
    'complete-reading', 'short-passage', 'silent',
  ];
  if (typeof s.mode !== 'string' || !modes.includes(s.mode as UserMode)) return null;
  if (typeof s.paused !== 'boolean' || typeof s.muted !== 'boolean') return null;
  if (typeof s.includeMeaning !== 'boolean') return null;
  if (typeof s.speed !== 'number' || !Number.isFinite(s.speed)) return null;
  // Emotional transcripts must never appear in persisted state.
  if ('transcript' in s || 'emotionalTranscript' in s || 'messages' in s) return null;
  return {
    schemaVersion: KASHI_SESSION_SCHEMA,
    language: s.language,
    preferredName: typeof s.preferredName === 'string' ? s.preferredName : undefined,
    emotionContext: typeof s.emotionContext === 'string' ? (s.emotionContext as EmotionId) : null,
    mode: s.mode as UserMode,
    passageRef: (s.passageRef ?? null) as PassageRef | null,
    cursor: Math.floor(s.cursor),
    paused: s.paused,
    speed: clampSpeed(s.speed),
    includeMeaning: s.includeMeaning,
    muted: s.muted,
    revision: Math.floor(s.revision),
    pendingConsent: (s.pendingConsent ?? null) as KashiSession['pendingConsent'],
  };
}

/** The only part of the session that may be written to storage. */
export function persistableSession(s: KashiSession): Record<string, unknown> {
  return {
    schemaVersion: s.schemaVersion,
    language: s.language,
    preferredName: s.preferredName,
    emotionContext: s.emotionContext ?? null,
    mode: s.mode,
    passageRef: s.passageRef ?? null,
    cursor: s.cursor,
    paused: s.paused,
    speed: s.speed,
    includeMeaning: s.includeMeaning,
    muted: s.muted,
    revision: s.revision,
    pendingConsent: s.pendingConsent ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Reading controls                                                    */
/* ------------------------------------------------------------------ */

export function applyControl(
  session: KashiSession,
  control: 'pause' | 'resume' | 'stop' | 'mute' | 'unmute' | 'toggle-meaning' | 'advance' | 'repeat',
): KashiSession {
  const next: KashiSession = { ...session, revision: session.revision + 1 };
  switch (control) {
    case 'pause':
      return { ...next, paused: true };
    case 'resume':
      return { ...next, paused: false };
    case 'stop':
      return { ...next, paused: false, cursor: 0, passageRef: null, pendingConsent: null };
    case 'mute':
      return { ...next, muted: true };
    case 'unmute':
      return { ...next, muted: false };
    case 'toggle-meaning':
      return { ...next, includeMeaning: !session.includeMeaning };
    case 'advance':
      return { ...next, cursor: session.cursor + 1, paused: false };
    case 'repeat':
      return { ...next, paused: false };
    default:
      return session;
  }
}

export function setSpeed(session: KashiSession, speed: number): KashiSession {
  return { ...session, speed: clampSpeed(speed), revision: session.revision + 1 };
}

/**
 * Speech outcome handling. Only a successfully delivered passage advances the
 * cursor; an error or an instant silent completion leaves it untouched.
 */
export function applySpeechOutcome(
  session: KashiSession,
  outcome: 'delivered' | 'error' | 'silent-completion',
): KashiSession {
  if (outcome === 'delivered') {
    return { ...session, cursor: session.cursor + 1, revision: session.revision + 1 };
  }
  return { ...session, revision: session.revision + 1 };
}

/** Contextual quick actions for the current state — never all at once. */
export function visibleQuickActions(session: KashiSession): string[] {
  const actions: string[] = [];
  if (session.paused) actions.push('आगे पढ़ें');
  if (session.cursor > 0 || session.passageRef) actions.push('रोकें', 'फिर से सुनाएं');
  if (session.includeMeaning) actions.push('केवल मूल पाठ');
  else actions.push('अर्थ भी बताएं');
  if (session.mode !== 'conversation-only') actions.push('केवल मुझसे बात करें');
  if (session.passageRef) actions.push('पूरा पाठ पढ़ें', 'छोटा अंश');
  return actions;
}
