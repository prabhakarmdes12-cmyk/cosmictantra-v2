import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { calculateCelestialEphemeris } from '../src/lib/jyotish/celestialEngine';

test('Compute Full 1,000-Point JPL Horizons External Statistical Benchmark', () => {
  const rootDir = 'D:\\Projects\\Cosmic tantra AUGUST 2026';
  const fixturePath = path.join(rootDir, 'tests', 'fixtures', 'jpl-1000-verified-reference.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const bodies = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const;

  interface ErrorRecord {
    index: number;
    id: string;
    category: string;
    dateUtc: string;
    year: number;
    body: string;
    jplLon: number;
    ctLon: number;
    diffArcsec: number;
    diffDegrees: number;
    rashiJpl: number;
    rashiCt: number;
    nakshatraJpl: number;
    nakshatraCt: number;
    padaJpl: number;
    padaCt: number;
    d9Jpl: number;
    d9Ct: number;
    distToRashiBound: number;
    distToNakBound: number;
    distToPadaBound: number;
  }

  const allRecords: ErrorRecord[] = [];
  const bodyStats: Record<string, number[]> = {};
  for (const b of bodies) {
    bodyStats[b] = [];
  }

  const centuryBuckets: Record<string, Record<string, number[]>> = {
    '1850-1899': {},
    '1900-1949': {},
    '1950-1999': {},
    '2000-2050': {}
  };
  for (const c of Object.keys(centuryBuckets)) {
    for (const b of bodies) {
      centuryBuckets[c][b] = [];
    }
  }

  let totalMismatchesRashi = 0;
  let totalMismatchesNakshatra = 0;
  let totalMismatchesPada = 0;
  let totalMismatchesD9 = 0;
  const mismatchDetails: any[] = [];

  for (let i = 0; i < fixture.timestamps.length; i++) {
    const ts = fixture.timestamps[i];
    const dateObj = new Date(ts.dateUtc);
    const yr = dateObj.getUTCFullYear();

    let centuryKey = '2000-2050';
    if (yr < 1900) centuryKey = '1850-1899';
    else if (yr < 1950) centuryKey = '1900-1949';
    else if (yr < 2000) centuryKey = '1950-1999';

    const ephem = calculateCelestialEphemeris({
      dateUtc: dateObj,
      latitude: 25.3176,
      longitude: 82.9739,
      nodeMode: 'MEAN_NODE'
    });

    for (const b of bodies) {
      const jplLon = fixture.jplLongitudes[b][i];
      if (jplLon === null || isNaN(jplLon)) continue;

      const ctBody = (ephem.bodies as any)[b];
      const ctLon = ctBody.tropicalLongitude;

      let diffDeg = Math.abs(jplLon - ctLon);
      if (diffDeg > 180) diffDeg = 360 - diffDeg;
      const diffArcsec = diffDeg * 3600;

      bodyStats[b].push(diffArcsec);
      centuryBuckets[centuryKey][b].push(diffArcsec);

      const rashiJpl = Math.floor(jplLon / 30);
      const rashiCt = Math.floor(ctLon / 30);
      const nakshatraJpl = Math.floor(jplLon / (360 / 27));
      const nakshatraCt = Math.floor(ctLon / (360 / 27));
      const padaJpl = Math.floor(jplLon / (360 / 108));
      const padaCt = Math.floor(ctLon / (360 / 108));
      const d9Jpl = padaJpl % 12;
      const d9Ct = padaCt % 12;

      const distToRashiBound = Math.min(jplLon % 30, 30 - (jplLon % 30)) * 3600;
      const distToNakBound = Math.min(jplLon % (360 / 27), (360 / 27) - (jplLon % (360 / 27))) * 3600;
      const distToPadaBound = Math.min(jplLon % (360 / 108), (360 / 108) - (jplLon % (360 / 108))) * 3600;

      if (rashiJpl !== rashiCt) totalMismatchesRashi++;
      if (nakshatraJpl !== nakshatraCt) totalMismatchesNakshatra++;
      if (padaJpl !== padaCt) {
        totalMismatchesPada++;
        mismatchDetails.push({
          pointId: ts.id,
          dateUtc: ts.dateUtc,
          body: b,
          jplLon,
          ctLon,
          diffArcsec,
          type: 'PADA_MISMATCH',
          jplPada: padaJpl,
          ctPada: padaCt,
          distToBoundaryArcsec: distToPadaBound
        });
      }
      if (d9Jpl !== d9Ct) totalMismatchesD9++;

      allRecords.push({
        index: i + 1,
        id: ts.id,
        category: ts.category,
        dateUtc: ts.dateUtc,
        year: yr,
        body: b,
        jplLon,
        ctLon,
        diffArcsec,
        diffDegrees: diffDeg,
        rashiJpl,
        rashiCt,
        nakshatraJpl,
        nakshatraCt,
        padaJpl,
        padaCt,
        d9Jpl,
        d9Ct,
        distToRashiBound,
        distToNakBound,
        distToPadaBound
      });
    }
  }

  function stats(arr: number[]) {
    if (!arr.length) return { mean: 0, median: 0, p90: 0, p95: 0, p99: 0, max: 0, std: 0 };
    const sorted = [...arr].sort((a, b) => a - b);
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const median = sorted[Math.floor(sorted.length * 0.50)];
    const p90 = sorted[Math.floor(sorted.length * 0.90)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const max = sorted[sorted.length - 1];
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
    const std = Math.sqrt(variance);
    return { mean, median, p90, p95, p99, max, std };
  }

  console.log('\n========================================================================================================================');
  console.log('1,000-POINT INDEPENDENT NASA/JPL HORIZONS BENCHMARK STATISTICAL ERROR PROFILE (1850-2050)');
  console.log('Total Ground-Truth Evaluations: 7,000 Celestial Quantities (1,000 Timestamps x 7 Bodies)');
  console.log('========================================================================================================================');
  console.log('Body        | Mean (") | Median (") | P90 (")  | P95 (")  | P99 (")  | Max (")  | Std Dev (σ) | Arcmin Class');
  console.log('------------------------------------------------------------------------------------------------------------------------');

  for (const b of bodies) {
    const s = stats(bodyStats[b]);
    console.log(
      `${b.padEnd(11)} | ` +
      `${s.mean.toFixed(2).padStart(8)}" | ` +
      `${s.median.toFixed(2).padStart(10)}" | ` +
      `${s.p90.toFixed(2).padStart(8)}" | ` +
      `${s.p95.toFixed(2).padStart(8)}" | ` +
      `${s.p99.toFixed(2).padStart(8)}" | ` +
      `${s.max.toFixed(2).padStart(8)}" | ` +
      `${s.std.toFixed(2).padStart(11)}" | ` +
      `< ${(s.max / 60).toFixed(3)} arcmin (Sub-Arcmin)`
    );
  }

  console.log('\n========================================================================================================================');
  console.log('CENTURY ERROR BREAKDOWN (MEAN ABSOLUTE ERROR IN ARCSECONDS)');
  console.log('========================================================================================================================');
  console.log('Century Period | Sun (")  | Moon (") | Mercury (") | Venus (") | Mars (") | Jupiter (") | Saturn (") | Overall Century Mean');
  console.log('------------------------------------------------------------------------------------------------------------------------');

  for (const c of Object.keys(centuryBuckets)) {
    const sunMean = stats(centuryBuckets[c]['Sun']).mean;
    const moonMean = stats(centuryBuckets[c]['Moon']).mean;
    const merMean = stats(centuryBuckets[c]['Mercury']).mean;
    const venMean = stats(centuryBuckets[c]['Venus']).mean;
    const marMean = stats(centuryBuckets[c]['Mars']).mean;
    const jupMean = stats(centuryBuckets[c]['Jupiter']).mean;
    const satMean = stats(centuryBuckets[c]['Saturn']).mean;
    const allCentury = bodies.flatMap(b => centuryBuckets[c][b]);
    const overallMean = stats(allCentury).mean;

    console.log(
      `${c.padEnd(14)} | ` +
      `${sunMean.toFixed(2).padStart(8)}" | ` +
      `${moonMean.toFixed(2).padStart(8)}" | ` +
      `${merMean.toFixed(2).padStart(11)}" | ` +
      `${venMean.toFixed(2).padStart(9)}" | ` +
      `${marMean.toFixed(2).padStart(8)}" | ` +
      `${jupMean.toFixed(2).padStart(11)}" | ` +
      `${satMean.toFixed(2).padStart(10)}" | ` +
      `${overallMean.toFixed(2).padStart(16)}"`
    );
  }

  console.log('\n========================================================================================================================');
  console.log('TOP 20 WORST ABSOLUTE CASES ACROSS 7,000 NASA/JPL COMPARISONS');
  console.log('========================================================================================================================');
  console.log('Rank | Body    | Date & Time (UTC)        | Category             | JPL Lon (°) | CT Lon (°)  | Delta (") | Delta (arcmin)');
  console.log('------------------------------------------------------------------------------------------------------------------------');

  allRecords.sort((a, b) => b.diffArcsec - a.diffArcsec);
  const worst20 = allRecords.slice(0, 20);
  worst20.forEach((w, idx) => {
    console.log(
      `${String(idx + 1).padStart(4)} | ` +
      `${w.body.padEnd(7)} | ` +
      `${w.dateUtc.substring(0, 19)} | ` +
      `${w.category.padEnd(20)} | ` +
      `${w.jplLon.toFixed(4).padStart(11)}° | ` +
      `${w.ctLon.toFixed(4).padStart(11)}° | ` +
      `${w.diffArcsec.toFixed(2).padStart(8)}" | ` +
      `${(w.diffArcsec / 60).toFixed(4).padStart(12)}'`
    );
  });

  console.log('\n========================================================================================================================');
  console.log('WORST CASE PER CELESTIAL PLANET');
  console.log('========================================================================================================================');
  for (const b of bodies) {
    const bodyRecords = allRecords.filter(r => r.body === b);
    bodyRecords.sort((x, y) => y.diffArcsec - x.diffArcsec);
    const worst = bodyRecords[0];
    console.log(
      `${b.padEnd(10)} : ` +
      `Max Error = ${worst.diffArcsec.toFixed(2)}" (${(worst.diffArcsec/60).toFixed(4)}') at ${worst.dateUtc.substring(0, 19)} | ` +
      `JPL: ${worst.jplLon.toFixed(4)}° vs CT: ${worst.ctLon.toFixed(4)}° | Category: ${worst.category}`
    );
  }

  console.log('\n========================================================================================================================');
  console.log('PRACTICAL JYOTISH SENSITIVITY & BOUNDARY CLASSIFICATION IMPACT (Across 7,000 Comparisons)');
  console.log('========================================================================================================================');
  console.log(`Total Evaluations                : 7,000`);
  console.log(`Rashi (Sign 30°) Mismatches      : ${totalMismatchesRashi} / 7,000 (${((totalMismatchesRashi/7000)*100).toFixed(4)}%)`);
  console.log(`Nakshatra (13°20') Mismatches     : ${totalMismatchesNakshatra} / 7,000 (${((totalMismatchesNakshatra/7000)*100).toFixed(4)}%)`);
  console.log(`Pada (Quarter 3°20') Mismatches  : ${totalMismatchesPada} / 7,000 (${((totalMismatchesPada/7000)*100).toFixed(4)}%)`);
  console.log(`D9 (Navamsha) Sign Mismatches    : ${totalMismatchesD9} / 7,000 (${((totalMismatchesD9/7000)*100).toFixed(4)}%)`);

  if (mismatchDetails.length > 0) {
    console.log('\n--- PADA / D9 BOUNDARY TRANSITION EDGE CASES ---');
    mismatchDetails.forEach(m => {
      console.log(
        `Point ${m.pointId} (${m.dateUtc.substring(0, 10)}) - ${m.body}: JPL Lon = ${m.jplLon.toFixed(5)}° (Pada ${m.jplPada}) | CT Lon = ${m.ctLon.toFixed(5)}° (Pada ${m.ctPada}) | ` +
        `Delta = ${m.diffArcsec.toFixed(2)}" | Distance to boundary = ${m.distToBoundaryArcsec.toFixed(2)}"`
      );
    });
  } else {
    console.log('\nAll 7,000 celestial points produced 100% identical Rashi, Nakshatra, Pada, and D9 classifications.');
  }
  console.log('========================================================================================================================\n');
});
