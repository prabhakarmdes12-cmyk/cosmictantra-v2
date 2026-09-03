/**
 * Builds qualification/fixtures/yoga-fixtures.json (YOGA_CATALOG_001).
 * Deterministic: no timestamps, content-derived values only. Run:
 *   npx tsx tools/build-yoga-fixtures.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { YOGA_RULE_IDS, YOGA_SOURCE_REGISTRY_VERSION } from '../src/lib/jyotish/yogaEngine';
import { classicalRuleRegistryFingerprint, listClassicalRules, CLASSICAL_RULE_REGISTRY_VERSION } from '../src/lib/jyotish/ruleRegistry';
import { DOSHA_ENGINE_VERSION } from '../src/lib/jyotish/doshaEngine';

const yogaIds = [...YOGA_RULE_IDS].sort();
const rules = listClassicalRules();

const core = {
  yogaEngineCatalogVersion: YOGA_SOURCE_REGISTRY_VERSION,
  doshaEngineVersion: DOSHA_ENGINE_VERSION,
  ruleRegistryVersion: CLASSICAL_RULE_REGISTRY_VERSION,
  ruleRegistryFingerprint: classicalRuleRegistryFingerprint(),
  yogaRuleCount: yogaIds.length,
  yogaRuleIds: yogaIds,
  registryRuleCount: rules.length,
  kalsarpaVariant: 'ONE_HEMISPHERE_NODE_AXIS',
  kalsarpaAlternativesDeclared: 4
};

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(v as Record<string, unknown>).sort()
    .map((k) => JSON.stringify(k) + ':' + stableStringify((v as Record<string, unknown>)[k]))
    .join(',') + '}';
}

const setSha256 = crypto.createHash('sha256').update(stableStringify(core)).digest('hex');
const fixture = {
  fixtureSetId: 'YOGA_CATALOG_001',
  builder: 'yoga-qualification-runner-1.0.0 (sprint I)',
  engineNote: 'catalog is in-code; the fixture pins catalog ids and registry fingerprint for tamper evidence',
  ...core,
  setSha256
};

const out = path.join(__dirname, '..', 'qualification', 'fixtures', 'yoga-fixtures.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(fixture, null, 2) + '\n');
console.log(`wrote ${out} sha256=${setSha256} yogaRules=${yogaIds.length} registryRules=${rules.length}`);
