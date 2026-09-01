# Runtime Consistency Gate

Status: **IMPLEMENTED, NOT YET INDEPENDENTLY REVIEWED**
Gate version: `consistency-gate-v1`
Implementation: `src/lib/kundli/consistencyGate.ts`
Fixtures: `tests/kundli-pipeline/consistency-gate.spec.ts`

---

## 1. What this is

A mandatory gate inside the Kundli pipeline. If two parts of a report disagree
with each other, the reader is handed a document that contradicts itself — which
is worse than no document, because it looks authoritative. This gate makes that
outcome impossible: on a critical contradiction the pipeline returns no PDF at
all.

It runs at two points, both before anything is rendered:

| Stage | When | Function | Metric |
|---|---|---|---|
| **GATE 2b** | immediately after the canonical model is built and validated | `checkCanonicalConsistency()` | `pipeline.gate2b.consistency` |
| **GATE 3b** | after the report model is assembled, before PDF rendering | `checkReportConsistency()` | `pipeline.gate3b.consistency` |
| **GATE 3b (hi)** | additionally, when the report language is Hindi | `checkBilingualEquivalence()` | `pipeline.gate3b.bilingual` |

On the PRIYA-1995-GK-NEGATIVE profile the gate currently executes **254
canonical-model checks** and **zero** critical findings.

---

## 2. Fail-closed contract

A CRITICAL finding produces, without exception:

- `ok: false`
- `pdfBuffer: null` — no PDF bytes exist anywhere in the process
- `state: 'CONSISTENCY_FAILED'` — never `READY_FOR_DELIVERY`
- `errorCode: 'KUNDLI_CONSISTENCY_FAILED'` — a stable, named code
- `errorDetails.contradictions[]`, each entry carrying **both** sides:
  `code`, `pathA`, `valueA`, `pathB`, `valueB`
- an `emitMetric` record naming every failing code

The user-facing message (`KUNDLI_SAFE_MESSAGES`) says the report was withheld
because two parts of the calculation disagreed, and that nothing was delivered.
Codes and stack traces are never the primary message shown to a reader.

### Sensitive-data rule

A contradiction that cannot be read is a contradiction that cannot be fixed, and
a log line that leaks a birth name is a privacy defect. The gate therefore masks
**only** personal fields — `subject.name`, `context.name`, `profile.name`,
`locationName`, `place`, `city` — which are compared and reported as a short
SHA-256 prefix (`sha256:0971cf4f9a`). Everything else, including sign names,
longitudes, degrees and dates, is reported verbatim.

An early version of this gate masked anything ending in `name`, which hashed
`ascendant.sign.name` and hid the very contradiction being reported. That was
fixed. The rule is now: **astronomical values are never personal data.**

A test asserts that no contradiction payload contains the subject's name or
location.

---

## 3. Coverage

### Canonical stage — GATE 2b

| Code | What is compared |
|---|---|
| `CG_SUBJECT_NAME` | requested subject vs the chart the report describes |
| `CG_BIRTH_DATE` | birth date on the profile vs the date the engine was given (`snapshot.context`) |
| `CG_BIRTH_TIME` | same, format-tolerant (`10:30` ≡ `10:30:00`) |
| `CG_LOCAL_DATETIME` | profile local timestamp vs `calculationMetadata.localDateTime` |
| `CG_UTC_DATETIME` | profile UTC timestamp vs `calculationMetadata.utcDateTime` |
| `CG_UTC_CONVERSION` | local minus UTC vs the declared historical offset (≤ 1 minute) |
| `CG_TZ_PROVENANCE` | provenance present and one of `IANA_HISTORICAL`, `IANA_CURRENT`, `FIXED_OFFSET`, `MANUAL`; timezone id present |
| `CG_COORDINATES` | latitude/longitude in range, provenance declared, and equal to the coordinates the engine was given |
| `CG_AYANAMSHA` | value plausible for a sidereal calculation; label matches the configured key; snapshot value matches the canonical value; **tropical minus sidereal ascendant equals the declared ayanamsha** |
| `CG_ASCENDANT_SIGN` | sign implied by longitude vs the recorded sign; house 1 sign vs ascendant sign; snapshot lagna vs canonical lagna |
| `CG_ASCENDANT_DEGREE` | degree-in-sign within 0–30 |
| `CG_MOON_SIGN` | sign implied by the Moon's longitude vs the recorded sign |
| `CG_MOON_NAKSHATRA` / `CG_MOON_PADA` | Janma nakshatra and pada derived from the Moon's longitude, and identical to the panchanga's |
| `CG_PLANET_SIGN.<planet>` | sign implied by longitude vs the recorded sign, for all nine grahas |
| `CG_PLANET_DEGREE.<planet>` | degree-in-sign within 0–30 |
| `CG_PLANET_HOUSE.<planet>` | house in range; planet's sign equals its house's sign (equal-sign houses); the planet is listed as an occupant of that house |
| `CG_RETROGRADE.<planet>` | canonical retrograde flag vs the engine's `isRetrograde` |
| `CG_RAHU_KETU_OPPOSITION` | Rahu–Ketu separation within tolerance of exactly 180° (default 0.5°, configurable) |
| `CG_HOUSE_COUNT` / `CG_HOUSE_SEQUENCE` | exactly 12 houses, numbered 1–12 |
| `CG_HOUSE_SIGN_SEQUENCE` | house signs consecutive from the lagna |
| `CG_LORDSHIP.<house>` | recorded lord vs the classical lord of that sign |
| `CG_DASHA_BALANCE` | balance at birth present and finite |
| `CG_DASHA_SEQUENCE` | exactly 9 mahadashas |
| `CG_DASHA_DATES.<planet>` | every period has a valid, forward date range |
| `CG_DASHA_CONTINUITY.<planet>` | no gap and no overlap between consecutive periods (≤ 1 s) |
| `CG_CURRENT_DASHA` | current mahadasha exists in the sequence; its dates match the sequence entry; range valid |
| `CG_YOGA_STATUS.<id>` | status is one of the four legal values and equals `result` |
| `CG_YOGA_CONDITIONS.<id>` | PRESENT ⇒ all true; ABSENT ⇒ at least one conclusively false; INDETERMINATE ⇒ unresolved and none false |
| `CG_YOGA_REASON.<id>` | NOT_CALCULATED states a reason |
| `CG_YOGA_EVIDENCE.<id>` | evaluated yoga carries evidence, including every condition's own evidence locator |
| `CG_YOGA_SOURCE.<id>` | source `ruleId` is this rule, not another |
| `CG_DOSHA_MANGLIK` | cause houses actually contain Mars |
| `CG_DOSHA_KALSARPA` | declared NOT_CALCULATED with a reason, never silently omitted |
| `CG_D1_LAGNA` / `CG_D1_PLACEMENT.<planet>` | D1 lagna and placements equal the canonical placements |
| `CG_D9_LAGNA` / `CG_D9_PLACEMENT.<planet>` | D9 lagna and placements equal the navamsha of the D1 position |

### Report stage — GATE 3b

| Code | What is compared |
|---|---|
| `CG_SUMMARY_VS_TABLES` | values asserted in the summary appear in the detailed tables; ascendant sign present in the house table |
| `CG_SECTION_CONTENT` | no mandatory section renders empty |
| `CG_CERTIFICATE` | engine version, ayanamsha, house system and report id are present in the lineage surfaces |
| `CG_BILINGUAL_VALUE` | Hindi and English renderings carry identical values (CRITICAL) |
| `CG_BILINGUAL_NOT_APPLIED` | the two renderings are identical, i.e. Hindi labels are not implemented yet (WARNING — reported, never hidden, never blocking) |

---

## 4. Defects the gate found

### 4.1 Retrograde status was never delivered — FIXED

**Symptom.** `CG_RETROGRADE` fired for Mercury, Jupiter, Rahu and Ketu on the
first real profile: the engine computed them as retrograde, the canonical model
said `false`.

**Cause.** `src/lib/kundli/canonicalModel.ts` read `p.retrograde`. The engine
exposes motion as `p.isRetrograde` (`celestialEngine.ts`, `speedPerDay < 0`;
mean nodes always retrograde). Reading a field that is never set meant **every
graha was reported as direct, always.**

**Fix.** `retrograde: !!(p.retrograde ?? p.isRetrograde)`.

**Independent confirmation.** `tests/fixtures/external/astrosage-prabhakar-1989.json`
records `isRetrograde: true` for Mercury and Saturn from an external AstroSage
report, and `tests/astrosage-differential-benchmark.spec.ts` asserts parity on
that field. A regression test now asserts that every planet the engine calls
retrograde is flagged retrograde in the canonical model.

### 4.2 The gate's own navamsha formula was wrong — the engine was right

Building `CG_D9_*` from recalled classical rules produced contradictions on all
nine grahas. The recalled rule (movable/fixed/dual ⇒ Aries/Capricorn/Libra)
matched **5 of 9** external reference values. The formula already in the engine
(`elementOffsets = [0, 9, 6, 3]`, indexed by `rashiIndex % 4`) matched **9 of 9**.

**The engine was correct; the gate was corrected, not the engine.** The corrected
helper is `navamshaSignOf()` in `consistencyGate.ts`, and a test now re-derives
the external AstroSage fixture through that helper so the formula cannot silently
regress.

This is recorded because it is the failure mode the "zero-fabrication" rule
exists to prevent: the temptation was to edit a validated calculation to agree
with an unverified recollection.

---

## 5. Test evidence

`tests/kundli-pipeline/consistency-gate.spec.ts` — **64 tests, all passing**:

- 3 positive controls: the genuine model yields zero findings across 254 checks;
  the genuine report passes the report gate; the full pipeline still delivers a
  real PDF with the gate active.
- 1 independent anchor: the gate's navamsha helper reproduces the external
  AstroSage D9 fixture for 9 of 9 grahas.
- ~54 deliberate contradiction fixtures, one or more per category above, each
  asserting that the gate blocks, that the expected code is emitted, and that
  **both** sides of the contradiction are identified.
- 6 end-to-end fail-closed cases driving a corrupted snapshot through the real
  pipeline (corrupted planet sign, ascendant sign, node longitude, dasha
  timeline, navamsha placement, tropical longitude): `ok:false`, `pdfBuffer:null`,
  never `READY_FOR_DELIVERY`, `KUNDLI_CONSISTENCY_FAILED`, both paths present,
  and **no personal name or place in the failure payload**.
- 1 tolerance case proving the Rahu–Ketu tolerance is actually enforced
  (0.2° off passes at 0.5° tolerance, blocks at 0.05°).

`tests/kundli-pipeline` as a whole: **181 passed, 0 failed**.

Regression check against the pre-change baseline: a ten-file subset was run
before and after the change under identical conditions. Both runs produced
**exactly 25 non-passing tests, in the same files with the same statuses**
(all environmental — no server running, no network geocoding, chromium outside
the default cache). **Zero regressions.**

---

## 6. What this gate does NOT yet do

Stated plainly, because a gate's coverage is only as good as its gaps:

1. **No consolidated certificate block exists.** `CG_CERTIFICATE` currently
   verifies the engine version, ayanamsha, house system and report id wherever
   they live today (`calculation-method`, `cover`). The full certificate —
   report id, input fingerprint, engine version, ayanamsha, timezone provenance,
   source-registry version, report-model version, content hash, timestamp — is
   Phase 2. Until then those fields are not gated as a single unit.
2. **Hindi labels are not implemented.** The report model accepts a `hi` locale
   but emits identical text. `CG_BILINGUAL_NOT_APPLIED` records this as a
   WARNING on every Hindi delivery. It is a missing feature, not a contradiction,
   so it does not block — but it is not a pass either.
3. **Vargas beyond D1 and D9 are not gated.** D2/D3/…/D60 are produced and
   displayed with no independent verification (see Phase 8). The gate does not
   make them trustworthy; it simply does not yet check them.
4. **Shadbala, Ashtakavarga and Jaimini values are not gated.** Nothing here
   should be read as validating them.
5. **Interpretation text is not gated.** The gate verifies that calculated facts
   agree with each other. It does not verify that a prose interpretation is
   supported by the chart it accompanies.
6. **Non-`KundliError` exceptions are mislabelled.** An unexpected `TypeError`
   inside GATE 2 is reported by the pipeline as `KUNDLI_PDF_RENDER_FAILED`
   rather than a calculation error. Pre-existing, out of scope here, and a
   misleading code that should be fixed.

---

## 7. Verdict

`IMPLEMENTATION_IN_PROGRESS`

The gate exists, is wired into the pipeline at the required points, fails closed
under test with a stable error code, and has already caught one real defect
delivered to readers. It is not `READY_FOR_INDEPENDENT_REVIEW` because the
contradiction fixtures were authored by the same change that wrote the gate: an
independent reviewer should try to construct a contradiction the gate misses.
