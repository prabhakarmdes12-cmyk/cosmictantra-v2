/**
 * DEPRECATED BRIDGE MODULE: src/engines/panchang.js
 * Consolidated into canonical src/lib/panchang.js per Invariant INV_ASTRO_TRUTH_001.
 * All new code must import directly from '@/lib/panchang.js'.
 */

import { calculatePanchang as canonicalPanchang } from '../lib/panchang.js';
import * as legacy from './panchang.legacy.js';

export function calculatePanchang(date, lat, lon, tz) {
  return canonicalPanchang(date, lat, lon, tz);
}

// Retained for differential verification test suite
export function calculateLegacyPanchang(date, lat, lon, tz) {
  return legacy.calculatePanchang(date, lat, lon, tz);
}

export default {
  calculatePanchang,
  calculateLegacyPanchang
};
