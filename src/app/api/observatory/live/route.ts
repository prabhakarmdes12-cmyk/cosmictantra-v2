import { NextRequest, NextResponse } from 'next/server';
import {
  createLiveObservationResponse,
  fetchSolarFrame,
  normalizeLiveTarget,
  targetIsPhysicalBody,
} from '@/lib/observatory/live';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function requestedInstant(value: string | null): string {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

export async function GET(request: NextRequest) {
  const target = normalizeLiveTarget(request.nextUrl.searchParams.get('kind') || undefined, request.nextUrl.searchParams.get('id') || undefined);
  if (!target) return jsonError('Unsupported live-observation target. Use a known planet, catalogue star, constellation, or validated event id.', 400);

  const requestedAtUtc = requestedInstant(request.nextUrl.searchParams.get('date'));
  if (!requestedAtUtc) return jsonError('The observation date must be a valid ISO-compatible instant.', 400);

  if (!targetIsPhysicalBody(target) || target.id !== 'Sun') {
    const response = createLiveObservationResponse(target, requestedAtUtc, null, [
      'No public provider-backed frame is enabled for this target in the current deployment.',
      'The local calculated sky remains the honest fallback. A real planet/star view needs an approved remote-telescope session or an authenticated user-owned telescope gateway.',
    ]);
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const result = await fetchSolarFrame(target, requestedAtUtc);
  const response = createLiveObservationResponse(target, requestedAtUtc, result.frame, result.notices);
  return NextResponse.json(response, {
    headers: {
      // The metadata is intentionally short-lived. Image bytes have their own
      // cache policy in the frame/tile routes.
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
