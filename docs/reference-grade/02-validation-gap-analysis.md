# 02 — Validation Gap Analysis: Moving from Internally Verified to Reference-Grade

**Date**: September 3, 2026  
**Auditor**: Principal Astronomical Software Engineer & Computational Jyotisha Architect  
**Benchmark Target**: CosmicTantra Reference-Grade Release Standard (Section 38)

---

## 1. Executive Summary

CosmicTantra currently operates at an **`INTERNALLY_VERIFIED`** tier across all core calculation pipelines:
- Zero TypeScript compilation errors.
- 79/79 automated Playwright & unit integration tests passing.
- Deterministic data models with strict validation release gates (Gates 1a, 1b, 1c, 2, 3).
- Clean separation between mathematical calculation and presentation layers.

To achieve **`REFERENCE-GRADE`** certification, specific structural gaps must be closed systematically across Sprints B through N.

---

## 2. Invariant Compliance Audit (CT_INV_001 to CT_INV_010)

| Invariant | Description | Current Compliance | Identified Gap / Remediation Path |
|---|---|---|---|
| **CT_INV_001** | *Calculation before Interpretation* | **100% COMPLIANT** | All planetary coordinates, cusps, dashas, and yogas are computed mathematically prior to text generation or LLM handoff. |
| **CT_INV_002** | *Evidence before Claim* | **PARTIALLY COMPLIANT** | V40 pipeline exposes machine-readable evidence for career synthesis and life gauges. Needs formalization into a universal `EvidenceGraph` API node for all 100+ yogas. |
| **CT_INV_003** | *No Silent Tradition Mixing* | **90% COMPLIANT** | Parashari is default. Jaimini (Chara Karaka) and KP exist in separate modules (`src/lib/jyotish/jaiminiEngine.ts`, `kpEngine.ts`). Must ensure UI never combines them without explicit declaration. |
| **CT_INV_004** | *Declared Conventions* | **85% COMPLIANT** | Ayanamsha (Lahiri), node model (Mean), and house model (Equal/Whole) are declared in `canonicalModel.ts`. Need explicit metadata exposure in every PDF and API payload. |
| **CT_INV_005** | *Validation Status* | **75% COMPLIANT** | Current codebase distinguishes release gates (PASS/FAIL). Must assign formal enums (`IMPLEMENTED`, `INTERNALLY_VERIFIED`, `EXTERNALLY_VERIFIED`, `SCHOLAR_VERIFIED`) to every sub-module. |
| **CT_INV_006** | *Fail Closed* | **100% COMPLIANT** | If required fields or geographic coordinates are invalid or incoherent, pipeline throws typed error (`KUNDLI_INPUT_INVALID`, `KUNDLI_LOCATION_COHERENCE_FAILED`) and issues zero document. |
| **CT_INV_007** | *Deterministic Core* | **100% COMPLIANT** | Identical birth inputs produce bit-for-bit identical outputs across runs. |
| **CT_INV_008** | *Version Everything* | **80% COMPLIANT** | Version strings exist (`kundli-report-v2`, `kundli-pdf-renderer-v3`). Need centralized semantic versioning for rule definitions and ephemeris providers. |
| **CT_INV_009** | *Interpretation ≠ Fact* | **90% COMPLIANT** | Calculated facts (degrees, signs, nakshatra) are strictly distinguished from interpretive text passages in `reportModelV2.ts`. |
| **CT_INV_010** | *No Fake Probability* | **100% COMPLIANT** | No percentage predictions or speculative odds exist. Consensus numbers indicate traditional agreement (e.g., "3 of 4 traditions"), never likelihood of fate. |

---

## 3. Subsystem Gap Analysis

### A. Astronomical Engine & Ephemeris (Target: Sprint C)
- **Current State**: Uses mathematical formulations for planetary positions and Lahiri ayanamsha with internal golden chart checks.
- **Gap**: Has not yet been verified against a batch of 100,000 automated scenarios covering extreme latitudes, historical DST edge cases, and 1900–2100 year boundaries.
- **Action Plan**:
  1. Build `AstronomyProvider` interface (`SwissEphemerisProvider`, `JplReferenceProvider`, `FixtureProvider`).
  2. Implement `qualification/astronomy-qualification-runner.ts` to execute 100,000 automated runs with explicit tolerances (Sun/Moon: $\pm 0.01^\circ$, planets: $\pm 0.02^\circ$, nodes: $\pm 0.05^\circ$).

### B. Divisional Charts / Vargas (Target: Sprint D)
- **Current State**: D1, D9, and D10 are thoroughly validated with tests. D2 through D60 exist in `src/lib/jyotish/vargaEngine.ts` but lack independent reference fixtures.
- **Gap**: Higher divisional charts (e.g. D16, D20, D24, D27, D30, D60) must have independent reference implementations to prevent circular regression.
- **Action Plan**: Create `tests/kundli/independent-varga-runner.spec.ts` comparing production varga mapping against mathematical first principles.

### C. Vimshottari Dasha Engine (Target: Sprint E)
- **Current State**: Mahadasha, Antardasha, and Pratyantardasha calculate accurately using linear Moon nakshatra balance.
- **Gap**: Need formal option to toggle between 365.2422-day solar year vs 360-day Savana year, with timestamp verification at exact transitions.

### D. Gochara (Transit) & Sade Sati (Target: Sprint G)
- **Current State**: Natal planetary checks calculate transit houses. Sade Sati is marked by Moon sign vs current Saturn sign.
- **Gap**: Sade Sati should calculate exact historical and future ingress/egress timestamps (Rising, Peak, Setting phases) from live ephemeris transits.

### E. Classical Rule Registry (Target: Sprint H & I)
- **Current State**: ~30 high-value Yogas are codified in `src/lib/jyotish/yogaEngine.ts` with classical citations.
- **Gap**: Needs expansion to 100 curated high-value rules with structured metadata:
  - Sanskrit Name, English Name, Category, Tradition.
  - Classical source citation (e.g. *BPHS Ch. 35, Sloka 12*).
  - Source verification status (`SOURCE_VERIFIED`, `SOURCE_SECONDARY`, etc.).

---

## 4. Roadmap to Full Qualification

```
Sprint A (NOW): Forensic Inventory, Capability Matrix, Convention Registry, Risk Register [COMPLETE]
      ↓
Sprint B: Qualification Framework, Unified Convention Center, AstronomyProvider Interface
      ↓
Sprint C: Mass Astronomical Qualification Harness (100,000 Scenarios vs JPL/Swiss)
      ↓
Sprint D: D1, D9, D10, and Shodashavarga Certified Mapping Framework
      ↓
Sprint E: Vimshottari Boundary Timing & Panchanga Transition Certification
      ↓
Sprint F: Shadbala, Bhava Bala & Ashtakavarga External Audit
      ↓
Sprint G: Ephemeris-Driven Gochara & Exact Timestamp Sade Sati
      ↓
Sprint H: 100-Rule Classical Source Registry with Verified Citations
      ↓
Sprint I: Structured Yoga & Dosha Engine with Tradition Consensus Representation
      ↓
Sprint J: CosmicTantra Evidence Graph & Inspectable "WHY?" Traversal
      ↓
Sprint K: Scholar Review Console with Pandit Feedback Capture
      ↓
Sprint L: 100-Chart Golden Corpus & Adversarial Hostile Edge Testing
      ↓
Sprint M: Scholar Report 2.0 with Visual Qualification Badges
      ↓
Sprint N: Public Verification & Trust Dashboard (/how-cosmictantra-calculates)
```
