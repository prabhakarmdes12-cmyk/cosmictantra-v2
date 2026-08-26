import type { CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';

export const LIVE_OBSERVATION_SCHEMA_VERSION = 1 as const;
export const LIVE_OBSERVATION_ZOOM_THRESHOLD = 2.15;

export type LiveTargetKind = 'planet' | 'star' | 'event' | 'constellation';
export type LiveProviderId =
  | 'local-sky'
  | 'nasa-sdo'
  | 'helioviewer'
  | 'las-cumbres-observatory'
  | 'microobservatory'
  | 'virtual-telescope'
  | 'ascom-alpaca'
  | 'indi';

export type LiveObservationMode =
  | 'local-calculation'
  | 'near-real-time-public'
  | 'remote-exposure'
  | 'camera-stream'
  | 'archival-reference'
  | 'unavailable';

export type LiveFrameStatus = 'available' | 'not-configured' | 'queued' | 'unavailable' | 'error';
export type LiveFrameFreshness = 'fresh' | 'stale' | 'unknown' | 'not-applicable';
export type LiveFrameQuality = 'mission-browse' | 'provider-reported' | 'user-camera' | 'archival' | 'local-illustrative' | 'unknown';
export type ProviderAvailability = 'always-on' | 'public-feed' | 'requires-account' | 'session-or-link' | 'local-gateway' | 'disabled';

export interface LiveTarget {
  kind: LiveTargetKind;
  /** Canonical body name, catalogue star id, constellation id, or provider event id. */
  id: CanonicalBodyName | string;
  label: string;
}

export interface LiveFrameMetadata {
  schemaVersion: typeof LIVE_OBSERVATION_SCHEMA_VERSION;
  /** Stable provider-side id where the provider exposes one. */
  frameId: string;
  provider: LiveProviderId;
  providerLabel: string;
  target: LiveTarget;
  mode: Exclude<LiveObservationMode, 'local-calculation' | 'unavailable'>;
  status: Exclude<LiveFrameStatus, 'not-configured' | 'queued' | 'unavailable' | 'error'>;
  requestedAtUtc: string | null;
  capturedAtUtc: string | null;
  receivedAtUtc: string | null;
  wavelengthNm: number | null;
  wavelengthLabel: string | null;
  filter: string | null;
  exposureSeconds: number | null;
  pixelScaleArcsecPerPixel: number | null;
  processingLevel: string | null;
  quality: LiveFrameQuality;
  freshness: LiveFrameFreshness;
  staleAfterUtc: string | null;
  sourceUrl: string | null;
  attribution: string;
  license: string;
  useNotes: string;
  imageUrl: string | null;
  tilesUrlTemplate: string | null;
  streamUrl: string | null;
  /** Human-readable caveats from the provider adapter, not generated sky facts. */
  notes: string[];
}

export interface LiveProviderCapability {
  id: LiveProviderId;
  label: string;
  modes: LiveObservationMode[];
  targetKinds: LiveTargetKind[];
  targetIds?: string[];
  availability: ProviderAvailability;
  requiresAuthentication: boolean;
  configured: boolean;
  sourceUrl: string;
  attribution: string;
  license: string;
  limitations: string[];
}

export interface LocalSkyCalculationDescriptor {
  schemaVersion: typeof LIVE_OBSERVATION_SCHEMA_VERSION;
  provider: 'local-sky';
  label: 'Local calculated sky';
  mode: 'local-calculation';
  status: 'active';
  target: LiveTarget;
  requestedAtUtc: string;
  sourcePath: 'src/lib/astronomy/canonicalBodies.ts' | 'src/lib/astronomy/stars.ts' | 'src/lib/astronomy/projection.ts';
  note: string;
}

export interface LiveObservationResponse {
  schemaVersion: typeof LIVE_OBSERVATION_SCHEMA_VERSION;
  target: LiveTarget;
  requestedAtUtc: string;
  localCalculation: LocalSkyCalculationDescriptor;
  providers: LiveProviderCapability[];
  frame: LiveFrameMetadata | null;
  notices: string[];
}
