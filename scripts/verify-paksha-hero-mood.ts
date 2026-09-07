/**
 * Standalone verification of the calendar Paksha hero-mood resolution
 * (no browser / server required).
 *
 * Regression guard for the arena calendar integration: the hero banner mood
 * (Krishna-Indigo vs Shukla-Marigold) and the "शुभ रात्रि/दिवस 🙏" seal must
 * be resolved from the engine's `tithi.paksha`/`fullName`, never from the bare
 * `tithi.name` ("Dwadashi" contains no paksha marker).
 *
 * Run: npx tsx scripts/verify-paksha-hero-mood.ts
 */
import assert from 'node:assert/strict';
import { calculatePanchang } from '../src/lib/panchang.js';
import { resolvePakshaMood, resolveTithiDisplayName } from '../src/lib/panchang/pakshaTheme';

const VARANASI = { lat: 25.3176, lng: 82.9739, tz: 5.5, name: 'Varanasi' };
const DHANBAD = { lat: 23.7957, lng: 86.4304, tz: 5.5, name: 'Dhanbad' };

let checks = 0;
function check(cond: boolean, label: string) {
  assert.ok(cond, `FAIL: ${label}`);
  checks++;
}

// 1. Exact regression: 2026-08-30 Dhanbad is Krishna Paksha (existing engine fixture).
const krishnaP = calculatePanchang(new Date('2026-08-30T04:05:20+05:30'), DHANBAD);
assert.equal(krishnaP.tithi.paksha, 'Krishna Paksha');
check(resolvePakshaMood(krishnaP.tithi).isKrishna, 'engine Krishna tithi resolves Krishna');
check(!resolvePakshaMood(krishnaP.tithi).isShukla, 'engine Krishna tithi is not Shukla');
check(
  resolvePakshaMood({ name: krishnaP.tithi.name, paksha: 'Krishna Paksha' }).isKrishna,
  'bare name + paksha object resolves Krishna (regression)'
);
check(
  resolveTithiDisplayName(krishnaP.tithi) === `Krishna Paksha ${krishnaP.tithi.name}`,
  'display name prefers qualified fullName'
);

// 2. Shukla day.
const shuklaP = calculatePanchang(new Date('2026-09-12T10:00:00+05:30'), VARANASI);
assert.equal(shuklaP.tithi.paksha, 'Shukla Paksha');
check(resolvePakshaMood(shuklaP.tithi).isShukla, 'engine Shukla tithi resolves Shukla');
check(!resolvePakshaMood(shuklaP.tithi).isKrishna, 'engine Shukla tithi is not Krishna');

// 3. 60-day engine invariant.
for (let i = 0; i < 60; i++) {
  const d = new Date('2026-08-01T09:30:00+05:30');
  d.setDate(d.getDate() + i);
  const p = calculatePanchang(d, VARANASI);
  const mood = resolvePakshaMood(p.tithi);
  check(
    mood.isKrishna === (p.tithi.paksha === 'Krishna Paksha') &&
      mood.isShukla === (p.tithi.paksha === 'Shukla Paksha'),
    `mood matches engine paksha on ${d.toISOString()}`
  );
}

// 4. Devanagari / plain-string / unknown inputs.
check(resolvePakshaMood({ fullName: 'कृष्ण पक्ष द्वादशी' }).isKrishna, 'Devanagari Krishna fullName');
check(resolvePakshaMood({ fullName: 'शुक्ल पक्ष प्रतिपदा' }).isShukla, 'Devanagari Shukla fullName');
check(resolvePakshaMood('Krishna Paksha Dwadashi').isKrishna, 'plain string Krishna');
check(resolvePakshaMood('Shukla Paksha Pratipada').isShukla, 'plain string Shukla');
check(!resolvePakshaMood({ name: 'Dwadashi' }).isKrishna && !resolvePakshaMood({ name: 'Dwadashi' }).isShukla, 'unknown input fabricates nothing');

console.log(`\n✅ paksha hero-mood verification passed (${checks} checks).`);
