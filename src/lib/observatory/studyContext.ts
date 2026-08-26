import { calculateCanonicalBody, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import { getNakshatraForLongitude, getRashiForLongitude } from '@/lib/astronomy/eclipticProjection';
import { altitudeBand, compassDirection, planObservation } from '@/lib/astronomy/observation';
import { equatorialToHorizontal, projectStar, type ObserverLocation } from '@/lib/astronomy/projection';
import { localEphemerisProvenance } from '@/lib/astronomy/providers/localApproximation';
import { STARS } from '@/lib/astronomy/stars';
import type { LiveTarget } from './live/types';

export type LocalStudyQuality = 'illustrative' | 'catalogue-projection' | 'schematic' | 'unavailable';

export interface LocalStudyCoordinates {
  tropicalLongitudeDeg: number | null;
  siderealLongitudeDeg: number | null;
  altitudeDeg: number | null;
  azimuthDeg: number | null;
  direction: string | null;
  altitudeBand: 'high' | 'usable' | 'near horizon' | 'below horizon' | null;
  rashi: string | null;
  nakshatra: string | null;
  pada: number | null;
  isRetrograde: boolean | null;
  source: string | null;
}

export interface LocalStudyContext {
  provider: 'local-sky';
  mode: 'local-calculation';
  target: LiveTarget;
  physicalSky: boolean;
  sourcePath: string;
  frame: string;
  model: string;
  quality: LocalStudyQuality;
  coordinates: LocalStudyCoordinates;
  note: string;
}

const EMPTY_COORDINATES: LocalStudyCoordinates = {
  tropicalLongitudeDeg: null,
  siderealLongitudeDeg: null,
  altitudeDeg: null,
  azimuthDeg: null,
  direction: null,
  altitudeBand: null,
  rashi: null,
  nakshatra: null,
  pada: null,
  isRetrograde: null,
  source: null,
};

function copyCoordinates(coordinates: LocalStudyCoordinates): LocalStudyCoordinates {
  return { ...coordinates };
}

function targetBody(target: LiveTarget): CanonicalBodyName | null {
  if (target.kind !== 'planet') return null;
  return ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].includes(target.id)
    ? target.id as CanonicalBodyName
    : null;
}

/**
 * Build the local half of a study snapshot. This function only reads the
 * existing deterministic Observatory instruments; it never asks a provider
 * to fill in a coordinate or turns an illustration into an observation.
 */
export function createLocalStudyContext(
  target: LiveTarget,
  date: Date,
  observer: ObserverLocation,
): LocalStudyContext {
  const bodyName = targetBody(target);
  if (bodyName) {
    const body = calculateCanonicalBody(bodyName, date);
    const plan = planObservation(date, observer, bodyName);
    const provenance = localEphemerisProvenance(body, date, observer);
    const rashi = getRashiForLongitude(body.siderealLongitude);
    const nakshatra = getNakshatraForLongitude(body.siderealLongitude);
    return {
      provider: 'local-sky',
      mode: 'local-calculation',
      target,
      physicalSky: body.source !== 'mean-node',
      sourcePath: 'src/lib/astronomy/canonicalBodies.ts',
      frame: body.source === 'mean-node' ? 'tropical ecliptic → Lahiri sidereal ecliptic' : 'tropical ecliptic → of-date equatorial/horizontal',
      model: provenance.model,
      quality: 'illustrative',
      coordinates: {
        tropicalLongitudeDeg: body.tropicalLongitude,
        siderealLongitudeDeg: body.siderealLongitude,
        altitudeDeg: plan.horizontal?.altitudeDeg ?? null,
        azimuthDeg: plan.horizontal?.azimuthDeg ?? null,
        direction: plan.direction,
        altitudeBand: plan.altitudeBand,
        rashi: rashi.name,
        nakshatra: nakshatra.name,
        pada: nakshatra.pada,
        isRetrograde: body.isRetrograde,
        source: body.source,
      },
      note: provenance.note,
    };
  }

  if (target.kind === 'star') {
    const star = STARS.find(item => item.id === target.id);
    if (!star) {
      return {
        provider: 'local-sky',
        mode: 'local-calculation',
        target,
        physicalSky: true,
        sourcePath: 'src/lib/astronomy/stars.ts',
        frame: 'J2000 catalogue → local of-date horizontal',
        model: 'unknown catalogue anchor',
        quality: 'unavailable',
        coordinates: copyCoordinates(EMPTY_COORDINATES),
        note: 'The selected catalogue anchor was not found in the local source table; no coordinate was invented.',
      };
    }
    const point = projectStar(star, date, observer, 600, 600);
    return {
      provider: 'local-sky',
      mode: 'local-calculation',
      target,
      physicalSky: true,
      sourcePath: 'src/lib/astronomy/stars.ts',
      frame: 'J2000 catalogue → approximate of-date horizontal projection',
      model: '70-anchor Yale BSC-style bright-star catalogue with approximate precession',
      quality: 'catalogue-projection',
      coordinates: {
        ...copyCoordinates(EMPTY_COORDINATES),
        altitudeDeg: point.altitudeDeg,
        azimuthDeg: point.azimuthDeg,
        direction: compassDirection(point.azimuthDeg),
        altitudeBand: altitudeBand(point.altitudeDeg),
        source: 'bright-star catalogue',
      },
      note: 'This is a fixed catalogue anchor projected into the local sky. It is not an image, surveyed constellation boundary, or precision astrometric solution.',
    };
  }

  if (target.kind === 'constellation') {
    const members = STARS.filter(star => star.constellation === target.id);
    return {
      provider: 'local-sky',
      mode: 'local-calculation',
      target,
      physicalSky: true,
      sourcePath: 'src/lib/astronomy/stars.ts',
      frame: 'J2000 anchor stars → local projected pattern',
      model: 'schematic constellation stick-figure overlay',
      quality: 'schematic',
      coordinates: copyCoordinates(EMPTY_COORDINATES),
      note: members.length > 0
        ? `${members.length} catalogue anchors define this orientation pattern. A constellation has no single physical altitude, azimuth, or centre coordinate in this instrument.`
        : 'No local anchor members were found for this pattern; no coordinate was invented.',
    };
  }

  return {
    provider: 'local-sky',
    mode: 'local-calculation',
    target,
    physicalSky: false,
    sourcePath: 'src/lib/astronomy/projection.ts',
    frame: 'local sky projection',
    model: 'event target not yet connected to a local calculation',
    quality: 'unavailable',
    coordinates: copyCoordinates(EMPTY_COORDINATES),
    note: 'This event target is reserved for a reviewed provider or event-specific calculation. No local position was invented.',
  };
}
