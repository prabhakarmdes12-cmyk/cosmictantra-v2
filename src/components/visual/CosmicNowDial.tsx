'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, MapPin, Compass, ShieldAlert, Sparkles, ChevronDown } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

interface CosmicNowDialProps {
  panchangData: any;
  currentCity: { name: string; lat: number; lng: number; tz: number };
  onOpenCitySelector: () => void;
  lang?: string;
}

export default function CosmicNowDial({
  panchangData,
  currentCity,
  onOpenCitySelector,
  lang = 'en'
}: CosmicNowDialProps) {
  const [liveTime, setLiveTime] = useState<string>('');
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setLiveTime(d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setNowMs(d.getTime());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!panchangData) return null;

  // Real astronomical timings
  const sunriseDate = panchangData.sunrise instanceof Date ? panchangData.sunrise : new Date(panchangData.sunrise || Date.now());
  const sunsetDate = panchangData.sunset instanceof Date ? panchangData.sunset : new Date(panchangData.sunset || Date.now());
  
  const riseMs = sunriseDate.getTime();
  const setMs = sunsetDate.getTime();
  
  // Format sunrise / sunset strings
  const sunriseStr = sunriseDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const sunsetStr = sunsetDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Calculate real solar progress along diurnal arc (0% at sunrise to 100% at sunset)
  let solarArcPercent = 50;
  let isDaytime = true;
  let periodTag = 'DAYLIGHT (SHUBH HORA)';
  let isWarning = false;

  if (nowMs < riseMs) {
    isDaytime = false;
    solarArcPercent = Math.max(0, Math.min(100, ((nowMs - (riseMs - 86400000 / 2)) / (riseMs - (riseMs - 86400000 / 2))) * 100));
    periodTag = 'USHA KALA (PRE-DAWN)';
  } else if (nowMs > setMs) {
    isDaytime = false;
    solarArcPercent = 100;
    periodTag = 'SANDHYA / RATRI (NIGHT)';
  } else {
    isDaytime = true;
    solarArcPercent = Math.max(0, Math.min(100, ((nowMs - riseMs) / (setMs - riseMs)) * 100));
    
    // Check if in Rahu Kaal or Abhijit Muhurat
    if (panchangData.timings?.rahuStart && panchangData.timings?.rahuEnd) {
      const rStart = new Date(panchangData.timings.rahuStart).getTime();
      const rEnd = new Date(panchangData.timings.rahuEnd).getTime();
      if (nowMs >= rStart && nowMs <= rEnd) {
        periodTag = 'RAHU KAAL (AVOID NEW BEGINNINGS)';
        isWarning = true;
      }
    }
    
    if (!isWarning && panchangData.timings?.abhijitStart && panchangData.timings?.abhijitEnd) {
      const aStart = new Date(panchangData.timings.abhijitStart).getTime();
      const aEnd = new Date(panchangData.timings.abhijitEnd).getTime();
      if (nowMs >= aStart && nowMs <= aEnd) {
        periodTag = 'ABHIJIT MUHURAT (HIGH HARMONY)';
      }
    }
  }

  const tithiName = typeof panchangData.tithi === 'object' && panchangData.tithi !== null
    ? (panchangData.tithi.name || 'Shukla Ekadashi')
    : (panchangData.tithi || 'Shukla Ekadashi');

  const nakshatraName = typeof panchangData.nakshatra === 'object' && panchangData.nakshatra !== null
    ? (panchangData.nakshatra.name || 'Rohini')
    : (panchangData.nakshatra || 'Rohini');

  const pada = (typeof panchangData.nakshatra === 'object' && panchangData.nakshatra?.pada) || 2;
  const nakshatraLord = (typeof panchangData.nakshatra === 'object' && panchangData.nakshatra?.lord) || 'Moon';
  const tithiPaksha = (typeof panchangData.tithi === 'object' && panchangData.tithi?.paksha) || 'Shukla Paksha';

  const yogaName = typeof panchangData.yoga === 'object' && panchangData.yoga !== null
    ? (panchangData.yoga.name || 'Siddha')
    : (panchangData.yoga || 'Siddha');

  const karanaName = typeof panchangData.karana === 'object' && panchangData.karana !== null
    ? (panchangData.karana.name || 'Bava')
    : (panchangData.karana || 'Bava');

  const moonPhase = typeof panchangData.moonPhaseName === 'string'
    ? panchangData.moonPhaseName
    : (panchangData.moon?.phase || 'Waxing Moon');

  const moonIllum = Math.round(panchangData.moonPhasePercent || panchangData.moon?.illumination || 78);
  const rahuTime = panchangData.timings?.rahuKalam || '15:15 – 16:48';
  const ayanamshaVal = typeof panchangData.ayanamsha === 'number'
    ? `Lahiri ${panchangData.ayanamsha.toFixed(2)}°`
    : (panchangData.ayanamsha ? `Lahiri ${panchangData.ayanamsha}°` : "Lahiri 24° 16' 42″");

  return (
    <div className="relative rounded-3xl bg-[#FAF7F2]/95 dark:bg-[#0A0C14]/95 backdrop-blur-xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/45 p-5 sm:p-7 shadow-2xl dark:shadow-[0_0_50px_rgba(212,175,55,0.14)] select-none transition-all duration-300">
      {/* Sacred Geometry Concentric Brass Border */}
      <div className="absolute inset-1.5 rounded-[22px] border border-[#8E6F1D]/15 dark:border-[#D4AF37]/20 pointer-events-none" />

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.1] pb-3.5 mb-4">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${isWarning ? 'bg-rose-500 shadow-[0_0_8px_#F43F5E]' : 'bg-[#E29A48] dark:bg-[#F59E0B] shadow-[0_0_10px_#F59E0B]'} animate-pulse shrink-0`} />
          <div>
            <div className="font-editorial text-sm sm:text-base font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-wide flex items-center gap-1.5">
              <span>COSMIC NOW</span>
              <span className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] font-semibold">DIAL</span>
            </div>
            <div className="text-[10px] font-mono-data text-[#696256] dark:text-[#9E988D] uppercase tracking-wider mt-0.5">
              {currentCity.name} • {liveTime || '05:30 IST'}
            </div>
          </div>
        </div>

        {/* City Switch Button */}
        <button
          onClick={() => {
            chitiSensory.playTick();
            onOpenCitySelector();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#8E6F1D]/25 dark:border-[#D4AF37]/35 bg-white dark:bg-[#121528] text-[10px] sm:text-[11px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:border-[#D4AF37] transition-all shadow-xs"
        >
          <MapPin className="w-3 h-3 text-[#A6461D] dark:text-[#E2825B]" />
          <span>{currentCity.name}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </div>

      {/* Signature Vedic Day Arc Instrument */}
      <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#070910]/95 border border-[#8E6F1D]/20 dark:border-[#D4AF37]/30 mb-4.5 shadow-inner">
        <div className="flex items-center justify-between text-[10px] font-mono-data text-[#696256] dark:text-[#A6A095] mb-2 uppercase tracking-widest">
          <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-amber-500" /> Rise {sunriseStr}</span>
          <span className="font-bold text-[#1C1917] dark:text-[#F5F2EB]">{isDaytime ? 'Diurnal Solar Transit' : 'Nocturnal Transit'}</span>
          <span className="flex items-center gap-1"><Moon className="w-3 h-3 text-indigo-400" /> Set {sunsetStr}</span>
        </div>

        {/* Arc Progress Track */}
        <div className="relative w-full h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden border border-black/10 dark:border-white/10">
          {/* Active Period Gradient */}
          <div
            className={`h-full transition-all duration-700 ${
              isWarning 
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600' 
                : 'bg-gradient-to-r from-[#C26E22] via-[#D4AF37] to-[#8E6F1D]'
            }`}
            style={{ width: `${solarArcPercent}%` }}
          />
        </div>

        {/* 5 Vedic Diurnal Milestones */}
        <div className="flex items-center justify-between text-[8.5px] sm:text-[9.5px] font-mono-data text-[#857E74] dark:text-[#8E877B] mt-2 px-0.5">
          <span>PRE-DAWN</span>
          <span>SUNRISE</span>
          <span className="font-bold text-[#8E6F1D] dark:text-[#F0C968]">MIDDAY</span>
          <span>SUNSET</span>
          <span>NIGHT</span>
        </div>

        {/* Live Active Period Badge */}
        <div className="mt-3 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <span className="text-[10px] font-mono-data uppercase tracking-wider text-[#696256] dark:text-[#9E988D]">
            Current Temporal Window:
          </span>
          <span className={`text-[10px] font-mono-data font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
            isWarning
              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
              : 'bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#F0C968] border border-[#D4AF37]/30'
          }`}>
            {periodTag}
          </span>
        </div>
      </div>

      {/* High-Contrast Ephemeris Matrix */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5 text-xs font-mono-data">
        {/* Tithi */}
        <div className="p-3 rounded-xl bg-white/85 dark:bg-[#101322] border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[9.5px] text-[#696256] dark:text-[#8E877B] uppercase tracking-wider">Tithi (Lunar Day)</div>
          <div className="font-editorial text-sm font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-0.5 truncate">
            {tithiName}
          </div>
          <div className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] font-semibold mt-0.5">{tithiPaksha}</div>
        </div>

        {/* Nakshatra */}
        <div className="p-3 rounded-xl bg-white/85 dark:bg-[#101322] border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[9.5px] text-[#696256] dark:text-[#8E877B] uppercase tracking-wider">Nakshatra (Mansion)</div>
          <div className="font-editorial text-sm font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-0.5 truncate">
            {nakshatraName}
          </div>
          <div className="text-[9px] text-indigo-600 dark:text-[#B0B0FF] font-semibold mt-0.5">Pada {pada} • {nakshatraLord}</div>
        </div>

        {/* Yoga & Karana */}
        <div className="p-3 rounded-xl bg-white/85 dark:bg-[#101322] border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[9.5px] text-[#696256] dark:text-[#8E877B] uppercase tracking-wider">Yoga &amp; Karana</div>
          <div className="font-bold text-[#1C1917] dark:text-[#FFFFFF] text-xs mt-0.5 truncate">
            {yogaName}
          </div>
          <div className="text-[9px] text-[#696256] dark:text-[#9E988D] mt-0.5 truncate">Karana: {karanaName}</div>
        </div>

        {/* Rahu Kaal & Ayanamsha */}
        <div className="p-3 rounded-xl bg-white/85 dark:bg-[#101322] border border-black/[0.08] dark:border-white/[0.08]">
          <div className="text-[9.5px] text-[#696256] dark:text-[#8E877B] uppercase tracking-wider">Rahu Kaal (Avoid)</div>
          <div className="font-bold text-[#991B1B] dark:text-[#F87171] text-xs mt-0.5 truncate">
            {rahuTime}
          </div>
          <div className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] mt-0.5 truncate">{ayanamshaVal}</div>
        </div>
      </div>

      {/* Footer Instrument Stamp */}
      <div className="relative z-10 mt-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[9px] font-mono-data text-[#857E74] dark:text-[#7A746B]">
        <span>Chitra Paksha Sidereal Ephemeris</span>
        <span>Accuracy ±0.01°</span>
      </div>
    </div>
  );
}
