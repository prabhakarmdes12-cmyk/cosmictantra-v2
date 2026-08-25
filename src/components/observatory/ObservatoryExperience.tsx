'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import CelestialDetailSheet from './CelestialDetailSheet';
import SkyCanvasRenderer from './SkyCanvasRenderer';
import { calculateCanonicalBody, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import type { CelestialSelection } from '@/lib/astronomy/celestialCatalog';
import { CITIES } from '@/lib/cities';

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

function toDateTimeInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
}

export function ObservatoryExperience({
  initialCity,
  initialTime,
  initialPlanet,
}: ObservatoryExperienceProps) {
  const [city, setCity] = useState<ObservatoryCity>(() => findCity(initialCity));
  const [date, setDate] = useState<Date>(() => validDate(initialTime));
  const [selectedPlanet, setSelectedPlanet] = useState<CanonicalBodyName>(() => {
    const value = PLANETS.find(body => body.toLowerCase() === (initialPlanet || '').toLowerCase());
    return value || 'Sun';
  });
  const [showMandala, setShowMandala] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [selectedConstellation, setSelectedConstellation] = useState<string | null>(null);
  const [detailSelection, setDetailSelection] = useState<CelestialSelection | null>(null);

  const selectedBody = useMemo(() => calculateCanonicalBody(selectedPlanet, date), [selectedPlanet, date]);
  const dateInput = toDateTimeInput(date);
  const query = (path: string) => {
    const params = new URLSearchParams({ city: city.id, time: date.toISOString(), planet: selectedPlanet });
    return `${path}?${params.toString()}`;
  };

  const handleDateChange = (value: string) => {
    const next = new Date(value);
    if (Number.isFinite(next.getTime())) setDate(next);
  };

  const selectObject = (selection: CelestialSelection) => {
    setDetailSelection(selection);
    if (selection.kind === 'planet') {
      setSelectedPlanet(selection.id);
      setSelectedConstellation(null);
    }
    if (selection.kind === 'constellation') setSelectedConstellation(selection.id);
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
          </div>
        </header>

        <section className="grid gap-4 rounded-2xl border border-white/[0.09] bg-[#0A0D18] p-4 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_auto] lg:items-end">
          <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#9DA6C4]">
            Geographic anchor
            <select
              value={city.id}
              onChange={event => setCity(findCity(event.target.value))}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#050710] px-3 py-3 font-mono-data text-xs font-normal text-[#F0F1F8] outline-none transition-colors focus:border-[#D4AF37]"
            >
              {(CITIES as ObservatoryCity[]).map(item => <option key={item.id} value={item.id}>{item.name}, {item.country}</option>)}
            </select>
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#9DA6C4]">
            Observation instant
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
            <div className="mt-1 text-[#7F89A7]">{date.toISOString()}</div>
          </div>
          <button type="button" onClick={() => setDate(new Date())} className="rounded-xl border border-[#D4AF37]/45 px-4 py-3 font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#F2C65D] transition-colors hover:bg-[#D4AF37]/10">Use now</button>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
          <div className="rounded-2xl border border-white/[0.09] bg-[#090C16] p-3 shadow-2xl sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 font-mono-data text-[10px] uppercase tracking-[0.14em] text-[#A6ADC5]">
              <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />Local stereographic sky · zenith centred</span>
              <span className="text-[#71809F]">Horizon altitude 0° · north at top</span>
            </div>
            <div className="h-[420px] sm:h-[600px]">
              <SkyCanvasRenderer
                date={date}
                observer={{ latitude: city.lat, longitude: city.lng }}
                selectedPlanet={selectedPlanet}
                selectedConstellation={selectedConstellation}
                onSelectObject={selectObject}
                showMandala={showMandala}
                showConstellations={showConstellations}
              />
            </div>
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
          </aside>
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/[0.09] pt-5 text-xs text-[#9CA4BD] sm:flex-row sm:items-center sm:justify-between">
          <span>Instrument reference: 70 Yale BSC bright-star anchors · J2000 precession · local mean sidereal time.</span>
          <Link href={`/panchang/${city.id}`} className="font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#F2C65D] hover:underline">Open {city.name} Panchang ↗</Link>
        </footer>
      </div>
      {detailSelection && <CelestialDetailSheet selection={detailSelection} date={date} observer={{ latitude: city.lat, longitude: city.lng }} cityId={city.id} onClose={() => setDetailSelection(null)} />}
    </main>
  );
}

export default ObservatoryExperience;
