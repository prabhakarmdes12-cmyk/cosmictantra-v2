'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import CanvasViewControls from './CanvasViewControls';
import CelestialDetailSheet from './CelestialDetailSheet';
import {
  clampViewportTransform,
  DEFAULT_VIEWPORT_TRANSFORM,
  zoomViewportAt,
  type ViewportPoint,
  type ViewportTransform,
} from '@/lib/astronomy/viewTransform';
import { calculateCanonicalBody, type CanonicalBody, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import type { CelestialSelection } from '@/lib/astronomy/celestialCatalog';
import { getRashiForLongitude } from '@/lib/astronomy/eclipticProjection';
import { CITIES } from '@/lib/cities';

const BODIES: CanonicalBodyName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SYMBOLS: Record<string, string> = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋' };
const COLORS: Record<string, string> = { Sun: '#F2B84B', Moon: '#E6EEF8', Mars: '#E2745A', Mercury: '#86C7B8', Jupiter: '#D8A16B', Venus: '#F5B7D2', Saturn: '#AFA6D9', Rahu: '#B38BEA', Ketu: '#E19A72' };

type City = { id: string; name: string; lat: number; lng: number; tz: number };

function findCity(id?: string): City {
  const cities = CITIES as City[];
  return cities.find(city => city.id === id) || cities.find(city => city.id === 'varanasi') || cities[0];
}

function validDate(value?: string): Date {
  const result = value ? new Date(value) : new Date();
  return Number.isFinite(result.getTime()) ? result : new Date();
}

function dateInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function drawRashiWheel(canvas: HTMLCanvasElement, positions: CanonicalBody[], selected: CanonicalBodyName, view: ViewportTransform): void {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(260, rect.width || 360);
  const height = Math.max(260, rect.height || width);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 15;
  const innerRadius = radius * 0.43;

  ctx.fillStyle = '#070A13';
  ctx.fillRect(0, 0, width, height);
  const viewport = clampViewportTransform(view, width, height);
  ctx.save();
  ctx.translate(width / 2 + viewport.offsetX, height / 2 + viewport.offsetY);
  ctx.scale(viewport.scale, viewport.scale);
  ctx.translate(-width / 2, -height / 2);
  ctx.strokeStyle = 'rgba(212,175,55,0.52)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(139,139,245,0.35)';
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  for (let sign = 0; sign < 12; sign += 1) {
    const start = (sign * 30 - 90) * Math.PI / 180;
    const end = ((sign + 1) * 30 - 90) * Math.PI / 180;
    ctx.fillStyle = sign % 2 === 0 ? 'rgba(48,55,91,0.20)' : 'rgba(20,27,53,0.20)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = sign % 3 === 0 ? 'rgba(212,175,55,0.48)' : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = sign % 3 === 0 ? 1.2 : 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(start), cy + radius * Math.sin(start));
    ctx.stroke();
    const angle = (sign * 30 + 15 - 90) * Math.PI / 180;
    ctx.fillStyle = '#D7DCEF';
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getRashiForLongitude(sign * 30 + 15).glyph, cx + (radius - 20) * Math.cos(angle), cy + (radius - 20) * Math.sin(angle));
    ctx.fillStyle = 'rgba(171,181,213,0.78)';
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.fillText(getRashiForLongitude(sign * 30 + 15).name, cx + (radius - 42) * Math.cos(angle), cy + (radius - 42) * Math.sin(angle));
  }

  const bySign = new Map<number, CanonicalBody[]>();
  positions.forEach(body => {
    const sign = getRashiForLongitude(body.siderealLongitude).index;
    const list = bySign.get(sign) || [];
    list.push(body);
    bySign.set(sign, list);
  });
  bySign.forEach((bodies, sign) => {
    const centerAngle = (sign * 30 + 15 - 90) * Math.PI / 180;
    bodies.forEach((body, index) => {
      const spread = (index - (bodies.length - 1) / 2) * 11;
      const angle = centerAngle + spread * Math.PI / 180;
      const orbitRadius = innerRadius + 20;
      const x = cx + orbitRadius * Math.cos(angle);
      const y = cy + orbitRadius * Math.sin(angle);
      const selectedBody = body.body === selected;
      ctx.fillStyle = COLORS[body.body] || '#D4AF37';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = selectedBody ? 12 : 5;
      ctx.beginPath();
      ctx.arc(x, y, selectedBody ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (selectedBody) {
        ctx.strokeStyle = '#F6E5A5';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#09101D';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText(SYMBOLS[body.body], x, y);
    });
  });
  ctx.fillStyle = 'rgba(214,220,244,0.72)';
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillText('SIDEREAL · LAHIRI', cx, cy);
  ctx.restore();
}

interface RashiWheelProps {
  label: string;
  positions: CanonicalBody[];
  selected: CanonicalBodyName;
}

function RashiWheel({ label, positions, selected }: RashiWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<ViewportTransform>(DEFAULT_VIEWPORT_TRANSFORM);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const pointersRef = useRef<Map<number, ViewportPoint>>(new Map());
  const pinchRef = useRef<{ distance: number; center: ViewportPoint; transform: ViewportTransform } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawRashiWheel(canvas, positions, selected, view);
    draw();
    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [positions, selected, view.scale, view.offsetX, view.offsetY]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>): ViewportPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const zoomAtEvent = (event: React.WheelEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>, factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setView(current => zoomViewportAt(current, current.scale * factor, { x: event.clientX - rect.left, y: event.clientY - rect.top }, rect.width, rect.height));
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
      pinchRef.current = { distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)), center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }, transform: view };
      dragRef.current = null;
    }
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    const point = pointFromEvent(event);
    pointersRef.current.set(event.pointerId, point);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [first, second] = [...pointersRef.current.values()];
      const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
      const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      const base = pinchRef.current;
      setView(() => {
        const zoomed = zoomViewportAt(base.transform, base.transform.scale * distance / base.distance, base.center, rect.width, rect.height);
        return clampViewportTransform({ ...zoomed, offsetX: zoomed.offsetX + center.x - base.center.x, offsetY: zoomed.offsetY + center.y - base.center.y }, rect.width, rect.height);
      });
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setView(current => clampViewportTransform({ ...current, offsetX: drag.offsetX + point.x - drag.x, offsetY: drag.offsetY + point.y - drag.y }, rect.width, rect.height));
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

  return (
    <div className="relative rounded-2xl border border-white/[0.09] bg-[#070A13] p-3">
      <div className="mb-2 px-1 font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">{label}</div>
      <canvas
        ref={canvasRef}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="block h-[min(76vw,430px)] min-h-[270px] w-full cursor-grab touch-none active:cursor-grabbing"
        tabIndex={0}
        title="Focus the rashi wheel, then use plus/minus, arrow keys, R, or 0 to navigate"
        role="img"
        aria-label={`${label} sidereal rashi wheel. Use the zoom controls or drag to inspect the wheel.`}
      />
      <div className="pointer-events-none absolute right-5 top-5">
        <CanvasViewControls zoom={view.scale} onZoomIn={() => zoomBy(1.35)} onZoomOut={() => zoomBy(1 / 1.35)} onReset={() => setView(DEFAULT_VIEWPORT_TRANSFORM)} label={`${label} zoom and pan controls`} />
      </div>
      {view.scale > 1 && <div className="pointer-events-none absolute left-5 top-10 rounded-lg border border-white/10 bg-[#060914]/85 px-2.5 py-1.5 font-mono-data text-[9px] uppercase tracking-[0.12em] text-[#AAB4CF] backdrop-blur">Drag to pan · double-click to zoom</div>}
    </div>
  );
}

export interface GocharaProps {
  initialCity?: string;
  initialTime?: string;
  initialPlanet?: string;
  initialSelection?: CelestialSelection | null;
}

function Gochara({ initialCity, initialTime, initialPlanet, initialSelection = null }: GocharaProps) {
  const city = useMemo(() => findCity(initialCity), [initialCity]);
  const now = useMemo(() => validDate(initialTime), [initialTime]);
  const [birthDate, setBirthDate] = useState<Date>(() => new Date('1995-06-15T10:30:00'));
  const initialPlanetSelection = initialSelection?.kind === 'planet' ? initialSelection.id : null;
  const [selected, setSelected] = useState<CanonicalBodyName>(() => BODIES.find(body => body.toLowerCase() === (initialPlanetSelection || initialPlanet || '').toLowerCase()) || 'Moon');
  const [detailSelection, setDetailSelection] = useState<CelestialSelection | null>(initialSelection);
  const birthPositions = useMemo(() => BODIES.map(body => calculateCanonicalBody(body, birthDate)), [birthDate]);
  const currentPositions = useMemo(() => BODIES.map(body => calculateCanonicalBody(body, now)), [now]);
  const birthSelected = birthPositions.find(body => body.body === selected)!;
  const currentSelected = currentPositions.find(body => body.body === selected)!;
  const natalMoonSign = getRashiForLongitude(birthPositions.find(body => body.body === 'Moon')!.siderealLongitude).index;
  const currentSign = getRashiForLongitude(currentSelected.siderealLongitude);
  const transitHouse = ((currentSign.index - natalMoonSign + 12) % 12) + 1;
  const signedDelta = ((currentSelected.siderealLongitude - birthSelected.siderealLongitude + 540) % 360) - 180;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('city', city.id);
    params.set('time', now.toISOString());
    params.set('planet', selected);
    if (detailSelection) {
      params.set('object', detailSelection.id);
      params.set('objectKind', detailSelection.kind);
    } else {
      params.delete('object');
      params.delete('objectKind');
    }
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
  }, [city.id, now, selected, detailSelection]);

  const updateBirth = (value: string) => {
    const next = new Date(value);
    if (Number.isFinite(next.getTime())) setBirthDate(next);
  };

  const openBody = (body: CanonicalBodyName) => {
    setSelected(body);
    setDetailSelection({ kind: 'planet', id: body });
  };

  return (
    <main className="min-h-screen bg-[#05060B] text-[#ECEAF1]">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="flex flex-col gap-4 border-b border-white/[0.09] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">गोचर · sidereal transit comparison</div><h1 className="mt-2 font-editorial text-3xl font-bold sm:text-4xl">Gochara — the moving sky</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#AEB4C8]">Compare the natal rashi wheel with the current sky. Select any of the nine grahas, including the mathematical Rahu and Ketu nodes, for a focused transit reading.</p></div>
          <Link href={`/observatory?city=${city.id}&time=${encodeURIComponent(now.toISOString())}&planet=${selected}`} className="font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#F2C65D] hover:underline">← Local sky</Link>
        </header>

        <section className="grid gap-4 rounded-2xl border border-white/[0.09] bg-[#0A0D18] p-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#9DA6C4]">Birth date and time<input type="datetime-local" value={dateInput(birthDate)} onChange={event => updateBirth(event.target.value)} className="mt-2 block w-full max-w-md rounded-xl border border-white/10 bg-[#050710] px-3 py-3 text-xs font-normal text-[#F0F1F8] outline-none focus:border-[#D4AF37]" /></label>
          <div className="font-mono-data text-[10px] text-[#929CB8]">{city.name} · transit endpoint {now.toISOString()}</div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <RashiWheel label={`Natal / birth · ${birthDate.toLocaleDateString('en-IN')}`} positions={birthPositions} selected={selected} />
          <RashiWheel label={`Gochara / now · ${now.toLocaleDateString('en-IN')}`} positions={currentPositions} selected={selected} />
        </section>

        <section className="flex flex-wrap gap-2" aria-label="Gochara planet selector">
          {BODIES.map(body => {
            const birthSign = getRashiForLongitude(birthPositions.find(item => item.body === body)!.siderealLongitude).index;
            const currentSignIndex = getRashiForLongitude(currentPositions.find(item => item.body === body)!.siderealLongitude).index;
            return <button type="button" key={body} onClick={() => openBody(body)} aria-label={`Open ${body} celestial details`} className={`rounded-full border px-3 py-2 font-mono-data text-[10px] font-bold transition-colors ${selected === body ? 'border-[#D4AF37] bg-[#D4AF37] text-[#070912]' : 'border-white/10 bg-[#0B1020] text-[#CAD0E7] hover:border-[#D4AF37]/70'}`}>{SYMBOLS[body]} {body} <span className={birthSign === currentSignIndex ? 'text-[#91C7A5]' : 'text-[#F3A66A]'}>{birthSign === currentSignIndex ? '·' : '↗'}</span></button>;
          })}
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-x-auto rounded-2xl border border-white/[0.09] bg-[#090D1A]">
            <div className="border-b border-white/[0.08] px-4 py-4"><h2 className="font-editorial text-xl font-bold">Nine-graha comparison</h2><p className="mt-1 font-mono-data text-[10px] text-[#8993B0]">Birth rashi versus endpoint rashi · green dot means no sign change</p></div>
            <table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-[#070A13] font-mono-data text-[9px] uppercase tracking-[0.14em] text-[#8993B0]"><tr><th className="px-4 py-3">Graha</th><th className="px-4 py-3">Birth rashi</th><th className="px-4 py-3">Current rashi</th><th className="px-4 py-3">Δ sidereal</th></tr></thead><tbody>{BODIES.map(body => { const birth = birthPositions.find(item => item.body === body)!; const current = currentPositions.find(item => item.body === body)!; const oldRashi = getRashiForLongitude(birth.siderealLongitude); const newRashi = getRashiForLongitude(current.siderealLongitude); const moved = oldRashi.index !== newRashi.index; const delta = ((current.siderealLongitude - birth.siderealLongitude + 540) % 360) - 180; return <tr key={body} className="border-t border-white/[0.07]"><td className="px-4 py-3 font-mono-data font-bold text-[#DCE0EF]">{SYMBOLS[body]} {body}</td><td className="px-4 py-3 text-[#B9C0D6]">{oldRashi.glyph} {oldRashi.name}</td><td className={`px-4 py-3 ${moved ? 'text-[#F3A66A]' : 'text-[#B9C0D6]'}`}>{newRashi.glyph} {newRashi.name} {moved ? '↗' : '·'}</td><td className="px-4 py-3 font-mono-data text-[10px] text-[#AAB3CC]">{delta >= 0 ? '+' : ''}{delta.toFixed(2)}°</td></tr>; })}</tbody></table>
          </div>

          <aside className="rounded-2xl border border-[#D4AF37]/30 bg-[#0B1020] p-5"><div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Selected transit</div><div className="mt-3 flex items-center gap-2"><span className="text-3xl">{SYMBOLS[selected]}</span><div><h2 className="font-editorial text-xl font-bold">{selected}</h2><p className="font-mono-data text-[9px] uppercase tracking-wider text-[#8993B0]">{currentSelected.isRetrograde ? 'retrograde' : 'direct'} · {currentSelected.source}</p></div></div><dl className="mt-5 space-y-3 text-xs"><div className="flex justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#9DA6C4]">Birth sidereal</dt><dd className="font-mono-data">{birthSelected.siderealLongitude.toFixed(3)}°</dd></div><div className="flex justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#9DA6C4]">Current sidereal</dt><dd className="font-mono-data text-[#F2C65D]">{currentSelected.siderealLongitude.toFixed(3)}°</dd></div><div className="flex justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#9DA6C4]">Signed movement</dt><dd className="font-mono-data">{signedDelta >= 0 ? '+' : ''}{signedDelta.toFixed(3)}°</dd></div><div className="flex justify-between gap-3"><dt className="text-[#9DA6C4]">From natal Moon</dt><dd className="font-bold">House {transitHouse}</dd></div></dl><p className="mt-5 text-[10px] leading-relaxed text-[#8F99B5]">Gochara house is counted from the natal Moon rashi, a traditional transit reference. It is a computational comparison, not a complete Jyotish judgement.</p></aside>
        </section>
      </div>
      {detailSelection && <CelestialDetailSheet selection={detailSelection} date={now} observer={{ latitude: city.lat, longitude: city.lng }} cityId={city.id} cityName={city.name} onClose={() => setDetailSelection(null)} />}
    </main>
  );
}

export { Gochara };

export default Gochara;
