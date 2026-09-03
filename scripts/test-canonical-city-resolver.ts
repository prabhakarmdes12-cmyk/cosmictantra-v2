/**
 * Node Suite: Canonical City Resolver & Location Invariant Test
 * 
 * Verifies:
 * - CT_LOCATION_INV_001: Exactly one canonical city database (src/lib/cities.ts)
 * - Zero source file imports of cities.js
 * - Ranking: Exact match > Prefix match > Substring match
 *   - Patna > Machilipatnam / Visakhapatnam
 *   - Delhi > New Delhi on query "Delhi"
 *   - Varanasi exact rank #1
 *   - Deterministic partial queries
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { searchCities, findCityById, CITIES, DEFAULT_CITY } from '../src/lib/cities';
import {
  verifySingleCityResolverSource,
  CT_LOCATION_INV_001,
  CANONICAL_CITIES_MODULE_PATH,
} from '../src/lib/invariants/locationResolver';

const ROOT = path.resolve(__dirname, '..');

console.log('=== Running Canonical City Resolver Node Test Suite ===\n');

// 1. Invariant verification
console.log('1. Checking CT_LOCATION_INV_001 repository invariant...');
const invResult = verifySingleCityResolverSource(ROOT);
assert.strictEqual(invResult.ok, true, `Invariant violations: ${invResult.violations.join('; ')}`);
assert.strictEqual(invResult.violations.length, 0);

const jsExists = fs.existsSync(path.join(ROOT, 'src/lib/cities.js'));
assert.strictEqual(jsExists, false, 'src/lib/cities.js must NOT exist in the repository');

const tsExists = fs.existsSync(path.join(ROOT, CANONICAL_CITIES_MODULE_PATH));
assert.strictEqual(tsExists, true, 'src/lib/cities.ts must exist as canonical source');
console.log('   ✓ Single source invariant verified (cities.ts canonical, cities.js deleted)');

// 2. Scan source files for stale cities.js imports
console.log('2. Scanning src/ for stale cities.js imports...');
const scanDir = (dir: string): string[] => {
  let badFiles: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      badFiles = badFiles.concat(scanDir(full));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      if (/(import\s+.*from\s+['"][^'"]*cities\.js['"]|require\s*\(\s*['"][^'"]*cities\.js['"]\))/m.test(content)) {
        badFiles.push(path.relative(ROOT, full));
      }
    }
  }
  return badFiles;
};
const staleImports = scanDir(path.join(ROOT, 'src'));
assert.strictEqual(staleImports.length, 0, `Found files importing cities.js: ${staleImports.join(', ')}`);
console.log('   ✓ Zero stale cities.js imports across all src/ files');

// 3. Exact match > substring match: Patna
console.log('3. Checking exact match ranking: Patna...');
const patnaResults = searchCities('Patna');
assert.ok(patnaResults.length >= 3, 'Expected at least 3 matches for Patna');
assert.strictEqual(patnaResults[0].name, 'Patna');
assert.strictEqual(patnaResults[0].id, 'patna');
assert.strictEqual(patnaResults[0].state, 'Bihar');

const patnaNames = patnaResults.map(c => c.name);
const patnaIdx = patnaNames.indexOf('Patna');
const machiliIdx = patnaNames.indexOf('Machilipatnam');
const visakhaIdx = patnaNames.indexOf('Visakhapatnam');

assert.strictEqual(patnaIdx, 0, 'Patna must be the first result');
assert.ok(machiliIdx > patnaIdx, 'Machilipatnam must rank after Patna');
assert.ok(visakhaIdx > patnaIdx, 'Visakhapatnam must rank after Patna');
console.log(`   ✓ Patna (index ${patnaIdx}) ranks before Machilipatnam (index ${machiliIdx}) and Visakhapatnam (index ${visakhaIdx})`);

// 4. Exact match > substring match: Delhi vs New Delhi
console.log('4. Checking exact match ranking: Delhi vs New Delhi...');
const delhiResults = searchCities('Delhi');
assert.ok(delhiResults.length >= 2, 'Expected at least 2 matches for Delhi');
assert.strictEqual(delhiResults[0].name, 'Delhi', 'Delhi must rank first on exact query "Delhi"');

const delhiNames = delhiResults.map(c => c.name);
const dIdx = delhiNames.indexOf('Delhi');
const ndIdx = delhiNames.indexOf('New Delhi');
assert.strictEqual(dIdx, 0);
assert.ok(ndIdx > dIdx, 'New Delhi must rank after Delhi on query "Delhi"');
console.log(`   ✓ Delhi (index ${dIdx}) ranks before New Delhi (index ${ndIdx}) on query "Delhi"`);

// 5. Exact match: New Delhi
console.log('5. Checking exact match: New Delhi...');
const newDelhiResults = searchCities('New Delhi');
assert.ok(newDelhiResults.length >= 1);
assert.strictEqual(newDelhiResults[0].name, 'New Delhi');
assert.strictEqual(newDelhiResults[0].state, 'Delhi');
console.log('   ✓ New Delhi ranks #1 on query "New Delhi"');

// 6. Exact match: Varanasi
console.log('6. Checking exact match: Varanasi...');
const varanasiResults = searchCities('Varanasi');
assert.ok(varanasiResults.length >= 1);
assert.strictEqual(varanasiResults[0].name, 'Varanasi');
assert.strictEqual(varanasiResults[0].state, 'Uttar Pradesh');
assert.ok(Math.abs(varanasiResults[0].lat - 25.3176) < 0.01);
assert.ok(Math.abs(varanasiResults[0].lng - 82.9739) < 0.01);
console.log('   ✓ Varanasi ranks #1 with exact coordinates (25.3176°N, 82.9739°E)');

// 7. Prefix match > substring match: "Pat"
console.log('7. Checking prefix match > substring match on query "Pat"...');
const patResults = searchCities('Pat');
const patNames = patResults.map(c => c.name);
const pIdx = patNames.indexOf('Patna');
const mIdx = patNames.indexOf('Machilipatnam');
assert.ok(pIdx >= 0, 'Patna must be present in results');
if (mIdx !== -1) {
  assert.ok(pIdx < mIdx, 'Prefix match Patna must rank before substring match Machilipatnam');
}
console.log(`   ✓ Prefix match "Patna" ranks before substring match "Machilipatnam"`);

// 8. Determinism
console.log('8. Checking determinism of partial queries...');
const run1 = searchCities('ban').map(c => c.id);
const run2 = searchCities('ban').map(c => c.id);
const run3 = searchCities('ban').map(c => c.id);
assert.deepStrictEqual(run1, run2);
assert.deepStrictEqual(run2, run3);
assert.ok(run1.length > 0);
console.log(`   ✓ Partial query "ban" returned identical results across 3 consecutive runs (${run1.length} matches)`);

// 9. Normalization
console.log('9. Checking case and whitespace normalization...');
const r1 = searchCities('Patna').map(c => c.id);
const r2 = searchCities('patna').map(c => c.id);
const r3 = searchCities('   PATNA   ').map(c => c.id);
assert.deepStrictEqual(r1, r2);
assert.deepStrictEqual(r2, r3);
console.log('   ✓ Casing and leading/trailing whitespace produce identical ranking');

// 10. Empty & whitespace safety
console.log('10. Checking empty and whitespace queries...');
const empty = searchCities('');
const whitespace = searchCities('    ');
assert.strictEqual(empty.length, 30);
assert.strictEqual(whitespace.length, 30);
assert.deepStrictEqual(empty.map(c => c.id), whitespace.map(c => c.id));
console.log('   ✓ Empty and whitespace queries safely return top 30 slice');

// 11. findCityById lookup
console.log('11. Checking findCityById...');
const patnaCity = findCityById('patna');
assert.strictEqual(patnaCity.name, 'Patna');
const fallbackCity = findCityById('non-existent-city-xyz');
assert.deepStrictEqual(fallbackCity, DEFAULT_CITY);
console.log('   ✓ findCityById resolves exact ID and falls back to DEFAULT_CITY');

console.log('\n=== ALL 11 CANONICAL CITY RESOLVER NODE TESTS PASSED ===\n');
