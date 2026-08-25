# Observatory Source-of-Truth Map

| Datum | Owner | Observatory use | Status |
|---|---|---|---|
| Moon sidereal longitude/rashi/nakshatra/pada | `src/lib/astrologyEngine.js` | `calculateCanonicalBody` | Authoritative for current CosmicTantra Jyotish output |
| Ayanamsha | `getLahiriAyanamsha` in same module | `canonicalLahiriAdapter` | Canonical repository implementation |
| Tropical longitude / RA / Dec / horizon | `astronomy-engine` 2.1.19 | `calculateCanonicalBody` astronomy field | MIT deterministic astronomical source; separately labelled from Jyotish |
| Canonical sidereal longitude/rashi/nakshatra/pada | `src/lib/astrologyEngine.js` | `calculateCanonicalBody` Jyotish field | Existing CosmicTantra authority; cross-engine Δ is preserved for development validation |
| Julian date / UTC / IANA time | `src/lib/astronomy/time.ts` | Observatory state | New typed time boundary |
| Observer | `cities.js` + `ObserverLocation` | Client-only selection | Catalogue default; no geolocation persistence |
| Renderer geometry | `ObservatoryExperience.tsx` | Visual projection only | Never used as calculation input |
| Panchang deep link | `/panchang/[city]` | Navigation only | Existing Panchang remains owner |
| Kundali deep link | home Kundali section | Navigation only | Existing canonical Kundali remains owner |

## Invariant
**OBS_INV_001:** The Observatory adapter must call the canonical engine and preserve its sidereal longitude, rashi, nakshatra and pada for identical date/time/location inputs. See `tests/observatory/sidereal.spec.ts`.
