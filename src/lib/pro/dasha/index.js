/**
 * Dasha platform entry point — imports all systems (registering them) and
 * re-exports the framework API.
 */

import './nakshatraDashas.js';
import './rashiDashas.js';

export * from './framework.js';
export {
  computeVimshottari, expandVimshottariPeriod, computeAshtottari, computeYogini,
} from './nakshatraDashas.js';
export {
  computeChara, computeNarayana, computeSthira, computeShoola, computeKalachakra,
} from './rashiDashas.js';

import { listDashaSystems, getDashaSystem } from './framework.js';

/** Compute any registered system by id. */
export function computeDasha(systemId, kundali, options = {}) {
  const sys = getDashaSystem(systemId);
  if (!sys) throw new Error(`Unknown dasha system: ${systemId}`);
  return sys.compute(kundali, options);
}

export { listDashaSystems, getDashaSystem };
