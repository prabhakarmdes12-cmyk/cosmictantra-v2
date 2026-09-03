# Sprint H — Classical Rule Registry + Source Provenance

**Status**: COMPLETE · **Gate**: PASS (strict, 20,000 scenarios, 0 violations) · **Registry**: `classical-rule-registry-1.0.0 (sprint H)` · **Fixture**: `COMBUSTION_RULE_REGISTRY_001` (sha `94a5213a…cf818348`, content-addressed)

Charter §14: the Classical Rule Registry is "one of CosmicTantra's core assets" — structured
rule objects with the full provenance field set, the four allowed source statuses, and the
explicit instruction that **no orb is universally accepted** and **no source locator may be
invented**. Flagship risk closed: **RSK_002 (combustion orbs discrepancy)**.

---

## 1. The registry (`src/lib/jyotish/ruleRegistry.ts`)

- Charter §14 rule shape: `id, sanskritName, englishName, category, tradition, source,
  sourceLocator, sourceVerification, originalText, translation, adoptedInterpretation,
  alternateInterpretations[], prerequisites[], evaluator, evidencePaths[], validationStatus,
  scholarReviews[], version` (+ `adoption`).
- **Four allowed source statuses only**: `SOURCE_VERIFIED | SOURCE_SECONDARY |
  ATTRIBUTION_UNVERIFIED | SOURCE_PENDING`. Anything else fails registration.
- **Repo honesty constant** `REPO_HOLDS_LICENSED_EDITIONS = false`: no licensed Jyotish text
  is held, therefore (a) `SOURCE_VERIFIED` registration **fails closed**, (b) every locator
  carries the `NOT VERIFIED` statement, (c) `originalText`/`translation` are never
  reconstructed verses — they carry explicit `NOT RECORDED` statements. The only
  authoritative field is `adoptedInterpretation` (exactly what the code does).
- **Validation tiers** (CT_INV_005) + honest zero: `NOT_IMPLEMENTED < IMPLEMENTED <
  INTERNALLY_VERIFIED < EXTERNALLY_VERIFIED < SCHOLAR_VERIFIED`. EXTERNALLY_VERIFIED
  registration requires recorded qualification evidence (`qualification/` or
  `docs/reference-grade/` paths) — an unevidenced external claim throws.
- **Fail-closed registration** (`RuleRegistryError`): invalid ids, duplicate ids, thin
  adopted interpretations, evaluator pointers without `path::symbol`, NOT_ADOPTED rules
  claiming a computed status — all rejected.
- **Deterministic fingerprint** (CT_INV_007/008): sha256 over key-sorted rule content; the
  snapshot meta stamp and the fixture pin both carry it.

### Registered rules (24: 13 core + 11 yoga cross-links)

| Rule | Source status | Validation tier |
|------|---------------|-----------------|
| RULE_COMBUSTION_ORBS (Asta) | SOURCE_SECONDARY | INTERNALLY_VERIFIED |
| RULE_GRAHA_YUDDHA_1DEG | SOURCE_SECONDARY | IMPLEMENTED |
| RULE_TATKALIKA_MAITRI | SOURCE_SECONDARY | IMPLEMENTED |
| RULE_PANCHADHA_MAITRI | SOURCE_SECONDARY | IMPLEMENTED |
| RULE_NAISARGIKA_MAITRI | SOURCE_SECONDARY | IMPLEMENTED |
| RULE_SADE_SATI_BAND | SOURCE_SECONDARY | **EXTERNALLY_VERIFIED** (8 published anchors, Sprint G) |
| RULE_DHAIYA_4_8 | SOURCE_SECONDARY | INTERNALLY_VERIFIED |
| RULE_PARASHARI_SPECIAL_ASPECTS | SOURCE_SECONDARY | INTERNALLY_VERIFIED |
| RULE_MANGLIK_HOUSES | ATTRIBUTION_UNVERIFIED | IMPLEMENTED |
| RULE_KALSARPA_VARIANTS | ATTRIBUTION_UNVERIFIED | **NOT_IMPLEMENTED / NOT_ADOPTED** |
| RULE_VIMSHOTTARI_ORDER | SOURCE_SECONDARY | **EXTERNALLY_VERIFIED** (Sprint E) |
| RULE_EXALTATION_DEBILITATION_POINTS | SOURCE_SECONDARY | INTERNALLY_VERIFIED |
| RULE_MOOLATRIKONA_ZONES | SOURCE_SECONDARY | INTERNALLY_VERIFIED |
| 11 × YOGA_* (cross-linked from `yogaSourceRegistry` v1) | ATTRIBUTION_UNVERIFIED | IMPLEMENTED / NOT_IMPLEMENTED |

The yoga rules are **adapted, not duplicated**: `rulesFromYogaSourceRegistry()` flows each
existing yogaSourceRegistry entry (its honest unverified-locator fields, adopted
interpretation, variants, adoption state) into the unified registry. Kalsarpa stays closed:
its variant axes are now *registered* (charter §16 prerequisite), adoption is deferred to
Sprint I, and the engine continues to answer `NOT_CALCULATED`.

## 2. RSK_002 resolved — combustion with declared orbs and a borderline band

`relationshipEngine.ts` (wrapped, not rewritten):

- **`COMBUSTION_ORB_TABLE_V2`** — the adopted orbs (Moon 12°, Mars 17°, Mercury 14°/12°
  retrograde, Jupiter 11°, Venus 10°/8° retrograde, Saturn 15°) each carry `source`,
  `sourceStatus: SOURCE_SECONDARY`, the `NOT VERIFIED` locator, and **declared alternative
  orbs**: Mercury 14° in both states (the exact RSK_002 example), Venus 10° both, and the
  Moon-exemption variant. `COMBUSTION_ORBS` is now a derived view — zero behavior change for
  the v40 grahaCondition engine and canonicalSnapshot.
- **`checkCombustion` v2** (additive fields; verdicts identical): `applicable` (false for
  Sun/Rahu/Ketu, documenting the legacy 999 sentinel), `borderline` =
  `|separation − orb| ≤ 1°` (the RSK_002 safeguard band), `scholarJudgementRequired` ≡
  borderline, `registryRuleId: 'RULE_COMBUSTION_ORBS'`. A planet at orb−1° is COMBUST *and*
  borderline (the alternative orb would flip it); at orb+1° it is NEAR_COMBUST *and*
  borderline — the engine says which side of the adopted threshold it is on and that the
  threshold itself is contested.
- **v40 `grahaCondition.ts`**: `CombustionBlock` gains the same `borderline` /
  `scholarJudgementRequired` / `registryRuleId` fields.
- **`observatory/page.tsx`**: the duplicated page-local orbs (`< 14`, `< 10`) are gone — the
  page evaluates the shared rule and renders an `अस्त-सीमा (Borderline ±1°)` chip.
  Source-pinned so the duplication cannot return.
- **canonicalSnapshot.meta** now stamps `ruleRegistry { registryVersion, fingerprint,
  ruleCount, statusSummary, sourceStatusSummary }` beside the Sprint B convention manifest —
  every snapshot records WHICH rules governed it.

## 3. Qualification — `COMBUSTION_RULE_REGISTRY_001`

Runner: `qualification/rule-registry-qualification-runner.ts`
(`rule-registry-qualification-runner-1.0.0 (sprint H)`, seed `0x7d13`). Run:
`npm run qualify:registry` (20k strict, <1 s — the combustion rule is pure math).
Fixture builder: `tools/build-rule-registry-fixtures.ts` (key-sorted content hash).

**Verdict PASS — 0 violations.**

| Stream | Checks / violations | What it proves |
|--------|---------------------|----------------|
| A Registry integrity | 349 / 0 | schema of all 24 rules, status vocabulary, SOURCE_VERIFIED fail-closed, evidence-backed external claims, adoption/tier coherence, fingerprint ≡ fixture pin, Kalsarpa closed, fail-closed registration probes |
| B Combustion identity | 126,665 / 0 | independent separation recomputation, isCombust ⇔ sep ≤ orb, exact severity bands, borderline ⇔ \|sep−orb\| ≤ 1°, retrograde orb branches (Mercury 14/12, Venus 10/8), applicability, ±1° coverage on both sides |
| C Provenance surface | 31 / 0 | snapshot meta stamp ≡ live registry, combustion rows carry the registry pointer, snapshot values ≡ recomputation |
| Determinism | 250 / 0 | fingerprint byte-stability (50×) + combustion sweep replay |

Declared findings (NON_BLOCKING): `DECLARED_NO_LICENSED_EDITIONS`,
`DECLARED_BORDERLINE_NEEDS_SCHOLAR` (adjudication surface lands in Sprint K),
`DECLARED_OBSERVATORY_SKY_MODEL` (decorative approximate longitudes on that page),
`DECLARED_REGISTRY_V1_YOGA_LOCATORS`.

## 4. Validation tier (CT_INV_005)

Registry + combustion: **IMPLEMENTED → INTERNALLY_VERIFIED** (126k identity checks).
Sade Sati and Vimshottari rules carry **EXTERNALLY_VERIFIED** from their recorded sprint
evidence. Everything awaits the scholar ladder (SCHOLAR_VERIFIED, Sprint K).

## 5. Artifacts & tests

- `src/lib/jyotish/ruleRegistry.ts`, `relationshipEngine.ts` (v2 table + borderline),
  `canonicalSnapshot.ts` (meta stamp), `src/lib/kundli/v40/grahaCondition.ts`,
  `src/app/observatory/page.tsx` (converged).
- `qualification/rule-registry-qualification-runner.ts` + `fixtures/rule-registry-fixtures.json`
  + `tools/build-rule-registry-fixtures.ts`; artifacts `rule-registry-summary.json` /
  `rule-registry-failures.json`.
- `tests/rule-registry-qualification.spec.ts` — 16 passed / 0 failed.
- npm scripts: `qualify:registry` (20k strict), `qualify:registry:scaffold` (2k).

Risk register: **RSK_002 RESOLVED** (`04-risk-register.md`).
