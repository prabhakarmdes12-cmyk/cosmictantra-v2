/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Convention Center & Calculation Presets
 * Manages selectable astronomical and astrological traditions with immutable metadata stamping.
 * Complies with Programs 14, 15 and Checkpoint TRUST-08.
 *
 * Sprint B (Mission Section 41 / CT_INV_004 DECLARED CONVENTIONS):
 * The ten Declared Conventions from docs/reference-grade/03-convention-registry.md are now
 * machine-readable below (DECLARED_CONVENTIONS). Every chart snapshot can carry a
 * ConventionManifest produced by buildConventionManifest(presetId) — deterministic,
 * checksummed, and fail-closed: unknown presets or unregistered alternatives throw
 * ConventionError instead of silently choosing a convention (CT_INV_003 / CT_INV_006).
 */

import * as crypto from 'crypto';

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

/* ========================================================================= */
/* SPRINT B: DECLARED CONVENTION REGISTRY (CT_INV_004)                        */
/* Source of truth: docs/reference-grade/03-convention-registry.md            */
/* ========================================================================= */

export const CONVENTION_REGISTRY_VERSION = '1.0.0';
export const CONVENTION_REGISTRY_DOC = 'docs/reference-grade/03-convention-registry.md';

export type DeclaredConventionId =
  | 'AYANAMSHA'
  | 'LUNAR_NODE_MODEL'
  | 'HOUSE_SYSTEM'
  | 'EPHEMERIS_PROVIDER'
  | 'COORDINATE_MODE'
  | 'TIMEZONE_SOURCE'
  | 'CALENDAR_SYSTEM'
  | 'SUNRISE_CONVENTION'
  | 'DASHA_CONVENTION'
  | 'VARGA_CONVENTION';

export const DECLARED_CONVENTION_IDS: readonly DeclaredConventionId[] = [
  'AYANAMSHA', 'LUNAR_NODE_MODEL', 'HOUSE_SYSTEM', 'EPHEMERIS_PROVIDER', 'COORDINATE_MODE',
  'TIMEZONE_SOURCE', 'CALENDAR_SYSTEM', 'SUNRISE_CONVENTION', 'DASHA_CONVENTION', 'VARGA_CONVENTION'
];

export interface DeclaredConventionAlternative {
  valueId: string;
  label: string;
  /** How this alternative may be used. EXPLICIT_SELECTION_ONLY forbids silent adoption. */
  usagePolicy: 'RESERVED_FUTURE' | 'EXPLICIT_SELECTION_ONLY';
  note: string;
}

export interface DeclaredConvention {
  id: DeclaredConventionId;
  name: string;
  adoptedValueId: string;
  adoptedLabel: string;
  definition: string;
  sourceDoc: string;
  sourceSection: string;
  alternatives: DeclaredConventionAlternative[];
  /** Registry-wide status of the declaration itself. */
  status: 'ADOPTED' | 'ADOPTED_WITH_OPEN_ITEM';
  notes: string[];
}

export const DECLARED_CONVENTIONS: Record<DeclaredConventionId, DeclaredConvention> = {
  AYANAMSHA: {
    id: 'AYANAMSHA',
    name: 'Ayanamsha',
    adoptedValueId: 'LAHIRI_CHITRA_PAKSHA',
    adoptedLabel: 'Chitra Paksha (Lahiri)',
    definition:
      'Sidereal zodiac defined so that Spica (Chitra, alpha Virginis) sits at exactly 180°00\'00". ' +
      'Registry epoch reference: ayanamsha = 23°51\'11" at J2000.0; precession ~50.290966"/yr.',
    sourceDoc: CONVENTION_REGISTRY_DOC,
    sourceSection: '§2.1 Ayanamsha',
    alternatives: [
      { valueId: 'KRISHNAMURTI_KP', label: 'Krishnamurti (KP)', usagePolicy: 'EXPLICIT_SELECTION_ONLY', note: 'Available via KP preset; never mixed silently.' },
      { valueId: 'RAMAN', label: 'B.V. Raman', usagePolicy: 'EXPLICIT_SELECTION_ONLY', note: 'Available via B.V. Raman preset.' },
      { valueId: 'TROPICAL_SAYANA', label: 'Tropical / Sayana', usagePolicy: 'EXPLICIT_SELECTION_ONLY', note: 'Zero ayanamsha mode; explicit selection only.' },
      { valueId: 'YUKTESHWAR', label: 'Yukteshwar', usagePolicy: 'RESERVED_FUTURE', note: 'Reserved by registry; not yet configurable.' },
      { valueId: 'FAGAN_BRADLEY', label: 'Fagan-Bradley', usagePolicy: 'RESERVED_FUTURE', note: 'Reserved by registry; not yet configurable.' }
    ],
    status: 'ADOPTED_WITH_OPEN_ITEM',
    notes: [
      'OPEN ITEM (RSK_009): the working engine constant at J2000 is 23°51\'25.5" (23.857092°), ~14.5" above the registry-declared 23°51\'11". Surfaced by the qualification harness (AYANAMSHA_EPOCH_DECLARED_VS_IMPLEMENTED); reconciliation is a Sprint C scholar-reviewed change, not a silent edit.'
    ]
  },
  LUNAR_NODE_MODEL: {
    id: 'LUNAR_NODE_MODEL',
    name: 'Lunar Node Model (Rahu & Ketu)',
    adoptedValueId: 'MEAN_NODE',
    adoptedLabel: 'Mean Node (Madhyama Rahu)',
    definition:
      'Mathematically smoothed mean intersection of the Moon\'s orbital plane with the ecliptic. ' +
      'Ketu is permanently and strictly Rahu + 180° (mod 360°). Motion strictly retrograde.',
    sourceDoc: CONVENTION_REGISTRY_DOC,
    sourceSection: '§2.2 Lunar Node Model',
    alternatives: [
      { valueId: 'TRUE_NODE', label: 'True Node (Spashta Rahu)', usagePolicy: 'EXPLICIT_SELECTION_ONLY', note: 'Configurable with clear labeling (e.g. KP preset); never a silent default.' }
    ],
    status: 'ADOPTED',
    notes: []
  },
  HOUSE_SYSTEM: {
    id: 'HOUSE_SYSTEM',
    name: 'House System (Bhava Cusp Model)',
    adoptedValueId: 'EQUAL_SIGN',
    adoptedLabel: 'Equal House (Sama Bhava) from Ascendant with whole-sign overlay',
    definition:
      'Bhava 1 cusp = Ascendant; Bhava N cusp = Ascendant + (N-1)×30° (mod 360°). For sign-based ' +
      'Parashari aspects and yogas the entire sign containing the Lagna is the 1st house.',
    sourceDoc: CONVENTION_REGISTRY_DOC,
    sourceSection: '§2.3 House System',
    alternatives: [
      { valueId: 'SRI_PATI', label: 'Sripati / Porphyry (Bhava Chalit)', usagePolicy: 'EXPLICIT_SELECTION_ONLY', note: 'Supported alternative: cusps derived from MC and Ascendant.' },
      { valueId: 'PLACIDUS', label: 'Placidus semi-arc', usagePolicy: 'EXPLICIT_SELECTION_ONLY', note: 'Used by the KP preset only.' }
    ],
    status: 'ADOPTED',
    notes: []
  },
  EPHEMERIS_PROVIDER: {
    id: 'EPHEMERIS_PROVIDER',
    name: 'Ephemeris Provider',
    adoptedValueId: 'ASTRONOMY_ENGINE_VSOP87_ELP2000',
    adoptedLabel: 'In-process Moshier-class VSOP87 / ELP2000-82 kernel (astronomy-engine), production reference provider named SwissEphemerisProvider per mission charter',
    definition:
      'Geocentric apparent ecliptic-of-date planetary positions from perturbation series derived from ' +
      'VSOP87 and ELP2000-82. Independent verification target: JPL Horizons reference benchmarks.',
    sourceDoc: CONVENTION_REGISTRY_DOC,
    sourceSection: '§2.4 Ephemeris Provider',
    alternatives: [
      { valueId: 'JPL_HORIZONS_REFERENCE', label: 'JPL Horizons (verification reference)', usagePolicy: 'RESERVED_FUTURE', note: 'Sprint C wires the JplReferenceProvider adapter; today it fails closed.' }
    ],
    status: 'ADOPTED_WITH_OPEN_ITEM',
    notes: [
      'The registry names Swiss Ephemeris / Moshier kernel as the production standard. The provider descriptor discloses the exact kernel in use; Swiss parity is proven (or not) by Sprint C mass qualification before any external-verification claim (CT_INV_005).'
    ]
  },
  COORDINATE_MODE: {
    id: 'COORDINATE_MODE',
    name: 'Coordinate Mode',
    adoptedValueId: 'GEOCENTRIC_ECLIPTIC_NIRAYANA',
    adoptedLabel: 'Geocentric ecliptic longitude (Nirayana), apparent positions',
    definition:
      'Observation point: centre of the Earth (classical Parashari standard). Apparent positions: ' +
      'light-time and planetary aberration accounted for.',
    sourceDoc: CONVENTION_REGISTRY_DOC,
    sourceSection: '§2.5 Coordinate Mode',
    alternatives: [
      { valueId: 'TOPOCENTRIC_ECLIPTIC', label: 'Topocentric ecliptic', usagePolicy: 'RESERVED_FUTURE', note: 'Reserved; would require explicit re-declaration.' }
    ],
    status: 'ADOPTED',
    notes: []
  },
  TIMEZONE_SOURCE: {
    id: 'TIMEZONE_SOURCE',
    name: 'Timezone & Geocoding Source',
    adoptedValueId: 'INDIAN_CITY_DB_IANA',
    adoptedLabel: 'Canonical Indian city database + IANA timezone engine',
    definition:
      'Latitude/longitude to 4 decimal places (~11 m). Standard Indian Time (UTC+05:30) for Indian ' +
      'territories; exact historical offsets for global locations. Coherence Gate 1c: city/coordinate ' +
      'distance must satisfy Δ ≤ 1.5°.',
    sourceDoc: CONVENTION_REGISTRY_DOC,
    sourceSection: '§2.6 Timezone & Geocoding Source',
    alternatives: [
      { valueId: 'DEVICE_GPS', label: 'Device GPS with reverse geocoding', usagePolicy: 'EXPLICIT_SELECTION_ONLY', note: 'Flows through the same Gate 1c coherence checks.' }
    ],
    status: 'ADOPTED',
    notes: []
  },
  CALENDAR_SYSTEM: {
    id: 'CALENDAR_SYSTEM',
    name: 'Calendar System',
    adoptedValueId: 'GREGORIAN_JULIAN_DAY',
    adoptedLabel: 'Gregorian civil calendar with Julian-day ephemeris computation',
    definition:
      'Internal time is UTC with an explicit timezone offset (utcOffsetHours). Panchanga alignment is ' +
      'luni-solar: Amanta month by default with Purnimanta toggle for North Indian traditions.',
    sourceDoc: CONVENTION_REGISTRY_DOC,
    sourceSection: '§2.7 Calendar System',
    alternatives: [
      { valueId: 'PURNA_MONTH_SYSTEM', label: 'Purnimanta month reckoning', usagePolicy: 'EXPLICIT_SELECTION_ONLY', note: 'Declared toggle for North Indian traditions; not a silent default.' }
    ],
    status: 'ADOPTED',
    notes: []
  },
  SUNRISE_CONVENTION: {
    id: 'SUNRISE_CONVENTION',
    name: 'Sunrise & Daylight Convention',
    adoptedValueId: 'GEOMETRIC_CENTER_APPARENT_HORIZON',
    adoptedLabel: 'Centre of solar disc on the local apparent (refracted) horizon',
    definition:
      'Day runs sunrise→sunset; night runs sunset→next sunrise. Dinardha (solar noon) is the exact ' +
      'midpoint of sunrise and sunset. One Muhurta = 1/15 of daytime/nighttime duration.',
    sourceDoc: CONVENTION_REGISTRY_DOC,
    sourceSection: '§2.8 Sunrise & Daylight Convention',
    alternatives: [
      { valueId: 'UPPER_LIMB', label: 'Upper limb of the disc', usagePolicy: 'RESERVED_FUTURE', note: 'Not adopted; would need explicit re-declaration.' },
      { valueId: 'GEOMETRIC_CENTER_AIRLESS', label: 'Centre of disc, no refraction', usagePolicy: 'RESERVED_FUTURE', note: 'Not adopted; would need explicit re-declaration.' }
    ],
    status: 'ADOPTED',
    notes: [
      'Terminology mapping: the registry\'s "local apparent horizon" already includes atmospheric refraction; calculation presets express this as TOPOCENTRIC_REFRACTED with the geometric centre of the disc. The two statements describe the same adopted convention.'
    ]
  },
  DASHA_CONVENTION: {
    id: 'DASHA_CONVENTION',
    name: 'Dasha Convention',
    adoptedValueId: 'VIMSHOTTARI_120',
    adoptedLabel: 'Vimshottari Dasha (120-year cycle)',
    definition:
      'Janma Nakshatra from Nirayana Moon longitude. Year = solar Gregorian year (365.2422 days). ' +
      'Sequence: Ketu 7 → Venus 20 → Sun 6 → Moon 10 → Mars 7 → Rahu 18 → Jupiter 16 → Saturn 19 → Mercury 17. ' +
      'Balance fraction = (Nakshatra end longitude − Moon longitude) / 13°20\'.',
    sourceDoc: CONVENTION_REGISTRY_DOC,
    sourceSection: '§2.9 Dasha Convention',
    alternatives: [
      { valueId: 'YOGINI_36', label: 'Yogini Dasha (36-year)', usagePolicy: 'RESERVED_FUTURE', note: 'Preset field exists; not declared in the registry yet — fail-closed if selected.' },
      { valueId: 'CHARA_DASHA', label: 'Chara Dasha (Jaimini)', usagePolicy: 'RESERVED_FUTURE', note: 'Preset field exists; not declared in the registry yet — fail-closed if selected.' }
    ],
    status: 'ADOPTED',
    notes: []
  },
  VARGA_CONVENTION: {
    id: 'VARGA_CONVENTION',
    name: 'Divisional Chart (Varga) Convention',
    adoptedValueId: 'BPHS_SHODASHAVARGA',
    adoptedLabel: 'Brihat Parashara Hora Shastra Shodashavarga',
    definition:
      'D1 Rashi: direct 30° divisions. D9 Navamsha: 3°20\' divisions from Mesha (chara), Simha (sthira), ' +
      'Dhanu (dwisvabhava). D10 Dashamsha: 3°00\' divisions from the same sign (odd) / 9th from it (even).',
    sourceDoc: CONVENTION_REGISTRY_DOC,
    sourceSection: '§2.10 Divisional Chart Convention',
    alternatives: [
      { valueId: 'PARASHARI_ALTERNATE_D10', label: 'Alternate D10 traditions', usagePolicy: 'RESERVED_FUTURE', note: 'D10 remains under internal verification per Sprint A evidence; no silent substitution.' }
    ],
    status: 'ADOPTED_WITH_OPEN_ITEM',
    notes: [
      'OPEN ITEM: D10 internal verification continues per existing project evidence (Mission §7); it must not be declared externally verified without Sprint D qualification.'
    ]
  }
};

/** Fail-closed typed error for the convention registry (CT_INV_006). */
export class ConventionError extends Error {
  readonly code: 'CONVENTION_UNREGISTERED' | 'CONVENTION_PRESET_UNKNOWN' | 'CONVENTION_MAPPING_MISSING';
  readonly invariantId = 'CT_INV_004';

  constructor(code: ConventionError['code'], message: string) {
    super(message);
    this.name = 'ConventionError';
    this.code = code;
  }
}

/** Stable JSON used for the manifest checksum. Sorted keys, no timestamps. */
function stableStringify(value: unknown): string {
  const seen = new Set<unknown>();
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      if (seen.has(v)) return '[circular]';
      seen.add(v);
      const obj = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(obj).sort()) out[k] = walk(obj[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(walk(value));
}

/* ------------------------------------------------------------------------- */
/* Preset → declared-convention resolution                                    */
/* ------------------------------------------------------------------------- */

function resolveAyanamshaValue(ayanamsha: CalculationPreset['ayanamsha']): { valueId: string; label: string } {
  switch (ayanamsha) {
    case 'LAHIRI': return { valueId: 'LAHIRI_CHITRA_PAKSHA', label: 'Chitra Paksha (Lahiri)' };
    case 'RAMAN': return { valueId: 'RAMAN', label: 'B.V. Raman' };
    case 'KP': return { valueId: 'KRISHNAMURTI_KP', label: 'Krishnamurti (KP)' };
    case 'TROPICAL': return { valueId: 'TROPICAL_SAYANA', label: 'Tropical / Sayana' };
    default:
      throw new ConventionError('CONVENTION_UNREGISTERED', `Preset ayanamsha '${String(ayanamsha)}' is not declared in the registry. Fail closed.`);
  }
}

function resolveNodeValue(nodeMode: CalculationPreset['nodeMode']): { valueId: string; label: string } {
  switch (nodeMode) {
    case 'MEAN_NODE': return { valueId: 'MEAN_NODE', label: 'Mean Node (Madhyama Rahu)' };
    case 'TRUE_NODE': return { valueId: 'TRUE_NODE', label: 'True Node (Spashta Rahu)' };
    default:
      throw new ConventionError('CONVENTION_UNREGISTERED', `Preset nodeMode '${String(nodeMode)}' is not declared. Fail closed.`);
  }
}

function resolveHouseValue(houseSystem: CalculationPreset['houseSystem']): { valueId: string; label: string } {
  switch (houseSystem) {
    case 'EQUAL_SIGN': return { valueId: 'EQUAL_SIGN', label: 'Equal House (Sama Bhava)' };
    case 'SRI_PATI': return { valueId: 'SRI_PATI', label: 'Sripati / Porphyry' };
    case 'PLACIDUS': return { valueId: 'PLACIDUS', label: 'Placidus semi-arc' };
    default:
      throw new ConventionError('CONVENTION_UNREGISTERED', `Preset houseSystem '${String(houseSystem)}' is not declared. Fail closed.`);
  }
}

function resolveDashaValue(dashaScheme: CalculationPreset['dashaScheme']): { valueId: string; label: string } {
  switch (dashaScheme) {
    case 'VIMSHOTTARI_120': return { valueId: 'VIMSHOTTARI_120', label: 'Vimshottari (120-year)' };
    case 'YOGINI_36':
    case 'CHARA':
      throw new ConventionError('CONVENTION_UNREGISTERED',
        `Preset dashaScheme '${dashaScheme}' exists in preset metadata but has NO registry declaration. ` +
        'Per CT_INV_006 the engine refuses to stamp an undeclared convention. Register it in ' +
        CONVENTION_REGISTRY_DOC + ' first.');
    default:
      throw new ConventionError('CONVENTION_UNREGISTERED', `Unknown dashaScheme '${String(dashaScheme)}'.`);
  }
}

function resolveSunriseValue(sunriseReckoning: CalculationPreset['sunriseReckoning']): { valueId: string; label: string } {
  switch (sunriseReckoning) {
    // Registry §2.8: centre of disc on the local APPARENT (refracted) horizon.
    case 'TOPOCENTRIC_REFRACTED': return { valueId: 'GEOMETRIC_CENTER_APPARENT_HORIZON', label: 'Centre of disc on apparent (refracted) horizon' };
    case 'GEOMETRIC_CENTER':
    case 'UPPER_LIMB':
      throw new ConventionError('CONVENTION_UNREGISTERED',
        `sunriseReckoning '${sunriseReckoning}' is a registered ALTERNATIVE, not the adopted standard, and no preset may select it silently yet.`);
    default:
      throw new ConventionError('CONVENTION_UNREGISTERED', `Unknown sunriseReckoning '${String(sunriseReckoning)}'.`);
  }
}

/* ------------------------------------------------------------------------- */
/* Convention manifest                                                        */
/* ------------------------------------------------------------------------- */

export interface ResolvedConventionSelection {
  conventionId: DeclaredConventionId;
  adoptedValueId: string;
  label: string;
  sourceSection: string;
  /** true when the selection equals the registry-adopted standard. */
  isRegistryStandard: boolean;
  /** When false, the selection is an explicitly chosen alternative (never silent). */
  selectionBasis: 'REGISTRY_STANDARD' | 'PRESET_EXPLICIT_ALTERNATIVE';
}

export interface ConventionManifest {
  registryVersion: string;
  registryDoc: string;
  presetId: string;
  presetName: string;
  /** One resolved selection per declared convention — the full CT_INV_004 set. */
  selections: ResolvedConventionSelection[];
  /** Deterministic checksum of the manifest content (no timestamps inside). */
  manifestSha256: string;
  /** Human-readable one-line-per-convention summary for snapshots/reports. */
  summaryLines: string[];
}

/**
 * Builds the deterministic, checksummed convention manifest for a calculation preset.
 * Fails closed on unknown presets or undeclared convention values (CT_INV_006).
 */
export function buildConventionManifest(presetId: string = DEFAULT_PRESET.id): ConventionManifest {
  const preset = CALCULATION_PRESETS[presetId];
  if (!preset) {
    throw new ConventionError('CONVENTION_PRESET_UNKNOWN',
      `Unknown calculation preset '${presetId}'. Known presets: ${Object.keys(CALCULATION_PRESETS).join(', ')}`);
  }

  const resolutions: Array<{ id: DeclaredConventionId; sel: { valueId: string; label: string } }> = [
    { id: 'AYANAMSHA', sel: resolveAyanamshaValue(preset.ayanamsha) },
    { id: 'LUNAR_NODE_MODEL', sel: resolveNodeValue(preset.nodeMode) },
    { id: 'HOUSE_SYSTEM', sel: resolveHouseValue(preset.houseSystem) },
    { id: 'EPHEMERIS_PROVIDER', sel: { valueId: 'ASTRONOMY_ENGINE_VSOP87_ELP2000', label: DECLARED_CONVENTIONS.EPHEMERIS_PROVIDER.adoptedLabel } },
    { id: 'COORDINATE_MODE', sel: { valueId: 'GEOCENTRIC_ECLIPTIC_NIRAYANA', label: 'Geocentric ecliptic (Nirayana), apparent' } },
    { id: 'TIMEZONE_SOURCE', sel: { valueId: 'INDIAN_CITY_DB_IANA', label: 'Canonical Indian city database + IANA' } },
    { id: 'CALENDAR_SYSTEM', sel: { valueId: 'GREGORIAN_JULIAN_DAY', label: 'Gregorian + Julian Day' } },
    { id: 'SUNRISE_CONVENTION', sel: resolveSunriseValue(preset.sunriseReckoning) },
    { id: 'DASHA_CONVENTION', sel: resolveDashaValue(preset.dashaScheme) },
    { id: 'VARGA_CONVENTION', sel: { valueId: 'BPHS_SHODASHAVARGA', label: 'BPHS Shodashavarga' } }
  ];

  const selections: ResolvedConventionSelection[] = resolutions.map(({ id, sel }) => {
    const decl = DECLARED_CONVENTIONS[id];
    const isStandard = decl.adoptedValueId === sel.valueId;
    if (!isStandard) {
      const alt = decl.alternatives.find(a => a.valueId === sel.valueId);
      if (!alt) {
        throw new ConventionError('CONVENTION_UNREGISTERED',
          `Value '${sel.valueId}' for ${id} is not even a registered alternative. Fail closed.`);
      }
    }
    return {
      conventionId: id,
      adoptedValueId: sel.valueId,
      label: sel.label,
      sourceSection: decl.sourceSection,
      isRegistryStandard: isStandard,
      selectionBasis: isStandard ? 'REGISTRY_STANDARD' : 'PRESET_EXPLICIT_ALTERNATIVE'
    };
  });

  const manifest: Omit<ConventionManifest, 'manifestSha256'> & { manifestSha256?: string } = {
    registryVersion: CONVENTION_REGISTRY_VERSION,
    registryDoc: CONVENTION_REGISTRY_DOC,
    presetId: preset.id,
    presetName: preset.name,
    selections,
    summaryLines: selections.map(s =>
      `${s.conventionId}=${s.adoptedValueId}${s.isRegistryStandard ? '' : ' (explicit alternative)'}` +
      ` [${s.sourceSection}]`)
  };

  const manifestSha256 = crypto.createHash('sha256').update(stableStringify(manifest)).digest('hex');
  return { ...manifest, manifestSha256 };
}

/**
 * Attaches explicit convention metadata to a chart snapshot's meta block (CT_INV_004).
 * Additive and deterministic; fails closed if the preset is unknown.
 */
export function buildConventionSnapshotMetadata(presetId: string = DEFAULT_PRESET.id): {
  conventionRegistry: {
    registryVersion: string;
    registryDoc: string;
    presetId: string;
    manifestSha256: string;
    selections: ResolvedConventionSelection[];
    summaryLines: string[];
  };
} {
  const manifest = buildConventionManifest(presetId);
  return {
    conventionRegistry: {
      registryVersion: manifest.registryVersion,
      registryDoc: manifest.registryDoc,
      presetId: manifest.presetId,
      manifestSha256: manifest.manifestSha256,
      selections: manifest.selections,
      summaryLines: manifest.summaryLines
    }
  };
}
