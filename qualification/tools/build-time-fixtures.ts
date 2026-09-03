/**
 * TIME FIXTURE BUILDER — Sprint E (Vimshottari + Panchanga certification).
 *
 * Emits qualification/fixtures/time-fixtures.json with three kinds of content,
 * each honestly labeled:
 *
 *   1. CLASSICAL_TABLES (SOURCE_SECONDARY): the Vimshottari lord cycle and years,
 *      the 27-nakshatra starting-lord table, the panchanga limb name tables and
 *      the classical 8-segment muhurta factors (Rahu/Yamaganda/Gulika per vara).
 *      Written from the classical rules as received through standard translations;
 *      no verse-level locator is claimed.
 *   2. GOLDEN CHARTS (ENGINE_DERIVED): canonical Vimshottari schedules captured
 *      from the working engine (dashaEngine.js) at build time — regression pins,
 *      NOT external references (CT_INV_005: never labeled as validated).
 *   3. GOLDEN PANCHANG (ENGINE_DERIVED): canonical limb labels and TRUE-INSTANT
 *      solar timings captured from the working engine (post Sprint E host-TZ fix).
 *
 * Usage: npx tsx qualification/tools/build-time-fixtures.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { calculateVimshottariDasha, DASHA_LORDS } from '../../src/lib/dashaEngine.js';
import { calculatePanchang } from '../../src/lib/panchang.js';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';

const FIXTURE_SET_ID = 'TIME_ENGINE_BENCHMARK_001';
const BUILDER_VERSION = 'build-time-fixtures-1.0.0';

/* ------------------------------------------------------------------------- */
/* 1. Classical tables (SOURCE_SECONDARY)                                     */
/* ------------------------------------------------------------------------- */

const VIMSHOTTARI_CLASSICAL = {
  lordOrder: ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'],
  years: { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 },
  totalYears: 120,
  yearLengthDays: 365.25, // the adopted Vimshottari year: 365.25 days (declared convention)
  nakshatraSpanDeg: 360 / 27
};

// Starting lord of each of the 27 nakshatras (Ashwini .. Revati): the classical
// cycle Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury, repeat.
const NAKSHATRA_START_LORDS: Array<{ nakshatra: number; name: string; lord: string }> = (() => {
  const names = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
  ];
  return names.map((name, i) => ({ nakshatra: i + 1, name, lord: VIMSHOTTARI_CLASSICAL.lordOrder[i % 9] }));
})();

const PANCHANGA_TABLES = {
  tithis: ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima', 'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'],
  yogas: ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shoola', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'],
  movableKaranas: ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'],
  fixedKaranas: { 0: 'Kintughna', 57: 'Shakuni', 58: 'Chatushpada', 59: 'Naga' },
  // Classical 8-segment day-division factors, per vara (Sunday..Saturday).
  muhurtaFactors: [
    { vara: 'Sunday', rahu: 8, yamaganda: 5, gulika: 7 },
    { vara: 'Monday', rahu: 2, yamaganda: 4, gulika: 6 },
    { vara: 'Tuesday', rahu: 7, yamaganda: 3, gulika: 5 },
    { vara: 'Wednesday', rahu: 5, yamaganda: 2, gulika: 4 },
    { vara: 'Thursday', rahu: 6, yamaganda: 1, gulika: 3 },
    { vara: 'Friday', rahu: 4, yamaganda: 7, gulika: 2 },
    { vara: 'Saturday', rahu: 3, yamaganda: 6, gulika: 1 }
  ]
};

/* ------------------------------------------------------------------------- */
/* 2. Golden charts (ENGINE_DERIVED)                                          */
/* ------------------------------------------------------------------------- */

const GOLDEN_CHARTS = [
  { chartId: 'PRIYA_SHARMA_PATNA', birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna, India' },
  { chartId: 'PRABHAKAR_BILASPUR', birthDate: '1989-05-26', birthTime: '02:20:30', latitude: 22.0797, longitude: 82.1391, timezone: 5.5, locationName: 'Bilaspur, Chhattisgarh, India' },
  { chartId: 'NAKSHATRA_EDGE_KRITTICA_START', birthDate: '2000-01-01', birthTime: '06:00', latitude: 28.6139, longitude: 77.209, timezone: 5.5, locationName: 'Delhi, India' }
];

function captureVimshottariGolden(chart: (typeof GOLDEN_CHARTS)[number]) {
  const snap = getCanonicalJyotishSnapshot({
    birthDate: chart.birthDate, birthTime: chart.birthTime,
    latitude: chart.latitude, longitude: chart.longitude,
    timezone: chart.timezone, locationName: chart.locationName
  });
  const moonLon = (snap.planetsArray as Array<{ name: string; longitude: number }>).find((p) => p.name === 'Moon')!.longitude;
  const nakIndex = Math.floor(moonLon / (360 / 27));
  const dasha = calculateVimshottariDasha(moonLon, chart.birthDate, new Date(`${chart.birthDate}T00:00:00.000Z`)) as any;
  return {
    chartId: chart.chartId,
    birthDate: chart.birthDate,
    moonSiderealLongitude: moonLon,
    nakshatraIndex: nakIndex,
    expectedStartLord: VIMSHOTTARI_CLASSICAL.lordOrder[nakIndex % 9],
    startingBalance: dasha.startingBalance,
    mahadashas: dasha.mahadashas.map((m: any) => ({
      lord: m.lord, startDate: m.startDate, endDate: m.endDate,
      antardashaLords: m.antardashas.map((a: any) => a.lord)
    })),
    // Full antardasha tree of the Rahu mahadasha (the chart's 4th MD for most births)
    // + full pratyantardasha tree of its first antardasha — boundary-time pins.
    rahuMahaDetail: (() => {
      const rahu = dasha.mahadashas.find((m: any) => m.lord === 'Rahu');
      if (!rahu) return null;
      return {
        startDate: rahu.startDate,
        endDate: rahu.endDate,
        antardashas: rahu.antardashas.map((a: any) => ({ lord: a.lord, startDate: a.startDate, endDate: a.endDate })),
        firstAntardashaPratyantardashas: rahu.antardashas[0].pratyantardashas.map((p: any) => ({ lord: p.lord, startDate: p.startDate, endDate: p.endDate }))
      };
    })()
  };
}

/* ------------------------------------------------------------------------- */
/* 3. Golden panchang (ENGINE_DERIVED, true instants post Sprint E fix)       */
/* ------------------------------------------------------------------------- */

const GOLDEN_PANCHANG_SCENARIOS = [
  { id: 'VARANASI_SHIVARATRI', instant: '2026-02-15T06:00:00Z', lat: 25.3176, lng: 82.9739, tz: 5.5 },
  { id: 'PATNA_DIWALI', instant: '2026-11-08T06:00:00Z', lat: 25.5941, lng: 85.1376, tz: 5.5 },
  { id: 'DELHI_MONDAY_MORNING', instant: '2026-03-16T03:30:00Z', lat: 28.6139, lng: 77.209, tz: 5.5 },
  { id: 'MUMBAI_EVENING', instant: '2026-06-21T13:00:00Z', lat: 19.076, lng: 72.8777, tz: 5.5 },
  { id: 'PATNA_PRE_DAWN', instant: '2026-01-14T20:30:00Z', lat: 25.5941, lng: 85.1376, tz: 5.5 }
];

function capturePanchangGolden(s: (typeof GOLDEN_PANCHANG_SCENARIOS)[number]) {
  const p = calculatePanchang(new Date(s.instant), { lat: s.lat, lng: s.lng, tz: s.tz, name: s.id }) as any;
  return {
    id: s.id,
    instant: s.instant,
    lat: s.lat, lng: s.lng, tz: s.tz,
    civilDate: p.date,
    tithi: { number: p.tithi.number, name: p.tithi.name, paksha: p.tithi.paksha },
    nakshatra: { name: p.nakshatra.name, pada: p.nakshatra.pada },
    yoga: { name: p.yoga.name },
    karana: { name: p.karana.name },
    sunriseUtc: p.sun.sunriseDate.toISOString(),
    sunsetUtc: p.sun.sunsetDate.toISOString(),
    rahuStartUtc: p.timings.rahuStart.toISOString(),
    rahuEndUtc: p.timings.rahuEnd.toISOString(),
    yamaganda: p.timings.yamaganda,
    gulikaKalam: p.timings.gulikaKalam,
    abhijitMuhurat: p.timings.abhijitMuhurat
  };
}

/* ------------------------------------------------------------------------- */
/* Emit                                                                       */
/* ------------------------------------------------------------------------- */

const goldenCharts = GOLDEN_CHARTS.map(captureVimshottariGolden);
const goldenPanchang = GOLDEN_PANCHANG_SCENARIOS.map(capturePanchangGolden);

const payload = {
  fixtureSetId: FIXTURE_SET_ID,
  builder: BUILDER_VERSION,
  createdAtUtc: new Date().toISOString(),
  engineVersion: 'V37.0',
  classicalTables: {
    source: { statement: 'Brihat Parashara Hora Shastra (Vimshottara dasha chapter) and standard panchanga limnology', status: 'SOURCE_SECONDARY' },
    vimshottari: VIMSHOTTARI_CLASSICAL,
    nakshatraStartLords: NAKSHATRA_START_LORDS,
    panchanga: PANCHANGA_TABLES
  },
  goldenCharts,
  goldenPanchang
};

const sha = crypto.createHash('sha256').update(JSON.stringify({
  classicalTables: payload.classicalTables, goldenCharts, goldenPanchang
})).digest('hex');

const out = { ...payload, setSha256: sha };
const dest = path.join(__dirname, '..', 'fixtures', 'time-fixtures.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 1));
console.log(`time fixtures: ${goldenCharts.length} golden charts, ${goldenPanchang.length} golden panchang scenarios`);
console.log(`setSha256 ${sha}`);
// sanity: engine lord table must equal the classical cycle order
const engineOrder = DASHA_LORDS.map((l) => l.name).join(',');
if (engineOrder !== VIMSHOTTARI_CLASSICAL.lordOrder.join(',')) {
  console.error(`FATAL: engine DASHA_LORDS order (${engineOrder}) differs from classical cycle`);
  process.exit(1);
}
console.log(`written ${dest}`);
