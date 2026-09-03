# 06 — Sprint D: D1/D9/D10 + Varga Qualification

**Status**: COMPLETE (this workspace)
**Runner**: `varga-qualification-runner-1.0.0 (sprint D)` — `npm run qualify:varga`
**Certification**: `docs/reference-grade/varga-certification.md` (GENERATED — never hand-edit numbers)
**Fixture set**: `qualification/fixtures/varga-boundary-fixtures.json` — `VARGA_BOUNDARY_BPHS_001`
(3420 scheme rows + 6488 boundary probes + 28 classical anchors,
sha256 `c1f7de6130876eececcdd32fb8f901223f2bef2f01f844ca544b63c934016aba`, source `SOURCE_SECONDARY`)

---

## 1. What Sprint D set out to do (Mission §7)

For every varga D1–D60 the charter demands: rule definition, mapping implementation,
boundary fixtures, independent test implementation, reference comparison, validation
status — and that no unvalidated varga may influence authoritative interpretation.

## 2. What existed before Sprint D (discovered, not assumed)

- `src/lib/jyotish/vargaEngine.ts` — all sixteen Parashari schemes already implemented,
  with an epsilon boundary guard (a part boundary belongs to the NEXT part).
- `src/lib/kundli/v40/d10Validation.ts` — an independent D10 re-implementation plus the
  D10 promotion gate, deliberately CLOSED (`INTERNAL_CROSSCHECK_ONLY`): it opens only when
  the golden validation register records a D10 case that AGREES with a named outside
  reference. Two implementations of the same misreading agree perfectly, so internal
  agreement must never open this gate. Sprint D preserves this honesty property.
- Spot boundary checks in `tests/professional-kernel-release-1.spec.ts` (~12 values).
- A second navamsha implementation, `canonicalSnapshot.calculateNavamshaRashi`,
  feeding legacy consumers — a parity liability if it ever drifted.

## 3. Defect found and fixed: the declaration contradicted the engine (CT_INV_004)

`VARGA_CONVENTION` declared the D9 rule as *"from Mesha (chara), Simha (sthira),
Dhanu (dwisvabhava)"* — that is the **mobility-based pattern of D16/D45**, not the D9
rule the engine implements. The implementation (movable signs count from themselves,
fixed from the 9th, dual from the 5th — equivalently element starts
Fire→Mesha, Earth→Makara, Air→Tula, Water→Karka) was verified **correct** against the
classical scheme tables. The declaration was corrected; **no calculation changed** —
only the declaration text, with the correction recorded in the declaration's own notes.

## 4. Qualification design

1. **Reference tables as data** (`qualification/tools/build-varga-fixtures.cjs`):
   the sixteen classical schemes frozen as literal 12×N tables, independent of the
   engine's switch statement. Tamper-evident (sha256 checked on every load; the gate
   spec deliberately corrupts a row and requires the load to fail).
2. **Boundary probes**: ±1e-6° around every interior part boundary of every division
   (6488 probes) plus the zodiac wrap — deterministic, exact expectations.
3. **Scenario sweep**: seeded, fingerprinted, boundary-enriched scenario stream; every
   scenario is run across ALL sixteen divisions.
4. **Independent property checks**:
   - range containment (index ∈ [0,12), divisionDegree ∈ [0,30));
   - the pure harmonic D9 identity `floor(lon/(10/3)) mod 12` — a derivation with no
     shared code with the engine;
   - dual-implementation parity: `vargaEngine` vs `canonicalSnapshot.calculateNavamshaRashi`;
   - D60 shashtiamsha structure (deity index = floor(degInSign·2) over a 60-name register);
   - vargottama identity: flag ⇔ D1 sign = D9 sign;
   - golden-chart parity: D1 = natal rashi and both D9 implementations agree for all
     eight entities of the canonical golden chart.
5. **Determinism (CT_INV_007)**: every 100th scenario recomputed with the Sprint B
   FP-equivalence floor (never raw byte equality over float64).
6. **RSK_004 sensitivity, measured**: real provider snapshots 60 s apart give the
   ascendant/Moon rates; the runner reports the measured seconds until the next D60
   boundary. Sprint D measurement for the golden chart: **asc ≈ 107 s, Moon ≈ 778 s**.

## 5. Full-scale result (100,000 scenarios — `npm run qualify:varga`)

| Check | n | mismatches |
|---|---|---|
| Scenario × division reference comparison | 1,600,000 | 0 |
| Boundary probes (±1e-6°) | 6,488 | 0 |
| Classical anchors | 28 | 0 |
| Independent property checks | 3,606,546 | 0 violations |
| Determinism samples | 1,000 | 0 hard mismatches |

Verdict **PASS** on both `scaffold` and `strict` gates.

## 6. Validation status after Sprint D (CT_INV_005 tiers)

| Capability | Tier | Basis |
|---|---|---|
| D1–D60 mapping rules (all 16) | **INTERNALLY_VERIFIED** | Frozen classical tables + boundary probes + independent identities; no external chart reference yet |
| D9 | INTERNALLY_VERIFIED (strongest) | + harmonic identity + dual-implementation parity |
| D10 interpretation influence | **VALIDATION_PENDING** | External promotion gate deliberately closed (`INTERNAL_CROSSCHECK_ONLY`) |
| D60 as interpretation input | VALIDATION_PENDING (RSK_004) | Excluded from the authoritative tier; birth-time confidence required |

The next tier up (EXTERNALLY_VERIFIED) requires a named outside reference for a varga
placement — exactly the evidence the D10 gate already demands. Sprint D does not
fabricate one.

## 7. Assumptions recorded

- The classical schemes in `build-varga-fixtures.cjs` are the Parashari rules as
  received through standard translations (SOURCE_SECONDARY). No verse-level locator is
  claimed anywhere (mission prohibition on invented citations).
- Boundary semantics (boundary → NEXT part, ε = 1e-9) are the engine's documented
  behavior and match the tables' half-open interval convention.
- The D60 sensitivity measurement is instantaneous (one chart, one instant). It bounds
  the risk; it does not map all latitudes/dates.

## 8. Unresolved problems

- D10 (and every varga) remains below EXTERNALLY_VERIFIED until a named external
  reference supplies checkable varga placements. The D10 gate is the single,
  evidence-gated place where that upgrade happens.
- RSK_004 remains a *product* risk: even a certified D60 is unresolvable without
  birth-time confidence. The safeguard is exclusion from authoritative tiers, which
  stays enforced by `scholarSummary.ts` and the gate spec.
- `calculateNavamshaRashi` and `vargaEngine` remain two implementations of D9. They are
  now parity-checked by the qualification run; consolidating them is future work and
  must not be done silently.
