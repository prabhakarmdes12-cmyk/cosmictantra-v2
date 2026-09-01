/**
 * Test-only rasteriser: draws a ChartRenderModel to a PNG so the charts can
 * be inspected and measured without a browser.
 *
 * It is deliberately NOT part of src/. The product renders charts as vector
 * PDF primitives and as SVG; this exists to produce review images and to let
 * structural checks inspect actual pixels. Geometry comes from the same
 * layoutChart() the product uses, so what is measured here is what ships.
 */

import { createCanvas, GlobalFonts, SKRSContext2D } from '@napi-rs/canvas';
import type { ChartRenderModel } from '../../src/lib/kundli/chartModel';
import { layoutChart, CHART_LINES } from '../../src/lib/kundli/northIndianChart';

const DEV_FONT = 'NotoSansDevanagariChart';
let fontRegistered = false;

function ensureFont(): boolean {
  if (fontRegistered) return true;
  const path = require('path').join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Regular.ttf');
  fontRegistered = GlobalFonts.registerFromPath(path, DEV_FONT);
  return fontRegistered;
}

export interface RasterOptions {
  /** Edge length in pixels. 520 is a comfortable review size. */
  size?: number;
  title?: string;
  /** Extra pixels per unit: 2 gives a high-resolution image. */
  scale?: number;
}

/**
 * Draws the chart onto a canvas. Mirrors the PDF emitter: gray strokes only,
 * the lagna marked by a bold rule, retrograde marked by a rule beneath the
 * abbreviation. No colour carries meaning.
 */
export function renderChartToCanvas(
  model: ChartRenderModel,
  options: RasterOptions = {},
): { canvas: any; ctx: SKRSContext2D; size: number; titleHeight: number } {
  const scale = options.scale ?? 1;
  const size = (options.size ?? 520) * scale;
  const titleHeight = options.title ? Math.round(20 * scale) : 0;
  const pad = Math.round(6 * scale);
  const canvas = createCanvas(size + pad * 2, size + pad * 2 + titleHeight);
  const ctx = canvas.getContext('2d');
  const hasDevFont = ensureFont();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (options.title) {
    ctx.fillStyle = '#333333';
    ctx.font = `${Math.round(11 * scale)}px ${hasDevFont ? DEV_FONT : 'sans-serif'}`;
    ctx.textBaseline = 'top';
    ctx.fillText(options.title, pad, Math.round(2 * scale));
  }

  ctx.save();
  ctx.translate(pad, pad + titleHeight);

  const layout = layoutChart(model, {
    size,
    unitsPerPoint: (4 / 3) * scale,
    baseFontSize: 8.5,
    minFontSize: 6,
  });
  const s = size / 100;

  ctx.strokeStyle = '#3c3c3c';
  ctx.lineWidth = Math.max(1, scale);
  ctx.strokeRect(0, 0, size, size);
  for (const [a, b] of CHART_LINES) {
    ctx.beginPath();
    ctx.moveTo(a[0] * s, a[1] * s);
    ctx.lineTo(b[0] * s, b[1] * s);
    ctx.stroke();
  }

  // Lagna marker: a bold rule.
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(2, 2.2 * scale);
  ctx.beginPath();
  ctx.moveTo(layout.lagnaMarker.x, layout.lagnaMarker.y);
  ctx.lineTo(layout.lagnaMarker.x + layout.lagnaMarker.w, layout.lagnaMarker.y);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, scale);

  ctx.textAlign = 'center';
  for (const label of layout.labels) {
    const isDev = /[\u0900-\u097F]/.test(label.text);
    ctx.fillStyle = label.kind === 'house' ? '#777777' : label.kind === 'sign' ? '#333333' : '#111111';
    ctx.font = `${label.fontSize}px ${isDev && hasDevFont ? DEV_FONT : 'sans-serif'}`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label.text, label.x, label.y);
    if (label.retrograde) {
      const half = Math.max(3 * scale, label.fontSize * 0.375);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(0.7, 0.7 * scale);
      ctx.beginPath();
      ctx.moveTo(label.x - half, label.y + label.fontSize * 0.28);
      ctx.lineTo(label.x + half, label.y + label.fontSize * 0.28);
      ctx.stroke();
    }
  }
  ctx.restore();

  return { canvas, ctx, size, titleHeight };
}

/** Writes a PNG for owner review. Returns the path written. */
export function writeChartPng(model: ChartRenderModel, file: string, options: RasterOptions = {}): string {
  const { canvas } = renderChartToCanvas(model, options);
  require('fs').writeFileSync(file, canvas.toBuffer('image/png'));
  return file;
}

/** Ink statistics over a chart image, used by the structural checks. */
export interface InkStats {
  totalInk: number;
  /** Bounding box of non-white pixels. */
  box: { x0: number; y0: number; x1: number; y1: number };
  /** Ink found in a disc around each house centroid. */
  perHouse: number[];
  /** True when every pixel is gray (no hue carrying meaning). */
  monochrome: boolean;
  /** Largest channel spread found in any pixel. */
  maxChannelSpread: number;
}

export function measureInk(
  model: ChartRenderModel,
  options: RasterOptions = {},
): InkStats {
  const { ctx, size, titleHeight } = renderChartToCanvas(model, options);
  const pad = Math.round(6 * (options.scale ?? 1));
  const width = size + pad * 2;
  const height = size + pad * 2 + titleHeight;
  const data = ctx.getImageData(0, 0, width, height).data;

  let totalInk = 0;
  let maxSpread = 0;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      if (spread > maxSpread) maxSpread = spread;
      if (r < 235 || g < 235 || b < 235) {
        totalInk++;
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }

  // Ink near each house centroid.
  const layout = layoutChart(model, { size, unitsPerPoint: (4 / 3) * (options.scale ?? 1) });
  const s = size / 100;
  const perHouse: number[] = [];
  for (const poly of layout.polygons) {
    const cx = pad + (poly.reduce((acc, p) => acc + p[0], 0) / poly.length) * s;
    const cy = pad + titleHeight + (poly.reduce((acc, p) => acc + p[1], 0) / poly.length) * s;
    const radius = Math.round(size * 0.05);
    let ink = 0;
    for (let y = Math.max(0, Math.round(cy - radius)); y < Math.min(height, Math.round(cy + radius)); y++) {
      for (let x = Math.max(0, Math.round(cx - radius)); x < Math.min(width, Math.round(cx + radius)); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > radius * radius) continue;
        const i = (y * width + x) * 4;
        if (data[i] < 220 || data[i + 1] < 220 || data[i + 2] < 220) ink++;
      }
    }
    perHouse.push(ink);
  }

  return {
    totalInk,
    box: { x0, y0, x1, y1 },
    perHouse,
    // Antialiasing produces small channel differences; anything above a
    // modest threshold means colour is being used to carry meaning.
    monochrome: maxSpread <= 12,
    maxChannelSpread: maxSpread,
  };
}
