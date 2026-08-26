'use client';

import { useEffect, useRef, useState } from 'react';
import CanvasViewControls from './CanvasViewControls';
import {
  applyViewportTransform,
  clampViewportTransform,
  DEFAULT_VIEWPORT_TRANSFORM,
  zoomViewportAt,
  type ViewportPoint,
  type ViewportTransform,
} from '@/lib/astronomy/viewTransform';
import {
  altitudeRingPoints,
  cardinalDirectionPoints,
  equatorialToHorizontal,
  horizontalToStereographic,
  projectEclipticLongitude,
  projectEquatorial,
  projectStar,
  type CanvasSkyPoint,
  type ObserverLocation,
} from '@/lib/astronomy/projection';
import { calculateCanonicalBodies, type CanonicalBody } from '@/lib/astronomy/canonicalBodies';
import { calculateMoonPhase, isAboveObservationHorizon, isWithinLimitingMagnitude } from '@/lib/astronomy/observation';
import { contextStarsForZoom, type ContextStarRecord } from '@/lib/astronomy/contextStars';
import { constellationDisplayName, type CelestialSelection } from '@/lib/astronomy/celestialCatalog';
import {
  CONSTELLATION_LINES,
  NAKSHATRA_SHORT_NAMES,
  STARS,
  starColorFromBV,
  starRadiusFromMagnitude,
  type StarRecord,
} from '@/lib/astronomy/stars';

export interface SkyCanvasRendererProps {
  date: string | Date;
  observer: ObserverLocation;
  selectedPlanet?: string | null;
  selectedConstellation?: string | null;
  /** Preferred unified callback; the older callbacks remain compatible. */
  onSelectObject?: (selection: CelestialSelection) => void;
  /** Reports only the display transform; it never changes calculated coordinates. */
  onViewChange?: (view: ViewportTransform) => void;
  onSelectPlanet?: (body: string) => void;
  onSelectConstellation?: (id: string) => void;
  showMandala?: boolean;
  showConstellations?: boolean;
  minimumAltitudeDeg?: number;
  limitingMagnitude?: number;
  className?: string;
  labelled?: boolean;
}

interface DrawnTarget {
  selection: CelestialSelection;
  point: CanvasSkyPoint;
  hitRadius: number;
  priority: number;
}

const VISIBLE_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄',
};
const PLANET_COLORS: Record<string, string> = {
  Sun: '#F2B84B', Moon: '#E6EEF8', Mars: '#E2745A', Mercury: '#86C7B8',
  Jupiter: '#D8A16B', Venus: '#F5B7D2', Saturn: '#AFA6D9',
};

function parseDate(value: string | Date): Date {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function drawPath(ctx: CanvasRenderingContext2D, points: CanvasSkyPoint[], close = false): void {
  let segment: CanvasSkyPoint[] = [];
  const flush = () => {
    if (segment.length < 2) {
      segment = [];
      return;
    }
    ctx.beginPath();
    segment.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    if (close) ctx.closePath();
    ctx.stroke();
    segment = [];
  };

  points.forEach(point => {
    if (point.visible) segment.push(point);
    else flush();
  });
  flush();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  font: string,
  align: CanvasTextAlign = 'center',
): void {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function starLabelLimit(scale: number): number {
  if (scale >= 3.1) return 3.1;
  if (scale >= 2.3) return 2.45;
  if (scale >= 1.75) return 1.95;
  if (scale >= 1.35) return 0.85;
  return -Infinity;
}

function drawContextStars(
  ctx: CanvasRenderingContext2D,
  date: Date,
  observer: ObserverLocation,
  width: number,
  height: number,
  scale: number,
  minimumAltitudeDeg: number,
  limitingMagnitude: number,
): void {
  const contextStars = contextStarsForZoom(scale);
  if (contextStars.length === 0) return;

  ctx.save();
  contextStars.forEach((star: ContextStarRecord) => {
    const point = projectEquatorial({ raHours: star.raHours, decDeg: star.decDeg }, date, observer, width, height);
    if (!point.visible || !isAboveObservationHorizon(point.altitudeDeg, minimumAltitudeDeg) || !isWithinLimitingMagnitude(star.magnitude, limitingMagnitude)) return;
    const radius = Math.max(0.35, Math.min(1.25, 1.35 - star.magnitude * 0.18));
    ctx.globalAlpha = Math.max(0.10, Math.min(0.38, 0.48 - star.magnitude * 0.06));
    ctx.fillStyle = starColorFromBV(star.bv);
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawAltAzDetailGrid(
  ctx: CanvasRenderingContext2D,
  date: Date,
  observer: ObserverLocation,
  width: number,
  height: number,
  scale: number,
): void {
  if (scale < 1.25) return;
  const fine = scale >= 2.15;
  const altitudes = fine ? [15, 30, 45, 60, 75] : [30, 60];
  const azimuthStep = fine ? 30 : 45;
  const cx = width / 2;
  const cy = height / 2;
  const horizonRadius = Math.min(width, height) / 2 - 18;

  ctx.save();
  ctx.strokeStyle = fine ? 'rgba(154,177,232,0.16)' : 'rgba(154,177,232,0.10)';
  ctx.lineWidth = (fine ? 0.75 : 0.55) / Math.max(1, scale);
  ctx.setLineDash([1.5, 5]);
  altitudes.forEach(altitude => {
    const points = altitudeRingPoints(altitude, date, observer, width, height);
    drawPath(ctx, points);
    if (fine) {
      const ringRadius = points[0]?.radius ?? 0;
      drawText(ctx, `${altitude}°`, cx + ringRadius * 0.66, cy - ringRadius * 0.66, 'rgba(190,205,244,0.52)', `${8 / Math.max(1, scale)}px "JetBrains Mono", monospace`, 'left');
    }
  });

  for (let azimuth = 0; azimuth < 360; azimuth += azimuthStep) {
    const points = Array.from({ length: 25 }, (_, index) => horizontalToStereographic({ altitudeDeg: index * 89.5 / 24, azimuthDeg: azimuth }, width, height));
    drawPath(ctx, points);
    if (fine) {
      const labelRadius = Math.max(0, horizonRadius - 13);
      const labelX = cx + labelRadius * Math.sin(azimuth * Math.PI / 180);
      const labelY = cy - labelRadius * Math.cos(azimuth * Math.PI / 180);
      drawText(ctx, `${String(azimuth).padStart(3, '0')}°`, labelX, labelY, 'rgba(190,205,244,0.48)', `${7 / Math.max(1, scale)}px "JetBrains Mono", monospace`);
    }
  }
  drawText(ctx, fine ? 'ALT / AZ GRID' : 'ALTITUDE GRID', cx, cy - horizonRadius + 14 / Math.max(1, scale), 'rgba(190,205,244,0.42)', `${7 / Math.max(1, scale)}px "JetBrains Mono", monospace`);
  ctx.restore();
}

function drawMoonDisc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angleDeg: number,
  selected: boolean,
): void {
  const phase = angleDeg * Math.PI / 180;
  const waxing = angleDeg <= 180;
  const cosine = Math.cos(phase);

  ctx.save();
  ctx.shadowColor = '#DCEBFF';
  ctx.shadowBlur = selected ? 18 : 11;
  ctx.fillStyle = '#27324A';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw the illuminated lunar face as an outer semicircle plus a curved
  // terminator. This keeps crescent, quarter, gibbous and full phases legible
  // without claiming a photographic lunar surface.
  ctx.beginPath();
  if (waxing) {
    ctx.arc(x, y, radius, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(x, y, Math.abs(cosine) * radius, radius, 0, Math.PI / 2, -Math.PI / 2, cosine >= 0);
  } else {
    ctx.arc(x, y, radius, -Math.PI / 2, Math.PI / 2, true);
    ctx.ellipse(x, y, Math.abs(cosine) * radius, radius, 0, Math.PI / 2, -Math.PI / 2, cosine < 0);
  }
  ctx.closePath();
  const lunarFace = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.1, x, y, radius * 1.1);
  lunarFace.addColorStop(0, '#FFFFFF');
  lunarFace.addColorStop(0.58, '#DDE9F7');
  lunarFace.addColorStop(1, '#9EABC1');
  ctx.fillStyle = lunarFace;
  ctx.fill();

  ctx.strokeStyle = 'rgba(235,243,255,0.72)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  if (selected) {
    ctx.strokeStyle = '#F6E5A5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSunDisc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, selected: boolean): void {
  ctx.save();
  ctx.shadowColor = '#F2B84B';
  ctx.shadowBlur = selected ? 24 : 16;
  const sun = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.15, x, y, radius * 1.5);
  sun.addColorStop(0, '#FFF1B2');
  sun.addColorStop(0.55, '#F2B84B');
  sun.addColorStop(1, '#B9642D');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,241,178,0.75)';
  ctx.lineWidth = 0.8;
  for (let ray = 0; ray < 8; ray += 1) {
    const angle = ray * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * (radius + 2), y + Math.sin(angle) * (radius + 2));
    ctx.lineTo(x + Math.cos(angle) * (radius + 4.5), y + Math.sin(angle) * (radius + 4.5));
    ctx.stroke();
  }
  if (selected) {
    ctx.strokeStyle = '#F6E5A5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlanetDisc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, selected: boolean): void {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = selected ? 18 : 10;
  const disc = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.1, x, y, radius * 1.3);
  disc.addColorStop(0, '#FFF3D0');
  disc.addColorStop(0.22, color);
  disc.addColorStop(1, '#171A2A');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `${color}B8`;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  if (selected) {
    ctx.strokeStyle = '#F6E5A5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBodyCallout(
  ctx: CanvasRenderingContext2D,
  body: CanonicalBody,
  point: CanvasSkyPoint,
  moonPhaseAngle: number,
  width: number,
  height: number,
  scale: number,
): void {
  const uiScale = Math.max(1, scale);
  const boxWidth = 164 / uiScale;
  const boxHeight = 48 / uiScale;
  const padding = 8 / uiScale;
  const gap = 16 / uiScale;
  const cx = width / 2;
  const cy = height / 2;
  const boxX = point.x < cx ? Math.min(width - boxWidth - padding, point.x + gap) : Math.max(padding, point.x - boxWidth - gap);
  const boxY = point.y < cy ? Math.min(height - boxHeight - padding, point.y + gap) : Math.max(padding, point.y - boxHeight - gap);
  const anchorX = point.x < cx ? boxX : boxX + boxWidth;
  const anchorY = point.y < cy ? boxY : boxY + boxHeight;

  ctx.save();
  ctx.strokeStyle = 'rgba(246,229,165,0.72)';
  ctx.lineWidth = 0.8 / uiScale;
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(anchorX, anchorY);
  ctx.stroke();
  ctx.fillStyle = 'rgba(5,8,18,0.93)';
  ctx.strokeStyle = 'rgba(246,229,165,0.62)';
  ctx.lineWidth = 0.8 / uiScale;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6 / uiScale);
  ctx.fill();
  ctx.stroke();
  drawText(ctx, `${body.body} · local position`, boxX + 8 / uiScale, boxY + 10 / uiScale, '#F6E5A5', `bold ${8 / uiScale}px "JetBrains Mono", monospace`, 'left');
  drawText(ctx, `ALT ${point.altitudeDeg >= 0 ? '+' : ''}${point.altitudeDeg.toFixed(1)}° · AZ ${String(Math.round(point.azimuthDeg)).padStart(3, '0')}°`, boxX + 8 / uiScale, boxY + 23 / uiScale, '#DCE3FF', `${8 / uiScale}px "JetBrains Mono", monospace`, 'left');
  drawText(ctx, `λ ${body.tropicalLongitude.toFixed(2)}° · ${body.source}${body.body === 'Moon' ? ` · ${Math.round(((1 - Math.cos(moonPhaseAngle * Math.PI / 180)) / 2) * 100)}% lit` : ''}`, boxX + 8 / uiScale, boxY + 36 / uiScale, '#9FAAC7', `${7 / uiScale}px "JetBrains Mono", monospace`, 'left');
  ctx.restore();
}

function drawTwilightGlow(
  ctx: CanvasRenderingContext2D,
  date: Date,
  observer: ObserverLocation,
  width: number,
  height: number,
): void {
  const sun = calculateCanonicalBodies(date).find(body => body.body === 'Sun');
  if (!sun) return;
  const horizontal = equatorialToHorizontal(
    { raHours: sun.rightAscensionHours, decDeg: sun.declinationDeg },
    date,
    observer,
  );
  if (horizontal.altitudeDeg >= 8 || horizontal.altitudeDeg < -18) return;

  const twilightStrength = horizontal.altitudeDeg < 0
    ? ((horizontal.altitudeDeg + 18) / 18) * 0.42
    : (1 - horizontal.altitudeDeg / 8) * 0.24;
  const point = horizontalToStereographic({ altitudeDeg: Math.max(0, Math.min(2, horizontal.altitudeDeg)), azimuthDeg: horizontal.azimuthDeg }, width, height);
  const radius = Math.min(width, height) * 0.42;
  const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
  glow.addColorStop(0, `rgba(255,188,112,${twilightStrength})`);
  glow.addColorStop(0.22, `rgba(235,126,96,${twilightStrength * 0.42})`);
  glow.addColorStop(1, 'rgba(235,126,96,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawMandala(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  textColor: string,
  accent: string,
  scale = 1,
): void {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 28;
  if (r <= 10) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(212,175,55,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(139,139,245,0.21)';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 13, 0, Math.PI * 2);
  ctx.stroke();

  for (let index = 0; index < 27; index += 1) {
    const angle = index * Math.PI * 2 / 27 - Math.PI / 2;
    const inner = r - 20;
    ctx.strokeStyle = index % 3 === 0 ? accent : 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(cx + inner * Math.cos(angle), cy + inner * Math.sin(angle));
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.stroke();

    const labelRadius = r - 7;
    const labelX = cx + labelRadius * Math.cos(angle + Math.PI / 27);
    const labelY = cy + labelRadius * Math.sin(angle + Math.PI / 27);
    drawText(ctx, NAKSHATRA_SHORT_NAMES[index], labelX, labelY, textColor, `${8 / Math.max(1, scale)}px "JetBrains Mono", monospace`);
  }
  ctx.restore();
}

function drawSky(
  canvas: HTMLCanvasElement,
  date: Date,
  observer: ObserverLocation,
  selectedPlanet: string | null | undefined,
  selectedConstellation: string | null | undefined,
  showMandala: boolean,
  showConstellations: boolean,
  minimumAltitudeDeg: number,
  limitingMagnitude: number,
  view: ViewportTransform,
  targetsRef: React.MutableRefObject<DrawnTarget[]>,
): void {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(280, rect.width || 640);
  const height = Math.max(280, rect.height || width);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const horizonRadius = Math.min(width, height) / 2 - 18;

  const background = ctx.createRadialGradient(cx, cy, 0, cx, cy, horizonRadius);
  background.addColorStop(0, '#11162D');
  background.addColorStop(0.62, '#080D1D');
  background.addColorStop(1, '#03050B');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const viewport = clampViewportTransform(view, width, height);
  const toScreenPoint = (point: CanvasSkyPoint): CanvasSkyPoint => ({
    ...point,
    ...applyViewportTransform(point, width, height, viewport),
  });
  // Keep the background fixed while the calculated sky scene becomes a
  // navigable display layer. This transform never changes astronomy values.
  ctx.save();
  ctx.translate(width / 2 + viewport.offsetX, height / 2 + viewport.offsetY);
  ctx.scale(viewport.scale, viewport.scale);
  ctx.translate(-width / 2, -height / 2);

  // A restrained directional twilight glow makes the changing local sky read
  // as an observing scene rather than a static diagram. It is visual only.
  drawTwilightGlow(ctx, date, observer, width, height);

  // Horizon and altitude rings.
  ctx.save();
  ctx.strokeStyle = 'rgba(190,199,255,0.24)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, horizonRadius, 0, Math.PI * 2);
  ctx.stroke();
  [30, 60].forEach(altitude => {
    const points = altitudeRingPoints(altitude, date, observer, width, height);
    ctx.strokeStyle = 'rgba(190,199,255,0.13)';
    drawPath(ctx, points);
    const ringRadius = points[0]?.radius ?? 0;
    drawText(ctx, `${altitude}°`, cx + ringRadius * 0.7, cy - ringRadius * 0.7, 'rgba(214,220,255,0.55)', `${9 / Math.max(1, viewport.scale)}px "JetBrains Mono", monospace`, 'left');
  });
  if (minimumAltitudeDeg > 0) {
    const maskPoints = altitudeRingPoints(minimumAltitudeDeg, date, observer, width, height);
    ctx.strokeStyle = 'rgba(242,198,93,0.78)';
    ctx.setLineDash([4, 4]);
    drawPath(ctx, maskPoints);
    const maskRadius = maskPoints[0]?.radius ?? 0;
    drawText(ctx, `MASK ≥${minimumAltitudeDeg}°`, cx + maskRadius * 0.72, cy - maskRadius * 0.72, '#F2C65D', `bold ${8 / Math.max(1, viewport.scale)}px "JetBrains Mono", monospace`, 'left');
    ctx.setLineDash([]);
  }
  ctx.restore();

  if (showMandala) drawMandala(ctx, width, height, 'rgba(232,225,198,0.64)', 'rgba(212,175,55,0.56)', viewport.scale);

  // Ecliptic: the Sun's apparent path, drawn as a segmented line so below-
  // horizon sections disappear naturally.
  ctx.save();
  ctx.strokeStyle = 'rgba(212,175,55,0.68)';
  ctx.lineWidth = 1.35;
  ctx.setLineDash([5, 5]);
  const eclipticPoints = Array.from({ length: 73 }, (_, index) => {
    const point = projectEclipticLongitude(index * 5, date, observer, width, height);
    return { ...point, visible: point.visible && isAboveObservationHorizon(point.altitudeDeg, minimumAltitudeDeg) };
  });
  drawPath(ctx, eclipticPoints);
  ctx.restore();

  // A real finder scope reveals a coordinate grid and a faint field only as
  // the observer moves in. The context field is intentionally non-selectable;
  // the reviewed anchors below remain the identification layer.
  drawContextStars(ctx, date, observer, width, height, viewport.scale, minimumAltitudeDeg, limitingMagnitude);
  drawAltAzDetailGrid(ctx, date, observer, width, height, viewport.scale);

  const projectedStars = new Map<string, CanvasSkyPoint>();
  STARS.forEach((star: StarRecord) => {
    const point = projectStar(star, date, observer, width, height);
    projectedStars.set(star.id, {
      ...point,
      visible: point.visible
        && isAboveObservationHorizon(point.altitudeDeg, minimumAltitudeDeg)
        && isWithinLimitingMagnitude(star.magnitude, limitingMagnitude),
    });
  });
  const targets: DrawnTarget[] = [];
  const constellationPoints = new Map<string, CanvasSkyPoint[]>();

  STARS.forEach((star: StarRecord) => {
    const point = projectedStars.get(star.id);
    if (!point?.visible) return;
    const points = constellationPoints.get(star.constellation) || [];
    points.push(point);
    constellationPoints.set(star.constellation, points);
  });

  if (showConstellations) {
    ctx.save();
    ctx.lineWidth = 0.9;
    CONSTELLATION_LINES.forEach(([from, to]) => {
      const firstStar = STARS.find(star => star.id === from);
      const secondStar = STARS.find(star => star.id === to);
      const first = projectedStars.get(from);
      const second = projectedStars.get(to);
      // A stick figure must not accidentally connect two unrelated patterns.
      if (!firstStar || !secondStar || firstStar.constellation !== secondStar.constellation || !first?.visible || !second?.visible) return;
      const selected = firstStar.constellation === selectedConstellation;
      ctx.strokeStyle = selected ? 'rgba(242,198,93,0.88)' : 'rgba(130,159,220,0.27)';
      ctx.lineWidth = selected ? 1.8 : 0.75;
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(second.x, second.y);
      ctx.stroke();
      targets.push({
        selection: { kind: 'constellation', id: firstStar.constellation },
        point: toScreenPoint({ ...first, x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }),
        hitRadius: (selected ? 22 : 15) * viewport.scale,
        priority: selected ? 2 : 1,
      });
    });
    // Give a selected pattern a readable label without covering the whole sky.
    if (selectedConstellation) {
      const points = constellationPoints.get(selectedConstellation);
      if (points && points.length > 0) {
        const average = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
        drawText(ctx, constellationDisplayName(selectedConstellation).toUpperCase(), average.x / points.length, average.y / points.length + 20 / Math.max(1, viewport.scale), '#F6E5A5', `bold ${10 / Math.max(1, viewport.scale)}px "JetBrains Mono", monospace`);
      }
    }
    ctx.restore();
  }

  // Draw stars after the guide lines so the catalogue reads clearly. Each
  // bright star also acts as a comfortable constellation hit target.
  STARS.forEach((star: StarRecord) => {
    const point = projectedStars.get(star.id);
    if (!point?.visible) return;
    const starRadius = starRadiusFromMagnitude(star.magnitude);
    const selected = star.constellation === selectedConstellation;
    ctx.save();
    ctx.globalAlpha = Math.max(0.5, Math.min(1, 1.35 - star.magnitude / 5));
    ctx.fillStyle = starColorFromBV(star.bv);
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = selected ? 9 : star.magnitude < 1.2 ? 5 : 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, selected ? starRadius + 1.2 : starRadius, 0, Math.PI * 2);
    ctx.fill();
    if (viewport.scale >= 1.35 && star.magnitude <= 1.5) {
      const spike = Math.max(2.5, 4.5 / viewport.scale);
      ctx.globalAlpha = selected ? 0.62 : 0.28;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(point.x - spike, point.y);
      ctx.lineTo(point.x + spike, point.y);
      ctx.moveTo(point.x, point.y - spike);
      ctx.lineTo(point.x, point.y + spike);
      ctx.stroke();
    }
    ctx.restore();
    if (star.magnitude <= starLabelLimit(viewport.scale)) {
      const labelOffset = starRadius + (viewport.scale >= 2.3 ? 8 : 6) / Math.max(1, viewport.scale);
      const labelSize = viewport.scale >= 2.3 ? 8 : 7;
      drawText(ctx, `${star.name} · mag ${star.magnitude.toFixed(1)}`, point.x + labelOffset, point.y - labelOffset * 0.65, '#DCE3FF', `${labelSize / Math.max(1, viewport.scale)}px "JetBrains Mono", monospace`, 'left');
    }
    if (showConstellations) {
      targets.push({
        selection: { kind: 'constellation', id: star.constellation },
        point: toScreenPoint(point),
        hitRadius: Math.max(12, starRadius + 8) * viewport.scale,
        priority: star.magnitude < 1.5 ? 2 : 1,
      });
    }
  });

  const bodies = calculateCanonicalBodies(date).filter(body => VISIBLE_PLANETS.includes(body.body));
  const moonPhase = calculateMoonPhase(date);
  const bodyPoints = new Map<string, CanvasSkyPoint>();
  bodies.forEach(body => {
    const projected = projectEclipticLongitude(body.tropicalLongitude, date, observer, width, height, body.tropicalLatitude);
    const point = { ...projected, visible: projected.visible && isAboveObservationHorizon(projected.altitudeDeg, minimumAltitudeDeg) };
    if (!point.visible) return;
    bodyPoints.set(body.body, point);
    targets.push({
      selection: { kind: 'planet', id: body.body },
      point: toScreenPoint(point),
      hitRadius: (body.body === 'Sun' ? 28 : 24) * viewport.scale,
      priority: 3,
    });
    const color = PLANET_COLORS[body.body] || '#D4AF37';
    const selected = body.body === selectedPlanet;
    const bodyRadius = body.body === 'Sun' ? 7 : body.body === 'Moon' ? 6 : 4.5;

    if (body.body === 'Sun') drawSunDisc(ctx, point.x, point.y, bodyRadius, selected);
    else if (body.body === 'Moon') drawMoonDisc(ctx, point.x, point.y, bodyRadius, moonPhase.angleDeg, selected);
    else drawPlanetDisc(ctx, point.x, point.y, bodyRadius, color, selected);

    if (body.body === 'Saturn') {
      ctx.save();
      ctx.strokeStyle = '#D6C6A2';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, bodyRadius * 1.9, bodyRadius * 0.65, -0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const uiScale = Math.max(1, viewport.scale);
    drawText(ctx, PLANET_SYMBOLS[body.body] || body.body, point.x, point.y, '#080B13', `bold ${9 / uiScale}px sans-serif`);
    drawText(
      ctx,
      body.body,
      point.x,
      point.y - bodyRadius - 9 / uiScale,
      selected ? '#F6E5A5' : '#C6CBE0',
      selected ? `bold ${10 / uiScale}px "JetBrains Mono", monospace` : `${9 / uiScale}px "JetBrains Mono", monospace`,
    );
    if (viewport.scale >= 2.3 && body.body !== selectedPlanet) {
      drawText(ctx, `+${Math.max(0, point.altitudeDeg).toFixed(0)}° · ${String(Math.round(point.azimuthDeg)).padStart(3, '0')}°`, point.x, point.y + bodyRadius + 10 / Math.max(1, viewport.scale), '#8997BA', `${7 / Math.max(1, viewport.scale)}px "JetBrains Mono", monospace`);
    }
  });
  const selectedBody = bodies.find(body => body.body === selectedPlanet);
  const selectedPoint = selectedBody ? bodyPoints.get(selectedBody.body) : undefined;
  if (selectedBody && selectedPoint && viewport.scale >= 1.35) {
    drawBodyCallout(ctx, selectedBody, selectedPoint, moonPhase.angleDeg, width, height, viewport.scale);
  }
  // Zenith, cardinal compass, and quiet coordinate annotations.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.11)';
  ctx.setLineDash([2, 5]);
  ctx.beginPath();
  ctx.moveTo(cx, cy - horizonRadius);
  ctx.lineTo(cx, cy + horizonRadius);
  ctx.moveTo(cx - horizonRadius, cy);
  ctx.lineTo(cx + horizonRadius, cy);
  ctx.stroke();
  ctx.restore();
  const uiScale = Math.max(1, viewport.scale);
  drawText(ctx, 'ZENITH', cx, cy + 15 / uiScale, 'rgba(230,234,255,0.42)', `${8 / uiScale}px "JetBrains Mono", monospace`);
  const directions = cardinalDirectionPoints(width, height);
  Object.entries(directions).forEach(([label, point]) => {
    drawText(ctx, label, point.x, point.y, label === 'N' ? '#F2C65D' : '#AEB7D7', `bold ${10 / uiScale}px "JetBrains Mono", monospace`);
  });
  ctx.restore();
  targetsRef.current = targets;
}

function SkyCanvasRenderer({
  date,
  observer,
  selectedPlanet,
  selectedConstellation,
  onSelectObject,
  onViewChange,
  onSelectPlanet,
  onSelectConstellation,
  showMandala = true,
  showConstellations = true,
  minimumAltitudeDeg = 0,
  limitingMagnitude = 4.5,
  className = '',
  labelled = true,
}: SkyCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetsRef = useRef<DrawnTarget[]>([]);
  const [view, setView] = useState<ViewportTransform>(DEFAULT_VIEWPORT_TRANSFORM);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const pointersRef = useRef<Map<number, ViewportPoint>>(new Map());
  const pinchRef = useRef<{ distance: number; center: ViewportPoint; transform: ViewportTransform } | null>(null);
  const dateValue = date instanceof Date ? date.toISOString() : date;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const render = () => drawSky(
      canvas,
      parseDate(dateValue),
      observer,
      selectedPlanet,
      selectedConstellation,
      showMandala,
      showConstellations,
      minimumAltitudeDeg,
      limitingMagnitude,
      view,
      targetsRef,
    );
    render();
    onViewChange?.(view);
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [dateValue, observer.latitude, observer.longitude, selectedPlanet, selectedConstellation, showMandala, showConstellations, minimumAltitudeDeg, limitingMagnitude, onViewChange, view.scale, view.offsetX, view.offsetY]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>): ViewportPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const zoomAtEvent = (event: React.WheelEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>, factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const focusPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    setView(current => zoomViewportAt(current, current.scale * factor, focusPoint, rect.width, rect.height));
  };

  const zoomBy = (factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setView(current => zoomViewportAt(current, current.scale * factor, { x: rect.width / 2, y: rect.height / 2 }, rect.width, rect.height));
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    zoomAtEvent(event, event.deltaY < 0 ? 1.16 : 1 / 1.16);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const point = pointFromEvent(event);
    pointersRef.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointersRef.current.size === 1) {
      dragRef.current = { pointerId: event.pointerId, x: point.x, y: point.y, offsetX: view.offsetX, offsetY: view.offsetY };
    } else if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()];
      pinchRef.current = {
        distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
        center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        transform: view,
      };
      dragRef.current = null;
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, point);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [first, second] = [...pointersRef.current.values()];
      const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
      const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      const base = pinchRef.current;
      setView(current => {
        const zoomed = zoomViewportAt(base.transform, base.transform.scale * distance / base.distance, base.center, rect.width, rect.height);
        return clampViewportTransform({
          ...zoomed,
          offsetX: zoomed.offsetX + center.x - base.center.x,
          offsetY: zoomed.offsetY + center.y - base.center.y,
        }, rect.width, rect.height);
      });
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setView(current => clampViewportTransform({
      ...current,
      offsetX: drag.offsetX + point.x - drag.x,
      offsetY: drag.offsetY + point.y - drag.y,
    }, rect.width, rect.height));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    zoomAtEvent(event, 1.45);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomBy(1.35);
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      zoomBy(1 / 1.35);
    } else if (event.key === '0' || event.key.toLowerCase() === 'r') {
      event.preventDefault();
      setView(DEFAULT_VIEWPORT_TRANSFORM);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const step = event.shiftKey ? 48 : 24;
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      setView(current => clampViewportTransform({ ...current, offsetX: current.offsetX + dx, offsetY: current.offsetY + dy }, rect.width, rect.height));
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if ((!onSelectObject && !onSelectPlanet && !onSelectConstellation) || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let selectedTarget: DrawnTarget | null = null;
    let selectedDistance = Number.POSITIVE_INFINITY;
    for (const target of targetsRef.current) {
      const currentDistance = Math.hypot(x - target.point.x, y - target.point.y);
      const withinHitArea = currentDistance <= target.hitRadius;
      const winsTie = selectedTarget && target.priority === selectedTarget.priority && currentDistance < selectedDistance;
      if (withinHitArea && (!selectedTarget || target.priority > selectedTarget.priority || winsTie)) {
        selectedTarget = target;
        selectedDistance = currentDistance;
      }
    }
    if (!selectedTarget) return;
    if (onSelectObject) onSelectObject(selectedTarget.selection);
    else if (selectedTarget.selection.kind === 'planet') onSelectPlanet?.(selectedTarget.selection.id);
    else onSelectConstellation?.(selectedTarget.selection.id);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#03050B] ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="block h-full min-h-[320px] w-full cursor-grab touch-none active:cursor-grabbing"
        tabIndex={0}
        title="Focus the sky, then use plus/minus, arrow keys, R, or 0 to navigate"
        role="img"
        aria-label="Stereographic local sky projection with catalogue anchor stars, planets, and a zoomed illustrative faint-star field. Use the zoom controls or drag to inspect the field."
      />
      <div className="pointer-events-none absolute right-3 top-3">
        <CanvasViewControls zoom={view.scale} onZoomIn={() => zoomBy(1.35)} onZoomOut={() => zoomBy(1 / 1.35)} onReset={() => setView(DEFAULT_VIEWPORT_TRANSFORM)} label="Local sky zoom and pan controls" />
      </div>
      {view.scale > 1 && <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-[#060914]/85 px-2.5 py-1.5 font-mono-data text-[9px] uppercase tracking-[0.12em] text-[#AAB4CF] backdrop-blur">
        {view.scale >= 2.15 ? 'High detail · alt/az grid · magnitudes · drag to pan' : view.scale >= 1.7 ? 'Deep field · anchor labels · drag to pan' : 'Detail layer · faint stars emerging · drag to pan'}
      </div>}
      {labelled && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#060914]/85 px-3 py-1.5 text-center font-mono-data text-[9px] uppercase tracking-[0.14em] text-[#B8BED7] backdrop-blur">
          Local calculation · tap a graha or star pattern · scroll/pinch to zoom · faint field is illustrative; provider frames are separate
        </div>
      )}
    </div>
  );
}

export { SkyCanvasRenderer };

export default SkyCanvasRenderer;
