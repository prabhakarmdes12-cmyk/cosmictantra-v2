/**
 * CANONICAL SNAPSHOT v2 + DERIVATION CACHE
 * ========================================
 * ONE PERSON → ONE BIRTH RECORD → ONE CANONICAL JYOTISH STATE → MANY SYSTEMS.
 *
 * A Kundali is calculated ONCE from birth parameters + a convention set (the
 * canonical snapshot). Every professional calculation is a PURE derivation of
 * that immutable snapshot.
 *
 * v2 additions:
 *   - Convention identity is part of the snapshot key (changing a convention
 *     creates a NEW calculation context — PROGRAM 15).
 *   - Non-destructive ayanamsha / node-mode transforms (PROGRAM 15) applied on
 *     top of the qualified Lahiri engine; the engine itself is never edited.
 *   - Version stamp (engine/pro/convention/ruleset) for reproducibility
 *     (PROGRAM 18).
 *
 * Performance contract: D1→D9→D10→D60 switching is instantaneous (no network).
 */

import { calculateKundali, getNakshatra, getDignity } from '../astrologyEngine.js';
import { norm360, signOf } from './math.js';
import { resolveConventions, conventionKey, ayanamshaDelta, ayanamshaFor, AYANAMSHA, NODE_MODE } from './conventions.js';
import { versionStamp } from './versions.js';

// Stable key from birth parameters + conventions — identifies an immutable snapshot.
export function snapshotKey(params, conventions) {
  const p = params || {};
  const lat = Number(p.latitude ?? p.birthLat ?? 0);
  const lon = Number(p.longitude ?? p.birthLon ?? 0);
  const tz = Number(p.timezone ?? 5.5);
  const base = [p.birthDate, p.birthTime || '12:00', lat.toFixed(4), lon.toFixed(4), tz].join('|');
  return `${base}#${conventionKey(conventions)}`;
}

// WeakMap keyed by the kundali object so derivations garbage-collect with it.
const _derivationCache = new WeakMap();
const _snapshotCache = new Map();

const RASHIS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const RASHIS_SA = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

/**
 * Re-derive a body's descriptive fields after a longitude shift, keeping the
 * exact shape the canonical engine emits (so all downstream code is unchanged).
 */
function reprojectBody(base, newLon, lagnaSign, extra = {}) {
  const rashiId = signOf(newLon) + 1;
  const degInSign = newLon % 30;
  const nak = getNakshatra(newLon);
  const rashi = { en: RASHIS_EN[rashiId - 1], name: RASHIS_SA[rashiId - 1], lord: SIGN_LORDS[rashiId - 1] };
  const house = ((rashiId - lagnaSign - 1 + 12) % 12) + 1;
  const dignity = getDignity(base.name, rashiId, degInSign);
  return {
    ...base,
    longitude: newLon,
    rashiId,
    rasi: rashiId - 1,
    rasiIndex: rashiId - 1,
    rashiName: rashi.name,
    rashiEn: rashi.en,
    rasiName: rashi.en,
    rashiLord: rashi.lord,
    degrees: Math.floor(degInSign),
    minutes: Math.floor((degInSign % 1) * 60),
    degreeStr: `${Math.floor(degInSign)}° ${Math.floor((degInSign % 1) * 60)}'`,
    degreeInRasi: parseFloat(degInSign.toFixed(2)),
    house,
    nakshatra: nak,
    pada: nak.pada,
    dignity,
    status: dignity,
    ...extra,
  };
}

/**
 * Apply a convention set to the qualified Lahiri kundali non-destructively.
 * Returns a NEW kundali object (never mutates the engine output).
 */
function applyConventions(baseKundali, conv) {
  const c = resolveConventions(conv);
  // Fast path: standard Lahiri + mean nodes == the engine's native output.
  const delta = ayanamshaDelta(baseKundali.julianDay, c.ayanamsha); // lahiri - target
  const needsShift = Math.abs(delta) > 1e-9;
  const needsTrueNode = c.nodeMode === NODE_MODE.TRUE;

  if (!needsShift && !needsTrueNode) {
    return decorate(cloneKundali(baseKundali), baseKundali, c);
  }

  const k = cloneKundali(baseKundali);

  // Shift Lagna
  const newLagnaLon = norm360(baseKundali.lagna.longitude + delta);
  const lagnaSign = signOf(newLagnaLon) + 1;
  const lagnaDeg = newLagnaLon % 30;
  const lagnaNak = getNakshatra(newLagnaLon);
  k.lagna = {
    ...baseKundali.lagna,
    longitude: newLagnaLon,
    rashiId: lagnaSign,
    rasi: lagnaSign - 1,
    rasiIndex: lagnaSign - 1,
    rashiName: RASHIS_SA[lagnaSign - 1],
    rashiEn: RASHIS_EN[lagnaSign - 1],
    rasiName: RASHIS_EN[lagnaSign - 1],
    lord: SIGN_LORDS[lagnaSign - 1],
    degrees: Math.floor(lagnaDeg),
    minutes: Math.floor((lagnaDeg % 1) * 60),
    degreeStr: `${Math.floor(lagnaDeg)}° ${Math.floor((lagnaDeg % 1) * 60)}'`,
    degreeInRasi: parseFloat(lagnaDeg.toFixed(2)),
    nakshatra: lagnaNak,
    pada: lagnaNak.pada,
  };

  // Shift planets (True node applies a small nutation-style correction to nodes)
  const trueNodeCorrection = needsTrueNode ? 1.4 * Math.sin(((baseKundali.julianDay - 2451545.0) / 36525) * 0) : 0;
  const planetsArray = baseKundali.planets.map((p) => {
    let lon = norm360(p.longitude + delta);
    if (needsTrueNode && (p.name === 'Rahu' || p.name === 'Ketu')) {
      // True (oscillating) node: apply the classical ~±1.4° oscillation term.
      const d = baseKundali.julianDay - 2451545.0;
      const osc = 1.4 * Math.sin((norm360(125.04 - 0.052954 * d)) * Math.PI / 180);
      lon = norm360(lon + (p.name === 'Rahu' ? -osc : -osc));
    }
    return reprojectBody(p, lon, lagnaSign);
  });
  k.planets = Object.assign(planetsArray, {
    Sun: planetsArray[0], Moon: planetsArray[1], Mars: planetsArray[2], Mercury: planetsArray[3],
    Jupiter: planetsArray[4], Venus: planetsArray[5], Saturn: planetsArray[6], Rahu: planetsArray[7], Ketu: planetsArray[8],
  });

  // Rebuild houses (whole sign from new lagna)
  k.houses = Array.from({ length: 12 }, (_, i) => {
    const houseNum = i + 1;
    const rashiId = ((lagnaSign + i - 1) % 12) + 1;
    const occ = planetsArray.filter((pl) => pl.house === houseNum);
    return {
      ...baseKundali.houses[i],
      number: houseNum,
      house: houseNum,
      rashiId,
      rasi: rashiId - 1,
      rasiIndex: rashiId - 1,
      rashiName: RASHIS_SA[rashiId - 1],
      rashiEn: RASHIS_EN[rashiId - 1],
      rasiName: RASHIS_EN[rashiId - 1],
      lord: SIGN_LORDS[rashiId - 1],
      longitude: (rashiId - 1) * 30,
      planets: occ.map((pl) => pl.name),
      occupyingPlanets: occ,
    };
  });

  // Moon summary
  const moon = k.planets.Moon;
  k.moon = { ...baseKundali.moon, ...moon };

  // Ayanamsha metadata reflects the chosen convention
  const ayanVal = parseFloat(ayanamshaFor(baseKundali.julianDay, c.ayanamsha).toFixed(4));
  k.ayanamsha = ayanVal;
  k.meta = { ...baseKundali.meta, ayanamsha: ayanVal };

  return decorate(k, baseKundali, c);
}

function cloneKundali(base) {
  // shallow structural clone sufficient for our reprojection (we replace arrays)
  return {
    ...base,
    meta: { ...base.meta },
    metadata: { ...base.metadata },
    lagna: { ...base.lagna },
    moon: { ...base.moon },
    planets: base.planets,
    houses: base.houses,
  };
}

function decorate(k, base, conv) {
  Object.defineProperty(k, '_conventions', { value: conv, enumerable: false, configurable: true });
  Object.defineProperty(k, '_versions', { value: versionStamp(), enumerable: false, configurable: true });
  return k;
}

/**
 * Build (or reuse) the canonical snapshot for birth parameters + conventions.
 */
export function getSnapshot(params, conventions) {
  const conv = resolveConventions(conventions);
  const key = snapshotKey(params, conv);
  if (_snapshotCache.has(key)) return _snapshotCache.get(key);
  const baseKundali = calculateKundali(params);
  const kundali = applyConventions(baseKundali, conv);
  Object.defineProperty(kundali, '_key', { value: key, enumerable: false, configurable: true });
  _snapshotCache.set(key, kundali);
  return kundali;
}

/** Memoized derivation. Runs producer at most once per (kundali, name). */
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
