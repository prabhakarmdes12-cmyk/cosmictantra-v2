/**
 * §3 — HINDI_LOCALIZATION_COMPLETENESS.
 *
 * §2 promises that a `hi` Kundli is Hindi all the way through, not English
 * content wearing translated labels. This suite is what keeps that promise
 * after everyone stops looking at screenshots.
 *
 * It is a RATCHET, not a pass/fail on zero. Part A still contains sentences
 * the derivation layer assembles at runtime, which a source-string dictionary
 * cannot reach. Demanding zero today would mean deleting the gate tomorrow.
 * Instead `HINDI_BUDGET` records the measured ceiling: it may fall, never
 * rise, and any change that pushes it up has to argue with this file.
 */
import { test, expect } from '@playwright/test';
import { generateKundliV41Pdf } from '../../src/lib/kundli/v40/pipelineV3';
import {
  auditHindiCompleteness, HINDI_BUDGET, HINDI_CLEAN_FLOOR, HINDI_COMPLETENESS_GATE,
} from '../../src/lib/kundli/v40/hindiCompleteness';
import { PROSE_COVERAGE, trProse } from '../../src/lib/kundli/v40/prosePassages';
import { tr } from '../../src/lib/kundli/v40/structuralTerms';
import type { ReportMode } from '../../src/lib/kundli/v40/reportModes';
import { GOLDEN_BIRTH_INPUT } from './goldenCanonical';

test.describe.configure({ mode: 'parallel' });

const MODES: ReportMode[] = ['CLIENT', 'PANDIT', 'SCHOLAR'];

async function auditFor(mode: ReportMode, locale: 'en' | 'hi' | 'hi-en') {
  const result = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { locale, mode, skipPdf: true });
  expect(result.report, `${mode}/${locale} must produce a model`).toBeTruthy();
  return auditHindiCompleteness(result.report!, locale, HINDI_BUDGET[mode]);
}

test.describe(HINDI_COMPLETENESS_GATE, () => {
  for (const mode of MODES) {
    test(`HLC-01 ${mode}: Part A English stays within the declared budget`, async () => {
      const audit = await auditFor(mode, 'hi');
      const worst = [...audit.findings]
        .sort((a, b) => b.latinWords - a.latinWords)
        .slice(0, 6)
        .map((f) => `${f.sectionId}/${f.field}: ${f.text.slice(0, 70)}`)
        .join('\n    ');
      expect(
        audit.latinWords,
        `${mode} Part A has ${audit.latinWords} English words (budget ${audit.budget}).\n`
        + `If this went UP, localise the new string instead of raising the budget.\n`
        + `Worst offenders:\n    ${worst}`,
      ).toBeLessThanOrEqual(audit.budget);
    });
  }

  test('HLC-02: the gate actually inspects a real page of content', async () => {
    // A walker that silently stops finding fields would make every other
    // assertion here vacuous.
    const audit = await auditFor('PANDIT', 'hi');
    expect(audit.inspected, 'Part A visible strings inspected').toBeGreaterThan(400);
    expect(audit.clean, 'strings that are fully Hindi').toBeGreaterThan(250);
    expect(
      audit.clean / audit.inspected,
      `only ${audit.clean}/${audit.inspected} Part A strings are fully Hindi`,
    ).toBeGreaterThan(HINDI_CLEAN_FLOOR);
  });

  test('HLC-03: an English report is measured as almost entirely English', async () => {
    // Proves the detector detects. If `en` came back clean, the walker would
    // be looking at nothing.
    const audit = await auditFor('PANDIT', 'en');
    expect(audit.latinWords).toBeGreaterThan(HINDI_BUDGET.PANDIT);
  });

  test('HLC-04: the Hindi report really is more Hindi than the English one', async () => {
    const hi = await auditFor('PANDIT', 'hi');
    const en = await auditFor('PANDIT', 'en');
    // Not a tautology: both walk the same fields of the same sections. The
    // honest statement is about the share of strings that came out clean —
    // measured 73% for hi against 23% for en — rather than a word count,
    // which is dominated by a handful of long generated sentences.
    expect(hi.clean / hi.inspected).toBeGreaterThan(0.70);
    expect(en.clean / en.inspected).toBeLessThan(0.35);
    expect(hi.latinWords).toBeLessThan(en.latinWords);
  });

  test('HLC-05: the chart render model is never mistaken for visible text', async () => {
    // The chart block carries a full render model full of internal enums
    // (NORTH_INDIAN, chart-model-v1, planets.Mars, left/right/hero). None of
    // it is printed, and an earlier probe that stringified blocks drowned in
    // exactly these. If any of them shows up as a finding, the walker has
    // started reading data instead of text.
    const audit = await auditFor('PANDIT', 'hi');
    const leaked = audit.findings.filter((f) => /NORTH_INDIAN|chart-model-v\d|planets\.|^(left|right|hero)$/.test(f.text));
    expect(leaked.map((f) => f.text)).toEqual([]);
  });

  test('HLC-06: appendix identifiers and proper nouns are exempt, not counted', async () => {
    const audit = await auditFor('PANDIT', 'hi');
    expect(audit.exempt, 'exemptions applied').toBeGreaterThan(0);
    // The subject's own name must never be reported as untranslated.
    const nameFlagged = audit.findings.filter((f) => /Priya|Sharma/.test(f.text));
    expect(nameFlagged.map((f) => `${f.sectionId}/${f.field}`)).toEqual([]);
  });

  test('HLC-07: Part B is out of scope — §3 exempts the appendix', async () => {
    const result = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { locale: 'hi', mode: 'SCHOLAR', skipPdf: true });
    const audit = auditHindiCompleteness(result.report!, 'hi', HINDI_BUDGET.SCHOLAR);
    const partBIds = new Set(result.report!.sections.filter((s) => s.part === 'B').map((s) => s.id));
    expect(audit.findings.filter((f) => partBIds.has(f.sectionId))).toEqual([]);
  });

  test('HLC-08: SCHOLAR adds an appendix without adding Part A English', async () => {
    // SCHOLAR is PANDIT plus the appendix. If its Part A count drifts above
    // PANDIT's, density filtering has leaked appendix content into Part A.
    const pandit = await auditFor('PANDIT', 'hi');
    const scholar = await auditFor('SCHOLAR', 'hi');
    expect(scholar.latinWords).toBeLessThanOrEqual(pandit.latinWords);
  });
});

test.describe('the localisation primitives behave', () => {
  test('HLC-09: an unknown string passes through every translator unchanged', () => {
    const odd = 'a string nobody ever added to a dictionary';
    for (const m of ['en', 'hi', 'hi-en'] as const) {
      expect(tr(odd, m)).toBe(odd);
      expect(trProse(odd, m)).toBe(odd);
    }
  });

  test('HLC-10: prose is not doubled in hi-en, but terms are', () => {
    const passage = 'Every value on this page is an input or a declared setting. Nothing here is interpreted.';
    // A whole paragraph printed twice would add pages and be read by nobody.
    expect(trProse(passage, 'hi-en')).toBe(trProse(passage, 'hi'));
    expect(trProse(passage, 'hi-en')).not.toContain('Every value');
    // A term, being two words, earns its gloss.
    expect(tr('Dosha', 'hi-en')).toContain('Dosha');
    expect(tr('Dosha', 'hi-en')).toContain('दोष');
  });

  test('HLC-11: en is never altered by the Hindi machinery', () => {
    const passage = 'Every value on this page is an input or a declared setting. Nothing here is interpreted.';
    expect(trProse(passage, 'en')).toBe(passage);
    expect(tr('Dosha', 'en')).toBe('Dosha');
  });

  test('HLC-12: the generated-sentence boundary is declared, not quietly ignored', () => {
    // These four modules build sentences from chart data at runtime, so a
    // source-string dictionary cannot reach them. Recording that here means
    // the remaining work is visible in the test output rather than looking
    // like an oversight.
    expect(PROSE_COVERAGE.staticAuthored).toBeGreaterThan(25);
    expect(PROSE_COVERAGE.generatedTemplateOwners).toContain('careerSynthesis.ts');
    expect(PROSE_COVERAGE.generatedTemplateOwners).toContain('consultationQuestions.ts');
  });

  test('HLC-13: no disclaimer is softened in translation', async () => {
    // The engine's refusals are load-bearing. A Hindi report that quietly
    // drops "no event is predicted" is a worse document, not a translated one.
    const result = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, { locale: 'hi', mode: 'PANDIT', skipPdf: true });
    const text = JSON.stringify(result.report);
    expect(text, 'the no-prediction promise must survive translation').toContain('भविष्यवाणी नहीं');
    expect(text, 'not-calculated must not become absent').toContain('गणना नहीं');
  });
});
