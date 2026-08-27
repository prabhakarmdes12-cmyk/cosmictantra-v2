import { SabhaSemanticEvent, ConsultationSession } from './types';
import { SabhaSessionStore } from './store';

export class SabhaEventEngine {
  private static EVENT_LOGS: Map<string, SabhaSemanticEvent[]> = new Map();

  /**
   * Broadcasts and validates a versioned semantic chart event.
   */
  static emitEvent(
    session: ConsultationSession,
    type: SabhaSemanticEvent['type'],
    actor: SabhaSemanticEvent['actor'],
    payload: SabhaSemanticEvent['payload']
  ): { success: boolean; event?: SabhaSemanticEvent; error?: string } {
    session.eventSequence = (session.eventSequence || 0) + 1;
    const event: SabhaSemanticEvent = {
      eventId: `EVT-${session.sessionId}-${session.eventSequence}`,
      sessionId: session.sessionId,
      sequence: session.eventSequence,
      timestamp: Date.now(),
      actor,
      schemaVersion: '1.0.0',
      type,
      payload
    };

    // Update canonical view state on session
    if (type === 'BHAVA_FOCUS' && payload.bhavaNumber !== undefined) {
      session.currentChartFocus.bhavaNumber = payload.bhavaNumber;
    } else if (type === 'PLANET_FOCUS' && payload.planet !== undefined) {
      session.currentChartFocus.planet = payload.planet;
    } else if (type === 'DASHA_FOCUS' && payload.dashaKey !== undefined) {
      session.currentChartFocus.dashaKey = payload.dashaKey;
    } else if (type === 'VIEW_RESET') {
      session.currentChartFocus = {};
    }

    const list = this.EVENT_LOGS.get(session.sessionId) || [];
    list.push(event);
    this.EVENT_LOGS.set(session.sessionId, list);

    SabhaSessionStore.save(session);
    return { success: true, event };
  }

  /**
   * Query Canonical Current View State on Reconnect (No blind historical playback needed).
   */
  static getCanonicalViewState(sessionId: string): {
    sessionId: string;
    sequence: number;
    currentChartFocus: ConsultationSession['currentChartFocus'];
    prescribedUpayas: string[];
    recommendedWindow?: string;
  } | null {
    const session = SabhaSessionStore.get(sessionId);
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      sequence: session.eventSequence,
      currentChartFocus: session.currentChartFocus,
      prescribedUpayas: session.scholarRecord.prescribedUpayas || [],
      recommendedWindow: session.scholarRecord.recommendedMuhuratWindow
    };
  }
}
