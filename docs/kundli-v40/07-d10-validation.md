# 07 — D10 Validation

Implementation: [`src/lib/kundli/v40/d10Validation.ts`](../../src/lib/kundli/v40/d10Validation.ts)
(`d10-validation-v1`). Appendix B6 of every report prints the result.

## Status

**VALIDATION_PENDING. `mayInfluenceConclusions: false`.**

D10 is drawn from the kernel, compared, and printed for reference. It is used
by no conclusion in the report. The career synthesis lists
`D10_CONFIRMATION` under *factors that could not be evaluated*, which is why
maximum career evidence coverage is 11/13 ≈ 85 % and not 100 %.

## The rule as implemented

Each rashi is divided into ten parts of 3°. From an **odd** rashi the parts are
counted from that rashi itself; from an **even** rashi they are counted from
the ninth rashi from it.

The kernel implements this in `src/lib/jyotish/vargaEngine.ts` (lines 170–178)
as `odd: rashi + part`, `even: rashi + 8 + part`. `referenceDashamsha()` in
`d10Validation.ts` is an independent re-implementation written from the rule
statement, not from the kernel source.

## Comparison on the golden chart

| Graha | Kernel | Independent reference | Agreement |
|---|---|---|---|
| Sun | Tula | Tula | match |
| Moon | Kanya | Kanya | match |
| Mars | Makara | Makara | match |
| Mercury | Mithuna | Mithuna | match |
| Jupiter | Dhanu | Dhanu | match |
| Venus | Mesha | Mesha | match |
| Saturn | Vrishchika | Vrishchika | match |
| Rahu | Makara | Makara | match |
| Ketu | Karka | Karka | match |
| Lagna | Dhanu | Dhanu | match |

`validateD10(canonical).allAgree === true`, asserted by
`tests/kundli-v40/derived-model.spec.ts`.

## Why that is not enough to promote it

Two implementations of the same rule agreeing shows the code is internally
consistent. It does not show the *rule* is the one the tradition intends, nor
that the boundary handling is right where a graha sits near a 3° edge.
Promotion requires all three of:

1. **an external reference.** Comparison against at least one independent,
   licensed ephemeris/Jyotish product for a corpus of charts. This sandbox has
   no network access to such a product, so this step is **not done**.
2. **boundary fixtures.** Hand-computed charts with grahas at 2.999°, 3.000°
   and 3.001° within both odd and even rashis, and at 29.999°.
3. **a corpus run.** The whole regression corpus, not one chart.

Until all three pass, `D10_PROMOTION.status` stays `VALIDATION_PENDING` and the
appendix prints the reason in the report itself rather than only here.

## Promotion checklist

- [x] Independent re-implementation written from the rule statement
- [x] Kernel vs reference agreement on the golden chart, all grahas + lagna
- [x] Result printed in the report with its status
- [x] Excluded from every conclusion (`mayInfluenceConclusions: false`)
- [ ] External licensed reference comparison — **blocked: no network access**
- [ ] Boundary fixtures at 3° part edges
- [ ] Full corpus run
- [ ] `ChartDivision` extended to `1 | 9 | 10` and a D10 chart page added

Only when every box is ticked does D10 become a chart page and a career factor.
