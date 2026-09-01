/**
 * Kundli PDF pipeline — orchestrator.
 *
 *   GATE 1  validateBirthInput             (typed failure, no silent defaults)
 *   GATE 1b resolveGeoTimezone             (IANA/historical offset)
 *   GATE 2  buildCanonicalModel + validate (calculation completeness)
 *   GATE 3  buildKundliReportModel + check (report completeness)
 *   RENDER  renderKundliReportPdf          (pagination controller)
 *   GATE 4  validatePdfIntegrity           (page ceiling, blanks, density)
 *   DELIVER READY_FOR_DELIVERY             (artifact + quality report)
 */

import { KundliError, isKundliError } from './errors';
import { KUNDLI_PIPELINE_CONFIG } from './config';
import { validateBirthInput, validateCalculationModel, validateResolvedTimezone } from './validation';
import { resolveGeoTimezone } from './geoTz';
import { computeFingerprint, deriveReportId } from './lineage';
import { buildCanonicalModel } from './canonicalModel';
import { buildKundliReportModel, assertReportCompleteness } from './reportModel';
import { renderKundliReportPdf } from './renderer';
import {
  checkCanonicalConsistency,
  checkReportConsistency,
  checkBilingualEquivalence,
  checkChartAndSummaryConsistency,
  summariseForLog,
  KUNDLI_CONSISTENCY_FAILED,
  KUNDLI_CHART_INVALID,
  KUNDLI_SUMMARY_INVALID,
  CONSISTENCY_GATE_VERSION,
} from './consistencyGate';
import { validatePdfIntegrity } from './pdfValidator';
import { emitMetric, emitPipelineError } from './observability';
import type {
  KundliPipelineResult, GenerateKundliPdfOptions, PipelineState, RawBirthInput,
} from './types';

const MANDATORY_SECTION_TITLES = [
  'Birth Summary',
  'Calculation Standard',
  'Panchanga',
  'Planetary Positions',
  'Vimshottari Dasha',
  'Current Dasha Period',
  'Disclaimer',
];

function failed(state: PipelineState, e: unknown, reportId?: string): KundliPipelineResult {
  const err = isKundliError(e) ? e : new KundliError('KUNDLI_PDF_RENDER_FAILED', String(e));
  emitPipelineError({ reportId, code: err.code, state, details: err.details });
  return {
    state,
    ok: false,
    errorCode: err.code,
    errorDetails: err.details,
    canonicalModel: null,
    report: null,
    pdfBuffer: null,
    pdfQuality: null,
    metrics: null,
  };
}

/**
 * Runs the full pipeline. Returns the typed result; PDF bytes are present
 * only when state === READY_FOR_DELIVERY.
 */
type CalculateSnapshot = typeof import('../jyotish/canonicalSnapshot').getCanonicalJyotishSnapshot;

// Explicit dependency seam for fault-injection tests. HTTP callers continue to
// use generateKundliPdf; raw input/options cannot replace the calculation engine.
export function createKundliPdfGenerator(calculateSnapshot: CalculateSnapshot) {
  return (rawInput: RawBirthInput, options: GenerateKundliPdfOptions = {}) =>
    runKundliPdf(rawInput, options, calculateSnapshot);
}

export function generateKundliPdf(rawInput: RawBirthInput, options: GenerateKundliPdfOptions = {}) {
  return runKundliPdf(rawInput, options);
}

async function runKundliPdf(
  rawInput: RawBirthInput,
  options: GenerateKundliPdfOptions = {},
  calculateSnapshot?: CalculateSnapshot,
): Promise<KundliPipelineResult> {
  const locale = options.locale ?? 'en';
  const renderPdf = options.renderPdf !== false;
  const onMetric = options.onMetric;

  emitMetric('pipeline.started', { locale, renderPdf, v: 1 });

  /* GATE 1 — input integrity ------------------------------------------ */
  let validated;
  try {
    const fallback: import('./validation').FallbackApproval | undefined = options.allowFallback === true
      ? {
          by: 'system-test-approval',
          reason: 'FALLBACK coordinates approved by caller (boolean)',
          latitude: KUNDLI_PIPELINE_CONFIG.geo.fallbackCoordinates.latitude,
          longitude: KUNDLI_PIPELINE_CONFIG.geo.fallbackCoordinates.longitude,
        }
      : options.allowFallback === false || options.allowFallback === undefined
        ? undefined
        : options.allowFallback;
    validated = validateBirthInput(rawInput, { allowFallback: fallback });
  } catch (e) {
    emitMetric('pipeline.gate1.failed', { code: e instanceof KundliError ? e.code : 'unknown' });
    return failed('INPUT_FAILED', e);
  }
  emitMetric('pipeline.gate1.passed', {});

  /* GATE 1b — geo & timezone ------------------------------------------ */
  let profile;
  try {
    const resolved = resolveGeoTimezone(validated, rawInput);
    validateResolvedTimezone(resolved.profile.timezone);
    profile = resolved.profile;
  } catch (e) {
    emitMetric('pipeline.gate1b.failed', { code: e instanceof KundliError ? e.code : 'unknown' });
    return failed('INPUT_FAILED', e);
  }

  /* Fingerprint (idempotency + lineage) ------------------------------- */
  const fingerprint = computeFingerprint(rawInput, KUNDLI_PIPELINE_CONFIG.calculation, {
    localDateTime: profile.timezone.localDateTime,
    utcDateTime: profile.timezone.utcDateTime,
    timezoneId: profile.timezone.timezoneId,
    latitude: profile.coordinates.latitude,
    longitude: profile.coordinates.longitude,
    provenance: profile.coordinates.provenance,
  });
  profile.fingerprint = fingerprint;
  const reportId = deriveReportId(fingerprint);
  emitMetric('pipeline.input', { reportId, provenance: profile.coordinates.provenance, offsetProvenance: profile.timezone.offsetProvenance });

  /* GATE 2 — calculation + canonical model ---------------------------- */
  let canonical;
  try {
    const { getCanonicalJyotishSnapshot } = await import('../jyotish/canonicalSnapshot');
    const snapshot = (calculateSnapshot ?? getCanonicalJyotishSnapshot)({
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      latitude: profile.coordinates.latitude,
      longitude: profile.coordinates.longitude,
      timezone: profile.timezone.utcOffsetAtBirth,
      locationName: profile.locationName,
    });
    canonical = buildCanonicalModel({ profile, snapshot, config: KUNDLI_PIPELINE_CONFIG.calculation });
    validateCalculationModel(canonical);

    /* GATE 2b — runtime consistency ------------------------------------ */
    // A contradiction anywhere in the canonical model blocks delivery: the
    // same gate that protects the reader also protects the certificate.
    const consistency = checkCanonicalConsistency({
      canonical,
      snapshot,
      nodeToleranceDeg: KUNDLI_PIPELINE_CONFIG.tolerances.nodeOppositionToleranceDeg,
    });
    emitMetric('pipeline.gate2b.consistency', { reportId, gate: CONSISTENCY_GATE_VERSION, ...summariseForLog(consistency) });
    if (!consistency.ok) {
      const critical = consistency.findings.filter((f) => f.severity === 'CRITICAL');
      emitMetric('pipeline.gate2b.failed', { reportId, codes: critical.map((f) => f.code) });
      return failed(
        'CONSISTENCY_FAILED',
        new KundliError(KUNDLI_CONSISTENCY_FAILED, `${critical.length} canonical contradiction(s): ${critical.map((f) => f.code).join(', ')}`, {
          // Paths and value summaries only — never personal data.
          contradictions: critical.slice(0, 20).map((f) => ({
            code: f.code,
            pathA: f.pathA,
            valueA: f.valueA,
            pathB: f.pathB,
            valueB: f.valueB,
          })),
        }),
        reportId,
      );
    }
  } catch (e) {
    emitMetric('pipeline.gate2.failed', { reportId, code: e instanceof KundliError ? e.code : 'unknown' });
    return failed('CALCULATION_FAILED', e, reportId);
  }
  emitMetric('pipeline.gate2.passed', { reportId });

  /* GATE 3 — report model ---------------------------------------------- */
  let report;
  try {
    report = buildKundliReportModel(canonical, locale);
    assertReportCompleteness(report);

    /* GATE 3b — report-level consistency, before anything is rendered --- */
    const reportConsistency = checkReportConsistency(canonical, report, {
      bilingual: KUNDLI_PIPELINE_CONFIG.report.bilingualLabels,
    });
    // Hindi delivery: the same chart in English must carry identical values.
    if (locale === 'hi') {
      const enReport = buildKundliReportModel(canonical, 'en');
      const bilingual = checkBilingualEquivalence(enReport, report);
      emitMetric('pipeline.gate3b.bilingual', { reportId, ...summariseForLog(bilingual) });
      const bilingualCritical = bilingual.findings.filter((f) => f.severity === 'CRITICAL');
      if (bilingualCritical.length > 0) {
        emitMetric('pipeline.gate3b.failed', { reportId, codes: bilingualCritical.map((f) => f.code) });
        return failed(
          'CONSISTENCY_FAILED',
          new KundliError(KUNDLI_CONSISTENCY_FAILED, 'Hindi and English renderings disagree', {
            contradictions: bilingualCritical.slice(0, 20).map((f) => ({
              code: f.code, pathA: f.pathA, valueA: f.valueA, pathB: f.pathB, valueB: f.valueB,
            })),
          }),
          reportId,
        );
      }
    }
    /* GATE 3c — charts and the Scholar Summary, before rendering -------- */
    // A drawing that disagrees with the canonical model is indistinguishable
    // from a correct one once it is on the page, so these are all critical.
    const chartConsistency = checkChartAndSummaryConsistency({
      canonical,
      report,
      enReport: locale === 'hi' ? buildKundliReportModel(canonical, 'en') : undefined,
      locale,
    });
    emitMetric('pipeline.gate3c.consistency', { reportId, gate: CONSISTENCY_GATE_VERSION, ...summariseForLog(chartConsistency) });
    const chartCritical = chartConsistency.findings.filter((f) => f.severity === 'CRITICAL');
    if (chartCritical.length > 0) {
      emitMetric('pipeline.gate3c.failed', { reportId, codes: chartCritical.map((f) => f.code) });
      const chartCode = chartCritical.some((f) => f.code.startsWith('CG_CHART'))
        ? KUNDLI_CHART_INVALID
        : chartCritical.some((f) => f.code.startsWith('CG_SUMMARY'))
          ? KUNDLI_SUMMARY_INVALID
          : KUNDLI_CONSISTENCY_FAILED;
      return failed(
        'CONSISTENCY_FAILED',
        new KundliError(chartCode, 'the charts or the Scholar Summary disagree with the calculated chart', {
          contradictions: chartCritical.slice(0, 20).map((f) => ({
            code: f.code, pathA: f.pathA, valueA: f.valueA, pathB: f.pathB, valueB: f.valueB,
          })),
        }),
        reportId,
      );
    }

    emitMetric('pipeline.gate3b.consistency', { reportId, gate: CONSISTENCY_GATE_VERSION, ...summariseForLog(reportConsistency) });
    if (!reportConsistency.ok) {
      const critical = reportConsistency.findings.filter((f) => f.severity === 'CRITICAL');
      emitMetric('pipeline.gate3b.failed', { reportId, codes: critical.map((f) => f.code) });
      return failed(
        'CONSISTENCY_FAILED',
        new KundliError(KUNDLI_CONSISTENCY_FAILED, `${critical.length} report contradiction(s): ${critical.map((f) => f.code).join(', ')}`, {
          contradictions: critical.slice(0, 20).map((f) => ({
            code: f.code,
            pathA: f.pathA,
            valueA: f.valueA,
            pathB: f.pathB,
            valueB: f.valueB,
          })),
        }),
        reportId,
      );
    }
  } catch (e) {
    emitMetric('pipeline.gate3.failed', { reportId, code: e instanceof KundliError ? e.code : 'unknown' });
    return failed('REPORT_FAILED', e, reportId);
  }
  emitMetric('pipeline.gate3.passed', { reportId, sections: report.sections.length });

  if (!renderPdf) {
    emitMetric('pipeline.dryrun.done', { reportId });
    return {
      state: 'REPORT_READY',
      ok: true,
      errorCode: null,
      errorDetails: null,
      canonicalModel: canonical,
      report,
      pdfBuffer: null,
      pdfQuality: null,
      metrics: null,
    };
  }

  /* RENDER — pagination-controlled ------------------------------------- */
  let rendered;
  try {
    rendered = await renderKundliReportPdf(report, {
      locale,
      maxPages: options.maxPages ?? KUNDLI_PIPELINE_CONFIG.limits.maxPages,
      // Static assets (Devanagari font, Ganesh emblem) are auto-loaded from
      // disk in Node contexts by the renderer; browsers fetch public URLs.
    });
  } catch (e) {
    emitMetric('pipeline.render.failed', { reportId, code: e instanceof KundliError ? e.code : 'unknown' });
    return failed('PDF_RENDER_FAILED', e, reportId);
  }
  emitMetric('pipeline.render.passed', { reportId, pages: rendered.metrics.pageCount });

  /* GATE 4 — artifact validation --------------------------------------- */
  let quality;
  try {
    quality = await validatePdfIntegrity({
      buffer: rendered.buffer,
      renderMetrics: rendered.metrics,
      mandatorySectionTitles: MANDATORY_SECTION_TITLES,
      maxPages: options.maxPages ?? KUNDLI_PIPELINE_CONFIG.limits.maxPages,
      extractor: options.extractPdf,
    });
  } catch (e) {
    emitMetric('pipeline.validate.failed', { reportId, code: e instanceof KundliError ? e.code : 'unknown' });
    return failed('PDF_VALIDATION_FAILED', e, reportId);
  }
  emitMetric('pipeline.validate.passed', {
    reportId,
    pages: quality.pageCount,
    blankPages: quality.blankPageCount,
    density: quality.contentDensity,
  });

  emitMetric('pipeline.delivered', { reportId, pages: quality.pageCount });

  return {
    state: 'READY_FOR_DELIVERY',
    ok: true,
    errorCode: null,
    errorDetails: null,
    canonicalModel: canonical,
    report,
    pdfBuffer: rendered.buffer,
    pdfQuality: quality,
    metrics: rendered.metrics,
  };
}
