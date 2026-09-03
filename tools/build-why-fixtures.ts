/**
 * Builds qualification/fixtures/why-graph-fixtures.json (WHY_GRAPH_001).
 * Deterministic: no timestamps, content-derived values only. Run:
 *   npx tsx tools/build-why-fixtures.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { WHY_ENGINE_VERSION } from '../src/lib/jyotish/whyEngine';
import { EVIDENCE_DOMAINS } from '../src/lib/jyotish/evidenceGraph';
import { YOGA_RULE_IDS } from '../src/lib/jyotish/yogaEngine';
import { classicalRuleRegistryFingerprint, CLASSICAL_RULE_REGISTRY_VERSION } from '../src/lib/jyotish/ruleRegistry';
import { COMBUSTION_ORB_TABLE_V2 } from '../src/lib/jyotish/relationshipEngine';

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(v as Record<string, unknown>).sort()
    .map((k) => JSON.stringify(k) + ':' + stableStringify((v as Record<string, unknown>)[k]))
    .join(',') + '}';
}

const core = {
  whyEngineVersion: WHY_ENGINE_VERSION,
  ruleRegistryVersion: CLASSICAL_RULE_REGISTRY_VERSION,
  ruleRegistryFingerprint: classicalRuleRegistryFingerprint(),
  domains: [...EVIDENCE_DOMAINS],
  yogaRuleCount: YOGA_RULE_IDS.length,
  combustionTrackedPlanets: Object.keys(COMBUSTION_ORB_TABLE_V2).sort(),
  conclusionsPerChart: YOGA_RULE_IDS.length + 9 + 5, // yoga + combustion(all 9 rows) + sadeSati/kalsarpa/manglik/rajYogas/avakhada
  whyCapabilities: ['WHY', 'SHOW_CALCULATION', 'SHOW_RULE', 'SHOW_SOURCE', 'SHOW_ALTERNATIVE_TRADITION', 'SHOW_VALIDATION_STATUS'],
  kalsarpaConsensusReadings: 5
};

const setSha256 = crypto.createHash('sha256').update(stableStringify(core)).digest('hex');
const fixture = {
  fixtureSetId: 'WHY_GRAPH_001',
  builder: 'why-qualification-runner-1.0.0 (sprint J)',
  engineNote: 'the graph is content-addressed per snapshot; the fixture pins capability sets and registry pins',
  ...core,
  setSha256
};

const out = path.join(__dirname, '..', 'qualification', 'fixtures', 'why-graph-fixtures.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(fixture, null, 2) + '\n');
console.log(`wrote ${out} sha256=${setSha256}`);
