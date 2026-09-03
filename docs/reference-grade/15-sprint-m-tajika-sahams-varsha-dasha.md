# Sprint M — Tajika depth: Sahams + Varsha Dasha

**Status: COMPLETE.** The two headline items Sprint L queued are now computed,
sourced and qualified: the **35 classical Sahams** (Raman ch. 8) and the
**Varsha Dasa** periods (Raman ch. 5). Engine `varshaphala-engine-2.1.0
(sprint M, sahams + varsha dasha)`. Registry grows 63 → **65** rules.

## 1. What was built

### 1.1 The 35 Sahams (`RULE_TAJIKA_SAHAMS`)
- Day-formula table exactly as tabulated in Raman ch. 8
  (`SAHAM_DEFS` in the engine): `Saham = Minuend − Subtrahend + Anchor`.
- **Night reversal**: minuend/subtrahend swap (anchor unchanged) unless the
  saham is marked same-day/night (Bhratru, Vyapara — preserved exactly as the
  source lists them, including the textual quirk that Satru shares Vyapara's
  day formula but flips at night).
- **The 30° correction** applied when the ascendant does NOT fall on the
  forward arc from minuend to subtrahend (`((asc−min) mod 360) ≤ ((sub−min)
  mod 360)`) — the adopted mechanical reading of Raman's "ascendant falls
  between" rule, declared on the registry row.
- Operand resolution: planet longitudes, the varsha lagna, **whole-sign cusps**
  for II/VI/VIII/IX (declared convention; Sripati madhya cusps are a declared
  alternative), lord operands = the lord planet's annual longitude, fixed
  Cancer 15° for Jalapathana, and dependency sahams (Punya → Yasa/Mitra/
  Mahatmya/Bandhana; Sastra/Punya → Preeti) computed first under the same
  day/night rule.
- Raman's own caution is carried on the result: many Sahams "do not work in
  practice" — positions are computed; judgment stays with the practitioner
  (scholar flow), never automated. Timing methods are NOT implemented
  (`DECLARED_SAHAM_TIMING_NOT_IMPLEMENTED`).

### 1.2 Varsha Dasa (`RULE_TAJIKA_VARSHA_DASHA`)
- Krissamsa = longitude mod 30 for the **seven grahas + the annual ascendant**
  (8 participants, per the worked example); sorted ascending; first patyamsa =
  its own krissamsa, the rest consecutive differences; total = the largest
  krissamsa (identity pinned); each period = patyamsa/total × **365.25 days**
  (Raman's 365d 6h), starting at the varshapravesha instant, contiguous.
- Bhukti formula carried on the result (`(durY × durX)/365.25` along the
  ascending sequence starting at Y); Raman's explicit deprecation of a
  Vimshottari overlay for annual charts is recorded on the rule.

## 2. A real bug the §21 independent check caught

Stream E's independent Saham recompute (formula table duplicated from the
source text) diverged on **1 of 35 sahams in 2 of 400 charts** — always Roga,
always by exactly 30°. Root cause: the betweenness test folded each operand
through `normalizeDeg()` before subtracting, and the double `%`-round-trip
drifted by one ulp — turning *ascendant exactly at the minuend* (Δ = 0) into
359.99999999999994, which read as "just behind the arc" and falsely added the
correction. Fix: fold the **raw difference exactly once**. The engine was
wrong; the independent implementation was right — regression-pinned in the
gate spec (`FP regression pin`).

## 3. Qualification — `npm run qualify:varshaphala` (strict 400)

Fixture `VARSHAPHALA_TAJIKA_001` v2, sha `594c760da2621399…` (saham + dasha
golden pins added). **Verdict PASS — 0 violations.**

| Stream | Checks / violations | What it proves |
|--------|---------------------|----------------|
| A AUDIT_PINS | 18 / 0 | fabrications stay dead; 35 saham rows with the withdrawal history; PV identity |
| B SOLAR_RETURN | 1,601 / 0 | unchanged from Sprint L — still green |
| C ANNUAL_STRUCTURE | 5,200 / 0 | unchanged — still green |
| D SELECTION_IDENTITY | 2,003 / 0 | unchanged — still green |
| **E SAHAM_DASA_IDENTITY** | **3,600 / 0** | all 35 sahams match an independent recompute from the source formula table (incl. day/night variant selection); varsha dasha invariants (8 periods, patyamsa identity, Σ = 365.25 d, contiguous, start at the return) |
| GOLDEN_REPLAY | 49 / 0 | pinned scenarios reproduce (incl. Punya longitude/correction pins) |
| Determinism | 3 / 0 | byte-equal |

Gate spec `tests/varshaphala-qualification.spec.ts` — **22/22** (new: saham
shape, the FP regression pin, day/night reversal identity, dasha invariants,
golden saham/dasha pins). Declared findings now six, all NON_BLOCKING.

## 4. Ripple effects handled

Two registry rules added (63 → 65): rule-registry fixtures rebuilt
(`ce6c9661…`), yoga fixtures rebuilt (`8bac9cf4…`), why-graph fixtures rebuilt
(`d42e1d82…`); `qualify:registry` / `qualify:yoga` / `qualify:why` re-run
PASS at scale; Sprint-H spec count pins updated to 65.

## 5. Artifacts

- `src/lib/jyotish/varshaphalaEngine.ts` — `SAHAM_DEFS`, `computeSahams`, `computeVarshaDasha`
- `qualification/fixtures/varshaphala-fixtures.json` — v2 (saham + dasha goldens)
- `qualification/varshaphala-qualification-runner.ts` — stream E added
- `tests/varshaphala-qualification.spec.ts` — 22/22
- npm: `qualify:varshaphala` / `qualify:varshaphala:scaffold`

**Queued**: Saham timing methods (progression, directional), Hadda tables
(still need a machine-readable source), 16 Tajika yogas (Ithasala et al. —
need the Deeptamsha orb tables), transit Vimshottari overlay + Kaksha, yoga
families toward ~100, scholar-console UI slice.
