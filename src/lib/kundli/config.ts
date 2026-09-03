/**
 * Kundli pipeline — configuration.
 *
 * Single, traceable source for every calculation/report/PDF parameter.
 * Nothing is hardcoded inside engines or renderers; the config object is
 * recorded in the report lineage so any output can be traced back to the
 * exact settings that produced it.
 */

import type { CalculationConfig } from './types';

export const KUNDLI_PIPELINE_CONFIG = {
  calculation: {
    zodiac: 'SIDEREAL',
    ayanamsha: 'LAHIRI_CHITRA_PAKSHA',
    ayanamshaName: 'Lahiri (Chitra Paksha)',
    houseSystem: 'EQUAL_SIGN',        // whole-sign houses from the ascendant
    nodeMode: 'MEAN_NODE',
    ephemerisProvider: 'ASTRONOMY_ENGINE_VSOP87_ELP2000',
    engineVersion: 'V37.0',           // canonicalSnapshot meta.engineVersion (Sprint C ayanamsha reconciliation)
    calculationVersion: 'kundli-calc-v1',
    reportVersion: 'kundli-report-v1',
  } as CalculationConfig,

  limits: {
    /** Hard ceiling on PDF pages. 454-page incident impossible above this. */
    maxPages: 40,
    /** Pages whose extracted text is below this many chars are blank. */
    blankPageCharThreshold: 20,
    /** More than this many consecutive blank pages fails validation. */
    maxConsecutiveBlankPages: 2,
    /** Minimum fraction of non-blank pages. */
    minContentDensity: 0.5,
    /** Renderer must place at least this many chars on a page on average. */
    minAvgCharsPerPage: 50,
  },

  tolerances: {
    /**
     * Rahu and Ketu are, by definition, 180 degrees apart. Anything beyond
     * this tolerance is a calculation or adapter defect, not an astrological
     * variation, so the consistency gate fails closed on it.
     */
    nodeOppositionToleranceDeg: 0.5,
    /** Accepted rounding for date continuity checks, in days. */
    dashaContinuityToleranceDays: 0.001,
  },

  report: {
    /** Hindi and English labels are emitted side by side in the report. */
    bilingualLabels: true,
  },

  geo: {
    /** Approximate India bounding box — used to suggest Asia/Kolkata when no timezoneId is given. */
    indiaBox: { minLat: 6, maxLat: 37, minLng: 68, maxLng: 97.5 },
    fallbackTimezoneId: 'Asia/Kolkata',
    /** System fallback point (India centroid) used ONLY when a caller explicitly approves FALLBACK without supplying coordinates. */
    fallbackCoordinates: { latitude: 20.5937, longitude: 78.9629, source: 'INDIA_CENTROID' },
  },

  /** Reference point used ONLY by the demo profile (not a silent production default). */
  demoProfile: {
    name: 'Aarav Sharma',
    birthDate: '1995-06-15',
    birthTime: '10:30',
    locationName: 'Patna, India',
    latitude: 25.5941,
    longitude: 85.1376,
    timezoneId: 'Asia/Kolkata',
  },
} as const;

export function buildCalculationConfig(): CalculationConfig {
  return { ...KUNDLI_PIPELINE_CONFIG.calculation };
}
