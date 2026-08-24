'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Clock, MessageSquare, ArrowRight, Compass, Sun, Moon, Calendar, MapPin, CheckCircle2, Award, Users, FileText, ChevronRight } from 'lucide-react';
import { calculateKundali } from '@/engines/astrologyEngine.js';
import { calculateVimshottariDasha, getCurrentDasha } from '@/engines/dashaEngine.js';
import { calculatePanchang } from '@/engines/panchang.js';
import NorthIndianChart from '@/components/NorthIndianChart.jsx';

export default function PublicLandingPage() {
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
  const [currentDasha, setCurrentDasha] = useState<any>(null);

  useEffect(() => {
    // Initial Panchang calculation
    const today = calculatePanchang(new Date(), 25.5941, 85.1376, 5.5);
    setPanchang(today);

    // Initial Kundali preview
    handleCalculateKundali();
  }, []);

  const handleCalculateKundali = () => {
    try {
      const k = calculateKundali(calcForm.dob, calcForm.tob, calcForm.lat, calcForm.lon, calcForm.tz);
      const dashas = calculateVimshottariDasha(k.planets.Moon.nakshatra, new Date(calcForm.dob));
      const curDasha = getCurrentDasha(dashas, new Date());
      setKundali(k);
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
            <Link href="#panchang" className="hidden sm:inline-block text-[#9CA3AF] hover:text-white transition-colors">
              Daily Panchang
            </Link>
            <Link href="#calculator" className="hidden sm:inline-block text-[#9CA3AF] hover:text-white transition-colors">
              Free Kundali
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
      <section className="relative py-16 sm:py-24 px-4 overflow-hidden text-center">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C3AED]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-[#F59E0B]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
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

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link href="/ask" className="chiti-btn-primary py-3.5 px-8 text-sm w-full sm:w-auto shadow-[0_0_30px_rgba(124,58,237,0.4)]">
              Ask 1 Question — ₹199 <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#calculator" className="chiti-btn-secondary py-3.5 px-8 text-sm w-full sm:w-auto">
              Preview Your Natal Chart
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-10 border-t border-purple-500/20 text-xs text-[#9CA3AF]">
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" /> 100% Pandit Verified
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-[#F59E0B]" /> 4-12 Hr WhatsApp SLA
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Compass className="w-4 h-4 text-[#7C3AED]" /> Lahiri Ayanamsha
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <FileText className="w-4 h-4 text-white" /> Complete Auditability
            </div>
          </div>
        </div>
      </section>

      {/* Live Panchang Section */}
      <section id="panchang" className="py-12 px-4 max-w-5xl mx-auto">
        <div className="chiti-card p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-purple-500/20 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B] uppercase tracking-wider">
                <Sun className="w-4 h-4" /> Real-Time Vedic Astronomy
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
                Today's Daily Panchang
              </h2>
            </div>
            <span className="text-xs text-[#9CA3AF] bg-black/40 px-3 py-1 rounded-full border border-white/10">
              Location: Patna (25.59°N, 85.14°E)
            </span>
          </div>

          {panchang && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
                <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Tithi</span>
                <span className="font-bold text-white text-sm">{panchang.tithi?.name}</span>
                <span className="text-[10px] text-[#A78BFA] block mt-0.5">{panchang.tithi?.paksha}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
                <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Nakshatra</span>
                <span className="font-bold text-[#F59E0B] text-sm">{panchang.nakshatra?.name}</span>
                <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Pada {panchang.nakshatra?.pada}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
                <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Yoga & Vara</span>
                <span className="font-bold text-white text-sm">{panchang.yoga?.name}</span>
                <span className="text-[10px] text-[#10B981] block mt-0.5">{panchang.vara?.day} ({panchang.vara?.planet})</span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/30">
                <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Rahu Kala Window</span>
                <span className="font-bold text-[#F59E0B] text-sm">{panchang.rahuKala?.start} – {panchang.rahuKala?.end}</span>
                <span className="text-[10px] text-[#6B7280] block mt-0.5">Avoid major new starts</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live Interactive Kundali Calculator Section */}
      <section id="calculator" className="py-12 px-4 max-w-5xl mx-auto">
        <div className="chiti-card p-6 sm:p-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] uppercase tracking-widest mb-2">
              <Compass className="w-4 h-4" /> Instant Chart Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-2">
              Free Vedic Kundali Preview
            </h2>
            <p className="text-xs sm:text-sm text-[#9CA3AF]">
              Enter your birth details to generate your exact North Indian natal chart and active Vimshottari Dasha instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Input Form */}
            <div className="space-y-4 bg-black/30 p-6 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
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
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">City / Location</label>
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
                Calculate Kundali Chart ✨
              </button>
            </div>

            {/* Visualizer & Summary */}
            <div className="flex flex-col items-center justify-center space-y-4">
              {kundali ? (
                <>
                  <NorthIndianChart kundali={kundali} size={290} />

                  <div className="w-full p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs space-y-2">
                    <div className="flex justify-between border-b border-purple-500/10 pb-1.5">
                      <span className="text-[#9CA3AF]">Ascendant (Lagna):</span>
                      <span className="font-bold text-[#F59E0B]">{kundali.lagna?.rasiName} ({kundali.lagna?.nakshatra?.name})</span>
                    </div>
                    <div className="flex justify-between border-b border-purple-500/10 pb-1.5">
                      <span className="text-[#9CA3AF]">Moon Sign & Nakshatra:</span>
                      <span className="font-bold text-white">{kundali.planets?.Moon?.rasiName} ({kundali.planets?.Moon?.nakshatra?.name})</span>
                    </div>
                    {currentDasha && (
                      <div className="flex justify-between">
                        <span className="text-[#9CA3AF]">Active Mahadasha:</span>
                        <span className="font-bold text-[#A78BFA]">{currentDasha.planet} Dasha ({currentDasha.percentDone}%)</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-[#6B7280] text-xs">
                  Chart preview will render here on calculation.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Verified Practitioners Showcase Section */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-2">
            <Award className="w-4 h-4" /> Verified Vedic Experts
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-2">
            Meet Our Senior Practitioners
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF]">
            Every consultation is assigned to a verified practitioner who reviews the calculation snapshot and AI draft before certifying the final interpretation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="chiti-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4C1D95] to-[#7C3AED] flex items-center justify-center text-3xl border border-purple-400/40">
                🧙
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pandit Ramesh Sharma</h3>
                <p className="text-xs text-[#F59E0B] font-semibold">Parashari Jyotish & Prashna</p>
                <p className="text-xs text-[#9CA3AF] mt-1">28 years exp · Varanasi, India</p>
              </div>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                Master in Kundali analysis and classical remedies. Renowned for precise career and financial timing guidance.
              </p>
            </div>
            <div className="pt-4 border-t border-white/10 mt-4 flex justify-between items-center text-xs">
              <span className="text-[#10B981] font-bold">✓ Verified Active</span>
              <span className="text-[#FBBF24]">★ 4.9 (312 reviews)</span>
            </div>
          </div>

          <div className="chiti-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4C1D95] to-[#7C3AED] flex items-center justify-center text-3xl border border-purple-400/40">
                👩‍🔬
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Dr. Meenakshi Iyer</h3>
                <p className="text-xs text-[#F59E0B] font-semibold">Marriage & Compatibility</p>
                <p className="text-xs text-[#9CA3AF] mt-1">15 years exp · Chennai, India</p>
              </div>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                PhD in Vedic Mathematics. Specialist in Ashtakoot compatibility timing and relationship remedies.
              </p>
            </div>
            <div className="pt-4 border-t border-white/10 mt-4 flex justify-between items-center text-xs">
              <span className="text-[#10B981] font-bold">✓ Verified Active</span>
              <span className="text-[#FBBF24]">★ 4.8 (187 reviews)</span>
            </div>
          </div>

          <div className="chiti-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4C1D95] to-[#7C3AED] flex items-center justify-center text-3xl border border-purple-400/40">
                🕉️
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Acharya Vijay Gupta</h3>
                <p className="text-xs text-[#F59E0B] font-semibold">Karma & Remedial Jyotish</p>
                <p className="text-xs text-[#9CA3AF] mt-1">22 years exp · Delhi, India</p>
              </div>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                Specializes in resolving karmic blockages through customized Vedic pujas, mantras, and practical remedies.
              </p>
            </div>
            <div className="pt-4 border-t border-white/10 mt-4 flex justify-between items-center text-xs">
              <span className="text-[#10B981] font-bold">✓ Verified Active</span>
              <span className="text-[#FBBF24]">★ 4.7 (429 reviews)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-16 px-4 max-w-4xl mx-auto text-center">
        <div className="chiti-card p-8 sm:p-12 relative overflow-hidden bg-gradient-to-br from-purple-950/60 via-[#0D0A1E] to-black border-2 border-[#7C3AED]/40 shadow-[0_0_50px_rgba(124,58,237,0.2)]">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 bg-[#7C3AED]/20 border border-[#7C3AED] rounded-full flex items-center justify-center mx-auto text-2xl">
              ✨
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
              Ready to Ask Your Question?
            </h2>
            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
              Get an authentic 1-on-1 written astrological consultation reviewed and verified by senior Pandit Ji for ₹199. Delivered directly to your WhatsApp in 4–12 hours.
            </p>
            <div className="pt-4">
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
