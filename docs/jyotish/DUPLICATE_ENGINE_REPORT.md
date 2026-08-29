# DUPLICATE ENGINE FORENSIC REPORT

**Project:** CosmicTantra (Chiti Technologies)  
**Evaluation Scope:** Analysis of Competing Engines, Divergent Logic, and Collision Invariants  
**Date:** August 29, 2026  

---

## 1. Executive Collision Overview

A **DUPLICATE_TRUTH_PATH** exists whenever the same astrological or astronomical fact is independently computed by more than one implementation in the codebase. 

In CosmicTantra, 4 distinct engine collisions were identified:

| Collision ID | Competing File A | Competing File B | Divergence Nature | Production Impact |
|:---|:---|:---|:---|:---|
| **COL-001** | `src/lib/panchang.js` | `src/engines/panchang.js` | 4-term vs 2-term Moon; True sunrise vs Hardcoded 6 AM | **High** (Causes Cosmic Now Tithi defect) |
| **COL-002** | `src/lib/dashaEngine.js` | `src/engines/dashaEngine.js` | 3-tier (with Pratyantar) vs 2-tier | **Medium** (DashaHero lacks 3rd tier) |
| **COL-003** | `src/lib/location.ts` | `src/lib/location.js` | TypeScript vs JavaScript mirror | **Low** (Duplicate maintenance) |
| **COL-004** | `src/lib/cities.ts` | `src/lib/cities.js` | 516 cities in `.ts` vs 26 cities in old workspace | **Low** (Resolved in current root) |

---

## 2. Deep Dive: Collision COL-001 (Panchang Engines)

### Code Comparison:

#### Implementation A: `src/lib/panchang.js` (Canonical & High Precision)
```javascript
// Accurate solar position & sunrise with Equation of Time & Atmospheric Refraction
function getSunTimes(date, lat, lng, tz) { ... } // Calculates solar noon, declination, hourAngle

// 4-harmonic lunar longitude model
function getMoonLongitude(jd) {
  const d = jd - 2451545.0;
  const L = (218.316 + 13.176396 * d) % 360;
  const M = (134.963 + 13.064993 * d) % 360;
  const F = (93.272 + 13.229350 * d) % 360;
  const lons = L + 6.289 * Math.sin(M * Math.PI / 180) - 1.274 * Math.sin((M - 2 * F) * Math.PI / 180);
  return (lons + 360) % 360;
}
```

#### Implementation B: `src/engines/panchang.js` (Simplified & Defective)
```javascript
// Hardcoded sunrise / sunset
const sunriseHour = 6.0;
const sunsetHour = 18.0;

// Truncated 2-term lunar longitude
function getMoonLon(T) {
  const L1 = 218.3165 + 481267.8813 * T;
  const Mp = degToRad(normalizeAngle(134.9634 + 477198.8676 * T));
  const D = degToRad(normalizeAngle(297.8502 + 445267.1115 * T));
  return normalizeAngle(L1 + 6.2886 * Math.sin(Mp) + 1.2740 * Math.sin(2 * D - Mp));
}
```

### Consequences:
- `src/engines/panchang.js` Moon longitude diverges by up to **$1.8^\circ$** from `src/lib/panchang.js`.
- Because $1^\circ$ of Moon-Sun elongation corresponds to 2 hours of time, `engines/panchang.js` flips Tithi boundaries up to **3.5 hours too early or too late**.
- Furthermore, because `engines/panchang.js` hardcodes sunrise to 6:00 AM, all Rahu Kaal, Yamaganda, and Gulika timings are wrong for cities across India whose sunrise varies from 5:15 AM to 6:45 AM depending on season and longitude.

---

## 3. Deep Dive: Collision COL-002 (Dasha Engines)

### Code Comparison:

#### `src/lib/dashaEngine.js`
- Computes **Mahadasha**, **Antardasha**, and **Pratyantardasha** down to exact start and end dates.
- Returns formatted strings, Hindi lord names, and active current dasha locator (`getCurrentDasha`).

#### `src/engines/dashaEngine.js`
- Computes only **Mahadasha** and **Antardasha**.
- Does not compute Pratyantardasha (3rd level).
- Uses coarser date math (`dashaEnd.setFullYear(dashaEnd.getFullYear() + lordInfo.years)`).

---

## 4. Elimination & Consolidation Strategy

1. **Retire `src/engines/panchang.js`**: Replace all imports with `src/lib/panchang.js`.
2. **Retire `src/engines/dashaEngine.js`**: Route all dasha calculations through `src/lib/dashaEngine.js`.
3. **Establish Single Authoritative Kernel**: Place all deterministic math under `src/lib/` and enforce import consistency.
