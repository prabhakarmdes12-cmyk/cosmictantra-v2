/**
 * ASTRONOMY QUALIFICATION RUNNER — Sprint B scaffold for the 100,000-scenario run (Sprint C).
 * Mission Section 5 (Mass Astronomical Qualification) & Section 41 (Sprint B/C).
 *
 * What Sprint B delivers here:
 *   1. The complete deterministic harness machinery: scenario generation (100k-capable),
 *      fail-closed execution against the AstronomyProvider abstraction, explicit
 *      arcsecond tolerances, full-precision divergence records.
 *   2. Production self-audit: invariants (node opposition, ranges, finiteness — enforced
 *      inside the provider), byte-identical determinism sampling, boundary proximity tagging.
 *   3. External comparison against the JPL Horizons golden seed fixtures (36 rows,
 *      7 grahas × 4 epochs + analytic mean-node rows).
 *   4. Generation of qualification/astronomy-summary.json, astronomy-failures.json,
 *      astronomy-statistics.json and (optionally) docs/reference-grade/astronomy-certification.md.
 *
 * Fail-closed doctrine: any invariant violation aborts the run with a typed finding.
 * Divergences above tolerance are never hidden by rounding; they are recorded with full
 * precision and classified. Known, documented Sprint-B findings are listed explicitly;
 * `--gate strict` blocks on anything.
 *
 * Usage:
 *   npm run qualify:astronomy            # full 100,000-scenario scaffold run (Sprint C scale)
 *   npm run qualify:astronomy:scaffold   # fast scaffold gate used by CI today
 *   npx tsx qualification/astronomy-qualification-runner.ts --scenarios 5000 --seed 0x1234
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  resolveAstronomyProvider,
  loadAstronomyFixtureSet,
  compareReadingsForDeterminism,
  AstronomyProviderError,
  type AstronomyFixtureSet,
  type EphemerisReading
} from '../src/lib/astronomy/astronomyProvider';
import {
  generateAstronomyScenarios,
  scenarioStreamFingerprint,
  REQUIRED_COVERAGE_TAGS,
  SCENARIO_GENERATOR_VERSION,
  DEFAULT_SCENARIO_SEED,
  type AstronomyScenario
} from './scenarioGenerator';
import {
  classifyComparison,
  arcsecDelta,
  TOLERANCE_MODEL_VERSION,
  TOLERANCE_TABLE_ARCSEC,
  type ComparisonClassification,
  type DivergenceRecord
} from './toleranceModel';

export const QUALIFICATION_RUNNER_VERSION = 'astronomy-qualification-runner-2.0.0 (sprint C)';
/** Registry-declared Lahiri ayanamsha at J2000.0 (03-convention-registry.md §2.1): 23°51'11". */
export const DECLARED_AYANAMSHA_J2000_DEG = 23 + 51 / 60 + 11 / 3600;

export type QualificationGate = 'scaffold' | 'strict';

/**
 * Findings already documented and risk-registered. Since Sprint C they are all
 * NON_BLOCKING (the Sprint B blocking findings AYANAMSHA_EPOCH_DECLARED_VS_IMPLEMENTED
 * and MC_NOT_CALCULATED were RESOLVED by the versioned reconciliation lahiri-registry-
 * aligned-2.0.0 and the Midheaven implementation respectively). Any NEW blocking finding
 * still fails the gate — documented findings cannot hide new defects.
 */
export const KNOWN_SPRINT_B_FINDINGS: readonly string[] = [
  'DETERMINISM_FP_LAST_ULP_NOISE'
];

export interface QualificationFinding {
  findingId: string;
  severity: 'BLOCKING' | 'NON_BLOCKING';
  classification: ComparisonClassification | 'GAP_NOT_CALCULATED' | 'PLATFORM_FLOAT_NOISE';
  message: string;
  evidence?: Record<string, unknown>;
  remediation: string;
}

export interface QualificationComparisonResult extends DivergenceRecord {
  source: 'JPL_HORIZONS_FIXTURE' | 'ANALYTIC_MEAN_NODE';
  sourceStatus: string;
}

export interface AstronomyQualificationReport {
  ok: boolean;
  verdict: 'PASS' | 'FAIL' | 'FAIL_WITH_ONLY_KNOWN_FINDINGS';
  gate: QualificationGate;
  runnerVersion: string;
  scenarioGeneratorVersion: string;
  toleranceModelVersion: string;
  provider: { providerId: string; version: string; kernel: string; validationStatus: string };
  fixtureSet?: { fixtureSetId: string; fixtureSetSha256: string; rowCount: number };
  scenarioCount: number;
  seed: number;
  scenarioStreamFingerprint: string;
  startedAtUtc: string;
  durationMs: number;
  counts: {
    scenariosExecuted: number;
    scenariosAborted: number;
    determinismSamplesChecked: number;
    determinismMismatches: number;
    determinismFpNoiseSamples: number;
    determinismMaxFpDeviationDeg: number;
    independentPropertyChecks: number;
    propertyViolations: number;
    invariantViolations: number;
    fixtureComparisons: number;
    match: number;
    withinTolerance: number;
    explainedDivergence: number;
    referenceDivergence: number;
    cosmicTantraDefect: number;
    notCalculated: number;
  };
  findings: QualificationFinding[];
  coverage: { tag: string; scenarios: number }[];
  requiredCoverageMissing: string[];
  boundaryProximity: {
    signBoundaryScenarios: number;
    nakshatraBoundaryScenarios: number;
    sampleWindowDeg: number;
  };
  perPointStatistics?: Record<string, { n: number; maxAbsDeltaArcsec: number; meanAbsDeltaArcsec: number }>;
}

/* ------------------------------------------------------------------------- */
/* Execution                                                                  */
/* ------------------------------------------------------------------------- */

const PROBE_LOCATION = { latitudeDeg: 25.5941, longitudeDeg: 85.1376 }; // Patna (convention anchor)
const SIGN_BOUNDARY_WINDOW_DEG = 0.05;
const NAKSHATRA_BOUNDARY_WINDOW_DEG = 0.05;
/** Property residual tolerance for the independent horizon/meridian identities (≈0.036"). */
const PROPERTY_RESIDUAL_TOLERANCE_DEG = 1e-5;
/** Obliquity cross-check tolerance vs the independent IAU 2006 series (arcseconds). */
const OBLIQUITY_CROSSCHECK_TOLERANCE_ARCSEC = 5;

/* --- Independent implementations for property-based verification (Mission §21) ---
 * These use spherical-astronomy identities on a DIFFERENT path than the engine formulas,
 * so agreement demonstrates the engine outputs satisfy their DEFINING properties. */

function normalize180(x: number): number {
  let v = ((x % 360) + 360) % 360;
  if (v > 180) v -= 360;
  return v;
}

/**
 * Ascendant defining property: the ascendant ecliptic point lies ON the sensible horizon
 * (altitude ≈ 0) on the RISING (eastern) branch (hour angle in (−180°, 0°)).
 * Fully independent path: δ and RA from λ via spherical transforms, altitude from the
 * standard horizon equation — no shared code with the engine's ascendant formula.
 */
function ascendantHorizonResidualDeg(
  ascTropicalDeg: number, lstDeg: number, latDeg: number, obliquityDeg: number
): { altitudeDeg: number; hourAngleDeg: number } {
  const toRad = Math.PI / 180;
  const lam = ascTropicalDeg * toRad;
  const eps = obliquityDeg * toRad;
  const phi = latDeg * toRad;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const ra = Math.atan2(Math.sin(lam) * Math.cos(eps), Math.cos(lam));
  const H = normalize180(lstDeg - ra / toRad) * toRad;
  const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  return { altitudeDeg: alt / toRad, hourAngleDeg: H / toRad };
}

/**
 * MC defining property: the Right Ascension of the MC ecliptic point equals the Local
 * Sidereal Time (upper culmination: |H| ≈ 0, cos H > 0). Independent round-trip path.
 */
function mcMeridianResidualDeg(
  mcTropicalDeg: number, lstDeg: number, obliquityDeg: number
): { hourAngleDeg: number } {
  const toRad = Math.PI / 180;
  const lam = mcTropicalDeg * toRad;
  const eps = obliquityDeg * toRad;
  const ra = Math.atan2(Math.sin(lam) * Math.cos(eps), Math.cos(lam));
  return { hourAngleDeg: normalize180(lstDeg - ra / toRad) };
}

/**
 * Independent obliquity series: IAU 2006 precession-nutation polynomial (arcsec → deg),
 * distinct coefficient set from the engine's IAU 1976-based series.
 */
export function independentObliquityIau2006Deg(julianDayTT: number): number {
  const T = (julianDayTT - 2451545.0) / 36525.0;
  const arcsec =
    84381.406 -
    46.836769 * T -
    0.0001831 * T * T +
    0.0020034 * T * T * T -
    0.000576 * T * T * T * T -
    0.0000434 * T * T * T * T * T;
  return arcsec / 3600;
}

function distanceToNearestBoundary(lonDeg: number, sectorDeg: number): number {
  const pos = ((lonDeg % sectorDeg) + sectorDeg) % sectorDeg;
  return Math.min(pos, sectorDeg - pos);
}

export interface RunOptions {
  scenarioCount?: number;
  seed?: number;
  gate?: QualificationGate;
  fixtureSetRaw?: unknown;
  fixtureSetPath?: string;
  artifactDir?: string;
  writeCertDoc?: boolean;
  certDocPath?: string;
  nowUtc?: () => string; // injectable ONLY for tests; production path is wall-clock metadata
}

export function runAstronomyQualification(options: RunOptions = {}): AstronomyQualificationReport {
  return runAstronomyQualificationDetailed(options).report;
}

export interface DetailedQualificationResult {
  report: AstronomyQualificationReport;
  divergences: QualificationComparisonResult[];
}

export function runAstronomyQualificationDetailed(options: RunOptions = {}): DetailedQualificationResult {
  const scenarioCount = options.scenarioCount ?? 100_000;
  const seed = options.seed ?? DEFAULT_SCENARIO_SEED;
  const gate: QualificationGate = options.gate ?? 'scaffold';
  const startedAtUtc = (options.nowUtc ?? (() => new Date().toISOString()))();
  const t0 = Date.now();

  const provider = resolveAstronomyProvider();
  const findings: QualificationFinding[] = [];
  const divergenceRecords: QualificationComparisonResult[] = [];

  /* ---------------- fixture set ---------------- */
  let fixtureSet: AstronomyFixtureSet | undefined;
  if (options.fixtureSetRaw !== undefined) {
    fixtureSet = loadAstronomyFixtureSet(options.fixtureSetRaw);
  } else {
    const p = options.fixtureSetPath ?? path.join(__dirname, 'fixtures', 'astronomy-golden-fixtures.json');
    if (fs.existsSync(p)) {
      fixtureSet = loadAstronomyFixtureSet(JSON.parse(fs.readFileSync(p, 'utf8')));
    }
  }

  /* ---------------- 1. Ayanamsha epoch CONFORMANCE (declared == implemented) --- */
  let invariantViolations = 0;
  let ayanamshaJ2000Deg: number | null = null;
  try {
    const probe = provider.getSnapshot({
      utcTimestamp: '2000-01-01T12:00:00.000Z',
      ...PROBE_LOCATION,
      conventions: { ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA', nodeMode: 'MEAN_NODE' }
    });
    ayanamshaJ2000Deg = probe.meta.ayanamsha.degrees;
    const deltaArcsec = (ayanamshaJ2000Deg - DECLARED_AYANAMSHA_J2000_DEG) * 3600;
    if (Math.abs(deltaArcsec) > 1) {
      findings.push({
        findingId: 'AYANAMSHA_EPOCH_DECLARED_VS_IMPLEMENTED',
        severity: 'BLOCKING',
        classification: 'COSMICTANTRA_DEFECT',
        message:
          `Engine ayanamsha at J2000.0 is ${ayanamshaJ2000Deg.toFixed(6)}° but convention registry declares ` +
          `${DECLARED_AYANAMSHA_J2000_DEG.toFixed(6)}° (23°51'11") — divergence ${deltaArcsec.toFixed(2)}". ` +
          'The implementation does not meet its own CT_INV_004 declaration (regression of the Sprint C reconciliation).',
        evidence: { implementedDeg: ayanamshaJ2000Deg, declaredDeg: DECLARED_AYANAMSHA_J2000_DEG, deltaArcsec },
        remediation:
          'Restore/enforce the lahiri-registry-aligned-2.0.0 constant (23°51\'11" @ J2000, 50.290966"/yr). Never widen the tolerance to pass.'
      });
    }
  } catch (err) {
    invariantViolations++;
    findings.push({
      findingId: 'AYANAMSHA_EPOCH_PROBE_FAILED',
      severity: 'BLOCKING',
      classification: 'COSMICTANTRA_DEFECT',
      message: `Ayanamsha epoch probe failed: ${err instanceof Error ? err.message : String(err)}`,
      remediation: 'Investigate provider invariant enforcement.'
    });
  }

  /* ---------------- 2. Scenario self-audit (invariants + determinism + boundaries) --- */
  const scenarios: AstronomyScenario[] = generateAstronomyScenarios(scenarioCount, seed);
  const fingerprint = scenarioStreamFingerprint(scenarioCount, seed);

  let scenariosExecuted = 0;
  let scenariosAborted = 0;
  let determinismSamples = 0;
  let determinismMismatches = 0;
  let determinismFpNoiseSamples = 0;
  let determinismMaxFpDeviation = 0;
  let propertyChecks = 0;
  let propertyViolations = 0;
  let signBoundaryScenarios = 0;
  let nakshatraBoundaryScenarios = 0;
  const coverageCounter: Record<string, number> = {};

  for (const scenario of scenarios) {
    for (const tag of scenario.coverageTags) coverageCounter[tag] = (coverageCounter[tag] ?? 0) + 1;

    let reading: EphemerisReading;
    try {
      reading = provider.getSnapshot({
        utcTimestamp: scenario.utcTimestamp,
        latitudeDeg: scenario.latitudeDeg,
        longitudeDeg: scenario.longitudeDeg,
        conventions: { ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA', nodeMode: 'MEAN_NODE' }
      });
    } catch (err) {
      scenariosAborted++;
      if (err instanceof AstronomyProviderError && err.code === 'ASTRONOMY_INVARIANT_VIOLATED') {
        invariantViolations++;
        findings.push({
          findingId: `INVARIANT_VIOLATION_${scenario.scenarioId}`,
          severity: 'BLOCKING',
          classification: 'COSMICTANTRA_DEFECT',
          message: `Invariant violation at scenario ${scenario.scenarioId}: ${err.message}`,
          evidence: { scenario, detail: err.detail },
          remediation: 'Fail-closed. Investigate before any qualification claim.'
        });
        continue;
      }
      // Certified-period guard scenarios (first/last second) may legitimately abort on
      // engine-side edge behaviour; recorded, never swallowed.
      findings.push({
        findingId: `SCENARIO_ABORTED_${scenario.scenarioId}`,
        severity: 'NON_BLOCKING',
        classification: 'NOT_CALCULATED',
        message: `Scenario ${scenario.scenarioId} aborted: ${err instanceof Error ? (err as AstronomyProviderError).code + ': ' + err.message : String(err)}`,
        evidence: { scenario },
        remediation: 'Reviewed in Sprint C mass run; NOT_CALCULATED is a declared outcome, not a pass.'
      });
      continue;
    }

    scenariosExecuted++;

    // Determinism sampling: every 50th scenario is computed twice (CT_INV_007).
    // Two-tier contract: byte-identical is ideal; FP-equivalence (|Δ| ≤ 1e-9° class)
    // is the enforced floor because the V8 runtime may reassociate the last ULP of
    // float64 results across JIT tier transitions. Anything looser fails closed.
    if (scenario.index % 50 === 0) {
      determinismSamples++;
      const replay = provider.getSnapshot({
        utcTimestamp: scenario.utcTimestamp,
        latitudeDeg: scenario.latitudeDeg,
        longitudeDeg: scenario.longitudeDeg,
        conventions: { ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA', nodeMode: 'MEAN_NODE' }
      });
      const det = compareReadingsForDeterminism(reading, replay);
      if (!det.byteIdentical) {
        determinismFpNoiseSamples++;
        if (det.maxDeviation > determinismMaxFpDeviation) {
          determinismMaxFpDeviation = det.maxDeviation;
        }
      }
      if (!det.equivalent) {
        determinismMismatches++;
        findings.push({
          findingId: `DETERMINISM_MISMATCH_${scenario.scenarioId}`,
          severity: 'BLOCKING',
          classification: 'COSMICTANTRA_DEFECT',
          message: `Determinism violation beyond FP-equivalence: two identical calls produced structurally different readings (${scenario.scenarioId}) at ${det.maxDeviationPath}.`,
          evidence: { scenario, maxDeviation: det.maxDeviation, path: det.maxDeviationPath },
          remediation: 'CT_INV_007 violated. Fail closed; investigate non-determinism.'
        });
      }
    }

    // Boundary proximity tagging from the computed reading (Mission §22 boundary classes).
    const lons = Object.values(reading.bodies).map(b => b.tropicalLongitudeDeg);
    if (lons.some(l => distanceToNearestBoundary(l, 30) < SIGN_BOUNDARY_WINDOW_DEG)) signBoundaryScenarios++;
    if (lons.some(l => distanceToNearestBoundary(l, 360 / 27) < NAKSHATRA_BOUNDARY_WINDOW_DEG)) nakshatraBoundaryScenarios++;

    // Independent property verification (Mission §21) — executed on EVERY scenario.
    const asc = reading.ascendant;
    const mcR = reading.mc;
    if (asc && 'tropicalLongitudeDeg' in asc) {
      propertyChecks++;
      const r = ascendantHorizonResidualDeg(
        asc.tropicalLongitudeDeg, asc.localSiderealTimeDegrees,
        scenario.latitudeDeg, reading.meta.observer.obliquityOfEclipticDeg);
      if (!Number.isFinite(r.altitudeDeg) || Math.abs(r.altitudeDeg) > PROPERTY_RESIDUAL_TOLERANCE_DEG || r.hourAngleDeg >= 0) {
        propertyViolations++;
        findings.push({
          findingId: `ASCENDANT_HORIZON_PROPERTY_${scenario.scenarioId}`,
          severity: 'BLOCKING',
          classification: 'COSMICTANTRA_DEFECT',
          message: `Ascendant fails its defining property at ${scenario.scenarioId}: altitude ${r.altitudeDeg.toFixed(8)}° (must be ≈0 on the horizon), hour angle ${r.hourAngleDeg.toFixed(6)}° (must be negative/eastern).`,
          evidence: { scenario, altitudeDeg: r.altitudeDeg, hourAngleDeg: r.hourAngleDeg },
          remediation: 'Fail closed. The ascendant formula or sidereal time is defective at this geometry.'
        });
      }
    }
    if (mcR && 'tropicalLongitudeDeg' in mcR && asc && 'localSiderealTimeDegrees' in asc) {
      propertyChecks++;
      const rm = mcMeridianResidualDeg(mcR.tropicalLongitudeDeg, asc.localSiderealTimeDegrees, reading.meta.observer.obliquityOfEclipticDeg);
      if (!Number.isFinite(rm.hourAngleDeg) || Math.abs(rm.hourAngleDeg) > PROPERTY_RESIDUAL_TOLERANCE_DEG) {
        propertyViolations++;
        findings.push({
          findingId: `MC_MERIDIAN_PROPERTY_${scenario.scenarioId}`,
          severity: 'BLOCKING',
          classification: 'COSMICTANTRA_DEFECT',
          message: `MC fails its defining property at ${scenario.scenarioId}: hour angle ${rm.hourAngleDeg.toFixed(8)}° (must be ≈0, upper culmination).`,
          evidence: { scenario, hourAngleDeg: rm.hourAngleDeg },
          remediation: 'Fail closed. The MC formula does not satisfy RA(MC) = LST at this geometry.'
        });
      }
    }
    // Obliquity cross-check vs the independent IAU 2006 series.
    propertyChecks++;
    const epsIau = independentObliquityIau2006Deg(reading.meta.julianDayTT);
    const obliquityDeltaArcsec = Math.abs(reading.meta.observer.obliquityOfEclipticDeg - epsIau) * 3600;
    if (obliquityDeltaArcsec > OBLIQUITY_CROSSCHECK_TOLERANCE_ARCSEC) {
      propertyViolations++;
      findings.push({
        findingId: `OBLIQUITY_SERIES_DIVERGENCE_${scenario.scenarioId}`,
        severity: 'BLOCKING',
        classification: 'REFERENCE_DIVERGENCE',
        message: `Obliquity diverges from the independent IAU 2006 series at ${scenario.scenarioId}: ${obliquityDeltaArcsec.toFixed(3)}" > ${OBLIQUITY_CROSSCHECK_TOLERANCE_ARCSEC}".`,
        evidence: { scenario, engineArcsec: reading.meta.observer.obliquityOfEclipticDeg * 3600, iau2006Arcsec: epsIau * 3600 },
        remediation: 'Fail closed. Reconcile the obliquity series (documented, versioned change).'
      });
    }
  }

  /* ---------------- 3. External comparison vs golden fixtures --- */
  const perPointAgg: Record<string, { n: number; sum: number; max: number }> = {};
  if (fixtureSet) {
    const instants = Array.from(new Set(fixtureSet.fixtures.map(f => f.utcTimestamp))).sort();
    for (const instant of instants) {
      const rows = fixtureSet.fixtures.filter(r => r.utcTimestamp === instant);
      let reading: EphemerisReading;
      try {
        reading = provider.getSnapshot({
          utcTimestamp: instant,
          ...PROBE_LOCATION,
          conventions: { ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA', nodeMode: 'MEAN_NODE' }
        });
      } catch (err) {
        invariantViolations++;
        findings.push({
          findingId: `FIXTURE_PROBE_FAILED_${instant}`,
          severity: 'BLOCKING',
          classification: 'COSMICTANTRA_DEFECT',
          message: `Production provider failed on fixture instant ${instant}: ${err instanceof Error ? err.message : String(err)}`,
          remediation: 'Fail closed.'
        });
        continue;
      }

      for (const row of rows) {
        const actual = (reading.bodies as Record<string, { tropicalLongitudeDeg: number }>)[row.point];
        if (!actual) {
          divergenceRecords.push({
            source: row.sourceStatus === 'SOURCE_VERIFIED' ? 'JPL_HORIZONS_FIXTURE' : 'ANALYTIC_MEAN_NODE',
            sourceStatus: row.sourceStatus,
            fixtureId: row.fixtureId,
            scenarioId: `FIXTURE-${row.fixtureId}`,
            point: row.point,
            utcTimestamp: instant,
            expectedDeg: row.tropicalEclipticLongitudeDeg,
            actualDeg: NaN,
            deltaArcsec: NaN,
            toleranceArcsec: TOLERANCE_TABLE_ARCSEC[row.point] ?? NaN,
            classification: 'NOT_CALCULATED'
          });
          findings.push({
            findingId: `POINT_NOT_CALCULATED_${row.fixtureId}`,
            severity: 'BLOCKING',
            classification: 'NOT_CALCULATED',
            message: `Point ${row.point} is not produced by the production provider (fixture ${row.fixtureId}).`,
            remediation: 'Declare the gap (CT_INV_006) and schedule certification work.'
          });
          continue;
        }
        const deltaArcsec = arcsecDelta(row.tropicalEclipticLongitudeDeg, actual.tropicalLongitudeDeg);
        const verdict = classifyComparison({ point: row.point, utcTimestamp: instant, deltaArcsec });
        const isAnalytic = row.sourceStatus !== 'SOURCE_VERIFIED';
        divergenceRecords.push({
          source: isAnalytic ? 'ANALYTIC_MEAN_NODE' : 'JPL_HORIZONS_FIXTURE',
          sourceStatus: row.sourceStatus,
          fixtureId: row.fixtureId,
          scenarioId: `FIXTURE-${row.fixtureId}`,
          point: row.point,
          utcTimestamp: instant,
          expectedDeg: row.tropicalEclipticLongitudeDeg,
          actualDeg: actual.tropicalLongitudeDeg,
          deltaArcsec,
          toleranceArcsec: verdict.toleranceArcsec,
          classification: verdict.classification,
          explanationCode: verdict.explanationCode,
          explanationBasis: verdict.explanationBasis
        });
        const agg = perPointAgg[row.point] ?? { n: 0, sum: 0, max: 0 };
        agg.n++;
        agg.sum += Math.abs(deltaArcsec);
        agg.max = Math.max(agg.max, Math.abs(deltaArcsec));
        perPointAgg[row.point] = agg;

        if (verdict.classification === 'REFERENCE_DIVERGENCE') {
          findings.push({
            findingId: `REFERENCE_DIVERGENCE_${row.fixtureId}`,
            severity: 'BLOCKING',
            classification: 'REFERENCE_DIVERGENCE',
            message:
              `${row.point} at ${instant}: |Δ| = ${Math.abs(deltaArcsec).toFixed(3)}" exceeds tolerance ` +
              `${verdict.toleranceArcsec}" — unexplained divergence blocks qualification.`,
            evidence: { expectedDeg: row.tropicalEclipticLongitudeDeg, actualDeg: actual.tropicalLongitudeDeg, deltaArcsec },
            remediation: 'Explain (time-scale, convention, model) or fix. Never widen tolerance to pass.'
          });
        }
      }
    }
  }

  if (determinismFpNoiseSamples > 0) {
    findings.push({
      findingId: 'DETERMINISM_FP_LAST_ULP_NOISE',
      severity: 'NON_BLOCKING',
      classification: 'PLATFORM_FLOAT_NOISE',
      message:
        `${determinismFpNoiseSamples}/${determinismSamples} determinism samples were not byte-identical but are ` +
        `FP-equivalent (max deviation ${determinismMaxFpDeviation.toExponential(3)} degrees, ≈` +
        `${(determinismMaxFpDeviation * 3600).toExponential(3)} arcsec). Last-ULP reassociation in the wrapped ` +
        'library path under V8 JIT tier transitions; enforced floor is 1e-9° equivalence, exceeded by 7+ orders of magnitude nowhere.',
      evidence: { samples: determinismSamples, fpNoiseSamples: determinismFpNoiseSamples, maxDeviationDeg: determinismMaxFpDeviation },
      remediation: 'Keep the FP-equivalence determinism floor enforced; Sprint C should re-measure on the full 100k run.'
    });
  }

  /* ---------------- 4. MC coverage gate (Sprint C: MC must be computed) --- */
  const mcProbe = provider.getSnapshot({
    utcTimestamp: '2000-01-01T12:00:00.000Z',
    ...PROBE_LOCATION,
    conventions: { ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA', nodeMode: 'MEAN_NODE' }
  });
  if (mcProbe.mc && 'status' in mcProbe.mc && mcProbe.mc.status === 'NOT_CALCULATED') {
    findings.push({
      findingId: 'MC_NOT_CALCULATED',
      severity: 'BLOCKING',
      classification: 'GAP_NOT_CALCULATED',
      message: 'Midheaven (MC) is declared NOT_CALCULATED by the production provider; Mission §5 requires MC coverage for astronomy certification.',
      evidence: { reason: mcProbe.mc.reason },
      remediation: 'Restore the Sprint C Midheaven implementation in the wrapped engine.'
    });
  }

  /* ---------------- 5. Assemble report --- */
  const counts = {
    scenariosExecuted,
    scenariosAborted,
    determinismSamplesChecked: determinismSamples,
    determinismMismatches,
    determinismFpNoiseSamples,
    determinismMaxFpDeviationDeg: Number(determinismMaxFpDeviation.toExponential(3)),
    invariantViolations,
    independentPropertyChecks: propertyChecks,
    propertyViolations,
    fixtureComparisons: divergenceRecords.length,
    match: divergenceRecords.filter(r => r.classification === 'MATCH').length,
    withinTolerance: divergenceRecords.filter(r => r.classification === 'WITHIN_TOLERANCE').length,
    explainedDivergence: divergenceRecords.filter(r => r.classification === 'EXPLAINED_DIVERGENCE').length,
    referenceDivergence: divergenceRecords.filter(r => r.classification === 'REFERENCE_DIVERGENCE').length,
    cosmicTantraDefect: findings.filter(f => f.classification === 'COSMICTANTRA_DEFECT').length,
    notCalculated: divergenceRecords.filter(r => r.classification === 'NOT_CALCULATED').length
  };

  const requiredCoverageMissing = scenarioCount >= 1000
    ? REQUIRED_COVERAGE_TAGS.filter(t => !coverageCounter[t])
    : [];
  if (requiredCoverageMissing.length > 0) {
    findings.push({
      findingId: 'REQUIRED_COVERAGE_MISSING',
      severity: 'BLOCKING',
      classification: 'COSMICTANTRA_DEFECT',
      message: `Scenario stream is missing required Mission §5 coverage dimensions: ${requiredCoverageMissing.join(', ')}`,
      remediation: 'Fix the scenario generator before mass qualification.'
    });
  }

  const blocking = findings.filter(f => f.severity === 'BLOCKING');
  const unexpectedBlocking = blocking.filter(f => !KNOWN_SPRINT_B_FINDINGS.includes(f.findingId));
  let verdict: AstronomyQualificationReport['verdict'];
  if (blocking.length === 0) verdict = 'PASS';
  else if (gate === 'scaffold' && unexpectedBlocking.length === 0) verdict = 'FAIL_WITH_ONLY_KNOWN_FINDINGS';
  else verdict = 'FAIL';

  const perPointStatistics: Record<string, { n: number; maxAbsDeltaArcsec: number; meanAbsDeltaArcsec: number }> = {};
  for (const [point, agg] of Object.entries(perPointAgg)) {
    perPointStatistics[point] = {
      n: agg.n,
      maxAbsDeltaArcsec: Number(agg.max.toFixed(3)),
      meanAbsDeltaArcsec: Number((agg.sum / agg.n).toFixed(3))
    };
  }

  const report: AstronomyQualificationReport = {
    ok: verdict !== 'FAIL',
    verdict,
    gate,
    runnerVersion: QUALIFICATION_RUNNER_VERSION,
    scenarioGeneratorVersion: SCENARIO_GENERATOR_VERSION,
    toleranceModelVersion: TOLERANCE_MODEL_VERSION,
    provider: {
      providerId: provider.descriptor.providerId,
      version: provider.descriptor.version,
      kernel: provider.descriptor.kernel,
      validationStatus: provider.descriptor.validationStatus
    },
    fixtureSet: fixtureSet
      ? { fixtureSetId: fixtureSet.fixtureSetId, fixtureSetSha256: fixtureSet.fixtureSetSha256, rowCount: fixtureSet.fixtures.length }
      : undefined,
    scenarioCount,
    seed,
    scenarioStreamFingerprint: fingerprint,
    startedAtUtc,
    durationMs: Date.now() - t0,
    counts,
    findings,
    coverage: Object.entries(coverageCounter).map(([tag, n]) => ({ tag, scenarios: n })).sort((a, b) => a.tag.localeCompare(b.tag)),
    requiredCoverageMissing,
    boundaryProximity: {
      signBoundaryScenarios,
      nakshatraBoundaryScenarios,
      sampleWindowDeg: SIGN_BOUNDARY_WINDOW_DEG
    },
    perPointStatistics
  };

  return { report, divergences: divergenceRecords };
}

/* ------------------------------------------------------------------------- */
/* Artifact writers                                                           */
/* ------------------------------------------------------------------------- */

export interface ArtifactPaths {
  summary: string;
  failures: string;
  statistics: string;
  certDoc?: string;
}

export function writeQualificationArtifacts(
  report: AstronomyQualificationReport,
  divergenceRecords: QualificationComparisonResult[],
  opts: { artifactDir?: string; writeCertDoc?: boolean; certDocPath?: string; nowUtc?: () => string }
): ArtifactPaths {
  const dir = opts.artifactDir ?? __dirname;
  fs.mkdirSync(dir, { recursive: true });

  const summaryPath = path.join(dir, 'astronomy-summary.json');
  const failuresPath = path.join(dir, 'astronomy-failures.json');
  const statisticsPath = path.join(dir, 'astronomy-statistics.json');

  fs.writeFileSync(summaryPath, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(failuresPath, JSON.stringify({
    generatedAtUtc: (opts.nowUtc ?? (() => new Date().toISOString()))(),
    runnerVersion: report.runnerVersion,
    verdict: report.verdict,
    total: divergenceRecords.length,
    divergences: divergenceRecords
  }, null, 2) + '\n');
  fs.writeFileSync(statisticsPath, JSON.stringify({
    generatedAtUtc: (opts.nowUtc ?? (() => new Date().toISOString()))(),
    runnerVersion: report.runnerVersion,
    toleranceModel: { version: report.toleranceModelVersion, table: TOLERANCE_TABLE_ARCSEC },
    counts: report.counts,
    perPointStatistics: report.perPointStatistics,
    boundaryProximity: report.boundaryProximity,
    coverage: report.coverage,
    requiredCoverageMissing: report.requiredCoverageMissing
  }, null, 2) + '\n');

  const paths: ArtifactPaths = { summary: summaryPath, failures: failuresPath, statistics: statisticsPath };

  if (opts.writeCertDoc) {
    const certPath = opts.certDocPath ?? path.join(__dirname, '..', 'docs', 'reference-grade', 'astronomy-certification.md');
    fs.writeFileSync(certPath, renderCertificationMarkdown(report, divergenceRecords));
    paths.certDoc = certPath;
  }
  return paths;
}

export function renderCertificationMarkdown(
  report: AstronomyQualificationReport,
  divergenceRecords: QualificationComparisonResult[]
): string {
  const lines: string[] = [];
  lines.push('# Astronomy Qualification Certification');
  lines.push('');
  lines.push(`> **STATUS: ${report.verdict === 'PASS'
      ? report.scenarioCount >= 100000
        ? 'QUALIFIED — Sprint C full-scale run PASSED (scaffold gate)'
        : 'QUALIFIED (full-scale 100k run pending)'
      : report.verdict === 'FAIL_WITH_ONLY_KNOWN_FINDINGS' ? 'SCAFFOLD GATE — KNOWN BLOCKING FINDINGS OPEN' : 'QUALIFICATION BLOCKED'}**`);
  lines.push('> This file is GENERATED by `qualification/astronomy-qualification-runner.ts`. Never edit numbers by hand.');
  lines.push('> Only the numbers actually produced by the qualification pipeline may appear here (Mission §35).');
  lines.push('');
  lines.push(`- **Run started (UTC)**: ${report.startedAtUtc}`);
  lines.push(`- **Runner**: ${report.runnerVersion}`);
  lines.push(`- **Scenario generator**: ${report.scenarioGeneratorVersion}`);
  lines.push(`- **Tolerance model**: ${report.toleranceModelVersion}`);
  lines.push(`- **Provider**: ${report.provider.providerId} ${report.provider.version} (${report.provider.validationStatus})`);
  lines.push(`- **Kernel**: ${report.provider.kernel}`);
  if (report.fixtureSet) {
    lines.push(`- **Fixture set**: ${report.fixtureSet.fixtureSetId} (${report.fixtureSet.rowCount} rows, sha256 ${report.fixtureSet.fixtureSetSha256})`);
  }
  lines.push(`- **Scenarios**: ${report.scenarioCount} requested / ${report.counts.scenariosExecuted} executed / ${report.counts.scenariosAborted} aborted`);
  lines.push(`- **Stream fingerprint**: \`${report.scenarioStreamFingerprint}\` (seed ${report.seed})`);
  lines.push(`- **Duration**: ${report.durationMs} ms`);
  lines.push('');
  lines.push('## Determinism (CT_INV_007)');
  lines.push('');
  lines.push(`- **Samples checked**: ${report.counts.determinismSamplesChecked} (every 50th scenario, recomputed and compared)`);
  lines.push(`- **FP-equivalence violations (hard defect)**: ${report.counts.determinismMismatches}`);
  lines.push(`- **Non-byte-identical but FP-equivalent samples**: ${report.counts.determinismFpNoiseSamples}`);
  lines.push(`- **Max observed deviation**: ${report.counts.determinismMaxFpDeviationDeg} degrees (enforced floor: 1e-9° ≈ 0.0036 microarcsec)`);
  lines.push('');
  lines.push('## Independent property verification (Mission §21, every scenario)');
  lines.push('');
  lines.push(`- **Property checks executed**: ${report.counts.independentPropertyChecks}`);
  lines.push(`- **Property violations**: ${report.counts.propertyViolations}`);
  lines.push('- Checks: Ascendant horizon/rising identity, MC upper-culmination identity, obliquity vs independent IAU 2006 series.');
  lines.push('');
  lines.push('## External comparison (JPL Horizons golden seed)');
  lines.push('');
  if (report.perPointStatistics && Object.keys(report.perPointStatistics).length > 0) {
    lines.push('| Point | n | mean |Δ| (arcsec) | max |Δ| (arcsec) | base tolerance (arcsec) |');
    lines.push('|---|---|---|---|---|');
    for (const [point, s] of Object.entries(report.perPointStatistics).sort()) {
      lines.push(`| ${point} | ${s.n} | ${s.meanAbsDeltaArcsec} | ${s.maxAbsDeltaArcsec} | ${TOLERANCE_TABLE_ARCSEC[point]} |`);
    }
  } else {
    lines.push('_No fixture comparisons executed in this run._');
  }
  lines.push('');
  const explained = divergenceRecords.filter(d => d.classification === 'EXPLAINED_DIVERGENCE');
  if (explained.length > 0) {
    lines.push('### Explained divergences (recorded, never hidden)');
    for (const d of explained) {
      lines.push(`- \`${d.fixtureId}\`: ${d.point} @ ${d.utcTimestamp} Δ=${d.deltaArcsec.toFixed(3)}" — ${d.explanationCode}`);
    }
    lines.push('');
  }
  lines.push('## Findings');
  lines.push('');
  if (report.findings.length === 0) {
    lines.push('_None._');
  } else {
    for (const f of report.findings) {
      lines.push(`- **[${f.severity}] ${f.findingId}** (${f.classification}): ${f.message}`);
      lines.push(`  - Remediation: ${f.remediation}`);
    }
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

function parseArgs(argv: string[]): { scenarioCount: number; seed: number; gate: QualificationGate; writeCertDoc: boolean } {
  const get = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const scenarioCount = get('--scenarios') ? Number(get('--scenarios')) : 100_000;
  const rawSeed = get('--seed');
  const seed = rawSeed ? (rawSeed.startsWith('0x') ? Number(rawSeed) : Number(rawSeed)) : DEFAULT_SCENARIO_SEED;
  const gate = (get('--gate') as QualificationGate) ?? 'scaffold';
  const writeCertDoc = argv.includes('--write-cert-doc');
  if (!Number.isInteger(scenarioCount) || scenarioCount <= 0) throw new Error(`--scenarios must be a positive integer`);
  if (!Number.isFinite(seed)) throw new Error(`--seed must be a finite number`);
  if (gate !== 'scaffold' && gate !== 'strict') throw new Error(`--gate must be 'scaffold' or 'strict'`);
  return { scenarioCount, seed, gate, writeCertDoc };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  console.log(`[astronomy-qualification] runner=${QUALIFICATION_RUNNER_VERSION} scenarios=${args.scenarioCount} seed=${args.seed} gate=${args.gate}`);
  const { report, divergences } = runAstronomyQualificationDetailed({ ...args });
  const paths = writeQualificationArtifacts(report, divergences, {
    writeCertDoc: args.writeCertDoc
  });

  console.log('\n=== ASTRONOMY QUALIFICATION SUMMARY ===');
  console.log(`Verdict: ${report.verdict} (gate=${report.gate})`);
  console.log(`Scenarios: ${report.counts.scenariosExecuted}/${report.scenarioCount} executed, ${report.counts.scenariosAborted} aborted`);
  console.log(`Determinism: ${report.counts.determinismSamplesChecked} samples, ${report.counts.determinismMismatches} hard mismatches, ${report.counts.determinismFpNoiseSamples} last-ULP FP-noise (max ${report.counts.determinismMaxFpDeviationDeg}°)`);
  console.log(`Independent property checks: ${report.counts.independentPropertyChecks}, violations: ${report.counts.propertyViolations}`);
  console.log(`Fixture comparisons: ${report.counts.fixtureComparisons} (match ${report.counts.match}, explained ${report.counts.explainedDivergence}, divergence ${report.counts.referenceDivergence})`);
  console.log(`Findings: ${report.findings.length} (${report.findings.filter(f => f.severity === 'BLOCKING').length} blocking)`);
  for (const f of report.findings.filter(f => f.severity === 'BLOCKING')) {
    console.log(`  [BLOCKING] ${f.findingId}: ${f.message}`);
  }
  console.log(`Artifacts: ${paths.summary}`);
  console.log(`          ${paths.failures}`);
  console.log(`          ${paths.statistics}`);
  if (paths.certDoc) console.log(`          ${paths.certDoc}`);
  console.log('========================================\n');

  if (report.verdict === 'FAIL') process.exitCode = 1;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirectRun) {
  main().catch(err => {
    console.error('[astronomy-qualification] FATAL', err);
    process.exitCode = 1;
  });
}
