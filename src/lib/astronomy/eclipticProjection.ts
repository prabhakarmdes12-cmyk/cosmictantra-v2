/**
 * Ecliptic planisphere projection.
 *
 * Top-down view of the ecliptic circle — the plane of Earth's orbit
 * as seen from above the North Ecliptic Pole.
 *
 * Aries (0°) is at the top. Degrees increase clockwise.
 * This is a standard Jyotish convention for rashi diagrams.
 *
 * Pipeline:
 *   astronomy-engine → tropical ecliptic longitude (Ecliptic())
 *   → plotted on 360° circle by tropical longitude
 *
 * Separately, canonical engine → sidereal (Lahiri) longitude → rashi/nakshatra
 * displayed as labeled ring, NOT computed by this module.
 *
 * No Jyotish authority lives here — pure astronomy visualization.
 */

import { Body, Ecliptic, GeoVector } from 'astronomy-engine';

export type EclipticBody = 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn';

const BODY_MAP: Record<EclipticBody, Body> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
};

/** Tropical ecliptic longitude of a body at a given instant (0–360°). */
export function tropicalLongitude(body: EclipticBody, instant: Date): number {
  const engineBody = BODY_MAP[body];
  if (!engineBody) return 0;
  const vec = Ecliptic(GeoVector(engineBody, instant, true));
  // Normalize to [0, 360)
  return ((vec.elon % 360) + 360) % 360;
}

/** Convert degrees to radians */
const DEG = Math.PI / 180;

/**
 * Plot a body on the ecliptic circle.
 * Returns {x, y} in canvas pixels where the circle center is (cx, cy)
 * and maxRadius is the outer edge of the ecliptic ring.
 *
 * Aries (0°) = top (θ = -90° in canvas terms).
 * Degrees increase clockwise.
 */
export function plotOnEclipticCircle(
  tropicalDeg: number,
  cx: number,
  cy: number,
  maxRadius: number
): { x: number; y: number } {
  // Aries (0°) at top: θ = -π/2
  // 90° (Cancer) at right: θ = 0
  // 180° (Libra) at bottom: θ = π/2
  // 270° (Capricorn) at left: θ = π
  const theta = (tropicalDeg - 90) * DEG;
  const x = cx + maxRadius * Math.cos(theta);
  const y = cy + maxRadius * Math.sin(theta);
  return { x, y };
}

/** Labels for the 12 rashi signs at their starting longitudes (tropical) */
export const RASHI_LABELS: { name: string; english: string; startDeg: number; glyph: string }[] = [
  { name: 'Aries',       english: 'Mesh',      startDeg:   0, glyph: '♈' },
  { name: 'Taurus',      english: 'Vrishabha', startDeg:  30, glyph: '♉' },
  { name: 'Gemini',      english: 'Mithuna',    startDeg:  60, glyph: '♊' },
  { name: 'Cancer',      english: 'Karka',      startDeg:  90, glyph: '♋' },
  { name: 'Leo',         english: 'Simha',      startDeg: 120, glyph: '♌' },
  { name: 'Virgo',       english: 'Kanya',      startDeg: 150, glyph: '♍' },
  { name: 'Libra',       english: 'Tula',        startDeg: 180, glyph: '♎' },
  { name: 'Scorpio',     english: 'Vrishchika', startDeg: 210, glyph: '♏' },
  { name: 'Sagittarius', english: 'Dhanu',       startDeg: 240, glyph: '♐' },
  { name: 'Capricorn',   english: 'Makara',      startDeg: 270, glyph: '♑' },
  { name: 'Aquarius',    english: 'Kumbha',      startDeg: 300, glyph: '♒' },
  { name: 'Pisces',      english: 'Meena',       startDeg: 330, glyph: '♓' },
];

/** Rashi start angle for a given tropical longitude */
export function rashiForLongitude(tropicalDeg: number): string {
  const idx = Math.floor(tropicalDeg / 30) % 12;
  return RASHI_LABELS[idx].name;
}

export function degreeInRashi(tropicalDeg: number): number {
  return tropicalDeg % 30;
}

/** Draw rashi ring segments on canvas */
export function drawRashiRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number
) {
  RASHI_LABELS.forEach((rashi, i) => {
    const startAngle = (rashi.startDeg - 90) * DEG;
    const endAngle = ((rashi.startDeg + 30) - 90) * DEG;
    const largeArc = 15 > 180 ? 1 : 0; // always 0 since each is 30°

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();

    // Alternating fill
    ctx.fillStyle = i % 2 === 0 ? 'rgba(30,25,12,0.55)' : 'rgba(15,20,30,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,140,60,0.22)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });
}

/** Draw rashi labels around the ring */
export function drawRashiLabels(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  labelR: number
) {
  RASHI_LABELS.forEach((rashi) => {
    const theta = (rashi.startDeg + 15 - 90) * DEG;
    const x = cx + labelR * Math.cos(theta);
    const y = cy + labelR * Math.sin(theta);

    ctx.save();
    ctx.font = 'bold 14px serif';
    ctx.fillStyle = 'rgba(220,200,140,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rashi.glyph, x, y);
    ctx.restore();
  });
}

/** Draw 27 Nakshatra divisions as a subtle inner ring */
export function drawNakshatraRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number
) {
  const NAKSHATRAS_PER_RASHI = 9 / 3; // 9 nakshatras per rashi, 3 nakshatras each = 27 total
  for (let i = 0; i < 27; i++) {
    const startDeg = i * (360 / 27);
    const endDeg = (i + 1) * (360 / 27);
    const a1 = (startDeg - 90) * DEG;
    const a2 = (endDeg - 90) * DEG;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, a1, a2);
    ctx.arc(cx, cy, innerR, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = i % 3 === 0 ? 'rgba(180,140,60,0.06)' : 'rgba(0,0,0,0)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,140,60,0.1)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

/** Draw the outer ecliptic ring */
export function drawEclipticRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(220,180,80,0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tick marks every 10°
  for (let d = 0; d < 360; d += 10) {
    const theta = (d - 90) * DEG;
    const isMajor = d % 30 === 0;
    const inner = radius - (isMajor ? 12 : 6);
    ctx.beginPath();
    ctx.moveTo(cx + radius * Math.cos(theta), cy + radius * Math.sin(theta));
    ctx.lineTo(cx + inner * Math.cos(theta), cy + inner * Math.sin(theta));
    ctx.strokeStyle = isMajor ? 'rgba(220,180,80,0.5)' : 'rgba(180,140,60,0.25)';
    ctx.lineWidth = isMajor ? 1 : 0.5;
    ctx.stroke();
  }
}

/** Label for degree markers */
export function drawDegreeLabels(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].forEach(deg => {
    const theta = (deg - 90) * DEG;
    const x = cx + (radius + 22) * Math.cos(theta);
    const y = cy + (radius + 22) * Math.sin(theta);
    ctx.save();
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(180,150,80,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${deg}°`, x, y);
    ctx.restore();
  });
}
