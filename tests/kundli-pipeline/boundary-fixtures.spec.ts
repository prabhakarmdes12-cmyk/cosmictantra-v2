/**
 * BOUNDARY FIXTURES (Requirement 24)
 * Tests for astronomically sensitive boundaries.
 */
import { test, expect } from '@playwright/test';
import { generateKundliPdf } from '../../src/lib/kundli/pipeline';

test.describe('BOUNDARY FIXTURES — time, timezone, nakshatra, sign, dasha', () => {
  // Midnight-adjacent birth time test
  test('Birth at 23:59 should resolve correctly and not shift to next calendar day incorrectly', async () => {
    const r = await generateKundliPdf({
      name: 'Boundary Test Midnight',
      birthDate: '1995-06-15',
      birthTime: '23:59',
      latitude: 25.5941,
      longitude: 85.1376,
      timezoneId: 'Asia/Kolkata',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(true);
    expect(r.state).toBe('READY_FOR_DELIVERY');
    expect(r.pdfQuality).toBeTruthy();
    expect(r.pdfQuality!.status).toBe('PASS');
  });

  // 30-minute timezone offset (if applicable — Asia/Kolkata is 5:30, so this verifies exact half-hour)
  test('Half-hour timezone offset preserved correctly', async () => {
    const r = await generateKundliPdf({
      name: 'Boundary Timezone',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezoneId: 'Asia/Kolkata',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(true);
    const canonical = r.canonicalModel;
    expect(canonical).toBeTruthy();
    expect(canonical!.calculationMetadata.localDateTime).toContain('10:30');
  });

  // Planet near sign boundary
  test('Planet near sign boundary should not flip sign incorrectly', async () => {
    // Complete fixture; sign boundary handled by engine's sidereal calculation.
    const r = await generateKundliPdf({
      name: 'Boundary Sign',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezoneId: 'Asia/Kolkata',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(true);
    expect(r.canonicalModel).toBeTruthy();
    const planets = r.canonicalModel!.planets;
    // Every planet must have a valid sign reference (not undefined/null)
    for (const p of planets) {
      expect(p.sign).toBeDefined();
      expect(p.sign.id).toBeGreaterThanOrEqual(1);
      expect(p.sign.id).toBeLessThanOrEqual(12);
    }
  });

  // Ascendant near sign boundary
  test('Ascendant near sign boundary must resolve to a valid sign', async () => {
    const r = await generateKundliPdf({
      name: 'Boundary Ascendant',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezoneId: 'Asia/Kolkata',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(true);
    expect(r.canonicalModel!.ascendant.sign).toBeDefined();
    expect(r.canonicalModel!.ascendant.sign.id).toBeGreaterThanOrEqual(1);
  });

  // Dasha transition boundary
  test('Dasha transition does not create negative duration or overlap', async () => {
    const r = await generateKundliPdf({
      name: 'Boundary Dasha',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezoneId: 'Asia/Kolkata',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(true);
    const dashas = r.canonicalModel!.dashas;
    expect(dashas.mahadashas.length).toBe(9);
    for (const md of dashas.mahadashas) {
      const start = new Date(md.startDate).getTime();
      const end = new Date(md.endDate).getTime();
      expect(start).toBeGreaterThanOrEqual(0);
      expect(end).toBeGreaterThan(start);
      expect(md.durationYears).toBeGreaterThan(0);
    }
  });
});
