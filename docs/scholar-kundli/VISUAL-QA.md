# Visual standard and visual QA status

Two different things are documented here. The first is the standard the
charts and report are held to. The second is how much of that standard has
actually been checked, by whom.

**Status: `VISUAL_QA_NOT_PERFORMED`.** No human has looked at these charts.
No agent has looked at them either — the one that built them cannot see
images. What follows separates what is proven from what is assumed.

---

## 1. The standard

### Charts

| Requirement | How it is met | Checked by |
|---|---|---|
| Vector output only, never rasterised inside the PDF | SVG for web and artifacts; jsPDF line and text primitives for PDF | Test asserts no `<image>` in any SVG and no image operator on the PDF chart path |
| Print-legible labels | Real point sizes, defined through an explicit units-per-point model so millimetre and pixel surfaces agree | Font-size band asserted in `auditChartLayout` |
| Clean North Indian diamond | Twelve polygons and eight construction lines, derived from a fixed table | Tiling test: the twelve regions cover the square exactly |
| Strong Lagna, without clutter | Bold rule on the Lagna house; no other decoration | Deterministic layout; Lagna marker compared to canonical ascendant by the gate |
| Consistent planet ordering | Grahas laid out in a fixed registry order, never in input order | Fixture asserts order stability |
| No overlap | Label boxes sized from measured text and packed with a running baseline | `auditChartLayout` reports zero overlaps; canvas test measures ink per house |
| Nothing outside house bounds | Every label centre must fall inside its house polygon | `auditChartLayout` |
| No clipping | Box and viewBox checked against content bounds | Canvas ink test: nothing outside the image box |
| Monochrome-print compatible | No information carried by hue anywhere | Canvas test measures channel spread and requires it to be negligible |
| No reliance on colour alone | Retrograde is a rule beneath the abbreviation; Lagna is a rule — shape, not colour | Structural, asserted by fixture |
| Many planets in one house | Wrap into columns chosen from available space; shrink only inside 6–9pt; never hide, never overlap | Six-in-one-house and nine-in-one-house fixtures |
| Textual equivalent | Every placement drawn is also stated in words | Gate check `CG_CHART_TEXTUAL_EQUIVALENT` |
| Devanagari without OS-font dependence | Embedded Unicode font; a Hindi chart refuses to draw rather than emit boxes | Glyph test compares Devanagari rendering against tofu baseline |

### Report

| Requirement | How it is met | Checked by |
|---|---|---|
| Bounded length | `maxPages = 40` | Tests assert page count and fail above the ceiling |
| No blank pages | Layout engine packs content | Artifact extraction counts blank pages (currently 0 of 19) |
| No runaway pagination | Runaway guard, regression-tested against the 454-page incident | `regression-454-page-runaway.spec.ts` |
| Legible density | Density metric measured per page | Artifact test (currently 1.0) |
| Glyphs the PDF font can encode | Markers restricted to characters present in the font | Test rejects the three glyphs known not to survive |

---

## 2. What has been checked, programmatically

Nine checks in `chart-visual-artifacts.spec.ts`, all passing:

1. D1 and D9 SVGs written for review in three label modes (English, Hindi, mixed).
2. The rendered chart is not blank and nothing spills outside the box.
3. Every house region carries ink — no house is drawn blank. Thresholds were
   set from measurement: per-house ink ranges 25–322 px at 520 px on the
   reference chart, a blank house measures under 5.
4. The image is monochrome-safe — channel spread negligible.
5. Devanagari is drawn with real glyphs, not tofu boxes.
6. Hindi and mixed charts draw Devanagari in the rasterised image itself.
7. Review PNGs written at review size and at high resolution.
8. The chart survives being drawn small — nothing collapses or vanishes at
   220 px through 900 px.
9. Layout is deterministic — the same model produces byte-identical geometry.

Plus, on the report: page count, blank-page count, density, and the
runaway-pagination regression.

These prove the *absence of specific defects*. They do not prove the chart
looks right. A chart can pass all nine and still be ugly, cramped, or
confusing, and no test here would notice.

---

## 3. What has NOT been checked

This is the part that matters.

| Not checked | Why | Consequence |
|---|---|---|
| **Human visual inspection** | No one has opened the images | The verdict cannot be stronger than `READY_FOR_INDEPENDENT_REVIEW` |
| **Agent visual inspection** | The authoring agent cannot see images | No second opinion exists in any form |
| **Real-browser rendering** | No browser binary can be obtained in this environment: `npx playwright install chromium` fails, `apt-get` is unavailable (not root), no system Chrome | Five browser tests exist and skip with their reason; they do not pass |
| Print at 100% scale on paper | No printer, no print-shop proof | Print legibility is inferred from point sizes, not observed |
| Narrow mobile preview in a real browser | No browser | Responsive behaviour untested in situ |
| Grayscale and high-contrast rendering in a real viewer | Checked by measurement on rasterised output, not in a viewer | Equivalent, not identical to what a user's viewer does |
| PDF Devanagari at the pixel level | Verified by text extraction only | A glyph that extracts correctly could still render as a box |

The browser tests in `chart-browser.spec.ts` cover vector-only output and
overflow, Devanagari font loading and measurement, a 320 px viewport with no
sideways scroll, print media, and opening the delivered PDF in Chromium. All
five skip. **They have never run.**

---

## 4. How to complete this

For a reviewer with eyes and a browser, in order:

1. **Install a browser and run the skipped suite.**
   ```
   npx playwright install chromium
   npx playwright test tests/kundli-pipeline/chart-browser.spec.ts
   ```
   Five tests should go from skipped to passing. If any fails, that is the
   first real finding.

2. **Open the review images.**
   `artifacts/scholar-kundli/owner-review/` — 24 files: D1 and D9 SVGs in
   three label modes, PNGs at review size and at 2×, and small-size
   renderings. Look for: cramped houses, awkward wrapping, labels that sit
   oddly against the diamond, and anything that reads as clutter.

3. **Open the delivered PDF.**
   `artifacts/scholar-kundli/priya-1995-gk-negative.pdf`, 19 pages. Check
   the two-page Scholar Summary in particular: page 1 should be glanceable,
   page 2 should visibly separate calculated fact from interpretation from
   reflection.

4. **Print one page at 100%** and confirm the smallest text is legible.

5. **View on a narrow screen** and confirm nothing requires sideways
   scrolling.

6. **Record what you saw**, including the things that looked wrong. This
   document's status can only change to performed once someone has done the
   above and written down the result.

---

## 5. Known visual risks

Stated so a reviewer knows where to look first:

- **House label placement was corrected twice.** Top-anchored blocks left the
  four kite-shaped kendra houses looking empty, because their centroids sit
  well below the top edge. Labels are now centred vertically. Worth a look.
- **The kendra polygons are kites, not triangles.** An earlier triangle
  reading covered only three quarters of the square. The tiling test caught
  it; the visual consequence of the corrected geometry has not been seen.
- **The summary fits exactly two pages.** Three drafts spilled onto a third
  and were cut. It is close to the boundary, so a small content change could
  push it over. Re-measure after any edit.
- **Ink thresholds were relaxed to match measurement.** A house with two
  small digits measures around 25 px of ink. The threshold sits at 12 px at
  520 px and 4 px at 220 px — deliberately loose, because a tighter one
  failed legitimately sparse houses. A truly blank house would still fail.
- **The `●` glyph does not exist in the PDF font.** It renders as `%Ï`. The
  Bhava–Graha matrix uses `•` instead, and a test now rejects the three
  glyphs that do not survive.
