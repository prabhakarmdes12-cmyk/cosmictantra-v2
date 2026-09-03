/**
 * KUNDLI V41 §0 — the public Kundli download.
 *
 * THIS ROUTE IS THE PRODUCTION DOWNLOAD PATH. It runs pipeline v3
 * (`kundli-report-v2` + `kundli-pdf-renderer-v3`) and nothing else.
 *
 * ── Why a server route at all ────────────────────────────────────────────
 * Before V41 the "download" was a function call inside a client component,
 * which is why it silently kept returning V36 / `kundli-report-v1`: renderer
 * v3 physically cannot run in a browser. It reads nine font faces off disk
 * with `node:fs` and drives pdfkit with Node `Buffer`s. Shipping 1.7 MB of
 * fonts plus a shaping engine into the client bundle would be the wrong trade
 * even if it worked.
 *
 * Generating server-side also makes the artifact reproducible: the same input
 * yields the same bytes regardless of what fonts the visitor happens to have.
 *
 * ── What this route must never do ────────────────────────────────────────
 * Fall back to v1. A silent downgrade is how the V40.1 renderer became
 * unreachable in the first place, and it is invisible from the outside
 * because a v1 PDF looks like a PDF. If v3 cannot produce a document, this
 * route returns an ERROR. `DOWNLOAD_KUNDLI_CURRENT_RENDERER` asserts against
 * the bytes this route actually emits.
 *
 * v1 is preserved and still reachable — `src/lib/kundli/pipeline.ts` is
 * untouched, and the report page keeps its in-browser preview path.
 */

import { NextResponse } from 'next/server';
import { createRateLimiter, clientKeyFor } from '@/lib/rateLimit';
import { generateKundliV41Pdf } from '@/lib/kundli/v40/pipelineV3';
import { parseReportMode, MODE_DEFINITIONS, DOWNLOAD_CONTRACT, type ReportMode } from '@/lib/kundli/v40/reportModes';
import type { RawBirthInput } from '@/lib/kundli/types';
import { searchCities } from '@/lib/cities';

/** pdfkit, fontkit and `node:fs` — this cannot run on the edge. */
export const runtime = 'nodejs';
/** Every response is derived from the request body; nothing is cacheable. */
export const dynamic = 'force-dynamic';

/**
 * Rendering a Scholar edition is ~2s of CPU, nine font faces and a 38-page
 * layout — comfortably the most expensive endpoint in the app, and it takes
 * one unauthenticated POST to start one. Twelve per minute is far above what
 * a person clicking Download can produce (they must wait for each file) and
 * far below what makes the box unusable.
 */
const pdfLimiter = createRateLimiter({ limit: 12, windowMs: 60 * 1000 });

interface DownloadRequest {
  birth?: RawBirthInput;
  mode?: string;
  locale?: string;
  /** Return JSON diagnostics instead of the PDF. Used by the release gate. */
  inspect?: boolean;
}

/** Public PDF language contract. `hi-en` is a first-class report locale, not
 * a UI alias that quietly falls back to English. */
type DownloadLocale = 'en' | 'hi' | 'hi-en';
const asLocale = (v: unknown): DownloadLocale => {
  const locale = String(v ?? 'en');
  return locale === 'hi' || locale === 'hi-en' ? locale : 'en';
};

function filename(name: string | null | undefined, date: string | null | undefined, mode: ReportMode): string {
  const safe = (name || 'Kundli').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'Kundli';
  const dob = (date || '').replace(/[^0-9-]/g, '') || 'birth';
  return `Kundli_${safe}_${dob}_${mode}.pdf`;
}

export async function POST(request: Request) {
  const limited = pdfLimiter.check(clientKeyFor(request));
  if (limited) return limited;

  let body: DownloadRequest;
  try {
    body = (await request.json()) as DownloadRequest;
  } catch {
    return NextResponse.json(
      { ok: false, errorCode: 'KUNDLI_INPUT_INVALID', message: 'Request body was not valid JSON.' },
      { status: 400 },
    );
  }

  const birth = body.birth;
  if (!birth || typeof birth !== 'object') {
    return NextResponse.json(
      { ok: false, errorCode: 'KUNDLI_INPUT_INVALID', message: 'No birth details were supplied.' },
      { status: 400 },
    );
  }

  // Auto-resolve coordinates if city is supplied without coordinates
  const cityCandidate = (birth.locationName || (birth as any).city || '').trim();
  if ((!Number.isFinite(birth.latitude) || !Number.isFinite(birth.longitude)) && cityCandidate) {
    const hits = searchCities(cityCandidate);
    if (hits.length > 0) {
      birth.latitude = hits[0].lat;
      birth.longitude = hits[0].lng;
      if (!Number.isFinite(birth.utcOffsetHours)) {
        birth.utcOffsetHours = hits[0].tz ?? 5.5;
      }
      birth.locationName = `${hits[0].name}, ${hits[0].state}`;
      birth.coordinateProvenance = 'MANUAL';
    }
  }

  const mode = parseReportMode(body.mode);
  const locale = asLocale(body.locale);

  let result;
  try {
    result = await generateKundliV41Pdf(birth, { mode, locale, skipPdf: body.inspect === true });
  } catch (err) {
    // An exception here is a bug, not a bad request. Say so, and do NOT
    // quietly hand back a v1 document instead.
    console.error('[kundli/pdf] pipeline threw', err);
    return NextResponse.json(
      {
        ok: false,
        errorCode: 'KUNDLI_PDF_RENDER_FAILED',
        message: 'The Kundli could not be generated. No partial or fallback document is issued.',
      },
      { status: 500 },
    );
  }

  if (!result.ok || (!result.pdfBuffer && body.inspect !== true)) {
    return NextResponse.json(
      {
        ok: false,
        state: result.state,
        errorCode: result.errorCode ?? 'KUNDLI_PDF_RENDER_FAILED',
        message: 'The Kundli did not pass its release gates, so no document was issued.',
      },
      { status: 422 },
    );
  }

  if (body.inspect === true) {
    // Diagnostics only — never returns a document, so it cannot become a
    // second, unverified download path.
    return NextResponse.json({
      ok: true,
      state: result.state,
      mode: result.mode,
      locale,
      contract: DOWNLOAD_CONTRACT,
      reportModelVersion: result.report?.reportModelVersion ?? null,
      rendererVersion: result.rendererVersion,
      reportId: result.report?.reportId ?? null,
      sectionIds: result.report?.sections.map((s) => s.id) ?? [],
      droppedSectionIds: result.modeApplication?.droppedSectionIds ?? [],
      expectedPages: MODE_DEFINITIONS[result.mode].expectedPages,
    });
  }

  const pdf = result.pdfBuffer!;
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.byteLength),
      'Content-Disposition': `attachment; filename="${filename(birth.name, birth.birthDate, mode)}"`,
      'Cache-Control': 'no-store',
      // Machine-readable proof of what produced this file, so a regression is
      // visible from a HEAD request rather than only from reading the PDF.
      'X-Kundli-Report-Model': result.report?.reportModelVersion ?? 'unknown',
      'X-Kundli-Renderer': result.rendererVersion,
      'X-Kundli-Mode': result.mode,
      'X-Kundli-Locale': locale,
      'X-Kundli-Pages': String(result.metrics?.pageCount ?? 0),
    },
  });
}

/** Advertises what the route produces, without generating anything. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: DOWNLOAD_CONTRACT,
    modes: Object.values(MODE_DEFINITIONS).map((m) => ({
      mode: m.mode,
      label: m.label,
      description: m.description,
      includesAppendix: m.includesAppendix,
      expectedPages: m.expectedPages,
    })),
    locales: ['en', 'hi', 'hi-en'],
  });
}
