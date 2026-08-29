/**
 * WAVE 3 — JAIMINI
 * ================
 * Convention: IMPLEMENTED_CONVENTION_JAIMINI. Convention differences (7 vs 8
 * karakas; Rahu inclusion) are CONFIGURATION via options, not hidden branching.
 *
 *   - Chara Karakas (7/8 karaka modes)
 *   - Atmakaraka, Amatyakaraka, ..., Darakaraka
 *   - Karakamsha & Swamsha (via D9)
 *   - Arudha Lagna, Bhava Padas, Upapada
 *   - Rashi Drishti
 */

import { signOf, degInSign, SIGN_LORDS, addSigns, countSigns, rashiDrishti, SIGN_NAMES } from './math.js';
import { computeVarga } from './vargas.js';

// Karaka ranking (by descending degree-in-sign).
export const KARAKA_NAMES_8 = ['Atmakaraka', 'Amatyakaraka', 'Bhratrukaraka', 'Matrukaraka', 'Putrakaraka', 'Gnatikaraka', 'Darakaraka', 'Strikaraka'];
export const KARAKA_NAMES_7 = ['Atmakaraka', 'Amatyakaraka', 'Bhratrukaraka', 'Matrukaraka', 'Putrakaraka', 'Gnatikaraka', 'Darakaraka'];

/**
 * Chara Karakas: rank grahas by their degree in sign (highest = Atmakaraka).
 * @param {object} options { karakaMode: 7|8 }  (8 includes Rahu; Rahu degree is 30−deg)
 */
export function charaKarakas(kundali, options = {}) {
  const mode = options.karakaMode === 7 ? 7 : 8;
  const usePlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  if (mode === 8) usePlanets.push('Rahu');

  const rows = usePlanets.map((name) => {
    const p = kundali.planets.find((x) => x.name === name);
    let deg = degInSign(p.longitude);
    // Rahu is retrograde → its karaka degree is measured as 30 − deg.
    if (name === 'Rahu') deg = 30 - deg;
    return { name, degree: deg, sign: signOf(p.longitude) };
  });
  rows.sort((a, b) => b.degree - a.degree);

  const names = mode === 8 ? KARAKA_NAMES_8 : KARAKA_NAMES_7;
  const karakas = {};
  rows.forEach((r, i) => {
    if (i < names.length) karakas[names[i]] = { planet: r.name, degree: Math.round(r.degree * 100) / 100, sign: r.sign, signName: SIGN_NAMES[r.sign] };
  });
  return { mode, order: rows.map((r) => r.name), karakas };
}

export function atmakaraka(kundali, options) { return charaKarakas(kundali, options).karakas.Atmakaraka; }
export function amatyakaraka(kundali, options) { return charaKarakas(kundali, options).karakas.Amatyakaraka; }
export function darakaraka(kundali, options) { return charaKarakas(kundali, options).karakas.Darakaraka; }

/**
 * Karakamsha: the sign occupied by the Atmakaraka in the Navamsha (D9).
 * Swamsha: the Karakamsha treated as a lagna for reading D9 from it.
 */
export function karakamsha(kundali, options = {}) {
  const ak = atmakaraka(kundali, options);
  const d9 = computeVarga(kundali, 'D9');
  const akD9 = d9.planets.find((p) => p.name === ak.planet);
  return {
    atmakaraka: ak.planet,
    karakamshaSign: akD9.sign,
    karakamshaSignName: SIGN_NAMES[akD9.sign],
    swamsha: akD9.sign, // Swamsha = the Karakamsha sign as reference lagna
    note: 'Karakamsha is the D9 sign of the Atmakaraka; Swamsha is read as a lagna.',
  };
}

/**
 * Arudha of a house/bhava (Pada). Rule: count from the sign to its lord, then
 * count the same number again from the lord's sign. Exceptions: if the arudha
 * lands on the same sign, use the 10th from it; if it lands in the 7th, use the
 * 4th from it (to avoid the arudha coinciding with the bhava or its 7th).
 */
export function bhavaPada(kundali, houseNum) {
  const lagnaSign = signOf(kundali.lagna.longitude);
  const houseSign = addSigns(lagnaSign, houseNum - 1);
  const lord = SIGN_LORDS[houseSign];
  const lp = kundali.planets.find((p) => p.name === lord);
  const lordSign = lp ? signOf(lp.longitude) : houseSign;
  const dist = countSigns(houseSign, lordSign); // 1..12
  let arudha = addSigns(lordSign, dist - 1);
  // exceptions
  const fromHouse = countSigns(houseSign, arudha);
  if (fromHouse === 1) arudha = addSigns(arudha, 9); // same sign → 10th
  else if (fromHouse === 7) arudha = addSigns(arudha, 3); // 7th → 4th
  return { house: houseNum, houseSign, lord, lordSign, arudhaSign: arudha, arudhaSignName: SIGN_NAMES[arudha] };
}

/** Arudha Lagna (AL) = pada of the 1st house. */
export function arudhaLagna(kundali) {
  const pada = bhavaPada(kundali, 1);
  return { ...pada, name: 'Arudha Lagna (AL)' };
}

/** Upapada Lagna (UL) = pada of the 12th house. */
export function upapada(kundali) {
  const pada = bhavaPada(kundali, 12);
  return { ...pada, name: 'Upapada Lagna (UL)' };
}

/** All twelve bhava padas. */
export function allBhavaPadas(kundali) {
  const out = [];
  for (let h = 1; h <= 12; h++) out.push(bhavaPada(kundali, h));
  return out;
}

/** Rashi Drishti table for the twelve signs (Jaimini sign aspects). */
export function rashiDrishtiTable() {
  const table = {};
  for (let s = 0; s < 12; s++) {
    table[s] = { sign: s, signName: SIGN_NAMES[s], aspects: rashiDrishti(s).map((a) => ({ sign: a, signName: SIGN_NAMES[a] })) };
  }
  return table;
}

/** Which signs aspect a given sign (Jaimini). */
export function signsAspecting(targetSign) {
  const out = [];
  for (let s = 0; s < 12; s++) if (rashiDrishti(s).includes(targetSign)) out.push(s);
  return out;
}

export function computeJaimini(kundali, options = {}) {
  return {
    convention: 'IMPLEMENTED_CONVENTION_JAIMINI',
    karakaMode: options.karakaMode === 7 ? 7 : 8,
    charaKarakas: charaKarakas(kundali, options),
    karakamsha: karakamsha(kundali, options),
    arudhaLagna: arudhaLagna(kundali),
    upapada: upapada(kundali),
    bhavaPadas: allBhavaPadas(kundali),
    rashiDrishti: rashiDrishtiTable(),
  };
}

export default {
  charaKarakas, atmakaraka, amatyakaraka, darakaraka, karakamsha,
  bhavaPada, arudhaLagna, upapada, allBhavaPadas, rashiDrishtiTable, signsAspecting, computeJaimini,
};
