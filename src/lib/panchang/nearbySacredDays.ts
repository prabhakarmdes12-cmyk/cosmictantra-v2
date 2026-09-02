/**
 * NEARBY SACRED DAYS ENGINE & PROVENANCE RANKER
 * -----------------------------------------------------------------------------
 * Discovers, filters, and relevance-ranks upcoming/nearby sacred days, fasts,
 * and festivals around a reference date.
 *
 * Guaranteed Properties:
 *  - 100% deterministic (no LLM hallucination of dates).
 *  - Categorized with traditional attribution & provenance.
 *  - Contextual ranking tailored to user's conversation intent.
 */

import { getCanonicalPanchangBundle, LocationCoordinates } from '../panchangFactBundle';

export interface SacredDayCandidate {
  id: string;
  name: string;
  nameHi: string;
  dateStr: string; // YYYY-MM-DD
  dateObj: Date;
  daysAway: number; // positive = future, 0 = today, negative = past
  daysAwayTextHi: string;
  category: 'EKADASHI' | 'PRADOSH' | 'PURNIMA' | 'AMAVASYA' | 'SHIVARATRI' | 'CHATURTHI' | 'ASHTAMI' | 'FESTIVAL';
  type: string;
  significance: string;
  dateRule: string;
  tradition: string;
  sourceStatus: 'CALCULATED_DRIK' | 'TRADITIONAL_ATTRIBUTION';
  score: number;
}

const SPECIFIC_EKADASHIS: Record<string, string> = {
  '0_11': 'Papamochani Ekadashi (पापमोचिनी एकादशी)',
  '0_26': 'Kamada Ekadashi (कामदा एकादशी)',
  '1_11': 'Varuthini Ekadashi (वरूथिनी एकादशी)',
  '1_26': 'Mohini Ekadashi (मोहिनी एकादशी)',
  '2_11': 'Apara Ekadashi (अपरा एकादशी)',
  '2_26': 'Nirjala Ekadashi (निर्जला एकादशी)',
  '3_11': 'Yogini Ekadashi (योगिनी एकादशी)',
  '3_26': 'Devshayani Ekadashi (देवशयनी एकादशी)',
  '4_11': 'Kamika Ekadashi (कामिका एकादशी)',
  '4_26': 'Shravana Putrada Ekadashi (पुत्रदा एकादशी)',
  '5_11': 'Aja Ekadashi (अजा एकादशी)',
  '5_26': 'Parivartini Ekadashi (परिवर्तिनी एकादशी)',
  '6_11': 'Indira Ekadashi (इन्दिरा एकादशी)',
  '6_26': 'Papankusha Ekadashi (पापांकुशा एकादशी)',
  '7_11': 'Rama Ekadashi (रमा एकादशी)',
  '7_26': 'Devutthana / Prabodhini Ekadashi (देवउठनी एकादशी)',
  '8_11': 'Utpanna Ekadashi (उत्पन्ना एकादशी)',
  '8_26': 'Mokshada Ekadashi / Gita Jayanti (मोक्षदा एकादशी)',
  '9_11': 'Saphala Ekadashi (सफला एकादशी)',
  '9_26': 'Pausha Putrada Ekadashi (पुत्रदा एकादशी)',
  '10_11': 'Shattila Ekadashi (षट्तिला एकादशी)',
  '10_26': 'Jaya Ekadashi (जया एकादशी)',
  '11_11': 'Vijaya Ekadashi (विजया एकादशी)',
  '11_26': 'Amalaki Ekadashi (आमलकी एकादशी)'
};

/**
 * Discovers sacred days within a window [-pastDays, +futureDays] around referenceDate.
 */
export function findNearbySacredDays(
  referenceDateInput: Date | string,
  location: LocationCoordinates,
  optionsOrDays: {
    pastDays?: number;
    futureDays?: number;
    intentFilter?: string;
    limit?: number;
  } | number = {},
  intentFilterArg?: string
): SacredDayCandidate[] {
  const isNumeric = typeof optionsOrDays === 'number';
  const options = isNumeric
    ? { futureDays: optionsOrDays, intentFilter: intentFilterArg }
    : (optionsOrDays || {});

  const refDate = typeof referenceDateInput === 'string' ? new Date(referenceDateInput) : referenceDateInput;
  const pastDays = options.pastDays ?? 2;
  const futureDays = options.futureDays ?? 12;
  const limit = options.limit ?? 5;
  const query = (options.intentFilter || '').toLowerCase();

  const candidates: SacredDayCandidate[] = [];
  const refTime = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();

  for (let d = -pastDays; d <= futureDays; d++) {
    const targetDate = new Date(refTime + d * 86400000);
    const bundle = getCanonicalPanchangBundle(targetDate, location);
    const tithiNum = bundle.tithi.number; // 1-30
    const tithiInPaksha = ((tithiNum - 1) % 15) + 1; // 1-15
    const isShukla = tithiNum <= 15;
    const masaIdx = bundle.masa.index;
    const dateStr = bundle.date;

    const daysAway = d;
    const daysAwayTextHi = d === 0 ? 'आज' : d === 1 ? 'कल' : d === 2 ? 'परसों' : d > 0 ? `${d} दिन बाद` : `${Math.abs(d)} दिन पहले`;

    // 1. Ekadashi (Tithi 11 in Shukla & Krishna)
    if (tithiInPaksha === 11) {
      const ekadashiKey = `${masaIdx}_${tithiNum}`;
      const ekadashiName = SPECIFIC_EKADASHIS[ekadashiKey] || (isShukla ? 'Shukla Ekadashi Vrat' : 'Krishna Ekadashi Vrat');
      const nameHi = isShukla ? 'शुक्ल एकादशी व्रत' : 'कृष्ण एकादशी व्रत';

      candidates.push({
        id: `ekadashi-${dateStr}`,
        name: ekadashiName,
        nameHi: ekadashiName.includes('(') ? ekadashiName.split('(')[1].replace(')', '') : nameHi,
        dateStr,
        dateObj: targetDate,
        daysAway,
        daysAwayTextHi,
        category: 'EKADASHI',
        type: 'Vrat',
        significance: 'भगवान श्रीहरि विष्णु को समर्पित पावन व्रत व उपवास दिवस।',
        dateRule: 'Tithi 11 (Ekadashi) at local Sunrise',
        tradition: 'Smarta & Vaishnava Tradition',
        sourceStatus: 'CALCULATED_DRIK',
        score: 95
      });
    }

    // 2. Pradosh Vrata (Tithi 13 in Shukla & Krishna)
    if (tithiInPaksha === 13) {
      const isSomPradosh = bundle.weekday === 1;
      const isShaniPradosh = bundle.weekday === 6;
      const subName = isSomPradosh ? 'सोम प्रदोष व्रत' : isShaniPradosh ? 'शनि प्रदोष व्रत' : 'प्रदोष व्रत';

      candidates.push({
        id: `pradosh-${dateStr}`,
        name: isSomPradosh ? 'Soma Pradosha Vrat' : isShaniPradosh ? 'Shani Pradosha Vrat' : 'Pradosha Vrat',
        nameHi: subName,
        dateStr,
        dateObj: targetDate,
        daysAway,
        daysAwayTextHi,
        category: 'PRADOSH',
        type: 'Vrat',
        significance: 'भगवान शिव की सांध्य प्रदोष काल में विशेष अर्चना व कष्ट मुक्ति हेतु।',
        dateRule: 'Tithi 13 (Trayodashi) coinciding with Sunset Sayam Sandhya',
        tradition: 'Shaiva Tradition',
        sourceStatus: 'CALCULATED_DRIK',
        score: 90
      });
    }

    // 3. Purnima (Tithi 15)
    if (tithiNum === 15) {
      candidates.push({
        id: `purnima-${dateStr}`,
        name: 'Purnima Vrat / Satyanarayan Puja',
        nameHi: `${bundle.masa.nameHi} पूर्णिमा`,
        dateStr,
        dateObj: targetDate,
        daysAway,
        daysAwayTextHi,
        category: 'PURNIMA',
        type: 'Panchang Event',
        significance: 'सत्यनारायण कथा, गंगा स्नान, दान व चन्द्र आराधना का पूर्ण फलदायी दिवस।',
        dateRule: 'Tithi 15 (Purnima) ending or active during daytime',
        tradition: 'Vedic Tradition',
        sourceStatus: 'CALCULATED_DRIK',
        score: 90
      });
    }

    // 4. Amavasya (Tithi 30)
    if (tithiNum === 30) {
      const isSomavati = bundle.weekday === 1;
      candidates.push({
        id: `amavasya-${dateStr}`,
        name: isSomavati ? 'Somavati Amavasya' : 'Amavasya / Pitru Tarpana',
        nameHi: isSomavati ? 'सोमवती अमावस्या' : `${bundle.masa.nameHi} अमावस्या`,
        dateStr,
        dateObj: targetDate,
        daysAway,
        daysAwayTextHi,
        category: 'AMAVASYA',
        type: 'Panchang Event',
        significance: 'पितृ तर्पण, श्राद्ध, दान व शान्ति कर्म हेतु सर्वोत्तम दिवस।',
        dateRule: 'Tithi 30 (Amavasya) at Sunrise',
        tradition: 'Vedic / Pitru Tradition',
        sourceStatus: 'CALCULATED_DRIK',
        score: 85
      });
    }

    // 5. Masik Shivaratri (Krishna Chaturdashi, Tithi 29)
    if (tithiNum === 29) {
      candidates.push({
        id: `shivaratri-${dateStr}`,
        name: 'Masik Shivaratri',
        nameHi: 'मासिक शिवरात्रि',
        dateStr,
        dateObj: targetDate,
        daysAway,
        daysAwayTextHi,
        category: 'SHIVARATRI',
        type: 'Vrat',
        significance: 'निशीथ काल में भगवान शिव की महापूजा व जागरण।',
        dateRule: 'Krishna Chaturdashi during Nishita Kala',
        tradition: 'Shaiva Tradition',
        sourceStatus: 'CALCULATED_DRIK',
        score: 88
      });
    }

    // 6. Sankashti / Vinayaka Chaturthi (Tithi 4)
    if (tithiInPaksha === 4) {
      const isSankashti = !isShukla;
      candidates.push({
        id: `chaturthi-${dateStr}`,
        name: isSankashti ? 'Sankashti Chaturthi' : 'Vinayaka Chaturthi',
        nameHi: isSankashti ? 'संकष्टी चतुर्थी' : 'विनायक चतुर्थी',
        dateStr,
        dateObj: targetDate,
        daysAway,
        daysAwayTextHi,
        category: 'CHATURTHI',
        type: 'Vrat',
        significance: 'भगवान श्री गणेश की कृपा व विघ्न निवारण हेतु उपवास व चन्द्र दर्शन।',
        dateRule: isSankashti ? 'Krishna Chaturthi with Moonrise' : 'Shukla Chaturthi at Madhyahna',
        tradition: 'Ganapatya Tradition',
        sourceStatus: 'CALCULATED_DRIK',
        score: 80
      });
    }

    // 7. Ashtami / Navami
    if (tithiInPaksha === 8) {
      candidates.push({
        id: `ashtami-${dateStr}`,
        name: isShukla ? 'Durga Ashtami' : 'Kalashtami',
        nameHi: isShukla ? 'दुर्गाष्टमी' : 'कालाष्टमी (भैरव पूजा)',
        dateStr,
        dateObj: targetDate,
        daysAway,
        daysAwayTextHi,
        category: 'ASHTAMI',
        type: 'Vrat',
        significance: isShukla ? 'भगवती दुर्गा की आराधना का दिवस।' : 'काशी के कोतवाल श्री काल भैरव की विशेष पूजा।',
        dateRule: 'Tithi 8 (Ashtami)',
        tradition: 'Shakta / Shaiva Tradition',
        sourceStatus: 'CALCULATED_DRIK',
        score: 75
      });
    }

    // 8. Other Festivals from bundle
    for (const obs of bundle.importantObservances) {
      if (obs.isImportant && !candidates.some(c => c.dateStr === dateStr && c.nameHi === obs.nameHi)) {
        candidates.push({
          id: `fest-${dateStr}-${obs.name}`,
          name: obs.name,
          nameHi: obs.nameHi,
          dateStr,
          dateObj: targetDate,
          daysAway,
          daysAwayTextHi,
          category: 'FESTIVAL',
          type: obs.type,
          significance: obs.significance || 'पावन सनातन पर्व व उत्सव।',
          dateRule: 'Canonical Panchang Astrological Alignment',
          tradition: 'Sanatana Dharma',
          sourceStatus: 'CALCULATED_DRIK',
          score: 98
        });
      }
    }
  }

  // Relevance Scoring & Ranking:
  // culturalImportance (base score) + temporalProximity + userIntentMatch
  for (const c of candidates) {
    let intentBonus = 0;
    const cat = c.category;

    if (query.includes('ekadashi') || query.includes('एकादशी') || query.includes('ग्यारस')) {
      if (cat === 'EKADASHI') intentBonus += 60;
    }
    if (query.includes('pradosh') || query.includes('प्रदोष') || query.includes('त्रयोदशी')) {
      if (cat === 'PRADOSH') intentBonus += 60;
    }
    if (query.includes('purnima') || query.includes('पूर्णिमा') || query.includes('पूरनमासी')) {
      if (cat === 'PURNIMA') intentBonus += 60;
    }
    if (query.includes('amavasya') || query.includes('अमावस्या') || query.includes('अमावस')) {
      if (cat === 'AMAVASYA') intentBonus += 60;
    }
    if (query.includes('shiva') || query.includes('शिव') || query.includes('रुद्र') || query.includes('सोमवार')) {
      if (cat === 'PRADOSH' || cat === 'SHIVARATRI') intentBonus += 40;
    }
    if (query.includes('fast') || query.includes('व्रत') || query.includes('उपवास') || query.includes('विष्णु') || query.includes('vishnu')) {
      if (cat === 'EKADASHI' || cat === 'PURNIMA' || cat === 'PRADOSH' || cat === 'CHATURTHI') intentBonus += 35;
    }
    if (query.includes('ganesh') || query.includes('गणेश') || query.includes('विघ्न')) {
      if (cat === 'CHATURTHI') intentBonus += 50;
    }
    if (query.includes('pitru') || query.includes('पितृ') || query.includes('श्राद्ध') || query.includes('तर्पण')) {
      if (cat === 'AMAVASYA') intentBonus += 50;
    }

    // Proximity factor: prefer upcoming dates in the immediate 1-7 days window
    let proximityScore = 0;
    if (c.daysAway >= 0) {
      proximityScore = Math.max(0, 30 - c.daysAway * 2.5);
    } else {
      proximityScore = Math.max(0, 10 - Math.abs(c.daysAway) * 3);
    }

    c.score = c.score + proximityScore + intentBonus;
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  // Return top N unique dates
  const uniqueByDate: SacredDayCandidate[] = [];
  const seenDates = new Set<string>();
  for (const c of candidates) {
    if (!seenDates.has(c.dateStr)) {
      seenDates.add(c.dateStr);
      uniqueByDate.push(c);
      if (uniqueByDate.length >= limit) break;
    }
  }

  return uniqueByDate;
}

/**
 * Searches forward (up to 35 days) for the next occurrence of a specific observance.
 */
export function findNextSpecificObservance(
  referenceDateInput: Date | string,
  targetType: 'EKADASHI' | 'PURNIMA' | 'AMAVASYA' | 'PRADOSH' | 'SHIVARATRI' | 'CHATURTHI',
  location: LocationCoordinates
): SacredDayCandidate | null {
  const refDate = typeof referenceDateInput === 'string' ? new Date(referenceDateInput) : referenceDateInput;
  const refTime = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();

  for (let d = 0; d <= 35; d++) {
    const targetDate = new Date(refTime + d * 86400000);
    const bundle = getCanonicalPanchangBundle(targetDate, location);
    const tithiNum = bundle.tithi.number;
    const tithiInPaksha = ((tithiNum - 1) % 15) + 1;
    const isShukla = tithiNum <= 15;
    const daysAwayTextHi = d === 0 ? 'आज' : d === 1 ? 'कल' : d === 2 ? 'परसों' : `${d} दिन बाद`;

    let matched = false;
    let name = '';
    let nameHi = '';
    let significance = '';

    switch (targetType) {
      case 'EKADASHI':
        if (tithiInPaksha === 11) {
          matched = true;
          const key = `${bundle.masa.index}_${tithiNum}`;
          const raw = SPECIFIC_EKADASHIS[key];
          name = raw || (isShukla ? 'Shukla Ekadashi' : 'Krishna Ekadashi');
          nameHi = raw && raw.includes('(') ? raw.split('(')[1].replace(')', '') : (isShukla ? 'शुक्ल एकादशी' : 'कृष्ण एकादशी');
          significance = 'भगवान विष्णु की आराधना, उपवास व मोक्ष प्रदायिनी एकादशी।';
        }
        break;

      case 'PURNIMA':
        if (tithiNum === 15) {
          matched = true;
          name = `${bundle.masa.name} Purnima`;
          nameHi = `${bundle.masa.nameHi} पूर्णिमा`;
          significance = 'सत्यनारायण कथा व पवित्र स्नान-दान का महापर्व।';
        }
        break;

      case 'AMAVASYA':
        if (tithiNum === 30) {
          matched = true;
          name = `${bundle.masa.name} Amavasya`;
          nameHi = `${bundle.masa.nameHi} अमावस्या`;
          significance = 'पितृ तर्पण, श्राद्ध व दान का पावन दिवस।';
        }
        break;

      case 'PRADOSH':
        if (tithiInPaksha === 13) {
          matched = true;
          const isSom = bundle.weekday === 1;
          const isShani = bundle.weekday === 6;
          name = isSom ? 'Soma Pradosha' : isShani ? 'Shani Pradosha' : 'Pradosha Vrat';
          nameHi = isSom ? 'सोम प्रदोष व्रत' : isShani ? 'शनि प्रदोष व्रत' : 'प्रदोष व्रत';
          significance = 'प्रदोष काल में भगवान देवाधिदेव महादेव की सांध्यकालीन कृपा।';
        }
        break;

      case 'SHIVARATRI':
        if (tithiNum === 29) {
          matched = true;
          name = 'Masik Shivaratri';
          nameHi = 'मासिक शिवरात्रि';
          significance = 'भगवान शिव की निशीथ कालीन महापूजा व सर्वकष्ट निवारण।';
        }
        break;

      case 'CHATURTHI':
        if (tithiInPaksha === 4) {
          matched = true;
          name = !isShukla ? 'Sankashti Chaturthi' : 'Vinayaka Chaturthi';
          nameHi = !isShukla ? 'संकष्टी चतुर्थी' : 'विनायक चतुर्थी';
          significance = 'भगवान गणेश की आराधना व विघ्न निवारण।';
        }
        break;
    }

    if (matched) {
      return {
        id: `${targetType.toLowerCase()}-${bundle.date}`,
        name,
        nameHi,
        dateStr: bundle.date,
        dateObj: targetDate,
        daysAway: d,
        daysAwayTextHi,
        category: targetType,
        type: 'Vrat',
        significance,
        dateRule: 'Canonical Ephemeris Solar-Lunar Alignment',
        tradition: 'Sanatana Tradition',
        sourceStatus: 'CALCULATED_DRIK',
        score: 100
      };
    }
  }

  return null;
}
