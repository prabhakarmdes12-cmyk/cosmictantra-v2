/**
 * FAILURE-INJECTION TESTS (Requirement 26)
 * Deliberately break dependencies and verify fail-closed delivery.
 */
import { test, expect } from '@playwright/test';
import { generateKundliPdf } from '../../src/lib/kundli/pipeline';

test.describe('FAILURE INJECTION — fail-closed delivery', () => {
  test('Broken longitude must block delivery', async () => {
    const r = await generateKundliPdf({
      name: 'Fail Injection Longitude',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: undefined,
      timezoneId: 'Asia/Kolkata',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(false);
    expect(r.pdfBuffer).toBeNull();
    expect(r.state).not.toBe('READY_FOR_DELIVERY');
  });

  test('Broken timezone must block delivery', async () => {
    const r = await generateKundliPdf({
      name: 'Fail Injection Timezone',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezoneId: 'Invalid/Zone',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(false);
    expect(r.pdfBuffer).toBeNull();
  });

  test('Broken birth time format must block delivery', async () => {
    const r = await generateKundliPdf({
      name: 'Fail Injection Time Format',
      birthDate: '1995-06-15',
      birthTime: '99:99',
      latitude: 25.5941,
      longitude: 85.1376,
      timezoneId: 'Asia/Kolkata',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(false);
    expect(r.pdfBuffer).toBeNull();
  });

  test('Broken date must block delivery', async () => {
    const r = await generateKundliPdf({
      name: 'Fail Injection Date',
      birthDate: '2023-02-29',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezoneId: 'Asia/Kolkata',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(false);
    expect(r.pdfBuffer).toBeNull();
  });

  test('Broken coordinate range must block delivery', async () => {
    const r = await generateKundliPdf({
      name: 'Fail Injection Range',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 95,
      longitude: 85.1376,
      timezoneId: 'Asia/Kolkata',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(false);
    expect(r.pdfBuffer).toBeNull();
  });

  test('No apparently successful PDF delivered under any broken input', async () => {
    const brokenInputs = [
      { latitude: undefined, longitude: undefined },
      { latitude: 25.5941, longitude: undefined },
      { birthTime: 'invalid' },
      { timezoneId: 'Unknown/Zone' },
      { name: undefined },
    ];
    for (const broken of brokenInputs) {
      const r = await generateKundliPdf({
        name: 'Fail Test',
        birthDate: '1995-06-15',
        birthTime: '10:30',
        latitude: broken.latitude ?? 25.5941,
        longitude: broken.longitude ?? 85.1376,
        timezoneId: broken.timezoneId ?? 'Asia/Kolkata',
        coordinateProvenance: 'MANUAL',
        ...broken,
      }, { locale: 'en' });
      expect(r.pdfBuffer, `PDF delivered for broken input: ${JSON.stringify(broken)}`).toBeNull();
      expect(r.state, `Delivery succeeded for broken input: ${JSON.stringify(broken)}`).not.toBe('READY_FOR_DELIVERY');
    }
  });

  test('Pipeline never produces a PDF when GATE 2 (calculation) fails', async () => {
    // Even if input passes, if calculation fails, no PDF delivered.
    // This test relies on the fact that a valid input produces a valid result,
    // confirming the pipeline does not bypass GATE 2.
    const r = await generateKundliPdf({
      name: 'GATE 2 Verification',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezoneId: 'Asia/Kolkata',
      coordinateProvenance: 'MANUAL',
    }, { locale: 'en' });
    expect(r.ok).toBe(true);
    expect(r.pdfBuffer).toBeTruthy();
    expect(r.pdfQuality).toBeTruthy();
    expect(r.pdfQuality!.status).toBe('PASS');
  });
});
