/**
 * KASHI ORCHESTRATOR (PROGRAM 12 / TRUST-05)
 * ==========================================
 * Kashi answers questions about a Kundli. It is an ORCHESTRATOR, not an
 * astrologer:
 *   - It MUST NOT calculate astrology itself. It only queries the evidence graph
 *     (calculated facts) built from the canonical snapshot.
 *   - Every answer follows: RETRIEVAL PLAN → EVIDENCE (cited #1..n) → RULES →
 *     SYNTHESIS, and labels each part as Calculated fact / Interpretation /
 *     Synthesis / Uncertainty with a confidence level.
 *   - It exposes "Why am I saying this?" — the exact evidence + rules behind the
 *     answer.
 *   - When the graph has no supporting evidence for the question, it returns
 *     INSUFFICIENT_CALCULATION_EVIDENCE. It NEVER hallucinates astrology.
 *
 * This is deterministic and offline — no LLM is required to produce a grounded,
 * cited answer. (An LLM may later phrase the synthesis, but only over this
 * evidence, never inventing facts.)
 */

import { buildEvidenceGraph, queryEvidence } from './evidenceGraph.js';

export const ANSWER_KIND = {
  CALCULATED_FACT: 'Calculated fact',
  INTERPRETATION: 'Interpretation',
  SYNTHESIS: 'Synthesis',
  UNCERTAINTY: 'Uncertainty',
};

export const CONFIDENCE = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };

export const INSUFFICIENT_CALCULATION_EVIDENCE = 'INSUFFICIENT_CALCULATION_EVIDENCE';

// Topic → keywords used to build the retrieval plan from a natural question.
const TOPIC_KEYWORDS = {
  career: ['house10', 'career', 'saturn', 'sun', 'mercury', 'jupiter', 'dasha', 'amatyakaraka'],
  marriage: ['house7', 'venus', 'jupiter', 'moon', 'marriage', 'spouse', 'mangal', 'kuja'],
  wealth: ['house2', 'house11', 'jupiter', 'venus', 'mercury', 'wealth', 'dhana'],
  health: ['lagna', 'house6', 'house8', 'moon', 'saturn', 'mars', 'health'],
  education: ['house4', 'house5', 'mercury', 'jupiter', 'education'],
  timing: ['dasha', 'timing', 'period'],
  personality: ['lagna', 'moon', 'sun', 'self', 'ascendant', 'mind'],
  strength: ['dignity', 'strength'],
};

/** Derive a retrieval plan (topics + keyword set) from a question string. */
export function planRetrieval(question) {
  const q = String(question || '').toLowerCase();
  const topics = [];
  for (const [topic, kws] of Object.entries(TOPIC_KEYWORDS)) {
    if (q.includes(topic) || kws.some((k) => q.includes(k))) topics.push(topic);
  }
  // Also pick up explicit planet/house mentions.
  const planetMentions = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'].filter((p) => q.includes(p));
  const houseMentions = (q.match(/house\s*(\d{1,2})/g) || []).map((m) => 'house' + m.replace(/\D/g, ''));

  if (topics.length === 0 && planetMentions.length === 0 && houseMentions.length === 0) {
    topics.push('personality'); // default lens
  }
  const keywords = [...new Set([...topics.flatMap((t) => TOPIC_KEYWORDS[t] || [t]), ...planetMentions, ...houseMentions])];
  return { question, topics, planetMentions, houseMentions, keywords };
}

/**
 * Answer a question about a chart, grounded entirely in the evidence graph.
 * @param {object} pro professionalChart facade
 * @param {string} question
 */
export function askKashi(pro, question) {
  const graph = buildEvidenceGraph(pro);
  const plan = planRetrieval(question);
  const evidence = queryEvidence(graph, plan.keywords);

  if (evidence.length === 0) {
    return {
      question,
      status: INSUFFICIENT_CALCULATION_EVIDENCE,
      retrievalPlan: plan,
      evidence: [],
      rules: [],
      answer: null,
      message: 'I don\'t have calculated evidence for this question in the chart. I will not guess. Try asking about the ascendant, a specific planet or house, dashas, or a life area (career, marriage, wealth, health).',
      confidence: CONFIDENCE.LOW,
    };
  }

  // Cite evidence #1..n
  const cited = evidence.map((e, i) => ({ ref: i + 1, ...e, kind: ANSWER_KIND.CALCULATED_FACT }));

  // Rules: name the classical principle behind each topic (traceable, not prose).
  const rules = buildRules(plan.topics, cited);

  // Synthesis: derived strictly from cited evidence + named rules.
  const synthesis = buildSynthesis(plan, cited, rules);

  return {
    question,
    status: 'OK',
    retrievalPlan: plan,
    evidence: cited,
    rules,
    answer: {
      kind: ANSWER_KIND.SYNTHESIS,
      text: synthesis.text,
      basedOn: synthesis.basedOn, // evidence refs used
    },
    // "Why am I saying this?" — the audit trail.
    why: {
      evidenceRefs: cited.map((c) => ({ ref: c.ref, statement: c.statement, source: c.source })),
      rules: rules.map((r) => ({ principle: r.principle, source: r.source })),
    },
    confidence: cited.length >= 3 ? CONFIDENCE.MEDIUM : CONFIDENCE.LOW,
  };
}

const TOPIC_RULES = {
  career: { principle: 'The 10th house (karma bhava), its lord, and planets influencing it — plus the D10 — govern profession.', source: 'BPHS, Karma bhava' },
  marriage: { principle: 'The 7th house, its lord, Venus (kalatra karaka) and the D9 govern marriage.', source: 'BPHS, Kalatra' },
  wealth: { principle: 'The 2nd and 11th houses and their lords govern accumulation and gains.', source: 'BPHS, Dhana yogas' },
  health: { principle: 'The Lagna, 6th and 8th houses, and the Moon govern constitution and health.', source: 'BPHS' },
  education: { principle: 'The 4th and 5th houses, Mercury and Jupiter govern learning.', source: 'BPHS' },
  timing: { principle: 'The running Vimshottari dasha lord activates the houses it owns, occupies and aspects.', source: 'BPHS, Dasha' },
  personality: { principle: 'The Lagna and its lord, with the Moon and Sun, describe temperament and self.', source: 'BPHS, Lagna' },
  strength: { principle: 'A planet in exaltation/own sign is positionally strong; in debilitation/enemy sign it is weak.', source: 'BPHS, Bala' },
};

function buildRules(topics, cited) {
  const rules = topics.map((t) => TOPIC_RULES[t]).filter(Boolean);
  return rules.length ? rules : [TOPIC_RULES.personality];
}

function buildSynthesis(plan, cited, rules) {
  const refs = cited.slice(0, 5).map((c) => c.ref);
  const facts = cited.slice(0, 5).map((c) => `${c.statement} [#${c.ref}]`).join('; ');
  const ruleText = rules.map((r) => r.principle).join(' ');
  const topicLabel = plan.topics.join(', ') || 'this question';
  return {
    text: `Regarding ${topicLabel}: based on the calculated evidence (${facts}) and the principle that ${ruleText} — the chart's relevant factors are as cited above. This synthesis draws only on those evidence items; where the chart is silent, no claim is made.`,
    basedOn: refs,
  };
}

export default { ANSWER_KIND, CONFIDENCE, INSUFFICIENT_CALCULATION_EVIDENCE, planRetrieval, askKashi };
