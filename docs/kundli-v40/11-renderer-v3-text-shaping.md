# 11 — Renderer v3: Real Text Shaping

Implementation: [`src/lib/kundli/v40/rendererV3.ts`](../../src/lib/kundli/v40/rendererV3.ts)
(`kundli-pdf-renderer-v3`), pipeline
[`pipelineV3.ts`](../../src/lib/kundli/v40/pipelineV3.ts) (`generateKundliV41Pdf`).

Renderers v1 and v2 are untouched and still ship. `/report` still calls v1.

---

## 1. The defect this exists to fix

V40 shipped with one failing release gate: **Devanagari glyph shaping**.

jsPDF has no complex-text layout. It maps codepoints to glyphs one at a time
and advances by each glyph's width. For Latin that is nearly always right. For
Devanagari it is wrong in ways that are not cosmetic:

| Requirement | What jsPDF did |
|---|---|
| `सिंह` — the *i* matra is written **before** the consonant it follows | drew `स` then `ि`, producing a nonsense sequence |
| `नक्षत्र` — `क्ष` and `त्र` are single conjunct glyphs | drew the components side by side with visible viramas |
| `अन्तर्दशा` — the reph rides **above** the following consonant | drew `र्` inline |
| `है` — the vowel sign attaches to a specific anchor on `ह` | positioned by advance width, so the mark drifted |

There was also a second, unrelated jsPDF bug: a Latin letter following
Devanagari silently truncated the rest of the string, and any non-WinAnsi
character (`→ ′ ✓ ✗ ◇ ○`) flipped jsPDF into a UTF-16 path that garbled the
whole run.

None of this is fixable by patching strings. The brief forbids per-word
patches, manual reordering and language-specific hacks, and it is right to:
every such patch is a hardcoded answer to one word, and there are tens of
thousands of words.

**A shaping engine is the only correct fix.**

---

## 2. Why not headless Chromium

The brief's preferred option was HTML/CSS → headless Chromium → `printToPDF`,
and on a normal machine that would be the right choice: Chromium embeds
HarfBuzz, and CSS gives real typography for free.

It was not available here.

```
npx playwright install chromium   →  ECONNRESET (cdn.playwright.dev unreachable)
which chromium chromium-browser google-chrome  →  nothing
```

There is no system browser in this environment and no way to fetch one. A
renderer that cannot be run cannot be validated, and an unvalidated renderer is
worth less than the broken one it replaces.

So the alternative path in the brief was taken, against its stated bar:
*demonstrably supports Devanagari shaping, mixed runs, Unicode symbols, font
embedding, deterministic pagination, selectable text and vector graphics.*

## 3. What was chosen: pdfkit + fontkit

| Requirement | How v3 meets it | Evidence |
|---|---|---|
| Devanagari shaping | **fontkit** runs the OpenType GSUB/GPOS tables — the same engine Chromium's ancestor used, and the one pdfkit delegates to | `tests/kundli-v40/shaping.spec.ts` asserts the pre-base matra of `सिंह` is emitted first |
| Mixed Latin + Devanagari | `FontStack.runsFor()` splits a string into maximal same-face runs at script boundaries, never inside a syllable | `shaping.spec.ts` |
| Unicode symbols | a coverage-checked fallback to DejaVu Sans | `typography.spec.ts` |
| Font embedding | pdfkit subsets and embeds every face | `structuralAudit` rejects any face outside the allow-list |
| Deterministic pagination | `PaginationController`, fixed `creationDate` | `renderer-v3.spec.ts` pins the reviewed 38-page qualified fixture |
| Selectable text | real text operators, not outlines | every page yields extractable lines |
| Vector graphics | charts and rules are drawn paths | `visual.spec.ts` measures ink inside the chart square |

The trade is real and worth stating: pdfkit gives no CSS. Every rule, column
width and leading value is arithmetic in `surface.ts`. That is more code than a
stylesheet, but it is also why pagination is exactly reproducible.

---

## 4. The font stack

`src/lib/kundli/v40/pdf/fontStack.ts` — ten roles, all in `public/fonts/v3/`:

| Role | Face |
|---|---|
| `serif` / `serifBold` / `serifItalic` | EB Garamond |
| `sans` / `sansBold` | Noto Sans |
| `devaSerif` / `devaSerifBold` | Noto Serif Devanagari **2.006** |
| `devaSans` / `devaSansBold` | Noto Sans Devanagari **2.006** |
| `symbol` | DejaVu Sans |

Devanagari is split by family so a serif paragraph gets serif Devanagari. The
old single-face arrangement set Hindi in a sans face inside Garamond text,
which looked like a substitution because it was one.

### 4.1 The 2.002 crash — why the version number matters

Noto Devanagari **2.002** (still present in `public/fonts/` for v1 and v2)
contains **NULL GPOS mark anchors**. That is legal OpenType; HarfBuzz skips
them. fontkit dereferences them:

```
TypeError: Cannot read properties of null (reading 'xCoordinate')
    at node_modules/fontkit/dist/main.cjs:9989
```

It throws on `ह` + `ै` — that is, on **`है`**, one of the most common words in
Hindi. Every report containing a Hindi sentence failed to render.

Fixed by vendoring 2.006. **Do not downgrade these files, and do not
monkey-patch fontkit** — the guard is
`shaping.spec.ts › the Devanagari faces are new enough to shape है`.

### 4.2 Coverage is checked, never assumed

`roleForCodePoint` asks each face `hasGlyphForCodePoint` before using it, and
`runsFor` **throws** when nothing can draw a character:

```
KUNDLI_FONT_COVERAGE_MISSING: no embedded face can draw U+4E2D
```

A failed build is better than a `.notdef` box in a Pandit's chart. This also
gives QA a detector: Latin drawn in the Devanagari face yields `.notdef`, which
MuPDF extracts as U+FFFD, so `REPLACEMENT_CHARACTER` in the structural audit is
a genuine script-routing alarm.

---

## 5. KUNDLI_INV_RENDER_001 — the renderer derives no Jyotish facts

Enforced in [`render-invariant.spec.ts`](../../tests/kundli-v40/render-invariant.spec.ts),
two ways, because either alone is defeatable:

**Statically** — the renderer may not import any derivation module, may not
mention a rashi, nakshatra or yoga name in executable code, and may not call
`Math.sin/cos/tan/atan`, `Date.parse` or `toISOString`.

**Behaviourally** — the renderer is fed a model asserting the Sun is in house
99, a dignity of `EXALTED_AND_DEBILITATED`, a lagna at `412°71′` and a dasha
balance of `-3y 14m 40d`, and every impossible value must come out of the PDF
unchanged, with nothing added. *A renderer cannot both invent facts and
faithfully reproduce nonsense.* Two more probes check that an empty model
yields an empty document and that an incomplete chart model is **reported**
("Chart not drawn … reported rather than approximated") rather than filled in.

---

## 6. Known limits

- **Extraction returns visual order, not logical order.** This is inherent: the
  PDF stores the shaped glyph sequence. `/ActualText` BDC spans were tried and
  abandoned (pdf.js dropped the rest of the page; MuPDF duplicated characters).
  QA handles it with a small, documented model in
  [`pdf/shapedText.ts`](../../src/lib/kundli/v40/pdf/shapedText.ts) — see doc 12.
  **The renderer never calls it.** It is a QA-only artifact.
- **No CSS.** Layout changes are code changes.
- **MuPDF floors reported font sizes** to whole points, so the legibility gate
  compares against the floored threshold.
