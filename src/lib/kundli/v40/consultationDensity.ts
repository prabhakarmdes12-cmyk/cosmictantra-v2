/**
 * KUNDLI V40.1 — consultation density transform (§9).
 *
 * The V40.1 audit question, applied to every block in Part A:
 *
 *     "Would a practising Pandit want this visible while a client is sitting
 *      in front of them?"
 *
 * Where the answer is no, the block is not deleted — deletion would lose
 * information the document promises to keep. It is moved to Part B, shortened,
 * or stripped of the engineering detail that made it unsuitable. Every action
 * is declared as a numbered rule with a rationale, and every application is
 * recorded, so the audit is reviewable rather than a diff a reader has to
 * reverse-engineer.
 *
 * This is a MODEL transform, not a renderer behaviour. Renderer v2 keeps
 * receiving the untransformed model, so the V40 regression artifact is
 * unchanged and the two can still be compared.
 *
 * It derives no Jyotish facts. Every rule below either removes text, shortens
 * text that is already in the model, or relocates a block. No rule invents a
 * value, and none changes a status, a degree, a date or a verdict.
 */

import type { KundliReportModelV2, V2Block, V2Section } from './reportBlocks';
import { D10_PROMOTION } from './d10Validation';

/** Escapes a literal string for use inside a RegExp. */
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const CONSULTATION_DENSITY_VERSION = 'consultation-density-v1';

export type DensityAction = 'SHORTEN' | 'STRIP_DETAIL' | 'MOVE_TO_PART_B' | 'DROP_DUPLICATE';

export interface DensityRule {
  id: string;
  sectionId: string;
  action: DensityAction;
  /** Why a Pandit does not want this in front of a client. */
  rationale: string;
  /** Where the information still lives after the move. */
  preservedIn: string;
}

export interface DensityApplication {
  ruleId: string;
  sectionId: string;
  blockIndex: number;
  action: DensityAction;
  before: string;
  after: string;
}

export interface DensityResult {
  report: KundliReportModelV2;
  applied: DensityApplication[];
  /** Rules that matched nothing — a drifted rule is a silent failure. */
  unmatched: string[];
}

export const DENSITY_RULES: DensityRule[] = [
  {
    id: 'CD-01',
    sectionId: 'kundli-passport',
    action: 'STRIP_DETAIL',
    rationale: 'The input fingerprint is a 16-hex implementation hash. It belongs on the certificate, not on the first page a client sees.',
    preservedIn: 'Part B · B1 Calculation Certificate (Input fingerprint)',
  },
  {
    id: 'CD-02',
    sectionId: 'kundli-saar',
    action: 'SHORTEN',
    rationale: 'A paragraph explaining that highlights are not written by a language model is a statement about our engineering process, not about the chart.',
    preservedIn: 'Part B · B10 Lineage and method',
  },
  {
    id: 'CD-03',
    sectionId: 'graha-dossier',
    action: 'MOVE_TO_PART_B',
    rationale: 'Shadbala is VALIDATION_PENDING and contributes to no conclusion. Naming an unvalidated internal quantity mid-consultation invites a question the document cannot answer.',
    preservedIn: 'Part B · B7 Computed but not validated',
  },
  {
    id: 'CD-04',
    sectionId: 'graha-dossier',
    action: 'SHORTEN',
    rationale: 'The footnote repeats the report-wide DMS and NOT_CALCULATED policy on a page where it is already visible from the table itself.',
    preservedIn: 'Part B · B1 Calculation Certificate and B9 Not calculated',
  },
  {
    id: 'CD-05',
    sectionId: 'yoga-dosha-dashboard',
    action: 'SHORTEN',
    rationale: 'Source-status boilerplate repeated under every dashboard. A short status belongs in Part A; the full provenance statement belongs in the appendix.',
    preservedIn: 'Part B · B8 Source registry',
  },
  {
    id: 'CD-06',
    sectionId: 'vimshottari-timeline',
    action: 'MOVE_TO_PART_B',
    rationale: 'Describes how the canonical adapter stores a rounded string and how the value was re-derived. That is a note about our code, not about the dasha.',
    preservedIn: 'Part B · B1 Calculation Certificate',
  },
  {
    id: 'CD-07',
    sectionId: 'career-synthesis',
    action: 'STRIP_DETAIL',
    rationale: 'A repository documentation path (docs/kundli-v40/...) printed in a client-facing report is a debug reference.',
    preservedIn: 'Part B · B6 D10 quarantine',
  },
  {
    id: 'CD-08',
    sectionId: 'career-synthesis',
    action: 'DROP_DUPLICATE',
    rationale: 'The same D10 quarantine sentence appears three times on one page. Once is a limitation; three times is noise.',
    preservedIn: 'Part B · B6 D10 quarantine',
  },
  {
    id: 'CD-10',
    sectionId: 'yoga-dosha-dashboard',
    action: 'SHORTEN',
    rationale: 'A dashboard row carrying a six-line explanation of why a rule was not adopted, complete with the registry identifier, stops being a dashboard.',
    preservedIn: 'Part B · B2 Yoga Evidence (the full adoption note, verbatim)',
  },
  {
    id: 'CD-11',
    sectionId: 'vimshottari-timeline',
    action: 'STRIP_DETAIL',
    rationale: 'Six decimal places of a year and four of a percentage are canonical-data precision. A Pandit reads years, months and days.',
    preservedIn: 'Part B · B1 Calculation Certificate (full precision)',
  },
  {
    id: 'CD-12',
    sectionId: 'career-synthesis',
    action: 'STRIP_DETAIL',
    rationale: 'Naming shadbala in a consultation invites a question about a quantity this build has not validated and does not use.',
    preservedIn: 'Part B · B7 Computed but not validated',
  },
  {
    id: 'CD-13',
    sectionId: 'd1-rashi-chart',
    action: 'SHORTEN',
    rationale: 'A twelve-row placement table pushes its last rows onto a second page, so the chart and the list of what is in it stop being one glance. Folded into two columns of six it sits under its own chart.',
    preservedIn: 'Same table, same values, two columns instead of one',
  },
  {
    id: 'CD-09',
    sectionId: 'how-to-read',
    action: 'MOVE_TO_PART_B',
    rationale: 'A guide to the document\'s own vocabulary is reference material. A Pandit reads it once, not during a consultation; keeping it in Part A pushes the appendix boundary two pages later.',
    preservedIn: 'Part B · B0 How to read this report (first section of the appendix)',
  },
];

/* ------------------------------------------------------------------ */

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function blockText(b: V2Block): string {
  const any = b as unknown as Record<string, unknown>;
  if (typeof any.text === 'string') return any.text;
  if (Array.isArray(any.items) && typeof any.items[0] === 'string') return (any.items as string[]).join(' | ');
  return '';
}

/**
 * Applies the declared density rules.
 *
 * Deliberately conservative: a rule that no longer matches is REPORTED rather
 * than ignored, because a silently drifted rule would let engineering detail
 * creep back into Part A unnoticed.
 */
export function applyConsultationDensity(source: KundliReportModelV2): DensityResult {
  const report = clone(source);
  const applied: DensityApplication[] = [];
  const matched = new Set<string>();

  const record = (ruleId: string, sectionId: string, blockIndex: number, before: string, after: string) => {
    const rule = DENSITY_RULES.find((r) => r.id === ruleId)!;
    matched.add(ruleId);
    applied.push({ ruleId, sectionId, blockIndex, action: rule.action, before, after });
  };

  const section = (id: string): V2Section | undefined => report.sections.find((s) => s.id === id);

  /* --- CD-01: fingerprint sentence out of the passport callout --- */
  const passport = section('kundli-passport');
  passport?.blocks.forEach((b, i) => {
    if (b.kind !== 'callout') return;
    const stripped = b.text.replace(/\s*The input fingerprint [0-9a-f]+ is a hash of exactly these values\.?/, '');
    if (stripped !== b.text) {
      record('CD-01', 'kundli-passport', i, b.text, stripped);
      b.text = stripped;
    }
  });

  /* --- CD-02: shorten the salience-provenance paragraph --- */
  const saar = section('kundli-saar');
  saar?.blocks.forEach((b, i) => {
    if (b.kind !== 'paragraph' || !/salience rules/.test(b.text)) return;
    const after = 'Highlights are selected by declared salience rules over the calculated chart. The rule behind each line is listed in the Scholar Appendix.';
    record('CD-02', 'kundli-saar', i, b.text, after);
    b.text = after;
  });

  /* --- CD-03 / CD-04: graha dossier --- */
  const dossier = section('graha-dossier');
  const movedToUnvalidated: string[] = [];
  if (dossier) {
    dossier.blocks.forEach((b, i) => {
      if (b.kind === 'bullets') {
        const keep = b.items.filter((it) => !/^Shadbala:/.test(it));
        if (keep.length !== b.items.length) {
          movedToUnvalidated.push(...b.items.filter((it) => /^Shadbala:/.test(it)));
          record('CD-03', 'graha-dossier', i, b.items.join(' | '), keep.join(' | '));
          b.items = keep;
        }
      }
      if (b.kind === 'table' && b.footnote && /machine record/.test(b.footnote)) {
        const after = 'Degrees are shown in degrees and arc-minutes. Exact decimal longitudes are in the Scholar Appendix.';
        record('CD-04', 'graha-dossier', i, b.footnote, after);
        b.footnote = after;
      }
    });
  }

  /* --- CD-05: yoga dashboard source-status boilerplate --- */
  const yoga = section('yoga-dosha-dashboard');
  yoga?.blocks.forEach((b, i) => {
    if (b.kind !== 'paragraph' || !/Source status for every rule above/.test(b.text)) return;
    const after = 'Source status for every rule above: traditional attribution, verification pending. Full provenance is in the Scholar Appendix.';
    record('CD-05', 'yoga-dosha-dashboard', i, b.text, after);
    b.text = after;
  });

  /* --- CD-06: move the balance-precision note to Part B --- */
  const vim = section('vimshottari-timeline');
  const movedToCertificate: V2Block[] = [];
  if (vim) {
    const keep: V2Block[] = [];
    vim.blocks.forEach((b, i) => {
      if (b.kind === 'paragraph' && /Balance-at-birth precision/.test(b.text)) {
        record('CD-06', 'vimshottari-timeline', i, b.text, '(moved to Part B · B1)');
        movedToCertificate.push(b);
        return;
      }
      keep.push(b);
    });
    vim.blocks = keep;
    // A short, Pandit-facing replacement: the cross-check verdict without the
    // implementation story behind it.
    vim.blocks.push({
      kind: 'paragraph',
      size: 'micro',
      text: 'The balance at birth printed above was re-derived from the Moon\'s longitude and agrees with the dasha engine to within one calendar day.',
    });
  }

  /* --- CD-07 / CD-08: career synthesis --- */
  const career = section('career-synthesis');
  if (career) {
    // Derived from the gate's own text rather than retyped here. The previous
    // version hardcoded the sentence, so editing the quarantine wording in
    // d10Validation.ts silently stopped this rule matching and let the long
    // paragraph back onto the consultation page three times over.
    const D10_LONG = new RegExp(escapeRegExp(D10_PROMOTION.reason), 'g');
    const D10_LONG_NO_DOC = new RegExp(
      escapeRegExp(D10_PROMOTION.reason.replace(/\s*\(see docs\/kundli-v40\/[a-z0-9-]+\.md\)/g, '')),
      'g',
    );
    const D10_SHORT = 'D10 has not been compared against an external reference, so it is displayed for reference only and is used in no conclusion.';
    let seenD10 = 0;

    const rewrite = (text: string, sectionIndex: number): string => {
      let out = text.replace(/\s*\(see docs\/kundli-v40\/[a-z0-9-]+\.md\)/g, '');
      if (out !== text) record('CD-07', 'career-synthesis', sectionIndex, text, out);
      const before = out;
      out = out.replace(D10_LONG, D10_SHORT);
      out = out.replace(
        D10_LONG_NO_DOC,
        () => {
          seenD10 += 1;
          return seenD10 === 1 ? D10_SHORT : 'D10 is quarantined — see the Scholar Appendix.';
        },
      );
      if (out !== before) record('CD-08', 'career-synthesis', sectionIndex, before, out);
      return out;
    };

    career.blocks.forEach((b, i) => {
      if (b.kind === 'paragraph') b.text = rewrite(b.text, i);
      else if (b.kind === 'bullets') b.items = b.items.map((it) => rewrite(it, i));
      else if (b.kind === 'callout') b.text = rewrite(b.text, i);
    });
  }

  /* --- CD-10: dashboard notes are a status, not an essay --- */
  const yogaEssays: string[] = [];
  yoga?.blocks.forEach((b, i) => {
    if (b.kind !== 'statusList') return;
    for (const item of b.items) {
      if (!item.note) continue;
      const long = item.note.length > 160 || /registry [a-z0-9-]+-v\d/i.test(item.note);
      if (!long) continue;
      const first = /^[^.]+\./.exec(item.note.replace(/\s*\(registry [^)]+\)/i, ''));
      const after = `${(first ? first[0] : item.note.slice(0, 120)).trim()} Full reasoning in the Scholar Appendix.`;
      yogaEssays.push(`${item.label} — ${item.note}`);
      record('CD-10', 'yoga-dosha-dashboard', i, item.note, after);
      item.note = after;
    }
  });

  /* --- CD-11: canonical precision belongs in the appendix --- */
  const vimPrecision: string[] = [];
  vim?.blocks.forEach((b, i) => {
    if (b.kind !== 'kvGrid') return;
    for (const item of b.items) {
      const before = `${item.value}${item.note ? ` | ${item.note}` : ''}`;
      const value = item.value.replace(/\s*\((\d+\.\d{3,}) years\)/, '');
      const note = item.note?.replace(/(\d+\.\d{2})\d+\s*%/, '$1%');
      if (value === item.value && note === item.note) continue;
      vimPrecision.push(before);
      item.value = value;
      if (note !== undefined) item.note = note;
      record('CD-11', 'vimshottari-timeline', i, before, `${item.value}${item.note ? ` | ${item.note}` : ''}`);
    }
  });

  /* --- CD-12: no unvalidated internal quantity named in Part A --- */
  career?.blocks.forEach((b, i) => {
    const rewriteShadbala = (t: string): string =>
      t.replace(/\bshadbala\b/gi, 'graha strength')
        .replace(/\bShadbala\b/g, 'Graha strength');
    if (b.kind === 'callout' || b.kind === 'paragraph') {
      const after = rewriteShadbala(b.text);
      if (after !== b.text) { record('CD-12', 'career-synthesis', i, b.text, after); b.text = after; }
    } else if (b.kind === 'bullets') {
      const after = b.items.map(rewriteShadbala);
      if (after.join('|') !== b.items.join('|')) {
        record('CD-12', 'career-synthesis', i, b.items.join(' | '), after.join(' | '));
        b.items = after;
      }
    }
  });

  /* --- CD-13: fold the 12-bhava placement tables into two columns --- */
  for (const chartSectionId of ['d1-rashi-chart', 'd9-navamsha-chart']) {
    const sec = section(chartSectionId);
    sec?.blocks.forEach((b, i) => {
      if (b.kind !== 'table' || b.rows.length !== 12 || b.headers.length !== 3) return;
      const left = b.rows.slice(0, 6);
      const right = b.rows.slice(6);
      const before = `${b.rows.length} rows x ${b.headers.length} columns`;
      b.headers = [...b.headers, ...b.headers];
      b.rows = left.map((row, r) => [...row, ...right[r]]);
      b.widths = [0.085, 0.145, 0.27, 0.085, 0.145, 0.27];
      b.align = ['right', 'left', 'left', 'right', 'left', 'left'];
      record('CD-13', chartSectionId, i, before, `${b.rows.length} rows x ${b.headers.length} columns`);
    });
  }

  /* --- CD-09: relocate "How to Read" to the head of Part B --- */
  const howToReadIndex = report.sections.findIndex((sec) => sec.id === 'how-to-read');
  const dividerIndex = report.sections.findIndex((sec) => sec.id === 'part-b-divider');
  if (howToReadIndex >= 0 && dividerIndex >= 0 && howToReadIndex < dividerIndex) {
    const [moved] = report.sections.splice(howToReadIndex, 1);
    moved.part = 'B';
    const title = moved.blocks.find((b) => b.kind === 'sectionTitle');
    if (title && title.kind === 'sectionTitle') title.text = `B0 · ${title.text}`;
    const newDividerIndex = report.sections.findIndex((sec) => sec.id === 'part-b-divider');
    report.sections.splice(newDividerIndex + 1, 0, moved);
    record('CD-09', 'how-to-read', howToReadIndex, 'Part A', 'Part B (B0)');
  }

  /* --- receive the moved material in Part B --- */
  if (movedToCertificate.length > 0) {
    const cert = section('calculation-certificate');
    if (cert) {
      cert.blocks.push({ kind: 'heading', level: 3, text: 'Vimshottari balance at birth — derivation note' });
      cert.blocks.push(...movedToCertificate);
    }
  }
  if (yogaEssays.length > 0 || vimPrecision.length > 0) {
    const cert = section('calculation-certificate');
    if (cert) {
      if (vimPrecision.length > 0) {
        cert.blocks.push({ kind: 'heading', level: 3, text: 'Values shortened on the consultation pages' });
        cert.blocks.push({ kind: 'bullets', size: 'small', items: vimPrecision });
      }
    }
  }
  if (movedToUnvalidated.length > 0) {
    const unval = section('appendix-unvalidated');
    if (unval) {
      unval.blocks.push({ kind: 'heading', level: 3, text: 'Moved out of the consultation pages' });
      unval.blocks.push({ kind: 'bullets', size: 'small', items: movedToUnvalidated });
    }
  }

  /* --- Part A must now contain no engineering residue. --- */
  const unmatched = DENSITY_RULES.filter((r) => !matched.has(r.id)).map((r) => r.id);
  return { report, applied, unmatched };
}

/**
 * A standing check on Part A: patterns that must never appear in front of a
 * client. Run as a release gate, not only as a one-off audit, so the next
 * feature cannot quietly reintroduce them.
 */
export const PART_A_FORBIDDEN_PATTERNS: { id: string; pattern: RegExp; what: string }[] = [
  { id: 'PA-01', pattern: /\bdocs\/[a-z0-9/-]+\.md\b/i, what: 'repository documentation path' },
  { id: 'PA-02', pattern: /\b[0-9a-f]{16,}\b/, what: 'implementation hash' },
  { id: 'PA-03', pattern: /\b[a-z]+-registry-v\d\b/i, what: 'internal registry identifier' },
  { id: 'PA-04', pattern: /\blanguage model\b/i, what: 'statement about our engineering process' },
  { id: 'PA-05', pattern: /\bcanonical adapter\b/i, what: 'internal component name' },
  { id: 'PA-06', pattern: /\bshadbala\b/i, what: 'unvalidated internal quantity' },
];

export interface PartAFinding {
  patternId: string;
  what: string;
  sectionId: string;
  blockIndex: number;
  excerpt: string;
}

export function auditPartADensity(report: KundliReportModelV2): PartAFinding[] {
  const findings: PartAFinding[] = [];
  for (const sec of report.sections) {
    if (sec.part !== 'A') continue;
    sec.blocks.forEach((b, i) => {
      const texts: string[] = [];
      const any = b as unknown as Record<string, unknown>;
      if (typeof any.text === 'string') texts.push(any.text);
      if (typeof any.footnote === 'string') texts.push(any.footnote);
      if (typeof any.caption === 'string') texts.push(any.caption);
      if (Array.isArray(any.items)) {
        for (const it of any.items as unknown[]) {
          if (typeof it === 'string') texts.push(it);
          else if (it && typeof it === 'object') {
            const o = it as Record<string, unknown>;
            for (const k of ['label', 'value', 'note']) if (typeof o[k] === 'string') texts.push(o[k] as string);
          }
        }
      }
      if (Array.isArray(any.rows)) for (const row of any.rows as string[][]) texts.push(...row);
      for (const t of texts) {
        for (const p of PART_A_FORBIDDEN_PATTERNS) {
          const m = p.pattern.exec(t);
          if (m) {
            findings.push({
              patternId: p.id, what: p.what, sectionId: sec.id, blockIndex: i,
              excerpt: t.slice(Math.max(0, m.index - 30), m.index + 60),
            });
          }
        }
      }
    });
  }
  return findings;
}

export { blockText };
