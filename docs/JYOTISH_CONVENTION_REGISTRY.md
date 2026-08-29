# Jyotish Calculation Convention Registry

**Document ID**: `CT-CONVENTION-REGISTRY-2026`  
**Compliance Standard**: Explicit modeling of all classical variations.

---

## 1. Supported Calculation Conventions

### 1.1 Ayanamsha Systems
- **`LAHIRI_CHITRA_PAKSHA` (Default)**: Official Government of India / Calendar Reform Committee standard. Fixed star Spica (Chitra) at $180^circ00'00''$. Epoch 2000.0 value $approx 23^circ51'25.5''$.
- **`RAMAN`**: Dr. B.V. Raman system. Base epoch 397 AD $= 0^circ$.
- **`KRISHNAMURTI_KP`**: K.S. Krishnamurti standard for KP sub-lord system.
- **`TROPICAL_SAYANA`**: Zero Ayanamsha for Western / Sayana comparative calculations.

### 1.2 Lunar Node Calculation Modes
- **`MEAN_NODE` (माध्य राहु)**: Uniform astronomical regression rate of lunar ascending node ($approx -19.34^circ/	ext{year}$).
- **`TRUE_NODE` (स्पष्ट राहु)**: Instantaneous osculating orbital node accounting for lunar gravitational perturbations.

### 1.3 House (Bhava) Systems
- **`EQUAL_SIGN_SYSTEM` (Default)**: Whole sign houses from Lagna Rashi. (1st house = Entire Lagna Rashi).
- **`SRI_PATI_PORPHYRY`**: Midheaven (10th house cusp) and Ascendant (1st house cusp) with trisection of intermediate quadrants.
- **`PLACIDUS`**: Semi-diurnal arc division used in Krishnamurti (KP) system.

### 1.4 Sunrise Reference
- **`TOPOCENTRIC_APPARENT_EDGE` (Default)**: Apparent topocentric upper limb of Sun with standard atmospheric refraction ($34'$ refraction $+ 16'$ solar semidiameter $= 50' = 0.8333^circ$ horizon depression).

### 1.5 Planetary Maitri & Dignity Definitions
- **Natural Friendship (Naisargika Maitri)**: Classic Brihat Parashara Hora Shastra (BPHS) Chapter 15 matrix.
- **Temporal Friendship (Tatkalika Maitri)**: Planets in 2nd, 3rd, 4th, 10th, 11th, 12th from each other are temporary friends; others are temporary enemies.
- **Five-Fold Compound Friendship (Panchadha Maitri)**:
  - Friend + Friend = Great Friend (Ati Mitra)
  - Friend + Neutral / Neutral + Friend = Friend (Mitra)
  - Friend + Enemy / Enemy + Friend / Neutral + Neutral = Neutral (Sama)
  - Enemy + Neutral / Neutral + Enemy = Enemy (Shatru)
  - Enemy + Enemy = Bitter Enemy (Ati Shatru)
