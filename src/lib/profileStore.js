/**
 * CosmicTantra — Family / Profile Store (localStorage, DPDP-conscious)
 *
 * A single browser keeps a "Parivaar" (family) of birth profiles. This powers:
 * - Family dashboards (per-member kundali, dasha, alerts)
 * - Kundali Milan (needs two profiles)
 * - Auto-fill of /ask and consultation forms
 * - "Cosmic ID" identity (CT-XXXX shown in the PersonalisationBridge)
 *
 * NOTE: localStorage-first by design (zero PII leaves the device for the free
 * tier). The DB-backed AstrologyCustomerProfile model is the production
 * upgrade path once phone-OTP accounts ship — the storage contract below is
 * intentionally identical.
 */

const STORAGE_KEY = 'cosmictantra_profiles_v1';
const ACTIVE_KEY = 'cosmictantra_active_profile_id';

export const RELATIONS = ['Self', 'Spouse', 'Mother', 'Father', 'Son', 'Daughter', 'Sibling', 'In-Law', 'Other'];

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function generateCosmicId() {
  return `CT-${Math.floor(1000 + Math.random() * 8999)}`;
}

export function getProfiles() {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveProfiles(profiles) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function getProfileById(id) {
  return getProfiles().find(p => p.id === id) || null;
}

export function upsertProfile(profile) {
  const profiles = getProfiles();
  const now = new Date().toISOString();
  if (profile.id) {
    const idx = profiles.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...profile, updatedAt: now };
      saveProfiles(profiles);
      return profiles[idx];
    }
  }
  const created = {
    ...profile,
    id: profile.id || `pf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    cosmicId: profile.cosmicId || generateCosmicId(),
    createdAt: now,
    updatedAt: now,
  };
  profiles.unshift(created);
  saveProfiles(profiles);
  return created;
}

export function removeProfile(id) {
  const profiles = getProfiles().filter(p => p.id !== id);
  saveProfiles(profiles);
  if (getActiveProfileId() === id) setActiveProfileId(profiles[0]?.id || null);
}

export function getActiveProfileId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProfileId(id) {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function getActiveProfile() {
  const id = getActiveProfileId();
  return id ? getProfileById(id) : getProfiles()[0] || null;
}

export function setActiveProfile(id) {
  setActiveProfileId(id);
  return getProfileById(id);
}

export function profileSummary(profile) {
  const k = profile?.kundali;
  return {
    cosmicId: profile.cosmicId,
    lagna: k?.lagna?.rashiName,
    moon: k?.moon?.rashiName,
    moonNakshatra: k?.moon?.nakshatra?.name,
  };
}

/**
 * Runs a cached Kundali for a profile (recomputes on demand; stores the
 * immutable snapshot with the profile so the free chart never diverges).
 */
export function kundaliForProfile(profile) {
  if (!profile?.birthDate) return null;
  // Lazy require keeps client bundle lean
  // eslint-disable-next-line
  const { calculateKundali } = require('./astrologyEngine.js');
  const data = calculateKundali({
    birthDate: profile.birthDate,
    birthTime: profile.birthTime || '12:00',
    latitude: profile.lat ?? 25.5941,
    longitude: profile.lng ?? 85.1376,
    timezone: profile.tz ?? 5.5,
    locationName: profile.birthCity || 'Custom Location',
  });
  return data;
}

export function profileFromForm(form) {
  return {
    id: form.id || undefined,
    name: form.name,
    relation: form.relation || 'Self',
    birthDate: form.birthDate,
    birthTime: form.birthTime,
    birthCity: form.birthCity,
    lat: form.birthLat,
    lng: form.birthLon,
    tz: form.timezone,
  };
}
