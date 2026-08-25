import { getLahiriAyanamsha, getNakshatra, getRasi, getDegreeInRasi, RASHIS, normalizeAngle } from '@/lib/astrologyEngine';
/** Stable adapter: this module delegates to the protected canonical engine. */
export function canonicalLahiriAdapter(tropicalLongitude: number, julianDay: number) {
  const ayanamsha = getLahiriAyanamsha(julianDay);
  const longitude = normalizeAngle(tropicalLongitude - ayanamsha);
  const rashiIndex = getRasi(longitude);
  return { tropicalLongitude, ayanamsha, longitude, rashi: RASHIS[rashiIndex].name, degreeInRashi: getDegreeInRasi(longitude), nakshatra: getNakshatra(longitude) };
}
