/**
 * Kundli pipeline — delivery state machine.
 *
 * The only terminal state that may deliver a PDF artifact is
 * READY_FOR_DELIVERY. Every failure state carries a typed error code.
 * The client must gate the download button on READY_FOR_DELIVERY.
 */

import type { PipelineState } from './types';

export const DELIVERY_STATE: PipelineState = 'READY_FOR_DELIVERY';

export const PROGRESS_ORDER: PipelineState[] = [
  'INPUT_VALIDATED',
  'GEO_TIMEZONE_RESOLVED',
  'CALCULATION_COMPLETE',
  'REPORT_READY',
  'PDF_RENDERED',
  'PDF_VALIDATED',
  'READY_FOR_DELIVERY',
];

export const FAILURE_STATES: PipelineState[] = [
  'INPUT_FAILED',
  'CALCULATION_FAILED',
  'REPORT_FAILED',
  'PDF_RENDER_FAILED',
  'PDF_VALIDATION_FAILED',
];

export function isFailureState(state: PipelineState): boolean {
  return FAILURE_STATES.includes(state);
}

export function canDeliver(state: PipelineState): boolean {
  return state === DELIVERY_STATE;
}

export function progressIndex(state: PipelineState): number {
  const i = PROGRESS_ORDER.indexOf(state);
  return i < 0 ? 0 : i;
}
