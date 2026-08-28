/**
 * CosmicTantra — Free WhatsApp Help Desk & Intent Engine
 * Canonical Help Desk Phone: +91 9972934937
 * WhatsApp Click-to-Chat Format: https://wa.me/919972934937
 */

export type HelpDeskSource =
  | 'HOME'
  | 'ASK'
  | 'KUNDLI'
  | 'CAREER'
  | 'MARRIAGE'
  | 'PUJA'
  | 'DARSHAN'
  | 'REPORT'
  | 'CHECKOUT'
  | 'OTHER';

export type HelpDeskAvailability = 'AVAILABLE' | 'BUSY' | 'CLOSED' | 'UNKNOWN';

export interface HelpDeskIntent {
  sessionId: string;
  userId?: string;
  profileId?: string;
  source: HelpDeskSource;
  campaign?: string;
  topic?: string;
  language?: 'hi' | 'en';
  createdAt: string;
}

export const CANONICAL_HELP_DESK_NUMBER = '919972934937';
export const FORMATTED_HELP_DESK_NUMBER = '+91 9972934937';
export const HELP_DESK_STORAGE_KEY = 'cosmictantra_helpdesk_intent';

/**
 * Get contextual pre-filled WhatsApp message
 */
export function getPrefilledMessage(source: HelpDeskSource = 'HOME', topic?: string, lang: 'hi' | 'en' = 'hi'): string {
  if (lang === 'en') {
    switch (source) {
      case 'CAREER':
        return 'Namaste 🙏 I would like help regarding Career / Business Astrology Consultation.';
      case 'MARRIAGE':
        return 'Namaste 🙏 I would like help regarding Kundali Milan & Marriage Astrology Consultation.';
      case 'PUJA':
        return 'Namaste 🙏 I would like help regarding Vedic Puja & Ritual Booking.';
      case 'DARSHAN':
        return 'Namaste 🙏 I would like help regarding Live Temple Darshan & Seva.';
      case 'KUNDLI':
        return 'Namaste 🙏 I would like help understanding my Kundli & Consultation options.';
      case 'ASK':
        return topic ? `Namaste 🙏 I would like guidance on: ${topic}` : 'Namaste 🙏 I have an astrology question and need consultation assistance.';
      case 'CHECKOUT':
        return 'Namaste 🙏 I need assistance completing my consultation booking / payment.';
      default:
        return 'Namaste 🙏 I would like help regarding a CosmicTantra consultation.';
    }
  }

  // Hindi default
  switch (source) {
    case 'CAREER':
      return 'नमस्ते 🙏 मुझे करियर / व्यवसाय संबंधी ज्योतिष परामर्श में सहायता चाहिए।';
    case 'MARRIAGE':
      return 'नमस्ते 🙏 मुझे विवाह एवं कुण्डली मिलान परामर्श के संबंध में सहायता चाहिए।';
    case 'PUJA':
      return 'नमस्ते 🙏 मुझे पूजा बुकिंग व अनुष्ठान के संबंध में सहायता चाहिए।';
    case 'DARSHAN':
      return 'नमस्ते 🙏 मुझे मंदिर दर्शन व संकल्प सेवा के संबंध में सहायता चाहिए।';
    case 'KUNDLI':
      return 'नमस्ते 🙏 मुझे अपनी जन्मकुण्डली व परामर्श विकल्पों के संबंध में सहायता चाहिए।';
    case 'ASK':
      return topic ? `नमस्ते 🙏 मुझे '${topic}' विषय पर परामर्श सहायता चाहिए।` : 'नमस्ते 🙏 मुझे ज्योतिष परामर्श के संबंध में सहायता चाहिए।';
    case 'CHECKOUT':
      return 'नमस्ते 🙏 मुझे परामर्श बुकिंग व भुगतान में सहायता चाहिए।';
    default:
      return 'नमस्ते 🙏 मुझे CosmicTantra परामर्श के संबंध में सहायता चाहिए।';
  }
}

/**
 * Generate official WhatsApp Click-to-Chat URL
 * WhatsApp requires full international format without +, dashes or spaces: 919972934937
 */
export function generateWhatsAppHelpUrl(intent: Partial<HelpDeskIntent> = {}): string {
  const text = getPrefilledMessage(intent.source || 'HOME', intent.topic, intent.language || 'hi');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${CANONICAL_HELP_DESK_NUMBER}?text=${encodedText}`;
}

/**
 * Track and persist Help Desk Intent before navigating out of application
 */
export function trackHelpDeskIntent(params: {
  source: HelpDeskSource;
  campaign?: string;
  topic?: string;
  userId?: string;
  profileId?: string;
  language?: 'hi' | 'en';
}): HelpDeskIntent {
  const sessionId = `hd_intent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const intent: HelpDeskIntent = {
    sessionId,
    source: params.source,
    campaign: params.campaign,
    topic: params.topic,
    userId: params.userId,
    profileId: params.profileId,
    language: params.language || 'hi',
    createdAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HELP_DESK_STORAGE_KEY, JSON.stringify(intent));
      // Dispatch custom telemetry event
      window.dispatchEvent(new CustomEvent('cosmictantra:helpdesk-intent', { detail: intent }));
    } catch {}
  }

  return intent;
}

/**
 * Check Help Desk Availability status
 */
export function getHelpDeskAvailability(): {
  status: HelpDeskAvailability;
  badgeText: string;
  badgeTextHi: string;
  description: string;
  descriptionHi: string;
} {
  const now = new Date();
  // IST hours
  const utcHours = now.getUTCHours();
  const istHours = (utcHours + 5.5) % 24;

  if (istHours >= 8 && istHours < 22) {
    return {
      status: 'AVAILABLE',
      badgeText: '🟢 Help Desk Available',
      badgeTextHi: '🟢 सहायता केंद्र उपलब्ध',
      description: 'Usually answered within a few minutes on WhatsApp voice call.',
      descriptionHi: 'व्हाट्सएप वॉइस कॉल पर सामान्यतः कुछ ही मिनटों में उत्तर दिया जाता है।'
    };
  }

  return {
    status: 'CLOSED',
    badgeText: '🔴 Closed for the Night',
    badgeTextHi: '🔴 सहायता केंद्र अभी बंद है',
    description: 'Operating Hours: 08:00 AM – 10:00 PM IST. Send a WhatsApp message for priority morning callback.',
    descriptionHi: 'कार्य समय: प्रातः 08:00 से रात्रि 10:00 बजे तक। व्हाट्सएप संदेश भेजें, प्रातः प्राथमिकता से संपर्क किया जाएगा।'
  };
}
