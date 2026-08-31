/**
 * Kundli pipeline — PDF text extraction.
 *
 * pdfjs-based ground-truth extraction of the generated artifact (Node-only).
 * `safeExtractPdfTextMetrics` never throws: on any failure it returns an
 * empty result and the validator falls back to renderer-instrumented
 * metrics so validation can still run everywhere.
 *
 * Node notes (verified empirically):
 *  - `GlobalWorkerOptions.workerSrc` must point at the legacy worker file or
 *    repeated getDocument() calls in one process fail on the 2nd call with
 *    "Cannot transfer object of unsupported type".
 *  - a fresh copy of the buffer must be passed each time (transfer detaches
 *    the original).
 */

export interface PdfExtractionResult {
  pageCount: number;
  pages: { charCount: number }[];
  /** Full extracted text (per-page items joined), for title checks. */
  allText: string;
}

export type PdfExtractor = (buffer: Uint8Array) => Promise<PdfExtractionResult>;

let workerConfigured = false;

/**
 * Node-only: point pdfjs at its worker file so repeated getDocument() calls
 * in one process do not fail with "Cannot transfer object of unsupported
 * type". Uses dynamic requires so webpack (browser bundle) never tries to
 * resolve Node builtins — the guard keeps this path inert in the browser.
 */
function configureNodeWorker(): void {
  // Browser bundles polyfill `process`, so guard on the absence of `window`
  // (Node-only). In the browser pdfjs manages its own worker/fake worker.
  if (workerConfigured || typeof window !== 'undefined' || typeof process === 'undefined') return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeRequire = typeof require === 'function' ? (require as unknown as ((id: string) => unknown) & { resolve: (id: string) => string }) : null;
  if (!nodeRequire) return;
  try {
    const pathMod = nodeRequire('pat' + 'h') as typeof import('path');
    const pkgPath = nodeRequire.resolve('pdfjs-dist/package.json');
    const workerUrl = pathMod.join(pathMod.dirname(pkgPath), 'legacy', 'build', 'pdf.worker.mjs');
    const pdfjs = nodeRequire('pdfjs-dist/legacy/build/pdf.mjs') as typeof import('pdfjs-dist/legacy/build/pdf.mjs');
    const urlMod = nodeRequire('ur' + 'l') as typeof import('url');
    pdfjs.GlobalWorkerOptions.workerSrc = urlMod.pathToFileURL(workerUrl).href;
    workerConfigured = true;
  } catch {
    workerConfigured = true; // browsers: workerSrc not needed
  }
}

/** Node-only: filesystem path to pdfjs's bundled base-14 fonts (Helvetica
 * etc.). The generated PDFs use Helvetica for Latin text; without these
 * fonts pdfjs cannot extract text and every extraction silently fails.
 * Returns '' when resolution fails (browser bundles / exotic layouts). */
function standardFontsDir(): string {
  if (typeof window !== 'undefined') return '';
  try {
    const nodeRequire = typeof require === 'function'
      ? (require as unknown as { resolve: (id: string) => string })
      : null;
    if (!nodeRequire) return '';
    const pkgPath = nodeRequire.resolve('pdfjs-dist/package.json');
    const pathMod = process.getBuiltinModule('node:path') as typeof import('path');
    return pathMod.join(pathMod.dirname(pkgPath), 'standard_fonts');
  } catch {
    return '';
  }
}

/** pdfjs-based extractor (Node-only). */
export async function extractPdfTextMetrics(buffer: Uint8Array): Promise<PdfExtractionResult> {
  configureNodeWorker();
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // Fresh copy per call — pdfjs transfers/detaches the buffer.
  const fontsDir = standardFontsDir();
  const doc = await getDocument(
    fontsDir ? { data: buffer.slice(), standardFontDataUrl: fontsDir + '/' } : { data: buffer.slice() }
  ).promise;
  try {
    const pageCount = doc.numPages;
    const pages: { charCount: number }[] = [];
    const textChunks: string[] = [];
    for (let p = 1; p <= pageCount; p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      const items = tc.items as { str?: string }[];
      let n = 0;
      for (const it of items) {
        if (it.str) {
          n += it.str.length;
          textChunks.push(it.str);
        }
      }
      pages.push({ charCount: n });
    }
    return { pageCount, pages, allText: textChunks.join(' ') };
  } finally {
    await doc.destroy().catch(() => undefined);
  }
}

/** Never-throwing extractor: falls back to an empty result on failure. */
export async function safeExtractPdfTextMetrics(buffer: Uint8Array): Promise<PdfExtractionResult> {
  try {
    return await extractPdfTextMetrics(buffer);
  } catch {
    // Extraction failed (e.g. no font data in this environment) — the
    // validator falls back to renderer-instrumented metrics.
    return { pageCount: 0, pages: [], allText: '' };
  }
}
