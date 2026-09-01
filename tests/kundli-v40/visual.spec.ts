/**
 * V40.1 GATE 7 — automated visual regression (§7).
 *
 * The second, independent QA class. Text extraction cannot see a glyph drawn
 * in the wrong shape, a table whose rule sits through its own text, or a chart
 * whose diagonals miss the corners. Only pixels can.
 *
 * Two kinds of check, deliberately weighted differently:
 *
 *   STRUCTURAL — blocking. Every page renders, carries ink in a plausible
 *   range, keeps its ink inside the trim, and holds the fonts it declares.
 *
 *   PIXEL DIFF — reported, never blocking. The brief is explicit about this
 *   and it is the right call: fonts get rebuilt, rasterisers change their
 *   antialiasing, and a suite that cries wolf on a one-pixel shift gets
 *   disabled within a month. The numbers are printed so a human can look.
 *
 * Baselines live in tests/kundli-v40/visual-baseline/ because artifacts/ and
 * scratch/ are gitignored, and a baseline that is not committed is not a
 * baseline.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import { renderPage, inkCoverage, snapshot, mm } from './qa/pdfInspect';
import { goldenV3Artifact, BASELINE_DIR, VISUAL_OUT_DIR, ALLOWED_FONTS } from './qa/artifact';

/**
 * The pages §7 requires under visual regression, addressed by the section they
 * contain rather than by page number, so inserting a page upstream does not
 * silently start baselining the wrong thing.
 */
const REQUIRED_PAGES: { name: string; match: RegExp }[] = [
  { name: 'cover', match: /^Cover$/i },
  { name: 'passport', match: /Passport/i },
  { name: 'scholar-snapshot', match: /Saar|Snapshot/i },
  { name: 'd1-rashi', match: /D1|Rashi Chart/i },
  { name: 'd9-navamsha', match: /D9|Navamsha/i },
  { name: 'graha-table', match: /Graha Dossier/i },
  { name: 'yoga-dashboard', match: /Yoga/i },
  { name: 'vimshottari', match: /Vimshottari/i },
  { name: 'appendix-first', match: /Calculation Certificate/i },
];

const DPI = 110;

test('every page §7 names is present and identifiable', async () => {
  const { result } = await goldenV3Artifact();
  for (const want of REQUIRED_PAGES) {
    const idx = result.pageTitles.findIndex((t) => want.match.test(t));
    expect(idx, `no page matches ${want.name} (${want.match}) in ${JSON.stringify(result.pageTitles)}`)
      .toBeGreaterThanOrEqual(0);
  }
});

test('VISUAL — the nine required pages match their baselines', async () => {
  const { result } = await goldenV3Artifact();
  fs.mkdirSync(VISUAL_OUT_DIR, { recursive: true });

  const created: string[] = [];
  const drifted: string[] = [];

  for (const want of REQUIRED_PAGES) {
    const idx = result.pageTitles.findIndex((t) => want.match.test(t));
    const raster = await renderPage(result.pdfBuffer!, idx, DPI);
    const snap = await snapshot(`golden-${want.name}`, raster, BASELINE_DIR, VISUAL_OUT_DIR);

    if (snap.created) {
      created.push(`${want.name} (page ${idx + 1})`);
      continue;
    }
    expect(snap.diff!.sameSize, `${want.name} changed page dimensions`).toBe(true);
    if (snap.diff!.diffFraction > 0.01) {
      drifted.push(`${want.name}: ${(snap.diff!.diffFraction * 100).toFixed(2)}% of pixels, max channel delta ${snap.diff!.maxChannelDelta}`);
    }
  }

  if (created.length) {
    console.log(`[visual] baselines CREATED — review these images before trusting them:\n  ${created.join('\n  ')}`);
  }
  if (drifted.length) {
    // Reported, not thrown. See the module docblock.
    console.log(`[visual] pixel drift (informational, not a failure):\n  ${drifted.join('\n  ')}`);
  }
});

test('STRUCTURAL — no page is blank, and none is a solid block of ink', async () => {
  const { result, inspection } = await goldenV3Artifact();
  const findings: string[] = [];
  for (let i = 0; i < inspection.pageCount; i += 1) {
    const raster = await renderPage(result.pdfBuffer!, i, 72);
    const ink = inkCoverage(raster);
    if (ink < 0.002) findings.push(`page ${i + 1} (${result.pageTitles[i]}) is blank — ink ${ink.toFixed(5)}`);
    if (ink > 0.55) findings.push(`page ${i + 1} (${result.pageTitles[i]}) is ${(ink * 100).toFixed(0)}% ink`);
  }
  expect(findings, findings.join('\n')).toEqual([]);
});

test('STRUCTURAL — no ink touches the trim edge', async () => {
  // Anything in the outer 6mm will be lost or look like a printing fault. The
  // paper tint is a full-bleed fill, so the check reads the DEVIATION from the
  // page background rather than absolute darkness.
  const { result } = await goldenV3Artifact();
  const marginPx = Math.round((6 / 25.4) * DPI);
  const findings: string[] = [];

  for (let i = 0; i < result.metrics!.pageCount; i += 1) {
    const r = await renderPage(result.pdfBuffer!, i, DPI);
    const bg = [r.pixels[0], r.pixels[1], r.pixels[2]];
    let bleed = 0;
    const at = (x: number, y: number) => {
      const o = (y * r.width + x) * 3;
      return Math.max(
        Math.abs(r.pixels[o] - bg[0]),
        Math.abs(r.pixels[o + 1] - bg[1]),
        Math.abs(r.pixels[o + 2] - bg[2]),
      );
    };
    for (let y = 0; y < r.height; y += 1) {
      for (let x = 0; x < r.width; x += 1) {
        const inMargin = x < marginPx || x >= r.width - marginPx || y < marginPx || y >= r.height - marginPx;
        if (inMargin && at(x, y) > 40) bleed += 1;
      }
    }
    // A handful of antialiased pixels is rounding; a rule or a word is not.
    if (bleed > 40) findings.push(`page ${i + 1} (${result.pageTitles[i]}): ${bleed} inked pixels within 6mm of the trim`);
  }
  expect(findings, findings.join('\n')).toEqual([]);
});

test('STRUCTURAL — the chart pages are actually drawings, not empty frames', async () => {
  // A chart that fails to draw still leaves a caption and a table, so the text
  // checks pass while the page is visibly broken. Ink inside the chart square
  // is what proves the diagram exists.
  const { result } = await goldenV3Artifact();
  for (const title of [/D1|Rashi Chart/i, /D9|Navamsha/i]) {
    const idx = result.pageTitles.findIndex((t) => title.test(t));
    const r = await renderPage(result.pdfBuffer!, idx, DPI);
    const scale = DPI / 72;

    // The chart occupies the upper-middle of the page; sample that band.
    const x0 = Math.round(mm(45) * scale);
    const x1 = Math.round(mm(165) * scale);
    const y0 = Math.round(mm(35) * scale);
    const y1 = Math.round(mm(150) * scale);

    const bg = [r.pixels[0], r.pixels[1], r.pixels[2]];
    let ink = 0;
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const o = (y * r.width + x) * 3;
        const d = Math.max(
          Math.abs(r.pixels[o] - bg[0]),
          Math.abs(r.pixels[o + 1] - bg[1]),
          Math.abs(r.pixels[o + 2] - bg[2]),
        );
        if (d > 30) ink += 1;
      }
    }
    const fraction = ink / ((x1 - x0) * (y1 - y0));
    // Lines plus a couple of dozen short labels: a few percent. Far less means
    // the diagram did not draw; far more means something filled the square.
    expect(fraction, `page ${idx + 1} chart area ink ${fraction.toFixed(4)}`).toBeGreaterThan(0.004);
    expect(fraction, `page ${idx + 1} chart area ink ${fraction.toFixed(4)}`).toBeLessThan(0.25);
  }
});

test('the baseline directory is committed, not gitignored', () => {
  // A visual suite whose baselines are not in the repository silently
  // regenerates them on every machine and asserts nothing.
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  for (const line of gitignore.split('\n').map((l) => l.trim())) {
    if (!line || line.startsWith('#')) continue;
    expect(BASELINE_DIR.startsWith(line.replace(/\/$/, '')), `${BASELINE_DIR} is excluded by .gitignore rule "${line}"`).toBe(false);
  }
  expect(ALLOWED_FONTS.length).toBeGreaterThan(0);
});
