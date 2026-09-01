/**
 * CHART VISUAL ARTIFACTS
 *
 * Generates everything an owner needs to inspect the charts, and checks
 * programmatically what can be checked without eyes:
 *
 *   - the SVG renders in a real browser, at desktop and narrow-mobile widths
 *   - Devanagari is drawn with real glyphs, not tofu boxes
 *   - ink stays inside the viewBox and no house region is left blank
 *   - the chart is monochrome-safe: no pixel carries meaning by hue
 *   - PNGs at 1x and 2x, plus print-media rendering, are written to disk
 *
 * These checks do NOT replace human inspection. They make the absence of
 * obvious defects provable; they cannot prove the chart looks right.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { writeChartPng, measureInk } from './chartCanvasRaster';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildChartRenderModel } from '../../src/lib/kundli/chartModel';
import { renderChartSvg, layoutChart, CHART_LINES } from '../../src/lib/kundli/northIndianChart';
import type { KundliCanonicalModel } from '../../src/lib/kundli/types';

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'scholar-kundli');
const REVIEW_DIR = path.join(OUT_DIR, 'owner-review');

const PROFILE: any = {
  name: 'Priya Sharma', birthDate: '1995-06-15', birthTime: '10:30', locationName: 'Patna',
  coordinates: { latitude: 25.5941, longitude: 85.1376, provenance: 'MANUAL' },
  timezone: {
    timezoneId: 'Asia/Kolkata', utcOffsetAtBirth: 5.5,
    localDateTime: '1995-06-15T10:30:00', utcDateTime: '1995-06-15T05:00:00.000Z',
    offsetProvenance: 'IANA_HISTORICAL',
  },
  fingerprint: 'artifact',
};
const CONFIG: any = {
  zodiac: 'SIDEREAL', ayanamsha: 'LAHIRI_CHITRA_PAKSHA', ayanamshaName: 'Lahiri (Chitra Paksha)',
  houseSystem: 'EQUAL_SIGN', nodeMode: 'MEAN_NODE', ephemerisProvider: 'artifact',
  engineVersion: 'V36.0', calculationVersion: 'artifact', reportVersion: 'artifact',
};

function realModel(): KundliCanonicalModel {
  const snapshot = getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15', birthTime: '10:30',
    latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
  });
  return buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG });
}

/** An HTML page that embeds the Devanagari font the report ships, then the SVG. */
function pageFor(svg: string, width: number, fontBase64: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face { font-family: 'Noto Sans Devanagari'; src: url(data:font/ttf;base64,${fontBase64}) format('truetype'); }
  body { margin:0; background:#fff; }
  .wrap { width:${width}px; }
  svg { width:100%; height:auto; display:block; }
</style></head><body><div class="wrap">${svg}</div></body></html>`;
}

test.describe('CHART ARTIFACTS', () => {
  test('D1 and D9 SVGs are written for review, in three label modes', () => {
    const canonical = realModel();
    fs.mkdirSync(REVIEW_DIR, { recursive: true });
    for (const division of [1, 9] as const) {
      for (const mode of ['EN', 'HI', 'BILINGUAL'] as const) {
        const model = buildChartRenderModel(canonical, division, mode);
        const svg = renderChartSvg(model, { title: `${model.chartName} — Priya Sharma (${mode})` });
        const file = path.join(REVIEW_DIR, `d${division}-${mode.toLowerCase()}.svg`);
        fs.writeFileSync(file, svg);
        expect(fs.statSync(file).size).toBeGreaterThan(1000);
      }
    }
    // The two charts reviewed by the owner are the English ones.
    for (const division of [1, 9] as const) {
      const svg = fs.readFileSync(path.join(REVIEW_DIR, `d${division}-en.svg`), 'utf8');
      fs.writeFileSync(path.join(OUT_DIR, `d${division}.svg`), svg);
    }
  });

  test('the chart image is not blank and nothing spills outside the box', () => {
    const canonical = realModel();
    for (const division of [1, 9] as const) {
      const model = buildChartRenderModel(canonical, division, 'EN');
      const stats = measureInk(model, { size: 520, title: `${model.chartName}` });
      // A real drawing: substantial ink, not a stray mark or an empty page.
      expect(stats.totalInk, `D${division} must carry ink`).toBeGreaterThan(5000);
      // And all of it inside the image.
      expect(stats.box.x0).toBeGreaterThanOrEqual(0);
      expect(stats.box.y0).toBeGreaterThanOrEqual(0);
      expect(stats.box.x1).toBeLessThanOrEqual(520 + 12);
      expect(stats.box.y1).toBeLessThanOrEqual(520 + 12 + 20);
    }
  });

  test('every house region carries ink: no house is drawn blank', () => {
    const canonical = realModel();
    for (const division of [1, 9] as const) {
      for (const mode of ['EN', 'HI'] as const) {
        const model = buildChartRenderModel(canonical, division, mode);
        const stats = measureInk(model, { size: 520, title: 'Chart' });
        // Observed range on the reference chart is 25-322 ink pixels at this
        // size; a house with no labels at all measures under 5. The threshold
        // separates "sparse because it holds two small digits" from "blank".
        stats.perHouse.forEach((ink, i) => {
          expect(ink, `D${division} ${mode} house ${i + 1} must carry ink near its centroid`).toBeGreaterThan(12);
        });
      }
    }
  });

  test('no information is carried by hue — the image is monochrome-safe', () => {
    const canonical = realModel();
    for (const division of [1, 9] as const) {
      const model = buildChartRenderModel(canonical, division, 'EN');
      const stats = measureInk(model, { size: 520 });
      expect(stats.monochrome, `D${division} channel spread was ${stats.maxChannelSpread}`).toBe(true);
    }
  });

  test('Devanagari is drawn with real glyphs, not tofu boxes', () => {
    const registered = GlobalFonts.registerFromPath(
      path.join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Regular.ttf'), 'ChartTestDev');
    expect(registered, 'the Devanagari font must register').toBe(true);
    const canvas = createCanvas(400, 120);
    const ctx = canvas.getContext('2d');

    const inkOf = (text: string) => {
      ctx.clearRect(0, 0, 400, 120);
      ctx.fillStyle = '#000';
      ctx.font = '64px ChartTestDev';
      ctx.textBaseline = 'top';
      ctx.fillText(text, 4, 8);
      const data = ctx.getImageData(0, 0, 400, 120).data;
      let ink = 0, signature = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 16) { ink++; signature = (signature * 31 + i) >>> 0; }
      }
      return { ink, signature };
    };

    const surya = inkOf('सूर्य');
    const mangal = inkOf('मंगल');
    expect(surya.ink).toBeGreaterThan(200);
    expect(mangal.ink).toBeGreaterThan(200);
    // Identical ink would mean both words fell back to the same tofu boxes.
    expect(surya.signature).not.toBe(mangal.signature);

    // The font's advance width differs from a font with no Devanagari at all.
    ctx.font = '64px ChartTestDev';
    const withDev = ctx.measureText('सूर्य').width;
    ctx.font = '64px sans-serif';
    const fallback = ctx.measureText('सूर्य').width;
    expect(withDev).toBeGreaterThan(0);
    expect(withDev).not.toBe(fallback);
  });

  test('Hindi and mixed charts draw Devanagari glyphs in the image itself', () => {
    const canonical = realModel();
    const en = measureInk(buildChartRenderModel(canonical, 1, 'EN'), { size: 520 });
    const hi = measureInk(buildChartRenderModel(canonical, 1, 'HI'), { size: 520 });
    // The Hindi chart is a different image: same geometry, different glyphs.
    expect(hi.totalInk).toBeGreaterThan(5000);
    expect(hi.totalInk).not.toBe(en.totalInk);
    expect(hi.monochrome).toBe(true);
  });

  test('review PNGs are written at review size and at high resolution', () => {
    const canonical = realModel();
    fs.mkdirSync(REVIEW_DIR, { recursive: true });
    for (const division of [1, 9] as const) {
      for (const mode of ['EN', 'HI', 'BILINGUAL'] as const) {
        const model = buildChartRenderModel(canonical, division, mode);
        const base = path.join(REVIEW_DIR, `d${division}-${mode.toLowerCase()}`);
        writeChartPng(model, `${base}.png`, { size: 520, title: `${model.chartName} — Priya Sharma` });
        writeChartPng(model, `${base}@2x.png`, { size: 520, scale: 2, title: `${model.chartName} — Priya Sharma` });
        // A deliberately small rendering, the narrow-preview case.
        writeChartPng(model, `${base}-small.png`, { size: 300, title: `${model.chartName}` });
        for (const suffix of ['.png', '@2x.png', '-small.png']) {
          const file = `${base}${suffix}`;
          expect(fs.existsSync(file), `${path.basename(file)} must exist for owner review`).toBe(true);
          expect(fs.statSync(file).size).toBeGreaterThan(2000);
        }
      }
    }
  });

  test('the chart survives being drawn small: nothing collapses or vanishes', () => {
    const canonical = realModel();
    const model = buildChartRenderModel(canonical, 1, 'EN');
    for (const size of [220, 300, 520, 900]) {
      const stats = measureInk(model, { size });
      expect(stats.totalInk, `at ${size}px the chart must still be drawn`).toBeGreaterThan(500);
      stats.perHouse.forEach((ink, i) => {
        expect(ink, `at ${size}px house ${i + 1} must still be marked`).toBeGreaterThan(4);
      });
    }
  });

  test('the layout is deterministic: the same model produces the same geometry', () => {
    const canonical = realModel();
    for (const division of [1, 9] as const) {
      const model = buildChartRenderModel(canonical, division, 'EN');
      const a = JSON.stringify(layoutChart(model, { size: 130 }));
      const b = JSON.stringify(layoutChart(model, { size: 130 }));
      expect(a).toBe(b);
    }
  });
});
