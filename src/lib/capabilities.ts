/**
 * CosmicTantra V34 — Capability Registry
 * Prevents UI from advertising unsupported deterministic capabilities.
 */

export const CAPABILITIES = {
  PANCHANG: 'LIVE',
  KUNDALI: 'LIVE',
  VIMSHOTTARI_DASHA: 'LIVE',
  SWARGA_LOK: 'LIVE',
  GURU_AI: 'CONTROLLED',
  GOCHARA: 'NOT_AVAILABLE',
  ASHTAKOOT: 'NOT_AVAILABLE',
  SHADBALA: 'NOT_AVAILABLE',
  PERSONALISED_MUHURAT: 'PRACTITIONER_ASSISTED',
} as const;

export type CapabilityName = keyof typeof CAPABILITIES;
export type CapabilityStatus = (typeof CAPABILITIES)[CapabilityName];

export function isCapabilityLive(name: CapabilityName): boolean {
  return CAPABILITIES[name] === 'LIVE';
}
