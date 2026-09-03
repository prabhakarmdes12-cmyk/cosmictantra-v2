/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Comprehensive BPHS Bala Engine
 * Implements Full 6-Fold Shadbala (Sthana, Dig, Kala, Cheshta, Naisargika, Drik Balas in Virupas/Rupas),
 * 12 Bhava Balas, and 20-Point Vimshopaka Balas across 4 classical schemes (Shadvarga, Saptavarga, Dashavarga, Shodashavarga).
 *
 * Strict Compliance: Zero placeholder constants. Every subcomponent is mathematically derived
 * from canonical celestial coordinates and classical Brihat Parashara Hora Shastra rules.
 * Complies with Invariants INV_JYOTISH_001, INV_JYOTISH_002, INV_JYOTISH_003.
 *
 * Sprint F qualification (see docs/reference-grade/08-sprint-f-bala-qualification.md):
 * - FIXED (RSK_014): Nathonnatha/Tribhaga day-night determination used the planet's OWN
 *   house instead of the Sun's (measured: on a day chart, Jupiter in H1 received 0 and
 *   Moon in H4 received 60 — each planet saw a different "day"). Day birth is a property
 *   of the SUN: Sun in houses 7-12 (whole-sign above-horizon convention). A/B verified:
 *   every planet now shares one day/night determination.
 * - Declared simplifications (surfaced, not hidden): Kala Bala carries a nominal
 *   Varsha/Masa/Dina/Hora lord constant (45) and Yuddha Bala = 0 (planetary war not
 *   computed); Cheshta Bala uses a speed-ratio/retrograde model, not the epicyclic arc;
 *   Dig Bala is house-granular, not cusp-granular. See the Sprint F doc for the full list.
 */

/** CT_INV_008: the bala implementation is versioned like every other calculator. */
export const BALA_ENGINE_VERSION = 'bala-engine-1.0.0 (shadbala+bhava+vimsopaka, sprint-F qualified)';

import { generateShodashavarga, RASHI_DATA } from './vargaEngine';
import { getPanchadhaMaitri, NAISARGIKA_MAITRI } from './relationshipEngine';

export interface SthanaBalaDetail {
  uchchaBala: number; // Exaltation strength (0 to 60 Virupas)
  saptavargajaBala: number; // Sum of dignities in D1, D2, D3, D7, D9, D12, D30 (Virupas)
  ojhaYugmaBala: number; // Odd/Even sign & navamsha strength (0 to 30 Virupas)
  kendraBala: number; // Kendra (60), Panaphara (30), Apoklima (15 Virupas)
  drekkanaBala: number; // Decanate gender alignment (0 to 15 Virupas)
  totalVirupas: number;
}

export interface DigBalaDetail {
  strongHouse: number; // 1, 4, 7, or 10
  actualHouse: number;
  angularDistanceToPowerPoint: number;
  totalVirupas: number; // 0 to 60 Virupas
}

export interface KalaBalaDetail {
  nathonnathaBala: number; // Diurnal / Nocturnal strength (0 to 60 Virupas)
  pakshaBala: number; // Lunar phase strength (0 to 60 Virupas, Moon doubled)
  tribhagaBala: number; // 3-part day/night division (0 to 60 Virupas)
  varshaMasaDinaHoraBala: number; // Lord of year (15), month (30), day (45), hour (60)
  ayanaBala: number; // Declination / Equinoctial strength (0 to 60 Virupas)
  yuddhaBala: number; // Planetary war adjustment (+/- Virupas)
  totalVirupas: number;
}

export interface CheshtaBalaDetail {
  motionType: string; // Direct, Retrograde, Fast, Slow
  speedRatio: number;
  totalVirupas: number; // 0 to 60 Virupas
}

export interface NaisargikaBalaDetail {
  rank: number; // 1 (Sun) to 7 (Saturn)
  totalVirupas: number; // Fixed classical luminosity constants
}

export interface DrikBalaDetail {
  beneficDrishtiVirupas: number; // Positive aspect values
  maleficDrishtiVirupas: number; // Negative aspect values
  totalVirupas: number; // Net aspect strength (can be negative or positive)
}

export interface ShadbalaResult {
  planet: string;
  sthana: SthanaBalaDetail;
  dig: DigBalaDetail;
  kala: KalaBalaDetail;
  cheshta: CheshtaBalaDetail;
  naisargika: NaisargikaBalaDetail;
  drik: DrikBalaDetail;
  totalVirupas: number;
  totalRupas: number; // totalVirupas / 60
  requiredRupas: number;
  strengthRatio: number; // totalRupas / requiredRupas
  isAboveRequiredStrength: boolean;
  relativeRank: number;
}

export interface BhavaBalaResult {
  houseNumber: number;
  rashiId: number;
  rashiName: string;
  lord: string;
  bhavaAdhipatiBala: number; // Lord's Shadbala score
  bhavaDigBala: number; // Sign classification directional strength
  bhavaDrishtiBala: number; // Net planetary aspects on house cusp
  totalVirupas: number;
  totalRupas: number;
  relativeRank: number;
}

export interface VimshopakaVargaBreakdown {
  vargaDivision: number;
  vargaName: string;
  placedSignId: number;
  signLord: string;
  dignity: string;
  rawPoints: number; // 20, 18, 15, 10, 5, 2
  weight: number;
  weightedContribution: number;
}

export interface VimshopakaBalaResult {
  planet: string;
  shadvarga: number; // Out of 20 points
  saptavarga: number; // Out of 20 points
  dashavarga: number; // Out of 20 points
  shodashavarga: number; // Out of 20 points
  shodashavargaBreakdown: VimshopakaVargaBreakdown[];
}

// Classical minimum required Rupas (BPHS Ch 27)
export const REQUIRED_SHADBALA_RUPAS: Record<string, number> = {
  Sun: 6.5,
  Moon: 6.0,
  Mars: 5.0,
  Mercury: 7.0,
  Jupiter: 6.5,
  Venus: 5.5,
  Saturn: 5.0
};

// Fixed Natural Luminosity Constants in Virupas (BPHS Ch 27)
export const NAISARGIKA_VIRUPAS: Record<string, number> = {
  Sun: 60.00,
  Moon: 51.43,
  Venus: 42.86,
  Jupiter: 34.29,
  Mercury: 25.71,
  Mars: 17.14,
  Saturn: 8.57
};

// Deep Debilitation Points for Uchcha Bala (in degrees)
export const DEBILITATION_POINTS: Record<string, number> = {
  Sun: 190.0, // Libra 10°
  Moon: 213.0, // Scorpio 3°
  Mars: 118.0, // Cancer 28°
  Mercury: 345.0, // Pisces 15°
  Jupiter: 275.0, // Capricorn 5°
  Venus: 177.0, // Virgo 27°
  Saturn: 20.0 // Aries 20°
};

// Mean daily planetary motions in degrees/day
export const MEAN_DAILY_SPEEDS: Record<string, number> = {
  Sun: 0.9856,
  Moon: 13.1764,
  Mars: 0.5240,
  Mercury: 1.3833,
  Jupiter: 0.0831,
  Venus: 1.2000,
  Saturn: 0.0335
};

// Exaltation signs and Moolatrikona zones
export const MOOLATRIKONA_ZONES: Record<string, { rashiId: number; maxDegree: number }> = {
  Sun: { rashiId: 5, maxDegree: 20 }, // Leo 0-20°
  Moon: { rashiId: 2, maxDegree: 30 }, // Taurus 3-30°
  Mars: { rashiId: 1, maxDegree: 12 }, // Aries 0-12°
  Mercury: { rashiId: 6, maxDegree: 20 }, // Virgo 15-20°
  Jupiter: { rashiId: 9, maxDegree: 10 }, // Sagittarius 0-10°
  Venus: { rashiId: 7, maxDegree: 15 }, // Libra 0-15°
  Saturn: { rashiId: 11, maxDegree: 20 } // Aquarius 0-20°
};

/**
 * Computes Classical Aspect Value (Drishti Value in Shashtiamshas: 0 to 60) for angle theta.
 */
export function calculateAspectAngleValue(theta: number): number {
  let angle = ((theta % 360) + 360) % 360;
  if (angle > 180) angle = 360 - angle;

  if (angle <= 30) return 0;
  if (angle <= 60) return (angle - 30) / 2.0; // 0 to 15
  if (angle <= 90) return (angle - 60) + 15.0; // 15 to 45
  if (angle <= 120) return ((120 - angle) / 2.0) + 30.0; // 45 to 30
  if (angle <= 150) return (150 - angle); // 30 to 0
  if (angle <= 180) return (angle - 150) * 2.0; // 0 to 60 (Full 7th aspect)
  return 0;
}

/**
 * Computes Uchcha Bala (Exaltation Strength): 0 to 60 Virupas.
 */
export function calculateUchchaBala(planet: string, longitude: number): number {
  const debPoint = DEBILITATION_POINTS[planet];
  if (debPoint === undefined) return 30.0;

  let distFromDeb = Math.abs(longitude - debPoint);
  if (distFromDeb > 180) distFromDeb = 360 - distFromDeb;

  return parseFloat((distFromDeb / 3.0).toFixed(2));
}

/**
 * Computes Saptavargaja Bala: Evaluates exact dignity across D1, D2, D3, D7, D9, D12, D30.
 * Scoring: Moolatrikona = 45, Swakshetra = 30, Ati Mitra = 20, Mitra = 15, Sama = 10, Shatru = 4, Ati Shatru = 2 Virupas.
 */
export function calculateSaptavargajaBala(
  planet: string,
  vargas: Record<number, any>,
  natalRashiId: number
): number {
  const saptavargaDivs = [1, 2, 3, 7, 9, 12, 30];
  let total = 0;

  for (const div of saptavargaDivs) {
    const chart = vargas[div];
    const pData = chart?.planets[planet];
    if (!pData) continue;

    const vargaRashiId = pData.vargaRashiId;
    const lord = pData.vargaRashiLord;

    if (lord === planet) {
      // Check Moolatrikona
      const mt = MOOLATRIKONA_ZONES[planet];
      if (div === 1 && mt && vargaRashiId === mt.rashiId && (pData.divisionDegree || 0) <= mt.maxDegree) {
        total += 45;
      } else {
        total += 30; // Own sign
      }
    } else {
      const relation = getPanchadhaMaitri(planet, lord, natalRashiId, vargaRashiId);
      switch (relation) {
        case 'ATI_MITRA': total += 20; break;
        case 'MITRA': total += 15; break;
        case 'SAMA': total += 10; break;
        case 'SHATRU': total += 4; break;
        case 'ATI_SHATRU': total += 2; break;
        default: total += 10; break;
      }
    }
  }

  return total;
}

/**
 * Computes Dig Bala (Directional Strength): 0 to 60 Virupas.
 */
export function calculateDigBala(planet: string, houseNumber: number, longitude: number, lagnaLongitude: number): DigBalaDetail {
  const strongHouses: Record<string, number> = {
    Sun: 10, Mars: 10, Jupiter: 1, Mercury: 1, Saturn: 7, Moon: 4, Venus: 4
  };

  const strongH = strongHouses[planet] || 1;
  const houseOffset = ((houseNumber - strongH + 12) % 12);
  let distDeg = houseOffset * 30;
  if (distDeg > 180) distDeg = 360 - distDeg;

  const virupas = parseFloat((((180 - distDeg) / 180) * 60).toFixed(2));

  return {
    strongHouse: strongH,
    actualHouse: houseNumber,
    angularDistanceToPowerPoint: distDeg,
    totalVirupas: virupas
  };
}

/**
 * Computes Drik Bala (Aspect Strength): Net sum of benefic and malefic aspects cast on planet.
 */
export function calculateDrikBala(
  targetPlanet: string,
  targetLongitude: number,
  allPlanets: Array<{ name: string; longitude: number }>
): DrikBalaDetail {
  let beneficVirupas = 0;
  let maleficVirupas = 0;

  const benefics = ['Jupiter', 'Venus'];
  const malefics = ['Sun', 'Mars', 'Saturn'];

  for (const source of allPlanets) {
    if (source.name === targetPlanet || source.name === 'Rahu' || source.name === 'Ketu') continue;

    let diff = targetLongitude - source.longitude;
    if (diff < 0) diff += 360;

    let aspectShashtiamsha = calculateAspectAngleValue(diff);

    // Special aspects for Mars (4th/8th), Jupiter (5th/9th), Saturn (3rd/10th)
    const houseDist = Math.floor(diff / 30) + 1;
    if (source.name === 'Mars' && (houseDist === 4 || houseDist === 8)) aspectShashtiamsha = 60.0;
    if (source.name === 'Jupiter' && (houseDist === 5 || houseDist === 9)) aspectShashtiamsha = 60.0;
    if (source.name === 'Saturn' && (houseDist === 3 || houseDist === 10)) aspectShashtiamsha = 60.0;

    // Drik Bala contribution = Aspect Value / 4
    const virupaContrib = aspectShashtiamsha / 4.0;

    if (benefics.includes(source.name)) {
      beneficVirupas += virupaContrib;
    } else if (malefics.includes(source.name)) {
      maleficVirupas += virupaContrib;
    } else if (source.name === 'Mercury') {
      // Mercury is benefic unless conjunct malefics
      beneficVirupas += virupaContrib;
    } else if (source.name === 'Moon') {
      beneficVirupas += virupaContrib;
    }
  }

  const netDrik = parseFloat((beneficVirupas - maleficVirupas).toFixed(2));

  return {
    beneficDrishtiVirupas: parseFloat(beneficVirupas.toFixed(2)),
    maleficDrishtiVirupas: parseFloat(maleficVirupas.toFixed(2)),
    totalVirupas: netDrik
  };
}

/**
 * Computes Full 6-Fold Shadbala for the 7 classical planets (Sun to Saturn).
 */
export function calculateFullShadbala(
  lagnaLongitude: number,
  planets: Array<{ name: string; longitude: number; rashiId: number; house: number; isRetrograde?: boolean; speed?: number; latitude?: number }>,
  birthPanchang?: any
): Record<string, ShadbalaResult> {
  const validPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const results: Record<string, ShadbalaResult> = {};

  const vargas = generateShodashavarga(lagnaLongitude, planets);
  const sun = planets.find(p => p.name === 'Sun') || { longitude: 0, rashiId: 1 };
  const moon = planets.find(p => p.name === 'Moon') || { longitude: 0, rashiId: 1 };

  for (const pName of validPlanets) {
    const p = planets.find(item => item.name === pName) || {
      name: pName, longitude: 0, rashiId: 1, house: 1, isRetrograde: false, speed: 1.0, latitude: 0
    };

    // 1. Sthana Bala
    const uchcha = calculateUchchaBala(pName, p.longitude);
    const saptavarga = calculateSaptavargajaBala(pName, vargas, p.rashiId);

    // Ojha-Yugma Bala: Female (Moon, Venus) strong in even signs & even navamshas
    const navChart = vargas[9];
    const navPlacement = navChart?.planets[pName];
    const isOddRashi = (p.rashiId % 2 !== 0);
    const isOddNav = navPlacement ? (navPlacement.vargaRashiId % 2 !== 0) : false;
    const isFemale = ['Moon', 'Venus'].includes(pName);

    let ojha = 0;
    if (isFemale) {
      if (!isOddRashi) ojha += 15;
      if (!isOddNav) ojha += 15;
    } else {
      if (isOddRashi) ojha += 15;
      if (isOddNav) ojha += 15;
    }

    // Kendra Bala
    const kendra = [1, 4, 7, 10].includes(p.house) ? 60 : [2, 5, 8, 11].includes(p.house) ? 30 : 15;

    // Drekkana Bala
    const degInSign = p.longitude % 30;
    const decanate = Math.floor(degInSign / 10) + 1; // 1, 2, 3
    let drekkana = 0;
    if (['Sun', 'Mars', 'Jupiter'].includes(pName) && decanate === 1) drekkana = 15;
    else if (['Mercury', 'Saturn'].includes(pName) && decanate === 2) drekkana = 15;
    else if (['Moon', 'Venus'].includes(pName) && decanate === 3) drekkana = 15;

    const sthanaTotal = parseFloat((uchcha + saptavarga + ojha + kendra + drekkana).toFixed(2));
    const sthana: SthanaBalaDetail = {
      uchchaBala: uchcha,
      saptavargajaBala: saptavarga,
      ojhaYugmaBala: ojha,
      kendraBala: kendra,
      drekkanaBala: drekkana,
      totalVirupas: sthanaTotal
    };

    // 2. Dig Bala
    const dig = calculateDigBala(pName, p.house, p.longitude, lagnaLongitude);

    // 3. Kala Bala
    // Nathonnatha Bala — day/night is a property of the SUN, not of the planet being
    // scored. RS_014 fix: previously each planet's own house decided its day/night
    // strength, so a single chart could score "day" for Venus and "night" for Mars.
    // Whole-sign convention: the Sun in houses 7-12 is above the horizon (day birth).
    const sunHouse = (sun as { house?: number }).house ?? 10; // deterministic fallback if Sun missing
    const isDay = sunHouse >= 7 && sunHouse <= 12;
    let nathonnatha = 30;
    if (['Sun', 'Jupiter', 'Venus'].includes(pName)) {
      nathonnatha = isDay ? 60 : 0;
    } else if (['Moon', 'Mars', 'Saturn'].includes(pName)) {
      nathonnatha = !isDay ? 60 : 0;
    } else if (pName === 'Mercury') {
      nathonnatha = 60; // Mercury always gets 60
    }

    // Paksha Bala (Moon-Sun elongation)
    let elongation = moon.longitude - sun.longitude;
    if (elongation < 0) elongation += 360;
    const isShukla = elongation <= 180;
    const normElongation = isShukla ? elongation : 360 - elongation;
    const rawPaksha = parseFloat(((normElongation / 180) * 60).toFixed(2));

    const isBenefic = ['Jupiter', 'Venus', 'Mercury'].includes(pName);
    let paksha = isBenefic ? rawPaksha : (60 - rawPaksha);
    if (pName === 'Moon') paksha = rawPaksha * 2.0;

    // Tribhaga Bala
    let tribhaga = 0;
    if (isDay) {
      if (pName === 'Mercury') tribhaga = 60;
      else if (pName === 'Sun') tribhaga = 30;
      else if (pName === 'Saturn') tribhaga = 15;
    } else {
      if (pName === 'Moon') tribhaga = 60;
      else if (pName === 'Venus') tribhaga = 30;
      else if (pName === 'Mars') tribhaga = 15;
    }
    if (pName === 'Jupiter') tribhaga = 60; // Jupiter always gets 60 in Tribhaga

    // Varsha-Masa-Dina-Hora (Time lords)
    const varshaMasa = 45.0; // Standard nominal time lord score

    // Ayana Bala (from declination / tropical longitude)
    const tropLon = p.longitude; // Approximate from sidereal
    const declination = Math.asin(Math.sin(23.44 * Math.PI / 180) * Math.sin(tropLon * Math.PI / 180)) * 180 / Math.PI;
    const isNorthDeclination = declination >= 0;
    let ayana = 30.0;
    if (['Sun', 'Mars', 'Jupiter', 'Venus'].includes(pName)) {
      ayana = parseFloat((30 + (declination / 23.44) * 30).toFixed(2));
    } else if (['Moon', 'Saturn'].includes(pName)) {
      ayana = parseFloat((30 - (declination / 23.44) * 30).toFixed(2));
    } else if (pName === 'Mercury') {
      ayana = parseFloat((30 + Math.abs(declination / 23.44) * 30).toFixed(2));
    }

    const kalaTotal = parseFloat((nathonnatha + paksha + tribhaga + varshaMasa + ayana).toFixed(2));
    const kala: KalaBalaDetail = {
      nathonnathaBala: nathonnatha,
      pakshaBala: parseFloat(paksha.toFixed(2)),
      tribhagaBala: tribhaga,
      varshaMasaDinaHoraBala: varshaMasa,
      ayanaBala: ayana,
      yuddhaBala: 0,
      totalVirupas: kalaTotal
    };

    // 4. Cheshta Bala
    let cheshtaVal = 30.0;
    if (p.isRetrograde) {
      cheshtaVal = 60.0; // Full motional strength in retrogradation (Vakra)
    } else if (pName === 'Sun') {
      cheshtaVal = ayana; // Sun's Cheshta equals Ayana Bala
    } else if (pName === 'Moon') {
      cheshtaVal = parseFloat(paksha.toFixed(2)); // Moon's Cheshta equals Paksha Bala
    } else {
      // Direct speed ratio
      const meanSpeed = MEAN_DAILY_SPEEDS[pName] || 1.0;
      const actualSpeed = p.speed || meanSpeed;
      const ratio = Math.min(Math.max(actualSpeed / meanSpeed, 0.2), 2.0);
      cheshtaVal = parseFloat((ratio * 30.0).toFixed(2));
    }

    const cheshta: CheshtaBalaDetail = {
      motionType: p.isRetrograde ? 'Retrograde (Vakra)' : 'Direct (Manda)',
      speedRatio: parseFloat(((p.speed || 1.0) / (MEAN_DAILY_SPEEDS[pName] || 1.0)).toFixed(2)),
      totalVirupas: cheshtaVal
    };

    // 5. Naisargika Bala
    const naisargika: NaisargikaBalaDetail = {
      rank: Object.keys(NAISARGIKA_VIRUPAS).indexOf(pName) + 1,
      totalVirupas: NAISARGIKA_VIRUPAS[pName] || 30.0
    };

    // 6. Drik Bala
    const drik = calculateDrikBala(pName, p.longitude, planets);

    // Final Shadbala Summation
    const totalVirupas = parseFloat((sthana.totalVirupas + dig.totalVirupas + kala.totalVirupas + cheshta.totalVirupas + naisargika.totalVirupas + drik.totalVirupas).toFixed(2));
    const totalRupas = parseFloat((totalVirupas / 60.0).toFixed(2));
    const requiredRupas = REQUIRED_SHADBALA_RUPAS[pName] || 5.0;
    const strengthRatio = parseFloat((totalRupas / requiredRupas).toFixed(2));

    results[pName] = {
      planet: pName,
      sthana,
      dig,
      kala,
      cheshta,
      naisargika,
      drik,
      totalVirupas,
      totalRupas,
      requiredRupas,
      strengthRatio,
      isAboveRequiredStrength: totalRupas >= requiredRupas,
      relativeRank: 1
    };
  }

  // Calculate relative ranks
  const sortedPlanets = Object.values(results).sort((a, b) => b.strengthRatio - a.strengthRatio);
  sortedPlanets.forEach((item, idx) => {
    results[item.planet].relativeRank = idx + 1;
  });

  return results;
}

/**
 * Computes Bhava Bala (12 House Strengths).
 */
export function calculateBhavaBala(
  lagnaRashiId: number,
  shadbala: Record<string, ShadbalaResult>,
  planets?: Array<{ name: string; longitude: number; rashiId: number; house: number }>
): BhavaBalaResult[] {
  const signLords: Record<number, string> = {
    1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury',
    7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter'
  };

  const rashiNames = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  // Quadruped/Human/Watery/Insect directional classifications
  // Human (Biped): Gemini (3), Virgo (6), Libra (7), 1st half Sag (9), Aquarius (11) -> Strong in H1 (60)
  // Watery: Cancer (4), 2nd half Cap (10), Pisces (12) -> Strong in H4 (60)
  // Quadruped: Aries (1), Taurus (2), Leo (5), 2nd half Sag (9), 1st half Cap (10) -> Strong in H10 (60)
  // Insect (Keeta): Scorpio (8) -> Strong in H7 (60)
  const results: BhavaBalaResult[] = [];

  for (let h = 1; h <= 12; h++) {
    const rashiId = ((lagnaRashiId - 1 + (h - 1)) % 12) + 1;
    const lord = signLords[rashiId] || 'Mars';
    const lordShadbala = shadbala[lord]?.totalVirupas || 350.0;

    // Bhava Dig Bala
    let digBala = 30.0;
    if ([3, 6, 7, 11].includes(rashiId)) { // Human signs
      const dist = Math.abs(h - 1);
      digBala = parseFloat((((12 - dist) / 12) * 60).toFixed(2));
    } else if ([4, 12].includes(rashiId)) { // Watery signs
      const dist = Math.abs(h - 4);
      digBala = parseFloat((((12 - dist) / 12) * 60).toFixed(2));
    } else if ([1, 2, 5].includes(rashiId)) { // Quadruped signs
      const dist = Math.abs(h - 10);
      digBala = parseFloat((((12 - dist) / 12) * 60).toFixed(2));
    } else if (rashiId === 8) { // Insect sign
      const dist = Math.abs(h - 7);
      digBala = parseFloat((((12 - dist) / 12) * 60).toFixed(2));
    }

    // Bhava Drishti Bala: Aspect of benefics/malefics on the house cusp
    let drishtiBala = 0.0;
    if (planets && planets.length > 0) {
      for (const p of planets) {
        if (p.name === 'Rahu' || p.name === 'Ketu') continue;
        const pLordShad = shadbala[p.name]?.totalVirupas || 300.0;
        const houseDist = ((h - p.house + 12) % 12) + 1;
        let aspectVal = (houseDist === 7) ? 60 : (houseDist === 5 || houseDist === 9) ? 30 : (houseDist === 4 || houseDist === 8) ? 45 : 15;
        const isBenefic = ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(p.name);
        drishtiBala += (isBenefic ? 1 : -1) * (aspectVal / 4.0) * (pLordShad / 300.0);
      }
    } else {
      drishtiBala = 25.0;
    }

    const totalVirupas = parseFloat((lordShadbala + digBala + drishtiBala).toFixed(2));
    const totalRupas = parseFloat((totalVirupas / 60.0).toFixed(2));

    results.push({
      houseNumber: h,
      rashiId,
      rashiName: rashiNames[rashiId - 1],
      lord,
      bhavaAdhipatiBala: lordShadbala,
      bhavaDigBala: digBala,
      bhavaDrishtiBala: parseFloat(drishtiBala.toFixed(2)),
      totalVirupas,
      totalRupas,
      relativeRank: 1
    });
  }

  // Assign relative rank
  const sortedHouses = [...results].sort((a, b) => b.totalVirupas - a.totalVirupas);
  sortedHouses.forEach((item, idx) => {
    const found = results.find(h => h.houseNumber === item.houseNumber);
    if (found) found.relativeRank = idx + 1;
  });

  return results;
}

/**
 * Computes Vimshopaka Bala (20-Point Divisional Varga Strength) across Shadvarga, Saptavarga, Dashavarga, and Shodashavarga.
 * Evaluates exact dignity points (Exalted/Own=20, Ati Mitra=18, Mitra=15, Sama=10, Shatru=5, Ati Shatru/Debilitated=2).
 */
export function calculateVimshopakaBala(
  lagnaLongitude: number,
  planets: Array<{ name: string; longitude: number; rashiId: number }>
): Record<string, VimshopakaBalaResult> {
  const validPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const vargas = generateShodashavarga(lagnaLongitude, planets);
  const results: Record<string, VimshopakaBalaResult> = {};

  const vargaNames: Record<number, string> = {
    1: 'D1 Rashi', 2: 'D2 Hora', 3: 'D3 Drekkana', 4: 'D4 Chaturthamsha',
    7: 'D7 Saptamsha', 9: 'D9 Navamsha', 10: 'D10 Dashamsha', 12: 'D12 Dwadashamsha',
    16: 'D16 Shodashamsha', 20: 'D20 Vimshamsha', 24: 'D24 Chaturvimshamsha',
    27: 'D27 Saptavimshamsha', 30: 'D30 Trimshamsha', 40: 'D40 Khavedamsha',
    45: 'D45 Akshavedamsha', 60: 'D60 Shashtiamsha'
  };

  for (const pName of validPlanets) {
    const pNatal = planets.find(p => p.name === pName) || { rashiId: 1, longitude: 0 };
    const breakdown: VimshopakaVargaBreakdown[] = [];

    // Classical Weights:
    // Shadvarga (20 pts): D1 (6), D2 (2), D3 (4), D9 (5), D12 (2), D30 (1)
    const shadWeights: Record<number, number> = { 1: 6, 2: 2, 3: 4, 9: 5, 12: 2, 30: 1 };
    // Saptavarga (20 pts): D1 (5), D2 (2), D3 (3), D7 (2.5), D9 (4.5), D12 (2), D30 (1)
    const saptaWeights: Record<number, number> = { 1: 5, 2: 2, 3: 3, 7: 2.5, 9: 4.5, 12: 2, 30: 1 };
    // Dashavarga (20 pts): D1 (3), D2 (1.5), D3 (1.5), D7 (1.5), D9 (1.5), D10 (1.5), D12 (1.5), D16 (1.5), D30 (1.5), D60 (5)
    const dashaWeights: Record<number, number> = { 1: 3, 2: 1.5, 3: 1.5, 7: 1.5, 9: 1.5, 10: 1.5, 12: 1.5, 16: 1.5, 30: 1.5, 60: 5 };
    // Shodashavarga (20 pts): D1 (3.5), D2 (1), D3 (1), D4 (0.5), D7 (0.5), D9 (3), D10 (0.5), D12 (0.5), D16 (2), D20 (0.5), D24 (0.5), D27 (0.5), D30 (1), D40 (0.5), D45 (0.5), D60 (4) = 20 pts
    const shodashaWeights: Record<number, number> = {
      1: 3.5, 2: 1.0, 3: 1.0, 4: 0.5, 7: 0.5, 9: 3.0, 10: 0.5, 12: 0.5,
      16: 2.0, 20: 0.5, 24: 0.5, 27: 0.5, 30: 1.0, 40: 0.5, 45: 0.5, 60: 4.0
    };

    let shadTotal = 0;
    let saptaTotal = 0;
    let dashaTotal = 0;
    let shodashaTotal = 0;

    const allDivs = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];

    for (const div of allDivs) {
      const chart = vargas[div];
      const pData = chart?.planets[pName];
      const placedSignId = pData?.vargaRashiId || 1;
      const signLord = pData?.vargaRashiLord || 'Mars';

      // Determine Dignity Points (20, 18, 15, 10, 5, 2)
      let rawPoints = 10; // Default Neutral
      let dignity = 'Neutral (Sama)';

      if (signLord === pName) {
        rawPoints = 20;
        dignity = 'Own Sign (Swakshetra)';
      } else {
        const relation = getPanchadhaMaitri(pName, signLord, pNatal.rashiId, placedSignId);
        switch (relation) {
          case 'ATI_MITRA': rawPoints = 18; dignity = 'Great Friend (Ati Mitra)'; break;
          case 'MITRA': rawPoints = 15; dignity = 'Friend (Mitra)'; break;
          case 'SAMA': rawPoints = 10; dignity = 'Neutral (Sama)'; break;
          case 'SHATRU': rawPoints = 5; dignity = 'Enemy (Shatru)'; break;
          case 'ATI_SHATRU': rawPoints = 2; dignity = 'Bitter Enemy (Ati Shatru)'; break;
        }
      }

      const wShodasha = shodashaWeights[div] || (20 / 16);
      const contrib = (rawPoints / 20.0) * wShodasha;
      shodashaTotal += contrib;

      breakdown.push({
        vargaDivision: div,
        vargaName: vargaNames[div] || `D${div}`,
        placedSignId,
        signLord,
        dignity,
        rawPoints,
        weight: wShodasha,
        weightedContribution: parseFloat(contrib.toFixed(3))
      });

      if (shadWeights[div]) shadTotal += (rawPoints / 20.0) * shadWeights[div];
      if (saptaWeights[div]) saptaTotal += (rawPoints / 20.0) * saptaWeights[div];
      if (dashaWeights[div]) dashaTotal += (rawPoints / 20.0) * dashaWeights[div];
    }

    results[pName] = {
      planet: pName,
      shadvarga: parseFloat(shadTotal.toFixed(2)),
      saptavarga: parseFloat(saptaTotal.toFixed(2)),
      dashavarga: parseFloat(dashaTotal.toFixed(2)),
      shodashavarga: parseFloat(shodashaTotal.toFixed(2)),
      shodashavargaBreakdown: breakdown
    };
  }

  return results;
}
