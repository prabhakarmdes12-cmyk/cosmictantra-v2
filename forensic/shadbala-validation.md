# Shadbala — validation status

**Status: VALIDATION PENDING. Not exposed. Not used in any conclusion.**

`src/lib/jyotish/balaEngine.ts` (687 lines) computes a full six-fold shadbala —
sthana, dig, kala, cheshta, naisargika and drik bala — in virupas and rupas.
None of those numbers appears anywhere in a V40 report, and no V40 conclusion
depends on one.

## Why it is withheld

Shadbala is the most quantitative-looking output the engine produces, which
makes it the most dangerous to publish unvalidated: a number with two decimal
places reads as measurement whether or not anyone has checked it. Nobody has
checked this one against an independent source.

Secondary effects of the same decision:

- **Bhava bala** is therefore also `NOT_CALCULATED`, because it depends on
  shadbala. The Bhava Intelligence Matrix carries an explicit `strength:
  NOT_CALCULATED` rather than a plausible-looking figure.
- The career synthesis lists graha **dignity** among its factors but not graha
  **strength**.

## What the report says instead

Appendix B7 prints:

> Shadbala — validation pending. The kernel computes a full six-fold shadbala
> (sthana, dig, kala, cheshta, naisargika, drik) in virupas and rupas. No number
> from it appears anywhere in this report and no conclusion uses it, because it
> has not been compared against an independent trusted reference.

## Validation plan

Shadbala may be exposed only when **all** of the following are complete and
recorded in this file:

1. **Two independent references.** Compare the six components and the total,
   per graha, against at least two independent implementations or published
   worked examples — e.g. a licensed commercial product and a textbook's fully
   worked chart. One reference is not enough: it establishes agreement with one
   opinion, not correctness.
2. **A corpus, not a chart.** At least 50 charts spanning latitudes (equatorial
   to > 60°), all twelve lagnas, both hemispheres and both ayanas — kala bala
   and dig bala are the components most likely to break at extremes.
3. **Component-level agreement, not just totals.** Two implementations can
   reach a similar total by compensating errors. Each of the six components
   must agree within a declared tolerance, and the tolerance must be stated
   here before the comparison is run.
4. **A documented convention decision.** The tradition disagrees about several
   inputs (ishta/kashta phala, the treatment of the nodes, whether Rahu and
   Ketu receive shadbala at all). The convention adopted must be written down
   and printed with the numbers, the way the aspect policy is.
5. **A regression fixture.** A golden shadbala fixture with hand-checked
   expected values, so a later refactor cannot silently move the numbers.

## Current state of each step

| Step | State | Blocker |
|---|---|---|
| 1 — two independent references | **not started** | no network access to a licensed product from this environment; no worked example is held in the repository |
| 2 — corpus run | not started | depends on step 1 |
| 3 — component tolerances | not started | depends on step 1 |
| 4 — convention decision | not started | should be recorded before the comparison, not after |
| 5 — regression fixture | not started | depends on steps 1–4 |

## Rule

Until this file records all five steps as complete, any code path that would
put a shadbala number into a report, a conclusion, a bhava strength or a
confidence figure is a defect. The `capabilities` inventory in
`v40/derivedModel.ts` enforces this mechanically:
`mayInfluenceConclusions` is derived from the capability status, so shadbala's
`VALIDATION_PENDING` status bars it from the reasoning path without anyone
having to remember.
