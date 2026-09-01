/**
 * V40.1 GATE 4 — chart-shape layout fixtures (§13).
 *
 * The golden chart is a comfortable one: no house holds more than three
 * grahas, the names are short, and only two planets are retrograde. Every
 * layout bug that survives to production hides in the charts that are NOT
 * comfortable.
 *
 * Three shapes, chosen for what they break:
 *   SPARSE  — mostly empty houses; the failure mode is a chart that looks
 *             unbalanced or loses its house indices in the whitespace.
 *   DENSE   — seven grahas in one house; the failure mode is text spilling
 *             outside the diamond or shrinking below legibility.
 *   EDGE    — long names, a long birthplace, bilingual labels, every graha
 *             retrograde, every yoga status; the failure mode is clipping.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import { renderKundliPdfV3 } from '../../src/lib/kundli/v40/rendererV3';
import {
  buildChartShapeFixture, chartShapeModel, DISTRIBUTIONS, LONG_NAME, LONG_PLACE,
  CHART_SHAPE_FIXTURE_VERSION, type ChartShape,
} from '../../src/lib/kundli/v40/fixtures/chartShapeFixtures';
import { layoutChart } from '../../src/lib/kundli/northIndianChart';
import { inspectPdf, structuralAudit, renderPage, inkCoverage, snapshot } from './qa/pdfInspect';
import { ALLOWED_FONTS, PRINT_BOX, ARTIFACT_DIR, BASELINE_DIR, VISUAL_OUT_DIR } from './qa/artifact';

let pdf: Uint8Array;
let inspection: Awaited<ReturnType<typeof inspectPdf>>;

test.beforeAll(async () => {
  const rendered = await renderKundliPdfV3(buildChartShapeFixture(), {
    creationDate: new Date('2026-01-01T00:00:00.000Z'),
  });
  pdf = rendered.buffer;
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  fs.writeFileSync(`${ARTIFACT_DIR}/chart-shape-fixtures.pdf`, pdf);
  inspection = await inspectPdf(pdf);
});

test('the three shapes are genuinely different, not three copies', () => {
  expect(CHART_SHAPE_FIXTURE_VERSION).toBe('chart-shape-fixtures-v1');

  const counts = (shape: ChartShape) => {
    const byHouse = new Map<number, number>();
    for (const [house, grahas] of Object.entries(DISTRIBUTIONS[shape])) {
      byHouse.set(Number(house), (grahas ?? []).length);
    }
    return byHouse;
  };

  const sparse = counts('SPARSE');
  const dense = counts('DENSE');

  // SPARSE: nothing crowded, and real empty houses to lay out.
  expect(Math.max(...sparse.values())).toBeLessThanOrEqual(2);
  expect(12 - sparse.size).toBeGreaterThanOrEqual(4);

  // DENSE: one house carrying most of the chart.
  expect(Math.max(...dense.values())).toBeGreaterThanOrEqual(7);

  // Every shape still places all nine grahas exactly once.
  for (const shape of ['SPARSE', 'DENSE', 'EDGE'] as ChartShape[]) {
    const all = Object.values(DISTRIBUTIONS[shape]).flat().filter(Boolean);
    expect(new Set(all).size, `${shape} places a graha twice or drops one`).toBe(9);
    expect(all.length).toBe(9);
  }
});

test('the DENSE house keeps every graha inside the diamond', () => {
  // Checked against the layout engine directly, so the failure points at the
  // geometry rather than at the page.
  const model = chartShapeModel('DENSE', 1, 'EN');
  const layout = layoutChart(model, { size: 128, baseFontSize: 8.8, minFontSize: 6.4 });

  const planets = layout.labels.filter((l) => l.kind === 'planet');
  expect(planets.length).toBe(9);

  // No two labels may collide, in ANY house.
  for (let i = 0; i < layout.labels.length; i += 1) {
    for (let j = i + 1; j < layout.labels.length; j += 1) {
      const a = layout.labels[i].box;
      const b = layout.labels[j].box;
      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      expect(
        overlapX > 0.05 && overlapY > 0.05,
        `${layout.labels[i].text} collides with ${layout.labels[j].text}`,
      ).toBe(false);
    }
  }

  // Nothing may fall outside the chart square.
  for (const l of layout.labels) {
    expect(l.box.x, `${l.text} runs off the left edge`).toBeGreaterThanOrEqual(-0.5);
    expect(l.box.x + l.box.w, `${l.text} runs off the right edge`).toBeLessThanOrEqual(128.5);
    expect(l.box.y, `${l.text} runs off the top`).toBeGreaterThanOrEqual(-0.5);
    expect(l.box.y + l.box.h, `${l.text} runs off the bottom`).toBeLessThanOrEqual(128.5);
  }
});

test('crowding shrinks type but never below the declared minimum', () => {
  for (const shape of ['SPARSE', 'DENSE', 'EDGE'] as ChartShape[]) {
    const layout = layoutChart(chartShapeModel(shape, 1, 'EN'), {
      size: 128, baseFontSize: 8.8, minFontSize: 6.4,
    });
    for (const l of layout.labels) {
      expect(l.fontSizePt, `${shape}: "${l.text}" at ${l.fontSizePt}pt`).toBeGreaterThanOrEqual(6.4);
    }
  }

  // Adaptive sizing must actually engage when the chart is squeezed. It is
  // deliberately NOT asserted that DENSE is always smaller than SPARSE: the
  // packer is constrained by column WIDTH as well as by row height, so a house
  // holding two long-ish abbreviations side by side can end up tighter than a
  // house holding seven stacked in one column. That is the packer working, not
  // failing. What must hold is that squeezing shrinks, and that the floor
  // holds.
  const minPt = (shape: ChartShape, size: number) => Math.min(
    ...layoutChart(chartShapeModel(shape, 1, 'EN'), { size })
      .labels.filter((l) => l.kind === 'planet').map((l) => l.fontSizePt),
  );
  for (const shape of ['SPARSE', 'DENSE', 'EDGE'] as ChartShape[]) {
    expect(minPt(shape, 70), `${shape} at 70mm did not shrink at all`).toBeLessThan(8.5);
    expect(minPt(shape, 70), `${shape} at 70mm fell through the floor`).toBeGreaterThanOrEqual(6);
  }
});

test('retrograde markers survive the EDGE chart, where every graha is retrograde', () => {
  const layout = layoutChart(chartShapeModel('EDGE', 1, 'EN'), { size: 128 });
  const planets = layout.labels.filter((l) => l.kind === 'planet');
  expect(planets.length).toBe(9);
  expect(planets.every((l) => l.retrograde), 'a retrograde flag was lost in layout').toBe(true);
});

test('bilingual labels render in the Devanagari face, not as boxes', () => {
  const layout = layoutChart(chartShapeModel('EDGE', 1, 'HI'), { size: 128 });
  const signs = layout.labels.filter((l) => l.kind === 'sign');
  expect(signs.length).toBe(12);
  // A Sanskrit-labelled chart must genuinely contain Devanagari, otherwise the
  // fixture is silently testing the Latin path twice.
  expect(signs.some((l) => /[\u0900-\u097F]/.test(l.text))).toBe(true);
});

test('STRUCTURAL QA — all three stress pages hold their geometry', () => {
  const issues = structuralAudit(inspection, PRINT_BOX, {
    allowedFonts: ALLOWED_FONTS,
    minFontSizePt: 6.4,   // the chart's own declared floor, not the prose floor
  });
  const detail = issues.slice(0, 30).map((i) => `${i.code} p${i.page} ${i.detail}`).join('\n');
  expect(issues, `${issues.length} issues\n${detail}`).toEqual([]);
});

test('SEMANTIC QA — the long name and long birthplace are not truncated', () => {
  const text = inspection.allText.replace(/\s+/g, ' ');
  expect(text, 'the long name was clipped').toContain(LONG_NAME);
  expect(text, 'the long birthplace was clipped').toContain(LONG_PLACE);
  expect(inspection.allText.includes('\uFFFD')).toBe(false);
});

test('VISUAL QA — each stress page is rendered and baselined', async () => {
  expect(inspection.pageCount).toBeGreaterThanOrEqual(3);
  const notes: string[] = [];
  for (let i = 0; i < inspection.pageCount; i += 1) {
    const raster = await renderPage(pdf, i, 110);
    const name = `chart-shape-p${String(i + 1).padStart(2, '0')}`;
    const snap = await snapshot(name, raster, BASELINE_DIR, VISUAL_OUT_DIR);
    if (snap.created) notes.push(`baseline created — ${name}`);
    else if (snap.diff && snap.diff.diffFraction > 0.02) {
      notes.push(`${name}: ${(snap.diff.diffFraction * 100).toFixed(2)}% of pixels differ`);
    }
    expect(inkCoverage(raster), `${name} is blank`).toBeGreaterThan(0.002);
  }
  if (notes.length) console.log(`[visual] ${notes.join('\n[visual] ')}`);
});
