/**
 * KUNDLI V41 §3 — HINDI_LOCALIZATION_COMPLETENESS.
 *
 * Scans Part A of a rendered report model for user-visible English and reports
 * what is left. §2 promises that a `hi` report is "all user-visible content in
 * Hindi except unavoidable appendix identifiers"; this is the thing that keeps
 * that promise honest once the humans stop looking.
 *
 * DESIGN NOTES
 * ------------
 * 1. It walks *named visible fields per block kind*, never `JSON.stringify`.
 *    An earlier throwaway probe stringified blocks and drowned in false
 *    positives — `left`, `right`, `hero`, `NORTH_INDIAN`, `chart-model-v1`,
 *    `planets.Mars` are all real strings inside a chart render model and none
 *    of them is ever printed. A gate that cries wolf gets switched off.
 *
 * 2. §3 exempts appendix identifiers, and there are a few more things that are
 *    correctly Latin in a Hindi document: the person's own name, a place name,
 *    the report ID, an IANA timezone, degrees, dates, and the division tags
 *    D1/D9/D10 which are read as symbols rather than words. `EXEMPTIONS`
 *    states each one with its reason, because an unexplained exemption is
 *    indistinguishable from a bug.
 *
 * 3. It reports a *budget* rather than demanding zero. Part A still contains
 *    sentences assembled at runtime by the derivation layer, which a
 *    dictionary cannot reach (see `prosePassages.PROSE_COVERAGE`). Failing the
 *    build today would mean deleting the gate tomorrow. Instead the budget
 *    ratchets: the number may fall, never rise, and the spec that pins it is
 *    the thing a future change has to argue with.
 */
import type { KundliReportModelV2, V2Block, V2Section } from './reportBlocks';

export const HINDI_COMPLETENESS_GATE = 'HINDI_LOCALIZATION_COMPLETENESS';

/** A user-visible string that still reads as English. */
export interface UntranslatedFinding {
  sectionId: string;
  blockKind: V2Block['kind'];
  field: string;
  text: string;
  latinWords: number;
}

export interface HindiCompletenessReport {
  gate: typeof HINDI_COMPLETENESS_GATE;
  locale: string;
  /** Distinct visible strings inspected in Part A. */
  inspected: number;
  /** Strings that are entirely Hindi (or contain no Latin words at all). */
  clean: number;
  /** Strings exempted, with the reason keyed by `EXEMPTIONS`. */
  exempt: number;
  findings: UntranslatedFinding[];
  /** Total Latin words across `findings` — the number that must trend to 0. */
  latinWords: number;
  ok: boolean;
  budget: number;
}

/**
 * Things that are legitimately Latin inside a Hindi Kundli.
 * Each entry is a predicate plus the reason it is allowed to exist.
 */
const EXEMPTIONS: { why: string; test: (s: string) => boolean }[] = [
  {
    why: 'appendix cross-reference — §3 exempts appendix identifiers',
    test: (s) => /^See Appendix\b/i.test(s.trim()) || /^[AB]\d{1,2}\./.test(s.trim()),
  },
  {
    why: 'report / evidence identifier',
    test: (s) => /^CT-KUNDLI-[0-9A-F]+$/i.test(s.trim()) || /^[a-z]+-[a-z0-9-]+-v\d+$/i.test(s.trim()),
  },
  {
    why: 'varga tag read as a symbol, not a word (D1, D9, D10, D60)',
    test: (s) => /^D\d{1,2}$/.test(s.trim()),
  },
  {
    why: 'IANA timezone, which is a machine identifier and is never translated',
    test: (s) => /\b[A-Za-z]+\/[A-Za-z_]+\b/.test(s) && /UTC[+-]/.test(s),
  },
  {
    why: 'ayanamsha name — a proper noun of the tradition, kept in the roman form the literature uses',
    test: (s) => /^Lahiri\b/.test(s.trim()),
  },
];

/**
 * Proper nouns supplied by the user or the brand. These are data, not
 * vocabulary: translating a person's name would be a defect, not a feature.
 */
function properNouns(report: KundliReportModelV2): string[] {
  const names = ['CosmicTantra'];
  const cover = report.sections
    .flatMap((s) => s.blocks)
    .find((b) => b.kind === 'cover');
  if (cover && cover.kind === 'cover') {
    names.push(cover.subjectName);
    // Birth lines carry the place and the civil date; both are data.
    for (const line of cover.birthLines) names.push(line);
  }
  return names.filter((n) => n.length > 0);
}

/** Every string a reader can actually see in this block, with its field name. */
function visibleStrings(block: V2Block): { field: string; text: string }[] {
  const out: { field: string; text: string }[] = [];
  const add = (field: string, text?: string | null) => {
    if (typeof text === 'string' && text.trim().length > 0) out.push({ field, text });
  };

  switch (block.kind) {
    case 'sectionTitle':
      add('text', block.text); add('secondary', block.secondary); add('tag', block.tag);
      break;
    case 'heading':
      add('text', block.text);
      break;
    case 'paragraph':
      add('text', block.text);
      break;
    case 'bullets':
      block.items.forEach((t, i) => add(`items[${i}]`, t));
      break;
    case 'callout':
      add('title', block.title); add('text', block.text);
      break;
    case 'kvGrid':
      add('title', block.title);
      block.items.forEach((it, i) => {
        add(`items[${i}].label`, it.label);
        add(`items[${i}].value`, it.value);
        add(`items[${i}].note`, it.note);
      });
      break;
    case 'table':
      add('caption', block.caption);
      block.headers.forEach((h, i) => add(`headers[${i}]`, h));
      block.rows.forEach((row, r) => row.forEach((c, i) => add(`rows[${r}][${i}]`, c)));
      add('footnote', block.footnote);
      break;
    case 'statusList':
      add('title', block.title);
      block.items.forEach((it, i) => {
        add(`items[${i}].label`, it.label);
        add(`items[${i}].statusText`, it.statusText);
        add(`items[${i}].note`, it.note);
        add(`items[${i}].xref`, it.xref);
      });
      break;
    case 'chart':
      // Deliberately NOT block.data: the chart render model is full of
      // internal enums the renderer consumes and never prints.
      add('caption', block.caption);
      (block.sideFacts ?? []).forEach((f, i) => {
        add(`sideFacts[${i}].label`, f.label);
        add(`sideFacts[${i}].value`, f.value);
      });
      break;
    case 'timeline':
      add('caption', block.caption);
      break;
    case 'notesArea':
      add('title', block.title);
      break;
    case 'partDivider':
      add('title', block.title); add('subtitle', block.subtitle);
      (block.contents ?? []).forEach((c, i) => add(`contents[${i}]`, c));
      break;
    default:
      break;
  }
  return out;
}

export function auditHindiCompleteness(
  report: KundliReportModelV2,
  locale: string,
  budget: number,
): HindiCompletenessReport {
  const nouns = properNouns(report);
  const findings: UntranslatedFinding[] = [];
  let inspected = 0;
  let clean = 0;
  let exempt = 0;

  const partA: V2Section[] = report.sections.filter((s) => s.part === 'A');

  for (const section of partA) {
    for (const block of section.blocks) {
      for (const { field, text } of visibleStrings(block)) {
        inspected += 1;

        // Strip proper nouns before judging. A subject's own name inside a
        // sentence must not make the sentence look untranslated, and removing
        // it must not hide the English around it either.
        let probe = text;
        for (const n of nouns) probe = probe.split(n).join(' ');

        // Clean first: a string with no Latin word at all is translated, not
        // exempted. Booking it as an exemption made `clean` permanently 0 and
        // hid whether the walker was finding Hindi at all.
        const latin = (probe.match(/[A-Za-z]{2,}/g) ?? []).length;
        if (latin === 0) { clean += 1; continue; }

        if (EXEMPTIONS.some((e) => e.test(probe))) { exempt += 1; continue; }

        findings.push({
          sectionId: section.id,
          blockKind: block.kind,
          field,
          text: text.length > 140 ? `${text.slice(0, 137)}...` : text,
          latinWords: latin,
        });
      }
    }
  }

  const latinWords = findings.reduce((n, f) => n + f.latinWords, 0);
  return {
    gate: HINDI_COMPLETENESS_GATE,
    locale,
    inspected,
    clean,
    exempt,
    findings,
    latinWords,
    budget,
    ok: latinWords <= budget,
  };
}

/**
 * The ratchet.
 *
 * These are the measured Latin-word counts in Part A for a Hindi report, and
 * they are a CEILING. Lower them whenever work lands; never raise them. What
 * remains is dominated by sentences the derivation layer assembles at runtime
 * (see `prosePassages.PROSE_COVERAGE.generatedTemplateOwners`), which need
 * parameterised message templates rather than dictionary entries.
 */
export const HINDI_BUDGET: Record<string, number> = {
  CLIENT: 1115,
  PANDIT: 1816,
  SCHOLAR: 1816,
};

/**
 * Share of Part A strings that must come out fully Hindi. Measured at 0.73 for
 * `hi` against 0.23 for `en`, so this is a floor with a little headroom, not a
 * restatement of today's number.
 */
export const HINDI_CLEAN_FLOOR = 0.70;
