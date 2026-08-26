# CosmicTantra Observatory — World-Class Review and Next-Step Roadmap

**Review date:** 26 August 2026 (Asia/Calcutta)
**Review scope:** the existing local sky, ecliptic, Time Machine, Gochara, deep-link, artwork, and qualification work
**Document status:** strategic baseline; no NASA, ISRO, Roscosmos, media, tile, 3D or external-reference implementation has been added. The local viewport, observation, Student Desk and provenance slice is recorded in [`EVIDENCE_OBSERVATION_V1.md`](EVIDENCE_OBSERVATION_V1.md).

> **Recommendation in one sentence:** build an **Evidence-backed Observation Layer v1** before building a large media catalogue or a full 3D solar system. It should add a frozen precision-reference path, a true zoomable/deep-inspection model, and a shared provenance contract across all four existing instruments.

This is the shortest path from a good deterministic visualization to a trustworthy, memorable observatory. It improves the current product for every route, creates the seam where images, videos, surface tiles, mission data, and 3D objects can later attach, and does not weaken the existing local computation or make the browser depend on an external service.

---

## 1. Executive decision

### Current verdict

The Observatory is already a credible product foundation rather than a placeholder:

- `/observatory` has a real zenith-centred stereographic local-sky projection;
- `/observatory/ecliptic` has a real ecliptic/rashi/Nakshatra planisphere;
- `/observatory/timemachine` provides a time inspection surface;
- `/observatory/gochara` provides a natal/current sidereal comparison;
- Rahu and Ketu are supported as calculated mathematical lunar nodes;
- city, time, and optional object context survive deep links;
- the shared detail sheet, accessible DOM controls, source labels, and practical sky readout give the suite a coherent interaction model;
- the current browser experience is deterministic and does not require a live astronomy API.

It is **not yet world-class** because its visual richness and scientific depth stop at the first layer. A user can see a calculated point, but cannot yet progressively inspect the field, verify the reference path, explore a body surface, follow a mission, or understand the provenance of a scientific image without leaving the product.

### The one next milestone

## Evidence-backed Observation Layer v1

**Goal:** make every selected object inspectable at two levels:

1. **Observation:** where is it in this sky, from this city, at this instant?
2. **Evidence:** which model, frame, epoch, source, fixture, and limitations produced that answer?

The milestone has three tightly coupled deliverables:

1. **Precision reference adapter** — generate and review a small JPL Horizons comparison fixture, define body-specific error budgets, and keep the local approximation as the deterministic fallback.
2. **Zoomable inspection viewport** — add pan, zoom, reset, keyboard controls, target-aware hit testing, grid/label density, and a selected-object field-of-view mode to the existing local sky and ecliptic canvases.
3. **Shared provenance contract** — show model/provider/frame/epoch/quality information in the detail sheet on all four routes, with a clear distinction between physical bodies and mathematical nodes.

This is one product milestone, not three unrelated features. A zoomed view without evidence invites false precision; an evidence drawer without useful inspection feels like paperwork; a 3D object before either is mostly decoration.

### Explicitly not in this milestone

- no browser-time dependency on JPL Horizons;
- no automatic scraping of NASA, ISRO, or Roscosmos sites;
- no hotlinked mission video as a required render dependency;
- no full solar-system 3D scene;
- no claim of JPL-grade accuracy until the fixture and error policy are reviewed;
- no replacement of the existing local sky, ecliptic, Time Machine, or Gochara instruments;
- no change to the mathematical-node treatment of Rahu and Ketu;
- no complete Jyotish judgement generated from Gochara.

---

## 2. Assessment against a world-class astronomy product

| Dimension | Current level | What is strong | What prevents a world-class rating | Next response |
| --- | --- | --- | --- | --- |
| Coordinate geometry | Strong foundation | Real local horizontal conversion, precession, stereographic projection, ecliptic sampling, and separate tropical/sidereal display | Compact low-precision ephemerides, limited star catalogue, no frozen external reference fixture | Add the reference adapter and visible error/quality metadata |
| Scientific trust | Transparent but conditional | Sources and model names are shown; known limitations are documented rather than hidden | Moon discrepancy of **1.135216°**; no committed Horizons fixture; no body-specific tolerance table | Close or explicitly govern the two qualification blockers |
| Direct field usefulness | Good early utility | Altitude, azimuth, compass direction, horizon status, best-placed object, copyable readout, twilight state, Moon phase/separation, approximate sampled horizon crossing, local JSON/CSV notebook, and city/time links | No refraction, terrain, clouds, light pollution, brightness model, precision rise/set/transit scheduler, telescope field of view, or custom observer | Add reviewed precision observation planning after the reference layer |
| Interaction | Coherent | Shared `CelestialSelection`, accessible rails/selects, target priority, responsive detail sheet, shareable context | Canvas is effectively a fixed viewport; no pan/zoom, measurement, or progressive detail | Build the zoomable inspection viewport |
| Educational clarity | Good foundation | Astronomy and Vedic lens are separated; node semantics are explicit; tours can reuse the detail contract | No guided sequence, source-linked media, mission context, comparison mode, or learner progress | Add curated tours after provenance exists |
| Visual identity | Distinctive | Original inline SVG artwork, constellation diagrams, dark/gold/violet visual language, no initial remote image failure | Artwork is interpretive and not a substitute for real images, textures, terrain, or instrument data | Add evidence-labelled media as a second layer, not a replacement |
| Planetary depth | Not started | The body contract already has a natural selected-object entry point | No globe, surface map, elevation, lighting, feature metadata, mission site, or 3D model | Add a Moon/Mars surface atlas after the shared viewport |
| Mission context | Not started | The current time and object model can anchor a mission timeline | No spacecraft metadata, trajectories, footprints, landing sites, or mission media | Add one mission vertical slice rather than a generic archive |
| Resilience/performance | Strong design direction | Local calculations, bounded device-pixel ratio, resize-aware canvas, no live render-time API | Large imagery and 3D assets could easily reverse this advantage | Use an allowlisted, cached asset pipeline and lazy loading |
| Accessibility | Promising | DOM alternatives, focus lifecycle, keyboard sheet behavior, role labels, reduced-motion handling | Canvas details are not a fully semantic object tree; no tested zoom/measurement alternative yet | Make every visual operation available through controls and a data table |

### Product conclusion

The Observatory should be described today as a **transparent educational and operational visual instrument**. It should not be presented as a precision ephemeris authority, a complete observability planner, or a complete Jyotish judgement engine.

The existing design decision to keep tropical astronomy geometry and sidereal interpretation visibly separate is a competitive trust advantage. The next milestone should amplify that advantage instead of hiding it under cinematic effects.

---

## 3. Why the evidence layer comes before 3D and media

A world-class experience is not the one with the most assets. It is the one where the user can answer four questions without losing context:

1. **What am I looking at?**
2. **How far can I zoom before the content changes category?**
3. **Where did this position, image, tile, or model come from?**
4. **What does it not claim?**

The current Observatory answers the first question and part of the fourth. Evidence-backed Observation Layer v1 supplies the second and third.

It also creates reusable infrastructure:

- one selected object can open a field view, a coordinate readout, an image, a video, a surface atlas, or a mission timeline;
- each route can consume the same `ObservationContext` and `ProvenanceRecord` rather than inventing its own source language;
- a failed external service becomes a missing optional layer, not a broken observatory;
- asset licensing can be reviewed before it becomes UI content;
- the Time Machine can eventually use sampled reference positions instead of implying physically linear motion.

---

## 4. Proposed contracts and architecture

These are proposed interfaces for the next implementation. They are not present in the repository yet.

### 4.1 Observation context

```ts
type ObservationContext = {
  cityId: string;
  observer: {
    latitudeDeg: number;
    longitudeDeg: number;
    elevationM?: number;
    timezone: string;
  };
  instantUtc: string;
  frame: 'of-date-horizontal' | 'of-date-equatorial' | 'tropical-ecliptic' | 'sidereal-ecliptic';
};
```

The current city/time deep-link contract remains the source of truth. A future custom observer may add coordinates, but it must never silently replace the selected city in a shared link.

### 4.2 Ephemeris result

```ts
type EphemerisResult = {
  body: CanonicalBodyName;
  longitudeDeg: number;
  latitudeDeg: number;
  rightAscensionHours?: number;
  declinationDeg?: number;
  distanceAu?: number;
  provider: 'local-approximation' | 'jpl-horizons-fixture' | 'spice-derived';
  model: string;
  epochUtc: string;
  frame: string;
  observer: string;
  quality: 'illustrative' | 'reference-checked' | 'mission-archive';
  errorBudget?: {
    longitudeDeg?: number;
    latitudeDeg?: number;
    raArcsec?: number;
    decArcsec?: number;
  };
  sourceUrl: string;
  fixtureId?: string;
};
```

The UI should display `quality` and `model` as data, not as marketing decoration. A reference-checked result still needs an epoch/frame/observer label.

### 4.3 Asset provenance

```ts
type ProvenanceRecord = {
  assetId: string;
  title: string;
  kind: 'image' | 'video' | 'audio' | 'texture' | 'tile-set' | 'model' | 'data';
  sourcePage: string;
  sourceFile?: string;
  provider: string;
  creditLine: string;
  license: 'public-domain' | 'cc-by-4.0' | 'cc-by-sa-3.0-igo' | 'godl-india' | 'provider-policy' | 'permission-required' | 'unknown';
  licenseUrl: string;
  commercialUse: 'allowed-with-conditions' | 'non-commercial-only' | 'permission-required' | 'unknown';
  thirdPartyContent: boolean;
  identifiablePeople: boolean;
  logoOrMark: boolean;
  localObjectPath?: string;
  sha256?: string;
  retrievedAt: string;
  reviewedAt: string;
  reviewNote: string;
};
```

A source label is incomplete if it contains only `NASA` or `ISRO`. It should include the exact page/asset credit and license interpretation.

### 4.4 Runtime source precedence

1. Use the local deterministic model immediately.
2. If a reviewed frozen fixture covers the instant/body, expose its comparison and quality label.
3. Load optional reviewed media or 3D content only after the object is selected.
4. If an optional asset fails, retain the local position, vector artwork, metadata, and source note.
5. Never make the primary sky canvas wait for a media API, image CDN, tile server, WebGL bundle, or third-party cookie.

---

## 5. Open and free source inventory

“Free online” has at least four meanings: free to view, free to download, free to reuse under a license, and safe to use commercially. They are not interchangeable. The following inventory separates the useful source from the rights decision.

### 5.1 NASA and NASA/JPL/NAIF

| Need | Candidate | What it can provide | Rights/reliability treatment | Recommendation |
| --- | --- | --- | --- | --- |
| Images and videos | [NASA Image and Video Library](https://images.nasa.gov/) and its [API documentation](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf) | Search, asset manifests, metadata, captions, images, and video files | Excellent discovery surface, but inspect the item credit; the API does not replace a rights review. Do not use a live API call as a render dependency. | Use for a build-time/editorial importer and provenance records |
| Scientific animations | [NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/) | Mission animations, data visualizations, stills, frame sequences, video, captions/transcripts | SVS says its content is public domain unless an item says otherwise; licensed music may need to be removed or separately cleared. Individual pages can contain third-party imagery. | Strong first media source; prefer captioned MP4/WebM with an item-specific credit |
| 3D models and textures | [NASA 3D Resources](https://nasa3d.arc.nasa.gov/models) and the [NASA 3D Resources GitHub mirror](https://github.com/nasa/NASA-3D-Resources) | Spacecraft, planets, scientific visualizations, textures, and printable models | The repository describes these resources as free to download and use. Still review the individual page, embedded marks, third-party contributor, and NASA brand restrictions before shipping. | Best source for a lazy-loaded spacecraft/planet model library |
| Planet texture starter | [NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) and [NASA Sun 3D model](https://science.nasa.gov/learn/heat/resource/sun-3d-model/) | Low/medium resolution globe textures, displacement maps, and a Sun model suitable for educational rendering | Use the page credit and inspect the specific files. A texture is not a survey-grade measurement surface merely because it is high resolution. | Use as the first reviewed globe material, not as a local-sky background |
| Planetary surface maps | [NASA Solar System Treks](https://trek.nasa.gov/) — especially [Moon Trek](https://trek.nasa.gov/moon/) and [Mars Trek](https://trek.nasa.gov/mars/) | High-resolution map layers, 2D and 3D globe exploration, elevation/lighting tools, feature search, mission context, and OGC tile-service patterns | This is an excellent model for the experience. Tile-service terms, attribution, layer provenance, rate limits, and redistribution rights must be checked before copying or proxying tiles. A public map portal is not automatic permission to mirror every layer. | Use as a data-discovery and tile-contract reference; begin with a small reviewed/offline area of interest |
| Earth/context layers | [NASA GIBS access documentation](https://nasa-gibs.github.io/gibs-api-docs/access-basics/) | OGC WMTS/WMS/TWMS/TMS time-aware Earth imagery and scientific overlays | Useful for an optional “Earth from the observer” context panel, not for planets or stars. Cache selected layers or snapshots and show the data date/layer name. | Later P1/P2 context layer; never mix Earth data into sky geometry |
| Precision ephemerides | [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) and the [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) | Observer ephemerides, vectors, elements, topocentric coordinates, apparent/airless options, rise/transit/set filters, time/frame controls, and CSV output | Scientific reference source, not a browser dependency. Queries must record center, geodetic coordinates, time scale, reference frame, refraction setting, quantities, and version/date. | Use to create small reviewed fixtures and periodic server-side snapshots |
| Mission/planet geometry | [NAIF generic kernels](https://naif.jpl.nasa.gov/naif/data_generic.html), [SPICE documentation](https://naif.jpl.nasa.gov/naif/) | Planet/satellite ephemerides, planetary constants, leap seconds, Moon frames, station locations, shape kernels, and star catalogue material | Data provenance and kernel version matter. Binary kernels can be large and are not appropriate for an initial browser bundle. | Preprocess on a maintenance job or server; ship only the derived slices needed by a selected mission/body |
| Archived mission imagery/data | [NASA PDS Imaging Node](https://pds-imaging.jpl.nasa.gov/) and [PDS holdings](https://pds-imaging.jpl.nasa.gov/holdings/) | Calibrated/raw planetary images, ancillary data, mosaics, rover products, and mission archives, including Chandrayaan-1 holdings | PDS is an excellent scientific archive, but individual product documentation and contributing-agency rights still matter. Raw formats need a conversion pipeline. | Use for reviewed derived tiles, selected mission images, and metadata—not wholesale client downloads |

NASA’s official media guidance says NASA content used in images, audio, video, and 3D-rendering files is generally not subject to U.S. copyright for educational/informational use, while third-party content, identifiable people, NASA marks, and implied endorsement remain important restrictions. Therefore the implementation should treat **NASA-native, unmarked media as “usable with conditions,” not as an unreviewed universal public-domain bucket**. See [NASA’s media guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) before each publication decision.

### 5.2 ISRO and Indian government sources

| Need | Candidate | What it can provide | Rights/reliability treatment | Recommendation |
| --- | --- | --- | --- | --- |
| Mission images and video | Official [Aditya-L1 gallery](https://www.isro.gov.in/AdityaL1_gallery.html), [Aditya-L1 videos](https://www.isro.gov.in/Aditya_L1_videos.html), [Chandrayaan-3 gallery](https://www.isro.gov.in/chandrayaan3_gallery.html), and [Chandrayaan-3 videos](https://www.isro.gov.in/Ch3_Video_Lunar_Orbit_Insertion.html) | Indian mission context, spacecraft/landing footage, payload explainers, lunar and solar observations | ISRO’s [copyright policy](https://www.isro.gov.in/Copyright_Policy.html) allows reproduction of DOS/ISRO material with accurate, non-misleading/non-derogatory use and prominent source acknowledgement, but explicitly excludes material identified as third-party. Check each mission page and credit. | High-value editorial layer for CosmicTantra’s Indian identity; start with one Aditya-L1 or Chandrayaan-3 story after item-level review |
| Earth-observation maps | [Bhuvan](https://bhuvan.nrsc.gov.in/) and ISRO’s [space-based Earth-observation services](https://www.isro.gov.in/SpaceBasedEarthObservationServices.html) | Thematic layers, map visualization, query/analysis, selected free downloads, and geospatial context | Service availability and “free” status vary by product and output format; acknowledgement/MoU or registration can apply. This is Earth context, not stellar/planetary sky data. | Later “Earth beneath the sky” or observatory-site context mode |
| Meteorology/ocean data | [MOSDAC open data](https://www.mosdac.gov.in/open-data) | Derived land/ocean/atmosphere products and weather context | The open-data page describes free access for **non-commercial** use. Do not treat this as cleared for a monetized product without permission. | Use only for non-commercial or separately cleared observation-planning features |
| Earth-observation archive | [Bhoonidhi](https://bhoonidhi.nrsc.gov.in/bhoonidhi/index.html) and its policy/portal material | Search, visualization, open/priced products, satellite coverage, and in some cases APIs/STAC-style cataloguing | Resolution, user category, registration, product type, and Indian Space Policy conditions affect access. Open data is not a blanket license for every high-resolution product. | Use as a source of Indian Earth context and mission metadata; preselect and review products |
| Open government datasets | [Government Open Data License–India](https://jk.data.gov.in/godl) and [data.gov.in terms](https://www.data.gov.in/terms-of-use) | Shareable non-sensitive datasets, images, maps, metadata, and derived works where the dataset is published under the license | GODL-India requires attribution and non-endorsement and excludes logos/official symbols, sensitive data, and material the provider cannot license. Confirm the dataset page actually applies the license. | Safe foundation for explicitly licensed datasets, with a linked attribution register |

ISRO is therefore a **strong editorial and Indian Earth-observation partner source**, but its official website media should not be treated as an unqualified public-domain archive. The policy is encouraging; the individual credit, third-party marker, intended use, and commercial context still control the decision.

### 5.3 Roscosmos and Russian mission sources

| Need | Candidate | What it can provide | Rights/reliability treatment | Recommendation |
| --- | --- | --- | --- | --- |
| Official mission media | [Roscosmos media-use rules](https://www.roscosmos.ru/22650/) and official [information resources](https://www.roscosmos.ru/117/) | Mission images, video, launch footage, spacecraft/cosmonaut context, and Russian programme history | The published policy allows free use/distribution for purposes that do not imply direct or indirect commercial or political benefit, requires Roscosmos attribution, warns that some items are third-party, and restricts the Roscosmos logo. Commercial/political use needs permission or participation. | Link out or use only after written/item-level clearance. Do not make a commercial product depend on assumed Roscosmos permission |
| ExoMars surface imagery | [CaSSIS](https://www.cassis.unibe.ch/) and specific ESA/Roscosmos pages such as [this ESA video record](https://www.esa.int/esatv/Videos/2016/11/First_images_from_ExoMars) | High-quality Mars surface images, stereo context, and mission/video narrative | The specific CaSSIS material is published under CC BY-SA 3.0 IGO with the required credit; other imagery on the same ecosystem may have different rights. | Excellent candidate when the exact asset says CC BY-SA 3.0 IGO; store the complete credit and license URL |

**Decision:** Roscosmos should not be the first production dependency. It can become a respected optional mission chapter, but the product must remain correct and useful if the source site is unavailable or a permission status changes.

### 5.4 Additional reputable sources with clearer licensing

| Source | Why it helps | Rights note |
| --- | --- | --- |
| [ESA/Hubble copyright](https://esahubble.org/copyright/) | Visually exceptional deep-sky images, videos, and educational text | ESA/Hubble states that its materials are CC BY 4.0 with clear, visible, unaltered credit; its logo, music, scientific papers, and code are separate restrictions |
| [ESO copyright](https://www.eso.org/public/copyright/) | Ground-based astronomy imagery, observatory context, and science explanations | The public ESO material is generally CC BY 4.0 unless specifically noted, with visible credit; third-party and special educational collections can differ |
| [ESA open content terms](https://open.esa.int/image-usage-creative-commons/) | Mission images/video under an explicit CC BY-SA 3.0 IGO subset | Use only files explicitly marked with the license and preserve the license/credit; ESA’s corporate logo is not included |
| [USGS-NASA planetary mapping hub](https://astrogeology-usgs.hub.arcgis.com/) | Planetary maps, GIS layers, data downloads, and standard cartographic products | Inspect each product’s metadata and attribution; use as a scientific map source, not as a generic image scrape |
| [NASA PDS Image Atlas](https://pds-imaging.jpl.nasa.gov/search/) | Searchable mission image archive and product metadata | Product-level documentation and source credits remain part of the ingest record |

For a commercially cautious product, **NASA-native reviewed assets plus ESA/Hubble/ESO assets with explicit Creative Commons terms** are the best first media pool. ISRO should supply distinctive mission stories with clear credits. Roscosmos should be an explicitly cleared optional layer.

---

## 6. Asset licensing and ingestion rules

### 6.1 Rights classification

Use these internal labels in the asset register:

- **Green — reviewed for publication:** the exact file/page states public-domain or a compatible open license; credit and no-endorsement conditions are recorded; no unresolved third-party/logo/person issue.
- **Amber — usable only with conditions:** provider policy, non-commercial restriction, third-party credit, identifiable people, music, or service terms require a deliberate product decision.
- **Red — do not bundle:** permission is missing, the asset is marked third-party/copyrighted, the logo is the subject, or the proposed use exceeds the stated license.
- **Link-out only:** the product may reference the source page but will not copy, transform, cache, or require the asset at runtime.

“Free download” is not enough for Green. An asset needs a source page, a credit line, a license/policy URL, a retrieval date, and a note about third-party material.

### 6.2 Proposed repository/storage pattern

Do not put a multi-gigabyte planetary archive or every mission video in Git. Keep the small, auditable parts in the repository:

```text
docs/observatory/
  ASSET_REGISTER.md                  # human-readable rights and credit ledger
  assets/observatory-assets.json     # machine-readable reviewed metadata
  media/                              # only small approved posters or diagrams

public/observatory/
  posters/                            # responsive thumbnails/posters
  models/                             # only reviewed, size-bounded GLB/glTF files
  tiles/                              # only intentionally bundled small AOIs
```

Larger reviewed files should live in an object store/CDN with immutable versioned paths and a checksum in the asset register. The application should reference a local or controlled CDN path generated from the manifest, not a source website URL.

### 6.3 Ingestion pipeline

1. Select an asset from an official source page.
2. Save the exact page URL, file URL, title, credit, license, and retrieval date.
3. Check for third-party content, music, people, trademarks, and partner agencies.
4. Download only through an allowlisted maintenance script or editorial process.
5. Record the SHA-256 checksum and local/object-store path.
6. Generate a small poster/thumbnail and transcode video only when the license permits derivative processing.
7. Extract captions/transcripts; never ship a video without a text alternative where one exists.
8. Run malware/type/size checks and strip no attribution metadata unless a preservation copy remains.
9. Review the final crop, recolour, texture conversion, and model conversion for credit and derivative-work obligations.
10. Render a visible credit in the detail surface and link to a full provenance drawer.
11. Recheck volatile or conditional assets on a scheduled cadence.
12. Remove or disable an asset without affecting the local observation instrument if its terms change.

### 6.4 Video policy

Prefer, in order:

1. locally hosted reviewed MP4/WebM with captions and a poster;
2. a reviewed object-store copy with a stable versioned URL;
3. a source-page link-out;
4. an optional embed only if the provider’s terms and the product’s privacy/performance policy allow it.

Do not make YouTube, a NASA API, an ISRO page, or a Roscosmos site the only way to open a celestial detail sheet. A mission clip is enrichment, not the calculation engine.

### 6.5 Logos, endorsement, and UI language

- Use plain text such as “Source: NASA Scientific Visualization Studio” rather than placing a NASA insignia beside CosmicTantra branding.
- Do not use NASA, ISRO, ESA, ESO, or Roscosmos marks as if they are co-branding or endorsement.
- Keep “source”, “credit”, “license”, and “calculated by CosmicTantra” as separate labels.
- Do not call an asset “official CosmicTantra/NASA/ISRO” unless that relationship actually exists.
- Keep the current original-art label for `CelestialArtwork`; a real mission image should never silently replace it.

---

## 7. Zoom and deep-inspection model

### 7.1 Four progressive levels

#### Level 0 — orient

The current local-sky and ecliptic views remain the opening state:

- full horizon or full planisphere;
- cardinal directions, altitude rings, ecliptic, constellation lines, rashi/Nakshatra sectors;
- seven physical observing targets plus the nine-graha rail where appropriate;
- no invented detail merely because the viewport is large.

#### Level 1 — inspect the field

Add a display-only camera transform to the existing Canvas 2D renderer:

- zoom from 1x to a bounded field scale;
- zoom about the pointer, pinch midpoint, or keyboard focus target;
- pan only within a meaningful sky/planisphere boundary;
- `+`, `−`, `Reset view`, and a numeric zoom readout;
- target hit radii transformed with the same view matrix;
- progressively reveal star names, magnitude, coordinate grid, and local field-of-view indicator;
- keep a fixed screen-space minimum hit target so small stars do not become inaccessible;
- expose an accessible list/table of visible objects that does not require canvas hit testing.

The camera transform must never change the calculated RA/Dec, altitude/azimuth, longitude, rashi, or Nakshatra. It changes only how the same observation is viewed.

#### Level 2 — inspect the object

The selected-object sheet should add an **Evidence** block:

- calculation instant in UTC;
- city/observer coordinates and timezone source;
- coordinate frame and reference system;
- provider and model name;
- local vs reference-checked quality badge;
- epoch and fixture id;
- source URL and data version;
- body-specific error budget or “not yet benchmarked” label;
- apparent/airless/refraction state where relevant;
- physical body vs mathematical node status;
- what is not modelled: terrain, clouds, light pollution, atmosphere, or instrument limits.

For stars and constellations, include catalogue id, epoch, magnitude, colour index where available, and catalogue/source version.

#### Level 3 — inspect the body surface

A selected Sun, Moon, Mars, or mission object can open a separate **Surface Atlas** rather than trying to turn the local sky canvas into a planetary GIS viewer:

- low-resolution sphere first;
- high-resolution texture or tiles only after selection;
- visible phase/terminator and sub-solar point when the geometry supports it;
- coordinate grid and explicit longitude convention;
- layer toggles for albedo, elevation/hillshade, geology, temperature/ice, landing sites, rover traverses, or instrument footprints;
- point/polygon search and measurement only for products whose metadata supports it;
- click a feature to reveal name, coordinates, source mission/instrument, acquisition date, resolution, processing level, and license/credit;
- a data legend for every scientific colour scale;
- 2D map and 3D globe linked to the same cursor/location.

For planets with only illustrative global textures, say **illustrative texture**. Do not imply that a smooth spacecraft model or a colourized cloud map is a measured surface.

#### Level 4 — inspect the mission

A mission layer can add:

- spacecraft model and scale note;
- trajectory in a named frame;
- event timeline: launch, flyby, orbit insertion, landing, instrument activation, or image acquisition;
- camera footprint and viewing geometry;
- landing site/rover traverse;
- source image/video/data links;
- a “what the spacecraft knew then” snapshot rather than only present-day metadata.

### 7.2 Scale modes

Solar-system distances and planetary surfaces span incompatible scales. Provide an explicit scale switch:

- **Sky angular scale:** exact angular positions; screen size is a viewing aid.
- **Planet body scale:** radii and surface coordinates are proportional within the selected body.
- **Solar-system overview:** use a logarithmic or deliberately compressed distance scale, with a visible “not to scale” warning.
- **Mission proximity:** use a local frame around the spacecraft/target; label the frame and units.

Never place a planet, a lunar crater, and a spacecraft in one visually literal scene without telling the user which dimensions have been exaggerated.

### 7.3 Progressive detail and failure behavior

The expected load sequence is:

1. local sky/ecliptic canvas and vector labels;
2. selected-object metadata;
3. low-resolution poster or globe;
4. first visible tile/LOD/model chunk;
5. child tiles or high-resolution mesh under the current viewport;
6. optional overlays and mission media.

Requests should be abortable, cached, and bounded by viewport and memory. A failed tile or WebGL context should fall back to a low-resolution globe, the original SVG artwork, and a metadata table. The user should never lose the selected time, city, or calculated coordinates.

### 7.4 Rahu and Ketu exception

Rahu and Ketu remain supported and prominent in the Vedic coordinate layer, but they do not receive a fabricated physical surface, mass, albedo, spacecraft texture, altitude, or azimuth. Their deep-inspection view may show:

- the mean-node calculation and epoch;
- the ascending/descending-node relationship;
- ecliptic longitude and sidereal conversion;
- the orbit-plane intersection diagram;
- a clear “mathematical lunar node, not a physical body” label.

That semantic boundary is part of the world-class experience.

---

## 8. Ambitious future concepts, in dependency order

### 8.1 Precision observation planner

The current local layer already offers an approximate, ten-minute sampled horizon cue, twilight state, Moon phase and RA/declination separation for a selected body. Once the reference layer is trusted, extend it into a precision planner:

- rise, transit, and set windows with stated standard-altitude/refraction assumptions;
- civil, nautical, and astronomical twilight;
- horizon/terrain masking;
- lunar illumination and angular separation;
- limiting magnitude and light-pollution estimate;
- telescope/binocular field-of-view presets;
- “best objects in the next two hours” from the selected city;
- export to a calendar or field checklist;
- extend the local observation log with reviewed photographs, equipment, and optional calendar/field-checklist export.

This is more valuable to an actual observer than a decorative 3D orbit.

### 8.2 Guided sky school

Create short, reversible tours that operate on the real instrument:

- “Find north, zenith, and the horizon.”
- “Trace the ecliptic.”
- “Why tropical and sidereal longitudes differ.”
- “Meet the Moon, then inspect its phase.”
- “Follow a graha through the Time Machine.”
- “What Rahu/Ketu mean mathematically.”
- “From a constellation pattern to its scientific catalogue.”

Tours should highlight existing controls and end in a reproducible deep link. They should never turn an interpretive Vedic lens into an unsupported astronomical fact.

### 8.3 Compare mode

Two or more synchronized panels could compare:

- Patna vs Varanasi at the same UTC instant;
- now vs a historical observation;
- tropical vs sidereal coordinates;
- local sky vs ecliptic planisphere;
- NASA/ISRO mission imagery vs the calculated object;
- Moon surface lighting at two dates;
- two mission products with different resolution or processing levels.

Each panel must preserve its own observer/frame/source badge so comparison does not erase context.

### 8.4 Mission theatre

A mission is a better story unit than a generic asset gallery. A mission page could combine:

- a canonical body and its current/archived position;
- a spacecraft model;
- a trajectory timeline;
- a “why this measurement matters” explainer;
- instrument images and animations;
- a landing site/surface atlas;
- original source credit and data provenance;
- a classroom mode with questions and an answer key.

Good first vertical slices would be:

1. **Aditya-L1 / Sun:** India-specific mission identity, solar imagery, L1 halo-orbit explanation.
2. **Chandrayaan-3 / Moon:** landing site, rover imagery, surface coordinates, phase/lighting.
3. **Mars rover / Mars:** traverse, selected camera product, terrain tile and elevation profile.

Do one end-to-end mission well before adding hundreds of cards.

### 8.5 3D, AR, and VR

#### 3D web mode

- lazy-load `glTF/GLB` only for the selected object;
- use physically meaningful rotation/orientation metadata where available;
- show a scale bar, light direction, frame, and “illustrative vs measured” status;
- allow texture, wireframe, normal/elevation, and mission-overlay layers;
- preserve a non-WebGL Canvas/DOM fallback.

#### AR sky mode

A phone camera mode could align the calculated sky to the real sky using device orientation, location, and time. It needs:

- explicit permission prompts;
- compass calibration and a visible alignment confidence indicator;
- fallback to manual heading/pitch adjustment;
- no claim that a phone compass is telescope-grade;
- a screen-reader/data-list alternative;
- a privacy statement that location and camera remain local unless the user opts in.

#### WebXR/VR mode

Use VR for guided scale experiences, not for pretending a compressed solar-system diagram is physically measured:

- walk around a constellation or orbit plane;
- fly a mission path;
- visit a lunar landing site;
- switch between real scale, educational scale, and local mission scale;
- provide captions, seated mode, comfort settings, reduced motion, and a non-VR web tour.

### 8.6 Living archive

The Observatory could become a versioned public record rather than a static chart:

- periodic snapshots of approved NASA/ISRO/ESA mission feeds;
- immutable asset and ephemeris manifests;
- “what changed since last release?” diffs;
- source availability and rights status history;
- data-vintage selector: current, mission-era, or archived;
- reproducible observation URLs containing city, time, frame, provider, and asset version;
- curator notes and community observations with moderation;
- an annual “sky archive” for eclipses, conjunctions, launches, landings, and solar events.

The archive should preserve the data vintage. Updating a tile or ephemeris silently would make old shared links scientifically irreproducible.

---

## 9. Prioritized roadmap

### P0 — Evidence-backed Observation Layer v1 (the next milestone)

**Exit criteria:**

- a reviewed, committed small Horizons fixture exists for physical bodies;
- the fixture records epoch, time scale, frame, observer, query quantities, and raw/reference interpretation;
- both geocentric and at least one topocentric comparison are handled deliberately;
- the Moon discrepancy policy is explicit and tested; no sub-degree claim is made unless earned;
- local approximation remains the offline/browser fallback;
- Local Observatory and Ecliptic support bounded zoom, pan, reset, keyboard controls, and a semantic visible-object list;
- the selected-object sheet shows provider, model, frame, epoch, quality, source, and limitations;
- Time Machine labels its current interpolation honestly, or uses sampled positions where the new provider supports them;
- Rahu/Ketu retain node-only semantics across all detail levels;
- tests cover deep links, zoom state, source labels, fallback behavior, and node exceptions;
- browser QA is run when Chromium is available; build/setup limitations remain documented rather than hidden.

### P1 — Curated media and provenance library

- add the machine-readable asset register;
- ingest a small approved set: one NASA image, one NASA/SVS animation, one NASA 3D model, one ISRO mission asset, and one CC-licensed ESA/Hubble or ESO asset;
- add poster, captions/transcript, credit, license, source page, and “commercial use” status;
- show media as optional tabs in the existing detail sheet;
- keep Roscosmos link-out/permission status explicit;
- run a rights review before any paid, sponsored, or promotional deployment.

### P2 — Moon/Mars Surface Atlas

- start with one Moon area of interest and one Mars mission site;
- preprocess a low-resolution global globe and bounded high-resolution tile pyramids;
- add 2D/3D linked navigation, elevation/lighting, feature metadata, mission overlays, and measurement only where justified;
- cite NASA Trek/PDS/USGS/ISRO/CaSSIS product metadata at the layer level;
- keep all tile failures optional and offline fallback available.

### P3 — Mission Theatre and precision planning

- add spacecraft metadata and trajectories from reviewed SPICE/Horizons-derived slices;
- replace Time Machine interpolation with sampled reference trajectories where appropriate;
- upgrade the current local observation cue into reviewed rise/transit/set windows, refraction/standard-altitude policy, field-of-view guidance, and an event timeline;
- ship one complete Aditya-L1, Chandrayaan-3, or Mars mission story.

### P4 — 3D/AR/VR and living archive

- introduce lazy WebGL/WebXR bundles only after the 2D evidence path is trusted;
- add AR alignment confidence and accessible alternatives;
- add versioned data/asset snapshots and source-change history;
- add collaborative observation logs, classroom mode, and public archive views.

### Things deliberately not ranked as “next”

These are attractive but should wait for the P0 seam:

- a generic 3D solar system with no source/evidence layer;
- a live NASA/ISRO/Roscosmos API call from the browser;
- a large uncurated image carousel;
- a full global Moon/Mars tile mirror;
- a complete astrology judgement engine hidden behind astronomy graphics;
- unsupported claims of precision based on the number of decimal places displayed.

---

## 10. Concrete implementation sequence for P0

1. **Audit the reference scaffold.** The current `scripts/generate-reference.mjs` uses a geocentric Horizons center. Before qualifying the local sky, generate a deliberate topocentric fixture with explicit geodetic longitude, latitude, and elevation, plus a geocentric fixture for comparison.
2. **Freeze reference metadata.** Record the exact UTC epoch, time scale, `REF_SYSTEM`, `REF_PLANE`, `APPARENT`/airless choice, `QUANTITIES`, observer, and raw response interpretation.
3. **Generate a small fixture.** Prefer a few representative historical/current/future instants and a small set of physical bodies over a huge time series. Keep Rahu/Ketu outside the physical-body query path.
4. **Define the provider contract.** Make local approximation, reference fixture, and future SPICE-derived data conform to the same result shape.
5. **Compare by body and field.** Measure tropical longitude, latitude, RA, Dec, and any horizontal conversion separately. Publish the error budget rather than averaging it into one flattering number.
6. **Resolve the Moon policy.** The known **1.135216°** discrepancy must result in either an upgraded model or an explicit tolerance/label. Do not hide it under a “high precision” badge.
7. **Add a view transform.** Implement zoom/pan/reset in the local sky and ecliptic renderers without touching astronomy calculations.
8. **Add semantic controls.** Provide zoom buttons, keyboard focus, an object list, and a data table for users who cannot or do not want to hit a canvas target.
9. **Upgrade the detail sheet.** Add provider, model, frame, epoch, quality, fixture, source URL, error budget, and limitation rows.
10. **Make Time Machine honest and useful.** Keep “inspection interpolation” where a sampled provider is unavailable; if sampled reference points are used, display the sample interval and interpolation method.
11. **Test failure modes.** Disable network access and confirm the four routes still render, deep links still open, and optional reference/media state degrades to local calculations.
12. **Run browser QA.** Add zoom/pinch/keyboard/focus/reduced-motion checks once Chromium is installed. Keep the unavailable-Chromium limitation in the qualification report if the environment still cannot run it.
13. **Document the release state.** Preserve **CONDITIONAL PASS**, `BLOCKER-1`, `BLOCKER-2`, and the no-JPL-grade/no-sub-degree/no-complete-Jyotish guardrails until evidence supports a change.

### Suggested P0 file surface

These are implementation targets, not files added by this review:

```text
src/lib/astronomy/providers/
  types.ts
  localApproximation.ts
  referenceFixture.ts

src/lib/observatory/
  viewTransform.ts
  provenance.ts
  assetRegistry.ts       # schema only in P0; content begins in P1

scripts/
  generate-reference.mjs # extend with reviewed topocentric options

public/observatory/
  reference-fixture.json # small, human-reviewed fixture only

docs/observatory/
  ASSET_REGISTER.md      # add in P1
  reference-fixture-notes.md
```

---

## 11. Trust and qualification guardrails

The following statements remain mandatory in product copy, documentation, and future media modes:

- **Conditional status:** the Observatory remains **CONDITIONAL PASS** until the documented reference blockers are resolved through review.
- **BLOCKER-1:** the Moon reference discrepancy is **1.135216°** in the current qualification comparison.
- **BLOCKER-2:** the JPL Horizons fixture is not yet committed; `npm run reference:generate` requires a networked qualification environment and manual epoch/frame review.
- The current local ephemerides are deterministic, low-precision educational approximations.
- Do not claim JPL-grade accuracy, sub-degree lunar precision, or precision visibility predictions before those claims are benchmarked.
- Do not describe a 3D model, texture, or colourized scientific layer as a direct photograph or measurement without its product metadata.
- Rahu and Ketu are calculated mathematical lunar nodes, not physical planets or sky objects with physical altitude/azimuth.
- Gochara is a computational natal/current sidereal comparison, not a complete Jyotish judgement.
- Tropical and sidereal frames must remain separately labelled.
- A media source label must not imply NASA, ISRO, ESA, ESO, Roscosmos, JPL, or any contributor endorses CosmicTantra.
- Current validation limitations must remain visible: Chromium is unavailable in the sandbox for the full responsive browser suite, Prisma generation/build setup can fail because its engine checksum fetch is network-blocked, and the reference fixture still requires a networked review run.

### Recommended source badge language

```text
Position: local deterministic approximation
Frame: tropical ecliptic → of-date horizontal
Observer: Patna, India · 25.5941° N · 85.1376° E
Reference: no frozen external fixture for this epoch
Limitation: low-precision educational model; no refraction, terrain, clouds, or light pollution
```

For a checked result:

```text
Position: reference-checked snapshot
Provider: JPL Horizons observer ephemeris
Epoch/frame/observer: shown in full
Fixture: observatory-reference-2026-08-26T00:00Z
Credit/source: linked in Evidence
```

---

## 12. Source register consulted

Checked for this review on 26 August 2026. URLs are retained here so future implementation work can recheck terms rather than relying on a remembered summary.

### NASA/JPL/NAIF

- [NASA Images and Media Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)
- [NASA Image and Video Library](https://images.nasa.gov/)
- [NASA Image and Video Library API documentation](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf)
- [NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/)
- [NASA 3D Resources](https://nasa3d.arc.nasa.gov/models)
- [NASA 3D Resources GitHub](https://github.com/nasa/NASA-3D-Resources)
- [NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/)
- [NASA Sun 3D model](https://science.nasa.gov/learn/heat/resource/sun-3d-model/)
- [NASA Solar System Treks](https://trek.nasa.gov/)
- [Moon Trek](https://trek.nasa.gov/moon/)
- [Mars Trek](https://trek.nasa.gov/mars/)
- [Trek WMTS/API documentation](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon)
- [NASA GIBS access basics](https://nasa-gibs.github.io/gibs-api-docs/access-basics/)
- [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html)
- [JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html)
- [NAIF generic kernels](https://naif.jpl.nasa.gov/naif/data_generic.html)
- [NASA Planetary Data System Imaging Node](https://pds-imaging.jpl.nasa.gov/)
- [JPL image-use policy](https://www.jpl.nasa.gov/jpl-image-use-policy/)

### ISRO/India

- [ISRO Copyright Policy](https://www.isro.gov.in/Copyright_Policy.html)
- [Aditya-L1 gallery](https://www.isro.gov.in/AdityaL1_gallery.html)
- [Aditya-L1 videos](https://www.isro.gov.in/Aditya_L1_videos.html)
- [Chandrayaan-3 gallery](https://www.isro.gov.in/chandrayaan3_gallery.html)
- [Chandrayaan-3 videos](https://www.isro.gov.in/Ch3_Video_Lunar_Orbit_Insertion.html)
- [ISRO space-based Earth-observation services](https://www.isro.gov.in/SpaceBasedEarthObservationServices.html)
- [Bhuvan](https://bhuvan.nrsc.gov.in/)
- [Bhoonidhi](https://bhoonidhi.nrsc.gov.in/bhoonidhi/index.html)
- [MOSDAC open data](https://www.mosdac.gov.in/open-data)
- [Government Open Data License–India](https://jk.data.gov.in/godl)
- [data.gov.in terms of use](https://www.data.gov.in/terms-of-use)

### Roscosmos and partner material

- [Roscosmos media-use rules](https://www.roscosmos.ru/22650/)
- [Roscosmos information resources](https://www.roscosmos.ru/117/)
- [CaSSIS](https://www.cassis.unibe.ch/)
- [ESA ExoMars/CaSSIS video example](https://www.esa.int/esatv/Videos/2016/11/First_images_from_ExoMars)

### Additional open/clear-license sources

- [ESA/Hubble copyright](https://esahubble.org/copyright/)
- [ESO copyright](https://www.eso.org/public/copyright/)
- [ESA open Creative Commons content](https://open.esa.int/image-usage-creative-commons/)
- [USGS-NASA Planetary Geologic Mapping hub](https://astrogeology-usgs.hub.arcgis.com/)

---

## Final recommendation

Do not start by filling the Observatory with hundreds of remote images or by adding a cinematic 3D solar system. Start by making the existing observation **zoomable, reference-aware, and provenance-complete**.

Once a user can select the Moon in Patna at a shared UTC instant, zoom from the whole sky to the local field, inspect its coordinates and model, see the known Moon limitation, open a reviewed mission image, and still use the instrument with the network disconnected, the product will have earned its next leap. That is the foundation on which NASA/ISRO/Roscosmos media, planetary surface tiles, 3D models, AR/VR, mission theatre, and a living archive can become world-class rather than merely impressive.
