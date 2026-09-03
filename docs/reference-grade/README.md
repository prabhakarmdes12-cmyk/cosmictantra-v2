# CosmicTantra Reference-Grade Jyotisha Engine

> **"Trustworthy Computational Jyotisha"**  
> *Astronomy must be computed. Jyotisha must be explicit. Tradition must be attributed. Disagreement must be preserved. AI must explain, not invent. Pandits must be empowered, not replaced. Every important claim must answer: "WHY?"*

---

## 📚 Document Index

| Document | Purpose |
|---|---|
| [**`MISSION_REFERENCE_GRADE_JYOTISHA_ENGINE.md`**](./MISSION_REFERENCE_GRADE_JYOTISHA_ENGINE.md) | **Master Charter & 43-Section Engineering Ambition** — The permanent north star, product invariants (CT_INV_001 to CT_INV_010), qualification standards, and sprint roadmap. |
| [**`00-existing-system-inventory.md`**](./00-existing-system-inventory.md) | **Sprint A Forensic Inventory** — Complete audit of existing calculation files in `src/lib/`, test suites, and data models. |
| [**`01-capability-matrix.md`**](./01-capability-matrix.md) | **Capability & Subsystem Matrix** — Subsystem-by-subsystem tracking of inputs, outputs, conventions, test coverage, and validation tier. |
| [**`02-validation-gap-analysis.md`**](./02-validation-gap-analysis.md) | **Validation Gap Analysis** — Concrete step-by-step roadmap detailing the progression from `INTERNALLY_VERIFIED` to `REFERENCE-GRADE`. |
| [**`03-convention-registry.md`**](./03-convention-registry.md) | **Convention Registry** — Immutable declarations for Ayanamsha, Node model, House cusps, Ephemeris basis, Calendar, and Sunrise conventions. |
| [**`04-risk-register.md`**](./04-risk-register.md) | **Risk Register** — Identified failure modes, combustion thresholds, polar coordinate safeguards, and fail-closed protocols. |
| [**`../design/UI_UX_DESIGN_DIRECTION_2027.md`**](../design/UI_UX_DESIGN_DIRECTION_2027.md) | **UI/UX Design Direction 2027** — Product, trust, and conversion hierarchies: 5 primary destinations, 3 information-density modes, narrative-first Kundli, and contextual Kashi Sahayak. |

---

## 🚀 Guide for Online Agents: Picking Up Sprint B

### Current Engineering State
- **Branch**: `main` (synchronized across all local workspaces and GitHub remote).
- **TypeScript**: `npx tsc --noEmit` exits with **0 errors**.
- **Automated Tests**: **79/79 Playwright & unit integration tests pass (100%)**.
- **Current Milestone**: **Sprint A (Forensic Discovery & System Inventory) is COMPLETE**.

### Scope for Sprint B (Next Actionable Sprint)
Sprint B establishes the **Qualification Framework and Universal Convention Center**:
1. **AstronomyProvider Interface**:
   Create a clean, pluggable abstraction in `src/lib/astronomy/astronomyProvider.ts` with:
   - `SwissEphemerisProvider` (Production reference).
   - `FixtureProvider` (Golden benchmarks).
2. **Universal Convention Center**:
   Strengthen `src/lib/jyotish/conventionCenter.ts` to attach explicit convention metadata to every chart snapshot.
3. **Qualification Runner Harness Skeleton**:
   Scaffold `qualification/astronomy-qualification-runner.ts` to prepare for the 100,000-scenario qualification in Sprint C.

**Rules of Engagement**:
- **Preserve working systems**: Do not replace working code; wrap and extend it.
- **Fail closed**: If any gate fails, abort cleanly with typed errors.
- **Always verify**: Run `npx tsc --noEmit` and `npx playwright test` before and after every change.
