/**
 * WAVE 2 — Nakshatra-based Dasha systems.
 * Vimshottari (5 levels: Maha→Antar→Pratyantar→Sookshma→Prana),
 * Ashtottari (108y), Yogini (36y).
 * Convention: IMPLEMENTED_CONVENTION_BPHS / CLASSICAL.
 */

import { nakOf } from '../math.js';
import { registerDashaSystem, buildProportional, activeChain, addYears, fmt } from './framework.js';

// ── Vimshottari (120 years) ─────────────────────────────────────────────────
export const VIMSHOTTARI_SEQ = [
  { lord: 'Ketu', years: 7 }, { lord: 'Venus', years: 20 }, { lord: 'Sun', years: 6 },
  { lord: 'Moon', years: 10 }, { lord: 'Mars', years: 7 }, { lord: 'Rahu', years: 18 },
  { lord: 'Jupiter', years: 16 }, { lord: 'Saturn', years: 19 }, { lord: 'Mercury', years: 17 },
];
export const VIMSHOTTARI_TOTAL = 120;

function birthDateOf(kundali) {
  const bd = kundali.meta?.birthDate || kundali.metadata?.birthDate?.slice(0, 10);
  const [y, m, d] = String(bd).split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

/**
 * Vimshottari with full 5-level expansion. To keep the tree bounded we expand
 * the maha-periods fully to `maxLevel`, but for performance the deep levels
 * (Sookshma/Prana) are computed lazily via expandPeriod().
 */
export function computeVimshottari(kundali, options = {}) {
  const maxLevel = options.maxLevel || 2; // default Maha+Antar; deeper on demand
  const targetDate = options.targetDate || new Date();
  const moonLon = kundali.moon.longitude;
  const nak = nakOf(moonLon);
  const nakSpan = 360 / 27;
  const within = ((moonLon % nakSpan) + nakSpan) % nakSpan;
  const fractionElapsed = within / nakSpan;
  const startIndex = nak % 9;
  const balance = 1 - fractionElapsed;

  const birth = birthDateOf(kundali);
  // First maha-dasha is partial: starts before birth by elapsed fraction.
  const firstLord = VIMSHOTTARI_SEQ[startIndex];
  const dashaStart = addYears(birth, -(firstLord.years * fractionElapsed));

  const periods = buildProportional(
    VIMSHOTTARI_SEQ, startIndex, dashaStart, VIMSHOTTARI_TOTAL,
    VIMSHOTTARI_TOTAL, 1, maxLevel, targetDate,
  );

  return {
    system: 'Vimshottari',
    convention: 'IMPLEMENTED_CONVENTION_BPHS_120YR',
    maxLevels: 5,
    totalYears: VIMSHOTTARI_TOTAL,
    startingLord: firstLord.lord,
    balanceYears: Math.round(firstLord.years * balance * 100) / 100,
    moonNakshatra: nak,
    periods,
    activeChain: activeChain(periods, targetDate),
  };
}

/**
 * Expand a specific period node deeper (lazy Sookshma/Prana).
 * Given a period object (with startDate/endDate/lord) and the level to reach.
 */
export function expandVimshottariPeriod(period, toLevel) {
  const idx = VIMSHOTTARI_SEQ.findIndex((s) => s.lord === period.lord);
  const spanYears = (period.endDate.getTime() - period.startDate.getTime()) / (365.25 * 864e5);
  return buildProportional(
    VIMSHOTTARI_SEQ, idx, period.startDate, spanYears,
    VIMSHOTTARI_TOTAL, period.level + 1, toLevel, null,
  );
}

// ── Ashtottari (108 years) ──────────────────────────────────────────────────
export const ASHTOTTARI_SEQ = [
  { lord: 'Sun', years: 6 }, { lord: 'Moon', years: 15 }, { lord: 'Mars', years: 8 },
  { lord: 'Mercury', years: 17 }, { lord: 'Saturn', years: 10 }, { lord: 'Jupiter', years: 19 },
  { lord: 'Rahu', years: 12 }, { lord: 'Venus', years: 21 },
];
export const ASHTOTTARI_TOTAL = 108;
// Ashtottari starts from nakshatra counted from Ardra (nak index 5) grouped in blocks.
const ASHTOTTARI_START_TABLE = [
  // nak index (0-26) -> starting lord index in ASHTOTTARI_SEQ; classical grouping
  // Krittika(2)..: pattern of counts 4,4,3,4,3,4,3,4 across 27 nakshatras from Ardra
];
export function computeAshtottari(kundali, options = {}) {
  const maxLevel = options.maxLevel || 2;
  const targetDate = options.targetDate || new Date();
  const nak = nakOf(kundali.moon.longitude);
  // classical: from Ardra(5). Blocks sizes: Sun3,Moon4,Mars3,Mer4,Sat3,Jup4,Rahu3,Ven3 = 27
  const blocks = [3, 4, 3, 4, 3, 4, 3, 3];
  let rel = (nak - 5 + 27) % 27; // count from Ardra
  let startIndex = 0, acc = 0;
  for (let i = 0; i < blocks.length; i++) { if (rel < acc + blocks[i]) { startIndex = i; break; } acc += blocks[i]; }
  const nakSpan = 360 / 27;
  const within = ((kundali.moon.longitude % nakSpan) + nakSpan) % nakSpan;
  const fractionElapsed = within / nakSpan;
  const birth = birthDateOf(kundali);
  const firstLord = ASHTOTTARI_SEQ[startIndex];
  const dashaStart = addYears(birth, -(firstLord.years * fractionElapsed));
  const periods = buildProportional(ASHTOTTARI_SEQ, startIndex, dashaStart, ASHTOTTARI_TOTAL, ASHTOTTARI_TOTAL, 1, maxLevel, targetDate);
  return {
    system: 'Ashtottari', convention: 'IMPLEMENTED_CONVENTION_BPHS', maxLevels: 3,
    totalYears: ASHTOTTARI_TOTAL, startingLord: firstLord.lord, periods,
    activeChain: activeChain(periods, targetDate),
  };
}

// ── Yogini (36 years) ───────────────────────────────────────────────────────
export const YOGINI_SEQ = [
  { lord: 'Mangala (Moon)', years: 1 }, { lord: 'Pingala (Sun)', years: 2 },
  { lord: 'Dhanya (Jupiter)', years: 3 }, { lord: 'Bhramari (Mars)', years: 4 },
  { lord: 'Bhadrika (Mercury)', years: 5 }, { lord: 'Ulka (Saturn)', years: 6 },
  { lord: 'Siddha (Venus)', years: 7 }, { lord: 'Sankata (Rahu)', years: 8 },
];
export const YOGINI_TOTAL = 36;
export function computeYogini(kundali, options = {}) {
  const maxLevel = options.maxLevel || 2;
  const targetDate = options.targetDate || new Date();
  const nak = nakOf(kundali.moon.longitude);
  // starting yogini = (nakshatra number + 3) mod 8
  const startIndex = ((nak + 1 + 3) % 8);
  const nakSpan = 360 / 27;
  const within = ((kundali.moon.longitude % nakSpan) + nakSpan) % nakSpan;
  const fractionElapsed = within / nakSpan;
  const birth = birthDateOf(kundali);
  const firstLord = YOGINI_SEQ[startIndex];
  const dashaStart = addYears(birth, -(firstLord.years * fractionElapsed));
  const periods = buildProportional(YOGINI_SEQ, startIndex, dashaStart, YOGINI_TOTAL, YOGINI_TOTAL, 1, maxLevel, targetDate);
  return {
    system: 'Yogini', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', maxLevels: 3,
    totalYears: YOGINI_TOTAL, startingLord: firstLord.lord, periods,
    activeChain: activeChain(periods, targetDate),
  };
}

// Register the nakshatra-based systems.
registerDashaSystem({ id: 'vimshottari', name: 'Vimshottari', tradition: 'Parashari', convention: 'IMPLEMENTED_CONVENTION_BPHS_120YR', maxLevels: 5, totalYears: 120, compute: computeVimshottari });
registerDashaSystem({ id: 'ashtottari', name: 'Ashtottari', tradition: 'Parashari', convention: 'IMPLEMENTED_CONVENTION_BPHS', maxLevels: 3, totalYears: 108, compute: computeAshtottari });
registerDashaSystem({ id: 'yogini', name: 'Yogini', tradition: 'Classical', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', maxLevels: 3, totalYears: 36, compute: computeYogini });

export default { computeVimshottari, expandVimshottariPeriod, computeAshtottari, computeYogini, VIMSHOTTARI_SEQ };
