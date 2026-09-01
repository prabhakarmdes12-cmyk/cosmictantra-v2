# 01 — Current State Audit (Phase A)

Status: **complete**. Full technical detail lives in [`forensic/v40-current-architecture.md`](../../forensic/v40-current-architecture.md);
this file is the reader-facing summary and the defect register in short form.

## What was audited

The whole Kundli path was read end to end before a line of V40 was written:

| Layer | Files | Verdict |
|---|---|---|
| Astronomical kernel | `src/lib/astrologyEngine.js`, `src/lib/panchang.js`, `src/lib/dashaEngine.js` | Sound. **Not modified by V40.** |
| Jyotish derivation | `src/lib/jyotish/{canonicalSnapshot,relationshipEngine,yogaEngine,vargaEngine,balaEngine}.ts` | Sound but partly unexposed and partly unvalidated. |
| Canonical adapter | `src/lib/kundli/canonicalModel.ts` | Sound; loses dasha-balance precision (D01). |
| Report model v1 | `src/lib/kundli/reportModel.ts` | Works; audit-shaped rather than consultation-shaped. |
| Renderer v1 | `src/lib/kundli/renderer.ts` | Works; five block kinds, no design system. |
| Gates | `pipeline.ts`, `consistencyGate.ts`, `pdfValidator.ts` | Strong. Reused unchanged by V40. |

Baseline metrics for the golden chart under v1: **19 pages**, 33 sections,
gate-2b 264 checks / 0 critical, gate-3c 156 checks, gate-3b 87 checks,
0 blank pages, content density 1.0.

## Defect register

| ID | Defect | V40 disposition |
|---|---|---|
| V40-D01 | Vimshottari balance stored as a rounded number (`5.0 years`); precision lost in the adapter | Re-derived at full precision in `v40/dashaActivation.ts` and cross-checked against the engine's own first mahadasha. Kernel untouched. |
| V40-D02 | `panchang.js` emits identical strings for amanta and purnimanta masa | Amanta reported as calculated; **purnimanta reported as NOT_CALCULATED**. The duplicate is never presented as two independent facts. |
| V40-D03 | Shadbala computed but never validated against an independent reference | Quarantined. Not printed, not used. See [`forensic/shadbala-validation.md`](../../forensic/shadbala-validation.md). |
| V40-D04 | D10 computed by the varga engine but absent from `ChartDivision` | Validated against an independent re-implementation, then **still quarantined** pending an external reference. |
| V40-D05 | Compound (panchadha) relationship collapsed by the kernel; GREAT_FRIEND / GREAT_ENEMY unrecoverable | Declared as a not-filled field in the graha condition record rather than guessed. |
| V40-D06 | Planetary-war victor requires celestial latitude, which the canonical model does not carry | War is detected and reported; the victor is explicitly not calculated. |
| V40-D07 | `NotoSansDevanagari-Bold.ttf` shipped but never registered; Devanagari "bold" was the regular face | Renderer v2 registers the real bold face when it is available on disk. |
| V40-D08 | Source-status boilerplate repeated beside every rule in the main report | Short status in Part A; the full provenance statement appears once, in Part B §B8. |
| V40-D09 | Sade Sati implemented as a *natal* check but named as though it were the transit phenomenon | Both the dashboard and §B3 state explicitly that this is a natal check, not a transit search. |
| V40-D10 | Kalsarpa listed with no adopted rule | Reported as NOT_CALCULATED with the reason. Absence is never claimed. |

## Two defects found during Phase C that were not visible from reading code

Both were found by rendering the artifact and reading the extracted text
back, and both silently corrupt a page rather than failing:

- **jsPDF Devanagari truncation.** With the embedded Devanagari face, a Latin
  *letter* following Devanagari text truncates the rest of the string:
  `जन्म कुण्डली (D1)` printed as `जन्म कुण्डली (`. Devanagari, digits, dashes and
  parentheses are unaffected.
- **jsPDF WinAnsi fallback.** A Helvetica run containing any character outside
  WinAnsi — an arrow `→`, a prime `′`, a tick `✓` — flips jsPDF into a UTF-16
  path that prints garbage with broken metrics.

Renderer v2 answers both structurally: a mixed-script line layout engine draws
each script run in its own font, and every Latin run is sanitised to WinAnsi
first. Status marks are **drawn as vectors**, never typed, so no font coverage
question arises. See [`03-visual-design-system.md`](03-visual-design-system.md).

## What was deliberately not changed

- The astronomical kernel. No calculation was altered anywhere in V40.
- `kundli-report-v1` and `renderer.ts`. Both still run and are covered by a
  regression test in `tests/kundli-v40/pdf-artifact.spec.ts`.
- `kundli-calc-v1`. No calculation change occurred, so no version bump was
  warranted.
- Every existing fixture and test under `tests/kundli-pipeline/`.
