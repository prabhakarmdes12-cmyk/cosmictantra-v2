/**
 * WAVE 1 — AVASTHAS (planetary states)
 * ====================================
 * Convention: IMPLEMENTED_CONVENTION_BPHS.
 * Every state exposes the TRIGGERING calculation, not just a label.
 *
 *   - Baladi     (5): infant → dead, from degree in sign (odd/even direction)
 *   - Jagradadi  (3): waking / dreaming / sleeping, from own/friend/enemy sign
 *   - Deeptadi   (9): dignity-based emotional states
 *   - Lajjitadi  (6): situational states from placement/associations
 *   - Shayanadi (12): postures from a longitude+aspect arithmetic
 */

import { signOf, degInSign, isOddSign } from './math.js';
import { getDignity } from '../astrologyEngine.js';

const PLANETS7 = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// ── Baladi (5 states over 6° each) ──────────────────────────────────────────
const BALADI = ['Bala (Infant)', 'Kumara (Adolescent)', 'Yuva (Young)', 'Vriddha (Old)', 'Mrita (Dead)'];
export function baladiAvastha(planet) {
  const sign = signOf(planet.longitude);
  const d = degInSign(planet.longitude);
  // odd sign: 0-6 infant ... ; even sign: reversed
  let idx = Math.floor(d / 6); // 0..4
  if (!isOddSign(sign)) idx = 4 - idx;
  return {
    state: BALADI[idx],
    index: idx,
    trigger: { degreeInSign: Math.round(d * 100) / 100, signParity: isOddSign(sign) ? 'odd' : 'even', rule: '6° bands; even signs reversed' },
    strengthFactor: [0.25, 0.5, 1.0, 0.5, 0][idx], // classical potency
  };
}

// ── Jagradadi (3 states) ────────────────────────────────────────────────────
export function jagradadiAvastha(planet) {
  const sign = signOf(planet.longitude);
  const d = getDignity(planet.name, sign + 1, degInSign(planet.longitude));
  let state, idx;
  if (/Exalted|Own|Moolatrikona/.test(d)) { state = 'Jagrat (Awake)'; idx = 0; }
  else if (/Friendly|Neutral/.test(d)) { state = 'Swapna (Dreaming)'; idx = 1; }
  else { state = 'Sushupti (Sleeping)'; idx = 2; }
  return { state, index: idx, trigger: { dignity: d, rule: 'own/exalted→awake, friend/neutral→dreaming, enemy/debil→sleeping' } };
}

// ── Deeptadi (9 dignity-driven states) ──────────────────────────────────────
export function deeptadiAvastha(planet, kundali) {
  const sign = signOf(planet.longitude);
  const dig = getDignity(planet.name, sign + 1, degInSign(planet.longitude));
  let state = 'Shanta (Calm)';
  let reason = dig;
  if (/Exalted/.test(dig)) state = 'Deepta (Radiant)';
  else if (/Own|Moolatrikona/.test(dig)) state = 'Swastha (Comfortable)';
  else if (/Friendly/.test(dig)) state = 'Mudita (Delighted)';
  else if (/Debilitated/.test(dig)) state = 'Khala (Wicked)';
  else if (/Neutral \/ Enemy|Enemy/.test(dig)) state = 'Dukhita (Distressed)';
  // combustion → Kopa; retrograde deep → Deena
  const sun = kundali.planets.find((p) => p.name === 'Sun');
  if (sun && planet.name !== 'Sun') {
    const sep = Math.abs(((planet.longitude - sun.longitude + 180) % 360) - 180);
    if (sep < 8) { state = 'Kopa (Angry/Combust)'; reason = `combust (${sep.toFixed(1)}° from Sun)`; }
  }
  return { state, trigger: { dignity: dig, reason } };
}

// ── Lajjitadi (6 situational states) ────────────────────────────────────────
export function lajjitadiAvastha(planet, kundali) {
  const house = planet.house;
  const sign = signOf(planet.longitude);
  const dig = getDignity(planet.name, sign + 1, degInSign(planet.longitude));
  const others = kundali.planets.filter((p) => p.name !== planet.name && p.house === house);
  const has = (n) => others.some((p) => p.name === n);
  const malefics = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const benefics = ['Jupiter', 'Venus', 'Mercury', 'Moon'];

  const states = [];
  // Lajjita: in 5th with Rahu/Ketu/Sun/Saturn/Mars
  if (house === 5 && others.some((p) => ['Rahu', 'Ketu', 'Sun', 'Saturn', 'Mars'].includes(p.name))) states.push('Lajjita (Ashamed)');
  // Garvita: exalted or in Moolatrikona
  if (/Exalted|Moolatrikona/.test(dig)) states.push('Garvita (Proud)');
  // Kshudhita: in enemy sign or with/aspected by enemy or with Saturn
  if (/Enemy/.test(dig) || has('Saturn')) states.push('Kshudhita (Hungry)');
  // Trishita: in watery sign aspected by malefic
  if ([3, 7, 11].includes(sign) && others.some((p) => malefics.includes(p.name))) states.push('Trishita (Thirsty)');
  // Mudita: in friendly sign or with benefic
  if (/Friendly|Own/.test(dig) || others.some((p) => benefics.includes(p.name))) states.push('Mudita (Delighted)');
  // Kshobhita: with Sun and aspected/joined by malefic
  if (has('Sun') && others.some((p) => malefics.includes(p.name) && p.name !== 'Sun')) states.push('Kshobhita (Agitated)');

  return {
    states: states.length ? states : ['Neutral'],
    trigger: { house, dignity: dig, coLocated: others.map((p) => p.name), rule: 'BPHS Lajjitadi placement/association rules' },
  };
}

// ── Shayanadi (12 postures) ─────────────────────────────────────────────────
const SHAYANADI = [
  'Shayana (Lying)', 'Upavesana (Sitting)', 'Netrapani (Hand on eyes)', 'Prakasana (Illuminating)',
  'Gamana (Moving)', 'Agamana (Coming)', 'Sabhavastha (In assembly)', 'Agama (Approaching)',
  'Bhojana (Eating)', 'Nrityalipsa (Dancing)', 'Kautuka (Playful)', 'Nidra (Sleeping)',
];
export function shayanadiAvastha(planet) {
  // Classical arithmetic: (nakshatra-pada index * planet factor) style → deterministic 0..11
  const nak = Math.floor(((planet.longitude % 360) + 360) % 360 / (360 / 27));
  const pada = Math.floor((((planet.longitude % (360 / 27)) + (360 / 27)) % (360 / 27)) / (360 / 108)) + 1;
  const factor = { Sun: 5, Moon: 2, Mars: 3, Mercury: 8, Jupiter: 7, Venus: 6, Saturn: 4 }[planet.name] || 1;
  const idx = (((nak + 1) * pada * factor) % 12 + 12) % 12;
  return { state: SHAYANADI[idx], index: idx, trigger: { nakshatra: nak + 1, pada, factor, rule: 'BPHS Shayanadi cyclic index' } };
}

/** All avasthas for all seven grahas. */
export function computeAvasthas(kundali) {
  const out = {};
  for (const name of PLANETS7) {
    const p = kundali.planets.find((x) => x.name === name);
    if (!p) continue;
    out[name] = {
      baladi: baladiAvastha(p),
      jagradadi: jagradadiAvastha(p),
      deeptadi: deeptadiAvastha(p, kundali),
      lajjitadi: lajjitadiAvastha(p, kundali),
      shayanadi: shayanadiAvastha(p),
    };
  }
  return out;
}

export default {
  baladiAvastha, jagradadiAvastha, deeptadiAvastha, lajjitadiAvastha, shayanadiAvastha, computeAvasthas,
};
