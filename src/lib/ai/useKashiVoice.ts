'use client';

/**
 * KASHI SAHAYAK VOICE (काशी सहायक वाणी)
 * ------------------------------------------------------------------
 * Lightweight client-side text-to-speech hook built on the Web Speech
 * API (window.speechSynthesis). Kashi Sahayak reads his replies aloud
 * with a preferred Hindi voice (hi-IN) when available, falling back to
 * any Hindi voice, then to the browser default.
 *
 * The enabled state persists in localStorage under 'kashi-voice-enabled'
 * and defaults to ON so the experience is audible out of the box.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'kashi-voice-enabled';

function pickHindiVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  // 1. Exact Hindi-India
  const exact = voices.find((v) => v.lang?.toLowerCase().replace('_', '-') === 'hi-in');
  if (exact) return exact;
  // 2. Any Hindi / Hinglish
  const anyHindi = voices.find((v) => v.lang?.toLowerCase().startsWith('hi'));
  if (anyHindi) return anyHindi;
  // 3. Indian English fallback
  const enIn = voices.find((v) => v.lang?.toLowerCase().replace('_', '-') === 'en-in');
  if (enIn) return enIn;
  return null;
}

export function useKashiVoice() {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const enabledRef = useRef(true);

  // Restore persisted preference (default: ON)
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
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      if (!enabledRef.current || !text) return;

      // Strip markdown-ish symbols & emoji so speech stays clean & warm
      const clean = text
        .replace(/[#*_`>|~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!clean) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      const voice = pickHindiVoice(voicesRef.current);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'hi-IN';
      }
      utterance.rate = 1.02;
      utterance.pitch = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      enabledRef.current = next;
      if (!next) {
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
  }, []);

  return { speak, stop, toggleVoice, voiceEnabled, isSpeaking };
}

export type KashiVoiceApi = ReturnType<typeof useKashiVoice>;
