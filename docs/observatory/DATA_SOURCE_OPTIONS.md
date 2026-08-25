# Real Observatory Data-Source Options — Research Note

**Research date:** 2026-08-26

## Recommendation: Astronomy Engine for the browser, JPL Horizons for validation

| Role | Candidate | Licence / operational position | Decision |
|---|---|---|---|
| Browser deterministic solar-system calculations | [`astronomy-engine` 2.1.19](https://github.com/cosinekitty/astronomy) | MIT. NPM metadata reports v2.1.19/MIT. Provides Sun, Moon and planet positions; transforms between equatorial, ecliptic and horizontal frames; and searches for rise/set, lunar phases, conjunctions, etc. Published accuracy is approximately one arcminute, not a false “NASA precision” claim. | **Preferred production candidate**; pin version and validate before authority change. |
| Independent reference validation / on-demand server reference | [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | Free HTTP API supporting observer ephemerides (RA/Dec, Az/El, physical/uncertainty fields), vectors and elements. Network availability/rate limits mean it must never be a client-side runtime dependency. | **Use in CI/reference-data generation and optional server comparison.** |
| Mission-grade offline kernels | [NASA NAIF SPICE](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/index.html) | Available under Caltech/NASA terms, but redistribution and operational terms must be reviewed; toolkit is considerably heavier than this web product needs. | Do not bundle now; future research/server option. |
| Bright-star catalogue | [HYG v4.1](https://codeberg.org/astronexus/hyg) | CC BY-SA 4.0; full catalogue is large and ShareAlike/attribution must be accepted before distribution. | Optional Level 2 catalogue only, after legal approval. Build a generated bright-star subset pipeline with retained attribution/licence notice if approved. |
| Gaia DR3 catalogue | [Gaia licence](https://www.cosmos.esa.int/web/gaia-users/license) | ESA states Gaia data are CC BY-NC 3.0 IGO. | **Reject for commercial product catalogue distribution** absent a separately approved permission path. |
| 3D sky renderer | Stellarium Web Engine | AGPL v3 or commercial licence according to its source headers. | Remains blocked pending legal choice. |

## Architecture that makes the current visual slice a real observatory

1. **Replace only `ephemeris.ts`, not the Jyotish engine.** Add an `AstronomyEngineEphemeris` implementation, lazy-loaded in a worker. It owns astronomy-first geocentric/topocentric values and horizon events.
2. **Keep the canonical engine separate.** The Lahiri adapter continues to own the currently canonical CosmicTantra values. For every body/time, compare: `astronomy tropical → canonical Lahiri transform` versus canonical chart result. Record a discrepancy; do not silently select a convenient value.
3. **Set an explicit initial precision policy.** Astronomy Engine’s published approximately-one-arcminute positioning must be described honestly. Rise/set display should state its refraction/elevation convention and calculation source.
4. **Make JPL Horizons a reference, not an availability risk.** Commit a small provenance-rich reference fixture (Sun/Moon/planets; 1900–2100; Indian and global observers) generated from Horizons. Run toleranced CI tests against the worker engine. Cache any optional server comparison response and do not send birth data to it without explicit consent.
5. **Use real projection maths.** Draw stars from fixed J2000 RA/Dec catalogue records; precess/project according to observer/time/camera. A 2D canvas/WebGL renderer consumes those typed positions but has no authority over them. Native Nakshatra sectors remain generated from Lahiri sidereal ecliptic geometry.
6. **Progressively load catalogue data.** Solar-system bodies first; a small legal bright-star subset second; larger catalogue only after licence approval. This meets graceful-degradation and mobile goals without an AGPL renderer.

## Immediate implementation slice

- Add `astronomy-engine@2.1.19` as a pinned MIT dependency.
- Implement `AstronomyEngineEphemeris` and `observatory.worker.ts` for Sun/Moon/planets, RA/Dec, altitude/azimuth, ecliptic longitude, and rise/transit/set.
- Add `reference-horizons.json` with generator provenance and comparison tests.
- Change the current display copy from a computed ecliptic sketch to `Astronomy Engine / internal 2D` only after those tests pass.
- Keep the route production-gated as `internal` until all validation and legal gates are satisfied.
