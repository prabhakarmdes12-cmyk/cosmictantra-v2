# CosmicTantra Master Kundli — Scholar Edition: capability matrix

**Date:** 2026-09-01 · **Branch:** `arena/01a0593a-cosmictantra-v2` · **Base commit:** `b651bd7` (confirmed ancestor of HEAD)
**Machine-readable form:** [`scholar-kundli/capability-matrix.json`](./scholar-kundli/capability-matrix.json)

This matrix is Phase 1 of the Scholar Kundli mission: verified reality **before** any code change.
Every row cites the file and line inspected. Labels:

| Label | Meaning |
| --- | --- |
| `IMPLEMENTED_AND_TESTED` | Code exists **and** an executable test asserts it. |
| `IMPLEMENTED_NOT_E2E_TESTED` | Code exists; no end-to-end/visual proof yet (unit or none). |
| `PARTIAL` | Something exists but is incomplete, unsurfaced, or carries a correctness caveat. |
| `MISSING` | No implementation found. |
| `BLOCKED_BY_SOURCE_OR_DECISION` | Needs licensed source content, an owner decision, or an unavailable environment. |

Documentation, interfaces, schemas and fixtures are **not** counted as capability.

---

## 0. Reality checks performed

| Check | Result |
| --- | --- |
| HEAD based on `b651bd7` | **CONFIRMED** — `b651bd7` is main's merge of this branch; branch fast-forwarded onto it (no rewrite, no new branch — this session is pinned to `arena/01a0593a-cosmictantra-v2`) |
| `docs/kundli/` directory | **DOES NOT EXIST** — Kundli/Jyotish docs live at `docs/KUNDLI_*.md`, `docs/jyotish/*`, `docs/JYOTISH*.md`, `docs/D9_RULE_AUDIT.md`, `docs/PARASHARA_LIGHT_PARITY_MATRIX.md`, `docs/ASTROSAGE_REPORT_COVERAGE_MATRIX.md` |
| "Scholar Edition" specification in repo | **NOT FOUND** — `grep -ril "scholar edition" docs/ src/` returns nothing. §2 of the mission brief is the de-facto spec; owner confirmation needed |
| `maxPages` safeguard | `40` at `src/lib/kundli/config.ts:27`, enforced by `layoutEngine.ts:83-86` (`KUNDLI_PAGE_LIMIT_EXCEEDED`). **Not raised** |
| `PRIYA-1995-GK-NEGATIVE` fixture | **DOES NOT EXIST** — `grep -rl "PRIYA-1995-GK-NEGATIVE" tests/ src/` → no hits. Must be created |
| Runtime contradiction gate | **ABSENT** — `validateCrossSurfaceConsistency` (`src/lib/jyotish/contradictionDetector.ts`) is called only from tests (`tests/kashi-orchestrator-contradiction.spec.ts`, `tests/report-consistency-prabhakar.spec.ts`, `tests/personas-adversarial-walkthrough.spec.ts`). Never from `src/lib/kundli/*` |

---

## 1. Scholar report content (mission §2)

| ID | Requirement | Code evidence | Test evidence | Label |
| --- | --- | --- | --- | --- |
| S01 | Premium cover & report identity | `reportModel.ts:48` Cover; Ganesh + CosmicTantra emblem via `renderAssets.ts`, `renderer.ts` | `tests/incident/pdf-preview.spec.ts`, `tests/incident/hindi-artifact.spec.ts` | `IMPLEMENTED_NOT_E2E_TESTED` |
| S02 | Birth-data passport (name, date, exact local time, TZ, coordinates, location, ayanamsha, engine/version) | Name/date/time/place/lat/lon/provenance/TZ/UTC at `reportModel.ts:73-88`; ayanamsha + engine version at `reportModel.ts:93-113` | `tests/kundli-pipeline/invariants.spec.ts` (INV_004/005/006) | `PARTIAL` — all values exist but are split across two sections; not one consolidated passport; "exact local time" is the input string, local/UTC pairing present |
| S03 | At-a-glance chart summary (lagna, moon, nakshatra, current dasha in one block) | none found | none | `MISSING` |
| S04 | D1/Rashi chart | `reportModel.ts:169` `Rashi Chart (D1)`; web SVG `src/components/NorthIndianChart.tsx` | `tests/single-flow-kundli.spec.ts`, `tests/mobile-clickability.spec.ts` | `PARTIAL` — web chart verified; PDF chart block rendering not visually inspected this increment |
| S05 | Bhava–Graha matrix | `reportModel.ts:160-162` table `['House','Sign','Planets']` | `invariants.spec.ts` (INV_007) | `PARTIAL` — house→sign→planets list, not a graha × bhava grid and without house lordship |
| S06 | Planetary dossier | `reportModel.ts:143-152`: name, longitude, sign, degree-in-sign, nakshatra+pada, house, R/D, dignity | `invariants.spec.ts`, `tests/astrology.spec.ts` | `IMPLEMENTED_NOT_E2E_TESTED` |
| S07 | Functional lordship | none in report model (`RASHI_LORDS`/`signLords` exist at `balaEngine.ts:508`, unused for this) | none | `MISSING` |
| S08 | Dignity, conjunction & aspect analysis | dignity column at `reportModel.ts:151`; `drishti.grahaDrishti`/`rashiDrishti` computed at `canonicalSnapshot.ts:386-390` but **not surfaced** in any report section; no conjunction listing | none for aspect/conjunction in report | `PARTIAL` |
| S09 | Yoga & Dosha section | `reportModel.ts:243` status-aware yoga section; engine `src/lib/jyotish/yogaEngine.ts` | `priya-1995-gk-negative.spec.ts` (7), `yoga-engine-contract.spec.ts` (19), `scholar-pdf-artifact.spec.ts` (1) | `IMPLEMENTED_AND_TESTED` (fixed in `f9ef3db`; scope: 9 rule-evaluated yogas + 1 NOT_CALCULATED, 3 doshas) |
| S10 | Dasha overview from canonical calculation | `reportModel.ts:220` 9 Mahadashas, `:229` Current Dasha Period; engine `src/lib/dashaEngine.js`, `canonicalModel.ts` `dashaTimeline` | `tests/kundli-pipeline/boundary-fixtures.spec.ts` | `IMPLEMENTED_NOT_E2E_TESTED` |
| S11 | Evidence/provenance certificate (per-claim) | `reportModel.ts:304-314` Appendix (report-model version, fingerprint, provenance) — not a per-claim certificate | `invariants.spec.ts` | `MISSING` |
| S12 | Explicit limitations & method declaration | `reportModel.ts:93` Calculation Standard; `:322` Disclaimer; appendix line admits "per-yoga rule verification is a documented limitation" | — | `PARTIAL` — no per-system (Parashari/Jaimini/KP), per-engine (Shadbala/Varga) implementation-status declaration |

---

## 2. Zero-fabrication (mission §3)

| ID | Requirement | Code evidence | Label |
| --- | --- | --- | --- |
| Z01 | All displayed conclusions trace to canonical output | `canonicalModel.ts` `requireValue()`; `validation.ts`; pipeline GATE 2/3 | `IMPLEMENTED_AND_TESTED` for the calculated surfaces; **still unverified** for Shadbala/Varga/Jaimini/KP values displayed outside the PDF (web workbench) |
| Z02 | Yoga registry: stable ID, formal rule, inputs, evaluated conditions, result, evidence refs, status (`PRESENT`/`ABSENT`/`INDETERMINATE`/`NOT_CALCULATED`) | `src/lib/jyotish/yogaEngine.ts`; `types.ts` `YogaResult` / `YogaStatus` / `YogaCondition` | `yoga-engine-contract.spec.ts`, `priya-1995-gk-negative.spec.ts` | `IMPLEMENTED_AND_TESTED` (fixed in `f9ef3db`) |
| Z03 | No invented planetary positions | `canonicalModel.ts` requires all 9 planets + 12 houses; `KUNDLI_CALCULATION_INCOMPLETE` | `IMPLEMENTED_AND_TESTED` |
| Z04 | Missing field is never filled with plausible text / treated as zero | `canonicalModel.ts:204` `pp?.divisionDegree ?? pp?.degreeInRasi ?? 0`; `balaEngine.ts:528` `\|\| 350.0`, `:551` `\|\| 300.0`, `:559` `drishtiBala = 25.0`; `evidenceGraph.ts:189` `?? 0.5` | `PARTIAL` — silent defaults exist in the strength layer |
| Z05 | No silent ayanamsha substitution | single source `config.ts:14-16`, value printed `reportModel.ts:100` | `IMPLEMENTED_NOT_E2E_TESTED` |
| Z06 | No duplicate sections / page padding | 16 distinct section builders, no repetition; page count follows content; ceiling 40 | `IMPLEMENTED_AND_TESTED` |

### The yoga fabrication defect — FIXED in `f9ef3db`

The unconditional literals at `canonicalSnapshot.ts:410-411` are gone. Yogas are now produced by
`src/lib/jyotish/yogaEngine.ts` and carry id, rule, inputs, conditions, evidence and status. The
`PRIYA-1995-GK-NEGATIVE` fixture proves a chart that does not support Gaja-Kesari reports it
**ABSENT**. Historical defect, kept for the record:



```
src/lib/jyotish/canonicalSnapshot.ts:410
  rajYogas: ['Dharma-Karmadhipati Yoga (9th/10th Lord Resonance)',
             'Gaja-Kesari Yoga (Jupiter in Kendra from Moon)'],
src/lib/jyotish/canonicalSnapshot.ts:411
  specialCombinations: ['Budhaditya Yoga (Sun-Mercury Intellect Conjunction)']
```

These are **unconditional literals** — no `if`, no planetary condition, no reference to the computed
chart. Every Kundli this pipeline produces declares all three yogas. They flow straight into the PDF:

`canonicalSnapshot.ts:410` → `canonicalModel.ts:251-259` (`buildYogasAndDoshas`, `basis: ['engine.declared.rajYogas']`) → `reportModel.ts:247` (`para('• ' + y.name)`) → PDF.

Nothing in the pipeline can express "this yoga is ABSENT", so no negative fixture can currently pass.
**Fixing this is the first coding task of the increment.**

Related: `kalsarpa` was previously typed but never emitted, i.e. silently omitted. It is now
emitted with status `NOT_CALCULATED` and a stated reason, and the report prints it as such.

---

## 3. Contradiction & consistency gates (mission §4)

Runtime gate: **MISSING**. The pipeline (`pipeline.ts`) runs GATE 1 → 1b → 2 → 3 → RENDER → GATE 4.
There is no consistency gate between GATE 3 and RENDER, and `src/lib/jyotish/contradictionDetector.ts`
is exercised only by tests.

| ID | Check required | Where it would live | Label |
| --- | --- | --- | --- |
| C01 | Ascendant agreement across summary/charts/tables | — | `MISSING` |
| C02 | Moon sign & Nakshatra agreement | — | `MISSING` |
| C03 | Longitude/sign/house consistency | — | `MISSING` |
| C04 | Rahu–Ketu opposition tolerance | — | `MISSING` |
| C05 | Dasha ordering & date continuity | — | `MISSING` (partial coverage in `boundary-fixtures.spec.ts`) |
| C06 | Lordship consistency | — | `MISSING` |
| C07 | Yoga evidence consistency | — | `MISSING` |
| C08 | Varga source consistency | — | `MISSING` |
| C09 | Language/value pairing | — | `MISSING` |
| C10 | No missing required values | `validation.ts` `assertReportCompleteness` | `IMPLEMENTED_AND_TESTED` |
| C11 | No contradictory prose | — | `MISSING` |
| C12 | No impossible/duplicate page sequence | `layoutEngine.ts`, `pdfValidator.ts` (blanks, density, ceiling) | `PARTIAL` — page-count/blank/density enforced; sequence uniqueness not asserted |
| C13 | Fail closed: no PDF, `pdfBuffer: null`, named error code, human diagnostic, no partial success | `pipeline.ts:37-53` `failed()` returns `pdfBuffer: null` + `errorCode` + `errorDetails`; typed codes in `errors.ts` | `IMPLEMENTED_AND_TESTED` for existing gates; **not yet wired to a consistency gate** |

---

## 4. Jyotish system separation (mission §5)

| ID | Requirement | Evidence | Label |
| --- | --- | --- | --- |
| Y01 | Every section declares system (Parashari / Jaimini / KP), method, source registry entry, implementation status, evidence strength | No such fields in `ReportSection` (`types.ts:245-251`) or any section builder | `MISSING` |
| Y02 | Infrastructure to support it | `src/lib/jyotish/evidenceGraph.ts`, `evidenceCompiler.ts`, `conventionCenter.ts`, `JYOTISH_CONVENTION_REGISTRY.md` | `IMPLEMENTED_NOT_E2E_TESTED` (infrastructure only, not surfaced) |
| Y03 | No blending of system rules | Cannot be asserted — no section declares a system | `BLOCKED_BY_SOURCE_OR_DECISION` (needs the declaration schema first) |

---

## 5. Shadbala, Varga, Jaimini honesty (mission §6)

| ID | Requirement | Evidence | Label |
| --- | --- | --- | --- |
| E01 | Shadbala: all 6 components with verified formulas and units | `balaEngine.ts` — UchchaBala `:180`, Saptavargaja `:194`, DigBala `:237`, DrikBala `:260`, Kala `:427`, Naisargika `:460`, Cheshta; constants `REQUIRED_SHADBALA_RUPAS` `:107`, `NAISARGIKA_VIRUPAS` `:118`, `MOOLATRIKONA_ZONES` `:151` | `PARTIAL` — components implemented, formulas **not yet verified against an independent reference**; silent defaults (`\|\| 350.0`, `\|\| 300.0`, `25.0`) violate Z04 |
| E02 | Shadbala calculation trace | none | `MISSING` |
| E03 | Shadbala independent reference fixtures | none | `MISSING` |
| E04 | Varga: all 16 divisions computed | `canonicalModel.ts:22` `DIVISION_LIST = [1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]`; `vargaEngine.ts:370` `generateShodashavarga` | `IMPLEMENTED_NOT_E2E_TESTED` |
| E05 | Varga: exact sign-division rules per division | `vargaEngine.ts:106` `calculateVargaPlacement` — explicit `case 9` (`:158`) and `case 10` (`:170`), remainder via generic harmonic path | `PARTIAL` — only D9/D10 rules are explicit; D2 (Hora), D3 (Drekkana), D30 (Trimsamsa) and D60 (Shashtiamsa) have irregular classical rules that a generic formula does not reproduce |
| E06 | Varga boundary/edge tests | none found | `MISSING` |
| E07 | Jaimini Chara Karaka ordering & degree treatment | `jaiminiEngine.ts:42-70` — 7 candidates (Rahu excluded), sorted by degree-in-rashi descending | `IMPLEMENTED_NOT_E2E_TESTED` — tie-break undocumented; degree vs longitude-in-sign treatment not asserted |
| E08 | Jaimini Rahu handling documented | `jaiminiEngine.ts:41` filters to the 7 classical grahas | `PARTIAL` — behaviour exists, not documented in any report or doc |
| E09 | Jaimini full synthesis (Chara Dasha, Arudha/Upapada Pada, Karakamsha-based judgement) | `jaiminiEngine.ts` computes karakas + karakamsha and attempts Arudha Lagna (`:78+`); no Chara Dasha | `PARTIAL` — basic Karakas only; must not be called "full Jaimini" |

---

## 6. PDF & typography (mission §7)

| ID | Requirement | Evidence | Label |
| --- | --- | --- | --- |
| P01 | Unicode Devanagari font preserved | `public/fonts/NotoSansDevanagari-{Regular,Bold}.ttf`; `src/lib/kundli/nodeFonts.ts:26` registration; `pdfFonts.ts` | `IMPLEMENTED_NOT_E2E_TESTED` |
| P02 | Deterministic PDF for identical canonical input | fingerprint `lineage.ts`, config recorded; no timestamp inside content except `generatedAt` (`reportModel.ts:112`) | `PARTIAL` — `generatedAt` is a wall-clock value inside the report; byte-determinism not asserted |
| P03 | 454-page regression protection / hard ceiling | `config.ts:27` `maxPages: 40`; `layoutEngine.ts:83`; `errors.ts:22`; `tests/kundli-pipeline/regression-454-page-runaway.spec.ts` | `IMPLEMENTED_AND_TESTED` — **ceiling stays at 40** |
| P04 | Deterministic multi-volume plan with stable boundaries & page limits | none in the PDF pipeline (the 17-volume book is a **web UI** artifact, `kundliBookModel.ts`) | `MISSING` |
| P05 | Visual inspection of real PDFs (clipping, orphan headings, blank pages, overlapping text) | `tests/incident/pdfRaster.ts`, `pdf-preview.spec.ts` provide rasterisation tooling | `MISSING` for this increment — not yet executed |
| P06 | Tables across pages, headings near page boundaries, stable header/footer/page numbers | `layoutEngine.ts` `ensureFits`, `PageFooterBlock` (`types.ts:237`) | `IMPLEMENTED_NOT_E2E_TESTED` |
| P07 | Hindi / English / mixed / long names / missing optional values | Hindi artifact test exists; incident report notes **`hi` locale keeps English section labels** | `PARTIAL` |
| P08 | Missing required data → fail closed | `assertReportCompleteness`, INV_015 (disclaimer-only document must not validate) | `IMPLEMENTED_AND_TESTED` |

---

## 7. Kashi Sahayak reader consent (mission §8) — carried over from the Granth work

| ID | Requirement | Evidence | Label |
| --- | --- | --- | --- |
| R01 | Consent controls: “हाँ, पढ़िए” / “अभी नहीं” / “केवल अर्थ” / “छोटा अंश” | not present (`FloatingAIGuruAvatar.tsx`) | `MISSING` |
| R02 | Consent binds to the offered book/chapter/passage | `consentQuestion` is free text only (`groundedAnswer.ts`) | `MISSING` |
| R03 | Bare “हाँ पढ़ो” resumes the pending offer | currently answered with “क्या पढ़ूँ?” (`gateway.ts` bare-consent branch) | `MISSING` |
| R04 | Reject expired/forged pending offers | no pending-offer object exists | `MISSING` |
| R05 | Session survives refresh | `readingSessionRef` + `localStorage` + `reviveVerifiedSession` | `IMPLEMENTED_AND_TESTED` (`tests/granth-reader-browser.spec.ts`) |
| R06 | No long autoplay chain without a gesture/consent | auto-advance only after a delivered passage, reverified by session state (Granth Phase 3) | `IMPLEMENTED_AND_TESTED` |
| R07 | Graceful autoplay rejection | utterance `onerror` never advances (`useKashiVoice.ts`) | `IMPLEMENTED_NOT_E2E_TESTED` (unit-verified; no device) |
| R08 | read/pause/explain/continue/stop consistent | `session.ts`, `granthReader.ts` | `IMPLEMENTED_AND_TESTED` |

---

## 8. Real-device verification (mission §9)

| ID | Requirement | Label |
| --- | --- | --- |
| D01 | Manual device protocol (Chrome Android, Safari iPhone, Hindi female voice, mute, speed, pause, explain, resume, advance, screen lock, call interruption, refresh restoration, autoplay rejection, no Hindi voice) | `MISSING` — no protocol document exists |
| D02 | Physical-device execution | `BLOCKED_BY_SOURCE_OR_DECISION` — no device available in this environment; cannot be simulated |

---

## 9. Environment blockers recorded for this mission

| Blocker | Impact |
| --- | --- |
| `prisma generate` cannot run (`binaries.prisma.sh` unreachable) | DB-backed flows unverified; `tsc`/`next build` need a sandbox-only stub at `node_modules/.prisma/client` (not committed) |
| `npx playwright install chromium` blocked | Browser tests need a Chromium extracted from `@sparticuz/chromium` (npm tarball) via `CHROMIUM_PATH` |
| No audio device / no Hindi TTS voice | Audible voice verification impossible; only the Web Speech contract can be tested headlessly |
| No licensed Jyotish reference corpus (Shadbala/Varga/Jaimini reference values) | Independent verification of E01/E03/E05 is `BLOCKED_BY_SOURCE_OR_DECISION` |
| No `docs/kundli/` directory and no in-repo "Scholar Edition" spec | Requirement list is taken from the mission brief; owner confirmation required |
