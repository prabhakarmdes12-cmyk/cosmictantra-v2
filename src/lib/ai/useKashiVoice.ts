'use client';

/**
 * KASHI SAHAYAK VOICE (काशी सहायक वाणी)
 * ------------------------------------------------------------------
 * Client-side text-to-speech hook built on the Web Speech API
 * (window.speechSynthesis), tuned for a warm, natural delivery worthy of
 * Kashi Sahayak's graceful apsara-form avatar — instead of a flat robotic
 * readout:
 *
 *  1. EMOJI / SYMBOL STRIPPING — the "folding hands" fix.
 *     The 🙏 emoji's Unicode name is literally "FOLDED HANDS", so some
 *     voices read it aloud as "folding hands". We now remove every emoji,
 *     pictograph, dingbat, arrow, geometric shape, ZWJ and variation
 *     selector from the spoken copy (they remain visible in chat).
 *
 *  2. NATURAL VOICE RANKING — instead of taking the first hi-IN voice
 *     (often an old, robotic device voice), we score every candidate:
 *     neural / natural / online / wavenet / premium voices win, then the
 *     well-known good Hindi voices (Google हिन्दी, Microsoft Madhur/Swara…).
 *     Language is auto-detected per message (Devanagari vs Latin) so English
 *     replies use a natural Indian-English voice instead of a Hindi one
 *     struggling through English.
 *
 *  3. SENTENCE-CHUNKED PROSODY — long paragraphs spoken as one utterance
 *     sound monotonic and get truncated by Chrome after ~15s. We split the
 *     text into sentences and queue them with subtle per-sentence rate/pitch
 *     shaping (questions rise, greetings flow slower, exclamations warm up).
 *     pauses between sentences make the delivery feel human.
 *
 *  4. CHROME KEEPALIVE — desktop Chrome silently pauses speechSynthesis on
 *     long texts; a periodic resume() keeps the stream alive.
 *
 * The enabled state persists in localStorage under 'kashi-voice-enabled'
 * and defaults to ON so the experience is audible out of the box.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'kashi-voice-enabled';

// ---------------------------------------------------------------------------
// 1. SPEECH COPY CLEANUP
// ---------------------------------------------------------------------------

/**
 * Every emoji/pictograph, dingbat, geometric shape, arrow, flag, keycap,
 * ZWJ and variation selector. Explicit \u{...} ranges (no \p{...} property
 * escapes) so this stays compatible with the ES2017 build target:
 *   ←–⇿  arrows                      ⌀–➿  tech + geometric + misc + dingbats
 *   ⬀–⯿  supplemental symbols       🀀–🫿 all emoji blocks
 *   ︎ ️ variation selectors    ‍ ZWJ            ⃣ keycap mark
 */
const EMOJI_AND_DECOR_RE =
  /[\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1FAFF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}]/gu;

/** Markdown-ish control characters that should never be pronounced. */
const MARKDOWN_RE = /[#*_`>|~]/g;

/** Bullets/middots read as "bullet" by several voices — turn into a pause. */
const BULLET_RE = /[•◦·◦]/g;

/** Devanagari block (U+0900–U+097F). */
const DEVANAGARI_RE = /[ऀ-ॿ]/g;

function detectSpokenLanguage(text: string): 'hi' | 'en' {
  const devanagari = (text.match(DEVANAGARI_RE) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return devanagari * 2 >= latin ? 'hi' : 'en';
}

/**
 * Prepare a chat message for speech: strip emoji & decorations (fixes the
 * "folding hands" readout of 🙏), expand symbols into Hindi words, and tidy
 * whitespace while preserving sentence boundaries for the chunker.
 */
export function cleanForSpeech(raw: string): string {
  if (!raw) return '';
  let t = String(raw);
  t = t.replace(EMOJI_AND_DECOR_RE, ' ');
  t = t.replace(MARKDOWN_RE, ' ');
  t = t.replace(BULLET_RE, ',');
  t = t.replace(/₹\s*/g, 'रुपये '); // guaranteed correct pronunciation
  t = t.replace(/%\s*/g, ' प्रतिशत ');
  t = t.replace(/[\t\f\v ]+/g, ' ');
  t = t.replace(/ *\n+ */g, '\n');
  // Remove double punctuation spaces like "  ." created by emoji removal
  t = t.replace(/ +([,.!?।])/g, '$1');
  return t.trim();
}

// ---------------------------------------------------------------------------
// 2. SENTENCE CHUNKING (natural pauses + Chrome truncation workaround)
// ---------------------------------------------------------------------------

/** Hard upper bound per utterance — also keeps Chrome from choking. */
const MAX_CHUNK_LENGTH = 260;
/** Short fragments get merged forward into flowing sentences. */
const MIN_CHUNK_LENGTH = 45;

function splitOnSentenceBoundaries(text: string): string[] {
  const parts = text.split(/([.!?।\n]+)/);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const sentence = (parts[i] || '').trim();
    if (!sentence) continue;
    const delim = (parts[i + 1] || '').replace(/\n/g, '').trim();
    // Default terminal punctuation follows the sentence's own script —
    // Hindi gets the danda, English gets a full stop.
    const ending = delim
      ? delim.charAt(0)
      : detectSpokenLanguage(sentence) === 'hi'
        ? '।'
        : '.';
    out.push(sentence + (ending === '।' ? '।' : ending));
  }
  return out;
}

function splitLongChunk(chunk: string): string[] {
  if (chunk.length <= MAX_CHUNK_LENGTH) return [chunk];
  const clauses = chunk.split(/([,;—:]\s*)/);
  const out: string[] = [];
  let current = '';
  for (let i = 0; i < clauses.length; i += 1) {
    current += clauses[i];
    if (current.length >= MAX_CHUNK_LENGTH * 0.6 || i === clauses.length - 1) {
      while (current.trim().length > MAX_CHUNK_LENGTH) {
        current = current.trim();
        const space = current.lastIndexOf(' ', MAX_CHUNK_LENGTH);
        const cut = space > 0 ? space : MAX_CHUNK_LENGTH;
        out.push(current.slice(0, cut));
        current = current.slice(cut).trim();
      }
      if (current.trim()) out.push(current.trim());
      current = '';
    }
  }
  return out;
}

export function chunkTextForSpeech(text: string): string[] {
  const rawChunks: string[] = [];
  for (const sentence of splitOnSentenceBoundaries(text)) {
    rawChunks.push(...splitLongChunk(sentence));
  }
  // Merge fragments that are too short into the next sentence so the voice
  // does not sound staccato ("उत्तम। …अब कृपया…" becomes one breath).
  const merged: string[] = [];
  for (const chunk of rawChunks) {
    const last = merged[merged.length - 1];
    if (
      last &&
      (last.length < MIN_CHUNK_LENGTH || chunk.length < MIN_CHUNK_LENGTH * 0.5) &&
      last.length + chunk.length + 1 <= MAX_CHUNK_LENGTH
    ) {
      merged[merged.length - 1] = `${last} ${chunk}`;
    } else {
      merged.push(chunk);
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// 3. NATURAL VOICE RANKING
// ---------------------------------------------------------------------------

function normalizeLang(lang?: string): string {
  return (lang || '').toLowerCase().replace(/_/g, '-');
}

/**
 * Known-good warm Hindi voices across platforms. "natural" voices on Edge /
 * Android and Google's Hindi voice are dramatically more human than the
 * legacy OS voices (e.g. eSpeak, old SAPI voices).
 *
 * The Kashi Sahayak avatar is a graceful apsara-form lady, so among equally
 * natural candidates we gently prefer FEMALE voices (Swara, Heera, Kalpana,
 * Lekha, Google हिन्दी) and lightly demote known male ones (Madhur, Hemant).
 */
const NATURAL_NAME_RULES: Array<{ re: RegExp; bonus: number }> = [
  { re: /natural/i, bonus: 14 },   // Microsoft "… Online (Natural)" neural voices
  { re: /neural/i, bonus: 10 },
  { re: /online/i, bonus: 6 },     // Edge network voices (almost always neural)
  { re: /wavenet|premium|enhanced/i, bonus: 8 },
  { re: /google/i, bonus: 5 },     // "Google हिन्दी" on Chrome/Android (female)
  { re: /swara|heera|kalpana|lekha|aden|meera|neerja|aditi|raveena/i, bonus: 10 }, // warm female voices
  { re: /female/i, bonus: 8 },     // engines that expose gender in the name
  { re: /madhur|hemant|prabhat|arjun/i, bonus: -8 }, // male voices — persona is a lady
];

function scoreVoice(voice: SpeechSynthesisVoice, want: 'hi' | 'en'): number {
  const lang = normalizeLang(voice.lang);
  let score = -1;

  if (want === 'hi') {
    if (lang === 'hi-in') score = 50;
    else if (lang.startsWith('hi')) score = 40;
    else if (lang === 'en-in') score = 8;
    else return -1;
  } else {
    if (lang === 'en-in') score = 50;
    else if (lang === 'en-gb' || lang === 'en-us') score = 26;
    else if (lang.startsWith('en')) score = 20;
    else if (lang.startsWith('hi')) score = 6;
    else return -1;
  }

  const name = voice.name || '';
  for (const rule of NATURAL_NAME_RULES) {
    if (rule.re.test(name)) score += rule.bonus;
  }
  // Network-backed voices (localService === false) are usually the modern
  // neural ones on Edge/ChromeOS/Android.
  if (voice.localService === false) score += 3;
  return score;
}

function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  text: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  const want = detectSpokenLanguage(text);
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;
  for (const voice of voices) {
    const score = scoreVoice(voice, want);
    if (score > bestScore) {
      bestScore = score;
      best = voice;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// 4. PER-SENTENCE PROSODY SHAPING
// ---------------------------------------------------------------------------

function prosodyFor(chunk: string): { rate: number; pitch: number } {
  const t = chunk.trim();
  let rate = 0.98; // measured, calm default — slightly slower feels warmer in Hindi
  let pitch = 1.0;

  // Sacred greetings flow a touch slower and a shade brighter
  if (/^(नमस्ते|नमस्कार|प्रणाम|हर हर महादेव|जय |सुप्रभात|शुभ |हरे राम)/.test(t)) {
    rate = 0.94;
    pitch = 1.03;
  }
  // Questions naturally rise
  if (/[?]$/.test(t)) {
    rate = 1.0;
    pitch = Math.min(1.08, pitch + 0.05);
  }
  // Celebration / reassurance warms up
  if (/बहुत सुंदर|बधाई|शुभकामना|धन्यवाद|आशीर्वाद|हर्ष/.test(t)) {
    pitch = Math.min(1.06, pitch + 0.02);
  }
  // Gentle descent for closings
  if (/धन्यवाद।$|अवश्य।$/.test(t) && t.length > MIN_CHUNK_LENGTH) {
    rate = Math.max(0.92, rate - 0.03);
  }
  return { rate, pitch };
}

// ---------------------------------------------------------------------------
// THE HOOK
// ---------------------------------------------------------------------------

export function useKashiVoice() {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const enabledRef = useRef(true);
  /** Monotonic session id — invalidates pending chunks after stop(). */
  const sessionRef = useRef(0);
  const keepAliveRef = useRef<number | null>(null);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current !== null && typeof window !== 'undefined') {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const startKeepAlive = useCallback(() => {
    if (typeof window === 'undefined' || keepAliveRef.current !== null) return;
    // Desktop Chrome silently stalls speechSynthesis on long queues; a gentle
    // periodic resume() keeps it flowing (a no-op in healthy engines).
    keepAliveRef.current = window.setInterval(() => {
      try {
        if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }, 8000);
  }, []);

  // Restore persisted preference (default: ON) and warm the voice list.
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const val = stored === '1';
        setVoiceEnabled(val);
        enabledRef.current = val;
      }
    } catch {
      // ignore storage errors
    }

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
      sessionRef.current += 1;
      clearKeepAlive();
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };
  }, [clearKeepAlive]);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    sessionRef.current += 1;
    clearKeepAlive();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [clearKeepAlive]);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!enabledRef.current || !text) return;

      const clean = cleanForSpeech(text);
      if (!clean) return;

      const chunks = chunkTextForSpeech(clean);
      if (chunks.length === 0) return;

      // Interrupt anything currently speaking and open a fresh session.
      window.speechSynthesis.cancel();
      sessionRef.current += 1;
      const session = sessionRef.current;

      const speakChunk = (index: number) => {
        if (session !== sessionRef.current) return; // stale queue, abandoned
        if (index >= chunks.length) {
          clearKeepAlive();
          setIsSpeaking(false);
          return;
        }

        const chunk = chunks[index];
        const utterance = new SpeechSynthesisUtterance(chunk);
        const voice = pickBestVoice(voicesRef.current, clean);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = detectSpokenLanguage(clean) === 'hi' ? 'hi-IN' : 'en-IN';
        }

        const { rate, pitch } = prosodyFor(chunk);
        utterance.rate = rate;
        utterance.pitch = pitch;
        // A hair of extra presence on supported engines
        utterance.volume = 1;

        if (index === 0) {
          utterance.onstart = () => {
            if (session === sessionRef.current) setIsSpeaking(true);
          };
        }
        const advance = () => {
          if (session !== sessionRef.current) return;
          // ~140 ms breath between sentences — the biggest naturalness win
          window.setTimeout(() => speakChunk(index + 1), 140);
        };
        utterance.onend = advance;
        utterance.onerror = advance;

        window.speechSynthesis.speak(utterance);
      };

      startKeepAlive();
      speakChunk(0);
    },
    [clearKeepAlive, startKeepAlive]
  );

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      enabledRef.current = next;
      if (!next) {
        sessionRef.current += 1;
        clearKeepAlive();
        try {
          window.speechSynthesis?.cancel();
        } catch {
          // ignore
        }
        setIsSpeaking(false);
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, [clearKeepAlive]);

  // The Kashi Sahayak avatar uses the registered feminine voice identity (voice-00, hi-IN, feminine)
  // for all spoken replies. This connects the AI gateway response directly to the demonstrated female voice.
  const REGISTERED_KASHI_VOICE_ID = 'voice-00';
  const REGISTERED_KASHI_VOICE_GENDER = 'feminine';
  const REGISTERED_KASHI_VOICE_LANG = 'hi-IN';

  return { speak, stop, toggleVoice, voiceEnabled, isSpeaking, registeredVoiceId: REGISTERED_KASHI_VOICE_ID, registeredVoiceGender: REGISTERED_KASHI_VOICE_GENDER, registeredVoiceLang: REGISTERED_KASHI_VOICE_LANG };
}

export type KashiVoiceApi = ReturnType<typeof useKashiVoice> & {
  registeredVoiceId: string;
  registeredVoiceGender: string;
  registeredVoiceLang: string;
};
