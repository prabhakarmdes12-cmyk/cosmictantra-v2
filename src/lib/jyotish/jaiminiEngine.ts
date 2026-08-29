/**
 * Classical Jaimini Upadesha Sutras Engine
 * Computes 7 Chara Karakas, Arudha Lagna (AL), Upapada Lagna (UL), Karakamsha, Swamsha.
 */

export interface CharaKaraka {
  code: 'AK' | 'AmK' | 'BK' | 'MK' | 'PK' | 'GK' | 'DK';
  name: string;
  sanskrit: string;
  planet: string;
  degreeInRashi: number;
  degreeStr: string;
  rashi: string;
  house: number;
  signification: string;
}

export interface JaiminiResult {
  karakas: CharaKaraka[];
  atmakaraka: CharaKaraka;
  amatyakaraka: CharaKaraka;
  darakaraka: CharaKaraka;
  arudhaLagna: { rashi: string; rashiId: number; houseFromLagna: number };
  upapadaLagna: { rashi: string; rashiId: number; houseFromLagna: number };
  karakamsha: { rashi: string; rashiId: number; navamshaRashi: string };
  charaDashaOrder: { rashi: string; years: number }[];
}

const RASHIS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];

const RASHI_LORDS: Record<number, string> = {
  1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury',
  7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter'
};

export function calculateJaimini(
  planets: any[],
  lagna: { rashiId: number; degrees: number; longitude: number },
  d9Navamsha?: any[]
): JaiminiResult {
  // 7 Chara Karakas (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn)
  const candidatePlanets = planets.filter(p => ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(p.name));

  const sorted = [...candidatePlanets].sort((a, b) => (b.degreeInRasi || (b.degrees % 30)) - (a.degreeInRasi || (a.degrees % 30)));

  const karakaDefs: { code: CharaKaraka['code']; name: string; sanskrit: string; sig: string }[] = [
    { code: 'AK', name: 'Atmakaraka', sanskrit: 'आत्मकारक', sig: 'Soul indicator, destiny, core vitality and highest spiritual purpose' },
    { code: 'AmK', name: 'Amatyakaraka', sanskrit: 'अमात्यकारक', sig: 'Career, profession, counsel, worldly status and executive action' },
    { code: 'BK', name: 'Bhratrikaraka', sanskrit: 'भ्रातृकारक', sig: 'Siblings, mentors, preceptors, inner courage and guides' },
    { code: 'MK', name: 'Matrikaraka', sanskrit: 'मातृकारक', sig: 'Mother, emotional foundation, vehicles, schooling and residence' },
    { code: 'PK', name: 'Putrakaraka', sanskrit: 'पुत्रकारक', sig: 'Children, intellect, creative intelligence, mantras and future merit' },
    { code: 'GK', name: 'Gnatikaraka', sanskrit: 'ज्ञातिकारक', sig: 'Kith, kin, rivals, obstacles, disputes, immune resistance' },
    { code: 'DK', name: 'Darakaraka', sanskrit: 'दारकारक', sig: 'Spouse, life partner, contracts, alliances and public relationships' }
  ];

  const karakas: CharaKaraka[] = sorted.map((p, idx) => {
    const def = karakaDefs[idx];
    const deg = p.degreeInRasi || (p.degrees % 30) || 0;
    return {
      code: def.code,
      name: def.name,
      sanskrit: def.sanskrit,
      planet: p.name,
      degreeInRashi: deg,
      degreeStr: `${Math.floor(deg)}° ${Math.floor((deg % 1) * 60)}'`,
      rashi: p.rashiName || p.rasiName || RASHIS[(p.rashiId || 1) - 1],
      house: p.house || 1,
      signification: def.sig
    };
  });

  const atmakaraka = karakas[0];
  const amatyakaraka = karakas[1];
  const darakaraka = karakas[6];

  // Arudha Lagna (AL): Distance from Lagna to Lagna Lord, projected equally forward
  const lagnaLordName = RASHI_LORDS[lagna.rashiId];
  const lagnaLordPlanet = planets.find(p => p.name === lagnaLordName);
  const lagnaLordRashiId = lagnaLordPlanet ? (lagnaLordPlanet.rashiId || lagnaLordPlanet.rasi || 1) : lagna.rashiId;

  const distToLord = (lagnaLordRashiId - lagna.rashiId + 12) % 12;
  let arudhaRashiId = (lagnaLordRashiId + distToLord) % 12;
  if (arudhaRashiId === 0) arudhaRashiId = 12;

  // Jaimini exception: If AL falls in 1st or 7th from house, shift 10th
  if (arudhaRashiId === lagna.rashiId || arudhaRashiId === ((lagna.rashiId + 5) % 12 + 1)) {
    arudhaRashiId = (arudhaRashiId + 9) % 12 || 12;
  }

  // Upapada Lagna (UL): Arudha of the 12th house
  const h12RashiId = (lagna.rashiId - 2 + 12) % 12 + 1;
  const h12LordName = RASHI_LORDS[h12RashiId];
  const h12LordPlanet = planets.find(p => p.name === h12LordName);
  const h12LordRashiId = h12LordPlanet ? (h12LordPlanet.rashiId || h12LordPlanet.rasi || 1) : h12RashiId;
  const dist12 = (h12LordRashiId - h12RashiId + 12) % 12;
  let upapadaRashiId = (h12LordRashiId + dist12) % 12;
  if (upapadaRashiId === 0) upapadaRashiId = 12;

  // Karakamsha: Navamsha placement of Atmakaraka
  let navamshaRashi = atmakaraka.rashi;
  if (d9Navamsha) {
    const d9P = d9Navamsha.find(d => d.planet === atmakaraka.planet);
    if (d9P) navamshaRashi = d9P.navamshaRashi;
  }

  const charaDashaOrder = RASHIS.map((r, i) => ({
    rashi: r,
    years: ((i + lagna.rashiId) % 9) + 4
  }));

  return {
    karakas,
    atmakaraka,
    amatyakaraka,
    darakaraka,
    arudhaLagna: {
      rashi: RASHIS[arudhaRashiId - 1],
      rashiId: arudhaRashiId,
      houseFromLagna: (arudhaRashiId - lagna.rashiId + 12) % 12 + 1
    },
    upapadaLagna: {
      rashi: RASHIS[upapadaRashiId - 1],
      rashiId: upapadaRashiId,
      houseFromLagna: (upapadaRashiId - lagna.rashiId + 12) % 12 + 1
    },
    karakamsha: {
      rashi: atmakaraka.rashi,
      rashiId: (RASHIS.indexOf(atmakaraka.rashi) + 1) || 1,
      navamshaRashi
    },
    charaDashaOrder
  };
}
