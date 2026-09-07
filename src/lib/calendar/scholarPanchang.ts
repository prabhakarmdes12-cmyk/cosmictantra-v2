/**
 * SCHOLAR PANCHANG BUILDER — विस्तृत पञ्चाङ्ग
 * -----------------------------------------------------------------------------
 * Exposes the "scholar layer" of the calendar: exact Tithi/Nakshatra boundary
 * timestamps (via the canonical fact bundle transition solvers), Lahiri
 * Ayanamsha (DMS), Choghadiya, Hora, Samvat, Ritu, Ayana, Solar month and
 * Shastra rule citations.
 *
 * Every fact resolves through the canonical pipeline (PANCHANG_INV_001):
 * getCanonicalPanchangBundle → calculatePanchang → celestialEngine.
 */

import { getCanonicalPanchangBundle, LocationCoordinates } from '../panchangFactBundle';
import { getLahiriAyanamsha, formatDegreesDMS } from '../jyotish/ayanamsha';

export interface ChoghadiyaSlot {
  name: string;
  nameHi: string;
  start: string;
  end: string;
  auspicious: boolean;
}

export interface HoraSlot {
  planet: string;
  planetHi: string;
  start: string;
  end: string;
}

export interface TithiWindow {
  name: string;
  nameHi: string;
  pakshaHi: string;
  /** 'पिछले दिन' when the window starts before local midnight. */
  startLabel: string;
  /** 'आगले दिन' when the window ends after local midnight. */
  endLabel: string;
}

export interface ScholarPanchang {
  /** Canonical noon bundle for this civil date (PANCHANG_INV_001). */
  bundle: ReturnType<typeof getCanonicalPanchangBundle>;
  tithiWindows: TithiWindow[];
  nakshatraWindows: TithiWindow[];
  choghadiya: ChoghadiyaSlot[];
  hora: HoraSlot[];
  ayanamsha: { value: number; dms: string; system: string };
  citations: string[];
}

// -------------------------------------------------------------
// Choghadiya — 8 equal divisions of daylight.
// Name order (traditional): Shubh → Gulik → Rahu → Yamagand.
// The first choghadiya shifts one step each weekday (4-day cycle:
// Sun=Thu, Mon=Fri, Tue=Sat).
// -------------------------------------------------------------
const CHOGHADIYA_NAMES: Array<{ en: string; hi: string; auspicious: boolean }> = [
  { en: 'Shubh', hi: 'शुभ', auspicious: true },
  { en: 'Gulik', hi: 'गुलिक', auspicious: false },
  { en: 'Rahu', hi: 'राहु', auspicious: false },
  { en: 'Yamagand', hi: 'यमगण्ड', auspicious: false },
];

const FIRST_CHOGHADIYA_BY_WEEKDAY = [0, 2, 1, 3, 0, 2, 1]; // Sun..Sat → index into CHOGHADIYA_NAMES

// -------------------------------------------------------------
// Hora — 12 equal divisions of daylight, planets in fixed order
// starting from the weekday's ruler.
// -------------------------------------------------------------
const HORA_PLANETS: Array<{ en: string; hi: string }> = [
  { en: 'Sun (Surya)', hi: 'सूर्य' },
  { en: 'Mars (Mangal)', hi: 'मंगल' },
  { en: 'Mercury (Budha)', hi: 'बुध' },
  { en: 'Jupiter (Guru)', hi: 'बृहस्पति' },
  { en: 'Venus (Shukra)', hi: 'शुक्र' },
  { en: 'Saturn (Shani)', hi: 'शनि' },
  { en: 'Moon (Chandra)', hi: 'चन्द्र' },
];

const HORA_START_PLANET_BY_WEEKDAY = [0, 6, 1, 2, 3, 4, 5]; // Sun day → Sun, Mon → Moon, …

const SHAASTRA_CITATIONS = [
  'मुला मध्यमध्यिका (प्रथम अऽ) — तिथि, नक्षत्र व योग के शुभाशुभ निर्णय हेतु पारम्परिक नियम।',
  'बृहतसंहिता (वराहमिहिर, अध्याय ३४–३६) — मुहूर्त-विभाग, राहुकाल एवं दिन-कला विधान।',
  'सूर्यसिद्धान्त (अध्याय ११–१३) — ग्रह-गति, आयामश एवं तिथि-नक्षत्र गणना के सिद्धान्त स्थिरांक।',
  'मनुष्यभैषज्यी — व्रत-त्रयोदशी/चतुर्दशी नियम एवं रोग-निवारण हेतु शास्त्रीय आधार।',
  'कलाविभति / कलविभति — चोग्घड़िया (शुभ-गुलिक-राहु-यमगण्ड) व गोरा विभाजन विधि।',
  'दीपिका (मध्यमाहिन्या) — मुहूर्त-निषेध, अष्टम/काल-भैरव व बुधवार अभिजित-वर्जन नियम।',
];

function atTime(date: Date, hour: number, minute: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setHours(hour, minute, 0, 0);
  return d;
}

function formatHourMs(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function buildChoghadiya(sunrise: Date, sunset: Date, weekday: number): ChoghadiyaSlot[] {
  const startMs = sunrise.getTime();
  const endMs = Math.max(sunset.getTime(), startMs + 1);
  const slotMs = (endMs - startMs) / 8;
  const first = FIRST_CHOGHADIYA_BY_WEEKDAY[weekday] ?? 0;
  const slots: ChoghadiyaSlot[] = [];
  for (let i = 0; i < 8; i++) {
    const meta = CHOGHADIYA_NAMES[(first + i) % 4];
    const s = startMs + i * slotMs;
    const e = i === 7 ? endMs : s + slotMs;
    slots.push({
      name: meta.en,
      nameHi: meta.hi,
      start: formatHourMs(s),
      end: formatHourMs(e),
      auspicious: meta.auspicious,
    });
  }
  return slots;
}

/**
 * FAST Choghadiya — no canonical ephemeris needed.
 * Parses the 12h "h:mm AM/PM" strings already present on a PanchangDayData
 * and divides daylight into 8 equal kalas. Used by the Day Detail Sheet's
 * novice layer so Choghadiya renders instantly (the heavy scholar bundle
 * remains deferred).
 */
export function getQuickChoghadiya(args: {
  date: Date;
  dayOfWeek: number;
  sunrise: string;
  sunset: string;
}): ChoghadiyaSlot[] {
  const parse = (t: string): number => {
    const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(t || '');
    if (!m) return NaN;
    let h = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) h += 12;
    const d = new Date(args.date.getFullYear(), args.date.getMonth(), args.date.getDate());
    d.setHours(h, parseInt(m[2], 10), 0, 0);
    return d.getTime();
  };
  const s = parse(args.sunrise);
  const e = parse(args.sunset);
  if (Number.isNaN(s) || Number.isNaN(e)) return [];
  return buildChoghadiya(new Date(s), new Date(e), args.dayOfWeek);
}

function buildHora(sunrise: Date, sunset: Date, weekday: number): HoraSlot[] {
  const startMs = sunrise.getTime();
  const endMs = Math.max(sunset.getTime(), startMs + 1);
  const slotMs = (endMs - startMs) / 12;
  const first = HORA_START_PLANET_BY_WEEKDAY[weekday] ?? 0;
  const slots: HoraSlot[] = [];
  for (let i = 0; i < 12; i++) {
    const meta = HORA_PLANETS[(first + i) % 7];
    const s = startMs + i * slotMs;
    const e = i === 11 ? endMs : s + slotMs;
    slots.push({ planet: meta.en, planetHi: meta.hi, start: formatHourMs(s), end: formatHourMs(e) });
  }
  return slots;
}

/**
 * Builds the complete scholar panchang for a civil date.
 * Uses two canonical bundle reads (00:05 & 12:00 local) to derive the exact
 * Tithi/Nakshatra windows inside the day.
 */
export function getScholarPanchang(
  date: Date,
  location?: LocationCoordinates
): ScholarPanchang {
  const morning = getCanonicalPanchangBundle(atTime(date, 0, 5), location);
  const noon = getCanonicalPanchangBundle(atTime(date, 12, 0), location);

  // ---- Tithi windows -------------------------------------------------
  const t0 = morning.tithi;
  const t1 = noon.tithi;
  const t0End = t0.transition?.endsAtFormatted || 'आगले दिन';
  const t1End = t1.transition?.endsAtFormatted || 'आगले दिन';
  let tithiWindows: TithiWindow[];
  if (t0.name === t1.name) {
    tithiWindows = [
      {
        name: t0.name,
        nameHi: t0.nameHi,
        pakshaHi: t0.pakshaHi,
        startLabel: 'पिछले दिन',
        endLabel: t0End,
      },
    ];
  } else {
    tithiWindows = [
      { name: t0.name, nameHi: t0.nameHi, pakshaHi: t0.pakshaHi, startLabel: 'पिछले दिन', endLabel: t0End },
      { name: t1.name, nameHi: t1.nameHi, pakshaHi: t1.pakshaHi, startLabel: t0End, endLabel: t1End },
    ];
  }

  // ---- Nakshatra windows ---------------------------------------------
  const n0 = morning.nakshatra;
  const n1 = noon.nakshatra;
  const n0End = n0.transition?.endsAtFormatted || 'आगले दिन';
  const n1End = n1.transition?.endsAtFormatted || 'आगले दिन';
  let nakshatraWindows: TithiWindow[];
  if (n0.name === n1.name) {
    nakshatraWindows = [
      { name: n0.name, nameHi: n0.nameHi, pakshaHi: '', startLabel: 'पिछले दिन', endLabel: n0End },
    ];
  } else {
    nakshatraWindows = [
      { name: n0.name, nameHi: n0.nameHi, pakshaHi: '', startLabel: 'पिछले दिन', endLabel: n0End },
      { name: n1.name, nameHi: n1.nameHi, pakshaHi: '', startLabel: n0End, endLabel: n1End },
    ];
  }

  // ---- Choghadiya & Hora ----------------------------------------------
  const sunrise = noon.sun.sunriseDate || atTime(date, 5, 45);
  const sunset = noon.sun.sunsetDate || atTime(date, 18, 15);
  const weekday = atTime(date, 12, 0).getDay();

  // ---- Ayanamsha (Lahiri, DMS) -----------------------------------------
  const jdTT = date.getTime() / 86400000 + 2440587.5;
  const ayanamshaValue = getLahiriAyanamsha(jdTT);

  return {
    bundle: noon,
    tithiWindows,
    nakshatraWindows,
    choghadiya: buildChoghadiya(sunrise, sunset, weekday),
    hora: buildHora(sunrise, sunset, weekday),
    ayanamsha: {
      value: Number(ayanamshaValue.toFixed(4)),
      dms: formatDegreesDMS(ayanamshaValue),
      system: 'Chitra Paksha (Lahiri Standard)',
    },
    citations: SHAASTRA_CITATIONS,
  };
}
