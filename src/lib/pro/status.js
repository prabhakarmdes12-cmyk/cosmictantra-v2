/**
 * COSMICTANTRA — OFFLINE JYOTISH PARITY PROGRAM
 * Truthful qualification status model.
 *
 * RULE 1 — BUILD AND QUALIFY ARE DIFFERENT STATES.
 * A subsystem's implementation status and its qualification status are tracked
 * independently. IMPLEMENTED is acceptable; it is NEVER the same as QUALIFIED.
 */

// How much of the calculation actually exists in code.
export const IMPLEMENTATION_STATUS = {
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  IMPLEMENTED: 'IMPLEMENTED',
};

// How much external / independent trust the calculation has earned.
// This ladder may only advance with evidence.
export const QUALIFICATION_STATUS = {
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  IMPLEMENTED: 'IMPLEMENTED',
  INTERNALLY_VERIFIED: 'INTERNALLY_VERIFIED',
  EXTERNALLY_COMPARED: 'EXTERNALLY_COMPARED',
  PANDIT_REVIEWED: 'PANDIT_REVIEWED',
  QUALIFIED: 'QUALIFIED',
  CONVENTION_DIFFERENCE: 'CONVENTION_DIFFERENCE',
};

// Ordered ladder used by the dashboard to compute progress.
export const QUALIFICATION_LADDER = [
  QUALIFICATION_STATUS.NOT_IMPLEMENTED,
  QUALIFICATION_STATUS.IMPLEMENTED,
  QUALIFICATION_STATUS.INTERNALLY_VERIFIED,
  QUALIFICATION_STATUS.EXTERNALLY_COMPARED,
  QUALIFICATION_STATUS.PANDIT_REVIEWED,
  QUALIFICATION_STATUS.QUALIFIED,
];

/**
 * A capability may NEVER be promoted to QUALIFIED without evidence.
 * This guard is the machine-readable expression of that rule.
 */
export function canPromoteToQualified(capability) {
  if (!capability) return false;
  const beyondCompared =
    capability.qualificationStatus === QUALIFICATION_STATUS.EXTERNALLY_COMPARED ||
    capability.qualificationStatus === QUALIFICATION_STATUS.PANDIT_REVIEWED;
  const hasEvidence = Array.isArray(capability.evidenceIds) && capability.evidenceIds.length > 0;
  return beyondCompared && hasEvidence;
}

// Classification of a difference found during external comparison.
// "A difference is not automatically a bug."
export const DIFFERENCE_CLASS = {
  BUG: 'BUG',
  CONVENTION_DIFFERENCE: 'CONVENTION_DIFFERENCE',
  INPUT_DIFFERENCE: 'INPUT_DIFFERENCE',
  REFERENCE_UNCERTAINTY: 'REFERENCE_UNCERTAINTY',
  UNKNOWN: 'UNKNOWN',
};

// Reference software targeted by the differential queue.
export const REFERENCE_SOFTWARE = {
  PARASHARAS_LIGHT: "Parashara's Light",
  JAGANNATHA_HORA: 'Jagannatha Hora',
  PANDIT_TRUSTED: 'Pandit trusted software',
  PUBLISHED_REFERENCE: 'Published reference chart',
};

export default {
  IMPLEMENTATION_STATUS,
  QUALIFICATION_STATUS,
  QUALIFICATION_LADDER,
  DIFFERENCE_CLASS,
  REFERENCE_SOFTWARE,
  canPromoteToQualified,
};
