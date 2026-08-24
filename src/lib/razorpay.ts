import crypto from 'crypto';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayConfig(): RazorpayConfig | null {
  if (!isRazorpayConfigured()) return null;
  return {
    keyId: process.env.RAZORPAY_KEY_ID as string,
    keySecret: process.env.RAZORPAY_KEY_SECRET as string,
  };
}

export function getRazorpayClientKey(): string | null {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || (getRazorpayConfig()?.keyId ?? null);
}

/**
 * Creates a Razorpay Order server-side (money is only captured on signature
 * verification). Returns null when Razorpay is not configured.
 */
export async function createRazorpayOrder(amountPaise: number, receipt: string, notes: Record<string, string> = {}) {
  const cfg = getRazorpayConfig();
  if (!cfg) return null;

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Razorpay order creation failed:', res.status, errText);
    throw new Error('Razorpay order creation failed');
  }

  return res.json();
}

/**
 * Verifies the client-side checkout signature: HMAC-SHA256(`orderId|paymentId`).
 * This is the authoritative "money actually captured" check.
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const cfg = getRazorpayConfig();
  if (!cfg) return false;

  try {
    const expected = crypto
      .createHmac('sha256', cfg.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature || '');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
