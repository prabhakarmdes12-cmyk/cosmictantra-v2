# NASA/JPL Horizons 7,000-Point Benchmark Evidence Audit

**Document ID**: `CT-JPL-BENCHMARK-AUDIT-2026`  
**Reference Source**: NASA/JPL Solar System Dynamics Horizons API (Version 1.2, Ephemeris DE441/DE431)  
**Endpoint**: `https://ssd.jpl.nasa.gov/api/horizons.api`  
**Coordinate Frame**: Geocentric Apparent Ecliptic of Date (IAU 1976/1980 True Equator and Equinox of Date)  
**Observer Origin**: Earth Center of Mass (`CENTER='500@399'`)  
**Physical Corrections**: Down-leg light-time delay, stellar aberration, relativistic gravitational deflection  
**Timescale**: UTC (with Espenak-Meeus $\Delta T$ reduction to TT)  
**Date Range**: 1850-01-01 to 2050-12-31 (200 Years)  
**Total Independent Evaluations**: 7,000 points (1,000 Timestamps $\times$ 7 Bodies)  
**Machine-Readable Dataset**: [`docs/jpl_benchmark_7000.csv`](file:///D:/Projects/Cosmic%20tantra%20AUGUST%202026/docs/jpl_benchmark_7000.csv)

---

## 1. Statistical Error Profile by Celestial Body

| Celestial Body | $N$ | Mean Absolute Error ($\mu$) | Median ($P_{50}$) | RMS Error | 95th Percentile ($P_{95}$) | 99th Percentile ($P_{99}$) | Maximum Error ($\text{Max}$) | Measured Precision Band |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Sun (Surya)** | 1,000 | **$0.82''$** ($0.0137'$) | $0.58''$ | $1.11''$ | $2.45''$ | $3.07''$ | **$4.32''$** ($0.0720'$) | **Sub-Arcsecond Class** |
| **Moon (Chandra)** | 1,000 | **$8.19''$** ($0.1365'$) | $2.93''$ | $13.35''$ | $32.43''$ | $38.61''$ | **$47.37''$** ($0.7895'$) | **Sub-Arcminute Class** |
| **Mercury (Budha)**| 1,000 | **$2.22''$** ($0.0370'$) | $1.89''$ | $2.85''$ | $5.72''$ | $7.94''$ | **$12.01''$** ($0.2002'$) | **Arcminute Class** |
| **Venus (Shukra)** | 1,000 | **$2.13''$** ($0.0355'$) | $1.39''$ | $3.27''$ | $7.12''$ | $12.44''$ | **$21.51''$** ($0.3585'$) | **Arcminute Class** |
| **Mars (Mangal)** | 1,000 | **$1.70''$** ($0.0283'$) | $1.21''$ | $2.45''$ | $4.93''$ | $9.94''$ | **$12.71''$** ($0.2118'$) | **Arcminute Class** |
| **Jupiter (Guru)** | 1,000 | **$2.68''$** ($0.0447'$) | $2.34''$ | $3.31''$ | $6.40''$ | $8.08''$ | **$10.24''$** ($0.1707'$) | **Arcminute Class** |
| **Saturn (Shani)** | 1,000 | **$3.16''$** ($0.0527'$) | $2.57''$ | $4.05''$ | $8.17''$ | $10.39''$ | **$13.04''$** ($0.2173'$) | **Arcminute Class** |

---

## 2. Rigorous Characterization of Engine Precision

> [!IMPORTANT]
> **Precision Statement**:
> 1. The Sun algorithm operates with sub-arcsecond fidelity (mean error $0.82''$, maximum error $4.32''$ across 200 years).
> 2. The Moon algorithm operates within sub-arcminute fidelity (mean error $8.19''$, maximum error $47.37''$ across 200 years).
> 3. The Planets (Mercury, Venus, Mars, Jupiter, Saturn) operate within arcminute fidelity (mean error $1.7''$ to $3.2''$, maximum error $\le 21.51''$).
> 4. In accordance with Invariant Q2, we explicitly describe the engine as **Arcminute-Class (Sub-Arcminute for Moon/Sun)**, refraining from claiming universal sub-arcsecond precision for outer planets.
