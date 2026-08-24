/**
 * CosmicTantra V34 — Astrology Engine
 * Vedic / Jyotish planetary calculation engine
 * Implements: Lagna, planetary longitudes, house assignments,
 * Nakshatra, rasi, aspects, North/South Indian chart data
 */

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export const RASIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const RASI_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export const NAKSHATRAS = [
  { name: 'Ashwini', ruler: 'Ketu', start: 0 },
  { name: 'Bharani', ruler: 'Venus', start: 13.333 },
  { name: 'Krittika', ruler: 'Sun', start: 26.666 },
  { name: 'Rohini', ruler: 'Moon', start: 40 },
  { name: 'Mrigashira', ruler: 'Mars', start: 53.333 },
  { name: 'Ardra', ruler: 'Rahu', start: 66.666 },
  { name: 'Punarvasu', ruler: 'Jupiter', start: 80 },
  { name: 'Pushya', ruler: 'Saturn', start: 93.333 },
  { name: 'Ashlesha', ruler: 'Mercury', start: 106.666 },
  { name: 'Magha', ruler: 'Ketu', start: 120 },
  { name: 'Purva Phalguni', ruler: 'Venus', start: 133.333 },
  { name: 'Uttara Phalguni', ruler: 'Sun', start: 146.666 },
  { name: 'Hasta', ruler: 'Moon', start: 160 },
  { name: 'Chitra', ruler: 'Mars', start: 173.333 },
  { name: 'Swati', ruler: 'Rahu', start: 186.666 },
  { name: 'Vishakha', ruler: 'Jupiter', start: 200 },
  { name: 'Anuradha', ruler: 'Saturn', start: 213.333 },
  { name: 'Jyeshtha', ruler: 'Mercury', start: 226.666 },
  { name: 'Mula', ruler: 'Ketu', start: 240 },
  { name: 'Purva Ashadha', ruler: 'Venus', start: 253.333 },
  { name: 'Uttara Ashadha', ruler: 'Sun', start: 266.666 },
  { name: 'Shravana', ruler: 'Moon', start: 280 },
  { name: 'Dhanishtha', ruler: 'Mars', start: 293.333 },
  { name: 'Shatabhisha', ruler: 'Rahu', start: 306.666 },
  { name: 'Purva Bhadrapada', ruler: 'Jupiter', start: 320 },
  { name: 'Uttara Bhadrapada', ruler: 'Saturn', start: 333.333 },
  { name: 'Revati', ruler: 'Mercury', start: 346.666 },
];

export const PLANET_RULERS = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

export const EXALTATION = {
  Sun: { sign: 'Aries', degree: 10 },
  Moon: { sign: 'Taurus', degree: 3 },
  Mars: { sign: 'Capricorn', degree: 28 },
  Mercury: { sign: 'Virgo', degree: 15 },
  Jupiter: { sign: 'Cancer', degree: 5 },
  Venus: { sign: 'Pisces', degree: 27 },
  Saturn: { sign: 'Libra', degree: 20 },
  Rahu: { sign: 'Taurus', degree: 20 },
  Ketu: { sign: 'Scorpio', degree: 20 },
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
  Ketu: { sign: 'Taurus', degree: 20 },
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
  'Losses, Liberation, Foreign Travel',
];

// ─── JULIAN DATE & TIME UTILITIES ───────────────────────────────────────────

export function toJulianDay(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  let jy = y, jm = m;
  if (m <= 2) { jy -= 1; jm += 12; }
  const A = Math.floor(jy / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (jy + 4716)) + Math.floor(30.6001 * (jm + 1)) + d + h / 24 + B - 1524.5;
}

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function degreesToRadians(deg) { return deg * Math.PI / 180; }
function radiansToDegrees(rad) { return rad * 180 / Math.PI; }

// ─── AYANAMSHA (Lahiri) ──────────────────────────────────────────────────────

export function getLahiriAyanamsha(julianDay) {
  const T = (julianDay - 2451545.0) / 36525;
  return 23.85 + (0.0137792 * T) + (0.000012 * T * T);
}

// ─── PLANETARY LONGITUDE CALCULATIONS ───────────────────────────────────────

function sunLongitude(T) {
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = degreesToRadians(M);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr);
  return normalizeAngle(L0 + C);
}

function moonLongitude(T) {
  const L1 = 218.3165 + 481267.8813 * T;
  const M = 357.5291 + 35999.0503 * T;
  const Mp = 134.9634 + 477198.8676 * T;
  const D = 297.8502 + 445267.1115 * T;
  const F = 93.2721 + 483202.0175 * T;
  const Mr = degreesToRadians(normalizeAngle(M));
  const Mpr = degreesToRadians(normalizeAngle(Mp));
  const Dr = degreesToRadians(normalizeAngle(D));
  const Fr = degreesToRadians(normalizeAngle(F));

  const lon = L1
    + 6.2886 * Math.sin(Mpr)
    + 1.2740 * Math.sin(2 * Dr - Mpr)
    + 0.6583 * Math.sin(2 * Dr)
    + 0.2136 * Math.sin(2 * Mpr)
    - 0.1851 * Math.sin(Mr)
    - 0.1143 * Math.sin(2 * Fr)
    + 0.0588 * Math.sin(2 * Dr - 2 * Mpr)
    + 0.0572 * Math.sin(2 * Dr - Mr - Mpr)
    + 0.0533 * Math.sin(2 * Dr + Mpr);
  return normalizeAngle(lon);
}

function marsLongitude(T) {
  const L = 355.433 + 19140.299 * T + 0.000261 * T * T;
  const M = 19.373 + 19140.30268 * T;
  const Mr = degreesToRadians(normalizeAngle(M));
  return normalizeAngle(L + 10.691 * Math.sin(Mr) + 0.623 * Math.sin(2 * Mr) + 0.050 * Math.sin(3 * Mr));
}

function mercuryLongitude(T) {
  const L = 252.251 + 149472.675 * T;
  const M = 174.795 + 149472.515 * T;
  const Mr = degreesToRadians(normalizeAngle(M));
  return normalizeAngle(L + 23.440 * Math.sin(Mr) + 2.998 * Math.sin(2 * Mr));
}

function jupiterLongitude(T) {
  const L = 34.351 + 3034.906 * T;
  const M = 20.020 + 3034.906 * T;
  const Mr = degreesToRadians(normalizeAngle(M));
  return normalizeAngle(L + 5.554 * Math.sin(Mr) + 0.168 * Math.sin(2 * Mr));
}

function venusLongitude(T) {
  const L = 181.979 + 58517.816 * T;
  const M = 212.448 + 58517.804 * T;
  const Mr = degreesToRadians(normalizeAngle(M));
  return normalizeAngle(L + 0.741 * Math.sin(Mr) + 0.022 * Math.sin(2 * Mr));
}

function saturnLongitude(T) {
  const L = 50.077 + 1222.114 * T;
  const M = 317.020 + 1222.114 * T;
  const Mr = degreesToRadians(normalizeAngle(M));
  return normalizeAngle(L + 6.406 * Math.sin(Mr) + 0.225 * Math.sin(2 * Mr));
}

function rahuLongitude(T) {
  const N = 125.0445 - 1934.1363 * T + 0.0020762 * T * T;
  return normalizeAngle(N);
}

// ─── LAGNA (ASCENDANT) CALCULATION ──────────────────────────────────────────

export function calculateLagna(julianDay, latitudeDeg, longitudeDeg) {
  const T = (julianDay - 2451545.0) / 36525;
  let GMST = 280.46061837 + 360.98564736629 * (julianDay - 2451545.0)
    + 0.000387933 * T * T - T * T * T / 38710000;
  GMST = normalizeAngle(GMST);
  const LST = normalizeAngle(GMST + longitudeDeg);
  const eps = 23.439291111 - 0.013004167 * T;
  const epsr = degreesToRadians(eps);
  const LSTr = degreesToRadians(LST);
  const latr = degreesToRadians(latitudeDeg);
  const y = -Math.cos(LSTr);
  const x = Math.sin(epsr) * Math.tan(latr) + Math.cos(epsr) * Math.sin(LSTr);
  let asc = radiansToDegrees(Math.atan2(y, x));
  if (asc < 0) asc += 360;
  return normalizeAngle(asc);
}

// ─── APPLY AYANAMSHA ────────────────────────────────────────────────────────

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
  const nakIdx = Math.floor(longitude / 13.3333);
  const pada = Math.floor((longitude % 13.3333) / 3.3333) + 1;
  return {
    name: NAKSHATRAS[nakIdx % 27].name,
    index: nakIdx % 27,
    pada,
    ruler: NAKSHATRAS[nakIdx % 27].ruler,
    degree: longitude % 13.3333,
  };
}

function getPlanetStatus(planet, rasi) {
  const rName = RASIS[rasi];
  if (EXALTATION[planet]?.sign === rName) return 'Exalted';
  if (DEBILITATION[planet]?.sign === rName) return 'Debilitated';
  if (PLANET_RULERS[rName] === planet) return 'Own Sign';
  return 'Neutral';
}

function getHouseNumber(planetRasi, lagnaRasi) {
  return ((planetRasi - lagnaRasi + 12) % 12) + 1;
}

export function calculateKundali(birthDate, birthTime, latitudeDeg, longitudeDeg, timezoneOffset = 0) {
  const [hours, minutes] = (birthTime || '12:00').split(':').map(Number);
  const dt = new Date(birthDate);
  dt.setUTCHours(hours - timezoneOffset, minutes, 0, 0);

  const JD = toJulianDay(dt);
  const T = (JD - 2451545.0) / 36525;
  const ayanamsha = getLahiriAyanamsha(JD);

  const tropicalPositions = {
    Sun: sunLongitude(T),
    Moon: moonLongitude(T),
    Mars: marsLongitude(T),
    Mercury: mercuryLongitude(T),
    Jupiter: jupiterLongitude(T),
    Venus: venusLongitude(T),
    Saturn: saturnLongitude(T),
    Rahu: rahuLongitude(T),
    Ketu: normalizeAngle(rahuLongitude(T) + 180),
  };

  const positions = {};
  for (const [planet, lon] of Object.entries(tropicalPositions)) {
    const sidLon = toSidereal(lon, ayanamsha);
    const rasi = getRasi(sidLon);
    const degInRasi = getDegreeInRasi(sidLon);
    positions[planet] = {
      longitude: sidLon,
      rasi,
      rasiName: RASIS[rasi],
      degreeInRasi: parseFloat(degInRasi.toFixed(2)),
      nakshatra: getNakshatra(sidLon),
      status: getPlanetStatus(planet, rasi),
    };
  }

  const tropicalLagna = calculateLagna(JD, latitudeDeg, longitudeDeg);
  const lagnaLon = toSidereal(tropicalLagna, ayanamsha);
  const lagnaRasi = getRasi(lagnaLon);

  for (const planet of Object.keys(positions)) {
    positions[planet].house = getHouseNumber(positions[planet].rasi, lagnaRasi);
  }

  const houses = Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    rasi: (lagnaRasi + i) % 12,
    rasiName: RASIS[(lagnaRasi + i) % 12],
    significance: HOUSE_SIGNIFICANCE[i],
    planets: Object.entries(positions)
      .filter(([, p]) => p.house === i + 1)
      .map(([name]) => name),
  }));

  return {
    lagna: {
      longitude: lagnaLon,
      rasi: lagnaRasi,
      rasiName: RASIS[lagnaRasi],
      degreeInRasi: parseFloat((lagnaLon % 30).toFixed(2)),
      nakshatra: getNakshatra(lagnaLon),
    },
    planets: positions,
    houses,
    ayanamsha: parseFloat(ayanamsha.toFixed(4)),
    julianDay: JD,
    metadata: {
      birthDate: dt.toISOString(),
      latitude: latitudeDeg,
      longitude: longitudeDeg,
      timezone: timezoneOffset,
    },
  };
}

export default {
  calculateKundali,
  calculateLagna,
  getLahiriAyanamsha,
  getNakshatra,
  getRasi,
  PLANETS,
  RASIS,
  NAKSHATRAS,
  HOUSE_SIGNIFICANCE,
};
