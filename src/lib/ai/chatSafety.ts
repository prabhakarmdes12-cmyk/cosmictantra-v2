import { evaluateSafetyCritical } from './safety';

/** Shared first gate for both chat UIs, before mood, intake or astrology. */
export function getChatSafetyReply(query: string, lang: string = 'hi'): string | null {
  const result = evaluateSafetyCritical(query);
  if (!result.isCritical) return null;
  return (lang === 'en' ? result.safetyNoticeEn : result.safetyNoticeHi) + '\n\n' +
    result.emergencyHelplines.map(h => `${h.name}: ${h.number}`).join('\n');
}
