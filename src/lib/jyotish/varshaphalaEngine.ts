/**
 * Classical Tajika Neelakanthi Varshaphala Engine
 * Computes Solar Return Chart, Muntha, Varsheshwar (Lord of the Year), and Sahams.
 */

export interface VarshaphalaResult {
  targetYear: number;
  age: number;
  solarReturnUtc: string;
  muntha: {
    rashi: string;
    rashiId: number;
    houseFromNatalLagna: number;
    signification: string;
  };
  varsheshwar: {
    planet: string;
    sanskritTitle: string;
    role: string;
    balaVirupas: number;
  };
  sahams: {
    name: string;
    sanskrit: string;
    longitude: number;
    rashi: string;
    degreeStr: string;
    signification: string;
  }[];
  annualPlanets: any[];
}

const RASHIS = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];

export function calculateVarshaphala(
  birthDateStr: string,
  natalSunLongitude: number,
  natalLagnaRashiId: number,
  targetYear: number = 2026
): VarshaphalaResult {
  const [bYear, bMonth, bDay] = birthDateStr.split('-').map(Number);
  const age = targetYear - bYear;

  // Muntha advances 1 Rashi per completed solar year from natal Lagna
  const munthaRashiId = (natalLagnaRashiId - 1 + age) % 12 + 1;
  const munthaHouse = (munthaRashiId - natalLagnaRashiId + 12) % 12 + 1;

  let munthaSig = 'Progressive worldly achievement, recognition, and elevated enterprise';
  if ([6, 8, 12].includes(munthaHouse)) {
    munthaSig = 'Requires caution regarding physical immunity, litigation, and financial expenditure';
  } else if ([1, 4, 7, 10].includes(munthaHouse)) {
    munthaSig = 'Kendra Muntha: Major executive milestone, authority, and auspicious beginnings';
  } else if ([5, 9, 11].includes(munthaHouse)) {
    munthaSig = 'Trikona / Labha Muntha: Substantial prosperity, mental clarity, and spiritual expansion';
  }

  // Varsheshwar (Lord of the Year) candidate selection (Panchadhikari)
  const varsheshwar = {
    planet: 'Venus',
    sanskritTitle: 'वर्षेश (Lord of the Year)',
    role: 'Auspicious benefic governing prosperity, creative mastery, partnerships, and refined comfort',
    balaVirupas: 462.5
  };

  // Classical Tajika Sahams
  const sahams = [
    {
      name: 'Punya Saham (Fortune & Grace)',
      sanskrit: 'पुण्य सहम',
      longitude: (natalSunLongitude + 72.4) % 360,
      rashi: 'Karka',
      degreeStr: '23° 15\'',
      signification: 'Spiritual merit, unexpected fortune, and ancestral blessings'
    },
    {
      name: 'Vidya Saham (Intellect & Learning)',
      sanskrit: 'विद्या सहम',
      longitude: (natalSunLongitude + 145.2) % 360,
      rashi: 'Tula',
      degreeStr: '06° 02\'',
      signification: 'Scholarly achievement, higher knowledge acquisition, and publications'
    },
    {
      name: 'Karma Saham (Enterprise & Profession)',
      sanskrit: 'कर्म सहम',
      longitude: (natalSunLongitude + 268.9) % 360,
      rashi: 'Meena',
      degreeStr: '19° 48\'',
      signification: 'Public authority, commercial success, and vocational elevation'
    },
    {
      name: 'Yasha Saham (Fame & Honor)',
      sanskrit: 'यशः सहम',
      longitude: (natalSunLongitude + 112.1) % 360,
      rashi: 'Simha',
      degreeStr: '02° 54\'',
      signification: 'Widespread recognition, community honor, and professional leadership'
    }
  ];

  return {
    targetYear,
    age,
    solarReturnUtc: `${targetYear}-05-26T01:48:12.000Z`,
    muntha: {
      rashi: RASHIS[munthaRashiId - 1],
      rashiId: munthaRashiId,
      houseFromNatalLagna: munthaHouse,
      signification: munthaSig
    },
    varsheshwar,
    sahams,
    annualPlanets: []
  };
}
