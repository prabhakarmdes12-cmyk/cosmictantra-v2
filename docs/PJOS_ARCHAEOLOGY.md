# PJOS Archaeology — Regenerated (post-reconciliation)

**Status:** REGENERATED per CT-PJOS-00R R0.5. This document supersedes the Phase 0
version committed at `920c002` (pre-reconciliation). All classifications below were
verified against the consolidated tree, not against the pre-merge arena snapshot.

- **Regenerated on branch:** `arena/01a04fb8-cosmictantra-v2`
- **Tree state:** merge `2e27a8d` (origin/main `f39d4cc` + arena `920c002`) + security commit `e8b9e1b`
- **Baseline:** `npx tsc --noEmit` clean; **293/293** Playwright tests passing (278 mainline + 15 `tests/security-p0-regression.spec.ts`)
- **Pre-merge safety tag:** `pjos-pre-reconciliation` @ `920c002`

---

## 1. Reconciliation ledger (R0.1–R0.4)

| Step | Result |
|---|---|
| R0.1 Provenance | Clone unshallowed; **MERGE_BASE = `dea921719bcb05e391c29e820f22ea1de2778ae7`** (∈ origin/main history). Arena was +1 commit (`920c002`), mainline was **+111 commits** ahead. |
| R0.2 | Module table in §2. |
| R0.3 Branches | No new branches created; all work on the session branch. |
| R0.4 Merge | Tag `pjos-pre-reconciliation` @ `920c002` → clean merge of `f39d4cc` → **`2e27a8d`** (341 files, +80001/−2140). Post-merge full regression: 278/278 green. |
| R0.5 | This document. |

**Missing-modules resolution:** every module flagged as "absent on arena" in the Phase 0
audit (Professional Jyotish Kernel, Kashi Sahayak gate, Master Kundli specimen,
Consultation-v1, Trust-First program) **existed in mainline and was recovered by the
merge — nothing was re-implemented.** `REIMPLEMENT` was not needed for any module.

## 2. R0.2 — Module × lineage × action table

Other branches: none relevant (only `origin/main` + arena session branches; no divergent
feature branches exist). "Current arena" below = state on the session branch after merge.

| Module | Current arena (post-merge) | Origin main last commit | Latest commit | Recommended action |
|---|---|---|---|---|
| Celestial engine (`src/lib/jyotish/celestialEngine.ts`, astronomy-engine VSOP87/ELP2000) | single ephemeris source; feeds `lib/astrologyEngine.js` + `lib/panchang.js` | `0edf7c0` (2026-08-30, build/type fix) | `0edf7c0` | **KEEP_ARENA** + **PORT_INTERFACE**: add D-2 provider metadata (engineVersion, referenceFrame, coordinateContract, aberrationMode, precessionModel, nodeMode) — no math change |
| Panchang (`src/lib/panchang.js` canonical; `src/engines/panchang.js` deprecated bridge + `panchang.legacy.js`) | canonical deterministic rashi→masa; `udayaTithi` (AT_LOCAL_SUNRISE) vs `instantaneousTithi` (AT_INSTANT) already split in `canonicalSnapshot.birthPanchang` | `f39d4cc` (2026-08-30) | `f39d4cc` | **KEEP_ARENA**. Legacy bridge retained as LEGACY_ADAPTER for differential suite |
| Dasha (`src/lib/dashaEngine.js`; `src/engines/dashaEngine.legacy.js`) | canonical; fed moon longitude from celestial ephemeris via `canonicalSnapshot` | `0edf7c0` (last touch) | `0edf7c0` | **KEEP_ARENA** + Phase-1 refactor: 365.25-day year math (L46/61/73) and missing tradition/calculationVersion metadata violate D-2 `yearLengthConvention`; differential-test vs `dashaEngine.legacy.js` before touching any pinned date |
| Kundli calc (`src/lib/astrologyEngine.js`) | now consumes `calculateCelestialEphemeris` (imports L1/L289) — no native astronomy left | `b125699` (2026-08-30, Kernel Release 1) | `b125699` | **KEEP_ARENA** |
| Varga (`vargaEngine.ts`, shodashavarga D1–D60) | kernel engine, in canonical snapshot | `b125699` | `b125699` | **KEEP_ARENA** |
| Ashtakavarga (`ashtakavargaEngine.ts`) | kernel engine (old `.js` duplicate consolidated upstream) | `6650724` (Master Kundli V1) | `6650724` | **KEEP_ARENA** |
| Jaimini (`jaiminiEngine.ts`) | kernel engine | `6650724` | `6650724` | **KEEP_ARENA** |
| KP (`kpEngine.ts`) | kernel engine | `6650724` | `6650724` | **KEEP_ARENA** |
| Bala (`balaEngine.ts`) | kernel engine | `b125699` | `b125699` | **KEEP_ARENA** |
| Relationship (`relationshipEngine.ts`, `kundaliMilan.js`) | kernel engine + legacy consumer | `b125699` | `b125699` | **KEEP_ARENA** |
| Varshaphala / Avakhada / Timeline | kernel engines | `6650724` / `6650724` / `296b77a` | same | **KEEP_ARENA** |
| Interpretation (`src/lib/interpretationEngine.ts`) | daily/weekly/monthly/yearly/family | mainline-trusted program series | `296b77a` | **KEEP_ARENA** |
| Consultation OS (`src/lib/sabha/`, `/api/consultations`, `/api/astrology`, `/api/leads`) | pre-fix had SEC-P0-001/002 defects → **closed in `e8b9e1b`** (admin+assignment authz, anonymous list = stats-only, rate limits, ChatBox removed) | `8f63f9f` (consultation-v1, 2026-08-29), build `0edf7c0` | `e8b9e1b` (arena security commit) | **KEEP_ARENA** — arena state is now strictly stronger than mainline |
| AI Gateway / Kashi Sahayak (`src/lib/ai/`) | qualification gate, canonical intents, safety router, 4-tier provenance, 150-prompt corpus; deterministic tool executor (`VEDIC_TOOLS`) | `687df09` (2026-08-28) | `687df09` | **KEEP_ARENA** |
| Kernel core (`src/lib/jyotish/` — canonicalSnapshot, kashiOrchestrator, qualificationLab, conventionCenter, contradictionDetector, kundliBookModel, ayanamsha) | all 19 files mainline-origin; `EvidenceItem` + `EVIDENCE_BACKED\|INSUFFICIENT_CALCULATION_EVIDENCE` = seed of the PJOS EvidenceGraph | `f39d4cc` (last kernel touch) | `f39d4cc` | **KEEP_ARENA** — mainline's own dependency-graph roadmap names "Evidence Layer: Jyotish Evidence Graph (Immutable Node IDs)" as the next layer above this snapshot; PJOS-01 builds exactly there |
| Persistence (`prisma/schema.prisma`, `kundliStore.ts`, `outcomeMemory.ts`) | Prisma has profile/family/OTP/service/consultation/audit models; **kundli + outcome stores are in-memory Maps with 5 preset specimens; no Evidence/Prediction/Person/AccessGrant/ConsentRecord tables** | `6650724` (schema for Master Kundli specimen) | `6650724` | **BUILD (PJOS-01-DOMAIN)** — genuinely absent; not a re-implementation of lost work |
| Identity / access (`src/lib/auth.ts`, `/api/profile`, OTP, `/api/payments`) | OTP request/verify (hashed, attempt-capped), customer profile w/ DPDP consent + soft-delete, HMAC payment webhook; no Account/Person/AccessGrant split | `1531207` (2026-08-24) | `e8b9e1b` (arena hardening) | **KEEP_ARENA** + extend per D-1 (Account ≠ Person, AccessGrant, ConsentRecord, sensitivity tags, ownership invariant) |
| Workbench UI (`/workbench`, `/observatory`, `/kundli/[id]`) | Trust-First program TRUST-01…10 complete; professional workbench | `296b77a` | `296b77a` | **KEEP_ARENA** — Phase 1 adds `/kundli/[id]/explore` + `/kundli/[id]/time` over the same truth |
| Pandit UI (`/pandit/workspace` v1/v2, `/astrology/cases`, `/consultation/room`) | consultation-v1 deployment-qualified (HMAC, locks, RBAC) + operator-access banners (`e8b9e1b`) | `8f63f9f` | `e8b9e1b` | **KEEP_ARENA** |
| Daily surfaces (`/daily`, `/morning-digest`, `/sandhya`) | panchang-driven; **no hardcoded 06:00/18:00 constants remain** (verified by grep; fixed upstream in `f39d4cc`) | `f39d4cc` | `f39d4cc` | **KEEP_ARENA** |
| Tests (`tests/`, ~50 specs) | 278 mainline (JPL 7000-pt, golden-kundli, differential dasha/panchang, kernel release-1, sabha, kashi corpus, security-red-team kernel-level) + 15 arena security regression | `f39d4cc` | `e8b9e1b` | **KEEP_ARENA** |
| Legacy adapters (`src/engines/panchang.legacy.js`, `dashaEngine.legacy.js`, `reportGenerator.js`, `guruAI.js`) | DEPRECATED BRIDGE policy, retained for differential verification | mainline-introduced | mainline-introduced | **KEEP as LEGACY_ADAPTER** — `DELETE_AFTER_PARITY` only after differential tests prove migration behavior (standing policy; never delete first) |

## 3. R0.5 — Six-category classification (consolidated tree)

| Category | Modules |
|---|---|
| **PRESENT_AND_REUSABLE** | Celestial engine (JPL 7000-pt vs Horizons DE441, 1850–2050: Sun mean 0.82″/max 4.32″; Moon mean 8.19″/max 47.37″; planets 1.7–3.2″ — `docs/JPL_BENCHMARK_EVIDENCE.md`); Panchang (deterministic, both temporal semantics); Kundli calc (single ephemeris); Varga/AVK/Jaimini/KP/Bala/Varshaphala/Avakhada/Timeline engines; Interpretation; AI Gateway (150-prompt corpus); Consultation OS (post `e8b9e1b`); Workbench + Pandit UI; daily surfaces; test corpus |
| **PRESENT_BUT_NEEDS_REFACTOR** | Dasha (365.25-day years; no tradition/calculationVersion/yearLengthConvention metadata — D-2 gap; legacy adapter exists for differential tests); Celestial provider metadata (D-2 named fields absent — PORT_INTERFACE, zero math change); House-system ids (registry uses `EQUAL_SIGN_SYSTEM`; D-2 requires explicit `WHOLE_SIGN_RASHI` / `EQUAL_FROM_ASCENDANT_DEGREE` / `BHAVA_CHALIT` / `PLACIDUS_KP` — naming normalization); Identity (D-1 model split absent); Daily personalization (state assembly for My Panchang / Cosmic Now→Me not yet a single `DailyJyotishState`) |
| **DUPLICATED** | Legacy bridge family only (`src/engines/*.legacy.js` + deprecated bridges) — managed under CANONICAL/LEGACY_ADAPTER policy, differential-tested (`tests/differential/`); **no unmanaged duplicate calculators remain** — the pre-merge audit's duplicate `.js` calculator families were consolidated upstream into `src/lib/jyotish/` |
| **BROKEN** | None remaining. (Pre-fix: SEC-P0-001 unauthenticated case review, SEC-P0-002 anonymous consultation PII/case-id enumeration, fabricated `ChatBox.tsx` — all closed in `e8b9e1b`, pinned by 15 regression tests.) |
| **ABSENT** (PJOS-01-DOMAIN deltas) | EvidenceGraph (+traceDependencies) — `kashiOrchestrator.EvidenceItem` is the seed; immutable PredictionRecord ledger — `outcomeMemory` is in-memory only; Person/Account/AccessGrant/ConsentRecord models; server-side persistence for kundli/outcome (currently in-memory Maps + 5 presets); ownership-invariant enforcement (resource → personId → grant, before read/mutation); Time Explorer / deterministic future-window search; birth-time sensitivity analysis; Why-graph; uncertainty model; explainable notifications |
| **UNQUALIFIED** | Muhurta (`muhuratData.js` + `/muhurat/personalized` — data-driven, no full muhurta algorithm lineage yet); Prashna (absent); external golden references (0 external-reference tests; all 10 kundli + 20 panchang fixtures are SELF_REFERENTIAL regression pins per `docs/GOLDEN_CORPUS_PROVENANCE_AUDIT.md`) |

## 4. Evidence pointers

- `docs/JPL_BENCHMARK_EVIDENCE.md` + `docs/jpl_benchmark_7000.csv` — independent DE441 benchmark
- `docs/GOLDEN_CORPUS_PROVENANCE_AUDIT.md` — fixture provenance + reclassification policy
- `docs/JYOTISH_CONVENTION_REGISTRY.md` — LAHIRI_CHITRA_PAKSHA, MEAN_NODE, house ids (naming gap vs D-2 noted in §3)
- `docs/D9_RULE_AUDIT.md`, `docs/JYOTISH_ENGINE_DEPENDENCY_GRAPH.md`, `docs/PROFESSIONAL_JYOTISH_KERNEL_PLAN.md`, `KASHI-SAHAYAK-QUALIFICATION.md`
- **Stale (historical only, do not cite for current state):** `docs/jyotish/*` (baseline era), `docs/ASTRONOMY_ALGORITHM_AUDIT.md` (describes the superseded native Newcomb/Brown math; live pipeline is `astronomy-engine` via `celestialEngine.ts`)
- Pre-merge repo hygiene (pre-existing, carried over from mainline): `test-results/` run artifacts were committed; future runs kept out via this regenerated audit's recommendation (gitignore) — new artifacts not re-committed in `e8b9e1b`

## 5. Phase 1 readiness

`SAFE_TO_BEGIN_PJOS_01_DOMAIN = YES`

1. Provenance proven from git history (R0.1); no module recreated (R0.4 recovery complete).
2. Canonical engines recovered and single-sourced; benchmarked against JPL (independent).
3. Known gaps are precisely scoped (Dasha year-length, provider metadata, house ids, D-1 persistence/identity, ABSENT list) — all are *additions or naming/refactors*, not rewrites.
4. Security P0 closed and regression-pinned (293/293).
5. Every "do not do" from the owner decisions (D-1/D-2, golden-test policy, duplicate-engine policy, no-fake-Kashi, no-fear-Dosha-UX) is traceable to a section of this document.
