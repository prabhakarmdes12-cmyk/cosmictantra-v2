/**
 * FAILURE STATES (PROGRAM 9 / TRUST-08)
 * =====================================
 * Deterministic, honest handling of every foreseeable failure. The deterministic
 * core MUST keep working when optional services (AI, network, cloud) are down.
 *
 * Each guard returns { ok, code, message, degraded } so the UI can show a clear
 * state instead of a blank screen or a lie.
 */

import { validateBirthContext, INV_LOCATION_001 } from '../kundliStore.js';

export const FAILURE = {
  PLACE_UNCONFIRMED: 'PLACE_UNCONFIRMED',
  TIMEZONE_MISSING: 'TIMEZONE_MISSING',
  UNSUPPORTED_DATE: 'UNSUPPORTED_DATE',
  CORRUPT_SNAPSHOT: 'CORRUPT_SNAPSHOT',
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',
  CLOUD_UNAVAILABLE: 'CLOUD_UNAVAILABLE',
  REPORT_EMPTY: 'REPORT_EMPTY',
};

/** Birth input guard — reuses the trust rules (never silently remaps a place). */
export function guardBirthInput(ctx) {
  const { valid, errors } = validateBirthContext(ctx);
  if (valid) return { ok: true };
  const locErr = errors.find((e) => e.code === INV_LOCATION_001.code);
  if (locErr) return { ok: false, code: FAILURE.PLACE_UNCONFIRMED, message: locErr.message, degraded: false };
  const tzErr = errors.find((e) => e.field === 'coordinates');
  if (tzErr) return { ok: false, code: FAILURE.TIMEZONE_MISSING, message: tzErr.message, degraded: false };
  return { ok: false, code: 'INPUT_INVALID', message: errors[0]?.message || 'Invalid birth input', degraded: false, errors };
}

/** Supported date range for the deterministic engine. */
export function guardDate(birthDate) {
  const y = new Date(birthDate).getFullYear();
  if (isNaN(y)) return { ok: false, code: FAILURE.UNSUPPORTED_DATE, message: 'Unreadable date.', degraded: false };
  if (y < 1800 || y > 2200) {
    return { ok: false, code: FAILURE.UNSUPPORTED_DATE, message: `Dates outside 1800–2200 are not supported by the deterministic engine (got ${y}). Results would be unreliable, so we decline rather than guess.`, degraded: false };
  }
  return { ok: true };
}

/** Snapshot integrity — detect a corrupt/partial stored snapshot. */
export function guardSnapshot(kundali) {
  if (!kundali || !kundali.lagna || !kundali.planets || !kundali.houses) {
    return { ok: false, code: FAILURE.CORRUPT_SNAPSHOT, message: 'Stored chart is incomplete or corrupt. Recalculate from birth details.', degraded: false };
  }
  const planetCount = Array.isArray(kundali.planets) ? kundali.planets.length : Object.keys(kundali.planets).length;
  if (planetCount < 9 || kundali.houses.length !== 12) {
    return { ok: false, code: FAILURE.CORRUPT_SNAPSHOT, message: 'Stored chart is missing grahas or bhavas. Recalculate from birth details.', degraded: false };
  }
  return { ok: true };
}

/**
 * Kashi/AI availability. When the AI layer is down, deterministic answers still
 * work — we return degraded:true, not a failure, because the evidence graph and
 * grounded synthesis are deterministic and offline.
 */
export function guardAI(aiAvailable) {
  if (aiAvailable) return { ok: true, degraded: false };
  return {
    ok: true, // deterministic path still works
    degraded: true,
    code: FAILURE.AI_UNAVAILABLE,
    message: 'AI phrasing is unavailable, but grounded, cited answers from the deterministic evidence graph still work.',
  };
}

/** Cloud sync availability — local-first means the app keeps working offline. */
export function guardCloud(cloudAvailable) {
  if (cloudAvailable) return { ok: true, degraded: false };
  return { ok: true, degraded: true, code: FAILURE.CLOUD_UNAVAILABLE, message: 'Cloud sync is offline. Your Kundlis remain available on this device.' };
}

/** A report/book must never render empty. */
export function guardReport(book) {
  if (!book || !book.sections || book.sections.length === 0) {
    return { ok: false, code: FAILURE.REPORT_EMPTY, message: 'Report has no sections. Choose at least one section.', degraded: false };
  }
  return { ok: true };
}

export default { FAILURE, guardBirthInput, guardDate, guardSnapshot, guardAI, guardCloud, guardReport };
