/**
 * FORENSIC TRACE — incident reproduction (secure debug fixture).
 * Input: 1995-06-15 10:30, lat 25.5941 (Patna) — the production-style incident input.
 *
 * Captures sanitized structured snapshots at each lineage stage (no PII beyond the
 * birth fixture itself, which is a synthetic benchmark profile):
 *   01_raw_user_input.json
 *   02_normalized_birth_input.json
 *   03_geo_timezone_result.json
 *   04_calculation_result.json
 *   05_canonical_kundli.json
 *   06_interpretation_result.json
 *   07_report_model.json
 *   08_pdf_render_metrics.json
 *
 * Also measures the leaf-node count of the recursive dump used by the legacy
 * PDF renderer and checks for circular references.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { generateKundliBookModel } from '../../src/lib/jyotish/kundliBookModel';

const OUT = path.join(process.cwd(), 'scratch', 'forensics');

// --- Helpers ---------------------------------------------------------------

function write(name: string, data: unknown) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, safeReplacer(), 2));
}

/** Replacer that keeps Dates readable and detects cycles (marked, not thrown). */
function safeReplacer() {
  const seen = new WeakSet<object>();
  return (key: string, value: unknown) => {
    if (value instanceof Date) return `[Date:${value.toISOString()}]`;
    if (value instanceof Error) return `[Error:${value.message}]`;
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[CIRCULAR]';
      seen.add(value);
    }
    return value;
  };
}

interface LeafStats {
  leaves: number;
  maxDepth: number;
  circular: string[];
  stringLeaves: number;
}

/**
 * Mirrors the legacy PDF renderer's recursive `dump` traversal
 * (Object.entries + recursion) and counts primitive leaves.
 */
function countDumpLeaves(root: unknown): LeafStats {
  const circular: string[] = [];
  const seen = new WeakSet<object>();
  let leaves = 0;
  let stringLeaves = 0;
  let maxDepth = 0;

  const walk = (obj: unknown, prefix: string, depth: number) => {
    if (depth > maxDepth) maxDepth = depth;
    if (obj === null || obj === undefined) return;
    if (typeof obj !== 'object') {
      leaves += 1;
      if (typeof obj === 'string') stringLeaves += 1;
      return;
    }
    if (seen.has(obj as object)) {
      circular.push(prefix);
      return;
    }
    seen.add(obj as object);
    if (obj instanceof Date) {
      leaves += 1;
      return;
    }
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      walk(v, prefix ? `${prefix}.${k}` : k, depth + 1);
    }
  };
  walk(root, '', 0);
  return { leaves, maxDepth, circular, stringLeaves };
}

// --- The incident fixture --------------------------------------------------

const INCIDENT_RAW_INPUT = {
  // What the production caller actually supplied (per incident):
  dob: '1995-06-15',
  tob: '10:30',
  lat: '25.5941'
  // NOTE: no name, no city, no lng/lon, no tz
};

const INCIDENT_NORMALIZED = {
  name: 'Seeker',          // silent default (legacy client)
  birthDate: '1995-06-15',
  birthTime: '10:30',
  latitude: 25.5941,
  longitude: 82.1391,      // silent default (legacy client Bilaspur fallback!)
  timezone: 5.5,           // silent default
  locationName: 'Bilaspur, India' // silent default
};

test.describe('INCIDENT FORENSIC TRACE (1995-06-15 / lat 25.5941)', () => {
  test('captures 01..07 lineage snapshots', () => {
    write('01_raw_user_input.json', INCIDENT_RAW_INPUT);
    write('02_normalized_birth_input.json', INCIDENT_NORMALIZED);

    // 03 — geo/timezone resolution: legacy system has NO geo/timezone resolver.
    write('03_geo_timezone_result.json', {
      status: 'LEGACY_NO_RESOLVER',
      coordinateProvenance: 'FALLBACK',
      timezoneSource: 'DEFAULT_OFFSET_5.5',
      timezoneId: null,
      utcOffsetAtBirth: 5.5,
      historicalOffsetResolved: false,
      utcDateTime: '1995-06-15T05:00:00.000Z'
    });

    const snapshot = getCanonicalJyotishSnapshot({
      birthDate: INCIDENT_NORMALIZED.birthDate,
      birthTime: INCIDENT_NORMALIZED.birthTime,
      latitude: INCIDENT_NORMALIZED.latitude,
      longitude: INCIDENT_NORMALIZED.longitude,
      timezone: INCIDENT_NORMALIZED.timezone,
      locationName: INCIDENT_NORMALIZED.locationName
    });

    write('04_calculation_result.json', {
      lagna: snapshot.lagna,
      planetsArray: snapshot.planetsArray.map((p: any) => ({
        name: p.name, rashiName: p.rashiName, degreeStr: p.degreeStr,
        house: p.house, nakshatra: p.nakshatra?.name, pada: p.pada, isRetrograde: p.isRetrograde
      })),
      julianDay: snapshot.meta.julianDay,
      ayanamshaValue: snapshot.meta.ayanamshaValue
    });
    write('05_canonical_kundli.json', snapshot as unknown as Record<string, unknown>);
    write('06_interpretation_result.json', {
      engine: 'getDaily3DayInterpretation (deterministic rule-based)',
      invokedForReportPdf: false, // legacy report does NOT call the interpretation engine
      reportInterpretationSource: 'STATIC_HARDCODED_TEXT_IN_BOOK_MODEL'
    });
    write('07_report_model.json', generateKundliBookModel('Seeker', snapshot, 'COMPLETE_VEDIC_KUNDLI'));

    // Assertions documenting the current behavior (the incident):
    expect(snapshot.planetsArray.length).toBe(9);       // engine itself works
    expect(snapshot.lagna.rashiName.length).toBeGreaterThan(0);
    expect(snapshot.dasha.currentMahadasha.length).toBeGreaterThan(0);
  });

  test('measures legacy PDF dump leaf count (runaway page evidence)', () => {
    const snapshot = getCanonicalJyotishSnapshot({
      birthDate: INCIDENT_NORMALIZED.birthDate,
      birthTime: INCIDENT_NORMALIZED.birthTime,
      latitude: INCIDENT_NORMALIZED.latitude,
      longitude: INCIDENT_NORMALIZED.longitude,
      timezone: INCIDENT_NORMALIZED.timezone,
      locationName: INCIDENT_NORMALIZED.locationName
    });

    const stats = countDumpLeaves(snapshot);
    console.log('[forensics] dump leaf stats:', JSON.stringify(stats));

    // With ~4.3mm per line + 3mm spacing on a 278mm printable A4 column,
    // ~36 dump lines fit per page. Leaves in the hundreds-to-thousands
    // yield hundreds of appendix pages — matching the incident's 450+ pages.
    write('08_pdf_render_metrics.json', {
      renderer: 'legacy MasterKundliReportClient.handleDownloadPDF',
      dumpLeafCount: stats.leaves,
      stringLeafCount: stats.stringLeaves,
      maxDepth: stats.maxDepth,
      circularRefs: stats.circular,
      estimatedPagesAt36LinesPerPage: Math.ceil(stats.leaves / 36),
      blankPageThresholdViolationRisk: stats.leaves > 100,
      paginationGuard: 'NONE',
      pageCeiling: 'NONE',
      postRenderValidation: 'NONE'
    });
  });
});
