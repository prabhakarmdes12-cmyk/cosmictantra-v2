import type { Metadata } from 'next';
import Link from 'next/link';
import KundliDetailClient from '@/components/pro/KundliDetailClient';

export const metadata: Metadata = {
  title: 'Kundli — CosmicTantra',
  description: 'A living Jyotish Kundli workspace.',
  robots: { index: false, follow: false },
};

export default function KundliDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-6 px-3 sm:px-5">
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/kundli" className="text-xs text-[#8E6F1D] dark:text-[#D4AF37] hover:underline">← My Kundlis</Link>
          <span className="text-[10px] font-mono-data uppercase tracking-[0.24em] font-bold text-[#8E6F1D] dark:text-[#D4AF37]">Living Kundli</span>
        </div>
        <KundliDetailClient id={params.id} />
      </div>
    </main>
  );
}
