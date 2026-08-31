/**
 * Kundli pipeline — observability.
 *
 * Structured, privacy-safe metrics. Personal data (name, exact coordinates)
 * is NEVER included in metric payloads — only report ids and codes.
 */

import type { PipelineState } from './types';
import type { KundliErrorCode } from './errors';

export interface PipelineMetric {
  name: string;
  at: string;
  data: Record<string, unknown>;
}

const metricsBuffer: PipelineMetric[] = [];
const MAX_BUFFERED = 200;

export function emitMetric(name: string, data: Record<string, unknown>, onMetric?: (n: string, d: Record<string, unknown>) => void): void {
  const entry: PipelineMetric = { name, at: new Date().toISOString(), data: { ...data } };
  metricsBuffer.push(entry);
  if (metricsBuffer.length > MAX_BUFFERED) metricsBuffer.shift();
  onMetric?.(name, entry.data);
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log(`[kundli-metric] ${name}`, JSON.stringify(entry.data));
  }
}

export function getBufferedMetrics(): PipelineMetric[] {
  return metricsBuffer.slice();
}

export interface PipelineErrorMetricData {
  reportId?: string;
  code: KundliErrorCode;
  state: PipelineState;
  details: Record<string, unknown>;
}

export function emitPipelineError(data: PipelineErrorMetricData): void {
  emitMetric('pipeline.failed', {
    reportId: data.reportId,
    code: data.code,
    state: data.state,
    details: data.details,
  });
}
