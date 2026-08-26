import type { Metadata } from 'next';
import Link from 'next/link';
import EclipticInstrument from '@/components/observatory/EclipticInstrument';
import { getLahiriAyanamsha, toJulianDay } from '@/lib/astronomy/canonicalBodies';
import { parseCelestialSelection } from '@/lib/astronomy/celestialCatalog';
import { CITIES } from '@/lib/cities';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ecliptic Instrument — Rashi & Nakshatra Planisphere',
  description: 'Top-down tropical ecliptic planisphere with 12 rashi sectors, 27 Nakshatra divisions, and a tropical-to-sidereal inspector for all nine grahas including Rahu and Ketu.',
  alternates: { canonical: '/observatory/ecliptic' },
};

type SearchParams = Record<string, string | string[] | undefined>;
type City = { id: string; name: string; state: string; lat: number; lng: number; tz: number };

function first(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function cityFor(value?: string): City {
  const cities = CITIES as City[];
  return cities.find(city => city.id === (value || '').toLowerCase()) || cities.find(city => city.id === 'varanasi') || cities[0];
}
function validDate(value?: string): Date {
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
}

export default function EclipticPage({ searchParams }: { searchParams: SearchParams }) {
  const city = cityFor(first(searchParams?.city));
  const date = validDate(first(searchParams?.time));
  const planet = first(searchParams?.planet);
  const initialSelection = parseCelestialSelection(first(searchParams?.object), first(searchParams?.objectKind));
  const query = `city=${city.id}&time=${encodeURIComponent(date.toISOString())}${planet ? `&planet=${encodeURIComponent(planet)}` : ''}`;
  const ayanamsha = getLahiriAyanamsha(toJulianDay(date));

  return (
    <main className="min-h-screen bg-[#05060B] text-[#ECEAF1]">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="flex flex-col gap-5 border-b border-white/[0.09] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl"><div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">राशि चक्र · ecliptic instrument</div><h1 className="mt-3 font-editorial text-4xl font-bold">The ecliptic, translated</h1><p className="mt-3 text-sm leading-relaxed text-[#AEB4C8]">A planisphere of the moving sky at {date.toLocaleString('en-IN')} for {city.name}. The astronomical ring is tropical; the inspector gives the corresponding Lahiri sidereal rashi and Nakshatra.</p></div>
          <div className="flex flex-wrap gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.13em]"><Link href={`/observatory?${query}`} className="rounded-full border border-white/10 px-3 py-2 text-[#C7CDE1] hover:border-[#D4AF37]/60">← Observatory</Link><Link href={`/panchang/${city.id}`} className="rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3 py-2 text-[#F2C65D] hover:bg-[#D4AF37]/20">Open {city.name} Panchang ↗</Link></div>
        </header>
        <div className="rounded-xl border border-white/[0.08] bg-[#0A0D18] px-4 py-3 font-mono-data text-[10px] text-[#9FA8C1]">{city.name} · {city.lat.toFixed(4)}°N {city.lng.toFixed(4)}°E · Lahiri ayanamsha {ayanamsha.toFixed(3)}° · coordinates are calculated, not fetched from a third-party sky service</div>
        <EclipticInstrument
          date={date.toISOString()}
          ayanamsha={ayanamsha}
          selectedPlanet={planet}
          observer={{ latitude: city.lat, longitude: city.lng }}
          cityId={city.id}
          cityName={city.name}
          initialSelection={initialSelection}
        />
        <footer className="border-t border-white/[0.09] pt-5 text-[10px] leading-relaxed text-[#7F89A7]">Tropical longitude is used for the planisphere because it is the astronomy reference frame. Sidereal longitude is tropical longitude minus the displayed Chitra Paksha ayanamsha; no coordinate frame is silently mixed.</footer>
      </div>
    </main>
  );
}
