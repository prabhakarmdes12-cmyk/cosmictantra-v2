'use client';

/**
 * DAY DETAIL SHEET — mobile bottom sheet / desktop modal
 * -----------------------------------------------------------------------------
 * 16:9 festival artwork hero • Tithi/Nakshatra/Yoga/Karana • Sunrise/Sunset •
 * Abhijit Muhurat • Choghadiya • Puja Vidhi CTA • Novice vs. Scholar layer.
 *
 * Novice (default):  "आज क्या करें? किससे बचें?"
 * Scholar (विस्तृत पञ्चाङ्ग): exact Tithi/Nakshatra boundaries, Lahiri
 * Ayanamsha (24°13'40"-class DMS), Choghadiya, Hora, Samvat, Ritu, Ayana,
 * solar month and Shastra citations.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  X, Share2, BookOpen, Sparkles, ShieldAlert, Sun, Moon, Clock,
  CalendarPlus
} from 'lucide-react';
import type { PanchangDayData, MonthPanchangOverview } from '@/engines/monthlyPanchangEngine';
import type { LocationCoordinates } from '@/lib/panchangFactBundle';
import { getDailyGuidance, getPujaVidhiForFestival, getFestivalSignificanceHi } from '@/lib/calendar/vedaGuidance';
import { getScholarPanchang, getQuickChoghadiya, ScholarPanchang } from '@/lib/calendar/scholarPanchang';
import { pickDayArtwork } from '@/lib/calendar/eventArtwork';
import { playTick } from '@/lib/chitiAudio';
import ScholarPanchangPanel from './ScholarPanchangPanel';

const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
export function toHindiDigits(str: string | number): string {
  return String(str).replace(/[0-9]/g, (d) => HINDI_DIGITS[parseInt(d, 10)]);
}

const MONTHS_HI = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const LORD_HI_MAP: Record<string, string> = {
  Sun: 'सूर्य देव', Moon: 'चन्द्र देव', Mars: 'मंगल देव', Mercury: 'बुध देव',
  Jupiter: 'बृहस्पति देव', Venus: 'शुक्र देव', Saturn: 'शनि देव',
  Rahu: 'राहु देव', Ketu: 'केतु देव',
};

const RASHI_NAMES_HI = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन'];

function parseDate(day: PanchangDayData): Date {
  const [y, m, d] = day.dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Moon rashi index from nakshatra index (13°20' nakshatras over 30° rasis). */
function moonRashiIndex(nakIdx: number): number {
  return Math.floor((nakIdx * (360 / 27)) / 30) % 12;
}

interface DayDetailSheetProps {
  day: PanchangDayData;
  monthData?: MonthPanchangOverview | null;
  location: LocationCoordinates;
  onClose: () => void;
}

export default function DayDetailSheet({ day, monthData, location, onClose }: DayDetailSheetProps) {
  const [layer, setLayer] = useState<'novice' | 'scholar'>('novice');
  const [showVidhi, setShowVidhi] = useState(false);
  const [scholar, setScholar] = useState<ScholarPanchang | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const dateObj = useMemo(() => parseDate(day), [day]);
  const isToday = day.dateString === new Date().toISOString().slice(0, 10);
  const now = new Date();

  // Heavy canonical computation — deferred AND only loaded when the user
  // actually opens the Scholar layer (keeps the novice sheet instant).
  useEffect(() => {
    if (layer !== 'scholar') return;
    let alive = true;
    setScholar(null);
    const timer = window.setTimeout(() => {
      try {
        const built = getScholarPanchang(dateObj, location);
        if (alive) setScholar(built);
      } catch {
        if (alive) setScholar(null);
      }
    }, 30);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [layer, dateObj, location]);

  // Fast Choghadiya for the novice layer — pure time arithmetic on the
  // already-computed sunrise/sunset strings (no ephemeris round-trip).
  const quickChoghadiya = useMemo(
    () => getQuickChoghadiya({ date: dateObj, dayOfWeek: day.dayOfWeek, sunrise: day.timings.sunrise, sunset: day.timings.sunset }),
    [dateObj, day]
  );

  // Reset per-day UI state when the day changes
  useEffect(() => {
    setLayer('novice');
    setShowVidhi(false);
    setImageFailed(false);
  }, [day.dateString]);

  const artwork = useMemo(() => pickDayArtwork(day), [day.festivals]);
  const primaryFestival = day.festivals.find((f) => f.isImportant) || day.festivals[0] || null;

  const guidance = useMemo(
    () => getDailyGuidance(day, isToday ? now : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day, isToday]
  );

  const moonRashi = RASHI_NAMES_HI[moonRashiIndex(day.nakshatra.index)];

  const pujaVidhi = useMemo(
    () => (primaryFestival ? getPujaVidhiForFestival(primaryFestival.nameHi, primaryFestival.name) : getPujaVidhiForFestival(day.tithi.nameHi)),
    [primaryFestival, day.tithi.nameHi]
  );

  const significance = primaryFestival
    ? getFestivalSignificanceHi(primaryFestival.nameHi, primaryFestival.name, guidance.significanceHi)
    : guidance.significanceHi;

  // Puja Muhurat window: Abhijit when valid, else the post-sunrise window
  const pujaMuhurat = day.timings.abhijitMuhurat
    ? `${day.timings.abhijitMuhurat.start} – ${day.timings.abhijitMuhurat.end}`
    : `${day.timings.sunrise} – प्रातः काल`;

  const handleShare = () => {
    playTick();
    const text = `🕉️ CosmicTantra वैदिक पञ्चाङ्ग (${toHindiDigits(day.dateString)})\n\n📅 तिथि: ${day.tithi.nameHi} (${day.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष'})\n⭐ नक्षत्र: ${day.nakshatra.nameHi} (पाद ${toHindiDigits(day.nakshatra.pada)})\n🌟 अभिजित: ${day.timings.abhijitMuhurat ? `${toHindiDigits(day.timings.abhijitMuhurat.start)} - ${toHindiDigits(day.timings.abhijitMuhurat.end)}` : 'बुधवार — वर्जित'}\n⚠ राहु काल: ${toHindiDigits(day.timings.rahuKaal.start)} - ${toHindiDigits(day.timings.rahuKaal.end)}\n${primaryFestival ? `🪔 पर्व: ${primaryFestival.nameHi}` : ''}\n\nमासिक कैलेंडर देखें: https://cosmictantra.chiti.tech/calendar`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleGoogleCalendar = () => {
    playTick();
    const cleanDate = day.dateString.replace(/-/g, '');
    const festName = primaryFestival ? primaryFestival.nameHi : day.nakshatra.nameHi;
    const title = `वैदिक पञ्चाङ्ग: ${day.tithi.nameHi} • ${festName}`;
    const details = `तिथि: ${day.tithi.nameHi}\nनक्षत्र: ${day.nakshatra.nameHi} (पाद ${day.nakshatra.pada})\nअभिजित: ${pujaMuhurat}\nराहु काल: ${day.timings.rahuKaal.start} - ${day.timings.rahuKaal.end}`;
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${cleanDate}T060000/${cleanDate}T073000&details=${encodeURIComponent(details)}`;
    window.open(gCalUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-end sm:items-center sm:justify-center sm:p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-3xl max-h-[96vh] sm:max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0E101D] rounded-t-3xl sm:rounded-3xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/45 shadow-2xl scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- HERO: 16:9 festival artwork ---------- */}
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#2A2118] via-[#3A2C15] to-[#14100A]">
          {artwork && !imageFailed ? (
            <img
              src={artwork.imagePath}
              alt={`${artwork.nameHi} — 16:9 artwork`}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImageFailed(true)}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-60">{day.tithi.isPurnima ? '🌕' : day.tithi.isAmavasya ? '🌑' : '🪔'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-xl bg-black/45 text-white hover:bg-black/65 transition-colors cursor-pointer backdrop-blur-sm"
            aria-label="बंद करें"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title over hero */}
          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-mono-data font-bold">
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                {DAYS_HI[day.dayOfWeek]} • {day.dayNumber} {MONTHS_HI[Number(day.dateString.split('-')[1]) - 1]} {day.dateString.split('-')[0]}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                {day.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'} {day.tithi.nameHi}
              </span>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#060709]">आज • TODAY</span>
              )}
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-white mt-1.5 leading-tight">
              {primaryFestival ? primaryFestival.nameHi : `${day.nakshatra.nameHi} नक्षत्र • ${day.yoga.nameHi} योग`}
            </h3>
            <p className="text-xs sm:text-sm text-white/80 font-mono-data mt-0.5">
              {primaryFestival ? primaryFestival.name : `${MONTHS_EN[Number(day.dateString.split('-')[1]) - 1]} ${day.dayNumber}, ${day.dateString.split('-')[0]}`}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* ---------- LAYER SWITCHER: Novice / Scholar ---------- */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#EFECE6] dark:bg-[#161828] border border-black/10 dark:border-white/10 max-w-md">
            <button
              type="button"
              data-testid="day-layer-novice"
              onClick={() => { playTick(); setLayer('novice'); }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-[11px] sm:text-xs font-mono-data font-bold transition-all cursor-pointer ${
                layer === 'novice'
                  ? 'bg-white dark:bg-[#0E101D] text-[#8E6F1D] dark:text-[#F0C968] shadow-md ring-1 ring-[#8E6F1D]/25'
                  : 'text-[#696256] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-white'
              }`}
            >
              🙏 आसान दृष्टि (Novice)
            </button>
            <button
              type="button"
              data-testid="day-layer-scholar"
              onClick={() => { playTick(); setLayer('scholar'); }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-[11px] sm:text-xs font-mono-data font-bold transition-all cursor-pointer ${
                layer === 'scholar'
                  ? 'bg-white dark:bg-[#0E101D] text-[#8E6F1D] dark:text-[#F0C968] shadow-md ring-1 ring-[#8E6F1D]/25'
                  : 'text-[#696256] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-white'
              }`}
            >
              📜 विस्तृत पञ्चाङ्ग (Scholar)
            </button>
          </div>

          {/* ================= NOVICE LAYER ================= */}
          {layer === 'novice' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Significance (2 lines) */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                <div className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] mb-1">
                  {primaryFestival ? 'पर्व का महत्व' : 'दिन का महत्व'}
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[#1C1917] dark:text-[#EFECE6] line-clamp-3">
                  {significance}
                </p>
              </div>

              {/* Live alerts */}
              {guidance.rahuAlertHi && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs font-mono-data font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{guidance.rahuAlertHi}</span>
                </div>
              )}
              {guidance.abhijitAlertHi && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-mono-data font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{guidance.abhijitAlertHi}</span>
                </div>
              )}

              {/* क्या करें / किससे बचें */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/25 space-y-1.5">
                  <div className="text-xs font-editorial font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> आज क्या करें?
                  </div>
                  <ul className="space-y-1">
                    {guidance.doItems.map((item, i) => (
                      <li key={i} className="text-[11px] sm:text-xs font-mono-data text-[#1C1917] dark:text-[#EFECE6] flex gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-500/25 space-y-1.5">
                  <div className="text-xs font-editorial font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> किससे बचें?
                  </div>
                  <ul className="space-y-1">
                    {guidance.avoidItems.map((item, i) => (
                      <li key={i} className="text-[11px] sm:text-xs font-mono-data text-[#1C1917] dark:text-[#EFECE6] flex gap-1.5">
                        <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Panchang telemetry (compact) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono-data">
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <div className="text-[9px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">तिथि</div>
                  <div className="font-bold text-[#1C1917] dark:text-white">{day.tithi.nameHi}</div>
                  <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">{day.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <div className="text-[9px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">नक्षत्र</div>
                  <div className="font-bold text-[#1C1917] dark:text-white">{day.nakshatra.nameHi}</div>
                  <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">पाद {toHindiDigits(day.nakshatra.pada)} • {LORD_HI_MAP[day.nakshatra.lord] || day.nakshatra.lord}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <div className="text-[9px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">योग</div>
                  <div className="font-bold text-[#1C1917] dark:text-white">{day.yoga.nameHi}</div>
                  <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">{day.yoga.qualityHi}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <div className="text-[9px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">करण</div>
                  <div className="font-bold text-[#1C1917] dark:text-white">{day.karana.nameHi}</div>
                  <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">{day.karana.typeHi}</div>
                </div>
              </div>

              {/* Sun / Moon */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-data">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-[#1C1917] dark:text-[#EFECE6]">
                    🌅 {toHindiDigits(day.timings.sunrise)} • 🌇 {toHindiDigits(day.timings.sunset)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-[#1C1917] dark:text-[#EFECE6]">
                    चन्द्रोदय {toHindiDigits(day.timings.moonrise)} • {moonRashi}
                  </span>
                </div>
              </div>

              {/* Muhurta */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-1.5 text-[11px] sm:text-xs font-mono-data">
                <div className="text-xs font-editorial font-bold text-[#1C1917] dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968]" /> मुहूर्त (Muhurta)
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#78716C] dark:text-[#A8A29E]">पूजा मुहूर्त:</span>
                  <span className="font-bold text-[#1C1917] dark:text-white">{toHindiDigits(pujaMuhurat)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#78716C] dark:text-[#A8A29E]">अभिजित मुहूर्त:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    {day.timings.abhijitMuhurat ? toHindiDigits(`${day.timings.abhijitMuhurat.start} – ${day.timings.abhijitMuhurat.end}`) : 'बुधवार — वर्जित'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#78716C] dark:text-[#A8A29E]">चोग्घड़िया (मध्याह्न):</span>
                  <span className="font-bold text-[#1C1917] dark:text-white">
                    {quickChoghadiya.length === 8
                      ? quickChoghadiya.slice(3, 5).map((c) => `${c.nameHi} ${toHindiDigits(c.start)}`).join(' • ')
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#78716C] dark:text-[#A8A29E]">शुभ चोग्घड़िया:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    {(() => {
                      const shubh = quickChoghadiya.find((c) => c.auspicious);
                      return shubh ? `${shubh.nameHi} • ${toHindiDigits(shubh.start)} – ${toHindiDigits(shubh.end)}` : '—';
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#78716C] dark:text-[#A8A29E]">राहु काल (वर्जित):</span>
                  <span className="font-bold text-rose-700 dark:text-rose-300">
                    {toHindiDigits(`${day.timings.rahuKaal.start} – ${day.timings.rahuKaal.end}`)}
                  </span>
                </div>
              </div>

              {/* Puja Vidhi — available for every day (festival vidhi, else
                  tithi-based sankalp), per spec action button. */}
              <div>
                <button
                  type="button"
                  onClick={() => { playTick(); setShowVidhi((v) => !v); }}
                  className="w-full p-3.5 rounded-2xl bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 text-xs sm:text-sm font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D]/20 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>🙏 पूजा विधि देखें {primaryFestival ? '' : '(तिथि-आधारित)'}</span>
                  <span>{showVidhi ? '▲' : '→'}</span>
                </button>
                {showVidhi && (
                  <div className="mt-2 p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-1.5">
                    {pujaVidhi.map((step, i) => (
                      <div key={i} className="text-[11px] sm:text-xs font-mono-data text-[#1C1917] dark:text-[#EFECE6] flex gap-2">
                        <span className="text-[#8E6F1D] dark:text-[#F0C968] font-bold shrink-0">{toHindiDigits(i + 1)}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SCHOLAR LAYER ================= */}
          {layer === 'scholar' && (
            <div className="space-y-4 animate-fadeIn">
              {!scholar ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#8E6F1D] border-t-transparent rounded-full mx-auto animate-spin" />
                  <p className="text-xs font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                    सिद्धान्त गणना चालू... (Canonical transition solver)
                  </p>
                </div>
              ) : (
                <ScholarPanchangPanel
                  scholar={scholar}
                  date={dateObj}
                  location={location}
                  weekdayNameHi={DAYS_HI[day.dayOfWeek]}
                />
              )}
            </div>
          )}

          {/* ---------- ACTION BAR ---------- */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-black/10 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/panchang"
                className="px-3 py-2 rounded-xl bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 text-[11px] sm:text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D]/25 transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" /> संबंधित लेख पढ़ें
              </Link>
              <button
                type="button"
                onClick={handleGoogleCalendar}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#161826] border border-black/10 dark:border-white/15 text-[11px] sm:text-xs font-mono-data font-bold text-[#57524A] dark:text-[#D1C9BF] hover:border-[#8E6F1D] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5" /> Google Calendar
              </button>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-mono-data font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Share2 className="w-3.5 h-3.5" /> साझा करें
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
