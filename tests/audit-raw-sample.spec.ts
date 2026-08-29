import { test } from '@playwright/test';
import * as Astronomy from 'astronomy-engine';
import { calculateCelestialEphemeris } from '../src/lib/jyotish/celestialEngine';

test('Audit Raw Numerical Sample Extractions for 7 Historical Dates', () => {
  const dates = [
    { name: '1863 Swami Vivekananda', utcStr: '1863-01-12T00:40:00.000Z', lat: 22.5726, lng: 88.3639, tz: 5.89 },
    { name: '1869 Mahatma Gandhi', utcStr: '1869-10-02T02:32:00.000Z', lat: 21.6417, lng: 69.6293, tz: 4.64 },
    { name: '1879 Albert Einstein', utcStr: '1879-03-14T10:50:00.000Z', lat: 48.4011, lng: 9.9876, tz: 0.67 },
    { name: '1947 India Independence', utcStr: '1947-08-14T18:30:00.000Z', lat: 28.6139, lng: 77.2090, tz: 5.5 },
    { name: '2000 J2000 Millennium Epoch', utcStr: '2000-01-01T12:00:00.000Z', lat: 25.3176, lng: 82.9739, tz: 5.5 },
    { name: '2026 Current Spring Equinox', utcStr: '2026-03-20T14:45:00.000Z', lat: 25.3176, lng: 82.9739, tz: 5.5 },
    { name: '2050 Mid-Century Future', utcStr: '2050-01-01T00:00:00.000Z', lat: 25.3176, lng: 82.9739, tz: 5.5 }
  ];

  console.log('\n=== RAW NUMERICAL EXTRACTIONS FOR 7 HISTORICAL & EPOCH DATES ===\n');

  for (const d of dates) {
    const dateUtc = new Date(d.utcStr);
    const ephem = calculateCelestialEphemeris({
      dateUtc,
      latitude: d.lat,
      longitude: d.lng,
      nodeMode: 'MEAN_NODE'
    });

    const gastHours = Astronomy.SiderealTime(dateUtc);
    const lstHours = ephem.observer.localSiderealTimeHours;

    console.log(`================================================================================`);
    console.log(`CASE: ${d.name}`);
    console.log(`Timestamp UTC  : ${d.utcStr}`);
    console.log(`Coordinates    : Lat ${d.lat}°N, Lon ${d.lng}°E`);
    console.log(`Timescale / JD : JD(TT) = ${ephem.julianDayTT.toFixed(5)} | Delta T = ${ephem.deltaTSeconds.toFixed(2)}s`);
    console.log(`Sidereal Times : GAST = ${gastHours.toFixed(4)}h | LST = ${lstHours.toFixed(4)}h (${ephem.observer.localSiderealTimeDegrees.toFixed(4)}°)`);
    console.log(`Lahiri Ayanamsha: ${ephem.ayanamsha.degrees.toFixed(4)}° (${ephem.ayanamsha.dms})`);
    console.log(`Lagna (Ascendant): Tropical = ${ephem.lagna.tropicalLongitude.toFixed(4)}° | Sidereal = ${ephem.lagna.siderealLongitude.toFixed(4)}° (${ephem.lagna.dms})`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`Body       | Tropical Ecliptic | Sidereal Ecliptic (Lahiri) | Speed (°/d) | Status`);
    console.log(`--------------------------------------------------------------------------------`);
    
    const bodyKeys = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
    for (const k of bodyKeys) {
      const b = (ephem.bodies as any)[k];
      console.log(`${k.padEnd(10)} | ${b.tropicalLongitude.toFixed(4).padStart(17)}° | ${b.siderealLongitude.toFixed(4).padStart(26)}° | ${b.speedDegreesPerDay.toFixed(4).padStart(11)} | ${b.isRetrograde ? 'Retrograde (R)' : 'Direct (D)'}`);
    }
    console.log(`\n`);
  }
});
