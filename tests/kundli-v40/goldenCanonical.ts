/**
 * PRIYA_GAJA_KESARI_NEGATIVE — the permanent golden validation case for V40.
 *
 * The canonical model is rebuilt from the birth input on every run rather than
 * read from a stored JSON blob: that way the fixture also proves the kernel
 * still produces the same chart, instead of only proving the report layer can
 * read a file.
 */

import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { validateBirthInput } from '../../src/lib/kundli/validation';
import { resolveGeoTimezone } from '../../src/lib/kundli/geoTz';
import { computeFingerprint } from '../../src/lib/kundli/lineage';
import { KUNDLI_PIPELINE_CONFIG } from '../../src/lib/kundli/config';
import type { KundliCanonicalModel } from '../../src/lib/kundli/types';

export const GOLDEN_BIRTH_INPUT = {
  name: 'Priya Sharma',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  locationName: 'Patna',
  latitude: 25.5941,
  longitude: 85.1376,
  coordinateProvenance: 'MANUAL' as const,
  timezoneId: 'Asia/Kolkata',
};

export function buildGoldenCanonical(
  raw: typeof GOLDEN_BIRTH_INPUT = GOLDEN_BIRTH_INPUT,
): KundliCanonicalModel {
  const validated = validateBirthInput(raw as never, {});
  const resolved = resolveGeoTimezone(validated, raw as never);
  const profile = resolved.profile;
  profile.fingerprint = computeFingerprint(raw as never, KUNDLI_PIPELINE_CONFIG.calculation, {
    localDateTime: profile.timezone.localDateTime,
    utcDateTime: profile.timezone.utcDateTime,
    timezoneId: profile.timezone.timezoneId,
    latitude: profile.coordinates.latitude,
    longitude: profile.coordinates.longitude,
    provenance: profile.coordinates.provenance,
  });
  const snapshot = getCanonicalJyotishSnapshot({
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    latitude: profile.coordinates.latitude,
    longitude: profile.coordinates.longitude,
    timezone: profile.timezone.utcOffsetAtBirth,
    locationName: profile.locationName,
  });
  return buildCanonicalModel({ profile, snapshot, config: KUNDLI_PIPELINE_CONFIG.calculation });
}

/** Ground truth asserted by the V40 acceptance suite. */
export const GOLDEN_EXPECTATIONS = {
  lagna: { sign: 'Leo', degreeApprox: 12.1, nakshatra: 'Magha', pada: 4 },
  planets: {
    Sun: { sign: 'Taurus', house: 10, degApprox: 29.86 },
    Moon: { sign: 'Sagittarius', house: 5, degApprox: 28.86, nakshatra: 'Uttara Ashadha', pada: 1 },
    Mars: { sign: 'Leo', house: 1, degApprox: 16.16 },
    Mercury: { sign: 'Taurus', house: 10, degApprox: 16.18, retrograde: true },
    Jupiter: { sign: 'Scorpio', house: 4, degApprox: 15.01, retrograde: true },
    Venus: { sign: 'Taurus', house: 10, degApprox: 11.72, dignity: 'OWN_SIGN' },
    Saturn: { sign: 'Pisces', house: 8, degApprox: 0.59 },
    Rahu: { sign: 'Libra', house: 3, degApprox: 9.22 },
    Ketu: { sign: 'Aries', house: 9, degApprox: 9.22 },
  },
  d9LagnaSign: 'Karka',
  d10: {
    Sun: 'Tula', Moon: 'Kanya', Mars: 'Makara', Mercury: 'Mithuna', Jupiter: 'Dhanu',
    Venus: 'Mesha', Saturn: 'Vrishchika', Rahu: 'Makara', Ketu: 'Karka',
  },
  d10Lagna: 'Dhanu',
  dasha: { mahadasha: 'Rahu', antardasha: 'Mercury', mdStart: '2017-06-19', mdEnd: '2035-06-19' },
  yogas: {
    YOGA_GAJA_KESARI: 'ABSENT',
    YOGA_BUDHADITYA: 'PRESENT',
    YOGA_MALAVYA: 'PRESENT',
  },
  manglikPresent: true,
  sadeSatiActive: false,
} as const;
