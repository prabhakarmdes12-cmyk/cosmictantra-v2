import { test, expect } from '@playwright/test';
import {
  calculateMilan,
  milanInputFromSnapshot,
  milanContextFromSnapshot,
  rashiLordByName,
  nakshatraDistance,
  rashiDistance,
  totalBand,
  normalizePerson,
  isValidMilanInput,
} from '../../src/lib/kundli/v42/milan/milanEngine';

const taurusRohini1 = { rashiName: 'Taurus', nakshatraName: 'Rohini', pada: 1, rashiLord: 'Venus' };
const taurusRohini2 = { rashiName: 'Taurus', nakshatraName: 'Rohini', pada: 2, rashiLord: 'Venus' };

test.describe('Milan engine — classical 36-guna tables', () => {
  test('identical chart (same nakshatra and pada) is an active Nadi Dosha', () => {
    const r = calculateMilan(taurusRohini1, { ...taurusRohini1 });
    expect(r.maxTotal).toBe(36);
    expect(r.nadiDoshaActive).toBe(true);
    expect(r.nadiCancelled).toBe(false);
    const nadi = r.kootas.find((k) => k.id === 'nadi')!;
    expect(nadi.points).toBe(0);
    expect(r.verdict.totalBand).toBe('Not Recommended');
  });

  test('same nakshatra different pada cancels Nadi Dosha and gives a full score', () => {
    const r = calculateMilan(taurusRohini1, taurusRohini2);
    expect(r.total).toBe(33);
    expect(r.nadiCancelled).toBe(true);
    expect(r.nadiDoshaActive).toBe(false);
    expect(r.doshas.find((d) => d.id === 'nadi')!.cancelled).toBe(true);
    expect(r.kootas.find((k) => k.id === 'nadi')!.points).toBe(8);
    expect(r.verdict.totalBand).toBe('Excellent');
  });

  test('Krittika vs Bharani triggers Bhakoot (2/12) Dosha and no cancellation', () => {
    const r = calculateMilan(
      { rashiName: 'Aries', nakshatraName: 'Krittika', pada: 1, rashiLord: 'Mars' },
      { rashiName: 'Taurus', nakshatraName: 'Bharani', pada: 1, rashiLord: 'Venus' }
    );
    const b = r.kootas.find((k) => k.id === 'bhakoot')!;
    expect(b.points).toBe(0);
    expect(r.doshas.find((d) => d.id === 'bhakoot')!.active).toBe(true);
    expect(r.doshas.find((d) => d.id === 'bhakoot')!.cancelled).toBe(false);
    expect(r.verdict.totalBand).toBe('Not Recommended');
    expect(r.predictions.some((p) => p.caution.length > 0 && p.askAstrologer.length > 0)).toBe(true);
  });

  test('same Nadi but different rashi/nakshatra is active not cancelled', () => {
    const r = calculateMilan(
      { rashiName: 'Taurus', nakshatraName: 'Rohini', pada: 1, rashiLord: 'Venus' },
      { rashiName: 'Libra', nakshatraName: 'Swati', pada: 1, rashiLord: 'Venus' }
    );
    const n = r.kootas.find((k) => k.id === 'nadi')!;
    expect(n.points).toBe(0);
    expect(r.doshas.find((d) => d.id === 'nadi')!.active).toBe(true);
    expect(r.doshas.find((d) => d.id === 'nadi')!.cancelled).toBe(false);
  });

  test('Varna, Vashya and Graha values follow the fixed grids', () => {
    const r = calculateMilan(
      { rashiName: 'Leo', nakshatraName: 'Magha', pada: 1, rashiLord: 'Sun' },
      { rashiName: 'Cancer', nakshatraName: 'Pushya', pada: 1, rashiLord: 'Moon' }
    );
    // Leo = Kshatriya, Cancer = Brahmin; bride lower than groom => Varna 1.
    expect(r.kootas.find((k) => k.id === 'varna')!.points).toBe(1);
    // Leo = Vanchar, Cancer = Jalachar; Vashya matrix gives 0 per source grid.
    expect(r.kootas.find((k) => k.id === 'vashya')!.points).toBe(0);
    // Sun vs Moon are natural friends => Graha Maitri 5.
    expect(r.kootas.find((k) => k.id === 'grahaMaitri')!.points).toBe(5);
  });

  test('the prediction layer is explanatory, motivating, cautious, gated', () => {
    const r = calculateMilan(taurusRohini1, { ...taurusRohini1 });
    for (const p of r.predictions) {
      expect(p.traditionalClaim.length).toBeGreaterThan(10);
      expect(p.explanation.length).toBeGreaterThan(20);
      expect(p.motivation.length).toBeGreaterThan(10);
      expect(p.caution.length).toBeGreaterThan(10);
      expect(p.bestScenario.length).toBeGreaterThan(10);
      expect(p.askAstrologer.toLowerCase()).toContain('astrologer');
      // Authored Hindi body prose is part of the v42 bilingual contract.
      expect(p.explanationHi.length).toBeGreaterThan(20);
      expect(p.motivationHi.length).toBeGreaterThan(10);
      expect(p.cautionHi.length).toBeGreaterThan(10);
      expect(p.bestScenarioHi.length).toBeGreaterThan(10);
      expect(p.askAstrologerHi.length).toBeGreaterThan(10);
    }
    expect(r.sources.length).toBeGreaterThanOrEqual(3);
  });

  test('Rajju, Vedha and the chart-context dosha layer are reported', () => {
    const r = calculateMilan(
      { rashiName: 'Taurus', nakshatraName: 'Rohini', pada: 1, rashiLord: 'Venus' },
      { rashiName: 'Libra', nakshatraName: 'Swati', pada: 1, rashiLord: 'Venus' }
    );
    const rajju = r.supplementalDoshas.find((d) => d.id === 'rajju')!;
    const vedha = r.supplementalDoshas.find((d) => d.id === 'vedha')!;
    const mangal = r.supplementalDoshas.find((d) => d.id === 'mangal')!;
    const kalaSarpa = r.supplementalDoshas.find((d) => d.id === 'kalsarpa')!;
    // Rohini = Kantha, Swati = Kantha => active Rajju.
    expect(rajju.active).toBe(true);
    // Rohini ↔ Swati is a classical Vedha pair.
    expect(vedha.active).toBe(true);
    // The complete classical dosha layer is always present, with clear/active splits.
    expect(mangal.id).toBe('mangal');
    expect(kalaSarpa.id).toBe('kalsarpa');
    expect(r.supplementalDoshas).toHaveLength(4);
    expect(r.synthesis.navamsha.status).toBe('UNKNOWN');
    expect(r.synthesis.seventhHouse).toBeTruthy();
    expect(r.synthesis.marriageKaraka).toBeTruthy();
    expect(r.synthesis.kalaSarpa).toBeTruthy();
    expect(r.predictions.map((p) => p.id)).toContain('synthesis');
    // Every prediction block carries the explain-to-astrologer gate in both languages.
    for (const p of r.predictions) {
      expect(p.askAstrologer).toContain('astrologer');
      expect(p.askAstrologerHi).toContain('ज्योतिष');
    }
  });

  test('same nakshatra different pada cancels Rajju in the same rashi', () => {
    const r = calculateMilan(taurusRohini1, taurusRohini2);
    const rajju = r.supplementalDoshas.find((d) => d.id === 'rajju')!;
    expect(rajju.active).toBe(false); // cancelled doshas are not "active" in the engine's model
    expect(rajju.cancelled).toBe(true);
  });

  test('Kala Sarpa is detected from a planets array on one side of the node axis', () => {
    const planets = [
      { name: 'Sun', longitude: 20 },
      { name: 'Moon', longitude: 30 },
      { name: 'Mars', longitude: 40 },
      { name: 'Mercury', longitude: 50 },
      { name: 'Jupiter', longitude: 60 },
      { name: 'Venus', longitude: 70 },
      { name: 'Saturn', longitude: 80 },
      { name: 'Rahu', longitude: 10 },
      { name: 'Ketu', longitude: 150 },
    ];
    const r = calculateMilan(taurusRohini1, taurusRohini2, {
      brideCtx: { planetsArray: planets },
      groomCtx: {},
    });
    const ks = r.supplementalDoshas.find((d) => d.id === 'kalsarpa')!;
    expect(ks.active).toBe(true);
    expect(r.synthesis.kalaSarpa.brideActive).toBe(true);
    expect(r.synthesis.kalaSarpa.groomActive).toBe(false);
  });

  test('D9 and seventh-house contexts feed the synthesis', () => {
    const r = calculateMilan(taurusRohini1, taurusRohini2, {
      brideCtx: { d9MoonRashiName: 'Virgo', d9MoonRashiId: 6, seventhHouseName: 'Virgo', seventhHouseLord: 'Mercury' },
      groomCtx: { d9MoonRashiName: 'Virgo', d9MoonRashiId: 6, seventhHouseName: 'Virgo', seventhHouseLord: 'Mercury' },
    });
    expect(r.synthesis.navamsha.status).toBe('ALIGNED');
    expect(r.synthesis.seventhHouse.status).toBe('STRONG');
  });

  test('Mangal Dosha is cancelled by own/exalted/debilitated Mars and Jupiter aspect', () => {
    const own = calculateMilan(taurusRohini1, taurusRohini2, {
      brideCtx: {
        lagnaRashiId: 1, mars: { rashiId: 1, house: 7, rashiName: 'Aries' },
        planetsArray: [{ name: 'Mars', rashiId: 1, house: 7 }, { name: 'Jupiter', rashiId: 9 }],
        manglik: { isManglik: true, isCancelled: false, causeHouse: 7, severity: 'HIGH' },
      },
    });
    const ownMangal = own.supplementalDoshas.find((d) => d.id === 'mangal')!;
    expect(ownMangal.active).toBe(false);
    expect(ownMangal.cancelled).toBe(true);

    const jupiter = calculateMilan(taurusRohini1, taurusRohini2, {
      brideCtx: {
        lagnaRashiId: 1, mars: { rashiId: 7, house: 7, rashiName: 'Libra' },
        planetsArray: [{ name: 'Mars', rashiId: 7, house: 7 }, { name: 'Jupiter', rashiId: 1 }],
        manglik: { isManglik: true, isCancelled: false, causeHouse: 7, severity: 'HIGH' },
      },
    });
    const jupiterMangal = jupiter.supplementalDoshas.find((d) => d.id === 'mangal')!;
    expect(jupiterMangal.active).toBe(false);
    expect(jupiterMangal.cancelled).toBe(true);
    expect(jupiterMangal.reason).toMatch(/Jupiter/);
  });

  test('Mangal Dosha remains active when no Bhanga condition applies', () => {
    const r = calculateMilan(taurusRohini1, taurusRohini2, {
      brideCtx: {
        lagnaRashiId: 1, mars: { rashiId: 2, house: 7, rashiName: 'Taurus' },
        planetsArray: [{ name: 'Mars', rashiId: 2, house: 7 }, { name: 'Jupiter', rashiId: 9 }],
        manglik: { isManglik: true, isCancelled: false, causeHouse: 7, severity: 'HIGH' },
      },
    });
    const mangal = r.supplementalDoshas.find((d) => d.id === 'mangal')!;
    expect(mangal.active).toBe(true);
    expect(mangal.cancelled).toBe(false);
    expect(mangal.weight).toBe('MEDIUM');
  });

  test('mutual Manglik is reported as a cancellation for both charts', () => {
    const r = calculateMilan(taurusRohini1, taurusRohini2, {
      brideCtx: {
        lagnaRashiId: 1,
        mars: { rashiId: 7, house: 7, rashiName: 'Libra' },
        planetsArray: [{ name: 'Mars', rashiId: 7, house: 7 }],
        manglik: { isManglik: true, isCancelled: false, causeHouse: 7, severity: 'HIGH' },
      },
      groomCtx: {
        lagnaRashiId: 5,
        mars: { rashiId: 7, house: 1, rashiName: 'Libra' },
        planetsArray: [{ name: 'Mars', rashiId: 7, house: 1 }],
        manglik: { isManglik: true, isCancelled: false, causeHouse: 1, severity: 'MEDIUM' },
      },
    });
    expect(r.supplementalDoshas.some((d) => d.id === 'mangal' && !d.active && d.cancelled)).toBe(true);
  });
});

test.describe('Milan engine — derived helpers', () => {
  test('rashi and nakshatra distances wrap correctly', () => {
    expect(rashiDistance(1, 13)).toBe(1); // Aries -> same Aries
    expect(rashiDistance(1, 2)).toBe(2);
    expect(nakshatraDistance('Rohini', 'Rohini')).toBe(1);
    expect(nakshatraDistance('Ashwini', 'Revati')).toBe(27);
  });

  test('total bands match the traditional thresholds', () => {
    expect(totalBand(36)).toBe('Excellent');
    expect(totalBand(30)).toBe('Good');
    expect(totalBand(20)).toBe('Acceptable');
    expect(totalBand(10)).toBe('Not Recommended');
    expect(totalBand(0)).toBe('Incomplete');
    expect(totalBand(36, true)).toBe('Not Recommended');
  });

  test('normalize / rashi lord helpers are robust', () => {
    expect(rashiLordByName('Taurus')).toBe('Venus');
    expect(rashiLordByName('unknown')).toBe('');
    expect(normalizePerson({ pada: 99 })).toMatchObject({ pada: 1 });
  });

  test('isValidMilanInput rejects unknown rashi/nakshatra', () => {
    expect(isValidMilanInput({ rashiName: 'Taurus', nakshatraName: 'Rohini' })).toBe(true);
    expect(isValidMilanInput({ rashiName: 'Unknown', nakshatraName: 'Rohini' })).toBe(false);
    expect(isValidMilanInput({ rashiName: 'Taurus', nakshatraName: 'None' })).toBe(false);
    expect(isValidMilanInput({})).toBe(false);
  });

  test('milanInputFromSnapshot reads canonical Moon shape', () => {
    const person = milanInputFromSnapshot({
      planets: {
        Moon: { rashiName: 'Taurus', rashiLord: 'Venus', nakshatra: { name: 'Rohini', pada: 3 } },
      },
      birthPanchang: { nakshatra: { name: 'Rohini' } },
    });
    expect(person).toEqual({ rashiName: 'Taurus', nakshatraName: 'Rohini', pada: 3, rashiLord: 'Venus' });
  });

  test('milanContextFromSnapshot reads lagna, Mars, D9 and 7th house', () => {
    const ctx = milanContextFromSnapshot({
      lagna: { rashiId: 1, rashiName: 'Aries' },
      planetsArray: [{
        name: 'Mars', house: 7, rashiId: 7, longitude: 200, rashiName: 'Libra', dignity: 'Enemy',
      }],
      houses: [{ number: 7, rashiId: 7, rashiName: 'Libra' }],
      vargas: { d9Navamsha: [{ planet: 'Moon', navamshaRashi: 'Virgo', navamshaRashiId: 6 }] },
      yogasAndDoshas: { manglik: { isManglik: true, severity: 'HIGH', causeHouse: 7, isCancelled: false } },
    });
    expect(ctx.marsHouse).toBe(7);
    expect(ctx.seventhHouseName).toBe('Libra');
    expect(ctx.seventhHouseLord).toBe('Venus');
    expect(ctx.d9MoonRashiName).toBe('Virgo');
    expect(ctx.manglik?.isManglik).toBe(true);
  });
});
