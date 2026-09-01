/**
 * Generates the Scholar Kundli PDF artifact for PRIYA-1995-GK-NEGATIVE and
 * asserts the delivered PDF carries the rule-evaluated yoga section.
 *
 * Artifacts (not committed):
 *   artifacts/scholar-kundli/priya-1995-gk-negative.pdf
 *   artifacts/scholar-kundli/priya-1995-gk-negative.pages.txt
 *   artifacts/scholar-kundli/priya-1995-gk-negative.p*.png
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createKundliPdfGenerator } from '../../src/lib/kundli/pipeline';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { extractPdfTextMetrics } from '../../src/lib/kundli/pdfExtract';
import { renderPdfPageToPng } from '../incident/pdfRaster';

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'scholar-kundli');

/** Per-page text extraction, used to prove nothing on a page is clipped away. */
async function extractPerPageText(pdfPath: string, pageCount: number): Promise<string[]> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await getDocument({ data }).promise;
  try {
    const out: string[] = [];
    for (let p = 1; p <= pageCount; p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      out.push((tc.items as { str?: string }[]).map((i) => i.str ?? '').join(' '));
    }
    return out;
  } finally {
    await doc.destroy().catch(() => undefined);
  }
}

const PROFILE = {
  name: 'Priya Sharma',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  locationName: 'Patna',
  latitude: 25.5941,
  longitude: 85.1376,
  coordinateProvenance: 'MANUAL' as const,
  timezoneId: 'Asia/Kolkata',
};
test('PRIYA-1995-GK-NEGATIVE — generate and inspect the delivered PDF', async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const generate = createKundliPdfGenerator(getCanonicalJyotishSnapshot);
  const result = await generate(PROFILE, { locale: 'en' });

  if (!result.ok) console.log('[pipeline] FAILED', result.errorCode, JSON.stringify(result.errorDetails));
  expect(result.ok, `pipeline failed: ${result.errorCode} ${result.errorDetails}`).toBe(true);
  expect(result.pdfBuffer).toBeTruthy();
  expect(result.pdfQuality!.pageCount).toBeGreaterThan(0);
  expect(result.pdfQuality!.pageCount).toBeLessThanOrEqual(40);

  const buf = Buffer.from(result.pdfBuffer!);
  const pdfPath = path.join(OUT_DIR, 'priya-1995-gk-negative.pdf');
  fs.writeFileSync(pdfPath, buf);

  const metrics = await extractPdfTextMetrics(new Uint8Array(buf));
  const perPage = await extractPerPageText(pdfPath, metrics.pageCount);
  const blankPages = metrics.pages.filter((p) => p.charCount < 20).length;
  const density = metrics.pageCount > 0 ? (metrics.pageCount - blankPages) / metrics.pageCount : 0;
  fs.writeFileSync(
    path.join(OUT_DIR, 'priya-1995-gk-negative.pages.txt'),
    perPage.map((t, i) => `===== PAGE ${i + 1} =====\n${t}`).join('\n\n'),
  );

  // Rasterise every page so the PDF can be visually inspected.
  for (let i = 1; i <= metrics.pageCount; i++) {
    const out = path.join(OUT_DIR, `priya-1995-gk-negative.p${String(i).padStart(2, '0')}.png`);
    await renderPdfPageToPng(pdfPath, i, out);
  }

  console.log(`[artifact] ${pdfPath}`);
  console.log(`[artifact] pages=${metrics.pageCount} blankPages=${blankPages} density=${density}`);

  // --- assertions on the delivered content -------------------------------
  const all = metrics.allText.toLowerCase();
  expect(all).toContain('major yogas');
  expect(all).toContain('gaja-kesari');
  expect(all).toContain('absent');
  expect(all).toContain('not calculated');

  // The old unconditional declarations must be gone from the PDF too.
  expect(all).not.toContain('9th/10th lord resonance');
  expect(all).not.toContain('sun-mercury intellect conjunction');
  expect(all).not.toContain('jupiter in kendra from moon');

  // No blank pages, no runaway pagination.
  expect(blankPages).toBe(0);
  expect(density).toBeGreaterThanOrEqual(0.5);
  expect(metrics.pageCount).toBeLessThanOrEqual(40);
});
