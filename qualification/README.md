# qualification/ — Astronomy Qualification Harness (Sprint B scaffold)

> **Mission anchor**: `docs/reference-grade/MISSION_REFERENCE_GRADE_JYOTISHA_ENGINE.md` §5 (Mass Astronomical Qualification) and §41 (Sprint B → Sprint C).
> **Status**: scaffold COMPLETE. The 100,000-scenario machinery is executable today; Sprint C wires the full external reference pipeline (bulk JPL retrieval + Swiss-parity adjudication) on top of it.

## What lives here

| Path | Purpose |
|---|---|
| `astronomy-qualification-runner.ts` | The qualification runner: scenario self-audit, determinism enforcement, fixture comparison, artifact generation, `--gate scaffold|strict`, optional certification-doc output. |
| `scenarioGenerator.ts` | Deterministic, seeded scenario generator (100k-capable) covering all Mission §5 dimensions. |
| `toleranceModel.ts` | Explicit arcsecond tolerance table + documented explained-divergence bands. Never rounds to hide discrepancies. |
| `fixtures/astronomy-golden-fixtures.json` | Golden benchmark seed set (36 rows) with per-row + set-level SHA-256 integrity. |
| `tools/build-seed-fixtures.cjs` | Reproducible builder for the seed fixture set (deterministic; re-runnable). |

## Usage

```bash
npm run qualify:astronomy          # full-scale run: 100,000 scenarios + cert doc (≈30 s)
npm run qualify:astronomy:scaffold # fast scaffold gate (1,000 scenarios) for CI
npx tsx qualification/astronomy-qualification-runner.ts --scenarios 50000 --seed 0x1234 --gate strict
```

Exit codes: `0` when the verdict is `PASS` or `FAIL_WITH_ONLY_KNOWN_FINDINGS` (scaffold gate),
`1` on `FAIL`. Under `--gate strict` any blocking finding fails the run — including the
currently documented ones.

## Artifacts (generated, git-ignored)

- `qualification/astronomy-summary.json` — verdict, counts, findings, coverage, fingerprints.
- `qualification/astronomy-failures.json` — full-precision per-comparison divergence records.
- `qualification/astronomy-statistics.json` — tolerance table, per-point statistics, coverage matrix.
- `docs/reference-grade/astronomy-certification.md` — generated with `--write-cert-doc`. **Committed.**

Only numbers actually produced by the pipeline may be quoted anywhere (Mission §35).

## Scenario corpus (deterministic, seed `0x51514A31`)

Composition per 1,000-scenario block:

| Slot | Basis | Covers |
|---|---|---|
| 0–499 | `STRATIFIED_RANDOM` | Full 1900–2100 period, ±66° latitude, ±180° longitude |
| 500–584 | `TARGETED_MIDNIGHT` | Local 00:00:00 / 23:59:59 at 13 fractional-offset zones (+5:30 IST, +5:45, −9:30, +12:75 …) |
| 585–644 | `TARGETED_LEAP_DAY` | Every Feb 29 from 1904–2096 |
| 645–704 | `TARGETED_DST_CIVIL_BOUNDARY` | US/EU DST transitions, WWII-India DST era, pre-1962 UT1 era |
| 705–824 | `TARGETED_INDIA_SPECIFIC` | 12 canonical Indian anchors across the full period |
| 825–884 | `TARGETED_HIGH_LATITUDE_ADVERSARIAL` | ±58…70° — deliberately beyond app-level Gate 1b (RSK_003) |
| 885–919 | `TARGETED_ANTIMERIDIAN` | ±180°, ±179.99°, Greenwich |
| 920–999 | `TARGETED_EPOCH_CORNER` | Period first/last second, century turns, J2000 |

Sign-boundary, Nakshatra-boundary proximity is **derived from computed readings** at run time
(±0.05° windows), not guessed at generation time.

## Determinism contract (CT_INV_007)

Every 50th scenario is recomputed and compared with
`compareReadingsForDeterminism` (`src/lib/astronomy/astronomyProvider.ts`):

- **Ideal**: byte-identical canonical JSON.
- **Enforced floor**: FP-equivalence — structures/strings/booleans match exactly; numbers match
  within `|Δ| ≤ 1e-9 + 8·ε·max(|a|,|b|)` (≈0.0036 microarcsec on angles).
- **Rationale**: the harness measured that V8 JIT tier transitions can reassociate the last ULP
  of float64 math in the wrapped library's ecliptic path (~0.2% of instants, max observed
  `1.091e-11°` ≈ 0.04 µas on the 100k run). This is platform float noise, not engine
  non-determinism; anything beyond the floor fails the run closed.

## Tolerances (from 02-validation-gap-analysis.md §3.A)

| Point | Base tolerance |
|---|---|
| Sun, Moon | 36″ (±0.01°) |
| Mercury…Saturn | 72″ (±0.02°) |
| Rahu, Ketu, Ascendant | 180″ (±0.05°) |

Explained-divergence band (documented, recorded, never silent): **Moon, from 2050-01-01**,
×3 multiplier, code `DELTAT_EXTRAPOLATION_BEYOND_2050` — Espenak–Meeus ΔT extrapolation vs
JPL's frozen leap-second UTC diverge beyond 2050 (Moon moves ≈0.55″/s; measured 2100 case: 78.41″).

## Golden fixture seed set

`ASTRO_SEED_JPL_DE441_001` — 36 rows:

- **28 rows SOURCE_VERIFIED**: NASA/JPL Horizons (`QUANTITIES=31`, apparent geocentric
  ecliptic-of-date, DE441), 7 grahas × 4 epochs (1950/2000/2050/2100-01-01 12:00 UT).
- **8 rows SOURCE_SECONDARY**: Rahu/Ketu mean-node analytic values computed by an
  *independent* Meeus-series implementation (`tools/build-seed-fixtures.cjs` — production code
  is never imported; Mission §21 anti-circular-testing).

Fixture integrity: per-row `contentSha256` + set-level `fixtureSetSha256`. Any tampering fails
closed with `FIXTURE_TAMPERED`.

## Open blocking findings (as of Sprint B — all documented, all scheduled)

| Finding | Meaning | Scheduled |
|---|---|---|
| `AYANAMSHA_EPOCH_DECLARED_VS_IMPLEMENTED` | Engine ayanamsha at J2000 = 23°51′25.5″ vs registry-declared 23°51′11″ (+14.53″). The engine does not yet meet its own CT_INV_004 declaration. | Sprint C — scholar-reviewed, versioned constant reconciliation (shifts all charts; must never be silent). |
| `MC_NOT_CALCULATED` | Midheaven is declared NOT_CALCULATED by the provider; Mission §5 requires MC coverage. | Sprint C/M. |
| `DETERMINISM_FP_LAST_ULP_NOISE` (non-blocking) | Measured last-ULP float noise, see contract above. | Re-measured at every full run. |

`KNOWN_SPRINT_B_FINDINGS` in the runner pins these IDs: the scaffold gate fails on anything else,
so new defects can never hide behind the known ones.

## Sprint C plan (what this scaffold is missing by design)

1. Bulk JPL Horizons retrieval adapter (`JplReferenceProvider` — currently fails closed) and
   the 100,000-row external reference corpus with persisted provenance.
2. Swiss Ephemeris parity adjudication (the charter's production standard) — decide & document
   the ayanamsha reconciliation.
3. Ascendant/MC cross-verification against independent references.
4. `qualification-lab`-style differential reporting per subsystem (Panchanga, Vargas, Dasha).
