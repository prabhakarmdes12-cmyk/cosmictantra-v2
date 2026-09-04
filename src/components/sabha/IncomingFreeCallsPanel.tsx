'use client';

/**
 * INCOMING FREE CALLS PANEL — Pandit-side ring surface (TEST B).
 *
 * Polls the server for free-call sessions routed to this scholar (both DIRECT
 * profile calls and CARE_ASSISTED dispatches) and lets the Pandit answer into
 * the private 1:1 WebRTC room. The Pandit only ever receives THEIR OWN
 * consultant token — customer tokens are never exposed on this surface.
 *
 * Phase-1 trust note: scholar identity is selected via the workspace console;
 * SSO-backed identity lands in Phase 2. No customer PII is shown — display
 * names only (Zero PII Invariant, CALL_SECURITY_MODEL.md §3.1).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneIncoming, PhoneCall, PhoneOff, Loader2, RefreshCw, Radio, Zap } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

interface IncomingCall {
  sessionId: string;
  initiationMode: 'CARE_ASSISTED' | 'DIRECT' | 'SCHEDULED';
  state: string;
  queueStatus: 'UNASSIGNED' | 'ASSIGNED' | 'DISPATCHED' | 'LIVE' | 'CLOSED';
  createdAt: number;
  customerDisplayName: string;
  customerCity?: string;
  question: string;
  category: string;
  language: string;
  mediaType: 'AUDIO' | 'VIDEO';
  consultantRoomUrl: string;
}

const timeAgo = (ts: number) => {
  const secs = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m`;
};

export default function IncomingFreeCallsPanel({ scholarId = 'ALL' }: { scholarId?: string }) {
  const router = useRouter();
  const [calls, setCalls] = useState<IncomingCall[]>([]);
  const [live, setLive] = useState<IncomingCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState<string | null>(null);
  const prevSessionIdsRef = React.useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/sabha/sessions?view=pandit&scholarId=${encodeURIComponent(scholarId || 'ALL')}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      if (data?.ok) {
        const incomingCalls: IncomingCall[] = data.incoming || [];
        setCalls(incomingCalls);
        const active = incomingCalls.find((c: IncomingCall) => c.state === 'ACTIVE' || c.state === 'CONNECTING');
        setLive(active || null);

        // Audible temple ringtone alert on newly discovered incoming call
        const currentIds = new Set(incomingCalls.map(c => c.sessionId));
        const hasNewCall = incomingCalls.some(c => !prevSessionIdsRef.current.has(c.sessionId));
        if (hasNewCall && incomingCalls.length > 0) {
          try {
            chitiSensory.playBell();
          } catch {
            /* ignore audio policy */
          }
        }
        prevSessionIdsRef.current = currentIds;
      }
    } catch {
      /* keep last snapshot */
    } finally {
      setLoading(false);
    }
  }, [scholarId]);

  useEffect(() => {
    void load();
    const poll = setInterval(() => void load(), 4000);
    return () => clearInterval(poll);
  }, [load]);

  const answer = (call: IncomingCall) => {
    chitiSensory.playTick();
    setJoined(call.sessionId);
    router.push(`${call.consultantRoomUrl}&autoAccept=1`);
  };

  const decline = (call: IncomingCall) => {
    chitiSensory.playTick();
    setCalls(prev => prev.filter(c => c.sessionId !== call.sessionId));
    // V1: declining leaves the room untouched (re-ringable until token expiry);
    // the audit trail records the leave event server-side on heartbeat timeout.
  };

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#090B12] border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
        <span className="font-bold text-sm flex items-center gap-2 text-[#8E6F1D] dark:text-[#F0C968]">
          <PhoneIncoming className="w-4 h-4" />
          इनकमिंग मुफ्त कॉल (Web Sabha)
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <Radio className="w-3 h-3 animate-pulse" /> LIVE
          </span>
          <button
            onClick={() => void load()}
            className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 cursor-pointer"
            title="रिफ्रेश"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {calls.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-[#857E74]">
          कोई इनकमिंग मुफ्त कॉल नहीं। नई कॉल डायरेक्टरी या केयर डिस्पैच से यहाँ दिखेंगी (४ सेकंड में अद्यतन)।
        </p>
      ) : (
        <div className="pt-3 space-y-3">
          {calls.map(call => {
            const isRinging = call.queueStatus === 'DISPATCHED' || call.initiationMode === 'DIRECT';
            return (
              <div
                key={call.sessionId}
                className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                  isRinging
                    ? 'bg-emerald-500/5 border-emerald-500/40 shadow-[0_0_24px_-8px_rgba(16,185,129,0.5)] animate-pulse'
                    : 'bg-[#FAF7F2] dark:bg-[#0E101D] border-black/10 dark:border-white/10'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isRinging ? (
                      <span className="relative flex w-2.5 h-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                      </span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    )}
                    <span className="font-bold text-xs text-[#1C1917] dark:text-white">
                      {isRinging ? '🔔 रिंग जारी —' : 'प्रतीक्षारत —'} {call.customerDisplayName}
                      {call.customerCity ? ` (${call.customerCity})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        call.initiationMode === 'DIRECT'
                          ? 'bg-violet-500/15 text-violet-700 dark:text-violet-400'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {call.initiationMode === 'DIRECT' ? 'DIRECT • प्रोफ़ाइल कॉल' : 'CARE-ASSISTED'}
                    </span>
                    <span className="text-[9px] text-[#857E74]">{timeAgo(call.createdAt)} पहले</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#57524A] dark:text-[#D1C9BF]">
                  <strong>{call.category}</strong> • {call.language} • {call.mediaType === 'VIDEO' ? '🎥 वीडियो' : '🎙️ वाणी'} — “{call.question}”
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => answer(call)}
                    disabled={joined === call.sessionId}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {joined === call.sessionId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
                    <span>{call.state === 'ACTIVE' ? 'कॉल में पुनः प्रवेश' : 'स्वीकार करें (Accept)'}</span>
                  </button>
                  <button
                    onClick={() => decline(call)}
                    className="px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#57524A] dark:text-[#D1C9BF] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>अस्वीकार</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {live && (
        <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" />
          लाइव सत्र चालू: {live.sessionId} — कॉल में पुनः प्रवेश हेतु Accept दबाएँ।
        </div>
      )}
    </div>
  );
}
