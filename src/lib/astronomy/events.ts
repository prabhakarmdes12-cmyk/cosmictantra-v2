import { Body, Ecliptic, Equator, GeoVector, Horizon, Observer, SearchHourAngle, SearchRiseSet } from 'astronomy-engine';
import type { ObserverLocation, SupportedBody } from './types';

export type AstronomicalBody = Exclude<SupportedBody, 'Rahu' | 'Ketu'>;
const bodyMap: Record<AstronomicalBody, Body> = { Sun: Body.Sun, Moon: Body.Moon, Mercury: Body.Mercury, Venus: Body.Venus, Mars: Body.Mars, Jupiter: Body.Jupiter, Saturn: Body.Saturn };
export interface AstronomySnapshot { body: AstronomicalBody; tropicalLongitude: number; eclipticLatitude: number; rightAscensionHours: number; declination: number; altitude: number; azimuth: number; distanceAu: number; }
export interface RiseTransitSet { body: AstronomicalBody; rise: string | null; transit: string | null; set: string | null; source: string; algorithmVersion: string; observerDependent: true; refraction: 'Astronomy Engine standard rise/set convention'; }
function toObserver(location: ObserverLocation) { return new Observer(location.latitude, location.longitude, location.elevation ?? 0); }
/** Astronomy-only output. No Jyotish classification occurs in this module. */
export function calculateAstronomicalSnapshot(body: AstronomicalBody, instant: Date, location: ObserverLocation): AstronomySnapshot {
 const observer = toObserver(location); const engineBody = bodyMap[body]; const geo = Ecliptic(GeoVector(engineBody, instant, true)); const eq = Equator(engineBody, instant, observer, true, true); const hor = Horizon(instant, observer, eq.ra, eq.dec, 'normal');
 return { body, tropicalLongitude: geo.elon, eclipticLatitude: geo.elat, rightAscensionHours: eq.ra, declination: eq.dec, altitude: hor.altitude, azimuth: hor.azimuth, distanceAu: eq.dist };
}
/** Finds the next physical horizon events after an instant; null means no event within 2 days (e.g. polar conditions). */
export function calculateRiseTransitSet(body: AstronomicalBody, instant: Date, location: ObserverLocation): RiseTransitSet {
 const observer = toObserver(location); const engineBody = bodyMap[body];
 const rise = SearchRiseSet(engineBody, observer, +1, instant, 2); const set = SearchRiseSet(engineBody, observer, -1, instant, 2); const transit = SearchHourAngle(engineBody, observer, 0, instant, +1);
 return { body, rise: rise?.date.toISOString() ?? null, transit: transit?.time.date.toISOString() ?? null, set: set?.date.toISOString() ?? null, source: 'Astronomy Engine (MIT)', algorithmVersion: 'astronomy-engine-2.1.19', observerDependent: true, refraction: 'Astronomy Engine standard rise/set convention' };
}
