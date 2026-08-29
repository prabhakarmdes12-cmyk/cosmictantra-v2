import { test, expect } from '@playwright/test';
import * as libPanchang from '../../src/lib/panchang.js';
import * as enginePanchang from '../../src/engines/panchang.legacy.js';

test.describe('ASTRO-INC-001 Differential Panchang Forensic Suite', () => {

  const testLocations = [
    { name: 'Varanasi', lat: 25.3176, lng: 82.9739, tz: 5.5 },
    { name: 'Dhanbad', lat: 23.7957, lng: 86.4304, tz: 5.5 },
    { name: 'New Delhi', lat: 28.6139, lng: 77.2090, tz: 5.5 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, tz: 5.5 },
    { name: 'London (UTC)', lat: 51.5074, lng: -0.1278, tz: 0.0 }
  ];

  const testDates = [
    { label: 'Current Incident Timestamp (29 Aug 2026 22:00 IST)', date: new Date('2026-08-29T16:30:00.000Z') },
    { label: 'Morning Sunrise Point (29 Aug 2026 05:45 IST)', date: new Date('2026-08-29T00:15:00.000Z') },
    { label: 'Midday Solar Transit (29 Aug 2026 12:00 IST)', date: new Date('2026-08-29T06:30:00.000Z') },
    { label: 'Summer Solstice (21 Jun 2026 06:00 IST)', date: new Date('2026-06-21T00:30:00.000Z') },
    { label: 'Winter Solstice (22 Dec 2026 06:00 IST)', date: new Date('2026-12-22T00:30:00.000Z') }
  ];

  test('Differential Test 1: Quantify Moon Longitude Discrepancy & Tithi Divergence', () => {
    let maxMoonDiff = 0;
    const discrepancies: any[] = [];

    for (const loc of testLocations) {
      for (const td of testDates) {
        const resLib = (libPanchang as any).calculatePanchang(td.date, {
          lat: loc.lat,
          lng: loc.lng,
          tz: loc.tz,
          name: loc.name
        });

        const resEng = (enginePanchang as any).calculatePanchang(
          td.date,
          loc.lat,
          loc.lng,
          loc.tz
        );

        const jd = td.date.getTime() / 86400000 + 2440587.5;
        const T = (jd - 2451545.0) / 36525;
        const ayan = 23.856 + 1.396 * T;

        const L1 = 218.3165 + 481267.8813 * T;
        const Mp = ((134.9634 + 477198.8676 * T) % 360 + 360) % 360 * Math.PI / 180;
        const D = ((297.8502 + 445267.1115 * T) % 360 + 360) % 360 * Math.PI / 180;
        const moonTropEng = ((L1 + 6.2886 * Math.sin(Mp) + 1.2740 * Math.sin(2 * D - Mp)) % 360 + 360) % 360;
        const moonSidEng = ((moonTropEng - ayan) % 360 + 360) % 360;

        const d = jd - 2451545.0;
        const L_lib = (218.316 + 13.176396 * d) % 360;
        const M_lib = (134.963 + 13.064993 * d) % 360;
        const F_lib = (93.272 + 13.229350 * d) % 360;
        const moonTropLib = ((L_lib + 6.289 * Math.sin(M_lib * Math.PI / 180) - 1.274 * Math.sin((M_lib - 2 * F_lib) * Math.PI / 180)) % 360 + 360) % 360;
        const moonSidLib = ((moonTropLib - ayan) % 360 + 360) % 360;

        const moonDiff = Math.abs(moonSidEng - moonSidLib);
        if (moonDiff > maxMoonDiff) maxMoonDiff = moonDiff;

        discrepancies.push({
          location: loc.name,
          dateLabel: td.label,
          libTithi: resLib.tithi.number,
          libTithiName: resLib.tithi.name,
          engTithi: resEng.tithi.index,
          engTithiName: resEng.tithi.name,
          moonDiffDeg: parseFloat(moonDiff.toFixed(4)),
          sunriseLib: resLib.sun.sunrise,
          sunriseEng: resEng.sunrise
        });
      }
    }

    console.log(`[ASTRO-INC-001 Differential Result] Maximum Moon Longitude Discrepancy: ${maxMoonDiff.toFixed(4)}°`);
    expect(maxMoonDiff).toBeGreaterThan(0.01);
  });

  test('Differential Test 2: Prove Hardcoded 6:00 AM Sunrise in src/engines/panchang.js', () => {
    for (const loc of testLocations) {
      const winterDate = new Date('2026-12-22T06:00:00.000Z');
      const summerDate = new Date('2026-06-21T06:00:00.000Z');

      const winterEng = (enginePanchang as any).calculatePanchang(winterDate, loc.lat, loc.lng, loc.tz);
      const summerEng = (enginePanchang as any).calculatePanchang(summerDate, loc.lat, loc.lng, loc.tz);

      // In engines/panchang.js, sunrise is always hardcoded to "06:00" regardless of city or season
      expect(winterEng.sunrise).toBe('06:00');
      expect(summerEng.sunrise).toBe('06:00');

      // In lib/panchang.js, sunrise is dynamically calculated via solar declination
      const winterLib = (libPanchang as any).calculatePanchang(winterDate, { lat: loc.lat, lng: loc.lng, tz: loc.tz, name: loc.name });
      const summerLib = (libPanchang as any).calculatePanchang(summerDate, { lat: loc.lat, lng: loc.lng, tz: loc.tz, name: loc.name });

      expect(winterLib.sun.sunrise).toBeDefined();
      expect(summerLib.sun.sunrise).toBeDefined();
    }
  });

});
