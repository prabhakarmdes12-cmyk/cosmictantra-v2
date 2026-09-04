'use client';

import React from 'react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import UnifiedPanchangCalendarClient from '@/components/calendar/UnifiedPanchangCalendarClient';

export default function UniversalPanchangPage() {
  return (
    <CosmicTantraShell
      shellMode="public"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Panchang & Calendar', href: '/panchang' },
      ]}
    >
      <div className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <UnifiedPanchangCalendarClient defaultView="today" />
      </div>
    </CosmicTantraShell>
  );
}
