/**
 * KUNDLI V40 — pipeline v2.
 *
 * GATE 1   validateBirthInput           typed failure, no silent defaults
 * GATE 1b  resolveGeoTimezone           IANA / historical offset
 * GATE 2   buildCanonicalModel          astronomical truth, frozen from here on
 * GATE 2b  checkCanonicalConsistency    internal agreement of the kernel output
 * GATE 3   buildDerivedModel            V40 Jyotish derivation (no new astronomy)
 * GATE 3b  buildKundliReportModelV2     Part A + Part B block model
 * GATE 3c  assertReportV2Completeness   mandatory sections present
 * RENDER   renderKundliPdfV2            the only component that draws
 * GATE 4   validatePdfIntegrity         page ceiling, blank pages, density
 * GATE 4b  semantic scan                banned prediction language
 *
 * The v1 pipeline is untouched. This one runs beside it so the two can be
 * compared on the same input for as long as the regression gate needs.
 */

import { KundliError, isKundliError } from '../errors';
import { KUNDLI_PIPELINE_CONFIG } from '../config';
import { validateBirthInput, validateCalculationModel } from '../validation';
import { resolveGeoTimezone } from '../geoTz';
import { computeFingerprint } from '../lineage';
import { buildCanonicalModel } from '../canonicalModel';
import { checkCanonicalConsistency, KUNDLI_CONSISTENCY_FAILED } from '../consistencyGate';
import { validatePdfIntegrity } from '../pdfValidator';
import { scanBannedLanguage, type LanguageFinding } from '../scholarSummary';
import { getCanonicalJyotishSnapshot } from '../../jyotish/canonicalSnapshot';
import type { KundliCanonicalModel, PdfQualityReport, PdfRenderMetrics, RawBirthInput } from '../types';
import { buildDerivedModel, type KundliDerivedModel } from './derivedModel';
import { buildKundliReportModelV2, assertReportV2Completeness } from './reportModelV2';
import { buildExecutiveInsights } from './executiveInsights';
import { renderKundliPdfV2, type RenderV2Options } from './rendererV2';
import type { KundliReportModelV2, V2Block } from './reportBlocks';

export type V40PipelineState =
  | 'INPUT_REJECTED' | 'CALCULATION_FAILED' | 'CONSISTENCY_FAILED'
  | 'DERIVATION_FAILED' | 'REPORT_INCOMPLETE' | 'RENDER_FAILED'
  | 'QUALITY_FAILED' | 'SEMANTIC_FAILED' | 'READY_FOR_DELIVERY';

export interface V40PipelineResult {
  state: V40PipelineState;
  ok: boolean;
  errorCode?: string;
  errorDetails?: unknown;
  canonicalModel: KundliCanonicalModel | null;
  derivedModel: KundliDerivedModel | null;
  report: KundliReportModelV2 | null;
  pdfBuffer: Uint8Array | null;
  pdfQuality: PdfQualityReport | null;
  metrics: PdfRenderMetrics | null;
  languageFindings: LanguageFinding[];
  pageTitles: string[];
}

export interface GenerateV40Options extends RenderV2Options {
  locale?: 'en' | 'hi' | 'hi-en';
  /** Skip the PDF-integrity gate (used by model-only tests). */
  skipPdf?: boolean;
}

function failure(state: V40PipelineState, e: unknown): V40PipelineResult {
  const err = isKundliError(e) ? e : new KundliError('KUNDLI_PDF_RENDER_FAILED', String(e));
  return {
    state, ok: false, errorCode: err.code, errorDetails: err.details,
    canonicalModel: null, derivedModel: null, report: null,
    pdfBuffer: null, pdfQuality: null, metrics: null,
    languageFindings: [], pageTitles: [],
  };
}

/** Collects every human-readable string the report will print. */
export function collectReportText(report: KundliReportModelV2): { where: string; text: string }[] {
  const parts: { where: string; text: string }[] = [];
  const push = (where: string, text?: string) => {
    if (text && text.trim().length > 0) parts.push({ where, text });
  };
  for (const section of report.sections) {
    section.blocks.forEach((block: V2Block, i) => {
      const where = `${section.id}#${i}:${block.kind}`;
      switch (block.kind) {
        case 'cover':
          push(where, [block.documentTitle, block.subjectName, ...block.birthLines, ...block.identityLines, block.currentPeriodLine, ...block.verificationBadge].join(' '));
          break;
        case 'partDivider': push(where, [block.title, block.subtitle, ...block.contents].join(' ')); break;
        case 'sectionTitle': push(where, [block.text, block.secondary].filter(Boolean).join(' ')); break;
        case 'heading': push(where, block.text); break;
        case 'paragraph': push(where, block.text); break;
        case 'bullets': push(where, block.items.join(' ')); break;
        case 'kvGrid': push(where, [block.title, ...block.items.map((it) => `${it.label} ${it.value} ${it.note ?? ''}`)].join(' ')); break;
        case 'table': push(where, [...block.headers, ...block.rows.flat(), block.caption, block.footnote].filter(Boolean).join(' ')); break;
        case 'chart': push(where, [block.caption, ...(block.sideFacts ?? []).map((f) => `${f.label} ${f.value}`)].join(' ')); break;
        case 'statusList': push(where, [block.title, ...block.items.map((it) => `${it.label} ${it.status} ${it.note ?? ''}`)].filter(Boolean).join(' ')); break;
        case 'timeline': push(where, [block.caption, ...block.periods.map((pp) => `${pp.label} ${pp.start} ${pp.end}`)].join(' ')); break;
        case 'gaugeGrid': push(where, [
          block.title, block.caption, block.footnote,
          ...block.items.map((it) => [it.label, it.axis, it.tier, it.evidence, it.note].filter(Boolean).join(' ')),
        ].filter(Boolean).join(' ')); break;
        case 'notesArea': push(where, block.title); break;
        case 'callout': push(where, [block.title, block.text].filter(Boolean).join(' ')); break;
        default: break;
      }
    });
  }
  return parts;
}

export async function generateKundliV40Pdf(
  rawInput: RawBirthInput,
  options: GenerateV40Options = {},
): Promise<V40PipelineResult> {
  const locale = options.locale ?? 'en';

  /* GATE 1 + 1b */
  let profile;
  try {
    const validated = validateBirthInput(rawInput, {});
    const resolved = resolveGeoTimezone(validated, rawInput);
    profile = resolved.profile;
    profile.fingerprint = computeFingerprint(rawInput, KUNDLI_PIPELINE_CONFIG.calculation, {
      localDateTime: profile.timezone.localDateTime,
      utcDateTime: profile.timezone.utcDateTime,
      timezoneId: profile.timezone.timezoneId,
      latitude: profile.coordinates.latitude,
      longitude: profile.coordinates.longitude,
      provenance: profile.coordinates.provenance,
    });
  } catch (e) {
    return failure('INPUT_REJECTED', e);
  }

  /* GATE 2 */
  let canonical: KundliCanonicalModel;
  /* The snapshot is hoisted out of the gate's try-block deliberately. The same
   * astronomical truth that feeds the canonical model also feeds the
   * presentation-parity layer at GATE 3a; computing it twice would allow the
   * gauge to disagree with the chart printed beside it. */
  let snapshot: ReturnType<typeof getCanonicalJyotishSnapshot> | null = null;
  try {
    snapshot = getCanonicalJyotishSnapshot({
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      latitude: profile.coordinates.latitude,
      longitude: profile.coordinates.longitude,
      timezone: profile.timezone.utcOffsetAtBirth,
      locationName: profile.locationName,
    });
    canonical = buildCanonicalModel({ profile, snapshot, config: KUNDLI_PIPELINE_CONFIG.calculation });
    validateCalculationModel(canonical);
  } catch (e) {
    return failure('CALCULATION_FAILED', e);
  }

  /* GATE 2b */
  const consistency = checkCanonicalConsistency({ canonical });
  const critical = consistency.findings.filter((f) => f.severity === 'CRITICAL');
  if (critical.length > 0) {
    return failure('CONSISTENCY_FAILED', new KundliError(
      KUNDLI_CONSISTENCY_FAILED,
      `canonical model failed ${critical.length} critical consistency checks`,
      { findings: critical.slice(0, 10) },
    ));
  }

  /* GATE 3 */
  let derived: KundliDerivedModel;
  try {
    derived = buildDerivedModel(canonical);
  } catch (e) {
    return failure('DERIVATION_FAILED', e);
  }

  /* GATE 3a — presentation parity, and the one step in this pipeline that is
   * allowed to fail silently.
   *
   * The six-dimension life gauge and the nine graha archetype quadrants are
   * already on the /report screen. Printing them here keeps the download and
   * the consultation page telling the same story from the same snapshot. But
   * they are a PRESENTATION layer over GATE 2/GATE 3 truth: if they cannot be
   * built, the report omits those blocks and still delivers a complete,
   * validated Kundli. A missing gauge is a smaller harm than a failed
   * download, so this never returns a failure state. */
  const executive = snapshot ? buildExecutiveInsights(snapshot) : null;

  /* GATE 3b + 3c */
  let report: KundliReportModelV2;
  try {
    report = buildKundliReportModelV2(canonical, derived, locale, executive);
    assertReportV2Completeness(report);
  } catch (e) {
    return failure('REPORT_INCOMPLETE', e);
  }

  /* GATE 4b — semantics are checked on the model, before a single mark is
   * drawn, so a banned phrase can never reach an artifact at all. */
  const languageFindings = scanBannedLanguage(collectReportText(report));
  if (languageFindings.length > 0) {
    return {
      ...failure('SEMANTIC_FAILED', new KundliError(
        'KUNDLI_SUMMARY_INVALID',
        `report text contains ${languageFindings.length} banned prediction phrase(s)`,
        { findings: languageFindings.slice(0, 10) },
      )),
      canonicalModel: canonical,
      derivedModel: derived,
      report,
      languageFindings,
    };
  }

  if (options.skipPdf) {
    return {
      state: 'READY_FOR_DELIVERY', ok: true,
      canonicalModel: canonical, derivedModel: derived, report,
      pdfBuffer: null, pdfQuality: null, metrics: null,
      languageFindings, pageTitles: [],
    };
  }

  /* RENDER */
  let buffer: Uint8Array;
  let metrics: PdfRenderMetrics;
  let pageTitles: string[];
  try {
    const rendered = await renderKundliPdfV2(report, options);
    buffer = rendered.buffer;
    metrics = rendered.metrics;
    pageTitles = rendered.pageTitles;
  } catch (e) {
    return { ...failure('RENDER_FAILED', e), canonicalModel: canonical, derivedModel: derived, report };
  }

  /* GATE 4 */
  let pdfQuality: PdfQualityReport;
  try {
    pdfQuality = await validatePdfIntegrity({
      buffer,
      renderMetrics: metrics,
      mandatorySectionTitles: [
        'Kundli Passport', 'Kundli Saar', 'Graha Dossier',
        'Bhava Intelligence Matrix', 'Vimshottari Timeline', 'Pandit Notes',
      ],
      maxPages: options.maxPages ?? 40,
    });
  } catch (e) {
    return {
      ...failure('QUALITY_FAILED', e),
      canonicalModel: canonical, derivedModel: derived, report,
      pdfBuffer: buffer, metrics, pageTitles,
    };
  }

  return {
    state: 'READY_FOR_DELIVERY', ok: true,
    canonicalModel: canonical, derivedModel: derived, report,
    pdfBuffer: buffer, pdfQuality, metrics, languageFindings, pageTitles,
  };
}
