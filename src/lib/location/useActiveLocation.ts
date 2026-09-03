'use client';

/**
 * useActiveLocation — React binding for the canonical active-location
 * resolver. Re-renders on: location events (both legacy event names),
 * storage updates, and GPS grant state changes. It never prompts for
 * geolocation permission.
 */

import { useEffect, useState } from 'react';
import { getActiveProfile } from '@/lib/profileStore';
import {
  ActiveLocation,
  ActiveLocationInput,
  UNKNOWN_LOCATION,
  resolveActiveLocation,
  resolveActiveLocationFromBrowser,
  ACTIVE_CITY_CHANGE_EVENT,
} from './activeLocation';

export interface ActiveLocationState {
  location: ActiveLocation;
  /** True while the async GPS grant check is still running. */
  resolving: boolean;
  refresh: () => void;
}

export function useActiveLocation(): ActiveLocationState {
  const [location, setLocation] = useState<ActiveLocation>(() => {
    if (typeof window === 'undefined') return UNKNOWN_LOCATION;
    return resolveActiveLocation({
      profile: readProfileSafe(),
      activeCity: readActiveCitySafe(),
      persisted: readPersistedSafe(),
    });
  });
  const [resolving, setResolving] = useState(false);

  const refreshSync = () => {
    setLocation(
      resolveActiveLocation({
        profile: readProfileSafe(),
        activeCity: readActiveCitySafe(),
        persisted: readPersistedSafe(),
      }),
    );
  };

  const refreshAsync = () => {
    refreshSync();
    setResolving(true);
    resolveActiveLocationFromBrowser()
      .then(setLocation)
      .finally(() => setResolving(false));
  };

  useEffect(() => {
    refreshAsync();
    const handleEvent = () => refreshSync();
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'cosmictantra_active_city' ||
        e.key === 'cosmictantra_current_location' ||
        e.key === 'cosmictantra_active_profile_id' ||
        e.key === 'cosmictantra_profiles_v1'
      ) {
        refreshSync();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(ACTIVE_CITY_CHANGE_EVENT, handleEvent);
      window.addEventListener('cosmictantra:location-change', handleEvent);
      window.addEventListener('storage', handleStorage);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(ACTIVE_CITY_CHANGE_EVENT, handleEvent);
        window.removeEventListener('cosmictantra:location-change', handleEvent);
        window.removeEventListener('storage', handleStorage);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location, resolving, refresh: refreshAsync };
}

/* Safe readers — the resolver must never throw in the UI. */
function readProfileSafe(): ActiveLocationInput['profile'] {
  try {
    return getActiveProfile();
  } catch {
    return null;
  }
}

function readActiveCitySafe(): ActiveLocationInput['activeCity'] {
  try {
    const raw = window.localStorage.getItem('cosmictantra_active_city');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readPersistedSafe(): ActiveLocationInput['persisted'] {
  try {
    const raw = window.localStorage.getItem('cosmictantra_current_location');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
