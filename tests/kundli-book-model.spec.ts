import { test, expect } from '@playwright/test';
import { generateKundliBookModel } from '../src/lib/jyotish/kundliBookModel';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';

test.describe('TRUST-03: Multi-Volume Kundli Book Model Specification', () => {

  test('Generate Complete Vedic Kundli Multi-Volume Book Model', () => {
    const snapshot = getCanonicalJyotishSnapshot({
      birthDate: '1869-10-02',
      birthTime: '07:11',
      latitude: 21.6417,
      longitude: 69.6293,
      timezone: 4.6419,
      locationName: 'Porbandar, Gujarat, India'
    });

    const book = generateKundliBookModel('Mahatma Gandhi', snapshot, 'COMPLETE_VEDIC_KUNDLI');

    expect(book).toBeDefined();
    expect(book.personName).toBe('Mahatma Gandhi');
    expect(book.variant).toBe('COMPLETE_VEDIC_KUNDLI');
    expect(book.volumes.length).toBeGreaterThanOrEqual(8);

    // Verify Volume I: Birth Foundation
    const vol1 = book.volumes.find(v => v.volumeNumber === 'I');
    expect(vol1).toBeDefined();
    expect(vol1!.sections.some(s => s.id === 'birth_context')).toBe(true);
    expect(vol1!.sections.some(s => s.id === 'birth_panchang')).toBe(true);

    // Verify Volume V: Shodashavarga
    const vol5 = book.volumes.find(v => v.volumeNumber === 'V');
    expect(vol5).toBeDefined();
    expect(vol5!.sections[0].data.shodashavarga).toBeDefined();

    // Verify Volume VI: Shadbala
    const vol6 = book.volumes.find(v => v.volumeNumber === 'VI');
    expect(vol6).toBeDefined();
    expect(vol6!.sections[0].data.shadbala).toBeDefined();
  });
});
