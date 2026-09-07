/**
 * VEDA DAILY GUIDANCE — "आज क्या करें? किससे बचें?"
 * -----------------------------------------------------------------------------
 * Novice-mode daily guidance derived ENTIRELY from canonical panchang facts
 * (tithi, nakshatra, yoga, karana, weekday, Rahu Kaal, Abhijit Muhurat and
 * resolved festivals). No hardcoded dates — only deterministic rule text.
 *
 * Rule sources (static Shastra rule text, not dates):
 *  - Tithi/Vara/Yoga quality → do/avoid advice
 *  - Rahu Kaal window        → "किससे बचें"
 *  - Abhijit Muhurat         → "क्या करें"
 */

import type { PanchangDayData } from '../../engines/monthlyPanchangEngine';
import { getArtworkForFestival } from './eventArtwork';

export interface DailyGuidance {
  headlineHi: string;
  significanceHi: string;
  doItems: string[];
  avoidItems: string[];
  /** Live alert when the reference instant falls inside Rahu Kaal. */
  rahuAlertHi: string | null;
  /** Live alert when the reference instant falls inside Abhijit. */
  abhijitAlertHi: string | null;
}

const TITHI_MEANING_HI: Array<{ hi: string; doHint: string }> = [
  { hi: 'नए आरंभ व आधार स्थापना का दिन।', doHint: 'नई आदत, प्रार्थना या छोटा शुभ आरंभ करें।' },
  { hi: 'सहयोग, जुड़वाँ कार्य व संधि का दिन।', doHint: 'साझेदारी व बातचीत के कार्य करें।' },
  { hi: 'क्रियाशीलता व साहसिक प्रयास का दिन।', doHint: 'रुके हुए कार्य में हल चलाएँ।' },
  { hi: 'विघ्न निवारण (गणेश) का दिन।', doHint: 'गणेश अर्चना कर बाधाशुद्ध कार्य आरंभ करें।' },
  { hi: 'ज्ञान, शिक्षण व विद्या का दिन।', doHint: 'पढ़ाई, पुस्तक-लेखन या शिक्षण कार्य करें।' },
  { hi: 'वictory एवं स्वास्थ्य (कार्तिकेय) का दिन।', doHint: 'स्वास्थ्य-वृद्धि व शत्रु-निवारण की मन्य करें।' },
  { hi: 'सौर प्रगति व ऊर्जा का दिन।', doHint: 'आत्म-साक्षात्कार व दैनिक अनुशासन बढ़ाएँ।' },
  { hi: 'अंतर-बल एवं रक्षा (दुर्गा) का दिन।', doHint: 'दुर्गा सतनारायण-पाठ या शक्ति आरणा करें।' },
  { hi: 'पूराण एवं धर्म (राम) का दिन।', doHint: 'राम-नाम, धर्म-कार्य व दातव करें।' },
  { hi: 'सफलता एवं अंतिम विजय का दिन।', doHint: 'महत्वपूर्ण निर्णय व शुभ आरंभ करें।' },
  { hi: 'आध्यात्मिक उपवास व शुद्धि का दिन।', doHint: 'एकादशी व्रत व भगवान विष्णु आरणा करें।' },
  { hi: 'दान, सेवा व पवित्र कर्म का दिन।', doHint: 'दान-पुण्य व सेवा-कार्य करें।' },
  { hi: 'नकारात्मकता-शमन (प्रदोष) का दिन।', doHint: 'प्रदोष काल में शिव आरणा करें।' },
  { hi: 'गहन ध्यान व विलय (शिव) का दिन।', doHint: 'गहन ध्यान व शिव-ध्यान करें।' },
  { hi: 'पूर्ण आध्यात्मिक प्रकाश व पूर्ति का दिन।', doHint: 'सतनारायण-कथा, पूजा व चंद्र-आरणा करें।' },
  { hi: 'आंतर-परीक्षण व मूर्तता का दिन।', doHint: 'चिंतन व अनुभव-विलेखन करें।' },
  { hi: 'निर्देशन व स्थिरता का दिन।', doHint: 'पारिवारिक कर्मावली निपटाएँ।' },
  { hi: 'साहस व अखट्ठ प्रयास का दिन।', doHint: 'रुकी योजना पुनः आरंभ करें।' },
  { hi: 'संकष्ट-निवारण गणेश व्रत का दिन।', doHint: 'संकष्टी चतुर्थी व्रत व गणेश आरणा करें।' },
  { hi: 'ज्ञान व सुधार का दिन।', doHint: 'आत्म-शिक्षण व पुस्तक-पाठ करें।' },
  { hi: 'अनुशासन व रोग-निवारण का दिन।', doHint: 'योग-याय व औषधीय सावधानी रखें।' },
  { hi: 'स्पष्टता व स्व-निर्भरता का दिन।', doHint: 'स्व-निर्भर निर्णय लेने का दिन है।' },
  { hi: 'काल-भैरव आरणा व गहन शुद्धि का दिन।', doHint: 'कालाष्टमी पूजा व चिंतन करें।' },
  { hi: 'आंतर-परिशीलन व संकल्प का दिन।', doHint: 'दैनिक चिंतन व संकल्प-निर्धारण करें।' },
  { hi: 'धर्मी कर्म व सौहार्द का दिन।', doHint: 'दातव व सामाजिक सेवा करें।' },
  { hi: 'एकादशी व्रत व शुद्धि-कर्म का दिन।', doHint: 'कृष्ण-पक्ष एकादशी व्रत करें।' },
  { hi: 'पारण व दान का दिन।', doHint: 'पारण-पश्चात् दान-पुण्य करें।' },
  { hi: 'मासिक शिवरात्रि/प्रदोष व्रत का दिन।', doHint: 'शिव आरणा व प्रदोष काल में जागरण करें।' },
  { hi: 'आंतर-शांतता व पार-वैशिष्ठता का दिन।', doHint: 'गहन ध्यान व शिव-चतुर्दशी व्रत करें।' },
  { hi: 'पितृ-तर्पण व ब्रह्म-नवीनीकरण का दिन।', doHint: 'पितृ-तर्पण, श्राद्ध व दान करें।' },
];

const YOGA_SHUBH_SET = new Set([
  'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Sukarma', 'Dhriti', 'Vriddhi', 'Dhruva',
  'Harshana', 'Siddhi', 'Variyana', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra'
]);

function toDayMs(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

function parseTime12(t: string): number {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(t || '');
  if (!m) return -1;
  let h = parseInt(m[1], 10) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h * 60 + parseInt(m[2], 10);
}

/**
 * Builds "आज क्या करें? किससे बचें?" guidance for a panchang day.
 * `now` is used only for the live Rahu/Abhijit alerts (novice mode).
 */
export function getDailyGuidance(day: PanchangDayData, now?: Date): DailyGuidance {
  const tithiIdx = ((day.tithi.index - 1) % 30);
  const tithiMeta = TITHI_MEANING_HI[tithiIdx] || TITHI_MEANING_HI[0];
  const doItems: string[] = [];
  const avoidItems: string[] = [];

  // Festival primacy
  const majorFestival = day.festivals.find((f) => f.isImportant) || day.festivals[0];
  const festivalArtwork = majorFestival ? getArtworkForFestival(majorFestival.nameHi, majorFestival.name) : null;

  if (majorFestival) {
    doItems.unshift(`${majorFestival.nameHi} — व्रत/पूजा व श्रद्धा-पूर्वक उपासना करें।`);
  }
  doItems.push(tithiMeta.doHint);

  // Yoga-based advice
  if (YOGA_SHUBH_SET.has(day.yoga.name)) {
    doItems.push(`${day.yoga.nameHi} योग शुभ है — शुभ आरंभ कर सकते हैं।`);
  } else {
    avoidItems.push(`${day.yoga.nameHi} योग अशुभ है — बड़े आरंभ व निवेश टालें।`);
  }

  // Abhijit (Wednesday caveat)
  if (day.timings.abhijitMuhurat) {
    doItems.push(
      `अभिजित मुहूर्त (${day.timings.abhijitMuhurat.start} – ${day.timings.abhijitMuhurat.end}) में महत्वपूर्ण कार्य/पूजा आरंभ करें।`
    );
  } else {
    avoidItems.push('बुधवार है — अभिजित मुहूर्त वर्जित, मध्य-दिन के बड़े आरंभ टालें।');
  }

  // Rahu Kaal
  avoidItems.push(
    `राहु काल (${day.timings.rahuKaal.start} – ${day.timings.rahuKaal.end}) में नए कार्य, निवेश व सार्वजनिक भाषण से बचें।`
  );

  // Live alerts
  let rahuAlertHi: string | null = null;
  let abhijitAlertHi: string | null = null;
  if (now) {
    const dayMs = toDayMs(day.dateString);
    if (now.getTime() >= dayMs && now.getTime() < dayMs + 86400000) {
      const minsNow = (now.getTime() - dayMs) / 60000;
      const rahuStart = parseTime12(day.timings.rahuKaal.start);
      const rahuEnd = parseTime12(day.timings.rahuKaal.end);
      if (rahuStart >= 0 && rahuEnd >= 0 && minsNow >= rahuStart && minsNow < rahuEnd) {
        rahuAlertHi = `⚠️ अभी राहु काल चालू है (${day.timings.rahuKaal.start} – ${day.timings.rahuKaal.end}) — नए कार्य वरजित।`;
      }
      if (day.timings.abhijitMuhurat) {
        const abStart = parseTime12(day.timings.abhijitMuhurat.start);
        const abEnd = parseTime12(day.timings.abhijitMuhurat.end);
        if (abStart >= 0 && abEnd >= 0 && minsNow >= abStart && minsNow < abEnd) {
          abhijitAlertHi = `🌟 अभी अभिजित मुहूर्त चालू है — सर्वकार्य सिद्धि की स्वर्ण बेला!`;
        }
      }
    }
  }

  const headlineHi = majorFestival
    ? `${majorFestival.nameHi} • ${day.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'} ${day.tithi.nameHi}`
    : `${day.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'} ${day.tithi.nameHi} • ${day.nakshatra.nameHi} नक्षत्र`;

  const significanceHi = majorFestival
    ? `${festivalArtwork ? festivalArtwork.nameHi : majorFestival.nameHi} के दिन — ${tithiMeta.hi} ${day.yoga.quality === 'Auspicious' ? 'योग ' + day.yoga.nameHi + ' शुभ है।' : 'योग ' + day.yoga.nameHi + ' के कारण सावधानी रखें।'}`
    : `${day.tithi.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'} पक्ष की ${day.tithi.nameHi} — ${tithiMeta.hi} नक्षत्र ${day.nakshatra.nameHi} (पाद ${day.nakshatra.pada}) सक्रिय।`;

  return {
    headlineHi,
    significanceHi,
    doItems: doItems.slice(0, 4),
    avoidItems: avoidItems.slice(0, 3),
    rahuAlertHi,
    abhijitAlertHi,
  };
}

/**
 * Two-line significance + Puja Vidhi for major festival event IDs
 * (identity text only — no dates).
 */
export const FESTIVAL_GUIDANCE_HI: Record<
  string,
  { significance: string; pujaVidhi: string[] }
> = {
  'ganesh-chaturthi': {
    significance:
      'भगवान गणेश के जन्मोत्सव के रूप में मनाया जाने वाला पर्व। विघ्न निवारण, बुद्धि व सफलता की प्रार्थना के लिए गणपति पूजा, मोदक भोग और गण पठन किया जाता है।',
    pujaVidhi: [
      'प्रातः स्नान कर स्थान पुष्प-पत्रों से शुद्ध करें, दूर्वा-भस्म से सज्जित करें।',
      'गणेश स्थापना करें; गंगाजल, दूर्वा, मोदक व चंदन से अभिषेक-पूजा करें।',
      'गणपती अष्टक/गण पठन का पाठ करें; अंत में मोदक भोग लगाएँ व अरपि करें।',
    ],
  },
  'janmashtami': {
    significance:
      'श्रीकृष्ण के जन्मोत्सव का महोत्सव। मध्यरात्रि काल में कृष्ण-नाम, भवानी अष्टक व मत्स्य-माँध्य व्रत का पारम्परिक पालन होता है।',
    pujaVidhi: [
      'मध्यरात्रि से पहले नित्य कर्म व स्नान करें; कृष्ण चरण-पद्म स्थापना करें।',
      'मखाना-माँध्य सहित भोग लगाएँ; भवानी अष्टक व हरि-नाम का पाठ करें।',
      'मध्यरात्रि काल में जन्मोदय की श्रद्धांजलि व दीप-प्रज्वलन करें।',
    ],
  },
  'navratri-start': {
    significance:
      'शारदीय नवरात्रि का आरंभ — सात शक्तियों की प्रतिभा व माँ दुर्गा की स्थापना (घट-स्थान) का पावन अवसर। नौ रातों तक सात-पूजा, चण्डी पाठ व व्रत का पालन होता है।',
    pujaVidhi: [
      'अभिमंत्रित घाट पर शक्ति की स्थापना करें; आम-पत्र, नारियल व चून्नी से शृंगार करें।',
      'दीप प्रज्वलन व घट-पूजा करें; अगले नौ दिनों के व्रत का संकल्प लें।',
      'दैनिक सात-पूजा, चण्डी पाठ व रात्रि-जागरण का आरंभ करें।',
    ],
  },
  'durga-ashtami': {
    significance:
      'माँ दुर्गा की महाष्टमी — आढ़ी की प्रमुख पूजा। सप्त शक्तियों की स्मृति के साथ क्लृष्टि-निवारण व बल-प्रदान हेतु विशेष शक्ति-पूजा एवं कपूर-अर्चना की जाती है।',
    pujaVidhi: [
      'पूर्व-दिन की सप्तमी पूजा के पश्चात् सात शक्तियों की स्थापना व पूजा करें।',
      'महाष्टमी काल में दुर्गा सपतरशी/क्लिष्टि कथं का पाठ करें; कपूर व पुष्प अर्पित करें।',
      'अष्टमी के अंत में माँ के चरणों में घी-दीप व फल-फूल अर्पित करें।',
    ],
  },
  'vijayadashami': {
    significance:
      'राम-राज्य स्थापना व धर्म की विजय (विजयादशमी) का महापर्व। शत्रु-निवारण, ज्ञान-वर्धन व नए आरंभ के लिए वेद-पुस्तक/अस्त्र अर्चना (असुधा-पूजा) की जाती है।',
    pujaVidhi: [
      'प्रातः स्नान कर शिव-दुर्गा व राम-हनुमान की स्मृति व पूजा करें।',
      'पुस्तक, उपकरण व वाहन की असुधा-पूजा करें (नया आरंभ शुभ होता है)।',
      'यजमान/मित्रों को वेंक-पत्र अर्पित कर विजयादशमी की बधाई व भोग वितरित करें।',
    ],
  },
  'diwali': {
    significance:
      'दीपावली — अंधकार पर प्रकाश, अज्ञान पर ज्ञान की विजय। अमावस्या की रात माँ लक्ष्मी की आरपि, दीप-प्रज्वलन व कलश-स्थापना का सात सनातन महापर्व।',
    pujaVidhi: [
      'प्रातः गंगा-स्नान व घर की स्वच्छता-शृंगार (रंगोली, दीप) करें।',
      'संध्या-काल में कलश-स्थापना, लक्ष्मी-सरस्वती पूजा व सतनारायण-कथा का पाठ करें।',
      'पूजन के बाद दीप-अर्पण, मिष्टान्न व दीप-दान करें; रात्रि दीपक प्रज्वलित रखें।',
    ],
  },
  'mahashivaratri': {
    significance:
      'भगवान शिव की महापूजा का महापर्व — कृष्ण चतुर्दशी (शिवरात्रि) पर निशि-जागरण, शिवलिंग अभिषेक व बेल-पत्र अर्चना का पारम्परिक पालन होता है।',
    pujaVidhi: [
      'पूरे दिन का कठोर व्रत लें; चार प्रहर में शिवलिंग अभिषेक (जल, दूध, दधि, शहद, मधु) करें।',
      'बेल-पत्र, भस्म, रोली व धूप-दीप अर्पित करें; शिव त्रिशक्ति/शिव सपतरशी का पाठ करें।',
      'निशि-जागरण करें; प्रभात में पारण व शिव-अरपि करें।',
    ],
  },
  'chhath-puja': {
    significance:
      'सूर्य देव व माँ चतुर्धा की उपासना का प्रमुख पर्व (विशेषकर बिहार/UP)। चार दिवसीय व्रत में संध्या-अर्घ्य, प्रातः-अर्घ्य व कच्छा-विधि का पारम्परिक पालन होता है।',
    pujaVidhi: [
      'कच्छा विधि से सूर्य को संध्या-अर्घ्य (सिंकर व फल सहित) अर्पित करें।',
      'चार प्रहर व्रत का पालन करें; रात्रि जागरण व संध्या-काल प्रार्थना करें।',
      'प्रातः सूर्य को अर्घ्य अर्पित कर ब्रह्मचारी/कुमारी व्रती के हाथ से पारण करें।',
    ],
  },
  'sharad-purnima': {
    significance:
      'शरद पूर्णिमा (कोजागरि) — आम्रित-वृष्टि की रात। माँ लक्ष्मी के आगमन की स्मृति में गंगा-प्रांगण में खीर की पूजा व रात्रि-जागरण का पारम्परिक पालन होता है।',
    pujaVidhi: [
      'प्रातः स्नान कर माँ लक्ष्मी की स्थापना व दूर्वा-पूजन करें।',
      'चंद्र-दर्शन कर खीर/मधुपंख व फल का भोग लगाएँ; कोजागरि जागरण व कथा-पाठ करें।',
      'रात्रि में दीप-अर्पण व पारण के पश्चात् भोग वितरित करें।',
    ],
  },
  'karwa-chauth': {
    significance:
      'स्वामी के लंबे आयु-यौवन की प्रार्थना का प्रमुख व्रत (कृष्ण चतुर्थी, कार्तिक)। पूरे दिन निशाल व्रत चंडी, चंद्र-दर्शन व जाल-विधि का पालन होता है।',
    pujaVidhi: [
      'प्रातः बहू/सम्बंधियों से न्यून-बिन्दा व जाल विधि व चंद्र-पूजा करें।',
      'पूरे दिन निशाल व्रत रखें; सास/संबंधी से चंद्र-दर्शन हेतु संकेत लें।',
      'रात्रि में चंद्र से जल, फल व मिष्ठान्न प्राप्त कर पारण व स्वामी को अर्पित करें।',
    ],
  },
  'raksha-bandhan': {
    significance:
      'बहू-बिनोद/स्वामी-स्वजनों के आरक्षण का पर्व — श्रावण पूर्णिमा पर बहन/स्वजनों द्वारा स्वामी/भ्रातृ को राखी बाँधना व आरक्षण-व्रती का पारम्परिक पालन।',
    pujaVidhi: [
      'प्रातः स्नान कर राखी, कपूर व मिष्टान्न सहित थाली सज्जित करें।',
      'शुभ मुहूर्त में स्वामी/भ्रातृ के कर्ण में राखी बाँधें; चिंता-पत्र व आशीर्वाद लें।',
      'शुभ भोग व मिष्टान्न का अदल-बदल (व्याज) करें।',
    ],
  },
  'guru-purnima': {
    significance:
      'गुरु पूर्णिमा — ज्ञान के आतश (व्यास-देव) की पूजा का पर्व। गुरु-पूजा, ध्यान-गुरु स्थापना, व्रत व श्रृंगार (शिव-गुरु, व्यास-पूजा) का पारम्परिक पालन।',
    pujaVidhi: [
      'प्रातः स्नान कर गुरु-चरण-पद्म/व्यास-देव की स्थापना व पूजा करें।',
      'पुस्तक, दीप व पुष्प अर्पित कर गुरु-पूजा/गुरु-तथा का पाठ करें।',
      'पूजा के पश्चात् गुरु/अध्यापक को वंदना व भोग-वितरण करें।',
    ],
  },
  'makar-sankranti': {
    significance:
      'मकर संक्रांति — सूर्य के मकर-राशि प्रवेश का महापर्व। तिल-गुड़ चढ़ाई, गंगा-स्नान, विविध-दान व पतंग-उड़ाई का पारम्परिक उत्सव; उत्तरायण का आरंभ।',
    pujaVidhi: [
      'प्रातः पवित्र स्नान व सूर्य-पूजा/संक्रांति-अर्घ्य करें।',
      'तिल-गुड़ (पुस-काजू) चढ़ाई व मिष्टान्न का दान करें।',
      'पुस्तक/गुरु-पूजा व उत्तरायण-संकल्प का पालन करें।',
    ],
  },
  'ekadashi-generic': {
    significance:
      'भगवान विष्णु को समर्पित पावन एकादशी व्रत — मन-शुद्धि, रोग-निवारण व मोक्ष की प्रार्थना। उपवास व भगवान-सतनारायण कथा का पारम्परिक पालन।',
    pujaVidhi: [
      'प्रातः स्नान कर विष्णु/राम/कृष्ण की स्थापना व पूजा करें।',
      'एकादशी व्रत का संकल्प लें; दिनभर मल्य-व्रत/फलाहार का पालन करें।',
      'द्वैतादशी (द्वादशी) प्रातः भगवान-दर्शन कर पारण व भोग-वितरण करें।',
    ],
  },
  'pradosh-vrat': {
    significance:
      'त्रयोदशी प्रदोष काल में भगवान शिव की आरणा व क्लृष्टि-निवारण का व्रत। बेल-पत्र, गंगाजल व पंचामृत से सांध्य-पूजा का पारम्परिक पालन।',
    pujaVidhi: [
      'प्रातः स्नान व व्रत-संकल्प करें; दिनभर सात्विक भोजन करें।',
      'प्रदोष काल में शिवलिंग अभिषेक, बेल-पत्र व पंचामृत अर्पण करें।',
      'शिव पंचाक्षरी जाप/शिव त्रिशक्ति का पाठ कर पारण व भोग-वितरण करें।',
    ],
  },
};

const GENERIC_PUJA_VIDHI = [
  'प्रातः स्नान कर शुद्ध स्थान पर दीप, पुष्प व फल-फल सहित पूजा-थाली सज्जित करें।',
  'शुभ मुहूर्त (अभिजित/प्रातः-काल) में प्राथमिक पूजा व प्राथना करें।',
  'अंत में भोग/अरपि करें व मिष्टान्न का दान-वितरण करें।',
];

/**
 * Puja Vidhi for a festival named by the panchang engine (falls back to a
 * generic three-step vidhi when no specific one is registered).
 */
export function getPujaVidhiForFestival(nameHi: string, nameEn?: string): string[] {
  const artwork = getArtworkForFestival(nameHi, nameEn);
  if (artwork) {
    const guidance = FESTIVAL_GUIDANCE_HI[artwork.id];
    if (guidance) return guidance.pujaVidhi;
  }
  return GENERIC_PUJA_VIDHI;
}

/** Two-line significance for a festival (falls back to tithi-based text). */
export function getFestivalSignificanceHi(
  nameHi: string,
  nameEn?: string,
  fallbackTithiText?: string
): string {
  const artwork = getArtworkForFestival(nameHi, nameEn);
  if (artwork) {
    const guidance = FESTIVAL_GUIDANCE_HI[artwork.id];
    if (guidance) return guidance.significance;
  }
  return (
    fallbackTithiText ||
    'सनातन पारम्परिक व्रत/पर्व — शुद्ध मन, संकल्प-पूर्वक पूजा व दान-पुण्य का पावन अवसर।'
  );
}
