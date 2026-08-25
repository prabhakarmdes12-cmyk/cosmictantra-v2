'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Crosshair, Info, MapPin, Moon, Play, Sparkles } from 'lucide-react';
import { CITIES, DEFAULT_CITY } from '@/lib/cities';
import { createObservatoryTime } from '@/lib/astronomy/time';
import { calculateCanonicalBody } from '@/lib/astronomy/ephemeris';
import { ObservatoryWorkerClient } from '@/lib/astronomy/workerClient';
import {
  tropicalLongitude,
  plotOnEclipticCircle,
  RASHI_LABELS,
  rashiForLongitude,
  degreeInRashi,
  drawRashiRing,
  drawRashiLabels,
  drawNakshatraRing,
  drawEclipticRing,
  drawDegreeLabels,
  type EclipticBody,
} from '@/lib/astronomy/eclipticProjection';
import type { ObserverLocation } from '@/lib/astronomy/types';
import type { RiseTransitSet } from '@/lib/astronomy/events';

const ECLIPTIC_BODIES: EclipticBody[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
const BODY_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☾', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄',
};

function cityObserver(city: typeof DEFAULT_CITY): ObserverLocation {
  return {
    name: `${city.name}, ${city.state}`,
    latitude: city.lat,
    longitude: city.lng,
    timezone: city.id === 'london' ? 'Europe/London' : city.id === 'newyork' ? 'America/New_York' : 'Asia/Kolkata',
    source: 'catalogue',
  };
}

function dms(deg: number) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.round((((deg - d) * 60) - m) * 60);
  return `${d}° ${String(m).padStart(2,'0')}′ ${String(s).padStart(2,'0')}″`;
}

export default function EclipticInstrument() {
  const [events, setEvents] = useState<RiseTransitSet | null>(null);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [instant, setInstant] = useState(() => new Date());
  const [live, setLive] = useState(true);
  const [selected, setSelected] = useState<EclipticBody>('Moon');
  const [details, setDetails] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setInstant(new Date()), 1000);
    return () => clearInterval(id);
  }, [live]);

  const observer = useMemo(() => cityObserver(city), [city]);
  const time = useMemo(() => createObservatoryTime(instant, observer), [instant, observer]);

  // Compute all body positions (astronomical + Jyotish)
  const bodies = useMemo(() => {
    const result: Record<string, {
      tropical: number;
      rashi: string;
      degreeInRashi: number;
      nakshatra: string;
      pada: number;
      sidereal: number;
    }> = {};
    ECLIPTIC_BODIES.forEach(body => {
      const calc = calculateCanonicalBody(body, time);
      result[body] = {
        tropical: calc.tropicalLongitude.value,
        rashi: calc.rashi,
        degreeInRashi: calc.degreeInRashi,
        nakshatra: calc.nakshatra.name,
        pada: calc.nakshatra.pada,
        sidereal: calc.siderealLongitude.value,
      };
    });
    return result;
  }, [time]);

  // Moon events from worker
  useEffect(() => {
    const worker = new ObservatoryWorkerClient();
    let active = true;
    worker.events('Moon', instant, observer).then(result => {
      if (active) setEvents(result);
    }).catch(() => {});
    return () => { active = false; worker.destroy(); };
  }, [observer, Math.floor(instant.getTime() / 60000)]);

  const eventTime = (v: string | null) =>
    v ? new Intl.DateTimeFormat('en-IN', { timeZone: observer.timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(v)) : '—';

  const offsetLabel = `${time.timezoneOffsetMinutes >= 0 ? '+' : '−'}${String(Math.floor(Math.abs(time.timezoneOffsetMinutes)/60)).padStart(2,'0')}:${String(Math.abs(time.timezoneOffsetMinutes)%60).padStart(2,'0')}`;
  const timeLabel = new Intl.DateTimeFormat('en-IN', {
    timeZone: observer.timezone, day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
  }).format(instant);

  const changeTime = (days: number) => {
    setLive(false);
    setInstant(d => new Date(d.getTime() + days * 86400000));
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const maxRadius = Math.min(W, H) * 0.42;
    const rashiInner = maxRadius * 0.72;
    const rashiOuter = maxRadius * 0.88;
    const naksInner = maxRadius * 0.55;
    const naksOuter = maxRadius * 0.68;
    const planetR = maxRadius * 0.42;

    // Background
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 1.15);
    bg.addColorStop(0, '#0e1220');
    bg.addColorStop(0.7, '#080b15');
    bg.addColorStop(1, '#040609');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Outer ring glow
    const glow = ctx.createRadialGradient(cx, cy, maxRadius * 0.85, cx, cy, maxRadius * 1.05);
    glow.addColorStop(0, 'rgba(0,0,0,0)');
    glow.addColorStop(1, 'rgba(30,20,5,0.4)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Rashi ring (alternating, with Nakshatra subdivisions)
    drawRashiRing(ctx, cx, cy, rashiInner, rashiOuter);
    drawNakshatraRing(ctx, cx, cy, naksInner, naksOuter);
    drawEclipticRing(ctx, cx, cy, maxRadius);
    drawDegreeLabels(ctx, cx, cy, maxRadius);
    drawRashiLabels(ctx, cx, cy, (rashiInner + rashiOuter) / 2);

    // Rashi boundary labels (full names)
    RASHI_LABELS.forEach((rashi, i) => {
      const theta = (rashi.startDeg + 15 - 90) * (Math.PI / 180);
      const labelR = rashiOuter + 18;
      const x = cx + labelR * Math.cos(theta);
      const y = cy + labelR * Math.sin(theta);
      ctx.save();
      ctx.font = '7px monospace';
      ctx.fillStyle = 'rgba(180,150,80,0.35)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rashi.name.substring(0, 3).toUpperCase(), x, y);
      ctx.restore();
    });

    // Plot bodies on ecliptic circle
    const projectedBodies: { name: EclipticBody; x: number; y: number; selected: boolean }[] = [];
    ECLIPTIC_BODIES.forEach(bodyName => {
      const tLon = tropicalLongitude(bodyName, instant);
      const { x, y } = plotOnEclipticCircle(tLon, cx, cy, planetR);
      projectedBodies.push({ name: bodyName, x, y, selected: bodyName === selected });
    });

    // Draw connection lines between consecutive bodies (optional, subtle)
    projectedBodies.forEach((pb, i) => {
      if (i < projectedBodies.length - 1) {
        const next = projectedBodies[i + 1];
        const t1 = tropicalLongitude(pb.name, instant);
        const t2 = tropicalLongitude(next.name, instant);
        // Only draw if not crossing 0° boundary awkwardly
        if (Math.abs(t2 - t1) < 120) {
          ctx.beginPath();
          ctx.moveTo(pb.x, pb.y);
          ctx.lineTo(next.x, next.y);
          ctx.strokeStyle = 'rgba(180,150,80,0.08)';
          ctx.lineWidth = 0.5;
          ctx.setLineDash([2, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });

    // Draw bodies
    projectedBodies.forEach(({ name, x, y, selected }) => {
      const bodyInfo = bodies[name];
      const glyph = BODY_GLYPHS[name] ?? name[0];
      const colors: Record<string, { body: string; glow: string }> = {
        Sun:     { body: '#FFE880', glow: 'rgba(255,220,60,0.4)' },
        Moon:    { body: '#E8EEFF', glow: 'rgba(200,220,255,0.35)' },
        Mercury: { body: '#C8C4B8', glow: 'rgba(200,195,180,0.3)' },
        Venus:   { body: '#F0E8C8', glow: 'rgba(240,230,200,0.3)' },
        Mars:    { body: '#FF8860', glow: 'rgba(255,120,80,0.35)' },
        Jupiter: { body: '#F0D4A8', glow: 'rgba(240,200,150,0.3)' },
        Saturn:  { body: '#D8D0A8', glow: 'rgba(220,210,170,0.25)' },
      };
      const c = colors[name] ?? { body: '#ffffff', glow: 'rgba(255,255,255,0.3)' };

      // Glow
      const gR = selected ? 22 : 14;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, gR);
      grd.addColorStop(0, c.glow);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(x, y, gR, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Body circle
      const r = selected ? 9 : 7;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = c.body;
      ctx.fill();
      if (selected) {
        ctx.strokeStyle = 'rgba(255,200,100,0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Glyph
      ctx.save();
      ctx.font = `${selected ? 13 : 10}px serif`;
      ctx.fillStyle = selected ? '#fff8e0' : 'rgba(240,230,200,0.85)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph, x, y);
      ctx.restore();

      // Rashi label below body
      if (bodyInfo) {
        const rashi = rashiForLongitude(bodyInfo.tropical);
        ctx.save();
        ctx.font = '7px monospace';
        ctx.fillStyle = selected ? 'rgba(220,200,140,0.7)' : 'rgba(180,160,120,0.45)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(rashi.substring(0, 4), x, y + r + 2);
        ctx.restore();
      }
    });

    // Center: celestial north pole indicator
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180,160,100,0.4)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,120,0.7)';
    ctx.fill();

    // "North Ecliptic Pole" label
    ctx.save();
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(160,140,90,0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEP', cx, cy + 14);
    ctx.restore();

  }, [instant, bodies, selected]);

  useEffect(() => { draw(); }, [draw]);

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

  const current = bodies[selected];
  const glyph = BODY_GLYPHS[selected] ?? '•';

  return (
    <main style={{
      minHeight: '100svh',
      background: '#060810',
      color: '#e9e4d7',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4vw',
        borderBottom: '1px solid rgba(218,185,100,.19)',
        background: '#090b10',
        flexShrink: 0,
      }}>
        <Link href="/observatory" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#eee6d4', textDecoration: 'none', fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: '.14em' }}>
          <span style={{ color: '#cba64c', border: '1px solid rgba(203,166,76,.55)', width: 25, height: 25, display: 'grid', placeItems: 'center', borderRadius: '50%', fontSize: 11 }}>✦</span>
          <span>COSMICTANTRA</span>
        </Link>
        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.2em', color: '#c7bda9', textAlign: 'center' }}>
          ECLIPTIC INSTRUMENT <em style={{ fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: 0, color: '#b99142', marginLeft: 10 }}>काशी आकाश वेधशाला</em>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#a7a38f', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Sparkles size={11} /> PLANISPHERE
          </span>
          <button onClick={() => setDetails(!details)} style={{ background: 'none', border: 'none', color: '#c7bda9', fontFamily: 'monospace', fontSize: 10, letterSpacing: '.1em', cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center' }}>
            <Info size={14} /> DETAILS
          </button>
        </div>
      </header>

      {/* Canvas area */}
      <section style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* Sky info */}
        <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 3 }}>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 9, letterSpacing: '.18em', color: '#d2b25f' }}>ECLIPTIC VIEW · {city.name.toUpperCase()}</p>
          <h1 style={{ margin: '4px 0 0', fontFamily: 'Georgia, serif', fontSize: 18, color: '#f0ebde' }}>{timeLabel}</h1>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#aaa590' }}>UTC {offsetLabel}</span>
          {!live && <strong style={{ display: 'block', fontFamily: 'monospace', fontSize: 9, color: '#f0ba64', letterSpacing: '.15em', marginTop: 4 }}>SIMULATION MODE</strong>}
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute', top: 14, right: 16, zIndex: 3,
          display: 'flex', flexDirection: 'column', gap: 4,
          fontFamily: 'monospace', fontSize: 9, color: '#b7b1a1',
        }}>
          <span style={{ color: '#a7a38f', letterSpacing: '.12em' }}>TROPICAL LONGITUDE</span>
          {ECLIPTIC_BODIES.map(b => (
            <button
              key={b}
              onClick={() => setSelected(b)}
              style={{
                background: b === selected ? 'rgba(30,24,8,0.85)' : 'transparent',
                border: b === selected ? '1px solid rgba(210,170,70,0.6)' : '1px solid rgba(180,150,80,0.2)',
                color: b === selected ? '#f0e090' : 'rgba(200,185,150,0.55)',
                fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em',
                padding: '3px 8px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', gap: 6, alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13 }}>{BODY_GLYPHS[b]}</span>
              {b}
              {bodies[b] && <span style={{ marginLeft: 'auto', color: '#a9a594', fontSize: 8 }}>{bodies[b].tropical.toFixed(2)}°</span>}
            </button>
          ))}
        </div>

        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }} />
      </section>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '8px 4vw',
        borderTop: '1px solid rgba(255,255,255,.07)',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        background: '#0a0c10', overflowX: 'auto', flexShrink: 0,
      }}>
        <button onClick={() => { setLive(true); setInstant(new Date()); }} style={{ background: 'transparent', border: 0, color: '#b7b1a1', fontFamily: 'monospace', fontSize: 10, letterSpacing: '.1em', padding: '11px 13px', display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Crosshair size={14}/> NOW
        </button>
        <button onClick={() => changeTime(-1)} style={{ background: 'transparent', border: 0, color: '#b7b1a1', fontFamily: 'monospace', fontSize: 10, letterSpacing: '.1em', padding: '11px 13px', display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <ChevronLeft size={14}/> −1D
        </button>
        <button onClick={() => changeTime(1)} style={{ background: 'transparent', border: 0, color: '#b7b1a1', fontFamily: 'monospace', fontSize: 10, letterSpacing: '.1em', padding: '11px 13px', display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          +1D <ChevronRight size={14}/>
        </button>
        <label style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '0 10px', whiteSpace: 'nowrap' }}>
          <MapPin size={13} style={{ color: '#b7b1a1' }}/>
          <select value={city.id} onChange={e => { const c = CITIES.find(x => x.id === e.target.value); if (c) setCity(c); }} style={{ background: 'transparent', border: 0, color: '#e2d9c8', fontFamily: 'monospace', fontSize: 10, outline: 'none', cursor: 'pointer' }}>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button onClick={() => setLive(false)} style={{ background: 'transparent', border: 0, color: '#b7b1a1', fontFamily: 'monospace', fontSize: 10, letterSpacing: '.1em', padding: '11px 13px', display: 'flex', gap: 5, alignItems: 'center', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Play size={12}/> TIME
        </button>
        <Link href="/observatory" style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(211,174,82,.3)', padding: '8px 14px', color: '#c8a44c', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          SKY VIEW ↗
        </Link>
      </div>

      {/* Inspector */}
      {current && (
        <article style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', alignItems: 'center', gap: 20,
          padding: '16px 4vw 20px', background: '#0a0c10', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, border: '1px solid rgba(211,174,82,.5)', display: 'grid', placeItems: 'center', borderRadius: '50%', fontSize: 22, color: '#e6eaf2' }}>{glyph}</span>
            <div>
              <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 9, letterSpacing: '.14em', color: '#d3ae5a' }}>{selected.toUpperCase()}</p>
              <h2 style={{ margin: '2px 0 0', fontFamily: 'Georgia, serif', fontSize: 16, color: '#f0ebde' }}>{current.nakshatra} <small style={{ fontFamily: 'monospace', fontSize: 9, color: '#a9a594' }}>P{current.pada}</small></h2>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 8, color: '#b99750', letterSpacing: '.07em' }}>TROPICAL (astronomy)</label>
            <b style={{ display: 'block', fontFamily: 'Georgia, serif', fontSize: 15, color: '#f0ebde', marginTop: 2 }}>{dms(current.tropical)}</b>
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#979488' }}>{rashiForLongitude(current.tropical)} · {dms(degreeInRashi(current.tropical))}</span>
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 8, color: '#b99750', letterSpacing: '.07em' }}>SIDEREAL — LAHIRI</label>
            <b style={{ display: 'block', fontFamily: 'Georgia, serif', fontSize: 15, color: '#f0ebde', marginTop: 2 }}>{dms(current.sidereal)}</b>
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#979488' }}>{current.rashi} · canonical engine</span>
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 8, color: '#b99750', letterSpacing: '.07em' }}>Δ TROP↔SIDEREAL</label>
            <b style={{ display: 'block', fontFamily: 'Georgia, serif', fontSize: 15, color: '#f0ebde', marginTop: 2 }}>{(current.sidereal - current.tropical).toFixed(3)}°</b>
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#979488' }}>≈ ayanamsha</span>
          </div>
          {selected === 'Moon' && events && (
            <div style={{ gridColumn: '1/-1', borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 10, display: 'flex', gap: 16, fontFamily: 'monospace', fontSize: 9, color: '#a9a594' }}>
              <span>MOON RISE <b style={{ color: '#e4d5b1', fontWeight: 'normal' }}>{eventTime(events.rise)}</b></span>
              <span>TRANSIT <b style={{ color: '#e4d5b1', fontWeight: 'normal' }}>{eventTime(events.transit)}</b></span>
              <span>SET <b style={{ color: '#e4d5b1', fontWeight: 'normal' }}>{eventTime(events.set)}</b></span>
              <small style={{ marginLeft: 'auto', color: '#7f7b70' }}>{events.source}</small>
            </div>
          )}
        </article>
      )}

      {/* Details */}
      {details && (
        <aside style={{
          position: 'fixed', right: 18, top: 76, width: 'min(410px,calc(100vw - 36px))',
          background: '#12151c', border: '1px solid rgba(217,184,93,.45)',
          padding: 22, boxShadow: '0 20px 60px #000', zIndex: 10,
          fontFamily: 'monospace', fontSize: 11, color: '#d5d0c2',
        }}>
          <button onClick={() => setDetails(false)} style={{ float: 'right', background: 'none', border: 'none', color: '#eee', fontSize: 21, cursor: 'pointer' }}>×</button>
          <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.16em', color: '#ddbb65', margin: '0 0 16px' }}>CALCULATION DETAILS</p>
          <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, lineHeight: 1.5 }}>
            <dt style={{ color: '#bda761' }}>Observer</dt><dd style={{ margin: 0 }}>{observer.name} · {observer.latitude.toFixed(4)}°, {observer.longitude.toFixed(4)}°</dd>
            <dt style={{ color: '#bda761' }}>Time / UTC</dt><dd style={{ margin: 0 }}>{observer.timezone} · {time.utcInstant}</dd>
            <dt style={{ color: '#bda761' }}>Julian date</dt><dd style={{ margin: 0 }}>{time.julianDate.toFixed(6)}</dd>
            <dt style={{ color: '#bda761' }}>View</dt><dd style={{ margin: 0 }}>Top-down ecliptic planisphere (North Ecliptic Pole)</dd>
            <dt style={{ color: '#bda761' }}>Frame</dt><dd style={{ margin: 0 }}>Tropical ecliptic longitude (astronomy-engine Ecliptic())</dd>
            <dt style={{ color: '#bda761' }}>Ring layers</dt><dd style={{ margin: 0 }}>Outer: 10° tick marks. Rashi ring (alternating). Nakshatra ring (27 divisions). Planet positions at 0.42R.</dd>
            <dt style={{ color: '#bda761' }}>Astronomy src</dt><dd style={{ margin: 0 }}>astronomy-engine MIT · {current?.tropical?.toFixed(4)}°</dd>
            <dt style={{ color: '#bda761' }}>Jyotish src</dt><dd style={{ margin: 0 }}>CosmicTantra canonical engine · {current?.sidereal?.toFixed(4)}°</dd>
            <dt style={{ color: '#bda761' }}>Policy</dt><dd style={{ margin: 0 }}>Display resolution ≠ accuracy. No precision claims.</dd>
          </dl>
        </aside>
      )}
    </main>
  );
}
