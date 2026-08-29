import { test, expect } from '@playwright/test';
import * as libDasha from '../../src/lib/dashaEngine.js';
import * as engineDasha from '../../src/engines/dashaEngine.legacy.js';

test.describe('Vimshottari Dasha Engine Differential Suite', () => {

  const testCases = [
    {
      name: 'Case 1: Moon in Magha Nakshatra (Ketu ruler, 1995)',
      moonNakshatra: { name: 'Magha', degree: 3.5, ruler: 'Ketu' },
      moonLongitude: 123.5, // Magha (120° to 133.33°)
      birthDateStr: '1995-06-15'
    },
    {
      name: 'Case 2: Moon in Rohini Nakshatra (Moon ruler, 1992)',
      moonNakshatra: { name: 'Rohini', degree: 8.2, ruler: 'Moon' },
      moonLongitude: 48.2, // Rohini (40° to 53.33°)
      birthDateStr: '1992-10-24'
    }
  ];

  test('Differential Test: 3-Tier Pratyantardasha in Lib vs 2-Tier in Engines', () => {
    for (const tc of testCases) {
      // 1. Lib Dasha Calculation
      const libRes = (libDasha as any).calculateVimshottariDasha(tc.moonLongitude, tc.birthDateStr);
      const libDashas = libRes.mahadashas;
      
      // 2. Engines Dasha Calculation
      const engDashas = (engineDasha as any).calculateVimshottariDasha(tc.moonNakshatra, new Date(tc.birthDateStr));

      // Both compute 9 Mahadashas
      expect(libDashas.length).toBe(9);
      expect(engDashas.length).toBe(9);

      // Verify Mahadasha lord consistency
      expect(libDashas[0].lord).toBe(engDashas[0].planet);

      // Verify Lib provides Pratyantardashas (3rd tier)
      expect(libDashas[0].antardashas[0].pratyantardashas).toBeDefined();
      expect(libDashas[0].antardashas[0].pratyantardashas.length).toBe(9);

      // Verify Engines only provides 2 tiers
      expect(engDashas[0].antardashas[0].pratyantardashas).toBeUndefined();
    }
  });

});
