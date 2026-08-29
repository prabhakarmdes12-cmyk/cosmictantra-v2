/**
 * GOLDEN CORPUS SCAFFOLD (PROGRAM 1 / TRUST-01)
 * =============================================
 * A growing set of real, diverse birth subjects used to qualify CosmicTantra
 * against EXTERNAL references.
 *
 * Target: ≥100 subjects spanning latitude ranges, hemispheres, historic dates,
 * DST-affected zones, and edge cases (polar, high latitude, pre-1900).
 *
 * HONESTY: `expected` (the external reference value) is filled ONLY when a
 * genuine external value has been supplied by the owner or a practising Pandit
 * against a named product+version+settings. Until then it stays `null` and the
 * lab reports the case as PENDING_EXTERNAL_REFERENCE — we never fabricate a
 * reference just to make a green result.
 *
 * The two Patna subjects below are our internally-verified golden invariants
 * (locked by tests/astrology.spec.ts). They carry `internalGolden: true` and are
 * used for regression, NOT presented as external qualification.
 */

// --- Internal golden invariants (regression anchors, not external proof) ---
export const INTERNAL_GOLDEN = [
  {
    subjectId: 'GC-INT-001',
    label: 'Patna 1995',
    internalGolden: true,
    birthInput: { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, place: 'Patna, Bihar, India' },
    invariants: { 'lagna.sign': 'Leo', 'moon.sign': 'Sagittarius', 'moon.nakshatra': 'Uttara Ashadha' },
  },
  {
    subjectId: 'GC-INT-002',
    label: 'Patna 1992',
    internalGolden: true,
    birthInput: { birthDate: '1992-10-24', birthTime: '06:45', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, place: 'Patna, Bihar, India' },
    invariants: { 'lagna.sign': 'Libra', 'moon.sign': 'Virgo' },
  },
];

/**
 * Diverse subject SLOTS awaiting external reference values.
 * Coordinates/timezones are real; `references` is an empty array until an
 * external product value or Pandit value is recorded (see recordReference()).
 */
export const CORPUS_SLOTS = [
  slot('GC-001', '1980-01-01', '00:01', 28.6139, 77.2090, 5.5, 'New Delhi, India'),
  slot('GC-002', '1975-08-15', '14:20', 19.0760, 72.8777, 5.5, 'Mumbai, India'),
  slot('GC-003', '1988-12-25', '23:45', 13.0827, 80.2707, 5.5, 'Chennai, India'),
  slot('GC-004', '1990-03-21', '06:00', 22.5726, 88.3639, 5.5, 'Kolkata, India'),
  slot('GC-005', '2001-09-11', '08:46', 40.7128, -74.0060, -5, 'New York, USA'),
  slot('GC-006', '1969-07-20', '20:17', 51.5074, -0.1278, 0, 'London, UK'),
  slot('GC-007', '1985-05-05', '12:00', -33.8688, 151.2093, 11, 'Sydney, Australia'),
  slot('GC-008', '1999-12-31', '18:30', 35.6762, 139.6503, 9, 'Tokyo, Japan'),
  slot('GC-009', '1963-11-22', '12:30', 32.7767, -96.7970, -6, 'Dallas, USA'),
  slot('GC-010', '1947-08-15', '00:00', 28.6139, 77.2090, 5.5, 'New Delhi (Independence)'),
  // High-latitude / edge cases
  slot('GC-011', '1980-06-21', '02:00', 64.1466, -21.9426, 0, 'Reykjavik, Iceland (near-midnight-sun)'),
  slot('GC-012', '1970-12-21', '11:00', 60.1699, 24.9384, 2, 'Helsinki, Finland (winter solstice)'),
  slot('GC-013', '1899-01-15', '09:15', 25.5941, 85.1376, 5.5, 'Patna pre-1900 boundary'),
  slot('GC-014', '2016-02-29', '15:00', 12.9716, 77.5946, 5.5, 'Bengaluru leap day'),
  slot('GC-015', '1982-07-04', '03:33', 34.0522, -118.2437, -7, 'Los Angeles (DST)'),
];

function slot(subjectId, birthDate, birthTime, latitude, longitude, timezone, place) {
  return {
    subjectId,
    birthInput: { birthDate, birthTime, latitude, longitude, timezone, place },
    references: [], // externally-supplied reference values go here
  };
}

/**
 * Record an external reference value for a subject+capability.
 * This is how the corpus becomes genuine qualification evidence.
 */
export function recordReference(slotObj, {
  capabilityId, product, productVersion, settings, expected, source, recordedBy, recordedDate,
}) {
  slotObj.references.push({
    capabilityId, product, productVersion, settings: settings || null,
    expected, source: source || null, recordedBy: recordedBy || null,
    recordedDate: recordedDate || new Date().toISOString().slice(0, 10),
  });
  return slotObj;
}

/** Flatten corpus slots into runnable qualification cases. */
export function corpusToCases() {
  const cases = [];
  for (const slot of CORPUS_SLOTS) {
    if (slot.references.length === 0) {
      // Emit a PENDING case per key capability so the gap is visible, not hidden.
      for (const capabilityId of ['lagna.sign', 'moon.sign', 'moon.nakshatra']) {
        cases.push({ subjectId: slot.subjectId, birthInput: slot.birthInput, capabilityId, expected: null });
      }
    } else {
      for (const ref of slot.references) {
        cases.push({
          subjectId: slot.subjectId,
          birthInput: slot.birthInput,
          capabilityId: ref.capabilityId,
          cosmicTantraSettings: ref.settings,
          expected: ref.expected,
          reference: { product: ref.product, productVersion: ref.productVersion, settings: ref.settings, source: ref.source },
          reviewer: ref.recordedBy,
          reviewDate: ref.recordedDate,
        });
      }
    }
  }
  return cases;
}

export function corpusStats() {
  const total = CORPUS_SLOTS.length + INTERNAL_GOLDEN.length;
  const withExternalRef = CORPUS_SLOTS.filter((s) => s.references.length > 0).length;
  return {
    targetSubjects: 100,
    currentSubjects: total,
    internalGoldenAnchors: INTERNAL_GOLDEN.length,
    slotsWithExternalReference: withExternalRef,
    slotsPendingExternalReference: CORPUS_SLOTS.length - withExternalRef,
    externalQualificationCoverage: `${withExternalRef}/${CORPUS_SLOTS.length}`,
    honestStatus: withExternalRef === 0
      ? 'NO EXTERNAL REFERENCES RECORDED YET — corpus scaffold ready, awaiting owner/Pandit-supplied reference values'
      : `${withExternalRef} subjects have external reference values`,
  };
}

export default { INTERNAL_GOLDEN, CORPUS_SLOTS, recordReference, corpusToCases, corpusStats };
