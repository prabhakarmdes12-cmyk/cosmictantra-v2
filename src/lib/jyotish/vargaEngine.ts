/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Generic Varga Engine (Shodashavarga)
 * Implements classical Parashari mathematical algorithms for D1 to D60 harmonic divisional charts.
 * Complies with Invariants INV_JYOTISH_001, INV_JYOTISH_002, INV_JYOTISH_003.
 *
 * Sprint D qualification: all sixteen schemes verified against VARGA_BOUNDARY_BPHS_001
 * (3420 scheme rows + 6488 boundary probes + 28 classical anchors, 0 mismatches) plus
 * independent D9 harmonic identity, dual-implementation parity and vargottama identity
 * property checks — see docs/reference-grade/varga-certification.md. The mapping rules
 * were NOT changed by qualification; only verified (and the D9 declaration corrected).
 */

/** CT_INV_008: the varga implementation is versioned like every other calculator. */
export const VARGA_ENGINE_VERSION = 'varga-engine-1.0.0 (shodashavarga, sprint-D qualified)';

export interface VargaPlanetPlacement {
  planet: string;
  longitude: number;
  natalRashiId: number;
  vargaRashiId: number; // 1 to 12 (1 = Aries)
  vargaRashiName: string;
  vargaRashiEn: string;
  vargaRashiLord: string;
  divisionDegree: number; // Degree within the varga sign (0 to 30)
  pada?: number;
  isVargottama: boolean;
  dignity: string;
}

export interface VargaLagnaPlacement {
  longitude: number;
  natalRashiId: number;
  vargaRashiId: number;
  vargaRashiName: string;
  vargaRashiEn: string;
  vargaRashiLord: string;
  divisionDegree: number;
}

export interface VargaHousePlacement {
  houseNumber: number; // 1 to 12
  rashiId: number;
  rashiName: string;
  rashiEn: string;
  rashiLord: string;
  planetsInHouse: string[];
}

export interface VargaChart {
  division: number; // e.g. 1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60
  name: string; // 'Navamsha'
  sanskritName: string; // 'नवांश'
  significance: string; // 'Dharma, Marriage, Inner Potential'
  tradition: string; // 'Parashari'
  planets: Record<string, VargaPlanetPlacement>;
  planetsArray: VargaPlanetPlacement[];
  lagna: VargaLagnaPlacement;
  houses: VargaHousePlacement[];
  vargottamaPlanets: string[];
}

export const RASHI_DATA = [
  { id: 1, name: 'Mesha', en: 'Aries', lord: 'Mars', element: 'Fire', mobility: 'Movable' },
  { id: 2, name: 'Vrishabha', en: 'Taurus', lord: 'Venus', element: 'Earth', mobility: 'Fixed' },
  { id: 3, name: 'Mithuna', en: 'Gemini', lord: 'Mercury', element: 'Air', mobility: 'Dual' },
  { id: 4, name: 'Karka', en: 'Cancer', lord: 'Moon', element: 'Water', mobility: 'Movable' },
  { id: 5, name: 'Simha', en: 'Leo', lord: 'Sun', element: 'Fire', mobility: 'Fixed' },
  { id: 6, name: 'Kanya', en: 'Virgo', lord: 'Mercury', element: 'Earth', mobility: 'Dual' },
  { id: 7, name: 'Tula', en: 'Libra', lord: 'Venus', element: 'Air', mobility: 'Movable' },
  { id: 8, name: 'Vrishchika', en: 'Scorpio', lord: 'Mars', element: 'Water', mobility: 'Fixed' },
  { id: 9, name: 'Dhanu', en: 'Sagittarius', lord: 'Jupiter', element: 'Fire', mobility: 'Dual' },
  { id: 10, name: 'Makara', en: 'Capricorn', lord: 'Saturn', element: 'Earth', mobility: 'Movable' },
  { id: 11, name: 'Kumbha', en: 'Aquarius', lord: 'Saturn', element: 'Air', mobility: 'Fixed' },
  { id: 12, name: 'Meena', en: 'Pisces', lord: 'Jupiter', element: 'Water', mobility: 'Dual' }
];

export const VARGA_METADATA: Record<number, { name: string; sanskritName: string; significance: string }> = {
  1: { name: 'Rashi', sanskritName: 'राशि', significance: 'Physical Body, General Life & Destiny' },
  2: { name: 'Hora', sanskritName: 'होरा', significance: 'Wealth, Prosperity & Financial Assets' },
  3: { name: 'Drekkana', sanskritName: 'द्रेष्काण', significance: 'Siblings, Courage, Vitality & 22nd Drekkana' },
  4: { name: 'Chaturthamsha', sanskritName: 'चतुर्थांश', significance: 'Fixed Assets, Real Estate, Home & Fortune' },
  7: { name: 'Saptamsha', sanskritName: 'सप्तांश', significance: 'Children, Progeny & Creative Lineage' },
  9: { name: 'Navamsha', sanskritName: 'नवांश', significance: 'Spouse, Marriage, Dharma & Soul Purpose' },
  10: { name: 'Dashamsha', sanskritName: 'दशांश', significance: 'Career, Profession, Fame & Public Standing' },
  12: { name: 'Dwadashamsha', sanskritName: 'द्वादशांश', significance: 'Parents, Ancestors & Past Karma' },
  16: { name: 'Shodashamsha', sanskritName: 'षोडशांश', significance: 'Vehicles, Conveyances, Pleasures & Comforts' },
  20: { name: 'Vimshamsha', sanskritName: 'विंशांश', significance: 'Spiritual Pursuits, Upasana & Devotion' },
  24: { name: 'Chaturvimshamsha', sanskritName: 'चतुर्विंशांश', significance: 'Learning, Higher Education, Knowledge & Vidya' },
  27: { name: 'Saptavimshamsha', sanskritName: 'सप्तविंशांश', significance: 'General Strengths, Weaknesses & Stamina' },
  30: { name: 'Trimshamsha', sanskritName: 'त्रिंशांश', significance: 'Misfortunes, Arishta, Evils & Overcoming Obstacles' },
  40: { name: 'Khavedamsha', sanskritName: 'खवेदांश', significance: 'Auspicious & Inauspicious Karmic Influences' },
  45: { name: 'Akshavedamsha', sanskritName: 'अक्षवेदांश', significance: 'General Well-Being & All Moral Qualities' },
  60: { name: 'Shashtiamsha', sanskritName: 'षष्ट्यंश', significance: 'Micro-Karma, Deep Past-Life Destiny & Final Balance' }
};

export const SHASHTIAMSHA_NAMES = [
  'Ghora', 'Rakshasa', 'Deva', 'Kubera', 'Yaksha', 'Kinnara', 'Bhrashta', 'Kulaghna',
  'Garala', 'Vahni', 'Maya', 'Purishaka', 'Apampathi', 'Marutwan', 'Kala', 'Sarpa',
  'Amrita', 'Indu', 'Mridu', 'Komala', 'Heramba', 'Brahma', 'Vishnu', 'Maheshwara',
  'Deva', 'Ardra', 'Kalanala', 'Kshitiswara', 'Kamalakara', 'Gulika', 'Mrityu', 'Kala',
  'Davagni', 'Ghora', 'Yama', 'Kantaka', 'Sudha', 'Amrita', 'Poornachandra', 'Vishadagdha',
  'Kulanasha', 'Vamshakshaya', 'Utpata', 'Kala', 'Saumya', 'Komala', 'Sheetala', 'Karaladamshtra',
  'Chandramukhi', 'Praveena', 'Kala', 'Bhrashta', 'Mukhyamsha', 'Vamshakshaya', 'Utpata', 'Kala',
  'Saumya', 'Komala', 'Sheetala', 'Karaladamshtra'
];

function normalize(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Calculates the exact Varga sign placement (0 to 11, where 0 = Aries)
 * according to classical Brihat Parashara Hora Shastra rules.
 */
export function calculateVargaPlacement(longitude: number, division: number): { vargaRashiIndex: number; divisionDegree: number } {
  const norm = normalize(longitude);
  const rashiIndex = Math.floor(norm / 30); // 0 to 11
  const degInRashi = norm % 30;
  const isOddRashi = (rashiIndex % 2 === 0); // 0 (Aries), 2 (Gemini), 4 (Leo)... are odd signs (1st, 3rd, 5th)

  const partSpan = 30 / division;
  const partIndex = Math.min(Math.floor((degInRashi + 1e-9) / partSpan), division - 1);
  const divisionDegree = (degInRashi % partSpan) * division; // Normalized 0 to 30 degrees in the division sign

  let vargaRashiIndex = 0;

  switch (division) {
    case 1: // D1: Rashi
      vargaRashiIndex = rashiIndex;
      break;

    case 2: // D2: Parashari Hora
      // In odd signs: 0-15° is Sun (Leo=4), 15-30° is Moon (Cancer=3)
      // In even signs: 0-15° is Moon (Cancer=3), 15-30° is Sun (Leo=4)
      if (isOddRashi) {
        vargaRashiIndex = (degInRashi < 15) ? 4 : 3;
      } else {
        vargaRashiIndex = (degInRashi < 15) ? 3 : 4;
      }
      break;

    case 3: // D3: Drekkana
      // 0-10°: Same sign (0 offset)
      // 10-20°: 5th from sign (4 offset)
      // 20-30°: 9th from sign (8 offset)
      vargaRashiIndex = (rashiIndex + partIndex * 4) % 12;
      break;

    case 4: // D4: Chaturthamsha
      // 0-7.5°: Same sign
      // 7.5-15°: 4th from sign
      // 15-22.5°: 7th from sign
      // 22.5-30°: 10th from sign
      vargaRashiIndex = (rashiIndex + partIndex * 3) % 12;
      break;

    case 7: // D7: Saptamsha
      // Odd signs: Count from same sign
      // Even signs: Count from 7th sign from it
      if (isOddRashi) {
        vargaRashiIndex = (rashiIndex + partIndex) % 12;
      } else {
        vargaRashiIndex = (rashiIndex + 6 + partIndex) % 12;
      }
      break;

    case 9: // D9: Navamsha
      // Fi (Aries, Leo, Sag): Start Aries (0)
      // Ea (Taurus, Virgo, Cap): Start Capricorn (9)
      // Ai (Gemini, Libra, Aqua): Start Libra (6)
      // Wa (Cancer, Scorpio, Pisces): Start Cancer (3)
      {
        const baseOffsets = [0, 9, 6, 3]; // Fi, Ea, Ai, Wa
        const base = baseOffsets[rashiIndex % 4];
        vargaRashiIndex = (base + partIndex) % 12;
      }
      break;

    case 10: // D10: Dashamsha
      // Odd signs: Count from same sign
      // Even signs: Count from 9th sign from it
      if (isOddRashi) {
        vargaRashiIndex = (rashiIndex + partIndex) % 12;
      } else {
        vargaRashiIndex = (rashiIndex + 8 + partIndex) % 12;
      }
      break;

    case 12: // D12: Dwadashamsha
      // Starts from the sign itself and continues consecutively
      vargaRashiIndex = (rashiIndex + partIndex) % 12;
      break;

    case 16: // D16: Shodashamsha
      // Movable signs (0, 3, 6, 9): Count from Aries (0)
      // Fixed signs (1, 4, 7, 10): Count from Leo (4)
      // Dual signs (2, 5, 8, 11): Count from Sagittarius (8)
      {
        const mobility = rashiIndex % 3; // 0=Movable, 1=Fixed, 2=Dual
        const base = (mobility === 0) ? 0 : (mobility === 1) ? 4 : 8;
        vargaRashiIndex = (base + partIndex) % 12;
      }
      break;

    case 20: // D20: Vimshamsha
      // Movable signs: Count from Aries (0)
      // Fixed signs: Count from Sagittarius (8)
      // Dual signs: Count from Leo (4)
      {
        const mobility = rashiIndex % 3;
        const base = (mobility === 0) ? 0 : (mobility === 1) ? 8 : 4;
        vargaRashiIndex = (base + partIndex) % 12;
      }
      break;

    case 24: // D24: Chaturvimshamsha (Siddhamsa)
      // Odd signs: Count from Leo (4)
      // Even signs: Count from Cancer (3)
      if (isOddRashi) {
        vargaRashiIndex = (4 + partIndex) % 12;
      } else {
        vargaRashiIndex = (3 + partIndex) % 12;
      }
      break;

    case 27: // D27: Saptavimshamsha (Nakshatramsha)
      // Fi (0, 4, 8): Count from Aries (0)
      // Ea (1, 5, 9): Count from Cancer (3)
      // Ai (2, 6, 10): Count from Libra (6)
      // Wa (3, 7, 11): Count from Capricorn (9)
      {
        const baseOffsets = [0, 3, 6, 9];
        const base = baseOffsets[rashiIndex % 4];
        vargaRashiIndex = (base + partIndex) % 12;
      }
      break;

    case 30: // D30: Trimshamsha
      // Classical Parashari degree spans:
      // Odd signs: 0-5° Mars (Aries=0), 5-10° Saturn (Aquarius=10), 10-18° Jupiter (Sag=8), 18-25° Mercury (Gemini=2), 25-30° Venus (Libra=6)
      // Even signs: 0-5° Venus (Taurus=1), 5-12° Mercury (Virgo=5), 12-20° Jupiter (Pisces=11), 20-25° Saturn (Capricorn=9), 25-30° Mars (Scorpio=7)
      if (isOddRashi) {
        if (degInRashi < 5) vargaRashiIndex = 0; // Aries (Mars)
        else if (degInRashi < 10) vargaRashiIndex = 10; // Aquarius (Saturn)
        else if (degInRashi < 18) vargaRashiIndex = 8; // Sagittarius (Jupiter)
        else if (degInRashi < 25) vargaRashiIndex = 2; // Gemini (Mercury)
        else vargaRashiIndex = 6; // Libra (Venus)
      } else {
        if (degInRashi < 5) vargaRashiIndex = 1; // Taurus (Venus)
        else if (degInRashi < 12) vargaRashiIndex = 5; // Virgo (Mercury)
        else if (degInRashi < 20) vargaRashiIndex = 11; // Pisces (Jupiter)
        else if (degInRashi < 25) vargaRashiIndex = 9; // Capricorn (Saturn)
        else vargaRashiIndex = 7; // Scorpio (Mars)
      }
      break;

    case 40: // D40: Khavedamsha
      // Odd signs: Count from Aries (0)
      // Even signs: Count from Libra (6)
      if (isOddRashi) {
        vargaRashiIndex = (0 + partIndex) % 12;
      } else {
        vargaRashiIndex = (6 + partIndex) % 12;
      }
      break;

    case 45: // D45: Akshavedamsha
      // Movable signs: Count from Aries (0)
      // Fixed signs: Count from Leo (4)
      // Dual signs: Count from Sagittarius (8)
      {
        const mobility = rashiIndex % 3;
        const base = (mobility === 0) ? 0 : (mobility === 1) ? 4 : 8;
        vargaRashiIndex = (base + partIndex) % 12;
      }
      break;

    case 60: // D60: Shashtiamsha
      // Starts from the sign itself and proceeds consecutively (1 to 60)
      vargaRashiIndex = (rashiIndex + partIndex) % 12;
      break;

    default:
      vargaRashiIndex = (rashiIndex * division + partIndex) % 12;
      break;
  }

  return { vargaRashiIndex, divisionDegree };
}

/**
 * Master Varga Generator: Computes full Varga chart for any division (D1 to D60).
 */
export function generateVargaChart(division: number, lagnaLongitude: number, planets: Array<{ name: string; longitude: number; rashiId: number }>): VargaChart {
  const meta = VARGA_METADATA[division] || {
    name: `D${division}`,
    sanskritName: `D${division}`,
    significance: 'Divisional Harmonic Analysis'
  };

  // 1. Calculate Lagna Placement in Varga
  const lagnaPlace = calculateVargaPlacement(lagnaLongitude, division);
  const lagnaRashi = RASHI_DATA[lagnaPlace.vargaRashiIndex];
  const lagna: VargaLagnaPlacement = {
    longitude: lagnaLongitude,
    natalRashiId: Math.floor(normalize(lagnaLongitude) / 30) + 1,
    vargaRashiId: lagnaPlace.vargaRashiIndex + 1,
    vargaRashiName: lagnaRashi.name,
    vargaRashiEn: lagnaRashi.en,
    vargaRashiLord: lagnaRashi.lord,
    divisionDegree: lagnaPlace.divisionDegree
  };

  // 2. Calculate Planet Placements in Varga
  const planetPlacements: Record<string, VargaPlanetPlacement> = {};
  const planetsArray: VargaPlanetPlacement[] = [];
  const vargottamaPlanets: string[] = [];

  for (const p of planets) {
    const pPlace = calculateVargaPlacement(p.longitude, division);
    const pRashi = RASHI_DATA[pPlace.vargaRashiIndex];
    const isVargottama = (p.rashiId - 1) === pPlace.vargaRashiIndex;

    if (isVargottama) {
      vargottamaPlanets.push(p.name);
    }

    const placement: VargaPlanetPlacement = {
      planet: p.name,
      longitude: p.longitude,
      natalRashiId: p.rashiId,
      vargaRashiId: pPlace.vargaRashiIndex + 1,
      vargaRashiName: pRashi.name,
      vargaRashiEn: pRashi.en,
      vargaRashiLord: pRashi.lord,
      divisionDegree: pPlace.divisionDegree,
      isVargottama,
      dignity: (pRashi.lord === p.name) ? 'Own Sign' : 'Neutral'
    };

    planetPlacements[p.name] = placement;
    planetsArray.push(placement);
  }

  // 3. Build 12 Houses from Varga Lagna
  const houses: VargaHousePlacement[] = [];
  for (let h = 1; h <= 12; h++) {
    const houseRashiIdx = (lagnaPlace.vargaRashiIndex + (h - 1)) % 12;
    const hRashi = RASHI_DATA[houseRashiIdx];
    const planetsInHouse = planetsArray.filter(p => p.vargaRashiId === (houseRashiIdx + 1)).map(p => p.planet);

    houses.push({
      houseNumber: h,
      rashiId: houseRashiIdx + 1,
      rashiName: hRashi.name,
      rashiEn: hRashi.en,
      rashiLord: hRashi.lord,
      planetsInHouse
    });
  }

  return {
    division,
    name: meta.name,
    sanskritName: meta.sanskritName,
    significance: meta.significance,
    tradition: 'Parashari',
    planets: planetPlacements,
    planetsArray,
    lagna,
    houses,
    vargottamaPlanets
  };
}

/**
 * Generates all 16 classical Shodashavarga charts (D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60).
 */
export function generateShodashavarga(lagnaLongitude: number, planets: Array<{ name: string; longitude: number; rashiId: number }>): Record<number, VargaChart> {
  const divisions = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];
  const results: Record<number, VargaChart> = {};

  for (const div of divisions) {
    results[div] = generateVargaChart(div, lagnaLongitude, planets);
  }

  return results;
}
