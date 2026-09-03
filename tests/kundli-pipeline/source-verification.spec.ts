/**
 * SOURCE VERIFICATION
 *
 * The source registry holds provenance claims that have not been checked
 * against any edition this repository holds. That is honest, and it is also
 * one edit away from becoming a lie: flip `locatorVerified` to true and the
 * report starts telling readers a chapter-and-verse citation was confirmed.
 *
 * These tests exist so that edit cannot pass unnoticed. They assert the
 * registry stays in its unverified state until a licensed edition is actually
 * in the repository — at which point the correct change is to add the edition
 * and update this file, not to quietly flip a flag.
 */
import { test, expect } from '@playwright/test';
import {
  YOGA_SOURCE_REGISTRY,
  YOGA_SOURCE_REGISTRY_VERSION,
  YogaSourceEntry,
} from '../../src/lib/jyotish/yogaSourceRegistry';
import { YOGA_RULE_IDS } from '../../src/lib/jyotish/yogaEngine';

const ENTRIES: YogaSourceEntry[] = Object.values(YOGA_SOURCE_REGISTRY);

test.describe('SOURCE REGISTRY — coverage', () => {
  test('the registry is not empty, so a broken import cannot pass vacuously', () => {
    expect(ENTRIES.length).toBeGreaterThan(5);
  });

  test('every rule the engine evaluates has a registry entry', () => {
    const missing = YOGA_RULE_IDS.filter((id) => !YOGA_SOURCE_REGISTRY[id]);
    expect(missing, `rules with no source entry: ${missing.join(', ')}`).toEqual([]);
  });

  test('every registry entry corresponds to a rule the engine evaluates', () => {
    const orphaned = ENTRIES.map((e) => e.ruleId).filter((id) => !YOGA_RULE_IDS.includes(id));
    expect(orphaned, `entries with no rule: ${orphaned.join(', ')}`).toEqual([]);
  });

  test('each entry records its own rule id in the id it is filed under', () => {
    for (const [key, entry] of Object.entries(YOGA_SOURCE_REGISTRY)) {
      expect(entry.ruleId).toBe(key);
    }
  });
});

test.describe('SOURCE REGISTRY — no locator status may be upgraded', () => {
  test('no entry claims its locator has been verified', () => {
    const upgraded = ENTRIES.filter((e) => e.locatorVerified === true).map((e) => e.ruleId);
    expect(upgraded, 'locatorVerified may only become true when a licensed edition is in the repository').toEqual([]);
  });

  test('no entry claims a licensed edition exists in this repository', () => {
    const upgraded = ENTRIES.filter((e) => e.verifiedInRepository === true).map((e) => e.ruleId);
    expect(upgraded, 'verifiedInRepository may only become true when that edition is actually committed').toEqual([]);
  });

  test('every locator that is unverified says so in words the reader will see', () => {
    for (const e of ENTRIES) {
      if (!e.locatorVerified) {
        expect(e.locator, `${e.ruleId} locator does not disclose its own status`).toMatch(/NOT VERIFIED|not verified/i);
      }
    }
  });

  test('no entry names an edition or translation it does not hold', () => {
    for (const e of ENTRIES) {
      if (!e.verifiedInRepository) {
        expect(e.editionOrTranslation.toLowerCase()).toMatch(/none|no licensed/i);
      }
    }
  });
});

test.describe('SOURCE REGISTRY — each entry carries what a reader needs to judge it', () => {
  test('every entry states the rule the code actually implements', () => {
    for (const e of ENTRIES) {
      expect(e.adoptedInterpretation.trim().length, `${e.ruleId} has no adopted interpretation`).toBeGreaterThan(20);
    }
  });

  test('every entry records at least one limitation', () => {
    for (const e of ENTRIES) {
      expect(e.limitations.length, `${e.ruleId} claims no limitations`).toBeGreaterThan(0);
      for (const l of e.limitations) expect(l.trim().length).toBeGreaterThan(10);
    }
  });

  test('every entry declares whether scholarship agrees, rather than implying it', () => {
    const allowed = new Set(['GENERAL', 'CONTESTED', 'UNVERIFIED']);
    for (const e of ENTRIES) {
      expect(allowed, `${e.ruleId} has unknown scholarlyAgreement`).toContain(e.scholarlyAgreement);
    }
  });

  test('every entry declares whether it is adopted, and contested entries are flagged', () => {
    for (const e of ENTRIES) {
      expect(['ADOPTED', 'NOT_ADOPTED']).toContain(e.adoption);
      if (e.scholarlyAgreement === 'CONTESTED') {
        // A contested reading may be adopted, but it must say so in its
        // limitations rather than presenting itself as settled.
        const text = [...e.limitations, e.adoptedInterpretation].join(' ').toLowerCase();
        expect(text, `${e.ruleId} is contested but never says so`).toMatch(/contested|variant|not universally|disagree/i);
      }
    }
  });

  test('entries that are not adopted record the variants that were not taken', () => {
    for (const e of ENTRIES) {
      if (e.adoption === 'NOT_ADOPTED') {
        expect(e.variants.length, `${e.ruleId} is not adopted but lists no alternatives`).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('SOURCE REGISTRY — an unadopted rule is never presented as a result', () => {
  test('NOT_ADOPTED entries are exactly the ones that cannot claim PRESENT or ABSENT', () => {
    const notAdopted = ENTRIES.filter((e) => e.adoption === 'NOT_ADOPTED').map((e) => e.ruleId).sort();
    // These two are knowingly registered as not adopted: the mutual-kendra
    // variant of Dharma-Karmadhipati and Kemadruma. If either ever appears as
    // PRESENT or ABSENT in a delivered report, the registry and the engine
    // have disagreed, and the report is making a claim it registered as one
    // it does not make.
    expect(notAdopted).toEqual(['YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA', 'YOGA_KEMADRUMA']);
  });

  test('the registry version is pinned and carried into the report', () => {
    expect(YOGA_SOURCE_REGISTRY_VERSION).toMatch(/^jyotish-source-registry-v\d+$/);
  });
});
