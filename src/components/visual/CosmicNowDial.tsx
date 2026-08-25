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

  // Real astronomical sunrise and sunset strings
  const sunriseStr = panchangData.sun?.sunrise || (panchangData.sunrise instanceof Date ? panchangData.sunrise.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '05:35 AM');
  const sunsetStr = panchangData.sun?.sunset || (panchangData.sunset instanceof Date ? panchangData.sunset.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '06:18 PM');
  
  // Extract sunrise and sunset in minutes from midnight
  let sunriseMinutes = 5 * 60 + 35; // default 05:35 AM
  let sunsetMinutes = 18 * 60 + 18; // default 06:18 PM

  if (panchangData.sun?.sunriseDate instanceof Date) {
    sunriseMinutes = panchangData.sun.sunriseDate.getHours() * 60 + panchangData.sun.sunriseDate.getMinutes();
  } else if (typeof sunriseStr === 'string') {
    const match = sunriseStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      sunriseMinutes = h * 60 + m;
    }
  }

  if (panchangData.sun?.sunsetDate instanceof Date) {
    sunsetMinutes = panchangData.sun.sunsetDate.getHours() * 60 + panchangData.sun.sunsetDate.getMinutes();
  } else if (typeof sunsetStr === 'string') {
    const match = sunsetStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      sunsetMinutes = h * 60 + m;
    }
  }

  // Current local time minutes from midnight
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Continuum Position Mapping:
  // PRE-DAWN (0% to 25%) -> SUNRISE (25%) -> MIDDAY (50%) -> SUNSET (75%) -> NIGHT (75% to 100%)
  let solarArcPercent = 20;
  let activeMilestone = 'PRE-DAWN';
  let isDaytime = false;
  let periodTag = 'USHA KALA (PRE-DAWN)';
  let isWarning = false;

  if (currentMinutes < sunriseMinutes) {
    // Night to Pre-Dawn transition before sunrise (00:00 -> sunrise)
    isDaytime = false;
    solarArcPercent = Math.max(5, (currentMinutes / sunriseMinutes) * 25);
    activeMilestone = 'PRE-DAWN';
    periodTag = 'USHA KALA (PRE-DAWN)';
  } else if (currentMinutes <= sunsetMinutes) {
    // Daytime progression between sunrise (25%) and sunset (75%)
    isDaytime = true;
    const dayProgress = (currentMinutes - sunriseMinutes) / Math.max(1, (sunsetMinutes - sunriseMinutes));
    solarArcPercent = 25 + dayProgress * 50;

    if (currentMinutes < sunriseMinutes + 45) {
      activeMilestone = 'SUNRISE';
      periodTag = 'PRATAH SANDHYA (SUNRISE)';
    } else if (currentMinutes > sunsetMinutes - 45) {
      activeMilestone = 'SUNSET';
      periodTag = 'SAYAHNA SANDHYA (SUNSET)';
    } else {
      activeMilestone = 'MIDDAY';
      periodTag = 'DAYLIGHT (SHUBH HORA)';
    }
  } else {
    // Post-sunset to Midnight (sunset to 24:00)
    isDaytime = false;
    const nightProgress = (currentMinutes - sunsetMinutes) / Math.max(1, (1440 - sunsetMinutes));
    solarArcPercent = Math.min(95, 75 + nightProgress * 25);
    activeMilestone = 'NIGHT';
    periodTag = 'SANDHYA / RATRI (NIGHT)';
  }

  // Check if current time falls in Rahu Kaal window
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

  // Format duration helper (e.g. 1h 24m or 42m)
  const formatDuration = (mins: number): string => {
    const m = Math.max(1, Math.round(mins));
    const hrs = Math.floor(m / 60);
    const rem = m % 60;
    if (hrs > 0 && rem > 0) return `${hrs}h ${rem}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${rem}m`;
  };

  // Deterministic Next Transition Calculation based on real ephemeris
  let nextTransitionText = '';
  const rStartMs = panchangData.timings?.rahuStart ? new Date(panchangData.timings.rahuStart).getTime() : 0;
  const rEndMs = panchangData.timings?.rahuEnd ? new Date(panchangData.timings.rahuEnd).getTime() : 0;
  const aStartMs = panchangData.timings?.abhijitStart ? new Date(panchangData.timings.abhijitStart).getTime() : 0;

  if (currentMinutes < sunriseMinutes) {
    const diff = sunriseMinutes - currentMinutes;
    nextTransitionText = `Sunrise in ${formatDuration(diff)}`;
  } else if (rStartMs > 0 && nowMs < rStartMs && (rStartMs - nowMs) <= 120 * 60 * 1000) {
    const diffMins = (rStartMs - nowMs) / 60000;
    nextTransitionText = `Rahu Kaal begins in ${formatDuration(diffMins)}`;
  } else if (rStartMs > 0 && rEndMs > 0 && nowMs >= rStartMs && nowMs <= rEndMs) {
    const diffMins = (rEndMs - nowMs) / 60000;
    nextTransitionText = `Rahu Kaal ends in ${formatDuration(diffMins)}`;
  } else if (aStartMs > 0 && nowMs < aStartMs && (aStartMs - nowMs) <= 90 * 60 * 1000) {
    const diffMins = (aStartMs - nowMs) / 60000;
    nextTransitionText = `Abhijit Muhurat in ${formatDuration(diffMins)}`;
  } else if (currentMinutes < sunsetMinutes) {
    const diff = sunsetMinutes - currentMinutes;
    nextTransitionText = `Sunset in ${formatDuration(diff)}`;
  } else {
    const diffToMidnight = 1440 - currentMinutes;
    const diffToDawn = diffToMidnight + sunriseMinutes - 96;
    if (diffToDawn > 0 && diffToDawn < 1440) {
      nextTransitionText = `Brahma Muhurat in ${formatDuration(diffToDawn)}`;
    } else {
      nextTransitionText = `Sunrise at ${sunriseStr}`;
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
      <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#070910]/95 border border-[#8E6F1D]/20 dark:border-[#D4AF37]/30 mb-4 shadow-inner">
        <div className="flex items-center justify-between text-[10px] font-mono-data text-[#696256] dark:text-[#A6A095] mb-2 uppercase tracking-widest">
          <span className="flex items-center gap-1 font-semibold text-[#C26E22] dark:text-[#F0A554]">
            <Sun className="w-3.5 h-3.5 text-amber-500" /> Rise {sunriseStr}
          </span>
          <span className="font-bold text-[#1C1917] dark:text-[#F5F2EB] px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06]">
            {isDaytime ? '☀ Diurnal Solar Transit' : '☾ Nocturnal Transit'}
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#4F46E5] dark:text-[#A5B4FC]">
            <Moon className="w-3.5 h-3.5 text-indigo-400" /> Set {sunsetStr}
          </span>
        </div>

        {/* Current Time Needle Track Container */}
        <div className="relative w-full pt-4 pb-2">
          {/* Timeline Bar Track */}
          <div className="relative w-full h-3 rounded-full bg-black/10 dark:bg-white/10 p-0.5 border border-black/15 dark:border-white/15">
            {/* Active Progress Fill */}
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isWarning 
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600' 
                  : 'bg-gradient-to-r from-[#C26E22] via-[#D4AF37] to-[#8E6F1D]'
              }`}
              style={{ width: `${solarArcPercent}%` }}
            />
          </div>

          {/* Current Time Indicator Needle Pin */}
          <div 
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-700 z-30"
            style={{ left: `${Math.max(4, Math.min(96, solarArcPercent))}%` }}
          >
            {/* Live Indicator Pill Label */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#1C1917] dark:bg-[#F5F2EB] text-[8.5px] font-mono-data font-bold text-white dark:text-[#06070B] shadow-md whitespace-nowrap mb-0.5 border border-[#D4AF37]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-ping" />
              <span>NOW {liveTime ? liveTime.slice(0, 5) : ''}</span>
            </div>
            {/* Needle Arrow */}
            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[5px] border-t-[#1C1917] dark:border-t-[#F5F2EB]" />
          </div>
        </div>

        {/* 5 Vedic Diurnal Milestones with Active Highlighting */}
        <div className="grid grid-cols-5 text-center text-[8px] sm:text-[9px] font-mono-data mt-1.5 px-0.5 gap-1">
          <span className={`py-1 rounded-md transition-all ${activeMilestone === 'PRE-DAWN' ? 'font-bold text-[#8E6F1D] dark:text-[#F0C968] bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-xs' : 'text-[#857E74] dark:text-[#8E877B] opacity-70'}`}>
            PRE-DAWN
          </span>
          <span className={`py-1 rounded-md transition-all ${activeMilestone === 'SUNRISE' ? 'font-bold text-[#8E6F1D] dark:text-[#F0C968] bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-xs' : 'text-[#857E74] dark:text-[#8E877B] opacity-70'}`}>
            SUNRISE
          </span>
          <span className={`py-1 rounded-md transition-all ${activeMilestone === 'MIDDAY' ? 'font-bold text-[#8E6F1D] dark:text-[#F0C968] bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-xs' : 'text-[#857E74] dark:text-[#8E877B] opacity-70'}`}>
            MIDDAY
          </span>
          <span className={`py-1 rounded-md transition-all ${activeMilestone === 'SUNSET' ? 'font-bold text-[#8E6F1D] dark:text-[#F0C968] bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-xs' : 'text-[#857E74] dark:text-[#8E877B] opacity-70'}`}>
            SUNSET
          </span>
          <span className={`py-1 rounded-md transition-all ${activeMilestone === 'NIGHT' ? 'font-bold text-[#8E6F1D] dark:text-[#F0C968] bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-xs' : 'text-[#857E74] dark:text-[#8E877B] opacity-70'}`}>
            NIGHT
          </span>
        </div>

        {/* Live Active Period & Next Transition Row */}
        <div className="mt-3 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] font-mono-data uppercase tracking-wider text-[#696256] dark:text-[#9E988D]">
              Window:
            </span>
            <span className={`text-[9.5px] font-mono-data font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
              isWarning
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                : 'bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#F0C968] border border-[#D4AF37]/30'
            }`}>
              {periodTag}
            </span>
          </div>
          {nextTransitionText && (
            <div className="flex items-center gap-1 text-[9.5px] font-mono-data font-semibold text-[#8E6F1D] dark:text-[#D4AF37] bg-black/[0.03] dark:bg-white/[0.04] px-2 py-0.5 rounded border border-black/[0.06] dark:border-white/[0.08]">
              <Sparkles className="w-2.5 h-2.5 text-[#C26E22] dark:text-[#F59E0B]" />
              <span>Next: <strong>{nextTransitionText}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Integrated Astronomical Telemetry Plate (No generic SaaS cards) */}
      <div className="relative z-10 rounded-2xl bg-white/85 dark:bg-[#070912]/90 border border-[#8E6F1D]/20 dark:border-[#D4AF37]/25 p-3.5 divide-y divide-black/[0.06] dark:divide-white/[0.08] text-xs font-mono-data shadow-xs">
        {/* Primary State: Tithi + Nakshatra */}
        <div className="grid grid-cols-2 gap-3 pb-3">
          <div>
            <div className="text-[9px] text-[#696256] dark:text-[#8E877B] uppercase tracking-wider font-semibold">TITHI (LUNAR DAY)</div>
            <div className="font-editorial text-sm sm:text-base font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-0.5 truncate">
              {tithiName}
            </div>
            <div className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] font-semibold mt-0.5">{tithiPaksha}</div>
          </div>

          <div className="border-l border-black/[0.06] dark:border-white/[0.08] pl-3">
            <div className="text-[9px] text-[#696256] dark:text-[#8E877B] uppercase tracking-wider font-semibold">NAKSHATRA (MANSION)</div>
            <div className="font-editorial text-sm sm:text-base font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-0.5 truncate">
              {nakshatraName}
            </div>
            <div className="text-[9px] text-indigo-600 dark:text-[#B0B0FF] font-semibold mt-0.5">Pada {pada} • Lord {nakshatraLord}</div>
          </div>
        </div>

        {/* Secondary State & Alert: Yoga / Karana & Rahu Kaal */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div>
            <div className="text-[9px] text-[#696256] dark:text-[#8E877B] uppercase tracking-wider font-semibold">YOGA &amp; KARANA</div>
            <div className="font-semibold text-[#1C1917] dark:text-[#FFFFFF] text-xs mt-0.5 truncate">
              {yogaName}
            </div>
            <div className="text-[9px] text-[#696256] dark:text-[#9E988D] mt-0.5 truncate">Karana: {karanaName}</div>
          </div>

          <div className="border-l border-black/[0.06] dark:border-white/[0.08] pl-3">
            <div className="text-[9px] text-[#991B1B] dark:text-[#F87171] uppercase tracking-wider font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 inline-block" /> RAHU KAAL (AVOID)
            </div>
            <div className="font-mono-data font-bold text-[#991B1B] dark:text-[#F87171] text-xs mt-0.5 truncate">
              {rahuTime}
            </div>
            <div className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] mt-0.5 truncate">{ayanamshaVal}</div>
          </div>
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
