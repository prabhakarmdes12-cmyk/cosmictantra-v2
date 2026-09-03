/**
 * WHY ENGINE — Sprint J (charter §17 + §18).
 *
 * §18: every consequential conclusion gets an evidence node supporting
 *   WHY? / SHOW CALCULATION / SHOW RULE / SHOW SOURCE /
 *   SHOW ALTERNATIVE TRADITION / SHOW VALIDATION STATUS
 * and an API capable of traversing the graph. This module is that API: it
 * walks EvidenceStore chains to root facts and attaches the registry record
 * (rule text, source status, alternatives, CT_INV_005 validation tier) of the
 * rule that produced each conclusion.
 *
 * §17: disagreement is REPRESENTED, never collapsed. A consensus is a count of
 * registered rule readings that agree with the adopted verdict — "k of n
 * registered readings recognize this condition" — and is NEVER converted to a
 * probability or percentage (explicit guard: the consensus type carries only
 * integer counts and a statement string; no percent exists anywhere).
 *
 * Honesty: rules without a registry cross-link produce calculation-only WHY
 * reports (rule/source/validation are absent, not invented).
 */

import type { EvidenceStore, EvidenceNode } from './evidenceGraph';
import { getClassicalRule, type ClassicalRule } from './ruleRegistry';
import { COMBUSTION_ORB_TABLE_V2 } from './relationshipEngine';

export const WHY_ENGINE_VERSION = 'why-engine-1.0.0 (sprint J)';

/* ------------------------------------------------------------------ */
/* §18 — WHY traversal                                                 */
/* ------------------------------------------------------------------ */

export interface WhyChainLink {
  id: string;
  subject: string;
  claim: string;
  sourceTag: string;
  value: unknown;
  depth: number;
}

export interface WhyReport {
  engineVersion: string;
  node: {
    id: string;
    subject: string;
    claim: string;
    basis: string;
    value: unknown;
    sourceTag: string;
  };
  /** WHY? — the full dependency chain from this conclusion to root facts. */
  chain: WhyChainLink[];
  /** Roots: chain nodes with no further dependencies (placements, lagna, panchanga). */
  roots: WhyChainLink[];
  /** SHOW CALCULATION — the conclusion value and the direct inputs it was computed from. */
  calculation: { conclusion: unknown; directInputs: Array<{ subject: string; claim: string; value: unknown }> };
  /** SHOW RULE / SOURCE / ALTERNATIVE TRADITION / VALIDATION STATUS — registry-backed. */
  rule?: { ruleId: string; name: string; adoptedInterpretation: string; version: string };
  source?: { source: string; sourceVerification: string; locator: string };
  alternativeTraditions?: string[];
  validationStatus?: string;
}

const MAX_CHAIN_DEPTH = 64;

export function explainNode(store: EvidenceStore, nodeId: string): WhyReport | null {
  const node = store.getNode(nodeId);
  if (!node) return null;
  const trace = store.traceDependencies(nodeId, MAX_CHAIN_DEPTH);
  const toLink = (n: EvidenceNode, depth: number): WhyChainLink => ({
    id: n.id,
    subject: n.subject,
    claim: n.claim,
    sourceTag: n.sourceTag,
    value: n.value,
    depth,
  });
  const chain = trace.nodes.map((n) => toLink(n, trace.depth.get(n.id) ?? 0));
  const roots = chain.filter((l) => (store.getNode(l.id)?.dependencies.length ?? 1) === 0);
  const directInputs = node.dependencies
    .map((d) => store.getNode(d))
    .filter((n): n is EvidenceNode => Boolean(n))
    .map((n) => ({ subject: n.subject, claim: n.claim, value: n.value }));

  const rule = node.ruleRef ? getClassicalRule(node.ruleRef.ruleId) : undefined;

  return {
    engineVersion: WHY_ENGINE_VERSION,
    node: {
      id: node.id,
      subject: node.subject,
      claim: node.claim,
      basis: node.basis,
      value: node.value,
      sourceTag: node.sourceTag,
    },
    chain,
    roots,
    calculation: { conclusion: node.value, directInputs },
    ...(rule
      ? {
          rule: { ruleId: rule.id, name: rule.englishName, adoptedInterpretation: rule.adoptedInterpretation, version: rule.version },
          source: { source: rule.source, sourceVerification: rule.sourceVerification, locator: rule.sourceLocator },
          alternativeTraditions: [...rule.alternateInterpretations],
          validationStatus: rule.validationStatus,
        }
      : {}),
  };
}

/** All conclusion (CONVENTION) nodes — the consequential claims of a snapshot. */
export function listConclusionNodes(store: EvidenceStore): EvidenceNode[] {
  return store.list().filter((n) => n.domain === 'CONVENTION');
}

/** Registry record accessor for tests/tools. */
export function registryRuleFor(ruleId: string): ClassicalRule | undefined {
  return getClassicalRule(ruleId);
}

/* ------------------------------------------------------------------ */
/* §17 — Tradition Consensus Engine                                    */
/* ------------------------------------------------------------------ */

export interface ConsensusReading {
  reading: string;
  isCombust: boolean;
}

export interface TraditionConsensus {
  subject: string;
  /** The engine's adopted verdict. */
  adoptedVerdict: boolean;
  /** How many registered readings (including the adopted one) agree. */
  agreeing: number;
  /** How many registered readings were evaluated (including the adopted one). */
  total: number;
  /** The per-reading verdicts (§17's Tradition A/B/C... rows). */
  readings: ConsensusReading[];
  /** §17-style statement. NEVER a probability. */
  statement: string;
  /** Explicit charter guard, carried on every consensus. */
  guard: 'RULE_AGREEMENT_NOT_PROBABILITY';
}

function combVerdict(separationDeg: number, orb: number): boolean {
  return separationDeg <= orb;
}

/**
 * Combustion consensus (RSK_002 made visible per chart): the adopted orb plus
 * every declared alternative orb from COMBUSTION_ORB_TABLE_V2, evaluated at
 * the actual separation. For non-retrograde bodies the retrograde orb columns
 * are not evaluated (a body cannot be both states at once).
 */
export function traditionConsensusForCombustion(
  planet: string,
  separationDeg: number | null,
  isRetrograde: boolean
): TraditionConsensus | null {
  const entry = COMBUSTION_ORB_TABLE_V2[planet];
  if (!entry) return null; // Sun/nodes: the rule does not apply — no consensus either.
  if (separationDeg === null || !Number.isFinite(separationDeg)) return null;
  const orb = isRetrograde ? entry.adopted.retrograde : entry.adopted.direct;
  const readings: ConsensusReading[] = [
    { reading: 'ADOPTED orb (COMBUSTION_ORB_TABLE_V2.adopted)', isCombust: combVerdict(separationDeg, orb) }
  ];
  for (let i = 0; i < entry.alternatives.length; i++) {
    const alt = entry.alternatives[i];
    readings.push({
      reading: `ALTERNATIVE[${i}]: ${alt.statement.slice(0, 120)}`,
      isCombust: combVerdict(separationDeg, isRetrograde ? alt.retrograde : alt.direct)
    });
  }
  const adoptedVerdict = readings[0].isCombust;
  const agreeing = readings.filter((r) => r.isCombust === adoptedVerdict).length;
  return {
    subject: `combustion:${planet}`,
    adoptedVerdict,
    agreeing,
    total: readings.length,
    readings,
    statement: `${agreeing} of ${readings.length} registered readings ${adoptedVerdict ? 'recognize' : 'do not recognize'} combustion for ${planet} at ${separationDeg.toFixed(2)} deg separation.`,
    guard: 'RULE_AGREEMENT_NOT_PROBABILITY'
  };
}

const SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

/**
 * Kalsarpa consensus over the ADOPTED variant + the four DECLARED alternative
 * readings, computed from raw rashis. Boundary-rashi placements keep the
 * INDETERMINATE semantics of the adopted reading; alternatives that cannot
 * decide a chart agree only when they land on the same verdict as the
 * adopted reading (never forced).
 */
export function traditionConsensusForKalsarpa(
  grahaRashis: Record<string, number>,
  rahuRashiId: number,
  ketuRashiId: number
): TraditionConsensus | null {
  if (!rahuRashiId || !ketuRashiId) return null;
  if (ketuRashiId !== (((rahuRashiId - 1 + 6) % 12) + 1)) return null; // inconsistent axis: no consensus

  const offsetsOf = (counted: string[]): Array<number | null> =>
    counted.map((g) => {
      const r = grahaRashis[g] ?? 0;
      return r ? ((r - 1 - (rahuRashiId - 1) + 12) % 12) : null;
    });

  type Verdict = 'PRESENT' | 'ABSENT' | 'INDETERMINATE';
  const adopted: Verdict = (() => {
    const os = offsetsOf([...SEVEN]);
    if (os.some((o) => o === null)) return 'INDETERMINATE';
    if (os.some((o) => o === 0 || o === 6)) return 'INDETERMINATE';
    if (os.every((o) => (o as number) < 6) || os.every((o) => (o as number) > 6)) return 'PRESENT';
    return 'ABSENT';
  })();
  const directionQualified: Verdict = (() => {
    const os = offsetsOf([...SEVEN]);
    if (os.some((o) => o === null)) return 'INDETERMINATE';
    if (os.some((o) => o === 0 || o === 6)) return 'INDETERMINATE';
    return os.every((o) => (o as number) < 6) ? 'PRESENT' : 'ABSENT';
  })();
  const boundaryInclusive: Verdict = (() => {
    const os = offsetsOf([...SEVEN]);
    if (os.some((o) => o === null)) return 'INDETERMINATE';
    return os.every((o) => (o as number) <= 6) || os.every((o) => (o as number) >= 6) ? 'PRESENT' : 'ABSENT';
  })();
  const moonExcluded: Verdict = (() => {
    const counted = SEVEN.filter((g) => g !== 'Moon');
    const os = offsetsOf([...counted]);
    if (os.some((o) => o === null)) return 'INDETERMINATE';
    if (os.some((o) => o === 0 || o === 6)) return 'INDETERMINATE';
    if (os.every((o) => (o as number) < 6) || os.every((o) => (o as number) > 6)) return 'PRESENT';
    return 'ABSENT';
  })();
  // Kala Amrita names the mirrored arc; containment is symmetric, so the
  // verdict structure matches the adopted reading.
  const kalaAmrita: Verdict = adopted;

  const rows: Array<{ reading: string; verdict: Verdict }> = [
    { reading: 'ADOPTED: one-hemisphere node axis (either arc, boundary INDETERMINATE, Moon counted)', verdict: adopted },
    { reading: 'ALTERNATIVE: direction-qualified (only the Rahu-to-Ketu arc qualifies)', verdict: directionQualified },
    { reading: 'ALTERNATIVE: boundary-inclusive (node-rashi grahas count inside)', verdict: boundaryInclusive },
    { reading: 'ALTERNATIVE: Moon excluded from the counted grahas', verdict: moonExcluded },
    { reading: 'ALTERNATIVE: Kala Amrita (mirrored naming, same containment)', verdict: kalaAmrita }
  ];
  const agreeing = rows.filter((r) => r.verdict === adopted).length;
  return {
    subject: 'kalsarpa',
    adoptedVerdict: adopted === 'PRESENT',
    agreeing,
    total: rows.length,
    readings: rows.map((r) => ({ reading: `${r.reading} — ${r.verdict}`, isCombust: r.verdict === 'PRESENT' })),
    statement: `${agreeing} of ${rows.length} registered readings return ${adopted} for this chart under the registered Kalsarpa variant set.`,
    guard: 'RULE_AGREEMENT_NOT_PROBABILITY'
  };
}
