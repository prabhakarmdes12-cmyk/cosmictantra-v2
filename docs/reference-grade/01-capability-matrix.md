# 01 — Capability Matrix: CosmicTantra Reference-Grade Engine

**Document Version**: 1.0.0  
**Phase**: Sprint A Forensic Audit  
**Classification**: Engineering Truth Matrix

This matrix categorizes all astronomical, Jyotisha, interpretive, and verification capabilities within the CosmicTantra codebase according to the product invariants of `MISSION_REFERENCE_GRADE_JYOTISHA_ENGINE.md`.

---

## Qualification Status Legend
- `IMPLEMENTED`: Code exists and runs deterministically.
- `INTERNALLY_VERIFIED`: Regression tests and internal unit fixtures pass consistently.
- `EXTERNALLY_VERIFIED`: Certified against independent external reference ephemerides (JPL / Swiss Ephemeris benchmark datasets).
- `SCHOLAR_VERIFIED`: Reviewed and signed off by practicing Jyotish scholars with traditional textual consensus.

---

## Comprehensive Subsystem Matrix

| Subsystem / Capability | Implementation Location | Inputs | Outputs | Declared Conventions | Test Coverage | Validation Status | Known Limitations | Exposure in Authoritative Report | Exposure in AI / Chat |
|---|---|---|---|---|---|---|---|---|---|
| **Ecliptic Longitude (Sun to Saturn)** | `src/lib/astrologyEngine.ts` | Date, UTC Time, Lat, Lng | Geocentric Nirayana Longitude (0–360°), Speed | Chitra Paksha Lahiri Ayanamsha; Geocentric | High (`single-flow-kundli`, `kundli-download-reliability`) | `INTERNALLY_VERIFIED` | Mean orbital elements with perturbations; needs 100k qualification | Direct (Planetary Table, D1, D9) | Read-only fact feed |
| **Lunar Nodes (Rahu / Ketu)** | `src/lib/astrologyEngine.ts` | Julian Ephemeris Date | Longitude, Speed, Retrogression | Mean Node model; Ketu = Rahu + 180° | High (Golden chart fixtures) | `INTERNALLY_VERIFIED` | True Node option not yet configurable | Direct (Graha Matrix) | Read-only fact feed |
| **Lagna (Ascendant) & Bhava Cusps** | `src/lib/astrologyEngine.ts` | Local Sidereal Time, Latitude | Lagna Degree, 12 House Cusps | Equal House / Whole Sign Nirayana | High (Golden chart fixtures) | `INTERNALLY_VERIFIED` | High-latitude distortion (>66°N/S) needs polar fallback | Direct (All charts) | Read-only fact feed |
| **Panchanga (Tithi, Vara, Nakshatra, Yoga, Karana)** | `src/lib/panchang.ts`, `src/lib/panchang/` | Julian Date, Sun/Moon Longitude | Daily 5 Panchanga limbs, start/end times | Classical Surya Siddhanta / Drik Ganita alignment | High (Daily Panchang tests) | `INTERNALLY_VERIFIED` | Amanta currently primary; Purnimanta requires explicit toggle | Direct (Kundli Passport, Saar) | Direct Q&A |
| **Muhurta & Inauspicious Timings** | `src/lib/panchang.ts` | Local Sunrise, Sunset, Day of Week | Rahu Kaal, Yamaganda, Gulika, Abhijit | Octa-division of daylight & nighttime hours | Medium (Panchang unit tests) | `INTERNALLY_VERIFIED` | Boundary times use linear division rather than local refraction | Direct in Panchang / Daily | Direct Q&A |
| **Divisional Chart D1 (Rashi)** | `src/lib/jyotish/vargaEngine.ts` | 9 Graha Longitudes, Lagna | 12 House occupants, Rashi signs | Equal Sign (30° each) | High | `INTERNALLY_VERIFIED` | Standard Parashari | Direct (D1 SVG / PDF) | Fact feed |
| **Divisional Chart D9 (Navamsha)** | `src/lib/jyotish/vargaEngine.ts` | 9 Graha Longitudes, Lagna | 9 Graha Navamsha signs, Pada | Parashari 3°20' Chara/Sthira/Dwisvabhava mapping | High (Golden charts) | `INTERNALLY_VERIFIED` | Standard Parashari | Direct (D9 SVG / PDF) | Fact feed |
| **Divisional Chart D10 (Dashamsha)** | `src/lib/kundli/v40/d10Validation.ts` | 9 Graha Longitudes, Lagna | 9 Graha Dashamsha signs | Parashari 3°00' Odd/Even sign starting rules | High (`d10Validation.ts`) | `INTERNALLY_VERIFIED` | Higher sensitivity to birth time errors (<12 mins) | Direct (Career Folio) | Handled with sensitivity note |
| **Higher Vargas (D2, D3, D4, D7, D12, D16, D20, D24, D27, D30, D40, D45, D60)** | `src/lib/jyotish/vargaEngine.ts` | 9 Graha Longitudes, Lagna | Signs for all 16 Shodashavargas | Parashari Brihat Parashara Hora Shastra | Medium | `IMPLEMENTED` (Pending external mass qualification) | D60 boundary flips every 30 seconds of clock time | Excluded from primary summary until certified | Excluded from definitive claims |
| **Vimshottari Dasha Engine** | `src/lib/jyotish/timelineEngine.ts` | Moon Longitude, Birth Date/Time | 120-yr Mahadasha, Antardasha, Pratyantardasha | 120 solar-year cycle, Nakshatra lord balance | High (Timeline tests) | `INTERNALLY_VERIFIED` | Solar vs Savana 360-day calendar options need formal registry | Direct (Vimshottari Timeline) | Direct Q&A |
| **Planetary Dignity & Condition** | `src/lib/kundli/v40/grahaCondition.ts` | Planetary Longitude, Sun Longitude | Dignity (Exalted/Debilitated/Own/Moola), Retrograde, Combust | Classical orbs for combustion; exact deep exaltation points | High (V40 QA tests) | `INTERNALLY_VERIFIED` | Combustion orbs vary between Surya Siddhanta and BPHS | Direct (Graha Dossier) | Fact feed |
| **Aspect Engine (Drishti)** | `src/lib/kundli/v40/aspectEngine.ts` | Planetary Positions | Full & Special Parashari aspects | Parashari sign & house-based drishti (Mars 4/8, Jup 5/9, Sat 3/10) | High | `INTERNALLY_VERIFIED` | Fractional spherical drishti (Shadbala Drik Bala) separate from sign aspect | Direct (Graha Matrix) | Fact feed |
| **Functional Lordship & Bhava Intelligence** | `src/lib/kundli/v40/functionalLordship.ts` | Lagna Sign, House rulers | Functional Benefic/Malefic/Yogakaraka | Parashari Kendradhipati, Trikonadhipati, Trishadaya rules | High | `INTERNALLY_VERIFIED` | Strict adherence to Lagna-specific rules | Direct (Bhava Intelligence) | Fact feed |
| **Classical Yoga Engine** | `src/lib/jyotish/yogaEngine.ts` | Chart Snapshot | Present Yogas, descriptions, classical citations | BPHS, Saravali, Phaladeepika citations | High (Yoga regression tests) | `INTERNALLY_VERIFIED` | Curated ~30 core yogas; expansion to 100 planned in Sprint I | Direct (Yoga Dashboard) | Structured explanation |
| **Dosha Engine (Manglik / Sade Sati / Kalsarpa)** | `src/lib/kundli/canonicalModel.ts`, `src/lib/jyotish/` | Mars house, Saturn transit, Node axes | Presence, classical cancellation status | Classical house check (1, 2, 4, 7, 8, 12 from Lagna/Moon); cancellation rules | High | `INTERNALLY_VERIFIED` | Sade Sati transit timing being migrated to full ephemeris transit engine | Direct (Dosha Dashboard) | Strictly fear-free copy |
| **Ashtakoota Kundali Milan** | `src/lib/kundli/v42/milan/milanEngine.ts` | Partner A & B Moon Nakshatras & Rashis | 8 Kootas (0-36 points), Nadi/Bhakoot dosha & parihara | Classical North Indian Ashtakoota (BPHS / Muhurta Chintamani) | High (`milan-report-and-menu.spec.ts`) | `INTERNALLY_VERIFIED` | Does not replace full two-chart synastry; explicitly declared as Guna Milan | Direct (Milan Studio & PDF) | Summary with Pandit advisory |
| **Executive Life Gauges** | `src/lib/jyotish/executiveLifeGauge.ts` | Planetary Dignity, House Lords, Aspects | 6 Normalized Dimensions (0-100) | Heuristic synthesis derived from Graha Bala & Bhava relationships | High | `INTERNALLY_VERIFIED` | Heuristic synthesis tool; explicitly labeled as qualitative orientation | Direct (Executive Life Gauge) | Read-only guidance |
| **Deterministic AI Firewall (Kashi Sahayak V3)** | `src/lib/kashi/conversationCore.ts` | User utterance, active conversation state | Normalized intent, extracted entities, slot resumption | Pure rule-based weighted matcher + Devanagari normalization | High (41/41 tests pass) | `INTERNALLY_VERIFIED` | Covers defined domain vocabulary; hands over gracefully via Scholar Handover | N/A (Chat assistant) | Primary conversation engine |
| **Scholar Handover Packet** | `src/lib/kashi/scholarHandover.ts` | User inquiry, active Kundli snapshot | Structured handover ID, WhatsApp prefill text | Verified consultation routing with canonical help desk | High | `INTERNALLY_VERIFIED` | WhatsApp protocol relies on client device | Direct in Concierge Modal | WhatsApp link generator |

---

## Summary of Audit Findings
1. **Zero Greenfield Rewrite Needed**: The architectural foundations are already cleanly modularized in TypeScript.
2. **Key Enhancement Needed**: Advancing from `INTERNALLY_VERIFIED` to `EXTERNALLY_VERIFIED` via an automated 100,000-scenario qualification harness comparing calculations against JPL Horizons and Swiss Ephemeris golden standards.
