import type { Metadata } from 'next';
import NumerologyCalculator from '@/components/tools/NumerologyCalculator';

export const metadata: Metadata = {
  title: 'Mobile Number Numerology — Lucky Number Check (Free)',
  description: 'Check your mobile number with Vedic numerology. Get the Chaldean number, ruling planet, last-digit influence and guidance — free, instant, computed in your browser.',
  alternates: { canonical: '/numerology/mobile-number' },
};

export default function MobileNumberNumerologyPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="max-w-3xl">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">मोबाइल अंक • Mobile Ank</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">Mobile Number Numerology</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-3 leading-relaxed">
            In Vedic numerology practice, the digits you vibrate with daily matter. Enter any 10-digit Indian
            mobile number to find its root number, ruling planet and the influence of your final digit. Free,
            instant, and computed entirely in your browser.
          </p>
        </header>
        <NumerologyCalculator mode="mobile" />
      </div>
    </main>
  );
}
