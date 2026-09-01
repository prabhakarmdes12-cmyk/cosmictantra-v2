/**
 * Daylight Saving Time determination.
 *
 * The resolver already records the historical UTC offset at the birth instant,
 * but "was DST in effect" is a separate question the passport must answer
 * without inventing an answer. This module answers it from IANA data, and
 * returns UNDETERMINED when the data is not available — never a guess.
 *
 * Method: sample the offset on the 15th of every month of the birth year in
 * the birth zone, take the smallest offset as the zone's standard offset
 * (daylight saving advances the clock, so the standard offset is the earliest
 * one), and compare it with the offset recorded at the birth instant.
 * Sampling a full year is what makes this work in the southern hemisphere,
 * where DST runs across the turn of the year.
 *
 * Known limit: a zone that ever applied NEGATIVE daylight saving (a standard
 * time that is itself advanced relative to winter) would be classified with
 * the winter offset as standard. That matches how such zones are conventionally
 * reported, and the note on every determination states the method used.
 */

export type DstStatus = 'YES' | 'NO' | 'UNDETERMINED';

export interface DstDetermination {
  status: DstStatus;
  /** Offset recorded at the birth instant, in hours. */
  offsetAtBirthHours: number | null;
  /** Modal offset across the birth year, in hours. */
  standardOffsetHours: number | null;
  /** How the answer was reached, recorded in the report. */
  method: 'IANA_SAMPLED_MONTHLY_MINIMUM' | 'NOT_DETERMINED';
  /** Human-readable explanation shown in the passport. */
  note: string;
}

/** UTC offset in hours for an IANA zone at an instant, or null if unavailable. */
export function zoneOffsetHours(timezoneId: string, instant: Date): number | null {
  if (!timezoneId) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneId,
      timeZoneName: 'longOffset',
    }).formatToParts(instant);
    const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    // Format: "GMT+05:30" or "GMT" (no offset suffix means UTC+0).
    const m = name.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!m) return name === 'GMT' ? 0 : null;
    const sign = m[1] === '-' ? -1 : 1;
    return sign * (Number(m[2]) + Number(m[3]) / 60);
  } catch {
    return null;
  }
}

/**
 * Determines whether DST was in effect at the birth instant.
 *
 * Returns UNDETERMINED (never a default) when the zone is unknown to the
 * runtime or the birth instant cannot be parsed.
 */
export function determineDst(
  timezoneId: string,
  birthInstantUtc: string | undefined | null,
  offsetAtBirthHours: number | undefined | null,
): DstDetermination {
  const undetermined = (note: string): DstDetermination => ({
    status: 'UNDETERMINED',
    offsetAtBirthHours: Number.isFinite(offsetAtBirthHours as number) ? (offsetAtBirthHours as number) : null,
    standardOffsetHours: null,
    method: 'NOT_DETERMINED',
    note,
  });

  if (!timezoneId) return undetermined('No timezone identifier was recorded, so DST cannot be determined.');
  const instant = birthInstantUtc ? new Date(birthInstantUtc) : null;
  if (!instant || Number.isNaN(instant.getTime())) {
    return undetermined('The birth instant could not be parsed, so DST cannot be determined.');
  }
  if (!Number.isFinite(offsetAtBirthHours as number)) {
    return undetermined('No historical UTC offset was recorded, so DST cannot be determined.');
  }

  const year = instant.getUTCFullYear();
  const samples: number[] = [];
  for (let month = 0; month < 12; month++) {
    const sample = zoneOffsetHours(timezoneId, new Date(Date.UTC(year, month, 15, 12, 0, 0)));
    if (sample !== null) samples.push(sample);
  }
  if (samples.length === 0) {
    return undetermined(
      `The runtime has no IANA data for ${timezoneId}, so DST is reported as undetermined rather than assumed.`,
    );
  }

  // Standard offset is the SMALLEST offset the zone uses during the birth
  // year, because daylight saving advances the clock rather than delaying it.
  // The modal offset is not usable here: in zones where DST covers more than
  // half the year (much of the United States, for example) the mode IS the
  // daylight offset, which would report no DST in June.
  const standard = Math.min(...samples);

  const atBirth = offsetAtBirthHours as number;
  const active = Math.abs(atBirth - standard) > 1e-9;
  return {
    status: active ? 'YES' : 'NO',
    offsetAtBirthHours: atBirth,
    standardOffsetHours: standard,
    method: 'IANA_SAMPLED_MONTHLY_MINIMUM',
    note: active
      ? `The offset at birth (UTC${atBirth >= 0 ? '+' : ''}${atBirth}) differs from the standard offset for ${timezoneId} in ${year} (UTC${standard >= 0 ? '+' : ''}${standard}), so daylight saving time was in effect.`
      : `The offset at birth (UTC${atBirth >= 0 ? '+' : ''}${atBirth}) equals the standard offset for ${timezoneId} in ${year} (UTC${standard >= 0 ? '+' : ''}${standard}), so daylight saving time was not in effect.`,
  };
}

/** Formats a determination for the passport line. */
export function formatDst(d: DstDetermination): string {
  if (d.status === 'UNDETERMINED') return 'Undetermined — not assumed';
  return `${d.status === 'YES' ? 'Yes, in effect at birth' : 'No, not in effect at birth'} (${d.method.replace(/_/g, ' ').toLowerCase()})`;
}
