/**
 * Generates an immutable JPL Horizons raw-reference fixture.
 * Run manually in a networked release environment; never at application runtime.
 * Usage: node scripts/generate-horizons-reference.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
const bodies = { Sun: '10', Moon: '301', Mercury: '199', Venus: '299', Mars: '499', Jupiter: '599', Saturn: '699' };
const locations = [
  { name: 'Dhanbad', latitude: 23.7957, longitude: 86.4304, elevationKm: 0 },
  { name: 'Varanasi', latitude: 25.3176, longitude: 82.9739, elevationKm: 0 },
  { name: 'London', latitude: 51.5074, longitude: -0.1278, elevationKm: 0 },
];
const instants = ['2000-01-01 12:00:00', '2026-08-25 21:11:00', '2050-06-15 00:00:00'];
function query(body, location, instant) {
 const params = new URLSearchParams({ format: 'json', COMMAND: `'${body}'`, OBJ_DATA: 'NO', MAKE_EPHEM: 'YES', EPHEM_TYPE: 'OBSERVER', CENTER: "'coord@399'", COORD_TYPE: 'GEODETIC', SITE_COORD: `'${location.longitude},${location.latitude},${location.elevationKm}'`, TLIST: `'${instant}'`, TLIST_TYPE: 'CAL', TIME_TYPE: 'UT', TIME_ZONE: "'+00:00'", TIME_DIGITS: 'SECONDS', QUANTITIES: "'1,2,4,20'", ANG_FORMAT: 'DEG', APPARENT: 'REFRACTED', RANGE_UNITS: 'AU', CSV_FORMAT: 'YES' });
 return `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
}
const cases = [];
for (const [body, command] of Object.entries(bodies)) for (const observer of locations) for (const instant of instants) {
 const url = query(command, observer, instant); const response = await fetch(url, { headers: { 'user-agent': 'CosmicTantra Observatory reference-fixture generator/1.0' } });
 if (!response.ok) throw new Error(`Horizons ${response.status} for ${body}/${observer.name}`);
 const payload = await response.json(); if (!payload.result?.includes('$$SOE')) throw new Error(`Unexpected Horizons response for ${body}/${observer.name}: ${payload.error || 'missing table'}`);
 cases.push({ id: `${body}-${observer.name}-${instant.replaceAll(/[: ]/g, '-')}`, body, observer, utcInstant: `${instant.replace(' ', 'T')}Z`, requestUrl: url, rawResult: payload.result });
}
const fixture = { schemaVersion: 1, generatedAt: new Date().toISOString(), source: { provider: 'NASA/JPL Horizons', api: 'https://ssd.jpl.nasa.gov/api/horizons.api', queryMode: 'topocentric observer ephemeris, UT, apparent/refraction, ICRF default', warning: 'Raw responses are retained so parser changes remain auditable.' }, cases };
await mkdir('tests/observatory/fixtures', { recursive: true }); await writeFile('tests/observatory/fixtures/horizons-reference.json', `${JSON.stringify(fixture, null, 2)}\n`); console.log(`Wrote ${cases.length} JPL Horizons reference cases.`);
