# Observatory live-observation architecture

**Status:** implemented first vertical slice; external solar adapter active when reachable; remote-telescope and user-hardware adapters are capability seams, not claimed integrations
**Date:** 26 August 2026 (Asia/Calcutta)
**Release posture:** **CONDITIONAL PASS**

This document records the production boundary between CosmicTantra’s local calculated sky and real telescope/mission imagery. The local stereographic sky remains the primary instrument. A provider frame is an optional, separately labelled observation product; it is never a texture silently placed behind an arbitrary zoom level.

## 1. What is live today

The primary `/observatory` route now includes a **Reality layer** below the local canvas.

1. Select a planet, or choose a bright catalogue star from the accessible anchor list.
2. Zoom the local sky to **2.15× or deeper**.
3. The browser asks the same-origin server route `/api/observatory/live` for the selected target’s capabilities and, where appropriate, a provider frame.
4. The route validates the target, keeps the local calculation descriptor in the response, and calls only an allowlisted server-side adapter.
5. For the Sun, the first adapter tries Helioviewer’s SDO/AIA 171 Å `getClosestImage` path. If that public service is unavailable for a current request, it can fall back to NASA SDO’s official latest-browse AIA 171 image **without inventing a capture timestamp**.
6. For a planet or star without an enabled provider, the panel says so and shows the configured future options. It does not display a fake telescope image, a remote hotlink, or a zoomed copy of the local illustration.

The image shown for the Sun is a solar mission product in extreme ultraviolet. It is not a visible-light telescope view from Patna, Varanasi, or the selected observer location. The local calculation and the mission frame remain visibly separate.

Relevant paths:

- `src/components/observatory/LiveObservationPanel.tsx` — target-aware Reality layer and metadata presentation.
- `src/components/observatory/ObservatoryExperience.tsx` — selected target and zoom-threshold wiring.
- `src/lib/observatory/live/types.ts` — normalized target, provider, frame, freshness, and response contracts.
- `src/lib/observatory/live/catalog.ts` — capability matrix and target validation.
- `src/lib/observatory/live/helioviewerAdapter.ts` — Helioviewer metadata, NASA SDO fallback, screenshot/tile URL construction, and server-only fetch seam.
- `src/app/api/observatory/live/route.ts` — same-origin capability/frame metadata route.
- `src/app/api/observatory/live/frame/route.ts` — allowlisted server-side image gateway with cache headers and payload limits.
- `src/app/api/observatory/live/tile/route.ts` — allowlisted Helioviewer tile gateway for a future tiled viewer.
- `src/app/api/observatory/live/request/route.ts` — locked hardware/exposure control-plane seam.
- `src/app/api/observatory/agent/status/route.ts` — read-only server-side ASCOM Alpaca/INDI agent status seam.
- `src/lib/observatory/live/safety.ts` — fail-closed safety policy and authorization decision contract.
- `src/lib/observatory/agent.ts` — validated deployment-only agent configuration, status schema and server-side fetch boundary.
- `src/lib/observatory/mcpServer.ts` — official MCP server registration for metadata, planning, and locked exposure requests.
- `src/app/api/observatory/mcp/route.ts` — stateless Streamable HTTP MCP endpoint.

## 2. The five realities the UI must distinguish

| Reality | Meaning | UI/API treatment |
| --- | --- | --- |
| **Local calculated sky** | Versioned TypeScript ephemeris, star catalogue, horizontal conversion, and stereographic pixels. | Always available. Labelled `Local calculated sky`; source path and low-precision limitations remain visible. Not a camera frame. |
| **Near-real-time public mission imagery** | A public spacecraft/mission product with provider capture/receive metadata. | `near-real-time-public`; show provider, capture time if supplied, receive time, wavelength/filter, processing, freshness, source, attribution and use notes. |
| **Remote telescope exposure** | A requested exposure scheduled by a remote observatory and delivered later. | `remote-exposure`; status can be queued, captured, or archived. Never label a queued request as live. Requires provider account/program rules. |
| **User-owned telescope camera stream** | Frames from equipment owned or explicitly connected by the user through a trusted gateway. | `camera-stream`; stream bytes use WebRTC/HTTP/WebSocket as appropriate, while MCP carries status and commands only. Camera/mount metadata is user/provider data, not local ephemeris. |
| **Archival/reference imagery** | A previously captured mission or telescope image used for study/reference. | `archival-reference`; no live badge. Preserve capture time and stale/not-applicable status. Do not substitute it for a requested current frame. |

The normalized `LiveFrameMetadata` contract contains nullable fields where a provider genuinely does not publish a value. The UI renders `not supplied` rather than guessing. A missing exposure time, capture time, pixel scale, or filter is a metadata limitation, not permission to derive a precise-looking value from the display.

## 3. Capability truth table

| Target | Public first-party frame | Open arbitrary live optical feed | Remote exposure path | User hardware path | Current product behavior |
| --- | --- | --- | --- | --- | --- |
| Sun | NASA SDO/Helioviewer near-real-time EUV images | Not a visible-light local feed | Possible through telescope providers, but unnecessary for first solar layer | ASCOM/INDI possible | Helioviewer first; NASA SDO latest browse fallback; exact capture timestamp is shown when Helioviewer supplies it. |
| Moon | Mission/archive images and telescope imagery exist | No universal free arbitrary-target feed | LCO/MicroObservatory/Virtual Telescope style paths are service/session dependent | ASCOM/INDI | No frame is fabricated. Capability panel points to remote/user-telescope options. |
| Planets | Mission/archive imagery and occasional public sessions | No universal free arbitrary-target continuous feed | LCO, Virtual Telescope, educational services, or a partner service | ASCOM/INDI | No frame is fabricated. Personalized optical view requires an approved remote/local telescope path. |
| Bright stars | Mission/observatory survey/archive data | No universal free arbitrary-target zoom feed | Remote robotic telescope or user equipment | ASCOM/INDI | No frame is fabricated. Star selection is still useful for planning and future exposure routing. |
| Events | Event/catalogue products may be available by event id | Provider-specific | Service/provider dependent | User equipment plus event planning | Event target validation exists; no event image adapter is enabled yet. |
| Rahu/Ketu | No physical camera target | Not applicable | Not a physical target | Not applicable | Remain mathematical nodes in local/ecliptic/Jyotish instruments; no live frame or physical telescope request. |

This is why a user does not need to buy a telescope to use the Observatory, but does need either an approved public/partner provider or telescope access to obtain a personalized real optical view of an arbitrary planet or star. Public solar mission imagery is a useful first exception, not evidence that every object has a free live feed.

## 4. Provider adapter matrix

The catalog in `src/lib/observatory/live/catalog.ts` is intentionally explicit about configuration and licensing risk.

### NASA SDO and Helioviewer

- Scope: Sun only; the first implementation uses SDO/AIA 171 Å.
- Helioviewer’s `getClosestImage` response supplies an image id, provider capture date, normalized scale, scale correction, and source dimensions. The adapter records the capture time and computes the reported actual pixel scale from the documented normalized scale/correction fields.
- Helioviewer screenshot and tile bytes are fetched by the CosmicTantra server route. The browser receives a same-origin URL, not a direct provider image URL.
- NASA SDO latest browse is a fallback only when Helioviewer is unavailable for a current request. Its capture time is recorded as `null` because the latest-browse endpoint does not provide a timestamp through this adapter.
- AIA 171 Å is extreme ultraviolet. It is not a visible-light representation and should not be blended into the local sky as if it were a camera view of a point in the selected horizon scene.
- NASA/SDO and Helioviewer attribution, terms, watermark requirements, API availability, redistribution and commercial-use conditions must be reviewed at item/provider level before production CDN mirroring.

### Las Cumbres Observatory

- Scope: serious remote robotic telescope candidate for scheduled exposures and archive products.
- Status: catalogued but not configured; credentials, account/proposal, target constraints, quota, scheduler, status polling, calibration products, and archive policy are still required.
- Product mode: `remote-exposure` or `archival-reference`, not browser video.
- Do not put LCO credentials in the browser or claim an instant result while a request is queued.

### NASA/Harvard MicroObservatory

- Scope: educational real telescope requests with later delivery/processing.
- Status: catalogued but not configured.
- Product mode: `remote-exposure` or `archival-reference`.
- It is useful for a student study workflow, but not for the promise “zoom now and see a live camera frame.” Service terms and item-level reuse rules must be checked before storing or redistributing results.

### Virtual Telescope Project

- Scope: scheduled/event-driven public observing sessions and remote robotic telescope work.
- Status: catalogued as session/link based; no scraping or assumed arbitrary-target API.
- Product mode: session stream, remote exposure, or archive depending on provider permission.
- Integration should be a provider-approved link/session handoff unless an API and media rights are explicitly granted. Broadcast recording, logo, photographer credit, and commercial-use rights remain separate questions.

### ASCOM Alpaca and INDI

- Scope: user-owned mount, camera, focuser, dome, weather and observatory equipment through a trusted gateway.
- Status: catalogued but not configured.
- ASCOM Alpaca provides a platform-neutral device API and image-transfer conventions. INDI is a distributed Linux astronomy-device ecosystem and can be used through an appropriate bridge/agent.
- The browser must never scan a LAN, call unauthenticated `localhost`/private device endpoints, or receive mount-control credentials. The browser talks to the CosmicTantra server or an authenticated gateway; the gateway talks to Alpaca/INDI on the trusted observatory network. The deployment-only agent boundary accepts HTTPS, or explicitly configured HTTP on private/local hosts for common Alpaca/INDI LAN deployments; public HTTP endpoints are rejected.
- Camera bytes and high-rate previews should travel over a bounded HTTP/object-storage/WebSocket/WebRTC channel, not through MCP tool results.

## 5. Normalized frame contract

Every external frame returned by the live route follows `LiveFrameMetadata` in `src/lib/observatory/live/types.ts`:

```text
schemaVersion
frameId
provider / providerLabel
target { kind, id, label }
mode
status
requestedAtUtc
capturedAtUtc
receivedAtUtc
wavelengthNm / wavelengthLabel
filter
exposureSeconds
pixelScaleArcsecPerPixel
processingLevel
quality
freshness / staleAfterUtc
sourceUrl
attribution
license
useNotes
imageUrl / tilesUrlTemplate / streamUrl
notes[]
```

Rules:

1. `requestedAtUtc` is the application request instant, not a claimed shutter time.
2. `capturedAtUtc` is provider-reported when available. `null` is honest; it is never inferred from a file name or server receive time.
3. `receivedAtUtc` is recorded by the server adapter when it receives provider metadata.
4. `wavelengthNm`, filter, exposure, pixel scale and processing level are provider metadata. Missing values stay missing.
5. `freshness` is computed only from a documented provider timestamp/deadline. Archival records use `not-applicable`, not a fake “live” badge.
6. `sourceUrl` is an attribution/metadata link. The UI image URL is a same-origin gateway URL.
7. `license`, `attribution`, and `useNotes` are separate fields. A NASA or ESA domain name alone does not establish unrestricted commercial reuse.
8. `notes[]` carries provider caveats such as EUV false colour, watermarks, dimensions, timestamp limits, or calibration status.

## 6. HTTP and caching architecture

### Browser path

```text
local canvas + selected target + zoom >= 2.15×
        |
        | same-origin fetch
        v
/api/observatory/live?kind=planet&id=Sun&date=...
        |
        | validate target; call adapter; normalize metadata
        v
JSON metadata + /api/observatory/live/frame?... + optional tile template
        |
        | ordinary HTTP image bytes, CDN/object cache eligible
        v
Reality layer image and metadata grid
```

### Server responsibilities

- Validate known planet/star/constellation/event ids and reject arbitrary upstream URLs.
- Keep provider credentials, API tokens and gateway addresses server-side.
- Fetch Helioviewer/NASA data through adapters with explicit timeouts and bounded payload sizes.
- Cache metadata for a short period and image/tile bytes separately. Current defaults are short-lived metadata, two-minute frame cache, and five-minute tile cache with stale-while-revalidate hints.
- Preserve source/provider metadata even when a CDN/object store is introduced.
- Return a provider error or honest no-frame response while retaining the local calculation fallback.
- Rate-limit production routes, add request tracing and provider health metrics, and apply an allowlist to every new adapter.

The current frame gateway uses Next route handlers and upstream allowlists. A production deployment can move approved bytes into object storage/CDN without changing the `LiveFrameMetadata` contract. The browser should not receive raw provider hotlinks as its rendering source.

### High-performance rule

- Use Canvas/WebGL only for the local calculated sky and local overlays.
- Use tiled HTTP/CDN imagery for zoomable solar/reference frames.
- Use SSE/WebSocket for low-rate provider status, queue progress, and frame metadata.
- Use WebRTC only when a genuine low-latency user-camera stream is available and authorized.
- Use MCP for semantic context, planning, provenance and explicitly authorized operations—not for image/video bytes, tile fan-out, or 30 fps camera transport.

The first implementation already includes a server-side tile route so a future solar viewer can request only the tiles in view instead of repeatedly downloading a full image. The panel currently uses a bounded screenshot for a simple, honest comparison surface.

## 7. Local observatory agent seam

Recommended deployment:

```text
CosmicTantra browser
  -> authenticated HTTPS/WebSocket/WebRTC session
CosmicTantra live gateway
  -> provider adapter + safety policy + audit log
Trusted observatory agent (same LAN / Raspberry Pi / Windows host)
  -> ASCOM Alpaca and/or INDI
Mount / camera / focuser / dome / weather interlocks
```

The agent contract should expose:

- read-only equipment discovery/status;
- current mount coordinates and tracking state;
- camera readiness, sensor dimensions, binning, gain, filter and temperature;
- latest frame metadata and a bounded preview path;
- weather/safety/interlock state;
- an explicit observation plan that can be reviewed before any action.

It must not expose a raw LAN proxy. The server should maintain an allowlisted device identity, authenticated gateway session, per-observation quota, and audit event. Every image should carry equipment, UTC capture/receive times, filter, exposure, calibration/processing, pixel scale when known, and user/owner attribution.

### Control safety defaults

`src/lib/observatory/live/safety.ts`, `/api/observatory/live/request`, and the read-only `/api/observatory/agent/status` bridge currently fail closed:

- mount movement: disabled by default;
- camera exposure requests: disabled by default;
- dome control: disabled by default;
- weather overrides: disabled by default;
- explicit per-action user authorization required;
- authenticated actor required;
- durable audit request id required;
- provider interlocks still required even after policy checks pass.

An environment flag or future deployment configuration must never be treated as sufficient authorization by itself. Enabling a provider requires a reviewed authentication, audit, emergency-stop, weather, horizon-limit, collision-limit, and failure-recovery design.

## 8. MCP integration boundary

MCP is useful here as an AI/control-plane integration. It is not a high-throughput transport.

The official SDK-backed stateless endpoint is:

```text
POST /api/observatory/mcp
```

It registers:

- `resolve_target` — read-only target validation and provider capabilities;
- `get_observatory_status` — provider matrix, safety summary and transport boundary;
- `get_latest_frame` — provider frame **metadata** plus a normal HTTP transport URL, never image bytes in MCP content;
- `explain_frame_provenance` — provider/attribution/licensing/processing explanation;
- `plan_observation` — existing approximate local horizon cue, including the Rahu/Ketu physical-node exception;
- `request_exposure` — an explicit locked seam that returns `DISABLED_BY_DEFAULT` and sends no command.

The route supports an optional `OBSERVATORY_MCP_BEARER_TOKEN`. A production deployment should place it behind proper authentication, origin policy, rate limits, observability and a gateway; the token is not committed to the repository. Read-only MCP responses can include an absolute same-origin HTTP frame URL for an authorized client, but the MCP channel is still not the frame transport.

Future privileged MCP exposure planning should be two-phase:

1. AI proposes a target, time, filter, exposure and expected provider/cost.
2. A human-authenticated UI confirms the exact plan; the server records an audit id, checks visibility/weather/interlocks/quota, and only then dispatches a provider adapter.

No MCP tool may directly unlock arbitrary mount movement, dome opening, weather override or an unauthenticated camera stream.

## 9. Attribution, licensing and third-party risks

Before ingesting or caching any external asset, retain an item-level rights record:

- exact source URL and provider;
- retrieval date and checksum/object key;
- capture date and metadata source;
- credit line and required attribution;
- license or service policy URL and commercial-use status;
- watermark/logo/brand/endorsement restrictions;
- third-party photographer, presenter, music, image-processing or archive rights;
- whether derivative crops, thumbnails, tiles, color changes, annotations and CDN redistribution are allowed;
- takedown/contact process and fallback behavior.

Specific risk reminders:

- NASA/SDO: “NASA” does not erase third-party contractor, instrument-team, logo, endorsement, or mission-specific restrictions. Check the individual image/data policy and retain the required credit.
- Helioviewer: API access and a public endpoint do not automatically grant permission to mirror a large image corpus. Keep Helioviewer/provider attribution and verify current terms before commercial caching; watermark behavior should not be removed casually.
- LCO: account/proposal/archive and program data rights apply. A successful API response is not a blanket commercial license.
- MicroObservatory: educational availability does not by itself define redistribution rights for every resulting image or partner asset.
- Virtual Telescope: session video, photographer credit, logo, recordings and commercial embedding require provider permission.
- ASCOM/INDI: protocol/software licenses are separate from the user’s captured images, camera driver rights and equipment-owner permission.
- ISRO, Roscosmos, ESA/ESO, JPL/NAIF and related agencies: retain the existing link-out inventory and review every asset, logo, map, model and dataset at item level. Do not imply agency endorsement.

The repository-owned inline SVG artwork remains the local field-note fallback and is not represented as scientific imagery.

## 10. Qualification and test evidence

Automated coverage added for this seam is in `tests/observatory.spec.ts`:

- target normalization for planets, stars, events and invalid ids;
- public-provider capability matching, including Sun-only NASA/Helioviewer behavior;
- local calculation descriptor and explicit no-frame response;
- Helioviewer response validation and source URL construction;
- server-side frame/tile path construction;
- NASA fallback capture-time null behavior;
- safety policy fail-closed behavior and audit requirement;
- server-side Alpaca/INDI agent URL validation, redacted configuration and read-only status parsing.

Current validation record:

```text
npx playwright test tests/observatory.spec.ts --reporter=line
29 passed
```

```text
npm run typecheck
blocked only by the pre-existing generated Prisma client error:
src/lib/db.ts(1,10): Module "@prisma/client" has no exported member 'PrismaClient'
```

The local dev smoke check returned HTTP 200 for:

- `/api/observatory/live` with a physical non-Sun target;
- `/api/observatory/live` with Sun target (provider network availability determines whether Helioviewer or NASA fallback metadata is returned);
- `/api/observatory/live` with a catalogue star;
- the MCP `initialize`, `tools/list`, `resolve_target`, and locked `request_exposure` calls.

Chromium remains unavailable for full browser interaction, canvas zoom, responsive layout, and actual image-load QA. Prisma engine/build setup remains outside this slice. The Observatory qualification therefore remains **CONDITIONAL PASS**, with the existing blockers still active:

- **BLOCKER-1:** documented Moon engine discrepancy of **1.135216°**; no sub-degree lunar claim.
- **BLOCKER-2:** reviewed JPL Horizons reference fixture is missing; run `npm run reference:generate` in a networked review environment before advertising reference-checked precision.

## 11. Implementation sequence for the next adapters

### P0 — harden the current solar layer

1. Add provider health, timeout and rate-limit telemetry.
2. Confirm Helioviewer screenshot/tile terms, watermark and production cache policy.
3. Add a bounded image CDN/object-store cache with a rights record.
4. Record a provider response fixture for adapter tests without pretending it is an ephemeris reference fixture.
5. Add a true tiled solar comparison viewer that keeps local sky and mission image in separate panes.

### P1 — public/partner remote exposures

1. Choose one provider with explicit API/data-use permission and an account/proposal model.
2. Implement a server-side adapter for target resolution, visibility, request validation, queue state, status polling, result metadata and archive retrieval.
3. Persist request/audit state; never put credentials or private archive URLs in the browser.
4. Mark every request `queued`, `capturing`, `received`, `failed`, or `archival`, and display expected latency.
5. Add cancellation/timeout/quota behavior and a local calculated fallback.

### P2 — user-owned equipment

1. Ship a separately deployable gateway/agent, not browser LAN discovery.
2. Implement read-only Alpaca/INDI status first.
3. Add a preview path with bounded frame rate/resolution and server-side authorization.
4. Add explicit human-confirmed exposure plans and audit records.
5. Add weather, sun-altitude, dome, collision, cable-wrap, mount-limit and emergency-stop interlocks before any movement/exposure action.
6. Add WebRTC only if the user’s hardware and network justify true low-latency streaming; otherwise use HTTP latest-frame plus SSE status.

## 12. Non-negotiable product language

Use:

- “Local calculated sky” for the current stereographic instrument.
- “Near-real-time NASA SDO/Helioviewer mission image” when the Sun adapter returns a provider frame.
- “Queued remote exposure” for a request not yet captured.
- “User telescope camera” only when an authenticated gateway has actually supplied the frame.
- “Archival/reference image” for historical or study media.
- “No provider frame available” when no capability exists.

Do not use:

- “Live telescope view” for a static illustration, archive image, queued request, facility webcam, or a provider frame with unknown capture time.
- “Zoom into the star” when the browser is only magnifying a calculated point.
- “Real-time sky” when the local model is approximate or the provider image is in another wavelength/frame.
- “NASA approved” or “agency endorsed” without written permission.

The ambition remains a primary astronomy/Jyotish study companion. Trust comes from putting the source, frame, epoch, capture/receive times, uncertainty and provider limitations beside the beautiful view—not from hiding the boundaries.
