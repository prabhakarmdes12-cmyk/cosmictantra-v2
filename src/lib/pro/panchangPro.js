/**
 * WAVE 7 — PROFESSIONAL PANCHANG (calculation workstation)
 * ========================================================
 * Convention: IMPLEMENTED_CONVENTION_DRIK.
 *
 * MANDATORY: explicitly expose AT_INSTANT versus AT_LOCAL_SUNRISE reckoning.
 * (Release-1 Cosmic Now exposed a Tithi defect from conflating the two.)
 *
 * Provides: Tithi/Nakshatra/Pada/Yoga/Karana + transition times, Sunrise/Sunset,
 * Moonrise/Moonset, Hora, Rahu Kaal, Gulika, Yamaganda, Abhijit, Durmuhurta,
 * Brahma Muhurta, Choghadiya, festival/vrata rules.
 */

import { norm360 } from './math.js';

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
  'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
  'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];
const NAK_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];
const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shoola',
  'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti',
];
const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// ── astronomy (analytic, deterministic; consistent with canonical engine) ────
function jdOf(date) { return date.getTime() / 86400000 + 2440587.5; }
function ayan(jd) { const t = (jd - 2451545.0) / 36525; return 23.856 + 1.396 * t; }
function tropSun(jd) {
  const d = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * d) * Math.PI / 180;
  const q = 280.459 + 0.98564736 * d;
  return norm360(q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
}
function tropMoon(jd) {
  const d = jd - 2451545.0;
  const L = 218.316 + 13.176396 * d;
  const M = (134.963 + 13.064993 * d) * Math.PI / 180;
  const F = (93.272 + 13.229350 * d) * Math.PI / 180;
  const Ms = (357.529 + 0.98560028 * d) * Math.PI / 180;
  const D = (297.850 + 12.190749 * d) * Math.PI / 180;
  return norm360(L + 6.289 * Math.sin(M) - 1.274 * Math.sin(M - 2 * D) + 0.658 * Math.sin(2 * D) - 0.186 * Math.sin(Ms) - 0.059 * Math.sin(2 * M - 2 * D));
}
function sidSun(jd) { return norm360(tropSun(jd) - ayan(jd)); }
function sidMoon(jd) { return norm360(tropMoon(jd) - ayan(jd)); }

// find UTC instant when f(jd) reaches multiple of `step` after `startVal` — used for transitions
function findTransition(startDate, valueFn, step, currentIndex, maxHours = 60) {
  // binary-ish forward search minute-resolution then refine
  const target = (currentIndex + 1) * step;
  let lo = startDate.getTime();
  let hi = lo + maxHours * 3600 * 1000;
  const wrap = (v) => ((v % (step * (360 / step))) + (step * (360 / step))) % (360 / 1); // not used
  const val = (t) => valueFn(jdOf(new Date(t)));
  // ensure monotonic-ish increments handle wraparound at 360
  const norm = (v) => v;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    let v = val(mid);
    // account for wrap when target>360
    let cont = v + (v < val(startDate.getTime()) - 1 ? 360 : 0);
    if (cont < target) lo = mid; else hi = mid;
  }
  return new Date(hi);
}

// ── sunrise / sunset (from existing analytic model) ──────────────────────────
function sunTimes(date, lat, lng, tz) {
  const dayOfYear = Math.floor((date - new Date(date.getUTCFullYear(), 0, 0)) / 864e5);
  const declination = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * Math.PI / 180);
  const latRad = lat * Math.PI / 180;
  const decRad = declination * Math.PI / 180;
  const zenith = 90.833 * Math.PI / 180;
  const cosH = (Math.cos(zenith) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
  let hourAngle = 90;
  let circumpolar = false;
  if (cosH >= -1 && cosH <= 1) hourAngle = Math.acos(cosH) * 180 / Math.PI; else circumpolar = true;
  const b = (360 / 365) * (dayOfYear - 81) * Math.PI / 180;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  const solarNoon = (720 - 4 * lng - eot + tz * 60) / 60; // local hours
  const riseHours = solarNoon - hourAngle * 4 / 60;
  const setHours = solarNoon + hourAngle * 4 / 60;
  return { riseHours, setHours, solarNoon, circumpolar };
}

// Moonrise/Moonset approximation: Moon crosses horizon ~50 min later per day
function moonTimes(date, lat, lng, tz) {
  const jd = jdOf(date);
  const moonLon = tropMoon(jd);
  const sunLon = tropSun(jd);
  let phase = norm360(moonLon - sunLon); // 0=new,180=full
  const { riseHours, setHours } = sunTimes(date, lat, lng, tz);
  // Moon rises ~ (phase/360)*24h after sunrise
  const lag = (phase / 360) * 24;
  const moonrise = (riseHours + lag) % 24;
  const moonset = (setHours + lag) % 24;
  return { moonriseHours: moonrise, moonsetHours: moonset };
}

function toLocalClock(hours) {
  const h24 = ((hours % 24) + 24) % 24;
  const h = Math.floor(h24);
  const m = Math.round((h24 - h) * 60);
  const hh = (m === 60) ? h + 1 : h;
  const mm = (m === 60) ? 0 : m;
  const ap = hh < 12 ? 'AM' : 'PM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ap}`;
}

// ── element computations at an instant ───────────────────────────────────────
function elementsAt(jd) {
  const s = sidSun(jd);
  const m = sidMoon(jd);
  const diff = norm360(m - s);
  const tithiIdx = Math.floor(diff / 12); // 0..29
  const nakIdx = Math.floor(m / (360 / 27));
  const pada = Math.floor((m % (360 / 27)) / (360 / 108)) + 1;
  const yogaIdx = Math.floor(norm360(s + m) / (360 / 27));
  const karanaIdx = Math.floor(diff / 6);
  let karanaName;
  if (karanaIdx === 0) karanaName = 'Kimstughna';
  else if (karanaIdx >= 57) karanaName = ['Shakuni', 'Chatushpada', 'Naga'][karanaIdx - 57];
  else karanaName = MOVABLE_KARANAS[(karanaIdx - 1) % 7];
  return {
    tithi: { index: tithiIdx, number: (tithiIdx % 30) + 1, name: TITHI_NAMES[tithiIdx], paksha: tithiIdx < 15 ? 'Shukla' : 'Krishna', progress: ((diff % 12) / 12) * 100 },
    nakshatra: { index: nakIdx, name: NAK_NAMES[nakIdx % 27], pada, progress: ((m % (360 / 27)) / (360 / 27)) * 100 },
    yoga: { index: yogaIdx, name: YOGA_NAMES[yogaIdx % 27] },
    karana: { index: karanaIdx, name: karanaName },
    sunLongitude: Math.round(s * 100) / 100,
    moonLongitude: Math.round(m * 100) / 100,
  };
}

// transition end time for tithi/nak/yoga by forward search
function transitionEnd(startDate, kind) {
  const step = kind === 'tithi' ? 12 : kind === 'karana' ? 6 : (360 / 27);
  const fn = kind === 'yoga'
    ? (jd) => norm360(sidSun(jd) + sidMoon(jd))
    : kind === 'nakshatra'
      ? (jd) => sidMoon(jd)
      : (jd) => norm360(sidMoon(jd) - sidSun(jd)); // tithi & karana
  const startVal = fn(jdOf(startDate));
  const startIdx = Math.floor(startVal / step);
  const targetVal = (startIdx + 1) * step; // may exceed 360 → handle wrap
  let lo = startDate.getTime();
  let hi = lo + 60 * 3600 * 1000;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    let v = fn(jdOf(new Date(mid)));
    if (v < startVal - step) v += 360; // wrapped
    if (v < targetVal) lo = mid; else hi = mid;
  }
  return new Date(hi);
}

/**
 * Full professional panchang.
 * @param {Date} instant the moment (UTC) of interest
 * @param {object} place { latitude, longitude, timezone, name }
 * @param {string} reckoning 'AT_INSTANT' | 'AT_LOCAL_SUNRISE'
 */
export function computePanchangPro(instant, place, reckoning = 'AT_LOCAL_SUNRISE') {
  const lat = place.latitude, lng = place.longitude, tz = place.timezone ?? 5.5;
  // Local civil date
  const localMs = instant.getTime() + tz * 3600 * 1000;
  const local = new Date(localMs);
  const dateUTCmidnight = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));

  const st = sunTimes(dateUTCmidnight, lat, lng, tz);
  const mt = moonTimes(dateUTCmidnight, lat, lng, tz);

  // The reckoning instant: either the requested instant, or local sunrise.
  const sunriseUTC = new Date(dateUTCmidnight.getTime() + (st.riseHours - tz) * 3600 * 1000);
  const sunsetUTC = new Date(dateUTCmidnight.getTime() + (st.setHours - tz) * 3600 * 1000);
  const reckonInstant = reckoning === 'AT_INSTANT' ? instant : sunriseUTC;

  const els = elementsAt(jdOf(reckonInstant));

  // transitions (end times) from the reckoning instant
  const tithiEnd = transitionEnd(reckonInstant, 'tithi');
  const nakEnd = transitionEnd(reckonInstant, 'nakshatra');
  const yogaEnd = transitionEnd(reckonInstant, 'yoga');
  const karanaEnd = transitionEnd(reckonInstant, 'karana');

  const toLocalTime = (d) => toLocalClock((d.getTime() - dateUTCmidnight.getTime()) / 3600000 + tz);

  // muhurta windows (based on sunrise/sunset local hours)
  const weekday = ((Math.floor((dateUTCmidnight.getTime() / 864e5)) % 7) + 4) % 7; // 1970-01-01 = Thursday(4)
  const dayLen = st.setHours - st.riseHours;
  const seg = dayLen / 8;
  const RAHU = [8, 2, 7, 5, 6, 4, 3][weekday];
  const YAMA = [5, 4, 3, 2, 1, 7, 6][weekday];
  const GULIKA = [7, 6, 5, 4, 3, 2, 1][weekday];
  const win = (n) => ({ start: toLocalClock(st.riseHours + (n - 1) * seg), end: toLocalClock(st.riseHours + n * seg) });

  // choghadiya (day): 8 segments with weekday-rotating names
  const CHOG = ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg'];
  const CHOG_START = [0, 6, 4, 2, 5, 1, 3]; // Sun..Sat start index in a repeating list
  const dayChoghadiya = [];
  const CHOG_SEQ = ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'];
  const startIdx = CHOG_START[weekday];
  for (let i = 0; i < 8; i++) {
    const name = CHOG_SEQ[(startIdx + i) % 7];
    const good = ['Char', 'Labh', 'Amrit', 'Shubh'].includes(name);
    dayChoghadiya.push({ name, quality: good ? 'Auspicious' : 'Inauspicious', start: toLocalClock(st.riseHours + i * seg), end: toLocalClock(st.riseHours + (i + 1) * seg) });
  }

  // hora sequence (planetary hours) from sunrise, Chaldean order
  const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  const firstHoraLord = WEEKDAY_LORDS[weekday];
  const firstIdx = CHALDEAN.indexOf(firstHoraLord);
  const horaLen = dayLen / 12; // daytime horas (12), plus 12 night; simplified equal-day horas
  const horas = [];
  for (let i = 0; i < 24; i++) {
    const lord = CHALDEAN[(firstIdx + i) % 7];
    const h = st.riseHours + i * (24 / 24) * (dayLen / 12 > 0 ? 1 : 1); // approximate 1h horas
    horas.push({ index: i + 1, lord, start: toLocalClock(st.riseHours + i), end: toLocalClock(st.riseHours + i + 1) });
  }

  // Durmuhurta (2 inauspicious muhurtas), Abhijit, Brahma
  const muh = dayLen / 15;
  const abhijit = { start: toLocalClock(st.riseHours + 7 * muh), end: toLocalClock(st.riseHours + 8 * muh), suppressed: weekday === 3 };
  const brahma = { start: toLocalClock(st.riseHours - 96 / 60), end: toLocalClock(st.riseHours - 48 / 60) };
  const durmuhurta = [
    { start: toLocalClock(st.riseHours + 6.4 * muh), end: toLocalClock(st.riseHours + 7.4 * muh) },
  ];

  return {
    convention: 'IMPLEMENTED_CONVENTION_DRIK',
    reckoning, // AT_INSTANT | AT_LOCAL_SUNRISE
    reckoningInstantUTC: reckonInstant.toISOString(),
    date: local.toISOString().slice(0, 10),
    place: { ...place },
    weekday: WEEKDAY_NAMES[weekday],
    weekdayLord: WEEKDAY_LORDS[weekday],
    // Panchang limbs with transition (end) times
    tithi: { ...els.tithi, endsAt: toLocalTime(tithiEnd), endsAtUTC: tithiEnd.toISOString() },
    nakshatra: { ...els.nakshatra, endsAt: toLocalTime(nakEnd), endsAtUTC: nakEnd.toISOString() },
    yoga: { ...els.yoga, endsAt: toLocalTime(yogaEnd), endsAtUTC: yogaEnd.toISOString() },
    karana: { ...els.karana, endsAt: toLocalTime(karanaEnd), endsAtUTC: karanaEnd.toISOString() },
    // rise/set
    sunrise: toLocalClock(st.riseHours),
    sunset: toLocalClock(st.setHours),
    moonrise: toLocalClock(mt.moonriseHours),
    moonset: toLocalClock(mt.moonsetHours),
    circumpolar: st.circumpolar,
    // muhurtas
    rahuKaal: win(RAHU),
    yamaganda: win(YAMA),
    gulikaKaal: win(GULIKA),
    abhijit,
    brahmaMuhurta: brahma,
    durmuhurta,
    choghadiya: dayChoghadiya,
    hora: horas,
    // festival/vrata detection
    observances: festivalRules(els, weekday),
  };
}

/**
 * Festival / vrata rules — traceable classical tithi/nakshatra rules (batch).
 */
export function festivalRules(els, weekday) {
  const out = [];
  const t = els.tithi;
  const nak = els.nakshatra.name;
  const pk = t.paksha;
  const num = ((t.index % 15) + 1);
  if (num === 11) out.push({ name: 'Ekadashi Vrata', rule: '11th tithi of either paksha', tradition: 'Vaishnava' });
  if (num === 4 && pk === 'Krishna') out.push({ name: 'Sankashti Chaturthi', rule: 'Krishna Chaturthi', tradition: 'Ganesha' });
  if (num === 4 && pk === 'Shukla') out.push({ name: 'Vinayaka Chaturthi', rule: 'Shukla Chaturthi', tradition: 'Ganesha' });
  if (t.name === 'Purnima') out.push({ name: 'Purnima Vrata', rule: 'Full Moon', tradition: 'General' });
  if (t.name === 'Amavasya') out.push({ name: 'Amavasya', rule: 'New Moon', tradition: 'Pitru' });
  if (num === 8 && pk === 'Krishna') out.push({ name: 'Kalashtami', rule: 'Krishna Ashtami', tradition: 'Bhairava' });
  if (num === 13 && weekday === 1) out.push({ name: 'Soma Pradosh', rule: 'Trayodashi on Monday', tradition: 'Shiva' });
  if (weekday === 2 && nak === 'Ashwini') out.push({ name: 'Mangal-related muhurta note', rule: 'Tuesday + Ashwini', tradition: 'General' });
  return out;
}

export const RECKONING = { AT_INSTANT: 'AT_INSTANT', AT_LOCAL_SUNRISE: 'AT_LOCAL_SUNRISE' };

export default { computePanchangPro, festivalRules, RECKONING };
