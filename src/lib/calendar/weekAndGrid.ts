/**
 * Week & grid geometry helpers for the calendar UI.
 *
 * Pure date arithmetic shared by:
 *  - the "today" behaviour (weekday highlight, week number chip);
 *  - month-grid swipe/tap gestures ("jump one screen of cells at a time");
 *  - iOS-style week start configuration.
 */

/** Weekday number of the (local) Monday-start week: Mon=0 … Sun=6. */
export function getMondayStartDow(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Date of the Monday that starts `date`'s week (local, time-preserved). */
export function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return d;
}

/** ISO-8601 week number (weeks start Monday; week 1 contains 4+ days of the year). */
export function getWeekNumberISO(date: Date): number {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = Math.floor((target.getTime() - Date.UTC(target.getUTCFullYear(), 0, 1)) / 86400000);
  const weekNr = Math.ceil((dayNr + 1) / 7);
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + (4 - dayNum));
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Starting weekday of a month's grid when weeks start on `weekStartDow`
 * (0=Sunday … 6=Saturday). Returns 0..6 — the number of leading blank cells.
 */
export function getLeadingBlankCount(monthDate: Date, weekStartDow: number): number {
  const firstDow = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
  return (firstDow - weekStartDow + 7) % 7;
}

/**
 * Move a month cursor by one "screen" of a 7×N grid: if the user is on the
 * middle or bottom rows the gesture goes to the *next* calendar month; from
 * the top row it returns to the *previous* month. Deterministic so the swipe
 * and the month-labelled prev/next buttons never drift apart.
 */
export function cellScreenStep(
  year: number,
  month0: number,
  currentCellIndex: number,
  cellsPerScreen: number,
  direction: 1 | -1
): { year: number; month0: number } {
  const monthDate = new Date(year, month0, 1);
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const leading = getLeadingBlankCount(monthDate, 0);
  const lastCell = leading + daysInMonth - 1;
  // Which screen band the current cell sits in (0 = top band).
  const currentBand = Math.floor(currentCellIndex / cellsPerScreen);
  if (direction === 1) {
    const nextStart = (currentBand + 1) * cellsPerScreen;
    const nextMonth = nextStart > lastCell;
    if (nextMonth) {
      return month0 === 11
        ? { year: year + 1, month0: 0 }
        : { year, month0: month0 + 1 };
    }
    return { year, month0 };
  }
  const prevStart = currentBand * cellsPerScreen - cellsPerScreen;
  const prevMonth = prevStart < leading;
  if (prevMonth) {
    return month0 === 0
      ? { year: year - 1, month0: 11 }
      : { year, month0: month0 - 1 };
  }
  return { year, month0 };
}
