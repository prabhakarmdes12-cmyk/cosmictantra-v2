/**
 * ADVERSARIAL CANONICAL-ADAPTER TESTS — yoga contract
 *
 * The adapter must fail closed: a yoga record that violates the contract
 * must raise KUNDLI_CALCULATION_INCOMPLETE, produce no PDF and return
 * pdfBuffer: null. Every case below is a forged or malformed record that a
 * buggy engine (or a malicious caller) could hand to the adapter.
 *
 * Each case is asserted at two levels:
 *  1. buildCanonicalModel throws the typed error;
 *  2. the full pipeline returns ok:false, pdfBuffer null, errorCode
 *     KUNDLI_CALCULATION_INCOMPLETE — i.e. no downloadable PDF escapes.
 */
import { test, expect } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { createKundliPdfGenerator } from '../../src/lib/kundli/pipeline';
import { KundliError } from '../../src/lib/kundli/errors';
import type { NormalizedBirthProfile } from '../../src/lib/kundli/types';

const PROFILE: NormalizedBirthProfile = {
  name: 'Priya Sharma',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  locationName: 'Patna, Bihar, India',
  coordinates: { latitude: 25.5941, longitude: 85.1376, provenance: 'MANUAL' },
  timezone: {
    timezoneId: 'Asia/Kolkata',
    utcOffsetAtBirth: 5.5,
    localDateTime: '1995-06-15T10:30:00',
    utcDateTime: '1995-06-15T05:00:00.000Z',
    offsetProvenance: 'IANA_HISTORICAL',
  },
  fingerprint: 'adversarial',
} as NormalizedBirthProfile;

const CONFIG = {
  zodiac: 'SIDEREAL' as const,
  ayanamsha: 'LAHIRI_CHITRA_PAKSHA' as const,
  ayanamshaName: 'Lahiri (Chitra Paksha)',
  houseSystem: 'EQUAL_SIGN' as const,
  nodeMode: 'MEAN_NODE' as const,
  ephemerisProvider: 'ASTRONOMY_ENGINE_VSOP87_ELP2000' as const,
  engineVersion: 'V36.0',
  calculationVersion: 'kundli-calc-v1',
  reportVersion: 'kundli-report-v1',
};

const RAW_INPUT = {
  name: 'Priya Sharma',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  locationName: 'Patna',
  latitude: 25.5941,
  longitude: 85.1376,
  coordinateProvenance: 'MANUAL' as const,
  timezoneId: 'Asia/Kolkata',
};

const baseSnapshot = (): any =>
  getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15',
    birthTime: '10:30',
    latitude: 25.5941,
    longitude: 85.1376,
    timezone: 5.5,
    locationName: 'Patna',
  });

/** A genuine Gaja-Kesari record from the engine, to be mutated per case. */
const genuineYoga = (): any => {
  const snap = baseSnapshot();
  return JSON.parse(JSON.stringify(snap.yogasAndDoshas.yogas[0]));
};

const snapshotWithYogas = (yogas: unknown): any => {
  const snap = baseSnapshot();
  return { ...snap, yogasAndDoshas: { ...snap.yogasAndDoshas, yogas } };
};

/** Asserts the adapter throws AND the pipeline issues no PDF. */
async function expectFailClosed(label: string, yogas: unknown, messageFragment?: string) {
  const snapshot = snapshotWithYogas(yogas);

  let thrown: unknown;
  try {
    buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG });
  } catch (e) {
    thrown = e;
  }
  expect(thrown, `${label}: adapter must throw`).toBeInstanceOf(KundliError);
  expect((thrown as KundliError).code, `${label}: error code`).toBe('KUNDLI_CALCULATION_INCOMPLETE');
  if (messageFragment) {
    expect((thrown as KundliError).message.toLowerCase()).toContain(messageFragment.toLowerCase());
  }

  const result = await createKundliPdfGenerator(() => snapshot)(RAW_INPUT);
  expect(result.ok, `${label}: pipeline must not succeed`).toBe(false);
  expect(result.pdfBuffer, `${label}: no PDF bytes`).toBeNull();
  expect(result.errorCode, `${label}: pipeline error code`).toBe('KUNDLI_CALCULATION_INCOMPLETE');
  expect(result.state).not.toBe('READY_FOR_DELIVERY');
}

test.describe('ADVERSARIAL — forged PRESENT claims', () => {
  test('PRESENT with a false condition is rejected', async () => {
    const y = genuineYoga();
    y.status = 'PRESENT';
    y.result = 'PRESENT';
    await expectFailClosed('forged PRESENT', [y], 'requires every condition to be true');
  });

  test('PRESENT with empty conditions is rejected', async () => {
    const y = genuineYoga();
    y.status = 'PRESENT';
    y.result = 'PRESENT';
    y.conditions = [];
    await expectFailClosed('PRESENT/empty conditions', [y], 'requires at least one condition');
  });

  test('PRESENT with an unresolved (null) condition is rejected', async () => {
    const y = genuineYoga();
    y.status = 'PRESENT';
    y.result = 'PRESENT';
    y.conditions = [
      { id: 'c1', description: 'always true', satisfied: true, evidence: ['e1'] },
      { id: 'c2', description: 'unknown', satisfied: null, evidence: ['e2'] },
    ];
    y.evidenceRefs = ['e1', 'e2'];
    await expectFailClosed('PRESENT/null condition', [y], 'requires every condition to be true');
  });

  test('PRESENT with no ADOPTED source entry is rejected', async () => {
    const y = genuineYoga();
    y.status = 'PRESENT';
    y.result = 'PRESENT';
    y.conditions = [{ id: 'c1', description: 'true', satisfied: true, evidence: ['e1'] }];
    y.evidenceRefs = ['e1'];
    y.source = { ...y.source, adoption: 'NOT_ADOPTED' };
    await expectFailClosed('PRESENT/NOT_ADOPTED source', [y], 'requires an ADOPTED');
  });
});

test.describe('ADVERSARIAL — status semantics', () => {
  test('status and result must agree', async () => {
    const y = genuineYoga();
    y.status = 'ABSENT';
    y.result = 'PRESENT';
    await expectFailClosed('status/result conflict', [y], 'does not match status');
  });

  test('ABSENT without a conclusively false condition is rejected', async () => {
    const y = genuineYoga();
    y.status = 'ABSENT';
    y.result = 'ABSENT';
    y.conditions = [
      { id: 'c1', description: 'known', satisfied: true, evidence: ['e1'] },
      { id: 'c2', description: 'unknown', satisfied: null, evidence: ['e2'] },
    ];
    y.evidenceRefs = ['e1', 'e2'];
    await expectFailClosed('ABSENT without false', [y], 'conclusively false');
  });

  test('INDETERMINATE with a conclusively false condition is rejected', async () => {
    const y = genuineYoga();
    y.status = 'INDETERMINATE';
    y.result = 'INDETERMINATE';
    y.conditions = [
      { id: 'c1', description: 'false', satisfied: false, evidence: ['e1'] },
      { id: 'c2', description: 'unknown', satisfied: null, evidence: ['e2'] },
    ];
    y.evidenceRefs = ['e1', 'e2'];
    await expectFailClosed('INDETERMINATE with false', [y], 'conclusively false');
  });

  test('INDETERMINATE with no unresolved condition is rejected', async () => {
    const y = genuineYoga();
    y.status = 'INDETERMINATE';
    y.result = 'INDETERMINATE';
    y.conditions = [{ id: 'c1', description: 'true', satisfied: true, evidence: ['e1'] }];
    y.evidenceRefs = ['e1'];
    await expectFailClosed('INDETERMINATE without null', [y], 'unresolved condition');
  });

  test('NOT_CALCULATED without a reason is rejected', async () => {
    const y = genuineYoga();
    y.status = 'NOT_CALCULATED';
    y.result = 'NOT_CALCULATED';
    delete y.notCalculatedReason;
    y.conditions = [];
    y.evidenceRefs = [];
    await expectFailClosed('NOT_CALCULATED without reason', [y], 'non-empty reason');
  });

  test('an unknown status is rejected', async () => {
    const y = genuineYoga();
    y.status = 'MAYBE';
    y.result = 'MAYBE';
    await expectFailClosed('unknown status', [y], 'not a valid yoga status');
  });
});

test.describe('ADVERSARIAL — malformed records', () => {
  test('an unrecognised system is rejected, never defaulted to PARASHARI', async () => {
    const y = genuineYoga();
    y.system = 'VASTU';
    await expectFailClosed('invalid system', [y], 'not a recognised jyotish system');
  });

  test('a missing system is rejected, never defaulted to PARASHARI', async () => {
    const y = genuineYoga();
    delete y.system;
    await expectFailClosed('missing system', [y], 'not a recognised jyotish system');
  });

  test('empty name is rejected', async () => {
    const y = genuineYoga();
    y.name = '   ';
    await expectFailClosed('empty name', [y], 'empty name');
  });

  test('a non-stable id is rejected', async () => {
    const y = genuineYoga();
    y.id = 'gaja kesari';
    y.source = { ...y.source, ruleId: 'gaja kesari' };
    await expectFailClosed('non-stable id', [y], 'stable yoga id');
  });

  test('missing rule text on an evaluated status is rejected', async () => {
    const y = genuineYoga();
    delete y.rule;
    await expectFailClosed('missing rule', [y], 'rule text is required');
  });

  test('a condition with no evidence is rejected', async () => {
    const y = genuineYoga();
    y.conditions = [{ id: 'c1', description: 'no evidence', satisfied: true, evidence: [] }];
    y.evidenceRefs = [];
    await expectFailClosed('empty evidence', [y], 'empty evidence');
  });

  test('a malformed condition object is rejected', async () => {
    const y = genuineYoga();
    y.conditions = [{ id: 'c1', description: 'undefined result' }];
    y.evidenceRefs = ['e1'];
    await expectFailClosed('malformed condition', [y], 'must be true, false or null');
  });

  test('a condition that is not an object is rejected', async () => {
    const y = genuineYoga();
    y.conditions = ['looks fine'];
    y.evidenceRefs = [];
    await expectFailClosed('non-object condition', [y], 'is not an object');
  });

  test('evidenceRefs that omit a condition’s evidence are rejected', async () => {
    const y = genuineYoga();
    y.conditions = [
      { id: 'c1', description: 'one', satisfied: false, evidence: ['evidence-one'] },
    ];
    y.evidenceRefs = ['some-other-string'];
    await expectFailClosed('evidence contract breach', [y], 'all condition evidence');
  });

  test('a missing source-registry entry is rejected', async () => {
    const y = genuineYoga();
    delete y.source;
    await expectFailClosed('missing source', [y], 'source-registry entry');
  });

  test('a source entry belonging to another rule is rejected', async () => {
    const y = genuineYoga();
    y.source = { ...y.source, ruleId: 'YOGA_BUDHADITYA' };
    await expectFailClosed('foreign source entry', [y], 'belongs to another rule');
  });

  test('a non-object record is rejected', async () => {
    await expectFailClosed('null record', [null], 'is not an object');
  });

  test('a missing yogas array is rejected', async () => {
    await expectFailClosed('missing yogas', undefined, 'yoga evaluations missing');
  });
});

test.describe('CONTROL — genuine engine output validates', () => {
  test('the real snapshot passes the contract and still yields a PDF', async () => {
    const snapshot = baseSnapshot();
    const canonical = buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG });
    expect(canonical.yogas.length).toBeGreaterThan(0);
    for (const y of canonical.yogas) {
      expect(y.status).toBe(y.result);
      expect(y.source.ruleId).toBe(y.id);
    }

    const result = await createKundliPdfGenerator(() => snapshot)(RAW_INPUT);
    expect(result.ok).toBe(true);
    expect(result.pdfBuffer).toBeTruthy();
    expect(result.pdfQuality!.pageCount).toBeLessThanOrEqual(40);
  });
});
