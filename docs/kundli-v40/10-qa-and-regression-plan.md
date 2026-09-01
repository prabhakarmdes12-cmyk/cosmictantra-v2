# 10 — QA and Regression Plan

## Suites

| Suite | File | Covers |
|---|---|---|
| Derived model | `tests/kundli-v40/derived-model.spec.ts` | Phases D, E, F — 9 tests |
| PDF artifact | `tests/kundli-v40/pdf-artifact.spec.ts` | Phases C, H — 4 tests |
| Golden fixture | `tests/kundli-v40/goldenCanonical.ts` | PRIYA_GAJA_KESARI_NEGATIVE, rebuilt from the birth input on every run |
| v1 regression | `tests/kundli-pipeline/*` (unchanged) | the reference renderer, still green |

Run: `npx playwright test tests/kundli-v40 --workers=1`.
Type check: `npx tsc --noEmit`. (Do **not** use `npm run build` in a sandbox —
its `prisma generate` step needs network access.)

## The golden fixture

PRIYA_GAJA_KESARI_NEGATIVE — Priya Sharma, 1995-06-15 10:30, Patna
(25.5941, 85.1376), Asia/Kolkata. It is rebuilt from the birth input on every
run rather than loaded from a stored JSON blob, so the fixture also proves the
kernel still produces the same chart instead of only proving the report layer
can read a file.

Asserted ground truth:

| Item | Value |
|---|---|
| Lagna | Leo 12.10°, Magha pada 4 |
| Sun | Taurus 29.86°, bhava 10 |
| Moon | Sagittarius 28.86°, bhava 5, Uttara Ashadha pada 1 |
| Mars | Leo 16.16°, bhava 1 |
| Mercury | Taurus 16.18°, bhava 10, retrograde |
| Jupiter | Scorpio 15.01°, bhava 4, retrograde |
| Venus | Taurus 11.72°, bhava 10, **own sign** |
| Saturn | Pisces 0.59°, bhava 8 |
| Rahu / Ketu | Libra 9.22° / Aries 9.22° |
| D9 lagna | Karka |
| Dasha | MD Rahu (2017-06-19 → 2035-06-19), AD Mercury |
| Gaja-Kesari | **ABSENT** |
| Budhaditya | PRESENT |
| Malavya | PRESENT |
| Manglik | PRESENT, severity MEDIUM |
| Sade Sati | NOT ACTIVE at birth |

The fixture is named for the negative case: this chart is the one that proves
the engine does **not** invent Gaja-Kesari Yoga.

## What the derived-model suite asserts

1. The canonical chart still matches the ground truth above.
2. The Vimshottari balance is re-derived at full precision and agrees with the
   dasha engine's own first mahadasha **within one day**.
3. The independent D10 re-implementation agrees with the kernel for all nine
   grahas and the lagna, and `allAgree === true`.
4. D10 stays quarantined despite agreeing (`mayInfluenceConclusions: false`,
   and `D10_CONFIRMATION` appears in the missing-factor list).
5. **Every** evidence identifier emitted anywhere in the derived model resolves
   in the canonical chart; more than twenty distinct paths are cited.
6. No capability that is less than fully CALCULATED may influence a conclusion;
   shadbala in particular is present in the inventory and not CALCULATED.
7. Career reports evidence coverage, never a probability, and always states
   what it does not claim.
8. Functional lordship separates natural character from functional role and
   issues no maraka verdict.
9. Panchanga masa duplication is reported honestly (amanta calculated,
   purnimanta NOT_CALCULATED, defect recorded).

## What the artifact suite asserts

1. The pipeline reaches `READY_FOR_DELIVERY` with no error code.
2. Every mandatory Part A and Part B section is present and non-empty.
3. The banned-language scan finds nothing — checked on the **model**, before
   rendering, so a banned phrase cannot reach an artifact at all.
4. PDF quality gate passes: status PASS, **zero blank pages**, no mandatory
   section missing, page count > 14 and ≤ 40.
5. Part A ends by page 16 — the consultation part stays consultable.
6. The text layer is real selectable Unicode: known headings are found by
   substring search, and **every page has more than 20 extracted characters**.
7. The content hash is deterministic across runs and excludes the timestamp.
8. No `Priya` / `Sharma` / `1995-06-15` string appears anywhere under
   `src/lib/kundli/v40/` — fixture data stays in fixtures.
9. The v1 pipeline still reaches `READY_FOR_DELIVERY` and still produces a PDF.

## Current results

```
13 passed
V40 PDF: 34 pages (Part A = 16), ~1.7 MB
gate 2b: 0 critical · gate 4: PASS · blank pages: 0
```

## Known gaps

| Gap | Why | Unblocks when |
|---|---|---|
| No external-reference comparison for D10 or shadbala | no network access to a licensed product in this environment | a reference product or dataset is available |
| No visual-diff baseline for the PDF | no browser/rasteriser in CI | a rasteriser is added to CI |
| Devanagari glyph *shaping* is not correct (pre-base matras render in logical order) | jsPDF has no complex-text-layout engine; the **text layer is correct**, only the visual glyph order is wrong | a shaping engine (HarfBuzz/opentype.js) is added, or Devanagari is rendered as vector paths |
| Only the golden chart is run through V40 | corpus wiring is v1-only today | the corpus runner is pointed at `generateKundliV40Pdf` |

The Devanagari shaping gap is the most consequential open item for a Hindi
reader and is recorded here rather than left for a reviewer to notice; it
affects presentation only — extraction, search and copy-paste of the Hindi text
all return the correct Unicode.

## Regression policy

- v1 stays in the tree and stays green until V40 is accepted.
- Any change to a V40 engine bumps that engine's version string; the string is
  printed in the certificate and folded into the content hash, so a silent
  behaviour change is impossible.
- Any new capability must be added to the `capabilities` inventory. Because
  `mayInfluenceConclusions` is derived from the status, a capability added
  without a status cannot leak into a conclusion.
