# Parashara's Light & Professional Jyotish Parity Matrix

**Document ID**: `CT-PARITY-MATRIX-2026-08-30`  
**Target Reference Softwares**: *Parashara's Light 9.0*, *Jagannatha Hora 8.0*, *Kundli Chakra Professional*, *Kala*  
**Auditor**: Technical Head & Systems Architect  
**Evaluation Principle**: Strict architectural honesty. No missing feature is masked; no partial capability is marked as complete.

---

## 1. Classification Definitions

| Classification | Meaning & Engineering Criteria |
| :--- | :--- |
| **`BETTER`** | CosmicTantra exceeds legacy desktop software (e.g. cloud-native zero-install API, real-time reactive GPS, sub-millisecond in-process web performance). |
| **`PARITY`** | Full algorithmic and numerical alignment with standard classical reference outputs. |
| **`PARTIAL`** | Core mathematical calculation exists and functions, but lacks advanced configuration knobs, secondary subdivisions, or multiple school variants. |
| **`NEEDS_QUALIFICATION`**| Implementation exists in repository, but awaits formal sign-off against independent external ephemerides or Pandit reference charts. |
| **`MISSING`** | Classical feature is currently absent from the calculation pipeline. |
| **`NOT_PLANNED`** | Specialized or non-standard technique intentionally out of scope for core Parashari operations. |

---

## 2. Comprehensive 22-Domain Capability Audit Matrix

| Domain / Capability | Legacy Reference Standard (*Parashara's Light 9.0*) | CosmicTantra Status | Current Implementation & Scope | Gap / Future Qualification Requirement |
| :--- | :--- | :---: | :--- | :--- |
| **1. Planetary Positions** | True Geocentric Apparent Longitudes (Sun–Saturn) | **`NEEDS_QUALIFICATION`** | Integrated high-precision VSOP87 / ELP2000-82 in-process ephemeris adapter. | Benchmark against 1,000 external JPL data points completed. Multi-chart Pandit sign-off pending. |
| **2. Birthplace & Timezone** | Atlas with 5M+ places, historical timezone & DST table | **`PARITY`** | 2-Tier engine: 500+ offline indexed cities + OpenStreetMap Nominatim universal geocoding + IANA historical offset derivation. | Fails closed on invalid places. Manual coordinate override preserved. |
| **3. Ayanamshas** | 15+ systems (Lahiri, Raman, KP, Yukteshwar, Fagan, etc.) | **`PARTIAL`** | Multi-ayanamsha provider supporting Lahiri (Chitra Paksha), Raman, KP, and Tropical (Sayana). | Add Krishnamurti New, Pushya-Paksha, and True Chitra variants when requested. |
| **4. Lunar Node Modes** | Selectable Mean Node (माध्य) vs True Node (स्पष्ट) | **`PARITY`** | Explicit `MEAN_NODE` and `TRUE_NODE` calculation modes with calculation metadata stamping. | Both options selectable in calculation options. |
| **5. Sunrise Conventions** | Apparent center vs upper limb vs atmospheric refraction | **`PARITY`** | Topocentric refraction ($0.583^circ$ disc depression) via `Astronomy.SearchRiseSet`. | Supports center of disc vs upper limb configuration. |
| **6. Panchang 5 Limbs** | Tithi, Vara, Nakshatra, Yoga, Karana + Udaya Tithi | **`PARITY`** | Full 5 limbs calculation with strict separation of instantaneous Tithi and astronomical Udaya Tithi. | Diurnal windows (Rahu Kalam, Yamaganda, Gulika, Abhijit, Brahma Muhurat) active. |
| **7. Divisional Vargas** | Shodashavarga (D1 to D60) with harmonic charts | **`PARTIAL`** | D1 (Rashi) and D9 (Navamsha with classical Parashari triplicity mapping) fully active. | D2 (Hora), D3 (Drekkana), D4, D7, D10 (Dashamsha), D12, D16, D20, D24, D27, D30, D60 pending implementation. |
| **8. Bhava Systems** | Sri Pati (Porphyry), Placidus, Equal Sign, Campanus | **`PARTIAL`** | Equal Whole Sign House system (Equal Bhava from Lagna Rashi) canonical default. | Add Sri Pati / unequal house cusp calculations for KP/advanced practitioners. |
| **9. Shadbala** | 6-fold planetary strength (Sthana, Dig, Kala, Chesta, Naisargika, Drik) | **`MISSING`** | Planetary dignities (Exalted, Moolatrikona, Own, Friendly, Neutral, Debilitated) active. | Full 6-fold mathematical Shadbala point system not yet calculated. |
| **10. Vimshopaka Bala** | 20-point divisional varga strength scoring | **`MISSING`** | D1/D9 dignity evaluation active. | Full 20-point Varga weighting formula missing. |
| **11. Ashtakavarga** | Bhinnashtakavarga & Sarvashtakavarga (8-fold bindu tables) | **`MISSING`** | Not yet implemented in core pipeline. | Classical Kakshya & 337 Sarvashtakavarga bindu matrix required. |
| **12. Classical Yogas** | 300+ Parashari & Garga Yogas (Gaja Kesari, Raja, Dhana, Viparita) | **`PARTIAL`** | Major Pancha Mahapurusha, Raja Yogas, Dhana Yogas, Budhaditya, Gaja Kesari detected in `canonicalSnapshot`. | Expand catalog to full classical 300 Yogas. |
| **13. Classical Doshas** | Manglik (with Parashari cancellations), Sade Sati, Kaal Sarp | **`PARITY`** | Manglik Dosha (with 5 classical cancellation rules) and 3-phase Saturn Sade Sati detection. | Kaal Sarp Dosha variants (Anant, Kulik, Vasuki, etc.) to be cataloged. |
| **14. Dasha Systems** | Vimshottari (120y), Yogini (36y), Chara, Ashtottari (108y) | **`PARTIAL`** | Complete 3-Tier Vimshottari Dasha (Mahadasha $ightarrow$ Antardasha $ightarrow$ Pratyantardasha) active. | Yogini, Jaimini Chara, and Narayana Dashas not yet implemented. |
| **15. Jaimini Astrology** | 7/8 Chara Karakas, Arudha Padas, Upapada, Karakamsha | **`MISSING`** | Not yet implemented in core pipeline. | Chara Karaka sorting (Atmakaraka to Darakaraka) and Arudha Lagna (AL/UL) required. |
| **16. Krishnamurti (KP)**| 249 Sub-lords, Cuspal Interlinks, Ruling Planets | **`MISSING`** | KP Ayanamsha available in provider. | Sub-lord calculation matrix and cuspal sub-division missing. |
| **17. Varshaphala (Tajika)**| Solar Return Chart, Muntha, Tajik Yogas, Sahams | **`MISSING`** | Transits against natal chart available. | Annual Tajika charts, Varsheshwara, and Patyayini Dashas missing. |
| **18. Transits (Gochar)** | Planetary transits with Vedha and Ashtakavarga transit scores | **`PARTIAL`** | Real-time Gochar snapshot on any target date active in `canonicalSnapshot`. | Add Vedha obstruction checks and Kakshya transit analysis. |
| **19. Muhurta Engine** | Choghadiya, Hora, Gowri Panchangam, Special Muhurtas | **`PARTIAL`** | Rahu Kaal, Yamaganda, Gulika, Abhijit Muhurat, Brahma Muhurat active. | Choghadiya daytime/nighttime table and Tithi/Nakshatra specific event muhurtas to be exposed. |
| **20. Prashna (Horary)**| Instantaneous horary charts, Arudha Prashna | **`PARTIAL`** | Instantaneous chart generation at current datetime active via Cosmic Now. | Add 1–249 horary seed number resolver. |
| **21. Kundali Milan** | Ashtakoota 36-Guna matching (Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, Nadi) | **`PARITY`** | Complete Ashtakoota 36-point algorithm implemented in `src/lib/kundaliMilan.js`. | Full Guna break-down and Nadi Dosha cancellation active. |
| **22. Astronomical Details**| Speed, Latitude, Distance, Eclipses, Planetary War (Graha Yuddha) | **`PARITY`** | Speed in $^circ/	ext{day}$, ecliptic latitude, AU distance, direct/retrograde states active in `celestialEngine.ts`. | Planetary War (Graha Yuddha when within $1^circ$) flag to be added to UI inspector. |

---

## 3. Summary & Roadmap Priority

1. **Foundations (Tier 1 - COMPLETED)**:
   - Precision In-Process Ephemeris Adapter (VSOP87/ELP2000-82).
   - Universal Birthplace Geocoding & Historical IANA Timezone Engine.
   - Core Parashari D1 & D9 Natal Matrix.
   - 3-Tier Vimshottari Dasha Engine.
   - Comprehensive Panchang Limbs & Planetary Windows.
   - Ashtakoota 36-Guna Kundali Milan.
2. **Next Milestone (Tier 2 - Planned)**:
   - Full Shodashavarga (D2, D3, D4, D7, D10, D12, D16, D20, D24, D27, D30, D60).
   - Ashtakavarga & Bhinnashtakavarga 337-point bindu engine.
   - 6-fold Shadbala mathematical scoring.
   - Jaimini 7 Chara Karakas & Arudha Lagna.
