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

### Passport and certificate — GATE 3b

| Code | What is compared |
|---|---|
| `CG_PASSPORT_PRESENT` | the birth-data passport exists |
| `CG_PASSPORT.<field>` | every declared input is present, non-blank, and equal to the canonical value (name, birth date, place, timezone, zodiac, house system, node policy, engine version, report model version) |
| `CG_PASSPORT_DST` | daylight saving time is answered, or explicitly declared undetermined — never blank, never assumed |
| `CG_PASSPORT_COORDINATES` | passport latitude/longitude equal the canonical coordinates |
| `CG_CERTIFICATE_PRESENT` | the calculation certificate exists |
| `CG_CERTIFICATE` | report id, fingerprint, engine version, ayanamsha, house system, node policy, timezone and coordinate provenance, report model version and source registry version all present and equal to what the calculation declares |
| `CG_CERTIFICATE_HASH` | the printed content hash equals a freshly recomputed hash of this content — a stale or copied hash is rejected |
| `CG_CERTIFICATE_SCOPE` | the certificate states what was NOT calculated, discloses unverified source locators, and says plainly that Jyotish is interpretive and not a guarantee |
| `CG_CERTIFICATE_QR` | the certificate states that no QR code is present and why |

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

### Daylight saving time

`src/lib/kundli/dst.ts`, algorithm **`DST_IANA_TRANSITION_V2`**.

The passport answers "was DST in effect at birth" from IANA transition data.
It reconstructs the zone's offset intervals across a year centred on the birth
instant, refines each boundary to the minute by bisection, and answers only
when the history has one unambiguous reading:

| History | Answer |
|---|---|
| no transition in the surrounding year | `NO` — the zone held one offset all year |
| two offsets alternating and returning to the earlier one, with each offset held between 60 and 275 days | `YES` if the birth instant falls in the advanced interval, `NO` otherwise |
| anything else — a permanent change of standard offset, more than two distinct offsets, a split that is not seasonal, or a declared offset that disagrees with IANA | `UNDETERMINED`, with the reason recorded |

**Why not the "smallest annual offset is standard time" shortcut.** That was
the first implementation, and it is not universally safe. It silently fails
for zones with political offset changes, unusual DST rules, multiple
transitions a year, or a permanent change of standard offset, and it answers a
definitive YES/NO for histories it cannot actually interpret. Worked examples:

- **Morocco** (`Africa/Casablanca`, 2019) runs UTC+1 permanently and drops to
  UTC+0 for about a month each Ramadan. Two offsets, alternating — but not
  daylight saving. Now `UNDETERMINED`.
- **Pyongyang** (`Asia/Pyongyang`, 2018) moved from UTC+8:30 to UTC+9:00 in
  May 2018 and stayed there. One transition, never returning — a permanent
  standard-offset change. Now `UNDETERMINED`.
- **Samoa** (`Pacific/Apia`, 2011) changed its standard offset and its date
  line in the same year. Now `UNDETERMINED` for the affected instant.

Covered by fixtures for the northern hemisphere (summer and winter), the
southern hemisphere (December and June), Europe/London, a no-DST zone,
Morocco, Pyongyang, an unknown zone, a missing offset, an unparseable instant,
and a declared offset that disagrees with IANA — plus a test asserting the
answer is identical under `TZ=UTC`, `TZ=Asia/Kolkata` and
`TZ=America/New_York`.

Known limits, stated rather than hidden: the season bounds (60–275 days) are
judgement calls; a zone whose DST period fell outside them would be reported
`UNDETERMINED` rather than answered wrongly. `Intl` exposes no DST flag, so
"standard offset" is inferred from the transition history, not read from the
database.

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

### 4.3 The gate read local wall-clock times in the host timezone — FIXED

**Symptom.** Found by independent review, not by the sandbox. `CG_UTC_CONVERSION`
parsed `1995-06-15T10:30:00` with `Date.parse()`, which turns a zoneless value
into an instant in **whatever zone the host runs in**: 10:30Z on a UTC server,
05:00Z on an Asia/Kolkata server, 14:30Z on an America/New_York server. The
gate then computed a local-minus-UTC delta of 0 minutes against a declared
+330 minutes and **blocked a valid Indian chart** — but only on a machine
running Asia/Kolkata. The sandbox runs UTC, so every test passed.

**Fix.** `localDateTime` is now treated as a wall-clock *tuple*:
`parseWallClockToUtcEpoch()` reads the year/month/day/hour/minute/second
components explicitly and reassembles them with `Date.UTC`, which is
host-independent. A value that would silently roll over (30 February, hour 25)
is rejected instead of normalised. Absolute instants go through
`parseAbsoluteInstant()`, which refuses a timestamp that carries a time but no
zone, because such a value is ambiguous and guessing is what caused the bug.
Dasha dates use the same parser. No `Z` is appended to any local value — that
would be a lie about what the value means.

`CG_UTC_CONVERSION` is unchanged in purpose and still fails closed; only the
parsing is now deterministic.

### 4.4 Dasha dates moved a day with the host timezone — FIXED

Found while proving requirement 7 (identical hashes in every environment). The
content hash differed between host timezones, and the cause was not the gate:
`src/lib/dashaEngine.js` built the birth date with
`new Date(bYear, bMonth - 1, bDay)` — a **local** midnight — and emitted every
period with `toISOString().split('T')[0]`, which is UTC. On a host east of UTC
the whole Vimshottari timeline slipped a day: the same birth produced a first
mahadasha beginning `1995-06-14` on an Asia/Kolkata server and `1995-06-15` on
a UTC server.

**Fix.** `new Date(Date.UTC(bYear, bMonth - 1, bDay))`. Every later step is
epoch arithmetic, so the whole timeline is now identical in every host
timezone. Astronomical values (Julian day, ascendant, graha longitudes) were
already host-independent.

## 5. Test evidence

`tests/kundli-pipeline/consistency-gate.spec.ts` — **67 tests, all passing**
`tests/kundli-pipeline/passport-certificate.spec.ts` — **33 tests, all passing**
`tests/kundli-pipeline/timezone-independence.spec.ts` — **54 tests, all passing**:

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

The passport suite additionally covers: every required passport field present
and equal to the canonical value; the content hash being deterministic across
two builds yet changing when a planet moves; the certificate naming the yoga
rules it did not calculate; the unverified-locator disclosure; the absence of a
QR code; and the gate blocking delivery when the passport, the certificate, or
the certificate's own limits are removed.

`tests/kundli-pipeline` as a whole: **271 passed, 0 failed**, and the entire
suite was run three times — under `TZ=UTC`, `TZ=Asia/Kolkata` and
`TZ=America/New_York` — with **271 passed in all three**. That triple run is
the only reason defect 4.3 can be considered fixed rather than merely
untested: the sandbox runs UTC, which is precisely the environment in which
the bug is invisible.

Regression check against the pre-change baseline: a ten-file subset was run
before and after the change under identical conditions. Both runs produced
**exactly 25 non-passing tests, in the same files with the same statuses**
(all environmental — no server running, no network geocoding, chromium outside
the default cache). **Zero regressions.**

---

## 6. What this gate does NOT yet do

Stated plainly, because a gate's coverage is only as good as its gaps:

1. **No verification destination exists.** The certificate deliberately
   carries no QR code, because a QR would imply a place where the document can
   be checked and none has been built and tested. Until one exists, a reader
   cannot independently verify a delivered PDF from the document itself.
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
under test with a stable error code, and has caught three real defects — one of
them delivered to every reader, one of them invisible except on a non-UTC
server. It is not `READY_FOR_INDEPENDENT_REVIEW` while the contradiction
fixtures were authored by the same change that wrote the gate. Reviewers should
try to construct a contradiction it misses, and should keep running the suite
under a non-UTC timezone: that is where two of the three defects were hiding.
