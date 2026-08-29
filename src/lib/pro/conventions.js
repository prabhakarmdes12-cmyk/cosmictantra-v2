/**
 * CONVENTION CENTER (PROGRAM 15)
 * ==============================
 * Advanced users can select: Ayanamsha, Node mode, House system, Dasha
 * convention, Jaimini convention, Sunrise reckoning.
 *
 * Conventions are applied NON-DESTRUCTIVELY. The qualified canonical engine
 * (astrologyEngine.js, Lahiri) is never edited — variant ayanamshas/node modes
 * are applied as longitude transforms on top of its output, exactly as kp.js
 * already does for the KP ayanamsha.
 *
 * Every snapshot stores the exact convention set that produced it. Changing a
 * convention creates a NEW calculation context (new snapshot key) and clearly
 * indicates why results changed.
 */

import { getLahiriAyanamsha } from '../astrologyEngine.js';
import { norm360 } from './math.js';

export const AYANAMSHA = {
  LAHIRI: 'LAHIRI',
  RAMAN: 'RAMAN',
  KP: 'KP',
};

export const NODE_MODE = {
  MEAN: 'MEAN',
  TRUE: 'TRUE',
};

export const HOUSE_SYSTEM = {
  WHOLE_SIGN: 'WHOLE_SIGN',
  PLACIDUS: 'PLACIDUS', // used by KP workspace
};

export const SUNRISE_RECKONING = {
  AT_LOCAL_SUNRISE: 'AT_LOCAL_SUNRISE',
  AT_INSTANT: 'AT_INSTANT',
};

export const DASHA_CONVENTION = {
  BPHS: 'BPHS',
};

export const JAIMINI_CONVENTION = {
  KN_RAO: 'KN_RAO',
  PARASHARA_JAIMINI: 'PARASHARA_JAIMINI',
};

/** The single sanctioned default. Stored with every snapshot. */
export const COSMICTANTRA_STANDARD_PARASHARI = Object.freeze({
  id: 'COSMICTANTRA_STANDARD_PARASHARI',
  label: 'CosmicTantra Standard (Parashari)',
  ayanamsha: AYANAMSHA.LAHIRI,
  nodeMode: NODE_MODE.MEAN,
  houseSystem: HOUSE_SYSTEM.WHOLE_SIGN,
  sunriseReckoning: SUNRISE_RECKONING.AT_LOCAL_SUNRISE,
  dashaConvention: DASHA_CONVENTION.BPHS,
  jaiminiConvention: JAIMINI_CONVENTION.KN_RAO,
  karakaMode: 8,
});

/** Normalize / complete a partial convention set against the default. */
export function resolveConventions(partial) {
  return { ...COSMICTANTRA_STANDARD_PARASHARI, ...(partial || {}) };
}

/** Stable string identity for a convention set (part of the snapshot key). */
export function conventionKey(conv) {
  const c = resolveConventions(conv);
  return [c.ayanamsha, c.nodeMode, c.houseSystem, c.sunriseReckoning, c.dashaConvention, c.jaiminiConvention, c.karakaMode].join(':');
}

/**
 * Ayanamsha value for a JD under a given convention.
 * RAMAN and KP are expressed as documented offsets from Lahiri so the qualified
 * Lahiri model remains the single astronomical source.
 */
export function ayanamshaFor(jd, ayanamsha) {
  const lahiri = getLahiriAyanamsha(jd);
  switch (ayanamsha) {
    case AYANAMSHA.RAMAN:
      // Raman ayanamsha ≈ Lahiri − 1.1067° (documented offset; ~1°06').
      return lahiri - 1.1067;
    case AYANAMSHA.KP:
      // KP (Krishnamurti) ≈ Lahiri − 0.883° (same offset used by kp.js).
      return lahiri - 0.883;
    case AYANAMSHA.LAHIRI:
    default:
      return lahiri;
  }
}

/**
 * Longitude delta (degrees) to ADD to a Lahiri-sidereal longitude to convert it
 * to the requested ayanamsha's sidereal frame. delta = lahiri − target.
 */
export function ayanamshaDelta(jd, ayanamsha) {
  const lahiri = getLahiriAyanamsha(jd);
  return lahiri - ayanamshaFor(jd, ayanamsha);
}

export function describeConventions(conv) {
  const c = resolveConventions(conv);
  return [
    { key: 'Ayanamsha', value: c.ayanamsha },
    { key: 'Node mode', value: c.nodeMode + ' (Rahu/Ketu)' },
    { key: 'House system', value: c.houseSystem },
    { key: 'Sunrise reckoning', value: c.sunriseReckoning },
    { key: 'Dasha convention', value: c.dashaConvention },
    { key: 'Jaimini convention', value: c.jaiminiConvention },
    { key: 'Karaka mode', value: String(c.karakaMode) },
  ];
}

export default {
  AYANAMSHA, NODE_MODE, HOUSE_SYSTEM, SUNRISE_RECKONING, DASHA_CONVENTION, JAIMINI_CONVENTION,
  COSMICTANTRA_STANDARD_PARASHARI, resolveConventions, conventionKey, ayanamshaFor, ayanamshaDelta, describeConventions,
};
