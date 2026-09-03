# 04 — Risk Register: Computational Jyotisha Integrity & Failure Modes

**Date**: September 3, 2026  
**Status**: Active Risk Management Standard  
**Governing Rule**: `CT_INV_006 (FAIL CLOSED)` & `CT_INV_010 (NO FAKE PROBABILITY)`

---

## 1. Risk Matrix Overview

| Risk ID | Risk Category | Severity | Likelihood | Mitigation Status | Description & Safeguard |
|---|---|---|---|---|---|
| **RSK_001** | Synthetic UX Gauges | **HIGH** | Medium | **MITIGATED (Phase 1)** | Unvalidated Bhava Bala / Shadbala feeding synthetic scores. *Safeguard*: Executive Life Gauges are explicitly declared as heuristic orientations derived from Graha Bala, never authoritative predictions. |
| **RSK_002** | Combustion Orbs Discrepancy | **MEDIUM** | High | **OPEN (Sprint H)** | Different classical texts cite varying combustion orbs (e.g. Mercury: 14° vs 12° if retrograde). *Safeguard*: Display adopted classical threshold explicitly and flag borderline cases within $\pm 1^\circ$ as requiring scholar judgment. |
| **RSK_003** | Polar & High-Latitude Lagna | **HIGH** | Low | **MITIGATED** | At latitudes $>66^\circ$, the ecliptic can fail to intersect the eastern horizon twice a day. *Safeguard*: Gate 1b restricts latitude to $-65^\circ \le \text{lat} \le +65^\circ$. Coordinates beyond this range fail closed with `KUNDLI_LATITUDE_OUT_OF_BOUNDS`. |
| **RSK_004** | Higher Varga Boundary Flips | **HIGH** | High | **IN PROGRESS (Sprint D)** | D60 (Shashtiamsha) changes sign every 30 seconds of clock time. *Safeguard*: Never base definitive automated life readings solely on D60; require explicit birth-time confidence qualification. |
| **RSK_005** | LLM Hallucination of Jyotisha Facts | **CRITICAL** | Low | **MITIGATED (Kashi V3)** | LLMs inventing planetary degrees, Dashas, or fake shlokas. *Safeguard*: Hard firewall (CT_INV_001). LLMs receive only pre-calculated facts; conversational layer uses deterministic state machine (`conversationCore.ts`). |
| **RSK_006** | Midnight & DST Boundary Errors | **MEDIUM** | Medium | **MITIGATED** | Midnight births (00:00:00) flipping date backwards; historical daylight saving confusion. *Safeguard*: Explicit ISO-8601 UTC timestamp parsing with numerical timezone offset (`utcOffsetHours`). |
| **RSK_007** | Geographic Coherence Drift | **MEDIUM** | Medium | **RESOLVED (f0ddab7)** | City name entered with mismatched coordinates from prior form state. *Safeguard*: Gate 1c Euclidean distance gate ($\le 1.5^\circ$) + automatic city coordinate resolution in `/api/kundli/pdf`. |
| **RSK_008** | Fear-Inducing Dosha Labels | **HIGH** | Low | **MITIGATED** | Labeling Manglik or Sade Sati in sensational or frightening terms. *Safeguard*: Humane, neutral, classical language. Full display of classical cancellation conditions (*Parihara*). |
| **RSK_009** | Ayanamsha Epoch Divergence (Declaration vs Implementation) | **HIGH** | **CONFIRMED** | **OPEN (Sprint C)** | The engine constant at J2000.0 is 23°51′25.5″ (23.857092°) while the declared registry standard is 23°51′11″ — a **+14.53″** divergence (finding `AYANAMSHA_EPOCH_DECLARED_VS_IMPLEMENTED`, surfaced by the Sprint B qualification harness). *Safeguard*: surfaced as a blocking finding in every qualification run; never silently patched, because reconciling shifts all charts and requires scholar-reviewed, versioned change. |
| **RSK_010** | Midheaven (MC) Not Computed | **MEDIUM** | **CONFIRMED** | **OPEN (Sprint C/M)** | The wrapped engine declares MC as `NOT_CALCULATED` (CT_INV_006). Mission §5 requires MC coverage for astronomy certification. *Safeguard*: declared gap, never fabricated; pinned as blocking finding `MC_NOT_CALCULATED`. |
| **RSK_011** | Far-Future Reference Time-Scale Divergence | **MEDIUM** | **CONFIRMED** (bounded) | **ACCEPTED WITH EXPLANATION (re-measure in Sprint C)** | Beyond ~2050, ΔT extrapolation models diverge (Espenak–Meeus vs JPL frozen leap-second UTC); the Moon moves ≈0.55″/s so lunar divergence grows (measured: 78.41″ at the 2100 epoch vs 36″ base tolerance). *Safeguard*: documented `DELTAT_EXTRAPOLATION_BEYOND_2050` band records every such divergence with full precision — never silently passed, never hidden by rounding. |
| **RSK_012** | Byte-Level Determinism illusion | **LOW** | **CONFIRMED** | **MITIGATED (Sprint B)** | Raw float64 serialization of the astronomy layer is not byte-stable across V8 JIT tier transitions (measured max 1.091e-11° ≈ 0.04 µas on the 100k run) — disproving the earlier "bit-for-bit identical" claim at the double level. *Safeguard*: CT_INV_007 is now enforced by `compareReadingsForDeterminism` at a 1e-9° FP-equivalence floor with exact structural/string identity; violations fail the qualification run closed. |

---

## 2. Invariant Violation Response Protocol

If any calculation or report generation component encounters an invariant violation:

1. **Immediate Fail-Closed**:
   Do NOT guess or substitute default values. Return structured failure:
   ```json
   {
     "ok": false,
     "status": "SCHOLAR_JUDGEMENT_REQUIRED",
     "errorCode": "KUNDLI_VERIFICATION_PENDING",
     "message": "This specific planetary combination requires scholar review."
   }
   ```
2. **Audit Logging**:
   Record the exact input fingerprint, engine version, and failing invariant for engineering review.
3. **User Guidance**:
   Direct the visitor to the canonical Vedic scholar desk (+91 9972934937) via the Scholar Handover protocol.
