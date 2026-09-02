/**
 * KUNDLI V42 — public Kundli Milan (Ashtakoota / 36-Guna) endpoint.
 *
 * The route accepts either:
 *   - two Moon placements directly (`bride`/`groom` with rashiName,
 *     nakshatraName, pada, rashiLord), or
 *   - two full birth profiles (`brideBirth`/`groomBirth`), in which case it
 *     runs the canonical snapshot for each and derives the Moon placement.
 *
 * It returns a PDF by default (the same CLIENT/PANDIT/SCHOLAR + locale
 * contract as /api/kundli/pdf). `inspect: true` returns JSON diagnostics only
 * and never a document, so the route cannot become a second unverified
 * download path.
 */
import { NextResponse } from 'next/server';
import { createRateLimiter, clientKeyFor } from '@/lib/rateLimit';
import { calculateMilan, milanInputFromSnapshot, milanContextFromSnapshot, isValidMilanInput, type MilanPersonInput, type MilanChartContext, type MilanOptions } from '@/lib/kundli/v42/milan/milanEngine';
import { generateMilanPdf, MILAN_RENDERER_VERSION, type MilanPdfMode } from '@/lib/kundli/v42/milan/milanPdf';
import { getCanonicalJyotishSnapshot } from '@/lib/jyotish/canonicalSnapshot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const limiter = createRateLimiter({ limit: 24, windowMs: 60 * 1000 });

type MilanoLocale = 'en' | 'hi' | 'hi-en';

const asLocale = (v: unknown): MilanoLocale => {
  const s = String(v ?? 'en');
  return s === 'hi' || s === 'hi-en' ? s : 'en';
};

const asMode = (v: unknown): MilanPdfMode => {
  const s = String(v ?? 'SCHOLAR').toUpperCase();
  return s === 'CLIENT' || s === 'PANDIT' ? s : 'SCHOLAR';
};

interface MilanRequest {
  bride?: Partial<MilanPersonInput>;
  groom?: Partial<MilanPersonInput>;
  brideBirth?: Record<string, unknown>;
  groomBirth?: Record<string, unknown>;
  brideCtx?: MilanChartContext;
  groomCtx?: MilanChartContext;
  mode?: string;
  locale?: string;
  source?: string;
  inspect?: boolean;
}

/** Derive a Moon placement + chart context from a canonical snapshot. */
function chartFromBirthInput(birth: Record<string, unknown>): { person: MilanPersonInput; ctx: MilanChartContext } {
  const snapshot = getCanonicalJyotishSnapshot({
    birthDate: String(birth.birthDate ?? ''),
    birthTime: String(birth.birthTime ?? '12:00'),
    latitude: Number(birth.latitude ?? Number.NaN),
    longitude: Number(birth.longitude ?? Number.NaN),
    timezone: Number(birth.timezone ?? birth.tz ?? birth.utcOffsetHours ?? 5.5),
    locationName: String(birth.locationName ?? birth.name ?? ''),
  });
  return { person: milanInputFromSnapshot(snapshot), ctx: milanContextFromSnapshot(snapshot) };
}

function filename(mode: MilanPdfMode): string {
  return `Kundli_Milan_${mode}.pdf`;
}

export async function POST(request: Request) {
  const limited = limiter.check(clientKeyFor(request));
  if (limited) return limited;

  let body: MilanRequest;
  try {
    body = (await request.json()) as MilanRequest;
  } catch {
    return NextResponse.json(
      { ok: false, errorCode: 'MILAN_INPUT_INVALID', message: 'Request body was not valid JSON.' },
      { status: 400 },
    );
  }

  const mode = asMode(body.mode);
  const locale = asLocale(body.locale);

  let bride = body.bride;
  let groom = body.groom;
  let brideCtx: MilanChartContext = body.brideCtx ?? {};
  let groomCtx: MilanChartContext = body.groomCtx ?? {};
  try {
    if (!bride) {
      const r = chartFromBirthInput(body.brideBirth ?? {});
      bride = r.person;
      brideCtx = r.ctx;
    }
    if (!groom) {
      const r = chartFromBirthInput(body.groomBirth ?? {});
      groom = r.person;
      groomCtx = r.ctx;
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: 'MILAN_CALCULATION_FAILED',
        message: 'The charts could not be calculated from the provided birth data.',
        detail: String(err instanceof Error ? err.message : err),
      },
      { status: 422 },
    );
  }

  if (!isValidMilanInput(bride ?? {}) || !isValidMilanInput(groom ?? {})) {
    return NextResponse.json(
      {
        ok: false,
        errorCode: 'MILAN_INPUT_INVALID',
        message: 'Both partners must have a valid Moon rashi and nakshatra. Supply rashiName and nakshatraName, or complete birth data.',
      },
      { status: 400 },
    );
  }

  let calc;
  try {
    calc = calculateMilan(bride ?? {}, groom ?? {}, { brideCtx, groomCtx });
  } catch (err) {
    console.error('[milan] calculation threw', err);
    return NextResponse.json(
      { ok: false, errorCode: 'MILAN_CALCULATION_FAILED', message: 'Milan calculation failed.' },
      { status: 500 },
    );
  }

  if (body.inspect === true) {
    return NextResponse.json({
      ok: true,
      total: calc.total,
      maxTotal: calc.maxTotal,
      verdict: calc.verdict,
      kootas: calc.kootas,
      doshas: calc.doshas,
      supplementalDoshas: calc.supplementalDoshas,
      synthesis: calc.synthesis,
      nadiCancelled: calc.nadiCancelled,
      bhakootCancelled: calc.bhakootCancelled,
      nadiDoshaActive: calc.nadiDoshaActive,
      bhakootDoshaActive: calc.bhakootDoshaActive,
      predictions: calc.predictions.map((p) => p.id),
      sources: calc.sources,
      rendererVersion: MILAN_RENDERER_VERSION,
      mode,
      locale,
    });
  }

  let pdf: Uint8Array;
  try {
    pdf = await generateMilanPdf(calc, { mode, locale });
  } catch (err) {
    console.error('[milan/pdf] threw', err);
    return NextResponse.json(
      { ok: false, errorCode: 'MILAN_PDF_RENDER_FAILED', message: 'The Milan PDF could not be generated.' },
      { status: 500 },
    );
  }

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.byteLength),
      'Content-Disposition': `attachment; filename="${filename(mode)}"`,
      'Cache-Control': 'no-store',
      'X-Milan-Renderer': MILAN_RENDERER_VERSION,
      'X-Milan-Mode': mode,
      'X-Milan-Locale': locale,
      'X-Milan-Pages': '0',
    },
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: {
      kootas: ['Varna:1', 'Vashya:2', 'Tara:3', 'Yoni:4', 'GrahaMaitri:5', 'Gana:6', 'Bhakoot:7', 'Nadi:8'],
      maxTotal: 36,
      locales: ['en', 'hi', 'hi-en'],
      modes: ['CLIENT', 'PANDIT', 'SCHOLAR'],
    },
    rendererVersion: MILAN_RENDERER_VERSION,
  });
}
