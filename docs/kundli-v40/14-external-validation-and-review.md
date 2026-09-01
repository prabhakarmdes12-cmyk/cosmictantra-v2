# 14 — External Validation and the D10 Quarantine

Implementation:
[`src/lib/kundli/v40/validation/externalValidation.ts`](../../src/lib/kundli/v40/validation/externalValidation.ts)
(`external-validation-v1`),
gate in [`d10Validation.ts`](../../src/lib/kundli/v40/d10Validation.ts).

---

## 1. The problem this exists for

V40 shipped one **blocked** release gate: *no external reference for D10 or
shadbala*. D10 agrees with a second, independently written in-house
implementation of the classical Dashamsha rule, and with hand-computed boundary
fixtures.

That establishes that our arithmetic is self-consistent, and **nothing else**.

> Two implementations of the same misunderstanding agree perfectly.

Both were written by people reading the same rule statement, in the same
codebase, with the same assumptions about odd/even rashi counting. If that
reading is wrong, both are wrong, identically, and the cross-check is silent.

## 2. The harness

`ExternalValidationCase` — provider-neutral by construction. No API, no
hardcoded expected value, no named vendor anywhere in the codebase. A reference
is a **string**: a name, an edition, a version.

```ts
interface ExternalValidationCase {
  id; quantity; subject;
  birthInput;                 // what was asked
  ourSettings;                // ayanamsha, house system, node policy, zodiac
  cosmicTantraResult; cosmicTantraValue?;
  referenceName; referenceResult; referenceValue?;
  referenceProvenance?; comparedOn?;
  tolerance; toleranceUnit;   // DEGREES | ARCMINUTES | DAYS | EXACT_MATCH
  status;                     // NOT_ATTEMPTED | AGREES | DISAGREES
                              // | NOT_COMPARABLE | REFERENCE_UNAVAILABLE
  notes;
}
```

Quantities covered: Lagna longitude, planetary longitude, nakshatra, pada, D9,
D10, Vimshottari boundaries, ayanamsha.

### 2.1 Settings are part of the evidence

Every case records the ayanamsha, house system, node policy and zodiac. This is
not bookkeeping. **Most apparent disagreements between two Jyotish engines are
not calculation errors** — they are a different ayanamsha implementation, a
true node against a mean node, or Placidus against whole-sign. A case that does
not record its settings is evidence of nothing, and `NOT_COMPARABLE` exists so
that such a comparison can be recorded honestly instead of being scored.

EV-06 states this explicitly: *compare against a MEAN node figure; a true-node
reference will differ by up to about 1.5° and is `NOT_COMPARABLE`, not
`DISAGREES`.*

### 2.2 The harness re-derives the verdict

`evaluateCase()` recomputes the comparison from the recorded numbers and
reports an **inconsistency** when the recorded status contradicts the
arithmetic:

```
EV-02: recorded AGREES but the numbers say DISAGREES
```

This guards the most dangerous failure mode of any validation register: a human
ticks the box and nobody reads the numbers again. Angular deltas wrap correctly
across 0° — 359.99° and 0.01° are 1.2 arcminutes apart, not 359.98° apart.

### 2.3 The register today

Fifteen cases, **every one `NOT_ATTEMPTED`**, with our values pre-filled from
the golden fixture and per-case tolerances justified in `notes`.

Writing that down is the point. An empty register is indistinguishable from a
register nobody has looked at; this one enumerates exactly which comparisons a
reviewer still owes. Filling one in is: open a reference, type its answer into
`referenceResult`, set `referenceValue`, flip the status. The harness does the
rest.

`summariseHarness()` reports `externallyValidated: false` and lists all seven
required quantities as unvalidated. It will keep saying so until someone does
the work.

---

## 3. The D10 quarantine

**`D10_VALIDATION_STATUS = 'INTERNAL_CROSSCHECK_ONLY'`**

`d10Gate(cases)` opens if and only if the register holds a case with
`quantity: 'D10_SIGN'` and `status: 'AGREES'` against a named external
reference. With today's register it is closed:

> D10 agrees with a second in-house implementation of the same rule.
> Self-agreement proves the arithmetic is consistent, not that the rule was
> read correctly. No external reference has been compared, so D10 is displayed
> for reference only.

### 3.1 One gate, not two

V40.1 rewires `D10_PROMOTION` — the single constant the whole report consults —
so it is **computed from** `d10Gate(GOLDEN_VALIDATION_REGISTER)` rather than
hand-set. Consequences:

- Opening the gate requires **editing evidence, not editing a boolean**.
- Appendix B6 prints `D10 status — INTERNAL CROSSCHECK ONLY` from the gate, so
  the page cannot claim a status the register does not support.
- `careerSynthesis` still lists `D10_CONFIRMATION` under factors that could not
  be evaluated, which is why career evidence coverage is 11/13 ≈ 85 % and not
  100 %.

`external-validation.spec.ts` proves the property that matters: **a hundred
internal cross-checks do not open the gate; one external agreement does.** A D9
agreement does not promote D10 either.

### 3.2 Shadbala is unchanged

Still computed by the kernel, still exposed nowhere, still used by no
conclusion. PA-06 in the density gate fails the build if the word reaches a
consultation page.

---

## 4. The Pandit review pack

[`src/lib/kundli/v40/panditReviewPack.ts`](../../src/lib/kundli/v40/panditReviewPack.ts)
→ `artifacts/kundli-v40/priya-v40-pandit-review.pdf` (24 pages).

Human validation, running in parallel with the machine kind. A validation
instrument, **not a product feature**.

Built by *transforming the report model*, not by a second content path — a
review pack assembled from different words would tell us about the review pack.
It keeps Part A, drops all eleven appendix sections, numbers the sections so a
reviewer's "§4" is unambiguous when pagination changes, and inserts ruled
annotation space (60+ lines) after every substantive section.

References to the Scholar Appendix are deliberately **left in place**, and the
cover says the appendix is available on request. A pointer a reviewer can act
on is useful; a dangling one reads as an omission.

The form asks:

1. Is the calculation correct? — per section, correct / questionable, with room
   for the expected value.
2. Usefulness in consultation — 1–5 for D1, D9, graha table, yoga dashboard,
   Vimshottari.
3. What is missing?
4. What is unnecessary?
5. Where do you disagree, and why? — three slots, with the reasoning.
6. Would you use this: for a client, as a working sheet, without re-checking?
7. Tradition, years of practice, language.

And it states what happens to the review: **every disagreement is entered into
the source registry as an unresolved variant rather than silently resolved in
one direction.** Nothing is marked correct because a reviewer approved of the
document in general.

---

## 5. What must not happen

- D10 must not be promoted on internal agreement, however much of it there is.
- A case must not be marked `AGREES` without a named reference — the harness
  reports the inconsistency, and `external-validation.spec.ts` fails on it.
- A reviewer's general approval must not be recorded as validation of any
  specific value.
- Nothing here may be described as "verified" until a row in this register
  says so.
