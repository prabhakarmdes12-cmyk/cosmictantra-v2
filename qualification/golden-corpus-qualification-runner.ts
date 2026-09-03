/**
 * REFERENCE-GRADE SPRINT K — GOLDEN CHART CORPUS (§20) + SCHOLAR REVIEW (§19) qualification.
 * Run: npm run qualify:corpus (strict, all charts) / qualify:corpus:scaffold.
 *
 * Streams:
 *   A CORPUS_INTEGRITY      — fixture pin (CT_INV_008), >= 100 charts, founder == 1,
 *                             charter-category coverage minimums, per-chart required
 *                             fields (input / normalizedInput / expected / tolerance /
 *                             source / validationState).
 *   B EXPECTATION_REPLAY    — every chart rebuilt from its INPUT: all expected
 *                             astronomical + derived facts reproduced within the
 *                             stored tolerance; boundaryClaim re-verified on the
 *                             replay; normalizedInput consistent with the input.
 *   C INDEPENDENT_IDENTITY  — from the fixture's stored longitudes ONLY (§21):
 *                             independent rashi / nakshatra / pada / D9 / Vimshottari
 *                             balance / combustion / Kalsarpa reimplementations
 *                             (written from the classical tables and registry text)
 *                             must agree with the engine replay.
 *   D SCHOLAR_REVIEW_LAYER  — §19 invariants: the five verdicts, commentary
 *                             fail-closed, content-addressed ids, hash chain,
 *                             computational truth untouched, VALUE_CHANGED /
 *                             RULE_VERSION_DRIFT freshness, queue derivation.
 *   Determinism             — byte-equal double replay of a fixed chart subset.
 *
 * Fail closed: any violation => verdict FAIL and exit code 1.
 */
import * as fs from 'fs';
import * as path from 'path';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import type { CanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import {
  ScholarReviewStore,
  ScholarReviewError,
  attachReview,
  assessFreshness,
  scholarQueueFor,
  valueDigestOf,
  SCHOLAR_REVIEW_VERSION,
  SCHOLAR_VERDICTS,
  type ScholarVerdict
} from '../src/lib/jyotish/scholarReview';
import { compileEvidence } from '../src/lib/jyotish/evidenceCompiler';
import type { EvidenceNode } from '../src/lib/jyotish/evidenceGraph';
import { getClassicalRule, CLASSICAL_RULE_REGISTRY_VERSION } from '../src/lib/jyotish/ruleRegistry';
import type { CorpusFixture, CorpusChart } from '../tools/build-golden-corpus';

export const GOLDEN_CORPUS_RUNNER_VERSION = 'golden-corpus-runner-1.0.0 (sprint K)';

export const DECLARED_FINDINGS: Array<{ id: string; severity: 'BLOCKING' | 'NON_BLOCKING'; statement: string; status: string }> = [
  {
    id: 'DECLARED_ENGINE_DERIVED_EXPECTATIONS',
    severity: 'NON_BLOCKING',
    statement: 'Corpus expectations are ENGINE_DERIVED regression pins (validationState INTERNALLY_VERIFIED): the astronomy kernel is separately certified vs JPL DE441 (Sprint C); externally-sourced chart corpora (EXTERNALLY_VERIFIED rows) are a later slice.',
    status: 'OPEN'
  },
  {
    id: 'DECLARED_REVIEW_PERSISTENCE_IN_MEMORY',
    severity: 'NON_BLOCKING',
    statement: 'The §19 scholar review store is an in-memory append-only hash chain; persistence with the D-1 consent gate is a later slice.',
    status: 'OPEN'
  },
  {
    id: 'DECLARED_REVIEWER_IDENTITY_UNVERIFIED',
    severity: 'NON_BLOCKING',
    statement: 'Reviewer identity and credentials are RECORDED, never authenticated — a review is provenance of human judgement, not authority; computational truth is never overwritten.',
    status: 'OPEN'
  }
];

/* ------------------------------------------------------------------ */
/* Fixture loading (CT_INV_008: tamper-evident on load)                */
/* ------------------------------------------------------------------ */

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(v as Record<string, unknown>).sort()
    .map((k) => JSON.stringify(k) + ':' + stableStringify((v as Record<string, unknown>)[k]))
    .join(',') + '}';
}

export function loadCorpusFixture(raw: unknown): CorpusFixture {
  const f = raw as CorpusFixture;
  if (!f || f.fixtureSetId !== 'GOLDEN_CHART_CORPUS_001') {
    throw new Error(`[GOLDEN_CORPUS:FIXTURE_SET_INVALID] unknown fixture set ${String((f as { fixtureSetId?: string })?.fixtureSetId)}`);
  }
  const { setSha256, ...rest } = f as unknown as { setSha256: string } & Record<string, unknown>;
  const core: Record<string, unknown> = rest;
  // The builder hashes {charterCategoryCount, founderCount, chartCount, coverage, charts}.
  const hashCore = {
    charterCategoryCount: core.charterCategoryCount,
    founderCount: core.founderCount,
    chartCount: core.chartCount,
    coverage: core.coverage,
    charts: core.charts
  };
  // Re-derive via the same stableStringify the builder used.
  // (import-free local copy: identical canonicalization)
  const crypto = require('crypto') as typeof import('crypto');
  const sha = crypto.createHash('sha256').update(stableStringify(hashCore)).digest('hex');
  if (sha !== setSha256) {
    throw new Error(`[GOLDEN_CORPUS:FIXTURE_TAMPERED] sha mismatch: expected ${setSha256}, computed ${sha}`);
  }
  return f;
}

/* ------------------------------------------------------------------ */
/* §21 independent reimplementations (written from classical tables)   */
/* ------------------------------------------------------------------ */

const NAK_SPAN = 360 / 27;
const D9_SPAN = 30 / 9;

function indepRashiId(lon: number): number {
  return Math.floor((((lon % 360) + 360) % 360) / 30) + 1;
}
function indepDegreeInRasi(lon: number): number {
  return (((lon % 360) + 360) % 360) % 30;
}
function indepNakshatraId(lon: number): number {
  return Math.floor((((lon % 360) + 360) % 360) / NAK_SPAN) + 1;
}
function indepPada(lon: number): number {
  const off = (((lon % 360) + 360) % 360) % NAK_SPAN;
  return Math.floor(off / (NAK_SPAN / 4)) + 1;
}
/** Classical parivritti navamsha: continuous 3°20′ count from Mesha. */
function indepNavamshaSignId(lon: number): number {
  return (Math.floor((((lon % 360) + 360) % 360) / D9_SPAN) % 12) + 1;
}

const VIMSHOTTARI_LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;
const VIMSHOTTARI_YEARS: Record<string, number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };

function indepFirstDasha(lonMoon: number): { lord: string; balanceYears: number } {
  const nakIndex = Math.floor((((lonMoon % 360) + 360) % 360) / NAK_SPAN); // 0-based, Ashwini = 0
  const lord = VIMSHOTTARI_LORDS[nakIndex % 9];
  const elapsed = (((lonMoon % 360) + 360) % 360) % NAK_SPAN;
  const balanceYears = VIMSHOTTARI_YEARS[lord] * (1 - elapsed / NAK_SPAN);
  return { lord, balanceYears };
}

/**
 * Independent adopted-orb table, transcribed from the registry text of
 * RULE_COMBUSTION_ORBS (Sprint H): degrees of separation from the Sun within
 * which a body is combust — direct / retrograde.
 */
const INDEP_COMBUSTION_ORBS: Record<string, { direct: number; retrograde: number }> = {
  Moon: { direct: 12, retrograde: 12 },
  Mars: { direct: 17, retrograde: 17 },
  Mercury: { direct: 14, retrograde: 12 },
  Jupiter: { direct: 11, retrograde: 11 },
  Venus: { direct: 10, retrograde: 8 },
  Saturn: { direct: 15, retrograde: 15 }
};

function indepIsCombust(planet: string, separationDeg: number, isRetrograde: boolean): boolean {
  const orbs = INDEP_COMBUSTION_ORBS[planet];
  if (!orbs) return false;
  const orb = isRetrograde ? orbs.retrograde : orbs.direct;
  return separationDeg <= orb;
}

function indepKalsarpaStatus(planetsLon: Record<string, number>): string {
  const rahu = planetsLon['Rahu'];
  const ketu = planetsLon['Ketu'];
  if (rahu === undefined || ketu === undefined) return 'NOT_CALCULATED';
  const rahuSign = Math.floor((((rahu % 360) + 360) % 360) / 30);
  const ketuSign = Math.floor((((ketu % 360) + 360) % 360) / 30);
  if (ketuSign !== (((rahuSign + 6) % 12))) return 'NOT_CALCULATED'; // inconsistent axis
  const seven = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const offsets: number[] = [];
  for (const g of seven) {
    const lon = planetsLon[g];
    if (lon === undefined) return 'NOT_CALCULATED';
    const s = Math.floor((((lon % 360) + 360) % 360) / 30);
    offsets.push(((s - rahuSign) + 12) % 12);
  }
  if (offsets.some((o) => o === 0 || o === 6)) return 'INDETERMINATE';
  if (offsets.every((o) => o < 6)) return 'PRESENT';
  if (offsets.every((o) => o > 6)) return 'PRESENT';
  return 'ABSENT';
}

/* ------------------------------------------------------------------ */
/* Boundary-claim re-verification on replay                            */
/* ------------------------------------------------------------------ */

function claimHoldsOnReplay(chart: CorpusChart, snap: Record<string, any>): { ok: boolean; detail: string } {
  const claim = chart.boundaryClaim;
  if (!claim) return { ok: true, detail: '' };
  const planets = snap.planetsArray as any[];
  switch (claim.type) {
    case 'FOUNDER_REVIEWED':
      return { ok: true, detail: '' };
    case 'SIGN_BOUNDARY': {
      const p = planets.find((q) => q.name === claim.planet)!;
      const dist = Math.min(p.degreeInRasi, 30 - p.degreeInRasi);
      return { ok: dist <= 0.15, detail: `${claim.planet} edge distance ${dist.toFixed(4)}` };
    }
    case 'NAKSHATRA_BOUNDARY': {
      const moon = planets.find((q) => q.name === 'Moon')!;
      const off = (((moon.longitude % NAK_SPAN) + NAK_SPAN) % NAK_SPAN);
      const dist = Math.min(off, NAK_SPAN - off);
      return { ok: dist <= 0.25, detail: `Moon nak edge distance ${dist.toFixed(4)}` };
    }
    case 'VARGA_BOUNDARY': {
      const p = planets.find((q) => q.name === claim.planet)!;
      const off = (((p.longitude % D9_SPAN) + D9_SPAN) % D9_SPAN);
      const dist = Math.min(off, D9_SPAN - off);
      return { ok: dist <= 0.12, detail: `${claim.planet} D9 edge distance ${dist.toFixed(4)}` };
    }
    case 'DASHA_BOUNDARY':
      return { ok: snap.dasha.mahadashas[0].actualDurationYears <= 1.0, detail: `balance ${snap.dasha.mahadashas[0].actualDurationYears}` };
    case 'COMBUSTION_EDGE': {
      const c = (snap.relationships.combustions as Record<string, any>)[claim.planet as string];
      const d = Math.abs(c.angularDistanceToSun - c.combustionOrb);
      return { ok: d <= 0.3, detail: `${claim.planet} orb distance ${d.toFixed(4)}` };
    }
    case 'RETROGRADE_CASE':
      return { ok: (['Mercury', 'Venus', 'Mars'] as string[]).some((n) => planets.find((q) => q.name === n)?.isRetrograde), detail: '' };
    case 'YOGA_EXAMPLE':
      return { ok: (snap.yogasAndDoshas.yogas as any[]).some((y) => y.status === 'PRESENT'), detail: '' };
    case 'DOSHA_EXAMPLE': {
      const k = snap.yogasAndDoshas.kalsarpa?.status;
      return { ok: k === 'PRESENT' || k === 'INDETERMINATE' || !!snap.yogasAndDoshas.manglik?.isManglik, detail: `kalsarpa ${k}` };
    }
    case 'UNUSUAL_LATITUDE':
      return { ok: Math.abs(chart.input.latitude) >= 60 || Math.abs(chart.input.latitude) <= 1, detail: `lat ${chart.input.latitude}` };
    case 'TIMEZONE_COMPLEXITY': {
      // The charter-meaningful complexity criteria, re-verified: the offset is
      // not a whole hour, or not a half hour (45-min zones), or >= 13h, or the
      // zone deviates from local mean solar time by > 7.5 deg, or it is the
      // leap-day midnight chart.
      const tz = chart.input.timezone;
      const solarSkew = Math.abs(chart.input.longitude - 15 * tz);
      return { ok: !Number.isInteger(tz) || !Number.isInteger(tz * 2) || Math.abs(tz) >= 13 || solarSkew > 7.5 || chart.input.birthDate === '2000-02-29', detail: `tz ${tz} solarSkew ${solarSkew.toFixed(1)}` };
    }
    default:
      return { ok: false, detail: `unknown claim type ${claim.type}` };
  }
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

interface StreamReport { name: string; charts: number; checks: number; violations: number; firstViolations: string[] }

function fail(report: StreamReport, detail: string): void {
  report.checks++;
  report.violations++;
  if (report.firstViolations.length < 25) report.firstViolations.push(detail);
}
function pass(report: StreamReport, n = 1): void {
  report.checks += n;
}

/* ------------------------------------------------------------------ */
/* Stream A — corpus integrity                                         */
/* ------------------------------------------------------------------ */

const CHARTER_MINIMUMS: Record<string, number> = {
  FOUNDER_REVIEWED: 1, ORDINARY: 10, SIGN_BOUNDARY: 10, NAKSHATRA_BOUNDARY: 8, VARGA_BOUNDARY: 10,
  DASHA_BOUNDARY: 10, COMBUSTION_EDGE: 12, RETROGRADE_CASE: 10, UNUSUAL_LATITUDE: 10,
  TIMEZONE_COMPLEXITY: 10, YOGA_EXAMPLE: 8, DOSHA_EXAMPLE: 8
};
const BOUNDARY_CATEGORIES = new Set(['SIGN_BOUNDARY', 'NAKSHATRA_BOUNDARY', 'VARGA_BOUNDARY', 'DASHA_BOUNDARY', 'COMBUSTION_EDGE']);
const TIERS = ['IMPLEMENTED', 'INTERNALLY_VERIFIED', 'EXTERNALLY_VERIFIED', 'SCHOLAR_VERIFIED'];

export function runStreamA(fixture: CorpusFixture, opts: { subset?: boolean } = {}): StreamReport {
  const r: StreamReport = { name: 'A CORPUS_INTEGRITY', charts: fixture.charts.length, checks: 0, violations: 0, firstViolations: [] };
  // Corpus-scale checks (>= 100 charts, per-category minimums) apply to the
  // FULL corpus; a --charts subset run still verifies founder-exactly-1 and
  // every per-chart field requirement.
  if (!opts.subset) {
    if (fixture.chartCount < 100) fail(r, `charter requires >= 100 charts, corpus has ${fixture.chartCount}`);
    else pass(r);
    if (fixture.founderCount !== 1) fail(r, `founder chart count must be exactly 1, got ${fixture.founderCount}`);
    else pass(r);
    for (const [cat, min] of Object.entries(CHARTER_MINIMUMS)) {
      const have = fixture.coverage[cat] ?? 0;
      if (have < min) fail(r, `coverage ${cat}: ${have} < ${min}`);
      else pass(r);
    }
  } else {
    const founders = fixture.charts.filter((c) => c.category === 'FOUNDER_REVIEWED').length;
    if (founders !== 1) fail(r, `founder chart count must be exactly 1, got ${founders}`);
    else pass(r);
  }
  const founderIds = fixture.charts.filter((c) => c.category === 'FOUNDER_REVIEWED').map((c) => c.chartId);
  if (founderIds.length !== 1) fail(r, `founder rows ${founderIds.length} != 1`);
  else pass(r);
  for (const c of fixture.charts) {
    if (!c.input?.birthDate || !c.input?.birthTime || typeof c.input.latitude !== 'number' || typeof c.input.longitude !== 'number' || typeof c.input.timezone !== 'number') {
      fail(r, `${c.chartId}: incomplete input`); continue;
    }
    if (!c.normalizedInput?.utcInstant || typeof c.normalizedInput?.julianDay !== 'number') { fail(r, `${c.chartId}: incomplete normalizedInput`); continue; }
    const planets = c.expected?.astronomical?.planets ?? {};
    if (Object.keys(planets).length !== 9) { fail(r, `${c.chartId}: expected 9 planet facts, got ${Object.keys(planets).length}`); continue; }
    for (const g of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']) {
      const p = planets[g];
      if (!p || typeof p.siderealLongitude !== 'number' || typeof p.rashiId !== 'number' || typeof p.degreeInRasi !== 'number' || typeof p.isRetrograde !== 'boolean') {
        fail(r, `${c.chartId}: incomplete planet fact ${g}`); break;
      }
    }
    const d = c.expected?.derived;
    if (!d || typeof d.moonNakshatraId !== 'number' || typeof d.moonPada !== 'number' || !d.firstDashaLord || typeof d.firstDashaBalanceYears !== 'number' || !Array.isArray(d.combustion) || d.combustion.length !== 9 || typeof d.kalsarpaStatus !== 'string' || typeof d.manglikIsManglik !== 'boolean') {
      fail(r, `${c.chartId}: incomplete derived facts`); continue;
    }
    if (!c.tolerance || typeof c.tolerance.degrees !== 'number' || typeof c.tolerance.years !== 'number') { fail(r, `${c.chartId}: missing tolerance`); continue; }
    if (!c.source?.kind || !c.source?.reference) { fail(r, `${c.chartId}: missing source`); continue; }
    if (!TIERS.includes(c.validationState)) { fail(r, `${c.chartId}: validationState ${c.validationState} not in ${TIERS.join('|')}`); continue; }
    if (BOUNDARY_CATEGORIES.has(c.category) && !c.boundaryClaim) { fail(r, `${c.chartId}: boundary category ${c.category} without boundaryClaim`); continue; }
    pass(r);
  }
  return r;
}

/* ------------------------------------------------------------------ */
/* Stream B — expectation replay                                       */
/* ------------------------------------------------------------------ */

function replaySnapshot(chart: CorpusChart): CanonicalJyotishSnapshot {
  return getCanonicalJyotishSnapshot({
    birthDate: chart.input.birthDate,
    birthTime: chart.input.birthTime,
    latitude: chart.input.latitude,
    longitude: chart.input.longitude,
    timezone: chart.input.timezone,
    locationName: chart.input.locationName
  });
}

function closeTo(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

export function runStreamB(fixture: CorpusFixture): StreamReport {
  const r: StreamReport = { name: 'B EXPECTATION_REPLAY', charts: fixture.charts.length, checks: 0, violations: 0, firstViolations: [] };
  for (const chart of fixture.charts) {
    const snap = replaySnapshot(chart) as unknown as Record<string, any>;
    const exp = chart.expected;

    // Normalized-input consistency, TWO independent relations:
    //   (a) stored utcInstant === the civil input normalized to UTC (exact);
    //   (b) replay julianDay === the pinned julianDay.
    // These are deliberately NOT cross-compared: meta.julianDay is the
    // DYNAMICAL (TT) day and carries Delta-T (~30-70 s) — a fact the corpus
    // pins as-is rather than hiding (CT_INV_007/never hide discrepancies).
    const [y, m, d] = chart.input.birthDate.split('-').map(Number);
    const [hh, mm] = chart.input.birthTime.split(':').map(Number);
    const civilUtcMs = Date.UTC(y, m - 1, d, hh, mm) - chart.input.timezone * 3600000;
    if (new Date(chart.normalizedInput.utcInstant).getTime() !== civilUtcMs) {
      fail(r, `${chart.chartId}: normalizedInput utcInstant != civil input normalized`); continue;
    }
    pass(r);
    if (closeTo(snap.meta.julianDay, chart.normalizedInput.julianDay, 1e-9) === false) {
      fail(r, `${chart.chartId}: replay JD ${snap.meta.julianDay} != pinned ${chart.normalizedInput.julianDay}`);
    } else pass(r);

    // astronomical facts
    if (!closeTo(snap.meta.ayanamshaValue, exp.astronomical.ayanamshaValue, chart.tolerance.degrees)) fail(r, `${chart.chartId}: ayanamsha divergence`);
    else pass(r);
    if (!closeTo(snap.lagna.longitude, exp.astronomical.ascendantSiderealLongitude, chart.tolerance.degrees)) fail(r, `${chart.chartId}: lagna longitude divergence`);
    else pass(r);
    let planetOk = true;
    for (const g of Object.keys(exp.astronomical.planets)) {
      const want = exp.astronomical.planets[g];
      const got = (snap.planetsArray as any[]).find((p) => p.name === g);
      if (!got) { fail(r, `${chart.chartId}: planet ${g} missing on replay`); planetOk = false; continue; }
      if (!closeTo(got.longitude, want.siderealLongitude, chart.tolerance.degrees) ||
        got.rashiId !== want.rashiId ||
        !closeTo(got.degreeInRasi, want.degreeInRasi, chart.tolerance.degrees) ||
        !!got.isRetrograde !== want.isRetrograde) {
        fail(r, `${chart.chartId}: planet ${g} replay divergence`); planetOk = false;
      }
    }
    if (planetOk) pass(r, 9);

    // derived facts
    const dv = exp.derived;
    if (snap.lagna.rashiId !== dv.lagnaRashiId) fail(r, `${chart.chartId}: lagna rashi divergence`);
    else pass(r);
    const moon = (snap.planetsArray as any[]).find((p) => p.name === 'Moon')!;
    if (Math.floor(moon.longitude / NAK_SPAN) + 1 !== dv.moonNakshatraId) fail(r, `${chart.chartId}: moon nakshatra divergence`);
    else pass(r);
    const nakOff = (((moon.longitude % NAK_SPAN) + NAK_SPAN) % NAK_SPAN);
    if (Math.floor(nakOff / (NAK_SPAN / 4)) + 1 !== dv.moonPada) fail(r, `${chart.chartId}: moon pada divergence`);
    else pass(r);
    const d9Row = (snap.vargas.d9Navamsha as any[]).find((v) => v.planet === 'Moon');
    if (!d9Row || d9Row.navamshaRashiId !== dv.navamshaMoonRashiId) fail(r, `${chart.chartId}: D9 moon sign divergence`);
    else pass(r);
    if (snap.dasha.mahadashas[0].lord !== dv.firstDashaLord) fail(r, `${chart.chartId}: first dasha lord divergence`);
    else pass(r);
    if (!closeTo(snap.dasha.mahadashas[0].actualDurationYears, dv.firstDashaBalanceYears, chart.tolerance.years)) fail(r, `${chart.chartId}: dasha balance divergence`);
    else pass(r);
    const rel = snap.relationships.combustions as Record<string, any>;
    let combOk = true;
    for (const row of dv.combustion) {
      const got = rel[row.planet];
      if (!got) { fail(r, `${chart.chartId}: combustion row ${row.planet} missing`); combOk = false; continue; }
      const sepOk = row.applicable ? closeTo(got.angularDistanceToSun, row.separation!, chart.tolerance.degrees) : !got.applicable;
      if (!!got.applicable !== row.applicable || !!got.isCombust !== row.isCombust || !sepOk || (row.applicable && got.combustionOrb !== row.orb) || (row.severity !== null && got.severity !== row.severity)) {
        fail(r, `${chart.chartId}: combustion replay divergence for ${row.planet}`); combOk = false;
      }
    }
    if (combOk) pass(r, 9);
    if ((snap.yogasAndDoshas.kalsarpa?.status ?? 'NOT_CALCULATED') !== dv.kalsarpaStatus) fail(r, `${chart.chartId}: kalsarpa status divergence`);
    else pass(r);
    if (!!snap.yogasAndDoshas.manglik?.isManglik !== dv.manglikIsManglik) fail(r, `${chart.chartId}: manglik divergence`);
    else pass(r);

    // boundary claim still holds on replay
    const claim = claimHoldsOnReplay(chart, snap);
    if (!claim.ok) fail(r, `${chart.chartId}: boundaryClaim no longer holds (${claim.detail})`);
    else pass(r);
  }
  return r;
}

/* ------------------------------------------------------------------ */
/* Stream C — independent identity (§21)                               */
/* ------------------------------------------------------------------ */

export function runStreamC(fixture: CorpusFixture): StreamReport {
  const r: StreamReport = { name: 'C INDEPENDENT_IDENTITY', charts: fixture.charts.length, checks: 0, violations: 0, firstViolations: [] };
  for (const chart of fixture.charts) {
    const lon = chart.expected.astronomical.planets;
    const dv = chart.expected.derived;
    const snap = replaySnapshot(chart) as unknown as Record<string, any>;

    for (const g of Object.keys(lon)) {
      // independent rashi/degree from the PINNED longitude vs the engine replay's own fields.
      // degreeInRasi is a DISPLAY field rounded to 2 dp (never used in computation) —
      // the independent comparison therefore carries a 0.0051 deg rounding allowance
      // and the raw siderealLongitude comparisons stay at the fixture tolerance.
      if (indepRashiId(lon[g].siderealLongitude) !== (snap.planetsArray as any[]).find((p) => p.name === g)!.rashiId) {
        fail(r, `${chart.chartId}: independent rashi mismatch for ${g}`);
      } else pass(r);
      if (!closeTo(indepDegreeInRasi(lon[g].siderealLongitude), (snap.planetsArray as any[]).find((p) => p.name === g)!.degreeInRasi, 0.0051)) {
        fail(r, `${chart.chartId}: independent degree mismatch for ${g}`);
      } else pass(r);
    }

    if (indepNakshatraId(lon['Moon'].siderealLongitude) !== dv.moonNakshatraId) fail(r, `${chart.chartId}: independent nakshatra mismatch`);
    else pass(r);
    if (indepPada(lon['Moon'].siderealLongitude) !== dv.moonPada) fail(r, `${chart.chartId}: independent pada mismatch`);
    else pass(r);
    if (indepNavamshaSignId(lon['Moon'].siderealLongitude) !== dv.navamshaMoonRashiId) fail(r, `${chart.chartId}: independent D9 sign mismatch`);
    else pass(r);

    const dasha = indepFirstDasha(lon['Moon'].siderealLongitude);
    if (dasha.lord !== dv.firstDashaLord) fail(r, `${chart.chartId}: independent dasha lord mismatch`);
    else pass(r);
    if (!closeTo(dasha.balanceYears, dv.firstDashaBalanceYears, chart.tolerance.years)) {
      fail(r, `${chart.chartId}: independent dasha balance ${dasha.balanceYears.toFixed(4)} vs pinned ${dv.firstDashaBalanceYears.toFixed(4)}`);
    } else pass(r);

    let combOk = true;
    for (const row of dv.combustion) {
      if (!row.applicable) continue;
      const retro = lon[row.planet].isRetrograde;
      if (indepIsCombust(row.planet, row.separation!, retro) !== row.isCombust) {
        fail(r, `${chart.chartId}: independent combustion mismatch for ${row.planet} (sep ${row.separation!.toFixed(2)}, retro ${retro})`);
        combOk = false;
      }
    }
    if (combOk) pass(r);

    if (indepKalsarpaStatus(Object.fromEntries(Object.entries(lon).map(([g, p]) => [g, p.siderealLongitude]))) !== dv.kalsarpaStatus) {
      fail(r, `${chart.chartId}: independent kalsarpa status mismatch (${dv.kalsarpaStatus})`);
    } else pass(r);
  }
  return r;
}

/* ------------------------------------------------------------------ */
/* Stream D — scholar review layer (§19)                               */
/* ------------------------------------------------------------------ */

export function runStreamD(fixture: CorpusFixture): StreamReport {
  const r: StreamReport = { name: 'D SCHOLAR_REVIEW_LAYER', charts: 1, checks: 0, violations: 0, firstViolations: [] };
  const founder = fixture.charts.find((c) => c.category === 'FOUNDER_REVIEWED')!;
  const snap = replaySnapshot(founder);
  const ev = compileEvidence(snap);
  const before = ev.store.list().map((n) => JSON.stringify(n)).join('\u0000');

  const store = new ScholarReviewStore({ engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash });

  // 1. computational truth untouched by an attached review
  const target = listConclusionNodesForD(ev)[0];
  if (!target) { fail(r, 'no conclusion node available for review-layer test'); return r; }
  const rec = attachReview(store, target, {
    chartVersion: { engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash },
    reviewerId: 'scholar-A (gate)',
    verdict: 'AGREE',
    commentary: '',
    reviewedAtUtc: '2026-01-01T00:00:00.000Z'
  });
  if (rec.verdict !== 'AGREE' || rec.reviewId.length !== 16 || rec.recordHash.length !== 24) fail(r, 'AGREE record malformed');
  else pass(r);
  const after = ev.store.list().map((n) => JSON.stringify(n)).join('\u0000');
  if (after !== before) fail(r, 'CT_INV_005 VIOLATION: attaching a review mutated the evidence graph');
  else pass(r);

  // 2. fail-closed validation
  const bad = (fn: () => void, code: string): void => {
    try {
      fn();
      fail(r, `expected ${code}, no error thrown`);
    } catch (e) {
      if (e instanceof ScholarReviewError && e.code === code) pass(r);
      else fail(r, `expected ${code}, got ${String(e)}`);
    }
  };
  bad(() => store.add({ ...blankDraft(ev, target), verdict: 'KIND_OF_AGREE' as unknown as ScholarVerdict }), 'INVALID_VERDICT');
  bad(() => store.add({ ...blankDraft(ev, target), reviewerId: '  ' }), 'REVIEWER_REQUIRED');
  bad(() => store.add({ ...blankDraft(ev, target), verdict: 'DISAGREE', commentary: 'short' }), 'COMMENTARY_REQUIRED');
  bad(() => store.add({ ...blankDraft(ev, target), ruleId: 'RULE_DOES_NOT_EXIST' }), 'RULE_UNKNOWN');
  bad(() => store.add({ ...blankDraft(ev, target), ruleId: 'RULE_SADE_SATI_BAND', ruleVersion: '0.0.1-wrong' }), 'RULE_VERSION_MISMATCH');
  bad(() => store.add({ ...blankDraft(ev, target), source: { citation: 'x', status: 'SOURCE_TWITTER' as never } }), 'SOURCE_STATUS_INVALID');

  // 3. chain integrity + tamper evidence
  for (const v of ['PARTIALLY_AGREE', 'ALTERNATIVE_INTERPRETATION', 'INSUFFICIENT_EVIDENCE'] as ScholarVerdict[]) {
    store.add({
      ...blankDraft(ev, target),
      verdict: v,
      commentary: `Gate commentary for ${v}: the recorded reading needs a substantive note.`,
      reviewedAtUtc: '2026-01-02T00:00:00.000Z'
    });
  }
  if (store.size !== 4) fail(r, `store size ${store.size} != 4`);
  else pass(r);
  if (!store.verifyChain().ok) fail(r, 'chain verification failed on an untampered store');
  else pass(r);
  const tampered = store.all().map((x) => ({ ...x }));
  tampered[1].commentary = 'TAMPERED';
  let prev = 'SCHOLAR-GENESIS';
  let tamperFound = false;
  for (let i = 0; i < tampered.length; i++) {
    const hash = require('crypto').createHash('sha256').update(`scholar-review|${prev}|${tampered[i].reviewId}|${tampered[i].targetValueDigest}|${tampered[i].reviewerId}|${tampered[i].verdict}|${tampered[i].commentary}|${tampered[i].reviewedAtUtc}`, 'utf8').digest('hex').slice(0, 24);
    if (tampered[i].prevHash !== prev || tampered[i].recordHash !== hash) { tamperFound = true; break; }
    prev = tampered[i].recordHash;
  }
  if (!tamperFound) fail(r, 'tampered record NOT detected');
  else pass(r);

  // 4. content-addressed ids
  const rec2 = attachReview(store, target, {
    chartVersion: { engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash },
    reviewerId: 'scholar-A (gate)',
    verdict: 'AGREE',
    commentary: '',
    reviewedAtUtc: '2026-01-01T00:00:00.000Z'
  });
  if (rec2.reviewId !== rec.reviewId) fail(r, 'identical review content produced different ids');
  else pass(r);
  if (store.verifyChain().ok === false) fail(r, 'chain broke after idempotent add');
  else pass(r);

  // 5. freshness: VALUE_CHANGED when the node moves
  const fakeNode = { ...target, value: { ...(target.value as object), __mutated: true } } as typeof target;
  if (valueDigestOf(fakeNode) === rec.targetValueDigest) fail(r, 'value digest unchanged after value mutation');
  else pass(r);
  const fresh = assessFreshness(rec, ev.store);
  if (fresh !== 'CURRENT') fail(r, `freshness of untouched node = ${fresh}, expected CURRENT`);
  else pass(r);
  const missing = assessFreshness({ ...rec, targetNodeId: 'ffffffffffffffff' }, ev.store);
  if (missing !== 'NODE_MISSING') fail(r, `freshness of missing node = ${missing}`);
  else pass(r);

  // 6. §19 + §20 linkage: the queue derives from the corpus's YOGA_EXAMPLE charts
  const yogaChart = fixture.charts.find((c) => c.category === 'YOGA_EXAMPLE')!;
  const yogaEv = compileEvidence(replaySnapshot(yogaChart));
  const queue = scholarQueueFor(yogaEv);
  if (!queue.some((q) => q.reason === 'YOGA_STRENGTH_SCHOLAR_JUDGEMENT_REQUIRED')) {
    fail(r, `queue missing YOGA_STRENGTH entries for ${yogaChart.chartId}`);
  } else pass(r);
  for (const q of queue) {
    if (!yogaEv.store.getNode(q.nodeId)) { fail(r, `queue entry ${q.subject} has no node`); break; }
  }
  pass(r);
  const founderQueue = scholarQueueFor(ev, store);
  for (const q of founderQueue) {
    if (store.hasReviewFor(q.nodeId) !== (q.existingReviews > 0)) { fail(r, `queue review-count inconsistency on ${q.subject}`); break; }
  }
  pass(r);
  return r;
}

function blankDraft(ev: { engineVersion: string; snapshotHash: string }, node: { id: string; subject: string; value: unknown }): {
  targetNodeId: string; targetValueDigest: string; targetSubject: string; chartVersion: { engineVersion: string; snapshotHash: string }; reviewerId: string; verdict: ScholarVerdict; commentary: string; reviewedAtUtc: string;
} {
  return {
    targetNodeId: node.id,
    targetValueDigest: valueDigestOf(node as never),
    targetSubject: node.subject,
    chartVersion: { engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash },
    reviewerId: 'scholar-B (gate)',
    verdict: 'INSUFFICIENT_EVIDENCE',
    commentary: 'Gate draft commentary placeholder for fail-closed validation cases.',
    reviewedAtUtc: '2026-01-03T00:00:00.000Z'
  };
}

function listConclusionNodesForD(ev: { store: { list: () => EvidenceNode[] } }): EvidenceNode[] {
  return ev.store.list().filter((n) => n.domain === 'CONVENTION');
}

/* ------------------------------------------------------------------ */
/* Orchestration + CLI                                                 */
/* ------------------------------------------------------------------ */

export interface GoldenCorpusReport {
  runnerVersion: string;
  scholarReviewVersion: string;
  fixtureSetId: string;
  fixtureSetSha256: string;
  ruleRegistryVersion: string;
  gate: 'scaffold' | 'strict';
  charts: number;
  generatedAtUtc: string;
  verdict: 'PASS' | 'FAIL';
  streamA: StreamReport;
  streamB: StreamReport;
  streamC: StreamReport;
  streamD: StreamReport;
  determinism: { samples: number; mismatches: number };
  findings: typeof DECLARED_FINDINGS;
  totalViolations: number;
}

export function runGoldenCorpusQualification(opts: { gate: 'scaffold' | 'strict'; chartsPerCategory?: number }): GoldenCorpusReport {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'golden-chart-corpus.json'), 'utf8'));
  const full = loadCorpusFixture(raw);
  let fixture: CorpusFixture = full;
  if (opts.chartsPerCategory) {
    const counts: Record<string, number> = {};
    const charts = full.charts.filter((c) => {
      counts[c.category] = (counts[c.category] ?? 0) + 1;
      return counts[c.category] <= opts.chartsPerCategory!;
    });
    fixture = { ...full, charts, chartCount: charts.length };
  }

  const a = runStreamA(fixture, { subset: !!opts.chartsPerCategory });
  const b = runStreamB(fixture);
  const c = runStreamC(fixture);
  const d = runStreamD(fixture);

  // determinism: double replay of the founder chart must be byte-identical
  const founder = fixture.charts.find((ch) => ch.category === 'FOUNDER_REVIEWED')!;
  const s1 = replaySnapshot(founder) as unknown as Record<string, any>;
  const s2 = replaySnapshot(founder) as unknown as Record<string, any>;
  const strip = (s: Record<string, any>): string => JSON.stringify({ l: s.lagna.longitude, p: (s.planetsArray as any[]).map((x) => x.longitude), d: s.dasha.mahadashas[0].actualDurationYears });
  const determinism = { samples: 1, mismatches: strip(s1) === strip(s2) ? 0 : 1 };
  if (determinism.mismatches > 0) { b.violations++; b.firstViolations.push('determinism: founder replay not byte-stable'); }

  const totalViolations = a.violations + b.violations + c.violations + d.violations + determinism.mismatches;
  return {
    runnerVersion: GOLDEN_CORPUS_RUNNER_VERSION,
    scholarReviewVersion: SCHOLAR_REVIEW_VERSION,
    fixtureSetId: fixture.fixtureSetId,
    fixtureSetSha256: full.setSha256,
    ruleRegistryVersion: CLASSICAL_RULE_REGISTRY_VERSION,
    gate: opts.gate,
    charts: fixture.charts.length,
    generatedAtUtc: new Date().toISOString(),
    verdict: totalViolations === 0 ? 'PASS' : 'FAIL',
    streamA: a,
    streamB: b,
    streamC: c,
    streamD: d,
    determinism,
    findings: DECLARED_FINDINGS,
    totalViolations
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const gate = (get('--gate') as 'scaffold' | 'strict') ?? 'strict';
  const per = get('--charts');
  const report = runGoldenCorpusQualification({ gate, chartsPerCategory: per ? Number(per) : undefined });
  console.log(`[golden-corpus] fixture=${report.fixtureSetId} sha256=${report.fixtureSetSha256.slice(0, 16)}... charts=${report.charts} gate=${gate}`);
  for (const s of [report.streamA, report.streamB, report.streamC, report.streamD]) {
    console.log(`${s.name}: ${s.checks} checks / ${s.violations} violations (${s.charts} charts)`);
    for (const v of s.firstViolations.slice(0, 8)) console.log(`   ! ${v}`);
  }
  console.log(`Determinism: ${report.determinism.samples}/${report.determinism.mismatches} mismatches`);
  console.log(`Findings: ${report.findings.length} (all NON_BLOCKING declared)`);
  console.log(`=== GOLDEN-CORPUS QUALIFICATION SUMMARY ===`);
  console.log(`Verdict: ${report.verdict} (gate=${report.gate})`);
  const outDir = path.join(__dirname);
  fs.writeFileSync(path.join(outDir, 'golden-corpus-summary.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    path.join(outDir, 'golden-corpus-failures.json'),
    JSON.stringify({
      runnerVersion: report.runnerVersion,
      verdict: report.verdict,
      totalViolations: report.totalViolations,
      failures: [report.streamA, report.streamB, report.streamC, report.streamD].flatMap((s) => s.firstViolations.map((detail) => ({ stream: s.name, detail })))
    }, null, 2) + '\n'
  );
  console.log(`Artifacts: qualification/golden-corpus-summary.json, qualification/golden-corpus-failures.json`);
  process.exitCode = report.verdict === 'PASS' ? 0 : 1;
}

const isMain = process.argv[1] && process.argv[1].endsWith('golden-corpus-qualification-runner.ts');
if (isMain) main();
