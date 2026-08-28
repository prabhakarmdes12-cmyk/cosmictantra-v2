import { CITIES, DEFAULT_CITY, CityCoordinate } from './cities';

export interface LocationAnchor {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  tz: number;
  isGps?: boolean;
  accuracy?: number;
  altitude?: number | null;
  nameHi?: string;
  nearestCityName?: string;
  distanceToNearestKm?: number;
  timestamp?: number;
}

// Great-circle distance between two points using Haversine formula (in km)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest reference city in our 350+ cities database
export function findNearestCity(lat: number, lng: number): { city: CityCoordinate; distanceKm: number } {
  let nearestCity = CITIES[0];
  let minDistance = Infinity;

  for (const city of CITIES) {
    const dist = calculateDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = city;
    }
  }

  return {
    city: nearestCity,
    distanceKm: Math.round(minDistance * 10) / 10
  };
}

// Determine rough timezone offset from longitude (defaulting to IST 5.5 for India bounds)
export function estimateTimezone(lat: number, lng: number): number {
  // Check if roughly within India geographic bounding box (Lat 6N-38N, Lng 68E-98E)
  if (lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
    return 5.5; // Indian Standard Time
  }
  // Otherwise standard longitude approximation: UTC offset = Lng / 15 rounded to 0.5
  return Math.round((lng / 15) * 2) / 2;
}

export interface GpsAcquisitionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

// Real-time GPS location acquirer with satellite accuracy and nearest reference city calculation
export async function getCurrentGpsLocation(options: GpsAcquisitionOptions = {}): Promise<LocationAnchor> {
  if (typeof window === 'undefined' || !navigator?.geolocation) {
    throw new Error('Geolocation is not supported in this environment.');
  }

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0
  } = options;

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const rawLat = position.coords.latitude;
        const rawLng = position.coords.longitude;
        const lat = parseFloat(rawLat.toFixed(4));
        const lng = parseFloat(rawLng.toFixed(4));
        const accuracy = Math.round(position.coords.accuracy || 10);
        const altitude = position.coords.altitude;

        const { city: nearest, distanceKm } = findNearestCity(lat, lng);
        const tz = estimateTimezone(lat, lng);

        const location: LocationAnchor = {
          id: `gps-${lat}-${lng}`,
          name: distanceKm < 15 ? nearest.name : `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`,
          state: nearest.state,
          country: nearest.country || 'India',
          lat,
          lng,
          tz,
          isGps: true,
          accuracy,
          altitude,
          nameHi: distanceKm < 15 ? nearest.nameHi : `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E (GPS)`,
          nearestCityName: nearest.name,
          distanceToNearestKm: distanceKm,
          timestamp: position.timestamp || Date.now()
        };

        // Automatically persist in localStorage
        persistLocation(location);

        resolve(location);
      },
      (error) => {
        let msg = 'Failed to acquire GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'GPS permission denied. Please allow location access in browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location position unavailable. Check GPS satellite signal.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'GPS acquisition request timed out. Please retry.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  });
}

// Watch real-time GPS position continuously
export function watchRealtimeGps(
  onLocationUpdate: (location: LocationAnchor) => void,
  onError?: (err: Error) => void,
  options: GpsAcquisitionOptions = {}
): () => void {
  if (typeof window === 'undefined' || !navigator?.geolocation) {
    if (onError) onError(new Error('Geolocation is not supported.'));
    return () => {};
  }

  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 2000
  } = options;

  let lastLat = 0;
  let lastLng = 0;

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = parseFloat(position.coords.latitude.toFixed(4));
      const lng = parseFloat(position.coords.longitude.toFixed(4));

      // Filter micro-jitter: only update if moved more than ~20 meters
      if (Math.abs(lat - lastLat) < 0.0002 && Math.abs(lng - lastLng) < 0.0002) {
        return;
      }

      lastLat = lat;
      lastLng = lng;

      const { city: nearest, distanceKm } = findNearestCity(lat, lng);
      const tz = estimateTimezone(lat, lng);

      const location: LocationAnchor = {
        id: `gps-${lat}-${lng}`,
        name: distanceKm < 15 ? nearest.name : `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`,
        state: nearest.state,
        country: nearest.country || 'India',
        lat,
        lng,
        tz,
        isGps: true,
        accuracy: Math.round(position.coords.accuracy || 10),
        altitude: position.coords.altitude,
        nameHi: distanceKm < 15 ? nearest.nameHi : `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E (GPS)`,
        nearestCityName: nearest.name,
        distanceToNearestKm: distanceKm,
        timestamp: position.timestamp || Date.now()
      };

      persistLocation(location);
      onLocationUpdate(location);
    },
    (error) => {
      if (onError) onError(new Error(error.message));
    },
    { enableHighAccuracy, timeout, maximumAge }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

const STORAGE_KEY = 'cosmictantra_current_location';
export const LOCATION_CHANGE_EVENT = 'cosmictantra:location-change';

// Get stored location from localStorage or fallback to default
export function getPersistedLocation(): LocationAnchor {
  if (typeof window === 'undefined') return DEFAULT_CITY;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return DEFAULT_CITY;
}

// Persist location and dispatch cross-window event
export function persistLocation(location: LocationAnchor): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT, { detail: location }));
  } catch {}
}
