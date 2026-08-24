'use client';

import React from 'react';
import { Compass, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MethodologySplit() {
  return (
    <section className="py-16 px-4 max-w-6xl mx-auto border-b border-purple-500/20 font-body">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
        <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest">
          SYSTEM METHODOLOGY & BOUNDARIES
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
          Calculation is not interpretation.
        </h2>
        <p className="text-xs sm:text-sm text-[#9CA3AF]">
          We maintain absolute clarity between what algorithms calculate deterministically and what requires human Jyotish judgment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* LEFT COLUMN: WHAT COSMICTANTRA CALCULATES */}
        <div className="chiti-card p-6 sm:p-8 space-y-5 border-2 border-purple-500/30 bg-black/80">
          <div className="flex items-center gap-2 text-xs font-bold text-[#A78BFA] uppercase tracking-wider font-display border-b border-purple-500/20 pb-3">
            <Compass className="w-4 h-4 text-[#F59E0B]" /> WHAT COSMICTANTRA CALCULATES
          </div>

          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Deterministic astronomical mathematics executed in fractions of a second:
          </p>

          <ul className="space-y-3 text-xs text-white">
            <li className="flex items-start gap-2.5">
              <span className="text-[#10B981] font-bold">✓</span>
              <span><strong>Lahiri Ayanamsha Planetary Longitudes</strong> (Sun through Ketu)</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#10B981] font-bold">✓</span>
              <span><strong>Lagna & House Cusps</strong> calculated for exact birth time & coordinates</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#10B981] font-bold">✓</span>
              <span><strong>27 Nakshatras & 108 Padas</strong> with exact degree boundaries</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#10B981] font-bold">✓</span>
              <span><strong>120-Year Vimshottari Dasha Tree</strong> & active Mahadasha dates</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#10B981] font-bold">✓</span>
              <span><strong>Daily DrikPanchang Micro-Timings</strong> (Tithi, Rahu Kaal, Vara)</span>
            </li>
          </ul>
        </div>

        {/* RIGHT COLUMN: WHAT REQUIRES HUMAN INTERPRETATION */}
        <div className="chiti-card p-6 sm:p-8 space-y-5 border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-purple-950/20 to-black">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F59E0B] uppercase tracking-wider font-display border-b border-amber-500/20 pb-3">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" /> WHAT REQUIRES INTERPRETATION
          </div>

          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Human wisdom, traditional experience, and personal decision context:
          </p>

          <ul className="space-y-3 text-xs text-white">
            <li className="flex items-start gap-2.5">
              <span className="text-[#F59E0B] font-bold">•</span>
              <span><strong>Career & Business Expansion Timing</strong> under active Dasha</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#F59E0B] font-bold">•</span>
              <span><strong>Relationship & Marriage Decision Context</strong></span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#F59E0B] font-bold">•</span>
              <span><strong>Specific Vedic Remedies & Mantra Recommendations</strong></span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#F59E0B] font-bold">•</span>
              <span><strong>Evaluating Complex Multi-Transit House Conflicts</strong></span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#F59E0B] font-bold">•</span>
              <span><strong>Synthesizing Chart Evidence into Clear Written Action</strong></span>
            </li>
          </ul>
        </div>
      </div>

      {/* BOTTOM BOUNDARY STATEMENT */}
      <div className="mt-8 p-6 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-center space-y-3">
        <h3 className="text-xl font-bold font-display text-white">
          That is where a Jyotishi enters.
        </h3>
        <p className="text-xs text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">
          CosmicTantra prepares the calculation snapshot and structured working draft. A practicing Jyotishi evaluates the context and determines what reaches you.
        </p>
        <div>
          <Link href="/ask" className="chiti-btn-primary py-2.5 px-6 text-xs inline-flex items-center gap-1.5">
            Ask One Question — ₹199 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
