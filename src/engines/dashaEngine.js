/**
 * DEPRECATED BRIDGE MODULE: src/engines/dashaEngine.js
 * Consolidated into canonical src/lib/dashaEngine.js per Invariant INV_ASTRO_TRUTH_001.
 * All new code must import directly from '@/lib/dashaEngine.js'.
 */

import { calculateVimshottariDasha as canonicalDasha, getCurrentDasha as canonicalGetCurrentDasha, DASHA_LORDS as canonicalLords } from '../lib/dashaEngine.js';
import * as legacy from './dashaEngine.legacy.js';

export const DASHA_LORDS = canonicalLords;
export const TOTAL_DASHA_YEARS = 120;

export function calculateVimshottariDasha(moonNakshatraOrLon, birthDate) {
  // If passed object with degree/ruler or nakshatra
  let moonLon = 42.5;
  if (typeof moonNakshatraOrLon === 'number') {
    moonLon = moonNakshatraOrLon;
  } else if (moonNakshatraOrLon && typeof moonNakshatraOrLon === 'object') {
    moonLon = moonNakshatraOrLon.degree || 42.5;
  }

  const birthDateStr = birthDate instanceof Date 
    ? birthDate.toISOString().slice(0, 10) 
    : String(birthDate || '1995-05-15');

  const res = canonicalDasha(moonLon, birthDateStr);
  return res.mahadashas || [];
}

export function getCurrentDasha(dashas, referenceDate = new Date()) {
  return canonicalGetCurrentDasha(dashas, referenceDate);
}

// Retained for differential verification test suite
export function calculateLegacyVimshottariDasha(moonNakshatra, birthDate) {
  return legacy.calculateVimshottariDasha(moonNakshatra, birthDate);
}

export default {
  calculateVimshottariDasha,
  getCurrentDasha,
  calculateLegacyVimshottariDasha,
  DASHA_LORDS
};
