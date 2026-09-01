# 09 — Career Synthesis

Implementation: [`src/lib/kundli/v40/careerSynthesis.ts`](../../src/lib/kundli/v40/careerSynthesis.ts)
(`career-synthesis-v1`). Pages 11–12 of the report.

Career is the **only** interpretive domain V40 builds end to end. Marriage,
health, finance, progeny and litigation are not synthesised, and the report
says so rather than leaving the reader to notice the gap.

## The declared factor checklist

Thirteen factors. This list is the denominator of evidence coverage, so
coverage cannot be inflated by adding easy factors after the fact.

| # | Factor | Golden chart |
|---|---|---|
| 1 | `TENTH_BHAVA_SIGN` | resolved — Vrishabha |
| 2 | `TENTH_LORD_IDENTITY` | resolved — Venus |
| 3 | `TENTH_LORD_PLACEMENT` | resolved — 10th bhava |
| 4 | `TENTH_OCCUPANTS` | resolved — Sun, Mercury, Venus |
| 5 | `LAGNESHA_RELATION` | resolved — Sun in the 10th with the 10th lord |
| 6 | `ARTHA_TRIKONA` | resolved |
| 7 | `FUNCTIONAL_LORDSHIP` | resolved |
| 8 | `DIGNITY_OF_KEY_GRAHAS` | resolved |
| 9 | `DRISHTI_ON_TENTH` | resolved — Jupiter (7th), Saturn (3rd) |
| 10 | `CAREER_YOGAS` | resolved |
| 11 | `D10_CONFIRMATION` | **missing** — validation pending |
| 12 | `DASHA_ACTIVATION` | resolved |
| 13 | `TRANSIT_ACTIVATION` | **missing** — gochara not validated |

Coverage = 11/13 ≈ **85 %**, which is the ceiling for this build.

## Output shape

- `natalPromise` — the bare structural facts the reading starts from
- `supportiveFactors` / `challengingFactors` / `mixedFactors` — every claim,
  with evidence paths, **including the ones that work against the reading**
- `dashaActivation` — which artha bhavas the running lords touch
- `vargaConfirmation` — D10 status, always
- `transitActivation` — always NOT_CALCULATED for now
- `conclusion` — a `StructuredConclusion`
- `confidence` — a `ConfidenceReport`

Rules that were evaluated and did not fire are aggregated into a **single**
line rather than one bullet each. Printing seven "X Yoga is absent" bullets
pads the page and buries the factors that carry the reading.

## How the conclusion buckets are computed

`natalIndication` from net = supporting − challenging: ≥3 STRONG, ≥1 MODERATE,
0 MIXED, otherwise LIMITED. `currentActivation` from the count of SUPPORTING
dasha claims: ≥3 STRONG, ≥2 MODERATE, otherwise MIXED; none → LIMITED.

Golden chart: 7 supporting, 0 challenging → **natal indication STRONG**;
2 supporting dasha claims → **current activation MODERATE**.

## What the page refuses to say

Printed verbatim beside the conclusion:

> Evidence coverage 85 % means 11 of 13 declared factors produced evidence.
> No profession, employer, salary, promotion or business outcome is named.
> No date of a career event is given. Evidence coverage is the fraction of the
> declared factor checklist that produced evidence. It is not a probability of
> success. D10, shadbala and transits did not contribute to this reading.

A test asserts that no `\d{1,3}% (chance|probability|likely)` pattern appears
in any conclusion or natal-promise statement.

## Birth-time sensitivity

Every bhava-based factor depends on the lagna, which moves roughly one degree
every four minutes. The page states that if the recorded birth time is
uncertain by more than about two minutes, the bhava-based factors should be
re-checked before use. For the golden chart the lagna is at Leo 12°06′ —
comfortably inside its sign, so the sensitivity note is informational rather
than a warning.

## Dasha activation profiles

[`dashaActivation.ts`](../../src/lib/kundli/v40/dashaActivation.ts)
(`dasha-activation-v1`) builds one `ActivationProfile` per MD / AD / PD lord:
natal bhava and rashi, bhavas ruled, dignity, conjunctions, bhavas aspected,
yoga participation. `overlappingThemes` reports bhavas touched by more than one
active lord — for the golden chart, bhava 11 is touched by both Mercury and the
Moon.

The `timingNote` printed at the top of page 10 is the whole philosophy in one
sentence: *a dasha states WHEN a part of the chart becomes prominent; it does
not name the events that follow.*

## Vimshottari balance precision

The canonical adapter rounds the birth balance to `5.0 years` (defect V40-D01).
`computeVimshottariBalance()` re-derives it from the Moon's sidereal longitude
using the engine's own constants (nakshatra span 360/27, 365.25-day year) and
prints `Sun — 5y 0m 4d (5.012356 years)`, together with the fraction of the
birth nakshatra that remained (83.5393 %). It then cross-checks against the
first mahadasha the dasha engine itself emitted and reports the delta in days;
the acceptance test requires agreement within one day.
