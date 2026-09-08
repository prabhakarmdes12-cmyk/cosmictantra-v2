/**
 * Compact Vedic "chip" labels for a panchang day.
 *
 * The mobile आज strip cannot carry the full panchang table, so a day is
 * summarised as 2–3 short chips. This module owns the de-duplication rules so
 * the chips never repeat a name the festival banner already shows.
 */
import { PanchangDayData } from '../../engines/monthlyPanchangEngine';

export interface VedicChip {
  key: string;
  en: string;
  hi: string;
  tone: 'gold' | 'violet' | 'neutral';
}

export interface ChipOptions {
  /** The surface already shows festival names elsewhere (default true). */
  suppressFestivalNames?: boolean;
}

export function getDayChips(day: PanchangDayData, options: ChipOptions = {}): VedicChip[] {
  const suppress = options.suppressFestivalNames ?? true;
  const chips: VedicChip[] = [];
  const isShukla = day.tithi.paksha === 'Shukla Paksha';
  const festivalTexts = new Set<string>();
  for (const f of day.festivals) {
    festivalTexts.add(f.name);
    festivalTexts.add(f.nameHi);
  }

  // 1) Vedic date chip: paksha + tithi. If the tithi text is *identical* to a
  //    festival name already shown above, fall back to a bare paksha chip.
  const tithiHi = `${isShukla ? 'शुक्ल' : 'कृष्ण'} ${day.tithi.nameHi}`.trim();
  const tithiEn = `${isShukla ? 'Shukla' : 'Krishna'} ${day.tithi.name}`.trim();
  const tithiDuplicated =
    suppress &&
    (festivalTexts.has(day.tithi.name) || festivalTexts.has(day.tithi.nameHi));
  if (tithiDuplicated) {
    chips.push({
      key: 'paksha',
      en: isShukla ? 'Shukla Paksha' : 'Krishna Paksha',
      hi: isShukla ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष',
      tone: 'gold',
    });
  } else {
    chips.push({ key: 'tithi', en: tithiEn, hi: tithiHi, tone: 'gold' });
  }

  // 2) Nakshatra chip.
  const nakshatraDuplicated =
    suppress &&
    (festivalTexts.has(day.nakshatra.name) || festivalTexts.has(day.nakshatra.nameHi));
  if (!nakshatraDuplicated) {
    chips.push({
      key: 'nakshatra',
      en: day.nakshatra.name,
      hi: day.nakshatra.nameHi,
      tone: 'neutral',
    });
  }

  // 3) Festival chip only when the surface has no festival banner.
  if (!suppress && day.festivals.length > 0) {
    chips.push({
      key: 'festival',
      en: day.festivals[0].name,
      hi: day.festivals[0].nameHi,
      tone: 'violet',
    });
  }

  return chips;
}
