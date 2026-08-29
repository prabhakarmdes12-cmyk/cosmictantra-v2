import { test, expect } from '@playwright/test';
import { createKundli, getKundliById, listAllKundlis } from '../src/lib/jyotish/kundliStore';

test.describe('TRUST-02: Living Kundli Object & Persistent Workspace Specification', () => {

  test('1. Preset Kundli Resolution & Reproducibility', () => {
    // 1. Verify Gandhi preset
    const gandhi = getKundliById('gandhi-1869');
    expect(gandhi).toBeDefined();
    expect(gandhi!.personName).toBe('Mahatma Gandhi');
    expect(gandhi!.snapshot.lagna.rashiName).toBe('Tula');
    expect(gandhi!.snapshot.balas).toBeDefined();
    expect(gandhi!.engineVersion).toContain('CosmicTantra Professional Kernel');

    // 2. Verify Vivekananda preset
    const vivekananda = getKundliById('vivekananda-1863');
    expect(vivekananda).toBeDefined();
    expect(vivekananda!.personName).toBe('Swami Vivekananda');
    expect(vivekananda!.snapshot.lagna.rashiName).toBe('Dhanu');

    // 3. Verify Einstein preset
    const einstein = getKundliById('einstein-1879');
    expect(einstein).toBeDefined();
    expect(einstein!.personName).toBe('Albert Einstein');
    expect(einstein!.snapshot.lagna.rashiName).toBe('Mithuna');
  });

  test('2. Kundli Creation, Unique ID Generation & Invariant TRUST_001 (Reproducibility)', () => {
    const record = createKundli(
      'Devavrat Sharma',
      {
        birthDate: '1998-11-20',
        birthTime: '14:45',
        latitude: 25.3176,
        longitude: 82.9739,
        timezone: 5.5,
        locationName: 'Varanasi, UP, India'
      },
      'EXACT',
      'MALE',
      'Research subject for career dasha analysis'
    );

    expect(record.id).toContain('devavrat-sharma');
    expect(record.timeConfidence).toBe('EXACT');
    expect(record.snapshot.lagna).toBeDefined();

    // Re-retrieve from store by ID
    const retrieved = getKundliById(record.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(record.id);
    expect(retrieved!.snapshot.lagna.longitude).toBe(record.snapshot.lagna.longitude);
    expect(retrieved!.snapshot.lagna.degreeStr).toBe(record.snapshot.lagna.degreeStr);
    expect(retrieved!.snapshot.dasha.startingBalance).toBe(record.snapshot.dasha.startingBalance);
  });

  test('3. Full List Operation & Metadata Stamping', () => {
    const list = listAllKundlis();
    expect(list.length).toBeGreaterThanOrEqual(3);
    for (const item of list) {
      expect(item.id).toBeDefined();
      expect(item.personName).toBeDefined();
      expect(item.snapshot.meta.engineVersion).toBeDefined();
      expect(item.snapshot.meta.ayanamshaName).toBeDefined();
    }
  });
});
