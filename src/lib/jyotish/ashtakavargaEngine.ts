/**
 * Classical Parashari Ashtakavarga Engine
 * Computes Bhinna Ashtakavarga (BAV) for 7 Grahas and Sarvashtakavarga (SAV) 337 Bindus.
 * Reference: Brihat Parashara Hora Shastra, Ashtakavarga chapters (verse locator not
 * independently verified; the binding verification is the classical totals:
 * Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39, SAV 337 —
 * all reproduced exactly by the tables below and pinned by the Sprint F fixture set).
 *
 * Sprint F qualification (docs/reference-grade/08-sprint-f-bala-qualification.md):
 * - Trikona Shodhana verified: per-trine-group minimum subtraction identity.
 * - FIXED (RSK_015): `ekadhipatyaShodhana` previously returned a COPY of the trikona
 *   result while its name promised the Ekadhipatya reduction — a silent mislabel.
 *   The Ekadhipatya reduction is NOT implemented; the field now declares
 *   NOT_CALCULATED with a reason (CT_INV_006). It is never fabricated.
 */

/** CT_INV_008: the ashtakavarga implementation is versioned like every other calculator. */
export const ASHTAKAVARGA_ENGINE_VERSION = 'ashtakavarga-engine-1.0.0 (bav+sav+trikona, sprint-F qualified)';

export interface AshtakavargaResult {
  bav: Record<string, number[]>; // 7 planets x 12 rashis (0-indexed Mesha to Meena)
  sav: number[]; // 12 rashis sum (Total = 337)
  rashiNames: string[];
  houseSav: { house: number; rashi: string; rashiId: number; bindus: number; category: string }[];
  totalBindus: number;
  shodhana: {
    /** Trikona (trine-group) reduction: each trine group 1-5-9 / 2-6-10 / 3-7-11 / 4-8-12 reduced by its minimum. */
    trikonaShodhana: number[];
    /**
     * Ekadhipatya (co-lordship) reduction — NOT IMPLEMENTED. Declared, never fabricated
     * (CT_INV_006). Before Sprint F this field carried a copy of the trikona values
     * under the ekadhipatya name (RSK_015, mislabel removed).
     */
    ekadhipatyaShodhana: { status: 'NOT_CALCULATED'; reason: string; values: null };
  };
}

const RASHIS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];

// Standard Classical Parashari Benefic Points Distribution (BPHS)
// Benefic houses from each planet & Lagna
const BAV_RULES: Record<string, Record<string, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [3, 4, 6, 10, 11, 12]
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Lagna: [3, 6, 10, 11]
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 3, 6, 10, 11]
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 2, 4, 6, 8, 10, 11]
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11]
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Lagna: [1, 2, 3, 4, 5, 8, 9, 11]
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Lagna: [1, 3, 4, 6, 10, 11]
  }
};

export function calculateAshtakavarga(planets: Record<string, { rasi?: number; rashiId?: number }>, lagnaRashiId: number): AshtakavargaResult {
  const getRashi = (p: string) => {
    if (p === 'Lagna') return lagnaRashiId - 1; // 0-indexed
    const obj = planets[p];
    if (!obj) return 0;
    const r = obj.rashiId !== undefined ? obj.rashiId : obj.rasi !== undefined ? obj.rasi : 1;
    return (r - 1 + 12) % 12;
  };

  const bav: Record<string, number[]> = {};
  const sav = new Array(12).fill(0);

  const contributors = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna'];
  const targets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  targets.forEach(target => {
    const table = new Array(12).fill(0);
    const rules = BAV_RULES[target];

    contributors.forEach(contributor => {
      const donorRashi = getRashi(contributor);
      const beneficHouses = rules[contributor] || [];

      beneficHouses.forEach(h => {
        const destRashi = (donorRashi + (h - 1)) % 12;
        table[destRashi] += 1;
      });
    });

    bav[target] = table;
    for (let r = 0; r < 12; r++) {
      sav[r] += table[r];
    }
  });

  const totalBindus = sav.reduce((a, b) => a + b, 0);

  // House SAV from natal Lagna
  const houseSav = [];
  for (let h = 1; h <= 12; h++) {
    const rIdx = (lagnaRashiId - 1 + (h - 1)) % 12;
    const bindus = sav[rIdx];
    let category = 'Moderate';
    if (bindus >= 30) category = 'Auspicious (Very Strong)';
    else if (bindus >= 28) category = 'Favorable';
    else if (bindus < 25) category = 'Challenging / Weak';

    houseSav.push({
      house: h,
      rashi: RASHIS[rIdx],
      rashiId: rIdx + 1,
      bindus,
      category
    });
  }

  // Trikona Shodhana (Reduction of Triplicities: Fire 1,5,9; Earth 2,6,10; Air 3,7,11; Water 4,8,12)
  const trikonaShodhana = [...sav];
  for (let g = 0; g < 4; g++) {
    const minVal = Math.min(trikonaShodhana[g], trikonaShodhana[g + 4], trikonaShodhana[g + 8]);
    trikonaShodhana[g] -= minVal;
    trikonaShodhana[g + 4] -= minVal;
    trikonaShodhana[g + 8] -= minVal;
  }

  return {
    bav,
    sav,
    rashiNames: RASHIS,
    houseSav,
    totalBindus,
    shodhana: {
      trikonaShodhana,
      ekadhipatyaShodhana: {
        status: 'NOT_CALCULATED',
        reason: 'Ekadhipatya Shodhana (reduction of same-lord rashi pairs) is not implemented in this engine. The pre-Sprint-F values were a mislabeled copy of the trikona reduction and have been withdrawn rather than shown under the wrong name.',
        values: null
      }
    }
  };
}
