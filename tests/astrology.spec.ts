import { test, expect } from '@playwright/test';
import * as libEngine from '../src/lib/astrologyEngine.js';
import * as enginesEngine from '../src/engines/astrologyEngine.js';

test.describe('Astrological Engine Golden Invariant Test Suite', () => {

  const testCases = [
    {
      name: 'Benchmark Case 1 (15 Jun 1995 10:30 Patna)',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezone: 5.5,
      expectedLagnaRashi: 'Simha',
      expectedLagnaNakshatra: 'Magha',
      expectedMoonRashi: 'Dhanu',
      expectedMoonNakshatra: 'Uttara Ashadha'
    },
    {
      name: 'Benchmark Case 2 (24 Oct 1992 06:45 Patna)',
      birthDate: '1992-10-24',
      birthTime: '06:45',
      latitude: 25.5941,
      longitude: 85.1376,
      timezone: 5.5,
      expectedLagnaRashi: 'Tula',
      expectedMoonRashi: 'Kanya'
    }
  ];

  for (const tc of testCases) {
    test(`Engine Invariant: ${tc.name}`, () => {
      // 1. Calculate via libEngine (Object arguments)
      const resLib = (libEngine as any).calculateKundali({
        birthDate: tc.birthDate,
        birthTime: tc.birthTime,
        latitude: tc.latitude,
        longitude: tc.longitude,
        timezone: tc.timezone
      });

      // 2. Calculate via enginesEngine (Positional arguments)
      const resEng = (enginesEngine as any).calculateKundali(
        tc.birthDate,
        tc.birthTime,
        tc.latitude,
        tc.longitude,
        tc.timezone
      );

      // Verify lib vs engine output consistency
      expect(resLib.lagna.rashiId).toBe(resEng.lagna.rashiId);
      expect(resLib.moon.rashiId).toBe(resEng.moon.rashiId);
      expect(resLib.moon.nakshatra.name).toBe(resEng.moon.nakshatra.name);
      expect(resLib.moon.pada).toBe(resEng.moon.pada);

      // Verify benchmark expectations
      if (tc.expectedLagnaRashi) {
        expect(resLib.lagna.rashiName).toBe(tc.expectedLagnaRashi);
      }
      if (tc.expectedLagnaNakshatra) {
        expect(resLib.lagna.nakshatra.name).toBe(tc.expectedLagnaNakshatra);
      }
      if (tc.expectedMoonRashi) {
        expect(resLib.moon.rashiName).toBe(tc.expectedMoonRashi);
      }
    });
  }
});
