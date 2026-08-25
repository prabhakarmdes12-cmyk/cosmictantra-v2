'use client';

import { useEffect, useRef } from 'react';
import {
  altitudeRingPoints,
  cardinalDirectionPoints,
  projectEclipticLongitude,
  projectStar,
  type CanvasSkyPoint,
  type ObserverLocation,
} from '@/lib/astronomy/projection';
import { calculateCanonicalBodies, type CanonicalBody } from '@/lib/astronomy/canonicalBodies';
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
  onSelectPlanet?: (body: string) => void;
  showMandala?: boolean;
  showConstellations?: boolean;
  className?: string;
  labelled?: boolean;
}

interface DrawnTarget {
  body: CanonicalBody;
  point: CanvasSkyPoint;
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
  const visible = points.filter(point => point.visible);
  if (visible.length < 2) return;
  ctx.beginPath();
  visible.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  if (close) ctx.closePath();
  ctx.stroke();
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

function drawMandala(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  textColor: string,
  accent: string,
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
    drawText(ctx, NAKSHATRA_SHORT_NAMES[index], labelX, labelY, textColor, '8px "JetBrains Mono", monospace');
  }
  ctx.restore();
}

function drawSky(
  canvas: HTMLCanvasElement,
  date: Date,
  observer: ObserverLocation,
  selectedPlanet: string | null | undefined,
  showMandala: boolean,
  showConstellations: boolean,
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
    drawText(ctx, `${altitude}°`, cx + ringRadius * 0.7, cy - ringRadius * 0.7, 'rgba(214,220,255,0.55)', '9px "JetBrains Mono", monospace', 'left');
  });
  ctx.restore();

  if (showMandala) drawMandala(ctx, width, height, 'rgba(232,225,198,0.64)', 'rgba(212,175,55,0.56)');

  // Ecliptic: the Sun's apparent path, drawn as a segmented line so below-
  // horizon sections disappear naturally.
  ctx.save();
  ctx.strokeStyle = 'rgba(212,175,55,0.68)';
  ctx.lineWidth = 1.35;
  ctx.setLineDash([5, 5]);
  const eclipticPoints = Array.from({ length: 73 }, (_, index) =>
    projectEclipticLongitude(index * 5, date, observer, width, height),
  );
  drawPath(ctx, eclipticPoints);
  ctx.restore();

  const projectedStars = new Map<string, CanvasSkyPoint>();
  STARS.forEach((star: StarRecord) => {
    const point = projectStar(star, date, observer, width, height);
    projectedStars.set(star.id, point);
  });

  if (showConstellations) {
    ctx.save();
    ctx.strokeStyle = 'rgba(130,159,220,0.25)';
    ctx.lineWidth = 0.75;
    CONSTELLATION_LINES.forEach(([from, to]) => {
      const first = projectedStars.get(from);
      const second = projectedStars.get(to);
      if (!first?.visible || !second?.visible) return;
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(second.x, second.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  // Draw stars after the guide lines so the catalogue reads clearly.
  STARS.forEach((star: StarRecord) => {
    const point = projectedStars.get(star.id);
    if (!point?.visible) return;
    const starRadius = starRadiusFromMagnitude(star.magnitude);
    ctx.save();
    ctx.globalAlpha = Math.max(0.5, Math.min(1, 1.35 - star.magnitude / 5));
    ctx.fillStyle = starColorFromBV(star.bv);
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = star.magnitude < 1.2 ? 5 : 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, starRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const bodies = calculateCanonicalBodies(date).filter(body => VISIBLE_PLANETS.includes(body.body));
  const targets: DrawnTarget[] = [];
  bodies.forEach(body => {
    const point = projectEclipticLongitude(body.tropicalLongitude, date, observer, width, height, body.tropicalLatitude);
    if (!point.visible) return;
    targets.push({ body, point });
    const color = PLANET_COLORS[body.body] || '#D4AF37';
    const selected = body.body === selectedPlanet;
    const bodyRadius = body.body === 'Sun' ? 7 : body.body === 'Moon' ? 5.5 : 4.5;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = selected ? 18 : 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, bodyRadius, 0, Math.PI * 2);
    ctx.fill();
    if (selected) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#F6E5A5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(point.x, point.y, bodyRadius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (body.body === 'Saturn') {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#D6C6A2';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, bodyRadius * 1.9, bodyRadius * 0.65, -0.25, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    drawText(ctx, PLANET_SYMBOLS[body.body] || body.body, point.x, point.y, '#080B13', 'bold 9px sans-serif');
    drawText(
      ctx,
      body.body,
      point.x,
      point.y - bodyRadius - 9,
      selected ? '#F6E5A5' : '#C6CBE0',
      selected ? 'bold 10px "JetBrains Mono", monospace' : '9px "JetBrains Mono", monospace',
    );
  });
  targetsRef.current = targets;

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
  drawText(ctx, 'ZENITH', cx, cy + 15, 'rgba(230,234,255,0.42)', '8px "JetBrains Mono", monospace');
  const directions = cardinalDirectionPoints(width, height);
  Object.entries(directions).forEach(([label, point]) => {
    drawText(ctx, label, point.x, point.y, label === 'N' ? '#F2C65D' : '#AEB7D7', 'bold 10px "JetBrains Mono", monospace');
  });
}

function SkyCanvasRenderer({
  date,
  observer,
  selectedPlanet,
  onSelectPlanet,
  showMandala = true,
  showConstellations = true,
  className = '',
  labelled = true,
}: SkyCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetsRef = useRef<DrawnTarget[]>([]);
  const dateValue = date instanceof Date ? date.toISOString() : date;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const render = () => drawSky(
      canvas,
      parseDate(dateValue),
      observer,
      selectedPlanet,
      showMandala,
      showConstellations,
      targetsRef,
    );
    render();
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [dateValue, observer.latitude, observer.longitude, selectedPlanet, showMandala, showConstellations]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectPlanet || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let selectedBody: string | null = null;
    let distance = 22;
    targetsRef.current.forEach(target => {
      const currentDistance = Math.hypot(x - target.point.x, y - target.point.y);
      if (currentDistance < distance) {
        distance = currentDistance;
        selectedBody = target.body.body;
      }
    });
    if (selectedBody) onSelectPlanet(selectedBody);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#03050B] ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="block h-full min-h-[320px] w-full cursor-crosshair touch-manipulation"
        role="img"
        aria-label="Stereographic local sky projection with stars and planets"
      />
      {labelled && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#060914]/85 px-3 py-1.5 text-center font-mono-data text-[9px] uppercase tracking-[0.14em] text-[#B8BED7] backdrop-blur">
          Tap a graha · dashed gold line is the ecliptic
        </div>
      )}
    </div>
  );
}

export { SkyCanvasRenderer };

export default SkyCanvasRenderer;
