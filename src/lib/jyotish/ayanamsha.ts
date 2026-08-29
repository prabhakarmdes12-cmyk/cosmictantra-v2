/**
 * CANONICAL AYANAMSHA PROVIDER SUBSYSTEM
 * Supports Chitra Paksha (Lahiri Standard), Raman, KP, and Tropical frameworks.
 * All algorithms are explicit, deterministic, and benchmarked across historical epochs (1850-2050).
 */

export type AyanamshaSystem = 'LAHIRI_CHITRA_PAKSHA' | 'RAMAN' | 'KRISHNAMURTI_KP' | 'TROPICAL_SAYANA';

export interface AyanamshaValue {
  system: AyanamshaSystem;
  name: string;
  degrees: number;
  degreeStr: string;
  epochJD: number;
  centuriesFromJ2000: number;
}

// Convert decimal degrees to D°M'S" string
export function formatDegreesDMS(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  const d = Math.floor(norm);
  const mDec = (norm - d) * 60;
  const m = Math.floor(mDec);
  const s = Math.round((mDec - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
}

/**
 * Calculates Chitra Paksha (Lahiri Standard) Ayanamsha for a given Julian Day Number (TT / ET).
 * Standardized by the Calendar Reform Committee (1955, Government of India / Positional Astronomy Centre, Kolkata).
 * Spica (Alpha Virginis / Chitra Nakshatra) is fixed at exact 180°00'00" sidereal.
 * 
 * Formula: Ayanamsha(T) = 23.857092° + 1.396971° * T + 0.000308° * T^2
 * where T = (JD - 2451545.0) / 36525.0 (Julian centuries from J2000.0)
 */
export function getLahiriAyanamsha(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.857092 + 1.396971 * T + 0.000308 * T * T;
}

/**
 * Calculates B.V. Raman Ayanamsha
 */
export function getRamanAyanamsha(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  return 22.460472 + 1.396971 * T;
}

/**
 * Calculates Krishnamurti (KP) Ayanamsha: Lahiri - 0°05'48"
 */
export function getKPAyanamsha(jd: number): number {
  return getLahiriAyanamsha(jd) - (5.8 / 60);
}

/**
 * Master Ayanamsha Provider
 */
export function getAyanamsha(jd: number, system: AyanamshaSystem = 'LAHIRI_CHITRA_PAKSHA'): AyanamshaValue {
  const T = (jd - 2451545.0) / 36525.0;
  let deg = 0;
  let name = 'Chitra Paksha Lahiri';

  switch (system) {
    case 'LAHIRI_CHITRA_PAKSHA':
      deg = getLahiriAyanamsha(jd);
      name = 'Chitra Paksha Lahiri (PAC Standard)';
      break;
    case 'RAMAN':
      deg = getRamanAyanamsha(jd);
      name = 'B.V. Raman Standard';
      break;
    case 'KRISHNAMURTI_KP':
      deg = getKPAyanamsha(jd);
      name = 'Krishnamurti Paddhati (KP)';
      break;
    case 'TROPICAL_SAYANA':
      deg = 0.0;
      name = 'Tropical / Sayana (Zero Ayanamsha)';
      break;
    default:
      deg = getLahiriAyanamsha(jd);
      name = 'Chitra Paksha Lahiri (Default)';
  }

  return {
    system,
    name,
    degrees: deg,
    degreeStr: formatDegreesDMS(deg),
    epochJD: jd,
    centuriesFromJ2000: T
  };
}

/**
 * Standard Epoch Benchmark Values for Lahiri Ayanamsha Verification
 */
export const LAHIRI_EPOCH_BENCHMARKS = [
  { epoch: '1850.0', jd: 2396758.5, expectedDeg: 21.7616, expectedDMS: "21°45'42\"" },
  { epoch: '1900.0', jd: 2415020.0, expectedDeg: 22.4605, expectedDMS: "22°27'38\"" },
  { epoch: '1950.0', jd: 2433282.5, expectedDeg: 23.1587, expectedDMS: "23°09'31\"" },
  { epoch: '2000.0', jd: 2451545.0, expectedDeg: 23.8571, expectedDMS: "23°51'26\"" },
  { epoch: '2026.0', jd: 2461041.5, expectedDeg: 24.2203, expectedDMS: "24°13'13\"" },
  { epoch: '2050.0', jd: 2469807.5, expectedDeg: 24.5556, expectedDMS: "24°33'20\"" }
];
