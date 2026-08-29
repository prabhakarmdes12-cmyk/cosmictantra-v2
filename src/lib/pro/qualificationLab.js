/**
 * JYOTISH QUALIFICATION LAB (PROGRAM 1 / TRUST-01)
 * ================================================
 * A structured place to prove — with EXTERNAL reference evidence — that
 * CosmicTantra's calculations match reality, and to classify every difference
 * honestly.
 *
 * HONESTY CONTRACT:
 *   - A test case only becomes MATCH / WITHIN_TOLERANCE when an EXTERNAL
 *     reference value (from a named product + version + settings, or a
 *     Pandit-supplied value) is present. Internal self-consistency is NOT proof.
 *   - When no external reference has been supplied yet, the case classification
 *     is PENDING_EXTERNAL_REFERENCE — never silently "passed".
 *   - Nothing here promotes a capability to QUALIFIED on its own; that requires
 *     a reviewer to sign off on genuine external comparison.
 */

import { professionalChart } from './index.js';
import { resolveConventions } from './conventions.js';

export const CLASSIFICATION = {
  MATCH: 'MATCH',                                 // exact match with external reference
  WITHIN_TOLERANCE: 'WITHIN_TOLERANCE',           // within documented tolerance
  CONVENTION_DIFFERENCE: 'CONVENTION_DIFFERENCE', // differs only due to a known convention choice
  COSMICTANTRA_DEFECT: 'COSMICTANTRA_DEFECT',     // our error — must be fixed
  REFERENCE_UNCERTAIN: 'REFERENCE_UNCERTAIN',     // reference product itself is suspect
  INPUT_DISAGREEMENT: 'INPUT_DISAGREEMENT',       // birth input interpreted differently
  UNRESOLVED: 'UNRESOLVED',                        // needs human review
  PENDING_EXTERNAL_REFERENCE: 'PENDING_EXTERNAL_REFERENCE', // no external value supplied yet
};

/**
 * A capability accessor extracts the comparable ACTUAL value from a computed
 * professional chart. Keyed by capabilityId used across the platform.
 */
export const CAPABILITY_ACCESSORS = {
  'lagna.sign': (chart) => chart.kundali.lagna.rashiEn,
  'lagna.longitude': (chart) => round(chart.kundali.lagna.longitude, 4),
  'moon.sign': (chart) => chart.kundali.moon.rashiEn,
  'moon.nakshatra': (chart) => chart.kundali.moon.nakshatra?.name,
  'sun.sign': (chart) => chart.kundali.planets.Sun.rashiEn,
  'sun.longitude': (chart) => round(chart.kundali.planets.Sun.longitude, 4),
  'ayanamsha': (chart) => round(chart.kundali.ayanamsha, 4),
  'ashtakavarga.sav': (chart) => chart.ashtakavarga.sarva?.total ?? chart.ashtakavarga.savTotal,
  'vimshottari.mahadashaLord': (chart) => currentMahaLord(chart),
};

function round(x, n) {
  if (typeof x !== 'number' || !isFinite(x)) return x;
  const f = Math.pow(10, n);
  return Math.round(x * f) / f;
}

function currentMahaLord(chart) {
  const v = chart.vimshottari;
  const now = Date.now();
  const active = (v.periods || v.mahadashas || []).find((p) => {
    const s = new Date(p.start).getTime();
    const e = new Date(p.end).getTime();
    return now >= s && now < e;
  });
  return active?.lord || null;
}

/**
 * Default numeric tolerances (degrees) per capability family. Sign/nakshatra
 * comparisons are exact; longitudes carry a small tolerance for rounding and
 * documented sub-arc-minute differences between engines.
 */
export const TOLERANCE = {
  longitude: 0.05,   // degrees (~3 arc-minutes)
  ayanamsha: 0.02,
  numeric: 1,
};

function toleranceFor(capabilityId) {
  if (capabilityId.endsWith('.longitude')) return TOLERANCE.longitude;
  if (capabilityId === 'ayanamsha') return TOLERANCE.ayanamsha;
  return TOLERANCE.numeric;
}

/**
 * Run a single qualification test case.
 * A case with `expected == null` (no external reference yet) is honestly
 * reported as PENDING_EXTERNAL_REFERENCE.
 */
export function runCase(testCase) {
  const {
    subjectId, birthInput, cosmicTantraSettings, capabilityId,
    expected, reference, reviewer, reviewDate,
  } = testCase;

  const conv = resolveConventions(cosmicTantraSettings);
  const chart = professionalChart(birthInput, { conventions: conv });
  const accessor = CAPABILITY_ACCESSORS[capabilityId];
  const actual = accessor ? safe(() => accessor(chart)) : { error: `no accessor for ${capabilityId}` };

  const result = {
    subjectId,
    capabilityId,
    normalizedBirthContext: normalizeBirth(birthInput, conv, chart),
    reference: reference || null,
    cosmicTantraSettings: conv,
    expected: expected ?? null,
    actual,
    delta: null,
    classification: CLASSIFICATION.PENDING_EXTERNAL_REFERENCE,
    reviewer: reviewer || null,
    reviewDate: reviewDate || null,
    versions: chart.versions,
  };

  if (expected == null) return result; // honest: nothing to compare against yet

  if (typeof expected === 'number' && typeof actual === 'number') {
    const delta = round(actual - expected, 5);
    result.delta = delta;
    const tol = toleranceFor(capabilityId);
    result.classification = Math.abs(delta) < 1e-9
      ? CLASSIFICATION.MATCH
      : Math.abs(delta) <= tol
        ? CLASSIFICATION.WITHIN_TOLERANCE
        : CLASSIFICATION.UNRESOLVED;
  } else {
    result.classification = String(actual) === String(expected)
      ? CLASSIFICATION.MATCH
      : CLASSIFICATION.UNRESOLVED;
  }
  return result;
}

function normalizeBirth(birthInput, conv, chart) {
  return {
    birthDate: birthInput.birthDate,
    birthTime: birthInput.birthTime,
    latitude: birthInput.latitude,
    longitude: birthInput.longitude,
    timezone: birthInput.timezone,
    place: birthInput.place || birthInput.city || null,
    ayanamsha: conv.ayanamsha,
    julianDay: chart.kundali.julianDay,
  };
}

function safe(fn) {
  try { return fn(); } catch (e) { return { error: String(e && e.message || e) }; }
}

/** Run a corpus and produce an honest summary. */
export function runCorpus(cases) {
  const results = cases.map(runCase);
  const byClass = {};
  for (const k of Object.values(CLASSIFICATION)) byClass[k] = 0;
  for (const r of results) byClass[r.classification]++;
  const externallyCompared = results.filter((r) => r.classification !== CLASSIFICATION.PENDING_EXTERNAL_REFERENCE).length;
  return {
    total: results.length,
    externallyCompared,
    pendingExternalReference: byClass[CLASSIFICATION.PENDING_EXTERNAL_REFERENCE],
    byClassification: byClass,
    results,
  };
}

export default { CLASSIFICATION, CAPABILITY_ACCESSORS, TOLERANCE, runCase, runCorpus };
