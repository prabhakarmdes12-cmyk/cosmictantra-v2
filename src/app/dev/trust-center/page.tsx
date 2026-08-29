import type { Metadata } from 'next';
import { buildTrustCenter } from '@/lib/pro/trustCenter';

export const metadata: Metadata = {
  title: 'Trust Center — CosmicTantra',
  robots: { index: false, follow: false },
};

function Stat({ label, value, ok }: { label: string; value: any; ok?: boolean }) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
      <div className="text-[10px] uppercase tracking-wider opacity-50">{label}</div>
      <div className={`text-lg font-bold ${ok === true ? 'text-emerald-600 dark:text-emerald-300' : ok === false ? 'text-[#D4870A]' : ''}`}>{String(value)}</div>
    </div>
  );
}

export default function TrustCenterPage() {
  const tc = buildTrustCenter();
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] py-6 px-3 sm:px-5">
      <div className="max-w-4xl mx-auto space-y-5">
        <header>
          <div className="text-[10px] font-mono-data uppercase tracking-[0.24em] font-bold text-[#8E6F1D] dark:text-[#D4AF37]">Diagnostics</div>
          <h1 className="font-editorial text-3xl font-bold mt-1">Trust Center</h1>
          <p className="text-sm opacity-70 mt-1">Engine health, qualification honesty, invariants and consistency. Generated {tc.generatedAt}.</p>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Engine healthy" value={tc.engine.healthy ? 'YES' : 'NO'} ok={tc.engine.healthy} />
          <Stat label="Integrity violations" value={tc.qualification.integrityViolations} ok={tc.qualification.integrityViolations === 0} />
          <Stat label="Cross-surface contradictions" value={tc.invariants.contradictionsAcrossAnchors} ok={tc.invariants.contradictionsAcrossAnchors === 0} />
          <Stat label="Report consistency" value={tc.reportConsistency.ok ? 'OK' : 'FAIL'} ok={tc.reportConsistency.ok} />
        </section>

        <section>
          <h2 className="font-semibold mb-2">Engine self-check (golden anchors)</h2>
          <table className="w-full text-xs border border-black/10 dark:border-white/10 rounded overflow-hidden">
            <thead className="bg-black/[0.03] dark:bg-white/[0.05]"><tr><th className="text-left p-2">Anchor</th><th className="text-left p-2">Lagna</th><th className="text-left p-2">Moon</th><th className="text-left p-2">Contradictions</th></tr></thead>
            <tbody>
              {tc.engine.checks.map((c: any) => (
                <tr key={c.label} className="border-t border-black/[0.06] dark:border-white/[0.08]">
                  <td className="p-2">{c.label}</td>
                  <td className={`p-2 ${c.lagnaOk ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-500'}`}>{c.lagna}</td>
                  <td className={`p-2 ${c.moonOk ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-500'}`}>{c.moon}</td>
                  <td className="p-2">{c.contradictions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-lg border border-[#D4870A]/40 bg-[#D4870A]/[0.06] p-4">
          <h2 className="font-semibold mb-1">External qualification — honest status</h2>
          <p className="text-sm">{tc.qualification.externalQualification.status}</p>
          <p className="text-xs opacity-70 mt-1">
            Corpus {tc.qualification.externalQualification.corpusCurrent}/{tc.qualification.externalQualification.corpusTarget} subjects ·
            {tc.qualification.externalQualification.slotsWithExternalReference} with external reference values.
            Capabilities are IMPLEMENTED and internally verified, not externally certified until reference values are recorded.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Versions</h2>
          <pre className="text-[11px] bg-black/[0.03] dark:bg-white/[0.05] rounded p-3 overflow-x-auto">{JSON.stringify(tc.versions, null, 2)}</pre>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Regression suite</h2>
          <p className="text-xs opacity-70">{tc.regressionSuite.cases} — {tc.regressionSuite.note}</p>
        </section>
      </div>
    </main>
  );
}
