/**
 * CANONICAL ACTIVE-LOCATION RESOLVER — one truth source for "where is the
 * user right now", shared by the navigation shell and Kashi Sahayak context.
 *
 * Sprint B.1 §2: no independent location store, no silent Varanasi/Dhanbad
 * pretence. Precedence (highest first):
 *
 *   1. active signed-in / profile location   (birth place on the active profile)
 *   2. explicit user-selected active city    (cosmictantra_active_city)
 *   3. GPS location IF permission granted    (never prompts here)
 *   4. persisted location                    (cosmictantra_current_location)
 *   5. UNKNOWN — never an invented city
 *
 * The resolver is PURE (`resolveActiveLocation`) so it can be unit-tested
 * without a browser; browser bindings are thin wrappers over existing stores.
 */

import { getActiveProfile } from '@/lib/profileStore';
import { getPersistedLocation } from '@/lib/location';

export type LocationTruthSource = 'PROFILE' | 'ACTIVE_CITY' | 'GPS' | 'PERSISTED' | 'NONE';

export interface ProfileLocationLike {
  birthCity?: string | null;
  lat?: number | null;
  lng?: number | null;
  tz?: number | null;
}

export interface ActiveLocationInput {
  profile?: ProfileLocationLike | null;
  /** Explicit user-selected active city (cosmictantra_active_city). */
  activeCity?: { name?: string; nameHi?: string; lat?: number; lng?: number; lon?: number; tz?: number; isGps?: boolean } | null;
  /** GPS locked coordinates. Only pass when permission is already granted. */
  gps?: { name?: string; state?: string; lat?: number; lng?: number; tz?: number; accuracy?: number } | null;
  /** Legacy persisted location (cosmictantra_current_location). */
  persisted?: { name?: string; nameHi?: string; lat?: number; lng?: number; lon?: number; tz?: number; isGps?: boolean } | null;
}

export interface ActiveLocation {
  status: 'KNOWN' | 'UNKNOWN';
  /** Human label for the nav pill. */
  name: string;
  nameHi?: string;
  lat: number | null;
  lng: number | null;
  tz: number | null;
  isGps: boolean;
  source: LocationTruthSource;
  /** Machine key Kashi Sahayak context uses. */
  contextKey: LocationTruthSource;
}

export const UNKNOWN_LOCATION: ActiveLocation = {
  status: 'UNKNOWN',
  name: '',
  lat: null,
  lng: null,
  tz: null,
  isGps: false,
  source: 'NONE',
  contextKey: 'NONE',
};

/**
 * Pure precedence resolution. Pass any of the four sources; the fifth state
 * (UNKNOWN) is returned when none of them carries usable coordinates.
 */
export function resolveActiveLocation(input: ActiveLocationInput = {}): ActiveLocation {
  const numeric = (v: unknown): number | null => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const lngOf = (city: { lat?: number; lng?: number; lon?: number } | null | undefined): number | null =>
    numeric(city?.lng ?? city?.lon);

  const profile = input.profile;
  if (profile && profile.birthCity && numeric(profile.lat) !== null && lngOf(profile as { lat?: number; lng?: number }) !== null) {
    return {
      status: 'KNOWN',
      name: profile.birthCity.trim(),
      lat: numeric(profile.lat),
      lng: numeric(profile.lng),
      tz: numeric(profile.tz),
      isGps: false,
      source: 'PROFILE',
      contextKey: 'PROFILE',
    };
  }

  const activeCity = input.activeCity;
  if (activeCity && activeCity.name && numeric(activeCity.lat) !== null && lngOf(activeCity) !== null) {
    return {
      status: 'KNOWN',
      name: activeCity.name.trim(),
      nameHi: activeCity.nameHi,
      lat: numeric(activeCity.lat),
      lng: lngOf(activeCity),
      tz: numeric(activeCity.tz),
      isGps: Boolean(activeCity.isGps),
      source: 'ACTIVE_CITY',
      contextKey: 'ACTIVE_CITY',
    };
  }

  const gps = input.gps;
  if (gps && numeric(gps.lat) !== null && lngOf(gps) !== null) {
    return {
      status: 'KNOWN',
      name: gps.name?.trim() || 'GPS',
      lat: numeric(gps.lat),
      lng: lngOf(gps),
      tz: numeric(gps.tz),
      isGps: true,
      source: 'GPS',
      contextKey: 'GPS',
    };
  }

  const persisted = input.persisted;
  if (persisted && persisted.name && numeric(persisted.lat) !== null && lngOf(persisted) !== null) {
    return {
      status: 'KNOWN',
      name: persisted.name.trim(),
      nameHi: persisted.nameHi,
      lat: numeric(persisted.lat),
      lng: lngOf(persisted),
      tz: numeric(persisted.tz),
      isGps: Boolean(persisted.isGps),
      source: 'PERSISTED',
      contextKey: 'PERSISTED',
    };
  }

  return UNKNOWN_LOCATION;
}

export const ACTIVE_CITY_STORAGE_KEY = 'cosmictantra_active_city';
/** Underscore event used by CosmicNow + FloatingAIGuruAvatar. */
export const ACTIVE_CITY_CHANGE_EVENT = 'cosmictantra:location_changed';

/* ------------------------------------------------------------------ */
/* Browser bindings (thin, existing stores only)                       */
/* ------------------------------------------------------------------ */

export function readProfileLocation(): ProfileLocationLike | null {
  if (typeof window === 'undefined') return null;
  try {
    const profile = getActiveProfile() as ProfileLocationLike | null;
    if (!profile) return null;
    return {
      birthCity: profile.birthCity ?? null,
      lat: typeof profile.lat === 'number' ? profile.lat : null,
      lng: typeof profile.lng === 'number' ? profile.lng : null,
      tz: typeof profile.tz === 'number' ? profile.tz : null,
    };
  } catch {
    return null;
  }
}

export function readActiveCity(): ActiveLocationInput['activeCity'] {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_CITY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readPersistedActiveLocation(): ActiveLocationInput['persisted'] {
  if (typeof window === 'undefined') return null;
  try {
    return getPersistedLocation();
  } catch {
    return null;
  }
}

/** Returns GPS only when permission was previously granted — never prompts. */
export function readGpsIfGranted(): Promise<ActiveLocationInput['gps']> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    const finish = (perm: string) => {
      if (perm !== 'granted') {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // do not import location.ts (it is the legacy module); minimal fields
          const tz = defaultTzForCoords(pos.coords.latitude, pos.coords.longitude);
          resolve({
            name: 'Live GPS Location',
            state: 'GPS Lock',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            tz,
            accuracy: pos.coords.accuracy || 10,
          });
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 },
      );
    };
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((p) => finish(p.state))
        .catch(() => resolve(null));
    } else {
      resolve(null);
    }
  });
}

function defaultTzForCoords(lat: number, lng: number): number {
  // Same simple inference as the legacy location module (India window).
  if (lat >= 26.3 && lat <= 30.5 && lng >= 80.0 && lng <= 88.2) return 5.75;
  if (lat >= 5.5 && lat <= 37.5 && lng >= 67.5 && lng <= 97.5) return 5.5;
  return 0;
}

/** Resolve every available source into one `ActiveLocation`. */
export async function resolveActiveLocationFromBrowser(): Promise<ActiveLocation> {
  const [gps] = await Promise.all([readGpsIfGranted()]);
  const profile = readProfileLocation();
  const activeCity = readActiveCity();
  const persisted = readPersistedActiveLocation();
  if (profile || activeCity || persisted || gps) {
    return resolveActiveLocation({ profile, activeCity, gps, persisted });
  }
  return UNKNOWN_LOCATION;
}

/**
 * Persist a user selection through the EXISTING stores (no third store):
 *  - `cosmictantra_active_city`  (CosmicNow / FloatingAIGuruAvatar)
 *  - `cosmictantra_current_location` (landing page / legacy pages)
 * and announce on BOTH event names so every existing listener reacts.
 */
export function persistActiveLocation(city: {
  id?: string;
  name: string;
  nameHi?: string;
  lat: number;
  lng: number;
  lon?: number;
  tz?: number;
  isGps?: boolean;
}): void {
  if (typeof window === 'undefined') return;
  const canonical = {
    id: city.id || `city-${Date.now()}`,
    name: city.name,
    nameHi: city.nameHi,
    lat: Number(city.lat),
    lng: Number(city.lng ?? city.lon),
    tz: Number(city.tz ?? 5.5),
    isGps: Boolean(city.isGps),
  };
  try {
    window.localStorage.setItem(ACTIVE_CITY_STORAGE_KEY, JSON.stringify(canonical));
    window.localStorage.setItem('cosmictantra_current_location', JSON.stringify(canonical));
    window.dispatchEvent(new CustomEvent(ACTIVE_CITY_CHANGE_EVENT, { detail: { city: canonical } }));
    window.dispatchEvent(
      new CustomEvent('cosmictantra:location-change', { detail: canonical }),
    );
  } catch {
    // storage may be unavailable (privacy mode) — UI still shows the selection in memory
  }
}
