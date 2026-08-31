/**
 * Kundli PDF Pipeline — canonical types.
 *
 * These types define the single source of truth for the PDF generation
 * pipeline. Every stage (input validation, geo/timezone resolution,
 * calculation, canonicalization, interpretation, report model, rendering,
 * PDF validation) hands typed data to the next stage. Nothing may be
 * silently defaulted, cast away, or skipped.
 */

/* ------------------------------------------------------------------ */
/* Input & subject                                                     */
/* ------------------------------------------------------------------ */

export type CoordinateProvenance = 'MANUAL' | 'GEOCODED' | 'PROFILE' | 'FALLBACK';

export interface RawBirthInput {
  /** Subject name — required for report generation (personal document). */
  name?: string | null;
  /** Local birth date, YYYY-MM-DD. */
  birthDate?: string | null;
  /** Local birth time, HH:mm or HH:mm:ss (24h). */
  birthTime?: string | null;
  /** Birth place display name (city, country). */
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coordinateProvenance?: CoordinateProvenance | null;
  /** IANA timezone id (e.g. Asia/Kolkata). If absent, resolved from coordinates. */
  timezoneId?: string | null;
  /** Legacy numeric offset (hours). Accepted only when timezoneId cannot be resolved. */
  utcOffsetHours?: number | null;
}

export interface BirthCoordinates {
  latitude: number;      // -90..90
  longitude: number;     // -180..180
  provenance: CoordinateProvenance;
  /** When provenance === 'FALLBACK', the approval record (who/when/system approved). */
  fallbackApproved?: { by: string; at: string; reason: string };
}

export interface ResolvedTimezone {
  /** IANA zone id actually used. */
  timezoneId: string;
  /** Historical UTC offset at the birth instant (hours, incl. DST rules). */
  utcOffsetAtBirth: number;
  /** Offset provenance: IANA history, user-supplied numeric offset, estimated, or region-inferred. */
  offsetProvenance: 'IANA_HISTORICAL' | 'USER_SUPPLIED' | 'ESTIMATED' | 'REGION_INFERRED';
  /** Local datetime string as typed (YYYY-MM-DDTHH:mm[:ss]). */
  localDateTime: string;
  /** UTC instant (ISO-8601). */
  utcDateTime: string;
}

/** Birth profile as seen by the book model (no fingerprint yet). */
export type BirthProfile = Omit<NormalizedBirthProfile, 'fingerprint'>;

export interface NormalizedBirthProfile {
  name: string;
  birthDate: string;          // YYYY-MM-DD
  birthTime: string;          // HH:mm:ss
  locationName: string;
  coordinates: BirthCoordinates;
  timezone: ResolvedTimezone;
  /** SHA-256 fingerprint of the normalized input + calculation config. */
  fingerprint: string;
}

/* ------------------------------------------------------------------ */
/* Calculation configuration (traceability)                            */
/* ------------------------------------------------------------------ */

export interface CalculationConfig {
  zodiac: 'SIDEREAL';
  ayanamsha: string;            // 'LAHIRI_CHITRA_PAKSHA'
  ayanamshaName: string;        // 'Lahiri (Chitra Paksha)'
  houseSystem: string;          // 'EQUAL_SIGN' (whole-sign)
  nodeMode: 'MEAN_NODE' | 'TRUE_NODE';
  ephemerisProvider: string;    // 'ASTRONOMY_ENGINE_VSOP87_ELP2000'
  engineVersion: string;        // from meta.engineVersion
  calculationVersion: string;   // pipeline calculation layer version
  reportVersion: string;        // report model version
}

/* ------------------------------------------------------------------ */
/* Canonical calculation results                                       */
/* ------------------------------------------------------------------ */

export interface PanchangaData {
  tithi: { number: number; name: string; paksha: string; fullName: string };
  nakshatra: { name: string; pada: number; ruler: string };
  yoga: { name: string };
  karana: { name: string };
  masa: string;
  ritu: string;
  ayana: string;
  samvat: string;
}

export interface SignRef {
  id: number;             // 1..12 (Mesha=1)
  name: string;           // 'Mesha'
  en: string;             // 'Aries'
  lord: string;
}

export interface AscendantData {
  longitudeDeg: number;       // sidereal
  tropicalLongitudeDeg: number;
  sign: SignRef;
  degreeInSign: number;       // 0..30
  nakshatra: { name: string; pada: number };
}

export interface PlanetPosition {
  id: string;                 // 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu'
  name: string;
  longitudeDeg: number;       // sidereal
  sign: SignRef;
  degreeInSign: number;
  nakshatra: { name: string; pada: number };
  house: number;              // 1..12
  retrograde: boolean;
  dignity: 'EXALTED' | 'DEBILITATED' | 'OWN_SIGN' | 'FRIEND_SIGN' | 'NEUTRAL' | 'ENEMY_SIGN';
}

export interface HouseData {
  number: number;             // 1..12
  sign: SignRef;
  planets: string[];          // planet ids occupying the house
}

export interface DivisionalChartData {
  division: number;           // 1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60
  name: string;               // 'D1 Rashi', 'D9 Navamsha', ...
  lagnaSign: string;
  planets: { id: string; sign: string; degreeInSign: number }[];
}

export interface DashaPeriodInfo {
  planet: string;
  startDate: string;          // YYYY-MM-DD (local calendar date)
  endDate: string;
  durationYears: number;
  isCurrent: boolean;
  antardashas?: { planet: string; startDate: string; endDate: string }[];
}

export interface DashaTimelineData {
  system: 'VIMSHOTTARI';
  startingBalanceYears: number;
  mahadashas: DashaPeriodInfo[];
  current: {
    mahadasha: string;
    antardasha: string;
    pratyantardasha: string;
    startDate: string;
    endDate: string;
  };
}

export type AnalysisStatus = 'CALCULATED' | 'NOT_CALCULATED';

export interface ManglikResult {
  status: AnalysisStatus;
  present?: boolean;
  severity?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  causeHouses?: number[];
  cancellation?: { cancelled: boolean; reason?: string };
  notCalculatedReason?: string;
}

export interface SadeSatiResult {
  status: AnalysisStatus;
  active?: boolean;
  phase?: string;
  notCalculatedReason?: string;
}

export interface YogaResult {
  name: string;
  basis: string[];            // facts (planet positions) that formed the yoga
}

export interface DoshaResult {
  id: 'manglik' | 'sadeSati' | 'kalsarpa';
  status: AnalysisStatus;
  result: ManglikResult | SadeSatiResult;
}

export interface KundliCanonicalModel {
  subject: NormalizedBirthProfile;
  calculation: CalculationConfig;
  calculationMetadata: {
    ayanamshaValueDegrees: number;
    julianDay: number;
    localDateTime: string;
    utcDateTime: string;
    generatedAt: string;
  };
  panchanga: PanchangaData;
  ascendant: AscendantData;
  /** Exactly 9 entries: Sun..Ketu. */
  planets: PlanetPosition[];
  /** Exactly 12 entries. */
  houses: HouseData[];
  divisionalCharts: DivisionalChartData[];
  dashas: DashaTimelineData;
  yogas: YogaResult[];
  doshas: DoshaResult[];
}

/* ------------------------------------------------------------------ */
/* Report model (what the renderer may draw — and nothing else)        */
/* ------------------------------------------------------------------ */

export type ReportBlockKind =
  | 'heading' | 'paragraph' | 'keyValue' | 'table' | 'chart'
  | 'callout' | 'divider' | 'pageFooter';

export interface ReportBlockBase { kind: ReportBlockKind; }

export interface HeadingBlock extends ReportBlockBase { kind: 'heading'; level: 1 | 2 | 3; text: string; }
export interface ParagraphBlock extends ReportBlockBase { kind: 'paragraph'; text: string; }
export interface KeyValueBlock extends ReportBlockBase { kind: 'keyValue'; label: string; value: string; }
export interface TableBlock extends ReportBlockBase {
  kind: 'table';
  headers: string[];
  rows: string[][];
  /** Optional column emphasis (e.g. highlight the current dasha row). */
  highlightRows?: number[];
}
export interface ChartBlock extends ReportBlockBase { kind: 'chart'; chartType: 'NORTH_INDIAN_D1'; data: unknown; }
export interface CalloutBlock extends ReportBlockBase { kind: 'callout'; text: string; tone: 'warning' | 'info' | 'remedy'; }
export interface DividerBlock extends ReportBlockBase { kind: 'divider'; }
export interface PageFooterBlock extends ReportBlockBase { kind: 'pageFooter'; text: string; }

export type ReportBlock =
  | HeadingBlock | ParagraphBlock | KeyValueBlock | TableBlock
  | ChartBlock | CalloutBlock | DividerBlock | PageFooterBlock;

export type SectionStatus = 'READY' | 'NOT_APPLICABLE' | 'FAILED';

export interface ReportSection {
  id: string;
  title: string;
  status: SectionStatus;
  blocks: ReportBlock[];
}

export interface InterpretationEntry {
  sectionId: string;
  sourceFacts: string[];          // canonical fields this text was derived from
  generatorVersion: string;       // deterministic rules version
  promptVersion: string | null;   // null => deterministic, never LLM
  text: string;
}

export interface ReportLineage {
  reportId: string;
  fingerprint: string;
  stages: { stage: string; at: string; ok: boolean }[];
}

export interface KundliReportModel {
  reportId: string;
  generatedAt: string;
  locale: 'en' | 'hi';
  calculation: CalculationConfig;
  subject: {
    name: string;
    birthDate: string;
    birthTime: string;
    locationName: string;
    coordinates: BirthCoordinates;
    timezone: ResolvedTimezone;
  };
  lineage: ReportLineage;
  sections: ReportSection[];
}

/* ------------------------------------------------------------------ */
/* PDF quality                                                         */
/* ------------------------------------------------------------------ */

export interface PdfPageMetric {
  page: number;
  /** Text characters actually extracted from the artifact (0 = blank page). */
  extractedChars: number;
  /** Text characters the renderer placed on this page (instrumented). */
  placedChars: number;
  blank: boolean;
}

export interface PdfQualityReport {
  status: 'PASS' | 'FAIL';
  reasons: string[];
  pageCount: number;
  pageMetrics: PdfPageMetric[];
  blankPageCount: number;
  consecutiveBlankPageCount: number;
  /** @deprecated use consecutiveBlankPageCount */
  consecutiveBlankPageStreak: number;
  contentDensity: number;         // non-blank pages / total pages
  mandatorySectionsFound: string[];
  mandatorySectionsMissing: string[];
}

export interface PdfRenderMetrics {
  pageCount: number;
  placedCharsByPage: number[];
  blocksRendered: number;
  sectionsRendered: number;
}

/* ------------------------------------------------------------------ */
/* Pipeline result / state                                             */
/* ------------------------------------------------------------------ */

export type PipelineState =
  | 'INPUT_VALIDATED'
  | 'GEO_TIMEZONE_RESOLVED'
  | 'CALCULATION_COMPLETE'
  | 'REPORT_READY'
  | 'PDF_RENDERED'
  | 'PDF_VALIDATED'
  | 'READY_FOR_DELIVERY'
  | 'INPUT_FAILED'
  | 'CALCULATION_FAILED'
  | 'REPORT_FAILED'
  | 'PDF_RENDER_FAILED'
  | 'PDF_VALIDATION_FAILED';

export interface KundliPipelineResult {
  state: PipelineState;
  ok: boolean;
  errorCode: string | null;
  errorDetails: Record<string, unknown> | null;
  canonicalModel: KundliCanonicalModel | null;
  report: KundliReportModel | null;
  pdfBuffer: Uint8Array | null;
  pdfQuality: PdfQualityReport | null;
  metrics: PdfRenderMetrics | null;
}

export interface GenerateKundliPdfOptions {
  locale?: 'en' | 'hi';
  /** Render the PDF (false = dry-run: build report model only). */
  renderPdf?: boolean;
  /** Approve FALLBACK coordinates (system-level decision, recorded). */
  allowFallback?: boolean | { by: string; reason: string; latitude: number; longitude: number };
  /** Override page ceiling (tests). */
  maxPages?: number;
  /** Override PDF text extractor (tests). */
  extractPdf?: (buffer: Uint8Array) => Promise<{ pageCount: number; pages: { charCount: number }[]; allText?: string }>;
  /** Emit stage metrics. */
  onMetric?: (name: string, data: Record<string, unknown>) => void;
}
