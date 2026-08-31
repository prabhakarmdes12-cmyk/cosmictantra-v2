/**
 * Turn a retrieval outcome into conversational copy for the assistant.
 *
 * Rules encoded here (Phase 3):
 *  - Start with the person's actual concern and, where we have one, a practical
 *    next step — not with a quotation.
 *  - Quote at most two stored passages, each with its own reference/edition.
 *  - Cross-Granth answers keep independent provenance and say so.
 *  - A Kundli/chart question never "proves" a verse: say it explicitly.
 *  - A long reading is OFFERED, not started: consent comes first.
 */
import type { RetrievalOutcome } from '@/lib/granth/retrieval';

export interface GroundedPassageCopy {
  passageId: string;
  reference: string;
  bookId: string;
  bookTitle: string;
  editionId: string;
  original: string;
  meaning: string | null;
  checksum: string;
  chapter?: number;
  verse?: number;
}

export interface GroundedAnswer {
  text: string;
  passages: GroundedPassageCopy[];
  booksInvolved: string[];
  /** The assistant asks before any long reading. */
  consentQuestion: string | null;
  retrievalMode: RetrievalOutcome['mode'];
}

const THEMES: Array<{ test: RegExp; hi: string; en: string }> = [
  {
    test: /नौकरी|job|इंटरव्यू|interview|साक्षात्कार|चयन/i,
    hi: 'व्यावहारिक अगला कदम: एक पन्ने पर अपनी तीन ठोस उपलब्धियाँ और दो सुधार-बिन्दु लिखें, फिर कल बीस मिनट मॉक-प्रश्नों का अभ्यास करें।',
    en: 'A practical next step: write down three concrete achievements and two improvement points, then rehearse mock questions for twenty minutes tomorrow.',
  },
  {
    test: /पढ़ाई|परीक्षा|exam|study|स्टडी/i,
    hi: 'व्यावहारिक अगला कदम: आज के लिए केवल एक विषय और एक समय-खण्ड तय करें — छोटा, पूरा होने लायक।',
    en: 'A practical next step: pick one topic and one time block for today — small enough to actually finish.',
  },
  {
    test: /पति|पत्नी|घर|झगड़ा|कलह|परिवार|family/i,
    hi: 'व्यावहारिक अगला कदम: बातचीत शुरू करने से पहले एक वाक्य तय कर लें — "मैं आपकी बात समझना चाहता/चाहती हूँ" — और बीच में रोकना नहीं।',
    en: 'A practical next step: decide on one opening sentence — "I want to understand you" — and do not interrupt.',
  },
  {
    test: /बीमार|तबीयत|स्वास्थ्य|health|दवा|डॉक्टर/i,
    hi: 'व्यावहारिक अगला कदम: लक्षण बने रहें तो चिकित्सक से मिलना टालें नहीं — यह सलाह किसी भी ज्योतिषीय सुझाव से ऊपर है।',
    en: 'A practical next step: if symptoms persist, see a doctor — that advice outranks any astrological suggestion.',
  },
  {
    test: /पैसे|कर्ज|loan|धन|आर्थिक/i,
    hi: 'व्यावहारिक अगला कदम: आय-व्यय की एक सादी सूची बनाएं और सबसे छोटे कर्ज़ से शुरुआत करें — संख्याएँ डर कम करती हैं।',
    en: 'A practical next step: list income and expenses plainly and start with the smallest debt — numbers reduce fear.',
  },
];

export function practicalStepFor(query: string, lang: 'hi' | 'en'): string | null {
  for (const theme of THEMES) {
    if (theme.test.test(query)) return lang === 'en' ? theme.en : theme.hi;
  }
  return null;
}

const KUNDLI_RE = /कुण्डली|कुंडली|जन्म\s*पत्रिका|दशा|महादशा|अन्तर्दशा|ग्रह|राशि|लग्न|kundli|kundali|dasha|chart|horoscope/i;

/**
 * An answer for a life/practical question where NOTHING is quoted: no stored
 * passage matched tightly enough to cite without risking a wrong citation.
 * It leads with the person's concern, offers one practical step, says plainly
 * that nothing is being quoted, and only OFFERS a reading.
 */
export function buildPracticalAnswer(
  query: string,
  lang: 'hi' | 'en',
): { text: string; consentQuestion: string } {
  const lines: string[] = [
    lang === 'en' ? 'I hear you. Before anything else —' : 'मैं आपकी बात सुन रही हूँ। सबसे पहले —',
    practicalStepFor(query, lang) ??
      (lang === 'en'
        ? 'Tell me one thing you can control today; we can start there.'
        : 'आज की एक ऐसी बात बताइए जो आपके हाथ में है — वहीं से शुरू करते हैं।'),
    '',
    lang === 'en'
      ? 'I am not quoting anything: no stored passage matches this closely enough to cite without risking a wrong reference. Name a chapter and verse — or a theme — and I will read the stored text word for word.'
      : 'मैं कुछ उद्धृत नहीं कर रही — संग्रहीत पाठ में ऐसा कोई अंश नहीं मिला जिसे ग़लत संदर्भ के डर के बिना कह सकूँ। अध्याय-श्लोक या कोई विषय बताइए, संग्रहीत पाठ ज्यों का त्यों पढ़ कर सुनाऊँगी।',
  ];

  if (KUNDLI_RE.test(query)) {
    lines.push('');
    lines.push(
      lang === 'en'
        ? 'One thing a chart cannot do: it does not prove that any scriptural statement applies to you, and no calculation turns a verse into a prediction.'
        : 'एक बात कुण्डली नहीं कर सकती — वह यह सिद्ध नहीं करती कि कोई शास्त्र-वचन आपके लिए प्रयोज्य है, और कोई गणना किसी वचन को भविष्यवाणी नहीं बनाती।',
    );
  }

  const consentQuestion =
    lang === 'en'
      ? 'Shall I read a short passage from the stored text aloud for you?'
      : 'क्या संग्रहीत पाठ से एक छोटा अंश पढ़ कर सुनाऊँ?';
  lines.push('');
  lines.push(consentQuestion);

  return { text: lines.join('\n'), consentQuestion };
}

/**
 * Does this utterance read as a personal/practical concern rather than a
 * request for a service? Used only for the non-quoting fallback: it never
 * decides intent for routing and never suppresses other handlers.
 */
const FIRST_PERSON_RE = /(मैं|मुझे|मुझको|मेरी|मेरा|मेरे|हमार|हम|\bi\b|\bmy\b|\bme\b)/i;
const PROBLEM_RE =
  /(चिन्ता|चिंता|टेंशन|डर|उदास|परेशान|दुख|दुःख|गम|तनाव|मुश्किल|समस्या|निराश|थक|worried|anxious|sad|stress|problem|depress)/i;
const REQUEST_RE = /(बताओ|बताइए|बतायें|सुझाव|सलाह|मदद|उपाय|क्या करूँ|क्या करूं|क्या करना|advice|help|suggest|tip)/i;
const PLAN_RE = /(कल|आज|इंटरव्यू|इन्टरव्यू|interview|जॉब|job|नौकरी|परीक्षा|exam|साक्षात्कार|बैठक|मुलाकात)/i;

export function looksLikePracticalConcern(query: string): boolean {
  const q = String(query || '');
  return (
    (FIRST_PERSON_RE.test(q) && (PROBLEM_RE.test(q) || REQUEST_RE.test(q))) ||
    (REQUEST_RE.test(q) && PLAN_RE.test(q)) ||
    PROBLEM_RE.test(q)
  );
}

export function buildGroundedAnswer(
  query: string,
  outcome: RetrievalOutcome,
  lang: 'hi' | 'en',
): GroundedAnswer {
  const passages: GroundedPassageCopy[] = outcome.results.slice(0, 2).map((r) => ({
    passageId: r.passage.passageId,
    reference: r.reference,
    bookId: r.bookId,
    bookTitle: r.bookTitle,
    editionId: r.editionId,
    original: r.passage.original,
    meaning: r.passage.meaning ?? null,
    checksum: r.passage.checksum,
    chapter: r.passage.locator.chapter,
    verse: r.passage.locator.verse,
  }));

  const booksInvolved = [...new Set(passages.map((p) => p.bookId))];
  const lines: string[] = [];

  lines.push(
    lang === 'en'
      ? 'I hear you. Before anything else —'
      : 'मैं आपकी बात सुन रही हूँ। सबसे पहले —',
  );

  const step = practicalStepFor(query, lang);
  if (step) lines.push(step);
  else {
    lines.push(
      lang === 'en'
        ? 'Tell me one thing you can control today; we can start there.'
        : 'आज की एक ऐसी बात बताइए जो आपके हाथ में है — वहीं से शुरू करते हैं।',
    );
  }

  lines.push('');
  lines.push(
    lang === 'en'
      ? 'What the stored text says (quoted, not paraphrased):'
      : 'संग्रहीत पाठ (ज्यों का त्यों, व्याख्या नहीं):',
  );

  for (const passage of passages) {
    lines.push('');
    lines.push(`${passage.reference}`);
    lines.push(passage.original);
    if (passage.meaning) {
      lines.push(lang === 'en' ? `Meaning: ${passage.meaning}` : `भावार्थ: ${passage.meaning}`);
    }
  }

  if (booksInvolved.length > 1) {
    lines.push('');
    lines.push(
      lang === 'en'
        ? 'Note: these passages come from different Granths; each keeps its own source and edition.'
        : 'ध्यान दें: ये अंश अलग-अलग ग्रन्थों से हैं — प्रत्येक का स्रोत व संस्करण स्वतन्त्र है।',
    );
  }

  if (KUNDLI_RE.test(query)) {
    lines.push('');
    lines.push(
      lang === 'en'
        ? 'A chart calculation does not prove that any verse applies to you; the passage stands on its own source, not on a calculation.'
        : 'कुण्डली की गणना यह सिद्ध नहीं करती कि कोई शास्त्र-वचन आपके लिए प्रयोज्य है — यह पाठ अपने स्रोत से खड़ा है, गणना से नहीं।',
    );
  }

  const firstChapter = passages.find((p) => typeof p.chapter === 'number')?.chapter;
  const consentQuestion =
    typeof firstChapter === 'number'
      ? lang === 'en'
        ? `Shall I read chapter ${firstChapter} from the beginning? Say "read chapter ${firstChapter}" and I will start, one passage at a time.`
        : `क्या मैं अध्याय ${firstChapter} आरम्भ से पढ़ूँ? "गीता अध्याय ${firstChapter} पढ़ो" कहें — एक-एक अंश करके पढ़ूँगी।`
      : null;

  if (consentQuestion) {
    lines.push('');
    lines.push(consentQuestion);
  }

  return {
    text: lines.join('\n'),
    passages,
    booksInvolved,
    consentQuestion,
    retrievalMode: outcome.mode,
  };
}
