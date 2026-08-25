'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import CelestialDetailSheet from './CelestialDetailSheet';
import {
  ECLIPTIC_NAKSHATRAS,
  getNakshatraForLongitude,
  getRashiForLongitude,
  plotEclipticPosition,
  RASHI_GLYPHS,
  RASHI_NAMES,
} from '@/lib/astronomy/eclipticProjection';
import { calculateCanonicalBodies, type CanonicalBody, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import type { CelestialSelection } from '@/lib/astronomy/celestialCatalog';
import type { ObserverLocation } from '@/lib/astronomy/projection';

export interface EclipticInstrumentProps {
  date: string | Date;
  ayanamsha?: number;
  selectedPlanet?: string | null;
  onSelectPlanet?: (body: string) => void;
  onSelectObject?: (selection: CelestialSelection) => void;
  observer?: ObserverLocation;
  cityId?: string;
  initialSelection?: CelestialSelection | null;
  className?: string;
}

const DISPLAY_BODIES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const PLANET_COLORS: Record<string, string> = {
  Sun: '#F2B84B', Moon: '#E6EEF8', Mars: '#E2745A', Mercury: '#86C7B8',
  Jupiter: '#D8A16B', Venus: '#F5B7D2', Saturn: '#AFA6D9',
};
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

function validDate(value: string | Date): Date {
  const result = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(result.getTime()) ? result : new Date();
}

function drawPlanisphere(
  canvas: HTMLCanvasElement,
  date: Date,
  ayanamsha: number,
  selectedPlanet: string | null | undefined,
): Map<string, { x: number; y: number; body: CanonicalBody }> {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, rect.width || 680);
  const height = Math.max(300, rect.height || width);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  const targets = new Map<string, { x: number; y: number; body: CanonicalBody }>();
  if (!ctx) return targets;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.min(width, height) / 2 - 20;
  const rashiRadius = outerRadius - 22;
  const nakshatraRadius = outerRadius - 52;
  const planetRadius = Math.max(50, outerRadius - 92);

  const background = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
  background.addColorStop(0, '#131A36');
  background.addColorStop(1, '#040611');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = 'rgba(212,175,55,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(139,139,245,0.44)';
  ctx.lineWidth = 1;
  [rashiRadius, nakshatraRadius, planetRadius].forEach(radius => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();

  // Twelve 30-degree rashi sectors.
  for (let index = 0; index < 12; index += 1) {
    const start = (index * 30 - 90) * Math.PI / 180;
    const end = ((index + 1) * 30 - 90) * Math.PI / 180;
    ctx.save();
    ctx.strokeStyle = index % 3 === 0 ? 'rgba(212,175,55,0.58)' : 'rgba(255,255,255,0.14)';
    ctx.lineWidth = index % 3 === 0 ? 1.4 : 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + nakshatraRadius * Math.cos(start), cy + nakshatraRadius * Math.sin(start));
    ctx.lineTo(cx + outerRadius * Math.cos(start), cy + outerRadius * Math.sin(start));
    ctx.stroke();
    ctx.fillStyle = 'rgba(246,229,165,0.94)';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = plotEclipticPosition(index * 30 + 15, cx, cy, outerRadius - 11);
    ctx.fillText(RASHI_GLYPHS[index], label.x, label.y);
    ctx.fillStyle = 'rgba(210,216,240,0.72)';
    ctx.font = '8px "JetBrains Mono", monospace';
    const name = plotEclipticPosition(index * 30 + 15, cx, cy, rashiRadius + 9);
    ctx.fillText(RASHI_NAMES[index], name.x, name.y);
    ctx.restore();
  }

  // Twenty-seven Nakshatra subdivisions on the inner ring.
  for (let index = 0; index < 27; index += 1) {
    // Nakshatra zero is sidereal 0°; draw its tropical position by adding the
    // displayed ayanamsha so the inner ring agrees with the inspector.
    const longitude = index * (360 / 27) + ayanamsha;
    const boundary = plotEclipticPosition(longitude, cx, cy, nakshatraRadius);
    const outer = plotEclipticPosition(longitude, cx, cy, rashiRadius);
    ctx.save();
    ctx.strokeStyle = index % 3 === 0 ? 'rgba(180,187,255,0.46)' : 'rgba(180,187,255,0.18)';
    ctx.lineWidth = index % 3 === 0 ? 1 : 0.6;
    ctx.beginPath();
    ctx.moveTo(boundary.x, boundary.y);
    ctx.lineTo(outer.x, outer.y);
    ctx.stroke();
    const label = plotEclipticPosition(longitude + (360 / 27) / 2, cx, cy, nakshatraRadius - 12);
    ctx.fillStyle = 'rgba(194,201,230,0.60)';
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ECLIPTIC_NAKSHATRAS[index].slice(0, 3), label.x, label.y);
    ctx.restore();
  }

  const bodies = calculateCanonicalBodies(date).filter(body => DISPLAY_BODIES.includes(body.body));
  bodies.forEach(body => {
    const point = plotEclipticPosition(body.tropicalLongitude, cx, cy, planetRadius);
    targets.set(body.body, { x: point.x, y: point.y, body });
    const color = PLANET_COLORS[body.body] || '#D4AF37';
    const selected = body.body === selectedPlanet;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = selected ? 18 : 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, selected ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (selected) {
      ctx.strokeStyle = '#F6E5A5';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#07101C';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PLANET_SYMBOLS[body.body], point.x, point.y);
    ctx.fillStyle = selected ? '#F6E5A5' : '#D4D9EE';
    ctx.font = selected ? 'bold 10px "JetBrains Mono", monospace' : '8px "JetBrains Mono", monospace';
    ctx.fillText(body.body, point.x, point.y - 14);
  });

  ctx.fillStyle = 'rgba(236,239,255,0.48)';
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TROPICAL ECLIPTIC · 0° ARIES AT TOP', cx, cy);
  return targets;
}

function formatLongitude(longitude: number): string {
  const degrees = Math.floor(longitude);
  const minutes = Math.floor((longitude - degrees) * 60);
  return `${String(degrees).padStart(3, '0')}° ${String(minutes).padStart(2, '0')}′`;
}

function EclipticInstrument({
  date,
  ayanamsha = 23.86,
  selectedPlanet: selectedPlanetProp,
  onSelectPlanet,
  onSelectObject,
  observer = { latitude: 25.3176, longitude: 82.9739 },
  cityId = 'varanasi',
  initialSelection = null,
  className = '',
}: EclipticInstrumentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetsRef = useRef<Map<string, { x: number; y: number; body: CanonicalBody }>>(new Map());
  const [selectedPlanet, setSelectedPlanet] = useState(initialSelection?.kind === 'planet' ? initialSelection.id : selectedPlanetProp || 'Sun');
  const [detailSelection, setDetailSelection] = useState<CelestialSelection | null>(initialSelection);
  const dateValue = date instanceof Date ? date.toISOString() : date;
  const bodies = useMemo(() => calculateCanonicalBodies(validDate(dateValue)), [dateValue]);
  const selectedBody = bodies.find(body => body.body === selectedPlanet) || bodies[0];

  useEffect(() => {
    if (selectedPlanetProp && selectedPlanetProp !== selectedPlanet) setSelectedPlanet(selectedPlanetProp);
  }, [selectedPlanetProp, selectedPlanet]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const render = () => {
      targetsRef.current = drawPlanisphere(canvas, validDate(dateValue), ayanamsha, selectedPlanet);
    };
    render();
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [dateValue, ayanamsha, selectedPlanet]);

  const choose = (body: string) => {
    const next = bodies.find(item => item.body === body);
    if (!next) return;
    const selection: CelestialSelection = { kind: 'planet', id: next.body as CanonicalBodyName };
    setSelectedPlanet(next.body);
    if (!onSelectObject) setDetailSelection(selection);
    onSelectPlanet?.(next.body);
    onSelectObject?.(selection);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let nearestKey: string | null = null;
    let nearestDistance = 24;
    targetsRef.current.forEach((target, key) => {
      const distance = Math.hypot(x - target.x, y - target.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestKey = key;
      }
    });
    if (nearestKey) choose(nearestKey);
  };

  const rashi = getRashiForLongitude(selectedBody.siderealLongitude);
  const nakshatra = getNakshatraForLongitude(selectedBody.siderealLongitude);
  const delta = selectedBody.ayanamsha;

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#03050B] p-2">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="block h-[min(78vw,680px)] min-h-[320px] w-full cursor-crosshair touch-manipulation"
            role="img"
            aria-label="Top-down ecliptic planisphere with rashis, nakshatras, and planets"
          />
        </div>

        <aside className="rounded-2xl border border-white/[0.09] bg-[#090D1A] p-5 text-[#E9ECF9]">
          <div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Graha inspector</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl">{PLANET_SYMBOLS[selectedBody.body]}</span>
            <div>
              <h2 className="font-editorial text-xl font-bold">{selectedBody.body}</h2>
              <p className="font-mono-data text-[10px] text-[#9DA6C4]">{selectedBody.isRetrograde ? 'retrograde' : 'direct'} · {selectedBody.source}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#AAB2CC]">Tropical</dt><dd className="font-mono-data font-bold">{formatLongitude(selectedBody.tropicalLongitude)}</dd></div>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#AAB2CC]">Sidereal</dt><dd className="font-mono-data font-bold">{formatLongitude(selectedBody.siderealLongitude)}</dd></div>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#AAB2CC]">Δ ayanamsha</dt><dd className="font-mono-data font-bold text-[#F2C65D]">{delta.toFixed(3)}°</dd></div>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#AAB2CC]">Rashi</dt><dd className="font-bold">{rashi.glyph} {rashi.name}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-[#AAB2CC]">Nakshatra</dt><dd className="font-bold">{nakshatra.name} · P{nakshatra.pada}</dd></div>
          </dl>
          <p className="mt-5 text-[10px] leading-relaxed text-[#8E97B5]">The outer zodiac is tropical for astronomy; the inspector subtracts Lahiri ayanamsha for the Vedic rashi and nakshatra reading.</p>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Planet selector">
        {DISPLAY_BODIES.map(body => (
          <button
            key={body}
            type="button"
            onClick={() => choose(body)}
            className={`rounded-full border px-3 py-2 font-mono-data text-[10px] font-bold transition-colors ${body === selectedPlanet ? 'border-[#D4AF37] bg-[#D4AF37] text-[#070912]' : 'border-white/10 bg-[#0B1020] text-[#CAD0E7] hover:border-[#D4AF37]/70'}`}
          >
            {PLANET_SYMBOLS[body]} {body}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] text-[#99A2BF] sm:grid-cols-4">
        <div className="rounded-lg border border-white/[0.07] bg-[#090D1A] px-3 py-2">{RASHI_NAMES.length} rashi sectors</div>
        <div className="rounded-lg border border-white/[0.07] bg-[#090D1A] px-3 py-2">{ECLIPTIC_NAKSHATRAS.length} nakshatra arcs</div>
        <div className="rounded-lg border border-white/[0.07] bg-[#090D1A] px-3 py-2">{formatLongitude(selectedBody.tropicalLongitude)} tropical</div>
        <div className="rounded-lg border border-white/[0.07] bg-[#090D1A] px-3 py-2">Lahiri {ayanamsha.toFixed(2)}°</div>
      </div>
      {detailSelection && <CelestialDetailSheet selection={detailSelection} date={dateValue} observer={observer} cityId={cityId} onClose={() => setDetailSelection(null)} />}
    </div>
  );
}

export { EclipticInstrument };

export default EclipticInstrument;
