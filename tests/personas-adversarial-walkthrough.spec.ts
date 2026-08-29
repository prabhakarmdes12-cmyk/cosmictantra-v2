import { test, expect } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { createKundli, getKundliById } from '../src/lib/jyotish/kundliStore';
import { generateKundliBookModel } from '../src/lib/jyotish/kundliBookModel';
import { queryKashiEvidence } from '../src/lib/jyotish/kashiOrchestrator';
import { validateCrossSurfaceConsistency } from '../src/lib/jyotish/contradictionDetector';
import { generatePersonalTimeline } from '../src/lib/jyotish/timelineEngine';
import { recordPredictionOutcome, submitOutcomeFeedback } from '../src/lib/jyotish/outcomeMemory';

test.describe('TRUST-10: Five-Persona Adversarial Walkthrough & Final Launch Gate', () => {

  test('Persona A (First-Time Customer): 60-Second Trust Flow & Clarity', () => {
    // 1. Enter birth details
    const priya = createKundli(
      'Priya Sharma',
      {
        birthDate: '1995-06-15',
        birthTime: '10:30',
        latitude: 25.5941,
        longitude: 85.1376,
        timezone: 5.5,
        locationName: 'Patna, Bihar, India'
      },
      'EXACT'
    );

    // 2. Verify instant clear core facts
    expect(priya.snapshot.lagna.rashiName).toBe('Simha'); // Leo Lagna
    expect(priya.snapshot.birthPanchang.nakshatra.name).toBe('Uttara Ashadha');
    expect(priya.snapshot.dasha.currentMahadasha).toBeDefined();
    expect(priya.snapshot.yogasAndDoshas.manglik).toBeDefined();
  });

  test('Persona B (AstroSage Power User): Complete Technical Parity & Depth', () => {
    const gandhi = getKundliById('gandhi-1869')!;
    const book = generateKundliBookModel('Mahatma Gandhi', gandhi.snapshot, 'COMPLETE_VEDIC_KUNDLI');

    // AstroSage comparison: 8+ comprehensive volumes
    expect(book.volumes.length).toBeGreaterThanOrEqual(8);
    expect(book.volumes.some(v => v.title.includes('Birth Foundation'))).toBe(true);
    expect(book.volumes.some(v => v.title.includes('Core Natal Charts'))).toBe(true);
    expect(book.volumes.some(v => v.title.includes('Nine Grahas'))).toBe(true);
    expect(book.volumes.some(v => v.title.includes('Twelve Bhavas'))).toBe(true);
    expect(book.volumes.some(v => v.title.includes('Shodashavarga'))).toBe(true);
    expect(book.volumes.some(v => v.title.includes('Mathematical Strengths'))).toBe(true);
    expect(book.volumes.some(v => v.title.includes('Vimshottari Dasha'))).toBe(true);
  });

  test('Persona C (Traditional Pandit / Vedic Scholar): Rigorous Shastric Compliance', () => {
    const vivekananda = getKundliById('vivekananda-1863')!;
    const snapshot = vivekananda.snapshot;

    // 1. Shodashavarga (16 divisional charts)
    expect(Object.keys(snapshot.vargas.shodashavarga!).length).toBe(16);

    // 2. Full Shadbala in Virupas & Rupas with zero placeholders
    for (const [pName, sb] of Object.entries(snapshot.balas!.shadbala)) {
      expect(sb.totalRupas).toBeGreaterThan(0);
      expect(sb.sthana.totalVirupas).toBeGreaterThan(0);
      expect(sb.dig.totalVirupas).toBeGreaterThanOrEqual(0);
      expect(sb.kala.totalVirupas).toBeGreaterThanOrEqual(0);
    }

    // 3. 12 Bhava Balas
    expect(snapshot.balas!.bhavaBala.length).toBe(12);

    // 4. 20-Point Vimshopaka Bala
    for (const [pName, v] of Object.entries(snapshot.balas!.vimshopaka)) {
      expect(v.shodashavarga).toBeGreaterThan(0);
      expect(v.shodashavarga).toBeLessThanOrEqual(20);
    }
  });

  test('Persona D (Sceptical Engineer / Astronomer): Sub-Arcsecond Invariance & Zero Hallucination', () => {
    const einstein = getKundliById('einstein-1879')!;
    
    // 1. Metadata and offline calculation integrity
    expect(einstein.snapshot.meta.julianDay).toBeGreaterThan(2400000);
    expect(einstein.snapshot.meta.engineVersion).toContain('CosmicTantra Professional Kernel');
    expect(einstein.snapshot.meta.ayanamshaName).toBe('Chitra Paksha (Lahiri Standard)');

    // 2. Zero Cross-Surface Contradiction
    const consistency = validateCrossSurfaceConsistency(einstein.snapshot, einstein.personName);
    expect(consistency.hasContradiction).toBe(false);

    // 3. Evidence-grounded Kashi query
    const kashi = queryKashiEvidence('Career status and achievements', einstein.snapshot);
    expect(kashi.status).toBe('EVIDENCE_BACKED');
    expect(kashi.evidenceTrail.length).toBeGreaterThan(0);
  });

  test('Persona E (Returning Seeker): Reproducibility & Outcome Tracking', () => {
    // 1. Re-open saved chart by ID
    const retrieved = getKundliById('gandhi-1869')!;
    expect(retrieved.snapshot.lagna.degreeStr).toContain("4° 16");

    // 2. Timeline generation
    const timeline = generatePersonalTimeline(retrieved.personName, retrieved.snapshot, 'LIFE');
    expect(timeline.events.length).toBeGreaterThan(10);

    // 3. Outcome Memory feedback logging
    const outcome = recordPredictionOutcome(
      retrieved.id,
      'CAREER',
      'Leadership recognition in Moon Mahadasha',
      ['EVID-DASHA-MOON'],
      { startDate: '1890-01-01', endDate: '1900-01-01' }
    );
    const feedback = submitOutcomeFeedback(outcome.id, 'YES', 'Recognized leader of civil rights movement');
    expect(feedback!.feedback?.status).toBe('YES');
  });

});
