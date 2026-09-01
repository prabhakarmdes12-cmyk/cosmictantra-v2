'use client';

/**
 * KASHI SAHAYAK — composer: message input, microphone control, send,
 * mute/unmute and stop-speaking.
 *
 * Rules enforced here:
 *  - The microphone is optional; typing always remains available.
 *  - A doubtful transcript is never sent automatically — the user edits it
 *    first and presses send.
 *  - When speech recognition is unavailable the control says so plainly and
 *    never claims the assistant can hear.
 *  - Only the controls relevant to the current state are visible.
 */

import { useEffect, useRef } from 'react';
import { voiceStateMessage, type VoiceInputState } from '@/lib/kashi/interaction';

export interface KashiComposerProps {
  language: 'hi' | 'en';
  voiceState: VoiceInputState;
  transcript: string;
  canAutoSend: boolean;
  muted: boolean;
  speaking: boolean;
  value: string;
  interimText?: string;
  onValueChange: (v: string) => void;
  onSend: () => void;
  onMicPress: () => void;
  onCancelListening: () => void;
  onToggleMute: () => void;
  onStopSpeaking: () => void;
}

export function KashiComposer(props: KashiComposerProps) {
  const {
    language, voiceState, transcript, canAutoSend, muted, speaking, value, interimText,
    onValueChange, onSend, onMicPress, onCancelListening, onToggleMute, onStopSpeaking,
  } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listening = voiceState === 'listening' || voiceState === 'processing';
  const unavailable = voiceState === 'unsupported' || voiceState === 'unavailable';

  // Focus stays in the transcript box while dictating so the user can edit it.
  useEffect(() => {
    if (transcript && inputRef.current) inputRef.current.focus();
  }, [transcript]);

  return (
    <div className="space-y-2">
      {/* Listening indicator + interim text + immediate cancellation */}
      {voiceState === 'listening' && (
        <div
          data-testid="kashi-listening-indicator"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-xs font-bold"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" aria-hidden />
          <span>{language === 'hi' ? 'मैं सुन रही हूँ…' : 'Listening…'}</span>
          <button
            type="button"
            data-testid="kashi-cancel-listening"
            onClick={onCancelListening}
            className="ml-auto underline text-[11px]"
          >
            {language === 'hi' ? 'रोकें' : 'Cancel'}
          </button>
        </div>
      )}

      {(voiceState === 'uncertain' || voiceState === 'permission-denied' || voiceState === 'unsupported' || voiceState === 'network-error' || voiceState === 'unavailable') && (
        <div
          data-testid="kashi-voice-message"
          role="status"
          className="px-3 py-2 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-[11px] text-[#696256] dark:text-[#9E988D]"
        >
          {voiceStateMessage(voiceState, language)}
        </div>
      )}

      {interimText && voiceState === 'listening' && (
        <div data-testid="kashi-interim" className="px-1 text-[11px] italic opacity-70">
          {interimText}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          data-testid="kashi-input"
          aria-label={language === 'hi' ? 'संदेश लिखें' : 'Type your message'}
          value={transcript || value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={
            voiceState === 'unsupported'
              ? (language === 'hi' ? 'लिखकर बताएँ…' : 'Type your message…')
              : (language === 'hi' ? 'लिखें या बोलें…' : 'Type or speak…')
          }
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-sm outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37]"
        />

        <button
          type="button"
          data-testid="kashi-mic"
          data-voice-state={voiceState}
          aria-label={language === 'hi' ? 'बोलकर बताएँ' : 'Speak'}
          aria-pressed={listening}
          disabled={unavailable}
          onClick={onMicPress}
          title={unavailable ? voiceStateMessage(voiceState, language) : undefined}
          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
            listening
              ? 'bg-[#D4AF37] text-[#080A10] border-[#D4AF37]'
              : unavailable
                ? 'bg-white/50 dark:bg-[#121522]/50 border-black/10 dark:border-white/10 opacity-50 cursor-not-allowed'
                : 'bg-white dark:bg-[#121522] border-black/10 dark:border-white/10'
          }`}
        >
          🎙️
        </button>

        <button
          type="button"
          data-testid="kashi-mute"
          aria-label={language === 'hi' ? (muted ? 'आवाज़ चालू करें' : 'आवाज़ बंद करें') : muted ? 'Unmute' : 'Mute'}
          aria-pressed={muted}
          onClick={onToggleMute}
          className="w-10 h-10 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 flex items-center justify-center"
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {speaking && (
          <button
            type="button"
            data-testid="kashi-stop-speaking"
            aria-label={language === 'hi' ? 'पढ़ना रोकें' : 'Stop speaking'}
            onClick={onStopSpeaking}
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 flex items-center justify-center"
          >
            ⏹️
          </button>
        )}

        <button
          type="button"
          data-testid="kashi-send"
          aria-label={language === 'hi' ? 'भेजें' : 'Send'}
          onClick={onSend}
          disabled={!canAutoSend && !value.trim() && !transcript.trim()}
          className="w-10 h-10 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] flex items-center justify-center disabled:opacity-40"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
