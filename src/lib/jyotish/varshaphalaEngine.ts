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

export const VARSHAPHALA_ENGINE_VERSION = 'varshaphala-engine-2.1.0 (sprint M, sahams + varsha dasha)';

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


/* ------------------------------------------------------------------ */
/* Sprint M — Sahams (Raman ch. 8 arts. 78-81, 35 points)              */
/* ------------------------------------------------------------------ */

/**
 * Operand tokens resolved against the ANNUAL chart. House cusps are
 * WHOLE-SIGN cusps from the varsha lagna (declared convention; Raman's text
 * may intend computed madhya cusps — alternative declared on the rule).
 * Positions of lords are the longitudes of the lord PLANETS in the annual chart.
 */
export type SahamOperand =
  | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn'
  | 'ASC' | 'LORD_OF_ASC' | 'LORD_OF_CUSP_2' | 'LORD_OF_9' | 'LORD_OF_SUN_SIGN'
  | 'CUSP_2' | 'CUSP_6' | 'CUSP_8' | 'CUSP_9'
  | 'CANCER_15'
  | 'SAHAM_SASTRA' | 'SAHAM_PUNYA';

export interface SahamDef {
  id: number;
  name: string;
  sanskrit: string;
  signification: string;
  minuend: SahamOperand;
  subtrahend: SahamOperand;
  anchor: SahamOperand;
  /** Same formula day and night (no minuend/subtrahend reversal). */
  sameDayNight?: boolean;
}

/**
 * The 35 classical Sahams exactly as tabulated in Raman ch. 8 (vedastro.org
 * Part 11 digitization, fetched 2026-09). Day formulas; unless sameDayNight,
 * the night chart swaps minuend and subtrahend (anchor unchanged).
 */
export const SAHAM_DEFS: SahamDef[] = [
  { id: 1, name: 'Punya', sanskrit: 'पुण्य', signification: 'Fortune, merit', minuend: 'Moon', subtrahend: 'Sun', anchor: 'ASC' },
  { id: 2, name: 'Vidya', sanskrit: 'विद्या', signification: 'Learning, education', minuend: 'Sun', subtrahend: 'Moon', anchor: 'ASC' },
  { id: 3, name: 'Yasa', sanskrit: 'यश', signification: 'Fame, reputation', minuend: 'Jupiter', subtrahend: 'SAHAM_PUNYA', anchor: 'ASC' },
  { id: 4, name: 'Mitra', sanskrit: 'मित्र', signification: 'Friends', minuend: 'Jupiter', subtrahend: 'SAHAM_PUNYA', anchor: 'Venus' },
  { id: 5, name: 'Mahatmya', sanskrit: 'महात्म्य', signification: 'Greatness', minuend: 'SAHAM_PUNYA', subtrahend: 'Mars', anchor: 'ASC' },
  { id: 6, name: 'Asha', sanskrit: 'आशा', signification: 'Desire', minuend: 'Saturn', subtrahend: 'Mars', anchor: 'ASC' },
  { id: 7, name: 'Samartha', sanskrit: 'सामर्थ्य', signification: 'Ability, competence', minuend: 'Mars', subtrahend: 'LORD_OF_ASC', anchor: 'ASC' },
  { id: 8, name: 'Bhratru', sanskrit: 'भ्रातृ', signification: 'Brothers', minuend: 'Jupiter', subtrahend: 'Saturn', anchor: 'ASC', sameDayNight: true },
  { id: 9, name: 'Gaurava', sanskrit: 'गौरव', signification: 'Respect, honor', minuend: 'Jupiter', subtrahend: 'Moon', anchor: 'Sun' },
  { id: 10, name: 'Pitru', sanskrit: 'पितृ', signification: 'Father', minuend: 'Saturn', subtrahend: 'Sun', anchor: 'ASC' },
  { id: 11, name: 'Raja', sanskrit: 'राज', signification: 'King, authority', minuend: 'Saturn', subtrahend: 'Sun', anchor: 'ASC' },
  { id: 12, name: 'Matru', sanskrit: 'मातृ', signification: 'Mother', minuend: 'Moon', subtrahend: 'Venus', anchor: 'ASC' },
  { id: 13, name: 'Putra', sanskrit: 'पुत्र', signification: 'Children', minuend: 'Jupiter', subtrahend: 'Moon', anchor: 'ASC' },
  { id: 14, name: 'Jeeva', sanskrit: 'जीव', signification: 'Livelihood, vitality', minuend: 'Saturn', subtrahend: 'Jupiter', anchor: 'ASC' },
  { id: 15, name: 'Karma', sanskrit: 'कर्म', signification: 'Action, profession', minuend: 'Mars', subtrahend: 'Mercury', anchor: 'ASC' },
  { id: 16, name: 'Roga', sanskrit: 'रोग', signification: 'Disease', minuend: 'ASC', subtrahend: 'Moon', anchor: 'ASC' },
  { id: 17, name: 'Kali', sanskrit: 'कलि', signification: 'Strife, conflict', minuend: 'Jupiter', subtrahend: 'Mars', anchor: 'ASC' },
  { id: 18, name: 'Sastra', sanskrit: 'शास्त्र', signification: 'Science, learning', minuend: 'Jupiter', subtrahend: 'Saturn', anchor: 'Mercury' },
  { id: 19, name: 'Bandhu', sanskrit: 'बन्धु', signification: 'Relatives', minuend: 'Mercury', subtrahend: 'Moon', anchor: 'ASC' },
  { id: 20, name: 'Mrityu', sanskrit: 'मृत्यु', signification: 'Death', minuend: 'CUSP_8', subtrahend: 'Moon', anchor: 'ASC' },
  { id: 21, name: 'Paradesa', sanskrit: 'परदेश', signification: 'Foreign country', minuend: 'CUSP_9', subtrahend: 'LORD_OF_9', anchor: 'ASC' },
  { id: 22, name: 'Artha', sanskrit: 'अर्थ', signification: 'Finance, wealth', minuend: 'CUSP_2', subtrahend: 'LORD_OF_CUSP_2', anchor: 'ASC' },
  { id: 23, name: 'Paradara', sanskrit: 'परदार', signification: 'Adultery', minuend: 'Venus', subtrahend: 'Sun', anchor: 'ASC' },
  { id: 24, name: 'Vanik', sanskrit: 'वणिक्', signification: 'Trade, commerce', minuend: 'Moon', subtrahend: 'Mercury', anchor: 'ASC' },
  { id: 25, name: 'Karyasiddhi', sanskrit: 'कार्यसिद्धि', signification: 'Success in undertakings', minuend: 'Saturn', subtrahend: 'Sun', anchor: 'LORD_OF_SUN_SIGN' },
  { id: 26, name: 'Vivaha', sanskrit: 'विवाह', signification: 'Marriage', minuend: 'Venus', subtrahend: 'Saturn', anchor: 'ASC' },
  { id: 27, name: 'Santapa', sanskrit: 'सन्ताप', signification: 'Sorrow, grief', minuend: 'Saturn', subtrahend: 'Moon', anchor: 'CUSP_6' },
  { id: 28, name: 'Sraddha', sanskrit: 'श्रद्धा', signification: 'Devotion', minuend: 'Venus', subtrahend: 'Mars', anchor: 'ASC' },
  { id: 29, name: 'Preeti', sanskrit: 'प्रीति', signification: 'Love, affection', minuend: 'SAHAM_SASTRA', subtrahend: 'SAHAM_PUNYA', anchor: 'ASC' },
  { id: 30, name: 'Jadya', sanskrit: 'जड्य', signification: 'Chronic disease', minuend: 'Mars', subtrahend: 'Saturn', anchor: 'Mercury' },
  { id: 31, name: 'Vyapara', sanskrit: 'व्यापार', signification: 'Business', minuend: 'Mars', subtrahend: 'Saturn', anchor: 'ASC', sameDayNight: true },
  { id: 32, name: 'Satru', sanskrit: 'शत्रु', signification: 'Enemies', minuend: 'Mars', subtrahend: 'Saturn', anchor: 'ASC' },
  { id: 33, name: 'Jalapathana', sanskrit: 'जलपातन', signification: 'Sea voyage', minuend: 'CANCER_15', subtrahend: 'Saturn', anchor: 'ASC' },
  { id: 34, name: 'Bandhana', sanskrit: 'बन्धन', signification: 'Imprisonment', minuend: 'SAHAM_PUNYA', subtrahend: 'Saturn', anchor: 'ASC' },
  { id: 35, name: 'Apamrityu', sanskrit: 'अपमृत्यु', signification: 'Accidental death', minuend: 'CUSP_8', subtrahend: 'Mars', anchor: 'ASC' }
];

export interface SahamRow {
  id: number;
  name: string;
  sanskrit: string;
  signification: string;
  /** The formula as evaluated (after the day/night reversal). */
  formulaApplied: { minuend: SahamOperand; subtrahend: SahamOperand; anchor: SahamOperand };
  rawLongitude: number;
  /** The 30-degree correction of Raman ch. 8 (applied when the ascendant does not fall between minuend and subtrahend). */
  correctionApplied: boolean;
  longitude: number;
  rashiId: number;
  rashi: string;
}

export interface SahamContext {
  lagnaLon: number;
  lagnaRashiId: number;
  planetLons: Record<TajikaPlanet, number>;
  dayNight: 'DAY' | 'NIGHT';
}

function resolveSahamOperand(token: SahamOperand, ctx: SahamContext, computed: Map<number, number>): number {
  switch (token) {
    case 'ASC': return ctx.lagnaLon;
    case 'LORD_OF_ASC': {
      const lord = SIGN_LORDS[ctx.lagnaRashiId - 1];
      return ctx.planetLons[lord as TajikaPlanet];
    }
    case 'LORD_OF_CUSP_2': {
      const cusp2 = ((ctx.lagnaRashiId - 1 + 1) % 12);
      return ctx.planetLons[SIGN_LORDS[cusp2] as TajikaPlanet];
    }
    case 'LORD_OF_9': {
      const cusp9 = ((ctx.lagnaRashiId - 1 + 8) % 12);
      return ctx.planetLons[SIGN_LORDS[cusp9] as TajikaPlanet];
    }
    case 'LORD_OF_SUN_SIGN': {
      const sunSign = Math.floor(normalizeDeg(ctx.planetLons.Sun) / 30);
      return ctx.planetLons[SIGN_LORDS[sunSign] as TajikaPlanet];
    }
    case 'CUSP_2': return normalizeDeg(ctx.lagnaLon + 30);
    case 'CUSP_6': return normalizeDeg(ctx.lagnaLon + 150);
    case 'CUSP_8': return normalizeDeg(ctx.lagnaLon + 210);
    case 'CUSP_9': return normalizeDeg(ctx.lagnaLon + 240);
    case 'CANCER_15': return 105;
    case 'SAHAM_PUNYA': return computed.get(1)!;
    case 'SAHAM_SASTRA': return computed.get(18)!;
    default:
      return ctx.planetLons[token as TajikaPlanet];
  }
}

/**
 * Compute all 35 Sahams. Adopted mechanical reading of Raman's correction:
 * "add 30 deg if the Ascendant does NOT fall between the positions of the
 * Minuend and Subtrahend" — betweenness on the forward arc from minuend to
 * subtrahend: ((asc - min) mod 360) <= ((sub - min) mod 360). Dependency
 * sahams (Punya, Sastra) are computed with the SAME day/night rule first.
 */
export function computeSahams(ctx: SahamContext): SahamRow[] {
  const computed = new Map<number, number>();
  const rows: SahamRow[] = [];
  const ordered = [...SAHAM_DEFS].sort((a, b) => {
    const rank = (d: SahamDef): number => (d.subtrahend === 'SAHAM_PUNYA' || d.minuend === 'SAHAM_SASTRA' ? 1 : 0);
    return rank(a) - rank(b);
  });
  for (const def of ordered) {
    const swap = ctx.dayNight === 'NIGHT' && !def.sameDayNight;
    const minuend = swap ? def.subtrahend : def.minuend;
    const subtrahend = swap ? def.minuend : def.subtrahend;
    const m = resolveSahamOperand(minuend, ctx, computed);
    const sb = resolveSahamOperand(subtrahend, ctx, computed);
    const a = resolveSahamOperand(def.anchor, ctx, computed);
    const raw = normalizeDeg(m - sb + a);
    // 30-degree correction (declared forward-arc betweenness reading).
    // FP NOTE: fold the RAW difference exactly once — a normalizeDeg() round
    // trip on each operand drifted by one ulp and turned "asc == minuend"
    // into 359.9999… (caught by independent-identity qualification, sprint M).
    const ascWithin = (((ctx.lagnaLon - m) % 360) + 360) % 360 <= (((sb - m) % 360) + 360) % 360;
    const correctionApplied = !ascWithin;
    const longitude = normalizeDeg(raw + (correctionApplied ? 30 : 0));
    computed.set(def.id, longitude);
    const rashiId = Math.floor(longitude / 30) + 1;
    rows.push({
      id: def.id, name: def.name, sanskrit: def.sanskrit, signification: def.signification,
      formulaApplied: { minuend, subtrahend, anchor: def.anchor },
      rawLongitude: raw,
      correctionApplied,
      longitude,
      rashiId,
      rashi: RASHIS[rashiId - 1]
    });
  }
  return rows.sort((x, y) => x.id - y.id);
}

/* ------------------------------------------------------------------ */
/* Sprint M — Varsha Dasa (Raman ch. 5 arts. 53-56)                    */
/* ------------------------------------------------------------------ */

export const VARSHA_YEAR_LENGTH_DAYS = 365.25; // 365 days 6 hours (Raman)

export interface VarshaDashaPeriod {
  participant: string;
  krissamsaDeg: number;
  patyamsaDeg: number;
  durationDays: number;
  startUtc: string;
  endUtc: string;
}

export interface VarshaDasha {
  totalPatyamsaDeg: number;
  yearLengthDays: number;
  /** Bhukti length inside a period X of lord Y: (durY * durX) / yearLength. */
  periods: VarshaDashaPeriod[];
  note: string;
}

/**
 * Krissamsa = degrees within the sign (sign number rejected). Participants:
 * the seven grahas + the annual ascendant (Raman's worked example: 8 rows).
 * Sorted ascending; first patyamsa = its own krissamsa; the rest are
 * differences; total = krissamsa of the LAST (largest) row; each duration =
 * patyamsa / total * 365.25 days, starting at the varshapravesha instant.
 */
export function computeVarshaDasha(annual: SahamContext, returnInstant: Date): VarshaDasha {
  const rows = (Object.entries(annual.planetLons) as Array<[TajikaPlanet, number]>)
    .map(([name, lon]) => ({ participant: name as string, krissamsaDeg: normalizeDeg(lon) % 30 }));
  rows.push({ participant: 'ASC', krissamsaDeg: normalizeDeg(annual.lagnaLon) % 30 });
  rows.sort((a, b) => a.krissamsaDeg - b.krissamsaDeg);
  const total = rows[rows.length - 1].krissamsaDeg;
  let cursor = returnInstant.getTime();
  const periods: VarshaDashaPeriod[] = [];
  for (let i = 0; i < rows.length; i++) {
    const patyamsa = i === 0 ? rows[i].krissamsaDeg : rows[i].krissamsaDeg - rows[i - 1].krissamsaDeg;
    const durationDays = total > 0 ? (patyamsa / total) * VARSHA_YEAR_LENGTH_DAYS : 0;
    const startUtc = new Date(cursor).toISOString();
    cursor += durationDays * 86400000;
    periods.push({
      participant: rows[i].participant,
      krissamsaDeg: rows[i].krissamsaDeg,
      patyamsaDeg: patyamsa,
      durationDays,
      startUtc,
      endUtc: new Date(cursor).toISOString()
    });
  }
  return {
    totalPatyamsaDeg: total,
    yearLengthDays: VARSHA_YEAR_LENGTH_DAYS,
    periods,
    note: 'Bhukti of X inside lord Y: (durY * durX) / 365.25, ordered along the ascending krissamsa sequence starting at Y (Raman ch. 5). Raman: the Vimshottari overlay on annual charts was tested and found disappointing — the longitude-based method is adopted.'
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
  sahams: SahamRow[];
  sahamsNote: string;
  varshaDasha: VarshaDasha | null;
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
    sahamsNote: "Sahams require the day/night verdict at the return; this result is NOT_CALCULATED.",
    varshaDasha: null,
    ruleRefs: ['RULE_VARSHA_SOLAR_RETURN', 'RULE_MUNTHA_PROGRESSION', 'RULE_TAJIKA_PANCHAVARGEEYA_BALA', 'RULE_VARSHESHWAR_SELECTION', 'RULE_TAJIKA_SAHAMS', 'RULE_TAJIKA_VARSHA_DASHA'],
    declaredFindings: ['DECLARED_HADDA_TABLE_UNAVAILABLE', 'DECLARED_THRIRASI_RAMAN_DISCREPANCY', 'DECLARED_ASPECT_SIGN_CLASS_READING', 'DECLARED_SAHAM_TIMING_NOT_IMPLEMENTED', 'DECLARED_SAHAM_WHOLE_SIGN_CUSPS']
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

  const sahamCtx: SahamContext = { lagnaLon: annualLagnaLon, lagnaRashiId: annualLagnaRashi, planetLons: annualLons, dayNight };
  const sahams = computeSahams(sahamCtx);
  const varshaDasha = computeVarshaDasha(sahamCtx, returnInstant);

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
    sahams,
    sahamsNote: "35 Sahams computed per Raman ch. 8 (day/night reversal + the 30-deg correction; whole-sign cusps declared). The pre-Sprint-L constant-offset Sahams were FABRICATED and remain withdrawn (CT_INV_002 remediation). Saham TIMING methods are not implemented (DECLARED_SAHAM_TIMING_NOT_IMPLEMENTED). Raman's own caution stands: many Sahams 'do not work in practice'.",
    varshaDasha,
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
        sahamsNote: "The varsha year could not be erected; Sahams and Varsha Dasha are therefore not computed.",
        varshaDasha: null,
        ruleRefs: ['RULE_VARSHA_SOLAR_RETURN', 'RULE_MUNTHA_PROGRESSION', 'RULE_TAJIKA_PANCHAVARGEEYA_BALA', 'RULE_VARSHESHWAR_SELECTION', 'RULE_TAJIKA_SAHAMS', 'RULE_TAJIKA_VARSHA_DASHA'],
        declaredFindings: ['DECLARED_HADDA_TABLE_UNAVAILABLE', 'DECLARED_THRIRASI_RAMAN_DISCREPANCY', 'DECLARED_ASPECT_SIGN_CLASS_READING', 'DECLARED_SAHAM_TIMING_NOT_IMPLEMENTED', 'DECLARED_SAHAM_WHOLE_SIGN_CUSPS']
      };
    }
    throw e;
  }
}
