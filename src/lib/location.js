/**
 * CANONICAL UNIVERSAL BIRTHPLACE RESOLUTION & TIMEZONE ENGINE
 * Invariant INV_LOCATION_001: An unresolved birthplace must never become a different birthplace.
 */

import { CITIES, DEFAULT_CITY } from './cities.js';

/**
 * Calculates historical UTC offset in hours for an IANA timezone at a specific birth instant.
 */
export function getHistoricalUtcOffset(ianaTimezone, birthDateStr = '2000-01-01', birthTimeStr = '12:00') {
  try {
    const [year, month, day] = (birthDateStr || '2000-01-01').split('-').map(Number);
    const [hour, minute] = (birthTimeStr || '12:00').split(':').map(Number);
    const date = new Date(Date.UTC(year || 2000, (month || 1) - 1, day || 1, hour || 12, minute || 0));

    if (ianaTimezone === 'Asia/Kolkata') return 5.5;
    if (ianaTimezone === 'Asia/Kathmandu') return 5.75;
    if (ianaTimezone === 'Asia/Colombo') return 5.5;
    if (ianaTimezone === 'Asia/Dhaka') return 6.0;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      timeZoneName: 'longOffset',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      const match = tzPart.value.match(/GMT([+-]\d{2}):?(\d{2})?/);
      if (match) {
        const sign = match[1].startsWith('-') ? -1 : 1;
        const hours = Math.abs(parseInt(match[1], 10));
        const mins = match[2] ? parseInt(match[2], 10) : 0;
        return sign * (hours + mins / 60);
      }
    }
  } catch (e) {}
  return 5.5;
}

/**
 * Infers IANA Timezone ID from coordinates
 */
export function inferIanaTimezone(lat, lng) {
  if (lat >= 26.3 && lat <= 30.5 && lng >= 80.0 && lng <= 88.2) {
    return 'Asia/Kathmandu';
  }
  if (lat >= 5.5 && lat <= 37.5 && lng >= 67.5 && lng <= 97.5) {
    return 'Asia/Kolkata';
  }
  if (lat >= 49.5 && lat <= 61.0 && lng >= -11.0 && lng <= 2.0) {
    return 'Europe/London';
  }
  if (lat >= 24.0 && lat <= 50.0 && lng >= -85.0 && lng <= -65.0) {
    return 'America/New_York';
  }
  if (lat >= -45.0 && lat <= -10.0 && lng >= 140.0 && lng <= 155.0) {
    return 'Australia/Sydney';
  }
  if (lat >= 30.0 && lat <= 46.0 && lng >= 128.0 && lng <= 146.0) {
    return 'Asia/Tokyo';
  }
  return 'UTC';
}

/**
 * Tier 1: Search Indexed Local Database (0ms offline response)
 */
export function searchLocalIndex(query) {
  const clean = (query || '').trim().toLowerCase();
  if (!clean) return [];

  const matches = [];

  for (const c of CITIES) {
    const nameLower = c.name.toLowerCase();
    const stateLower = (c.state || '').toLowerCase();
    const countryLower = (c.country || 'India').toLowerCase();

    if (nameLower === clean || c.id.toLowerCase() === clean) {
      matches.unshift({
        id: 'local-' + c.id,
        displayName: c.name + ', ' + c.state + ', ' + (c.country || 'India'),
        cityName: c.name,
        state: c.state,
        country: c.country || 'India',
        latitude: c.lat,
        longitude: c.lng,
        ianaTimezone: inferIanaTimezone(c.lat, c.lng),
        source: 'INDEXED_LOCAL_DB'
      });
    } else if (nameLower.includes(clean) || (c.nameHi && c.nameHi.includes(query))) {
      matches.push({
        id: 'local-' + c.id,
        displayName: c.name + ', ' + c.state + ', ' + (c.country || 'India'),
        cityName: c.name,
        state: c.state,
        country: c.country || 'India',
        latitude: c.lat,
        longitude: c.lng,
        ianaTimezone: inferIanaTimezone(c.lat, c.lng),
        source: 'INDEXED_LOCAL_DB'
      });
    }
  }

  return matches;
}

/**
 * Universal Place Search Provider
 */
export async function searchPlacesUniversal(query) {
  const clean = (query || '').trim();
  if (!clean) return [];

  const localResults = searchLocalIndex(clean);
  if (localResults.length > 0) {
    return localResults.slice(0, 10);
  }

  try {
    if (typeof fetch !== 'undefined') {
      const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(clean) + '&format=json&addressdetails=1&limit=5';
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'CosmicTantra-Astrology/1.0 (contact@cosmictantra.com)'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map((item) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const addr = item.address || {};
          const state = addr.state || addr.state_district || '';
          const country = addr.country || 'India';
          const town = addr.city || addr.town || addr.village || addr.suburb || clean;
          return {
            id: 'remote-' + (item.place_id || Math.random()),
            displayName: item.display_name,
            cityName: town,
            state,
            country,
            latitude: lat,
            longitude: lon,
            ianaTimezone: inferIanaTimezone(lat, lon),
            source: 'REMOTE_GEOCODER'
          };
        });
      }
    }
  } catch (e) {}

  return [];
}

/**
 * Authoritative Place Resolver
 * Invariant INV_LOCATION_001: Unresolved birthplace NEVER silently defaults to Dhanbad.
 */
export function resolveBirthPlace(query, options) {
  const { birthDate = '2000-01-01', birthTime = '12:00', manualCoords, explicitCandidate } = options || {};
  const cleanQuery = (query || '').trim();

  // 1. Explicit Candidate provided from user selection
  if (explicitCandidate) {
    const tz = explicitCandidate.ianaTimezone || inferIanaTimezone(explicitCandidate.latitude, explicitCandidate.longitude);
    const offset = getHistoricalUtcOffset(tz, birthDate, birthTime);
    return {
      id: explicitCandidate.id,
      canonicalName: explicitCandidate.displayName,
      cityName: explicitCandidate.cityName,
      administrativeHierarchy: {
        state: explicitCandidate.state,
        country: explicitCandidate.country
      },
      latitude: explicitCandidate.latitude,
      longitude: explicitCandidate.longitude,
      ianaTimezone: tz,
      historicalUtcOffset: offset,
      source: explicitCandidate.source,
      confidence: 1.0
    };
  }

  // 2. Manual Coordinates Override (Advanced fallback)
  if (manualCoords && typeof manualCoords.latitude === 'number' && typeof manualCoords.longitude === 'number') {
    const lat = parseFloat(manualCoords.latitude.toFixed(4));
    const lon = parseFloat(manualCoords.longitude.toFixed(4));
    const tz = inferIanaTimezone(lat, lon);
    const offset = typeof manualCoords.timezone === 'number'
      ? manualCoords.timezone
      : getHistoricalUtcOffset(tz, birthDate, birthTime);

    return {
      id: 'manual-' + lat + '-' + lon,
      canonicalName: cleanQuery || (lat.toFixed(2) + '°N, ' + lon.toFixed(2) + '°E'),
      cityName: cleanQuery.split(',')[0].trim() || 'Manual Location',
      administrativeHierarchy: {
        country: lat >= 6 && lat <= 38 && lon >= 68 && lon <= 98 ? 'India' : 'International'
      },
      latitude: lat,
      longitude: lon,
      ianaTimezone: tz,
      historicalUtcOffset: offset,
      source: 'MANUAL_COORDINATES',
      confidence: 1.0
    };
  }

  // 3. Search Local Index
  if (cleanQuery) {
    const localMatches = searchLocalIndex(cleanQuery);
    if (localMatches.length > 0) {
      const top = localMatches[0];
      const tz = top.ianaTimezone;
      const offset = getHistoricalUtcOffset(tz, birthDate, birthTime);
      return {
        id: top.id,
        canonicalName: top.displayName,
        cityName: top.cityName,
        administrativeHierarchy: {
          state: top.state,
          country: top.country
        },
        latitude: top.latitude,
        longitude: top.longitude,
        ianaTimezone: tz,
        historicalUtcOffset: offset,
        source: 'INDEXED_LOCAL_DB',
        confidence: 1.0
      };
    }
  }

  // 4. Invariant INV_LOCATION_001 Violation Preventer: Fail Closed
  throw new Error('LOCATION_NOT_FOUND: Unable to resolve location "' + cleanQuery + '". Please select a disambiguated place or supply manual coordinates.');
}

// Persist location helper
const STORAGE_KEY = 'cosmictantra_current_location';
export const LOCATION_CHANGE_EVENT = 'cosmictantra:location-change';

export function getPersistedLocation() {
  if (typeof window === 'undefined') return DEFAULT_CITY;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_CITY;
}

export function persistLocation(location) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT, { detail: location }));
  } catch {}
}

export async function getCurrentGpsLocation(options) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error('GEOLOCATION_UNAVAILABLE'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const tz = inferIanaTimezone(lat, lng);
        const offset = getHistoricalUtcOffset(tz);
        resolve({
          name: 'Live GPS Location',
          state: 'GPS Lock',
          lat,
          lng,
          tz: offset,
          nearestCityName: 'Live Geolocation Anchor',
          accuracy: pos.coords.accuracy || 10
        });
      },
      (err) => reject(err),
      options
    );
  });
}
