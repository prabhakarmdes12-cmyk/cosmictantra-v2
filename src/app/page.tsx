'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Clock, MessageSquare, ArrowRight, Compass, Sun, Moon, Calendar, MapPin, CheckCircle2, Award, Users, FileText, ChevronRight } from 'lucide-react';
import { calculateKundali } from '@/engines/astrologyEngine.js';
import { calculateVimshottariDasha, getCurrentDasha } from '@/engines/dashaEngine.js';
import { calculatePanchang } from '@/engines/panchang.js';
import NorthIndianChart from '@/components/NorthIndianChart.jsx';
import SwargaLok from '@/components/SwargaLok.jsx';
import KarmaWheel from '@/components/KarmaWheel.tsx';
import DestinyTimeline from '@/components/DestinyTimeline.tsx';
import ChatBox from '@/components/ChatBox.tsx';
import MyDaysPanchang from '@/components/MyDaysPanchang.tsx';

export default function PublicLandingPage() {
  const [activeTab, setActiveTab] = useState<'kundali' | 'swarga' | 'dasha' | 'karma' | 'mydays' | 'guru'>('kundali');
  const [panchang, setPanchang] = useState<any>(null);
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
    const today = calculatePanchang(new Date(), 25.5941, 85.1376, 5.5);
    setPanchang(today);
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
      console.error('Kundali preview calculation error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#030108] text-[#E2D9F3] font-body selection:bg-[#7C3AED] selection:text-white">
      {/* Top Atmospheric Subdomain Navigation */}
      <nav className="border-b border-purple-500/20 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕉️</span>
            <div>
              <span className="font-display text-lg font-bold text-white tracking-wider">COSMICTANTRA</span>
              <span className="hidden sm:inline-block text-[10px] text-[#A78BFA] ml-2 font-mono bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">
                cosmictantra.chiti.tech
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <Link href="#interactive" className="hidden sm:inline-block text-[#9CA3AF] hover:text-white transition-colors">
              Free Utilities
            </Link>
            <Link href="/pandit" className="text-[#A78BFA] hover:text-white transition-colors px-2.5 py-1 rounded bg-purple-950/40 border border-purple-500/20">
              Pandit Portal
            </Link>
            <Link href="/astrology/practitioners" className="text-[#9CA3AF] hover:text-white transition-colors px-2.5 py-1 rounded bg-white/5 border border-white/10">
              Admin Workspace
            </Link>
            <Link href="/ask" className="chiti-btn-primary py-2 px-4 text-xs">
              Ask Question — ₹199
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-14 sm:py-20 px-4 overflow-hidden text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C3AED]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/60 border border-[#7C3AED]/40 text-[#A78BFA] text-xs font-semibold uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" /> Technology-Assisted Vedic Jyotish Engine
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold font-display text-white tracking-tight leading-tight">
            Vedic Precision.<br />
            <span className="bg-gradient-to-r from-[#F59E0B] via-[#E2D9F3] to-[#7C3AED] bg-clip-text text-transparent">
              Human Wisdom.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed">
            Exact Lahiri planetary longitudes calculated by CosmicTantra engine, verified and interpreted by authentic Vedic Jyotish practitioners.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
            <Link href="/ask" className="chiti-btn-primary py-3.5 px-8 text-sm w-full sm:w-auto shadow-[0_0_30px_rgba(124,58,237,0.4)]">
              Ask 1 Question — ₹199 <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#interactive" className="chiti-btn-secondary py-3.5 px-8 text-sm w-full sm:w-auto">
              Explore Free Cosmic Tools
            </a>
          </div>
        </div>
      </section>

      {/* Main V34 Interactive Cosmic Utilities Suite */}
      <section id="interactive" className="py-12 px-4 max-w-5xl mx-auto space-y-6">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] uppercase tracking-widest mb-2">
            <Compass className="w-4 h-4" /> V34 Interactive Cosmic Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-2">
            Free Vedic Utilities
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Explore your natal Kundali, 3D Swarga Lok orbit visualizer, My Days Panchang calendar, Vimshottari Dasha timeline, and AI Guru chat.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 border-b border-purple-500/20 pb-4">
          <button
            onClick={() => setActiveTab('kundali')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'kundali'
                ? 'bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                : 'bg-white/5 border border-white/10 text-[#9CA3AF] hover:text-white'
            }`}
          >
            🗺️ Kundali Chart
          </button>
          <button
            onClick={() => setActiveTab('swarga')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'swarga'
                ? 'bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                : 'bg-white/5 border border-white/10 text-[#9CA3AF] hover:text-white'
            }`}
          >
            🌌 3D Swarga Lok
          </button>
          <button
            onClick={() => setActiveTab('mydays')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'mydays'
                ? 'bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                : 'bg-white/5 border border-white/10 text-[#9CA3AF] hover:text-white'
            }`}
          >
            📅 My Days Panchang
          </button>
          <button
            onClick={() => setActiveTab('dasha')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'dasha'
                ? 'bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                : 'bg-white/5 border border-white/10 text-[#9CA3AF] hover:text-white'
            }`}
          >
            ⏳ Dasha Timeline
          </button>
          <button
            onClick={() => setActiveTab('karma')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'karma'
                ? 'bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                : 'bg-white/5 border border-white/10 text-[#9CA3AF] hover:text-white'
            }`}
          >
            ☸️ Karma Matrix
          </button>
          <button
            onClick={() => setActiveTab('guru')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'guru'
                ? 'bg-[#7C3AED] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                : 'bg-white/5 border border-white/10 text-[#9CA3AF] hover:text-white'
            }`}
          >
            🧘 Guru AI Chat (3 Free)
          </button>
        </div>

        {/* Tab Content Display */}
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

      {/* Call To Action Banner */}
      <section className="py-14 px-4 max-w-4xl mx-auto text-center">
        <div className="chiti-card p-8 sm:p-12 relative overflow-hidden bg-gradient-to-br from-purple-950/60 via-[#0D0A1E] to-black border-2 border-[#7C3AED]/40 shadow-[0_0_50px_rgba(124,58,237,0.2)]">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 bg-[#7C3AED]/20 border border-[#7C3AED] rounded-full flex items-center justify-center mx-auto text-2xl">
              ✨
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
              Ready for Verified Personal Guidance?
            </h2>
            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
              Get an authentic written astrological consultation reviewed and verified by senior Pandit Ji for ₹199. Delivered directly to your WhatsApp in 4–12 hours.
            </p>
            <div className="pt-2">
              <Link href="/ask" className="chiti-btn-primary py-3.5 px-8 text-sm shadow-[0_0_30px_rgba(124,58,237,0.5)]">
                Ask One Question — ₹199 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
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
