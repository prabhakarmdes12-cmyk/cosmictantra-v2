# Sprint L — Varshaphala / Tajika (annual chart) honest rebuild

**Status: COMPLETE.** The Varshaphala engine is now computed, sourced and
fail-closed. Sprint L began as a qualification sprint and became an **audit
remediation**: the pre-existing `varshaphalaEngine.ts` fabricated its headline
outputs, and those fabrications were live in every canonical snapshot.

## 1. The audit (why this sprint exists)

| Pre-Sprint-L behaviour | Verdict |
|---|---|
| `varsheshwar` hardcoded to **"Venus, 462.5 virupas"** for every chart | FABRICATED (CT_INV_001/010) — withdrawn |
| `solarReturnUtc` = the literal string `${targetYear}-05-26T01:48:12Z` | FABRICATED — withdrawn |
| Sahams = invented constant offsets from the natal Sun, with rashi/degree strings that did not match their own computed longitudes | FABRICATED (CT_INV_002) — withdrawn, queued for an honest implementation |
| The snapshot caller passed a degree-in-rashi value where a full longitude was required, and a hardcoded year 2026 | Wiring defect — fixed |
| Muntha arithmetic (one rashi per year from the janma lagna) | Sound — kept, hardened, registered |

All three fabrications are now **pinned against permanently**: stream A of the
qualification scans the module's *executable* lines (comments documenting the
withdrawal are allowed; code is not) and the output shape itself is pinned
(`balaVirupas === Σ PV components`, `hadda === null`, Sahams empty with the
withdrawal reason).

## 2. What is now computed

- **Solar return (RULE_VARSHA_SOLAR_RETURN)** — the instant the *sidereal* Sun
  returns to its natal sidereal longitude, solved by 6-hour bracket scan +
  bisection to ≤ 0.5 s on the Sprint-C JPL-certified kernel. A lean
  sidereal-sun primitive mirrors the kernel exactly (pinned ≤ 1e-9° identical).
- **Muntha (RULE_MUNTHA_PROGRESSION)** — advances one rashi at each
  varshapravesha from the janma lagna; house readings reported from BOTH the
  annual and the natal lagna.
- **Panchavargeeyabala (RULE_TAJIKA_PANCHAVARGEEYA_BALA)** — over the ANNUAL
  positions, per Raman ch. 3: Kshetra 30/15/7.5 by natural friendship,
  Ochcha = arc-from-debilitation/180 × 20 (deep exaltation table), Drekkana
  10/5/2.5 with **trinal** lords, Navamsa 5/2.5/1.25 with the element scheme.
  **Haddabala is NOT_CALCULATED** — the Hadda tables exist only as images in
  the available sources — so the total is a declared PARTIAL PV, used
  uniformly for ranking (`DECLARED_HADDA_TABLE_UNAVAILABLE`). The neutral
  maitri tier scores the declared midpoint interpolation
  (ATTRIBUTION_UNVERIFIED).
- **Varsheshwar (RULE_VARSHESHWAR_SELECTION)** — the five classical portfolios
  (Dina-Ratri by the Sun/Moon sign at the return, Janma-lagna lord,
  Varsha-lagna lord, Muntha lord, Thrirasi by the day/night element tables).
  ADOPTED deterministic reading: a candidate qualifies by a favourable/sama
  Tajika sign-class aspect to the varsha lagna (houses 2,3,5,9,11,12); the
  highest partial PV wins; ties break by portfolio count then order; if none
  qualifies, the **Muntha lord fallback** fires (attested). Both Thrirasi
  readings are computed — Raman's own worked example contradicts his element
  day-table for Makara — and `readingSensitive` flags charts where the two
  readings pick different Year Lords.

### Declared disagreements (visible on every result)
Raman's interpretive "powerful aspect" (Deeptamsha-orb) filter — declared, not
mechanically reproducible; the Charak drekkana-scheme variant; the "the Moon
can never be Year Lord" exclusion — not adopted; Hadda gap; Sahams queued.
Fail-closed: `TARGET_PRE_BIRTH`, `AGE_OUT_OF_RANGE`, and polar charts
(`POLAR_DAY_NIGHT_UNRESOLVED`) refuse to fabricate.

## 3. Qualification — `npm run qualify:varshaphala` (strict 400)

Fixture `VARSHAPHALA_TAJIKA_001` (sha `e4b60635d7aa6c42…`, 7 golden scenarios:
DAY/NIGHT, reading-sensitive, Muntha-fallback, multi-portfolio, plain anchors).
Runner `varshaphala-runner-1.0.0 (sprint L)`. **Verdict PASS — 0 violations.**

| Stream | Checks / violations | What it proves |
|--------|---------------------|----------------|
| A AUDIT_PINS | 16 / 0 | the fabrications are gone from executable code; registry rows honest; output shape derived |
| B SOLAR_RETURN | 1,601 / 0 | engine vs independent Newton/secant solver ≤ 2 s on 400 charts; residual ≤ 1e-5°; spacing ∈ [363, 367] d; lean primitive ≡ kernel (40/40) |
| C ANNUAL_STRUCTURE | 5,200 / 0 | Muntha arithmetic identity; annual lagna/planets ≡ kernel; day/night ≡ independent SearchRiseSet verdict; PV bounds + sum identity |
| D SELECTION_IDENTITY | 2,003 / 0 | independent reimplementation of the adopted selection agrees on every scenario (lord, PV, eligibility, portfolios); typed fail-closed errors; polar honesty |
| GOLDEN_REPLAY | 49 / 0 | the pinned scenarios reproduce exactly |
| Determinism | 3 / 0 | byte-equal double compute |

Gate spec `tests/varshaphala-qualification.spec.ts` — **18/18**.
Declared findings (NON_BLOCKING): `DECLARED_HADDA_TABLE_UNAVAILABLE`,
`DECLARED_THRIRASI_RAMAN_DISCREPANCY`, `DECLARED_ASPECT_SIGN_CLASS_READING`,
`DECLARED_SAHAMS_QUEUED`, `DECLARED_ENGINE_DERIVED_GOLDENS`.

## 4. Ripple effects handled

Adding the four Tajika rules moved the registry 59 → 63: rule-registry fixtures
rebuilt (`d849fe40…`), why-graph fixtures rebuilt (`98c67330…`), yoga fixtures
rebuilt (`e041fcfc…` — the yoga stream A pins the registry fingerprint), and
the Sprint-H spec's rule-count pins updated. `qualify:registry` (63 rules),
`qualify:yoga` and `qualify:why` all re-run PASS at scale.

## 5. Artifacts

- `src/lib/jyotish/varshaphalaEngine.ts` — `varshaphala-engine-2.0.0 (sprint L, honest rebuild)`
- `qualification/fixtures/varshaphala-fixtures.json` — `VARSHAPHALA_TAJIKA_001`
- `qualification/varshaphala-qualification-runner.ts` — streams A–D + golden replay + CLI
- `qualification/varshaphala-summary.json`, `qualification/varshaphala-failures.json` — committed strict artifacts
- `tools/build-varshaphala-fixtures.ts` — deterministic fixture builder
- `tests/varshaphala-qualification.spec.ts` — gate spec (18/18)
- npm: `qualify:varshaphala` (strict 400) / `qualify:varshaphala:scaffold`

**Queued from this sprint**: Sahams (day/night formulas), Hadda tables (need a
machine-readable source), Tajika aspects/yogas (Ithasala et al.), Varsha Dasa,
Mudda Dasha, annual-chart evidence nodes, externally-published varsha anchors.
