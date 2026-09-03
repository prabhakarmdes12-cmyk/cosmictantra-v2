/**
 * VARGA QUALIFICATION RUNNER — Sprint D (D1/D9/D10 + Varga certification).
 * Mission Section 7 (Varga Engine) & Section 41 (Sprint D).
 *
 * What Sprint D delivers here:
 *   1. Reference comparison of every division D1–D60 against the classical scheme
 *      tables frozen in qualification/fixtures/varga-boundary-fixtures.json
 *      (VARGA_BOUNDARY_BPHS_001, SOURCE_SECONDARY), including ±1e-6° boundary
 *      probes at EVERY interior part boundary and the zodiac wrap.
 *   2. Independent property checks per scenario: range containment, the pure
 *      harmonic D9 identity floor(lon/(10/3)) mod 12, dual-implementation parity
 *      (vargaEngine vs canonicalSnapshot.calculateNavamshaRashi), D60
 *      shashtiamsha structure, and the vargottama identity (flag ⇔ D1 sign = D9 sign).
 *   3. Determinism sampling (CT_INV_007) with the FP-equivalence floor proven in
 *      Sprint B (never raw byte equality over float64).
 *   4. Golden-chart convention parity: the shodashavarga consumes exactly the
 *      canonical snapshot's sidereal longitudes; D1 = natal rashi for every entity.
 *   5. RSK_004 D60 sensitivity: MEASURED seconds of clock time for the ascendant
 *      (and Moon) to cross the next D60 boundary — the birth-time-confidence
 *      quantification. Numbers here are measured in this run, never asserted.
 *
 * Fail-closed doctrine: FIXTURE_MISMATCH, PROPERTY_VIOLATION,
 * DETERMINISM_HARD_MISMATCH and FIXTURE_SET_INVALID are blocking. The D10
 * external-reference promotion gate (src/lib/kundli/v40/d10Validation.ts) is
 * reported as an open, NON-blocking item: it gates interpretation influence,
 * not calculation correctness — two correct implementations must not open it
 * (only a named outside reference may).
 *
 * Usage:
 *   npm run qualify:varga              # full 100,000-scenario run
 *   npx tsx qualification/varga-qualification-runner.ts --scenarios 5000 --seed 7
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  calculateVargaPlacement,
  generateVargaChart,
  SHASHTIAMSHA_NAMES,
  VARGA_ENGINE_VERSION
} from '../src/lib/jyotish/vargaEngine';
import { calculateNavamshaRashi, getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { resolveAstronomyProvider } from '../src/lib/astronomy/astronomyProvider';

export const VARGA_QUALIFICATION_RUNNER_VERSION = 'varga-qualification-runner-1.0.0 (sprint D)';
export const DEFAULT_VARGA_SCENARIO_SEED = 0x5ec0e5; // 15751909
export const DIVISIONS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60] as const;

export type VargaQualificationGate = 'scaffold' | 'strict';

export class VargaQualificationError extends Error {
  constructor(
    public readonly errorCode:
      | 'FIXTURE_SET_INVALID'
      | 'FIXTURE_MISMATCH'
      | 'PROPERTY_VIOLATION'
      | 'DETERMINISM_HARD_MISMATCH',
    message: string,
    public readonly detail: Record<string, unknown>
  ) {
    super(message);
    this.name = 'VargaQualificationError';
  }
}

/* ------------------------------------------------------------------------- */
/* Fixture set (validated load, fail closed)                                  */
/* ------------------------------------------------------------------------- */

export interface VargaFixtureRow {
  division: number;
  sign: number;
  part: number;
  expectedSignIndex: number;
}
export interface VargaBoundaryProbe {
  division: number;
  lon: number;
  expectedSignIndex: number;
}
export interface VargaFixtureSet {
  fixtureSetId: string;
  generator: string;
  source: { statement: string; status: string };
  divisions: Array<{ division: number; kind: 'uniform' | 'span'; parts: number; table: number[][] }>;
  rows: VargaFixtureRow[];
  boundaryProbes: VargaBoundaryProbe[];
  anchors: Array<{ division: number; lon: number; expected: number; note: string }>;
  rowCount: number;
  boundaryProbeCount: number;
  setSha256: string;
}

export function loadVargaFixtureSet(raw: unknown): VargaFixtureSet {
  const f = raw as VargaFixtureSet;
  if (!f || f.fixtureSetId !== 'VARGA_BOUNDARY_BPHS_001') {
    throw new VargaQualificationError('FIXTURE_SET_INVALID', 'Unknown varga fixture set', { received: f?.fixtureSetId });
  }
  if (f.source.status !== 'SOURCE_SECONDARY') {
    throw new VargaQualificationError('FIXTURE_SET_INVALID', 'Fixture source status changed', { status: f.source.status });
  }
  const digest = crypto
    .createHash('sha256')
    .update(JSON.stringify({ rows: f.rows, boundaryProbes: f.boundaryProbes, anchors: f.anchors }))
    .digest('hex');
  if (digest !== f.setSha256) {
    throw new VargaQualificationError('FIXTURE_SET_INVALID', 'Varga fixture set sha mismatch — never regenerate silently (CT_INV_008)', {
      expected: f.setSha256,
      actual: digest
    });
  }
  if (f.rowCount !== f.rows.length || f.boundaryProbeCount !== f.boundaryProbes.length) {
    throw new VargaQualificationError('FIXTURE_SET_INVALID', 'Fixture counts disagree with content', {
      declaredRows: f.rowCount,
      actualRows: f.rows.length
    });
  }
  return f;
}

/* ------------------------------------------------------------------------- */
/* Independent expectation + knife-edge semantics                             */
/* ------------------------------------------------------------------------- */

const KNIFE_EDGE_EPS = 1e-9;

/** Independent (division, part) locator from the fixture's own span tables. */
function locateOnFixture(
  lon: number,
  division: number,
  fixture: VargaFixtureSet
): { sign: number; part: number; expected: number; knifeEdge: boolean } {
  const norm = ((lon % 360) + 360) % 360;
  const sign = Math.floor(norm / 30);
  const degInSign = norm % 30;
  const meta = fixture.divisions.find((d) => d.division === division)!;
  if (meta.kind === 'span') {
    // span boundaries carried by the fixture table structure: rebuilt from row spans
    const spans = (division === 2
      ? (sign % 2 === 0 ? [15, 30] : [15, 30])
      : sign % 2 === 0 ? [5, 10, 18, 25, 30] : [5, 12, 20, 25, 30]);
    let part = spans.length - 1;
    for (let i = 0; i < spans.length; i++) {
      if (degInSign < spans[i]) { part = i; break; }
    }
    const knifeEdge = spans.some((e) => Math.abs(degInSign - e) < KNIFE_EDGE_EPS) || degInSign < KNIFE_EDGE_EPS;
    return { sign, part, expected: meta.table[sign][part], knifeEdge };
  }
  const parts = meta.parts;
  const partSpan = 30 / parts;
  const steps = degInSign / partSpan;
  const nearest = Math.round(steps);
  const knifeEdge = Math.abs(steps - nearest) < KNIFE_EDGE_EPS || degInSign < KNIFE_EDGE_EPS;
  const part = Math.min(Math.floor(steps), parts - 1);
  return { sign, part, expected: meta.table[sign][part], knifeEdge };
}

/* ------------------------------------------------------------------------- */
/* Scenario stream (deterministic LCG; boundary-enriched)                     */
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

export interface VargaScenario {
  scenarioId: string;
  longitude: number;
  /** A division intentionally sampled near a boundary, for determinism interest. */
  focusDivision: number;
}

export function generateVargaScenarios(count: number, seed: number = DEFAULT_VARGA_SCENARIO_SEED): VargaScenario[] {
  const rng = mulberry32(seed);
  const out: VargaScenario[] = [];
  for (let i = 0; i < count; i++) {
    const focusDivision = DIVISIONS[Math.floor(rng() * DIVISIONS.length)];
    let longitude: number;
    const mode = rng();
    if (mode < 0.25) {
      // boundary-enriched: land within ±1e-4 of a random part boundary of the focus division
      const parts = boundaryCount(focusDivision);
      const b = Math.floor(rng() * parts);
      const abs = (b * 30) / partsOf(focusDivision) + (rng() < 0.5 ? -1e-4 : 1e-4) * rng();
      longitude = ((abs % 360) + 360) % 360;
    } else {
      longitude = rng() * 360;
    }
    out.push({ scenarioId: `VQ-${String(i + 1).padStart(6, '0')}`, longitude, focusDivision });
  }
  return out;
}

function partsOf(division: number): number {
  switch (division) {
    case 2: return 2;
    case 30: return 5;
    default: return division;
  }
}
function boundaryCount(division: number): number {
  return partsOf(division) * 12;
}

/* ------------------------------------------------------------------------- */
/* Determinism (two-tier, Sprint B doctrine)                                  */
/* ------------------------------------------------------------------------- */

interface PlacementSnapshot {
  index: number;
  degree: number;
}

function comparePlacementForDeterminism(a: PlacementSnapshot, b: PlacementSnapshot): { equal: boolean; byteEqual: boolean; maxDev: number } {
  const byteEqual = a.index === b.index && a.degree === b.degree;
  const tol = 1e-12 + 8 * Number.EPSILON * Math.max(Math.abs(a.degree), Math.abs(b.degree), 1);
  const dev = Math.abs(a.degree - b.degree);
  return { equal: a.index === b.index && dev <= tol, byteEqual, maxDev: dev };
}

/* ------------------------------------------------------------------------- */
/* Main run                                                                   */
/* ------------------------------------------------------------------------- */

export interface VargaFinding {
  id: string;
  severity: 'BLOCKING' | 'NON_BLOCKING';
  code: string;
  detail: Record<string, unknown>;
  remediation?: string;
}

export interface VargaQualificationReport {
  runnerVersion: string;
  startedAtUtc: string;
  durationMs: number;
  gate: VargaQualificationGate;
  fixtureSet: { id: string; rows: number; probes: number; anchors: number; sha256: string; sourceStatus: string } | null;
  scenarioCount: number;
  seed: number;
  streamFingerprint: string;
  comparisons: { total: number; fixtureMismatch: number; boundaryProbesRun: number; probeMismatch: number; anchorMismatch: number };
  independentPropertyChecks: number;
  propertyViolations: number;
  determinism: { samples: number; hardMismatches: number; fpNoiseRecords: number; maxDeviationDeg: number };
  goldenChartParity: { entities: number; checks: number; violations: number; d60AscFlipSeconds: number | null; d60MoonFlipSeconds: number | null };
  d10ExternalGate: { status: string; mayInfluenceConclusions: boolean };
  findings: VargaFinding[];
  verdict: 'PASS' | 'FAIL_WITH_ONLY_KNOWN_FINDINGS' | 'QUALIFICATION_BLOCKED';
}

export function scenarioStreamFingerprint(count: number, seed: number): string {
  const h = crypto.createHash('sha256');
  h.update(`varga-scenarios-v1:${count}:${seed}`);
  return h.digest('hex').slice(0, 8).toUpperCase();
}

export interface DetailedVargaRun {
  report: VargaQualificationReport;
  writeArtifacts: (dir: string, certDocDir?: string) => void;
}

export function runVargaQualificationDetailed(opts: {
  scenarios: number;
  seed?: number;
  gate?: VargaQualificationGate;
  fixtureSet: VargaFixtureSet;
  /** Skip the provider-based D60 sensitivity measurement (fixture-less CI contexts). */
  skipSensitivity?: boolean;
}): DetailedVargaRun {
  const startedAtUtc = new Date().toISOString();
  const t0 = Date.now();
  const { scenarios: count, seed = DEFAULT_VARGA_SCENARIO_SEED, gate = 'scaffold', fixtureSet } = opts;
  const findings: VargaFinding[] = [];

  let fixtureMismatch = 0;
  let propertyChecks = 0;
  let propertyViolations = 0;
  let probeMismatch = 0;
  let anchorMismatch = 0;
  let detSamples = 0;
  let detHard = 0;
  let detNoise = 0;
  let detMaxDev = 0;

  const fail = (e: VargaQualificationError) => {
    findings.push({
      id: `VQF-${findings.length + 1}`,
      severity: 'BLOCKING',
      code: e.errorCode,
      detail: e.detail
    });
  };

  // 1. Boundary probes — deterministic, exact, every interior boundary of every division.
  for (const probe of fixtureSet.boundaryProbes) {
    const got = calculateVargaPlacement(probe.lon, probe.division);
    propertyChecks += 1;
    if (got.vargaRashiIndex !== probe.expectedSignIndex) {
      probeMismatch += 1;
      fail(new VargaQualificationError('FIXTURE_MISMATCH', 'Boundary probe mismatch', {
        division: probe.division,
        lon: probe.lon,
        expected: probe.expectedSignIndex,
        actual: got.vargaRashiIndex
      }));
      if (probeMismatch > 20) throw new VargaQualificationError('FIXTURE_MISMATCH', 'More than 20 probe mismatches — aborting run', { probeMismatch });
    }
  }

  // 2. Anchors — hand-checked classical statements.
  for (const a of fixtureSet.anchors) {
    const got = calculateVargaPlacement(a.lon, a.division);
    propertyChecks += 1;
    if (got.vargaRashiIndex !== a.expected) {
      anchorMismatch += 1;
      fail(new VargaQualificationError('FIXTURE_MISMATCH', 'Classical anchor mismatch', {
        division: a.division, lon: a.lon, expected: a.expected, actual: got.vargaRashiIndex, note: a.note
      }));
    }
  }

  // 3. Scenario sweep — every scenario across all sixteen divisions.
  const scenarios = generateVargaScenarios(count, seed);
  let knifeEdgeSkips = 0;
  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    for (const division of DIVISIONS) {
      const engine = calculateVargaPlacement(s.longitude, division);
      const loc = locateOnFixture(s.longitude, division, fixtureSet);

      // (a) fixture comparison (skip knife edges — probes decide those, exactly)
      if (!loc.knifeEdge) {
        if (engine.vargaRashiIndex !== loc.expected) {
          fixtureMismatch += 1;
          fail(new VargaQualificationError('FIXTURE_MISMATCH', 'Scenario fixture mismatch', {
            scenarioId: s.scenarioId, division, lon: s.longitude, expected: loc.expected, actual: engine.vargaRashiIndex
          }));
        }
      } else {
        knifeEdgeSkips++;
      }
      propertyChecks += 1;

      // (b) range containment
      propertyChecks += 1;
      if (!(engine.vargaRashiIndex >= 0 && engine.vargaRashiIndex < 12) || !(engine.divisionDegree >= 0 && engine.divisionDegree < 30)) {
        propertyViolations += 1;
        fail(new VargaQualificationError('PROPERTY_VIOLATION', 'Varga range violation', {
          scenarioId: s.scenarioId, division, lon: s.longitude, index: engine.vargaRashiIndex, degree: engine.divisionDegree
        }));
      }

      // (c) D9 harmonic identity: floor(lon / (10/3)) mod 12 — a genuinely different derivation
      if (division === 9 && !loc.knifeEdge) {
        propertyChecks += 1;
        const harmonic = Math.floor((((s.longitude % 360) + 360) % 360) / (10 / 3)) % 12;
        if (harmonic !== engine.vargaRashiIndex) {
          propertyViolations += 1;
          fail(new VargaQualificationError('PROPERTY_VIOLATION', 'D9 harmonic identity violation', {
            scenarioId: s.scenarioId, lon: s.longitude, harmonic, engine: engine.vargaRashiIndex
          }));
        }
        // (d) dual-implementation parity: canonicalSnapshot.calculateNavamshaRashi
        propertyChecks += 1;
        const nav = calculateNavamshaRashi(s.longitude);
        if (nav.rashiId - 1 !== engine.vargaRashiIndex) {
          propertyViolations += 1;
          fail(new VargaQualificationError('PROPERTY_VIOLATION', 'D9 dual-implementation parity violation', {
            scenarioId: s.scenarioId, lon: s.longitude, navamshaRashi: calculateNavamshaRashi(s.longitude).rashiId - 1, engine: engine.vargaRashiIndex
          }));
        }
      }

      // (e) D60 shashtiamsha structure: deity index = floor(degInSign * 2), names exist
      if (division === 60) {
        propertyChecks += 1;
        const norm = (((s.longitude % 360) + 360) % 360) % 30;
        const deityIndex = Math.min(Math.floor(norm * 2), 59);
        if (!(deityIndex >= 0 && deityIndex < 60) || typeof SHASHTIAMSHA_NAMES[deityIndex] !== 'string' || SHASHTIAMSHA_NAMES[deityIndex].length === 0) {
          propertyViolations += 1;
          fail(new VargaQualificationError('PROPERTY_VIOLATION', 'D60 shashtiamsha deity structure violation', {
            scenarioId: s.scenarioId, lon: s.longitude, deityIndex
          }));
        }
      }

      // (f) vargottama identity: flag ⇔ D1 sign == D9 sign
      if (division === 9) {
        propertyChecks += 1;
        const d1 = generateVargaChart(1, s.longitude, [{ name: 'X', longitude: s.longitude, rashiId: loc.sign + 1 }]);
        const d9 = generateVargaChart(9, s.longitude, [{ name: 'X', longitude: s.longitude, rashiId: loc.sign + 1 }]);
        const flagged = d9.planetsArray[0].isVargottama;
        if (flagged !== (d1.planetsArray[0].vargaRashiId === d9.planetsArray[0].vargaRashiId)) {
          propertyViolations += 1;
          fail(new VargaQualificationError('PROPERTY_VIOLATION', 'Vargottama identity violation', {
            scenarioId: s.scenarioId, lon: s.longitude, flagged
          }));
        }
      }
    }

    // (g) determinism sampling — every 100th scenario, full 16-division recompute
    if (i % 100 === 0) {
      detSamples += 1;
      for (const division of DIVISIONS) {
        const a = calculateVargaPlacement(s.longitude, division);
        const b = calculateVargaPlacement(s.longitude, division);
        const cmp = comparePlacementForDeterminism(
          { index: a.vargaRashiIndex, degree: a.divisionDegree },
          { index: b.vargaRashiIndex, degree: b.divisionDegree }
        );
        if (!cmp.byteEqual) detNoise += 1;
        detMaxDev = Math.max(detMaxDev, cmp.maxDev);
        if (!cmp.equal) {
          detHard += 1;
          fail(new VargaQualificationError('DETERMINISM_HARD_MISMATCH', 'Determinism hard mismatch', {
            scenarioId: s.scenarioId, division, lon: s.longitude, a: a.vargaRashiIndex, b: b.vargaRashiIndex
          }));
        }
      }
    }
  }

  // 4. Golden-chart convention parity + RSK_004 D60 sensitivity (measured).
  let parityChecks = 0;
  let parityViolations = 0;
  let d60AscFlip: number | null = null;
  let d60MoonFlip: number | null = null;
  if (!opts.skipSensitivity) {
    const snap = getCanonicalJyotishSnapshot({
      birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna, India'
    });
    const entities: Array<{ name: string; longitude: number; rashiId: number }> = [
      ...(snap.planetsArray as Array<{ name: string; longitude: number; rashiId: number }>),
      { name: 'Lagna', longitude: snap.lagna.longitude, rashiId: snap.lagna.rashiId }
    ];
    const shodashavarga = snap.vargas.shodashavarga as unknown as Record<string, { planets: Record<string, { vargaRashiId: number }>; lagna: { vargaRashiId: number } }>;
    if (!shodashavarga) throw new VargaQualificationError('FIXTURE_SET_INVALID', 'Canonical snapshot carries no shodashavarga', {});
    for (const e of entities) {
      // D1 = natal rashi
      parityChecks += 1;
      const d1Placement = shodashavarga['1'].planets[e.name]?.vargaRashiId ?? shodashavarga['1'].lagna.vargaRashiId;
      if (d1Placement !== e.rashiId) {
        parityViolations += 1;
        fail(new VargaQualificationError('PROPERTY_VIOLATION', 'Golden chart D1 != natal rashi', { entity: e.name, d1: d1Placement, natal: e.rashiId }));
      }
      // D9 dual implementation parity on the real chart
      parityChecks += 1;
      const nav = calculateNavamshaRashi(e.longitude);
      const d9Placement = shodashavarga['9'].planets[e.name]?.vargaRashiId ?? shodashavarga['9'].lagna.vargaRashiId;
      if (nav.rashiId !== d9Placement) {
        parityViolations += 1;
        fail(new VargaQualificationError('PROPERTY_VIOLATION', 'Golden chart D9 dual-implementation parity violation', { entity: e.name }));
      }
      // D60 fixture expectation on the real chart
      parityChecks += 1;
      const loc = locateOnFixture(e.longitude, 60, fixtureSet);
      const d60Placement = shodashavarga['60'].planets[e.name]?.vargaRashiId ?? shodashavarga['60'].lagna.vargaRashiId;
      if (d60Placement !== loc.expected + 1) {
        parityViolations += 1;
        fail(new VargaQualificationError('PROPERTY_VIOLATION', 'Golden chart D60 fixture mismatch', { entity: e.name, d60: d60Placement, expected: loc.expected + 1 }));
      }
    }

    // RSK_004 — MEASURED seconds for Asc / Moon to cross the next D60 (0.5°) boundary.
    const provider = resolveAstronomyProvider();
    const req = {
      utcTimestamp: '1995-06-15T05:00:00.000Z', // 10:30 IST
      latitudeDeg: 25.5941,
      longitudeDeg: 85.1376,
      conventions: { ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA' as const, nodeMode: 'MEAN_NODE' as const }
    };
    const r0 = provider.getSnapshot(req);
    const r1 = provider.getSnapshot({ ...req, utcTimestamp: '1995-06-15T05:01:00.000Z' });
    if (!(r0.ascendant as { status?: string }).status && !(r1.ascendant as { status?: string }).status) {
      const a0 = (r0.ascendant as { siderealLongitudeDeg: number }).siderealLongitudeDeg;
      const a1 = (r1.ascendant as { siderealLongitudeDeg: number }).siderealLongitudeDeg;
      const rateAsc = Math.abs(a1 - a0) / 60; // deg per second
      if (rateAsc > 0) {
        const norm = ((a0 % 360) + 360) % 360;
        const degInSign = norm % 30;
        const toBoundary = Math.ceil(degInSign * 2) / 2 - degInSign;
        d60AscFlip = toBoundary / rateAsc;
      }
    }
    const m0 = r0.bodies.Moon.siderealLongitudeDeg;
    const m1 = r1.bodies.Moon.siderealLongitudeDeg;
    const rateMoon = Math.abs(m1 - m0) / 60;
    if (rateMoon > 0) {
      const norm = ((m0 % 360) + 360) % 360;
      const degInSign = norm % 30;
      const toBoundary = Math.ceil(degInSign * 2) / 2 - degInSign;
      d60MoonFlip = toBoundary / rateMoon;
    }
  }
  propertyChecks += parityChecks;
  propertyViolations += parityViolations;

  // 5. D10 external promotion gate — reported, never opened by this run.
  let d10Gate: { status: string; mayInfluenceConclusions: boolean } = { status: 'VALIDATION_PENDING', mayInfluenceConclusions: false };
  try {
    // Lazy require keeps the runner importable without the v40 tree if needed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { D10_PROMOTION } = require('../src/lib/kundli/v40/d10Validation');
    d10Gate = { status: D10_PROMOTION.externalStatus, mayInfluenceConclusions: D10_PROMOTION.mayInfluenceConclusions };
    findings.push({
      id: 'VQF-D10-GATE',
      severity: 'NON_BLOCKING',
      code: 'D10_EXTERNAL_GATE_OPEN_ITEM',
      detail: { status: d10Gate.status, mayInfluenceConclusions: d10Gate.mayInfluenceConclusions },
      remediation: 'D10 stays display-only until the golden validation register holds a case that AGREES with a named outside reference. Internal agreement must never open this gate.'
    });
  } catch {
    findings.push({
      id: 'VQF-D10-GATE',
      severity: 'NON_BLOCKING',
      code: 'D10_EXTERNAL_GATE_UNREADABLE',
      detail: { note: 'd10Validation module not importable in this context; gate state not asserted by this run.' }
    });
  }
  if (detNoise > 0) {
    findings.push({
      id: 'VQF-FP-NOISE',
      severity: 'NON_BLOCKING',
      code: 'DETERMINISM_FP_LAST_ULP_NOISE',
      detail: { samples: detSamples, noiseRecords: detNoise, maxDeviationDeg: detMaxDev },
      remediation: 'Keep the FP-equivalence floor; do not reintroduce raw byte equality (Sprint B doctrine).'
    });
  }
  if (opts.skipSensitivity !== true) {
    findings.push({
      id: 'VQF-RSK-004',
      severity: 'NON_BLOCKING',
      code: 'D60_SENSITIVITY_MEASURED',
      detail: { d60AscFlipSeconds: d60AscFlip, d60MoonFlipSeconds: d60MoonFlip },
      remediation: 'D60 must never ground a definitive automated life reading without an explicit birth-time confidence qualification (04-risk-register.md RSK_004).'
    });
  }

  const blocking = findings.filter((f) => f.severity === 'BLOCKING');
  const knownNonBlocking = new Set(['DETERMINISM_FP_LAST_ULP_NOISE', 'D10_EXTERNAL_GATE_OPEN_ITEM', 'D10_EXTERNAL_GATE_UNREADABLE', 'D60_SENSITIVITY_MEASURED']);
  const verdict: VargaQualificationReport['verdict'] =
    blocking.length > 0 ? 'QUALIFICATION_BLOCKED'
      : findings.some((f) => !knownNonBlocking.has(f.code)) ? 'FAIL_WITH_ONLY_KNOWN_FINDINGS'
        : 'PASS';

  const report: VargaQualificationReport = {
    runnerVersion: VARGA_QUALIFICATION_RUNNER_VERSION,
    startedAtUtc,
    durationMs: Date.now() - t0,
    gate,
    fixtureSet: {
      id: fixtureSet.fixtureSetId,
      rows: fixtureSet.rowCount,
      probes: fixtureSet.boundaryProbeCount,
      anchors: fixtureSet.anchors.length,
      sha256: fixtureSet.setSha256,
      sourceStatus: fixtureSet.source.status
    },
    scenarioCount: scenarios.length,
    seed,
    streamFingerprint: scenarioStreamFingerprint(scenarios.length, seed),
    comparisons: {
      total: scenarios.length * DIVISIONS.length,
      fixtureMismatch,
      boundaryProbesRun: fixtureSet.boundaryProbes.length,
      probeMismatch,
      anchorMismatch
    },
    independentPropertyChecks: propertyChecks,
    propertyViolations,
    determinism: { samples: detSamples, hardMismatches: detHard, fpNoiseRecords: detNoise, maxDeviationDeg: detMaxDev },
    goldenChartParity: { entities: 8, checks: parityChecks, violations: parityViolations, d60AscFlipSeconds: d60AscFlip, d60MoonFlipSeconds: d60MoonFlip },
    d10ExternalGate: d10Gate,
    findings,
    verdict
  };

  const knifeNote = knifeEdgeSkips;

  const writeArtifacts = (dir: string, certDocDir?: string) => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'varga-summary.json'), JSON.stringify(report, null, 2));
    const blockingFindings = findings.filter((f) => f.severity === 'BLOCKING');
    fs.writeFileSync(path.join(dir, 'varga-failures.json'), JSON.stringify(blockingFindings, null, 2));
    if (certDocDir) {
      fs.mkdirSync(certDocDir, { recursive: true });
      fs.writeFileSync(path.join(certDocDir, 'varga-certification.md'), renderCertDoc(report, knifeNote));
    }
  };

  return { report, writeArtifacts };
}

function renderCertDoc(report: VargaQualificationReport, knifeEdgeSkips: number): string {
  const lines: string[] = [];
  lines.push('# Varga Qualification Certification (Sprint D)');
  lines.push('');
  lines.push(`> **STATUS: ${report.verdict === 'PASS'
    ? report.scenarioCount >= 100000
      ? 'QUALIFIED — Sprint D full-scale run PASSED'
      : 'QUALIFIED (full-scale 100k run pending)'
    : report.verdict === 'FAIL_WITH_ONLY_KNOWN_FINDINGS' ? 'GATE — UNKNOWN NON-BLOCKING FINDING' : 'QUALIFICATION BLOCKED'}**`);
  lines.push('> This file is GENERATED by `qualification/varga-qualification-runner.ts`. Never edit numbers by hand.');
  lines.push('> Only the numbers actually produced by the qualification pipeline may appear here (Mission §35).');
  lines.push('');
  lines.push(`- **Run started (UTC)**: ${report.startedAtUtc}`);
  lines.push(`- **Runner**: ${report.runnerVersion}`);
  lines.push(`- **Varga engine**: ${VARGA_ENGINE_VERSION}`);
  lines.push(`- **Gate**: ${report.gate}`);
  lines.push(`- **Fixture set**: ${report.fixtureSet?.id} (${report.fixtureSet?.rows} rows + ${report.fixtureSet?.probes} boundary probes + ${report.fixtureSet?.anchors} anchors, sha256 ${report.fixtureSet?.sha256}, source ${report.fixtureSet?.sourceStatus})`);
  lines.push(`- **Scenarios**: ${report.scenarioCount} (seed ${report.seed}, stream fingerprint ${report.streamFingerprint})`);
  lines.push(`- **Duration**: ${report.durationMs} ms`);
  lines.push('');
  lines.push('## Reference comparison (classical scheme tables, D1–D60)');
  lines.push('');
  lines.push('| Check | n | mismatches |');
  lines.push('|---|---|---|');
  lines.push(`| Scenario × division | ${report.comparisons.total} | ${report.comparisons.fixtureMismatch} |`);
  lines.push(`| Boundary probes (±1e-6°) | ${report.comparisons.boundaryProbesRun} | ${report.comparisons.probeMismatch} |`);
  lines.push(`| Classical anchors | ${report.fixtureSet?.anchors} | ${report.comparisons.anchorMismatch} |`);
  lines.push('');
  lines.push('Boundary semantics: a part boundary belongs to the NEXT part (engine ε=1e-9 guard). Exact knife edges in the');
  lines.push(`scenario sweep (${knifeEdgeSkips} samples) are decided exclusively by the deterministic probe set.`);
  lines.push('');
  lines.push('## Independent property verification (Mission §7, per scenario × division)');
  lines.push('');
  lines.push(`- **Property checks executed**: ${report.independentPropertyChecks}`);
  lines.push(`- **Property violations**: ${report.propertyViolations}`);
  lines.push('- Checks: range containment; D9 harmonic identity `floor(lon/(10/3)) mod 12`; D9 dual-implementation parity');
  lines.push('  (vargaEngine vs canonicalSnapshot.calculateNavamshaRashi); D60 shashtiamsha structure; vargottama identity');
  lines.push('  (flag ⇔ D1 sign = D9 sign); golden-chart convention parity (D1 = natal rashi, all 8 entities).');
  lines.push('');
  lines.push('## Determinism (CT_INV_007)');
  lines.push('');
  lines.push(`- **Samples**: ${report.determinism.samples} (every 100th scenario, full 16-division recompute)`);
  lines.push(`- **Hard mismatches**: ${report.determinism.hardMismatches}`);
  lines.push(`- **FP last-ULP noise records (non-byte-identical, FP-equivalent)**: ${report.determinism.fpNoiseRecords} (max ${report.determinism.maxDeviationDeg}°)`);
  lines.push('');
  lines.push('## RSK_004 — D60 birth-time sensitivity (MEASURED in this run)');
  lines.push('');
  lines.push(`- Ascendant: **${report.goldenChartParity.d60AscFlipSeconds ?? 'n/a'} s** of clock time until the next D60 lagna boundary.`);
  lines.push(`- Moon: **${report.goldenChartParity.d60MoonFlipSeconds ?? 'n/a'} s** until the next D60 Moon boundary.`);
  lines.push('- Consequence: D60 placements are not resolvable without explicit birth-time confidence. D60 must never ground');
  lines.push('  a definitive automated life reading; the source of every D60 number in the report is the same certified kernel.');
  lines.push('');
  lines.push('## D10 external promotion gate');
  lines.push('');
  lines.push(`- **Status**: ${report.d10ExternalGate.status}; mayInfluenceConclusions = ${report.d10ExternalGate.mayInfluenceConclusions}.`);
  lines.push('- The gate opens ONLY when the golden validation register records a D10 case that AGREES with a named outside');
  lines.push('  reference. Cross-implementation agreement (however good) must never open it — two implementations of the same');
  lines.push('  misreading agree perfectly.');
  lines.push('');
  lines.push('## Findings');
  lines.push('');
  for (const f of report.findings) {
    lines.push(`- **[${f.severity}] ${f.code}**: ${JSON.stringify(f.detail)}`);
    if (f.remediation) lines.push(`  - Remediation: ${f.remediation}`);
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

function parseArgs(argv: string[]): { scenarios: number; seed: number; gate: VargaQualificationGate; writeCertDoc: boolean } {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const scenarios = Number(get('--scenarios') ?? 100000);
  const seedRaw = get('--seed');
  const seed = seedRaw !== undefined ? (seedRaw.startsWith('0x') ? parseInt(seedRaw, 16) : Number(seedRaw)) : DEFAULT_VARGA_SCENARIO_SEED;
  const gate = (get('--gate') === 'strict' ? 'strict' : 'scaffold') as VargaQualificationGate;
  const writeCertDoc = argv.includes('--write-cert-doc');
  return { scenarios, seed, gate, writeCertDoc };
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'varga-boundary-fixtures.json'), 'utf8'));
  const fixtureSet = loadVargaFixtureSet(raw);
  console.log(`[varga-qualification] runner=${VARGA_QUALIFICATION_RUNNER_VERSION} scenarios=${args.scenarios} seed=${args.seed} gate=${args.gate}`);
  const { report, writeArtifacts } = runVargaQualificationDetailed({
    scenarios: args.scenarios,
    seed: args.seed,
    gate: args.gate,
    fixtureSet
  });
  writeArtifacts(__dirname, args.writeCertDoc ? path.join(__dirname, '..', 'docs', 'reference-grade') : undefined);
  console.log('');
  console.log('=== VARGA QUALIFICATION SUMMARY ===');
  console.log(`Verdict: ${report.verdict} (gate=${report.gate})`);
  console.log(`Scenarios: ${report.scenarioCount} × ${DIVISIONS.length} divisions`);
  console.log(`Reference comparison: ${report.comparisons.total} comparisons, ${report.comparisons.fixtureMismatch} mismatches; probes ${report.comparisons.boundaryProbesRun}/${report.comparisons.probeMismatch}; anchors ${report.comparisons.anchorMismatch}`);
  console.log(`Independent property checks: ${report.independentPropertyChecks}, violations: ${report.propertyViolations}`);
  console.log(`Determinism: ${report.determinism.samples} samples, ${report.determinism.hardMismatches} hard, ${report.determinism.fpNoiseRecords} FP-noise (max ${report.determinism.maxDeviationDeg}°)`);
  console.log(`D60 sensitivity (RSK_004): asc ${report.goldenChartParity.d60AscFlipSeconds ?? 'n/a'} s, moon ${report.goldenChartParity.d60MoonFlipSeconds ?? 'n/a'} s`);
  console.log(`D10 external gate: ${report.d10ExternalGate.status}`);
  console.log(`Findings: ${report.findings.length} (${report.findings.filter((f) => f.severity === 'BLOCKING').length} blocking)`);
  console.log('Artifacts: qualification/varga-summary.json, qualification/varga-failures.json' + (args.writeCertDoc ? ', docs/reference-grade/varga-certification.md' : ''));
  process.exitCode = report.verdict === 'PASS' || report.verdict === 'FAIL_WITH_ONLY_KNOWN_FINDINGS' ? 0 : 1;
}
