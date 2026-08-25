import { Body, Ecliptic, Equator, GeoVector, Horizon, Observer } from 'astronomy-engine';
import { calculateKundali, getLahiriAyanamsha, normalizeAngle } from '@/lib/astrologyEngine';
import { canonicalLahiriAdapter } from '@/lib/jyotish/sidereal';
import type { BodyPosition, ObservatoryTime, SupportedBody } from './types';
const VERSION = 'astronomy-engine-2.1.19';
const ENGINE_BODIES: Partial<Record<SupportedBody, Body>> = { Sun: Body.Sun, Moon: Body.Moon, Mars: Body.Mars, Mercury: Body.Mercury, Jupiter: Body.Jupiter, Venus: Body.Venus, Saturn: Body.Saturn };
function localDateTime(time: ObservatoryTime) { const [date, clock] = time.userLocalTime.split('T'); return { date, clock: clock.slice(0, 5) }; }
/**
 * Astronomy truth comes from the pinned MIT Astronomy Engine. Canonical Jyotish truth
 * remains a separately-labelled output from the protected CosmicTantra engine.
 */
export function calculateCanonicalBody(body: SupportedBody, time: ObservatoryTime): BodyPosition {
  const { date, clock } = localDateTime(time); const offsetHours = time.timezoneOffsetMinutes / 60;
  const chart = calculateKundali(date, clock, time.location.latitude, time.location.longitude, offsetHours, time.location.name);
  const canonicalSidereal = chart.planets[body].longitude;
  const calculatedAt = new Date().toISOString();
  const observer = new Observer(time.location.latitude, time.location.longitude, time.location.elevation ?? 0);
  const engineBody = ENGINE_BODIES[body];
  let tropical = normalizeAngle(canonicalSidereal + getLahiriAyanamsha(time.julianDate));
  let scientific: BodyPosition['scientific'];
  if (engineBody) {
    const instant = new Date(time.utcInstant); const geo = Ecliptic(GeoVector(engineBody, instant, true));
    tropical = geo.elon;
    const equatorial = Equator(engineBody, instant, observer, true, true);
    const horizontal = Horizon(instant, observer, equatorial.ra, equatorial.dec, 'normal');
    scientific = { rightAscensionHours: equatorial.ra, declination: equatorial.dec, altitude: horizontal.altitude, azimuth: horizontal.azimuth, distanceAu: equatorial.dist, eclipticLatitude: geo.elat };
  }
  const astronomyLahiri = canonicalLahiriAdapter(tropical, time.julianDate);
  const canonicalAyanamsha = getLahiriAyanamsha(time.julianDate);
  const discrepancy = ((astronomyLahiri.longitude - canonicalSidereal + 540) % 360) - 180;
  const meta = { source: 'Astronomy Engine (MIT)', algorithmVersion: VERSION, calculatedAt };
  return {
    body,
    tropicalLongitude: { value: tropical, unit: 'degree', frame: 'ecliptic-tropical', epoch: 'of-date', ...meta },
    // Existing CosmicTantra output deliberately remains distinct and authoritative for current Jyotish surfaces.
    siderealLongitude: { value: canonicalSidereal, unit: 'degree', frame: 'ecliptic-sidereal-lahiri', source: 'CosmicTantra canonical Jyotish engine', algorithmVersion: 'cosmictantra-canonical-v34', calculatedAt },
    ayanamsha: { value: canonicalAyanamsha, unit: 'degree', frame: 'ecliptic-tropical', source: 'CosmicTantra canonical Jyotish engine', algorithmVersion: 'cosmictantra-canonical-v34', calculatedAt },
    rashi: chart.planets[body].rasiName, degreeInRashi: canonicalSidereal % 30, nakshatra: chart.planets[body].nakshatra,
    scientific,
    crossEngine: { astronomyDerivedSidereal: astronomyLahiri.longitude, canonicalSidereal, differenceDegrees: discrepancy, agreement: Math.abs(discrepancy) <= 0.05 },
  };
}
