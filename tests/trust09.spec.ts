import { test, expect } from '@playwright/test';
import { buildTrustCenter } from '../src/lib/pro/trustCenter.js';
import { track, sanitizeEvent, recentEvents, _clearAnalytics } from '../src/lib/proAnalytics.js';
import { t, rashiLabel, LANGS } from '../src/lib/i18n.js';
import { chartAltTable } from '../src/lib/pro/a11y.js';
import { professionalChart } from '../src/lib/pro/index.js';

const BP = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' };

test.describe('TRUST-09 — Trust Center', () => {
  test('aggregates engine health, honest qualification & invariants', () => {
    const tc = buildTrustCenter();
    expect(tc.engine.healthy).toBe(true);
    expect(tc.engine.checks.length).toBe(2);
    expect(tc.invariants.contradictionsAcrossAnchors).toBe(0);
    expect(tc.reportConsistency.ok).toBe(true);
    // honesty: external qualification is not claimed
    expect(tc.qualification.externalQualification.status).toContain('NO EXTERNAL REFERENCES');
    expect(tc.verdictInputs.hasExternalQualification).toBe(false);
    expect(tc.versions.engineVersion).toBeTruthy();
  });
});

test.describe('TRUST-09 — Analytics (no PII)', () => {
  test.beforeEach(() => _clearAnalytics());

  test('sanitize strips PII and non-whitelisted fields', () => {
    const clean: any = sanitizeEvent('kundli_open', {
      section: 'Overview', name: 'Ravi', birthDate: '1995-06-15', latitude: 25.5, question: 'when will I marry?', count: 3,
    });
    expect(clean.event).toBe('kundli_open');
    expect(clean.section).toBe('Overview');
    expect(clean.count).toBe(3);
    // PII must be gone
    expect(clean.name).toBeUndefined();
    expect(clean.birthDate).toBeUndefined();
    expect(clean.latitude).toBeUndefined();
    expect(clean.question).toBeUndefined();
  });

  test('track records only sanitized events', () => {
    track('report_generate', { variant: 'PERSONAL_KUNDLI', name: 'Secret', ok: true });
    const [e]: any = recentEvents(1);
    expect(e.variant).toBe('PERSONAL_KUNDLI');
    expect(e.ok).toBe(true);
    expect(e.name).toBeUndefined();
  });
});

test.describe('TRUST-09 — i18n (en/hi, Sanskrit canonical)', () => {
  test('translates UI strings and rashi labels; data keys stay Sanskrit', () => {
    expect(LANGS).toEqual(expect.arrayContaining(['en', 'hi']));
    expect(t('en', 'nav.myKundlis')).toBe('My Kundlis');
    expect(t('hi', 'nav.myKundlis')).toBe('मेरी कुंडलियाँ');
    // canonical Sanskrit key → display label per language
    expect(rashiLabel('en', 'Simha')).toBe('Leo');
    expect(rashiLabel('hi', 'Simha')).toBe('सिंह');
    // unknown lang falls back to en
    expect(t('fr' as any, 'nav.myKundlis')).toBe('My Kundlis');
  });
});

test.describe('TRUST-09 — Accessibility (chart alt-table)', () => {
  test('a chart produces an equivalent alt-table + text summary', () => {
    const pro = professionalChart(BP);
    const alt = chartAltTable(pro.varga('D1'), 'Rashi (D1)');
    expect(alt.columns).toEqual(['Planet', 'Sign', 'House', 'Motion']);
    expect(alt.rows.length).toBeGreaterThanOrEqual(9);
    expect(alt.summary).toContain('Rashi (D1)');
    expect(alt.summary.length).toBeGreaterThan(20);
  });
});
