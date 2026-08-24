'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Compass, Sun, Moon, Clock, ArrowRight, ShieldCheck, UserCheck, Sparkles, Heart, Briefcase, HelpCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export default function IntentRouter() {
  const handleTileClick = (intentId: string) => {
    trackEvent('INTENT_SELECTED', { intent: intentId });
  };

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto border-b border-purple-500/20 font-body">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
        <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest">
          SYSTEM ENTRANCES & INTENTIONS
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
          What brought you here?
        </h2>
        <p className="text-xs sm:text-sm text-[#9CA3AF]">
          Select the exact area of Vedic time, self-knowledge, or guidance you wish to explore.
        </p>
      </div>

      {/* 8 Immersive Editorial Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* TILE 1: TODAY */}
        <a
          href="#calculator"
          onClick={() => handleTileClick('today')}
          className="chiti-card p-6 flex flex-col justify-between hover:border-[#F59E0B]/60 transition-all hover:scale-[1.02] group bg-black/60"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl text-[#F59E0B]">
              🌅
            </div>
            <h3 className="text-xl font-bold text-white font-display group-hover:text-[#F59E0B] transition-colors">
              TODAY
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Tithi • Nakshatra • Rahu Kaal • Daily Panchang for your exact location.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-[#F59E0B] flex items-center gap-1">
            Explore Today <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </a>

        {/* TILE 2: MUHURAT */}
        <a
          href="#muhurat"
          onClick={() => handleTileClick('muhurat')}
          className="chiti-card p-6 flex flex-col justify-between hover:border-purple-500/60 transition-all hover:scale-[1.02] group bg-black/60"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl text-[#A78BFA]">
              ⏳
            </div>
            <h3 className="text-xl font-bold text-white font-display group-hover:text-[#A78BFA] transition-colors">
              MUHURAT
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Marriage • Home • Business • Vehicle • Ceremony time selection.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-[#A78BFA] flex items-center gap-1">
            Find Auspicious Window <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </a>

        {/* TILE 3: MY KUNDALI */}
        <a
          href="#calculator"
          onClick={() => handleTileClick('kundali')}
          className="chiti-card p-6 flex flex-col justify-between hover:border-[#7C3AED]/60 transition-all hover:scale-[1.02] group bg-black/60"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-400/30 flex items-center justify-center text-xl text-[#E2D9F3]">
              🗺️
            </div>
            <h3 className="text-xl font-bold text-white font-display group-hover:text-[#A78BFA] transition-colors">
              MY KUNDALI
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Lagna • Graha Positions • House Lords • Nakshatra Longitudes.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-[#A78BFA] flex items-center gap-1">
            Generate Chart <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </a>

        {/* TILE 4: MY LIFE TIMING */}
        <a
          href="#calculator"
          onClick={() => handleTileClick('dasha')}
          className="chiti-card p-6 flex flex-col justify-between hover:border-emerald-500/60 transition-all hover:scale-[1.02] group bg-black/60"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl text-[#6EE7B7]">
              ☸️
            </div>
            <h3 className="text-xl font-bold text-white font-display group-hover:text-[#6EE7B7] transition-colors">
              MY LIFE TIMING
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Vimshottari Dasha • Active Mahadasha • 120-Year Timeline.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-[#6EE7B7] flex items-center gap-1">
            Explore Dasha Tree <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </a>

        {/* TILE 5: FESTIVALS & VRAT */}
        <a
          href="#festivals"
          onClick={() => handleTileClick('festivals')}
          className="chiti-card p-6 flex flex-col justify-between hover:border-amber-500/60 transition-all hover:scale-[1.02] group bg-black/60"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl text-[#F59E0B]">
              🪔
            </div>
            <h3 className="text-xl font-bold text-white font-display group-hover:text-[#F59E0B] transition-colors">
              FESTIVALS & VRAT
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Ekadashi • Purnima • Amavasya • Upcoming Lunar Observances.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-[#F59E0B] flex items-center gap-1">
            View Calendar <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </a>

        {/* TILE 6: RELATIONSHIPS */}
        <a
          href="#practitioners"
          onClick={() => handleTileClick('relationships')}
          className="chiti-card p-6 flex flex-col justify-between hover:border-pink-500/60 transition-all hover:scale-[1.02] group bg-black/60"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-xl text-pink-400">
              ❤️
            </div>
            <h3 className="text-xl font-bold text-white font-display group-hover:text-pink-400 transition-colors">
              RELATIONSHIPS
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Practitioner Guidance • Compatibility & Marriage Decision Context.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-pink-400 flex items-center gap-1">
            Practitioner Guidance <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </a>

        {/* TILE 7: CAREER & BUSINESS */}
        <a
          href="#practitioners"
          onClick={() => handleTileClick('career')}
          className="chiti-card p-6 flex flex-col justify-between hover:border-blue-500/60 transition-all hover:scale-[1.02] group bg-black/60"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl text-blue-400">
              💼
            </div>
            <h3 className="text-xl font-bold text-white font-display group-hover:text-blue-400 transition-colors">
              CAREER & BUSINESS
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              10th House Lord Analysis • Expansion Timing • Business Decisions.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-blue-400 flex items-center gap-1">
            Business Guidance <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </a>

        {/* TILE 8: ASK A JYOTISHI */}
        <Link
          href="/ask"
          onClick={() => handleTileClick('ask')}
          className="chiti-card p-6 flex flex-col justify-between border-2 border-purple-500/40 hover:border-[#7C3AED] transition-all hover:scale-[1.02] group bg-gradient-to-br from-purple-950/40 to-black"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/30 border border-[#7C3AED] flex items-center justify-center text-xl text-white">
              🔮
            </div>
            <h3 className="text-xl font-bold text-white font-display group-hover:text-[#F59E0B] transition-colors">
              ASK A JYOTISHI
            </h3>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              One focused personal question • Written answer reviewed by Pandit Ji — ₹199.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-[#F59E0B] flex items-center gap-1">
            Ask Question — ₹199 <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </section>
  );
}
