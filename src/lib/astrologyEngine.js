import { calculateCelestialEphemeris } from './jyotish/celestialEngine';
/**
 * PROTECTED CANONICAL DOMAIN LOGIC: Kundali / Vedic Sidereal Chart Engine
 * Generates Lagna (Ascendant), 12 House Cusps (Bhavas), 9 Vedic Grahas,
 * Nakshatras, Padas, and Dignities according to Parashari Jyotish rules.
 * Uses Chitra Paksha (Lahiri Standard) Sidereal Ayanamsha.
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

export const RASIS = RASHIS.map(r => r.en);
export const RASI_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export const NAKSHATRA_RULERS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun',
  'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury'
];

export const NAKSHATRAS = NAKSHATRA_NAMES.map((name, i) => ({
  name,
  ruler: NAKSHATRA_RULERS[i],
  start: parseFloat((i * (360 / 27)).toFixed(3))
}));

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

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

export const HOUSE_SIGNIFICANCE = [
  'Self, Body, Personality',
  'Wealth, Family, Speech',
  'Siblings, Courage, Communication',
  'Home, Mother, Happiness',
  'Intelligence, Children, Creativity',
  'Health, Enemies, Service',
  'Marriage, Partnership, Business',
  'Longevity, Transformation, Hidden Wealth',
  'Luck, Dharma, Higher Learning',
  'Career, Fame, Status',
  'Gains, Social Circle, Ambitions',
  'Losses, Liberation, Foreign Travel'
];

export const EXALTATION = {
  Sun: { sign: 'Aries', degree: 10 },
  Moon: { sign: 'Taurus', degree: 3 },
  Mars: { sign: 'Capricorn', degree: 28 },
  Mercury: { sign: 'Virgo', degree: 15 },
  Jupiter: { sign: 'Cancer', degree: 5 },
  Venus: { sign: 'Pisces', degree: 27 },
  Saturn: { sign: 'Libra', degree: 20 },
  Rahu: { sign: 'Taurus', degree: 20 },
  Ketu: { sign: 'Scorpio', degree: 20 }
};

export const DEBILITATION = {
  Sun: { sign: 'Libra', degree: 10 },
  Moon: { sign: 'Scorpio', degree: 3 },
  Mars: { sign: 'Cancer', degree: 28 },
  Mercury: { sign: 'Pisces', degree: 15 },
  Jupiter: { sign: 'Capricorn', degree: 5 },
  Venus: { sign: 'Virgo', degree: 27 },
  Saturn: { sign: 'Aries', degree: 20 },
  Rahu: { sign: 'Scorpio', degree: 20 },
  Ketu: { sign: 'Taurus', degree: 20 }
};

// Dignity calculations (Exaltation, Debilitation, Own Sign)
export function getDignity(planetName, rashiId, degreeInSign = 0) {
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

export function toJulianDay(date) {
  const time = date.getTime();
  return (time / 86400000) + 2440587.5;
}

export function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

export function getLahiriAyanamsha(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.856 + 1.396 * T;
}

export function toSidereal(tropicalLon, ayanamsha) {
  return normalizeAngle(tropicalLon - ayanamsha);
}

export function getRasi(longitude) {
  return Math.floor(longitude / 30);
}

export function getDegreeInRasi(longitude) {
  return longitude % 30;
}

export function getNakshatra(longitude) {
  const nakIdx = Math.floor(longitude / (360 / 27));
  const pada = Math.floor((longitude % (360 / 27)) / (360 / 108)) + 1;
  const nakName = NAKSHATRA_NAMES[nakIdx % 27];
  const ruler = NAKSHATRA_RULERS[nakIdx % 27];
  return {
    name: nakName,
    index: nakIdx % 27,
    pada,
    ruler,
    degree: parseFloat((longitude % (360 / 27)).toFixed(4)),
    toString: () => nakName
  };
}

export function calculateLagna(jd, latitudeDeg, longitudeDeg) {
  const d = jd - 2451545.0;
  const T = d / 36525.0;

  // Greenwich Sidereal Time (GST)
  let gst = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000;
  gst = normalizeAngle(gst);

  // Local Sidereal Time (LST)
  const lst = normalizeAngle(gst + longitudeDeg);
  const lstRad = lst * Math.PI / 180;
  const latRad = latitudeDeg * Math.PI / 180;
  const obliquity = (23.4392911 - 0.0130042 * T) * Math.PI / 180;

  const sinLST = Math.sin(lstRad);
  const cosLST = Math.cos(lstRad);
  const sinObl = Math.sin(obliquity);
  const cosObl = Math.cos(obliquity);
  const tanLat = Math.tan(latRad);

  const y = cosLST;
  const x = -sinLST * cosObl - tanLat * sinObl;
  let tropLagna = Math.atan2(y, x) * 180 / Math.PI;
  return normalizeAngle(tropLagna);
}

/**
 * Canonical CalculateKundali Function
 * Supports both:
 * 1. Object argument: calculateKundali({ birthDate, birthTime, latitude, longitude, timezone, locationName })
 * 2. Positional arguments: calculateKundali(birthDate, birthTime, latitude, longitude, timezone, locationName)
 */
export function calculateKundali(arg1, arg2, arg3, arg4, arg5, arg6) {
  let birthDate, birthTime, latitude, longitude, timezone, locationName;

  if (typeof arg1 === 'object' && arg1 !== null) {
    birthDate = arg1.birthDate;
    birthTime = arg1.birthTime || '12:00';
    latitude = Number(arg1.latitude ?? arg1.birthLat ?? 25.5941);
    longitude = Number(arg1.longitude ?? arg1.birthLon ?? 85.1376);
    timezone = Number(arg1.timezone ?? 5.5);
    locationName = arg1.locationName || arg1.birthCity || 'Custom Location';
  } else {
    birthDate = arg1;
    birthTime = arg2 || '12:00';
    latitude = Number(arg3 ?? 25.5941);
    longitude = Number(arg4 ?? 85.1376);
    timezone = Number(arg5 ?? 5.5);
    locationName = arg6 || 'Custom Location';
  }

  // Parse Date and Time accurately in UTC
  let year, month, day, hour, minute;
  if (typeof birthDate === 'string') {
    const parts = birthDate.split('-').map(Number);
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else if (birthDate instanceof Date) {
    year = birthDate.getFullYear();
    month = birthDate.getMonth() + 1;
    day = birthDate.getDate();
    birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const timeParts = (birthTime || '12:00').split(':').map(Number);
  hour = timeParts[0] || 0;
  minute = timeParts[1] || 0;

  const utcHours = hour + minute / 60 - timezone;
  const birthDateTime = new Date(Date.UTC(year, month - 1, day, Math.floor(utcHours), Math.floor(((utcHours % 1 + 1) % 1) * 60)));

  // High-Precision Celestial Ephemeris Adapter Subsystem
  const ephemeris = calculateCelestialEphemeris({
    dateUtc: birthDateTime,
    latitude,
    longitude,
    nodeMode: 'MEAN_NODE'
  });

  const jd = ephemeris.julianDayTT;
  const ayanamsha = ephemeris.ayanamsha.degrees;
  const siderealLagna = ephemeris.lagna.siderealLongitude;
  const lagnaRashiId = Math.floor(siderealLagna / 30) + 1;
  const lagnaDegInSign = siderealLagna % 30;
  const lagnaNak = getNakshatra(siderealLagna);
  const lagnaRashi = RASHIS[lagnaRashiId - 1];

  // Use authoritative sidereal longitudes from celestial engine
  const sunLong = ephemeris.bodies.Sun.siderealLongitude;
  const moonLong = ephemeris.bodies.Moon.siderealLongitude;
  const marsLong = ephemeris.bodies.Mars.siderealLongitude;
  const mercuryLong = ephemeris.bodies.Mercury.siderealLongitude;
  const jupiterLong = ephemeris.bodies.Jupiter.siderealLongitude;
  const venusLong = ephemeris.bodies.Venus.siderealLongitude;
  const saturnLong = ephemeris.bodies.Saturn.siderealLongitude;
  const rahuLong = ephemeris.bodies.Rahu.siderealLongitude;
  const ketuLong = ephemeris.bodies.Ketu.siderealLongitude;

  const rawPlanets = [
    { name: 'Sun', long: sunLong, isRetrograde: ephemeris.bodies.Sun.isRetrograde },
    { name: 'Moon', long: moonLong, isRetrograde: ephemeris.bodies.Moon.isRetrograde },
    { name: 'Mars', long: marsLong, isRetrograde: ephemeris.bodies.Mars.isRetrograde },
    { name: 'Mercury', long: mercuryLong, isRetrograde: ephemeris.bodies.Mercury.isRetrograde },
    { name: 'Jupiter', long: jupiterLong, isRetrograde: ephemeris.bodies.Jupiter.isRetrograde },
    { name: 'Venus', long: venusLong, isRetrograde: ephemeris.bodies.Venus.isRetrograde },
    { name: 'Saturn', long: saturnLong, isRetrograde: ephemeris.bodies.Saturn.isRetrograde },
    { name: 'Rahu', long: rahuLong, isRetrograde: true },
    { name: 'Ketu', long: ketuLong, isRetrograde: true }
  ];

  // Map planets array
  const planetsArray = rawPlanets.map(p => {
    const normLong = normalizeAngle(p.long);
    const rashiId = (Math.floor(normLong / 30) % 12) + 1;
    const degInSign = normLong % 30;
    const nak = getNakshatra(normLong);
    const house = ((rashiId - lagnaRashiId + 12) % 12) + 1;
    const dignity = getDignity(p.name, rashiId, degInSign);
    const info = PLANET_INFO[p.name] || {};
    const rashi = RASHIS[rashiId - 1] || RASHIS[0];

    return {
      name: p.name,
      sanskrit: info.sanskrit || p.name,
      symbol: info.symbol || '☉',
      nature: info.nature || 'Neutral',
      karaka: info.karaka || '',
      longitude: p.long,
      rashiId,
      rasi: rashiId - 1,
      rasiIndex: rashiId - 1,
      rashiName: rashi.name,
      rashiEn: rashi.en,
      rasiName: rashi.en,
      rashiLord: rashi.lord,
      degrees: Math.floor(degInSign),
      minutes: Math.floor((degInSign % 1) * 60),
      degreeStr: `${Math.floor(degInSign)}° ${Math.floor((degInSign % 1) * 60)}'`,
      degreeInRasi: parseFloat(degInSign.toFixed(2)),
      house,
      nakshatra: nak,
      pada: nak.pada,
      dignity,
      status: dignity,
      isRetrograde: p.isRetrograde
    };
  });

  // Attach named properties to the planets array for dual access: planets.Sun / planets.Moon and planets.map(...)
  const planets = Object.assign(planetsArray, {
    Sun: planetsArray[0],
    Moon: planetsArray[1],
    Mars: planetsArray[2],
    Mercury: planetsArray[3],
    Jupiter: planetsArray[4],
    Venus: planetsArray[5],
    Saturn: planetsArray[6],
    Rahu: planetsArray[7],
    Ketu: planetsArray[8]
  });

  // 12 Houses / Bhavas structure
  const houses = Array.from({ length: 12 }, (_, i) => {
    const houseNum = i + 1;
    const rashiId = ((lagnaRashiId + i - 1) % 12) + 1;
    const rashi = RASHIS[rashiId - 1];
    const occupyingPlanets = planetsArray.filter(p => p.house === houseNum);

    return {
      number: houseNum,
      house: houseNum,
      rashiId,
      rasi: rashiId - 1,
      rasiIndex: rashiId - 1,
      rashiName: rashi.name,
      rashiEn: rashi.en,
      rasiName: rashi.en,
      longitude: (rashiId - 1) * 30,
      rashiEn: rashi.en,
      rasiName: rashi.en,
      lord: rashi.lord,
      element: rashi.element,
      significance: HOUSE_SIGNIFICANCE[i],
      planets: occupyingPlanets.map(p => p.name),
      occupyingPlanets
    };
  });

  const moonData = planets.Moon;

  return {
    meta: {
      birthDate,
      birthTime,
      locationName,
      latitude,
      longitude,
      timezone,
      ayanamsha: parseFloat(ayanamsha.toFixed(4))
    },
    metadata: {
      birthDate: birthDateTime.toISOString(),
      latitude,
      longitude,
      timezone
    },
    lagna: {
      longitude: siderealLagna,
      rashiId: lagnaRashiId,
      rasi: lagnaRashiId - 1,
      rasiIndex: lagnaRashiId - 1,
      rashiName: lagnaRashi.name,
      rashiEn: lagnaRashi.en,
      rasiName: lagnaRashi.en,
      lord: lagnaRashi.lord,
      degrees: Math.floor(lagnaDegInSign),
      minutes: Math.floor((lagnaDegInSign % 1) * 60),
      degreeStr: `${Math.floor(lagnaDegInSign)}° ${Math.floor((lagnaDegInSign % 1) * 60)}'`,
      degreeInRasi: parseFloat(lagnaDegInSign.toFixed(2)),
      nakshatra: lagnaNak,
      pada: lagnaNak.pada
    },
    moon: {
      rashiId: moonData.rashiId,
      rasi: moonData.rasi,
      rashiName: moonData.rashiName,
      rashiEn: moonData.rashiEn,
      rasiName: moonData.rasiName,
      nakshatra: moonData.nakshatra,
      pada: moonData.pada,
      degrees: moonData.degrees,
      minutes: moonData.minutes,
      degreeStr: moonData.degreeStr,
      degreeInRasi: moonData.degreeInRasi,
      longitude: moonData.longitude
    },
    planets,
    houses,
    ayanamsha: parseFloat(ayanamsha.toFixed(4)),
    julianDay: jd
  };
}

export default {
  calculateKundali,
  calculateLagna,
  getLahiriAyanamsha,
  getNakshatra,
  getRasi,
  getDignity,
  toSidereal,
  toJulianDay,
  normalizeAngle,
  PLANETS,
  PLANET_INFO,
  RASHIS,
  RASIS,
  NAKSHATRAS,
  NAKSHATRA_NAMES,
  HOUSE_SIGNIFICANCE,
  EXALTATION,
  DEBILITATION
};
