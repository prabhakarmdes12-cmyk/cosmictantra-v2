'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Mic, Square, Play, Pause, Send, Trash2, Waves, Clock } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

export interface ChitigramVoiceRecorderProps {
  conversationId: string;
  senderId: string;
  senderRole: 'devotee' | 'pandit' | 'operator';
  senderName?: string;
  onSent?: (message: any) => void;
  className?: string;
}

export default function ChitigramVoiceRecorder({ conversationId, senderId, senderRole, senderName, onSent, className = '' }: ChitigramVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      chitiSensory.playTick();
    } catch (e: any) {
      setError(e?.message || 'Microphone permission denied');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      chitiSensory.playTick();
    }
  }, [isRecording]);

  const togglePreview = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;
    if (isPreviewing) {
      audioRef.current.pause();
      setIsPreviewing(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPreviewing(true);
      chitiSensory.playTick();
    }
  }, [isPreviewing, audioUrl]);

  const discard = useCallback(() => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setIsPreviewing(false);
    setError(null);
    chitiSensory.playTick();
  }, [audioUrl]);

  const send = useCallback(async () => {
    if (!audioBlob || !conversationId || !senderId) return;
    setSending(true);
    setError(null);
    try {
      // For pilot, we don't upload to S3 — we send metadata + use blob URL as placeholder.
      // In production, upload to object storage then send persisted URL.
      const waveform = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
      const res = await fetch('/api/chitigram/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderId,
          senderRole,
          senderName,
          durationSeconds: duration,
          mimeType: audioBlob.type || 'audio/webm;codecs=opus',
          sizeBytes: audioBlob.size,
          url: audioUrl, // placeholder — in prod would be persisted URL
          waveform,
        }),
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || 'Send failed');
      chitiSensory.playTick();
      onSent?.(data.message);
      discard();
    } catch (e: any) {
      setError(e?.message || 'Failed to send voice note');
    } finally {
      setSending(false);
    }
  }, [audioBlob, conversationId, senderId, senderRole, senderName, duration, audioUrl, onSent, discard]);

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  };

  return (
    <div className={`p-3 rounded-2xl bg-[#0D101C] border border-[#D4AF37]/20 flex flex-col gap-2 ${className}`} data-testid="chitigram-voice-recorder">
      <div className="flex items-center gap-2">
        <Waves className="w-4 h-4 text-[#D4AF37]" />
        <span className="text-xs font-bold text-white">Voice Note</span>
        <span className="text-[11px] text-white/50 ml-auto flex items-center gap-1">
          <Clock className="w-3 h-3" /> {format(duration)} / 5:00
        </span>
      </div>

      {!audioBlob ? (
        <div className="flex items-center gap-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isRecording ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' : 'bg-[#D4AF37] hover:bg-[#E1C15A] text-black'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4" /> Stop ({format(duration)})
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" /> Record
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
            <button onClick={togglePreview} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer">
              {isPreviewing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex-1 flex items-center gap-1">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="flex-1 h-6 bg-gradient-to-t from-[#D4AF37] to-amber-200 rounded-full opacity-80" style={{ height: `${30 + Math.random() * 70}%` }} />
              ))}
            </div>
            <span className="text-xs font-mono text-white/70">{format(duration)}</span>
            <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPreviewing(false)} className="hidden" />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={discard} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Discard
            </button>
            <button
              onClick={send}
              disabled={sending}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> {sending ? 'Sending...' : 'Send Voice Note'}
            </button>
          </div>
        </>
      )}

      {error && <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1">{error}</div>}

      <div className="text-[10px] text-white/30">Record → Preview → Send → Play • Chitigram VOICE • Persisted metadata</div>
    </div>
  );
}
