/**
 * KUNDLI V41 — Hindi prose passages (§2).
 *
 * `structuralTerms.ts` handles the closed vocabulary: table headers, kv
 * labels, graha and rashi names, status words. This module handles the other
 * half of Part A — the sentences. They are a different problem and deserve a
 * different file.
 *
 * WHY THESE ARE AUTHORED, NOT TRANSLATED
 * --------------------------------------
 * A Kundli explains itself in the reader's language or it does not explain
 * itself at all. Running the English through a translator produces sentences
 * that are grammatical and lifeless — "व्याख्या नहीं की गई है" for "nothing
 * here is interpreted" is correct and reads like a form. The Hindi below is
 * written to say the same *thing*, in the register a Pandit would use, and in
 * several places it is deliberately shorter than the English because Hindi
 * carries this material more compactly.
 *
 * The engine's promises are load-bearing and are preserved exactly: where the
 * English refuses to predict, the Hindi refuses to predict; where the English
 * says "not calculated" rather than "absent", so does the Hindi. A softened
 * translation of a disclaimer is a broken disclaimer.
 *
 * KEYING
 * ------
 * Same contract as `structuralTerms.tr`: the English source string is the key,
 * an unknown string passes through unchanged. That keeps the English readable
 * at the call site and makes a missing passage a visible gap rather than a
 * crash — the §3 gate is what turns that gap into a failure.
 *
 * SCOPE — what is NOT here
 * ------------------------
 * Part A also contains ~33 sentences that are *generated* by the derivation
 * layer (structuralHighlights, careerSynthesis, consultationQuestions,
 * dashaActivation) with chart data interpolated into them. A source-string
 * dictionary cannot reach those: the string does not exist until the chart is
 * computed. They need parameterised message templates in the modules that
 * build them, which is tracked separately. `PROSE_COVERAGE` below records the
 * boundary honestly rather than letting it look finished.
 */
import type { LabelMode } from './labels';

export const PROSE_PASSAGES_VERSION = 'kundli-prose-passages-v1';

/**
 * English source sentence -> Hindi.
 *
 * Keys must match the source literal exactly, including the em dashes and the
 * typographic apostrophes the report uses.
 */
export const PROSE_HI: Record<string, string> = {
  /* ---- Passport ---- */
  'Every value on this page is an input or a declared setting. Nothing here is interpreted.':
    'इस पृष्ठ का प्रत्येक मान या तो आपके द्वारा दिया गया है, या गणना की घोषित पद्धति है। यहाँ कुछ भी व्याख्या नहीं है।',

  'Why this page comes first':
    'यह पृष्ठ सबसे पहले क्यों',

  'Every statement in this report is downstream of the six settings above. Change the ayanamsha or the house system and a different chart appears, with different bhava lords and different yoga verdicts. They are printed here, before any result, so a reader can reject the whole document on its inputs rather than argue with its conclusions.':
    'इस रिपोर्ट का हर कथन ऊपर दी गई छह पद्धतियों पर टिका है। अयनांश या भाव-पद्धति बदल दीजिए, और कुण्डली बदल जाएगी — भावेश भी, योगों का निर्णय भी। इसीलिए ये किसी भी परिणाम से पहले छापी गई हैं, ताकि पाठक निष्कर्षों से उलझने के बजाय आधार देखकर ही पूरे दस्तावेज़ को अस्वीकार कर सके।',

  'Lunar month: the amanta name above is derived by the panchang kernel from the Sun\'s sidereal rashi at birth. The purnimanta name is reported as not calculated — see the Scholar Appendix for why the two conventions are not treated as interchangeable here.':
    'चान्द्र मास: ऊपर दिया अमांत नाम पंचांग-गणक ने जन्म के समय सूर्य की निरयन राशि से निकाला है। पूर्णिमांत नाम की गणना नहीं की गई — दोनों परिपाटियों को यहाँ एक-दूसरे का पर्याय क्यों नहीं माना जाता, यह विद्वत्-परिशिष्ट में है।',

  /* ---- Saar ---- */
  'The structural chart in one page. Every line below is a calculated fact or a rule verdict; nothing on this page is an interpretation.':
    'एक पृष्ठ में कुण्डली का ढाँचा। नीचे की हर पंक्ति या तो गणित तथ्य है या नियम का निर्णय; इस पृष्ठ पर कोई व्याख्या नहीं है।',

  'Highlights are selected by declared salience rules over the calculated chart, not chosen by hand and not written by a language model. The rule that produced each line is listed in the Scholar Appendix.':
    'ये मुख्य बिन्दु गणित कुण्डली पर घोषित नियमों से चुने गए हैं — न हाथ से चुने गए, न किसी भाषा-मॉडल के लिखे। हर पंक्ति किस नियम से बनी, यह विद्वत्-परिशिष्ट में दर्ज है।',

  /* ---- Charts ---- */
  'North Indian format. House 1 is the top diamond and carries the Lagna marker; houses advance anticlockwise. A rule beneath an abbreviation marks retrograde motion.':
    'उत्तर भारतीय शैली। प्रथम भाव ऊपर का कोष्ठ है और उसी पर लग्न-चिह्न है; भाव वामावर्त बढ़ते हैं। संकेताक्षर के नीचे की रेखा वक्री गति दर्शाती है।',

  'The ninth division, drawn from the same canonical placements with the same visual grammar as D1. D1 and D9 are the two charts this report cross-checks.':
    'नवमांश — वही ग्रह-स्थितियाँ, वही चित्र-विधि जो D1 में है। यह रिपोर्ट D1 और D9, इन्हीं दो कुण्डलियों का परस्पर मिलान करती है।',

  'Every placement in the drawing, as text.':
    'चित्र की प्रत्येक स्थिति, अक्षरों में।',

  /* ---- Yoga and dosha ---- */
  'A yoga is marked present only when EVERY condition of the applied rule evaluated true. A rule the engine does not implement is marked not calculated — it is never rewritten as absent.':
    'योग तभी उपस्थित लिखा जाता है जब लागू नियम की प्रत्येक शर्त सत्य निकले। जो नियम इस गणक में नहीं है, उसे गणना नहीं लिखा जाता — उसे कभी अनुपस्थित नहीं बना दिया जाता।',

  'Only 11 yoga rules are registered in this engine build. A yoga that is not listed here is not claimed to be absent — it was simply not evaluated.':
    'इस संस्करण में केवल ११ योग-नियम पंजीकृत हैं। जो योग यहाँ नहीं है, उसे अनुपस्थित नहीं कहा जा रहा — उसकी परीक्षा ही नहीं हुई।',

  /* ---- Dasha ---- */
  'All nine mahadashas. The current period is marked; the bar length is proportional to the period length.':
    'सभी नौ महादशाएँ। वर्तमान दशा चिह्नित है; पट्टी की लम्बाई दशा की अवधि के अनुपात में है।',

  'The balance at birth printed above was re-derived from the Moon\'s longitude and agrees with the dasha engine to within one calendar day.':
    'ऊपर दिया जन्म-कालीन दशा-शेष चन्द्रमा के स्पष्ट अंश से पुनः निकाला गया है और दशा-गणक से एक दिन के भीतर मिलता है।',

  'A dasha states WHEN a part of the chart becomes prominent. It does not name the events that follow. The structures listed here are the ones the running lords touch; the outcome is not calculated and is not predicted.':
    'दशा यह बताती है कि कुण्डली का कौन-सा अंश कब प्रबल होगा। वह घटनाओं के नाम नहीं बताती। यहाँ वही योग-स्थितियाँ दी हैं जिन्हें चालू दशा के स्वामी स्पर्श करते हैं; फल की न गणना की गई है, न भविष्यवाणी।',

  'What this page does not say':
    'यह पृष्ठ क्या नहीं कहता',

  'This page states which parts of the chart the running period touches. It does not name the events that follow, or their timing, or whether an outcome is favourable. No event is predicted anywhere in this report.':
    'यह पृष्ठ केवल इतना कहता है कि चालू दशा कुण्डली के किन अंशों को स्पर्श करती है। न वह आगे की घटनाएँ बताता है, न उनका समय, न यह कि फल शुभ होगा या अशुभ। इस रिपोर्ट में कहीं भी किसी घटना की भविष्यवाणी नहीं है।',

  'Notes on the running period':
    'चालू दशा पर टिप्पणी',

  /* ---- Career ---- */
  'Career is the one interpretive domain V40 builds end to end. Every factor below is listed with the evidence that produced it, including the factors that work against the reading and the factors that could not be evaluated at all.':
    'कर्म-क्षेत्र ही वह एक विषय है जिसे यह संस्करण आदि से अन्त तक बनाता है। नीचे प्रत्येक कारक अपने प्रमाण के साथ दिया है — वे कारक भी जो इस पाठ के विरुद्ध जाते हैं, और वे भी जिनकी परीक्षा हो ही नहीं सकी।',

  'Read this before reading the conclusion':
    'निष्कर्ष पढ़ने से पहले यह पढ़ें',

  'Birth-time sensitivity: The 10th bhava, its lord and every bhava-based factor above depend on the lagna, which moves about one degree every four minutes. If the recorded birth time is uncertain by more than roughly two minutes, the bhava-based factors should be re-checked before use.':
    'जन्म-समय की संवेदनशीलता: दशम भाव, उसका स्वामी और ऊपर का प्रत्येक भाव-आधारित कारक लग्न पर निर्भर है, और लग्न प्रत्येक चार मिनट में लगभग एक अंश चलता है। यदि लिखे हुए जन्म-समय में लगभग दो मिनट से अधिक का संदेह हो, तो भाव-आधारित कारकों की पुनः जाँच के बाद ही उपयोग करें।',

  /* ---- Graha dossier and bhava matrix ---- */
  'All twelve bhavas with the sign on them, their lord, where that lord actually sits, who occupies them, and the full drishti they receive.':
    'बारहों भाव — उन पर पड़ी राशि, उनका स्वामी, वह स्वामी वस्तुतः कहाँ बैठा है, भाव में कौन स्थित है, और उन पर पड़ने वाली पूर्ण दृष्टि।',

  'Karaka attributions: Natural (naisargika) karakas as commonly taught in the Parashari stream. The 10th bhava carries the four karmic karakas (Sun, Mercury, Jupiter, Saturn). Contested assignments are omitted rather than included silently.':
    'कारक-निर्धारण: पराशर परम्परा में सामान्यतः पढ़ाए जाने वाले नैसर्गिक कारक। दशम भाव पर चार कर्म-कारक हैं (सूर्य, बुध, गुरु, शनि)। जिन कारकों पर मतभेद है, उन्हें चुपचाप जोड़ने के बजाय छोड़ दिया गया है।',

  /* ---- Discussion and notes ---- */
  'Questions raised by structures that exist in this chart. They are prompts for the consultation, not predictions, and none of them answers itself.':
    'इस कुण्डली में वस्तुतः विद्यमान योग-स्थितियों से उठने वाले प्रश्न। ये परामर्श के लिए संकेत हैं, भविष्यवाणी नहीं — और इनमें से कोई भी स्वयं अपना उत्तर नहीं देता।',

  'CosmicTantra generates these prompts to save a Pandit reading time. It does not answer them, and it does not replace the judgement that answers them.':
    'कॉस्मिकतन्त्र ये प्रश्न पण्डित जी का पाठ-समय बचाने के लिए बनाता है। वह इनका उत्तर नहीं देता, और जिस विवेक से इनका उत्तर मिलता है उसका स्थान भी नहीं लेता।',

  'For the practitioner\'s own observations during the consultation.':
    'परामर्श के समय पण्डित जी की अपनी टिप्पणियों हेतु।',

  /* ---- Disclaimer ---- */
  'Disclaimer':
    'अस्वीकरण',

  'No prediction of death, disease, marriage, childbirth, litigation or financial outcome is made anywhere in this report, and none is implied.':
    'इस रिपोर्ट में कहीं भी मृत्यु, रोग, विवाह, सन्तान, मुकदमे अथवा धन-हानि-लाभ की कोई भविष्यवाणी न की गई है, न ध्वनित है।',

  /* ---- Notes area headings (already bilingual in source) ---- */
  'Main observation / मुख्य अवलोकन': 'मुख्य अवलोकन',
  'Career / कर्म': 'कर्म',
  'Marriage / विवाह': 'विवाह',
  'Finance / धन': 'धन',
  'Dasha / दशा': 'दशा',
  'Remedy / उपाय': 'उपाय',
  'Follow-up / अगली भेंट': 'अगली भेंट',
};

/**
 * Renders a prose passage for the reader's locale.
 *
 * Prose does NOT double up in `hi-en` the way a label does. `लग्न / Ascendant`
 * is a useful gloss on two words; printing a whole paragraph twice would add
 * pages and be read by nobody. A reader who chose a Hindi locale gets the
 * Hindi paragraph, and the bilingual affordance stays where it earns its
 * space — in the terms.
 */
export function trProse(en: string, mode: LabelMode): string {
  if (mode === 'en') return en;
  return PROSE_HI[en] ?? en;
}

/** Is this passage authored in Hindi? Used by the §3 gate. */
export const hasProse = (en: string): boolean => en in PROSE_HI;

/**
 * The honest boundary of this file, asserted by the §3 gate so it cannot rot.
 *
 * `staticAuthored` is what a dictionary can reach. `generatedTemplates` is
 * what it cannot: sentences assembled at runtime from chart data by the
 * derivation layer. Localising those means parameterised templates inside
 * those modules, not more entries here.
 */
export const PROSE_COVERAGE = {
  staticAuthored: Object.keys(PROSE_HI).length,
  generatedTemplateOwners: [
    'structuralHighlights.ts',
    'careerSynthesis.ts',
    'consultationQuestions.ts',
    'dashaActivation.ts',
  ],
} as const;
