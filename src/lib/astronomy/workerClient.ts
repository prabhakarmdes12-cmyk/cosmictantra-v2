import type { ObserverLocation } from './types';
import type { AstronomicalBody, AstronomySnapshot, RiseTransitSet } from './events';
type WorkerRequest = { requestId: string; type: 'CALCULATE_POSITION' | 'CALCULATE_EVENTS'; body: AstronomicalBody; instant: string; observer: ObserverLocation };
type WorkerReply = { requestId: string; ok: boolean; data?: unknown; error?: string };
/** Client-side cancellation-safe worker client. A response only resolves its own request id. */
export class ObservatoryWorkerClient {
 private worker: Worker; private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
 constructor() { this.worker = new Worker(new URL('./observatory.worker.ts', import.meta.url)); this.worker.onmessage = ({ data }: MessageEvent<WorkerReply>) => { const pending = this.pending.get(data.requestId); if (!pending) return; this.pending.delete(data.requestId); data.ok ? pending.resolve(data.data) : pending.reject(new Error(data.error || 'Worker calculation failed.')); }; }
 private request<T>(type: WorkerRequest['type'], body: AstronomicalBody, instant: Date, observer: ObserverLocation): Promise<T> { const requestId = crypto.randomUUID(); return new Promise<T>((resolve, reject) => { this.pending.set(requestId, { resolve: (value) => resolve(value as T), reject }); this.worker.postMessage({ requestId, type, body, instant: instant.toISOString(), observer } satisfies WorkerRequest); }); }
 position(body: AstronomicalBody, instant: Date, observer: ObserverLocation) { return this.request<AstronomySnapshot>('CALCULATE_POSITION', body, instant, observer); }
 events(body: AstronomicalBody, instant: Date, observer: ObserverLocation) { return this.request<RiseTransitSet>('CALCULATE_EVENTS', body, instant, observer); }
 destroy() { this.pending.forEach(({ reject }) => reject(new Error('Worker destroyed.'))); this.pending.clear(); this.worker.terminate(); }
}
