/**
 * Calendar UX "supporting features" — pure regression suite (no browser).
 *
 * Locks in the data layer for the mobile-first calendar UX work:
 *   1. `upcomingFestivals` — forward-only, art-backed festival planner feed
 *      (the "अगले प्रमुख पर्व" / आज-strip "next festival" data).
 *   2. `weekAndGrid` — Monday-week geometry, ISO week numbers, and the
 *      deterministic "one grid-screen" month navigation math used by swipe /
 *      "today" behaviour.
 *   3. `vedicDayChips` — compact 2–3 chip summary of a day, de-duplicated
 *      against the festival banner text.
 *
 * All dates are the real engine's civil dates (the same ones the month grid
 * lights up), so the planner and the grid can never disagree.
 */

import { test, expect } from '@playwright/test';
import { calculateMonthPanchang } from '../src/engines/monthlyPanchangEngine';
import { getUpcomingFestivalDays, UNIVERSAL_VRAT_NAMES } from '../src/lib/calendar/upcomingFestivals';
import {
  getWeekStart,
  getWeekNumberISO,
  getMondayStartDow,
  getLeadingBlankCount,
  cellScreenStep,
} from '../src/lib/calendar/weekAndGrid';
import { getDayChips } from '../src/lib/calendar/vedicDayChips';

/** Patna — the canonical §10 city (25.5941°N 85.1376°E, IST). */
const PATNA = { lat: 25.5941, lng: 85.1376, tz: 5.5 };
/** Reference: Tuesday 8 September 2026 (local). */
const FROM = new Date(2026, 8, 8);

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function engineDay(y: number, m0: number, dateNum: number) {
  const overview = calculateMonthPanchang(y, m0, PATNA.lat, PATNA.lng, PATNA.tz);
  const day = overview.days.find((d) => d.dayNumber === dateNum);
  expect(day, `engine day ${y}-${m0 + 1}-${dateNum} must exist`).toBeTruthy();
  return day!;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. upcomingFestivals — the planner feed
// ────────────────────────────────────────────────────────────────────────────

test.describe('getUpcomingFestivalDays', () => {
  test('returns a forward-only, ascending, art-backed feed from 2026-09-08 (Patna)', () => {
    const evs = getUpcomingFestivalDays(FROM, PATNA, { months: 4, max: 10 });
    expect(evs.length).toBe(10);
    const keys = evs.map((e) => e.dateString);
    // Strictly ascending and never earlier than the reference date.
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i] > keys[i - 1]).toBe(true);
    }
    expect(keys[0] >= '2026-09-08').toBe(true);
    // Every event resolves to a real artwork asset (festival/category grade).
    for (const e of evs) {
      expect(e.art).toBeTruthy();
      expect(e.art!.src.startsWith('/assets/calendar/events/')).toBe(true);
    }
    // Known 2026 observances, exactly as the engine emits them.
    const byDate = new Map(evs.map((e) => [e.dateString, e]));
    expect(byDate.get('2026-09-14')!.names).toContain('Ganesh Chaturthi (Ganeshotsav)');
    expect(byDate.get('2026-10-20')!.names).toContain('Vijayadashami / Dussehra');
    expect(byDate.get('2026-10-29')!.names).toContain('Karwa Chauth Vrat');
    expect(byDate.get('2026-11-06')!.names).toContain('Dhanteras / Dhanvantari Jayanti');
    // First event is 6 days away (Ganesh Chaturthi on Monday 14th).
    expect(evs[0].daysAway).toBe(6);
    expect(evs[0].dayName).toBe('Monday');
  });

  test('excludes fortnightly universal vrats by default, includes them on request', () => {
    const curated = getUpcomingFestivalDays(FROM, PATNA, { months: 1, max: 50 });
    for (const e of curated) {
      for (const n of e.names) {
        expect(UNIVERSAL_VRAT_NAMES.has(n), `curated feed must not contain "${n}"`).toBe(false);
      }
    }
    const raw = getUpcomingFestivalDays(FROM, PATNA, { months: 1, max: 50, includeUniversal: true });
    const rawHasUniversal = raw.some((e) => e.names.some((n) => UNIVERSAL_VRAT_NAMES.has(n)));
    expect(rawHasUniversal).toBe(true);
    expect(raw.length).toBeGreaterThan(curated.length);
  });

  test('respects the hard cap and the scan window', () => {
    const capped = getUpcomingFestivalDays(FROM, PATNA, { months: 4, max: 3 });
    expect(capped.length).toBe(3);
    const lastKey = capped[capped.length - 1].dateString;
    const septOnly = getUpcomingFestivalDays(FROM, PATNA, { months: 1, max: 50 });
    for (const e of septOnly) {
      expect(e.dateString <= '2026-09-30').toBe(true);
    }
    expect(lastKey > '2026-09-30').toBe(true); // 4-month window sees into Oct+
  });

  test('never reports observances before the reference date when browsing past months', () => {
    // Browse the past (Aug 2026): the feed must be forward-only from that date.
    const past = new Date(2026, 7, 1); // 1 Aug 2026
    const evs = getUpcomingFestivalDays(past, PATNA, { months: 2, max: 50 });
    expect(evs.length).toBeGreaterThan(0);
    for (const e of evs) {
      expect(e.dateString >= '2026-08-01').toBe(true);
    }
    // Late-year reference: a 1-month window must stay inside December 2026
    // (never reaching backwards into November, never leaking into 2027).
    const late = getUpcomingFestivalDays(new Date(2026, 11, 20), PATNA, { months: 1, max: 50 });
    for (const e of late) {
      expect(e.dateString >= '2026-12-20').toBe(true);
      expect(e.dateString <= '2026-12-31').toBe(true);
    }
  });

  test('a festival on the reference day itself is reported with daysAway 0', () => {
    // Ganesh Chaturthi is Monday 14 Sep 2026 — use it as the reference date.
    const ref = new Date(2026, 8, 14);
    const evs = getUpcomingFestivalDays(ref, PATNA, { months: 1, max: 50 });
    expect(evs[0].dateString).toBe('2026-09-14');
    expect(evs[0].daysAway).toBe(0);
    expect(evs[0].names).toContain('Ganesh Chaturthi (Ganeshotsav)');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. weekAndGrid — week geometry, ISO week numbers, screen-step navigation
// ────────────────────────────────────────────────────────────────────────────

test.describe('weekAndGrid', () => {
  test('Monday-start week helpers (oracle: Python date.isocalendar)', () => {
    // 2026-09-08 is a Tuesday.
    expect(getMondayStartDow(FROM)).toBe(1);
    expect(toKey(getWeekStart(FROM))).toBe('2026-09-07'); // Monday
    // ISO week numbers, verified against an independent oracle.
    const cases: Array<[number, number, number, number]> = [
      [2026, 0, 1, 1], // Thu 1 Jan 2026 → ISO week 1
      [2026, 0, 5, 2], // Mon 5 Jan 2026 → ISO week 2
      [2026, 7, 31, 36], // Mon 31 Aug 2026 → ISO week 36
      [2026, 8, 7, 37], // Mon 7 Sep 2026 → ISO week 37
      [2026, 8, 8, 37], // Tue 8 Sep 2026 → ISO week 37
      [2026, 11, 31, 53], // Thu 31 Dec 2026 → ISO week 53
      [2024, 0, 1, 1], // Mon 1 Jan 2024 → ISO week 1
    ];
    for (const [y, m, d, week] of cases) {
      expect(getWeekNumberISO(new Date(y, m, d)), `${y}-${m + 1}-${d} → week ${week}`).toBe(week);
    }
  });

  test('leading blank cells match the calendar weekday grid', () => {
    // (year, month0, JS firstDayOfWeek 0=Sun … 6=Sat, expected blanks on a Sun grid)
    const cases: Array<[number, number, number, number]> = [
      [2026, 8, 2, 2], // Sep 2026 starts Tuesday → 2 blanks
      [2026, 9, 4, 4], // Oct 2026 starts Thursday → 4 blanks
      [2026, 1, 0, 0], // Feb 2026 starts Sunday → 0 blanks
      [2027, 0, 5, 5], // Jan 2027 starts Friday → 5 blanks
    ];
    for (const [y, m, firstDow, blanks] of cases) {
      expect(getLeadingBlankCount(new Date(y, m, 1), 0)).toBe(blanks);
      expect(new Date(y, m, 1).getDay()).toBe(firstDow); // oracle guard on the fixture
    }
  });

  test('cellScreenStep stays in-month for inner bands and crosses at month edges', () => {
    // September 2026: 2 leading blanks + 30 days → last cell index 31.
    // Top band (cells 0..5) swipe-backward crosses into August.
    const aug = cellScreenStep(2026, 8, 0, 6, -1);
    expect(aug).toEqual({ year: 2026, month0: 7 });
    // Mid band (cells 6..23) stays in September.
    const mid = cellScreenStep(2026, 8, 12, 6, 1);
    expect(mid).toEqual({ year: 2026, month0: 8 });
    // Bottom band (cells 24..31) swipe-forward crosses into October.
    const oct = cellScreenStep(2026, 8, 31, 6, 1);
    expect(oct).toEqual({ year: 2026, month0: 9 });
    // Year rollover: December 2026 (2 leading + 31 days → last cell 32).
    const jan2027 = cellScreenStep(2026, 11, 32, 6, 1);
    expect(jan2027).toEqual({ year: 2027, month0: 0 });
    const dec2026 = cellScreenStep(2027, 0, 0, 6, -1);
    expect(dec2026).toEqual({ year: 2026, month0: 11 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 3. vedicDayChips — the compact आज-strip summary
// ────────────────────────────────────────────────────────────────────────────

test.describe('getDayChips', () => {
  test('real engine day: 2 chips when festivals are shown above, festival chip added when not', () => {
    const day = engineDay(2026, 8, 14); // Ganesh Chaturthi (Ganeshotsav), a festival day
    const withBanner = getDayChips(day, { suppressFestivalNames: true });
    expect(withBanner.length).toBe(2);
    expect(withBanner.map((c) => c.key)).toEqual(['tithi', 'nakshatra']);
    expect(withBanner[0].hi).toContain('चतुर्थी');
    // No chip text may duplicate the festival banner text.
    for (const c of withBanner) {
      expect(c.hi.includes('गणेश')).toBe(false);
      expect(c.en.includes('Ganesh')).toBe(false);
    }
    const bare = getDayChips(day, { suppressFestivalNames: false });
    expect(bare.length).toBe(3);
    expect(bare[2].key).toBe('festival');
    expect(bare[2].hi).toContain('विनायक'); // engine nameHi for Ganesh Chaturthi day
  });

  test('crafted duplicate: identical tithi/festival text collapses to a paksha chip', () => {
    const day: any = {
      tithi: { name: 'Vinayaka Chaturthi', nameHi: 'विनायक चतुर्थी', paksha: 'Shukla Paksha' },
      nakshatra: { name: 'Hasta', nameHi: 'हस्त' },
      festivals: [{ name: 'Vinayaka Chaturthi', nameHi: 'विनायक चतुर्थी' }],
    };
    const chips = getDayChips(day, { suppressFestivalNames: true });
    expect(chips[0].key).toBe('paksha'); // tithi text is duplicated by the banner
    expect(chips[1].key).toBe('nakshatra');
    expect(chips.length).toBe(2);
  });

  test('crafted duplicate: festival banner text identical to the nakshatra drops the nakshatra chip', () => {
    const day: any = {
      tithi: { name: 'Dashami', nameHi: 'दशमी', paksha: 'Shukla Paksha' },
      nakshatra: { name: 'Rohini', nameHi: 'रोहिणी' },
      festivals: [{ name: 'Rohini', nameHi: 'रोहिणी' }],
    };
    const chips = getDayChips(day, { suppressFestivalNames: true });
    expect(chips.map((c) => c.key)).toEqual(['tithi']); // nakshatra suppressed
  });

  test('ordinary day still yields a full tithi chip (never empty)', () => {
    const day = engineDay(2026, 8, 8); // plain Tuesday in Sep 2026
    const chips = getDayChips(day, { suppressFestivalNames: true });
    expect(chips.length).toBeGreaterThanOrEqual(2);
    expect(chips[0].key).toBe('tithi');
    expect(chips.every((c) => c.hi.length > 0)).toBe(true);
  });
});
