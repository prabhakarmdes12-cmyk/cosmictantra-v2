'use client';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Crosshair, Info, MapPin, Moon, Play, RotateCcw, Settings2, Sparkles, Eye, EyeOff, Star, Compass } from 'lucide-react';
import { CITIES, DEFAULT_CITY } from '@/lib/cities';
import { createObservatoryTime } from '@/lib/astronomy/time';
import { calculateCanonicalBody } from '@/lib/astronomy/ephemeris';
import { ObservatoryWorkerClient } from '@/lib/astronomy/workerClient';
import type { RiseTransitSet } from '@/lib/astronomy/events';
import type { ObserverLocation } from '@/lib/astronomy/types';
import SkyCanvasRenderer from './SkyCanvasRenderer';

const nakshatras = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];

function dms(deg: number) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.round((((deg - d) * 60) - m) * 60);
  return `${d}° ${String(m).padStart(2,'0')}′ ${String(s).padStart(2,'0')}″`;
}
function cityObserver(city: typeof DEFAULT_CITY): ObserverLocation {
  return {
    name: `${city.name}, ${city.state}`,
    latitude: city.lat,
    longitude: city.lng,
    timezone: city.id === 'london' ? 'Europe/London' : city.id === 'newyork' ? 'America/New_York' : city.id === 'dubai' ? 'Asia/Dubai' : city.id === 'singapore' ? 'Asia/Singapore' : 'Asia/Kolkata',
    source: 'catalogue',
  };
}

/** Rashi glyphs for the instrument rail */
const RASHI_GLYPHS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};
const PLANET_LABELS: Record<string, string> = {
  Sun: '☉', Moon: '☾', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄',
};

export default function ObservatoryExperience() {
  const [events, setEvents] = useState<RiseTransitSet | null>(null);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [instant, setInstant] = useState(() => new Date());
  const [live, setLive] = useState(true);
  const [showNakshatras, setShowNakshatras] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showEcliptic, setShowEcliptic] = useState(true);
  const [showMilkyWay, setShowMilkyWay] = useState(false);
  const [details, setDetails] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<string>('Moon');
  const [planetPositions, setPlanetPositions] = useState<Record<string, { alt: number; az: number; raH: number; decD: number; rashi: string; nakshatra: string; sidereal: number; tropical: number }>>({});
  const planetRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setInstant(new Date()), 1000);
    return () => clearInterval(id);
  }, [live]);

  const observer = useMemo(() => cityObserver(city), [city]);
  const time = useMemo(() => createObservatoryTime(instant, observer), [instant, observer]);

  // Calculate all planet positions
  const planets = useMemo(() => {
    const result: Record<string, ReturnType<typeof calculateCanonicalBody>> = {};
    (['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'] as const).forEach(body => {
      result[body] = calculateCanonicalBody(body, time);
    });
    return result;
  }, [time]);

  // Track planet positions for the rail display
  useEffect(() => {
    const pos: typeof planetPositions = {};
    Object.entries(planets).forEach(([name, p]) => {
      pos[name] = {
        alt: p.scientific?.altitude ?? 0,
        az: p.scientific?.azimuth ?? 0,
        raH: p.scientific?.rightAscensionHours ?? 0,
        decD: p.scientific?.declination ?? 0,
        rashi: p.rashi,
        nakshatra: p.nakshatra.name,
        sidereal: p.siderealLongitude.value,
        tropical: p.tropicalLongitude.value,
      };
    });
    setPlanetPositions(pos);
  }, [planets]);

  // Moon rise/transit/set from worker
  useEffect(() => {
    const worker = new ObservatoryWorkerClient();
    let active = true;
    worker.events('Moon', instant, observer).then(result => {
      if (active) setEvents(result);
    }).catch(() => {
      if (active) setEvents(null);
    });
    return () => { active = false; worker.destroy(); };
  }, [observer, Math.floor(instant.getTime() / 60000)]);

  const eventTime = (value: string | null) =>
    value ? new Intl.DateTimeFormat('en-IN', { timeZone: observer.timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) : '—';

  const offsetLabel = `${time.timezoneOffsetMinutes >= 0 ? '+' : '−'}${String(Math.floor(Math.abs(time.timezoneOffsetMinutes)/60)).padStart(2,'0')}:${String(Math.abs(time.timezoneOffsetMinutes)%60).padStart(2,'0')}`;
  const timeLabel = new Intl.DateTimeFormat('en-IN', {
    timeZone: observer.timezone, day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
  }).format(instant);

  const changeTime = (days: number) => {
    setLive(false);
    setInstant(d => new Date(d.getTime() + days*86400000));
  };

  const current = planets[selectedPlanet];
  const rashiGlyph = current ? (RASHI_GLYPHS[current.rashi] ?? '') : '';
  const planetGlyph = PLANET_LABELS[selectedPlanet] ?? '•';

  // Scroll selected planet into view in rail
  useEffect(() => {
    if (!planetRailRef.current) return;
    const el = planetRailRef.current.querySelector(`[data-planet="${selectedPlanet}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedPlanet]);

  const visiblePlanets = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];

  return (
    <main className="obs-page">
      <header className="obs-header">
        <Link href="/" className="obs-brand">
          <span className="obs-orb">✦</span>
          <span>COSMICTANTRA</span>
        </Link>
        <div className="obs-title">
          OBSERVATORY <em>काशी आकाश वेधशाला</em>
        </div>
        <div className="obs-header-right">
          <span className="obs-render-status">
            <Sparkles size={12}/> STEREOGRAPHIC PROJECTION
          </span>
          <Link href="/observatory/ecliptic" className="obs-detail-btn" style={{ textDecoration: 'none', color: '#c7bda9', fontFamily: 'monospace', fontSize: 10, letterSpacing: '.1em', display: 'flex', gap: 5, alignItems: 'center', borderLeft: '1px solid rgba(218,185,100,.19)', paddingLeft: 10 }}>
            ECLIPTIC ↗
          </Link>
          <button className="obs-detail-btn" onClick={()=>setDetails(!details)}>
            <Info size={14}/> DETAILS
          </button>
        </div>
      </header>

      {/* Sky canvas — real horizon-view projection */}
      <section className="obs-sky" aria-label={`Real sky projection above ${observer.name}`}>
        <div className="obs-noise" />
        <div className="obs-vignette" />

        {/* Canvas renderer — astronomy-only positions */}
        <SkyCanvasRenderer
          instant={instant}
          location={observer}
          showLabels={true}
          showConstellations={showConstellations}
          showMilkyWay={showMilkyWay}
          showEcliptic={showEcliptic}
          selectedBody={selectedPlanet}
          onBodyClick={(body) => setSelectedPlanet(body)}
        />

        {/* Nakshatra Mandala — SVG overlay (Lahiri sidereal grid, separate layer) */}
        {showNakshatras && (
          <svg
            className="obs-nakshatra-overlay"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <filter id="glow-naksh">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* 27 Nakshatra sectors */}
            {nakshatras.map((n, i) => {
              const startAngle = i * (360 / 27);
              const endAngle = (i + 1) * (360 / 27);
              const r1 = 320, r2 = 420;
              const a1 = (startAngle - 90) * Math.PI / 180;
              const a2 = (endAngle - 90) * Math.PI / 180;
              const x1 = 500 + r1 * Math.cos(a1), y1 = 500 + r1 * Math.sin(a1);
              const x2 = 500 + r2 * Math.cos(a1), y2 = 500 + r2 * Math.sin(a1);
              const x3 = 500 + r2 * Math.cos(a2), y3 = 500 + r2 * Math.sin(a2);
              const x4 = 500 + r1 * Math.cos(a2), y4 = 500 + r1 * Math.sin(a2);
              const large = (endAngle - startAngle) > 180 ? 1 : 0;
              const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 ${large} 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 ${large} 0 ${x1} ${y1}`;
              return (
                <g key={n}>
                  <path d={d} fill="none" stroke="rgba(180,140,60,0.2)" strokeWidth="0.5"/>
                  <text
                    x={500 + 370 * Math.cos(a1 + (a2-a1)/2)}
                    y={500 + 370 * Math.sin(a1 + (a2-a1)/2)}
                    transform={`rotate(${(startAngle + (360/27)/2)}, ${500 + 370 * Math.cos(a1 + (a2-a1)/2)}, ${500 + 370 * Math.sin(a1 + (a2-a1)/2)})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(180,140,60,0.45)"
                    fontSize="22"
                    fontFamily="monospace"
                    filter="url(#glow-naksh)"
                  >{n[0]}</text>
                </g>
              );
            })}
            {/* Rashi ring labels */}
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
              const a = (deg - 90) * Math.PI / 180;
              const r = 290;
              const names = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
              return (
                <text
                  key={deg}
                  x={500 + r * Math.cos(a)}
                  y={500 + r * Math.sin(a)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(180,140,60,0.35)"
                  fontSize="16"
                  fontFamily="serif"
                >{names[i]}</text>
              );
            })}
          </svg>
        )}

        {/* Planet selector overlay (top-left of sky) */}
        <div className="obs-planet-overlay">
          <span className="obs-planet-overlay-title">PLANETS</span>
          <div className="obs-planet-list">
            {visiblePlanets.map(name => {
              const pos = planetPositions[name];
              const isSelected = name === selectedPlanet;
              return (
                <button
                  key={name}
                  className={`obs-planet-btn ${isSelected ? 'selected' : ''} ${pos?.alt !== undefined && pos.alt < 0 ? 'below' : ''}`}
                  onClick={() => setSelectedPlanet(name)}
                  title={`${name}: ${pos?.alt?.toFixed(1)}° alt`}
                >
                  <span className="obs-planet-glyph">{PLANET_LABELS[name] ?? name[0]}</span>
                  {isSelected && <span className="obs-planet-name">{name}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sky info overlay (top-right) */}
        <div className="obs-sky-copy">
          <p>THE SKY ABOVE {city.name.toUpperCase()}</p>
          <h1>{timeLabel} <span>• UTC {offsetLabel}</span></h1>
          {!live && <strong>SIMULATION MODE</strong>}
        </div>

        {/* View toggles */}
        <div className="obs-view-toggles">
          <button
            className={`obs-toggle ${showNakshatras ? 'active' : ''}`}
            onClick={() => setShowNakshatras(!showNakshatras)}
            title="Nakshatra Mandala"
          >NAK</button>
          <button
            className={`obs-toggle ${showConstellations ? 'active' : ''}`}
            onClick={() => setShowConstellations(!showConstellations)}
            title="Constellation lines"
          ><Star size={11}/></button>
          <button
            className={`obs-toggle ${showEcliptic ? 'active' : ''}`}
            onClick={() => setShowEcliptic(!showEcliptic)}
            title="Ecliptic line"
          ><Compass size={11}/></button>
        </div>
      </section>

      {/* Planet rail */}
      <div className="obs-planet-rail" ref={planetRailRef}>
        {visiblePlanets.map(name => {
          const pos = planetPositions[name];
          const isSelected = name === selectedPlanet;
          return (
            <button
              key={name}
              data-planet={name}
              className={`obs-rail-planet ${isSelected ? 'selected' : ''} ${pos?.alt !== undefined && pos.alt < 0 ? 'below' : ''}`}
              onClick={() => setSelectedPlanet(name)}
            >
              <span className="glyph">{PLANET_LABELS[name]}</span>
              <span className="name">{name}</span>
              <span className="alt">{pos ? `${pos.alt.toFixed(1)}°` : '—'}</span>
            </button>
          );
        })}
      </div>

      {/* Instrument panel */}
      <section className="obs-instrument">
        <div className="obs-rail">
          <button onClick={() => { setLive(true); setInstant(new Date()); }}>
            <Crosshair size={15}/> NOW
          </button>
          <button onClick={() => changeTime(-1)}><ChevronLeft size={15}/> −1D</button>
          <button onClick={() => changeTime(1)}>+1D <ChevronRight size={15}/></button>
          <label><MapPin size={14}/><select value={city.id} onChange={e => {
            const c = CITIES.find(x => x.id === e.target.value);
            if (c) setCity(c);
          }}>{CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <button onClick={() => setLive(false)}><Play size={13}/> TIME</button>
        </div>

        <article className="obs-inspector">
          {current && (
            <>
              <div className="obs-object">
                <span className="obs-object-glyph">{planetGlyph}</span>
                <div>
                  <p>{selectedPlanet.toUpperCase()} <em>{selectedPlanet === 'Moon' ? 'चन्द्र' : selectedPlanet === 'Sun' ? 'सूर्य' : selectedPlanet}</em></p>
                  <h2>{current.nakshatra.name} <small>• Pada {current.nakshatra.pada} {rashiGlyph ? `· ${rashiGlyph}` : ''}</small></h2>
                </div>
              </div>

              <div className="obs-reading">
                <div>
                  <label>SIDEREAL — LAHIRI (Jyotish)</label>
                  <b>{dms(current.siderealLongitude.value)}</b>
                  <span>{current.rashi} · {dms(current.degreeInRashi)}</span>
                </div>
                <div>
                  <label>ASTRONOMICAL / TROPICAL</label>
                  <b>{dms(current.tropicalLongitude.value)}</b>
                  <span>of-date · astronomy-engine MIT</span>
                </div>
                <div>
                  <label>AYANAMSHA (Lahiri)</label>
                  <b>{dms(current.ayanamsha.value)}</b>
                  <span>Canonical engine</span>
                </div>
              </div>

              {current.scientific && (
                <div className="obs-science">
                  ALT {current.scientific.altitude.toFixed(2)}° · AZ {current.scientific.azimuth.toFixed(2)}° ·
                  RA {current.scientific.rightAscensionHours.toFixed(4)}h · DEC {current.scientific.declination.toFixed(2)}°
                </div>
              )}

              {selectedPlanet === 'Moon' && events && (
                <div className="obs-events">
                  <span>MOON RISE <b>{eventTime(events.rise)}</b></span>
                  <span>TRANSIT <b>{eventTime(events.transit)}</b></span>
                  <span>SET <b>{eventTime(events.set)}</b></span>
                  <small>astronomy-engine · observer {observer.name}</small>
                </div>
              )}

              {selectedPlanet === 'Moon' && !current.crossEngine.agreement && (
                <div className="obs-discrepancy">
                  DEV: astronomy-derived Lahiri Δ {current.crossEngine.differenceDegrees.toFixed(4)}°.
                  Canonical Jyotish output shown above.
                </div>
              )}
            </>
          )}

          <div className="obs-actions">
            <Link href={`/panchang/dhanbad?observatory=${selectedPlanet.toLowerCase()}&time=${encodeURIComponent(time.utcInstant)}`}>
              VIEW IN PANCHANG
            </Link>
            <Link href="/?open=kundali-section">VIEW IN KUNDALI</Link>
          </div>
        </article>
      </section>

      {/* Provenance drawer */}
      {details && (
        <aside className="obs-provenance" aria-live="polite">
          <button onClick={() => setDetails(false)}>×</button>
          <p>CALCULATION DETAILS</p>
          <dl>
            <dt>Observer</dt><dd>{observer.name} · {observer.latitude.toFixed(4)}°, {observer.longitude.toFixed(4)}°</dd>
            <dt>Timezone / UTC</dt><dd>{observer.timezone} · {time.utcInstant}</dd>
            <dt>Julian date</dt><dd>{time.julianDate.toFixed(6)}</dd>
            <dt>Frame chain</dt><dd>J2000 → of-date (SiderealTime) → horizontal (astronomy-engine)</dd>
            <dt>Projection</dt><dd>Stereographic from zenith (astronomy only, no Jyotish authority)</dd>
            <dt>Astronomical source</dt><dd>{current?.tropicalLongitude.source} · {current?.tropicalLongitude.algorithmVersion}</dd>
            <dt>Jyotish source</dt><dd>{current?.siderealLongitude.source}</dd>
            <dt>Star catalog</dt><dd>Yale Bright Star Catalog (public domain astronomical catalog)</dd>
            <dt>Cross-engine Δ (Moon)</dt>
            <dd>{planets.Moon ? planets.Moon.crossEngine.differenceDegrees.toFixed(6) + '° (development validation)' : 'N/A'}</dd>
            <dt>Precision policy</dt><dd>Display resolution is not an accuracy claim. See documentation.</dd>
            <dt>Provenance chain</dt>
            <dd>
              astronomy-engine → Equator/Horizon → stereographic projection → canvas.<br/>
              canonical engine → Lahiri sidereal → rashi/nakshatra/pada.<br/>
              These are separate, independently labeled outputs.
            </dd>
          </dl>
        </aside>
      )}
    </main>
  );
}
