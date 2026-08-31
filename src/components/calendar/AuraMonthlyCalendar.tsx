'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldAlert, 
  Share2, 
  Sun, 
  Moon, 
  Clock, 
  Compass, 
  User, 
  X, 
  Check, 
  Info,
  Download,
  CalendarPlus,
  Languages
} from 'lucide-react';
import { 
  calculateMonthPanchang, 
  PanchangDayData, 
  MonthPanchangOverview 
} from '@/engines/monthlyPanchangEngine';
import { getProfiles } from '@/lib/profileStore';
import { CITIES } from '@/lib/cities.js';
import { playTick } from '@/lib/chitiAudio';

const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
function toHindiDigits(str: string | number): string {
  return String(str).replace(/[0-9]/g, (d) => HINDI_DIGITS[parseInt(d, 10)]);
}

const LORD_HI_MAP: Record<string, string> = {
  'Sun': 'सूर्य देव', 'Moon': 'चन्द्र देव', 'Mars': 'मंगल देव',
  'Mercury': 'बुध देव', 'Jupiter': 'बृहस्पति देव', 'Venus': 'शुक्र देव',
  'Saturn': 'शनि देव', 'Rahu': 'राहु देव', 'Ketu': 'केतु देव'
};

export const ALL_MONTHS = [
  { index: 0, en: 'January', hi: 'जनवरी', shortEn: 'Jan', shortHi: 'जन', vedicMaas: 'पौष - माघ', vedicMaasEn: 'Pausha - Magha' },
  { index: 1, en: 'February', hi: 'फ़रवरी', shortEn: 'Feb', shortHi: 'फ़र', vedicMaas: 'माघ - फाल्गुन', vedicMaasEn: 'Magha - Phalguna' },
  { index: 2, en: 'March', hi: 'मार्च', shortEn: 'Mar', shortHi: 'मार्च', vedicMaas: 'फाल्गुन - चैत्र', vedicMaasEn: 'Phalguna - Chaitra' },
  { index: 3, en: 'April', hi: 'अप्रैल', shortEn: 'Apr', shortHi: 'अप्रै', vedicMaas: 'चैत्र - वैशाख', vedicMaasEn: 'Chaitra - Vaishakha' },
  { index: 4, en: 'May', hi: 'मई', shortEn: 'May', shortHi: 'मई', vedicMaas: 'वैशाख - ज्येष्ठ', vedicMaasEn: 'Vaishakha - Jyeshtha' },
  { index: 5, en: 'June', hi: 'जून', shortEn: 'Jun', shortHi: 'जून', vedicMaas: 'ज्येष्ठ - आषाढ़', vedicMaasEn: 'Jyeshtha - Ashadha' },
  { index: 6, en: 'July', hi: 'जुलाई', shortEn: 'Jul', shortHi: 'जुला', vedicMaas: 'आषाढ़ - श्रावण', vedicMaasEn: 'Ashadha - Shravana' },
  { index: 7, en: 'August', hi: 'अगस्त', shortEn: 'Aug', shortHi: 'अग', vedicMaas: 'श्रावण - भाद्रपद', vedicMaasEn: 'Shravana - Bhadrapada' },
  { index: 8, en: 'September', hi: 'सितंबर', shortEn: 'Sep', shortHi: 'सितं', vedicMaas: 'भाद्रपद - आश्विन', vedicMaasEn: 'Bhadrapada - Ashwin' },
  { index: 9, en: 'October', hi: 'अक्टूबर', shortEn: 'Oct', shortHi: 'अक्टू', vedicMaas: 'आश्विन - कार्तिक', vedicMaasEn: 'Ashwin - Kartika' },
  { index: 10, en: 'November', hi: 'नवंबर', shortEn: 'Nov', shortHi: 'नवं', vedicMaas: 'कार्तिक - मार्गशीर्ष', vedicMaasEn: 'Kartika - Margashirsha' },
  { index: 11, en: 'December', hi: 'दिसंबर', shortEn: 'Dec', shortHi: 'दिसं', vedicMaas: 'मार्गशीर्ष - पौष', vedicMaasEn: 'Margashirsha - Pausha' }
];

interface AuraMonthlyCalendarProps {
  initialLang?: string;
}

export default function AuraMonthlyCalendar({ initialLang }: AuraMonthlyCalendarProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [selectedCityId, setSelectedCityId] = useState<string>('patna');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfId, setActiveProfId] = useState<string>('pf_default');
  const [lang, setLang] = useState<string>(initialLang || 'en');
  
  // Filter states
  const [energyFilter, setEnergyFilter] = useState<'ALL' | 'POWER' | 'CAUTION' | 'FESTIVALS'>('ALL');
  
  // Day Inspector Modal/Drawer state
  const [inspectedDay, setInspectedDay] = useState<PanchangDayData | null>(null);

  const isHi = lang === 'hi';

  // Initialize Profiles
  useEffect(() => {
    let list = getProfiles();
    if (!list || list.length === 0) {
      const defaultProf = {
        id: 'pf_default',
        name: 'Priya Sharma',
        nameHi: 'प्रिया शर्मा',
        relation: 'Self',
        relationHi: 'स्वयं',
        cosmicId: 'CT-4821',
        birthDate: '1995-06-15',
        birthTime: '10:30',
        birthCity: 'Patna',
        birthNakshatraIndex: 3, // Rohini
        birthRasiIndex: 1, // Vrishabha (Taurus)
        lat: 25.5941,
        lng: 85.1376,
        tz: 5.5
      };
      const spouseProf = {
        id: 'pf_spouse',
        name: 'Amit Sharma',
        nameHi: 'अमित शर्मा',
        relation: 'Spouse',
        relationHi: 'पति/पत्नी',
        cosmicId: 'CT-4822',
        birthDate: '1992-11-20',
        birthTime: '14:15',
        birthCity: 'Varanasi',
        birthNakshatraIndex: 12, // Hasta
        birthRasiIndex: 5, // Kanya (Virgo)
        lat: 25.3176,
        lng: 82.9739,
        tz: 5.5
      };
      const childProf = {
        id: 'pf_child',
        name: 'Aarav Sharma',
        nameHi: 'आरव शर्मा',
        relation: 'Child',
        relationHi: 'सन्तान',
        cosmicId: 'CT-4823',
        birthDate: '2020-04-10',
        birthTime: '08:45',
        birthCity: 'Patna',
        birthNakshatraIndex: 14, // Swati
        birthRasiIndex: 6, // Tula (Libra)
        lat: 25.5941,
        lng: 85.1376,
        tz: 5.5
      };
      list = [defaultProf, spouseProf, childProf];
    }
    setProfiles(list);
  }, []);

  // Active profile object
  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfId) || profiles[0] || null;
  }, [profiles, activeProfId]);

  // City Object
  const currentCityObj = useMemo(() => {
    const found = CITIES.find(c => c.id === selectedCityId);
    return found ? { name: found.name, nameHi: (found as any).nameHi || found.name, lat: found.lat, lng: found.lng, tz: 5.5 } : { name: 'Patna', nameHi: 'पटना', lat: 25.5941, lng: 85.1376, tz: 5.5 };
  }, [selectedCityId]);

  // Compute Full Month Data via calculateMonthPanchang
  const monthData: MonthPanchangOverview = useMemo(() => {
    const profileParams = activeProfile ? {
      birthNakshatraIndex: activeProfile.birthNakshatraIndex !== undefined ? activeProfile.birthNakshatraIndex : 3,
      birthRasiIndex: activeProfile.birthRasiIndex !== undefined ? activeProfile.birthRasiIndex : 1,
    } : undefined;

    return calculateMonthPanchang(
      currentYear, 
      currentMonth, 
      currentCityObj.lat,
      currentCityObj.lng,
      currentCityObj.tz,
      profileParams
    );
  }, [currentYear, currentMonth, currentCityObj, activeProfile]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    playTick();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    playTick();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    playTick();
    const t = new Date();
    setCurrentYear(t.getFullYear());
    setCurrentMonth(t.getMonth());
  };

  // Inspect day handler
  const handleOpenDayInspector = (day: PanchangDayData) => {
    playTick();
    setInspectedDay(day);
  };

  // WhatsApp Share Handler
  const handleShareDayWhatsApp = (day: PanchangDayData) => {
    const abhijitStr = day.timings.abhijitMuhurat 
      ? `${day.timings.abhijitMuhurat.start} - ${day.timings.abhijitMuhurat.end}`
      : (isHi ? 'बुधवार को वर्जित' : 'Excluded on Wednesday');
    const text = isHi 
      ? `🕉️ CosmicTantra वैदिक पञ्चाङ्ग (${toHindiDigits(day.dateString)})\n\n📅 तिथि: ${day.tithi.nameHi} (${day.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष'})\n⭐ नक्षत्र: ${day.nakshatra.nameHi} (पाद ${toHindiDigits(day.nakshatra.pada)})\n🌟 अभिजित मुहूर्त: ${toHindiDigits(abhijitStr)}\n⚠ राहु काल: ${toHindiDigits(day.timings.rahuKaal.start)} - ${toHindiDigits(day.timings.rahuKaal.end)}\n\nऊर्जा स्थिति (${activeProfile?.nameHi || activeProfile?.name || 'आपके लिए'}): ${day.personalEnergy ? day.personalEnergy.badgeLabelHi : 'सन्तुलित'}\n\nमासिक कैलेंडर देखें: https://cosmictantra.chiti.tech/calendar`
      : `🕉️ CosmicTantra Vedic Panchang (${day.dateString})\n\n📅 Tithi: ${day.tithi.name} (${day.tithi.paksha})\n⭐ Nakshatra: ${day.nakshatra.name} (Pada ${day.nakshatra.pada})\n🌟 Abhijit Muhurat: ${abhijitStr}\n⚠ Rahu Kaal: ${day.timings.rahuKaal.start} - ${day.timings.rahuKaal.end}\n\nPersonal Energy for ${activeProfile?.name || 'You'}: ${day.personalEnergy ? day.personalEnergy.badgeLabel : 'Balanced'}\n\nCheck full month calendar: https://cosmictantra.chiti.tech/calendar`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Google Calendar Export Handler
  const handleAddToGoogleCalendar = (day: PanchangDayData) => {
    playTick();
    const cleanDate = day.dateString.replace(/-/g, '');
    const startTimeIso = `${cleanDate}T060000`;
    const endTimeIso = `${cleanDate}T073000`;
    const festName = day.festivals.length > 0 ? (isHi ? day.festivals[0].nameHi : day.festivals[0].name) : (isHi ? day.nakshatra.nameHi : day.nakshatra.name);
    const abhijitStr = day.timings.abhijitMuhurat 
      ? `${day.timings.abhijitMuhurat.start} - ${day.timings.abhijitMuhurat.end}`
      : (isHi ? 'बुधवार को वर्जित' : 'N/A');
    const title = isHi 
      ? `वैदिक पञ्चाङ्ग: ${day.tithi.nameHi} • ${festName}`
      : `Vedic Panchang: ${day.tithi.name} • ${festName}`;
    const details = isHi
      ? `🕉️ CosmicTantra वैदिक पञ्चाङ्ग\n\n• तिथि: ${day.tithi.nameHi}\n• नक्षत्र: ${day.nakshatra.nameHi} (पाद ${toHindiDigits(day.nakshatra.pada)})\n• अभिजित मुहूर्त: ${toHindiDigits(abhijitStr)}\n• राहु काल: ${toHindiDigits(day.timings.rahuKaal.start)} - ${toHindiDigits(day.timings.rahuKaal.end)}\n• ऊर्जा स्तर: ${day.personalEnergy?.badgeLabelHi || 'सन्तुलित'}\n• मार्गदर्शन: ${day.personalEnergy?.adviceHi || 'नित्य कर्म'}`
      : `🕉️ CosmicTantra Vedic Ephemeris\n\n• Tithi: ${day.tithi.name} (${day.tithi.paksha})\n• Nakshatra: ${day.nakshatra.name} (Pada ${day.nakshatra.pada})\n• Abhijit Muhurat: ${abhijitStr}\n• Rahu Kaal: ${day.timings.rahuKaal.start} - ${day.timings.rahuKaal.end}\n• Personal Energy: ${day.personalEnergy?.badgeLabel || 'Balanced'}\n• Guidance: ${day.personalEnergy?.advice || 'N/A'}`;
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startTimeIso}/${endTimeIso}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(currentCityObj.name || 'Patna')}`;
    window.open(gCalUrl, '_blank');
  };

  // iCal (.ics) File Export Handler
  const handleDownloadIcs = (day: PanchangDayData) => {
    playTick();
    const cleanDate = day.dateString.replace(/-/g, '');
    const festName = day.festivals.length > 0 ? (isHi ? day.festivals[0].nameHi : day.festivals[0].name) : (isHi ? day.nakshatra.nameHi : day.nakshatra.name);
    const abhijitStr = day.timings.abhijitMuhurat 
      ? `${day.timings.abhijitMuhurat.start} - ${day.timings.abhijitMuhurat.end}`
      : 'N/A';
    const title = `Vedic Panchang: ${day.tithi.nameHi} • ${festName}`;
    const description = `Tithi: ${day.tithi.nameHi} (${day.tithi.paksha})\\nNakshatra: ${day.nakshatra.nameHi} (Pada ${day.nakshatra.pada})\\nAbhijit: ${abhijitStr}\\nRahu Kaal: ${day.timings.rahuKaal.start} - ${day.timings.rahuKaal.end}\\nPersonal Energy: ${day.personalEnergy?.badgeLabel || 'Balanced'}`;
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CosmicTantra//Vedic Panchang//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${cleanDate}`,
      `DTEND;VALUE=DATE:${cleanDate}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${currentCityObj.name || 'Patna'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `vedic-panchang-${day.dateString}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Today key for indicator
  const todayKey = now.toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      
      {/* 1. Main Calendar Header Card */}
      <div className="bg-white/90 dark:bg-[#0E101D]/90 backdrop-blur-md rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-5 sm:p-8 shadow-xl space-y-6">
        
        {/* 12-Month Quick Selector Bar (Jan to Dec with English + Hindi Month Names) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-black/10 dark:border-white/10">
          {ALL_MONTHS.map((m) => {
            const isSelected = currentMonth === m.index;
            return (
              <button
                key={m.index}
                onClick={() => {
                  playTick();
                  setCurrentMonth(m.index);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] border-[#8E6F1D] dark:border-[#D4AF37] shadow-md scale-105'
                    : 'bg-[#FAF7F2] dark:bg-[#161826] border-black/5 dark:border-white/5 text-[#57524A] dark:text-[#D1C9BF] hover:border-[#8E6F1D]/40 hover:text-[#8E6F1D] dark:hover:text-[#F0C968]'
                }`}
                title={`${m.en} • ${m.hi} (${m.vedicMaas})`}
              >
                <span>{m.shortEn}</span>
                <span className="opacity-75 text-[11px] font-normal">/ {m.shortHi}</span>
              </button>
            );
          })}
        </div>

        {/* Top Controls: Dual Month Title, Vedic Ephemeris, City Selector, Language Toggle, Month Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
          
          {/* Month & Lunar Info with Rich Text Hierarchy */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] text-xs font-mono-data font-bold uppercase tracking-wider shadow-xs">
                🕉️ {monthData.lunarMonthHi} मास • {monthData.lunarMonth} Maas
              </span>
              <span className="text-xs font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                {ALL_MONTHS[currentMonth].vedicMaas}
              </span>
            </div>

            {/* Primary Month Title */}
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-white tracking-tight">
              <span>{monthData.monthName} {monthData.year}</span>
              <span className="text-[#8E6F1D] dark:text-[#F0C968] ml-2 font-normal">/ {monthData.monthNameHi} {toHindiDigits(monthData.year)}</span>
            </h2>

            {/* Sub-Ephemeris Line */}
            <div className="text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF] flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>📅 <strong>विक्रम संवत् {toHindiDigits(monthData.vikramSamvat)}</strong> (Vikram Samvat {monthData.vikramSamvat})</span>
              <span>•</span>
              <span>शक संवत् {toHindiDigits(monthData.shakaSamvat)}</span>
              <span>•</span>
              <span>🌿 {monthData.rituHi} ({monthData.ritu})</span>
              <span>•</span>
              <span>☀️ {monthData.ayanaHi}</span>
            </div>
          </div>

          {/* Navigation Controls & City Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Language Switch Pill */}
            <button
              onClick={() => {
                playTick();
                setLang(prev => prev === 'en' ? 'hi' : 'en');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] text-xs font-mono-data font-bold text-[#1C1917] dark:text-white hover:border-[#8E6F1D] transition-all cursor-pointer shadow-xs"
              title={isHi ? 'भाषा बदलें (Switch to English)' : 'Change to Hindi'}
            >
              <Languages className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
              <span>{isHi ? 'English' : 'हिन्दी'}</span>
            </button>

            {/* City Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] text-xs font-mono-data">
              <Compass className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
              <select
                value={selectedCityId}
                onChange={(e) => { playTick(); setSelectedCityId(e.target.value); }}
                className="bg-transparent font-bold text-[#1C1917] dark:text-white outline-none cursor-pointer"
              >
                {CITIES.map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#161826] text-[#1C1917] dark:text-white">
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Jump to Today Button */}
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1.5 rounded-xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 bg-white dark:bg-[#161826] text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#060709] transition-all cursor-pointer shadow-sm"
            >
              {isHi ? 'आज का दिन' : 'Today'}
            </button>

            {/* Prev / Next Month Buttons */}
            <div className="inline-flex items-center rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161826] p-0.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-[#57524A] dark:text-[#D1C9BF] hover:bg-[#8E6F1D]/10 hover:text-[#8E6F1D] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                title={isHi ? 'पिछला मास' : 'Previous Month'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-[#57524A] dark:text-[#D1C9BF] hover:bg-[#8E6F1D]/10 hover:text-[#8E6F1D] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                title={isHi ? 'अगला मास' : 'Next Month'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Personal Energy Matrix & Filter Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF7F2] dark:bg-[#121422] p-4 rounded-2xl border border-black/5 dark:border-white/5">
          
          {/* Active Profile Switcher */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 border border-[#8E6F1D]/30 flex items-center justify-center flex-shrink-0 text-[#8E6F1D] dark:text-[#F0C968]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono-data uppercase tracking-wider text-[#78716C]">
                {isHi ? 'सक्रिय परिवार सदस्य:' : 'Active Parivaar Profile:'}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={activeProfId}
                  onChange={(e) => { playTick(); setActiveProfId(e.target.value); }}
                  className="bg-transparent font-bold text-sm text-[#1C1917] dark:text-white outline-none cursor-pointer"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-[#121422] text-[#1C1917] dark:text-white">
                      {isHi ? (p.nameHi || p.name) : p.name} ({isHi ? (p.relationHi || p.relation || 'सदस्य') : (p.relation || 'Member')})
                    </option>
                  ))}
                </select>
                {activeProfile && (
                  <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#F0C968]">
                    {isHi 
                      ? `जन्म नक्षत्र #${toHindiDigits((activeProfile.birthNakshatraIndex !== undefined ? activeProfile.birthNakshatraIndex : 3) + 1)}`
                      : `Nakshatra #${(activeProfile.birthNakshatraIndex !== undefined ? activeProfile.birthNakshatraIndex : 3) + 1}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Energy Filter Counters & Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { playTick(); setEnergyFilter('ALL'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer border ${
                energyFilter === 'ALL'
                  ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] border-[#8E6F1D]'
                  : 'bg-white dark:bg-[#161826] text-[#78716C] border-black/10 dark:border-white/10 hover:border-[#8E6F1D]'
              }`}
            >
              {isHi ? `समस्त (${toHindiDigits(monthData.daysInMonth)})` : `All (${monthData.daysInMonth})`}
            </button>
            <button
              onClick={() => { playTick(); setEnergyFilter('POWER'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                energyFilter === 'POWER'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isHi ? `🌟 ${toHindiDigits(monthData.powerDaysCount)} शुभ ऊर्जा दिवस` : `🌟 ${monthData.powerDaysCount} Power Days`}</span>
            </button>
            <button
              onClick={() => { playTick(); setEnergyFilter('CAUTION'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                energyFilter === 'CAUTION'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/30 hover:bg-red-500/20'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-red-500" />
              <span>{isHi ? `⚠️ ${toHindiDigits(monthData.cautionDaysCount)} सावधानी दिवस` : `⚠️ ${monthData.cautionDaysCount} Caution Days`}</span>
            </button>
            <button
              onClick={() => { playTick(); setEnergyFilter('FESTIVALS'); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                energyFilter === 'FESTIVALS'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
              }`}
            >
              <span>{isHi ? `🪔 ${toHindiDigits(monthData.festivalsCount)} प्रमुख पर्व` : `🪔 ${monthData.festivalsCount} Festivals`}</span>
            </button>
          </div>
        </div>

        {/* 3. The 7-Column Calendar Grid */}
        <div className="space-y-2">
          
          {/* Weekday Column Headers (Sun to Sat) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-mono-data font-bold text-[11px] sm:text-xs">
            <div className="text-red-500 py-1">
              <span>{isHi ? 'रवि' : 'SUN'}</span> 
              <div className="text-[10px] font-mono-data text-[#78716C]">{isHi ? 'रविवार' : 'Sun'}</div>
            </div>
            <div className="text-[#1C1917] dark:text-[#EFECE6] py-1">
              <span>{isHi ? 'सोम' : 'MON'}</span> 
              <div className="text-[10px] font-mono-data text-[#78716C]">{isHi ? 'सोमवार' : 'Mon'}</div>
            </div>
            <div className="text-[#1C1917] dark:text-[#EFECE6] py-1">
              <span>{isHi ? 'मंगल' : 'TUE'}</span> 
              <div className="text-[10px] font-mono-data text-[#78716C]">{isHi ? 'मंगलवार' : 'Tue'}</div>
            </div>
            <div className="text-[#1C1917] dark:text-[#EFECE6] py-1">
              <span>{isHi ? 'बुध' : 'WED'}</span> 
              <div className="text-[10px] font-mono-data text-[#78716C]">{isHi ? 'बुधवार' : 'Wed'}</div>
            </div>
            <div className="text-[#1C1917] dark:text-[#EFECE6] py-1">
              <span>{isHi ? 'गुरु' : 'THU'}</span> 
              <div className="text-[10px] font-mono-data text-[#78716C]">{isHi ? 'गुरुवार' : 'Thu'}</div>
            </div>
            <div className="text-[#1C1917] dark:text-[#EFECE6] py-1">
              <span>{isHi ? 'शुक्र' : 'FRI'}</span> 
              <div className="text-[10px] font-mono-data text-[#78716C]">{isHi ? 'शुक्रवार' : 'Fri'}</div>
            </div>
            <div className="text-[#1C1917] dark:text-[#EFECE6] py-1">
              <span>{isHi ? 'शनि' : 'SAT'}</span> 
              <div className="text-[10px] font-mono-data text-[#78716C]">{isHi ? 'शनिवार' : 'Sat'}</div>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            
            {/* Blank offset padding cells before 1st of month */}
            {Array.from({ length: monthData.firstDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="min-h-[115px] sm:min-h-[135px] rounded-2xl bg-black/[0.02] dark:bg-white/[0.01] border border-dashed border-black/5 dark:border-white/5 opacity-30" />
            ))}

            {/* Daily Panchang Cards */}
            {monthData.days.map((day: PanchangDayData) => {
              const isToday = day.dateString === todayKey;
              const isPower = day.personalEnergy?.status === 'POWER';
              const isCaution = day.personalEnergy?.status === 'CAUTION';
              const hasFestival = day.festivals.length > 0;

              // Filter match check
              let isMatch = true;
              if (energyFilter === 'POWER') isMatch = isPower;
              if (energyFilter === 'CAUTION') isMatch = isCaution;
              if (energyFilter === 'FESTIVALS') isMatch = hasFestival;

              // Highlight Classes
              let borderClass = 'border-black/10 dark:border-white/10';
              let bgClass = 'bg-white dark:bg-[#121422]';

              if (isToday) {
                borderClass = 'border-[#8E6F1D] dark:border-[#D4AF37] ring-2 ring-[#8E6F1D]/40 shadow-md';
                bgClass = 'bg-[#FAF7F2] dark:bg-[#161828]';
              } else if (isPower) {
                borderClass = 'border-amber-400/80 dark:border-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.15)]';
                bgClass = 'bg-gradient-to-br from-amber-500/10 to-transparent dark:bg-[#131718]';
              } else if (isCaution) {
                borderClass = 'border-red-400/80 dark:border-red-400/70 shadow-[0_0_12px_rgba(239,68,68,0.12)]';
                bgClass = 'bg-gradient-to-br from-red-500/10 to-transparent dark:bg-[#181116]';
              }

              if (!isMatch) {
                return (
                  <div 
                    key={day.dateString} 
                    className="min-h-[115px] sm:min-h-[135px] p-2 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] opacity-30 flex flex-col justify-between"
                  >
                    <span className="font-mono-data text-xs text-[#78716C]">{day.dayNumber}</span>
                  </div>
                );
              }

              return (
                <div
                  key={day.dateString}
                  onClick={() => handleOpenDayInspector(day)}
                  className={`min-h-[115px] sm:min-h-[135px] p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${borderClass} ${bgClass} hover:scale-[1.02] hover:shadow-lg`}
                >
                  
                  {/* Cell Top Bar: Dual Date Header (English Date + Hindi Date & Moon Phase) */}
                  <div>
                    <div className="flex items-center justify-between gap-1 border-b border-black/5 dark:border-white/5 pb-1 mb-1">
                      {/* Left: English Date Number & Month Abbreviation */}
                      <div className="flex items-baseline gap-1">
                        <span className={`font-editorial font-extrabold text-base sm:text-lg leading-none ${
                          isToday 
                            ? 'text-[#8E6F1D] dark:text-[#F0C968] underline decoration-2' 
                            : 'text-[#1C1917] dark:text-white'
                        }`}>
                          {day.dayNumber}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-mono-data font-bold uppercase text-[#8E6F1D] dark:text-[#F0C968]">
                          {ALL_MONTHS[currentMonth].shortEn}
                        </span>
                      </div>

                      {/* Right: Hindi Date & Tithi Number + Moon Phase Icon */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] sm:text-[11px] font-mono-data font-bold text-[#78716C] dark:text-[#A8A29E]" title="हिन्दी तिथि संख्या">
                          {toHindiDigits(day.dayNumber)} ({toHindiDigits(day.tithi.index > 15 ? day.tithi.index - 15 : day.tithi.index)})
                        </span>
                        <span className="text-xs" title={day.moonPhase.phaseName}>
                          {day.moonPhase.icon}
                        </span>
                      </div>
                    </div>

                    {/* Tithi with Paksha Dot */}
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] font-mono-data font-bold line-clamp-1">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        day.tithi.paksha === 'Shukla Paksha' ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]' : 'bg-indigo-400'
                      }`} />
                      <span className="text-[#1C1917] dark:text-[#EFECE6] truncate font-bold">
                        {isHi ? day.tithi.nameHi : `${day.tithi.paksha === 'Shukla Paksha' ? 'Shukla' : 'Krishna'} ${day.tithi.name}`}
                      </span>
                    </div>

                    {/* Nakshatra */}
                    <div className="text-[9px] sm:text-[10px] font-mono-data text-[#57524A] dark:text-[#D1C9BF] line-clamp-1 mt-0.5">
                      ✦ {isHi ? `${day.nakshatra.nameHi} (पाद ${toHindiDigits(day.nakshatra.pada)})` : `${day.nakshatra.name} (P${day.nakshatra.pada})`}
                    </div>
                  </div>

                  {/* Cell Bottom: Personal Energy Pill & Festival Banner */}
                  <div className="space-y-1 mt-1">
                    
                    {/* Festival Badge */}
                    {hasFestival && (
                      <div className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[8px] sm:text-[9px] font-mono-data font-bold line-clamp-1 border border-purple-500/30">
                        🪔 {isHi ? day.festivals[0].nameHi : day.festivals[0].name}
                      </div>
                    )}

                    {/* Personal Power/Caution Indicator */}
                    {isPower && (
                      <div className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[8px] sm:text-[9px] font-mono-data font-bold flex items-center gap-1 line-clamp-1 border border-amber-500/30">
                        <Sparkles className="w-2.5 h-2.5 flex-shrink-0" />
                        <span>{isHi ? '🌟 शुभ ऊर्जा' : '🌟 POWER'}</span>
                      </div>
                    )}
                    {isCaution && (
                      <div className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-800 dark:text-red-300 text-[8px] sm:text-[9px] font-mono-data font-bold flex items-center gap-1 line-clamp-1 border border-red-500/30">
                        <ShieldAlert className="w-2.5 h-2.5 flex-shrink-0" />
                        <span>{isHi ? '⚠️ सावधानी' : '⚠️ CAUTION'}</span>
                      </div>
                    )}

                    {/* Rahu Kaal Mini Indicator */}
                    <div className="text-[8px] font-mono-data text-[#78716C] dark:text-[#A8A29E] flex items-center justify-between">
                      <span>{isHi ? `राहु: ${toHindiDigits(day.timings.rahuKaal.start.split(' ')[0])}` : `Rahu: ${day.timings.rahuKaal.start.split(' ')[0]}`}</span>
                      {day.timings.abhijitMuhurat && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{isHi ? 'शुभ' : 'Abhijit'}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Calendar Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 border-t border-black/10 dark:border-white/10 text-xs font-mono-data text-[#78716C] dark:text-[#A8A29E]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>{isHi ? 'शुक्ल पक्ष (चान्द्र वृद्धि)' : 'Shukla Paksha (Waxing Moon)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>{isHi ? 'कृष्ण पक्ष (चान्द्र क्षय)' : 'Krishna Paksha (Waning Moon)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-400" />
            <span>{isHi ? '🌟 शुभ ऊर्जा दिवस (सम्पत्, क्षेम, साधना, मित्र)' : '🌟 Power Day (Sampat, Kshema, Sadhana, Mitra)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-red-500/20 border border-red-400" />
            <span>{isHi ? '⚠️ सावधानी दिवस (विपत्, प्रत्यक्, निधन, अष्टम चन्द्र)' : '⚠️ Caution Day (Vipat, Pratyak, Naidhana, Ashtama Chandra)'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{isHi ? '🪔 प्रमुख व्रत एवं पर्व' : '🪔 Major Festivals & Vrats'}</span>
          </div>
        </div>
      </div>

      {/* 5. Deep-Dive Day Inspector Modal / Drawer */}
      {inspectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/45 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin">
            
            {/* Modal Top Bar */}
            <div className="flex items-start justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] text-xs font-mono-data font-bold flex-wrap">
                  <span>{isHi ? inspectedDay.dayNameHi : inspectedDay.dayName}</span>
                  <span>•</span>
                  <span>{inspectedDay.dayNumber} {ALL_MONTHS[currentMonth].en} {currentYear}</span>
                  <span>•</span>
                  <span>दिनांक: {toHindiDigits(inspectedDay.dayNumber)} {ALL_MONTHS[currentMonth].hi}</span>
                </div>
                <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white mt-1">
                  {isHi ? 'दैनिक पञ्चाङ्ग व ऊर्जा विश्लेषण' : 'Daily Panchang & Personal Energy Matrix'}
                </h3>
                <div className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968] font-bold mt-1">
                  🕉️ {monthData.lunarMonthHi} मास ({monthData.lunarMonth}) • {inspectedDay.tithi.paksha === 'Shukla Paksha' ? (isHi ? 'शुक्ल पक्ष' : 'Shukla Paksha') : (isHi ? 'कृष्ण पक्ष' : 'Krishna Paksha')} {inspectedDay.tithi.nameHi} • विक्रम संवत् {toHindiDigits(monthData.vikramSamvat)}
                </div>
              </div>

              <button
                onClick={() => setInspectedDay(null)}
                className="p-2 rounded-xl text-[#78716C] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Personal Energy Status Banner */}
            {inspectedDay.personalEnergy && (
              <div className={`p-4 rounded-2xl border ${
                inspectedDay.personalEnergy.status === 'POWER'
                  ? 'bg-amber-500/10 border-amber-400/50 text-amber-900 dark:text-amber-200'
                  : inspectedDay.personalEnergy.status === 'CAUTION'
                  ? 'bg-red-500/10 border-red-400/50 text-red-900 dark:text-red-200'
                  : 'bg-[#8E6F1D]/10 border-[#8E6F1D]/30 text-[#1C1917] dark:text-white'
              } space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <div className="font-editorial font-bold text-base flex items-center gap-1.5">
                    {inspectedDay.personalEnergy.status === 'POWER' && <Sparkles className="w-4 h-4 text-amber-500" />}
                    {inspectedDay.personalEnergy.status === 'CAUTION' && <ShieldAlert className="w-4 h-4 text-red-500" />}
                    <span>
                      {isHi 
                        ? `${inspectedDay.personalEnergy.badgeLabelHi} (${activeProfile?.nameHi || activeProfile?.name || 'आपके लिए'})` 
                        : `${inspectedDay.personalEnergy.badgeLabel} for ${activeProfile?.name || 'You'}`}
                    </span>
                  </div>
                  <span className="text-xs font-mono-data font-bold">
                    {isHi ? `तारा: ${inspectedDay.personalEnergy.taraNameHi}` : `Tara: ${inspectedDay.personalEnergy.taraName}`}
                  </span>
                </div>
                <p className="text-xs font-mono-data leading-relaxed">
                  {isHi 
                    ? `${inspectedDay.personalEnergy.taraDescHi} ${inspectedDay.personalEnergy.chandraHouseDescHi}` 
                    : `${inspectedDay.personalEnergy.taraDesc} ${inspectedDay.personalEnergy.chandraHouseDesc}`}
                </p>
                <div className="text-xs font-mono-data font-bold pt-1 border-t border-black/5 dark:border-white/5">
                  {isHi ? `मार्गदर्शन: ${inspectedDay.personalEnergy.adviceHi}` : `Guidance: ${inspectedDay.personalEnergy.advice}`}
                </div>
              </div>
            )}

            {/* Festivals on this day */}
            {inspectedDay.festivals.length > 0 && (
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                <div className="text-xs font-mono-data font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{isHi ? '🪔 प्रमुख व्रत एवं पर्व' : '🪔 Festivals & Vrats'}</span>
                </div>
                <div className="space-y-1.5">
                  {inspectedDay.festivals.map((f, idx) => (
                    <div key={idx} className="text-xs font-mono-data">
                      <strong className="text-[#1C1917] dark:text-white font-bold">{isHi ? f.nameHi : `${f.nameHi} (${f.name})`}</strong>: {f.type}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* The 5 Limbs of Panchanga (पञ्चाङ्ग) */}
            <div className="space-y-3">
              <h4 className="font-editorial font-bold text-lg text-[#1C1917] dark:text-white">
                {isHi ? 'पञ्चाङ्ग के पाँच अंग' : 'The 5 Astronomical Limbs (पञ्चाङ्ग)'}
              </h4>
              <div className="grid sm:grid-cols-2 gap-3 text-xs font-mono-data">
                {/* 1. Tithi */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-1">
                  <span className="text-[#8E6F1D] dark:text-[#F0C968] font-bold">{isHi ? '१. तिथि:' : '1. Tithi:'}</span>
                  <div className="text-[#1C1917] dark:text-white font-bold text-sm">
                    {isHi ? inspectedDay.tithi.nameHi : `${inspectedDay.tithi.nameHi} (${inspectedDay.tithi.name})`}
                  </div>
                  <div className="text-[11px] text-[#78716C]">
                    {inspectedDay.tithi.paksha === 'Shukla Paksha' ? (isHi ? 'शुक्ल पक्ष' : 'Shukla Paksha') : (isHi ? 'कृष्ण पक्ष' : 'Krishna Paksha')} • {inspectedDay.tithi.meaning}
                  </div>
                </div>

                {/* 2. Nakshatra */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-1">
                  <span className="text-[#8E6F1D] dark:text-[#F0C968] font-bold">{isHi ? '२. नक्षत्र:' : '2. Nakshatra:'}</span>
                  <div className="text-[#1C1917] dark:text-white font-bold text-sm">
                    {isHi ? inspectedDay.nakshatra.nameHi : `${inspectedDay.nakshatra.nameHi} (${inspectedDay.nakshatra.name})`}
                  </div>
                  <div className="text-[11px] text-[#78716C]">
                    {isHi 
                      ? `पाद ${toHindiDigits(inspectedDay.nakshatra.pada)} • स्वामी: ${LORD_HI_MAP[inspectedDay.nakshatra.lord] || inspectedDay.nakshatra.lord} • देवता: ${inspectedDay.nakshatra.deity}`
                      : `Pada ${inspectedDay.nakshatra.pada} • Lord: ${inspectedDay.nakshatra.lord} • Deity: ${inspectedDay.nakshatra.deity}`}
                  </div>
                </div>

                {/* 3. Yoga */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-1">
                  <span className="text-[#8E6F1D] dark:text-[#F0C968] font-bold">{isHi ? '३. योग:' : '3. Yoga:'}</span>
                  <div className="text-[#1C1917] dark:text-white font-bold text-sm">
                    {isHi ? inspectedDay.yoga.nameHi : `${inspectedDay.yoga.nameHi} (${inspectedDay.yoga.name})`}
                  </div>
                  <div className="text-[11px] text-[#78716C]">
                    {isHi ? `गुण: ${inspectedDay.yoga.qualityHi}` : `Quality: ${inspectedDay.yoga.quality}`}
                  </div>
                </div>

                {/* 4. Karana */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-1">
                  <span className="text-[#8E6F1D] dark:text-[#F0C968] font-bold">{isHi ? '४. करण:' : '4. Karana:'}</span>
                  <div className="text-[#1C1917] dark:text-white font-bold text-sm">
                    {isHi ? inspectedDay.karana.nameHi : `${inspectedDay.karana.nameHi} (${inspectedDay.karana.name})`}
                  </div>
                  <div className="text-[11px] text-[#78716C]">
                    {isHi ? `प्रकार: ${inspectedDay.karana.typeHi}` : `Type: ${inspectedDay.karana.type}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Muhurats Grid: Shubh vs Ashubh */}
            <div className="grid sm:grid-cols-2 gap-4">
              
              {/* Auspicious Muhurats */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="font-editorial font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{isHi ? 'शुभ मुहूर्त' : 'Auspicious Windows (शुभ मुहूर्त)'}</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono-data">
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>{isHi ? 'अभिजित मुहूर्त:' : 'Abhijit Muhurat:'}</span>
                    <span>
                      {inspectedDay.timings.abhijitMuhurat 
                        ? (isHi 
                            ? `${toHindiDigits(inspectedDay.timings.abhijitMuhurat.start)} - ${toHindiDigits(inspectedDay.timings.abhijitMuhurat.end)}`
                            : `${inspectedDay.timings.abhijitMuhurat.start} - ${inspectedDay.timings.abhijitMuhurat.end}`)
                        : (isHi ? 'बुधवार को वर्जित' : 'Excluded on Wed')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isHi ? 'ब्रह्म मुहूर्त:' : 'Brahma Muhurat:'}</span>
                    <span>{isHi ? `${toHindiDigits(inspectedDay.timings.brahmaMuhurat.start)} - ${toHindiDigits(inspectedDay.timings.brahmaMuhurat.end)}` : `${inspectedDay.timings.brahmaMuhurat.start} - ${inspectedDay.timings.brahmaMuhurat.end}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isHi ? 'अमृत काल:' : 'Amrit Kaal:'}</span>
                    <span>{isHi ? `${toHindiDigits(inspectedDay.timings.amritKaal.start)} - ${toHindiDigits(inspectedDay.timings.amritKaal.end)}` : `${inspectedDay.timings.amritKaal.start} - ${inspectedDay.timings.amritKaal.end}`}</span>
                  </div>
                </div>
              </div>

              {/* Inauspicious Caution Windows */}
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
                <div className="font-editorial font-bold text-red-800 dark:text-red-300 text-sm flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>{isHi ? 'अशुभ काल (वर्ज्य काल)' : 'Caution Windows (अशुभ काल)'}</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono-data">
                  <div className="flex justify-between text-red-700 dark:text-red-400 font-bold">
                    <span>{isHi ? 'राहुकाल:' : 'Rahu Kaal:'}</span>
                    <span>{isHi ? `${toHindiDigits(inspectedDay.timings.rahuKaal.start)} - ${toHindiDigits(inspectedDay.timings.rahuKaal.end)}` : `${inspectedDay.timings.rahuKaal.start} - ${inspectedDay.timings.rahuKaal.end}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isHi ? 'यमगण्ड:' : 'Yamaganda:'}</span>
                    <span>{isHi ? `${toHindiDigits(inspectedDay.timings.yamaganda.start)} - ${toHindiDigits(inspectedDay.timings.yamaganda.end)}` : `${inspectedDay.timings.yamaganda.start} - ${inspectedDay.timings.yamaganda.end}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isHi ? 'गुलिक काल:' : 'Gulika Kaal:'}</span>
                    <span>{isHi ? `${toHindiDigits(inspectedDay.timings.gulikaKaal.start)} - ${toHindiDigits(inspectedDay.timings.gulikaKaal.end)}` : `${inspectedDay.timings.gulikaKaal.start} - ${inspectedDay.timings.gulikaKaal.end}`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sun & Moon Astronomy */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-data">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>
                  {isHi 
                    ? `सूर्योदय: ${toHindiDigits(inspectedDay.timings.sunrise)} • सूर्यास्त: ${toHindiDigits(inspectedDay.timings.sunset)}`
                    : `Sunrise: ${inspectedDay.timings.sunrise} • Sunset: ${inspectedDay.timings.sunset}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>
                  {isHi 
                    ? `चन्द्रोदय: ${toHindiDigits(inspectedDay.timings.moonrise)} • चन्द्रास्त: ${toHindiDigits(inspectedDay.timings.moonset)}`
                    : `Moonrise: ${inspectedDay.timings.moonrise} • Moonset: ${inspectedDay.timings.moonset}`}
                </span>
              </div>
            </div>

            {/* Modal Actions: 1-Click WhatsApp, Google Calendar, Apple iCal Download */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-black/10 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleShareDayWhatsApp(inspectedDay)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono-data font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleAddToGoogleCalendar(inspectedDay)}
                  className="px-3.5 py-2 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] text-xs font-mono-data font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  title="Add this day and Shubh Muhurat to Google Calendar"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Google Calendar</span>
                </button>

                <button
                  onClick={() => handleDownloadIcs(inspectedDay)}
                  className="px-3.5 py-2 rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#161826] text-xs font-mono-data font-bold text-[#57524A] dark:text-[#D1C9BF] hover:border-[#8E6F1D] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Download .ics file for Apple iCal and Outlook"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.ics Export</span>
                </button>
              </div>

              <button
                onClick={() => setInspectedDay(null)}
                className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161826] text-xs font-mono-data font-bold hover:bg-black/5 transition-all cursor-pointer"
              >
                {isHi ? 'बन्द करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

