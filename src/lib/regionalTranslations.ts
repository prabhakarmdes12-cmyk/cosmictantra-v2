/**
 * Regional Jyotish Terminology & Prime Indian Languages Dictionary
 * Authentic terminology across classical Bharatiya traditions:
 * Sanskrit, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Odia, Punjabi.
 */

export interface RegionalLanguageTerms {
  languageName: string;
  nativeName: string;
  script: string;
  panchang: string;
  tithi: string;
  nakshatra: string;
  rahuKaal: string;
  abhijit: string;
  gulika: string;
  yamaganda: string;
  yoga: string;
  karana: string;
  lagna: string;
  rashi: string;
  dasha: string;
  kundali: string;
  muhurat: string;
  sunrise: string;
  sunset: string;
  traditionNote: string;
}

export const REGIONAL_JYOTISH_TERMS: Record<string, RegionalLanguageTerms> = {
  sanskrit: {
    languageName: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    script: 'Devanagari',
    panchang: 'पञ्चाङ्गम्',
    tithi: 'तिथिः',
    nakshatra: 'नक्षत्रम्',
    rahuKaal: 'राहुकालः',
    abhijit: 'अभिजित् मुहूर्तम्',
    gulika: 'गुलिककालः',
    yamaganda: 'यमगण्डः',
    yoga: 'योगः',
    karana: 'करणम्',
    lagna: 'लग्नम्',
    rashi: 'राशिः',
    dasha: 'दशा',
    kundali: 'जन्मकुण्डली',
    muhurat: 'शुभमुहूर्तः',
    sunrise: 'सूर्योदयः',
    sunset: 'सूर्यास्तः',
    traditionNote: 'मूल शास्त्र एवं वैदिक संहिता परम्परा'
  },
  hindi: {
    languageName: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    panchang: 'पञ्चाङ्ग',
    tithi: 'तिथि',
    nakshatra: 'नक्षत्र',
    rahuKaal: 'राहुकाल',
    abhijit: 'अभिजित मुहूर्त',
    gulika: 'गुलिक काल',
    yamaganda: 'यमगण्ड',
    yoga: 'योग',
    karana: 'करण',
    lagna: 'लग्न',
    rashi: 'राशि',
    dasha: 'दशा',
    kundali: 'जन्म कुण्डली',
    muhurat: 'शुभ मुहूर्त',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    traditionNote: 'काशी दृक् पञ्चाङ्ग व पारम्परिक वेधशाला'
  },
  tamil: {
    languageName: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    panchang: 'பஞ்சாங்கம்',
    tithi: 'திதி',
    nakshatra: 'நட்சத்திரம்',
    rahuKaal: 'ராகு காலம்',
    abhijit: 'அபிஜித் முகூர்த்தம்',
    gulika: 'குளிகை காலம்',
    yamaganda: 'யமகண்டம்',
    yoga: 'யோகம்',
    karana: 'கரணம்',
    lagna: 'லக்னம்',
    rashi: 'ராசி',
    dasha: 'தசை (திசா)',
    kundali: 'ஜாதகம்',
    muhurat: 'சுப முகூர்த்தம்',
    sunrise: 'சூரியோதயம்',
    sunset: 'சூரிய அஸ்தமனம்',
    traditionNote: 'வாக்கிய & திருக்கணித பஞ்சாங்கம் (Vakya & Drik Tradition)'
  },
  telugu: {
    languageName: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    panchang: 'పంచాంగము',
    tithi: 'తిథి',
    nakshatra: 'నక్షత్రము',
    rahuKaal: 'రాహు కాలము',
    abhijit: 'అభిజిత్ ముహూర్తము',
    gulika: 'గుళిక కాలము',
    yamaganda: 'యమగండము',
    yoga: 'యోగము',
    karana: 'కరణము',
    lagna: 'లగ్నము',
    rashi: 'రాశి',
    dasha: 'దశ',
    kundali: 'జన్మ కుండలి / జాతక చక్రము',
    muhurat: 'శుభ ముహూర్తము',
    sunrise: 'సూర్యోదయము',
    sunset: 'సూర్యాస్తమయము',
    traditionNote: 'ఆంధ్ర & తెలంగాణ తిథి నిర్ణయ దర్పణం'
  },
  kannada: {
    languageName: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    panchang: 'ಪಂಚಾಂಗ',
    tithi: 'ತಿಥಿ',
    nakshatra: 'ನಕ್ಷತ್ರ',
    rahuKaal: 'ರಾಹು ಕಾಲ',
    abhijit: 'ಅಭಿಜಿತ್ ಮುಹೂರ್ತ',
    gulika: 'ಗುಳಿಕ ಕಾಲ',
    yamaganda: 'ಯಮಗಂಡ',
    yoga: 'ಯೋಗ',
    karana: 'ಕರಣ',
    lagna: 'ಲಗ್ನ',
    rashi: 'ರಾಶಿ',
    dasha: 'ದಶೆ',
    kundali: 'ಜನ್ಮ ಕುಂಡಲಿ / ಜಾತಕ',
    muhurat: 'ಶುಭ ಮುಹೂರ್ತ',
    sunrise: 'ಸೂರ್ಯೋದಯ',
    sunset: 'ಸೂರ್ಯಾಸ್ತ',
    traditionNote: 'ಕರ್ನಾಟಕ ಸಿದ್ಧಾಂತ ಪಂಚಾಂಗ ಪರಂಪರೆ'
  },
  malayalam: {
    languageName: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    panchang: 'പഞ്ചാംഗം',
    tithi: 'തിഥി',
    nakshatra: 'നക്ഷത്രം',
    rahuKaal: 'രാഹുകാലം',
    abhijit: 'അഭിജിത്ത് മുഹൂർത്തം',
    gulika: 'ഗുളികകാലം',
    yamaganda: 'യമഗണ്ഡം',
    yoga: 'യോഗം',
    karana: 'കരണം',
    lagna: 'ലഗ്നം',
    rashi: 'രാശി',
    dasha: 'ദശ',
    kundali: 'ജാതകം (ചക്രം)',
    muhurat: 'ശുഭ മുഹൂർത്തം',
    sunrise: 'സൂര്യോദയം',
    sunset: 'സൂര്യാസ്തമയം',
    traditionNote: 'കേരള ജ്യോതിഷം & ഞാറ്റുവേല പാരമ്പര്യം'
  },
  bengali: {
    languageName: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    panchang: 'পঞ্জিকা (গুপ্তপ্রেস ও বিশুদ্ধ সিদ্ধান্ত)',
    tithi: 'তিথি',
    nakshatra: 'নক্ষত্র',
    rahuKaal: 'রাহুকাল',
    abhijit: 'অভিজিৎ মুহূর্ত',
    gulika: 'গুলিক কাল',
    yamaganda: 'যমগণ্ড',
    yoga: 'যোগ',
    karana: 'করণ',
    lagna: 'লগ্ন',
    rashi: 'রাশি',
    dasha: 'দশা',
    kundali: 'কোষ্ঠী / জন্মছক',
    muhurat: 'শুভ মুহূর্ত',
    sunrise: 'সূর্যোদয়',
    sunset: 'সূর্যাস্ত',
    traditionNote: 'বঙ্গীয় পঞ্জিকা ও গুপ্তপ্রেস ঐতিহ্য'
  },
  marathi: {
    languageName: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    panchang: 'पंचांग (दाते / कालनिर्णय)',
    tithi: 'तिथी',
    nakshatra: 'नक्षत्र',
    rahuKaal: 'राहुकाळ',
    abhijit: 'अभिजित मुहूर्त',
    gulika: 'गुलिक काळ',
    yamaganda: 'यमगंड',
    yoga: 'योग',
    karana: 'करण',
    lagna: 'लग्न',
    rashi: 'रास',
    dasha: 'महादशा',
    kundali: 'जन्म पत्रिका / कुंडली',
    muhurat: 'शुभ मुहूर्त',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    traditionNote: 'महाराष्ट्र दाते पंचांग व चौघडिया परम्परा'
  },
  gujarati: {
    languageName: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    panchang: 'પંચાંગ',
    tithi: 'તિથિ',
    nakshatra: 'નક્ષત્ર',
    rahuKaal: 'રાહુકાળ',
    abhijit: 'અભિજિત મુહૂર્ત',
    gulika: 'ગુળિકા કાળ',
    yamaganda: 'યમગંડ',
    yoga: 'યોગ',
    karana: 'કરણ',
    lagna: 'લગ્ન',
    rashi: 'રાશિ',
    dasha: 'દશા',
    kundali: 'જન્મ કુંડળી',
    muhurat: 'શુભ મુહૂર્ત',
    sunrise: 'સૂર્યોદય',
    sunset: 'સૂર્યાસ્ત',
    traditionNote: 'ગુજરાતી ચોઘડિયા પ્રધાન સંસ્કૃતિ'
  },
  odia: {
    languageName: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia',
    panchang: 'ପାଞ୍ଜି / କୋହେନୂର ପଞ୍ଜିକା',
    tithi: 'ତିଥି',
    nakshatra: 'ନକ୍ଷତ୍ର',
    rahuKaal: 'ରାହୁକାଳ',
    abhijit: 'ଅଭିଜିତ ମୁହୂର୍ତ୍ତ',
    gulika: 'ଗୁଳିକା କାଳ',
    yamaganda: 'ଯମଗଣ୍ଡ',
    yoga: 'ଯୋଗ',
    karana: 'କରଣ',
    lagna: 'ଲଗ୍ନ',
    rashi: 'ରାଶି',
    dasha: 'ଦଶା',
    kundali: 'ଜନ୍ମ କୋଷ୍ଠୀ',
    muhurat: 'ଶୁଭ ମୁହୂର୍ତ୍ତ',
    sunrise: 'ସୂର୍ଯ୍ୟୋଦୟ',
    sunset: 'ସୂର୍ଯ୍ୟାସ୍ତ',
    traditionNote: 'ଶ୍ରୀଜଗନ୍ନାଥ ମନ୍ଦିର ପାଞ୍ଜି ଓ ସାମନ୍ତ ଚନ୍ଦ୍ରଶେଖର ସିଦ୍ଧାନ୍ତ'
  },
  punjabi: {
    languageName: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    panchang: 'ਜੰਤਰੀ / ਪੰਚਾਂਗ',
    tithi: 'ਤਿਥੀ',
    nakshatra: 'ਨਕਸ਼ੱਤਰ',
    rahuKaal: 'ਰਾਹੂਕਾਲ',
    abhijit: 'ਅਭਿਜੀਤ ਮੁਹੂਰਤ',
    gulika: 'ਗੁਲਿਕ ਕਾਲ',
    yamaganda: 'ਯਮਗੰਡ',
    yoga: 'ਯੋਗ',
    karana: 'ਕਰਣ',
    lagna: 'ਲਗਨ',
    rashi: 'ਰਾਸ਼ੀ',
    dasha: 'ਦਸ਼ਾ',
    kundali: 'ਜਨਮ ਕੁੰਡਲੀ / ਟੇਵਾ',
    muhurat: 'ਸ਼ੁਭ ਮਹੂਰਤ',
    sunrise: 'ਸੂਰਜ ਚੜ੍ਹਨਾ',
    sunset: 'ਸੂਰਜ ਡੁੱਬਣਾ',
    traditionNote: 'ਉੱਤਰੀ ਭਾਰਤੀ ਜੰਤਰੀ ਤੇ ਪ੍ਰਵਿਸ਼ਟਾ ਪਰੰਪਰਾ'
  }
};

export const regionalTerms = REGIONAL_JYOTISH_TERMS;
export type RegionalLanguage = keyof typeof REGIONAL_JYOTISH_TERMS;
