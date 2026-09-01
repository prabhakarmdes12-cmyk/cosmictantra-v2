/**
 * V40.1 GATE 5 — the external validation harness (§11) and the D10 quarantine
 * (§10).
 *
 * These tests do not check that the astrology is right. They check that the
 * MACHINERY FOR FINDING OUT is honest: that the register cannot claim
 * agreement it does not have, that the arithmetic and the recorded verdict
 * cannot silently diverge, and that D10 cannot escape quarantine without an
 * outside reference.
 */

import { test, expect } from '@playwright/test';
import {
  GOLDEN_VALIDATION_REGISTER, REQUIRED_QUANTITIES, D10_VALIDATION_STATUS,
  evaluateCase, summariseHarness, d10Gate,
  type ExternalValidationCase,
} from '../../src/lib/kundli/v40/validation/externalValidation';
import { D10_PROMOTION } from '../../src/lib/kundli/v40/d10Validation';

const base = GOLDEN_VALIDATION_REGISTER[1];

const withReference = (over: Partial<ExternalValidationCase>): ExternalValidationCase => ({
  ...base, ...over,
});

test.describe('the register describes the world as it actually is', () => {
  test('every required quantity has at least one case', () => {
    const covered = new Set(GOLDEN_VALIDATION_REGISTER.map((c) => c.quantity));
    for (const q of REQUIRED_QUANTITIES) {
      expect(covered.has(q), `${q} has no validation case at all`).toBe(true);
    }
  });

  test('nothing claims to be validated, because nothing is', () => {
    for (const c of GOLDEN_VALIDATION_REGISTER) {
      expect(c.status, `${c.id} claims a status without a reference`).toBe('NOT_ATTEMPTED');
      expect(c.referenceName, `${c.id} names a reference but was never attempted`).toBe('');
    }
    const summary = summariseHarness(GOLDEN_VALIDATION_REGISTER);
    expect(summary.externallyValidated).toBe(false);
    expect(summary.unvalidatedQuantities.sort()).toEqual([...REQUIRED_QUANTITIES].sort());
  });

  test('every case carries the settings that make a comparison meaningful', () => {
    // Most apparent disagreements between two Jyotish engines are a different
    // ayanamsha or a true-vs-mean node, not an error. A case that does not
    // record its settings is evidence of nothing.
    for (const c of GOLDEN_VALIDATION_REGISTER) {
      expect(c.ourSettings.ayanamsha, c.id).toContain('Lahiri');
      expect(c.ourSettings.zodiac, c.id).toBe('SIDEREAL');
      expect(c.ourSettings.nodePolicy.length, c.id).toBeGreaterThan(0);
      expect(c.birthInput.timezone, c.id).toBe('Asia/Kolkata');
      expect(c.cosmicTantraResult.length, `${c.id} does not say what WE produced`).toBeGreaterThan(0);
    }
  });

  test('tolerances are declared with units and are not absurd', () => {
    for (const c of GOLDEN_VALIDATION_REGISTER) {
      expect(c.tolerance, c.id).toBeGreaterThanOrEqual(0);
      if (c.toleranceUnit === 'ARCMINUTES') expect(c.tolerance, c.id).toBeLessThanOrEqual(5);
      if (c.toleranceUnit === 'DAYS') expect(c.tolerance, c.id).toBeLessThanOrEqual(3);
      if (c.toleranceUnit === 'EXACT_MATCH') expect(c.tolerance, c.id).toBe(0);
    }
  });
});

test.describe('the harness re-derives the verdict rather than trusting it', () => {
  test('a within-tolerance comparison agrees', () => {
    const c = withReference({
      status: 'AGREES', referenceName: 'Reference A',
      referenceResult: 'Leo 12.0950', referenceValue: 132.0950,
      tolerance: 2, toleranceUnit: 'ARCMINUTES',
    });
    const e = evaluateCase(c);
    expect(e.computedStatus).toBe('AGREES');
    expect(Math.abs(e.delta!)).toBeLessThan(2);
    expect(e.inconsistency).toBeNull();
  });

  test('a case marked AGREES whose numbers disagree is reported as inconsistent', () => {
    // The most dangerous failure in a validation register: a human ticks the
    // box and the numbers never get read.
    const c = withReference({
      status: 'AGREES', referenceName: 'Reference A',
      referenceResult: 'Leo 13.5', referenceValue: 133.5,
      tolerance: 2, toleranceUnit: 'ARCMINUTES',
    });
    const e = evaluateCase(c);
    expect(e.computedStatus).toBe('DISAGREES');
    expect(e.inconsistency).toMatch(/recorded AGREES but the numbers say DISAGREES/);
    expect(summariseHarness([c]).inconsistencies).toHaveLength(1);
  });

  test('angular differences wrap correctly across 0 degrees', () => {
    const c = withReference({
      status: 'AGREES', referenceName: 'R',
      cosmicTantraValue: 359.99, referenceValue: 0.01,
      referenceResult: '0.01', tolerance: 2, toleranceUnit: 'ARCMINUTES',
    });
    const e = evaluateCase(c);
    // 359.99 and 0.01 are 1.2 arcminutes apart, not 359.98 degrees apart.
    expect(Math.abs(e.delta!)).toBeCloseTo(1.2, 5);
    expect(e.withinTolerance).toBe(true);
  });

  test('an exact-match quantity compares text, case-insensitively', () => {
    const nakshatra = withReference({
      quantity: 'NAKSHATRA', cosmicTantraResult: 'Uttara Ashadha',
      cosmicTantraValue: undefined,
      referenceName: 'R', referenceResult: 'uttara ashadha ', referenceValue: undefined,
      tolerance: 0, toleranceUnit: 'EXACT_MATCH', status: 'AGREES',
    });
    expect(evaluateCase(nakshatra).computedStatus).toBe('AGREES');

    const wrong = { ...nakshatra, referenceResult: 'Purva Ashadha' };
    expect(evaluateCase(wrong).computedStatus).toBe('DISAGREES');
  });

  test('an unattempted case yields no verdict at all', () => {
    for (const status of ['NOT_ATTEMPTED', 'REFERENCE_UNAVAILABLE', 'NOT_COMPARABLE'] as const) {
      const e = evaluateCase(withReference({ status }));
      expect(e.delta).toBeNull();
      expect(e.withinTolerance).toBeNull();
      expect(e.inconsistency).toBeNull();
    }
  });
});

test.describe('KUNDLI_INV_D10_001 — D10 cannot escape quarantine on self-agreement', () => {
  test('the gate is closed today, and says why', () => {
    const gate = d10Gate(GOLDEN_VALIDATION_REGISTER);
    expect(gate.status).toBe(D10_VALIDATION_STATUS);
    expect(gate.status).toBe('INTERNAL_CROSSCHECK_ONLY');
    expect(gate.mayInformConclusions).toBe(false);
    expect(gate.reason).toMatch(/[Ss]elf-agreement/);
  });

  test('the report-facing promotion gate is driven by the register', () => {
    // One gate, not two. If these could drift, D10 could be quarantined in the
    // register and promoted in the PDF.
    expect(D10_PROMOTION.mayInfluenceConclusions).toBe(false);
    expect(D10_PROMOTION.externalStatus).toBe('INTERNAL_CROSSCHECK_ONLY');
    expect(D10_PROMOTION.status).toBe('VALIDATION_PENDING');
  });

  test('a second in-house implementation agreeing does NOT open the gate', () => {
    // Explicitly: even a hundred internal cross-checks change nothing.
    const internalOnly = Array.from({ length: 100 }, (_, i) => withReference({
      id: `INT-${i}`, quantity: 'D10_SIGN', status: 'NOT_ATTEMPTED',
      notes: 'second in-house implementation agrees',
    }));
    expect(d10Gate(internalOnly).mayInformConclusions).toBe(false);
  });

  test('one external agreement DOES open the gate, and names the reference', () => {
    const external = withReference({
      quantity: 'D10_SIGN', status: 'AGREES',
      referenceName: 'Some named outside reference',
      referenceResult: 'Dhanu', cosmicTantraResult: 'Dhanu',
      cosmicTantraValue: undefined, referenceValue: undefined,
      tolerance: 0, toleranceUnit: 'EXACT_MATCH',
    });
    const gate = d10Gate([...GOLDEN_VALIDATION_REGISTER, external]);
    expect(gate.status).toBe('EXTERNALLY_VALIDATED');
    expect(gate.mayInformConclusions).toBe(true);
    expect(gate.reason).toContain('Some named outside reference');
  });

  test('a D9 agreement does not promote D10', () => {
    const d9 = withReference({
      quantity: 'D9_SIGN', status: 'AGREES', referenceName: 'R',
      referenceResult: 'Karka', cosmicTantraResult: 'Karka',
      cosmicTantraValue: undefined, referenceValue: undefined,
      tolerance: 0, toleranceUnit: 'EXACT_MATCH',
    });
    expect(d10Gate([d9]).mayInformConclusions).toBe(false);
  });
});
