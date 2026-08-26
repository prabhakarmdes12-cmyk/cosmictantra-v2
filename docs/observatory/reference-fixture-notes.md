# Reference fixture notes

**Status:** no reviewed fixture is committed. The Observatory remains **CONDITIONAL PASS** and uses the deterministic local approximation in the browser.

## Purpose

The planned reference fixture is a small, versioned comparison artifact—not a live browser provider. It should let qualification compare the local canonical body result against a deliberately specified JPL Horizons result without making the primary Observatory wait on a network service.

The application boundary is defined in:

- [`src/lib/astronomy/providers/types.ts`](../../src/lib/astronomy/providers/types.ts)
- [`src/lib/astronomy/providers/localApproximation.ts`](../../src/lib/astronomy/providers/localApproximation.ts)
- [`src/lib/astronomy/providers/referenceFixture.ts`](../../src/lib/astronomy/providers/referenceFixture.ts)

The parser intentionally rejects incomplete data, empty observation arrays, unsupported bodies, invalid ranges, and unreviewed/draft payloads. Missing data resolves to `BLOCKER-2`, never to a reference-checked quality badge.

## Draft generation

Run only from a networked qualification environment:

```bash
npm run reference:generate
```

The default output is `docs/observatory/reference-fixture-draft.json`. It contains raw Horizons responses and review metadata but is **not** a valid application fixture until the response quantities have been parsed and manually reviewed.

The generator supports an explicit geocentric request:

```bash
REFERENCE_MODE=geocentric \
REFERENCE_EPOCH=2026-08-25T00:00:00Z \
npm run reference:generate
```

For a deliberate topocentric observer request, the default observer is Patna, India. Override it when needed:

```bash
REFERENCE_MODE=topocentric \
REFERENCE_LONGITUDE=85.1376 \
REFERENCE_LATITUDE=25.5941 \
REFERENCE_ELEVATION_M=53 \
REFERENCE_OBSERVER_LABEL='Patna, India' \
npm run reference:generate
```

Horizons request metadata records:

- UTC epoch and one-minute stop time;
- geocentric `500@399` or topocentric `coord@399` center;
- geodetic longitude, latitude and elevation for topocentric mode;
- apparent/refraction settings;
- explicit quantities;
- source endpoint;
- raw response for review.

## Review and freeze sequence

1. Inspect the raw response `$$SOE` block for every body.
2. Confirm the time scale, epoch, reference plane, reference frame, apparent/airless state, refraction setting and observer center.
3. Parse the reviewed longitude/latitude, RA/Dec and distance into `ReferenceFixtureObservation` records.
4. Normalize angular values into the provider schema ranges before writing the fixture.
5. Keep physical bodies only; do not put Rahu or Ketu into a physical Horizons body table.
6. Record the exact query quantities and the Horizons source URL.
7. Add body-specific local-versus-reference error budgets.
8. Preserve the known **BLOCKER-1 Moon discrepancy of 1.135216°** until a reviewed policy or upgraded lunar model resolves it.
9. Commit only the small reviewed fixture, not a large raw archive or browser-time API dependency.
10. Add deterministic tests for the fixture epoch, observer, body set, field tolerances and fallback behavior.

A valid fixture should contain at least one reviewed observation and metadata equivalent to:

```text
schemaVersion: 1
fixtureId: immutable reviewed identifier
timeScale: UTC | TDB | TT
center: explicit Horizons center
frame: explicit reference frame
plane: explicit reference plane
apparent: explicit boolean
refraction: explicit boolean
quantities: exact query quantities
observer: explicit geodetic values when topocentric
sourceUrl: JPL Horizons source page/endpoint
reviewNote: human review record
```

## Guardrails

- A draft raw response is not evidence until the quantities and frame are reviewed.
- JPL Horizons is a qualification/reference source here, not a browser render dependency.
- A fixture does not automatically justify JPL-grade claims for every date or body.
- A topocentric observer does not model local terrain, horizon obstruction, clouds, light pollution or atmospheric seeing.
- The Moon needs a separately stated tolerance; never round away the known discrepancy.
- Rahu and Ketu remain calculated mathematical nodes, not physical reference bodies.
