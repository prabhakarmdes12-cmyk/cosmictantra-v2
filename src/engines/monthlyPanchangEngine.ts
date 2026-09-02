/**
 * CosmicTantra V34 — Monthly Panchang & Personal Energy Engine
 * Complete Month-Solver computing daily Tithi, Nakshatra, Yoga, Karana, Vara,
 * Shubh Muhurats, Rahu Kaal, Festivals/Vrats, and Personal Power/Caution Days.
 */

export interface PanchangDayData {
  dayNumber: number;
  dateString: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  dayName: string;
  dayNameHi: string;
  varaPlanet: string;
  varaColor: string;
  lunarMonth?: string;
  lunarMonthHi?: string;
  
  // 5 Limbs of Panchanga
  tithi: {
    index: number; // 1-30
    name: string;
    nameHi: string;
    paksha: 'Shukla Paksha' | 'Krishna Paksha';
    meaning: string;
    isPurnima: boolean;
    isAmavasya: boolean;
  };
  nakshatra: {
    index: number; // 0-26
    name: string;
    nameHi: string;
    pada: number; // 1-4
    lord: string;
    deity: string;
    symbol: string;
  };
  yoga: {
    index: number;
    name: string;
    nameHi: string;
    quality: 'Auspicious' | 'Moderate' | 'Inauspicious';
    qualityHi: string;
  };
  karana: {
    name: string;
    nameHi: string;
    type: 'Movable' | 'Fixed';
    typeHi: string;
  };
  
  // Solar & Lunar Timings
  timings: {
    sunrise: string;
    sunset: string;
    moonrise: string;
    moonset: string;
    rahuKaal: { start: string; end: string };
    yamaganda: { start: string; end: string };
    gulikaKaal: { start: string; end: string };
    abhijitMuhurat: { start: string; end: string } | null;
    brahmaMuhurat: { start: string; end: string };
    amritKaal: { start: string; end: string };
    vijayMuhurat: { start: string; end: string };
  };
  
  // Moon Phase
  moonPhase: {
    fraction: number; // 0 to 1
    phaseName: string;
    icon: '🌕' | '🌑' | '🌓' | '🌘' | '🌔' | '🌒';
  };
  
  // Festivals and Vrats
  festivals: Array<{
    name: string;
    nameHi: string;
    type: 'Major Festival' | 'Vrat' | 'Jayanti' | 'Panchang Event';
    isImportant: boolean;
  }>;
  
  // Personal Energy (Computed if profile is provided)
  personalEnergy?: {
    taraNum: number; // 1 to 9
    taraName: string;
    taraNameHi: string;
    taraStatus: 'POWER' | 'CAUTION' | 'NEUTRAL';
    taraDesc: string;
    taraDescHi: string;
    chandraHouse: number | null; // 1 to 12
    chandraHouseDesc: string;
    chandraHouseDescHi: string;
    status: 'POWER' | 'CAUTION' | 'BALANCED';
    badgeLabel: string;
    badgeLabelHi: string;
    glowClass: string;
    advice: string;
    adviceHi: string;
  };
}

export interface MonthPanchangOverview {
  year: number;
  month: number; // 0-indexed (0 = Jan, 7 = Aug)
  monthName: string;
  monthNameHi: string;
  lunarMonth: string;
  lunarMonthHi: string;
  vikramSamvat: number;
  shakaSamvat: number;
  ritu: string;
  rituHi: string;
  ayana: string;
  ayanaHi: string;
  daysInMonth: number;
  firstDayOfWeek: number; // 0 = Sun
  powerDaysCount: number;
  cautionDaysCount: number;
  balancedDaysCount: number;
  festivalsCount: number;
  days: PanchangDayData[];
}

// -------------------------------------------------------------
// Constants & Lookups
// -------------------------------------------------------------
export const NAKSHATRAS_DATA = [
  { name: 'Ashwini', nameHi: 'अश्विनी', lord: 'Ketu', deity: 'Ashwini Kumaras', symbol: 'Horse Head' },
  { name: 'Bharani', nameHi: 'भरणी', lord: 'Venus', deity: 'Yama', symbol: 'Yoni' },
  { name: 'Krittika', nameHi: 'कृत्तिका', lord: 'Sun', deity: 'Agni', symbol: 'Flame / Razor' },
  { name: 'Rohini', nameHi: 'रोहिणी', lord: 'Moon', deity: 'Brahma', symbol: 'Chariot' },
  { name: 'Mrigashira', nameHi: 'मृगशिरा', lord: 'Mars', deity: 'Soma', symbol: 'Deer Head' },
  { name: 'Ardra', nameHi: 'आर्द्रा', lord: 'Rahu', deity: 'Rudra', symbol: 'Teardrop' },
  { name: 'Punarvasu', nameHi: 'पुनर्वसु', lord: 'Jupiter', deity: 'Aditi', symbol: 'Bow & Quiver' },
  { name: 'Pushya', nameHi: 'पुष्य', lord: 'Saturn', deity: 'Brihaspati', symbol: 'Lotus / Flower' },
  { name: 'Ashlesha', nameHi: 'आश्लेषा', lord: 'Mercury', deity: 'Sarpas', symbol: 'Coiled Serpent' },
  { name: 'Magha', nameHi: 'मघा', lord: 'Ketu', deity: 'Pitris', symbol: 'Royal Throne' },
  { name: 'Purva Phalguni', nameHi: 'पूर्वाफाल्गुनी', lord: 'Venus', deity: 'Bhaga', symbol: 'Front Bed Legs' },
  { name: 'Uttara Phalguni', nameHi: 'उत्तराफाल्गुनी', lord: 'Sun', deity: 'Aryaman', symbol: 'Back Bed Legs' },
  { name: 'Hasta', nameHi: 'हस्त', lord: 'Moon', deity: 'Savitr', symbol: 'Open Palm' },
  { name: 'Chitra', nameHi: 'चित्रा', lord: 'Mars', deity: 'Tvashtar', symbol: 'Shining Gem' },
  { name: 'Swati', nameHi: 'स्वाती', lord: 'Rahu', deity: 'Vayu', symbol: 'Coral / Sprout' },
  { name: 'Vishakha', nameHi: 'विशाखा', lord: 'Jupiter', deity: 'Indragni', symbol: 'Triumphal Arch' },
  { name: 'Anuradha', nameHi: 'अनुराधा', lord: 'Saturn', deity: 'Mitra', symbol: 'Lotus Staff' },
  { name: 'Jyeshtha', nameHi: 'ज्येष्ठा', lord: 'Mercury', deity: 'Indra', symbol: 'Circular Earring' },
  { name: 'Mula', nameHi: 'मूल', lord: 'Ketu', deity: 'Nirriti', symbol: 'Tied Roots' },
  { name: 'Purva Ashadha', nameHi: 'पूर्वाषाढ़ा', lord: 'Venus', deity: 'Apas', symbol: 'Elephant Tusk' },
  { name: 'Uttara Ashadha', nameHi: 'उत्तराषाढ़ा', lord: 'Sun', deity: 'Vishwadevas', symbol: 'Small Bed' },
  { name: 'Shravana', nameHi: 'श्रवण', lord: 'Moon', deity: 'Vishnu', symbol: 'Three Footprints' },
  { name: 'Dhanishta', nameHi: 'धनिष्ठा', lord: 'Mars', deity: 'Eight Vasus', symbol: 'Musical Drum' },
  { name: 'Shatabhisha', nameHi: 'शतभिषा', lord: 'Rahu', deity: 'Varuna', symbol: '100 Physicians' },
  { name: 'Purva Bhadrapada', nameHi: 'पूर्वभाद्रपद', lord: 'Jupiter', deity: 'Aja Ekapada', symbol: 'Sword' },
  { name: 'Uttara Bhadrapada', nameHi: 'उत्तरभाद्रपद', lord: 'Saturn', deity: 'Ahirbudhnya', symbol: 'Twin Water Dragon' },
  { name: 'Revati', nameHi: 'रेवती', lord: 'Mercury', deity: 'Pushan', symbol: 'Pair of Fish' }
];

export const TITHIS_DATA = [
  { name: 'Pratipada', nameHi: 'प्रतिपदा', meaning: 'New Beginnings & Foundation' },
  { name: 'Dwitiya', nameHi: 'द्वितीया', meaning: 'Partnership & Collaboration' },
  { name: 'Tritiya', nameHi: 'तृतीया', meaning: 'Action & Dynamic Expression' },
  { name: 'Chaturthi', nameHi: 'चतुर्थी', meaning: 'Overcoming Obstacles (Ganesha)' },
  { name: 'Panchami', nameHi: 'पञ्चमी', meaning: 'Wisdom, Education & Learning' },
  { name: 'Shashthi', nameHi: 'षष्ठी', meaning: 'Victory & Health (Kartikeya)' },
  { name: 'Saptami', nameHi: 'सप्तमी', meaning: 'Vitality & Solar Progress' },
  { name: 'Ashtami', nameHi: 'अष्टमी', meaning: 'Inner Strength & Protection (Durga)' },
  { name: 'Navami', nameHi: 'नवमी', meaning: 'Completion & Righteousness (Rama)' },
  { name: 'Dashami', nameHi: 'दशमी', meaning: 'Success & Ultimate Triumph' },
  { name: 'Ekadashi', nameHi: 'एकादशी', meaning: 'Spiritual Fasting & Purification' },
  { name: 'Dwadashi', nameHi: 'द्वादशी', meaning: 'Charity & Holy Service' },
  { name: 'Trayodashi', nameHi: 'त्रयोदशी', meaning: 'Destruction of Negativity (Pradosham)' },
  { name: 'Chaturdashi', nameHi: 'चतुर्दशी', meaning: 'Deep Meditation & Dissolution (Shiva)' },
  { name: 'Purnima', nameHi: 'पूर्णिमा', meaning: 'Full Spiritual Illumination & Fulfillment' },
  // Krishna Paksha 16-30
  { name: 'Pratipada', nameHi: 'प्रतिपदा', meaning: 'Inward Reflection & Grounding' },
  { name: 'Dwitiya', nameHi: 'द्वितीया', meaning: 'Coordination & Stability' },
  { name: 'Tritiya', nameHi: 'तृतीया', meaning: 'Courage & Steadfast Endeavor' },
  { name: 'Chaturthi', nameHi: 'सकष्ट चतुर्थी', meaning: 'Sankashti Ganesha Vrat' },
  { name: 'Panchami', nameHi: 'पञ्चमी', meaning: 'Wisdom & Healing' },
  { name: 'Shashthi', nameHi: 'षष्ठी', meaning: 'Discipline & Immunity' },
  { name: 'Saptami', nameHi: 'सप्तमी', meaning: 'Clarity & Self-Reliance' },
  { name: 'Ashtami', nameHi: 'कालाष्टमी', meaning: 'Kala Bhairava & Deep Purification' },
  { name: 'Navami', nameHi: 'नवमी', meaning: 'Introspection & Resolve' },
  { name: 'Dashami', nameHi: 'दशमी', meaning: 'Virtuous Deeds & Harmony' },
  { name: 'Ekadashi', nameHi: 'एकादशी', meaning: 'Ekadashi Vrat & Cleansing' },
  { name: 'Dwadashi', nameHi: 'द्वादशी', meaning: 'Parana & Generosity' },
  { name: 'Trayodashi', nameHi: 'मासिक शिवरात्रि', meaning: 'Pradosha Vrat & Shivarchana' },
  { name: 'Chaturdashi', nameHi: 'शिव चतुर्दशी', meaning: 'Inner Stillness & Transcendence' },
  { name: 'Amavasya', nameHi: 'अमावस्या', meaning: 'Pitru Tarpana & Cosmic Renewal' }
];

export const YOGAS_DATA = [
  { name: 'Vishkambha', nameHi: 'विष्कम्भ', quality: 'Inauspicious', qualityHi: 'अशुभ' },
  { name: 'Priti', nameHi: 'प्रीति', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Ayushman', nameHi: 'आयुष्मान्', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Saubhagya', nameHi: 'सौभाग्य', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Shobhana', nameHi: 'शोभन', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Atiganda', nameHi: 'अतिगण्ड', quality: 'Inauspicious', qualityHi: 'अशुभ' },
  { name: 'Sukarma', nameHi: 'सुकर्मा', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Dhriti', nameHi: 'धृति', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Shoola', nameHi: 'शूल', quality: 'Inauspicious', qualityHi: 'अशुभ' },
  { name: 'Ganda', nameHi: 'गण्ड', quality: 'Inauspicious', qualityHi: 'अशुभ' },
  { name: 'Vriddhi', nameHi: 'वृद्धि', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Dhruva', nameHi: 'ध्रुव', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Vyaghata', nameHi: 'व्याघात', quality: 'Inauspicious', qualityHi: 'अशुभ' },
  { name: 'Harshana', nameHi: 'हर्षण', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Vajra', nameHi: 'वज्र', quality: 'Inauspicious', qualityHi: 'अशुभ' },
  { name: 'Siddhi', nameHi: 'सिद्धि', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Vyatipata', nameHi: 'व्यतीपात', quality: 'Inauspicious', qualityHi: 'अति अशुभ' },
  { name: 'Variyana', nameHi: 'वरीयान्', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Parigha', nameHi: 'परिघ', quality: 'Inauspicious', qualityHi: 'अशुभ' },
  { name: 'Shiva', nameHi: 'शिव', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Siddha', nameHi: 'सिद्ध', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Sadhya', nameHi: 'साध्य', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Shubha', nameHi: 'शुभ', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Shukla', nameHi: 'शुक्ल', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Brahma', nameHi: 'ब्रह्म', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Indra', nameHi: 'इन्द्र', quality: 'Auspicious', qualityHi: 'शुभ' },
  { name: 'Vaidhriti', nameHi: 'वैधृति', quality: 'Inauspicious', qualityHi: 'अति अशुभ' }
] as const;

export const KARANAS_MAP: Record<string, { nameHi: string; typeHi: string }> = {
  'Kintughna': { nameHi: 'किस्तुघ्न', typeHi: 'स्थिर' },
  'Shakuni': { nameHi: 'शकुनि', typeHi: 'स्थिर' },
  'Chatushpada': { nameHi: 'चतुष्पाद', typeHi: 'स्थिर' },
  'Naga': { nameHi: 'नाग', typeHi: 'स्थिर' },
  'Bava': { nameHi: 'बव', typeHi: 'चर' },
  'Balava': { nameHi: 'बालव', typeHi: 'चर' },
  'Kaulava': { nameHi: 'कौलव', typeHi: 'चर' },
  'Taitila': { nameHi: 'तैतिल', typeHi: 'चर' },
  'Gara': { nameHi: 'गर', typeHi: 'चर' },
  'Vanija': { nameHi: 'वणिज', typeHi: 'चर' },
  'Vishti (Bhadra)': { nameHi: 'विष्टि (भद्रा)', typeHi: 'चर (अशुभ)' }
};

export const VARAS_DATA = [
  { name: 'Sunday', nameHi: 'रविवार', planet: 'Sun (Surya)', planetHi: 'सूर्य देव', color: 'Orange / Gold', quality: 'Leadership, Royal Will & Vitality', qualityHi: 'आत्मबल, नेतृत्व एवं तेजस्विता' },
  { name: 'Monday', nameHi: 'सोमवार', planet: 'Moon (Chandra)', planetHi: 'चन्द्र देव', color: 'White / Silver', quality: 'Emotions, Mind & Spiritual Devotion', qualityHi: 'मन की शान्ति, भावना एवं भक्ति' },
  { name: 'Tuesday', nameHi: 'मंगलवार', planet: 'Mars (Mangala)', planetHi: 'मंगल देव', color: 'Crimson / Red', quality: 'Courage, Property & Energetic Deeds', qualityHi: 'साहस, पराक्रम एवं भूमि सम्बन्धी कार्य' },
  { name: 'Wednesday', nameHi: 'बुधवार', planet: 'Mercury (Budha)', planetHi: 'बुध देव', color: 'Emerald Green', quality: 'Trade, Commerce, Writing & Intellect', qualityHi: 'व्यापार, संवाद, लेखन एवं बुद्धि' },
  { name: 'Thursday', nameHi: 'गुरुवार', planet: 'Jupiter (Brihaspati)', planetHi: 'बृहस्पति देव', color: 'Golden Yellow', quality: 'Wisdom, Dharma, Teaching & Auspicious Expansion', qualityHi: 'ज्ञान, धर्म, शिक्षण एवं मांगलिक कार्य' },
  { name: 'Friday', nameHi: 'शुक्रवार', planet: 'Venus (Shukra)', planetHi: 'शुक्र देव', color: 'Pastel / Silk White', quality: 'Arts, Beauty, Harmony & Prosperity', qualityHi: 'कला, सौन्दर्य, भौतिक सुख एवं समृद्धि' },
  { name: 'Saturday', nameHi: 'शनिवार', planet: 'Saturn (Shani)', planetHi: 'शनि देव', color: 'Navy / Charcoal', quality: 'Discipline, Long-term Focus & Karma', qualityHi: 'धैर्य, अनुशासन, न्याय एवं कर्म साधना' }
];

export const TARA_BALA_MAP: Record<number, { 
  name: string; 
  nameHi: string; 
  status: 'POWER' | 'CAUTION' | 'NEUTRAL'; 
  desc: string; 
  descHi: string; 
  advice: string; 
  adviceHi: string;
}> = {
  1: { 
    name: 'Janma (जन्म)', 
    nameHi: 'जन्म तारा', 
    status: 'NEUTRAL', 
    desc: 'Mind & Body active. Introspective reflection required.', 
    descHi: 'तनु एवं मन सक्रिय। आत्म-मंथन व नित्य साधना श्रेयस्कर।',
    advice: 'Focus on personal wellness, routine duties, and meditation.',
    adviceHi: 'व्यक्तिगत स्वास्थ्य, नित्य कर्म व ध्यान पर ध्यान दें।'
  },
  2: { 
    name: 'Sampat (सम्पत्)', 
    nameHi: 'सम्पत् तारा', 
    status: 'POWER', 
    desc: 'Wealth, financial gains, and material prosperity. 🌟 POWER DAY', 
    descHi: 'धन, आर्थिक लाभ व भौतिक समृद्धि। 🌟 शुभ ऊर्जा दिवस',
    advice: 'Ideal for major investments, business agreements, purchases, and negotiations.',
    adviceHi: 'निवेश, व्यापारिक समझौते, क्रय व वित्तीय चर्चा हेतु सर्वोत्तम।'
  },
  3: { 
    name: 'Vipat (विपत्)', 
    nameHi: 'विपत् तारा', 
    status: 'CAUTION', 
    desc: 'Obstacles, frictions, and sudden delays. ⚠ CAUTION DAY', 
    descHi: 'अवरोध, संघर्ष व अप्रत्याशित विलम्ब। ⚠️ सावधानी दिवस',
    advice: 'Avoid conflicts, speculative risks, and starting critical new ventures today.',
    adviceHi: 'विवाद, जोखिम व नए बड़े कार्य प्रारम्भ करने से बचें।'
  },
  4: { 
    name: 'Kshema (क्षेम)', 
    nameHi: 'क्षेम तारा', 
    status: 'POWER', 
    desc: 'Well-being, security, comfort, and protection. 🌟 POWER DAY', 
    descHi: 'कल्याण, सुरक्षा, सुख व दैवीय संरक्षण। 🌟 शुभ ऊर्जा दिवस',
    advice: 'Excellent for family celebrations, health treatments, travel, and auspicious tasks.',
    adviceHi: 'पारिवारिक उत्सव, स्वास्थ्योपचार, यात्रा व मांगलिक कार्य हेतु श्रेष्ठ।'
  },
  5: { 
    name: 'Pratyak (प्रत्यक्)', 
    nameHi: 'प्रत्यक् तारा', 
    status: 'CAUTION', 
    desc: 'Resistance, opposition, and roadblocks. ⚠ CAUTION DAY', 
    descHi: 'बाधा, विरोध व अड़चनें। ⚠️ सावधानी दिवस',
    advice: 'Maintain diplomacy, postpone argumentative meetings, and verify documents twice.',
    adviceHi: 'कूटनीति बरतें, महत्वपूर्ण बैठकें टालें और कागजात दो बार जांचें।'
  },
  6: { 
    name: 'Sadhana (साधना)', 
    nameHi: 'साधना तारा', 
    status: 'POWER', 
    desc: 'Achievement, fulfillment of goals, and success. 🌟 POWER DAY', 
    descHi: 'सिद्धि, अभीष्ट कार्यपूर्ति व सफलता। 🌟 शुभ ऊर्जा दिवस',
    advice: 'Peak execution day! Launch products, initiate projects, and close deals.',
    adviceHi: 'सर्वोच्च कर्म दिवस! नए प्रोजेक्ट, उत्पाद प्रारम्भ व सौदे सम्पन्न करें।'
  },
  7: { 
    name: 'Naidhana (निधन/वध)', 
    nameHi: 'निधन/वध तारा', 
    status: 'CAUTION', 
    desc: 'High energetic vulnerability & loss risk. ⚠ CAUTION DAY', 
    descHi: 'उच्च ऊर्जा भेद्यता व हानि सम्भावना। ⚠️ सावधानी दिवस',
    advice: 'Avoid surgery, high-speed travel, loans, and stressful confrontations.',
    adviceHi: 'शल्यकर्म, तीव्र यात्रा, ऋण लेन-देन व तनावपूर्ण विवादों से बचें।'
  },
  8: { 
    name: 'Mitra (मित्र)', 
    nameHi: 'मित्र तारा', 
    status: 'POWER', 
    desc: 'Friendship, social harmony, and beneficial alliance. 🌟 POWER DAY', 
    descHi: 'मित्रता, सामाजिक सौहार्द व लाभकारी सहयोग। 🌟 शुभ ऊर्जा दिवस',
    advice: 'Favorable for networking, partnerships, romance, and collaboration.',
    adviceHi: 'नेटवर्किंग, साझेदारी, प्रेम व सहयोगात्मक कार्यों हेतु अनुकूल।'
  },
  9: { 
    name: 'Parama Mitra (परम मित्र)', 
    nameHi: 'परम मित्र तारा', 
    status: 'POWER', 
    desc: 'Supreme alliance, divine grace, and highest luck. 🌟 POWER DAY', 
    descHi: 'सर्वोत्तम मित्र, भाग्योदय व दैवीय अनुग्रह। 🌟 शुभ ऊर्जा दिवस',
    advice: 'Golden window for spiritual initiations, VIP meetings, and visionary milestones.',
    adviceHi: 'आध्यात्मिक दीक्षा, विशिष्ट जन-संवाद व दूरगामी निर्णयों की स्वर्णिम बेला।'
  }
};

export const LUNAR_MONTHS = [
  { en: 'Chaitra', hi: 'चैत्र' },
  { en: 'Vaishakha', hi: 'वैशाख' },
  { en: 'Jyeshtha', hi: 'ज्येष्ठ' },
  { en: 'Ashadha', hi: 'आषाढ़' },
  { en: 'Shravana', hi: 'श्रावण' },
  { en: 'Bhadrapada', hi: 'भाद्रपद' },
  { en: 'Ashwin', hi: 'आश्विन' },
  { en: 'Kartika', hi: 'कार्तिक' },
  { en: 'Margashirsha', hi: 'मार्गशीर्ष' },
  { en: 'Pausha', hi: 'पौष' },
  { en: 'Magha', hi: 'माघ' },
  { en: 'Phalguna', hi: 'फाल्गुन' }
];

// -------------------------------------------------------------
// Astronomy Helpers (Lahiri Sidereal Longitudes)
// -------------------------------------------------------------
function normalizeAngle(a: number): number {
  return ((a % 360) + 360) % 360;
}

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

function toJulianDay(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

function getLahiriAyanamsha(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  return 23.856 + 1.396 * t;
}

function getSunLon(t: number): number {
  const L0 = 280.46646 + 36000.76983 * t;
  const M = degToRad(normalizeAngle(357.52911 + 35999.05029 * t));
  return normalizeAngle(L0 + (1.914602 - 0.004817 * t) * Math.sin(M));
}

function getMoonLon(t: number): number {
  const L1 = 218.3165 + 481267.8813 * t;
  const Mp = degToRad(normalizeAngle(134.9634 + 477198.8676 * t));
  const D = degToRad(normalizeAngle(297.8502 + 445267.1115 * t));
  return normalizeAngle(L1 + 6.2886 * Math.sin(Mp) + 1.274 * Math.sin(2 * D - Mp));
}

function formatHour(h: number): string {
  const normalizedH = ((h % 24) + 24) % 24;
  const hh = Math.floor(normalizedH);
  const mm = Math.floor((normalizedH - hh) * 60);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const displayH = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(displayH).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
}

// -------------------------------------------------------------
// Dynamic Festival & Vrat Resolver
// -------------------------------------------------------------
export function resolveFestivals(
  date: Date,
  tithiIdx: number,
  sunSid: number,
  lunarMonthIndex: number
): Array<{ name: string; nameHi: string; type: 'Major Festival' | 'Vrat' | 'Jayanti' | 'Panchang Event'; isImportant: boolean }> {
  const list: Array<{ name: string; nameHi: string; type: 'Major Festival' | 'Vrat' | 'Jayanti' | 'Panchang Event'; isImportant: boolean }> = [];
  
  const isShukla = tithiIdx < 15;
  const tithiInPaksha = (tithiIdx % 15) + 1; // 1 to 15
  const isPurnima = tithiIdx === 14;
  const isAmavasya = tithiIdx === 29;
  
  // Universal Vrats
  if (tithiInPaksha === 11) {
    list.push({ name: isShukla ? 'Shukla Ekadashi Vrat' : 'Krishna Ekadashi Vrat', nameHi: 'एकादशी व्रत', type: 'Vrat', isImportant: true });
  }
  if (tithiInPaksha === 13) {
    list.push({ name: 'Pradosha Vrat', nameHi: 'प्रदोष व्रत', type: 'Vrat', isImportant: false });
  }
  if (isPurnima) {
    list.push({ name: 'Purnima Vrat / Satyanarayan Puja', nameHi: 'पूर्णिमा व्रत', type: 'Panchang Event', isImportant: true });
  }
  if (isAmavasya) {
    list.push({ name: 'Amavasya / Pitru Tarpana', nameHi: 'अमावस्या', type: 'Panchang Event', isImportant: true });
  }
  if (tithiInPaksha === 4) {
    if (isShukla) {
      list.push({ name: 'Vinayaka Chaturthi', nameHi: 'विनायक चतुर्थी', type: 'Vrat', isImportant: false });
    } else {
      list.push({ name: 'Sankashti Chaturthi', nameHi: 'संकष्टी चतुर्थी', type: 'Vrat', isImportant: false });
    }
  }
  
  // Specific Month Festivals (based on Lunar Month + Tithi)
  const lMonth = (lunarMonthIndex + 12) % 12;
  
  // Shravana (Month index 4)
  if (lMonth === 4) {
    if (isShukla && tithiInPaksha === 5) list.push({ name: 'Nag Panchami', nameHi: 'नाग पञ्चमी', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 15) list.push({ name: 'Raksha Bandhan / Shravani Upakarma', nameHi: 'रक्षा बन्धन', type: 'Major Festival', isImportant: true });
    if (!isShukla && tithiInPaksha === 8) list.push({ name: 'Krishna Janmashtami (Smarta)', nameHi: 'श्रीकृष्ण जन्माष्टमी', type: 'Major Festival', isImportant: true });
  }
  
  // Bhadrapada (Month index 5)
  if (lMonth === 5) {
    if (!isShukla && tithiInPaksha === 8) list.push({ name: 'Krishna Janmashtami', nameHi: 'श्रीकृष्ण जन्माष्टमी', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 4) list.push({ name: 'Ganesh Chaturthi (Ganeshotsav)', nameHi: 'गणेश चतुर्थी', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 14) list.push({ name: 'Anant Chaturdashi', nameHi: 'अनन्त चतुर्दशी', type: 'Major Festival', isImportant: true });
  }
  
  // Ashwin (Month index 6)
  if (lMonth === 6) {
    if (isShukla && tithiInPaksha === 1) list.push({ name: 'Sharad Navaratri Ghatasthapana', nameHi: 'नवरात्रि घटस्थापना', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 8) list.push({ name: 'Maha Ashtami / Durga Ashtami', nameHi: 'महाष्टमी', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 9) list.push({ name: 'Maha Navami / Ayudha Puja', nameHi: 'महानवमी', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 10) list.push({ name: 'Vijayadashami / Dussehra', nameHi: 'विजयादशमी (दशहरा)', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 15) list.push({ name: 'Sharad Purnima / Kojagari', nameHi: 'शरद पूर्णिमा', type: 'Major Festival', isImportant: true });
  }
  
  // Kartika (Month index 7)
  if (lMonth === 7) {
    if (!isShukla && tithiInPaksha === 4) list.push({ name: 'Karwa Chauth Vrat', nameHi: 'करवा चौथ', type: 'Vrat', isImportant: true });
    if (!isShukla && tithiInPaksha === 13) list.push({ name: 'Dhanteras / Dhanvantari Jayanti', nameHi: 'धनतेरस', type: 'Major Festival', isImportant: true });
    if (!isShukla && tithiInPaksha === 14) list.push({ name: 'Narak Chaturdashi / Chhoti Diwali', nameHi: 'नरक चतुर्दशी', type: 'Major Festival', isImportant: true });
    if (isAmavasya) list.push({ name: 'Diwali / Lakshmi Puja', nameHi: 'दीपावली (लक्ष्मी पूजा)', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 1) list.push({ name: 'Govardhan Puja / Annakoot', nameHi: 'गोवर्धन पूजा', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 2) list.push({ name: 'Bhai Dooj / Yama Dwitiya', nameHi: 'भाई दूज', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 6) list.push({ name: 'Chhath Puja (Sandhya Arghya)', nameHi: 'छठ पूजा', type: 'Major Festival', isImportant: true });
    if (isPurnima) list.push({ name: 'Kartika Purnima / Dev Deepawali', nameHi: 'देव दीपावली', type: 'Major Festival', isImportant: true });
  }
  
  // Magha & Phalguna
  if (lMonth === 10 && isShukla && tithiInPaksha === 5) {
    list.push({ name: 'Vasant Panchami / Saraswati Puja', nameHi: 'बसंत पञ्चमी', type: 'Major Festival', isImportant: true });
  }
  if (lMonth === 11) {
    if (!isShukla && tithiInPaksha === 14) list.push({ name: 'Maha Shivaratri', nameHi: 'महाशिवरात्रि', type: 'Major Festival', isImportant: true });
    if (isPurnima) list.push({ name: 'Holika Dahan / Holi', nameHi: 'होली / होलिका दहन', type: 'Major Festival', isImportant: true });
  }
  
  // Chaitra (Month index 0)
  if (lMonth === 0) {
    if (isShukla && tithiInPaksha === 1) list.push({ name: 'Chaitra Navaratri / Hindu New Year', nameHi: 'नववर्ष / चैत्र नवरात्रि', type: 'Major Festival', isImportant: true });
    if (isShukla && tithiInPaksha === 9) list.push({ name: 'Shri Ram Navami', nameHi: 'श्रीरामनवमी', type: 'Major Festival', isImportant: true });
    if (isPurnima) list.push({ name: 'Hanuman Jayanti', nameHi: 'हनुमान जयन्ती', type: 'Major Festival', isImportant: true });
  }
  
  return list;
}

// -------------------------------------------------------------
// Core Month Solver
// -------------------------------------------------------------
export function calculateMonthPanchang(
  year: number,
  month: number, // 0-indexed (0 = Jan, 7 = Aug)
  lat = 25.5941,
  lng = 85.1376,
  tz = 5.5,
  profile?: { birthNakshatraIndex?: number | null; birthRasiIndex?: number | null } | null
): MonthPanchangOverview {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  
  const days: PanchangDayData[] = [];
  let powerDaysCount = 0;
  let cautionDaysCount = 0;
  let balancedDaysCount = 0;
  let festivalsCount = 0;
  
  // Rahu Kaal relative fraction tables
  const RAHU_KALA_TABLE = [
    { start: 0.875, end: 1.0 },   // Sun (4:30 - 6:00 PM approx)
    { start: 0.125, end: 0.25 },  // Mon (7:30 - 9:00 AM approx)
    { start: 0.75,  end: 0.875 }, // Tue (3:00 - 4:30 PM approx)
    { start: 0.5,   end: 0.625 }, // Wed (12:00 - 1:30 PM approx)
    { start: 0.375, end: 0.5 },   // Thu (1:30 - 3:00 PM approx)
    { start: 0.25,  end: 0.375 }, // Fri (10:30 - 12:00 PM approx)
    { start: 0.625, end: 0.75 }   // Sat (9:00 - 10:30 AM approx)
  ];
  
  const YAMAGANDA_TABLE = [
    { start: 0.5, end: 0.625 },   // Sun
    { start: 0.375, end: 0.5 },   // Mon
    { start: 0.25, end: 0.375 },  // Tue
    { start: 0.125, end: 0.25 },  // Wed
    { start: 0.0, end: 0.125 },   // Thu
    { start: 0.625, end: 0.75 },  // Fri
    { start: 0.75, end: 0.875 }   // Sat
  ];

  for (let d = 1; d <= daysInMonth; d++) {
    // Exact noon reference point for stable day evaluation
    const dateObj = new Date(year, month, d, 12, 0, 0);
    const dayOfWeek = dateObj.getDay();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    const jd = toJulianDay(dateObj);
    const t = (jd - 2451545.0) / 36525;
    const ayanamsha = getLahiriAyanamsha(jd);
    
    const sunTrop = getSunLon(t);
    const moonTrop = getMoonLon(t);
    
    const sunSid = normalizeAngle(sunTrop - ayanamsha);
    const moonSid = normalizeAngle(moonTrop - ayanamsha);
    
    // Tithi
    const elongation = normalizeAngle(moonSid - sunSid);
    const tithiIdx = Math.floor(elongation / 12);
    const paksha = tithiIdx < 15 ? 'Shukla Paksha' : 'Krishna Paksha';
    const tithiData = TITHIS_DATA[tithiIdx % 30];
    
    // Nakshatra
    const nakIdx = Math.floor(moonSid / 13.333333333333334);
    const nakData = NAKSHATRAS_DATA[nakIdx % 27];
    const pada = Math.floor((moonSid % 13.333333333333334) / 3.3333333333333335) + 1;
    const moonRasiIdx = Math.floor(moonSid / 30);
    
    // Yoga
    const yogaSum = normalizeAngle(sunSid + moonSid);
    const yogaIdx = Math.floor(yogaSum / 13.333333333333334);
    const yogaData = YOGAS_DATA[yogaIdx % 27];
    
    // Karana
    const karanaIdx = Math.floor(elongation / 6);
    let karanaName = '';
    let karanaType: 'Movable' | 'Fixed' = 'Movable';
    if (karanaIdx === 0) {
      karanaName = 'Kintughna';
      karanaType = 'Fixed';
    } else if (karanaIdx >= 57) {
      const fixedKaranas = ['Shakuni', 'Chatushpada', 'Naga'];
      karanaName = fixedKaranas[karanaIdx - 57] || 'Naga';
      karanaType = 'Fixed';
    } else {
      const movableList = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti (Bhadra)'];
      karanaName = movableList[(karanaIdx - 1) % 7];
    }
    
    // Vara
    const varaData = VARAS_DATA[dayOfWeek];
    
    // Sunrise & Sunset (Standardized model adjusted for coordinates)
    const sunriseH = 5.75 + (lat - 20) * 0.01;
    const sunsetH = 18.25 - (lat - 20) * 0.01;
    const dayDuration = sunsetH - sunriseH;
    
    // Rahu Kaal & Yamaganda
    const rInfo = RAHU_KALA_TABLE[dayOfWeek];
    const rahuStart = sunriseH + dayDuration * rInfo.start;
    const rahuEnd = sunriseH + dayDuration * rInfo.end;
    
    const yInfo = YAMAGANDA_TABLE[dayOfWeek];
    const yamaStart = sunriseH + dayDuration * yInfo.start;
    const yamaEnd = sunriseH + dayDuration * yInfo.end;
    
    const gulikaStart = sunriseH + dayDuration * ((dayOfWeek * 0.125 + 0.5) % 1.0);
    const gulikaEnd = gulikaStart + dayDuration * 0.125;
    
    // Abhijit Muhurat (midpoint between sunrise & sunset, excluded on Wednesday)
    const midday = (sunriseH + sunsetH) / 2;
    const abhijit = dayOfWeek === 3 ? null : {
      start: formatHour(midday - 0.4),
      end: formatHour(midday + 0.4)
    };
    
    // Moon Phase calculation
    const phaseFraction = elongation / 360;
    let moonIcon: '🌕' | '🌑' | '🌓' | '🌘' | '🌔' | '🌒' = '🌓';
    let phaseName = 'Waxing Moon';
    if (tithiIdx === 14) {
      moonIcon = '🌕';
      phaseName = 'Full Moon (Purnima)';
    } else if (tithiIdx === 29) {
      moonIcon = '🌑';
      phaseName = 'New Moon (Amavasya)';
    } else if (phaseFraction < 0.25) {
      moonIcon = '🌒';
      phaseName = 'Waxing Crescent';
    } else if (phaseFraction < 0.5) {
      moonIcon = '🌔';
      phaseName = 'Waxing Gibbous';
    } else if (phaseFraction < 0.75) {
      moonIcon = '🌘';
      phaseName = 'Waning Gibbous';
    } else {
      moonIcon = '🌘';
      phaseName = 'Waning Crescent';
    }
    
    // Lunar Month index (approx based on Sun Sidereal sign)
    const sunRasi = Math.floor(sunSid / 30);
    const lunarMonthIdx = (sunRasi + 11) % 12;
    
    // Festivals
    const festivals = resolveFestivals(dateObj, tithiIdx, sunSid, lunarMonthIdx);
    if (festivals.length > 0) festivalsCount += festivals.length;
    
    // Personal Energy Calculation (Tara Bala + Chandra Bala)
    let personalEnergy: PanchangDayData['personalEnergy'] = undefined;
    if (profile && profile.birthNakshatraIndex !== undefined && profile.birthNakshatraIndex !== null) {
      const count = ((nakIdx - profile.birthNakshatraIndex + 27) % 27) + 1;
      const taraNum = ((count - 1) % 9) + 1;
      const taraInfo = TARA_BALA_MAP[taraNum] || TARA_BALA_MAP[1];
      
      let chandraHouse: number | null = null;
      let chandraHouseDesc = '';
      let chandraHouseDescHi = '';
      if (profile.birthRasiIndex !== undefined && profile.birthRasiIndex !== null) {
        chandraHouse = ((moonRasiIdx - profile.birthRasiIndex + 12) % 12) + 1;
        if (chandraHouse === 8) {
          chandraHouseDesc = 'Ashtama Chandra (8th House) — Practice heightened caution.';
          chandraHouseDescHi = 'अष्टम चन्द्र गोचर — विशेष सावधानी एवं संयम बरतें।';
        } else if ([1, 3, 6, 7, 10, 11].includes(chandraHouse)) {
          chandraHouseDesc = `Favorable ${chandraHouse}th House Moon Transit.`;
          chandraHouseDescHi = `शुभ ${chandraHouse}वें भाव में चन्द्र गोचर।`;
        } else {
          chandraHouseDesc = `Neutral ${chandraHouse}th House Moon Transit.`;
          chandraHouseDescHi = `सामान्य ${chandraHouse}वें भाव में चन्द्र गोचर।`;
        }
      }
      
      const isPower = taraInfo.status === 'POWER' && chandraHouse !== 8;
      const isCaution = taraInfo.status === 'CAUTION' || chandraHouse === 8;
      
      let status: 'POWER' | 'CAUTION' | 'BALANCED' = 'BALANCED';
      let badgeLabel = '☽ BALANCED DAY';
      let badgeLabelHi = '☽ सन्तुलित ऊर्जा दिवस';
      let glowClass = 'border-slate-500/30';
      
      if (isPower) {
        status = 'POWER';
        badgeLabel = '🌟 POWER DAY';
        badgeLabelHi = '🌟 शुभ ऊर्जा दिवस';
        glowClass = 'border-amber-400/80 bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-1 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
        powerDaysCount++;
      } else if (isCaution) {
        status = 'CAUTION';
        badgeLabel = '⚠ CAUTION DAY';
        badgeLabelHi = '⚠️ सावधानी दिवस';
        glowClass = 'border-red-500/80 bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
        cautionDaysCount++;
      } else {
        balancedDaysCount++;
      }
      
      personalEnergy = {
        taraNum,
        taraName: taraInfo.name,
        taraNameHi: taraInfo.nameHi,
        taraStatus: taraInfo.status,
        taraDesc: taraInfo.desc,
        taraDescHi: taraInfo.descHi,
        chandraHouse,
        chandraHouseDesc,
        chandraHouseDescHi,
        status,
        badgeLabel,
        badgeLabelHi,
        glowClass,
        advice: taraInfo.advice,
        adviceHi: taraInfo.adviceHi
      };
    }
    
    const daySunRasi = Math.floor(sunSid / 30);
    const dayMasaIdx = (daySunRasi + 1) % 12;
    const dayMasaObj = LUNAR_MONTHS[dayMasaIdx];
    const karanaMeta = KARANAS_MAP[karanaName] || { nameHi: karanaName, typeHi: karanaType === 'Fixed' ? 'स्थिर' : 'चर' };

    days.push({
      dayNumber: d,
      dateString,
      dayOfWeek,
      dayName: varaData.name,
      dayNameHi: varaData.nameHi,
      varaPlanet: varaData.planet,
      varaColor: varaData.color,
      lunarMonth: dayMasaObj.en,
      lunarMonthHi: dayMasaObj.hi,
      tithi: {
        index: tithiIdx + 1,
        name: tithiData.name,
        nameHi: tithiData.nameHi,
        paksha,
        meaning: tithiData.meaning,
        isPurnima: tithiIdx === 14,
        isAmavasya: tithiIdx === 29
      },
      nakshatra: {
        index: nakIdx,
        name: nakData.name,
        nameHi: nakData.nameHi,
        pada,
        lord: nakData.lord,
        deity: nakData.deity,
        symbol: nakData.symbol
      },
      yoga: {
        index: yogaIdx,
        name: yogaData.name,
        nameHi: yogaData.nameHi,
        quality: yogaData.quality,
        qualityHi: yogaData.qualityHi
      },
      karana: {
        name: karanaName,
        nameHi: karanaMeta.nameHi,
        type: karanaType,
        typeHi: karanaMeta.typeHi
      },
      timings: {
        sunrise: formatHour(sunriseH),
        sunset: formatHour(sunsetH),
        moonrise: formatHour((sunriseH + 6 + (tithiIdx * 0.8)) % 24),
        moonset: formatHour((sunsetH + 6 + (tithiIdx * 0.8)) % 24),
        rahuKaal: { start: formatHour(rahuStart), end: formatHour(rahuEnd) },
        yamaganda: { start: formatHour(yamaStart), end: formatHour(yamaEnd) },
        gulikaKaal: { start: formatHour(gulikaStart), end: formatHour(gulikaEnd) },
        abhijitMuhurat: abhijit,
        brahmaMuhurat: { start: formatHour(sunriseH - 1.6), end: formatHour(sunriseH - 0.8) },
        amritKaal: { start: formatHour(sunriseH + 2.5), end: formatHour(sunriseH + 4.1) },
        vijayMuhurat: { start: formatHour(midday + 1.2), end: formatHour(midday + 2.0) }
      },
      moonPhase: {
        fraction: phaseFraction,
        phaseName,
        icon: moonIcon
      },
      festivals,
      personalEnergy
    });
  }
  
  // Month Meta
  const startJd = toJulianDay(new Date(year, month, 1));
  const startSunSid = normalizeAngle(getSunLon((startJd - 2451545.0) / 36525) - getLahiriAyanamsha(startJd));
  const startMasa = LUNAR_MONTHS[(Math.floor(startSunSid / 30) + 1) % 12];

  const endJd = toJulianDay(new Date(year, month, daysInMonth));
  const endSunSid = normalizeAngle(getSunLon((endJd - 2451545.0) / 36525) - getLahiriAyanamsha(endJd));
  const endMasa = LUNAR_MONTHS[(Math.floor(endSunSid / 30) + 1) % 12];

  const lunarMonth = startMasa.en === endMasa.en ? startMasa.en : `${startMasa.en} - ${endMasa.en}`;
  const lunarMonthHi = startMasa.hi === endMasa.hi ? startMasa.hi : `${startMasa.hi} - ${endMasa.hi}`;
  const vikramSamvat = year + 57;
  const shakaSamvat = year - 78;
  
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNamesHi = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
  
  // Seasonal Ritu
  const rituListEn = ['Shishira (Winter)', 'Vasanta (Spring)', 'Grishma (Summer)', 'Varsha (Monsoon)', 'Sharad (Autumn)', 'Hemanta (Pre-Winter)'];
  const rituListHi = ['शिशिर ऋतु (शीत)', 'वसन्त ऋतु (मधुमास)', 'ग्रीष्म ऋतु (उष्ण)', 'वर्षा ऋतु (मेघमाला)', 'शरद ऋतु (निर्मल)', 'हेमन्त ऋतु (शीतपूर्व)'];
  const rituIdx = Math.floor(month / 2) % 6;
  const ritu = rituListEn[rituIdx];
  const rituHi = rituListHi[rituIdx];

  const ayana = month < 6 ? 'Uttarayana (Northward Sun)' : 'Dakshinayana (Southward Sun)';
  const ayanaHi = month < 6 ? 'उत्तरायण (सूर्य की उत्तर यात्रा)' : 'दक्षिणायन (सूर्य की दक्षिण यात्रा)';
  
  return {
    year,
    month,
    monthName: monthNamesEn[month],
    monthNameHi: monthNamesHi[month],
    lunarMonth,
    lunarMonthHi,
    vikramSamvat,
    shakaSamvat,
    ritu,
    rituHi,
    ayana,
    ayanaHi,
    daysInMonth,
    firstDayOfWeek,
    powerDaysCount,
    cautionDaysCount,
    balancedDaysCount,
    festivalsCount,
    days
  };
}
