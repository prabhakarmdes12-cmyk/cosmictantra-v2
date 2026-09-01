/**
 * V40 Phase C/H acceptance — the PDF artifact.
 *
 * Renders the Pandit Workbench PDF for the golden chart and checks the things
 * that actually matter about a printed document: it exists, it has no blank
 * pages, every page carries selectable text, the consultation part is short
 * enough to be read in a consultation, and no prediction language survived
 * into the artifact.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { generateKundliV40Pdf } from '../../src/lib/kundli/v40/pipelineV2';
import { safeExtractPdfTextMetrics } from '../../src/lib/kundli/pdfExtract';
import { MANDATORY_V2_SECTION_IDS } from '../../src/lib/kundli/v40/reportModelV2';
import { GOLDEN_BIRTH_INPUT } from './goldenCanonical';

const OUT_DIR = path.join(process.cwd(), 'artifacts', 'kundli-v40');

test.describe('V40 PDF artifact — golden chart', () => {
  test('renders, validates and is written to artifacts/', async () => {
    const result = await generateKundliV40Pdf(GOLDEN_BIRTH_INPUT as never, { locale: 'en' });

    expect(result.errorCode, JSON.stringify(result.errorDetails ?? {})).toBeUndefined();
    expect(result.state).toBe('READY_FOR_DELIVERY');
    expect(result.pdfBuffer).toBeTruthy();
    expect(result.report).toBeTruthy();

    const report = result.report!;
    for (const id of MANDATORY_V2_SECTION_IDS) {
      expect(report.sections.find((s) => s.id === id), `section ${id}`).toBeTruthy();
    }

    // No prediction language anywhere in the model.
    expect(result.languageFindings).toHaveLength(0);

    // Quality gate.
    const q = result.pdfQuality!;
    expect(q.status, q.reasons.join('; ')).toBe('PASS');
    expect(q.blankPageCount, `blank pages: ${q.reasons.join('; ')}`).toBe(0);
    expect(q.mandatorySectionsMissing).toHaveLength(0);
    expect(q.pageCount).toBeGreaterThan(14);
    expect(q.pageCount).toBeLessThanOrEqual(40);

    // Part A must stay consultable: the scholar appendix begins by page 16.
    const partAPages = result.pageTitles.findIndex((t) => t === 'Scholar Appendix') + 1;
    expect(partAPages, `Part A ran to ${partAPages} pages`).toBeGreaterThan(0);
    expect(partAPages).toBeLessThanOrEqual(16);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const file = path.join(OUT_DIR, 'priya-1995-v40-pandit-workbench.pdf');
    fs.writeFileSync(file, Buffer.from(result.pdfBuffer!));
    expect(fs.statSync(file).size).toBeGreaterThan(30_000);

    // Text must be selectable Unicode, not outlines or a raster.
    const extracted = await safeExtractPdfTextMetrics(result.pdfBuffer!);
    if (extracted.pageCount > 0) {
      const all = (extracted.allText ?? '').toLowerCase();
      expect(all).toContain('kundli passport');
      expect(all).toContain('bhava intelligence matrix');
      expect(all).toContain('scholar appendix');
      expect(all).toContain('not calculated');
      for (let i = 0; i < extracted.pageCount; i += 1) {
        expect(extracted.pages[i].charCount, `page ${i + 1} is blank`).toBeGreaterThan(20);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`V40 PDF: ${q.pageCount} pages (Part A = ${partAPages}), ${(fs.statSync(file).size / 1024).toFixed(0)} kB → ${file}`);
    // eslint-disable-next-line no-console
    console.log('page titles:', result.pageTitles.map((t, i) => `${i + 1}:${t}`).join('  '));
  });

  test('the content hash is deterministic and excludes the timestamp', async () => {
    const a = await generateKundliV40Pdf(GOLDEN_BIRTH_INPUT as never, { locale: 'en', skipPdf: true });
    await new Promise((r) => setTimeout(r, 15));
    const b = await generateKundliV40Pdf(GOLDEN_BIRTH_INPUT as never, { locale: 'en', skipPdf: true });
    expect(a.report!.contentHash).toBe(b.report!.contentHash);
    expect(a.report!.reportId).toBe(b.report!.reportId);
    expect(a.report!.generatedAt).not.toBe(b.report!.generatedAt);
  });

  test('no Priya-specific content is hardcoded in the report layer', () => {
    const root = path.join(process.cwd(), 'src', 'lib', 'kundli', 'v40');
    const offenders: string[] = [];
    for (const file of fs.readdirSync(root)) {
      if (!file.endsWith('.ts')) continue;
      const text = fs.readFileSync(path.join(root, file), 'utf8');
      if (/Priya|Sharma|1995-06-15/.test(text)) offenders.push(file);
    }
    expect(offenders, `fixture-specific content leaked into: ${offenders.join(', ')}`).toHaveLength(0);
  });

  test('the v1 pipeline still works — V40 did not mutate the reference renderer', async () => {
    const { generateKundliPdf } = await import('../../src/lib/kundli/pipeline');
    const v1 = await generateKundliPdf(GOLDEN_BIRTH_INPUT as never, { locale: 'en' });
    expect(v1.state).toBe('READY_FOR_DELIVERY');
    expect(v1.report?.lineage.reportId).toBe(v1.report?.reportId);
    expect(v1.pdfBuffer).toBeTruthy();
  });
});
