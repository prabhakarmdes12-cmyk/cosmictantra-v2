import { calculateCanonicalBody, calculateCanonicalBodies, type CanonicalBody, type CanonicalBodyName } from '../canonicalBodies';
import type { ObserverLocation } from '../projection';
import type { EphemerisProvenance, EphemerisResult } from './types';

const LOCAL_SOURCE_URL = 'workspace:src/lib/astronomy/canonicalBodies.ts';

function observerLabel(observer?: ObserverLocation): string {
  if (!observer) return 'geocentric body coordinates; observer applied by horizontal projection';
  return `${observer.latitude.toFixed(4)}° latitude, ${observer.longitude.toFixed(4)}° longitude; observer applied by horizontal projection`;
}

function modelName(body: CanonicalBody): string {
  switch (body.source) {
    case 'solar': return 'compact solar longitude approximation';
    case 'lunar': return 'compact periodic lunar approximation';
    case 'mean-node': return 'mean ascending/descending lunar node formula';
    default: return 'Paul Schlyter-style low-precision Keplerian elements';
  }
}

function noteFor(body: CanonicalBody): string {
  if (body.source === 'mean-node') {
    return 'Mathematical lunar node: no physical body, distance, surface, altitude, or azimuth is implied.';
  }
  if (body.source === 'lunar') {
    return 'Teaching approximation only. The current qualification records a 1.135216° Moon discrepancy; no sub-degree claim is permitted.';
  }
  return 'Deterministic teaching approximation; not JPL-grade and not a substitute for a reviewed precision ephemeris.';
}

export function localEphemerisProvenance(
  body: CanonicalBody,
  date: Date,
  observer?: ObserverLocation,
): EphemerisProvenance {
  return {
    provider: 'local-approximation',
    model: modelName(body),
    epochUtc: date.toISOString(),
    frame: 'tropical-ecliptic',
    observer: observerLabel(observer),
    quality: 'illustrative',
    sourceUrl: LOCAL_SOURCE_URL,
    note: noteFor(body),
  };
}

/**
 * Adapt the existing canonical body surface to the shared future-provider
 * contract. This does not change the canonical calculation or introduce a
 * network request; it gives reference fixtures a stable seam to attach to.
 */
export function localEphemerisResult(
  bodyName: CanonicalBodyName,
  date: Date,
  observer?: ObserverLocation,
): EphemerisResult {
  const body = calculateCanonicalBody(bodyName, date);
  return {
    body: body.body,
    longitudeDeg: body.tropicalLongitude,
    latitudeDeg: body.tropicalLatitude,
    rightAscensionHours: body.rightAscensionHours,
    declinationDeg: body.declinationDeg,
    distanceAu: body.distanceAu,
    provenance: localEphemerisProvenance(body, date, observer),
  };
}

export function localEphemerisResults(date: Date, observer?: ObserverLocation): EphemerisResult[] {
  return calculateCanonicalBodies(date).map(body => ({
    body: body.body,
    longitudeDeg: body.tropicalLongitude,
    latitudeDeg: body.tropicalLatitude,
    rightAscensionHours: body.rightAscensionHours,
    declinationDeg: body.declinationDeg,
    distanceAu: body.distanceAu,
    provenance: localEphemerisProvenance(body, date, observer),
  }));
}
