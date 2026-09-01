/**
 * Shared, memoised artifacts for the V40.1 suite.
 *
 * Building the golden report costs a few hundred milliseconds and every spec
 * needs the same bytes. Memoising also means the semantic gate and the visual
 * gate look at the SAME document, which is the only way their verdicts can be
 * compared.
 */

import { generateKundliV41Pdf, type V41PipelineResult } from '../../../src/lib/kundli/v40/pipelineV3';
import { GOLDEN_BIRTH_INPUT } from '../goldenCanonical';
import { inspectPdf, type PdfInspection } from './pdfInspect';

/** Faces the renderer is allowed to embed. Anything else is a substitution. */
export const ALLOWED_FONTS = [
  'EBGaramond-Regular', 'EBGaramond-SemiBold', 'EBGaramond-Italic',
  'NotoSans-Regular', 'NotoSans-SemiBold',
  'NotoSerifDevanagari-Regular', 'NotoSerifDevanagari-SemiBold',
  'NotoSansDevanagari-Regular', 'NotoSansDevanagari-SemiBold',
  'DejaVuSans',
];

/**
 * The printable box, including page chrome.
 *
 * Wider than the CONTENT box on purpose: the running header and the folio sit
 * outside the content area by design, and a structural audit that flagged them
 * would be measuring the wrong thing.
 */
export const PRINT_BOX = {
  leftMm: 18, rightMm: 18, topMm: 10, bottomMm: 9,
  pageWidthMm: 210, pageHeightMm: 297,
};

let cached: Promise<{ result: V41PipelineResult; inspection: PdfInspection }> | null = null;

export function goldenV3Artifact(): Promise<{ result: V41PipelineResult; inspection: PdfInspection }> {
  if (!cached) {
    cached = (async () => {
      const result = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT, {
        // Fixed so the artifact is byte-stable for a given model.
        creationDate: new Date('2026-01-01T00:00:00.000Z'),
      });
      if (!result.pdfBuffer) {
        throw new Error(`v3 pipeline produced no PDF: ${result.state} ${result.errorCode ?? ''} ${JSON.stringify(result.errorDetails ?? null)}`);
      }
      const inspection = await inspectPdf(result.pdfBuffer);
      return { result, inspection };
    })();
  }
  return cached;
}

export const ARTIFACT_DIR = 'artifacts/kundli-v40';
export const BASELINE_DIR = 'tests/kundli-v40/visual-baseline';
export const VISUAL_OUT_DIR = 'artifacts/kundli-v40/visual';
