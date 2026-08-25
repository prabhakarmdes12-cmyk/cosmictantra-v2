'use client';

/**
 * SkyCanvasRenderer — real horizon-view sky projection.
 *
 * Consumes ONLY typed astronomical positions from astronomy-engine.
 * Renderer NEVER generates Jyotish truth. The Nakshatra Mandala
 * and Jyotish overlays remain separate geometry layers.
 *
 * Projection: stereographic from zenith, centered on observer's zenith.
 * Stars: Yale Bright Star Catalog (public domain).
 * Bodies: Astronomy Engine equatorial → horizontal → projected.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Body, Ecliptic, Equator, GeoVector, Horizon, Observer, SiderealTime } from 'astronomy-engine';
import {
  BRIGHT_STARS,
  CONSTELLATION_LINES,
  CONSTELLATION_LABELS,
  type StarCatalogEntry,
} from '@/lib/astronomy/stars';
import {
  projectEquatorial,
  drawHorizonCircle,
  drawCardinalLabel,
  drawEclipticLine,
  drawZenithMarker,
  drawMilkyWay,
  magnitudeToRadius,
  bvToColor,
  planetColor,
  planetMagnitude,
} from '@/lib/astronomy/projection';
import type { ObserverLocation } from '@/lib/astronomy/types';

interface SkyCanvasRendererProps {
  instant: Date;
  location: ObserverLocation;
  showLabels?: boolean;
  showConstellations?: boolean;
  showMilkyWay?: boolean;
  showEcliptic?: boolean;
  selectedBody?: string | null;
  onBodyClick?: (bodyName: string) => void;
}

const BODY_MAP: Record<string, Body> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
};

const PLANET_LABELS: Record<string, string> = {
  Sun: '☉', Moon: '☾', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄',
};

// Jyotish rashi glyphs for planetary markers (secondary overlay, purely decorative)
const RASHI_GLYPHS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

export default function SkyCanvasRenderer({
  instant,
  location,
  showLabels = true,
  showConstellations = true,
  showMilkyWay = false,
  showEcliptic = true,
  selectedBody,
  onBodyClick,
}: SkyCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const maxRadius = Math.min(W, H) * 0.46;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Deep sky gradient (night) with slight warm horizon
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 1.1);
    grad.addColorStop(0, '#050510');
    grad.addColorStop(0.6, '#07071a');
    grad.addColorStop(0.85, '#0a0818');
    grad.addColorStop(1, '#080615');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Horizon glow (warm amber near horizon)
    const horizonGlow = ctx.createRadialGradient(cx, cy, maxRadius * 0.7, cx, cy, maxRadius);
    horizonGlow.addColorStop(0, 'rgba(80,50,10,0)');
    horizonGlow.addColorStop(1, 'rgba(40,20,5,0.25)');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, 0, W, H);

    // Horizon circle
    drawHorizonCircle(ctx, cx, cy, maxRadius, {
      stroke: 'rgba(180,140,60,0.35)',
      fill: 'rgba(0,0,0,0)',
      label: '',
    });

    // Milky Way
    if (showMilkyWay) {
      drawMilkyWay(ctx, instant, location.longitude, location.latitude, cx, cy, maxRadius);
    }

    // Ecliptic line
    if (showEcliptic) {
      drawEclipticLine(ctx, instant, location.longitude, location.latitude, cx, cy, maxRadius);
    }

    // Altitude circles
    [15, 30, 45, 60].forEach(alt => {
      const r = maxRadius * Math.tan((90 - alt) * Math.PI / 360);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180,160,100,0.08)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Zenith marker
    drawZenithMarker(ctx, cx, cy);

    // Cardinal labels
    drawCardinalLabel(ctx, cx, cy, maxRadius, 0, 'N');
    drawCardinalLabel(ctx, cx, cy, maxRadius, 90, 'E');
    drawCardinalLabel(ctx, cx, cy, maxRadius, 180, 'S');
    drawCardinalLabel(ctx, cx, cy, maxRadius, 270, 'W');

    // Draw star field
    const observer = new Observer(location.latitude, location.longitude, location.elevation ?? 0);

    // Build constellation line segments
    const starMap = new Map<string, { raH: number; decD: number }>();
    BRIGHT_STARS.forEach(s => starMap.set(s.id, { raH: s.raHours, decD: s.decDeg }));

    if (showConstellations) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(150,200,255,0.12)';
      ctx.lineWidth = 0.7;
      CONSTELLATION_LINES.forEach(([a, b]) => {
        const sa = starMap.get(a);
        const sb = starMap.get(b);
        if (!sa || !sb) return;
        const pa = projectEquatorial(sa.raH, sa.decD, instant, location.longitude, location.latitude, cx, cy, maxRadius, -5);
        const pb = projectEquatorial(sb.raH, sb.decD, instant, location.longitude, location.latitude, cx, cy, maxRadius, -5);
        if (pa.visible && pb.visible) {
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
        }
      });
      ctx.stroke();
    }

    // Project all stars
    const projectedStars: { star: StarCatalogEntry; x: number; y: number; r: number; visible: boolean; altDeg: number }[] = [];
    BRIGHT_STARS.forEach(star => {
      const pt = projectEquatorial(star.raHours, star.decDeg, instant, location.longitude, location.latitude, cx, cy, maxRadius, -6);
      projectedStars.push({ star, ...pt, altDeg: pt.altDeg });
    });

    // Sort by magnitude (brightest last so dim stars appear on top of bright ones)
    projectedStars.sort((a, b) => a.star.magnitude - b.star.magnitude);

    projectedStars.forEach(({ star, x, y, r, visible, altDeg }) => {
      if (!visible) return;
      const radius = magnitudeToRadius(star.magnitude);
      const color = bvToColor(star.bvIndex);

      // Glow for bright stars
      if (star.magnitude < 1.5) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 6);
        glow.addColorStop(0, color.replace('1)', `${Math.max(0.15, 0.4 - star.magnitude * 0.1)})`));
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(x, y, radius * 6, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Star point
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Cross sparkle for brightest
      if (star.magnitude < 0.5) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - radius * 3, y); ctx.lineTo(x + radius * 3, y);
        ctx.moveTo(x, y - radius * 3); ctx.lineTo(x, y + radius * 3);
        ctx.stroke();
      }
    });

    // Draw constellation labels
    if (showLabels) {
      CONSTELLATION_LABELS.forEach(({ label, raHours, decDeg }) => {
        const pt = projectEquatorial(raHours, decDeg, instant, location.longitude, location.latitude, cx, cy, maxRadius, 10);
        if (!pt.visible || pt.nearZenith) return;
        ctx.save();
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(180,160,120,0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, pt.x, pt.y);
        ctx.restore();
      });

      // Star name labels for bright stars
      projectedStars.forEach(({ star, x, y, visible, altDeg }) => {
        if (!visible || star.magnitude > 1.3) return;
        ctx.save();
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(180,170,140,0.45)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(star.name, x + 4, y - 2);
        ctx.restore();
      });
    }

    // Draw planets
    const planetEntries = Object.entries(BODY_MAP);
    const projectedPlanets: {
      name: string; x: number; y: number; altDeg: number; visible: boolean;
      raH: number; decD: number; selected: boolean;
    }[] = [];

    planetEntries.forEach(([name, body]) => {
      try {
        // Equator() returns ra in sidereal HOURS, dec in DEGREES per astronomy-engine docs
        const geo = Ecliptic(GeoVector(body, instant, true));
        const equatorial = Equator(body, instant, observer, true, true);
        // Horizon() also expects ra in hours and dec in degrees
        Horizon(instant, observer, equatorial.ra, equatorial.dec, 'normal');

        const pt = projectEquatorial(
          equatorial.ra, equatorial.dec, // already in hours and degrees respectively
          instant, location.longitude, location.latitude,
          cx, cy, maxRadius, -6
        );

        if (pt.visible) {
          projectedPlanets.push({
            name,
            x: pt.x,
            y: pt.y,
            altDeg: pt.altDeg,
            visible: true,
            raH: equatorial.ra,
            decD: equatorial.dec,
            selected: selectedBody === name,
          });
        }
      } catch {
        // Body not computable at this instant (e.g., below horizon for extended period)
      }
    });

    // Draw planets (in order of brightness — brightest last)
    projectedPlanets.sort((a, b) => {
      const ma = planetMagnitude(a.name);
      const mb = planetMagnitude(b.name);
      return ma - mb;
    });

    projectedPlanets.forEach(({ name, x, y, altDeg, visible, selected }) => {
      if (!visible) return;
      const mag = planetMagnitude(name);
      const radius = magnitudeToRadius(mag);
      const color = planetColor(name);

      // Glow
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 5);
      glow.addColorStop(0, color.replace('1)', '0.35)'));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(x, y, radius * 5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Body circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (selected) {
        ctx.strokeStyle = 'rgba(255,200,100,0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Label
      ctx.save();
      ctx.font = `${Math.max(10, radius * 2)}px serif`;
      ctx.fillStyle = 'rgba(240,230,200,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(PLANET_LABELS[name] ?? name[0], x, y - radius - 2);
      ctx.restore();
    });

    // Clickable planet hit areas (invisible large targets)
    projectedPlanets.forEach(({ name, x, y }) => {
      const el = document.createElement('canvas');
      // Attach data attributes for click detection (handled by parent overlay div)
    });

    // Draw horizon arc label (currently below)
    // Night sky label
    ctx.save();
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(180,160,100,0.3)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('ZENITH', cx - maxRadius + 4, cy - maxRadius + 4);
    ctx.fillText('HORIZON', cx - maxRadius + 4, cy + maxRadius - 14);
    ctx.restore();

  }, [instant, location, showLabels, showConstellations, showMilkyWay, showEcliptic, selectedBody]);

  // Redraw on changes
  useEffect(() => {
    draw();
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      draw();
    });
    ro.observe(parent);
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    draw();
    return () => ro.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: 'crosshair',
      }}
      aria-label="Real horizon sky projection"
    />
  );
}

/** Export helper for planet hit detection (used by parent for click handling) */
export function planetHitTest(
  canvasX: number,
  canvasY: number,
  projectedPlanets: { name: string; x: number; y: number }[],
  tolerancePx = 20
): string | null {
  for (const { name, x, y } of projectedPlanets) {
    const dx = canvasX - x;
    const dy = canvasY - y;
    if (Math.sqrt(dx * dx + dy * dy) < tolerancePx) return name;
  }
  return null;
}
