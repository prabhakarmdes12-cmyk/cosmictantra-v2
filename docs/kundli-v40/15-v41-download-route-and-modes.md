# 15 · V41 Wave 1 — the download route, report modes, and the numeral policy

Covers §0, §1, §4 and §31 of the V41 brief. Waves 2–4 (§2/§3 Hindi, §5–§20
Part A hierarchy, §21–§28) are not in this document.

---

## §0 — the release blocker

### What was wrong

Downloaded PDFs said `V36.0`, `kundli-report-v1`, 19 pages, months after V40
and V40.1 shipped a v2 report model and a v3 renderer.

The cause was not a stale flag or a bad default. **There was no API route.**
`MasterKundliReportClient.tsx` called `generateKundliPdf()` — the v1 pipeline —
directly, inside a client React component.

```
button onClick
  └─ handleDownloadPDF()                     MasterKundliReportClient.tsx:588
      └─ generateKundliPdf()                 src/lib/kundli/pipeline.ts:77
          └─ kundli-report-v1                src/lib/kundli/reportModel.ts
              └─ renderer.ts (jsPDF)         engineVersion 'V36.0' (config.ts:20)
```

`find src/app/api -name route.ts` returned 23 routes and **none of them were
Kundli or PDF**.

### Why it could never have worked

Renderer v3 cannot run in a browser:

| Dependency | Where | Why it is fatal client-side |
|---|---|---|
| `require('node:path')` + `fs` reads | `v40/pdf/fontStack.ts:94` | Loads nine faces from `public/fonts/v3/` off disk |
| `process.getBuiltinModule('node:path')` | `renderAssets.ts:31` | Same |
| Node `Buffer` | pdfkit driver throughout | Not a browser type |

So this was never one wire away from correct. It was in the wrong process.
Shipping ~1.7 MB of fonts plus a shaping engine into the client bundle would be
the wrong trade even if it worked, and server-side generation additionally makes
the artifact reproducible — the same input yields the same bytes regardless of
what fonts the visitor has installed.

### The fix

`POST /api/kundli/pdf`, `runtime = 'nodejs'`, running `generateKundliV41Pdf`.

**There is deliberately no fallback to v1.** If the gates do not open, the route
returns an error and issues no file. A silent downgrade is precisely the failure
being fixed, and it is undetectable from outside because a v1 PDF looks like a
perfectly good PDF. v1 itself is untouched and still present as the regression
reference the V40 acceptance criteria depend on (asserted by DKCR-14).

Response headers make the lineage checkable without opening the document:

```
X-Kundli-Report-Model: kundli-report-v2
X-Kundli-Renderer:     kundli-pdf-renderer-v3
X-Kundli-Mode:         SCHOLAR
X-Kundli-Pages:        39
```

The route is rate limited (12/min/client, house `createRateLimiter`). Rendering
a Scholar edition is ~2 s of CPU and nine font faces — the most expensive
endpoint in the app, reachable by one unauthenticated POST. A 429 is surfaced to
the user as a wait-and-retry message, not as "render failed", because telling
someone their chart is broken when it is fine is its own defect.

### `DOWNLOAD_KUNDLI_CURRENT_RENDERER`

`tests/kundli-v40/download-route.spec.ts` — 16 assertions against **the bytes
the exported `POST` handler actually returns**. Not the pipeline in isolation:
the pipeline was already passing 981 tests while the product shipped the wrong
document. That distinction is the entire point of the gate.

| ID | Asserts |
|---|---|
| DKCR-01 | 200, `application/pdf`, `%PDF-` magic, contract headers |
| DKCR-02 | No `V36.0` / `kundli-report-v1` / `kundli-pdf-renderer-v1` in the body |
| DKCR-02b | The appendix records `kundli-report-v2`, so the headers are not lying |
| DKCR-03 | Embedded faces are Garamond/Noto, **not** jsPDF's Helvetica |
| DKCR-04 | Page count ≠ the v1 19-page shape |
| DKCR-05..08 | Mode selection, ordering, appendix confined to SCHOLAR |
| DKCR-09 | The locale parameter reaches the renderer |
| DKCR-10, 11 | Bad input and malformed JSON never yield a document |
| DKCR-12 | `GET` advertises the contract without generating |
| DKCR-13 | The report page calls `/api/kundli/pdf` and **not** `generateKundliPdf(` |
| DKCR-14 | v1 files still exist |
| DKCR-15 | The endpoint is rate limited, and cheap rejections still count |

DKCR-02 is scoped to the PANDIT edition, which carries no appendix and is
therefore exactly Part A. The Scholar appendix legitimately prints `V36.0` in
its engine-versions table; §25 requires preserving it there.

---

## §1 — three audience editions

One canonical Kundli. The modes differ **only in information density**: no mode
computes anything the others do not, and none states anything the others
contradict.

| Mode | Pages | Appendix | Target (§1) |
|---|---|---|---|
| CLIENT | 12 | no | 10–14 ✓ |
| PANDIT | 17 | no | 14–20 ✓ |
| SCHOLAR | 39 | yes | default |

Both land inside the brief's ranges without tuning for page count, which §5
explicitly warns against.

`SCHOLAR` is the **identity transform**, so the default download is byte-for-byte
what the existing V40.1 suite already validates.

Every CLIENT omission carries a written rationale in `CLIENT_OMISSIONS`.
"Too technical" is not a rationale — everything in a Kundli is technical. The
test applied was whether the page is usable by someone who does not already read
charts, and whether its absence changes any conclusion:

- `graha-dossier` — a nine-row dossier of dignity, motion and avastha; a client
  cannot act on it and misreads it as a verdict
- `bhava-matrix` — a practitioner's working instrument, not a reading
- `pandit-discussion-points` — questions written *for* a practitioner to raise;
  in a client's hands they read as unanswered doubts about their own chart
- `pandit-notes` — blank annotation space for the person running the consultation

The PDF quality gate's mandatory-section list is now **mode-aware**. A fixed
list would either fail CLIENT for correctly omitting a worksheet, or stop
checking the appendix entirely.

---

## §4 — the numeral policy

`signLabel` indexed a **ten**-element Devanagari digit array by sign number:

```ts
const DEVANAGARI_DIGITS = ['०','१',…,'९'];        // ten entries
if (mode === 'HI') return DEVANAGARI_DIGITS[n] ?? String(n);
```

Signs 1–9 converted; 10, 11 and 12 fell through to `String(n)`. Every North
Indian chart in a Hindi report printed `१ २ ३ ४ ५ ६ ७ ८ ९ 10 11 12`. Nobody
decided to mix scripts — it was an off-by-array-length, and it landed on the two
most-looked-at pages in the document.

`src/lib/kundli/v40/numerals.ts` — one switch, driven by locale, multi-digit safe:

| Locale | `devanagariNumerals` | Rationale |
|---|---|---|
| `hi` | true | A Hindi reader expects १२ |
| `hi-en` | false | The page already carries English terms; Devanagari digits beside them read as decoration, and a Pandit cross-checking against software or a panchang reads Western digits there anyway |
| `en` | false | — |

Scope is display numerals only. Dates, coordinates, hashes, report IDs and the
whole Scholar Appendix stay Western in every mode: an identifier that changes
script is not the same identifier.

**There is no auto-repair helper.** An `enforceNumeralPolicy()` normaliser was
written and then deliberately removed. It would have laundered the exact defect
§4 exists to catch — the chart would have looked right while `signLabel` was
still wrong, and the next hand-built label would have been fixed invisibly too.
Mixing fails the gate (`findMixedNumerals`, NUM-06) and gets fixed at source.

---

## §31 — measured simplification

Measured from generated artifacts, never from reading source. Baselines in
`forensic/v41-audit.md`, same fixture, same method.

| Metric | Before | After |
|---|---|---|
| Evidence IDs in Part A | 2 | **0** |
| Version strings / raw enums in Part A | 7 | **0** |
| Content hashes in Part A | 0 | 0 |
| Yoga technical proof pages in Part A | 1 | 1 (at the §31 cap) |
| Hindi Part A mixed numerals | 36 deva + 1162 ascii | **no line mixes scripts** |

The gate surfaced two real offenders. Both were fixed by **moving content, not
by weakening the gate**:

1. The **cover** printed `kundli-report-v2 · kundli-calc-v1 · kundli-derived-v1`.
   §6 forbids engine/report-model versions on the cover. Preserved in full in
   the B1 Calculation Certificate. A cover is an identity page, not a build stamp.
2. Career prose printed `(rule DRISHTI_UNIVERSAL_7)`. The sentence already says
   "casts its 7th full drishti" in words, and the Part B aspect ledger prints
   `ruleId` per aspect. Pure duplication in Part A.

The §31 "find it in ≤5 s" targets are not measurable in CI. What is measurable
is the precondition — the reader must not have to cross pages — so SIMP-05/06
assert Lagna+Moon+Nakshatra, and current MD/AD with year ranges, each co-occur
on a single page within the first four.

---

## Incidental defects found and fixed

- **CD-09** moved "How to Read" into Part B but left its running tag reading
  `PART A`, so the appendix boundary was unreadable in the artifact.
- **Visual drift threshold** was 1%, which sat *above* both the signal and the
  noise. Removing one line of 8pt type from the cover moves 0.35% of pixels and
  was never even logged. Recalibrated to 0.1%, measured against the two real
  cases: 0.0260% is the Calculation Certificate's `GENERATED AT` churn on every
  run; 0.3494% was the cover edit. Still reported, never blocking, per §29.
- **§6 cover vocabulary**: `पद` → `चरण` (both correct for a nakshatra quarter;
  चरण is what a North Indian Pandit says aloud and what §6 names), and the
  current-period line was the one purely English sentence on an otherwise
  Devanagari-first page — now `राहु महादशा · बुध अन्तर्दशा — Rahu Mahadasha / …`.

---

## Test status — stated honestly

| Scope | Result |
|---|---|
| `tests/kundli-v40/` + `tests/kundli-pipeline/` | **461 passed, 0 failed**, 5 skipped |
| Full suite at this commit | 1011 passed, **110 failed**, 11 skipped |
| Full suite at V40.1 (`5d6e2d5`) | 981 passed, **110 failed**, 11 skipped |

The 110 failures are pre-existing and environmental, **proven** by running the
full suite at the baseline commit in a worktree and diffing the failure sets:

- 89 × `browserType.launch: Executable doesn't exist` — no Chromium is
  obtainable in this sandbox (`cdn.playwright.dev` is unreachable)
- 8 × `ECONNREFUSED ::1:3000` — specs that need a running dev server
- 1 × a hardcoded Windows path `D:\Projects\…` in `analyze-1000-jpl.spec.ts`
- 1 × `granth-canonical-library` needing git ref `ca5951c`, absent from this clone
- 1 × `astrosage-differential-benchmark` assertion

V41 added 30 passing tests and **zero** new failures.

### One pre-existing flake worth naming

`tests/kundli-pipeline/passport-certificate.spec.ts:399` fails **only in a full
run** with `cannot draw a HI chart without the embedded Devanagari font`. It
passes in isolation (461/461 above). It is order- or load-dependent: the v1
renderer sets `devFontLoaded = false` when `doc.addFont` throws
(`renderer.ts:117`), and then `northIndianChart.ts:449` correctly refuses to draw
boxes. It reproduces identically at `5d6e2d5`.

It is in the **v1** path, which is no longer the public download. Not fixed here
— V41 §0 says fix the route and do not remove v1, and silently changing v1's
behaviour would compromise it as the regression reference. Recorded for triage.

---

## Still not true

Unchanged from the V40.1 rollout report, and worth repeating because none of the
above alters it:

- The validation register `EV-01…EV-15` is **entirely `NOT_ATTEMPTED`**.
- **No Pandit has read this document.**
- §2/§3 Hindi coverage is ~4%. The `hi` cover is still literally the `en` cover.
- §5 Part A is missing Panchanga, Relationships and Finance/Education/Home.
- §10 charts still carry no DMS beside each graha abbreviation.

This is not production-ready. It is a correctly-wired download of a document
that has not yet been checked by a human who practises Jyotish.
