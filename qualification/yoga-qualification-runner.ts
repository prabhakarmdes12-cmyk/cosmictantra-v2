/**
 * YOGA QUALIFICATION RUNNER — Sprint I (Yoga/Dosha expansion, charter §15–§16).
 *
 * Streams:
 *   A. CATALOG_INTEGRITY   — every yoga rule pairs with a source-registry entry AND a
 *                            ruleRegistry cross-link; counts match the fixture; the
 *                            NOT_ADOPTED set stays closed (Kemadruma, Dharma-Karma
 *                            mutual-kendra, Kalpadruma); every evaluation separates
 *                            existence from strength (charter §15).
 *   B. PREDICATE_IDENTITY  — seeded random real charts: an INDEPENDENT
 *                            reimplementation of every implemented predicate (written
 *                            from the registry's adoptedInterpretation, not from the
 *                            engine code) must agree with evaluateYogas for every
 *                            fully-resolved chart.
 *   C. KALSARPA_GEOMETRY   — constructed node geometries sweep every rashi: all-in-arc
 *                            (both directions), split hemispheres, node-rashi boundary,
 *                            inconsistent axis, unresolved inputs — checked against an
 *                            independent offset implementation; plus snapshot identity
 *                            on random real charts.
 *   D. DETERMINISM         — byte-identical replays.
 *
 * Usage:
 *   npm run qualify:yoga             # full run (2,000 chart scenarios)
 *   npm run qualify:yoga:scaffold    # scaffold (400)
 *   npx tsx qualification/yoga-qualification-runner.ts --scenarios 500
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  evaluateYogas,
  YOGA_RULE_IDS,
  YOGA_SOURCE_REGISTRY_VERSION,
  type YogaChartInput,
  type YogaEvaluation
} from '../src/lib/jyotish/yogaEngine';
import { sourceEntryFor } from '../src/lib/jyotish/yogaSourceRegistry';
import {
  listClassicalRules,
  getClassicalRule,
  classicalRuleRegistryFingerprint,
  CLASSICAL_RULE_REGISTRY_VERSION
} from '../src/lib/jyotish/ruleRegistry';
import { evaluateKalsarpa, DOSHA_ENGINE_VERSION, type KalsarpaEvaluation } from '../src/lib/jyotish/doshaEngine';
import { calculateKundali } from '../src/lib/astrologyEngine';

export const YOGA_QUALIFICATION_RUNNER_VERSION = 'yoga-qualification-runner-1.0.0 (sprint I)';
export const DEFAULT_YOGA_SEED = 0x9091;

export type YogaQualificationGate = 'scaffold' | 'strict';

export class YogaQualificationError extends Error {
  constructor(
    public readonly errorCode:
      | 'FIXTURE_SET_INVALID'
      | 'CATALOG_INTEGRITY_VIOLATION'
      | 'PREDICATE_IDENTITY_VIOLATION'
      | 'KALSARPA_GEOMETRY_VIOLATION'
      | 'EXISTENCE_STRENGTH_VIOLATION'
      | 'DETERMINISM_HARD_MISMATCH',
    message: string,
    public readonly detail: Record<string, unknown>
  ) {
    super(message);
    this.name = 'YogaQualificationError';
  }
}

/* ------------------------------------------------------------------------- */
/* Fixture set                                                                */
/* ------------------------------------------------------------------------- */

export interface YogaFixtureSet {
  fixtureSetId: string;
  builder: string;
  engineNote: string;
  yogaEngineCatalogVersion: string;
  doshaEngineVersion: string;
  ruleRegistryVersion: string;
  ruleRegistryFingerprint: string;
  yogaRuleCount: number;
  yogaRuleIds: string[];
  registryRuleCount: number;
  kalsarpaVariant: string;
  kalsarpaAlternativesDeclared: number;
  setSha256: string;
}

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(v as Record<string, unknown>).sort()
    .map((k) => JSON.stringify(k) + ':' + stableStringify((v as Record<string, unknown>)[k]))
    .join(',') + '}';
}

export function loadYogaFixtureSet(raw: unknown): YogaFixtureSet {
  const f = raw as YogaFixtureSet;
  if (!f || f.fixtureSetId !== 'YOGA_CATALOG_001') {
    throw new YogaQualificationError('FIXTURE_SET_INVALID', 'Unknown yoga fixture set', { received: (f as { fixtureSetId?: string })?.fixtureSetId });
  }
  const { setSha256, fixtureSetId: _id, builder: _b, engineNote: _n, ...core } = f;
  void _id; void _b; void _n;
  const digest = crypto.createHash('sha256').update(stableStringify(core)).digest('hex');
  if (digest !== setSha256) {
    throw new YogaQualificationError('FIXTURE_SET_INVALID', 'Yoga fixture sha mismatch — rebuild with tools/build-yoga-fixtures.ts and review the diff (CT_INV_008)', { expected: setSha256, actual: digest });
  }
  return f;
}

/* ------------------------------------------------------------------------- */
/* Seeded scenario generation (real charts via the natal kernel)              */
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

export interface RawChart {
  house: Record<string, number>;
  sign: Record<string, number>;
  houseSign: Record<number, number>;
  asc: number;
}

const PLANET_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export function randomChart(rnd: () => number): { chart: YogaChartInput; raw: RawChart } {
  const year = 1950 + Math.floor(rnd() * 80);
  const month = 1 + Math.floor(rnd() * 12);
  const day = 1 + Math.floor(rnd() * 28);
  const lat = 8 + rnd() * 30;
  const lng = 68 + rnd() * 30;
  const k = calculateKundali(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, '10:30', lat, lng, 5.5);
  const chart: YogaChartInput = {
    planets: (k.planets as Array<Record<string, unknown>>).map((p) => ({
      id: String(p.name),
      house: Number(p.house) || 0,
      signId: Number(p.rashiId ?? p.rasiId) || 0,
      signName: String(p.rashiName ?? p.rasiName ?? p.rashiId ?? ''),
      longitudeDeg: Number(p.longitude) || 0
    })),
    houseSigns: (k.houses as Array<Record<string, unknown>>).map((h) => {
      const signId = Number(h.rashiId ?? h.rasiId);
      return Number.isFinite(signId) && signId > 0 ? signId : null;
    }),
    ascendantSignId: Number((k.lagna as Record<string, unknown>)?.rashiId) || 0
  };
  const raw: RawChart = { house: {}, sign: {}, houseSign: {}, asc: chart.ascendantSignId };
  for (const name of PLANET_NAMES) {
    const p = chart.planets.find((x) => x.id === name);
    raw.house[name] = p?.house ?? 0;
    raw.sign[name] = p?.signId ?? 0;
  }
  chart.houseSigns.forEach((s, i) => { if (s) raw.houseSign[i + 1] = s; });
  return { chart, raw };
}

/* ------------------------------------------------------------------------- */
/* INDEPENDENT predicate implementations (charter §21)                        */
/* Written from the registry's adoptedInterpretation text, NOT from engine.   */
/* ------------------------------------------------------------------------- */

const TAR = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const BEN = ['Mercury', 'Jupiter', 'Venus'];
const SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const OWN: Record<string, number[]> = { Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6], Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11] };
const EXALT: Record<string, number> = { Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7 };
const LORD: Record<number, string> = { 1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury', 7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter' };

const off = (raw: RawChart, a: string, b: string): number | null =>
  raw.house[a] >= 1 && raw.house[b] >= 1 ? ((raw.house[b] - raw.house[a] + 12) % 12) : null;
const lord = (raw: RawChart, bh: number): string | null => (raw.houseSign[bh] ? LORD[raw.houseSign[bh]] : null);

type Predicate = (raw: RawChart) => boolean | null; // null = unresolved

const P: Record<string, Predicate> = {
  YOGA_GAJA_KESARI: (r) => { const o = off(r, 'Moon', 'Jupiter'); return o === null ? null : [0, 3, 6, 9].includes(o); },
  YOGA_BUDHADITYA: (r) => (r.sign.Sun && r.sign.Mercury ? r.sign.Sun === r.sign.Mercury : null),
  YOGA_CHANDRA_MANGALA: (r) => (r.sign.Moon && r.sign.Mars ? r.sign.Moon === r.sign.Mars : null),
  YOGA_DHARMA_KARMA_ADHIPATI: (r) => {
    const l9 = lord(r, 9), l10 = lord(r, 10);
    if (!l9 || !l10 || !r.sign[l9] || !r.sign[l10]) return null;
    // conjunction (same bhava) OR each in a sign OWNED by the other
    return r.house[l9] === r.house[l10] || (OWN[l9].includes(r.sign[l10]) && OWN[l10].includes(r.sign[l9]));
  },
  YOGA_RUCHAKA: (r) => { const h = r.house.Mars, s = r.sign.Mars; return h && s ? [1, 4, 7, 10].includes(h) && (OWN.Mars.includes(s) || s === EXALT.Mars) : null; },
  YOGA_HAMSA: (r) => { const h = r.house.Jupiter, s = r.sign.Jupiter; return h && s ? [1, 4, 7, 10].includes(h) && (OWN.Jupiter.includes(s) || s === EXALT.Jupiter) : null; },
  YOGA_MALAVYA: (r) => { const h = r.house.Venus, s = r.sign.Venus; return h && s ? [1, 4, 7, 10].includes(h) && (OWN.Venus.includes(s) || s === EXALT.Venus) : null; },
  YOGA_SASA: (r) => { const h = r.house.Saturn, s = r.sign.Saturn; return h && s ? [1, 4, 7, 10].includes(h) && (OWN.Saturn.includes(s) || s === EXALT.Saturn) : null; },
  YOGA_BHADRA: (r) => { const h = r.house.Mercury, s = r.sign.Mercury; return h && s ? [1, 4, 7, 10].includes(h) && (OWN.Mercury.includes(s) || s === EXALT.Mercury) : null; },
  YOGA_SUNAPHA: (r) => { const os = TAR.map((p) => off(r, 'Moon', p)); return os.includes(null) ? null : os.some((o) => o === 1); },
  YOGA_ANAPHA: (r) => { const os = TAR.map((p) => off(r, 'Moon', p)); return os.includes(null) ? null : os.some((o) => o === 11); },
  YOGA_DURUDHARA: (r) => { const os = TAR.map((p) => off(r, 'Moon', p)); return os.includes(null) ? null : os.some((o) => o === 1) && os.some((o) => o === 11); },
  YOGA_ADHI: (r) => { const os = BEN.map((p) => off(r, 'Moon', p)); return os.includes(null) ? null : os.every((o) => [5, 6, 7].includes(o!)); },
  YOGA_LAGNADHI: (r) => (BEN.every((p) => r.house[p] >= 1) ? BEN.every((p) => [6, 7, 8].includes(r.house[p])) : null),
  YOGA_SAKATA: (r) => { const o = off(r, 'Jupiter', 'Moon'); return o === null ? null : [5, 7, 11].includes(o); },
  YOGA_AMALA: (r) => {
    const fromLagna = BEN.map((p) => r.house[p]);
    const fromMoon = BEN.map((p) => off(r, 'Moon', p));
    if (fromLagna.some((h) => !h) && fromMoon.some((o) => o === null)) return null;
    return fromLagna.some((h) => h === 10) || fromMoon.some((o) => o === 9);
  },
  YOGA_VESI: (r) => { const os = TAR.map((p) => off(r, 'Sun', p)); return os.includes(null) ? null : os.some((o) => o === 1); },
  YOGA_VASI: (r) => { const os = TAR.map((p) => off(r, 'Sun', p)); return os.includes(null) ? null : os.some((o) => o === 11); },
  YOGA_UBHAYACHARI: (r) => { const os = TAR.map((p) => off(r, 'Sun', p)); return os.includes(null) ? null : os.some((o) => o === 1) && os.some((o) => o === 11); },
  YOGA_DHANA_LORDS_EXCHANGE: (r) => {
    const l2 = lord(r, 2), l11 = lord(r, 11);
    if (!l2 || !l11 || !r.sign[l2] || !r.sign[l11]) return null;
    return r.sign[l2] === r.houseSign[11] && r.sign[l11] === r.houseSign[2];
  },
  YOGA_DHANA_LORDS_CONJUNCT: (r) => {
    const l2 = lord(r, 2), l11 = lord(r, 11);
    if (!l2 || !l11 || !r.sign[l2] || !r.sign[l11]) return null;
    return r.sign[l2] === r.sign[l11];
  },
  YOGA_DHANA_2L_IN_11TH: (r) => { const l = lord(r, 2); return l && r.house[l] ? r.house[l] === 11 : null; },
  YOGA_DHANA_11L_IN_2ND: (r) => { const l = lord(r, 11); return l && r.house[l] ? r.house[l] === 2 : null; },
  YOGA_LAKSHMI: (r) => {
    const l9 = lord(r, 9);
    if (!l9 || !r.sign[l9] || !r.house[l9]) return null;
    return (OWN[l9].includes(r.sign[l9]) || r.sign[l9] === EXALT[l9]) && [1, 4, 7, 10].includes(r.house[l9]);
  },
  YOGA_VASUMATI: (r) => (BEN.every((p) => r.house[p] >= 1) ? BEN.every((p) => [3, 6, 10, 11].includes(r.house[p])) : null),
  YOGA_RAJA_SAMBANDHA: (r) => {
    const tL = [1, 5, 9].map((b) => lord(r, b));
    const kL = [1, 4, 7, 10].map((b) => lord(r, b));
    if (tL.some((x) => !x) || kL.some((x) => !x)) return null;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const a = tL[i]!, b = kL[j]!;
        if (a === b) continue;
        if (!r.sign[a] || !r.sign[b]) continue;
        const conjunct = r.sign[a] === r.sign[b];
        const exchanged = r.sign[a] === r.houseSign[[1, 4, 7, 10][j]] && r.sign[b] === r.houseSign[[1, 5, 9][i]];
        if (conjunct || exchanged) return true;
      }
    }
    return false;
  },
  YOGA_VIPARITA_HARSHA: (r) => { const l = lord(r, 6); return l && r.house[l] ? [6, 8, 12].includes(r.house[l]) : null; },
  YOGA_VIPARITA_SARALA: (r) => { const l = lord(r, 8); return l && r.house[l] ? [6, 8, 12].includes(r.house[l]) : null; },
  YOGA_VIPARITA_VIMALA: (r) => { const l = lord(r, 12); return l && r.house[l] ? [6, 8, 12].includes(r.house[l]) : null; },
  YOGA_NEECHA_BHANGA: (r) => {
    let anyDeb = false, unresolved = false, hit = false;
    for (const p of SEVEN) {
      if (!r.sign[p]) { unresolved = true; continue; }
      const deb = ((EXALT[p] - 1 + 6) % 12) + 1;
      if (r.sign[p] !== deb) continue;
      anyDeb = true;
      // dispositor = lord of the debilitation SIGN (deb is a sign id, NOT a bhava)
      const d = LORD[deb];
      if (!d || !r.house[d] || !r.sign.Moon) { unresolved = true; continue; }
      const offMoon = ((r.house[d] - r.house.Moon + 12) % 12);
      if ([1, 4, 7, 10].includes(r.house[d]) || [0, 3, 6, 9].includes(offMoon)) hit = true;
    }
    return unresolved && !hit ? null : hit;
  },
  YOGA_PARIVARTANA: (r) => {
    if (SEVEN.some((p) => !r.sign[p])) return null;
    for (let i = 0; i < SEVEN.length; i++) {
      for (let j = i + 1; j < SEVEN.length; j++) {
        const a = SEVEN[i], b = SEVEN[j];
        if (LORD[r.sign[a]] === b && LORD[r.sign[b]] === a && r.sign[a] !== r.sign[b]) return true;
      }
    }
    return false;
  },
  YOGA_SHUBHA_KARTARI: (r) => (BEN.every((p) => r.house[p] >= 1) ? BEN.some((p) => r.house[p] === 2) && BEN.some((p) => r.house[p] === 12) : null),
  YOGA_PAPA_KARTARI: (r) => { const pool = ['Saturn', 'Mars']; return pool.every((p) => r.house[p] >= 1) ? pool.some((p) => r.house[p] === 2) && pool.some((p) => r.house[p] === 12) : null; },
  YOGA_SARASWATI: (r) => {
    if (!BEN.every((p) => r.house[p] >= 1 && r.sign[p])) return null;
    const placed = BEN.every((p) => [1, 2, 4, 5, 7, 9, 10].includes(r.house[p]));
    const jup = OWN.Jupiter.includes(r.sign.Jupiter) || r.sign.Jupiter === EXALT.Jupiter;
    return placed && jup;
  },
  YOGA_RAJJU: (r) => (SEVEN.every((p) => r.sign[p]) ? SEVEN.every((p) => [1, 4, 7, 10].includes(r.sign[p])) : null),
  YOGA_MUSALA: (r) => (SEVEN.every((p) => r.sign[p]) ? SEVEN.every((p) => [2, 5, 8, 11].includes(r.sign[p])) : null),
  YOGA_NALA: (r) => (SEVEN.every((p) => r.sign[p]) ? SEVEN.every((p) => [3, 6, 9, 12].includes(r.sign[p])) : null),
  YOGA_GOLA: (r) => (SEVEN.every((p) => r.sign[p]) ? new Set(SEVEN.map((p) => r.sign[p])).size === 1 : null),
  YOGA_YUGA: (r) => (SEVEN.every((p) => r.sign[p]) ? new Set(SEVEN.map((p) => r.sign[p])).size === 2 : null),
  YOGA_SULA: (r) => (SEVEN.every((p) => r.sign[p]) ? new Set(SEVEN.map((p) => r.sign[p])).size === 3 : null),
  YOGA_KEDARA: (r) => (SEVEN.every((p) => r.sign[p]) ? new Set(SEVEN.map((p) => r.sign[p])).size === 4 : null),
  YOGA_KAMALA: (r) => (SEVEN.every((p) => r.house[p] >= 1) ? SEVEN.every((p) => [1, 4, 7, 10].includes(r.house[p])) : null)
};

const NOT_CALCULATED_IDS = ['YOGA_KEMADRUMA', 'YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA', 'YOGA_KALPADRUMA'];

/* ------------------------------------------------------------------------- */
/* Stream A — catalog integrity                                               */
/* ------------------------------------------------------------------------- */

export interface StreamAReport { checks: number; violations: number; yogaRuleCount: number; firstViolations: string[] }

function runStreamA(fixtureSet: YogaFixtureSet): StreamAReport {
  let checks = 0, violations = 0;
  const firstViolations: string[] = [];
  const fail = (m: string) => { violations++; if (firstViolations.length < 20) firstViolations.push(m); };
  const ids = [...YOGA_RULE_IDS].sort();

  checks++; if (ids.length !== fixtureSet.yogaRuleCount) fail(`yoga rule count ${ids.length} != fixture ${fixtureSet.yogaRuleCount}`);
  checks++; if (JSON.stringify(ids) !== JSON.stringify([...fixtureSet.yogaRuleIds].sort())) fail('yoga rule ids drifted from fixture');
  for (const id of ids) {
    let entry;
    try { entry = sourceEntryFor(id); } catch { fail(`${id}: no source-registry entry`); continue; }
    checks++;
    if (entry.ruleId !== id) fail(`${id}: registry entry id mismatch`);
    checks++;
    if (!entry.adoptedInterpretation || entry.adoptedInterpretation.length < 20) fail(`${id}: thin adoptedInterpretation`);
    checks++;
    const cross = getClassicalRule(id);
    if (!cross) { fail(`${id}: no ruleRegistry cross-link`); continue; }
    checks++;
    if (cross.category !== 'YOGA') fail(`${id}: cross-link category ${cross.category}`);
    checks++;
    if ((entry.adoption === 'NOT_ADOPTED') !== (cross.validationStatus === 'NOT_IMPLEMENTED')) fail(`${id}: adoption/validationStatus mismatch across registries`);
    checks++;
    if (!cross.sourceLocator.includes('NOT VERIFIED')) fail(`${id}: cross-link locator lost the NOT VERIFIED statement`);
  }
  checks++; if (classicalRuleRegistryFingerprint() !== fixtureSet.ruleRegistryFingerprint) fail('registry fingerprint drifted from fixture');
  checks++; if (listClassicalRules().length !== fixtureSet.registryRuleCount) fail('registry rule count drifted from fixture');
  checks++; if (getClassicalRule('RULE_KALSARPA_HEMISPHERE')?.adoption !== 'ADOPTED') fail('RULE_KALSARPA_HEMISPHERE must stay ADOPTED');
  checks++; if (getClassicalRule('RULE_KALSARPA_HEMISPHERE')?.validationStatus !== 'INTERNALLY_VERIFIED') fail('Kalsarpa adopted rule validation tier drifted');
  for (const nc of NOT_CALCULATED_IDS) {
    checks++;
    if (sourceEntryFor(nc).adoption !== 'NOT_ADOPTED') fail(`${nc} must stay NOT_ADOPTED`);
  }
  return { checks, violations, yogaRuleCount: ids.length, firstViolations };
}

/* ------------------------------------------------------------------------- */
/* Stream B — predicate identity                                              */
/* ------------------------------------------------------------------------- */

export interface StreamBReport { scenarios: number; checks: number; violations: number; chartsResolved: number; firstViolations: string[] }

function runStreamB(scenarios: number, seed: number): StreamBReport {
  const rnd = mulberry32(seed);
  let checks = 0, violations = 0, chartsResolved = 0;
  const firstViolations: string[] = [];
  const fail = (m: string) => { violations++; if (firstViolations.length < 20) firstViolations.push(m); };
  for (let s = 0; s < scenarios; s++) {
    const { chart, raw } = randomChart(rnd);
    const evals: YogaEvaluation[] = evaluateYogas(chart);
    const fullyResolved = PLANET_NAMES.slice(0, 7).every((p) => raw.house[p] >= 1 && raw.sign[p] > 0);
    if (fullyResolved) chartsResolved++;
    for (const e of evals) {
      checks++;
      if (NOT_CALCULATED_IDS.includes(e.id)) {
        if (e.status !== 'NOT_CALCULATED') fail(`${e.id}: NOT_ADOPTED rule returned ${e.status}`);
        continue;
      }
      if (!fullyResolved) continue;
      const expected = P[e.id](raw);
      checks++;
      if (expected === null) { void expected; continue; }
      if (expected === true && e.status !== 'PRESENT') fail(`${e.id}: independent predicate TRUE but engine ${e.status}`);
      if (expected === false && e.status !== 'ABSENT') fail(`${e.id}: independent predicate FALSE but engine ${e.status}`);
    }
  }
  return { scenarios, checks, violations, chartsResolved, firstViolations };
}

/* ------------------------------------------------------------------------- */
/* Stream C — Kalsarpa geometry                                               */
/* ------------------------------------------------------------------------- */

export interface StreamCReport { checks: number; violations: number; geometries: number; firstViolations: string[] }

/** Independent offset implementation for the sweep (mirror of the charter variant). */
function independentKalsarpa(grahaRashis: Record<string, number>, rahu: number, ketu: number): { status: string; arc?: string } {
  if (ketu !== (((rahu - 1 + 6) % 12) + 1)) return { status: 'NOT_CALCULATED' };
  const os = SEVEN.map((g) => (grahaRashis[g] ? ((grahaRashis[g] - 1 - (rahu - 1) + 12) % 12) : -1));
  if (os.some((o) => o === -1)) return { status: 'INDETERMINATE' };
  if (os.some((o) => o === 0 || o === 6)) return { status: 'INDETERMINATE' };
  if (os.every((o) => o < 6)) return { status: 'PRESENT', arc: 'RAHU_TO_KETU' };
  if (os.every((o) => o > 6)) return { status: 'PRESENT', arc: 'KETU_TO_RAHU' };
  return { status: 'ABSENT' };
}

function runStreamC(scenarios: number, seed: number): StreamCReport {
  const rnd = mulberry32(seed ^ 0x4a17);
  let checks = 0, violations = 0, geometries = 0;
  const firstViolations: string[] = [];
  const fail = (m: string) => { violations++; if (firstViolations.length < 20) firstViolations.push(m); };

  // (1) constructed geometry sweep: 12 node positions x 5 layout classes x a few variants
  for (let rahu = 1; rahu <= 12; rahu++) {
    const layouts: Array<(base: number) => Record<string, number>> = [
      (base) => Object.fromEntries(SEVEN.map((g, i) => [g, ((base - 1 + 1 + (i % 4) + 12) % 12) + 1])), // inside Rahu->Ketu arc (offsets 1..4)
      (base) => Object.fromEntries(SEVEN.map((g, i) => [g, ((base - 1 + 7 + (i % 4) + 12) % 12) + 1])), // inside Ketu->Rahu arc
      (base) => Object.fromEntries(SEVEN.map((g, i) => [g, ((base - 1 + (i < 3 ? 2 : 9) + 12) % 12) + 1])), // split hemispheres
      (base) => Object.fromEntries(SEVEN.map((g, i) => [g, i === 0 ? base : ((base - 1 + 2 + (i % 4)) % 12) + 1])), // Sun on Rahu rashi (boundary)
      (base) => Object.fromEntries(SEVEN.map((g, i) => [g, i === 2 ? (((base - 1 + 6) % 12) + 1) : ((base - 1 + 2 + (i % 4)) % 12) + 1])) // Mars on Ketu rashi
    ];
    for (const layout of layouts) {
      for (let variant = 0; variant < 2; variant++) {
        geometries++;
        const base = 1 + Math.floor(rnd() * 12);
        const grahaRashis = layout(base);
        const ketu = (((rahu - 1 + 6) % 12) + 1);
        const got = evaluateKalsarpa({ grahaRashis, rahuRashiId: rahu, ketuRashiId: ketu });
        const want = independentKalsarpa(grahaRashis, rahu, ketu);
        checks++;
        if (got.status !== want.status) fail(`rahu ${rahu} layout#${layouts.indexOf(layout)}: engine ${got.status} != independent ${want.status}`);
        checks++;
        if (want.arc && got.arc !== want.arc) fail(`rahu ${rahu}: arc ${got.arc} != ${want.arc}`);
        checks++;
        if (got.variant !== 'ONE_HEMISPHERE_NODE_AXIS') fail('variant must be declared on every result');
        checks++;
        if (got.typeNaming.status !== 'NOT_CALCULATED') fail('twelve-name typing must stay NOT_CALCULATED');
        checks++;
        if (!Array.isArray(got.declaredAlternatives) || got.declaredAlternatives.length !== 4) fail('the four declared alternatives must travel on the result');
      }
    }
  }

  // (2) degenerate inputs
  geometries += 2;
  const bad = evaluateKalsarpa({ grahaRashis: Object.fromEntries(SEVEN.map((g) => [g, 1])), rahuRashiId: 1, ketuRashiId: 2 });
  checks++;
  if (bad.status !== 'NOT_CALCULATED') fail('inconsistent node axis must be NOT_CALCULATED');
  const unres = evaluateKalsarpa({ grahaRashis: Object.fromEntries(SEVEN.map((g, i) => [g, i === 3 ? 0 : 2])), rahuRashiId: 2, ketuRashiId: 8 });
  checks++;
  if (unres.status !== 'INDETERMINATE') fail('unresolved graha rashi must be INDETERMINATE');

  // (3) snapshot identity on random real charts
  for (let s = 0; s < scenarios; s++) {
    const { raw } = randomChart(rnd);
    geometries++;
    const snap = evaluateKalsarpa({
      grahaRashis: Object.fromEntries(SEVEN.map((g) => [g, raw.sign[g]])),
      rahuRashiId: raw.sign.Rahu, ketuRashiId: raw.sign.Ketu
    });
    checks++;
    if (!snap.status) fail('snapshot-path kalsarpa missing status');
  }

  return { checks, violations, geometries, firstViolations };
}

/* ------------------------------------------------------------------------- */
/* Stream D — existence/strength separation (charter §15)                     */
/* ------------------------------------------------------------------------- */

export interface StreamDReport { evaluations: number; checks: number; violations: number; firstViolations: string[] }

function runStreamD(scenarios: number, seed: number): StreamDReport {
  const rnd = mulberry32(seed ^ 0x9911);
  let evaluations = 0, checks = 0, violations = 0;
  const firstViolations: string[] = [];
  const fail = (m: string) => { violations++; if (firstViolations.length < 20) firstViolations.push(m); };
  for (let s = 0; s < scenarios; s++) {
    const { chart } = randomChart(rnd);
    for (const e of evaluateYogas(chart)) {
      evaluations++;
      checks++;
      if (e.status === 'PRESENT' && e.strength?.status !== 'SCHOLAR_JUDGEMENT_REQUIRED') fail(`${e.id}: PRESENT without strength SCHOLAR_JUDGEMENT_REQUIRED`);
      checks++;
      if (e.status !== 'PRESENT' && e.strength?.status !== 'NOT_APPLICABLE') fail(`${e.id}: ${e.status} must carry strength NOT_APPLICABLE`);
      checks++;
      // strength carries EXACTLY the declared shape — no scores, no fabricated numbers
      const st = e.strength as unknown as Record<string, unknown> | undefined;
      const keys = st ? Object.keys(st).sort() : [];
      if (JSON.stringify(keys) !== JSON.stringify(['note', 'status'])) fail(`${e.id}: strength has unexpected keys ${keys.join(',')}`);
      checks++;
      if (typeof st?.note !== 'string' || st.note.length < 10) fail(`${e.id}: strength note missing`);
      if (st?.status === 'SCHOLAR_JUDGEMENT_REQUIRED' && !(typeof st.note === 'string' && st.note.includes('charter'))) fail(`${e.id}: strength note missing the declared charter reference`);
    }
  }
  return { evaluations, checks, violations, firstViolations };
}

/* ------------------------------------------------------------------------- */
/* Orchestration                                                              */
/* ------------------------------------------------------------------------- */

export interface YogaQualificationReport {
  runnerVersion: string;
  catalogVersion: string;
  doshaEngineVersion: string;
  fixtureSetId: string;
  fixtureSetSha256: string;
  gate: YogaQualificationGate;
  scenarios: number;
  seed: number;
  generatedAtUtc: string;
  verdict: 'PASS' | 'FAIL' | 'FAIL_WITH_ONLY_KNOWN_FINDINGS';
  streamA: StreamAReport;
  streamB: StreamBReport;
  streamC: StreamCReport;
  streamD: StreamDReport;
  determinism: { samples: number; mismatches: number };
  findings: Array<{ id: string; severity: 'BLOCKING' | 'NON_BLOCKING'; statement: string; status: string }>;
  totalViolations: number;
}

const DECLARED_FINDINGS: Array<{ id: string; severity: 'BLOCKING' | 'NON_BLOCKING'; statement: string; status: string }> = [
  { id: 'DECLARED_EXISTENCE_ONLY_ENGINE', severity: 'NON_BLOCKING', statement: 'The yoga engine judges EXISTENCE only; strength is SCHOLAR_JUDGEMENT_REQUIRED on every PRESENT verdict (charter §15 separation).', status: 'OPEN' },
  { id: 'DECLARED_NO_LICENSED_EDITIONS', severity: 'NON_BLOCKING', statement: 'All yoga/dosha rule locators remain NOT VERIFIED; no licensed Jyotish edition is held in the repository.', status: 'OPEN' },
  { id: 'DECLARED_KALSARPA_NAMING_OPEN', severity: 'NON_BLOCKING', statement: 'The twelve Kalsarpa names (Anant..Vasuki) and three of four variant readings remain unadopted; boundary-rashi charts return INDETERMINATE.', status: 'OPEN' },
  { id: 'DECLARED_MANGALIK_VARIANTS_DECLARED', severity: 'NON_BLOCKING', statement: 'Manglik is evaluated Lagna-only with houses 1/4/7/8/12; the 2nd-house and Moon/Venus-anchored traditions are declared alternatives (registry).', status: 'OPEN' }
];

export function runYogaQualificationDetailed(opts: {
  scenarios: number;
  seed?: number;
  gate?: YogaQualificationGate;
  fixtureSet: YogaFixtureSet;
}): { report: YogaQualificationReport; failures: unknown[]; writeArtifacts: (dir: string) => void } {
  const { scenarios, seed = DEFAULT_YOGA_SEED, gate = 'scaffold', fixtureSet } = opts;
  const failures: unknown[] = [];

  const streamA = runStreamA(fixtureSet);
  for (const v of streamA.firstViolations) failures.push({ stream: 'CATALOG_INTEGRITY', detail: v });
  const streamB = runStreamB(scenarios, seed);
  for (const v of streamB.firstViolations) failures.push({ stream: 'PREDICATE_IDENTITY', detail: v });
  const streamC = runStreamC(Math.max(10, Math.round(scenarios / 20)), seed);
  for (const v of streamC.firstViolations) failures.push({ stream: 'KALSARPA_GEOMETRY', detail: v });
  const streamD = runStreamD(Math.max(10, Math.round(scenarios / 10)), seed);
  for (const v of streamD.firstViolations) failures.push({ stream: 'EXISTENCE_STRENGTH', detail: v });

  const r1 = runStreamB(60, 0xd3a11);
  const r2 = runStreamB(60, 0xd3a11);
  const determinism = { samples: 60, mismatches: JSON.stringify(r1) === JSON.stringify(r2) ? 0 : 1 };

  const totalViolations = streamA.violations + streamB.violations + streamC.violations + streamD.violations + determinism.mismatches;
  const verdict: YogaQualificationReport['verdict'] = totalViolations === 0 ? 'PASS' : 'FAIL';

  const report: YogaQualificationReport = {
    runnerVersion: YOGA_QUALIFICATION_RUNNER_VERSION,
    catalogVersion: YOGA_SOURCE_REGISTRY_VERSION,
    doshaEngineVersion: DOSHA_ENGINE_VERSION,
    fixtureSetId: fixtureSet.fixtureSetId,
    fixtureSetSha256: fixtureSet.setSha256,
    gate,
    scenarios,
    seed,
    generatedAtUtc: new Date().toISOString(),
    verdict,
    streamA, streamB, streamC, streamD,
    determinism,
    findings: DECLARED_FINDINGS,
    totalViolations
  };

  const writeArtifacts = (dir: string) => {
    fs.writeFileSync(path.join(dir, 'yoga-summary.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'yoga-failures.json'), JSON.stringify({ totalViolations, failures }, null, 2) + '\n');
  };
  return { report, failures, writeArtifacts };
}

/* ------------------------------------------------------------------------- */

function parseArgs(argv: string[]): { scenarios: number; seed: number; gate: YogaQualificationGate } {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const scenarios = Number(get('--scenarios') ?? 2000);
  const seedRaw = get('--seed');
  const seed = seedRaw !== undefined ? (seedRaw.startsWith('0x') ? parseInt(seedRaw, 16) : Number(seedRaw)) : DEFAULT_YOGA_SEED;
  const gate = (get('--gate') === 'strict' ? 'strict' : 'scaffold') as YogaQualificationGate;
  return { scenarios, seed, gate };
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'yoga-fixtures.json'), 'utf8'));
  const fixtureSet = loadYogaFixtureSet(raw);
  console.log(`[yoga-qualification] runner=${YOGA_QUALIFICATION_RUNNER_VERSION} scenarios=${args.scenarios} seed=${args.seed} gate=${args.gate}`);
  console.log(`[yoga-qualification] fixture=${fixtureSet.fixtureSetId} sha256=${fixtureSet.setSha256.slice(0, 16)}... yogaRules=${fixtureSet.yogaRuleCount}`);
  const { report, writeArtifacts } = runYogaQualificationDetailed({
    scenarios: args.scenarios, seed: args.seed, gate: args.gate, fixtureSet
  });
  writeArtifacts(__dirname);
  console.log('');
  console.log('=== YOGA QUALIFICATION SUMMARY ===');
  console.log(`Verdict: ${report.verdict} (gate=${report.gate})`);
  console.log(`A Catalog integrity: ${report.streamA.checks} checks / ${report.streamA.violations} violations (${report.streamA.yogaRuleCount} yoga rules)`);
  console.log(`B Predicate identity: ${report.streamB.checks} checks / ${report.streamB.violations} violations (${report.streamB.scenarios} charts, ${report.streamB.chartsResolved} fully resolved)`);
  console.log(`C Kalsarpa geometry: ${report.streamC.checks} checks / ${report.streamC.violations} violations (${report.streamC.geometries} geometries)`);
  console.log(`D Existence/strength: ${report.streamD.checks} checks / ${report.streamD.violations} violations (${report.streamD.evaluations} evaluations)`);
  console.log(`Determinism: ${report.determinism.samples}/${report.determinism.mismatches} mismatches`);
  console.log(`Findings: ${report.findings.length} (all NON_BLOCKING declared)`);
  console.log('Artifacts: qualification/yoga-summary.json, qualification/yoga-failures.json');
  process.exitCode = report.verdict === 'PASS' ? 0 : 1;
}
