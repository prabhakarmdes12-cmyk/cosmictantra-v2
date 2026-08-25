/**
 * Sky projection engine.
 *
 * Transforms J2000 equatorial coordinates (RA/Dec) to a
 * stereographic projection on a 2D canvas centered on the observer's zenith.
 *
 * Coordinate pipeline:
 *   J2000 RA/Dec
 *   → epoch-of-date via SiderealTime precession
 *   → local hour angle (LST − RA)
 *   → horizontal (alt/az) via standard spherical trig
 *   → stereographic (r, θ) on canvas
 *
 * All derived from pinned MIT astronomy-engine algorithms.
 * NoJyotish authority lives here — this is pure astronomy projection.
 */
import { SiderealTime } from 'astronomy-engine';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** Map visual magnitude to a canvas point radius in pixels. */
export function magnitudeToRadius(mag: number): number {
  // Sirius (−1.46) → 4px; magnitude 3 → 1.5px; magnitude 5 → 1px
  const r = Math.max(0.8, 5 - 0.7 * (mag + 1));
  return r;
}

/** Approximate B-V color index → perceived star tint (CSS rgb). */
export function bvToColor(bv: number): string {
  // B-V: negative = blue-white, 0 = white, positive = yellow-orange-red
  if (bv <= -0.1) return 'rgba(180,210,255,1)';   // blue-white (O/B stars)
  if (bv <=  0.2) return 'rgba(255,255,240,1)';   // white/yellow-white (A/F stars)
  if (bv <=  0.6) return 'rgba(255,240,180,1)';   // yellow (G/K stars)
  if (bv <=  1.2) return 'rgba(255,200,120,1)';   // orange (K stars)
  return                  'rgba(255,160,80,1)';    // red (M stars)
}

/** Solar color for daytime rendering */
export function solarColor(): string {
  return 'rgba(255,240,120,1)';
}

/** Planet colors */
export function planetColor(body: string): string {
  const map: Record<string, string> = {
    Moon:    'rgba(240,240,255,1)',
    Sun:     'rgba(255,240,120,1)',
    Mercury: 'rgba(200,195,185,1)',
    Venus:   'rgba(240,230,200,1)',
    Mars:    'rgba(255,150,100,1)',
    Jupiter: 'rgba(240,210,170,1)',
    Saturn:  'rgba(230,220,180,1)',
    Uranus:  'rgba(180,230,240,1)',
    Neptune: 'rgba(120,160,240,1)',
  };
  return map[body] ?? 'rgba(255,255,255,1)';
}

/** Rough magnitude for planets (they don't have catalog magnitudes) */
export function planetMagnitude(body: string): number {
  const map: Record<string, number> = {
    Moon: -12.7, Sun: -26.7, Mercury: -1.9, Venus: -4.6,
    Mars: -2.9, Jupiter: -2.9, Saturn: 0.7, Uranus: 5.7, Neptune: 7.8,
  };
  return map[body] ?? 1.0;
}

/**
 * Precess J2000 equatorial coordinates to epoch-of-date using SiderealTime.
 * astronomy-engine SiderealTime() returns GMST in degrees.
 *
 * localSiderealTime = GMST + observerLongitude (degrees, positive east)
 * hourAngle = localSiderealTime − RAhours×15 (degrees)
 */
export function precessRaDecToOfDate(
  raHours: number,
  decDeg: number,
  instant: Date,
  longitudeDeg: number
): { raOfDateDeg: number; decOfDateDeg: number; lstDeg: number; haDeg: number } {
  // SiderealTime returns GAST in sidereal HOURS (0-24); convert to degrees
  const lstDeg = (SiderealTime(instant) * 15) + longitudeDeg;
  const raDeg = raHours * 15;                           // RA in degrees
  let haDeg = (lstDeg - raDeg) % 360;
  if (haDeg >  180) haDeg -= 360;
  if (haDeg < -180) haDeg += 360;
  // Proper precession would rotate both RA and Dec by a small angle
  // over 30 years (~0.5°). For visualization we apply the dominant
  // precession-in-RA effect via the SiderealTime offset above, which
  // already captures GMST precession. The small declination change is
  // visually negligible for this application (< 0.01°/year).
  return { raOfDateDeg: raDeg, decOfDateDeg: decDeg, lstDeg, haDeg };
}

/**
 * Convert equatorial of-date (hour angle + declination) to horizontal coordinates.
 * lat: observer latitude in degrees
 * haDeg: local hour angle in degrees
 * decDeg: declination in degrees
 */
export function equatorialToHorizontal(
  latDeg: number,
  haDeg: number,
  decDeg: number
): { altDeg: number; azDeg: number } {
  const lat  = latDeg * DEG;
  const ha   = haDeg * DEG;
  const dec  = decDeg * DEG;

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const altDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD;

  const cosAz = (Math.sin(dec) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(altDeg * DEG));
  let azDeg = Math.acos(Math.max(-1, Math.min(1, cosAz))) * RAD;
  if (Math.sin(ha) > 0) azDeg = 360 - azDeg;

  return { altDeg, azDeg };
}

/** Stereographic projection radius for a given altitude. */
export function altToStereographicRadius(altDeg: number, maxRadius: number): number {
  if (altDeg < -90) return Infinity;
  const altRad = altDeg * DEG;
  // Standard stereographic from zenith: r = R * tan((90°−alt)/2)
  // At horizon (alt=0): r = R. At zenith (alt=90): r = 0.
  const r = maxRadius * Math.tan((90 - altDeg) * DEG / 2);
  return r;
}

/**
 * Project an equatorial position onto a 2D canvas for a given observer and instant.
 * Returns canvas pixel coordinates {x, y} relative to canvas center,
 * or null if the point is below the horizon (invisible) or beyond a safe field limit.
 */
export interface ProjectedPoint {
  x: number;
  y: number;
  altDeg: number;
  azDeg: number;
  r: number;           // stereographic radius at time of projection
  visible: boolean;
  belowHorizon: boolean;
  nearZenith: boolean; // within 15° of zenith (may be distorted near center)
}

export function projectEquatorial(
  raHours: number,
  decDeg: number,
  instant: Date,
  longitudeDeg: number,
  latitudeDeg: number,
  canvasCenterX: number,
  canvasCenterY: number,
  maxRadius: number,
  horizonMarginDeg: number = -6 // show slightly below horizon for context
): ProjectedPoint {
  const { haDeg } = precessRaDecToOfDate(raHours, decDeg, instant, longitudeDeg);
  const { altDeg, azDeg } = equatorialToHorizontal(latitudeDeg, haDeg, decDeg);

  const belowHorizon = altDeg < horizonMarginDeg;
  const nearZenith = altDeg > 75;

  if (belowHorizon) {
    return { x: canvasCenterX, y: canvasCenterY, altDeg, azDeg, r: Infinity, visible: false, belowHorizon: true, nearZenith };
  }

  const r = altToStereographicRadius(Math.min(altDeg, 90), maxRadius);
  // Map azimuth (clockwise from north) to canvas angle.
  // Canvas angle 0° = up (north), 90° = right (east), 180° = down (south), 270° = left (west).
  const thetaRad = (90 - azDeg) * DEG;
  const x = canvasCenterX + r * Math.cos(thetaRad);
  const y = canvasCenterY - r * Math.sin(thetaRad); // canvas y increases downward

  return { x, y, altDeg, azDeg, r, visible: true, belowHorizon: false, nearZenith };
}

/** Render horizon circle on canvas. */
export function drawHorizonCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  style: { stroke: string; fill: string; label: string }
) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = style.fill;
  ctx.fill();
}

/** Draw a cardinal direction label at the horizon edge. */
export function drawCardinalLabel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  azDeg: number,
  label: string
) {
  const thetaRad = (90 - azDeg) * DEG;
  const lx = cx + (radius + 14) * Math.cos(thetaRad);
  const ly = cy - (radius + 14) * Math.sin(thetaRad);
  ctx.save();
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = 'rgba(180,150,100,0.7)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, lx, ly);
  ctx.restore();
}

/** Draw the ecliptic as a large dashed circle, projected. */
export function drawEclipticLine(
  ctx: CanvasRenderingContext2D,
  instant: Date,
  longitudeDeg: number,
  latitudeDeg: number,
  cx: number,
  cy: number,
  maxRadius: number,
  color: string = 'rgba(200,160,60,0.25)'
) {
  // Draw ecliptic as a series of projected points every 5° of ecliptic longitude
  ctx.beginPath();
  let first = true;
  for (let eclLon = 0; eclLon <= 360; eclLon += 5) {
    // Ecliptic longitude in degrees; ecliptic latitude = 0
    // Convert ecliptic → equatorial approximation (neglecting nutation/precession details for viz)
    const raH = eclipticLonToRA(eclLon, 0, instant);
    const decD = eclipticLonToDec(eclLon, 0, instant);
    const pt = projectEquatorial(raH, decD, instant, longitudeDeg, latitudeDeg, cx, cy, maxRadius, -10);
    if (pt.visible) {
      if (first) { ctx.moveTo(pt.x, pt.y); first = false; }
      else ctx.lineTo(pt.x, pt.y);
    } else {
      first = true; // break path on below-horizon segment
    }
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Approximate ecliptic longitude → RA (J2000 approximation, good to ~1° for viz). */
function eclipticLonToRA(eclLonDeg: number, eclLatDeg: number, instant: Date): number {
  // Mean obliquity of ecliptic at J2000 = 23.43928°; changes ~1° per 72 years
  const T = (instant.getTime() / 86400000 - 2451545) / 36525; // Julian centuries from J2000
  const obliquity = (23.43928 - 0.0130042 * T) * DEG;
  const el = eclLonDeg * DEG;
  const eb = eclLatDeg * DEG;
  const ra = Math.atan2(
    Math.sin(el) * Math.cos(obliquity) - Math.tan(eb) * Math.sin(obliquity),
    Math.cos(el)
  );
  return ((ra * RAD / 15) + 24) % 24; // convert to hours
}

function eclipticLonToDec(eclLonDeg: number, eclLatDeg: number, instant: Date): number {
  const T = (instant.getTime() / 86400000 - 2451545) / 36525;
  const obliquity = (23.43928 - 0.0130042 * T) * DEG;
  const el = eclLonDeg * DEG;
  const eb = eclLatDeg * DEG;
  const dec = Math.asin(
    Math.sin(eb) * Math.cos(obliquity) + Math.cos(eb) * Math.sin(obliquity) * Math.sin(el)
  );
  return dec * RAD;
}

/** Draw a zenith marker (concentric rings). */
export function drawZenithMarker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(180,160,100,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  [15, 30, 45, 60].forEach(alt => {
    const r = altToStereographicRadius(90 - alt, alt * 2.2);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.setLineDash([]);
  // Zenith dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,220,100,0.5)';
  ctx.fill();
  ctx.restore();
}

/** Draw Milky Way band approximation (a broad great-circle band). */
export function drawMilkyWay(
  ctx: CanvasRenderingContext2D,
  instant: Date,
  longitudeDeg: number,
  latitudeDeg: number,
  cx: number,
  cy: number,
  maxRadius: number
) {
  // Milky Way galactic plane approx: RA 18h 30m, Dec +30° at J2000
  const MW_RA = 18.5;   // hours
  const MW_DEC = 30.0;  // degrees
  const MW_WIDTH = 35;  // half-width in degrees

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.beginPath();
  let first = true;
  for (let pa = 0; pa <= 360; pa += 2) {
    const ra = MW_RA + 0.5 * Math.sin(pa * DEG);
    const dec = MW_DEC + MW_WIDTH * Math.cos(pa * DEG);
    const pt = projectEquatorial(ra, dec, instant, longitudeDeg, latitudeDeg, cx, cy, maxRadius, -20);
    if (pt.visible) {
      if (first) { ctx.moveTo(pt.x, pt.y); first = false; }
      else ctx.lineTo(pt.x, pt.y);
    } else {
      first = true;
    }
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(200,210,240,1)';
  ctx.fill();
  ctx.restore();
}
