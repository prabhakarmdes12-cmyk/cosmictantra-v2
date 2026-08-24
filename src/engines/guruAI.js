/**
 * CosmicTantra V34 — Guru AI Engine & System Prompt Builder
 * Generates prompt templates, structured working drafts,
 * and handles server-side API integration boundaries.
 */

export const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧', greeting: 'Namaste! I am Guru Jyotishdev.' },
  hi: { name: 'हिंदी', flag: '🇮🇳', greeting: 'नमस्ते! मैं गुरु ज्योतिषदेव हूं।' },
  bn: { name: 'বাংলা', flag: '🇮🇳', greeting: 'নমস্কার! আমি গুরু জ্যোতিষদেব।' },
  ta: { name: 'தமிழ்', flag: '🇮🇳', greeting: 'வணக்கம்! நான் குரு ஜோதிஷ்தேவ்.' },
  te: { name: 'తెలుగు', flag: '🇮🇳', greeting: 'నమస్కారం! నేను గురు జ్యోతిష్దేవ్.' },
  mr: { name: 'मराठी', flag: '🇮🇳', greeting: 'नमस्कार! मी गुरु ज्योतिषदेव आहे.' },
};

export function buildSystemPrompt(language = 'en', kundali = null) {
  let prompt = `You are Guru Jyotishdev, a wise Vedic Astrologer (Jyotishi) trained in Parashari Jyotish and Classical Tantric Traditions.
Language: Respond in ${LANGUAGES[language]?.name || 'English'}.
Tone: Deeply respectful, compassionate, authoritative, spiritual.

IMPORTANT OPERATIONAL POLICY:
- You perform initial astrological calculations and draft structured working interpretations for the Jyotish practitioner.
- Every interpretation delivered under the practitioner's name will be thoroughly verified and edited by a qualified Pandit.
- Frame your draft clearly, identifying key planetary influences, Dasha periods, and actionable remedies.
`;

  if (kundali) {
    prompt += `
CLIENT KUNDALI SNAPSHOT:
- Lagna (Ascendant): ${kundali.lagna?.rasiName} (${kundali.lagna?.nakshatra?.name} Nakshatra)
- Sun: ${kundali.planets?.Sun?.rasiName} (House ${kundali.planets?.Sun?.house})
- Moon: ${kundali.planets?.Moon?.rasiName} (House ${kundali.planets?.Moon?.house}, ${kundali.planets?.Moon?.nakshatra?.name} Nakshatra)
- Mars: ${kundali.planets?.Mars?.rasiName} (House ${kundali.planets?.Mars?.house}, Status: ${kundali.planets?.Mars?.status})
- Mercury: ${kundali.planets?.Mercury?.rasiName} (House ${kundali.planets?.Mercury?.house})
- Jupiter: ${kundali.planets?.Jupiter?.rasiName} (House ${kundali.planets?.Jupiter?.house}, Status: ${kundali.planets?.Jupiter?.status})
- Venus: ${kundali.planets?.Venus?.rasiName} (House ${kundali.planets?.Venus?.house})
- Saturn: ${kundali.planets?.Saturn?.rasiName} (House ${kundali.planets?.Saturn?.house}, Status: ${kundali.planets?.Saturn?.status})
- Rahu: ${kundali.planets?.Rahu?.rasiName} (House ${kundali.planets?.Rahu?.house})
- Ketu: ${kundali.planets?.Ketu?.rasiName} (House ${kundali.planets?.Ketu?.house})
`;
  }

  return prompt;
}

export function generateRemedies(kundali) {
  const remedies = [];
  if (!kundali) return remedies;

  const saturn = kundali.planets?.Saturn;
  if (saturn?.status === 'Debilitated') {
    remedies.push({
      planet: 'Saturn',
      type: 'Mantra & Charity',
      remedy: 'Recite Hanuman Chalisa daily and donate black sesame / mustard oil on Saturdays.',
    });
  }

  const jupiter = kundali.planets?.Jupiter;
  if (jupiter?.status === 'Debilitated') {
    remedies.push({
      planet: 'Jupiter',
      type: 'Vedic Ritual',
      remedy: 'Offer chana dal and turmeric to Vishnu / banana tree on Thursdays.',
    });
  }

  const rahu = kundali.planets?.Rahu;
  if ([1, 4, 7, 10].includes(rahu?.house)) {
    remedies.push({
      planet: 'Rahu',
      type: 'Mantra',
      remedy: 'Chant "Om Raam Rahve Namah" 108 times during evening hours.',
    });
  }

  const mars = kundali.planets?.Mars;
  if ([7, 8].includes(mars?.house)) {
    remedies.push({
      planet: 'Mars',
      type: 'Kuja Remedial Prayer',
      remedy: 'Recite Mangal Stotram and offer red flowers to Lord Subramanya / Hanuman.',
    });
  }

  return remedies;
}

export default {
  buildSystemPrompt,
  generateRemedies,
  LANGUAGES,
};
