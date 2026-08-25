#!/usr/bin/env node

/**
 * Fetch a small, review-only JPL Horizons snapshot.
 *
 * This is deliberately not imported by the browser. Run it from a networked
 * qualification environment, inspect the returned frame/epoch assumptions,
 * then commit the small fixture if the review team wants it frozen.
 */
import { mkdir, writeFile } from 'node:fs/promises';

const epoch = process.env.REFERENCE_EPOCH || '2026-08-25T00:00:00Z';
const output = process.env.REFERENCE_OUTPUT || 'docs/observatory/reference-fixture.json';
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

const epochDate = new Date(epoch);
if (!Number.isFinite(epochDate.getTime())) throw new Error(`Invalid REFERENCE_EPOCH: ${epoch}`);
const stop = new Date(epochDate.getTime() + 60 * 1000).toISOString();

const responses = {};
for (const [name, command] of Object.entries(bodies)) {
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${command}'`,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: "'500@399'",
    START_TIME: `'${epoch}'`,
    STOP_TIME: `'${stop}'`,
    STEP_SIZE: "'1 m'",
    QUANTITIES: "'31'",
    CSV_FORMAT: 'YES',
  });
  const response = await fetch(`${api}?${params}`);
  if (!response.ok) throw new Error(`Horizons ${name} request failed: HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(`Horizons ${name}: ${payload.error}`);
  responses[name] = payload.result;
}

await mkdir(output.replace(/\/[^/]+$/, ''), { recursive: true });
await writeFile(output, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  epoch,
  stop,
  center: '500@399 (geocentric)',
  ephemeris: 'JPL Horizons observer quantities 31; raw responses retained for frame review',
  responses,
}, null, 2)}\n`);
console.log(`Wrote ${output}`);
