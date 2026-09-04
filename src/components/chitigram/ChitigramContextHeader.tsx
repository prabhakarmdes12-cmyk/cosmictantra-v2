'use client';

import React from 'react';
import Link from 'next/link';
import { User, Languages, Tag, MessageSquare, CreditCard, FileText, Sparkles, ShieldCheck, Phone, Clock } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

export interface ChitigramContextHeaderProps {
  seekerName?: string;
  seekerPhoneMasked?: string;
  language?: string;
  category?: string;
  originalQuestion?: string;
  paymentStatus?: string;
  paymentAmountInr?: number;
  paymentVerifiedAt?: number | null;
  kundliRef?: string | null;
  kundliSummary?: Record<string, any> | null;
  assignedPandit?: { id: string; name: string; presence?: any } | null;
  className?: string;
}

export default function ChitigramContextHeader({
  seekerName,
  seekerPhoneMasked,
  language,
  category,
  originalQuestion,
  paymentStatus,
  paymentAmountInr,
  paymentVerifiedAt,
  kundliRef,
  kundliSummary,
  assignedPandit,
  className = '',
}: ChitigramContextHeaderProps) {
  const isPaid = paymentStatus === 'PAID' || paymentStatus === 'VERIFIED';

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br from-[#0D101C]/95 via-[#12152A]/90 to-[#070913]/95 border border-[#D4AF37]/20 shadow-xl backdrop-blur-xl ${className}`} data-testid="chitigram-context-header">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8E6F1D] flex items-center justify-center">
          <FileText className="w-4 h-4 text-black" />
        </div>
        <div>
          <div className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">Consultation Context</div>
          <div className="text-[11px] text-white/50">Server-truth • Org: cosmic-tantra</div>
        </div>
        {assignedPandit && (
          <span className="ml-auto px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-bold flex items-center gap-1">
            <Phone className="w-3 h-3" /> {assignedPandit.name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
          <span className="text-[9px] font-bold tracking-widest text-[#A69F94] uppercase flex items-center gap-1">
            <User className="w-3 h-3" /> Seeker
          </span>
          <span className="text-white font-bold block mt-1">{seekerName || 'श्रद्धालु भक्त'}</span>
          {seekerPhoneMasked && <span className="text-[10px] text-white/50 font-mono">{seekerPhoneMasked}</span>}
        </div>
        <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
          <span className="text-[9px] font-bold tracking-widest text-[#A69F94] uppercase flex items-center gap-1">
            <Languages className="w-3 h-3" /> Language
          </span>
          <span className="text-white font-bold block mt-1">{language || 'Hindi'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
          <span className="text-[9px] font-bold tracking-widest text-[#A69F94] uppercase flex items-center gap-1">
            <Tag className="w-3 h-3" /> Topic
          </span>
          <span className="text-white font-bold block mt-1">{category || 'General Guidance'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
          <span className="text-[9px] font-bold tracking-widest text-[#A69F94] uppercase flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Payment
          </span>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isPaid ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'}`}>
            <ShieldCheck className="w-3 h-3" /> {paymentStatus || 'PENDING'} {paymentAmountInr ? `₹${paymentAmountInr}` : ''}
          </span>
          {paymentVerifiedAt && <span className="text-[9px] text-white/40 block mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> verified {new Date(paymentVerifiedAt).toLocaleString()}</span>}
        </div>
      </div>

      {originalQuestion && (
        <div className="mt-3 p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
          <span className="text-[10px] font-bold text-[#D4AF37] flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Original Question
          </span>
          <p className="text-xs text-white/90 italic leading-relaxed mt-1">“{originalQuestion}”</p>
        </div>
      )}

      {(kundliRef || kundliSummary) && (
        <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#D4AF37] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Kundli / Report
            </span>
            {kundliRef && <span className="text-[10px] font-mono text-white/50">{kundliRef}</span>}
          </div>
          {kundliSummary && (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {kundliSummary.ascendant && (
                <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-[9px] text-[#A69F94] block">Lagna</span>
                  <span className="text-white font-bold">{String(kundliSummary.ascendant)}</span>
                </div>
              )}
              {kundliSummary.moonSign && (
                <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-[9px] text-[#A69F94] block">Rashi</span>
                  <span className="text-white font-bold">{String(kundliSummary.moonSign)}</span>
                </div>
              )}
              {kundliSummary.nakshatra && (
                <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-[9px] text-[#A69F94] block">Nakshatra</span>
                  <span className="text-white font-bold">{String(kundliSummary.nakshatra)}</span>
                </div>
              )}
              {kundliSummary.dasha && (
                <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-[9px] text-[#A69F94] block">Dasha</span>
                  <span className="text-white font-bold">{String(kundliSummary.dasha)}</span>
                </div>
              )}
            </div>
          )}
          <Link
            href={kundliRef ? `/kundli?id=${encodeURIComponent(kundliRef)}` : '/kundli'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => chitiSensory.playTick()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#8E6F1D] text-black font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Open Kundli
          </Link>
        </div>
      )}
    </div>
  );
}
