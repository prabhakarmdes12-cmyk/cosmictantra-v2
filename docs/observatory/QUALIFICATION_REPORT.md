# Observatory qualification report

**Date:** 26 August 2026 (Asia/Calcutta)
**Scope:** local sky observatory, ecliptic planisphere, Sky Time Machine, Gochara transit wheels, practical observation planning, Student Desk, local/external provenance contracts, capability-aware live-observation layer, server-side frame/tile gateways, MCP control-plane seam, and Panchang deep-links
**Decision:** **CONDITIONAL PASS**

## 1. Qualification scope

This qualification covers the four public Observatory routes and the coordinate/data paths that support them:

| Route | Qualification target |
| --- | --- |
| `/observatory` | Zenith-centred stereographic local sky, 70 catalogue anchors, zoom-gated faint field, constellation lines, seven visible grahas, ecliptic, altitude rings, zoom-tiered alt/az grid, zenith/cardinal markers, Nakshatra Mandala, and planet rail |
| `/observatory/ecliptic` | Top-down tropical ecliptic planisphere, 12 rashi sectors, 27 Nakshatra subdivisions, and all nine calculated grahas (including Rahu/Ketu) in the tropical/sidereal inspector |
| `/observatory/timemachine` | Birth date/time input, 0–100% scrubber, live sky at the scrubbed instant, and birth-to-now rashi change table |
| `/observatory/gochara` | Canvas-drawn natal/current sidereal wheels, nine-graha selector, Rahu/Ketu inclusion, change indicators, and Moon-reference transit panel |

The Panchang city page now creates links containing `city` and an ISO `time` instant. The Observatory accepts `city`, `time`, `planet`, `object`, and `objectKind` query parameters, so a user can move from a computed Panchang instant to the matching sky view or reopen a known planet, catalogue star, or constellation detail sheet without silently resetting the coordinate anchor.

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
- The local sky reveals fixed-seed faint context stars, progressive catalogue labels, altitude/azimuth grid tiers, a directional twilight glow, phase-aware Moon rendering, and a selected-body local-coordinate callout only as display detail; the context stars are not selectable or measurement data.
- The Time Machine labels its slider as an inspection interpolation; it does not imply a physically linear orbit.
- Gochara is explicitly described as a computational comparison and not a complete Jyotish judgement.
- Planet and constellation targets are hit-tested independently. Planet targets have priority over nearby star/line targets; a selected constellation highlights its stars and stick-figure lines.
- `CelestialDetailSheet` presents a responsive mobile bottom sheet or desktop side sheet. `CelestialArtwork` supplies original SVG portraits for planets, orbital diagrams for Rahu/Ketu, and annotated star maps for constellations, avoiding remote image hotlinks and keeping the first interaction fast.
- The detail sheet includes a visible provenance block with local/reference quality, frame, model/provider, epoch, fixture status, and the Moon discrepancy guardrail. Rahu/Ketu remain mathematical nodes with no physical altitude/azimuth claim. Known bright-star deep links resolve to catalogue-anchor detail metadata and a local altitude/azimuth projection; they do not fabricate tropical/sidereal or astrological coordinates for a star.
- The Observatory's `Sky at a glance` panel ranks the seven physical grahas by current altitude, direction, altitude band, and a user-selected minimum-altitude mask, provides keyboard-accessible planet cards, and can copy a plain-text readout for field use.
- `StudyCockpit` is centered on the same selected target, city, and Time Machine instant as the local canvas. Its three cards keep the local calculation, optional provider-backed Reality layer, and qualification/evidence state visually separate; local target context includes altitude/azimuth, visibility band, tropical/sidereal coordinates where meaningful, rashi/Nakshatra/pada where derived, physical-body versus mathematical-node semantics, provider capability, and source/model provenance.
- `ObservationLog` saves a version-1 study snapshot with exact UTC times, city/observer context, local calculation provenance, provider capabilities and notices, and optional frame metadata. A frame record preserves provider/frame id, requested/captured/received times, wavelength/filter, exposure, quality, processing, freshness, attribution, license/use notes, and source/transport URLs. Snapshots contain no image bytes and retain `CONDITIONAL PASS`, `BLOCKER-1`, and `BLOCKER-2`.

- The primary route includes a Student Desk with explicitly approximate solar events/twilight, Moon phase, selected-graha field cues, a sampled next mathematical-horizon crossing, bounded Moon separation, a browser-local observation notebook with JSON/CSV export, coordinate-study guidance, and optional official-source link-outs. Rahu/Ketu are excluded from physical rise/set planning and are saved only as mathematical-node study notes.
- The shared provider contract records provider/model/frame/epoch/observer/quality/error-budget fields. The local adapter is active; the reference-fixture parser fails closed until a reviewed fixture exists.
- The live-observation contract in `src/lib/observatory/live/` keeps local calculation, near-real-time public mission imagery, queued remote exposure, user-owned camera stream, and archival/reference imagery distinct. The primary Reality layer requests a provider only at 2.15× local display zoom or deeper.
- NASA SDO/Helioviewer is the first enabled public path and is Sun-only. Helioviewer capture metadata is preferred; the NASA latest-browse fallback explicitly leaves capture time unknown. Moon, planets and stars without a configured remote/local telescope return an honest no-frame state.
- `/api/observatory/live/frame` and `/tile` are server-side allowlisted image gateways with bounded payloads and cache headers; the browser does not use uncontrolled provider hotlinks. `/api/observatory/live/request` fails closed for hardware actions.
- `/api/observatory/mcp` is an official SDK-backed stateless MCP context/control endpoint. It exposes target resolution, provider status, provenance, approximate planning and a locked exposure-request seam. MCP carries metadata/HTTP paths, not high-throughput image/video bytes; HTTP/CDN/object storage, SSE/WebSocket and WebRTC remain the frame/status transports.
- ASCOM Alpaca and INDI are represented as authenticated local-gateway capabilities only. The read-only `/api/observatory/agent/status` seam validates deployment configuration and redacts tokens; browser LAN discovery and unauthenticated mount/camera control are not implemented.
- Observation time inputs are interpreted in the selected city's fixed UTC offset, while the canonical instant remains serialized as ISO UTC in the URL. Quick controls provide now, dusk, night, midnight, and one-hour stepping.
- Share links carry `city`, `time`, `object`, and `objectKind`; known planet/star/constellation payloads reopen the same detail sheet across the Observatory instruments. Arbitrary object ids are rejected before rendering, and star details remain catalogue projections rather than precision astrometry.
- The Ecliptic instrument plots Rahu and Ketu as calculated ecliptic points and labels them as mathematical nodes rather than physical planets.

## 3. Verification performed

The following checks are the acceptance commands for this qualification:

```bash
npm run typecheck
npm test -- --reporter=line
npm run build
```

The Observatory invariant suite checks:

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
- observation-log schema validation, local persistence round trips, snapshot JSON/CSV provenance retention, and CSV escaping;
- target-aware study context for physical bodies, mathematical nodes, catalogue stars, constellations, and reserved events;
- display-only horizon-mask and limiting-magnitude bounds without changing calculated coordinates;
- live target/provider capability matching, server-side frame/tile URL construction, provider metadata null semantics, NASA SDO fallback labeling, and fail-closed hardware action decisions;
- direct HTTP/MCP/CORS integration responses for local-only targets, invalid targets, locked hardware, stateless MCP initialization, and preflight behavior;
- deep-link parsing and synchronization for known planets, stars, constellations, city, instant, and target-aware cockpit state.

A local Next development-server smoke check returned HTTP 200 for `/observatory`, `/observatory/ecliptic`, `/observatory/timemachine`, and `/observatory/gochara`; representative city/time/planet/object deep-link requests also returned HTTP 200, including a known-star `sirius` deep link. The focused Observatory coordinate/integration run passed **35/35** (`30` invariant tests plus `5` direct HTTP-boundary tests). `npm run typecheck` and `git diff --check` pass. The live/MCP route smoke checks returned the expected metadata, allowlist rejection, and fail-closed safety responses; the star live response is explicitly `frame: null` with `local-calculation` mode. `npm run build` remains blocked before Next compilation when Prisma cannot retrieve its engine checksum from `binaries.prisma.sh`. The full `npm test -- --reporter=line` run recorded **48 passed and 10 responsive-test launch failures** because the Playwright Chromium executable is not installed in this sandbox.

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
