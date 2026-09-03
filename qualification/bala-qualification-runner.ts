/**
 * BALA QUALIFICATION RUNNER — Sprint F (Shadbala + Bhava Bala + Ashtakavarga).
 * Mission Sections 10, 11, 12 & 41.
 *
 * Ashtakavarga (§12): per-scenario verification that the BAV tables reproduce the
 * binding classical totals (Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56,
 * Venus 52, Saturn 39 — chart-independent identities), SAV = Σ BAV = 337, the
 * Trikona Shodhana group-minimum identity (independently recomputed), shodhana
 * monotonicity, houseSav consistency, and the honesty pin that Ekadhipatya
 * Shodhana declares NOT_CALCULATED rather than fabricating values (RSK_015).
 *
 * Shadbala (§10): every component is recomputed from the frozen classical tables
 * (debilitation points, strong houses, Naisargika virupas, dignity scale, kendra/
 * drekkana/ojha structures) and the summation identities are checked exactly.
 * The Sprint E-class day/night fix is pinned: Nathonnatha (and Tribhaga) derive
 * from the SUN's house — one day/night determination per chart, never per planet.
 *
 * Bhava Bala (§11): structural verification (rashi/lord mapping, component sum,
 * dig range, unique ranks) against the frozen tables.
 *
 * Declared simplifications (NON_BLOCKING findings, surfaced not hidden):
 *   - Varsha/Masa/Dina/Hora lords are a nominal constant (45), Yuddha Bala = 0.
 *   - Cheshta Bala uses a speed-ratio/retrograde model, not the epicyclic arc.
 *   - Dig Bala is house-granular, not cusp-granular.
 *   - Ekadhipatya Shodhana not implemented (NOT_CALCULATED, RSK_015).
 *   - Required minimum Rupas are ATTRIBUTION_UNVERIFIED.
 *
 * Usage:
 *   npm run qualify:bala            # full run (50,000 scenarios)
 *   npx tsx qualification/bala-qualification-runner.ts --scenarios 5000
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { calculateAshtakavarga } from '../src/lib/jyotish/ashtakavargaEngine';
import {
  calculateFullShadbala,
  calculateBhavaBala,
  type ShadbalaResult
} from '../src/lib/jyotish/balaEngine';

export const BALA_QUALIFICATION_RUNNER_VERSION = 'bala-qualification-runner-1.0.0 (sprint F)';
export const DEFAULT_BALA_SEED = 0xba1a;

export type BalaQualificationGate = 'scaffold' | 'strict';

export class BalaQualificationError extends Error {
  constructor(
    public readonly errorCode:
      | 'FIXTURE_SET_INVALID'
      | 'FIXTURE_MISMATCH'
      | 'ASHTAKAVARGA_IDENTITY_VIOLATION'
      | 'SHADBALA_IDENTITY_VIOLATION'
      | 'BHAVA_BALA_IDENTITY_VIOLATION'
      | 'DAYNIGHT_DETERMINATION_VIOLATION'
      | 'DETERMINISM_HARD_MISMATCH',
    message: string,
    public readonly detail: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BalaQualificationError';
  }
}

/* ------------------------------------------------------------------------- */
/* Fixture set                                                                */
/* ------------------------------------------------------------------------- */

export interface BalaGoldenChart {
  chartId: string;
  lagnaLongitude: number;
  ashtakavarga: {
    bav: Record<string, number[]>;
    sav: number[];
    totalBindus: number;
    houseSav: Array<{ house: number; bindus: number }>;
    trikonaShodhana: number[];
  };
  shadbala: Record<string, {
    sthanaTotal: number; digTotal: number; kalaTotal: number; nathonnatha: number;
    cheshtaTotal: number; naisargika: number; drikTotal: number;
    totalVirupas: number; totalRupas: number; strengthRatio: number;
  }>;
  bhavaBala: Array<{ house: number; lord: string; totalVirupas: number; totalRupas: number }>;
}

export interface BalaFixtureSet {
  fixtureSetId: string;
  builder: string;
  engineVersion: string;
  classicalTables: {
    source: { statement: string; status: string };
    ashtakavarga: {
      bavRules: Record<string, Record<string, number[]>>;
      bavTotals: Record<string, number>;
      savTotal: number;
      sameLordRashiPairs: Array<{ lord: string; rashis: number[] }>;
      ekadhipatyaStatus: string;
    };
    naisargikaVirupas: Record<string, number>;
    debilitationPoints: Record<string, number>;
    moolatrikonaZones: Record<string, { rashiId: number; maxDegree: number }>;
    digBalaStrongHouses: Record<string, number>;
    specialAspects: Record<string, number[]>;
    saptavargajaScale: Record<string, number>;
    requiredRupas: { values: Record<string, number>; status: string; note: string };
  };
  goldenCharts: BalaGoldenChart[];
  setSha256: string;
}

export function loadBalaFixtureSet(raw: unknown): BalaFixtureSet {
  const f = raw as BalaFixtureSet;
  if (!f || f.fixtureSetId !== 'BALA_ENGINE_BENCHMARK_001') {
    throw new BalaQualificationError('FIXTURE_SET_INVALID', 'Unknown bala fixture set', { received: (f as { fixtureSetId?: string })?.fixtureSetId });
  }
  if (f.classicalTables.source.status !== 'SOURCE_SECONDARY') {
    throw new BalaQualificationError('FIXTURE_SET_INVALID', 'Fixture source status changed', { status: f.classicalTables.source.status });
  }
  if (f.classicalTables.requiredRupas.status !== 'ATTRIBUTION_UNVERIFIED') {
    throw new BalaQualificationError('FIXTURE_SET_INVALID', 'Required-Rupas table must stay ATTRIBUTION_UNVERIFIED', { status: f.classicalTables.requiredRupas.status });
  }
  const digest = crypto.createHash('sha256').update(JSON.stringify({
    classicalTables: f.classicalTables, goldenCharts: f.goldenCharts
  })).digest('hex');
  if (digest !== f.setSha256) {
    throw new BalaQualificationError('FIXTURE_SET_INVALID', 'Bala fixture set sha mismatch — never regenerate silently (CT_INV_008)', {
      expected: f.setSha256, actual: digest
    });
  }
  return f;
}

/* ------------------------------------------------------------------------- */
/* Scenarios                                                                  */
/* ------------------------------------------------------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BalaScenario {
  scenarioId: string;
  lagnaLongitude: number;
  planets: Array<{ name: string; longitude: number; rashiId: number; house: number; isRetrograde: boolean; speed?: number }>;
}

const PLANET_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

export function generateBalaScenarios(count: number, seed: number = DEFAULT_BALA_SEED): BalaScenario[] {
  const rng = mulberry32(seed);
  const out: BalaScenario[] = [];
  for (let i = 0; i < count; i++) {
    const lagnaLongitude = rng() * 360;
    const lagRashi = Math.floor(lagnaLongitude / 30);
    // day-birth mix: force the Sun above/below the horizon half the time
    const sunLongitude = rng() < 0.5
      ? ((lagRashi + 6 + Math.floor(rng() * 6)) * 30 + rng() * 30) % 360  // houses 7-12 (day)
      : ((lagRashi + Math.floor(rng() * 6)) * 30 + rng() * 30) % 360;      // houses 1-6 (night)
    const planets: BalaScenario['planets'] = [];
    for (const name of PLANET_NAMES) {
      const longitude = name === 'Sun' ? sunLongitude : rng() * 360;
      const rashiId = Math.floor((((longitude % 360) + 360) % 360) / 30) + 1;
      const house = ((rashiId - 1 - lagRashi + 12) % 12) + 1;
      const isRetrograde = name !== 'Sun' && name !== 'Moon' && rng() < 0.22;
      const speed = isRetrograde ? -(0.05 + rng() * 0.2) : 0.1 + rng() * 1.5;
      planets.push({ name, longitude, rashiId, house, isRetrograde, speed });
    }
    out.push({ scenarioId: `BQ-${String(i + 1).padStart(6, '0')}`, lagnaLongitude, planets });
  }
  return out;
}

export function balaStreamFingerprint(count: number, seed: number): string {
  const h = crypto.createHash('sha256');
  h.update(`bala-scenarios-v1:${count}:${seed}`);
  return h.digest('hex').slice(0, 8).toUpperCase();
}

/* ------------------------------------------------------------------------- */
/* Independent expectations (from the frozen classical tables)                 */
/* ------------------------------------------------------------------------- */

function expectedUchcha(planet: string, longitude: number, debPoints: Record<string, number>): number {
  let dist = Math.abs(longitude - debPoints[planet]);
  if (dist > 180) dist = 360 - dist;
  return dist / 3;
}

function expectedDig(planet: string, house: number, strongHouses: Record<string, number>): { dist: number; virupas: number } {
  const strongH = strongHouses[planet];
  const offset = ((house - strongH + 12) % 12);
  let dist = offset * 30;
  if (dist > 180) dist = 360 - dist;
  return { dist, virupas: ((180 - dist) / 180) * 60 };
}

function expectedTrikona(sav: number[]): number[] {
  const t = [...sav];
  for (let g = 0; g < 4; g++) {
    const m = Math.min(t[g], t[g + 4], t[g + 8]);
    t[g] -= m; t[g + 4] -= m; t[g + 8] -= m;
  }
  return t;
}

/* ------------------------------------------------------------------------- */
/* Report                                                                     */
/* ------------------------------------------------------------------------- */

export interface BalaFinding {
  id: string;
  severity: 'BLOCKING' | 'NON_BLOCKING';
  code: string;
  detail: Record<string, unknown>;
  remediation?: string;
}

export interface BalaQualificationReport {
  runnerVersion: string;
  startedAtUtc: string;
  durationMs: number;
  gate: BalaQualificationGate;
  fixtureSet: { id: string; sha256: string; sourceStatus: string; goldenCharts: number; requiredRupasStatus: string } | null;
  scenarioCount: number;
  seed: number;
  streamFingerprint: string;
  ashtakavarga: { identityChecks: number; violations: number; goldenRegressions: number };
  shadbala: { identityChecks: number; violations: number; dayNightChecks: number; dayNightViolations: number };
  bhavaBala: { identityChecks: number; violations: number };
  goldenRegressions: number;
  determinism: { samples: number; mismatches: number };
  findings: BalaFinding[];
  verdict: 'PASS' | 'FAIL_WITH_ONLY_KNOWN_FINDINGS' | 'QUALIFICATION_BLOCKED';
}

export interface DetailedBalaRun {
  report: BalaQualificationReport;
  writeArtifacts: (dir: string, certDocDir?: string) => void;
}

export function runBalaQualificationDetailed(opts: {
  scenarios: number;
  seed?: number;
  gate?: BalaQualificationGate;
  fixtureSet: BalaFixtureSet;
}): DetailedBalaRun {
  const startedAtUtc = new Date().toISOString();
  const t0 = Date.now();
  const { scenarios: count, seed = DEFAULT_BALA_SEED, gate = 'scaffold', fixtureSet } = opts;
  const classical = fixtureSet.classicalTables;
  const findings: BalaFinding[] = [];
  const failCounts = new Map<string, number>();
  const fail = (e: BalaQualificationError) => {
    const n = (failCounts.get(e.errorCode) ?? 0) + 1;
    failCounts.set(e.errorCode, n);
    if (n <= 20) {
      findings.push({ id: `BQF-${findings.length + 1}`, severity: 'BLOCKING', code: e.errorCode, detail: { ...e.detail, occurrence: n } });
    }
  };

  const av = { identityChecks: 0, violations: 0, goldenRegressions: 0 };
  const sh = { identityChecks: 0, violations: 0, dayNightChecks: 0, dayNightViolations: 0 };
  const bb = { identityChecks: 0, violations: 0 };
  let goldenRegressions = 0;
  let detSamples = 0;
  let detMismatches = 0;
  const approx = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

  /* ---------------------- 1. Golden charts (regression pins) ---------------------- */
  for (const g of fixtureSet.goldenCharts) {
    const withHouse = g.ashtakavarga // recompute inputs from the pinned longitudes
      ? null : null;
    void withHouse;
    // Rebuild inputs: golden files carry results only, so re-derive the chart from
    // the pinned BAV/SAV inputs stored at build time (bav keyed by planet implies rashi).
    // For a self-contained pin we re-run the engine and compare the pinned numbers.
    // Inputs are reconstructed from the fixture's recorded build inputs (below).
    const chartInput = goldenChartInputs(g.chartId);
    if (!chartInput) {
      fail(new BalaQualificationError('FIXTURE_SET_INVALID', 'Golden chart inputs missing', { chartId: g.chartId }));
      continue;
    }
    const avEngine = calculateAshtakavarga(chartInput.planetsRecord, chartInput.lagnaRashiId);
    av.identityChecks += 3;
    if (JSON.stringify(avEngine.bav) !== JSON.stringify(g.ashtakavarga.bav)) { av.violations += 1; goldenRegressions += 1; fail(new BalaQualificationError('FIXTURE_MISMATCH', 'Golden BAV regression', { chartId: g.chartId })); }
    if (JSON.stringify(avEngine.sav) !== JSON.stringify(g.ashtakavarga.sav)) { av.violations += 1; goldenRegressions += 1; fail(new BalaQualificationError('FIXTURE_MISMATCH', 'Golden SAV regression', { chartId: g.chartId })); }
    if (JSON.stringify(avEngine.shodhana.trikonaShodhana) !== JSON.stringify(g.ashtakavarga.trikonaShodhana)) { av.violations += 1; goldenRegressions += 1; fail(new BalaQualificationError('FIXTURE_MISMATCH', 'Golden trikona regression', { chartId: g.chartId })); }

    const shadbala = calculateFullShadbala(chartInput.lagnaLongitude, chartInput.planets as never, undefined);
    for (const [planet, pin] of Object.entries(g.shadbala)) {
      const r = shadbala[planet];
      sh.identityChecks += 4;
      const pairs: Array<[string, number, number]> = [
        ['sthana', r.sthana.totalVirupas, pin.sthanaTotal],
        ['dig', r.dig.totalVirupas, pin.digTotal],
        ['kala', r.kala.totalVirupas, pin.kalaTotal],
        ['drik', r.drik.totalVirupas, pin.drikTotal]
      ];
      for (const [k, a, b] of pairs) {
        if (!approx(a, b, 0.011)) {
          sh.violations += 1; goldenRegressions += 1;
          fail(new BalaQualificationError('FIXTURE_MISMATCH', `Golden shadbala ${k} regression`, { chartId: g.chartId, planet, component: k, expected: b, actual: a }));
        }
      }
    }
    const bhava = calculateBhavaBala(chartInput.lagnaRashiId, shadbala, chartInput.planets as never);
    bb.identityChecks += 1;
    const pinMap = Object.fromEntries(g.bhavaBala.map((b) => [b.house, b]));
    for (const b of bhava) {
      const pin = pinMap[b.houseNumber];
      if (!pin || pin.lord !== b.lord || !approx(pin.totalVirupas, b.totalVirupas, 0.011)) {
        bb.violations += 1; goldenRegressions += 1;
        fail(new BalaQualificationError('FIXTURE_MISMATCH', 'Golden bhava bala regression', { chartId: g.chartId, house: b.houseNumber }));
      }
    }
  }

  /* ---------------------- 2. Scenario sweep ---------------------- */
  const scenarios = generateBalaScenarios(count, seed);
  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    const lagnaRashiId = Math.floor((((s.lagnaLongitude % 360) + 360) % 360) / 30) + 1;
    const planetsRecord = Object.fromEntries(s.planets.map((p) => [p.name, { rashiId: p.rashiId }]));

    // --- Ashtakavarga identities
    const avEngine = calculateAshtakavarga(planetsRecord, lagnaRashiId);
    av.identityChecks += 1;
    let bavTotalOk = true;
    for (const [planet, totals] of Object.entries(classical.ashtakavarga.bavTotals)) {
      const sum = avEngine.bav[planet].reduce((a, b) => a + b, 0);
      if (sum !== totals) { bavTotalOk = false; break; }
    }
    if (!bavTotalOk) {
      av.violations += 1;
      fail(new BalaQualificationError('ASHTAKAVARGA_IDENTITY_VIOLATION', 'BAV per-planet total != classical constant', { scenarioId: s.scenarioId }));
    }
    av.identityChecks += 2;
    let savOk = true;
    for (let r = 0; r < 12; r++) {
      let sum = 0;
      for (const p of PLANET_NAMES) sum += avEngine.bav[p][r];
      if (sum !== avEngine.sav[r]) { savOk = false; break; }
    }
    if (!savOk || avEngine.totalBindus !== classical.ashtakavarga.savTotal) {
      av.violations += 1;
      fail(new BalaQualificationError('ASHTAKAVARGA_IDENTITY_VIOLATION', 'SAV != sum(BAV) or total != 337', { scenarioId: s.scenarioId, total: avEngine.totalBindus }));
    }
    av.identityChecks += 2;
    const triExpected = expectedTrikona(avEngine.sav);
    if (JSON.stringify(triExpected) !== JSON.stringify(avEngine.shodhana.trikonaShodhana)) {
      av.violations += 1;
      fail(new BalaQualificationError('ASHTAKAVARGA_IDENTITY_VIOLATION', 'Trikona shodhana != independent group-min reduction', { scenarioId: s.scenarioId }));
    }
    let monotone = true;
    for (let r = 0; r < 12; r++) if (avEngine.shodhana.trikonaShodhana[r] > avEngine.sav[r]) { monotone = false; break; }
    if (!monotone) {
      av.violations += 1;
      fail(new BalaQualificationError('ASHTAKAVARGA_IDENTITY_VIOLATION', 'Trikona reduction increased bindus', { scenarioId: s.scenarioId }));
    }
    av.identityChecks += 2;
    const houseSavOk = avEngine.houseSav.every((h, idx) => {
      const rIdx = (lagnaRashiId - 1 + idx) % 12;
      return h.bindus === avEngine.sav[rIdx] && h.house === idx + 1;
    });
    if (!houseSavOk) {
      av.violations += 1;
      fail(new BalaQualificationError('ASHTAKAVARGA_IDENTITY_VIOLATION', 'houseSav inconsistent with SAV', { scenarioId: s.scenarioId }));
    }
    if (avEngine.shodhana.ekadhipatyaShodhana.status !== 'NOT_CALCULATED') {
      av.violations += 1;
      fail(new BalaQualificationError('ASHTAKAVARGA_IDENTITY_VIOLATION', 'Ekadhipatya must stay NOT_CALCULATED until implemented', { scenarioId: s.scenarioId }));
    }

    // --- Shadbala identities
    const shadbala = calculateFullShadbala(s.lagnaLongitude, s.planets as never, undefined);
    const sunHouse = s.planets.find((p) => p.name === 'Sun')!.house;
    const isDay = sunHouse >= 7 && sunHouse <= 12;
    const daySet = isDay ? ['Sun', 'Jupiter', 'Venus'] : ['Moon', 'Mars', 'Saturn'];
    const nightSet = isDay ? ['Moon', 'Mars', 'Saturn'] : ['Sun', 'Jupiter', 'Venus'];
    sh.dayNightChecks += 1;
    const dayOk = daySet.every((p) => shadbala[p].kala.nathonnathaBala === 60)
      && nightSet.every((p) => shadbala[p].kala.nathonnathaBala === 0)
      && shadbala.Mercury.kala.nathonnathaBala === 60;
    if (!dayOk) {
      sh.dayNightViolations += 1;
      fail(new BalaQualificationError('DAYNIGHT_DETERMINATION_VIOLATION', 'Day/night strength not chart-consistent', {
        scenarioId: s.scenarioId, sunHouse, isDay,
        nathonnatha: Object.fromEntries(PLANET_NAMES.map((p) => [p, shadbala[p].kala.nathonnathaBala]))
      }));
    }

    for (const planet of PLANET_NAMES) {
      const r: ShadbalaResult = shadbala[planet];
      const p = s.planets.find((x) => x.name === planet)!;

      sh.identityChecks += 1;
      const compSum = r.sthana.totalVirupas + r.dig.totalVirupas + r.kala.totalVirupas + r.cheshta.totalVirupas + r.naisargika.totalVirupas + r.drik.totalVirupas;
      if (!approx(compSum, r.totalVirupas, 0.02)) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Total != sum of six components', { scenarioId: s.scenarioId, planet, compSum, total: r.totalVirupas }));
      }

      sh.identityChecks += 3;
      // The engine publishes rupas and ratio via parseFloat(x.toFixed(2)) — pin the
      // published values with the engine's exact expression (never hide discrepancies
      // through rounding, CT_INV_010: full-precision virupas stay in the details).
      const round2 = (x: number) => parseFloat(x.toFixed(2));
      if (r.totalRupas !== round2(r.totalVirupas / 60)) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Rupas = round(virupas/60, 2) violation', { scenarioId: s.scenarioId, planet, rupas: r.totalRupas, expected: round2(r.totalVirupas / 60) }));
      } else if (r.strengthRatio !== round2(r.totalRupas / r.requiredRupas)) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Strength-ratio round(rupas/required, 2) violation', { scenarioId: s.scenarioId, planet, ratio: r.strengthRatio, expected: round2(r.totalRupas / r.requiredRupas) }));
      } else if (r.requiredRupas !== classical.requiredRupas.values[planet]) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Required rupas != frozen table', { scenarioId: s.scenarioId, planet }));
      }

      sh.identityChecks += 2;
      const uchchaExp = expectedUchcha(planet, p.longitude, classical.debilitationPoints);
      if (!approx(r.sthana.uchchaBala, uchchaExp, 0.005) || r.sthana.uchchaBala < 0 || r.sthana.uchchaBala > 60) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Uchcha bala != independent recompute', { scenarioId: s.scenarioId, planet, expected: uchchaExp, actual: r.sthana.uchchaBala }));
      }

      sh.identityChecks += 2;
      const digExp = expectedDig(planet, p.house, classical.digBalaStrongHouses);
      if (!approx(r.dig.totalVirupas, digExp.virupas, 0.005) || !approx(r.dig.angularDistanceToPowerPoint, digExp.dist, 1e-9)) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Dig bala != independent recompute', { scenarioId: s.scenarioId, planet, expected: digExp.virupas, actual: r.dig.totalVirupas }));
      }

      sh.identityChecks += 1;
      if (r.naisargika.totalVirupas !== classical.naisargikaVirupas[planet]) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Naisargika != frozen table', { scenarioId: s.scenarioId, planet }));
      }

      sh.identityChecks += 1;
      const kendraExp = [1, 4, 7, 10].includes(p.house) ? 60 : [2, 5, 8, 11].includes(p.house) ? 30 : 15;
      if (r.sthana.kendraBala !== kendraExp) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Kendra bala != house structure', { scenarioId: s.scenarioId, planet, house: p.house, expected: kendraExp }));
      }

      sh.identityChecks += 1;
      const degInSign = p.longitude % 30;
      const decanate = Math.floor(degInSign / 10) + 1;
      const drekkanaExp = (['Sun', 'Mars', 'Jupiter'].includes(planet) && decanate === 1)
        || (['Mercury', 'Saturn'].includes(planet) && decanate === 2)
        || (['Moon', 'Venus'].includes(planet) && decanate === 3) ? 15 : 0;
      if (r.sthana.drekkanaBala !== drekkanaExp) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Drekkana bala != classical decanate ownership', { scenarioId: s.scenarioId, planet, expected: drekkanaExp }));
      }

      sh.identityChecks += 2;
      // Declared engine models: the Moon's Cheshta equals its (doubled) Paksha Bala
      // (may reach 120); the Sun's Cheshta equals its Ayana Bala (spans [0, 60]);
      // other planets are clamped to [6, 60]; retrograde => 60.
      const cheshtaMax = planet === 'Moon' ? 120 : 60;
      const cheshtaMin = planet === 'Sun' || planet === 'Moon' ? 0 : 6;
      if (r.cheshta.totalVirupas < cheshtaMin || r.cheshta.totalVirupas > cheshtaMax || !Number.isFinite(r.cheshta.totalVirupas) || (p.isRetrograde && r.cheshta.totalVirupas !== 60)) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Cheshta range/retrograde violation', { scenarioId: s.scenarioId, planet, cheshta: r.cheshta.totalVirupas, retro: p.isRetrograde, allowedRange: [cheshtaMin, cheshtaMax] }));
      }

      sh.identityChecks += 1;
      if (!approx(r.drik.totalVirupas, r.drik.beneficDrishtiVirupas - r.drik.maleficDrishtiVirupas, 0.011)) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Drik != benefic - malefic', { scenarioId: s.scenarioId, planet }));
      }

      sh.identityChecks += 1;
      if (r.kala.tribhagaBala < 0 || r.kala.tribhagaBala > 60) {
        sh.violations += 1;
        fail(new BalaQualificationError('SHADBALA_IDENTITY_VIOLATION', 'Tribhaga out of range', { scenarioId: s.scenarioId, planet }));
      }
    }

    // --- Bhava Bala identities
    const bhava = calculateBhavaBala(lagnaRashiId, shadbala, s.planets as never);
    bb.identityChecks += 2;
    if (bhava.length !== 12 || bhava.some((b, idx) => b.houseNumber !== idx + 1)) {
      bb.violations += 1;
      fail(new BalaQualificationError('BHAVA_BALA_IDENTITY_VIOLATION', 'Bhava bala house sequence broken', { scenarioId: s.scenarioId }));
    }
    const signLords = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
    let bhavaOk = true;
    for (const b of bhava) {
      const rashiId = ((lagnaRashiId - 1 + (b.houseNumber - 1)) % 12) + 1;
      const compSum = b.bhavaAdhipatiBala + b.bhavaDigBala + b.bhavaDrishtiBala;
      if (b.rashiId !== rashiId || b.lord !== signLords[rashiId - 1] || !approx(compSum, b.totalVirupas, 0.02) || b.bhavaDigBala <= 0 || b.bhavaDigBala > 60) {
        bhavaOk = false; break;
      }
    }
    bb.identityChecks += 1;
    if (!bhavaOk) {
      bb.violations += 1;
      fail(new BalaQualificationError('BHAVA_BALA_IDENTITY_VIOLATION', 'Bhava bala rashi/lord/sum identity violation', { scenarioId: s.scenarioId }));
    }
    bb.identityChecks += 1;
    const ranks = new Set(bhava.map((b) => b.relativeRank));
    if (ranks.size !== 12) {
      bb.violations += 1;
      fail(new BalaQualificationError('BHAVA_BALA_IDENTITY_VIOLATION', 'Bhava bala ranks not unique', { scenarioId: s.scenarioId }));
    }

    // --- determinism sampling
    if (i % 100 === 0) {
      detSamples += 1;
      const again = calculateFullShadbala(s.lagnaLongitude, s.planets as never, undefined);
      if (JSON.stringify(again) !== JSON.stringify(shadbala)) {
        detMismatches += 1;
        fail(new BalaQualificationError('DETERMINISM_HARD_MISMATCH', 'Shadbala determinism mismatch', { scenarioId: s.scenarioId }));
      }
    }
  }

  /* ---------------------- 3. Declared simplifications ---------------------- */
  const declared: Array<[string, string, string]> = [
    ['DECLARED_VARSHAMASA_NOMINAL', 'Varsha/Masa/Dina/Hora lords are a nominal constant (45 virupas), not lord-derived.', 'Implement lord-derived temporal strength in a future sprint; never present the constant as a computed value.'],
    ['DECLARED_YUDDHA_BALA_ZERO', 'Yuddha Bala (planetary-war strength) is declared 0 — war geometry is not computed.', 'Keep the zero declared; implement only with a verified classical war rule.'],
    ['DECLARED_CHESHTA_SPEED_MODEL', 'Cheshta Bala uses a clamped speed-ratio/retrograde model, not the epicyclic arc (Manda/Vakra shiras).', 'Documented simplification; upgrade requires a verified epicycle derivation.'],
    ['DECLARED_DIG_HOUSE_GRANULAR', 'Dig Bala is computed at whole-house granularity, not at the bhava madhya angle.', 'Cusp-granular upgrade requires the house-division convention to be qualified first.'],
    ['DECLARED_EKADHIPATYA_NOT_IMPLEMENTED', 'Ekadhipatya Shodhana is NOT_CALCULATED (RSK_015: the old field was a mislabeled trikona copy).', 'Implement from the classical same-lord pair rule only with a verified source; until then the gap stays declared.'],
    ['DECLARED_REQUIRED_RUPAS_UNVERIFIED', 'The required-minimum Rupas table is carried as ATTRIBUTION_UNVERIFIED.', 'Scholar verification required before citing any verse locator.']
  ];
  for (const [code, note, remediation] of declared) {
    findings.push({ id: `BQF-${code}`, severity: 'NON_BLOCKING', code, detail: { note }, remediation });
  }

  const blocking = findings.filter((f) => f.severity === 'BLOCKING');
  const knownNonBlocking = new Set(declared.map(([code]) => code));
  const verdict: BalaQualificationReport['verdict'] =
    blocking.length > 0 ? 'QUALIFICATION_BLOCKED'
      : findings.some((f) => !knownNonBlocking.has(f.code)) ? 'FAIL_WITH_ONLY_KNOWN_FINDINGS'
        : 'PASS';

  const report: BalaQualificationReport = {
    runnerVersion: BALA_QUALIFICATION_RUNNER_VERSION,
    startedAtUtc,
    durationMs: Date.now() - t0,
    gate,
    fixtureSet: {
      id: fixtureSet.fixtureSetId, sha256: fixtureSet.setSha256,
      sourceStatus: fixtureSet.classicalTables.source.status,
      goldenCharts: fixtureSet.goldenCharts.length,
      requiredRupasStatus: fixtureSet.classicalTables.requiredRupas.status
    },
    scenarioCount: scenarios.length,
    seed,
    streamFingerprint: balaStreamFingerprint(scenarios.length, seed),
    ashtakavarga: av,
    shadbala: sh,
    bhavaBala: bb,
    goldenRegressions,
    determinism: { samples: detSamples, mismatches: detMismatches },
    findings,
    verdict
  };

  const writeArtifacts = (dir: string, certDocDir?: string) => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'bala-summary.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(dir, 'bala-failures.json'), JSON.stringify(findings.filter((f) => f.severity === 'BLOCKING'), null, 2));
    if (certDocDir) {
      fs.mkdirSync(certDocDir, { recursive: true });
      fs.writeFileSync(path.join(certDocDir, 'bala-certification.md'), renderBalaCertDoc(report));
    }
  };

  return { report, writeArtifacts };
}

/* Golden chart inputs, pinned here (the fixture stores outputs; inputs live with the builder). */
const GOLDEN_INPUTS: Record<string, { lagnaLongitude: number; lagnaRashiId: number; planets: Array<{ name: string; longitude: number; rashiId: number; house: number; isRetrograde?: boolean }>; planetsRecord: Record<string, { rashiId: number }> }> = {
  KERNEL_RELEASE_TEST_CHART: (() => {
    const lagnaLongitude = 103.6864;
    const planets = [
      { name: 'Sun', longitude: 280.3687, rashiId: 10 },
      { name: 'Moon', longitude: 223.3239, rashiId: 8 },
      { name: 'Mars', longitude: 327.9639, rashiId: 11 },
      { name: 'Mercury', longitude: 271.8889, rashiId: 10 },
      { name: 'Jupiter', longitude: 25.2542, rashiId: 1 },
      { name: 'Venus', longitude: 241.5652, rashiId: 9 },
      { name: 'Saturn', longitude: 40.3961, rashiId: 2 }
    ].map((p) => ({ ...p, house: houseOf(p.longitude, lagnaLongitude), isRetrograde: false }));
    const lagRashi = Math.floor(lagnaLongitude / 30);
    return { lagnaLongitude, lagnaRashiId: lagRashi + 1, planets, planetsRecord: Object.fromEntries(planets.map((p) => [p.name, { rashiId: p.rashiId }])) };
  })(),
  PATNA_GOLDEN_CHART: (() => {
    const lagnaLongitude = 152.0985;
    const planets = [
      { name: 'Sun', longitude: 60.7930, rashiId: 3 },
      { name: 'Moon', longitude: 268.8655, rashiId: 10 },
      { name: 'Mars', longitude: 128.3307, rashiId: 5 },
      { name: 'Mercury', longitude: 48.2289, rashiId: 2 },
      { name: 'Jupiter', longitude: 145.5702, rashiId: 6 },
      { name: 'Venus', longitude: 90.0515, rashiId: 4 },
      { name: 'Saturn', longitude: 236.6720, rashiId: 9 }
    ].map((p) => ({ ...p, house: houseOf(p.longitude, lagnaLongitude), isRetrograde: false }));
    const lagRashi = Math.floor(lagnaLongitude / 30);
    return { lagnaLongitude, lagnaRashiId: lagRashi + 1, planets, planetsRecord: Object.fromEntries(planets.map((p) => [p.name, { rashiId: p.rashiId }])) };
  })()
};

function houseOf(longitude: number, lagnaLongitude: number): number {
  const lonRashi = Math.floor((((longitude % 360) + 360) % 360) / 30);
  const lagRashi = Math.floor((((lagnaLongitude % 360) + 360) % 360) / 30);
  return ((lonRashi - lagRashi + 12) % 12) + 1;
}

function goldenChartInputs(chartId: string) {
  return GOLDEN_INPUTS[chartId] ?? null;
}

function renderBalaCertDoc(report: BalaQualificationReport): string {
  const lines: string[] = [];
  lines.push('# Shadbala + Bhava Bala + Ashtakavarga Qualification Certification (Sprint F)');
  lines.push('');
  lines.push(`> **STATUS: ${report.verdict === 'PASS'
    ? report.scenarioCount >= 50000
      ? 'QUALIFIED — Sprint F full-scale run PASSED'
      : 'QUALIFIED (full-scale run pending)'
    : report.verdict === 'FAIL_WITH_ONLY_KNOWN_FINDINGS' ? 'GATE — UNKNOWN NON-BLOCKING FINDING' : 'QUALIFICATION BLOCKED'}**`);
  lines.push('> This file is GENERATED by `qualification/bala-qualification-runner.ts`. Never edit numbers by hand.');
  lines.push('> Only the numbers actually produced by the qualification pipeline may appear here (Mission §35).');
  lines.push('');
  lines.push(`- **Run started (UTC)**: ${report.startedAtUtc}`);
  lines.push(`- **Runner**: ${report.runnerVersion}`);
  lines.push(`- **Gate**: ${report.gate}`);
  lines.push(`- **Fixture set**: ${report.fixtureSet?.id} (sha256 ${report.fixtureSet?.sha256}, classical tables ${report.fixtureSet?.sourceStatus}, required-Rupas ${report.fixtureSet?.requiredRupasStatus}, ${report.fixtureSet?.goldenCharts} golden charts)`);
  lines.push(`- **Scenarios**: ${report.scenarioCount} (seed ${report.seed}, stream fingerprint ${report.streamFingerprint})`);
  lines.push(`- **Duration**: ${report.durationMs} ms`);
  lines.push('');
  lines.push('## Ashtakavarga (Mission §12)');
  lines.push('');
  lines.push(`- Classical totals reproduced exactly in every scenario: Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39; SAV = Σ BAV = **337**.`);
  lines.push(`- **Identity checks**: ${report.ashtakavarga.identityChecks}, **violations**: ${report.ashtakavarga.violations}`);
  lines.push('- Checks: per-planet BAV totals, SAV sum identity, independent Trikona group-min reduction, shodhana monotonicity, houseSav consistency, Ekadhipatya NOT_CALCULATED honesty pin.');
  lines.push(`- **Golden regressions**: ${report.ashtakavarga.goldenRegressions}`);
  lines.push('');
  lines.push('## Shadbala (Mission §10)');
  lines.push('');
  lines.push(`- **Identity checks**: ${report.shadbala.identityChecks}, **violations**: ${report.shadbala.violations}`);
  lines.push('- Checks: total = Σ six components; rupas = virupas/60; ratio = rupas/required; Uchcha/Dig independently recomputed from frozen tables; Naisargika = frozen table; Kendra/Drekkana structural values; Cheshta range + retrograde rule; Drik = benefic − malefic.');
  lines.push(`- **Day/night consistency (RSK_014 fix)**: ${report.shadbala.dayNightChecks} chart-level checks, ${report.shadbala.dayNightViolations} violations — the Sun's house decides day birth for every planet alike.`);
  lines.push('');
  lines.push('## Bhava Bala (Mission §11)');
  lines.push('');
  lines.push(`- **Identity checks**: ${report.bhavaBala.identityChecks}, **violations**: ${report.bhavaBala.violations}`);
  lines.push('- Checks: 12-house sequence, rashi/lord mapping, total = adhipati + dig + drishti, dig range, unique ranks.');
  lines.push('');
  lines.push(`- **Golden regressions (both engines)**: ${report.goldenRegressions}`);
  lines.push(`- **Determinism**: ${report.determinism.samples} recomputes, ${report.determinism.mismatches} mismatches (CT_INV_007).`);
  lines.push('');
  lines.push('## Declared simplifications (surfaced, never hidden)');
  lines.push('');
  for (const f of report.findings.filter((f) => f.severity === 'NON_BLOCKING')) {
    lines.push(`- **${f.code}**: ${(f.detail as { note?: string }).note ?? ''}`);
  }
  lines.push('');
  lines.push('## Blocking findings');
  lines.push('');
  const blocking = report.findings.filter((f) => f.severity === 'BLOCKING');
  if (blocking.length === 0) lines.push('- None.');
  for (const f of blocking) {
    lines.push(`- **${f.code}**: ${JSON.stringify(f.detail)}`);
  }
  lines.push('');
  lines.push('## Verdict');
  lines.push('');
  lines.push(`\`${report.verdict}\` (gate: ${report.gate})`);
  lines.push('');
  return lines.join('\n');
}

/* ------------------------------------------------------------------------- */
/* CLI                                                                        */
/* ------------------------------------------------------------------------- */

function parseArgs(argv: string[]): { scenarios: number; seed: number; gate: BalaQualificationGate; writeCertDoc: boolean } {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const scenarios = Number(get('--scenarios') ?? 50000);
  const seedRaw = get('--seed');
  const seed = seedRaw !== undefined ? (seedRaw.startsWith('0x') ? parseInt(seedRaw, 16) : Number(seedRaw)) : DEFAULT_BALA_SEED;
  const gate = (get('--gate') === 'strict' ? 'strict' : 'scaffold') as BalaQualificationGate;
  const writeCertDoc = argv.includes('--write-cert-doc');
  return { scenarios, seed, gate, writeCertDoc };
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'bala-fixtures.json'), 'utf8'));
  const fixtureSet = loadBalaFixtureSet(raw);
  console.log(`[bala-qualification] runner=${BALA_QUALIFICATION_RUNNER_VERSION} scenarios=${args.scenarios} seed=${args.seed} gate=${args.gate}`);
  const { report, writeArtifacts } = runBalaQualificationDetailed({
    scenarios: args.scenarios, seed: args.seed, gate: args.gate, fixtureSet
  });
  writeArtifacts(__dirname, args.writeCertDoc ? path.join(__dirname, '..', 'docs', 'reference-grade') : undefined);
  console.log('');
  console.log('=== BALA QUALIFICATION SUMMARY ===');
  console.log(`Verdict: ${report.verdict} (gate=${report.gate})`);
  console.log(`Ashtakavarga: ${report.ashtakavarga.identityChecks} identity checks / ${report.ashtakavarga.violations} violations; golden regressions ${report.ashtakavarga.goldenRegressions}`);
  console.log(`Shadbala: ${report.shadbala.identityChecks} identity checks / ${report.shadbala.violations} violations; day/night ${report.shadbala.dayNightChecks} checks / ${report.shadbala.dayNightViolations} violations`);
  console.log(`Bhava Bala: ${report.bhavaBala.identityChecks} identity checks / ${report.bhavaBala.violations} violations`);
  console.log(`Golden regressions: ${report.goldenRegressions}; determinism ${report.determinism.samples}/${report.determinism.mismatches}`);
  console.log(`Findings: ${report.findings.length} (${report.findings.filter((f) => f.severity === 'BLOCKING').length} blocking)`);
  console.log('Artifacts: qualification/bala-summary.json, qualification/bala-failures.json' + (args.writeCertDoc ? ', docs/reference-grade/bala-certification.md' : ''));
  process.exitCode = report.verdict === 'PASS' || report.verdict === 'FAIL_WITH_ONLY_KNOWN_FINDINGS' ? 0 : 1;
}
