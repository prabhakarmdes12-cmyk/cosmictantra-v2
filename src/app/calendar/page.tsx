import type { Metadata } from 'next';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import UnifiedPanchangCalendarClient from '@/components/calendar/UnifiedPanchangCalendarClient';

export const metadata: Metadata = {
  title: 'Monthly Vedic Panchang & Personal Energy Calendar | CosmicTantra',
  description: 'Full-month Vedic Panchang calendar with daily Tithi, Nakshatra, Yoga, Karana, Shubh Muhurats, Rahu Kaal, Vrats & Festivals, and personal Power & Caution days based on Tara Bala and Chandra Bala.',
  alternates: { canonical: '/calendar' },
};

export default function CalendarPage() {
  return (
    <CosmicTantraShell
      shellMode="public"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Panchang & Calendar', href: '/calendar' },
      ]}
    >
      <div className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <UnifiedPanchangCalendarClient defaultView="month" />
      </div>
    </CosmicTantraShell>
  );
}
