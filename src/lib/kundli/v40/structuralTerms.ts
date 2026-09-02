/**
 * KUNDLI V41 §2/§3 — structural vocabulary.
 *
 * WHY THIS FILE EXISTS
 *
 * Kundli programs from the 1990s produce flawless Hindi. They manage it not
 * through translation but through *arithmetic and a closed vocabulary*: their
 * entire output is tables of computed values whose column heads, enum values
 * and status words come from a fixed dictionary of a few hundred entries. A
 * Kundli is a table, and a table can be perfectly bilingual.
 *
 * We had lost that property by writing an English-first document. Measured on
 * the golden fixture, Part A is:
 *
 *   ~50%  structured  — tables, key/value grids, charts, status lists
 *   ~46%  prose       — 77 English sentences of explanation
 *   ~4%   chrome      — titles, headings, page furniture
 *
 * The structured half is a closed vocabulary of ~239 distinct strings, and
 * most of those (grahas, rashis, nakshatras, bhavas, dignities) were already
 * bilingual in `labels.ts` and simply never reached — `labelModeForLocale`
 * collapsed 'hi' into 'hi-en', so the `mode === 'hi'` branch at every call site
 * was permanently false. This file supplies the remainder: the column heads,
 * grid labels, sub-headings, status words and enum values.
 *
 * WHY A SOURCE-STRING DICTIONARY
 *
 * Keys are the English strings themselves, gettext-style, rather than symbolic
 * ids. That is a deliberate trade: it makes the table complete-able by
 * inspection (every literal in the report model is a lookup), it degrades
 * safely (an unknown string renders as English rather than as a missing-key
 * placeholder), and the §3 gate can enumerate precisely what is still missing.
 *
 * This is NOT a per-word patch of the kind V40.1 forbade. That prohibition was
 * about hacking Devanagari *shaping* string-by-string; shaping is handled
 * properly by the font stack. This is ordinary terminology.
 *
 * SCOPE: user-visible structural text. Not prose paragraphs (§19 synthesis
 * language is a separate, larger problem), and not technical identifiers in
 * the Scholar Appendix, which §3 exempts.
 */

import type { LabelMode } from './labels';

export const STRUCTURAL_TERMS_VERSION = 'kundli-structural-terms-v1';

/**
 * English source string -> Devanagari.
 *
 * Terminology follows North Indian practice: Sanskrit/Hindi Jyotish words are
 * kept as Jyotish words (भाव, दृष्टि, अन्तर्दशा) rather than translated into
 * general Hindi, because that is what a Pandit reads and says.
 */
export const STRUCTURAL_HI: Record<string, string> = {
  /* ---- table column heads ---- */
  'Graha': 'ग्रह',
  'Grahas': 'ग्रह',
  'Rashi': 'राशि',
  'Degree': 'अंश',
  'Bhava': 'भाव',
  'Nakshatra': 'नक्षत्र',
  'Pada': 'चरण',
  'Motion': 'गति',
  'Dignity': 'अवस्था',
  'Notes': 'टिप्पणी',
  'Lord': 'स्वामी',
  'Bhavesha': 'भावेश',
  'Bhavesha placement': 'भावेश की स्थिति',
  'Occupants': 'स्थित ग्रह',
  'Karaka': 'कारक',
  'Level': 'स्तर',
  'Start': 'आरम्भ',
  'End': 'समाप्ति',
  'Factor': 'घटक',
  'Evidence': 'प्रमाण',
  'Conjunct': 'युति',
  'Conjunct with': 'युति',
  'Rules bhavas': 'अधिपत्य भाव',
  'Functional position': 'कार्यात्मक स्थिति',
  'Casts drishti on': 'दृष्टि',
  'Receives drishti from': 'प्राप्त दृष्टि',
  'Drishti received': 'प्राप्त दृष्टि',
  'Aspects bhavas': 'दृष्ट भाव',
  'Natal bhava · rashi': 'जन्म भाव · राशि',
  'Antardasha': 'अन्तर्दशा',
  'Mahadasha': 'महादशा',
  'Pratyantardasha': 'प्रत्यन्तर्दशा',

  /* ---- key/value grid labels ---- */
  'Zodiac': 'राशि पद्धति',
  'Ayanamsha': 'अयनांश',
  'House system': 'भाव पद्धति',
  'Node policy': 'राहु-केतु पद्धति',
  'Aspect policy': 'दृष्टि पद्धति',
  'Ephemeris': 'ग्रह-गणित',
  'Ascendant': 'लग्न',
  'Lagna Lord': 'लग्नेश',
  'Moon Sign': 'चन्द्र राशि',
  'Sun Sign': 'सूर्य राशि',
  'Moon': 'चन्द्र',
  'Birth Nakshatra': 'जन्म नक्षत्र',
  'Nakshatra Lord': 'नक्षत्र स्वामी',
  'Balance at Birth': 'जन्मकालीन शेष दशा',
  'Next Transition': 'अगला परिवर्तन',
  'Current activation': 'वर्तमान सक्रियता',
  'Natal indication': 'जन्मकालीन संकेत',
  'Evidence coverage': 'प्रमाण विस्तार',
  'Rule agreement': 'नियम सहमति',
  'Amanta Masa': 'अमान्त मास',
  'Purnimanta Masa': 'पूर्णिमान्त मास',
  'Samvat': 'संवत्',
  'D9 Lagna': 'नवांश लग्न',
  'Vargottama': 'वर्गोत्तम',
  'Manglik': 'मांगलिक',
  'Kalsarpa': 'कालसर्प',
  'Sade Sati': 'साढ़े साती',
  'Natal Saturn–Moon positional check': 'जन्मकालिक शनि-चन्द्र स्थिति जांच',
  'Sade Sati (natal Saturn from Moon)': 'जन्मकालिक शनि-चन्द्र स्थिति (साढ़े साती जांच)',
  'Observed': 'गणना अनुसार',

  /* ---- sub-headings ---- */
  'Bhava by bhava': 'भावानुसार विवेचन',
  'Conclusion': 'निष्कर्ष',
  'Condition notes': 'स्थिति टिप्पणी',
  'Cross-chart confirmation': 'वर्ग पुष्टि',
  'Dasha activation': 'दशा सक्रियता',
  'Structural highlights': 'प्रमुख संरचनात्मक बिन्दु',
  'Status marks': 'स्थिति चिह्न',
  'Overlapping themes': 'समान विषय',
  'Functional role, conjunction and drishti': 'कार्यात्मक भूमिका, युति एवं दृष्टि',
  'Yoga participation of the active lords': 'सक्रिय स्वामियों की योग सहभागिता',

  /* ---- status words ---- */
  'Present': 'उपस्थित',
  'PRESENT': 'उपस्थित',
  'Absent': 'अनुपस्थित',
  'ABSENT': 'अनुपस्थित',
  'Not calculated': 'गणना नहीं',
  'NOT_CALCULATED': 'गणना नहीं',
  'Scholar judgement': 'शास्त्रीय मतान्तर',
  'SCHOLAR_JUDGEMENT': 'शास्त्रीय मतान्तर',
  'Validation pending': 'सत्यापन प्रगति में',
  'VALIDATION_PENDING': 'सत्यापन प्रगति में',
  'STRONG': 'प्रबल',
  'MODERATE': 'मध्यम',
  'WEAK': 'निर्बल',

  /* ---- dignity and condition marks ---- */
  'combust': 'अस्त',
  'near combustion': 'अस्त के निकट',
  'own': 'स्वगृह',
  'exalted': 'उच्च',
  'debilitated': 'नीच',
  'moolatrikona': 'मूलत्रिकोण',
  'vargottama': 'वर्गोत्तम',

  /* ---- yoga and dosha names ----
   * Classical yogas have settled Devanagari names; a Hindi Kundli that prints
   * "Gaja-Kesari Yoga" in Latin is the tell that it was translated rather than
   * written. The parenthetical qualifiers stay because they are the engine's
   * scope note, not part of the yoga's name. */
  'Gaja-Kesari Yoga': 'गजकेसरी योग',
  'Budhaditya Yoga': 'बुधादित्य योग',
  'Chandra-Mangala Yoga': 'चन्द्र-मंगल योग',
  'Kemadruma Yoga': 'केमद्रुम योग',
  'Ruchaka Yoga (Pancha Mahapurusha)': 'रुचक योग (पंच महापुरुष)',
  'Bhadra Yoga (Pancha Mahapurusha)': 'भद्र योग (पंच महापुरुष)',
  'Hamsa Yoga (Pancha Mahapurusha)': 'हंस योग (पंच महापुरुष)',
  'Malavya Yoga (Pancha Mahapurusha)': 'मालव्य योग (पंच महापुरुष)',
  'Sasa Yoga (Pancha Mahapurusha)': 'शश योग (पंच महापुरुष)',
  'Dharma-Karmadhipati Yoga (conjunction or parivartana only)':
    'धर्म-कर्माधिपति योग (केवल युति अथवा परिवर्तन)',
  'Dharma-Karmadhipati Yoga — mutual-kendra variant (not adopted)':
    'धर्म-कर्माधिपति योग — परस्पर केन्द्र प्रकार (अस्वीकृत)',
  'rule variant recorded, not adopted': 'नियम प्रकार अंकित, अस्वीकृत',

  'Confirmed': 'सिद्ध',
  'Tradition-dependent — no verdict issued': 'मतान्तर — कोई निर्णय नहीं',
  'Dosha': 'दोष',

  /* ---- Panchanga vocabulary ----
   * The five limbs are the oldest and most-read part of any Kundli, and they
   * are exactly what 1990s software rendered flawlessly in Devanagari. Tithi,
   * karana and the 27 nitya yogas are proper nouns of the tradition. */
  'Pratipada': 'प्रतिपदा', 'Dwitiya': 'द्वितीया', 'Tritiya': 'तृतीया',
  'Chaturthi': 'चतुर्थी', 'Panchami': 'पंचमी', 'Shashthi': 'षष्ठी',
  'Saptami': 'सप्तमी', 'Ashtami': 'अष्टमी', 'Navami': 'नवमी',
  'Dashami': 'दशमी', 'Ekadashi': 'एकादशी', 'Dwadashi': 'द्वादशी',
  'Trayodashi': 'त्रयोदशी', 'Chaturdashi': 'चतुर्दशी',
  'Purnima': 'पूर्णिमा', 'Amavasya': 'अमावस्या',

  'Bava': 'बव', 'Balava': 'बालव', 'Kaulava': 'कौलव', 'Taitila': 'तैतिल',
  'Gara': 'गर', 'Vanija': 'वणिज', 'Vishti': 'विष्टि', 'Shakuni': 'शकुनि',
  'Chatushpada': 'चतुष्पद', 'Naga': 'नाग', 'Kimstughna': 'किंस्तुघ्न',

  'Vishkambha': 'विष्कम्भ', 'Priti': 'प्रीति', 'Ayushman': 'आयुष्मान्',
  'Saubhagya': 'सौभाग्य', 'Shobhana': 'शोभन', 'Atiganda': 'अतिगण्ड',
  'Sukarma': 'सुकर्मा', 'Dhriti': 'धृति', 'Shula': 'शूल', 'Ganda': 'गण्ड',
  'Vriddhi': 'वृद्धि', 'Dhruva': 'ध्रुव', 'Vyaghata': 'व्याघात',
  'Harshana': 'हर्षण', 'Vajra': 'वज्र', 'Siddhi': 'सिद्धि',
  'Vyatipata': 'व्यतीपात', 'Variyan': 'वरीयान्', 'Parigha': 'परिघ',
  'Shiva': 'शिव', 'Siddha': 'सिद्ध', 'Sadhya': 'साध्य', 'Shubha': 'शुभ',
  'Shukla': 'शुक्ल', 'Brahma': 'ब्रह्म', 'Indra': 'ऐन्द्र', 'Vaidhriti': 'वैधृति',

  'Sunday': 'रविवार', 'Monday': 'सोमवार', 'Tuesday': 'मंगलवार',
  'Wednesday': 'बुधवार', 'Thursday': 'गुरुवार', 'Friday': 'शुक्रवार',
  'Saturday': 'शनिवार',

  'Vasanta (Spring)': 'वसन्त', 'Grishma (Summer)': 'ग्रीष्म',
  'Varsha (Monsoon)': 'वर्षा', 'Sharad (Autumn)': 'शरद्',
  'Hemanta (Pre-winter)': 'हेमन्त', 'Shishira (Winter)': 'शिशिर',
  'Uttarayana': 'उत्तरायण', 'Dakshinayana': 'दक्षिणायन',
  'Uttarayana (Northward Sun)': 'उत्तरायण', 'Dakshinayana (Southward Sun)': 'दक्षिणायन',

  'Chaitra': 'चैत्र', 'Vaishakha': 'वैशाख', 'Jyeshtha': 'ज्येष्ठ',
  'Ashadha': 'आषाढ़', 'Shravana': 'श्रावण', 'Bhadrapada': 'भाद्रपद',
  'Ashwina': 'आश्विन', 'Kartika': 'कार्तिक', 'Margashirsha': 'मार्गशीर्ष',
  'Pausha': 'पौष', 'Magha': 'माघ', 'Phalguna': 'फाल्गुन',

  'not calculated': 'गणना नहीं',

  /* ---- notes under a declared setting ---- */
  'each bhava is one whole rashi, counted from the rashi of the lagna':
    'प्रत्येक भाव एक पूर्ण राशि है, लग्न की राशि से गिनी गई',
  'Rahu and Ketu are the mean nodes, not the true nodes':
    'राहु और केतु मध्यम गणना से हैं, स्पष्ट गणना से नहीं',
  'the node 5/9 drishti variant is recorded but not adopted':
    'राहु-केतु की ५/९ दृष्टि का मत अंकित है, स्वीकृत नहीं',

  /* ---- rashi names as they appear in raw model fields ---- */
  'Mesha': 'मेष', 'Vrishabha': 'वृषभ', 'Mithuna': 'मिथुन', 'Karka': 'कर्क',
  'Simha': 'सिंह', 'Kanya': 'कन्या', 'Tula': 'तुला', 'Vrischika': 'वृश्चिक',
  'Dhanu': 'धनु', 'Makara': 'मकर', 'Kumbha': 'कुम्भ', 'Meena': 'मीन',
  'none': 'कोई नहीं',

  /* ---- Gregorian month names ----
   * The civil date stays in Western digits so the passport page does not mix
   * numeral scripts (§4); only the month, which is a word, is translated. */
  'January': 'जनवरी', 'February': 'फ़रवरी', 'March': 'मार्च', 'April': 'अप्रैल',
  'May': 'मई', 'June': 'जून', 'July': 'जुलाई', 'August': 'अगस्त',
  'September': 'सितम्बर', 'October': 'अक्टूबर', 'November': 'नवम्बर', 'December': 'दिसम्बर',

  /* ---- provenance values still shown on the passport (§8 moves these to the appendix) ---- */
  'Iana historical': 'आयाना ऐतिहासिक अभिलेख',
  'Manual': 'हस्त-प्रविष्ट',
  'Important configurations': 'विशेष योग-स्थितियाँ',
  'Factors that could not be evaluated': 'जिन कारकों की जाँच नहीं हो सकी',

  /* ---- page furniture ---- */
  'PART A': 'भाग अ',
  'PART B': 'भाग ब',

  /* ---- computed enum values ---- */
  'Own Sign': 'स्वगृह',
  'Friendly Sign': 'मित्र राशि',
  'Neutral Sign': 'सम राशि',
  'Enemy Sign': 'शत्रु राशि',
  'Friend': 'मित्र',
  'Neutral': 'सम',
  'Enemy': 'शत्रु',
  'Full Parashari drishti': 'पूर्ण पराशरी दृष्टि',
  'Equal sign': 'समान भाव',
  'Mean node': 'मध्यम राहु',
  'True node': 'स्पष्ट राहु',
  'Sidereal': 'निरयन',
  'Tropical': 'सायन',
  'Krishna Paksha': 'कृष्ण पक्ष',
  'Shukla Paksha': 'शुक्ल पक्ष',
};

/**
 * Renders a structural string in the requested mode.
 *
 * Unknown strings fall through to English unchanged. That is intentional: an
 * incomplete dictionary must degrade to a readable document, never to a
 * placeholder. The §3 gate reports the fall-throughs so the gap is visible
 * rather than silently tolerated.
 */
export function tr(en: string, mode: LabelMode): string {
  const hi = STRUCTURAL_HI[en];
  if (!hi) return en;
  if (mode === 'hi') return hi;
  if (mode === 'en') return en;
  return `${hi} / ${en}`;
}

/**
 * Translates the month word inside an already-formatted long date.
 *
 * The date is data, so its digits are left alone — turning "15 June 1995" into
 * "१५ जून १९९५" on a page whose coordinates read 25.5941° would mix numeral
 * scripts, which §4 forbids and the NUM-06 gate catches.
 */
export function trDate(formatted: string, mode: LabelMode): string {
  if (mode === 'en') return formatted;
  return formatted.replace(/[A-Z][a-z]+/g, (word) => STRUCTURAL_HI[word] ?? word);
}

/** Convenience for `headers: [...].map(...)`. */
export const trAll = (xs: string[], mode: LabelMode): string[] => xs.map((x) => tr(x, mode));

/** Is this English string covered by the dictionary? Used by the §3 gate. */
export const isTranslated = (en: string): boolean => en in STRUCTURAL_HI;
