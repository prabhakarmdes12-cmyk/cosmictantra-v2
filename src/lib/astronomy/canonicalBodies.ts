/**
 * Lightweight, deterministic solar-system ephemeris used by the Observatory.
 *
 * The visible planets use low-precision Keplerian elements (adequate for a
 * teaching instrument and for deciding a rashi).  The lunar nodes are not
 * physical bodies and therefore are intentionally calculated from the mean
 * ascending-node formula instead of being passed to a planet-only API.
 *
 * Longitudes returned by this module are tropical unless the field name says
 * sidereal.  Sidereal values use the same Chitra Paksha/Lahiri convention as
 * the canonical Kundali engine in src/lib/astrologyEngine.js.
 */

export const CANONICAL_BODY_NAMES = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
] as const;

export type CanonicalBodyName = typeof CANONICAL_BODY_NAMES[number];

export interface EclipticCoordinates {
  longitude: number;
  latitude: number;
  distanceAu: number;
}

export interface EquatorialCoordinates {
  rightAscensionHours: number;
  declinationDeg: number;
}

export interface CanonicalBody {
  body: CanonicalBodyName;
  name: CanonicalBodyName;
  /** Tropical ecliptic longitude, degrees in [0, 360). */
  tropicalLongitude: number;
  /** Sidereal ecliptic longitude, degrees in [0, 360). */
  siderealLongitude: number;
  /** Alias for tropicalLongitude for consumers that use generic longitude. */
  longitude: number;
  tropicalLatitude: number;
  siderealLatitude: number;
  /** Generic aliases for instrument/fixture consumers. */
  latitude: number;
  distanceAu: number;
  rightAscensionHours: number;
  declinationDeg: number;
  ra: number;
  dec: number;
  /** Difference tropical − sidereal, normally the Lahiri ayanamsha. */
  ayanamsha: number;
  isRetrograde: boolean;
  source: 'keplerian' | 'solar' | 'lunar' | 'mean-node';
}

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function toJulianDay(date: Date | number): number {
  const milliseconds = date instanceof Date ? date.getTime() : date;
  return milliseconds / 86400000 + 2440587.5;
}

export function getLahiriAyanamsha(julianDay: number): number {
  const centuries = (julianDay - 2451545.0) / 36525;
  // Keep this identical to the protected engine's approximation.
  return 23.856 + 1.396 * centuries;
}

function asDate(input: Date | number): Date {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid astronomical date');
  return date;
}

function safeBodyName(value: string): CanonicalBodyName {
  const key = value.trim().toLowerCase().replace(/[ _-]+/g, '');
  const aliases: Record<string, CanonicalBodyName> = {
    sun: 'Sun', surya: 'Sun',
    moon: 'Moon', chandra: 'Moon',
    mars: 'Mars', mangal: 'Mars',
    mercury: 'Mercury', budha: 'Mercury',
    jupiter: 'Jupiter', guru: 'Jupiter',
    venus: 'Venus', shukra: 'Venus',
    saturn: 'Saturn', shani: 'Saturn',
    rahu: 'Rahu', ascendingnode: 'Rahu', meanascendingnode: 'Rahu',
    ketu: 'Ketu', descendingnode: 'Ketu', meannode: 'Ketu',
  };
  const body = aliases[key];
  if (!body) throw new RangeError(`Unsupported canonical body: ${value}`);
  return body;
}

interface OrbitalElements {
  N: number;
  Ndot: number;
  i: number;
  idot: number;
  w: number;
  wdot: number;
  a: number;
  e: number;
  edot: number;
  M: number;
  Mdot: number;
}

// Paul Schlyter-style elements, days from 2000 Jan 0.0.  These compact
// elements are stable over the modern era and make the demo deterministic.
const ELEMENTS: Record<'Earth' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn', OrbitalElements> = {
  Earth:    { N: 0, Ndot: 0, i: 0, idot: 0, w: 282.9404, wdot: 4.70935e-5, a: 1, e: 0.016709, edot: -1.151e-9, M: 356.0470, Mdot: 0.9856002585 },
  Mercury: { N: 48.3313, Ndot: 3.24587e-5, i: 7.0047, idot: 5.00e-8, w: 29.1241, wdot: 1.01444e-5, a: 0.387098, e: 0.205635, edot: 5.59e-10, M: 168.6562, Mdot: 4.0923344368 },
  Venus:   { N: 76.6799, Ndot: 2.46590e-5, i: 3.3946, idot: 2.75e-8, w: 54.8910, wdot: 1.38374e-5, a: 0.723330, e: 0.006773, edot: -1.302e-9, M: 48.0052, Mdot: 1.6021302244 },
  Mars:    { N: 49.5574, Ndot: 2.11081e-5, i: 1.8497, idot: -1.78e-8, w: 286.5016, wdot: 2.92961e-5, a: 1.523688, e: 0.093405, edot: 2.516e-9, M: 18.6021, Mdot: 0.5240207766 },
  Jupiter: { N: 100.4542, Ndot: 2.76854e-5, i: 1.3030, idot: -1.557e-7, w: 273.8777, wdot: 1.64505e-5, a: 5.20256, e: 0.048498, edot: 4.469e-9, M: 19.8950, Mdot: 0.0830853001 },
  Saturn:  { N: 113.6634, Ndot: 2.38980e-5, i: 2.4886, idot: -1.081e-7, w: 339.3939, wdot: 2.97661e-5, a: 9.55475, e: 0.055546, edot: -9.499e-9, M: 316.9670, Mdot: 0.0334442282 },
};

interface Vector3 { x: number; y: number; z: number; }

function solveKepler(meanAnomalyDeg: number, eccentricity: number): number {
  const mean = normalizeAngle(meanAnomalyDeg) * DEG;
  let eccentric = mean + eccentricity * Math.sin(mean) * (1 + eccentricity * Math.cos(mean));
  for (let i = 0; i < 8; i += 1) {
    eccentric -= (eccentric - eccentricity * Math.sin(eccentric) - mean) / (1 - eccentricity * Math.cos(eccentric));
  }
  return eccentric;
}

function heliocentricPosition(body: keyof typeof ELEMENTS, days: number): Vector3 {
  const e = ELEMENTS[body];
  const N = (e.N + e.Ndot * days) * DEG;
  const i = (e.i + e.idot * days) * DEG;
  const w = (e.w + e.wdot * days) * DEG;
  const eccentricity = e.e + e.edot * days;
  const eccentricAnomaly = solveKepler(e.M + e.Mdot * days, eccentricity);

  const xv = e.a * (Math.cos(eccentricAnomaly) - eccentricity);
  const yv = e.a * Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity)) * Math.sin(eccentricAnomaly);
  const v = Math.atan2(yv, xv);
  const r = Math.hypot(xv, yv);
  const argument = v + w;

  return {
    x: r * (Math.cos(N) * Math.cos(argument) - Math.sin(N) * Math.sin(argument) * Math.cos(i)),
    y: r * (Math.sin(N) * Math.cos(argument) + Math.cos(N) * Math.sin(argument) * Math.cos(i)),
    z: r * Math.sin(argument) * Math.sin(i),
  };
}

function vectorToEcliptic(vector: Vector3): EclipticCoordinates {
  return {
    longitude: normalizeAngle(Math.atan2(vector.y, vector.x) * RAD),
    latitude: Math.atan2(vector.z, Math.hypot(vector.x, vector.y)) * RAD,
    distanceAu: Math.hypot(vector.x, vector.y, vector.z),
  };
}

function solarCoordinates(days: number): EclipticCoordinates {
  const meanAnomaly = normalizeAngle(357.529 + 0.98560028 * days);
  const meanLongitude = 280.459 + 0.98564736 * days;
  const longitude = normalizeAngle(
    meanLongitude + 1.915 * Math.sin(meanAnomaly * DEG) + 0.020 * Math.sin(2 * meanAnomaly * DEG),
  );
  const earth = heliocentricPosition('Earth', days);
  return { longitude, latitude: 0, distanceAu: Math.hypot(earth.x, earth.y, earth.z) };
}

function lunarCoordinates(days: number): EclipticCoordinates {
  const meanLongitude = normalizeAngle(218.316 + 13.176396 * days);
  const meanAnomaly = normalizeAngle(134.963 + 13.064993 * days);
  const solarAnomaly = normalizeAngle(357.529 + 0.98560028 * days);
  const elongation = normalizeAngle(297.850 + 12.190749 * days);
  const argumentLatitude = normalizeAngle(93.272 + 13.229350 * days);

  // The largest periodic terms provide a useful visual Moon and deliberately
  // match the approximation used by the Panchang engine.
  const longitude = normalizeAngle(
    meanLongitude
      + 6.289 * Math.sin(meanAnomaly * DEG)
      + 1.274 * Math.sin((2 * elongation - meanAnomaly) * DEG)
      + 0.658 * Math.sin(2 * elongation * DEG)
      - 0.214 * Math.sin(2 * meanAnomaly * DEG)
      - 0.110 * Math.sin(solarAnomaly * DEG),
  );
  const latitude =
    5.128 * Math.sin(argumentLatitude * DEG)
    + 0.280 * Math.sin((meanAnomaly + argumentLatitude) * DEG)
    + 0.277 * Math.sin((meanAnomaly - argumentLatitude) * DEG)
    + 0.173 * Math.sin((2 * elongation - argumentLatitude) * DEG);
  return { longitude, latitude, distanceAu: 0.00257 };
}

function eclipticToEquatorial(ecliptic: EclipticCoordinates, obliquityDeg: number): EquatorialCoordinates {
  const lambda = ecliptic.longitude * DEG;
  const beta = ecliptic.latitude * DEG;
  const epsilon = obliquityDeg * DEG;
  const x = Math.cos(beta) * Math.cos(lambda);
  const y = Math.cos(beta) * Math.sin(lambda) * Math.cos(epsilon) - Math.sin(beta) * Math.sin(epsilon);
  const z = Math.cos(beta) * Math.sin(lambda) * Math.sin(epsilon) + Math.sin(beta) * Math.cos(epsilon);
  return {
    rightAscensionHours: normalizeAngle(Math.atan2(y, x) * RAD) / 15,
    declinationDeg: Math.asin(Math.max(-1, Math.min(1, z))) * RAD,
  };
}

function obliquity(julianDay: number): number {
  const centuries = (julianDay - 2451545.0) / 36525;
  return 23.439291 - 0.0130042 * centuries;
}

function meanNodeLongitude(days: number): number {
  // Mean tropical longitude of the ascending lunar node.  This is the
  // explicit Rahu/Ketu path: astronomy libraries model planets, not nodes.
  return normalizeAngle(125.04452 - 0.0529538083 * days);
}

function eclipticForBody(body: CanonicalBodyName, days: number): { coordinates: EclipticCoordinates; source: CanonicalBody['source'] } {
  if (body === 'Sun') return { coordinates: solarCoordinates(days), source: 'solar' };
  if (body === 'Moon') return { coordinates: lunarCoordinates(days), source: 'lunar' };
  if (body === 'Rahu') return { coordinates: { longitude: meanNodeLongitude(days), latitude: 0, distanceAu: 0 }, source: 'mean-node' };
  if (body === 'Ketu') return { coordinates: { longitude: normalizeAngle(meanNodeLongitude(days) + 180), latitude: 0, distanceAu: 0 }, source: 'mean-node' };

  const planet = heliocentricPosition(body, days);
  const earth = heliocentricPosition('Earth', days);
  return { coordinates: vectorToEcliptic({ x: planet.x - earth.x, y: planet.y - earth.y, z: planet.z - earth.z }), source: 'keplerian' };
}

function longitudeAt(body: CanonicalBodyName, date: Date): number {
  const days = toJulianDay(date) - 2451543.5;
  return eclipticForBody(body, days).coordinates.longitude;
}

function isRetrograde(body: CanonicalBodyName, date: Date): boolean {
  if (body === 'Rahu' || body === 'Ketu') return true;
  if (body === 'Sun' || body === 'Moon') return false;
  const before = longitudeAt(body, new Date(date.getTime() - 86400000));
  const after = longitudeAt(body, new Date(date.getTime() + 86400000));
  const delta = normalizeAngle(after - before);
  return delta > 180;
}

/**
 * Calculate one canonical body. The object/date argument form is accepted as
 * a convenience for tests and callers that keep instrument state together.
 */
export function calculateCanonicalBody(
  body: CanonicalBodyName | string,
  date?: Date | number,
): CanonicalBody;
export function calculateCanonicalBody(
  input: { body: CanonicalBodyName | string; date?: Date | number },
): CanonicalBody;
export function calculateCanonicalBody(
  bodyOrInput: CanonicalBodyName | string | { body: CanonicalBodyName | string; date?: Date | number },
  dateInput: Date | number = new Date(),
): CanonicalBody {
  const input = typeof bodyOrInput === 'object' ? bodyOrInput : null;
  const body = safeBodyName(input ? input.body : bodyOrInput as string);
  const date = asDate(input?.date ?? dateInput);
  const julianDay = toJulianDay(date);
  const days = julianDay - 2451543.5;
  const { coordinates, source } = eclipticForBody(body, days);
  const sidereal = normalizeAngle(coordinates.longitude - getLahiriAyanamsha(julianDay));
  const equatorial = eclipticToEquatorial(coordinates, obliquity(julianDay));

  return {
    body,
    name: body,
    tropicalLongitude: coordinates.longitude,
    siderealLongitude: sidereal,
    longitude: coordinates.longitude,
    tropicalLatitude: coordinates.latitude,
    siderealLatitude: coordinates.latitude,
    latitude: coordinates.latitude,
    distanceAu: coordinates.distanceAu,
    rightAscensionHours: equatorial.rightAscensionHours,
    declinationDeg: equatorial.declinationDeg,
    ra: equatorial.rightAscensionHours,
    dec: equatorial.declinationDeg,
    ayanamsha: normalizeAngle(coordinates.longitude - sidereal),
    isRetrograde: isRetrograde(body, date),
    source,
  };
}

export function calculateCanonicalBodies(date: Date | number = new Date()): CanonicalBody[] {
  return CANONICAL_BODY_NAMES.map(body => calculateCanonicalBody(body, date));
}

export function tropicalToSidereal(longitude: number, date: Date | number = new Date()): number {
  return normalizeAngle(longitude - getLahiriAyanamsha(toJulianDay(asDate(date))));
}

export default {
  CANONICAL_BODY_NAMES,
  calculateCanonicalBody,
  calculateCanonicalBodies,
  getLahiriAyanamsha,
  normalizeAngle,
  toJulianDay,
  tropicalToSidereal,
};
