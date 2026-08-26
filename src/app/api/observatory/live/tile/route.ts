import { NextRequest, NextResponse } from 'next/server';
import { helioviewerTileUrl } from '@/lib/observatory/live';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function integer(value: string | null, min: number, max: number): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function positiveNumber(value: string | null, min: number, max: number): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');
  if (provider !== 'helioviewer') return errorResponse('Unsupported tile provider.', 400);
  const imageId = integer(request.nextUrl.searchParams.get('imageId'), 1, Number.MAX_SAFE_INTEGER);
  const x = integer(request.nextUrl.searchParams.get('x'), -32, 32);
  const y = integer(request.nextUrl.searchParams.get('y'), -32, 32);
  const imageScale = positiveNumber(request.nextUrl.searchParams.get('imageScale'), 0.05, 100);
  if (imageId === null || x === null || y === null || imageScale === null) return errorResponse('Invalid Helioviewer tile parameters.', 400);

  try {
    const upstream = await fetch(helioviewerTileUrl(imageId, x, y, imageScale), {
      headers: { accept: 'image/png' },
      next: { revalidate: 300 },
    } as RequestInit & { next?: { revalidate: number } });
    if (!upstream.ok) return errorResponse(`Helioviewer tile provider returned ${upstream.status}.`, 502);
    const contentType = upstream.headers.get('content-type') || 'image/png';
    if (!contentType.toLowerCase().startsWith('image/')) return errorResponse('Helioviewer tile provider returned a non-image response.', 502);
    const bytes = new Uint8Array(await upstream.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > 4 * 1024 * 1024) return errorResponse('Helioviewer tile payload is outside the accepted size range.', 502);
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
        'Content-Length': String(bytes.byteLength),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return errorResponse(`Live tile unavailable: ${error instanceof Error ? error.message : 'provider error'}`, 502);
  }
}
