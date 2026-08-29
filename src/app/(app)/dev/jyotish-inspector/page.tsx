import React from 'react';
import JyotishInspectorClient from './JyotishInspectorClient';

export const metadata = {
  title: 'Jyotish Calculation Inspector & Pandit Qualification Console | CosmicTantra Dev',
  description: 'Deterministic raw astronomical verification and Pandit feedback interface (Zero LLM)'
};

export default function JyotishInspectorPage() {
  return (
    <div className="min-h-screen bg-[#05030A] text-white p-4 sm:p-8 font-body">
      <JyotishInspectorClient />
    </div>
  );
}
