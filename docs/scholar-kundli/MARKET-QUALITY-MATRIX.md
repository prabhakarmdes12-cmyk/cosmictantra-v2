# Quality matrix — observable qualities only

## What this is not

This is not a competitor comparison. Producing one would require access to
other products, and describing capabilities that were not observed is
fabrication with a table around it. Nothing here says how this product
compares to anything on the market.

It is two things that can be established without guessing:

1. **Differential parity** against the one independent external reference
   this repository holds.
2. **A self-assessment on observable qualities**, each stating how it was
   verified — by test, by a human, or not at all.

---

## 1. Differential parity against an external reference

The reference is a third-party report, not an authority:

- **Source**: AstroSage Kundli, 56-page detailed report
- **Subject**: Prabhakar, 1989-05-26, 02:20:30, Bilaspur, Chhattisgarh
  (22.0797, 82.1391), UTC+5:30
- **Settings matched**: Lahiri (Chitra Paksha) ayanamsha, mean node, equal-sign
  houses, 365.25-day dasha year
- **Fixture**: `tests/fixtures/external/astrosage-prabhakar-1989.json`
- **Suite**: `tests/astrosage-differential-benchmark.spec.ts`

**This is one report for one person.** It is not independent astronomical
validation, and it does not establish that any value is correct. It
establishes that this engine reproduces one other implementation's output to
the tolerances below.

| # | Quantity compared | Tolerance | Result | Measured |
|---|---|---|---|---|
| 1 | Lagna rashi and degree | Exact | Agree | Meena (Pisces), 16° 54′ |
| 2 | Moon rashi, nakshatra and pada | Exact | Agree | Makara, pada as referenced |
| 3 | Tithi, yoga, karana | Exact | Agree | Shashthi, Brahma, Gara |
| 4 | Sunrise | ±2 min | Agree | **0.4 min** (05:18 vs 05:18:24) |
| 5 | Sunset | ±2 min | Agree | **1.2 min** (18:37 vs 18:38:12) |
| 6 | Nine graha positions | ±1 arcmin | Agree | Within tolerance |
| 7 | D9 navamsha placements | Exact | Agree | All nine |
| 8 | Vimshottari dasha balance and sequence | Exact | Agree | Balance and order |
| 9 | Shadbala strengths against minimum thresholds | — | Agree | Computed, not delivered |
| 10 | Dosha and yoga verdicts | — | Agree | Against the referenced set |

Six of six test groups pass.

### The sunset discrepancy, and the test that hid it

For a long time this suite carried a permanent failure. The sunset assertion
was an exact substring match:

```ts
// Sunrise & Sunset (within ±2 minutes astronomical topocentric precision)
expect(snapshot.birthPanchang.sun.sunset).toContain('06:38');
```

The engine produces `06:37 PM`. The reference says `18:38:12`. The delta is
1.2 minutes — inside the two-minute tolerance the comment declares on the
line above, and outside the exactness the assertion demands.

A failing test that measures the wrong thing is worse than no test: it trains
everyone to ignore the suite. It now compares parsed times against the
tolerance it always claimed, records both measured deltas, and fails only if
the delta exceeds two minutes. The engine was not changed; the discrepancy was
not hidden, it is stated in the table above.

Two independent implementations computing topocentric sunrise differ by a
minute or so depending on refraction, solar disc radius and whether elevation
is applied. That is the size of what is being measured here.

---

## 2. Self-assessment on observable qualities

Each row states how the claim was checked. "By test" means an executable test
asserts it. "Not verified" means it is currently an assertion with nothing
behind it.

### Calculation

| Quality | Status | How verified |
|---|---|---|
| Deterministic: same input, same output, byte-identical | By test | Layout determinism test; content hash in the certificate |
| Host-timezone independent | By test | Whole pipeline suite under UTC, Asia/Kolkata, America/New_York |
| Birth time parsed as wall-clock, not host-local | By test | Wall-clock tuple parsing, DST heuristic replaced by IANA transition |
| D1 placements agree with the canonical model | By test | 14 gate checks, 11 fault injections |
| D9 navamsha placements agree | By test | Boundary fixtures below/at/above transition |
| Dasha dates host-independent | By test | TZ matrix |
| Yogas fail closed rather than guessing | By test | Rule-evaluated engine, fail-closed contract |
| Divisional charts beyond D1/D9 | **Not verified** | Computed, not delivered; see `VARGA-AUDIT.md` |
| Shadbala, Ashtakavarga, Jaimini, Ashtakoota, Gochara | **Not verified** | Computed internally, not delivered, declared as such |
| Source locators | **Not verified** | No licensed edition held; see `SOURCE-VERIFICATION.md` |

### Honesty of presentation

| Quality | Status | How verified |
|---|---|---|
| A contradiction blocks delivery rather than being rendered | By test | Runtime consistency gate; `pdfBuffer:null` |
| Calculated fact separated from interpretation | By test | Three-level summary, structurally enforced |
| Interpretations carry source, section and limitation | By test | Gate check; registry entries carry all four links |
| Unverified locators disclosed in the report | By test | Certificate and per-yoga entries |
| Nothing advertised that is not delivered | By test | Varga audit asserts no unverified varga is named |
| Not-calculated items counted, from a single source list | By test | Count derives from the same list the code uses |
| Only PRESENT yogas summarised | By test | Gate check `CG_SUMMARY_YOGA_STATUS` |
| No predicted events anywhere in the report | By test | Whole-report scanner wired into the gate |
| Certificate states what was and was not calculated | By test | Certificate section, gate-checked |
| Evidence ids carry no db id, path or personal name | By test | Schema conformance test |

### Language and accessibility

| Quality | Status | How verified |
|---|---|---|
| Bilingual labels on charts | By test | EN / HI / mixed fixtures; Hindi grid places grahas identically |
| Devanagari rendered, not tofu | By test | Glyph test against tofu baseline |
| No OS-font dependence | By test | Embedded font; a Hindi chart refuses to draw rather than emit boxes |
| Every chart has a textual equivalent | By test | Gate check; placement tables adjacent to charts |
| Full report translated | **Partial** | Hindi covers charts, the two placement tables and the matrix. The other 27 sections remain English, and the gate reports this as `CG_BILINGUAL_PARTIAL` rather than implying otherwise |
| Screen-reader behaviour | **Not verified** | No assistive-technology testing was performed |

### Output

| Quality | Status | How verified |
|---|---|---|
| Vector charts, never rasterised | By test | No `<image>` in any SVG; no image operator on the PDF chart path |
| Page count bounded | By test | `maxPages = 40`; runaway regression tested |
| No blank pages | By test | Measured: 0 of 19 |
| Charts legible and correctly laid out | **Not verified** | Geometrically checked, never seen; see `VISUAL-QA.md` |
| Print output at 100% | **Not verified** | No print, no proof |
| Mobile and narrow-viewport rendering | **Not verified** | No browser available; tests skip |
| Grayscale and high-contrast rendering | Partially | Measured on rasterised output, not in a real viewer |

---

## 3. Qualities that cannot be self-assessed at all

Stated plainly, because a matrix that omits them implies they were
considered and passed:

- **Whether the interpretations are right.** The engine implements the rules
  it registered. Whether those rules are the correct reading of the tradition
  is a scholarly question, and no licensed edition is held to answer it.
- **Whether the charts look good.** No one has looked at them.
- **Whether the report is useful to a reader.** No reader has been asked.
- **Whether it is better than any alternative.** Not measured, and not
  measurable from here.

---

## 4. Reading this table

Three columns would be dishonest; the statuses are: **verified by test**,
**verified by nothing**, and **partial**. The middle one is the important
one, and it is where most of the remaining work is.

Any claim in marketing copy, a product page or a conversation with a customer
should be traceable to a row above. If it is not, it is either in section 3
or it is not true.
