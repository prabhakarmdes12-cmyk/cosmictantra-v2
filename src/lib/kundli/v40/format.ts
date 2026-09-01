/**
 * KUNDLI V40 — display formatting.
 *
 * Pandit-facing degrees are DMS (11°43′). The decimal longitude is never
 * discarded: it stays in the canonical model and in the machine data of every
 * derived object. This module only decides how a number is *shown*.
 */

/** Degrees-minutes, e.g. 11.7176 -> "11°43′". */
export function dm(deg: number): string {
  if (!Number.isFinite(deg)) return '—';
  const total = Math.round(deg * 60);
  const d = Math.floor(total / 60);
  const m = total % 60;
  return `${d}\u00B0${String(m).padStart(2, '0')}\u2032`;
}

/** Degrees-minutes-seconds, e.g. 11.7176 -> "11°43′03″". */
export function dms(deg: number): string {
  if (!Number.isFinite(deg)) return '—';
  const total = Math.round(deg * 3600);
  const d = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${d}\u00B0${String(m).padStart(2, '0')}\u2032${String(s).padStart(2, '0')}\u2033`;
}

/** Sidereal longitude 0..360 as sign-relative DMS with the sign number. */
export function signDms(longitudeDeg: number): string {
  const norm = ((longitudeDeg % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30) + 1;
  return `${dms(norm % 30)} (sign ${signIndex})`;
}

/** Duration in years -> "5y 0m 3d", using the engine's own 365.25-day year. */
export function yearsToYmd(years: number): string {
  if (!Number.isFinite(years) || years < 0) return '—';
  const DAYS_PER_YEAR = 365.25;
  const DAYS_PER_MONTH = 365.25 / 12;
  let days = years * DAYS_PER_YEAR;
  const y = Math.floor(days / DAYS_PER_YEAR);
  days -= y * DAYS_PER_YEAR;
  const m = Math.floor(days / DAYS_PER_MONTH);
  days -= m * DAYS_PER_MONTH;
  const d = Math.floor(days + 1e-6);
  return `${y}y ${m}m ${d}d`;
}

/** ISO date -> "15 June 1995". Pure UTC arithmetic; no host-locale drift. */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function longDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${Number(d)} ${MONTHS[Number(mo) - 1]} ${y}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

/** Weekday of a civil date, computed in UTC so it never depends on the host. */
export function weekdayOf(isoDate: string): { en: string; hi: string } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return null;
  return { en: WEEKDAYS[d.getUTCDay()], hi: WEEKDAYS_HI[d.getUTCDay()] };
}

/** "10:30" -> "10:30 AM". */
export function clockTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!m) return hhmm;
  const h = Number(m[1]);
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${suffix}`;
}

/** Days between two ISO dates (UTC, calendar-day precision). */
export function daysBetween(startIso: string, endIso: string): number | null {
  const a = Date.parse(`${startIso}T00:00:00Z`);
  const b = Date.parse(`${endIso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}
