import type { Metadata } from 'next';
import CapabilityDashboard from '@/components/pro/CapabilityDashboard';

export const metadata: Metadata = {
  title: 'Jyotish Capability Dashboard — CosmicTantra',
  description: 'Internal capability & qualification matrix computed from the Professional Jyotish Capability Registry.',
  robots: { index: false, follow: false },
};

export default function JyotishCapabilitiesPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <CapabilityDashboard />
      </div>
    </main>
  );
}
