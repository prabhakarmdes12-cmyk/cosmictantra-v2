'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Sun, Moon, Clock, Compass, ChevronDown, Sparkles, AlertTriangle, ShieldCheck, Calendar as CalendarIcon } from 'lucide-react';
import { calculatePanchang } from '@/lib/panchang.js';
import { trackEvent } from '@/lib/analytics';
import { NAKSHATRAS_DATA, TITHIS_DATA, YOGAS_DATA, KARANAS_MAP, LUNAR_MONTHS } from '@/engines/monthlyPanchangEngine';

const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
function toHindiDigits(str: string | number | undefined): string {
  if (!str) return '';
  return String(str).replace(/[0-9]/g, (d) => HINDI_DIGITS[parseInt(d, 10)]);
}

const CITIES = [
  { name: 'Varanasi, UP', nameHi: 'वाराणसी (काशी)', lat: 25.3176, lon: 82.9739, tz: 5.5 },
  { name: 'Dhanbad, JH', nameHi: 'धनबाद', lat: 23.7957, lon: 86.4304, tz: 5.5 },
  { name: 'Ranchi, JH', nameHi: 'राँची', lat: 23.3441, lon: 85.3096, tz: 5.5 },
  { name: 'Patna, BR', nameHi: 'पटना', lat: 25.5941, lon: 85.1376, tz: 5.5 },
  { name: 'Kolkata, WB', nameHi: 'कोलकाता', lat: 22.5726, lon: 88.3639, tz: 5.5 },
  { name: 'New Delhi, DL', nameHi: 'नई दिल्ली', lat: 28.6139, lon: 77.2090, tz: 5.5 },
  { name: 'Mumbai, MH', nameHi: 'मुम्बई', lat: 19.0760, lon: 72.8777, tz: 5.5 },
  { name: 'Bengaluru, KA', nameHi: 'बेंगलुरु', lat: 12.9716, lon: 77.5946, tz: 5.5 },
  { name: 'Ujjain, MP', nameHi: 'उज्जैन (महाकाल)', lat: 23.1765, lon: 75.7885, tz: 5.5 },
  { name: 'Haridwar, UK', nameHi: 'हरिद्वार (गंगा तट)', lat: 29.9457, lon: 78.1642, tz: 5.5 },
];

const ENGLISH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HINDI_MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HINDI_DAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

interface CosmicNowProps {
  lang?: string;
}

export default function CosmicNow({ lang = 'en' }: CosmicNowProps) {
  const [isHi, setIsHi] = useState(lang === 'hi');
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [panchang, setPanchang] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [nowDate, setNowDate] = useState<Date>(new Date());

  useEffect(() => {
    const now = new Date();
    setNowDate(now);
    const p = calculatePanchang(now, {
      lat: selectedCity.lat,
      lng: selectedCity.lon,
      tz: selectedCity.tz,
      name: selectedCity.name
    });
    setPanchang(p);

    const updateClock = () => {
      const d = new Date();
      setNowDate(d);
      setCurrentTime(d.toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  const handleCitySelect = (city: typeof CITIES[0]) => {
    setSelectedCity(city);
    setShowCityDropdown(false);
    trackEvent('LOCATION_CHANGED', { city: city.name });
  };

  if (!panchang) return null;

  const year = nowDate.getFullYear();
  const monthIdx = nowDate.getMonth();
  const dayNum = nowDate.getDate();
  const dayOfWeek = nowDate.getDay();
  const vikramSamvat = panchang.samvat?.vikram || (year + 57);
  const shakaSamvat = panchang.samvat?.shaka || (year - 78);

  const englishFullDate = `${ENGLISH_DAYS[dayOfWeek]}, ${dayNum} ${ENGLISH_MONTHS[monthIdx]} ${year}`;
  const hindiFullDate = `${HINDI_DAYS[dayOfWeek]}, ${toHindiDigits(dayNum)} ${HINDI_MONTHS[monthIdx]} ${toHindiDigits(year)}`;

  const sunSidLon = typeof panchang.sun?.siderealLongitude === 'number'
    ? panchang.sun.siderealLongitude
    : parseFloat(panchang.sun?.siderealLongitude || '133');
  const derivedMasaIndex = (Math.floor(sunSidLon / 30) + 1) % 12;

  const lunarMonthObj = panchang.masa
    ? { en: panchang.masa.name || panchang.masa.en, hi: panchang.masa.nameHi || panchang.masa.hi }
    : (LUNAR_MONTHS[derivedMasaIndex] || LUNAR_MONTHS[5]);

  const ritu = isHi 
    ? (panchang.ritu?.nameHi || panchang.ritu?.hi || (derivedMasaIndex === 4 || derivedMasaIndex === 5 ? 'वर्षा ऋतु (मेघमाला)' : 'शरद ऋतु (निर्मल)'))
    : (panchang.ritu?.name || panchang.ritu?.en || (derivedMasaIndex === 4 || derivedMasaIndex === 5 ? 'Varsha (Monsoon)' : 'Sharad (Autumn)'));

  const ayana = isHi
    ? (panchang.ayana?.nameHi || (Math.floor(sunSidLon / 30) >= 9 || Math.floor(sunSidLon / 30) <= 2 ? 'उत्तरायण' : 'दक्षिणायन'))
    : (panchang.ayana?.name || (Math.floor(sunSidLon / 30) >= 9 || Math.floor(sunSidLon / 30) <= 2 ? 'Uttarayana (Northward Sun)' : 'Dakshinayana (Southward Sun)'));

  const tithiNumber = panchang.tithi?.number || 1;
  const tithiData = TITHIS_DATA[(tithiNumber - 1) % 30] || { name: panchang.tithi?.name, nameHi: panchang.tithi?.name, meaning: 'Auspicious Lunar Phase' };
  
  const nakName = panchang.nakshatra?.name || 'Ashwini';
  const nakData = NAKSHATRAS_DATA.find(n => n.name === nakName) || { name: nakName, nameHi: nakName, lord: panchang.nakshatra?.lord || 'Ketu', deity: panchang.nakshatra?.deity || 'Devas' };
  
  const yogaName = panchang.yoga?.name || 'Vishkambha';
  const yogaData = YOGAS_DATA.find(y => y.name === yogaName) || { name: yogaName, nameHi: yogaName, quality: 'Auspicious', qualityHi: 'शुभ' };
  
  const karanaName = panchang.karana?.name || 'Bava';
  const karanaMeta = KARANAS_MAP[karanaName] || { nameHi: karanaName, typeHi: 'चर' };

  const currentHours = nowDate.getHours() + nowDate.getMinutes() / 60 + nowDate.getSeconds() / 3600;
  const sunProgress = panchang.solarArcProgress ?? Math.max(0, Math.min(100, ((currentHours - 6) / 12) * 100));

  const displayTime = isHi ? toHindiDigits(currentTime) : currentTime;
  const displaySunrise = isHi ? toHindiDigits(panchang.sun?.sunrise) : panchang.sun?.sunrise;
  const displaySunset = isHi ? toHindiDigits(panchang.sun?.sunset) : panchang.sun?.sunset;
  const displayRahu = isHi ? toHindiDigits(panchang.timings?.rahuKalam) : panchang.timings?.rahuKalam;
  const pada = isHi ? toHindiDigits(panchang.nakshatra?.pada) : panchang.nakshatra?.pada;

  return (
    <div className="chiti-card p-5 sm:p-7 border-2 border-purple-500/30 bg-black/85 font-body relative overflow-hidden space-y-5 shadow-2xl">
      {/* Top Header: Instrument Badge + City Selector + Language Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#F59E0B]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-widest font-display uppercase">
                {isHi ? 'प्रत्यक्ष खगोल चक्र' : 'COSMIC NOW'}
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#A78BFA]">
              {isHi ? 'प्रत्यक्ष दृक्-पञ्चाङ्ग वेधशाला' : 'Real-time Drik Ephemeris HUD'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHi(!isHi)}
            className="px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-[11px] font-mono font-bold text-[#A78BFA] hover:text-white transition-colors cursor-pointer"
            title={isHi ? 'Switch to English' : 'हिन्दी में देखें'}
          >
            {isHi ? 'English' : 'हिन्दी'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-semibold text-[#A78BFA] hover:text-white transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>{isHi ? selectedCity.nameHi : selectedCity.name}</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showCityDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0D0A1E] border border-purple-500/30 rounded-xl shadow-2xl z-50 py-1.5 text-xs max-h-60 overflow-y-auto">
                {CITIES.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleCitySelect(c)}
                    className={`w-full text-left px-3 py-2 hover:bg-purple-950/60 transition-colors flex items-center justify-between cursor-pointer ${c.name === selectedCity.name ? 'text-[#F59E0B] font-bold' : 'text-white'}`}
                  >
                    <span>{isHi ? c.nameHi : c.name}</span>
                    {c.name === selectedCity.name && <span className="text-[#F59E0B]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Bilingual Dual Date & Samvat Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/30 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="font-editorial text-lg sm:text-2xl font-bold text-white tracking-tight">
              {englishFullDate}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-300 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{displayTime} {isHi ? 'भारतीय मानक समय (IST)' : 'IST'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base font-bold text-[#F59E0B]">
          <span>🕉️ {lunarMonthObj.hi} मास ({lunarMonthObj.en} Maas)</span>
          <span className="text-white/40">•</span>
          <span className="text-white">
            {isHi ? (panchang.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष') : panchang.tithi?.paksha} {isHi ? tithiData.nameHi : panchang.tithi?.name}
          </span>
          <span className="text-white/40">•</span>
          <span className="text-amber-200 font-mono">विक्रम संवत् {toHindiDigits(vikramSamvat)}</span>
        </div>

        <div className="text-[11px] sm:text-xs font-mono text-[#D1C9BF] flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>🌿 {ritu}</span>
          <span>•</span>
          <span>☀️ {ayana}</span>
          <span>•</span>
          <span>शक संवत् {toHindiDigits(shakaSamvat)}</span>
          <span>•</span>
          <span>दिनांक: {hindiFullDate}</span>
        </div>
      </div>

      {/* Solar Arc Instrument Visualizer */}
      <div className="bg-purple-950/30 rounded-2xl border border-purple-500/25 p-4 text-center relative shadow-inner">
        <div className="flex justify-between items-center text-xs text-[#9CA3AF] mb-2 font-mono">
          <span className="flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHi ? `सूर्योदय: ${displaySunrise}` : `Sunrise: ${panchang.sun?.sunrise}`}</span>
          </span>
          <span className="text-white font-bold text-xs bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10">
            {isHi ? 'दिवामान चक्र' : 'Solar Day Arc'}
          </span>
          <span className="flex items-center gap-1">
            <Moon className="w-3.5 h-3.5 text-blue-300" />
            <span>{isHi ? `सूर्यास्त: ${displaySunset}` : `Sunset: ${panchang.sun?.sunset}`}</span>
          </span>
        </div>

        <div className="relative w-full pt-3 pb-1 my-1">
          <div className="w-full bg-black/70 h-3 rounded-full overflow-hidden relative border border-white/15">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-600 transition-all duration-1000"
              style={{ width: `${sunProgress}%` }}
            />
          </div>
          <div 
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-700 z-20"
            style={{ left: `${Math.max(4, Math.min(96, sunProgress))}%` }}
          >
            <div className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[8px] font-mono font-extrabold text-black shadow-lg mb-0.5">
              {isHi ? 'वर्तमान' : 'NOW'}
            </div>
            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#D4AF37]" />
          </div>
        </div>

        <div className="text-[11px] text-[#A78BFA] mt-2 font-mono flex items-center justify-center gap-2">
          <span>{isHi ? 'वर्तमान वेला (Instant Phase):' : 'Current Vedic Period:'}</span>
          <strong className="text-white bg-purple-900/40 px-2 py-0.5 rounded-md border border-purple-500/30">
            {isHi ? (panchang.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष') : panchang.tithi?.paksha} {isHi ? tithiData.nameHi : panchang.tithi?.name} ({panchang.tithi?.progressPercent}% पूर्ण) • {isHi ? HINDI_DAYS[dayOfWeek] : ENGLISH_DAYS[dayOfWeek]}
          </strong>
        </div>
      </div>

      {/* 4 Core Deterministic Panchang Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* 1. Tithi */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-white/15 hover:border-amber-400/50 transition-all space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">{isHi ? '१. उदया तिथि (Day Tithi)' : '1. UDAYA TITHI'}</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
          </div>
          <div className="font-editorial text-base font-bold text-white truncate">
            {isHi ? tithiData.nameHi : panchang.tithi?.name}
          </div>
          <div className="text-[10px] text-[#F59E0B] font-mono font-medium truncate">
            {isHi ? (panchang.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल पक्ष (चान्द्र वृद्धि)' : 'कृष्ण पक्ष (चान्द्र क्षय)') : panchang.tithi?.paksha}
          </div>
          <div className="text-[9px] text-[#A78BFA] line-clamp-1 border-t border-white/5 pt-1">
            {tithiData.meaning}
          </div>
        </div>

        {/* 2. Nakshatra */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-white/15 hover:border-amber-400/50 transition-all space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">{isHi ? '२. नक्षत्र' : '2. NAKSHATRA'}</span>
            <Sparkles className="w-3 h-3 text-[#F59E0B]" />
          </div>
          <div className="font-editorial text-base font-bold text-[#F59E0B] truncate">
            {isHi ? nakData.nameHi : panchang.nakshatra?.name}
          </div>
          <div className="text-[10px] text-[#D1C9BF] font-mono truncate">
            {isHi ? `पाद ${pada} • स्वामी: ${nakData.lord}` : `Pada ${panchang.nakshatra?.pada} • Lord: ${nakData.lord}`}
          </div>
          <div className="text-[9px] text-[#9CA3AF] line-clamp-1 border-t border-white/5 pt-1">
            {isHi ? `देवता: ${nakData.deity}` : `Deity: ${nakData.deity}`}
          </div>
        </div>

        {/* 3. Nitya Yoga & Karana */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-white/15 hover:border-emerald-400/50 transition-all space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">{isHi ? '३. नित्य योग व करण' : '3. YOGA & KARANA'}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">{isHi ? yogaData.qualityHi : yogaData.quality}</span>
          </div>
          <div className="font-editorial text-base font-bold text-white truncate">
            {isHi ? yogaData.nameHi : panchang.yoga?.name}
          </div>
          <div className="text-[10px] text-[#10B981] font-mono truncate">
            {isHi ? `करण: ${karanaMeta.nameHi} (${karanaMeta.typeHi})` : `Karana: ${panchang.karana?.name}`}
          </div>
          <div className="text-[9px] text-[#9CA3AF] line-clamp-1 border-t border-white/5 pt-1">
            {isHi ? `वार: ${HINDI_DAYS[dayOfWeek]}` : `Vara: ${ENGLISH_DAYS[dayOfWeek]}`}
          </div>
        </div>

        {/* 4. Rahu Kalam & Muhurat */}
        <div className="p-3.5 rounded-xl bg-black/50 border border-amber-500/40 hover:border-amber-400 transition-all space-y-1 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{isHi ? '४. राहुकाल व मुहूर्त' : '4. RAHU & MUHURAT'}</span>
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          </div>
          <div className="font-mono text-sm font-bold text-[#F59E0B] truncate">
            {displayRahu}
          </div>
          <div className="text-[10px] text-red-400 font-mono font-semibold">
            {isHi ? '⚠️ राहुकाल (शुभ कार्य वर्जित)' : '⚠️ Inauspicious Window'}
          </div>
          <div className="text-[9px] text-emerald-400 font-mono line-clamp-1 border-t border-white/5 pt-1 flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>{isHi ? `अभिजित: ${toHindiDigits(panchang.timings?.abhijitMuhurat || '11:45 AM – 12:35 PM')}` : `Abhijit: ${panchang.timings?.abhijitMuhurat || '11:45 AM – 12:35 PM'}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}