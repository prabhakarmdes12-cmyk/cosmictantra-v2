/**
 * CosmicTantra "upcoming festivals" scan — forward-looking festival planner
 * data for the calendar.
 *
 * The month grid shows every day of one civil month; this module answers the
 * companion question "what major observances are coming next?" It scans the
 * real engine (`calculateMonthPanchang`) forward from a reference date across
 * several civil months and returns a deterministic, art-backed list of
 * festival days — the same data the UI uses for the "अगले प्रमुख पर्व" panel
 * and the mobile आज strip's "next festival" chips.
 *
 * Design rules:
 *  - FORWARD-ONLY: never reports observances earlier than `fromDate`, so
 *    browsing a past month never surfaces stale "upcoming" items.
 *  - Universal monthly vrats (Ekadashi / Pradosha / Purnima Vrat / Amavasya /
 *    Vinayaka & Sankashti Chaturthi) are excluded by default — they recur
 *    every fortnight and would drown the real observances. Pass
 *    `includeUniversal: true` for a raw feed.
 *  - Dates are the engine's civil dates (the same ones the grid lights up),
 *    so the planner and the month cells can never disagree.
 */
import { calculateMonthPanchang, PanchangDayData } from '../../engines/monthlyPanchangEngine';
import { resolveDayArtwork, DayArtwork } from './festivalArtwork';

export interface FestivalDayEvent {
  /** YYYY-MM-DD civil date (same as the grid's day.dateString). */
  dateString: string;
  /** 0-indexed year/month of the event (for jumping the grid). */
  year: number;
  month0: number;
  /** English festival name(s) that make this day a festival day. */
  names: string[];
  /** Hindi festival name(s). */
  namesHi: string[];
  /** Weekday name (en/hi) of the event. */
  dayName: string;
  dayNameHi: string;
  /** Days from the reference date (0 = the reference day itself). */
  daysAway: number;
  /** Full panchang snapshot — openable directly in the day inspector. */
  day: PanchangDayData;
  /** Resolved artwork (festival art on observance days, tithi art otherwise). */
  art: DayArtwork | null;
}

/** Engine festival names that recur every lunar cycle (fortnightly/monthly). */
export const UNIVERSAL_VRAT_NAMES = new Set<string>([
  'Shukla Ekadashi Vrat',
  'Krishna Ekadashi Vrat',
  'Pradosha Vrat',
  'Purnima Vrat / Satyanarayan Puja',
  'Amavasya / Pitru Tarpana',
  'Vinayaka Chaturthi',
  'Sankashti Chaturthi',
]);

export interface UpcomingScanOptions {
  /** Civil months to scan forward from the reference date (inclusive). Default 4. */
  months?: number;
  /** Hard cap on returned events. Default 8. */
  max?: number;
  /** Include fortnightly universal vrats. Default false. */
  includeUniversal?: boolean;
}

export interface UpcomingScanCity {
  lat: number;
  lng: number;
  tz: number;
}

/**
 * Scan the real engine forward from `fromDate` and return the next festival
 * days (each day once, with its full panchang snapshot + artwork).
 */
export function getUpcomingFestivalDays(
  fromDate: Date,
  city: UpcomingScanCity,
  options: UpcomingScanOptions = {}
): FestivalDayEvent[] {
  const months = options.months ?? 4;
  const max = options.max ?? 8;
  const includeUniversal = options.includeUniversal ?? false;
  const fromKey = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(
    fromDate.getDate()
  ).padStart(2, '0')}`;

  const events: FestivalDayEvent[] = [];
  const startYear = fromDate.getFullYear();
  const startMonth0 = fromDate.getMonth();

  for (let offset = 0; offset < months && events.length < max; offset++) {
    let y = startYear;
    let m = startMonth0 + offset;
    if (m > 11) {
      y += Math.floor(m / 12);
      m = m % 12;
    }
    const overview = calculateMonthPanchang(y, m, city.lat, city.lng, city.tz);
    for (const day of overview.days) {
      if (events.length >= max) break;
      if (day.dateString < fromKey) continue; // forward-only
      const meaningful = day.festivals.filter(
        (f) => includeUniversal || !UNIVERSAL_VRAT_NAMES.has(f.name)
      );
      if (meaningful.length === 0) continue;
      events.push({
        dateString: day.dateString,
        year: y,
        month0: m,
        names: meaningful.map((f) => f.name),
        namesHi: meaningful.map((f) => f.nameHi),
        dayName: day.dayName,
        dayNameHi: day.dayNameHi,
        daysAway: Math.round((Date.UTC(y, m, day.dayNumber) - Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())) / 86400000),
        day,
        art: resolveDayArtwork(day as any),
      });
    }
  }
  return events;
}

/** Short Hindi label for the event list (first festival name). */
export function festivalEventTitle(ev: FestivalDayEvent, isHi = false): string {
  return isHi ? ev.namesHi[0] || ev.names[0] : ev.names[0];
}
