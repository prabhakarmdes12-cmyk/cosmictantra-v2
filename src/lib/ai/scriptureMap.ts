/**
 * SACRED SCRIPTURE WISDOM MAP (श्रीमद्भगवद्गीता, श्रीरामचरितमानस, उपनिषद् एवं वैदिक संहिता)
 * Matches seeker life situations, dilemmas, and emotional states with authentic shlokas and chaupais.
 */

export interface ScriptureInsight {
  id: string;
  situation: string;
  keywords: string[];
  sourceGrantha: string;
  sourceType: 'GITA' | 'RAMCHARITMANAS' | 'UPANISHAD' | 'VEDA' | 'CHANAKYA_NITI';
  verse: string;
  transliteration: string;
  meaningHi: string;
  meaningEn: string;
  kashiSahayakBridge: string;
  suggestedAction: string;
  quickChips: Array<{ label: string; action: string; href?: string }>;
}

export const SCRIPTURE_WISDOM_REGISTRY: ScriptureInsight[] = [
  // 1. Sadness, Grief, Mental Heaviness (उदासी / दुख / डिप्रेशन / भारी मन)
  {
    id: 'SADNESS_GRIEF',
    situation: 'उदासी, मानसिक भारीपन व दुख',
    keywords: ['sad', 'feeling sad', 'depress', 'unhappy', 'cry', 'grief', 'उदास', 'दुखी', 'रोना', 'भारी मन', 'हताश', 'दुख'],
    sourceGrantha: 'श्रीमद्भगवद्गीता (अध्याय २, श्लोक १४)',
    sourceType: 'GITA',
    verse: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः ।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत ॥',
    transliteration: "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ ।\\nāgamāpāyino 'nityās tāṁs titikṣasva bhārata ॥",
    meaningHi: 'हे कुन्तीपुत्र! सर्दी-गर्मी और सुख-दुख देने वाले इन्द्रिय और विषयों के संयोग तो उत्पत्ति और विनाशशील तथा अनित्य हैं, इसलिए हे भारत! तुम उन्हें धैर्यपूर्वक सहन करो। यह समय भी बीत जाएगा।',
    meaningEn: 'O son of Kunti, the nonpermanent appearance of happiness and distress, and their disappearance in due course, are like the appearance and disappearance of winter and summer seasons. One must learn to tolerate them without being disturbed.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 आपके मन की व्यथा और उदासी को हम समझ सकते हैं। जब मन भारी हो, तो भगवान श्रीकृष्ण का यह अमर वचन स्मरण करें। ज्योतिष में मन का स्वामी चन्द्रमा है — जिस प्रकार चन्द्रमा की कलाएं घटती-बढ़ती हैं, उसी प्रकार जीवन के सुख-दुख भी अनित्य हैं।',
    suggestedAction: 'भगवान विश्वनाथ के दिव्य साक्षात् दर्शन करें तथा १०८ बार महामृत्युंजय मन्त्र का शांत श्रवण करें।',
    quickChips: [
      { label: '📿 महामृत्युंजय मन्त्र जप', action: 'INTENT_MANTRA_MRITYUNJAYA' },
      { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN_KASHI' },
      { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR' }
    ]
  },

  // 2. Future Anxiety & Overthinking (भविष्य की चिन्ता / क्या होगा?)
  {
    id: 'FUTURE_ANXIETY',
    situation: 'भविष्य की चिन्ता एवं अनिर्णय',
    keywords: ['anxious', 'anxiety', 'worried', 'future', 'fear', 'tension', 'चिन्ता', 'तनाव', 'भविष्य', 'डर', 'घबराहट', 'क्या होगा'],
    sourceGrantha: 'श्रीरामचरितमानस (अयोध्या काण्ड, चौपाई)',
    sourceType: 'RAMCHARITMANAS',
    verse: 'होइहि सोइ जो राम रचि राखा ।\nको करि तर्क बढ़ावै साखा ॥\nअस कहि लगे जपन हरिनामा ।\nगए जहाँ सुखधाम रामा ॥',
    transliteration: 'hoihi soi jo rāma rachi rākhā ।\nko kari tarka baḍhāvai sākhā ॥',
    meaningHi: 'वही होगा जो परमेश्वर श्री राम ने रच रखा है। व्यर्थ का तर्क-वितर्क करके चिन्ता बढ़ाने से क्या लाभ? ईश्वर पर पूर्ण निष्ठा रखकर अपने वर्तमान कर्तव्य में प्रवृत्त रहें।',
    meaningEn: 'Whatever the Supreme Lord has destined shall surely come to pass. Why then multiply worries by endless overthinking? Trust the cosmic order and focus peacefully on duty.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 भविष्य का भय मन में व्यर्थ का भंवर पैदा करता है। गोस्वामी तुलसीदास जी ने काशी की धरती से यह अमर सत्य उद्घोष किया था। जब हम सब कुछ अपने नियन्त्रण में रखने का प्रयास करते हैं, तभी व्याकुलता होती है।',
    suggestedAction: 'अपने इष्टदेव को अपनी चिन्ता समर्पित कर आज के शुभ पञ्चाङ्ग अनुसार अपने कर्म पर ध्यान दें।',
    quickChips: [
      { label: '🕉️ आज का पञ्चाङ्ग व राहुकाल', action: 'INTENT_PANCHANG' },
      { label: '🪔 दशाश्वमेध गंगा आरती', action: 'INTENT_DARSHAN_GANGA' },
      { label: '🚩 काशी यात्रा परिपथ', action: 'INTENT_JOURNEY_KASHI' }
    ]
  },

  // 3. Career, Job, Business & Effort Dilemmas (करियर / नौकरी / व्यापार / परिणाम की चिन्ता)
  {
    id: 'CAREER_EFFORT',
    situation: 'करियर, व्यापार व कर्म का तनाव',
    keywords: ['career', 'job', 'business', 'interview', 'exam', 'promotion', 'success', 'करियर', 'नौकरी', 'व्यापार', 'परीक्षा', 'प्रमोशन', 'सफलता', 'मेहनत', 'काम'],
    sourceGrantha: 'श्रीमद्भगवद्गीता (अध्याय २, श्लोक ४७)',
    sourceType: 'GITA',
    verse: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    transliteration: "karmaṇy-evādhikāras te mā phaleṣu kadācana ।\\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi ॥",
    meaningHi: 'तुम्हारा अधिकार केवल कर्म करने में है, उसके फलों में कभी नहीं। इसलिए तुम कर्मफल के हेतु मत बनो और न ही तुम्हारी अकर्मण्यता (कर्म न करने) में आसक्ति हो।',
    meaningEn: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 कार्यक्षेत्र और उद्यम में मन का एकाग्र होना ही विजय का मूल मन्त्र है। गीता का यह श्लोक बताता है कि परिणाम की अति-चिन्ता कार्यक्षमता को घटा देती है। आप श्रेष्ठ कर्म करें, समय आपके पक्ष में अवश्य होगा।',
    suggestedAction: 'आज के चौघड़िया व अभिजीत मुहूर्त में अपने महत्वपूर्ण कार्य प्रारम्भ करें।',
    quickChips: [
      { label: '📅 शुभ मुहूर्त खिड़कियाँ देखें', action: 'INTENT_MUHURTA' },
      { label: '🕉️ आज का शुभ चौघड़िया', action: 'INTENT_PANCHANG' },
      { label: '📜 कार्य-व्यापार कुण्डली विश्लेषण', action: 'INTENT_SCHOLAR' }
    ]
  },

  // 4. Low Confidence, Feeling Weak, Helplessness (आत्मविश्वास की कमी / असहाय अनुभव)
  {
    id: 'LOW_CONFIDENCE',
    situation: 'आत्मबल की कमी व असहायता',
    keywords: ['cannot do', 'weak', 'hopeless', 'helpless', 'failure', 'हारा हुआ', 'कमजोर', 'मुझसे नहीं होगा', 'असहाय', 'निराश'],
    sourceGrantha: 'श्रीरामचरितमानस (सुन्दरकाण्ड, दोहा व चौपाई)',
    sourceType: 'RAMCHARITMANAS',
    verse: 'कवन सो काज कठिन जग माहीं ।\nजो नहिं होइ तात तुम्ह पाहीं ॥\nराम काज लगि तव अवतारा ।\nसुनतहिं भयउ पर्बताकारा ॥',
    transliteration: 'kavana so kāja kaṭhina jaga māhīṁ ।\njo nahiṁ hoi tāta tumha pāhīṁ ॥',
    meaningHi: 'संसार में ऐसा कौन सा कठिन कार्य है, जो आपसे न हो सके? जब जाम्बवान जी ने श्री हनुमान जी को उनकी असीम शक्ति का स्मरण कराया, तब वे पर्वत के समान महाबली हो गए। आपके भीतर भी अपार ईश्वरीय शक्ति विद्यमान है।',
    meaningEn: 'What task in this universe is too arduous for you to accomplish? When reminded of his innate divine strength, Lord Hanuman rose with towering confidence. Awakened spirit can conquer any obstacle.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 कभी-कभी प्रतिकूल परिस्थितियां हमें अपनी वास्तविक शक्ति भुला देती हैं। अपने भीतर के संकटमोचन स्वरूप को पहचानिए। कोई भी बाधा आपके आत्मबल से बड़ी नहीं है।',
    suggestedAction: 'श्री संकट मोचन हनुमान जी का ध्यान करें और श्री हनुमान चालीसा का पाठ करें।',
    quickChips: [
      { label: '📿 श्री हनुमान चालीसा / मन्त्र', action: 'INTENT_MANTRA_HANUMAN' },
      { label: '🪔 संकट मोचन हनुमान दर्शन', action: 'INTENT_DARSHAN_KASHI' },
      { label: '📜 आत्म-बल वृद्धि कुण्डली परामर्श', action: 'INTENT_SCHOLAR' }
    ]
  },

  // 5. Relationship Pain, Betrayal, Heartbreak (रिश्तों में क्लेश / धोखा / अकेलापन)
  {
    id: 'RELATIONSHIP_HEALING',
    situation: 'सम्बन्धों में कलह, पीड़ा व विश्वासघात',
    keywords: ['relationship', 'breakup', 'betrayal', 'cheated', 'marriage problem', 'fight', 'lonely', 'धोखा', 'रिश्ता', 'अकेला', 'झगड़ा', 'कलह', 'विवाह समस्या'],
    sourceGrantha: 'श्रीरामचरितमानस (अरण्य काण्ड, चौपाई)',
    sourceType: 'RAMCHARITMANAS',
    verse: 'धीरज धर्म मित्र अरु नारी ।\nआपद काल परिखिअहिं चारी ॥\nवृथा कलह नहिं मन में लावै ।\nसत्य प्रेम सोई सुख पावै ॥',
    transliteration: 'dhīraja dharma mitra aru nārī ।\nāpada kāla parikhi-ahiṁ chārī ॥',
    meaningHi: 'धैर्य, धर्म, मित्र और जीवनसंगिनी — इन चारों की वास्तविक परीक्षा विपत्ति काल में ही होती है। कठिन समय में संयम और सत्य प्रेम ही व्यक्ति को स्थिर और शांत रखता है।',
    meaningEn: 'Patience, virtue, genuine friendship, and devotion are truly tested in adversity. Cultivate inner stillness and truthful understanding during turbulent times.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 मानवीय सम्बन्धों में उतार-चढ़ाव मन को अत्यंत विचलित कर देते हैं। वैदिक परम्परा सिखाती है कि सम्बन्धों में अपेक्षाओं के स्थान पर आत्म-गरिमा व धैर्य धारण करना ही शान्ति का मार्ग है।',
    suggestedAction: 'माँ अन्नपूर्णा व भगवान विश्वनाथ से सद्बुद्धि व परिवार कल्याण की प्रार्थना करें।',
    quickChips: [
      { label: '📜 कुण्डली मिलान व वैवाहिक समाधान', action: 'INTENT_SCHOLAR' },
      { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN_KASHI' },
      { label: '🕉️ आज का गोचर व पञ्चाङ्ग', action: 'INTENT_PANCHANG' }
    ]
  },

  // 6. Health, Fear of Disease, Protection (स्वास्थ्य संकट / रोग भय / जीवन रक्षा)
  {
    id: 'HEALTH_PROTECTION',
    situation: 'स्वास्थ्य रक्षा, रोग मुक्ति व अकाल भय',
    keywords: ['health', 'sick', 'illness', 'disease', 'hospital', 'pain', 'बीमार', 'स्वास्थ्य', 'रोग', 'अस्पताल', 'दर्द', 'आयु', 'दवा'],
    sourceGrantha: 'ऋग्वेद (मण्डल ७, सूक्त ५९, मन्त्र १२) • महामृत्युंजय संहिता',
    sourceType: 'VEDA',
    verse: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।\nउर्वारुकमिव बन्धनान्मृत्य pushyam mukshiya maamritat ॥',
    transliteration: 'oṁ try-ambakaṁ yajāmahe sugandhiṁ puṣṭi-vardhanam ।\nurvārukam iva bandhanān mṛtyor mukṣīya māmṛtāt ॥',
    meaningHi: 'हम त्रिनेत्रधारी भगवान शिव की आराधना करते हैं, जो समस्त विश्व में सुगंधित व पोषाहार रूप से व्याप्त हैं। जैसे पका हुआ फल बेल से स्वतः मुक्त हो जाता है, वैसे ही हम मृत्यु व रोग के बंधनों से मुक्त होकर अमृतत्व को प्राप्त हों।',
    meaningEn: 'We worship the Three-Eyed Lord Shiva, who is fragrant and nourishes all beings. As a ripe melon falls naturally from its stalk, may we be liberated from the bondage of disease and mortality into spiritual immortality.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 शारीरिक व मानसिक कष्ट के समय भगवान महाकाल की शरण ही सर्वोच्च रक्षा कवच है। ऋग्वेद का यह महामृत्युंजय मन्त्र प्राण-ऊर्जा को जागृत करता है और आरोग्य प्रदान करता है।',
    suggestedAction: 'प्रतिदिन प्रातः या सायं रुद्राक्ष माला पर महामृत्युंजय मन्त्र का १०८ बार जप करें।',
    quickChips: [
      { label: '📿 महामृत्युंजय मन्त्र जप', action: 'INTENT_MANTRA_MRITYUNJAYA' },
      { label: '🪔 महाकालेश्वर व विश्वनाथ दर्शन', action: 'INTENT_DARSHAN_KASHI' },
      { label: '📜 स्वास्थ्य व मारक दशा विश्लेषण', action: 'INTENT_SCHOLAR' }
    ]
  },

  // 7. Spiritual Surrender & Seeking God / Peace (ईश्वर शरणागति / शान्ति की खोज)
  {
    id: 'SPIRITUAL_SURRENDER',
    situation: 'परम शान्ति, शरणागति व मोक्ष की खोज',
    keywords: ['god', 'peace', 'bhakti', 'surrender', 'moksha', 'shanti', 'ईश्वर', 'भगवान', 'शान्ति', 'भक्ति', 'शरणागति', 'मोक्ष', 'पूजा'],
    sourceGrantha: 'श्रीमद्भगवद्गीता (अध्याय १८, श्लोक ६६)',
    sourceType: 'GITA',
    verse: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज ।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः ॥',
    transliteration: 'sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja ।\nahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ ॥',
    meaningHi: 'समस्त उपाधियों और चिन्ताओं का त्याग करके केवल मेरी अनन्य शरण में आ जाओ। मैं तुम्हें समस्त बंधनों से मुक्त कर दूंगा, तुम शोक मत करो।',
    meaningEn: 'Abandon all varieties of worldly burdens and just surrender unto Me alone. I shall deliver you from all distress and bondages; do not grieve.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 काशी मोक्षदायिनी नगरी है। जब जीवात्मा संसार के कोलाहल से थककर अनन्त शान्ति चाहता है, तब देवाधिदेव महादेव और भगवान श्रीकृष्ण की अनन्य शरणागति ही सर्वोत्तम आश्रय है।',
    suggestedAction: 'दशाश्वमेध घाट की सांध्य गंगा महाआरती का दर्शन करें व नाम-जप में समय व्यतीत करें।',
    quickChips: [
      { label: '🪔 दशाश्वमेध गंगा महाआरती', action: 'INTENT_DARSHAN_GANGA' },
      { label: '📿 शिव ताण्डव स्तोत्रम्', action: 'INTENT_MANTRA_SHIVATANDAV' },
      { label: '🚩 काशी पंच-तीर्थ यात्रा', action: 'INTENT_JOURNEY_KASHI' }
    ]
  }
];

export function findScriptureInsight(query: string): ScriptureInsight | null {
  const q = query.toLowerCase();
  for (const item of SCRIPTURE_WISDOM_REGISTRY) {
    for (const kw of item.keywords) {
      if (q.includes(kw.toLowerCase())) {
        return item;
      }
    }
  }
  return null;
}
