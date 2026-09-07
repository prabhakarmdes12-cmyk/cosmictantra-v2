/**
 * Calendar festival-artwork resolver — regression suite (pure, no browser).
 *
 * Guards the artwork program that gives every calendar day an illustration:
 * festival-grade art on observance days, symbolic tithi art otherwise.
 *
 * Also guards the engine astronomy corrections this program depends on:
 *   1. Amanta (new-moon → new-moon) lunation tracker for festival MONTHS.
 *      The earlier sign-anchored index (sunRasi+1)%12 drifts a full lunation
 *      in Adhika-māsa years (2026): Guru Purnima, Raksha Bandhan and the
 *      whole Sharad/Kartika cluster landed ~30 days early. Festivals are now
 *      placed from true amavasya instants, named by their in-month saṅkrānti,
 *      with Adhika months suppressing month-qualified festivals and Kṛṣṇa
 *      pakṣas named purnimanta-style (following lunation). Day/masa labels
 *      keep the old solar-sign convention (byte-stable, pinned elsewhere).
 *   2. Sunrise skip-rescue: tithis shorter than a civil day (moon near
 *      perigee) that slip entirely between noon samples are emitted on their
 *      local-sunrise day instead of silently vanishing, with cross-month
 *      dedupe (an observance never fires twice, never drops).
 *   3. Guru Purnima (Shuddha-Ashadha Purnima) and Makar Sankranti (sidereal
 *      Sun 270° crossing) are emitted — they were never emitted before.
 *      The misdated "Krishna Janmashtami (Smarta)" duplicate (a whole lunation
 *      early, in Shravana) is removed — Janmashtami is Bhadrapada Krishna
 *      Ashtami, once per year.
 */

import { test, expect } from '@playwright/test';
import { calculateMonthPanchang, buildAmantaLunations } from '../src/engines/monthlyPanchangEngine';
import { UPCOMING_EVENTS } from '../src/lib/festivals.js';
import {
  resolveDayArtwork,
  resolveTithiArtKey,
  resolveFestivalTitleArtwork,
  FESTIVAL_TOKENS,
  CATEGORY_FALLBACKS,
  TITHI_ART,
  ALL_ARTWORK_KEYS,
} from '../src/lib/calendar/festivalArtwork';
const CITY = { lat: 25.3176, lng: 82.9739, tz: 5.5, name: 'Varanasi' };

function dayOf(year: number, month0: number, date: string) {
  const overview = calculateMonthPanchang(year, month0, CITY.lat, CITY.lng, CITY.tz);
  const day = overview.days.find((d) => d.dateString === date);
  expect(day, `day ${date} exists`).toBeTruthy();
  return day!;
}

test.describe('Engine astronomy corrections', () => {
  test('Makar Sankranti fires on 14 January 2026 (sidereal Sun crosses 270°)', () => {
    const day = dayOf(2026, 0, '2026-01-14');
    expect(day.festivals.map((f) => f.name)).toContain('Makar Sankranti');
    // Not on the surrounding days.
    expect(dayOf(2026, 0, '2026-01-13').festivals.map((f) => f.name)).not.toContain('Makar Sankranti');
    expect(dayOf(2026, 0, '2026-01-15').festivals.map((f) => f.name)).not.toContain('Makar Sankranti');
  });

  test('Guru Purnima fires on the true Ashadha Purnima, not the mislabelled lunation (2026)', () => {
    // 2026 has Adhika-Jyeshtha (17 May – 15 Jun). The old sign-anchored index
    // called the 29 Jun Purnima "Ashadha" and fired Guru Purnima there; that
    // lunation is really (shuddha) Jyeshtha. Guru Purnima = Ashadha Purnima =
    // 29 Jul 2026 (the web-confirmed observance).
    const jyeshthaPurnima = dayOf(2026, 5, '2026-06-29');
    expect(jyeshthaPurnima.festivals.map((f) => f.name)).not.toContain('Guru Purnima');
    const ashadhaPurnima = dayOf(2026, 6, '2026-07-29');
    expect(ashadhaPurnima.festivals.map((f) => f.name)).toContain('Guru Purnima');
    expect(ashadhaPurnima.tithi.name).toBe('Purnima');
  });

  test('month-qualified festivals sit on their real 2026 civil dates (Amanta-correct, was ~1 month early in the Adhika year)', () => {
    // Reference dates: web-confirmed 2026 observances (drik-style). ±1-day
    // cases are real regional splits (e.g. Raksha Bandhan 27 vs 28 Aug was
    // itself a national 2026 debate) — the unambiguous majors are exact.
    const anchors: Array<[string, string]> = [
      ['2026-01-23', 'Vasant Panchami / Saraswati Puja'],
      ['2026-02-15', 'Maha Shivaratri'],
      ['2026-03-19', 'Chaitra Navaratri / Hindu New Year'],
      ['2026-03-26', 'Shri Ram Navami'],
      ['2026-04-01', 'Hanuman Jayanti'],
      ['2026-07-29', 'Guru Purnima'],
      ['2026-08-27', 'Raksha Bandhan / Shravani Upakarma'], // tithi day; observance Aug 28 (Bhadra) — ±1 regional
      ['2026-09-04', 'Krishna Janmashtami'],
      ['2026-09-14', 'Ganesh Chaturthi (Ganeshotsav)'],
      ['2026-10-11', 'Sharad Navaratri Ghatasthapana'],
      ['2026-10-18', 'Maha Ashtami / Durga Ashtami'],
      ['2026-10-20', 'Vijayadashami / Dussehra'],
      ['2026-10-25', 'Sharad Purnima / Kojagari'],
      ['2026-10-29', 'Karwa Chauth Vrat'],
      ['2026-11-06', 'Dhanteras / Dhanvantari Jayanti'],
      ['2026-11-08', 'Diwali / Lakshmi Puja'],
      ['2026-11-15', 'Chhath Puja (Sandhya Arghya)'],
      ['2026-11-24', 'Kartika Purnima / Dev Deepawali'],
    ];
    for (const [date, fest] of anchors) {
      const [y, m] = date.split('-').map(Number);
      const day = dayOf(y, m - 1, date);
      expect(day.festivals.map((f) => f.name), `${date} should carry ${fest}`).toContain(fest);
    }
  });

  test('Janmashtami fires exactly once per year (no spurious Shravana "Smarta" duplicate)', () => {
    for (const year of [2026, 2027, 2028]) {
      const days: string[] = [];
      for (let m = 0; m < 12; m++) {
        const overview = calculateMonthPanchang(year, m, CITY.lat, CITY.lng, CITY.tz);
        for (const d of overview.days) {
          if (d.festivals.some((f) => f.name.includes('Janmashtami'))) days.push(d.dateString);
        }
      }
      expect(days, `${year} Janmashtami occurrences`).toEqual([year === 2026 ? '2026-09-04' : year === 2027 ? '2027-08-25' : '2028-08-13']);
    }
  });
});

test.describe('Amanta lunation tracker (Phase A astronomy)', () => {
  const LUNAR = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'];

  test('2026 has exactly one Adhika lunation — Adhika Jyeshtha (web-confirmed: 17 May – 15 Jun 2026)', () => {
    const luns = buildAmantaLunations(
      Date.UTC(2026, 4, 1) / 86400000 + 2440587.5,
      Date.UTC(2026, 7, 31) / 86400000 + 2440587.5
    );
    const adhika = luns.filter((l) => l.adhika);
    expect(adhika.length).toBe(1);
    const adhikaStart = new Date((adhika[0].startJd - 2440587.5) * 86400000).toISOString().slice(0, 10);
    expect(['2026-05-16', '2026-05-17', '2026-05-18']).toContain(adhikaStart);
    // The Adhika month repeats the FOLLOWING shuddha month's name.
    const nextAfter = luns[luns.indexOf(adhika[0]) + 1];
    expect(LUNAR[nextAfter.monthIndex]).toBe('Jyeshtha'); // Adhika-Jyeshtha
  });

  test('every yearly festival fires exactly 3× across 2026–2028 (no double-fires, no drops)', () => {
    const universal = new Set([
      'Shukla Ekadashi Vrat', 'Krishna Ekadashi Vrat', 'Pradosha Vrat',
      'Purnima Vrat / Satyanarayan Puja', 'Amavasya / Pitru Tarpana',
      'Vinayaka Chaturthi', 'Sankashti Chaturthi',
    ]);
    const occ = new Map<string, number>();
    for (let y = 2026; y <= 2028; y++) {
      for (let m = 0; m < 12; m++) {
        const overview = calculateMonthPanchang(y, m, CITY.lat, CITY.lng, CITY.tz);
        for (const d of overview.days) for (const f of d.festivals) {
          if (!universal.has(f.name)) occ.set(f.name, (occ.get(f.name) || 0) + 1);
        }
      }
    }
    expect(occ.size).toBeGreaterThanOrEqual(26);
    for (const [name, n] of occ) {
      expect(n, `${name} fires exactly 3× over 2026–2028`).toBe(3);
    }
  });

  test('sunrise skip-rescue: Dhanteras 2028 + Hanuman Jayanti 2028 are not dropped between noon samples', () => {
    const dhanteras = dayOf(2028, 9, '2028-10-16');
    expect(dhanteras.festivals.map((f) => f.name)).toContain('Dhanteras / Dhanvantari Jayanti');
    const hanuman = dayOf(2028, 3, '2028-04-09');
    expect(hanuman.festivals.map((f) => f.name)).toContain('Hanuman Jayanti');
    // Only one day each that year carries them.
    for (const [year, needle] of [[2028, 'Dhanteras / Dhanvantari Jayanti'], [2028, 'Hanuman Jayanti']] as const) {
      let count = 0;
      for (let m = 0; m < 12; m++) {
        const overview = calculateMonthPanchang(year, m, CITY.lat, CITY.lng, CITY.tz);
        for (const d of overview.days) {
          if (d.festivals.some((f) => f.name === needle)) count++;
        }
      }
      expect(count, `${needle} ${year}`).toBe(1);
    }
  });

  test('cross-month dedupe: month-boundary tithis do not double-fire', () => {
    // Sharad Navaratri 2027 must fire ONLY 2027-09-30 (not again Oct 1 via a
    // fresh month call), and Vasant Panchami 2028 only 2028-01-31.
    let ghatas: string[] = [];
    let vasant: string[] = [];
    for (let m = 0; m < 12; m++) {
      const a = calculateMonthPanchang(2027, m, CITY.lat, CITY.lng, CITY.tz);
      for (const d of a.days) if (d.festivals.some((f) => f.name.includes('Navaratri Ghatasthapana'))) ghatas.push(d.dateString);
      const b = calculateMonthPanchang(2028, m, CITY.lat, CITY.lng, CITY.tz);
      for (const d of b.days) if (d.festivals.some((f) => f.name.includes('Vasant Panchami'))) vasant.push(d.dateString);
    }
    expect(ghatas).toEqual(['2027-09-30']);
    expect(vasant).toEqual(['2028-01-31']);
  });
});

test.describe('resolveDayArtwork', () => {
  test('festival days resolve to their dedicated festival artwork (sticker)', () => {
    const ganesh = dayOf(2026, 8, '2026-09-14');
    const art = resolveDayArtwork(ganesh as any)!;
    expect(art.kind).toBe('festival');
    expect(art.isFestivalDay).toBe(true);
    expect(art.key).toBe('ganesh_chaturthi');

    const diwali = dayOf(2026, 10, '2026-11-08');
    expect(resolveDayArtwork(diwali as any)!.key).toBe('diwali');

    // Specific festival beats the same-day generic vrat token:
    // Sharad Purnima (2026-10-25) is also a Purnima Vrat day — the specific
    // artwork must win.
    const sharad = dayOf(2026, 9, '2026-10-25');
    expect(sharad.festivals.map((f) => f.name)).toContain('Sharad Purnima / Kojagari');
    const sharadArt = resolveDayArtwork(sharad as any)!;
    expect(sharadArt.isFestivalDay).toBe(true);
    expect(sharadArt.key).toBe('sharad_purnima');
  });

  test('recurring vrat tokens map inside the allowed artwork set', () => {
    // Find the first Ekadashi day of 2026 programmatically.
    let ekadashi: (ReturnType<typeof dayOf>) | null = null;
    for (let m = 0; m < 12 && !ekadashi; m++) {
      const overview = calculateMonthPanchang(2026, m, CITY.lat, CITY.lng, CITY.tz);
      ekadashi = overview.days.find((d) => d.festivals.some((f) => f.name.includes('Ekadashi'))) || null;
    }
    expect(ekadashi).toBeTruthy();
    const art = resolveDayArtwork(ekadashi! as any)!;
    expect(art.kind).toBe('festival');
    expect(['ekadashi', 'tithi_ekadashi']).toContain(art.key);
  });

  test('ordinary days always resolve to the symbolic tithi artwork', () => {
    const day = dayOf(2026, 4, '2026-05-10');
    expect(day.festivals.length).toBe(0);
    const art = resolveDayArtwork(day as any)!;
    expect(art.kind).toBe('tithi');
    expect(art.isFestivalDay).toBe(false);
    expect(art.key.startsWith('tithi_')).toBe(true);
    expect(Object.values(TITHI_ART)).toContain(art.key);
  });

  test('30/30 tithi×paksha combos resolve to one of the 16 tithi files', () => {
    const combos = new Set<string>();
    for (let m = 0; m < 12; m++) {
      const overview = calculateMonthPanchang(2026, m, CITY.lat, CITY.lng, CITY.tz);
      for (const d of overview.days) combos.add(`${d.tithi.paksha}|${d.tithi.name}`);
    }
    expect(combos.size).toBe(30);
    for (const combo of combos) {
      const [paksha, name] = combo.split('|');
      const idx = TITHI_INDEX_BY_NAME[name];
      const key = resolveTithiArtKey({
        index: idx !== undefined ? idx + (paksha === 'Krishna Paksha' && idx !== 14 ? 15 : 0) + 1 : undefined,
        name,
      });
      expect(key, `combo ${combo}`).toBeTruthy();
      expect(Object.values(TITHI_ART), `combo ${combo}`).toContain(key!);
    }
  });

  test('full-year sweep: zero unresolved days (365/365)', () => {
    let unresolved = 0;
    for (let m = 0; m < 12; m++) {
      const overview = calculateMonthPanchang(2026, m, CITY.lat, CITY.lng, CITY.tz);
      for (const d of overview.days) {
        if (!resolveDayArtwork(d as any)) unresolved++;
      }
    }
    expect(unresolved).toBe(0);
  });
});

test.describe('resolveFestivalTitleArtwork — festival detail pages', () => {
  test('every UPCOMING_EVENTS festival title resolves to artwork from the 49-file set', () => {
    expect(UPCOMING_EVENTS.length).toBeGreaterThan(0);
    for (const ev of UPCOMING_EVENTS) {
      const art = resolveFestivalTitleArtwork(ev.name);
      expect(art, `art for "${ev.name}"`).toBeTruthy();
      expect(ALL_ARTWORK_KEYS.has(art!.key), `"${ev.name}" → ${art!.key} in set`).toBe(true);
      expect(art!.isFestivalDay).toBe(true);
    }
  });

  test('spot mapping: Navratri, Dev Deepawali, Sharad Purnima, Amavasya pick their hero art', () => {
    expect(resolveFestivalTitleArtwork('Shardiya Navratri Ghatasthapana')!.key).toBe('navratri');
    expect(resolveFestivalTitleArtwork('Kashi Dev Deepawali (देव दीपावली)')!.key).toBe('dev_deepawali');
    expect(resolveFestivalTitleArtwork('Sharad Purnima (Kojagiri)')!.key).toBe('sharad_purnima');
    expect(resolveFestivalTitleArtwork('Sarva Pitru Amavasya (Mahalaya)')!.key).toBe('tithi_amavasya');
    expect(resolveFestivalTitleArtwork('Aja Ekadashi (अजा एकादशी)')!.key).toBe('ekadashi');
    expect(resolveFestivalTitleArtwork('Bhadrapada Pradosh Vrat (प्रदोष)')!.key).toBe('pradosh');
  });

  test('unknown title degrades to the generic festival-lights art, never null', () => {
    const art = resolveFestivalTitleArtwork('Something Never Seen Before');
    expect(art).toBeTruthy();
    expect(art!.key).toBe('diwali_diyas');
    expect(resolveFestivalTitleArtwork(null)).toBeNull();
    expect(resolveFestivalTitleArtwork('   ')).toBeNull();
  });
});

test.describe('Token & asset integrity', () => {
  test('program inventory is exactly 49 artwork keys (15 core + 10 expanded + 16 tithi + 8 category)', () => {
    expect(ALL_ARTWORK_KEYS.size).toBe(49);
    // 15 core + 10 expanded festival files, 8 category fallbacks, 16 tithi.
    const festivalKeys = new Set(Object.values(FESTIVAL_TOKENS).map((e) => e.art));
    const categoryKeys = Object.values(CATEGORY_FALLBACKS);
    const tithiKeys = Object.values(TITHI_ART);
    expect(festivalKeys.size).toBeGreaterThanOrEqual(15);
    expect(tithiKeys.length).toBe(16);
    expect(categoryKeys.length).toBe(8);
    for (const key of [...festivalKeys, ...categoryKeys, ...tithiKeys]) {
      expect(ALL_ARTWORK_KEYS.has(key), `art key ${key} registered`).toBe(true);
    }
  });

  test('every festival token art lives inside the registered artwork set', () => {
    for (const entry of Object.values(FESTIVAL_TOKENS)) {
      expect(ALL_ARTWORK_KEYS.has(entry.art), `token art ${entry.art}`).toBe(true);
    }
  });

  test('on-disk artwork gate: run scripts/verify-artwork-coverage.ts', () => {
    // The strict "every referenced asset exists on disk" gate lives in
    // scripts/verify-artwork-coverage.ts (runs the real engine over a full
    // year). It is invoked by CI / the release command:
    //   npx tsx scripts/verify-artwork-coverage.ts
    expect(ALL_ARTWORK_KEYS.size).toBeGreaterThan(0);
  });

  test('every engine-emitted festival name (full 2026 year) has a token', () => {
    const emitted = new Set<string>();
    for (let m = 0; m < 12; m++) {
      const overview = calculateMonthPanchang(2026, m, CITY.lat, CITY.lng, CITY.tz);
      for (const d of overview.days) for (const f of d.festivals) emitted.add(f.name);
    }
    for (const name of emitted) {
      expect(FESTIVAL_TOKENS[name], `missing token for engine festival "${name}"`).toBeTruthy();
    }
  });
});

const TITHI_INDEX_BY_NAME: Record<string, number> = (() => {
  const names = [
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
  ];
  const map: Record<string, number> = {};
  names.forEach((n, i) => { map[n] = i; });
  return map;
})();
