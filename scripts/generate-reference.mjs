#!/usr/bin/env node

/**
 * Fetch a small, review-only JPL Horizons snapshot.
 *
 * This is deliberately not imported by the browser. Run it from a networked
 * qualification environment, inspect the returned frame/epoch assumptions,
 * parse the reviewed quantities into the provider schema, then commit only
 * the small fixture. The default request is geocentric for compatibility;
 * set REFERENCE_MODE=topocentric to exercise a deliberate observer location.
 */
import { mkdir, writeFile } from 'node:fs/promises';

const epoch = process.env.REFERENCE_EPOCH || '2026-08-25T00:00:00Z';
const output = process.env.REFERENCE_OUTPUT || 'docs/observatory/reference-fixture-draft.json';
const mode = process.env.REFERENCE_MODE || 'geocentric';
const api = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const bodies = {
  Sun: 10,
  Moon: 301,
  Mercury: 199,
  Venus: 299,
  Mars: 499,
  Jupiter: 599,
  Saturn: 699,
};

if (!['geocentric', 'topocentric'].includes(mode)) {
  throw new Error(`Invalid REFERENCE_MODE: ${mode}; use geocentric or topocentric`);
}

const epochDate = new Date(epoch);
if (!Number.isFinite(epochDate.getTime())) throw new Error(`Invalid REFERENCE_EPOCH: ${epoch}`);
const stop = new Date(epochDate.getTime() + 60 * 1000).toISOString();

const observer = {
  longitudeDeg: Number(process.env.REFERENCE_LONGITUDE || '85.1376'),
  latitudeDeg: Number(process.env.REFERENCE_LATITUDE || '25.5941'),
  elevationM: Number(process.env.REFERENCE_ELEVATION_M || '53'),
  label: process.env.REFERENCE_OBSERVER_LABEL || 'Patna, India',
};
if (![observer.longitudeDeg, observer.latitudeDeg, observer.elevationM].every(Number.isFinite)) {
  throw new Error('Topocentric observer values must be finite numbers');
}
if (mode === 'topocentric' && (observer.longitudeDeg < -180 || observer.longitudeDeg > 180 || observer.latitudeDeg < -90 || observer.latitudeDeg > 90)) {
  throw new Error('Topocentric observer longitude/latitude are outside valid ranges');
}

const center = mode === 'topocentric' ? "'coord@399'" : "'500@399'";
const responses = {};
for (const [name, command] of Object.entries(bodies)) {
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${command}'`,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: center,
    START_TIME: `'${epoch}'`,
    STOP_TIME: `'${stop}'`,
    STEP_SIZE: "'1 m'",
    QUANTITIES: process.env.REFERENCE_QUANTITIES || "'1,31,33'",
    CSV_FORMAT: 'YES',
  });
  if (mode === 'topocentric') {
    params.set('COORD_TYPE', "'GEODETIC'");
    params.set('SITE_COORD', `'${observer.longitudeDeg},${observer.latitudeDeg},${observer.elevationM}'`);
  }
  const response = await fetch(`${api}?${params}`);
  if (!response.ok) throw new Error(`Horizons ${name} request failed: HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(`Horizons ${name}: ${payload.error}`);
  responses[name] = payload.result;
}

await mkdir(output.replace(/\/[^/]+$/, ''), { recursive: true });
await writeFile(output, `${JSON.stringify({
  schemaVersion: 1,
  reviewStatus: 'draft-raw-responses',
  fixtureId: `observatory-draft-${epoch.replace(/[^0-9]/g, '').slice(0, 12)}-${mode}`,
  generatedAt: new Date().toISOString(),
  epochUtc: epochDate.toISOString(),
  stopUtc: stop,
  timeScale: 'UTC',
  center: mode === 'topocentric' ? 'coord@399 (topocentric geodetic observer)' : '500@399 (geocentric)',
  observer: mode === 'topocentric' ? observer : undefined,
  frame: 'REVIEW REQUIRED — inspect Horizons output before freezing',
  plane: 'REVIEW REQUIRED — inspect Horizons output before freezing',
  apparent: true,
  refraction: false,
  quantities: process.env.REFERENCE_QUANTITIES || '1,31,33',
  sourceUrl: api,
  reviewNote: 'Draft only. Parse and review the raw responses, confirm epoch/frame/observer/quantities, then move reviewed observations into the provider fixture schema. This file must not be treated as reference-checked application data.',
  responses,
}, null, 2)}\n`);
console.log(`Wrote ${output}`);
