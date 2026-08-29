export interface ValidatedScriptureEntry {
  grantha: string;
  chapter: number;
  verse: number;
  totalVersesInChapter: number;
  sanskrit: string;
  transliteration: string;
  hindiMeaning: string;
  englishMeaning: string;
}

export const VERIFIED_SCRIPTURE_CORPUS: Record<string, ValidatedScriptureEntry> = {
  'BG_2_47': {
    grantha: 'श्रीमद्भगवद्गीता',
    chapter: 2,
    verse: 47,
    totalVersesInChapter: 72,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    transliteration: 'karmaṇyevādhikāraste mā phaleṣu kadācana | mā karmaphalaheturbhūrmā te saṅgoऽstvakarmaṇi ||',
    hindiMeaning: 'तुम्हारा अधिकार केवल कर्म करने में है, उसके फलों में कभी नहीं। इसलिए कर्म के फल की इच्छा वाले मत बनो और न ही तुम्हारी अकर्मण्यता में आसक्ति हो।',
    englishMeaning: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of actions.'
  },
  'BG_6_5': {
    grantha: 'श्रीमद्भगवद्गीता',
    chapter: 6,
    verse: 5,
    totalVersesInChapter: 47,
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
    transliteration: 'uddharedātmanātmānaṃ nātmānamavasādayet | ātmaiva hyātmano bandhurātmaiva ripurātmanaḥ ||',
    hindiMeaning: 'मनुष्य को अपने द्वारा अपना उद्धार करना चाहिए, अपने को पतन की ओर नहीं ले जाना चाहिए; क्योंकि आत्मा ही अपना मित्र है और आत्मा ही अपना शत्रु है।',
    englishMeaning: 'Let a person lift himself by his own mind, and not degrade himself; for the mind alone is the friend of the self, and the mind alone is the enemy.'
  },
  'BG_18_66': {
    grantha: 'श्रीमद्भगवद्गीता',
    chapter: 18,
    verse: 66,
    totalVersesInChapter: 78,
    sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥',
    transliteration: 'sarvadharmānparityajya māmekaṃ śaraṇaṃ vraja | ahaṃ tvāṃ sarvapāpebhyo mokṣayiṣyāmi mā śucaḥ ||',
    hindiMeaning: 'सभी धर्मों के आश्रय को छोड़कर केवल मेरी शरण में आओ; मैं तुम्हें सभी बन्धनों से मुक्त कर दूंगा, शोक मत करो।',
    englishMeaning: 'Abandon all varieties of dharmas and simply surrender unto Me alone. I shall liberate you from all reactions; do not grieve.'
  },
  'RV_7_59_12': {
    grantha: 'ऋग्वेद (महामृत्युंजय मन्त्र)',
    chapter: 7,
    verse: 59,
    totalVersesInChapter: 104,
    sanskrit: 'त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्।\nउर्वारुकमिव बन्धनान्मृत्यsourceर्मुक्षीय माऽमृतात्॥',
    transliteration: 'tryambakaṃ yajāmahe sugandhiṃ puṣṭivardhanam | urvārukamiva bandhanānmṛtyormukṣīya māmṛtāt ||',
    hindiMeaning: 'हम त्रिनेत्रधारी सुगन्धित और पुष्टिदाता भगवान शिव की उपासना करते हैं। जिस प्रकार पका हुआ खरबूजा बेल के बन्धन से मुक्त हो जाता है, उसी प्रकार हम मृत्यु के बन्धन से मुक्त होकर अमृतत्व को प्राप्त हों।',
    englishMeaning: 'We worship the Three-Eyed One, fragrant and nourishing all beings. As a ripe cucumber is severed from its bondage to the creeper, may we be liberated from death unto immortality.'
  }
};

export function validateAndRetrieveScripture(grantha: string, chapter: number, verse: number): {
  isValid: boolean;
  entry?: ValidatedScriptureEntry;
  errorReason?: string;
} {
  // Gita has 18 chapters. Chapter 18 has exactly 78 verses.
  if (grantha.toLowerCase().includes('gita') || grantha.includes('गीता')) {
    if (chapter < 1 || chapter > 18) {
      return { isValid: false, errorReason: `श्रीमद्भगवद्गीता में केवल १८ अध्याय हैं (अध्याय ${chapter} उपलब्ध नहीं है)।` };
    }
    const maxVersesPerChapter: Record<number, number> = {
      1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34, 10: 42,
      11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78
    };
    const maxV = maxVersesPerChapter[chapter] || 78;
    if (verse < 1 || verse > maxV) {
      return { isValid: false, errorReason: `श्रीमद्भगवद्गीता अध्याय ${chapter} में कुल ${maxV} श्लोक हैं (श्लोक ${verse} अस्तित्व में नहीं है)।` };
    }
    const key = `BG_${chapter}_${verse}`;
    if (VERIFIED_SCRIPTURE_CORPUS[key]) {
      return { isValid: true, entry: VERIFIED_SCRIPTURE_CORPUS[key] };
    }
    return {
      isValid: true,
      entry: {
        grantha: 'श्रीमद्भगवद्गीता',
        chapter,
        verse,
        totalVersesInChapter: maxV,
        sanskrit: `[श्रीमद्भगवद्गीता अध्याय ${chapter}, श्लोक ${verse}]`,
        transliteration: `[Bhagavad Gita ${chapter}.${verse}]`,
        hindiMeaning: `भगवद्गीता अध्याय ${chapter} श्लोक ${verse} का वैदिक संदर्भ।`,
        englishMeaning: `Bhagavad Gita Chapter ${chapter}, Verse ${verse}.`
      }
    };
  }

  return { isValid: false, errorReason: 'अपुष्ट या अनिर्दिष्ट ग्रन्थ संदर्भ।' };
}
