# 03 — Visual Design System

Implementation: [`src/lib/kundli/v40/tokens.ts`](../../src/lib/kundli/v40/tokens.ts)
(`KundliPdfTokens`) and [`rendererV2.ts`](../../src/lib/kundli/v40/rendererV2.ts).

Renderers read tokens. There are no magic numbers in the renderer, and no
measurement is declared twice.

## Page

A4 portrait, 210 × 297 mm. Margins 18 mm top / 18 bottom / 16 left / 16 right,
giving a 178 mm content column. Content stops at y = 277 mm; the footer sits at
286 mm. Vertical rhythm unit 1.2 mm; body line 4.4 mm, tight line 3.8 mm.

## Type

| Role | Size (pt) |
|---|---|
| Cover title | 26 |
| Section title | 15 |
| Heading 2 / 3 | 12 / 10 |
| Body | 9.5 |
| Small | 8.4 |
| Table | 8.2 |
| Micro (footnotes, captions) | 7.2 |
| Footer | 7 |

Nothing is smaller than 7 pt. Latin is Helvetica; Devanagari is
Noto Sans Devanagari, with the **real bold face** registered when it is present
on disk (v1 registered the regular face under the bold style — defect V40-D07).

## Colour

Restrained ivory / deep vermilion / antique gold, chosen to survive a
black-and-white photocopy.

| Token | RGB | Use |
|---|---|---|
| `ink` | 38, 34, 30 | body text |
| `inkSoft` / `inkFaint` | 92,86,78 / 140,133,124 | secondary, captions |
| `parchment` / `parchmentDeep` | 252,249,242 / 246,240,228 | page tint, cover |
| `vermilion` | 138, 30, 28 | section titles, present mark |
| `gold` / `goldFaint` | 158,128,62 / 214,196,152 | rules, motif, pending mark |
| `tableHeaderFill` / `tableZebra` | 243,237,224 / 250,247,240 | tables |
| `highlightFill` | 246, 235, 210 | the current dasha row |

**Colour never carries meaning on its own.** Every status is also a shape.

## Status marks — drawn, not typed

A tick from a text font is at the mercy of that font's coverage; a drawn mark
always prints. `drawStatusMark()` emits vector geometry:

| Status | Mark | Geometry |
|---|---|---|
| PRESENT | ✓ | two strokes, vermilion |
| ABSENT | ✗ | two crossed strokes, soft ink |
| SCHOLAR JUDGEMENT / INDETERMINATE | ◇ | four-stroke lozenge, gold |
| VALIDATION PENDING | ○ | circle outline, gold |
| NOT CALCULATED | — | single horizontal stroke, faint ink |

The word is always printed beside the mark, so the extracted text of the PDF
carries the status even where the glyph does not.

## Mixed-script text engine

Two jsPDF behaviours make naive text drawing unsafe (see
[`01-current-state-audit.md`](01-current-state-audit.md)): Devanagari runs
truncate at a following Latin letter, and Helvetica runs containing a
non-WinAnsi character print garbage. The renderer therefore:

1. splits every string into script runs (Devanagari / other) and whitespace;
2. sanitises non-Devanagari runs to WinAnsi (`→`→`>`, `′`→`'`, `≥`→`>=`, …);
3. measures and line-breaks run by run, so wrapping is correct for both scripts;
4. **merges adjacent same-script runs back into a single draw call**, which
   keeps kerning natural and — more importantly — makes the PDF's text layer
   contain real words with real spaces, so the document is searchable.

## Blocks

`cover`, `partDivider`, `sectionTitle`, `heading`, `paragraph`, `bullets`,
`kvGrid`, `table`, `chart`, `statusList`, `timeline`, `notesArea`, `callout`,
`divider`, `spacer`. Every block carries a `contentType`, so the epistemic
status of a line is a property of the data and not of the prose around it.

Tables repeat their header on a page break and never split a row. Headings are
never the last thing on a page (12 mm of following content is reserved).

## Pagination

`PaginationController` (shared with v1) remains the **only** component allowed
to create a page. It enforces the page ceiling, refuses zero-height blocks
(stall detection) and keeps per-page character counts for blank-page
detection. Header and footer are drawn in a final pass, once the total page
count is known, so "page 4 of 34" is honest rather than guessed.

## Print safety checklist

- A4, no bleed required, all content inside the margins.
- No colour-only meaning; verified by the drawn-mark design.
- All text selectable Unicode; asserted by the artifact test, which extracts
  the text layer and requires more than 20 characters on every page.
- Tint is a light fill, not an image; the document prints legibly with tints
  disabled (`paperTint: false`).
