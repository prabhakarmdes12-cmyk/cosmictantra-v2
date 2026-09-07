'use client';

/**
 * UNIFIED PANCHANG CALENDAR CLIENT — compact command center (CALENDAR_UI_PLAN.md)
 * -----------------------------------------------------------------------------
 * First-fold redesign: no hero whitespace. Title bar + view tabs + compact
 * controls sit in ≤ ~140px, so the monthly grid begins at Y ≈ 190px and rows
 * 1–3 are fully visible in the first fold on desktop.
 *
 * View tabs:  आज | मासिक | त्योहार | मुहूर्त | व्रत एवं उत्सव | चन्द्रमा | सूर्य
 * View toggle (inside मासिक): माह | सूची | वर्ष
 * World Calendar Systems selector (9 systems) persisted to localStorage.
 * All data comes from the canonical engines — zero hardcoded dates.
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MapPin, Sparkles, ShieldAlert, Sun, CheckCircle,
  AlertTriangle, ChevronRight, ScrollText
} from 'lucide-react';
import { useActiveLocation } from '@/lib/location/useActiveLocation';
import { calculatePanchang } from '@/lib/panchang';
import { HINDI_DAYS, LocationCoordinates } from '@/lib/panchangFactBundle';
import {
  calculateMonthPanchang,
  PanchangDayData,
  LUNAR_MONTHS,
} from '@/engines/monthlyPanchangEngine';
import { playTick } from '@/lib/chitiAudio';
import AuraMonthlyCalendar, { ALL_MONTHS } from '@/components/calendar/AuraMonthlyCalendar';
import DayDetailSheet, { toHindiDigits } from '@/components/calendar/DayDetailSheet';
import ScholarPanchangPanel from '@/components/calendar/ScholarPanchangPanel';
import WorldCalendarSelectorModal, {
  readStoredCalendarSystem,
} from '@/components/calendar/WorldCalendarSelectorModal';
import { getDailyGuidance, getFestivalSignificanceHi } from '@/lib/calendar/vedaGuidance';
import { getScholarPanchang, ScholarPanchang } from '@/lib/calendar/scholarPanchang';
import { getArtworkForFestival, getTithiArtwork, pickDayArtwork, EventArtwork } from '@/lib/calendar/eventArtwork';
import { WorldCalendarSystemId } from '@/lib/calendar/worldCalendarEngine';

export const MAJOR_CITIES = [
  { id: 'varanasi', name: 'Varanasi', nameHi: 'वाराणसी', lat: 25.3176, lng: 82.9739, tz: 5.5 },
  { id: 'delhi', name: 'New Delhi', nameHi: 'नई दिल्ली', lat: 28.6139, lng: 77.209, tz: 5.5 },
  { id: 'mumbai', name: 'Mumbai', nameHi: 'मुम्बई', lat: 19.076, lng: 72.8777, tz: 5.5 },
  { id: 'bengaluru', name: 'Bengaluru', nameHi: 'बेंगलुरु', lat: 12.9716, lng: 77.5946, tz: 5.5 },
  { id: 'kolkata', name: 'Kolkata', nameHi: 'कोलकाता', lat: 22.5726, lng: 88.3639, tz: 5.5 },
  { id: 'chennai', name: 'Chennai', nameHi: 'चेन्नई', lat: 13.0827, lng: 80.2707, tz: 5.5 },
  { id: 'patna', name: 'Patna', nameHi: 'पटना', lat: 25.5941, lng: 85.1376, tz: 5.5 },
  { id: 'jaipur', name: 'Jaipur', nameHi: 'जयपुर', lat: 26.9124, lng: 75.7873, tz: 5.5 },
  { id: 'london', name: 'London', nameHi: 'लन्दन', lat: 51.5074, lng: -0.1278, tz: 0 },
  { id: 'new-york', name: 'New York', nameHi: 'न्यूयॉर्क', lat: 40.7128, lng: -74.006, tz: -5 },
];

const RASHI_NAMES_HI = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन'];

type CalendarTab = 'aaj' | 'maasik' | 'tyohar' | 'muhurat' | 'vrata' | 'chandra' | 'surya';

const TABS: Array<{ id: CalendarTab; label: string; emoji: string; testid?: string }> = [
  { id: 'aaj', label: 'आज', emoji: '🙏', testid: 'tab-view-today' },
  { id: 'maasik', label: 'मासिक', emoji: '📅', testid: 'tab-view-month' },
  { id: 'tyohar', label: 'त्योहार', emoji: '🪔' },
  { id: 'muhurat', label: 'मुहूर्त', emoji: '⏱' },
  { id: 'vrata', label: 'व्रत एवं उत्सव', emoji: '📿' },
  { id: 'chandra', label: 'चन्द्रमा', emoji: '🌙' },
  { id: 'surya', label: 'सूर्य', emoji: '☀️' },
];

function parseTime12ToMinutes(t: string): number {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(t || '');
  if (!m) return -1;
  let h = parseInt(m[1], 10) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + parseInt(m[2], 10);
}

interface UnifiedPanchangCalendarClientProps {
  defaultView?: 'today' | 'month';
}

function UnifiedPanchangCalendarClientInner({ defaultView = 'month' }: UnifiedPanchangCalendarClientProps) {
  const searchParams = useSearchParams();
  const urlView = searchParams.get('view');

  const [tab, setTab] = useState<CalendarTab>(() => {
    if (urlView === 'today') return 'aaj';
    if (urlView === 'month') return 'maasik';
    return defaultView === 'today' ? 'aaj' : 'maasik';
  });

  useEffect(() => {
    if (urlView === 'today') setTab('aaj');
    else if (urlView === 'month') setTab('maasik');
  }, [urlView]);

  const changeTab = (t: CalendarTab) => {
    playTick();
    setTab(t);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('view', t === 'aaj' ? 'today' : t === 'maasik' ? 'month' : 'section');
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  };

  const { location } = useActiveLocation();
  const now = new Date();

  const activeCity = useMemo(() => {
    if (location.status === 'KNOWN' && location.lat !== null && location.lng !== null) {
      return {
        id: location.name,
        name: location.name,
        nameHi: location.nameHi || location.name,
        lat: location.lat,
        lng: location.lng,
        tz: location.tz ?? 5.5,
      };
    }
    return MAJOR_CITIES[0];
  }, [location]);

  const locationCoords: LocationCoordinates = {
    id: activeCity.id,
    name: activeCity.name,
    nameHi: activeCity.nameHi,
    lat: activeCity.lat,
    lng: activeCity.lng,
    tz: activeCity.tz,
  };

  // Shared month context (drives मासिक + all month-scoped tabs)
  const [ctxYear, setCtxYear] = useState<number>(now.getFullYear());
  const [ctxMonth, setCtxMonth] = useState<number>(now.getMonth());
  const setMonthContext = (y: number, m: number) => {
    setCtxYear(y);
    setCtxMonth(m);
  };

  const [systemId, setSystemId] = useState<WorldCalendarSystemId>(() => readStoredCalendarSystem());
  const [selectedDay, setSelectedDay] = useState<PanchangDayData | null>(null);

  // Fast month data (no profile) shared by the non-monthly tabs
  const panelMonth = useMemo(
    () => calculateMonthPanchang(ctxYear, ctxMonth, activeCity.lat, activeCity.lng, activeCity.tz),
    [ctxYear, ctxMonth, activeCity]
  );

  // ================= TODAY (आज) DATA =================
  const todayData: PanchangDayData | null = useMemo(() => {
    const t = new Date();
    const m = calculateMonthPanchang(t.getFullYear(), t.getMonth(), activeCity.lat, activeCity.lng, activeCity.tz);
    return m.days[t.getDate() - 1] || null;
  }, [activeCity]);

  const todayPanchang = useMemo(() => {
    try {
      return calculatePanchang(new Date(), {
        lat: activeCity.lat,
        lng: activeCity.lng,
        tz: activeCity.tz,
        name: activeCity.name,
      }) as any;
    } catch {
      return null;
    }
  }, [activeCity]);

  const todayGuidance = useMemo(
    () => (todayData ? getDailyGuidance(todayData, new Date()) : null),
    [todayData]
  );

  // Today hero — the day's artwork (festival art, else tithi art) rendered
  // as a framed "thangka" background panel; primary festival for the headline.
  const todayArtwork = useMemo(
    () => (todayData ? pickDayArtwork(todayData) : null),
    [todayData]
  );
  const primaryTodayFestival = useMemo(
    () =>
      todayData
        ? todayData.festivals.find((f) => f.isImportant) || todayData.festivals[0] || null
        : null,
    [todayData]
  );

  // Paksha mood — Shukla: warm marigold daylight; Krishna: deep indigo
  // Diwali night. Drives the hero's base, scrims, glow and frame.
  const isShuklaPaksha = todayData ? todayData.tithi.paksha === 'Shukla Paksha' : true;
  const heroMood = isShuklaPaksha
    ? {
        base: '#160C05',
        scrim: '#0D0602',
        glow: 'rgba(245, 166, 60, 0.32)',
        frame: 'rgba(142, 111, 29, 0.55)',
        shadow: '0 12px 40px -16px rgba(212, 175, 55, 0.45)',
      }
    : {
        base: '#0A0E24',
        scrim: '#050818',
        glow: 'rgba(165, 180, 252, 0.3)',
        frame: 'rgba(129, 140, 248, 0.45)',
        shadow: '0 12px 40px -16px rgba(99, 102, 241, 0.5)',
      };

  const [todayScholarOpen, setTodayScholarOpen] = useState(false);
  const [todayScholar, setTodayScholar] = useState<ScholarPanchang | null>(null);
  useEffect(() => {
    if (!todayScholarOpen) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      try {
        const built = getScholarPanchang(new Date(), locationCoords);
        if (alive) setTodayScholar(built);
      } catch {
        if (alive) setTodayScholar(null);
      }
    }, 30);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [todayScholarOpen, locationCoords]);

  // ================= FESTIVALS (त्योहार) DATA =================
  const festivalItems = useMemo(() => {
    const items: Array<{ day: PanchangDayData; festival: { name: string; nameHi: string; type: string; isImportant: boolean }; artwork: EventArtwork | null; isToday: boolean }> = [];
    const nowD = new Date();
    const todayStr = nowD.toISOString().slice(0, 10);
    // The festival planner is forward-looking: if the month context lies in
    // the past, scan from the current month instead (no stale observances).
    const ctxStart = new Date(ctxYear, ctxMonth, 1);
    const nowStart = new Date(nowD.getFullYear(), nowD.getMonth(), 1);
    const scanStart = ctxStart < nowStart ? nowStart : ctxStart;
    for (let mOffset = 0; mOffset < 3; mOffset++) {
      const d = new Date(scanStart.getFullYear(), scanStart.getMonth() + mOffset, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const data = calculateMonthPanchang(y, m, activeCity.lat, activeCity.lng, activeCity.tz);
      for (const day of data.days) {
        if (day.dateString < todayStr) continue;
        for (const f of day.festivals) {
          items.push({
            day,
            festival: f,
            // Festival artwork first; tithi artwork guarantees a visual for
            // even minor vrats (100% day coverage strategy).
            artwork: getArtworkForFestival(f.nameHi, f.name) ?? getTithiArtwork(day.tithi),
            isToday: day.dateString === todayStr,
          });
        }
      }
    }
    items.sort((a, b) => (a.day.dateString < b.day.dateString ? -1 : 1));
    return items.slice(0, 24);
  }, [ctxYear, ctxMonth, activeCity]);

  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));

  const fmtDateHi = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${ALL_MONTHS[m - 1].hi} ${y}`;
  };

  return (
    <div className="space-y-2 sm:space-y-2.5 animate-fadeIn">
      {/* ============ ROW A: TITLE BAR ============ */}
      <div className="flex items-center gap-2 flex-wrap px-1">
        <h1 className="font-editorial text-base sm:text-lg font-bold text-[#1C1917] dark:text-white tracking-tight leading-none">
          🕉️ मासिक वैदिक पंचांग
          <span className="hidden sm:inline text-[#8E6F1D] dark:text-[#F0C968] font-normal"> • समय को जानें, जीवन को साधें</span>
        </h1>
        <div className="flex-1" />
        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#121522] border border-black/10 dark:border-white/10 text-[10px] sm:text-[11px] font-mono-data font-bold text-[#57524A] dark:text-[#D1C9BF]">
          <MapPin className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
          {activeCity.nameHi || activeCity.name}
        </span>
        <WorldCalendarSelectorModal value={systemId} onChange={setSystemId} />
      </div>

      {/* ============ ROW B: VIEW TABS ============ */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            data-testid={t.testid || `tab-${t.id}`}
            onClick={() => changeTab(t.id)}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-mono-data font-bold transition-all cursor-pointer border ${
              tab === t.id
                ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] border-[#8E6F1D] dark:border-[#D4AF37] shadow-sm'
                : 'bg-white dark:bg-[#121522] text-[#57524A] dark:text-[#D1C9BF] border-black/10 dark:border-white/10 hover:border-[#8E6F1D]/50'
            }`}
          >
            <span className="mr-1">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ TAB PANELS ============ */}

      {/* ---------- आज ---------- */}
      {tab === 'aaj' && todayData && todayGuidance && (
        <div className="space-y-2.5 animate-fadeIn">
          {/* ============ TODAY HERO — "framed thangka" panel ============
              The day's artwork (festival art, else tithi art) as a full-bleed
              background with layered warm scrim + gold frame. Vibrant India:
              tricolor hairline, marigold-kissed ink scrim, glass samvat
              chips, rangoli corner. All data from the canonical engines. */}
          <div
            className="relative overflow-hidden rounded-3xl border-2"
            style={{ backgroundColor: heroMood.base, borderColor: heroMood.frame, boxShadow: heroMood.shadow }}
          >
            {/* tricolor hairline — the quietest "Vibrant India" signature */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-orange-500/90 via-amber-100/80 to-green-600/90 z-30 pointer-events-none" />

            {todayArtwork ? (
              <img
                src={todayArtwork.imagePath}
                alt={todayArtwork.nameHi}
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="eager"
                fetchPriority="high"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}

            {/* layered scrim — paksha mood (Shukla: warm ink / Krishna: indigo night) */}
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(to top, ${heroMood.scrim}F2 0%, ${heroMood.scrim}59 45%, ${heroMood.scrim}1A 100%)` }}
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(to right, ${heroMood.scrim}99 0%, transparent 60%)` }}
            />
            <div
              className="absolute top-0 inset-x-0 h-16"
              style={{ background: `linear-gradient(to bottom, ${heroMood.scrim}73 0%, transparent 100%)` }}
            />
            {/* glow — diya lamp-light (Shukla) or moonlight (Krishna) behind the headline */}
            <div
              className="absolute -bottom-10 -left-10 w-80 h-80 rounded-full blur-2xl z-[5] pointer-events-none"
              style={{ background: `radial-gradient(circle at center, ${heroMood.glow} 0%, transparent 62%)` }}
            />

            <div className="relative z-10 flex items-stretch gap-3 px-4 sm:px-5 pt-10 sm:pt-14 pb-4 min-h-[10.5rem] sm:min-h-[12.5rem]">
              {/* sacred tricolor accent bar */}
              <div className="w-1 shrink-0 self-end rounded-full bg-gradient-to-b from-orange-400 via-[#F0C968] to-green-500" />
              <div className="flex-1 flex flex-col justify-end gap-1.5 sm:gap-2 min-w-0">
              {/* top-right glass chips (desktop) */}
              <div className="absolute top-3 right-3 hidden sm:flex items-center gap-1.5">
                {todayPanchang && (
                  <>
                    <span className="px-2 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/25 text-[10px] font-mono-data font-bold text-white">
                      संवत् {toHindiDigits(todayPanchang.samvat?.vikram || '')}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-white/15 backdrop-blur-md border border-white/25 text-[10px] font-mono-data font-bold text-white">
                      {todayPanchang.ayana?.nameHi}
                    </span>
                  </>
                )}
              </div>

              {/* rangoli corner (bottom-right) */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1 pointer-events-none" aria-hidden>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400/90" />
                <span className="w-2 h-2 rounded-full bg-[#F0C968]" />
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/90" />
              </div>

              {/* kicker + शुभ seal (festival days) */}
              <div className="flex items-center gap-2">
                <div className="text-[10px] sm:text-[11px] font-mono-data font-bold tracking-[0.2em] text-[#F0C968] drop-shadow">
                  {primaryTodayFestival ? '🪔 आज का पर्व' : '🙏 आज की तिथि'}
                </div>
                {primaryTodayFestival && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[#F0C968]/60 bg-[#F0C968]/15 ring-1 ring-[#F0C968]/25 ring-inset backdrop-blur-sm px-2 py-0.5 text-[9px] sm:text-[10px] font-mono-data font-bold tracking-wider text-[#F0C968]">
                    शुभ 🙏
                  </span>
                )}
              </div>

              {/* display headline — gold-leaf gradient on festival days */}
              <div
                className={`font-editorial font-bold text-2xl sm:text-[2rem] leading-tight drop-shadow-lg ${
                  primaryTodayFestival
                    ? 'bg-gradient-to-b from-[#FBEAB0] via-[#F0C968] to-[#C08A2E] bg-clip-text text-transparent'
                    : 'text-white'
                }`}
              >
                {primaryTodayFestival ? (
                  primaryTodayFestival.nameHi
                ) : (
                  <>
                    {todayData.tithi.nameHi}
                    <span className="text-white/65 text-lg sm:text-xl font-semibold"> • {todayData.nakshatra.nameHi} नक्षत्र</span>
                  </>
                )}
              </div>

              {/* date line */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] font-mono-data text-white/85">
                <span className="font-bold text-white">
                  {HINDI_DAYS[now.getDay()]}, {now.getDate()} {ALL_MONTHS[now.getMonth()].hi} {now.getFullYear()}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#D4AF37] text-[#14100A] font-bold">
                  {todayData.lunarMonthHi} मास
                </span>
                {todayPanchang && (
                  <>
                    <span className="hidden sm:inline text-white/70">•</span>
                    <span className="hidden sm:inline text-white/70">{todayPanchang.ritu?.nameHi}</span>
                    <span className="text-white/70 sm:hidden">
                      संवत् {toHindiDigits(todayPanchang.samvat?.vikram || '')} • {todayPanchang.ritu?.nameHi}
                    </span>
                  </>
                )}
              </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-2.5">
            {/* Novice guidance */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#101221] border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 space-y-3">
              <div>
                <div className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">
                  आज का महत्व
                </div>
                <div className="font-editorial font-bold text-sm text-[#1C1917] dark:text-white mt-0.5">
                  {todayGuidance.headlineHi}
                </div>
                <p className="text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF] mt-1 leading-relaxed line-clamp-3">
                  {todayGuidance.significanceHi}
                </p>
              </div>

              {todayGuidance.rahuAlertHi && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-800 dark:text-rose-300 text-[11px] font-mono-data font-bold flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{todayGuidance.rahuAlertHi}</span>
                </div>
              )}
              {todayGuidance.abhijitAlertHi && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono-data font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{todayGuidance.abhijitAlertHi}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/25">
                  <div className="text-[10px] font-editorial font-bold text-emerald-800 dark:text-emerald-300 mb-1">क्या करें?</div>
                  <ul className="space-y-0.5">
                    {todayGuidance.doItems.map((item, i) => (
                      <li key={i} className="text-[10px] font-mono-data text-[#1C1917] dark:text-[#EFECE6] flex gap-1">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-500/25">
                  <div className="text-[10px] font-editorial font-bold text-rose-800 dark:text-rose-300 mb-1">किससे बचें?</div>
                  <ul className="space-y-0.5">
                    {todayGuidance.avoidItems.map((item, i) => (
                      <li key={i} className="text-[10px] font-mono-data text-[#1C1917] dark:text-[#EFECE6] flex gap-1">
                        <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 5 Limbs compact */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#101221] border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 space-y-2">
              <div className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">
                पञ्चाङ्ग के पाँच अंग
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px] sm:text-[11px] font-mono-data">
                <div className="p-2 rounded-lg bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <div className="text-[9px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">तिथि</div>
                  <div className="font-bold text-[#1C1917] dark:text-white">{todayData.tithi.nameHi}</div>
                  <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">{todayData.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <div className="text-[9px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">वार</div>
                  <div className="font-bold text-[#1C1917] dark:text-white">{todayData.dayNameHi}</div>
                  <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">{todayData.varaPlanet.split(' (')[0]}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <div className="text-[9px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">नक्षत्र</div>
                  <div className="font-bold text-[#1C1917] dark:text-white">{todayData.nakshatra.nameHi}</div>
                  <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">पाद {toHindiDigits(todayData.nakshatra.pada)}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <div className="text-[9px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">योग</div>
                  <div className="font-bold text-[#1C1917] dark:text-white">{todayData.yoga.nameHi}</div>
                  <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">{todayData.yoga.qualityHi}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <div className="text-[9px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">करण</div>
                  <div className="font-bold text-[#1C1917] dark:text-white">{todayData.karana.nameHi}</div>
                  <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">{todayData.karana.typeHi}</div>
                </div>
              </div>

              {/* Sun arc */}
              {todayPanchang && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono-data">
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Sun className="w-3 h-3" /> 🌅 {todayPanchang.sun?.sunrise || ''}
                    </span>
                    <span className="text-[#78716C] dark:text-[#A8A29E]">{todayPanchang.solarArcProgress ?? 0}% दिन व्यतीत</span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      🌇 {todayPanchang.sun?.sunset || ''} <Sun className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EFECE6] dark:bg-[#1F1F33] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-[#8E6F1D] dark:to-[#D4AF37]"
                      style={{ width: `${todayPanchang.solarArcProgress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Muhurat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/25 flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono-data">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> अभिजित मुहूर्त
                </div>
                <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">सर्वकार्य सिद्धिदायक</div>
              </div>
              <span className="text-[11px] font-mono-data font-bold text-emerald-700 dark:text-emerald-300">
                {todayData.timings.abhijitMuhurat
                  ? `${todayData.timings.abhijitMuhurat.start} – ${todayData.timings.abhijitMuhurat.end}`
                  : 'बुधवार — वर्जित'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/25 flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono-data">
                <div className="font-bold text-emerald-800 dark:text-emerald-300">ब्रह्म मुहूर्त</div>
                <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">ध्यान हेतु श्रेष्ठ</div>
              </div>
              <span className="text-[11px] font-mono-data font-bold text-emerald-700 dark:text-emerald-300">
                {todayData.timings.brahmaMuhurat.start} – {todayData.timings.brahmaMuhurat.end}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-500/25 flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono-data">
                <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> राहु काल (वर्जित)
                </div>
                <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">नए कार्य वर्जित</div>
              </div>
              <span className="text-[11px] font-mono-data font-bold text-rose-700 dark:text-rose-300">
                {todayData.timings.rahuKaal.start} – {todayData.timings.rahuKaal.end}
              </span>
            </div>
          </div>

          {/* Scholar toggle */}
          <button
            type="button"
            onClick={() => { playTick(); setTodayScholarOpen((v) => !v); }}
            className="w-full p-3 rounded-2xl bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ScrollText className="w-4 h-4" />
            {todayScholarOpen ? 'विस्तृत पञ्चाङ्ग बंद करें ▲' : '📜 विस्तृत पञ्चाङ्ग खोलें (Scholar Mode — Lahiri 24°13′40″, Choghadiya, Hora, Samvat)'}
          </button>

          {todayScholarOpen && (
            <div className="animate-fadeIn">
              {!todayScholar ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#8E6F1D] border-t-transparent rounded-full mx-auto animate-spin" />
                  <p className="text-xs font-mono-data text-[#78716C] dark:text-[#A8A29E]">सिद्धान्त गणना चालू... (Canonical transition solver)</p>
                </div>
              ) : (
                <ScholarPanchangPanel
                  scholar={todayScholar}
                  date={now}
                  location={locationCoords}
                  weekdayNameHi={HINDI_DAYS[now.getDay()]}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------- मासिक ---------- */}
      {tab === 'maasik' && (
        <AuraMonthlyCalendar
          initialLang="hi"
          systemId={systemId}
          onOpenDay={(d) => setSelectedDay(d)}
          year={ctxYear}
          month={ctxMonth}
          onMonthChange={setMonthContext}
          onSwitchToToday={() => changeTab('aaj')}
        />
      )}

      {/* ---------- त्योहार ---------- */}
      {tab === 'tyohar' && (
        <div className="space-y-2.5 animate-fadeIn">
          <div className="px-1 text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
            🪔 अगले तिमाही के प्रमुख त्योहार व व्रत ({ALL_MONTHS[ctxMonth].hi} से) • 16:9 कला-चित्र सहित
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {festivalItems.map((item, idx) => (
              <div
                key={`${item.day.dateString}-${idx}`}
                className={`flex gap-3 p-2.5 rounded-2xl border ${
                  item.isToday
                    ? 'bg-[#FAF7F2] dark:bg-[#161828] border-[#8E6F1D] dark:border-[#D4AF37]'
                    : 'bg-white dark:bg-[#121422] border-black/10 dark:border-white/10'
                }`}
              >
                <div className="w-28 sm:w-40 shrink-0 aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-[#2A2118] to-[#14100A] flex items-center justify-center">
                  {item.artwork ? (
                    <img
                      src={item.artwork.imagePath}
                      alt={item.artwork.nameHi}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { const wrap = (e.currentTarget as HTMLImageElement).parentElement; if (wrap) wrap.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-2xl opacity-60">🪔</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-editorial font-bold text-xs sm:text-sm text-[#1C1917] dark:text-white truncate">
                      {item.festival.nameHi}
                    </span>
                    {item.isToday && <span className="px-1.5 py-0.5 rounded bg-[#D4AF37] text-[#060709] text-[9px] font-mono-data font-bold">आज</span>}
                  </div>
                  <div className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                    {item.festival.name} • {fmtDateHi(item.day.dateString)}
                  </div>
                  <div className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] mt-0.5">
                    {item.day.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'} {item.day.tithi.nameHi} • {item.day.nakshatra.nameHi}
                  </div>
                  <p className="text-[10px] font-mono-data text-[#57524A] dark:text-[#D1C9BF] mt-1 line-clamp-2 leading-snug">
                    {getFestivalSignificanceHi(item.festival.nameHi, item.festival.name, item.day.tithi.meaning)}
                  </p>
                  <button
                    type="button"
                    onClick={() => { playTick(); setSelectedDay(item.day); }}
                    className="mt-auto self-start text-[10px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:underline cursor-pointer flex items-center gap-0.5 pt-1"
                  >
                    इस दिन का पूरा पंचांग देखें <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- मुहूर्त ---------- */}
      {tab === 'muhurat' && (
        <div className="space-y-2.5 animate-fadeIn">
          <div className="px-1 text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
            ⏱ {ALL_MONTHS[ctxMonth].hi} {ctxYear} — दैनिक मुहूर्त सारणी • अभिजित बुधवार को वर्जित • स्थान: {activeCity.nameHi || activeCity.name}
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#101221] overflow-hidden">
            {/* Desktop table */}
            <table className="hidden md:table w-full text-[11px] font-mono-data">
              <thead>
                <tr className="bg-[#FAF7F2] dark:bg-[#161826] text-[#78716C] dark:text-[#A8A29E] text-left">
                  <th className="p-2.5 font-bold">दिनांक</th>
                  <th className="p-2.5 font-bold">वार</th>
                  <th className="p-2.5 font-bold">ब्रह्म</th>
                  <th className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">अभिजित</th>
                  <th className="p-2.5 font-bold">अमृत काल</th>
                  <th className="p-2.5 font-bold text-rose-700 dark:text-rose-400">राहु काल</th>
                  <th className="p-2.5 font-bold">यमगण्ड</th>
                </tr>
              </thead>
              <tbody>
                {panelMonth.days.map((day) => {
                  const isToday = day.dateString === todayStr;
                  return (
                    <tr
                      key={day.dateString}
                      onClick={() => { playTick(); setSelectedDay(day); }}
                      className={`border-t border-black/5 dark:border-white/5 cursor-pointer transition-colors ${
                        isToday ? 'bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <td className="p-2.5 font-bold text-[#1C1917] dark:text-white">
                        {day.dayNumber} {ALL_MONTHS[ctxMonth].shortEn} {isToday && <span className="text-[#8E6F1D] dark:text-[#F0C968]">(आज)</span>}
                      </td>
                      <td className="p-2.5 text-[#57524A] dark:text-[#D1C9BF]">{day.dayNameHi.slice(0, 4)}</td>
                      <td className="p-2.5">{day.timings.brahmaMuhurat.start}</td>
                      <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        {day.timings.abhijitMuhurat ? `${day.timings.abhijitMuhurat.start} – ${day.timings.abhijitMuhurat.end}` : '— (बुध)'}
                      </td>
                      <td className="p-2.5">{day.timings.amritKaal.start}</td>
                      <td className="p-2.5 text-rose-700 dark:text-rose-400">{day.timings.rahuKaal.start} – {day.timings.rahuKaal.end}</td>
                      <td className="p-2.5">{day.timings.yamaganda.start}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
              {panelMonth.days.map((day) => {
                const isToday = day.dateString === todayStr;
                return (
                  <button
                    key={day.dateString}
                    type="button"
                    onClick={() => { playTick(); setSelectedDay(day); }}
                    className={`w-full text-left p-3 cursor-pointer ${isToday ? 'bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C1917] dark:text-white">
                        {day.dayNumber} {ALL_MONTHS[ctxMonth].hi} • {day.dayNameHi}
                      </span>
                      <span className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">🌅 {day.timings.sunrise}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] font-mono-data">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        ⏱ {day.timings.abhijitMuhurat ? day.timings.abhijitMuhurat.start : 'बुध — वर्जित'}
                      </span>
                      <span className="text-rose-700 dark:text-rose-400">☄ {day.timings.rahuKaal.start} – {day.timings.rahuKaal.end}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------- व्रत एवं उत्सव ---------- */}
      {tab === 'vrata' && (
        <div className="space-y-2.5 animate-fadeIn">
          <div className="px-1 text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
            📿 {ALL_MONTHS[ctxMonth].hi} {ctxYear} — व्रत एवं उत्सव (पारम्परिक नियमों से गणना-निर्रुद्ध)
          </div>
          <div className="space-y-2">
            {panelMonth.days.filter((d) => d.festivals.length > 0).map((day) => {
              const artwork = pickDayArtwork(day);
              const primary = day.festivals.find((f) => f.isImportant) || day.festivals[0];
              return (
                <div key={day.dateString} className="flex gap-3 p-2.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#121422]">
                  {artwork && (
                    <div className="w-20 sm:w-28 shrink-0 aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[#2A2118] to-[#14100A]">
                      <img
                        src={artwork.imagePath}
                        alt={artwork.nameHi}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { const wrap = (e.currentTarget as HTMLImageElement).parentElement; if (wrap) wrap.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-editorial font-bold text-xs sm:text-sm text-[#1C1917] dark:text-white">
                        {primary.nameHi}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#F0C968] text-[9px] font-mono-data font-bold">
                        {primary.type}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                      {fmtDateHi(day.dateString)} • {day.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'} {day.tithi.nameHi}
                    </div>
                    <p className="text-[10px] font-mono-data text-[#57524A] dark:text-[#D1C9BF] mt-1 line-clamp-2 leading-snug">
                      {getFestivalSignificanceHi(primary.nameHi, primary.name, day.tithi.meaning)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { playTick(); setSelectedDay(day); }}
                    className="self-center p-1.5 rounded-lg text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D]/10 transition-colors cursor-pointer shrink-0"
                    aria-label="पूरा पंचांग"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- चन्द्रमा ---------- */}
      {tab === 'chandra' && (
        <div className="space-y-2.5 animate-fadeIn">
          <div className="px-1 text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
            🌙 {ALL_MONTHS[ctxMonth].hi} {ctxYear} — चंद्र चक्र सारणी • चंद्रोदय/चन्द्रास्त स्थान-आधारित
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#101221] overflow-hidden divide-y divide-black/5 dark:divide-white/5">
            {panelMonth.days.map((day) => {
              const isToday = day.dateString === todayStr;
              const moonRashi = RASHI_NAMES_HI[Math.floor((day.nakshatra.index * (360 / 27)) / 30) % 12];
              return (
                <button
                  key={day.dateString}
                  type="button"
                  onClick={() => { playTick(); setSelectedDay(day); }}
                  className={`w-full flex items-center gap-3 p-2.5 text-left cursor-pointer transition-colors ${
                    isToday ? 'bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-lg w-7 text-center shrink-0" title={day.moonPhase.phaseName}>{day.moonPhase.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono-data font-bold text-[#1C1917] dark:text-white">
                      {day.dayNumber} {ALL_MONTHS[ctxMonth].shortHi} {isToday && <span className="text-[#8E6F1D] dark:text-[#F0C968]">(आज)</span>}
                      <span className="ml-2 text-[10px] font-normal text-[#78716C] dark:text-[#A8A29E]">{day.moonPhase.phaseName}</span>
                    </div>
                    <div className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                      चन्द्रोदय {day.timings.moonrise} • चन्द्रास्त {day.timings.moonset} • चन्द्र रैशि: {moonRashi}
                    </div>
                  </div>
                  <div className="w-16 sm:w-24 shrink-0">
                    <div className="h-1.5 rounded-full bg-[#EFECE6] dark:bg-[#1F1F33] overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.round(day.moonPhase.fraction * 100)}%` }} />
                    </div>
                    <div className="text-[9px] font-mono-data text-[#78716C] dark:text-[#A8A29E] text-right mt-0.5">
                      {Math.round(day.moonPhase.fraction * 100)}% आभूति
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- सूर्य ---------- */}
      {tab === 'surya' && (
        <div className="space-y-2.5 animate-fadeIn">
          <div className="px-1 text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
            ☀️ {ALL_MONTHS[ctxMonth].hi} {ctxYear} — सौर सारणी • {panelMonth.ayanaHi} • {panelMonth.lunarMonthHi} मास
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#101221] overflow-hidden divide-y divide-black/5 dark:divide-white/5">
            {panelMonth.days.map((day) => {
              const isToday = day.dateString === todayStr;
              const rise = parseTime12ToMinutes(day.timings.sunrise);
              const set = parseTime12ToMinutes(day.timings.sunset);
              const dayLen = set > rise ? set - rise : 0;
              const dayLenText = `${Math.floor(dayLen / 60)} घं. ${dayLen % 60} मि.`;
              const masaIdx = LUNAR_MONTHS.findIndex((m) => m.en === day.lunarMonth);
              const sunRashi = masaIdx >= 0 ? RASHI_NAMES_HI[(masaIdx + 11) % 12] : '';
              return (
                <button
                  key={day.dateString}
                  type="button"
                  onClick={() => { playTick(); setSelectedDay(day); }}
                  className={`w-full flex items-center gap-3 p-2.5 text-left cursor-pointer transition-colors ${
                    isToday ? 'bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-base w-7 text-center shrink-0">☀️</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono-data font-bold text-[#1C1917] dark:text-white">
                      {day.dayNumber} {ALL_MONTHS[ctxMonth].shortHi} {isToday && <span className="text-[#8E6F1D] dark:text-[#F0C968]">(आज)</span>}
                      <span className="ml-2 text-[10px] font-normal text-[#78716C] dark:text-[#A8A29E]">सूर्य: {sunRashi}</span>
                    </div>
                    <div className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                      मास: {day.lunarMonthHi} • दिन-अवधि: {dayLenText}
                    </div>
                  </div>
                  <div className="text-right shrink-0 text-[10px] font-mono-data space-y-0.5">
                    <div className="text-amber-700 dark:text-amber-400 font-bold">🌅 {day.timings.sunrise}</div>
                    <div className="text-amber-700 dark:text-amber-400">🌇 {day.timings.sunset}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ DAY DETAIL SHEET (shared) ============ */}
      {selectedDay && (
        <DayDetailSheet
          day={selectedDay}
          monthData={panelMonth}
          location={locationCoords}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

export default function UnifiedPanchangCalendarClient({ defaultView = 'month' }: UnifiedPanchangCalendarClientProps) {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center space-y-3 font-mono-data text-xs text-[#78716C]">
          <div className="animate-spin w-8 h-8 border-2 border-[#8E6F1D] border-t-transparent rounded-full mx-auto" />
          <p>लोड हो रहा है... Loading Vedic Ephemeris & Chronometry Matrix</p>
        </div>
      }
    >
      <UnifiedPanchangCalendarClientInner defaultView={defaultView} />
    </Suspense>
  );
}
