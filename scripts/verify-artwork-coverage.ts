/**
 * Artwork coverage verifier — runs the REAL engine (resolveFestivals) across
 * every lunar month × every tithi and checks that the artwork pipeline
 * (getArtworkForFestival / pickDayArtwork) resolves an asset for 100% of
 * emitted observances and 100% of days (tithi fallback).
 */
import { resolveFestivals } from '../src/engines/monthlyPanchangEngine';
import {
  getArtworkForFestival,
  getTithiArtwork,
  pickDayArtwork,
} from '../src/lib/calendar/eventArtwork';

let festivalTotal = 0;
let festivalMissed: Array<string> = [];
let dayTotal = 0;
let dayMissed: Array<string> = [];
let festivalArtHits = 0;
let tithiFallbackHits = 0;

// Simulate a full lunar year: 12 lunar months × 30 tithi positions.
for (let lunarMonth = 0; lunarMonth < 12; lunarMonth++) {
  for (let tithiIdx = 0; tithiIdx < 30; tithiIdx++) {
    const date = new Date(2026, 8, 1); // arbitrary anchor date (engine keys on tithiIdx + lunarMonth)
    const emitted = resolveFestivals(date, tithiIdx, 0, lunarMonth);
    const tithiObj = {
      index: tithiIdx + 1,
      paksha: (tithiIdx < 15 ? 'Shukla Paksha' : 'Krishna Paksha') as 'Shukla Paksha' | 'Krishna Paksha',
    };
    const festivals = emitted.map((f) => ({ name: f.name, nameHi: f.nameHi, isImportant: f.isImportant }));
    const day = { festivals, tithi: tithiObj };

    dayTotal++;
    const dayArt = pickDayArtwork(day);
    if (dayArt) {
      if (dayArt.category === 'TITHI') tithiFallbackHits++;
      else festivalArtHits++;
    } else {
      dayMissed.push(`LM${lunarMonth} tithiIdx=${tithiIdx}`);
    }

    for (const f of emitted) {
      festivalTotal++;
      const art = getArtworkForFestival(f.nameHi, f.name);
      if (!art) festivalMissed.push(`[LM${lunarMonth} t${tithiIdx}] ${f.nameHi} (${f.name})`);
    }
  }
}

// Tithi resolver direct check (all 15 positions × both pakshas)
let tithiMissed: string[] = [];
for (let pos = 1; pos <= 15; pos++) {
  for (const paksha of ['Shukla Paksha', 'Krishna Paksha'] as const) {
    const art = getTithiArtwork({ index: pos <= 15 ? pos : pos + 15, paksha });
    if (!art) tithiMissed.push(`pos=${pos} ${paksha}`);
  }
}

console.log('=== ARTWORK COVERAGE VERIFICATION (real engine + resolver) ===');
console.log(`Lunar days simulated:        ${dayTotal}`);
console.log(`Days with artwork:           ${dayTotal - dayMissed.length}/${dayTotal} (${dayMissed.length ? 'FAIL' : 'PASS'})`);
console.log(`  via festival art:          ${festivalArtHits}`);
console.log(`  via tithi fallback:        ${tithiFallbackHits}`);
console.log(`Festivals emitted:           ${festivalTotal}`);
console.log(`Festivals with artwork:      ${festivalTotal - festivalMissed.length}/${festivalTotal} (${festivalMissed.length ? 'FAIL' : 'PASS'})`);
console.log(`Tithi resolver (30 combos):  ${30 - tithiMissed.length}/30 (${tithiMissed.length ? 'FAIL' : 'PASS'})`);
if (festivalMissed.length) console.log('\nMISSED FESTIVALS:\n' + festivalMissed.join('\n'));
if (dayMissed.length) console.log('\nMISSED DAYS:\n' + dayMissed.join('\n'));
if (tithiMissed.length) console.log('\nMISSED TITHI:\n' + tithiMissed.join('\n'));
const ok = dayMissed.length === 0 && festivalMissed.length === 0 && tithiMissed.length === 0;
console.log(ok ? '\n✅ 100% COVERAGE — every engine-emitted observance and every day resolves artwork.' : '\n❌ COVERAGE GAPS REMAIN');
process.exit(ok ? 0 : 1);
