import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UPCOMING_EVENTS } from '@/lib/festivals';
import AmbientAdSlot from '@/components/AmbientAdSlot';

export const revalidate = 86400;

export function generateStaticParams() {
  return UPCOMING_EVENTS.map(e => ({ slug: e.id }));
}

const CATEGORY_HINTS: Record<string, { who: string; practice: string; why: string }> = {
  EKADASHI: { who: 'Vishnu', practice: 'fast from sunrise, Parana next morning after Vishnu Sahasranama', why: 'the eleventh lunar day is dedicated to Vishnu in both pakshas' },
  PRADOSH: { who: 'Shiva', practice: 'twilight sandhya worship with bilva leaves and Ganga jal', why: 'Trayodashi twilight is Shiva\'s own sandhya window' },
  AMAVASYA: { who: 'the ancestors (Pitru)', practice: 'tarpana, pinda daan and anna daan', why: 'the dark moon marks the monthly pitru window' },
  PURNIMA: { who: 'Lakshmi / the full Moon', practice: 'night vigil (Kojagiri) with Lakshmi invocation', why: 'full moon nights are the month\'s peak lunar energy' },
  MAJOR_FESTIVAL: { who: 'Shakti', practice: 'vrat, akhand jyot, Chandi Path', why: 'the festival carries the entire month\'s observances' },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const e = UPCOMING_EVENTS.find(x => x.id === params.slug);
  if (!e) return {};
  return {
    title: `${e.name} — ${e.category} | Date, Tithi & Puja Muhurat 2026`,
    description: `${e.name} (${e.tithi}) on ${e.dateStr}. Significance, fasting rules and puja muhurat: ${e.pujaMuhurat}. Deterministic Vedic calendar from CosmicTantra.`,
    alternates: { canonical: `/festivals/${e.id}` },
  };
}

export default function FestivalPage({ params }: { params: { slug: string } }) {
  const e = UPCOMING_EVENTS.find(x => x.id === params.slug);
  if (!e) notFound();

  const hint = CATEGORY_HINTS[e.category] || CATEGORY_HINTS.MAJOR_FESTIVAL;

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <article className="max-w-3xl mx-auto space-y-8">
        <header>
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">{e.category}</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">{e.name}</h1>
          <p className="text-sm font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] mt-2">{e.dateStr} · {e.tithi}</p>
        </header>

        <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#8E6F1D] dark:text-[#D4AF37] font-bold mb-1">Significance</div>
            <p className="text-sm text-[#57524A] dark:text-[#AAA49A] leading-relaxed">{e.significance}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#0A0C12] border border-black/[0.06] dark:border-white/[0.06]">
              <div className="text-[10px] uppercase tracking-widest text-[#4848A8] dark:text-[#8B8BF5] font-bold mb-1">Fasting & Practice</div>
              <p className="text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed">{e.fastingRules}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#0A0C12] border border-black/[0.06] dark:border-white/[0.06]">
              <div className="text-[10px] uppercase tracking-widest text-[#4848A8] dark:text-[#8B8BF5] font-bold mb-1">Puja Muhurat (indicative)</div>
              <p className="text-xs font-bold font-mono-data text-[#1C1917] dark:text-[#EFECE6]">{e.pujaMuhurat}</p>
            </div>
          </div>
          <p className="text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed">
            This observance honours <strong>{hint.who}</strong>. {hint.why.charAt(0).toUpperCase() + hint.why.slice(1)} — {hint.practice}.
            Muhurat timings are city-specific; open the city panchang for exact sunrise-anchored windows.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {UPCOMING_EVENTS.slice(0, 8).map(x => (
            <Link key={x.id} href={`/festivals/${x.id}`}
              className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${x.id === params.slug ? 'bg-[#D4AF37] border-[#D4AF37] text-[#060709]' : 'border-black/[0.1] dark:border-white/[0.1] text-[#57524A] dark:text-[#AAA49A] hover:border-[#D4AF37]'}`}>
              {x.name.split(' (')[0]}
            </Link>
          ))}
        </div>

        <AmbientAdSlot />
      </article>
    </main>
  );
}
