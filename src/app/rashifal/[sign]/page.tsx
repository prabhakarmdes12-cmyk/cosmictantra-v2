import type { Metadata } from 'next';
import Link from 'next/link';
import { SIGNS, dailyRashifal } from '@/lib/rashifal';
import AmbientAdSlot from '@/components/AmbientAdSlot';

export const revalidate = 3600; // fresh daily search content without full SSG staleness

export function generateStaticParams() {
  return SIGNS.map(s => ({ sign: s.id }));
}

export async function generateMetadata({ params }: { params: { sign: string } }): Promise<Metadata> {
  const s = SIGNS.find(x => x.id === params.sign);
  if (!s) return {};
  return {
    title: `Aaj ka Rashifal — ${s.sanskrit} (${s.hi}) | Daily ${s.en} Horoscope`,
    description: `Daily ${s.en} (${s.sanskrit}) rashifal in Hindi and English: career, love, health, lucky colour and number — anchored to today's real Moon transit, tithi and nakshatra.`,
    alternates: { canonical: `/rashifal/${s.id}` },
  };
}

export default function RashifalPage({ params }: { params: { sign: string } }) {
  const r = dailyRashifal(params.sign);
  const { sign } = r;

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">आज का राशिफल · {r.dateStr}</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">
            {sign.sanskrit} <span className="text-[#8E6F1D] dark:text-[#D4AF37]">({sign.hi})</span> — {sign.en}
          </h1>
          <p className="text-xs font-mono-data text-[#57524A] dark:text-[#AAA49A] mt-3 max-w-2xl mx-auto">
            Moon now in <strong>{r.moonSignNow}</strong> · {r.tithi} tithi · {r.nakshatra} nakshatra
          </p>
        </header>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'Career / Business', text: r.career },
            { label: 'Love & Relationships', text: r.love },
            { label: 'Health & Vitality', text: r.health },
          ].map(c => (
            <div key={c.label} className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">{c.label}</div>
              <p className="text-xs text-[#57524A] dark:text-[#AAA49A] mt-2 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-[#D4AF37]/30 shadow-sm flex flex-wrap gap-6 font-mono-data">
          <div><div className="text-[9px] uppercase tracking-widest text-[#4848A8] dark:text-[#8B8BF5] font-bold">Lucky Colour</div><div className="text-sm font-bold mt-0.5">{r.lucky.color}</div></div>
          <div><div className="text-[9px] uppercase tracking-widest text-[#4848A8] dark:text-[#8B8BF5] font-bold">Lucky Number</div><div className="text-sm font-bold mt-0.5">{r.lucky.number}</div></div>
          <div><div className="text-[9px] uppercase tracking-widest text-[#4848A8] dark:text-[#8B8BF5] font-bold">Favourable Day</div><div className="text-sm font-bold mt-0.5">{r.lucky.day}</div></div>
          <div className="text-[10px] text-[#857E74] dark:text-[#8E8A82] self-center">
            Ruled by {sign.planet} · {r.snippetHi}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {SIGNS.map(s => (
            <Link key={s.id} href={`/rashifal/${s.id}`}
              className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${s.id === params.sign ? 'bg-[#D4AF37] border-[#D4AF37] text-[#060709]' : 'border-black/[0.1] dark:border-white/[0.1] text-[#57524A] dark:text-[#AAA49A] hover:border-[#D4AF37]'}`}>
              {s.sanskrit}
            </Link>
          ))}
        </div>

        <p className="text-[10px] text-[#857E74] dark:text-[#8E8A82] text-center max-w-2xl mx-auto">
          Transit data computed from the sidereal engine (Lahiri ayanamsha) for Patna coordinates. Rashifal is
          timing-guidance content; deterministic calculations and scholar-verified interpretation remain separate.
        </p>

        <AmbientAdSlot />
      </div>
    </main>
  );
}
