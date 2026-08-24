import type { Metadata } from 'next';
import NumerologyCalculator from '@/components/tools/NumerologyCalculator';

export const metadata: Metadata = {
  title: 'Business Name Numerology Calculator — Lucky Brand Number (Free)',
  description: 'Find your business or brand name number with Vedic Chaldean numerology. Ruling planet, growth traits and lucky guidance for your enterprise — plus a path to a scholar-verified naming + muhurat consultation.',
  alternates: { canonical: '/numerology/business-name' },
};

export default function BusinessNameNumerologyPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="max-w-3xl">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">व्यवसाय नाम • Business Ank</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">Business Name Numerology Calculator</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-3 leading-relaxed">
            The name on your shopfront vibrates every day you trade. Check your business or brand name's
            Chaldean number, its ruling planet, and what that number means for growth, stability and market
            visibility — then take the next step with a scholar who can also align your shop-opening Muhurat.
          </p>
        </header>
        <NumerologyCalculator mode="business" />
        <div className="grid md:grid-cols-2 gap-4 text-xs text-[#57524A] dark:text-[#AAA49A]">
          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
            <div className="font-bold text-[#8E6F1D] dark:text-[#D4AF37] mb-1">Why business names matter</div>
            Vedic tradition treats a launched enterprise as a living entity whose name carries the nakshatra of
            its first utterance. Commonly-rated numbers for trade are 1, 3, 5, 6, 9 (Sun, Jupiter, Mercury,
            Venus, Mars).
          </div>
          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
            <div className="font-bold text-[#8E6F1D] dark:text-[#D4AF37] mb-1">Name + Muhurat = complete launch</div>
            Our ₹199 consultation combines business-name analysis with a chart-aligned Muhurat for opening,
            registry or launch — one decision, one scholar, one folio.
          </div>
        </div>
      </div>
    </main>
  );
}
