import { NextRequest, NextResponse } from 'next/server';
import { helioviewerScreenshotUrl } from '@/lib/observatory/live';
import { NASA_SDO_LATEST_171_URL } from '@/lib/observatory/live/helioviewerAdapter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function validUtc(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function positiveNumber(value: string | null, min: number, max: number): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

async function proxyImage(url: string, fallbackContentType = 'image/png'): Promise<NextResponse> {
  const upstream = await fetch(url, {
    headers: { accept: 'image/avif,image/webp,image/png,image/jpeg,*/*' },
    next: { revalidate: 120 },
  } as RequestInit & { next?: { revalidate: number } });
  if (!upstream.ok) throw new Error(`image provider returned ${upstream.status}`);
  const contentType = upstream.headers.get('content-type') || fallbackContentType;
  if (!contentType.toLowerCase().startsWith('image/')) throw new Error('image provider returned a non-image response');
  const bytes = new Uint8Array(await upstream.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) throw new Error('image provider returned an unsupported payload size');
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      'Content-Length': String(bytes.byteLength),
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');

  try {
    if (provider === 'nasa-sdo') {
      if (request.nextUrl.searchParams.get('channel') !== '171') return errorResponse('Only the configured NASA SDO AIA 171 browse channel is available.', 400);
      return await proxyImage(NASA_SDO_LATEST_171_URL, 'image/jpeg');
    }

    if (provider !== 'helioviewer') return errorResponse('Unsupported image provider.', 400);
    const capturedAt = validUtc(request.nextUrl.searchParams.get('capturedAt'));
    const imageScale = positiveNumber(request.nextUrl.searchParams.get('imageScale'), 0.05, 100);
    const imageId = positiveNumber(request.nextUrl.searchParams.get('imageId'), 1, Number.MAX_SAFE_INTEGER);
    if (!capturedAt || imageScale === null || imageId === null || !Number.isInteger(imageId)) return errorResponse('Invalid Helioviewer frame parameters.', 400);

    // The provider-side id is validated for provenance and the capture/scale
    // fields are bounded. The screenshot request remains server-side so the
    // browser never hotlinks or controls an arbitrary upstream URL.
    return await proxyImage(helioviewerScreenshotUrl(capturedAt, imageScale));
  } catch (error) {
    return errorResponse(`Live frame unavailable: ${error instanceof Error ? error.message : 'provider error'}`, 502);
  }
}
