import type { ObserverLocation, ObservatoryTime } from './types';
const MS_DAY = 86400000;
export function julianDate(instant: Date) { return instant.getTime() / MS_DAY + 2440587.5; }
function offsetMinutes(instant: Date, zone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, timeZoneName: 'longOffset', hour: '2-digit' }).formatToParts(instant);
  const value = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT';
  const match = value.match(/GMT([+-])(\d{2}):(\d{2})/);
  return match ? (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
}
export function createObservatoryTime(instant: Date, location: ObserverLocation): ObservatoryTime {
  if (Number.isNaN(instant.getTime())) throw new Error('Invalid instant');
  if (!Number.isFinite(location.latitude) || Math.abs(location.latitude) > 90 || !Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180) throw new Error('Invalid observer coordinates');
  const jd = julianDate(instant);
  const local = new Intl.DateTimeFormat('sv-SE', { timeZone: location.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(instant).replace(' ', 'T');
  return { userLocalTime: local, timezone: location.timezone, utcInstant: instant.toISOString(), timezoneOffsetMinutes: offsetMinutes(instant, location.timezone), julianDate: jd, julianCentury: (jd - 2451545) / 36525, location };
}
