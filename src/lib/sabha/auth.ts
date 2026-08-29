import crypto from 'crypto';
import { ParticipantRole } from './types';
import { SabhaSessionStore } from './store';

export interface ParticipantTokenPayload {
  sessionId: string;
  participantId: string;
  role: ParticipantRole;
  permissions: string[];
  expiresAt: number;
}

export class SabhaAuthTokenEngine {
  private static SECRET = process.env.SABHA_AUTH_SECRET || 'sabha_cryptographic_secret_2026';

  /**
   * Generates a tamper-proof short-lived token binding session, participant, role, and expiry.
   */
  static generateToken(
    sessionId: string,
    participantId: string,
    role: ParticipantRole,
    expiresInMinutes: number = 60
  ): string {
    const permissions = this.getPermissionsForRole(role);
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;

    const payload: ParticipantTokenPayload = {
      sessionId,
      participantId,
      role,
      permissions,
      expiresAt
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.SECRET)
      .update(payloadBase64)
      .digest('base64url');

    return `${payloadBase64}.${signature}`;
  }

  /**
   * Validates participant token, verifies session match, role authorization, and expiration.
   */
  static verifyToken(token: string, targetSessionId?: string): {
    valid: boolean;
    payload?: ParticipantTokenPayload;
    error?: string;
  } {
    if (!token || !token.includes('.')) {
      return { valid: false, error: 'Malformed token structure.' };
    }

    const [payloadBase64, signature] = token.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', this.SECRET)
      .update(payloadBase64)
      .digest('base64url');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return { valid: false, error: 'Cryptographic token signature mismatch.' };
    }

    try {
      const payload: ParticipantTokenPayload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));

      if (Date.now() > payload.expiresAt) {
        return { valid: false, error: 'Participant token has expired.' };
      }

      if (targetSessionId && payload.sessionId !== targetSessionId) {
        return { valid: false, error: 'Token is not authorized for target session.' };
      }

      const session = SabhaSessionStore.get(payload.sessionId);
      if (!session) {
        return { valid: false, error: 'Associated consultation session does not exist.' };
      }

      return { valid: true, payload };
    } catch {
      return { valid: false, error: 'Failed to decode token payload.' };
    }
  }

  private static getPermissionsForRole(role: ParticipantRole): string[] {
    switch (role) {
      case 'SCHOLAR':
        return ['AUDIO_TALK', 'EMIT_CHART_EVENT', 'EDIT_SCHOLAR_NOTES', 'PRESCRIBE_UPAYA', 'COMPLETE_SESSION'];
      case 'DEVOTEE':
        return ['AUDIO_TALK', 'RECEIVE_CHART_EVENT', 'VIEW_FOLIO'];
      case 'FAMILY_MEMBER':
        return ['AUDIO_TALK', 'RECEIVE_CHART_EVENT'];
      case 'ADMIN':
        return ['ADMIN_OVERRIDE', 'INITIATE_PSTN', 'EXECUTE_REFUND', 'VIEW_TELEMETRY'];
      default:
        return [];
    }
  }
}
