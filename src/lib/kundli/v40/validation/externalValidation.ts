/**
 * KUNDLI V40.1 — external validation harness (§11).
 *
 * The V40 release blocked one gate for a reason no amount of internal work can
 * clear: D10 and shadbala agree with our own second implementation, and
 * self-agreement is not correctness. Two implementations of the same
 * misunderstanding agree perfectly.
 *
 * This module is the shape of the answer: a reusable, provider-neutral record
 * of "we computed X, an independent reference computed Y, here is the
 * difference and here is the verdict". It hardcodes no provider, no API and no
 * expected value. Filling it in is a human act — reading a reference, typing
 * what it says, and recording where it came from.
 *
 * It computes no astrology. It compares two numbers that were computed
 * elsewhere and applies a declared tolerance.
 */

export const EXTERNAL_VALIDATION_VERSION = 'external-validation-v1';

/** The quantities worth comparing against an outside reference. */
export type ValidationQuantity =
  | 'LAGNA_LONGITUDE'
  | 'PLANET_LONGITUDE'
  | 'NAKSHATRA'
  | 'NAKSHATRA_PADA'
  | 'D9_SIGN'
  | 'D10_SIGN'
  | 'VIMSHOTTARI_BOUNDARY'
  | 'AYANAMSHA';

export type ValidationStatus =
  /** Not yet attempted. The honest default. */
  | 'NOT_ATTEMPTED'
  /** A reference was consulted and agrees within tolerance. */
  | 'AGREES'
  /** A reference was consulted and disagrees beyond tolerance. */
  | 'DISAGREES'
  /** A reference was consulted but its settings are not comparable. */
  | 'NOT_COMPARABLE'
  /** Attempted, but no reference of adequate provenance was available. */
  | 'REFERENCE_UNAVAILABLE';

export interface BirthInputSummary {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  timezone: string;
  locationName: string;
}

/**
 * The settings a comparison is only meaningful under.
 *
 * Recorded on every case because most apparent disagreements between two
 * Jyotish engines are not calculation errors: they are one engine using a
 * different ayanamsha, a different house system, or true nodes instead of
 * mean. A case that does not record these is not evidence of anything.
 */
export interface ComparisonSettings {
  ayanamsha: string;
  houseSystem: string;
  nodePolicy: string;
  zodiac: 'SIDEREAL' | 'TROPICAL';
}

export interface ExternalValidationCase {
  id: string;
  quantity: ValidationQuantity;
  /** Free-text subject of the comparison, e.g. "Venus" or "MD Rahu start". */
  subject: string;
  birthInput: BirthInputSummary;
  ourSettings: ComparisonSettings;

  /** What CosmicTantra produced. Always filled in — it is ours to know. */
  cosmicTantraResult: string;
  /** Numeric form, when the quantity is numeric. */
  cosmicTantraValue?: number;

  /**
   * The reference. Deliberately a plain string: a name, an edition, a version.
   * No provider is hardcoded anywhere in this codebase.
   */
  referenceName: string;
  referenceResult: string;
  referenceValue?: number;
  /** How the reference was obtained, so the claim is auditable. */
  referenceProvenance?: string;
  /** When the comparison was made. */
  comparedOn?: string;

  /** Tolerance, in the natural unit of the quantity. */
  tolerance: number;
  toleranceUnit: 'DEGREES' | 'ARCMINUTES' | 'DAYS' | 'EXACT_MATCH';

  status: ValidationStatus;
  notes: string;
}

export interface CaseEvaluation {
  id: string;
  /** The status the numbers imply, which may differ from the recorded one. */
  computedStatus: ValidationStatus;
  /** Signed difference (ours minus reference) when both values are numeric. */
  delta: number | null;
  withinTolerance: boolean | null;
  /** Set when the recorded status contradicts the numbers. */
  inconsistency: string | null;
}

/** Normalises an angular difference into -180..180. */
function angularDelta(a: number, b: number): number {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/**
 * Re-derives the verdict from the recorded numbers.
 *
 * The recorded `status` is a human's claim; this is the arithmetic. When they
 * disagree the harness reports it, because a case marked AGREES whose numbers
 * do not agree is worse than no case at all.
 */
export function evaluateCase(c: ExternalValidationCase): CaseEvaluation {
  const bothNumeric = typeof c.cosmicTantraValue === 'number' && typeof c.referenceValue === 'number';

  if (c.status === 'NOT_ATTEMPTED' || c.status === 'REFERENCE_UNAVAILABLE' || c.status === 'NOT_COMPARABLE') {
    return { id: c.id, computedStatus: c.status, delta: null, withinTolerance: null, inconsistency: null };
  }

  let delta: number | null = null;
  let within: boolean | null = null;

  if (c.toleranceUnit === 'EXACT_MATCH') {
    within = c.cosmicTantraResult.trim().toLowerCase() === c.referenceResult.trim().toLowerCase();
  } else if (bothNumeric) {
    const raw = c.toleranceUnit === 'DEGREES' || c.toleranceUnit === 'ARCMINUTES'
      ? angularDelta(c.cosmicTantraValue!, c.referenceValue!)
      : c.cosmicTantraValue! - c.referenceValue!;
    delta = c.toleranceUnit === 'ARCMINUTES' ? raw * 60 : raw;
    within = Math.abs(delta) <= c.tolerance + 1e-9;
  }

  const computedStatus: ValidationStatus = within === null
    ? 'NOT_COMPARABLE'
    : (within ? 'AGREES' : 'DISAGREES');

  const inconsistency = computedStatus !== c.status
    ? `recorded ${c.status} but the numbers say ${computedStatus}`
    : null;

  return { id: c.id, computedStatus, delta, withinTolerance: within, inconsistency };
}

export interface HarnessSummary {
  total: number;
  byStatus: Record<ValidationStatus, number>;
  inconsistencies: string[];
  /** Quantities with no AGREES case at all — the ones still unproven. */
  unvalidatedQuantities: ValidationQuantity[];
  /** True only when every declared quantity has at least one AGREES case. */
  externallyValidated: boolean;
}

export const REQUIRED_QUANTITIES: ValidationQuantity[] = [
  'LAGNA_LONGITUDE', 'PLANET_LONGITUDE', 'NAKSHATRA', 'NAKSHATRA_PADA',
  'D9_SIGN', 'D10_SIGN', 'VIMSHOTTARI_BOUNDARY',
];

export function summariseHarness(cases: ExternalValidationCase[]): HarnessSummary {
  const byStatus = {
    NOT_ATTEMPTED: 0, AGREES: 0, DISAGREES: 0, NOT_COMPARABLE: 0, REFERENCE_UNAVAILABLE: 0,
  } as Record<ValidationStatus, number>;
  const inconsistencies: string[] = [];

  for (const c of cases) {
    byStatus[c.status] += 1;
    const evaluation = evaluateCase(c);
    if (evaluation.inconsistency) inconsistencies.push(`${c.id}: ${evaluation.inconsistency}`);
  }

  const agreed = new Set(cases.filter((c) => c.status === 'AGREES').map((c) => c.quantity));
  const unvalidatedQuantities = REQUIRED_QUANTITIES.filter((q) => !agreed.has(q));

  return {
    total: cases.length,
    byStatus,
    inconsistencies,
    unvalidatedQuantities,
    externallyValidated: unvalidatedQuantities.length === 0 && byStatus.DISAGREES === 0,
  };
}

/**
 * D10 quarantine (§10).
 *
 * Two implementations of the classical dashamsha rule agree on the golden
 * chart. That establishes that our arithmetic is self-consistent, and nothing
 * else. Until a case in this harness carries `quantity: 'D10_SIGN'` with
 * `status: 'AGREES'` against a named outside reference, D10 stays out of every
 * user-facing conclusion.
 */
export const D10_VALIDATION_STATUS = 'INTERNAL_CROSSCHECK_ONLY' as const;

export interface D10Gate {
  status: typeof D10_VALIDATION_STATUS | 'EXTERNALLY_VALIDATED';
  mayInformConclusions: boolean;
  reason: string;
}

export function d10Gate(cases: ExternalValidationCase[]): D10Gate {
  const external = cases.filter((c) => c.quantity === 'D10_SIGN' && c.status === 'AGREES');
  if (external.length === 0) {
    return {
      status: D10_VALIDATION_STATUS,
      mayInformConclusions: false,
      reason: 'D10 agrees with a second in-house implementation of the same rule. '
        + 'Self-agreement proves the arithmetic is consistent, not that the rule was read correctly. '
        + 'No external reference has been compared, so D10 is displayed for reference only.',
    };
  }
  return {
    status: 'EXTERNALLY_VALIDATED',
    mayInformConclusions: true,
    reason: `D10 agrees with ${external.length} external reference case(s): `
      + `${external.map((c) => c.referenceName).join(', ')}.`,
  };
}

/**
 * The register as it stands today.
 *
 * Every case is NOT_ATTEMPTED. That is the accurate state of the world, and
 * writing it down is the point: an empty register is indistinguishable from a
 * register nobody has looked at, whereas this one enumerates exactly which
 * comparisons a reviewer still owes.
 *
 * `cosmicTantraResult` values are the golden fixture's, so a reviewer can open
 * any reference, type its answer into `referenceResult`, set `referenceValue`,
 * flip the status, and the harness does the rest.
 */
/**
 * The chart the register describes.
 *
 * This is validation LEDGER data, not report content: no part of it is ever
 * rendered into a customer PDF, and the only thing the report reads from this
 * module is the gate's verdict. It names no person — a validation case needs a
 * date, a place and a set of settings, and nothing else.
 */
const REFERENCE_CHART_INPUT: BirthInputSummary = {
  date: '1995-06-15',
  time: '10:30',
  latitude: 25.5941,
  longitude: 85.1376,
  timezone: 'Asia/Kolkata',
  locationName: 'Patna, Bihar, India',
};

const REFERENCE_SETTINGS: ComparisonSettings = {
  ayanamsha: 'Lahiri (Chitra Paksha)',
  houseSystem: 'Equal sign (whole-sign from the lagna rashi)',
  nodePolicy: 'Mean node',
  zodiac: 'SIDEREAL',
};

function pending(
  id: string,
  quantity: ValidationQuantity,
  subject: string,
  ours: string,
  oursValue: number | undefined,
  tolerance: number,
  unit: ExternalValidationCase['toleranceUnit'],
  notes: string,
): ExternalValidationCase {
  return {
    id, quantity, subject,
    birthInput: REFERENCE_CHART_INPUT,
    ourSettings: REFERENCE_SETTINGS,
    cosmicTantraResult: ours,
    cosmicTantraValue: oursValue,
    referenceName: '',
    referenceResult: '',
    tolerance,
    toleranceUnit: unit,
    status: 'NOT_ATTEMPTED',
    notes,
  };
}

export const GOLDEN_VALIDATION_REGISTER: ExternalValidationCase[] = [
  pending('EV-01', 'AYANAMSHA', 'Lahiri ayanamsha at birth', '23.7936°', 23.7936, 1, 'ARCMINUTES',
    'One arc-minute. Different Lahiri implementations differ at roughly this scale; more tolerance would hide a real error, less would flag a definitional difference.'),
  pending('EV-02', 'LAGNA_LONGITUDE', 'Ascendant', 'Leo 12.0966° (132.0966° sidereal)', 132.0966, 2, 'ARCMINUTES',
    'Two arc-minutes covers rounding of the birth time to the minute; a larger disagreement means a different ayanamsha or a different latitude.'),
  pending('EV-03', 'PLANET_LONGITUDE', 'Sun', 'Taurus 29.86°', 59.86, 1, 'ARCMINUTES', ''),
  pending('EV-04', 'PLANET_LONGITUDE', 'Moon', 'Sagittarius 28.86°', 268.86, 2, 'ARCMINUTES',
    'The Moon moves about 0.5 arc-minute per minute of time, so this tolerance is really a tolerance on the birth time.'),
  pending('EV-05', 'PLANET_LONGITUDE', 'Saturn', 'Pisces 0.59°', 330.59, 1, 'ARCMINUTES',
    'Saturn sits 35 arc-minutes into Pisces. A sign-boundary case: any disagreement larger than the tolerance changes the sign.'),
  pending('EV-06', 'PLANET_LONGITUDE', 'Rahu (mean node)', 'Libra 9.22°', 189.22, 2, 'ARCMINUTES',
    'Compare against a MEAN node figure. A true-node reference will differ by up to about 1.5 degrees and is NOT_COMPARABLE, not DISAGREES.'),
  pending('EV-07', 'NAKSHATRA', 'Moon nakshatra', 'Uttara Ashadha', undefined, 0, 'EXACT_MATCH', ''),
  pending('EV-08', 'NAKSHATRA_PADA', 'Moon pada', '1', undefined, 0, 'EXACT_MATCH',
    'Pada 1 of Uttara Ashadha begins at 266°40′. The Moon is 2.2 degrees inside it, so this is not a boundary case.'),
  pending('EV-09', 'D9_SIGN', 'D9 Lagna', 'Karka (Cancer)', undefined, 0, 'EXACT_MATCH', ''),
  pending('EV-10', 'D9_SIGN', 'D9 Venus', 'Mesha (Aries)', undefined, 0, 'EXACT_MATCH', ''),
  pending('EV-11', 'D10_SIGN', 'D10 Lagna', 'Dhanu (Sagittarius)', undefined, 0, 'EXACT_MATCH',
    'THE QUARANTINE CASE. Until this reads AGREES against a named reference, D10 informs no conclusion in the report.'),
  pending('EV-12', 'D10_SIGN', 'D10 Sun', 'Tula (Libra)', undefined, 0, 'EXACT_MATCH',
    'Dashamsha rules differ between schools for even signs. Record which rule the reference uses in referenceProvenance.'),
  pending('EV-13', 'VIMSHOTTARI_BOUNDARY', 'Balance of Sun mahadasha at birth', '5y 0m 3d', 5.010267, 1, 'DAYS', 'Rebaselined to the reconciled engine output (Sprint C RSK_009); still awaiting an EXTERNAL reference.'),
  pending('EV-14', 'VIMSHOTTARI_BOUNDARY', 'Rahu mahadasha start', '2017-06-18', undefined, 1, 'DAYS',
    'Compare the date only. Some references report the instant, which will differ by hours without disagreeing.'),
  pending('EV-15', 'VIMSHOTTARI_BOUNDARY', 'Mercury antardasha start inside Rahu', '2025-05-31', undefined, 2, 'DAYS',
    'Antardasha boundaries accumulate the rounding of the mahadasha start, hence the wider tolerance.'),
];
