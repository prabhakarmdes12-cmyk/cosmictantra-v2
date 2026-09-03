# 08 — Sprint F: Shadbala + Bhava Bala + Ashtakavarga Validation

**Status**: COMPLETE (this workspace)
**Runner**: `bala-qualification-runner-1.0.0 (sprint F)` — `npm run qualify:bala`
**Certification**: `docs/reference-grade/bala-certification.md` (GENERATED — never hand-edit numbers)
**Fixture set**: `qualification/fixtures/bala-fixtures.json` — `BALA_ENGINE_BENCHMARK_001`
(sha256 `afb31539bdd9444a8435c4e6b2dcb1f4b2aec7ae4436021989a0416eef417ebc`;
classical tables `SOURCE_SECONDARY`; required-Rupas table `ATTRIBUTION_UNVERIFIED`;
2 golden charts `ENGINE_DERIVED`)

---

## 1. Scope (Mission §10–§12)

- **§10 Shadbala**: audit the existing implementation *before changing anything*;
  validate the six components and their subcomponents; keep raw components, units,
  required minimums, sources, and validation state inspectable.
- **§11 Bhava Bala**: every component inspectable; no silent feeding of synthetic gauges.
- **§12 Ashtakavarga**: BAV, SAV, Trikona Shodhana, Ekadhipatya Shodhana; explicit provenance.

## 2. Audit results — defects found and fixed

1. **RSK_014 (HIGH) — day/night strength used the wrong planet's house**: Nathonnatha
   (and Tribhaga) derived `isDay` from the planet being scored instead of the Sun.
   Measured: on a single day chart, Jupiter (H1) scored 0 while Venus (H11) scored 60;
   the Moon scored 60 on a day birth. Each planet saw a different "day". Fixed: day
   birth is a property of the Sun (houses 7–12 above the horizon, whole-sign
   convention); one determination per chart. Regression-pinned in the gate spec.
2. **RSK_015 (MEDIUM) — `ekadhipatyaShodhana` was a mislabeled copy of the trikona
   reduction**: the field name promised the classical co-lordship reduction while the
   code returned `[...trikonaShodhana]`. No consumer read it. Withdrawn to an honest
   `{ status: 'NOT_CALCULATED', reason, values: null }` (CT_INV_006 — declared, never
   fabricated); the same-lord rashi pairs an implementation must satisfy are frozen in
   the fixture set.
3. **Builder defect (caught by the runner's own gate)**: the fixture builder originally
   captured Ashtakavarga/Bhava-Bala goldens with `lagnaRashiId = 1` (a `houseOf(lagna, lagna)`
   slip) — the golden regression pins failed on rebuild, exposing it. Fixed and rebuilt.

Non-defects the gate forced into precision (my check assumptions corrected to the
engine's *declared* models, now pinned): the Moon's Cheshta = doubled Paksha Bala
(≤ 120), the Sun's Cheshta = Ayana Bala ([0, 60]), and the exact
`parseFloat(x.toFixed(2))` publication rounding for rupas/ratios.

## 3. What the audit verified as already classically sound

- **Ashtakavarga**: the engine's benefic-point tables reproduce the binding classical
  totals **exactly and chart-independently**: Sun 48, Moon 49, Mars 39, Mercury 54,
  Jupiter 56, Venus 52, Saturn 39; SAV = Σ BAV = **337** in every scenario.
  Trikona Shodhana is a true group-minimum reduction (verified against an independent
  recompute); shodhana never increases bindus.
- **Naisargika virupas** (60…8.57), **debilitation points** (Sun 190°, Moon 213°,
  Mars 118°, Mercury 345°, Jupiter 275°, Venus 177°, Saturn 20°), **Moolatrikona
  zones**, **Dig Bala strong houses**, **special aspects** (Mars 4/8, Jupiter 5/9,
  Saturn 3/10), and the **Saptavargaja dignity scale** — all frozen as fixtures and
  independently recomputed per scenario.

## 4. Qualification design

- Seeded, fingerprinted scenario stream (half day-births, ~22% retrogrades); every
  scenario runs the full Ashtakavarga + Shadbala + Bhava Bala pipeline.
- **Identity checks** (all independent recomputes from the frozen tables):
  BAV totals; SAV sum identity; trikona group-min identity; monotonicity; houseSav
  consistency; Ekadhipatya honesty pin; total = Σ six components; rupas/ratio
  publication rounding; Uchcha/Dig recompute; Naisargika frozen table; Kendra/Drekkana
  structural values; Cheshta range per declared model + retrograde rule; Drik =
  benefic − malefic; chart-level day/night consistency; Bhava Bala rashi/lord mapping,
  component sum, dig range, unique ranks.
- **Golden charts**: two ENGINE_DERIVED pins (kernel release chart + Patna golden).
- **Determinism**: every 100th scenario fully recomputed (CT_INV_007).

## 5. Full-scale result (50,000 scenarios)

| Check | n | violations |
|---|---|---|
| Ashtakavarga identity checks | 350,006 | 0 |
| Shadbala identity checks | 5,250,056 | 0 |
| Shadbala day/night consistency (RSK_014) | 50,000 | 0 |
| Bhava Bala identity checks | 200,002 | 0 |
| Golden regressions | 2 charts | 0 |
| Determinism recomputes | 500 | 0 |

Verdict **PASS** on both `scaffold` and `strict` gates.

## 6. Declared simplifications (surfaced, never hidden — CT_INV_006)

| Code | Statement |
|---|---|
| `DECLARED_VARSHAMASA_NOMINAL` | Varsha/Masa/Dina/Hora lords are a nominal constant (45 virupas), not lord-derived. |
| `DECLARED_YUDDHA_BALA_ZERO` | Planetary-war strength declared 0; war geometry not computed. |
| `DECLARED_CHESHTA_SPEED_MODEL` | Cheshta uses a clamped speed-ratio/retrograde model (Moon = doubled Paksha, Sun = Ayana), not the epicyclic arc. |
| `DECLARED_DIG_HOUSE_GRANULAR` | Dig Bala is house-granular, not bhava-madhya-granular. |
| `DECLARED_EKADHIPATYA_NOT_IMPLEMENTED` | Ekadhipatya Shodhana NOT_CALCULATED (RSK_015). |
| `DECLARED_REQUIRED_RUPAS_UNVERIFIED` | Required-minimum Rupas carried as ATTRIBUTION_UNVERIFIED — never cited as verse-verified. |

In-code comments claiming verse locators ("BPHS Ch 27", "Ch 66-72") are superseded by
this registry: those locators are not independently verified; the binding checks are
the classical totals and constants reproduced exactly by the fixture tables.

## 7. Validation status after Sprint F (CT_INV_005 tiers)

| Capability | Tier | Basis |
|---|---|---|
| Ashtakavarga BAV/SAV + Trikona Shodhana | **INTERNALLY_VERIFIED (strong)** | Classical binding totals reproduced chart-independently; independent reduction identity |
| Shadbala component structure & identities | INTERNALLY_VERIFIED | Frozen constants + per-scenario recomputes; models declared where simplified |
| Bhava Bala structure | INTERNALLY_VERIFIED | Frozen lord table + component identities |
| Ekadhipatya Shodhana | NOT_CALCULATED | Declared gap (RSK_015) |
| Pinda calculations | NOT_CALCULATED | Not implemented; declared (never adopted silently) |
| Required-minimum Rupas | ATTRIBUTION_UNVERIFIED | Engine's declared values; scholar verification pending |

The charter's next tier (EXTERNALLY_VERIFIED) requires named external references for
Shadbala/Ashtakavarga values; none are fabricated here.

## 8. §11 consumer check

`executiveLifeGauge.ts` consumes the Shadbala strength *ratio* and SAV bindus with
their grounding displayed alongside the scores; it does not consume Bhava Bala. With
Sprint F, both inputs are internally verified and their simplifications are declared
in the certification — the gauge is not silently fed by an unvalidated engine. A
future sprint must keep Bhava Bala out of any career/wealth/health score until
externally verified (charter §11).

## 9. Assumptions recorded

- Whole-sign house convention for the day/night determination (Sun in houses 7–12 =
  above horizon = day). Coarse near the horizon by construction; declared.
- The 365.25-day year, dignity scale, and virupa arithmetic follow the engine's
  declared conventions (consistent with Sprint E's dasha conventions).
- The scenario generator's "retrograde" flag exercises the Cheshta retrograde branch;
  real retrograde detection remains the provider's (Sprint C-certified) speed data.

## 10. Unresolved problems

- Ekadhipatya Shodhana and Pinda calculations await a scholar-verified classical
  rule statement before implementation (CT_INV_001).
- The epicyclic Cheshta Bala and lord-derived temporal strengths remain declared
  simplifications; upgrading them requires verified derivations, not guesses.
- All bala capabilities remain one honest tier below external verification; the D10
  golden-validation register pattern is the route for future external evidence.
