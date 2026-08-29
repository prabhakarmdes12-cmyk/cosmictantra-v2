/**
 * PERSONAL TIMELINE (PROGRAM 13 / TRUST-06)
 * =========================================
 * A unified, zoomable timeline of a person's Jyotish periods:
 *   - Vimshottari Mahadasha / Antardasha / Pratyantardasha
 *   - Saturn Sade Sati windows (transit of Saturn over 12th/1st/2nd from Moon)
 *   - Varshaphala year boundaries (solar returns)
 *   - Saturn/Jupiter retrograde bands
 *   - User-entered life events (see outcomeStore)
 *
 * Deterministic and derived from the canonical snapshot — no network. Zoom
 * levels: LIFE / 10Y / YEAR / MONTH / WEEK.
 */

import { calculateKundali } from '../astrologyEngine.js';

export const ZOOM = { LIFE: 'LIFE', TEN_YEAR: '10Y', YEAR: 'YEAR', MONTH: 'MONTH', WEEK: 'WEEK' };

const SIGN_DEG = 30;

/** Flatten Vimshottari periods into dated tracks by level. */
export function dashaTracks(vimshottari) {
  const tracks = { maha: [], antar: [], pratyantar: [] };
  const walk = (periods, level) => {
    for (const p of (periods || [])) {
      const item = { lord: p.lord, level: p.level, start: p.start, end: p.end, startDate: p.startDate, endDate: p.endDate };
      if (p.level === 1) tracks.maha.push(item);
      else if (p.level === 2) tracks.antar.push(item);
      else if (p.level === 3) tracks.pratyantar.push(item);
      if (p.children) walk(p.children, level + 1);
    }
  };
  walk(vimshottari.periods, 1);
  return tracks;
}

/**
 * Compute Saturn Sade Sati windows across a birth→+N years span.
 * Sade Sati runs while Saturn transits the 12th, 1st and 2nd signs from the
 * natal Moon (~7.5 years). Uses the canonical engine to locate Saturn by sign.
 */
export function sadeSatiWindows(kundali, opts = {}) {
  const moonSign = kundali.moon.rasiIndex ?? kundali.moon.rasi ?? Math.floor(kundali.moon.longitude / SIGN_DEG);
  const targetSigns = [(moonSign + 11) % 12, moonSign % 12, (moonSign + 1) % 12]; // 12th, 1st, 2nd from Moon
  const birthYear = new Date(kundali.meta?.birthDate || kundali.metadata?.birthDate || '1990-01-01').getFullYear();
  const startYear = opts.startYear || birthYear;
  const endYear = opts.endYear || (birthYear + 90);

  const windows = [];
  let open = null;
  // Sample every ~30 days — Saturn moves ~1 sign / 2.5 years, so this is ample.
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 0; m < 12; m++) {
      const date = new Date(Date.UTC(y, m, 15));
      const satSign = saturnSignOn(kundali, date);
      const inSadeSati = targetSigns.includes(satSign);
      if (inSadeSati && !open) open = { start: date.toISOString().slice(0, 10), phase: phaseName(satSign, moonSign) };
      else if (!inSadeSati && open) { open.end = date.toISOString().slice(0, 10); windows.push(open); open = null; }
    }
  }
  if (open) { open.end = `${endYear}-12-31`; windows.push(open); }
  return windows;
}

function phaseName(satSign, moonSign) {
  if (satSign === (moonSign + 11) % 12) return 'Rising (12th from Moon)';
  if (satSign === moonSign % 12) return 'Peak (over Moon)';
  return 'Setting (2nd from Moon)';
}

function saturnSignOn(kundali, date) {
  const k = calculateKundali({
    birthDate: date.toISOString().slice(0, 10),
    birthTime: '12:00',
    latitude: kundali.meta?.latitude ?? 25.6,
    longitude: kundali.meta?.longitude ?? 85.1,
    timezone: kundali.meta?.timezone ?? 5.5,
    locationName: 'transit',
  });
  const sat = k.planets.Saturn || k.planets.find?.((p) => p.name === 'Saturn');
  return sat ? (sat.rasiIndex ?? Math.floor(sat.longitude / SIGN_DEG)) : -1;
}

/** Varshaphala (solar return) year boundaries — birthday-anchored age bands. */
export function varshaphalaYears(kundali, count = 90) {
  const bd = new Date(kundali.meta?.birthDate || '1990-01-01');
  const years = [];
  for (let age = 0; age < count; age++) {
    const start = new Date(Date.UTC(bd.getUTCFullYear() + age, bd.getUTCMonth(), bd.getUTCDate()));
    const end = new Date(Date.UTC(bd.getUTCFullYear() + age + 1, bd.getUTCMonth(), bd.getUTCDate()));
    years.push({ age, start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) });
  }
  return years;
}

/**
 * Build the full timeline model for a chart, ready for a zoomable renderer.
 */
export function buildTimeline(pro, opts = {}) {
  const k = pro.kundali;
  const vim = pro.vimshottari;
  const tracks = dashaTracks(vim);
  const sadeSati = sadeSatiWindows(k, opts);
  const varsha = varshaphalaYears(k, opts.years || 90);

  const birthDate = k.meta?.birthDate || k.metadata?.birthDate;
  return {
    subject: opts.name || 'Seeker',
    birthDate,
    zoomLevels: Object.values(ZOOM),
    tracks: {
      mahadasha: tracks.maha,
      antardasha: tracks.antar,
      pratyantardasha: tracks.pratyantar,
      sadeSati,
      varshaphala: varsha,
    },
    lifeEvents: opts.lifeEvents || [],
    provenance: {
      source: 'Vimshottari from Moon nakshatra; Saturn transit via canonical engine; solar-return year bands.',
      deterministic: true,
      versions: pro.versions,
    },
  };
}

/** Which periods/windows are active on a given date (for the "now" cursor). */
export function activeOn(timeline, date) {
  const d = new Date(date).getTime();
  const within = (p) => d >= new Date(p.start).getTime() && d < new Date(p.end).getTime();
  return {
    mahadasha: timeline.tracks.mahadasha.find(within) || null,
    antardasha: timeline.tracks.antardasha.find(within) || null,
    pratyantardasha: timeline.tracks.pratyantardasha.find(within) || null,
    sadeSati: timeline.tracks.sadeSati.find(within) || null,
    varshaphala: timeline.tracks.varshaphala.find(within) || null,
  };
}

export default { ZOOM, dashaTracks, sadeSatiWindows, varshaphalaYears, buildTimeline, activeOn };
