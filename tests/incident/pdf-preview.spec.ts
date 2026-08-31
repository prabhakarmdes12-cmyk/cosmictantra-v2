/**
 * PDF → PNG rasterization for visual inspection of generated artifacts
 * (Hindi Devanagari glyphs, layout, chart). Uses pdfjs + @napi-rs/canvas.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { renderPdfPageToPng } from './pdfRaster';

const OUT = path.join(process.cwd(), 'scratch', 'forensics');

test('rasterizes a PDF page to PNG (tooling check)', async () => {
  const src = path.join(OUT, 'legacy_454_pages.pdf');
  if (!fs.existsSync(src)) {
    test.skip(true, 'legacy artifact not present');
    return;
  }
  const info = await renderPdfPageToPng(src, 1, path.join(OUT, 'preview_p1.png'));
  expect(info.width).toBeGreaterThan(500);
  expect(fs.statSync(path.join(OUT, 'preview_p1.png')).size).toBeGreaterThan(10000);
});
