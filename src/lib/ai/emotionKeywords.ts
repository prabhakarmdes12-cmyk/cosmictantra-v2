/**
 * MULTILINGUAL EMOTION KEYWORD ENGINE (बहुभाषी भाव-संवेदन इंजन)
 * ------------------------------------------------------------------
 * Rule-based, fully self-contained (NO AI model required) keyword families
 * that let Kashi Sahayak identify the seeker's core problematic feeling in
 * ANY language — English, Devanagari, romanized Hindi / Hinglish, and common
 * spelling variants (e.g. "dar", "darr", "darta", "डर" → fear/anxiety).
 *
 * Two match styles are used by findScriptureInsight():
 *  - `tokens`  : single words matched on EXACT word boundaries (safe for short
 *                romanized words like "dar" — never a false hit inside
 *                "darshan", "dark", "garden", etc.)
 *  - `phrases` : multi-word phrases matched as substrings (e.g. "dar lag raha")
 *
 * Keys are ScriptureInsight ids from src/lib/ai/scriptureMap.ts.
 */

export interface EmotionKeywordFamily {
  tokens: string[];
  phrases: string[];
}

export const EMOTION_KEYWORD_MAP: Record<string, EmotionKeywordFamily> = {
  // ------------------------------------------------------------------
  // 1. SADNESS_GRIEF — उदासी / दुख / गम (sad, grief, crying, heaviness)
  // ------------------------------------------------------------------
  SADNESS_GRIEF: {
    tokens: [
      'udaas', 'udasi', 'udas', 'dukhi', 'dukh', 'dukhee', 'gum', 'gham',
      'mayus', 'nirash', 'nirasha', 'hatash', 'hataasha', 'udass', 'dukhiy',
      'roya', 'royi', 'rudan', 'vishad', 'khushi', 'udaasi',
    ],
    phrases: [
      'ro raha', 'ro rahi', 'ro rahe', 'rone ka man', 'rone ka mann',
      'tut gaya', 'tut gayi', 'toota hua', 'tooti hui',
      'haar gaya', 'haar gayi', 'haar man', 'haar maan',
      'mann udaas', 'man udaas', 'mann bhari', 'man bhari', 'dil bhari',
      'sad feel', 'feeling low', 'feel low', 'feel sad', 'low feel',
      'dukh hai', 'gum hai', 'gham hai', 'dukh me', 'gum me',
      'bahut dukh', 'zindagi se', 'life se', 'jine ka man', 'jine ka mann',
      'jeene ki ichha', 'aansu', 'aansoo', 'ansu', 'crying', 'cried',
      'kuch achha nahi', 'kuch accha nahi', 'sab kuch khatam',
    ],
  },

  // ------------------------------------------------------------------
  // 2. FUTURE_ANXIETY — डर / चिंता / भय / घबराहट (fear, worry, panic)
  // ------------------------------------------------------------------
  FUTURE_ANXIETY: {
    tokens: [
      'dar', 'darr', 'dara', 'darta', 'darti', 'darte', 'darrta', 'darrti',
      'darrte', 'drr', 'bhaya', 'bhiti', 'khauf', 'khof', 'bhay', 'tension',
      'tanav', 'tanao', 'fikr', 'fikar', 'chinta', 'ghabrahat', 'ghabrahut',
      'asvasth', 'asar', 'panic', 'afraid', 'scared', 'worried', 'fearful',
      'dread', 'phobia', 'ghabraya', 'ghabrayi', 'ghabra',
    ],
    phrases: [
      'dar lag', 'darr lag', 'dar se', 'darr se', 'dar hai', 'darr hai',
      'dara hua', 'dari hui', 'dar raha', 'darr raha', 'dar rahi', 'darr rahi',
      'bahut darta', 'bahut darti', 'bahut darr',
      'darta hu', 'darta hoon', 'darti hu', 'darti hoon', 'darte hain',
      'darr lagta', 'dar lagta', 'dar lagti', 'darr lagti',
      'afraid of', 'scared of', 'scared to', 'panic attack', 'anxiety attack',
      'dar ki wajah', 'darr ki wajah', 'khauf hai', 'khof hai', 'bhay hai',
      'डर लग', 'डर से', 'डरता', 'डरती', 'डर है', 'भय है',
      'kya hoga', 'kya hoga aage', 'hone wala', 'ho jayega', 'ho jaayega',
      'stress me', 'stress mein', 'tension me', 'tension mein', 'tanav me',
      'chinta ho', 'fikar ho', 'fikr ho', 'chinta hai', 'pareshan hu',
      'pareshan hoon', 'pareshaan', 'ghabra raha', 'ghabra rahi',
    ],
  },

  // ------------------------------------------------------------------
  // 3. CAREER_EFFORT — नौकरी / करियर / मेहनत / परीक्षा
  // ------------------------------------------------------------------
  CAREER_EFFORT: {
    tokens: [
      'naukri', 'kariyar', 'career', 'job', 'business', 'interview', 'exam',
      'promotion', 'salary', 'vetan', 'udyam', 'vyapar', 'padhai', 'kamaai',
      'kamai', 'placement', 'result', 'results', 'study', 'studies',
    ],
    phrases: [
      'naukri', 'kariyar', 'job', 'business', 'career', 'interview', 'exam',
      'promotion', 'salary', 'udyam', 'vyapar', 'padhai me', 'padhai mein',
      'padhna hai', 'padh raha', 'padh rahi', 'kamaai', 'kamai',
      'placement', 'offer letter', 'job nahi', 'naukri nahi', 'job mil',
      'naukri mil', 'job chahiye', 'naukri chahiye', 'interview me',
      'exam me', 'exam ki', 'pariksha', 'result ka', 'result ki',
    ],
  },

  // ------------------------------------------------------------------
  // 4. LOW_CONFIDENCE — हिम्मत / आत्मबल / असहायता
  // ------------------------------------------------------------------
  LOW_CONFIDENCE: {
    tokens: [
      'himmat', 'haunsla', 'hausla', 'himmatt', 'kamzor', 'kamzoor',
      'asahay', 'lachar', 'bewaas', 'hathas', 'hatash', 'naummid',
      'nayaas', 'dum', 'dilchhota',
    ],
    phrases: [
      'himmat nahi', 'haunsla nahi', 'hausla nahi', 'confidence nahi',
      'no confidence', 'lack of confidence', 'low confidence', 'not confident',
      'self esteem',
      'confident nahi', 'self confidence', 'self-confidence', 'dum nahi',
      'nahi ho payega', 'nahi kar paunga', 'nahi kar paungi',
      'nahi kar sakta', 'nahi kar sakti', 'na kar saka', 'na kar saki',
      'fail ho', 'fail ho gaya', 'fail ho gayi', 'failures', 'failed',
      'hara hua', 'hari hui', 'haar chuka', 'haar chuki',
      'can not do', 'cannot do', "can't do", 'cant do', 'not able',
      'no hope', 'give up', 'giving up', 'chhod dunga', 'chhod dungi',
      'mujhse nahi', 'mujh se nahi', 'weak hu', 'weak hoon',
      'kuch nahi aata', 'kuch nahi aata', 'kabhi nahi kar', 'kaam nahi',
    ],
  },

  // ------------------------------------------------------------------
  // 5. RELATIONSHIP_HEALING — प्यार / धोखा / रिश्ते / ब्रेकअप
  // ------------------------------------------------------------------
  RELATIONSHIP_HEALING: {
    tokens: [
      'dhokha', 'dhoka', 'bewafa', 'bewafai', 'judai', 'talaq', 'divorce',
      'rishta', 'rishta', 'shaadi', 'shadi', 'saathi', 'sathi', 'jodidar',
      'prem', 'premi', 'premika', 'jindagi', 'bandhan',
    ],
    phrases: [
      'dil toota', 'dil tuta', 'dil toot', 'dil tut', 'tut gaya dil',
      'pyaar nahi', 'pyar nahi', 'pyaar me', 'pyaar mein', 'pyar me',
      'pyar mein', 'pyaar ho', 'pyar ho', 'love fail', 'love failure',
      'breakup', 'break up', 'saath chhod', 'sath chhod', 'chhod diya',
      'chhod di', 'chhoda', 'chhodi', 'bewafai', 'dhokha', 'dhoka',
      'rooth gaya', 'ruth gaya', 'rooth gayi', 'ruth gayi',
      'nazar nahi', 'mil nahi raha', 'mil nahi rahi', 'rishta tut',
      'shaadi nahi', 'shadi nahi', 'shaadi ki baat', 'marriage',
      'betrayed', 'cheated', 'heartbreak', 'heart broken', 'broken heart',
      'pyaar me dhokha', 'pyar me dhoka', 'mohabbat', 'muhabbat',
    ],
  },

  // ------------------------------------------------------------------
  // 6. HEALTH_PROTECTION — बीमारी / दर्द / रोग / जीवन रक्षा
  // ------------------------------------------------------------------
  HEALTH_PROTECTION: {
    tokens: [
      'bimar', 'bemaar', 'bemar', 'rogi', 'bimari', 'bemari', 'dard',
      'taklif', 'takleef', 'ilaj', 'aspatal', 'haspatal', 'dawai', 'dava',
      'dawa', 'operation', 'cancer', 'tumor', 'mrityu', 'maut', 'roga',
      'vyadhi', 'rog', 'chot', 'surgery', 'doktar', 'doctor', 'pain',
      'aarthi', 'kasht', 'klesh',
    ],
    phrases: [
      'bimar hu', 'bimar hoon', 'bimar hai', 'taklif hai', 'takleef hai',
      'dard hai', 'dard ho', 'sehat', 'health', 'illness', 'disease',
      'sick', 'hospital', 'operation', 'cancer', 'tumor', 'dawai',
      'ilaj', 'swasthya', 'ayu', 'mrityu', 'maut', 'death', 'dying',
      'mar raha', 'mar rahi', 'mar jaaunga', 'mar jaaungi', 'bacha lo',
      'bachao', 'bacha le', 'rogi', 'bimari', 'bemari', 'body me',
      'shareer me', 'sharir me', 'sehat kharab', 'tabiyat', 'tabiat',
      'tandurusti', 'musibat', 'kasht', 'vyadhi',
    ],
  },

  // ------------------------------------------------------------------
  // 7. SPIRITUAL_SURRENDER — भगवान / शांति / भक्ति / मोक्ष
  // ------------------------------------------------------------------
  SPIRITUAL_SURRENDER: {
    tokens: [
      'bhagwan', 'bhagvan', 'bhagwaan', 'prabhu', 'ishwar', 'ishvar',
      'parmatma', 'parmeshwar', 'moksh', 'moksha', 'dhyan', 'sadhana',
      'aradhana', 'bhakti', 'sharan', 'aashirwad', 'ashirwad',
      'aashirvaad', 'kripa', 'daya', 'anugrah', 'bhajan', 'kirtan',
    ],
    phrases: [
      'bhagwan', 'bhagvaan', 'prabhu', 'ishwar', 'parmatma', 'parmeshwar',
      'moksh', 'dhyan', 'meditation', 'sadhana', 'aradhana', 'bhakti',
      'sharan', 'shanti chahiye', 'peace chahiye', 'peace of mind',
      'god', 'blessings', 'aashirwad', 'ashirwad', 'kripa', 'daya',
      'bhajan', 'kirtan', 'jaap', 'jap', 'mantra', 'prayer', 'prarthana',
      'aatma', 'atma', 'paramatma', 'sanyam', 'vairagya', 'tyag',
    ],
  },

  // ------------------------------------------------------------------
  // 8. FINANCIAL_STRESS — पैसा / कर्ज / तंगी / घाटा
  // ------------------------------------------------------------------
  FINANCIAL_STRESS: {
    tokens: [
      'paisa', 'paise', 'karcha', 'kharcha', 'karza', 'karj', 'rin',
      'garib', 'gareeb', 'garibi', 'gareebi', 'udhaar', 'udhar',
      'tangi', 'kanagali', 'kangali', 'ghata', 'nuksan', 'emi', 'loan',
      'debt', 'wealth', 'sampatti', 'dhan', 'lakshmi', 'bills',
    ],
    phrases: [
      'paise nahi', 'paise nhi', 'paisa nahi', 'paisa nhi', 'karza',
      'karj', 'udhaar', 'udhar', 'loan', 'emi', 'bill', 'bills',
      'kamai nahi', 'kamaai nahi', 'garibi', 'gareebi', 'tangi',
      'nuksan', 'ghata', 'loss', 'paise ki', 'dhan ki', 'chinta paise',
      'paise ka', 'money problem', 'financial', 'finance', 'debt me',
      'karz me', 'karza me', 'udhaar me', 'sampatti', 'dhan', 'aarthik',
      'arthik', 'paisa udhar', 'kangali', 'kanagali', 'pet paalna',
    ],
  },

  // ------------------------------------------------------------------
  // 9. ANGER_MANAGEMENT — गुस्सा / क्रोध / चिड़चिड़ापन
  // ------------------------------------------------------------------
  ANGER_MANAGEMENT: {
    tokens: [
      'gussa', 'gusse', 'krodh', 'krodha', 'aakrosh', 'chid', 'chidh',
      'naraz', 'narazgi', 'jhunjhala', 'junjhala', 'gusse', 'ghussa',
      'garmi', 'tund', 'ugra',
    ],
    phrases: [
      'gussa aa', 'gussa aata', 'gussa aati', 'gusse me', 'gusse mein',
      'gussa aata hai', 'gussa aati hai', 'naraz hu', 'naraz hoon',
      'chidchida', 'chidchidaapan', 'chidh raha', 'chidh rahi',
      'bahut gussa', 'krodh', 'aakrosh', 'frustrated', 'frustration',
      'annoyed', 'irritated', 'irritation', 'rage', 'furious', 'temper',
      'garmi me', 'gussa control', 'gussa kyu', 'gusse se', 'gussa dekh',
      'cool down', 'gussa utar', 'jalti', 'jalti hai', 'jalta hai',
    ],
  },

  // ------------------------------------------------------------------
  // 10. FAMILY_DISCORD — परिवार / घर का झगड़ा / कलह
  // ------------------------------------------------------------------
  FAMILY_DISCORD: {
    tokens: [
      'parivaar', 'parivar', 'rishtedaar', 'rishtedar', 'jhagda', 'jagda',
      'ladai', 'larai', 'kalesh', 'matbhed', 'jaidaad', 'jayedad',
      'vibhajan', 'bantwara', 'griha', 'parivarik', 'saas', 'sasu',
    ],
    phrases: [
      'ghar me', 'ghar mein', 'parivaar me', 'parivar me', 'family me',
      'family mein', 'sas bahu', 'sasu', 'devrani', 'jethani', 'nanand',
      'ghar ka jhagda', 'jagda', 'jhagda', 'ladai', 'larai', 'mat bhed',
      'matbhed', 'kalesh', 'ghar ki kalesh', 'parents se', 'maa papa',
      'mummy papa', 'mata pita', 'property', 'jaidaad', 'vibhajan',
      'bantwara', 'family fight', 'family dispute', 'house dispute',
      'relative', 'rishtedaar', 'sanskar me', 'ghar walon',
    ],
  },

  // ------------------------------------------------------------------
  // 11. DHARMA_CRISIS — संशय / उलझन / निर्णय / सही-गलत
  // ------------------------------------------------------------------
  DHARMA_CRISIS: {
    tokens: [
      'uljan', 'uljhan', 'sanshay', 'sandeh', 'sandesh', 'dubidha',
      'dubdha', 'samsay', 'bhram', 'sandeha', 'anischay',
    ],
    phrases: [
      'samajh nahi', 'samajh nhi', 'samaj nahi', 'kya karu', 'kya karun',
      'kya karein', 'kya karu ab', 'kya sahi', 'kya galat', 'sahi galat',
      'right or wrong', 'confused', 'confusion', 'dilemma', 'decision',
      'doubt', 'sandeh', 'sanshay', 'uljhan', 'uljan', 'dubidha',
      'dubdha', 'soch me', 'soch mein', 'raasta nahi', 'rasta nahi',
      'direction nahi', 'raah nahi', 'kya rasta', 'kaunsa rasta',
      'sahi kya hai', 'galat kya hai', 'dharm sankat', 'dharma sankat',
      'dharm ka rasta', 'choose karna', 'decide nahi',
    ],
  },

  // ------------------------------------------------------------------
  // 12. ENEMY_JEALOUSY — दुश्मन / ईर्ष्या / नज़र / निंदा
  // ------------------------------------------------------------------
  ENEMY_JEALOUSY: {
    tokens: [
      'dushman', 'vairi', 'sazish', 'ninda', 'badnami', 'hasad', 'irsha',
      'irshya', 'jallad', 'shutru', 'amit', 'durajana', 'kapat',
    ],
    phrases: [
      'jalta hai', 'jalti hai', 'jal raha', 'jal rahi', 'dushman',
      'sazish', 'nazar lag', 'nazar utar', 'evil eye', 'badnam',
      'gossip', 'slander', 'log kya kahenge', 'hatred', 'hate',
      'irshya', 'irsha', 'hasad', 'bura chah', 'bura chahta',
      'nuksan karna', 'kapat', 'dushmani', 'vair', 'sazish hai',
      'kaun sa', 'kaunsi', 'mujhse jalte', 'meri badnami', 'ninda',
      'ninda karta', 'ninda karti', 'kuch bolte', 'kuch kehte',
    ],
  },

  // ------------------------------------------------------------------
  // 13. LONELINESS_ISOLATION — अकेलापन / तन्हाई / कोई नहीं
  // ------------------------------------------------------------------
  LONELINESS_ISOLATION: {
    tokens: [
      'akela', 'akeli', 'akele', 'akalapan', 'akelapan', 'tanha',
      'tanhai', 'tanhayi', 'tanhaai', 'viraan', 'sunna', 'suna',
    ],
    phrases: [
      'koi nahi', 'koyi nahi', 'koi nhi', 'koyi nhi', 'koi nahi hai',
      'mera koi nahi', 'mere paas koi', 'mere pass koi', 'akela hu',
      'akeli hu', 'akele hu', 'akela hoon', 'akeli hoon', 'tanha hu',
      'tanha hoon', 'tanha feel', 'nobody cares', 'no one cares',
      'no one loves', 'nobody loves', 'sab chhod gaye', 'sab chhod',
      'duniya me akela', 'duniya se', 'ghar yaad', 'koi samajh nahi',
      'koi samajhta nahi', 'kisi ko fark nahi', 'kisi ko farak nahi',
      'apna koi nahi', 'sab door', 'door rehte', 'man tanha',
      'mann tanha', 'isolated', 'abandoned', 'ignored', 'neglected',
    ],
  },

  // ------------------------------------------------------------------
  // 14. PROCRASTINATION_LAZINESS — आलस / सुस्ती / टालमटोल
  // ------------------------------------------------------------------
  PROCRASTINATION_LAZINESS: {
    tokens: [
      'aalsi', 'aals', 'sust', 'susti', 'bor', 'aalsi', 'kaamchor',
      'kamchor', 'nidra', 'bhaari', 'bhari', 'bharii',
    ],
    phrases: [
      'man nahi lagta', 'mann nahi lagta', 'man nahi lag raha',
      'mann nahi lag raha', 'kaam tal', 'kam tal', 'tal raha',
      'time waste', 'wasting time', 'timepass', 'time pass',
      'aalsi', 'susti', 'mood nahi', 'energy nahi', 'bored', 'boring',
      'lazy', 'laziness', 'procrastin', 'kaam me man', 'padhai me man',
      'man nahi karta', 'mann nahi karta', 'kaam karna nahi',
      'der se', 'late karna', 'taktal', 'tak tal',
    ],
  },

  // ------------------------------------------------------------------
  // 15. ADDICTION_CONTROL — नशा / लत / इन्द्रिय संयम
  // ------------------------------------------------------------------
  ADDICTION_CONTROL: {
    tokens: [
      'nasha', 'nashe', 'sharab', 'sharaab', 'cigarette', 'cigaret',
      'smoking', 'beer', 'wine', 'nashapan', 'madak', 'vyanasan',
      'lat', 'tamaku', 'tambaku', 'bidi', 'ganja', 'bhaang', 'daru',
    ],
    phrases: [
      'nasha', 'nashe', 'sharab', 'sharaab', 'cigarette', 'smoking',
      'smoke', 'beer', 'wine', 'lat lag', 'lat lagi', 'chhoot nahi',
      'chut nahi', 'chhut nahi', 'control nahi', 'rok nahi pa raha',
      'rok nahi pa rahi', 'temptation', 'craving', 'nasha chhod',
      'chhodna hai', 'chhodna chahta', 'chhodna chahti', 'addict',
      'addiction', 'bad habit', 'boori aadat', 'buri aadat',
      'daru', 'sharab pina', 'pi leta', 'pi leti', 'cigarette pina',
      'nashe me', 'nasha karta', 'nasha karti', 'lata', 'lat lag gayi',
    ],
  },

  // ------------------------------------------------------------------
  // 16. PARENTING_CHILDREN — संतान / बच्चे / पढ़ाई / भविष्य
  // ------------------------------------------------------------------
  PARENTING_CHILDREN: {
    tokens: [
      'bachcha', 'bachha', 'bachche', 'bachhe', 'baccha', 'bacche',
      'beta', 'beti', 'bachchon', 'bachhon', 'bacchon', 'santan',
      'aulaad', 'parvarish', 'sanskar', 'bete', 'betiyan', 'betiyaan',
    ],
    phrases: [
      'bachche', 'bachhe', 'beta', 'beti', 'bete', 'padhai', 'school',
      'college', 'admission', 'exam', 'santan', 'aulaad', 'baccha',
      'bachcha', 'kids', 'child', 'children', 'son', 'daughter',
      'parenting', 'parvarish', 'sanskar', 'palna', 'palan poshan',
      'bachche ka', 'bachchi', 'bachhi', 'bete ki', 'beti ki',
      'bachchon ki padhai', 'bacchon ki padhai', 'school me',
      'college me', 'admission ke', 'santan ki chinta', 'aulaad ki',
      'bachcha bigad', 'bachche bigad', 'bachchon ko',
    ],
  },

  // ------------------------------------------------------------------
  // 17. SUCCESS_GRATITUDE — जीत / सफलता / आभार / कृतज्ञता
  // ------------------------------------------------------------------
  SUCCESS_GRATITUDE: {
    tokens: [
      'jeet', 'jita', 'jiit', 'kamyab', 'kamyabi', 'safal', 'shukriya',
      'dhanyavad', 'dhanyavaad', 'aabhar', 'abhar', 'jeeta', 'jiti',
      'saphal', 'vijay', 'vijeta',
    ],
    phrases: [
      'jeet gaya', 'jeet gayi', 'win', 'won', 'success', 'safal',
      'kamyab', 'kamyabi', 'shukriya', 'dhanyavad', 'dhanyavaad',
      'grateful', 'thank', 'kritagyata', 'kritagya', 'aabhar',
      'vijay', 'vijeta', 'proud of', 'achieved', 'accomplished',
      'mil gaya', 'mil gayi', 'select ho', 'clear ho', 'pass ho',
      'badi khushi', 'khushi hui', 'khush hu', 'khush hoon',
    ],
  },

  // ------------------------------------------------------------------
  // 18. OVERWHELM_STRESS — अति भार / थकान / दबाव (नया)
  // ------------------------------------------------------------------
  OVERWHELM_STRESS: {
    tokens: [
      'bojh', 'bhojh', 'thakan', 'thakaawat', 'thaka', 'thaki', 'dabav',
      'dabao', 'dabaa', 'pressure', 'burnout', 'overload', 'thakaan',
      'bhaar', 'bhar', 'sandwich', 'jhanjhat', 'jhanjhaat',
    ],
    phrases: [
      'bojh', 'bhaar', 'mann bhari', 'man bhari', 'mann bhaari',
      'thak gaya', 'thak gayi', 'thak chuka', 'thak chuki',
      'thak raha', 'thak rahi', 'bahut kaam', 'too much', 'too many',
      'overwhelmed', 'overloaded', 'pressure', 'burnout', 'exhausted',
      'exhaustion', 'dabav', 'dabao', 'dabaa', 'sab kuch', 'sah nahi',
      'sehan nahi', 'bardasht nahi', 'burden', 'mental load',
      'sab sambhal', 'sambhal nahi', 'kaam ka bojh', 'kabhi khatam',
      'khatam nahi ho', 'bahut zyada', 'bahut jyada', 'limit se',
      'ab aur nahi', 'ab aur nhi', 'thak gaya hu', 'thak gayi hu',
    ],
  },

  // ------------------------------------------------------------------
  // 19. GUILT_REGRET — पछतावा / अपराधबोध / ग्लानि (नया)
  // ------------------------------------------------------------------
  GUILT_REGRET: {
    tokens: [
      'guilt', 'guilty', 'regret', 'regrets', 'galti', 'gunah', 'gunaah',
      'kasoor', 'pachtava', 'pachhtava', 'pachtaava', 'afsos', 'sharm',
      'sharam', 'apradh', 'glani', 'glaani', 'paap', 'pap', 'kshama',
      'maafi', 'maafi', 'garak', 'achuk',
    ],
    phrases: [
      'guilt', 'guilty', 'regret', 'regrets', 'galti', 'galti ho',
      'galti ki', 'gunaah', 'gunah', 'kasoor', 'pachtava',
      'pachhtava', 'pachta raha', 'pachta rahi', 'pachta gaya',
      'afsos', 'sharm', 'sharam', 'apradh', 'glani', 'paap',
      'sin', 'mistake', 'wrong kiya', 'galat kiya', 'galat kar',
      'maafi', 'maafi chah', 'forgive', 'forgiveness', 'kshama',
      'dil me khota', 'dil me khot', 'saza', 'saza mil',
      'khud ko kos', 'khud ko dosh', 'self blame', 'blame khud',
      'kya kiya maine', 'maine galat', 'maine galti', 'pachhtawa',
    ],
  },
};
