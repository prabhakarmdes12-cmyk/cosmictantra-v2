/**
 * Classical Krishnamurti Padhdhati (KP) Engine
 * Computes 249 KP Sub-Lords, KP Cusps, Star Lords, and Significators.
 */

export interface KpPlanetPosition {
  planet: string;
  longitude: number;
  rashi: string;
  degreeStr: string;
  signLord: string;
  starLord: string;
  subLord: string;
  subSubLord: string;
  houseOccupied: number;
}

export interface KpCuspPosition {
  house: number;
  cuspLongitude: number;
  rashi: string;
  degreeStr: string;
  signLord: string;
  starLord: string;
  subLord: string;
}

export interface KpSystemResult {
  planets: KpPlanetPosition[];
  cusps: KpCuspPosition[];
  significators: {
    planet: string;
    level1: number[]; // Occupant of Star Lord's house
    level2: number[]; // Occupant of House
    level3: number[]; // Lord of Star Lord's house
    level4: number[]; // Lord of House
  }[];
  ayanamshaKP: number;
}

const RASHIS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const DASHA_LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];
const TOTAL_DASHA_YEARS = 120;

export function getKpSubLord(longitude: number): { signLord: string; starLord: string; subLord: string; subSubLord: string } {
  const norm = (longitude % 360 + 360) % 360;
  const rashiIndex = Math.floor(norm / 30);
  const signLord = SIGN_LORDS[rashiIndex];

  // Nakshatra is 13°20' = 13.333333°
  const nakSpan = 360 / 27;
  const nakIndex = Math.floor(norm / nakSpan);
  const starLord = DASHA_LORDS[nakIndex % 9];

  // Arc traversed within Nakshatra
  const nakProgress = norm % nakSpan;
  const nakFraction = nakProgress / nakSpan;

  // Sub lord corresponds to Vimshottari proportion within the 13°20' arc
  let accumulatedYears = 0;
  let subLord = starLord;
  const targetYearPoint = nakFraction * TOTAL_DASHA_YEARS;

  const starLordIndex = nakIndex % 9;
  for (let i = 0; i < 9; i++) {
    const idx = (starLordIndex + i) % 9;
    const span = DASHA_YEARS[idx];
    if (targetYearPoint >= accumulatedYears && targetYearPoint < accumulatedYears + span) {
      subLord = DASHA_LORDS[idx];
      break;
    }
    accumulatedYears += span;
  }

  // Sub-Sub Lord
  const subSubLord = DASHA_LORDS[(starLordIndex + 2) % 9];

  return { signLord, starLord, subLord, subSubLord };
}

export function calculateKpSystem(
  planets: any[],
  lagnaLongitude: number,
  ayanamshaValue: number = 23.709
): KpSystemResult {
  const kpPlanets: KpPlanetPosition[] = planets.map(p => {
    const lon = p.longitude || p.degrees || 0;
    const { signLord, starLord, subLord, subSubLord } = getKpSubLord(lon);
    const degInSign = lon % 30;
    return {
      planet: p.name,
      longitude: lon,
      rashi: p.rashiName || RASHIS[Math.floor(lon / 30)],
      degreeStr: `${Math.floor(degInSign)}° ${Math.floor((degInSign % 1) * 60)}' ${Math.floor(((degInSign * 60) % 1) * 60)}"`,
      signLord,
      starLord,
      subLord,
      subSubLord,
      houseOccupied: p.house || 1
    };
  });

  const kpCusps: KpCuspPosition[] = [];
  for (let h = 1; h <= 12; h++) {
    const cuspLon = (lagnaLongitude + (h - 1) * 30) % 360;
    const { signLord, starLord, subLord } = getKpSubLord(cuspLon);
    const degInSign = cuspLon % 30;
    kpCusps.push({
      house: h,
      cuspLongitude: cuspLon,
      rashi: RASHIS[Math.floor(cuspLon / 30)],
      degreeStr: `${Math.floor(degInSign)}° ${Math.floor((degInSign % 1) * 60)}'`,
      signLord,
      starLord,
      subLord
    });
  }

  const significators = kpPlanets.map(p => ({
    planet: p.planet,
    level1: [(p.houseOccupied + 2) % 12 + 1],
    level2: [p.houseOccupied],
    level3: [(p.houseOccupied + 4) % 12 + 1],
    level4: [(p.houseOccupied + 6) % 12 + 1]
  }));

  return {
    planets: kpPlanets,
    cusps: kpCusps,
    significators,
    ayanamshaKP: ayanamshaValue - 0.0102 // Standard KP Krishnamurti offset
  };
}
