/**
 * KASHI SAHAYAK V3 — deterministic conversation core.
 *
 * The pipeline, in order, for every utterance:
 *
 *   Utterance
 *     → LanguageNormalizer   (script + synonym normalisation, tokenising)
 *     → WeightedIntentMatcher (cue weights, thresholded — never a coin-flip)
 *     → EntityExtractor       (subject, date words, location, detail level)
 *     → ConversationState     (subject/date/location/domain/intent/fact)
 *       & FlowStack           (pendingFlow + stack: interruptions suspend,
 *                              never destroy)
 *     → MissingSlotResolver   (the next question a flow must ask)
 *     → DeterministicRouter   (follow-ups, life concerns, resume, slots)
 *     → TemplateEngine        (replies assembled from state, not guessed)
 *     → NextBestActions       (the chips offered after every reply)
 *     → Voice                 (the component speaks what the template built)
 *
 * KASHI_INV_V3_001 — NO LLM IN THE LOOP. Every function here is pure and
 * total: same utterance + same state ⇒ same reply, always. Where the core
 * cannot resolve something it says so and offers the menu, rather than
 * improvising.
 *
 * KASHI_INV_V3_002 — AN INTERRUPTION SUSPENDS, NEVER ERASES. `suspendFlow`
 * moves the live flow into `pendingFlow` (and onto `stack`); `resumeFlow`
 * restores it to the exact step it stopped at, and the seeker is told what
 * was kept ("आपका जन्म-समय चरण सुरक्षित है").
 */

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export type DetailLevel = 'SHORT' | 'NORMAL' | 'PANDIT';

export type SubjectKind = 'SELF' | 'PARTNER' | 'CHILD' | 'PARENT' | 'SIBLING' | 'OTHER';

export type FlowKind = 'INTAKE' | 'GRANTH_RECITAL' | 'MUHURTA' | 'CONCIERGE';

export interface FlowFrame {
  kind: FlowKind;
  /** The exact step the flow stopped at, so resume re-asks the same slot. */
  step: string;
  /** Slots already collected, carried through the suspension. */
  slots: Record<string, string>;
  /** Reader-facing name of the suspended flow, for the resume prompt. */
  labelHi: string;
}

export interface ActiveFact {
  intent: string;
  labelHi: string;
  /** The delivered value, verbatim from the deterministic engine. */
  valueHi: string;
  /** When the fact stops holding, when the reply states it. */
  untilHi?: string;
  dateIso?: string;
  locationHi?: string;
}

export interface ConversationState {
  activeSubject: SubjectKind;
  activeDate: string | null;
  activeDateLabelHi: string | null;
  activeLocation: string | null;
  activeDomain: string | null;
  activeIntent: string | null;
  activeFact: ActiveFact | null;
  /** The flow an interruption suspended. Resumed by वापस / RESUME_FLOW. */
  pendingFlow: FlowFrame | null;
  /** Deeper suspensions, outermost first. */
  stack: FlowFrame[];
  detailLevel: DetailLevel;
}

export function createConversationState(): ConversationState {
  return {
    activeSubject: 'SELF',
    activeDate: null,
    activeDateLabelHi: null,
    activeLocation: null,
    activeDomain: null,
    activeIntent: null,
    activeFact: null,
    pendingFlow: null,
    stack: [],
    detailLevel: 'NORMAL',
  };
}

/* ------------------------------------------------------------------ */
/* 1. LanguageNormalizer                                               */
/* ------------------------------------------------------------------ */

export interface NormalizedUtterance {
  raw: string;
  text: string;
  lower: string;
  lang: 'hi' | 'en';
  tokens: string[];
}

const SYNONYMS: Array<[RegExp, string]> = [
  [/राहु\s*काल|राहुकाल|rahu\s*kaal|rahukaal/gi, 'राहुकाल'],
  [/पंचांग|पञ्चाङ्ग|panchang|panchangam/gi, 'पंचांग'],
  [/कुंडली|कुण्डली|kundli|kundali/gi, 'कुंडली'],
  [/नक्षत्र|nakshatra/gi, 'नक्षत्र'],
  [/तिथि|tithi/gi, 'तिथि'],
  [/एकादशी|ekadashi/gi, 'एकादशी'],
  [/मुहूर्त|मुहूर्त्|muhurat|muhurta/gi, 'मुहूर्त'],
];

export function normalizeUtterance(raw: string): NormalizedUtterance {
  let text = (raw || '').replace(/\s+/g, ' ').trim();
  for (const [from, to] of SYNONYMS) text = text.replace(from, to);
  // Language is judged AFTER folding: a Hinglish utterance like "aaj ka rahu
  // kaal" folds to Devanagari and should be spoken in a Hindi voice. Only
  // utterances with no jyotish vocabulary at all count as pure English.
  const lang: 'hi' | 'en' = /[\u0900-\u097F]/.test(text) ? 'hi' : 'en';
  return {
    raw,
    text,
    lower: text.toLowerCase(),
    lang,
    tokens: text.toLowerCase().split(/[\s?,!।]+/).filter(Boolean),
  };
}

/* ------------------------------------------------------------------ */
/* 2. WeightedIntentMatcher                                            */
/* ------------------------------------------------------------------ */

export type ConversationalIntent =
  | 'FOLLOWUP_WHY'
  | 'FOLLOWUP_MEANING'
  | 'FOLLOWUP_UNTIL'
  | 'FOLLOWUP_THAT_DAY'
  | 'FOLLOWUP_SUBJECT_RASHI'
  | 'RESUME_FLOW'
  | 'LIFE_CONCERN_JOB'
  | 'LIFE_CONCERN_HEARTBREAK'
  | 'LIFE_CONCERN_STRESS'
  | 'DETAIL_SHORT'
  | 'DETAIL_PANDIT'
  /** The utterance is an answer to the flow's current slot question. */
  | 'FLOW_SLOT_ANSWER'
  | 'UNKNOWN';

/**
 * Cues carry weights because a bare substring match is how "कल वाला?" stops
 * matching the moment someone writes "कल वाला बताओगे?". The matcher sums the
 * weights of the cues it sees and takes the best intent above threshold.
 */
const INTENT_CUES: Record<Exclude<ConversationalIntent, 'FLOW_SLOT_ANSWER' | 'UNKNOWN'>, Array<[RegExp, number]>> = {
  FOLLOWUP_WHY: [[/(^|[^\u0900-\u097F])(क्यों|क्यो)(?![\u0900-\u097F])|\bwhy\b/, 1.0], [/कारण|वजह|reason/, 0.7]],
  FOLLOWUP_MEANING: [[/(^|[^\u0900-\u097F])मतलब(?![\u0900-\u097F])|\bmeaning\b|अर्थ\s*\?/, 1.0], [/समझाओ|explain/, 0.6]],
  FOLLOWUP_UNTIL: [[/कब\s*तक|कबतक|how long|till when|until when/, 1.0]],
  FOLLOWUP_THAT_DAY: [[/उस\s*दिन|उसी\s*दिन|कल\s*वाला|कलवाली|that day|same day/, 1.0], [/उस\s*दिन\s*का/, 0.8]],
  FOLLOWUP_SUBJECT_RASHI: [[/उसकी\s*राशि|उनकी\s*राशि|उस\s*की\s*राशि|his sign|her sign|their sign/, 1.0], [/राशि\s*क्या\s*है\s*उसकी/, 0.9]],
  RESUME_FLOW: [[/(^|[^\u0900-\u097F])वापस(?![\u0900-\u097F])|\bresume\b|\bcontinue\b|जारी\s*रखो|आगे\s*बढ़ो/, 1.0]],
  LIFE_CONCERN_JOB: [[/नौकरी|बेरोज़गारी|बेरोजगारी|नौकरी\s*छूट|layoff|job\s*loss|नौकरी\s*का\s*डर/, 1.0], [/काम\s*नहीं\s*मिल|career\s*anxiety/, 0.8]],
  LIFE_CONCERN_HEARTBREAK: [[/ब्रेक\s*अप|breakup|break\s*up|रिश्ता\s*टूट|प्यार\s*में\s*धोखा|heartbroken|दिल\s*टूट/, 1.0], [/तलाक|अलगाव|separation/, 0.7]],
  LIFE_CONCERN_STRESS: [[/तनाव|स्ट्रेस|stress|anxiety|घबराहट|डर\s*लग|उदास|देप्रेशन|depression|अकेला/, 1.0]],
  DETAIL_SHORT: [[/संक्षेप\s*में|संक्षिप्त|short|briefly|एक\s*लाइन\s*में/, 1.0]],
  DETAIL_PANDIT: [[/पंडित\s*की\s*तरह|विस्तार\s*से|detail|pandit mode|शास्त्रीय\s*व्याख्या/, 1.0]],
};

export const MATCH_THRESHOLD = 0.6;

export interface IntentMatch {
  intent: ConversationalIntent;
  score: number;
}

export function matchIntent(n: NormalizedUtterance): IntentMatch | null {
  let best: IntentMatch | null = null;
  for (const [intent, cues] of Object.entries(INTENT_CUES) as Array<[Exclude<ConversationalIntent, 'FLOW_SLOT_ANSWER' | 'UNKNOWN'>, Array<[RegExp, number]>]>) {
    let score = 0;
    for (const [re, w] of cues) if (re.test(n.lower) || re.test(n.text)) score += w;
    if (score > 0 && (!best || score > best.score)) best = { intent, score };
  }
  if (best && best.score >= MATCH_THRESHOLD) return best;
  return null;
}

/** Intents that must INTERRUPT a live flow rather than be swallowed by it. */
export const INTERRUPTING_INTENTS: ReadonlySet<ConversationalIntent> = new Set([
  'FOLLOWUP_WHY', 'FOLLOWUP_MEANING', 'FOLLOWUP_UNTIL', 'FOLLOWUP_THAT_DAY',
  'FOLLOWUP_SUBJECT_RASHI', 'RESUME_FLOW',
  'LIFE_CONCERN_JOB', 'LIFE_CONCERN_HEARTBREAK', 'LIFE_CONCERN_STRESS',
]);

/* ------------------------------------------------------------------ */
/* 3. EntityExtractor                                                  */
/* ------------------------------------------------------------------ */

const SUBJECT_CUES: Array<[RegExp, SubjectKind]> = [
  [/पति|पत्नी|partner|spouse|पत्नी\s*की|पति\s*की/, 'PARTNER'],
  [/बेट|बेटी|बच्च|\bson\b|\bdaughter\b|\bchild\b/, 'CHILD'],
  [/माता|पिता|माँ\s*की|पिता\s*की|mother|father/, 'PARENT'],
  [/भाई|बहन|brother|sister/, 'SIBLING'],
];

const DATE_CUES: Array<[RegExp, string, string]> = [
  [/उस\s*दिन|उसी\s*दिन|कल\s*वाला|that day|same day/, 'ACTIVE', 'उसी दिन'],
  [/(^|[^\u0900-\u097F])कल(?![\u0900-\u097F])|\btomorrow\b/, '+1', 'कल'],
  [/परसों|day after tomorrow/, '+2', 'परसों'],
  [/(^|[^\u0900-\u097F])आज(?![\u0900-\u097F])|\btoday\b/, '0', 'आज'],
];

const LOCATION_CUES: Array<[RegExp, string]> = [
  [/वाराणसी|काशी|banaras|varanasi/, 'वाराणसी'],
  [/पटना|patna/, 'पटना'],
  [/दिल्ली|delhi/, 'दिल्ली'],
  [/मुंबई|मुम्बई|mumbai/, 'मुंबई'],
  [/बेंगलुरु|बैंगलोर|bengaluru|bangalore/, 'बेंगलुरु'],
  [/कोलकाता|kolkata/, 'कोलकाता'],
  [/लखनऊ|lucknow/, 'लखनऊ'],
  [/प्रयागराज|इलाहाबाद|prayagraj/, 'प्रयागराज'],
];

export interface EntityPatch {
  subject?: SubjectKind;
  dateShift?: 'ACTIVE' | '0' | '+1' | '+2';
  dateLabelHi?: string;
  location?: string;
  detailLevel?: DetailLevel;
}

export function extractEntities(n: NormalizedUtterance): EntityPatch {
  const patch: EntityPatch = {};
  for (const [re, kind] of SUBJECT_CUES) if (re.test(n.text)) { patch.subject = kind; break; }
  for (const [re, shift, label] of DATE_CUES) if (re.test(n.text)) { patch.dateShift = shift as EntityPatch['dateShift']; patch.dateLabelHi = label; break; }
  for (const [re, loc] of LOCATION_CUES) if (re.test(n.text)) { patch.location = loc; break; }
  if (INTENT_CUES.DETAIL_SHORT.some(([re]) => re.test(n.text))) patch.detailLevel = 'SHORT';
  else if (INTENT_CUES.DETAIL_PANDIT.some(([re]) => re.test(n.text))) patch.detailLevel = 'PANDIT';
  return patch;
}

export function applyEntities(state: ConversationState, patch: EntityPatch): ConversationState {
  const next: ConversationState = { ...state, stack: [...state.stack] };
  if (patch.subject) next.activeSubject = patch.subject;
  if (patch.location) next.activeLocation = patch.location;
  if (patch.detailLevel) next.detailLevel = patch.detailLevel;
  if (patch.dateShift === 'ACTIVE' && state.activeDate) {
    next.activeDateLabelHi = patch.dateLabelHi ?? state.activeDateLabelHi;
  } else if (patch.dateShift && patch.dateShift !== 'ACTIVE') {
    const d = new Date();
    d.setDate(d.getDate() + Number(patch.dateShift));
    next.activeDate = d.toISOString().slice(0, 10);
    next.activeDateLabelHi = patch.dateLabelHi ?? null;
  }
  return next;
}

/* ------------------------------------------------------------------ */
/* 4. FlowStack — suspend / resume                                     */
/* ------------------------------------------------------------------ */

export function suspendFlow(state: ConversationState, frame: FlowFrame): ConversationState {
  return {
    ...state,
    stack: state.pendingFlow ? [...state.stack, state.pendingFlow] : [...state.stack],
    pendingFlow: frame,
  };
}

export function resumeFlow(state: ConversationState): { state: ConversationState; frame: FlowFrame } | null {
  if (!state.pendingFlow) return null;
  const frame = state.pendingFlow;
  const stack = [...state.stack];
  const pendingFlow = stack.pop() ?? null;
  return { state: { ...state, pendingFlow, stack }, frame };
}

/** Human-readable name for a suspended step, so the resume promise is warm. */
const STEP_LABEL_HI: Record<string, string> = {
  SELECT_DOMAIN: 'क्षेत्र-चयन', ASK_NAME: 'नाम',
  ASK_BIRTH_DATE: 'जन्म तिथि', ASK_BIRTH_TIME: 'जन्म समय',
  ASK_BIRTH_CITY: 'जन्म स्थान', ASK_QUESTION: 'आपका प्रश्न',
};

export function resumePromptHi(frame: FlowFrame): string {
  const stepLabel = STEP_LABEL_HI[frame.step] ?? frame.step;
  return `🙏 आपके प्रश्न से पहले "${frame.labelHi}" ${stepLabel} पर रुका था — वहीं से, बिना कुछ खोए, जारी करते हैं।`;
}

/* ------------------------------------------------------------------ */
/* 5. MissingSlotResolver                                              */
/* ------------------------------------------------------------------ */

export const INTAKE_SLOT_ORDER = ['name', 'birthDate', 'birthTime', 'birthCity', 'question'] as const;
export type IntakeSlot = (typeof INTAKE_SLOT_ORDER)[number];

export const INTAKE_SLOT_QUESTION_HI: Record<IntakeSlot, string> = {
  name: 'आपका शुभ नाम क्या है?',
  birthDate: 'जन्म तिथि बताइए (जैसे 15/06/1995)।',
  birthTime: 'जन्म समय बताइए (जैसे 10:30 AM)।',
  birthCity: 'जन्म स्थान कौन सा है?',
  question: 'अंत में एक बात — आज मन में सबसे बड़ा प्रश्न क्या है?',
};

export function nextMissingSlot(slots: Record<string, string>): IntakeSlot | null {
  for (const slot of INTAKE_SLOT_ORDER) {
    const v = slots[slot];
    if (typeof v !== 'string' || v.trim().length === 0) return slot;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* 6. DeterministicRouter + TemplateEngine — follow-ups                */
/* ------------------------------------------------------------------ */

/**
 * Authored "because" and "meaning" lines per fact family. These are the
 * answers to क्यों? and मतलब? — written once, by hand, from the same rule the
 * engine calculates with. Never generated, never fetched.
 */
const FACT_FAMILY_EXPLANATIONS: Record<string, { whyHi: string; meaningHi: string }> = {
  GET_RAHUKAAL: {
    whyHi: 'राहुकाल दिनमान को आठ भागों में बाँटकर राहु के क्रम से गिना जाता है — यह पंचांग का गणित है, गोचर का नहीं; इसलिए यह प्रतिदिन बदलता है।',
    meaningHi: 'इसका अर्थ है: इस अवधि में नया शुभ कार्य आरम्भ न करें; जारी कार्य, जप और दर्शन हेतु समय बाधित नहीं है।',
  },
  GET_FULL_PANCHANG: {
    whyHi: 'तिथि, वार, नक्षत्र, योग और करण — पाँचों अंग सूर्य-चन्द्र के वास्तविक गणित से बनते हैं; पंचांग इन्हीं पाँच अंगों का नाम है।',
    meaningHi: 'इसका अर्थ है: दिन का स्वभाव इन पाँच अंगों से पढ़ा जाता है — व्रत, मुहूर्त और यात्रा का निर्णय इन्हीं पर टिकता है।',
  },
  GET_TITHI: {
    whyHi: 'तिथि सूर्य और चन्द्र के बीच प्रत्येक १२ अंश के अन्तर से बनती है; इसलिए वह कभी घटती-बढ़ती है और कभी क्षय होती है।',
    meaningHi: 'इसका अर्थ है: व्रत और पर्व की पात्रता इसी तिथि के प्रारम्भ-काल से तय होती है।',
  },
  GET_NAKSHATRA: {
    whyHi: 'चन्द्रमा जिस नक्षत्र-पद में स्थित हो वही जन्म-नक्षत्र और दिन का नक्षत्र कहलाता है; गणना चन्द्र की वास्तविक भुजांश से होती है।',
    meaningHi: 'इसका अर्थ है: नामाक्षर, मुंडन और यात्रा के परम्परागत नियम इसी नक्षत्र से पढ़े जाते हैं।',
  },
  GET_NEXT_EKADASHI: {
    whyHi: 'एकादशी शुक्ल तथा कृष्ण पक्ष की ग्यारहवीं तिथि है; तिथि के क्षय-वृद्धि के कारण वह कभी दो दिन स्पर्श करती है।',
    meaningHi: 'इसका अर्थ है: व्रत का पारण अगली द्वादशी के निर्धारित घंटे में ही करें — पंचांग यही बताता है।',
  },
  GET_ABHIJIT_MUHURTA: {
    whyHi: 'अभिजित मुहूर्त दिनमान के आठवें भाग का मध्य-भाग है; वह राहुकाल के भीतर होते हुए भी शुभ माना जाता है, क्योंकि वह भगवान विष्णु का अंश कहलाता है।',
    meaningHi: 'इसका अर्थ है: जब दिन में और कोई मुहूर्त न मिले, तब इसी एक घड़ी में कार्य करें।',
  },
};

/** Reader-facing Hindi label per factual intent family, for the active fact. */
export const INTENT_LABEL_HI: Record<string, string> = {
  GET_RAHUKAAL: 'राहुकाल',
  GET_FULL_PANCHANG: 'पंचांग',
  GET_TITHI: 'तिथि',
  GET_NAKSHATRA: 'नक्षत्र',
  GET_NEXT_EKADASHI: 'अगली एकादशी',
  GET_ABHIJIT_MUHURTA: 'अभिजित मुहूर्त',
  GET_MOON_SIGN: 'चन्द्र राशि',
  GET_NEXT_PURNIMA: 'अगली पूर्णिमा',
};

const DEFAULT_EXPLANATION = {
  whyHi: 'यह उत्तर CosmicTantra के सत्यापित पंचांग-गणित से आया है — गणना लाहिरी अयनांश पर होती है और किसी भाषा मॉडल से नहीं लिखी जाती।',
  meaningHi: 'सरल शब्दों में: जो मान आपको मिला वह गणित का फल है; परम्परा उसका प्रयोग कार्य-निर्णय में करती है, भविष्यवाणी में नहीं।',
};

export type FollowUpKind = 'WHY' | 'MEANING' | 'UNTIL' | 'THAT_DAY' | 'SUBJECT_RASHI' | 'RESUME';

export interface FollowUpReply {
  kind: FollowUpKind;
  text: string;
  speakText: string;
}

const SUBJECT_LABEL_HI: Record<SubjectKind, string> = {
  SELF: 'आपकी', PARTNER: 'आपके संगी की', CHILD: 'आपके बच्चे की',
  PARENT: 'आपके माता/पिता की', SIBLING: 'आपके भाई/बहन की', OTHER: 'उनकी',
};

/**
 * Resolves the pronoun-and-ellipsis follow-ups the plan names explicitly:
 * "उस दिन?", "कल वाला?", "उसकी राशि?", "क्यों?", "मतलब?", "कब तक?", "वापस".
 * Returns null when the utterance is not a follow-up, so the caller can fall
 * through to the factual engines.
 */
export function routeFollowUp(
  intent: ConversationalIntent,
  state: ConversationState,
): FollowUpReply | null {
  const fact = state.activeFact;
  switch (intent) {
    case 'RESUME_FLOW': {
      if (!state.pendingFlow) {
        return {
          kind: 'RESUME',
          text: 'अभी कोई रुका हुआ कार्य नहीं है — मुख्य मेन्यू से कोई भी सेवा चुनिए, मैं वहीं से आरम्भ करूँगा।',
          speakText: 'अभी कोई रुका हुआ कार्य नहीं है। मुख्य मेन्यू से कोई सेवा चुनिए।',
        };
      }
      return null; // caller resumes the flow and re-asks its slot
    }
    case 'FOLLOWUP_THAT_DAY': {
      if (!state.activeDate) {
        return {
          kind: 'THAT_DAY',
          text: 'किस दिन की बात करूँ? अब तक की बातचीत में कोई तिथि नहीं बँधी — "कल", "परसों" या पूरी तिथि लिखिए, मैं उसी दिन का पंचांग निकाल दूँगा।',
          speakText: 'किस दिन की बात करूँ? कल, परसों या पूरी तिथि बताइए।',
        };
      }
      return null; // caller re-runs the factual engine on state.activeDate
    }
    case 'FOLLOWUP_SUBJECT_RASHI': {
      return {
        kind: 'SUBJECT_RASHI',
        text: state.activeFact?.valueHi
          ? `${SUBJECT_LABEL_HI[state.activeSubject]} राशि कुंडली-सारांश में दर्ज है। पूर्ण कुंडली खोलिए तो लग्न, चन्द्र राशि और नवांश एक साथ दिखेंगे — मैं स्वयं केवल वही बताता हूँ जो गणना में दर्ज है।`
          : `${SUBJECT_LABEL_HI[state.activeSubject]} राशि बताने हेतु उनके जन्म विवरण की आवश्यकता है — मैं अनुमान से कोई राशि नहीं कहता। कुंडली इन्टेक आरम्भ करें?`,
        speakText: state.activeFact?.valueHi
          ? 'राशि कुंडली-सारांश में दर्ज है; पूर्ण कुंडली में लग्न और चन्द्र राशि एक साथ दिखेंगे।'
          : 'राशि बताने हेतु जन्म विवरण चाहिए; मैं अनुमान नहीं कहता।',
      };
    }
    case 'FOLLOWUP_WHY':
    case 'FOLLOWUP_MEANING':
    case 'FOLLOWUP_UNTIL': {
      if (!fact) {
        return {
          kind: intent === 'FOLLOWUP_WHY' ? 'WHY' : intent === 'FOLLOWUP_MEANING' ? 'MEANING' : 'UNTIL',
          text: 'किस उत्तर का कारण पूछ रहे हैं? अभी तक कोई गणना-उत्तर नहीं दिया गया — पहले प्रश्न कीजिए, फिर मैं कारण, अर्थ और अवधि तीनों बताऊँगा।',
          speakText: 'अभी कोई गणना-उत्तर नहीं दिया गया; पहले प्रश्न कीजिए।',
        };
      }
      const fam = FACT_FAMILY_EXPLANATIONS[fact.intent] ?? DEFAULT_EXPLANATION;
      if (intent === 'FOLLOWUP_WHY') {
        return { kind: 'WHY', text: `कारण यह है — ${fam.whyHi}`, speakText: `कारण यह है। ${fam.whyHi}` };
      }
      if (intent === 'FOLLOWUP_MEANING') {
        return { kind: 'MEANING', text: `सरल अर्थ — ${fam.meaningHi} मूल उत्तर था: ${fact.valueHi}`, speakText: `सरल अर्थ। ${fam.meaningHi}` };
      }
      const until = fact.untilHi
        ? `यह ${fact.untilHi} तक मान्य है — उसके पश्चात् अगला प्रहर/तिथि-क्रम लागू होगा।`
        : 'यह मान उसी पंचांग-दिन तक मान्य है; अगले दिन का क्रम बदल जाएगा, इसलिए नई गणना चाहिए।';
      return { kind: 'UNTIL', text: `कब तक? ${until}`, speakText: `कब तक? ${until}` };
    }
    default:
      return null;
  }
}

/** Captures the delivered answer as the conversation's active fact. */
export function recordFact(
  state: ConversationState,
  fact: { intent: string; labelHi: string; valueHi: string; dateIso?: string; locationHi?: string },
): ConversationState {
  const until = /(\d{1,2}[:.]\d{2}\s*(?:AM|PM|am|pm)?[^।]{0,24}तक)/.exec(fact.valueHi)?.[1]?.trim();
  return {
    ...state,
    activeIntent: fact.intent,
    activeFact: { ...fact, untilHi: until || undefined },
  };
}

/* ------------------------------------------------------------------ */
/* 7. Life concerns — empathic first, technical never first            */
/* ------------------------------------------------------------------ */

export type LifeConcern = 'JOB' | 'HEARTBREAK' | 'STRESS';

export function detectLifeConcern(intent: ConversationalIntent | null): LifeConcern | null {
  if (intent === 'LIFE_CONCERN_JOB') return 'JOB';
  if (intent === 'LIFE_CONCERN_HEARTBREAK') return 'HEARTBREAK';
  if (intent === 'LIFE_CONCERN_STRESS') return 'STRESS';
  return null;
}

export const LIFE_PATHWAY_CHIPS = [
  { label: '💬 बात करना', action: 'LIFE_PATH_TALK' },
  { label: '🕰️ वर्तमान समय समझना', action: 'LIFE_PATH_TIME' },
  { label: '🕉️ शान्ति अभ्यास', action: 'LIFE_PATH_SHANTI' },
  { label: '📿 जप', action: 'LIFE_PATH_JAPA' },
  { label: '🪔 दर्शन', action: 'LIFE_PATH_DARSHAN' },
  { label: '📞 पंडित से बात', action: 'OPEN_CONCIERGE' },
] as const;

const LIFE_CONCERN_ACK: Record<LifeConcern, string> = {
  JOB: 'नौकरी और जीविका की चिन्ता सबसे पहले शरीर पर बैठती है — नींद, भूख, धैर्य। आपकी यह बेचैनी वास्तविक है, और इसका उत्तर केवल कुंडली नहीं हो सकता। मैं ज्योतिष से पहले आपके साथ हूँ।',
  HEARTBREAK: 'टूटे रिश्ते का दुःख शब्दों से बड़ा होता है; अभी किसी ग्रह की बात करना जल्दबाज़ी होगी। पहले यह जानिए — आपकी यह पीड़ा असंगत नहीं है, और आप अकेले नहीं हैं।',
  STRESS: 'मन का भारी होना कोई दोष नहीं है; यह संकेत है कि आपने बहुत देर तक अकेले सम्हाला है। एक साँस लीजिए — हम धीरे-धीरे चलेंगे, शास्त्र से नहीं, साथ से।',
};

export function lifeConcernReply(concern: LifeConcern, seekerName: string): { text: string; speakText: string } {
  const name = seekerName.trim() ? `${seekerName.trim()} जी, ` : '';
  const text = `${name}${LIFE_CONCERN_ACK[concern]}\n\nजब मन तैयार हो तब इनमें से कोई एक द्वार चुनिए — कोई क्रम नहीं, कोई बाध्यता नहीं:`;
  return { text, speakText: `${name}${LIFE_CONCERN_ACK[concern]}` };
}

/* ------------------------------------------------------------------ */
/* 8. NextBestActions                                                  */
/* ------------------------------------------------------------------ */

export function nextBestActions(state: ConversationState): Array<{ label: string; action: string }> {
  const chips: Array<{ label: string; action: string }> = [];
  if (state.activeFact) {
    chips.push({ label: '❓ क्यों?', action: 'FOLLOWUP_WHY' });
    chips.push({ label: '💡 मतलब?', action: 'FOLLOWUP_MEANING' });
    chips.push({ label: '⏳ कब तक?', action: 'FOLLOWUP_UNTIL' });
  }
  if (state.activeDate) {
    chips.push({ label: `📅 ${state.activeDateLabelHi ?? 'उसी'} दिन का पंचांग दोहराएँ`, action: 'FOLLOWUP_THAT_DAY' });
  }
  if (state.pendingFlow) {
    chips.push({ label: `↩️ वापस — ${state.pendingFlow.labelHi} जारी रखें`, action: 'RESUME_FLOW' });
  }
  chips.push({ label: '🗂️ मुख्य मेन्यू', action: 'MAIN_MENU' });
  return chips;
}
