import type { Metadata } from 'next';
import KundliListClient from '@/components/pro/KundliListClient';

export const metadata: Metadata = {
  title: 'My Kundlis — CosmicTantra',
  description: 'Your persistent, living Jyotish Kundlis. One birth record → one canonical chart → every calculation and report.',
  alternates: { canonical: '/kundli' },
};

export default function KundliIndexPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-6 px-3 sm:px-5">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <div className="text-[10px] font-mono-data uppercase tracking-[0.24em] font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
            Living Kundli
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold mt-1">My Kundlis</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-1">
            Enter birth details once. Get a permanent workspace with charts, dashas, strengths, reports and more — all
            derived from one canonical calculation. Your Kundlis stay private to you on this device.
          </p>
        </header>
        <KundliListClient />
      </div>
    </main>
  );
}
