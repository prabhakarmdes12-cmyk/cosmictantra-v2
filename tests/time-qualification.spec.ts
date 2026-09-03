/**
 * REFERENCE-GRADE SPRINT E: Vimshottari + Panchanga qualification gate.
 * Guards qualification/time-qualification-runner.ts and the frozen benchmark
 * fixture set TIME_ENGINE_BENCHMARK_001. Mission Sections 6 & 8.
 *
 * Also pins the Sprint E host-timezone fixes as permanent regressions:
 *   - panchang solar instants (sunrise/sunset/Rahu windows) and civil-day/weekday
 *     derivation must be IDENTICAL on any host timezone (they once shifted by
 *     the whole UTC offset — "Usha Kala" on a UTC server vs "Rahu Kalam" on IST);
 *   - dasha display strings must be identical on any host timezone.
 */
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as fixtureJson from '../qualification/fixtures/time-fixtures.json';
import {
  DEFAULT_TIME_SEED,
  generateDashaScenarios,
  generatePanchangaScenarios,
  loadTimeFixtureSet,
  runTimeQualificationDetailed,
  timeStreamFingerprint
} from '../qualification/time-qualification-runner';
import { calculateVimshottariDasha } from '../src/lib/dashaEngine.js';
import { calculatePanchang } from '../src/lib/panchang.js';

const FIXTURE = loadTimeFixtureSet(fixtureJson);

test.describe('SPRINT-E: time fixture set integrity', () => {

  test('CT_INV_008: the benchmark set is pinned, sourced and tamper-evident', () => {
    expect(FIXTURE.fixtureSetId).toBe('TIME_ENGINE_BENCHMARK_001');
    expect(FIXTURE.classicalTables.source.status).toBe('SOURCE_SECONDARY');
    expect(FIXTURE.setSha256).toBe('a67f731912b93535b80da397dae5b0f35e697b1296404dd63a8f641a71a180e2');
    // Vimshottari classical constants are self-consistent
    const years = Object.values(FIXTURE.classicalTables.vimshottari.years);
    expect(years.reduce((a, b) => a + b, 0)).toBe(120);
    expect(FIXTURE.classicalTables.vimshottari.yearLengthDays).toBe(365.25);
    // all 27 nakshatras present, lords cycle classically
    expect(FIXTURE.classicalTables.nakshatraStartLords.length).toBe(27);
    const cycle = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
    FIXTURE.classicalTables.nakshatraStartLords.forEach((n, i) => {
      expect(n.lord).toBe(cycle[i % 9]);
    });
    // tamper evidence
    const tampered = JSON.parse(JSON.stringify(fixtureJson)) as typeof fixtureJson;
    tampered.goldenCharts[0].moonSiderealLongitude += 0.001;
    expect(() => loadTimeFixtureSet(tampered)).toThrow(/sha mismatch/);
  });

  test('scenario streams are deterministic for a given (count, seed) — CT_INV_007', () => {
    const a = generateDashaScenarios(400, DEFAULT_TIME_SEED);
    const b = generateDashaScenarios(400, DEFAULT_TIME_SEED);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(timeStreamFingerprint(400, 10, DEFAULT_TIME_SEED)).toBe(timeStreamFingerprint(400, 10, DEFAULT_TIME_SEED));
    expect(timeStreamFingerprint(400, 10, 1)).not.toBe(timeStreamFingerprint(400, 10, 2));
    const p = generatePanchangaScenarios(12, DEFAULT_TIME_SEED);
    expect(p.length).toBe(12);
    const t = Date.parse(p[0].instant);
    expect(t).toBeGreaterThanOrEqual(Date.parse('2025-07-01T00:00:00Z'));
    expect(t).toBeLessThanOrEqual(Date.parse('2027-07-02T00:00:00Z'));
  });
});

test.describe('SPRINT-E: classical spot knowledge (independent of the engine)', () => {

  test('Vimshottari: nakshatra determines the starting lord across the zodiac', () => {
    // Ashwini (0-13°20') starts Ketu; Bharani starts Venus; Krittika starts Sun...
    const cycle = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
    for (let k = 0; k < 27; k++) {
      const moonLon = k * (360 / 27) + 1.5; // 1.5° inside nakshatra k
      const d = calculateVimshottariDasha(moonLon, '1990-08-17', new Date('1990-08-17T00:00:00.000Z')) as { mahadashas: Array<{ lord: string }> };
      expect(d.mahadashas[0].lord, `nakshatra ${k + 1}`).toBe(cycle[k % 9]);
    }
  });

  test('Vimshottari: balance at birth and the 120-year span', () => {
    // Moon 1.5° into Ashwini: 1.5/13.3333 consumed => balance = 7 * (1 - 0.1125) = 6.2 years of Ketu
    const d = calculateVimshottariDasha(1.5, '1990-08-17', new Date('1990-08-17T00:00:00.000Z')) as { startingBalance: string; mahadashas: Array<{ startDate: string; endDate: string }> };
    expect(d.startingBalance).toMatch(/^6\.2 yrs of Ketu$/);
    const spanDays = (Date.parse(`${d.mahadashas[8].endDate}T00:00:00.000Z`) - Date.parse(`${d.mahadashas[0].startDate}T00:00:00.000Z`)) / 86400000;
    const expected = 120 * 365.25 - (1.5 / (360 / 27)) * 7 * 365.25;
    expect(Math.abs(spanDays - expected)).toBeLessThan(2);
  });

  test('Panchanga: karana fixed ends and muhurta factors are classical', () => {
    expect(FIXTURE.classicalTables.panchanga.fixedKaranas['0']).toBe('Kintughna');
    expect(FIXTURE.classicalTables.panchanga.fixedKaranas['57']).toBe('Shakuni');
    expect(FIXTURE.classicalTables.panchanga.fixedKaranas['58']).toBe('Chatushpada');
    expect(FIXTURE.classicalTables.panchanga.fixedKaranas['59']).toBe('Naga');
    const rahuByVara = FIXTURE.classicalTables.panchanga.muhurtaFactors.map((f) => f.rahu);
    expect(rahuByVara).toEqual([8, 2, 7, 5, 6, 4, 3]); // Sunday..Saturday
    const yamaByVara = FIXTURE.classicalTables.panchanga.muhurtaFactors.map((f) => f.yamaganda);
    expect(yamaByVara).toEqual([5, 4, 3, 2, 1, 7, 6]);
    const gulikaByVara = FIXTURE.classicalTables.panchanga.muhurtaFactors.map((f) => f.gulika);
    expect(gulikaByVara).toEqual([7, 6, 5, 4, 3, 2, 1]);
  });
});

test.describe('SPRINT-E: HOST-TIMEZONE regression (the Sprint E defect)', () => {

  const repoRoot = path.join(__dirname, '..');
  const probeSource = `
import { calculatePanchang } from '${repoRoot}/src/lib/panchang.js';
import { calculateVimshottariDasha } from '${repoRoot}/src/lib/dashaEngine.js';
const p = calculatePanchang(new Date('2026-03-20T06:00:00Z'), { lat: 25.3176, lng: 82.9739, tz: 5.5, name: 'Varanasi' });
const d = calculateVimshottariDasha(268.865469, '1995-06-15', new Date('1995-06-15T00:00:00.000Z'));
console.log(JSON.stringify({
  sunrise: p.sun.sunriseDate.toISOString(),
  sunset: p.sun.sunsetDate.toISOString(),
  rahuStart: p.timings.rahuStart.toISOString(),
  currentPeriod: p.currentPeriod,
  sunriseStr: p.sun.sunrise,
  rahuStr: p.timings.rahuKalam,
  civilDate: p.date,
  pdFormatted: d.mahadashas[0].antardashas[0].pratyantardashas[5].startFormatted,
  mdEndISO: d.mahadashas[0].endDate
}));
`;

  test('panchang instants, periods and dasha display strings are identical on a UTC host and an IST host', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tzprobe-'));
    const probeFile = path.join(dir, 'probe.ts');
    fs.writeFileSync(probeFile, probeSource);
    try {
      const run = (tz: string) => execSync(`npx tsx ${probeFile}`, {
        env: { ...process.env, TZ: tz },
        encoding: 'utf8',
        cwd: repoRoot
      }).trim();
      const utc = JSON.parse(run('Etc/UTC'));
      const ist = JSON.parse(run('Asia/Kolkata'));
      // The defect this pins: sunrise used to be 06:04Z on a UTC host but 00:34Z on IST.
      expect(utc.sunrise).toBe(ist.sunrise);
      expect(utc.sunset).toBe(ist.sunset);
      expect(utc.rahuStart).toBe(ist.rahuStart);
      expect(utc.currentPeriod).toBe(ist.currentPeriod);
      expect(utc.civilDate).toBe(ist.civilDate);
      // Display strings: target-wall rendering, host-independent.
      expect(utc.sunriseStr).toBe(ist.sunriseStr);
      expect(utc.rahuStr).toBe(ist.rahuStr);
      expect(utc.pdFormatted).toBe(ist.pdFormatted);
      // The instant itself must be physically right: Varanasi sunrise ~00:34 UTC that day.
      expect(utc.sunrise).toMatch(/^2026-03-20T00:3/);
      expect(utc.currentPeriod).toBe('Rahu Kalam (Inauspicious — Avoid New Beginnings)');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

test.describe('SPRINT-E: qualification gate', () => {

  let summary: ReturnType<typeof runTimeQualificationDetailed>['report'];

  test.beforeAll(() => {
    // Scaffold-scale gate run; the full 100k run is npm run qualify:time.
    summary = runTimeQualificationDetailed({
      scenarios: 2000,
      panchangaScenarios: 16,
      gate: 'strict',
      fixtureSet: FIXTURE
    }).report;
  });

  test('verdict is PASS with zero blocking findings', () => {
    expect(summary.verdict).toBe('PASS');
    expect(summary.findings.filter((f) => f.severity === 'BLOCKING')).toEqual([]);
  });

  test('Vimshottari: independent re-implementation matched every boundary', () => {
    expect(summary.vimshottari.scenarios).toBeGreaterThan(1000);
    expect(summary.vimshottari.boundaryMismatches).toBe(0);
    expect(summary.vimshottari.propertyViolations).toBe(0);
    expect(summary.vimshottari.goldenRegressions).toBe(0);
    expect(summary.vimshottari.determinismMismatches).toBe(0);
  });

  test('Panchanga: limbs matched, transitions solved, progress identity holds', () => {
    expect(summary.panchanga.limbMismatches).toBe(0);
    expect(summary.panchanga.transitionsSolved).toBeGreaterThan(30);
    expect(summary.panchanga.progressViolations).toBe(0);
    expect(summary.panchanga.muhurtaViolations).toBe(0);
    expect(summary.panchanga.goldenRegressions).toBe(0);
  });

  test('solar timings stay inside the declared tolerance vs the certified kernel', () => {
    expect(summary.panchanga.sunriseToleranceBreaches).toBe(0);
    expect(summary.panchanga.sunriseMaxDeltaMin).toBeLessThan(5);
  });

  test('declared gaps stay visible: Purnimanta + Hora/Choghadiya', () => {
    const codes = summary.findings.filter((f) => f.severity === 'NON_BLOCKING').map((f) => f.code);
    expect(codes).toContain('DECLARED_GAP_PURNIMANTA');
    expect(codes).toContain('DECLARED_GAP_HORA_CHOGHADIYA');
    expect(codes).toContain('SUNRISE_APPROXIMATION_STATS');
  });

  test('the certification artifacts exist and carry the PASS verdict', () => {
    const certPath = path.join(__dirname, '..', 'docs', 'reference-grade', 'time-certification.md');
    expect(fs.existsSync(path.join(__dirname, '..', 'qualification', 'time-summary.json'))).toBe(true);
    expect(fs.existsSync(certPath)).toBe(true);
    const cert = fs.readFileSync(certPath, 'utf8');
    expect(cert).toMatch(/STATUS: QUALIFIED — Sprint E full-scale run PASSED/);
    expect(cert).toContain('TIME_ENGINE_BENCHMARK_001');
    expect(cert).toContain('a67f731912b93535b80da397dae5b0f35e697b1296404dd63a8f641a71a180e2');
  });
});
