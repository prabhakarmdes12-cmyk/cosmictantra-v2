/**
 * QUALIFICATION TOLERANCE MODEL (Sprint B)
 * Mission Section 5: "Define explicit tolerances. Never hide discrepancies through rounding."
 *
 * Tolerances come from docs/reference-grade/02-validation-gap-analysis.md §3.A:
 *   Sun/Moon ±0.01°, planets ±0.02°, nodes ±0.05°. Ascendant ±0.05° (time-scale +
 *   sidereal-time sensitive; declared here so the value is explicit and versioned).
 *
 * Everything is expressed in ARCSECONDS to avoid rounding-masked comparisons. The runner
 * compares RAW deltas; any divergence above tolerance lands in astronomy-failures.json
 * with full precision, classified — never silently clamped.
 *
 * EXPLAINED divergence classes do not pass silently either: they are recorded as
 * EXPLAINED_DIVERGENCE with a mandatory explanation code and appear in the summary.
 */

export const TOLERANCE_MODEL_VERSION = 'tolerance-model-1.0.0';

/** Explicit per-body-class tolerances in arcseconds (gap-analysis §3.A). */
export const TOLERANCE_TABLE_ARCSEC: Readonly<Record<string, number>> = {
  Sun: 36,        // ±0.01°
  Moon: 36,       // ±0.01°
  Mercury: 72,    // ±0.02°
  Venus: 72,      // ±0.02°
  Mars: 72,       // ±0.02°
  Jupiter: 72,    // ±0.02°
  Saturn: 72,     // ±0.02°
  Rahu: 180,      // ±0.05° (mean-node analytic reference)
  Ketu: 180,      // ±0.05°
  Ascendant: 180  // ±0.05° (LST + obliquity + ΔT sensitive)
};

/**
 * Documented bands in which a KNOWN reference-time-scale divergence is expected.
 * A divergence inside these bands is still recorded (with full precision) and
 * classified EXPLAINED_DIVERGENCE with the explanation code — it counts against
 * neither MATCH nor DEFECT, and it is always visible in summary statistics.
 *
 * DELTAT_EXTRAPOLATION_BEYOND_2050:
 *   Beyond ~2050 the TT–UT(ΔT) extrapolation models diverge: astronomy-engine uses
 *   the Espenak–Meeus polynomial extrapolation while JPL Horizons freezes the last
 *   known leap-second. The Moon moves ~0.55"/s of time, so a ΔΔT of ~60 s produces
 *   ~33" lunar divergence. Band multiplier 3 (108") covers the measured 2100 case
 *   (≈78"); anything beyond is a hard REFERENCE_DIVERGENCE (blocking).
 */
export const EXPLAINED_DIVERGENCE_BANDS: ReadonlyArray<{
  bandId: string;
  fromUtc: string;
  appliesToPoints: readonly string[];
  toleranceMultiplier: number;
  explanationCode: string;
  basis: string;
}> = [
  {
    bandId: 'DELTAT_EXTRAPOLATION_BEYOND_2050',
    fromUtc: '2050-01-01T00:00:00.000Z',
    appliesToPoints: ['Moon'],
    toleranceMultiplier: 3,
    explanationCode: 'DELTAT_EXTRAPOLATION_BEYOND_2050',
    basis:
      'ΔT extrapolation divergence (Espenak–Meeus vs JPL frozen leap-second UTC) grows beyond 2050; ' +
      'Moon moves ~0.55 arcsec per second of time. Measured 2100 Moon divergence ≈ 78" with 36" base tolerance.'
  }
];

export type ComparisonClassification =
  | 'MATCH'
  | 'WITHIN_TOLERANCE'
  | 'EXPLAINED_DIVERGENCE'
  | 'REFERENCE_DIVERGENCE'
  | 'NOT_CALCULATED'
  | 'COSMICTANTRA_DEFECT'
  | 'CONVENTION_DIFFERENCE';

export interface DivergenceRecord {
  fixtureId: string;
  scenarioId: string;
  point: string;
  utcTimestamp: string;
  expectedDeg: number;
  actualDeg: number;
  deltaArcsec: number;
  toleranceArcsec: number;
  classification: ComparisonClassification;
  explanationCode?: string;
  explanationBasis?: string;
}

/** Signed shortest-arc delta, in arcseconds. */
export function arcsecDelta(expectedDeg: number, actualDeg: number): number {
  let d = actualDeg - expectedDeg;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d * 3600;
}

/**
 * Classifies one raw comparison against the tolerance table and explained bands.
 * The function NEVER mutates or rounds the delta it is given.
 */
export function classifyComparison(input: {
  point: string;
  utcTimestamp: string;
  deltaArcsec: number;
}): { classification: ComparisonClassification; toleranceArcsec: number; explanationCode?: string; explanationBasis?: string } {
  const base = TOLERANCE_TABLE_ARCSEC[input.point];
  if (base === undefined) {
    return { classification: 'NOT_CALCULATED', toleranceArcsec: NaN };
  }
  const band = EXPLAINED_DIVERGENCE_BANDS.find(b =>
    b.appliesToPoints.includes(input.point) &&
    Date.parse(input.utcTimestamp) >= Date.parse(b.fromUtc)
  );
  const tolerance = band ? base * band.toleranceMultiplier : base;
  const abs = Math.abs(input.deltaArcsec);

  if (abs <= base) return { classification: 'MATCH', toleranceArcsec: tolerance };
  if (band && abs <= tolerance) {
    return {
      classification: 'EXPLAINED_DIVERGENCE',
      toleranceArcsec: tolerance,
      explanationCode: band.explanationCode,
      explanationBasis: band.basis
    };
  }
  return { classification: 'REFERENCE_DIVERGENCE', toleranceArcsec: tolerance };
}
