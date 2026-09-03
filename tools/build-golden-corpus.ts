/**
 * Builds qualification/fixtures/golden-chart-corpus.json (GOLDEN_CHART_CORPUS_001).
 * Mission §20: a permanent regression corpus of >= 100 charts covering ordinary
 * cases, sign / nakshatra / varga / dasha boundaries, combustion edges,
 * retrograde cases, unusual latitudes, timezone complexity, yoga and dosha
 * examples — with the founder's reviewed chart as exactly ONE fixture, "never
 * as proof that the engine works generally".
 *
 * Expectations are ENGINE_DERIVED regression pins: the astronomy kernel is
 * separately certified against JPL DE441 (Sprint C); this corpus pins the
 * Jyotisha derivation layers on top of it (rashi/nakshatra/varga/dasha/
 * combustion/dosha conventions). Every chart stores input, normalized input,
 * expected astronomical + derived facts, tolerance, source and validation
 * state per the charter.
 *
 * Deterministic: seeded scan, no timestamps. Run: npx tsx tools/build-golden-corpus.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import type { CanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';

export const GOLDEN_CORPUS_BUILDER_VERSION = 'golden-corpus-builder-1.0.0 (sprint K)';

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(v as Record<string, unknown>).sort()
    .map((k) => JSON.stringify(k) + ':' + stableStringify((v as Record<string, unknown>)[k]))
    .join(',') + '}';
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAK_SPAN = 360 / 27; // 13.3333…°
const D9_SPAN = 30 / 9;    // 3.3333…°

const RASHI_ID_BY_NAME: Record<string, number> = {
  Mesha: 1, Vrishabha: 2, Mithuna: 3, Karka: 4, Simha: 5, Kanya: 6,
  Tula: 7, Vrishchika: 8, Dhanu: 9, Makara: 10, Kumbha: 11, Meena: 12
};

const COMBUSTIBLES = ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

export interface CorpusChart {
  chartId: string;
  category: string;
  input: { birthDate: string; birthTime: string; latitude: number; longitude: number; timezone: number; locationName: string };
  normalizedInput: { utcInstant: string; julianDay: number };
  expected: {
    astronomical: {
      ayanamshaValue: number;
      ascendantSiderealLongitude: number;
      planets: Record<string, { siderealLongitude: number; rashiId: number; degreeInRasi: number; isRetrograde: boolean }>;
    };
    derived: {
      lagnaRashiId: number;
      moonNakshatraId: number; // 1-based (Ashwini = 1), derived arithmetically from the sidereal longitude
      moonPada: number;
      navamshaMoonRashiId: number;
      firstDashaLord: string;
      firstDashaBalanceYears: number;
      combustion: Array<{ planet: string; applicable: boolean; isCombust: boolean; orb: number | null; separation: number | null; severity: string }>;
      kalsarpaStatus: string;
      manglikIsManglik: boolean;
    };
  };
  boundaryClaim: Record<string, unknown> | null;
  tolerance: { degrees: number; years: number };
  source: { kind: string; reference: string };
  validationState: 'INTERNALLY_VERIFIED';
}

export interface CorpusFixture {
  fixtureSetId: string;
  builder: string;
  engineNote: string;
  charterNote: string;
  charterCategoryCount: number;
  founderCount: number;
  chartCount: number;
  coverage: Record<string, number>;
  charts: CorpusChart[];
  setSha256: string;
}

function buildFacts(snap: CanonicalJyotishSnapshot): CorpusChart['expected'] {
  const s = snap as unknown as Record<string, any>;
  const planets: CorpusChart['expected']['astronomical']['planets'] = {};
  for (const p of s.planetsArray as any[]) {
    planets[p.name] = {
      siderealLongitude: p.longitude,
      rashiId: p.rashiId,
      degreeInRasi: p.degreeInRasi,
      isRetrograde: !!p.isRetrograde
    };
  }
  const moon = (s.planetsArray as any[]).find((p) => p.name === 'Moon')!;
  const nakOffset = ((moon.longitude % NAK_SPAN) + NAK_SPAN) % NAK_SPAN;
  const d9Row = (s.vargas.d9Navamsha as any[]).find((v) => v.planet === 'Moon');
  const rel = s.relationships.combustions as Record<string, any>;
  const yd = s.yogasAndDoshas;
  return {
    astronomical: {
      ayanamshaValue: s.meta.ayanamshaValue,
      ascendantSiderealLongitude: s.lagna.longitude,
      planets
    },
    derived: {
      lagnaRashiId: s.lagna.rashiId,
      moonNakshatraId: Math.floor(moon.longitude / NAK_SPAN) + 1,
      moonPada: Math.floor(nakOffset / (NAK_SPAN / 4)) + 1,
      navamshaMoonRashiId: d9Row.navamshaRashiId,
      firstDashaLord: s.dasha.mahadashas[0].lord,
      firstDashaBalanceYears: s.dasha.mahadashas[0].actualDurationYears,
      combustion: [...COMBUSTIBLES, 'Sun', 'Rahu', 'Ketu'].map((planet) => {
        const c = rel[planet];
        return {
          planet,
          applicable: !!c.applicable,
          isCombust: !!c.isCombust,
          orb: c.applicable ? c.combustionOrb : null,
          separation: c.applicable ? c.angularDistanceToSun : null,
          severity: c.severity ?? null
        };
      }),
      kalsarpaStatus: yd.kalsarpa?.status ?? 'NOT_CALCULATED',
      manglikIsManglik: !!yd.manglik?.isManglik
    }
  };
}

function makeChart(
  chartId: string,
  category: string,
  input: CorpusChart['input'],
  snap: CanonicalJyotishSnapshot,
  boundaryClaim: Record<string, unknown> | null
): CorpusChart {
  const s = snap as unknown as Record<string, any>;
  // Normalize the civil input to UTC directly: meta.julianDay is the DYNAMICAL
  // (TT) Julian Day and carries Delta-T (~30-70 s), so it must never be used
  // to derive the civil UTC instant.
  const [y, m, d] = input.birthDate.split('-').map(Number);
  const [hh, mm] = input.birthTime.split(':').map(Number);
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) - input.timezone * 3600000;
  return {
    chartId,
    category,
    input,
    normalizedInput: { utcInstant: new Date(utcMs).toISOString(), julianDay: s.meta.julianDay },
    expected: buildFacts(snap),
    boundaryClaim,
    tolerance: { degrees: 1e-6, years: 0.02 },
    source: {
      kind: 'ENGINE_DERIVED_REGRESSION',
      reference: 'Astronomy kernel certified vs JPL DE441 (docs/reference-grade/astronomy-certification.md, Sprint C); this corpus pins the Jyotisha derivation layers (rashi/nakshatra/varga/dasha/combustion/dosha) on top of it.'
    },
    validationState: 'INTERNALLY_VERIFIED'
  };
}

/** Category scan predicates — each returns a boundaryClaim when the chart qualifies. */
function signBoundaryClaim(s: Record<string, any>): Record<string, unknown> | null {
  for (const p of s.planetsArray as any[]) {
    const d = p.degreeInRasi;
    const dist = Math.min(d, 30 - d);
    if (dist <= 0.15) return { type: 'SIGN_BOUNDARY', planet: p.name, distanceToEdgeDeg: dist, degreeInRasi: d };
  }
  return null;
}
function nakshatraBoundaryClaim(s: Record<string, any>): Record<string, unknown> | null {
  const moon = (s.planetsArray as any[]).find((p) => p.name === 'Moon')!;
  const off = ((moon.longitude % NAK_SPAN) + NAK_SPAN) % NAK_SPAN;
  const dist = Math.min(off, NAK_SPAN - off);
  if (dist <= 0.25) return { type: 'NAKSHATRA_BOUNDARY', planet: 'Moon', distanceToEdgeDeg: dist, nakshatraOffsetDeg: off };
  return null;
}
function vargaBoundaryClaim(s: Record<string, any>): Record<string, unknown> | null {
  for (const p of s.planetsArray as any[]) {
    const off = ((p.longitude % D9_SPAN) + D9_SPAN) % D9_SPAN;
    const dist = Math.min(off, D9_SPAN - off);
    if (dist <= 0.12) return { type: 'VARGA_BOUNDARY', planet: p.name, distanceToD9EdgeDeg: dist };
  }
  return null;
}
function dashaBoundaryClaim(s: Record<string, any>): Record<string, unknown> | null {
  const first = s.dasha.mahadashas[0];
  if (first.actualDurationYears <= 1.0) {
    return { type: 'DASHA_BOUNDARY', firstLord: first.lord, balanceYears: first.actualDurationYears, nominalYears: first.totalNominalYears };
  }
  return null;
}
function combustionEdgeClaim(s: Record<string, any>): Record<string, unknown> | null {
  const rel = s.relationships.combustions as Record<string, any>;
  for (const planet of COMBUSTIBLES) {
    const c = rel[planet];
    if (!c.applicable) continue;
    const d = Math.abs(c.angularDistanceToSun - c.combustionOrb);
    if (d <= 0.3) {
      const p = (s.planetsArray as any[]).find((q) => q.name === planet);
      return { type: 'COMBUSTION_EDGE', planet, separationDeg: c.angularDistanceToSun, adoptedOrb: c.combustionOrb, distanceToOrbDeg: d, isRetrograde: !!p.isRetrograde };
    }
  }
  return null;
}
function retrogradeClaim(s: Record<string, any>): Record<string, unknown> | null {
  const inner = (['Mercury', 'Venus', 'Mars'] as const)
    .map((n) => (s.planetsArray as any[]).find((p) => p.name === n)!)
    .filter((p) => p.isRetrograde)
    .map((p) => p.name);
  if (inner.length >= 1) return { type: 'RETROGRADE_CASE', retrogradeInnerPlanets: inner };
  return null;
}
function yogaClaim(s: Record<string, any>): Record<string, unknown> | null {
  const present = (s.yogasAndDoshas.yogas as any[]).filter((y) => y.status === 'PRESENT').map((y) => y.id);
  if (present.length >= 1) return { type: 'YOGA_EXAMPLE', presentYogas: present.slice(0, 8) };
  return null;
}
function doshaClaim(s: Record<string, any>): Record<string, unknown> | null {
  const k = s.yogasAndDoshas.kalsarpa?.status;
  const m = !!s.yogasAndDoshas.manglik?.isManglik;
  if (k === 'PRESENT' || k === 'INDETERMINATE') return { type: 'DOSHA_EXAMPLE', kalsarpaStatus: k, manglik: m };
  if (m) return { type: 'DOSHA_EXAMPLE', kalsarpaStatus: k, manglik: true };
  return null;
}

interface CategorySpec {
  category: string;
  count: number;
  claim: ((s: Record<string, any>) => Record<string, unknown> | null) | null;
}

const CATEGORY_SPECS: CategorySpec[] = [
  { category: 'ORDINARY', count: 10, claim: null },
  { category: 'SIGN_BOUNDARY', count: 10, claim: signBoundaryClaim },
  { category: 'NAKSHATRA_BOUNDARY', count: 8, claim: nakshatraBoundaryClaim },
  { category: 'VARGA_BOUNDARY', count: 10, claim: vargaBoundaryClaim },
  { category: 'DASHA_BOUNDARY', count: 10, claim: dashaBoundaryClaim },
  { category: 'COMBUSTION_EDGE', count: 12, claim: combustionEdgeClaim },
  { category: 'RETROGRADE_CASE', count: 10, claim: retrogradeClaim },
  { category: 'YOGA_EXAMPLE', count: 8, claim: yogaClaim },
  { category: 'DOSHA_EXAMPLE', count: 8, claim: doshaClaim }
];

const UNUSUAL_LATS = [61.5, 63.8, 65.2, 65.9, -62.3, -64.7, 0.25, 0.6, 66.8, -66.2];
const TZ_CASES: Array<{ tz: number; lng: number; label: string }> = [
  { tz: 5.75, lng: 85.3, label: 'Nepal +05:45' },
  { tz: -9.5, lng: -139.5, label: 'Marquesas -09:30' },
  { tz: 13.0, lng: -172.2, label: 'Samoa +13' },
  { tz: 14.0, lng: -157.4, label: 'Kiritimati +14' },
  { tz: -3.5, lng: -60.0, label: 'AMT -03:30' },
  { tz: 4.5, lng: 12.5, label: '+04:30' },
  { tz: 8.75, lng: 115.0, label: 'AWST historical +08:45' },
  { tz: 12.0, lng: 166.5, label: '+12 antimeridian-west' },
  { tz: 5.5, lng: 75.1, label: 'IST +05:30 half-hour zone' },
  { tz: 0.0, lng: -18.5, label: 'UTC zero offset, far from zone-meridian' }
];

const FOUNDER_INPUT: CorpusChart['input'] = {
  birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna'
};

const CHARTER_CATEGORY_MINIMUMS: Record<string, number> = {
  FOUNDER_REVIEWED: 1,
  ORDINARY: 10,
  SIGN_BOUNDARY: 10,
  NAKSHATRA_BOUNDARY: 8,
  VARGA_BOUNDARY: 10,
  DASHA_BOUNDARY: 10,
  COMBUSTION_EDGE: 12,
  RETROGRADE_CASE: 10,
  UNUSUAL_LATITUDE: 10,
  TIMEZONE_COMPLEXITY: 10,
  YOGA_EXAMPLE: 8,
  DOSHA_EXAMPLE: 8
};

export const GOLDEN_CORPUS_CHARTER_CATEGORY_MINIMUMS = CHARTER_CATEGORY_MINIMUMS;

export function buildCorpus(): CorpusFixture {
  const rnd = mulberry32(0x6c0d);
  const charts: CorpusChart[] = [];
  const seen = new Set<string>();
  let seq = 0;
  const idOf = (category: string): string => `GCC-${String(++seq).padStart(3, '0')}-${category}`;

  const push = (category: string, input: CorpusChart['input'], snap: CanonicalJyotishSnapshot, claim: Record<string, unknown> | null): boolean => {
    const key = `${input.birthDate}|${input.birthTime}|${input.latitude}|${input.longitude}|${input.timezone}`;
    if (seen.has(key)) return false;
    seen.add(key);
    charts.push(makeChart(idOf(category), category, input, snap, claim));
    return true;
  };

  const nextInput = (): CorpusChart['input'] => ({
    birthDate: `${1950 + Math.floor(rnd() * 74)}-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`,
    birthTime: `${String(Math.floor(rnd() * 24)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}`,
    latitude: Math.round((6 + rnd() * 34) * 1000) / 1000,
    longitude: Math.round((68 + rnd() * 30) * 1000) / 1000,
    timezone: 5.5,
    locationName: 'Scan'
  });

  // 1. Founder's reviewed chart — exactly ONE regression fixture (charter §20).
  push('FOUNDER_REVIEWED', FOUNDER_INPUT, getCanonicalJyotishSnapshot(FOUNDER_INPUT), {
    type: 'FOUNDER_REVIEWED',
    note: "Charter §20: the founder's already reviewed chart appears here only as ONE regression fixture, never as proof that the engine works generally."
  });

  // 2. Ordinary cases.
  {
    let have = 0;
    let attempts = 0;
    while (have < CATEGORY_SPECS[0].count && attempts++ < 3000) {
      const input = nextInput();
      if (push('ORDINARY', input, getCanonicalJyotishSnapshot(input), null)) have++;
    }
  }

  // 3..10. Scanned categories (boundaries / edges / retrograde / yoga / dosha).
  for (let ci = 1; ci < CATEGORY_SPECS.length; ci++) {
    const spec = CATEGORY_SPECS[ci];
    let have = charts.filter((c) => c.category === spec.category).length;
    let attempts = 0;
    const maxAttempts = 30000;
    while (have < spec.count && attempts++ < maxAttempts) {
      const input = nextInput();
      const snap = getCanonicalJyotishSnapshot(input) as unknown as Record<string, any>;
      const claim = spec.claim!(snap);
      if (claim) {
        if (push(spec.category, input, snap as unknown as CanonicalJyotishSnapshot, claim)) have++;
      }
    }
    if (have < spec.count) {
      throw new Error(`[GOLDEN_CORPUS:SCAN_EXHAUSTED] category ${spec.category} filled ${have}/${spec.count} in ${maxAttempts} attempts`);
    }
  }

  // 11. Unusual latitudes (constructed, deterministic).
  for (let i = 0; i < UNUSUAL_LATS.length; i++) {
    const input: CorpusChart['input'] = {
      birthDate: `${1955 + i * 6}-${String(1 + (i % 9)).padStart(2, '0')}-${String(3 + i * 2).padStart(2, '0')}`,
      birthTime: `${String((i * 5 + 3) % 24).padStart(2, '0')}:${String((i * 17) % 60).padStart(2, '0')}`,
      latitude: UNUSUAL_LATS[i],
      longitude: 78 + i * 3.1,
      timezone: UNUSUAL_LATS[i] < 1 ? 0 : i < 5 ? 5.5 : -3.5,
      locationName: `UnusualLat-${i}`
    };
    push('UNUSUAL_LATITUDE', input, getCanonicalJyotishSnapshot(input), {
      type: 'UNUSUAL_LATITUDE',
      latitude: input.latitude,
      note: input.latitude > 66 || input.latitude < -66 ? 'beyond the classic polar ascendant branch — Sprint C rising-branch guarantee applies' : 'high-latitude / near-equatorial'
    });
  }

  // 12. Timezone complexity (constructed, deterministic odd zones).
  for (let i = 0; i < TZ_CASES.length; i++) {
    const t = TZ_CASES[i];
    const input: CorpusChart['input'] = {
      birthDate: i === 0 ? '2000-02-29' : `${1948 + i * 7}-${String(1 + (i % 12)).padStart(2, '0')}-${String(2 + (i % 26)).padStart(2, '0')}`,
      birthTime: i % 3 === 0 ? '00:15' : i % 3 === 1 ? '23:40' : '12:05',
      latitude: Math.round((8 + i * 4.3) * 1000) / 1000,
      longitude: t.lng,
      timezone: t.tz,
      locationName: t.label
    };
    push('TIMEZONE_COMPLEXITY', input, getCanonicalJyotishSnapshot(input), {
      type: 'TIMEZONE_COMPLEXITY', zoneLabel: t.label, timezone: t.tz, note: i === 0 ? 'leap-day birth, midnight-adjacent' : 'non-quarter-hour or antimeridian-adjacent zone'
    });
  }

  const coverage: Record<string, number> = {};
  for (const c of charts) coverage[c.category] = (coverage[c.category] ?? 0) + 1;

  const core = {
    charterCategoryCount: Object.keys(CHARTER_CATEGORY_MINIMUMS).length,
    founderCount: charts.filter((c) => c.category === 'FOUNDER_REVIEWED').length,
    chartCount: charts.length,
    coverage,
    charts
  };
  const setSha256 = crypto.createHash('sha256').update(stableStringify(core)).digest('hex');
  return {
    fixtureSetId: 'GOLDEN_CHART_CORPUS_001',
    builder: GOLDEN_CORPUS_BUILDER_VERSION,
    engineNote: 'expectations are ENGINE_DERIVED regression pins; the astronomy kernel is separately certified vs JPL DE441 (Sprint C)',
    charterNote: 'Mission §20: each chart stores input, normalized input, expected astronomical + derived facts, tolerance, source and validation state; the founder chart is ONE fixture among many.',
    ...core,
    setSha256
  };
}

const isMain = process.argv[1] && process.argv[1].endsWith('build-golden-corpus.ts');
if (isMain) {
  const corpus = buildCorpus();
  const out = path.join(__dirname, '..', 'qualification', 'fixtures', 'golden-chart-corpus.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(corpus, null, 2) + '\n');
  console.log(`wrote ${out}`);
  console.log(`charts=${corpus.chartCount} founder=${corpus.founderCount} sha256=${corpus.setSha256}`);
  for (const [k, v] of Object.entries(corpus.coverage)) console.log(`  ${k}: ${v}`);
}
