/**
 * COSMICTANTRA NAVIGATION METADATA — future / technical capabilities.
 *
 * Per Sprint B.1 §1.D: technical capabilities that exist in the engine (or
 * are planned) but have NO consumer UI are represented HERE as metadata, and
 * NEVER as clickable routes. `clickable` is a literal `false` on every entry;
 * the validator asserts that no downstream module may turn these into links.
 *
 * These entries are intentionally NOT mentioned in
 * `src/lib/navigation/navigationModel.ts` — the consumer navigation model
 * contains only routes that resolve today (CT_UX_INV_001).
 */

export type CapabilityAvailability =
  /** The engine computes the data, but no validated consumer UI exists yet. */
  | 'ENGINE_EXISTS_NO_UI'
  /** The engine computes it but it is NOT trusted for conclusions (see derived model capabilities). */
  | 'ENGINE_VALIDATION_PENDING'
  /** The engine does not expose it through the validated pipeline at all. */
  | 'NOT_CALCULATED';

export interface FutureTechnicalCapability {
  id: string;
  /** Sanskrit / classical term. */
  name: string;
  /** Short truthful status line. No promise of content. */
  status: CapabilityAvailability;
  note: string;
  /** Informational path only — never navigable. */
  routeHint: string;
  clickable: false;
  /** Which engine capability record backs this entry (see kundli v40 derived model). */
  capabilityId: string;
}

/**
 * Truthful availability derived from the engine's own capability
 * declarations (KUNDLI_V40 `KundliDerivedModel.capabilities`):
 *   - D10: internal cross-check gate, externally unvalidated → VALIDATION_PENDING
 *   - Shadbala / Bhava Bala: computed by balaEngine, not externally validated → VALIDATION_PENDING
 *   - Ashtakavarga: computed by kernel, not validated, not exposed → NOT_CALCULATED
 *   - Ephemeris raw coordinates: kernel resolves them, but no page renders them → ENGINE_EXISTS_NO_UI
 */
export const FUTURE_TECHNICAL_CAPABILITIES: FutureTechnicalCapability[] = [
  {
    id: 'D10_DASHAMSA',
    name: 'D10 Dashamsha',
    status: 'ENGINE_VALIDATION_PENDING',
    note: 'Internal cross-check passes; external reference validation pending. Not used in conclusions.',
    routeHint: '/kundli/d10',
    clickable: false,
    capabilityId: 'CAP_D10',
  },
  {
    id: 'ASHTAKAVARGA',
    name: 'Ashtakavarga',
    status: 'NOT_CALCULATED',
    note: 'Computed by the kernel but not validated and not exposed by the report pipeline.',
    routeHint: '/kundli/ashtakavarga',
    clickable: false,
    capabilityId: 'CAP_ASHTAKAVARGA',
  },
  {
    id: 'SHADBALA',
    name: 'Shadbala',
    status: 'ENGINE_VALIDATION_PENDING',
    note: 'Computed by balaEngine; no external reference validation. Not exposed, not used.',
    routeHint: '/kundli/shadbala',
    clickable: false,
    capabilityId: 'CAP_SHADBALA',
  },
  {
    id: 'EPHEMERIS_RAW',
    name: 'Ephemeris (raw coordinates)',
    status: 'ENGINE_EXISTS_NO_UI',
    note: 'Sidereal longitudes are produced by the kernel; no consumer-facing raw view exists.',
    routeHint: '/kundli/ephemeris',
    clickable: false,
    capabilityId: 'CAP_POSITIONS',
  },
];

/** Reserved for the future Explorer / Scholar surfaces (Sprint B.1 §9). */
export type IntendedSurface = 'EXPLORER' | 'SCHOLAR';
