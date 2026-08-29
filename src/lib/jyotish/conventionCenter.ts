/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Convention Center & Calculation Presets
 * Manages selectable astronomical and astrological traditions with immutable metadata stamping.
 * Complies with Programs 14, 15 and Checkpoint TRUST-08.
 */

export interface CalculationPreset {
  id: string;
  name: string;
  sanskritName: string;
  description: string;
  ayanamsha: 'LAHIRI' | 'RAMAN' | 'KP' | 'TROPICAL';
  nodeMode: 'MEAN_NODE' | 'TRUE_NODE';
  houseSystem: 'EQUAL_SIGN' | 'SRI_PATI' | 'PLACIDUS';
  dashaScheme: 'VIMSHOTTARI_120' | 'YOGINI_36' | 'CHARA';
  sunriseReckoning: 'TOPOCENTRIC_REFRACTED' | 'GEOMETRIC_CENTER' | 'UPPER_LIMB';
}

export const CALCULATION_PRESETS: Record<string, CalculationPreset> = {
  COSMICTANTRA_STANDARD_PARASHARI: {
    id: 'COSMICTANTRA_STANDARD_PARASHARI',
    name: 'CosmicTantra Standard Parashari',
    sanskritName: 'पाराशरी मानक पद्धति',
    description: 'Chitra Paksha (Lahiri) Ayanamsha, Mean Lunar Nodes, Whole Equal Sign houses, and 120-Year Vimshottari Dasha.',
    ayanamsha: 'LAHIRI',
    nodeMode: 'MEAN_NODE',
    houseSystem: 'EQUAL_SIGN',
    dashaScheme: 'VIMSHOTTARI_120',
    sunriseReckoning: 'TOPOCENTRIC_REFRACTED'
  },
  BV_RAMAN_CLASSICAL: {
    id: 'BV_RAMAN_CLASSICAL',
    name: 'B.V. Raman Classical Tradition',
    sanskritName: 'डॉ. बी. वी. रमण पद्धति',
    description: 'B.V. Raman Ayanamsha with traditional Parashari whole sign houses.',
    ayanamsha: 'RAMAN',
    nodeMode: 'MEAN_NODE',
    houseSystem: 'EQUAL_SIGN',
    dashaScheme: 'VIMSHOTTARI_120',
    sunriseReckoning: 'TOPOCENTRIC_REFRACTED'
  },
  KP_ASTROLOGY_STANDARD: {
    id: 'KP_ASTROLOGY_STANDARD',
    name: 'Krishnamurti Paddhati (KP System)',
    sanskritName: 'कृष्णमूर्ति पद्धति',
    description: 'KP Ayanamsha, Placidus semi-arc unequal house cusps, and True Lunar Nodes.',
    ayanamsha: 'KP',
    nodeMode: 'TRUE_NODE',
    houseSystem: 'PLACIDUS',
    dashaScheme: 'VIMSHOTTARI_120',
    sunriseReckoning: 'TOPOCENTRIC_REFRACTED'
  }
};

export const DEFAULT_PRESET = CALCULATION_PRESETS.COSMICTANTRA_STANDARD_PARASHARI;
