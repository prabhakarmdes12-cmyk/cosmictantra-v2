'use client';

import React from 'react';
import { Sun, Moon, Clock, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { calculatePanchang } from '@/engines/panchang.js';
import { trackEvent } from '@/lib/analytics';

export default function VedicDayRibbon() {
  const today = calculatePanchang(new Date(), 23.7957, 86.4304, 5.5);

  return (
    <section className="py-14 px-4 max-w-6xl mx-auto border-b border-purple-500/20 font-body">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest mb-1">
            LOCATION-AWARE VEDIC CHRONOLOGY
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
            Your day, in Vedic time.
          </h2>
        </div>

        <a
          href="#calculator"
          className="chiti-btn-secondary py-2.5 px-5 text-xs font-bold shrink-0"
          onClick={() => trackEvent('TODAY_PANCHANG_OPENED')}
        >
          Open Complete Panchang <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Horizontal Time Ribbon */}
      <div className="bg-black/60 p-5 rounded-2xl border border-purple-500/30 mb-8 overflow-x-auto">
        <div className="min-w-[650px] space-y-4">
          <div className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F59E0B]" /> DAY CYCLE & TIME WINDOWS
          </div>

          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
              <span className="text-lg block">🌅</span>
              <span className="font-bold text-white block mt-1">Sunrise</span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">{today.sunrise} IST</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-lg block">🌟</span>
              <span className="font-bold text-[#6EE7B7] block mt-1">Auspicious Hora</span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">Jupiter & Venus</span>
            </div>

            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40">
              <span className="text-lg block">⚠</span>
              <span className="font-bold text-[#F87171] block mt-1">Rahu Kalam</span>
              <span className="text-[10px] text-[#F87171] font-mono font-bold">{today.rahuKala?.start} – {today.rahuKala?.end}</span>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
              <span className="text-lg block">🌇</span>
              <span className="font-bold text-white block mt-1">Sunset</span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">{today.sunset} IST</span>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-white/10">
              <span className="text-lg block">🌙</span>
              <span className="font-bold text-white block mt-1">Night Cycle</span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">Ratri Choghadiya</span>
            </div>
          </div>
        </div>
      </div>

      {/* Useful Today Deterministic Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="chiti-card p-5 space-y-2">
          <div className="font-bold text-[#F59E0B] font-display text-sm">Tithi Characteristics</div>
          <p className="text-[#D1D5DB] leading-relaxed">
            <strong>{today.tithi?.name}</strong> ({today.tithi?.paksha}). {today.tithi?.meaning}.
          </p>
        </div>

        <div className="chiti-card p-5 space-y-2">
          <div className="font-bold text-[#A78BFA] font-display text-sm">Nakshatra Energy</div>
          <p className="text-[#D1D5DB] leading-relaxed">
            Moon transits <strong>{today.nakshatra?.name}</strong> (Pada {today.nakshatra?.pada}). Governed by planetary alignment.
          </p>
        </div>

        <div className="chiti-card p-5 space-y-2">
          <div className="font-bold text-[#10B981] font-display text-sm">Vara & Day Planet</div>
          <p className="text-[#D1D5DB] leading-relaxed">
            <strong>{today.vara?.day}</strong> (Ruled by {today.vara?.planet}). Quality: {today.vara?.quality}.
          </p>
        </div>
      </div>
    </section>
  );
}
