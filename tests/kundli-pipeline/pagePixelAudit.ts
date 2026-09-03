/**
 * PAGE-LEVEL PIXEL AUDIT
 *
 * Text extraction answers "what does the PDF say". It cannot answer "does it
 * look right": a glyph can extract correctly and still render as a box, and
 * a page can be 90% empty while extracting perfectly well.
 *
 * This module rasterises a delivered PDF and measures the pixels. It is not a
 * substitute for a human looking at the page — it cannot judge taste,
 * balance or whether something reads well. What it can do is answer, without
 * eyes:
 *
 *   - Is any page blank, near-blank, or suspiciously empty?
 *   - Does any content sit outside the safe margins (clipping)?
 *   - Is there a large accidental void part-way down a page?
 *   - Are the margins consistent from page to page?
 *   - Is the density within a band a reader would call a document?
 *   - Do the expected markers (the Bhava-Graha bullets) actually produce ink?
 *
 * It lives in tests/ because the product should not ship a rasteriser.
 */
import fs from 'fs';
import path from 'path';
import { createCanvas } from '@napi-rs/canvas';

import { getDocument as pdfjsGetDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const pdfjs = { getDocument: pdfjsGetDocument };

function ensureRequestAnimationFrame() {
  const g: any = globalThis as any;
  if (!g.requestAnimationFrame) {
    g.requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 0);
  }
  if (!g.cancelAnimationFrame) g.cancelAnimationFrame = (id: any) => clearTimeout(id);
}

function standardFontsDir(): string {
  try {
    const pkgJson = require.resolve('pdfjs-dist/package.json');
    return path.join(path.dirname(pkgJson), 'standard_fonts');
  } catch {
    return '';
  }
}

export interface PagePixels {
  page: number;
  /** Image size in device pixels at the requested scale. */
  width: number;
  height: number;
  /** Fraction of pixels that are not near-white. 0..1 */
  inkCoverage: number;
  /** Content bounding box in device pixels. */
  box: { x0: number; y0: number; x1: number; y1: number };
  /** Margins as a fraction of page width/height. */
  margins: { left: number; right: number; top: number; bottom: number };
  /** Longest run of consecutive blank rows, as a fraction of page height. */
  largestVerticalVoid: number;
  /** Row index where that void starts, as a fraction of page height. */
  largestVoidStartsAt: number;
  /** True if ink touches within 1% of any page edge (possible clipping). */
  touchesEdge: boolean;
}

const NEAR_WHITE = 245;

export async function analysePage(
  pdfPath: string,
  pageNumber: number,
  scale = 2,
): Promise<PagePixels> {
  ensureRequestAnimationFrame();
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const fontsDir = standardFontsDir();
  const doc = await pdfjs.getDocument(
    fontsDir ? { data, standardFontDataUrl: fontsDir + '/' } : { data },
  ).promise;
  try {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);
    const canvas = createCanvas(width, height);
    const ctx: any = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const img = ctx.getImageData(0, 0, width, height).data;
    const rowInk = new Uint32Array(height);
    let ink = 0;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;

    for (let y = 0; y < height; y++) {
      let count = 0;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const lum = (img[i] * 299 + img[i + 1] * 587 + img[i + 2] * 114) / 1000;
        if (lum < NEAR_WHITE) {
          count++;
          ink++;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
      rowInk[y] = count;
    }

    // Longest run of rows carrying essentially no ink.
    const blankThreshold = Math.max(1, Math.round(width * 0.002));
    let longest = 0, longestStart = 0, run = 0, runStart = 0;
    for (let y = 0; y < height; y++) {
      if (rowInk[y] <= blankThreshold) {
        if (run === 0) runStart = y;
        run++;
        if (run > longest) { longest = run; longestStart = runStart; }
      } else {
        run = 0;
      }
    }

    if (x0 === Infinity) { x0 = y0 = x1 = y1 = 0; }

    const safe = Math.max(2, Math.round(Math.min(width, height) * 0.01));
    const touchesEdge = x0 <= safe || y0 <= safe || x1 >= width - safe || y1 >= height - safe;

    return {
      page: pageNumber,
      width,
      height,
      inkCoverage: ink / (width * height),
      box: { x0, y0, x1, y1 },
      margins: {
        left: x0 / width,
        right: (width - x1) / width,
        top: y0 / height,
        bottom: (height - y1) / height,
      },
      largestVerticalVoid: longest / height,
      largestVoidStartsAt: longestStart / height,
      touchesEdge,
    };
  } finally {
    await doc.destroy();
  }
}

export async function analysePdf(pdfPath: string, scale = 2): Promise<PagePixels[]> {
  ensureRequestAnimationFrame();
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const fontsDir = standardFontsDir();
  const doc = await pdfjs.getDocument(
    fontsDir ? { data, standardFontDataUrl: fontsDir + '/' } : { data },
  ).promise;
  let count = 0;
  try {
    count = doc.numPages;
  } finally {
    await doc.destroy();
  }
  const out: PagePixels[] = [];
  for (let p = 1; p <= count; p++) out.push(await analysePage(pdfPath, p, scale));
  return out;
}

/** Short label for a page's density, from measured coverage. */
export function densityBand(coverage: number): 'EMPTY' | 'SPARSE' | 'BALANCED' | 'DENSE' {
  if (coverage < 0.010) return 'EMPTY';
  if (coverage < 0.028) return 'SPARSE';
  if (coverage <= 0.085) return 'BALANCED';
  return 'DENSE';
}

/* ------------------------------------------------------------------ */
/* Targeted marker inspection                                          */
/* ------------------------------------------------------------------ */

/**
 * Text items with their positions, from pdfjs. Used to locate a region on a
 * page so a crop can be inspected without knowing the layout in advance.
 */
export interface TextItem { text: string; x: number; y: number; }

export async function pageTextItems(pdfPath: string, pageNumber: number): Promise<TextItem[]> {
  ensureRequestAnimationFrame();
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const fontsDir = standardFontsDir();
  const doc = await pdfjs.getDocument(
    fontsDir ? { data, standardFontDataUrl: fontsDir + '/' } : { data },
  ).promise;
  try {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    return (content.items as any[])
      .filter((it) => typeof it.str === 'string' && it.str.length > 0)
      .map((it) => ({ text: it.str, x: it.transform[4], y: it.transform[5] }));
  } finally {
    await doc.destroy();
  }
}
