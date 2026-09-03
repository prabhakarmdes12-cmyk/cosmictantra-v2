/**
 * REFERENCE-GRADE SPRINT F: Shadbala + Bhava Bala + Ashtakavarga qualification gate.
 * Guards qualification/bala-qualification-runner.ts and BALA_ENGINE_BENCHMARK_001.
 * Mission Sections 10-12.
 *
 * Pins as permanent regressions:
 *   - the Ashtakavarga classical totals (Sun 48 ... Saturn 39, SAV 337) — chart-independent;
 *   - the Sprint F day/night fix (RSK_014): one day/night determination per chart;
 *   - the Ekadhipatya honesty pin (RSK_015): NOT_CALCULATED, never a mislabeled copy;
 *   - Trikona Shodhana = independent group-minimum reduction.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as fixtureJson from '../qualification/fixtures/bala-fixtures.json';
import {
  DEFAULT_BALA_SEED,
  balaStreamFingerprint,
  generateBalaScenarios,
  loadBalaFixtureSet,
  runBalaQualificationDetailed
} from '../qualification/bala-qualification-runner';
import { calculateAshtakavarga } from '../src/lib/jyotish/ashtakavargaEngine';
import { calculateFullShadbala } from '../src/lib/jyotish/balaEngine';

const FIXTURE = loadBalaFixtureSet(fixtureJson);

test.describe('SPRINT-F: bala fixture set integrity', () => {

  test('CT_INV_008: the fixture set is pinned, sourced and tamper-evident', () => {
    expect(FIXTURE.fixtureSetId).toBe('BALA_ENGINE_BENCHMARK_001');
    expect(FIXTURE.classicalTables.source.status).toBe('SOURCE_SECONDARY');
    // The required-minimum Rupas stay ATTRIBUTION_UNVERIFIED — never silently upgraded
    // to a verse-verified claim.
    expect(FIXTURE.classicalTables.requiredRupas.status).toBe('ATTRIBUTION_UNVERIFIED');
    expect(FIXTURE.setSha256).toBe('afb31539bdd9444a8435c4e6b2dcb1f4b2aec7ae4436021989a0416eef417ebc');
    // classical binding totals frozen in the fixture
    expect(FIXTURE.classicalTables.ashtakavarga.bavTotals).toEqual({
      Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39
    });
    expect(FIXTURE.classicalTables.ashtakavarga.savTotal).toBe(337);
    // tamper evidence
    const tampered = JSON.parse(JSON.stringify(fixtureJson)) as typeof fixtureJson;
    tampered.classicalTables.naisargikaVirupas.Sun = 59;
    expect(() => loadBalaFixtureSet(tampered)).toThrow(/sha mismatch/);
  });

  test('the scenario stream is deterministic for a given (count, seed) — CT_INV_007', () => {
    const a = generateBalaScenarios(300, DEFAULT_BALA_SEED);
    const b = generateBalaScenarios(300, DEFAULT_BALA_SEED);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(balaStreamFingerprint(300, DEFAULT_BALA_SEED)).toBe(balaStreamFingerprint(300, DEFAULT_BALA_SEED));
    expect(balaStreamFingerprint(300, 1)).not.toBe(balaStreamFingerprint(300, 2));
  });
});

test.describe('SPRINT-F: Ashtakavarga classical identities', () => {

  test('per-planet BAV totals are chart-independent constants and SAV = 337', () => {
    // Two wildly different charts must produce identical per-planet totals.
    for (const seed of [11, 4242]) {
      const s = generateBalaScenarios(3, seed)[2];
      const lagnaRashiId = Math.floor((((s.lagnaLongitude % 360) + 360) % 360) / 30) + 1;
      const av = calculateAshtakavarga(
        Object.fromEntries(s.planets.map((p) => [p.name, { rashiId: p.rashiId }])),
        lagnaRashiId
      );
      for (const [planet, total] of Object.entries(FIXTURE.classicalTables.ashtakavarga.bavTotals)) {
        expect(av.bav[planet].reduce((x, y) => x + y, 0), `${planet} @seed ${seed}`).toBe(total);
      }
      expect(av.sav.reduce((x, y) => x + y, 0)).toBe(337);
    }
  });

  test('RSK_015: Ekadhipatya Shodhana declares NOT_CALCULATED — never a mislabeled copy', () => {
    const av = calculateAshtakavarga({ Sun: { rashiId: 10 }, Moon: { rashiId: 8 }, Mars: { rashiId: 11 }, Mercury: { rashiId: 10 }, Jupiter: { rashiId: 1 }, Venus: { rashiId: 9 }, Saturn: { rashiId: 2 } }, 4);
    expect(av.shodhana.ekadhipatyaShodhana.status).toBe('NOT_CALCULATED');
    expect(av.shodhana.ekadhipatyaShodhana.values).toBeNull();
    // Trikona stays real: every trine group reduced by its own minimum.
    const sav = av.sav;
    for (let g = 0; g < 4; g++) {
      const m = Math.min(sav[g], sav[g + 4], sav[g + 8]);
      expect(av.shodhana.trikonaShodhana[g]).toBe(sav[g] - m);
      expect(av.shodhana.trikonaShodhana[g + 4]).toBe(sav[g + 4] - m);
      expect(av.shodhana.trikonaShodhana[g + 8]).toBe(sav[g + 8] - m);
    }
  });
});

test.describe('SPRINT-F: the day/night fix (RSK_014)', () => {

  const buildChart = (sunHouse: number) => {
    const lagnaLongitude = 103.6864;
    const lagRashi = Math.floor(lagnaLongitude / 30);
    const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map((name, idx) => {
      const house = ((idx * 2 + sunHouse - 1) % 12) + 1;
      const rashiId = ((lagRashi + house - 1) % 12) + 1;
      return { name, longitude: (rashiId - 1) * 30 + 12.345, rashiId, house, isRetrograde: false, speed: 1.0 };
    });
    return { lagnaLongitude, planets };
  };

  test('a day birth scores day-strength identically for every planet', () => {
    const { lagnaLongitude, planets } = buildChart(10); // Sun in H10: day
    const shadbala = calculateFullShadbala(lagnaLongitude, planets as never, undefined);
    expect(shadbala.Sun.kala.nathonnathaBala).toBe(60);
    expect(shadbala.Jupiter.kala.nathonnathaBala).toBe(60);
    expect(shadbala.Venus.kala.nathonnathaBala).toBe(60);
    expect(shadbala.Mercury.kala.nathonnathaBala).toBe(60);
    expect(shadbala.Moon.kala.nathonnathaBala).toBe(0);
    expect(shadbala.Mars.kala.nathonnathaBala).toBe(0);
    expect(shadbala.Saturn.kala.nathonnathaBala).toBe(0);
  });

  test('a night birth scores the exact complement', () => {
    const { lagnaLongitude, planets } = buildChart(4); // Sun in H4: night
    const shadbala = calculateFullShadbala(lagnaLongitude, planets as never, undefined);
    expect(shadbala.Sun.kala.nathonnathaBala).toBe(0);
    expect(shadbala.Jupiter.kala.nathonnathaBala).toBe(0);
    expect(shadbala.Venus.kala.nathonnathaBala).toBe(0);
    expect(shadbala.Moon.kala.nathonnathaBala).toBe(60);
    expect(shadbala.Mars.kala.nathonnathaBala).toBe(60);
    expect(shadbala.Saturn.kala.nathonnathaBala).toBe(60);
    expect(shadbala.Mercury.kala.nathonnathaBala).toBe(60);
  });
});

test.describe('SPRINT-F: qualification gate', () => {

  let summary: ReturnType<typeof runBalaQualificationDetailed>['report'];

  test.beforeAll(() => {
    // Scaffold-scale gate run; the full 50k run is npm run qualify:bala.
    summary = runBalaQualificationDetailed({
      scenarios: 2000,
      gate: 'strict',
      fixtureSet: FIXTURE
    }).report;
  });

  test('verdict is PASS with zero blocking findings', () => {
    expect(summary.verdict).toBe('PASS');
    expect(summary.findings.filter((f) => f.severity === 'BLOCKING')).toEqual([]);
  });

  test('Ashtakavarga identities hold at scale with zero violations', () => {
    expect(summary.ashtakavarga.identityChecks).toBeGreaterThan(10000);
    expect(summary.ashtakavarga.violations).toBe(0);
    expect(summary.ashtakavarga.goldenRegressions).toBe(0);
  });

  test('Shadbala identities hold at scale, with chart-consistent day/night', () => {
    expect(summary.shadbala.identityChecks).toBeGreaterThan(100000);
    expect(summary.shadbala.violations).toBe(0);
    expect(summary.shadbala.dayNightChecks).toBeGreaterThan(1000);
    expect(summary.shadbala.dayNightViolations).toBe(0);
  });

  test('Bhava Bala identities hold with zero violations', () => {
    expect(summary.bhavaBala.identityChecks).toBeGreaterThan(6000);
    expect(summary.bhavaBala.violations).toBe(0);
  });

  test('declared simplifications stay visible', () => {
    const codes = summary.findings.filter((f) => f.severity === 'NON_BLOCKING').map((f) => f.code);
    expect(codes).toContain('DECLARED_EKADHIPATYA_NOT_IMPLEMENTED');
    expect(codes).toContain('DECLARED_YUDDHA_BALA_ZERO');
    expect(codes).toContain('DECLARED_VARSHAMASA_NOMINAL');
    expect(codes).toContain('DECLARED_CHESHTA_SPEED_MODEL');
    expect(codes).toContain('DECLARED_DIG_HOUSE_GRANULAR');
    expect(codes).toContain('DECLARED_REQUIRED_RUPAS_UNVERIFIED');
  });

  test('the certification artifacts exist and carry the PASS verdict', () => {
    const certPath = path.join(__dirname, '..', 'docs', 'reference-grade', 'bala-certification.md');
    expect(fs.existsSync(path.join(__dirname, '..', 'qualification', 'bala-summary.json'))).toBe(true);
    expect(fs.existsSync(certPath)).toBe(true);
    const cert = fs.readFileSync(certPath, 'utf8');
    expect(cert).toMatch(/STATUS: QUALIFIED — Sprint F full-scale run PASSED/);
    expect(cert).toContain('BALA_ENGINE_BENCHMARK_001');
    expect(cert).toContain('afb31539bdd9444a8435c4e6b2dcb1f4b2aec7ae4436021989a0416eef417ebc');
  });
});
