import type { Metadata } from 'next';
import Link from 'next/link';
import { LIBRARY } from '@/lib/libraryContent';
import AmbientAdSlot from '@/components/AmbientAdSlot';

export const metadata: Metadata = {
  title: 'Vedic Library — Panchang, Kundali & Muhurat Explained',
  description: 'Structured guides to Vedic astronomy and Jyotish: Lahiri Ayanamsha, Vimshottari Dasha, 27 Nakshatras, Rahu Kaal, Mangal Dosh, Kundli Milan, Muhurat Shastra and Kashi festivals.',
  alternates: { canonical: '/library' },
};

export default function LibraryPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="max-w-3xl">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">वैदिक ग्रंथालय • Vedic Library</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">Understand the instrument before you use it</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-3 leading-relaxed">
            Deterministic Vedic astronomy explained plainly — no mystery, no fear-marketing. Every guide links
            to the live tool that computes it.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIBRARY.map(a => (
            <Link key={a.slug} href={`/library/${a.slug}`}
              className="group p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm hover:border-[#D4AF37] transition-all">
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#4848A8] dark:text-[#8B8BF5] font-bold">{a.category}</div>
              <div className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#EFECE6] mt-1.5 group-hover:text-[#8E6F1D] dark:group-hover:text-[#E5C378]">{a.title}</div>
              <p className="text-[11px] text-[#57524A] dark:text-[#AAA49A] mt-2 leading-relaxed">{a.excerpt}</p>
            </Link>
          ))}
        </div>
        <AmbientAdSlot />
      </div>
    </main>
  );
}
