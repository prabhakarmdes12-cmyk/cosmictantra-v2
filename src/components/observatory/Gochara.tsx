'use client';

/**
 * Gochara — Planetary Transit Report.
 *
 * Shows planetary rashis at birth vs now.
 * Each planet's rashi change since birth is highlighted.
 * The Gochara wheel shows the current position in context of the birth chart.
 *
 * Astronomy: astronomy-engine. Jyotish: canonical engine.
 * No LLM generates positions. No birth data leaves client.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Info, Sparkles } from 'lucide-react';
import { CITIES, DEFAULT_CITY } from '@/lib/cities';
import { createObservatoryTime } from '@/lib/astronomy/time';
import { calculateCanonicalBody } from '@/lib/astronomy/ephemeris';
import { RASHI_LABELS } from '@/lib/astronomy/eclipticProjection';
import type { ObserverLocation } from '@/lib/astronomy/types';

const PLANET_BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'] as const;
const GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☾', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};
const RASHI_GLYPHS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
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

function formatDate(d: Date) {
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function parseBirthDate(val: string, time: string): Date | null {
  if (!val || !time) return null;
  const [y, mo, d] = val.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  if ([y, mo, d, h, mi].some(isNaN)) return null;
  return new Date(Date.UTC(y!, (mo ?? 1) - 1, d!, h!, mi!));
}

function dms(deg: number) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.round((((deg - d) * 60) - m) * 60);
  return `${d}°${String(m).padStart(2,'0')}′${String(s).padStart(2,'0')}″`;
}

function yearsBetween(a: Date, b: Date): string {
  const ms = Math.abs(b.getTime() - a.getTime());
  const days = ms / 86400000;
  const years = days / 365.25;
  return `${years.toFixed(1)} years`;
}

interface PlanetPosition {
  body: string;
  tropical: number;
  rashi: string;
  rashiIndex: number;
  degreeInRashi: number;
  sidereal: number;
  nakshatra: string;
  pada: number;
}

function getPosition(body: string, instant: Date, location: ObserverLocation): PlanetPosition {
  const time = createObservatoryTime(instant, location);
  const calc = calculateCanonicalBody(body as 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn', time);
  return {
    body,
    tropical: calc.tropicalLongitude.value,
    rashi: calc.rashi,
    rashiIndex: RASHI_LABELS.findIndex(r => r.name === calc.rashi),
    degreeInRashi: calc.degreeInRashi,
    sidereal: calc.siderealLongitude.value,
    nakshatra: calc.nakshatra.name,
    pada: calc.nakshatra.pada,
  };
}

/** Draw a mini rashi wheel on canvas (birth or current) */
function drawRashiWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  positions: PlanetPosition[],
  title: string,
  highlightBody?: string | null
) {
  const rashiOuter = radius * 0.92;
  const rashiInner = radius * 0.72;
  const planetR = radius * 0.5;

  // Background circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#080b15';
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,140,60,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Rashi segments
  RASHI_LABELS.forEach((rashi, i) => {
    const startAngle = (rashi.startDeg - 90) * Math.PI / 180;
    const endAngle = ((rashi.startDeg + 30) - 90) * Math.PI / 180;

    ctx.beginPath();
    ctx.arc(cx, cy, rashiOuter, startAngle, endAngle);
    ctx.arc(cx, cy, rashiInner, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? 'rgba(30,25,12,0.5)' : 'rgba(15,20,30,0.4)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,140,60,0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Rashi glyph at midpoint
    const midAngle = (rashi.startDeg + 15 - 90) * Math.PI / 180;
    const gx = cx + (rashiInner + 4) * Math.cos(midAngle);
    const gy = cy + (rashiInner + 4) * Math.sin(midAngle);
    ctx.font = 'bold 14px serif';
    ctx.fillStyle = 'rgba(200,180,120,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rashi.glyph, gx, gy);
  });

  // Outer ring with ticks
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(220,180,80,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Plot planets on wheel
  positions.forEach(pos => {
    if (pos.rashiIndex < 0) return;
    const angle = (pos.rashiIndex * 30 + pos.degreeInRashi - 90) * Math.PI / 180;
    const px = cx + planetR * Math.cos(angle);
    const py = cy + planetR * Math.sin(angle);
    const isHighlight = pos.body === highlightBody;
    const glyph = GLYPHS[pos.body] ?? pos.body[0];

    // Glow
    if (isHighlight) {
      const gR = ctx.createRadialGradient(px, py, 0, px, py, 18);
      gR.addColorStop(0, 'rgba(255,200,80,0.4)');
      gR.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fillStyle = gR;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(px, py, isHighlight ? 9 : 6, 0, Math.PI * 2);
    ctx.fillStyle = isHighlight ? '#FFE880' : '#E8EEFF';
    ctx.fill();

    ctx.font = `${isHighlight ? 13 : 10}px serif`;
    ctx.fillStyle = isHighlight ? '#fff8e0' : 'rgba(240,230,200,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, px, py);
  });

  // Title
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(180,150,80,0.6)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, cx, cy + radius + 8);
}

export default function Gochara() {
  const [city] = useState(DEFAULT_CITY);
  const observer = useMemo(() => cityObserver(city), [city]);

  // Birth input
  const [birthInput, setBirthInput] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 26);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return formatDate(d);
  });
  const [birthTime, setBirthTime] = useState('06:00');
  const [birthInstant, setBirthInstant] = useState<Date | null>(() => parseBirthDate(birthInput, birthTime));

  const nowInstant = useMemo(() => new Date(), []);
  const birth = birthInstant ?? nowInstant;
  const age = yearsBetween(birth, nowInstant);

  // Calculate positions at birth and now
  const birthPositions = useMemo(() =>
    PLANET_BODIES.map(body => getPosition(body, birth, observer)),
    [birth, observer]
  );
  const nowPositions = useMemo(() =>
    PLANET_BODIES.map(body => getPosition(body, nowInstant, observer)),
    [nowInstant, observer]
  );

  // Planet-by-planet comparison
  const comparisons = useMemo(() =>
    PLANET_BODIES.map((body, i) => ({
      body,
      birth: birthPositions[i],
      now: nowPositions[i],
      rashiChanged: birthPositions[i].rashi !== nowPositions[i].rashi,
      rashiChangeCount: (() => {
        const bIdx = birthPositions[i].rashiIndex;
        const nIdx = nowPositions[i].rashiIndex;
        const diff = ((nIdx - bIdx + 12) % 12);
        return diff;
      })(),
    })),
    [birthPositions, nowPositions]
  );

  const [selected, setSelected] = useState<string>('Moon');
  const birthCanvasRef = useRef<HTMLCanvasElement>(null);
  const nowCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawWheels = useCallback(() => {
    const bCanvas = birthCanvasRef.current;
    const nCanvas = nowCanvasRef.current;
    if (!bCanvas || !nCanvas) return;

    [bCanvas, nCanvas].forEach(canvas => {
      canvas.width = canvas.parentElement?.clientWidth ?? 200;
      canvas.height = canvas.parentElement?.clientHeight ?? 200;
    });

    const bCtx = bCanvas.getContext('2d');
    const nCtx = nCanvas.getContext('2d');
    if (!bCtx || !nCtx) return;

    const bR = Math.min(bCanvas.width, bCanvas.height) * 0.45;
    const nR = Math.min(nCanvas.width, nCanvas.height) * 0.45;
    const bCX = bCanvas.width / 2;
    const bCY = bCanvas.height / 2;
    const nCX = nCanvas.width / 2;
    const nCY = nCanvas.height / 2;

    drawRashiWheel(bCtx, bCX, bCY, bR, birthPositions, `BIRTH · ${formatDate(birth)}`, selected);
    drawRashiWheel(nCtx, nCX, nCY, nR, nowPositions, `CURRENT · ${formatDate(nowInstant)}`, selected);
  }, [birthPositions, nowPositions, birth, nowInstant, selected]);

  useEffect(() => { drawWheels(); }, [drawWheels]);
  useEffect(() => {
    const handleResize = () => drawWheels();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheels]);

  const selectedComparison = comparisons.find(c => c.body === selected);

  return (
    <main style={{ minHeight: '100svh', background: '#060810', color: '#e9e4d7', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4vw', borderBottom: '1px solid rgba(218,185,100,.19)', background: '#090b10', flexShrink: 0 }}>
        <Link href="/observatory" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#eee6d4', textDecoration: 'none', fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: '.14em' }}>
          <span style={{ color: '#cba64c', border: '1px solid rgba(203,166,76,.55)', width: 25, height: 25, display: 'grid', placeItems: 'center', borderRadius: '50%', fontSize: 11 }}>✦</span>
          COSMICTANTRA
        </Link>
        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.2em', color: '#c7bda9', textAlign: 'center' }}>
          GOCHARA <em style={{ fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: 0, color: '#b99142', marginLeft: 10 }}>गोचर</em>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#a7a38f', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Sparkles size={11}/> TRANSIT REPORT
        </div>
      </header>

      {/* Controls */}
      <div style={{ padding: '10px 4vw', background: '#0a0c10', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: 9, color: '#b99750', letterSpacing: '.1em' }}>
          <Calendar size={12}/> BIRTH
          <input type="date" value={birthInput} max={formatDate(nowInstant)}
            onChange={e => { setBirthInput(e.target.value); const inst = parseBirthDate(e.target.value, birthTime); if (inst) setBirthInstant(inst); }}
            style={{ background: 'transparent', border: '1px solid rgba(180,140,60,.3)', color: '#e2d9c8', fontFamily: 'monospace', fontSize: 9, padding: '4px 8px', outline: 'none' }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: 9, color: '#b99750', letterSpacing: '.1em' }}>
          <Clock size={12}/>
          <input type="time" value={birthTime}
            onChange={e => { setBirthTime(e.target.value); const inst = parseBirthDate(birthInput, e.target.value); if (inst) setBirthInstant(inst); }}
            style={{ background: 'transparent', border: '1px solid rgba(180,140,60,.3)', color: '#e2d9c8', fontFamily: 'monospace', fontSize: 9, padding: '4px 8px', outline: 'none' }}
          />
        </label>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#a9a594' }}>AGE {age}</span>
        <Link href="/observatory/timemachine" style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(211,174,82,.3)', padding: '5px 12px', color: '#c8a44c', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em', textDecoration: 'none' }}>
          TIME MACHINE ↗
        </Link>
      </div>

      {/* Two-wheel display */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, flex: 1, minHeight: 0 }}>
        {/* Birth wheel */}
        <div style={{ position: 'relative', borderRight: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '.2em', color: '#b99750', margin: '0 0 8px' }}>BIRTH CHART</p>
          <canvas ref={birthCanvasRef} style={{ display: 'block', maxWidth: '100%', maxHeight: '42vh' }} />
        </div>

        {/* Current wheel */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '.2em', color: '#b99750', margin: '0 0 8px' }}>CURRENT TRANSIT</p>
          <canvas ref={nowCanvasRef} style={{ display: 'block', maxWidth: '100%', maxHeight: '42vh' }} />
        </div>
      </section>

      {/* Planet selector */}
      <div style={{ display: 'flex', gap: 2, padding: '8px 4vw', overflowX: 'auto', background: '#0a0c10', borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0, scrollbarWidth: 'none' }}>
        {PLANET_BODIES.map(body => {
          const comp = comparisons.find(c => c.body === body);
          const changed = comp?.rashiChanged;
          return (
            <button
              key={body}
              onClick={() => setSelected(body)}
              style={{
                background: body === selected ? 'rgba(30,24,8,0.85)' : 'transparent',
                border: `1px solid ${body === selected ? 'rgba(210,170,70,0.6)' : changed ? 'rgba(220,160,60,0.3)' : 'rgba(180,150,80,0.15)'}`,
                color: body === selected ? '#f0e090' : changed ? '#e8c86b' : 'rgba(200,185,150,0.5)',
                fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em',
                padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                borderRadius: 3,
              }}
            >
              <span style={{ fontSize: 16, display: 'block' }}>{GLYPHS[body]}</span>
              {body}
              {changed && <span style={{ display: 'block', fontSize: 7, color: '#f0ba64' }}>↗</span>}
            </button>
          );
        })}
      </div>

      {/* Selected planet detail */}
      {selectedComparison && (
        <section style={{ padding: '16px 4vw 20px', background: '#0d0f14', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>

            {/* Birth position */}
            <div style={{ border: '1px solid rgba(255,255,255,.08)', borderRadius: 4, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 10px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.2em', color: '#7f7b70' }}>BIRTH · {formatDate(birth)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{GLYPHS[selectedComparison.body]}</span>
                <div>
                  <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 18, color: '#f0ebde' }}>
                    {selectedComparison.birth.rashi} {RASHI_GLYPHS[selectedComparison.birth.rashi] ?? ''}
                  </p>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 8, color: '#a9a594' }}>
                    {dms(selectedComparison.birth.degreeInRashi)} into rashi
                  </p>
                </div>
              </div>
              <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 8, color: '#7f7b70' }}>
                {selectedComparison.birth.nakshatra} · Pada {selectedComparison.birth.pada}
              </p>
              <p style={{ margin: '4px 0 0', fontFamily: 'monospace', fontSize: 8, color: '#5a5650' }}>
                SIDEREAL {dms(selectedComparison.birth.sidereal)} · TROPICAL {dms(selectedComparison.birth.tropical)}
              </p>
            </div>

            {/* Arrow / change summary */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ fontSize: 28, color: selectedComparison.rashiChanged ? '#f0ba64' : '#5a5650' }}>
                {selectedComparison.rashiChanged ? '→' : '≡'}
              </div>
              {selectedComparison.rashiChanged ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, color: '#f0ba64' }}>
                    {selectedComparison.rashiChangeCount} RASHI{selectedComparison.rashiChangeCount !== 1 ? 'S' : ''} ADVANCED
                  </p>
                  <p style={{ margin: '3px 0 0', fontFamily: 'monospace', fontSize: 8, color: '#7f7b70' }}>
                    Since birth
                  </p>
                </div>
              ) : (
                <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 9, color: '#5a5650', textAlign: 'center' }}>
                  Same rashi since birth
                </p>
              )}
            </div>

            {/* Current position */}
            <div style={{ border: `1px solid ${selectedComparison.rashiChanged ? 'rgba(220,160,60,0.5)' : 'rgba(255,255,255,.08)'}`, borderRadius: 4, padding: '14px 16px', background: selectedComparison.rashiChanged ? 'rgba(40,30,8,0.5)' : 'transparent' }}>
              <p style={{ margin: '0 0 10px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.2em', color: '#7f7b70' }}>NOW · CURRENT TRANSIT</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{GLYPHS[selectedComparison.body]}</span>
                <div>
                  <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 18, color: selectedComparison.rashiChanged ? '#f0ebde' : '#b8b0a0' }}>
                    {selectedComparison.now.rashi} {RASHI_GLYPHS[selectedComparison.now.rashi] ?? ''}
                    {selectedComparison.rashiChanged && <span style={{ color: '#f0ba64', marginLeft: 6 }}>↗</span>}
                  </p>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 8, color: '#a9a594' }}>
                    {dms(selectedComparison.now.degreeInRashi)} into rashi
                  </p>
                </div>
              </div>
              <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 8, color: '#7f7b70' }}>
                {selectedComparison.now.nakshatra} · Pada {selectedComparison.now.pada}
              </p>
              <p style={{ margin: '4px 0 0', fontFamily: 'monospace', fontSize: 8, color: '#5a5650' }}>
                SIDEREAL {dms(selectedComparison.now.sidereal)} · TROPICAL {dms(selectedComparison.now.tropical)}
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
