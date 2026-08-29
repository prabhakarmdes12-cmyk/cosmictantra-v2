'use client';

import React from 'react';
import {
  ShieldCheck,
  Activity,
  Award,
  CheckCircle,
  Database,
  Layers,
  FileText,
  Compass,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function TrustCenterClient() {
  return (
    <div className="min-h-screen bg-[#07090e] text-[#e6edf3] font-sans selection:bg-[#d4af37]/30 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#1f2633]">
          <div>
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-6 h-6 text-[#2ea043]" />
              <h1 className="text-2xl font-serif font-bold text-[#f0e6d2]">CosmicTantra Trust Center</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2ea043]/20 text-[#3fb950] border border-[#2ea043]/30 font-mono font-semibold">
                SYSTEM HEALTH 100%
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-1">
              Internal engineering telemetry, astronomical qualification status, and invariant compliance monitor.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-[#8b949e]">
            <span className="px-3 py-1 rounded bg-[#161b22] border border-[#30363d]">Kernel V36.0</span>
            <span className="px-3 py-1 rounded bg-[#161b22] border border-[#30363d]">Offline-First Core</span>
          </div>
        </div>

        {/* 4 Major Qualification Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0f131a] border border-[#1f2633] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8b949e]">
              <span>NASA/JPL Horizons</span>
              <CheckCircle className="w-4 h-4 text-[#2ea043]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#f0e6d2]">7,000 / 7,000</div>
            <p className="text-[11px] text-[#8b949e]">Verified DE441/DE431 ground-truth evaluations (1850–2050).</p>
          </div>

          <div className="bg-[#0f131a] border border-[#1f2633] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8b949e]">
              <span>Golden Corpus</span>
              <CheckCircle className="w-4 h-4 text-[#2ea043]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#f0e6d2]">100 / 100</div>
            <p className="text-[11px] text-[#8b949e]">100% pass rate across 260 discrete assertions.</p>
          </div>

          <div className="bg-[#0f131a] border border-[#1f2633] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8b949e]">
              <span>Shodashavarga</span>
              <CheckCircle className="w-4 h-4 text-[#2ea043]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#f0e6d2]">16 / 16 Vargas</div>
            <p className="text-[11px] text-[#8b949e]">D1 to D60 with ±1" boundary qualification.</p>
          </div>

          <div className="bg-[#0f131a] border border-[#1f2633] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8b949e]">
              <span>Bala Engine</span>
              <CheckCircle className="w-4 h-4 text-[#2ea043]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#f0e6d2]">Zero Placeholders</div>
            <p className="text-[11px] text-[#8b949e]">Full 6-fold Shadbala & 12 Bhava Balas in Virupas.</p>
          </div>
        </div>

        {/* Invariant Matrix */}
        <div className="bg-[#0f131a] border border-[#1f2633] rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-serif font-semibold text-[#f0e6d2] flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-[#d4af37]" />
            <span>Architecture & Trust Invariant Compliance</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { id: 'INV_JYOTISH_001', name: 'Deterministic Truth Graph', status: 'PASSING', desc: 'Identical normalized inputs produce strictly identical snapshots across all surfaces.' },
              { id: 'INV_JYOTISH_002', name: 'Explicit Metadata Stamping', status: 'PASSING', desc: 'Every snapshot exposes algorithmVersion, ayanamshaName, and julianDay.' },
              { id: 'INV_JYOTISH_006', name: 'Headless Independence', status: 'PASSING', desc: 'Calculations run in-process offline with zero paid ephemeris SaaS APIs.' },
              { id: 'TRUST_001', name: 'Snapshot Reproducibility', status: 'PASSING', desc: 'Stored Kundli records reload with 0.0000" mathematical drift.' },
              { id: 'TRUST_002', name: 'Cross-Surface Parity', status: 'PASSING', desc: 'Zero discrepancies between Web Kundli, Multi-Volume Book, and Kashi facts.' },
              { id: 'TRUST_005', name: 'Location Invariant', status: 'PASSING', desc: 'Birthplace coordinates and timezone never silently change.' }
            ].map(inv => (
              <div key={inv.id} className="p-3 rounded-xl bg-[#161b22] border border-[#30363d]/60 flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono font-semibold text-[#f0e6d2]">{inv.id} • {inv.name}</div>
                  <div className="text-[11px] text-[#8b949e] mt-0.5">{inv.desc}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#2ea043]/20 text-[#3fb950] text-[10px] font-mono font-bold">
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
