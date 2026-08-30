'use client';

import React, { Suspense } from 'react';
import MasterKundliReportClient from './MasterKundliReportClient';

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-center font-serif text-[#8E6F1D]">
        <div className="animate-pulse text-lg">Loading Vedic Master Kundli...</div>
      </div>
    }>
      <MasterKundliReportClient />
    </Suspense>
  );
}

