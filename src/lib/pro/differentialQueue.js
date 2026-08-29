/**
 * OFFLINE_SOFTWARE_DIFFERENTIAL_QUEUE
 * ===================================
 * As capabilities are implemented, representative outputs are queued for
 * comparison against established software (Parashara's Light, Jagannatha Hora,
 * Pandit-trusted software, published reference charts).
 *
 * A difference is NOT automatically a bug. Each queued item, once compared, is
 * classified: BUG | CONVENTION_DIFFERENCE | INPUT_DIFFERENCE |
 * REFERENCE_UNCERTAINTY | UNKNOWN.
 *
 * Nothing here promotes a capability to QUALIFIED automatically — that requires
 * a recorded comparison + evidence (see status.canPromoteToQualified).
 */

import { DIFFERENCE_CLASS, REFERENCE_SOFTWARE } from './status.js';

// A canonical reference birth chart used for representative outputs.
export const REFERENCE_CASE = {
  id: 'ref.patna.1995',
  label: 'Patna, 15 Jun 1995, 10:30 IST',
  birthDate: '1995-06-15', birthTime: '10:30',
  latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
};

/**
 * The queue. `status: PENDING` means awaiting manual entry of a reference value.
 * `expected: null` means no external number has been entered yet — so the
 * capability MUST NOT be marked QUALIFIED.
 */
export const DIFFERENTIAL_QUEUE = [
  // CRITICAL RELEASE-1 FOLLOW-UP (do not block new waves; do not label QUALIFIED)
  { id: 'dq.shadbala', capabilityId: 'bala.shadbala', metric: 'Shadbala total (Rupas) per planet', case: REFERENCE_CASE.id, targets: [REFERENCE_SOFTWARE.PARASHARAS_LIGHT, REFERENCE_SOFTWARE.JAGANNATHA_HORA], status: 'PENDING', expected: null, classification: DIFFERENCE_CLASS.UNKNOWN },
  { id: 'dq.bhavabala', capabilityId: 'bala.bhavabala', metric: 'Bhava Bala (Rupas) per house', case: REFERENCE_CASE.id, targets: [REFERENCE_SOFTWARE.JAGANNATHA_HORA], status: 'PENDING', expected: null, classification: DIFFERENCE_CLASS.UNKNOWN },
  { id: 'dq.vimshopaka', capabilityId: 'bala.vimshopaka', metric: 'Vimshopaka Bala (/20) per planet', case: REFERENCE_CASE.id, targets: [REFERENCE_SOFTWARE.PARASHARAS_LIGHT], status: 'PENDING', expected: null, classification: DIFFERENCE_CLASS.UNKNOWN },
  { id: 'dq.vargas', capabilityId: 'varga.d9', metric: 'Shodashavarga sign placements', case: REFERENCE_CASE.id, targets: [REFERENCE_SOFTWARE.JAGANNATHA_HORA, REFERENCE_SOFTWARE.PARASHARAS_LIGHT], status: 'PENDING', expected: null, classification: DIFFERENCE_CLASS.UNKNOWN },

  // New-wave representative outputs
  { id: 'dq.sav', capabilityId: 'av.sarva', metric: 'Sarvashtakavarga per sign + total (337 invariant)', case: REFERENCE_CASE.id, targets: [REFERENCE_SOFTWARE.JAGANNATHA_HORA], status: 'PENDING', expected: null, classification: DIFFERENCE_CLASS.UNKNOWN },
  { id: 'dq.vimshottari', capabilityId: 'dasha.vimshottari', metric: 'Vimshottari Maha/Antar boundary dates', case: REFERENCE_CASE.id, targets: [REFERENCE_SOFTWARE.PARASHARAS_LIGHT], status: 'PENDING', expected: null, classification: DIFFERENCE_CLASS.UNKNOWN },
  { id: 'dq.jaimini.ak', capabilityId: 'jaimini.charakaraka', metric: 'Chara Karaka assignment (8-karaka)', case: REFERENCE_CASE.id, targets: [REFERENCE_SOFTWARE.JAGANNATHA_HORA], status: 'PENDING', expected: null, classification: DIFFERENCE_CLASS.UNKNOWN },
  { id: 'dq.kp.sublords', capabilityId: 'kp.sublords', metric: 'Cusp & planet sub-lords', case: REFERENCE_CASE.id, targets: [REFERENCE_SOFTWARE.PANDIT_TRUSTED], status: 'PENDING', expected: null, classification: DIFFERENCE_CLASS.UNKNOWN },
  { id: 'dq.varsha.return', capabilityId: 'varsha.solarreturn', metric: 'Solar return moment (Varsha Pravesh)', case: REFERENCE_CASE.id, targets: [REFERENCE_SOFTWARE.PARASHARAS_LIGHT], status: 'PENDING', expected: null, classification: DIFFERENCE_CLASS.UNKNOWN },
  { id: 'dq.panchang.tithi', capabilityId: 'panchang.reckoning', metric: 'Tithi at sunrise vs instant', case: REFERENCE_CASE.id, targets: [REFERENCE_SOFTWARE.PUBLISHED_REFERENCE], status: 'PENDING', expected: null, classification: DIFFERENCE_CLASS.UNKNOWN },
];

export function queueStats() {
  const total = DIFFERENTIAL_QUEUE.length;
  const pending = DIFFERENTIAL_QUEUE.filter((q) => q.status === 'PENDING').length;
  const compared = DIFFERENTIAL_QUEUE.filter((q) => q.status === 'COMPARED').length;
  const byClass = {};
  for (const c of Object.values(DIFFERENCE_CLASS)) byClass[c] = DIFFERENTIAL_QUEUE.filter((q) => q.classification === c && q.status === 'COMPARED').length;
  return { total, pending, compared, byClass };
}

/**
 * Record a manual comparison result. Returns the updated item. This is the ONLY
 * path that lets a capability advance toward EXTERNALLY_COMPARED — and even then
 * QUALIFIED still requires evidence + review (Rule 1).
 */
export function recordComparison(id, { observed, reference, classification, note }) {
  const item = DIFFERENTIAL_QUEUE.find((q) => q.id === id);
  if (!item) throw new Error(`Unknown queue item ${id}`);
  item.status = 'COMPARED';
  item.observed = observed;
  item.expected = reference;
  item.classification = classification || DIFFERENCE_CLASS.UNKNOWN;
  item.note = note || '';
  item.comparedAt = new Date().toISOString();
  return item;
}

export default { DIFFERENTIAL_QUEUE, REFERENCE_CASE, queueStats, recordComparison };
