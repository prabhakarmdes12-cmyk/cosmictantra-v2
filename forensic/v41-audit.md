# V41 — Forensic Audit

Written before any V41 code. Everything below is measured from generated
artifacts, not read off the source.

Reproduce: `tests/_tmp/` probes (deleted after the audit); measurements dated
against commit `5d6e2d5`.

---

## 0. THE RELEASE BLOCKER — why the download is still V36 / v1

### Finding: there is no download *route*. There is a client-side function call.

```
UI "Download PDF" button
  └─ src/app/report/MasterKundliReportClient.tsx:588
       handleDownloadPDF()
         └─ generateKundliPdf(raw, { locale: lang === 'hi' ? 'hi' : 'en' })
              └─ src/lib/kundli/pipeline.ts:77          ← v1 pipeline
                   └─ buildKundliReportModel()          ← kundli-report-v1
                        └─ renderer.ts (jsPDF)          ← renderer v1
                             └─ config.ts:20 engineVersion: 'V36.0'
```

There is **no `/api/kundli/...` route**. The repository has 23 API routes;
none of them generate a Kundli. The PDF is built in the browser and handed to
a `Blob`.

Measured output, golden fixture, both locales:

| | v1 (what downloads today) | v3 (what exists) |
|---|---|---|
| Pages | **19** | 39 |
| Report model | `kundli-report-v1` | `kundli-report-v2` |
| Engine string | `V36.0` | `kundli-calc-v1` |
| Fonts embedded | Helvetica, Helvetica-Bold, devanagari | EB Garamond, Noto Sans, Noto Serif Devanagari, DejaVu |

So the V40.1 work is real, tested and shipped — and completely unreachable
from the UI. Nothing "regressed"; the new path was simply never wired up.

### Why it was never wired up, and why this is not a one-line fix

Renderer v3 **cannot run in a browser**:

- `pdf/fontStack.ts:94` uses `require('node:path')` and `fs` to read the nine
  faces out of `public/fonts/v3/`;
- `renderAssets.ts:31` uses `process.getBuiltinModule('node:path')`;
- pdfkit is driven with Node `Buffer`s throughout.

That is not an oversight — embedding 1.7 MB of fonts and a shaping engine in a
client bundle would be the wrong trade anyway. **The correct fix is a server
route**, which also means the download stops depending on the client's font
availability and becomes reproducible.

### Prescription

1. `POST /api/kundli/pdf` (`runtime = 'nodejs'`), running pipeline v3.
2. Client calls it and streams the response to a `Blob`.
3. Keep v1 exactly where it is, reachable behind an explicit flag, per the
   standing "do not remove v1" constraint.
4. `DOWNLOAD_KUNDLI_CURRENT_RENDERER` — assert against the **route's actual
   bytes**, not against a constant, so a mis-wire cannot pass.

---

## 1. Part A today vs §5's required hierarchy

Measured Part A (13 sections, pages 1–16 of 39):

```
cover · kundli-passport · kundli-saar · d1-rashi-chart · d9-navamsha-chart
graha-dossier · bhava-matrix · yoga-dosha-dashboard · vimshottari-timeline
current-dasha-activation · career-synthesis · pandit-discussion-points
pandit-notes
```

| §5 wants | Status |
|---|---|
| 1 Cover | ✅ exists (needs §6 redesign) |
| 2 Kundli Passport | ✅ exists (needs §8 cleanup) |
| 3 Kundli Saar | ✅ exists |
| 4 D1 Rashi | ✅ exists |
| 5 D9 Navamsha | ✅ exists |
| 6 Graha & Bhava Intelligence | ✅ exists as two sections — §5 permits combining |
| **7 Panchanga** | ❌ **no Part A section.** `panchangaIdentity.ts` computes it fully (incl. Amanta/Purnimanta separately, §14 already satisfied) and it is surfaced only inside the Passport |
| 8 Yoga / Dosha | ✅ exists |
| 9 Vimshottari Dasha | ✅ exists |
| 10 Career / Karma | ✅ exists |
| **11 Relationships** | ❌ not implemented |
| **12 Finance / Education / Home** | ❌ not implemented |
| **13 Dharma / Spirituality** | ❌ not implemented |
| 14 Current Period | ✅ exists as `current-dasha-activation` |
| 15 Pandit Discussion & Notes | ✅ exists as two sections |

**§5 and §21 are in tension.** §5 lists Relationships, Finance and Dharma in
the hierarchy; §21 says *"After Career validates … Do not implement shallow
bulk templates."* Career has **not** validated — no external reference, no
Pandit review. Building three more domains now would be exactly the bulk
templating §21 forbids, and would triple the surface that later needs
retracting.

**Recommendation: build the Panchanga section (the data already exists and is
evidence-backed) and leave 11–13 as declared, visible gaps.** A named absence
is honest; a generated page of domain prose is not.

---

## 2. Language architecture — the largest finding

### Measured Hindi coverage

Golden fixture, Part A + B, both renderers:

| Artifact | Devanagari runs | Latin words (≥4 chars) | Effective Hindi |
|---|---|---|---|
| v1 `en` | 5 | 4 251 | 0 % |
| v1 `hi` | 137 | 4 098 | **~3 %** |
| v3 `en` | 77 | 6 048 | 1 % |
| v3 `hi` | 226 | 6 030 | **~4 %** |

**The Hindi report is an English report with Hindi headings.** This is exactly
what §2 forbids: *"Do NOT implement Hindi as translated labels over English
content."*

### Why: where the English actually lives

| Source | English prose literals (≥4 words) |
|---|---|
| `reportModelV2.ts` | **314** (~9 200 words) |
| `careerSynthesis.ts` | 86 |
| `consultationQuestions.ts` | 32 |
| `derivedModel.ts` | 30 |
| `structuralHighlights.ts` | 28 |
| `grahaCondition.ts` | 27 |
| `functionalLordship.ts` | 26 |
| `dashaActivation.ts` | 23 |
| others | ~60 |

`labels.ts` already holds **252 Devanagari terms** — the *terminology* registry
is in good shape. What does not exist is Hindi **prose**. Roughly **12 000
words** of technical Jyotish exposition is written as English string literals,
much of it inside the derivation layer rather than the report model.

### The honest constraint

Producing 12 000 words of Hindi Jyotish prose is a translation project, not a
coding task, and machine-translating it would violate two standing rules at
once: *do not invent content*, and *do not present unverified material as
authoritative*. Sanskrit-derived Jyotish register is precisely where a
plausible-sounding wrong translation does the most damage — `भावेश` vs
`भाव स्वामी`, `अवस्था` vs `स्थिति`, `बल` vs `शक्ति` are not interchangeable.

**Recommendation:** build the *architecture* now — a locale-resolved content
type so every user-visible string has `{ en, hi }` slots, `hi-en` composition,
the numeral policy, and a completeness gate that reports **true** coverage —
then fill the Hindi in reviewed batches. The gate must start as a **reported
metric with a ratchet**, not a hard failure, or the build is red from the first
commit and gets disabled.

---

## 3. §4 numeral policy — violation confirmed and reproducible

Part A of the v3 **`hi`** report:

```
Devanagari numerals: 36
ASCII numerals:    1 162
```

Both, on the same pages. Cause: `chartModel.signLabel()` emits `०–९` when
`labelMode === 'HI'`, while every table, DMS value, date and dasha year is
formatted with plain `String(n)`. So the chart says `१०` and the table beneath
it says `10`, exactly the mixture §4 prohibits.

There is no `devanagariNumerals` switch anywhere; the behaviour is implied by
chart label mode alone.

---

## 4. §31 simplification metrics — measured baseline

v3 Part A, golden fixture:

| Metric | Target | v3 today |
|---|---|---|
| Evidence IDs visible in Part A | 0 | **2** (`YOGA_BUDHADITYA`, `YOGA_MALAVYA`) |
| Debug / version enums in Part A | 0 | **7** (`kundli-report-v2`, `kundli-calc-v1`, `kundli-derived-v1`, `DRISHTI_UNIVERSAL_7`, `DRISHTI_SPECIAL_SATURN`, + 2 yoga IDs) |
| Hashes in Part A | 0 | **0** ✅ |
| Yoga technical proof pages in Part A | ≤ 1 | **1** ✅ |

V40.1's density gate already keeps hashes and doc paths out. What survives is
a narrower class: **rule identifiers used as display labels**. `PA-02`
(`[0-9a-f]{16,}`) does not match `DRISHTI_UNIVERSAL_7`, and `PA-03`
(`*-registry-v\d`) does not match `kundli-report-v2`.

Two new gate patterns close this: `SCREAMING_SNAKE_CASE` identifiers, and
`*-*-v\d` version strings. Both need a display-name lookup so the *content*
survives in Hindi/English rather than being deleted.

---

## 5. §8 Passport — raw enums confirmed

Extracted from the v1 `hi` PDF, page 2, verbatim:

```
Coordinate provenance            MANUAL
Historical UTC offset at birth   UTC+5.5 (IANA_HISTORICAL)
Offset provenance                IANA_HISTORICAL
Daylight saving time             No, not in effect at birth (DST_IANA_TRANSITION_V2)
```

`UTC+5.5` is also wrong as civil time — it should read `UTC+05:30`. §8's
prescription (civil-time representation in Part A, provenance enums to the
appendix) is correct and the raw values are all retained internally.

v3 has already moved most of this; `UTC+5.5` survives.

---

## 6. What must not regress (§29) — current state

All verified green at `5d6e2d5`:

| Capability | Guard |
|---|---|
| renderer v3 | `renderer-v3.spec.ts` (19 tests) |
| Devanagari shaping / fontkit GSUB+GPOS | `shaping.spec.ts` (16) |
| semantic QA | `renderer-v3.spec.ts`, `typography.spec.ts` |
| visual QA + 19 baselines | `visual.spec.ts`, `chart-shapes.spec.ts` |
| report-v2 + content types | model compared v2 ⇄ v3 |
| derivation layer | `derived-model.spec.ts` (9) |
| D10 quarantine | `external-validation.spec.ts` (14) |

107 tests in `tests/kundli-v40/`; 981 repo-wide. Any V41 change must leave
these passing.

---

## 7. Recommended sequencing

Ordered by *blocking-ness*, not by brief order.

**Wave 1 — unblock (this sprint)**
1. §0 server route + client rewire + `DOWNLOAD_KUNDLI_CURRENT_RENDERER`.
2. §1 three modes (CLIENT / PANDIT / SCHOLAR) — the axis everything else
   hangs off, and cheap now because Part A/B already exists.
3. §4 numeral policy — one switch, threaded properly.
4. §31 gate extension — evidence IDs and version enums out of Part A.

**Wave 2 — presentation**
5. §6 cover, §7 design pass, §8 passport civil time, §9 Saar, §10/§11 chart
   pages, §12 dossier, §13 bhava matrix, §15–17 dashboards, §18 dasha timeline.
6. §5's Panchanga section (data already exists).

**Wave 3 — language**
7. Locale-resolved content architecture + `hi-en` composition + the
   completeness gate as a *ratchet*.
8. Hindi prose in reviewed batches. Needs a Hindi-reading Jyotish reviewer.

**Wave 4 — depends on validation, not on engineering**
9. §21 domains (marriage, finance, education, home, spirituality) — blocked on
   Career validating.
10. §22 remedies — blocked on Pandit review.
11. §27 QR — blocked on `/verify/:reportId`.
12. §32 Pandit observation — the actual acceptance test.

---

## 8. Things in the brief that are already done

Worth stating so effort is not spent twice:

- **§14 Amanta / Purnimanta are already separate** (`panchangaIdentity.ts`,
  `MasaReport` with independent status + provenance for each). They are never
  collapsed.
- **§16 existence vs strength** — the three-way `CapabilityStatus`
  (`CALCULATED` / `VALIDATION_PENDING` / `NOT_CALCULATED`) plus the yoga
  status model already distinguishes these; what is missing is *displaying*
  both axes on the dashboard.
- **§25 Scholar Appendix** — exists as Part B, 11 sections, 23 pages.
- **§26 source UX** — V40.1 CD-03 already collapsed per-row boilerplate.
- **§27 QR explanation** — already removed in V40.
- **§28 validation status** — `externalValidation.ts` exists; needs surfacing
  as a four-line status block.
- **§29** — fully guarded, see §6 above.
