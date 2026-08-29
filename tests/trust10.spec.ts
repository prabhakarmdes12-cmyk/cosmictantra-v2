import { test, expect } from '@playwright/test';
import { professionalChart } from '../src/lib/pro/index.js';
import { buildBook } from '../src/lib/pro/bookModel.js';
import { buildMobileView, MOBILE_MODE } from '../src/lib/pro/mobileView.js';
import { AYANAMSHA } from '../src/lib/pro/conventions.js';
import { corpusStats } from '../src/lib/pro/goldenCorpus.js';
import { computeRegistryStats } from '../src/lib/pro/capabilityRegistry.js';
import { containsBannedProse } from '../src/lib/pro/interpret.js';
import { bookToHTML } from '../src/lib/pro/renderers.js';

const BP = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' };
const pro = () => professionalChart(BP);

/**
 * TRUST-10 — adversarial persona journeys (A..E). Each persona's core path must
 * work and stay honest.
 */

test.describe('TRUST-10 — Persona A: first-timer', () => {
  test('gets a clear chart + digestible mobile cards + a grounded answer', () => {
    const p = pro();
    expect(p.kundali.lagna.rashiEn).toBe('Leo');
    const mv = buildMobileView(p, MOBILE_MODE.CONSUMER);
    expect(mv.cards.length).toBeLessThanOrEqual(6);
    expect(p.ask('career').status).toBe('OK');
  });
});

test.describe('TRUST-10 — Persona B: AstroSage user (convention diff)', () => {
  test('sees an expected, labelled convention difference (Lahiri vs Raman)', () => {
    const lahiri = pro().kundali.lagna.longitude;
    const raman = professionalChart(BP, { conventions: { ayanamsha: AYANAMSHA.RAMAN } }).kundali.lagna.longitude;
    expect(Math.abs((raman - lahiri) - 1.1067)).toBeLessThan(0.05); // documented offset
  });
});

test.describe('TRUST-10 — Persona C: practising Pandit', () => {
  test('gets a dense technical book with evidence ledger, no filler', () => {
    const book = buildBook('PANDIT_TECHNICAL_BOOK', { pro: pro(), meta: { name: 'x' } });
    expect(book.sections.length).toBeGreaterThan(8);
    const html = bookToHTML(book).toLowerCase();
    expect(containsBannedProse(html)).toBe(false);
    // provenance present for professional trust
    expect(book.provenance.versions.engineVersion).toBeTruthy();
  });
});

test.describe('TRUST-10 — Persona D: sceptical engineer', () => {
  test('finds zero contradictions and an HONEST qualification posture', () => {
    expect(pro().checkContradictions().violations).toHaveLength(0);
    // No capability is falsely QUALIFIED; no external refs are faked.
    const reg = computeRegistryStats();
    expect(reg.qualified).toBe(0);
    expect(corpusStats().slotsWithExternalReference).toBe(0);
  });
});

test.describe('TRUST-10 — Persona E: returning user', () => {
  test('sees the correct running dasha for the current period', () => {
    const active = pro().timelineActiveOn('2026-08-30');
    expect(active.mahadasha.lord).toBe('Rahu');
    expect(active.antardasha).toBeTruthy();
  });
});
