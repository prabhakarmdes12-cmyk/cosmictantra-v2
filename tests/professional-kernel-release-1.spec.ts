import { test, expect } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { generateShodashavarga, calculateVargaPlacement } from '../src/lib/jyotish/vargaEngine';
import {
  getPanchadhaMaitri,
  checkCombustion,
  checkPlanetaryWar,
  getFunctionalRoles,
  calculateGrahaDrishti,
  calculateRashiDrishti
} from '../src/lib/jyotish/relationshipEngine';
import {
  calculateFullShadbala,
  calculateBhavaBala,
  calculateVimshopakaBala
} from '../src/lib/jyotish/balaEngine';

test.describe('CosmicTantra Professional Jyotish Kernel: Release 1 Verification Suite', () => {

  test('1. VargaEngine: Full Shodashavarga (D1 to D60) & Boundary Tests', () => {
    // 1. D1 to D60 placements for standard test coordinates
    const testPlanets = [
      { name: 'Sun', longitude: 280.3687, rashiId: 10 }, // Capricorn 10°22'
      { name: 'Moon', longitude: 223.3239, rashiId: 8 }, // Scorpio 13°19'
      { name: 'Mars', longitude: 327.9639, rashiId: 11 }, // Aquarius 27°57'
      { name: 'Mercury', longitude: 271.8889, rashiId: 10 }, // Capricorn 01°53'
      { name: 'Jupiter', longitude: 25.2542, rashiId: 1 }, // Aries 25°15'
      { name: 'Venus', longitude: 241.5652, rashiId: 9 }, // Sagittarius 01°33'
      { name: 'Saturn', longitude: 40.3961, rashiId: 2 } // Taurus 10°23'
    ];
    const lagnaLon = 103.6864; // Cancer 13°41'

    const shodashavarga = generateShodashavarga(lagnaLon, testPlanets);

    // Verify all 16 classical divisions exist
    const expectedDivisions = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];
    for (const div of expectedDivisions) {
      expect(shodashavarga[div]).toBeDefined();
      expect(shodashavarga[div].division).toBe(div);
      expect(shodashavarga[div].houses.length).toBe(12);
      expect(Object.keys(shodashavarga[div].planets).length).toBe(7);
      expect(shodashavarga[div].lagna.vargaRashiId).toBeGreaterThanOrEqual(1);
      expect(shodashavarga[div].lagna.vargaRashiId).toBeLessThanOrEqual(12);
    }

    // Boundary Test: D9 Navamsha element mapping
    // Fire sign 0° -> Aries (1), Earth sign 0° -> Capricorn (10), Air sign 0° -> Libra (7), Water sign 0° -> Cancer (4)
    expect(calculateVargaPlacement(0.01, 9).vargaRashiIndex).toBe(0); // Aries 0.01° -> Aries
    expect(calculateVargaPlacement(30.01, 9).vargaRashiIndex).toBe(9); // Taurus 0.01° -> Capricorn
    expect(calculateVargaPlacement(60.01, 9).vargaRashiIndex).toBe(6); // Gemini 0.01° -> Libra
    expect(calculateVargaPlacement(90.01, 9).vargaRashiIndex).toBe(3); // Cancer 0.01° -> Cancer

    // D30 Trimshamsha Parashari boundaries for odd sign (Aries):
    // 0-5° Mars (Aries=0), 5-10° Saturn (Aquarius=10), 10-18° Jupiter (Sag=8), 18-25° Mercury (Gemini=2), 25-30° Venus (Libra=6)
    expect(calculateVargaPlacement(2.5, 30).vargaRashiIndex).toBe(0);
    expect(calculateVargaPlacement(7.5, 30).vargaRashiIndex).toBe(10);
    expect(calculateVargaPlacement(14.0, 30).vargaRashiIndex).toBe(8);
    expect(calculateVargaPlacement(21.0, 30).vargaRashiIndex).toBe(2);
    expect(calculateVargaPlacement(27.0, 30).vargaRashiIndex).toBe(6);
  });

  test('2. RelationshipEngine: Panchadha Maitri, Drishti, Combustions, Functional Roles', () => {
    // 1. Panchadha Maitri between Sun and Mars in 10th & 11th signs (Sun in 10, Mars in 11 = 2nd from Sun = Tatkalika Friend)
    // Naisargika Friend + Tatkalika Friend = Ati Mitra
    const maitriSunMars = getPanchadhaMaitri('Sun', 'Mars', 10, 11);
    expect(maitriSunMars).toBe('ATI_MITRA');

    // 2. Combustion
    // Mercury at 271.88° vs Sun at 280.36° -> diff = 8.48° (within 14° orb) -> Combust
    const mercuryCombust = checkCombustion('Mercury', 271.88, 280.36, false);
    expect(mercuryCombust.isCombust).toBe(true);

    // Jupiter at 25.25° vs Sun at 280.36° -> diff > 11° -> Safe
    const jupiterCombust = checkCombustion('Jupiter', 25.25, 280.36, false);
    expect(jupiterCombust.isCombust).toBe(false);

    // 3. Functional Roles for Cancer Lagna (Rashi 4):
    // Mars rules 5th (Scorpio) and 10th (Aries) -> Yogakaraka!
    const rolesCancer = getFunctionalRoles(4);
    expect(rolesCancer['Mars'].isYogakaraka).toBe(true);
    expect(rolesCancer['Mars'].isFunctionalBenefic).toBe(true);

    // 4. Graha Drishti: Mars in 11th house casts special aspects on 2nd (4th dist), 6th (8th dist), 5th (7th dist)
    const testPlanets = [
      { name: 'Mars', rashiId: 11 },
      { name: 'Moon', rashiId: 2 }, // 4th from Mars (11 -> 2 is 4 houses)
      { name: 'Jupiter', rashiId: 6 }, // 8th from Mars (11 -> 6 is 8 houses)
      { name: 'Sun', rashiId: 5 } // 7th from Mars (11 -> 5 is 7 houses)
    ];
    const aspects = calculateGrahaDrishti(testPlanets);
    const marsAspects = aspects.filter(a => a.aspectingPlanet === 'Mars');
    expect(marsAspects.some(a => a.aspectedPlanetOrHouse === 'Moon' && a.aspectStrengthShashtiamsha === 60)).toBe(true);
    expect(marsAspects.some(a => a.aspectedPlanetOrHouse === 'Jupiter' && a.aspectStrengthShashtiamsha === 60)).toBe(true);
    expect(marsAspects.some(a => a.aspectedPlanetOrHouse === 'Sun' && a.aspectStrengthShashtiamsha === 60)).toBe(true);

    // 5. Rashi Drishti: Aries (Movable) aspects Fixed signs (Leo 5, Scorpio 8, Aquarius 11) except adjacent Taurus (2)
    const rashiAspects = calculateRashiDrishti([{ name: 'Sun', rashiId: 1 }]);
    const ariesAspects = rashiAspects.filter(a => a.aspectingRashiId === 1);
    expect(ariesAspects.map(a => a.aspectedRashiId)).toEqual(expect.arrayContaining([5, 8, 11]));
    expect(ariesAspects.map(a => a.aspectedRashiId)).not.toContain(2);
  });

  test('3. BalaEngine: Full 6-Fold Shadbala, Bhava Bala & Vimshopaka Bala', () => {
    const testPlanets = [
      { name: 'Sun', longitude: 280.3687, rashiId: 10, house: 7, isRetrograde: false, speed: 1.0 },
      { name: 'Moon', longitude: 223.3239, rashiId: 8, house: 5, isRetrograde: false, speed: 12.0 },
      { name: 'Mars', longitude: 327.9639, rashiId: 11, house: 8, isRetrograde: false, speed: 0.77 },
      { name: 'Mercury', longitude: 271.8889, rashiId: 10, house: 7, isRetrograde: false, speed: 1.55 },
      { name: 'Jupiter', longitude: 25.2542, rashiId: 1, house: 10, isRetrograde: false, speed: 0.04 },
      { name: 'Venus', longitude: 241.5652, rashiId: 9, house: 6, isRetrograde: false, speed: 1.20 },
      { name: 'Saturn', longitude: 40.3961, rashiId: 2, house: 11, isRetrograde: true, speed: -0.02 }
    ];
    const lagnaLon = 103.6864; // Cancer Lagna (Rashi 4)

    // A. Shadbala
    const shadbala = calculateFullShadbala(lagnaLon, testPlanets);
    for (const p of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) {
      const sb = shadbala[p];
      expect(sb).toBeDefined();
      expect(sb.totalVirupas).toBeGreaterThan(150);
      expect(sb.totalRupas).toBeGreaterThan(2.5);
      expect(sb.requiredRupas).toBeGreaterThan(0);
      expect(sb.strengthRatio).toBeGreaterThan(0);
      expect(sb.sthana.totalVirupas).toBeGreaterThan(0);
      expect(sb.dig.totalVirupas).toBeGreaterThanOrEqual(0);
      expect(sb.kala.totalVirupas).toBeGreaterThan(0);
      expect(sb.cheshta.totalVirupas).toBeGreaterThan(0);
      expect(sb.naisargika.totalVirupas).toBeGreaterThan(0);
      expect(typeof sb.drik.totalVirupas).toBe("number");
    }

    // B. Bhava Bala
    const bhavaBala = calculateBhavaBala(4, shadbala);
    expect(bhavaBala.length).toBe(12);
    bhavaBala.forEach((h, idx) => {
      expect(h.houseNumber).toBe(idx + 1);
      expect(h.totalVirupas).toBeGreaterThan(200);
      expect(h.totalRupas).toBeGreaterThan(3.0);
    });

    // C. Vimshopaka Bala
    const vimshopaka = calculateVimshopakaBala(lagnaLon, testPlanets);
    for (const p of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) {
      const vb = vimshopaka[p];
      expect(vb).toBeDefined();
      expect(vb.shadvarga).toBeGreaterThan(0);
      expect(vb.shadvarga).toBeLessThanOrEqual(20);
      expect(vb.saptavarga).toBeGreaterThan(0);
      expect(vb.saptavarga).toBeLessThanOrEqual(20);
      expect(vb.dashavarga).toBeGreaterThan(0);
      expect(vb.dashavarga).toBeLessThanOrEqual(20);
      expect(vb.shodashavarga).toBeGreaterThan(0);
      expect(vb.shodashavarga).toBeLessThanOrEqual(20);
    }
  });

  test('4. End-to-End Master Snapshot with Release 1 Professional Subsystems', () => {
    const snapshot = getCanonicalJyotishSnapshot({
      birthDate: '1869-10-02',
      birthTime: '07:11',
      latitude: 21.6417,
      longitude: 69.6293,
      timezone: 4.6419,
      locationName: 'Porbandar, Gujarat, India'
    });

    // Verify snapshot structure
    expect(snapshot.vargas.shodashavarga).toBeDefined();
    expect(snapshot.vargas.shodashavarga![9].name).toBe('Navamsha');
    expect(snapshot.relationships).toBeDefined();
    expect(snapshot.relationships!.functionalRoles['Mars']).toBeDefined();
    expect(snapshot.drishti).toBeDefined();
    expect(snapshot.balas).toBeDefined();
    expect(snapshot.balas!.shadbala['Sun'].totalRupas).toBeGreaterThan(3);
    expect(snapshot.balas!.bhavaBala.length).toBe(12);
    expect(snapshot.balas!.vimshopaka['Jupiter'].shodashavarga).toBeGreaterThan(5);
  });
});
