import { calculateCanonicalBody, calculateCanonicalBodies, type CanonicalBody, type CanonicalBodyName } from './canonicalBodies';
import { equatorialToHorizontal, type HorizontalCoordinate, type ObserverLocation } from './projection';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const SOLAR_THRESHOLDS = {
  sunrise: -0.833,
  civil: -6,
  nautical: -12,
  astronomical: -18,
} as const;

export type SolarEventName = 'sunrise' | 'sunset' | 'civilDawn' | 'civilDusk' | 'nauticalDawn' | 'nauticalDusk' | 'astronomicalDawn' | 'astronomicalDusk';

export interface SolarDayEvents {
  localDate: string;
  solarNoon: Date;
  sunrise: Date | null;
  sunset: Date | null;
  civilDawn: Date | null;
  civilDusk: Date | null;
  nauticalDawn: Date | null;
  nauticalDusk: Date | null;
  astronomicalDawn: Date | null;
  astronomicalDusk: Date | null;
  approximate: true;
}

export type SkyLightState = 'daylight' | 'civil twilight' | 'nautical twilight' | 'astronomical twilight' | 'night';

export interface MoonPhase {
  fraction: number;
  illumination: number;
  angleDeg: number;
  name: 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
  symbol: string;
}

export interface ObservationSummary {
  body: CanonicalBody;
  horizontal: HorizontalCoordinate;
  visible: boolean;
  direction: string;
  altitudeBand: 'high' | 'usable' | 'near horizon' | 'below horizon';
}

export type HorizonEventKind = 'rise' | 'set';

export interface ApproximateHorizonEvent {
  body: CanonicalBodyName;
  kind: HorizonEventKind;
  time: Date;
  thresholdDeg: number;
  approximate: true;
}

export interface ObservationPlan {
  body: CanonicalBody;
  horizontal: HorizontalCoordinate | null;
  visible: boolean;
  direction: string | null;
  altitudeBand: ObservationSummary['altitudeBand'] | null;
  nextHorizonEvent: ApproximateHorizonEvent | null;
  lunarSeparationDeg: number | null;
}

export const COMPASS_DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'] as const;

function finiteDate(value: Date | number | string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date(0);
}

function normalizeAngle(value: number): number {
  return ((value % 360) + 360) % 360;
}

function localDateParts(date: Date, timezoneOffsetHours: number): { year: number; month: number; day: number; label: string } {
  const local = new Date(date.getTime() + timezoneOffsetHours * DAY / 24);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const day = local.getUTCDate();
  return { year, month, day, label: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
}

function interpolateCrossing(previous: Date, previousAltitude: number, current: Date, currentAltitude: number, threshold: number): Date {
  const denominator = currentAltitude - previousAltitude;
  const ratio = Math.abs(denominator) < 1e-9 ? 0.5 : (threshold - previousAltitude) / denominator;
  return new Date(previous.getTime() + Math.max(0, Math.min(1, ratio)) * (current.getTime() - previous.getTime()));
}

function solarAltitude(date: Date, observer: ObserverLocation): number {
  const sun = calculateCanonicalBody('Sun', date);
  return equatorialToHorizontal(
    { raHours: sun.rightAscensionHours, decDeg: sun.declinationDeg },
    date,
    observer,
  ).altitudeDeg;
}

function findThresholdCrossings(start: Date, observer: ObserverLocation, threshold: number): { dawn: Date | null; dusk: Date | null } {
  let previousDate = start;
  let previousAltitude = solarAltitude(previousDate, observer);
  let dawn: Date | null = null;
  let dusk: Date | null = null;
  const step = 10 * MINUTE;

  for (let elapsed = step; elapsed <= DAY; elapsed += step) {
    const currentDate = new Date(start.getTime() + elapsed);
    const currentAltitude = solarAltitude(currentDate, observer);
    if (!dawn && previousAltitude < threshold && currentAltitude >= threshold) {
      dawn = interpolateCrossing(previousDate, previousAltitude, currentDate, currentAltitude, threshold);
    }
    if (!dusk && previousAltitude >= threshold && currentAltitude < threshold) {
      dusk = interpolateCrossing(previousDate, previousAltitude, currentDate, currentAltitude, threshold);
    }
    previousDate = currentDate;
    previousAltitude = currentAltitude;
  }
  return { dawn, dusk };
}

/**
 * Approximate solar events for the selected civil date. This is intentionally
 * derived from the Observatory's local Sun model, not presented as an
 * almanac-grade or refraction-corrected event service.
 */
export function calculateSolarDayEvents(
  date: Date | number | string,
  observer: ObserverLocation,
  timezoneOffsetHours = 0,
): SolarDayEvents {
  const instant = finiteDate(date);
  const parts = localDateParts(instant, timezoneOffsetHours);
  const start = new Date(Date.UTC(parts.year, parts.month, parts.day) - timezoneOffsetHours * 60 * MINUTE);
  const sunriseSet = findThresholdCrossings(start, observer, SOLAR_THRESHOLDS.sunrise);
  const civil = findThresholdCrossings(start, observer, SOLAR_THRESHOLDS.civil);
  const nautical = findThresholdCrossings(start, observer, SOLAR_THRESHOLDS.nautical);
  const astronomical = findThresholdCrossings(start, observer, SOLAR_THRESHOLDS.astronomical);
  const solarNoon = new Date(start.getTime() + 12 * 60 * MINUTE - observer.longitude / 15 * 60 * MINUTE);

  return {
    localDate: parts.label,
    solarNoon,
    sunrise: sunriseSet.dawn,
    sunset: sunriseSet.dusk,
    civilDawn: civil.dawn,
    civilDusk: civil.dusk,
    nauticalDawn: nautical.dawn,
    nauticalDusk: nautical.dusk,
    astronomicalDawn: astronomical.dawn,
    astronomicalDusk: astronomical.dusk,
    approximate: true,
  };
}

export function skyLightState(solarAltitudeDeg: number): SkyLightState {
  if (solarAltitudeDeg >= 0) return 'daylight';
  if (solarAltitudeDeg >= -6) return 'civil twilight';
  if (solarAltitudeDeg >= -12) return 'nautical twilight';
  if (solarAltitudeDeg >= -18) return 'astronomical twilight';
  return 'night';
}

export function compassDirection(azimuthDeg: number): string {
  return COMPASS_DIRECTIONS[Math.round(normalizeAngle(azimuthDeg) / 22.5) % COMPASS_DIRECTIONS.length];
}

export function altitudeBand(altitudeDeg: number): ObservationSummary['altitudeBand'] {
  if (altitudeDeg >= 45) return 'high';
  if (altitudeDeg >= 15) return 'usable';
  if (altitudeDeg >= 0) return 'near horizon';
  return 'below horizon';
}

export const DEFAULT_MINIMUM_ALTITUDE_DEG = 0;
export const DEFAULT_LIMITING_MAGNITUDE = 4.5;
export const OBSERVATION_LIMITS = {
  minimumAltitudeDeg: { min: 0, max: 20, step: 1 },
  limitingMagnitude: { min: 1, max: 6, step: 0.5 },
} as const;

export function isAboveObservationHorizon(altitudeDeg: number, minimumAltitudeDeg = 0): boolean {
  return Number.isFinite(altitudeDeg) && altitudeDeg >= minimumAltitudeDeg;
}

export function isWithinLimitingMagnitude(magnitude: number, limitingMagnitude = 6): boolean {
  return Number.isFinite(magnitude) && magnitude <= limitingMagnitude;
}

export function summarizeObservations(
  date: Date | number | string,
  observer: ObserverLocation,
  bodyNames: CanonicalBodyName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'],
): ObservationSummary[] {
  const instant = finiteDate(date);
  const bodies = calculateCanonicalBodies(instant);
  return bodyNames
    .map(name => bodies.find(body => body.body === name))
    .filter((body): body is CanonicalBody => Boolean(body))
    .map(body => {
      const horizontal = equatorialToHorizontal(
        { raHours: body.rightAscensionHours, decDeg: body.declinationDeg },
        instant,
        observer,
      );
      return {
        body,
        horizontal,
        visible: horizontal.altitudeDeg >= 0,
        direction: compassDirection(horizontal.azimuthDeg),
        altitudeBand: altitudeBand(horizontal.altitudeDeg),
      };
    });
}

export function angularSeparationDeg(
  first: Pick<CanonicalBody, 'rightAscensionHours' | 'declinationDeg'>,
  second: Pick<CanonicalBody, 'rightAscensionHours' | 'declinationDeg'>,
): number {
  const firstRa = first.rightAscensionHours * 15 * Math.PI / 180;
  const secondRa = second.rightAscensionHours * 15 * Math.PI / 180;
  const firstDec = first.declinationDeg * Math.PI / 180;
  const secondDec = second.declinationDeg * Math.PI / 180;
  const cosine = Math.sin(firstDec) * Math.sin(secondDec)
    + Math.cos(firstDec) * Math.cos(secondDec) * Math.cos(firstRa - secondRa);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
}

/**
 * Find the next mathematical-horizon crossing for a physical canonical body.
 * This is a planning estimate only: it samples the local model every ten
 * minutes and linearly interpolates the crossing. Refraction, terrain and
 * local horizon obstruction are deliberately outside this helper.
 */
function bodyAltitude(bodyName: CanonicalBodyName, date: Date, observer: ObserverLocation): number {
  const body = calculateCanonicalBody(bodyName, date);
  return equatorialToHorizontal(
    { raHours: body.rightAscensionHours, decDeg: body.declinationDeg },
    date,
    observer,
  ).altitudeDeg;
}

export function findNextHorizonEvent(
  date: Date | number | string,
  observer: ObserverLocation,
  bodyName: CanonicalBodyName,
  thresholdDeg = 0,
  lookaheadHours = 30,
): ApproximateHorizonEvent | null {
  if (bodyName === 'Rahu' || bodyName === 'Ketu') return null;
  const start = finiteDate(date);
  const step = 10 * MINUTE;
  const limit = Math.max(1, lookaheadHours) * 60 * MINUTE;
  let previousDate = start;
  let previousAltitude = bodyAltitude(bodyName, previousDate, observer);

  for (let elapsed = step; elapsed <= limit; elapsed += step) {
    const currentDate = new Date(start.getTime() + elapsed);
    const currentAltitude = bodyAltitude(bodyName, currentDate, observer);
    if (previousAltitude < thresholdDeg && currentAltitude >= thresholdDeg) {
      return { body: bodyName, kind: 'rise', time: interpolateCrossing(previousDate, previousAltitude, currentDate, currentAltitude, thresholdDeg), thresholdDeg, approximate: true };
    }
    if (previousAltitude >= thresholdDeg && currentAltitude < thresholdDeg) {
      return { body: bodyName, kind: 'set', time: interpolateCrossing(previousDate, previousAltitude, currentDate, currentAltitude, thresholdDeg), thresholdDeg, approximate: true };
    }
    previousDate = currentDate;
    previousAltitude = currentAltitude;
  }
  return null;
}

export function planObservation(
  date: Date | number | string,
  observer: ObserverLocation,
  bodyName: CanonicalBodyName,
): ObservationPlan {
  const instant = finiteDate(date);
  const body = calculateCanonicalBody(bodyName, instant);
  const physical = body.source !== 'mean-node';
  const horizontal = physical
    ? equatorialToHorizontal(
      { raHours: body.rightAscensionHours, decDeg: body.declinationDeg },
      instant,
      observer,
    )
    : null;
  const moon = physical && bodyName !== 'Moon' ? calculateCanonicalBody('Moon', instant) : null;
  return {
    body,
    horizontal,
    visible: Boolean(horizontal && horizontal.altitudeDeg >= 0),
    direction: horizontal ? compassDirection(horizontal.azimuthDeg) : null,
    altitudeBand: horizontal ? altitudeBand(horizontal.altitudeDeg) : null,
    nextHorizonEvent: physical ? findNextHorizonEvent(instant, observer, bodyName) : null,
    lunarSeparationDeg: moon ? angularSeparationDeg(body, moon) : null,
  };
}

export function calculateMoonPhase(date: Date | number | string): MoonPhase {
  const instant = finiteDate(date);
  const sun = calculateCanonicalBody('Sun', instant);
  const moon = calculateCanonicalBody('Moon', instant);
  const angleDeg = normalizeAngle(moon.tropicalLongitude - sun.tropicalLongitude);
  const fraction = angleDeg / 360;
  const illumination = (1 - Math.cos(angleDeg * Math.PI / 180)) / 2;
  const index = Math.round(angleDeg / 45) % 8;
  const phases: MoonPhase['name'][] = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  const symbols = ['●', '◔', '◐', '◕', '○', '◕', '◑', '◔'];
  return { fraction, illumination, angleDeg, name: phases[index], symbol: symbols[index] };
}

export function formatEventTime(event: Date | null, timezoneOffsetHours: number): string {
  if (!event) return '—';
  const local = new Date(event.getTime() + timezoneOffsetHours * 60 * MINUTE);
  return local.toISOString().slice(11, 16);
}

export function formatEventDateTime(event: Date | null, timezoneOffsetHours: number): string {
  if (!event) return '—';
  const local = new Date(event.getTime() + timezoneOffsetHours * 60 * MINUTE);
  return `${local.toISOString().slice(0, 10)} ${local.toISOString().slice(11, 16)}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}
