# 07 — Sprint E: Vimshottari + Panchanga Qualification

**Status**: COMPLETE (this workspace)
**Runner**: `time-qualification-runner-1.0.0 (sprint E)` — `npm run qualify:time`
**Certification**: `docs/reference-grade/time-certification.md` (GENERATED — never hand-edit numbers)
**Fixture set**: `qualification/fixtures/time-fixtures.json` — `TIME_ENGINE_BENCHMARK_001`
(sha256 `a67f731912b93535b80da397dae5b0f35e697b1296404dd63a8f641a71a180e2`;
classical tables `SOURCE_SECONDARY`; 3 golden charts + 5 golden panchang scenarios `ENGINE_DERIVED`)

---

## 1. Scope (Mission §6, §8)

- **§8 Vimshottari**: birth nakshatra, balance at birth, exact period boundaries
  (MD/AD/PD), period nesting, boundary timestamps, long-range consistency, frozen
  benchmark fixtures. One dasha system only; nothing is combined into scores.
- **§6 Panchanga**: Tithi, Nakshatra, Pada, Yoga, Karana, Vara, Paksha, sunrise,
  sunset, month; muhurta windows (Rahu Kaal, Yamaganda, Gulika, Abhijit). Boundary
  TIMES verified, not merely labels.

## 2. Defects found and fixed (measured, then repaired)

1. **Host-timezone dependence of panchang solar instants (RSK_013, CONFIRMED)**:
   the same query returned sunrise 06:04Z + `currentPeriod "Usha Kala"` on a UTC
   server but sunrise 00:34Z + `"Rahu Kalam"` on an IST server — the civil day,
   weekday and solar instants were derived from the HOST clock. Fixed: target-civil-
   day derivation (instant shifted by the city offset, UTC getters) and true-UTC
   solar instants; display strings render the target wall clock host-independently.
   Regression-pinned by spawning UTC and IST hosts in the gate spec.
2. **Host-timezone dependence of dasha display strings (RSK_013)**: pratyantardasha
   `startFormatted/endFormatted` used host-locale `toLocaleDateString` on UTC-midnight
   boundaries — a day drift across hosts (measured "Aug 11" vs "Aug 12"). Fixed with
   static month tables + UTC getters; A/B-verified byte-identical on UTC hosts
   (pure performance + correctness fix; ISO date fields unchanged).
3. Performance: the locale calls also made one dasha schedule cost ~83 ms (≈1,800
   locale renders), which would have made a 100k-scenario sweep take ~2.3 h. After
   the fix the full qualification runs in ~3.5 min.

No calculation value changed: dasha ISO dates and panchang limb labels are
byte-identical to the pre-fix engine (A/B verified; golden regressions 0).

## 3. Qualification design

- **Independent Vimshottari implementation** in the runner (no shared code with
  `dashaEngine.js`): nakshatra fraction → starting lord → balance → cumulative
  365.25-day arithmetic. Every scenario compares MD/AD/PD boundary dates, lord
  cycles, contiguity, nesting, AD-sum = MD, PD-sum = AD, the 120-year span
  identity, and a 120-year-shifted schedule repeating identically.
- **Frozen goldens**: three canonical charts (incl. the Patna reference chart and a
  nakshatra-edge case) pin the full MD list, the Rahu-MD antardasha tree and one
  pratyantardasha tree; five panchang scenarios pin limb labels AND exact solar
  instants to the millisecond.
- **Panchanga limbs** recomputed from the certified kernel's longitudes via a
  mirrored fast solver (`GeoVector`+`Ecliptic`+canonical ayanamsha) and classical
  tables; labels compared away from boundaries; exact boundaries are decided by
  transition solves instead.
- **Transition timestamps** (the §6 requirement): next AND immediately-previous
  Tithi/Nakshatra boundaries solved by bracketed bisection (adaptive step,
  60-iteration bisection) on the kernel ephemeris; the engine's reported limb
  progress must equal the interval fraction within 2.5 pp.
- **Sunrise/sunset** compared against the certified kernel's `SearchRiseSet` with
  declared tolerances (5 min for |lat| ≤ 30°, 8 min to 41°); deltas are reported
  as statistics, never hidden.
- **Muhurta windows** verified through the public output: segment factors per vara
  against the classical table, one-eighth day duration, Abhijit as the 8th of 15
  daylight muhurtas, target civil-day correctness.

Boundary convention (declared): a part boundary belongs to the NEXT period; the
Vimshottari year is 365.25 days; birth instant is UTC midnight of the civil birth
date (the documented dashaEngine host-fix convention).

## 4. Full-scale result (100,000 scenarios + 240 panchanga scenarios)

| Check | n | failures |
|---|---|---|
| Vimshottari boundary comparisons (independent impl) | 5,140,423 | 0 |
| Vimshottari property checks | 22,178,001 | 0 violations |
| Golden-chart regressions | 3 charts | 0 |
| Panchanga limb checks | 1,485 | 0 |
| Transition timestamps solved by bisection | 960 | — |
| Progress-vs-interval identity checks | 480 | 0 violations |
| Solar timing samples vs certified kernel | 240 | 0 tolerance breaches (mean 0.75 min, max 2.30 min sunrise) |
| Muhurta factor/window checks | 960 | 0 |
| Golden panchang pins (exact instants) | 5 × 9 fields | 0 |

Verdict **PASS** on both `scaffold` and `strict` gates.

## 5. Validation status after Sprint E (CT_INV_005 tiers)

| Capability | Tier | Basis |
|---|---|---|
| Vimshottari MD/AD/PD boundaries | **INTERNALLY_VERIFIED (strong)** | Independent implementation + 5.1M boundary comparisons + frozen goldens; timestamps verified, not labels |
| Panchanga limbs (Tithi/Nakshatra/Pada/Yoga/Karana/Vara/Paksha) | **INTERNALLY_VERIFIED** | Classical tables + certified-kernel longitudes + transition-solve identity |
| Sunrise/sunset (panchang approx) | INTERNALLY_VERIFIED (bounded) | max 2.3 min vs certified kernel; stats published |
| Purnimanta month | **NOT_CALCULATED** | Declared gap; v40 identity layer reports NOT_CALCULATED |
| Hora / Choghadiya | NOT_IMPLEMENTED | Declared gap; queued; no numbers fabricated anywhere |

## 6. Assumptions recorded

- The Vimshottari year is 365.25 days (the engine's declared convention, consistent
  with the report layer's "engine's own 365.25-day year").
- Karana fixed ends (Kimstughna, Shakuni, Chatushpada, Naga) and the 8-segment
  muhurta factor tables are the standard classical assignments (SOURCE_SECONDARY).
- The sunrise tolerance (5/8 min) is an engineering bound for the day-of-year
  approximation, not a classical claim.
- The D60-style birth-time sensitivity problem does not arise for dasha boundaries:
  a nakshatra spans ≈ 13.2° of Moon motion ≈ 26 hours — resolvable far below
  normal birth-time uncertainty; pratyantardashas (≈ hours-days) are the finest
  division exposed.

## 7. Unresolved problems

- Purnimanta month naming requires an authoritative rule statement before it can
  be computed (CT_INV_001: no LLM-derived classical rule). Declared, not guessed.
- Hora/Choghadiya remain unimplemented (charter §6 tail items) — queued, with the
  adopted-tradition documentation requirement attached.
- The sunrise approximation could be replaced by the certified kernel's
  SearchRiseSet path in a future sprint (would cost ~35 ms per panchang call);
  measured stats show the approximation is currently within a food-preparation
  tolerance for muhurta purposes, so it is kept and bounded, not silently upgraded.
