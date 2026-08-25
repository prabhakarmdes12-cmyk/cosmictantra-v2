# Existing System Audit — 2026-08-25

## Scope and finding
The repository is a Next.js 14 application. The protected canonical chart path is `src/lib/astrologyEngine.js`; `src/engines/astrologyEngine.js` intentionally re-exports it. This is the only path the Observatory adapter consumes.

**Important release finding:** the current engine is described in its own code as a deterministic approximate ephemeris and its Lahiri expression is `23.856 + 1.396*T`. `src/lib/panchang.js` separately implements simplified Sun/Moon and fixed 06:00/18:00 sunrise/sunset logic. Therefore neither independent-reference validation nor high-precision/rise-set claims are presently justified. Observatory is configured as an inspectable internal 2D instrument until these blockers are addressed.

## Inventory
| Domain | Current owner | Notes |
|---|---|---|
| Kundali, grahas, Lagna, rashi, nakshatra, pada, Lahiri | `src/lib/astrologyEngine.js` | Canonical/protected path; Observatory adapter delegates here. |
| Re-export compatibility | `src/engines/astrologyEngine.js` | Re-export only, no duplicate domain implementation. |
| Panchang (tithi/yoga/karana/Rahu) | `src/lib/panchang.js` | Separate approximate implementation; duplicate Sun/Moon logic. |
| Legacy Panchang | `src/engines/panchang.js` | Separate implementation and contract; needs consolidation decision. |
| Dasha | `src/engines/dashaEngine.js`, `src/lib/dashaEngine.js` | Duplicate-looking domain ownership; audit before integration. |
| Muhurta | `src/lib/muhuratData.js`, UI `MuhuratDiscovery.jsx` | Data/UI path; not Observatory input yet. |
| Cities / location | `src/lib/cities.js` | Decimal coordinate catalogue, numeric offsets (not IANA). |
| Profile/Cosmic ID | `src/lib/profileStore.js`, `FamilyManager.jsx` | Client-side profile use. |
| UI shell/theme/language | `src/app/page.tsx`, `Navigation.jsx`, `globals.css`, `translations.js` | No routeRegistry or `CosmicTantraShell` found. |
| Existing golden tests | `tests/astrology.spec.ts` | Two canonical engine parity/benchmark cases. |

## Duplications and risks discovered
1. Panchang has a separate Lahiri, Sun and Moon implementation, unlike Kundali.
2. `src/lib/dashaEngine.js` and `src/engines/dashaEngine.js` require a future ownership decision.
3. `cities.js` stores numeric seasonal offsets for London/New York; this is DST-unsafe. Observatory maps its supported locations to IANA zones independently.
4. `calculatePanchang` currently uses hard-coded 06:00/18:00 solar times. Do not present these as observer-specific astronomical rise/set.
5. UI components consume derived data, but the audit did not find Observatory-era coordinate calculations in React components.
6. No Stellarium package, WASM catalogue, or mock Observatory planet feed is installed.

## Audit decision
No validated engine was rewritten. The first Observatory slice contains a typed adapter around the canonical path and explicitly identifies its coordinate/provenance chain. A production astronomy upgrade must add an authoritative, independently validated ephemeris and reconcile it with canonical Jyotish outputs before precision claims or 3D-real-sky language.
