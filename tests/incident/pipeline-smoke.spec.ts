import { test, expect } from '@playwright/test';
import { generateKundliPdf } from '../../src/lib/kundli/pipeline';

test.describe('KUNDLI PIPELINE SMOKE', () => {
  test('complete input produces a validated PDF', async () => {
    const result = await generateKundliPdf({
      name: 'Priya Sharma',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      locationName: 'Patna',
      latitude: 25.5941,
      longitude: 85.1376,
      coordinateProvenance: 'MANUAL',
      timezoneId: 'Asia/Kolkata'
    }, { locale: 'en' });

    console.log(JSON.stringify({
      state: result.state,
      pageCount: result.pdfQuality?.pageCount,
      fileSizeBytes: result.pdfBuffer?.byteLength,
      blankPages: result.pdfQuality?.blankPageCount,
      density: result.pdfQuality?.contentDensity,
      sections: result.report?.sections.map(s => s.id),
      fingerprint: result.report?.lineage.fingerprint
    }, null, 2));

    expect(result.state).toBe('READY_FOR_DELIVERY');
    expect(result.pdfBuffer).toBeTruthy();
    expect(result.pdfQuality?.status).toBe('PASS');
    expect(result.pdfQuality!.pageCount).toBeLessThan(60);
    expect(result.pdfQuality!.pageCount).toBeGreaterThan(3);
    expect(result.pdfQuality!.blankPageCount).toBe(0);
    expect(result.report!.sections.some(s => s.id === 'planetary-positions')).toBe(true);
  });

  test('incident-shaped input (missing name/lng/tz) fails with typed error before PDF', async () => {
    const result = await generateKundliPdf({
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941
    }, { locale: 'en' });

    console.log('incident result state:', result.state);
    expect(result.state).toBe('INPUT_FAILED');
    expect(result.pdfBuffer).toBeNull();
    expect(result.pdfQuality).toBeNull();
  });
});
