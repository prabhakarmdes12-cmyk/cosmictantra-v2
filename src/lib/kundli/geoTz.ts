/**
 * Kundli pipeline — place & timezone resolution (GATE 1b).
 *
 * Resolves the birth place to coordinates (GEOCODED via the CosmicTantra
 * city table when the name matches) and the birth instant to a real,
 * historically-correct UTC offset. IANA rules are preferred; the legacy
 * numeric `tz` field of the city table is accepted only as ESTIMATED
 * provenance and never silently mixed with IANA resolution.
 */

import { KundliError } from './errors';
import { KUNDLI_PIPELINE_CONFIG } from './config';
import type { BirthCoordinates, RawBirthInput, ResolvedTimezone, NormalizedBirthProfile } from './types';
import { CITIES, type CityCoordinate } from '../cities';
import { validateResolvedTimezone } from './validation';

export interface PlaceResolution {
  locationName: string;
  coordinates: BirthCoordinates;
}

/** Fuzzy city-name match against the CosmicTantra city table. */
export function lookupCity(name: string): CityCoordinate | null {
  const q = name.trim().toLowerCase();
  if (!q) return null;
  const exact = CITIES.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact;
  const prefix = CITIES.find(
    (c) => c.name.toLowerCase().startsWith(q) || q.startsWith(c.name.toLowerCase()),
  );
  if (prefix) return prefix;
  return CITIES.find((c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase())) ?? null;
}

/**
 * Resolves coordinates from a place name when the user did not supply them.
 * Provenance is GEOCODED. Unknown places fail with KUNDLI_COORDINATES_INVALID.
 */
export function resolvePlaceFromCity(locationName: string): PlaceResolution {
  const city = lookupCity(locationName);
  if (!city) {
    throw new KundliError('KUNDLI_COORDINATES_INVALID', 'birth place not found in the city table', { locationName });
  }
  return {
    locationName: city.name,
    coordinates: { latitude: city.lat, longitude: city.lng, provenance: 'GEOCODED' },
  };
}

/** True when the coordinates fall inside the approximate Indian bounding box. */
export function isInsideIndiaBox(latitude: number, longitude: number): boolean {
  const b = KUNDLI_PIPELINE_CONFIG.geo.indiaBox;
  return latitude >= b.minLat && latitude <= b.maxLat && longitude >= b.minLng && longitude <= b.maxLng;
}

/** Parses Intl's "GMT+05:30" timeZoneName into hours (5.5). */
export function offsetFromGmtString(gmt: string): number {
  const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(gmt);
  if (!m) throw new KundliError('KUNDLI_TIMEZONE_INVALID', 'could not parse timezone offset', { gmt });
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) + (m[3] ? Number(m[3]) / 60 : 0));
}

/**
 * Converts a local date-time (YYYY-MM-DDTHH:mm:ss) and fixed offset (hours)
 * to an ISO-8601 UTC instant. Throws KUNDLI_TIMEZONE_INVALID on garbage.
 */
export function localToUtcIso(localDateTime: string, offsetHours: number): string {
  const withSeconds = /:\d{2}:\d{2}$/.test(localDateTime) ? localDateTime : `${localDateTime}:00`;
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const hh = String(Math.floor(abs)).padStart(2, '0');
  const mm = String(Math.round((abs % 1) * 60)).padStart(2, '0');
  const dt = new Date(`${withSeconds}${sign}${hh}:${mm}`);
  if (Number.isNaN(dt.getTime())) {
    throw new KundliError('KUNDLI_TIMEZONE_INVALID', 'cannot convert local time to UTC', { localDateTime });
  }
  return dt.toISOString();
}

export interface TimezoneResolution {
  timezoneId: string | null;
  numericOffset: number | null;
  offsetProvenance: 'IANA_HISTORICAL' | 'USER_SUPPLIED' | 'ESTIMATED' | 'REGION_INFERRED';
}

/**
 * Establishes the timezone for the birth: explicit IANA id > city table
 * (Asia/Kolkata for Indian cities) > Indian bounding box > numeric offset.
 */
export function resolveTimezoneId(raw: RawBirthInput, coords: BirthCoordinates, locationName: string): TimezoneResolution {
  if (raw.timezoneId) {
    return { timezoneId: raw.timezoneId, numericOffset: null, offsetProvenance: 'IANA_HISTORICAL' };
  }
  // An explicit numeric offset wins over table inference (user intent).
  if (typeof raw.utcOffsetHours === 'number' && Number.isFinite(raw.utcOffsetHours)) {
    const inIndia = isInsideIndiaBox(coords.latitude, coords.longitude);
    return {
      timezoneId: inIndia ? KUNDLI_PIPELINE_CONFIG.geo.fallbackTimezoneId : null,
      numericOffset: raw.utcOffsetHours,
      offsetProvenance: inIndia ? 'REGION_INFERRED' : 'USER_SUPPLIED',
    };
  }
  const city = lookupCity(locationName);
  if (city) {
    if (city.tz === 5.5) {
      return { timezoneId: 'Asia/Kolkata', numericOffset: null, offsetProvenance: 'IANA_HISTORICAL' };
    }
    // Non-standard offset in the table (Port Blair, foreign cities): use the
    // table's numeric offset, honestly marked as ESTIMATED, not IANA-resolved.
    return { timezoneId: null, numericOffset: city.tz, offsetProvenance: 'ESTIMATED' };
  }
  if (isInsideIndiaBox(coords.latitude, coords.longitude)) {
    return { timezoneId: KUNDLI_PIPELINE_CONFIG.geo.fallbackTimezoneId, numericOffset: null, offsetProvenance: 'IANA_HISTORICAL' };
  }
  return { timezoneId: null, numericOffset: null, offsetProvenance: 'ESTIMATED' };
}

/**
 * Computes the historical UTC offset for the IANA zone at the given local
 * date-time via Intl timezone rules. Throws KUNDLI_TIMEZONE_INVALID when the
 * zone cannot be resolved.
 */
export function historicalOffsetHours(timezoneId: string, localDateTime: string): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: timezoneId, timeZoneName: 'longOffset' });
    const parts = fmt.formatToParts(new Date(localDateTime));
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (tzPart) return offsetFromGmtString(tzPart.value);
  } catch {
    // fall through to the typed error
  }
  throw new KundliError('KUNDLI_TIMEZONE_INVALID', 'timezone id could not be resolved', { timezoneId, localDateTime });
}

export interface GeoTimezoneResolution {
  profile: NormalizedBirthProfile;
}

export interface PlaceAndTimezoneResult {
  profile: NormalizedBirthProfile;
  timezoneResolvedFrom: string;
}

/**
 * Compatibility entry used by the invariants suite: surfaces the timezone
 * already resolved on the normalized profile with its provenance.
 */
export function resolvePlaceAndTimezone(profile: NormalizedBirthProfile): PlaceAndTimezoneResult {
  const prov = profile.timezone.offsetProvenance;
  return {
    profile,
    timezoneResolvedFrom:
      prov === 'IANA_HISTORICAL' ? 'IANA_HISTORICAL' : prov === 'REGION_INFERRED' ? 'REGION_INFERRED' : 'USER_SUPPLIED',
  };
}

/**
 * Full GATE-1b resolution: coordinates + timezone for a validated input.
 * Returns the normalized profile with UTC instant, offset, and provenance.
 */
export function resolveGeoTimezone(
  input: { name: string; birthDate: string; birthTime: string; locationName: string; coordinates: BirthCoordinates },
  raw: RawBirthInput,
): GeoTimezoneResolution {
  const localDateTime = `${input.birthDate}T${input.birthTime}`;
  const tzRes = resolveTimezoneId(raw, input.coordinates, input.locationName);

  let timezone: ResolvedTimezone;
  if (tzRes.timezoneId && tzRes.offsetProvenance === 'IANA_HISTORICAL') {
    timezone = {
      timezoneId: tzRes.timezoneId,
      utcOffsetAtBirth: historicalOffsetHours(tzRes.timezoneId, localDateTime),
      offsetProvenance: 'IANA_HISTORICAL',
      localDateTime,
      utcDateTime: '',
    };
  } else if (tzRes.numericOffset !== null) {
    timezone = {
      timezoneId: 'LEGACY_NUMERIC_OFFSET',
      utcOffsetAtBirth: tzRes.numericOffset,
      offsetProvenance: tzRes.offsetProvenance,
      localDateTime,
      utcDateTime: '',
    };
  } else {
    throw new KundliError('KUNDLI_TIMEZONE_INVALID', 'no timezone could be established for the birth place', {
      locationName: input.locationName,
    });
  }

  timezone.utcDateTime = localToUtcIso(localDateTime, timezone.utcOffsetAtBirth);
  validateResolvedTimezone(timezone);

  return {
    profile: {
      name: input.name,
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      locationName: input.locationName,
      coordinates: input.coordinates,
      timezone,
      fingerprint: '',
    },
  };
}
