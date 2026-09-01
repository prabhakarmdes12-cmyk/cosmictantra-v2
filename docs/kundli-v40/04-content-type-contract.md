# 04 — Content Type Contract

Implementation: [`src/lib/kundli/v40/contentTypes.ts`](../../src/lib/kundli/v40/contentTypes.ts).

This is invariant **KUNDLI_INV_002**: fact, rule and interpretation are
separate typed objects, not separate paragraph styles.

## The six types

| Type | Meaning | Example |
|---|---|---|
| `CALCULATED_FACT` | Produced by the astronomical calculation | "Venus 11.72° Vrishabha, bhava 10" |
| `DERIVED_JYOTISH_FACT` | A classical rule applied mechanically to calculated facts | "Venus rules bhava 3 and bhava 10 for this lagna" |
| `TRADITIONAL_RULE` | A named yoga/dosha rule and its verdict, with its system | "Budhaditya Yoga — present" |
| `INTERPRETIVE_SYNTHESIS` | Reasoning over facts and rules | "Natal indication: strong" |
| `PRACTICAL_REFLECTION` | A question or practical thought for the consultation | "Which reading of vakri graha does the Pandit apply?" |
| `NOT_CALCULATED` | The engine did not compute it | "Purnimanta masa — not calculated" |

## Rules that follow from the contract

1. **A renderer never recalculates** (KUNDLI_INV_001). `rendererV2.ts` imports
   no astrology module. It draws blocks.
2. **`NOT_CALCULATED` is never rewritten as `ABSENT`.** The two are different
   claims: one says "we did not look", the other says "we looked and it is not
   there". The Saar page deliberately does *not* collapse an unresolved yoga
   into a scholar verdict, even though the tidier page is tempting.
3. **Every rule states its system.** `JyotishSystem` is
   `PARASHARI | JAIMINI | KP | TAJIKA | MIXED_DECLARED`. `MIXED_DECLARED`
   exists so that mixing, if it ever happens, must be declared (KUNDLI_INV_004).
4. **Every interpretive claim carries `evidenceIds`.** These are canonical fact
   paths, resolvable against the chart — see
   [`08-traceability-and-evidence.md`](08-traceability-and-evidence.md).
5. **A capability that is not fully `CALCULATED` may not influence a
   conclusion.** `CapabilityRecord.mayInfluenceConclusions` is derived from the
   status inside `buildDerivedModel`, never written by hand, so a newly added
   capability cannot leak into the reasoning path by omission.

## Structured conclusion

`StructuredConclusion` is the only shape an interpretation may take:

```ts
{
  contentType: 'INTERPRETIVE_SYNTHESIS';
  system: JyotishSystem;
  statements: { text: string; evidenceIds: string[] }[];
  natalIndication: 'STRONG' | 'MODERATE' | 'MIXED' | 'LIMITED';
  currentActivation: 'STRONG' | 'MODERATE' | 'MIXED' | 'LIMITED';
  explicitlyNotClaimed: string[];   // never empty
}
```

`explicitlyNotClaimed` is mandatory and is printed. For career it currently
reads, in part: *no profession, employer, salary, promotion or business outcome
is named; no date of a career event is given; evidence coverage is the fraction
of the declared factor checklist that produced evidence, not a probability of
success.*

## Confidence, not probability

`ConfidenceReport` reports `evidenceCoverage` (resolved factors ÷ declared
factors), the named `resolvedFactors`, the `missingFactors` **with reasons**,
a `ruleAgreement` sentence and a `birthTimeSensitivity` note. It never reports
a percentage chance of an outcome, and the report says so on the same page as
the number.

## Banned language

`scholarSummary.BANNED_PHRASES` is scanned across the **whole report model**
before rendering (gate 4b in `pipelineV2.ts`), so a banned phrase cannot reach
an artifact at all. During development the scanner caught the phrase
"will happen" inside a disclaimer that said the report does *not* say what will
happen; the sentence was rewritten rather than the scanner weakened.
