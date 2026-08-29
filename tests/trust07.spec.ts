import { test, expect } from '@playwright/test';
import { professionalChart } from '../src/lib/pro/index.js';
import { buildMobileView, MOBILE_MODE } from '../src/lib/pro/mobileView.js';

/**
 * TRUST-07 — Mobile professionalism.
 * A purpose-built mobile view-model (consumer cards + pandit companion),
 * verified structurally (browser layout is checked by the responsive suite when
 * a Chromium binary is available — it is network-blocked in this sandbox).
 */

const BP = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' };
const pro = () => professionalChart(BP);

test.describe('TRUST-07 — Mobile view-model (not a shrunk desktop)', () => {
  test('consumer mode is a short stack of digestible cards with drill-down', () => {
    const v = buildMobileView(pro(), MOBILE_MODE.CONSUMER, { now: '2026-08-30' });
    expect(v.mode).toBe(MOBILE_MODE.CONSUMER);
    expect(v.cards.length).toBeLessThanOrEqual(6); // few, digestible
    expect(v.cards.length).toBeGreaterThan(0);
    // identity + today cards present
    const ids = v.cards.map((c: any) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['identity', 'today', 'highlights']));
    // every item cites a source & offers a drill-down target
    for (const card of v.cards) {
      for (const item of (card.items || [])) expect(item.source).toBeTruthy();
    }
    expect(v.drillTargets.length).toBeGreaterThan(0);
  });

  test('consumer today card reflects the running dasha (calculated, not generic)', () => {
    const v = buildMobileView(pro(), MOBILE_MODE.CONSUMER, { now: '2026-08-30' });
    const today: any = v.cards.find((c: any) => c.id === "today");
    const maha = today.items.find((i: any) => i.label === 'Mahadasha');
    expect(maha.value).toBe('Rahu'); // deterministic for this chart in 2026
  });

  test('pandit companion mode is dense technical reference (tables)', () => {
    const v = buildMobileView(pro(), MOBILE_MODE.PANDIT);
    expect(v.mode).toBe(MOBILE_MODE.PANDIT);
    const grahas: any = v.cards.find((c: any) => c.id === "grahas");
    expect(grahas.kind).toBe('table');
    expect(grahas.rows.length).toBe(9); // all nine grahas
    const bhavas: any = v.cards.find((c: any) => c.id === "bhavas");
    expect(bhavas.rows.length).toBe(12);
  });

  test('every mobile view carries provenance (versions)', () => {
    const v = buildMobileView(pro());
    expect(v.provenance.versions.engineVersion).toBeTruthy();
  });
});
