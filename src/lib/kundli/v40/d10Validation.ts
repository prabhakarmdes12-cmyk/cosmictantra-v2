/**
 * KUNDLI V40 — D10 Dashamsha validation harness (§19).
 *
 * The kernel already computes all sixteen vargas. D10 is the only new varga
 * V40 considers, and it is NOT trusted merely because it exists.
 *
 * This module holds:
 *   1. an INDEPENDENT re-implementation of the classical Dashamsha rule,
 *      written from the rule statement rather than from vargaEngine's code;
 *   2. a comparator that checks the kernel's D10 against it for any chart;
 *   3. the promotion gate. `D10_PROMOTION` is the single place that decides
 *      whether D10 may influence a conclusion. It is currently
 *      VALIDATION_PENDING, so career synthesis must record D10 as an
 *      unavailable factor and lose evidence coverage for it.
 *
 * Classical rule applied (BPHS, Dashamsha):
 *   each rashi is divided into ten parts of 3°;
 *   from an ODD  rashi the parts are counted from that rashi itself;
 *   from an EVEN rashi the parts are counted from the 9th rashi from it.
 */

import type { KundliCanonicalModel } from '../types';
import type { CapabilityStatus } from './contentTypes';

export const D10_VALIDATION_VERSION = 'd10-validation-v1';

/**
 * Promotion gate.
 *
 * VERIFIED_FOR_REPORT requires agreement with an INDEPENDENT external
 * reference (a licensed ephemeris/varga table), which this repository does not
 * hold. Cross-implementation agreement and hand-computed boundary fixtures are
 * necessary but not sufficient, so the gate stays closed.
 */
export const D10_PROMOTION: {
  status: CapabilityStatus;
  mayInfluenceConclusions: boolean;
  reason: string;
} = {
  status: 'VALIDATION_PENDING',
  mayInfluenceConclusions: false,
  reason:
    'D10 agrees with an independent re-implementation of the classical rule and with hand-computed ' +
    'boundary fixtures (see docs/kundli-v40/07-d10-validation.md), but it has not been compared against ' +
    'an external licensed reference. Until it has, D10 is displayed for reference only and is used in no conclusion.',
};

export const SIGN_NAMES_SANSKRIT = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

export interface D10Placement {
  /** 1..12. */
  signId: number;
  signName: string;
  /** Which of the ten parts of the natal sign, 1..10. */
  part: number;
  /** Degree inside the D10 sign, 0..30. */
  divisionDegree: number;
}

/**
 * Independent reference implementation. Written directly from the rule, with
 * no reference to vargaEngine's switch statement.
 */
export function referenceDashamsha(siderealLongitudeDeg: number): D10Placement {
  const norm = ((siderealLongitudeDeg % 360) + 360) % 360;
  const signIndex0 = Math.floor(norm / 30);            // 0..11
  const degreeInSign = norm - signIndex0 * 30;         // 0..30
  const part0 = Math.min(Math.floor(degreeInSign / 3), 9); // 0..9
  const signNumber = signIndex0 + 1;                   // 1..12
  const isOdd = signNumber % 2 === 1;
  // Odd: start at the sign itself. Even: start at the 9th from it (+8 steps).
  const start0 = isOdd ? signIndex0 : (signIndex0 + 8) % 12;
  const target0 = (start0 + part0) % 12;
  return {
    signId: target0 + 1,
    signName: SIGN_NAMES_SANSKRIT[target0],
    part: part0 + 1,
    divisionDegree: (degreeInSign - part0 * 3) * 10,
  };
}

export interface D10Comparison {
  graha: string;
  longitudeDeg: number;
  engineSign: string;
  referenceSign: string;
  agrees: boolean;
}

export interface D10ValidationReport {
  version: string;
  promotion: typeof D10_PROMOTION;
  comparisons: D10Comparison[];
  lagna: { engineSign: string | null; referenceSign: string; agrees: boolean | null };
  allAgree: boolean;
  disagreements: D10Comparison[];
}

/**
 * Compares the canonical D10 (produced by vargaEngine inside the kernel)
 * against the reference implementation, for one chart.
 */
export function validateD10(canonical: KundliCanonicalModel): D10ValidationReport {
  const d10 = canonical.divisionalCharts.find((c) => c.division === 10);
  const comparisons: D10Comparison[] = canonical.planets.map((p) => {
    const engineSign = d10?.planets.find((x) => x.id === p.id)?.sign ?? '';
    const reference = referenceDashamsha(p.longitudeDeg);
    return {
      graha: p.id,
      longitudeDeg: p.longitudeDeg,
      engineSign,
      referenceSign: reference.signName,
      agrees: engineSign === reference.signName,
    };
  });

  const refLagna = referenceDashamsha(canonical.ascendant.longitudeDeg);
  const engineLagna = d10?.lagnaSign ?? null;

  const disagreements = comparisons.filter((c) => !c.agrees);
  return {
    version: D10_VALIDATION_VERSION,
    promotion: D10_PROMOTION,
    comparisons,
    lagna: {
      engineSign: engineLagna,
      referenceSign: refLagna.signName,
      agrees: engineLagna === null ? null : engineLagna === refLagna.signName,
    },
    allAgree: disagreements.length === 0 && (engineLagna === null || engineLagna === refLagna.signName),
    disagreements,
  };
}
