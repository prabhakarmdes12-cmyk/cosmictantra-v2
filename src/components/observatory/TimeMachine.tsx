'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import CelestialDetailSheet from './CelestialDetailSheet';
import SkyCanvasRenderer from './SkyCanvasRenderer';
import { calculateCanonicalBody, type CanonicalBody, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import type { CelestialSelection } from '@/lib/astronomy/celestialCatalog';
import { getRashiForLongitude } from '@/lib/astronomy/eclipticProjection';
import { CITIES } from '@/lib/cities';

const BODIES: CanonicalBodyName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SYMBOLS: Record<string, string> = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋' };

type City = { id: string; name: string; lat: number; lng: number; tz: number };

function findCity(id?: string): City {
  const cities = CITIES as City[];
  return cities.find(city => city.id === id) || cities.find(city => city.id === 'varanasi') || cities[0];
}

function validDate(value?: string): Date {
  const result = value ? new Date(value) : new Date();
  return Number.isFinite(result.getTime()) ? result : new Date();
}

function inputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function rashi(body: CanonicalBody): string {
  const descriptor = getRashiForLongitude(body.siderealLongitude);
  return `${descriptor.glyph} ${descriptor.name}`;
}

function shortDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface TimeMachineProps {
  initialCity?: string;
  initialTime?: string;
  initialPlanet?: string;
}

function TimeMachine({ initialCity, initialTime, initialPlanet }: TimeMachineProps) {
  const city = useMemo(() => findCity(initialCity), [initialCity]);
  const now = useMemo(() => validDate(initialTime), [initialTime]);
  const [birthDate, setBirthDate] = useState<Date>(() => new Date('1995-06-15T10:30:00'));
  const [progress, setProgress] = useState(100);
  const [selectedPlanet, setSelectedPlanet] = useState<CanonicalBodyName>(() => BODIES.find(body => body.toLowerCase() === (initialPlanet || '').toLowerCase()) || 'Moon');
  const [detailSelection, setDetailSelection] = useState<CelestialSelection | null>(null);

  const simulatedDate = useMemo(() => new Date(birthDate.getTime() + (now.getTime() - birthDate.getTime()) * progress / 100), [birthDate, now, progress]);
  const birthBodies = useMemo(() => BODIES.map(body => calculateCanonicalBody(body, birthDate)), [birthDate]);
  const nowBodies = useMemo(() => BODIES.map(body => calculateCanonicalBody(body, now)), [now]);
  const selectedBody = calculateCanonicalBody(selectedPlanet, simulatedDate);

  const setBirthFromInput = (value: string) => {
    const next = new Date(value);
    if (Number.isFinite(next.getTime())) {
      setBirthDate(next);
      setProgress(0);
    }
  };

  const openSelection = (selection: CelestialSelection) => {
    setDetailSelection(selection);
    if (selection.kind === 'planet') setSelectedPlanet(selection.id);
  };

  return (
    <main className="min-h-screen bg-[#05060B] text-[#ECEAF1]">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="flex flex-col gap-4 border-b border-white/[0.09] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">Temporal instrument · transit trace</div>
            <h1 className="mt-2 font-editorial text-3xl font-bold sm:text-4xl">Sky Time Machine</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#AEB4C8]">Scrub from a natal instant to today and see which sidereal rashis each graha crosses. The slider is an interpolation control for inspection, not a claim that planetary motion is linear.</p>
          </div>
          <Link href={`/observatory?city=${city.id}&time=${encodeURIComponent(now.toISOString())}&planet=${selectedPlanet}`} className="font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#F2C65D] hover:underline">← Local sky</Link>
        </header>

        <section className="grid gap-4 rounded-2xl border border-white/[0.09] bg-[#0A0D18] p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#9DA6C4]">Birth date and time
            <input type="datetime-local" value={inputValue(birthDate)} onChange={event => setBirthFromInput(event.target.value)} className="mt-2 block w-full rounded-xl border border-white/10 bg-[#050710] px-3 py-3 text-xs font-normal text-[#F0F1F8] outline-none focus:border-[#D4AF37]" />
          </label>
          <div className="rounded-xl border border-white/[0.07] bg-[#070A13] px-3 py-3 font-mono-data text-[10px] text-[#B4BBD4]">
            <div className="text-[#D4AF37]">Anchor · {city.name}</div>
            <div className="mt-1">Birth {shortDate(birthDate)} → Now {shortDate(now)}</div>
            <div className="mt-1 text-[#7F89A7]">Simulated: {simulatedDate.toISOString()}</div>
          </div>
          <button type="button" onClick={() => setProgress(100)} className="rounded-xl border border-white/10 px-4 py-3 font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#C7CDE1] hover:border-[#D4AF37]/60">Jump to now</button>
        </section>

        <section className="rounded-2xl border border-[#D4AF37]/30 bg-[#0B1020] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono-data text-[10px] uppercase tracking-[0.15em]">
            <span className="font-bold text-[#F2C65D]">Timeline scrubber</span>
            <span className="text-[#C6CCDF]">{progress}% · {shortDate(simulatedDate)}</span>
          </div>
          <input aria-label="Time machine progress" type="range" min="0" max="100" step="1" value={progress} onChange={event => setProgress(Number(event.target.value))} className="mt-4 h-2 w-full cursor-pointer accent-[#D4AF37]" />
          <div className="mt-2 flex justify-between font-mono-data text-[9px] text-[#8590AE]"><span>0 · birth sky</span><span>50 · midpoint</span><span>100 · {shortDate(now)}</span></div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-white/[0.09] bg-[#090C16] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between px-1 font-mono-data text-[10px] uppercase tracking-[0.14em] text-[#A6ADC5]"><span>Live sky at scrubbed instant</span><span className="text-[#71809F]">{selectedPlanet} selected</span></div>
            <div className="h-[410px] sm:h-[590px]">
              <SkyCanvasRenderer
                date={simulatedDate}
                observer={{ latitude: city.lat, longitude: city.lng }}
                selectedPlanet={selectedPlanet}
                onSelectObject={openSelection}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-[#A8B0C8] sm:grid-cols-4">
              <div className="rounded-lg border border-white/[0.07] bg-[#070A13] px-3 py-2">Tropical {selectedBody.tropicalLongitude.toFixed(2)}°</div>
              <div className="rounded-lg border border-white/[0.07] bg-[#070A13] px-3 py-2">Sidereal {selectedBody.siderealLongitude.toFixed(2)}°</div>
              <div className="rounded-lg border border-white/[0.07] bg-[#070A13] px-3 py-2">{rashi(selectedBody)}</div>
              <div className="rounded-lg border border-white/[0.07] bg-[#070A13] px-3 py-2">{selectedBody.isRetrograde ? 'Retrograde' : 'Direct'}</div>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/[0.09] bg-[#090D1A] p-4">
            <div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Transit inspector</div>
            <p className="mt-2 text-[10px] leading-relaxed text-[#8F99B5]">Change detection compares the birth rashi with the current endpoint. A row can stay in the same rashi while its degree advances.</p>
            <div className="mt-4 space-y-2">
              {BODIES.map(body => {
                const birth = birthBodies.find(item => item.body === body)!;
                const endpoint = nowBodies.find(item => item.body === body)!;
                const changed = getRashiForLongitude(birth.siderealLongitude).index !== getRashiForLongitude(endpoint.siderealLongitude).index;
                return (
                  <button type="button" key={body} onClick={() => openSelection({ kind: 'planet', id: body })} aria-label={`Open ${body} celestial details`} className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left ${selectedPlanet === body ? 'border-[#D4AF37]/70 bg-[#D4AF37]/10' : 'border-white/[0.07] bg-[#070A13] hover:border-white/20'}`}>
                    <span className="flex items-center gap-2"><span className="text-base">{SYMBOLS[body]}</span><span className="font-mono-data text-[10px] font-bold text-[#D7DBEA]">{body}</span></span>
                    <span className={`font-mono-data text-[9px] font-bold ${changed ? 'text-[#F3A66A]' : 'text-[#91C7A5]'}`}>{changed ? 'changed' : 'same'}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#090D1A]">
          <div className="border-b border-white/[0.08] px-4 py-4"><h2 className="font-editorial text-xl font-bold">Birth rashi → now rashi</h2><p className="mt-1 font-mono-data text-[10px] text-[#8993B0]">{BODIES.length} grahas · sidereal Lahiri positions</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-[#070A13] font-mono-data text-[9px] uppercase tracking-[0.14em] text-[#8993B0]"><tr><th className="px-4 py-3">Graha</th><th className="px-4 py-3">At birth</th><th className="px-4 py-3">At now</th><th className="px-4 py-3">Motion</th><th className="px-4 py-3">Detection</th></tr></thead>
              <tbody>
                {BODIES.map(body => {
                  const birth = birthBodies.find(item => item.body === body)!;
                  const endpoint = nowBodies.find(item => item.body === body)!;
                  const birthRashi = getRashiForLongitude(birth.siderealLongitude);
                  const endpointRashi = getRashiForLongitude(endpoint.siderealLongitude);
                  const changed = birthRashi.index !== endpointRashi.index;
                  return <tr key={body} className="border-t border-white/[0.07]"><td className="px-4 py-3 font-mono-data font-bold text-[#DCE0EF]">{SYMBOLS[body]} {body}</td><td className="px-4 py-3 text-[#B9C0D6]">{birthRashi.glyph} {birthRashi.name} <span className="font-mono-data text-[9px] text-[#7C87A6]">{birth.siderealLongitude.toFixed(1)}°</span></td><td className="px-4 py-3 text-[#B9C0D6]">{endpointRashi.glyph} {endpointRashi.name} <span className="font-mono-data text-[9px] text-[#7C87A6]">{endpoint.siderealLongitude.toFixed(1)}°</span></td><td className="px-4 py-3 font-mono-data text-[10px] text-[#AAB3CC]">{endpoint.isRetrograde ? 'retrograde' : 'direct'}</td><td className={`px-4 py-3 font-mono-data text-[10px] font-bold ${changed ? 'text-[#F3A66A]' : 'text-[#91C7A5]'}`}>{changed ? 'RASHI CHANGE' : 'within same rashi'}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {detailSelection && <CelestialDetailSheet selection={detailSelection} date={simulatedDate} observer={{ latitude: city.lat, longitude: city.lng }} cityId={city.id} onClose={() => setDetailSelection(null)} />}
    </main>
  );
}

export { TimeMachine };

export default TimeMachine;
