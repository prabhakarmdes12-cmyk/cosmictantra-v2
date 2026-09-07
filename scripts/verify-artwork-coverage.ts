/**
 * Festival artwork coverage verifier — runs the REAL engine + resolver.
 *
 * Simulates a full calendar year with `calculateMonthPanchang` (the same
 * function that feeds /calendar) and asserts that EVERY day, EVERY
 * engine-emitted festival and EVERY tithi×paksha combination resolves to an
 * artwork WebP that actually exists under `public/assets/calendar/events/`.
 *
 * Run: npx tsx scripts/verify-artwork-coverage.ts
 *
 * Exit code 0 = 100% coverage, 0 missing files. Prints day/festival/tithi
 * totals; the exact numbers depend on this engine's emitted festival set.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { calculateMonthPanchang } from '../src/engines/monthlyPanchangEngine';
import {
  resolveDayArtwork,
  resolveTithiArtKey,
  FESTIVAL_TOKENS,
  ALL_ARTWORK_KEYS,
} from '../src/lib/calendar/festivalArtwork';

const ROOT = path.resolve(__dirname, '..');
const ASSET_DIR = path.join(ROOT, 'public', 'assets', 'calendar', 'events');

// Tithi English name → tithi index 0..29 in the engine's numbering.
const TITHI_INDEX_BY_NAME: Record<string, number | undefined> = (() => {
  const names = [
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
  ];
  const map: Record<string, number | undefined> = {};
  names.forEach((n, i) => { map[n] = i; });
  return map;
})();

function exists(key: string): boolean {
  return fs.existsSync(path.join(ASSET_DIR, `${key}.webp`));
}

let failures = 0;
function fail(msg: string) {
  failures++;
  console.error(`  ✗ ${msg}`);
}

console.log(`Asset dir: ${ASSET_DIR}`);
console.log(`Referenced artwork keys: ${ALL_ARTWORK_KEYS.size}`);

// 1. All referenced keys exist on disk.
for (const key of ALL_ARTWORK_KEYS) {
  if (!exists(key)) fail(`missing asset file: ${key}.webp`);
}
if (failures === 0) console.log(`✅ all ${ALL_ARTWORK_KEYS.size} referenced assets exist`);

// 2. Full-year day sweep: every day must resolve; festival art preferred.
const YEAR = 2026;
const CITY = { lat: 25.3176, lng: 82.9739, tz: 5.5, name: 'Varanasi' };

let totalDays = 0;
let festivalArtDays = 0;
let tithiArtDays = 0;
let categoryArtDays = 0;
let unresolvedDays = 0;

const emittedFestivals = new Map<string, number>(); // name -> occurrences

for (let m = 0; m < 12; m++) {
  const month = calculateMonthPanchang(YEAR, m, CITY.lat, CITY.lng, CITY.tz);
  for (const day of month.days) {
    totalDays++;
    for (const f of day.festivals) {
      emittedFestivals.set(f.name, (emittedFestivals.get(f.name) || 0) + 1);
    }
    const art = resolveDayArtwork(day as any);
    if (!art) {
      unresolvedDays++;
      fail(`no artwork for ${day.dateString} (${day.tithi.name} ${day.tithi.paksha})`);
      continue;
    }
    if (art.kind === 'festival') festivalArtDays++;
    else if (art.kind === 'category') categoryArtDays++;
    else tithiArtDays++;
  }
}

console.log(`\nDays swept (${YEAR}): ${totalDays}`);
console.log(`  festival-art days : ${festivalArtDays}`);
console.log(`  category-art days : ${categoryArtDays}`);
console.log(`  tithi-art days    : ${tithiArtDays}`);
console.log(`  unresolved days   : ${unresolvedDays}`);

// 3. Every festival occurrence resolves to a festival/category artwork.
console.log(`\nEmitted festival occurrences: ${[...emittedFestivals.values()].reduce((a, b) => a + b, 0)}`);
let missingFestivalTokens = 0;
for (const [name, count] of emittedFestivals) {
  if (!FESTIVAL_TOKENS[name]) {
    missingFestivalTokens++;
    fail(`engine-emitted festival has NO token: "${name}" (${count}×) — add to FESTIVAL_TOKENS`);
  }
}
if (missingFestivalTokens === 0) {
  console.log(`✅ all ${emittedFestivals.size} distinct engine-emitted festivals have tokens (0 orphaned festivals)`);
}

// 4. Distinct tithi×paksha combos present in the year resolve (should reach 30).
const comboSet = new Set<string>();
for (let m = 0; m < 12; m++) {
  const month = calculateMonthPanchang(YEAR, m, CITY.lat, CITY.lng, CITY.tz);
  for (const day of month.days) {
    comboSet.add(`${day.tithi.paksha}|${day.tithi.name}`);
  }
}
console.log(`\nDistinct tithi×paksha combos present in ${YEAR}: ${comboSet.size}`);
let comboFails = 0;
for (const combo of comboSet) {
  const [paksha, name] = combo.split('|');
  const tithiIdx = TITHI_INDEX_BY_NAME[name as string];
  const resolved = resolveTithiArtKey({
    index: tithiIdx !== undefined ? tithiIdx + (paksha === 'Krishna Paksha' && tithiIdx !== 14 ? 15 : 0) + 1 : undefined,
    name,
  });
  if (!resolved || !exists(resolved)) {
    comboFails++;
    fail(`tithi combo "${combo}" did not resolve to an existing file`);
  }
}
if (comboFails === 0) console.log(`✅ all ${comboSet.size} tithi combos resolve to existing artwork`);

// 5. Orphan-artwork detection: tokens never emitted in the sweep.
const orphanTokens = Object.keys(FESTIVAL_TOKENS).filter((k) => !emittedFestivals.has(k));
if (orphanTokens.length) {
  console.error(`\n⚠ tokens with no engine emission this year (may be valid for other years):`);
  for (const k of orphanTokens) console.error(`   - ${k}`);
} else {
  console.log(`\n✅ no orphaned festival tokens`);
}

// 6. Missing festival-day files overall.
if (failures > 0) {
  console.error(`\n❌ COVERAGE INCOMPLETE: ${failures} failure(s).`);
  process.exit(1);
}
console.log('\n✅ 100% coverage — 0 missing files.');
console.log(`   ${totalDays}/${totalDays} days, ${emittedFestivals.size}/${emittedFestivals.size} festival types, ${comboSet.size}/${comboSet.size} tithi combos.`);
process.exit(0);
