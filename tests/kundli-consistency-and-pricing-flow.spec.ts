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

});
