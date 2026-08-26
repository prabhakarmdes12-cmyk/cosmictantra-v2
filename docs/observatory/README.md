# Observatory documentation

This directory contains the complete design, implementation, visual, and qualification record for the CosmicTantra Observatory suite.

## Documents

- [`OBSERVATORY_BLUEPRINT.md`](OBSERVATORY_BLUEPRINT.md) — full product blueprint, route map, architecture, astronomy pipeline, design decisions, image inventory, micro-improvement ledger, QA checklist, and extension roadmap.
- [`QUALIFICATION_REPORT.md`](QUALIFICATION_REPORT.md) — formal **CONDITIONAL PASS** report, verification evidence, Moon discrepancy, JPL fixture blocker, and release guardrails.

## Blueprint images

- [`assets/observatory-architecture.svg`](assets/observatory-architecture.svg) — system architecture and data flow.
- [`assets/observatory-interaction-flow.svg`](assets/observatory-interaction-flow.svg) — selection, validation, detail, and action flow.
- [`assets/observatory-responsive-layout.svg`](assets/observatory-responsive-layout.svg) — mobile bottom sheet, desktop side sheet, and practical field cards.

The SVGs are repository-owned documentation diagrams. They are intentionally separate from the inline SVG artwork used by the product UI in `src/components/observatory/CelestialArtwork.tsx`.
