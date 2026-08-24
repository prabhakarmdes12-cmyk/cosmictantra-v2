import type { Metadata } from 'next';
import FamilyManager from '@/components/tools/FamilyManager';
import CosmicIdCard from '@/components/visual/CosmicIdCard';
import TrustBar from '@/components/visual/TrustBar';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Family Profiles — Personalised Panchang, Kundali & Alerts',
  description: 'Save your family members\' birth details (Cosmic Profiles) to get a personal Kundali, Dasha, daily Panchang windows and Vedic calendar alerts for each member. Data stays in your browser — DPDP-friendly.',
  alternates: { canonical: '/family' },
};

export default function FamilyPage() {
  // Demo Cosmic ID card data (would come from profile context in real app)
  const demoCosmicProfile = {
    whatsappPhone: '+919876543210',
    fullName: 'Priya Sharma & Family',
    cosmicId: 'CT-4821',
    consentGiven: true,
    familyMembersCount: 4,
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        {/* Trust Bar */}
        <TrustBar />

        <div className="mt-10 max-w-3xl">
          <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] font-bold">परिवार • Cosmic Profiles</div>
          <h1 className="font-editorial text-5xl sm:text-6xl font-bold tracking-[-1.5px] mt-3">Your Family, One Vedic Dashboard</h1>
          <p className="mt-4 text-lg text-[#57524A] dark:text-[#AAA49A] leading-relaxed max-w-prose">
            Astrology in India is a family decision. Save each member’s birth details once — every profile gets its own Kundali, Dasha, daily Panchang windows, and calendar alerts.
          </p>
        </div>

        {/* Premium Cosmic ID Card */}
        <div className="mt-10">
          <CosmicIdCard profile={demoCosmicProfile} />
        </div>

        {/* Family Manager Section */}
        <div id="family-manager" className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="uppercase tracking-[2px] text-xs text-[#8E6F1D]">MANAGE PROFILES</div>
              <div className="font-semibold text-3xl">Cosmic Profiles</div>
            </div>
            <Link href="/profile" className="text-sm text-[#8E6F1D] hover:underline flex items-center gap-1">
              View full Cosmic ID →
            </Link>
          </div>
          <FamilyManager />
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-16 pt-8 border-t border-[#D4AF37]/20 grid sm:grid-cols-3 gap-4 text-sm">
          <a href="/my-calendar" className="rounded-2xl border border-[#D4AF37]/30 p-5 hover:bg-white dark:hover:bg-[#0A0C12] transition-all">
            📅 Personal Vedic Calendar
          </a>
          <a href="/kundali-milan" className="rounded-2xl border border-[#D4AF37]/30 p-5 hover:bg-white dark:hover:bg-[#0A0C12] transition-all">
            ❤️ Kundali Milan (2 profiles)
          </a>
          <a href="/ask" className="rounded-2xl border border-[#D4AF37]/30 p-5 hover:bg-white dark:hover:bg-[#0A0C12] transition-all">
            💬 Ask ₹199 Question (auto-fill)
          </a>
        </div>
      </div>
    </main>
  );
}
