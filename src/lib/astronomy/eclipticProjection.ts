/** Pure geometry and rashi helpers for the Observatory planisphere. */

export const RASHI_NAMES = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
] as const;

export const RASHI_ENGLISH_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export const RASHI_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'] as const;

export const ECLIPTIC_NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

export const NAKSHATRA_NAMES = ECLIPTIC_NAKSHATRAS;
export const RASHI_WIDTH_DEG = 30;
export const NAKSHATRA_WIDTH_DEG = 360 / 27;

export interface EclipticPlotPoint {
  x: number;
  y: number;
  angleDeg: number;
  radius: number;
}

export interface RashiDescriptor {
  index: number;
  name: string;
  englishName: string;
  glyph: string;
  startDeg: number;
  endDeg: number;
}

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function tropicalToSiderealLongitude(tropicalLongitude: number, ayanamsha: number): number {
  return normalizeAngle(tropicalLongitude - ayanamsha);
}

export const tropicalToSidereal = tropicalToSiderealLongitude;

/** Rashi lookup expects a sidereal ecliptic longitude. */
export function getRashiIndex(siderealLongitude: number): number {
  return Math.floor(normalizeAngle(siderealLongitude) / RASHI_WIDTH_DEG);
}

export function getRashiId(siderealLongitude: number): number {
  return getRashiIndex(siderealLongitude) + 1;
}

export function getRashiForLongitude(siderealLongitude: number): RashiDescriptor {
  const index = getRashiIndex(siderealLongitude);
  return {
    index,
    name: RASHI_NAMES[index],
    englishName: RASHI_ENGLISH_NAMES[index],
    glyph: RASHI_GLYPHS[index],
    startDeg: index * RASHI_WIDTH_DEG,
    endDeg: (index + 1) * RASHI_WIDTH_DEG,
  };
}

export const rashiForLongitude = getRashiForLongitude;

export function getNakshatraIndex(siderealLongitude: number): number {
  return Math.floor(normalizeAngle(siderealLongitude) / NAKSHATRA_WIDTH_DEG);
}

export function getNakshatraForLongitude(siderealLongitude: number): {
  index: number;
  name: string;
  startDeg: number;
  endDeg: number;
  pada: number;
} {
  const normalized = normalizeAngle(siderealLongitude);
  const index = getNakshatraIndex(normalized);
  const within = normalized - index * NAKSHATRA_WIDTH_DEG;
  return {
    index,
    name: ECLIPTIC_NAKSHATRAS[index],
    startDeg: index * NAKSHATRA_WIDTH_DEG,
    endDeg: (index + 1) * NAKSHATRA_WIDTH_DEG,
    pada: Math.min(4, Math.floor(within / (NAKSHATRA_WIDTH_DEG / 4)) + 1),
  };
}

export const nakshatraForLongitude = getNakshatraForLongitude;

/**
 * Plot a longitude on a circular planisphere. Longitude zero is at the top,
 * and increasing longitude proceeds clockwise, matching the zodiac's visual
 * reading order.
 */
export function plotEclipticPosition(
  longitudeDeg: number,
  centerX: number,
  centerY: number,
  radius: number,
): EclipticPlotPoint {
  const angleDeg = normalizeAngle(longitudeDeg) - 90;
  const angle = angleDeg * Math.PI / 180;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
    angleDeg: normalizeAngle(longitudeDeg),
    radius,
  };
}

export const eclipticToCanvas = plotEclipticPosition;
export const projectEclipticLongitude = plotEclipticPosition;

export function ringArc(
  startLongitude: number,
  endLongitude: number,
  centerX: number,
  centerY: number,
  radius: number,
  samples = 12,
): EclipticPlotPoint[] {
  const span = endLongitude - startLongitude;
  return Array.from({ length: samples + 1 }, (_, index) =>
    plotEclipticPosition(startLongitude + span * index / samples, centerX, centerY, radius),
  );
}

export function formatDegree(longitude: number): string {
  const normalized = normalizeAngle(longitude);
  const degrees = Math.floor(normalized);
  const minutes = Math.floor((normalized - degrees) * 60);
  return `${String(degrees).padStart(3, '0')}° ${String(minutes).padStart(2, '0')}′`;
}
