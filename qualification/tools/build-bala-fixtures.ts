/**
 * BALA FIXTURE BUILDER — Sprint F (Shadbala + Bhava Bala + Ashtakavarga validation).
 * Mission Sections 10-12.
 *
 * Emits qualification/fixtures/bala-fixtures.json with:
 *   1. CLASSICAL_TABLES (SOURCE_SECONDARY): Ashtakavarga benefic-point rules with the
 *      binding per-planet totals (48/49/39/54/56/52/39, SAV 337), Naisargika virupas,
 *      exaltation/debilitation points, Moolatrikona zones, Dig Bala strong houses,
 *      special aspects, the Saptavargaja dignity scale, and the same-lord rashi pairs
 *      (the spec an Ekadhipatya implementation must satisfy — not implemented yet).
 *      The required-minimum Rupas table is carried with status ATTRIBUTION_UNVERIFIED.
 *   2. GOLDEN CHARTS (ENGINE_DERIVED): full Shadbala component pins, Bhava Bala pins
 *      and Ashtakavarga pins captured from the working engine — regression pins,
 *      NOT external references (CT_INV_005).
 *
 * Usage: npx tsx qualification/tools/build-bala-fixtures.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { calculateAshtakavarga } from '../../src/lib/jyotish/ashtakavargaEngine';
import { calculateFullShadbala, calculateBhavaBala, REQUIRED_SHADBALA_RUPAS, NAISARGIKA_VIRUPAS, DEBILITATION_POINTS, MOOLATRIKONA_ZONES } from '../../src/lib/jyotish/balaEngine';

const FIXTURE_SET_ID = 'BALA_ENGINE_BENCHMARK_001';
const BUILDER_VERSION = 'build-bala-fixtures-1.0.0';

const BAV_RULES: Record<string, Record<string, number[]>> = {
  Sun: { Sun: [1, 2, 4, 7, 8, 9, 10, 11], Moon: [3, 6, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11], Mercury: [3, 5, 6, 9, 10, 11, 12], Jupiter: [5, 6, 9, 11], Venus: [6, 7, 12], Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [3, 4, 6, 10, 11, 12] },
  Moon: { Sun: [3, 6, 7, 8, 10, 11], Moon: [1, 3, 6, 7, 10, 11], Mars: [2, 3, 5, 6, 9, 10, 11], Mercury: [1, 3, 4, 5, 7, 8, 10, 11], Jupiter: [1, 4, 7, 8, 10, 11, 12], Venus: [3, 4, 5, 7, 9, 10, 11], Saturn: [3, 5, 6, 11], Lagna: [3, 6, 10, 11] },
  Mars: { Sun: [3, 5, 6, 10, 11], Moon: [3, 6, 11], Mars: [1, 2, 4, 7, 8, 10, 11], Mercury: [3, 5, 6, 11], Jupiter: [6, 10, 11, 12], Venus: [6, 8, 11, 12], Saturn: [1, 4, 7, 8, 9, 10, 11], Lagna: [1, 3, 6, 10, 11] },
  Mercury: { Sun: [5, 6, 9, 11, 12], Moon: [2, 4, 6, 8, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11], Mercury: [1, 3, 5, 6, 9, 10, 11, 12], Jupiter: [6, 8, 11, 12], Venus: [1, 2, 3, 4, 5, 8, 9, 11], Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [1, 2, 4, 6, 8, 10, 11] },
  Jupiter: { Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11], Moon: [2, 5, 7, 9, 11], Mars: [1, 2, 4, 7, 8, 10, 11], Mercury: [1, 2, 4, 5, 6, 9, 10, 11], Jupiter: [1, 2, 3, 4, 7, 8, 10, 11], Venus: [2, 5, 6, 9, 10, 11], Saturn: [3, 5, 6, 12], Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11] },
  Venus: { Sun: [8, 11, 12], Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12], Mars: [3, 5, 6, 9, 11, 12], Mercury: [3, 5, 6, 9, 11], Jupiter: [5, 8, 9, 10, 11], Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11], Saturn: [3, 4, 5, 8, 9, 10, 11], Lagna: [1, 2, 3, 4, 5, 8, 9, 11] },
  Saturn: { Sun: [1, 2, 4, 7, 8, 10, 11], Moon: [3, 6, 11], Mars: [3, 5, 6, 10, 11, 12], Mercury: [6, 8, 9, 10, 11, 12], Jupiter: [5, 6, 11, 12], Venus: [6, 11, 12], Saturn: [3, 5, 6, 11], Lagna: [1, 3, 4, 6, 10, 11] }
};

// The binding classical totals (chart-independent): each contributor list marks len(list)
// relative positions, so every chart's BAV for a planet sums to the same constant.
const BAV_TOTALS: Record<string, number> = {};
for (const [target, rules] of Object.entries(BAV_RULES)) {
  BAV_TOTALS[target] = Object.values(rules).reduce((a, list) => a + list.length, 0);
}
// sanity at build time: 48/49/39/54/56/52/39, SAV 337
const EXPECTED = { Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39 };
for (const [k, v] of Object.entries(EXPECTED)) {
  if (BAV_TOTALS[k] !== v) {
    console.error(`FATAL: builder transcription of ${k} BAV sums ${BAV_TOTALS[k]}, classical total is ${v}`);
    process.exit(1);
  }
}
const SAV_TOTAL = Object.values(BAV_TOTALS).reduce((a, b) => a + b, 0);
if (SAV_TOTAL !== 337) {
  console.error(`FATAL: SAV total ${SAV_TOTAL} != 337`);
  process.exit(1);
}

const CLASSICAL_TABLES = {
  source: {
    statement: 'Brihat Parashara Hora Shastra — Ashtakavarga benefic-point distributions and Shadbala constants (verse-level locators not independently verified; the binding checks are the classical BAV/SAV totals reproduced exactly by these tables).',
    status: 'SOURCE_SECONDARY'
  },
  ashtakavarga: {
    bavRules: BAV_RULES,
    bavTotals: BAV_TOTALS,
    savTotal: SAV_TOTAL,
    sameLordRashiPairs: [
      { lord: 'Mars', rashis: [1, 8] }, { lord: 'Venus', rashis: [2, 7] }, { lord: 'Mercury', rashis: [3, 6] },
      { lord: 'Jupiter', rashis: [9, 12] }, { lord: 'Saturn', rashis: [10, 11] }
    ],
    ekadhipatyaStatus: 'NOT_IMPLEMENTED (declared; see engine and Sprint F doc)'
  },
  naisargikaVirupas: NAISARGIKA_VIRUPAS,
  debilitationPoints: DEBILITATION_POINTS,
  moolatrikonaZones: MOOLATRIKONA_ZONES,
  digBalaStrongHouses: { Sun: 10, Mars: 10, Jupiter: 1, Mercury: 1, Saturn: 7, Moon: 4, Venus: 4 },
  specialAspects: { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] },
  saptavargajaScale: { MOOLATRIKONA: 45, OWN_SIGN: 30, ATI_MITRA: 20, MITRA: 15, SAMA: 10, SHATRU: 4, ATI_SHATRU: 2 },
  requiredRupas: {
    values: REQUIRED_SHADBALA_RUPAS,
    status: 'ATTRIBUTION_UNVERIFIED',
    note: 'The engine\'s declared minimums are carried as-is; the verse-level classical values have not been independently verified. Never cited as a verse-verified figure.'
  }
};

/* ------------------------------------------------------------------------- */
/* Golden charts (ENGINE_DERIVED regression pins)                             */
/* ------------------------------------------------------------------------- */

const GOLDEN_CHARTS = [
  {
    chartId: 'KERNEL_RELEASE_TEST_CHART',
    lagnaLongitude: 103.6864,
    planets: [
      { name: 'Sun', longitude: 280.3687, rashiId: 10 },
      { name: 'Moon', longitude: 223.3239, rashiId: 8 },
      { name: 'Mars', longitude: 327.9639, rashiId: 11 },
      { name: 'Mercury', longitude: 271.8889, rashiId: 10 },
      { name: 'Jupiter', longitude: 25.2542, rashiId: 1 },
      { name: 'Venus', longitude: 241.5652, rashiId: 9 },
      { name: 'Saturn', longitude: 40.3961, rashiId: 2 }
    ]
  },
  {
    chartId: 'PATNA_GOLDEN_CHART',
    lagnaLongitude: 152.0985,
    planets: [
      { name: 'Sun', longitude: 60.7930, rashiId: 3 },
      { name: 'Moon', longitude: 268.8655, rashiId: 10 },
      { name: 'Mars', longitude: 128.3307, rashiId: 5 },
      { name: 'Mercury', longitude: 48.2289, rashiId: 2 },
      { name: 'Jupiter', longitude: 145.5702, rashiId: 6 },
      { name: 'Venus', longitude: 90.0515, rashiId: 4 },
      { name: 'Saturn', longitude: 236.6720, rashiId: 9 }
    ]
  }
];

function houseOf(longitude: number, lagnaLongitude: number): number {
  const lonRashi = Math.floor((((longitude % 360) + 360) % 360) / 30);
  const lagRashi = Math.floor((((lagnaLongitude % 360) + 360) % 360) / 30);
  return ((lonRashi - lagRashi + 12) % 12) + 1;
}

function captureGolden(chart: (typeof GOLDEN_CHARTS)[number]) {
  const withHouse = chart.planets.map((p) => ({ ...p, house: houseOf(p.longitude, chart.lagnaLongitude), speed: undefined, isRetrograde: false }));
  const lagnaRashiId = Math.floor((((chart.lagnaLongitude % 360) + 360) % 360) / 30) + 1;
  const av = calculateAshtakavarga(
    Object.fromEntries(chart.planets.map((p) => [p.name, { rashiId: p.rashiId }])),
    lagnaRashiId
  );
  const shadbala = calculateFullShadbala(chart.lagnaLongitude, withHouse as any, undefined);
  const bhavaBala = calculateBhavaBala(lagnaRashiId, shadbala, withHouse as any);
  return {
    chartId: chart.chartId,
    lagnaLongitude: chart.lagnaLongitude,
    ashtakavarga: {
      bav: av.bav,
      sav: av.sav,
      totalBindus: av.totalBindus,
      houseSav: av.houseSav.map((h) => ({ house: h.house, bindus: h.bindus })),
      trikonaShodhana: av.shodhana.trikonaShodhana
    },
    shadbala: Object.fromEntries(Object.entries(shadbala).map(([k, r]) => [k, {
      sthanaTotal: r.sthana.totalVirupas,
      digTotal: r.dig.totalVirupas,
      kalaTotal: r.kala.totalVirupas,
      nathonnatha: r.kala.nathonnathaBala,
      cheshtaTotal: r.cheshta.totalVirupas,
      naisargika: r.naisargika.totalVirupas,
      drikTotal: r.drik.totalVirupas,
      totalVirupas: r.totalVirupas,
      totalRupas: r.totalRupas,
      strengthRatio: r.strengthRatio
    }])),
    bhavaBala: bhavaBala.map((b) => ({ house: b.houseNumber, lord: b.lord, totalVirupas: b.totalVirupas, totalRupas: b.totalRupas }))
  };
}

const goldenCharts = GOLDEN_CHARTS.map(captureGolden);

const payload = {
  fixtureSetId: FIXTURE_SET_ID,
  builder: BUILDER_VERSION,
  createdAtUtc: new Date().toISOString(),
  engineVersion: 'V37.0',
  classicalTables: CLASSICAL_TABLES,
  goldenCharts
};

const sha = crypto.createHash('sha256').update(JSON.stringify({
  classicalTables: payload.classicalTables, goldenCharts
})).digest('hex');

const dest = path.join(__dirname, '..', 'fixtures', 'bala-fixtures.json');
fs.writeFileSync(dest, JSON.stringify({ ...payload, setSha256: sha }, null, 1));
console.log(`bala fixtures: ${goldenCharts.length} golden charts; BAV totals ${JSON.stringify(BAV_TOTALS)}; SAV ${SAV_TOTAL}`);
console.log(`setSha256 ${sha}`);
console.log(`written ${dest}`);
