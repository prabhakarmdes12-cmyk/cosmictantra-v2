'use client';

/**
 * KASHI SAHAYAK — client hook binding the interaction engine to the UI.
 *
 * Responsibilities:
 *  - hold the non-sensitive session (persisted, revision-guarded);
 *  - drive the voice-input state machine;
 *  - never auto-send a doubtful transcript;
 *  - expose contextual quick actions, clarification choices and the
 *    proactive offer policy;
 *  - keep emotional transcripts out of storage entirely.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildEmotionalResponse,
  detectCrisis,
  detectEmotion,
  type EmotionId,
  type VerifiedPassage,
} from '@/lib/kashi/emotionalSupport';
import {
  DEFAULT_SESSION,
  applyControl,
  applySpeechOutcome,
  buildClarificationChoices,
  classifyTranscript,
  decideAutoplay,
  nextVoiceState,
  persistableSession,
  setSpeed,
  validateSession,
  visibleQuickActions,
  type KashiSession,
  type VoiceInputState,
} from '@/lib/kashi/interaction';
import { decideOffer, longReadingConsent, type OfferTrigger } from '@/lib/kashi/offerPolicy';

const STORAGE_KEY = 'kashi.sahayak.session.v1';

function loadSession(): KashiSession {
  if (typeof window === 'undefined') return DEFAULT_SESSION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SESSION;
    return validateSession(JSON.parse(raw)) ?? DEFAULT_SESSION;
  } catch {
    return DEFAULT_SESSION;
  }
}

export interface KashiSahayakApi {
  session: KashiSession;
  language: 'hi' | 'en';
  voiceState: VoiceInputState;
  transcript: string;
  canAutoSend: boolean;
  pendingVerse: VerifiedPassage | null;
  lastResponse: ReturnType<typeof buildEmotionalResponse> | null;
  clarification: string[];
  quickActions: string[];
  /** Increments on every state change — browser tests wait on this, not on time. */
  revision: number;
  /** Recitation decision for the pending verse (gesture + autoplay + mode). */
  autoplay: ReturnType<typeof decideAutoplay>;

  selectEmotion: (id: EmotionId, userText?: string) => void;
  sendText: (text: string) => void;
  startListening: () => void;
  stopListening: () => void;
  cancelListening: () => void;
  onSpeechResult: (text: string, confidence: number) => void;
  editTranscript: (text: string) => void;
  commitTranscript: () => string | null;
  control: (c: Parameters<typeof applyControl>[1]) => void;
  setSpeed: (s: number) => void;
  onSpeechOutcome: (o: Parameters<typeof applySpeechOutcome>[1]) => void;
  requestLongReading: (scope: 'chapter' | 'book') => string;
  consumeOffer: (trigger: OfferTrigger) => string | null;
  reset: () => void;
}

function speechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function useKashiSahayak(options: { supported?: boolean } = {}): KashiSahayakApi {
  const [detectedSupported, setDetectedSupported] = useState<boolean | null>(null);
  const supported = options.supported !== false && detectedSupported !== false;
  const recognitionRef = useRef<any>(null);
  const [session, setSession] = useState<KashiSession>(() => loadSession());
  const [voiceState, setVoiceState] = useState<VoiceInputState>(supported ? 'idle' : 'unsupported');
  const [transcript, setTranscript] = useState('');
  const [canAutoSend, setCanAutoSend] = useState(false);
  const [pendingVerse, setPendingVerse] = useState<VerifiedPassage | null>(null);
  const [lastResponse, setLastResponse] = useState<ReturnType<typeof buildEmotionalResponse> | null>(null);
  const [offeredThisSession, setOfferedThisSession] = useState(false);
  const [revision, setRevision] = useState(1);

  // Persist only non-sensitive state, and only after the first render.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistableSession(session)));
    } catch {
      /* storage unavailable — session simply stays in memory */
    }
  }, [session]);

  // Feature detection runs after mount so SSR and client agree.
  useEffect(() => {
    const ok = speechRecognitionSupported();
    setDetectedSupported(ok);
    if (!ok) setVoiceState('unsupported');
  }, []);

  const bump = useCallback((next: KashiSession) => {
    setSession(next);
    setRevision(next.revision);
  }, []);

  const selectEmotion = useCallback((id: EmotionId, userText: string = '') => {
    if (detectCrisis(userText)) {
      const r = buildEmotionalResponse(id, userText);
      setLastResponse(r);
      setPendingVerse(null);
      bump(applyControl(session, 'stop'));
      return;
    }
    const r = buildEmotionalResponse(id, userText, { mode: session.mode });
    setLastResponse(r);
    setPendingVerse(r.passage);
    bump({ ...session, emotionContext: id, revision: session.revision + 1 });
  }, [session, bump]);

  const sendText = useCallback((text: string) => {
    // Safety first: crisis language must never be routed through emotion
    // matching or the scripture flow, whatever else the text contains.
    if (detectCrisis(text)) {
      const r = buildEmotionalResponse(session.emotionContext ?? 'just-talk', text);
      setLastResponse(r);
      setPendingVerse(null);
      bump({ ...session, revision: session.revision + 1 });
      return;
    }
    const emotion = detectEmotion(text);
    if (emotion) {
      selectEmotion(emotion, text);
      return;
    }
    // No confident emotion match: clarify instead of guessing.
    setLastResponse(null);
    setPendingVerse(null);
    bump({ ...session, revision: session.revision + 1 });
  }, [session, bump, selectEmotion]);

  const onSpeechResult = useCallback((text: string, confidence: number) => {
    const verdict = classifyTranscript({ text, confidence });
    setTranscript(text);
    setCanAutoSend(verdict.canAutoSend);
    setVoiceState((s) => nextVoiceState(s, verdict.state === 'understood' ? 'result-final' : 'result-uncertain'));
  }, []);

  const startListening = useCallback(() => {
    if (!supported) {
      setVoiceState((s) => nextVoiceState(s, 'unsupported'));
      return;
    }
    setVoiceState((s) => nextVoiceState(s, 'request'));
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceState((s) => nextVoiceState(s, 'unsupported'));
      return;
    }
    try {
      const recognition = new Ctor();
      recognitionRef.current = recognition;
      recognition.lang = session.language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event: any) => {
        const last = event.results?.[event.results.length - 1];
        const text = (last?.[0]?.transcript ?? '').trim();
        const confidence = typeof last?.[0]?.confidence === 'number' ? last[0].confidence : 0;
        if (last?.isFinal) onSpeechResult(text, confidence);
      };
      recognition.onerror = (event: any) => {
        const code = String(event?.error ?? '');
        if (code === 'not-allowed' || code === 'permission-denied') {
          setVoiceState((s) => nextVoiceState(s, 'permission-denied'));
        } else if (code === 'service-not-allowed' || code === 'audio-capture') {
          setVoiceState((s) => nextVoiceState(s, 'mic-unavailable'));
        } else if (code === 'network') {
          setVoiceState((s) => nextVoiceState(s, 'network-error'));
        } else {
          // no-speech / aborted / unknown: never guess, ask the user.
          setVoiceState((s) => nextVoiceState(s, 'result-uncertain'));
        }
      };
      recognition.onend = () => {
        setVoiceState((s) => (s === 'listening' ? nextVoiceState(s, 'speech-end') : s));
      };
      recognition.start();
      setVoiceState('listening');
    } catch {
      setVoiceState((s) => nextVoiceState(s, 'mic-unavailable'));
    }
  }, [supported, session.language, onSpeechResult]);

  const cancelListening = useCallback(() => {
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    setVoiceState((s) => nextVoiceState(s, 'cancel'));
    setTranscript('');
    setCanAutoSend(false);
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setVoiceState((s) => nextVoiceState(s, 'speech-end'));
  }, []);

  const editTranscript = useCallback((text: string) => {
    setTranscript(text);
    const verdict = classifyTranscript({ text, confidence: 1 });
    setCanAutoSend(verdict.canAutoSend);
  }, []);

  /** Returns the committed text, or null when the transcript is not safe to send. */
  const commitTranscript = useCallback(() => {
    const verdict = classifyTranscript({ text: transcript, confidence: canAutoSend ? 1 : 0 });
    if (!verdict.canAutoSend) return null;
    sendText(transcript);
    setTranscript('');
    setCanAutoSend(false);
    setVoiceState('idle');
    return transcript;
  }, [transcript, canAutoSend, sendText]);

  const control = useCallback((c: Parameters<typeof applyControl>[1]) => {
    bump(applyControl(session, c));
  }, [session, bump]);

  const changeSpeed = useCallback((s: number) => {
    bump(setSpeed(session, s));
  }, [session, bump]);

  const onSpeechOutcome = useCallback((o: Parameters<typeof applySpeechOutcome>[1]) => {
    bump(applySpeechOutcome(session, o));
  }, [session, bump]);

  const requestLongReading = useCallback((scope: 'chapter' | 'book') => {
    const question = longReadingConsent(scope, session.language);
    bump({
      ...session,
      pendingConsent: { scope, label: question, offeredAt: new Date().toISOString() },
      revision: session.revision + 1,
    });
    return question;
  }, [session, bump]);

  const consumeOffer = useCallback((trigger: OfferTrigger) => {
    const decision = decideOffer(
      { trigger, offeredThisSession, hasVerseAvailable: !!pendingVerse, mode: session.mode },
      session.language,
    );
    if (decision.show) setOfferedThisSession(true);
    return decision.text;
  }, [offeredThisSession, pendingVerse, session.mode, session.language]);

  const reset = useCallback(() => {
    const fresh = { ...DEFAULT_SESSION, language: session.language };
    setSession(fresh);
    setTranscript('');
    setCanAutoSend(false);
    setPendingVerse(null);
    setLastResponse(null);
    setOfferedThisSession(false);
    setRevision(fresh.revision);
    setVoiceState(supported ? 'idle' : 'unsupported');
  }, [session.language, supported]);

  const clarification = useMemo(
    () =>
      buildClarificationChoices({
        emotion: session.emotionContext ?? null,
        hasPendingOffer: !!session.pendingConsent,
        hasPausedPassage: session.paused,
        mode: session.mode,
        language: session.language,
      }),
    [session.emotionContext, session.pendingConsent, session.paused, session.mode, session.language],
  );

  const quickActions = useMemo(() => visibleQuickActions(session), [session]);

  /** Autoplay decision for the pending verse, using the last user gesture. */
  const autoplay = useMemo(
    () =>
      decideAutoplay({
        scope: 'verse',
        userGesture: true,
        autoplayAllowed: true,
        mode: session.mode,
      }),
    [session.mode],
  );

  return {
    session,
    language: session.language,
    voiceState,
    transcript,
    canAutoSend,
    pendingVerse,
    lastResponse,
    clarification,
    quickActions,
    revision,
    selectEmotion,
    sendText,
    startListening,
    stopListening,
    cancelListening,
    onSpeechResult,
    editTranscript,
    commitTranscript,
    control,
    setSpeed: changeSpeed,
    onSpeechOutcome,
    requestLongReading,
    consumeOffer,
    reset,
    autoplay,
  };
}
