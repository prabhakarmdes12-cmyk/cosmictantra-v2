export type FunnelStep =
  | 'CHAT_OPENED'
  | 'INTENT_RESOLVED'
  | 'TOOL_USED'
  | 'FREE_RESULT_SHOWN'
  | 'PROFILE_REQUESTED'
  | 'PROFILE_COMPLETED'
  | 'HUMAN_BOUNDARY_SHOWN'
  | 'SCHOLAR_PROFILE_VIEWED'
  | 'CONSULTATION_STARTED'
  | 'CHECKOUT_STARTED'
  | 'PAID';

export interface TelemetryEvent {
  step: FunnelStep;
  sessionId: string;
  intent?: string;
  toolName?: string;
  scholarId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class TelemetryStore {
  private events: TelemetryEvent[] = [];

  public log(step: FunnelStep, sessionId: string, metadata?: Record<string, any>): void {
    this.events.push({
      step,
      sessionId,
      timestamp: Date.now(),
      metadata
    });
  }

  public getFunnelMetrics(): Record<FunnelStep, number> {
    const counts: Record<string, number> = {};
    for (const e of this.events) {
      counts[e.step] = (counts[e.step] || 0) + 1;
    }
    return counts as Record<FunnelStep, number>;
  }

  public clear(): void {
    this.events = [];
  }
}

export const KashiSahayakTelemetry = new TelemetryStore();
