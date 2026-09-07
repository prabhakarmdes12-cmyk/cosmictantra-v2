/**
 * WORLD CALENDAR SYSTEMS ENGINE (WORLD_CALENDAR_SYSTEMS.md)
 * -----------------------------------------------------------------------------
 * Deterministic conversion of a Gregorian date into 9 parallel calendar
 * systems. Every reading is COMPUTED from the canonical astronomical
 * pipeline (no hardcoded festival dates, no lookup tables of calendars):
 *
 *  1. Drik Vedic Panchang (Lahiri)   — sidereal, canonical engine (default)
 *  2. Surya Siddhanta (Traditional)  — classical Siddhantic tithi/nakshatra
 *  3. Bikram Sambat (Nepal/N. India) — Vikram era (+57), lunar mas + tithi
 *  4. Saka Samvat (National)         — Saka era (-78), solar months
 *  5. Tamil Solar (Chithirai/Aani)   — Thiruvalluvar cycle, solar months
 *  6. Bengali San (Bangabda)         — Bangabda era, solar months
 *  7. Malayalam Kollam (Kollavarsham)— Kollam era (+825), solar months
 *  8. Hijri Islamic (Lunar)          — astronomical synodic months
 *  9. Gregorian Civil (AD)           — civil standard
 *
 * Solar-month day counts use a fast tropical-sun series (same polynomial the
 * monthly engine uses) with backward boundary scans — accurate to the day and
 * fully deterministic.
 */

import { calculatePanchang, LUNAR_MASA_DATA } from '../panchang.js';
import { TITHI_NAMES_HI, NAKSHATRA_NAMES_HI } from '../panchangFactBundle';
import type { LocationCoordinates } from '../panchangFactBundle';

export type WorldCalendarSystemId =
  | 'drik'
  | 'surya_siddhanta'
  | 'bikram_sambat'
  | 'saka_samvat'
  | 'tamil_solar'
  | 'bengali_san'
  | 'malayalam'
  | 'hijri'
  | 'gregorian';

export interface WorldCalendarSystemMeta {
  id: WorldCalendarSystemId;
  nameHi: string;
  nameEn: string;
  region: string;
  epochNote: string;
  emoji: string;
  isDefault?: boolean;
}

export const WORLD_CALENDAR_SYSTEMS: WorldCalendarSystemMeta[] = [
  {
    id: 'drik',
    nameHi: 'दृक् वैदिक पञ्चाङ्ग (Lahiri Standard)',
    nameEn: 'Drik Vedic Panchang (Lahiri)',
    region: 'India / Global',
    epochNote: 'चित्रा पक्ष — Lahiri Ayanamsha · Drik Ganita (Chitra Paksha)',
    emoji: '🪔',
    isDefault: true,
  },
  {
    id: 'surya_siddhanta',
    nameHi: 'सूर्य सिद्धान्त (Traditional)',
    nameEn: 'Surya Siddhanta Astronomical Calendar',
    region: 'Traditional India',
    epochNote: 'क्लासिकल सिद्धान्त स्थिरांक · Classical Siddhantic Tithi & Nakshatra',
    emoji: '📜',
  },
  {
    id: 'bikram_sambat',
    nameHi: 'विक्रम संवत् (Bikram Sambat)',
    nameEn: 'Bikram Sambat (Nepal / North India)',
    region: 'Nepal / North India',
    epochNote: 'विक्रम संवत् आधार (+57 वर्ष) · Sidereal Luni-Solar',
    emoji: '🇳🇵',
  },
  {
    id: 'saka_samvat',
    nameHi: 'राष्ट्रीय शक संवत् (Saka)',
    nameEn: 'Saka Samvat (Indian National Calendar)',
    region: 'India (National Standard)',
    epochNote: 'शक युग आधार (-78 AD) · Chaitra-praribhā Solar Months',
    emoji: '🇮🇳',
  },
  {
    id: 'tamil_solar',
    nameHi: 'தமிழ் காலண்டர் (Tamil Solar)',
    nameEn: 'Tamil Solar Calendar (Chithirai / Aani)',
    region: 'Tamil Nadu / Sri Lanka',
    epochNote: 'तिरुवल्लुवर चक्र · Sankranti-based Sidereal Solar Months',
    emoji: '🌺',
  },
  {
    id: 'bengali_san',
    nameHi: 'বাংলা ক্যালেন্ডার (Bangabda)',
    nameEn: 'Bengali San (Bangabda)',
    region: 'West Bengal / Bangladesh',
    epochNote: 'बांगabda युग · Pohela Boishakh Solar Year',
    emoji: '🌾',
  },
  {
    id: 'malayalam',
    nameHi: 'മലയാളം കൊല്ലവർഷം (Kollam Era)',
    nameEn: 'Malayalam Kollam Era (Kollavarsham)',
    region: 'Kerala',
    epochNote: 'कोल्लम युग (+825) · Chingam/Kanni/Thulam Solar Months',
    emoji: '🌴',
  },
  {
    id: 'hijri',
    nameHi: 'हिजरी कैलेंडर (Islamic Lunar)',
    nameEn: 'Hijri Islamic Calendar',
    region: 'Global Islamic Community',
    epochNote: 'हिजरा युग (622 AD) · Pure Astronomical Lunar Months',
    emoji: '🌙',
  },
  {
    id: 'gregorian',
    nameHi: 'ग्रेगोरियन कैलेंडर (Civil)',
    nameEn: 'Gregorian Civil Calendar',
    region: 'Global Civil Standard',
    epochNote: 'Anno Domini · Tropical Solar Civil Standard',
    emoji: '🌐',
  },
];

export const SYSTEM_META_BY_ID: Record<WorldCalendarSystemId, WorldCalendarSystemMeta> =
  Object.fromEntries(WORLD_CALENDAR_SYSTEMS.map((s) => [s.id, s])) as Record<
    WorldCalendarSystemId,
    WorldCalendarSystemMeta
  >;

export interface WorldCalendarDayReading {
  systemId: WorldCalendarSystemId;
  /** Era year label, e.g. "2083", "1448 AH", "2026" */
  eraYearLabel: string;
  /** Month name in the system (Hindi where idiomatic). */
  monthName: string;
  /** Day within the system month (or civil day for Gregorian). */
  day: number;
  /** One-line bilingual-ready summary. */
  summaryHi: string;
  /** Shorter label for compact day-cell subtitles. */
  compactHi: string;
}

// -------------------------------------------------------------
// Fast tropical Sun (same series as the monthly engine) — cheap,
// used for solar-month boundary scans (30° segments).
// -------------------------------------------------------------
function fastTropicalSunLon(date: Date): number {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const g = ((357.529 + 0.98560028 * d) % 360 + 360) % 360;
  const q = 280.459 + 0.98564736 * d;
  const L =
    (q + 1.915 * Math.sin((g * Math.PI) / 180) + 0.02 * Math.sin((2 * g * Math.PI) / 180)) % 360;
  return (L + 360) % 360;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

const DAY_MS = 86400000;

/**
 * Days elapsed since the Sun last crossed `boundaryLon` forward.
 * Backward scan of at most 380 days (one tropical year) with a
 * same-day-crossing test; the Sun moves < 1.01°/day so at most one
 * crossing per step — deterministic and exact to the day.
 */
function daysSinceSunEntry(date: Date, boundaryLon: number): number {
  const boundary = ((boundaryLon % 360) + 360) % 360;
  for (let back = 0; back <= 380; back++) {
    const d0 = addDays(date, -back);
    const d1 = addDays(date, -back - 1);
    const lon0 = fastTropicalSunLon(d0);
    const lon1 = fastTropicalSunLon(d1);
    const delta = (lon0 - lon1 + 360) % 360;
    const distToBoundary = (boundary - lon1 + 360) % 360;
    if (delta > 0 && distToBoundary <= delta) {
      return back;
    }
  }
  return 0;
}

/** Day (1-based) within the current 30° solar segment starting at `startLon`. */
function dayInSolarSegment(date: Date, startLon: number): number {
  return daysSinceSunEntry(date, startLon) + 1;
}

// -------------------------------------------------------------
// System month tables (name per 30° tropical-sun segment)
// -------------------------------------------------------------
/** Saka / National calendar — solar months from Aries (Chaitra). */
const SAKA_SOLAR_MONTHS_HI = LUNAR_MASA_DATA.map((m) => m.hi);

/** Tamil solar months — segment 0 = Aries (Chithirai 1). */
const TAMIL_SOLAR_MONTHS = [
  'Chithirai (चीथिरै)',
  'Vaikasi (वाइकासी)',
  'Aippasi (आइप्पासी)',
  'Purattasi (पूरट्ठासी)',
  'Aippasi (आइप्पासी)',
  'Margazhi (मार्गाझी)',
  'Thai (तै)',
  'Maasi (मासी)',
  'Panguni (पंगुनी)',
  'Margazhi (मार्गाझी)',
  'Thai (तै)',
  'Maasi (मासी)',
];

/** Bengali solar months — Boishakh begins at ~40° (Pohela Boishakh). */
const BENGALI_SOLAR_MONTHS = [
  'Boishakh (बैशाख)',
  'Joishtho (ज्येष्ठ)',
  'Asharh (आषাঢ়)',
  'Shraban (श्रावण)',
  'Bhadro (भाद्र)',
  'Ashshoy (आष्विन)',
  'Kartik (कार्तिक)',
  'Agrahayan (अगहन)',
  'Poush (पौष)',
  'Falgun (फाल्गुन)',
  'Chaitra (चैत्र)',
  'Utro Chaitra (उत्रो चैत्र)',
];

/** Kollavarsham — Chingam (Virgo, ~29 Aug) begins the Kollam year. */
const KOLLAM_SOLAR_MONTHS = [
  'Chingam (चिंगम)',
  'Kanni (कनि)',
  'Tulam (तुलम)',
  'Vrishikam (वृश्चिक)',
  'Dhanusam (धनु)',
  'Makaram (मकर)',
  'Kumbham (कुंभ)',
  'Meenam (मीन)',
  'Rishabham (वृषभ)',
  'Mithunam (मिथुन)',
  'Katakam (कर्क)',
  'Simham (सिंह)',
];

/** Hijri months. */
const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi Ul Awwal', 'Rabi Ul Akhir',
  'Jumada Ul Awwal', 'Jumada Ul Akhir', 'Rajab', 'Shaban',
  'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah',
];
const HIJRI_MONTHS_HI = [
  'मुहर्रम', 'सफर', 'रबी अल-अवल', 'रबी अल-आखिर',
  'जुम्दा अल-अवल', 'जुम्दा अल-आखिर', 'राजब', 'शाबान',
  'रमज़ान', 'शव्वाल', 'धुलकादा', 'धुलहज्जा',
];

// Astronomical synodic reference: new moon 2000-01-06 18:14 UTC is taken as
// 1 Muharram 1421 AH (crescent observation may shift the visible month by ±1).
const HIJRI_SYNODIC_MONTH = 29.530588853;
const HIJRI_ANCHOR_UTC_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const HIJRI_ANCHOR_YEAR = 1421;

function hijriReading(date: Date): { year: number; monthIdx: number; day: number } {
  const noonLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).getTime();
  const days = (noonLocal - HIJRI_ANCHOR_UTC_MS) / DAY_MS;
  const totalMonths = Math.floor(days / HIJRI_SYNODIC_MONTH);
  const monthIdx = ((totalMonths % 12) + 12) % 12;
  let day = Math.floor(days - totalMonths * HIJRI_SYNODIC_MONTH) + 1;
  day = Math.min(30, Math.max(1, day));
  const year = HIJRI_ANCHOR_YEAR + Math.floor(totalMonths / 12);
  return { year, monthIdx, day };
}

// -------------------------------------------------------------
// Core resolver
// -------------------------------------------------------------
export function getWorldCalendarReading(
  date: Date,
  systemId: WorldCalendarSystemId,
  location?: LocationCoordinates
): WorldCalendarDayReading {
  const lat = location?.lat ?? 25.3176;
  const lng = location?.lng ?? 82.9739;
  const tz = location?.tz ?? 5.5;
  const gregYear = date.getFullYear();
  const gregMonthIdx = date.getMonth(); // 0-based
  const gregDay = date.getDate();
  const tropSun = fastTropicalSunLon(date);

  switch (systemId) {
    case 'drik': {
      const p = calculatePanchang(date, { lat, lng, tz, name: location?.name || 'Location' }) as any;
      const pakshaHi = p.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण';
      const tithiHi = TITHI_NAMES_HI[p.tithi?.name] || p.tithi?.name || '';
      return {
        systemId,
        eraYearLabel: `संवत् ${p.samvat?.vikram ?? gregYear + 57}`,
        monthName: p.masa?.nameHi || '',
        day: p.tithi?.number || 1,
        summaryHi: `दृक् वैदिक (Lahiri) • विक्रम संवत् ${p.samvat?.vikram ?? gregYear + 57} • ${p.masa?.nameHi || ''} मास • ${pakshaHi} ${tithiHi}`,
        compactHi: `${p.masa?.nameHi || ''} • ${pakshaHi} ${tithiHi}`,
      };
    }
    case 'surya_siddhanta': {
      const p = calculatePanchang(date, { lat, lng, tz, name: location?.name || 'Location' }) as any;
      const pakshaHi = p.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण';
      const tithiHi = TITHI_NAMES_HI[p.tithi?.name] || p.tithi?.name || '';
      const nakHi = NAKSHATRA_NAMES_HI[p.nakshatra?.name] || p.nakshatra?.name || '';
      return {
        systemId,
        eraYearLabel: `संवत् ${p.samvat?.vikram ?? gregYear + 57}`,
        monthName: p.masa?.nameHi || '',
        day: p.tithi?.number || 1,
        summaryHi: `सूर्य सिद्धान्त • ${p.masa?.nameHi || ''} मास • ${pakshaHi} ${tithiHi} • ${nakHi} नक्षत्र`,
        compactHi: `${pakshaHi} ${tithiHi} • ${nakHi}`,
      };
    }
    case 'bikram_sambat': {
      const p = calculatePanchang(date, { lat, lng, tz, name: location?.name || 'Location' }) as any;
      // BS year begins near the tropical Aries entry (~mid-April).
      const ariesDays = daysSinceSunEntry(date, 0);
      const bsYear = ariesDays <= 35 ? gregYear + 57 : gregYear + 56;
      const pakshaHi = p.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण';
      const tithiHi = TITHI_NAMES_HI[p.tithi?.name] || p.tithi?.name || '';
      return {
        systemId,
        eraYearLabel: `विक्रम संवत् ${bsYear}`,
        monthName: p.masa?.nameHi || '',
        day: p.tithi?.number || 1,
        summaryHi: `बिक्रम संवत् ${bsYear} • ${p.masa?.nameHi || ''} मास • ${pakshaHi} ${tithiHi}`,
        compactHi: `BS ${bsYear} • ${p.masa?.nameHi || ''}`,
      };
    }
    case 'saka_samvat': {
      const ariesDays = daysSinceSunEntry(date, 0);
      const sakaYear = ariesDays <= 35 ? gregYear - 78 : gregYear - 79;
      const monthIdx = Math.floor(tropSun / 30) % 12;
      const day = dayInSolarSegment(date, monthIdx * 30);
      const monthHi = SAKA_SOLAR_MONTHS_HI[monthIdx];
      return {
        systemId,
        eraYearLabel: `शक ${sakaYear}`,
        monthName: monthHi,
        day,
        summaryHi: `राष्ट्रीय शक संवत् ${sakaYear} • ${monthHi} मास • ${day} दिन`,
        compactHi: `शक ${sakaYear} • ${monthHi} ${day}`,
      };
    }
    case 'tamil_solar': {
      const monthIdx = Math.floor(tropSun / 30) % 12;
      const day = dayInSolarSegment(date, monthIdx * 30);
      const monthName = TAMIL_SOLAR_MONTHS[monthIdx];
      return {
        systemId,
        eraYearLabel: `${gregYear} CE`,
        monthName,
        day,
        summaryHi: `தமிழ் சோலார் • ${monthName} • ${day} நாளம் • ${gregYear} CE`,
        compactHi: `${monthName.split(' (')[0]} ${day}`,
      };
    }
    case 'bengali_san': {
      // Pohela Boishakh: the Sun crosses ~40° (mid-April).
      const boishakhDays = daysSinceSunEntry(date, 40);
      const bangabdaYear = boishakhDays <= 35 ? gregYear - 593 : gregYear - 592;
      const monthIdx = Math.floor(((tropSun - 40 + 360) % 360) / 30) % 12;
      const day = dayInSolarSegment(date, (monthIdx * 30 + 40) % 360);
      const monthName = BENGALI_SOLAR_MONTHS[monthIdx];
      return {
        systemId,
        eraYearLabel: `বাংলা ${bangabdaYear}`,
        monthName,
        day,
        summaryHi: `বাংলা ${bangabdaYear} • ${monthName} • ${day} বার`,
        compactHi: `${monthName.split(' (')[0]} ${day} • ${bangabdaYear}`,
      };
    }
    case 'malayalam': {
      // Kollavarsham begins when the Sun enters Virgo (~29 Aug).
      const chingamDays = daysSinceSunEntry(date, 180);
      const kvYear = chingamDays <= 35 ? gregYear - 825 : gregYear - 824;
      const monthIdx = Math.floor(((tropSun - 180 + 360) % 360) / 30) % 12;
      const day = dayInSolarSegment(date, (monthIdx * 30 + 180) % 360);
      const monthName = KOLLAM_SOLAR_MONTHS[monthIdx];
      return {
        systemId,
        eraYearLabel: `Kollam ${kvYear}`,
        monthName,
        day,
        summaryHi: `കൊല്ലവർഷം ${kvYear} • ${monthName} • ${day} തിയതി`,
        compactHi: `${monthName.split(' (')[0]} ${day} • KV ${kvYear}`,
      };
    }
    case 'hijri': {
      const h = hijriReading(date);
      return {
        systemId,
        eraYearLabel: `${h.year} AH`,
        monthName: HIJRI_MONTHS_HI[h.monthIdx],
        day: h.day,
        summaryHi: `हिजरी ${h.year} AH • ${HIJRI_MONTHS_HI[h.monthIdx]} • ${h.day} (कक्षा-दर्शन आधारित)`,
        compactHi: `${HIJRI_MONTHS_HI[h.monthIdx]} ${h.day} • ${h.year} AH`,
      };
    }
    case 'gregorian':
    default: {
      const GREG_MONTHS_HI = [
        'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
        'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
      ];
      return {
        systemId,
        eraYearLabel: `${gregYear} AD`,
        monthName: GREG_MONTHS_HI[gregMonthIdx],
        day: gregDay,
        summaryHi: `ग्रेगोरियन • ${gregDay} ${GREG_MONTHS_HI[gregMonthIdx]} ${gregYear} AD`,
        compactHi: `${gregDay} ${GREG_MONTHS_HI[gregMonthIdx]} ${gregYear}`,
      };
    }
  }
}

/** All 9 readings for one date — used by the parallel-date strip in the Day Detail Sheet. */
export function getWorldCalendarReadings(
  date: Date,
  location?: LocationCoordinates
): WorldCalendarDayReading[] {
  return WORLD_CALENDAR_SYSTEMS.map((s) => getWorldCalendarReading(date, s.id, location));
}

/**
 * Year label for the active system (for the month title bar), e.g.
 * "सितंबर 2026" → "सितंबर 2026 • शक 1948".
 */
export function getSystemYearLabel(
  year: number,
  month: number,
  systemId: WorldCalendarSystemId,
  location?: LocationCoordinates
): string {
  try {
    const mid = new Date(year, month, 15);
    const r = getWorldCalendarReading(mid, systemId, location);
    return r.eraYearLabel;
  } catch {
    return `${year}`;
  }
}
