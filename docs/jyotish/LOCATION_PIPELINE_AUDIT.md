# LOCATION & BIRTHPLACE PIPELINE AUDIT

**Project:** CosmicTantra (Chiti Technologies)  
**Evaluation Scope:** Geolocation, City Databases, Timezone Resolution & "Any Birthplace" Architecture  
**Date:** August 29, 2026  

---

## 1. Current State of Location Capabilities

### Existing Assets in Codebase:
1. **Indexed Cities Database (`src/lib/cities.ts`)**:
   - Contains **516 Indian cities and district headquarters** with verified coordinates, state names, and standard $+5.5$ IST timezone.
   - Categorized by state/region (Jharkhand, Bihar, Uttar Pradesh, West Bengal, Maharashtra, Delhi, etc.).
2. **Nearest-City Haversine Resolver (`src/lib/location.ts:16`)**:
   - `findNearestCity(lat, lng)`: Computes great-circle distance to all 516 cities and returns the closest match.
3. **Browser GPS Integration (`src/lib/location.ts:55`)**:
   - `watchRealtimeGps(onLocationFound)`: Uses W3C Geolocation API to detect coordinates on mobile/desktop browsers.

---

## 2. Identified Deficiencies & Failure Modes

1. **Unlisted Towns and Villages Fallback Defect**:
   - If a user was born in a village or small town not among the 516 pre-indexed cities, the current onboarding UI either fails to autocomplete or forces the user to pick an arbitrary nearby city.
   - **Architectural Violation**: A calculation engine depends strictly on `latitude`, `longitude`, and historically accurate `timezone`. It should not depend on a predefined list.
2. **Missing Dynamic Geocoding Provider**:
   - There is currently no fallback geocoding service (e.g. OpenStreetMap / Nominatim / Photon / Google Geocoding API) to dynamically resolve unknown village or international birthplace queries.
3. **Historical Timezone & DST**:
   - Hardcoded $+5.5$ for India is accurate for modern dates, but international birthplaces or pre-1947 historical Indian timezones (e.g. Calcutta Time $+5:53:20$, Madras Time $+5:21:14$, or World War II Indian War Time $+6.5$) are not currently modeled.

---

## 3. Canonical Architecture: "Any Birthplace" Pipeline

To fulfill the Pandit's requirement that *"a user should be able to enter practically any birthplace and generate their Kundli"*, the architecture must adopt a unified **`ResolvedBirthPlace`** contract:

```typescript
export interface ResolvedBirthPlace {
  displayName: string;         // e.g. "Govindpur, Dhanbad, Jharkhand, India"
  locality?: string;            // "Govindpur"
  district: string;            // "Dhanbad"
  state: string;               // "Jharkhand"
  country: string;             // "India"
  latitude: number;            // 23.8342
  longitude: number;           // 86.5218
  timezoneId: string;          // "Asia/Kolkata"
  timezoneOffsetAtBirth: number; // 5.5
  source: 'PRE_INDEXED_DATABASE' | 'DYNAMIC_GEOCODER' | 'GPS' | 'MANUAL_COORDINATES';
  confidence: number;          // 0.0 to 1.0
}
```

### Resolution Flow:
```
User Enters Text Query (e.g. "Govindpur")
               │
               ▼
   1. Search 516 Local Cities Cache (0 ms latency)
         ├─ Match found? ──> Return Local Match
         │
         └─ Not found? ──> 2. Query Public Geocoder (Photon / Nominatim)
                               ├─ Returns Exact Lat / Lon
                               └─ Resolves Timezone via IANA Timezone Polygon
```
