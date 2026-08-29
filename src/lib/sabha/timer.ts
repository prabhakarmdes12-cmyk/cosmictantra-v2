import { ConsultationSession } from './types';

export interface SabhaTimerState {
  sessionId: string;
  state: ConsultationSession['state'];
  startedAt?: number;
  totalEntitledSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  isGracePeriod: boolean;
  isExpired: boolean;
  statusText: string;
}

export class SabhaTimerEngine {
  /**
   * Derives display time and authority strictly from server timestamps.
   * Immune to client-side setInterval manipulation, tab-closing, or browser refreshing.
   */
  static computeTimerState(session: ConsultationSession, currentServerTime: number = Date.now()): SabhaTimerState {
    const totalEntitled = session.entitledDurationSeconds + session.extensionSeconds;

    if (!session.startedAt || session.state === 'DRAFT' || session.state === 'PAYMENT_PENDING' || session.state === 'PAID' || session.state === 'SCHEDULED' || session.state === 'READY') {
      return {
        sessionId: session.sessionId,
        state: session.state,
        startedAt: session.startedAt,
        totalEntitledSeconds: totalEntitled,
        elapsedSeconds: 0,
        remainingSeconds: totalEntitled,
        isGracePeriod: false,
        isExpired: false,
        statusText: 'परामर्श प्रारम्भ की प्रतीक्षा'
      };
    }

    if (session.state === 'COMPLETED' || session.endedAt) {
      const finalElapsed = session.endedAt ? Math.floor((session.endedAt - session.startedAt) / 1000) : totalEntitled;
      return {
        sessionId: session.sessionId,
        state: session.state,
        startedAt: session.startedAt,
        totalEntitledSeconds: totalEntitled,
        elapsedSeconds: finalElapsed,
        remainingSeconds: 0,
        isGracePeriod: false,
        isExpired: true,
        statusText: 'परामर्श सम्पन्न'
      };
    }

    // Active or Grace Period
    const elapsedSeconds = Math.max(0, Math.floor((currentServerTime - session.startedAt) / 1000));
    const remainingSeconds = Math.max(0, totalEntitled - elapsedSeconds);
    const isGracePeriod = elapsedSeconds >= totalEntitled && elapsedSeconds < totalEntitled + session.gracePeriodSeconds;
    const isExpired = elapsedSeconds >= totalEntitled + session.gracePeriodSeconds;

    let statusText = 'सक्रिय परामर्श';
    if (remainingSeconds <= 300 && remainingSeconds > 120) {
      statusText = '५ मिनट शेष (स्मरण सूचना)';
    } else if (remainingSeconds <= 120 && remainingSeconds > 30) {
      statusText = '२ मिनट शेष';
    } else if (remainingSeconds <= 30 && remainingSeconds > 0) {
      statusText = 'परामर्श समापन वेला';
    } else if (isGracePeriod) {
      statusText = 'अतिरिक्त अनुग्रह अवधि (Grace Period)';
    } else if (isExpired) {
      statusText = 'परामर्श समय समाप्त';
    }

    return {
      sessionId: session.sessionId,
      state: session.state,
      startedAt: session.startedAt,
      totalEntitledSeconds: totalEntitled,
      elapsedSeconds,
      remainingSeconds,
      isGracePeriod,
      isExpired,
      statusText
    };
  }
}
