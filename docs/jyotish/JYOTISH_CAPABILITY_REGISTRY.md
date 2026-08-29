# JYOTISH CAPABILITY REGISTRY

**Project:** CosmicTantra (Chiti Technologies)  
**Evaluation Scope:** Complete Functional & Mathematical Capability Inventory  
**Date:** August 29, 2026  

---

## 1. Classification Methodology

Every discovered astrological calculation capability has been strictly verified against source files, runtime call graphs, and test suites, categorized into one of 9 canonical statuses:

1. **`IMPLEMENTED_AND_USED`**: Valid algorithm actively called in production UI/API routes.
2. **`IMPLEMENTED_NOT_USED`**: Valid algorithm implemented in `src/lib/` or `src/engines/` but not exposed in user-facing UI.
3. **`IMPLEMENTED_DUPLICATED`**: Implemented in multiple competing files with potential divergence.
4. **`IMPLEMENTED_UNVERIFIED`**: Implemented but lacking unit tests or golden corpus validation.
5. **`PARTIAL`**: Core math exists, but missing sub-calculations (e.g. D9 math exists, but no divisional chart rendering).
6. **`UI_ONLY`**: Visual UI controls exist without backing calculation logic.
7. **`MOCK`**: Returns static fixture values.
8. **`DEAD_CODE`**: Obsolete or unreferenced files.
9. **`MISSING`**: Capability expected in professional software but completely absent.

---

## 2. Complete Capability Inventory Matrix

| # | Capability | Implementation File | Mathematical Source / Method | Called By | Runtime Active? | Unit Tests? | Duplicate? | Confidence | Status |
|---|:---|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | **Julian Day (JD)** | `src/lib/astrologyEngine.js:174` | Time ms $\rightarrow$ UTC Julian Day | `calculateKundali`, `panchang.js` | YES | YES (`astrology.spec.ts`) | YES (`engines/panchang.js`) | HIGH | **IMPLEMENTED_DUPLICATED** |
| 2 | **Lahiri Ayanamsha** | `src/lib/astrologyEngine.js:183` | Chitra Paksha ($23.856^\circ + 1.396 T$) | `calculateKundali`, `toSidereal` | YES | YES | YES (`lib/panchang.js`, `engines/panchang.js`) | HIGH | **IMPLEMENTED_DUPLICATED** |
| 3 | **Ascendant / Lagna** | `src/lib/astrologyEngine.js:215` | LST + Obliquity + Tan(Lat) | `calculateKundali`, Kundali UI | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 4 | **Sun Sidereal Longitude**| `src/lib/astrologyEngine.js:307` | Keplerian mean anomaly + Eq of Center | `calculateKundali` | YES | YES | YES (`lib/panchang.js`, `engines/panchang.js`) | HIGH | **IMPLEMENTED_DUPLICATED** |
| 5 | **Moon Sidereal Longitude**| `src/lib/astrologyEngine.js:308` | Evection/Variation perturbation model | `calculateKundali` | YES | YES | YES (3 competing implementations) | MEDIUM | **IMPLEMENTED_DUPLICATED** |
| 6 | **Mars / Mercury / Jupiter / Venus / Saturn** | `src/lib/astrologyEngine.js:309-313` | Sidereal planetary orbits + perturbation | `calculateKundali` | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 7 | **Rahu / Ketu (Mean Nodes)**| `src/lib/astrologyEngine.js:314` | $290.0^\circ - 0.05295^\circ d - \text{Ayan}$ | `calculateKundali` | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 8 | **Rashi & Degree in Sign** | `src/lib/astrologyEngine.js:192` | $\lfloor \lambda / 30 \rfloor$, $\lambda \% 30$ | `calculateKundali` | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 9 | **Nakshatra & Pada** | `src/lib/astrologyEngine.js:200` | $13^\circ 20'$ & $3^\circ 20'$ segmentation | `calculateKundali`, Panchang | YES | YES | YES | HIGH | **IMPLEMENTED_DUPLICATED** |
| 10 | **Planetary Dignity** | `src/lib/astrologyEngine.js:102` | Exalted, Debilitated, Moolatrikona, Own | `calculateKundali`, Chart UI | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 11 | **12 Bhavas (Equal House)**| `src/lib/astrologyEngine.js:380` | Equal sign bhava from Lagna Rashi | `calculateKundali`, Chart UI | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 12 | **Bhava Chalit / Sripati Cusps** | *None* | Sripati / Porphyry unequal cusps | *None* | NO | NO | NO | ZERO | **MISSING** |
| 13 | **Tithi (Instantaneous)** | `src/lib/panchang.js:149` | $(\lambda_{Moon} - \lambda_{Sun}) / 12^\circ$ | Panchang UI, TodayAtAGlance | YES | YES | YES (Defective in `engines/panchang`) | MEDIUM | **IMPLEMENTED_DUPLICATED** |
| 14 | **Tithi (Udaya at Sunrise)** | `src/engines/monthlyPanchangEngine.ts` | Sunrise-prevailing lunar day | Monthly Calendar | YES | NO | NO | MEDIUM | **PARTIAL** |
| 15 | **Nitya Yoga** | `src/lib/panchang.js:163` | $(\lambda_{Sun} + \lambda_{Moon}) / 13^\circ 20'$ | Panchang, Cosmic Now | YES | YES | YES | HIGH | **IMPLEMENTED_DUPLICATED** |
| 16 | **Karana** | `src/lib/panchang.js:170` | Half-tithi ($6^\circ$) movable/fixed | Panchang, Cosmic Now | YES | YES | YES | HIGH | **IMPLEMENTED_DUPLICATED** |
| 17 | **Sunrise & Sunset** | `src/lib/panchang.js:89` | Solar declination + Eq of Time + Refraction | `lib/panchang.js` | YES | YES | YES (Hardcoded 6AM in `engines/panchang`) | HIGH | **IMPLEMENTED_DUPLICATED** |
| 18 | **Rahu Kaal / Yamaganda / Gulika** | `src/lib/panchang.js:128` | 8-fold daytime division | Panchang, Daily Cards | YES | YES | YES | HIGH | **IMPLEMENTED_DUPLICATED** |
| 19 | **Abhijit / Brahma / Amrit Muhurat** | `src/engines/monthlyPanchangEngine.ts` | Dinamana segment calculation | AuraMonthlyCalendar | YES | NO | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 20 | **Vimshottari Mahadashas**| `src/lib/dashaEngine.js:19` | 120-year cycle from Moon Nakshatra | DashaHero, Interpretations | YES | YES | YES (`engines/dashaEngine.js`) | HIGH | **IMPLEMENTED_DUPLICATED** |
| 21 | **Vimshottari Antardashas** | `src/lib/dashaEngine.js:53` | $(M_{yrs} \times A_{yrs}) / 120$ | DashaHero, Interpretations | YES | YES | YES | HIGH | **IMPLEMENTED_DUPLICATED** |
| 22 | **Vimshottari Pratyantardasha** | `src/lib/dashaEngine.js:65` | $(A_{yrs} \times P_{yrs}) / 120$ | DashaHero, Consultations | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 23 | **Navamsha (D9) Math** | `src/lib/astrologyEngine.js` | $3^\circ 20'$ harmonic divisional rashi | Internal helpers | NO | NO | NO | HIGH | **IMPLEMENTED_NOT_USED** |
| 24 | **Dashamsha (D10) Math** | *None* | $3^\circ 00'$ 10th harmonic division | *None* | NO | NO | NO | ZERO | **MISSING** |
| 25 | **Shodashavarga (16 Divisional Charts)**| *None* | D2 to D60 harmonic tables | *None* | NO | NO | NO | ZERO | **MISSING** |
| 26 | **Ashtakavarga (BAV & SAV)** | *None* | 337 benefic points matrix | *None* | NO | NO | NO | ZERO | **MISSING** |
| 27 | **Shadbala (6-Fold Strength)** | *None* | Sthana, Dig, Kala, Chesta, Naisargika, Drik | *None* | NO | NO | NO | ZERO | **MISSING** |
| 28 | **Ashtakoota Milan (36 Gunas)** | `src/lib/kundaliMilan.js` | Complete 8 Kootas formula | KundaliMilanTool | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 29 | **Tara Bala (9 Stars Energy)** | `src/lib/interpretationEngine.ts:25` | $(N_{transit} - N_{natal} + 27) \% 9$ | Daily Horizon, Cosmic Now | YES | YES | YES | HIGH | **IMPLEMENTED_DUPLICATED** |
| 30 | **Chandra Bala (Transit Moon House)** | `src/lib/interpretationEngine.ts:38` | $((R_{transit} - R_{natal} + 12) \% 12) + 1$ | Daily Horizon, Personal Calendar | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 31 | **Sade Sati Calculation** | `src/lib/interpretationEngine.ts:510` | Saturn transit in 12th, 1st, 2nd from Moon | Annual Forecast | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 32 | **Manglik Dosha Detection** | `src/components/KundaliExperience.jsx` | Mars in 1st, 4th, 7th, 8th, 12th houses | Kundali Experience | YES | NO | NO | MEDIUM | **IMPLEMENTED_UNVERIFIED** |
| 33 | **Gochar / Transits** | `src/lib/interpretationEngine.ts` | Real-time planet transit over natal houses | Daily, Weekly, Monthly, Yearly | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 34 | **Tajika Varshaphal / Muntha**| `src/lib/interpretationEngine.ts:470` | $(Lagna + Age) \% 12$ Muntha calculation | Annual Forecast | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 35 | **North Indian Diamond Chart UI** | `src/components/NorthIndianChart.jsx` | SVG 12-house diamond layout | Kundali Experience | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 36 | **South Indian Grid Chart UI** | *None* | Square fixed-sign 12-box grid | *None* | NO | NO | NO | ZERO | **MISSING** |
| 37 | **Vedic Numerology Engine** | `src/lib/numerology.js` | Cheiro / Chaldean root numbers | NumerologyCalculator | YES | YES | NO | HIGH | **IMPLEMENTED_AND_USED** |
| 38 | **City Geolocation Resolver** | `src/lib/location.ts` | 516 cities + Haversine nearest search | Onboarding, Kundli, Cosmic Now | YES | YES | YES (`location.js`, `cities.js`) | HIGH | **IMPLEMENTED_DUPLICATED** |
