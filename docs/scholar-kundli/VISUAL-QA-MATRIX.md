# Visual QA matrix

The owner asked for every rendered page to be inspected and graded. This
matrix records what was graded and what was not.

**No page below is marked PASS, because no page has been looked at.**

The agent that produced this review cannot see images, and no browser binary
could be obtained in the environment, so there was no way to look at one.
Marking a page PASS without looking at it would be inventing the result the
owner asked for. Every page is therefore `NOT_INSPECTED`, alongside the
measurements that *were* taken, so a human reviewer can open the image and
grade it in a fraction of the time it would otherwise take.

Alongside the per-page rows is a second table: the checks that could be
settled by measuring rendered pixels. Those are graded, because they were
actually performed.

---

## 1. Delivered report — 19 pages, English

| Page | Section | Lang | Visual grade | Ink % | Density band | Largest void % | Measured note | Action for the reviewer |
|---|---|---|---|---|---|---|---|---|
| 01 | Cover + Birth Data Passport | en | **NOT_INSPECTED** | 4.1 | BALANCED | 11.5 |  | Open in `final-owner-review/` and inspect |
| 02 | Scholar Summary (both pages, all three levels) | en | **NOT_INSPECTED** | 10.39 | DENSE | 5.7 |  | Open in `final-owner-review/` and inspect |
| 03 | Birth Summary + D1 chart | en | **NOT_INSPECTED** | 4.23 | BALANCED | 5.7 |  | Open in `final-owner-review/` and inspect |
| 04 | D1 placements as text | en | **NOT_INSPECTED** | 5.8 | BALANCED | 5 |  | Open in `final-owner-review/` and inspect |
| 05 | D9 chart + D9 placements | en | **NOT_INSPECTED** | 4.55 | BALANCED | 22.2 | Void before a chart or table placed on the next page. | Open in `final-owner-review/` and inspect |
| 06 | Planetary Positions | en | **NOT_INSPECTED** | 6.75 | BALANCED | 16.4 |  | Open in `final-owner-review/` and inspect |
| 07 | House Positions + Bhava–Graha Matrix | en | **NOT_INSPECTED** | 7.76 | BALANCED | 22.5 | Void before a chart or table placed on the next page. | Open in `final-owner-review/` and inspect |
| 08 | Dasha (current + antardasha) | en | **NOT_INSPECTED** | 8.13 | BALANCED | 26.8 | Void before a chart or table placed on the next page. | Open in `final-owner-review/` and inspect |
| 09 | Major Yogas — overview table | en | **NOT_INSPECTED** | 10.78 | DENSE | 4.9 |  | Open in `final-owner-review/` and inspect |
| 10 | Yoga evidence 1 | en | **NOT_INSPECTED** | 12.53 | DENSE | 10.4 |  | Open in `final-owner-review/` and inspect |
| 11 | Yoga evidence 2 | en | **NOT_INSPECTED** | 12.48 | DENSE | 5 |  | Open in `final-owner-review/` and inspect |
| 12 | Yoga evidence 3 | en | **NOT_INSPECTED** | 11.7 | DENSE | 5 |  | Open in `final-owner-review/` and inspect |
| 13 | Yoga evidence 4 | en | **NOT_INSPECTED** | 11.88 | DENSE | 5 |  | Open in `final-owner-review/` and inspect |
| 14 | Yoga evidence 5 | en | **NOT_INSPECTED** | 9.98 | DENSE | 5 |  | Open in `final-owner-review/` and inspect |
| 15 | Life areas (relationships onward) | en | **NOT_INSPECTED** | 8.46 | BALANCED | 5.7 |  | Open in `final-owner-review/` and inspect |
| 16 | Remedies | en | **NOT_INSPECTED** | 7.02 | BALANCED | 5.7 |  | Open in `final-owner-review/` and inspect |
| 17 | Certificate | en | **NOT_INSPECTED** | 7.62 | BALANCED | 37.1 | Void before a table that starts on the next page. | Open in `final-owner-review/` and inspect |
| 18 | Certificate — source locator table | en | **NOT_INSPECTED** | 8.22 | BALANCED | 6 |  | Open in `final-owner-review/` and inspect |
| 19 | Certificate tail + Disclaimer | en | **NOT_INSPECTED** | 7.61 | BALANCED | 66.7 | Trailing void — document ends here; content simply stops. | Open in `final-owner-review/` and inspect |

### The three large voids, explained

Measured, not guessed:

- **Page 19 (66.7%)** — the document ends. The certificate tail and the
  disclaimer occupy the top third; nothing follows. Not a layout bug.
- **Page 17 (37.1%)** — the certificate's "what was NOT calculated" list ends
  and its source-locator table starts on page 18 rather than splitting.
  A table that will not fit is placed whole on the next page.
- **Pages 5, 7, 8 (22–27%)** — each precedes a chart or a wide table that is
  placed on the following page rather than split.

None is an accidental void caused by a layout defect. All three are the
document ending or refusing to split a table.

---

## 2. Delivered report — 19 pages, Hindi

| Page | Section | Lang | Visual grade | Action |
|---|---|---|---|---|
| 01 | ( Hindi equivalent of page 01 ) | hi | **NOT_INSPECTED** | Open `hi-01-*.png` and compare against the English page |
| 02 | ( Hindi equivalent of page 02 ) | hi | **NOT_INSPECTED** | Open `hi-02-*.png` and compare against the English page |
| 03 | ( Hindi equivalent of page 03 ) | hi | **NOT_INSPECTED** | Open `hi-03-*.png` and compare against the English page |
| 04 | ( Hindi equivalent of page 04 ) | hi | **NOT_INSPECTED** | Open `hi-04-*.png` and compare against the English page |
| 05 | ( Hindi equivalent of page 05 ) | hi | **NOT_INSPECTED** | Open `hi-05-*.png` and compare against the English page |
| 06 | ( Hindi equivalent of page 06 ) | hi | **NOT_INSPECTED** | Open `hi-06-*.png` and compare against the English page |
| 07 | ( Hindi equivalent of page 07 ) | hi | **NOT_INSPECTED** | Open `hi-07-*.png` and compare against the English page |
| 08 | ( Hindi equivalent of page 08 ) | hi | **NOT_INSPECTED** | Open `hi-08-*.png` and compare against the English page |
| 09 | ( Hindi equivalent of page 09 ) | hi | **NOT_INSPECTED** | Open `hi-09-*.png` and compare against the English page |
| 10 | ( Hindi equivalent of page 10 ) | hi | **NOT_INSPECTED** | Open `hi-10-*.png` and compare against the English page |
| 11 | ( Hindi equivalent of page 11 ) | hi | **NOT_INSPECTED** | Open `hi-11-*.png` and compare against the English page |
| 12 | ( Hindi equivalent of page 12 ) | hi | **NOT_INSPECTED** | Open `hi-12-*.png` and compare against the English page |
| 13 | ( Hindi equivalent of page 13 ) | hi | **NOT_INSPECTED** | Open `hi-13-*.png` and compare against the English page |
| 14 | ( Hindi equivalent of page 14 ) | hi | **NOT_INSPECTED** | Open `hi-14-*.png` and compare against the English page |
| 15 | ( Hindi equivalent of page 15 ) | hi | **NOT_INSPECTED** | Open `hi-15-*.png` and compare against the English page |
| 16 | ( Hindi equivalent of page 16 ) | hi | **NOT_INSPECTED** | Open `hi-16-*.png` and compare against the English page |
| 17 | ( Hindi equivalent of page 17 ) | hi | **NOT_INSPECTED** | Open `hi-17-*.png` and compare against the English page |
| 18 | ( Hindi equivalent of page 18 ) | hi | **NOT_INSPECTED** | Open `hi-18-*.png` and compare against the English page |
| 19 | ( Hindi equivalent of page 19 ) | hi | **NOT_INSPECTED** | Open `hi-19-*.png` and compare against the English page |

The Hindi report was generated for the first time during this review; before
it, only English was ever rendered to a file.

---

## 3. Chart artifacts — 24 files

D1 and D9, in English, Hindi and mixed label modes, as SVG, PNG, PNG at 2×
and PNG at small size: `artifacts/scholar-kundli/owner-review/`.

| Group | Files | Visual grade | Action |
|---|---|---|---|
| D1 / D9 SVG (en, hi, mixed) | 6 | **NOT_INSPECTED** | Open in a browser; check geometry, label placement, Lagna rule |
| D1 / D9 PNG at review size | 6 | **NOT_INSPECTED** | Open; check crowding and wrapping |
| D1 / D9 PNG at 2× | 6 | **NOT_INSPECTED** | Open; check stroke weight and small type |
| D1 / D9 PNG small | 6 | **NOT_INSPECTED** | Open; check legibility at thumbnail size |

---

## 4. What was actually verified, by measurement

These are graded, because these checks were performed — on rasterised pixels,
not on extracted text.

| Check | Grade | Evidence |
|---|---|---|
| Bhava–Graha bullet renders as a real glyph | **PASS (measured)** | 9 near-square blobs of 5–10 px found in the matrix table, one per graha |
| Empty matrix cells render as dashes | **PASS (measured)** | 99 wide, 1–2 px blobs = 12×9 cells − 9 occupied |
| The bullet is not the unencodable U+25CF | **PASS (measured)** | U+25CF renders as the byte pair `%Ï`; U+2022 renders as a dot and is used |
| Devanagari conjuncts are formed by substitution | **PASS (measured)** | क्ष 34.2 px, ज्ञ 30.8, त्र 26.5, श्र 33.9 — all narrower than a single base consonant क at 36.6 px |
| Matras, anusvara, visarga, candrabindu, nukta render | **PASS (measured)** | Each adds ink over its own base consonant; none is dropped |
| Reph and half forms render | **PASS (measured)** | र्क 36.6 px, र्म 28.7 px, स्त 46 px, स्त्र 45.2 px |
| No page is blank or near-blank | **PASS (measured)** | Minimum ink 4.1% (page 1); threshold 1.0% |
| No page is a wall of text | **PASS (measured)** | Maximum ink 12.5% (page 10); threshold 16% |
| Nothing is clipped at the page edge | **PASS (measured)** | Content bounding box clear of a 1% safe band on all 19 pages |
| Side margins are consistent | **PASS (measured)** | Left margin spread < 2% of page width across all pages |
| Page count and order | **PASS (measured)** | 19 pages, footer marker `page N` present and correct on each |
| Scholar Summary is not orphaned | **PASS (measured)** | Heading, both sections and all three levels on page 2; heading absent from page 1 |
| Section title not printed twice | **PASS (measured)** | `Your chart at a glance` appears exactly once on page 2 |
| Hindi matrix places grahas as English does | **PASS (measured)** | Same marker counts in both languages |

---

## 5. Defects found and fixed during this review

| # | Severity | Defect | Fix |
|---|---|---|---|
| 1 | MAJOR | Scholar Summary heading stranded alone at the foot of page 1; facts on page 2; closing reflection as a widow on page 3 | Sections may request a page break; the summary now owns page 2 in full |
| 2 | MINOR | Section title printed twice in a row (renderer draws the title, block repeated it) — both summary sections, both languages | Renderer skips a leading block that repeats its own title |
| 3 | MINOR | "growth and abundance are most likely to accumulate" — a soft wealth promise the scanner cannot catch | Reworded to name the domain the tradition associates, with an explicit "nothing about amount or timing is claimed" |
| 4 | MINOR | Bhava–Graha matrix heading on page 6 with its table on page 7 | Not fixed — see §6 |

---

## 6. Defects found and deliberately not fixed

**The Bhava–Graha matrix heading is separated from its table** (heading and
intro on page 6, table on page 7).

Fixing it means either shrinking the table or forcing a further page break,
and both are aesthetic choices about a layout that has never been seen.
The mission says not to change layout for preference, and not to use visual QA
as licence for a new design language. It is recorded here for the owner to
decide, with the note that a reader sees the heading, then a page turn, then
the grid.

---

## 7. How to complete this matrix

1. Open `artifacts/scholar-kundli/final-owner-review/`, 41 files.
2. Work down §1, one page at a time. Replace `NOT_INSPECTED` with PASS,
   MINOR, MAJOR or BLOCKER and write the issue in the last column.
3. Do the same for §2 (Hindi) and §3 (charts).
4. Anything graded MAJOR or BLOCKER goes back for a fix.

Until step 2 is done, the honest grade for this document is:
`VISUAL_QA_NOT_PERFORMED`.
