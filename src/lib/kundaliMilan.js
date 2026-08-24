/**
 * CosmicTantra — Kundali Milan (Ashtakoota) Engine
 *
 * Classical 36-point marriage compatibility (8 Kootas) + Mangal Dosh check.
 * Inputs: two Kundali objects produced by the canonical engine (or raw
 * birth fields — `milanFromProfiles` wraps them).
 *
 * Rule notes: classical pala tables vary slightly by lineage; this engine
 * uses the widely-published (AstroSage/drikpanchang-consistent) scoring and
 * marks approximations explicitly in the UI copy.
 */

import { calculateKundali } from './astrologyEngine.js';

export const KOOTA_MAX = {
  Varna: 1,
  Vashya: 2,
  Tara: 3,
  Yoni: 4,
  GrahaMaitri: 5,
  Gana: 6,
  Bhakoot: 7,
  Nadi: 8,
};

const RASHI_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

const VARNA = { 1: 'Kshatriya', 2: 'Vaishya', 3: 'Shudra', 4: 'Brahmin', 5: 'Kshatriya', 6: 'Vaishya', 7: 'Shudra', 8: 'Brahmin', 9: 'Kshatriya', 10: 'Vaishya', 11: 'Shudra', 12: 'Brahmin' };
// Fire/Mesha 1=Kshatriya, Earth 2=Vaishya, Air 3=Shudra, Water 4=Brahmin (cycled by rashi)
const VARNA_BY_RASHI = {};
for (let r = 1; r <= 12; r++) VARNA_BY_RASHI[r] = VARNA[((r - 1) % 4) + 1];

const VASHYA_GROUPS = {
  Chatushpada: [1, 2, 9, 10], // Mesha, Vrishabha, Dhanu, Makara
  Manav: [3, 6, 7, 11], // Mithuna, Kanya, Tula, Kumbha
  Jalachar: [4, 12], // Karka, Meena
  Vanachar: [5], // Simha
  Keeta: [8], // Vrishchika
};
function groupOf(rashiId, groups) {
  for (const [name, ids] of Object.entries(groups)) if (ids.includes(rashiId)) return name;
  return null;
}

// Yoni (animal) per nakshatra index 0-26
export const YONI_ANIMALS = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog', 'Cat', 'Sheep', 'Cat',
  'Rat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Buffalo', 'Tiger', 'Deer', 'Deer',
  'Dog', 'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Horse', 'Lion', 'Cow', 'Cow',
];

const YONI_FRIEND = [
  ['Horse', 'Elephant'], ['Sheep', 'Dog'], ['Cat', 'Rat'], ['Cow', 'Tiger'],
  ['Buffalo', 'Monkey'], ['Deer', 'Mongoose'], ['Sheep', 'Cat'], ['Cow', 'Dog'],
];
const YONI_ENEMY = [['Elephant', 'Lion'], ['Tiger', 'Buffalo'], ['Horse', 'Buffalo'], ['Lion', 'Elephant'], ['Buffalo', 'Tiger'], ['Buffalo', 'Horse']];

function yoniScore(a, b) {
  if (a === b) return 4;
  if (YONI_FRIEND.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 3;
  if (YONI_ENEMY.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return 0;
  return 1;
}

const GANA_GROUPS = {
  Deva: ['Ashwini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Hasta', 'Swati', 'Anuradha', 'Shravana', 'Revati'],
  Manushya: ['Bharani', 'Rohini', 'Ardra', 'Purva Phalguni', 'Uttara Phalguni', 'Purva Ashadha', 'Uttara Ashadha', 'Purva Bhadrapada', 'Uttara Bhadrapada'],
  Rakshasa: ['Krittika', 'Ashlesha', 'Magha', 'Chitra', 'Vishakha', 'Jyeshtha', 'Mula', 'Dhanishtha', 'Shatabhisha'],
};
function ganaOf(nakName) {
  for (const [g, list] of Object.entries(GANA_GROUPS)) if (list.includes(nakName)) return g;
  return 'Deva';
}

const PLANET_FRIENDS = {
  Sun: ['Moon', 'Mars', 'Jupiter'],
  Moon: ['Sun', 'Mercury'],
  Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'],
  Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus'],
};

function grahaMaitriScore(lordA, lordB) {
  const aF = (PLANET_FRIENDS[lordA] || []).includes(lordB);
  const bF = (PLANET_FRIENDS[lordB] || []).includes(lordA);
  if (aF && bF) return 5;
  if (aF || bF) return 4;
  if (!aF && !bF) return 3;
  return 0;
}

function bhakootScore(rashiA, rashiB) {
  const dist = ((rashiB - rashiA + 12) % 12) || 12;
  return [1, 3, 4, 7, 10, 11, 12].includes(dist) ? 7 : 0;
}

function taraScore(nakA, nakB) {
  const count = ((nakB - nakA + 27) % 27) + 1;
  return count % 2 === 1 ? 3 : 0;
}

function nadiScore(nakA, nakB) {
  return nakA % 3 === nakB % 3 ? 0 : 8;
}

export const MANGAL_DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];

export function mangalDosha(kundali) {
  if (!kundali) return { hasDosha: false, houses: [] };
  const mars = kundali.planets?.Mars || kundali.planets?.find?.(p => p.name === 'Mars');
  const fromLagna = mars?.house || 0;
  const moonRashiId = kundali.moon?.rashiId;
  const marsRashiId = mars?.rashiId;
  let fromMoon = 0;
  if (moonRashiId && marsRashiId) fromMoon = ((marsRashiId - moonRashiId + 12) % 12) + 1;
  const houses = MANGAL_DOSHA_HOUSES.filter(h => h === fromLagna || h === fromMoon);
  return {
    hasDosha: houses.length > 0,
    houses,
    fromLagna,
    fromMoon,
    note: houses.length ? `Mars occupies house(s) ${houses.join(', ')} from Lagna/Moon — classical Mangal Dosh markers.` : 'No Mangal Dosh from Lagna or Moon placement.',
  };
}

/**
 * Core computation from two kundali objects.
 */
export function kundaliMilan(kundaliA, kundaliB) {
  const a = kundaliA;
  const b = kundaliB;
  const moonA = a?.moon || a?.planets?.Moon;
  const moonB = b?.moon || b?.planets?.Moon;
  const nakA = moonA?.nakshatra || {};
  const nakB = moonB?.nakshatra || {};
  const nakIdxA = nakA.index ?? nakA.idx ?? 0;
  const nakIdxB = nakB.index ?? nakB.idx ?? 0;
  const rashiA = moonA?.rashiId || 1;
  const rashiB = moonB?.rashiId || 1;
  const nakNameA = nakA.name;
  const nakNameB = nakB.name;

  const varnaA = VARNA_BY_RASHI[rashiA];
  const varnaB = VARNA_BY_RASHI[rashiB];
  // Classical: same varna full point; else Brahmin-Vaishya & Kshatriya-Vaishya partial
  const varnaPoints = varnaA === varnaB ? 1 : (varnaA === 'Brahmin' && varnaB === 'Vaishya') || (varnaA === 'Vaishya' && varnaB === 'Brahmin') ? 0.5 : 0;

  const vashyaA = groupOf(rashiA, VASHYA_GROUPS);
  const vashyaB = groupOf(rashiB, VASHYA_GROUPS);
  const vashyaPoints = vashyaA === vashyaB ? 2
    : (vashyaA === 'Jalachar' && ['Manav', 'Chatushpada'].includes(vashyaB)) || (vashyaB === 'Jalachar' && ['Manav', 'Chatushpada'].includes(vashyaA))
      || (vashyaA === 'Manav' && vashyaB === 'Chatushpada') || (vashyaB === 'Manav' && vashyaA === 'Chatushpada') ? 1 : 0;

  const yoniA = YONI_ANIMALS[nakIdxA] || 'Horse';
  const yoniB = YONI_ANIMALS[nakIdxB] || 'Horse';

  const ganaA = ganaOf(nakNameA);
  const ganaB = ganaOf(nakNameB);
  const ganaPoints = ganaA === ganaB ? 6 : (ganaA === 'Deva' && ganaB === 'Manushya') || (ganaA === 'Manushya' && ganaB === 'Deva') ? 5 : 0;

  const kootas = [
    { id: 'Varna', points: varnaPoints, max: KOOTA_MAX.Varna, detail: `${varnaA ?? '—'} × ${varnaB ?? '—'}` },
    { id: 'Vashya', points: vashyaPoints, max: KOOTA_MAX.Vashya, detail: `${vashyaA ?? '—'} × ${vashyaB ?? '—'}` },
    { id: 'Tara', points: taraScore(nakIdxA, nakIdxB), max: KOOTA_MAX.Tara, detail: `${nakNameA ?? '—'} → ${nakNameB ?? '—'}` },
    { id: 'Yoni', points: yoniScore(yoniA, yoniB), max: KOOTA_MAX.Yoni, detail: `${yoniA} × ${yoniB}` },
    { id: 'GrahaMaitri', points: grahaMaitriScore(RASHI_LORDS[rashiA - 1] || 'Sun', RASHI_LORDS[rashiB - 1] || 'Sun'), max: KOOTA_MAX.GrahaMaitri, detail: `${RASHI_LORDS[rashiA - 1]} × ${RASHI_LORDS[rashiB - 1]}` },
    { id: 'Gana', points: ganaPoints, max: KOOTA_MAX.Gana, detail: `${ganaA} × ${ganaB}` },
    { id: 'Bhakoot', points: bhakootScore(rashiA, rashiB), max: KOOTA_MAX.Bhakoot, detail: `${moonA?.rashiName ?? ''} × ${moonB?.rashiName ?? ''}` },
    { id: 'Nadi', points: nadiScore(nakIdxA, nakIdxB), max: KOOTA_MAX.Nadi, detail: `${nakNameA ?? '—'} (${['Aadi', 'Madhya', 'Antya'][nakIdxA % 3]}) × ${nakNameB ?? '—'} (${['Aadi', 'Madhya', 'Antya'][nakIdxB % 3]})` },
  ];

  const total = Math.round(kootas.reduce((acc, k) => acc + k.points, 0) * 100) / 100;
  const totalMax = 36;
  const mangalA = mangalDosha(a);
  const mangalB = mangalDosha(b);
  const nadiBlock = kootas.find(k => k.id === 'Nadi')?.points === 0;
  const bhakootBlock = kootas.find(k => k.id === 'Bhakoot')?.points === 0;
  const mangalBlock = mangalA.hasDosha && mangalB.hasDosha;

  let verdict = 'Auspicious alignment — strong traditional compatibility.';
  if (total < 18) verdict = 'Low compatibilility per Ashtakoota — seek scholarly review before finalizing.';
  else if (total < 24) verdict = 'Moderate compatibility — few areas need scholarly guidance.';
  if (nadiBlock) verdict = 'Nadi Dosha detected (same Nadi) — classical texts advise specialist consultation.';
  else if (bhakootBlock) verdict = 'Bhakoot Dosha detected — specialist review recommended.';
  else if (mangalBlock && total >= 24) verdict = `${verdict} Note: both charts carry Mangal Dosh — matching remedies exist (classical mitigations).`;

  return { total, max: totalMax, kootas, mangalA, mangalB, mangalBlock, nadiBlock, bhakootBlock, verdict };
}

/**
 * Convenience: two raw profiles (see profileStore) → full result.
 */
export function milanFromProfiles(profileA, profileB) {
  const build = (p) => calculateKundali({
    birthDate: p.birthDate,
    birthTime: p.birthTime || '12:00',
    latitude: p.lat ?? 25.5941,
    longitude: p.lng ?? 85.1376,
    timezone: p.tz ?? 5.5,
    locationName: p.birthCity || 'Custom Location',
  });
  return kundaliMilan(build(profileA), build(profileB));
}
