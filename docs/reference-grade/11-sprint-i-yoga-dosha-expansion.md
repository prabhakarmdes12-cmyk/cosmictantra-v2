# Sprint I — Yoga/Dosha Expansion

**Status**: COMPLETE · **Gate**: PASS (strict, 2,000 real-chart scenarios + 222 Kalsarpa geometries, 0 violations) · **Catalog**: `jyotish-source-registry-v2 (sprint I expansion)` · **Dosha**: `dosha-engine-1.0.0 (sprint I)` · **Fixture**: `YOGA_CATALOG_001` (sha `3d50b163…f508b8`)

Charter §15–§16: preserve the registered rules; expand carefully toward ~100 curated
HIGH-VALUE rules; existence and strength MUST stay separate; Kalsarpa must not be exposed
until its definition and variants are formally registered. Flagship outcome: the yoga
catalog grew **11 → 44 rules**, and **Kalsarpa was formally adopted** (the Sprint H variant
register made the adoption possible).

---

## 1. The expanded yoga catalog (charter §15)

All 33 new rules follow the established discipline: a `yogaSourceRegistry` entry (NOT
VERIFIED locators, `adoptedInterpretation` authoritative, variants + limitations declared,
existence-only policy) paired with an evaluator in `yogaEngine.ts`, auto-cross-linked into
the Classical Rule Registry by the Sprint H adapter.

| Family | New rules |
|--------|-----------|
| Moon flanking (Sun/nodes excluded — variants declare the inclusions) | Sunapha, Anapha, Durudhara |
| Benefic triads | Adhi (6/7/8 from Moon), Lagnadhi (6/7/8 from Lagna), Vasumati (upachayas 3/6/10/11) |
| affliction-patterns (registered, existence-only, no fortune claims) | Sakata (Moon 6/8/12 from Jupiter), Papa Kartari (Saturn/Mars flanking the Lagna) |
| benefic patterns | Amala (10th from Lagna or Moon), Shubha Kartari, Saraswati (with Jupiter own/exalt condition) |
| Sun flanking | Vesi, Vasi, Ubhayachari |
| Dhana | 2nd–11th lords exchange, 2nd–11th lords conjunct, 2nd lord in 11th, 11th lord in 2nd, Lakshmi (9th lord own/exalt in kendra — Venus-strength qualifier deliberately NOT applied) |
| Raja | Raja Sambandha (distinct trikona × kendra lords, conjunction or exchange), Viparita Harsha / Sarala / Vimala (dusthana lords), Neecha Bhanga (dispositor-in-kendra subset; exaltation-lord + in-kendra conditions declared as unadopted alternatives) |
| Exchange | Parivartana (general, pair evidence; Maha/Khala sub-classification declared unadopted) |
| Nabhasa | Rajju, Musala, Nala (asraya), Gola, Yuga, Sula, Kedara (Sankhya 1–4 signs), Kamala (all kendras) |
| Contested, NOT_ADOPTED | Kalpadruma (chained dispositor formulation) — joins Kemadruma and Dharma-Karma mutual-kendra in the honest NOT_CALCULATED set |

**Existence/strength separation** (the §15 core requirement) is now a typed field on every
evaluation: `strength: { status: 'SCHOLAR_JUDGEMENT_REQUIRED' | 'NOT_APPLICABLE', note }` —
PRESENT yogas always demand a scholar for strength; the engine never quantifies it. The
existing per-rule limitation blocks ("CANCELLATION / QUALIFICATION POLICY: none applied")
keep dignity/combustion/retrogression as strength-only concepts.

## 2. Kalsarpa adopted (charter §16)

Sprint H registered the variant axes (RULE_KALSARPA_VARIANTS, NOT_ADOPTED); Sprint I adopts
**ONE_HEMISPHERE_NODE_AXIS** (`doshaEngine.ts::evaluateKalsarpa`, registry
RULE_KALSARPA_HEMISPHERE):

- **PRESENT**: all seven visible grahas (Sun..Saturn; nodes are the boundary, not occupants)
  within one closed half of the zodiac bounded by the Rahu–Ketu axis. The arc direction
  (RAHU_TO_KETU / KETU_TO_RAHU) is recorded; the direction-qualified reading is a declared
  alternative, not adopted.
- **INDETERMINATE**: any graha sharing a rashi with Rahu or Ketu (boundary placement is
  contested — never guessed), or unresolved inputs.
- **ABSENT**: grahas straddling both hemispheres, with the straddler lists as evidence.
- **NOT_CALCULATED**: structurally inconsistent node axis (Ketu not opposite Rahu) — fail closed.
- The twelve Anant/Vasuki names stay **NOT_CALCULATED** (no naming rule adopted). Four
  declared alternatives travel on every result.

Consumers rewired: `types.ts` KalsarpaResult widened; `canonicalModel` passes the computed
result through; `consistencyGate` CG_DOSHA_KALSARPA pin evolved (a computed verdict MUST
declare variant + basis + evidence + NOT_CALCULATED naming; silence forbidden in both
directions); `reportModelV2` renders PRESENT/ABSENT/INDETERMINATE with evidence lines and
the declared-alternatives note; `derivedModel` capability line now CALCULATED.

## 3. Qualification — `YOGA_CATALOG_001`

Runner: `qualification/yoga-qualification-runner.ts` (`yoga-qualification-runner-1.0.0 (sprint I)`, seed `0x9091`). Run: `npm run qualify:yoga` (2k strict, ~2 s). **Verdict PASS — 0 violations.**

| Stream | Checks / violations | What it proves |
|--------|---------------------|----------------|
| A Catalog integrity | 273 / 0 | 44 rules ↔ registry entries ↔ cross-links; NOT_ADOPTED set closed; fingerprint pins |
| B Predicate identity | 170,000 / 0 | an INDEPENDENT reimplementation of all 41 implemented predicates (written from the registry text, charter §21) agrees with `evaluateYogas` on 2,000 real natal charts |
| C Kalsarpa geometry | 702 / 0 | 222 constructed node geometries (both arcs, splits, boundaries, degenerate axes) vs an independent implementation; snapshot identity |
| D Existence/strength | 35,200 / 0 | exact strength shape on 8,800 evaluations — PRESENT ⇒ SCHOLAR_JUDGEMENT_REQUIRED, no fabricated scores |
| Determinism | 60 / 0 | byte-identical replay |

**Bugs the independent implementations caught during construction** (the reason §21 exists):
the ADHI rule registered houses 7/8/9 instead of 6/7/8 from the Moon (an anchor-relative
off-by-one — fixed, regression-pinned in the gate spec), and the runner's own first Neecha
Bhanga draft indexed the lord of bhava `deb` instead of sign `deb` (equal only at an Aries
lagna) — corrected against the engine before qualification.

Declared findings (NON_BLOCKING): `DECLARED_EXISTENCE_ONLY_ENGINE`,
`DECLARED_NO_LICENSED_EDITIONS`, `DECLARED_KALSARPA_NAMING_OPEN`,
`DECLARED_MANGALIK_VARIANTS_DECLARED`.

## 4. Roadmap toward ~100 (charter §15 "carefully toward")

Curated families deliberately deferred to later sprints rather than bulk-added: the full
27-Nabhasa set (obscure members), Dala/Acala sub-families, Mahabhagya (requires gender as a
chart input — an honest input gap), Kalpadruma (contested chain), Jaimini yogada family.
Each needs a source-registry entry and an adopted interpretation first; the registry is the
gatekeeper.

## 5. Artifacts & tests

- `src/lib/jyotish/yogaEngine.ts` (33 new rules + strength field), `yogaSourceRegistry.ts` (v2),
  `doshaEngine.ts` (new), `ruleRegistry.ts` (RULE_KALSARPA_HEMISPHERE + refreshed variant register; 59 rules total).
- `canonicalSnapshot.ts` (computed kalsarpa), `src/lib/kundli/{types,canonicalModel,consistencyGate}.ts`,
  `src/lib/kundli/v40/{derivedModel,reportModelV2}.ts`.
- `qualification/yoga-qualification-runner.ts` + `fixtures/yoga-fixtures.json` +
  `tools/build-yoga-fixtures.ts`; artifacts `yoga-summary.json` / `yoga-failures.json`.
- `tests/yoga-qualification.spec.ts` — 16 passed / 0 failed. Sprint H gate artifacts
  regenerated for the 59-rule registry (rule-registry spec pins updated accordingly).
- npm scripts: `qualify:yoga` (2k strict), `qualify:yoga:scaffold` (400).
