import { normalizeLiveTarget } from './live/catalog';
import type {
  LiveFrameMetadata,
  LiveObservationResponse,
  LiveProviderCapability,
  LiveTarget,
} from './live/types';
import type { LocalStudyContext } from './studyContext';

export const STUDY_SNAPSHOT_SCHEMA_VERSION = 1 as const;
export const STUDY_QUALIFICATION_STATUS = 'CONDITIONAL PASS' as const;
export const STUDY_QUALIFICATION_BLOCKERS = ['BLOCKER-1', 'BLOCKER-2'] as const;

export interface StudySnapshotProviderCapability {
  id: LiveProviderCapability['id'];
  availability: LiveProviderCapability['availability'];
  configured: boolean;
  requiresAuthentication: boolean;
  modes: LiveProviderCapability['modes'];
}

/**
 * A persisted copy of provider metadata. Image bytes are never embedded in a
 * snapshot; transport paths are retained only as provenance pointers.
 */
export type StudySnapshotFrame = Omit<LiveFrameMetadata, 'target'>;

export interface ObservatoryStudySnapshot {
  schemaVersion: typeof STUDY_SNAPSHOT_SCHEMA_VERSION;
  savedAtUtc: string;
  observedAtUtc: string;
  target: LiveTarget;
  city: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    timezoneOffsetHours: number;
  };
  localCalculation: LocalStudyContext;
  providerCheck: {
    checked: boolean;
    providers: StudySnapshotProviderCapability[];
    notices: string[];
  };
  frame: StudySnapshotFrame | null;
  qualification: {
    status: typeof STUDY_QUALIFICATION_STATUS;
    blockers: typeof STUDY_QUALIFICATION_BLOCKERS[number][];
    note: string;
  };
}

export interface CreateStudySnapshotInput {
  savedAtUtc: string;
  observedAtUtc: string;
  target: LiveTarget;
  city: ObservatoryStudySnapshot['city'];
  localCalculation: LocalStudyContext;
  liveResponse: LiveObservationResponse | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validIso(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(new Date(value).getTime());
}

function boundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function nullableString(value: unknown, maxLength: number): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= maxLength);
}

function nullableNumber(value: unknown, min: number, max: number): value is number | null {
  return value === null || (finiteNumber(value) && value >= min && value <= max);
}

function validTarget(value: unknown): value is LiveTarget {
  if (!isRecord(value) || typeof value.kind !== 'string' || typeof value.id !== 'string' || typeof value.label !== 'string') return false;
  const normalized = normalizeLiveTarget(value.kind, value.id);
  return Boolean(normalized && value.label.length > 0 && value.label.length <= 120);
}

function validQuality(value: unknown): boolean {
  return value === 'illustrative' || value === 'catalogue-projection' || value === 'schematic' || value === 'unavailable';
}

function validAltitudeBand(value: unknown): boolean {
  return value === null || value === 'high' || value === 'usable' || value === 'near horizon' || value === 'below horizon';
}

function parseLocalCalculation(value: unknown, target: LiveTarget): LocalStudyContext | null {
  if (!isRecord(value) || value.provider !== 'local-sky' || value.mode !== 'local-calculation' || !validTarget(value.target)) return null;
  if (value.target.kind !== target.kind || value.target.id !== target.id) return null;
  if (!boundedString(value.sourcePath, 240) || !boundedString(value.frame, 180) || !boundedString(value.model, 240) || !validQuality(value.quality) || typeof value.physicalSky !== 'boolean' || !boundedString(value.note, 1200)) return null;
  if (!isRecord(value.coordinates)) return null;
  const coordinates = value.coordinates;
  if (
    !nullableNumber(coordinates.tropicalLongitudeDeg, 0, 360)
    || !nullableNumber(coordinates.siderealLongitudeDeg, 0, 360)
    || !nullableNumber(coordinates.altitudeDeg, -90, 90)
    || !nullableNumber(coordinates.azimuthDeg, 0, 360)
    || !nullableString(coordinates.direction, 24)
    || !validAltitudeBand(coordinates.altitudeBand)
    || !nullableString(coordinates.rashi, 80)
    || !nullableString(coordinates.nakshatra, 80)
    || !nullableNumber(coordinates.pada, 1, 4)
    || (coordinates.pada !== null && !Number.isInteger(coordinates.pada))
    || !nullableString(coordinates.source, 80)
    || (coordinates.isRetrograde !== null && typeof coordinates.isRetrograde !== 'boolean')
  ) return null;
  return {
    provider: 'local-sky',
    mode: 'local-calculation',
    target: { kind: value.target.kind, id: value.target.id, label: value.target.label },
    physicalSky: value.physicalSky,
    sourcePath: value.sourcePath,
    frame: value.frame,
    model: value.model,
    quality: value.quality as LocalStudyContext['quality'],
    coordinates: {
      tropicalLongitudeDeg: coordinates.tropicalLongitudeDeg,
      siderealLongitudeDeg: coordinates.siderealLongitudeDeg,
      altitudeDeg: coordinates.altitudeDeg,
      azimuthDeg: coordinates.azimuthDeg,
      direction: coordinates.direction,
      altitudeBand: coordinates.altitudeBand as LocalStudyContext['coordinates']['altitudeBand'],
      rashi: coordinates.rashi,
      nakshatra: coordinates.nakshatra,
      pada: coordinates.pada,
      isRetrograde: coordinates.isRetrograde as boolean | null,
      source: coordinates.source,
    },
    note: value.note,
  };
}

const LIVE_PROVIDER_IDS = ['local-sky', 'nasa-sdo', 'helioviewer', 'las-cumbres-observatory', 'microobservatory', 'virtual-telescope', 'ascom-alpaca', 'indi'] as const;
const LIVE_MODES = ['local-calculation', 'near-real-time-public', 'remote-exposure', 'camera-stream', 'archival-reference', 'unavailable'] as const;
const LIVE_AVAILABILITY = ['always-on', 'public-feed', 'requires-account', 'session-or-link', 'local-gateway', 'disabled'] as const;
const LIVE_QUALITY = ['mission-browse', 'provider-reported', 'user-camera', 'archival', 'local-illustrative', 'unknown'] as const;
const LIVE_FRESHNESS = ['fresh', 'stale', 'unknown', 'not-applicable'] as const;

function parseProviderCheck(value: unknown): ObservatoryStudySnapshot['providerCheck'] | null {
  if (!isRecord(value) || typeof value.checked !== 'boolean' || !Array.isArray(value.providers) || !Array.isArray(value.notices)) return null;
  const providers: StudySnapshotProviderCapability[] = [];
  for (const item of value.providers) {
    if (!isRecord(item) || typeof item.id !== 'string' || !LIVE_PROVIDER_IDS.includes(item.id as typeof LIVE_PROVIDER_IDS[number]) || typeof item.availability !== 'string' || !LIVE_AVAILABILITY.includes(item.availability as typeof LIVE_AVAILABILITY[number]) || typeof item.configured !== 'boolean' || typeof item.requiresAuthentication !== 'boolean' || !Array.isArray(item.modes)) return null;
    const modes = item.modes.filter((mode): mode is typeof LIVE_MODES[number] => typeof mode === 'string' && LIVE_MODES.includes(mode as typeof LIVE_MODES[number]));
    if (modes.length !== item.modes.length) return null;
    providers.push({ id: item.id as StudySnapshotProviderCapability['id'], availability: item.availability as StudySnapshotProviderCapability['availability'], configured: item.configured, requiresAuthentication: item.requiresAuthentication, modes: modes as StudySnapshotProviderCapability['modes'] });
  }
  const notices = value.notices.filter((notice): notice is string => typeof notice === 'string' && notice.length <= 1200);
  if (notices.length !== value.notices.length) return null;
  return { checked: value.checked, providers, notices };
}

function parseFrame(value: unknown, target: LiveTarget): StudySnapshotFrame | null {
  if (!isRecord(value)) return null;
  if (typeof value.provider !== 'string' || !LIVE_PROVIDER_IDS.includes(value.provider as typeof LIVE_PROVIDER_IDS[number])) return null;
  if (!boundedString(value.providerLabel, 180) || !boundedString(value.frameId, 240) || typeof value.mode !== 'string' || !LIVE_MODES.includes(value.mode as typeof LIVE_MODES[number]) || value.mode === 'local-calculation' || value.mode === 'unavailable' || value.status !== 'available') return null;
  if (!nullableString(value.requestedAtUtc, 40) || (value.requestedAtUtc !== null && !validIso(value.requestedAtUtc)) || !nullableString(value.capturedAtUtc, 40) || (value.capturedAtUtc !== null && !validIso(value.capturedAtUtc)) || !nullableString(value.receivedAtUtc, 40) || (value.receivedAtUtc !== null && !validIso(value.receivedAtUtc))) return null;
  if (!nullableNumber(value.wavelengthNm, 0, 100000) || !nullableString(value.wavelengthLabel, 120) || !nullableString(value.filter, 120) || !nullableNumber(value.exposureSeconds, 0, 86400) || !nullableNumber(value.pixelScaleArcsecPerPixel, 0, 100000) || !nullableString(value.processingLevel, 500) || typeof value.quality !== 'string' || !LIVE_QUALITY.includes(value.quality as typeof LIVE_QUALITY[number]) || typeof value.freshness !== 'string' || !LIVE_FRESHNESS.includes(value.freshness as typeof LIVE_FRESHNESS[number]) || !nullableString(value.staleAfterUtc, 40) || (value.staleAfterUtc !== null && !validIso(value.staleAfterUtc))) return null;
  if (!nullableString(value.sourceUrl, 1000) || !boundedString(value.attribution, 1200) || !boundedString(value.license, 1600) || !boundedString(value.useNotes, 1600) || !nullableString(value.imageUrl, 2000) || !nullableString(value.tilesUrlTemplate, 2000) || !nullableString(value.streamUrl, 2000) || !Array.isArray(value.notes)) return null;
  const notes = value.notes.filter((note): note is string => typeof note === 'string' && note.length <= 1200);
  if (notes.length !== value.notes.length) return null;
  if (value.schemaVersion !== 1) return null;
  // The target is stored on the envelope. A frame copied from a different
  // target would make the saved provenance misleading.
  if (value.target !== undefined && (!validTarget(value.target) || value.target.kind !== target.kind || value.target.id !== target.id)) return null;
  return {
    schemaVersion: 1,
    provider: value.provider as StudySnapshotFrame['provider'],
    providerLabel: value.providerLabel,
    frameId: value.frameId,
    mode: value.mode as StudySnapshotFrame['mode'],
    status: 'available',
    requestedAtUtc: value.requestedAtUtc,
    capturedAtUtc: value.capturedAtUtc,
    receivedAtUtc: value.receivedAtUtc,
    wavelengthNm: value.wavelengthNm,
    wavelengthLabel: value.wavelengthLabel,
    filter: value.filter,
    exposureSeconds: value.exposureSeconds,
    pixelScaleArcsecPerPixel: value.pixelScaleArcsecPerPixel,
    processingLevel: value.processingLevel,
    quality: value.quality as StudySnapshotFrame['quality'],
    freshness: value.freshness as StudySnapshotFrame['freshness'],
    staleAfterUtc: value.staleAfterUtc,
    sourceUrl: value.sourceUrl,
    attribution: value.attribution,
    license: value.license,
    useNotes: value.useNotes,
    imageUrl: value.imageUrl,
    tilesUrlTemplate: value.tilesUrlTemplate,
    streamUrl: value.streamUrl,
    notes,
  };
}

export function snapshotFrameFromResponse(response: LiveObservationResponse | null): StudySnapshotFrame | null {
  if (!response?.frame) return null;
  const { target: _target, ...frame } = response.frame;
  return { ...frame };
}

export function createStudySnapshot(input: CreateStudySnapshotInput): ObservatoryStudySnapshot {
  const response = input.liveResponse;
  return {
    schemaVersion: STUDY_SNAPSHOT_SCHEMA_VERSION,
    savedAtUtc: input.savedAtUtc,
    observedAtUtc: input.observedAtUtc,
    target: { ...input.target },
    city: { ...input.city },
    localCalculation: {
      ...input.localCalculation,
      target: { ...input.localCalculation.target },
      coordinates: { ...input.localCalculation.coordinates },
    },
    providerCheck: response
      ? {
          checked: true,
          providers: response.providers.map(provider => ({
            id: provider.id,
            availability: provider.availability,
            configured: provider.configured,
            requiresAuthentication: provider.requiresAuthentication,
            modes: [...provider.modes],
          })),
          notices: [...response.notices],
        }
      : {
          checked: false,
          providers: [],
          notices: ['No provider request was made; this snapshot records the local calculation only.'],
        },
    frame: snapshotFrameFromResponse(response),
    qualification: {
      status: STUDY_QUALIFICATION_STATUS,
      blockers: [...STUDY_QUALIFICATION_BLOCKERS],
      note: 'This snapshot is a study record, not a precision-ephemeris certificate or complete Jyotish judgement.',
    },
  };
}

export function parseStudySnapshot(value: unknown): ObservatoryStudySnapshot | null {
  if (!isRecord(value) || value.schemaVersion !== STUDY_SNAPSHOT_SCHEMA_VERSION || !validIso(value.savedAtUtc) || !validIso(value.observedAtUtc) || !validTarget(value.target)) return null;
  const target = normalizeLiveTarget(value.target.kind, value.target.id);
  if (!target) return null;
  if (!isRecord(value.city) || !boundedString(value.city.id, 120) || !boundedString(value.city.name, 160) || !finiteNumber(value.city.latitude) || value.city.latitude < -90 || value.city.latitude > 90 || !finiteNumber(value.city.longitude) || value.city.longitude < -180 || value.city.longitude > 180 || !finiteNumber(value.city.timezoneOffsetHours) || value.city.timezoneOffsetHours < -24 || value.city.timezoneOffsetHours > 24) return null;
  const localCalculation = parseLocalCalculation(value.localCalculation, target);
  const providerCheck = parseProviderCheck(value.providerCheck);
  if (!localCalculation || !providerCheck) return null;
  const frame = value.frame === null ? null : parseFrame(value.frame, target);
  if (value.frame !== null && !frame) return null;
  if (!isRecord(value.qualification) || value.qualification.status !== STUDY_QUALIFICATION_STATUS || !Array.isArray(value.qualification.blockers) || value.qualification.blockers.some(blocker => blocker !== 'BLOCKER-1' && blocker !== 'BLOCKER-2') || !boundedString(value.qualification.note, 1000)) return null;
  return {
    schemaVersion: STUDY_SNAPSHOT_SCHEMA_VERSION,
    savedAtUtc: value.savedAtUtc,
    observedAtUtc: value.observedAtUtc,
    target: { ...target },
    city: {
      id: value.city.id,
      name: value.city.name,
      latitude: value.city.latitude,
      longitude: value.city.longitude,
      timezoneOffsetHours: value.city.timezoneOffsetHours,
    },
    localCalculation,
    providerCheck,
    frame,
    qualification: {
      status: STUDY_QUALIFICATION_STATUS,
      blockers: value.qualification.blockers as typeof STUDY_QUALIFICATION_BLOCKERS[number][],
      note: value.qualification.note,
    },
  };
}
