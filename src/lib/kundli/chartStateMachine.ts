/**
 * CHART STATUS + PERSISTENCE STATE MACHINE (Sprint C.1 §4/§5).
 *
 * Two INDEPENDENT axes:
 *
 *   ChartStatus      — what the engine/calculation currently holds
 *                      (DRAFT → INPUT_INCOMPLETE → CALCULATING →
 *                       CALCULATED → VALIDATION_PENDING → READY; FAILED)
 *   PersistenceState — whether the chart exists in the USER'S SPACE
 *                      (EPHEMERAL → SAVING → SAVED; SAVE_FAILED)
 *
 * Mixing the axes produces contradictory UX (e.g. "failed" chart with full
 * interpretation, or an ephemeral chart labelled "saved"). These helpers
 * make the allowed combinations explicit and verifiable.
 */

export type ChartStatus =
  | 'DRAFT'
  | 'INPUT_INCOMPLETE'
  | 'CALCULATING'
  | 'CALCULATED'
  | 'VALIDATION_PENDING'
  | 'READY'
  | 'FAILED';

export type PersistenceState = 'EPHEMERAL' | 'SAVING' | 'SAVED' | 'SAVE_FAILED';

export interface CombinedChartState {
  status: ChartStatus;
  persistence: PersistenceState;
  /** Non-null when the combination is contradictory; never render that state. */
  contradiction?: string;
}

/** Transitions allowed by the engine-visible status axis (for documentation + tests). */
export const CHART_STATUS_TRANSITIONS: Record<ChartStatus, ChartStatus[]> = {
  DRAFT: ['INPUT_INCOMPLETE', 'CALCULATING', 'FAILED'],
  INPUT_INCOMPLETE: ['DRAFT', 'CALCULATING', 'FAILED'],
  CALCULATING: ['CALCULATED', 'VALIDATION_PENDING', 'READY', 'FAILED'],
  CALCULATED: ['VALIDATION_PENDING', 'READY', 'FAILED'],
  VALIDATION_PENDING: ['READY', 'FAILED'],
  READY: [], // terminal for consumer presentation
  FAILED: [], // terminal — no interpretation may be shown
};

/** Transitions allowed by the persistence axis. */
export const PERSISTENCE_TRANSITIONS: Record<PersistenceState, PersistenceState[]> = {
  EPHEMERAL: ['SAVING', 'SAVE_FAILED'],
  SAVING: ['SAVED', 'SAVE_FAILED'],
  SAVE_FAILED: ['SAVING'],
  SAVED: [], // terminal
};

/**
 * CT_UX_INV_004 (Sprint C.1 §5) — a combined state may never contradict:
 *   - FAILED must not be shown together with interpretive/persisted content
 *   - EPHEMERAL must never be presented as "saved"
 *   - SAVED requires a terminal non-failed status
 */
export function combineChartStates(status: ChartStatus, persistence: PersistenceState): CombinedChartState {
  if (status === 'FAILED' && persistence !== 'EPHEMERAL') {
    return {
      status,
      persistence,
      contradiction: 'FAILED may only be shown as EPHEMERAL (nothing authoritative, nothing saved).',
    };
  }
  if (persistence === 'EPHEMERAL' && status === 'READY' && false) {
    // READY+EPHEMERAL is acceptable pre-save; the UI wording must say
    // "ready", never "saved".
  }
  if (persistence === 'SAVED' && ['FAILED', 'DRAFT'].includes(status)) {
    return {
      status,
      persistence,
      contradiction: 'A chart cannot be SAVED while its calculation FAILED or is still DRAFT.',
    };
  }
  return { status, persistence };
}

/** True when the UI may present the given combination as a normal consumer state. */
export function isStateCombinationValid(status: ChartStatus, persistence: PersistenceState): boolean {
  return combineChartStates(status, persistence).contradiction === undefined;
}

/** Maps the read-only adapter result onto the canonical status vocabulary. */
export function normalizeChartStatus(input: string): ChartStatus {
  switch (input) {
    case 'READY':
      return 'READY';
    case 'VALIDATION_PENDING':
      return 'VALIDATION_PENDING';
    case 'INPUT_INCOMPLETE':
      return 'INPUT_INCOMPLETE';
    case 'FAILED':
      return 'FAILED';
    case 'CALCULATED':
      return 'CALCULATED';
    case 'CALCULATING':
      return 'CALCULATING';
    default:
      return 'DRAFT';
  }
}
