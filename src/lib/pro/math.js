/**
 * Shared deterministic math helpers for the professional Jyotish surface.
 * No network, no LLM — pure functions over the canonical snapshot.
 */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const SIGN_SANSKRIT = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

export const SIGN_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];

// 0 = movable(chara), 1 = fixed(sthira), 2 = dual(dwiswabhava)
export const SIGN_MODALITY = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2];
// 0 = fire, 1 = earth, 2 = air, 3 = water
export const SIGN_ELEMENT = [0, 3, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];
// odd(male)=false even index? Actually odd signs (Aries=1) are odd => index0 even -> odd sign
export function isOddSign(signIndex) {
  return signIndex % 2 === 0; // Aries(0)->odd, Taurus(1)->even
}

export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// Vimshottari nakshatra lords in order (also used by other systems' star lords)
export const NAK_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

export function norm360(x) {
  return ((x % 360) + 360) % 360;
}

export function signOf(longitude) {
  return Math.floor(norm360(longitude) / 30);
}

export function degInSign(longitude) {
  return norm360(longitude) % 30;
}

/** Nakshatra index 0..26 for a longitude. */
export function nakOf(longitude) {
  return Math.floor(norm360(longitude) / (360 / 27)) % 27;
}

/** Pada 1..4 for a longitude. */
export function padaOf(longitude) {
  const within = norm360(longitude) % (360 / 27);
  return Math.floor(within / (360 / 108)) + 1;
}

export function nakLordOf(longitude) {
  return NAK_LORDS[nakOf(longitude) % 9];
}

export function formatDMS(deg) {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}° ${String(m).padStart(2, '0')}' ${String(s).padStart(2, '0')}"`;
}

/** Count from sign a to sign b inclusive (1..12), the classical "from X count to Y". */
export function countSigns(fromSign, toSign) {
  return ((toSign - fromSign + 12) % 12) + 1;
}

/** Move n signs forward (n can be negative). */
export function addSigns(sign, n) {
  return ((sign + n) % 12 + 12) % 12;
}

/** The classical Parashari graha drishti (full aspect) offsets by house count. */
export const GRAHA_ASPECTS = {
  Sun: [7], Moon: [7], Mercury: [7], Venus: [7],
  Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10],
  Rahu: [5, 7, 9], Ketu: [5, 7, 9],
};

/** Rashi drishti (Jaimini sign aspects). Returns array of aspected sign indices. */
export function rashiDrishti(signIndex) {
  const modality = SIGN_MODALITY[signIndex];
  const aspects = [];
  if (modality === 0) {
    // movable aspects all fixed except adjacent
    for (let i = 0; i < 12; i++) if (SIGN_MODALITY[i] === 1 && Math.abs(i - signIndex) !== 1) aspects.push(i);
  } else if (modality === 1) {
    // fixed aspects all movable except adjacent
    for (let i = 0; i < 12; i++) if (SIGN_MODALITY[i] === 0 && Math.abs(i - signIndex) !== 1) aspects.push(i);
  } else {
    // dual aspects the other dual signs
    for (let i = 0; i < 12; i++) if (SIGN_MODALITY[i] === 2 && i !== signIndex) aspects.push(i);
  }
  return aspects;
}

export default {
  DEG, RAD, SIGN_NAMES, SIGN_SANSKRIT, SIGN_LORDS, SIGN_MODALITY, SIGN_ELEMENT,
  NAKSHATRA_NAMES, NAK_LORDS, norm360, signOf, degInSign, nakOf, padaOf, nakLordOf,
  formatDMS, countSigns, addSigns, isOddSign, GRAHA_ASPECTS, rashiDrishti,
};
