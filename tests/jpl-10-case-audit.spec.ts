import { test, expect } from '@playwright/test';
import * as https from 'https';
import { calculateCelestialEphemeris } from '../src/lib/jyotish/celestialEngine';

function queryHorizons(params: Record<string, string>): Promise<{ json: any; url: string }> {
  return new Promise((resolve, reject) => {
    const queryStr = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?format=json&${queryStr}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ json, url });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const testCases = [
  { name: '1. Sun — J2000', command: "'10'", dateStr: '2000-01-01 12:00', bodyKey: 'Sun' as const },
  { name: '2. Moon — J2000', command: "'301'", dateStr: '2000-01-01 12:00', bodyKey: 'Moon' as const },
  { name: '3. Mercury — Direct Motion (J2000)', command: "'199'", dateStr: '2000-01-01 12:00', bodyKey: 'Mercury' as const },
  { name: '4. Mercury — Near Retrograde Station (March 2026)', command: "'199'", dateStr: '2026-03-20 14:45', bodyKey: 'Mercury' as const },
  { name: '5. Venus — J2000', command: "'299'", dateStr: '2000-01-01 12:00', bodyKey: 'Venus' as const },
  { name: '6. Mars — J2000', command: "'499'", dateStr: '2000-01-01 12:00', bodyKey: 'Mars' as const },
  { name: '7. Jupiter — J2000', command: "'599'", dateStr: '2000-01-01 12:00', bodyKey: 'Jupiter' as const },
  { name: '8. Saturn — J2000', command: "'699'", dateStr: '2000-01-01 12:00', bodyKey: 'Saturn' as const },
  { name: '9. Moon Near Perigee (March 2026)', command: "'301'", dateStr: '2026-03-03 12:00', bodyKey: 'Moon' as const },
  { name: '10. Sun — 19th Century Epoch (Gandhi Natal 1869)', command: "'10'", dateStr: '1869-10-02 02:32', bodyKey: 'Sun' as const }
];

test.describe('NASA/JPL Horizons 10-Case Manual Qualification Suite', () => {

  test('Execute and Compare 10 Real NASA/JPL Horizons Queries', async () => {
    test.setTimeout(60000); // 60s timeout for live JPL network requests

    console.log('\n=== 10-CASE NASA/JPL HORIZONS DIFFERENTIAL QUALIFICATION ===\n');

    for (const tc of testCases) {
      const [dPart, tPart] = tc.dateStr.split(' ');
      const startUtc = `${dPart} ${tPart}`;

      const { json, url } = await queryHorizons({
        COMMAND: tc.command,
        CENTER: "'500@399'", // Earth Geocenter
        MAKE_EPHEM: "'YES'",
        EPHEM_TYPE: "'OBSERVER'",
        START_TIME: `'${startUtc}'`,
        STOP_TIME: `'${dPart} 23:59'`,
        STEP_SIZE: "'1d'",
        QUANTITIES: "'31'", // ObsEcLon ObsEcLat (Apparent Geocentric Ecliptic Longitude)
        REF_SYSTEM: "'ICRF'"
      });

      const rawResult = json.result || '';
      const soe = rawResult.indexOf('$$SOE');
      const eoe = rawResult.indexOf('$$EOE');
      const fragment = (soe !== -1 && eoe !== -1) ? rawResult.substring(soe, eoe + 5) : 'NOT_FOUND';

      let jplLon: number | null = null;
      if (soe !== -1 && eoe !== -1) {
        const lines = rawResult.substring(soe + 5, eoe).trim().split('\n');
        const firstLine = lines[0].trim();
        const tokens = firstLine.split(/\s+/);
        for (let i = 2; i < tokens.length; i++) {
          const val = parseFloat(tokens[i]);
          if (!isNaN(val) && val >= 0 && val <= 360) {
            jplLon = val;
            break;
          }
        }
      }

      const dateObj = new Date(tc.dateStr.replace(' ', 'T') + ':00.000Z');
      const ephem = calculateCelestialEphemeris({
        dateUtc: dateObj,
        latitude: 25.3176,
        longitude: 82.9739,
        nodeMode: 'MEAN_NODE'
      });

      const candBody = ephem.bodies[tc.bodyKey];
      const candLon = candBody.tropicalLongitude;

      let deltaArcsec: number | null = null;
      if (jplLon !== null) {
        let diff = Math.abs(jplLon - candLon);
        if (diff > 180) diff = 360 - diff;
        deltaArcsec = diff * 3600;
      }

      console.log(`================================================================================`);
      console.log(`CASE: ${tc.name}`);
      console.log(`JPL Request URL : ${url}`);
      console.log(`Raw JPL Fragment:\n${fragment}`);
      console.log(`Reference Quantity: JPL ObsEcLon = ${jplLon !== null ? jplLon.toFixed(6) + '°' : 'PARSE_FAILED'}`);
      console.log(`CosmicTantra     : ${candBody.name} Tropical Ecliptic = ${candLon.toFixed(6)}°`);
      console.log(`Angular Delta (Δ): ${deltaArcsec !== null ? deltaArcsec.toFixed(2) + ' arcsec (' + (deltaArcsec/60).toFixed(4) + ' arcmin)' : 'N/A'}`);
      console.log(`Equivalence Verdict: ${deltaArcsec !== null && deltaArcsec < 60 ? 'COORDINATE_EQUIVALENT (< 1 Arcmin Agreement)' : 'DISCREPANCY'}`);
      console.log('--------------------------------------------------------------------------------\n');

      expect(jplLon).not.toBeNull();
      if (deltaArcsec !== null) {
        expect(deltaArcsec).toBeLessThan(60.0); // Within 1 arcminute of NASA JPL Horizons
      }

      // 500ms rate limit delay
      await new Promise(r => setTimeout(r, 500));
    }
  });
});
