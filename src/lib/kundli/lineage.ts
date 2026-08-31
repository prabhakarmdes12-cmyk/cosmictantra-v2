/**
 * Kundli pipeline — lineage & idempotency.
 *
 * A deterministic fingerprint covers every input + configuration + version
 * that influences the output. Identical inputs with identical config always
 * produce the same fingerprint, the same reportId prefix, and therefore the
 * same deterministic calculation values (the astrology engine is already
 * deterministic). The fingerprint is recorded in the report lineage so any
 * generated artifact can be traced back to its exact inputs and settings.
 */

import type { CalculationConfig, RawBirthInput } from './types';

/** FNV-1a 64-bit hex — deterministic, synchronous, environment-independent. */
export function fnv1a64(input: string): string {
  let h1 = 0x811c9dc5; // offset basis (32-bit part)
  let h2 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (h2 + ((h1 * 0x85ebca6b) >>> 0)) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

/** Alias kept for the book model (same deterministic hash). */
export const fnv1aHex = fnv1a64;

export function computeFingerprint(
  input: RawBirthInput,
  config: CalculationConfig,
  resolved: { localDateTime: string; utcDateTime: string; timezoneId: string; latitude: number; longitude: number; provenance: string },
): string {
  const payload = JSON.stringify({
    v: 1,
    input: {
      name: input.name?.trim() ?? '',
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      locationName: input.locationName?.trim() ?? '',
    },
    resolved,
    config,
  });
  return fnv1a64(payload);
}

export function deriveReportId(fingerprint: string): string {
  return `CT-KUNDLI-${fingerprint.slice(0, 16).toUpperCase()}`;
}

export interface GenerationFingerprintInput {
  profile: { birthDate: string; birthTime: string; latitude: number; longitude: number; timezoneId: string; utcDateTime: string; locationName: string };
  calculationConfig: CalculationConfig;
  engineVersion: string;
  reportModelVersion: string;
  locale: string;
}

/** Alias used by the invariants suite: fingerprint from a resolved profile + config. */
export function computeGenerationFingerprint(input: GenerationFingerprintInput): string {
  const p = input.profile;
  return fnv1a64(JSON.stringify({
    v: 1,
    profile: { d: p.birthDate, t: p.birthTime, lat: p.latitude, lng: p.longitude, tz: p.timezoneId, utc: p.utcDateTime, loc: p.locationName },
    calc: input.calculationConfig,
    engine: input.engineVersion,
    report: input.reportModelVersion,
    locale: input.locale,
  }));
}
