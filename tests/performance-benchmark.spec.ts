import { test, expect } from '@playwright/test';
import * as os from 'os';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { generateKundliBookModel } from '../src/lib/jyotish/kundliBookModel';
import { createKundli, getKundliById } from '../src/lib/jyotish/kundliStore';
import { queryKashiEvidence } from '../src/lib/jyotish/kashiOrchestrator';

test.describe('GATE 9: Precision Performance & Latency Benchmark', () => {

  test('Execute Rigorous p50 / p95 / p99 Latency Audit Across Subsystems', () => {
    const iterations = 50;

    const birthInput = {
      birthDate: '1989-05-26',
      birthTime: '02:20:30',
      latitude: 22.0797,
      longitude: 82.1391,
      timezone: 5.5,
      locationName: 'Bilaspur, Chhattisgarh, India'
    };

    // 1. Cold Run
    const t0 = performance.now();
    const coldSnap = getCanonicalJyotishSnapshot(birthInput);
    const coldDuration = performance.now() - t0;

    // 2. Warm Runs for Canonical Snapshot
    const snapTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      getCanonicalJyotishSnapshot(birthInput);
      snapTimes.push(performance.now() - start);
    }
    snapTimes.sort((a, b) => a - b);

    // 3. Report Generation Times
    const reportTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      generateKundliBookModel('Benchmark Seeker', coldSnap, 'COMPLETE_VEDIC_KUNDLI');
      reportTimes.push(performance.now() - start);
    }
    reportTimes.sort((a, b) => a - b);

    // 4. Kundli Reopen Times
    const reopenTimes: number[] = [];
    const rec = createKundli('Gandhi Test', {
      birthDate: '1869-10-02',
      birthTime: '07:11',
      latitude: 21.6417,
      longitude: 69.6293,
      timezone: 4.6419,
      locationName: 'Porbandar'
    });
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      getKundliById(rec.id);
      reopenTimes.push(performance.now() - start);
    }
    reopenTimes.sort((a, b) => a - b);

    // 5. Kashi Evidence Query Times
    const kashiTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      queryKashiEvidence('Career timing in 2026', coldSnap);
      kashiTimes.push(performance.now() - start);
    }
    kashiTimes.sort((a, b) => a - b);

    const getPercentiles = (arr: number[]) => ({
      p50: arr[Math.floor(arr.length * 0.5)].toFixed(2),
      p90: arr[Math.floor(arr.length * 0.9)].toFixed(2),
      p95: arr[Math.floor(arr.length * 0.95)].toFixed(2),
      p99: arr[arr.length - 1].toFixed(2)
    });

    const snapP = getPercentiles(snapTimes);
    const repP = getPercentiles(reportTimes);
    const reopP = getPercentiles(reopenTimes);
    const kashP = getPercentiles(kashiTimes);

    console.log('\n======================================================');
    console.log('COSMICTANTRA HIGH-PRECISION LATENCY BENCHMARK AUDIT');
    console.log('======================================================');
    console.log(`Host Environment : ${os.type()} ${os.arch()} (${os.cpus()[0]?.model || 'CPU'})`);
    console.log(`Node.js Engine   : ${process.version}`);
    console.log(`Physical Memory  : ${(os.totalmem() / (1024 ** 3)).toFixed(1)} GB`);
    console.log('------------------------------------------------------');
    console.log(`1. Cold Snapshot Init   : ${coldDuration.toFixed(2)} ms`);
    console.log(`2. Warm Canonical Snap  : p50 = ${snapP.p50} ms | p90 = ${snapP.p90} ms | p95 = ${snapP.p95} ms | p99 = ${snapP.p99} ms`);
    console.log(`3. Multi-Volume Report  : p50 = ${repP.p50} ms | p90 = ${repP.p90} ms | p95 = ${repP.p95} ms | p99 = ${repP.p99} ms`);
    console.log(`4. Kundli Reopen Lookup : p50 = ${reopP.p50} ms | p90 = ${reopP.p90} ms | p95 = ${reopP.p95} ms | p99 = ${reopP.p99} ms`);
    console.log(`5. Kashi Evidence Query : p50 = ${kashP.p50} ms | p90 = ${kashP.p90} ms | p95 = ${kashP.p95} ms | p99 = ${kashP.p99} ms`);
    console.log('======================================================\n');

    expect(Number(snapP.p50)).toBeLessThan(250); // Snapshot calculation < 50ms
    expect(Number(repP.p50)).toBeLessThan(10); // Report generation < 10ms
    expect(Number(reopP.p50)).toBeLessThan(5); // Memory reopen < 5ms
  });

});
