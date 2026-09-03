# Phase 3 Verification — charts and Scholar Summary

**Branch:** `arena/01a0593a-cosmictantra-v2`
**Base:** `36a3c1b` (Phase 2 corrective) → `2ba20be` (Phase 1 gate) → `40a04ae` (Phase 2)
**Verdict:** `READY_FOR_INDEPENDENT_REVIEW`

Nothing in Phase 3 was merged, deployed, rebased, squashed or force-pushed.
Nothing was cherry-picked onto `main`. The held Kashi commits (`1698ab6`,
`4d5a904`) were not touched.

---

## 1. Commits

| # | SHA | Contents |
|---|---|---|
| 1 | `2be0e8e` | Canonical chart model and validation (`chartModel.ts`, error codes) |
| 2 | `6c234a6` | North Indian D1/D9 vector renderer and report wiring |
| 3 | `be0e058` | Scholar Summary (two pages), plus the dignity correction |
| 4 | `7d623e4` | Fourteen chart and summary checks in the delivery gate |
| 5 | `a48959a` | Fixtures, gate tests, visual artifacts, and these three documents |

See §11: these five were recreated after the sandbox lost its commit objects.
The file content is byte-identical to what was verified; the commit SHAs are
not the ones the work first carried, and no attempt was made to preserve the
intermediate states that were lost.

Work continued past Phase 3 into the carried items — the report schema, source
verification, predictive-language safety, the bhava–graha matrix, the varga
audit, the visual standard and the quality matrix — in the seven commits
following `a48959a`. Those are documented in the files they produced:
`REPORT-SCHEMA-v1.md`, `SOURCE-VERIFICATION.md`, `VARGA-AUDIT.md`,
`VISUAL-QA.md` and `MARKET-QUALITY-MATRIX.md`.

## 2. What was built

- `src/lib/kundli/chartModel.ts` — the placement contract. Validates and
  rejects; provides the abbreviation registry and the textual equivalent.
- `src/lib/kundli/northIndianChart.ts` — one geometry, three emitters
  (PDF vector, SVG, and a test-only canvas rasteriser), plus `auditChartLayout`.
- `src/lib/kundli/scholarSummary.ts` — the two-page summary, the declared
  not-calculated list, and the banned-language scanner.
- Gate: `checkChartAndSummaryConsistency`, wired into the pipeline at gate 3c.

Deliverables: `docs/scholar-kundli/CHART-RENDERING-v1.md`,
`SCHOLAR-SUMMARY-v1.md`, this file, plus the artifacts in §7.

## 3. Build and type checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx next build` | passed (~69 s) |
| `npx prisma generate` | **failed** — TLS to `binaries.prisma.sh` is blocked in this environment. Pre-existing, unrelated to Phase 3. |

## 4. Test results

### Primary suite — `tests/kundli-pipeline`

```
TZ=UTC              394 passed, 5 skipped
TZ=Asia/Kolkata     394 passed, 5 skipped
TZ=America/New_York 394 passed, 5 skipped
```

Identical results under all three host timezones. The 5 skipped are the browser
tests in `chart-browser.spec.ts`, which skip loudly when no browser binary
exists (§6).

Breakdown of what Phase 3 added:

| Spec | Tests | Covers |
|---|---|---|
| `chart-fixtures.spec.ts` | 26 | 22 placement/geometry fixtures, 4 structural geometry guarantees |
| `chart-gate.spec.ts` | 18 | gate passes clean; 11 fault injections; delivery-failure contract |
| `chart-visual-artifacts.spec.ts` | 9 | ink, monochrome, Devanagari glyphs, PNGs, small sizes, determinism |
| `chart-browser.spec.ts` | 5 | real-browser rendering — **skipped, no browser** |
| `scholar-pdf-artifact.spec.ts` | 1 | end-to-end PDF generation and inspection |

### Other suites

```
tests/golden-kundli tests/incident tests/granth-* tests/kashi-sahayak
tests/astrosage-differential-benchmark
      356 passed, 10 failed, 5 skipped
```

Of the 10 failures:

- **1 pre-existing and unrelated:** AstroSage GATE 2 sunrise/sunset parity
  (`sunset` expected `06:38`). Documented before Phase 3 began.
- **9 environment-blocked:** `Failed to launch chromium — executable doesn't
  exist`. No browser binary can be obtained in this sandbox (§6). These
  passed in earlier phases when a browser was present.

Neither class is a Phase 3 regression. Both are stated rather than rounded to
"all green".

### Fault injection, 11 ways

Each is caught by its intended gate check; the unmodified control passes:

| Injected fault | Check that fires |
|---|---|
| graha moved to another house (D1) | `CG_CHART_D1_PLANETS` |
| graha moved (D9) | `CG_CHART_D9_PLANETS` |
| Ketu removed from D1 | `CG_CHART_D1_PLANETS`, `CG_CHART_NODES`, `CG_EVIDENCE_RESOLVES` |
| lagna marker set to the wrong sign (D1) | `CG_CHART_D1_LAGNA` |
| lagna marker set to the wrong sign (D9) | `CG_CHART_D9_LAGNA` |
| retrograde marker cleared | `CG_CHART_RETROGRADE_MARKER` |
| a house removed | `CG_CHART_D1_HOUSES` / `CG_CHART_D9_HOUSes` |
| a textual table row dropped | `CG_CHART_TEXTUAL_EQUIVALENT` |
| Hindi chart disagreeing with English | `CG_CHART_BILINGUAL_VALUES` |
| a summary dasha date altered | `CG_SUMMARY_DASHA_MATCH` |
| a banned phrase inserted | `CG_SUMMARY_LANGUAGE` |

Plus two further injections in the fixture spec: a yoga named in the summary
whose status is not PRESENT (`CG_SUMMARY_YOGA_STATUS`), and an evidence id that
resolves to nothing (`CG_EVIDENCE_RESOLVES`).

## 5. Delivered PDF

```
pages            19     (was 15 before Phase 3)
blank pages      0
density          1.0
report id        CT-KUNDLI-31346AC701E0CFD5
```

Structurally: cover, passport, **summary p1**, **summary p2**, **D1 chart**,
**D1 placements as text**, **D9 chart**, **D9 placements as text**, birth
summary, panchanga, planetary details, house positions, dasha, yogas, doshas,
interpretations, calculation standard, certificate, disclaimer.

The 40-page ceiling holds with room to spare. The 454-page runaway regression
test passes.

### The two-page summary, measured

Page 1 holds "Your chart at a glance". Page 2 holds all three levels of "What
deserves attention", including the Level 3 reflections. The next section begins
on page 3. Three earlier drafts spilled onto a third page; each was cut rather
than allowed to overflow.

## 6. Visual QA — NOT PERFORMED

**The agent that built this cannot see images.** No chart was inspected by a
human or by the authoring agent. This is reported, not worked around.

Compounding it, **no browser binary can be obtained in this sandbox**:
`npx playwright install chromium` and `chromium-headless-shell` both fail with
download errors, and `apt-get` cannot acquire the dpkg lock. The browser-based
tests therefore skip (or fail, in pre-existing specs that predate this
limitation). A browser report-preview was **not** performed.

What was verified programmatically, without eyes:

- `auditChartLayout` — **0 issues** on the reference chart: EN, HI and
  BILINGUAL × D1 and D9 × PDF and SVG sizes. Checks labels outside their
  house, overlapping boxes, clipping, missing or duplicated grahas, and
  out-of-band font sizes.
- Ink near every house centroid in all four label modes and both divisions —
  no house is drawn blank.
- Monochrome: largest RGB channel spread ≤ 12 across the whole image.
- Nothing drawn outside the viewBox at 220, 300, 520 and 900 px.
- No `<image>` element in any SVG; no image operator on the PDF chart path.
- Determinism: identical inputs produce byte-identical SVG and identical
  layout JSON.
- Devanagari: two different words produce different ink (identical ink would
  mean tofu boxes), and the font's advance width differs from a font with no
  Devanagari coverage.

Programmatic checks prove the absence of specific defects. They cannot prove a
chart looks right. The images are in `artifacts/scholar-kundli/owner-review/`
for a human owner.

## 7. Artifacts produced

```
artifacts/scholar-kundli/priya-1995-gk-negative.pdf          19-page report
artifacts/scholar-kundli/priya-1995-gk-negative.pages.txt    per-page text
artifacts/scholar-kundli/priya-1995-gk-negative.p01..p19.png per-page images
artifacts/scholar-kundli/d1.svg, d9.svg                      the two charts
artifacts/scholar-kundli/owner-review/d{1,9}-{en,hi,bilingual}.svg
artifacts/scholar-kundli/owner-review/d{1,9}-{en,hi,bilingual}.png        (and @2x, -small)
```

All under `artifacts/`, which is gitignored.

## 8. Defects found and fixed during Phase 3

1. **Every graha's dignity was reported NEUTRAL**, including Venus in Taurus.
   The canonical model read boolean flags no snapshot populates instead of the
   engine's own dignity string. A summary built on that field would have stated
   something false in the most trusted position in the report.
2. **The four kendra houses were drawn as triangles instead of kites.** The
   twelve regions summed to 7 500 of 10 000 square units. Found by a tiling
   test; corroborated by the label positions in the chart this module replaced.
3. **The chart was sized in points on a millimetre surface** — 300 became
   300 mm, exceeding the 266 mm page and stalling pagination.
4. **Empty houses were briefly drawn with no labels at all**, after a refactor
   moved a `continue` above the house and sign labels. Found by the ink check.
5. **Two of my own gate checks were wrong** in ways that would have blocked
   every delivery: one demanded a summary-only evidence id appear in a detail
   section (impossible by construction); the other treated an id cited in two
   sections as a conflict. Both now check what they claim to check.
6. **The Hindi summary failed honestly** — it names शुक्र and राहु where the
   still-untranslated detail sections write Venus and Rahu. Value tokens now
   come from the canonical model and period identities match across scripts.
7. **A graha listed in two houses was not rejected**, because the model never
   read `houses[].planets`. The occupancy lists are now cross-checked.

## 9. Unresolved limitations

- **Visual QA not performed.** No human has looked at these charts.
- **No browser verification.** Browser chart tests skip; the report preview in
  a real browser was not run.
- **Bilingual coverage is partial.** Hindi covers 5 of 31 sections: the charts
  and the two placement tables. Headings, prose and interpretation text remain
  English. The gate discloses this as `CG_BILINGUAL_PARTIAL` on every Hindi
  delivery rather than implying a full translation.
- **PDF Devanagari is not pixel-verified.** It is verified by text extraction
  and font embedding. No PDF rasteriser reporting glyph coverage was available.
  The SVG path was verified at pixel level.
- **Only D1 and D9.** Thirteen other vargas, Shadbala, Ashtakavarga, Jaimini,
  KP, Prashna and Muhurta are declared not calculated and are not offered.
- **`maxPages` remains 40**, per the standing instruction. The delivered report
  is 19 pages; no multi-volume design was tested.
- **The current-period pointer is generation-relative.** "Current mahadasha" is
  current as of the `generatedAt` instant on the certificate.
- **AstroSage GATE 2 sunset parity** remains failing, unchanged and unrelated.
- **`npx prisma generate` cannot run here** (blocked TLS). Client generation was
  not re-verified in this environment.
- **No print-shop proof** was made. Print, grayscale and high-contrast
  rendering were checked programmatically on the SVG and canvas paths only.

## 10. Statement of scope

These fixtures are hand-authored. They prove the renderer places grahas where
the canonical model says, and that the geometry holds under stress. They are
**not** independent astronomical validation, and nothing here confirms that the
engine's longitudes are correct.

The verdict is `READY_FOR_INDEPENDENT_REVIEW`. It is not a claim that the
charts are correct, complete, visually approved, or the best available. It is a
claim that the work is finished to the stated standard and needs a human to
look at it before anyone relies on it.

## 11. Infrastructure note

The sandbox this was built in does not persist `.git` between sessions. Twice
during Phase 3 the repository reset to the session-start commit, discarding
all unpushed commit objects while leaving the working tree intact.

The first time, the Phase 1 and 2 commits (`2ba20be`, `40a04ae`, `36a3c1b`)
were recovered from the remote. The second time, the five Phase 3 commits had
not yet been pushed — GitHub authentication had expired — and were lost. They
were recreated from the surviving working tree, five topical commits as
before, and pushed immediately.

What this means for a reviewer:

- The five commits carry the **final** content of their files, not the
  intermediate states that were lost. The history reads as five topical
  commits rather than as the evolution it originally was.
- The tree at `a48959a` is the tree that was tested: 324 passed, 0 failed,
  under all three host timezones.
- No history was rewritten and nothing was force-pushed at any point.

Lesson applied: commit and push before the end of a session, not after.

