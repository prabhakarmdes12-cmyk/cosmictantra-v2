'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, LocateFixed, RotateCcw, SlidersHorizontal, Star } from 'lucide-react';
import CelestialDetailSheet from './CelestialDetailSheet';
import ObservatoryStudentDesk from './ObservatoryStudentDesk';
import LiveObservationPanel from './LiveObservationPanel';
import SkyAtAGlance from './SkyAtAGlance';
import SkyCanvasRenderer from './SkyCanvasRenderer';
import { calculateCanonicalBody, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import { constellationDisplayName, constellationIds, type CelestialSelection } from '@/lib/astronomy/celestialCatalog';
import { CITIES } from '@/lib/cities';
import { projectStar } from '@/lib/astronomy/projection';
import { DEFAULT_LIMITING_MAGNITUDE, DEFAULT_MINIMUM_ALTITUDE_DEG, isAboveObservationHorizon, isWithinLimitingMagnitude, OBSERVATION_LIMITS } from '@/lib/astronomy/observation';
import { STARS } from '@/lib/astronomy/stars';
import { LIVE_OBSERVATION_ZOOM_THRESHOLD, type LiveObservationResponse, type LiveTarget } from '@/lib/observatory/live';

const PLANETS: CanonicalBodyName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SYMBOLS: Record<string, string> = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋' };
const OBSERVATORY_DEFAULT_CITY = 'varanasi';

type ObservatoryCity = {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  tz: number;
};

function findCity(value?: string): ObservatoryCity {
  const candidate = (value || '').trim().toLowerCase();
  const city = (CITIES as ObservatoryCity[]).find(item => item.id === candidate || item.name.toLowerCase() === candidate);
  return city || (CITIES as ObservatoryCity[]).find(item => item.id === OBSERVATORY_DEFAULT_CITY) || (CITIES as ObservatoryCity[])[0];
}

function validDate(value?: string): Date {
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function validRange(value: string | undefined, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function toDateTimeInput(date: Date, timezoneOffsetHours = 0): string {
  const shifted = new Date(date.getTime() + timezoneOffsetHours * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

function dateFromDateTimeInput(value: string, timezoneOffsetHours = 0): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return new Date(value);
  const [, year, month, day, hours, minutes] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes)) - timezoneOffsetHours * 60 * 60 * 1000);
}

function formatCoordinate(value: number, positive: string, negative: string): string {
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;
}

function formatLongitude(value: number): string {
  const degrees = Math.floor(value);
  const minutes = Math.floor((value - degrees) * 60);
  return `${String(degrees).padStart(3, '0')}° ${String(minutes).padStart(2, '0')}′`;
}

export interface ObservatoryExperienceProps {
  initialCity?: string;
  initialTime?: string;
  initialPlanet?: string;
  initialHorizonMask?: string;
  initialLimitingMagnitude?: string;
  initialSelection?: CelestialSelection | null;
}

export function ObservatoryExperience({
  initialCity,
  initialTime,
  initialPlanet,
  initialHorizonMask,
  initialLimitingMagnitude,
  initialSelection = null,
}: ObservatoryExperienceProps) {
  const [city, setCity] = useState<ObservatoryCity>(() => findCity(initialCity));
  const [date, setDate] = useState<Date>(() => validDate(initialTime));
  const initialPlanetSelection = initialSelection?.kind === 'planet' ? initialSelection.id : null;
  const [selectedPlanet, setSelectedPlanet] = useState<CanonicalBodyName>(() => {
    const value = PLANETS.find(body => body.toLowerCase() === (initialPlanetSelection || initialPlanet || '').toLowerCase());
    return value || 'Sun';
  });
  const [minimumAltitudeDeg, setMinimumAltitudeDeg] = useState(() => validRange(initialHorizonMask, OBSERVATION_LIMITS.minimumAltitudeDeg.min, OBSERVATION_LIMITS.minimumAltitudeDeg.max, DEFAULT_MINIMUM_ALTITUDE_DEG));
  const [limitingMagnitude, setLimitingMagnitude] = useState(() => validRange(initialLimitingMagnitude, OBSERVATION_LIMITS.limitingMagnitude.min, OBSERVATION_LIMITS.limitingMagnitude.max, DEFAULT_LIMITING_MAGNITUDE));
  const [showMandala, setShowMandala] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [selectedConstellation, setSelectedConstellation] = useState<string | null>(() => initialSelection?.kind === 'constellation'
    ? initialSelection.id
    : initialSelection?.kind === 'star'
      ? STARS.find(star => star.id === initialSelection.id)?.constellation || null
      : null);
  const [detailSelection, setDetailSelection] = useState<CelestialSelection | null>(initialSelection);
  const [liveTarget, setLiveTarget] = useState<LiveTarget>(() => initialSelection?.kind === 'planet'
    ? { kind: 'planet', id: initialSelection.id, label: initialSelection.id }
    : initialSelection?.kind === 'constellation'
      ? { kind: 'constellation', id: initialSelection.id, label: constellationDisplayName(initialSelection.id) }
      : initialSelection?.kind === 'star'
        ? { kind: 'star', id: initialSelection.id, label: STARS.find(star => star.id === initialSelection.id)?.name || initialSelection.id }
        : { kind: 'planet', id: selectedPlanet, label: selectedPlanet });
  const [skyZoom, setSkyZoom] = useState(1);
  const [liveResponse, setLiveResponse] = useState<LiveObservationResponse | null>(null);
  const handleViewportChange = useCallback((view: { scale: number }) => setSkyZoom(view.scale), []);
  const handleLiveResponse = useCallback((next: LiveObservationResponse | null) => setLiveResponse(next), []);

  const selectedBody = useMemo(() => calculateCanonicalBody(selectedPlanet, date), [selectedPlanet, date]);
  const constellationOptions = useMemo(() => constellationIds().map(id => ({ id, name: constellationDisplayName(id) })), []);
  const visibleBrightAnchors = useMemo(() => STARS
    .map(star => ({ star, point: projectStar(star, date, { latitude: city.lat, longitude: city.lng }, 600, 600) }))
    .filter(item => item.point.visible && isAboveObservationHorizon(item.point.altitudeDeg, minimumAltitudeDeg) && isWithinLimitingMagnitude(item.star.magnitude, limitingMagnitude))
    .sort((left, right) => left.star.magnitude - right.star.magnitude)
    .slice(0, 14), [date, city.lat, city.lng, minimumAltitudeDeg, limitingMagnitude]);
  const dateInput = toDateTimeInput(date, city.tz);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('city', city.id);
    params.set('time', date.toISOString());
    params.set('planet', selectedPlanet);
    params.set('horizon', String(minimumAltitudeDeg));
    params.set('mag', String(limitingMagnitude));
    if (detailSelection) {
      params.set('object', detailSelection.id);
      params.set('objectKind', detailSelection.kind);
    } else {
      params.delete('object');
      params.delete('objectKind');
    }
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
  }, [city.id, date, selectedPlanet, minimumAltitudeDeg, limitingMagnitude, detailSelection]);
  const query = (path: string) => {
    const params = new URLSearchParams({
      city: city.id,
      time: date.toISOString(),
      planet: selectedPlanet,
      horizon: String(minimumAltitudeDeg),
      mag: String(limitingMagnitude),
    });
    return `${path}?${params.toString()}`;
  };

  const handleDateChange = (value: string) => {
    const next = dateFromDateTimeInput(value, city.tz);
    if (Number.isFinite(next.getTime())) setDate(next);
  };

  const shiftDate = (hours: number) => {
    setDate(current => new Date(current.getTime() + hours * 60 * 60 * 1000));
  };

  const setTodayAt = (hours: number, minutes = 0) => {
    const now = new Date();
    const local = new Date(now.getTime() + city.tz * 60 * 60 * 1000);
    const target = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hours, minutes) - city.tz * 60 * 60 * 1000);
    setDate(target);
  };

  const selectObject = (selection: CelestialSelection) => {
    setDetailSelection(selection);
    if (selection.kind === 'planet') {
      setSelectedPlanet(selection.id);
      setSelectedConstellation(null);
      setLiveTarget({ kind: 'planet', id: selection.id, label: selection.id });
    }
    if (selection.kind === 'constellation') {
      setSelectedConstellation(selection.id);
      setLiveTarget({ kind: 'constellation', id: selection.id, label: constellationDisplayName(selection.id) });
    }
    if (selection.kind === 'star') {
      const star = STARS.find(item => item.id === selection.id);
      if (star) {
        setSelectedConstellation(star.constellation);
        setLiveTarget({ kind: 'star', id: star.id, label: star.name });
      }
    }
  };

  const selectStar = (star: typeof STARS[number]) => {
    setSelectedConstellation(star.constellation);
    setDetailSelection({ kind: 'star', id: star.id });
    setLiveTarget({ kind: 'star', id: star.id, label: star.name });
  };

  return (
    <main className="min-h-screen bg-[#05060B] text-[#ECEAF1]">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="flex flex-col gap-6 border-b border-white/[0.09] pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.26em] text-[#D4AF37]">॥ नभः वेधशाला · Nabh Observatory ॥</div>
            <h1 className="mt-3 font-editorial text-4xl font-bold leading-tight text-[#F7F3E9] sm:text-5xl">See the sky behind the numbers.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#AEB4C8]">A transparent local-sky instrument for the selected instant and geographic anchor. Stars are projected from J2000 coordinates; grahas use a deterministic ephemeris and Lahiri is shown only where the Vedic coordinate is derived.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
            <Link href={query('/observatory/ecliptic')} className="rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3 py-2 text-[#F2C65D] transition-colors hover:bg-[#D4AF37]/20">Ecliptic planisphere ↗</Link>
            <Link href={query('/observatory/timemachine')} className="rounded-full border border-white/10 px-3 py-2 text-[#C1C7DF] transition-colors hover:border-[#D4AF37]/60">Time machine</Link>
            <Link href={query('/observatory/gochara')} className="rounded-full border border-white/10 px-3 py-2 text-[#C1C7DF] transition-colors hover:border-[#D4AF37]/60">Gochara</Link>
            <a href="#student-desk-title" className="rounded-full border border-white/10 px-3 py-2 text-[#C1C7DF] transition-colors hover:border-[#D4AF37]/60">Study desk</a>
          </div>
        </header>

        <section className="grid gap-4 rounded-2xl border border-white/[0.09] bg-[#0A0D18] p-4 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_auto] lg:items-end">
          <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#9DA6C4]">
            <span className="flex items-center gap-1.5"><LocateFixed className="h-3 w-3 text-[#D4AF37]" /> Geographic anchor</span>
            <select
              value={city.id}
              onChange={event => setCity(findCity(event.target.value))}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#050710] px-3 py-3 font-mono-data text-xs font-normal text-[#F0F1F8] outline-none transition-colors focus:border-[#D4AF37]"
            >
              {(CITIES as ObservatoryCity[]).map(item => <option key={item.id} value={item.id}>{item.name}, {item.country}</option>)}
            </select>
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#9DA6C4]">
            <span>Observation instant · {city.name} local</span>
            <input
              type="datetime-local"
              value={dateInput}
              onChange={event => handleDateChange(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#050710] px-3 py-3 font-mono-data text-xs font-normal text-[#F0F1F8] outline-none transition-colors focus:border-[#D4AF37]"
            />
          </label>
          <div className="rounded-xl border border-white/[0.07] bg-[#070A13] px-3 py-3 font-mono-data text-[10px] text-[#B4BBD4]">
            <div className="text-[#D4AF37]">{city.name} · UTC{city.tz >= 0 ? '+' : ''}{city.tz}</div>
            <div className="mt-1">{formatCoordinate(city.lat, 'N', 'S')} · {formatCoordinate(city.lng, 'E', 'W')}</div>
            <div className="mt-1 text-[#7F89A7]">{date.toISOString()} · calculations in UTC</div>
          </div>
          <button type="button" onClick={() => setDate(new Date())} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D4AF37]/45 px-4 py-3 font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#F2C65D] transition-colors hover:bg-[#D4AF37]/10"><Clock3 className="h-3.5 w-3.5" /> Use now</button>
        </section>

        <nav aria-label="Quick observation times" className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#080C17] px-3 py-3">
          <span className="mr-1 flex items-center gap-1.5 font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#9DA6C4]"><SlidersHorizontal className="h-3 w-3 text-[#D4AF37]" /> Quick time</span>
          <button type="button" onClick={() => setDate(new Date())} className="rounded-lg border border-white/10 px-3 py-2 font-mono-data text-[10px] text-[#C9D0E5] transition-colors hover:border-[#D4AF37]/60 hover:text-[#F2C65D]">Now</button>
          <button type="button" onClick={() => setTodayAt(18)} className="rounded-lg border border-white/10 px-3 py-2 font-mono-data text-[10px] text-[#C9D0E5] transition-colors hover:border-[#D4AF37]/60 hover:text-[#F2C65D]">Dusk · 18:00</button>
          <button type="button" onClick={() => setTodayAt(21)} className="rounded-lg border border-white/10 px-3 py-2 font-mono-data text-[10px] text-[#C9D0E5] transition-colors hover:border-[#D4AF37]/60 hover:text-[#F2C65D]">Night · 21:00</button>
          <button type="button" onClick={() => setTodayAt(0)} className="rounded-lg border border-white/10 px-3 py-2 font-mono-data text-[10px] text-[#C9D0E5] transition-colors hover:border-[#D4AF37]/60 hover:text-[#F2C65D]">Midnight · 00:00</button>
          <span className="hidden h-5 w-px bg-white/10 sm:block" />
          <button type="button" onClick={() => shiftDate(-1)} aria-label="Move observation one hour earlier" className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 font-mono-data text-[10px] text-[#C9D0E5] transition-colors hover:border-[#D4AF37]/60 hover:text-[#F2C65D]"><RotateCcw className="h-3 w-3" /> −1 hour</button>
          <button type="button" onClick={() => shiftDate(1)} aria-label="Move observation one hour later" className="rounded-lg border border-white/10 px-3 py-2 font-mono-data text-[10px] text-[#C9D0E5] transition-colors hover:border-[#D4AF37]/60 hover:text-[#F2C65D]">+1 hour</button>
          <span className="ml-auto hidden font-mono-data text-[9px] text-[#707A98] sm:inline">Times use the selected anchor’s fixed UTC offset.</span>
        </nav>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
          <div className="rounded-2xl border border-white/[0.09] bg-[#090C16] p-3 shadow-2xl sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 font-mono-data text-[10px] uppercase tracking-[0.14em] text-[#A6ADC5]">
              <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />Local stereographic sky · zenith centred</span>
              <span className="text-[#71809F]">Horizon 0° · mask ≥{minimumAltitudeDeg}° · north at top</span>
            </div>
            <div className="h-[420px] sm:h-[600px]">
              <SkyCanvasRenderer
                date={date}
                observer={{ latitude: city.lat, longitude: city.lng }}
                selectedPlanet={selectedPlanet}
                selectedConstellation={selectedConstellation}
                onSelectObject={selectObject}
                onViewChange={handleViewportChange}
                showMandala={showMandala}
                showConstellations={showConstellations}
                minimumAltitudeDeg={minimumAltitudeDeg}
                limitingMagnitude={limitingMagnitude}
              />
            </div>
            <LiveObservationPanel
              target={liveTarget}
              date={date}
              deepZoom={skyZoom >= LIVE_OBSERVATION_ZOOM_THRESHOLD}
              onResponseChange={handleLiveResponse}
            />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0B1020] p-4">
              <div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Planet rail · 9 grahas</div>
              <p className="mt-2 text-[10px] leading-relaxed text-[#8993B0]">Tap a planet here, or tap any bright star/connected constellation line in the sky for illustrated field notes.</p>
              <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-2">
                {PLANETS.map(body => (
                  <button
                    type="button"
                    key={body}
                    onClick={() => selectObject({ kind: 'planet', id: body })}
                    className={`rounded-xl border px-2 py-2.5 text-left transition-colors ${body === selectedPlanet ? 'border-[#D4AF37] bg-[#D4AF37] text-[#070912]' : 'border-white/10 bg-[#070A14] text-[#C6CCDF] hover:border-[#D4AF37]/60'}`}
                  >
                    <span className="mr-1 text-base">{SYMBOLS[body]}</span>
                    <span className="font-mono-data text-[10px] font-bold">{body}</span>
                    {(body === 'Rahu' || body === 'Ketu') && <span className="block text-[8px] opacity-65">node</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.09] bg-[#090D1A] p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{SYMBOLS[selectedBody.body]}</span>
                <div><h2 className="font-editorial text-lg font-bold">{selectedBody.body}</h2><p className="font-mono-data text-[9px] uppercase tracking-wider text-[#8993B0]">{selectedBody.isRetrograde ? 'retrograde' : 'direct'} · {selectedBody.source}</p></div>
              </div>
              <dl className="mt-4 space-y-2 font-mono-data text-[10px]">
                <div className="flex justify-between gap-3 border-b border-white/[0.07] pb-2"><dt className="text-[#8993B0]">Tropical λ</dt><dd>{formatLongitude(selectedBody.tropicalLongitude)}</dd></div>
                <div className="flex justify-between gap-3 border-b border-white/[0.07] pb-2"><dt className="text-[#8993B0]">Sidereal λ</dt><dd className="text-[#F2C65D]">{formatLongitude(selectedBody.siderealLongitude)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#8993B0]">Declination</dt><dd>{selectedBody.declinationDeg.toFixed(2)}°</dd></div>
              </dl>
              <p className="mt-4 text-[10px] leading-relaxed text-[#8993B0]">Rahu and Ketu are mathematical lunar nodes. They remain in the rail and are never rendered as physical stars.</p>
            </div>

            <div className="rounded-2xl border border-white/[0.09] bg-[#090D1A] p-4 font-mono-data text-[10px]">
              <div className="mb-3 font-bold uppercase tracking-[0.16em] text-[#9DA6C4]">Layers</div>
              <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-[#CBD0E0]"><span>Nakshatra mandala</span><input type="checkbox" checked={showMandala} onChange={event => setShowMandala(event.target.checked)} className="accent-[#D4AF37]" /></label>
              <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-[#CBD0E0]"><span>Constellation lines</span><input type="checkbox" checked={showConstellations} onChange={event => setShowConstellations(event.target.checked)} className="accent-[#D4AF37]" /></label>
            </div>

            <div className="rounded-2xl border border-[#91C7A5]/20 bg-[#0A1515] p-4" aria-labelledby="sky-conditions-title">
              <div id="sky-conditions-title" className="font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#91C7A5]">Sky conditions</div>
              <p className="mt-2 text-[10px] leading-relaxed text-[#8FA89A]">Display filters for field work. They do not change the calculated coordinates or the approximate planner.</p>
              <label className="mt-3 block font-mono-data text-[10px] text-[#C8D9CE]">
                <span className="flex justify-between gap-2"><span>Minimum altitude</span><output>{minimumAltitudeDeg}°</output></span>
                <input type="range" min={OBSERVATION_LIMITS.minimumAltitudeDeg.min} max={OBSERVATION_LIMITS.minimumAltitudeDeg.max} step={OBSERVATION_LIMITS.minimumAltitudeDeg.step} value={minimumAltitudeDeg} onChange={event => setMinimumAltitudeDeg(Number(event.target.value))} aria-label="Minimum altitude observation mask" className="mt-2 w-full accent-[#91C7A5]" />
                <span className="mt-1 flex justify-between text-[9px] text-[#718F7B]"><span>mathematical horizon</span><span>local obstruction buffer</span></span>
              </label>
              <label className="mt-4 block font-mono-data text-[10px] text-[#C8D9CE]">
                <span className="flex justify-between gap-2"><span>Limiting magnitude</span><output>{limitingMagnitude.toFixed(1)}</output></span>
                <input type="range" min={OBSERVATION_LIMITS.limitingMagnitude.min} max={OBSERVATION_LIMITS.limitingMagnitude.max} step={OBSERVATION_LIMITS.limitingMagnitude.step} value={limitingMagnitude} onChange={event => setLimitingMagnitude(Number(event.target.value))} aria-label="Limiting stellar magnitude" className="mt-2 w-full accent-[#91C7A5]" />
                <span className="mt-1 flex justify-between text-[9px] text-[#718F7B]"><span>bright anchors</span><span>fainter catalogue stars</span></span>
              </label>
              <p className="mt-3 font-mono-data text-[9px] leading-relaxed text-[#718F7B]">The canvas will hide stars and grahas below the mask and stars fainter than the selected limit.</p>
            </div>

            <div className="rounded-2xl border border-white/[0.09] bg-[#090D1A] p-4">
              <div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#9DA6C4]">Constellation guide</div>
              <p className="mt-2 text-[10px] leading-relaxed text-[#8993B0]">Choose a pattern without needing to hit a small canvas target. It will glow in the sky; open its field notes when ready.</p>
              <select
                aria-label="Choose a constellation to highlight"
                value={selectedConstellation || ''}
                onChange={event => {
                  const value = event.target.value || null;
                  setSelectedConstellation(value);
                  if (value) {
                    setDetailSelection(null);
                    setLiveTarget({ kind: 'constellation', id: value, label: constellationDisplayName(value) });
                  }
                }}
                className="mt-3 block w-full rounded-xl border border-white/10 bg-[#050710] px-3 py-3 font-mono-data text-xs text-[#F0F1F8] outline-none transition-colors focus:border-[#D4AF37]"
              >
                <option value="">Select a pattern…</option>
                {constellationOptions.map(option => <option key={option.id} value={option.id}>{option.name} · {option.id}</option>)}
              </select>
              {selectedConstellation && <button type="button" onClick={() => setDetailSelection({ kind: 'constellation', id: selectedConstellation })} className="mt-2 w-full rounded-xl border border-[#8B8BF5]/40 bg-[#8B8BF5]/10 px-3 py-2.5 font-mono-data text-[10px] font-bold uppercase tracking-[0.12em] text-[#C4C5FF] transition-colors hover:bg-[#8B8BF5]/20">Open {constellationDisplayName(selectedConstellation)} field notes</button>}
            </div>

            <div className="rounded-2xl border border-white/[0.09] bg-[#090D1A] p-4">
              <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#9DA6C4]"><Star className="h-3 w-3 text-[#F2C65D]" /> Bright anchor list</div>
              <p className="mt-2 text-[10px] leading-relaxed text-[#8993B0]">A keyboard-friendly alternative to canvas targeting. Select a visible bright-star anchor to highlight its constellation and open field notes.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {visibleBrightAnchors.map(({ star, point }) => (
                  <button type="button" key={star.id} onClick={() => selectStar(star)} className="rounded-lg border border-white/[0.07] bg-[#070A13] px-2.5 py-2 text-left transition-colors hover:border-[#D4AF37]/55" aria-label={`Highlight ${star.name}, ${constellationDisplayName(star.constellation)}; altitude ${point.altitudeDeg.toFixed(1)} degrees`}>
                    <span className="block truncate font-mono-data text-[10px] font-bold text-[#DCE1F0]">✦ {star.name}</span>
                    <span className="mt-1 block font-mono-data text-[9px] text-[#7F89A7]">{constellationDisplayName(star.constellation)} · {point.altitudeDeg.toFixed(0)}° alt</span>
                  </button>
                ))}
              </div>
              {visibleBrightAnchors.length === 0 && <p className="mt-3 text-[10px] text-[#7F89A7]">No bright catalogue anchor clears the selected observation mask at this instant.</p>}
            </div>
          </aside>
        </section>

        <SkyAtAGlance
          date={date}
          observer={{ latitude: city.lat, longitude: city.lng }}
          minimumAltitudeDeg={minimumAltitudeDeg}
          selectedPlanet={selectedPlanet}
          onSelectObject={selectObject}
        />

        <ObservatoryStudentDesk
          date={date}
          observer={{ latitude: city.lat, longitude: city.lng }}
          cityId={city.id}
          cityName={city.name}
          timezoneOffsetHours={city.tz}
          selectedPlanet={selectedPlanet}
          studyTarget={liveTarget}
          liveResponse={liveResponse}
        />

        <footer className="flex flex-col gap-3 border-t border-white/[0.09] pt-5 text-xs text-[#9CA4BD] sm:flex-row sm:items-center sm:justify-between">
          <span>Instrument reference: 70 Yale BSC bright-star anchors · J2000 precession · local mean sidereal time.</span>
          <Link href={`/panchang/${city.id}`} className="font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#F2C65D] hover:underline">Open {city.name} Panchang ↗</Link>
        </footer>
      </div>
      {detailSelection && <CelestialDetailSheet selection={detailSelection} date={date} observer={{ latitude: city.lat, longitude: city.lng }} cityId={city.id} cityName={city.name} onClose={() => setDetailSelection(null)} />}
    </main>
  );
}

export default ObservatoryExperience;
