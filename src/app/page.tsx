'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Clock, FileText, User, ChevronRight, Compass, Sun, Eye, Lock, MapPin } from 'lucide-react';
import { calculateKundali } from '@/engines/astrologyEngine.js';
import { calculateVimshottariDasha, getCurrentDasha } from '@/engines/dashaEngine.js';
import { calculatePanchang } from '@/engines/panchang.js';
import NorthIndianChart from '@/components/NorthIndianChart.jsx';
import SwargaLok from '@/components/SwargaLok.jsx';
import KarmaWheel from '@/components/KarmaWheel';
import DestinyTimeline from '@/components/DestinyTimeline';
import ChatBox from '@/components/ChatBox';
import MyDaysPanchang from '@/components/MyDaysPanchang';
import CosmicNow from '@/components/CosmicNow';
import VedicDayRibbon from '@/components/VedicDayRibbon';
import IntentRouter from '@/components/IntentRouter';
import MuhuratDiscovery from '@/components/MuhuratDiscovery';
import FestivalStrip from '@/components/FestivalStrip';
import MethodologySplit from '@/components/MethodologySplit';
import QuestionRefiner from '@/components/QuestionRefiner';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import ShareableCard from '@/components/ShareableCard';
import Footer from '@/components/Footer';
import { trackEvent } from '@/lib/analytics';

interface Practitioner {
  id: string;
  displayName: string;
  experienceYears?: number;
  specialties?: string[];
  languages?: string[];
  bio?: string;
  profilePhoto?: string;
}

export default function PublicLandingPage() {
  const [activeTab, setActiveTab] = useState<'kundali' | 'swarga' | 'dasha' | 'karma' | 'mydays' | 'guru'>('kundali');
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loadingPractitioners, setLoadingPractitioners] = useState(true);

  const [calcForm, setCalcForm] = useState({
    dob: '1995-06-15',
    tob: '10:30',
    city: 'Patna',
    lat: 25.5941,
    lon: 85.1376,
    tz: 5.5,
  });
  const [kundali, setKundali] = useState<any>(null);
  const [dashas, setDashas] = useState<any>(null);
  const [currentDasha, setCurrentDasha] = useState<any>(null);

  useEffect(() => {
    trackEvent('HOME_VIEW', { path: '/' });

    // Fetch real practitioner records
    async function fetchPractitioners() {
      try {
        const res = await fetch('/api/astrology/practitioners');
        const data = await res.json();
        if (data.success && data.consultants) {
          setPractitioners(data.consultants);
        }
      } catch (err) {
        console.error('Failed to load practitioners:', err);
      } finally {
        setLoadingPractitioners(false);
      }
    }
    fetchPractitioners();

    handleCalculateKundali();
  }, []);

  const handleCalculateKundali = () => {
    try {
      const k = calculateKundali(calcForm.dob, calcForm.tob, calcForm.lat, calcForm.lon, calcForm.tz);
      const dashaList = calculateVimshottariDasha(k.planets.Moon.nakshatra, new Date(calcForm.dob));
      const curDasha = getCurrentDasha(dashaList, new Date());
      setKundali(k);
      setDashas(dashaList);
      setCurrentDasha(curDasha);
      trackEvent('KUNDALI_GENERATED', { city: calcForm.city });
    } catch (e) {
      console.error('Kundali calculation error:', e);
    }
  };

  const firstPractitioner = practitioners[0];

  return (
    <div className="min-h-screen bg-[#030108] text-[#E2D9F3] font-body selection:bg-[#7C3AED] selection:text-white">
      {/* 6. CONSUMER NAVIGATION ARCHITECTURE */}
      <nav className="border-b border-purple-500/20 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕉️</span>
            <div>
              <span className="font-display text-base font-bold text-white tracking-wider">COSMICTANTRA</span>
              <span className="hidden sm:inline-block text-[10px] text-[#A78BFA] ml-2 font-mono bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">
                cosmictantra.chiti.tech
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <a href="#today" className="hidden lg:inline-block text-[#9CA3AF] hover:text-white transition-colors">
              Today
            </a>
            <a href="#today" className="hidden lg:inline-block text-[#9CA3AF] hover:text-white transition-colors">
              Panchang
            </a>
            <a href="#muhurat" className="hidden lg:inline-block text-[#9CA3AF] hover:text-white transition-colors">
              Muhurat
            </a>
            <a href="#calculator" className="hidden lg:inline-block text-[#9CA3AF] hover:text-white transition-colors">
              Kundali
            </a>
            <a href="#calculator" className="hidden lg:inline-block text-[#9CA3AF] hover:text-white transition-colors">
              Dasha
            </a>
            <a href="#festivals" className="hidden lg:inline-block text-[#9CA3AF] hover:text-white transition-colors">
              Festivals
            </a>
            <a href="#practitioners" className="hidden lg:inline-block text-[#9CA3AF] hover:text-white transition-colors" onClick={() => trackEvent('PRACTITIONER_VIEWED')}>
              Jyotishi
            </a>
            <Link
              href="/ask"
              className="chiti-btn-primary py-2 px-4 text-xs font-bold"
              onClick={() => trackEvent('ASK_JYOTISHI_CLICKED')}
            >
              Ask a Jyotishi
            </Link>
          </div>
        </div>
      </nav>

      {/* 7. HERO — LIVE FUNCTIONING PRODUCT SURFACE */}
      <section id="today" className="py-12 sm:py-20 px-4 max-w-6xl mx-auto border-b border-purple-500/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* LEFT: Micro-label, Headline & Proposition */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/60 border border-[#7C3AED]/40 text-[#A78BFA] text-[11px] font-bold uppercase tracking-widest font-mono">
              VEDIC TIME • PERSONAL ASTROLOGY • HUMAN JYOTISH
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold font-display text-white tracking-tight leading-none">
              Vedic Precision.<br />
              <span className="text-[#F59E0B]">Human Wisdom.</span>
            </h1>

            <p className="text-base font-bold text-white leading-snug">
              Understand the day. Understand your chart. Ask when it matters.
            </p>

            <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed max-w-xl">
              Location-aware Vedic time, personal chart calculations and guidance reviewed by experienced Jyotish practitioners.
            </p>

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a
                href="#today"
                className="chiti-btn-primary py-3.5 px-6 text-xs font-bold justify-center"
                onClick={() => trackEvent('TODAY_PANCHANG_OPENED')}
              >
                See Today's Panchang
              </a>
              <a
                href="#calculator"
                className="chiti-btn-secondary py-3.5 px-6 text-xs font-bold justify-center"
                onClick={() => trackEvent('KUNDALI_STARTED')}
              >
                Create My Kundali
              </a>
            </div>

            <div className="pt-2 text-xs font-bold text-[#F59E0B]">
              <Link href="/ask" className="hover:underline flex items-center gap-1">
                Ask a Jyotishi →
              </Link>
            </div>
          </div>

          {/* RIGHT: LIVE "COSMIC NOW" INSTRUMENT */}
          <div className="lg:col-span-6">
            <CosmicNow />
          </div>
        </div>
      </section>

      {/* 10. SECTION — YOUR DAY, IN VEDIC TIME */}
      <VedicDayRibbon />

      {/* 11. "WHAT BROUGHT YOU HERE?" INTENT ROUTER */}
      <IntentRouter />

      {/* 12. MUHURAT DISCOVERY */}
      <MuhuratDiscovery />

      {/* 13. FESTIVAL / VRAT STRIP */}
      <FestivalStrip />

      {/* 14. CONCEPTUAL SHIFT ("WORLD" → "YOU") */}
      <section className="py-16 px-4 max-w-4xl mx-auto text-center border-b border-purple-500/20">
        <div className="space-y-4 py-8 bg-gradient-to-r from-purple-950/40 via-black to-purple-950/40 rounded-3xl border border-purple-500/30">
          <p className="text-lg sm:text-2xl font-display font-light text-[#D1D5DB]">
            "The Panchang describes the moment."
          </p>
          <p className="text-xl sm:text-3xl font-display font-bold text-[#F59E0B]">
            "Your Kundali describes your relationship with it."
          </p>
        </div>
      </section>

      {/* 15 & 16. PERSONAL KUNDALI EXPERIENCE ("YOUR CHART") */}
      <section id="calculator" className="py-16 px-4 max-w-6xl mx-auto border-b border-purple-500/20 space-y-6 font-body">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest mb-1">
            CALCULATION TRUTH
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white mb-2">
            Your sky at birth.
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Enter your birth details to reveal your foundational Vedic chart and Vimshottari Dasha timeline.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 border-b border-purple-500/20 pb-4">
          <button
            onClick={() => setActiveTab('kundali')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'kundali' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            🗺️ Kundali Chart
          </button>
          <button
            onClick={() => setActiveTab('swarga')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'swarga' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            🌌 3D Swarga Lok
          </button>
          <button
            onClick={() => setActiveTab('mydays')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'mydays' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            📅 My Days Panchang
          </button>
          <button
            onClick={() => setActiveTab('dasha')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'dasha' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            ⏳ Dasha Timeline
          </button>
          <button
            onClick={() => setActiveTab('karma')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'karma' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            ☸️ Karma Matrix
          </button>
          <button
            onClick={() => setActiveTab('guru')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'guru' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            🧘 Guru AI Chat (3 Free)
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="chiti-card p-6">
          {activeTab === 'kundali' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/10">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 border-b border-white/10 pb-2 font-display">
                  ENTER BIRTH DETAILS
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Date of Birth</label>
                  <input
                    type="date"
                    className="chiti-input text-xs"
                    value={calcForm.dob}
                    onChange={e => setCalcForm({ ...calcForm, dob: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Exact Time</label>
                    <input
                      type="time"
                      className="chiti-input text-xs"
                      value={calcForm.tob}
                      onChange={e => setCalcForm({ ...calcForm, tob: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Place</label>
                    <input
                      type="text"
                      className="chiti-input text-xs"
                      value={calcForm.city}
                      onChange={e => setCalcForm({ ...calcForm, city: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCalculateKundali}
                  className="chiti-btn-primary w-full text-xs py-3 justify-center font-bold"
                >
                  Explore My Kundali ✨
                </button>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4">
                {kundali && (
                  <>
                    <NorthIndianChart kundali={kundali} size={280} />
                    <div className="w-full p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between border-b border-purple-500/10 pb-1">
                        <span className="text-[#9CA3AF]">Lagna (Ascendant):</span>
                        <span className="font-bold text-[#F59E0B]">{kundali.lagna?.rasiName} ({kundali.lagna?.nakshatra?.name})</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-500/10 pb-1">
                        <span className="text-[#9CA3AF]">Moon Nakshatra:</span>
                        <span className="font-bold text-white">{kundali.planets?.Moon?.nakshatra?.name}</span>
                      </div>
                      {currentDasha && (
                        <div className="flex justify-between">
                          <span className="text-[#9CA3AF]">Active Dasha:</span>
                          <span className="font-bold text-[#A78BFA]">{currentDasha.planet} Mahadasha</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'swarga' && <SwargaLok kundali={kundali} />}
          {activeTab === 'mydays' && <MyDaysPanchang kundali={kundali} />}
          {activeTab === 'dasha' && <DestinyTimeline dashas={dashas} currentDasha={currentDasha} birthDate={calcForm.dob} />}
          {activeTab === 'karma' && <KarmaWheel kundali={kundali} size={320} />}
          {activeTab === 'guru' && <div className="h-[450px]"><ChatBox kundali={kundali} /></div>}
        </div>
      </section>

      {/* 20. METHODOLOGY — CALCULATION IS NOT INTERPRETATION */}
      <MethodologySplit />

      {/* 21 & 22. HUMAN WISDOM — REAL PRACTITIONERS */}
      <section id="practitioners" className="py-16 px-4 max-w-5xl mx-auto border-b border-purple-500/20 font-body">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest">
            AUTHENTIC JYOTISH AUTHORITY
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            Some questions deserve a human answer.
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            CosmicTantra organises the chart and calculation evidence. A practicing Jyotishi reviews the context and decides what reaches you.
          </p>
        </div>

        {loadingPractitioners ? (
          <div className="py-12 text-center text-xs text-[#9CA3AF]">Loading practitioner directory...</div>
        ) : practitioners.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-xs text-[#9CA3AF]">
            Active practitioner onboarding in progress. All consultations are reviewed by lead practitioner Pandit Ramesh Sharma (28 years experience).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {practitioners.map(p => (
              <div key={p.id} className="chiti-card p-6 flex flex-col justify-between space-y-4 bg-black/60">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4C1D95] to-[#7C3AED] flex items-center justify-center text-3xl border border-purple-400/40 shrink-0 shadow-xl">
                    🧙
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">{p.displayName}</h3>
                    <p className="text-xs text-[#F59E0B] font-semibold">{p.experienceYears || 28} Years Practicing</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(p.specialties || ['Parashari Jyotish', 'Career Timing']).map((spec, si) => (
                        <span key={si} className="px-2 py-0.5 rounded text-[10px] bg-purple-950/60 border border-purple-500/30 text-[#A78BFA]">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#D1D5DB] leading-relaxed bg-black/40 p-3.5 rounded-xl border border-white/5">
                  "{p.bio || 'Dedicated to authentic Vedic Jyotish analysis, providing clear, actionable guidance for career, wealth, and life timing.'}"
                </p>

                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-[#9CA3AF]">
                  <span>Languages: <strong className="text-white">{(p.languages || ['Hindi', 'English']).join(', ')}</strong></span>
                  <span className="text-[#10B981] font-semibold">✓ Active Practitioner</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 26. ASK BETTER QUESTIONS */}
      <QuestionRefiner />

      {/* 23 & 24. COMMERCIAL OFFER & PIPELINE */}
      <section className="py-16 px-4 max-w-5xl mx-auto border-b border-purple-500/20 text-center font-body">
        <div className="max-w-xl mx-auto space-y-3 mb-10">
          <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest font-mono">
            PERSONAL GUIDANCE OFFER
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
            Don't pay for minutes.<br />Ask the question that matters.
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Traditional call marketplaces charge for conversation time. CosmicTantra offers a focused written consultation around one important question.
          </p>
        </div>

        {/* 5 Offer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-left mb-12">
          <div className="chiti-card p-4 space-y-1 bg-black/60">
            <div className="text-xs font-bold text-[#F59E0B] uppercase font-display">ONE QUESTION</div>
            <p className="text-[11px] text-[#9CA3AF]">Bring the decision actually on your mind.</p>
          </div>
          <div className="chiti-card p-4 space-y-1 bg-black/60">
            <div className="text-xs font-bold text-white uppercase font-display">FIXED PRICE</div>
            <p className="text-[11px] text-[#9CA3AF]">₹199 — No ticking timer.</p>
          </div>
          <div className="chiti-card p-4 space-y-1 bg-black/60">
            <div className="text-xs font-bold text-[#A78BFA] uppercase font-display">CALCULATION</div>
            <p className="text-[11px] text-[#9CA3AF]">Relevant chart evidence prepared.</p>
          </div>
          <div className="chiti-card p-4 space-y-1 bg-black/60">
            <div className="text-xs font-bold text-[#10B981] uppercase font-display">HUMAN REVIEW</div>
            <p className="text-[11px] text-[#9CA3AF]">A practitioner reviews interpretation.</p>
          </div>
          <div className="chiti-card p-4 space-y-1 bg-black/60">
            <div className="text-xs font-bold text-white uppercase font-display">WRITTEN ANSWER</div>
            <p className="text-[11px] text-[#9CA3AF]">Keep it. Revisit anytime.</p>
          </div>
        </div>

        {/* HUMAN HANDOFF PROCESS DIAGRAM (Signature 04) */}
        <div className="chiti-card p-6 sm:p-8 border-2 border-purple-500/30 bg-black/80 space-y-4">
          <div className="text-xs font-bold text-white uppercase tracking-wider font-display">
            HUMAN HANDOFF CONSULTATION PIPELINE
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xs font-bold text-white block">01 YOU ASK</span>
              <span className="text-[10px] text-[#9CA3AF] block mt-1">Submit Question</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
              <span className="text-xs font-bold text-[#A78BFA] block">02 CALCULATE</span>
              <span className="text-[10px] text-[#9CA3AF] block mt-1">Calculated Data</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
              <span className="text-xs font-bold text-[#A78BFA] block">03 AI ORGANISE</span>
              <span className="text-[10px] text-[#9CA3AF] block mt-1">AI Working Draft</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40">
              <span className="text-xs font-bold text-[#F59E0B] block">04 JYOTISHI</span>
              <span className="text-[10px] text-[#F59E0B] block mt-1">Human Interpretation</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-xs font-bold text-[#6EE7B7] block">05 YOU RECEIVE</span>
              <span className="text-[10px] text-[#6EE7B7] block mt-1">WhatsApp SLA</span>
            </div>
          </div>
        </div>
      </section>

      {/* 25. SAMPLE REAL CONSULTATION (ANONYMIZED OUTCOME) */}
      <section className="py-16 px-4 max-w-5xl mx-auto border-b border-purple-500/20 font-body">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest">
            DEMONSTRATION & ANONYMIZED EXAMPLE
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
            See what reaches you.
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Anonymized example of a written consultation report verified by senior Pandit Ji.
          </p>
        </div>

        <div className="chiti-card p-6 sm:p-8 space-y-6 border-2 border-amber-500/30 bg-black/80">
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1">
            <div className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">CUSTOMER QUESTION</div>
            <p className="text-sm font-semibold text-white">
              "Should I expand my retail business to a second location in the next six months?"
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[#9CA3AF] text-[10px] block">Lagna</span>
              <strong className="text-white">Taurus (Krittika)</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[#9CA3AF] text-[10px] block">Moon Nakshatra</span>
              <strong className="text-white">Rohini (Pada 2)</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[#9CA3AF] text-[10px] block">Active Dasha</span>
              <strong className="text-[#A78BFA]">Rahu Mahadasha</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[#9CA3AF] text-[10px] block">10th House Lord</span>
              <strong className="text-[#F59E0B]">Saturn in 11th House</strong>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-wider">COSMICTANTRA WORKING NOTES</div>
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs font-mono text-[#D1D5DB] leading-relaxed">
              • 10th house lord Saturn is placed in 11th house of financial gains.<br />
              • Current Rahu Mahadasha favors retail expansion after Venus transit into 11th house.
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> PANDIT INTERPRETATION & FINAL APPROVAL
              </div>
              <span className="text-[10px] text-[#10B981] font-semibold">Approved by Pandit Ramesh Sharma</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-white leading-relaxed space-y-2">
              <p>
                <strong>VERIFIED GUIDANCE:</strong> Expanding your business to a second location will be highly auspicious, provided capital deployment occurs after the upcoming Venus transit into your 11th house of financial growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 27. KNOWLEDGE GRAPH */}
      <KnowledgeGraph />

      {/* 30. DAILY SHAREABLE ARTIFACT */}
      <ShareableCard />

      {/* 49. HOMEPAGE FINAL CHAPTER (DARK QUIET ENVIRONMENT) */}
      <section className="py-20 px-4 max-w-4xl mx-auto text-center font-body">
        <div className="chiti-card p-8 sm:p-14 border-2 border-purple-500/30 bg-black/90 space-y-5">
          <div className="w-12 h-12 rounded-full bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-2xl mx-auto">
            🕉️
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
            One question still on your mind?
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">
            When calculation alone is not enough, ask a practicing Jyotishi.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <Link
              href="/ask"
              className="chiti-btn-primary py-3.5 px-8 text-xs font-bold"
              onClick={() => trackEvent('ASK_STARTED')}
            >
              Ask One Question — ₹199 <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#practitioners" className="chiti-btn-secondary py-3.5 px-8 text-xs font-bold">
              Meet the Practitioners
            </a>
          </div>
        </div>
      </section>

      {/* 39. DEEP INFORMATION MAP FOOTER */}
      <Footer />
    </div>
  );
}
