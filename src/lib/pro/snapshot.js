/**
 * CANONICAL SNAPSHOT + DERIVATION CACHE
 * =====================================
 * A Kundali is calculated ONCE from birth parameters (the canonical snapshot).
 * Every professional calculation (vargas, ashtakavarga, dasha, jaimini, ...) is
 * a PURE derivation of that immutable snapshot.
 *
 * Performance contract (from the parity program):
 *   - Changing D1 → D9 → D10 → D60 must feel instantaneous.
 *   - No network requests for deterministic calculations.
 *   - Immutable derived calculations are cached keyed by the snapshot identity.
 *
 * This module is the single source of truth for "compute once, derive many".
 */

import { calculateKundali } from '../astrologyEngine.js';

// Stable key from birth parameters — identifies an immutable snapshot.
export function snapshotKey(params) {
  const p = params || {};
  const lat = Number(p.latitude ?? p.birthLat ?? 0);
  const lon = Number(p.longitude ?? p.birthLon ?? 0);
  const tz = Number(p.timezone ?? 5.5);
  return [p.birthDate, p.birthTime || '12:00', lat.toFixed(4), lon.toFixed(4), tz].join('|');
}

// WeakMap keyed by the kundali object so derivations garbage-collect with it.
const _derivationCache = new WeakMap();

/**
 * Build (or reuse) the canonical snapshot for birth parameters.
 * The returned object is the exact output of the protected canonical engine,
 * augmented with a `_key` and a `derive()` memoizer.
 */
const _snapshotCache = new Map();
export function getSnapshot(params) {
  const key = snapshotKey(params);
  if (_snapshotCache.has(key)) return _snapshotCache.get(key);
  const kundali = calculateKundali(params);
  Object.defineProperty(kundali, '_key', { value: key, enumerable: false });
  _snapshotCache.set(key, kundali);
  return kundali;
}

/**
 * Memoized derivation. `producer(kundali)` runs at most once per (kundali, name).
 * Returns the cached immutable result on subsequent calls — this is what makes
 * varga switching instantaneous after the first Kundali calculation.
 */
export function derive(kundali, name, producer) {
  let bucket = _derivationCache.get(kundali);
  if (!bucket) {
    bucket = new Map();
    _derivationCache.set(kundali, bucket);
  }
  if (bucket.has(name)) return bucket.get(name);
  const value = producer(kundali);
  bucket.set(name, value);
  return value;
}

/** Clear caches (used by tests). */
export function _resetSnapshotCaches() {
  _snapshotCache.clear();
}

export default { snapshotKey, getSnapshot, derive, _resetSnapshotCaches };
