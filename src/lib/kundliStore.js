/**
 * LIVING KUNDLI STORE (PROGRAM 4 / TRUST-02)
 * ==========================================
 * ONE PERSON → ONE PERSISTENT BIRTH RECORD → ONE canonical Jyotish state.
 *
 * A saved Kundli lives at a stable id (`/kundli/{id}`). It stores the birth
 * INPUT (exactly as entered), the RESOLVED birth context (coords, tz, offset),
 * the birth-time confidence, and the convention set. The canonical snapshot is
 * always re-derived from these — never divergently cached — so the record is a
 * single source of truth.
 *
 * TRUST GUARANTEES:
 *  - Birthplace is NEVER silently remapped. `locationSource` records how coords
 *    were obtained; INV_LOCATION_001 fires if a place string is used without the
 *    user confirming the resolved coordinates. (see resolveLocation)
 *  - Ownership: each record carries an `ownerKey`. Reading a record whose owner
 *    differs from the current owner is refused (no cross-user IDOR). Locally the
 *    ownerKey is the device; server-side it maps to the authenticated user.
 *  - localStorage-first (DPDP: zero PII leaves the device on the free tier),
 *    with an identical contract to the future DB-backed model.
 */

import { resolveConventions } from './pro/conventions.js';

const STORAGE_KEY = 'cosmictantra_kundlis_v1';
const OWNER_KEY = 'cosmictantra_owner_key';

export const BIRTH_TIME_CONFIDENCE = {
  EXACT: 'EXACT',           // known to the minute (records, hospital)
  APPROXIMATE: 'APPROXIMATE', // rounded / remembered ("around 10:30")
  UNKNOWN: 'UNKNOWN',       // birth time not known → time-independent features only
};

export const LOCATION_SOURCE = {
  CITY_DB: 'CITY_DB',           // chosen from the verified city database
  MANUAL_COORDS: 'MANUAL_COORDS', // user entered exact lat/long/tz
  CONFIRMED_GEOCODE: 'CONFIRMED_GEOCODE', // geocoded then explicitly confirmed
  UNCONFIRMED: 'UNCONFIRMED',   // NOT usable for calculation until confirmed
};

/** INV_LOCATION_001 — a place must never be silently resolved to a city. */
export const INV_LOCATION_001 = {
  code: 'INV_LOCATION_001',
  message: 'Birthplace coordinates must be inspected and confirmed before calculation. A place name is never silently remapped to a different city.',
};

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

/** Stable per-device owner key (server maps to authenticated user id). */
export function getOwnerKey() {
  if (typeof window === 'undefined') return 'server';
  let k = localStorage.getItem(OWNER_KEY);
  if (!k) {
    k = `own_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(OWNER_KEY, k);
  }
  return k;
}

function readAll() {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

function writeAll(list) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** All kundlis owned by the current owner (never returns others'). */
export function listKundlis() {
  const owner = getOwnerKey();
  return readAll().filter((k) => k.ownerKey === owner);
}

/**
 * Load a kundli by id WITH ownership enforcement.
 * Returns { ok, kundli } or { ok:false, error } — a foreign id yields
 * FORBIDDEN, a missing id yields NOT_FOUND (no data leak either way).
 */
export function getKundli(id) {
  const owner = getOwnerKey();
  const rec = readAll().find((k) => k.id === id);
  if (!rec) return { ok: false, error: 'NOT_FOUND' };
  if (rec.ownerKey !== owner) return { ok: false, error: 'FORBIDDEN' };
  return { ok: true, kundli: rec };
}

export function newId() {
  return `kdl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Validate a birth context before it may be used for calculation.
 * Enforces INV_LOCATION_001 and required fields.
 */
export function validateBirthContext(ctx) {
  const errors = [];
  if (!ctx.birthDate) errors.push({ field: 'birthDate', message: 'Birth date is required.' });
  if (!ctx.locationSource || ctx.locationSource === LOCATION_SOURCE.UNCONFIRMED) {
    errors.push({ ...INV_LOCATION_001, field: 'location' });
  }
  if (ctx.latitude == null || ctx.longitude == null || ctx.timezone == null) {
    errors.push({ field: 'coordinates', message: 'Latitude, longitude and timezone must be set and inspected.' });
  }
  if (ctx.birthTimeConfidence === BIRTH_TIME_CONFIDENCE.UNKNOWN && ctx.birthTime) {
    // allowed, but flag that the time will be treated as a chosen default
  }
  if ((ctx.birthTimeConfidence === BIRTH_TIME_CONFIDENCE.EXACT
    || ctx.birthTimeConfidence === BIRTH_TIME_CONFIDENCE.APPROXIMATE) && !ctx.birthTime) {
    errors.push({ field: 'birthTime', message: 'A birth time is required for EXACT/APPROXIMATE confidence.' });
  }
  return { valid: errors.length === 0, errors };
}

/** Birth params for the engine, honouring UNKNOWN time (noon default, flagged). */
export function toBirthParams(rec) {
  const timeUnknown = rec.birthTimeConfidence === BIRTH_TIME_CONFIDENCE.UNKNOWN;
  return {
    birthDate: rec.birthDate,
    birthTime: timeUnknown ? (rec.birthTime || '12:00') : rec.birthTime,
    latitude: rec.latitude,
    longitude: rec.longitude,
    timezone: rec.timezone,
    locationName: rec.place || 'Custom location',
  };
}

/**
 * Create or update a kundli. Refuses to save an unconfirmed location and
 * enforces ownership on update.
 */
export function saveKundli(input) {
  const owner = getOwnerKey();
  const conventions = resolveConventions(input.conventions);
  const { valid, errors } = validateBirthContext(input);
  if (!valid) return { ok: false, errors };

  const list = readAll();
  const now = new Date().toISOString();

  if (input.id) {
    const idx = list.findIndex((k) => k.id === input.id);
    if (idx >= 0) {
      if (list[idx].ownerKey !== owner) return { ok: false, error: 'FORBIDDEN' };
      list[idx] = { ...list[idx], ...input, conventions, ownerKey: owner, updatedAt: now };
      writeAll(list);
      return { ok: true, kundli: list[idx] };
    }
  }
  const rec = {
    ...input,
    id: input.id || newId(),
    ownerKey: owner,
    conventions,
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(rec);
  writeAll(list);
  return { ok: true, kundli: rec };
}

export function deleteKundli(id) {
  const owner = getOwnerKey();
  const list = readAll();
  const rec = list.find((k) => k.id === id);
  if (!rec) return { ok: false, error: 'NOT_FOUND' };
  if (rec.ownerKey !== owner) return { ok: false, error: 'FORBIDDEN' };
  writeAll(list.filter((k) => k.id !== id));
  return { ok: true };
}

/** Workspace sections (spec order) for the Living Kundli nav. */
export const KUNDLI_SECTIONS = [
  'Overview', 'Birth', 'Charts', 'Planets', 'Bhavas', 'Nakshatra', 'Vargas',
  'Dasha', 'Bala', 'Ashtakavarga', 'Avastha', 'Yoga & Dosha', 'Jaimini', 'KP',
  'Gochar', 'Varshaphala', 'Panchang', 'Timeline', 'Reports', 'Ask Kashi',
];

export default {
  BIRTH_TIME_CONFIDENCE, LOCATION_SOURCE, INV_LOCATION_001, KUNDLI_SECTIONS,
  getOwnerKey, listKundlis, getKundli, saveKundli, deleteKundli,
  validateBirthContext, toBirthParams, newId,
};
