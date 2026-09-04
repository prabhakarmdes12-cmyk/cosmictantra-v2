'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  Send,
  Sparkles,
  CreditCard,
  PhoneCall,
  CheckCheck,
  Check,
  MoreVertical,
  X,
  Mic,
  EyeOff,
  ShieldAlert,
  Loader2,
  ChevronDown,
  Waves,
} from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';
import {
  KundliInsightCard,
  DakshinaPaymentCard,
  CallEventCard,
} from './ChitigramCards';
import ChitigramVoiceRecorder from './ChitigramVoiceRecorder';

// Local types — mirrors API store, extended for v0.2 protocol
export type ChitigramCardType = 'KUNDLI_INSIGHT' | 'DAKSHINA_PAYMENT' | 'CALL_EVENT';
export type ChitigramMessageStatus = 'SENT' | 'DELIVERED' | 'READ';
export type ChitigramVisibility = 'VISIBLE' | 'INTERNAL';
export interface ChitigramMessage {
  id: string;
  messageId?: string;
  conversationId: string;
  senderRole: 'devotee' | 'pandit' | 'operator' | 'system';
  senderName?: string;
  senderId?: string | null;
  text?: string | null;
  cardType?: ChitigramCardType | string | null;
  cardPayload?: Record<string, any> | null;
  payload?: Record<string, any> | null;
  type?: string | null; // TEXT/SYSTEM/CONTEXT/ACTION/PAYMENT/CALL/VOICE/FILE
  subType?: string | null;
  visibility?: ChitigramVisibility;
  timestamp: number;
  createdAt?: number;
  status: ChitigramMessageStatus;
  sequence?: number;
  clientMessageId?: string | null;
  sessionId?: string;
}

// ---------------------------------------------------------------------------
// Props — v0.1 frozen + v0.2 extensions (all new props optional for backward compat)
// ---------------------------------------------------------------------------

export interface ChitigramChatDrawerProps {
  conversationId: string;
  role: 'devotee' | 'pandit' | 'operator';
  consultantName?: string;
  seekerName?: string;
  prashna?: string;
  onTriggerCall?: () => void;
  className?: string;
  variant?: 'embedded' | 'drawer';
  onClose?: () => void;
  // v0.2 extensions — optional, never break v0.1
  organizationId?: string;
  domain?: string;
  viewerId?: string; // for read receipts & presence
  enableInternalNotes?: boolean; // default auto based on role
  enableVoice?: boolean; // default true
  enablePresence?: boolean; // default true
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function statusTicks(status?: string): React.ReactNode {
  if (status === 'READ')
    return (
      <span className="inline-flex items-center gap-0.5 text-sky-400">
        <CheckCheck className="w-3 h-3" />
        <span className="text-[9px]">Read</span>
      </span>
    );
  if (status === 'DELIVERED')
    return (
      <span className="inline-flex items-center gap-0.5 text-white/60">
        <CheckCheck className="w-3 h-3" />
        <span className="text-[9px]">Delivered</span>
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-white/40">
      <Check className="w-3 h-3" />
      <span className="text-[9px]">Sent</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component — v0.2 operational, v0.1 backward compatible
// ---------------------------------------------------------------------------

export default function ChitigramChatDrawer({
  conversationId,
  role,
  consultantName,
  seekerName,
  prashna,
  onTriggerCall,
  className = '',
  variant = 'embedded',
  onClose,
  organizationId = 'cosmic-tantra',
  domain = 'cosmic-tantra',
  viewerId,
  enableInternalNotes,
  enableVoice = true,
  enablePresence = true,
}: ChitigramChatDrawerProps) {
  const [messages, setMessages] = useState<ChitigramMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showCardActions, setShowCardActions] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [isInternalMode, setIsInternalMode] = useState(false);
  const [presence, setPresence] = useState<any | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const peerName = role === 'devotee' ? consultantName || 'पंडित जी' : role === 'operator' ? seekerName || 'श्रद्धालु भक्त' : seekerName || 'श्रद्धालु भक्त';
  const selfName = role === 'devotee' ? seekerName || 'आप' : role === 'operator' ? 'Help Desk' : consultantName || 'आप (पंडित जी)';
  const effectiveViewerId = viewerId || (role === 'devotee' ? `devotee-${conversationId.slice(0, 6)}` : role === 'pandit' ? `pandit-${conversationId.slice(0, 6)}` : `operator-${conversationId.slice(0, 6)}`);

  // Determine if internal notes are allowed — operators and pandits can send INTERNAL, devotees cannot
  const canSendInternal = role === 'operator' || role === 'pandit';
  const showInternalToggle = enableInternalNotes ?? canSendInternal;
  const showVoiceToggle = enableVoice;

  // -----------------------------------------------------------------------
  // Presence — server-backed only, never show Online unless backed
  // -----------------------------------------------------------------------
  const fetchPresence = useCallback(async () => {
    if (!enablePresence || !conversationId) return;
    try {
      // Fetch assigned practitioner or peer presence — for drawer header we show peer's real presence
      const peerId = role === 'devotee' ? consultantName || '' : seekerName || '';
      // Actually fetch by conversation's assignedPractitioner or by viewer? For pilot, fetch viewer presence self
      // For presence display, we try to get any presence for the peer; if not found, we don't show Online
      const res = await fetch(`/api/chitigram/presence?userId=${encodeURIComponent(peerId)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok && data.presence) setPresence(data.presence);
      else setPresence(null);
    } catch {
      setPresence(null);
    }
  }, [enablePresence, conversationId, consultantName, seekerName, role]);

  useEffect(() => {
    void fetchPresence();
    const iv = setInterval(() => void fetchPresence(), 8000);
    return () => clearInterval(iv);
  }, [fetchPresence]);

  // -----------------------------------------------------------------------
  // Fetch messages — pagination + visibility + idempotent + polling
  // -----------------------------------------------------------------------
  const fetchMessages = useCallback(async (opts?: { append?: boolean; limit?: number; off?: number }) => {
    if (!conversationId) return;
    const lim = opts?.limit || 50;
    const off = opts?.off ?? offset;
    try {
      const params = new URLSearchParams({
        conversationId,
        limit: String(lim),
        offset: String(off),
        viewerRole: role,
      });
      if (effectiveViewerId) params.set('viewerId', effectiveViewerId);
      // Include internal only if viewer can see it
      if (canSendInternal) params.set('includeInternal', 'true');
      if (organizationId) params.set('organizationId', organizationId);
      if (domain) params.set('domain', domain);

      const res = await fetch(`/api/chitigram/messages?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.messages)) {
        const fetched = data.messages as ChitigramMessage[];
        if (opts?.append) {
          setMessages(prev => {
            const merged = [...prev, ...fetched];
            // dedupe by id and sort by sequence/timestamp
            const map = new Map<string, ChitigramMessage>();
            merged.forEach(m => map.set(m.id, m));
            const deduped = Array.from(map.values()).sort((a, b) => (a.sequence || a.timestamp) - (b.sequence || b.timestamp));
            return deduped;
          });
        } else {
          // For initial load, if offset===0, replace; otherwise append
          if (off === 0) setMessages(fetched);
          else {
            setMessages(prev => {
              const map = new Map<string, ChitigramMessage>();
              [...prev, ...fetched].forEach(m => map.set(m.id, m));
              return Array.from(map.values()).sort((a, b) => (a.sequence || a.timestamp) - (b.sequence || b.timestamp));
            });
          }
        }
        if (typeof data.total === 'number') setTotal(data.total);
        if (typeof data.hasMore === 'boolean') setHasMore(data.hasMore);
        else setHasMore(fetched.length === lim);
      }
    } catch {
      // best-effort
    }
  }, [conversationId, offset, role, effectiveViewerId, canSendInternal, organizationId, domain]);

  useEffect(() => {
    setOffset(0);
    void fetchMessages({ limit: 50, off: 0 });
    pollRef.current = setInterval(() => void fetchMessages({ limit: 50, off: 0 }), 2500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Pagination: load more
  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextOffset = offset + 50;
    setOffset(nextOffset);
    await fetchMessages({ limit: 50, off: nextOffset, append: true });
    setLoadingMore(false);
  };

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Read receipts — mark last message as read when drawer visible and messages change
  useEffect(() => {
    if (!conversationId || messages.length === 0 || !effectiveViewerId) return;
    const last = messages[messages.length - 1];
    if (!last) return;
    // Only mark if last message is not from self
    if (last.senderRole === role) return;
    const timer = setTimeout(async () => {
      try {
        await fetch('/api/chitigram/messages/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            userId: effectiveViewerId,
            lastReadMessageId: last.id,
            viewerRole: role,
          }),
        });
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, [messages, conversationId, effectiveViewerId, role]);

  // -----------------------------------------------------------------------
  // Send helpers — idempotent clientMessageId, server timestamp, visibility
  // -----------------------------------------------------------------------
  const postMessage = useCallback(
    async (payload: { text?: string; cardType?: ChitigramCardType; cardPayload?: Record<string, any>; type?: string; subType?: string; payloadObj?: Record<string, any>; visibility?: ChitigramVisibility }) => {
      if (!conversationId) return;
      setSending(true);
      const clientMessageId = `cli-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      try {
        const body: any = {
          conversationId,
          sessionId: conversationId,
          senderRole: role,
          senderName: selfName,
          senderId: effectiveViewerId,
          text: payload.text,
          cardType: payload.cardType,
          cardPayload: payload.cardPayload,
          type: payload.type,
          subType: payload.subType,
          payload: payload.payloadObj,
          visibility: payload.visibility || (isInternalMode ? 'INTERNAL' : 'VISIBLE'),
          clientMessageId,
          organizationId,
          domain,
        };
        const res = await fetch('/api/chitigram/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data?.ok && data.message) {
          if (!data.isDuplicate) {
            setMessages(prev => [...prev, data.message as ChitigramMessage]);
          }
          chitiSensory.playTick();
        } else if (data?.error === 'DEGRADED_PERSISTENCE') {
          // Production degraded — show error, never ack unpersisted
          console.error('Degraded persistence', data);
        } else {
          await fetchMessages({ limit: 50, off: 0 });
        }
      } catch {
        await fetchMessages({ limit: 50, off: 0 });
      } finally {
        setSending(false);
        setInputText('');
        setShowCardActions(false);
      }
    },
    [conversationId, role, selfName, effectiveViewerId, isInternalMode, organizationId, domain, fetchMessages]
  );

  const handleSendText = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    // If internal mode, send as INTERNAL visible team-only
    await postMessage({ text: trimmed, visibility: isInternalMode ? 'INTERNAL' : 'VISIBLE' });
  };

  const handleSendCard = async (type: ChitigramCardType) => {
    if (type === 'KUNDLI_INSIGHT') {
      await postMessage({
        cardType: 'KUNDLI_INSIGHT',
        cardPayload: {
          chartId: `CT-KUNDLI-${conversationId.slice(-5).toUpperCase() || '78219'}`,
          nativeName: seekerName || 'अनुराग बाजपेयी',
          ascendant: 'Sagittarius (धनु)',
          moonSign: 'Pisces (मीन)',
          nakshatra: 'Revati-2',
          activeDasha: 'Guru-Surya (गुरु-सूर्य)',
          verbatimQuestion: prashna || 'व्यापार में नया निवेश और आगामी गोचर',
          viewActionUrl: `/kundli?id=CT-KUNDLI-${conversationId.slice(-6) || '78219'}`,
        },
        type: 'CONTEXT',
        subType: 'ASTROLOGY.KUNDLI_INSIGHT',
      });
    } else if (type === 'DAKSHINA_PAYMENT') {
      await postMessage({
        cardType: 'DAKSHINA_PAYMENT',
        cardPayload: {
          consultationId: conversationId || `CT-SABHA-${Date.now().toString().slice(-6)}`,
          amountInr: 501,
          currency: 'INR',
          beneficiaryScholar: consultantName || 'पं. रामकृष्ण त्रिपाठी',
          entitledMinutes: 15,
          paymentStatus: 'PENDING',
          upiIntentUrl: `upi://pay?pa=chititech@bank&pn=${encodeURIComponent(consultantName || 'CosmicTantra')}&am=501&cu=INR&tn=${encodeURIComponent(conversationId)}`,
        },
        type: 'PAYMENT',
        subType: 'ASTROLOGY.DAKSHINA',
      });
    } else if (type === 'CALL_EVENT') {
      await postMessage({
        cardType: 'CALL_EVENT',
        cardPayload: {
          durationSeconds: 892,
          durationLabel: '14:52',
          startedAt: Date.now() - 892000,
          endedAt: Date.now(),
        },
        type: 'CALL',
        subType: 'CALL_EVENT',
      });
    }
  };

  // -----------------------------------------------------------------------
  // Render message bubble — handles legacy cardType + new protocol types
  // -----------------------------------------------------------------------
  const renderMessage = (m: ChitigramMessage) => {
    const isSelf = m.senderRole === role;
    const isInternal = m.visibility === 'INTERNAL';
    const bubbleBase = isInternal
      ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30 rounded-br-sm'
      : isSelf
        ? 'bg-[#D4AF37] text-black rounded-br-sm'
        : 'bg-white/10 text-white border border-white/10 rounded-bl-sm';

    // Voice note rendering
    const isVoice = m.type === 'VOICE' || m.subType === 'VOICE' || (m.payload && (m.payload as any).durationSeconds && (m.payload as any).mimeType);
    if (isVoice) {
      const meta = (m.payload || m.cardPayload || {}) as any;
      const dur = meta.durationSeconds || 0;
      const mins = Math.floor(dur / 60);
      const secs = dur % 60;
      return (
        <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[92%]`}>
          <div className={`w-full p-3 rounded-2xl flex items-center gap-3 ${bubbleBase} ${isInternal ? 'ring-1 ring-amber-500/30' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isInternal ? 'bg-amber-500/30 text-amber-200' : isSelf ? 'bg-black/10 text-black' : 'bg-white/10 text-white'}`}>
              <Waves className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold flex items-center gap-1">
                {isInternal && <><EyeOff className="w-3 h-3" /> INTERNAL —</>} Voice Note • {mins}:{String(secs).padStart(2, '0')}
              </div>
              {meta.url && (
                <audio controls src={meta.url} className="w-full mt-1 h-8" />
              )}
              {!meta.url && <div className="text-[11px] opacity-60">Audio: {meta.mimeType || 'audio/webm'} • {meta.sizeBytes || 0} bytes</div>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
            {isSelf && statusTicks(m.status)}
            {isInternal && <span className="text-[9px] text-amber-300 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> INTERNAL</span>}
          </div>
        </div>
      );
    }

    // Internal note styling — distinct from VISIBLE TO SEEKER
    if (isInternal) {
      return (
        <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[92%]`}>
          <div className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">INTERNAL — CHITI TEAM ONLY</span>
            </div>
            <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${bubbleBase}`}>
              <div className="font-bold text-[9px] opacity-60 mb-0.5">{isSelf ? 'आप (Internal)' : m.senderName || peerName} • team-only</div>
              <p className="whitespace-pre-wrap break-words">{m.text || `[${m.type} ${m.subType || ''}]`}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
            {isSelf && statusTicks(m.status)}
          </div>
        </div>
      );
    }

    // Card rendering — legacy + new protocol
    const effectiveCardType = m.cardType || (m.subType === 'ASTROLOGY.KUNDLI_INSIGHT' ? 'KUNDLI_INSIGHT' : m.subType === 'ASTROLOGY.DAKSHINA' ? 'DAKSHINA_PAYMENT' : m.subType === 'CALL_EVENT' ? 'CALL_EVENT' : null);
    const effectivePayload = m.cardPayload || m.payload;

    if (effectiveCardType === 'KUNDLI_INSIGHT' && effectivePayload) {
      return (
        <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[92%]`}>
          <div className="w-full">
            <KundliInsightCard {...(effectivePayload as any)} />
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
            {isSelf && statusTicks(m.status)}
            {m.sequence && <span className="text-[9px] text-white/20">#{m.sequence}</span>}
          </div>
        </div>
      );
    }
    if (effectiveCardType === 'DAKSHINA_PAYMENT' && effectivePayload) {
      return (
        <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[92%]`}>
          <div className="w-full">
            <DakshinaPaymentCard {...(effectivePayload as any)} onVerify={() => handleSendCard('DAKSHINA_PAYMENT')} />
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
            {isSelf && statusTicks(m.status)}
          </div>
        </div>
      );
    }
    if (effectiveCardType === 'CALL_EVENT' && effectivePayload) {
      return (
        <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[92%]`}>
          <div className="w-full">
            <CallEventCard {...(effectivePayload as any)} onCallAgain={onTriggerCall} />
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
            {isSelf && statusTicks(m.status)}
          </div>
        </div>
      );
    }

    // File handling (pilot: simple link)
    if (m.type === 'FILE' && m.payload) {
      const meta: any = m.payload;
      return (
        <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[85%]`}>
          <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${bubbleBase}`}>
            <div className="font-bold text-[9px] opacity-60 mb-0.5">{isSelf ? 'आप' : m.senderName || peerName}</div>
            <div>📎 {meta.fileName || 'File'} • {meta.sizeBytes || 0} bytes</div>
            {meta.url && <a href={meta.url} target="_blank" rel="noopener noreferrer" className="underline text-sky-400 text-[11px]">Download</a>}
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
            {isSelf && statusTicks(m.status)}
          </div>
        </div>
      );
    }

    // Plain text — plus generic CONTEXT/ACTION/SYSTEM
    const isSystem = m.type === 'SYSTEM';
    return (
      <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[85%]`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${isSystem ? 'bg-white/5 border border-white/10 text-white/60 italic' : bubbleBase}`}>
          <div className="font-bold text-[9px] opacity-60 mb-0.5">
            {isSystem ? 'System' : isSelf ? 'आप' : m.senderName || peerName} {m.subType && m.type !== 'TEXT' ? `• ${m.subType}` : ''}
          </div>
          <p className="whitespace-pre-wrap break-words">{m.text || (m.payload ? JSON.stringify(m.payload).slice(0, 200) : '')}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
          {isSelf && statusTicks(m.status)}
          {m.sequence && <span className="text-[9px] text-white/20">#{m.sequence}</span>}
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // Outer container
  // -----------------------------------------------------------------------
  const containerClasses =
    variant === 'drawer'
      ? 'flex flex-col h-full bg-[#0D101C] border border-[#D4AF37]/20 rounded-2xl shadow-2xl overflow-hidden'
      : 'flex flex-col h-full bg-[#0D101C] border border-[#D4AF37]/20 rounded-2xl shadow-xl overflow-hidden';

  // Presence display — never show Online unless backed by server
  const showPresenceOnline = presence && presence.connectionState === 'ONLINE';
  const presenceLabel = showPresenceOnline ? `${presence.connectionState} • ${presence.availability || 'AVAILABLE'}` : 'Offline • Check presence';
  const presenceColor = showPresenceOnline ? (presence.availability === 'AVAILABLE' ? 'bg-emerald-400' : presence.availability === 'BUSY' ? 'bg-amber-400' : 'bg-white/40') : 'bg-white/20';

  return (
    <div className={`${containerClasses} ${className}`} data-testid="chitigram-chat-drawer">
      {/* Header — real presence */}
      <div className="shrink-0 px-3.5 py-3 bg-gradient-to-r from-[#0D101C] via-[#12152A] to-[#0D101C] border-b border-[#D4AF37]/20 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8E6F1D] flex items-center justify-center text-black font-bold text-sm shadow-md shrink-0">
            {role === 'pandit' ? '🕉️' : role === 'operator' ? '◉' : 'ॐ'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              {peerName}
              <span className={`w-2 h-2 rounded-full ${presenceColor} ${showPresenceOnline ? 'animate-pulse shadow-sm' : ''}`} />
            </div>
            <div className={`text-[10px] font-medium flex items-center gap-1 ${showPresenceOnline ? 'text-emerald-300' : 'text-white/40'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${presenceColor}`} />
              {enablePresence ? presenceLabel : 'Chitigram • Encrypted'} • {isInternalMode ? 'INTERNAL' : 'VISIBLE'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              chitiSensory.playTick();
              onTriggerCall?.();
            }}
            className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
            title="Chiti-Connect कॉल प्रारंभ करें (Start Call)"
            aria-label="Trigger Chiti-Connect call"
            data-testid="chitigram-call-trigger"
          >
            <Phone className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={() => {
                chitiSensory.playTick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {!onClose && (
            <button
              onClick={() => setShowCardActions(v => !v)}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Internal toggle + Card quick actions */}
      {(showInternalToggle || showCardActions) && (
        <div className="px-3 py-2 bg-black/20 border-b border-white/5 flex items-center gap-2 overflow-x-auto flex-wrap">
          {showInternalToggle && (
            <button
              onClick={() => {
                chitiSensory.playTick();
                setIsInternalMode(v => !v);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border whitespace-nowrap cursor-pointer ${
                isInternalMode ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
              title={isInternalMode ? 'Sending as INTERNAL — CHITI TEAM ONLY (server-enforced)' : 'Sending as VISIBLE TO SEEKER'}
            >
              {isInternalMode ? <EyeOff className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {isInternalMode ? 'INTERNAL — TEAM ONLY' : 'VISIBLE TO SEEKER'}
            </button>
          )}

          <button
            onClick={() => handleSendCard('KUNDLI_INSIGHT')}
            className="px-3 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F0C968] text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#D4AF37]/25 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" /> Kundli Card
          </button>
          <button
            onClick={() => handleSendCard('DAKSHINA_PAYMENT')}
            className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <CreditCard className="w-3.5 h-3.5" /> Dakshina ₹501
          </button>
          <button
            onClick={() => handleSendCard('CALL_EVENT')}
            className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] font-bold flex items-center gap-1.5 hover:bg-sky-500/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call Record
          </button>
          {showVoiceToggle && (
            <button
              onClick={() => {
                chitiSensory.playTick();
                setShowVoice(v => !v);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border whitespace-nowrap cursor-pointer ${showVoice ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'}`}
            >
              <Mic className="w-3.5 h-3.5" /> Voice
            </button>
          )}
        </div>
      )}

      {/* Voice recorder */}
      {showVoice && (
        <div className="px-3 py-2 bg-black/10 border-b border-white/5">
          <ChitigramVoiceRecorder
            conversationId={conversationId}
            senderId={effectiveViewerId}
            senderRole={role === 'operator' ? 'operator' : role}
            senderName={selfName}
            onSent={msg => {
              setMessages(prev => [...prev, msg as any]);
              setShowVoice(false);
            }}
          />
        </div>
      )}

      {/* Messages — pagination + rendered */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-transparent via-transparent to-black/10">
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Load more ({total - messages.length} remaining)
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#8E6F1D]/20 border border-[#D4AF37]/20 flex items-center justify-center text-2xl">💬</div>
            <div>
              <div className="text-xs font-bold text-white">Chitigram — Actionable Thread</div>
              <p className="text-[11px] text-white/50 mt-1 max-w-[220px] leading-relaxed">संदर्भ कार्ड, दक्षिणा रसीदें और कॉल नोट्स यहाँ साझा करें — बिना कॉल बाधित किए।</p>
              {isInternalMode && <p className="text-[11px] text-amber-300 mt-1 max-w-[220px]">INTERNAL mode — messages visible to team only, enforced server-side.</p>}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button onClick={() => handleSendCard('KUNDLI_INSIGHT')} className="px-3 py-1.5 rounded-full bg-[#D4AF37] text-black text-[11px] font-bold flex items-center gap-1 shadow-md hover:brightness-110 cursor-pointer">
                <Sparkles className="w-3 h-3" /> Kundli Insight
              </button>
              <button onClick={() => handleSendCard('DAKSHINA_PAYMENT')} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-white/15 cursor-pointer">
                <CreditCard className="w-3 h-3 text-[#D4AF37]" /> Dakshina
              </button>
              <button onClick={() => handleSendCard('CALL_EVENT')} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-white/15 cursor-pointer">
                <PhoneCall className="w-3 h-3 text-emerald-400" /> Call Event
              </button>
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={scrollRef} />
      </div>

      {/* Composer — with internal toggle + voice */}
      <form onSubmit={handleSendText} className="shrink-0 p-3 border-t border-white/10 bg-[#0D101C] flex flex-col gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" onClick={() => handleSendCard('KUNDLI_INSIGHT')} className="px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#F0C968] text-[10px] font-bold flex items-center gap-1 hover:bg-[#D4AF37]/20 transition-colors cursor-pointer" title="Send Kundli Insight Card">
            <Sparkles className="w-3 h-3" /> Kundli
          </button>
          <button type="button" onClick={() => handleSendCard('DAKSHINA_PAYMENT')} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-[10px] font-bold flex items-center gap-1 hover:bg-white/10 transition-colors cursor-pointer" title="Send Dakshina Payment Card">
            <CreditCard className="w-3 h-3" /> ₹501
          </button>
          <button type="button" onClick={() => handleSendCard('CALL_EVENT')} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-[10px] font-bold flex items-center gap-1 hover:bg-white/10 transition-colors cursor-pointer" title="Send Call Event Card">
            <PhoneCall className="w-3 h-3" /> Call
          </button>
          {showVoiceToggle && (
            <button type="button" onClick={() => setShowVoice(v => !v)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border cursor-pointer ${showVoice ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'}`}>
              <Mic className="w-3 h-3" /> Voice
            </button>
          )}
          <span className="ml-auto text-[10px] text-[#A69F94] hidden sm:inline">{isInternalMode ? 'INTERNAL • Team' : 'Actionable • Encrypted'}</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={isInternalMode ? 'Internal team note (CHITI TEAM ONLY)...' : role === 'pandit' ? 'भक्त को संदेश / नोट भेजें...' : role === 'operator' ? 'Internal or seeker-visible note...' : 'पंडित जी को संदेश भेजें...'}
            className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs text-white placeholder:text-white/40 focus:outline-none transition-colors ${isInternalMode ? 'bg-amber-500/10 border-amber-500/30 focus:border-amber-500/50 placeholder:text-amber-200/50' : 'bg-white/5 border-white/10 focus:border-[#D4AF37]/50 focus:bg-white/10'}`}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className={`w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-colors cursor-pointer shrink-0 ${isInternalMode ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-[#D4AF37] hover:bg-[#E1C15A] text-black'}`}
            aria-label="Send message"
          >
            {isInternalMode ? <EyeOff className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {isInternalMode && <div className="text-[10px] text-amber-300 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> INTERNAL — CHITI TEAM ONLY • Server-enforced, never visible to seeker</div>}
      </form>
    </div>
  );
}
