/**
 * Regression guard: letter-spacing must never be applied to a Devanagari run.
 *
 * V41 shipped a Hindi locale, which put Devanagari into h3 headings — and h3
 * headings are drawn with `trackingMm: 0.15`. That combination corrupted the
 * text in two visible ways:
 *
 *   1. A gap opened before the run that followed a Devanagari run, because
 *      pdfkit's `widthOfString` bills tracking as `Tc x (utf16Length - 1)`
 *      while the PDF `Tc` operator is applied once per *glyph*. Shaping turns
 *      the 17 code units of "कार्यात्मक भूमिका" into 15 glyphs, so the measured
 *      width ran ahead of the drawn width.
 *
 *   2. The space after a mark-bearing cluster disappeared entirely —
 *      "एवं दृष्टि" drew as "एवंदृष्टि" — because when a glyph carries a GPOS
 *      offset pdfkit re-anchors the pen with an absolute `Tm` that omits the
 *      accumulated `Tc`.
 *
 * Neither defect is visible to text extraction: mupdf reports the correct
 * characters and the correct space in both cases. Only geometry catches it,
 * so the second test rasterises the run and counts ink groups.
 *
 * The fix is `PdfSurfaceV3.trackingPtFor`, which zeroes tracking for the four
 * Devanagari faces. That is a script-level typographic rule, not a per-string
 * patch: Devanagari sets a syllable as a base plus attached matras under one
 * shirorekha, and no Devanagari tradition letter-spaces it.
 */
import { test, expect } from '@playwright/test';
import { FontStack, isDevanagariRole, FONT_ROLES, type RunStyle } from '../../src/lib/kundli/v40/pdf/fontStack';
import { PdfSurfaceV3 } from '../../src/lib/kundli/v40/pdf/surface';
import { renderPage } from './qa/pdfInspect';

const DEVA = 'युति एवं दृष्टि';
const MIXED = 'कार्यात्मक भूमिका, युति एवं दृष्टि';
const SANS_BOLD: RunStyle = { family: 'sans', bold: true };
const TRACKING_MM = 0.15;
const SIZE_PT = 10.8;

function surface(fonts: FontStack): PdfSurfaceV3 {
  return new PdfSurfaceV3({ fonts, widthMm: 210, heightMm: 297 });
}

test.describe.configure({ mode: 'parallel' });

test('isDevanagariRole covers exactly the four Devanagari faces', () => {
  const deva = FONT_ROLES.filter(isDevanagariRole);
  expect(deva.sort()).toEqual(['devaSans', 'devaSansBold', 'devaSerif', 'devaSerifBold']);
});

test('tracking does not change the measured width of a Devanagari run', () => {
  const s = surface(FontStack.fromDisk());
  for (const role of FONT_ROLES.filter(isDevanagariRole)) {
    const plain = s.measureRunMm(DEVA, role, SIZE_PT, 0);
    const tracked = s.measureRunMm(DEVA, role, SIZE_PT, TRACKING_MM);
    expect(tracked, `${role} must ignore tracking`).toBeCloseTo(plain, 6);
  }
});

test('tracking still widens a Latin run', () => {
  const s = surface(FontStack.fromDisk());
  const plain = s.measureRunMm('Functional Role', 'sansBold', SIZE_PT, 0);
  const tracked = s.measureRunMm('Functional Role', 'sansBold', SIZE_PT, TRACKING_MM);
  expect(tracked).toBeGreaterThan(plain);
});

test('a tracked mixed line only pays tracking on its Latin runs', () => {
  const s = surface(FontStack.fromDisk());
  const line = s.layoutSingle(MIXED, SANS_BOLD, SIZE_PT, TRACKING_MM);
  expect(line.runs.length).toBe(3);
  const sum = line.runs.reduce(
    (n, r) => n + s.measureRunMm(r.text, r.role, SIZE_PT, isDevanagariRole(r.role) ? 0 : TRACKING_MM),
    0,
  );
  expect(line.widthMm).toBeCloseTo(sum, 6);
});

/**
 * Projects ink onto the x axis and reports the word groups separated by a gap
 * of at least `minGapPx`, plus the width of each separating gap.
 *
 * A swallowed space merges two groups and the count drops; a spuriously wide
 * inter-run gap shows up as an outlier in `gaps`. Both are invisible to text
 * extraction, which is why this has to be measured off the raster.
 */
function inkGroups(pixels: Uint8ClampedArray, width: number, height: number, minGapPx: number): { groups: number; gaps: number[] } {
  const inked: boolean[] = new Array(width).fill(false);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      const i = (y * width + x) * 3;
      if (pixels[i] < 160 && pixels[i + 1] < 160 && pixels[i + 2] < 160) { inked[x] = true; break; }
    }
  }
  let groups = 0;
  let gap = Infinity;
  const gaps: number[] = [];
  for (let x = 0; x < width; x += 1) {
    if (inked[x]) {
      if (gap >= minGapPx) {
        groups += 1;
        if (groups > 1) gaps.push(gap);
      }
      gap = 0;
    } else if (gap !== Infinity) {
      gap += 1;
    }
  }
  return { groups, gaps };
}

test('a tracked mixed heading keeps even word spacing', async () => {
  const s = surface(FontStack.fromDisk());
  // Exactly the geometry of an h3 heading in the Hindi locale: sans bold,
  // tracked, and split into deva / latin / deva runs by the comma.
  s.drawLine(s.layoutSingle(MIXED, SANS_BOLD, SIZE_PT, TRACKING_MM), 20, 40, {
    size: SIZE_PT, style: SANS_BOLD, color: [0, 0, 0], trackingMm: TRACKING_MM,
  });
  const pdf = Buffer.from(await s.finish());
  const dpi = 400;
  const raster = await renderPage(pdf, 0, dpi);

  // Crop a band around the baseline so nothing else can contribute ink.
  const pxPerPt = dpi / 72;
  const mmToPt = (mm: number) => (mm * 72) / 25.4;
  const y0 = Math.max(0, Math.floor((mmToPt(40) - SIZE_PT * 1.2) * pxPerPt));
  const y1 = Math.min(raster.height, Math.ceil((mmToPt(40) + SIZE_PT * 0.5) * pxPerPt));
  const band = new Uint8ClampedArray(raster.width * (y1 - y0) * 3);
  for (let y = y0; y < y1; y += 1) {
    const src = y * raster.width * 3;
    band.set(raster.pixels.subarray(src, src + raster.width * 3), (y - y0) * raster.width * 3);
  }

  // A word space at 10.8 pt is ~2.7 pt wide; require at least half of that so
  // ordinary intra-cluster whitespace cannot fool the counter.
  const minGapPx = Math.round(1.3 * pxPerPt);
  const { groups, gaps } = inkGroups(band, raster.width, y1 - y0, minGapPx);

  // कार्यात्मक | भूमिका, | युति | एवं | दृष्टि
  expect(groups, `word groups (gaps: ${gaps.join(', ')})`).toBe(5);
  // Every word space is the same space, so the widest may not be much more
  // than the narrowest. Tracking billed against the wrong run opens one of
  // them well beyond the rest.
  expect(Math.max(...gaps) / Math.min(...gaps), `gap spread: ${gaps.join(', ')}`).toBeLessThan(1.8);
});
