/**
 * Daylight Saving Time determination.
 *
 * ALGORITHM: DST_IANA_TRANSITION_V2
 *
 * The earlier version of this module (DST_IANA_SAMPLED_MONTHLY_MINIMUM) took
 * the smallest offset the zone used during the birth year as "standard time",
 * on the reasoning that daylight saving advances the clock. That heuristic is
 * NOT universally safe: it silently fails for zones with political offset
 * changes, unusual DST rules, multiple transitions per year, or a permanent
 * change of standard offset. It would also answer a definitive YES/NO for
 * histories it cannot actually interpret.
 *
 * This version does not guess. It reconstructs the zone's offset history
 * around the birth instant from IANA data and answers only when the history
 * has one unambiguous reading:
 *
 *   0 transitions in the surrounding year
 *       -> NO. The zone held one offset all year, so nothing was in effect.
 *   2 transitions forming a seasonal pair (base -> advanced -> base)
 *       -> YES if the birth instant sits in the advanced interval,
 *          NO if it sits in a base interval.
 *   anything else — one permanent change, more than two transitions, a
 *   base offset that does not return to itself, or a declared offset that
 *   disagrees with IANA at the birth instant
 *       -> UNDETERMINED, with the reason recorded.
 *
 * All comparisons use absolute instants and an explicit IANA zone, so the
 * answer never depends on the timezone of the machine running this code.
 */

export const DST_ALGORITHM_VERSION = 'DST_IANA_TRANSITION_V2';

export type DstStatus = 'YES' | 'NO' | 'UNDETERMINED';

export interface DstDetermination {
  status: DstStatus;
  /** Offset recorded at the birth instant, in hours. */
  offsetAtBirthHours: number | null;
  /** Base (non-DST) offset derived from the transition history, in hours. */
  standardOffsetHours: number | null;
  /** Name and version of the algorithm that produced this answer. */
  method: typeof DST_ALGORITHM_VERSION | 'NOT_DETERMINED';
  /** Transitions detected in the surrounding year. */
  transitionsInYear: number;
  /** Human-readable explanation shown in the passport. */
  note: string;
}

interface Interval {
  startMs: number;
  endMs: number;
  offsetHours: number;
}

const DAY_MS = 86400000;

/**
 * Season guards, in days.
 *
 * Daylight saving is a seasonal arrangement: the year is split between a base
 * period and an advanced period, and neither is the whole year. These bounds
 * reject histories that alternate between two offsets for other reasons —
 * Morocco, for example, runs UTC+1 permanently and drops to UTC+0 for about a
 * month each Ramadan, which alternates between two offsets without being
 * daylight saving at all.
 *
 * When the guards are not met the answer is UNDETERMINED, never a guess.
 */
const MIN_SEASON_DAYS = 60;
const MAX_SEASON_DAYS = 275;

/** UTC offset in hours for an IANA zone at an absolute instant. */
export function zoneOffsetHours(timezoneId: string, instant: Date): number | null {
  if (!timezoneId) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneId,
      timeZoneName: 'longOffset',
    }).formatToParts(instant);
    const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!m) return name === 'GMT' ? 0 : null;
    const sign = m[1] === '-' ? -1 : 1;
    return sign * (Number(m[2]) + Number(m[3]) / 60);
  } catch {
    return null;
  }
}

/**
 * Locates a transition to within `precisionMs` by bisection between an instant
 * known to be before it and one known to be after it.
 */
function findTransitionMs(
  timezoneId: string,
  beforeMs: number,
  afterMs: number,
  offsetBefore: number,
  precisionMs: number,
): number {
  let lo = beforeMs;
  let hi = afterMs;
  while (hi - lo > precisionMs) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const offset = zoneOffsetHours(timezoneId, new Date(mid));
    if (offset === null || offset === offsetBefore) lo = mid + 1;
    else hi = mid;
  }
  return hi;
}

/** Reconstructs the zone's offset intervals across a window of days. */
function buildIntervals(timezoneId: string, centreMs: number, daysBefore: number, daysAfter: number): Interval[] | null {
  const startMs = centreMs - daysBefore * DAY_MS;
  const endMs = centreMs + daysAfter * DAY_MS;
  const intervals: Interval[] = [];
  let current: Interval | null = null;

  for (let t = startMs; t <= endMs; t += DAY_MS) {
    const offset = zoneOffsetHours(timezoneId, new Date(t));
    if (offset === null) continue;
    if (!current || offset !== current.offsetHours) {
      if (current) current.endMs = t;
      current = { startMs: t, endMs: endMs, offsetHours: offset };
      intervals.push(current);
    }
  }
  if (intervals.length === 0) return null;
  intervals[intervals.length - 1].endMs = endMs;

  // Refine each boundary to the minute so a birth near a transition is
  // classified on the correct side of it.
  for (let i = 1; i < intervals.length; i++) {
    const boundary = findTransitionMs(
      timezoneId,
      intervals[i - 1].startMs,
      intervals[i].startMs,
      intervals[i - 1].offsetHours,
      60 * 1000,
    );
    intervals[i - 1].endMs = boundary;
    intervals[i].startMs = boundary;
  }
  return intervals;
}

function undetermined(
  note: string,
  offsetAtBirthHours: number | null,
  transitionsInYear: number,
): DstDetermination {
  return {
    status: 'UNDETERMINED',
    offsetAtBirthHours,
    standardOffsetHours: null,
    method: 'NOT_DETERMINED',
    transitionsInYear,
    note,
  };
}

/**
 * Determines whether daylight saving was in effect at the birth instant.
 *
 * Returns UNDETERMINED — never a default, never a guess — whenever the zone's
 * transition history does not support a reliable answer.
 */
export function determineDst(
  timezoneId: string,
  birthInstantUtc: string | undefined | null,
  offsetAtBirthHours: number | undefined | null,
): DstDetermination {
  const atBirth = Number.isFinite(offsetAtBirthHours as number) ? (offsetAtBirthHours as number) : null;

  if (!timezoneId) {
    return undetermined('No timezone identifier was recorded, so DST cannot be determined.', atBirth, 0);
  }
  const instant = birthInstantUtc ? new Date(birthInstantUtc) : null;
  if (!instant || Number.isNaN(instant.getTime())) {
    return undetermined('The birth instant could not be parsed, so DST cannot be determined.', atBirth, 0);
  }
  if (atBirth === null) {
    return undetermined('No historical UTC offset was recorded, so DST cannot be determined.', atBirth, 0);
  }

  const intervals = buildIntervals(timezoneId, instant.getTime(), 183, 182);
  if (!intervals || intervals.length === 0) {
    return undetermined(
      `The runtime has no IANA data for ${timezoneId}, so DST is reported as undetermined rather than assumed.`,
      atBirth,
      0,
    );
  }

  const transitions = intervals.length - 1;

  // The zone held a single offset all year: nothing seasonal was in effect.
  if (transitions === 0) {
    const only = intervals[0].offsetHours;
    if (Math.abs(only - atBirth) > 1e-9) {
      return undetermined(
        `IANA records a single offset of UTC${only >= 0 ? '+' : ''}${only} across the year, but the declared offset at birth is UTC${atBirth >= 0 ? '+' : ''}${atBirth}. The disagreement is reported rather than resolved.`,
        atBirth,
        transitions,
      );
    }
    return {
      status: 'NO',
      offsetAtBirthHours: atBirth,
      standardOffsetHours: only,
      method: DST_ALGORITHM_VERSION,
      transitionsInYear: transitions,
      note: `${timezoneId} held a single offset (UTC${only >= 0 ? '+' : ''}${only}) throughout the surrounding year, so no daylight saving was in effect.`,
    };
  }

  // A clean seasonal history alternates between exactly two offsets and
  // returns to the earlier one at least once (base -> advanced -> base, or
  // advanced -> base -> advanced when the window is centred on the winter).
  // Anything with more than two distinct offsets, or with two consecutive
  // intervals sharing an offset, is not that pattern and is not answered.
  const offsetsSeen = intervals.map((i) => i.offsetHours);
  const alternates = offsetsSeen.every((o, i) => i === 0 || o !== offsetsSeen[i - 1]);
  const distinct = [...new Set(offsetsSeen)];
  const structural = intervals.length >= 3 && alternates && distinct.length === 2;

  // Total time spent at each offset, to apply the season guards.
  const daysAt = new Map<number, number>();
  for (const iv of intervals) {
    daysAt.set(iv.offsetHours, (daysAt.get(iv.offsetHours) ?? 0) + (iv.endMs - iv.startMs) / DAY_MS);
  }
  const seasonalSpan = [...daysAt.values()].every(
    (d) => d >= MIN_SEASON_DAYS && d <= MAX_SEASON_DAYS,
  );
  const isSeasonal = structural && seasonalSpan;

  if (structural && !seasonalSpan) {
    return undetermined(
      `${timezoneId} alternates between two offsets but the split is not seasonal (${[...daysAt.entries()]
        .map(([o, d]) => `UTC${o >= 0 ? '+' : ''}${o} for ${Math.round(d)} days`)
        .join('; ')}). That is not a daylight-saving pattern, so no answer is asserted.`,
      atBirth,
      transitions,
    );
  }

  if (isSeasonal) {
    // Within a two-offset seasonal history the smaller offset is the base:
    // daylight saving advances the clock, it never delays it.
    const standard = Math.min(...distinct);
    const advanced = Math.max(...distinct);
    const birthMs = instant.getTime();
    const containing = intervals.find((iv) => birthMs >= iv.startMs && birthMs < iv.endMs)
      ?? intervals[intervals.length - 1];
    const inAdvanced = Math.abs(containing.offsetHours - advanced) < 1e-9;

    // The declared offset must agree with IANA on both counts.
    const expected = inAdvanced ? advanced : standard;
    if (Math.abs(expected - atBirth) > 1e-9) {
      return undetermined(
        `IANA places the birth instant ${inAdvanced ? 'inside' : 'outside'} the advanced interval (UTC${advanced >= 0 ? '+' : ''}${advanced}), implying UTC${expected >= 0 ? '+' : ''}${expected}, but the declared offset is UTC${atBirth >= 0 ? '+' : ''}${atBirth}. The disagreement is reported rather than resolved.`,
        atBirth,
        transitions,
      );
    }
    return {
      status: inAdvanced ? 'YES' : 'NO',
      offsetAtBirthHours: atBirth,
      standardOffsetHours: standard,
      method: DST_ALGORITHM_VERSION,
      transitionsInYear: transitions,
      note: inAdvanced
        ? `IANA data shows ${timezoneId} running UTC${standard >= 0 ? '+' : ''}${standard} outside the seasonal period and UTC${advanced >= 0 ? '+' : ''}${advanced} within it; the birth instant falls inside that advanced period, so daylight saving was in effect.`
        : `IANA data shows ${timezoneId} running UTC${standard >= 0 ? '+' : ''}${standard} outside the seasonal period and UTC${advanced >= 0 ? '+' : ''}${advanced} within it; the birth instant falls outside that period, so daylight saving was not in effect.`,
    };
  }

  // Anything else: a permanent change of standard offset, more than two
  // transitions in a year, or a base offset that never returns to itself.
  const offsets = [...new Set(intervals.map((i) => i.offsetHours))];
  return undetermined(
    `${timezoneId} changed offset ${transitions} time(s) in the surrounding year (offsets seen: ${offsets
      .map((o) => `UTC${o >= 0 ? '+' : ''}${o}`)
      .join(', ')}). That history is not a single seasonal daylight-saving pattern, so no DST answer is asserted.`,
    atBirth,
    transitions,
  );
}

/** Formats a determination for the passport line. */
export function formatDst(d: DstDetermination): string {
  if (d.status === 'UNDETERMINED') return 'Undetermined — not assumed';
  return `${d.status === 'YES' ? 'Yes, in effect at birth' : 'No, not in effect at birth'} (${d.method})`;
}
