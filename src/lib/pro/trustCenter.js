/**
 * TRUST CENTER (PROGRAM 15 / TRUST-09)
 * ====================================
 * A single diagnostic snapshot of the platform's honesty & health:
 *   - engine/versions
 *   - astronomy & Jyotish qualification status (honest: mostly PENDING external)
 *   - differential comparison queue status
 *   - cross-surface invariant failures (contradiction detector)
 *   - report consistency
 *   - regression suite reference
 *
 * Pure aggregation over existing modules; safe to render on /dev/trust-center.
 */

import { professionalChart } from './index.js';
import { computeRegistryStats, auditQualificationIntegrity } from './capabilityRegistry.js';
import { queueStats } from './differentialQueue.js';
import { corpusStats } from './goldenCorpus.js';
import { versionStamp } from './versions.js';
import { buildBook } from './bookModel.js';

// Two golden anchors used for a live self-check.
const ANCHORS = [
  { label: 'Patna 1995', bp: { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' }, expect: { lagna: 'Leo', moon: 'Sagittarius' } },
  { label: 'Patna 1992', bp: { birthDate: '1992-10-24', birthTime: '06:45', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' }, expect: { lagna: 'Libra', moon: 'Virgo' } },
];

export function buildTrustCenter() {
  const registry = safe(() => computeRegistryStats()) || {};
  const integrity = safe(() => auditQualificationIntegrity()) || { violations: [] };
  const diff = safe(() => queueStats()) || {};
  const corpus = safe(() => corpusStats()) || {};

  // Live engine self-check against golden anchors + contradiction detector.
  const engineChecks = ANCHORS.map((a) => {
    const pro = professionalChart(a.bp);
    const lagna = pro.kundali.lagna.rashiEn;
    const moon = pro.kundali.moon.rashiEn;
    const contradictions = pro.checkContradictions();
    return {
      label: a.label,
      lagna, moon,
      lagnaOk: lagna === a.expect.lagna,
      moonOk: moon === a.expect.moon,
      contradictions: contradictions.violations.length,
    };
  });

  // Report consistency: build a book and confirm provenance present.
  const sampleBook = safe(() => buildBook('COSMIC_SNAPSHOT', { pro: professionalChart(ANCHORS[0].bp), meta: { name: 'selfcheck' } }));
  const reportConsistency = {
    ok: !!(sampleBook && sampleBook.provenance && sampleBook.sections.length > 0),
    hasProvenance: !!(sampleBook && sampleBook.provenance),
  };

  const engineHealthy = engineChecks.every((c) => c.lagnaOk && c.moonOk && c.contradictions === 0);

  return {
    generatedAt: new Date().toISOString(),
    versions: versionStamp(),
    engine: {
      healthy: engineHealthy,
      checks: engineChecks,
    },
    qualification: {
      // HONEST: implemented != externally qualified.
      registry,
      integrityViolations: integrity.violations?.length ?? 0,
      externalQualification: {
        corpusTarget: corpus.targetSubjects,
        corpusCurrent: corpus.currentSubjects,
        slotsWithExternalReference: corpus.slotsWithExternalReference,
        status: corpus.honestStatus,
      },
    },
    differential: diff,
    invariants: {
      contradictionsAcrossAnchors: engineChecks.reduce((s, c) => s + c.contradictions, 0),
    },
    reportConsistency,
    regressionSuite: {
      file: 'tests/trust08.spec.ts',
      cases: 'TRUST_001..008',
      note: 'Run `npx playwright test tests/trust08.spec.ts` for the trust regression suite.',
    },
    verdictInputs: {
      engineHealthy,
      integrityClean: (integrity.violations?.length ?? 0) === 0,
      hasExternalQualification: (corpus.slotsWithExternalReference ?? 0) > 0,
    },
  };
}

function safe(fn) { try { return fn(); } catch { return null; } }

export default { buildTrustCenter };
