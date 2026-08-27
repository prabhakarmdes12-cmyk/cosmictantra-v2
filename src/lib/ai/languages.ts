export type LanguageQualificationStatus = 'PRODUCTION' | 'BETA' | 'UNQUALIFIED';

export interface LanguageQualificationRecord {
  code: string;
  nameEn: string;
  nameNative: string;
  status: LanguageQualificationStatus;
  greeting: string;
  rahuKaalTemplate: (city: string, start: string, end: string) => string;
  boundaryDisclaimer: string;
}

export const LANGUAGE_QUALIFICATION_MATRIX: Record<string, LanguageQualificationRecord> = {
  hi: {
    code: 'hi',
    nameEn: 'Hindi',
    nameNative: 'हिंदी',
    status: 'PRODUCTION',
    greeting: 'हर हर महादेव! 🙏',
    rahuKaalTemplate: (city, s, e) => `आज ${city} में राहुकाल ${s} से ${e} तक है। यह स्थानीय सूर्योदय व सूर्यास्त के आधार पर Calculated है।`,
    boundaryDisclaimer: 'यह खगोलीय गणना पर आधारित सूचना है। व्यक्तिगत जीवन निर्णयों हेतु वरिष्ठ विद्वान् ज्योतिषी का परामर्श उपलब्ध है।'
  },
  en: {
    code: 'en',
    nameEn: 'English',
    nameNative: 'English',
    status: 'PRODUCTION',
    greeting: 'Har Har Mahadev! 🙏',
    rahuKaalTemplate: (city, s, e) => `Today in ${city}, Rahu Kaal is from ${s} to ${e}. This is calculated based on local sunrise and sunset.`,
    boundaryDisclaimer: 'This information is based on astronomical ephemeris. For contextual life decisions, verified scholar consultation is available.'
  },
  bn: {
    code: 'bn',
    nameEn: 'Bengali',
    nameNative: 'বাংলা',
    status: 'BETA',
    greeting: 'হর হর মহাদেব! 🙏',
    rahuKaalTemplate: (city, s, e) => `আজ ${city}-তে রাহুকাল ${s} থেকে ${e} পর্যন্ত।`,
    boundaryDisclaimer: 'এটি একটি জ্যোতির্বৈজ্ঞানিক গণনা।'
  },
  mr: {
    code: 'mr',
    nameEn: 'Marathi',
    nameNative: 'मराठी',
    status: 'BETA',
    greeting: 'हर हर महादेव! 🙏',
    rahuKaalTemplate: (city, s, e) => `आज ${city} मध्ये राहूकाळ ${s} ते ${e} पर्यंत आहे.`,
    boundaryDisclaimer: 'ही माहिती खगोलीय गणितावर आधारित आहे.'
  },
  gu: {
    code: 'gu',
    nameEn: 'Gujarati',
    nameNative: 'ગુજરાતી',
    status: 'BETA',
    greeting: 'હર હર મહાદેવ! 🙏',
    rahuKaalTemplate: (city, s, e) => `આજે ${city} માં રાહુકાળ ${s} થી ${e} સુધી છે.`,
    boundaryDisclaimer: 'આ માહિતી ખગોળીય ગણતરી પર આધારિત છે.'
  },
  ta: {
    code: 'ta',
    nameEn: 'Tamil',
    nameNative: 'தமிழ்',
    status: 'BETA',
    greeting: 'ஹர ஹர மஹாதேவ! 🙏',
    rahuKaalTemplate: (city, s, e) => `இன்று ${city}-ல் ராகு காலம் ${s} முதல் ${e} வரை.`,
    boundaryDisclaimer: 'இது வானியல் கணக்கீட்டின் அடிப்படையிலானது.'
  },
  te: {
    code: 'te',
    nameEn: 'Telugu',
    nameNative: 'తెలుగు',
    status: 'BETA',
    greeting: 'హర హర మహాదేవ! 🙏',
    rahuKaalTemplate: (city, s, e) => `ఈరోజు ${city} లో రాహుకాలం ${s} నుండి ${e} వరకు.`,
    boundaryDisclaimer: 'ఇది ఖగోళ గణన ఆధారిత సమాచారం.'
  },
  kn: {
    code: 'kn',
    nameEn: 'Kannada',
    nameNative: 'ಕನ್ನಡ',
    status: 'BETA',
    greeting: 'ಹರ ಹರ ಮಹಾದೇವ! 🙏',
    rahuKaalTemplate: (city, s, e) => `ಇಂದು ${city} ನಲ್ಲಿ ರಾಹುಕಾಲ ${s} ರಿಂದ ${e} ವರೆಗೆ.`,
    boundaryDisclaimer: 'ಇದು ಖಗೋಳಶಾಸ್ತ್ರದ ಲೆಕ್ಕಾಚಾರವಾಗಿದೆ.'
  },
  ml: {
    code: 'ml',
    nameEn: 'Malayalam',
    nameNative: 'മലയാളം',
    status: 'BETA',
    greeting: 'ഹര ഹര മഹാദേവ! 🙏',
    rahuKaalTemplate: (city, s, e) => `ഇന്ന് ${city}-ൽ രാഹുകാലം ${s} മുതൽ ${e} വരെ.`,
    boundaryDisclaimer: 'ഇത് ജ്യോതിശാസ്ത്ര കണക്കുകൂട്ടലുകളെ അടിസ്ഥാനമാക്കിയുള്ളതാണ്.'
  },
  pa: {
    code: 'pa',
    nameEn: 'Punjabi',
    nameNative: 'ਪੰਜਾਬੀ',
    status: 'BETA',
    greeting: 'ਹਰਿ ਹਰਿ ਮਹਾਦੇਵ! 🙏',
    rahuKaalTemplate: (city, s, e) => `ਅੱਜ ${city} ਵਿੱਚ ਰਾਹੂਕਾਲ ${s} ਤੋਂ ${e} ਤੱਕ ਹੈ।`,
    boundaryDisclaimer: 'ਇਹ ਖਗੋਲੀ ਗਣਨਾ ਤੇ ਆਧਾਰਿਤ ਜਾਣਕਾਰੀ ਹੈ।'
  },
  or: {
    code: 'or',
    nameEn: 'Odia',
    nameNative: 'ଓଡ଼ିଆ',
    status: 'BETA',
    greeting: 'ହର ହର ମହାଦେବ! 🙏',
    rahuKaalTemplate: (city, s, e) => `ଆଜି ${city} ରେ ରାହୁକାଳ ${s} ରୁ ${e} ପର୍ଯ୍ୟନ୍ତ।`,
    boundaryDisclaimer: 'ଏହା ଏକ ଖଗୋଳୀୟ ଗଣନା ଅଟେ।'
  },
  as: {
    code: 'as',
    nameEn: 'Assamese',
    nameNative: 'অসমীয়া',
    status: 'BETA',
    greeting: 'হৰ হৰ মহাদেৱ! 🙏',
    rahuKaalTemplate: (city, s, e) => `আজি ${city} ত ৰাহুকাল ${s} ৰ পৰা ${e} লৈকে।`,
    boundaryDisclaimer: 'এইটো জ্যোতিৰ্বিজ্ঞান গণনাৰ ওপৰত ভিত্তি কৰি তৈয়াৰ কৰা।'
  }
};
