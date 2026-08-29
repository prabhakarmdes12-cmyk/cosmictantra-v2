# AstroSage / Competitor Report Coverage Matrix

_TRUST-01 · PROGRAM 1 · generated as part of the Trust-First Product Completion Program_

This matrix maps the sections of a full commercial Vedic report (as popularised by
AstroSage's "Brihat Kundli" and similar products) to CosmicTantra's engine
capabilities. It exists so we can honestly see what we can compute, what we can
compute but must qualify externally, and what we do not yet cover.

## Legend

- **COMPUTED** — CosmicTantra computes this deterministically today (engine exists).
- **COMPUTED · UNQUALIFIED** — computed, but not yet compared against an external reference.
- **PARTIAL** — partially computed; some sub-fields missing.
- **MISSING** — not yet implemented.
- **INTERPRETIVE** — narrative/interpretation section (must flow evidence → rules → synthesis; no generic filler).

> HONESTY: No row is marked "qualified / parity" anywhere. External qualification
> is tracked only in the Jyotish Qualification Lab, and requires genuine external
> reference values. See `src/lib/pro/qualificationLab.js` and `goldenCorpus.js`.

## A. Birth details & foundations

| Report section | CosmicTantra capability | Status |
|---|---|---|
| Birth details, coordinates, timezone, offset | snapshot v2 `normalizedBirthContext` | COMPUTED |
| Ayanamsha value & convention | `conventions.ayanamshaFor` (Lahiri/Raman/KP) | COMPUTED |
| Panchang at birth (tithi, vara, nakshatra, yoga, karana) | `panchangPro.computePanchangPro` | COMPUTED · UNQUALIFIED |
| Avakhada chakra (varna, vashya, yoni, gana, nadi …) | `matching` + nakshatra attributes | PARTIAL |
| Ghatak (harmful) chakra | — | MISSING |

## B. Charts (Vargas)

| Report section | CosmicTantra capability | Status |
|---|---|---|
| Lagna (D1) chart | `snapshot` canonical | COMPUTED |
| Chandra / Surya Kundli | derivations of D1 | COMPUTED |
| Navamsa (D9), Dashamsha (D10) | `vargas.computeVarga` | COMPUTED · UNQUALIFIED |
| Full Shodasavarga (D2..D60) | `vargas.computeAllVargas` | COMPUTED · UNQUALIFIED |
| Vargottama detection | `vargas.vargottamaPlanets` | COMPUTED |
| KP chart & sublords | `kp.computeKPChart` | COMPUTED · UNQUALIFIED |

## C. Planets, houses, strengths

| Report section | CosmicTantra capability | Status |
|---|---|---|
| Planetary positions, dignity, retrograde | snapshot planets | COMPUTED |
| Bhava (house) table & lords | snapshot houses | COMPUTED |
| Shadbala / Bhava Bala | `bala.computeShadbala/computeBhavaBala` | COMPUTED · UNQUALIFIED |
| Vimshopaka Bala | `bala.computeVimshopaka` | COMPUTED · UNQUALIFIED |
| Ishta / Kashta phala | `bala.computeIshtaKashta` | COMPUTED · UNQUALIFIED |
| Ashtakavarga (BAV/SAV, prastara) | `ashtakavarga.computeAshtakavarga` | COMPUTED · UNQUALIFIED |
| Avasthas (5 states) | `avastha.computeAvasthas` | COMPUTED · UNQUALIFIED |

## D. Dashas & timing

| Report section | CosmicTantra capability | Status |
|---|---|---|
| Vimshottari (Maha/Antar/Pratyantar) | `dasha/nakshatraDashas` | COMPUTED · UNQUALIFIED |
| Other dashas (Yogini, Ashtottari, …) | `dasha/index` (8 systems) | COMPUTED · UNQUALIFIED |
| Char (Jaimini) dasha | `jaimini` | PARTIAL |
| Current dasha highlighting | timeline (TRUST-06) | COMPUTED |

## E. Yogas, doshas, remedies

| Report section | CosmicTantra capability | Status |
|---|---|---|
| Raj / Dhana / Pancha-mahapurusha yogas | `yogaRegistry.evaluateYogas` | COMPUTED · UNQUALIFIED |
| Mangal / Kuja dosha | `yogaRegistry` | COMPUTED · UNQUALIFIED |
| Sade Sati | gochar/timeline (TRUST-06) | COMPUTED |
| Kaal Sarp, Pitra dosha | `yogaRegistry` | PARTIAL |
| Remedies (gemstone, mantra) | INTERPRETIVE — evidence→rules→synthesis required | MISSING (guardrailed) |

## F. Predictions & interpretation (INTERPRETIVE)

| Report section | Approach | Status |
|---|---|---|
| Personality / general reading | evidence graph → rules → synthesis (TRUST-05) | INTERPRETIVE — no generic sign→paragraph filler |
| Yearly (Varshaphala / Tajika) | `varshaphala` + interpretation | PARTIAL |
| Dasha-phala predictions | evidence graph over dasha + transit | INTERPRETIVE |
| Compatibility (Ashtakoota / Guna Milan) | `matching.ashtakoota` (36 guna) | COMPUTED · UNQUALIFIED |

## Summary

- **Deterministic engine coverage is broad** across foundations, vargas, strengths, ashtakavarga, dashas, yogas, matching and panchang.
- **Every computed section is currently UNQUALIFIED** against external references — the Qualification Lab is the gate to change that, and it needs owner/Pandit-supplied reference values.
- **Interpretive sections are intentionally guardrailed**: they must be produced by the evidence graph (TRUST-05), never generic AI prose, and remedies are withheld until an evidence-backed ruleset exists.
- **Known MISSING**: Ghatak chakra, full Avakhada chakra, gemstone/mantra remedies (guardrailed), full Kaal Sarp / Pitra dosha, Char dasha completion.

_This matrix is a living document; update it as capabilities move from COMPUTED · UNQUALIFIED to externally qualified in the Jyotish Qualification Lab._
