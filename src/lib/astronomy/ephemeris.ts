import { calculateKundali, getLahiriAyanamsha, normalizeAngle } from '@/lib/astrologyEngine';
import { canonicalLahiriAdapter } from '@/lib/jyotish/sidereal';
import type { BodyPosition, ObservatoryTime, SupportedBody } from './types';
const VERSION = 'cosmictantra-canonical-v34';
function localDateTime(time: ObservatoryTime) { const [date, clock] = time.userLocalTime.split('T'); return { date, clock: clock.slice(0, 5) }; }
export function calculateCanonicalBody(body: SupportedBody, time: ObservatoryTime): BodyPosition {
  const { date, clock } = localDateTime(time); const offsetHours = time.timezoneOffsetMinutes / 60;
  const chart = calculateKundali(date, clock, time.location.latitude, time.location.longitude, offsetHours, time.location.name);
  const sidereal = chart.planets[body].longitude; const ayanamsha = getLahiriAyanamsha(time.julianDate);
  // The current canonical chart provides sidereal longitudes. The tropical value is its explicit inverse transform, not renderer data.
  const tropical = normalizeAngle(sidereal + ayanamsha); const derived = canonicalLahiriAdapter(tropical, time.julianDate); const calculatedAt = new Date().toISOString();
  const meta = { source: 'CosmicTantra canonical Jyotish engine', algorithmVersion: VERSION, calculatedAt };
  return { body, tropicalLongitude: { value: tropical, unit: 'degree', frame: 'ecliptic-tropical', ...meta }, siderealLongitude: { value: derived.longitude, unit: 'degree', frame: 'ecliptic-sidereal-lahiri', ...meta }, ayanamsha: { value: ayanamsha, unit: 'degree', frame: 'ecliptic-tropical', ...meta }, rashi: derived.rashi, degreeInRashi: derived.degreeInRashi, nakshatra: derived.nakshatra };
}
