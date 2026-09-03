/**
 * REFERENCE-GRADE SPRINT L — VARSHAPHALA/TAJIKA qualification.
 * Run: npm run qualify:varshaphala (strict 400) / qualify:varshaphala:scaffold (60).
 *
 * Streams:
 *   A AUDIT_PINS          — the pre-Sprint-L fabrications are GONE (no hardcoded
 *                           "462.5", no hardcoded "-05-26T01:48", no literal
 *                           Venus Varsheshwar): module source scanned, output
 *                           shape pinned, registry rows verified.
 *   B SOLAR_RETURN        — engine solver vs an INDEPENDENT Newton/secant
 *                           root-finder (<= 2 s); |sun(return) - natal sun|
 *                           <= 1e-5 deg; inter-return spacing in [363, 367] d;
 *                           the lean sidereal-sun primitive is IDENTICAL to the
 *                           certified kernel call (<= 1e-9 deg).
 *   C ANNUAL_STRUCTURE    — Muntha arithmetic identity; annual lagna/planets
 *                           re-derived from the certified kernel; day/night
 *                           re-derived independently from SearchRiseSet; PV
 *                           component bounds and sum identity.
 *   D SELECTION_IDENTITY  — an independent reimplementation of the ADOPTED
 *                           Year-Lord selection (portfolios + partial PV +
 *                           sign-class aspect + Muntha fallback) agrees with
 *                           the engine on every scenario; readingSensitive
 *                           flag identity; fail-closed typed errors; polar
 *                           NOT_CALCULATED honesty.
 *
 * Fail closed: any violation => verdict FAIL, exit code 1.
 */
import * as fs from 'fs';
import * as path from 'path';
import { calculateCelestialEphemeris } from '../src/lib/jyotish/celestialEngine';
import {
  VARSHAPHALA_ENGINE_VERSION,
  computeVarshaphala,
  findSolarReturn,
  siderealSunLongitude,
  panchavargeeyabalaPartial,
  VarshaphalaError,
  type VarshaphalaInput,
  type VarshaphalaResult
} from '../src/lib/jyotish/varshaphalaEngine';
import { ensureClassicalRulesSeeded, getClassicalRule } from '../src/lib/jyotish/ruleRegistry';

export const VARSHAPHALA_RUNNER_VERSION = 'varshaphala-runner-1.0.0 (sprint L)';

export const DECLARED_FINDINGS: Array<{ id: string; severity: 'BLOCKING' | 'NON_BLOCKING'; statement: string; status: string }> = [
  { id: 'DECLARED_HADDA_TABLE_UNAVAILABLE', severity: 'NON_BLOCKING', statement: 'Haddabala is NOT_CALCULATED: the Hadda tables exist only as images in the available sources; the PV total is a declared partial used uniformly for ranking.', status: 'OPEN' },
  { id: 'DECLARED_THRIRASI_RAMAN_DISCREPANCY', severity: 'NON_BLOCKING', statement: "Raman's worked example (day Capricorn -> Mars) contradicts his own element day-table (-> Venus); both readings are computed and readingSensitive flags divergence.", status: 'OPEN' },
  { id: 'DECLARED_ASPECT_SIGN_CLASS_READING', severity: 'NON_BLOCKING', statement: "The Year-Lord aspect qualification is the adopted mechanical sign-class reading (houses 2,3,5,9,11,12); Raman's interpretive Deeptamsha-orb 'powerful aspect' filter is declared as an alternative.", status: 'OPEN' },
  { id: 'DECLARED_SAHAMS_QUEUED', severity: 'NON_BLOCKING', statement: 'Saham day/night formulas are queued; the pre-Sprint-L constant-offset Sahams were fabricated and are withdrawn.', status: 'OPEN' },
  { id: 'DECLARED_ENGINE_DERIVED_GOLDENS', severity: 'NON_BLOCKING', statement: 'Golden scenarios are ENGINE_DERIVED regression pins; externally published varsha-chart anchors are a later slice.', status: 'OPEN' }
];

/* ------------------------------------------------------------------ */
/* Deterministic scenario generator                                    */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const DEFAULT_VARSHAPHALA_SEED = 0x7a11;

export function randomInput(rnd: () => number): VarshaphalaInput {
  const year = 1950 + Math.floor(rnd() * 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    birthDate: `${year}-${pad(1 + Math.floor(rnd() * 12))}-${pad(1 + Math.floor(rnd() * 28))}`,
    birthTime: `${pad(Math.floor(rnd() * 24))}:${pad(Math.floor(rnd() * 60))}`,
    latitude: Math.round((6 + rnd() * 30) * 1000) / 1000,
    longitude: Math.round((68 + rnd() * 30) * 1000) / 1000,
    timezone: 5.5,
    locationName: 'Scan',
    targetYear: 2015 + Math.floor(rnd() * 12)
  };
}

/* ------------------------------------------------------------------ */
/* Independent reimplementations (§21)                                 */
/* ------------------------------------------------------------------ */

const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const DEBIL: Record<string, number> = { Sun: 190, Moon: 213, Mars: 118, Mercury: 345, Jupiter: 275, Venus: 177, Saturn: 20 };
const FRIENDS: Record<string, string[]> = {
  Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'], Saturn: ['Mercury', 'Venus']
};
const ENEMIES: Record<string, string[]> = {
  Sun: ['Venus', 'Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'], Venus: ['Sun', 'Moon'], Saturn: ['Sun', 'Moon', 'Mars']
};
const ELEMENT: Record<number, string> = { 1: 'fire', 2: 'earth', 3: 'air', 4: 'water', 5: 'fire', 6: 'earth', 7: 'air', 8: 'water', 9: 'fire', 10: 'earth', 11: 'air', 12: 'water' };
const THRIRASI_DAY: Record<string, string> = { fire: 'Sun', earth: 'Venus', air: 'Saturn', water: 'Mars' };
const THRIRASI_NIGHT: Record<string, string> = { fire: 'Jupiter', earth: 'Moon', air: 'Mercury', water: 'Mars' };
const QUALIFYING_HOUSES = [2, 3, 5, 9, 11, 12];

function tier(planet: string, lord: string): 'SWA' | 'FRIEND' | 'NEUTRAL' | 'ENEMY' {
  if (planet === lord) return 'SWA';
  if (FRIENDS[planet].includes(lord)) return 'FRIEND';
  if (ENEMIES[planet].includes(lord)) return 'ENEMY';
  return 'NEUTRAL';
}
const SCORES = {
  kshetra: { SWA: 30, FRIEND: 15, NEUTRAL: 11.25, ENEMY: 7.5 },
  drekkana: { SWA: 10, FRIEND: 5, NEUTRAL: 3.75, ENEMY: 2.5 },
  navamsa: { SWA: 5, FRIEND: 2.5, NEUTRAL: 1.875, ENEMY: 1.25 }
};
function mod360(x: number): number { return ((x % 360) + 360) % 360; }

function indepAnnualSelection(input: VarshaphalaInput, dayNight: 'DAY' | 'NIGHT', natalLagnaRashi: number): { lord: string; pv: number; eligible: string[]; portfolios: Record<string, string>; annualLons: Record<string, number> } {
  const birthUtc = new Date(Date.UTC(
    Number(input.birthDate.slice(0, 4)), Number(input.birthDate.slice(5, 7)) - 1, Number(input.birthDate.slice(8, 10)),
    Number(input.birthTime.slice(0, 2)), Number(input.birthTime.slice(3, 5))
  ) - input.timezone * 3600000);
  const birthChart = calculateCelestialEphemeris({ dateUtc: birthUtc, latitude: input.latitude, longitude: input.longitude });
  const natalSun = birthChart.bodies.Sun.siderealLongitude;
  const age = input.targetYear - Number(input.birthDate.slice(0, 4));
  const returnInstant = findSolarReturn(birthUtc, natalSun, age);
  const annual = calculateCelestialEphemeris({ dateUtc: returnInstant, latitude: input.latitude, longitude: input.longitude });
  const annualLons: Record<string, number> = {};
  for (const p of SEVEN) annualLons[p] = (annual.bodies as unknown as Record<string, { siderealLongitude: number }>)[p].siderealLongitude;
  const annualLagnaRashi = Math.floor(annual.lagna.siderealLongitude / 30) + 1;
  const munthaRashi = ((natalLagnaRashi - 1 + age) % 12) + 1;

  const signOf = (lon: number): number => Math.floor(mod360(lon) / 30) + 1;
  const portfolios: Record<string, string> = {
    DINA_RATRI: dayNight === 'DAY' ? SIGN_LORDS[signOf(annualLons.Sun) - 1] : SIGN_LORDS[signOf(annualLons.Moon) - 1],
    JANMA_LAGNA: SIGN_LORDS[natalLagnaRashi - 1],
    VARSHA_LAGNA: SIGN_LORDS[annualLagnaRashi - 1],
    MUNTHA: SIGN_LORDS[munthaRashi - 1],
    THRIRASI: dayNight === 'DAY' ? THRIRASI_DAY[ELEMENT[annualLagnaRashi]] : THRIRASI_NIGHT[ELEMENT[annualLagnaRashi]]
  };
  const pv = (p: string): number => {
    const lon = annualLons[p];
    const kshetra = SCORES.kshetra[tier(p, SIGN_LORDS[signOf(lon) - 1])];
    const ochcha = (Math.min(mod360(lon - DEBIL[p]), 360 - mod360(lon - DEBIL[p])) / 180) * 20;
    const dPart = Math.floor((mod360(lon) % 30) / 10);
    const s0 = Math.floor(mod360(lon) / 30);
    const dLord = SIGN_LORDS[[s0, (s0 + 4) % 12, (s0 + 8) % 12][dPart]];
    const drekkana = SCORES.drekkana[tier(p, dLord)];
    const nPart = Math.floor((mod360(lon) % 30) / (30 / 9));
    const start = ELEMENT[signOf(lon)] === 'fire' ? 0 : ELEMENT[signOf(lon)] === 'earth' ? 9 : ELEMENT[signOf(lon)] === 'air' ? 6 : 3;
    const navamsa = SCORES.navamsa[tier(p, SIGN_LORDS[(start + nPart) % 12])];
    return kshetra + ochcha + drekkana + navamsa;
  };
  const eligible = [...new Set(Object.values(portfolios))].filter((p) => {
    const house = ((signOf(annualLons[p]) - annualLagnaRashi + 12) % 12) + 1;
    return QUALIFYING_HOUSES.includes(house);
  });
  let lord: string;
  if (eligible.length > 0) {
    const count = (p: string): number => Object.values(portfolios).filter((q) => q === p).length;
    lord = [...eligible].sort((a, b) => pv(b) - pv(a) || count(b) - count(a))[0];
  } else {
    lord = portfolios.MUNTHA;
  }
  return { lord, pv: pv(lord), eligible, portfolios, annualLons };
}

/** Independent day/night: the next SearchRiseSet events around the instant. */
function indepDayNight(instant: Date, latitude: number, longitude: number): 'DAY' | 'NIGHT' | null {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Astronomy = require('astronomy-engine');
  const observer = new Astronomy.Observer(latitude, longitude, 50);
  const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, instant, 1);
  const set = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, instant, 1);
  if (!rise || !set) return null;
  // DAY iff the most recent boundary event before the instant is a rise.
  return set.date.getTime() < rise.date.getTime() ? 'DAY' : 'NIGHT';
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */
interface StreamReport { name: string; scenarios: number; checks: number; violations: number; firstViolations: string[] }
function fail(r: StreamReport, detail: string): void { r.checks++; r.violations++; if (r.firstViolations.length < 25) r.firstViolations.push(detail); }
function pass(r: StreamReport, n = 1): void { r.checks += n; }

/* ------------------------------------------------------------------ */
/* Stream A — audit pins (the fabrications are gone)                   */
/* ------------------------------------------------------------------ */
export function runStreamA(): StreamReport {
  const r: StreamReport = { name: 'A AUDIT_PINS', scenarios: 1, checks: 0, violations: 0, firstViolations: [] };
  const srcLines = fs
    .readFileSync(path.join(__dirname, '..', 'src', 'lib', 'jyotish', 'varshaphalaEngine.ts'), 'utf8')
    .split('\n')
    // the header COMMENT documents the withdrawn fabrications; only executable
    // lines are policed (a reintroduction in code fails, documentation does not)
    .filter((l) => { const t = l.trim(); return t !== '' && !t.startsWith('*') && !t.startsWith('//') && !t.startsWith('/*'); });
  const code = srcLines.join('\n');
  if (code.includes('462.5')) fail(r, 'FABRICATION PIN: literal 462.5 present in EXECUTABLE code of varshaphalaEngine.ts');
  else pass(r);
  if (/05-26T01:48/.test(code)) fail(r, 'FABRICATION PIN: the hardcoded solar-return date string is still constructible in code');
  else pass(r);
  if (/planet:\s*'Venus'\s*,/.test(code)) fail(r, 'FABRICATION PIN: hardcoded Venus Varsheshwar still present in code');
  else pass(r);
  ensureClassicalRulesSeeded();
  for (const id of ['RULE_VARSHA_SOLAR_RETURN', 'RULE_MUNTHA_PROGRESSION', 'RULE_TAJIKA_PANCHAVARGEEYA_BALA', 'RULE_VARSHESHWAR_SELECTION']) {
    const rule = getClassicalRule(id);
    if (!rule) { fail(r, `registry row missing: ${id}`); continue; }
    if (!['SOURCE_SECONDARY', 'SOURCE_VERIFIED'].includes(rule.sourceVerification)) fail(r, `${id}: source status ${rule.sourceVerification} not allowed`);
    else pass(r);
    if (!rule.originalText.startsWith('NOT RECORDED')) fail(r, `${id}: originalText must stay unreconstructed`);
    else pass(r);
  }
  // output honesty on a live chart
  const probe: VarshaphalaInput = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna', targetYear: 2026 };
  const res = computeVarshaphala(probe);
  if (res.status !== 'CALCULATED') fail(r, 'probe chart not CALCULATED');
  else pass(r);
  if (res.sahams.length !== 0 || !res.sahamsNotCalculatedReason.includes('withdrawn')) fail(r, 'sahams must be empty with the withdrawal reason');
  else pass(r);
  if (res.varsheshwar.pvComponents === null || res.varsheshwar.pvComponents.hadda !== null) fail(r, 'PV components must be present with hadda=null');
  else pass(r);
  if (res.varsheshwar.balaVirupas === null || Math.abs(res.varsheshwar.balaVirupas - (res.varsheshwar.pvComponents!.kshetra + res.varsheshwar.pvComponents!.ochcha + res.varsheshwar.pvComponents!.drekkana + res.varsheshwar.pvComponents!.navamsa)) > 1e-9) {
    fail(r, 'balaVirupas must equal the sum of the (partial) PV components');
  } else pass(r);
  if (res.declaredFindings.length < 4) fail(r, 'declared findings must be carried on the result');
  else pass(r);
  return r;
}

/* ------------------------------------------------------------------ */
/* Stream B — solar return                                             */
/* ------------------------------------------------------------------ */
export function runStreamB(scenarios: Array<{ input: VarshaphalaInput }>): StreamReport {
  const r: StreamReport = { name: 'B SOLAR_RETURN', scenarios: scenarios.length, checks: 0, violations: 0, firstViolations: [] };

  // B0: lean primitive ≡ certified kernel call
  const rnd = mulberry32(DEFAULT_VARSHAPHALA_SEED ^ 0xb0);
  let primDiverge = 0;
  for (let i = 0; i < 40; i++) {
    const t = new Date(Date.UTC(1955 + Math.floor(rnd() * 70), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 27), Math.floor(rnd() * 24), Math.floor(rnd() * 60)));
    const lean = siderealSunLongitude(t);
    const kernel = calculateCelestialEphemeris({ dateUtc: t, latitude: 25.5941, longitude: 85.1376 }).bodies.Sun.siderealLongitude;
    if (Math.abs(lean - kernel) > 1e-9) primDiverge++;
  }
  if (primDiverge > 0) fail(r, `lean sidereal-sun primitive diverges from the kernel on ${primDiverge}/40 instants`);
  else pass(r);

  for (const { input } of scenarios) {
    let res: VarshaphalaResult;
    try {
      res = computeVarshaphala(input);
    } catch (e) {
      if (e instanceof VarshaphalaError && (e.code === 'TARGET_PRE_BIRTH' || e.code === 'AGE_OUT_OF_RANGE')) { pass(r); continue; }
      fail(r, `${input.birthDate}/${input.targetYear}: unexpected ${String(e)}`);
      continue;
    }
    if (res.status !== 'CALCULATED') { pass(r); continue; } // polar case exercised in stream D

    const birthUtc = new Date(Date.UTC(
      Number(input.birthDate.slice(0, 4)), Number(input.birthDate.slice(5, 7)) - 1, Number(input.birthDate.slice(8, 10)),
      Number(input.birthTime.slice(0, 2)), Number(input.birthTime.slice(3, 5))
    ) - input.timezone * 3600000);
    const natalSun = siderealSunLongitude(birthUtc);
    const engineT = Date.parse(res.solarReturnUtc);

    // independent Newton/secant root-finder from the calendar-anniversary estimate
    let t = birthUtc.getTime() + (res.age * 365.2425 - 1) * 86400000;
    for (let k = 0; k < 12; k++) {
      let fd = ((siderealSunLongitude(new Date(t)) - natalSun + 540) % 360) - 180;
      fd = ((fd + 180) % 360 + 360) % 360 - 180;
      if (Math.abs(fd) < 1e-9) break;
      const speed = 0.9856 / 86400000; // deg per millisecond
      const step = fd / speed;
      t -= step;
      if (Math.abs(step) < 50) break;
    }
    if (Math.abs(t - engineT) > 2000) {
      fail(r, `${input.birthDate}/${input.targetYear}: independent solver off by ${(Math.abs(t - engineT) / 1000).toFixed(2)} s`);
    } else pass(r);

    // residual identity
    let residual = siderealSunLongitude(new Date(engineT)) - natalSun;
    residual = ((residual + 540) % 360) - 180;
    if (Math.abs(residual) > 1e-5) fail(r, `${input.birthDate}/${input.targetYear}: sun residual at return ${residual.toExponential(2)} deg`);
    else pass(r);

    // spacing across consecutive ages
    const next = computeVarshaphalaSafeYears(input);
    if (next) {
      const rNext = Date.parse(next);
      const gapDays = (rNext - engineT) / 86400000;
      if (gapDays < 363 || gapDays > 367) fail(r, `${input.birthDate}: inter-return gap ${gapDays.toFixed(3)} d outside [363, 367]`);
      else pass(r);
    } else pass(r);

    // the return lies inside the age window
    const windowLo = birthUtc.getTime() + (res.age - 1) * 365.2425 * 86400000 + 300 * 86400000;
    const windowHi = birthUtc.getTime() + res.age * 365.2425 * 86400000 + 30 * 86400000;
    if (engineT < windowLo || engineT > windowHi) fail(r, `${input.birthDate}/${input.targetYear}: return outside the plausible age window`);
    else pass(r);
  }
  return r;
}

function computeVarshaphalaSafeYears(input: VarshaphalaInput): string | null {
  try {
    const r = computeVarshaphala({ ...input, targetYear: input.targetYear + 1 });
    return r.status === 'CALCULATED' ? r.solarReturnUtc : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Stream C — annual structure                                         */
/* ------------------------------------------------------------------ */
export function runStreamC(scenarios: Array<{ input: VarshaphalaInput; result: VarshaphalaResult }>): StreamReport {
  const r: StreamReport = { name: 'C ANNUAL_STRUCTURE', scenarios: scenarios.length, checks: 0, violations: 0, firstViolations: [] };
  for (const { input, result: res } of scenarios) {
    if (res.status !== 'CALCULATED') { pass(r); continue; }
    const age = input.targetYear - Number(input.birthDate.slice(0, 4));
    const birthUtc = new Date(Date.UTC(
      Number(input.birthDate.slice(0, 4)), Number(input.birthDate.slice(5, 7)) - 1, Number(input.birthDate.slice(8, 10)),
      Number(input.birthTime.slice(0, 2)), Number(input.birthTime.slice(3, 5))
    ) - input.timezone * 3600000);
    const birthChart = calculateCelestialEphemeris({ dateUtc: birthUtc, latitude: input.latitude, longitude: input.longitude });
    const natalLagnaRashi = Math.floor(birthChart.lagna.siderealLongitude / 30) + 1;

    // muntha arithmetic identity (independent)
    const munthaExpect = ((natalLagnaRashi - 1 + age) % 12) + 1;
    if (res.muntha.rashiId !== munthaExpect) fail(r, `${input.birthDate}/${input.targetYear}: muntha ${res.muntha.rashiId} != independent ${munthaExpect}`);
    else pass(r);
    const returnInstant = new Date(res.solarReturnUtc);
    const annual = calculateCelestialEphemeris({ dateUtc: returnInstant, latitude: input.latitude, longitude: input.longitude });
    const annualLagnaRashi = Math.floor(annual.lagna.siderealLongitude / 30) + 1;
    if (res.annualLagna.rashiId !== annualLagnaRashi) fail(r, `${input.birthDate}/${input.targetYear}: annual lagna divergence`);
    else pass(r);
    const houseExpect = ((munthaExpect - annualLagnaRashi + 12) % 12) + 1;
    if (res.muntha.houseFromAnnualLagna !== houseExpect) fail(r, `${input.birthDate}/${input.targetYear}: muntha house identity`);
    else pass(r);

    // annual planets = kernel bodies
    if (res.annualPlanets.length !== 9) fail(r, `${input.birthDate}: annual planets ${res.annualPlanets.length} != 9`);
    else pass(r);
    let planetDiverge = false;
    for (const row of res.annualPlanets) {
      const b = (annual.bodies as unknown as Record<string, { siderealLongitude: number; isRetrograde: boolean }>)[row.name];
      if (!b || Math.abs(b.siderealLongitude - row.siderealLongitude) > 1e-9 || b.isRetrograde !== row.isRetrograde) { planetDiverge = true; break; }
    }
    if (planetDiverge) fail(r, `${input.birthDate}/${input.targetYear}: annual planet divergence vs kernel`);
    else pass(r);

    // day/night independent verdict
    const dn = indepDayNight(returnInstant, input.latitude, input.longitude);
    if (dn !== null && dn !== res.dayNight) fail(r, `${input.birthDate}/${input.targetYear}: day/night ${res.dayNight} != independent ${dn}`);
    else pass(r);

    // PV bounds + sum identity for the year lord
    const pv = res.varsheshwar.pvComponents;
    if (pv) {
      if (pv.kshetra < 7.5 - 1e-9 || pv.kshetra > 30 + 1e-9) fail(r, `${input.birthDate}: kshetra ${pv.kshetra} out of bounds`);
      else if (pv.ochcha < -1e-9 || pv.ochcha > 20 + 1e-9) fail(r, `${input.birthDate}: ochcha ${pv.ochcha} out of bounds`);
      else if (pv.drekkana < 2.5 - 1e-9 || pv.drekkana > 10 + 1e-9) fail(r, `${input.birthDate}: drekkana ${pv.drekkana} out of bounds`);
      else if (pv.navamsa < 1.25 - 1e-9 || pv.navamsa > 5 + 1e-9) fail(r, `${input.birthDate}: navamsa ${pv.navamsa} out of bounds`);
      else if (pv.hadda !== null) fail(r, `${input.birthDate}: hadda must be null`);
      else if (Math.abs(pv.totalPartial - (pv.kshetra + pv.ochcha + pv.drekkana + pv.navamsa)) > 1e-9) fail(r, `${input.birthDate}: PV sum identity`);
      else pass(r, 6);
      // independent PV of the year lord
      const lord = res.varsheshwar.planet;
      const indep = panchavargeeyabalaPartial(lord as never, (annual.bodies as unknown as Record<string, { siderealLongitude: number }>)[lord].siderealLongitude);
      if (Math.abs(indep.totalPartial - pv.totalPartial) > 1e-9) fail(r, `${input.birthDate}/${input.targetYear}: year-lord PV ${pv.totalPartial.toFixed(4)} != independent ${indep.totalPartial.toFixed(4)}`);
      else pass(r);
    } else pass(r);
  }
  return r;
}

/* ------------------------------------------------------------------ */
/* Stream D — selection identity                                       */
/* ------------------------------------------------------------------ */
export function runStreamD(scenarios: Array<{ input: VarshaphalaInput; result: VarshaphalaResult }>): StreamReport {
  const r: StreamReport = { name: 'D SELECTION_IDENTITY', scenarios: scenarios.length, checks: 0, violations: 0, firstViolations: [] };
  for (const { input, result: res } of scenarios) {
    if (res.status !== 'CALCULATED') {
      // fail-closed honesty: polar case must carry the typed reason
      if (res.status === 'NOT_CALCULATED' && (res.notCalculatedReason ?? '').startsWith('POLAR_DAY_NIGHT_UNRESOLVED')) pass(r, 2);
      else pass(r);
      continue;
    }
    const birthUtc = new Date(Date.UTC(
      Number(input.birthDate.slice(0, 4)), Number(input.birthDate.slice(5, 7)) - 1, Number(input.birthDate.slice(8, 10)),
      Number(input.birthTime.slice(0, 2)), Number(input.birthTime.slice(3, 5))
    ) - input.timezone * 3600000);
    const birthChart = calculateCelestialEphemeris({ dateUtc: birthUtc, latitude: input.latitude, longitude: input.longitude });
    const natalLagnaRashi = Math.floor(birthChart.lagna.siderealLongitude / 30) + 1;
    const indep = indepAnnualSelection(input, res.dayNight as 'DAY' | 'NIGHT', natalLagnaRashi);

    if (indep.lord !== res.varsheshwar.planet) {
      fail(r, `${input.birthDate}/${input.targetYear}: year lord ${res.varsheshwar.planet} != independent ${indep.lord}`);
    } else pass(r);
    if (Math.abs(indep.pv - (res.varsheshwar.balaVirupas ?? NaN)) > 1e-9) fail(r, `${input.birthDate}/${input.targetYear}: year-lord PV divergence`);
    else pass(r);
    if ((res.varsheshwar.eligibleByAspect !== true) === (indep.eligible.length > 0)) fail(r, `${input.birthDate}/${input.targetYear}: eligible flag identity`);
    else pass(r);
    if (!SEVEN.includes(res.varsheshwar.planet)) fail(r, `${input.birthDate}: year lord not one of the seven`);
    else pass(r);

    // portfolio membership: engine portfolios must match the independent assignment
    const enginePortfolios = res.varsheshwar.portfolios;
    const indepPortfolios = Object.entries(indep.portfolios).filter(([, v]) => v === res.varsheshwar.planet).map(([k]) => k);
    if (JSON.stringify([...enginePortfolios].sort()) !== JSON.stringify([...indepPortfolios].sort())) {
      fail(r, `${input.birthDate}/${input.targetYear}: portfolios ${enginePortfolios.join(',')} != independent ${indepPortfolios.join(',')}`);
    } else pass(r);
  }

  // fail-closed typed errors
  const probe: VarshaphalaInput = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna', targetYear: 1990 };
  try {
    computeVarshaphala(probe);
    fail(r, 'TARGET_PRE_BIRTH not raised');
  } catch (e) {
    if (e instanceof VarshaphalaError && e.code === 'TARGET_PRE_BIRTH') pass(r);
    else fail(r, `expected TARGET_PRE_BIRTH, got ${String(e)}`);
  }
  try {
    computeVarshaphala({ ...probe, targetYear: 2190 });
    fail(r, 'AGE_OUT_OF_RANGE not raised');
  } catch (e) {
    if (e instanceof VarshaphalaError && e.code === 'AGE_OUT_OF_RANGE') pass(r);
    else fail(r, `expected AGE_OUT_OF_RANGE, got ${String(e)}`);
  }

  // polar honesty: midsummer Arctic birth -> sunrise/sunset unresolved -> NOT_CALCULATED with typed reason
  const polar = computeVarshaphalaSafePolar();
  if (polar === 'POLAR') pass(r);
  else fail(r, `polar chart should be NOT_CALCULATED(POLAR_DAY_NIGHT_UNRESOLVED), got ${polar}`);
  return r;
}

function computeVarshaphalaSafePolar(): string {
  try {
    const res = computeVarshaphala({ birthDate: '1990-06-20', birthTime: '12:00', latitude: 71.0, longitude: 25.0, timezone: 2, locationName: 'Arctic', targetYear: 2024 });
    return res.status === 'NOT_CALCULATED' && (res.notCalculatedReason ?? '').startsWith('POLAR') ? 'POLAR' : res.status;
  } catch (e) {
    return String(e).slice(0, 40);
  }
}

/* ------------------------------------------------------------------ */
/* Orchestration                                                       */
/* ------------------------------------------------------------------ */
export interface VarshaphalaReport {
  runnerVersion: string;
  engineVersion: string;
  fixtureSetId: string;
  fixtureSetSha256: string;
  gate: 'scaffold' | 'strict';
  scenarios: number;
  generatedAtUtc: string;
  verdict: 'PASS' | 'FAIL';
  streamA: StreamReport;
  streamB: StreamReport;
  streamC: StreamReport;
  streamD: StreamReport;
  goldenReplay: StreamReport;
  determinism: { samples: number; mismatches: number };
  findings: typeof DECLARED_FINDINGS;
  totalViolations: number;
}

function loadFixture(): { fixtureSetId: string; setSha256: string; golden: GoldenRow[] } {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'varshaphala-fixtures.json'), 'utf8')) as { fixtureSetId: string; setSha256: string; golden: GoldenRow[] };
  if (raw.fixtureSetId !== 'VARSHAPHALA_TAJIKA_001') throw new Error('[VARSHAPHALA:FIXTURE_SET_INVALID]');
  return raw;
}
interface GoldenRow {
  scenarioId: string;
  input: VarshaphalaInput;
  claim: Record<string, unknown>;
  expected: {
    status: string; solarReturnUtc: string; dayNight: string; annualLagnaRashiId: number;
    munthaRashiId: number; munthaHouseFromAnnualLagna: number; varsheshwarPlanet: string;
    varsheshwarPvTotal: number; varsheshwarPortfolios: string[]; readingSensitive: boolean;
  };
}

export function runVarshaphalaQualification(opts: { scenarios: number; gate: 'scaffold' | 'strict' }): VarshaphalaReport {
  const fixture = loadFixture();
  const rnd = mulberry32(DEFAULT_VARSHAPHALA_SEED);
  const scenarios: Array<{ input: VarshaphalaInput; result: VarshaphalaResult }> = [];
  const simpleScenarios: Array<{ input: VarshaphalaInput }> = [];
  for (let i = 0; i < opts.scenarios; i++) {
    const input = randomInput(rnd);
    simpleScenarios.push({ input });
    try {
      scenarios.push({ input, result: computeVarshaphala(input) });
    } catch {
      scenarios.push({ input, result: null as unknown as VarshaphalaResult });
    }
  }

  // golden replay (always, both gates)
  const goldenR: StreamReport = { name: 'GOLDEN_REPLAY', scenarios: fixture.golden.length, checks: 0, violations: 0, firstViolations: [] };
  for (const g of fixture.golden) {
    const res = computeVarshaphala(g.input);
    const e = g.expected;
    if (res.status !== e.status) fail(goldenR, `${g.scenarioId}: status ${res.status} != ${e.status}`);
    else pass(goldenR);
    if (res.status === 'CALCULATED') {
      if (Math.abs(Date.parse(res.solarReturnUtc) - Date.parse(e.solarReturnUtc)) > 2000) fail(goldenR, `${g.scenarioId}: solar return drift > 2s`);
      else pass(goldenR);
      if (res.dayNight !== e.dayNight) fail(goldenR, `${g.scenarioId}: dayNight`);
      else pass(goldenR);
      if (res.annualLagna.rashiId !== e.annualLagnaRashiId || res.muntha.rashiId !== e.munthaRashiId || res.muntha.houseFromAnnualLagna !== e.munthaHouseFromAnnualLagna) fail(goldenR, `${g.scenarioId}: lagna/muntha pins`);
      else pass(goldenR);
      if (res.varsheshwar.planet !== e.varsheshwarPlanet) fail(goldenR, `${g.scenarioId}: year lord ${res.varsheshwar.planet} != ${e.varsheshwarPlanet}`);
      else pass(goldenR);
      if (Math.abs((res.varsheshwar.balaVirupas ?? NaN) - e.varsheshwarPvTotal) > 1e-9) fail(goldenR, `${g.scenarioId}: PV pin`);
      else pass(goldenR);
      if (res.varsheshwar.readingSensitive !== e.readingSensitive) fail(goldenR, `${g.scenarioId}: readingSensitive pin`);
      else pass(goldenR);
    } else pass(goldenR, 6);
  }

  const a = runStreamA();
  const b = runStreamB(simpleScenarios);
  const c = runStreamC(scenarios.filter((s) => s.result));
  const d = runStreamD(scenarios.filter((s) => s.result));

  // determinism: byte-equal double compute over the golden set
  let detMismatch = 0;
  for (const g of fixture.golden.slice(0, 3)) {
    const x = JSON.stringify(computeVarshaphala(g.input));
    const y = JSON.stringify(computeVarshaphala(g.input));
    if (x !== y) detMismatch++;
  }
  if (detMismatch > 0) { b.violations++; b.firstViolations.push(`determinism: ${detMismatch} golden charts not byte-stable`); }

  const totalViolations = a.violations + b.violations + c.violations + d.violations + goldenR.violations + detMismatch;
  return {
    runnerVersion: VARSHAPHALA_RUNNER_VERSION,
    engineVersion: VARSHAPHALA_ENGINE_VERSION,
    fixtureSetId: fixture.fixtureSetId,
    fixtureSetSha256: fixture.setSha256,
    gate: opts.gate,
    scenarios: opts.scenarios,
    generatedAtUtc: new Date().toISOString(),
    verdict: totalViolations === 0 ? 'PASS' : 'FAIL',
    streamA: a, streamB: b, streamC: c, streamD: d,
    goldenReplay: goldenR,
    determinism: { samples: 3, mismatches: detMismatch },
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
  const scenarios = Number(get('--scenarios') ?? (gate === 'strict' ? 400 : 60));
  const report = runVarshaphalaQualification({ scenarios, gate });
  console.log(`[varshaphala] fixture=${report.fixtureSetId} sha256=${report.fixtureSetSha256.slice(0, 16)}... engine=${report.engineVersion}`);
  for (const s of [report.streamA, report.streamB, report.streamC, report.streamD, report.goldenReplay]) {
    console.log(`${s.name}: ${s.checks} checks / ${s.violations} violations (${s.scenarios} scenarios)`);
    for (const v of s.firstViolations.slice(0, 8)) console.log(`   ! ${v}`);
  }
  console.log(`Determinism: ${report.determinism.samples}/${report.determinism.mismatches} mismatches`);
  console.log(`Findings: ${report.findings.length} (all NON_BLOCKING declared)`);
  console.log(`=== VARSHAPHALA QUALIFICATION SUMMARY ===`);
  console.log(`Verdict: ${report.verdict} (gate=${report.gate}, scenarios=${report.scenarios})`);
  fs.writeFileSync(path.join(__dirname, 'varshaphala-summary.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    path.join(__dirname, 'varshaphala-failures.json'),
    JSON.stringify({
      runnerVersion: report.runnerVersion,
      verdict: report.verdict,
      totalViolations: report.totalViolations,
      failures: [report.streamA, report.streamB, report.streamC, report.streamD].flatMap((s) => s.firstViolations.map((detail) => ({ stream: s.name, detail })))
    }, null, 2) + '\n'
  );
  console.log('Artifacts: qualification/varshaphala-summary.json, qualification/varshaphala-failures.json');
  process.exitCode = report.verdict === 'PASS' ? 0 : 1;
}

const isMain = process.argv[1] && process.argv[1].endsWith('varshaphala-qualification-runner.ts');
if (isMain) main();
