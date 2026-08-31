export type CanonicalIntent =
  | 'PANCHANG'
  | 'MUHURTA'
  | 'KUNDALI'
  | 'DASHA'
  | 'GOCHARA'
  | 'DARSHAN'
  | 'TEMPLE'
  | 'PILGRIMAGE'
  | 'MANTRA'
  | 'AARTI_STOTRA'
  | 'FESTIVAL'
  | 'SANKALPA'
  | 'FAMILY'
  | 'CONSULTATION_HISTORY'
  | 'BOOK_SCHOLAR'
  | 'GENERAL_EDUCATION'
  | 'LIFE_QUESTION'
  | 'SAFETY_CRITICAL'
  | 'UNKNOWN';

export type AllowedResponseMode =
  | 'DIRECT_CALCULATION'
  | 'STRUCTURED_CARD'
  | 'PLAIN_TEXT'
  | 'SAFETY_REDIRECT'
  | 'CLARIFICATION'
  | 'SCHOLAR_ESCALATION';

export interface IntentResolution {
  intent: CanonicalIntent;
  confidence: number;
  requiredContext: string[];
  requiredTools: string[];
  allowedResponseMode: AllowedResponseMode;
  extractedEntities?: Record<string, any>;
  rawQuery: string;
}

export function classifyUserIntent(rawQuery: string): IntentResolution {
  const query = (rawQuery || '').toLowerCase().trim();

  // 1. SAFETY_CRITICAL (Priority 0)
  const safetyKeywords = [
    'kill myself', 'suicide', 'end my life', 'want to die', 'harm myself',
    'आत्महत्या', 'जान दे दूंगा', 'मरना चाहता हूँ', 'मर जाऊं', 'जीने का मन नहीं',
    'domestic violence', 'marpit', 'mar raha hai', 'beating me', 'sexual abuse', 'child abuse',
    'heart attack', 'severe chest pain', 'stroke', 'medical emergency', 'sleeping pills',
    'swallowed', 'poison', 'फांसी', 'unconsciousness'
  ];
  for (const kw of safetyKeywords) {
    if (query.includes(kw)) {
      return {
        intent: 'SAFETY_CRITICAL',
        confidence: 0.99,
        requiredContext: [],
        requiredTools: ['emergency_crisis_protocol'],
        allowedResponseMode: 'SAFETY_REDIRECT',
        rawQuery
      };
    }
  }

  // 2. CONSULTATION_HISTORY
  if (
    query.includes('पंडित जी ने') || query.includes('पिछली बार') || query.includes('पिछला परामर्श') ||
    query.includes('what did pandit say') || query.includes('last consultation') || query.includes('previous session') ||
    query.includes('मेरी पुरानी सलाह') || query.includes('last year') || query.includes('पिछली सभा') ||
    query.includes('पुराने परामर्श') || query.includes('पुरानी सलाह') || query.includes('consultation history') ||
    query.includes('class c') || query.includes('1982') || query.includes('last session') ||
    query.includes('पिछले परामर्श') || query.includes('पिछले सत्र') || query.includes('follow-up')
  ) {
    return {
      intent: 'CONSULTATION_HISTORY',
      confidence: 0.95,
      requiredContext: ['cosmic_id'],
      requiredTools: ['get_consultation_memory'],
      allowedResponseMode: 'STRUCTURED_CARD',
      rawQuery
    };
  }

  // 3. BOOK_SCHOLAR
  if (
    query.includes('पंडित जी से बात') || query.includes('विद्वान परामर्श') || query.includes('book astrologer') ||
    query.includes('consultation fee') || query.includes('सभा बुक') || query.includes('callme4') ||
    query.includes('बात करनी है') || query.includes('talk to pandit') || query.includes('book consultation') ||
    query.includes('fee for') || query.includes('दक्षिणा') || query.includes('book a') ||
    query.includes('book sabha') || query.includes('परामर्श पत्र') || query.includes('विद्यानंद') ||
    query.includes('family-assisted') || query.includes('वीडियो दर्शन परामर्श') ||
    query.includes('consultation call') || query.includes('jyotish consultation')
  ) {
    return {
      intent: 'BOOK_SCHOLAR',
      confidence: 0.95,
      requiredContext: ['service_mode', 'topic'],
      requiredTools: ['get_scholar_schedule'],
      allowedResponseMode: 'SCHOLAR_ESCALATION',
      rawQuery
    };
  }

  // 4. DARSHAN / TEMPLE (Before panchang so "ganga aarti timing" routes to darshan)
  if (
    query.includes('लाइव दर्शन') || query.includes('live darshan') || query.includes('विश्वनाथ') ||
    query.includes('महाकाल') || query.includes('सोमनाथ') || query.includes('गंगा आरती') ||
    query.includes('बैद्यनाथ') || query.includes('देवघर') || query.includes('हरिद्वार') ||
    query.includes('मंगला आरती') || query.includes('काल भैरव') || query.includes('अन्नपूर्णा') ||
    query.includes('live stream') || query.includes('ganga aarti') || query.includes('dashashwamedh') ||
    query.includes('aarti timing') || (query.includes('दर्शन') && !query.includes('वीडियो दर्शन'))
  ) {
    return {
      intent: 'DARSHAN',
      confidence: 0.95,
      requiredContext: ['shrine_id'],
      requiredTools: ['get_temple_darshan'],
      allowedResponseMode: 'STRUCTURED_CARD',
      rawQuery
    };
  }

  // 5. MUHURTA
  if (
    query.includes('विवाह') || query.includes('गृह प्रवेश') || query.includes('शादी') ||
    query.includes('namkaran') || query.includes('नामकरण') || query.includes('मुंडन') ||
    query.includes('vehicle purchase') || query.includes('wedding') || query.includes('उद्घाटन') ||
    query.includes('house warming') || query.includes('संस्कार') || query.includes('सोना खरीदने') ||
    query.includes('विद्यारम्भ') || query.includes('invent a good muhurat') || query.includes('muhurat') ||
    query.includes('muhurta') || query.includes('property registration') || query.includes('auspicious lagna') ||
    (query.includes('मुहूर्त') && !query.includes('आज का अभिजित'))
  ) {
    return {
      intent: 'MUHURTA',
      confidence: 0.92,
      requiredContext: ['event_type'],
      requiredTools: ['get_muhurat'],
      allowedResponseMode: 'STRUCTURED_CARD',
      rawQuery
    };
  }

  // 6. PANCHANG
  if (
    query.includes('राहुकाल') || query.includes('rahu kaal') || query.includes('rahu') ||
    query.includes('पंचांग') || query.includes('पञ्चाङ्ग') || query.includes('panchang') ||
    query.includes('तिथि') || query.includes('tithi') || query.includes('चौघड़िया') ||
    query.includes('सूर्योदय') || query.includes('sunrise') || query.includes('सूर्यास्त') ||
    query.includes('sunset') || query.includes('भद्रा') || query.includes('करण') ||
    query.includes('अभिजित मुहूर्त') || query.includes('shukla paksha') || query.includes('krishna paksha') ||
    (query.includes('आज') && (query.includes('नक्षत्र') || query.includes('वार') || query.includes('योग') || query.includes('प्रदोष काल')))
  ) {
    return {
      intent: 'PANCHANG',
      confidence: 0.95,
      requiredContext: ['location'],
      requiredTools: ['get_panchang'],
      allowedResponseMode: 'DIRECT_CALCULATION',
      rawQuery
    };
  }

  // 7. DASHA
  if (
    query.includes('महादशा') || query.includes('अन्तर्दशा') || query.includes('मेरी दशा') ||
    query.includes('dasha') || query.includes('mahadasha') || query.includes('vimshottari')
  ) {
    return {
      intent: 'DASHA',
      confidence: 0.90,
      requiredContext: ['birth_date', 'birth_time', 'birth_city'],
      requiredTools: ['get_dasha'],
      allowedResponseMode: 'STRUCTURED_CARD',
      rawQuery
    };
  }

  // 8. GOCHARA
  if (
    query.includes('गोचर') || query.includes('transit') || query.includes('साढ़े साती') ||
    query.includes('sade sati') || query.includes('saturn is') || query.includes('शनि कहाँ है') ||
    query.includes('retrograde') || query.includes('गुरु गोचर')
  ) {
    return {
      intent: 'GOCHARA',
      confidence: 0.90,
      requiredContext: ['current_date'],
      requiredTools: ['get_gochara'],
      allowedResponseMode: 'DIRECT_CALCULATION',
      rawQuery
    };
  }

  // 9. KUNDALI
  if (
    query.includes('कुंडली') || query.includes('कुण्डली') || query.includes('kundali') ||
    query.includes('birth chart') || query.includes('लग्न') || query.includes('ascendant') ||
    query.includes('nakshatra pada') || query.includes('राशि') || query.includes('अयनमांश') ||
    query.includes('पत्रिका') || query.includes('ग्रह') || query.includes('lagna degree')
  ) {
    return {
      intent: 'KUNDALI',
      confidence: 0.88,
      requiredContext: ['birth_date', 'birth_time', 'birth_city'],
      requiredTools: ['calculate_kundali'],
      allowedResponseMode: 'STRUCTURED_CARD',
      rawQuery
    };
  }

  // 10. PILGRIMAGE
  if (
    query.includes('काशी यात्रा') || query.includes('वाराणसी यात्रा') || query.includes('kashi yatra') ||
    query.includes('परिक्रमा') || query.includes('तीर्थ यात्रा') || query.includes('घाटों की सूची') ||
    query.includes('pilgrimage') || query.includes('itinerary')
  ) {
    return {
      intent: 'PILGRIMAGE',
      confidence: 0.90,
      requiredContext: ['destination'],
      requiredTools: ['get_kashi_journey'],
      allowedResponseMode: 'STRUCTURED_CARD',
      rawQuery
    };
  }

  // 11. MANTRA / AARTI_STOTRA
  if (
    query.includes('मन्त्र') || query.includes('मंत्र') || query.includes('mantra') ||
    query.includes('महामृत्युंजय') || query.includes('गायत्री') || query.includes('स्तोत्र') ||
    query.includes('stotra') || query.includes('चालीसा') || query.includes('chalisa') ||
    query.includes('ताण्डव') || query.includes('सूक्त') || query.includes('tryambakam') ||
    query.includes('सहस्रनाम') || query.includes('रुद्राष्टकम्') || query.includes('अथर्वशीर्ष') ||
    query.includes('108 japa') || query.includes('बीज मन्त्र') || query.includes('का पाठ') ||
    query.includes('destroy my enemy') || query.includes('मारण') || query.includes('कालभैरवाष्टकम्')
  ) {
    return {
      intent: 'MANTRA',
      confidence: 0.90,
      requiredContext: ['mantra_type'],
      requiredTools: ['get_mantra'],
      allowedResponseMode: 'STRUCTURED_CARD',
      rawQuery
    };
  }

  // 12. LIFE_QUESTION
  if (
    query.includes('उदास') || query.includes('sad') || query.includes('तनाव') ||
    query.includes('अशांति') || query.includes('करियर') || query.includes('career') ||
    query.includes('difficult') || query.includes('घाटा') || query.includes('घबराहट') ||
    query.includes('lonely') || query.includes('बाधाएं') || query.includes('failure') ||
    query.includes('कलह') || query.includes('anxious') || query.includes('बदलेगा') ||
    query.includes('peace') || query.includes('निराशा') || query.includes('will i die') ||
    query.includes('rahu mahadasha') || query.includes('कठिन') || query.includes('overwhelmed') ||
    query.includes('समय') || query.includes('why') ||
    // Multilingual / romanized distress & emotion signals (Hinglish, Devanagari, English)
    query.includes('dar lag') || query.includes('darr') || query.includes('dar se') ||
    query.includes('darta') || query.includes('darti') || query.includes('darte') ||
    query.includes('डर') || query.includes('bhay') || query.includes('khauf') ||
    query.includes('chinta') || query.includes('fikr') || query.includes('fikar') ||
    query.includes('tension') || query.includes('pareshan') || query.includes('pareshaan') ||
    query.includes('udaas') || query.includes('udasi') || query.includes('dukhi') ||
    query.includes('dukh') || query.includes('gum hai') || query.includes('gham') ||
    query.includes('ro raha') || query.includes('ro rahi') || query.includes('gussa') ||
    query.includes('krodh') || query.includes('akela') || query.includes('akeli') ||
    query.includes('tanha') || query.includes('tanhai') || query.includes('koi nahi') ||
    query.includes('dhokha') || query.includes('dhoka') || query.includes('bewafa') ||
    query.includes('dil toota') || query.includes('dil tuta') || query.includes('breakup') ||
    query.includes('himmat nahi') || query.includes('haunsla') || query.includes('hausla') ||
    query.includes('confidence nahi') || query.includes('galti') || query.includes('pachtava') ||
    query.includes('pachhtava') || query.includes('afsos') || query.includes('sharm') ||
    query.includes('guilt') || query.includes('regret') || query.includes('bojh') ||
    query.includes('thak gaya') || query.includes('thak gayi') || query.includes('pressure') ||
    query.includes('burnout') || query.includes('overwhelmed') || query.includes('exhausted') ||
    query.includes('bimar') || query.includes('bimari') || query.includes('taklif') ||
    query.includes('dard') || query.includes('dushman') || query.includes('sazish') ||
    query.includes('nazar lag') || query.includes('nasha') || query.includes('sharab') ||
    query.includes('lat lag') || query.includes('aalsi') || query.includes('susti') ||
    query.includes('man nahi lagta') || query.includes('uljhan') || query.includes('sanshay') ||
    query.includes('sandeh') || query.includes('kya karu') || query.includes('samajh nahi')
  ) {
    return {
      intent: 'LIFE_QUESTION',
      confidence: 0.85,
      requiredContext: ['topic'],
      requiredTools: ['get_scripture_insight'],
      allowedResponseMode: 'CLARIFICATION',
      rawQuery
    };
  }

  // Fallback UNKNOWN
  return {
    intent: 'UNKNOWN',
    confidence: 0.40,
    requiredContext: [],
    requiredTools: [],
    allowedResponseMode: 'CLARIFICATION',
    rawQuery
  };
}
