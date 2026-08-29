/**
 * WAVE 2 — DASHA PLATFORM (registry-based framework)
 * ==================================================
 * A Dasha system is registered as a descriptor. The Kundli UI never needs to
 * change when a new system is added — it iterates the registry.
 *
 * Every system exposes compute(kundali, options) -> { system, levels, periods }
 * where periods is a nested tree of { lord, start, end, level, children }.
 */

const _registry = new Map();

/**
 * @param {object} descriptor
 *   { id, name, tradition, convention, maxLevels, totalYears, compute }
 */
export function registerDashaSystem(descriptor) {
  if (!descriptor || !descriptor.id) throw new Error('Dasha system needs an id');
  _registry.set(descriptor.id, descriptor);
  return descriptor;
}

export function getDashaSystem(id) {
  return _registry.get(id) || null;
}

export function listDashaSystems() {
  return Array.from(_registry.values()).map((d) => ({
    id: d.id, name: d.name, tradition: d.tradition, convention: d.convention,
    maxLevels: d.maxLevels, totalYears: d.totalYears,
  }));
}

/** Year length used across all Dasha systems (sidereal year approximation). */
export const YEAR_DAYS = 365.25;
export const YEAR_MS = YEAR_DAYS * 24 * 60 * 60 * 1000;

export function addYears(date, years) {
  return new Date(date.getTime() + years * YEAR_MS);
}

export function fmt(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Generic recursive period builder shared by proportional dasha systems
 * (Vimshottari, Ashtottari, Yogini, ...). Given a sequence of {lord, years}
 * for the *level*, and a parent [start,end], produces nested periods.
 *
 * @param {Array<{lord:string, years:number}>} sequence full cyclic sequence for that system
 * @param {number} startIndex index of first lord at this level
 * @param {Date} start
 * @param {number} spanYears total years to fill at this level
 * @param {number} totalYears the system's grand total (for proportioning children)
 * @param {number} level current level (1 = maha)
 * @param {number} maxLevel deepest level to expand
 */
export function buildProportional(sequence, startIndex, start, spanYears, totalYears, level, maxLevel, targetDate) {
  const n = sequence.length;
  const periods = [];
  let cursor = new Date(start);
  const levelTotal = spanYears; // years to distribute at this level
  for (let i = 0; i < n; i++) {
    const item = sequence[(startIndex + i) % n];
    // sub-period years proportional to lord's share of the whole cycle
    const childYears = level === 1 ? item.years : (levelTotal * item.years) / totalYears;
    const pStart = new Date(cursor);
    const pEnd = addYears(pStart, childYears);
    const period = {
      lord: item.lord,
      level,
      years: Math.round(childYears * 1000) / 1000,
      start: fmt(pStart),
      end: fmt(pEnd),
      startDate: pStart,
      endDate: pEnd,
      isCurrent: targetDate ? targetDate >= pStart && targetDate < pEnd : false,
      children: [],
    };
    if (level < maxLevel) {
      period.children = buildProportional(
        sequence,
        (startIndex + i) % n,
        pStart,
        childYears,
        totalYears,
        level + 1,
        maxLevel,
        targetDate,
      );
    }
    periods.push(period);
    cursor = pEnd;
  }
  return periods;
}

/** Find the active period chain at a target date (Maha→...). */
export function activeChain(periods, targetDate) {
  const chain = [];
  let list = periods;
  while (list && list.length) {
    const found = list.find((p) => targetDate >= p.startDate && targetDate < p.endDate);
    if (!found) break;
    chain.push({ lord: found.lord, level: found.level, start: found.start, end: found.end });
    list = found.children;
  }
  return chain;
}

export default {
  registerDashaSystem, getDashaSystem, listDashaSystems,
  YEAR_DAYS, YEAR_MS, addYears, fmt, buildProportional, activeChain,
};
