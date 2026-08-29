import { test, expect } from '@playwright/test';
import { getKundliById } from '../src/lib/jyotish/kundliStore';

test.describe('TRUST-04: Professional Workbench 2.0 & Cross-Calculation Connected Inspector', () => {

  test('1. Multi-Chart Cross-Division Support (D1, D9, D10, D60)', () => {
    const gandhi = getKundliById('gandhi-1869');
    expect(gandhi).toBeDefined();

    const snapshot = gandhi!.snapshot;
    expect(snapshot.vargas.shodashavarga).toBeDefined();

    // Verify D1, D9, D10, D60 charts exist simultaneously
    expect(snapshot.vargas.shodashavarga![1]).toBeDefined();
    expect(snapshot.vargas.shodashavarga![9]).toBeDefined();
    expect(snapshot.vargas.shodashavarga![10]).toBeDefined();
    expect(snapshot.vargas.shodashavarga![60]).toBeDefined();

    // Verify D10 Dashamsha Career chart structure
    const d10 = snapshot.vargas.shodashavarga![10];
    expect(d10.division).toBe(10);
    expect(d10.name).toBe('Dashamsha');
    expect(d10.significance).toContain('Career, Profession');
  });

  test('2. Connected Graha Inspector: Saturn Cross-Calculation Linkages', () => {
    const gandhi = getKundliById('gandhi-1869');
    const snapshot = gandhi!.snapshot;

    // 1. Saturn in D1
    const saturnD1 = (snapshot.planets as any[]).find((p: any) => p.name === 'Saturn');
    expect(saturnD1).toBeDefined();
    expect(saturnD1.house).toBe(2); // 2nd house (Scorpio)

    // 2. Saturn in D9
    const saturnD9 = snapshot.vargas.shodashavarga![9].planets['Saturn'];
    expect(saturnD9).toBeDefined();
    expect(saturnD9.vargaRashiName).toBe('Makara');

    // 3. Saturn Shadbala
    const saturnShadbala = snapshot.balas!.shadbala['Saturn'];
    expect(saturnShadbala).toBeDefined();
    expect(saturnShadbala.totalRupas).toBeGreaterThan(5.0);

    // 4. Saturn Vimshopaka
    const saturnVimshopaka = snapshot.balas!.vimshopaka['Saturn'];
    expect(saturnVimshopaka).toBeDefined();
    expect(saturnVimshopaka.shodashavarga).toBeGreaterThan(5.0);
  });
});
