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

  /* ---- Remaining Part A report-model copy ---- */
  'Degrees are shown in degrees and arc-minutes; the exact decimal longitude is retained in the machine record and printed in the Scholar Appendix. A status appears only when the engine actually calculated it.':
    'अंश और कला में स्थिति दी गई है; सटीक दशमलव देशान्तर गणना-अभिलेख और विद्वत्-परिशिष्ट में सुरक्षित है। कोई अवस्था तभी दिखाई जाती है जब गणक ने उसका वास्तविक निर्धारण किया हो।',

  'Functional position is what the graha rules FOR THIS LAGNA. It is kept apart from natural character, which is printed in the Scholar Appendix. No maraka verdict is issued by this engine.':
    'कार्यात्मक स्थिति बताती है कि यह ग्रह इसी लग्न के लिए किन भावों का स्वामी है। इसे नैसर्गिक स्वभाव से अलग रखा गया है, जो विद्वत्-परिशिष्ट में दिया है। यह गणक कोई मारक निर्णय नहीं देता।',

  'Rahu and Ketu are marked retrograde by the mean-node convention, not by observed motion.':
    'राहु और केतु को मध्यम-नोड परिपाटी के अनुसार वक्री दिखाया गया है, प्रत्यक्ष गति के अनुसार नहीं।',

  'Shadbala: validation pending — computed internally, not verified, and used in no conclusion.':
    'षड्बल: सत्यापन प्रगति में है — भीतर से गणित है, स्वतंत्र रूप से सत्यापित नहीं, और किसी निष्कर्ष में प्रयुक्त नहीं।',

  'Drishti listed is full Parashari graha drishti only. Bhava strength (bhava bala) is NOT calculated for this report — see the Scholar Appendix.':
    'यहाँ केवल पूर्ण पराशरी ग्रह-दृष्टि दी गई है। इस रिपोर्ट के लिए भाव-बल की गणना नहीं की गई — विवरण विद्वत्-परिशिष्ट में है।',

  'This rule variant is recorded but not adopted; no verdict is issued.':
    'नियम का यह प्रकार दर्ज है पर अपनाया नहीं गया; कोई निर्णय नहीं दिया गया है।',

  'This rule was not calculated; absence is not claimed.':
    'इस नियम की गणना नहीं हुई; अनुपस्थिति का दावा नहीं किया गया है।',

  'Mars is not in bhava 1/4/7/8/12.':
    'मंगल प्रथम, चतुर्थ, सप्तम, अष्टम अथवा द्वादश भाव में नहीं है।',

  'Natal check only: Saturn\'s sign relative to the Moon at birth. This is not a transit search over the client\'s life.':
    'यह केवल जन्मकालीन जाँच है: जन्म के समय चन्द्र से शनि की राशि-स्थिति। यह जीवन भर के गोचर की खोज नहीं है।',

  'No rule definition adopted; absence is not claimed.':
    'कोई नियम-परिभाषा नहीं अपनाई गई; अनुपस्थिति का दावा नहीं किया गया है।',

  'A report is verified by comparing four values: report ID, content hash, calculation version and report-model version.':
    'रिपोर्ट की जाँच चार मानों की तुलना से होती है: रिपोर्ट पहचान, विषय-वस्तु हैश, गणना संस्करण और रिपोर्ट-मॉडल संस्करण।',

  'The kinds of statement in this report, kept apart':
    'इस रिपोर्ट के कथनों के प्रकार, अलग-अलग',

  'CALCULATED FACT — produced by the astronomical calculation. A position, a bhava, a date.':
    'गणित तथ्य — खगोलीय गणना से निकला तथ्य; जैसे स्थिति, भाव या दिनांक।',
  'DERIVED FACT — a classical rule applied to those facts. A bhava lord, an aspect, a dignity.':
    'व्युत्पन्न तथ्य — इन तथ्यों पर लागू शास्त्रीय नियम; जैसे भावेश, दृष्टि या अवस्था।',
  'TRADITIONAL RULE — a named yoga or dosha, with its conditions and its verdict.':
    'पारम्परिक नियम — नामित योग या दोष, उसकी शर्तों और निर्णय सहित।',
  'READING — reasoning over facts and rules. Always labelled, always backed by the evidence it used.':
    'पाठ — तथ्यों और नियमों पर विचार। इसे सदा अलग चिह्नित किया जाता है और प्रयुक्त प्रमाण साथ रहता है।',
  'REFLECTION — a question or a practical thought for the consultation. Never a prediction.':
    'परामर्श-विचार — परामर्श के लिए प्रश्न या व्यावहारिक विचार; कभी भविष्यवाणी नहीं।',
  'NOT CALCULATED — the engine did not compute it. This is never rewritten as "absent".':
    'गणना नहीं — गणक ने इसका निर्धारण नहीं किया। इसे कभी “अनुपस्थित” नहीं लिखा जाता।',

  'every condition of the rule evaluated true':
    'नियम की प्रत्येक शर्त सत्य निकली',
  'every condition evaluated, at least one false':
    'प्रत्येक शर्त जाँची गई, कम-से-कम एक असत्य निकली',
  'the sources disagree; the variant is recorded, not adopted':
    'स्रोतों में मतभेद है; प्रकार दर्ज है, अपनाया नहीं गया',
  'not computed. Absence is not claimed':
    'गणना नहीं हुई; अनुपस्थिति का दावा नहीं',
  'computed but not yet trusted; shown, never used in a conclusion':
    'गणित है पर अभी सत्यापित नहीं; दिखाया गया है, निष्कर्ष में प्रयुक्त नहीं',

  'What this report will never do':
    'यह रिपोर्ट कभी क्या नहीं करेगी',
  'It will not predict death, disease, marriage, childbirth, a court result or a financial outcome.':
    'यह मृत्यु, रोग, विवाह, सन्तान, न्यायालय के परिणाम या धन-संबंधी फल की भविष्यवाणी नहीं करेगी।',
  'It will not give a percentage chance of anything. Coverage figures describe evidence, not probability.':
    'यह किसी बात की प्रतिशत संभावना नहीं बताएगी। व्याप्ति के आँकड़े प्रमाण बताते हैं, संभावना नहीं।',
  'It will not silently mix Parashari, Jaimini and KP. Every rule states its system.':
    'यह पराशरी, जैमिनि और केपी पद्धतियों को चुपचाप नहीं मिलाएगी। प्रत्येक नियम अपनी पद्धति बताता है।',
  'It will not present an interpretation as a calculated fact.':
    'यह व्याख्या को गणित तथ्य के रूप में प्रस्तुत नहीं करेगी।',

  'Jyotish is an interpretive discipline. This document states what was calculated, what a tradition says about it, and what was not calculated at all. It is not a guarantee or a certainty about any future event, and it must not be used as the basis for medical, legal or financial decisions. © 2026 CosmicTantra Technologies Pvt. Ltd.':
    'ज्योतिष एक व्याख्यात्मक विद्या है। यह दस्तावेज़ बताता है कि क्या गणित हुआ, परम्परा उसके विषय में क्या कहती है, और क्या बिल्कुल गणित नहीं हुआ। यह किसी भावी घटना की गारंटी या निश्चितता नहीं है और इसे चिकित्सा, विधिक अथवा वित्तीय निर्णय का आधार नहीं बनाया जाना चाहिए। © २०२६ कॉस्मिकतन्त्र टेक्नोलॉजीज़ प्रा. लि.',

  'The resolved factors agree; none contradicts the others.':
    'निर्धारित कारक एकमत हैं; कोई दूसरे का विरोध नहीं करता।',
  'The resolved factors agree in the negative direction.':
    'निर्धारित कारक प्रतिकूल दिशा में एकमत हैं।',
  'No resolved factors are available to compare.':
    'तुलना के लिए कोई निर्धारित कारक उपलब्ध नहीं है।',

  'No profession, employer, salary, promotion or business outcome is named.':
    'किसी पेशे, नियोक्ता, वेतन, पदोन्नति या व्यापार-फल का नाम नहीं दिया गया है।',
  'No date of a career event is given.':
    'कर्म-सम्बन्धी घटना की कोई तारीख नहीं दी गई है।',
  'Evidence coverage is the fraction of the declared factor checklist that produced evidence. It is not a probability of success.':
    'प्रमाण-व्याप्ति घोषित कारक-सूची का वह अंश है जिससे प्रमाण मिला। यह सफलता की संभावना नहीं है।',
  'D10, shadbala and transits did not contribute to this reading.':
    'दशांश, षड्बल और गोचर ने इस पाठ में कोई योगदान नहीं दिया है।',

  'D10 is quarantined — see the Scholar Appendix.':
    'दशांश पृथक रखा गया है — विवरण विद्वत्-परिशिष्ट में है।',
  'Gochara rules are not validated for this report.':
    'इस रिपोर्ट के लिए गोचर-नियम सत्यापित नहीं हैं।',
  'Reported as not calculated; absence is not claimed.':
    'गणना नहीं के रूप में दर्ज; अनुपस्थिति का दावा नहीं।',

  /* ---- Consultation-density summaries ---- */
  'Highlights are selected by declared salience rules over the calculated chart. The rule behind each line is listed in the Scholar Appendix.':
    'मुख्य बिन्दु गणित कुण्डली के घोषित महत्त्व-नियमों से चुने गए हैं। हर पंक्ति का नियम विद्वत्-परिशिष्ट में दिया है।',
  'Degrees are shown in degrees and arc-minutes. Exact decimal longitudes are in the Scholar Appendix.':
    'स्थिति अंश और कला में दी गई है। सटीक दशमलव देशान्तर विद्वत्-परिशिष्ट में है।',
  'Source status for every rule above: traditional attribution, verification pending. Full provenance is in the Scholar Appendix.':
    'ऊपर के प्रत्येक नियम का स्रोत-स्थिति: पारम्परिक आरोपण, सत्यापन शेष। पूरा स्रोत-विवरण विद्वत्-परिशिष्ट में है।',
  'Source status for every rule above: traditional attribution — verification pending. The full provenance statement for each rule, including which locators have not been checked against a held edition, is in the Scholar Appendix.':
    'ऊपर के प्रत्येक नियम का स्रोत-स्थिति पारम्परिक आरोपण और सत्यापन शेष है। हर नियम का पूरा स्रोत-विवरण, जिसमें अप्रतिपादित संदर्भ भी हैं, विद्वत्-परिशिष्ट में है।',
  'D10 has not been compared against an external reference, so it is displayed for reference only and is used in no conclusion.':
    'दशांश का बाहरी प्रमाण से मिलान नहीं हुआ है; यह केवल संदर्भ के लिए दिखाया गया है और किसी निष्कर्ष में प्रयुक्त नहीं।',

  /* ── Executive Life Gauge (V43 parity with the on-screen summary) ────── */
  'Six readings of one chart. Each is built from the graha bala of its own significators and the Sarvashtakavarga bindus of the bhavas they rule — the same six dimensions the on-screen summary shows, printed here with the same numbers, so a consultation never reads a different chart from the one the seeker saw.':
    'एक ही कुण्डली के छह पाठ। प्रत्येक अपने कारक ग्रहों के बल तथा उनके शासित भावों के सर्व अष्टकवर्ग बिन्दुओं से बना है — वे ही छह आयाम जो स्क्रीन सारांश दिखाता है, यहाँ उन्हीं अंकों के साथ मुद्रित हैं, ताकि परामर्श में वह कुण्डली कभी न पढ़ी जाए जो साधक ने देखी थी उससे भिन्न हो।',
  'The classical axis beside each dimension is the traditional purushartha reading of that dimension\'s own significators. It adds no score and no new fact. Vidya and Arogya are read from the fifth and sixth bhavas in the Bhava Intelligence Matrix.':
    'प्रत्येक आयाम के साथ दी गई शास्त्रीय धुरी उन्हीं कारकों का पारम्परिक पुरुषार्थ-पाठ है। यह न कोई नया अंक जोड़ती है, न कोई नया तथ्य। विद्या एवं आरोग्य का पाठ भाव विश्लेषण में पंचम और षष्ठ भाव से किया जाता है।',
  'How far these readings go':
    'इन पाठों की सीमा',
  'The strength ratios behind these six readings are computed but have not yet been checked against an external reference, so they orient a conversation rather than settle one. Nothing here is a prediction: no event, no timing and no verdict is claimed, and no dimension overrides the calculated chart facts printed in this folio.':
    'इन छह पाठों के पीछे के बल-अनुपात गणित हैं, किन्तु बाहरी प्रमाण से उनकी तुलना अभी शेष है; अतः ये चर्चा को दिशा देते हैं, निर्णय नहीं करते। यहाँ कुछ भी भविष्यकथन नहीं है — न कोई घटना, न काल, न अन्तिम मत; और कोई आयाम इस प्रति में मुद्रित गणित कुण्डली-तथ्यों को नहीं बदलता।',
  'These four quadrants are the classical karakatva of each graha, printed beside this chart\'s own placement of it in the table above. They are traditional guidance keyed to the nature of the graha — not an individualised prediction and not a timing. An upaaya is offered as practice, never as a promised result.':
    'ये चतुष्क प्रत्येक ग्रह का शास्त्रीय कारकत्व हैं, जो ऊपर की सारणी में इसी कुण्डली में उसके स्थान के साथ मुद्रित हैं। ये ग्रह-स्वभाव पर आधारित पारम्परिक मार्गदर्शन हैं — न व्यक्तिगत भविष्यकथन, न काल-निर्देश। उपाय साधना हेतु है, किसी प्रत्याशित फल हेतु नहीं।',

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
