# CosmicTantra — Trust-First Completion Program: Gap Audit

**Date:** 2026-08-30
**Baseline:** Offline-parity build phase complete (87 capabilities IMPLEMENTED, 0 QUALIFIED).

This audit maps the 30 PROGRAMs to what already exists and what must be built.
It drives the checkpoint execution order (TRUST-01 … TRUST-10).

## Legend
- **HAVE** — exists and is adequate
- **PARTIAL** — exists but incomplete for the trust standard
- **MISSING** — must be built

## Audit by program

| # | Program | State | Notes / plan |
|---|---|---|---|
| CORE | One person → one snapshot → evidence graph → many surfaces | PARTIAL | `snapshot.js` gives compute-once; missing convention/version identity + persistent Kundli + evidence graph. **Build snapshot v2.** |
| 1 | External Qualification Factory (`JyotishQualificationLab`) | MISSING | Build lab data model + golden corpus scaffolding + fixtures. External reference values remain owner/Pandit-supplied (blocked until provided — honestly marked). |
| 2 | AstroSage coverage matrix | MISSING | Build `docs/ASTROSAGE_REPORT_COVERAGE_MATRIX.md`. |
| 3 | Living Kundli (`/kundli/{id}`) | MISSING | Persistent store + route + workspace nav. |
| 4 | First 60 seconds | PARTIAL | KundaliExperience exists; build focused create→overview flow with birthplace + time-confidence trust. |
| 5 | Professional chart experience (clickable, evidence-linked SVG) | PARTIAL | `VargaChart` + `NorthIndianChart` exist; add click→inspector. |
| 6 | Cross-calculation exploration | MISSING | Evidence graph + inspector actions (Show in D9, Shadbala, …). |
| 7 | Workbench 2.0 (nav / workspace / inspector) | PARTIAL | `/workbench` exists; add inspector column + cross-calc + presets. |
| 8 | Command palette (actions) | PARTIAL | ⌘K exists (navigation only); extend to actions. |
| 9 | KundliBookModel (WEB/MOBILE/PRINT/PDF) | PARTIAL | `reports.js` renders sections; build renderer-independent book model + variants. |
| 10 | Kashi as orchestrator (evidence + citations) | PARTIAL | `kashiContract.js` retrieves evidence; add retrieval-plan + citation + INSUFFICIENT_CALCULATION_EVIDENCE + confidence. |
| 11 | Personal timeline | MISSING | Merge Dasha + transits + Sade Sati + Varshaphala + events. |
| 12 | Outcome memory | MISSING | Store prediction/outcome audit trail (immutable). |
| 13 | Human astrologer mode | PARTIAL | pandit/cases exist; add structured notes taxonomy over a Kundli. |
| 14 | Trust surface (Calculation Details) | PARTIAL | capability registry exists; add per-snapshot Calculation Details dialog. |
| 15 | Convention center | MISSING | Ayanamsha/node/house/dasha/sunrise selection + preset + recompute. |
| 16 | Contradiction detector | MISSING | Cross-surface invariants over the single evidence object. |
| 17 | Trust regression suite (TRUST_001..008) | MISSING | Build tests. |
| 18 | Versioned calculation snapshots | MISSING | engine/convention/ruleset versions in snapshot. |
| 19 | Performance | HAVE (core) | snapshot cache < 1ms switching; keep measuring. |
| 20 | Failure behavior | PARTIAL | add graceful states; deterministic core independent of AI. |
| 21 | Offline-first core | HAVE | no paid API / LLM for deterministic stack. Keep invariant + test. |
| 22 | Mobile professionalism | PARTIAL | responsive suite exists; consumer cards + pandit companion. |
| 23 | Visual quality | PARTIAL | design tokens exist (Chiti UDS); consolidate pro components. |
| 24 | Language (en/hi, Sanskrit canonical) | PARTIAL | translations.js exists; keep labels out of deterministic objects. |
| 25 | Accessibility | PARTIAL | add aria/table-alt/contrast/reduced-motion to pro components. |
| 26 | Security & privacy (IDOR, ownership, XSS) | PARTIAL | auth.ts fail-closed exists; Kundli is localStorage (no cross-user API surface) — document + test. |
| 27 | Observability | PARTIAL | analytics.ts exists; add structured trust events (no PII). |
| 28 | Product analytics | PARTIAL | extend event taxonomy. |
| 29 | `/dev/trust-center` | MISSING | Build engineering trust dashboard. |
| 30 | Product completion audit (personas) | MISSING | Adversarial walkthrough + P0/P1 triage in final report. |

## Execution order (checkpoints)

- **TRUST-01** Qualification infrastructure: snapshot v2 (conventions+versions), convention engine (ayanamsha/node variants), JyotishQualificationLab, golden corpus, AstroSage matrix.
- **TRUST-02** Living Kundli: persistent store, `/kundli/{id}`, workspace nav, first-60s create flow, birthplace + time-confidence trust.
- **TRUST-03** Report parity: KundliBookModel + variants + coverage.
- **TRUST-04** Professional Workbench 2.0: inspector + cross-calc + command palette actions.
- **TRUST-05** Evidence/Kashi: evidence graph + orchestrator + citations + confidence + INSUFFICIENT_CALCULATION_EVIDENCE.
- **TRUST-06** Timeline + outcomes.
- **TRUST-07** Mobile.
- **TRUST-08** Security/reliability: contradiction detector, failure states, trust regression suite, IDOR/ownership audit.
- **TRUST-09** Product polish: trust-center, convention-center UI, visual/a11y.
- **TRUST-10** Launch qualification: personas audit, final acceptance report, verdict.

## Hard constraints honored
- Do not rewrite the qualified canonical engine (`src/lib/astrologyEngine.js`). Convention variants are applied as **non-destructive longitude shifts** (same technique already used by `kp.js`), never by editing the engine.
- Nothing labelled QUALIFIED without external evidence (external reference data is owner/Pandit-supplied and currently unavailable → those rows stay honestly pending).
- Deterministic core stays offline (no paid API, no LLM).
