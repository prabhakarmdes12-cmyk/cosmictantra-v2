/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Single Authoritative Calculation Pipeline
 * Invariant INV_ASTRO_TRUTH_001 / INV_JYOTISH_001: Identical normalized input produces identical deterministic output.
 * Invariant INV_JYOTISH_002: Exposes full algorithmic versioning, traditions, and evidence IDs.
 * Consumed by all UI surfaces: Kundli, Cosmic Now, Dasha, Interpretation, Kashi, and Reports.
 */

import { calculateKundali, RASHIS, NAKSHATRAS, PLANETS, getDignity, getNakshatra, normalizeAngle } from '../astrologyEngine.js';
import { calculatePanchang } from '../panchang.js';
import { calculateVimshottariDasha, getCurrentDasha } from '../dashaEngine.js';
import { getDaily3DayInterpretation } from '../interpretationEngine';
import { generateShodashavarga, VargaChart } from './vargaEngine';
import {
  getPanchadhaMaitri,
  checkCombustion,
  checkPlanetaryWar,
  getFunctionalRoles,
  calculateGrahaDrishti,
  calculateRashiDrishti,
  PlanetaryRelationship,
  FunctionalRole,
  CombustionState,
  PlanetaryWarState,
  GrahaDrishtiAspect,
  RashiDrishtiAspect
} from './relationshipEngine';
import {
  calculateFullShadbala,
  calculateBhavaBala,
  calculateVimshopakaBala,
  ShadbalaResult,
  BhavaBalaResult,
  VimshopakaBalaResult
} from './balaEngine';
import { calculateAshtakavarga, AshtakavargaResult } from './ashtakavargaEngine';
import { evaluateYogas, presentYogaNames, YogaEvaluation } from './yogaEngine';
import { calculateJaimini, JaiminiResult } from './jaiminiEngine';
import { calculateKpSystem, KpSystemResult } from './kpEngine';
import { calculateVarshaphala, VarshaphalaResult } from './varshaphalaEngine';
import { calculateAvakhada, AvakhadaResult } from './avakhadaEngine';
import { buildConventionSnapshotMetadata, DEFAULT_PRESET, type ResolvedConventionSelection } from './conventionCenter';
import { resolveAstronomyProvider } from '../astronomy/astronomyProvider';
import { computeGochara, type GocharaResult } from './gocharaEngine';
import { buildRuleRegistrySnapshotMetadata } from './ruleRegistry';
import { evaluateKalsarpa, type KalsarpaEvaluation } from './doshaEngine';

export interface NormalizedBirthContext {
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm (24hr)
  latitude: number;
  longitude: number;
  timezone: number;
  locationName: string;
  targetDate?: Date; // For real-time Gochar/Transit evaluation
}

export interface NavamshaPlacement {
  planet: string;
  natalRashi: string;
  navamshaRashi: string;
  navamshaRashiId: number;
  pada: number;
  isVargottama: boolean;
}

export interface CanonicalJyotishSnapshot {
  meta: {
    calculatedAt: string;
    engineVersion: string;
    ayanamshaName: string;
    ayanamshaValue: number;
    julianDay: number;
    /** Sprint B (CT_INV_004): explicit declared-convention manifest stamped on every snapshot. */
    conventionRegistry?: {
      registryVersion: string;
      registryDoc: string;
      presetId: string;
      manifestSha256: string;
      selections: ResolvedConventionSelection[];
      summaryLines: string[];
    };
    /** Sprint B: which astronomy provider/kernel produced the astronomical layer. */
    astronomyProvider?: {
      providerId: string;
      version: string;
      kernel: string;
      validationStatus: string;
    };
    /**
     * Sprint H: provenance stamp of the Classical Rule Registry — which rules
     * (with which declared sources and validation tiers) govern this snapshot.
     */
    ruleRegistry?: {
      registryVersion: string;
      registryDoc: string;
      fingerprint: string;
      ruleCount: number;
      statusSummary: Record<string, number>;
      sourceStatusSummary: Record<string, number>;
    };
  };
  context: NormalizedBirthContext;
  
  // 1. Natal Lagna & Core Bhavas
  lagna: {
    longitude: number;
    rashiId: number;
    rashiName: string;
    rashiEn: string;
    rashiLord: string;
    degrees: number;
    minutes: number;
    seconds: number;
    degreeStr: string;
    nakshatra: any;
    pada: number;
  };
  
  // 2. 9 Sidereal Grahas
  planets: any;
  planetsArray: any[];
  
  // 3. 12 Bhavas (Houses)
  houses: any[];
  
  // 4. Panchang at Birth (and prevailing Udaya Tithi)
  birthPanchang: {
    udayaTithi: {
      number: number;
      name: string;
      paksha: string;
      fullName: string;
    };
    instantaneousTithi: {
      number: number;
      name: string;
      paksha: string;
      progressPercent: number;
    };
    nakshatra: any;
    yoga: any;
    karana: any;
    sun: any;
    moon: any;
    timings: any;
    masa?: any;
    ritu?: any;
    ayana?: any;
    samvat?: any;
  };
  
  // 5. Vimshottari Dasha Hierarchy (3-Tier)
  dasha: {
    startingBalance: string;
    currentMahadasha: string;
    currentAntardasha: string;
    currentPratyantardasha?: string;
    currentPeriodString: string;
    currentPeriodStringHi: string;
    currentDateRange: string;
    mahadashas: any[];
  };
  
  // 6. Divisional Vargas (D1 to D60 Shodashavarga)
  vargas: {
    d1Rashi: any[];
    d9Navamsha: NavamshaPlacement[];
    shodashavarga?: Record<number, VargaChart>;
  };

  // 7. Planetary & House Relationships (Release 1)
  relationships?: {
    panchadhaMaitri: Record<string, Record<string, string>>;
    functionalRoles: Record<string, FunctionalRole>;
    combustions: Record<string, CombustionState>;
    planetaryWars: PlanetaryWarState[];
  };

  // 8. Classical Drishti (Graha Drishti & Rashi Drishti)
  drishti?: {
    grahaDrishti: GrahaDrishtiAspect[];
    rashiDrishti: RashiDrishtiAspect[];
  };

  // 9. Balas (Shadbala, Bhava Bala, Vimshopaka Bala)
  balas?: {
    shadbala: Record<string, ShadbalaResult>;
    bhavaBala: BhavaBalaResult[];
    vimshopaka: Record<string, VimshopakaBalaResult>;
  };
  
  // 10. Classical Yogas & Doshas
  yogasAndDoshas: {
    manglik: {
      isManglik: boolean;
      severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
      causeHouse: number | null;
      isCancelled: boolean;
      cancellationReason?: string;
      description: string;
    };
    sadeSati: {
      isActive: boolean;
      phase: string;
      description: string;
      /** Sprint G (RSK_016): the phenomenon basis — always TRANSIT, never natal. */
      basis: 'TRANSIT';
      natalMoonRashiId: number;
      transitSaturnRashiId: number;
      /** Whole-sign houses from the natal Moon rashi: 12 (first), 1 (peak), 2 (third), else not active. */
      saturnHousesFromMoon: number;
      /** The explicit reference instant the transit was evaluated at (CT_INV_007). */
      referenceInstantUtc: string;
    };
    kalsarpa: KalsarpaEvaluation;
    /** Rule evaluations — the authoritative yoga record. */
    yogas: YogaEvaluation[];
    /** Derived: names of yogas whose rules evaluated to PRESENT. */
    rajYogas: string[];
    /** Deprecated: always empty; kept so existing consumers do not break. */
    specialCombinations: string[];
  };
  
  // 11. Gochar / Transits — evaluated at the explicit targetDate (Sprint G).
  transits?: GocharaResult;

  // 12. Master Jyotish Systems
  ashtakavarga?: AshtakavargaResult;
  jaimini?: JaiminiResult;
  kp?: KpSystemResult;
  varshaphala?: VarshaphalaResult;
  avakhada?: AvakhadaResult;
}

/**
 * Computes the D9 Navamsha (9th harmonic division) placement for any ecliptic longitude.
 * Each rashi (30°) is divided into 9 navamshas of 3°20' (3.3333°).
 */
export function calculateNavamshaRashi(longitude: number): { rashiId: number; rashiName: string; pada: number } {
  const norm = normalizeAngle(longitude);
  const rashiIndex = Math.floor(norm / 30); // 0 to 11
  const degInRashi = norm % 30;
  const navamshaIndexInRashi = Math.floor(degInRashi / (30 / 9)); // 0 to 8
  const pada = navamshaIndexInRashi + 1;

  const elementOffsets = [0, 9, 6, 3]; // Aries, Cap, Libra, Cancer
  const baseOffset = elementOffsets[rashiIndex % 4];
  const navamshaRashiIndex = (baseOffset + navamshaIndexInRashi) % 12;
  const navamshaRashi = RASHIS[navamshaRashiIndex];

  return {
    rashiId: navamshaRashiIndex + 1,
    rashiName: navamshaRashi.name,
    pada
  };
}

/**
 * Authoritative Master Pipeline Function
 */
export function getCanonicalJyotishSnapshot(context: NormalizedBirthContext): CanonicalJyotishSnapshot {
  const { birthDate, birthTime, latitude, longitude, timezone, locationName, targetDate = new Date() } = context;

  // 1. Calculate Base Natal Chart
  const kundli = calculateKundali(birthDate, birthTime, latitude, longitude, timezone, locationName);
  
  // 2. Parse birth datetime for Sunrise & Birth Panchang
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = (birthTime || '12:00').split(':').map(Number);
  const utcHours = hour + minute / 60 - timezone;
  const birthDateTime = new Date(Date.UTC(year, month - 1, day, Math.floor(utcHours), Math.floor(((utcHours % 1 + 1) % 1) * 60)));

  // 3. Calculate Accurate Panchang at Birth (with true Sunrise)
  const panchang = calculatePanchang(birthDateTime, {
    lat: latitude,
    lng: longitude,
    tz: timezone,
    name: locationName
  });

  // 4. Calculate 3-Tier Vimshottari Dasha
  const moonLongitude = kundli.moon.longitude;
  const dashaResult = calculateVimshottariDasha(moonLongitude, birthDate, targetDate);

  let currentPratyantardasha = '';
  const currentMD = dashaResult.mahadashas.find((m: any) => m.isCurrent) || dashaResult.mahadashas[0];
  const currentAD = currentMD.antardashas.find((a: any) => a.isCurrent) || currentMD.antardashas[0];
  if (currentAD.pratyantardashas && currentAD.pratyantardashas.length > 0) {
    const currentPD = currentAD.pratyantardashas.find((p: any) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return targetDate >= start && targetDate <= end;
    }) || currentAD.pratyantardashas[0];
    currentPratyantardasha = currentPD.lord;
  }

  // 5. Calculate Full Shodashavarga Charts (D1 to D60)
  const planetsForVarga = (kundli.planets as any[]).map(p => ({
    name: p.name,
    longitude: p.longitude,
    rashiId: p.rashiId
  }));
  const shodashavarga = generateShodashavarga(kundli.lagna.longitude, planetsForVarga);

  // Extract D9 Navamsha Placements for legacy consumer compatibility
  const d9Placements: NavamshaPlacement[] = (kundli.planets as any[]).map((p: any) => {
    const nav = calculateNavamshaRashi(p.longitude);
    const isVargottama = (p.rashiId - 1) === (nav.rashiId - 1);
    return {
      planet: p.name,
      natalRashi: p.rashiName,
      navamshaRashi: nav.rashiName,
      navamshaRashiId: nav.rashiId,
      pada: nav.pada,
      isVargottama
    };
  });

  // 6. Relationships, Combustions, and Functional Roles
  const sunPlanet = (kundli.planets as any[]).find((p: any) => p.name === 'Sun') || { longitude: 0 };
  const combustions: Record<string, CombustionState> = {};
  const panchadhaMatrix: Record<string, Record<string, string>> = {};
  const allPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  for (const p1 of kundli.planets as any[]) {
    panchadhaMatrix[p1.name] = {};
    for (const p2 of kundli.planets as any[]) {
      panchadhaMatrix[p1.name][p2.name] = getPanchadhaMaitri(p1.name, p2.name, p1.rashiId, p2.rashiId);
    }
    combustions[p1.name] = checkCombustion(p1.name, p1.longitude, sunPlanet.longitude, p1.isRetrograde);
  }

  const functionalRoles = getFunctionalRoles(kundli.lagna.rashiId);
  const planetaryWars = checkPlanetaryWar(kundli.planets as any[]);

  // 7. Drishti (Planetary & Sign Aspects)
  const grahaDrishti = calculateGrahaDrishti(kundli.planets as any[]);
  const rashiDrishti = calculateRashiDrishti(kundli.planets as any[]);

  // 8. Full Balas (Shadbala, Bhava Bala, Vimshopaka Bala)
  const shadbala = calculateFullShadbala(kundli.lagna.longitude, kundli.planets as any[], panchang);
  const bhavaBala = calculateBhavaBala(kundli.lagna.rashiId, shadbala, kundli.planets as any[]);
  const vimshopaka = calculateVimshopakaBala(kundli.lagna.longitude, planetsForVarga);

  // 9. Classical Manglik Dosha Analysis with Cancellation Rules
  const marsPlanet = (kundli.planets as any[]).find((p: any) => p.name === 'Mars');
  const marsHouse = marsPlanet ? marsPlanet.house : 1;
  const isManglikHouse = [1, 4, 7, 8, 12].includes(marsHouse);
  
  let isManglik = isManglikHouse;
  let isCancelled = false;
  let cancellationReason = '';

  if (isManglikHouse) {
    if (marsPlanet.dignity.includes('Own') || marsPlanet.dignity.includes('Exalted')) {
      isCancelled = true;
      cancellationReason = `Mars is in strong dignity (${marsPlanet.dignity}), nullifying major Dosha effects.`;
    }
  }

  const manglikSeverity = !isManglikHouse ? 'NONE' : isCancelled ? 'LOW' : [7, 8].includes(marsHouse) ? 'HIGH' : 'MEDIUM';

  // 10. Sade Sati Phase Tracking — TRANSIT-BASED (Sprint G, RSK_016 fix).
  // Mission §9 is explicit: current Sade Sati is NEVER inferred from natal
  // Saturn/Moon positions. The state below is a function of TRANSIT Saturn at
  // the explicit reference instant against the natal Moon rashi; the natal
  // Saturn is not an input anywhere (enforced by tests/gochara-qualification).
  const moonRashiId = kundli.moon.rashiId;
  const gocharaLight = computeGochara({
    natalMoonRashiId: moonRashiId,
    natalLagnaRashiId: kundli.lagna.rashiId,
    referenceInstantUtc: targetDate.toISOString()
  });
  const saturnFromMoon = gocharaLight.sadeSati.saturnHousesFromMoon;
  const isSadeSati = gocharaLight.sadeSati.isActive;
  const sadeSatiPhase = gocharaLight.sadeSati.phase;

  // 11. Rule-evaluated yogas (replaces the previous unconditional declarations)
  //     Every yoga is evaluated against the computed chart and carries its
  //     conditions, evidence and status (PRESENT / ABSENT / INDETERMINATE /
  //     NOT_CALCULATED). Nothing is declared that the rules did not produce.
  const yogaChart = {
    planets: (kundli.planets as any[]).map((p: any) => ({
      id: p.name,
      house: Number(p.house) || 0,
      signId: Number(p.rashiId ?? p.rasiId) || 0,
      signName: p.rashiName ?? p.rasiName ?? String(p.rashiId ?? p.rasiId ?? ''),
      longitudeDeg: Number(p.longitude) || 0,
    })),
    houseSigns: (kundli.houses as any[]).map((h: any) => {
      const signId = Number(h.rashiId ?? h.rasiId);
      return Number.isFinite(signId) && signId > 0 ? signId : null;
    }),
    ascendantSignId: Number(kundli.lagna?.rashiId) || 0,
  };
  const yogaEvaluations = evaluateYogas(yogaChart);

  return {
    meta: {
      calculatedAt: new Date().toISOString(),
      engineVersion: 'CosmicTantra Professional Kernel V37.0 (Deterministic, ayanamsha-registry-aligned-2.0.0)',
      ayanamshaName: 'Chitra Paksha (Lahiri Standard)',
      ayanamshaValue: kundli.ayanamsha,
      julianDay: kundli.julianDay,
      // Sprint B (CT_INV_004): every canonical snapshot now declares its full
      // convention set and the astronomy provider/kernel that produced it.
      ...buildConventionSnapshotMetadata(DEFAULT_PRESET.id),
      ...buildRuleRegistrySnapshotMetadata(),
      astronomyProvider: (() => {
        const d = resolveAstronomyProvider().descriptor;
        return { providerId: d.providerId, version: d.version, kernel: d.kernel, validationStatus: d.validationStatus };
      })()
    },
    context,
    lagna: {
      ...kundli.lagna,
      rashiLord: kundli.lagna.lord || 'Jupiter',
      seconds: Math.floor(((kundli.lagna.degrees % 1) * 60 % 1) * 60)
    },
    planets: kundli.planets,
    planetsArray: kundli.planets as any[],
    houses: kundli.houses,
    birthPanchang: {
      udayaTithi: {
        number: panchang.tithi.number,
        name: panchang.tithi.name,
        paksha: panchang.tithi.paksha,
        fullName: panchang.tithi.fullName
      },
      instantaneousTithi: {
        number: panchang.tithi.number,
        name: panchang.tithi.name,
        paksha: panchang.tithi.paksha,
        progressPercent: panchang.tithi.progressPercent
      },
      nakshatra: panchang.nakshatra,
      yoga: panchang.yoga,
      karana: panchang.karana,
      sun: panchang.sun,
      moon: panchang.moon,
      timings: panchang.timings,
      masa: panchang.masa,
      ritu: panchang.ritu,
      ayana: panchang.ayana,
      samvat: panchang.samvat
    },
    dasha: {
      startingBalance: dashaResult.startingBalance,
      currentMahadasha: dashaResult.currentMahadasha,
      currentAntardasha: dashaResult.currentAntardasha,
      currentPratyantardasha,
      currentPeriodString: dashaResult.currentPeriodString,
      currentPeriodStringHi: dashaResult.currentPeriodStringHi,
      currentDateRange: dashaResult.currentDateRange,
      mahadashas: dashaResult.mahadashas
    },
    vargas: {
      d1Rashi: kundli.planets as any[],
      d9Navamsha: d9Placements,
      shodashavarga
    },
    relationships: {
      panchadhaMaitri: panchadhaMatrix,
      functionalRoles,
      combustions,
      planetaryWars
    },
    drishti: {
      grahaDrishti,
      rashiDrishti
    },
    balas: {
      shadbala,
      bhavaBala,
      vimshopaka
    },
    yogasAndDoshas: {
      manglik: {
        isManglik: isManglikHouse && !isCancelled,
        severity: manglikSeverity,
        causeHouse: isManglikHouse ? marsHouse : null,
        isCancelled,
        cancellationReason: cancellationReason || undefined,
        description: isManglikHouse ? `Mars resides in House ${marsHouse}.` : 'Mars is well placed.'
      },
      sadeSati: {
        isActive: isSadeSati,
        phase: sadeSatiPhase,
        description: isSadeSati
          ? `Transit Saturn is in ${gocharaLight.sadeSati.transitSaturnRashiName} — the ${saturnFromMoon === 12 ? '12th' : saturnFromMoon === 1 ? '1st' : '2nd'} rashi from the natal Moon (${sadeSatiPhase}), evaluated at the reference instant.`
          : `Transit Saturn is in ${gocharaLight.sadeSati.transitSaturnRashiName} (${saturnFromMoon}th from the natal Moon) — outside the Sade Sati band at the reference instant.`,
        basis: 'TRANSIT' as const,
        natalMoonRashiId: moonRashiId,
        transitSaturnRashiId: gocharaLight.sadeSati.transitSaturnRashiId,
        saturnHousesFromMoon: saturnFromMoon,
        referenceInstantUtc: targetDate.toISOString()
      },
      kalsarpa: (() => {
        // Sprint I (charter §16): a Kalsarpa variant is now formally adopted
        // (RULE_KALSARPA_HEMISPHERE) and evaluated here; the variant and the
        // declared alternatives travel on the result itself.
        const grahaRashis: Record<string, number> = {};
        for (const p of kundli.planets as any[]) {
          grahaRashis[p.name] = Number(p.rashiId ?? p.rasiId) || 0;
        }
        return evaluateKalsarpa({
          grahaRashis,
          rahuRashiId: grahaRashis['Rahu'] ?? 0,
          ketuRashiId: grahaRashis['Ketu'] ?? 0
        });
      })(),
      yogas: yogaEvaluations,
      // Derived convenience view for existing UI surfaces. Contains ONLY the
      // yogas the rules above declared PRESENT.
      rajYogas: presentYogaNames(yogaEvaluations),
      specialCombinations: [],
    },
    ashtakavarga: calculateAshtakavarga(kundli.planets as any, kundli.lagna.rashiId || 1),
    jaimini: calculateJaimini(kundli.planets as any[], {
      rashiId: kundli.lagna.rashiId || 1,
      degrees: kundli.lagna.degrees,
      longitude: kundli.lagna.longitude
    }, d9Placements),
    transits: gocharaLight,
    kp: calculateKpSystem(kundli.planets as any[], kundli.lagna.longitude, kundli.ayanamsha),
    varshaphala: calculateVarshaphala(
      context.birthDate,
      ((kundli.planets as any[]).find(p => p.name === 'Sun')?.degrees) || 40,
      kundli.lagna.rashiId || 1,
      2026
    ),
    avakhada: calculateAvakhada(
      ((kundli.planets as any[]).find(p => p.name === 'Moon')?.rashiName) || 'Makara',
      panchang.nakshatra?.name || 'Shravana'
    )
  };
}

export default {
  getCanonicalJyotishSnapshot,
  calculateNavamshaRashi
};
