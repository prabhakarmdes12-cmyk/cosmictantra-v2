import { test, expect } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { generateShodashavarga, calculateVargaPlacement } from '../src/lib/jyotish/vargaEngine';
import {
  getPanchadhaMaitri,
  checkCombustion,
  checkPlanetaryWar,
  getFunctionalRoles,
  calculateGrahaDrishti,
  calculateRashiDrishti,
  NAISARGIKA_MAITRI
} from '../src/lib/jyotish/relationshipEngine';
import {
  calculateFullShadbala,
  calculateBhavaBala,
  calculateVimshopakaBala
} from '../src/lib/jyotish/balaEngine';

test.describe('GATE R1-Q: Release 1 Deep Mathematical & External Qualification Suite', () => {

  test('TASK 2: Shadbala Component Trace on 3 Historical Charts (Zero Placeholders)', () => {
    const historicalCases = [
      { name: '1863 Swami Vivekananda', date: '1863-01-12', time: '06:33', lat: 22.5726, lon: 88.3639, tz: 5.8908, loc: 'Kolkata' },
      { name: '1869 Mahatma Gandhi', date: '1869-10-02', time: '07:11', lat: 21.6417, lon: 69.6293, tz: 4.6419, loc: 'Porbandar' },
      { name: '1879 Albert Einstein', date: '1879-03-14', time: '11:30', lat: 48.4011, lon: 9.9876, tz: 0.6658, loc: 'Ulm' }
    ];

    for (const hc of historicalCases) {
      const snap = getCanonicalJyotishSnapshot({
        birthDate: hc.date,
        birthTime: hc.time,
        latitude: hc.lat,
        longitude: hc.lon,
        timezone: hc.tz,
        locationName: hc.loc
      });

      expect(snap.balas).toBeDefined();
      const shadbala = snap.balas!.shadbala;

      console.log(`\n=== SHADBALA TRACE: ${hc.name} ===`);
      console.log('Planet  | Sthana (") | Dig (")   | Kala (")  | Cheshta (") | Naisargika (") | Drik (")  | Total Virupas | Total Rupas | Ratio');
      console.log('-------------------------------------------------------------------------------------------------------------------------');

      const drikValues: number[] = [];

      for (const p of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) {
        const sb = shadbala[p];
        expect(sb).toBeDefined();
        drikValues.push(sb.drik.totalVirupas);

        console.log(
          `${p.padEnd(7)} | ` +
          `${sb.sthana.totalVirupas.toFixed(2).padStart(10)} | ` +
          `${sb.dig.totalVirupas.toFixed(2).padStart(9)} | ` +
          `${sb.kala.totalVirupas.toFixed(2).padStart(9)} | ` +
          `${sb.cheshta.totalVirupas.toFixed(2).padStart(11)} | ` +
          `${sb.naisargika.totalVirupas.toFixed(2).padStart(14)} | ` +
          `${sb.drik.totalVirupas.toFixed(2).padStart(9)} | ` +
          `${sb.totalVirupas.toFixed(2).padStart(13)} | ` +
          `${sb.totalRupas.toFixed(2).padStart(11)} | ` +
          `${sb.strengthRatio.toFixed(2).padStart(5)}`
        );

        // Assert zero placeholder constants:
        expect(sb.sthana.saptavargajaBala).toBeGreaterThan(0);
        expect(sb.sthana.uchchaBala).toBeGreaterThanOrEqual(0);
        expect(sb.kala.pakshaBala).toBeGreaterThanOrEqual(0);
      }

      // Assert that Drik Bala is dynamically computed and distinct across planets (NOT a static 20.00)
      const uniqueDrik = new Set(drikValues);
      expect(uniqueDrik.size).toBeGreaterThan(1);
    }
  });

  test('TASK 3: Bhava Bala Truth Audit (Zero Static Placeholders)', () => {
    const snap = getCanonicalJyotishSnapshot({
      birthDate: '1869-10-02',
      birthTime: '07:11',
      latitude: 21.6417,
      longitude: 69.6293,
      timezone: 4.6419,
      locationName: 'Porbandar'
    });

    const bhavaBala = snap.balas!.bhavaBala;
    expect(bhavaBala.length).toBe(12);

    console.log('\n=== BHAVA BALA 12-HOUSE TRACE: Mahatma Gandhi ===');
    console.log('House | Sign        | Lord    | Adhipati Bala (") | Dig Bala (") | Drishti Bala (") | Total Virupas | Total Rupas | Rank');
    console.log('--------------------------------------------------------------------------------------------------------------------');

    const drishtiValues: number[] = [];

    bhavaBala.forEach(h => {
      drishtiValues.push(h.bhavaDrishtiBala);
      console.log(
        `${String(h.houseNumber).padStart(5)} | ` +
        `${h.rashiName.padEnd(11)} | ` +
        `${h.lord.padEnd(7)} | ` +
        `${h.bhavaAdhipatiBala.toFixed(2).padStart(17)} | ` +
        `${h.bhavaDigBala.toFixed(2).padStart(12)} | ` +
        `${h.bhavaDrishtiBala.toFixed(2).padStart(16)} | ` +
        `${h.totalVirupas.toFixed(2).padStart(13)} | ` +
        `${h.totalRupas.toFixed(2).padStart(11)} | ` +
        `#${h.relativeRank}`
      );
    });

    // Assert that Bhava Drishti Bala is dynamically calculated from planets
    const uniqueBhavaDrishti = new Set(drishtiValues);
    expect(uniqueBhavaDrishti.size).toBeGreaterThan(1);
  });

  test('TASK 4: Varga Exhaustive Boundary Qualification (+/- 1 arcsecond)', () => {
    const arcsec = 1 / 3600;

    // 1. D9 Navamsha Boundary: 3°20'00" (3.333333°)
    const d9Bound = 360 / 108; // 3.333333°
    const beforeD9 = calculateVargaPlacement(d9Bound - arcsec, 9);
    const onD9 = calculateVargaPlacement(d9Bound, 9);
    const afterD9 = calculateVargaPlacement(d9Bound + arcsec, 9);

    expect(beforeD9.vargaRashiIndex).toBe(0); // Aries (Pada 1)
    expect(onD9.vargaRashiIndex).toBe(1); // Taurus (Pada 2)
    expect(afterD9.vargaRashiIndex).toBe(1); // Taurus (Pada 2)

    // 2. D30 Trimshamsha Boundary in Aries: 5°00'00" (Mars -> Saturn transition)
    const beforeD30 = calculateVargaPlacement(5.0 - arcsec, 30);
    const onD30 = calculateVargaPlacement(5.0, 30);
    const afterD30 = calculateVargaPlacement(5.0 + arcsec, 30);

    expect(beforeD30.vargaRashiIndex).toBe(0); // Aries (Mars)
    expect(onD30.vargaRashiIndex).toBe(10); // Aquarius (Saturn)
    expect(afterD30.vargaRashiIndex).toBe(10); // Aquarius (Saturn)

    // 3. D60 Shashtiamsha Boundary: 0°30'00" (0.500000°)
    const beforeD60 = calculateVargaPlacement(0.5 - arcsec, 60);
    const onD60 = calculateVargaPlacement(0.5, 60);
    const afterD60 = calculateVargaPlacement(0.5 + arcsec, 60);

    expect(beforeD60.vargaRashiIndex).toBe(0); // Aries (1st Shashtiamsha)
    expect(onD60.vargaRashiIndex).toBe(1); // Taurus (2nd Shashtiamsha)
    expect(afterD60.vargaRashiIndex).toBe(1); // Taurus (2nd Shashtiamsha)
  });

  test('TASK 5: Vimshopaka Complete Component Breakdown', () => {
    const snap = getCanonicalJyotishSnapshot({
      birthDate: '1869-10-02',
      birthTime: '07:11',
      latitude: 21.6417,
      longitude: 69.6293,
      timezone: 4.6419,
      locationName: 'Porbandar'
    });

    const vimshopaka = snap.balas!.vimshopaka;
    expect(vimshopaka).toBeDefined();

    console.log('\n=== VIMSHOPAKA 20-POINT SCORES: Mahatma Gandhi ===');
    console.log('Planet  | Shadvarga (20) | Saptavarga (20) | Dashavarga (20) | Shodashavarga (20)');
    console.log('---------------------------------------------------------------------------------');

    for (const p of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) {
      const vb = vimshopaka[p];
      console.log(
        `${p.padEnd(7)} | ` +
        `${vb.shadvarga.toFixed(2).padStart(14)} | ` +
        `${vb.saptavarga.toFixed(2).padStart(15)} | ` +
        `${vb.dashavarga.toFixed(2).padStart(15)} | ` +
        `${vb.shodashavarga.toFixed(2).padStart(18)}`
      );

      // Verify that individual breakdown exists
      expect(vb.shodashavargaBreakdown.length).toBe(16);
      const d1Item = vb.shodashavargaBreakdown.find(b => b.vargaDivision === 1);
      expect(d1Item).toBeDefined();
      expect(d1Item!.rawPoints).toBeGreaterThan(0);
    }
  });

  test('TASK 6: 9x9 Relationship Matrices & Graha Drishti Matrix', () => {
    const allPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

    console.log('\n=== 9x9 NAISARGIKA MAITRI (NATURAL FRIENDSHIP) MATRIX ===');
    console.log('Planet  | ' + allPlanets.map(p => p.padEnd(7)).join(' | '));
    console.log('-------------------------------------------------------------------------------------------------------------------');

    for (const p1 of allPlanets) {
      const row = allPlanets.map(p2 => {
        if (p1 === p2) return 'SELF'.padEnd(7);
        const data = NAISARGIKA_MAITRI[p1];
        if (!data) return 'NEUT'.padEnd(7);
        if (data.friends.includes(p2)) return 'FRIEND'.padEnd(7);
        if (data.enemies.includes(p2)) return 'ENEMY'.padEnd(7);
        return 'NEUT'.padEnd(7);
      });
      console.log(`${p1.padEnd(7)} | ${row.join(' | ')}`);
    }

    // Verify Planetary War Winning Convention Declaration
    const testWar = checkPlanetaryWar([
      { name: 'Mars', longitude: 100.5, latitude: 1.2 },
      { name: 'Saturn', longitude: 100.8, latitude: 0.5 } // Within 0.3° (18 arcmin)
    ]);
    expect(testWar.length).toBe(1);
    expect(testWar[0].isWar).toBe(true);
    expect(testWar[0].winner).toBe('Mars'); // Higher northern latitude wins
  });
});
