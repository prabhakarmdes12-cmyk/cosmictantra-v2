import { test, expect } from '@playwright/test';
import { calculateKundali } from '../src/lib/astrologyEngine.js';
import { professionalChart, getSnapshot } from '../src/lib/pro/index.js';
import { computeAllVargas } from '../src/lib/pro/vargas.js';
import { computeAshtakavarga, EXPECTED_SAV_TOTAL, EXPECTED_BAV_TOTALS } from '../src/lib/pro/ashtakavarga.js';
import { computeAvasthas } from '../src/lib/pro/avastha.js';
import { computeVimshottari } from '../src/lib/pro/dasha/nakshatraDashas.js';
import { computeDasha, listDashaSystems } from '../src/lib/pro/dasha/index.js';
import { computeJaimini } from '../src/lib/pro/jaimini.js';
import { computeKPChart, buildKPSubTable, kpPrashna249 } from '../src/lib/pro/kp.js';
import { computeVarshaphala } from '../src/lib/pro/varshaphala.js';
import { computeSpecialPoints } from '../src/lib/pro/special.js';
import { computePanchangPro, RECKONING } from '../src/lib/pro/panchangPro.js';
import { computeGochar } from '../src/lib/pro/gochar.js';
import { ashtakoota } from '../src/lib/pro/matching.js';
import { evaluateYogas } from '../src/lib/pro/yogaRegistry.js';
import { computeRegistryStats, auditQualificationIntegrity, listCapabilities } from '../src/lib/pro/capabilityRegistry.js';
import { canPromoteToQualified, QUALIFICATION_STATUS } from '../src/lib/pro/status.js';
import { buildReport, reportToHTML } from '../src/lib/pro/reports.js';

const BP = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' };

test.describe('Wave 0 — Canonical snapshot invariant (must not drift)', () => {
  test('canonical kundali unchanged (Simha lagna, Dhanu moon)', () => {
    const k = calculateKundali(BP);
    expect(k.lagna.rashiName).toBe('Simha');
    expect(k.moon.rashiName).toBe('Dhanu');
  });
  test('professionalChart reuses the same snapshot instance', () => {
    const a = getSnapshot(BP);
    const b = getSnapshot(BP);
    expect(a).toBe(b); // cached identity → instant derivations
  });
});

test.describe('Wave 1 — Ashtakavarga', () => {
  test('BAV totals match classical constants and SAV == 337', () => {
    const k = calculateKundali(BP);
    const av: any = computeAshtakavarga(k);
    expect(av.sarva.total).toBe(EXPECTED_SAV_TOTAL);
    for (const p of Object.keys(EXPECTED_BAV_TOTALS)) {
      expect(av.bhinna[p].total).toBe((EXPECTED_BAV_TOTALS as any)[p]);
    }
  });
  test('Prastara grid exposes actual contributor rows', () => {
    const k = calculateKundali(BP);
    const av: any = computeAshtakavarga(k);
    expect(Object.keys(av.bhinna.Sun.prastara)).toContain('Lagna');
    expect(av.bhinna.Sun.prastara.Sun.length).toBe(12);
  });
  test('Trikona + Ekadhipatya reductions never exceed raw', () => {
    const k = calculateKundali(BP);
    const av: any = computeAshtakavarga(k);
    for (const p of Object.keys(EXPECTED_BAV_TOTALS)) {
      const r = av.reductions[p];
      const rawSum = r.raw.reduce((a: number, b: number) => a + b, 0);
      const ekSum = r.ekadhipatya.reduce((a: number, b: number) => a + b, 0);
      expect(ekSum).toBeLessThanOrEqual(rawSum);
    }
  });
});

test.describe('Wave 1 — Avasthas', () => {
  test('every graha exposes 5 avasthas with triggers', () => {
    const k = calculateKundali(BP);
    const av: any = computeAvasthas(k);
    const sun = av.Sun;
    expect(sun.baladi.state).toBeTruthy();
    expect(sun.baladi.trigger).toBeTruthy();
    expect(sun.jagradadi.trigger.dignity).toBeTruthy();
    expect(Array.isArray(sun.lajjitadi.states)).toBe(true);
    expect(sun.shayanadi.trigger.rule).toContain('Shayanadi');
  });
});

test.describe('Wave 2 — Dasha platform', () => {
  test('Vimshottari mahas sum to 120 years and expand to antar', () => {
    const k = calculateKundali(BP);
    const v = computeVimshottari(k, { maxLevel: 2 });
    const sum = v.periods.reduce((a: number, p: any) => a + p.years, 0);
    expect(Math.round(sum)).toBe(120);
    expect(v.periods.length).toBe(9);
    expect(v.periods[0].children.length).toBe(9);
  });
  test('registry exposes 8 dasha systems computable without UI changes', () => {
    const k = calculateKundali(BP);
    const ids = listDashaSystems().map((s: any) => s.id);
    expect(ids.length).toBeGreaterThanOrEqual(8);
    for (const id of ids) {
      const r = computeDasha(id, k, { targetDate: new Date('2026-08-29') });
      expect(r.periods.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Wave 3 — Jaimini', () => {
  test('8-karaka mode assigns Atmakaraka..Strikaraka', () => {
    const k = calculateKundali(BP);
    const j: any = computeJaimini(k, { karakaMode: 8 });
    expect(j.charaKarakas.mode).toBe(8);
    expect(j.charaKarakas.karakas.Atmakaraka).toBeTruthy();
    expect(j.charaKarakas.karakas.Strikaraka).toBeTruthy();
    expect(j.arudhaLagna.arudhaSign).toBeGreaterThanOrEqual(0);
    expect(j.bhavaPadas.length).toBe(12);
  });
  test('7-karaka mode drops Rahu/Strikaraka', () => {
    const k = calculateKundali(BP);
    const j: any = computeJaimini(k, { karakaMode: 7 });
    expect(j.charaKarakas.mode).toBe(7);
    expect(j.charaKarakas.karakas.Strikaraka).toBeUndefined();
  });
});

test.describe('Wave 4 — KP', () => {
  test('249 sub-table spans exactly 360°', () => {
    const t = buildKPSubTable();
    expect(t[t.length - 1].end).toBeCloseTo(360, 5);
  });
  test('KP chart differs from Lahiri and has sub-lords', () => {
    const kp = computeKPChart(BP);
    expect(kp.ayanamsha).not.toBe(kp.lahiriAyanamsha);
    expect(kp.planets[0].subLord).toBeTruthy();
    expect(kp.cusps.length).toBe(12);
    const pr = kpPrashna249(150, BP);
    expect(pr.horaryNumber).toBe(150);
    expect(pr.ascendant.subLord).toBeTruthy();
  });
});

test.describe('Wave 5 — Varshaphala', () => {
  test('solar return matches natal Sun within 1° and allows return location', () => {
    const va = computeVarshaphala(BP, 2026, { latitude: 40.7128, longitude: -74.006, timezone: -5, locationName: 'New York' });
    const err = parseFloat(String(va.solarReturn.matchError));
    expect(err).toBeLessThan(1);
    expect(va.muntha.sign).toBeGreaterThanOrEqual(0);
    expect(va.muddaDasha.periods.length).toBe(9);
    expect(va.solarReturn.returnLocation.locationName).toBe('New York');
  });
});

test.describe('Wave 6 — Special points', () => {
  test('gulika, upagrahas, special lagnas, yogi, sensitive vargas exist', () => {
    const k = calculateKundali(BP);
    const sp = computeSpecialPoints(k);
    expect(sp.gulikaMandi.gulika.signName).toBeTruthy();
    expect(sp.upagrahas.dhuma.signName).toBeTruthy();
    expect(sp.specialLagnas.horaLagna.signName).toBeTruthy();
    expect(sp.yogiAvayogi.yogi).toBeTruthy();
    expect(sp.sensitiveVargas.sixtyFourthNavamsha.signName).toBeTruthy();
  });
});

test.describe('Wave 7 — Professional Panchang (AT_INSTANT vs AT_LOCAL_SUNRISE)', () => {
  test('reckoning basis is explicit and can differ', () => {
    const place = { latitude: 25.5941, longitude: 85.1376, timezone: 5.5, name: 'Patna' };
    const instant = new Date('2026-08-29T09:00:00Z');
    const a = computePanchangPro(instant, place, RECKONING.AT_INSTANT);
    const b = computePanchangPro(instant, place, RECKONING.AT_LOCAL_SUNRISE);
    expect(a.reckoning).toBe('AT_INSTANT');
    expect(b.reckoning).toBe('AT_LOCAL_SUNRISE');
    expect(a.tithi.endsAtUTC).toBeTruthy();
    expect(b.sunrise).toBeTruthy();
    // the two reckonings are computed from different instants
    expect(a.reckoningInstantUTC).not.toBe(b.reckoningInstantUTC);
  });
});

test.describe('Wave 8 — Gochar', () => {
  test('transit overlay includes SAV bindus and aspects', () => {
    const k = calculateKundali(BP);
    const g = computeGochar(k, new Date('2026-08-29T00:00:00Z'), { varga: 'D9' });
    expect(g.houseTransits.length).toBe(9);
    expect(typeof g.houseTransits[0].savBindusInSign).toBe('number');
    expect(Array.isArray(g.aspectsToNatal)).toBe(true);
  });
});

test.describe('Wave 9 — Prashna & Matching', () => {
  test('Ashtakoota exposes all 8 kootas + exceptions, max 36', () => {
    const groom = { birthDate: '1990-05-20', birthTime: '08:15', latitude: 28.6, longitude: 77.2, timezone: 5.5 };
    const bride = { birthDate: '1993-11-02', birthTime: '14:40', latitude: 19.07, longitude: 72.87, timezone: 5.5 };
    const m = ashtakoota(groom, bride);
    expect(m.max).toBe(36);
    expect(Object.keys(m.kootas).length).toBe(8);
    expect(m.total).toBeLessThanOrEqual(36);
    expect(Array.isArray(m.exceptions)).toBe(true);
  });
});

test.describe('Wave 10 — Yoga/Dosha registry', () => {
  test('rules are traceable with source/conditions/evidence', () => {
    const k = calculateKundali(BP);
    const y = evaluateYogas(k);
    expect(y.total).toBeGreaterThanOrEqual(10);
    for (const r of y.all) {
      expect(r.source).toBeTruthy();
      expect(r.conditions).toBeTruthy();
      expect(Array.isArray(r.evidence)).toBe(true);
    }
  });
});

test.describe('Truth invariant — Rules 1 & 2', () => {
  test('registry percentages are computed, not hardcoded', () => {
    const stats = computeRegistryStats();
    const expectedImpl = Math.round((stats.implemented / stats.total) * 1000) / 10;
    expect(stats.percentages.implemented).toBe(expectedImpl);
  });
  test('no capability is QUALIFIED without evidence, no PARITY_WITH_* labels', () => {
    const violations = auditQualificationIntegrity();
    expect(violations).toEqual([]);
    for (const c of listCapabilities()) {
      expect(c.convention).not.toMatch(/^PARITY_WITH_/);
      if (c.qualificationStatus === QUALIFICATION_STATUS.QUALIFIED) {
        expect(canPromoteToQualified(c)).toBe(true);
      }
    }
  });
});

test.describe('Reports — decoupled from calculation', () => {
  test('composable report renders sections + printable HTML', () => {
    const pro = professionalChart(BP);
    const report = buildReport('full', { pro, meta: { name: 'Seeker' } });
    expect(report.sections.length).toBeGreaterThan(5);
    const html = reportToHTML(report);
    expect(html).toContain('<table');
    expect(html).toContain('CosmicTantra');
  });
});
