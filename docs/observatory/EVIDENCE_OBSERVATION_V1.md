# Observatory implementation note — Evidence-backed Observation + Student Desk v1

**Implementation date:** 26 August 2026 (Asia/Calcutta)
**Status:** local/offline implementation slice; qualification remains **CONDITIONAL PASS**

This note records what is implemented after the strategic review in [`WORLD_CLASS_ROADMAP.md`](./WORLD_CLASS_ROADMAP.md). The roadmap remains the blueprint and external-source inventory. This file records the shipped seam between the existing local instruments and future reviewed reference/media layers without duplicating source code.

## What changed

- The existing local Observatory sky renderer now has a bounded display-only viewport. Pointer drag, wheel zoom, pinch zoom, double-click zoom, `+`/`−`, arrow-key pan, `R`/`0` reset, a numeric zoom readout, and target-aware hit testing are available in [`SkyCanvasRenderer.tsx`](../../src/components/observatory/SkyCanvasRenderer.tsx).
- The ecliptic planisphere has the same interaction model in [`EclipticInstrument.tsx`](../../src/components/observatory/EclipticInstrument.tsx). The tropical ring, sidereal/Nakshatra reading and canonical graha values remain calculated exactly as before; the viewport only changes pixels on screen.
- Both Gochara rashi wheels are navigable with the reusable controls in [`CanvasViewControls.tsx`](../../src/components/observatory/CanvasViewControls.tsx). The wheel is still a sidereal comparison surface, not a physical solar-system scale diagram.
- Bright-star names and magnitudes progressively appear in the local sky at higher zoom. The DOM rails, planet selectors, constellation select, and `SkyAtAGlance` cards remain the accessible alternative to canvas targeting.
- [`observation.ts`](../../src/lib/astronomy/observation.ts) provides deterministic, explicitly approximate solar events, twilight state, lunar phase, compass direction, altitude bands, angular separation, sampled horizon crossings and selected-body observation plans. It uses the same canonical body and horizontal-coordinate path as the sky instrument.
- [`ObservatoryStudentDesk.tsx`](../../src/components/observatory/ObservatoryStudentDesk.tsx) is integrated into the main `/observatory` route. It combines field planning, twilight, Moon phase, approximate next horizon crossing, Moon separation, tropical/sidereal study context, rashi/Nakshatra/pada, reading guidance and optional official study links. External sources are links only; they are not runtime calculation dependencies.
- [`CelestialDetailSheet.tsx`](../../src/components/observatory/CelestialDetailSheet.tsx) now exposes a provenance block with quality, frame, local provider/model, epoch context, fixture status, and explicit physical-node semantics. The known lunar qualification discrepancy is visible for the Moon rather than hidden behind extra decimals.

## Design rationale

### A camera, not a second ephemeris

`viewTransform.ts` is deliberately pure and display-only. It clamps scale and pan, zooms around a pointer/focus point, and maps calculated canvas coordinates to screen coordinates. No zoom or pan state is passed into the astronomy calculations. This prevents a visually closer object from being mistaken for a more accurate position.

The background remains fixed while the calculated scene is transformed. Drawn hit targets are transformed by the same matrix and their minimum hit areas are enlarged with the view, so inspection does not break selection. Keyboard and DOM controls provide a non-canvas route to the same functions.

### Astronomy and Jyotish remain separate lenses

The local model continues to calculate tropical ecliptic values first. Lahiri sidereal longitude, rashi, Nakshatra and pada are derived and labelled separately. Rahu and Ketu remain mean mathematical lunar nodes: they have longitude and sidereal descriptors but no physical distance, surface, altitude or azimuth claim.

### Planning signals are not almanac claims

Solar events and selected-body horizon events are sampled from the local canonical body path and horizontally converted at a ten-minute step, then linearly interpolated across threshold crossings. The result is useful for a teaching field briefing, but it does not model refraction, terrain, obstruction, clouds, light pollution, brightness, or a reviewed almanac. Rahu/Ketu are excluded from physical horizon planning. Moon separation is a bounded RA/declination teaching signal, and Moon phase is a Sun–Moon longitude teaching signal; neither is sub-degree lunar evidence.

### A reference seam that fails closed

The shared provider vocabulary in [`src/lib/astronomy/providers/types.ts`](../../src/lib/astronomy/providers/types.ts) separates provider, model, frame, epoch, observer, quality and error budget. [`localApproximation.ts`](../../src/lib/astronomy/providers/localApproximation.ts) adapts the existing canonical body calculation without changing its values or adding a network request. [`referenceFixture.ts`](../../src/lib/astronomy/providers/referenceFixture.ts) validates a future reviewed fixture and rejects incomplete/draft data; absent data resolves to a visible `BLOCKER-2` status rather than a false reference-checked badge. The generator scaffold now supports both geocentric and deliberate topocentric Horizons drafts, while raw output remains review-only until quantities are parsed and manually checked.

### Provenance before media

The Student Desk links to NASA Images, Solar System Treks, ISRO, JPL Horizons, NAIF SPICE and ESA/Hubble as optional study sources. Nothing is scraped, hotlinked into the canvas, or required for the page to render. Any future downloaded image, video, model, tile or reference fixture must first enter the rights/provenance workflow in the roadmap: exact source page, credit, license/policy, third-party/logo/person review, retrieval date, checksum and fallback behavior.

## File map

- [`src/lib/astronomy/viewTransform.ts`](../../src/lib/astronomy/viewTransform.ts) — pure scale/pan/focus math and clamping.
- [`src/lib/astronomy/observation.ts`](../../src/lib/astronomy/observation.ts) — local approximate observation planning helpers, horizon windows, angular separation, twilight state, Moon phase, compass directions and altitude bands.
- [`src/lib/astronomy/providers/`](../../src/lib/astronomy/providers/) — shared ephemeris/provenance types, local adapter, and fail-closed reference-fixture parser; no fixture is bundled yet.
- [`src/components/observatory/CanvasViewControls.tsx`](../../src/components/observatory/CanvasViewControls.tsx) — accessible zoom/percentage/reset controls.
- [`src/components/observatory/SkyCanvasRenderer.tsx`](../../src/components/observatory/SkyCanvasRenderer.tsx) — local stereographic sky, progressive labels, interaction and target mapping.
- [`src/components/observatory/EclipticInstrument.tsx`](../../src/components/observatory/EclipticInstrument.tsx) — tropical ecliptic/rashi/Nakshatra planisphere and interaction.
- [`src/components/observatory/Gochara.tsx`](../../src/components/observatory/Gochara.tsx) — natal/current sidereal wheels with the same camera controls.
- [`src/components/observatory/SkyAtAGlance.tsx`](../../src/components/observatory/SkyAtAGlance.tsx) — semantic physical-graha readout with altitude, azimuth, direction and sky band.
- [`src/components/observatory/ObservatoryStudentDesk.tsx`](../../src/components/observatory/ObservatoryStudentDesk.tsx) — integrated astronomy/Jyotish student briefing and link shelf.
- [`src/components/observatory/CelestialDetailSheet.tsx`](../../src/components/observatory/CelestialDetailSheet.tsx) — selected-object artwork, coordinate details, provenance and links.
- [`tests/observatory.spec.ts`](../../tests/observatory.spec.ts) — existing astronomy invariants plus viewport, observation-helper and Moon-phase tests.

## Source and rights posture

No external asset was added to the repository in this slice. The links in the Student Desk are link-outs for study and discovery, not a claim that CosmicTantra may copy or commercially redistribute every item behind them.

Before future ingestion:

- use the exact item-level credit and license/policy, not only the agency name;
- flag third-party material, identifiable people, logos/marks, music, endorsement language and commercial-use restrictions;
- keep provider/source, credit, license and “calculated by CosmicTantra” as separate labels;
- cache approved files through an allowlisted build/editorial process rather than depending on a live source site;
- retain a local vector/artwork and metadata fallback if media, WebGL, tiles or a provider is unavailable.

The detailed NASA, ISRO, Roscosmos, ESA/ESO, JPL and NAIF inventory and risk notes remain in [`WORLD_CLASS_ROADMAP.md`](./WORLD_CLASS_ROADMAP.md). Roscosmos is still link-out/permission-sensitive; ISRO and NASA assets still require item-level review; explicit Creative Commons markings do not remove attribution or logo obligations.

## Validation record

- `npx playwright test tests/observatory.spec.ts` — **22 passed**. This includes canonical astronomy invariants, Rahu/Ketu node semantics, viewport focus/clamping behavior, local solar event signals, altitude/direction helpers, bounded Moon phase output, sampled horizon-crossing and angular-separation planner signals, the local provider adapter, and fail-closed reference-fixture validation.
- `npm run typecheck` — **blocked only by the pre-existing Prisma setup issue:** `src/lib/db.ts(1,10): Module "@prisma/client" has no exported member 'PrismaClient'` in the generated-client-free environment. No Observatory implementation type errors were reported.
- `npm run dev -- --hostname 0.0.0.0` plus HTTP checks — `/observatory`, `/observatory/ecliptic`, `/observatory/timemachine` and `/observatory/gochara` returned HTTP 200 with representative city/time/planet links. The unrelated analytics API still reports the known missing generated Prisma client.
- Full browser interaction/responsive QA remains dependent on Chromium availability. The qualification guardrail remains **CONDITIONAL PASS**.

## Qualification guardrails that remain in force

- **BLOCKER-1:** current qualification records a **1.135216° Moon engine discrepancy**.
- **BLOCKER-2:** no reviewed JPL Horizons fixture is committed; `npm run reference:generate` still requires a networked qualification run and manual epoch/frame review.
- The local ephemerides are deterministic, low-precision educational approximations. No JPL-grade, sub-degree lunar or complete-Jyotish claim is made.
- Gochara is a computational natal/current sidereal comparison, not a complete Jyotish judgement.
- Future media, surface, mission and 3D layers must enrich—not replace—the local sky, ecliptic, Time Machine and Gochara instruments.
