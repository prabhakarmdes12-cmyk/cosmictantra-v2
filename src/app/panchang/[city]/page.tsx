import type { Metadata } from 'next';
import Link from 'next/link';
import { CITIES } from '@/lib/cities';
import { calculatePanchang } from '@/lib/panchang';
import AmbientAdSlot from '@/components/AmbientAdSlot';

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return CITIES.map(c => ({ city: c.id }));
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const c = CITIES.find(x => x.id === params.city);
  if (!c) return {};
  return {
    title: `Aaj ka Panchang ${c.name} — Tithi, Nakshatra, Rahu Kaal, Abhijit Muhurat`,
    description: `Today's Vedic Panchang for ${c.name}, ${c.state}: tithi, nakshatra, yoga, karana, sunrise/sunset, Rahu Kaal, Yamaganda, Gulika and Abhijit Muhurat — computed deterministically for ${c.lat}°N, ${c.lng}°E (Lahiri ayanamsha).`,
    alternates: { canonical: `/panchang/${c.id}` },
  };
}

export default function CityPanchangPage({ params }: { params: { city: string } }) {
  const city = CITIES.find(x => x.id === params.city);
  if (!city) return <main className="min-h-screen flex items-center justify-center text-sm">City not found. <Link href="/panchang/patna" className="underline ml-2">See Patna</Link></main>;

  const now = new Date();
  const p = calculatePanchang(now, { lat: city.lat, lng: city.lng, tz: city.tz, name: city.name });
  const tithi = p.tithi?.name ?? p.tithi;
  const nakshatra = p.nakshatra?.name ?? p.nakshatra;
  const yoga = p.yoga?.name ?? p.yoga;
  const karana = p.karana?.name ?? p.karana;

  const rows = [
    ['Tithi', tithi],
    ['Nakshatra', nakshatra],
    ['Yoga', yoga],
    ['Karana', karana],
    ['Sunrise', p.sun?.sunrise ?? '—'],
    ['Sunset', p.sun?.sunset ?? '—'],
    ['Rahu Kaal', p.timings?.rahuKalam],
    ['Yamaganda', p.timings?.yamaganda],
    ['Gulika Kaal', p.timings?.gulikaKalam],
    ['Abhijit Muhurat', p.timings?.abhijitMuhurat],
  ];

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">
            {city.name}, {city.state} · {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">
            Aaj ka Panchang — {city.name}
          </h1>
          <p className="text-xs font-mono-data text-[#57524A] dark:text-[#AAA49A] mt-3">
            {city.lat}°N, {city.lng}°E · Lahiri ayanamsha {p.ayanamsha}° · {p.currentPeriod || 'Deterministic calculation'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href={`/observatory?city=${city.id}&time=${now.toISOString()}`}
              className="px-4 py-2 rounded-lg border border-[#D4AF37] text-[10px] font-bold font-mono-data text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#060709] transition-all uppercase tracking-widest"
            >
              ⟡ View in Observatory
            </Link>
            <Link
              href={`/observatory/ecliptic?city=${city.id}&time=${now.toISOString()}`}
              className="px-4 py-2 rounded-lg border border-black/[0.12] dark:border-white/[0.12] text-[10px] font-bold font-mono-data text-[#57524A] dark:text-[#AAA49A] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all uppercase tracking-widest"
            >
              Ecliptic Chart
            </Link>
          </div>
        </header>

        <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.05] pb-2">
                <span className="text-[10px] uppercase tracking-widest text-[#4848A8] dark:text-[#8B8BF5] font-bold">{k}</span>
                <span className="text-xs font-bold font-mono-data text-[#1C1917] dark:text-[#EFECE6]">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {CITIES.slice(0, 15).map(c => (
            <Link key={c.id} href={`/panchang/${c.id}`}
              className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${c.id === params.city ? 'bg-[#D4AF37] border-[#D4AF37] text-[#060709]' : 'border-black/[0.1] dark:border-white/[0.1] text-[#57524A] dark:text-[#AAA49A] hover:border-[#D4AF37]'}`}>
              {c.name}
            </Link>
          ))}
        </div>

        <AmbientAdSlot />
      </div>
    </main>
  );
}
