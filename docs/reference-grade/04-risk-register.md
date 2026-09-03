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
| **RSK_004** | Higher Varga Boundary Flips | **HIGH** | High | **MITIGATED (Sprint D)** | D60 (Shashtiamsha) parts span only 0.5° of longitude — **measured on the Sprint D qualification run**: the ascendant crosses a D60 boundary every ≈107 s of clock time (Moon ≈778 s) for the golden chart; the earlier "30 seconds" estimate was of the right order but unmeasured. *Safeguard*: `varga-certification.md` records the measured sensitivity; `scholarSummary.ts` already excludes `VARGA_D60` from the authoritative tier; D60 must never ground a definitive automated life reading without explicit birth-time confidence qualification. Additionally, ALL varga schemes are now certified against the frozen classical tables (VARGA_BOUNDARY_BPHS_001, 0 mismatches) — the risk that remains is input-time resolution, not calculation. |
| **RSK_005** | LLM Hallucination of Jyotisha Facts | **CRITICAL** | Low | **MITIGATED (Kashi V3)** | LLMs inventing planetary degrees, Dashas, or fake shlokas. *Safeguard*: Hard firewall (CT_INV_001). LLMs receive only pre-calculated facts; conversational layer uses deterministic state machine (`conversationCore.ts`). |
| **RSK_006** | Midnight & DST Boundary Errors | **MEDIUM** | Medium | **MITIGATED** | Midnight births (00:00:00) flipping date backwards; historical daylight saving confusion. *Safeguard*: Explicit ISO-8601 UTC timestamp parsing with numerical timezone offset (`utcOffsetHours`). |
| **RSK_007** | Geographic Coherence Drift | **MEDIUM** | Medium | **RESOLVED (f0ddab7)** | City name entered with mismatched coordinates from prior form state. *Safeguard*: Gate 1c Euclidean distance gate ($\le 1.5^\circ$) + automatic city coordinate resolution in `/api/kundli/pdf`. |
| **RSK_008** | Fear-Inducing Dosha Labels | **HIGH** | Low | **MITIGATED** | Labeling Manglik or Sade Sati in sensational or frightening terms. *Safeguard*: Humane, neutral, classical language. Full display of classical cancellation conditions (*Parihara*). |
| **RSK_009** | Ayanamsha Epoch Divergence (Declaration vs Implementation) | **HIGH** | **CONFIRMED** | **RESOLVED (Sprint C)** | The engine constant at J2000.0 was 23°51′25.5″ (23.857092°) against the declared registry standard 23°51′11″ — a **+14.53″** divergence (finding `AYANAMSHA_EPOCH_DECLARED_VS_IMPLEMENTED`, surfaced by the Sprint B qualification harness). *Resolution*: versioned reconciliation `lahiri-registry-aligned-2.0.0` — `getLahiriAyanamsha(jd) = 23.85305556° + 1.39697128°/century · T`, conformant <0.5″ at J2000 and <2″ at 1950; engine versioned to V37.0 (CT_INV_008); the resulting −14.5″ shift was absorbed by the full corpus re-verification (185 match / 4 explained / 0 divergence, `astronomy-certification.md`) and all golden pins re-baselined. No silent convention swap (CT_INV_004). |
| **RSK_010** | Midheaven (MC) Not Computed | **MEDIUM** | **CONFIRMED** | **RESOLVED (Sprint C)** | The wrapped engine previously declared MC as `NOT_CALCULATED` (CT_INV_006). *Resolution*: `calculateMidheavenTropical` implemented (λ_MC = atan2(sin RAMC, cos RAMC · cos ε), IAU 2006 obliquity), surfaced through `McReading` in the provider with NOT_CALCULATED preserved for the fixture provider; every qualification scenario independently verifies the MC upper-culmination identity (RAMC ≡ RA(MC), 300k checks on the 100k run, 0 violations). MC NOT_CALCULATED on a real provider remains a blocking gate finding. |
| **RSK_011** | Far-Future Reference Time-Scale Divergence | **MEDIUM** | **CONFIRMED** (bounded) | **ACCEPTED WITH EXPLANATION (re-measured, Sprint C: 36.21″/49.77″/56.67″/78.41″ at 2070/2080/2090/2100, all `DELTAT_EXTRAPOLATION_BEYOND_2050`)** | Beyond ~2050, ΔT extrapolation models diverge (Espenak–Meeus vs JPL frozen leap-second UTC); the Moon moves ≈0.55″/s so lunar divergence grows (measured: 78.41″ at the 2100 epoch vs 36″ base tolerance). *Safeguard*: documented `DELTAT_EXTRAPOLATION_BEYOND_2050` band records every such divergence with full precision — never silently passed, never hidden by rounding. |
| **RSK_013** | Host-Timezone Dependence of Time Engines | **HIGH** | **CONFIRMED** (2 instances) | **RESOLVED (Sprint E)** | Time engines derived civil days, weekdays and solar instants from the HOST timezone instead of the target city's offset. Measured pre-fix: the same panchang query returned sunrise 06:04Z with `currentPeriod = "Usha Kala"` on a UTC server but sunrise 00:34Z with `"Rahu Kalam"` on an IST server; dasha pratyantardasha display strings drifted a day across hosts. *Resolution*: panchang civil-day/weekday derivation and sunrise/sunset are now true UTC instants of the TARGET civil day with target-wall display strings; dasha formatting uses static month tables with UTC getters (byte-identical on UTC hosts, A/B verified). Permanent regression: `tests/time-qualification.spec.ts` spawns UTC and IST hosts and requires identical output. |
| **RSK_014** | Per-Planet Day/Night Determination in Shadbala | **HIGH** | **CONFIRMED** | **RESOLVED (Sprint F)** | Nathonnatha/Tribhaga derived `isDay` from the planet being scored instead of the Sun — measured on one day chart: Jupiter (H1) scored 0 while Venus (H11) scored 60, and the Moon scored day-strength on a day birth. *Resolution*: day birth is a property of the Sun (houses 7–12, whole-sign above-horizon convention); one determination per chart; regression-pinned in `tests/bala-qualification.spec.ts` and enforced per-scenario by the bala qualification runner (50k day/night checks, 0 violations). |
| **RSK_015** | Mislabeled Ekadhipatya Shodhana | **MEDIUM** | **CONFIRMED** | **RESOLVED (Sprint F)** | `ashtakavargaEngine` returned a copy of the Trikona reduction under the name `ekadhipatyaShodhana` — a silent mislabel (no consumer read it). *Resolution*: field withdrawn to `{status: NOT_CALCULATED, values: null}` (CT_INV_006); the same-lord rashi pairs a future implementation must satisfy are frozen in `BALA_ENGINE_BENCHMARK_001`; honesty pin enforced per-scenario by the runner. |
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
