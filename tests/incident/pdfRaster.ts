/**
 * PDF → PNG rasterization tooling (pdfjs + @napi-rs/canvas), shared by
 * incident specs. Not a test file itself.
 */
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

declare const require: any;

/**
 * When pipeline/jsPDF modules run earlier in the same worker, jsPDF's Node
 * polyfill sets globalThis.window = globalThis; pdfjs then takes its DOM
 * render path and needs requestAnimationFrame. Normalize it so rasterization
 * is order-independent.
 */
function ensureRequestAnimationFrame(): void {
  const w: any = (globalThis as any).window ?? globalThis;
  if (typeof w.requestAnimationFrame !== 'function') {
    w.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 0);
    w.cancelAnimationFrame = (id: unknown) => clearTimeout(id as any);
  }
}


function standardFontsDir(): string {
  try {
    if (typeof require !== 'undefined' && typeof require.resolve === 'function') {
      // pdfjs's Node build reads base-14 standard fonts straight from disk
      // (NodeStandardFontDataFactory), so standardFontDataUrl must be a
      // FILESYSTEM PATH here (browser builds use an http URL instead).
      const pkgJson = require.resolve('pdfjs-dist/package.json');
      return path.join(path.dirname(pkgJson), 'standard_fonts');
    }
  } catch { /* ignore */ }
  return '';
}

export async function renderPdfPageToPng(
  pdfPath: string,
  pageNumber: number,
  outPng: string,
  scale = 1.5
): Promise<{ width: number; height: number }> {
  ensureRequestAnimationFrame();
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const fontsDir = standardFontsDir();
  const doc = await getDocument(fontsDir ? { data, standardFontDataUrl: fontsDir + '/' } : { data }).promise;
  try {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext('2d') as any;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const buf = canvas.toBuffer('image/png');
    fs.mkdirSync(path.dirname(outPng), { recursive: true });
    fs.writeFileSync(outPng, buf);
    return { width: viewport.width, height: viewport.height };
  } finally {
    await doc.destroy();
  }
}
