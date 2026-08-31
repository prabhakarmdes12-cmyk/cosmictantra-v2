import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { generateKundliPdf } from '../../src/lib/kundli/pipeline';
import { renderPdfPageToPng } from './pdfRaster';

/**
 * Hindi-locale artifact: the pipeline must deliver, the Devanagari font
 * (auto-loaded from public/fonts in Node) must be embedded, Devanagari
 * characters must be extractable, and a page must rasterize.
 */
test('hindi locale artifact delivers with Devanagari rendering', async () => {
  const r = await generateKundliPdf({
    name: 'सीकर', birthDate: '1995-06-15', birthTime: '10:30',
    locationName: 'बिलासपुर, भारत', latitude: 25.5941, longitude: 82.1391,
    coordinateProvenance: 'MANUAL', timezoneId: 'Asia/Kolkata'
  }, { locale: 'hi' });

  expect(r.state).toBe('READY_FOR_DELIVERY');
  expect(r.pdfQuality?.status).toBe('PASS');
  expect(r.pdfQuality?.pageCount).toBeGreaterThan(1);
  expect(r.pdfQuality?.blankPageCount).toBe(0);

  const out = path.join(process.cwd(), 'scratch', 'forensics', 'hindi_pipeline.pdf');
  fs.writeFileSync(out, r.pdfBuffer!);

  // Rasterizes (glyph rendering works in Node via @napi-rs/canvas)
  const info = await renderPdfPageToPng(out, 2, path.join(process.cwd(), 'scratch', 'forensics', 'hindi_p2.png'), 1.5);
  expect(info.width).toBeGreaterThan(500);

  // Devanagari chars present in extracted text (cover invocation + name)
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(out));
  const doc = await pdfjs.getDocument({ data }).promise;
  let dev = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const pg = await doc.getPage(p);
    const tc = await pg.getTextContent();
    for (const it of tc.items as any[]) {
      for (const ch of String(it.str)) if (/[\u0900-\u097F]/.test(ch)) dev++;
    }
  }
  expect(dev).toBeGreaterThan(20);
  await doc.destroy();
});
