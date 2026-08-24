/**
 * CosmicTantra V34 — Daily Panchang Engine
 * Calculates Tithi, Nakshatra, Nitya Yoga, Karana, Vara, Rahu Kala
 */

import { toJulianDay, getLahiriAyanamsha, NAKSHATRAS } from './astrologyEngine.js';

export const TITHIS = [
  { name: 'Pratipada', meaning: 'New Beginnings & Foundation' },
  { name: 'Dwitiya', meaning: 'Union & Collaboration' },
  { name: 'Tritiya', meaning: 'Action & Expression' },
  { name: 'Chaturthi', meaning: 'Overcoming Obstacles' },
  { name: 'Panchami', meaning: 'Wisdom & Learning' },
  { name: 'Shashthi', meaning: 'Victory & Health' },
  { name: 'Saptami', meaning: 'Travel & Mobility' },
  { name: 'Ashtami', meaning: 'Inner Strength & Protection' },
  { name: 'Navami', meaning: 'Completion & Discipline' },
  { name: 'Dashami', meaning: 'Success & Righteousness' },
  { name: 'Ekadashi', meaning: 'Spiritual Fasting & Purification' },
  { name: 'Dwadashi', meaning: 'Charity & Service' },
  { name: 'Trayodashi', meaning: 'Destruction of Negativity' },
  { name: 'Chaturdashi', meaning: 'Intensive Meditation' },
  { name: 'Purnima / Amavasya', meaning: 'Full Fulfillment / Transformation' },
];

export const YOGAS = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shoola', 'Ganda', 'Vriddhi', 'Dhruva',
  'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
  'Brahma', 'Indra', 'Vaidhriti'
];

export const KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti (Bhadra)',
  'Shakuni', 'Chatushpada', 'Naga', 'Kintughna'
];

export const VARAS = [
  { day: 'Sunday', planet: 'Sun', color: 'Orange/Gold', quality: 'Leadership & Vitality' },
  { day: 'Monday', planet: 'Moon', color: 'White/Silver', quality: 'Emotions & Intuition' },
  { day: 'Tuesday', planet: 'Mars', color: 'Red', quality: 'Courage & Energy' },
  { day: 'Wednesday', planet: 'Mercury', color: 'Green', quality: 'Intellect & Trade' },
  { day: 'Thursday', planet: 'Jupiter', color: 'Yellow', quality: 'Wisdom & Abundance' },
  { day: 'Friday', planet: 'Venus', color: 'White/Pink', quality: 'Love & Harmony' },
  { day: 'Saturday', planet: 'Saturn', color: 'Dark Blue/Black', quality: 'Discipline & Karma' },
];

export const RAHU_KALA_INDEX = {
  0: { startFraction: 0.875, endFraction: 1.0 },   // Sunday
  1: { startFraction: 0.125, endFraction: 0.25 },  // Monday
  2: { startFraction: 0.75,  endFraction: 0.875 }, // Tuesday
  3: { startFraction: 0.5,   endFraction: 0.625 }, // Wednesday
  4: { startFraction: 0.375, endFraction: 0.5 },   // Thursday
  5: { startFraction: 0.25,  endFraction: 0.375 }, // Friday
  6: { startFraction: 0.625, endFraction: 0.75 },  // Saturday
};

function normalizeAngle(a) { return ((a % 360) + 360) % 360; }
function degToRad(d) { return d * Math.PI / 180; }

function getSunLon(T) {
  const L0 = 280.46646 + 36000.76983 * T;
  const M = degToRad(normalizeAngle(357.52911 + 35999.05029 * T));
  return normalizeAngle(L0 + (1.914602 - 0.004817 * T) * Math.sin(M));
}

function getMoonLon(T) {
  const L1 = 218.3165 + 481267.8813 * T;
  const Mp = degToRad(normalizeAngle(134.9634 + 477198.8676 * T));
  const D = degToRad(normalizeAngle(297.8502 + 445267.1115 * T));
  return normalizeAngle(L1 + 6.2886 * Math.sin(Mp) + 1.2740 * Math.sin(2 * D - Mp));
}

export function calculatePanchang(date = new Date(), latitude = 25.5941, longitude = 85.1376, tzOffset = 5.5) {
  const localDate = new Date(date);
  const JD = toJulianDay(localDate);
  const T = (JD - 2451545.0) / 36525;
  const ayanamsha = getLahiriAyanamsha(JD);

  const sunTrop = getSunLon(T);
  const moonTrop = getMoonLon(T);

  const sunSid = normalizeAngle(sunTrop - ayanamsha);
  const moonSid = normalizeAngle(moonTrop - ayanamsha);

  const diff = normalizeAngle(moonSid - sunSid);
  const tithiIdx = Math.floor(diff / 12);
  const paksha = tithiIdx < 15 ? 'Shukla Paksha' : 'Krishna Paksha';
  const tithiName = TITHIS[tithiIdx % 15].name;

  const moonNakIdx = Math.floor(moonSid / 13.3333);
  const moonNakPada = Math.floor((moonSid % 13.3333) / 3.3333) + 1;
  const moonNakName = NAKSHATRAS[moonNakIdx % 27].name;

  const yogaSum = normalizeAngle(sunSid + moonSid);
  const yogaIdx = Math.floor(yogaSum / 13.3333);
  const yogaName = YOGAS[yogaIdx % 27];

  const karanaIdx = Math.floor(diff / 6);
  let karanaName;
  if (karanaIdx === 0) karanaName = 'Kintughna';
  else if (karanaIdx >= 57) karanaName = ['Shakuni', 'Chatushpada', 'Naga'][karanaIdx - 57];
  else karanaName = KARANAS[(karanaIdx - 1) % 7];

  const dayOfWeek = localDate.getDay();
  const varaInfo = VARAS[dayOfWeek];

  const sunriseHour = 6.0;
  const sunsetHour = 18.0;
  const dayDuration = sunsetHour - sunriseHour;

  const rInfo = RAHU_KALA_INDEX[dayOfWeek];
  const rStartH = sunriseHour + dayDuration * rInfo.startFraction;
  const rEndH = sunriseHour + dayDuration * rInfo.endFraction;

  function fmtH(h) {
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  return {
    date: localDate.toISOString().slice(0, 10),
    tithi: { index: tithiIdx + 1, name: tithiName, paksha, meaning: TITHIS[tithiIdx % 15].meaning },
    nakshatra: { name: moonNakName, pada: moonNakPada, index: moonNakIdx },
    yoga: { name: yogaName, index: yogaIdx },
    karana: { name: karanaName },
    vara: varaInfo,
    rahuKala: { start: fmtH(rStartH), end: fmtH(rEndH) },
    sunrise: fmtH(sunriseHour),
    sunset: fmtH(sunsetHour),
  };
}

export default { calculatePanchang };
