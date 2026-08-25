# Independent Reference Validation Protocol

## Purpose
Astronomy Engine must not be validated against itself. CosmicTantra’s existing chart engine is likewise not an independent astronomical reference.

## Authority
The reference is the NASA/JPL Horizons observer ephemeris API. It is used only to generate reviewed, versioned test fixtures. It is not an application runtime dependency and no user location or birth data is sent to it by the Observatory.

## Fixture generation
Run `npm run reference:generate` in a controlled environment with outbound access to `ssd.jpl.nasa.gov`. The generator requests Sun, Moon, Mercury, Venus, Mars, Jupiter and Saturn at Dhanbad, Varanasi and London for 2000, 2026 and 2050. It persists:

- exact request URL,
- UTC instant,
- observer coordinates,
- provider metadata,
- original Horizons text response.

Raw responses are retained to make parsing changes auditable. A reviewer must inspect and commit the fixture before it becomes a release baseline.

## Current release status
**BLOCKED:** this sandbox could not establish TLS to the JPL endpoint while generating the first fixture. No reference values were invented or substituted. `reference-validation.spec.ts` records the missing fixture as an explicit skipped release-gate test. Observatory qualification cannot be PASS until the fixture exists and numeric comparison tolerances are approved.

## Planned comparison
The parser will compare compatible coordinates with explicitly stated refraction/topocentric conventions. Tolerance is set from measured differences across the fixture matrix, not display decimal places. Canonical CosmicTantra Jyotish output is separately compared after Lahiri transformation; material discrepancies are reported, not normalized away.
