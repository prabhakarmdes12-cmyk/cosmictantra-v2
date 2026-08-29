/**
 * EXTERNAL REFERENCE LOADER (PROGRAM 1 / TRUST-01 — qualification intake)
 * ======================================================================
 * Loads an owner/Pandit-supplied external-reference dataset (JSON) and turns it
 * into runnable Jyotish Qualification Lab cases.
 *
 * HONESTY CONTRACT (unchanged): a reference value here is a GENUINE external
 * value (from a named product+version+settings, or a Pandit's own computation).
 * This loader NEVER invents an `expected` value — it only carries what a human
 * recorded. Malformed or empty entries are reported, not silently passed.
 *
 * Dataset shape (see data/qualification/references.template.json):
 * {
 *   "datasetName": "...", "recordedBy": "...",
 *   "subjects": [{
 *     "subjectId": "REF-001",
 *     "birthInput": { birthDate, birthTime, latitude, longitude, timezone, place },
 *     "references": [{
 *       "capabilityId": "lagna.sign", "product": "AstroSage",
 *       "productVersion": "web-2026-08", "settings": { "ayanamsha": "LAHIRI" },
 *       "expected": "Leo", "source": "url/screenshot", "recordedBy": "...", "recordedDate": "YYYY-MM-DD"
 *     }]
 *   }]
 * }
 */

import { CAPABILITY_ACCESSORS } from './qualificationLab.js';

const REQUIRED_BIRTH_FIELDS = ['birthDate', 'latitude', 'longitude', 'timezone'];

/** Validate a dataset. Returns { valid, errors[], warnings[] } — never throws. */
export function validateReferenceDataset(dataset) {
  const errors = [];
  const warnings = [];

  if (!dataset || typeof dataset !== 'object') {
    return { valid: false, errors: ['Dataset is not an object.'], warnings };
  }
  if (!Array.isArray(dataset.subjects)) {
    return { valid: false, errors: ['Dataset.subjects must be an array.'], warnings };
  }

  dataset.subjects.forEach((s, i) => {
    const where = `subjects[${i}] (${s.subjectId || 'no id'})`;
    if (!s.subjectId) errors.push(`${where}: missing subjectId`);
    if (!s.birthInput) { errors.push(`${where}: missing birthInput`); return; }
    for (const f of REQUIRED_BIRTH_FIELDS) {
      if (s.birthInput[f] === undefined || s.birthInput[f] === null || s.birthInput[f] === '') {
        errors.push(`${where}: birthInput.${f} is required`);
      }
    }
    if (!Array.isArray(s.references) || s.references.length === 0) {
      warnings.push(`${where}: no reference values recorded yet (subject will be PENDING_EXTERNAL_REFERENCE)`);
      return;
    }
    s.references.forEach((r, j) => {
      const rw = `${where}.references[${j}]`;
      if (!r.capabilityId) errors.push(`${rw}: missing capabilityId`);
      else if (!CAPABILITY_ACCESSORS[r.capabilityId]) errors.push(`${rw}: unknown capabilityId "${r.capabilityId}" (no accessor)`);
      if (r.expected === undefined || r.expected === null || r.expected === '') {
        warnings.push(`${rw}: empty expected value — will not be scored (kept honest as pending)`);
      }
      if (!r.product && !r.recordedBy) warnings.push(`${rw}: no product or recordedBy — provenance is weak`);
    });
  });

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Convert a validated dataset into runnable lab cases.
 * Subjects with no reference values become one PENDING case per key capability
 * so the gap stays visible (never hidden).
 */
export function datasetToCases(dataset, keyCapabilities = ['lagna.sign', 'moon.sign', 'moon.nakshatra']) {
  const cases = [];
  for (const s of (dataset.subjects || [])) {
    const refs = Array.isArray(s.references) ? s.references.filter((r) => r.expected !== undefined && r.expected !== null && r.expected !== '') : [];
    if (refs.length === 0) {
      for (const capabilityId of keyCapabilities) {
        cases.push({ subjectId: s.subjectId, birthInput: s.birthInput, capabilityId, expected: null });
      }
      continue;
    }
    for (const r of refs) {
      cases.push({
        subjectId: s.subjectId,
        birthInput: s.birthInput,
        capabilityId: r.capabilityId,
        cosmicTantraSettings: r.settings || null,
        expected: r.expected,
        reference: { product: r.product || null, productVersion: r.productVersion || null, settings: r.settings || null, source: r.source || null },
        reviewer: r.recordedBy || dataset.recordedBy || null,
        reviewDate: r.recordedDate || null,
      });
    }
  }
  return cases;
}

/** Count how many genuine external reference values a dataset carries. */
export function externalReferenceCount(dataset) {
  let n = 0;
  for (const s of (dataset?.subjects || [])) {
    for (const r of (s.references || [])) {
      if (r.expected !== undefined && r.expected !== null && r.expected !== '') n++;
    }
  }
  return n;
}

export default { validateReferenceDataset, datasetToCases, externalReferenceCount };
