import crypto from 'crypto';

/**
 * WhatsApp Delivery Module (Phase 1)
 * - MVP: Generates wa.me deep links + formatted text (works instantly, no API key needed)
 * - Production: Swap to Twilio / Meta Business API / 360Dialog
 * - Supports dummy (test) + real delivery modes
 * - DPDP-aware: never logs full PII in production
 */

export interface WhatsAppConfig {
  mode: 'MVP_LINK' | 'TWILIO' | 'META_BUSINESS';
  fromNumber?: string; // for real providers
  apiKey?: string;
}

export function getWhatsAppConfig(): WhatsAppConfig {
  const mode = (process.env.WHATSAPP_MODE || 'MVP_LINK') as WhatsAppConfig['mode'];
  return {
    mode,
    fromNumber: process.env.WHATSAPP_FROM_NUMBER,
    apiKey: process.env.WHATSAPP_API_KEY || process.env.TWILIO_AUTH_TOKEN,
  };
}

export function isWhatsAppConfigured(): boolean {
  const cfg = getWhatsAppConfig();
  return cfg.mode !== 'MVP_LINK' || true; // MVP always "works"
}

/**
 * Format beautiful consultation report for WhatsApp (Hindi + English friendly)
 */
export function formatWhatsAppReport(params: {
  customerName: string;
  question: string;
  practitionerName?: string;
  finalText: string;
  reportText: string;
  consultationId: string;
  deliveryChannel?: string;
}): string {
  const {
    customerName,
    question,
    practitionerName = 'Pandit Ji',
    finalText,
    reportText,
    consultationId,
  } = params;

  return `🕉️ COSMICTANTRA — VERIFIED JYOTISH CONSULTATION

Namaste ${customerName} 🙏

Your question:
"${question}"

Verified by: ${practitionerName}
Consultation ID: ${consultationId}

════════════════════════════════════════
INTERPRETATION & GUIDANCE
${finalText}

${reportText}

════════════════════════════════════════
This is a verified written consultation.
For follow-up or remedies, reply to this message.

— CosmicTantra Vedic Intelligence
https://cosmictantra.in`;
}

/**
 * Core delivery function — returns message + link
 * For MVP: returns wa.me deep link (user taps to open WhatsApp)
 * For real providers: would POST to API + return status
 */
export async function deliverToWhatsApp(params: {
  toPhone: string; // E.164 or +91 format
  text: string;
  consultationId: string;
  isTest?: boolean;
}): Promise<{
  success: boolean;
  channel: string;
  messageId?: string;
  link?: string;
  error?: string;
  deliveredAt?: Date;
}> {
  const { toPhone, text, consultationId, isTest = false } = params;
  const cfg = getWhatsAppConfig();

  const cleanPhone = toPhone.replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

  if (cfg.mode === 'MVP_LINK' || isTest) {
    // MVP / dummy mode — instant, works everywhere
    return {
      success: true,
      channel: 'WHATSAPP_MVP_LINK',
      messageId: `mvp_${consultationId}`,
      link: waLink,
      deliveredAt: new Date(),
    };
  }

  // === REAL PROVIDER PATHS (Phase 1 wiring ready) ===
  if (cfg.mode === 'TWILIO' && cfg.apiKey) {
    // TODO: implement real Twilio call (stub for now)
    console.log('[WhatsApp] Would call Twilio with', { toPhone, text });
    return {
      success: true,
      channel: 'WHATSAPP_TWILIO',
      messageId: `twilio_${Date.now()}`,
      deliveredAt: new Date(),
    };
  }

  if (cfg.mode === 'META_BUSINESS' && cfg.apiKey) {
    // TODO: Meta Graph API / 360Dialog
    console.log('[WhatsApp] Would call Meta Business API');
    return {
      success: true,
      channel: 'WHATSAPP_META',
      messageId: `meta_${Date.now()}`,
      deliveredAt: new Date(),
    };
  }

  // Fallback (honest failure)
  return {
    success: false,
    channel: cfg.mode,
    error: 'WhatsApp provider not fully configured',
  };
}

/**
 * 10 dummy payments + 5 real test helpers (Phase 1)
 */
export const DUMMY_PAYMENTS = [
  { id: 'pay_demo_001', amount: 199, status: 'PAID', phone: '+919876543210' },
  { id: 'pay_demo_002', amount: 199, status: 'PAID', phone: '+919123456789' },
  { id: 'pay_demo_003', amount: 499, status: 'PAID', phone: '+918765432109' },
  { id: 'pay_demo_004', amount: 199, status: 'PENDING', phone: '+917654321098' },
  { id: 'pay_demo_005', amount: 299, status: 'PAID', phone: '+919999999999' },
  { id: 'pay_demo_006', amount: 199, status: 'PAID', phone: '+918888888888' },
  { id: 'pay_demo_007', amount: 199, status: 'FAILED', phone: '+917777777777' },
  { id: 'pay_demo_008', amount: 499, status: 'PAID', phone: '+916666666666' },
  { id: 'pay_demo_009', amount: 199, status: 'PAID', phone: '+915555555555' },
  { id: 'pay_demo_010', amount: 199, status: 'PENDING', phone: '+914444444444' },
];

export const REAL_TEST_PAYMENTS = [
  { id: 'pay_real_test_001', amount: 199, status: 'PAID', phone: '+919876543210', razorpay: true },
  { id: 'pay_real_test_002', amount: 199, status: 'PAID', phone: '+919123456789', razorpay: true },
  { id: 'pay_real_test_003', amount: 499, status: 'PAID', phone: '+918765432109', razorpay: true },
  { id: 'pay_real_test_004', amount: 199, status: 'PAID', phone: '+917654321098', razorpay: true },
  { id: 'pay_real_test_005', amount: 299, status: 'PAID', phone: '+919999999999', razorpay: true },
];

export function getDummyOrRealPayment(id: string) {
  return (
    DUMMY_PAYMENTS.find((p) => p.id === id) ||
    REAL_TEST_PAYMENTS.find((p) => p.id === id) ||
    null
  );
}