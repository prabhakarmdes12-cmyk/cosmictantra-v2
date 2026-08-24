/**
 * PROTECTED DOMAIN LOGIC: Kundali / Vedic Sidereal Chart Engine
 * Generates Lagna (Ascendant), 12 House Cusps (Bhavas), 9 Vedic Grahas,
 * Nakshatras, Padas, and Dignities according to Parashari Jyotish rules.
 */

export const RASHIS = [
  { id: 1, name: 'Mesha', en: 'Aries', lord: 'Mars', element: 'Fire' },
  { id: 2, name: 'Vrishabha', en: 'Taurus', lord: 'Venus', element: 'Earth' },
  { id: 3, name: 'Mithuna', en: 'Gemini', lord: 'Mercury', element: 'Air' },
  { id: 4, name: 'Karka', en: 'Cancer', lord: 'Moon', element: 'Water' },
  { id: 5, name: 'Simha', en: 'Leo', lord: 'Sun', element: 'Fire' },
  { id: 6, name: 'Kanya', en: 'Virgo', lord: 'Mercury', element: 'Earth' },
  { id: 7, name: 'Tula', en: 'Libra', lord: 'Venus', element: 'Air' },
  { id: 8, name: 'Vrishchika', en: 'Scorpio', lord: 'Mars', element: 'Water' },
  { id: 9, name: 'Dhanu', en: 'Sagittarius', lord: 'Jupiter', element: 'Fire' },
  { id: 10, name: 'Makara', en: 'Capricorn', lord: 'Saturn', element: 'Earth' },
  { id: 11, name: 'Kumbha', en: 'Aquarius', lord: 'Saturn', element: 'Air' },
  { id: 12, name: 'Meena', en: 'Pisces', lord: 'Jupiter', element: 'Water' }
];

export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export const PLANET_INFO = {
  Sun: { sanskrit: 'Surya', symbol: '☉', nature: 'Kruura (Natural Malefic)', karaka: 'Soul, Father, Vitality, Authority' },
  Moon: { sanskrit: 'Chandra', symbol: '☽', nature: 'Saumya (Benefic)', karaka: 'Mind, Mother, Emotions, Memory' },
  Mars: { sanskrit: 'Mangal', symbol: '♂', nature: 'Kruura (Malefic)', karaka: 'Energy, Courage, Property, Siblings' },
  Mercury: { sanskrit: 'Budha', symbol: '☿', nature: 'Saumya (Benefic)', karaka: 'Intellect, Speech, Commerce, Logic' },
  Jupiter: { sanskrit: 'Guru', symbol: '♃', nature: 'Saumya (Great Benefic)', karaka: 'Wisdom, Dharma, Children, Wealth' },
  Venus: { sanskrit: 'Shukra', symbol: '♀', nature: 'Saumya (Benefic)', karaka: 'Beauty, Relationships, Arts, Vehicles' },
  Saturn: { sanskrit: 'Shani', symbol: '♄', nature: 'Kruura (Malefic)', karaka: 'Discipline, Karma, Longevity, Service' },
  Rahu: { sanskrit: 'Rahu', symbol: '☊', nature: 'Shadow Planet (Chhaya Graha)', karaka: 'Ambition, Worldly Maya, Innovation' },
  Ketu: { sanskrit: 'Ketu', symbol: '☋', nature: 'Shadow Planet (Moksha Karaka)', karaka: 'Detachment, Spirituality, Liberation' }
};

// Dignity calculations (Exaltation, Debilitation, Own Sign)
function getDignity(planetName, rashiId, degreeInSign) {
  switch (planetName) {
    case 'Sun':
      if (rashiId === 1) return degreeInSign <= 10 ? 'Exalted (Deep)' : 'Exalted';
      if (rashiId === 7) return degreeInSign <= 10 ? 'Debilitated (Deep)' : 'Debilitated';
      if (rashiId === 5) return degreeInSign <= 20 ? 'Moolatrikona' : 'Own Sign (Swakshetra)';
      if ([9, 12, 4, 8].includes(rashiId)) return 'Friendly Sign';
      return 'Neutral / Enemy';

    case 'Moon':
      if (rashiId === 2) return degreeInSign <= 3 ? 'Exalted (Deep)' : 'Moolatrikona';
      if (rashiId === 8) return 'Debilitated';
      if (rashiId === 4) return 'Own Sign (Swakshetra)';
      if ([1, 5, 3, 6].includes(rashiId)) return 'Friendly Sign';
      return 'Neutral / Enemy';

    case 'Mars':
      if (rashiId === 10) return 'Exalted';
      if (rashiId === 4) return 'Debilitated';
      if (rashiId === 1) return degreeInSign <= 12 ? 'Moolatrikona' : 'Own Sign';
      if (rashiId === 8) return 'Own Sign';
      if ([5, 4, 9, 12].includes(rashiId)) return 'Friendly Sign';
      return 'Neutral / Enemy';

    case 'Mercury':
      if (rashiId === 6) return degreeInSign <= 15 ? 'Exalted' : degreeInSign <= 20 ? 'Moolatrikona' : 'Own Sign';
      if (rashiId === 12) return 'Debilitated';
      if (rashiId === 3) return 'Own Sign';
      if ([5, 2, 7].includes(rashiId)) return 'Friendly Sign';
      return 'Neutral / Enemy';

    case 'Jupiter':
      if (rashiId === 4) return degreeInSign <= 5 ? 'Exalted (Deep)' : 'Exalted';
      if (rashiId === 10) return 'Debilitated';
      if (rashiId === 9) return degreeInSign <= 10 ? 'Moolatrikona' : 'Own Sign';
      if (rashiId === 12) return 'Own Sign';
      if ([1, 8, 5].includes(rashiId)) return 'Friendly Sign';
      return 'Neutral / Enemy';

    case 'Venus':
      if (rashiId === 12) return degreeInSign <= 27 ? 'Exalted (Deep)' : 'Exalted';
      if (rashiId === 6) return 'Debilitated';
      if (rashiId === 7) return degreeInSign <= 15 ? 'Moolatrikona' : 'Own Sign';
      if (rashiId === 2) return 'Own Sign';
      if ([3, 6, 10, 11].includes(rashiId)) return 'Friendly Sign';
      return 'Neutral / Enemy';

    case 'Saturn':
      if (rashiId === 7) return degreeInSign <= 20 ? 'Exalted (Deep)' : 'Exalted';
      if (rashiId === 1) return 'Debilitated';
      if (rashiId === 11) return degreeInSign <= 20 ? 'Moolatrikona' : 'Own Sign';
      if (rashiId === 10) return 'Own Sign';
      if ([3, 6, 2].includes(rashiId)) return 'Friendly Sign';
      return 'Neutral / Enemy';

    case 'Rahu':
      if (rashiId === 2 || rashiId === 3) return 'Exalted';
      if (rashiId === 8 || rashiId === 9) return 'Debilitated';
      if (rashiId === 11) return 'Moolatrikona';
      return 'Neutral';

    case 'Ketu':
      if (rashiId === 8 || rashiId === 9) return 'Exalted';
      if (rashiId === 2 || rashiId === 3) return 'Debilitated';
      if (rashiId === 5) return 'Moolatrikona';
      return 'Neutral';

    default:
      return 'Neutral';
  }
}

export function calculateKundali({ birthDate, birthTime, latitude, longitude, timezone = 5.5, locationName = 'Custom Location' }) {
  // Parse date and time
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = birthTime.split(':').map(Number);
  
  // Date in UTC
  const utcHours = hour + minute / 60 - timezone;
  const birthDateTime = new Date(Date.UTC(year, month - 1, day, Math.floor(utcHours), Math.floor((utcHours % 1) * 60)));
  
  // Julian Day
  const jd = (birthDateTime.getTime() / 86400000) + 2440587.5;
  const d = jd - 2451545.0; // days from J2000.0
  const T = d / 36525.0;     // Julian centuries
  
  // Lahiri Ayanamsha
  const ayanamsha = 23.856 + 1.396 * T;
  
  // Greenwhich Sidereal Time (GST)
  let gst = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000;
  gst = (gst % 360 + 360) % 360;
  
  // Local Sidereal Time (LST)
  const lst = (gst + longitude + 360) % 360;
  const lstRad = lst * Math.PI / 180;
  const latRad = latitude * Math.PI / 180;
  const obliquity = (23.4392911 - 0.0130042 * T) * Math.PI / 180;
  
  // Ascendant / Lagna calculation
  const sinLST = Math.sin(lstRad);
  const cosLST = Math.cos(lstRad);
  const sinObl = Math.sin(obliquity);
  const cosObl = Math.cos(obliquity);
  const tanLat = Math.tan(latRad);
  
  const y = cosLST;
  const x = -sinLST * cosObl - tanLat * sinObl;
  let tropLagna = Math.atan2(y, x) * 180 / Math.PI;
  tropLagna = (tropLagna + 360) % 360;
  
  // Sidereal Lagna
  const siderealLagna = (tropLagna - ayanamsha + 360) % 360;
  const lagnaRashiId = Math.floor(siderealLagna / 30) + 1;
  const lagnaDegInSign = siderealLagna % 30;
  
  // Planetary positions (deterministic sidereal ephemeris approximations)
  const calcPlanetLong = (base, dailyRate, perturb = 0) => {
    const trop = (base + dailyRate * d + perturb + 360000) % 360;
    return (trop - ayanamsha + 360) % 360;
  };
  
  const sunLong = calcPlanetLong(280.46, 0.9856474, 1.915 * Math.sin((357.529 + 0.9856 * d) * Math.PI / 180));
  const moonLong = calcPlanetLong(218.32, 13.176396, 6.289 * Math.sin((134.96 + 13.065 * d) * Math.PI / 180));
  const marsLong = calcPlanetLong(355.43, 0.524033, 10.69 * Math.sin((19.37 + 0.524 * d) * Math.PI / 180));
  const mercuryLong = calcPlanetLong(252.25, 4.092334, 4.0 * Math.sin((168.65 + 4.092 * d) * Math.PI / 180));
  const jupiterLong = calcPlanetLong(34.35, 0.083085, 2.5 * Math.sin((20.4 + 0.083 * d) * Math.PI / 180));
  const venusLong = calcPlanetLong(181.98, 1.602130, 1.5 * Math.sin((212.6 + 1.602 * d) * Math.PI / 180));
  const saturnLong = calcPlanetLong(50.08, 0.033444, 2.0 * Math.sin((317.0 + 0.033 * d) * Math.PI / 180));
  const rahuLong = (290.0 - 0.05295 * d - ayanamsha + 36000) % 360;
  const ketuLong = (rahuLong + 180) % 360;
  
  const rawPlanets = [
    { name: 'Sun', long: sunLong, isRetrograde: false },
    { name: 'Moon', long: moonLong, isRetrograde: false },
    { name: 'Mars', long: marsLong, isRetrograde: false },
    { name: 'Mercury', long: mercuryLong, isRetrograde: false },
    { name: 'Jupiter', long: jupiterLong, isRetrograde: false },
    { name: 'Venus', long: venusLong, isRetrograde: false },
    { name: 'Saturn', long: saturnLong, isRetrograde: false },
    { name: 'Rahu', long: rahuLong, isRetrograde: true },
    { name: 'Ketu', long: ketuLong, isRetrograde: true }
  ];
  
  // Format planets with Rashi, Bhava (House), Nakshatra & Dignity
  const planets = rawPlanets.map(p => {
    const rashiId = Math.floor(p.long / 30) + 1;
    const degInSign = p.long % 30;
    const nakIndex = Math.floor(p.long / (360 / 27));
    const pada = Math.floor((p.long % (360 / 27)) / (360 / 108)) + 1;
    
    // North Indian Equal House system (Lagna Rashi = House 1)
    let house = ((rashiId - lagnaRashiId + 12) % 12) + 1;
    
    const dignity = getDignity(p.name, rashiId, degInSign);
    const info = PLANET_INFO[p.name];
    
    return {
      name: p.name,
      sanskrit: info.sanskrit,
      symbol: info.symbol,
      nature: info.nature,
      karaka: info.karaka,
      longitude: p.long,
      rashiId,
      rashiName: RASHIS[rashiId - 1].name,
      rashiEn: RASHIS[rashiId - 1].en,
      rashiLord: RASHIS[rashiId - 1].lord,
      degrees: Math.floor(degInSign),
      minutes: Math.floor((degInSign % 1) * 60),
      degreeStr: `${Math.floor(degInSign)}° ${Math.floor((degInSign % 1) * 60)}'`,
      house,
      nakshatra: NAKSHATRA_NAMES[nakIndex % 27],
      pada,
      dignity,
      isRetrograde: p.isRetrograde
    };
  });
  
  // 12 Houses / Bhavas structure
  const houses = Array.from({ length: 12 }, (_, i) => {
    const houseNum = i + 1;
    const rashiId = ((lagnaRashiId + i - 1) % 12) + 1;
    const rashi = RASHIS[rashiId - 1];
    const occupyingPlanets = planets.filter(p => p.house === houseNum);
    
    return {
      house: houseNum,
      rashiId,
      rashiName: rashi.name,
      rashiEn: rashi.en,
      lord: rashi.lord,
      element: rashi.element,
      planets: occupyingPlanets
    };
  });

  const moonData = planets.find(p => p.name === 'Moon');
  const lagnaRashi = RASHIS[lagnaRashiId - 1];
  const lagnaNakIndex = Math.floor(siderealLagna / (360 / 27));
  const lagnaPada = Math.floor((siderealLagna % (360 / 27)) / (360 / 108)) + 1;

  return {
    meta: {
      birthDate,
      birthTime,
      locationName,
      latitude,
      longitude,
      timezone,
      ayanamsha: ayanamsha.toFixed(4)
    },
    lagna: {
      rashiId: lagnaRashiId,
      rashiName: lagnaRashi.name,
      rashiEn: lagnaRashi.en,
      lord: lagnaRashi.lord,
      degrees: Math.floor(lagnaDegInSign),
      minutes: Math.floor((lagnaDegInSign % 1) * 60),
      degreeStr: `${Math.floor(lagnaDegInSign)}° ${Math.floor((lagnaDegInSign % 1) * 60)}'`,
      nakshatra: NAKSHATRA_NAMES[lagnaNakIndex % 27],
      pada: lagnaPada
    },
    moon: {
      rashiId: moonData.rashiId,
      rashiName: moonData.rashiName,
      rashiEn: moonData.rashiEn,
      nakshatra: moonData.nakshatra,
      pada: moonData.pada,
      degrees: moonData.degrees,
      minutes: moonData.minutes,
      degreeStr: moonData.degreeStr,
      longitude: moonData.longitude
    },
    planets,
    houses
  };
}
