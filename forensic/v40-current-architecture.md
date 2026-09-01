# Forensic map — CosmicTantra Kundli architecture as found (V40 pre-work)

Recorded before any modification. Branch `arena/01a05d51-cosmictantra-v2`, parent commit
`c32e893`. Every statement below was produced by reading the code and by executing the
pipeline against the Priya Sharma fixture, not from prose in existing reports.

Reproduction of the baseline used throughout this document:

```
npx playwright test tests/kundli-pipeline/scholar-pdf-artifact.spec.ts --workers=1
# => pipeline.render.passed {"pages":19}  sections=33  blankPages=0  density=1
```

---

## 1. Stage map — where birth input becomes a PDF

```
RawBirthInput
  │  src/lib/kundli/validation.ts        validateBirthInput()          GATE 1
  ▼
ValidatedBirthInput
  │  src/lib/kundli/geoTz.ts             resolveGeoTimezone()          GATE 1b
  ▼
NormalizedBirthProfile  (+ computeFingerprint / deriveReportId — lineage.ts)
  │
  │  ── ASTRONOMICAL KERNEL (must not be touched by V40) ─────────────
  │  src/lib/jyotish/canonicalSnapshot.ts  getCanonicalJyotishSnapshot()
  │     ├── src/lib/astrologyEngine.js     calculateKundali()   positions, houses, dignity
  │     ├── src/lib/panchang.js            calculatePanchang()  tithi/nakshatra/yoga/karana/masa
  │     ├── src/lib/dashaEngine.js         calculateVimshottariDasha()
  │     ├── src/lib/jyotish/vargaEngine.ts generateShodashavarga()  D1..D60
  │     ├── src/lib/jyotish/relationshipEngine.ts  maitri, combustion, war, functional roles, drishti
  │     ├── src/lib/jyotish/balaEngine.ts  shadbala, bhava bala, vimshopaka
  │     ├── src/lib/jyotish/ashtakavargaEngine.ts
  │     └── src/lib/jyotish/yogaEngine.ts  evaluateYogas()  rule evaluations
  ▼
CanonicalJyotishSnapshot   (untyped `any` in many places, permissive)
  │  src/lib/kundli/canonicalModel.ts    buildCanonicalModel()          GATE 2
  │  src/lib/kundli/validation.ts        validateCalculationModel()
  │  src/lib/kundli/consistencyGate.ts   checkCanonicalConsistency()    GATE 2b
  ▼
KundliCanonicalModel  (typed; src/lib/kundli/types.ts)
  │  src/lib/kundli/reportModel.ts       buildKundliReportModel()       GATE 3
  │     ├── src/lib/kundli/interpretation.ts  interpretCanonicalModel()
  │     ├── src/lib/kundli/scholarSummary.ts  buildScholarSummarySections()
  │     └── src/lib/kundli/chartModel.ts      buildChartRenderModel()  D1 / D9 only
  │  checkReportConsistency / checkBilingualEquivalence /
  │  checkChartAndSummaryConsistency                                    GATE 3b / 3c
  ▼
KundliReportModel  (ReportSection[] of typed ReportBlock[])
  │  src/lib/kundli/renderer.ts          renderKundliReportPdf()
  │     ├── src/lib/kundli/layoutEngine.ts   PaginationController (sole page creator)
  │     ├── src/lib/kundli/northIndianChart.ts drawChartToPdf() — vector, not raster
  │     └── src/lib/kundli/renderAssets.ts     Devanagari TTF + emblems (base64)
  ▼
Uint8Array (PDF)
  │  src/lib/kundli/pdfValidator.ts      validatePdfIntegrity()         GATE 4
  │     └── src/lib/kundli/pdfExtract.ts (pdfjs-dist)
  ▼
READY_FOR_DELIVERY
```

Orchestrator: `src/lib/kundli/pipeline.ts`. The only browser entry point is
`src/app/report/MasterKundliReportClient.tsx` (two call sites of `generateKundliPdf`).

### Separation verdict

| Boundary | Enforced? | Evidence |
|---|---|---|
| astronomy ↛ report | **yes** | `renderer.ts` imports no engine; it receives `KundliReportModel` only |
| astronomy ↛ renderer | **yes** | renderer imports `types`, `layoutEngine`, `northIndianChart`, `renderAssets` only |
| canonical ↛ renderer | **yes** | renderer never sees `KundliCanonicalModel` |
| fact vs interpretation | **partly** | `InterpretationEntry` records `generatorVersion` + `sourceFacts`, and `scholarSummary.ts` separates Level 1/2/3 — but **no block-level content-type tag exists**. Once a block is a `paragraph`, its epistemic status is only conveyed by the surrounding prose. |
| rule vs result | **yes** | `YogaResult` carries `rule`, `conditions[]`, `evidence[]`, `source`, `status` |
| tradition labelling | **partly** | `YogaResult.system` exists and is always `'PARASHARI'`. Nothing else in the report carries a `system` field. `jaiminiEngine` / `kpEngine` are computed in the snapshot and are simply not consumed by the report. |

---

## 2. Component-by-component findings

### 2.1 Calculation pipeline (`canonicalSnapshot.ts`, 476 lines)

One authoritative entry point, `getCanonicalJyotishSnapshot(context)`. It is deterministic
except for `meta.calculatedAt` and the default `targetDate = new Date()` (which decides which
dasha is *current*). Everything the V40 work needs — positions, houses, vargas D1..D60,
combustion, functional roles, graha drishti, shadbala, yoga evaluations — is already produced
here. **V40 therefore needs no new astronomy.**

### 2.2 Canonical chart schema (`types.ts` / `canonicalModel.ts`)

`KundliCanonicalModel` = subject, calculation config, calculationMetadata, panchanga,
ascendant, 9 planets, 12 houses, 16 divisional charts, dashas, yogas, doshas.

Adapter behaviour worth recording:

- `requireValue()` throws `KUNDLI_CALCULATION_INCOMPLETE` rather than defaulting. Good.
- `dignityOf()` reads the engine's own dignity string; the boolean flags are a fallback that
  no observed snapshot populates. The canonical enum is
  `EXALTED | DEBILITATED | MOOLATRIKONA | OWN_SIGN | FRIEND_SIGN | NEUTRAL | ENEMY_SIGN`.
  It has **no** `GREAT_FRIEND` / `GREAT_ENEMY`: the engine's label `Neutral / Enemy` collapses
  to `NEUTRAL`. A V40 `GrahaCondition.dignity.category` must therefore not claim the
  five-fold compound grades from this source.
- `buildDashas()` parses `startingBalanceYears` out of the string `"5.0 yrs of Sun"` →
  **precision is destroyed at the adapter**, which is exactly the defect §14 of the V40 brief
  names. The underlying float is available from the Moon longitude and the Vimshottari
  constants.
- Rahu/Ketu arrive with `retrograde: true` (mean nodes). Correct, but it must be labelled as
  the node convention rather than as motion, or a reader sees nine planets of which two are
  "always retrograde" with no explanation.

### 2.3 Report model (`reportModel.ts`, 755 lines) — 33 sections

Order as built: cover, passport, scholar summary (×2), birth summary, D1 chart, D1 text table,
D9 chart, D9 text table, panchanga, planetary positions, house positions, vimshottari, current
dasha, lagna/moon/nakshatra analyses, major yogas, doshas, 7 domain interpretations,
current-period, near-term, remedies, calculation method, appendix, certificate, disclaimer.

Defects for the V40 rebuild:

| id | defect |
|---|---|
| `RPT-01` | No Part A / Part B split. Full yoga evidence (rule text, every condition, every evidence string, source, limitations, variants) is rendered inline in the main reading path — the single largest block of the 19 pages. |
| `RPT-02` | `Placement hash` and `Chart data version` are printed **on the consultation chart pages**. |
| `RPT-03` | `Masa: Jyeshtha` is a single value. The panchang engine emits `masa.amanta` and `masa.purnimanta`, but `src/lib/panchang.js:383-384` assigns **the same string to both**. Reporting either as an independently computed value is a false fact. |
| `RPT-04` | Planetary table shows decimal degrees only (`29.86°`). No DMS. |
| `RPT-05` | Houses table is `House / Sign / Planets`. No lord, no lord placement, no aspects — a Pandit cannot read bhava structure from it. |
| `RPT-06` | The QR paragraph spends a full explanatory paragraph on why there is no QR code. |
| `RPT-07` | Source-status prose repeats "no licensed edition exists in this repository" for every rule. |
| `RPT-08` | Interpretation sections are one deterministic paragraph each; there is no supporting/challenging/mixed structure and no evidence-coverage figure. |
| `RPT-09` | Vimshottari balance printed as `5.0 years` (see 2.2). |
| `RPT-10` | Cover is `keyValue` rows on a page — report ID, birth, place. No Lagna/Rashi/Nakshatra/current dasha, no design system. |

### 2.4 PDF renderer (`renderer.ts`, 418 lines)

jsPDF, A4 mm. Fonts: helvetica for Latin, `NotoSansDevanagari-Regular` registered from base64
for any string containing U+0900–U+097F. Devanagari **bold is aliased to the regular face** —
`doc.addFont(..., 'devanagari', 'bold')` points at the same TTF — so bold Devanagari is
synthetically identical to regular. Charts are drawn with vector primitives.

Renderer limits found:

- table columns are always equal width (`(PAGE_WIDTH - 2*MARGIN)/headers.length`);
- **table headers do not repeat** when a table crosses a page;
- a section heading can be the last thing on a page (orphan heading is possible);
- there is no design-token layer — 7 magic numbers at the top of the file;
- status is conveyed by words only, which is good for B/W, but there is no glyph vocabulary.

### 2.5 Yoga engine (`yogaEngine.ts`, 561 lines) + source registry (297 lines)

11 registered rules. `resolveStatus()` is fail-closed: any conclusively false condition ⇒
`ABSENT`; else any unresolved ⇒ `INDETERMINATE`; else `PRESENT`. Empty condition list ⇒
`NOT_CALCULATED`. Rules whose registry `adoption === 'NOT_ADOPTED'` are forced to
`NOT_CALCULATED` while still emitting their conditions as scholar evidence. `yogaContract.ts`
re-validates every record at the canonical boundary. **This is the strongest part of the
system and V40 must not weaken it.**

Observed statuses for the fixture: `GAJA_KESARI=ABSENT`, `BUDHADITYA=PRESENT`,
`CHANDRA_MANGALA=ABSENT`, `DHARMA_KARMA_ADHIPATI=ABSENT`,
`DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA=NOT_CALCULATED`, `RUCHAKA/HAMSA/SASA/BHADRA=ABSENT`,
`MALAVYA=PRESENT`, `KEMADRUMA=NOT_CALCULATED`.

### 2.6 Dosha engine

Manglik and Sade Sati are computed inline in `canonicalSnapshot.ts` (not in a rule engine):
Manglik = Mars in house 1/4/7/8/12 with a dignity-based cancellation; Sade Sati = Saturn in
sign 12/1/2 from the Moon **at birth** (not a transit search). Kalsarpa is explicitly
`NOT_CALCULATED`. The Sade Sati implementation answers "was Sade Sati running at birth", which
is not what a client means by the term; it is reported without that qualification.

### 2.7 Dignity, aspects, functional roles

`relationshipEngine.ts` already implements: naisargika/tatkalika/panchadha maitri, combustion
orbs (retrograde-aware), planetary war, functional roles per lagna, graha drishti with
shashtiamsha strength, rashi drishti. Two policy problems for V40:

- `calculateGrahaDrishti()` grants **Rahu and Ketu the Jupiter-like 5th/9th special aspects**
  with no configuration flag and no declaration. That is a contested tradition applied
  silently — a `KUNDLI_INV_004` violation in spirit.
- It also emits *partial* aspects (15/30/45 shashtiamsha for 3/10, 5/9, 4/8). Those are a
  strength model, not "an aspect exists". Mixing them into a Pandit-facing aspect list would
  overstate the chart.

None of this reaches the report today — the report has no aspect section at all.

### 2.8 Vimshottari (`dashaEngine.js`, 185 lines)

Year = 365.25 days exactly; MD/AD/PD nested; UTC-midnight birth date (a real prior fix, keep
it). `startingBalance` is emitted only as the string `"5.0 yrs of Sun"`.

### 2.9 Divisional charts

`vargaEngine.ts` computes all 16 vargas. `chartModel.ts` restricts `ChartDivision` to `1 | 9`
and cross-checks D9 against an independent navamsha calculation. D10 is computed and unused.

### 2.10 Shadbala

`balaEngine.ts` computes a full six-fold shadbala (sthana/dig/kala/cheshta/naisargika/drik)
with virupas, rupas, required rupas and a rank. It is in the snapshot, it is **not** in the
canonical model, and the certificate already says it is unverified. No reference fixture, no
external comparison, no test asserts a single shadbala number.

### 2.11 Evidence IDs

Two separate schemes: chart placements use `CHART-D{n}-H{house}-{Planet}`
(`chartModel.placementEvidenceId`), and `evidenceGraph.ts` / `evidenceCompiler.ts` implement a
richer graph that the PDF pipeline does not consume. Yoga evidence is **free text strings**
(e.g. `"Moon house 5"`), not identifiers — they are auditable by a human but not
machine-joinable to the canonical model.

### 2.12 Localization

`chartModel.ts` has EN/HI planet abbreviations and Devanagari digits; `scholarSummary.ts` has a
~20-entry bilingual `LABELS` map; `consistencyGate.checkBilingualEquivalence` proves the Hindi
and English renderings carry identical values. There is **no shared term registry**: house,
bhava-lord, dasha, dignity and status vocabulary is written inline in English in
`reportModel.ts`.

### 2.13 Tests

17 spec files under `tests/kundli-pipeline/` plus `tests/golden-kundli/`, `tests/incident/`,
`tests/differential/`. `priya-1995-gk-negative.spec.ts` (9 tests) is the existing false-yoga
regression and passes. `scholar-pdf-artifact.spec.ts` renders the real PDF and rasterises it.
There is no semantic-section assertion list, no layout-QA suite, and no data-lineage suite.

---

## 3. Defect register carried into V40

| id | severity | statement |
|---|---|---|
| `V40-D01` | high | Dasha balance precision destroyed at the canonical adapter (`parseFloat("5.0 yrs of Sun")`). |
| `V40-D02` | high | `masa.purnimanta` is a copy of `masa.amanta` in `panchang.js`; the report presents one lunar-month name as if both conventions agreed. |
| `V40-D03` | high | Node aspects (Rahu/Ketu 5th/9th) applied silently in `relationshipEngine.calculateGrahaDrishti`. |
| `V40-D04` | medium | No content-type tag on rendered blocks (`KUNDLI_INV_002` is enforced by prose, not by type). |
| `V40-D05` | medium | Debug metadata (placement hash, chart-model version) printed on consultation pages. |
| `V40-D06` | medium | Table headers do not repeat across pages; orphan headings possible; equal-width columns only. |
| `V40-D07` | medium | Devanagari bold is the regular face under a bold alias. |
| `V40-D08` | medium | Sade Sati is a natal Saturn-from-Moon check presented without that qualification. |
| `V40-D09` | low | Source-status sentence repeated per rule in the main reading path. |
| `V40-D10` | low | Yoga evidence is prose, not joinable identifiers. |

---

## 4. V40 constraints derived from this map

1. **Do not modify** `astrologyEngine.js`, `panchang.js`, `dashaEngine.js`, `celestialEngine.ts`,
   `vargaEngine.ts`, `balaEngine.ts` or `canonicalSnapshot.ts`. V40 is a *derivation* +
   *presentation* layer. `V40-D02` is handled by refusing to consume the duplicated field, not
   by editing the panchang kernel.
2. **Do not modify** `yogaEngine.ts` rule semantics. V40 re-presents the same evaluations.
3. New work lands in `src/lib/kundli/v40/`. `reportModel.ts` (v1) and `renderer.ts` (v1) stay
   byte-for-byte intact as the regression reference renderer.
4. Every V40 derived object must carry `evidenceIds[]` that resolve into the canonical model,
   and a `contentType` from the `KUNDLI_INV_002` vocabulary.
5. Anything not actually computed is emitted as `NOT_CALCULATED` with a reason — never omitted,
   never inferred, never converted to `ABSENT`.
