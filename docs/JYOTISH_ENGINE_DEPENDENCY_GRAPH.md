# Jyotish Engine Dependency Graph (DAG)

**Architecture Standard**: `INV_JYOTISH_001` to `INV_JYOTISH_007`  
**Execution Type**: Pure Headless Deterministic DAG

---

## 1. Directed Acyclic Graph (DAG) Specification

```
[Input Layer]
NormalizedBirthContext (Date, Time, Latitude, Longitude, Timezone)
       │
       ▼
[Astronomical Kernel Layer]
CelestialEphemerisAdapter (VSOP87 / ELP2000-82 Geocentric Apparent Longitudes)
       │
       ▼
AyanamshaProvider (Lahiri / Raman / KP / Tropical)
       │
       ▼
SiderealAstronomicalState (9 Grahas Sidereal Longitudes + Speeds + Latitudes + Ascendant)
       │
       ▼
[Canonical Master Snapshot]
CanonicalJyotishSnapshot (D1 Chart, 12 Bhavas, Prevailing Birth Panchang)
       │
       ├───► VargaEngine (D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60)
       │       │
       │       ▼
       ├───► Relationship & Dignity Engine (Naisargika, Tatkalika, Panchadha Maitri, Combustion, Planetary War)
       │       │
       │       ▼
       ├───► Drishti Engine (Parashari Graha Drishti with Mars/Jupiter/Saturn Special Aspects + Rashi Drishti)
       │       │
       │       ▼
       ├───► Bala Engine (Shadbala: Sthana, Dig, Kala, Cheshta, Naisargika, Drik + Bhava Bala + Vimshopaka Bala)
       │       │
       │       ▼
       ├───► Ashtakavarga Engine (BAV, SAV, Reductions) [Release 2]
       │       │
       │       ▼
       ├───► Dasha Registry (Vimshottari 5-Tier, Ashtottari, Yogini, Chara) [Release 3]
       │       │
       │       ▼
       ├───► Jaimini & KP Engines [Release 4]
       │       │
       │       ▼
       └───► Varshaphala & Transit Timeline Engines [Release 5]
               │
               ▼
       [Evidence Layer]
       Jyotish Evidence Graph (Immutable Node IDs)
               │
               ├───► Simple View (Consumer Kundli)
               ├───► Pandit View & Jyotish Workbench (Professional Multi-Panel Workspace)
               ├───► Composable Report Generator
               └───► Kashi AI Reasoning & Consultation Assistant
```
