/**
 * WAVE 1 — PROFESSIONAL ASHTAKAVARGA
 * ==================================
 * Convention: IMPLEMENTED_CONVENTION_BPHS_PARASHARA.
 *
 * Exposes ACTUAL bindu tables (not just interpretation scores):
 *   - Bhinnashtakavarga (per-planet bindus in 12 signs)
 *   - Prastara (the full contribution grid: which contributor gave each bindu)
 *   - Sarvashtakavarga (SAV) & Samudaya
 *   - Trikona Shodhana & Ekadhipatya Shodhana (reductions)
 *   - Kakshya (sub-divisions for transit)
 *
 * Invariant: total of all seven Bhinna charts == 337 (Parashara).
 */

import { signOf } from './math.js';

// Contributors order (7 grahas + Lagna). Rahu/Ketu excluded per classical BAV.
export const AV_CONTRIBUTORS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna'];
export const AV_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/**
 * Benefic-place tables (BPHS). For a target planet, each contributor donates a
 * bindu to the signs at the listed house-distances (1-based) counted FROM the
 * contributor's own sign.
 */
export const BENEFIC_PLACES = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11], Moon: [3, 6, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12], Jupiter: [5, 6, 9, 11], Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11], Moon: [1, 3, 6, 7, 10, 11], Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11], Jupiter: [1, 4, 7, 8, 10, 11, 12], Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11], Lagna: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11], Moon: [3, 6, 11], Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11], Jupiter: [6, 10, 11, 12], Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11], Lagna: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12], Moon: [2, 4, 6, 8, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12], Jupiter: [6, 8, 11, 12], Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11], Moon: [2, 5, 7, 9, 11], Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11], Jupiter: [1, 2, 3, 4, 7, 8, 10, 11], Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12], Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12], Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12], Mars: [3, 4, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11], Jupiter: [5, 8, 9, 10, 11], Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11], Lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11], Moon: [3, 6, 11], Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12], Jupiter: [5, 6, 11, 12], Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11], Lagna: [1, 3, 4, 6, 10, 11],
  },
};

// Expected classical totals per Bhinna chart (used as an internal invariant).
export const EXPECTED_BAV_TOTALS = { Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39 };
export const EXPECTED_SAV_TOTAL = 337;

/** Sign index (0..11) for each contributor from the kundali. */
function contributorSigns(kundali) {
  const m = {};
  for (const p of kundali.planets) m[p.name] = signOf(p.longitude);
  m.Lagna = signOf(kundali.lagna.longitude);
  return m;
}

/**
 * Bhinnashtakavarga for one target planet.
 * Returns { bindus: number[12], prastara: { contributor -> number[12] } }
 * where sign index 0 == Aries (absolute rashi, matching D1).
 */
export function bhinnashtakavarga(kundali, target) {
  const signs = contributorSigns(kundali);
  const table = BENEFIC_PLACES[target];
  const bindus = new Array(12).fill(0);
  const prastara = {};
  for (const contributor of AV_CONTRIBUTORS) {
    const from = signs[contributor];
    const places = table[contributor] || [];
    const row = new Array(12).fill(0);
    for (const houseDist of places) {
      const sign = (from + (houseDist - 1)) % 12;
      row[sign] = 1;
      bindus[sign] += 1;
    }
    prastara[contributor] = row;
  }
  return { target, bindus, prastara, total: bindus.reduce((a, b) => a + b, 0) };
}

/** All seven Bhinnashtakavarga charts. */
export function allBhinna(kundali) {
  const out = {};
  for (const p of AV_PLANETS) out[p] = bhinnashtakavarga(kundali, p);
  return out;
}

/** Sarvashtakavarga: sum of the seven BAV charts, per sign. */
export function sarvashtakavarga(kundali, bhinna) {
  const bh = bhinna || allBhinna(kundali);
  const sav = new Array(12).fill(0);
  for (const p of AV_PLANETS) for (let s = 0; s < 12; s++) sav[s] += bh[p].bindus[s];
  return { bindus: sav, total: sav.reduce((a, b) => a + b, 0) };
}

/**
 * Samudaya Ashtakavarga — SAV arranged by house (from Lagna) with the
 * running interpretation of relative strength between houses.
 */
export function samudaya(kundali, sav) {
  const s = sav || sarvashtakavarga(kundali);
  const lagnaSign = signOf(kundali.lagna.longitude);
  const byHouse = [];
  for (let h = 0; h < 12; h++) {
    const sign = (lagnaSign + h) % 12;
    byHouse.push({ house: h + 1, sign, bindus: s.bindus[sign] });
  }
  const avg = s.total / 12;
  return { byHouse, total: s.total, average: Math.round(avg * 100) / 100 };
}

/**
 * Trikona Shodhana (trinal reduction) for a single Bhinna chart.
 * For each trine group of signs, subtract the smallest value from all three;
 * if any is zero, all three become zero.
 */
export function trikonaShodhana(bindus) {
  const out = bindus.slice();
  const trines = [
    [0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11],
  ];
  for (const [a, b, c] of trines) {
    const vals = [out[a], out[b], out[c]];
    const min = Math.min(...vals);
    if (min === 0) {
      out[a] = 0; out[b] = 0; out[c] = 0;
    } else {
      out[a] -= min; out[b] -= min; out[c] -= min;
    }
  }
  return out;
}

/**
 * Ekadhipatya Shodhana (reduction of dual lordship). Applied to a
 * trikona-reduced chart. For each pair of signs owned by the same planet
 * (Mars: Aries/Scorpio, Venus: Taurus/Libra, Mercury: Gemini/Virgo,
 *  Jupiter: Sagittarius/Pisces, Saturn: Capricorn/Aquarius), apply the
 * classical rule based on whether the signs are occupied and their values.
 */
const DUAL_LORDSHIP = [
  [0, 7],  // Mars: Aries, Scorpio
  [1, 6],  // Venus: Taurus, Libra
  [2, 5],  // Mercury: Gemini, Virgo
  [8, 11], // Jupiter: Sagittarius, Pisces
  [9, 10], // Saturn: Capricorn, Aquarius
];
export function ekadhipatyaShodhana(reduced, occupiedSigns) {
  const out = reduced.slice();
  const occupied = new Set(occupiedSigns);
  for (const [a, b] of DUAL_LORDSHIP) {
    const va = out[a];
    const vb = out[b];
    const oa = occupied.has(a);
    const ob = occupied.has(b);
    // Both empty: both take the smaller value.
    if (!oa && !ob) {
      const min = Math.min(va, vb);
      out[a] = min; out[b] = min;
      // if values equal, both become 0
      if (va === vb) { out[a] = 0; out[b] = 0; }
    } else if (oa && !ob) {
      // one occupied (a), other empty (b): empty one becomes 0 if it has fewer/equal
      if (vb <= va) out[b] = 0;
    } else if (!oa && ob) {
      if (va <= vb) out[a] = 0;
    }
    // both occupied: no reduction
  }
  return out;
}

/** Full reduction (Trikona then Ekadhipatya) for a Bhinna chart. */
export function shodhita(kundali, target) {
  const bh = bhinnashtakavarga(kundali, target);
  const tk = trikonaShodhana(bh.bindus);
  const occupied = kundali.planets.map((p) => signOf(p.longitude));
  const ek = ekadhipatyaShodhana(tk, occupied);
  return { target, raw: bh.bindus, trikona: tk, ekadhipatya: ek };
}

/**
 * Kakshya — each sign is split into 8 kakshyas (each 3°45') owned in order:
 * Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Lagna. Used to judge
 * whether a transiting planet is in a kakshya that carries a bindu.
 */
export const KAKSHYA_LORDS = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Lagna'];
export function kakshyaOf(longitude) {
  const within = ((longitude % 30) + 30) % 30;
  const idx = Math.floor(within / (30 / 8)); // 0..7
  return { index: idx, lord: KAKSHYA_LORDS[idx] };
}

/**
 * For a given target planet's BAV, at a transit longitude, report whether the
 * kakshya lord of that transit position contributed a bindu in that sign.
 */
export function kakshyaTransit(kundali, target, transitLongitude) {
  const bh = bhinnashtakavarga(kundali, target);
  const sign = signOf(transitLongitude);
  const k = kakshyaOf(transitLongitude);
  const contributed = k.lord === 'Lagna'
    ? bh.prastara.Lagna[sign] === 1
    : (bh.prastara[k.lord] ? bh.prastara[k.lord][sign] === 1 : false);
  return { sign, kakshya: k, contributed, signBindus: bh.bindus[sign] };
}

/** Full Ashtakavarga bundle (everything at once). */
export function computeAshtakavarga(kundali) {
  const bhinna = allBhinna(kundali);
  const sav = sarvashtakavarga(kundali, bhinna);
  const sam = samudaya(kundali, sav);
  const reductions = {};
  for (const p of AV_PLANETS) reductions[p] = shodhita(kundali, p);
  return {
    bhinna,
    sarva: sav,
    samudaya: sam,
    reductions,
    invariants: {
      savTotal: sav.total,
      savTotalExpected: EXPECTED_SAV_TOTAL,
      savTotalOk: sav.total === EXPECTED_SAV_TOTAL,
      perPlanet: Object.fromEntries(AV_PLANETS.map((p) => [p, {
        total: bhinna[p].total,
        expected: EXPECTED_BAV_TOTALS[p],
        ok: bhinna[p].total === EXPECTED_BAV_TOTALS[p],
      }])),
    },
  };
}

export default {
  AV_CONTRIBUTORS, AV_PLANETS, BENEFIC_PLACES, EXPECTED_BAV_TOTALS, EXPECTED_SAV_TOTAL,
  bhinnashtakavarga, allBhinna, sarvashtakavarga, samudaya,
  trikonaShodhana, ekadhipatyaShodhana, shodhita, kakshyaOf, kakshyaTransit,
  computeAshtakavarga,
};
