import type { LiveFrameMetadata, LiveTarget } from './types';

export const HELIOVIEWER_SOURCE_ID = 10;
export const HELIOVIEWER_SOURCE_LABEL = 'SDO / AIA 171 Å';
export const HELIOVIEWER_API_BASE = 'https://api.helioviewer.org/v2';
export const NASA_SDO_LATEST_171_URL = 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0171.jpg';
export const NASA_SDO_DATA_ACCESS_URL = 'https://sdo.gsfc.nasa.gov/data/dataaccess.php';

const NEAR_REAL_TIME_WINDOW_MS = 6 * 60 * 60 * 1000;
const SOLAR_STALE_AFTER_MS = 35 * 60 * 1000;

type FetchLike = typeof fetch;

export interface HelioviewerClosestImage {
  id: number;
  date: string;
  scale: number;
  scaleCorrection: number;
  width?: number;
  height?: number;
  refPixelX?: number;
  refPixelY?: number;
  rsun?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseProviderDate(value: string): string | null {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const iso = normalized.endsWith('Z') ? normalized : `${normalized}Z`;
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function parseHelioviewerClosestImage(value: unknown): HelioviewerClosestImage | null {
  if (!isRecord(value) || !finiteNumber(value.id) || !Number.isInteger(value.id) || value.id <= 0 || typeof value.date !== 'string') return null;
  if (!finiteNumber(value.scale) || value.scale <= 0 || !finiteNumber(value.scaleCorrection) || value.scaleCorrection <= 0) return null;
  if (!parseProviderDate(value.date)) return null;
  if (value.width !== undefined && (!finiteNumber(value.width) || value.width <= 0)) return null;
  if (value.height !== undefined && (!finiteNumber(value.height) || value.height <= 0)) return null;
  if (value.refPixelX !== undefined && !finiteNumber(value.refPixelX)) return null;
  if (value.refPixelY !== undefined && !finiteNumber(value.refPixelY)) return null;
  if (value.rsun !== undefined && (!finiteNumber(value.rsun) || value.rsun <= 0)) return null;
  return {
    id: value.id,
    date: value.date,
    scale: value.scale,
    scaleCorrection: value.scaleCorrection,
    ...(value.width === undefined ? {} : { width: value.width }),
    ...(value.height === undefined ? {} : { height: value.height }),
    ...(value.refPixelX === undefined ? {} : { refPixelX: value.refPixelX }),
    ...(value.refPixelY === undefined ? {} : { refPixelY: value.refPixelY }),
    ...(value.rsun === undefined ? {} : { rsun: value.rsun }),
  };
}

export function helioviewerClosestImageUrl(requestedAtUtc: string): string {
  const params = new URLSearchParams({ date: requestedAtUtc, sourceId: String(HELIOVIEWER_SOURCE_ID) });
  return `${HELIOVIEWER_API_BASE}/getClosestImage/?${params.toString()}`;
}

export function helioviewerScreenshotUrl(capturedAtUtc: string, imageScale: number): string {
  const params = new URLSearchParams({
    date: capturedAtUtc,
    imageScale: imageScale.toString(),
    layers: `[${HELIOVIEWER_SOURCE_ID},1,100]`,
    events: '',
    eventLabels: 'false',
    width: '1024',
    height: '1024',
    display: 'true',
    watermark: 'true',
  });
  return `${HELIOVIEWER_API_BASE}/takeScreenshot/?${params.toString()}`;
}

export function helioviewerTileUrl(imageId: number, x: number, y: number, imageScale: number): string {
  const params = new URLSearchParams({ id: String(imageId), x: String(x), y: String(y), imageScale: imageScale.toString() });
  return `${HELIOVIEWER_API_BASE}/getTile/?${params.toString()}`;
}

function internalFrameUrl(imageId: number, capturedAtUtc: string, imageScale: number): string {
  const params = new URLSearchParams({ provider: 'helioviewer', imageId: String(imageId), capturedAt: capturedAtUtc, imageScale: imageScale.toString() });
  return `/api/observatory/live/frame?${params.toString()}`;
}

function internalTileTemplate(imageId: number, capturedAtUtc: string, imageScale: number): string {
  const params = new URLSearchParams({ provider: 'helioviewer', imageId: String(imageId), capturedAt: capturedAtUtc, imageScale: imageScale.toString(), x: '{x}', y: '{y}' });
  return `/api/observatory/live/tile?${params.toString()}`;
}

function isNearRequestedNow(requestedAtUtc: string, now = Date.now()): boolean {
  const requested = new Date(requestedAtUtc).getTime();
  return Number.isFinite(requested) && Math.abs(now - requested) <= NEAR_REAL_TIME_WINDOW_MS;
}

function buildHelioviewerFrame(target: LiveTarget, requestedAtUtc: string, image: HelioviewerClosestImage, receivedAtUtc: string): LiveFrameMetadata {
  const capturedAtUtc = parseProviderDate(image.date) as string;
  const imageScale = image.scale * image.scaleCorrection;
  const nearRealTime = isNearRequestedNow(requestedAtUtc, new Date(receivedAtUtc).getTime());
  const staleAfterUtc = new Date(new Date(capturedAtUtc).getTime() + SOLAR_STALE_AFTER_MS).toISOString();
  const freshness = new Date(receivedAtUtc).getTime() > new Date(staleAfterUtc).getTime() ? 'stale' : nearRealTime ? 'fresh' : 'not-applicable';
  return {
    schemaVersion: 1,
    frameId: `helioviewer-${image.id}`,
    provider: 'helioviewer',
    providerLabel: 'Helioviewer · SDO/AIA 171 Å',
    target,
    mode: nearRealTime ? 'near-real-time-public' : 'archival-reference',
    status: 'available',
    requestedAtUtc,
    capturedAtUtc,
    receivedAtUtc,
    wavelengthNm: 17.1,
    wavelengthLabel: '171 Å extreme ultraviolet',
    filter: HELIOVIEWER_SOURCE_LABEL,
    exposureSeconds: null,
    pixelScaleArcsecPerPixel: imageScale,
    processingLevel: 'Helioviewer JPEG2000-derived screenshot; provider watermark enabled',
    quality: nearRealTime ? 'mission-browse' : 'archival',
    freshness,
    staleAfterUtc: nearRealTime ? staleAfterUtc : null,
    sourceUrl: helioviewerClosestImageUrl(requestedAtUtc),
    attribution: 'Helioviewer Project with NASA/SDO AIA source imagery.',
    license: 'NASA/SDO and Helioviewer attribution and reuse terms must be reviewed before redistribution or commercial mirroring.',
    useNotes: 'This is a solar mission image, not visible-light imagery from the selected observer and not a replacement for the calculated local sky.',
    imageUrl: internalFrameUrl(image.id, capturedAtUtc, imageScale),
    tilesUrlTemplate: internalTileTemplate(image.id, capturedAtUtc, imageScale),
    streamUrl: null,
    notes: [
      'Capture time comes from the Helioviewer provider response.',
      'AIA 171 Å is extreme ultraviolet; color and appearance are instrument processing conventions.',
      ...(image.width && image.height ? [`Source image dimensions reported by provider: ${image.width} × ${image.height}.`] : []),
    ],
  };
}

export function buildNasaSdoFallbackFrame(target: LiveTarget, requestedAtUtc: string, receivedAtUtc = new Date().toISOString()): LiveFrameMetadata {
  const staleAfterUtc = new Date(new Date(receivedAtUtc).getTime() + SOLAR_STALE_AFTER_MS).toISOString();
  return {
    schemaVersion: 1,
    frameId: 'nasa-sdo-latest-aia-171',
    provider: 'nasa-sdo',
    providerLabel: 'NASA SDO latest browse · AIA 171 Å',
    target,
    mode: 'near-real-time-public',
    status: 'available',
    requestedAtUtc,
    capturedAtUtc: null,
    receivedAtUtc,
    wavelengthNm: 17.1,
    wavelengthLabel: '171 Å extreme ultraviolet',
    filter: 'AIA 171',
    exposureSeconds: null,
    pixelScaleArcsecPerPixel: null,
    processingLevel: 'NASA SDO latest browse JPEG',
    quality: 'mission-browse',
    freshness: 'unknown',
    staleAfterUtc,
    sourceUrl: NASA_SDO_DATA_ACCESS_URL,
    attribution: 'NASA/SDO browse imagery; served through the Observatory adapter.',
    license: 'NASA media/data use and SDO attribution terms must be reviewed for the intended reuse.',
    useNotes: 'The latest browse endpoint does not expose a capture timestamp in this adapter. It is never presented as an exact-time match; consult the official source for timestamped data.',
    imageUrl: '/api/observatory/live/frame?provider=nasa-sdo&channel=171',
    tilesUrlTemplate: null,
    streamUrl: null,
    notes: [
      'Capture timestamp was not supplied by the latest-browse endpoint.',
      'This fallback is a real NASA SDO solar image, not a local visible-light telescope view.',
    ],
  };
}

export async function fetchHelioviewerFrame(
  target: LiveTarget,
  requestedAtUtc: string,
  fetcher: FetchLike = fetch,
): Promise<LiveFrameMetadata> {
  const response = await fetcher(helioviewerClosestImageUrl(requestedAtUtc), {
    headers: { accept: 'application/json' },
    next: { revalidate: 120 },
  } as RequestInit & { next?: { revalidate: number } });
  if (!response.ok) throw new Error(`Helioviewer getClosestImage returned ${response.status}`);
  const payload = await response.json() as unknown;
  const closestImage = parseHelioviewerClosestImage(payload);
  if (!closestImage) throw new Error('Helioviewer returned an invalid closest-image payload');
  return buildHelioviewerFrame(target, requestedAtUtc, closestImage, new Date().toISOString());
}

export async function fetchSolarFrame(
  target: LiveTarget,
  requestedAtUtc: string,
  fetcher: FetchLike = fetch,
): Promise<{ frame: LiveFrameMetadata | null; notices: string[] }> {
  try {
    const frame = await fetchHelioviewerFrame(target, requestedAtUtc, fetcher);
    return { frame, notices: [] };
  } catch (error) {
    if (isNearRequestedNow(requestedAtUtc)) {
      return {
        frame: buildNasaSdoFallbackFrame(target, requestedAtUtc),
        notices: [`Helioviewer was unavailable (${error instanceof Error ? error.message : 'unknown error'}); using the NASA SDO latest-browse adapter without inventing a capture timestamp.`],
      };
    }
    return {
      frame: null,
      notices: ['The requested instant is historical and the archival solar provider could not be reached. The local calculated sky remains available; no current frame was substituted.'],
    };
  }
}
