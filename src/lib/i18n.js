/**
 * I18N (PROGRAM 15 / TRUST-09)
 * ============================
 * English + Hindi UI strings. The Sanskrit terms are the CANONICAL identifiers
 * used inside deterministic objects (rashi names, graha names, etc.) — labels
 * for display are translated here, but the underlying data keys never change.
 * This keeps calculation stable regardless of display language.
 */

export const LANGS = ['en', 'hi'];

const STRINGS = {
  en: {
    'nav.myKundlis': 'My Kundlis',
    'nav.workbench': 'Jyotish Workbench',
    'kundli.new': 'New Kundli',
    'kundli.birth': 'Birth details',
    'section.Overview': 'Overview', 'section.Charts': 'Charts', 'section.Planets': 'Planets',
    'section.Bhavas': 'Houses', 'section.Dasha': 'Dasha', 'section.Timeline': 'Timeline',
    'section.Reports': 'Reports', 'section.AskKashi': 'Ask Kashi',
    'birth.timeConfidence': 'Birth time confidence',
    'confidence.EXACT': 'Exact', 'confidence.APPROXIMATE': 'Approximate', 'confidence.UNKNOWN': 'Unknown',
    'trust.calculationIdentity': 'Calculation identity',
  },
  hi: {
    'nav.myKundlis': 'मेरी कुंडलियाँ',
    'nav.workbench': 'ज्योतिष कार्यक्षेत्र',
    'kundli.new': 'नई कुंडली',
    'kundli.birth': 'जन्म विवरण',
    'section.Overview': 'सारांश', 'section.Charts': 'चक्र', 'section.Planets': 'ग्रह',
    'section.Bhavas': 'भाव', 'section.Dasha': 'दशा', 'section.Timeline': 'समयरेखा',
    'section.Reports': 'रिपोर्ट', 'section.AskKashi': 'काशी से पूछें',
    'birth.timeConfidence': 'जन्म समय की निश्चितता',
    'confidence.EXACT': 'सटीक', 'confidence.APPROXIMATE': 'अनुमानित', 'confidence.UNKNOWN': 'अज्ञात',
    'trust.calculationIdentity': 'गणना पहचान',
  },
};

// Sanskrit canonical rashi keys → display in each language.
export const RASHI_DISPLAY = {
  Mesha: { en: 'Aries', hi: 'मेष' }, Vrishabha: { en: 'Taurus', hi: 'वृषभ' },
  Mithuna: { en: 'Gemini', hi: 'मिथुन' }, Karka: { en: 'Cancer', hi: 'कर्क' },
  Simha: { en: 'Leo', hi: 'सिंह' }, Kanya: { en: 'Virgo', hi: 'कन्या' },
  Tula: { en: 'Libra', hi: 'तुला' }, Vrishchika: { en: 'Scorpio', hi: 'वृश्चिक' },
  Dhanu: { en: 'Sagittarius', hi: 'धनु' }, Makara: { en: 'Capricorn', hi: 'मकर' },
  Kumbha: { en: 'Aquarius', hi: 'कुम्भ' }, Meena: { en: 'Pisces', hi: 'मीन' },
};

export function t(lang, key, fallback) {
  const l = LANGS.includes(lang) ? lang : 'en';
  return STRINGS[l][key] ?? STRINGS.en[key] ?? fallback ?? key;
}

export function rashiLabel(lang, sanskritKey) {
  const l = LANGS.includes(lang) ? lang : 'en';
  return RASHI_DISPLAY[sanskritKey]?.[l] ?? sanskritKey;
}

export default { LANGS, t, rashiLabel, RASHI_DISPLAY };
