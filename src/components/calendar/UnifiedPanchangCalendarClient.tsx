'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Sun, Moon, Calendar, Clock, Sparkles, Compass, MapPin, 
  ChevronRight, ShieldCheck, ArrowRight, Share2, AlertTriangle, 
  Star, CheckCircle, Info, ChevronLeft
} from 'lucide-react';
import { useActiveLocation } from '@/lib/location/useActiveLocation';
import { persistActiveLocation } from '@/lib/location/activeLocation';
import { calculatePanchang } from '@/lib/panchang';
import { CITIES } from '@/lib/cities';
import { playTick } from '@/lib/chitiAudio';
import AuraMonthlyCalendar from '@/components/calendar/AuraMonthlyCalendar';

export const MAJOR_CITIES = [
  { id: 'varanasi', name: 'Varanasi', nameHi: 'वाराणसी', lat: 25.3176, lng: 82.9739, tz: 5.5 },
  { id: 'delhi', name: 'New Delhi', nameHi: 'नई दिल्ली', lat: 28.6139, lng: 77.2090, tz: 5.5 },
  { id: 'mumbai', name: 'Mumbai', nameHi: 'मुम्बई', lat: 19.0760, lng: 72.8777, tz: 5.5 },
  { id: 'bengaluru', name: 'Bengaluru', nameHi: 'बेंगलुरु', lat: 12.9716, lng: 77.5946, tz: 5.5 },
  { id: 'kolkata', name: 'Kolkata', nameHi: 'कोलकाता', lat: 22.5726, lng: 88.3639, tz: 5.5 },
  { id: 'chennai', name: 'Chennai', nameHi: 'चेन्नई', lat: 13.0827, lng: 80.2707, tz: 5.5 },
  { id: 'patna', name: 'Patna', nameHi: 'पटना', lat: 25.5941, lng: 85.1376, tz: 5.5 },
  { id: 'jaipur', name: 'Jaipur', nameHi: 'जयपुर', lat: 26.9124, lng: 75.7873, tz: 5.5 },
  { id: 'london', name: 'London', nameHi: 'लन्दन', lat: 51.5074, lng: -0.1278, tz: 0 },
  { id: 'new-york', name: 'New York', nameHi: 'न्यूयॉर्क', lat: 40.7128, lng: -74.0060, tz: -5 },
];

interface UnifiedPanchangCalendarClientProps {
  defaultView?: 'today' | 'month';
}

function UnifiedPanchangCalendarClientInner({ defaultView = 'month' }: UnifiedPanchangCalendarClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Resolve view from query param (?view=today or ?view=month) with fallback to defaultView
  const urlView = searchParams.get('view');
  const initialView = urlView === 'today' || urlView === 'month' ? urlView : defaultView;
  const [view, setView] = useState<'today' | 'month'>(initialView);

  // Sync state if URL query changes
  useEffect(() => {
    if (urlView === 'today' || urlView === 'month') {
      setView(urlView);
    }
  }, [urlView]);

  const handleSwitchView = (newView: 'today' | 'month') => {
    playTick();
    setView(newView);
    // Update URL query smoothly without full page refresh
    const params = new URLSearchParams(window.location.search);
    params.set('view', newView);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  };

  const { location } = useActiveLocation();

  // Active City Resolution: Use global active location or default to Varanasi (Prime Meridian of Siddhanta)
  const activeCity = useMemo(() => {
    if (location.status === 'KNOWN' && location.lat !== null && location.lng !== null) {
      return {
        name: location.name,
        nameHi: location.nameHi || location.name,
        lat: location.lat,
        lng: location.lng,
        tz: location.tz ?? 5.5,
      };
    }
    return MAJOR_CITIES[0]; // Varanasi fallback
  }, [location]);

  const now = new Date();
  const panchang = useMemo(() => {
    return calculatePanchang(now, {
      lat: activeCity.lat,
      lng: activeCity.lng,
      tz: activeCity.tz,
      name: activeCity.name,
    });
  }, [now, activeCity]);

  // Today's Panchang details extraction
  const tithiName = typeof panchang.tithi === 'object' ? (panchang.tithi as any)?.name || (panchang.tithi as any)?.fullName : (panchang.tithi || 'Shukla Navami');
  const nakshatraName = typeof panchang.nakshatra === 'object' ? (panchang.nakshatra as any)?.name : (panchang.nakshatra || 'Hasta');
  const nakshatraPada = typeof panchang.nakshatra === 'object' ? (panchang.nakshatra as any)?.pada ?? 1 : 1;
  const yogaName = typeof panchang.yoga === 'object' ? (panchang.yoga as any)?.name : (panchang.yoga || 'Siddhi');
  const karanaName = typeof panchang.karana === 'object' ? (panchang.karana as any)?.name : (panchang.karana || 'Bava');

  // Solar Arc / Daylight Progress calculation
  const sunProgress = useMemo(() => {
    if (panchang.sun?.sunriseDate && panchang.sun?.sunsetDate) {
      const srMs = new Date(panchang.sun.sunriseDate).getTime();
      const ssMs = new Date(panchang.sun.sunsetDate).getTime();
      const nowMs = now.getTime();

      if (nowMs < srMs) return { pct: 0, isDay: false, phase: 'ब्रह्म मुहूर्त (Pre-Dawn)' };
      if (nowMs > ssMs) return { pct: 100, isDay: false, phase: 'निशीथ काल (Night / Post-Dusk)' };
      
      const pct = Math.min(100, Math.max(0, Math.round(((nowMs - srMs) / (ssMs - srMs)) * 100)));
      return { pct, isDay: true, phase: 'दिवा काल (Daylight Active)' };
    }
    return { pct: 50, isDay: true, phase: 'दिवा काल (Daylight Active)' };
  }, [now, panchang.sun]);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. TOP HEADER & SACRED LENS SWITCHER */}
      <div className="text-center space-y-4 max-w-4xl mx-auto">
        
        {/* Sacred Ephemeris Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 text-[#8E6F1D] dark:text-[#F0C968] text-xs font-mono-data font-bold uppercase tracking-[2px] shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>कालचक्र • VEDIC CHRONOMETRY & EPHEMERIS</span>
        </div>

        {/* Dynamic Title based on Active View */}
        <h1 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-tight leading-tight">
          {view === 'today' ? (
            <>
              आज का वैदिक पञ्चाङ्ग
              <span className="block text-xl sm:text-3xl text-[#8E6F1D] dark:text-[#F0C968] font-normal mt-1 font-sans">
                Today's Vedic Ephemeris & Auspicious Timings
              </span>
            </>
          ) : (
            <>
              मासिक वैदिक पञ्चाङ्ग कैलेण्डर
              <span className="block text-xl sm:text-3xl text-[#8E6F1D] dark:text-[#F0C968] font-normal mt-1 font-sans">
                Monthly Vedic Calendar & Personal Energy Matrix
              </span>
            </>
          )}
        </h1>

        {/* Subtitle with Active Location Context */}
        <p className="text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF] max-w-2xl mx-auto leading-relaxed">
          स्थान: <strong className="text-[#1C1917] dark:text-white">{activeCity.name}</strong> ({activeCity.lat.toFixed(2)}°N, {activeCity.lng.toFixed(2)}°E) · {now.toLocaleDateString('hi-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* 2. THE TACTILE DUAL-LENS SWITCHER */}
        <div className="pt-2">
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-[#EFECE6] dark:bg-[#161828] border border-black/10 dark:border-white/10 shadow-inner max-w-md w-full">
            <button
              type="button"
              onClick={() => handleSwitchView('today')}
              data-testid="tab-view-today"
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-mono-data font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                view === 'today'
                  ? 'bg-white dark:bg-[#0E101D] text-[#8E6F1D] dark:text-[#F0C968] shadow-md border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 ring-1 ring-[#8E6F1D]/20 scale-102 font-extrabold'
                  : 'text-[#696256] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-white'
              }`}
            >
              <Sun className={`w-4 h-4 ${view === 'today' ? 'text-[#8E6F1D] dark:text-[#F0C968]' : 'text-current'}`} />
              <span>☀️ आज का पञ्चाङ्ग</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchView('month')}
              data-testid="tab-view-month"
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-mono-data font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                view === 'month'
                  ? 'bg-white dark:bg-[#0E101D] text-[#8E6F1D] dark:text-[#F0C968] shadow-md border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 ring-1 ring-[#8E6F1D]/20 scale-102 font-extrabold'
                  : 'text-[#696256] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-white'
              }`}
            >
              <Calendar className={`w-4 h-4 ${view === 'month' ? 'text-[#8E6F1D] dark:text-[#F0C968]' : 'text-current'}`} />
              <span>📅 मासिक कैलेण्डर</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONDITIONAL VIEW CONTAINER */}
      {view === 'today' ? (
        /* TODAY'S PANCHANG DEEP DIVE */
        <div className="space-y-8 animate-fadeIn">
          
          {/* Sacred City & Vikram Samvat Summary Banner */}
          <div className="relative rounded-3xl p-6 sm:p-8 border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 bg-white dark:bg-[#101221] shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-rose-500/5 to-transparent rounded-full pointer-events-none blur-2xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-1">
                <div className="text-[11px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] tracking-widest uppercase">
                  सिद्धान्त गणितीय पञ्चाङ्ग • Siddhanta Astronomical Math
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-white">
                  {now.toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="text-xs text-[#57524A] dark:text-[#A8A29E] font-mono-data">
                  सूर्योदय कालीन तिथि व नक्षत्र गणना · मानक समय (IST)
                </div>
              </div>

              {/* Samvat & Quick Milan / Kundli Links */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#161828] border border-[#8E6F1D]/20 dark:border-[#D4AF37]/25 text-center">
                  <div className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">
                    संवत्सर
                  </div>
                  <div className="text-sm font-bold text-[#1C1917] dark:text-white">
                    विक्रम संवत् २०८३
                  </div>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#161828] border border-[#8E6F1D]/20 dark:border-[#D4AF37]/25 text-center">
                  <div className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">
                    शक संवत्
                  </div>
                  <div className="text-sm font-bold text-[#1C1917] dark:text-white">
                    १९४८ (Shaka 1948)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSwitchView('month')}
                  className="px-4 py-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#161828] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#060709] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>पूरा मास देखें →</span>
                </button>
              </div>
            </div>

            {/* Quick City Selector Rails */}
            <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/5">
              <div className="text-[11px] font-mono-data uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold mb-2.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#F0C968]" />
                <span>स्थान बदलें (Change City for Local Sunrise & Muhurat):</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {MAJOR_CITIES.map((c) => {
                  const isSelected = activeCity.name.toLowerCase().includes(c.name.toLowerCase());
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        playTick();
                        persistActiveLocation(c);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all shrink-0 cursor-pointer border ${
                        isSelected
                          ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black border-[#8E6F1D] dark:border-[#D4AF37] shadow-sm'
                          : 'bg-[#FAF7F2] dark:bg-[#161828] text-[#57524A] dark:text-[#A8A29E] border-[#E5D7BC] dark:border-white/10 hover:border-[#8E6F1D]/50 hover:text-[#1C1917] dark:hover:text-white'
                      }`}
                    >
                      {c.nameHi} ({c.name})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Sun Arc & Daylight Gauge */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#101221] border border-[#8E6F1D]/20 dark:border-[#D4AF37]/25 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                <h3 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-white">
                  दिवा-निशि चक्र • Solar Arc & Daylight Progress
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                {sunProgress.phase} · {sunProgress.pct}% दिन व्यतीत
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3.5 rounded-full bg-[#EFECE6] dark:bg-[#1C1F33] overflow-hidden p-0.5 border border-black/5 dark:border-white/5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-[#8E6F1D] dark:to-[#D4AF37] transition-all duration-500 shadow-sm"
                  style={{ width: `${sunProgress.pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                <span>🌅 सूर्योदय: {panchang.sun?.sunrise || '05:45'}</span>
                <span>☀️ मध्याह्न: 12:08</span>
                <span>🌇 सूर्यास्त: {panchang.sun?.sunset || '18:20'}</span>
              </div>
            </div>
          </div>

          {/* The Five Core Limbs of Panchang (पञ्च-अङ्ग) */}
          <div className="space-y-4">
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white flex items-center gap-2">
              <span>✨</span>
              <span>पञ्चाङ्ग के पाँच मुख्य अङ्ग (The Five Sacred Limbs)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 1. Tithi */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#101221] border border-[#8E6F1D]/20 dark:border-white/10 shadow-sm space-y-2 hover:border-[#8E6F1D]/50 transition-all">
                <div className="text-[10px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
                  १. तिथि (Tithi)
                </div>
                <div className="text-lg font-bold text-[#1C1917] dark:text-white">
                  {tithiName}
                </div>
                <div className="text-xs text-[#78716C] dark:text-[#A8A29E] font-mono-data">
                  चन्द्र-सूर्य कोणीय दूरी (12°)
                </div>
              </div>

              {/* 2. Vaar */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#101221] border border-[#8E6F1D]/20 dark:border-white/10 shadow-sm space-y-2 hover:border-[#8E6F1D]/50 transition-all">
                <div className="text-[10px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
                  २. वार (Weekday)
                </div>
                <div className="text-lg font-bold text-[#1C1917] dark:text-white">
                  {now.toLocaleDateString('hi-IN', { weekday: 'long' })}
                </div>
                <div className="text-xs text-[#78716C] dark:text-[#A8A29E] font-mono-data">
                  सूर्योदय से अहोरात्र
                </div>
              </div>

              {/* 3. Nakshatra */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#101221] border border-[#8E6F1D]/20 dark:border-white/10 shadow-sm space-y-2 hover:border-[#8E6F1D]/50 transition-all">
                <div className="text-[10px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
                  ३. नक्षत्र (Nakshatra)
                </div>
                <div className="text-lg font-bold text-[#1C1917] dark:text-white">
                  {nakshatraName}
                </div>
                <div className="text-xs text-[#78716C] dark:text-[#A8A29E] font-mono-data">
                  चरण {nakshatraPada} · चन्द्र स्थिति
                </div>
              </div>

              {/* 4. Yoga */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#101221] border border-[#8E6F1D]/20 dark:border-white/10 shadow-sm space-y-2 hover:border-[#8E6F1D]/50 transition-all">
                <div className="text-[10px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
                  ४. योग (Yoga)
                </div>
                <div className="text-lg font-bold text-[#1C1917] dark:text-white">
                  {yogaName}
                </div>
                <div className="text-xs text-[#78716C] dark:text-[#A8A29E] font-mono-data">
                  सूर्य + चन्द्र भोगांश योग
                </div>
              </div>

              {/* 5. Karana */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#101221] border border-[#8E6F1D]/20 dark:border-white/10 shadow-sm space-y-2 hover:border-[#8E6F1D]/50 transition-all">
                <div className="text-[10px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
                  ५. करण (Karana)
                </div>
                <div className="text-lg font-bold text-[#1C1917] dark:text-white">
                  {karanaName}
                </div>
                <div className="text-xs text-[#78716C] dark:text-[#A8A29E] font-mono-data">
                  तिथि का अर्धभाग (6°)
                </div>
              </div>
            </div>
          </div>

          {/* Shubh Muhurat vs Ashubh Timings Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Shubh (Auspicious) Timings */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#101221] border border-emerald-500/30 dark:border-emerald-500/25 shadow-sm space-y-4">
              <h3 className="font-editorial text-xl font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>शुभ मुहूर्त (Auspicious Timings)</span>
              </h3>

              <div className="space-y-3 font-mono-data text-xs">
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#1C1917] dark:text-white">अभिजित मुहूर्त (Abhijit Muhurat)</div>
                    <div className="text-[11px] text-[#57524A] dark:text-[#A8A29E]">सर्वकार्य सिद्धिदायक स्वर्ण वेला</div>
                  </div>
                  <div className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                    {panchang.timings?.abhijitMuhurat || '11:45 AM – 12:35 PM'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#1C1917] dark:text-white">ब्रह्म मुहूर्त (Brahma Muhurat)</div>
                    <div className="text-[11px] text-[#57524A] dark:text-[#A8A29E]">ध्यान व मन्त्र साधना हेतु श्रेष्ठ</div>
                  </div>
                  <div className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                    {panchang.timings?.brahmaMuhurat || '04:15 AM – 05:01 AM'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#1C1917] dark:text-white">अमृत काल (Amrit Kaal)</div>
                    <div className="text-[11px] text-[#57524A] dark:text-[#A8A29E]">शुभ शुभारम्भ व यात्रा</div>
                  </div>
                  <div className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                    02:10 PM – 03:42 PM
                  </div>
                </div>
              </div>
            </div>

            {/* Ashubh (Inauspicious) Timings */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#101221] border border-rose-500/30 dark:border-rose-500/25 shadow-sm space-y-4">
              <h3 className="font-editorial text-xl font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <span>अशुभ काल (Inauspicious Windows - Avoid New Starts)</span>
              </h3>

              <div className="space-y-3 font-mono-data text-xs">
                <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#1C1917] dark:text-white">राहु काल (Rahu Kalam)</div>
                    <div className="text-[11px] text-[#57524A] dark:text-[#A8A29E]">महत्त्वपूर्ण कार्य व निवेश वर्जित</div>
                  </div>
                  <div className="font-bold text-sm text-rose-700 dark:text-rose-300">
                    {panchang.timings?.rahuKalam || '01:30 PM – 03:00 PM'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#1C1917] dark:text-white">यमगण्ड (Yamaganda)</div>
                    <div className="text-[11px] text-[#57524A] dark:text-[#A8A29E]">अनिष्टकारी वेला</div>
                  </div>
                  <div className="font-bold text-sm text-rose-700 dark:text-rose-300">
                    {panchang.timings?.yamaganda || '06:00 AM – 07:30 AM'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-500/20 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#1C1917] dark:text-white">गुलिक काल (Gulika Kaal)</div>
                    <div className="text-[11px] text-[#57524A] dark:text-[#A8A29E]">शनि पुत्र गुलिक वेला</div>
                  </div>
                  <div className="font-bold text-sm text-rose-700 dark:text-rose-300">
                    {panchang.timings?.gulikaKalam || '09:00 AM – 10:30 AM'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Switcher CTA: Explore Monthly Calendar */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#8E6F1D]/10 via-amber-500/5 to-[#8E6F1D]/15 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono-data font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">
                <Calendar className="w-4 h-4" />
                <span>मासिक दृश्यावलोकन • FULL 30-DAY CALENDAR MATRIX</span>
              </div>
              <h4 className="font-editorial text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-white">
                इस माह के प्रमुख व्रत, पर्व व एकादशी तिथियां देखें
              </h4>
              <p className="text-xs font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
                Explore Power Days, Caution Days, Ekadashi, Purnima, Amavasya, and Tara Bala across the entire month.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSwitchView('month')}
              className="px-6 py-3 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] text-xs font-mono-data font-bold tracking-wider uppercase shadow-md hover:scale-102 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>मासिक कैलेण्डर खोलें</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      ) : (
        /* MONTHLY CALENDAR GRID */
        <div className="space-y-8 animate-fadeIn">
          
          {/* Quick Bar to switch back to Today */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#101221]/80 backdrop-blur-md border border-[#8E6F1D]/20 dark:border-[#D4AF37]/25 shadow-sm">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
                आज की तिथि व तात्कालिक मुहूर्त देखना चाहते हैं?
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSwitchView('today')}
              className="px-3.5 py-1.5 rounded-xl bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#060709] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>☀️ आज का पञ्चाङ्ग</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Aura Monthly Calendar Component with onSwitchToToday callback */}
          <AuraMonthlyCalendar onSwitchToToday={() => handleSwitchView('today')} />
        </div>
      )}

    </div>
  );
}

export default function UnifiedPanchangCalendarClient({ defaultView = 'month' }: UnifiedPanchangCalendarClientProps) {
  return (
    <Suspense fallback={
      <div className="py-16 text-center space-y-3 font-mono-data text-xs text-[#78716C]">
        <div className="animate-spin w-8 h-8 border-2 border-[#8E6F1D] border-t-transparent rounded-full mx-auto" />
        <p>लोड हो रहा है... Loading Vedic Ephemeris & Chronometry Matrix</p>
      </div>
    }>
      <UnifiedPanchangCalendarClientInner defaultView={defaultView} />
    </Suspense>
  );
}
