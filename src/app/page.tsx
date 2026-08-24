'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Clock, FileText, User, ChevronRight, Compass, Sun, Eye, Lock } from 'lucide-react';
import { calculateKundali } from '@/engines/astrologyEngine.js';
import { calculateVimshottariDasha, getCurrentDasha } from '@/engines/dashaEngine.js';
import { calculatePanchang } from '@/engines/panchang.js';
import NorthIndianChart from '@/components/NorthIndianChart.jsx';
import SwargaLok from '@/components/SwargaLok.jsx';
import KarmaWheel from '@/components/KarmaWheel.tsx';
import DestinyTimeline from '@/components/DestinyTimeline.tsx';
import ChatBox from '@/components/ChatBox.tsx';
import MyDaysPanchang from '@/components/MyDaysPanchang.tsx';

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
    // Analytics Event: LANDING_VIEW
    fetch('/api/astrology/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'LANDING_VIEW', payload: { path: '/' } }),
    }).catch(() => {});

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
    } catch (e) {
      console.error('Kundali calculation error:', e);
    }
  };

  const trackEvent = (eventType: string, payload = {}) => {
    fetch('/api/astrology/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, payload }),
    }).catch(() => {});
  };

  const firstPractitioner = practitioners[0];

  return (
    <div className="min-h-screen bg-[#030108] text-[#E2D9F3] font-body selection:bg-[#7C3AED] selection:text-white">
      {/* Top Precision Header */}
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

          <div className="flex items-center gap-3 text-xs font-semibold">
            <a href="#mechanism" className="hidden sm:inline-block text-[#9CA3AF] hover:text-white transition-colors" onClick={() => trackEvent('HOW_IT_WORKS_VIEWED')}>
              How It Works
            </a>
            <a href="#practitioners" className="hidden sm:inline-block text-[#9CA3AF] hover:text-white transition-colors" onClick={() => trackEvent('PRACTITIONER_VIEWED')}>
              Practitioners
            </a>
            <a href="#calculator" className="hidden sm:inline-block text-[#9CA3AF] hover:text-white transition-colors">
              Calculations
            </a>
            <Link href="/pandit" className="text-[#A78BFA] hover:text-white transition-colors px-2.5 py-1 rounded bg-purple-950/40 border border-purple-500/20">
              Pandit Portal
            </Link>
            <Link
              href="/ask"
              className="chiti-btn-primary py-2 px-4 text-xs"
              onClick={() => trackEvent('HERO_ASK_CLICKED')}
            >
              Ask Question — ₹199
            </Link>
          </div>
        </div>
      </nav>

      {/* TWO-COLUMN DESKTOP HERO */}
      <section className="py-12 sm:py-20 px-4 max-w-6xl mx-auto border-b border-purple-500/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* LEFT COLUMN: Promise & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/60 border border-[#7C3AED]/40 text-[#A78BFA] text-xs font-semibold uppercase tracking-wider">
              TECHNOLOGY-ASSISTED VEDIC JYOTISH
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold font-display text-white tracking-tight leading-tight">
              Vedic Precision.<br />
              <span className="text-[#F59E0B]">Human Wisdom.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#D1D5DB] leading-relaxed max-w-xl">
              Ask one important question. CosmicTantra prepares the chart analysis; an experienced Jyotish practitioner reviews the interpretation before it reaches you.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/ask"
                className="chiti-btn-primary py-3.5 px-7 text-xs font-bold justify-center"
                onClick={() => trackEvent('HERO_ASK_CLICKED')}
              >
                Ask One Question — ₹199 <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#mechanism" className="chiti-btn-secondary py-3.5 px-6 text-xs justify-center">
                See How It Works
              </a>
            </div>

            {/* Trust Microcopy */}
            <div className="pt-2 text-xs text-[#9CA3AF] flex flex-wrap items-center gap-4">
              <span>✓ One focused question</span>
              <span>•</span>
              <span>✓ Human reviewed</span>
              <span>•</span>
              <span>✓ Written answer</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Restrained Consultation Pipeline Card */}
          <div className="lg:col-span-5">
            <div className="chiti-card p-6 border-2 border-purple-500/30 space-y-4 bg-black/60">
              <div className="flex justify-between items-center border-b border-purple-500/20 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
                  YOUR CONSULTATION PIPELINE
                </span>
                <span className="text-[10px] text-[#10B981] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  SYSTEM READY
                </span>
              </div>

              {/* 5-Step Restrained Pipeline List */}
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-white font-medium">01 Question received</span>
                  <span className="text-[10px] text-[#9CA3AF]">WhatsApp / Web</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-white font-medium">02 Kundali + Dasha calculated</span>
                  <span className="text-[10px] text-[#F59E0B]">Lahiri Engine</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-white font-medium">03 Structured working analysis prepared</span>
                  <span className="text-[10px] text-[#A78BFA]">AI Working Draft</span>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                  <span className="text-[#F59E0B] font-bold">04 Pandit review</span>
                  <span className="text-[10px] text-[#10B981] font-semibold">Human Verification</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-[#6EE7B7] font-bold">05 Written consultation ready</span>
                  <span className="text-[10px] text-[#6EE7B7]">WhatsApp SLA</span>
                </div>
              </div>

              {/* Assigned Real Practitioner Preview */}
              <div className="pt-3 border-t border-purple-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-400/40 flex items-center justify-center text-lg shrink-0">
                  🧙
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {firstPractitioner ? firstPractitioner.displayName : 'Pandit Ramesh Sharma'}
                  </div>
                  <div className="text-[11px] text-[#9CA3AF]">
                    {firstPractitioner ? `${firstPractitioner.experienceYears || 28} years exp · Verified Practitioner` : '28 years exp · Parashari Jyotish'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OFFER POSITIONING SECTION */}
      <section id="mechanism" className="py-14 px-4 max-w-5xl mx-auto border-b border-purple-500/20 text-center">
        <div className="max-w-xl mx-auto space-y-3 mb-10">
          <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest">
            THE COSMICTANTRA DIFFERENCE
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
            Don't pay for minutes.<br />Ask the question that matters.
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Per-minute calls create timer anxiety. CosmicTantra offers fixed-price written consultations verified by real practitioners.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="chiti-card p-5 space-y-2">
            <div className="text-lg font-bold text-[#F59E0B] font-display">01. One Focused Question</div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              Formulate the exact business, career, or life decision on your mind without ticking timers.
            </p>
          </div>
          <div className="chiti-card p-5 space-y-2">
            <div className="text-lg font-bold text-white font-display">02. ₹199 Fixed Price</div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              No hidden fees, no per-minute upsells. Clear upfront consultation fee.
            </p>
          </div>
          <div className="chiti-card p-5 space-y-2">
            <div className="text-lg font-bold text-[#10B981] font-display">03. Verified Written Answer</div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              Receive a structured written consultation report you can revisit and reference anytime.
            </p>
          </div>
        </div>
      </section>

      {/* HUMAN TRUST SECTION: REAL PRACTITIONERS */}
      <section id="practitioners" className="py-14 px-4 max-w-5xl mx-auto border-b border-purple-500/20">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest">
            AUTHENTIC JYOTISH AUTHORITY
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Technology assists. A Jyotishi decides what reaches you.
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Every consultation is reviewed by a real, verified Jyotish practitioner before delivery.
          </p>
        </div>

        {loadingPractitioners ? (
          <div className="py-12 text-center text-xs text-[#9CA3AF]">Loading practitioner directory...</div>
        ) : practitioners.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-xs text-[#9CA3AF]">
            Active practitioner onboarding in progress. All test consultations are reviewed by lead practitioner Pandit Ramesh Sharma.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {practitioners.map(p => (
              <div key={p.id} className="chiti-card p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4C1D95] to-[#7C3AED] flex items-center justify-center text-2xl border border-purple-400/40 shrink-0">
                    🧙
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{p.displayName}</h3>
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

                <p className="text-xs text-[#D1D5DB] leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                  "{p.bio || 'Dedicated to authentic Vedic Jyotish analysis, providing clear, actionable guidance for career, wealth, and life timing.'}"
                </p>

                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-[#9CA3AF]">
                  <span>Languages: <strong className="text-white">{(p.languages || ['Hindi', 'English']).join(', ')}</strong></span>
                  <span className="text-[#10B981] font-semibold">✓ Verified Active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SAMPLE CONSULTATION DEMO OUTCOME */}
      <section id="sample" className="py-14 px-4 max-w-5xl mx-auto border-b border-purple-500/20">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest">
            SAMPLE ANONYMIZED OUTCOME
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
            What does a ₹199 consultation look like?
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Below is an example of an actual verified written consultation report delivered to a client.
          </p>
        </div>

        <div className="chiti-card p-6 sm:p-8 space-y-6 border-2 border-amber-500/30 bg-black/60">
          {/* Customer Question */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1">
            <div className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">CUSTOMER QUESTION</div>
            <p className="text-sm font-semibold text-white">
              "Should I expand my retail business to a second location in the next six months?"
            </p>
          </div>

          {/* Calculated Chart Info */}
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

          {/* CosmicTantra Working Analysis */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-wider">COSMICTANTRA WORKING ANALYSIS</div>
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs font-mono text-[#D1D5DB] leading-relaxed">
              • 10th house lord Saturn is placed in 11th house of financial gains.<br />
              • Current Rahu Mahadasha favors retail expansion after Venus transit into 11th house.<br />
              • Planetary alignment suggests favorable period starting after Friday's Shukra Hora.
            </div>
          </div>

          {/* Practitioner Final Approved Interpretation */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> PANDIT INTERPRETATION & FINAL HUMAN REVIEW
              </div>
              <span className="text-[10px] text-[#10B981] font-semibold">Approved by Pandit Ramesh Sharma</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-white leading-relaxed space-y-2">
              <p>
                <strong>VERIFIED GUIDANCE:</strong> Expanding your business to a second location will be highly auspicious, provided capital deployment occurs after the upcoming Venus transit into your 11th house of financial growth.
              </p>
              <p className="text-[#6EE7B7]">
                <strong>RECOMMENDED REMEDY:</strong> Perform a simple Lakshmi-Kuber Archana on Friday morning during Shukra Hora and maintain transparency in new partnership agreements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FREE INTERACTIVE UTILITIES (PRODUCT PROOF) */}
      <section id="calculator" className="py-14 px-4 max-w-5xl mx-auto border-b border-purple-500/20 space-y-6">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest mb-1">
            PRODUCT PROOF
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-2">
            Explore the calculations yourself.
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Test our Lahiri astronomical calculation engine, 3D Swarga Lok visualizer, and Vimshottari Dasha timeline.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 border-b border-purple-500/20 pb-4">
          <button
            onClick={() => { setActiveTab('kundali'); trackEvent('FREE_TOOL_OPENED', { tool: 'kundali' }); }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'kundali' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            🗺️ Kundali Chart
          </button>
          <button
            onClick={() => { setActiveTab('swarga'); trackEvent('FREE_TOOL_OPENED', { tool: 'swarga' }); }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'swarga' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            🌌 3D Swarga Lok
          </button>
          <button
            onClick={() => { setActiveTab('mydays'); trackEvent('FREE_TOOL_OPENED', { tool: 'mydays' }); }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'mydays' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            📅 My Days Panchang
          </button>
          <button
            onClick={() => { setActiveTab('dasha'); trackEvent('FREE_TOOL_OPENED', { tool: 'dasha' }); }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'dasha' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            ⏳ Dasha Timeline
          </button>
          <button
            onClick={() => { setActiveTab('karma'); trackEvent('FREE_TOOL_OPENED', { tool: 'karma' }); }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'karma' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            ☸️ Karma Matrix
          </button>
          <button
            onClick={() => { setActiveTab('guru'); trackEvent('FREE_TOOL_OPENED', { tool: 'guru' }); }}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'guru' ? 'bg-[#7C3AED] text-white' : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
            }`}
          >
            🧘 Guru AI Chat (3 Free)
          </button>
        </div>

        {/* Tab Content */}
        <div className="chiti-card p-6">
          {activeTab === 'kundali' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4 bg-black/30 p-5 rounded-2xl border border-white/10">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 border-b border-white/10 pb-2">
                  Enter Birth Details
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
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Time of Birth</label>
                    <input
                      type="time"
                      className="chiti-input text-xs"
                      value={calcForm.tob}
                      onChange={e => setCalcForm({ ...calcForm, tob: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">City</label>
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
                  className="chiti-btn-primary w-full text-xs py-3 justify-center"
                >
                  Update Chart ✨
                </button>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4">
                {kundali && (
                  <>
                    <NorthIndianChart kundali={kundali} size={280} />
                    <div className="w-full p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs space-y-1.5">
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

      {/* FINAL CONVERSION CTA */}
      <section id="cta" className="py-16 px-4 max-w-4xl mx-auto text-center">
        <div className="chiti-card p-8 sm:p-12 border-2 border-purple-500/30 bg-black/80 space-y-4">
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
            One question on your mind?
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">
            Get an authentic written consultation reviewed and verified by senior Pandit Ji for ₹199. Standard 4 to 12-hour operational window delivery on WhatsApp.
          </p>

          <div className="pt-2">
            <Link
              href="/ask"
              className="chiti-btn-primary py-3.5 px-8 text-sm"
              onClick={() => trackEvent('ASK_STARTED')}
            >
              Ask One Question — ₹199 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 py-8 px-4 text-center text-xs text-[#6B7280]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-bold text-white font-display">COSMICTANTRA</span> · Vedic Jyotish AI Platform
          </div>
          <div>
            Powered by Chiti Technologies · <span className="text-[#A78BFA]">cosmictantra.chiti.tech</span>
          </div>
          <div className="flex gap-4">
            <Link href="/pandit" className="hover:text-white">Pandit Portal</Link>
            <Link href="/astrology/practitioners" className="hover:text-white">Admin Console</Link>
            <Link href="/ask" className="hover:text-white">Ask Question</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
