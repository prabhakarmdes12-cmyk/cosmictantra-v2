'use client';

/**
 * AURA MONTHLY CALENDAR — compact first-fold redesign (CALENDAR_UI_PLAN.md)
 * -----------------------------------------------------------------------------
 * Desktop: 7-column grid, rows 1–3 fully visible in the first fold (grid
 * starts ≤ Y=190px from viewport top on 1080p).
 * Mobile:  compact 48px 7-column cells — date number, moon phase dot,
 * event badge dot, today outline. Tap → Day Detail Sheet.
 *
 * Controls:  [सभी पर्व ▾] [सभी तिथि ▾] [सभी नक्षत्र ▾]  +  [माह | सूची | वर्ष]
 * All dates/tithis/festivals come from calculateMonthPanchang — zero
 * hardcoded dates.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Sparkles, ShieldAlert, User, X,
  Languages, ChevronDown, List, LayoutGrid, CalendarRange, Filter
} from 'lucide-react';
import {
  calculateMonthPanchang,
  PanchangDayData,
  MonthPanchangOverview,
  NAKSHATRAS_DATA,
  TITHIS_DATA,
} from '@/engines/monthlyPanchangEngine';
import { getProfiles } from '@/lib/profileStore';
import { CITIES } from '@/lib/cities';
import { playTick } from '@/lib/chitiAudio';
import { useActiveLocation } from '@/lib/location/useActiveLocation';
import { persistActiveLocation } from '@/lib/location/activeLocation';
import { pickDayArtwork } from '@/lib/calendar/eventArtwork';
import { getWorldCalendarReading, WorldCalendarSystemId } from '@/lib/calendar/worldCalendarEngine';
import { toHindiDigits } from './DayDetailSheet';

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
  { index: 11, en: 'December', hi: 'दिसंबर', shortEn: 'Dec', shortHi: 'दिसं', vedicMaas: 'मार्गशीर्ष - पौष', vedicMaasEn: 'Margashirsha - Pausha' },
];

type FestivalFilter = 'all' | 'major' | 'ekadashi' | 'pradosh' | 'purnima' | 'amavasya' | 'vrata';
type TithiFilter = 'all' | number; // 1..15 within paksha
type NakshatraFilter = 'all' | number; // 0..26
type CalendarViewMode = 'month' | 'list' | 'year';

interface AuraMonthlyCalendarProps {
  initialLang?: string;
  onSwitchToToday?: () => void;
  systemId?: WorldCalendarSystemId;
  onOpenDay?: (day: PanchangDayData) => void;
  /** Controlled month context (shared with the other calendar tabs). */
  year?: number;
  month?: number;
  onMonthChange?: (year: number, month: number) => void;
}

// -------------------------------------------------------------
// Compact filter dropdown
// -------------------------------------------------------------
interface FilterDropdownProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}

function FilterDropdown({ label, options, value, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeOption = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => { playTick(); setOpen((v) => !v); }}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono-data font-bold transition-all cursor-pointer ${
          value !== 'all'
            ? 'bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 border-[#8E6F1D]/50 dark:border-[#D4AF37]/50 text-[#8E6F1D] dark:text-[#F0C968]'
            : 'bg-white dark:bg-[#121522] border-black/10 dark:border-white/10 text-[#57524A] dark:text-[#D1C9BF] hover:border-[#8E6F1D]/40'
        }`}
      >
        <Filter className="w-3 h-3" />
        <span className="max-w-[110px] truncate">{activeOption?.label || label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-40 w-52 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 shadow-2xl p-1.5 scrollbar-thin">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { playTick(); onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] font-mono-data transition-colors cursor-pointer ${
                o.value === value
                  ? 'bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] font-bold'
                  : 'text-[#57524A] dark:text-[#D1C9BF] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Main component
// -------------------------------------------------------------
export default function AuraMonthlyCalendar({
  initialLang,
  onSwitchToToday,
  systemId = 'drik',
  onOpenDay,
  year,
  month,
  onMonthChange,
}: AuraMonthlyCalendarProps) {
  const now = new Date();
  const [innerYear, setInnerYear] = useState<number>(now.getFullYear());
  const [innerMonth, setInnerMonth] = useState<number>(now.getMonth());
  const currentYear = year ?? innerYear;
  const currentMonth = month ?? innerMonth;
  const goToMonth = (y: number, m: number) => {
    if (onMonthChange) onMonthChange(y, m);
    else {
      setInnerYear(y);
      setInnerMonth(m);
    }
  };
  const [selectedCityId, setSelectedCityId] = useState<string>('patna');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfId, setActiveProfId] = useState<string>('pf_default');
  const [lang, setLang] = useState<string>(initialLang || 'hi');

  // Compact filters
  const [festivalFilter, setFestivalFilter] = useState<FestivalFilter>('all');
  const [tithiFilter, setTithiFilter] = useState<TithiFilter>('all');
  const [nakshatraFilter, setNakshatraFilter] = useState<NakshatraFilter>('all');
  // View toggle
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  const isHi = lang === 'hi';
  const { location } = useActiveLocation();

  useEffect(() => {
    const list = getProfiles() || [];
    setProfiles(list);
  }, []);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfId) || profiles[0] || null,
    [profiles, activeProfId]
  );

  const currentCityObj = useMemo(() => {
    if (location.status === 'KNOWN' && location.lat !== null && location.lng !== null) {
      return {
        name: location.name,
        nameHi: location.nameHi || location.name,
        lat: location.lat,
        lng: location.lng,
        tz: location.tz ?? 5.5,
      };
    }
    const found = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
    return { name: found.name, nameHi: (found as any).nameHi || found.name, lat: found.lat, lng: found.lng, tz: found.tz || 5.5 };
  }, [location, selectedCityId]);

  const monthData: MonthPanchangOverview | null = useMemo(() => {
    if (!currentCityObj) return null;
    const profileParams =
      activeProfile &&
      activeProfile.birthNakshatraIndex !== undefined &&
      activeProfile.birthRasiIndex !== undefined
        ? {
            birthNakshatraIndex: activeProfile.birthNakshatraIndex,
            birthRasiIndex: activeProfile.birthRasiIndex,
          }
        : undefined;
    return calculateMonthPanchang(currentYear, currentMonth, currentCityObj.lat, currentCityObj.lng, currentCityObj.tz, profileParams);
  }, [currentYear, currentMonth, currentCityObj, activeProfile]);

  // Year overview (for वर्ष view)
  const yearOverview = useMemo(() => {
    if (!currentCityObj) return null;
    const months: MonthPanchangOverview[] = [];
    for (let m = 0; m < 12; m++) {
      months.push(calculateMonthPanchang(currentYear, m, currentCityObj.lat, currentCityObj.lng, currentCityObj.tz));
    }
    return months;
  }, [currentYear, currentCityObj]);

  // Parallel-date labels for the selected world calendar system
  const parallelLabels = useMemo(() => {
    if (!monthData) return [];
    return monthData.days.map((day) => {
      try {
        const [y, m, d] = day.dateString.split('-').map(Number);
        return getWorldCalendarReading(new Date(y, m - 1, d), systemId, {
          name: currentCityObj.name,
          lat: currentCityObj.lat,
          lng: currentCityObj.lng,
          tz: currentCityObj.tz,
        }).compactHi;
      } catch {
        return '';
      }
    });
  }, [monthData, systemId, currentCityObj]);

  const handlePrevMonth = () => {
    playTick();
    if (currentMonth === 0) goToMonth(currentYear - 1, 11);
    else goToMonth(currentYear, currentMonth - 1);
  };

  const handleNextMonth = () => {
    playTick();
    if (currentMonth === 11) goToMonth(currentYear + 1, 0);
    else goToMonth(currentYear, currentMonth + 1);
  };

  const handleJumpToToday = () => {
    playTick();
    const t = new Date();
    goToMonth(t.getFullYear(), t.getMonth());
    if (onSwitchToToday) onSwitchToToday();
  };

  const todayKey = now.toISOString().slice(0, 10);

  // ---------------- filter predicates ----------------
  const matchesFestivalFilter = (day: PanchangDayData): boolean => {
    if (festivalFilter === 'all') return true;
    if (festivalFilter === 'major') return day.festivals.some((f) => f.isImportant && f.type === 'Major Festival');
    if (festivalFilter === 'vrata') return day.festivals.some((f) => f.type === 'Vrat');
    if (festivalFilter === 'ekadashi') return day.festivals.some((f) => f.nameHi.includes('एकादशी'));
    if (festivalFilter === 'pradosh') return day.festivals.some((f) => f.nameHi.includes('प्रदोष'));
    if (festivalFilter === 'purnima') return day.tithi.isPurnima;
    if (festivalFilter === 'amavasya') return day.tithi.isAmavasya;
    return true;
  };

  const matchesTithiFilter = (day: PanchangDayData): boolean => {
    if (tithiFilter === 'all') return true;
    return ((day.tithi.index - 1) % 15) + 1 === tithiFilter;
  };

  const matchesNakshatraFilter = (day: PanchangDayData): boolean => {
    if (nakshatraFilter === 'all') return true;
    return day.nakshatra.index === nakshatraFilter;
  };

  const festivalFilterOptions = [
    { value: 'all', label: isHi ? 'सभी पर्व' : 'All Festivals' },
    { value: 'major', label: isHi ? 'प्रमुख पर्व' : 'Major Festivals' },
    { value: 'vrata', label: isHi ? 'सभी व्रत' : 'All Vrats' },
    { value: 'ekadashi', label: isHi ? 'एकादशी' : 'Ekadashi' },
    { value: 'pradosh', label: isHi ? 'प्रदोष' : 'Pradosh' },
    { value: 'purnima', label: isHi ? 'पूर्णिमा' : 'Purnima' },
    { value: 'amavasya', label: isHi ? 'अमावस्या' : 'Amavasya' },
  ];

  const tithiFilterOptions = [
    { value: 'all', label: isHi ? 'सभी तिथि' : 'All Tithis' },
    ...Array.from({ length: 15 }, (_, i) => {
      const t = TITHIS_DATA[i];
      const suffix = i + 1 === 15
        ? (isHi ? ' (पूर्णिमा/अमावस्या)' : ' (Purnima/Amavasya)')
        : '';
      return {
        value: String(i + 1),
        label: isHi ? `${t.nameHi}${suffix}` : `${t.name}${suffix}`,
      };
    }),
  ];

  const nakshatraFilterOptions = [
    { value: 'all', label: isHi ? 'सभी नक्षत्र' : 'All Nakshatras' },
    ...NAKSHATRAS_DATA.map((n, idx) => ({
      value: String(idx),
      label: isHi ? n.nameHi : n.name,
    })),
  ];

  const filtersActive = festivalFilter !== 'all' || tithiFilter !== 'all' || nakshatraFilter !== 'all';

  if (!currentCityObj || !monthData) {
    return (
      <div data-testid="calendar-city-prompt" className="bg-white/90 dark:bg-[#0E101D]/90 backdrop-blur-md rounded-3xl border border-amber-500/40 p-8 text-center shadow-xl">
        <h2 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-white">
          Choose a city to see this month&apos;s Panchang
        </h2>
        <p className="mt-2 text-xs font-mono-data text-[#696256] dark:text-[#9E988D]">
          Sunrise, Rahu Kalam and Vedic days depend on location — nothing is calculated for a guessed city.
        </p>
      </div>
    );
  }

  // ---------------- month navigation + title ----------------
  const monthTitle = (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handlePrevMonth}
        className="p-1.5 rounded-lg text-[#57524A] dark:text-[#D1C9BF] hover:bg-[#8E6F1D]/10 hover:text-[#8E6F1D] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
        title={isHi ? 'पिछला मास' : 'Previous month'}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-editorial font-bold text-[13px] sm:text-sm text-[#1C1917] dark:text-white whitespace-nowrap">
        {ALL_MONTHS[currentMonth].en} {currentYear} <span className="text-[#8E6F1D] dark:text-[#F0C968] font-normal">/ {ALL_MONTHS[currentMonth].hi} {toHindiDigits(currentYear)}</span>
      </span>
      <button
        type="button"
        onClick={handleNextMonth}
        className="p-1.5 rounded-lg text-[#57524A] dark:text-[#D1C9BF] hover:bg-[#8E6F1D]/10 hover:text-[#8E6F1D] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
        title={isHi ? 'अगला मास' : 'Next month'}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-2.5">
      {/* ============ COMPACT CONTROL ROW ============ */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-white/90 dark:bg-[#0E101D]/90 backdrop-blur-md rounded-2xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 px-2.5 sm:px-3 py-2 shadow-sm">
        {monthTitle}

        <button
          type="button"
          onClick={handleJumpToToday}
          className="px-2.5 py-1.5 rounded-xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 bg-white dark:bg-[#121522] text-[11px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#060709] transition-all cursor-pointer shrink-0"
        >
          {isHi ? 'आज' : 'Today'}
        </button>

        <div className="flex-1" />

        {/* Filters (month/list views) */}
        {viewMode !== 'year' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <FilterDropdown
              label={isHi ? 'सभी पर्व' : 'All Festivals'}
              options={festivalFilterOptions}
              value={String(festivalFilter)}
              onChange={(v) => setFestivalFilter(v as FestivalFilter)}
            />
            <FilterDropdown
              label={isHi ? 'सभी तिथि' : 'All Tithis'}
              options={tithiFilterOptions}
              value={String(tithiFilter)}
              onChange={(v) => setTithiFilter(v === 'all' ? 'all' : Number(v))}
            />
            <FilterDropdown
              label={isHi ? 'सभी नक्षत्र' : 'All Nakshatras'}
              options={nakshatraFilterOptions}
              value={String(nakshatraFilter)}
              onChange={(v) => setNakshatraFilter(v === 'all' ? 'all' : Number(v))}
            />
            {filtersActive && (
              <button
                type="button"
                onClick={() => { playTick(); setFestivalFilter('all'); setTithiFilter('all'); setNakshatraFilter('all'); }}
                className="p-1.5 rounded-lg text-[#78716C] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title={isHi ? 'फ़िल्टर हटाएँ' : 'Clear filters'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* View toggle: माह | सूची | वर्ष */}
        <div className="inline-flex items-center rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#121522] p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => { playTick(); setViewMode('month'); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono-data font-bold transition-all cursor-pointer ${
              viewMode === 'month' ? 'bg-white dark:bg-[#0E101D] text-[#8E6F1D] dark:text-[#F0C968] shadow-sm' : 'text-[#78716C] dark:text-[#A8A29E]'
            }`}
            title={isHi ? 'माह दृश्य' : 'Month grid'}
          >
            <LayoutGrid className="w-3 h-3" /> {isHi ? 'माह' : 'Month'}
          </button>
          <button
            type="button"
            onClick={() => { playTick(); setViewMode('list'); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono-data font-bold transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-white dark:bg-[#0E101D] text-[#8E6F1D] dark:text-[#F0C968] shadow-sm' : 'text-[#78716C] dark:text-[#A8A29E]'
            }`}
            title={isHi ? 'सूची दृश्य' : 'List view'}
          >
            <List className="w-3 h-3" /> {isHi ? 'सूची' : 'List'}
          </button>
          <button
            type="button"
            onClick={() => { playTick(); setViewMode('year'); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono-data font-bold transition-all cursor-pointer ${
              viewMode === 'year' ? 'bg-white dark:bg-[#0E101D] text-[#8E6F1D] dark:text-[#F0C968] shadow-sm' : 'text-[#78716C] dark:text-[#A8A29E]'
            }`}
            title={isHi ? 'वर्ष दृश्य' : 'Year overview'}
          >
            <CalendarRange className="w-3 h-3" /> {isHi ? 'वर्ष' : 'Year'}
          </button>
        </div>

        {/* Profile (personal energy) */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#121522] text-[11px] font-mono-data">
          <User className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
          <select
            value={activeProfId}
            onChange={(e) => { playTick(); setActiveProfId(e.target.value); }}
            className="bg-transparent font-bold text-[#1C1917] dark:text-white outline-none cursor-pointer max-w-[110px]"
            title={isHi ? 'परिवार प्रोफ़ाइल' : 'Parivaar profile'}
          >
            {profiles.length === 0 && <option value="pf_default">{isHi ? 'कोई प्रोफ़ाइल नहीं' : 'No profile'}</option>}
            {profiles.map((p) => (
              <option key={p.id} value={p.id} className="bg-white dark:bg-[#121422] text-[#1C1917] dark:text-white">
                {isHi ? p.nameHi || p.name : p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <button
          type="button"
          onClick={() => { playTick(); setLang((prev) => (prev === 'en' ? 'hi' : 'en')); }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#121522] text-[11px] font-mono-data font-bold text-[#1C1917] dark:text-white hover:border-[#8E6F1D] transition-all cursor-pointer shrink-0"
          title={isHi ? 'भाषा बदलें (Switch to English)' : 'Change to Hindi'}
        >
          <Languages className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
          <span>{isHi ? 'EN' : 'हिं'}</span>
        </button>
      </div>

      {/* ============ MONTH CONTEXT STRIP (compact) ============ */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[10px] sm:text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
        <span className="font-bold text-[#8E6F1D] dark:text-[#F0C968]">🕉️ {monthData.lunarMonthHi} मास ({monthData.lunarMonth})</span>
        <span>•</span>
        <span>{isHi ? `विक्रम संवत् ${toHindiDigits(monthData.vikramSamvat)}` : `Vikram Samvat ${monthData.vikramSamvat}`}</span>
        <span>•</span>
        <span>{monthData.rituHi} ({monthData.ritu})</span>
        <span>•</span>
        <span>{monthData.ayanaHi}</span>
        <span className="flex-1" />
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {isHi ? `${toHindiDigits(monthData.powerDaysCount)} शुभ` : `${monthData.powerDaysCount} power`}
          </span>
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-500" />
            {isHi ? `${toHindiDigits(monthData.cautionDaysCount)} सावधानी` : `${monthData.cautionDaysCount} caution`}
          </span>
          <span className="flex items-center gap-1">
            🪔 {isHi ? `${toHindiDigits(monthData.festivalsCount)} पर्व` : `${monthData.festivalsCount} festivals`}
          </span>
        </span>
      </div>

      {/* ============ VIEW: MONTH GRID ============ */}
      {viewMode === 'month' && (
        <div className="space-y-1.5">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-mono-data font-bold text-[10px] sm:text-[11px]">
            {([
              ['रवि', 'Sun'], ['सोम', 'Mon'], ['मंगल', 'Tue'], ['बुध', 'Wed'], ['गुरु', 'Thu'], ['शुक्र', 'Fri'], ['शनि', 'Sat'],
            ] as Array<[string, string]>).map(([hi, en], idx) => (
              <div key={en} className={`py-0.5 sm:py-1 ${idx === 0 ? 'text-red-500' : 'text-[#1C1917] dark:text-[#EFECE6]'}`}>
                <span>{isHi ? hi : en}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: monthData.firstDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-12 sm:min-h-[118px] rounded-xl sm:rounded-2xl bg-black/[0.02] dark:bg-white/[0.01] border border-dashed border-black/5 dark:border-white/5 opacity-30" />
            ))}

            {monthData.days.map((day, dayIdx) => {
              const isToday = day.dateString === todayKey;
              const isPower = day.personalEnergy?.status === 'POWER';
              const isCaution = day.personalEnergy?.status === 'CAUTION';
              const hasFestival = day.festivals.length > 0;

              const isMatch = matchesFestivalFilter(day) && matchesTithiFilter(day) && matchesNakshatraFilter(day);
              const artwork = pickDayArtwork(day);

              let borderClass = 'border-black/10 dark:border-white/10';
              let bgClass = 'bg-white dark:bg-[#121422]';
              if (isToday) {
                borderClass = 'border-[#8E6F1D] dark:border-[#D4AF37] ring-2 ring-[#8E6F1D]/40 dark:ring-[#D4AF37]/40 shadow-md';
                bgClass = 'bg-[#FAF7F2] dark:bg-[#161828]';
              } else if (isPower) {
                borderClass = 'border-amber-400/70 dark:border-amber-400/50';
                bgClass = 'bg-gradient-to-br from-amber-500/10 to-transparent dark:bg-[#131718]';
              } else if (isCaution) {
                borderClass = 'border-red-400/70 dark:border-red-400/50';
                bgClass = 'bg-gradient-to-br from-red-500/10 to-transparent dark:bg-[#181116]';
              }

              if (!isMatch) {
                return (
                  <div key={day.dateString} className="h-12 sm:min-h-[118px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] opacity-25 flex flex-col justify-between">
                    <span className="font-mono-data text-[10px] sm:text-xs text-[#78716C]">{day.dayNumber}</span>
                  </div>
                );
              }

              return (
                <button
                  key={day.dateString}
                  type="button"
                  onClick={() => { playTick(); if (onOpenDay) onOpenDay(day); }}
                  className={`text-left h-12 sm:min-h-[118px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group overflow-hidden ${borderClass} ${bgClass} hover:scale-[1.02] hover:shadow-lg`}
                  aria-label={`${day.dateString} — ${day.tithi.nameHi}`}
                >
                  {/* ---- MOBILE COMPACT LAYOUT (48px) ---- */}
                  <div className="sm:hidden flex flex-col justify-between h-full">
                    <div className="flex items-center justify-between gap-0.5">
                      <span className={`text-[11px] font-mono-data font-extrabold leading-none ${isToday ? 'text-[#8E6F1D] dark:text-[#F0C968]' : 'text-[#1C1917] dark:text-white'}`}>
                        {day.dayNumber}
                      </span>
                      <span className="flex items-center gap-0.5">
                        {hasFestival && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.9)]" />}
                        {isPower && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        {isCaution && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        <span className="text-[9px] leading-none">{day.moonPhase.icon}</span>
                      </span>
                    </div>
                    <div className="text-[8px] font-mono-data text-[#57524A] dark:text-[#D1C9BF] truncate leading-tight">
                      {day.tithi.nameHi}
                    </div>
                  </div>

                  {/* ---- DESKTOP RICH LAYOUT ---- */}
                  <div className="hidden sm:flex flex-col justify-between h-full">
                    {artwork && (
                      <div className="relative w-full h-12 rounded-lg overflow-hidden mb-1.5 bg-[#14100A]">
                        <img
                          src={artwork.imagePath}
                          alt={artwork.nameHi}
                          className={`w-full h-full object-cover ${artwork.isMajor ? '' : 'opacity-90'}`}
                          loading="lazy"
                          onError={(e) => { const wrap = (e.currentTarget as HTMLImageElement).parentElement; if (wrap) wrap.style.display = 'none'; }}
                        />
                        {!artwork.isMajor && (
                          <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-black/50 text-white text-[7px] font-mono-data">{artwork.nameHi}</span>
                        )}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-editorial font-extrabold text-sm leading-none ${isToday ? 'text-[#8E6F1D] dark:text-[#F0C968]' : 'text-[#1C1917] dark:text-white'}`}>
                          {day.dayNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-[9px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                            {toHindiDigits(((day.tithi.index - 1) % 15) + 1)}
                          </span>
                          <span className="text-[11px] leading-none" title={day.moonPhase.phaseName}>{day.moonPhase.icon}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[10px] font-mono-data font-bold line-clamp-1">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${day.tithi.paksha === 'Shukla Paksha' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                        <span className="text-[#1C1917] dark:text-[#EFECE6] truncate">{day.tithi.nameHi}</span>
                      </div>

                      <div className="text-[9px] font-mono-data text-[#57524A] dark:text-[#D1C9BF] line-clamp-1 mt-0.5">
                        ✦ {day.nakshatra.nameHi} (P{toHindiDigits(day.nakshatra.pada)})
                      </div>

                      {parallelLabels[dayIdx] && (
                        <div className="text-[8px] font-mono-data text-[#78716C] dark:text-[#A8A29E] line-clamp-1 mt-0.5 opacity-80">
                          🌍 {parallelLabels[dayIdx]}
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5 mt-1">
                      {hasFestival && (
                        <div className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[8px] font-mono-data font-bold line-clamp-1 border border-purple-500/30">
                          🪔 {day.festivals[0].nameHi}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[8px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                        <span className="flex items-center gap-1">
                          {isPower && <Sparkles className="w-2.5 h-2.5 text-amber-500" />}
                          {isCaution && <ShieldAlert className="w-2.5 h-2.5 text-red-500" />}
                          <span>राहु {toHindiDigits(day.timings.rahuKaal.start.split(' ')[0])}</span>
                        </span>
                        {day.timings.abhijitMuhurat && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">अभिजित ✓</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ MOBILE TODAY PREVIEW BOX (CALENDAR_UI_PLAN §2) ============
          Shown below the grid on <sm screens: sunrise/sunset, Tithi,
          Nakshatra, Yoga, Karana + top 3 upcoming festivals. */}
      {viewMode === 'month' && monthData.days.find((d) => d.dateString === todayKey) && (() => {
        const todayDay = monthData.days.find((d) => d.dateString === todayKey)!;
        const upcoming: string[] = [];
        for (const d of monthData.days) {
          if (d.dateString < todayKey) continue;
          for (const f of d.festivals) {
            if (f.isImportant && !upcoming.includes(f.nameHi)) upcoming.push(f.nameHi);
            if (upcoming.length >= 3) break;
          }
          if (upcoming.length >= 3) break;
        }
        return (
          <div className="sm:hidden mt-3 p-3 rounded-2xl bg-white dark:bg-[#121422] border border-[#8E6F1D]/35 dark:border-[#D4AF37]/35 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-editorial font-bold text-[#1C1917] dark:text-white">
                🙏 आज — {todayDay.dayNameHi}
              </span>
              <span className="text-[10px] font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
                🌅 {toHindiDigits(todayDay.timings.sunrise)} • 🌇 {toHindiDigits(todayDay.timings.sunset)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center text-[9px] font-mono-data">
              <div className="p-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                <div className="text-[8px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">तिथि</div>
                <div className="font-bold text-[#1C1917] dark:text-white leading-tight">{todayDay.tithi.nameHi}</div>
              </div>
              <div className="p-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                <div className="text-[8px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">नक्षत्र</div>
                <div className="font-bold text-[#1C1917] dark:text-white leading-tight">{todayDay.nakshatra.nameHi}</div>
              </div>
              <div className="p-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                <div className="text-[8px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">योग</div>
                <div className="font-bold text-[#1C1917] dark:text-white leading-tight">{todayDay.yoga.nameHi}</div>
              </div>
              <div className="p-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                <div className="text-[8px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">करण</div>
                <div className="font-bold text-[#1C1917] dark:text-white leading-tight">{todayDay.karana.nameHi}</div>
              </div>
            </div>
            {upcoming.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono-data">
                <span className="font-bold text-[#78716C] dark:text-[#A8A29E]">अगले पर्व:</span>
                {upcoming.map((n, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/25 font-bold">
                    🪔 {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ============ VIEW: LIST (सूची) ============ */}
      {viewMode === 'list' && (
        <div className="space-y-1.5">
          {monthData.days.map((day, dayIdx) => {
            const isToday = day.dateString === todayKey;
            const isMatch = matchesFestivalFilter(day) && matchesTithiFilter(day) && matchesNakshatraFilter(day);
            const artwork = pickDayArtwork(day);
            if (!isMatch) return null;
            return (
              <button
                key={day.dateString}
                type="button"
                onClick={() => { playTick(); if (onOpenDay) onOpenDay(day); }}
                className={`w-full flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isToday
                    ? 'bg-[#FAF7F2] dark:bg-[#161828] border-[#8E6F1D] dark:border-[#D4AF37] ring-1 ring-[#8E6F1D]/30'
                    : 'bg-white dark:bg-[#121422] border-black/10 dark:border-white/10 hover:border-[#8E6F1D]/50'
                }`}
              >
                <div className={`w-10 sm:w-12 shrink-0 text-center rounded-xl border px-1 py-1 ${isToday ? 'border-[#8E6F1D]/40 bg-[#8E6F1D]/10' : 'border-black/5 dark:border-white/5 bg-[#FAF7F2] dark:bg-[#161826]'}`}>
                  <div className={`text-sm font-editorial font-extrabold leading-none ${isToday ? 'text-[#8E6F1D] dark:text-[#F0C968]' : 'text-[#1C1917] dark:text-white'}`}>
                    {day.dayNumber}
                  </div>
                  <div className="text-[8px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                    {ALL_MONTHS[currentMonth].shortEn} {day.dayOfWeek === 0 ? 'रवि' : day.dayOfWeek === 1 ? 'सोम' : day.dayOfWeek === 2 ? 'मंग' : day.dayOfWeek === 3 ? 'बुध' : day.dayOfWeek === 4 ? 'गुरु' : day.dayOfWeek === 5 ? 'शुक्र' : 'शनि'}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {day.moonPhase.icon}
                    <span className="text-[11px] sm:text-xs font-mono-data font-bold text-[#1C1917] dark:text-white truncate">
                      {day.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'} {day.tithi.nameHi}
                    </span>
                    <span className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E] truncate">
                      • {day.nakshatra.nameHi} (P{toHindiDigits(day.nakshatra.pada)}) • {day.yoga.nameHi}
                    </span>
                  </div>
                  {day.festivals.length > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {day.festivals.slice(0, 2).map((f, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[9px] font-mono-data font-bold border border-purple-500/30 truncate max-w-[180px]">
                          🪔 {f.nameHi}
                        </span>
                      ))}
                    </div>
                  )}
                  {parallelLabels[dayIdx] && (
                    <div className="text-[9px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-0.5">🌍 {parallelLabels[dayIdx]}</div>
                  )}
                </div>

                {artwork && (
                  <img
                    src={artwork.imagePath}
                    alt={artwork.nameHi}
                    className="hidden sm:block w-20 h-11 object-cover rounded-lg shrink-0"
                    loading="lazy"
                    onError={(e) => { const wrap = (e.currentTarget as HTMLImageElement).parentElement; if (wrap) wrap.style.display = 'none'; }}
                  />
                )}

                <div className="hidden md:block text-right shrink-0 text-[10px] font-mono-data space-y-0.5">
                  <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {day.timings.abhijitMuhurat ? `⏱ ${day.timings.abhijitMuhurat.start}` : 'बुध — वर्जित'}
                  </div>
                  <div className="text-rose-700 dark:text-rose-400">
                    ☄ {day.timings.rahuKaal.start}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ============ VIEW: YEAR (वर्ष) ============ */}
      {viewMode === 'year' && yearOverview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {yearOverview.map((m) => {
            const isActive = m.month === currentMonth;
            return (
              <button
                key={m.month}
                type="button"
                onClick={() => { playTick(); goToMonth(currentYear, m.month); setViewMode('month'); }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FAF7F2] dark:bg-[#161828] border-[#8E6F1D] dark:border-[#D4AF37] ring-1 ring-[#8E6F1D]/40'
                    : 'bg-white dark:bg-[#121422] border-black/10 dark:border-white/10 hover:border-[#8E6F1D]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-editorial font-bold text-sm text-[#1C1917] dark:text-white">
                    {isHi ? ALL_MONTHS[m.month].hi : ALL_MONTHS[m.month].en}
                  </span>
                  <span className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                    {isHi ? toHindiDigits(m.year) : m.year}
                  </span>
                </div>
                <div className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-1 truncate">
                  🕉️ {m.lunarMonthHi} मास
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono-data">
                  <span className="text-purple-700 dark:text-purple-300 font-bold">🪔 {toHindiDigits(m.festivalsCount)}</span>
                  <span className="text-amber-700 dark:text-amber-300 font-bold">🌟 {toHindiDigits(m.powerDaysCount)}</span>
                  <span className="text-red-700 dark:text-red-300 font-bold">⚠ {toHindiDigits(m.cautionDaysCount)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ============ LEGEND ============ */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1 text-[10px] sm:text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> {isHi ? 'शुक्ल पक्ष' : 'Shukla Paksha'}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400" /> {isHi ? 'कृष्ण पक्ष' : 'Krishna Paksha'}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> {isHi ? 'पर्व/व्रत' : 'Festival/Vrat'}</span>
        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> {isHi ? 'शुभ ऊर्जा' : 'Power day'}</span>
        <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-red-500" /> {isHi ? 'सावधानी' : 'Caution day'}</span>
      </div>
    </div>
  );
}
