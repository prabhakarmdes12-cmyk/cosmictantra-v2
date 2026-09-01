/**
 * KASHI SAHAYAK — proactive recitation offer policy.
 *
 * The capability should be offered at the moments it is useful and then get
 * out of the way. This module decides when, and guarantees the offer is not
 * repeated after every response.
 */

import type { KashiSession } from './interaction';

export type OfferTrigger =
  | 'first-interaction'
  | 'scripture-area-open'
  | 'after-emotional-response'
  | 'capability-question'
  | 'ordinary-response';

export const CAPABILITY_INTRO =
  'मैं आपकी बात सुन सकती हूँ और प्रमाणित ग्रन्थों से श्लोक या पाठ सुना सकती हूँ। ' +
  'आप चाहें तो गीता का अध्याय, कोई विशेष श्लोक, आरती या उपलब्ध स्तोत्र सुन सकती हैं।';

export const CAPABILITY_INTRO_EN =
  'I can listen to you and recite a shloka or a passage from the verified texts. ' +
  'You can hear a chapter of the Gita, a specific verse, an aarti, or an available stotra.';

export interface OfferContext {
  trigger: OfferTrigger;
  /** Has the capability already been offered in this session? */
  offeredThisSession: boolean;
  /** Is a verified passage available right now? */
  hasVerseAvailable: boolean;
  mode: KashiSession['mode'];
}

export interface OfferDecision {
  show: boolean;
  text: string | null;
  reason: string;
}

/**
 * The offer appears on the first suitable interaction, when the scripture
 * area is opened, after an emotional response that has a verse, and when the
 * user asks what Kashi Sahayak can do. It is never shown on an ordinary
 * response, and at most once per session.
 */
export function decideOffer(ctx: OfferContext, language: 'hi' | 'en' = 'hi'): OfferDecision {
  const intro = language === 'hi' ? CAPABILITY_INTRO : CAPABILITY_INTRO_EN;

  if (ctx.mode === 'conversation-only' && ctx.trigger !== 'capability-question') {
    return { show: false, text: null, reason: 'conversation-only mode suppresses offers' };
  }
  if (ctx.offeredThisSession && ctx.trigger !== 'capability-question') {
    return { show: false, text: null, reason: 'already offered once this session' };
  }
  if (ctx.trigger === 'ordinary-response') {
    return { show: false, text: null, reason: 'never advertised after every response' };
  }
  if (ctx.trigger === 'after-emotional-response' && !ctx.hasVerseAvailable) {
    return { show: false, text: null, reason: 'no relevant verse to offer' };
  }
  return { show: true, text: intro, reason: `trigger: ${ctx.trigger}` };
}

/** The short consent question used before any long reading. */
export function longReadingConsent(scope: 'chapter' | 'book', language: 'hi' | 'en' = 'hi'): string {
  if (language === 'en') {
    return scope === 'book'
      ? 'This is a complete text. Shall I read it in parts, or just a short passage for now?'
      : 'This is a full chapter. Shall I read the whole chapter, or a short passage?';
  }
  return scope === 'book'
    ? 'यह एक पूरा ग्रन्थ है — क्या मैं इसे भागों में पढ़ूँ, या अभी केवल छोटा-सा अंश?'
    : 'यह पूरा अध्याय है — क्या मैं पूरा अध्याय पढ़ूँ, या छोटा-सा अंश?';
}

/** Gentle one-at-a-time questions from the mission brief. */
export const GENTLE_QUESTIONS = {
  origin: 'यह भावना किसी हाल की घटना से जुड़ी है या कुछ समय से बनी हुई है?',
  mode: 'आप अभी केवल बात करना चाहती हैं, कोई श्लोक सुनना चाहती हैं, या दोनों?',
  length: 'आप पूरा पाठ सुनना चाहेंगी या छोटा-सा अंश?',
  meaning: 'क्या मैं इसका सरल अर्थ भी साथ बताऊँ?',
  voice: 'आप चाहें तो बोलकर भी बता सकती हैं।',
} as const;
