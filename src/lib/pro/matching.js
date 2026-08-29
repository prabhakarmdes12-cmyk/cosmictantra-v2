/**
 * WAVE 9 — MATCHING (Ashtakoota with full evidence)
 * ==================================================
 * Convention: IMPLEMENTED_CONVENTION_BPHS_ASHTAKOOTA (36-guna).
 * Goes beyond a single total: exposes every koota's sub-score AND the relevant
 * cancellation / exception rules.
 */

import { nakOf, signOf } from './math.js';
import { calculateKundali } from '../astrologyEngine.js';

const NAK_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];
const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// Varna by moon sign: Water(Cancer/Scorpio/Pisces)=Brahmin(4)...
const VARNA_BY_SIGN = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4]; // Brahmin4>Kshatriya3>Vaishya2>Shudra1
// Vashya groups
const VASHYA_GROUP = ['Q', 'Q', 'H', 'W', 'B', 'H', 'H', 'W', 'H', 'W', 'H', 'W']; // simplified categories
// Gana per nakshatra: 0 Deva,1 Manushya,2 Rakshasa
const GANA = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0];
// Nadi per nakshatra: 0 Aadi,1 Madhya,2 Antya
const NADI = [0, 1, 2, 0, 1, 2, 0, 1, 2, 2, 1, 0, 2, 1, 0, 2, 1, 0, 0, 1, 2, 0, 1, 2, 0, 1, 2];
// Yoni per nakshatra (14 animals; simplified index)
const YONI = [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12, 13, 13, 0];
// Rashi lords for Graha Maitri
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

function friendship(a, b) {
  // simplified planetary friendship for graha maitri (0..5 mapping done by caller)
  const friends = {
    Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'],
    Mercury: ['Sun', 'Venus'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'], Saturn: ['Mercury', 'Venus'],
  };
  if (a === b) return 'same';
  const aF = friends[a] || []; const bF = friends[b] || [];
  const af = aF.includes(b); const bf = bF.includes(a);
  if (af && bf) return 'friends';
  if (!af && !bf) return 'enemies';
  return 'neutral';
}

function kootaVarna(m1, m2) {
  const v1 = VARNA_BY_SIGN[signOf(m1)]; const v2 = VARNA_BY_SIGN[signOf(m2)];
  const score = v1 >= v2 ? 1 : 0; // groom varna >= bride varna
  return { max: 1, score, detail: `Groom varna ${v1}, Bride varna ${v2}` };
}
function kootaVashya(m1, m2) {
  const g1 = VASHYA_GROUP[signOf(m1)]; const g2 = VASHYA_GROUP[signOf(m2)];
  const score = g1 === g2 ? 2 : 1; // simplified
  return { max: 2, score, detail: `Vashya ${g1} / ${g2}` };
}
function kootaTara(n1, n2) {
  const count1 = ((n2 - n1 + 27) % 27) + 1;
  const count2 = ((n1 - n2 + 27) % 27) + 1;
  const r1 = count1 % 9; const r2 = count2 % 9;
  const ok1 = ![3, 5, 7].includes(r1); const ok2 = ![3, 5, 7].includes(r2);
  const score = (ok1 ? 1.5 : 0) + (ok2 ? 1.5 : 0);
  return { max: 3, score, detail: `Tara counts ${count1}/${count2}` };
}
function kootaYoni(n1, n2) {
  const y1 = YONI[n1]; const y2 = YONI[n2];
  let score = 4;
  if (y1 === y2) score = 4;
  else score = 2; // simplified: same yoni best, else neutral
  return { max: 4, score, detail: `Yoni ${y1}/${y2}` };
}
function kootaGrahaMaitri(m1, m2) {
  const l1 = SIGN_LORDS[signOf(m1)]; const l2 = SIGN_LORDS[signOf(m2)];
  const f = friendship(l1, l2);
  const score = f === 'same' || f === 'friends' ? 5 : f === 'neutral' ? 3 : 0;
  return { max: 5, score, detail: `Lords ${l1}/${l2} — ${f}` };
}
function kootaGana(n1, n2) {
  const g1 = GANA[n1]; const g2 = GANA[n2];
  let score = 6;
  if (g1 === g2) score = 6;
  else if ((g1 === 0 && g2 === 1) || (g1 === 1 && g2 === 0)) score = 5;
  else if (g1 === 2 && g2 === 1) score = 0;
  else if (g1 === 1 && g2 === 2) score = 1;
  else if ((g1 === 0 && g2 === 2) || (g1 === 2 && g2 === 0)) score = 1;
  return { max: 6, score, detail: `Gana ${['Deva', 'Manushya', 'Rakshasa'][g1]}/${['Deva', 'Manushya', 'Rakshasa'][g2]}` };
}
function kootaBhakoot(m1, m2) {
  const s1 = signOf(m1); const s2 = signOf(m2);
  const d1 = ((s2 - s1 + 12) % 12) + 1;
  const d2 = ((s1 - s2 + 12) % 12) + 1;
  const bad = [[6, 8], [8, 6], [5, 9], [9, 5], [2, 12], [12, 2]];
  const isBad = bad.some(([a, b]) => (d1 === a && d2 === b));
  return { max: 7, score: isBad ? 0 : 7, detail: `Rashi distance ${d1}/${d2}`, dosha: isBad };
}
function kootaNadi(n1, n2) {
  const na1 = NADI[n1]; const na2 = NADI[n2];
  const same = na1 === na2;
  return { max: 8, score: same ? 0 : 8, detail: `Nadi ${['Aadi', 'Madhya', 'Antya'][na1]}/${['Aadi', 'Madhya', 'Antya'][na2]}`, dosha: same };
}

/**
 * Full Ashtakoota matching.
 * @param {object} groom { birthDate, birthTime, latitude, longitude, timezone }
 * @param {object} bride
 */
export function ashtakoota(groom, bride) {
  const gk = calculateKundali(groom);
  const bk = calculateKundali(bride);
  const m1 = gk.moon.longitude; const m2 = bk.moon.longitude;
  const n1 = nakOf(m1); const n2 = nakOf(m2);

  const kootas = {
    varna: kootaVarna(m1, m2),
    vashya: kootaVashya(m1, m2),
    tara: kootaTara(n1, n2),
    yoni: kootaYoni(n1, n2),
    grahaMaitri: kootaGrahaMaitri(m1, m2),
    gana: kootaGana(n1, n2),
    bhakoot: kootaBhakoot(m1, m2),
    nadi: kootaNadi(n1, n2),
  };
  const total = Object.values(kootas).reduce((a, k) => a + k.score, 0);
  const max = Object.values(kootas).reduce((a, k) => a + k.max, 0); // 36

  // Cancellation / exception rules (traceable).
  const exceptions = [];
  if (kootas.nadi.dosha) {
    // Nadi dosha cancels if same nakshatra but different pada, or same rashi different nakshatra.
    if (n1 === n2) exceptions.push({ rule: 'Nadi Dosha cancellation', applies: true, reason: 'Same nakshatra — Nadi dosha may be cancelled per classical exception.' });
    else exceptions.push({ rule: 'Nadi Dosha present', applies: false, reason: 'Different nakshatras of same Nadi — dosha stands; examine further.' });
  }
  if (kootas.bhakoot.dosha) {
    const sameLords = SIGN_LORDS[signOf(m1)] === SIGN_LORDS[signOf(m2)];
    exceptions.push({ rule: 'Bhakoot Dosha cancellation', applies: sameLords, reason: sameLords ? 'Rashi lords identical — Bhakoot dosha cancelled.' : 'Bhakoot dosha stands.' });
  }
  if (kootas.gana.score <= 1) {
    exceptions.push({ rule: 'Gana Dosha review', applies: false, reason: 'Rakshasa/Manushya mismatch — mitigated if rashi lords are friends or same Navamsha.' });
  }

  return {
    convention: 'IMPLEMENTED_CONVENTION_BPHS_ASHTAKOOTA',
    groom: { nakshatra: NAK_NAMES[n1], rashi: SIGN_NAMES[signOf(m1)] },
    bride: { nakshatra: NAK_NAMES[n2], rashi: SIGN_NAMES[signOf(m2)] },
    kootas,
    total,
    max,
    verdict: total >= 18 ? (total >= 24 ? 'Good' : 'Acceptable') : 'Poor — needs remedial review',
    exceptions,
    note: 'Total guna is necessary but NOT sufficient; examine 7th/8th houses, Mangal dosha, and dashas separately.',
  };
}

export default { ashtakoota };
