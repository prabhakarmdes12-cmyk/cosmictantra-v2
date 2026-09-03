import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Sparkles, ScrollText, ShieldCheck, ArrowRight } from 'lucide-react';
import { LIBRARY } from '@/lib/libraryContent';
import GlobalHeader from '@/components/layout/GlobalHeader';
import GlobalFooter from '@/components/layout/GlobalFooter';

export const metadata: Metadata = {
  title: 'Vedic Granth & Shastras — CosmicTantra',
  description: 'Classical Vedic literature, Brihat Parashara Hora Shastra, Bhagavad Gita, and foundational Jyotish texts.',
  alternates: { canonical: '/granth' },
};

const CLASSICAL_GRANTHS = [
  {
    title: 'बृहत्पाराशर होराशास्त्रम्',
    translit: 'Brihat Parashara Hora Shastra',
    desc: 'The foundational encyclopedic compendium of classical Vedic astrology given by Sage Parashara to Maitreya.',
    category: 'Jyotish Shastra',
    slug: 'lahiri-ayanamsha',
  },
  {
    title: 'श्रीमद्भगवद्गीता',
    translit: 'Shrimad Bhagavad Gita',
    desc: 'The sacred 700-verse Hindu scripture that is part of the epic Mahabharata, imparting timeless cosmic wisdom.',
    category: 'Vedanta & Philosophy',
    slug: '27-nakshatras',
  },
  {
    title: 'सूर्यसिद्धान्तः',
    translit: 'Surya Siddhanta',
    desc: 'The ancient treatise on Hindu astronomy describing planetary motions, solar eclipses, and sidereal time calculations.',
    category: 'Astronomy (Khagola)',
    slug: 'muhurat-shastra',
  },
  {
    title: 'मुहूर्त चिन्तामणिः',
    translit: 'Muhurta Chintamani',
    desc: 'Classical guide to auspicious astrological timings, panchang shuddhi, and electional astrology rules.',
    category: 'Muhurta Shastra',
    slug: 'rahu-kaal',
  },
];

export default function GranthPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] font-sans">
      <GlobalHeader />
      <main className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
        <header className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-[0.24em] font-bold">
            <ScrollText className="w-3.5 h-3.5" />
            <span>वैदिक ग्रन्थागार • Sacred Vedic Granth</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight">
            Sacred Scriptures & Canonical Treatises
          </h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] leading-relaxed">
            Every calculation in CosmicTantra is anchored in the verified texts of the Kashi tradition. Explore the classical root scriptures, shastras, and their modern astronomical commentary.
          </p>
        </header>

        {/* Featured Granth Cards */}
        <div className="grid sm:grid-cols-2 gap-5">
          {CLASSICAL_GRANTHS.map((g) => (
            <div
              key={g.translit}
              className="p-6 rounded-2xl bg-white dark:bg-[#0A0C14] border border-[#8E6F1D]/20 dark:border-[#D4AF37]/25 shadow-sm space-y-3 hover:border-[#8E6F1D] transition-all"
            >
              <div className="flex items-center justify-between text-xs font-mono-data">
                <span className="px-2.5 py-0.5 rounded-full bg-[#8E6F1D]/10 text-[#8E6F1D] dark:text-[#F0C968] font-bold text-[10px] uppercase">
                  {g.category}
                </span>
                <BookOpen className="w-4 h-4 text-[#8E6F1D]/60 dark:text-[#D4AF37]/60" />
              </div>
              <div>
                <h2 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-white">
                  {g.title}
                </h2>
                <div className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] font-semibold">
                  {g.translit}
                </div>
              </div>
              <p className="text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed">
                {g.desc}
              </p>
              <div className="pt-2">
                <Link
                  href={`/library/${g.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:underline"
                >
                  <span>Read Scholarly Notes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Section to Library Articles */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#8E6F1D]/10 via-[#D4AF37]/10 to-transparent border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="font-editorial text-xl sm:text-2xl font-bold">Comprehensive Vedic Library</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#AAA49A] max-w-2xl">
            Read in-depth explanatory treatises on Ayanamsha, Dasha periods, 27 Lunar Mansions, Rahu Kaal mechanics, and Milan compatibility.
          </p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black text-xs font-mono-data font-bold hover:opacity-90 transition-all shadow-sm"
          >
            <span>Browse Full Granth Library ({LIBRARY.length} Articles)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>
      <GlobalFooter />
    </div>
  );
}
