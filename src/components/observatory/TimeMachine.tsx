'use client';

/**
 * Time Machine — Birth Sky to Now.
 *
 * Reconstructs the sky at any moment between a birth instant and NOW.
 * Lets users see:
 *   - What the sky looked like at birth
 *   - How planetary positions have shifted since then
 *   - Which rashis planets have transit through
 *
 * No LLM generates coordinates. No birth data leaves the client.
 * All calculations are deterministic and auditable.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, FastForward, Play, RotateCcw, Sparkles } from 'lucide-react';
import { CITIES, DEFAULT_CITY } from '@/lib/cities';
import { createObservatoryTime } from '@/lib/astronomy/time';
import { calculateCanonicalBody } from '@/lib/astronomy/ephemeris';
import { ObservatoryWorkerClient } from '@/lib/astronomy/workerClient';
import type { ObserverLocation } from '@/lib/astronomy/types';
import type { RiseTransitSet } from '@/lib/astronomy/events';
import SkyCanvasRenderer from './SkyCanvasRenderer';
import {
  tropicalLongitude,
  rashiForLongitude,
  RASHI_LABELS,
} from '@/lib/astronomy/eclipticProjection';

const PLANET_BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const;
const GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☾', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄',
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
function formatTime(d: Date) {
  return d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDateTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz, day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
}
function dms(deg: number) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.round((((deg - d) * 60) - m) * 60);
  return `${d}°${String(m).padStart(2,'0')}′${String(s).padStart(2,'0')}″`;
}
function parseBirthDate(val: string, time: string): Date | null {
  if (!val || !time) return null;
  const [y, mo, d] = val.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  if ([y, mo, d, h, mi].some(isNaN)) return null;
  return new Date(Date.UTC(y!, (mo ?? 1) - 1, d!, h!, mi!));
}

/** How many years between two dates (for display) */
function yearsBetween(a: Date, b: Date): string {
  const ms = Math.abs(b.getTime() - a.getTime());
  const days = ms / 86400000;
  const years = days / 365.25;
  return `${years.toFixed(1)}y`;
}

interface PlanetSnapshot {
  body: string;
  tropical: number;
  rashi: string;
  sidereal: number;
  nakshatra: string;
  pada: number;
}

function getSnapshot(instant: Date, location: ObserverLocation): PlanetSnapshot[] {
  const time = createObservatoryTime(instant, location);
  return PLANET_BODIES.map(body => {
    const calc = calculateCanonicalBody(body, time);
    return {
      body,
      tropical: calc.tropicalLongitude.value,
      rashi: calc.rashi,
      sidereal: calc.siderealLongitude.value,
      nakshatra: calc.nakshatra.name,
      pada: calc.nakshatra.pada,
    };
  });
}

export default function TimeMachine() {
  const [city] = useState(DEFAULT_CITY);
  const observer = useMemo(() => cityObserver(city), [city]);

  // Birth instant (defaults to 26 years ago at midnight IST)
  const [birthInput, setBirthInput] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 26);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return formatDate(d);
  });
  const [birthTime, setBirthTime] = useState('06:00');
  const [birthInstant, setBirthInstant] = useState<Date | null>(() => parseBirthDate(birthInput, birthTime));

  // Slider position: 0 = birth, 100 = now
  const [sliderPct, setSliderPct] = useState(100);
  const [isLive, setIsLive] = useState(true);

  const nowInstant = useMemo(() => new Date(), []);
  const birth = birthInstant ?? nowInstant;

  // Current displayed instant
  const displayedInstant = useMemo(() => {
    if (isLive || sliderPct === 100) return nowInstant;
    const ms = birth.getTime() + (nowInstant.getTime() - birth.getTime()) * (sliderPct / 100);
    return new Date(ms);
  }, [birth, nowInstant, sliderPct, isLive]);

  const time = useMemo(() => createObservatoryTime(displayedInstant, observer), [displayedInstant, observer]);

  // Snapshots
  const birthSnapshot = useMemo(() => getSnapshot(birth, observer), [birth, observer]);
  const currentSnapshot = useMemo(() => getSnapshot(displayedInstant, observer), [displayedInstant, observer]);

  // Changes between birth and displayed
  const changes = useMemo(() => {
    return PLANET_BODIES.map((body, i) => {
      const birthPlanet = birthSnapshot[i];
      const currentPlanet = currentSnapshot[i];
      const rashiChanged = birthPlanet.rashi !== currentPlanet.rashi;
      const tLonShift = ((currentPlanet.tropical - birthPlanet.tropical) % 360 + 360) % 360;
      return { body, birthPlanet, currentPlanet, rashiChanged, tLonShift };
    });
  }, [birthSnapshot, currentSnapshot]);

  // Moon events
  const [moonEvents, setMoonEvents] = useState<RiseTransitSet | null>(null);
  useEffect(() => {
    const worker = new ObservatoryWorkerClient();
    let active = true;
    worker.events('Moon', displayedInstant, observer).then(r => { if (active) setMoonEvents(r); }).catch(() => {});
    return () => { active = false; worker.destroy(); };
  }, [displayedInstant, observer]);

  const eventTime = (v: string | null) =>
    v ? new Intl.DateTimeFormat('en-IN', { timeZone: observer.timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(v)) : '—';

  const age = yearsBetween(birth, nowInstant);
  const displayTime = formatDateTime(displayedInstant, observer.timezone);

  return (
    <main style={{ minHeight: '100svh', background: '#060810', color: '#e9e4d7', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4vw', borderBottom: '1px solid rgba(218,185,100,.19)', background: '#090b10', flexShrink: 0 }}>
        <Link href="/observatory" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#eee6d4', textDecoration: 'none', fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: '.14em' }}>
          <span style={{ color: '#cba64c', border: '1px solid rgba(203,166,76,.55)', width: 25, height: 25, display: 'grid', placeItems: 'center', borderRadius: '50%', fontSize: 11 }}>✦</span>
          COSMICTANTRA
        </Link>
        <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.2em', color: '#c7bda9', textAlign: 'center' }}>
          TIME MACHINE <em style={{ fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: 0, color: '#b99142', marginLeft: 10 }}>काल यन्त्र</em>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#a7a38f', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Sparkles size={11}/> TRANSIT TRACKER
        </div>
      </header>

      {/* Sky */}
      <section style={{ flex: 1, position: 'relative', minHeight: '320px' }}>
        <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 4 }}>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 9, letterSpacing: '.18em', color: '#d2b25f' }}>
            {isLive || sliderPct === 100 ? 'CURRENT SKY' : 'BIRTH → NOW'}
          </p>
          <h1 style={{ margin: '3px 0 0', fontFamily: 'Georgia, serif', fontSize: 17, color: '#f0ebde' }}>
            {displayTime}
          </h1>
          {!isLive && sliderPct < 100 && (
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#f0ba64' }}>
              AGE {yearsBetween(birth, displayedInstant)}
            </span>
          )}
        </div>

        {/* Age badge */}
        <div style={{
          position: 'absolute', top: 12, right: 16, zIndex: 4,
          fontFamily: 'monospace', fontSize: 10, color: '#a9a594', textAlign: 'right',
        }}>
          {isLive || sliderPct === 100 ? (
            <span style={{ color: '#e4d5b1' }}>NOW · AGE {age}</span>
          ) : (
            <span>BIRTH · AGE 0.0y</span>
          )}
        </div>

        <SkyCanvasRenderer
          instant={displayedInstant}
          location={observer}
          showLabels={true}
          showConstellations={true}
          showEcliptic={true}
          showMilkyWay={false}
        />
      </section>

      {/* Time controls */}
      <div style={{
        padding: '12px 4vw', background: '#0a0c10',
        borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0,
      }}>
        {/* Birth input row */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: 9, color: '#b99750', letterSpacing: '.1em' }}>
            <Calendar size={12}/> BIRTH DATE
            <input
              type="date"
              value={birthInput}
              max={formatDate(nowInstant)}
              onChange={e => {
                setBirthInput(e.target.value);
                const inst = parseBirthDate(e.target.value, birthTime);
                if (inst) setBirthInstant(inst);
                setIsLive(false);
                setSliderPct(0);
              }}
              style={{ background: 'transparent', border: '1px solid rgba(180,140,60,.3)', color: '#e2d9c8', fontFamily: 'monospace', fontSize: 9, padding: '4px 8px', outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: 9, color: '#b99750', letterSpacing: '.1em' }}>
            <Clock size={12}/> TIME
            <input
              type="time"
              value={birthTime}
              onChange={e => {
                setBirthTime(e.target.value);
                const inst = parseBirthDate(birthInput, e.target.value);
                if (inst) setBirthInstant(inst);
                setIsLive(false);
                setSliderPct(0);
              }}
              style={{ background: 'transparent', border: '1px solid rgba(180,140,60,.3)', color: '#e2d9c8', fontFamily: 'monospace', fontSize: 9, padding: '4px 8px', outline: 'none' }}
            />
          </label>
          <button
            onClick={() => { setIsLive(true); setSliderPct(100); }}
            style={{ background: 'transparent', border: '1px solid rgba(180,140,60,.3)', color: '#c8a44c', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em', padding: '5px 12px', cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center' }}
          >
            <FastForward size={11}/> NOW
          </button>
          <button
            onClick={() => { setIsLive(false); setSliderPct(0); }}
            style={{ background: 'transparent', border: '1px solid rgba(180,140,60,.3)', color: '#c8a44c', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em', padding: '5px 12px', cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center' }}
          >
            <RotateCcw size={11}/> BIRTH
          </button>
          <Link href="/observatory" style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(211,174,82,.3)', padding: '5px 12px', color: '#c8a44c', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.08em', textDecoration: 'none' }}>
            ← SKY VIEW
          </Link>
        </div>

        {/* Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#7f7b70', whiteSpace: 'nowrap' }}>BIRTH</span>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPct}
            onChange={e => { setSliderPct(Number(e.target.value)); setIsLive(false); }}
            style={{ flex: 1, accentColor: '#c8a44c', cursor: 'pointer' }}
          />
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#7f7b70', whiteSpace: 'nowrap' }}>NOW</span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#5a5650', textAlign: 'center', marginTop: 3 }}>
          {isLive || sliderPct === 100 ? 'LIVE · WATCHING CURRENT SKY' : `AGE ${yearsBetween(birth, displayedInstant)} · ${birth.toLocaleDateString('en-CA')} → ${nowInstant.toLocaleDateString('en-CA')}`}
        </div>
      </div>

      {/* Transit table */}
      <section style={{
        padding: '16px 4vw', background: '#0d0f14', borderTop: '1px solid rgba(255,255,255,.06)',
        flexShrink: 0, maxHeight: '45vh', overflowY: 'auto',
      }}>
        <h3 style={{ margin: '0 0 12px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '.2em', color: '#b99750' }}>
          PLANETARY TRANSITS — {birthInput} → {formatDate(nowInstant)} ({age})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
          {changes.map(({ body, birthPlanet, currentPlanet, rashiChanged, tLonShift }) => (
            <div key={body} style={{
              border: `1px solid ${rashiChanged ? 'rgba(220,160,60,0.5)' : 'rgba(255,255,255,.06)'}`,
              borderRadius: 4, padding: '10px 12px',
              background: rashiChanged ? 'rgba(40,30,8,0.6)' : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{GLYPHS[body]}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#d3ae5a', letterSpacing: '.12em' }}>{body.toUpperCase()}</span>
                {rashiChanged && (
                  <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 8, color: '#f0ba64', background: 'rgba(40,30,8,0.8)', padding: '2px 6px', borderRadius: 3 }}>
                    RASHI CHANGED
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
                {/* Birth position */}
                <div>
                  <p style={{ margin: '0 0 2px', fontFamily: 'monospace', fontSize: 7, color: '#7f7b70', letterSpacing: '.1em' }}>BIRTH</p>
                  <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 13, color: '#b8b0a0' }}>
                    {birthPlanet.rashi} {RASHI_GLYPHS[birthPlanet.rashi] ?? ''}
                  </p>
                  <p style={{ margin: '1px 0 0', fontFamily: 'monospace', fontSize: 7, color: '#7f7b70' }}>
                    {birthPlanet.nakshatra} · P{birthPlanet.pada}
                  </p>
                </div>

                {/* Arrow + shift */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ color: rashiChanged ? '#f0ba64' : '#5a5650', fontSize: 14 }}>→</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 7, color: '#5a5650' }}>{tLonShift.toFixed(1)}°</span>
                </div>

                {/* Current position */}
                <div>
                  <p style={{ margin: '0 0 2px', fontFamily: 'monospace', fontSize: 7, color: '#7f7b70', letterSpacing: '.1em' }}>NOW</p>
                  <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 13, color: rashiChanged ? '#f0ebde' : '#b8b0a0' }}>
                    {currentPlanet.rashi} {RASHI_GLYPHS[currentPlanet.rashi] ?? ''}
                  </p>
                  <p style={{ margin: '1px 0 0', fontFamily: 'monospace', fontSize: 7, color: '#7f7b70' }}>
                    {currentPlanet.nakshatra} · P{currentPlanet.pada}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 5, fontFamily: 'monospace', fontSize: 7, color: '#5a5650' }}>
                {body === 'Moon' && moonEvents && (
                  <span>MOON RISE {eventTime(moonEvents.rise)} · TRANSIT {eventTime(moonEvents.transit)} · SET {eventTime(moonEvents.set)}</span>
                )}
                {body !== 'Moon' && (
                  <span>TROPICAL {currentPlanet.tropical.toFixed(2)}° · SIDEREAL {currentPlanet.sidereal.toFixed(2)}°</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
