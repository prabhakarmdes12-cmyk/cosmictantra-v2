# CosmicTantra Master Kundli V40 — Pandit Workbench Edition
## Final rollout report

Branch `arena/01a05d51-cosmictantra-v2`. Golden chart
PRIYA_GAJA_KESARI_NEGATIVE, report `CT-KUNDLI-31346AC701E0CFD5`.

---

## 1. What shipped

| Layer | Artifact |
|---|---|
| Derivation | `src/lib/kundli/v40/` — 16 modules, `kundli-derived-v1` |
| Report model | `reportModelV2.ts` — `kundli-report-v2`, 25 sections (14 Part A, 11 Part B) |
| Design system | `tokens.ts` — `KundliPdfTokens` |
| Renderer | `rendererV2.ts` — 15 block kinds, mixed-script text engine, vector status marks |
| Pipeline | `pipelineV2.ts` — 9 gates, `generateKundliV40Pdf` |
| Tests | `tests/kundli-v40/` — 13 tests, all passing |
| Docs | `docs/kundli-v40/01..10`, this report, `forensic/v40-current-architecture.md`, `forensic/shadbala-validation.md` |
| Artifact | `artifacts/kundli-v40/priya-1995-v40-pandit-workbench.pdf` — 34 pages, Part A = 16 |

v1 is untouched and still green. `kundli-calc-v1` was **not** bumped, because
no calculation changed.

---

## 2. Invariants

| Invariant | How it is enforced | Verified by |
|---|---|---|
| **INV_001** astronomical truth is immutable; renderers never recalculate | `rendererV2.ts` imports no astrology module; the derived layer reads the canonical model and writes nothing back | code structure + `derived-model.spec.ts` chart-identity test |
| **INV_002** fact / rule / interpretation are separate typed objects | `ContentType` on every block and every claim | `contentTypes.ts`; every block constructor takes it |
| **INV_003** zero false yoga | verdicts come from the yoga engine unchanged; `resolveStatus` semantics untouched; NOT_CALCULATED never becomes ABSENT | golden fixture asserts Gaja-Kesari ABSENT, Budhaditya/Malavya PRESENT |
| **INV_004** no silent tradition mixing | `system` on every rule and every claim; `MIXED_DECLARED` exists so mixing must be declared; aspect policy printed | appendix B5 prints the policy and the unadopted variants |
| **INV_005** no unsupported prediction | banned-phrase scan over the whole model **before** rendering (gate 4b); `explicitlyNotClaimed` mandatory | `pdf-artifact.spec.ts` asserts zero findings |
| **INV_006** full traceability | evidence ids are canonical fact paths; content hash excludes the timestamp | `derived-model.spec.ts` resolves every emitted id |

---

## 3. Release gate checklist (§42)

| # | Gate | State | Evidence |
|---|---|---|---|
| 1 | Forensic audit complete, defects registered | **PASS** | `forensic/v40-current-architecture.md`, V40-D01..D10 |
| 2 | Astronomical kernel unmodified | **PASS** | no diff under `src/lib/astrologyEngine.js`, `panchang.js`, `dashaEngine.js`, `src/lib/jyotish/` |
| 3 | v1 preserved as reference renderer | **PASS** | `pdf-artifact.spec.ts` runs v1 to `READY_FOR_DELIVERY` |
| 4 | New model introduced as v2, not a mutation of v1 | **PASS** | `kundli-report-v2` alongside `kundli-report-v1` |
| 5 | Every content object typed | **PASS** | `ContentType` on all blocks and claims |
| 6 | NOT_CALCULATED never converted to ABSENT | **PASS** | Saar and dashboard keep unresolved rules as NOT_CALCULATED with reasons |
| 7 | Shadbala not exposed until validated | **PASS** | `forensic/shadbala-validation.md`; appendix B7 prints "validation pending"; capability flag bars it mechanically |
| 8 | Only D1 and D9 presented as charts | **PASS** | `ChartDivision` still `1 \| 9`; D10 appears only as a validation table |
| 9 | D10 validated against an independent implementation | **PASS** | 10/10 agreement, `allAgree === true` |
| 10 | D10 still quarantined pending an external reference | **PASS** | `mayInfluenceConclusions: false`; listed as a missing career factor |
| 11 | Every emitted evidence id resolves | **PASS** | acceptance test, > 20 distinct paths, zero unresolved |
| 12 | Deterministic content hash excluding the timestamp | **PASS** | two runs → identical hash, different `generatedAt` |
| 13 | Design tokens; no magic numbers in the renderer | **PASS** | `KundliPdfTokens` |
| 14 | A4 print-safe; status never colour-only | **PASS** | vector status marks + the word printed beside each |
| 15 | Selectable Unicode text on every page | **PASS** | text-layer extraction, > 20 chars per page |
| 16 | Zero blank pages, page ceiling respected | **PASS** | gate 4 PASS, 0 blank, 34 ≤ 40 |
| 17 | Part A remains consultable | **PASS** | Part A ends at page 16 |
| 18 | Bilingual labels | **PASS** | `labels.ts`; Devanagari section subtitles throughout |
| 19 | No prediction language in the artifact | **PASS** | banned-phrase scan, zero findings |
| 20 | No hardcoded fixture content outside fixtures | **PASS** | grep test over `src/lib/kundli/v40/` for `Priya` / `Sharma` / `1995-06-15` |
| 21 | Existing regression fixtures preserved | **PASS** | nothing under `tests/kundli-pipeline/` modified |
| 22 | Golden Priya chart is a permanent validation case | **PASS** | `tests/kundli-v40/goldenCanonical.ts` |
| 23 | Devanagari renders correctly | **FAIL (documented)** | text layer correct; **glyph shaping is not** — see §6 |
| 24 | External-reference validation for D10 and shadbala | **BLOCKED** | no network access to a licensed product in this environment |
| 25 | Corpus run through the V40 pipeline | **NOT DONE** | corpus runner still points at v1 |

**21 pass, 1 fail, 1 blocked, 2 not done.** V40 is not production-ready, and
this report does not claim it is.

---

## 4. Three success tests (§43)

### Client — five-minute comprehension
Pages 1–5 answer, without jargon and without a second document: who this chart
belongs to, what the calculation settings were, the lagna / rashi / nakshatra,
the current dasha, the configurations found and not found, and the two charts.
The Saar page carries eight structural highlights in plain sentences.
**Assessment: passes.** A client can stop at page 5 and know what was computed.

### Practising Pandit — consult from pages 2–12 without another app
Passport (inputs), Saar (snapshot), D1 and D9 (drawn), Graha dossier (position,
nakshatra, pada, dignity, motion, combustion, vargottama, functional role,
conjunctions and drishti in both directions), Bhava matrix (twelve bhavas with
sign, lord, lord placement, occupants, drishti, karakas and a sentence each),
Yoga/Dosha dashboard, Vimshottari with a precise birth balance, activation
profile with ruled note space, career synthesis, discussion prompts.
**Assessment: passes**, with the caveat in §6 for a Pandit reading the Hindi
labels rather than the English.

### Scholar / auditor — break a claim
Take any career conclusion → the factor tables list the evidence path for every
claim → the path resolves in the canonical chart (machine-verified) →
appendix B4 gives the six-decimal longitude → B1 gives the placement hash,
content hash and every engine version → the Passport gives the settings that
produced them. The rule behind any yoga verdict is in B2 with its requirement,
observed values, unadopted variants and unverified locator. The aspect policy
is declared in B5, including the variants deliberately not adopted.
**Assessment: passes.** The report is auditable end to end, and it is candid
about what has not been checked.

---

## 5. Metrics: v1 → V40

| Metric | v1 | V40 |
|---|---|---|
| Pages | 19 | 34 (Part A 16, Part B 18) |
| Sections | 33 | 25 |
| Block kinds | 5 | 15 |
| Charts | D1, D9 | D1, D9 (D10 as a validation table) |
| Bhava analysis | none | 12-bhava matrix + per-bhava statements |
| Graha condition | positions and dignity | full record incl. combustion, war, vargottama, functional role, drishti |
| Interpretive domains | none synthesised | career, evidence-linked |
| Dasha balance precision | "5.0 years" | 5y 0m 4d (5.012356 y), cross-checked to within one day |
| Blank pages | 0 | 0 |

---

## 6. Known defects and open work

1. **Devanagari glyph shaping (highest priority).** jsPDF has no complex-text
   layout, so pre-base matras render in logical order — `सिंह` draws with the
   `ि` after the `स`. The **text layer is correct** (extraction, search and
   copy-paste all return the right Unicode), but the printed Hindi is
   misshapen for words with pre-base matras. Fix: add a shaping pass
   (HarfBuzz/opentype.js) or render Devanagari as vector paths. Until then the
   English labels are authoritative and the Hindi is decorative.
2. **No external reference for D10 or shadbala.** Both remain quarantined.
   Checklists in `docs/kundli-v40/07-d10-validation.md` and
   `forensic/shadbala-validation.md`.
3. **Corpus not yet run through V40.** Only the golden chart is exercised.
4. **No visual-diff baseline.** No rasteriser in CI.
5. **`/verify/:reportId` not built.** The certificate lists the four values a
   verifier compares; no QR code is printed, deliberately.
6. **Only career is synthesised.** Marriage, health, finance, progeny and
   litigation are not, and the report says so.
7. **The V40 pipeline is not wired to the app.** `MasterKundliReportClient.tsx`
   still calls `generateKundliPdf` (v1). Switching it over is a one-line change
   that should wait for items 1 and 3.

---

## 7. Recommendation

Ship V40 to an internal Pandit review in **English**, using the artifact in
`artifacts/kundli-v40/`, with the Hindi labels flagged as provisional. Do not
switch the public report path to V40 until the Devanagari shaping defect is
fixed and the corpus has been run. Nothing in this build should be described as
production-ready on the strength of how the PDF looks; the release gate above
is the standard, and four of its rows are not green.
