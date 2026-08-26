# Observatory documentation

This directory contains the complete design, implementation, visual, and qualification record for the CosmicTantra Observatory suite.

## Documents

- [`OBSERVATORY_BLUEPRINT.md`](OBSERVATORY_BLUEPRINT.md) — full product blueprint, route map, architecture, astronomy pipeline, design decisions, image inventory, micro-improvement ledger, QA checklist, and extension roadmap.
- [`QUALIFICATION_REPORT.md`](QUALIFICATION_REPORT.md) — formal **CONDITIONAL PASS** report, verification evidence, Moon discrepancy, JPL fixture blocker, and release guardrails.
- [`WORLD_CLASS_ROADMAP.md`](WORLD_CLASS_ROADMAP.md) — strategic review, open NASA/ISRO/Roscosmos source inventory, licensing/ingestion rules, zoom/deep-inspection model, and the single recommended next milestone.
- [`EVIDENCE_OBSERVATION_V1.md`](EVIDENCE_OBSERVATION_V1.md) — implementation note for the display-only viewport, observation helpers, Student Desk, provenance block, file map, validation record, and remaining qualification guardrails.
- [`reference-fixture-notes.md`](reference-fixture-notes.md) — reference-provider contract, geocentric/topocentric draft commands, review/freeze sequence, and explicit no-fixture status.
- [`LIVE_OBSERVATION_ARCHITECTURE.md`](LIVE_OBSERVATION_ARCHITECTURE.md) — implemented live/reference imaging seam, NASA SDO/Helioviewer first adapter, provider capability matrix, server-side cache/frame routes, ASCOM Alpaca/INDI gateway boundary, MCP control-plane endpoint, safety defaults, licensing risks, and follow-up qualification steps.

## Blueprint images

- [`assets/observatory-architecture.svg`](assets/observatory-architecture.svg) — system architecture and data flow.
- [`assets/observatory-interaction-flow.svg`](assets/observatory-interaction-flow.svg) — selection, validation, detail, and action flow.
- [`assets/observatory-responsive-layout.svg`](assets/observatory-responsive-layout.svg) — mobile bottom sheet, desktop side sheet, and practical field cards.

The SVGs are repository-owned documentation diagrams. They are intentionally separate from the inline SVG artwork used by the product UI in `src/components/observatory/CelestialArtwork.tsx`.
