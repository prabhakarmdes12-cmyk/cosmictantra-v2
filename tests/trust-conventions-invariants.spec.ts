import { test, expect } from '@playwright/test';
import { CALCULATION_PRESETS, DEFAULT_PRESET } from '../src/lib/jyotish/conventionCenter';

test.describe('TRUST-08: Calculation Conventions & Invariants Specification', () => {

  test('1. Default Preset: Standard Parashari Alignment', () => {
    expect(DEFAULT_PRESET).toBeDefined();
    expect(DEFAULT_PRESET.id).toBe('COSMICTANTRA_STANDARD_PARASHARI');
    expect(DEFAULT_PRESET.ayanamsha).toBe('LAHIRI');
    expect(DEFAULT_PRESET.nodeMode).toBe('MEAN_NODE');
    expect(DEFAULT_PRESET.houseSystem).toBe('EQUAL_SIGN');
    expect(DEFAULT_PRESET.dashaScheme).toBe('VIMSHOTTARI_120');
  });

  test('2. Multiple Calculation Presets Available for Scholar Customization', () => {
    const presets = Object.keys(CALCULATION_PRESETS);
    expect(presets).toContain('COSMICTANTRA_STANDARD_PARASHARI');
    expect(presets).toContain('BV_RAMAN_CLASSICAL');
    expect(presets).toContain('KP_ASTROLOGY_STANDARD');

    // Verify KP system configuration
    const kp = CALCULATION_PRESETS.KP_ASTROLOGY_STANDARD;
    expect(kp.ayanamsha).toBe('KP');
    expect(kp.houseSystem).toBe('PLACIDUS');
    expect(kp.nodeMode).toBe('TRUE_NODE');
  });
});
