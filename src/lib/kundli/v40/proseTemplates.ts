import type { LabelMode } from './labels';

export const TEMPLATES_HI: Record<string, string> = {
  // structuralHighlights
  'HL_STELLIUM': '{{grahas}} एक साथ {{house}} भाव में (एक भाव में {{count}} ग्रह)।',
  'HL_DIGNITY': '{{graha}} {{sign}} में — {{dignity}} — {{house}} भाव में {{degree}} पर।',
  'HL_LAGNESHA': 'लग्नेश {{lagnesha}} {{sign}} में {{house}} भाव में {{degree}} पर स्थित है।',
  'HL_YOGAKARAKA': '{{graha}} इस लग्न के लिए योगकारक है ({{ruled}} भाव का स्वामी) और {{house}} भाव में स्थित है।',
  'HL_MOON': 'चन्द्रमा {{sign}} में {{house}} भाव में, नक्षत्र {{nakshatra}} पद {{pada}} में।',
  'HL_ANGULAR': '{{graha}} {{house}} भाव में ({{sign}}) {{degree}} पर।',
  'HL_RETROGRADE': 'जन्म के समय वक्री: {{list}}।',
  'HL_COMBUST': 'अस्त: {{list}}।',
  'HL_VARGOTTAMA': 'वर्गोत्तम (D1 और D9 में समान राशि): {{list}}।',
  'HL_NODE_AXIS': 'राहु-केतु अक्ष {{rahuHouse}} और {{ketuHouse}} भावों में ({{rahuSign}} / {{ketuSign}})।',

  // careerSynthesis
  'CAREER_TENTH_SIGN': 'दशम भाव (कर्म भाव) में {{sign}} राशि है।',
  'CAREER_TENTH_LORD': 'इस लग्न के लिए {{lord}} दशम भाव का स्वामी है।',
  'CAREER_TENTH_LORD_PLACEMENT': 'दशमेश {{graha}} {{sign}} में {{house}} भाव में स्थित है{{comment}}।',
  'CAREER_TENTH_EMPTY': 'दशम भाव में कोई ग्रह नहीं है। परम्परा कर्म भाव को मुख्यतः उसके स्वामी और उस पर पड़ने वाली दृष्टि से पढ़ती है; रिक्त भाव निर्बल भाव नहीं होता।',
  'CAREER_TENTH_OCCUPANT': '{{graha}} {{sign}} में दशम भाव में स्थित है ({{dignity}})।',
  'CAREER_LAGNESHA_EXCHANGE': 'लग्नेश {{lagnesha}} दशम में है और दशमेश {{tenthLord}} लग्न में — प्रथम और दशम भाव का स्थान परिवर्तन।',
  'CAREER_LAGNESHA_CONJUNCT_TENTH_LORD': 'लग्नेश {{lagnesha}} और दशमेश {{tenthLord}} एक ही भाव ({{house}}) में स्थित हैं, जो स्वयं और कर्म भाव को जोड़ते हैं।',
  'CAREER_LAGNESHA_IN_TENTH': 'लग्नेश {{lagnesha}} दशम भाव में स्थित है, जो स्वयं को सीधे कर्म भाव में स्थापित करता है।',
  'CAREER_LAGNESHA_RELATION': 'लग्नेश {{lagnesha}} ({{lagnaHouse}} भाव) और दशमेश {{tenthLord}} ({{tenthHouse}} भाव) प्रत्यक्ष रूप से युति या स्थान परिवर्तन से नहीं जुड़े हैं।',
  'CAREER_ARTHA_TRIKONA': 'अर्थ त्रिकोण 2 / 6 / 10 / 11 के स्वामी {{lords}} हैं; {{occupancy}}',
  'CAREER_FUNCTIONAL': '{{graha}} — {{functionalStatement}}। नैसर्गिक स्वभाव: {{natural}}।',
  'CAREER_DIGNITY': '{{graha}} {{dignity}} ({{sign}}) है।',
  'CAREER_COMBUST': '{{graha}} अस्त है — सूर्य से {{distance}}, दीप्तांश (orb) {{orb}}।',
  'CAREER_NEAR_COMBUST': '{{graha}} सूर्य के समीप है ({{distance}}, दीप्तांश {{orb}}) परन्तु अस्त होने की सीमा से बाहर है।',
  'CAREER_RETROGRADE': '{{graha}} जन्म के समय वक्री है। परम्परा में वक्री ग्रह के बल या निर्बलता पर मतभेद है, अतः इसे मिश्रित कारक के रूप में दर्ज किया गया है।',
  'CAREER_TENTH_NO_DRISHTI': 'अपनाई गई दृष्टि-पद्धति के अन्तर्गत दशम भाव पर कोई पूर्ण पराशरी दृष्टि नहीं पड़ती।',
  'CAREER_DRISHTI': '{{graha}} अपनी {{offset}} पूर्ण दृष्टि दशम भाव पर डालता है।',
  'CAREER_YOGA_PRESENT': '{{name}} उपस्थित है — लागू नियम की हर शर्त पूरी हुई है।',
  'CAREER_YOGAS_ABSENT': '{{count}} कर्म-सम्बन्धी योग नियमों की परीक्षा की गई जो इस कुण्डली पर लागू नहीं हुए, अतः वे किसी दिशा में कोई योगदान नहीं देते: {{list}}।',
  'CAREER_YOGAS_UNRESOLVED': '{{count}} कर्म-सम्बन्धी योग नियम इस गणक द्वारा हल नहीं किए जा सके, अतः उन्हें किसी भी दिशा में प्रमाण स्वरूप उपयोग नहीं किया गया है: {{list}}।',
  'CAREER_D10_NOT_USED': 'D10 (दशांश) का उपयोग इस पाठ्य को पुष्ट या खण्डित करने के लिए नहीं किया गया है।',
  'CAREER_D9_TENTH_LORD': 'D9 में दशमेश {{graha}} {{sign}} में स्थित है{{comment}}। D9 को अन्तश्चार्ट सन्दर्भ के रूप में दिया गया है; यह कर्म का वर्ग नहीं है।',
  'CAREER_ACTIVATION_TOUCH': '{{level}} स्वामी {{lord}} अर्थ भाव(ओं) {{houses}} को स्थिति, स्वामित्व या पूर्ण दृष्टि द्वारा स्पर्श करता है।',
  'CAREER_ACTIVATION_KEY': '{{level}} स्वामी {{lord}} स्वयं इस कुण्डली का एक कर्म-ग्रह है, यद्यपि वह किसी अर्थ भाव को सीधे स्पर्श नहीं करता।',
  'CAREER_ACTIVATION_NONE': '{{level}} स्वामी {{lord}} किसी भी अर्थ भाव (2/6/10/11) को स्थिति, स्वामित्व या पूर्ण दृष्टि से स्पर्श नहीं करता।',
  'CAREER_TRANSIT': 'गोचर (transit) इस रिपोर्ट का भाग नहीं है।',
  'CAREER_CONCLUSION_1': 'कर्म को यहाँ {{sign}} में दशम भाव, उसके स्वामी {{lord}}, और उसे स्पर्श या देखने वाले ग्रहों से पढ़ा गया है।',
  'CAREER_CONCLUSION_2': '{{support}} कारक कर्म भाव का समर्थन करते हैं और {{challenge}} इसके विरुद्ध कार्य करते हैं; दोनों सूचियाँ ऊपर पूर्ण रूप से दी गई हैं ताकि सन्तुलन की जाँच की जा सके।',
  'CAREER_CONCLUSION_3': 'चल रही {{mahadasha}} महादशा / {{antardasha}} अन्तर्दशा के अन्तर्गत, कर्म फल का सक्रियण दशा खण्ड में सूचीबद्ध स्तर तक है — दशा समय बताती है, फल नहीं।',

  // consultationQuestions
  'CQ_CONCENTRATION': '{{grahas}} का {{house}} भाव में संकेन्द्रण है। ग्रहों के बल और D10 पर विचार करने के बाद इस संकेन्द्रण का क्या फल कहना चाहिए?',
  'CQ_YOGA': '{{name}} नियम से उपस्थित है। ग्रह की अपनी स्थिति तौलने के बाद यह यहाँ कितनी प्रबलता से कार्य करता है?',
  'CQ_MANGLIK': 'मंगल के {{house}} भाव में होने से विवाह के फल पर क्या प्रभाव पड़ेगा, और क्या परिवार की परम्परा इसे रद्द (cancellation) मानती है?',
  'CQ_CURRENT_PERIOD': 'चल रही {{mahadasha}} / {{antardasha}} दशा में वास्तव में कौन से विषय सक्रिय हैं{{overlapText}}?',
  'CQ_CAREER_CONTRADICTION': 'कर्म के कारक परस्पर असहमत हैं ({{support}} समर्थन में, {{challenge}} विरोध में)। इस कुण्डली के लिए पण्डित जी किस पक्ष को अधिक महत्व देंगे, और किस शास्त्रीय आधार पर?',
  'CQ_DUSTHANA_LORD_ANGULAR': '{{house}} भाव का स्वामी {{lord}} {{lordHouse}} भाव ({{kendraTrikona}}) में स्थित है। अपनाई जा रही परम्परा में इसे विपरीत राजयोग माना जाएगा, या अधिष्ठित भाव का पीड़ित होना?',
  'CQ_RETROGRADE': '{{grahas}} जन्म के समय वक्री {{verb}}। पण्डित जी यहाँ वक्री ग्रह का कौन सा फल लागू करेंगे?',
  'CQ_NEAR_COMBUST': '{{grahas}} अपनाई गई अस्त (combustion) सीमा के ठीक बाहर स्थित हैं। क्या पण्डित जी की अपनी दीप्तांश (orb) सारणी के अनुसार यह अस्त माना जाएगा?',
  'CQ_BIRTH_TIME': 'लग्न {{sign}} के {{degree}}° पर है। परिवार को दर्ज जन्म समय पर कितना विश्वास है, और क्या भाव-स्तर के फल कहने से पहले जन्म समय संशोधन (rectification) आवश्यक है?',

  // dashaActivation
  'DASHA_OVERLAP': 'भाव {{house}} चालू दशा में {{lords}} द्वारा — स्थिति, स्वामित्व या पूर्ण दृष्टि से — स्पर्श किया जा रहा है।',
};

const TEMPLATES_EN: Record<string, string> = {
  // fallback placeholders (the actual English strings were generated dynamically)
};

export function trTemplate(id: string, params: Record<string, string | number>, mode: LabelMode, defaultEn: string): string {
  if (mode === 'en') {
    // For English, we use the literal statement generated by the engine
    // as it might already be correctly constructed there, OR we can replace it here.
    // Given the architecture, `defaultEn` is the generated English string.
    return defaultEn; 
  }
  
  let text = TEMPLATES_HI[id];
  if (!text) {
    return defaultEn;
  }
  
  return text.replace(/{{(\w+)}}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
  });
}
