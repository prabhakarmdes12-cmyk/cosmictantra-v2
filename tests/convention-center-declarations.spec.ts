/**
 * REFERENCE-GRADE SPRINT B: Universal Convention Center declarations.
 * Guards the machine-readable wiring of docs/reference-grade/03-convention-registry.md
 * into src/lib/jyotish/conventionCenter.ts (CT_INV_003, CT_INV_004, CT_INV_006, CT_INV_008).
 * Pre-existing TRUST-08 preset contracts (tests/trust-conventions-invariants.spec.ts) remain authoritative.
 */
import { test, expect } from '@playwright/test';
import {
  CALCULATION_PRESETS,
  DEFAULT_PRESET,
  DECLARED_CONVENTIONS,
  DECLARED_CONVENTION_IDS,
  CONVENTION_REGISTRY_VERSION,
  ConventionError,
  buildConventionManifest,
  buildConventionSnapshotMetadata
} from '../src/lib/jyotish/conventionCenter';
import { buildConventionManifest as buildManifestAgain } from '../src/lib/jyotish/conventionCenter';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';

test.describe('SPRINT-B: Declared Convention Registry (CT_INV_004)', () => {

  test('all ten declared conventions from the registry document are present and stable', () => {
    expect(DECLARED_CONVENTION_IDS).toEqual([
      'AYANAMSHA', 'LUNAR_NODE_MODEL', 'HOUSE_SYSTEM', 'EPHEMERIS_PROVIDER', 'COORDINATE_MODE',
      'TIMEZONE_SOURCE', 'CALENDAR_SYSTEM', 'SUNRISE_CONVENTION', 'DASHA_CONVENTION', 'VARGA_CONVENTION'
    ]);
    for (const id of DECLARED_CONVENTION_IDS) {
      const decl = DECLARED_CONVENTIONS[id];
      expect(decl.id).toBe(id);
      expect(decl.adoptedValueId.length).toBeGreaterThan(0);
      expect(decl.sourceDoc).toBe('docs/reference-grade/03-convention-registry.md');
      expect(decl.sourceSection).toMatch(/§2\.\d+/);
    }
    // Registry-adopted standards:
    expect(DECLARED_CONVENTIONS.AYANAMSHA.adoptedValueId).toBe('LAHIRI_CHITRA_PAKSHA');
    expect(DECLARED_CONVENTIONS.LUNAR_NODE_MODEL.adoptedValueId).toBe('MEAN_NODE');
    expect(DECLARED_CONVENTIONS.HOUSE_SYSTEM.adoptedValueId).toBe('EQUAL_SIGN');
    expect(DECLARED_CONVENTIONS.DASHA_CONVENTION.adoptedValueId).toBe('VIMSHOTTARI_120');
    expect(DECLARED_CONVENTIONS.VARGA_CONVENTION.adoptedValueId).toBe('BPHS_SHODASHAVARGA');
    expect(CONVENTION_REGISTRY_VERSION).toBe('1.0.0');
  });

  test('default preset resolves to a manifest of exactly the standard, registry-backed selections', () => {
    const manifest = buildConventionManifest(DEFAULT_PRESET.id);
    expect(manifest.selections.length).toBe(10);
    for (const sel of manifest.selections) {
      expect(sel.isRegistryStandard).toBe(true);
      expect(sel.selectionBasis).toBe('REGISTRY_STANDARD');
    }
    expect(manifest.registryDoc).toContain('03-convention-registry.md');
  });

  test('manifest checksum is deterministic (CT_INV_007/008) — no timestamps inside the hash', () => {
    const a = buildConventionManifest();
    const b = buildManifestAgain();
    expect(a.manifestSha256).toBe(b.manifestSha256);
    expect(a.manifestSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  test('fail closed: unknown preset id throws typed ConventionError (CT_INV_006)', () => {
    try {
      buildConventionManifest('TOTALLY_UNKNOWN_PRESET');
      throw new Error('expected ConventionError');
    } catch (err) {
      expect(err).toBeInstanceOf(ConventionError);
      expect((err as ConventionError).code).toBe('CONVENTION_PRESET_UNKNOWN');
    }
  });

  test('KP preset may select TRUE_NODE/PLACIDUS only as EXPLICIT, labelled alternatives (CT_INV_003)', () => {
    const manifest = buildConventionManifest('KP_ASTROLOGY_STANDARD');
    const node = manifest.selections.find(s => s.conventionId === 'LUNAR_NODE_MODEL')!;
    const house = manifest.selections.find(s => s.conventionId === 'HOUSE_SYSTEM')!;
    const ayanamsha = manifest.selections.find(s => s.conventionId === 'AYANAMSHA')!;

    expect(node.adoptedValueId).toBe('TRUE_NODE');
    expect(node.isRegistryStandard).toBe(false);
    expect(node.selectionBasis).toBe('PRESET_EXPLICIT_ALTERNATIVE');
    expect(house.adoptedValueId).toBe('PLACIDUS');
    expect(ayanamsha.adoptedValueId).toBe('KRISHNAMURTI_KP');

    // The registry itself still declares MEAN_NODE as the adopted standard.
    expect(DECLARED_CONVENTIONS.LUNAR_NODE_MODEL.adoptedValueId).toBe('MEAN_NODE');
    expect(DECLARED_CONVENTIONS.LUNAR_NODE_MODEL.alternatives.some(a => a.valueId === 'TRUE_NODE' && a.usagePolicy === 'EXPLICIT_SELECTION_ONLY')).toBe(true);
  });

  test('fail closed: a preset cannot stamp an UNDECLARED dasha scheme (YOGINI_36/CHARA are RESERVED)', () => {
    // Direct resolver contract: the registry has no declaration for these yet.
    expect(DECLARED_CONVENTIONS.DASHA_CONVENTION.alternatives.find(a => a.valueId === 'YOGINI_36')?.usagePolicy).toBe('RESERVED_FUTURE');
    // The preset metadata still carries the field, but manifest building must refuse it.
    const rogue = { ...CALCULATION_PRESETS.BV_RAMAN_CLASSICAL, id: 'ROGUE', dashaScheme: 'YOGINI_36' as const };
    const presets = CALCULATION_PRESETS as Record<string, unknown>;
    presets['ROGUE'] = rogue;
    try {
      expect(() => buildConventionManifest('ROGUE')).toThrow(/NO registry declaration/);
    } finally {
      delete presets['ROGUE'];
    }
  });

  test('canonical chart snapshots carry the convention manifest + provider metadata (CT_INV_004)', () => {
    const snapshot = getCanonicalJyotishSnapshot({
      birthDate: '1990-08-17',
      birthTime: '03:45',
      latitude: 25.5941,
      longitude: 85.1376,
      timezone: 5.5,
      locationName: 'Patna, India'
    });
    const cr = snapshot.meta.conventionRegistry;
    expect(cr).toBeDefined();
    expect(cr!.presetId).toBe('COSMICTANTRA_STANDARD_PARASHARI');
    expect(cr!.selections.length).toBe(10);
    expect(cr!.manifestSha256).toBe(buildConventionManifest().manifestSha256);
    expect(snapshot.meta.astronomyProvider?.providerId).toBe('SWISS_EPHEMERIS_PROVIDER');
    expect(snapshot.meta.astronomyProvider?.kernel).toContain('astronomy-engine');
  });

  test('existing TRUST-08 preset surface is preserved untouched (no working-code regressions)', () => {
    expect(DEFAULT_PRESET.id).toBe('COSMICTANTRA_STANDARD_PARASHARI');
    expect(DEFAULT_PRESET.ayanamsha).toBe('LAHIRI');
    expect(DEFAULT_PRESET.nodeMode).toBe('MEAN_NODE');
    expect(DEFAULT_PRESET.houseSystem).toBe('EQUAL_SIGN');
    expect(Object.keys(CALCULATION_PRESETS)).toContain('KP_ASTROLOGY_STANDARD');
  });

  test('buildConventionSnapshotMetadata fails closed on unknown preset', () => {
    expect(() => buildConventionSnapshotMetadata('NOPE')).toThrow(ConventionError);
  });
});
