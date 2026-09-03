# 05 — Sprint B Report: Qualification Framework & Universal Convention Center

**Date**: September 3, 2026
**Sprint**: B (Qualification framework + convention registry) — per `MISSION_REFERENCE_GRADE_JYOTISHA_ENGINE.md` §41
**Branch state at start**: `main` @ `7d5d572` — Sprint A complete, 0 TypeScript errors, engine test suite green
**Branch state at end**: all Sprint B deliverables implemented, 0 TypeScript errors, regression suite green (baseline preserved + 32 new tests)

---

## 1. Executive Summary

Sprint B delivered the three charter-mandated foundations, wrapped around the existing working engines (nothing was replaced):

1. **AstronomyProvider abstraction** (`src/lib/astronomy/astronomyProvider.ts`) — pluggable, fail-closed, versioned provider layer with `SwissEphemerisProvider` (production reference, honestly labelled), `FixtureProvider` (checksummed golden-benchmark replay) and a fail-closed `JplReferenceProvider` scaffold.
2. **Universal Convention Center** — all ten Declared Conventions from `03-convention-registry.md` are now machine-readable, checksummed, stamped onto every canonical chart snapshot, and fail-closed against silent tradition mixing.
3. **100,000-scenario qualification harness** (`qualification/`) — deterministic generator, explicit tolerances, JPL-verified golden seed fixtures, artifact pipeline, and a full-scale 100,000-scenario run already executed as proof of scale.

The harness immediately produced **material audit findings** that Sprint A could not have seen (§5 below) — which is precisely its job.

---

## 2. Changed Files

### New files
| File | Purpose |
|---|---|
| `src/lib/astronomy/astronomyProvider.ts` | Provider abstraction: request/reading contracts, invariants, typed fail-closed errors, registry, determinism comparator. |
| `qualification/astronomy-qualification-runner.ts` | Qualification runner + artifact/certification writers + CLI. |
| `qualification/scenarioGenerator.ts` | Seeded deterministic scenario generator (8 stratified bases covering all Mission §5 dimensions). |
| `qualification/toleranceModel.ts` | Explicit arcsecond tolerance table + explained-divergence bands. |
| `qualification/fixtures/astronomy-golden-fixtures.json` | 36-row golden seed set (28 JPL SOURCE_VERIFIED + 8 analytic SOURCE_SECONDARY), checksummed. |
| `qualification/tools/build-seed-fixtures.cjs` | Deterministic fixture builder (independent mean-node implementation inside). |
| `qualification/README.md` | Harness contract, usage, artifact schemas, known findings, Sprint C plan. |
| `tests/astronomy-provider.spec.ts` | 12 provider tests (invariants, fail-closed, determinism, fixtures, JPL stub). |
| `tests/convention-center-declarations.spec.ts` | 9 convention-registry tests (CT_INV_004 wiring, fail-closed, snapshot stamping). |
| `tests/qualification-harness.spec.ts` | 10 harness tests (generator determinism/coverage, tolerance model, end-to-end runs, artifacts). |

### Modified files
| File | Change |
|---|---|
| `src/lib/jyotish/conventionCenter.ts` | **Additive only.** Ten declared conventions, `ConventionError`, per-convention resolvers, deterministic checksummed `buildConventionManifest()`, `buildConventionSnapshotMetadata()`. All pre-existing exports (`CALCULATION_PRESETS`, `DEFAULT_PRESET`) untouched — the existing TRUST-08 test still passes unchanged. |
| `src/lib/jyotish/canonicalSnapshot.ts` | `meta` now additionally carries `conventionRegistry` (full CT_INV_004 manifest + checksum) and `astronomyProvider` (provider/kernel/validation-status disclosure). Additive fields; calculation pipeline untouched. |
| `package.json` | Added `qualify:astronomy` and `qualify:astronomy:scaffold` scripts; added `tsx` devDependency (standalone TS runner). |
| `.gitignore` | Ignored the three regenerable artifact JSONs (the certification MD is committed). |
| `docs/reference-grade/README.md` | Index updated with Sprint B outputs (this file, certification doc). |
| `docs/reference-grade/04-risk-register.md` | RSK_009/010/011 added (see §5). |

### Generated & committed
- `docs/reference-grade/astronomy-certification.md` — machine-generated from the actual 100,000-scenario run. Never hand-edit.

---

## 3. Provider Architecture (Mission §4)

```
AstronomyProvider (interface: getSnapshot + descriptor)
 ├── SwissEphemerisProvider   role=PRODUCTION  status=INTERNALLY_VERIFIED
 │     └── wraps calculateCelestialEphemeris() — the existing working engine, untouched
 ├── FixtureProvider          role=FIXTURE     replays checksummed golden rows; fails closed on missing instant/body
 └── JplReferenceProvider     role=REFERENCE   fails closed (QUALIFICATION_PROVIDER_NOT_IMPLEMENTED) until Sprint C
```

Enforced invariants on every reading (violation ⇒ typed `AstronomyProviderError`, CT_INV_006):
- finiteness + `[0,360)` range of every longitude;
- **node opposition exactness**: `min(wrap, 360−wrap) ≤ 1e-9°` where `wrap = normalize(Ketu − Rahu − 180)` (shortest-arc form — the naive form produced false positives at the 0°/360° wrap, caught and fixed during this sprint);
- ayanamsha plausibility band for sidereal systems;
- certified period 1900–2100 (`EPHEMERIS_OUTSIDE_CERTIFIED_PERIOD` beyond it);
- polar-risk flag (observability, RSK_003) for |lat| > 65° — the provider stays mathematically well-defined there; the application Gate 1b continues to bound user input.

**Honesty guards (CT_INV_005)**: the production provider is *named* `SwissEphemerisProvider` per the charter, but its descriptor discloses the actual kernel (`astronomy-engine`, Moshier-class VSOP87/ELP2000-82 series) and states that Swiss parity must be proven by Sprint C before any external-verification claim. MC is declared `NOT_CALCULATED` — never fabricated.

---

## 4. Convention Center (Mission CT_INV_004)

- `DECLARED_CONVENTIONS`: the ten registry conventions with adopted values, definitions, source sections (`03-convention-registry.md §2.1–§2.10`), alternatives with usage policies (`RESERVED_FUTURE` / `EXPLICIT_SELECTION_ONLY`), and open items.
- `buildConventionManifest(presetId)`: resolves every preset field to a declared value; produces a **deterministic SHA-256 checksummed manifest** (no timestamps inside the hash). Unknown preset ⇒ `ConventionError('CONVENTION_PRESET_UNKNOWN')`. Undeclared value (e.g. `YOGINI_36`/`CHARA` dasha, `UPPER_LIMB` sunrise — present as preset *fields* but never declared) ⇒ `ConventionError('CONVENTION_UNREGISTERED')`. The engine refuses to stamp what the registry does not declare.
- `KP_ASTROLOGY_STANDARD` selects `TRUE_NODE`/`PLACIDUS`/KP ayanamsha as **explicitly labelled alternatives** (`PRESET_EXPLICIT_ALTERNATIVE`) — CT_INV_003 enforced at the type level.
- Every `getCanonicalJyotishSnapshot()` output now stamps `meta.conventionRegistry` (manifest + checksum) and `meta.astronomyProvider` (provider id/version/kernel/validation status). Downstream reports and API payloads can therefore always answer "under which conventions was this chart computed?"

---

## 5. Qualification Results & Audit Findings

Full-scale proof run: **100,000/100,000 scenarios executed, 0 aborted, 26.3 s**, stream fingerprint `AA326BC8` (seed `0x51514A31`), 2,000 determinism samples.

External agreement vs JPL Horizons (DE441, apparent geocentric ecliptic-of-date, 36 reference rows):

| Point | max |Δ| | tolerance | verdict |
|---|---|---|---|
| Sun | 5.41″ | 36″ | PASS |
| Moon | 36″–78″ (see band) | 36″ | PASS ≤2050; explained beyond |
| Mercury | 9.34″ | 72″ | PASS |
| Venus | 7.84″ | 72″ | PASS |
| Mars | 5.07″ | 72″ | PASS |
| Jupiter | 6.42″ | 72″ | PASS |
| Saturn | 4.34″ | 72″ | PASS |
| Rahu/Ketu (vs independent Meeus series) | 0.46″ | 180″ | PASS |

### Findings raised by this sprint (all recorded, none hidden)

| ID | Severity | Finding |
|---|---|---|
| `AYANAMSHA_EPOCH_DECLARED_VS_IMPLEMENTED` | **BLOCKING (known)** | Engine ayanamsha at J2000.0 = **23°51′25.5″** (23.857092°) vs registry-declared **23°51′11″** (23.853056°) — **+14.53″**. The engine does not meet its own CT_INV_004 declaration. Remediation is a Sprint-C scholar-reviewed, versioned constant reconciliation (it shifts all charts; a silent edit is forbidden). Risk-registered as RSK_009. |
| `MC_NOT_CALCULATED` | **BLOCKING (known)** | Midheaven is not computed by the wrapped engine; Mission §5 requires it for astronomy certification. Risk-registered as RSK_010. |
| `JPL-DE441-2100-MOON` | explained divergence | Moon Δ=78.41″ at the 2100 epoch exceeds the 36″ base tolerance: ΔT-extrapolation divergence (Espenak–Meeus vs JPL frozen leap-second). Recorded with full precision and explanation code `DELTAT_EXTRAPOLATION_BEYOND_2050`; not a pass, not a defect — a bounded, documented reference-time-scale effect (RSK_011). |
| `DETERMINISM_FP_LAST_ULP_NOISE` | NON_BLOCKING | 4/2,000 determinism samples differed in the **last ULP** of float64 (max `1.091e-11°` ≈ 0.04 µas) under V8 JIT tier transitions. CT_INV_007 is enforced at a 1e-9° FP-equivalence floor (7+ orders of magnitude below any tolerance); byte-identity remains the ideal and the structure/strings/booleans must match exactly. This finding *falsified* the earlier "bit-for-bit identical" claim at raw-double level and replaced it with a measurable, enforced contract. |
| Harness self-corrections | — | Two defects in Sprint B's own first draft were caught by its own tests before landing: the naive node-opposition wrap check, and an over-strict byte-equality determinism check. Both are now regression-tested. |

`KNOWN_SPRINT_B_FINDINGS` pins the two blocking IDs: the scaffold gate fails on **any other** blocking finding, so future defects cannot hide behind known ones.

---

## 6. Tests & Verification

| Suite | Result |
|---|---|
| `npx tsc --noEmit` | **0 errors** |
| New Sprint B specs (`astronomy-provider`, `convention-center-declarations`, `qualification-harness`) | **32/32 pass** |
| Regression selection (16 pre-existing engine/unit spec groups: astrology, features, qualification-lab 100-subject corpus, celestial precision, panchang precision, professional kernel, trust conventions, kundli v40/v42/pipeline, security P0, workbench, evidence graph, failure resilience, timeline, book model) | **606 passed / 5 skipped** — identical outcomes to the pre-change baseline except the 32 new tests; the single failing spec (`kundli-v42/milan-route.spec.ts › MR-07`) fails **identically at baseline** in this sandbox: it requires a live Next.js server + PostgreSQL, neither of which this environment provides. Not touched by Sprint B. |
| `npm run qualify:astronomy` (100,000 scenarios) | `FAIL_WITH_ONLY_KNOWN_FINDINGS` (scaffold gate) — expected and documented; artifacts + certification doc regenerated. |

---

## 7. Assumptions Recorded

1. The production provider keeps the charter's `SwissEphemerisProvider` name; the descriptor truthfully discloses the actual kernel. Sprint C must either prove parity or formally re-name/re-declare.
2. Registry sunrise language ("centre of disc on local **apparent** horizon") and preset `TOPOCENTRIC_REFRACTED` describe the same adopted convention; the mapping is documented in `DECLARED_CONVENTIONS.SUNRISE_CONVENTION.notes`.
3. Ascendant tolerance is declared at 180″ (±0.05°) — no prior explicit value existed; it is now versioned in the tolerance model.
4. Scenario generation treats timezone/DST corners as *astronomy instants of interest*; full historical-timezone *resolution* remains Gate-1/Panchanga territory (Sprint E).
5. Rahu/Ketu golden rows are analytic (`SOURCE_SECONDARY`) until Swiss/JPL numeric verification in Sprint C.

## 8. Unresolved Problems (scheduled, not silent)

1. `AYANAMSHA_EPOCH_DECLARED_VS_IMPLEMENTED` (+14.53″) — the most consequential open item; blocks `EXTERNALLY_VERIFIED` claims.
2. MC not computed.
3. Moon far-future ΔT divergence band must be re-measured at Sprint C scale.
4. `JplReferenceProvider` is a fail-closed scaffold until the bulk Horizons adapter lands.
5. In this sandbox, Prisma engine binaries and Playwright browsers cannot be downloaded (network-restricted), so DB/browser-dependent e2e specs cannot run here; this is environmental and pre-exists Sprint B.

## 9. Sprint C Entry Criteria — MET

The harness can execute the full 100,000-scenario scale deterministically today (26 s, 0 aborts). Sprint C adds: bulk JPL retrieval, Swiss-parity adjudication, ayanamsha reconciliation (with scholar sign-off), MC implementation, and the certification upgrade of `astronomy-certification.md` from scaffold-gate to a real gate decision.
