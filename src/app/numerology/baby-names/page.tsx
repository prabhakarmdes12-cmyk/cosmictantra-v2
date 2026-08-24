import type { Metadata } from 'next';
import BabyNameFinder from '@/components/tools/BabyNameFinder';

export const metadata: Metadata = {
  title: 'Baby Names by Nakshatra — Janma Nakshatra Name Finder (Free)',
  description: 'Find traditional baby names by Janma Nakshatra. Select the birth star (Krittika, Rohini, Magha, Swati, Shravana and more) to see name suggestions starting with the classical Namakshara syllables — with Vedic number and ruling planet.',
  alternates: { canonical: '/numerology/baby-names' },
};

export default function BabyNamesPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="max-w-3xl">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">नामकरण • Namakshara</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">Baby Names by Janma Nakshatra</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-3 leading-relaxed">
            The Namakshara (name syllable) of a child is determined by the Moon's nakshatra at birth. Choose
            the birth star and find classical names beginning with the correct syllable — each scored with its
            Chaldean number and ruling planet.
          </p>
        </header>
        <BabyNameFinder />
      </div>
    </main>
  );
}
