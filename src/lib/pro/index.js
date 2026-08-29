/**
 * PROFESSIONAL JYOTISH — unified derivation facade.
 * =================================================
 * One canonical snapshot in → every professional calculation out, each memoized
 * on the snapshot so repeated access (e.g. varga switching) is instantaneous.
 *
 * Deterministic. No network. No LLM. No paid astrology APIs.
 */

import { getSnapshot, derive } from './snapshot.js';
import { computeAllVargas, computeVarga, vargottamaPlanets } from './vargas.js';
import { computeAshtakavarga } from './ashtakavarga.js';
import { computeAvasthas } from './avastha.js';
import { computeShadbala, computeBhavaBala, computeVimshopaka, computeIshtaKashta } from './bala.js';
import { computeJaimini } from './jaimini.js';
import { computeSpecialPoints } from './special.js';
import { evaluateYogas } from './yogaRegistry.js';
import { computeVimshottari } from './dasha/nakshatraDashas.js';
import { computeDasha, listDashaSystems } from './dasha/index.js';

export { getSnapshot, derive };
export * from './vargas.js';

/**
 * Build the full professional chart bundle from birth parameters.
 * Everything is lazily memoized; accessing one section does not compute others.
 */
export function professionalChart(birthParams, options = {}) {
  const kundali = getSnapshot(birthParams);
  const targetDate = options.targetDate || new Date();

  return {
    kundali,
    key: kundali._key,

    // Vargas (memoized individually via derive for instant switching)
    varga(code) { return derive(kundali, `varga:${code}`, (k) => computeVarga(k, code)); },
    get vargas() { return derive(kundali, 'vargas', computeAllVargas); },
    get vargottama() { return derive(kundali, 'vargottama', vargottamaPlanets); },

    get ashtakavarga() { return derive(kundali, 'ashtakavarga', computeAshtakavarga); },
    get avasthas() { return derive(kundali, 'avasthas', computeAvasthas); },

    get shadbala() { return derive(kundali, 'shadbala', computeShadbala); },
    get bhavaBala() { return derive(kundali, 'bhavaBala', (k) => computeBhavaBala(k, this.shadbala)); },
    get vimshopaka() { return derive(kundali, 'vimshopaka', (k) => computeVimshopaka(k)); },
    get ishtaKashta() { return derive(kundali, 'ishtaKashta', computeIshtaKashta); },

    get jaimini() { return derive(kundali, 'jaimini', (k) => computeJaimini(k, options)); },
    get special() { return derive(kundali, 'special', computeSpecialPoints); },
    get yogas() { return derive(kundali, 'yogas', evaluateYogas); },

    dasha(systemId, opts) { return computeDasha(systemId, kundali, { targetDate, ...(opts || {}) }); },
    get vimshottari() { return derive(kundali, 'vimshottari', (k) => computeVimshottari(k, { targetDate, maxLevel: 3 })); },
    get dashaSystems() { return listDashaSystems(); },
  };
}

export default { professionalChart, getSnapshot, derive };
