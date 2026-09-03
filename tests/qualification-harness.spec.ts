/**
 * REFERENCE-GRADE SPRINT B: 100,000-scenario qualification harness scaffold.
 * Guards qualification/scenarioGenerator.ts, qualification/toleranceModel.ts and
 * qualification/astronomy-qualification-runner.ts.
 * Mission Section 5 (deterministic harness, explicit tolerances, fail-closed verdicts).
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as fixturesJson from '../qualification/fixtures/astronomy-golden-fixtures.json';
import {
  DEFAULT_SCENARIO_SEED,
  DST_CORNER_INSTANTS,
  FRACTIONAL_TZ_OFFSETS_HOURS,
  INDIA_ANCHORS,
  REQUIRED_COVERAGE_TAGS,
  generateAstronomyScenarios,
  scenarioStreamFingerprint
} from '../qualification/scenarioGenerator';
import {
  EXPLAINED_DIVERGENCE_BANDS,
  TOLERANCE_TABLE_ARCSEC,
  arcsecDelta,
  classifyComparison
} from '../qualification/toleranceModel';
import {
  DECLARED_AYANAMSHA_J2000_DEG,
  runAstronomyQualificationDetailed,
  writeQualificationArtifacts
} from '../qualification/astronomy-qualification-runner';

test.describe('SPRINT-B: scenario generator determinism & coverage', () => {

  test('CT_INV_007: the scenario stream is byte-stable for a given (count, seed)', () => {
    const a = generateAstronomyScenarios(400, DEFAULT_SCENARIO_SEED);
    const b = generateAstronomyScenarios(400, DEFAULT_SCENARIO_SEED);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(scenarioStreamFingerprint(400, DEFAULT_SCENARIO_SEED)).toBe(scenarioStreamFingerprint(400, DEFAULT_SCENARIO_SEED));
  });

  test('different seeds produce different streams; ids are stable within a stream', () => {
    expect(scenarioStreamFingerprint(400, 1)).not.toBe(scenarioStreamFingerprint(400, 2));
    const stream = generateAstronomyScenarios(50, DEFAULT_SCENARIO_SEED);
    const ids = new Set(stream.map(s => s.scenarioId));
    expect(ids.size).toBe(50);
  });

  test('every scenario lies inside the certified 1900–2100 period with sane coordinates', () => {
    const start = Date.parse('1900-01-01T00:00:00.000Z');
    const end = Date.parse('2100-12-31T23:59:59.999Z');
    for (const s of generateAstronomyScenarios(600, DEFAULT_SCENARIO_SEED)) {
      const t = Date.parse(s.utcTimestamp);
      expect(t).toBeGreaterThanOrEqual(start);
      expect(t).toBeLessThanOrEqual(end);
      expect(Math.abs(s.latitudeDeg)).toBeLessThanOrEqual(70.1);
      expect(Math.abs(s.longitudeDeg)).toBeLessThanOrEqual(180);
    }
  });

  test('a 1000-scenario block covers every Mission §5 dimension', () => {
    const stream = generateAstronomyScenarios(1000, DEFAULT_SCENARIO_SEED);
    const tags = new Set(stream.flatMap(s => s.coverageTags));
    for (const required of REQUIRED_COVERAGE_TAGS) {
      expect(tags.has(required), `missing coverage tag ${required}`).toBe(true);
    }
    // India-specific scenarios use canonical anchors and IST-domain longitudes.
    const india = stream.filter(s => s.basis === 'TARGETED_INDIA_SPECIFIC');
    expect(india.length).toBeGreaterThan(50);
    const anchorNames = new Set(INDIA_ANCHORS.map(a => a.name));
    expect(stream.filter(s => s.note && anchorNames.has(s.note)).length).toBe(india.length);
    // Fractional timezones actually appear (e.g. +5:30 IST, +5:45 Nepal, −9:30 Marquesas).
    expect(FRACTIONAL_TZ_OFFSETS_HOURS).toContain(5.5);
    expect(FRACTIONAL_TZ_OFFSETS_HOURS).toContain(5.75);
    expect(DST_CORNER_INSTANTS.length).toBeGreaterThanOrEqual(6);
  });
});

test.describe('SPRINT-B: tolerance model', () => {

  test('explicit tolerances match the gap-analysis values (arcseconds, no rounding masks)', () => {
    expect(TOLERANCE_TABLE_ARCSEC.Sun).toBe(36);
    expect(TOLERANCE_TABLE_ARCSEC.Moon).toBe(36);
    for (const p of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) {
      expect(TOLERANCE_TABLE_ARCSEC[p]).toBe(72);
    }
    expect(TOLERANCE_TABLE_ARCSEC.Rahu).toBe(180);
    expect(TOLERANCE_TABLE_ARCSEC.Ketu).toBe(180);
    expect(EXPLAINED_DIVERGENCE_BANDS[0].explanationCode).toBe('DELTAT_EXTRAPOLATION_BEYOND_2050');
  });

  test('classification: match / explained divergence / hard divergence', () => {
    // Well within tolerance.
    expect(classifyComparison({ point: 'Sun', utcTimestamp: '2000-01-01T12:00:00.000Z', deltaArcsec: 5.4 }).classification).toBe('MATCH');
    // Above base but inside the post-2050 Moon ΔT band (36 * 3 = 108).
    expect(classifyComparison({ point: 'Moon', utcTimestamp: '2100-01-01T12:00:00.000Z', deltaArcsec: 78.41 }).classification).toBe('EXPLAINED_DIVERGENCE');
    // Same magnitude BEFORE the band period is a hard divergence.
    expect(classifyComparison({ point: 'Moon', utcTimestamp: '2000-01-01T12:00:00.000Z', deltaArcsec: 78.41 }).classification).toBe('REFERENCE_DIVERGENCE');
    // Inside the band but beyond the multiplied tolerance is still hard.
    expect(classifyComparison({ point: 'Moon', utcTimestamp: '2100-01-01T12:00:00.000Z', deltaArcsec: 200 }).classification).toBe('REFERENCE_DIVERGENCE');
    // A planet above 72" is always hard (band applies to Moon only).
    expect(classifyComparison({ point: 'Mars', utcTimestamp: '2100-01-01T12:00:00.000Z', deltaArcsec: 80 }).classification).toBe('REFERENCE_DIVERGENCE');
  });

  test('signed shortest-arc deltas wrap correctly (never ±360 artefacts)', () => {
    expect(arcsecDelta(359.9999, 0.0001)).toBeCloseTo(0.72, 6);
    expect(arcsecDelta(0.5, 359.75)).toBeCloseTo(-2700, 6);
    expect(arcsecDelta(10, 10)).toBe(0);
  });
});

test.describe('SPRINT-B: qualification runner end-to-end', () => {

  test('Sprint C gate: full pipeline PASSES — ayanamsha reconciled, MC computed, properties verified', () => {
    const { report, divergences } = runAstronomyQualificationDetailed({
      scenarioCount: 1000,
      seed: DEFAULT_SCENARIO_SEED,
      gate: 'scaffold',
      fixtureSetRaw: fixturesJson
    });

    expect(report.scenarioCount).toBe(1000);
    expect(report.counts.scenariosExecuted).toBe(1000);
    expect(report.counts.scenariosAborted).toBe(0);
    expect(report.counts.invariantViolations).toBe(0);
    expect(report.counts.determinismMismatches).toBe(0);
    expect(report.counts.determinismSamplesChecked).toBeGreaterThan(0);
    expect(report.requiredCoverageMissing).toEqual([]);

    // 189-row JPL/analytic corpus (21 epochs x 9 points): all within tolerance except the
    // recorded, explained post-2050 Moon ΔT cases. Zero unexplained divergences.
    expect(report.counts.fixtureComparisons).toBe(189);
    expect(report.counts.referenceDivergence).toBe(0);
    expect(report.counts.explainedDivergence).toBe(4);
    expect(report.counts.match).toBe(185);
    const explained = divergences.filter(d => d.classification === 'EXPLAINED_DIVERGENCE');
    for (const d of explained) {
      expect(d.point).toBe('Moon');
      expect(d.explanationCode).toBe('DELTAT_EXTRAPOLATION_BEYOND_2050');
      expect(Number(d.utcTimestamp.slice(0, 4))).toBeGreaterThan(2050);
    }

    // External agreement floor pinned to measured values (21-epoch worst cases).
    expect(report.perPointStatistics!['Sun'].maxAbsDeltaArcsec).toBeLessThan(36);
    for (const p of ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']) {
      expect(report.perPointStatistics![p].maxAbsDeltaArcsec).toBeLessThan(72);
    }

    // Independent property verification ran on every scenario with zero violations.
    expect(report.counts.independentPropertyChecks).toBeGreaterThanOrEqual(3000);
    expect(report.counts.propertyViolations).toBe(0);

    // Ayanamsha conforms to the declared registry standard (RSK_009 reconciled in v2.0.0).
    expect(DECLARED_AYANAMSHA_J2000_DEG).toBeCloseTo(23.8530555555, 9);

    // ZERO blocking findings — the two Sprint B blockers were resolved by versioned changes.
    const blocking = report.findings.filter(f => f.severity === 'BLOCKING');
    expect(blocking.map(f => f.findingId)).toEqual([]);
    expect(report.verdict).toBe('PASS');
    expect(report.ok).toBe(true);
  });

  test('strict gate also passes with zero blocking findings (fail closed doctrine holds)', () => {
    const { report } = runAstronomyQualificationDetailed({
      scenarioCount: 1000,
      gate: 'strict',
      fixtureSetRaw: fixturesJson
    });
    expect(report.verdict).toBe('PASS');
    expect(report.ok).toBe(true);
  });

  test('artifacts: summary, failures and statistics files are written with the required schemas', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aq-artifacts-'));
    try {
      const { report, divergences } = runAstronomyQualificationDetailed({
        scenarioCount: 1000,
        gate: 'scaffold',
        fixtureSetRaw: fixturesJson
      });
      const paths = writeQualificationArtifacts(report, divergences, {
        artifactDir: tmp,
        nowUtc: () => '2026-09-03T00:00:00.000Z'
      });
      expect(fs.existsSync(paths.summary)).toBe(true);
      expect(fs.existsSync(paths.failures)).toBe(true);
      expect(fs.existsSync(paths.statistics)).toBe(true);

      const summary = JSON.parse(fs.readFileSync(paths.summary, 'utf8'));
      for (const key of ['runnerVersion', 'scenarioGeneratorVersion', 'toleranceModelVersion', 'provider', 'scenarioStreamFingerprint', 'counts', 'findings', 'coverage']) {
        expect(summary[key]).toBeDefined();
      }
      const failures = JSON.parse(fs.readFileSync(paths.failures, 'utf8'));
      expect(failures.total).toBe(189);
      expect(failures.divergences.length).toBe(189);
      for (const d of failures.divergences) {
        expect(['MATCH', 'EXPLAINED_DIVERGENCE', 'REFERENCE_DIVERGENCE', 'WITHIN_TOLERANCE', 'NOT_CALCULATED']).toContain(d.classification);
        expect(Number.isFinite(d.deltaArcsec)).toBe(true);
      }
      const stats = JSON.parse(fs.readFileSync(paths.statistics, 'utf8'));
      expect(stats.toleranceModel.table).toEqual(TOLERANCE_TABLE_ARCSEC);
      expect(stats.coverage.length).toBeGreaterThanOrEqual(REQUIRED_COVERAGE_TAGS.length);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('boundary-aware tagging observes sign and nakshatra boundary neighbourhoods', () => {
    const { report } = runAstronomyQualificationDetailed({
      scenarioCount: 1000,
      gate: 'scaffold',
      fixtureSetRaw: fixturesJson
    });
    expect(report.boundaryProximity.signBoundaryScenarios).toBeGreaterThan(0);
    expect(report.boundaryProximity.nakshatraBoundaryScenarios).toBeGreaterThan(0);
  });
});
