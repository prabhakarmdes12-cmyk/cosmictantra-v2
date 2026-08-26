import { CANONICAL_BODY_NAMES, type CanonicalBody, type CanonicalBodyName } from './canonicalBodies';
import type { ObservationPlan } from './observation';

export const OBSERVATION_LOG_STORAGE_KEY = 'cosmictantra:observatory:observation-log:v1';
export const MAX_OBSERVATION_LOG_ENTRIES = 50;
export const MAX_OBSERVATION_NOTE_LENGTH = 1200;

export type ObservationLogStatus = 'observed' | 'planned';

type CanonicalSource = CanonicalBody['source'];
type AltitudeBand = ObservationPlan['altitudeBand'];

export interface ObservationLogEntry {
  id: string;
  recordedAt: string;
  observedAt: string;
  cityId: string;
  cityName: string;
  observer: {
    latitude: number;
    longitude: number;
  };
  timezoneOffsetHours: number;
  body: CanonicalBodyName;
  source: CanonicalSource;
  physicalSky: boolean;
  altitudeDeg: number | null;
  azimuthDeg: number | null;
  direction: string | null;
  altitudeBand: AltitudeBand;
  tropicalLongitude: number;
  siderealLongitude: number;
  rashi: string;
  nakshatra: string;
  pada: number;
  lunarSeparationDeg: number | null;
  moonPhase: string;
  status: ObservationLogStatus;
  note: string;
}

export type ObservationLogDraft = Omit<ObservationLogEntry, 'id' | 'recordedAt'>;

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function boundedNullableNumber(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined) return null;
  return finiteNumber(value) && value >= min && value <= max ? value : null;
}

function validIso(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(new Date(value).getTime());
}

function validBody(value: unknown): value is CanonicalBodyName {
  return typeof value === 'string' && (CANONICAL_BODY_NAMES as readonly string[]).includes(value);
}

function validSource(value: unknown): value is CanonicalSource {
  return value === 'keplerian' || value === 'solar' || value === 'lunar' || value === 'mean-node';
}

function validAltitudeBand(value: unknown): value is AltitudeBand {
  return value === null || value === 'high' || value === 'usable' || value === 'near horizon' || value === 'below horizon';
}

function validStatus(value: unknown): value is ObservationLogStatus {
  return value === 'observed' || value === 'planned';
}

function normalizeEntry(value: unknown): ObservationLogEntry | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ObservationLogEntry> & { observer?: Partial<ObservationLogEntry['observer']> };
  if (
    typeof candidate.id !== 'string'
    || !validIso(candidate.recordedAt)
    || !validIso(candidate.observedAt)
    || typeof candidate.cityId !== 'string'
    || typeof candidate.cityName !== 'string'
    || !candidate.observer
    || !finiteNumber(candidate.observer.latitude)
    || !finiteNumber(candidate.observer.longitude)
    || candidate.observer.latitude < -90
    || candidate.observer.latitude > 90
    || candidate.observer.longitude < -180
    || candidate.observer.longitude > 180
    || !finiteNumber(candidate.timezoneOffsetHours)
    || candidate.timezoneOffsetHours < -24
    || candidate.timezoneOffsetHours > 24
    || !validBody(candidate.body)
    || !validSource(candidate.source)
    || typeof candidate.physicalSky !== 'boolean'
    || !validAltitudeBand(candidate.altitudeBand)
    || !finiteNumber(candidate.tropicalLongitude)
    || candidate.tropicalLongitude < 0
    || candidate.tropicalLongitude >= 360
    || !finiteNumber(candidate.siderealLongitude)
    || candidate.siderealLongitude < 0
    || candidate.siderealLongitude >= 360
    || typeof candidate.rashi !== 'string'
    || typeof candidate.nakshatra !== 'string'
    || !finiteNumber(candidate.pada)
    || !Number.isInteger(candidate.pada)
    || candidate.pada < 1
    || candidate.pada > 4
    || typeof candidate.moonPhase !== 'string'
    || !validStatus(candidate.status)
    || typeof candidate.note !== 'string'
  ) return null;

  const nodeBody = candidate.body === 'Rahu' || candidate.body === 'Ketu';
  if (
    nodeBody !== (candidate.source === 'mean-node')
    || candidate.physicalSky !== !nodeBody
    || (nodeBody && (
      candidate.altitudeDeg !== null
      || candidate.azimuthDeg !== null
      || candidate.direction !== null
      || candidate.altitudeBand !== null
      || candidate.lunarSeparationDeg !== null
    ))
  ) return null;

  const altitudeDeg = boundedNullableNumber(candidate.altitudeDeg, -90, 90);
  const azimuthDeg = boundedNullableNumber(candidate.azimuthDeg, 0, 360);
  const lunarSeparationDeg = boundedNullableNumber(candidate.lunarSeparationDeg, 0, 180);
  const direction = candidate.direction === null || typeof candidate.direction === 'string' ? candidate.direction : null;

  return {
    id: candidate.id,
    recordedAt: candidate.recordedAt,
    observedAt: candidate.observedAt,
    cityId: candidate.cityId,
    cityName: candidate.cityName,
    observer: { latitude: candidate.observer.latitude, longitude: candidate.observer.longitude },
    timezoneOffsetHours: candidate.timezoneOffsetHours,
    body: candidate.body,
    source: candidate.source,
    physicalSky: candidate.physicalSky,
    altitudeDeg,
    azimuthDeg,
    direction,
    altitudeBand: candidate.altitudeBand,
    tropicalLongitude: candidate.tropicalLongitude,
    siderealLongitude: candidate.siderealLongitude,
    rashi: candidate.rashi,
    nakshatra: candidate.nakshatra,
    pada: candidate.pada,
    lunarSeparationDeg,
    moonPhase: candidate.moonPhase,
    status: candidate.status,
    note: candidate.note.slice(0, MAX_OBSERVATION_NOTE_LENGTH),
  };
}

export function createObservationLogEntry(
  draft: ObservationLogDraft,
  id: string,
  recordedAt: string,
): ObservationLogEntry {
  return {
    ...draft,
    id,
    recordedAt,
    note: draft.note.trim().slice(0, MAX_OBSERVATION_NOTE_LENGTH),
    observer: { ...draft.observer },
  };
}

export function parseObservationLog(raw: string | null): ObservationLogEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeEntry)
      .filter((entry): entry is ObservationLogEntry => Boolean(entry))
      .slice(0, MAX_OBSERVATION_LOG_ENTRIES);
  } catch {
    return [];
  }
}

export function serializeObservationLog(entries: ObservationLogEntry[]): string {
  return JSON.stringify(entries.slice(0, MAX_OBSERVATION_LOG_ENTRIES));
}

function csvCell(value: string | number | boolean | null): string {
  const text = value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function observationLogToCsv(entries: ObservationLogEntry[]): string {
  const header = [
    'observedAt', 'city', 'latitude', 'longitude', 'body', 'status', 'physicalSky',
    'altitudeDeg', 'azimuthDeg', 'direction', 'altitudeBand', 'tropicalLongitude',
    'siderealLongitude', 'rashi', 'nakshatra', 'pada', 'lunarSeparationDeg', 'moonPhase', 'note',
  ];
  const rows = entries.slice(0, MAX_OBSERVATION_LOG_ENTRIES).map(entry => [
    entry.observedAt,
    entry.cityName,
    entry.observer.latitude,
    entry.observer.longitude,
    entry.body,
    entry.status,
    entry.physicalSky,
    entry.altitudeDeg,
    entry.azimuthDeg,
    entry.direction,
    entry.altitudeBand,
    entry.tropicalLongitude,
    entry.siderealLongitude,
    entry.rashi,
    entry.nakshatra,
    entry.pada,
    entry.lunarSeparationDeg,
    entry.moonPhase,
    entry.note,
  ].map(value => csvCell(value)).join(','));
  return [header.map(value => csvCell(value)).join(','), ...rows].join('\n');
}
