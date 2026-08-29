import type { Metadata } from 'next';
import WorkbenchClient from '@/components/pro/WorkbenchClient';

export const metadata: Metadata = {
  title: 'Jyotish Workbench — CosmicTantra',
  description: 'A professional multi-panel Kundli workspace: charts, vargas, dasha, bala, ashtakavarga, Jaimini, KP, gochar, varshaphala, panchang, prashna and composable reports — all deterministic, offline, no paid APIs.',
  alternates: { canonical: '/workbench' },
};

export default function WorkbenchPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-6 px-3 sm:px-5">
      <div className="max-w-[1400px] mx-auto space-y-4">
        <header>
          <div className="text-[10px] font-mono-data uppercase tracking-[0.24em] font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
            Pandit View · Jyotish Workbench
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold mt-1">Jyotish Workbench</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-1 max-w-3xl">
            One Kundli, many panels. Add, remove, resize and reorder; save your workspace. Switch D1 → D9 → D10 → D60
            instantly. Press <kbd className="px-1 rounded border border-black/20 dark:border-white/20">⌘K</kbd> to reach any calculation.
          </p>
        </header>
        <WorkbenchClient />
      </div>
    </main>
  );
}
