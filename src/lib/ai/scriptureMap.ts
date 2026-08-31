/**
 * SACRED SCRIPTURE WISDOM MAP (श्रीमद्भगवद्गीता, श्रीरामचरितमानस, उपनिषद्, चाणक्य नीति एवं वैदिक संहिता)
 * Matches seeker life situations, dilemmas, and emotional states with authentic shlokas and chaupais.
 */
import { EMOTION_KEYWORD_MAP } from './emotionKeywords';

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
    transliteration: "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ ।\nāgamāpāyino 'nityās tāṁs titikṣasva bhārata ॥",
    meaningHi: 'हे कुन्तीपुत्र! सर्दी-गर्मी और सुख-दुख देने वाले इन्द्रिय और विषयों के संयोग तो उत्पत्ति और विनाशशील तथा अनित्य हैं, इसलिए हे भारत! तुम उन्हें धैर्यपूर्वक सहन करो। यह समय भी बीत जाएगा।',
    meaningEn: 'O son of Kunti, the nonpermanent appearance of happiness and distress, and their disappearance in due course, are like the appearance and disappearance of winter and summer seasons. One must learn to tolerate them without being disturbed.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 आपके मन की व्यथा और उदासी को मैं समझ सकती हूँ। जब मन भारी हो, तो भगवान श्रीकृष्ण का यह अमर वचन स्मरण करें। ज्योतिष में मन का स्वामी चन्द्रमा है — जिस प्रकार चन्द्रमा की कलाएं घटती-बढ़ती हैं, उसी प्रकार जीवन के सुख-दुख भी अनित्य हैं।',
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
    transliteration: "karmaṇy-evādhikāras te mā phaleṣu kadācana ।\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi ॥",
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
  },

  // 8. Financial Stress, Debt & Wealth Insecurity (आर्थिक तंगी / कर्ज / धन हानि)
  {
    id: 'FINANCIAL_STRESS',
    situation: 'आर्थिक तंगी, कर्ज व धन की चिन्ता',
    keywords: ['money', 'debt', 'poverty', 'loan', 'finance', 'loss', 'wealth', 'पैसा', 'धन', 'कर्ज', 'तंगी', 'घाटा', 'नुकसान', 'कंगाली', 'उधार'],
    sourceGrantha: 'श्रीमद्भगवद्गीता (अध्याय ९, श्लोक २२)',
    sourceType: 'GITA',
    verse: 'अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते ।\nतेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम् ॥',
    transliteration: 'ananyāś cintayanto māṁ ye janāḥ paryupāsate ।\nteṣāṁ nityābhiyuktānāṁ yoga-kṣemaṁ vahāmy aham ॥',
    meaningHi: 'जो अनन्य भक्तजन मेरा चिन्तन करते हुए मेरी उपासना करते हैं, उन नित्य युक्त पुरुषों के योग (अप्राप्त की प्राप्ति) और क्षेम (प्राप्त की रक्षा) का वहन मैं स्वयं करता हूँ।',
    meaningEn: 'To those who are constantly devoted to Me and worship Me with love, I provide what they lack and preserve what they already possess.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 आर्थिक उतार-चढ़ाव जीवन में परीक्षा की घड़ी लाते हैं। ज्योतिष में धन भाव (द्वितीय व एकादश भाव) और गुरु-शुक्र का संतुलन महत्वपूर्ण है। पुरुषार्थ के साथ ईश्वर पर निष्ठा रखने से मार्ग स्वतः खुलते हैं।',
    suggestedAction: 'माँ लक्ष्मी व अन्नपूर्णा का ध्यान करें तथा कनकधारा स्तोत्र अथवा श्री सूक्त का पाठ करें।',
    quickChips: [
      { label: '📜 धन व कर्म भाव कुण्डली विश्लेषण', action: 'INTENT_SCHOLAR' },
      { label: '🪔 माँ अन्नपूर्णा (काशी) दर्शन', action: 'INTENT_DARSHAN_KASHI' },
      { label: '🕉️ आज का शुभ चौघड़िया', action: 'INTENT_PANCHANG' }
    ]
  },

  // 9. Anger, Loss of Temper & Restlessness (क्रोध / गुस्सा / अशांति)
  {
    id: 'ANGER_MANAGEMENT',
    situation: 'क्रोध, उग्रता व विवेक का लोप',
    keywords: ['angry', 'anger', 'rage', 'furious', 'temper', 'frustrated', 'गुस्सा', 'क्रोध', 'चिड़चिड़ापन', 'आक्रोश', 'झुंझलाहट'],
    sourceGrantha: 'श्रीमद्भगवद्गीता (अध्याय २, श्लोक ६३)',
    sourceType: 'GITA',
    verse: 'क्रोधाद्भवति संमोहः संमोहात्स्मृतिविभ्रमः ।\nस्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति ॥',
    transliteration: 'krodhād bhavati saṁmohaḥ saṁmohāt smṛti-vibhramaḥ ।\nsmṛti-bhraṁśād buddhi-nāśo buddhi-nāśāt praṇaśyati ॥',
    meaningHi: 'क्रोध से मूढ़ता (अविवेक) उत्पन्न होती है, मूढ़ता से स्मरण शक्ति भ्रमित हो जाती है, स्मृति-भ्रम से बुद्धि (निर्णय शक्ति) का नाश हो जाता है और बुद्धि का नाश होने से मनुष्य का पतन हो जाता है।',
    meaningEn: 'From anger arises delusion; from delusion comes confusion of memory; from confusion of memory intellect is lost; and through loss of intellect, a person is ruined.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 क्रोध में लिया गया कोई भी निर्णय कल्याणकारी नहीं होता। ज्योतिष में मंगल और राहु का उग्र प्रभाव क्रोध को बढ़ाता है। भगवान शिव (शीतल चन्द्रमा धारण करने वाले) का ध्यान मन को शांत करता है।',
    suggestedAction: 'शीतल जल से आचमन करें और ॐ नमः शिवाय का ११ बार शांत उच्चारण करें।',
    quickChips: [
      { label: '📿 ॐ नमः शिवाय जप', action: 'INTENT_MANTRA_MRITYUNJAYA' },
      { label: '🪔 सोमनाथ ज्योतिर्लिंग दर्शन', action: 'INTENT_DARSHAN_SOMNATH' },
      { label: '📜 चन्द्र-मंगल शान्ति परामर्श', action: 'INTENT_SCHOLAR' }
    ]
  },

  // 10. Domestic Discord & Family Unity (पारिवारिक कलह / गृह क्लेश)
  {
    id: 'FAMILY_DISCORD',
    situation: 'पारिवारिक कलह, मतभेद व गृह क्लेश',
    keywords: ['family fight', 'parents', 'house dispute', 'relative', 'property fight', 'परिवार', 'गृह क्लेश', 'घर का झगड़ा', 'माता पिता', 'सास बहू', 'भाई भाई'],
    sourceGrantha: 'अथर्ववेद (काण्ड ३, सूक्त ३०, मन्त्र १) • संमनस्य सूक्तम्',
    sourceType: 'VEDA',
    verse: 'सहृदयं सांमनस्यमविद्वेषं कृणोमि वः ।\nअन्यो अन्यमभि हर्यत वत्सं जातमिवाघ्न्या ॥',
    transliteration: 'sahṛdayaṁ sāṁmanasyam avidveṣaṁ kṛṇomi vaḥ ।\nanyo anyam abhi haryata vatsaṁ jātam ivāghnyā ॥',
    meaningHi: 'मैं तुम्हारे मनों को एक समान हृदय वाला, समान विचार वाला और द्वेषरहित बनाता हूँ। तुम सब आपस में एक-दूसरे से वैसा ही निश्छल प्रेम करो, जैसा गाय अपने नवजात बछड़े से करती है।',
    meaningEn: 'I unite your hearts, your minds, and free you from malice. Love one another unconditionally, just as a cow cherishes her newborn calf.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 परिवार सुख और शान्ति का आधार है। जब घर में कलह हो, तो ज्योतिष में चतुर्थ भाव (गृह सुख) और शुक्र-गुरु की स्थिति को देखना चाहिए। अथर्ववेद का संमनस्य सूक्त घर में प्रेम और सौहार्द की पुनर्स्थापना करता है।',
    suggestedAction: 'घर में सांध्य काल में कपूर व गूगल की धूप दें और परिवार के साथ श्री राम स्तुति का पाठ करें।',
    quickChips: [
      { label: '👥 परिवार पञ्चाङ्ग व गोचर देखें', action: 'NAV_FAMILY', href: '/family-panchang' },
      { label: '📜 गृह-दोष व वास्तु परामर्श', action: 'INTENT_SCHOLAR' },
      { label: '🪔 दशाश्वमेध गंगा आरती दर्शन', action: 'INTENT_DARSHAN_GANGA' }
    ]
  },

  // 11. Self-Doubt, Confusion of Right & Wrong / Dharma Crisis (धर्मसंकट / सही गलत का संशय)
  {
    id: 'DHARMA_CRISIS',
    situation: 'धर्मसंकट, संशय व आत्म-उद्धार',
    keywords: ['confused', 'right or wrong', 'dilemma', 'decision', 'doubt', 'धर्मसंकट', 'संशय', 'क्या सही है', 'निर्णय', 'उलझन', 'भ्रम'],
    sourceGrantha: 'श्रीमद्भगवद्गीता (अध्याय ६, श्लोक ५)',
    sourceType: 'GITA',
    verse: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥',
    transliteration: 'uddhared ātmanātmānaṁ nātmānam avasādayet ।\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ ॥',
    meaningHi: 'मनुष्य को चाहिए कि वह अपने मन के द्वारा अपना उद्धार करे, अपने आपको पतन की ओर न ले जाए; क्योंकि यह मन ही मनुष्य का मित्र है और यही मन उसका सबसे बड़ा शत्रु भी है।',
    meaningEn: 'One must elevate oneself by one’s own mind, not degrade oneself. The mind is the friend of the conditioned soul, and its enemy as well.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 जीवन में कई बार ऐसा मोड़ आता है जब उचित और अनुचित का निर्णय कठिन हो जाता है। ऐसे में अपनी आत्मा की शुद्ध आवाज़ को सुनें। जब मन शुद्ध होता है, तो निर्णय स्वतः स्पष्ट हो जाता है।',
    suggestedAction: 'गायत्री मन्त्र का जप करते हुए सूर्य नारायण को अर्घ्य दें, इससे मेधा शक्ति व निर्णय क्षमता तीव्र होती है।',
    quickChips: [
      { label: '📿 गायत्री मन्त्र साधना', action: 'INTENT_MANTRA_GAYATRI' },
      { label: '📜 विद्वान् ज्योतिषी धर्म-विवेचना', action: 'INTENT_SCHOLAR' },
      { label: '🕉️ आज का अभिजीत मुहूर्त', action: 'INTENT_PANCHANG' }
    ]
  },

  // 12. Facing Enemies, Jealousy, Slander & Evil Eye (शत्रु बाधा / ईर्ष्या / निंदा / नज़र दोष)
  {
    id: 'ENEMY_JEALOUSY',
    situation: 'शत्रु बाधा, ईर्ष्या, निंदा व नज़र दोष',
    keywords: ['enemy', 'jealous', 'evil eye', 'gossip', 'slander', 'hatred', 'शत्रु', 'ईर्ष्या', 'जलन', 'नज़र', 'निंदा', 'षड्यंत्र', 'विरोधी'],
    sourceGrantha: 'श्रीरामचरितमानस (उत्तरकाण्ड) / भैरव स्तोत्रम्',
    sourceType: 'RAMCHARITMANAS',
    verse: 'संत सहहिं दुख परहित लागी ।\nपरदुख हेतु असंत अभागी ॥\nराम कृपा नासहिं सब रोगा ।\nजो एहि भाँति बनै संजोगो ॥',
    transliteration: 'santa sahahiṁ dukha parahita lāgī ।\nparadukha hetu asanta abhāgī ॥',
    meaningHi: 'सज्जन पुरुष दूसरों के कल्याण हेतु कष्ट सहते हैं, जबकि अभागे दुर्जन दूसरों को दुख देने में ही लगे रहते हैं। प्रभु की कृपा से सभी प्रकार की बाधाएं और ईर्ष्या स्वतः भस्म हो जाती हैं।',
    meaningEn: 'Noble souls bear hardships for the welfare of others, whereas the wicked create troubles out of malice. By divine grace, all hostility and negativity dissolve completely.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 संसार में उन्नति करने वाले के प्रति ईर्ष्या होना स्वाभाविक है। काशी के कोतवाल श्री काल भैरव जी की छत्रछाया में किसी भी प्रकार की शत्रु बाधा या नकारात्मक दृष्टि नहीं टिक सकती।',
    suggestedAction: 'श्री काल भैरव अष्टकम् का श्रवण करें तथा मंगलवार या शनिवार को सरसों के तेल का दीप प्रज्वलित करें।',
    quickChips: [
      { label: '🪔 श्री काल भैरव (काशी) दर्शन', action: 'INTENT_DARSHAN_KASHI' },
      { label: '📿 शिव ताण्डव स्तोत्रम्', action: 'INTENT_MANTRA_SHIVATANDAV' },
      { label: '📜 षष्ठ भाव व शत्रु शान्ति परामर्श', action: 'INTENT_SCHOLAR' }
    ]
  },

  // 13. Loneliness & Feeling Abandoned / Isolated (अकेलापन / कोई अपना नहीं)
  {
    id: 'LONELINESS_ISOLATION',
    situation: 'अकेलापन, अलगाव व आत्मीयता का अभाव',
    keywords: ['alone', 'lonely', 'nobody cares', 'isolated', 'abandoned', 'अकेला', 'कोई नहीं है', 'अकेलापन', 'उदासी', 'तनहाई'],
    sourceGrantha: 'श्रीमद्भगवद्गीता (अध्याय ९, श्लोक १८)',
    sourceType: 'GITA',
    verse: 'गतिर्भर्ता प्रभुः साक्षी निवासः शरणं सुहृत् ।\nप्रभवः प्रलयः स्थानं निधानं बीजमव्ययम् ॥',
    transliteration: 'gatir bhartā prabhuḥ sākṣī nivāsaḥ śaraṇaṁ suhṛt ।\nprabhavaḥ pralayaḥ sthānaṁ nidhānaṁ bījam avyayam ॥',
    meaningHi: 'मैं ही परम गति, भरण-पोषण करने वाला, स्वामी, साक्षी, सबका धाम, शरण लेने योग्य और सबका परम हितैषी मित्र (सुहृत्) हूँ। मैं ही सृष्टि का उद्भव, प्रलय, आधार और अविनाशी बीज हूँ।',
    meaningEn: 'I am the goal, the upholder, the master, the witness, the abode, the refuge, and the dearest friend. I am the origin, the dissolution, the ground, the resting place, and the imperishable seed.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 आप कभी अकेले नहीं हैं। जब सांसारिक सम्बन्ध दूर प्रतीत होते हैं, तब साक्षात् परमात्मा आपके परम सुहृद् (सच्चे मित्र) बनकर आपके हृदय में विराजमान रहते हैं।',
    suggestedAction: 'काशी के मणिकर्णिका व दशाश्वमेध घाट का स्मरण करें और पवित्र ॐ नमः शिवाय का ध्यान करें।',
    quickChips: [
      { label: '🪔 दशाश्वमेध गंगा आरती दर्शन', action: 'INTENT_DARSHAN_GANGA' },
      { label: '📿 महामृत्युंजय मन्त्र जप', action: 'INTENT_MANTRA_MRITYUNJAYA' },
      { label: '🚩 काशी यात्रा परिपथ', action: 'INTENT_JOURNEY_KASHI' }
    ]
  },

  // 14. Procrastination, Laziness & Inertia (आलस्य / प्रमाद / काम टालना)
  {
    id: 'PROCRASTINATION_LAZINESS',
    situation: 'आलस्य, प्रमाद व कार्य में शिथिलता',
    keywords: ['lazy', 'laziness', 'procrastination', 'waste time', 'bored', 'आलस', 'आलस्य', 'काम टालना', 'मन नहीं लगता', 'सुस्ती'],
    sourceGrantha: 'चाणक्य नीति (अध्याय २) / भर्तृहरि नीतिशतकम्',
    sourceType: 'CHANAKYA_NITI',
    verse: 'आलस्यं हि मनुष्याणां शरीरस्थो महान् रिपुः ।\nनास्त्युद्यमसमो बन्धुः कृत्वा यं नावसीदति ॥',
    transliteration: 'ālasyaṁ hi manuṣyāṇāṁ śarīra-stho mahān ripuḥ ।\nnāsty udyama-samo bandhuḥ kṛtvā yaṁ nāvasīdati ॥',
    meaningHi: 'मनुष्यों के शरीर में रहने वाला आलस्य ही उसका सबसे बड़ा शत्रु है। परिश्रम (उद्यम) के समान कोई मित्र नहीं है, जिसे करने वाला कभी दुखी नहीं होता।',
    meaningEn: 'Laziness is indeed the greatest enemy dwelling within the human body. There is no friend like purposeful hard work, by engaging in which one never meets sorrow.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 काल चक्र निरंतर गतिमान है। ज्योतिष में शनि और सूर्य का संतुलन पुरुषार्थ को जगाता है। समय का सदुपयोग ही भाग्य को चमकाने की एकमात्र कुंजी है।',
    suggestedAction: 'प्रातः सूर्योदय के समय सूर्य नमस्कार करें और आज का शुभ चौघड़िया देखकर तुरंत कार्य में जुट जाएं।',
    quickChips: [
      { label: '🕉️ आज का शुभ चौघड़िया', action: 'INTENT_PANCHANG' },
      { label: '📅 शुभ कार्य मुहूर्त', action: 'INTENT_MUHURTA' },
      { label: '📜 दशम भाव (कर्म) कुण्डली परामर्श', action: 'INTENT_SCHOLAR' }
    ]
  },

  // 15. Addiction, Sensory Traps & Loss of Control (बुरी आदतें / व्यसन / इन्द्रिय लोभ)
  {
    id: 'ADDICTION_CONTROL',
    situation: 'व्यसन, बुरी आदतें व इन्द्रिय संयम का अभाव',
    keywords: ['addiction', 'bad habit', 'lust', 'overeating', 'cannot control', 'व्यसन', 'बुरी आदत', 'नशा', 'लत', 'संयम', 'इन्द्रिय'],
    sourceGrantha: 'कठोपनिषद् (अध्याय १, वल्ली ३, मन्त्र ३-४) • रथ रूपक',
    sourceType: 'UPANISHAD',
    verse: 'आत्मानं रथिनं विद्धि शरीरं रथमेव तु ।\nबुद्धिं तु सारथिं विद्धि मनः प्रग्रहमेव च ॥\nइन्द्रियाणि हयानाहुर्विषयांस्तेषु गोचरान् ।',
    transliteration: 'ātmānaṁ rathinaṁ viddhi śarīraṁ ratham eva tu ।\nbuddhiṁ tu sārathiṁ viddhi manaḥ pragraham eva ca ॥',
    meaningHi: 'इस शरीर को रथ जानो और जीवात्मा को रथी (मालिक)। बुद्धि को सारथी और मन को लगाम समझो। इन्द्रियों को घोड़े कहा गया है और सांसारिक विषय उनके दौड़ने के मार्ग हैं। सारथी (बुद्धि) द्वारा लगाम (मन) को कसकर रखें।',
    meaningEn: 'Know the Self as the lord of the chariot, the body as the chariot, the intellect as the charioteer, and the mind as the reins. The senses are the horses. When the intellect controls the reins of the mind, the journey is triumphant.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 इन्द्रियों का स्वभाव चंचल है। जब बुद्धि रूपी सारथी सजग हो जाता है, तो कोई भी व्यसन या बुरी आदत टिक नहीं सकती। आप अपने मन के स्वामी हैं, उसके दास नहीं।',
    suggestedAction: 'प्रतिदिन प्राणायाम करें और भगवान शिव के पंचाक्षर मन्त्र का जप करते हुए संकल्प धारण करें।',
    quickChips: [
      { label: '📿 महामृत्युंजय मन्त्र जप', action: 'INTENT_MANTRA_MRITYUNJAYA' },
      { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN_KASHI' },
      { label: '📜 राहु-केतु शान्ति व मानसिक बल परामर्श', action: 'INTENT_SCHOLAR' }
    ]
  },

  // 16. Parenting, Children’s Future & Education (संतान चिन्ता / बच्चों की शिक्षा व संस्कार)
  {
    id: 'PARENTING_CHILDREN',
    situation: 'संतान चिन्ता, बच्चों की शिक्षा व संस्कार',
    keywords: ['child', 'children', 'son', 'daughter', 'parenting', 'kids future', 'संतान', 'बच्चे', 'बेटा', 'बेटी', 'बच्चों की पढ़ाई', 'संस्कार'],
    sourceGrantha: 'तैत्तिरीयोपनिषद् (शिक्षावल्ली) / श्रीरामचरितमानस',
    sourceType: 'UPANISHAD',
    verse: 'मातृदेवो भव । पितृदेवो भव । आचार्यदेवो भव ।\nभए कुमार जबहिं सब भ्राता । दीन्ह जनेऊ गुरु पितु माता ॥',
    transliteration: 'mātṛ-devo bhava । pitṛ-devo bhava । ācārya-devo bhava ॥',
    meaningHi: 'माता, पिता और गुरु को देवतुल्य आदर दें। जब संतान को सुसंस्कार, सद्गुरु का सान्निध्य और अनुशासन प्राप्त होता है, तो वह कुल का नाम उज्ज्वल करती है।',
    meaningEn: 'Honor your mother as divine, honor your father as divine, and honor your preceptor as divine. Noble values and dedicated mentorship form the golden foundation of a child’s glorious future.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 संतान का भविष्य माता-पिता का सबसे बड़ा संकल्प होता है। ज्योतिष में पंचम भाव (संतान व विद्या भाव) और गुरु (बृहस्पति) का शुभ प्रभाव ज्ञान व सद्बुद्धि प्रदान करता है।',
    suggestedAction: 'बच्चों से प्रतिदिन सरस्वती वंदना अथवा गायत्री मन्त्र का उच्चारण कराएं और पंचम भाव का विश्लेषण कराएं।',
    quickChips: [
      { label: '📜 संतान व विद्या भाव कुण्डली विश्लेषण', action: 'INTENT_SCHOLAR' },
      { label: '📿 गायत्री मन्त्र साधना', action: 'INTENT_MANTRA_GAYATRI' },
      { label: '🕉️ आज का पञ्चाङ्ग व विद्या मुहूर्त', action: 'INTENT_PANCHANG' }
    ]
  },

  // 17. Success, Gratitude & Avoiding Arrogance (सफलता / कृतज्ञता / अहंकार निवारण)
  {
    id: 'SUCCESS_GRATITUDE',
    situation: 'सफलता, कृतज्ञता व अहंकार का शमन',
    keywords: ['success', 'won', 'grateful', 'thank you', 'proud', 'achieved', 'सफलता मिली', 'जीत', 'धन्यवाद', 'कृतज्ञता', 'आभार', 'सफल'],
    sourceGrantha: 'ईशावास्योपनिषद् (मन्त्र १)',
    sourceType: 'UPANISHAD',
    verse: 'ईशा वास्यमिदं सर्वं यत्किञ्च जगत्यां जगत् ।\nतेन त्यक्तेन भुञ्जीथा मा गृधः कस्यस्विद्धनम् ॥',
    transliteration: 'īśā vāsyam idaṁ sarvaṁ yat kiñca jagatyāṁ jagat ।\ntena tyaktena bhuñjīthā mā gṛdhaḥ kasya svid dhanam ॥',
    meaningHi: 'इस सम्पूर्ण चराचर ब्रह्माण्ड में जो कुछ भी है, वह सब ईश्वर से ही व्याप्त है। अतः त्याग भाव से उसका उपभोग करो, किसी अन्य के धन या यश का लोभ मत करो।',
    meaningEn: 'Everything animate or inanimate that is within the universe is controlled and owned by the Supreme Lord. One should therefore accept only those things necessary, set apart as one’s quota, and not covet anything else.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 आपकी सफलता पर हार्दिक बधाई! वैदिक परम्परा सिखाती है कि विजय की वेला में विनम्रता और ईश्वर के प्रति कृतज्ञता ही उस सफलता को अक्षुण्ण और स्थायी बनाती है।',
    suggestedAction: 'भगवान विश्वनाथ के चरणों में दीप दान करें तथा किसी निर्धन को अन्न अथवा वस्त्र का दान करें।',
    quickChips: [
      { label: '🪔 काशी विश्वनाथ दीप दान', action: 'INTENT_DARSHAN_KASHI' },
      { label: '📿 शिव ताण्डव स्तोत्रम्', action: 'INTENT_MANTRA_SHIVATANDAV' },
      { label: '📜 आगामी जीवन दशा व वार्षिक विवेचना', action: 'INTENT_SCHOLAR' }
    ]
  },

  // 18. Overwhelm, Exhaustion & Mental Burden (अति भार / थकान / मानसिक दबाव)
  {
    id: 'OVERWHELM_STRESS',
    situation: 'मानसिक भार, थकान व अत्यधिक दबाव',
    keywords: ['overwhelmed', 'overload', 'burnout', 'exhausted', 'pressure', 'burden', 'too much', 'थकान', 'बोझ', 'दबाव', 'अति', 'थका'],
    sourceGrantha: 'श्रीमद्भगवद्गीता (अध्याय ६, श्लोक ३५)',
    sourceType: 'GITA',
    verse: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम् ।\nअभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते ॥',
    transliteration: 'asaṁśayaṁ mahā-bāho mano durnigrahaṁ calam ।\nabhyāsena tu kaunteya vairāgyeṇa ca gṛhyate ॥',
    meaningHi: 'हे महाबाहो! निस्संदेह मन चंचल है और उसे वश में करना अत्यंत कठिन है; परन्तु हे कुन्तीपुत्र! निरंतर अभ्यास (साधना) और अनासक्ति (वैराग्य) द्वारा उसे वश में किया जा सकता है।',
    meaningEn: 'O mighty-armed one, the mind is indeed restless and very difficult to subdue, but by constant practice and detachment it can be brought under control.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 जब सब कुछ एक साथ बहुत अधिक लगने लगे — कार्य, जिम्मेदारियां, अपेक्षाएं — तो समझिए कि मन गति तो बहुत करता है, पर उसे लगाम की आवश्यकता है। गीता का यह वचन बताता है कि चंचल मन भी नियमित अभ्यास और आसक्ति-मुक्त दृष्टि से शांत और स्थिर हो जाता है। एक समय में एक ही कार्य करें, शेष को भगवान विश्वनाथ को समर्पित कर दें।',
    suggestedAction: 'प्रतिदिन प्रातः पाँच मिनट श्वास-ध्यान करें तथा कार्य-सूची को छोटे-छोटे भागों में बाँटकर प्रारम्भ करें।',
    quickChips: [
      { label: '🕉️ आज का पञ्चाङ्ग व राहुकाल', action: 'INTENT_PANCHANG' },
      { label: '🪔 दशाश्वमेध गंगा आरती दर्शन', action: 'INTENT_DARSHAN_GANGA' },
      { label: '📜 मानसिक शान्ति हेतु विद्वान् परामर्श', action: 'INTENT_SCHOLAR' }
    ]
  },

  // 19. Guilt, Regret & Self-Blame (पछतावा / अपराधबोध / ग्लानि)
  {
    id: 'GUILT_REGRET',
    situation: 'पछतावा, अपराधबोध व आत्म-ग्लानि',
    keywords: ['guilt', 'guilty', 'regret', 'ashamed', 'shame', 'sin', 'mistake', 'forgive', 'ग्लानि', 'पछतावा', 'अपराधबोध', 'कसूर', 'शर्म', 'पाप'],
    sourceGrantha: 'श्रीमद्भगवद्गीता (अध्याय ४, श्लोक ३६)',
    sourceType: 'GITA',
    verse: 'अपि चेदसि पापेभ्यः सर्वेभ्यः पापकृत्तमः ।\nसर्वं ज्ञानप्लवेनैव वृजिनं सन्तरिष्यसि ॥',
    transliteration: 'api ced asi pāpebhyaḥ sarvebhyaḥ pāpa-kṛt-tamaḥ ।\nsarvaṁ jñāna-plavenaiva vṛjinaṁ santariṣyasi ॥',
    meaningHi: 'यदि तुम समस्त पापियों में भी सबसे अधिक पापी हो, तो भी ज्ञानरूपी नौका के द्वारा तुम समस्त पाप-सागर को सहज ही पार कर जाओगे।',
    meaningEn: 'Even if you are considered the most sinful of all sinners, you shall still cross all sin by the boat of divine knowledge.',
    kashiSahayakBridge: 'हर हर महादेव! 🙏 पछतावा हृदय को भारी कर देता है, परन्तु वैदिक दृष्टि में अतीत को नष्ट करने की शक्ति ज्ञान और प्रायश्चित्त में है। जिस प्रकार गंगा स्नान पाप-ताप हर लेता है, उसी प्रकार सच्चा संकल्प और विवेक-ज्ञान आत्म-ग्लानि को शुद्ध कर देता है। आप अपनी गलती से बड़े नहीं हैं — उठिए, सीखिए, और संकल्प कीजिए।',
    suggestedAction: 'माँ गंगा अथवा किसी पवित्र जल से स्नान-संकल्प करें, प्रभु से क्षमा-प्रार्थना करें और भविष्य हेतु एक स्पष्ट संकल्प लिखकर धारण करें।',
    quickChips: [
      { label: '🪔 दशाश्वमेध गंगा आरती दर्शन', action: 'INTENT_DARSHAN_GANGA' },
      { label: '📿 महामृत्युंजय मन्त्र जप', action: 'INTENT_MANTRA_MRITYUNJAYA' },
      { label: '📜 विद्वान् ज्योतिषी मार्गदर्शन', action: 'INTENT_SCHOLAR', href: '/ask' }
    ]
  }
];

/**
 * Lightweight multilingual normalizer used by the emotion engine.
 * Lowercases, strips diacritics, maps punctuation to spaces and collapses
 * whitespace so that romanized/Hinglish and Devanagari queries are compared
 * on a clean token stream (e.g. "mujhe dar lag raha hai?" → "mujhe dar lag raha hai").
 */
export function normalizeSeekerQuery(query: string): string {
  return (query || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?;:'"()\[\]{}<>|~`^_+=*@#$%&/\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findScriptureInsight(query: string): ScriptureInsight | null {
  const q = normalizeSeekerQuery(query);
  const tokens = q.split(' ').filter(Boolean);

  // ------------------------------------------------------------------
  // Pass 1 — substring keywords: the classic registry keywords (English +
  // Devanagari) plus supplementary multilingual *phrases* (Hinglish /
  // romanized sentence patterns like "dar lag raha"). Phrase matching is
  // order-safe: a phrase can never false-positive inside an unrelated word.
  // ------------------------------------------------------------------
  for (const item of SCRIPTURE_WISDOM_REGISTRY) {
    for (const kw of item.keywords) {
      if (q.includes(kw.toLowerCase())) {
        return item;
      }
    }
    const supp = EMOTION_KEYWORD_MAP[item.id];
    if (supp) {
      for (const phrase of supp.phrases) {
        if (q.includes(phrase)) {
          return item;
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // Pass 2 — exact word-boundary tokens. Safe for short romanized words
  // such as "dar", "gum", "dil" that would otherwise false-positive inside
  // "darshan", "gumsum", "dilip", etc.
  // ------------------------------------------------------------------
  for (const item of SCRIPTURE_WISDOM_REGISTRY) {
    const supp = EMOTION_KEYWORD_MAP[item.id];
    if (!supp || supp.tokens.length === 0) continue;
    for (const t of tokens) {
      if (supp.tokens.includes(t)) {
        return item;
      }
    }
  }

  return null;
}
