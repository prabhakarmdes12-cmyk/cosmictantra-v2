# 12 — Two Independent QA Classes

Harness: [`tests/kundli-v40/qa/pdfInspect.ts`](../../tests/kundli-v40/qa/pdfInspect.ts)

The brief's central QA claim is that **text extraction alone cannot detect bad
glyph shaping**, and it is exactly right. V40's PDF extracted perfectly: every
Devanagari codepoint was present, in order, in the correct font. The page was
unreadable. Extraction reads the *codepoints a PDF says it drew*; shaping is
about *where the glyphs actually landed*.

So there are two classes, and neither may stand in for the other.

---

## Class 1 — SEMANTIC QA

Reads text back out of the finished PDF and compares it to ground truth.

| Check | Where |
|---|---|
| Golden values (lagna, all nine grahas, dasha, yogas) appear on the page | `renderer-v3.spec.ts` |
| `NOT_CALCULATED` is never rendered as `ABSENT` | `renderer-v3.spec.ts` |
| No U+FFFD, no lone surrogates, no stray control characters | `renderer-v3.spec.ts` |
| The model is byte-identical between pipeline v2 and v3 | `renderer-v3.spec.ts` |
| Part A carries no engineering residue — checked on the **rendered pages**, not just the model | `renderer-v3.spec.ts` |
| Every §4 string survives the round trip | `typography.spec.ts` |
| DMS on consultation pages, decimals in the appendix | `dms.spec.ts` |

### 1.1 The shaped-text problem, and `shapedText.ts`

Extracted Devanagari comes back in **visual order**: `सिंह` extracts as
`िसंह`. A naive `text.includes('सिंह')` therefore fails on a *correctly*
rendered page — and, worse, would pass on an incorrectly rendered one.

[`pdf/shapedText.ts`](../../src/lib/kundli/v40/pdf/shapedText.ts) models the
reordering with exactly **two rules**, both of which are properties of the
Devanagari script rather than of any particular word:

1. a pre-base matra `ि` (U+093F) moves to the front of its cluster;
2. a cluster-initial reph (`र` + virama), when a consonant follows, moves to
   the end of the cluster.

Validated against all 23 fixture strings. `कुण्डली`, `नक्षत्र`, `महादशा`,
`उत्तराषाढ़ा` and `शुक्र` are unaffected, which matters: a normaliser that
reordered eagerly would mask real bugs.

`verifyExtraction(expected, pageText)` returns `shapedSequenceFound`,
`codePointsPreserved` and a `corruption[]` list. It is deliberately strict
enough to **fail on unshaped output** — `shaping.spec.ts` asserts that the
logical-order string (what renderer v2 produced) is rejected.

> This is a QA artifact. The renderer never calls it. If it ever did, the
> renderer would be reordering Unicode, which the brief forbids.

---

## Class 2 — VISUAL QA

Rasterises pages with MuPDF (WASM) and reads pixels.

`npm install canvas` fails here (node-gyp), so pdfjs-dist cannot rasterise;
MuPDF is the working path. It must be reached through a dynamic `import()` —
Playwright's CJS transpile cannot `require()` an ESM graph with top-level
await — so every rasterising helper is async.

### 2.1 Blocking: structural checks

`structuralAudit()` — machine-visible defects, no reference image needed:

| Code | Catches |
|---|---|
| `TEXT_OUTSIDE_HORIZONTAL_MARGIN` / `..._VERTICAL_MARGIN` | clipping, overflow |
| `TEXT_BELOW_MINIMUM_SIZE` | illegible type |
| `REPLACEMENT_CHARACTER` | script mis-routing |
| `UNEXPECTED_FONT` | font substitution |
| `TEXT_OVERLAP` | collisions — the signature of measuring one string and drawing another |
| `ORPHAN_HEADING` (`findOrphanHeadings`) | a heading stranded at the foot of a page |

Plus, in `visual.spec.ts`: every page has ink in a plausible range (a blank
page passes every text check), no ink within 6 mm of the trim, and the chart
squares contain an amount of ink consistent with an actual diagram.

Two calibrations were needed, and both are documented in the code:

- **MuPDF floors reported font sizes** to whole points. The legibility check
  compares against the floored threshold, which is conservative in the safe
  direction.
- **A line's bbox is its FONT bbox, not its ink bbox.** It reaches to the
  ascender and descender even when no glyph in it does, so two tightly leaded
  lines of digits report ~2 pt of overlap with clear white space between them.
  The vertical tolerance is therefore proportional to type size (`0.45 em`).
  A fixed 1.2 pt tolerance produced 33 false positives on the chart pages and
  would have buried a real collision in noise.

### 2.2 Non-blocking: pixel diffs

`diffRasters()` returns a fraction; `snapshot()` writes the current raster,
compares to a committed baseline, and **creates a missing baseline rather than
failing**. Drift is printed, never thrown. Per the brief, pixel diffs are not a
hard blocker — fonts get rebuilt and rasterisers change their antialiasing, and
a suite that cries wolf gets disabled within a month.

Baselines live in `tests/kundli-v40/visual-baseline/` because `artifacts/` and
`scratch/` are gitignored, and an uncommitted baseline is not a baseline.
`visual.spec.ts` asserts that directory is not excluded by `.gitignore`.

### 2.3 What is baselined

The nine pages §7 requires — cover, passport, scholar snapshot, D1, D9, graha
table, yoga dashboard, Vimshottari, first appendix page — plus all six
typography fixture pages and all four chart-shape stress pages. Pages are
located **by section title, not by page number**, so inserting a page upstream
cannot silently start baselining the wrong thing.

---

## A defect this harness found in itself

`renderPage()` originally returned MuPDF's `getPixels()` result directly. That
is a typed-array **view into WASM linear memory**, and the next allocation
large enough to grow that memory detaches it. A detached view reports length 0
— which every downstream check read as *"the page is blank"* rather than as an
error. Pages 3–6 of the typography fixture were being silently skipped.

Fixed by copying at the boundary; `inkCoverage` now throws
`KUNDLI_QA_EMPTY_RASTER` on an empty sample array rather than returning 0. The
lesson generalises: **a QA check that cannot fail loudly will eventually pass
quietly.**
