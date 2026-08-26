/**
 * Coordinate transforms for the Observatory's local sky view.
 *
 * Pipeline: J2000 equatorial coordinates → of-date equatorial coordinates →
 * horizontal coordinates for the observer → stereographic canvas coordinates.
 */

import type { StarRecord } from './stars';

export interface ObserverLocation {
  latitude: number;
  longitude: number;
}

export interface EquatorialCoordinate {
  raHours: number;
  decDeg: number;
}

export interface HorizontalCoordinate {
  altitudeDeg: number;
  azimuthDeg: number;
}

export interface CanvasSkyPoint extends HorizontalCoordinate {
  x: number;
  y: number;
  radius: number;
  visible: boolean;
}

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function normalizeDegrees(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function normalizeHours(hours: number): number {
  return ((hours % 24) + 24) % 24;
}

function julianDay(value: Date | number): number {
  const milliseconds = value instanceof Date ? value.getTime() : value;
  return milliseconds / 86400000 + 2440587.5;
}

/** Greenwich mean sidereal time, in decimal hours (not degrees). */
export function greenwichSiderealTime(value: Date | number): number {
  const jd = julianDay(value);
  const centuries = (jd - 2451545.0) / 36525;
  const theta =
    280.46061837
    + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * centuries * centuries
    - (centuries * centuries * centuries) / 38710000;
  return normalizeHours(theta / 15);
}

/** Local mean sidereal time, in decimal hours. */
export function localSiderealTime(value: Date | number, longitudeDeg = 0): number {
  return normalizeHours(greenwichSiderealTime(value) + longitudeDeg / 15);
}

/**
 * Astronomy-engine uses this spelling. Keeping it explicit here prevents the
 * common hours-versus-degrees mistake when wiring the canvas.
 */
export function SiderealTime(value: Date | number): number {
  return greenwichSiderealTime(value);
}

export const siderealTime = localSiderealTime;

/** Precess a J2000 equatorial coordinate to the requested date. */
export function j2000ToOfDate(raHours: number, decDeg: number, value: Date | number): EquatorialCoordinate {
  const t = (julianDay(value) - 2451545.0) / 36525;
  const ra = raHours * 15 * DEG;
  const dec = decDeg * DEG;
  const zeta = (2306.2181 * t + 0.30188 * t * t + 0.017998 * t * t * t) / 3600 * DEG;
  const z = (2306.2181 * t + 1.09468 * t * t + 0.018203 * t * t * t) / 3600 * DEG;
  const theta = (2004.3109 * t - 0.42665 * t * t - 0.041833 * t * t * t) / 3600 * DEG;

  const a = Math.cos(dec) * Math.sin(ra + zeta);
  const b = Math.cos(theta) * Math.cos(dec) * Math.cos(ra + zeta) - Math.sin(theta) * Math.sin(dec);
  const c = Math.sin(theta) * Math.cos(dec) * Math.cos(ra + zeta) + Math.cos(theta) * Math.sin(dec);

  return {
    raHours: normalizeDegrees((Math.atan2(a, b) + z) * RAD) / 15,
    decDeg: Math.asin(Math.max(-1, Math.min(1, c))) * RAD,
  };
}

export const precessJ2000 = j2000ToOfDate;

/** Ecliptic longitude/latitude of-date converted to equatorial coordinates. */
export function eclipticToEquatorial(longitudeDeg: number, latitudeDeg = 0, obliquityDeg = 23.4393): EquatorialCoordinate {
  const lambda = longitudeDeg * DEG;
  const beta = latitudeDeg * DEG;
  const epsilon = obliquityDeg * DEG;
  const x = Math.cos(beta) * Math.cos(lambda);
  const y = Math.cos(beta) * Math.sin(lambda) * Math.cos(epsilon) - Math.sin(beta) * Math.sin(epsilon);
  const z = Math.cos(beta) * Math.sin(lambda) * Math.sin(epsilon) + Math.sin(beta) * Math.cos(epsilon);
  return {
    raHours: normalizeDegrees(Math.atan2(y, x) * RAD) / 15,
    decDeg: Math.asin(Math.max(-1, Math.min(1, z))) * RAD,
  };
}

/** Convert an equatorial coordinate to altitude and azimuth. */
export function equatorialToHorizontal(
  equatorial: EquatorialCoordinate,
  value: Date | number,
  observer: ObserverLocation,
): HorizontalCoordinate;
export function equatorialToHorizontal(
  raHours: number,
  decDeg: number,
  value: Date | number,
  latitudeDeg: number,
  longitudeDeg: number,
  epoch?: 'J2000' | 'of-date',
): HorizontalCoordinate;
export function equatorialToHorizontal(
  first: EquatorialCoordinate | number,
  second: Date | number,
  third: ObserverLocation | Date | number,
  fourth?: number,
  fifth?: number,
  epoch: 'J2000' | 'of-date' = 'of-date',
): HorizontalCoordinate {
  let raHours: number;
  let decDeg: number;
  let value: Date | number;
  let observer: ObserverLocation;

  if (typeof first === 'number') {
    raHours = first;
    decDeg = second as number;
    value = third as Date | number;
    observer = { latitude: fourth as number, longitude: fifth as number };
  } else {
    raHours = first.raHours;
    decDeg = first.decDeg;
    value = second;
    observer = third as ObserverLocation;
  }

  const coordinate = epoch === 'J2000' ? j2000ToOfDate(raHours, decDeg, value) : { raHours, decDeg };
  const latitude = observer.latitude * DEG;
  const declination = coordinate.decDeg * DEG;
  const hourAngle = (localSiderealTime(value, observer.longitude) - coordinate.raHours) * 15 * DEG;

  const sinAltitude =
    Math.sin(latitude) * Math.sin(declination)
    + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));

  // Azimuth is measured clockwise from true north: N=0°, E=90°.
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitude) - Math.tan(declination) * Math.cos(latitude),
  );

  return {
    altitudeDeg: altitude * RAD,
    azimuthDeg: normalizeDegrees(azimuth * RAD + 180),
  };
}

/**
 * Project a horizontal coordinate through a zenith-centred stereographic
 * projection. The visible horizon is the outer circle; below-horizon points
 * are returned with visible=false so callers can decide whether to clip them.
 */
export function horizontalToStereographic(
  horizontal: HorizontalCoordinate,
  width: number,
  height: number,
  padding = 18,
): CanvasSkyPoint {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(1, Math.min(width, height) / 2 - padding);
  const altitude = horizontal.altitudeDeg * DEG;
  const azimuth = horizontal.azimuthDeg * DEG;
  const denominator = 1 + Math.sin(altitude);
  const projectedRadius = denominator <= 1e-8 ? radius * 2 : radius * Math.cos(altitude) / denominator;

  return {
    ...horizontal,
    x: cx + projectedRadius * Math.sin(azimuth),
    y: cy - projectedRadius * Math.cos(azimuth),
    radius: projectedRadius,
    visible: horizontal.altitudeDeg >= -0.5,
  };
}

export const projectStereographic = horizontalToStereographic;

export function projectEquatorial(
  equatorial: EquatorialCoordinate,
  value: Date | number,
  observer: ObserverLocation,
  width: number,
  height: number,
  epoch: 'J2000' | 'of-date' = 'of-date',
): CanvasSkyPoint {
  return horizontalToStereographic(
    equatorialToHorizontal(equatorial.raHours, equatorial.decDeg, value, observer.latitude, observer.longitude, epoch),
    width,
    height,
  );
}

export function projectStar(
  star: StarRecord,
  value: Date | number,
  observer: ObserverLocation,
  width: number,
  height: number,
): CanvasSkyPoint {
  return projectEquatorial(
    { raHours: star.raHours, decDeg: star.decDeg },
    value,
    observer,
    width,
    height,
    'J2000',
  );
}

export function projectEclipticLongitude(
  longitudeDeg: number,
  value: Date | number,
  observer: ObserverLocation,
  width: number,
  height: number,
  latitudeDeg = 0,
): CanvasSkyPoint {
  const jd = julianDay(value);
  const centuries = (jd - 2451545.0) / 36525;
  const epsilon = 23.439291 - 0.0130042 * centuries;
  return projectEquatorial(
    eclipticToEquatorial(longitudeDeg, latitudeDeg, epsilon),
    value,
    observer,
    width,
    height,
    'of-date',
  );
}

export function altitudeRingPoints(
  altitudeDeg: number,
  value: Date | number,
  observer: ObserverLocation,
  width: number,
  height: number,
  samples = 72,
): CanvasSkyPoint[] {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const azimuth = index * 360 / samples;
    return horizontalToStereographic({ altitudeDeg, azimuthDeg: azimuth }, width, height);
  });
}

export function cardinalDirectionPoints(width: number, height: number, padding = 18): Record<'N' | 'E' | 'S' | 'W', { x: number; y: number }> {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(1, Math.min(width, height) / 2 - padding);
  return {
    N: { x: cx, y: cy - radius - 8 },
    E: { x: cx + radius + 8, y: cy },
    S: { x: cx, y: cy + radius + 8 },
    W: { x: cx - radius - 8, y: cy },
  };
}
