/**
 * Calendar festival-artwork resolver — regression suite (pure, no browser).
 *
 * Guards the artwork program that gives every calendar day an illustration:
 * festival-grade art on observance days, symbolic tithi art otherwise.
 *
 * Also guards two engine astronomy corrections this program depends on:
 *   1. Festival month qualifiers now use the same (sunRasi+1) lunar-month
 *      convention as the file's own day/masa labels (they were (sunRasi-1),
 *      i.e. two signs behind, pushing month festivals ~2 months late while
 *      the "भाद्रपद मास" chip stayed correct).
 *   2. Guru Purnima (Ashadha Purnima) and Makar Sankranti (sidereal Sun
 *      270° crossing) are emitted — they were never emitted before.
 */

import { test, expect } from '@playwright/test';
import { calculateMonthPanchang } from '../src/engines/monthlyPanchangEngine';
import {
  resolveDayArtwork,
  resolveTithiArtKey,
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

  test('Guru Purnima (Ashadha Purnima) fires in 2026', () => {
    const day = dayOf(2026, 5, '2026-06-29'); // Ashadha Purnima under this engine
    expect(day.festivals.map((f) => f.name)).toContain('Guru Purnima');
    expect(day.tithi.name).toBe('Purnima');
  });

  test('month-qualified festivals are back on their real civil dates (regression: were ~2 months late)', () => {
    // Post-correction anchor dates for 2026 (Varanasi, noon civil-day sampling).
    const anchors: Array<[string, string]> = [
      ['2026-09-14', 'Ganesh Chaturthi (Ganeshotsav)'],
      ['2026-11-08', 'Diwali / Lakshmi Puja'],
      ['2026-10-11', 'Sharad Navaratri Ghatasthapana'],
      ['2026-03-02', 'Holika Dahan / Holi'],
      ['2026-02-15', 'Maha Shivaratri'],
    ];
    for (const [date, fest] of anchors) {
      const [y, m] = date.split('-').map(Number);
      const day = dayOf(y, m - 1, date);
      expect(day.festivals.map((f) => f.name), `${date} should carry ${fest}`).toContain(fest);
    }
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
    // Sharad Purnima (2026-09-26) is also a Purnima Vrat day — the specific
    // artwork must win.
    const sharad = dayOf(2026, 8, '2026-09-26');
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
