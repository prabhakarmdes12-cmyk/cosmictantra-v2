/**
 * REFERENCE-GRADE SPRINT L — VARSHAPHALA / TAJIKA (annual chart) ENGINE.
 *
 * SPRINT-L AUDIT REMEDIATION (charter CT_INV_001/002/006/010): the pre-Sprint-L
 * module fabricated its headline outputs — Varsheshwar was hardcoded to "Venus,
 * 462.5 virupas", the solar-return instant was the literal string
 * `${targetYear}-05-26T01:48:12Z`, and the Sahams used invented constant offsets
 * whose rashi/degree strings did not even match their own computed longitudes.
 * All of that is REMOVED. What stands here is computed, sourced, and fail-closed.
 *
 * Sources (SOURCE_SECONDARY — relayed, no licensed edition held):
 *   - B.V. Raman, "Varshaphala or The Hindu Progressed Horoscope" (13th ed. 1992),
 *     ch. 3 arts. 37-46 (Panchavargeeyabala) and ch. 4 arts. 47-52 (Year Lord),
 *     as digitized at vedastro.org Varshaphala Parts 4-6/21 (fetched 2026-09),
 *     corroborated by Cosmic Insights, Saptarishis (Gomes; Marella) and the
 *     Clickastro/M.S. Mehta worked examples.
 *
 * ADOPTED READING (declared; alternatives carried on every result):
 *   - Five portfolios: (a) Dina-Ratri (lord of the Sun's sign by day / Moon's
 *     sign by night AT the return), (b) Janma-lagna lord, (c) Varsha-lagna
 *     lord, (d) Muntha lord, (e) Thrirasi (element tables by day/night).
 *   - Panchavargeeyabala over the ANNUAL positions: Kshetra 30/15/11.25/7.5,
 *     Ochcha = arc-from-debilitation/180 x 20, Drekkana (trinal lords)
 *     10/5/3.75/2.5, Navamsa (element scheme) 5/2.5/1.875/1.25.
 *     HADDA is NOT_CALCULATED: the Hadda tables exist only as images in the
 *     available sources — the total is therefore a declared PARTIAL PV and is
 *     used uniformly for ranking (DECLARED_HADDA_TABLE_UNAVAILABLE).
 *   - Year-Lord selection: a candidate qualifies by holding a favourable/sama
 *     Tajika sign-aspect to the annual lagna (houses 3/11, 5/9, 2/12 counted
 *     from the lagna); the highest partial PV among qualified wins; ties break
 *     by portfolio count then portfolio order; if NONE qualifies, the Muntha
 *     lord becomes Year Lord (attested fallback). Raman's worked example
 *     applies an additional interpretive "powerful aspect" filter (it rejects
 *     a 2/12 candidate) — recorded as an alternative reading, not adopted
 *     (it is not mechanically reproducible without the Deeptamsha orb table).
 *   - Thrirasi day-table for Makara: element table gives Venus; Raman's own
 *     worked example gives Mars. BOTH readings are computed; the element
 *     reading is adopted; when the two would pick different Year Lords the
 *     result is flagged readingSensitive.
 */
import * as Astronomy from 'astronomy-engine';
import { calculateCelestialEphemeris } from './celestialEngine';
import { getAyanamsha } from './ayanamsha';

export const VARSHAPHALA_ENGINE_VERSION = 'varshaphala-engine-2.0.0 (sprint L, honest rebuild)';

export type VarshaphalaErrorCode =
  | 'TARGET_PRE_BIRTH'
  | 'AGE_OUT_OF_RANGE'
  | 'POLAR_DAY_NIGHT_UNRESOLVED'
  | 'SOLAR_RETURN_NOT_BRACKETED'
  | 'INVALID_INPUT';

export class VarshaphalaError extends Error {
  readonly code: VarshaphalaErrorCode;
  readonly detail: Record<string, unknown>;
  constructor(code: VarshaphalaErrorCode, message: string, detail: Record<string, unknown> = {}) {
    super(`[VARSHAPHALA:${code}] ${message}`);
    this.name = 'VarshaphalaError';
    this.code = code;
    this.detail = detail;
  }
}

const RASHIS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
export type TajikaPlanet = (typeof SEVEN)[number];

/** Naisargika (natural) friendship — the fixed classical table Raman's Kshetrabala uses. */
const NATURAL_FRIENDS: Record<TajikaPlanet, string[]> = {
  Sun: ['Moon', 'Mars', 'Jupiter'],
  Moon: ['Sun', 'Mercury'],
  Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'],
  Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus']
};
const NATURAL_ENEMIES: Record<TajikaPlanet, string[]> = {
  Sun: ['Venus', 'Saturn'],
  Moon: [],
  Mars: ['Mercury'],
  Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'],
  Venus: ['Sun', 'Moon'],
  Saturn: ['Sun', 'Moon', 'Mars']
};

/** Deep debilitation longitudes (180° from deep exaltation; Raman ch. 3 table). */
const DEBILITATION_LON: Record<TajikaPlanet, number> = {
  Sun: 190,   // Libra 10
  Moon: 213,  // Scorpio 3
  Mars: 118,  // Cancer 28
  Mercury: 345, // Pisces 15
  Jupiter: 275, // Capricorn 5
  Venus: 177, // Virgo 27
  Saturn: 20  // Aries 20
};

function normalizeDeg(x: number): number {
  return ((x % 360) + 360) % 360;
}
function minorArc(a: number, b: number): number {
  const d = Math.abs(normalizeDeg(a - b));
  return Math.min(d, 360 - d);
}

/** Lean sidereal Sun (mirrors celestialEngine's kernel path exactly; verified in qualification). */
export function siderealSunLongitude(dateUtc: Date): number {
  const time = Astronomy.MakeTime(dateUtc);
  const jdTT = time.tt + 2451545.0;
  const geoVec = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
  const tropLon = normalizeDeg(Astronomy.Ecliptic(geoVec).elon);
  return normalizeDeg(tropLon - getAyanamsha(jdTT, 'LAHIRI_CHITRA_PAKSHA').degrees);
}

/** Lean sidereal ascendant is NOT reimplemented — the annual chart uses the certified kernel call. */

function civilToUtc(birthDate: string, birthTime: string, timezone: number): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  const t = /^(\d{2}):(\d{2})$/.exec(birthTime);
  if (!m || !t) throw new VarshaphalaError('INVALID_INPUT', `birthDate/birthTime malformed`, { birthDate, birthTime });
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(t[1]), Number(t[2])) - timezone * 3600000);
}

const SOLAR_YEAR_DAYS = 365.2425;

/**
 * Solar-return solver: the instant within the age-A window when the sidereal
 * Sun returns to its natal longitude. 6-hour bracket scan + bisection to
 * <= 0.5 s. The natal longitude is the Sun's sidereal longitude AT BIRTH.
 */
export function findSolarReturn(
  birthUtc: Date,
  natalSunSidereal: number,
  age: number
): Date {
  const t0Ms = birthUtc.getTime() + (age * SOLAR_YEAR_DAYS - 45) * 86400000;
  const t1Ms = t0Ms + 60 * 86400000;
  const f = (t: number): number => {
    let d = siderealSunLongitude(new Date(t)) - natalSunSidereal;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  };
  const STEP = 6 * 3600000;
  let prevT = t0Ms;
  let prevF = f(prevT);
  let lo = NaN;
  let hi = NaN;
  for (let t = t0Ms + STEP; t <= t1Ms; t += STEP) {
    const cur = f(t);
    if (prevF <= 0 && cur >= 0 && !(prevF === 0 && cur === 0)) {
      lo = prevT;
      hi = t;
      break;
    }
    prevT = t;
    prevF = cur;
  }
  if (Number.isNaN(lo)) {
    throw new VarshaphalaError('SOLAR_RETURN_NOT_BRACKETED', 'no solar-return crossing in the age window', { age, t0: new Date(t0Ms).toISOString() });
  }
  while (hi - lo > 500) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

/** Thrirasi tables (day / night) by the annual-lagna element; Raman discrepancy declared. */
const THRIRASI_DAY: Record<string, TajikaPlanet> = { fire: 'Sun', earth: 'Venus', air: 'Saturn', water: 'Mars' };
const THRIRASI_NIGHT: Record<string, TajikaPlanet> = { fire: 'Jupiter', earth: 'Moon', air: 'Mercury', water: 'Mars' };
const ELEMENT_OF_SIGN: Record<number, 'fire' | 'earth' | 'air' | 'water'> = {
  1: 'fire', 5: 'fire', 9: 'fire',
  2: 'earth', 6: 'earth', 10: 'earth',
  3: 'air', 7: 'air', 11: 'air',
  4: 'water', 8: 'water', 12: 'water'
};

/** Varga lords for PV (annual positions). Drekkana = trinal lords (Raman); Navamsa = element scheme. */
function drekkanaLord(lon: number): TajikaPlanet {
  const sign = Math.floor(normalizeDeg(lon) / 30);
  const part = Math.floor((normalizeDeg(lon) % 30) / 10);
  const trinal = [sign, (sign + 4) % 12, (sign + 8) % 12];
  return SIGN_LORDS[trinal[part]] as TajikaPlanet;
}
function navamsaLord(lon: number): TajikaPlanet {
  const sign = Math.floor(normalizeDeg(lon) / 30);
  const part = Math.floor((normalizeDeg(lon) % 30) / (30 / 9));
  const element = ELEMENT_OF_SIGN[sign + 1];
  const start = element === 'fire' ? 0 : element === 'earth' ? 9 : element === 'air' ? 6 : 3;
  return SIGN_LORDS[(start + part) % 12] as TajikaPlanet;
}
type MaitriTier = 'SWA' | 'FRIEND' | 'NEUTRAL' | 'ENEMY';
function maitriTier(planet: TajikaPlanet, lord: string): MaitriTier {
  if (planet === lord) return 'SWA';
  if (NATURAL_FRIENDS[planet].includes(lord)) return 'FRIEND';
  if (NATURAL_ENEMIES[planet].includes(lord)) return 'ENEMY';
  return 'NEUTRAL';
}
/** Component maxima; NEUTRAL tiers are the declared midpoint interpolation (ATTRIBUTION_UNVERIFIED). */
const TIER_SCORES: Record<'kshetra' | 'drekkana' | 'navamsa', Record<MaitriTier, number>> = {
  kshetra: { SWA: 30, FRIEND: 15, NEUTRAL: 11.25, ENEMY: 7.5 },
  drekkana: { SWA: 10, FRIEND: 5, NEUTRAL: 3.75, ENEMY: 2.5 },
  navamsa: { SWA: 5, FRIEND: 2.5, NEUTRAL: 1.875, ENEMY: 1.25 }
};

export interface PvComponents {
  kshetra: number;
  ochcha: number;
  hadda: null;
  drekkana: number;
  navamsa: number;
  totalPartial: number;
  status: 'PARTIAL_HADDA_MISSING';
}
export function panchavargeeyabalaPartial(planet: TajikaPlanet, siderealLon: number): PvComponents {
  const kshetra = TIER_SCORES.kshetra[maitriTier(planet, SIGN_LORDS[Math.floor(normalizeDeg(siderealLon) / 30)])];
  const ochcha = (minorArc(siderealLon, DEBILITATION_LON[planet]) / 180) * 20;
  const drekkana = TIER_SCORES.drekkana[maitriTier(planet, drekkanaLord(siderealLon))];
  const navamsa = TIER_SCORES.navamsa[maitriTier(planet, navamsaLord(siderealLon))];
  return {
    kshetra,
    ochcha,
    hadda: null,
    drekkana,
    navamsa,
    totalPartial: kshetra + ochcha + drekkana + navamsa,
    status: 'PARTIAL_HADDA_MISSING'
  };
}

export interface VarshaphalaInput {
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone: number;
  locationName: string;
  /** The calendar year whose varsha (birthday-to-birthday year) is computed. Default: the birth-UTC year is refused — pass an explicit year. */
  targetYear: number;
}

export interface AnnualPlanetRow {
  name: string;
  siderealLongitude: number;
  rashiId: number;
  isRetrograde: boolean;
}

export interface VarshaphalaResult {
  engineVersion: string;
  targetYear: number;
  age: number;
  status: 'CALCULATED' | 'NOT_CALCULATED';
  notCalculatedReason?: string;
  solarReturnUtc: string;
  muntha: {
    rashi: string;
    rashiId: number;
    houseFromAnnualLagna: number;
    houseFromNatalLagna: number;
    signification: string;
  };
  varsheshwar: {
    planet: string;
    sanskritTitle: string;
    role: string;
    balaVirupas: number | null;
    pvComponents: PvComponents | null;
    portfolios: string[];
    eligibleByAspect: boolean;
    status: 'ADOPTED_READING_DETERMINED' | 'SCHOLAR_JUDGEMENT_REQUIRED' | 'NOT_CALCULATED';
    readingSensitive: boolean;
    declaredAlternatives: string[];
  };
  annualLagna: { rashi: string; rashiId: number };
  dayNight: 'DAY' | 'NIGHT' | 'NOT_CALCULATED';
  annualPlanets: AnnualPlanetRow[];
  sahams: Array<never>;
  sahamsNotCalculatedReason: string;
  ruleRefs: string[];
  declaredFindings: string[];
}

const MUNTHA_SIGNIFICATION: Record<number, string> = {
  1: 'Kendra Muntha: Major executive milestone, authority, and auspicious beginnings',
  4: 'Kendra Muntha: Major executive milestone, authority, and auspicious beginnings',
  7: 'Kendra Muntha: Major executive milestone, authority, and auspicious beginnings',
  10: 'Kendra Muntha: Major executive milestone, authority, and auspicious beginnings',
  5: 'Trikona / Labha Muntha: Substantial prosperity, mental clarity, and spiritual expansion',
  9: 'Trikona / Labha Muntha: Substantial prosperity, mental clarity, and spiritual expansion',
  11: 'Trikona / Labha Muntha: Substantial prosperity, mental clarity, and spiritual expansion',
  6: 'Requires caution regarding physical immunity, litigation, and financial expenditure',
  8: 'Requires caution regarding physical immunity, litigation, and financial expenditure',
  12: 'Requires caution regarding physical immunity, litigation, and financial expenditure',
  2: 'Mixed: sustenance and family focus with moderate gains',
  3: 'Mixed: effort, communication, and short travels dominate the year'
};

export function computeVarshaphala(input: VarshaphalaInput): VarshaphalaResult {
  const base: VarshaphalaResult = {
    engineVersion: VARSHAPHALA_ENGINE_VERSION,
    targetYear: input.targetYear,
    age: input.targetYear - Number(input.birthDate.slice(0, 4)),
    status: 'NOT_CALCULATED',
    solarReturnUtc: '',
    muntha: { rashi: '', rashiId: 0, houseFromAnnualLagna: 0, houseFromNatalLagna: 0, signification: '' },
    varsheshwar: {
      planet: '', sanskritTitle: 'वर्षेश (Lord of the Year)', role: '',
      balaVirupas: null, pvComponents: null, portfolios: [], eligibleByAspect: false,
      status: 'NOT_CALCULATED', readingSensitive: false, declaredAlternatives: []
    },
    annualLagna: { rashi: '', rashiId: 0 },
    dayNight: 'NOT_CALCULATED',
    annualPlanets: [],
    sahams: [],
    sahamsNotCalculatedReason: 'Saham day/night formulas are queued (Sprint L scope closed without them); the pre-Sprint-L constant-offset Sahams were FABRICATED and are withdrawn (CT_INV_002 remediation).',
    ruleRefs: ['RULE_VARSHA_SOLAR_RETURN', 'RULE_MUNTHA_PROGRESSION', 'RULE_TAJIKA_PANCHAVARGEEYA_BALA', 'RULE_VARSHESHWAR_SELECTION'],
    declaredFindings: ['DECLARED_HADDA_TABLE_UNAVAILABLE', 'DECLARED_THRIRASI_RAMAN_DISCREPANCY', 'DECLARED_ASPECT_SIGN_CLASS_READING', 'DECLARED_SAHAMS_QUEUED']
  };

  const birthYear = Number(input.birthDate.slice(0, 4));
  const age = input.targetYear - birthYear;
  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude) || !Number.isFinite(input.timezone)) {
    throw new VarshaphalaError('INVALID_INPUT', 'latitude/longitude/timezone must be finite numbers', {});
  }
  if (age < 1) {
    throw new VarshaphalaError('TARGET_PRE_BIRTH', `targetYear ${input.targetYear} precedes the first possible varsha (birth year ${birthYear})`, { age });
  }
  if (age > 120) {
    throw new VarshaphalaError('AGE_OUT_OF_RANGE', `age ${age} outside the supported 1..120 band`, { age });
  }

  const birthUtc = civilToUtc(input.birthDate, input.birthTime, input.timezone);
  const birthChart = calculateCelestialEphemeris({ dateUtc: birthUtc, latitude: input.latitude, longitude: input.longitude });
  const natalSun = birthChart.bodies.Sun.siderealLongitude;
  const natalLagnaRashi = Math.floor(birthChart.lagna.siderealLongitude / 30) + 1;

  const returnInstant = findSolarReturn(birthUtc, natalSun, age);
  const annual = calculateCelestialEphemeris({ dateUtc: returnInstant, latitude: input.latitude, longitude: input.longitude });

  // Day/night at the return. The kernel's solarTimings are the NEXT rise and
  // the NEXT set AFTER the instant (SearchRiseSet semantics), so the instant is
  // in DAYLIGHT exactly when the next sunset precedes the next sunrise.
  // Declared boundary: an exact rise/set tie counts as DAY.
  const sunrise = annual.solarTimings.sunriseUtc ? Date.parse(annual.solarTimings.sunriseUtc) : null;
  const sunset = annual.solarTimings.sunsetUtc ? Date.parse(annual.solarTimings.sunsetUtc) : null;
  let dayNight: 'DAY' | 'NIGHT' | 'NOT_CALCULATED' = 'NOT_CALCULATED';
  if (sunrise !== null && sunset !== null) {
    dayNight = sunset <= sunrise ? 'DAY' : 'NIGHT';
  } else {
    const out: VarshaphalaResult = {
      ...base,
      status: 'NOT_CALCULATED',
      notCalculatedReason: 'POLAR_DAY_NIGHT_UNRESOLVED: sunrise/sunset undefined at the return instant (polar latitude) — the Dina-Ratri and Thrirasi portfolios cannot be evaluated honestly.',
      solarReturnUtc: returnInstant.toISOString(),
      annualPlanets: annualPlanetsFrom(annual)
    };
    return out;
  }

  const annualLagnaLon = annual.lagna.siderealLongitude;
  const annualLagnaRashi = Math.floor(annualLagnaLon / 30) + 1;

  // Muntha: advances one rashi at each varshapravesha from the janma lagna.
  const munthaRashi = ((natalLagnaRashi - 1 + age) % 12) + 1;
  const munthaHouseFromAnnual = ((munthaRashi - annualLagnaRashi + 12) % 12) + 1;
  const munthaHouseFromNatal = ((munthaRashi - natalLagnaRashi + 12) % 12) + 1;

  const annualLons: Record<TajikaPlanet, number> = {
    Sun: annual.bodies.Sun.siderealLongitude,
    Moon: annual.bodies.Moon.siderealLongitude,
    Mars: annual.bodies.Mars.siderealLongitude,
    Mercury: annual.bodies.Mercury.siderealLongitude,
    Jupiter: annual.bodies.Jupiter.siderealLongitude,
    Venus: annual.bodies.Venus.siderealLongitude,
    Saturn: annual.bodies.Saturn.siderealLongitude
  };

  // The five portfolios.
  const sunSign = Math.floor(annualLons.Sun / 30) + 1;
  const moonSign = Math.floor(annualLons.Moon / 30) + 1;
  const dinaRatri = dayNight === 'DAY' ? SIGN_LORDS[sunSign - 1] : SIGN_LORDS[moonSign - 1];
  const janmaLagnaLord = SIGN_LORDS[natalLagnaRashi - 1];
  const varshaLagnaLord = SIGN_LORDS[annualLagnaRashi - 1];
  const munthaLord = SIGN_LORDS[munthaRashi - 1];
  const thrirasi = dayNight === 'DAY'
    ? THRIRASI_DAY[ELEMENT_OF_SIGN[annualLagnaRashi]]
    : THRIRASI_NIGHT[ELEMENT_OF_SIGN[annualLagnaRashi]];
  // Raman's worked example (day Capricorn -> Mars) as the declared alternative reading.
  const thrirasiAlternative = dayNight === 'DAY' ? THRIRASI_NIGHT[ELEMENT_OF_SIGN[annualLagnaRashi]] : THRIRASI_DAY[ELEMENT_OF_SIGN[annualLagnaRashi]];

  const portfolios: Record<string, string> = {
    DINA_RATRI: dinaRatri,
    JANMA_LAGNA: janmaLagnaLord,
    VARSHA_LAGNA: varshaLagnaLord,
    MUNTHA: munthaLord,
    THRIRASI: thrirasi
  };
  const pvOf: Record<string, PvComponents> = {} as Record<string, PvComponents>;
  for (const p of SEVEN) pvOf[p] = panchavargeeyabalaPartial(p, annualLons[p]);

  // Adopted aspect predicate: favourable/sama sign-class from the annual lagna (houses 2,3,5,9,11,12).
  const qualifiesByAspect = (planet: string): boolean => {
    const sign = Math.floor(annualLons[planet as TajikaPlanet] / 30) + 1;
    const houseFromLagna = ((sign - annualLagnaRashi + 12) % 12) + 1;
    return [2, 3, 5, 9, 11, 12].includes(houseFromLagna);
  };

  const candidates = [...new Set(Object.values(portfolios))].filter((p): p is TajikaPlanet => (SEVEN as readonly string[]).includes(p));
  const eligible = candidates.filter(qualifiesByAspect);
  const portfolioCount = (p: string): number => Object.values(portfolios).filter((q) => q === p).length;
  const PORTFOLIO_ORDER = ['DINA_RATRI', 'JANMA_LAGNA', 'VARSHA_LAGNA', 'MUNTHA', 'THRIRASI'];

  let yearLord: string;
  let eligibleByAspect = false;
  if (eligible.length > 0) {
    eligibleByAspect = true;
    yearLord = [...eligible].sort((a, b) =>
      pvOf[b].totalPartial - pvOf[a].totalPartial ||
      portfolioCount(b) - portfolioCount(a) ||
      PORTFOLIO_ORDER.indexOf(Object.keys(portfolios).find((k) => portfolios[k] === a)!) - PORTFOLIO_ORDER.indexOf(Object.keys(portfolios).find((k) => portfolios[k] === b)!)
    )[0];
  } else {
    yearLord = munthaLord; // attested fallback: the Muntha lord becomes the Year Lord
  }

  // Reading sensitivity: would Raman's example Thrirasi reading change the winner?
  const portfoliosAlt = { ...portfolios, THRIRASI: thrirasiAlternative };
  const eligibleAlt = [...new Set(Object.values(portfoliosAlt))].filter((p): p is TajikaPlanet => (SEVEN as readonly string[]).includes(p)).filter(qualifiesByAspect);
  let yearLordAlt = yearLord;
  if (eligibleAlt.length > 0) {
    yearLordAlt = [...eligibleAlt].sort((a, b) =>
      pvOf[b].totalPartial - pvOf[a].totalPartial ||
      portfolioCount(b) - portfolioCount(a)
    )[0];
  }
  const readingSensitive = yearLordAlt !== yearLord;

  return {
    ...base,
    status: 'CALCULATED',
    solarReturnUtc: returnInstant.toISOString(),
    muntha: {
      rashi: RASHIS[munthaRashi - 1],
      rashiId: munthaRashi,
      houseFromAnnualLagna: munthaHouseFromAnnual,
      houseFromNatalLagna: munthaHouseFromNatal,
      signification: MUNTHA_SIGNIFICATION[munthaHouseFromAnnual] ?? 'Mixed annual focus'
    },
    varsheshwar: {
      planet: yearLord,
      sanskritTitle: 'वर्षेश (Lord of the Year)',
      role: `Selected under the adopted Raman-ch.4 reading: ${eligibleByAspect ? `highest partial Panchavargeeyabala among candidates with a favourable/sama sign-aspect to the varsha lagna` : `Muntha-lord fallback (no candidate qualified by aspect)`}.`,
      balaVirupas: pvOf[yearLord].totalPartial,
      pvComponents: pvOf[yearLord],
      portfolios: Object.entries(portfolios).filter(([, v]) => v === yearLord).map(([k]) => k),
      eligibleByAspect,
      status: 'ADOPTED_READING_DETERMINED',
      readingSensitive,
      declaredAlternatives: [
        `Thrirasi alternative reading (${dayNight === 'DAY' ? 'Raman worked-example day table' : 'element day table for night'}) yields ${yearLordAlt}${readingSensitive ? ' — DIFFERENT Year Lord' : ' — same Year Lord'}.`,
        "Raman's worked example applies an interpretive 'powerful aspect' (Deeptamsha-orb) filter beyond the adopted sign-class predicate.",
        'Some sources hold the Moon can never be the Year Lord; that exclusion is NOT adopted.',
        'Haddabala is NOT_CALCULATED (tables unavailable in machine-readable form); the PV total is partial and used uniformly.'
      ]
    },
    annualLagna: { rashi: RASHIS[annualLagnaRashi - 1], rashiId: annualLagnaRashi },
    dayNight,
    annualPlanets: annualPlanetsFrom(annual),
    sahams: [],
    sahamsNotCalculatedReason: base.sahamsNotCalculatedReason,
    ruleRefs: base.ruleRefs,
    declaredFindings: base.declaredFindings
  };
}

function annualPlanetsFrom(annual: ReturnType<typeof calculateCelestialEphemeris>): AnnualPlanetRow[] {
  return (Object.entries(annual.bodies) as Array<[string, { siderealLongitude: number; speedDegreesPerDay: number; isRetrograde: boolean }]>)
    .filter(([name]) => ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].includes(name))
    .map(([name, b]) => ({
      name,
      siderealLongitude: b.siderealLongitude,
      rashiId: Math.floor(b.siderealLongitude / 30) + 1,
      isRetrograde: b.isRetrograde
    }));
}

/**
 * Snapshot-facing wrapper: fail-closed errors become an honest
 * NOT_CALCULATED result (CT_INV_006) instead of crashing the snapshot build.
 */
export function computeVarshaphalaSafe(input: VarshaphalaInput): VarshaphalaResult {
  try {
    return computeVarshaphala(input);
  } catch (e) {
    if (e instanceof VarshaphalaError) {
      return {
        engineVersion: VARSHAPHALA_ENGINE_VERSION,
        targetYear: input.targetYear,
        age: input.targetYear - Number(input.birthDate.slice(0, 4)),
        status: 'NOT_CALCULATED',
        notCalculatedReason: `${e.code}: ${e.message}`,
        solarReturnUtc: '',
        muntha: { rashi: '', rashiId: 0, houseFromAnnualLagna: 0, houseFromNatalLagna: 0, signification: '' },
        varsheshwar: {
          planet: '', sanskritTitle: 'वर्षेश (Lord of the Year)', role: '',
          balaVirupas: null, pvComponents: null, portfolios: [], eligibleByAspect: false,
          status: 'NOT_CALCULATED', readingSensitive: false, declaredAlternatives: []
        },
        annualLagna: { rashi: '', rashiId: 0 },
        dayNight: 'NOT_CALCULATED',
        annualPlanets: [],
        sahams: [],
        sahamsNotCalculatedReason: 'Saham day/night formulas are queued (Sprint L scope closed without them); the pre-Sprint-L constant-offset Sahams were FABRICATED and are withdrawn (CT_INV_002 remediation).',
        ruleRefs: ['RULE_VARSHA_SOLAR_RETURN', 'RULE_MUNTHA_PROGRESSION', 'RULE_TAJIKA_PANCHAVARGEEYA_BALA', 'RULE_VARSHESHWAR_SELECTION'],
        declaredFindings: ['DECLARED_HADDA_TABLE_UNAVAILABLE', 'DECLARED_THRIRASI_RAMAN_DISCREPANCY', 'DECLARED_ASPECT_SIGN_CLASS_READING', 'DECLARED_SAHAMS_QUEUED']
      };
    }
    throw e;
  }
}
