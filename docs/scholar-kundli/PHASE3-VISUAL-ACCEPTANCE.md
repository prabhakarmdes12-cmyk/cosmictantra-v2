# Phase 3.6 — visual and human acceptance

The question was whether the generated Kundli looks correct, readable,
professional and honest to a human reader.

**It has not been looked at by a human, and it has not been looked at by this
agent either, which cannot see images.** What follows is what could be
established by measuring rendered pixels and by reading the text, and a clear
account of what could not. The verdict at the end does not change because of
this work. It changes only when someone opens the images.

---

## 1. Starting commit

`8f15730` — branch `arena/01a0593a-cosmictantra-v2`, clean tree, remote in
sync. Baseline re-measured rather than taken from the handoff:

```
tsc --noEmit                 clean
next build                   compiled successfully
kundli pipeline              394 passed, 5 skipped
gate suite                   88 passed
PDF                          19 pages, 0 blank, density 1.0
```

## 2. Artifacts reviewed

| Set | Count | What was done |
|---|---|---|
| `owner-review/` chart artifacts | 24 | Inventoried; **not inspected** |
| Existing page PNGs | 19 | Superseded by a fresh pack |
| `final-owner-review/` (new) | 41 | 19 EN pages, 19 HI pages, 2 PDFs, density JSON |
| D1/D9 SVG | 2 | Regenerated; **not inspected** |

The Hindi report had never been rendered to a file before this review. It has
now, and it is 19 pages like the English one.

## 3. Pages inspected

**Nineteen pages measured. Zero pages seen.**

Each page was rasterised and measured for ink coverage, content bounding box,
margins, the longest vertical void and where it starts, and whether content
touches the page edge. That is not inspection and is not offered as a
substitute for it. Per-page rows with measurements and blanks for the human
grade are in `VISUAL-QA-MATRIX.md` §1.

## 4. PASS count

**0 pages.**

Not because anything failed. Because no page was looked at, and the brief is
explicit that no page may be marked PASS without visual inspection. Marking
nineteen pages PASS on the strength of ink measurements would have produced the
number the owner asked for while quietly removing its meaning.

## 5. MINOR count

**3.**

1. Section title printed twice in a row — fixed.
2. "growth and abundance are most likely to accumulate" — fixed.
3. Bhava–Graha matrix heading on page 6 with its table on page 7 — **not
   fixed**, see §17.

## 6. MAJOR count

**1.** The Scholar Summary was spread across three pages: heading alone at the
foot of page 1, facts on page 2, closing reflection as a widow at the top of
page 3. Fixed; it is now one page.

## 7. BLOCKER count

**0.**

## 8. Hindi QA

The Hindi report is now generated and measured. Devanagari shaping was tested
directly against the embedded font rather than inferred from extraction:

| Feature | Measured |
|---|---|
| Conjuncts formed by substitution | क्ष 34.2 px, ज्ञ 30.8, त्र 26.5, श्र 33.9 — all **narrower than a single base consonant** क at 36.6 px, which sequential rendering cannot produce |
| Three-part conjunct | स्त्र 45.2 px |
| Half form and reph | स्त 46 px, र्क 36.6 px, र्म 28.7 px |
| Matras | कि, कु, के, की, कू, को, कौ all render; each adds ink over क |
| Anusvara / visarga / candrabindu | Each adds ink over its own base consonant स |
| Nukta, halant | Render with ink |
| Mixed Devanagari + Latin | राहु Ra renders |
| Devanagari digits | १२३ render |
| Words | मंगल, सूर्य, चन्द्र, राशि all render |

Classification, as asked: **no RENDERING_DEFECT was found** in the sampled
Devanagari. One **TEXT_EXTRACTION_DEFECT** was found — pdfjs does not extract
the bullet glyph from table cells (it extracts it from the legend paragraph but
not from the cells), so extraction alone would have suggested the markers were
missing when they are in fact drawn. This is precisely why the count in §10 was
done on pixels.

What remains unverified is everything a measurement cannot reach: मात्रा
placement relative to the consonant, the visual balance of संयुक्ताक्षर, and
whether the Devanagari reads as well-set type. Those need eyes.

## 9. D1 / D9 chart QA

Charts were not seen. What was measured, on the SVG and canvas paths, comes
from the existing chart suite and still passes: the twelve polygons tile the
square, no label centre falls outside its house polygon, no two label boxes
overlap, nothing clips, output is byte-identical for identical input, Devanagari
renders as glyphs rather than tofu, and rendering holds from 220 px to 900 px.

The kendra houses remain kites and have not been altered. No chart geometry was
changed during this review — the brief forbids changing it for aesthetic
preference, and nothing measured suggested it was wrong.

## 10. Bhava–Graha matrix QA

The specific question was whether the replacement bullet `•` renders. Settled
on pixels:

- **9 near-square blobs of 5–10 px** in the matrix table — one per graha.
- **99 wide blobs of 1–2 px** — the em-dashes in empty cells. 12 × 9 = 108
  cells, minus 9 occupied = 99. The arithmetic closes exactly.
- The previous marker, U+25CF, is not encoded in the PDF font and renders as
  the byte pair `%Ï`. U+2022 does render, and is what the matrix uses.

All nine grahas are present, the sign column is correct, the Hindi sign column
is genuinely Devanagari, and the table does not overflow the page.

## 11. Scholar Summary QA

This was reviewed first, as instructed, and it was where the one MAJOR defect
was found.

Before: heading stranded at the foot of page 1, content on page 2, closing
reflection widowed onto page 3.

After: **page 2 contains the heading, both summary sections, and all three
levels.** A reader gets Lagna, Moon, Nakshatra, Sun, current Mahadasha and
Antardasha, the next transition, D1/D9 lagna, present yogas, material doshas
and the not-calculated count on a single page, with the three levels under it.

Answering the brief's question — can a Pandit understand the chart in under two
minutes? — the content is all there and now all in one view. Whether it is
*legible enough* to be read that fast is a visual judgement this review cannot
make.

Two changes reduced the content: three closing reflection paragraphs became
two, and the Level 3 preamble lost a clause the disclaimer already says more
fully. Nothing was added.

## 12. Knowledge-level separation QA

The three levels are present in the rendered text as labelled headings —
"Level 1 — Calculated fact", "Level 2 — Traditional interpretation",
"Level 3 — Practical reflection" — and every interpretation additionally
carries an explicit "Interpretation source" line followed by the canonical
paths it was derived from. Separation does not depend on colour: it is carried
by headings and labels, so it survives monochrome printing and a reader who
does not know the architecture.

Could a reader mistake an interpretation for a calculation? The labels make
that unlikely, but this is a reading judgement and it has not been confirmed by
a reader.

## 13. Validation-state QA

Every occurrence in the rendered text was counted:

| Wording | Occurrences |
|---|---|
| NOT VERIFIED | 50 |
| UNVERIFIED | 16 |
| Not calculated / NOT_CALCULATED | 14 / 12 |
| CONTESTED | 14 |
| Present / Absent / Indeterminate | 17 / 25 / 2 |

Unverified material is not styled more authoritatively than verified material,
because there is no styling to abuse: the report carries no per-block colour,
weight or size beyond heading level and callout tone. That is a structural
property of the schema, not a convention someone can drift from.

## 14. Source disclosure QA

The five contested entries were checked in the *rendered report*, not in
metadata. All five now state the disagreement in words a reader sees:

- 7 `CONTESTED:` sentences appear in the delivered text
- 11 "Adopted interpretation" statements — one per rule
- 11 "Variants not applied" lists — the readings not taken

So a reader is told that scholars disagree, which reading this product took,
and what it declined to apply. The two unadopted rules report NOT_CALCULATED
rather than choosing a side.

## 15. Prediction-language human audit

The scanner passes. A human reading was done anyway, over the interpretive
sections and the whole rendered text.

**One flag**, and it was fixed: "Jupiter's placement in the 4th house indicates
where growth and abundance are most likely to accumulate" — a soft wealth
promise that no pattern-matching scanner would catch, since it contains none of
the banned words. It now reads: "indicates the domain the tradition associates
with growth and abundance. It does not say that wealth accrues, and nothing
about amount or timing is claimed."

Everything else is properly hedged — "points to", "indicates", "shapes",
"suggests", "colours". Health carries "this is a general indication, not
medical advice". Remedies are conditional and defer to a qualified advisor.
Near-term themes say "are traditionally held to come into focus… a theme, not
an event". Normal traditional statements about themes and tendencies were
deliberately left alone.

## 16. Varga disclosure QA

Checked in the rendered text:

- The appendix now reads: "Divisional charts delivered: 2 — D1 Rashi and D9
  Navamsha. These two, and only these two, are drawn and verified." and
  "Divisional charts computed but not delivered: 14 more are computed in the
  model as part of the shodashavarga set."
- `D10` appears **nowhere** in the delivered report. Nor does "Dashamsha".
- No varga outside {D1, D9} is named anywhere.

One residual was tightened: the certificate said "16 divisional charts, of
which D1 and D9 are independently cross-checked" — true, but readable as
"delivered". It now says the other 14 are not delivered and not relied on.

## 17. Cross-language consistency

The Hindi report was generated for the first time during this review. Both
reports are 19 pages and both pass the delivery gate. A test asserts the Hindi
matrix places the grahas exactly as the English one does, by counting markers
in each. Translation differs; the calculation does not.

## 18. Defects fixed

| # | Severity | Defect | Fixed |
|---|---|---|---|
| 1 | MAJOR | Scholar Summary across three pages with an orphan and a widow | Yes |
| 2 | MINOR | Section title printed twice in a row | Yes |
| 3 | MINOR | Soft wealth promise in the finance section | Yes |
| 4 | MINOR | Certificate implied 16 delivered vargas | Yes |
| 5 | MINOR | Matrix heading separated from its table | **No** — see below |

On defect 5: fixing it means either shrinking the table or forcing another page
break, and both are aesthetic decisions about a layout that has never been
seen. The brief forbids changing layout for preference. It is recorded for the
owner to decide.

## 19. Tests rerun after the fixes

```
tsc --noEmit                                 clean
next build                                   compiled successfully
kundli pipeline  TZ=UTC                      414 passed, 5 skipped
                 TZ=Asia/Kolkata             414 passed, 5 skipped
                 TZ=America/New_York         414 passed, 5 skipped
```

Up from 394: +20 visual acceptance tests. Nothing was weakened to make anything
pass. The one pre-existing failure elsewhere in the suite — the AstroSage
sunset assertion — was resolved in an earlier phase and is not touched here.

## 20. Final PDF page count

**19 pages, English. 19 pages, Hindi. 0 blank pages in either. Density 1.0.**

Page count was not defended for its own sake; the brief says not to force 19.
It happens to be unchanged, and the summary going from three pages to one did
not push anything else over.

## 21. Remaining limitations

- **Visual QA is NOT PERFORMED.** No human and no agent has looked at these
  pages. This is the whole of the limitation that matters.
- No browser was available, so print rendering, narrow-viewport behaviour and
  real-viewer grayscale were never exercised.
- PDF Devanagari is verified by shaping measurement and ink presence, not by
  looking at it.
- Measurement can prove the absence of specific defects. It cannot prove the
  document looks good, reads well, or feels like a professional scholar
  document.
- No capability was added, per the freeze. Missing capabilities are recorded as
  FUTURE_SCOPE in `PANDIT-REVIEW-GUIDE.md`.
- The report has been read by an agent, not by a Pandit. Traditional
  correctness remains unreviewed.

## 22. Recommended verdict

**`READY_FOR_INDEPENDENT_REVIEW`.**

Not stronger. This work strengthened confidence — it found and fixed a real
three-page layout defect, confirmed the bullet and the Devanagari shaping on
pixels, and removed a soft wealth promise. None of that is the same as
validating Jyotish rules that have not yet been read by a scholar, and none of
it is the same as someone looking at the page.

The next step is not another phase of work. It is for a human to open
`artifacts/scholar-kundli/final-owner-review/` and grade nineteen pages — the
matrix in `VISUAL-QA-MATRIX.md` has a blank column waiting — and for a Pandit
to work through `PANDIT-REVIEW-GUIDE.md`.

## 23. Exact diff

```
7498cd7 fix(kundli): the Scholar Summary heading was stranded alone at the foot of page 1
ab79a99 test(kundli): measure the rendered PDF instead of trusting its extracted text
```

```
 docs/scholar-kundli/REPORT-SCHEMA-v1.md         |  10 +
 src/lib/kundli/interpretation.ts                |   2 +-
 src/lib/kundli/renderer.ts                      |  28 +-
 src/lib/kundli/reportModel.ts                   |   2 +-
 src/lib/kundli/scholarSummary.ts                |  10 +-
 src/lib/kundli/types.ts                         |   7 +
 tests/kundli-pipeline/pagePixelAudit.ts         | 202 ++++++++++++
 tests/kundli-pipeline/visual-acceptance.spec.ts | 402 ++++++++++++++++++++++++
 8 files changed, 657 insertions(+), 6 deletions(-)
```

No calculation was changed. No yoga, dosha, varga, dasha or interpretation
system was added or altered. The two content edits were one sentence about
wealth and one sentence about how many vargas are delivered; both make the
report say more honestly what it already meant.
