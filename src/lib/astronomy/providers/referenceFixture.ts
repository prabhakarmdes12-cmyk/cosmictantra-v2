import { CANONICAL_BODY_NAMES } from '../canonicalBodies';
import type { CanonicalBodyName } from '../canonicalBodies';
import type { EphemerisResult, ReferenceFixture, ReferenceFixtureObservation } from './types';

export const REFERENCE_FIXTURE_SCHEMA_VERSION = 1 as const;

export interface ReferenceFixtureStatus {
  available: boolean;
  label: string;
  blocker: 'BLOCKER-2' | null;
  fixtureId: string | null;
  note: string;
}

export interface ReferenceComparison {
  available: boolean;
  local: EphemerisResult;
  reference: ReferenceFixtureObservation | null;
  errors: {
    longitudeDeg: number;
    latitudeDeg: number;
    rightAscensionArcsec: number | null;
    declinationArcsec: number | null;
    distanceAu: number | null;
  } | null;
}

export const MISSING_REFERENCE_FIXTURE_STATUS: ReferenceFixtureStatus = {
  available: false,
  label: 'No frozen external reference fixture',
  blocker: 'BLOCKER-2',
  fixtureId: null,
  note: 'Run npm run reference:generate in a networked qualification environment, review epoch/frame/observer fields, and commit the small fixture before advertising reference-checked precision.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPhysicalBody(value: unknown): value is Exclude<CanonicalBodyName, 'Rahu' | 'Ketu'> {
  return typeof value === 'string' && (CANONICAL_BODY_NAMES as readonly string[]).includes(value) && value !== 'Rahu' && value !== 'Ketu';
}

function isIsoString(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(new Date(value).getTime());
}

function parseObservation(value: unknown): ReferenceFixtureObservation | null {
  if (!isRecord(value) || !isPhysicalBody(value.body) || !isIsoString(value.epochUtc)) return null;
  if (!isFiniteNumber(value.longitudeDeg) || !isFiniteNumber(value.latitudeDeg)) return null;
  if (value.longitudeDeg < 0 || value.longitudeDeg >= 360 || value.latitudeDeg < -90 || value.latitudeDeg > 90) return null;
  if (value.rightAscensionHours !== undefined && (!isFiniteNumber(value.rightAscensionHours) || value.rightAscensionHours < 0 || value.rightAscensionHours >= 24)) return null;
  if (value.declinationDeg !== undefined && (!isFiniteNumber(value.declinationDeg) || value.declinationDeg < -90 || value.declinationDeg > 90)) return null;
  if (value.distanceAu !== undefined && (!isFiniteNumber(value.distanceAu) || value.distanceAu < 0)) return null;
  if (value.observerKey !== undefined && typeof value.observerKey !== 'string') return null;
  return {
    body: value.body,
    epochUtc: value.epochUtc,
    longitudeDeg: value.longitudeDeg,
    latitudeDeg: value.latitudeDeg,
    ...(value.rightAscensionHours === undefined ? {} : { rightAscensionHours: value.rightAscensionHours }),
    ...(value.declinationDeg === undefined ? {} : { declinationDeg: value.declinationDeg }),
    ...(value.distanceAu === undefined ? {} : { distanceAu: value.distanceAu }),
    ...(value.observerKey === undefined ? {} : { observerKey: value.observerKey }),
  };
}

/**
 * Validate a reviewed fixture at the boundary. The browser does not fetch a
 * fixture automatically; this helper is for build-time or server-side use.
 */
export function parseReferenceFixture(value: unknown): ReferenceFixture | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== REFERENCE_FIXTURE_SCHEMA_VERSION) return null;
  if (typeof value.fixtureId !== 'string' || !isIsoString(value.generatedAt) || !isIsoString(value.epochUtc)) return null;
  if (value.stopUtc !== undefined && !isIsoString(value.stopUtc)) return null;
  if (typeof value.timeScale !== 'string' || !['UTC', 'TDB', 'TT', 'unknown'].includes(value.timeScale)) return null;
  if (typeof value.center !== 'string' || typeof value.frame !== 'string' || typeof value.plane !== 'string') return null;
  if (typeof value.apparent !== 'boolean' || typeof value.refraction !== 'boolean' || typeof value.quantities !== 'string' || typeof value.sourceUrl !== 'string' || typeof value.reviewNote !== 'string') return null;
  if (!Array.isArray(value.observations) || value.observations.length === 0) return null;
  const observations = value.observations.map(parseObservation);
  if (observations.some(observation => observation === null)) return null;

  const observer = value.observer;
  let parsedObserver: ReferenceFixture['observer'];
  if (observer !== undefined) {
    if (!isRecord(observer) || !isFiniteNumber(observer.longitudeDeg) || !isFiniteNumber(observer.latitudeDeg) || !isFiniteNumber(observer.elevationM)) return null;
    if (observer.longitudeDeg < -180 || observer.longitudeDeg > 180 || observer.latitudeDeg < -90 || observer.latitudeDeg > 90) return null;
    if (observer.label !== undefined && typeof observer.label !== 'string') return null;
    parsedObserver = {
      longitudeDeg: observer.longitudeDeg,
      latitudeDeg: observer.latitudeDeg,
      elevationM: observer.elevationM,
      ...(observer.label === undefined ? {} : { label: observer.label }),
    };
  }

  return {
    schemaVersion: REFERENCE_FIXTURE_SCHEMA_VERSION,
    fixtureId: value.fixtureId,
    generatedAt: value.generatedAt,
    epochUtc: value.epochUtc,
    ...(value.stopUtc === undefined ? {} : { stopUtc: value.stopUtc as string }),
    timeScale: value.timeScale as ReferenceFixture['timeScale'],
    center: value.center,
    ...(parsedObserver === undefined ? {} : { observer: parsedObserver }),
    frame: value.frame,
    plane: value.plane,
    apparent: value.apparent,
    refraction: value.refraction,
    quantities: value.quantities,
    sourceUrl: value.sourceUrl,
    reviewNote: value.reviewNote,
    observations: observations as ReferenceFixtureObservation[],
  };
}

export function referenceFixtureStatus(fixture: ReferenceFixture | null | undefined): ReferenceFixtureStatus {
  if (!fixture) return MISSING_REFERENCE_FIXTURE_STATUS;
  return {
    available: true,
    label: 'Frozen external reference fixture',
    blocker: null,
    fixtureId: fixture.fixtureId,
    note: fixture.reviewNote,
  };
}

export function findReferenceObservation(
  fixture: ReferenceFixture | null | undefined,
  body: Exclude<CanonicalBodyName, 'Rahu' | 'Ketu'>,
  epochUtc: string,
  observerKey?: string,
): ReferenceFixtureObservation | null {
  if (!fixture) return null;
  return fixture.observations.find(observation => observation.body === body && observation.epochUtc === epochUtc && observation.observerKey === observerKey) || null;
}

function signedLongitudeDifference(left: number, right: number): number {
  return ((left - right + 540) % 360) - 180;
}

/** Compare a local result without making the browser aware of the reference provider. */
export function compareWithReference(
  local: EphemerisResult,
  fixture: ReferenceFixture | null | undefined,
  observerKey?: string,
): ReferenceComparison {
  if (local.body === 'Rahu' || local.body === 'Ketu') {
    return { available: false, local, reference: null, errors: null };
  }
  const reference = findReferenceObservation(fixture, local.body, local.provenance.epochUtc, observerKey);
  if (!reference) return { available: false, local, reference: null, errors: null };
  return {
    available: true,
    local,
    reference,
    errors: {
      longitudeDeg: Math.abs(signedLongitudeDifference(local.longitudeDeg, reference.longitudeDeg)),
      latitudeDeg: Math.abs(local.latitudeDeg - reference.latitudeDeg),
      rightAscensionArcsec: reference.rightAscensionHours === undefined ? null : Math.abs(local.rightAscensionHours - reference.rightAscensionHours) * 15 * 3600,
      declinationArcsec: reference.declinationDeg === undefined ? null : Math.abs(local.declinationDeg - reference.declinationDeg) * 3600,
      distanceAu: reference.distanceAu === undefined ? null : Math.abs(local.distanceAu - reference.distanceAu),
    },
  };
}
