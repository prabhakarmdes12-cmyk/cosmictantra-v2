/**
 * YOGA ENGINE CONTRACT
 *
 * Independent rule verification for the yoga engine. These tests build
 * synthetic charts by hand and assert the rule outcomes that classical
 * definitions require, so the engine is checked against known answers
 * rather than against its own output.
 *
 * Every test also enforces the reporting contract: a yoga always carries an
 * id, a rule, its conditions with evidence, and a status of
 * PRESENT / ABSENT / INDETERMINATE / NOT_CALCULATED.
 */
import { test, expect } from '@playwright/test';
import {
  evaluateYogas,
  presentYogaNames,
  resolveStatus,
  YOGA_RULE_IDS,
  type YogaChartInput,
  type YogaConditionResult,
  type YogaPlanetInput,
  type YogaStatus,
} from '../../src/lib/jyotish/yogaEngine';
import {
  YOGA_SOURCE_REGISTRY,
  YOGA_SOURCE_REGISTRY_VERSION,
  sourceEntryFor,
} from '../../src/lib/jyotish/yogaSourceRegistry';

const VALID_STATUS: YogaStatus[] = ['PRESENT', 'ABSENT', 'INDETERMINATE', 'NOT_CALCULATED'];

/** 12 house signs under the equal-sign system from the given lagna sign. */
const equalHouseSigns = (ascendant: number): number[] =>
  Array.from({ length: 12 }, (_, i) => ((ascendant - 1 + i) % 12) + 1);

interface Spec { house: number; signId: number }

function chart(planets: Record<string, Spec>, ascendant = 1): YogaChartInput {
  const list: YogaPlanetInput[] = Object.entries(planets).map(([id, s]) => ({
    id,
    house: s.house,
    signId: s.signId,
    signName: `S${s.signId}`,
    longitudeDeg: (s.signId - 1) * 30 + 5,
  }));
  return { planets: list, houseSigns: equalHouseSigns(ascendant), ascendantSignId: ascendant };
}

const status = (c: YogaChartInput, id: string): YogaStatus => {
  const y = evaluateYogas(c).find((q) => q.id === id);
  if (!y) throw new Error(`yoga ${id} not registered`);
  return y.status;
};

const byId = (c: YogaChartInput, id: string) => {
  const y = evaluateYogas(c).find((q) => q.id === id);
  if (!y) throw new Error(`yoga ${id} not registered`);
  return y;
};

test.describe('YOGA ENGINE — Gaja-Kesari', () => {
  test('Jupiter in the 4th from the Moon is PRESENT', () => {
    expect(status(chart({ Moon: { house: 1, signId: 1 }, Jupiter: { house: 4, signId: 4 } }), 'YOGA_GAJA_KESARI')).toBe('PRESENT');
  });

  test('Jupiter in the 7th from the Moon is PRESENT', () => {
    expect(status(chart({ Moon: { house: 1, signId: 1 }, Jupiter: { house: 7, signId: 7 } }), 'YOGA_GAJA_KESARI')).toBe('PRESENT');
  });

  test('Jupiter in the 2nd from the Moon is ABSENT', () => {
    expect(status(chart({ Moon: { house: 1, signId: 1 }, Jupiter: { house: 2, signId: 2 } }), 'YOGA_GAJA_KESARI')).toBe('ABSENT');
  });

  test('Jupiter in the 11th from the Moon is ABSENT (the PRIYA-1995 case)', () => {
    expect(status(chart({ Moon: { house: 5, signId: 9 }, Jupiter: { house: 4, signId: 8 } }), 'YOGA_GAJA_KESARI')).toBe('ABSENT');
  });

  test('unresolved house yields INDETERMINATE, never a guess', () => {
    const y = byId(chart({ Moon: { house: 0, signId: 1 }, Jupiter: { house: 4, signId: 4 } }), 'YOGA_GAJA_KESARI');
    expect(y.status).toBe('INDETERMINATE');
    expect(y.conditions.some((c) => c.satisfied === null)).toBe(true);
    expect(y.conditions.find((c) => c.id === 'jupiter.kendra-from-moon')!.satisfied).toBeNull();
  });
});

test.describe('YOGA ENGINE — Pancha Mahapurusha', () => {
  test('Venus in a kendra in its own sign gives Malavya PRESENT', () => {
    expect(status(chart({ Venus: { house: 4, signId: 7 } }), 'YOGA_MALAVYA')).toBe('PRESENT');
  });

  test('Venus in a kendra but not own/exalted gives Malavya ABSENT', () => {
    expect(status(chart({ Venus: { house: 4, signId: 1 } }), 'YOGA_MALAVYA')).toBe('ABSENT');
  });

  test('Mars exalted in the 10th gives Ruchaka PRESENT', () => {
    expect(status(chart({ Mars: { house: 10, signId: 10 } }), 'YOGA_RUCHAKA')).toBe('PRESENT');
  });

  test('Mars own-sign but in the 3rd (not a kendra) gives Ruchaka ABSENT', () => {
    expect(status(chart({ Mars: { house: 3, signId: 1 } }), 'YOGA_RUCHAKA')).toBe('ABSENT');
  });

  test('the failing condition is named, not just the result', () => {
    const y = byId(chart({ Mars: { house: 3, signId: 1 } }), 'YOGA_RUCHAKA');
    expect(y.status).toBe('ABSENT');
    expect(y.conditions.find((c) => c.id === 'mars.in-kendra')!.satisfied).toBe(false);
    expect(y.conditions.find((c) => c.id === 'mars.own-or-exalted')!.satisfied).toBe(true);
  });
});

test.describe('YOGA ENGINE — Dharma-Karmadhipati', () => {
  // Lagna sign 1 (Mesha): house 9 = sign 9 (Dhanu, lord Jupiter),
  // house 10 = sign 10 (Makara, lord Saturn).
  test('mutual kendra alone is NOT sufficient under the adopted rule', () => {
    // Many popular sources accept mutual kendra; no licensed source in this
    // repository settles it, so the adopted rule does not accept it and the
    // variant is registered separately as NOT_CALCULATED.
    const c = chart({ Jupiter: { house: 1, signId: 9 }, Saturn: { house: 4, signId: 10 } }, 1);
    const y = byId(c, 'YOGA_DHARMA_KARMA_ADHIPATI');
    expect(y.status).toBe('ABSENT');
    expect(y.rule).toContain('mutual-kendra placement is NOT sufficient');
    // The offset is still reported so a scholar can adjudicate it.
    expect(y.conditions.at(-1)!.evidence.join(' ')).toContain('mutual kendra: true');
    expect(y.conditions.at(-1)!.evidence.join(' ')).toContain('NOT adopted as sufficient');
  });

  test('the mutual-kendra variant is registered and reported NOT_CALCULATED with evidence', () => {
    const c = chart({ Jupiter: { house: 1, signId: 9 }, Saturn: { house: 4, signId: 10 } }, 1);
    const y = byId(c, 'YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA');
    expect(y.status).toBe('NOT_CALCULATED');
    expect(y.notCalculatedReason).toContain('not adopted');
    // Conditions ARE still computed, purely as evidence for a scholar.
    const offset = y.conditions.find((q) => q.id === 'mutual-kendra-offset')!;
    expect(offset.satisfied).toBe(true);
    expect(offset.evidence.join(' ')).toContain('offset 3');
  });

  test('the mutual-kendra variant reports ABSENT-offset evidence when the lords are not in kendra', () => {
    const c = chart({ Jupiter: { house: 1, signId: 9 }, Saturn: { house: 2, signId: 10 } }, 1);
    const y = byId(c, 'YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA');
    expect(y.status).toBe('NOT_CALCULATED');
    const offset = y.conditions.find((q) => q.id === 'mutual-kendra-offset')!;
    expect(offset.satisfied).toBe(false);
  });

  test('9th and 10th lords conjoined give PRESENT', () => {
    const c = chart({ Jupiter: { house: 1, signId: 9 }, Saturn: { house: 1, signId: 10 } }, 1);
    expect(byId(c, 'YOGA_DHARMA_KARMA_ADHIPATI').status).toBe('PRESENT');
  });

  test('parivartana of the 9th and 10th lords gives PRESENT', () => {
    // Jupiter (9th lord) sits in sign 10, Saturn (10th lord) sits in sign 9.
    const c = chart({ Jupiter: { house: 11, signId: 10 }, Saturn: { house: 12, signId: 9 } }, 1);
    const y = byId(c, 'YOGA_DHARMA_KARMA_ADHIPATI');
    expect(y.status).toBe('PRESENT');
    expect(y.conditions.at(-1)!.evidence.join(' ')).toContain('parivartana: true');
  });

  test('9th and 10th lords with no relationship give ABSENT', () => {
    const c = chart({ Jupiter: { house: 1, signId: 9 }, Saturn: { house: 2, signId: 3 } }, 1);
    expect(byId(c, 'YOGA_DHARMA_KARMA_ADHIPATI').status).toBe('ABSENT');
  });

  test('unresolved house signs give INDETERMINATE', () => {
    const c: YogaChartInput = {
      planets: [
        { id: 'Jupiter', house: 1, signId: 9, signName: 'S9', longitudeDeg: 0 },
        { id: 'Saturn', house: 4, signId: 10, signName: 'S10', longitudeDeg: 0 },
      ],
      houseSigns: Array(12).fill(null),
      ascendantSignId: 1,
    };
    expect(byId(c, 'YOGA_DHARMA_KARMA_ADHIPATI').status).toBe('INDETERMINATE');
  });
});

test.describe('YOGA ENGINE — status resolution (AND semantics)', () => {
  const cond = (id: string, satisfied: boolean | null): YogaConditionResult => ({
    id,
    description: id,
    satisfied,
    evidence: [`evidence for ${id}`],
  });

  test('all true -> PRESENT', () => {
    expect(resolveStatus([cond('a', true), cond('b', true)])).toBe('PRESENT');
  });

  test('any false -> ABSENT, even when another condition is unresolved', () => {
    expect(resolveStatus([cond('a', true), cond('b', false), cond('c', null)])).toBe('ABSENT');
  });

  test('false plus unresolved is ABSENT, never INDETERMINATE', () => {
    expect(resolveStatus([cond('a', false), cond('b', null)])).toBe('ABSENT');
    expect(resolveStatus([cond('a', null), cond('b', false)])).toBe('ABSENT');
  });

  test('true plus unresolved -> INDETERMINATE', () => {
    expect(resolveStatus([cond('a', true), cond('b', null)])).toBe('INDETERMINATE');
  });

  test('all unresolved -> INDETERMINATE', () => {
    expect(resolveStatus([cond('a', null), cond('b', null)])).toBe('INDETERMINATE');
  });

  test('no conditions -> NOT_CALCULATED (fail closed, never PRESENT)', () => {
    expect(resolveStatus([])).toBe('NOT_CALCULATED');
  });

  test('chart-level mixed case: false kendra plus unknown sign is ABSENT', () => {
    // Mars in house 3 (not a kendra -> conclusively false) with an
    // unresolved sign (own/exaltation unknown -> null).
    const y = byId(chart({ Mars: { house: 3, signId: 0 } }), 'YOGA_RUCHAKA');
    expect(y.conditions.find((c) => c.id === 'mars.in-kendra')!.satisfied).toBe(false);
    expect(y.conditions.find((c) => c.id === 'mars.own-or-exalted')!.satisfied).toBeNull();
    expect(y.status).toBe('ABSENT');
  });
});

test.describe('YOGA ENGINE — contract', () => {
  test('every registration carries an id, a rule, inputs and a status', () => {
    const c = chart({
      Sun: { house: 1, signId: 1 }, Moon: { house: 1, signId: 1 }, Mars: { house: 1, signId: 1 },
      Mercury: { house: 1, signId: 1 }, Jupiter: { house: 1, signId: 1 },
      Venus: { house: 1, signId: 1 }, Saturn: { house: 1, signId: 1 },
    });
    const all = evaluateYogas(c);
    expect(all.length).toBeGreaterThanOrEqual(9);
    for (const y of all) {
      expect(y.id).toMatch(/^YOGA_[A-Z_]+$/);
      expect(y.rule.length).toBeGreaterThan(10);
      expect(VALID_STATUS).toContain(y.status);
      expect(y.status).toBe(y.result);
      expect(y.system).toBe('PARASHARI');
      expect(y.inputs).toBeDefined();
    }
  });

  test('an implemented rule always reports conditions and evidence', () => {
    const c = chart({
      Moon: { house: 5, signId: 9 }, Jupiter: { house: 4, signId: 8 },
      Sun: { house: 10, signId: 2 }, Mercury: { house: 10, signId: 2 },
      Mars: { house: 1, signId: 5 }, Venus: { house: 10, signId: 2 }, Saturn: { house: 8, signId: 12 },
    });
    for (const y of evaluateYogas(c)) {
      if (y.status === 'NOT_CALCULATED') {
        expect(y.notCalculatedReason, `${y.id} explains why`).toBeTruthy();
        continue;
      }
      expect(y.conditions.length, `${y.id} has conditions`).toBeGreaterThan(0);
      expect(y.evidenceRefs.length, `${y.id} has evidence`).toBeGreaterThan(0);
      for (const cond of y.conditions) {
        expect(cond.id).toBeTruthy();
        expect(cond.description).toBeTruthy();
        expect(cond.evidence.length).toBeGreaterThan(0);
      }
    }
  });

  test('NOT_CALCULATED is used for rules that are not implemented', () => {
    const c = chart({ Moon: { house: 1, signId: 1 } });
    const kemadruma = byId(c, 'YOGA_KEMADRUMA');
    expect(kemadruma.status).toBe('NOT_CALCULATED');
    expect(kemadruma.conditions).toEqual([]);
    expect(kemadruma.notCalculatedReason).toContain('not implemented');
  });

  test('every registered rule has a versioned source-registry entry', () => {
    expect(YOGA_SOURCE_REGISTRY_VERSION).toMatch(/^jyotish-source-registry-v\d+$/);
    for (const id of YOGA_RULE_IDS) {
      const entry = sourceEntryFor(id);
      expect(entry.ruleId).toBe(id);
      expect(entry.sourceWork.length).toBeGreaterThan(10);
      expect(entry.locator.length).toBeGreaterThan(0);
      expect(entry.editionOrTranslation.length).toBeGreaterThan(0);
      expect(entry.adoptedInterpretation.length).toBeGreaterThan(20);
      expect(Array.isArray(entry.variants)).toBe(true);
      expect(entry.limitations.length).toBeGreaterThan(0);
      expect(['ADOPTED', 'NOT_ADOPTED']).toContain(entry.adoption);
      // Honesty: nothing in this repository is a verified licensed source.
      expect(entry.verifiedInRepository).toBe(false);
      expect(entry.locatorVerified).toBe(false);
    }
  });

  test('NOT_ADOPTED rules always evaluate to NOT_CALCULATED', () => {
    const c = chart({
      Moon: { house: 1, signId: 1 }, Jupiter: { house: 4, signId: 4 },
      Sun: { house: 1, signId: 1 }, Mercury: { house: 1, signId: 1 },
      Mars: { house: 1, signId: 1 }, Venus: { house: 1, signId: 1 }, Saturn: { house: 1, signId: 1 },
    });
    for (const y of evaluateYogas(c)) {
      if (y.source.adoption === 'NOT_ADOPTED') {
        expect(y.status, `${y.id} must not claim PRESENT/ABSENT`).toBe('NOT_CALCULATED');
        expect(y.notCalculatedReason).toBeTruthy();
      } else {
        expect(['PRESENT', 'ABSENT', 'INDETERMINATE']).toContain(y.status);
      }
    }
  });

  test('every evaluation carries its source entry', () => {
    const c = chart({
      Moon: { house: 5, signId: 9 }, Jupiter: { house: 4, signId: 8 },
      Sun: { house: 10, signId: 2 }, Mercury: { house: 10, signId: 2 },
    });
    for (const y of evaluateYogas(c)) {
      expect(y.source.ruleId).toBe(y.id);
      expect(y.source.adoptedInterpretation.length).toBeGreaterThan(20);
    }
  });

  test('presentYogaNames exposes only PRESENT yogas', () => {
    const c = chart({
      Moon: { house: 5, signId: 9 }, Jupiter: { house: 4, signId: 8 },   // GK absent
      Sun: { house: 10, signId: 2 }, Mercury: { house: 10, signId: 2 },   // Budhaditya present
      Venus: { house: 10, signId: 2 },                                    // Malavya present
    });
    const names = presentYogaNames(evaluateYogas(c));
    expect(names).toContain('Budhaditya Yoga');
    expect(names).toContain('Malavya Yoga (Pancha Mahapurusha)');
    expect(names).not.toContain('Gaja-Kesari Yoga');
  });
});
