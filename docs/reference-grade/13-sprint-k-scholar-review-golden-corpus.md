# Sprint K — Scholar Review (§19) + Golden Chart Corpus (§20)

**Status: COMPLETE.** The engine now has a permanent 107-chart regression corpus
covering every charter §20 category, and a practitioner review layer that
records human judgement **beside** computational truth — never over it.

## 1. §19 — Scholar Review System (`scholarReview.ts`, `scholar-review-1.0.0 (sprint K)`)

A qualified Pandit can inspect any evidence node and record exactly the five
charter verdicts — `AGREE / DISAGREE / PARTIALLY_AGREE /
ALTERNATIVE_INTERPRETATION / INSUFFICIENT_EVIDENCE` — together with reviewer ID,
timestamp, rule version, chart version, commentary, and (optionally) a cited
source with a mission-allowed status.

The cardinal invariant (charter: *"Never overwrite computational truth with
practitioner opinion. Store both."*) is enforced by construction:
- `ScholarReviewStore` only READS nodes; there is no API by which a review can
  touch an `EvidenceStore` (pinned byte-identical before/after in the gate spec).
- Every review anchors to `targetValueDigest` (sha256 of the node value AT
  REVIEW TIME). If the engine later changes that value, `assessFreshness`
  returns `VALUE_CHANGED` (also `NODE_MISSING`, `RULE_VERSION_DRIFT`) — the
  opinion stays stored but silently applying to a moved result is impossible.
- Append-only hash chain (`prevHash`/`recordHash`, CT_INV_008): any rewritten
  history breaks `verifyChain`.
- `reviewId` is content-addressed; identical review content → identical id.
- Fail-closed typed errors: `INVALID_VERDICT`, `REVIEWER_REQUIRED`,
  `COMMENTARY_REQUIRED` (every non-AGREE verdict demands a substantive note),
  `RULE_UNKNOWN`, `RULE_VERSION_MISMATCH` (against the LIVE registry),
  `SOURCE_STATUS_INVALID` (only the four mission statuses).
- Reviewer identity/credentials are RECORDED, never authenticated — provenance
  of human judgement, not authority (`DECLARED_REVIEWER_IDENTITY_UNVERIFIED`).
- **The scholar queue** (`scholarQueueFor`): derives exactly the charter flow
  from a compiled graph — yoga PRESENT verdicts (§15 strength =
  SCHOLAR_JUDGEMENT_REQUIRED), combustion borderline/scholar rows, and
  INDETERMINATE Kalsarpa — with existing review counts as visibility only.

## 2. §20 — Golden Chart Corpus (`GOLDEN_CHART_CORPUS_001`)

**107 charts**, deterministic seeded scan (`tools/build-golden-corpus.ts`,
seed `0x6c0d`, no timestamps), sha256
`052d6f88680880af7b54d683a2ca98202e8fb47d76f8c3960df7ec2895346205`,
tamper-evident on load.

| Category | Charts | Category | Charts |
|---|---|---|---|
| FOUNDER_REVIEWED | **1 (exactly one)** | COMBUSTION_EDGE | 12 |
| ORDINARY | 10 | RETROGRADE_CASE | 10 |
| SIGN_BOUNDARY | 10 | UNUSUAL_LATITUDE | 10 |
| NAKSHATRA_BOUNDARY | 8 | TIMEZONE_COMPLEXITY | 10 |
| VARGA_BOUNDARY | 10 | YOGA_EXAMPLE | 8 |
| DASHA_BOUNDARY | 10 | DOSHA_EXAMPLE | 8 |

The founder's reviewed chart (Patna 1995-06-15) appears as ONE regression
fixture carrying the charter caveat on its boundaryClaim — *"never as proof
that the engine works generally."*

Every chart stores the full §20 record: `input`, `normalizedInput`
(civil-UTC instant + dynamical Julian Day), `expected.astronomical` (ayanamsha,
ascendant, all 9 grahas at 1e-6°), `expected.derived` (nakshatra/pada, D9 moon,
first Vimshottari lord + balance, all 9 combustion rows, Kalsarpa, Manglik),
`tolerance`, `source` (ENGINE_DERIVED_REGRESSION → the astronomy kernel is
separately certified vs JPL DE441, Sprint C), and
`validationState: INTERNALLY_VERIFIED` — honest about its tier; externally
sourced chart rows are a later slice (`DECLARED_ENGINE_DERIVED_EXPECTATIONS`).

Boundary categories are genuinely on the edge: the builder only accepts a
chart when the computed facts sit within the claim window (sign edge ≤ 0.15°,
nakshatra edge ≤ 0.25°, D9 edge ≤ 0.12°, dasha balance ≤ 1.0 y, |sep − orb| ≤ 0.3°),
and the runner RE-VERIFIES each claim on replay.

## 3. Qualification — `npm run qualify:corpus` (strict, 107 charts)

Runner `golden-corpus-runner-1.0.0 (sprint K)`. **Verdict PASS — 0 violations.**

| Stream | Checks / violations | What it proves |
|--------|---------------------|----------------|
| A CORPUS_INTEGRITY | 122 / 0 | ≥100 charts, founder == 1, all 12 category minimums, every per-chart §20 field, validation states in tier set |
| B EXPECTATION_REPLAY | 3,317 / 0 | every chart rebuilt from its INPUT reproduces all expected facts within tolerance; boundaryClaims hold on replay; normalized inputs consistent |
| C INDEPENDENT_IDENTITY (§21) | 2,675 / 0 | independent rashi/nakshatra/pada/D9/Vimshottari/combustion/Kalsarpa reimplementations (written from the classical tables + registry text) agree with the engine from the pinned longitudes alone |
| D SCHOLAR_REVIEW_LAYER (§19) | 19 / 0 | truth-untouched, fail-closed validation, chain tamper-evidence, content-addressed ids, freshness, queue derivation |
| Determinism | 1 / 0 | founder replay byte-stable |

Declared findings (NON_BLOCKING): `DECLARED_ENGINE_DERIVED_EXPECTATIONS`,
`DECLARED_REVIEW_PERSISTENCE_IN_MEMORY`, `DECLARED_REVIEWER_IDENTITY_UNVERIFIED`.

**Harness lessons recorded honestly** (the reason §21 exists): the first strict
run failed on (a) charts whose stored UTC instant was derived from the
DYNAMICAL Julian Day — JD carries ΔT (~30–70 s); normalization now comes from
the civil input and the corpus pins the TT-based JD as-is rather than hiding
the ΔT relation; and (b) the independent degree check demanding 1e-6 against
`degreeInRasi`, which is a display field rounded to 2 dp (raw
`siderealLongitude` comparisons stay at 1e-6°). Both were harness-side; no
engine defect surfaced in stream B/C across 107 charts.

## 4. Gate spec

`tests/scholar-qualification.spec.ts` — **18 tests**, all passing: corpus pins +
tamper evidence, charter coverage minimums, full per-chart §20 record, founder-
singleton caveat, founder replay, combustion-edge replay, §21 spot identities,
and the complete §19 invariant suite (including CT_INV_005 truth-untouched).

## 5. Artifacts

- `src/lib/jyotish/scholarReview.ts` — §19 review layer + queue
- `qualification/fixtures/golden-chart-corpus.json` — `GOLDEN_CHART_CORPUS_001`
- `qualification/golden-corpus-qualification-runner.ts` — streams A–D + CLI
- `tools/build-golden-corpus.ts` — deterministic corpus builder
- `qualification/golden-corpus-summary.json`, `qualification/golden-corpus-failures.json` — committed strict artifacts
- `tests/scholar-qualification.spec.ts` — gate spec (18/18)
- npm: `qualify:corpus` (strict) / `qualify:corpus:scaffold`
