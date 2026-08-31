/**
 * Conversation preferences a seeker states explicitly.
 *
 * Phase 3 rule: a person who says "बस बात करो" or "श्लोक मत सुनाओ" is telling us
 * how they want to be treated. That instruction outranks scripture retrieval,
 * chart intake and commercial routing. These are the ONLY two preferences
 * handled here; reading-specific preferences (अर्थ भी / सिर्फ मूल / गति) belong
 * to the reader command layer in `src/lib/granth/commands.ts`.
 */

export type ConversationPreference = 'DECLINE_SCRIPTURE' | 'ONLY_LISTEN';

const DECLINE_SCRIPTURE =
  /श्लोक\s*(मत|नहीं)|श्लोक\s*मत\s*सुनाओ|मन्त्र\s*(मत|नहीं)|मंत्र\s*(मत|नहीं)|गीता\s*मत|शास्त्र\s*(मत|नहीं)|कोई\s*श्लोक\s*नहीं|बस\s*बात\s*करो|सिर्फ\s*बात|बात\s*करनी\s*है\s*श्लोक\s*नहीं|no\s*shloka|no\s*scripture|don'?t\s*quote|do\s*not\s*quote|just\s*talk|without\s*shloka/i;

const ONLY_LISTEN = /बस\s*सुनना\s*(है|ही\s*है)|सिर्फ\s*सुनना\s*है|केवल\s*सुनना\s*है|just\s*listen|only\s*listening|i\s*just\s*want\s*to\s*listen/i;

export function detectConversationPreference(query: string): ConversationPreference | null {
  const q = String(query || '').trim();
  if (!q) return null;
  if (DECLINE_SCRIPTURE.test(q)) return 'DECLINE_SCRIPTURE';
  if (ONLY_LISTEN.test(q)) return 'ONLY_LISTEN';
  return null;
}

/**
 * Reply for a stated preference. Deliberately contains no quotation, no
 * upsell and no intake question — just presence and an open door.
 */
export function preferenceReply(preference: ConversationPreference, lang: 'hi' | 'en'): string {
  if (preference === 'DECLINE_SCRIPTURE') {
    return lang === 'en'
      ? 'Of course — no shloka, no mantra, no consultation pitch. I am here to listen. Tell me what is on your mind, in whatever words come.'
      : 'जी, बिलकुल — न कोई श्लोक, न मन्त्र, न कोई सुझाव। मैं बस आपकी बात सुन रही हूँ। जो मन में है, अपने शब्दों में कहिए — जल्दी की कोई शर्त नहीं।';
  }
  return lang === 'en'
    ? 'I will just listen. Say as much or as little as you like; I will not push anything on you.'
    : 'मैं बस सुनती हूँ। जितना चाहें उतना कहिए — मैं आप पर कोई बात थोपूँगी नहीं।';
}
