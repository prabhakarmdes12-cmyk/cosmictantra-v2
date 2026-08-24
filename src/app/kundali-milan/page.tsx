import type { Metadata } from 'next';
import KundaliMilanTool from '@/components/tools/KundaliMilanTool';

export const metadata: Metadata = {
  title: 'Kundali Milan — Ashtakoota Compatibility Calculator (Free)',
  description: 'Free Kundali Milan calculator with the classical Ashtakoota system: Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot and Nadi — 36 points plus Mangal Dosh check. Deterministic computation from two birth charts.',
  alternates: { canonical: '/kundali-milan' },
};

export default function KundaliMilanPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="max-w-3xl">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">कुंडली मिलान • Ashtakoota</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">Kundali Milan — 36-Point Ashtakoota</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-3 leading-relaxed">
            Enter both birth charts and get the classical eight-Koota compatibility score (Varna 1, Vashya 2,
            Tara 3, Yoni 4, Graha Maitri 5, Gana 6, Bhakoot 7, Nadi 8) with a Mangal Dosh check. Every number
            is computed deterministically from the sidereal chart — and a scholar-verified Milan review is one
            click away.
          </p>
        </header>
        <KundaliMilanTool />
      </div>
    </main>
  );
}
