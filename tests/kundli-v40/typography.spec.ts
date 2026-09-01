/**
 * V40.1 GATE 2 — the typography validation fixture (§4), rendered.
 *
 * The shaping spec proves the SHAPER works. This proves the RENDERER carries
 * that shaping onto a page: the right faces are embedded, nothing lands in the
 * margin, nothing collides, and every required string survives round-tripping
 * through the PDF.
 *
 * The fixture is a permanent regression artifact. When a font, a metric or a
 * layout rule changes, this is the page that tells you.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import { renderKundliPdfV3 } from '../../src/lib/kundli/v40/rendererV3';
import {
  buildTypographyFixture, typographyExpectations, TYPOGRAPHY_FIXTURE_VERSION,
  REQUIRED_DEVANAGARI_WORDS,
} from '../../src/lib/kundli/v40/fixtures/typographyFixture';
import { verifyExtraction } from '../../src/lib/kundli/v40/pdf/shapedText';
import { inspectPdf, structuralAudit, snapshot, renderPage, inkCoverage } from './qa/pdfInspect';
import { ALLOWED_FONTS, PRINT_BOX, ARTIFACT_DIR, BASELINE_DIR, VISUAL_OUT_DIR } from './qa/artifact';

let pdf: Uint8Array;
let inspection: Awaited<ReturnType<typeof inspectPdf>>;

test.beforeAll(async () => {
  const rendered = await renderKundliPdfV3(buildTypographyFixture(), {
    creationDate: new Date('2026-01-01T00:00:00.000Z'),
  });
  pdf = rendered.buffer;
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(`${ARTIFACT_DIR}/typography-validation.pdf`, pdf);
  inspection = await inspectPdf(pdf);
});

test('the fixture still covers everything §4 asks for', () => {
  const cases = typographyExpectations();
  expect(TYPOGRAPHY_FIXTURE_VERSION).toBe('typography-fixture-v1');
  // Guard against the fixture being quietly trimmed to make the gate pass.
  expect(cases.length).toBeGreaterThanOrEqual(23);
  for (const word of REQUIRED_DEVANAGARI_WORDS) {
    expect(cases.includes(word), `${word} dropped from the fixture`).toBe(true);
  }
});

test('SEMANTIC QA — every required string survives the round trip', async () => {
  const failures: string[] = [];
  for (const expected of typographyExpectations()) {
    const verdict = verifyExtraction(expected, inspection.allText);
    if (!verdict.ok) failures.push(`${expected} — ${verdict.corruption.join('; ')}`);
  }
  expect(failures, failures.join('\n')).toEqual([]);
});

test('SEMANTIC QA — no replacement characters anywhere', () => {
  // U+FFFD is what mupdf reports when Latin text was drawn in the Devanagari
  // face (or vice versa). It is the script-routing detector.
  expect(inspection.allText.includes('\uFFFD')).toBe(false);
});

test('STRUCTURAL QA — no clipping, no overlap, no undersized text', () => {
  const issues = structuralAudit(inspection, PRINT_BOX, {
    allowedFonts: ALLOWED_FONTS,
    minFontSizePt: 7,
  });
  const detail = issues.map((i) => `${i.code} p${i.page} ${i.detail}`).join('\n');
  expect(issues, detail).toEqual([]);
});

test('STRUCTURAL QA — only the declared faces are embedded', () => {
  // A face outside the allow-list means a substitution happened, which is
  // exactly how "it looked fine on my machine" bugs reach print.
  for (const font of inspection.fonts) {
    const known = ALLOWED_FONTS.some((a) => font.startsWith(a) || a.startsWith(font));
    expect(known, `unexpected face embedded: ${font}`).toBe(true);
  }
  expect(inspection.fonts.some((f) => f.includes('Devanagari'))).toBe(true);
});

test('VISUAL QA — the fixture pages have not changed shape', async () => {
  fs.mkdirSync(VISUAL_OUT_DIR, { recursive: true });
  const reports: string[] = [];
  for (let i = 0; i < inspection.pageCount; i += 1) {
    const raster = await renderPage(pdf, i, 110);
    const name = `typography-p${String(i + 1).padStart(2, '0')}`;
    const snap = await snapshot(name, raster, BASELINE_DIR, VISUAL_OUT_DIR);

    // Per the brief, a pixel diff is REPORTED, never a hard blocker: fonts and
    // rasterisers move. The structural checks above are the blocking gate.
    if (snap.created) reports.push(`baseline created — ${name}`);
    else if (snap.diff && snap.diff.diffFraction > 0.02) {
      reports.push(`${name}: ${(snap.diff.diffFraction * 100).toFixed(2)}% of pixels differ`);
    }

    // Ink coverage IS blocking. A page that renders blank, or one that is
    // almost entirely ink, means the render failed in a way no text-extraction
    // check would notice.
    const ink = inkCoverage(raster);
    expect(ink, `${name} is blank`).toBeGreaterThan(0.002);
    expect(ink, `${name} is a solid block`).toBeLessThan(0.6);
  }
  if (reports.length) console.log(`[visual] ${reports.join('\n[visual] ')}`);
});
