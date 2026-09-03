# Sprint G — Gochara (Transits) + Correct Sade Sati

**Status**: COMPLETE · **Gate**: PASS (strict, 10,000 scenarios, 0 violations) · **Engine**: `gochara-engine-1.0.0 (sprint-G qualified)` · **Fixture**: `GOCHARA_ENGINE_BENCHMARK_001` (sha `a84fef01…a42ea489`, runner-pinned)

Charter §9 required a first-class transit engine with explicit query conventions, and Sade
Sati implemented as a **real transit phenomenon** — period start, phase transitions, period
end, each with calculation evidence — **never inferred from natal Saturn/Moon positions**.

---

## 1. What was found (pre-sprint defects)

| ID | Defect | Location | Measurement |
|----|--------|----------|-------------|
| **RSK_016** | Sade Sati computed from **natal** Saturn's rashi — a static, time-blind state that never changes no matter what date you ask about | `canonicalSnapshot.ts` §10 (natal-Saturn lookup) | The 2025–2032 Mesha-Moon Sade Sati was invisible at any reference date; a chart with natal Saturn in the band reported "Sade Sati" in 1990 and 2050 alike. Propagated into timeline events via `yogasAndDoshas.sadeSati`. |
| **RSK_017** | Yearly transits **fabricated**: hardcoded `'Meena (Pisces)'` for Saturn, a lagna-arithmetic formula standing in for Jupiter's house, a hardcoded `Kumbha–Simha` Rahu axis, and a hardcoded Varsheshwar string | `interpretationEngine.getYearlyInterpretation` | User-facing via `src/app/daily/page.tsx` (yearly view). No ephemeris call anywhere in the path. |
| — | `canonicalSnapshot.transits?: any` declared but never populated | `canonicalSnapshot.ts` | The transit section of the canonical record did not exist. |

## 2. What was built

### 2.1 `src/lib/jyotish/gocharaEngine.ts` (new)

- **Explicit query** (charter §9): `GocharaQuery { natalMoonRashiId, natalLagnaRashiId, referenceInstantUtc }` — all three required; an incomplete or malformed query throws `GocharaError('GOCHARA_INPUT_INVALID')`. **No defaults, no host-clock reads, no natal-ephemeris inputs** — natal Saturn cannot enter the computation structurally.
- **Conventions** (CT_INV_004, declared on every result): `LAHIRI_CHITRA_PAKSHA` ayanamsha, `MEAN_NODE` Rahu/Ketu, geocentric apparent sidereal longitudes from the certified kernel (`calculateCelestialEphemeris`, Sprint C JPL-qualified).
- **9 transit grahas** with `houseFromLagna` and `houseFromMoon` identities.
- **Sade Sati state** (`basis: 'TRANSIT'`, pinned): band = whole-sign houses 12/1/2 from the **natal Moon rashi** (`SADE_SATI_BAND_HOUSES = [12, 1, 2]`); phase labels 1st (Rising/द्वादश शनि) · Peak (Janma Shani/जन्म शनि) · 3rd (Setting/द्वितीय शनि).
- **Dhaiya (Ardhashtama Shani)** declared separately: houses 4/8 (`DHAIYA_HOUSES = [4, 8]`).
- **Parashari special aspects** from transit Mars {4,8}, Jupiter {5,9}, Saturn {3,10} onto the natal Lagna and Moon rashis (whole-sign; cusp-degree aspectation is a declared NON_BLOCKING gap).
- **Period solver** `computeSadeSatiPeriod`:
  - shared 10-day sidereal-Saturn sample scan (first pass 13.5 y; adaptive second pass to 31.5 y for tail-of-period references), **ALL** boundary crossings detected incl. retrograde returns, then bracketed bisection (30 iterations);
  - events: `JANMA_ENTRY` / `JANMA_RETROGRADE_RETURN` / `THIRD_ENTRY` / `THIRD_RETROGRADE_RETURN` — the retrograde oscillation is captured, **never aliased** (a v1 sequential walker aliased it and was replaced; see the Errors register below);
  - evidence block: band start/end in sidereal degrees, Saturn's longitude at the reference instant, method string, declared ±2-day boundary tolerance, and the declared **period-end convention**: `periodEndUtc` = FINAL exit (strict band membership: a retrograde dip back into the band stays inside the period), `firstExitUtc` = FIRST departure — the "classical end" most published panchangs print (e.g. "Sade Sati ends for Dhanur Rasi" at the 2022-04-29 Kumbha entry).
  - fail-closed: unresolved bracket → `GocharaError('BOUNDARY_BRACKET_FAILED')`, never a guess.

### 2.2 Rewiring (`canonicalSnapshot.ts`)

- §10 replaced: the natal-Saturn lookup is **gone** (static source pin enforced by the runner and the spec); Sade Sati now comes from `computeGochara` at the explicit `targetDate`.
- The consumer-facing shape `{ isActive, phase, description }` is preserved (timelineEngine unaffected) and **extended** with `basis: 'TRANSIT'`, `natalMoonRashiId`, `transitSaturnRashiId`, `saturnHousesFromMoon`, `referenceInstantUtc` — calculation evidence, not a naked boolean.
- `transits` is now populated with the full `GocharaResult` at the snapshot's `targetDate`.

### 2.3 De-fabrication (`interpretationEngine.getYearlyInterpretation`)

- Saturn/Jupiter transits and the Rahu–Ketu axis are computed from the certified kernel at the explicit reference instant; the hardcoded strings are gone (source-pinned).
- Varsheshwar: `NOT_CALCULATED — the Tajika year lord requires the qualified Varshaphala engine; it is not fabricated here` (CT_INV_006 honest gap, replaces a hardcoded lord string).

## 3. Qualification — `GOCHARA_ENGINE_BENCHMARK_001`

Runner: `qualification/gochara-qualification-runner.ts` (`gochara-qualification-runner-1.0.0 (sprint G)`, seed `0x60ca`, gate `strict` @ 10,000 scenarios). Run: `npm run qualify:gochara` (~100 s). Artifacts: `qualification/gochara-summary.json`, `qualification/gochara-failures.json`.

**Verdict PASS — 0 violations.**

| Stream | What it proves | Checks / violations |
|--------|----------------|---------------------|
| A Transit identity | 9 grahas × rashi containment, house identities vs independent recomputation, Sade Sati band membership ⇔ state, Dhaiya ⇔ state, aspect sets exact, conventions pins | **1,130,000 / 0** |
| B Period solver | start/end/first-exit band-membership probes (±, beyond tolerance), span in declared window, monotone events, every transition ON its rashi boundary (|Δλ| < 0.05°) | **3,062 / 0** (250 solves) |
| C Natal prohibition | 5 discovered chart pairs with equal Moon/Lagna rashis but **different natal Saturn rashis** → byte-identical snapshot Sade Sati; snapshot ≡ engine state; static no-natal-Saturn source pin; no fabricated yearly strings | **5 pairs / 0** |
| D External anchors | 8 published sidereal-Saturn epochs (SOURCE_SECONDARY): | **8 / 0** |
| E Fabrication regression | yearly Saturn/Jupiter/axis ≡ kernel recomputation; Varsheshwar stays NOT_CALCULATED; snapshot basis/reference echo | **900 / 0** |
| Determinism | byte-identical replay | 150 / 0 |

### External anchor agreement (engine vs published tables)

| Anchor | Engine (UTC) | Published | Δ |
|--------|--------------|-----------|---|
| Meena entry 2025 (Sade Sati starts for Mesha Moon) | 2025-03-29 15:47 | 2025-03-29 ~16:15 | **0.5 h** |
| Vrishchika entry 2014 (starts for Dhanu Moon) | 2014-11-02 14:21 | 2014-11-02 ~12:00 | **2.4 h** |
| Kumbha first entry 2022 (ends for Dhanu Moon) | 2022-04-29 02:23 | 2022-04-29 ~04:00 | **1.6 h** |
| Kumbha permanent entry 2023 (final exit for Dhanu Moon) | 2023-01-17 12:20 | 2023-01-17 ~06:00 | **6.3 h** |
| Mesha first entry 2027 (Janma for Mesha Moon) | 2027-06-02 22:49 | 2027-06-03 ~00:53 | **2.1 h** |
| Meena retrograde return 2027 | 2027-10-20 03:03 | 2027-10-20 ~00:35 | **2.5 h** |
| Mesha permanent entry 2028 | 2028-02-23 12:23 | 2028-02-23 ~14:30 | **2.1 h** |

All deltas are **hours**, against a declared tolerance of ±2 days. The 2027-10-20 retrograde return and 2028-02-23 permanent re-entry confirm the engine's oscillation handling against independent published tables.

### Declared findings (NON_BLOCKING, surfaced)

- `DECLARED_MEAN_NODE_PINNED` — Rahu/Ketu transits use MEAN_NODE engine-wide; true-node not qualified.
- `DECLARED_BOUNDARY_TOLERANCE_2D` — declared boundary tolerance ±2 days (observed ≤ 6.3 h).
- `DECLARED_WHOLE_SIGN_ASPECTS` — special aspects are whole-sign distances; cusp-degree aspectation not implemented.
- `DECLARED_GOCHARA_SCOPE` — transit Vimshottari overlay, Kaksha tables, Tajika Varshaphala year lord out of scope (Varsheshwar therefore honestly NOT_CALCULATED).

### Measurement notes preserved

- **Span window**: real Sade Sati spans vary with Saturn's per-rashi speeds — published: Dhanu-Moon 2014-11-02 → 2023-01-17 (~8.2 y), Mithuna-Moon 1999-03-01 → 2005-07-16 (~6.4 y), Karka-Moon 2002-07-23 → 2009-09-09 (~7.1 y). Declared solver window [6.2, 8.5] y; the classical 7.5 y is a nominal mean (SOURCE_SECONDARY).
- Fixed-pair caveat: the spec's two-fixed-charts prohibition test self-skips if the chosen pair shares its natal Moon rashi imperfectly; Stream C discovers valid pairs at scale and is the authoritative §9 check.

## 4. Validation tier (CT_INV_005)

Gochara engine: **IMPLEMENTED → INTERNALLY_VERIFIED** (1.13M identity checks vs independent recomputation from the Sprint-C-certified kernel) **+ external anchor agreement** at ≤ 6.3 h against 8 published epochs (SOURCE_SECONDARY, multiple independent panchang tables). **EXTERNALLY_VERIFIED** status against Swisseph-independently-published ephemerides is recorded as the qualification ceiling for this sprint; scholar sign-off remains outstanding per the mission-wide certification ladder.

## 5. Artifacts & tests

- `src/lib/jyotish/gocharaEngine.ts` — the engine (versioned, fail-closed).
- `src/lib/jyotish/canonicalSnapshot.ts` — §10 rewired, `transits` populated.
- `src/lib/interpretationEngine.ts` — yearly transits de-fabricated.
- `qualification/gochara-qualification-runner.ts` — the gate.
- `qualification/gochara-summary.json`, `qualification/gochara-failures.json` — 10k strict artifacts.
- `tests/gochara-qualification.spec.ts` — 18 passed / 1 conditional skip / 0 failed.
- npm scripts: `qualify:gochara` (10k strict), `qualify:gochara:scaffold` (2k).

Risk register: **RSK_016 RESOLVED**, **RSK_017 RESOLVED** (`04-risk-register.md`).
