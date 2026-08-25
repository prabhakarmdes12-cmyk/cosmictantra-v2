# ADR-001: Typed Observatory Boundary and Renderer Isolation

**Status:** Accepted for Phase 1 / MVP.

## Decision
Introduce `src/lib/astronomy` for typed observer/time/provenance boundaries; introduce `src/lib/jyotish/sidereal` as an adapter to the protected canonical engine; introduce `SkyRenderer` as a renderer-only interface. Implement the initial route as an internal 2D ecliptic fallback.

## Rationale
The repository has a canonical Jyotish chart engine but no approved 3D renderer or independently validated astronomical dependency. The renderer must never become a calculation authority.

## Consequences
- `OBSERVATORY_RENDERER` defaults to `internal`; `stellarium` cannot initialize because legal approval is not complete.
- Type metadata identifies ecliptic tropical vs Lahiri sidereal longitudes.
- No claim of physical-sky/high numerical accuracy is made by the MVP.
- A future authoritative ephemeris must be added behind `ephemeris.ts`, validated independently, and reconciled before it replaces the current derived tropical display.
