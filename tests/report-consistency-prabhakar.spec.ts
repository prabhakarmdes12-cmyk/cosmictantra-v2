import { test, expect } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { createKundli, getKundliById } from '../src/lib/jyotish/kundliStore';
import { generateKundliBookModel } from '../src/lib/jyotish/kundliBookModel';
import { queryKashiEvidence } from '../src/lib/jyotish/kashiOrchestrator';
import { validateCrossSurfaceConsistency } from '../src/lib/jyotish/contradictionDetector';
import { generatePersonalTimeline } from '../src/lib/jyotish/timelineEngine';

test.describe('GATE 3: Multi-Surface Zero-Contradiction Verification for Prabhakar (1989)', () => {

  const birthInput = {
    birthDate: '1989-05-26',
    birthTime: '02:20:30',
    latitude: 22.0797,
    longitude: 82.1391,
    timezone: 5.5,
    locationName: 'Bilaspur, Chhattisgarh, India'
  };

  const record = createKundli('Prabhakar', birthInput, 'EXACT', 'MALE');
  const snapshot = record.snapshot;

  test('1. Core Astronomical Consistency Across Web, Book, and Inspector', () => {
    // Generate Kundli Book
    const book = generateKundliBookModel('Prabhakar', snapshot, 'COMPLETE_VEDIC_KUNDLI');

    // 1. Lagna Match
    expect(snapshot.lagna.rashiName).toBe('Meena');
    expect(book.volumes[1].sections[0].data.lagna.rashiName).toBe('Meena');

    // 2. Moon Rashi & Nakshatra Match
    const moon = (snapshot.planets as any[]).find(p => p.name === 'Moon');
    expect(moon.rashiName).toBe('Makara');
    expect(snapshot.birthPanchang.nakshatra.name).toBe('Shravana');
    expect(snapshot.birthPanchang.nakshatra.pada).toBe(1);
    expect(book.volumes[0].sections[1].data.nakshatra.name).toBe('Shravana');

    // 3. Tithi Match
    expect(snapshot.birthPanchang.udayaTithi.name).toBe('Shashthi');
    expect(book.volumes[0].sections[1].data.tithi.name).toBe('Shashthi');

    // 4. Dasha Match
    expect(snapshot.dasha.currentMahadasha).toBe('Jupiter');
    expect(snapshot.dasha.currentAntardasha).toBe('Saturn');
    expect(book.volumes[6].sections[0].data.currentMD).toBe('Jupiter');
  });

  test('2. Kashi Evidence & Timeline Concurrence', () => {
    const kashi = queryKashiEvidence('Career and business prospects in 2026', snapshot);
    expect(kashi.status).toBe('EVIDENCE_BACKED');
    expect(kashi.calculatedFacts.some(f => f.includes('Jupiter') || f.includes('Saturn'))).toBe(true);

    const timeline = generatePersonalTimeline('Prabhakar', snapshot, 'LIFE');
    const juMD = timeline.events.find(e => e.id.includes('DASHA_MD_Jupiter'));
    expect(juMD).toBeDefined();
    // 2023-02-02 -> 2023-02-01 with the Sprint C ayanamsha reconciliation (~0.65 day balance shift).
    expect(juMD!.startDate).toBe('2023-02-01');
  });

  test('3. Invariant: Absolute Zero Discrepancies Across Surfaces', () => {
    const validation = validateCrossSurfaceConsistency(snapshot, 'Prabhakar');
    expect(validation.hasContradiction).toBe(false);
    expect(validation.discrepancies.length).toBe(0);
  });

});
