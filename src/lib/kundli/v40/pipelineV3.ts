/**
 * KUNDLI V40.1 — pipeline v3.
 *
 * Identical to pipeline v2 up to and including the report model. V40.1 adds no
 * astrology and changes no calculation; it changes only how the report is
 * prepared for a consultation and how it is drawn.
 *
 *   GATE 1..3c   unchanged, reused verbatim from pipelineV2
 *   GATE 3d      applyConsultationDensity   Part A audit (§9), declared rules
 *   GATE 3e      auditPartADensity          no engineering residue in Part A
 *   RENDER       renderKundliPdfV3          pdfkit + fontkit, real shaping
 *   GATE 4       validatePdfIntegrity       page ceiling, blank pages, density
 *   GATE 4b      semantic scan              banned prediction language
 *
 * Pipeline v2 is untouched and keeps producing the V40 reference artifact.
 */

import { KundliError, isKundliError } from '../errors';
import { validatePdfIntegrity } from '../pdfValidator';
import { scanBannedLanguage, type LanguageFinding } from '../scholarSummary';
import type { PdfQualityReport, PdfRenderMetrics, RawBirthInput } from '../types';
import type { KundliCanonicalModel } from '../types';
import type { KundliDerivedModel } from './derivedModel';
import type { KundliReportModelV2 } from './reportBlocks';
import { generateKundliV40Pdf, collectReportText } from './pipelineV2';
import {
  applyConsultationDensity, auditPartADensity,
  type DensityApplication, type PartAFinding,
} from './consultationDensity';
import { renderKundliPdfV3, type RenderV3Options, RENDERER_V3_VERSION } from './rendererV3';
import {
  applyReportMode, DEFAULT_REPORT_MODE, MODE_DEFINITIONS,
  type ReportMode, type ModeApplication,
} from './reportModes';

export type V41PipelineState =
  | 'INPUT_REJECTED' | 'CALCULATION_FAILED' | 'CONSISTENCY_FAILED'
  | 'DERIVATION_FAILED' | 'REPORT_INCOMPLETE' | 'DENSITY_FAILED'
  | 'RENDER_FAILED' | 'QUALITY_FAILED' | 'SEMANTIC_FAILED' | 'READY_FOR_DELIVERY';

export interface V41PipelineResult {
  state: V41PipelineState;
  ok: boolean;
  errorCode?: string;
  errorDetails?: unknown;
  canonicalModel: KundliCanonicalModel | null;
  derivedModel: KundliDerivedModel | null;
  /** The model as built — identical to what pipeline v2 renders. */
  sourceReport: KundliReportModelV2 | null;
  /** The model actually drawn, after the consultation-density transform. */
  report: KundliReportModelV2 | null;
  densityApplied: DensityApplication[];
  densityUnmatched: string[];
  partAFindings: PartAFinding[];
  pdfBuffer: Uint8Array | null;
  pdfQuality: PdfQualityReport | null;
  metrics: PdfRenderMetrics | null;
  languageFindings: LanguageFinding[];
  pageTitles: string[];
  rendererVersion: string;
  fontsUsed: string[];
  /** Which audience edition was produced, and what it dropped. */
  mode: ReportMode;
  modeApplication: ModeApplication | null;
}

export interface GenerateV41Options extends RenderV3Options {
  /** Audience edition. Defaults to SCHOLAR — Pandit workbench + appendix. */
  mode?: ReportMode;
  locale?: 'en' | 'hi';
  /** Skip the density transform to render the raw v2 model with renderer v3. */
  skipDensityTransform?: boolean;
  /** Treat Part A residue findings as a hard failure (default true). */
  enforcePartADensity?: boolean;
  /** Stop after the model, for model-only tests. */
  skipPdf?: boolean;
}

const EMPTY = {
  densityApplied: [] as DensityApplication[],
  densityUnmatched: [] as string[],
  partAFindings: [] as PartAFinding[],
  languageFindings: [] as LanguageFinding[],
  pageTitles: [] as string[],
  rendererVersion: RENDERER_V3_VERSION,
  fontsUsed: [] as string[],
  mode: DEFAULT_REPORT_MODE,
  modeApplication: null as ModeApplication | null,
};

export async function generateKundliV41Pdf(
  rawInput: RawBirthInput,
  options: GenerateV41Options = {},
): Promise<V41PipelineResult> {
  /* Gates 1..3c and the language scan are pipeline v2's, unchanged. Running
   * them through v2 rather than copying them is deliberate: two copies of a
   * gate sequence is two things that can drift apart. */
  const base = await generateKundliV40Pdf(rawInput, { locale: options.locale, skipPdf: true });

  if (!base.ok || !base.report) {
    return {
      state: base.state as V41PipelineState,
      ok: false,
      errorCode: base.errorCode,
      errorDetails: base.errorDetails,
      canonicalModel: base.canonicalModel,
      derivedModel: base.derivedModel,
      sourceReport: base.report,
      report: base.report,
      pdfBuffer: null, pdfQuality: null, metrics: null,
      ...EMPTY,
      languageFindings: base.languageFindings,
    };
  }

  const sourceReport = base.report;

  /* GATE 3d — consultation density */
  let report = sourceReport;
  let densityApplied: DensityApplication[] = [];
  let densityUnmatched: string[] = [];
  if (!options.skipDensityTransform) {
    try {
      const result = applyConsultationDensity(sourceReport);
      report = result.report;
      densityApplied = result.applied;
      densityUnmatched = result.unmatched;
    } catch (e) {
      return {
        state: 'DENSITY_FAILED', ok: false,
        errorCode: 'KUNDLI_DENSITY_FAILED', errorDetails: String(e),
        canonicalModel: base.canonicalModel, derivedModel: base.derivedModel,
        sourceReport, report: sourceReport,
        pdfBuffer: null, pdfQuality: null, metrics: null,
        ...EMPTY,
      };
    }
  }

  /* GATE 3d2 — audience edition (§1)
   *
   * Applied AFTER the density transform so that CLIENT and PANDIT inherit
   * every Part A cleanup, and BEFORE the residue audit so the audit runs on
   * the sections actually being printed. SCHOLAR is the identity transform. */
  const mode = options.mode ?? DEFAULT_REPORT_MODE;
  const modeResult = applyReportMode(report, mode);
  report = modeResult.report;
  const modeApplication = modeResult.application;

  /* GATE 3e — no engineering residue left in Part A */
  const partAFindings = auditPartADensity(report);
  const enforce = options.enforcePartADensity ?? true;
  if (enforce && partAFindings.length > 0) {
    return {
      state: 'DENSITY_FAILED', ok: false,
      errorCode: 'KUNDLI_PART_A_DENSITY',
      errorDetails: { findings: partAFindings.slice(0, 10) },
      canonicalModel: base.canonicalModel, derivedModel: base.derivedModel,
      sourceReport, report,
      pdfBuffer: null, pdfQuality: null, metrics: null,
      ...EMPTY,
      densityApplied, densityUnmatched, partAFindings, mode, modeApplication,
    };
  }

  /* GATE 4b — the transform must not have introduced banned language. */
  const languageFindings = scanBannedLanguage(collectReportText(report));
  if (languageFindings.length > 0) {
    return {
      state: 'SEMANTIC_FAILED', ok: false,
      errorCode: 'KUNDLI_SUMMARY_INVALID',
      errorDetails: { findings: languageFindings.slice(0, 10) },
      canonicalModel: base.canonicalModel, derivedModel: base.derivedModel,
      sourceReport, report,
      pdfBuffer: null, pdfQuality: null, metrics: null,
      ...EMPTY,
      densityApplied, densityUnmatched, partAFindings, languageFindings, mode, modeApplication,
    };
  }

  if (options.skipPdf) {
    return {
      state: 'READY_FOR_DELIVERY', ok: true,
      canonicalModel: base.canonicalModel, derivedModel: base.derivedModel,
      sourceReport, report,
      pdfBuffer: null, pdfQuality: null, metrics: null,
      ...EMPTY,
      densityApplied, densityUnmatched, partAFindings, languageFindings, mode, modeApplication,
    };
  }

  /* RENDER */
  let buffer: Uint8Array;
  let metrics: PdfRenderMetrics;
  let pageTitles: string[];
  let fontsUsed: string[];
  try {
    const rendered = await renderKundliPdfV3(report, options);
    buffer = rendered.buffer;
    metrics = rendered.metrics;
    pageTitles = rendered.pageTitles;
    fontsUsed = rendered.fontsUsed;
  } catch (e) {
    const err = isKundliError(e) ? e : new KundliError('KUNDLI_PDF_RENDER_FAILED', String(e));
    return {
      state: 'RENDER_FAILED', ok: false,
      errorCode: err.code, errorDetails: err.details,
      canonicalModel: base.canonicalModel, derivedModel: base.derivedModel,
      sourceReport, report,
      pdfBuffer: null, pdfQuality: null, metrics: null,
      ...EMPTY,
      densityApplied, densityUnmatched, partAFindings, languageFindings, mode, modeApplication,
    };
  }

  /* GATE 4 */
  let pdfQuality: PdfQualityReport;
  try {
    pdfQuality = await validatePdfIntegrity({
      buffer,
      renderMetrics: metrics,
      // Mode-aware (§1): the gate asserts what THIS edition promises. A
      // fixed list would either fail CLIENT for correctly omitting a
      // practitioner's worksheet, or stop checking the appendix entirely.
      mandatorySectionTitles: MODE_DEFINITIONS[mode].mandatorySectionTitles,
      maxPages: options.maxPages ?? 44,
    });
  } catch (e) {
    const err = isKundliError(e) ? e : new KundliError('KUNDLI_PDF_QUALITY_FAILED', String(e));
    return {
      state: 'QUALITY_FAILED', ok: false,
      errorCode: err.code, errorDetails: err.details,
      canonicalModel: base.canonicalModel, derivedModel: base.derivedModel,
      sourceReport, report,
      pdfBuffer: buffer, pdfQuality: null, metrics,
      ...EMPTY,
      densityApplied, densityUnmatched, partAFindings, languageFindings, mode, modeApplication, pageTitles, fontsUsed,
    };
  }

  return {
    state: 'READY_FOR_DELIVERY', ok: true,
    canonicalModel: base.canonicalModel, derivedModel: base.derivedModel,
    sourceReport, report,
    pdfBuffer: buffer, pdfQuality, metrics,
    densityApplied, densityUnmatched, partAFindings, languageFindings, pageTitles,
    rendererVersion: RENDERER_V3_VERSION,
    fontsUsed,
    mode, modeApplication,
  };
}
