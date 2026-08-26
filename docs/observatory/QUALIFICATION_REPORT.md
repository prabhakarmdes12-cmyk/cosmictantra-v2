# Observatory qualification report

**Date:** 26 August 2026 (Asia/Calcutta)
**Scope:** local sky observatory, ecliptic planisphere, Sky Time Machine, Gochara transit wheels, practical observation planning, Student Desk, provenance contract, and Panchang deep-links
**Decision:** **CONDITIONAL PASS**

## 1. Qualification scope

This qualification covers the four public Observatory routes and the coordinate/data paths that support them:

| Route | Qualification target |
| --- | --- |
| `/observatory` | Zenith-centred stereographic local sky, 70 bright-star anchors, constellation lines, seven visible grahas, ecliptic, altitude rings, zenith/cardinal markers, Nakshatra Mandala, and planet rail |
| `/observatory/ecliptic` | Top-down tropical ecliptic planisphere, 12 rashi sectors, 27 Nakshatra subdivisions, and all nine calculated grahas (including Rahu/Ketu) in the tropical/sidereal inspector |
| `/observatory/timemachine` | Birth date/time input, 0–100% scrubber, live sky at the scrubbed instant, and birth-to-now rashi change table |
| `/observatory/gochara` | Canvas-drawn natal/current sidereal wheels, nine-graha selector, Rahu/Ketu inclusion, change indicators, and Moon-reference transit panel |

The Panchang city page now creates links containing `city` and an ISO `time` instant. The Observatory accepts `city`, `time`, and `planet` query parameters, so a user can move from a computed Panchang instant to the matching sky view without silently resetting the coordinate anchor.

## 2. Implementation evidence

### Coordinate pipeline

1. Bright-star records are stored as J2000 right ascension, declination, visual magnitude, and B−V colour index in `src/lib/astronomy/stars.ts`.
2. `src/lib/astronomy/projection.ts` precesses J2000 equatorial coordinates to of-date coordinates.
3. Local mean sidereal time is calculated in **hours**, then converted to hour angle.
4. Equatorial coordinates are converted to altitude and azimuth for the selected latitude/longitude.
5. A zenith-centred stereographic transform maps the visible hemisphere to the canvas.
6. Ecliptic longitude is converted to of-date equatorial coordinates for the solar-path overlay.

### Body data

`src/lib/astronomy/canonicalBodies.ts` provides one consistent body surface for the four instruments. Visible planets use transparent low-precision Keplerian elements suitable for a visual educational instrument and rashi selection. Sun and Moon use explicit compact solar/lunar approximations. The sidereal field is always derived by subtracting the displayed Chitra Paksha/Lahiri ayanamsha.

Rahu and Ketu are **not** sent to a planet-only astronomy API. They use the mean ascending-node formula:

```text
Rahu = 125.04452° − 0.0529538083° × days_from_J2000
Ketu = Rahu + 180°
```

Both nodes are marked retrograde and remain exactly opposite modulo 360°.

### Determinism and UX

- No third-party sky request is needed at render time.
- The 70-star catalogue and constellation sticks are versioned source data.
- The planisphere uses tropical longitude for the astronomy ring and exposes the sidereal conversion in the inspector instead of mixing frames.
- Canvas components use `ResizeObserver`, bounded device-pixel ratios, accessible `role="img"` labels, display-only bounded zoom/pan, wheel/pinch/double-click navigation, keyboard controls, and transformed target hit areas.
- The Time Machine labels its slider as an inspection interpolation; it does not imply a physically linear orbit.
- Gochara is explicitly described as a computational comparison and not a complete Jyotish judgement.
- Planet and constellation targets are hit-tested independently. Planet targets have priority over nearby star/line targets; a selected constellation highlights its stars and stick-figure lines.
- `CelestialDetailSheet` presents a responsive mobile bottom sheet or desktop side sheet. `CelestialArtwork` supplies original SVG portraits for planets, orbital diagrams for Rahu/Ketu, and annotated star maps for constellations, avoiding remote image hotlinks and keeping the first interaction fast.
- The detail sheet includes a visible provenance block with local/reference quality, frame, model/provider, epoch, fixture status, and the Moon discrepancy guardrail. Rahu/Ketu remain mathematical nodes with no physical altitude/azimuth claim.
- The Observatory's `Sky at a glance` panel ranks the seven physical grahas by current altitude, direction, altitude band, and a user-selected minimum-altitude mask, provides keyboard-accessible planet cards, and can copy a plain-text readout for field use.
- The primary route includes a Student Desk with explicitly approximate solar events/twilight, Moon phase, selected-graha field cues, a sampled next mathematical-horizon crossing, bounded Moon separation, a browser-local observation notebook with JSON/CSV export, coordinate-study guidance, and optional official-source link-outs. Rahu/Ketu are excluded from physical rise/set planning and are saved only as mathematical-node study notes.
- The shared provider contract records provider/model/frame/epoch/observer/quality/error-budget fields. The local adapter is active; the reference-fixture parser fails closed until a reviewed fixture exists.
- Observation time inputs are interpreted in the selected city's fixed UTC offset, while the canonical instant remains serialized as ISO UTC in the URL. Quick controls provide now, dusk, night, midnight, and one-hour stepping.
- Share links carry `city`, `time`, `object`, and `objectKind`; known planet/constellation payloads reopen the same detail sheet across all four instruments. Arbitrary object ids are rejected before rendering.
- The Ecliptic instrument plots Rahu and Ketu as calculated ecliptic points and labels them as mathematical nodes rather than physical planets.

## 3. Verification performed

The following checks are the acceptance commands for this qualification:

```bash
npm run typecheck
npm test -- --reporter=line
npm run build
```

The Observatory unit suite checks:

- exactly 70 star records and representative J2000 values;
- sidereal time range and finite sky projections;
- tropical-to-sidereal wrap behaviour;
- half-open rashi boundaries;
- 27 Nakshatra sectors and four padas;
- planisphere zero/opposite geometry;
- nine canonical bodies with finite tropical/sidereal coordinates;
- explicit Rahu/Ketu mean-node handling, retrograde flags, opposition, and aliases;
- bounded angular-separation geometry and deterministic ten-minute horizon-crossing interpolation;
- selected-body planner output, Moon-separation context, and the no-rise/set physical-node exception;
- observation-log schema validation, local persistence round trips, and CSV escaping;
- display-only horizon-mask and limiting-magnitude bounds without changing calculated coordinates.

A local Next development-server smoke check returned HTTP 200 for `/observatory`, `/observatory/ecliptic`, `/observatory/timemachine`, and `/observatory/gochara`; representative city/time/planet/object deep-link requests also returned HTTP 200 after the planner, notebook, and display-filter slices. The isolated Observatory suite passed 24/24 and the existing engine suite passed 13/13 in this environment. `npm run typecheck` is blocked by the generated Prisma client issue, and `npm run build` is blocked during Prisma engine checksum retrieval. The full Playwright command also attempts the repository's responsive browser suite, but its Chromium executable is not installed in this sandbox.

For a production-style HTTP smoke check after `npm run build && npm start`, request each route without query parameters and with a Panchang-style deep-link query. The expected status is HTTP 200 for all four routes.

## 4. Conditional-pass items

### BLOCKER-1 — Moon engine discrepancy

A comparison against the existing Moon approximation/reference path currently shows a **1.135216°** discrepancy for the qualification fixture. The visual instrument remains internally consistent and the rashi boundary logic is deterministic, but production sign-off needs an explicit tolerance policy (or an upgraded lunar model) before advertising sub-degree Moon accuracy. Until then, the Observatory should be described as an educational/operational instrument rather than a precision ephemeris authority.

**Owner/action:** decide and document the Moon tolerance, then add a frozen comparison fixture to the automated suite.

### BLOCKER-2 — JPL Horizons reference fixture missing

A network-independent JPL Horizons reference fixture is not present in this checkout. The recommended follow-up is to run `npm run reference:generate` in a networked/review environment, commit only the small date/body fixture, and compare the canonical body outputs against it. Do not make the browser dependent on live Horizons requests.

**Owner/action:** generate the fixture, record epoch/frame/observer assumptions, and add an error budget per body.

## 5. Release recommendation

**Conditional pass.** The routes and UI wiring are suitable for review and product discovery. Release as a transparent visual instrument with the stated accuracy caveats. Do not claim JPL-grade accuracy, sub-degree lunar precision, or a complete transit interpretation until BLOCKER-1 and BLOCKER-2 have an agreed policy and fixtures.
