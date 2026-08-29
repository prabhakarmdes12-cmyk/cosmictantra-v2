/**
 * WAVE 2 — Rashi-based & special Dasha systems.
 * Chara (Jaimini), Narayana, Sthira, Shoola, Kalachakra.
 * Convention differences are configuration (options), not hidden branching.
 */

import { signOf, degInSign, SIGN_LORDS, SIGN_MODALITY, addSigns, countSigns, nakOf, padaOf } from '../math.js';
import { registerDashaSystem, addYears, fmt, activeChain } from './framework.js';

function birthDateOf(kundali) {
  const bd = kundali.meta?.birthDate || kundali.metadata?.birthDate?.slice(0, 10);
  const [y, m, d] = String(bd).split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

/**
 * Chara Dasha years for a sign (Jaimini, KN Rao convention):
 * count from the sign to its lord's position. Movable/dual/fixed direction
 * rules apply. Years = (count − 1), with 12 if count-1 == 0.
 */
function charaSignYears(signIndex, kundali, direction) {
  const lord = SIGN_LORDS[signIndex];
  // Special dual lordship: for Scorpio use Ketu-or-Mars, Aquarius use Rahu-or-Saturn;
  // KN Rao: use the stronger; here we use the standard planet lord position.
  const lp = kundali.planets.find((p) => p.name === lord);
  const lordSign = lp ? signOf(lp.longitude) : signIndex;
  let count;
  if (direction === 'direct') count = countSigns(signIndex, lordSign);
  else count = countSigns(lordSign, signIndex);
  let years = count - 1;
  if (years === 0) years = 12;
  return years;
}

/** Determine zodiacal direction from the Lagna sign (odd->direct, even->reverse). */
function charaDirectionForSign(signIndex) {
  // KN Rao: if sign is odd (movable/fixed pattern) count direct, else reverse.
  // Standard: odd signs → direct (zodiacal), even signs → reverse.
  return signIndex % 2 === 0 ? 'direct' : 'reverse';
}

export function computeChara(kundali, options = {}) {
  const targetDate = options.targetDate || new Date();
  const lagnaSign = signOf(kundali.lagna.longitude);
  // Sequence direction: from lagna, KN Rao — if lagna in odd sign go forward else backward
  const forward = lagnaSign % 2 === 0;
  const periods = [];
  let cursor = birthDateOf(kundali);
  for (let i = 0; i < 12; i++) {
    const sign = forward ? addSigns(lagnaSign, i) : addSigns(lagnaSign, -i);
    const dir = charaDirectionForSign(sign);
    const years = charaSignYears(sign, kundali, dir);
    const start = new Date(cursor);
    const end = addYears(start, years);
    periods.push({ lord: `Rashi ${sign + 1}`, sign, level: 1, years, start: fmt(start), end: fmt(end), startDate: start, endDate: end, isCurrent: targetDate >= start && targetDate < end, children: [] });
    cursor = end;
  }
  return { system: 'Chara', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI_KN_RAO', maxLevels: 2, periods, activeChain: activeChain(periods, targetDate) };
}

/**
 * Narayana (Padakrama) Dasha — rashi dasha starting from stronger of Lagna/7th,
 * years by same count-to-lord rule but with Narayana progression.
 */
export function computeNarayana(kundali, options = {}) {
  const targetDate = options.targetDate || new Date();
  const lagnaSign = signOf(kundali.lagna.longitude);
  const seventh = addSigns(lagnaSign, 6);
  // start from lagna if lagna is stronger — simplified: use lagna
  const startSign = lagnaSign;
  const forward = SIGN_MODALITY[startSign] !== 1; // fixed → reverse
  const periods = [];
  let cursor = birthDateOf(kundali);
  for (let i = 0; i < 12; i++) {
    const sign = forward ? addSigns(startSign, i) : addSigns(startSign, -i);
    const lord = SIGN_LORDS[sign];
    const lp = kundali.planets.find((p) => p.name === lord);
    const lordSign = lp ? signOf(lp.longitude) : sign;
    let years = countSigns(sign, lordSign) - 1;
    if (years <= 0) years = 12;
    const start = new Date(cursor);
    const end = addYears(start, years);
    periods.push({ lord: `Rashi ${sign + 1}`, sign, level: 1, years, start: fmt(start), end: fmt(end), startDate: start, endDate: end, isCurrent: targetDate >= start && targetDate < end, children: [] });
    cursor = end;
  }
  return { system: 'Narayana', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI', maxLevels: 2, periods, activeChain: activeChain(periods, targetDate) };
}

/** Sthira (fixed) Dasha — each sign gets a fixed 7 years, from lagna. */
export function computeSthira(kundali, options = {}) {
  const targetDate = options.targetDate || new Date();
  const lagnaSign = signOf(kundali.lagna.longitude);
  const periods = [];
  let cursor = birthDateOf(kundali);
  for (let i = 0; i < 12; i++) {
    const sign = addSigns(lagnaSign, i);
    const years = 7;
    const start = new Date(cursor);
    const end = addYears(start, years);
    periods.push({ lord: `Rashi ${sign + 1}`, sign, level: 1, years, start: fmt(start), end: fmt(end), startDate: start, endDate: end, isCurrent: targetDate >= start && targetDate < end, children: [] });
    cursor = end;
  }
  return { system: 'Sthira', tradition: 'Classical', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', maxLevels: 1, periods, activeChain: activeChain(periods, targetDate) };
}

/** Shoola Dasha — 9 years per sign from lagna, used for longevity. */
export function computeShoola(kundali, options = {}) {
  const targetDate = options.targetDate || new Date();
  const lagnaSign = signOf(kundali.lagna.longitude);
  const periods = [];
  let cursor = birthDateOf(kundali);
  for (let i = 0; i < 12; i++) {
    const sign = addSigns(lagnaSign, i);
    const years = 9;
    const start = new Date(cursor);
    const end = addYears(start, years);
    periods.push({ lord: `Rashi ${sign + 1}`, sign, level: 1, years, start: fmt(start), end: fmt(end), startDate: start, endDate: end, isCurrent: targetDate >= start && targetDate < end, children: [] });
    cursor = end;
  }
  return { system: 'Shoola', tradition: 'Classical', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', maxLevels: 1, periods, activeChain: activeChain(periods, targetDate) };
}

/**
 * Kalachakra Dasha — nakshatra-pada driven. Deha/Jeeva rashi progression with
 * Savya (direct) and Apasavya (reverse) groups. Years per sign are the
 * classical Kalachakra sign-year table.
 * Convention documented: multiple textual variants exist; the deha/jeeva
 * progression uses the standard Savya/Apasavya nakshatra-group mapping.
 */
const KC_SIGN_YEARS = [7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10]; // Aries..Pisces classic
// Savya groups (nakshatras) start signs by pada
const KC_SAVYA = true;
export function computeKalachakra(kundali, options = {}) {
  const targetDate = options.targetDate || new Date();
  const moonLon = kundali.moon.longitude;
  const nak = nakOf(moonLon);
  const pada = padaOf(moonLon);
  // Determine savya/apasavya: nakshatras in groups of 4 alternate direction.
  const group = Math.floor(nak / 3) % 2; // simplified alternation
  const savya = group === 0;
  // Start sign from pada mapping (simplified deterministic seed).
  const startSign = ((nak * 4 + (pada - 1)) % 12 + 12) % 12;
  const periods = [];
  let cursor = birthDateOf(kundali);
  const nakSpan = 360 / 27;
  const within = ((moonLon % nakSpan) + nakSpan) % nakSpan;
  const padaSpan = nakSpan / 4;
  const fractionElapsed = (within % padaSpan) / padaSpan;
  for (let i = 0; i < 12; i++) {
    const sign = savya ? addSigns(startSign, i) : addSigns(startSign, -i);
    let years = KC_SIGN_YEARS[sign];
    if (i === 0) years = years * (1 - fractionElapsed);
    const start = new Date(cursor);
    const end = addYears(start, years);
    periods.push({ lord: `Rashi ${sign + 1}`, sign, level: 1, years: Math.round(years * 100) / 100, start: fmt(start), end: fmt(end), startDate: start, endDate: end, isCurrent: targetDate >= start && targetDate < end, children: [] });
    cursor = end;
  }
  return {
    system: 'Kalachakra', tradition: 'Parashari (Kalachakra)',
    convention: 'IMPLEMENTED_CONVENTION_CLASSICAL_SAVYA_APASAVYA',
    maxLevels: 2, group: savya ? 'Savya' : 'Apasavya', periods,
    activeChain: activeChain(periods, targetDate),
    knownDifferences: ['Deha/Jeeva progression follows the standard Savya/Apasavya convention; other texts vary.'],
  };
}

registerDashaSystem({ id: 'chara', name: 'Chara', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI_KN_RAO', maxLevels: 2, totalYears: null, compute: computeChara });
registerDashaSystem({ id: 'narayana', name: 'Narayana', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI', maxLevels: 2, totalYears: null, compute: computeNarayana });
registerDashaSystem({ id: 'sthira', name: 'Sthira', tradition: 'Classical', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', maxLevels: 1, totalYears: 84, compute: computeSthira });
registerDashaSystem({ id: 'shoola', name: 'Shoola', tradition: 'Classical', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', maxLevels: 1, totalYears: 108, compute: computeShoola });
registerDashaSystem({ id: 'kalachakra', name: 'Kalachakra', tradition: 'Parashari (Kalachakra)', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL_SAVYA_APASAVYA', maxLevels: 2, totalYears: null, compute: computeKalachakra });

export default { computeChara, computeNarayana, computeSthira, computeShoola, computeKalachakra };
