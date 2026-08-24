'use client';

import React from 'react';
import Link from 'next/link';

export default function PanditJiDemo() {
  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline px-6 py-1.5 rounded-full border border-[#8E6F1D]/30 text-xs tracking-[3px]">DEMO FOR PANDIT JI</div>
          <h1 className="font-editorial text-6xl font-bold tracking-tight mt-6">CosmicTantra — A Tool for the Scholar</h1>
          <p className="mt-4 text-xl text-[#57524A]">Built with reverence for the unbroken tradition of Kashi.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/dashboard" className="block p-8 rounded-3xl border border-[#8E6F1D]/20 bg-white hover:border-[#8E6F1D]/40 transition-all">
            <div className="font-semibold text-xl">Scholar’s Desk</div>
            <p className="mt-2 text-sm text-[#57524A]">See how seekers manage their Cosmic Identity and daily guidance.</p>
          </Link>
          
          <Link href="/report" className="block p-8 rounded-3xl border border-[#8E6F1D]/20 bg-white hover:border-[#8E6F1D]/40 transition-all">
            <div className="font-semibold text-xl">Written Folio Example</div>
            <p className="mt-2 text-sm text-[#57524A]">View a real scholarly consultation document with Upaya recommendations.</p>
          </Link>
          
          <Link href="/pandit/workspace" className="block p-8 rounded-3xl border border-[#8E6F1D]/20 bg-white hover:border-[#8E6F1D]/40 transition-all">
            <div className="font-semibold text-xl">Pandit Workspace</div>
            <p className="mt-2 text-sm text-[#57524A]">Experience how you would receive and respond to consultations.</p>
          </Link>
          
          <Link href="/upaya" className="block p-8 rounded-3xl border border-[#8E6F1D]/20 bg-white hover:border-[#8E6F1D]/40 transition-all">
            <div className="font-semibold text-xl">Verified Upaya Partners</div>
            <p className="mt-2 text-sm text-[#57524A]">See how genuine remedies are presented to seekers.</p>
          </Link>
        </div>

        <div className="text-center mt-16 text-sm text-[#857E74]">
          This platform was designed to serve the scholar — not replace them.
        </div>
      </div>
    </main>
  );
}
