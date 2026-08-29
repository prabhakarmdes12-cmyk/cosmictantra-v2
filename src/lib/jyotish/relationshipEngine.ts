/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Planet Relationships, Dignities & Drishti Engine
 * Implements classical Parashari friendship (Naisargika, Tatkalika, Panchadha),
 * functional benefics/malefics, combustions, planetary wars, Graha Drishti and Rashi Drishti.
 * Complies with Invariants INV_JYOTISH_001, INV_JYOTISH_002, INV_JYOTISH_003.
 */

export type FriendshipType = 'ATI_MITRA' | 'MITRA' | 'SAMA' | 'SHATRU' | 'ATI_SHATRU';
export type NaturalFriendshipType = 'FRIEND' | 'NEUTRAL' | 'ENEMY';

export interface PlanetaryRelationship {
  planet: string;
  targetPlanet: string;
  naisargika: NaturalFriendshipType;
  tatkalika: 'FRIEND' | 'ENEMY';
  panchadha: FriendshipType;
  description: string;
}

export interface FunctionalRole {
  planet: string;
  isFunctionalBenefic: boolean;
  isFunctionalMalefic: boolean;
  isYogakaraka: boolean;
  isMaraka: boolean;
  ruledHouses: number[];
  reasons: string[];
}

export interface CombustionState {
  planet: string;
  isCombust: boolean;
  angularDistanceToSun: number;
  combustionOrb: number;
  severity: 'DEEP_COMBUST' | 'COMBUST' | 'NEAR_COMBUST' | 'SAFE';
}

export interface PlanetaryWarState {
  isWar: boolean;
  planet1?: string;
  planet2?: string;
  winner?: string;
  loser?: string;
  angularSeparation?: number; // In arcminutes or degrees
}

export interface GrahaDrishtiAspect {
  aspectingPlanet: string;
  aspectedPlanetOrHouse: string; // Planet name or "House X"
  houseDistance: number; // 1 to 12
  aspectStrengthShashtiamsha: number; // 0 to 60 (60 = 100% full aspect)
  aspectStrengthPercentage: number; // 0% to 100%
  aspectType: 'UNIVERSAL_7TH' | 'MARS_SPECIAL_4_8' | 'JUPITER_SPECIAL_5_9' | 'SATURN_SPECIAL_3_10' | 'PARTIAL';
}

export interface RashiDrishtiAspect {
  aspectingRashiId: number;
  aspectingRashiName: string;
  aspectedRashiId: number;
  aspectedRashiName: string;
  planetsInAspectingSign: string[];
  planetsInAspectedSign: string[];
}

/**
 * Natural Friendship Matrix (Naisargika Maitri) from Brihat Parashara Hora Shastra (BPHS Ch 15).
 */
export const NAISARGIKA_MAITRI: Record<string, { friends: string[]; neutrals: string[]; enemies: string[] }> = {
  Sun: {
    friends: ['Moon', 'Mars', 'Jupiter'],
    neutrals: ['Mercury'],
    enemies: ['Venus', 'Saturn', 'Rahu', 'Ketu']
  },
  Moon: {
    friends: ['Sun', 'Mercury'],
    neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'],
    enemies: ['Rahu', 'Ketu']
  },
  Mars: {
    friends: ['Sun', 'Moon', 'Jupiter'],
    neutrals: ['Venus', 'Saturn'],
    enemies: ['Mercury', 'Rahu', 'Ketu']
  },
  Mercury: {
    friends: ['Sun', 'Venus'],
    neutrals: ['Mars', 'Jupiter', 'Saturn'],
    enemies: ['Moon', 'Rahu', 'Ketu']
  },
  Jupiter: {
    friends: ['Sun', 'Moon', 'Mars'],
    neutrals: ['Saturn'],
    enemies: ['Mercury', 'Venus', 'Rahu', 'Ketu']
  },
  Venus: {
    friends: ['Mercury', 'Saturn'],
    neutrals: ['Mars', 'Jupiter'],
    enemies: ['Sun', 'Moon', 'Rahu', 'Ketu']
  },
  Saturn: {
    friends: ['Mercury', 'Venus'],
    neutrals: ['Jupiter'],
    enemies: ['Sun', 'Moon', 'Mars', 'Rahu', 'Ketu']
  },
  Rahu: {
    friends: ['Venus', 'Saturn', 'Mercury'],
    neutrals: ['Jupiter'],
    enemies: ['Sun', 'Moon', 'Mars']
  },
  Ketu: {
    friends: ['Mars', 'Venus', 'Saturn'],
    neutrals: ['Mercury', 'Jupiter'],
    enemies: ['Sun', 'Moon']
  }
};

/**
 * Classical Combustion (Asta) Orbs in Degrees from Sun (Surya).
 */
export const COMBUSTION_ORBS: Record<string, { direct: number; retrograde: number }> = {
  Moon: { direct: 12, retrograde: 12 },
  Mars: { direct: 17, retrograde: 17 },
  Mercury: { direct: 14, retrograde: 12 },
  Jupiter: { direct: 11, retrograde: 11 },
  Venus: { direct: 10, retrograde: 8 },
  Saturn: { direct: 15, retrograde: 15 }
};

/**
 * Computes Temporal Friendship (Tatkalika Maitri) based on house placement from each other.
 * Planets located in 2nd, 3rd, 4th, 10th, 11th, 12th from a planet are temporary friends (Mitra);
 * Planets located in 1st, 5th, 6th, 7th, 8th, 9th from a planet are temporary enemies (Shatru).
 */
export function getTatkalikaMaitri(planet1RashiId: number, planet2RashiId: number): 'FRIEND' | 'ENEMY' {
  const dist = ((planet2RashiId - planet1RashiId + 12) % 12) + 1; // 1 to 12
  const friendlyHouses = [2, 3, 4, 10, 11, 12];
  return friendlyHouses.includes(dist) ? 'FRIEND' : 'ENEMY';
}

/**
 * Computes Five-Fold Compound Friendship (Panchadha Maitri).
 */
export function getPanchadhaMaitri(planet: string, targetPlanet: string, planetRashiId: number, targetRashiId: number): FriendshipType {
  if (planet === targetPlanet) return 'SAMA';

  const naisargikaData = NAISARGIKA_MAITRI[planet];
  let naisargika: NaturalFriendshipType = 'NEUTRAL';
  if (naisargikaData) {
    if (naisargikaData.friends.includes(targetPlanet)) naisargika = 'FRIEND';
    else if (naisargikaData.enemies.includes(targetPlanet)) naisargika = 'ENEMY';
  }

  const tatkalika = getTatkalikaMaitri(planetRashiId, targetRashiId);

  // Panchadha Combination Rule:
  // Friend + Friend = Great Friend (Ati Mitra)
  // Friend + Enemy / Enemy + Friend / Neutral + Neutral = Neutral (Sama)
  // Neutral + Friend = Friend (Mitra)
  // Neutral + Enemy = Enemy (Shatru)
  // Enemy + Enemy = Bitter Enemy (Ati Shatru)
  if (naisargika === 'FRIEND' && tatkalika === 'FRIEND') return 'ATI_MITRA';
  if (naisargika === 'NEUTRAL' && tatkalika === 'FRIEND') return 'MITRA';
  if (naisargika === 'FRIEND' && tatkalika === 'ENEMY') return 'SAMA';
  if (naisargika === 'NEUTRAL' && tatkalika === 'ENEMY') return 'SHATRU';
  if (naisargika === 'ENEMY' && tatkalika === 'FRIEND') return 'SAMA';
  if (naisargika === 'ENEMY' && tatkalika === 'ENEMY') return 'ATI_SHATRU';

  return 'SAMA';
}

/**
 * Evaluates combustion state for a planet against the Sun.
 */
export function checkCombustion(planet: string, planetLongitude: number, sunLongitude: number, isRetrograde = false): CombustionState {
  const orbConfig = COMBUSTION_ORBS[planet];
  if (!orbConfig || planet === 'Sun' || planet === 'Rahu' || planet === 'Ketu') {
    return { planet, isCombust: false, angularDistanceToSun: 999, combustionOrb: 0, severity: 'SAFE' };
  }

  let diff = Math.abs(planetLongitude - sunLongitude);
  if (diff > 180) diff = 360 - diff;

  const allowedOrb = isRetrograde ? orbConfig.retrograde : orbConfig.direct;
  const isCombust = diff <= allowedOrb;
  const severity: 'DEEP_COMBUST' | 'COMBUST' | 'NEAR_COMBUST' | 'SAFE' =
    diff <= (allowedOrb / 3) ? 'DEEP_COMBUST' :
    diff <= allowedOrb ? 'COMBUST' :
    diff <= (allowedOrb + 2) ? 'NEAR_COMBUST' : 'SAFE';

  return {
    planet,
    isCombust,
    angularDistanceToSun: diff,
    combustionOrb: allowedOrb,
    severity
  };
}

/**
 * Checks for Planetary War (Graha Yuddha) between true taragrahas (Mars, Mercury, Jupiter, Venus, Saturn).
 * Occurs when two planets are within 1°00'00" (60 arcminutes) of each other.
 */
export function checkPlanetaryWar(planets: Array<{ name: string; longitude: number; speed?: number; latitude?: number }>): PlanetaryWarState[] {
  const taraGrahas = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const activePlanets = planets.filter(p => taraGrahas.includes(p.name));
  const wars: PlanetaryWarState[] = [];

  for (let i = 0; i < activePlanets.length; i++) {
    for (let j = i + 1; j < activePlanets.length; j++) {
      const p1 = activePlanets[i];
      const p2 = activePlanets[j];

      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      if (diff <= 1.0) { // Within 1° (60 arcmin)
        // Classical victor: Planet with higher northern declination/latitude or larger apparent disc/magnitude
        // In Parashara standard: Higher latitude or Venus always wins war
        let winner = p1.name;
        let loser = p2.name;

        if (p1.name === 'Venus') { winner = p1.name; loser = p2.name; }
        else if (p2.name === 'Venus') { winner = p2.name; loser = p1.name; }
        else if ((p2.latitude || 0) > (p1.latitude || 0)) { winner = p2.name; loser = p1.name; }

        wars.push({
          isWar: true,
          planet1: p1.name,
          planet2: p2.name,
          winner,
          loser,
          angularSeparation: diff
        });
      }
    }
  }

  return wars;
}

/**
 * Evaluates Parashari Functional Benefic / Malefic / Yogakaraka roles for all 9 planets relative to Ascendant Lagna Rashi.
 */
export function getFunctionalRoles(lagnaRashiId: number): Record<string, FunctionalRole> {
  // Sign Lords mapping: 1=Mars, 2=Venus, 3=Mercury, 4=Moon, 5=Sun, 6=Mercury, 7=Venus, 8=Mars, 9=Jupiter, 10=Saturn, 11=Saturn, 12=Jupiter
  const signLords: Record<number, string> = {
    1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury',
    7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter'
  };

  const planetHouseOwnership: Record<string, number[]> = {
    Sun: [], Moon: [], Mars: [], Mercury: [], Jupiter: [], Venus: [], Saturn: [], Rahu: [], Ketu: []
  };

  for (let house = 1; house <= 12; house++) {
    const rashiOfHouse = ((lagnaRashiId - 1 + (house - 1)) % 12) + 1;
    const lord = signLords[rashiOfHouse];
    if (lord && planetHouseOwnership[lord]) {
      planetHouseOwnership[lord].push(house);
    }
  }

  const roles: Record<string, FunctionalRole> = {};
  const allPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  for (const p of allPlanets) {
    const houses = planetHouseOwnership[p] || [];
    let isYogakaraka = false;
    let isFunctionalBenefic = false;
    let isFunctionalMalefic = false;
    let isMaraka = false;
    const reasons: string[] = [];

    // Trikona Lords (1, 5, 9) are always functional benefics
    const ownsTrikona = houses.some(h => [1, 5, 9].includes(h));
    // Kendra Lords (4, 7, 10)
    const ownsKendra = houses.some(h => [4, 7, 10].includes(h));
    // Dusthana Lords (6, 8, 12)
    const ownsDusthana = houses.some(h => [6, 8, 12].includes(h));
    // Maraka Houses (2, 7)
    const ownsMaraka = houses.some(h => [2, 7].includes(h));

    // Yogakaraka: Owns both a Kendra (4, 7, 10) AND a Trikona (5, 9)
    if (ownsKendra && ownsTrikona) {
      isYogakaraka = true;
      isFunctionalBenefic = true;
      reasons.push(`Yogakaraka: Rules Kendra (House ${houses.filter(h => [4, 7, 10].includes(h)).join(',')}) and Trikona (House ${houses.filter(h => [5, 9].includes(h)).join(',')})`);
    } else if (ownsTrikona && !ownsDusthana) {
      isFunctionalBenefic = true;
      reasons.push(`Trikona Lord: Rules auspicious House ${houses.join(',')}`);
    } else if (ownsDusthana && !ownsTrikona) {
      isFunctionalMalefic = true;
      reasons.push(`Dusthana Lord: Rules inauspicious House ${houses.filter(h => [6, 8, 12].includes(h)).join(',')}`);
    } else {
      isFunctionalBenefic = !ownsDusthana;
      if (ownsDusthana) isFunctionalMalefic = true;
      reasons.push(`Rules Houses ${houses.join(', ')}`);
    }

    if (ownsMaraka && p !== 'Sun' && p !== 'Moon') {
      isMaraka = true;
      reasons.push(`Maraka Lord: Rules House ${houses.filter(h => [2, 7].includes(h)).join(',')}`);
    }

    roles[p] = {
      planet: p,
      isFunctionalBenefic,
      isFunctionalMalefic,
      isYogakaraka,
      isMaraka,
      ruledHouses: houses,
      reasons
    };
  }

  return roles;
}

/**
 * Computes Classical Parashari Graha Drishti (Planetary Aspects) cast by all 9 Grahas.
 * Exposes full 60-Shashtiamsha strength and percentage values.
 */
export function calculateGrahaDrishti(planets: Array<{ name: string; rashiId: number }>): GrahaDrishtiAspect[] {
  const aspects: GrahaDrishtiAspect[] = [];

  for (const source of planets) {
    for (const target of planets) {
      if (source.name === target.name) continue;

      const houseDist = ((target.rashiId - source.rashiId + 12) % 12) + 1; // 1 to 12
      let strength = 0; // in Shashtiamshas (0 to 60)
      let aspectType: any = 'PARTIAL';

      // 1. Universal 7th Aspect (100% / 60 Shashtiamshas for all planets)
      if (houseDist === 7) {
        strength = 60;
        aspectType = 'UNIVERSAL_7TH';
      }
      // 2. Mars Special Aspects (4th and 8th houses = 100% / 60 Shashtiamshas)
      else if (source.name === 'Mars' && (houseDist === 4 || houseDist === 8)) {
        strength = 60;
        aspectType = 'MARS_SPECIAL_4_8';
      }
      // 3. Jupiter Special Aspects (5th and 9th houses = 100% / 60 Shashtiamshas)
      else if ((source.name === 'Jupiter' || source.name === 'Rahu' || source.name === 'Ketu') && (houseDist === 5 || houseDist === 9)) {
        strength = 60;
        aspectType = 'JUPITER_SPECIAL_5_9';
      }
      // 4. Saturn Special Aspects (3rd and 10th houses = 100% / 60 Shashtiamshas)
      else if (source.name === 'Saturn' && (houseDist === 3 || houseDist === 10)) {
        strength = 60;
        aspectType = 'SATURN_SPECIAL_3_10';
      }
      // 5. Partial Classical Aspects:
      // 3rd & 10th houses: 25% (15 Shashtiamshas)
      // 5th & 9th houses: 50% (30 Shashtiamshas)
      // 4th & 8th houses: 75% (45 Shashtiamshas)
      else if (houseDist === 3 || houseDist === 10) {
        strength = 15;
      } else if (houseDist === 5 || houseDist === 9) {
        strength = 30;
      } else if (houseDist === 4 || houseDist === 8) {
        strength = 45;
      }

      if (strength > 0) {
        aspects.push({
          aspectingPlanet: source.name,
          aspectedPlanetOrHouse: target.name,
          houseDistance: houseDist,
          aspectStrengthShashtiamsha: strength,
          aspectStrengthPercentage: parseFloat(((strength / 60) * 100).toFixed(1)),
          aspectType
        });
      }
    }
  }

  return aspects;
}

/**
 * Computes Classical Jaimini / Parashari Rashi Drishti (Sign Aspects).
 * Rules:
 * - Movable signs (1, 4, 7, 10) aspect all Fixed signs (2, 5, 8, 11) except the adjacent one.
 * - Fixed signs (2, 5, 8, 11) aspect all Movable signs (1, 4, 7, 10) except the adjacent one.
 * - Dual signs (3, 6, 9, 12) aspect all other Dual signs.
 */
export function calculateRashiDrishti(planets: Array<{ name: string; rashiId: number }>): RashiDrishtiAspect[] {
  const rashiNames = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const aspects: RashiDrishtiAspect[] = [];

  for (let s = 1; s <= 12; s++) {
    const sType = (s % 3); // 1=Movable, 2=Fixed, 0=Dual
    const targetSigns: number[] = [];

    if (sType === 1) { // Movable: aspects Fixed signs (2, 5, 8, 11) except adjacent (s+1)
      const fixedSigns = [2, 5, 8, 11];
      const adjacent = (s === 12) ? 1 : s + 1;
      targetSigns.push(...fixedSigns.filter(f => f !== s && f !== adjacent));
    } else if (sType === 2) { // Fixed: aspects Movable signs (1, 4, 7, 10) except adjacent (s-1)
      const movableSigns = [1, 4, 7, 10];
      const adjacent = (s === 1) ? 12 : s - 1;
      targetSigns.push(...movableSigns.filter(m => m !== s && m !== adjacent));
    } else { // Dual: aspects all other Dual signs (3, 6, 9, 12) except itself
      const dualSigns = [3, 6, 9, 12];
      targetSigns.push(...dualSigns.filter(d => d !== s));
    }

    const planetsInSource = planets.filter(p => p.rashiId === s).map(p => p.name);

    for (const t of targetSigns) {
      const planetsInTarget = planets.filter(p => p.rashiId === t).map(p => p.name);
      aspects.push({
        aspectingRashiId: s,
        aspectingRashiName: rashiNames[s - 1],
        aspectedRashiId: t,
        aspectedRashiName: rashiNames[t - 1],
        planetsInAspectingSign: planetsInSource,
        planetsInAspectedSign: planetsInTarget
      });
    }
  }

  return aspects;
}
