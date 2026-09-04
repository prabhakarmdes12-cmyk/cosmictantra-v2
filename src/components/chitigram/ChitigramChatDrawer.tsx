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
} from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';
import {
  KundliInsightCard,
  DakshinaPaymentCard,
  CallEventCard,
} from './ChitigramCards';

// Local types — mirrors API store to avoid extra lib import (blast-radius contained)
export type ChitigramCardType = 'KUNDLI_INSIGHT' | 'DAKSHINA_PAYMENT' | 'CALL_EVENT';
export type ChitigramMessageStatus = 'SENT' | 'DELIVERED' | 'READ';
export interface ChitigramMessage {
  id: string;
  conversationId: string;
  senderRole: 'devotee' | 'pandit';
  senderName?: string;
  text?: string;
  cardType?: ChitigramCardType;
  cardPayload?: Record<string, any>;
  timestamp: number;
  status: ChitigramMessageStatus;
  sessionId?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ChitigramChatDrawerProps {
  conversationId: string;
  role: 'devotee' | 'pandit';
  consultantName?: string;
  seekerName?: string;
  prashna?: string;
  onTriggerCall?: () => void;
  className?: string;
  // optional: allow parent to control embedded vs drawer mode
  variant?: 'embedded' | 'drawer';
  onClose?: () => void;
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
// Component
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
}: ChitigramChatDrawerProps) {
  const [messages, setMessages] = useState<ChitigramMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showCardActions, setShowCardActions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const peerName = role === 'devotee' ? consultantName || 'पंडित जी' : seekerName || 'श्रद्धालु भक्त';
  const selfName = role === 'devotee' ? seekerName || 'आप' : consultantName || 'आप (पंडित जी)';

  // -----------------------------------------------------------------------
  // Fetch messages (poll 2.5s) + initial load
  // -----------------------------------------------------------------------

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(
        `/api/chitigram/messages?conversationId=${encodeURIComponent(conversationId)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (data?.ok && Array.isArray(data.messages)) {
        setMessages(data.messages as ChitigramMessage[]);
      }
    } catch {
      // best-effort
    }
  }, [conversationId]);

  useEffect(() => {
    void fetchMessages();
    pollRef.current = setInterval(() => void fetchMessages(), 2500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // -----------------------------------------------------------------------
  // Send helpers
  // -----------------------------------------------------------------------

  const postMessage = useCallback(
    async (payload: { text?: string; cardType?: ChitigramCardType; cardPayload?: Record<string, any> }) => {
      if (!conversationId) return;
      setSending(true);
      try {
        const res = await fetch('/api/chitigram/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            sessionId: conversationId,
            senderRole: role,
            senderName: selfName,
            text: payload.text,
            cardType: payload.cardType,
            cardPayload: payload.cardPayload,
          }),
        });
        const data = await res.json();
        if (data?.ok && data.message) {
          setMessages(prev => [...prev, data.message as ChitigramMessage]);
          chitiSensory.playTick();
        } else {
          // optimistic fallback: push locally and refetch
          await fetchMessages();
        }
      } catch {
        await fetchMessages();
      } finally {
        setSending(false);
        setInputText('');
        setShowCardActions(false);
      }
    },
    [conversationId, role, selfName, fetchMessages]
  );

  const handleSendText = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    await postMessage({ text: trimmed });
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
      });
    }
  };

  // -----------------------------------------------------------------------
  // Render message bubble
  // -----------------------------------------------------------------------

  const renderMessage = (m: ChitigramMessage) => {
    const isSelf = m.senderRole === role;
    const bubbleBase = isSelf
      ? 'bg-[#D4AF37] text-black rounded-br-sm'
      : 'bg-white/10 text-white border border-white/10 rounded-bl-sm';

    // Card rendering
    if (m.cardType === 'KUNDLI_INSIGHT' && m.cardPayload) {
      return (
        <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[92%]`}>
          <div className="w-full">
            <KundliInsightCard {...m.cardPayload} />
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
            {isSelf && statusTicks(m.status)}
          </div>
        </div>
      );
    }
    if (m.cardType === 'DAKSHINA_PAYMENT' && m.cardPayload) {
      return (
        <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[92%]`}>
          <div className="w-full">
            <DakshinaPaymentCard {...m.cardPayload} onVerify={() => handleSendCard('DAKSHINA_PAYMENT')} />
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
            {isSelf && statusTicks(m.status)}
          </div>
        </div>
      );
    }
    if (m.cardType === 'CALL_EVENT' && m.cardPayload) {
      return (
        <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[92%]`}>
          <div className="w-full">
            <CallEventCard {...m.cardPayload} onCallAgain={onTriggerCall} />
          </div>
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
            {isSelf && statusTicks(m.status)}
          </div>
        </div>
      );
    }

    // Plain text
    return (
      <div key={m.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[85%]`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${bubbleBase}`}>
          <div className="font-bold text-[9px] opacity-60 mb-0.5">
            {isSelf ? 'आप' : m.senderName || peerName}
          </div>
          <p className="whitespace-pre-wrap break-words">{m.text}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-[9px] text-[#A69F94]">{formatTime(m.timestamp)}</span>
          {isSelf && statusTicks(m.status)}
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // Outer container classes
  // -----------------------------------------------------------------------

  const containerClasses =
    variant === 'drawer'
      ? 'flex flex-col h-full bg-[#0D101C] border border-[#D4AF37]/20 rounded-2xl shadow-2xl overflow-hidden'
      : 'flex flex-col h-full bg-[#0D101C] border border-[#D4AF37]/20 rounded-2xl shadow-xl overflow-hidden';

  return (
    <div className={`${containerClasses} ${className}`} data-testid="chitigram-chat-drawer">
      {/* Header */}
      <div className="shrink-0 px-3.5 py-3 bg-gradient-to-r from-[#0D101C] via-[#12152A] to-[#0D101C] border-b border-[#D4AF37]/20 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8E6F1D] flex items-center justify-center text-black font-bold text-sm shadow-md shrink-0">
            {role === 'pandit' ? '🕉️' : 'ॐ'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              {peerName}
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            </div>
            <div className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Online • Available • Chitigram
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Phone icon — 1-click call trigger */}
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

      {/* Card quick actions */}
      {showCardActions && (
        <div className="px-3 py-2 bg-black/20 border-b border-white/5 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => handleSendCard('KUNDLI_INSIGHT')}
            className="px-3 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F0C968] text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#D4AF37]/25 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Kundli Card
          </button>
          <button
            onClick={() => handleSendCard('DAKSHINA_PAYMENT')}
            className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Dakshina ₹501
          </button>
          <button
            onClick={() => handleSendCard('CALL_EVENT')}
            className="px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] font-bold flex items-center gap-1.5 hover:bg-sky-500/20 transition-colors cursor-pointer whitespace-nowrap"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Call Record
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-transparent via-transparent to-black/10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#8E6F1D]/20 border border-[#D4AF37]/20 flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <div className="text-xs font-bold text-white">Chitigram — Actionable Thread</div>
              <p className="text-[11px] text-white/50 mt-1 max-w-[220px] leading-relaxed">
                संदर्भ कार्ड, दक्षिणा रसीदें और कॉल नोट्स यहाँ साझा करें — बिना कॉल बाधित किए।
              </p>
            </div>
            {/* Quick card buttons for empty state */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => handleSendCard('KUNDLI_INSIGHT')}
                className="px-3 py-1.5 rounded-full bg-[#D4AF37] text-black text-[11px] font-bold flex items-center gap-1 shadow-md hover:brightness-110 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Kundli Insight
              </button>
              <button
                onClick={() => handleSendCard('DAKSHINA_PAYMENT')}
                className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-white/15 cursor-pointer"
              >
                <CreditCard className="w-3 h-3 text-[#D4AF37]" />
                Dakshina
              </button>
              <button
                onClick={() => handleSendCard('CALL_EVENT')}
                className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-white/15 cursor-pointer"
              >
                <PhoneCall className="w-3 h-3 text-emerald-400" />
                Call Event
              </button>
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={scrollRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSendText}
        className="shrink-0 p-3 border-t border-white/10 bg-[#0D101C] flex flex-col gap-2"
      >
        {/* Inline card shortcuts when not in header */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleSendCard('KUNDLI_INSIGHT')}
            className="px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#F0C968] text-[10px] font-bold flex items-center gap-1 hover:bg-[#D4AF37]/20 transition-colors cursor-pointer"
            title="Send Kundli Insight Card"
          >
            <Sparkles className="w-3 h-3" />
            Kundli
          </button>
          <button
            type="button"
            onClick={() => handleSendCard('DAKSHINA_PAYMENT')}
            className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-[10px] font-bold flex items-center gap-1 hover:bg-white/10 transition-colors cursor-pointer"
            title="Send Dakshina Payment Card"
          >
            <CreditCard className="w-3 h-3" />
            ₹501
          </button>
          <button
            type="button"
            onClick={() => handleSendCard('CALL_EVENT')}
            className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-[10px] font-bold flex items-center gap-1 hover:bg-white/10 transition-colors cursor-pointer"
            title="Send Call Event Card"
          >
            <PhoneCall className="w-3 h-3" />
            Call
          </button>
          <span className="ml-auto text-[10px] text-[#A69F94] hidden sm:inline">
            Actionable • Encrypted
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={
              role === 'pandit' ? 'भक्त को संदेश / नोट भेजें...' : 'पंडित जी को संदेश भेजें...'
            }
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/10 transition-colors"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 rounded-xl bg-[#D4AF37] hover:bg-[#E1C15A] text-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-colors cursor-pointer shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
