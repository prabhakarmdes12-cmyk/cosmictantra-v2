'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock,
  CreditCard,
  Phone,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KundliInsightCardProps {
  chartId?: string;
  nativeName?: string;
  seekerName?: string;
  ascendant?: string;
  moonSign?: string;
  nakshatra?: string;
  activeDasha?: string;
  verbatimQuestion?: string;
  prashna?: string;
  viewActionUrl?: string;
  chartParams?: Record<string, string>;
}

export interface DakshinaPaymentCardProps {
  consultationId?: string;
  amountInr?: number;
  currency?: string;
  beneficiaryScholar?: string;
  entitledMinutes?: number;
  paymentStatus?: 'PENDING' | 'VERIFIED';
  upiIntentUrl?: string;
  onVerify?: () => void;
}

export interface CallEventCardProps {
  durationSeconds?: number;
  durationLabel?: string;
  startedAt?: number;
  endedAt?: number;
  onCallAgain?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(sec?: number, label?: string): string {
  if (label) return label;
  if (typeof sec !== 'number' || isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Kundli Insight Card — temple-gold glass
// ---------------------------------------------------------------------------

export function KundliInsightCard({
  chartId,
  nativeName,
  seekerName,
  ascendant,
  moonSign,
  nakshatra,
  activeDasha,
  verbatimQuestion,
  prashna,
  viewActionUrl,
  chartParams,
}: KundliInsightCardProps) {
  const displayName = nativeName || seekerName || 'श्रद्धालु भक्त';
  const question = verbatimQuestion || prashna || 'ज्योतिषीय मार्गदर्शन हेतु प्रार्थना';
  const href =
    viewActionUrl ||
    (chartId
      ? `/kundli?id=${encodeURIComponent(chartId)}`
      : chartParams
      ? `/kundli?${new URLSearchParams(chartParams).toString()}`
      : '/kundli');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#0D101C]/95 via-[#0F121E]/90 to-[#070913]/95 backdrop-blur-xl shadow-xl">
      {/* subtle temple-gold glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-amber-600/5 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8E6F1D] flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase">
                Kundli Insight
              </div>
              <div className="text-xs font-bold text-white leading-none">{displayName}</div>
            </div>
          </div>
          {chartId && (
            <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#C5BEB3]">
              {chartId}
            </span>
          )}
        </div>

        {/* Astro grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[9px] font-bold tracking-widest text-[#A69F94] uppercase block">
              Lagna / Ascendant
            </span>
            <span className="text-xs font-bold text-white mt-0.5 block">
              {ascendant || '— (गणना प्रतीक्षित)'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[9px] font-bold tracking-widest text-[#A69F94] uppercase block">
              Rashi / Moon Sign
            </span>
            <span className="text-xs font-bold text-white mt-0.5 block">
              {moonSign || '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[9px] font-bold tracking-widest text-[#A69F94] uppercase block">
              Nakshatra
            </span>
            <span className="text-xs font-bold text-white mt-0.5 block">
              {nakshatra || '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
            <span className="text-[9px] font-bold tracking-widest text-[#A69F94] uppercase block">
              Active Dasha
            </span>
            <span className="text-xs font-bold text-white mt-0.5 block">
              {activeDasha || '—'}
            </span>
          </div>
        </div>

        {/* Prashna */}
        <div className="p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
          <span className="text-[10px] font-bold text-[#D4AF37] block mb-1">Prashna / Inquiry</span>
          <p className="text-xs text-white/90 italic leading-relaxed">“{question}”</p>
        </div>

        {/* CTA */}
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => chitiSensory.playTick()}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#E1C15A] hover:to-[#D4AF37] text-black font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            <span>कुंडली विश्लेषक खोलें (Open Kundli)</span>
          </span>
          <Sparkles className="w-3.5 h-3.5 opacity-60" />
        </Link>

        <div className="flex items-center gap-1.5 text-[10px] text-[#A69F94]">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>जन्म विवरण सुरक्षित — केवल अधिकृत परामर्श में दृश्य</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dakshina Payment Card
// ---------------------------------------------------------------------------

export function DakshinaPaymentCard({
  consultationId,
  amountInr = 501,
  currency = 'INR',
  beneficiaryScholar,
  entitledMinutes = 15,
  paymentStatus = 'PENDING',
  upiIntentUrl,
  onVerify,
}: DakshinaPaymentCardProps) {
  const isVerified = paymentStatus === 'VERIFIED';
  const upiUrl =
    upiIntentUrl ||
    `upi://pay?pa=chititech@bank&pn=${encodeURIComponent(beneficiaryScholar || 'CosmicTantra')}&am=${amountInr}&cu=${currency}&tn=${encodeURIComponent(consultationId || 'CT-SABHA-Dakshina')}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#0D101C]/95 via-[#121A0F]/90 to-[#0D101C]/95 backdrop-blur-xl shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-[#D4AF37]/5 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

      <div className="relative p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
                isVerified
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
                  : 'bg-gradient-to-br from-amber-500 to-[#8E6F1D]'
              }`}
            >
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase">
                Dakshina / Consultation Fee
              </div>
              <div className="text-xs font-bold text-white leading-none">
                {beneficiaryScholar || 'पं. विद्वान् ज्योतिर्विद'}
              </div>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isVerified
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300 animate-pulse'
            }`}
          >
            {isVerified ? '✓ VERIFIED' : '● PENDING'}
          </span>
        </div>

        <div className="flex items-baseline justify-between p-3 rounded-xl bg-black/30 border border-white/5">
          <div>
            <span className="text-[10px] text-[#A69F94] block">Amount</span>
            <span className="text-2xl font-bold text-white">
              ₹{amountInr.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-[#A69F94] ml-1">{currency}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#A69F94] block">Entitled</span>
            <span className="text-sm font-bold text-[#D4AF37] flex items-center gap-1 justify-end">
              <Clock className="w-3.5 h-3.5" />
              {entitledMinutes} min
            </span>
            {consultationId && (
              <span className="text-[9px] font-mono text-white/50 block mt-0.5">{consultationId}</span>
            )}
          </div>
        </div>

        {!isVerified ? (
          <a
            href={upiUrl}
            onClick={() => chitiSensory.playTick()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#8E6F1D] hover:brightness-110 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <span>UPI से भुगतान करें — ₹{amountInr} Pay via UPI</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>भुगतान सत्यापित — परामर्श सक्रिय (Payment Verified)</span>
          </div>
        )}

        {onVerify && !isVerified && (
          <button
            onClick={() => {
              chitiSensory.playTick();
              onVerify();
            }}
            className="w-full text-[11px] text-[#A69F94] hover:text-white underline cursor-pointer"
          >
            भुगतान पूरा होने पर टैप करें (Mark as verified for demo)
          </button>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-[#A69F94]">
          <Lock className="w-3 h-3 text-[#D4AF37]" />
          <span>UPI intent • No card details stored • Chitigram verified settlement</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Call Event Card
// ---------------------------------------------------------------------------

export function CallEventCard({
  durationSeconds,
  durationLabel,
  startedAt,
  endedAt,
  onCallAgain,
}: CallEventCardProps) {
  const label = formatDuration(durationSeconds, durationLabel);
  const sublabel =
    startedAt && endedAt
      ? `${new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → ${new Date(endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : startedAt
      ? `Started ${new Date(startedAt).toLocaleTimeString()}` 
      : 'Secure consultation record';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#0D101C]/95 via-[#0F1A14]/90 to-[#0D101C]/95 backdrop-blur-xl shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-sky-500/5 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

      <div className="relative p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-md">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
                Call Completed
              </div>
              <div className="text-xs font-bold text-white leading-none">परामर्श सम्पन्न</div>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-bold">
            <Lock className="w-3 h-3" />
            DTLS-SRTP E2EE
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <span className="text-[10px] text-[#A69F94] block">Duration</span>
              <span className="text-xl font-mono font-bold text-white tracking-widest">{label}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#A69F94] block">Session</span>
            <span className="text-[10px] font-mono text-white/70 block">{sublabel}</span>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              Zero Recording ✓
            </span>
          </div>
        </div>

        {onCallAgain && (
          <button
            onClick={() => {
              chitiSensory.playTick();
              onCallAgain();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>पुनः कॉल करें (Call Again)</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-[#A69F94]">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Media streams destroyed • Only duration retained • Encrypted transport</span>
        </div>
      </div>
    </div>
  );
}

export default {
  KundliInsightCard,
  DakshinaPaymentCard,
  CallEventCard,
};
