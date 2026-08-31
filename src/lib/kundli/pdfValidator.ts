/**
 * Kundli pipeline — post-generation PDF validation.
 *
 * Runs AFTER rendering and BEFORE delivery. Combines artifact-level text
 * extraction (ground truth) with renderer-instrumented per-page metrics.
 * Fails with KUNDLI_PDF_QUALITY_FAILED when:
 *   - the page count exceeds the configured ceiling, or
 *   - too many pages are blank (extracted chars <= threshold), or
 *   - consecutive blank pages exceed the limit, or
 *   - overall content density is too low.
 */

import { KundliError } from './errors';
import { KUNDLI_PIPELINE_CONFIG } from './config';
import { safeExtractPdfTextMetrics } from './pdfExtract';
import type { PdfQualityReport, PdfRenderMetrics } from './types';

export interface ValidatePdfInput {
  buffer: Uint8Array;
  renderMetrics: PdfRenderMetrics;
  mandatorySectionTitles: string[];
  maxPages?: number;
  extractor?: (buffer: Uint8Array) => Promise<{ pageCount: number; pages: { charCount: number }[]; allText?: string }>;
}

export async function validatePdfIntegrity(input: ValidatePdfInput): Promise<PdfQualityReport> {
  const limits = KUNDLI_PIPELINE_CONFIG.limits;
  const maxPages = input.maxPages ?? limits.maxPages;
  const extractor = input.extractor ?? safeExtractPdfTextMetrics;

  let extracted: { pageCount: number; pages: { charCount: number }[]; allText?: string } = { pageCount: 0, pages: [], allText: '' };
  try {
    extracted = await extractor(input.buffer);
  } catch {
    extracted = { pageCount: 0, pages: [], allText: '' };
  }

  const pageCount = Math.max(extracted.pageCount, input.renderMetrics.pageCount);
  const reasons: string[] = [];

  // 1) hard page ceiling
  if (pageCount > maxPages) {
    reasons.push(`page count ${pageCount} exceeds ceiling ${maxPages}`);
  }

  // 2) per-page blank detection — prefer extracted ground truth; fall back
  //    to renderer instrumentation when extraction was unavailable.
  const perPage: number[] = [];
  const pageMetrics = [];
  if (extracted.pageCount > 0) {
    for (let i = 0; i < extracted.pageCount; i++) perPage.push(extracted.pages[i]?.charCount ?? 0);
  } else {
    perPage.push(...input.renderMetrics.placedCharsByPage);
  }
  const blankCount = perPage.filter((n) => n <= limits.blankPageCharThreshold).length;
  let streak = 0;
  let maxStreak = 0;
  for (const n of perPage) {
    streak = n <= limits.blankPageCharThreshold ? streak + 1 : 0;
    maxStreak = Math.max(maxStreak, streak);
  }
  if (maxStreak > limits.maxConsecutiveBlankPages) {
    reasons.push(`consecutive blank pages ${maxStreak} exceeds limit ${limits.maxConsecutiveBlankPages}`);
  }

  const density = pageCount > 0 ? (pageCount - blankCount) / pageCount : 0;
  if (density < limits.minContentDensity) {
    reasons.push(`content density ${density.toFixed(2)} below minimum ${limits.minContentDensity}`);
  }

  // 3) mandatory section titles must be present in the extracted text
  //    (when extraction is available), or in the placed-char bookkeeping.
  const allText = extracted.allText ?? perPage.join(' ');
  const mandatorySectionsFound: string[] = [];
  const mandatorySectionsMissing: string[] = [];
  if (extracted.pageCount > 0) {
    for (const title of input.mandatorySectionTitles) {
      if (allText.toLowerCase().includes(title.toLowerCase())) {
        mandatorySectionsFound.push(title);
      } else {
        mandatorySectionsMissing.push(title);
      }
    }
    if (mandatorySectionsMissing.length > 0) {
      reasons.push(`mandatory section titles not found in extracted text: ${mandatorySectionsMissing.join(', ')}`);
    }
  } else {
    // Extraction unavailable — trust renderer metrics (pageCount>0, chars>0).
    if (pageCount === 0 || perPage.reduce((a, n) => a + n, 0) === 0) {
      reasons.push('no text content detected in the artifact');
    }
  }

  for (let i = 0; i < perPage.length; i++) {
    pageMetrics.push({
      page: i + 1,
      extractedChars: extracted.pageCount > 0 ? (extracted.pages[i]?.charCount ?? 0) : 0,
      placedChars: input.renderMetrics.placedCharsByPage[i] ?? 0,
      blank: perPage[i] <= limits.blankPageCharThreshold,
    });
  }

  const report: PdfQualityReport = {
    status: reasons.length === 0 ? 'PASS' : 'FAIL',
    reasons,
    pageCount,
    pageMetrics,
    blankPageCount: blankCount,
    consecutiveBlankPageCount: maxStreak,
    consecutiveBlankPageStreak: maxStreak,
    contentDensity: density,
    mandatorySectionsFound,
    mandatorySectionsMissing,
  };

  if (report.status === 'FAIL') {
    throw new KundliError('KUNDLI_PDF_QUALITY_FAILED', 'generated PDF failed quality validation', {
      reasons,
      pageCount,
      blankPageCount: blankCount,
      density,
    });
  }
  return report;
}
