# Chart Rendering v1 — North Indian D1 and D9

**Status:** implemented. Not visually approved — see §7.
**Scope:** the Rashi (D1) and Navamsha (D9) charts only. No other varga is drawn.

---

## 1. What this is

One deterministic geometry, drawn to three surfaces:

| Surface | Where it is used | Primitives |
|---|---|---|
| PDF | the delivered report | jsPDF `line`, `rect`, `text` |
| SVG | web delivery and review artifacts | SVG `line`, `rect`, `text` |
| Canvas PNG | owner review and pixel tests (test-only, in `tests/`) | `@napi-rs/canvas` |

All three are produced from the single `layoutChart()` in
`src/lib/kundli/northIndianChart.ts`. Nothing is rasterised inside the PDF: no
`addImage` call exists on the chart path, and the chart SVGs contain no
`<image>` element. A test asserts both.

---

## 2. The renderer calculates nothing

The renderer consumes a `ChartRenderModel` built by
`src/lib/kundli/chartModel.ts`, which validates placements against the
canonical model and throws `KUNDLI_CHART_INVALID` on any inconsistency. The
renderer never computes a house, a sign, a navamsha or a retrograde state. If a
block carries no usable model, `renderChart` draws nothing and returns 0 rather
than invent a chart from loose fields.

A chart drawn from incomplete data is indistinguishable from a real one once
it is on the page, which is why incompleteness stops delivery instead of
producing a warning beside a plausible drawing.

## 3. The placement contract

Every placement carries: division, lagna sign, house number, sign number,
planet id, display name, retrograde state, degree in sign, and the canonical
path the value came from.

Rejected, as `KUNDLI_CHART_INVALID`:

- fewer or more than twelve houses, or a duplicated or out-of-range house number
- an invalid sign number on any house
- an unknown graha id
- a graha in more than one house — from either surface that can claim it
  (`planets[].house` or `houses[].planets`)
- a D1 placement that disagrees with the canonical planet's own sign
- a D9 placement that disagrees with the navamsha of the canonical longitude
- a lagna marker that disagrees with the chart's lagna
- a house occupancy list that disagrees with the derived placements
- a chart missing Rahu or Ketu, so the node axis cannot be drawn

## 4. Geometry

Twelve regions of a 100 × 100 square:

- **Houses 1, 4, 7, 10** — the four quadrants of the central diamond. Each is
  a *kite*, bounded by two half-edges of the diamond and two half-diagonals
  meeting at the centre. Centroids (50, 25), (25, 50), (50, 75), (75, 50).
- **Houses 2, 3, 5, 6, 8, 9, 11, 12** — the eight triangles at the corners, each
  corner split by the diagonal that crosses it.

A test proves the twelve regions tile the square exactly: their areas sum to
10 000. This caught a real defect during development (§8).

### Layout rules, in order of precedence

1. No graha is ever hidden.
2. No two label boxes overlap.
3. No label centre leaves its house polygon.
4. Font size is reduced only inside the band 6–9 pt.

Column count is derived from the space actually available, not from a fixed
threshold, so a crowded house wraps into more columns instead of shrinking into
illegibility. Text blocks are centred vertically within each house's inner
region, so the four kite houses use their whole area.

### Units

PDF surfaces are millimetres; SVG surfaces are pixels. Type sizes are specified
in typographic points on both, converted through an explicit
`unitsPerPoint` (25.4/72 for mm, 4/3 for px). Getting this wrong produced a
chart 300 mm tall that stalled pagination (§8).

## 5. What the reader sees

| Element | How it is drawn |
|---|---|
| House number | small gray numeral at the top of each house |
| Sign number | the sign occupying that house |
| Graha | two-letter abbreviation, e.g. `Su`, `Mo`, `Ra`, `Ke` |
| Retrograde | a rule drawn beneath the abbreviation |
| Lagna | a bold rule beneath house 1 |
| Empty house | house number and sign number only |

Both markers are geometry, not glyphs and not colour. Both survive monochrome
printing and neither depends on a font. A test measures the largest channel
spread in the rendered image and requires it to be ≤ 12, i.e. gray.

### Abbreviation registry

Declared once in `chartModel.ts`, never assembled at draw time:

| Graha | EN | HI | Full EN | Full HI |
|---|---|---|---|---|
| Sun | Su | सू | Sun | सूर्य |
| Moon | Mo | चं | Moon | चन्द्र |
| Mars | Ma | मं | Mars | मंगल |
| Mercury | Me | बु | Mercury | बुध |
| Jupiter | Ju | गु | Jupiter | गुरु |
| Venus | Ve | शु | Venus | शुक्र |
| Saturn | Sa | श | Saturn | शनि |
| Rahu | Ra | रा | Rahu | राहु |
| Ketu | Ke | के | Ketu | केतु |
| Lagna | Lg | ल | Lagna | लग्न |

Three label modes: `EN`, `HI`, `BILINGUAL` (both scripts, e.g. `Ma/मं`).

## 6. Fonts

Devanagari is drawn with the embedded `NotoSansDevanagari-Regular.ttf`, the
font already approved for the report. It is not taken from the operating
system.

Two guards:

- `drawChartToPdf` refuses to draw a Hindi or bilingual chart when the
  embedded font is unavailable, rather than emitting boxes or blanks.
- A test measures the ink of two different Devanagari words. Identical ink
  means both fell back to the same tofu box, so the test fails. It also
  compares the font's advance width against a font with no Devanagari at all.

## 7. Visual QA status

**NOT PERFORMED by the authoring agent.** The agent that built this has no
vision capability and could not inspect the generated images. The following
are provided for a human owner to review:

```
artifacts/scholar-kundli/owner-review/d1-en.svg        d1-en.png  d1-en@2x.png
artifacts/scholar-kundli/owner-review/d1-hi.svg        d1-hi.png  d1-hi@2x.png
artifacts/scholar-kundli/owner-review/d1-bilingual.svg …
artifacts/scholar-kundli/owner-review/d9-en.svg        d9-en.png  d9-en@2x.png
artifacts/scholar-kundli/owner-review/d9-hi.svg        …          d1-en-small.png
artifacts/scholar-kundli/priya-1995-gk-negative.p*.png   (per page, 19 pages)
```

What *was* verified programmatically, without eyes:

- `auditChartLayout`: labels outside their house, overlapping boxes, clipping,
  missing or duplicated grahas, out-of-band font sizes — **0 issues** on the
  reference chart in EN, HI and BILINGUAL, for D1 and D9, at both PDF and SVG
  sizes.
- Every house region carries ink near its centroid (no house drawn blank).
- The image is monochrome within the stated tolerance.
- Nothing is drawn outside the viewBox, at 220 px through 900 px.
- The SVG contains no `<image>`; the PDF chart path contains no image operator.
- Identical inputs produce byte-identical SVG and identical layout JSON.

Programmatic checks cannot tell you a chart looks right. They can only prove
the absence of specific defects. Human review remains required.

## 8. Defects found while building this

1. **The four kendra houses were drawn as triangles.** They are kites. The
   twelve regions summed to 7 500 of 10 000 square units — a quarter of the
   chart had no region at all, and the diamond houses had half the space they
   should. Found by the tiling test; corroborated by the label positions in the
   chart this module replaced, which sat at (50, 25), (25, 50), (50, 75),
   (75, 50) — the centroids of the kites.
2. **The chart was sized in points on a millimetre surface.** A 300 "point"
   chart became 300 mm, exceeding the 266 mm usable page height and stalling
   pagination with `KUNDLI_PAGINATION_STALLED`.
3. **Empty houses were briefly drawn with no labels at all**, after a
   refactor moved a `continue` above the house and sign labels. Found by the
   ink-per-house check.
4. **Labels escaped their house triangles** in the first layout, which used
   bounding-box height as available height. Replaced with an inner-polygon
   model and explicit baseline bookkeeping.
5. **Every graha's dignity was reported NEUTRAL**, including Venus in Taurus.
   The canonical model read boolean flags that no snapshot populates instead of
   the engine's own dignity string. Corrected, and `MOOLATRIKONA` is now a
   distinct value rather than folded into own sign. See SCHOLAR-SUMMARY-v1.md.

## 9. Known limitations

- Only D1 and D9 are drawn. The other fourteen vargas are neither verified nor
  offered, and are listed as not calculated.
- The retrograde rule is drawn beneath the abbreviation, not through it. In the
  unlikely case of four grahas in one house the columns are narrow but no graha
  is dropped; the textual table beside each chart remains the authoritative
  list.
- Devanagari in the *PDF* is verified by text extraction and font embedding,
  not by pixel inspection of the rendered page (no PDF rasteriser that reports
  glyph coverage was available to the authoring agent). The SVG path was
  verified at pixel level.
- Print-scale, grayscale and high-contrast rendering were checked
  programmatically on the SVG and canvas paths. A print shop proof has not
  been made.
