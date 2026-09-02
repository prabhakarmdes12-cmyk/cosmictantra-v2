/**
 * KUNDLI V41 — report modes (§1).
 *
 * Three audiences, one canonical Kundli. They differ ONLY in information
 * density: no mode computes anything the others do not, and no mode states
 * anything the others contradict. A fact removed from CLIENT is not a fact
 * softened for CLIENT — it is the same fact, printed elsewhere.
 *
 *   CLIENT   ~10-14pp  plain explanation, minimal technical metadata
 *   PANDIT   ~14-20pp  dense chart intelligence, traditional vocabulary
 *   SCHOLAR  PANDIT + the complete engineering appendix
 *
 * The default download is SCHOLAR — "PANDIT + SCHOLAR APPENDIX" in the brief's
 * words — because the person downloading a Master Kundli is the one who wants
 * to be able to check it.
 *
 * This module derives no Jyotish facts. It selects sections that the report
 * model already built.
 */

import type { KundliReportModelV2, V2Section } from './reportBlocks';

export const REPORT_MODES_VERSION = 'kundli-report-modes-v1';

export type ReportMode = 'CLIENT' | 'PANDIT' | 'SCHOLAR';

export const REPORT_MODES: ReportMode[] = ['CLIENT', 'PANDIT', 'SCHOLAR'];

/** What the public download produces when nothing is specified. */
export const DEFAULT_REPORT_MODE: ReportMode = 'SCHOLAR';

export const DOWNLOAD_CONTRACT = {
  reportModelVersion: 'kundli-report-v2',
  rendererVersion: 'kundli-pdf-renderer-v3',
} as const;

/**
 * Sections CLIENT does not receive, each with the reason.
 *
 * The reason matters. "Too technical" is not a reason — everything in a Kundli
 * is technical. The test is whether the page is usable by someone who does not
 * already read charts, and whether its absence changes any conclusion. None of
 * these do: each is a working surface for a practitioner, and each survives in
 * full in PANDIT and SCHOLAR.
 */
export const CLIENT_OMISSIONS: Record<string, string> = {
  'graha-dossier':
    'A nine-row technical dossier of dignity, motion and avastha. A client cannot act on it and misreads it as a verdict.',
  'bhava-matrix':
    'A twelve-row working matrix of house lords, occupants and aspects. It is a practitioner\'s instrument, not a reading.',
  'pandit-discussion-points':
    'Questions written FOR a practitioner to raise. In a client\'s hands they read as unanswered doubts about their own chart.',
  'pandit-notes':
    'Blank annotation space for the practitioner conducting the consultation.',
};

/** Sections only SCHOLAR receives — the whole of Part B. */
export const SCHOLAR_ONLY_PREFIXES = ['part-b-divider', 'appendix-', 'calculation-certificate'];

export interface ModeDefinition {
  mode: ReportMode;
  label: { en: string; hi: string };
  description: { en: string; hi: string };
  /** Whether Part B (the engineering appendix) is included. */
  includesAppendix: boolean;
  /** Expected page range, used as a soft check rather than a target. */
  expectedPages: { min: number; max: number };
  /**
   * Section titles the release gate requires in the rendered text.
   *
   * The first three are the floor: a document without the birth data, the
   * one-page summary and the dasha timeline is not a Kundli, whoever it is
   * for. The rest are what each edition additionally promises.
   */
  mandatorySectionTitles: string[];
}

/** Present in every edition, by definition. */
export const UNIVERSAL_MANDATORY_SECTIONS = [
  'Kundli Passport', 'Kundli Saar', 'Vimshottari Timeline',
];

export const MODE_DEFINITIONS: Record<ReportMode, ModeDefinition> = {
  CLIENT: {
    mode: 'CLIENT',
    label: { en: 'Client Reading', hi: 'जातक पाठ' },
    description: {
      en: 'The chart, what it says, and when. Written to be read without prior training.',
      hi: 'कुण्डली, उसका कथन, और काल। बिना पूर्व अभ्यास के पढ़ने योग्य।',
    },
    includesAppendix: false,
    expectedPages: { min: 8, max: 16 },
    mandatorySectionTitles: [...UNIVERSAL_MANDATORY_SECTIONS],
  },
  PANDIT: {
    mode: 'PANDIT',
    label: { en: 'Pandit Workbench', hi: 'पण्डित कार्यपत्र' },
    description: {
      en: 'Full chart intelligence in traditional vocabulary, with room to annotate.',
      hi: 'पारम्परिक शब्दावली में सम्पूर्ण कुण्डली विवेचन, टिप्पणी हेतु स्थान सहित।',
    },
    includesAppendix: false,
    expectedPages: { min: 12, max: 22 },
    mandatorySectionTitles: [
      ...UNIVERSAL_MANDATORY_SECTIONS,
      'Graha Dossier', 'Bhava Intelligence Matrix', 'Pandit Notes',
    ],
  },
  SCHOLAR: {
    mode: 'SCHOLAR',
    label: { en: 'Scholar Edition', hi: 'शास्त्री संस्करण' },
    description: {
      en: 'The Pandit workbench plus the complete evidence appendix: every rule, source, hash and calculation.',
      hi: 'पण्डित कार्यपत्र सहित सम्पूर्ण प्रमाण परिशिष्ट: प्रत्येक नियम, स्रोत एवं गणना।',
    },
    includesAppendix: true,
    expectedPages: { min: 30, max: 46 },
    mandatorySectionTitles: [
      ...UNIVERSAL_MANDATORY_SECTIONS,
      'Graha Dossier', 'Bhava Intelligence Matrix', 'Pandit Notes',
      'Calculation Certificate', 'Evidence Lineage',
    ],
  },
};

export interface ModeApplication {
  mode: ReportMode;
  keptSectionIds: string[];
  droppedSectionIds: string[];
  /** Why each dropped section was dropped, so the choice is auditable. */
  rationale: Record<string, string>;
}

export interface ModeResult {
  report: KundliReportModelV2;
  application: ModeApplication;
}

const isScholarOnly = (id: string): boolean =>
  SCHOLAR_ONLY_PREFIXES.some((p) => id === p || id.startsWith(p));

/**
 * Selects the sections a mode receives.
 *
 * SCHOLAR is the identity transform: it is the full report, and making it the
 * identity means the default download is byte-for-byte what the V40.1 test
 * suite already validates.
 */
export function applyReportMode(source: KundliReportModelV2, mode: ReportMode): ModeResult {
  const report: KundliReportModelV2 = { ...source, sections: [] };
  const kept: V2Section[] = [];
  const dropped: string[] = [];
  const rationale: Record<string, string> = {};

  for (const section of source.sections) {
    if (isScholarOnly(section.id) && mode !== 'SCHOLAR') {
      dropped.push(section.id);
      rationale[section.id] = 'Engineering appendix — Scholar edition only.';
      continue;
    }
    if (mode === 'CLIENT' && CLIENT_OMISSIONS[section.id]) {
      dropped.push(section.id);
      rationale[section.id] = CLIENT_OMISSIONS[section.id];
      continue;
    }
    kept.push(section);
  }

  report.sections = kept;
  return {
    report,
    application: {
      mode,
      keptSectionIds: kept.map((s) => s.id),
      droppedSectionIds: dropped,
      rationale,
    },
  };
}

/**
 * Parses a mode from untrusted input (a query string, a form field).
 *
 * Unknown input yields the default rather than an error: a malformed mode is
 * not a reason to deny someone their Kundli, and the default is the most
 * complete edition, so nothing is hidden by the failure.
 */
export function parseReportMode(value: unknown): ReportMode {
  const s = String(value ?? '').trim().toUpperCase();
  return (REPORT_MODES as string[]).includes(s) ? (s as ReportMode) : DEFAULT_REPORT_MODE;
}
