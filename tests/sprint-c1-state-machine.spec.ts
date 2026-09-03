/**
 * SPRINT C.1 — CHART STATE MACHINE INVARIANTS (§5) + truthfulness (§§3, §11, §12).
 */
import { test, expect } from '@playwright/test';
import {
  CHART_STATUS_TRANSITIONS,
  PERSISTENCE_TRANSITIONS,
  combineChartStates,
  isStateCombinationValid,
  normalizeChartStatus,
} from '../src/lib/kundli/chartStateMachine';
import {
  buildDashaWhyEvidence,
  buildTimeSensitivityNote,
  deriveConsumerChartState,
  adaptKundliAtAGlance,
} from '../src/lib/presentation/kundliOverviewAdapter';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import type { StoredKundliRecord } from '../src/lib/jyotish/kundliStore';

const realSnapshot = getCanonicalJyotishSnapshot({
  birthDate: '1990-01-15',
  birthTime: '10:30:00',
  latitude: 25.5941,
  longitude: 85.1376,
  timezone: 5.5,
  locationName: 'Patna, Bihar, India',
});

const baseRecord = (overrides: Partial<StoredKundliRecord> = {}): StoredKundliRecord =>
  ({
    id: 'ct-test-1',
    personName: 'Test Person',
    timeConfidence: 'EXACT',
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
    engineVersion: 'test',
    ayanamshaName: 'Chitra Paksha (Lahiri Standard)',
    tags: ['User Created'],
    birthContext: {
      birthDate: '1990-01-15',
      birthTime: '10:30:00',
      latitude: 25.5941,
      longitude: 85.1376,
      timezone: 5.5,
      locationName: 'Patna, Bihar, India',
    },
    snapshot: realSnapshot,
    ...overrides,
  }) as unknown as StoredKundliRecord;

const describe = test.describe;
const it = test;

describe('chart status machine (C.1 §5)', () => {
  it('declares every status and persistence transition set', () => {
    expect(Object.keys(CHART_STATUS_TRANSITIONS).sort()).toEqual(
      ['CALCULATED', 'CALCULATING', 'DRAFT', 'FAILED', 'INPUT_INCOMPLETE', 'READY', 'VALIDATION_PENDING'].sort()
    );
    expect(Object.keys(PERSISTENCE_TRANSITIONS).sort()).toEqual(
      ['EPHEMERAL', 'SAVE_FAILED', 'SAVED', 'SAVING'].sort()
    );
  });

  it('forbids contradictory combined states', () => {
    expect(combineChartStates('FAILED', 'SAVED').contradiction).toBeTruthy();
    expect(combineChartStates('FAILED', 'SAVING').contradiction).toBeTruthy();
    expect(combineChartStates('DRAFT', 'SAVED').contradiction).toBeTruthy();
    expect(isStateCombinationValid('FAILED', 'EPHEMERAL')).toBe(true);
    expect(isStateCombinationValid('READY', 'EPHEMERAL')).toBe(true);
    expect(isStateCombinationValid('READY', 'SAVED')).toBe(true);
    expect(isStateCombinationValid('VALIDATION_PENDING', 'SAVED')).toBe(true);
  });

  it('normalizes engine/adapter output to canonical vocabulary', () => {
    expect(normalizeChartStatus('READY')).toBe('READY');
    expect(normalizeChartStatus('VALIDATION_PENDING')).toBe('VALIDATION_PENDING');
    expect(normalizeChartStatus('FAILED')).toBe('FAILED');
    expect(normalizeChartStatus('SOMETHING_NEW')).toBe('DRAFT');
  });
});

describe('time certainty (§11)', () => {
  it('never presents an UNKNOWN-time chart as authoritative (adapter)', () => {
    const state = deriveConsumerChartState(baseRecord({ timeConfidence: 'UNKNOWN' }));
    expect(state.state).toBe('VALIDATION_PENDING');
    expect(state.reasons.length).toBeGreaterThan(0);
  });

  it('EXACT time produces READY without validity reasons', () => {
    const state = deriveConsumerChartState(baseRecord());
    expect(state.state).toBe('READY');
    expect(state.reasons).toHaveLength(0);
  });

  it('UNKNOWN restricts Lagna/houses/Vargas/Dasha-balance/Dasha from authority', () => {
    const note = buildTimeSensitivityNote(baseRecord({ timeConfidence: 'UNKNOWN' }))!;
    expect(note.computedForReferenceOnly).toBe(true);
    for (const f of ['LAGNA', 'HOUSES', 'VARGAS', 'DASHA_BALANCE', 'DASHA']) {
      expect(note.restricted).toContain(f);
    }
  });

  it('APPROXIMATE restricts house-sensitive fields and keeps Dasha out of the restriction list', () => {
    const note = buildTimeSensitivityNote(baseRecord({ timeConfidence: 'APPROXIMATE' }))!;
    expect(note.restricted).not.toContain('DASHA');
    expect(note.restricted).toContain('LAGNA');
  });

  it('EXACT time has no sensitivity note at all', () => {
    expect(buildTimeSensitivityNote(baseRecord())).toBeNull();
  });
});

describe('WHY drawer evidence (§12)', () => {
  it('classifies every visible step — no UI guesswork', () => {
    const steps = buildDashaWhyEvidence(baseRecord());
    expect(steps.length).toBeGreaterThan(0);
    for (const s of steps) {
      expect(['CALCULATED_FACT', 'DERIVED_FACT', 'TRADITIONAL_RULE', 'READING', 'VALIDATION_PENDING']).toContain(
        s.classification
      );
    }
  });

  it('uses engine-returned dates verbatim, never reformatted by the UI', () => {
    const record = baseRecord();
    const steps = buildDashaWhyEvidence(record);
    const seq = steps.find((s) => s.textKey === 'whySequence')!;
    const expected = (record.snapshot.dasha?.mahadashas || [])
      .slice(0, 5)
      .map((m: any) => `${m.lord} (${m.startFormatted}–${m.endFormatted})`)
      .join(' · ');
    expect(seq.values.sequence).toBe(expected);
  });

  it('flags an uncertain-time step as VALIDATION_PENDING', () => {
    const steps = buildDashaWhyEvidence(baseRecord({ timeConfidence: 'APPROXIMATE' }));
    expect(steps.some((s) => s.classification === 'VALIDATION_PENDING' && s.textKey === 'whyTimeUncertain')).toBe(true);
    const stepsExact = buildDashaWhyEvidence(baseRecord());
    expect(stepsExact.some((s) => s.textKey === 'whyTimeUncertain')).toBe(false);
  });

  it('at-a-glance still adapts deterministically', () => {
    const glance = adaptKundliAtAGlance(baseRecord());
    expect(glance).toBeTruthy();
  });
});
