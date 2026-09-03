/**
 * Builds qualification/fixtures/rule-registry-fixtures.json (COMBUSTION_RULE_REGISTRY_001).
 * Deterministic: no timestamps, content-derived values only. Run:
 *   npx tsx tools/build-rule-registry-fixtures.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  listClassicalRules,
  classicalRuleRegistryFingerprint,
  CLASSICAL_RULE_REGISTRY_VERSION
} from '../src/lib/jyotish/ruleRegistry';
import { COMBUSTION_ORB_TABLE_V2, COMBUSTION_BORDERLINE_BAND_DEG } from '../src/lib/jyotish/relationshipEngine';
import { YOGA_SOURCE_REGISTRY, YOGA_SOURCE_REGISTRY_VERSION } from '../src/lib/jyotish/yogaSourceRegistry';

const rules = listClassicalRules();

const core = {
  registryVersion: CLASSICAL_RULE_REGISTRY_VERSION,
  fingerprint: classicalRuleRegistryFingerprint(),
  ruleCount: rules.length,
  yogaCrossLinkCount: Object.keys(YOGA_SOURCE_REGISTRY).length,
  yogaSourceRegistryVersion: YOGA_SOURCE_REGISTRY_VERSION,
  borderlineBandDeg: COMBUSTION_BORDERLINE_BAND_DEG,
  combustionOrbTable: Object.fromEntries(
    Object.entries(COMBUSTION_ORB_TABLE_V2).map(([planet, e]) => [
      planet,
      {
        adopted: e.adopted,
        alternativeCount: e.alternatives.length,
        alternativeOrbs: e.alternatives.map((a) => ({ direct: a.direct, retrograde: a.retrograde })),
        sourceStatus: e.sourceStatus,
        locator: e.locator
      }
    ])
  ),
  rules: rules.map((r) => ({
    id: r.id,
    version: r.version,
    category: r.category,
    tradition: r.tradition,
    sourceVerification: r.sourceVerification,
    validationStatus: r.validationStatus,
    adoption: r.adoption,
    evaluator: r.evaluator,
    evidencePathCount: r.evidencePaths.length
  }))
};

/** Key-sorted recursive stringify: hashing is independent of object key order. */
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(v as Record<string, unknown>).sort()
    .map((k) => JSON.stringify(k) + ':' + stableStringify((v as Record<string, unknown>)[k]))
    .join(',') + '}';
}

const setSha256 = crypto.createHash('sha256').update(stableStringify(core)).digest('hex');
const fixture = {
  fixtureSetId: 'COMBUSTION_RULE_REGISTRY_001',
  builder: 'rule-registry-qualification-runner-1.0.0 (sprint H)',
  engineNote: 'ruleRegistry is in-code; the fixture pins its content fingerprint and orb tables for tamper evidence',
  ...core,
  setSha256
};

const out = path.join(__dirname, '..', 'qualification', 'fixtures', 'rule-registry-fixtures.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(fixture, null, 2) + '\n');
console.log(`wrote ${out} sha256=${setSha256} rules=${rules.length}`);
