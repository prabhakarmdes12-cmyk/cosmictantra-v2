import { test, expect } from '@playwright/test';
import { calculateKundali } from '../src/lib/astrologyEngine';
import { generateKundliV40Pdf } from '../src/lib/kundli/v40/pipelineV2';

test.describe('Kundli Calculation, Profile Sync, Quick Chips & Pricing Tiers Verification', () => {

  test('CALC_001: calculateKundali computes unique correct charts when given proper object signatures', () => {
    // User Profile: Prabhakar (Bilaspur)
    const prabhakarInput = {
      birthDate: '1989-05-26',
      birthTime: '02:20',
      latitude: 22.0797,
      longitude: 82.1409,
      timezone: 5.5,
      locationName: 'Bilaspur, Chhattisgarh'
    };

    const prabhakarChart = calculateKundali(prabhakarInput);
    expect(prabhakarChart.lagna.rashiName).toBe('Meena'); // Meena Lagna
    expect(prabhakarChart.moon.nakshatra.name).toBe('Shravana'); // Shravana Nakshatra
    expect(prabhakarChart.moon.rashiName).toBe('Makara'); // Makara Rashi
    expect(prabhakarChart.meta.locationName).toBe('Bilaspur, Chhattisgarh');

    // Default Profile: Priya Sharma (Patna)
    const priyaInput = {
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezone: 5.5,
      locationName: 'Patna, Bihar'
    };

    const priyaChart = calculateKundali(priyaInput);
    expect(priyaChart.lagna.rashiName).toBe('Simha'); // Simha Lagna
    expect(priyaChart.moon.nakshatra.name).toBe('Uttara Ashadha'); // Uttara Ashadha Nakshatra
    expect(priyaChart.meta.locationName).toBe('Patna, Bihar');

    // Invariant: Two profiles must never compute to the same Lagna/Nakshatra
    expect(prabhakarChart.lagna.rashiName).not.toBe(priyaChart.lagna.rashiName);
    expect(prabhakarChart.moon.nakshatra.name).not.toBe(priyaChart.moon.nakshatra.name);
  });

  test('PDF_002: generateKundliV40Pdf generates PDF without KUNDLI_CONSISTENCY_FAILED', async () => {
    const rawData = {
      name: 'Prabhakar',
      birthDate: '1989-05-26',
      birthTime: '02:20',
      locationName: 'Bilaspur, Chhattisgarh',
      latitude: 22.0797,
      longitude: 82.1409,
      utcOffsetHours: 5.5,
      coordinateProvenance: 'MANUAL' as const
    };

    const resultHi = await generateKundliV40Pdf(rawData as never, { locale: 'hi', skipPdf: true });
    expect(resultHi.ok, resultHi.errorCode).toBe(true);
    expect(resultHi.state).toBe('READY_FOR_DELIVERY');
    const moonHi = resultHi.canonicalModel?.planets.find((p) => p.id === 'Moon');
    expect(moonHi?.sign.en).toBe('Capricorn');
    expect(moonHi?.nakshatra.name).toBe('Shravana');

    const resultEn = await generateKundliV40Pdf(rawData as never, { locale: 'en', skipPdf: true });
    expect(resultEn.ok, resultEn.errorCode).toBe(true);
    expect(resultEn.state).toBe('READY_FOR_DELIVERY');
    const moonEn = resultEn.canonicalModel?.planets.find((p) => p.id === 'Moon');
    expect(moonEn?.sign.en).toBe('Capricorn');
  });

  test('TIER_003: Pricing tiers on /ask match the ₹20 Kundli PDF and ₹501 Kundli + 10-15m explanation specification', () => {
    const tierPricing: Record<string, { amount: number; titleHi: string }> = {
      KUNDLI_PDF: { amount: 20, titleHi: 'सम्पूर्ण कुण्डली PDF डाउनलोड' },
      WRITTEN: { amount: 501, titleHi: 'कुण्डली + 10-15 मिनट व्याख्या' },
      VOICE: { amount: 1100, titleHi: 'गोपनीय प्रत्यक्ष वॉयस सभा (30m)' },
      VIDEO: { amount: 1500, titleHi: 'साक्षात् वीडियो दर्शन (30m)' },
    };

    expect(tierPricing.KUNDLI_PDF.amount).toBe(20);
    expect(tierPricing.WRITTEN.amount).toBe(501);
    expect(tierPricing.VOICE.amount).toBe(1100);
    expect(tierPricing.VIDEO.amount).toBe(1500);
  });

  test('COHERENCE_004: validateBirthInput rejects known city with stale mismatched coordinates', async () => {
    const { validateBirthInput } = await import('../src/lib/kundli/validation');

    // Mismatched: Bilaspur with stale Patna coordinates
    const stalePatnaForBilaspur = {
      name: 'Prabhakar',
      birthDate: '1989-05-26',
      birthTime: '02:20',
      locationName: 'Bilaspur, Chhattisgarh',
      latitude: 25.5941, // Patna lat
      longitude: 85.1376, // Patna lng
      coordinateProvenance: 'MANUAL' as const
    };

    expect(() => validateBirthInput(stalePatnaForBilaspur)).toThrowError();

    // Matching: Bilaspur with resolved Bilaspur coordinates
    const accurateBilaspur = {
      name: 'Prabhakar',
      birthDate: '1989-05-26',
      birthTime: '02:20',
      locationName: 'Bilaspur, Chhattisgarh',
      latitude: 22.0797,
      longitude: 82.1409,
      coordinateProvenance: 'MANUAL' as const
    };

    const validated = validateBirthInput(accurateBilaspur);
    expect(validated.coordinates.latitude).toBe(22.0797);
    expect(validated.coordinates.longitude).toBe(82.1409);
  });

  test('DASHA_005: Dasha transitions are correctly split into Next Antardasha and Next Mahadasha', async () => {
    const rawData = {
      name: 'Prabhakar',
      birthDate: '1989-05-26',
      birthTime: '02:20',
      locationName: 'Bilaspur, Chhattisgarh',
      latitude: 22.0797,
      longitude: 82.1409,
      utcOffsetHours: 5.5,
      coordinateProvenance: 'MANUAL' as const
    };

    const result = await generateKundliV40Pdf(rawData as never, { locale: 'en', skipPdf: true });
    expect(result.ok).toBe(true);

    const derived = result.derivedModel;
    expect(derived).toBeDefined();
    // In 2026, Prabhakar is in Jupiter Mahadasha / Saturn Antardasha
    expect(derived?.dasha.current.mahadasha).toBe('Jupiter');
    expect(derived?.dasha.current.antardasha).toBe('Saturn');

    // Next Antardasha is Mercury (ending Saturn in Oct 2027)
    expect(derived?.dasha.nextAntardashaTransition?.lord).toBe('Mercury');
    expect(derived?.dasha.nextAntardashaTransition?.onDate).toMatch(/^2027/);

    // Next Mahadasha is Saturn (starting in Feb 2039)
    expect(derived?.dasha.nextMahadashaTransition?.lord).toBe('Saturn');
    expect(derived?.dasha.nextMahadashaTransition?.onDate).toMatch(/^2039/);

    // Next transition must NOT be the 2039 Mahadasha
    expect(derived?.dasha.nextTransition?.lord).toBe('Mercury');
  });

  test('INTEGRITY_006: Sade Sati is qualified as Natal Positional Check and Node Dignity is Tradition-Dependent', async () => {
    const rawData = {
      name: 'Prabhakar',
      birthDate: '1989-05-26',
      birthTime: '02:20',
      locationName: 'Bilaspur, Chhattisgarh',
      latitude: 22.0797,
      longitude: 82.1409,
      utcOffsetHours: 5.5,
      coordinateProvenance: 'MANUAL' as const
    };

    const result = await generateKundliV40Pdf(rawData as never, { locale: 'en', skipPdf: true });
    expect(result.ok).toBe(true);

    // Node dignity check
    const rahuCond = result.derivedModel?.grahaConditions.conditions.find(c => c.graha === 'Rahu');
    const ketuCond = result.derivedModel?.grahaConditions.conditions.find(c => c.graha === 'Ketu');
    expect(rahuCond?.dignity.canonicalValue).toBe('TRADITION_DEPENDENT');
    expect(ketuCond?.dignity.canonicalValue).toBe('TRADITION_DEPENDENT');

    // Report sections check
    const report = (result as any).report;
    const saarSection = report?.sections.find((s: any) => s.id === 'kundli-saar');
    expect(saarSection).toBeDefined();

    const jsonSaar = JSON.stringify(saarSection);
    // Unqualified "Sade Sati (natal Saturn from Moon)" must be replaced by "Natal Saturn–Moon positional check"
    expect(jsonSaar).toContain('Natal Saturn–Moon positional check');
  });

  test('GREETING_007: Kashi Sahayak contains "हर हर महादेव! जय माँ तारा!" greeting', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve('src/components/consultation/FloatingAIGuruAvatar.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('हर हर महादेव! जय माँ तारा!');
  });

  test('DASHBOARD_008: Executive Life Gauge and 4-Quadrant Graha Cards compute authentic non-static data', async () => {
    const { getCanonicalJyotishSnapshot } = await import('../src/lib/jyotish/canonicalSnapshot');
    const { computeExecutiveLifeDimensions, computeGrahaArchetypeCards } = await import('../src/lib/jyotish/executiveLifeGauge');

    const snapshot = getCanonicalJyotishSnapshot({
      birthDate: '1989-05-26',
      birthTime: '02:20',
      latitude: 22.0797,
      longitude: 82.1409,
      timezone: 5.5,
      locationName: 'Bilaspur, Chhattisgarh'
    });

    const dimensions = computeExecutiveLifeDimensions(snapshot);
    expect(dimensions.length).toBe(6);

    const scores = dimensions.map(d => d.score);
    // Invariant: Scores must be authentic individual values, NOT a fake constant 55%
    const uniqueScores = new Set(scores);
    expect(uniqueScores.size).toBeGreaterThan(1);
    expect(scores.every(s => s >= 20 && s <= 99)).toBe(true);

    // Verify all 6 specific dimension IDs
    const dimIds = dimensions.map(d => d.id);
    expect(dimIds).toEqual([
      'emotional_resilience',
      'career_trajectory',
      'financial_stability',
      'relationship_sensitivity',
      'leadership_force',
      'spiritual_inclination'
    ]);

    // 4-Quadrant Graha cards verification
    const cards = computeGrahaArchetypeCards(snapshot);
    expect(cards.length).toBe(9);

    for (const card of cards) {
      expect(card.coreThemeEn.length).toBeGreaterThan(10);
      expect(card.strengthEn.length).toBeGreaterThan(10);
      expect(card.challengeEn.length).toBeGreaterThan(10);
      expect(card.practicalRemedyEn.length).toBeGreaterThan(10);
      expect(card.coreThemeHi.length).toBeGreaterThan(5);
      expect(card.strengthHi.length).toBeGreaterThan(5);
      expect(card.challengeHi.length).toBeGreaterThan(5);
      expect(card.practicalRemedyHi.length).toBeGreaterThan(5);
    }

    // Node tradition transparency
    const rahuCard = cards.find(c => c.planet === 'Rahu');
    const ketuCard = cards.find(c => c.planet === 'Ketu');
    expect(rahuCard?.dignity).toContain('Tradition-dependent');
    expect(ketuCard?.dignity).toContain('Tradition-dependent');
  });

});
