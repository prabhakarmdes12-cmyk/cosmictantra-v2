import type { CanonicalBodyName } from '../canonicalBodies';

/**
 * Shared vocabulary for local calculations and future frozen/reference data.
 * The browser may use a local result even when no reference fixture exists.
 */
export type EphemerisProvider = 'local-approximation' | 'jpl-horizons-fixture' | 'spice-derived';
export type EphemerisQuality = 'illustrative' | 'reference-checked' | 'mission-archive';

export type EphemerisFrame =
  | 'tropical-ecliptic'
  | 'sidereal-ecliptic'
  | 'of-date-equatorial'
  | 'of-date-horizontal';

export interface EphemerisErrorBudget {
  longitudeDeg?: number;
  latitudeDeg?: number;
  rightAscensionArcsec?: number;
  declinationArcsec?: number;
  note?: string;
}

export interface EphemerisProvenance {
  provider: EphemerisProvider;
  model: string;
  epochUtc: string;
  frame: EphemerisFrame;
  observer: string;
  quality: EphemerisQuality;
  sourceUrl: string;
  fixtureId?: string;
  errorBudget?: EphemerisErrorBudget;
  note: string;
}

export interface EphemerisResult {
  body: CanonicalBodyName;
  longitudeDeg: number;
  latitudeDeg: number;
  rightAscensionHours: number;
  declinationDeg: number;
  distanceAu: number;
  provenance: EphemerisProvenance;
}

/** Metadata captured when a reviewed JPL/SPICE snapshot is frozen. */
export interface ReferenceFixtureMetadata {
  schemaVersion: 1;
  fixtureId: string;
  generatedAt: string;
  epochUtc: string;
  stopUtc?: string;
  timeScale: 'UTC' | 'TDB' | 'TT' | 'unknown';
  center: string;
  observer?: {
    longitudeDeg: number;
    latitudeDeg: number;
    elevationM: number;
    label?: string;
  };
  frame: string;
  plane: string;
  apparent: boolean;
  refraction: boolean;
  quantities: string;
  sourceUrl: string;
  reviewNote: string;
}

export interface ReferenceFixtureObservation {
  body: Exclude<CanonicalBodyName, 'Rahu' | 'Ketu'>;
  epochUtc: string;
  longitudeDeg: number;
  latitudeDeg: number;
  rightAscensionHours?: number;
  declinationDeg?: number;
  distanceAu?: number;
  observerKey?: string;
}

export interface ReferenceFixture extends ReferenceFixtureMetadata {
  observations: ReferenceFixtureObservation[];
}
