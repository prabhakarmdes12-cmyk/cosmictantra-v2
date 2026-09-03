# 03 — Convention Registry: Declared Computational Standards

**Date**: September 3, 2026  
**Status**: Authoritative Architectural Standard (CT_INV_004 Compliant)

---

## 1. Purpose & Mandate

Per **CT_INV_004 (DECLARED CONVENTIONS)**:
> *"Every chart declares relevant conventions including ayanamsha, node model, house model, ephemeris, coordinate mode, timezone source, calendar, sunrise convention, Dasha convention, and Varga convention. Never silently combine or swap conventions."*

This document serves as the immutable registry of declared conventions used in CosmicTantra.

---

## 2. The 10 Declared Conventions

### 1. Ayanamsha
- **Standard Adopted**: **Chitra Paksha (Lahiri) Ayanamsha**.
- **Definition**: The sidereal zodiac defined such that the fixed star Spica (Chitra / $\alpha$ Virginis) is positioned at exactly $180^\circ 00' 00''$ (the boundary between Kanya and Tula).
- **Epoch Reference**: Ayanamsha $= 23^\circ 51' 11''$ on Jan 1, 2000 (J2000.0).
- **Precession Rate**: ~50.290966 arcseconds per year.
- **Alternative Traditions (Reserved for Future Declarations)**: Krishnamurti (KP), Raman, Fagan-Bradley, Yukteshwar.

---

### 2. Lunar Node Model (Rahu & Ketu)
- **Standard Adopted**: **Mean Node (Madhyama Rahu)**.
- **Definition**: The mathematically smoothed mean intersection of the Moon's orbital plane with the ecliptic.
- **Opposition Rule**: Ketu is permanently and strictly positioned at $\text{Rahu} + 180^\circ \pmod{360^\circ}$.
- **Motion**: Strictly retrograde.
- **Future Extensibility**: True Node (Spashta Rahu) option will be made explicitly configurable with clear labeling.

---

### 3. House System (Bhava Cusp Model)
- **Standard Adopted**: **Equal House System (Sama Bhava) from Ascendant**.
- **Definition**:
  - Bhava 1 Cusp $= \text{Ascendant (Lagna Longitude)}$.
  - Bhava $N$ Cusp $= \text{Ascendant} + (N - 1) \times 30^\circ \pmod{360^\circ}$.
- **Whole Sign Overlay**: For sign-based Parashari aspects and yogas, the entire sign containing the Lagna is treated as the 1st House.
- **Alternative Supported**: Sripati / Porphyry (Bhava Chalit cusps computed from MC and Ascendant).

---

### 4. Ephemeris Provider
- **Production Standard**: **Swiss Ephemeris / Moshier High-Precision Mathematical Kernel**.
- **Coordinate Basis**: Planetary positions calculated using perturbation series derived from VSOP87 and ELP2000-82.
- **Reference Standard for Verification**: JPL Horizons on-demand reference benchmarks.

---

### 5. Coordinate Mode
- **Standard Adopted**: **Geocentric Ecliptic Longitude (Nirayana)**.
- **Observation Point**: Center of the Earth (standard for classical Parashari Jyotisha).
- **Aberration & Light-Time**: Classical geometric positions with planetary aberration accounted for.

---

### 6. Timezone & Geocoding Source
- **Standard Adopted**: **Canonical Indian City Database + IANA Timezone Engine**.
- **Precision**: Latitude and Longitude to 4 decimal places ($\approx 11$ meters precision).
- **Timezone Anchor**: Standard Indian Time (UTC+05:30) for Indian territories; exact historical offsets for global locations.
- **Coherence Gate (Gate 1c)**: Euclidean distance between city name and provided coordinates must satisfy $\Delta \le 1.5^\circ$.

---

### 7. Calendar System
- **Standard Adopted**: **Gregorian Civil Calendar with Julian Day Ephemeris Computation**.
- **Internal Time**: UTC timestamp with explicit timezone offset in hours (`utcOffsetHours`).
- **Panchanga Alignment**: Luni-solar calendar (Amanta month by default, with Purnimanta toggle for North Indian traditions).

---

### 8. Sunrise & Daylight Convention
- **Standard Adopted**: **Center of Solar Disc on Local Apparent Horizon**.
- **Daylight Division**: Day is measured from sunrise to sunset; Night is measured from sunset to following sunrise.
- **Dinardha (Solar Noon)**: Exact midpoint between local sunrise and sunset.
- **Muhurta Units**: 1 Muhurta $= 1/15\text{th}$ of daytime/nighttime duration.

---

### 9. Dasha Convention
- **Standard Adopted**: **Vimshottari Dasha (120-Year Cycle)**.
- **Nakshatra Basis**: Janma Nakshatra determined by Nirayana Moon longitude.
- **Year Definition**: Standard Solar Gregorian Year ($365.2422$ days per year).
- **Sequence**: Ketu (7y) $\to$ Venus (20y) $\to$ Sun (6y) $\to$ Moon (10y) $\to$ Mars (7y) $\to$ Rahu (18y) $\to$ Jupiter (16y) $\to$ Saturn (19y) $\to$ Mercury (17y).
- **Balance Proportion**:
  $$\text{Balance fraction} = \frac{\text{Nakshatra End Longitude} - \text{Moon Longitude}}{13^\circ 20'}$$

---

### 10. Divisional Chart (Varga) Convention
- **Standard Adopted**: **Brihat Parashara Hora Shastra (BPHS) Shodashavarga**.
- **D1 (Rashi)**: Direct 30° zodiacal division.
- **D9 (Navamsha)**: 3°20' division starting from Mesha for Chara signs, Simha for Sthira signs, Dhanu for Dwisvabhava signs.
- **D10 (Dashamsha)**: 3°00' division starting from the same sign for Odd signs, and from the 9th sign from it for Even signs.
