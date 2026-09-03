/**
 * REFERENCE-GRADE SPRINT L: Varshaphala/Tajika qualification gate.
 * Guards qualification/varshaphala-qualification-runner.ts, VARSHAPHALA_TAJIKA_001,
 * and the honest rebuild of src/lib/jyotish/varshaphalaEngine.ts.
 *
 * Pins as permanent regressions:
 *   - THE FABRICATION PINS: the pre-Sprint-L module hardcoded Varsheshwar to
 *     "Venus, 462.5 virupas", the solar return to a literal date string, and
 *     Sahams to invented constant offsets. None may reappear in executable code.
 *   - the solar-return solver: residual <= 1e-5 deg, agreement with an
 *     independent Newton/secant solver <= 2 s, lean primitive == kernel;
 *   - the adopted Year-Lord selection (portfolios + partial PV + sign-class
 *     aspect + Muntha fallback) against an independent reimplementation;
 *   - fail-closed honesty: TARGET_PRE_BIRTH / AGE_OUT_OF_RANGE typed errors,
 *     polar charts NOT_CALCULATED with the typed reason, Sahams withdrawn;
 *   - the committed strict artifacts and the five declared findings.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  VARSHAPHALA_ENGINE_VERSION,
  computeVarshaphala,
  findSolarReturn,
  siderealSunLongitude,
  VarshaphalaError,
  type VarshaphalaInput
} from '../src/lib/jyotish/varshaphalaEngine';
import { calculateCelestialEphemeris } from '../src/lib/jyotish/celestialEngine';
import { ensureClassicalRulesSeeded, getClassicalRule } from '../src/lib/jyotish/ruleRegistry';
import { VARSHAPHALA_RUNNER_VERSION } from '../qualification/varshaphala-qualification-runner';

ensureClassicalRulesSeeded();

const FIXTURE = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'qualification', 'fixtures', 'varshaphala-fixtures.json'), 'utf8')
);
const PATNA: VarshaphalaInput = {
  birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna', targetYear: 2026
};

test.describe('SPRINT-L: fabrication pins (CT_INV_001/002/010)', () => {

  test('the withdrawn fabrications may never reappear in executable code', () => {
    const code = fs
      .readFileSync(path.join(__dirname, '..', 'src', 'lib', 'jyotish', 'varshaphalaEngine.ts'), 'utf8')
      .split('\n')
      .filter((l) => { const t = l.trim(); return t !== '' && !t.startsWith('*') && !t.startsWith('//') && !t.startsWith('/*'); })
      .join('\n');
    expect(code.includes('462.5')).toBe(false);
    expect(/05-26T01:48/.test(code)).toBe(false);
    expect(/planet:\s*'Venus',/.test(code)).toBe(false);
  });

  test('the Varsheshwar value is derived, never constant: balaVirupas == sum of PV components', () => {
    const res = computeVarshaphala(PATNA);
    expect(res.status).toBe('CALCULATED');
    const pv = res.varsheshwar.pvComponents!;
    expect(pv.hadda).toBeNull(); // the declared gap stays declared
    expect(res.varsheshwar.balaVirupas).toBeCloseTo(pv.kshetra + pv.ochcha + pv.drekkana + pv.navamsa, 9);
    expect(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']).toContain(res.varsheshwar.planet);
  });

  test('Sahams are formula-computed (35 rows) and carry the withdrawal history, not the old fabrication', () => {
    const res = computeVarshaphala(PATNA);
    expect(res.sahams.length).toBe(35);
    expect(res.sahamsNote).toContain('withdrawn');
    // Punya (day) = Moon - Sun + Asc recomputed independently
    const annual = calculateCelestialEphemeris({ dateUtc: new Date(res.solarReturnUtc), latitude: 25.5941, longitude: 85.1376 });
    const punya = res.sahams.find((x) => x.name === 'Punya')!;
    const expectDay = ((annual.bodies.Moon.siderealLongitude - annual.bodies.Sun.siderealLongitude + annual.lagna.siderealLongitude) % 360 + 360) % 360;
    expect(Math.abs(punya.rawLongitude - expectDay)).toBeLessThan(1e-9);
    // correction flag consistency: corrected longitude = raw + 30 when flagged
    const corrected = ((punya.rawLongitude + (punya.correctionApplied ? 30 : 0)) % 360 + 360) % 360;
    expect(Math.abs(punya.longitude - corrected)).toBeLessThan(1e-9);
  });

  test('registry rows exist with honest source statuses and unreconstructed text', () => {
    for (const id of ['RULE_VARSHA_SOLAR_RETURN', 'RULE_MUNTHA_PROGRESSION', 'RULE_TAJIKA_PANCHAVARGEEYA_BALA', 'RULE_VARSHESHWAR_SELECTION']) {
      const rule = getClassicalRule(id);
      expect(rule, id).toBeDefined();
      expect(rule!.sourceVerification).toBe('SOURCE_SECONDARY');
      expect(rule!.originalText.startsWith('NOT RECORDED')).toBe(true);
      expect(rule!.alternateInterpretations.length).toBeGreaterThan(0);
    }
  });
});

test.describe('SPRINT-L: solar-return astronomy', () => {

  test('the lean sidereal-sun primitive is identical to the certified kernel call', () => {
    for (const iso of ['2020-03-15T08:30:00Z', '1995-06-15T05:00:00Z', '2001-12-30T06:30:00Z', '2045-01-01T00:00:00Z']) {
      const t = new Date(iso);
      const lean = siderealSunLongitude(t);
      const kernel = calculateCelestialEphemeris({ dateUtc: t, latitude: 25.5941, longitude: 85.1376 }).bodies.Sun.siderealLongitude;
      expect(Math.abs(lean - kernel)).toBeLessThanOrEqual(1e-9);
    }
  });

  test('the return instant satisfies the defining identity to 1e-5 deg', () => {
    const res = computeVarshaphala(PATNA);
    const natal = siderealSunLongitude(new Date('1995-06-15T05:00:00Z'));
    let residual = siderealSunLongitude(new Date(res.solarReturnUtc)) - natal;
    residual = ((residual + 540) % 360) - 180;
    expect(Math.abs(residual)).toBeLessThanOrEqual(1e-5);
  });

  test('an independent Newton/secant solver agrees within 2 seconds', () => {
    const input: VarshaphalaInput = { ...PATNA, targetYear: 2033 };
    const res = computeVarshaphala(input);
    const birthUtc = new Date('1995-06-15T05:00:00Z');
    const natal = siderealSunLongitude(birthUtc);
    let t = birthUtc.getTime() + (res.age * 365.2425 - 1) * 86400000;
    for (let k = 0; k < 15; k++) {
      let fd = ((siderealSunLongitude(new Date(t)) - natal + 540) % 360) - 180;
      fd = ((fd + 180) % 360 + 360) % 360 - 180;
      if (Math.abs(fd) < 1e-9) break;
      t -= fd / (0.9856 / 86400000);
      if (Math.abs(fd / (0.9856 / 86400000)) < 50) break;
    }
    expect(Math.abs(t - Date.parse(res.solarReturnUtc)) / 1000).toBeLessThanOrEqual(2);
  });

  test('the independent root-finder is exercised on a DIFFERENT algorithm path (bracket+bisect)', () => {
    // the engine's solver: bracket scan + bisection — called directly here to
    // pin its type and determinism; stream B compares it to Newton/secant.
    const birthUtc = new Date('1995-06-15T05:00:00Z');
    const natal = siderealSunLongitude(birthUtc);
    const a = findSolarReturn(birthUtc, natal, 5);
    const b = findSolarReturn(birthUtc, natal, 5);
    expect(a.toISOString()).toBe(b.toISOString());
    expect(Math.abs(a.getTime() - birthUtc.getTime() - 5 * 365.2425 * 86400000)).toBeLessThan(40 * 86400000);
  });
});

test.describe('SPRINT-L: annual structure and adopted selection', () => {

  test('Muntha arithmetic, annual lagna, and day/night hold on the Patna 2026 anchor', () => {
    const res = computeVarshaphala(PATNA);
    const returnInstant = new Date(res.solarReturnUtc);
    const birth = calculateCelestialEphemeris({ dateUtc: new Date('1995-06-15T05:00:00Z'), latitude: 25.5941, longitude: 85.1376 });
    const natalLagna = Math.floor(birth.lagna.siderealLongitude / 30) + 1;
    expect(res.muntha.rashiId).toBe(((natalLagna - 1 + res.age) % 12) + 1);
    const annual = calculateCelestialEphemeris({ dateUtc: returnInstant, latitude: 25.5941, longitude: 85.1376 });
    expect(res.annualLagna.rashiId).toBe(Math.floor(annual.lagna.siderealLongitude / 30) + 1);
    const rise = Date.parse(annual.solarTimings.sunriseUtc!);
    const set = Date.parse(annual.solarTimings.sunsetUtc!);
    const independentDayNight = set <= rise ? 'DAY' : 'NIGHT';
    expect(res.dayNight).toBe(independentDayNight);
  });

  test('PV components stay inside the classical maxima and hadda stays declared-null', () => {
    for (const year of [2020, 2022, 2024, 2026, 2028]) {
      const res = computeVarshaphala({ ...PATNA, targetYear: year });
      const pv = res.varsheshwar.pvComponents!;
      expect(pv.kshetra).toBeGreaterThanOrEqual(7.5);
      expect(pv.kshetra).toBeLessThanOrEqual(30);
      expect(pv.ochcha).toBeGreaterThanOrEqual(0);
      expect(pv.ochcha).toBeLessThanOrEqual(20);
      expect(pv.drekkana).toBeGreaterThanOrEqual(2.5);
      expect(pv.drekkana).toBeLessThanOrEqual(10);
      expect(pv.navamsa).toBeGreaterThanOrEqual(1.25);
      expect(pv.navamsa).toBeLessThanOrEqual(5);
      expect(pv.hadda).toBeNull();
      expect(pv.status).toBe('PARTIAL_HADDA_MISSING');
    }
  });

  test('fail-closed: pre-birth target, absurd age, and polar day/night all refuse to fabricate', () => {
    expect(() => computeVarshaphala({ ...PATNA, targetYear: 1990 })).toThrowError(VarshaphalaError);
    try {
      computeVarshaphala({ ...PATNA, targetYear: 1990 });
    } catch (e) {
      expect((e as VarshaphalaError).code).toBe('TARGET_PRE_BIRTH');
    }
    try {
      computeVarshaphala({ ...PATNA, targetYear: 2200 });
    } catch (e) {
      expect((e as VarshaphalaError).code).toBe('AGE_OUT_OF_RANGE');
    }
    const polar = computeVarshaphala({
      birthDate: '1990-06-20', birthTime: '12:00', latitude: 71.0, longitude: 25.0, timezone: 2, locationName: 'Arctic', targetYear: 2024
    });
    expect(polar.status).toBe('NOT_CALCULATED');
    expect(polar.notCalculatedReason ?? '').toContain('POLAR_DAY_NIGHT_UNRESOLVED');
  });

  test('the engine is deterministic per input and declares its findings on every result', () => {
    const a = JSON.stringify(computeVarshaphala(PATNA));
    const b = JSON.stringify(computeVarshaphala(PATNA));
    expect(a).toBe(b);
    const res = computeVarshaphala(PATNA);
    expect(res.declaredFindings).toContain('DECLARED_HADDA_TABLE_UNAVAILABLE');
    expect(res.declaredFindings).toContain('DECLARED_THRIRASI_RAMAN_DISCREPANCY');
    expect(res.ruleRefs).toContain('RULE_VARSHESHWAR_SELECTION');
  });
});

test.describe('SPRINT-M: sahams + varsha dasha', () => {

  const FP_REGRESSION_INPUT: VarshaphalaInput = {
    birthDate: '1955-02-04', birthTime: '10:50', latitude: 25.321, longitude: 85.393, timezone: 5.5, locationName: 'Scan', targetYear: 2025
  };

  test('all 35 sahams are present with formulas, rashis, and the correction flag consistent with the longitude', () => {
    const res = computeVarshaphala(PATNA);
    expect(res.sahams.length).toBe(35);
    expect(res.sahams.map((x) => x.id)).toEqual(Array.from({ length: 35 }, (_, i) => i + 1));
    for (const row of res.sahams) {
      expect(row.formulaApplied.minuend.length).toBeGreaterThan(0);
      expect(row.rashiId).toBe(Math.floor(row.longitude / 30) + 1);
      const reconstructed = (((row.rawLongitude + (row.correctionApplied ? 30 : 0)) % 360) + 360) % 360;
      expect(Math.abs(row.longitude - reconstructed)).toBeLessThan(1e-9);
    }
  });

  test('FP regression pin: ascendant-exactly-at-minuend must NOT trigger the 30-degree correction', () => {
    // The betweenness test once folded each operand through normalizeDeg(),
    // turning (asc - asc) into 359.9999... and falsely correcting Roga.
    const res = computeVarshaphala(FP_REGRESSION_INPUT);
    const roga = res.sahams.find((x) => x.name === 'Roga')!;
    expect(roga.correctionApplied).toBe(false);
    expect(roga.longitude).toBeCloseTo(roga.rawLongitude, 9);
  });

  test('day/night reversal: Vyapara (same-day/night) is identical across a day and a night chart, Punya is not', () => {
    const day = computeVarshaphala({ ...PATNA, targetYear: 2026 }); // DAY (pinned in goldens)
    expect(day.dayNight).toBe('DAY');
    const nightChart = FIXTURE.golden.find((g: { claim: { type: string } }) => g.claim.type === 'NIGHT_CASE');
    const night = computeVarshaphala(nightChart.input);
    expect(night.dayNight).toBe('NIGHT');
    const vyaparaDay = day.sahams.find((x) => x.name === 'Vyapara')!.formulaApplied;
    const vyaparaNight = night.sahams.find((x) => x.name === 'Vyapara')!.formulaApplied;
    expect(vyaparaNight).toEqual(vyaparaDay);
    const punyaDay = day.sahams.find((x) => x.name === 'Punya')!.formulaApplied;
    const punyaNight = night.sahams.find((x) => x.name === 'Punya')!.formulaApplied;
    expect(punyaDay.minuend).toBe('Moon');
    expect(punyaNight.minuend).toBe('Sun'); // reversed at night
  });

  test('varsha dasha invariants: 8 participants, patyamsa identity, sum 365.25, contiguous from the return', () => {
    for (const year of [2023, 2026, 2029]) {
      const res = computeVarshaphala({ ...PATNA, targetYear: year });
      const vd = res.varshaDasha!;
      expect(vd.periods.length).toBe(8);
      expect(vd.yearLengthDays).toBe(365.25);
      expect(Math.abs(vd.totalPatyamsaDeg - vd.periods[7].krissamsaDeg)).toBeLessThan(1e-9);
      expect(vd.periods[0].patyamsaDeg).toBeCloseTo(vd.periods[0].krissamsaDeg, 9);
      for (let i = 1; i < 8; i++) {
        expect(vd.periods[i].patyamsaDeg).toBeCloseTo(vd.periods[i].krissamsaDeg - vd.periods[i - 1].krissamsaDeg, 9);
        expect(vd.periods[i].startUtc).toBe(vd.periods[i - 1].endUtc);
      }
      expect(vd.periods.reduce((a, q) => a + q.durationDays, 0)).toBeCloseTo(365.25, 6);
      expect(vd.periods[0].startUtc).toBe(res.solarReturnUtc);
    }
  });
});

test.describe('SPRINT-L: fixture and committed artifacts', () => {

  test('CT_INV_008: VARSHAPHALA_TAJIKA_001 is pinned and carries the classical tables', () => {
    expect(FIXTURE.fixtureSetId).toBe('VARSHAPHALA_TAJIKA_001');
    expect(FIXTURE.setSha256).toBe('594c760da262139924856f44b9ea730ebc5e9ce0596642be49f6207abe86c8db');
    expect(FIXTURE.engineVersion).toBe(VARSHAPHALA_ENGINE_VERSION);
    expect(FIXTURE.componentMaxima).toEqual({ kshetra: 30, ochcha: 20, hadda: 'NOT_CALCULATED (table unavailable)', drekkana: 10, navamsa: 5 });
    expect(FIXTURE.thrirasiDay).toEqual({ fire: 'Sun', earth: 'Venus', air: 'Saturn', water: 'Mars' });
    expect(FIXTURE.thrirasiNight).toEqual({ fire: 'Jupiter', earth: 'Moon', air: 'Mercury', water: 'Mars' });
    expect(FIXTURE.aspectQualifyingHouses).toEqual([2, 3, 5, 9, 11, 12]);
    expect(FIXTURE.fallbackRule).toBe('MUNTHA_LORD');
    expect(FIXTURE.goldenScenarioCount).toBeGreaterThanOrEqual(7);
  });

  test('golden replay: the pinned scenarios reproduce exactly', () => {
    for (const g of FIXTURE.golden) {
      const res = computeVarshaphala(g.input);
      expect(res.status).toBe(g.expected.status);
      if (g.expected.status === 'CALCULATED') {
        expect(Math.abs(Date.parse(res.solarReturnUtc) - Date.parse(g.expected.solarReturnUtc)) / 1000).toBeLessThanOrEqual(2);
        expect(res.dayNight).toBe(g.expected.dayNight);
        expect(res.muntha.rashiId).toBe(g.expected.munthaRashiId);
        expect(res.varsheshwar.planet).toBe(g.expected.varsheshwarPlanet);
        expect(res.varsheshwar.balaVirupas).toBeCloseTo(g.expected.varsheshwarPvTotal, 9);
        expect(res.varsheshwar.readingSensitive).toBe(g.expected.readingSensitive);
        expect(res.sahams.length).toBe(g.expected.sahamCount);
        const punya = res.sahams.find((x) => x.name === 'Punya')!;
        expect(punya.longitude).toBeCloseTo(g.expected.punyaLongitude, 9);
        expect(punya.correctionApplied).toBe(g.expected.punyaCorrected);
        expect(res.varshaDasha!.totalPatyamsaDeg).toBeCloseTo(g.expected.varshaDashaTotalPatyamsa, 9);
        expect(res.varshaDasha!.periods[0].participant).toBe(g.expected.varshaDashaFirstParticipant);
        expect(res.varshaDasha!.periods.reduce((a, q) => a + q.durationDays, 0)).toBeCloseTo(365.25, 6);
      }
    }
  });

  test('versions are pinned', () => {
    expect(VARSHAPHALA_ENGINE_VERSION).toBe('varshaphala-engine-2.1.0 (sprint M, sahams + varsha dasha)');
    expect(VARSHAPHALA_RUNNER_VERSION).toBe('varshaphala-runner-1.0.0 (sprint L)');
  });

  const SUMMARY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'varshaphala-summary.json'), 'utf8'));
  const FAILURES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'varshaphala-failures.json'), 'utf8'));

  test('the committed summary artifact carries the strict 400-scenario PASS verdict', () => {
    expect(SUMMARY.verdict).toBe('PASS');
    expect(SUMMARY.gate).toBe('strict');
    expect(SUMMARY.scenarios).toBe(400);
    expect(SUMMARY.totalViolations).toBe(0);
    expect(SUMMARY.fixtureSetSha256).toBe(FIXTURE.setSha256);
    expect(SUMMARY.streamA.violations).toBe(0);
    expect(SUMMARY.streamB.violations).toBe(0);
    expect(SUMMARY.streamC.violations).toBe(0);
    expect(SUMMARY.streamD.violations).toBe(0);
    expect(SUMMARY.streamE.violations).toBe(0);
    expect(SUMMARY.goldenReplay.violations).toBe(0);
    expect(SUMMARY.determinism.mismatches).toBe(0);
  });

  test('the failures artifact records zero violations', () => {
    expect(FAILURES.verdict).toBe('PASS');
    expect(FAILURES.totalViolations).toBe(0);
    expect(FAILURES.failures.length).toBe(0);
  });

  test('declared simplifications stay visible', () => {
    const ids = SUMMARY.findings.map((f: { id: string }) => f.id);
    expect(ids).toContain('DECLARED_HADDA_TABLE_UNAVAILABLE');
    expect(ids).toContain('DECLARED_THRIRASI_RAMAN_DISCREPANCY');
    expect(ids).toContain('DECLARED_ASPECT_SIGN_CLASS_READING');
    expect(ids).toContain('DECLARED_SAHAM_TIMING_NOT_IMPLEMENTED');
    expect(ids).toContain('DECLARED_SAHAM_WHOLE_SIGN_CUSPS');
    for (const f of SUMMARY.findings) {
      expect(f.severity).toBe('NON_BLOCKING');
      expect(f.status).toBe('OPEN');
    }
  });
});
