import crypto from 'crypto';
import { ConsultationSession } from './types';
import { SabhaStateMachine } from './stateMachine';
import { SabhaSessionStore } from './store';

export interface RazorpayVerificationParams {
  sessionId: string;
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
  idempotencyKey?: string;
}

export class SabhaPaymentEngine {
  /**
   * Cryptographically verifies Razorpay payment signature using constant-time comparison.
   * Enforces INV-SABHA-001: No verified payment -> No paid consultation access.
   */
  static verifyAndEntitleSession(params: RazorpayVerificationParams): {
    success: boolean;
    session?: ConsultationSession;
    error?: string;
  } {
    const { sessionId, orderId, paymentId, signature, idempotencyKey } = params;
    const secret = params.secret || process.env.RAZORPAY_KEY_SECRET || 'rzp_live_secret_invariant';

    const session = SabhaSessionStore.get(sessionId);
    if (!session) {
      return { success: false, error: `Session "${sessionId}" not found.` };
    }

    // Idempotency check: if this key was already processed, return existing state
    const iKey = idempotencyKey || `pay_${orderId}_${paymentId}`;
    if (SabhaSessionStore.isIdempotencyKeyProcessed(iKey)) {
      if (session.payment.isVerified && (session.state === 'PAID' || session.state === 'SCHEDULED' || session.state === 'ACTIVE')) {
        return { success: true, session };
      }
    }

    // HMAC-SHA256 signature verification
    const expectedPayload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(expectedPayload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature || '', 'utf8');

    let isValid = false;
    if (expectedBuffer.length === receivedBuffer.length) {
      isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    }

    if (!isValid) {
      // Mark payment failed in state machine
      SabhaStateMachine.transition(session, 'FAIL_PAYMENT', {
        sessionId,
        actor: 'PAYMENT_GATEWAY',
        actorId: 'RAZORPAY',
        idempotencyKey: iKey,
        timestamp: Date.now(),
        payload: { error: 'Cryptographic signature mismatch' }
      });
      SabhaSessionStore.save(session);
      return { success: false, error: 'INV-SABHA-001: Invalid Razorpay cryptographic signature.' };
    }

    // Payment Signature Verified! Set verified status on session
    session.payment.isVerified = true;
    session.payment.razorpayOrderId = orderId;
    session.payment.razorpayPaymentId = paymentId;
    session.payment.razorpaySignature = signature;
    session.payment.verifiedAt = Date.now();

    // Transition state from PAYMENT_PENDING -> PAID
    const transitionRes = SabhaStateMachine.transition(session, 'VERIFY_PAYMENT', {
      sessionId,
      actor: 'PAYMENT_GATEWAY',
      actorId: 'RAZORPAY',
      idempotencyKey: iKey,
      timestamp: Date.now(),
      payload: { orderId, paymentId }
    });

    if (!transitionRes.success) {
      return { success: false, error: transitionRes.error };
    }

    SabhaSessionStore.recordAudit(transitionRes.auditLog);
    SabhaSessionStore.markIdempotencyKeyProcessed(iKey);
    SabhaSessionStore.save(session);

    return { success: true, session };
  }
}
