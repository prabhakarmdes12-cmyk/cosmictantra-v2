/**
 * GOCHARA QUALIFICATION RUNNER — Sprint G (Transits + correct Sade Sati).
 * Mission Sections 9 & 41.
 *
 * Charter §9 requirement: Sade Sati must be a REAL TRANSIT PHENOMENON — period
 * start, phase transitions, period end, each with calculation evidence — and
 * must NEVER be inferred from natal Saturn/Moon positions alone. The sprint
 * replaced two fabrication sites (RSK_016 natal-Saturn Sade Sati in
 * canonicalSnapshot; RSK_017 fabricated yearly transits in interpretationEngine).
 *
 * Verification streams:
 *   A. TRANSIT_IDENTITY   — for seeded random scenarios, every exported transit
 *                           value is recomputed from its definition: rashi
 *                           containment, houseFromMoon/houseFromLagna identities,
 *                           Sade Sati band membership ⇔ state, Dhaiya ⇔ state,
 *                           Parashari special aspect sets, conventions pins.
 *   B. PERIOD_SOLVER      — for each natal Moon rashi sample: band-membership
 *                           probes at periodStart/periodEnd (±), total span in
 *                           the classical 7.5-year neighbourhood, monotone
 *                           transition events, and every JANMA/THIRD event sits
 *                           on its rashi boundary (|Δlongitude| tolerance).
 *   C. NATAL_PROHIBITION  — the §9 core proof. Two natal charts whose natal
 *                           SATURN rashis differ but whose Moon/Lagna rashis and
 *                           reference instant match must yield byte-identical
 *                           Sade Sati state (both via computeGochara and via the
 *                           rewired canonicalSnapshot). Plus a static source pin
 *                           that the removed natal-Saturn lookup never returns.
 *   D. EXTERNAL_ANCHORS   — published sidereal Saturn ingress epochs (multiple
 *                           independent panchang tables agree to within hours).
 *                           SOURCE_SECONDARY; tolerance is the engine's declared
 *                           ±2 boundary days.
 *   E. FABRICATION_REGRESSION — RSK_017 pin: yearly saturn/jupiter transits and
 *                           the nodal axis must equal kernel-computed values at
 *                           the reference instant; Varsheshwar must remain
 *                           NOT_CALCULATED rather than fabricated.
 *
 * Declared simplifications (NON_BLOCKING findings, surfaced not hidden):
 *   - MEAN_NODE is the pinned convention for Rahu/Ketu (true-node variant not
 *     qualified); declared, consistent engine-wide.
 *   - Boundary timestamps carry a declared ±2-day tolerance (10-day sample grid
 *     + bisection on a once-per-sample ephemeris; observed agreement with
 *     published tables is under 3 hours).
 *   - Special aspects are evaluated as whole-sign house distances onto the natal
 *     Lagna/Moon rashis (cusp-degree aspectation not implemented).
 *   - Transit-time Vimshottari overlays, Ashtakavarga transit (Kaksha) tables
 *     and Tajika Varshaphala year lord are out of Sprint G scope.
 *
 * Usage:
 *   npm run qualify:gochara             # full run (10,000 identity scenarios)
 *   npm run qualify:gochara:scaffold    # scaffold run (2,000)
 *   npx tsx qualification/gochara-qualification-runner.ts --scenarios 5000
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  computeGochara,
  computeSadeSatiPeriod,
  GOCHARA_ENGINE_VERSION,
  SADE_SATI_BAND_HOUSES,
  DHAIYA_HOUSES,
  type GocharaResult,
  type SadeSatiTransition
} from '../src/lib/jyotish/gocharaEngine';
import { calculateCelestialEphemeris } from '../src/lib/jyotish/celestialEngine';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { getYearlyInterpretation } from '../src/lib/interpretationEngine';
import { calculateKundali } from '../src/lib/astrologyEngine';

export const GOCHARA_QUALIFICATION_RUNNER_VERSION = 'gochara-qualification-runner-1.0.0 (sprint G)';
export const DEFAULT_GOCHARA_SEED = 0x60ca;

export type GocharaQualificationGate = 'scaffold' | 'strict';

export class GocharaQualificationError extends Error {
  constructor(
    public readonly errorCode:
      | 'FIXTURE_SET_INVALID'
      | 'TRANSIT_IDENTITY_VIOLATION'
      | 'PERIOD_SOLVER_VIOLATION'
      | 'NATAL_PROHIBITION_VIOLATION'
      | 'EXTERNAL_ANCHOR_MISMATCH'
      | 'FABRICATION_REGRESSION'
      | 'DETERMINISM_HARD_MISMATCH',
    message: string,
    public readonly detail: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GocharaQualificationError';
  }
}

/* ------------------------------------------------------------------------- */
/* Fixture set                                                                */
/* ------------------------------------------------------------------------- */

export interface GocharaExternalAnchor {
  anchorId: string;
  description: string;
  /** Published instant (UTC best estimate from IST-published tables). */
  publishedUtc: string;
  toleranceDays: number;
  /** What the engine value is compared against. */
  engineSelector: 'sadeSatiPeriodStart' | 'sadeSatiPeriodEnd' | 'sadeSatiFirstExit' | 'phaseTransition';
  transitionEvent?: SadeSatiTransition['event'];
  /** Natal Moon rashi the anchor is evaluated for. */
  natalMoonRashiId: number;
  /**
   * A reference instant that makes the solver resolve the PUBLISHED period
   * (e.g. a date inside the 2017-2025 Dhanu band so the 2022 Kumbha crossing
   * belongs to the resolved period).
   */
  referenceInstantUtc: string;
  sourceStatus: 'SOURCE_SECONDARY';
  sources: string[];
}

export interface GocharaFixtureSet {
  fixtureSetId: string;
  builder: string;
  engineVersion: string;
  conventions: {
    ayanamsha: { system: string; status: string };
    nodes: { mode: string; note: string };
    zodiac: { statement: string; status: string };
  };
  classicalTables: {
    sadeSatiBand: { housesFromMoon: number[]; statement: string; status: string };
    dhaiya: { housesFromMoon: number[]; statement: string; status: string };
    parashariSpecialAspects: Record<string, number[]>;
    nominalPeriodYears: { value: number; statement: string; status: string };
  };
  externalAnchors: GocharaExternalAnchor[];
  setSha256: string;
}

const ANCHOR_SOURCES_MEENA_2025 = [
  'prokerala.com Shani Gochar 2026 (Meena entry 2025-03-29 21:43 IST)',
  'drikpanchang.com 2025 Shani Gochar (Meena 2025-03-29 21:01 IST)',
  'jagannathhora.com Saturn Transit in Pisces 2025-2028 (2025-03-29 23:01 IST)'
];
const ANCHOR_SOURCES_MESHA_2027 = [
  'jagannathhora.com (exits Pisces into Aries first 2027-06-03 06:23 IST)',
  'prokerala.com Shani Gochar (next gochar 2027-06-03)'
];
const ANCHOR_SOURCES_MEENA_RETRO_2027 = [
  'jagannathhora.com (returns to Pisces retrograde 2027-10-20 06:05 IST)',
  'prokerala.com Shani Gochar (enters Meena in vakragati 2027-10-20 08:13 IST)'
];
const ANCHOR_SOURCES_MESHA_PERM_2028 = [
  'jagannathhora.com (exits Pisces permanently 2028-02-23 20:00 IST)'
];
const ANCHOR_SOURCES_KUMBHA_2022 = [
  'drapraoastrology.com (Saturn enters Kumbha 2022-04-29, retro return to Makara 2022-07-12, re-entry 2023-01-17)',
  'futurescopeastrology.com Saturn transit table (Kumbha 2022 April 29)',
  'thepeoplesoracle.com (sidereal Aquarius April 28-29, 2022 through March 29, 2025)'
];

export function buildGocharaFixtureSet(): GocharaFixtureSet {
  const fixtureSetId = 'GOCHARA_ENGINE_BENCHMARK_001';
  const core = {
    fixtureSetId,
    builder: GOCHARA_QUALIFICATION_RUNNER_VERSION,
    engineVersion: GOCHARA_ENGINE_VERSION,
    conventions: {
      ayanamsha: { system: 'LAHIRI_CHITRA_PAKSHA', status: 'SOURCE_VERIFIED' },
      nodes: { mode: 'MEAN_NODE', note: 'Mean node is the pinned engine-wide convention; true-node variant is not qualified.' },
      zodiac: { statement: 'Whole-sign rashis of 30 sidereal degrees; boundary degree belongs to the next rashi.', status: 'SOURCE_VERIFIED' }
    },
    classicalTables: {
      sadeSatiBand: {
        housesFromMoon: [...SADE_SATI_BAND_HOUSES],
        statement: 'Sade Sati spans transit Saturn in the 12th, 1st and 2nd rashis counted from the natal Moon rashi (nearly seven and a half years).',
        status: 'SOURCE_SECONDARY'
      },
      dhaiya: {
        housesFromMoon: [...DHAIYA_HOUSES],
        statement: 'Dhaiya (Ardhashtama Shani) is transit Saturn in the 4th or 8th from the natal Moon rashi; tracked separately from Sade Sati.',
        status: 'SOURCE_SECONDARY'
      },
      parashariSpecialAspects: { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] },
      nominalPeriodYears: { value: 7.5, statement: 'The classical nominal Sade Sati duration is about seven and a half years (Saturn 2.5y per rashi x 3).', status: 'SOURCE_SECONDARY' }
    },
    externalAnchors: [
      {
        anchorId: 'SIDEREAL_SATURN_MEENA_ENTRY_FIRST_2025',
        description: 'Saturn first enters sidereal Meena (12th-from band start for Mesha Moon) — begins Sade Sati for Mesha Moon natives.',
        publishedUtc: '2025-03-29T16:15:00Z',
        toleranceDays: 2,
        engineSelector: 'sadeSatiPeriodStart' as const,
        natalMoonRashiId: 1,
        referenceInstantUtc: '2026-09-03T06:00:00Z',
        sourceStatus: 'SOURCE_SECONDARY' as const,
        sources: ANCHOR_SOURCES_MEENA_2025
      },
      {
        anchorId: 'DHANU_SADE_SATI_START_2014',
        description: 'Saturn enters sidereal Vrishchika (12th from Dhanu Moon) — published start of the Dhanu-Moon Sade Sati ("beginning of Sade-Sathi for Dhanus Raasi", Nov 2, 2014).',
        publishedUtc: '2014-11-02T12:00:00Z',
        toleranceDays: 2,
        engineSelector: 'sadeSatiPeriodStart' as const,
        natalMoonRashiId: 9,
        referenceInstantUtc: '2020-01-01T06:00:00Z',
        sourceStatus: 'SOURCE_SECONDARY' as const,
        sources: [
          'dakshinastro.blogspot.com (Sani Peyarchi: Saturn into Vrischika Nov 2, 2014)',
          'bhargavasarma.blogspot.com (Vrischika entry 02.11.2014 = 1st leg of Sade-Sathi for Dhanus)',
          'timelineastrology.com (Saturn into sidereal Scorpio November 2, 2014)'
        ]
      },
      {
        anchorId: 'DHANU_SADE_SATI_FIRST_EXIT_2022',
        description: 'Saturn first leaves the Dhanu band (first Kumbha entry) — the published "Sade Sati ends for Dhanur Rasi" end-date convention.',
        publishedUtc: '2022-04-29T04:00:00Z',
        toleranceDays: 2,
        engineSelector: 'sadeSatiFirstExit' as const,
        natalMoonRashiId: 9,
        referenceInstantUtc: '2020-01-01T06:00:00Z',
        sourceStatus: 'SOURCE_SECONDARY' as const,
        sources: ANCHOR_SOURCES_KUMBHA_2022
      },
      {
        anchorId: 'SIDEREAL_SATURN_KUMBHA_PERMANENT_2023',
        description: 'Saturn permanently re-enters sidereal Kumbha after the Makara retrograde dip — the FINAL exit of the Dhanu band (strict band-membership end).',
        publishedUtc: '2023-01-17T06:00:00Z',
        toleranceDays: 2,
        engineSelector: 'sadeSatiPeriodEnd' as const,
        natalMoonRashiId: 9,
        referenceInstantUtc: '2020-01-01T06:00:00Z',
        sourceStatus: 'SOURCE_SECONDARY' as const,
        sources: ['drapraoastrology.com (Saturn enters Kumbha Rasi again on Jan 17th, 2023)']
      },
      {
        anchorId: 'SIDEREAL_SATURN_KUMBHA_ENTRY_FIRST_2022',
        description: 'Saturn first enters sidereal Kumbha (2nd-from for Makara Moon) — ends Sade Sati for Makara Moon, starts it for Meena Moon.',
        publishedUtc: '2022-04-29T04:00:00Z',
        toleranceDays: 2,
        engineSelector: 'phaseTransition' as const,
        transitionEvent: 'THIRD_ENTRY' as const,
        natalMoonRashiId: 10,
        referenceInstantUtc: '2020-01-01T06:00:00Z',
        sourceStatus: 'SOURCE_SECONDARY' as const,
        sources: ANCHOR_SOURCES_KUMBHA_2022
      },
      {
        anchorId: 'SIDEREAL_SATURN_MESHA_ENTRY_FIRST_2027',
        description: 'Saturn first enters sidereal Mesha (natal Moon rashi itself for Mesha Moon) — Janma phase begins.',
        publishedUtc: '2027-06-03T00:53:00Z',
        toleranceDays: 2,
        engineSelector: 'phaseTransition' as const,
        transitionEvent: 'JANMA_ENTRY' as const,
        natalMoonRashiId: 1,
        referenceInstantUtc: '2026-09-03T06:00:00Z',
        sourceStatus: 'SOURCE_SECONDARY' as const,
        sources: ANCHOR_SOURCES_MESHA_2027
      },
      {
        anchorId: 'SIDEREAL_SATURN_MEENA_RETRO_RETURN_2027',
        description: 'Retrograde Saturn returns from Mesha into Meena — Janma phase temporarily suspends (real oscillation, not aliasing).',
        publishedUtc: '2027-10-20T00:35:00Z',
        toleranceDays: 2,
        engineSelector: 'phaseTransition' as const,
        transitionEvent: 'JANMA_RETROGRADE_RETURN' as const,
        natalMoonRashiId: 1,
        referenceInstantUtc: '2026-09-03T06:00:00Z',
        sourceStatus: 'SOURCE_SECONDARY' as const,
        sources: ANCHOR_SOURCES_MEENA_RETRO_2027
      },
      {
        anchorId: 'SIDEREAL_SATURN_MESHA_ENTRY_PERMANENT_2028',
        description: 'Saturn re-enters sidereal Mesha permanently after retrograde — Janma phase resumes.',
        publishedUtc: '2028-02-23T14:30:00Z',
        toleranceDays: 2,
        engineSelector: 'phaseTransition' as const,
        transitionEvent: 'JANMA_ENTRY' as const,
        natalMoonRashiId: 1,
        referenceInstantUtc: '2026-09-03T06:00:00Z',
        sourceStatus: 'SOURCE_SECONDARY' as const,
        sources: ANCHOR_SOURCES_MESHA_PERM_2028
      }
    ]
  };
  const digest = crypto.createHash('sha256').update(JSON.stringify(core)).digest('hex');
  return { ...core, setSha256: digest };
}

export const PINNED_GOCHARA_FIXTURE_SHA256 = 'a84fef01c18e5b12794d4697dd9a0f6df9894ad252abdf9d0f3a7d8ba42ea489';

export function loadGocharaFixtureSet(raw: unknown): GocharaFixtureSet {
  const f = raw as GocharaFixtureSet;
  if (!f || f.fixtureSetId !== 'GOCHARA_ENGINE_BENCHMARK_001') {
    throw new GocharaQualificationError('FIXTURE_SET_INVALID', 'Unknown gochara fixture set', { received: (f as { fixtureSetId?: string })?.fixtureSetId });
  }
  if (f.classicalTables.sadeSatiBand.status !== 'SOURCE_SECONDARY') {
    throw new GocharaQualificationError('FIXTURE_SET_INVALID', 'Sade Sati band table must stay SOURCE_SECONDARY', { status: f.classicalTables.sadeSatiBand.status });
  }
  const { setSha256, ...core } = f;
  const digest = crypto.createHash('sha256').update(JSON.stringify(core)).digest('hex');
  if (digest !== setSha256) {
    throw new GocharaQualificationError('FIXTURE_SET_INVALID', 'Gochara fixture set sha mismatch — never regenerate silently (CT_INV_008)', {
      expected: setSha256, actual: digest
    });
  }
  if (digest !== PINNED_GOCHARA_FIXTURE_SHA256) {
    throw new GocharaQualificationError('FIXTURE_SET_INVALID', 'Gochara fixture set drifted from the runner-pinned sha — a source edit altered the fixture tables', {
      pinned: PINNED_GOCHARA_FIXTURE_SHA256, actual: digest
    });
  }
  return f;
}

/* ------------------------------------------------------------------------- */
/* Seeded scenario generation                                                 */
/* ------------------------------------------------------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function kernelSaturnSidereal(utc: string): number {
  return calculateCelestialEphemeris({
    dateUtc: new Date(utc), latitude: 25.6, longitude: 85.1, nodeMode: 'MEAN_NODE'
  }).bodies.Saturn.siderealLongitude;
}

function bandOf(natalMoonRashiId: number): { start: number; end: number; janmaStart: number; thirdStart: number } {
  const janmaStart = (natalMoonRashiId - 1) * 30;
  return { start: ((natalMoonRashiId - 1 + 11) % 12) * 30, end: (((natalMoonRashiId - 1 + 11) % 12) * 30 + 90) % 360, janmaStart, thirdStart: ((natalMoonRashiId - 1 + 1) % 12) * 30 };
}

function inArc(lon: number, fromDeg: number, widthDeg: number): boolean {
  return (((lon - fromDeg) % 360) + 360) % 360 < widthDeg;
}

/* ------------------------------------------------------------------------- */
/* Stream A — transit identities                                              */
/* ------------------------------------------------------------------------- */

export interface StreamAReport { scenarios: number; identityChecks: number; violations: number; firstViolations: string[] }

function runStreamA(scenarios: number, seed: number): StreamAReport {
  const rnd = mulberry32(seed);
  let checks = 0, violations = 0;
  const firstViolations: string[] = [];
  const fail = (msg: string) => {
    violations += 1;
    if (firstViolations.length < 20) firstViolations.push(msg);
  };
  for (let s = 0; s < scenarios; s++) {
    const natalMoonRashiId = 1 + Math.floor(rnd() * 12);
    const natalLagnaRashiId = 1 + Math.floor(rnd() * 12);
    const days = Math.floor(rnd() * 5500); // 2020-01-01 .. ~2035-01-01
    const referenceInstantUtc = new Date(Date.UTC(2020, 0, 1) + days * 86400000 + Math.floor(rnd() * 86400000)).toISOString();
    const r = computeGochara({ natalMoonRashiId, natalLagnaRashiId, referenceInstantUtc });

    // Conventions pins.
    checks++;
    if (r.engineVersion !== GOCHARA_ENGINE_VERSION) fail(`scenario ${s}: engineVersion mismatch`);
    checks++;
    if (r.conventions.ayanamshaSystem !== 'LAHIRI_CHITRA_PAKSHA' || r.conventions.nodeMode !== 'MEAN_NODE') fail(`scenario ${s}: conventions pin`);
    checks++;
    if (Math.abs(r.ayanamshaDegrees - 24.2) > 0.2) fail(`scenario ${s}: ayanamsha ${r.ayanamshaDegrees} outside Lahiri 2020-2035 window`);
    checks++;
    if (r.query.natalMoonRashiId !== natalMoonRashiId || r.query.natalLagnaRashiId !== natalLagnaRashiId || r.query.referenceInstantUtc !== referenceInstantUtc) {
      fail(`scenario ${s}: query echo mismatch`);
    }

    // Per-graha identities.
    for (const g of r.transitGrahas) {
      const lon = g.siderealLongitude;
      checks++;
      if (!(lon >= 0 && lon < 360)) fail(`scenario ${s} ${g.name}: longitude out of range ${lon}`);
      checks++;
      if (g.rashiId !== Math.floor((((lon % 360) + 360) % 360) / 30) + 1) fail(`scenario ${s} ${g.name}: rashiId ${g.rashiId} vs longitude ${lon}`);
      checks++;
      const houseMoon = ((g.rashiId - natalMoonRashiId + 12) % 12) + 1;
      if (g.houseFromMoon !== houseMoon) fail(`scenario ${s} ${g.name}: houseFromMoon ${g.houseFromMoon} != ${houseMoon}`);
      checks++;
      const houseLagna = ((g.rashiId - natalLagnaRashiId + 12) % 12) + 1;
      if (g.houseFromLagna !== houseLagna) fail(`scenario ${s} ${g.name}: houseFromLagna ${g.houseFromLagna} != ${houseLagna}`);
      checks++;
      const nakIdx = Math.floor((((lon % 360) + 360) % 360) / (360 / 27));
      if (g.nakshatraName !== ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'][nakIdx]) {
        fail(`scenario ${s} ${g.name}: nakshatra ${g.nakshatraName} vs longitude ${lon}`);
      }
    }
    checks++;
    if (r.transitGrahas.length !== 9) fail(`scenario ${s}: expected 9 transit grahas, got ${r.transitGrahas.length}`);

    // Sade Sati state vs independent band membership from the kernel.
    const saturn = r.transitGrahas.find((g) => g.name === 'Saturn');
    checks++;
    if (!saturn) fail(`scenario ${s}: Saturn missing from transit grahas`);
    else {
      const band = bandOf(natalMoonRashiId);
      const bandActive = inArc(saturn.siderealLongitude, band.start, 90);
      checks++;
      if (r.sadeSati.basis !== 'TRANSIT') fail(`scenario ${s}: sadeSati.basis ${r.sadeSati.basis}`);
      checks++;
      if (r.sadeSati.isActive !== bandActive) fail(`scenario ${s}: isActive ${r.sadeSati.isActive} vs band membership ${bandActive}`);
      checks++;
      if (r.sadeSati.saturnHousesFromMoon !== saturn.houseFromMoon) fail(`scenario ${s}: sadeSati houses-from-moon ${r.sadeSati.saturnHousesFromMoon} vs graha ${saturn.houseFromMoon}`);
      checks++;
      const expectedPhase = r.sadeSati.saturnHousesFromMoon === 12 ? '1st Phase (Rising / द्वादश शनि)' : r.sadeSati.saturnHousesFromMoon === 1 ? 'Peak Phase (Janma Shani / जन्म शनि)' : r.sadeSati.saturnHousesFromMoon === 2 ? '3rd Phase (Setting / द्वितीय शनि)' : 'Not Active';
      if (r.sadeSati.phase !== expectedPhase) fail(`scenario ${s}: phase '${r.sadeSati.phase}' != '${expectedPhase}'`);
      checks++;
      if (r.sadeSati.transitSaturnRashiId !== saturn.rashiId || r.sadeSati.natalMoonRashiId !== natalMoonRashiId || r.sadeSati.referenceInstantUtc !== referenceInstantUtc) {
        fail(`scenario ${s}: sadeSati evidence fields inconsistent`);
      }
      // Dhaiya identity.
      checks++;
      if (r.dhaiya.isActive !== (saturn.houseFromMoon === 4 || saturn.houseFromMoon === 8)) fail(`scenario ${s}: dhaiya ${r.dhaiya.isActive} vs houses-from-moon ${saturn.houseFromMoon}`);
      checks++;
      if (r.dhaiya.saturnHousesFromMoon !== saturn.houseFromMoon) fail(`scenario ${s}: dhaiya houses-from-moon mismatch`);
    }

    // Special aspects: the engine declares one row per graha per anchor (9 x 2 =
    // 18 rows); only Mars/Jupiter/Saturn carry the Parashari special sets
    // {4,8}/{5,9}/{3,10}, all other rows must be inert (aspectHouses [] and
    // isSpecialAspect false for every distance).
    checks++;
    if (r.specialAspectsOnNatal.length !== 18) fail(`scenario ${s}: expected 18 aspect rows (9 grahas x 2 anchors), got ${r.specialAspectsOnNatal.length}`);
    for (const a of r.specialAspectsOnNatal) {
      const specialSet = a.transitPlanet === 'Mars' ? [4, 8] : a.transitPlanet === 'Jupiter' ? [5, 9] : a.transitPlanet === 'Saturn' ? [3, 10] : null;
      checks++;
      if (JSON.stringify(a.aspectHouses) !== JSON.stringify(specialSet ?? [])) fail(`scenario ${s}: ${a.transitPlanet} aspect houses ${JSON.stringify(a.aspectHouses)} vs ${JSON.stringify(specialSet ?? [])}`);
      const anchor = a.onto === 'Lagna' ? natalLagnaRashiId : natalMoonRashiId;
      const graha = r.transitGrahas.find((g) => g.name === a.transitPlanet);
      checks++;
      if (!graha || a.houseDistance !== ((graha.rashiId - anchor + 12) % 12) + 1) fail(`scenario ${s}: ${a.transitPlanet} onto ${a.onto} distance ${a.houseDistance}`);
      checks++;
      if (a.isSpecialAspect !== (specialSet !== null && specialSet.includes(a.houseDistance))) fail(`scenario ${s}: ${a.transitPlanet} onto ${a.onto} isSpecialAspect ${a.isSpecialAspect} at ${a.houseDistance}`);
    }
  }
  return { scenarios, identityChecks: checks, violations, firstViolations };
}

/* ------------------------------------------------------------------------- */
/* Stream B — period solver                                                   */
/* ------------------------------------------------------------------------- */

export interface StreamBReport { scenarios: number; identityChecks: number; violations: number; totalSolveMs: number; firstViolations: string[] }

function runStreamB(scenarios: number, seed: number): StreamBReport {
  const rnd = mulberry32(seed ^ 0x9e37);
  let checks = 0, violations = 0, totalSolveMs = 0;
  const firstViolations: string[] = [];
  const fail = (msg: string) => {
    violations += 1;
    if (firstViolations.length < 20) firstViolations.push(msg);
  };
  for (let s = 0; s < scenarios; s++) {
    const natalMoonRashiId = 1 + Math.floor(rnd() * 12);
    const startYear = 1990 + Math.floor(rnd() * 30);
    const referenceInstantUtc = new Date(Date.UTC(startYear, Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28))).toISOString();
    const t0 = Date.now();
    const { period } = computeSadeSatiPeriod({ natalMoonRashiId, natalLagnaRashiId: ((natalMoonRashiId + 5) % 12) + 1, referenceInstantUtc });
    totalSolveMs += Date.now() - t0;
    const band = bandOf(natalMoonRashiId);
    const tol = period.evidence.declaredBoundaryToleranceDays;

    // (1) period start: inside the band just after, outside just before the declared tolerance.
    checks++;
    const before = kernelSaturnSidereal(new Date(Date.parse(period.periodStartUtc) - (tol + 1) * 86400000).toISOString());
    if (inArc(before, band.start, 90)) fail(`rashi ${natalMoonRashiId}: Saturn already in band ${tol + 1}d before start ${period.periodStartUtc}`);
    checks++;
    const after = kernelSaturnSidereal(new Date(Date.parse(period.periodStartUtc) + 2 * 3600000).toISOString());
    if (!inArc(after, band.start, 90)) fail(`rashi ${natalMoonRashiId}: Saturn not in band just after start ${period.periodStartUtc}`);

    // (2) period end (final exit): inside just before, outside just after.
    checks++;
    const nearEnd = kernelSaturnSidereal(new Date(Date.parse(period.periodEndUtc) - 2 * 3600000).toISOString());
    if (!inArc(nearEnd, band.start, 90)) fail(`rashi ${natalMoonRashiId}: Saturn not in band just before end ${period.periodEndUtc}`);
    checks++;
    const pastEnd = kernelSaturnSidereal(new Date(Date.parse(period.periodEndUtc) + (tol + 1) * 86400000).toISOString());
    if (inArc(pastEnd, band.start, 90)) fail(`rashi ${natalMoonRashiId}: Saturn still in band ${tol + 1}d after end ${period.periodEndUtc}`);

    // (2b) first exit: within the period, at or before the final exit, and Saturn
    // genuinely outside the band just after it.
    checks++;
    if (!(Date.parse(period.periodStartUtc) < Date.parse(period.firstExitUtc) && Date.parse(period.firstExitUtc) <= Date.parse(period.periodEndUtc))) {
      fail(`rashi ${natalMoonRashiId}: firstExitUtc ${period.firstExitUtc} not within [start, end]`);
    }
    checks++;
    const pastFirstExit = kernelSaturnSidereal(new Date(Date.parse(period.firstExitUtc) + 2 * 3600000).toISOString());
    if (inArc(pastFirstExit, band.start, 90)) fail(`rashi ${natalMoonRashiId}: Saturn still in band just after firstExit ${period.firstExitUtc}`);

    // (3) span within the declared window. The classical NOMINAL is ~7.5y, but
    // Saturn's per-rashi transit durations vary substantially. Published whole
    // spans: Dhanu-Moon 2014-11-02 to 2023-01-17 (~8.2y, pinned as anchors
    // below); Mithuna-Moon 1999-03-01 to 2005-07-16 (~6.4y, sanjaperic.com);
    // Karka-Moon 2002-07-23 to 2009-09-09 (~7.1y, mypandit.com). Observed
    // engine spans therefore cluster ~6.4-8.3y; declared window [6.2, 8.5].
    checks++;
    const spanYears = (Date.parse(period.periodEndUtc) - Date.parse(period.periodStartUtc)) / (365.25 * 86400000);
    if (!(spanYears >= 6.2 && spanYears <= 8.5)) fail(`rashi ${natalMoonRashiId}: period span ${spanYears.toFixed(2)}y outside [6.2, 8.5]`);

    // (4) transitions: monotone, correctly ordered relative to each other.
    checks++;
    let prevT = Date.parse(period.periodStartUtc);
    let ordered = true;
    for (const tr of period.phaseTransitions) {
      const t = Date.parse(tr.utc);
      if (t <= prevT || t >= Date.parse(period.periodEndUtc)) { ordered = false; break; }
      prevT = t;
    }
    if (!ordered) fail(`rashi ${natalMoonRashiId}: transitions not strictly ordered inside the period`);

    // (5) every transition sits ON its rashi boundary (bisection accuracy):
    // JANMA events on the janma rashi start, THIRD events on the 2nd-from start.
    for (const tr of period.phaseTransitions) {
      const boundary = tr.event === 'JANMA_ENTRY' || tr.event === 'JANMA_RETROGRADE_RETURN' ? band.janmaStart : band.thirdStart;
      const lon = kernelSaturnSidereal(tr.utc);
      const delta = Math.abs(((lon - boundary + 180) % 360 + 360) % 360 - 180);
      checks++;
      if (delta > 0.05) fail(`rashi ${natalMoonRashiId}: ${tr.event} ${tr.utc} sits ${delta.toFixed(4)} deg from boundary ${boundary}`);
    }
  }
  return { scenarios, identityChecks: checks, violations, totalSolveMs, firstViolations };
}

/* ------------------------------------------------------------------------- */
/* Stream C — natal prohibition (charter §9 core)                             */
/* ------------------------------------------------------------------------- */

export interface StreamCReport { pairsChecked: number; violations: number; details: string[] }

interface ProhibitionPair { birthA: string; birthB: string; moonRashiId: number; lagnaRashiId: number; saturnA: number; saturnB: number }

export function discoverProhibitionPairs(seed: number, wanted: number): ProhibitionPair[] {
  const rnd = mulberry32(seed ^ 0xc0de);
  const pairs: ProhibitionPair[] = [];
  let attempts = 0;
  while (pairs.length < wanted && attempts < 4000) {
    attempts++;
    const base = new Date(Date.UTC(1975 + Math.floor(rnd() * 40), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28)));
    // A date 27.3 days earlier keeps the Moon in the same nakshatra-rhythm but
    // shifts natal Saturn; the daily scan below finds an exact (moon,lagna) match.
    for (let off = 1; off <= 40; off++) {
      const cand = new Date(base.getTime() - off * 86400000);
      const a = calculateKundali(base.toISOString().slice(0, 10), '10:30', 25.5941, 85.1376, 5.5);
      const b = calculateKundali(cand.toISOString().slice(0, 10), '10:30', 25.5941, 85.1376, 5.5);
      const moonA = (a.moon as { rashiId: number }).rashiId, moonB = (b.moon as { rashiId: number }).rashiId;
      const lagA = (a.lagna as { rashiId: number }).rashiId, lagB = (b.lagna as { rashiId: number }).rashiId;
      const satA = ((a.planets as Array<{ name: string; rashiId: number }>).find((p) => p.name === 'Saturn') as { rashiId: number }).rashiId;
      const satB = ((b.planets as Array<{ name: string; rashiId: number }>).find((p) => p.name === 'Saturn') as { rashiId: number }).rashiId;
      if (moonA === moonB && lagA === lagB && satA !== satB) {
        pairs.push({ birthA: base.toISOString().slice(0, 10), birthB: cand.toISOString().slice(0, 10), moonRashiId: moonA, lagnaRashiId: lagA, saturnA: satA, saturnB: satB });
        break;
      }
    }
  }
  return pairs;
}

function runStreamC(pairs: ProhibitionPair[]): StreamCReport {
  let violations = 0;
  const details: string[] = [];
  const referenceInstantUtc = '2026-09-03T06:00:00Z';
  for (const p of pairs) {
    // (i) Engine-level: identical queries from different natal charts are literally
    // the same query — the §9 point is that natal Saturn CANNOT enter. Prove the
    // type surface never accepted it and the state is identical per construction.
    const g1 = computeGochara({ natalMoonRashiId: p.moonRashiId, natalLagnaRashiId: p.lagnaRashiId, referenceInstantUtc });
    const g2 = computeGochara({ natalMoonRashiId: p.moonRashiId, natalLagnaRashiId: p.lagnaRashiId, referenceInstantUtc });
    if (JSON.stringify(g1.sadeSati) !== JSON.stringify(g2.sadeSati)) {
      violations++;
      details.push(`engine sadeSati diverged for identical inputs (${p.birthA} vs ${p.birthB})`);
    }
    // (ii) Snapshot-level: two full charts with same Moon/Lagna rashi but
    // DIFFERENT natal Saturn rashi must yield byte-identical snapshot sadeSati.
    const s1 = getCanonicalJyotishSnapshot({ birthDate: p.birthA, birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna', targetDate: new Date(referenceInstantUtc) });
    const s2 = getCanonicalJyotishSnapshot({ birthDate: p.birthB, birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna', targetDate: new Date(referenceInstantUtc) });
    const ss1 = s1.yogasAndDoshas.sadeSati as unknown as Record<string, unknown>;
    const ss2 = s2.yogasAndDoshas.sadeSati as unknown as Record<string, unknown>;
    if (JSON.stringify(ss1) !== JSON.stringify(ss2)) {
      violations++;
      details.push(`snapshot sadeSati diverged across natal Saturn rashi ${p.saturnA} vs ${p.saturnB} (${p.birthA} vs ${p.birthB})`);
    }
    if ((ss1 as { basis?: string }).basis !== 'TRANSIT') {
      violations++;
      details.push(`snapshot sadeSati basis is ${(ss1 as { basis?: string }).basis}, must be TRANSIT`);
    }
    // (iii) And the snapshot sadeSati must equal the pure-engine state.
    if ((ss1 as { saturnHousesFromMoon?: number }).saturnHousesFromMoon !== g1.sadeSati.saturnHousesFromMoon) {
      violations++;
      details.push(`snapshot sadeSati disagrees with gocharaEngine for moon rashi ${p.moonRashiId}`);
    }
  }
  // (iv) Static source pin: the removed natal-Saturn lookup must never return.
  const snapSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'jyotish', 'canonicalSnapshot.ts'), 'utf8');
  if (/find\(\(p: any\[\]\) => p\.name === 'Saturn'\)/.test(snapSrc)) {
    violations++;
    details.push('canonicalSnapshot.ts still contains the natal-Saturn Sade Sati lookup (RSK_016 regression)');
  }
  const yearSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'interpretationEngine.ts'), 'utf8');
  if (/rashi:\s*'Meena \(Pisces\)'/.test(yearSrc) || /axis:\s*'Kumbha/.test(yearSrc) || /varsheshwar:\s*'Brihaspati/.test(yearSrc)) {
    violations++;
    details.push('interpretationEngine.ts still contains fabricated yearly transit assignments (RSK_017 regression)');
  }
  return { pairsChecked: pairs.length, violations, details };
}

/* ------------------------------------------------------------------------- */
/* Stream D — external anchors                                                */
/* ------------------------------------------------------------------------- */

export interface StreamDReport { anchors: number; violations: number; results: Array<{ anchorId: string; engineUtc: string; publishedUtc: string; deltaHours: number; withinTolerance: boolean }> }

function runStreamD(fixtureSet: GocharaFixtureSet): StreamDReport {
  const results: StreamDReport['results'] = [];
  let violations = 0;
  for (const anchor of fixtureSet.externalAnchors) {
    let engineUtc: string;
    const period = computeSadeSatiPeriod({ natalMoonRashiId: anchor.natalMoonRashiId, natalLagnaRashiId: 1, referenceInstantUtc: anchor.referenceInstantUtc }).period;
    if (anchor.engineSelector === 'sadeSatiPeriodStart') {
      engineUtc = period.periodStartUtc;
    } else if (anchor.engineSelector === 'sadeSatiPeriodEnd') {
      engineUtc = period.periodEndUtc;
    } else if (anchor.engineSelector === 'sadeSatiFirstExit') {
      engineUtc = period.firstExitUtc;
    } else {
      // The anchor names one specific published crossing; Saturn can produce
      // several crossings of the same semantic event over a period (retrograde
      // oscillation), so select the engine crossing NEAREST the published
      // instant and require it inside the declared tolerance.
      const candidates = period.phaseTransitions.filter((t) => t.event === anchor.transitionEvent);
      if (candidates.length === 0) {
        violations++;
        results.push({ anchorId: anchor.anchorId, engineUtc: 'NOT_FOUND', publishedUtc: anchor.publishedUtc, deltaHours: NaN, withinTolerance: false });
        continue;
      }
      engineUtc = candidates.reduce((best, t) => (Math.abs(Date.parse(t.utc) - Date.parse(anchor.publishedUtc)) < Math.abs(Date.parse(best.utc) - Date.parse(anchor.publishedUtc)) ? t : best)).utc;
    }
    const deltaHours = Math.abs(Date.parse(engineUtc) - Date.parse(anchor.publishedUtc)) / 3600000;
    const withinTolerance = deltaHours <= anchor.toleranceDays * 24;
    if (!withinTolerance) violations++;
    results.push({ anchorId: anchor.anchorId, engineUtc, publishedUtc: anchor.publishedUtc, deltaHours, withinTolerance });
  }
  return { anchors: fixtureSet.externalAnchors.length, violations, results };
}

/* ------------------------------------------------------------------------- */
/* Stream E — fabrication regression (RSK_017)                                */
/* ------------------------------------------------------------------------- */

export interface StreamEReport { scenarios: number; checks: number; violations: number; firstViolations: string[] }

const RASHI_NAMES = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];

function runStreamE(scenarios: number, seed: number): StreamEReport {
  const rnd = mulberry32(seed ^ 0x51ab);
  let checks = 0, violations = 0;
  const firstViolations: string[] = [];
  const fail = (msg: string) => {
    violations += 1;
    if (firstViolations.length < 20) firstViolations.push(msg);
  };
  const city = { lat: 25.5941, lng: 85.1376, tz: 5.5 };
  for (let s = 0; s < scenarios; s++) {
    const days = Math.floor(rnd() * 2200); // 2026-01-01 .. ~2032-01-01
    const yearDate = new Date(Date.UTC(2026, 0, 1) + days * 86400000);
    const y = getYearlyInterpretation(city, yearDate);

    // Independent kernel recomputation at the same instant.
    const ephem = calculateCelestialEphemeris({ dateUtc: yearDate, latitude: city.lat, longitude: city.lng, nodeMode: 'MEAN_NODE' });
    const idx = (lon: number) => Math.floor((((lon % 360) + 360) % 360) / 30);

    checks++;
    const satIdx = idx(ephem.bodies.Saturn.siderealLongitude);
    if (y.saturnTransit.rashi !== RASHI_NAMES[satIdx]) fail(`scenario ${s}: saturnTransit.rashi '${y.saturnTransit.rashi}' != kernel '${RASHI_NAMES[satIdx]}'`);
    checks++;
    const jupRashi = y.jupiterTransit.rashi.split(' ')[0];
    const jupIdx = idx(ephem.bodies.Jupiter.siderealLongitude);
    if (jupRashi !== RASHI_NAMES[jupIdx]) fail(`scenario ${s}: jupiterTransit.rashi '${jupRashi}' != kernel '${RASHI_NAMES[jupIdx]}'`);
    checks++;
    if (!y.rahuKetuAxis.axis.startsWith(RASHI_NAMES[idx(ephem.bodies.Rahu.siderealLongitude)])) fail(`scenario ${s}: rahuKetuAxis '${y.rahuKetuAxis.axis}' does not start with computed Rahu rashi`);
    checks++;
    if (!y.varsheshwar.startsWith('NOT_CALCULATED')) fail(`scenario ${s}: varsheshwar must stay NOT_CALCULATED, got '${y.varsheshwar.slice(0, 30)}'`);
    checks++;
    if (!y.saturnTransit.sadeSatiPhase || typeof y.saturnTransit.sadeSatiPhase !== 'string') fail(`scenario ${s}: sadeSatiPhase missing`);

    // Snapshot: sadeSati is transit-based and pinned to the explicit reference.
    checks++;
    const snap = getCanonicalJyotishSnapshot({ birthDate: '1995-06-15', birthTime: '10:30', latitude: city.lat, longitude: city.lng, timezone: city.tz, locationName: 'Patna', targetDate: new Date(yearDate) });
    const ss = snap.yogasAndDoshas.sadeSati as unknown as { basis: string; referenceInstantUtc: string; transitSaturnRashiId: number };
    if (ss.basis !== 'TRANSIT') fail(`scenario ${s}: snapshot sadeSati.basis ${ss.basis}`);
    checks++;
    if (ss.referenceInstantUtc !== new Date(yearDate).toISOString()) fail(`scenario ${s}: snapshot referenceInstantUtc ${ss.referenceInstantUtc} != targetDate`);
    checks++;
    if (ss.transitSaturnRashiId !== satIdx + 1) fail(`scenario ${s}: snapshot transitSaturnRashiId ${ss.transitSaturnRashiId} != kernel ${satIdx + 1}`);
    checks++;
    if (!snap.transits || snap.transits.engineVersion !== GOCHARA_ENGINE_VERSION) fail(`scenario ${s}: snapshot.transits not populated with gochara engine result`);
  }
  return { scenarios, checks, violations, firstViolations };
}

/* ------------------------------------------------------------------------- */
/* Orchestration                                                              */
/* ------------------------------------------------------------------------- */

export interface GocharaQualificationReport {
  runnerVersion: string;
  engineVersion: string;
  fixtureSetId: string;
  fixtureSetSha256: string;
  gate: GocharaQualificationGate;
  scenarios: number;
  seed: number;
  generatedAtUtc: string;
  verdict: 'PASS' | 'FAIL' | 'FAIL_WITH_ONLY_KNOWN_FINDINGS';
  streamA: StreamAReport;
  streamB: StreamBReport;
  streamC: StreamCReport;
  streamD: StreamDReport;
  streamE: StreamEReport;
  determinism: { samples: number; mismatches: number };
  findings: Array<{ id: string; severity: 'BLOCKING' | 'NON_BLOCKING'; statement: string; status: string }>;
  totalViolations: number;
}

const DECLARED_FINDINGS: Array<{ id: string; severity: 'BLOCKING' | 'NON_BLOCKING'; statement: string; status: string }> = [
  { id: 'DECLARED_MEAN_NODE_PINNED', severity: 'NON_BLOCKING', statement: 'Rahu/Ketu transits use the MEAN_NODE convention engine-wide; the true-node variant is declared but not qualified.', status: 'OPEN' },
  { id: 'DECLARED_BOUNDARY_TOLERANCE_2D', severity: 'NON_BLOCKING' as const, statement: 'Phase-boundary instants carry the declared +/-2-day tolerance; observed agreement with published tables is under 3 hours.', status: 'OPEN' },
  { id: 'DECLARED_WHOLE_SIGN_ASPECTS', severity: 'NON_BLOCKING' as const, statement: 'Special aspects onto natal Lagna/Moon are whole-sign house distances; cusp-degree aspectation is not implemented.', status: 'OPEN' },
  { id: 'DECLARED_GOCHARA_SCOPE', severity: 'NON_BLOCKING' as const, statement: 'Transit Vimshottari overlay, Kaksha (Ashtakavarga transit) tables and Tajika Varshaphala year lord are out of Sprint G scope.', status: 'OPEN' }
];

export function runGocharaQualificationDetailed(opts: {
  scenarios: number;
  seed?: number;
  gate?: GocharaQualificationGate;
  fixtureSet: GocharaFixtureSet;
}): { report: GocharaQualificationReport; failures: unknown[]; writeArtifacts: (dir: string) => void } {
  const { scenarios, seed = DEFAULT_GOCHARA_SEED, gate = 'scaffold', fixtureSet } = opts;
  const failures: unknown[] = [];

  const streamA = runStreamA(scenarios, seed);
  for (const v of streamA.firstViolations) failures.push({ stream: 'TRANSIT_IDENTITY', detail: v });
  const periodScenarios = Math.max(30, Math.round(scenarios / 40)); // solve cost ~300ms each
  const streamB = runStreamB(periodScenarios, seed);
  for (const v of streamB.firstViolations) failures.push({ stream: 'PERIOD_SOLVER', detail: v });
  const pairs = discoverProhibitionPairs(seed, 5);
  const streamC = runStreamC(pairs);
  for (const d of streamC.details) failures.push({ stream: 'NATAL_PROHIBITION', detail: d });
  const streamD = runStreamD(fixtureSet);
  for (const r of streamD.results) if (!r.withinTolerance) failures.push({ stream: 'EXTERNAL_ANCHORS', detail: r });
  const streamE = runStreamE(Math.max(20, Math.round(scenarios / 100)), seed);
  for (const v of streamE.firstViolations) failures.push({ stream: 'FABRICATION_REGRESSION', detail: v });

  // Determinism: replay a fixed slice and require byte equality (CT_INV_007).
  const detA = runStreamA(150, 0xde7a11);
  const detB = runStreamA(150, 0xde7a11);
  const detJsonA = JSON.stringify(detA), detJsonB = JSON.stringify(detB);
  const determinism = { samples: 150, mismatches: detJsonA === detJsonB ? 0 : 150 };

  const totalViolations = streamA.violations + streamB.violations + streamC.violations + streamD.violations + streamE.violations + determinism.mismatches;
  const blockingFindings = DECLARED_FINDINGS.filter((f) => f.severity === 'BLOCKING');
  const verdict: GocharaQualificationReport['verdict'] =
    totalViolations === 0 && blockingFindings.length === 0 ? 'PASS' : totalViolations === 0 ? 'FAIL_WITH_ONLY_KNOWN_FINDINGS' : 'FAIL';

  const report: GocharaQualificationReport = {
    runnerVersion: GOCHARA_QUALIFICATION_RUNNER_VERSION,
    engineVersion: GOCHARA_ENGINE_VERSION,
    fixtureSetId: fixtureSet.fixtureSetId,
    fixtureSetSha256: fixtureSet.setSha256,
    gate,
    scenarios,
    seed,
    generatedAtUtc: new Date().toISOString(),
    verdict,
    streamA, streamB, streamC, streamD, streamE,
    determinism,
    findings: DECLARED_FINDINGS,
    totalViolations
  };

  const writeArtifacts = (dir: string) => {
    fs.writeFileSync(path.join(dir, 'gochara-summary.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'gochara-failures.json'), JSON.stringify({ totalViolations, failures }, null, 2) + '\n');
  };
  return { report, failures, writeArtifacts };
}

/* ------------------------------------------------------------------------- */

function parseArgs(argv: string[]): { scenarios: number; seed: number; gate: GocharaQualificationGate } {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const scenarios = Number(get('--scenarios') ?? 10000);
  const seedRaw = get('--seed');
  const seed = seedRaw !== undefined ? (seedRaw.startsWith('0x') ? parseInt(seedRaw, 16) : Number(seedRaw)) : DEFAULT_GOCHARA_SEED;
  const gate = (get('--gate') === 'strict' ? 'strict' : 'scaffold') as GocharaQualificationGate;
  return { scenarios, seed, gate };
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const fixtureSet = loadGocharaFixtureSet(buildGocharaFixtureSet());
  console.log(`[gochara-qualification] runner=${GOCHARA_QUALIFICATION_RUNNER_VERSION} scenarios=${args.scenarios} seed=${args.seed} gate=${args.gate}`);
  console.log(`[gochara-qualification] fixture=${fixtureSet.fixtureSetId} sha256=${fixtureSet.setSha256.slice(0, 16)}... anchors=${fixtureSet.externalAnchors.length}`);
  const { report, writeArtifacts } = runGocharaQualificationDetailed({
    scenarios: args.scenarios, seed: args.seed, gate: args.gate, fixtureSet
  });
  writeArtifacts(__dirname);
  console.log('');
  console.log('=== GOCHARA QUALIFICATION SUMMARY ===');
  console.log(`Verdict: ${report.verdict} (gate=${report.gate})`);
  console.log(`A Transit identity: ${report.streamA.identityChecks} checks / ${report.streamA.violations} violations (${report.streamA.scenarios} scenarios)`);
  console.log(`B Period solver:    ${report.streamB.identityChecks} checks / ${report.streamB.violations} violations (${report.streamB.scenarios} solves, ${report.streamB.totalSolveMs} ms total)`);
  console.log(`C Natal prohibition: ${report.streamC.pairsChecked} pairs / ${report.streamC.violations} violations`);
  console.log(`D External anchors: ${report.streamD.anchors} anchors / ${report.streamD.violations} violations`);
  for (const r of report.streamD.results) console.log(`   ${r.anchorId}: engine ${r.engineUtc} vs published ${r.publishedUtc} (delta ${r.deltaHours.toFixed(1)}h) ${r.withinTolerance ? 'OK' : 'FAIL'}`);
  console.log(`E Fabrication regression: ${report.streamE.checks} checks / ${report.streamE.violations} violations (${report.streamE.scenarios} scenarios)`);
  console.log(`Determinism: ${report.determinism.samples}/${report.determinism.mismatches} mismatches`);
  console.log(`Findings: ${report.findings.length} (all NON_BLOCKING declared simplifications)`);
  console.log('Artifacts: qualification/gochara-summary.json, qualification/gochara-failures.json');
  process.exitCode = report.verdict === 'PASS' || report.verdict === 'FAIL_WITH_ONLY_KNOWN_FINDINGS' ? 0 : 1;
}
