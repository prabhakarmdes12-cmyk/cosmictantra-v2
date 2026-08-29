import { test, expect } from '@playwright/test';
import { calculatePanchang } from '../src/lib/panchang.js';
import { calculateMonthPanchang } from '../src/engines/monthlyPanchangEngine';

test.describe('Vedic Hindu Lunar Maas (Month) & Tithi Qualification Suite', () => {

  test('1. Verify 30 August 2026 in Dhanbad, Jharkhand produces Bhadrapada Maas', () => {
    const d = new Date('2026-08-30T04:05:20+05:30');
    const city = { lat: 23.7957, lng: 86.4304, tz: 5.5, name: 'Dhanbad' };
    const p = calculatePanchang(d, city);

    // 1. Maas must be Bhadrapada (भाद्रपद)
    expect(p.masa.name).toBe('Bhadrapada');
    expect(p.masa.nameHi).toBe('भाद्रपद');

    // 2. Ritu must be Varsha (वर्षा ऋतु)
    expect(p.ritu.nameHi).toBe('वर्षा ऋतु');

    // 3. Ayana must be Dakshinayana (दक्षिणायन)
    expect(p.ayana.nameHi).toBe('दक्षिणायन');

    // 4. Samvat must be Vikram Samvat 2083
    expect(p.samvat.vikram).toBe(2083);

    // 5. Tithi must be Krishna Paksha Dwitiya/Tritiya
    expect(p.tithi.paksha).toBe('Krishna Paksha');
    expect(['Dwitiya', 'Tritiya']).toContain(p.tithi.name);

    // 6. Nakshatra must be Uttara Bhadrapada
    expect(p.nakshatra.name).toBe('Uttara Bhadrapada');

    console.log('Verified 30 Aug 2026 Dhanbad:');
    console.log(`Masa: ${p.masa.nameHi} (${p.masa.name}) | Tithi: ${p.tithi.fullName} | Ritu: ${p.ritu.nameHi} | Ayana: ${p.ayana.nameHi} | Samvat: ${p.samvat.vikram}`);
  });

  test('2. Verify All 12 Solar Months Map to Correct Vedic Maas', () => {
    const testCases = [
      { date: '2026-04-20', expectedMasa: 'Vaishakha', expectedMasaHi: 'वैशाख' },
      { date: '2026-05-20', expectedMasa: 'Jyeshtha', expectedMasaHi: 'ज्येष्ठ' },
      { date: '2026-06-20', expectedMasa: 'Ashadha', expectedMasaHi: 'आषाढ़' },
      { date: '2026-07-20', expectedMasa: 'Shravana', expectedMasaHi: 'श्रावण' },
      { date: '2026-08-20', expectedMasa: 'Bhadrapada', expectedMasaHi: 'भाद्रपद' },
      { date: '2026-09-20', expectedMasa: 'Ashwin', expectedMasaHi: 'आश्विन' },
      { date: '2026-10-20', expectedMasa: 'Kartika', expectedMasaHi: 'कार्तिक' },
      { date: '2026-11-20', expectedMasa: 'Margashirsha', expectedMasaHi: 'मार्गशीर्ष' },
      { date: '2026-12-20', expectedMasa: 'Pausha', expectedMasaHi: 'पौष' },
      { date: '2027-01-20', expectedMasa: 'Magha', expectedMasaHi: 'माघ' },
      { date: '2027-02-20', expectedMasa: 'Phalguna', expectedMasaHi: 'फाल्गुन' },
      { date: '2027-03-20', expectedMasa: 'Chaitra', expectedMasaHi: 'चैत्र' }
    ];

    const city = { lat: 25.3176, lng: 82.9739, tz: 5.5, name: 'Varanasi' };

    testCases.forEach(tc => {
      const p = calculatePanchang(new Date(tc.date + 'T12:00:00+05:30'), city);
      expect(p.masa.name).toBe(tc.expectedMasa);
      expect(p.masa.nameHi).toBe(tc.expectedMasaHi);
    });

    console.log('All 12 Solar Months verified with 100% accuracy!');
  });

  test('3. Verify Monthly Panchang Engine computes Bhadrapada for August 2026', () => {
    const overview = calculateMonthPanchang(2026, 7, 23.7957, 86.4304, 5.5); // Month 7 = August
    expect(overview.lunarMonth).toContain('Bhadrapada');
    expect(overview.lunarMonthHi).toContain('भाद्रपद');
    expect(overview.rituHi).toContain('वर्षा ऋतु');
    expect(overview.ayanaHi).toContain('दक्षिणायन');

    // On August 30 (day index 29)
    const day30 = overview.days[29];
    expect(day30.lunarMonth).toBe('Bhadrapada');
    expect(day30.lunarMonthHi).toBe('भाद्रपद');
    expect(day30.tithi.paksha).toBe('Krishna Paksha');
  });

});
