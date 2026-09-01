/**
 * KUNDLI V41 — §4 numeral policy and §31 simplification metrics.
 *
 * §31 asks for old-vs-new numbers rather than an assertion that things feel
 * better. The measurements here run against generated artifacts, so they
 * cannot drift away from what is actually printed.
 *
 * The pre-V41 baselines are recorded in `forensic/v41-audit.md`, measured the
 * same way against the same golden fixture.
 */

import { test, expect } from '@playwright/test';
import { generateKundliV41Pdf } from '../../src/lib/kundli/v40/pipelineV3';
import {
  numeral, numeralPolicyFor, toDevanagariDigits, toAsciiDigits, findMixedNumerals,
} from '../../src/lib/kundli/v40/numerals';
import { signLabel } from '../../src/lib/kundli/chartModel';
import { GOLDEN_BIRTH_INPUT } from './goldenCanonical';
import { inspectPdf } from './qa/pdfInspect';

test.describe.configure({ mode: 'parallel' });

/** Measured before V41 against this same fixture. See forensic/v41-audit.md. */
const V40_BASELINE = {
  partAEvidenceIds: 2,
  partAVersionEnums: 7,
  yogaProofPages: 1,
  hindiPartADevanagariNumerals: 36,
  hindiPartAAsciiNumerals: 1162,
};

test.describe('§4 — numeral policy', () => {
  test('NUM-01: the 1-9 / 10-12 cliff is gone', () => {
    // The original defect, stated as a test: an array of ten digits indexed
    // by a number that reaches twelve.
    const hi = Array.from({ length: 12 }, (_, i) => signLabel(i + 1, 'HI'));
    expect(hi).toEqual(['१','२','३','४','५','६','७','८','९','१०','११','१२']);
    expect(findMixedNumerals(hi.join(' ')), 'no chart may mix numeral scripts').toBeNull();
  });

  test('NUM-02: English and bilingual charts use Western digits', () => {
    for (const mode of ['EN', 'BILINGUAL'] as const) {
      const labels = Array.from({ length: 12 }, (_, i) => signLabel(i + 1, mode));
      expect(labels).toEqual(['1','2','3','4','5','6','7','8','9','10','11','12']);
      expect(findMixedNumerals(labels.join(' '))).toBeNull();
    }
  });

  test('NUM-03: the policy is one switch, driven by locale', () => {
    expect(numeralPolicyFor('hi')).toEqual({ devanagariNumerals: true });
    expect(numeralPolicyFor('hi-en')).toEqual({ devanagariNumerals: false });
    expect(numeralPolicyFor('en')).toEqual({ devanagariNumerals: false });
  });

  test('NUM-04: conversion is multi-digit and round-trips', () => {
    expect(toDevanagariDigits('120 of 12')).toBe('१२० of १२');
    expect(toAsciiDigits('१२० of १२')).toBe('120 of 12');
    expect(toAsciiDigits(toDevanagariDigits('2035-06-19'))).toBe('2035-06-19');
    expect(numeral(12, { devanagariNumerals: true })).toBe('१२');
  });

  test('NUM-05: mixing is detected and named, not silently repaired', () => {
    // There is intentionally no auto-repair helper. A normaliser would make a
    // broken call site render correctly and the bug would outlive the release.
    const found = findMixedNumerals('१ २ ३ 10 11 12');
    expect(found).not.toBeNull();
    expect(found!.devanagari.sort()).toEqual(['१', '२', '३']);
    expect(found!.ascii.sort()).toEqual(['0', '1', '2']);
    // Single-script strings are clean in either script.
    expect(findMixedNumerals('१ २ ३ १० ११ १२')).toBeNull();
    expect(findMixedNumerals('1 2 3 10 11 12')).toBeNull();
  });

  test('NUM-06: no line in a rendered chart page mixes numeral scripts', async () => {
    const r = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { locale: 'hi', mode: 'PANDIT' });
    const doc = await inspectPdf(r.pdfBuffer!);

    // Line-level rather than page-level: a page may legitimately carry a
    // Western report ID beside a Devanagari chart. What must never happen is
    // one row of numbers in two scripts.
    const offenders: string[] = [];
    for (const page of doc.pages) {
      for (const line of page.lines) {
        if (findMixedNumerals(line.text)) offenders.push(`p${page.number}: ${line.text}`);
      }
    }
    expect(offenders.slice(0, 8), 'lines mixing १२३ and 123').toEqual([]);
  });
});

test.describe('§31 — simplification metrics', () => {
  test('SIMP-01: zero evidence IDs in Part A', async () => {
    const r = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { mode: 'PANDIT' });
    const text = (await inspectPdf(r.pdfBuffer!)).allText;

    // Evidence ID grammar: FACT paths and EV-nn references.
    const found = text.match(/\bFACT\.[A-Za-z0-9_.]+|\bEV-\d{2,}\b/g) ?? [];
    expect(found.slice(0, 10), `baseline was ${V40_BASELINE.partAEvidenceIds}`).toEqual([]);
  });

  test('SIMP-02: zero version strings or raw enums in Part A', async () => {
    const r = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { mode: 'PANDIT' });
    const doc = await inspectPdf(r.pdfBuffer!);

    const offenders: string[] = [];
    for (const page of doc.pages) {
      for (const line of page.lines) {
        // `foo-bar-v1` style version identifiers.
        if (/\b[a-z][a-z0-9]*(-[a-z0-9]+)+-v\d+\b/.test(line.text)) offenders.push(line.text);
        // SCREAMING_SNAKE_CASE machine enums, three segments or more so that
        // legitimate short caps ("PART A", "NOT CALCULATED") survive.
        if (/\b[A-Z][A-Z0-9]{2,}(_[A-Z0-9]+){2,}\b/.test(line.text)) offenders.push(line.text);
      }
    }
    expect(offenders.slice(0, 10), `baseline was ${V40_BASELINE.partAVersionEnums}`).toEqual([]);
  });

  test('SIMP-03: no content hashes in Part A', async () => {
    const r = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { mode: 'PANDIT' });
    const text = (await inspectPdf(r.pdfBuffer!)).allText;
    expect(text.match(/\b[0-9a-f]{16,}\b/g) ?? []).toEqual([]);
  });

  test('SIMP-04: at most one Yoga technical proof page in Part A', async () => {
    const r = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { mode: 'PANDIT' });
    const yogaPages = (r.pageTitles ?? []).filter((t) => /yoga/i.test(t)).length;
    expect(yogaPages).toBeLessThanOrEqual(1);
  });

  test('SIMP-05: Lagna, Moon sign and Nakshatra are all on one early page', async () => {
    // The "find it in five seconds" targets are not directly measurable in
    // CI. What IS measurable is the precondition: the reader must not have to
    // cross pages. All three must appear together, early.
    const r = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { mode: 'PANDIT' });
    const doc = await inspectPdf(r.pdfBuffer!);

    const idx = doc.pages.findIndex((p) =>
      /lagna|लग्न/i.test(p.text) && /moon|चन्द्र/i.test(p.text) && /nakshatra|नक्षत्र/i.test(p.text));
    expect(idx, 'Lagna + Moon + Nakshatra never co-occur on a page').toBeGreaterThanOrEqual(0);
    expect(idx + 1, 'must be reachable without hunting').toBeLessThanOrEqual(4);
  });

  test('SIMP-06: the current Dasha is on one early page with its dates', async () => {
    const r = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { mode: 'PANDIT' });
    const doc = await inspectPdf(r.pdfBuffer!);

    const idx = doc.pages.findIndex((p) =>
      /rahu/i.test(p.text) && /mercury/i.test(p.text) && /2035/.test(p.text));
    expect(idx, 'current MD/AD with year ranges not found').toBeGreaterThanOrEqual(0);
    expect(idx + 1).toBeLessThanOrEqual(4);
  });

  test('SIMP-07: the 10th lord and its location are stated, not left to be derived', async () => {
    const r = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { mode: 'PANDIT' });
    const text = (await inspectPdf(r.pdfBuffer!)).allText;
    // Leo lagna -> 10th house Taurus -> lord Venus, which sits in house 10.
    expect(text).toMatch(/Venus/);
    expect(text, 'the 10th-lord relationship must be printed').toMatch(/10th|Dasham|दशम/i);
  });

  test('SIMP-08: the Client edition carries no practitioner worksheets', async () => {
    const r = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { mode: 'CLIENT' });
    const ids = r.report!.sections.map((s) => s.id);
    for (const id of ['graha-dossier', 'bhava-matrix', 'pandit-notes', 'pandit-discussion-points']) {
      expect(ids, `${id} must not reach a client`).not.toContain(id);
    }
    // and every omission is explained rather than silently dropped
    for (const id of r.modeApplication!.droppedSectionIds) {
      expect(r.modeApplication!.rationale[id] ?? '', `${id} needs a rationale`).not.toBe('');
    }
  });
});
