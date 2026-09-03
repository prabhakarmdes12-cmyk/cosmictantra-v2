# Scholar Kundli report schema — v1

The structure of a delivered report: the sections, their order, the block
kinds each may contain, and the invariants that hold over all of them.

This document is **executable**. `tests/kundli-pipeline/report-schema.spec.ts`
parses the table in §2 and asserts it against a report built from the
reference chart. If the code changes without this document changing, or the
document changes without the code changing, the test fails. Neither is allowed
to drift from the other.

Schema version: `kundli-report-v1` (see `REPORT_MODEL_VERSION` in
`src/lib/kundli/reportModel.ts`).

---

## 1. Structure

A report is a `KundliReportModel`: an ordered list of sections. A section has
an `id`, a `title`, a `status`, and an ordered list of blocks. A block is one
of seven kinds.

| Kind | Fields | Purpose |
|---|---|---|
| `heading` | `level` 1–3, `text` | Section and sub-section titles |
| `paragraph` | `text` | Prose |
| `keyValue` | `label`, `value` | One calculated or stated fact per row |
| `table` | `columns`, `rows` | Structured data — placements, dasha, evidence |
| `chart` | the validated chart model | Drawn as vector output; never rasterised |
| `callout` | `text`, `tone` | Warning, information, or remedial note |
| `divider` | — | Visual separation |
| `pageFooter` | `text` | Repeated footer |

A section may also carry `pageBreakBefore: boolean`, which asks the renderer
to start it on a fresh page. It is presentation only: it changes where content
falls and never what it says. The Scholar Summary sets it, so that the page a
reader turns to first is not half a passport.

There is no eighth kind. A block carries no styling of its own beyond
`heading.level` and `callout.tone`, which is what makes the same report
renderable to PDF, HTML and text without a per-surface layout.

---

## 2. Sections, in delivery order

Counts are from the reference chart: Priya, 1995-06-15 10:30, Patna
(25.5941, 85.1376, +5.5). Other charts will differ in block counts — a chart
with a different number of yogas produces a different number of tables in
`major-yogas` — so the test compares the **set of kinds** per section, not
the counts. The counts below are documentation, not a contract.

| # | Section id | Title | Status | Blocks in the reference report |
|---|---|---|---|---|
| 1 | `cover` | Cover | READY | heading ×1, keyValue ×4, paragraph ×1 |
| 2 | `birth-data-passport` | Birth Data Passport | READY | heading ×3, keyValue ×21, paragraph ×2 |
| 3 | `scholar-summary-1` | Your chart at a glance | READY | heading ×1, keyValue ×14, paragraph ×1 |
| 4 | `scholar-summary-2` | What deserves attention | READY | heading ×4, keyValue ×16, paragraph ×5 |
| 5 | `birth-summary` | Birth Summary | READY | keyValue ×9 |
| 6 | `d1-chart` | D1 Rashi — north indian chart | READY | chart ×1, keyValue ×6, paragraph ×1 |
| 7 | `d1-placement-table` | D1 placements as text | READY | paragraph ×1, table ×1 |
| 8 | `d9-chart` | D9 Navamsha — north indian chart | READY | chart ×1, keyValue ×6, paragraph ×1 |
| 9 | `d9-placement-table` | D9 placements as text | READY | paragraph ×1, table ×1 |
| 10 | `panchanga` | Panchanga | READY | keyValue ×8 |
| 11 | `planetary-positions` | Planetary Positions | READY | paragraph ×1, table ×1 |
| 12 | `house-positions` | House Positions | READY | table ×1 |
| 13 | `bhava-graha-matrix` | Bhava–Graha Matrix | READY | paragraph ×2, table ×1 |
| 14 | `vimshottari-dasha` | Vimshottari Dasha — 9 Mahadashas | READY | paragraph ×1, table ×1 |
| 15 | `current-dasha` | Current Dasha Period | READY | divider ×1, heading ×1, keyValue ×3, table ×1 |
| 16 | `lagna-analysis` | Lagna Analysis | READY | keyValue ×2, paragraph ×1 |
| 17 | `moon-analysis` | Moon Analysis | READY | keyValue ×2, paragraph ×1 |
| 18 | `nakshatra-analysis` | Janma Nakshatra Analysis | READY | keyValue ×2, paragraph ×1 |
| 19 | `major-yogas` | Major Yogas | READY | divider ×11, heading ×11, keyValue ×142, paragraph ×1, table ×10 |
| 20 | `dosha-analysis` | Dosha Analysis | READY | keyValue ×3, paragraph ×1 |
| 21 | `career` | Career | READY | keyValue ×2, paragraph ×1 |
| 22 | `finance` | Finance & Wealth | READY | keyValue ×2, paragraph ×1 |
| 23 | `relationships` | Relationships & Partnership | READY | keyValue ×2, paragraph ×1 |
| 24 | `family` | Family & Home | READY | keyValue ×2, paragraph ×1 |
| 25 | `health` | Health & Vitality | READY | keyValue ×2, paragraph ×1 |
| 26 | `education` | Education & Intellect | READY | keyValue ×2, paragraph ×1 |
| 27 | `spiritual-tendencies` | Spiritual Tendencies | READY | keyValue ×2, paragraph ×1 |
| 28 | `current-period` | Current Period — Interpretation | READY | keyValue ×2, paragraph ×1 |
| 29 | `near-term-themes` | Near-Term Themes | READY | keyValue ×2, paragraph ×1 |
| 30 | `remedies` | Remedies | READY | keyValue ×2, paragraph ×1 |
| 31 | `calculation-method` | Calculation Standard | READY | keyValue ×11 |
| 32 | `appendix-calculation-notes` | Appendix — Calculation Notes | READY | keyValue ×7, paragraph ×2 |
| 33 | `calculation-certificate` | Calculation Certificate | READY | callout ×1, heading ×7, keyValue ×14, paragraph ×11, table ×1 |
| 34 | `disclaimer` | Disclaimer | READY | paragraph ×2 |

---

## 3. Invariants

These hold for every delivered report, and each is asserted by a test.

**INV-S1 — Order is fixed.** The thirty-four sections appear in the order
above, every time. A reader who has seen one report knows where to find
things in the next.

**INV-S2 — Ids are unique.** No section id repeats.

**INV-S3 — No unknown kinds.** Every block's kind is one of the eight above.
(The eighth, `pageFooter`, is emitted by the renderer and does not appear in
the model.)

**INV-S4 — Mandatory sections are non-empty.** `scholar-summary-1`,
`scholar-summary-2`, `birth-summary`, `calculation-method`, `panchanga`,
`planetary-positions`, `vimshottari-dasha`, `current-dasha` and `disclaimer`
must each exist with status `READY` and at least one block. Violating this
throws `KUNDLI_REPORT_INCOMPLETE` and no PDF is produced.

**INV-S5 — A chart is always accompanied by its text.** `d1-chart` is followed
by `d1-placement-table`, and `d9-chart` by `d9-placement-table`. A drawing
alone is not accessible and cannot be checked by a screen reader.

**INV-S6 — Evidence ids are stable and opaque.** Ids take the forms
`FACT-*`, `CHART-D1-*`, `CHART-D9-*`, `DASHA-*`, `YOGA-*`, `DOSHA-*`,
`SOURCE-*`. They are stable between identical generations and never contain a
database id, a file path, or a person's name.

**INV-S7 — The certificate closes the report.** `calculation-certificate`
states what was calculated, what was interpreted, what was **not** calculated,
which source locators are unverified, and that interpretations are not
guarantees. It is followed only by the disclaimer.

**INV-S8 — Bounded length.** No report exceeds `maxPages = 40`. The layout
engine also refuses to emit a runaway document; the 454-page regression is
covered by a test.

**INV-S10 — No section repeats its own title.** The renderer draws the section
title as a heading. A first block that repeats it verbatim puts the same words
on the page twice, which reads as a layout bug rather than as emphasis. The
renderer skips such a block.

**INV-S9 — No personal data in logs.** Section content never appears in
observability output; only counts, ids and hashes.

---

## 4. What is not in the schema

Deliberately absent, and why:

- **No styling.** No colours, fonts or positions in the model. Those belong to
  the renderer, so the same model can be printed, read on a phone, or read
  aloud.
- **No probability or confidence fields.** A confidence number on an
  interpretation invites a reader to treat 70% as a forecast. Interpretations
  are labelled as interpretation, not scored.
- **No prediction fields.** There is no field whose value is an event. Life
  areas carry themes, not outcomes.
- **No raster image blocks.** The `chart` block carries the validated model;
  the renderer draws it as vector. Nothing embeds a bitmap.
- **No free-text clinical, legal or financial advice.** `remedies` carries
  traditional suggestions only, in a `callout` with the limitation stated.

---

## 5. Changing this schema

Adding a section, removing one, or changing the order is a breaking change to
every stored report fingerprint. Do it in one commit, update §2, and let the
conformance test tell you whether the code and the document agree.
