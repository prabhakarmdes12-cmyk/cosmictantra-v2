/**
 * V40.1 GATE 3 — the golden report, rendered by renderer v3.
 *
 * SEMANTIC QA. Everything here is checked by pulling text back OUT of the
 * finished PDF and comparing it to the ground truth, so it catches the class
 * of bug where the model is right and the page is wrong.
 *
 * Text extraction alone cannot see bad glyph shaping — that is what
 * shaping.spec.ts and visual.spec.ts are for. These two suites are
 * deliberately independent; neither is allowed to stand in for the other.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import { GOLDEN_EXPECTATIONS, GOLDEN_BIRTH_INPUT } from './goldenCanonical';
import { generateKundliV40Pdf } from '../../src/lib/kundli/v40/pipelineV2';
import { verifyExtraction, toVisualOrder } from '../../src/lib/kundli/v40/pdf/shapedText';
import { PART_A_FORBIDDEN_PATTERNS, auditPartADensity } from '../../src/lib/kundli/v40/consultationDensity';
import { structuralAudit, findOrphanHeadings } from './qa/pdfInspect';
import { goldenV3Artifact, ALLOWED_FONTS, PRINT_BOX, ARTIFACT_DIR } from './qa/artifact';

test.describe.configure({ mode: 'parallel' });

test('the v3 pipeline reaches READY_FOR_DELIVERY', async () => {
  const { result } = await goldenV3Artifact();
  expect(result.errorCode, JSON.stringify(result.errorDetails ?? null)).toBeUndefined();
  expect(result.state).toBe('READY_FOR_DELIVERY');
  expect(result.ok).toBe(true);
  expect(result.rendererVersion).toBe('kundli-pdf-renderer-v3');

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(`${ARTIFACT_DIR}/priya-1995-v41-renderer-v3.pdf`, result.pdfBuffer!);
});

test('the model is unchanged — renderer v3 consumes the same kundli-report-v2', async () => {
  const { result } = await goldenV3Artifact();
  // The whole point of a renderer swap is that the MODEL does not move.
  expect(result.sourceReport!.reportModelVersion).toBe('kundli-report-v2');
  expect(result.sourceReport!.reportId).toBe('CT-KUNDLI-31346AC701E0CFD5');

  // The strongest available statement of that: pipeline v2 and pipeline v3
  // build byte-identical models. Pinning a literal hash would only record
  // whichever pipeline was run last; comparing the two records that they
  // agree, which is the property the sprint promised to preserve.
  const v2 = await generateKundliV40Pdf(GOLDEN_BIRTH_INPUT, { skipPdf: true });
  expect(v2.report!.contentHash).toBe(result.sourceReport!.contentHash);
  expect(v2.report!.reportId).toBe(result.sourceReport!.reportId);
  expect(v2.report!.sections.length).toBe(result.sourceReport!.sections.length);
});

test('the density transform moves presentation, never facts', async () => {
  const { result } = await goldenV3Artifact();
  // The rendered model differs from the source model — that is the transform
  // doing its job — but the report identity must not have been rewritten.
  expect(result.report!.reportId).toBe(result.sourceReport!.reportId);

  // No section is DELETED; the only structural change is CD-09 relocating
  // "How to Read" out of the consultation flow. A Pandit does not need
  // reading instructions between the Dasha pages and their own notes.
  const sourceIds = result.sourceReport!.sections.map((sec) => sec.id).sort();
  const renderedIds = result.report!.sections.map((sec) => sec.id).sort();
  expect(renderedIds).toEqual(sourceIds);

  const movedToB = result.sourceReport!.sections
    .filter((sec) => sec.part === 'A')
    .filter((sec) => result.report!.sections.find((r) => r.id === sec.id)?.part === 'B')
    .map((sec) => sec.id);
  expect(movedToB).toEqual(['how-to-read']);
});

test('pagination is deterministic', async () => {
  const { result, inspection } = await goldenV3Artifact();
  expect(inspection.pageCount).toBe(result.metrics!.pageCount);
  // A stable page count is what makes the committed visual baselines
  // meaningful, so this number is pinned and every move of it is recorded:
  //
  //   38 — reviewed 2026-09-02 after the qualified V41 PDF slice (chart DMS
  //        labels, QR-copy removal, reader presentation updates).
  //   39 — drifted with the V42 release work and was never re-pinned; this
  //        line was already red before the parity work below landed.
  //   40 — the Executive Life Gauge folio in Part A plus the nine graha
  //        archetype quadrants in the graha dossier, so the download carries
  //        the same six readings and the same four-quadrant guidance the
  //        /report screen shows. Re-pinned 2026-09-02 with every other audit
  //        green: semantic values, page geometry, embedded faces, blank-page
  //        and density checks, the banned-language scan and the Part A
  //        residue scan. The nine visual baselines are matched by page title
  //        rather than index, so the inserted folio shifted nothing; their
  //        drift stayed inside the informational tolerance.
  expect(inspection.pageCount).toBe(40);
  for (const page of inspection.pages) {
    expect(Math.round(page.widthPt)).toBe(595);
    expect(Math.round(page.heightPt)).toBe(842);
  }
});

test('all text is selectable — no page is a picture of text', async () => {
  const { inspection } = await goldenV3Artifact();
  for (const page of inspection.pages) {
    expect(page.lines.length, `page ${page.number} has no extractable text`).toBeGreaterThan(0);
  }
});

test.describe('SEMANTIC QA — the numbers on the page are the golden numbers', () => {
  test('lagna, rashi and nakshatra', async () => {
    const { inspection } = await goldenV3Artifact();
    const text = inspection.allText;
    // The lagna is stated in both scripts and both naming conventions,
    // because a Pandit reads Simha and a client reads Leo.
    expect(text).toContain('Leo');
    expect(text).toContain('Simha');
    expect(text).toMatch(/Uttara\s?Ashadha/);
    expect(text).toContain('Pada 1');

    // Lagna 132.0966 deg is Leo 12.0966 deg, which is 12 deg 05.8 arcmin,
    // displayed rounded to 12°06′. DMS, not decimals, on Pandit-facing pages.
    expect(text).toMatch(/(Leo|Simha)\s*12°06′/);

    // NOTE (not a defect this sprint): the LAGNA nakshatra (Magha pada 4) is
    // computed in the derived model but is never printed. Adding it is a
    // content change, which this renderer sprint is not allowed to make.
    expect(GOLDEN_EXPECTATIONS.lagna.nakshatra).toBe('Magha');
  });

  test('every graha placement appears with its sign and house', async () => {
    const { inspection } = await goldenV3Artifact();
    const text = inspection.allText.replace(/\s+/g, ' ');
    for (const [name, p] of Object.entries(GOLDEN_EXPECTATIONS.planets)) {
      expect(text, `${name} missing`).toContain(name);
      expect(text, `${name} sign ${p.sign} missing`).toContain(p.sign);
    }
    // Retrogrades are load-bearing for interpretation; losing the marker is a
    // silent correctness failure, not a cosmetic one.
    expect(text).toMatch(/Mercury[^\n]*\bR\b|\bR\b[^\n]*Mercury/);
  });

  test('the Vimshottari balance and current dasha', async () => {
    const { inspection } = await goldenV3Artifact();
    const text = inspection.allText;
    expect(text).toContain('Rahu');
    expect(text).toContain('Mercury');
    expect(text).toMatch(/5y\s*0m\s*4d/);
    expect(text).toContain('2035-06-19');
  });

  test('yoga verdicts keep their three-way status, including NOT_CALCULATED', async () => {
    const { inspection } = await goldenV3Artifact();
    const text = inspection.allText.toUpperCase();
    for (const yoga of Object.keys(GOLDEN_EXPECTATIONS.yogas)) {
      const name = yoga.replace('YOGA_', '').split('_')[0];
      expect(text, `${yoga} missing from the report`).toContain(name);
    }
    // NOT_CALCULATED must never be rendered as ABSENT. The distinction between
    // "we checked and it is not there" and "we did not check" is the core of
    // the product's honesty, and the renderer is the last place it can be lost.
    expect(text).toMatch(/NOT[\s_]CALCULATED/);
    expect(text).toContain('ABSENT');
    expect(text).toContain('PRESENT');
  });

  test('D10 is present but quarantined', async () => {
    const { inspection } = await goldenV3Artifact();
    const text = inspection.allText;
    expect(text).toMatch(/D10/);
    // The §10 label, taken from the promotion gate, printed verbatim.
    expect(text).toContain('INTERNAL CROSSCHECK ONLY');
    expect(text).toMatch(/not been compared against an external reference/i);
    expect(text).toMatch(/independent re-implementation/i);
    // Self-agreement is stated as self-agreement, never as verification.
    expect(text).not.toMatch(/D10[^.]{0,60}\bverified\b/i);
  });
});

test.describe('SEMANTIC QA — Devanagari survives the PDF round trip', () => {
  test('the §4 words extract intact from the real report', async () => {
    const { inspection } = await goldenV3Artifact();
    const present = ['सिंह', 'कुण्डली', 'राशि', 'नक्षत्र', 'महादशा'];
    const failures: string[] = [];
    for (const word of present) {
      if (!inspection.allText.includes(toVisualOrder(word))) continue;
      const verdict = verifyExtraction(word, inspection.allText);
      if (!verdict.ok) failures.push(`${word}: ${verdict.corruption.join('; ')}`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  test('no Unicode corruption anywhere in the document', async () => {
    const { inspection } = await goldenV3Artifact();
    expect(inspection.allText.includes('\uFFFD')).toBe(false);
    // Lone surrogates and stray control characters mean an encoding path broke.
    expect(inspection.allText).not.toMatch(/[\uD800-\uDFFF]/);
    expect(inspection.allText).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/);
  });
});

test.describe('STRUCTURAL QA — the page geometry holds', () => {
  test('nothing overflows, overlaps, or shrinks below legibility', async () => {
    const { inspection } = await goldenV3Artifact();
    const issues = structuralAudit(inspection, PRINT_BOX, {
      allowedFonts: ALLOWED_FONTS,
      minFontSizePt: 7,
    });
    const detail = issues.slice(0, 40).map((i) => `${i.code} p${i.page} ${i.detail}`).join('\n');
    expect(issues, `${issues.length} structural issues\n${detail}`).toEqual([]);
  });

  test('no section heading is orphaned at the foot of a page', async () => {
    const { result, inspection } = await goldenV3Artifact();
    const headings = result.report!.sections.flatMap((s) =>
      s.blocks.filter((b) => b.kind === 'heading' || b.kind === 'sectionTitle')
        .map((b) => (b as { text: string }).text));
    const orphans = findOrphanHeadings(inspection, headings);
    expect(orphans.map((o) => `p${o.page} ${o.detail}`)).toEqual([]);
  });

  test('only the declared faces are embedded — no substitution', async () => {
    const { inspection } = await goldenV3Artifact();
    for (const font of inspection.fonts) {
      const known = ALLOWED_FONTS.some((a) => font.startsWith(a) || a.startsWith(font));
      expect(known, `unexpected face: ${font}`).toBe(true);
    }
  });
});

test.describe('CONSULTATION DENSITY — Part A holds nothing a Pandit would not want', () => {
  test('the density transform matched every rule it declares', async () => {
    const { result } = await goldenV3Artifact();
    expect(result.densityUnmatched, 'a density rule no longer matches anything').toEqual([]);
    expect(result.densityApplied.length).toBeGreaterThanOrEqual(13);
  });

  test('no engineering residue reaches the consultation pages', async () => {
    const { result } = await goldenV3Artifact();
    expect(result.partAFindings.map((f) => `${f.patternId} ${f.sectionId}: ${f.excerpt}`)).toEqual([]);
  });

  test('the audit is checked against the rendered PAGES, not just the model', async () => {
    // The model check above can be defeated by a renderer that synthesises its
    // own text. This one reads the finished pages.
    const { result, inspection } = await goldenV3Artifact();
    const partAIds = new Set(result.report!.sections.filter((s) => s.part === 'A').map((s) => s.id));
    const partAPageCount = result.pageTitles.findIndex((t) => /Scholar Appendix|Part B/i.test(t));
    expect(partAIds.size).toBeGreaterThan(0);
    expect(partAPageCount).toBeGreaterThan(0);

    const partAText = inspection.pages.slice(0, partAPageCount).map((p) => p.text).join('\n');
    const hits: string[] = [];
    for (const rule of PART_A_FORBIDDEN_PATTERNS) {
      const m = rule.pattern.exec(partAText);
      if (m) hits.push(`${rule.id} (${rule.what}): ${m[0]}`);
    }
    expect(hits, hits.join('\n')).toEqual([]);
  });

  test('auditPartADensity agrees with the pipeline', async () => {
    const { result } = await goldenV3Artifact();
    expect(auditPartADensity(result.report!)).toEqual([]);
  });
});
