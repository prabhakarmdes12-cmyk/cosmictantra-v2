/**
 * SHODASHAVARGA — the sixteen divisional charts (D1..D60).
 * Convention: IMPLEMENTED_CONVENTION_BPHS (Parashara). Deterministic, from
 * canonical sidereal longitudes only.
 *
 * Each divisional function maps a sidereal longitude -> destination sign index (0..11)
 * following the classical BPHS rules.
 */

import { signOf, degInSign, norm360, isOddSign, SIGN_MODALITY } from './math.js';

// D1 — Rashi
function d1(lon) { return signOf(lon); }

// D2 — Hora (Parashara): 0-15° -> Leo(Sun) for odd, Cancer(Moon) for even; 15-30° swapped
function d2(lon) {
  const sign = signOf(lon);
  const d = degInSign(lon);
  const firstHalf = d < 15;
  const odd = isOddSign(sign);
  // odd sign first half -> Leo(4), second half -> Cancer(3); even reversed
  if (odd) return firstHalf ? 4 : 3;
  return firstHalf ? 3 : 4;
}

// D3 — Drekkana: 0-10 same sign, 10-20 5th, 20-30 9th
function d3(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / 10); // 0,1,2
  return (sign + part * 4) % 12;
}

// D4 — Chaturthamsha: quarters -> sign, 4th, 7th, 10th
function d4(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / 7.5); // 0..3
  return (sign + part * 3) % 12;
}

// D7 — Saptamsha: odd sign start same, even sign start 7th
function d7(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / (30 / 7)); // 0..6
  const start = isOddSign(sign) ? sign : (sign + 6) % 12;
  return (start + part) % 12;
}

// D9 — Navamsha: continuous count from element-based starting sign
function d9(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / (30 / 9)); // 0..8
  // start sign by element: fire->Aries(0), earth->Capricorn(9), air->Libra(6), water->Cancer(3)
  const elementStart = [0, 9, 6, 3];
  const el = sign % 4; // 0 fire,1 earth,2 air,3 water for Aries.. pattern repeats every sign? Actually element cycles by sign%4
  const start = elementStart[el];
  return (start + part) % 12;
}

// D10 — Dashamsha: odd sign start same, even sign start 9th
function d10(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / 3); // 0..9
  const start = isOddSign(sign) ? sign : (sign + 8) % 12;
  return (start + part) % 12;
}

// D12 — Dwadashamsha: start from same sign, 12 parts
function d12(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / 2.5); // 0..11
  return (sign + part) % 12;
}

// D16 — Shodashamsha (Kalamsha): movable->Aries, fixed->Leo, dual->Sagittarius
function d16(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / (30 / 16)); // 0..15
  const start = [0, 4, 8][SIGN_MODALITY[sign]];
  return (start + part) % 12;
}

// D20 — Vimshamsha: movable->Aries, fixed->Sagittarius, dual->Leo
function d20(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / (30 / 20));
  const start = [0, 8, 4][SIGN_MODALITY[sign]];
  return (start + part) % 12;
}

// D24 — Chaturvimshamsha (Siddhamsha): odd->Leo, even->Cancer
function d24(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / (30 / 24));
  const start = isOddSign(sign) ? 4 : 3;
  return (start + part) % 12;
}

// D27 — Bhamsha/Nakshatramsha: fire->Aries, earth->Cancer, air->Libra, water->Capricorn
function d27(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / (30 / 27));
  const start = [0, 3, 6, 9][sign % 4];
  return (start + part) % 12;
}

// D30 — Trimshamsha: unequal parts by odd/even sign, mapped to lords' signs
function d30(lon) {
  const sign = signOf(lon);
  const d = degInSign(lon);
  const odd = isOddSign(sign);
  if (odd) {
    // Mars 0-5 (Aries), Saturn 5-10 (Aquarius), Jupiter 10-18 (Sagittarius), Mercury 18-25 (Gemini), Venus 25-30 (Libra)
    if (d < 5) return 0;
    if (d < 10) return 10;
    if (d < 18) return 8;
    if (d < 25) return 2;
    return 6;
  }
  // even reversed: Venus 0-5 (Taurus), Mercury 5-12 (Virgo), Jupiter 12-20 (Pisces), Saturn 20-25 (Capricorn), Mars 25-30 (Scorpio)
  if (d < 5) return 1;
  if (d < 12) return 5;
  if (d < 20) return 11;
  if (d < 25) return 9;
  return 7;
}

// Generic amsha starting from same sign, N equal parts (used by D40,D45,D60 with proper start rule)
// D40 — Khavedamsha: odd->Aries, even->Libra
function d40(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / (30 / 40));
  const start = isOddSign(sign) ? 0 : 6;
  return (start + part) % 12;
}

// D45 — Akshavedamsha: movable->Aries, fixed->Leo, dual->Sagittarius
function d45(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / (30 / 45));
  const start = [0, 4, 8][SIGN_MODALITY[sign]];
  return (start + part) % 12;
}

// D60 — Shashtiamsha: count parts from same sign
function d60(lon) {
  const sign = signOf(lon);
  const part = Math.floor(degInSign(lon) / 0.5); // 0..59
  return (sign + part) % 12;
}

export const VARGA_FUNCTIONS = {
  D1: d1, D2: d2, D3: d3, D4: d4, D7: d7, D9: d9, D10: d10, D12: d12,
  D16: d16, D20: d20, D24: d24, D27: d27, D30: d30, D40: d40, D45: d45, D60: d60,
};

export const VARGA_META = {
  D1: { name: 'Rashi', signifies: 'Body, overall life' },
  D2: { name: 'Hora', signifies: 'Wealth' },
  D3: { name: 'Drekkana', signifies: 'Siblings, courage' },
  D4: { name: 'Chaturthamsha', signifies: 'Fortune, property' },
  D7: { name: 'Saptamsha', signifies: 'Children, progeny' },
  D9: { name: 'Navamsha', signifies: 'Spouse, dharma, strength' },
  D10: { name: 'Dashamsha', signifies: 'Career, karma' },
  D12: { name: 'Dwadashamsha', signifies: 'Parents' },
  D16: { name: 'Shodashamsha', signifies: 'Vehicles, comforts' },
  D20: { name: 'Vimshamsha', signifies: 'Spiritual pursuits' },
  D24: { name: 'Chaturvimshamsha', signifies: 'Education, learning' },
  D27: { name: 'Bhamsha', signifies: 'Strength & weakness' },
  D30: { name: 'Trimshamsha', signifies: 'Misfortunes, evils' },
  D40: { name: 'Khavedamsha', signifies: 'Auspicious/inauspicious effects' },
  D45: { name: 'Akshavedamsha', signifies: 'All matters, character' },
  D60: { name: 'Shashtiamsha', signifies: 'Past-life karma, everything' },
};

export const VARGA_ORDER = Object.keys(VARGA_FUNCTIONS);

/** Compute a single divisional chart from canonical planet longitudes + lagna. */
export function computeVarga(kundali, dcode) {
  const fn = VARGA_FUNCTIONS[dcode];
  if (!fn) throw new Error(`Unknown varga ${dcode}`);
  const lagnaLon = kundali.lagna.longitude;
  const lagnaSign = fn(lagnaLon);

  const planets = kundali.planets.map((p) => {
    const sign = fn(p.longitude);
    const house = ((sign - lagnaSign + 12) % 12) + 1;
    return {
      name: p.name,
      sign,
      signName: require_sign(sign),
      house,
      isRetrograde: p.isRetrograde,
      // Vargottama: same sign in D1 and this varga
      vargottama: dcode !== 'D1' && signOf(p.longitude) === sign,
    };
  });

  const houses = Array.from({ length: 12 }, (_, i) => {
    const sign = (lagnaSign + i) % 12;
    return {
      house: i + 1,
      sign,
      signName: require_sign(sign),
      planets: planets.filter((p) => p.house === i + 1).map((p) => p.name),
    };
  });

  return {
    code: dcode,
    name: VARGA_META[dcode]?.name || dcode,
    signifies: VARGA_META[dcode]?.signifies || '',
    lagnaSign,
    lagnaSignName: require_sign(lagnaSign),
    planets,
    houses,
  };
}

// local sign-name (avoid circular import weight)
const _SIGN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
function require_sign(i) { return _SIGN[((i % 12) + 12) % 12]; }

/** Compute all 16 vargas. */
export function computeAllVargas(kundali) {
  const out = {};
  for (const code of VARGA_ORDER) out[code] = computeVarga(kundali, code);
  return out;
}

/** Vargottama planets across D1/D9. */
export function vargottamaPlanets(kundali) {
  return kundali.planets
    .filter((p) => signOf(p.longitude) === d9(p.longitude))
    .map((p) => p.name);
}

export default { VARGA_FUNCTIONS, VARGA_META, VARGA_ORDER, computeVarga, computeAllVargas, vargottamaPlanets };
