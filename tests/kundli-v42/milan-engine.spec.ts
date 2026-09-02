import { test, expect } from '@playwright/test';
import {
  calculateMilan,
  milanInputFromSnapshot,
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
    }
    expect(r.sources.length).toBeGreaterThanOrEqual(3);
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
});
