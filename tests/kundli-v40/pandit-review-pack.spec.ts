/**
 * V40.1 GATE 8 — the Pandit review pack (§12).
 *
 * This is a validation instrument, not a product feature, and the properties
 * that matter are the ones that decide whether the review it collects is
 * worth anything:
 *
 *   - it must contain the consultation document and NOT the engineering
 *     appendix, or the reviewer will grade the appendix;
 *   - its sections must be numbered, or a reviewer's "page 4" is ambiguous
 *     the moment pagination changes;
 *   - it must carry real annotation space, or the review comes back as
 *     "looks fine";
 *   - it must contain the same words as the real report, or the review is of
 *     a document nobody will ever receive.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import { renderKundliPdfV3 } from '../../src/lib/kundli/v40/rendererV3';
import {
  buildPanditReviewPack, PANDIT_REVIEW_PACK_VERSION, REVIEW_RATING_TARGETS,
} from '../../src/lib/kundli/v40/panditReviewPack';
import { PART_A_FORBIDDEN_PATTERNS } from '../../src/lib/kundli/v40/consultationDensity';
import { inspectPdf, structuralAudit } from './qa/pdfInspect';
import { goldenV3Artifact, ALLOWED_FONTS, PRINT_BOX, ARTIFACT_DIR } from './qa/artifact';

let pack: ReturnType<typeof buildPanditReviewPack>;
let pdf: Uint8Array;
let inspection: Awaited<ReturnType<typeof inspectPdf>>;

test.beforeAll(async () => {
  const { result } = await goldenV3Artifact();
  pack = buildPanditReviewPack(result.report!);
  const rendered = await renderKundliPdfV3(pack.report, {
    creationDate: new Date('2026-01-01T00:00:00.000Z'),
  });
  pdf = rendered.buffer;
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(`${ARTIFACT_DIR}/priya-v40-pandit-review.pdf`, pdf);
  inspection = await inspectPdf(pdf);
});

test('the pack is Part A only', async () => {
  const { result } = await goldenV3Artifact();
  expect(PANDIT_REVIEW_PACK_VERSION).toBe('pandit-review-pack-v1');
  expect(pack.report.sections.every((s) => s.part === 'A')).toBe(true);

  // Every Part B section of the source report must be gone.
  const droppedIds = result.report!.sections.filter((s) => s.part === 'B').map((s) => s.id);
  expect(droppedIds.length).toBeGreaterThan(8);
  const keptIds = new Set(pack.report.sections.map((s) => s.id));
  for (const id of droppedIds) {
    expect(keptIds.has(id), `Part B section ${id} leaked into the review pack`).toBe(false);
  }
});

test('the engineering appendix CONTENT is absent from the PAGES, not just the model', () => {
  const text = inspection.allText;

  // The appendix sections announce themselves as B1..B10. None of those
  // headers may appear, nor any of the content that lives under them.
  for (let i = 1; i <= 10; i += 1) {
    expect(text, `appendix section B${i} leaked into the review pack`).not.toMatch(new RegExp(`\\bB${i}\\s*[·.]`));
  }
  for (const marker of [
    'EVIDENCE LINEAGE', 'Shadbala', 'shadbala',
    'yogaSourceRegistry', 'canonicalSnapshot', 'kundli-derived-v1',
  ]) {
    expect(text, `"${marker}" appears in the review pack`).not.toContain(marker);
  }
  for (const rule of PART_A_FORBIDDEN_PATTERNS) {
    const m = rule.pattern.exec(text);
    expect(m?.[0], `${rule.id} (${rule.what}) leaked into the review pack`).toBeUndefined();
  }
});

test('references to the appendix survive, and the cover says how to get it', () => {
  // Part A legitimately points at the appendix — a Pandit who wants the
  // evidence for a claim should be able to ask for it by name. What must NOT
  // happen is a dangling pointer: the cover has to tell the reviewer that the
  // appendix exists and is available, or the references read as an omission.
  const text = inspection.allText;
  expect(text, 'Part A lost its evidence pointers').toContain('Scholar Appendix');
  expect(text).toMatch(/available on request/i);
});

test('sections are numbered, contiguously, from one', () => {
  const numbers = pack.numbering.map((n) => n.number);
  expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  expect(numbers.length).toBeGreaterThanOrEqual(10);

  // The number must be on the page, not just in the return value.
  for (const n of pack.numbering) {
    expect(inspection.allText, `section ${n.number} is not numbered on the page`)
      .toContain(`${n.number}. `);
  }
});

test('the consultation sections carry annotation space', () => {
  const withNotes = pack.report.sections.filter((s) =>
    s.blocks.some((b) => b.kind === 'notesArea' && /reviewer notes/i.test((b as { title: string }).title)));
  // Not every section needs space, but most of the substantive ones do.
  expect(withNotes.length).toBeGreaterThanOrEqual(10);

  const totalLines = pack.report.sections
    .flatMap((s) => s.blocks.filter((b) => b.kind === 'notesArea'))
    .reduce((n, b) => n + (b as { lines: number }).lines, 0);
  expect(totalLines, 'not enough room to write anything').toBeGreaterThanOrEqual(60);
});

test('the review form asks every question §12 requires', () => {
  const text = inspection.allText.replace(/\s+/g, ' ');

  expect(text).toMatch(/Is the calculation correct/i);
  expect(text).toMatch(/Questionable/i);
  expect(text).toMatch(/What is missing/i);
  expect(text).toMatch(/What is unnecessary/i);
  expect(text).toMatch(/Where do you disagree/i);
  expect(text).toMatch(/Would you use this in a consultation/i);

  // A 1-5 scale for each of the five named parts.
  for (const target of REVIEW_RATING_TARGETS) {
    expect(text, `no rating row for ${target}`).toContain(target);
  }
  expect(text).toMatch(/Not useful/i);
  expect(text).toMatch(/Essential/i);
});

test('the cover says plainly that this is not a client document', () => {
  const text = inspection.allText;
  expect(text).toMatch(/PANDIT REVIEW PACK/i);
  expect(text).toMatch(/NOT FOR A CLIENT/i);
  // It must be traceable back to the report it was cut from.
  expect(text).toContain('CT-KUNDLI-31346AC701E0CFD5');
});

test('the pack contains the same words as the real report', async () => {
  // A review pack rewritten for review would tell us about the review pack.
  const { inspection: golden } = await goldenV3Artifact();
  const sample = [
    'Simha 12\u00B006\u2032', 'Uttara Ashadha', 'Malavya', 'Budhaditya',
    '5y 0m 4d', 'Rahu', 'Mercury',
  ];
  for (const s of sample) {
    expect(golden.allText, `${s} is not in the source report`).toContain(s);
    expect(inspection.allText, `${s} was lost from the review pack`).toContain(s);
  }
});

test('STRUCTURAL — the pack holds its geometry, ruled lines included', () => {
  const issues = structuralAudit(inspection, PRINT_BOX, {
    allowedFonts: ALLOWED_FONTS,
    minFontSizePt: 7,
  });
  const detail = issues.slice(0, 30).map((i) => `${i.code} p${i.page} ${i.detail}`).join('\n');
  expect(issues, `${issues.length} issues\n${detail}`).toEqual([]);
});

test('the pack is shorter than the full report', () => {
  // If dropping eleven appendix sections did not shorten it, something was
  // silently kept.
  expect(inspection.pageCount).toBeLessThan(39);
  expect(inspection.pageCount).toBeGreaterThanOrEqual(14);
});
