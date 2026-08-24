import type { Metadata } from 'next';
import NumerologyCalculator from '@/components/tools/NumerologyCalculator';

export const metadata: Metadata = {
  title: 'Name Numerology Calculator — Namank, Mulank & Bhagyank (Free)',
  description: 'Free Vedic name numerology calculator. Compute your Namank (name number), Mulank, Bhagyank and name-destiny harmony using the Chaldean system. Ruling planet, lucky numbers and traits included.',
  alternates: { canonical: '/numerology/name' },
};

export default function NameNumerologyPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="max-w-3xl">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">अंक ज्योतिष • Ank Jyotish</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">Name Numerology Calculator</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-3 leading-relaxed">
            Vedic numerology (Ank Jyotish) reads the vibration of your name. Enter your name to find your
            <strong> Namank</strong> (name number) and its ruling planet — then add your birth date for the
            Mulank (root number), Bhagyank (destiny number) and name-destiny harmony score. Chaldean
            (sound-based) and Pythagorean systems both supported.
          </p>
        </header>
        <NumerologyCalculator mode="name" />
        <div className="grid md:grid-cols-3 gap-4 text-xs text-[#57524A] dark:text-[#AAA49A]">
          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
            <div className="font-bold text-[#8E6F1D] dark:text-[#D4AF37] mb-1">Mulank (मूलांक)</div>
            Reduced birth-day number — your core nature and instinct.
          </div>
          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
            <div className="font-bold text-[#8E6F1D] dark:text-[#D4AF37] mb-1">Bhagyank (भाग्यांक)</div>
            Reduced full birth-date number — your life purpose and destiny path.
          </div>
          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.06]">
            <div className="font-bold text-[#8E6F1D] dark:text-[#D4AF37] mb-1">Namank (नामांक)</div>
            Chaldean value of your name — how the world perceives you. Harmony with Bhagyank matters.
          </div>
        </div>
      </div>
    </main>
  );
}
