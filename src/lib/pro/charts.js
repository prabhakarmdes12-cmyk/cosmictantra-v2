/**
 * WAVE 9 — Separate chart TYPES.
 * NatalChart, PrashnaChart, KPPrashnaChart are distinct constructs sharing the
 * canonical calculation core but carrying different semantics/metadata.
 */

import { calculateKundali } from '../astrologyEngine.js';
import { computeKPChart, kpPrashna249 } from './kp.js';

export const CHART_TYPE = {
  NATAL: 'NatalChart',
  PRASHNA: 'PrashnaChart',
  KP_PRASHNA: 'KPPrashnaChart',
};

/** A birth chart. */
export function NatalChart(birthParams) {
  const k = calculateKundali(birthParams);
  return { chartType: CHART_TYPE.NATAL, input: birthParams, kundali: k };
}

/**
 * A Prashna (horary) chart cast for the moment & place the question is asked.
 * Semantically distinct from a natal chart: the "birth" data is the query event.
 */
export function PrashnaChart(queryMomentUTC, place, question) {
  const dt = new Date(queryMomentUTC);
  const params = {
    birthDate: dt.toISOString().slice(0, 10),
    birthTime: `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`,
    latitude: place.latitude, longitude: place.longitude, timezone: 0, locationName: place.name,
  };
  const k = calculateKundali(params);
  return { chartType: CHART_TYPE.PRASHNA, question: question || null, queryMomentUTC: dt.toISOString(), place, kundali: k };
}

/**
 * A KP Prashna chart from a 1–249 horary number plus the moment/place.
 */
export function KPPrashnaChart(horaryNumber, queryMomentUTC, place, question) {
  const dt = new Date(queryMomentUTC);
  const params = {
    birthDate: dt.toISOString().slice(0, 10),
    birthTime: `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`,
    latitude: place.latitude, longitude: place.longitude, timezone: 0, locationName: place.name,
  };
  const prashna = kpPrashna249(horaryNumber, params);
  const kp = computeKPChart(params);
  return { chartType: CHART_TYPE.KP_PRASHNA, horaryNumber, question: question || null, queryMomentUTC: dt.toISOString(), place, prashna, kpChart: kp };
}

export default { CHART_TYPE, NatalChart, PrashnaChart, KPPrashnaChart };
