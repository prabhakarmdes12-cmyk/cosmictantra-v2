/**
 * KUNDLI V40 — report model v2 block vocabulary.
 *
 * `kundli-report-v2` is a NEW model. `kundli-report-v1` (reportModel.ts +
 * renderer.ts) is untouched and stays available as the regression reference
 * renderer until V40 passes acceptance.
 *
 * Every block carries a `contentType`, so the epistemic status of a line is a
 * property of the data rather than of the prose around it (KUNDLI_INV_002).
 */

import type { ContentType, JyotishSystem } from './contentTypes';
import type { LabelMode } from './labels';

export type ReportPart = 'A' | 'B';

export interface V2BlockBase {
  contentType?: ContentType;
  system?: JyotishSystem;
}

export interface CoverBlock extends V2BlockBase {
  kind: 'cover';
  invocation: string;
  brand: string;
  documentTitle: string;
  /** Which public edition produced this document, e.g. "Client Reading". */
  editionLabel: string;
  subjectName: string;
  birthLines: string[];
  identityLines: string[];
  currentPeriodLine: string;
  reportId: string;
  verificationBadge: string[];
}

export interface PartDividerBlock extends V2BlockBase {
  kind: 'partDivider';
  part: ReportPart;
  title: string;
  subtitle: string;
  contents: string[];
}

export interface SectionTitleBlock extends V2BlockBase {
  kind: 'sectionTitle';
  text: string;
  /** Optional second-language line beneath the title. */
  secondary?: string;
  /** Small right-aligned tag, e.g. "PART A - 3". */
  tag?: string;
}

export interface HeadingBlockV2 extends V2BlockBase {
  kind: 'heading';
  level: 2 | 3;
  text: string;
}

export interface ParagraphBlockV2 extends V2BlockBase {
  kind: 'paragraph';
  text: string;
  size?: 'body' | 'small' | 'micro';
}

export interface BulletsBlock extends V2BlockBase {
  kind: 'bullets';
  items: string[];
  size?: 'body' | 'small';
}

export interface KvGridBlock extends V2BlockBase {
  kind: 'kvGrid';
  title?: string;
  columns: 1 | 2;
  items: { label: string; value: string; note?: string; contentType?: ContentType }[];
}

export interface TableBlockV2 extends V2BlockBase {
  kind: 'table';
  headers: string[];
  rows: string[][];
  /** Column widths as fractions of the content width; must sum to ~1. */
  widths?: number[];
  align?: ('left' | 'right' | 'center')[];
  highlightRows?: number[];
  caption?: string;
  footnote?: string;
}

export interface ChartBlockV2 extends V2BlockBase {
  kind: 'chart';
  chartType: 'NORTH_INDIAN_D1' | 'NORTH_INDIAN_D9';
  /** A validated ChartRenderModel. The renderer draws this and nothing else. */
  data: unknown;
  size: 'hero' | 'inline';
  caption: string;
  /** Compact facts printed beside/below the drawing. */
  sideFacts?: { label: string; value: string }[];
}

export interface StatusListBlock extends V2BlockBase {
  kind: 'statusList';
  title?: string;
  items: {
    label: string;
    status: 'PRESENT' | 'ABSENT' | 'SCHOLAR_JUDGEMENT' | 'NOT_CALCULATED' | 'VALIDATION_PENDING' | 'INDETERMINATE';
    /**
     * Localised word for `status`. The renderer draws this when present and
     * otherwise derives an English word from the enum. Language lives in the
     * model: the renderer must not know that उपस्थित means PRESENT.
     */
    statusText?: string;
    note?: string;
    xref?: string;
  }[];
}

export interface TimelineBlock extends V2BlockBase {
  kind: 'timeline';
  caption: string;
  periods: {
    label: string;
    start: string;
    end: string;
    years: number;
    current: boolean;
    /** Fully localised display strings; renderers do not author English connectors. */
    rangeLabel?: string;
    durationLabel?: string;
  }[];
}

export interface NotesAreaBlock extends V2BlockBase {
  kind: 'notesArea';
  title: string;
  lines: number;
}

/**
 * One row of a scored gauge.
 *
 * The score is carried by the MODEL, never computed by the renderer: the bar
 * length is `score / max`, which is geometry, and every word beside it came
 * from the derivation layer. KUNDLI_INV_RENDER_001 holds for this block exactly
 * as it holds for a table.
 */
export interface GaugeItemV2 {
  /** The dimension as the reader sees it, e.g. "Career Drive & Public Trajectory". */
  label: string;
  /** Optional classical gloss printed as a small tag beside the label. */
  axis?: string;
  /** Position on the scale. 0..max. */
  score: number;
  /** Localised tier word for `score`, e.g. "सुसंतुलित / Harmonious". */
  tier: string;
  /** The numbers behind the score: significators, bindus, strength ratio. */
  evidence?: string;
  /** Actionable takeaway. Guidance, never a prediction. */
  note?: string;
  contentType?: ContentType;
}

/**
 * A scored gauge grid — the printed form of the on-screen Executive Life Gauge.
 *
 * Drawn as hairline-ruled bars in the document's own gold, in the same visual
 * grammar as the Vimshottari timeline: no cards, no shadows, no gradients, and
 * a shape that still reads on a black-and-white photocopy.
 */
export interface GaugeGridBlock extends V2BlockBase {
  kind: 'gaugeGrid';
  title?: string;
  items: GaugeItemV2[];
  /** Top of the scale. Defaults to 100. */
  max?: number;
  caption?: string;
  footnote?: string;
}

export interface CalloutBlockV2 extends V2BlockBase {
  kind: 'callout';
  text: string;
  tone: 'info' | 'warning' | 'limitation';
  title?: string;
}

export interface DividerBlockV2 extends V2BlockBase { kind: 'divider'; }
export interface SpacerBlock extends V2BlockBase { kind: 'spacer'; mm: number; }

export type V2Block =
  | CoverBlock | PartDividerBlock | SectionTitleBlock | HeadingBlockV2 | ParagraphBlockV2
  | BulletsBlock | KvGridBlock | TableBlockV2 | ChartBlockV2 | StatusListBlock
  | TimelineBlock | NotesAreaBlock | GaugeGridBlock | CalloutBlockV2 | DividerBlockV2 | SpacerBlock;

export interface V2Section {
  id: string;
  title: string;
  part: ReportPart;
  /** Consultation sections each start on their own page. */
  startsNewPage: boolean;
  status: 'READY' | 'NOT_APPLICABLE';
  blocks: V2Block[];
}

export interface KundliReportModelV2 {
  reportModelVersion: string;
  reportId: string;
  generatedAt: string;
  locale: LabelMode;
  labelMode: 'en' | 'hi' | 'hi-en';
  /** Deterministic; excludes the generation timestamp. */
  contentHash: string;
  fingerprint: string;
  engineVersions: Record<string, string>;
  subject: {
    name: string;
    birthDate: string;
    birthTime: string;
    locationName: string;
  };
  sections: V2Section[];
}
