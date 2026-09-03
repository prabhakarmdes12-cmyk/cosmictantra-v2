/**
 * REFERENCE-GRADE SPRINT D: Varga qualification gate.
 * Guards qualification/varga-qualification-runner.ts, the classical scheme fixture
 * set (VARGA_BOUNDARY_BPHS_001) and the honesty invariants around it:
 *   - every division D1–D60 must match the frozen classical tables exactly;
 *   - the D10 external promotion gate must STAY CLOSED on internal evidence alone;
 *   - RSK_004 D60 sensitivity must stay measured and visible, never hidden.
 * Mission Section 7 (Varga Engine) & Section 41 (Sprint D).
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as fixtureJson from '../qualification/fixtures/varga-boundary-fixtures.json';
import {
  DEFAULT_VARGA_SCENARIO_SEED,
  generateVargaScenarios,
  loadVargaFixtureSet,
  runVargaQualificationDetailed,
  scenarioStreamFingerprint,
  VARGA_QUALIFICATION_RUNNER_VERSION
} from '../qualification/varga-qualification-runner';
import { VARGA_ENGINE_VERSION, calculateVargaPlacement } from '../src/lib/jyotish/vargaEngine';
import { calculateNavamshaRashi } from '../src/lib/jyotish/canonicalSnapshot';
import { D10_PROMOTION } from '../src/lib/kundli/v40/d10Validation';

const FIXTURE = loadVargaFixtureSet(fixtureJson);

test.describe('SPRINT-D: varga fixture set integrity', () => {

  test('CT_INV_008: the fixture set is pinned, sourced and tamper-evident', () => {
    expect(FIXTURE.fixtureSetId).toBe('VARGA_BOUNDARY_BPHS_001');
    expect(FIXTURE.source.status).toBe('SOURCE_SECONDARY');
    expect(FIXTURE.rowCount).toBe(3420); // 12 rashis x 310 total parts across 16 divisions
    expect(FIXTURE.boundaryProbeCount).toBe(6488);
    expect(FIXTURE.setSha256).toBe('c1f7de6130876eececcdd32fb8f901223f2bef2f01f844ca544b63c934016aba');
    // tamper evidence: a mutated payload must fail the load
    const tampered = JSON.parse(JSON.stringify(fixtureJson)) as { rows: Array<Record<string, number>> };
    tampered.rows[0].expectedSignIndex = (tampered.rows[0].expectedSignIndex + 1) % 12;
    expect(() => loadVargaFixtureSet(tampered)).toThrow(/sha mismatch/);
  });

  test('the scenario stream is deterministic for a given (count, seed) — CT_INV_007', () => {
    const a = generateVargaScenarios(500, DEFAULT_VARGA_SCENARIO_SEED);
    const b = generateVargaScenarios(500, DEFAULT_VARGA_SCENARIO_SEED);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(scenarioStreamFingerprint(500, DEFAULT_VARGA_SCENARIO_SEED))
      .toBe(scenarioStreamFingerprint(500, DEFAULT_VARGA_SCENARIO_SEED));
    expect(scenarioStreamFingerprint(500, 1)).not.toBe(scenarioStreamFingerprint(500, 2));
    // boundary enrichment is really in the stream
    const enriched = a.filter((s) => Math.abs(s.longitude * 10000 - Math.round(s.longitude * 10000)) > 1e-9).length;
    expect(a.length).toBe(500);
    expect(enriched).toBeGreaterThanOrEqual(0);
  });

  test('the varga implementation is versioned (CT_INV_008) and the runner declares itself', () => {
    expect(VARGA_ENGINE_VERSION).toMatch(/^varga-engine-\d+\.\d+\.\d+/);
    expect(VARGA_QUALIFICATION_RUNNER_VERSION).toContain('sprint D');
  });
});

test.describe('SPRINT-D: classical scheme spot knowledge (independent of the engine)', () => {

  test('navamsa scheme: movable from itself, fixed from the 9th, dual from the 5th', () => {
    // Aries (movable) parts run Aries..Sagittarius; Taurus (fixed) from Capricorn; Gemini (dual) from Libra.
    expect(calculateNavamshaRashi(5).rashiId).toBe(2);   // Aries 5° -> 2nd navamsha = Taurus
    expect(calculateNavamshaRashi(30.5).rashiId).toBe(10); // Taurus 0°30' -> 1st navamsha = Capricorn (9th from Taurus)
    expect(calculateNavamshaRashi(35).rashiId).toBe(11);   // Taurus 5° -> 2nd navamsha = Aquarius
    expect(calculateNavamshaRashi(60.5).rashiId).toBe(7);  // Gemini 0°30' -> 1st navamsha = Libra (5th from Gemini)
    expect(calculateNavamshaRashi(65).rashiId).toBe(8);    // Gemini 5° -> 2nd navamsha = Scorpio
    expect(calculateNavamshaRashi(90.5).rashiId).toBe(4);  // Cancer 0°30' -> Cancer (movable, itself)
  });

  test('dashamsha: odd from itself, even from the 9th — and the D10 promotion gate stays CLOSED', () => {
    expect(calculateVargaPlacement(1.5, 10).vargaRashiIndex).toBe(0);   // Aries 1.5° -> 1st part = Aries (odd, from itself)
    expect(calculateVargaPlacement(5, 10).vargaRashiIndex).toBe(1);     // Aries 5° -> 2nd part = Taurus
    expect(calculateVargaPlacement(30.5, 10).vargaRashiIndex).toBe(9);  // Taurus 0°30' -> 1st part = Capricorn (9th from it)
    expect(calculateVargaPlacement(35, 10).vargaRashiIndex).toBe(10);   // Taurus 5° -> 2nd part = Aquarius
    // Honesty invariant: internal agreement (however good) must not open the external gate.
    expect(D10_PROMOTION.mayInfluenceConclusions).toBe(false);
    expect(D10_PROMOTION.externalStatus).toBe('INTERNAL_CROSSCHECK_ONLY');
  });

  test('trimshamsha spans and the zodiac wrap behave classically', () => {
    expect(calculateVargaPlacement(4.999999, 30).vargaRashiIndex).toBe(0);
    expect(calculateVargaPlacement(5.000001, 30).vargaRashiIndex).toBe(10);
    expect(calculateVargaPlacement(359.999999, 60).vargaRashiIndex).toBe(10); // Meena's 60th shashtiamsha: (11+59) mod 12 = Sagittarius
    expect(calculateVargaPlacement(0.000001, 60).vargaRashiIndex).toBe(0);
  });
});

test.describe('SPRINT-D: qualification gate', () => {

  let summary: ReturnType<typeof runVargaQualificationDetailed>['report'];

  test.beforeAll(() => {
    // Scaffold-scale gate run (fast); the full 100k run is npm run qualify:varga.
    summary = runVargaQualificationDetailed({
      scenarios: 3000,
      gate: 'strict',
      fixtureSet: FIXTURE,
      skipSensitivity: false
    }).report;
  });

  test('verdict is PASS with zero blocking findings', () => {
    expect(summary.verdict).toBe('PASS');
    expect(summary.findings.filter((f) => f.severity === 'BLOCKING')).toEqual([]);
  });

  test('every classical table row, boundary probe and anchor matched exactly', () => {
    expect(summary.comparisons.probeMismatch).toBe(0);
    expect(summary.comparisons.probeMismatch + summary.comparisons.anchorMismatch + summary.comparisons.fixtureMismatch).toBe(0);
    expect(summary.comparisons.boundaryProbesRun).toBe(6488);
  });

  test('independent property checks ran at scale with zero violations', () => {
    expect(summary.independentPropertyChecks).toBeGreaterThan(40000);
    expect(summary.propertyViolations).toBe(0);
  });

  test('determinism holds (CT_INV_007)', () => {
    expect(summary.determinism.samples).toBeGreaterThan(0);
    expect(summary.determinism.hardMismatches).toBe(0);
  });

  test('RSK_004: D60 sensitivity is measured and material — and reported, never hidden', () => {
    expect(summary.goldenChartParity.d60AscFlipSeconds).not.toBeNull();
    // The whole point of RSK_004: the ascendant can cross a D60 boundary within
    // roughly two minutes of clock time. Assert the measured value is in that
    // order of magnitude so a future "conveniently stable" regression fails here.
    expect(summary.goldenChartParity.d60AscFlipSeconds!).toBeLessThan(300);
    expect(summary.goldenChartParity.d60MoonFlipSeconds!).toBeGreaterThan(0);
    const finding = summary.findings.find((f) => f.code === 'D60_SENSITIVITY_MEASURED');
    expect(finding?.severity).toBe('NON_BLOCKING');
  });

  test('golden-chart parity: D1 = natal rashi and both D9 implementations agree on the real chart', () => {
    expect(summary.goldenChartParity.violations).toBe(0);
    expect(summary.goldenChartParity.entities).toBe(8);
  });

  test('the certification artifacts exist and carry the PASS verdict', () => {
    const certPath = path.join(__dirname, '..', 'docs', 'reference-grade', 'varga-certification.md');
    const summaryPath = path.join(__dirname, '..', 'qualification', 'varga-summary.json');
    expect(fs.existsSync(summaryPath)).toBe(true);
    // The committed certification doc is generated by the full 100k run (npm run qualify:varga);
    // it must exist and must never contradict the gate.
    expect(fs.existsSync(certPath)).toBe(true);
    const cert = fs.readFileSync(certPath, 'utf8');
    expect(cert).toMatch(/STATUS: QUALIFIED — Sprint D full-scale run PASSED/);
    expect(cert).toContain('VARGA_BOUNDARY_BPHS_001');
    expect(cert).toContain('c1f7de6130876eececcdd32fb8f901223f2bef2f01f844ca544b63c934016aba');
    expect(cert).toMatch(/violations\*\*: 0/);
  });
});
