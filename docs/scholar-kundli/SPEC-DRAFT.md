# CosmicTantra Master Kundli — Scholar Edition: SPEC DRAFT (for owner sign-off)

**Status:** DRAFT — no report-content code will be written against this until the owner approves.
**Date:** 2026-09-01 · **Branch:** `arena/01a0593a-cosmictantra-v2` · **Base:** `b651bd7`

## Why this document exists

The mission brief refers to a "CosmicTantra Master Kundli — Scholar Edition" specification.
**No such document exists in this repository** (`grep -ril "scholar edition" docs/ src/` → no matches;
there is no `docs/kundli/` directory either). Rather than invent a specification and present it as
if it were the owner's, this draft is derived **explicitly from the mission brief** and marks every
point where the brief does not decide.

Anything below marked **[OPEN]** needs an owner decision before it is built.

---

## 1. Scope

A **Scholar Edition** PDF report that is longer, denser and more rigorous than the current
~10-page report, built **only** from canonical calculated data. It is not a new product surface:
it is a new report tier emitted by the same fail-closed pipeline
(`src/lib/kundli/pipeline.ts`, GATE 1 → 1b → 2 → 3 → RENDER → GATE 4).

Non-goals in this increment: no AI-authored prose, no new Jyotish engines beyond rule-evaluated
yogas, no change to the accepted Kashi voice.

---

## 2. Required sections (from mission §2)

| # | Section | Source in mission | Draft decision |
| --- | --- | --- | --- |
| 1 | Premium cover + report identity | §2.1 | Keep the existing cover (Ganesh emblem, CosmicTantra symbol, name, report id). Add report tier ("Scholar Edition") and page-of-N. |
| 2 | Birth-data passport | §2.2 | One consolidated block: name, date of birth, **exact local time**, timezone + offset provenance, coordinates + provenance, location name, ayanamsha (name + value), engine name + version + calculation version. Today these values exist but are split across *Birth Summary* and *Calculation Standard*. |
| 3 | At-a-glance chart summary | §2.3 | One block: lagna (sign + degrees), Moon sign, Janma nakshatra + pada, current Mahadasha/Antardasha with dates. **Currently missing.** |
| 4 | D1 / Rashi chart | §2.4 | Render the North-Indian D1 chart in the PDF. Today the PDF carries the D1 *table*; the drawn chart is only in the web UI. **[OPEN]** confirm a drawn chart inside the PDF is wanted, or the table is sufficient. |
| 5 | Bhava–Graha matrix | §2.5 | 12 × 9 grid: rows = bhava, columns = graha, cell = occupied / aspected / lord. Today we render house→sign→occupants only. Add house lord and aspects. |
| 6 | Planetary dossier | §2.6 | Nine entries, each: longitude, sign, degree-in-sign, nakshatra + pada, bhava, retrograde, dignity, Shadbala **with status**, Varga placements **with status**. |
| 7 | Functional lordship | §2.7 | Per graha: houses ruled, functional nature (benefic/malefic/neutral) **with the rule that produced it**. Today `getFunctionalRoles` exists in the snapshot but is never surfaced. |
| 8 | Dignity / conjunction / aspect analysis | §2.8 | (a) dignity per graha; (b) conjunction list with orb; (c) graha and rashi drishti. `grahaDrishti`/`rashiDrishti` are computed in the snapshot but not printed. |
| 9 | Yoga & Dosha section | §2.9 | The rule-evaluated registry (shipped in this increment): id, rule, inputs, conditions, evidence, status. Doshas: Manglik, Sade Sati, Kalsarpa (declared NOT_CALCULATED). |
| 10 | Dasha overview | §2.10 | Vimshottari Mahadasha table + current period; continuity assertions. Antardasha/Pratyantardasha tiers **[OPEN]** — they exist in the engine but the report prints only the current level. |
| 11 | Evidence / provenance certificate | §2.11 | Per-claim: claim → canonical field path → value → engine → convention registry id. Today only an Appendix with report-model version and fingerprint exists. |
| 12 | Limitations & method declaration | §2.12 | Per-system (Parashari / Jaimini / KP) and per-engine (Shadbala, Varga, Jaimini, Ashtakavarga, KP) implementation status. Today: one Disclaimer + Calculation Standard. |

### Page count
Page count **follows the content**; it is not a target. The current report is 10 pages; the
Scholar sections above are expected to take it to roughly 15–25 **[OPEN — will be measured, not
guessed]**. `maxPages` stays at **40** (`src/lib/kundli/config.ts:27`) and must not be raised until
pagination tests prove a higher ceiling cannot recreate the 454-page runaway. If the content needs
more than 40 pages, a deterministic volume plan with stable section boundaries and per-volume page
limits will be drafted instead of raising the ceiling.

---

## 3. Zero-fabrication rules (from mission §3) — binding

1. Every displayed conclusion traces to a canonical field path. No inferred values.
2. Missing value → the section states the value is unavailable or the item is declared
   `NOT_CALCULATED`. Never a plausible filler, never zero, never a silent default.
3. Ayanamsha is never substituted silently; the declared value is printed.
4. No duplicate sections to increase page count.
5. No AI-authored text inside factual tables. Interpretive narrative stays in clearly labelled
   interpretation sections with their evidence ids.
6. Shadbala, Varga and Jaimini are presented at their **true** implementation status, not as
   complete systems, until independently verified.

### Yoga contract (shipped in this increment)
Every yoga carries: stable id · formal rule · inputs (grahas/bhavas/signs) · each evaluated
condition with evidence · result · status ∈ `PRESENT` / `ABSENT` / `INDETERMINATE` /
`NOT_CALCULATED`. Engine: `src/lib/jyotish/yogaEngine.ts`.

---

## 4. Not decided by the brief — owner input needed

| # | Question | Default if not answered |
| --- | --- | --- |
| Q1 | Is a **drawn** North-Indian D1 chart required inside the PDF, or is the tabular chart enough? | Tabular only |
| Q2 | Which Antardasha/Pratyantardasha depth goes into the Dasha section? | Mahadasha table + current period (as today) |
| Q3 | Which of the 16 Vargas appear in the dossier before all 16 are independently verified? | D1 and D9 only, others declared NOT_CALCULATED |
| Q4 | Should the evidence certificate be a full per-claim appendix or a per-section provenance line? | Per-section provenance line + one consolidated appendix |
| Q5 | Is the Scholar Edition a **separate deliverable** (new tier/route) or a **replacement** for the current report? | Separate tier; current report unchanged |
| Q6 | Hindi section labels and Hindi yoga names — in this increment or deferred? | Deferred (English labels, Devanagari-safe font path preserved) |

---

## 5. Ordering (proposed)

1. **Done:** verified-reality capability matrix (`docs/SCHOLAR-KUNDLI-CAPABILITY-MATRIX.md`).
2. **Done (this increment):** rule-evaluated yoga engine + `PRIYA-1995-GK-NEGATIVE` negative
   fixture + contract tests + PDF artifact.
3. Next candidates, in the order the owner prefers:
   a. Contradiction/consistency gate wired into the pipeline before RENDER (mission §4).
   b. Report content increment (sections 2, 3, 5, 7, 8, 11, 12 above).
   c. Shadbala/Varga/Jaimini honesty audit (mission §6).
   d. Kashi reader consent state machine + device protocol (mission §8/§9).
