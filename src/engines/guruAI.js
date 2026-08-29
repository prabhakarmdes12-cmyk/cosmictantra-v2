/**
 * CosmicTantra V34 — Kashi Sahayak System Prompt & Vedic Logic
 * Authentic Vedic knowledge grounded in Varanasi tradition and 12 Indian Languages.
 */

export const INDIAN_LANGUAGES = {
  hi: { name: 'हिंदी', code: 'hi', greeting: 'हर हर महादेव! 🙏' },
  en: { name: 'English', code: 'en', greeting: 'Har Har Mahadev! 🙏' },
  sa: { name: 'संस्कृतम्', code: 'sa', greeting: 'नमो विश्वनाथाय! 🙏' },
  bn: { name: 'বাংলা', code: 'bn', greeting: 'হর হর মহাদেব! 🙏' },
  ta: { name: 'தமிழ்', code: 'ta', greeting: 'ஹர ஹர மஹாதேவ! 🙏' },
  te: { name: 'తెలుగు', code: 'te', greeting: 'హర హర మహాదేవ! 🙏' },
  mr: { name: 'मराठी', code: 'mr', greeting: 'हर हर महादेव! 🙏' },
  gu: { name: 'ગુજરાતી', code: 'gu', greeting: 'હર હર મહાદેવ! 🙏' },
  kn: { name: 'ಕನ್ನಡ', code: 'kn', greeting: 'ಹರ ಹರ ಮಹಾದೇವ! 🙏' },
  ml: { name: 'മലയാളം', code: 'ml', greeting: 'ഹര ഹര മഹാദേവ! 🙏' },
  pa: { name: 'ਪੰਜਾਬੀ', code: 'pa', greeting: 'ਹਰਿ ਹਰਿ ਮਹਾਦੇਵ! 🙏' },
  or: { name: 'ଓଡ଼ିଆ', code: 'or', greeting: 'ହର ହର ମହାଦେବ! 🙏' }
};

export function buildSystemPrompt(language = 'hi', kundali = null) {
  const langMeta = INDIAN_LANGUAGES[language] || INDIAN_LANGUAGES.hi;
  
  let prompt = `आप 'काशी सहायक' (Kashi Sahayak) हैं — CosmicTantra के आधिकारिक वैदिक सहायक।
स्थान: वाराणसी (काशी), उत्तर प्रदेश।
भाषा: ${langMeta.name}। अभिवादन: "${langMeta.greeting}"

आचार संहिता:
1. कभी भी मनगढ़ंत पञ्चाङ्ग, कुण्डली या भविष्यफल न बनाएं।
2. खगोलीय गणनाओं, तिथि, नक्षत्र व राहुकाल हेतु प्रामाणिक दृक् पञ्चाङ्ग का संदर्भ लें।
3. जटिल कुण्डली निर्णय या व्यक्तिगत सलाह हेतु काशी के वरिष्ठ विद्वान् "पं. विद्यानंद शास्त्री (मानव ज्योतिषी • वाराणसी)" से परामर्श लेने का सुझाव दें।
`;

  if (kundali) {
    prompt += `
जातक कुण्डली विवरण:
- लग्न: ${kundali.lagna?.rashiName || kundali.lagna?.rasiName} (${kundali.lagna?.nakshatra?.name || ''} नक्षत्र)
- चन्द्र: ${kundali.planets?.Moon?.rashiName || kundali.planets?.Moon?.rasiName}
- सूर्य: ${kundali.planets?.Sun?.rashiName || kundali.planets?.Sun?.rasiName}
`;
  }

  return prompt;
}

import { getSmartUpayaRecommendations } from '../lib/upayaEngine';

export function generateRemedies(kundali, question = '') {
  const lagna = kundali?.lagna?.rashiName || 'Mesha';
  const moonNak = kundali?.birthPanchang?.nakshatra?.name || 'Ashwini';
  const dasha = kundali?.dasha?.currentMahadasha || 'Jupiter';
  return getSmartUpayaRecommendations(lagna, moonNak, dasha, question);
}

export default {
  buildSystemPrompt,
  generateRemedies,
  INDIAN_LANGUAGES
};
