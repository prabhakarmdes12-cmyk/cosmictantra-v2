import { NextRequest, NextResponse } from 'next/server';
import { resolvePjosActor } from '@/lib/pjos/session';
import { getPjosDb } from '@/lib/pjos/pjosDbProvider';
import { handleGetKundli } from '@/lib/pjos/routes';

/**
 * GET /api/pjos/kundli/[id] — read a persisted kundli (snapshot + optional
 * compiled evidence). Ownership enforced before any data is returned.
 * Query params: includeEvidence=true&domains=GRAHA,DASHA
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const includeEvidence = url.searchParams.get('includeEvidence') === 'true';
    const domainsParam = url.searchParams.get('domains');
    const domains = domainsParam ? domainsParam.split(',').map((d) => d.trim()).filter(Boolean) : undefined;
    const res = await handleGetKundli(getPjosDb(), resolvePjosActor(req), params.id, { includeEvidence, domains });
    return NextResponse.json(res.body, { status: res.status });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}
