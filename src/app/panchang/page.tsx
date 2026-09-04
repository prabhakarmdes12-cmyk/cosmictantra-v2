import React from 'react';
import type { Metadata } from 'next';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import UnifiedPanchangCalendarClient from '@/components/calendar/UnifiedPanchangCalendarClient';

export const metadata: Metadata = {
  title: 'Vedic Panchang & Chronometry Matrix | CosmicTantra',
  description: 'Daily and monthly Vedic Panchang with Tithi, Nakshatra, Yoga, Karana, Shubh Muhurats, and Rahu Kaal computed with Lahiri Ayanamsha astronomical precision.',
  alternates: { canonical: '/panchang' },
};

export default function UniversalPanchangPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const isMonth = searchParams?.view === 'month';
  const defaultView = isMonth ? 'month' : 'today';

  return (
    <CosmicTantraShell
      shellMode="public"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Panchang & Calendar', href: isMonth ? '/panchang?view=month' : '/panchang' },
      ]}
    >
      <div className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <UnifiedPanchangCalendarClient defaultView={defaultView} />
      </div>
    </CosmicTantraShell>
  );
}
