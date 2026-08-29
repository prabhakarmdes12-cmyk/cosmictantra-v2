import type { Metadata } from 'next';
import AuraMonthlyCalendar from '@/components/calendar/AuraMonthlyCalendar';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { Calendar as CalendarIcon, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Monthly Vedic Panchang & Personal Energy Calendar | CosmicTantra',
  description: 'Full-month Vedic Panchang calendar with daily Tithi, Nakshatra, Yoga, Karana, Shubh Muhurats, Rahu Kaal, Vrats & Festivals, and personal Power & Caution days based on Tara Bala and Chandra Bala.',
  alternates: { canonical: '/calendar' },
};

export default function CalendarPage() {
  return (
    <CosmicTantraShell>
      <div className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] text-xs font-mono-data font-bold uppercase tracking-[2px]">
            <Sparkles className="w-3.5 h-3.5" />
            मासिक वैदिक पंचांग • AURA VEDIC MONTHLY CALENDAR
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-tight">
            Monthly Vedic Calendar & Personal Energy Matrix
          </h1>
          <p className="text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF] leading-relaxed">
            High-precision astronomical Panchang computed for your coordinates with personal <strong>Power Days (🌟 Gold)</strong>, <strong>Caution Days (⚠️ Crimson)</strong>, Shubh Muhurats, and major Sanatan Vrats.
          </p>
        </div>

        {/* Aura Monthly Calendar Component */}
        <AuraMonthlyCalendar />
      </div>
    </CosmicTantraShell>
  );
}
