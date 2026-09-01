/**
 * KASHI SAHAYAK — emotional support, verified verse selection, crisis safety.
 *
 * Rules this module enforces:
 *  - Verse text is NEVER stored here. Only a reference
 *    (book slug + section id + shloka number) is stored, and the text is
 *    resolved from the canonical Granth store at call time. If the reference
 *    cannot be resolved, no verse is offered — the assistant says so honestly.
 *  - A resolved passage always carries book, source/edition line, section,
 *    verse id, a provenance fingerprint, and a meaning that is kept separate
 *    from the original text.
 *  - Crisis language bypasses the scripture flow entirely and returns safety
 *    guidance. Scripture is never offered as a substitute for emergency help.
 *  - Feminine self-reference is used throughout ("मैं समझती हूँ").
 *
 * Nothing here claims a verse is verified against an external edition: the
 * store's own `verified` flag and the extraction checksum are reported as
 * they are, and the locator provenance states what was actually checked.
 */

import { GRANTHS_DATA, type LibraryItem } from '../granth/libraryData';
import { sha256Hex } from '../granth/checksum';

export type EmotionId =
  | 'sadness'
  | 'anxiety'
  | 'anger'
  | 'confusion'
  | 'loneliness'
  | 'stress'
  | 'confidence'
  | 'relationship'
  | 'career'
  | 'spiritual'
  | 'just-talk';

/** A reference into the canonical store. No text is duplicated here. */
export interface PassageRef {
  slug: string;
  sectionId: string;
  /** Substring of the store's shloka number, e.g. '२-४७'. */
  shlokaNo: string;
}

export interface VerifiedPassage {
  book: string;
  bookSlug: string;
  /** The store's own source/edition line, e.g. "Mahabharata (Bhishma Parva...)". */
  sourceLine: string;
  /** The store's verification flag, reported as-is. */
  storeVerified: boolean;
  sectionId: string;
  sectionTitle: string;
  verseId: string;
  /** Original text exactly as stored. */
  original: string;
  /** Meaning exactly as stored, kept separate from the original. */
  meaning: string;
  /** Fingerprint over book + section + verse + original + meaning. */
  provenance: string;
}

export interface EmotionPath {
  id: EmotionId;
  label: string;
  /** Feminine Hindi acknowledgement. */
  acknowledgement: string;
  /** One short follow-up question, or null when none is appropriate. */
  followUp: string | null;
  /** Gentle practical reflection tied to the passage. */
  reflection: string;
  passage: PassageRef | null;
  /** Free-text and Hinglish cues that select this path. */
  keywords: string[];
}

export const EMOTION_PATHS: EmotionPath[] = [
  {
    id: 'sadness',
    label: 'उदासी / शोक',
    acknowledgement: 'मैं समझती हूँ — यह भारी समय आप पर बहुत गहरा असर डाल रहा है। मैं आपकी बात सुन रही हूँ।',
    followUp: 'क्या यह भावना किसी हाल की घटना से जुड़ी है, या कुछ समय से चली आ रही है?',
    reflection: 'गीता इस अनुभव को अनित्य बताती है — यह आपकी कमज़ोरी नहीं, समय का स्वभाव है। आज केवल एक छोटी-सी चीज़ अपने लिए करें।',
    passage: { slug: 'bhagavad-gita', sectionId: 'gita-ch-2', shlokaNo: '२-१४' },
    keywords: ['उदास', 'दुख', 'दुःख', 'शोक', 'sad', 'grief', 'grieving', 'रोना', 'टूट'],
  },
  {
    id: 'anxiety',
    label: 'चिंता / भय',
    acknowledgement: 'मैं समझती हूँ — अनिश्चित समय में मन बार-बार आगे की सोचता है। आप अकेले नहीं हैं।',
    followUp: 'आप अभी केवल बात करना चाहती हैं, कोई श्लोक सुनना चाहती हैं, या दोनों?',
    reflection: 'गीता इसे संपूर्ण शरण की भावना से जोड़ती है — जो हो रहा है उसमें आपको अकेले संभालना नहीं है। धीरे-धीरे साँस लें।',
    passage: { slug: 'bhagavad-gita', sectionId: 'gita-ch-18', shlokaNo: '१८-६६' },
    keywords: ['चिंता', 'घबराहट', 'डर', 'भय', 'anxiety', 'anxious', 'fear', 'worried', 'tension'],
  },
  {
    id: 'anger',
    label: 'क्रोध',
    acknowledgement: 'मैं समझती हूँ — क्रोध अक्सर किसी गहरी चोट की तरफ़ इशारा करता है। मैं यहाँ हूँ।',
    followUp: 'क्या यह क्रोध किसी एक घटना से है, या कुछ समय से इकट्ठा हुआ है?',
    reflection: 'गीता क्रोध की शृंखला बताती है — क्रोध से सम्मोह और फिर विवेक भ्रमित होता है। अभी निर्णय टाल देना भी एक बड़ा कदम है।',
    passage: { slug: 'bhagavad-gita', sectionId: 'gita-ch-2', shlokaNo: '२-६३' },
    keywords: ['गुस्सा', 'क्रोध', 'चिढ़', 'anger', 'angry', 'frustrated', 'irritated'],
  },
  {
    id: 'confusion',
    label: 'भ्रम / अनिर्णय',
    acknowledgement: 'मैं समझती हूँ — जब रास्ते साफ़ नहीं दिखते, मन थक जाता है। मैं आपकी बात सुन रही हूँ।',
    followUp: 'आप चाहें तो मैं आपके विकल्पों को एक-एक कर सँवारने में मदद कर सकती हूँ — शुरू कहाँ से करें?',
    reflection: 'गीता में अर्जुन भी ठीक यही पूछते हैं। स्पष्टता अक्सर एक सीधे प्रश्न से शुरू होती है, पूरे उत्तर से नहीं।',
    passage: { slug: 'bhagavad-gita', sectionId: 'gita-ch-2', shlokaNo: '२-७' },
    keywords: ['भ्रम', 'कन्फ्यूज', 'confused', 'confusion', 'समझ नहीं', 'क्या करूँ', 'रास्ता नहीं'],
  },
  {
    id: 'loneliness',
    label: 'अकेलापन',
    acknowledgement: 'मैं समझती हूँ — भीड़ में भी अकेलापन बहुत गहरा होता है। मैं इस समय आपके साथ हूँ।',
    followUp: 'क्या आप बताना चाहेंगी कि यह अकेलापन कब सबसे ज़्यादा महसूस होता है?',
    reflection: 'गीता कहती है कि हर प्राणी में समान भाव से स्थित होना ही वास्तविक संबंध है। छोटा-सा संपर्क भी मायने रखता है।',
    passage: { slug: 'bhagavad-gita', sectionId: 'gita-ch-9', shlokaNo: '९-२९' },
    keywords: ['अकेला', 'अकेलापन', 'lonely', 'loneliness', 'कोई नहीं', 'alone'],
  },
  {
    id: 'stress',
    label: 'तनाव / बोझ',
    acknowledgement: 'मैं समझती हूँ — एक साथ बहुत कुछ संभालना वाकई थकाता है।',
    followUp: 'आज सबसे ज़्यादा बोझ किस एक चीज़ का लग रहा है?',
    reflection: 'गीता फल की चिंता छोड़कर कर्म पर स्थिर रहना कहती है — आज की सूची में से एक काम चुनें, बाकी कल के लिए।',
    passage: { slug: 'bhagavad-gita', sectionId: 'gita-ch-2', shlokaNo: '२-४८' },
    keywords: ['तनाव', 'स्ट्रेस', 'stress', 'overwhelmed', 'बोझ', 'थकान', 'burnout'],
  },
  {
    id: 'confidence',
    label: 'आत्मविश्वास की कमी',
    acknowledgement: 'मैं समझती हूँ — अपने पर भरोसा डगमगाना बहुत कठिन होता है। मैं आपकी बात सुन रही हूँ।',
    followUp: 'क्या ऐसा कोई छोटा काम है जिसमें आप पहले सफल रहीं? उसी से शुरू करें?',
    reflection: 'गीता कहती है — अपने द्वारा अपना उद्धार करो, अपने को गिराने न दो। आप अपने से आगे हैं, पीछे नहीं।',
    passage: { slug: 'bhagavad-gita', sectionId: 'gita-ch-6', shlokaNo: '६-५' },
    keywords: ['आत्मविश्वास', 'कॉन्फिडेंस', 'confidence', 'हिम्मत नहीं', 'असफल', 'डर लग'],
  },
  {
    id: 'relationship',
    label: 'रिश्तों में तकलीफ़',
    acknowledgement: 'मैं समझती हूँ — जिनसे सबसे ज़्यादा अपनापन होता है, वहीं सबसे ज़्यादा चोट भी लगती है।',
    followUp: 'क्या आप इस बारे में बात करना चाहेंगी, या केवल थोड़ा शांत होना चाहेंगी?',
    reflection: 'गीता अद्वेष और करुणा को साधना का मूल कहती है — इसका अर्थ सीमा न रखना नहीं, बिना कड़वाहट के सीमा रखना है।',
    passage: { slug: 'bhagavad-gita', sectionId: 'gita-ch-12', shlokaNo: '१२-१३' },
    keywords: ['रिश्ता', 'रिलेशनशिप', 'relationship', 'पति', 'पत्नी', 'breakup', 'झगड़ा', 'परिवार'],
  },
  {
    id: 'career',
    label: 'करियर की अनिश्चितता',
    acknowledgement: 'मैं समझती हूँ — रास्ता चुनते समय अनिश्चितता स्वाभाविक है। मैं यहाँ हूँ।',
    followUp: 'आपके लिए इस समय सबसे महत्वपूर्ण क्या है — सुरक्षा, विकास, या अर्थ?',
    reflection: 'गीता कर्म पर अधिकार और फल पर नहीं — यानी अगला सही कदम चुनें, परिणाम का बोझ अभी न उठाएँ।',
    passage: { slug: 'bhagavad-gita', sectionId: 'gita-ch-2', shlokaNo: '२-४७' },
    keywords: ['करियर', 'नौकरी', ' job', 'career', 'इंटरव्यू', 'प्रमोशन', 'पढ़ाई'],
  },
  {
    id: 'spiritual',
    label: 'आध्यात्मिक जिज्ञासा',
    acknowledgement: 'मैं समझती हूँ — यह जिज्ञासा बहुत सुंदर है, और इसमें जल्दबाज़ी की ज़रूरत नहीं।',
    followUp: 'क्या आप कोई विशेष विषय समझना चाहेंगी, या कोई श्लोक सुनना चाहेंगी?',
    reflection: 'गीता ज्ञान के लिए प्रणिपात, प्रश्न और सेवा — तीनों को साथ बताती है। जिज्ञासा ही पहला कदम है।',
    passage: { slug: 'bhagavad-gita', sectionId: 'gita-ch-4', shlokaNo: '४-३४' },
    keywords: ['आध्यात्म', 'spiritual', 'ध्यान', 'मंत्र', 'भक्ति', 'अर्थ', 'जिज्ञासा', 'मोक्ष'],
  },
  {
    id: 'just-talk',
    label: 'बस बात करनी है',
    acknowledgement: 'बिल्कुल — हम बस बात करेंगे। जितना आप बताना चाहें, उतना काफ़ी है।',
    followUp: null,
    reflection: '',
    passage: null,
    keywords: ['बस बात', 'बात करनी है', 'just talk', 'बस मुझसे बात', 'कुछ नहीं'],
  },
];

/* ------------------------------------------------------------------ */
/* Crisis safety                                                       */
/* ------------------------------------------------------------------ */

const CRISIS_PATTERNS: RegExp[] = [
  /खुदकुशी|आत्महत्या|सुसाइड|suicide/i,
  /मरना चाहती हूँ|मरना चाहता हूँ|जीना नहीं चाहती|जीना नहीं चाहता/i,
  /खुद को नुकसान|नुकसान पहुँचाऊँ|हर्ट मायसेल्फ|hurt myself/i,
  /kill myself|end my life|want to die|no reason to live/i,
  /(?:हँ|हां)?\s*मैं (?:अब )?नहीं रहना चाहती/i,
];

export const SAFETY_GUIDANCE =
  'मैं यहाँ हूँ और आपकी बात सुन रही हूँ। यह सुरक्षा की बात है, इसलिए मैं इस समय कोई श्लोक नहीं सुनाऊँगी — ' +
  'कृपया अभी किसी करीबी व्यक्ति से बात करें, और तुरंत सहायता के लिए भारत में 112 (आपातकाल) या ' +
  'Tele-MANAS 14416 / 1-800-891-4416 पर संपर्क करें। यदि आप किसी संकट में हैं, तो निकटतम अस्पताल के ' +
  'आपातकालीन विभाग या मानसिक स्वास्थ्य पेशेवर से तुरंत मदद लें।';

export function detectCrisis(text: string): boolean {
  const t = (text ?? '').trim();
  if (!t) return false;
  return CRISIS_PATTERNS.some((re) => re.test(t));
}

/* ------------------------------------------------------------------ */
/* Canonical passage resolution                                        */
/* ------------------------------------------------------------------ */

const bookBySlug = (slug: string): LibraryItem | undefined =>
  (GRANTHS_DATA as unknown as LibraryItem[]).find((b) => b.slug === slug);

/**
 * Resolve a reference against the canonical store.
 * Returns null when the reference does not resolve — the caller must then say
 * honestly that no verified passage is available, never substitute one.
 */
export function resolvePassage(ref: PassageRef | null): VerifiedPassage | null {
  if (!ref) return null;
  const book = bookBySlug(ref.slug);
  if (!book) return null;
  const section = book.sections.find((s) => s.id === ref.sectionId);
  if (!section) return null;
  const verse = section.verses.find((v) => (v.shlokaNo ?? '').includes(ref.shlokaNo));
  if (!verse) return null;
  const original = verse.sanskrit ?? '';
  const meaning = verse.hindi ?? '';
  if (!original.trim()) return null;

  return {
    book: book.title,
    bookSlug: book.slug,
    sourceLine: book.source ?? '',
    storeVerified: !!book.verified,
    sectionId: section.id,
    sectionTitle: section.title ?? '',
    verseId: verse.shlokaNo ?? '',
    original,
    meaning,
    provenance: sha256Hex(
      ['v1', book.slug, section.id, verse.shlokaNo ?? '', original.trim(), meaning.trim()].join('|'),
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Response builder                                                    */
/* ------------------------------------------------------------------ */

export type UserMode =
  | 'conversation-only'
  | 'verse-only'
  | 'verse-with-meaning'
  | 'complete-reading'
  | 'short-passage'
  | 'silent';

export interface EmotionalResponse {
  emotionId: EmotionId;
  label: string;
  acknowledgement: string;
  followUp: string | null;
  passage: VerifiedPassage | null;
  reflection: string;
  /** 'safety' bypasses the scripture flow entirely. */
  guidance: 'none' | 'safety';
  /** Set when the emotion has a verse but the store could not resolve it. */
  unresolvedReason: string | null;
}

export interface BuildOptions {
  mode?: UserMode;
  /** When false the assistant must not attach a verse even if one exists. */
  allowVerse?: boolean;
}

/**
 * Build the structured emotional-support response.
 * Order of precedence: crisis safety > conversation-only mode > verse.
 */
export function buildEmotionalResponse(
  emotionId: EmotionId,
  text: string = '',
  options: BuildOptions = {},
): EmotionalResponse {
  const path = EMOTION_PATHS.find((p) => p.id === emotionId);
  if (!path) {
    return {
      emotionId: 'just-talk',
      label: 'बस बात करनी है',
      acknowledgement: 'मैं यहाँ हूँ — आप जो भी बताना चाहें, मैं सुन रही हूँ।',
      followUp: null,
      passage: null,
      reflection: '',
      guidance: 'none',
      unresolvedReason: null,
    };
  }

  if (detectCrisis(text)) {
    return {
      emotionId,
      label: path.label,
      acknowledgement: SAFETY_GUIDANCE,
      followUp: null,
      passage: null,
      reflection: '',
      guidance: 'safety',
      unresolvedReason: null,
    };
  }

  const mode = options.mode ?? 'verse-with-meaning';
  const allowVerse = options.allowVerse !== false;
  const conversationOnly = mode === 'conversation-only' || mode === 'silent' || !allowVerse;

  let passage: VerifiedPassage | null = null;
  let unresolvedReason: string | null = null;
  if (!conversationOnly && path.passage) {
    const resolved = resolvePassage(path.passage);
    if (resolved) {
      passage = resolved;
    } else {
      unresolvedReason =
        'मुझे इस भावना के लिए कोई प्रमाणित पाठ उपलब्ध नहीं मिला — मैं कोई श्लोक नहीं बनाऊँगी।';
    }
  }

  return {
    emotionId,
    label: path.label,
    acknowledgement: path.acknowledgement,
    followUp: path.followUp,
    passage,
    reflection: passage ? path.reflection : '',
    guidance: 'none',
    unresolvedReason,
  };
}

/** Keyword-based emotion detection; returns null when nothing matches. */
export function detectEmotion(text: string): EmotionId | null {
  const t = (text ?? '').toLowerCase();
  if (!t.trim()) return null;
  let best: { id: EmotionId; score: number } | null = null;
  for (const path of EMOTION_PATHS) {
    const score = path.keywords.filter((k) => t.includes(k.toLowerCase())).length;
    if (score > 0 && (!best || score > best.score)) best = { id: path.id, score };
  }
  return best ? best.id : null;
}

/** The mapping table required for review: emotion -> verified passage. */
export function emotionPassageMap(): { emotion: EmotionId; label: string; ref: PassageRef | null; resolved: boolean; verseId: string | null }[] {
  return EMOTION_PATHS.map((p) => {
    const resolved = resolvePassage(p.passage);
    return {
      emotion: p.id,
      label: p.label,
      ref: p.passage,
      resolved: !!resolved,
      verseId: resolved?.verseId ?? null,
    };
  });
}
