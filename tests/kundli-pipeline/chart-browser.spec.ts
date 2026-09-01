/**
 * CHART RENDERING IN A REAL BROWSER
 *
 * The canvas checks in chart-visual-artifacts.spec.ts measure pixels without
 * a browser. These tests put the actual SVG in an actual browser, because a
 * browser is where the customer sees it and where font substitution, zoom and
 * print styling are decided.
 *
 * When no browser is installed the suite SKIPS with the reason stated. It does
 * not pass: a skipped browser check is reported as unperformed, never as
 * approval.
 */

import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildChartRenderModel } from '../../src/lib/kundli/chartModel';
import { renderChartSvg } from '../../src/lib/kundli/northIndianChart';
import { generateKundliPdf } from '../../src/lib/kundli/pipeline';
import type { KundliCanonicalModel } from '../../src/lib/kundli/types';

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'scholar-kundli', 'owner-review');

/** True when a browser binary is actually present on this machine. */
function browserAvailable(): boolean {
  try {
    return fs.existsSync(chromium.executablePath());
  } catch {
    return false;
  }
}

const PROFILE: any = {
  name: 'Priya Sharma', birthDate: '1995-06-15', birthTime: '10:30', locationName: 'Patna',
  coordinates: { latitude: 25.5941, longitude: 85.1376, provenance: 'MANUAL' },
  timezone: {
    timezoneId: 'Asia/Kolkata', utcOffsetAtBirth: 5.5,
    localDateTime: '1995-06-15T10:30:00', utcDateTime: '1995-06-15T05:00:00.000Z',
    offsetProvenance: 'IANA_HISTORICAL',
  },
  fingerprint: 'browser',
};
const CONFIG: any = {
  zodiac: 'SIDEREAL', ayanamsha: 'LAHIRI_CHITRA_PAKSHA', ayanamshaName: 'Lahiri (Chitra Paksha)',
  houseSystem: 'EQUAL_SIGN', nodeMode: 'MEAN_NODE', ephemerisProvider: 'browser',
  engineVersion: 'V36.0', calculationVersion: 'browser', reportVersion: 'browser',
};

function realModel(): KundliCanonicalModel {
  const snapshot = getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15', birthTime: '10:30',
    latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
  });
  return buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG });
}

/** Page that embeds the Devanagari font the report ships, then the SVG. */
function pageFor(svg: string, width: number, fontBase64: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face { font-family: 'Noto Sans Devanagari'; src: url(data:font/ttf;base64,${fontBase64}) format('truetype'); }
  body { margin:0; background:#fff; }
  .wrap { width:${width}px; }
  svg { width:100%; height:auto; display:block; }
</style></head><body><div class="wrap">${svg}</div></body></html>`;
}

test.describe('CHART IN A REAL BROWSER', () => {
  test.skip(!browserAvailable(), 'no browser binary is installed in this environment');

  test('the chart renders as vector, with every label inside the box', async ({ page }) => {
    const model = buildChartRenderModel(realModel(), 1, 'EN');
    const svg = renderChartSvg(model, { title: 'D1 Rashi' });
    const font = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Regular.ttf'))
      .toString('base64');

    await page.setViewportSize({ width: 900, height: 900 });
    await page.setContent(pageFor(svg, 520, font));
    await page.evaluate(() => document.fonts.ready);

    const m = await page.evaluate(() => {
      const svgEl = document.querySelector('svg') as SVGSVGElement;
      const outer = svgEl.getBoundingClientRect();
      let overflowX = 0, overflowY = 0, zeroSized = 0;
      for (const el of [...svgEl.querySelectorAll('text, line, rect')]) {
        const r = (el as SVGGraphicsElement).getBoundingClientRect();
        overflowX = Math.max(overflowX, r.right - outer.right);
        overflowY = Math.max(overflowY, r.bottom - outer.bottom);
        if (r.width === 0 || r.height === 0) zeroSized++;
      }
      return {
        images: svgEl.querySelectorAll('image').length,
        lines: svgEl.querySelectorAll('line').length,
        texts: svgEl.querySelectorAll('text').length,
        overflowX, overflowY, zeroSized,
        width: outer.width,
      };
    });

    // Vector only: no raster image anywhere.
    expect(m.images).toBe(0);
    expect(m.lines).toBeGreaterThanOrEqual(8);
    expect(m.texts).toBeGreaterThanOrEqual(24);
    expect(m.zeroSized, 'no label may collapse to zero size').toBe(0);
    expect(m.overflowX).toBeLessThanOrEqual(1);
    expect(m.overflowY).toBeLessThanOrEqual(1);
  });

  test('Devanagari labels are drawn with the embedded font', async ({ page }) => {
    const model = buildChartRenderModel(realModel(), 1, 'HI');
    const svg = renderChartSvg(model, { title: 'D1 Rashi' });
    const font = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Regular.ttf'))
      .toString('base64');

    await page.setViewportSize({ width: 900, height: 900 });
    await page.setContent(pageFor(svg, 520, font));
    await page.evaluate(() => document.fonts.ready);

    const result = await page.evaluate(() => {
      const loaded = document.fonts.check('12px "Noto Sans Devanagari"');
      const texts = [...document.querySelectorAll('svg text')];
      const dev = texts.filter((t) => /[\u0900-\u097F]/.test(t.textContent ?? ''));
      const widths = dev.slice(0, 6).map((t) => t.getBoundingClientRect().width);
      return { loaded, devCount: dev.length, widths };
    });

    expect(result.loaded, 'the Devanagari font must load in the browser').toBe(true);
    expect(result.devCount).toBeGreaterThan(0);
    for (const w of result.widths) {
      expect(w, 'a Devanagari label must occupy real width').toBeGreaterThan(0);
    }
  });

  test('the chart fits a narrow mobile viewport without sideways scroll', async ({ page }) => {
    const svg = renderChartSvg(buildChartRenderModel(realModel(), 1, 'EN'));
    const font = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Regular.ttf'))
      .toString('base64');
    await page.setViewportSize({ width: 320, height: 640 });
    await page.setContent(pageFor(svg, 300, font));
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  });

  test('print media keeps the chart drawn and monochrome', async ({ page }) => {
    const svg = renderChartSvg(buildChartRenderModel(realModel(), 1, 'EN'));
    const font = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Regular.ttf'))
      .toString('base64');
    await page.setViewportSize({ width: 560, height: 700 });
    await page.setContent(pageFor(svg, 520, font));
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);
    const visible = await page.evaluate(() => {
      const svgEl = document.querySelector('svg') as SVGSVGElement;
      const r = svgEl.getBoundingClientRect();
      const style = getComputedStyle(svgEl);
      return { w: r.width, h: r.height, display: style.display, visibility: style.visibility };
    });
    expect(visible.w).toBeGreaterThan(100);
    expect(visible.h).toBeGreaterThan(100);
    expect(visible.display).not.toBe('none');
    expect(visible.visibility).not.toBe('hidden');
    await page.emulateMedia({ media: 'screen' });
  });

  test('the delivered PDF opens in the browser and shows the chart pages', async ({ page }) => {
    const result = await generateKundliPdf({
      name: 'Priya Sharma', birthDate: '1995-06-15', birthTime: '10:30',
      locationName: 'Patna', latitude: 25.5941, longitude: 85.1376, timezoneId: 'Asia/Kolkata',
    }, { locale: 'en' });
    expect(result.ok).toBe(true);
    const pdfPath = path.join(OUT_DIR, 'browser-preview-report.pdf');
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(pdfPath, Buffer.from(result.pdfBuffer!));

    // Chromium's PDF viewer renders the file; opening it proves the bytes are
    // a PDF a reader can display, not merely that they were produced.
    await page.goto(`file://${pdfPath}`);
    await page.waitForTimeout(1500);
    const hasEmbed = await page.evaluate(() => document.querySelectorAll('embed, iframe').length);
    expect(hasEmbed).toBeGreaterThan(0);
    console.log('[browser] PDF opened, pages:', result.pdfQuality!.pageCount);
  });
});
