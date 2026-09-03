/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Gochara (Transit) Engine — Sprint G
 * Mission Section 9: a first-class transit engine with an EXPLICIT query
 * (reference timestamp, declared ayanamsha, declared node convention), Sade Sati
 * implemented as a real TRANSIT phenomenon (never inferred from natal positions),
 * and period start / phase transitions / period end with calculation evidence.
 *
 * Classical definitions adopted (SOURCE_SECONDARY — standard translations; no
 * verse-level locator claimed):
 *   - Sade Sati: Saturn transiting the 12th, 1st and 2nd rashis from the natal
 *     Moon's rashi (three signs, ~7.5 years). Phases in order: first (12th),
 *     peak (janma, 1st), third (2nd). The state at any instant depends ONLY on
 *     the transit Saturn's rashi and the natal Moon rashi — natal Saturn is not
 *     an input anywhere (charter §9 prohibition, enforced by tests).
 *   - Dhaiya (Ardhashtama Shani): Saturn transiting the 4th or 8th rashi from
 *     the natal Moon rashi. Declared definition; some schools differ — kept as
 *     an explicit flag, never folded into Sade Sati.
 *   - Parashari special aspects: Mars 4th/8th, Jupiter 5th/9th, Saturn 3rd/10th
 *     (in addition to the 7th for all grahas) — counted from transit to natal
 *     rashi positions by whole-sign house distance.
 *
 * Boundary convention: a rashi boundary belongs to the NEXT rashi (the engine's
 * ε-guard convention, consistent with the varga engine). All timestamps are UTC.
 */

import { calculateCelestialEphemeris } from './celestialEngine';

export const GOCHARA_ENGINE_VERSION = 'gochara-engine-1.0.0 (sprint-G qualified)';

const NAKSHATRA_SPAN = 360 / 27;
const DAY_MS = 86400000;

const RASHI_NAMES = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'
];

export const SADE_SATI_BAND_HOUSES = [12, 1, 2] as const;
export const DHAIYA_HOUSES = [4, 8] as const;

export class GocharaError extends Error {
  constructor(
    public readonly errorCode:
      | 'GOCHARA_INPUT_INVALID'
      | 'BOUNDARY_BRACKET_FAILED',
    message: string,
    public readonly detail: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GocharaError';
  }
}

export interface GocharaQuery {
  /** Natal Moon rashi, 1..12 (the anchor of Sade Sati and Chandra-lagna gochara). */
  natalMoonRashiId: number;
  /** Natal Lagna rashi, 1..12 (the anchor of houses-from-Lagna). */
  natalLagnaRashiId: number;
  /** EXPLICIT reference instant (UTC ISO string). No defaults — charter §9. */
  referenceInstantUtc: string;
}

export interface TransitGraha {
  name: string;
  siderealLongitude: number;
  rashiId: number;
  rashiName: string;
  nakshatraName: string;
  houseFromLagna: number;
  houseFromMoon: number;
}

export interface SadeSatiState {
  /** The phenomenon basis — always TRANSIT. Never natal. */
  basis: 'TRANSIT';
  isActive: boolean;
  phase: string;
  saturnHousesFromMoon: number;
  natalMoonRashiId: number;
  transitSaturnRashiId: number;
  transitSaturnRashiName: string;
  referenceInstantUtc: string;
}

export interface SadeSatiTransition {
  utc: string;
  /** Which phase boundary was crossed and in which direction. */
  event: 'JANMA_ENTRY' | 'JANMA_RETROGRADE_RETURN' | 'THIRD_ENTRY' | 'THIRD_RETROGRADE_RETURN';
  direction: 'FORWARD' | 'RETROGRADE_RETURN';
}

export interface SadeSatiPeriod {
  /** UTC instant of entry into the 12th rashi from the natal Moon (period start). */
  periodStartUtc: string;
  /**
   * ALL interior phase-boundary crossings within the period — including
   * retrograde re-entries (Saturn genuinely returns to the previous phase during
   * retrograde; real panchangs show the same toggling).
   */
  phaseTransitions: SadeSatiTransition[];
  /**
   * FIRST departure from the 2nd rashi from the natal Moon — the "classical
   * end" most published panchangs print (they treat the later retrograde dip
   * back into the band as a brief re-entry, not a period extension).
   */
  firstExitUtc: string;
  /** UTC instant of the FINAL exit from the 2nd rashi from the natal Moon — strict band membership. */
  periodEndUtc: string;
  /** Calculation evidence: the band in absolute sidereal degrees. */
  evidence: {
    bandStartDeg: number;
    bandEndDeg: number;
    saturnSiderealLongitudeDeg: number;
    method: 'shared 10-day sample scan + bracketed bisection on certified kernel Saturn sidereal longitude';
    declaredBoundaryToleranceDays: number;
    periodEndConvention: string;
  };
}

export interface GocharaResult {
  engineVersion: string;
  query: Required<GocharaQuery>;
  conventions: { ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA'; nodeMode: 'MEAN_NODE' };
  ayanamshaDegrees: number;
  transitGrahas: TransitGraha[];
  sadeSati: SadeSatiState;
  /** Dhaiya (Ardhashtama Shani) — declared, separate from Sade Sati. */
  dhaiya: { isActive: boolean; saturnHousesFromMoon: number; definition: string };
  /** Parashari special aspects from transit grahas onto the natal Lagna and Moon rashis. */
  specialAspectsOnNatal: Array<{
    transitPlanet: string;
    onto: 'Lagna' | 'Moon';
    houseDistance: number;
    isSpecialAspect: boolean;
    aspectHouses: number[];
  }>;
}

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const SPECIAL_ASPECTS: Record<string, number[]> = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] };

/** Rashi id (1..12) of a sidereal longitude. Boundary belongs to the next rashi. */
export function rashiIdOf(siderealLongitude: number): number {
  return Math.floor(norm360(siderealLongitude) / 30) + 1;
}

function houseFrom(fromRashiId: number, toRashiId: number): number {
  return ((toRashiId - fromRashiId + 12) % 12) + 1;
}

function transitAt(instantUtc: string) {
  return calculateCelestialEphemeris({
    dateUtc: new Date(instantUtc),
    latitude: 25.0,
    longitude: 85.0,
    nodeMode: 'MEAN_NODE'
  });
}

/**
 * First-class Gochara computation. The reference instant is EXPLICIT — the same
 * query always yields the same result (CT_INV_007). Natal Saturn is NOT an input.
 */
export function computeGochara(query: GocharaQuery): GocharaResult {
  const { natalMoonRashiId, natalLagnaRashiId, referenceInstantUtc } = query;
  if (!Number.isInteger(natalMoonRashiId) || natalMoonRashiId < 1 || natalMoonRashiId > 12) {
    throw new GocharaError('GOCHARA_INPUT_INVALID', 'natalMoonRashiId must be 1..12', { natalMoonRashiId });
  }
  if (!Number.isInteger(natalLagnaRashiId) || natalLagnaRashiId < 1 || natalLagnaRashiId > 12) {
    throw new GocharaError('GOCHARA_INPUT_INVALID', 'natalLagnaRashiId must be 1..12', { natalLagnaRashiId });
  }
  const t = Date.parse(referenceInstantUtc);
  if (!Number.isFinite(t)) {
    throw new GocharaError('GOCHARA_INPUT_INVALID', 'referenceInstantUtc must be a parseable UTC instant', { referenceInstantUtc });
  }

  const ephem = transitAt(referenceInstantUtc);
  const bodies: Array<[string, number]> = [
    ['Sun', ephem.bodies.Sun.siderealLongitude],
    ['Moon', ephem.bodies.Moon.siderealLongitude],
    ['Mars', ephem.bodies.Mars.siderealLongitude],
    ['Mercury', ephem.bodies.Mercury.siderealLongitude],
    ['Jupiter', ephem.bodies.Jupiter.siderealLongitude],
    ['Venus', ephem.bodies.Venus.siderealLongitude],
    ['Saturn', ephem.bodies.Saturn.siderealLongitude],
    ['Rahu', ephem.bodies.Rahu.siderealLongitude],
    ['Ketu', ephem.bodies.Ketu.siderealLongitude]
  ];

  const transitGrahas: TransitGraha[] = bodies.map(([name, lon]) => {
    const rashiId = rashiIdOf(lon);
    return {
      name,
      siderealLongitude: norm360(lon),
      rashiId,
      rashiName: RASHI_NAMES[rashiId - 1],
      nakshatraName: NAKSHATRA_NAMES[Math.floor(norm360(lon) / NAKSHATRA_SPAN) % 27],
      houseFromLagna: houseFrom(natalLagnaRashiId, rashiId),
      houseFromMoon: houseFrom(natalMoonRashiId, rashiId)
    };
  });

  const saturn = transitGrahas.find((g) => g.name === 'Saturn')!;
  const saturnFromMoon = saturn.houseFromMoon;
  const isSadeSati = (SADE_SATI_BAND_HOUSES as readonly number[]).includes(saturnFromMoon);
  const sadeSatiPhase = saturnFromMoon === 12
    ? '1st Phase (Rising / द्वादश शनि)'
    : saturnFromMoon === 1
      ? 'Peak Phase (Janma Shani / जन्म शनि)'
      : saturnFromMoon === 2
        ? '3rd Phase (Setting / द्वितीय शनि)'
        : 'Not Active';

  const specialAspectsOnNatal: GocharaResult['specialAspectsOnNatal'] = [];
  for (const g of transitGrahas) {
    for (const onto of ['Lagna', 'Moon'] as const) {
      const anchor = onto === 'Lagna' ? natalLagnaRashiId : natalMoonRashiId;
      const dist = houseFrom(anchor, g.rashiId);
      const aspectHouses = SPECIAL_ASPECTS[g.name] ?? [];
      specialAspectsOnNatal.push({
        transitPlanet: g.name,
        onto,
        houseDistance: dist,
        isSpecialAspect: aspectHouses.includes(dist),
        aspectHouses
      });
    }
  }

  return {
    engineVersion: GOCHARA_ENGINE_VERSION,
    query: { natalMoonRashiId, natalLagnaRashiId, referenceInstantUtc },
    conventions: { ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA', nodeMode: 'MEAN_NODE' },
    ayanamshaDegrees: ephem.ayanamsha.degrees,
    transitGrahas,
    sadeSati: {
      basis: 'TRANSIT',
      isActive: isSadeSati,
      phase: sadeSatiPhase,
      saturnHousesFromMoon: saturnFromMoon,
      natalMoonRashiId,
      transitSaturnRashiId: saturn.rashiId,
      transitSaturnRashiName: saturn.rashiName,
      referenceInstantUtc
    },
    dhaiya: {
      isActive: (DHAIYA_HOUSES as readonly number[]).includes(saturnFromMoon),
      saturnHousesFromMoon: saturnFromMoon,
      definition: 'Dhaiya (Ardhashtama Shani): transit Saturn in the 4th or 8th rashi from the natal Moon rashi. Separate phenomenon from Sade Sati; kept explicit, never folded in.'
    },
    specialAspectsOnNatal
  };
}

/* ------------------------------------------------------------------------- */
/* Sade Sati period boundaries (transit phenomenon — solved on the ephemeris) */
/* ------------------------------------------------------------------------- */

function saturnSiderealLon(instantUtc: string): number {
  const ephem = transitAt(instantUtc);
  return norm360(ephem.bodies.Saturn.siderealLongitude);
}

function bandForMoonRashi(natalMoonRashiId: number): { start: number; end: number } {
  // The 12th rashi from the natal Moon begins the band; the band ends at the
  // end of the 2nd rashi from the Moon: three consecutive rashis, 90° total.
  const bandStartRashi = ((natalMoonRashiId - 1 + 11) % 12); // 0-indexed 12th-from
  const start = bandStartRashi * 30;
  return { start, end: start + 90 };
}

/**
 * Computes the CURRENT Sade Sati period (period start, both phase transitions,
 * period end) around the reference instant by scanning + linear interpolation on
 * the certified kernel's sidereal Saturn longitude. If Saturn is not inside the
 * band at the reference instant, the nearest NEXT period is returned (with
 * isActive: false carried in `state`).
 *
 * Method note (honesty): interpolation on 30-day samples gives boundary instants
 * with sub-day accuracy for Saturn (~0.12°/day); the declared tolerance is ±2 days.
 */
export function computeSadeSatiPeriod(query: GocharaQuery): { state: SadeSatiState; period: SadeSatiPeriod } {
  const state = computeGochara(query).sadeSati;
  const t0 = Date.parse(query.referenceInstantUtc);
  const band = bandForMoonRashi(query.natalMoonRashiId);
  const rel = (lon: number) => {
    const d = norm360(lon - band.start);
    return d; // 0..90 inside the band
  };
  const inBand = (lon: number) => rel(lon) < 90;

  const STEP_MS = 10 * DAY_MS;
  /** First-pass horizon: comfortably more than one 7.5y period plus retrograde margin. */
  const BUDGET_MS = 13.5 * 365.25 * DAY_MS;
  /**
   * Adaptive second-pass horizon (charter §9 fail-closed policy): a reference
   * instant near the TAIL of a Sade Sati period can put the next ingress up to
   * ~29.5y (one full Saturn cycle) away. The scan extends once before the
   * solver is allowed to fail closed. Worst-case rare path; typical solve stays
   * on the 13.5y first pass.
   */
  const EXTENDED_BUDGET_MS = 31.5 * 365.25 * DAY_MS;

  /**
   * Shared sample walk: sidereal Saturn longitudes every 10 days from `fromMs`
   * for `count` samples. Crossings of ANY boundary are detected on this array
   * and bisected — retrograde oscillations (a boundary crossed up to three
   * times) are therefore all captured, never aliased.
   */
  const sampleLon = (fromMs: number, count: number): number[] => {
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      out.push(saturnSiderealLon(new Date(fromMs + i * STEP_MS).toISOString()));
    }
    return out;
  };

  interface Crossing { ms: number; boundary: number; direction: 'FORWARD' | 'RETROGRADE_RETURN'; }
  const findCrossings = (samples: number[], fromMs: number, boundaryAbs: number): Crossing[] => {
    const relBoundary = norm360(boundaryAbs - band.start); // in relative frame 0..360
    const crossings: Crossing[] = [];
    for (let i = 1; i < samples.length; i++) {
      const a = norm360(samples[i - 1] - band.start);
      const b = norm360(samples[i] - band.start);
      // forward crossing: a below boundary, b at/above (within the 0..360 wrap frame)
      const aRel = norm360(a - relBoundary);
      const bRel = norm360(b - relBoundary);
      if (aRel > 300 && bRel < 60) {
        // bisect in the raw frame: f(ms) = norm360(lon - boundaryAbs); crossing where f wraps 0
        let lo = fromMs + (i - 1) * STEP_MS;
        let hi = fromMs + i * STEP_MS;
        const f = (ms: number) => norm360(saturnSiderealLon(new Date(ms).toISOString()) - boundaryAbs);
        for (let k = 0; k < 30; k++) {
          const mid = (lo + hi) / 2;
          if (f(mid) < 180) hi = mid; else lo = mid;
        }
        crossings.push({ ms: hi, boundary: boundaryAbs, direction: 'FORWARD' });
      } else if (aRel < 60 && bRel > 300) {
        let lo = fromMs + (i - 1) * STEP_MS;
        let hi = fromMs + i * STEP_MS;
        const f = (ms: number) => norm360(saturnSiderealLon(new Date(ms).toISOString()) - boundaryAbs);
        for (let k = 0; k < 30; k++) {
          const mid = (lo + hi) / 2;
          if (f(mid) >= 180) hi = mid; else lo = mid;
        }
        crossings.push({ ms: hi, boundary: boundaryAbs, direction: 'RETROGRADE_RETURN' });
      }
    }
    return crossings;
  };

  // 1. Locate the period start: if inside the band, walk backward; else forward to next ingress.
  let startMs = 0;
  {
    const firstLon = saturnSiderealLon(query.referenceInstantUtc);
    if (inBand(firstLon)) {
      // walk back in 10-day steps until outside. The contiguous 12th/1st/2nd
      // band lasts ~7.5y (plus retrograde margin), so the walk can need up to
      // ~290 steps before it leaves the band.
      let back = t0;
      let foundStart = 0;
      for (let i = 0; i < 290; i++) {
        back -= STEP_MS;
        if (!inBand(saturnSiderealLon(new Date(back).toISOString()))) {
          const samples = sampleLon(back, 3);
          const cross = findCrossings(samples, back, norm360(band.start));
          if (cross.length > 0) { foundStart = cross[cross.length - 1].ms; break; }
        }
      }
      if (foundStart === 0) throw new GocharaError('BOUNDARY_BRACKET_FAILED', 'Sade Sati start bracket failed', { referenceInstantUtc: query.referenceInstantUtc });
      startMs = foundStart;
    } else {
      let samples = sampleLon(t0, Math.ceil(BUDGET_MS / STEP_MS));
      let fromMs = t0;
      let cross = findCrossings(samples, fromMs, norm360(band.start));
      if (cross.length === 0) {
        // Tail-of-period references: extend the horizon once (see EXTENDED_BUDGET_MS).
        samples = sampleLon(t0, Math.ceil(EXTENDED_BUDGET_MS / STEP_MS));
        cross = findCrossings(samples, fromMs, norm360(band.start));
      }
      if (cross.length === 0) {
        throw new GocharaError('BOUNDARY_BRACKET_FAILED', 'Next Sade Sati ingress not found within 31.5y scan', { referenceInstantUtc: query.referenceInstantUtc });
      }
      startMs = cross[0].ms;
    }
  }

  // 2. Sample from period start over ~13.5y (period ≈ 7.5y + retrograde margin) and
  //    extract ALL crossings of the two interior boundaries and of the exit boundary.
  const windowSamples = sampleLon(startMs, Math.ceil(BUDGET_MS / STEP_MS));
  const janmaBoundary = norm360(band.start + 30);
  const thirdBoundary = norm360(band.start + 60);
  const exitBoundary = norm360(band.start + 90); // the Taurus-side edge: leaving the 2nd rashi from the Moon
  const janmaCrossings = findCrossings(windowSamples, startMs, janmaBoundary);
  const thirdCrossings = findCrossings(windowSamples, startMs, thirdBoundary);
  const exitCrossings = findCrossings(windowSamples, startMs, exitBoundary);
  if (exitCrossings.length === 0) {
    throw new GocharaError('BOUNDARY_BRACKET_FAILED', 'Sade Sati period end not found within 13.5y scan', { startMs });
  }
  const firstExitMs = exitCrossings[0].ms;
  const periodEndMs = exitCrossings[exitCrossings.length - 1].ms;

  const phaseTransitions: SadeSatiTransition[] = [
    ...janmaCrossings.map((c) => ({
      utc: new Date(c.ms).toISOString(),
      event: (c.direction === 'FORWARD' ? 'JANMA_ENTRY' : 'JANMA_RETROGRADE_RETURN') as SadeSatiTransition['event'],
      direction: c.direction
    })),
    ...thirdCrossings.map((c) => ({
      utc: new Date(c.ms).toISOString(),
      event: (c.direction === 'FORWARD' ? 'THIRD_ENTRY' : 'THIRD_RETROGRADE_RETURN') as SadeSatiTransition['event'],
      direction: c.direction
    }))
  ]
    .filter((t) => Date.parse(t.utc) < periodEndMs)
    .sort((a, b) => Date.parse(a.utc) - Date.parse(b.utc));

  return {
    state,
    period: {
      periodStartUtc: new Date(startMs).toISOString(),
      firstExitUtc: new Date(firstExitMs).toISOString(),
      phaseTransitions,
      periodEndUtc: new Date(periodEndMs).toISOString(),
      evidence: {
        bandStartDeg: norm360(band.start),
        bandEndDeg: norm360(band.start + 90),
        saturnSiderealLongitudeDeg: saturnSiderealLon(query.referenceInstantUtc),
        method: 'shared 10-day sample scan + bracketed bisection on certified kernel Saturn sidereal longitude',
        declaredBoundaryToleranceDays: 2,
        periodEndConvention: 'periodEndUtc = FINAL exit (strict band membership: a retrograde dip back into the band, e.g. Makara Oct-2022 to Jan-2023, stays inside the period); firstExitUtc = FIRST departure, the "classical end" most published panchangs print.'
      }
    }
  };
}
