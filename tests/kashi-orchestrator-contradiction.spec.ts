import { test, expect } from '@playwright/test';
import { queryKashiEvidence } from '../src/lib/jyotish/kashiOrchestrator';
import { validateCrossSurfaceConsistency } from '../src/lib/jyotish/contradictionDetector';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';

test.describe('TRUST-05: Kashi Jyotish Orchestrator & Cross-Surface Contradiction Invariants', () => {

  const testSnapshot = getCanonicalJyotishSnapshot({
    birthDate: '1869-10-02',
    birthTime: '07:11',
    latitude: 21.6417,
    longitude: 69.6293,
    timezone: 4.6419,
    locationName: 'Porbandar, Gujarat, India'
  });

  test('1. Kashi Evidence Retrieval & Strict 4-Tier Separation', () => {
    const kashi = queryKashiEvidence('Career mein agla bada badlav kab hoga?', testSnapshot);

    expect(kashi).toBeDefined();
    expect(kashi.domain).toBe('CAREER');
    expect(kashi.status).toBe('EVIDENCE_BACKED');

    // 1. Calculated facts must contain deterministic references
    expect(kashi.calculatedFacts.length).toBeGreaterThan(0);
    expect(kashi.calculatedFacts.some(f => f.includes('Tula') || f.includes('Libra'))).toBe(true);

    // 2. Traditional interpretations must cite classical sources
    expect(kashi.traditionalInterpretations.length).toBeGreaterThan(0);

    // 3. Uncertainty notes must be present
    expect(kashi.uncertaintyNotes.length).toBeGreaterThan(0);

    // 4. Evidence trail must contain valid evidence items
    expect(kashi.evidenceTrail.length).toBeGreaterThan(0);
    const dashaEvid = kashi.evidenceTrail.find(e => e.category === 'DASHA');
    expect(dashaEvid).toBeDefined();
    expect(dashaEvid!.confidenceWeight).toBeGreaterThan(0.8);
  });

  test('2. Invariant Program 16: Zero Cross-Surface Contradictions', () => {
    const validation = validateCrossSurfaceConsistency(testSnapshot, 'Mahatma Gandhi');

    expect(validation.hasContradiction).toBe(false);
    expect(validation.discrepancies.length).toBe(0);
    expect(validation.checkedSurfaces).toContain('CanonicalSnapshot');
    expect(validation.checkedSurfaces).toContain('KundliBookModel');
    expect(validation.checkedSurfaces).toContain('KashiOrchestrator');
  });
});
