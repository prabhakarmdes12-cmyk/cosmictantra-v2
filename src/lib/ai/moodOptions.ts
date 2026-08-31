/**
 * SEEKER MOOD QUICK-CHECK (आज आपका मन कैसा है?)
 * ------------------------------------------------------------------
 * A one-tap emotional check-in used at the very start of both Kashi Sahayak
 * conversations ( floating Sacred Concierge + consultation intake modal ).
 *
 * Why: the seeker immediately understands that Kashi Sahayak is not a cold
 * FAQ bot — it first listens to HOW they feel, acknowledges it warmly in one
 * breath, attaches an authentic shastra-anchored wisdom card, and only then
 * routes to the capability they need. Mood selections are also forwarded
 * into the scholar dossier so the human pandit already knows the seeker's
 * emotional state before the sabha begins.
 *
 * `insightId` maps to an entry of SCRIPTURE_WISDOM_REGISTRY
 * (src/lib/ai/scriptureMap.ts); `null` means no card is attached.
 */

export interface MoodOption {
  /** Stable id, also used as the quick-chip action (MOOD_*). */
  id: string;
  /** Label shown on the tap chip (emoji + Hindi). */
  chipLabel: string;
  /** English chip label (consultation modal EN mode). */
  chipLabelEn: string;
  /** Emoji-free label — stored in seeker data / dossiers / TTS-safe. */
  speakLabel: string;
  /** Warm 1–2 line spoken-style acknowledgment (Hindi). */
  acknowledgeHi: string;
  /** Warm acknowledgment (English). */
  acknowledgeEn: string;
  /** ScriptureInsight id for the attached wisdom card, or null. */
  insightId: string | null;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'MOOD_CALM',
    chipLabel: '😌 मन शांत व प्रसन्न है',
    chipLabelEn: '😌 Feeling calm & good',
    speakLabel: 'मन शांत व प्रसन्न है',
    acknowledgeHi:
      'बहुत सुंदर! शांत मन ही सबसे बड़ा आशीर्वाद है। चलिए, आज के शुभ समय का सबसे अच्छा उपयोग करते हैं।',
    acknowledgeEn:
      'Wonderful! A calm mind is the greatest blessing. Let us put today’s auspicious hours to their best use.',
    insightId: null,
  },
  {
    id: 'MOOD_ANXIOUS',
    chipLabel: '😟 चिन्ता या डर लग रहा है',
    chipLabelEn: '😟 Anxious / worried',
    speakLabel: 'चिन्ता या डर',
    acknowledgeHi:
      'मैं समझती हूँ — भविष्य की चिन्ता मन को थका देती है। निर्भय रहिए, काशी की शास्त्र-परम्परा आपके साथ है।',
    acknowledgeEn:
      'I understand — worry about the future tires the mind. Be fearless; the Kashi tradition walks beside you.',
    insightId: 'FUTURE_ANXIETY',
  },
  {
    id: 'MOOD_SAD',
    chipLabel: '😔 मन उदास / भारी है',
    chipLabelEn: '😔 Feeling low / heavy',
    speakLabel: 'मन उदास या भारी है',
    acknowledgeHi:
      'आपके मन की भारी भावना मैं समझ रही हूँ। यह घड़ी भी बीत जाएगी — आप अकेले नहीं हैं, मैं आपके साथ हूँ।',
    acknowledgeEn:
      'I hear the heaviness in your heart. This hour too shall pass — you are not alone, I am right here with you.',
    insightId: 'SADNESS_GRIEF',
  },
  {
    id: 'MOOD_ANGRY',
    chipLabel: '😤 गुस्सा / बेचैनी है',
    chipLabelEn: '😤 Angry / restless',
    speakLabel: 'गुस्सा या बेचैनी',
    acknowledgeHi:
      'समझ गयी। क्रोध में लिया निर्णय पीछे खींच लेता है — पहले मन को शीतल करते हैं, फिर मिलकर मार्ग खोजेंगे।',
    acknowledgeEn:
      'Understood. Decisions taken in anger pull us back — let the mind cool first, then we find the path together.',
    insightId: 'ANGER_MANAGEMENT',
  },
  {
    id: 'MOOD_CONFUSED',
    chipLabel: '🤔 निर्णय में उलझन है',
    chipLabelEn: '🤔 Stuck on a decision',
    speakLabel: 'निर्णय में उलझन',
    acknowledgeHi:
      'चिंता न करें — हर श्रेष्ठ निर्णय से पहले उलझन आती है। शास्त्र और गणना के साथ स्पष्ट मार्ग खोजेंगे।',
    acknowledgeEn:
      'Do not worry — every great decision is preceded by confusion. With shastra and calculation we will find clarity.',
    insightId: 'DHARMA_CRISIS',
  },
  {
    id: 'MOOD_TIRED',
    chipLabel: '😓 मन थका / बोझिल लग रहा है',
    chipLabelEn: '😓 Overwhelmed / exhausted',
    speakLabel: 'मन थका या बोझिल है',
    acknowledgeHi:
      'मैं समझती हूँ — जब बहुत कुछ एक साथ आ जाए तो मन थक जाता है। घबराइए नहीं, हम एक-एक करके सब सुलझाएंगे।',
    acknowledgeEn:
      'I understand — when everything arrives at once, the mind tires. Do not worry; we will untangle it one step at a time.',
    insightId: 'OVERWHELM_STRESS',
  },
];

export function getMoodById(id: string): MoodOption | undefined {
  return MOOD_OPTIONS.find((m) => m.id === id);
}

/** The one-line check-in question both greetings end with. */
export const MOOD_QUESTION_HI = 'सबसे पहले बताइए — आज आपका मन कैसा महसूस कर रहा है?';
export const MOOD_QUESTION_EN = 'Before we begin — how are you feeling today?';
