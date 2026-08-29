'use client';

import React, { useMemo, useState } from 'react';
import {
  PROFESSIONAL_CAPABILITIES, computeRegistryStats, listFamilies, auditQualificationIntegrity,
} from '@/lib/pro/capabilityRegistry';
import { DIFFERENTIAL_QUEUE, queueStats } from '@/lib/pro/differentialQueue';

const STATUS_COLOR = {
  NOT_IMPLEMENTED: 'bg-neutral-400/20 text-neutral-500',
  IMPLEMENTED: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  INTERNALLY_VERIFIED: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  EXTERNALLY_COMPARED: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  PANDIT_REVIEWED: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  QUALIFIED: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  CONVENTION_DIFFERENCE: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

function Bar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 1000) / 10 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="font-mono-data tabular-nums">{value}/{total} · {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CapabilityDashboard() {
  const stats = useMemo(() => computeRegistryStats(), []);
  const families = useMemo(() => listFamilies(), []);
  const violations = useMemo(() => auditQualificationIntegrity(), []);
  const qStats = useMemo(() => queueStats(), []);
  const [familyFilter, setFamilyFilter] = useState('All');

  const rows = useMemo(() => (
    familyFilter === 'All' ? PROFESSIONAL_CAPABILITIES : PROFESSIONAL_CAPABILITIES.filter((c) => c.family === familyFilter)
  ), [familyFilter]);

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[10px] font-mono-data uppercase tracking-[0.24em] font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
          /dev/jyotish-capabilities · internal
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold mt-2">Professional Jyotish Capability Registry</h1>
        <p className="text-sm text-[#57524A] dark:text-[#AAA49A] mt-2 max-w-3xl">
          The machine-readable answer to “What can CosmicTantra calculate today?” All percentages are computed
          from the registry — never hardcoded. Build state (IMPLEMENTED) and qualification state are tracked
          separately; a capability is never QUALIFIED without external comparison and evidence.
        </p>
      </header>

      {/* integrity banner */}
      <div className={`rounded-xl border p-4 text-sm ${violations.length ? 'border-rose-500/40 bg-rose-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
        <strong>{violations.length ? `${violations.length} truth-invariant violation(s)` : 'Truth invariant holds'}</strong>
        {' — '}
        {violations.length
          ? violations.map((v) => `${v.id}: ${v.reason}`).join('; ')
          : 'No capability is labelled QUALIFIED without evidence; no unsupported PARITY_WITH_* labels present.'}
      </div>

      {/* overall progress */}
      <section className="grid sm:grid-cols-2 gap-x-8 gap-y-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] p-5 bg-white dark:bg-[#0b0d12]">
        <Bar label="Implemented" value={stats.implemented} total={stats.total} color="bg-amber-500" />
        <Bar label="Internally verified (or higher)" value={stats.internallyVerifiedOrHigher} total={stats.total} color="bg-blue-500" />
        <Bar label="Externally compared (or higher)" value={stats.externallyComparedOrHigher} total={stats.total} color="bg-indigo-500" />
        <Bar label="Pandit reviewed" value={stats.panditReviewed} total={stats.total} color="bg-purple-500" />
        <Bar label="Qualified" value={stats.qualified} total={stats.total} color="bg-emerald-500" />
        <Bar label="Missing (not implemented)" value={stats.missing} total={stats.total} color="bg-neutral-400" />
      </section>

      {/* differential queue summary */}
      <section className="rounded-2xl border border-black/[0.08] dark:border-white/[0.1] p-5 bg-white dark:bg-[#0b0d12]">
        <h2 className="font-editorial text-lg font-bold">OFFLINE_SOFTWARE_DIFFERENTIAL_QUEUE</h2>
        <p className="text-xs text-[#57524A] dark:text-[#AAA49A] mt-1">
          {qStats.total} representative outputs queued for comparison against established software.
          {' '}<strong>{qStats.pending} pending</strong>, {qStats.compared} compared.
          A difference is not automatically a bug.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left border-b border-black/10 dark:border-white/10">
                <th className="py-1.5 pr-3">Metric</th><th className="pr-3">Capability</th><th className="pr-3">Targets</th><th className="pr-3">Status</th><th>Class</th>
              </tr>
            </thead>
            <tbody>
              {DIFFERENTIAL_QUEUE.map((q) => (
                <tr key={q.id} className="border-b border-black/[0.04] dark:border-white/[0.04]">
                  <td className="py-1.5 pr-3">{q.metric}</td>
                  <td className="pr-3 font-mono-data">{q.capabilityId}</td>
                  <td className="pr-3">{q.targets.join(', ')}</td>
                  <td className="pr-3">{q.status}</td>
                  <td>{q.classification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* by-family + filter */}
      <section className="rounded-2xl border border-black/[0.08] dark:border-white/[0.1] p-5 bg-white dark:bg-[#0b0d12]">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium">Filter:</span>
          {['All', ...families].map((f) => (
            <button
              key={f}
              onClick={() => setFamilyFilter(f)}
              className={`px-2.5 py-1 rounded-full text-xs border ${familyFilter === f ? 'bg-[#8E6F1D] text-white border-transparent' : 'border-black/15 dark:border-white/15'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left border-b border-black/10 dark:border-white/10">
                <th className="py-2 pr-3">Capability</th>
                <th className="pr-3">Family</th>
                <th className="pr-3">Tradition</th>
                <th className="pr-3">Convention</th>
                <th className="pr-3">Impl</th>
                <th className="pr-3">Qualification</th>
                <th className="pr-3">Views</th>
                <th>Known differences</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-black/[0.04] dark:border-white/[0.04] align-top">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="font-mono-data text-[10px] opacity-60">{c.id} · v{c.algorithmVersion}</div>
                  </td>
                  <td className="pr-3">{c.family}</td>
                  <td className="pr-3">{c.tradition}</td>
                  <td className="pr-3 font-mono-data text-[10px]">{c.convention}</td>
                  <td className="pr-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_COLOR[c.implementationStatus] || ''}`}>{c.implementationStatus}</span>
                  </td>
                  <td className="pr-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_COLOR[c.qualificationStatus] || ''}`}>{c.qualificationStatus}</span>
                    {c.evidenceIds?.length ? <div className="text-[9px] opacity-50 mt-0.5">{c.evidenceIds.join(', ')}</div> : null}
                  </td>
                  <td className="pr-3 text-[10px]">{[c.availableInSimpleView && 'Simple', c.availableInPanditView && 'Pandit'].filter(Boolean).join(' + ')}</td>
                  <td className="text-[10px] opacity-70 max-w-[200px]">{c.knownDifferences?.join(' ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* by-family rollup */}
      <section className="rounded-2xl border border-black/[0.08] dark:border-white/[0.1] p-5 bg-white dark:bg-[#0b0d12]">
        <h2 className="font-editorial text-lg font-bold mb-3">By family</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.byFamily.map((f) => (
            <div key={f.family} className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-3">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-sm">{f.family}</span>
                <span className="font-mono-data text-xs">{f.implemented}/{f.total}</span>
              </div>
              <div className="text-[10px] opacity-60 mt-1">
                verified {f.internallyVerified} · compared {f.externallyCompared} · qualified {f.qualified}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
