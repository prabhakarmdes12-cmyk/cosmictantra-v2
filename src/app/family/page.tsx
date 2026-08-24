import type { Metadata } from 'next';
import FamilyManager from '@/components/tools/FamilyManager';

export const metadata: Metadata = {
  title: 'Family Profiles — Personalised Panchang, Kundali & Alerts',
  description: 'Save your family members\' birth details (Cosmic Profiles) to get a personal Kundali, Dasha, daily Panchang windows and Vedic calendar alerts for each member. Data stays in your browser — DPDP-friendly.',
  alternates: { canonical: '/family' },
};

export default function FamilyPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="max-w-3xl">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">परिवार • Cosmic Profiles</div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold mt-2">Your Family, One Vedic Dashboard</h1>
          <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-3 leading-relaxed">
            Astrology in India is a family decision. Save each member's birth details once — every profile gets
            a cached Kundali, its own Dasha timeline, personal Panchang windows and calendar alerts, and can be
            used instantly for Kundali Milan or a ₹199 scholar consultation. No account needed; data stays in
            your browser (DPDP-friendly by design).
          </p>
        </header>
        <FamilyManager />
      </div>
    </main>
  );
}
