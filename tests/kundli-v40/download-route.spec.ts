/**
 * KUNDLI V41 §0 — DOWNLOAD_KUNDLI_CURRENT_RENDERER
 *
 * The release gate for the public download.
 *
 * The V40 and V40.1 sprints both shipped a working renderer that no user ever
 * received, because the download button called a different code path and
 * nothing asserted otherwise. Every test passed. The product was wrong.
 *
 * This gate exists so that cannot recur. It does not test the renderer, the
 * pipeline, or the report model — those have their own suites. It tests THE
 * ARTIFACT THE ROUTE HANDLER RETURNS, by invoking the exported `POST` with a
 * real Request and reading the bytes of the response body.
 *
 * If someone re-points the route at v1, changes the default mode, or adds a
 * fallback, this fails.
 */

import { test, expect } from '@playwright/test';
import { POST, GET } from '../../src/app/api/kundli/pdf/route';
import { DOWNLOAD_CONTRACT } from '../../src/lib/kundli/v40/reportModes';
import { GOLDEN_BIRTH_INPUT } from './goldenCanonical';
import { inspectPdf } from './qa/pdfInspect';

const ROUTE = 'http://localhost/api/kundli/pdf';

/**
 * Each call presents a distinct client IP.
 *
 * The route is rate limited per client key, and these specs legitimately make
 * ~20 requests. Giving each its own key exercises the real limiter rather than
 * switching it off for tests; DKCR-15 then exhausts a single key on purpose.
 */
let clientSeq = 0;
const post = (body: unknown, ip?: string) =>
  POST(new Request(ROUTE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip ?? `10.0.0.${(clientSeq += 1) % 250}`,
    },
    body: JSON.stringify(body),
  }));

async function downloadBytes(body: unknown): Promise<{ res: Response; bytes: Uint8Array }> {
  const res = await post(body);
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { res, bytes };
}

test.describe.configure({ mode: 'parallel' });

test.describe('DOWNLOAD_KUNDLI_CURRENT_RENDERER', () => {
  /* ── The core assertion ─────────────────────────────────────────────── */

  test('DKCR-01: the download route returns a renderer-v3 / report-v2 PDF', async () => {
    const { res, bytes } = await downloadBytes({ birth: GOLDEN_BIRTH_INPUT });

    expect(res.status, 'the golden fixture must always download').toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');

    // A PDF, not a JSON error body that happens to have a 200.
    expect(Buffer.from(bytes.slice(0, 5)).toString('latin1')).toBe('%PDF-');

    // The contract, declared by the route and asserted here.
    expect(res.headers.get('X-Kundli-Report-Model')).toBe(DOWNLOAD_CONTRACT.reportModelVersion);
    expect(res.headers.get('X-Kundli-Renderer')).toBe(DOWNLOAD_CONTRACT.rendererVersion);
  });

  test('DKCR-02: no v1 fingerprint survives anywhere a client reads', async () => {
    // Scoped to the PANDIT edition because that edition IS Part A — it carries
    // no appendix at all. The Scholar appendix legitimately records `V36.0`
    // (the calculation-engine version) in its engine-versions table; §25 says
    // preserve every version there. What must never appear is a v1 fingerprint
    // in the body of the document.
    const { bytes } = await downloadBytes({ birth: GOLDEN_BIRTH_INPUT, mode: 'PANDIT' });
    const partA = (await inspectPdf(bytes)).allText;

    expect(partA, 'V36.0 is the v1 engine banner').not.toContain('V36.0');
    expect(partA).not.toContain('kundli-report-v1');
    expect(partA).not.toContain('kundli-pdf-renderer-v1');
  });

  test('DKCR-02b: the appendix records the real report model, and it is v2', async () => {
    const { bytes } = await downloadBytes({ birth: GOLDEN_BIRTH_INPUT, mode: 'SCHOLAR' });
    const doc = await inspectPdf(bytes);
    // §25: the appendix preserves everything. If it claimed v1 here, the
    // headers would be lying.
    expect(doc.allText).toContain(DOWNLOAD_CONTRACT.reportModelVersion);
    expect(doc.allText).not.toContain('kundli-report-v1');
  });

  test('DKCR-03: the download is drawn by the v3 font stack, not jsPDF', async () => {
    const { bytes } = await downloadBytes({ birth: GOLDEN_BIRTH_INPUT });
    const doc = await inspectPdf(bytes);

    // jsPDF (v1) emits the base-14 Helvetica. Renderer v3 embeds real faces.
    // mupdf truncates subset names at 24 chars, so compare loosely.
    const names = doc.fonts.join('|');
    expect(names, 'Helvetica means the jsPDF renderer produced this').not.toMatch(/Helvetica/i);
    expect(names).toMatch(/Garamond|NotoSerif|NotoSans/i);
  });

  test('DKCR-04: v1 is a 19-page document; the download must not be one', async () => {
    const { bytes } = await downloadBytes({ birth: GOLDEN_BIRTH_INPUT });
    const doc = await inspectPdf(bytes);
    expect(doc.pageCount).toBeGreaterThan(19);
  });

  /* ── Mode selection (§1) ────────────────────────────────────────────── */

  test('DKCR-05: the default download is the Scholar edition', async () => {
    const { res } = await downloadBytes({ birth: GOLDEN_BIRTH_INPUT });
    expect(res.headers.get('X-Kundli-Mode'), 'default = PANDIT + SCHOLAR APPENDIX').toBe('SCHOLAR');
  });

  test('DKCR-06: every mode downloads, and CLIENT is the shortest', async () => {
    const pages: Record<string, number> = {};
    for (const mode of ['CLIENT', 'PANDIT', 'SCHOLAR']) {
      const { res, bytes } = await downloadBytes({ birth: GOLDEN_BIRTH_INPUT, mode });
      expect(res.status, `${mode} must download`).toBe(200);
      expect(res.headers.get('X-Kundli-Mode')).toBe(mode);
      // Every mode is the same renderer. Modes change density, not lineage.
      expect(res.headers.get('X-Kundli-Renderer')).toBe(DOWNLOAD_CONTRACT.rendererVersion);
      pages[mode] = (await inspectPdf(bytes)).pageCount;
    }
    expect(pages.CLIENT).toBeLessThan(pages.PANDIT);
    expect(pages.PANDIT).toBeLessThan(pages.SCHOLAR);
  });

  test('DKCR-07: an unrecognised mode falls back to the fullest edition, not an error', async () => {
    const { res } = await downloadBytes({ birth: GOLDEN_BIRTH_INPUT, mode: 'nonsense' });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Kundli-Mode')).toBe('SCHOLAR');
  });

  test('DKCR-08: only the Scholar edition carries the engineering appendix', async () => {
    for (const [mode, expected] of [['CLIENT', false], ['PANDIT', false], ['SCHOLAR', true]] as const) {
      const res = await post({ birth: GOLDEN_BIRTH_INPUT, mode, inspect: true });
      const body = await res.json();
      const hasAppendix = body.sectionIds.some((id: string) => id.startsWith('appendix-'));
      expect(hasAppendix, `${mode} appendix presence`).toBe(expected);
    }
  });

  /* ── Locale plumbing (§2 groundwork) ────────────────────────────────── */

  test('DKCR-09: the locale reaches the renderer', async () => {
    const en = await inspectPdf((await downloadBytes({ birth: GOLDEN_BIRTH_INPUT, locale: 'en' })).bytes);
    const hi = await inspectPdf((await downloadBytes({ birth: GOLDEN_BIRTH_INPUT, locale: 'hi' })).bytes);
    // Not a completeness claim — §3 owns that. Only that the two differ, so
    // the parameter is not being dropped on the floor.
    expect(hi.allText).not.toBe(en.allText);
  });

  test('DKCR-09b: hi-en is a public bilingual PDF, never an English fallback', async () => {
    const { res, bytes } = await downloadBytes({ birth: GOLDEN_BIRTH_INPUT, locale: 'hi-en' });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Kundli-Locale')).toBe('hi-en');

    const bilingual = await inspectPdf(bytes);
    // The bilingual model uses Hindi reader prose alongside bilingual terms;
    // checking both scripts proves this is a real third artifact rather than
    // an alias that quietly goes back to the English default.
    expect(bilingual.allText).toMatch(/[\u0900-\u097F]/);
    expect(bilingual.allText).toContain('Kundli Passport');
  });

  /* ── No silent fallback ─────────────────────────────────────────────── */

  test('DKCR-10: a rejected input yields an error, never a document', async () => {
    for (const bad of [{}, { birth: null }, { birth: { name: 'X' } }]) {
      const res = await post(bad);
      expect(res.status, `${JSON.stringify(bad)} must not download`).toBeGreaterThanOrEqual(400);
      expect(res.headers.get('Content-Type') ?? '').not.toContain('application/pdf');
    }
  });

  test('DKCR-11: malformed JSON is refused', async () => {
    const res = await POST(new Request(ROUTE, {
      method: 'POST', body: 'not json',
      headers: { 'x-forwarded-for': '10.9.9.9' },
    }));
    expect(res.status).toBe(400);
  });

  test('DKCR-15: one client cannot spin the renderer without limit', async () => {
    // Rendering a Scholar edition is the most expensive thing this app does.
    // Cheap rejections (bad input) still count against the budget, so the
    // limiter cannot be bypassed by alternating good and bad requests.
    const ip = '203.0.113.7';
    let sawLimit = false;
    for (let i = 0; i < 20; i += 1) {
      const res = await post({}, ip);
      if (res.status === 429) { sawLimit = true; break; }
    }
    expect(sawLimit, 'the endpoint must be rate limited').toBe(true);

    // A different client is unaffected.
    const other = await post({}, '203.0.113.8');
    expect(other.status).toBe(400);
  });

  test('DKCR-12: the route advertises its contract and all public locales without generating', async () => {
    const body = await (await GET()).json();
    expect(body.contract).toEqual(DOWNLOAD_CONTRACT);
    expect(body.modes.map((m: { mode: string }) => m.mode)).toEqual(['CLIENT', 'PANDIT', 'SCHOLAR']);
    expect(body.locales).toEqual(['en', 'hi', 'hi-en']);
  });

  /* ── The UI is wired to this route ──────────────────────────────────── */

  test('DKCR-13: the report page downloads via the API, not the v1 pipeline', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile('src/app/report/MasterKundliReportClient.tsx', 'utf8');
    const requestStart = src.indexOf('const requestQualifiedPdf');
    const request = src.slice(requestStart, src.indexOf('const handleDownloadPDF', requestStart));
    const handlerStart = src.indexOf('const handleDownloadPDF');
    const handler = src.slice(handlerStart, src.indexOf('const handleSaveProfile', handlerStart));

    // One request helper, one click handler. Assert at that actual boundary
    // rather than assuming the click handler owns the fetch itself.
    expect(handler, 'the download handler must call the qualified request helper').toContain('requestQualifiedPdf()');
    expect(request, 'the qualified request helper must call the API route').toContain('/api/kundli/pdf');
    expect(request, 'the qualified request helper must not call the v1 pipeline').not.toContain('generateKundliPdf(');
  });

  test('DKCR-13b: the toolbar is decluttered — one edition, one language source, no print path', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile('src/app/report/MasterKundliReportClient.tsx', 'utf8');
    const sharedRequest = src.slice(
      src.indexOf('const requestQualifiedPdf'),
      src.indexOf('const handleDownloadPDF'),
    );

    // The download still goes through the qualified route with a real payload.
    expect(sharedRequest).toContain("fetch('/api/kundli/pdf'");
    expect(sharedRequest).toContain('locale: pdfLocale');
    expect(sharedRequest).toContain('mode: PDF_EDITION');

    // No second path to the same bytes. Printing the interactive HTML was never
    // allowed (it is not the qualified document), and the PDF the visitor
    // downloads carries its own Print command.
    expect(src, 'no browser print dialog').not.toContain('window.print()');
    expect(src, 'no print handler').not.toContain('const handlePrint');
    expect(src, 'no print window hand-off').not.toContain('printWindow');
    expect(src, 'no printer icon in the toolbar').not.toMatch(/^\s*Printer,/m);

    // Edition and language are policy, not toolbar state: the edition is the
    // complete qualified folio and the locale follows the sitewide language the
    // Global Header already owns. Both live in lib/kundli/downloadPolicy.ts.
    expect(src).not.toContain('aria-label="Qualified PDF edition"');
    expect(src).not.toContain('aria-label="Qualified PDF language"');
    expect(src).not.toContain('setPdfMode');
    expect(src).not.toContain('setPdfLocale');
    expect(src).toContain('const pdfLocale = pdfLocaleForLang(lang)');
    expect(src).toContain("from '@/lib/kundli/downloadPolicy'");

    // What the visitor keeps: save the profile, download the document.
    expect(src).toContain('handleSaveProfile');
    expect(src).toContain('data-testid="report-download-pdf"');

    const policy = await fs.readFile('src/lib/kundli/downloadPolicy.ts', 'utf8');
    expect(policy).toContain("export const PDF_EDITION = 'SCHOLAR'");
    expect(policy).toContain("'hi-en'");
  });

  test('DKCR-14: v1 is preserved, not deleted', async () => {
    const fs = await import('node:fs/promises');
    // §0 says fix the route, do NOT remove v1. It stays available as the
    // regression reference the V40 acceptance criteria depend on.
    for (const f of ['src/lib/kundli/pipeline.ts', 'src/lib/kundli/renderer.ts', 'src/lib/kundli/reportModel.ts']) {
      await expect(fs.access(f), `${f} must still exist`).resolves.toBeUndefined();
    }
  });

  test('DKCR-16: the Kundli workspace Download Book carries the viewed chart into /report', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile('src/app/kundli/[id]/KundliWorkspaceClient.tsx', 'utf8');
    const start = src.indexOf('const reportHref');
    expect(start, 'the workspace must build a report URL from the chart profile').toBeGreaterThan(-1);
    const reportHref = src.slice(start, src.indexOf('const tabs =', start));

    // Download Book should not navigate to a bare /report and silently drop
    // the profile the user is viewing (see DKCR-13's same-route wiring rule).
    expect(reportHref).toContain('/report?name=');
    expect(reportHref).toContain('birthContext.birthDate');
    expect(reportHref).toContain('birthContext.birthTime');
    expect(reportHref).toContain('birthContext.latitude');
    expect(reportHref).toContain('birthContext.longitude');
    expect(reportHref).toContain('birthContext.timezone');
    expect(src, 'the header action must use the context-aware URL').toContain('href={reportHref}');
  });

  test('DKCR-17: the cover names the edition actually downloaded', async () => {
    // Cover labels come from the mode, not the renderer default. A Client
    // Reading printed as "Pandit Workbench Edition" tells a novice the
    // document is not for them before they read a single line.
    const cases = [
      ['CLIENT', 'en', 'CLIENT READING'],
      ['PANDIT', 'en', 'PANDIT WORKBENCH'],
      ['SCHOLAR', 'en', 'SCHOLAR EDITION'],
      ['CLIENT', 'hi', 'जातक पाठ'],
      ['SCHOLAR', 'hi-en', /शास्त्री संस्करण.*SCHOLAR EDITION|SCHOLAR EDITION.*शास्त्री संस्करण/],
    ] as const;
    for (const [mode, locale, expectLabel] of cases) {
      const bytes = (await downloadBytes({ birth: GOLDEN_BIRTH_INPUT, mode, locale })).bytes;
      const doc = await inspectPdf(bytes);
      const cover = doc.pages[0].text;
      if (expectLabel instanceof RegExp) {
        expect(cover, `${mode}/${locale} cover label`).toMatch(expectLabel);
      } else {
        expect(cover, `${mode}/${locale} cover label`).toContain(expectLabel);
      }
    }
  });

  test('DKCR-18: no appendix xref survives in editions that omit the appendix', async () => {
    const appendixPattern = /(Appendix|APPENDIX|परिशिष्ट)/i;
    for (const mode of ['CLIENT', 'PANDIT'] as const) {
      for (const locale of ['en', 'hi', 'hi-en'] as const) {
        const bytes = (await downloadBytes({ birth: GOLDEN_BIRTH_INPUT, mode, locale })).bytes;
        const text = (await inspectPdf(bytes)).allText;
        expect(text, `${mode}/${locale} must not point at an absent appendix`).not.toMatch(appendixPattern);
      }
    }
  });
});
