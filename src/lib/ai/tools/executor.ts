import { calculatePanchang } from '@/engines/panchang.js';

const SHRINES_DB: Record<string, any> = {
  'kashi': {
    name: 'श्री काशी विश्वनाथ ज्योतिर्लिंग',
    deity: 'भगवान शिव (विश्वेश्वर)',
    location: 'वाराणसी धाम, उत्तर प्रदेश',
    image: '/images/darshan/kashi-vishwanath.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/-rqYkZ3x0jM?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/@ShriKashiVishwanathTempleTrust/live',
    timings: 'मंगला आरती ०३:०० • सांध्य आरती ०७:०० सायं'
  },
  'somnath': {
    name: 'श्री सोमनाथ महादेव (प्रथम ज्योतिर्लिंग)',
    deity: 'भगवान सोमनाथ',
    location: 'प्रभास पाटन, सौराष्ट्र, गुजरात',
    image: '/images/darshan/somnath.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Wu321m2SUKY?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/@SomnathTempleOfficialChannel/live',
    timings: 'प्रातः ०७:०० • मध्याह्न १२:०० • सांध्य आरती ०७:०० सायं'
  },
  'mahakal': {
    name: 'श्री महाकालेश्वर ज्योतिर्लिंग (उज्जैन)',
    deity: 'काल के स्वामी महाकाल',
    location: 'उज्जैन, मध्य प्रदेश',
    image: '/images/darshan/mahakaleshwar.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/V31rQRlFNMs?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/@shreemahakaleshwarmandiruj6695/live',
    timings: 'भस्म आरती ०४:०० • सांध्य आरती ०७:०० सायं'
  },
  'ganga': {
    name: 'दशाश्वमेध घाट माँ गंगा महाआरती (काशी)',
    deity: 'माँ गंगा व भगवान विश्वनाथ',
    location: 'दशाश्वमेध घाट, वाराणसी',
    image: '/images/darshan/ganga-aarti.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/9g0H4Yv6v9o?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/@gangaarti/live',
    timings: 'सांध्य महाआरती प्रतिदिन सायं ०६:३० बजे'
  }
};

export async function executeVedicTool(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case 'get_panchang': {
      const now = new Date();
      const p = calculatePanchang(now, 25.3176, 82.9739, 5.5);
      const dateStr = now.toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      return {
        dateStr,
        tithi: `${p.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'} ${p.tithi?.name}`,
        tithiPaksha: p.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल पक्ष (चान्द्र वृद्धि)' : 'कृष्ण पक्ष (चान्द्र क्षय)',
        nakshatra: p.nakshatra?.name || 'शतभिषा',
        pada: p.nakshatra?.pada || 1,
        yoga: p.yoga?.name || 'शोभन',
        karana: p.karana?.name || 'बव',
        rahuKaal: `${p.rahuKala?.start} – ${p.rahuKala?.end}`,
        abhijitMuhurat: '11:45 AM – 12:35 PM',
        recommendation: 'सामान्य व शुभ कार्यों हेतु अनुकूल समय।'
      };
    }

    case 'get_temple_darshan': {
      const key = (args.shrine || 'kashi').toLowerCase();
      let shrineKey = 'kashi';
      if (key.includes('somnath')) shrineKey = 'somnath';
      else if (key.includes('mahakal') || key.includes('ujjain')) shrineKey = 'mahakal';
      else if (key.includes('ganga') || key.includes('aarti')) shrineKey = 'ganga';
      return SHRINES_DB[shrineKey] || SHRINES_DB['kashi'];
    }

    case 'get_kashi_journey': {
      return {
        destination: 'काशी (वाराणसी) पावन तीर्थ परिपथ',
        tagline: 'पंच-तीर्थ दर्शन, दशाश्वमेध महाआरती एवं पुण्य गंगा स्नान',
        panchangSummary: 'उत्तम यात्रा काल: शुक्ल पक्ष, एकादशी, प्रदोष या पूर्णिमा तिथि।',
        temples: [
          { name: '१. श्री काशी विश्वनाथ ज्योतिर्लिंग', deity: 'देवाधिदेव विश्वेश्वर', tip: 'प्रातः मंगला आरती (०३:०० AM) या सुगम दर्शन पास लें।' },
          { name: '२. माँ अन्नपूर्णा मन्दिर', deity: 'अन्न व समृद्धि दायिनी', tip: 'विश्वनाथ मन्दिर के ठीक समीप, महाप्रसाद ग्रहण करें।' },
          { name: '३. श्री काल भैरव मन्दिर', deity: 'काशी के कोतवाल', tip: 'काशी प्रवास की अनुमति व सुरक्षा हेतु दर्शन अनिवार्य।' },
          { name: '४. संकट मोचन हनुमान मन्दिर', deity: 'कष्ट भंजन हनुमान जी', tip: 'सायं आरती के समय बेसन के लड्डू का भोग लगाएं।' },
          { name: '५. माँ विशालाक्षी शक्तिपीठ', deity: 'सती के नेत्र', tip: 'मीर घाट के समीप ५२ शक्तिपीठों में प्रमुख।' }
        ],
        aartiTimings: [
          { event: 'सुबह-ए-बनारस (सूर्योदय)', time: '०५:३० AM', ghat: 'अस्सी घाट' },
          { event: 'माँ गंगा दिव्य सांध्य महाआरती', time: '०६:३० PM', ghat: 'दशाश्वमेध घाट' }
        ]
      };
    }

    case 'get_mantra': {
      const type = (args.mantraType || 'mrityunjaya').toLowerCase();
      if (type.includes('tandav')) {
        return {
          title: 'शिव ताण्डव स्तोत्रम् (रावण रचित)',
          deity: 'भगवान शिव',
          sanskrit: 'जटाटवीगलज्जलप्रवाहपावितस्थले गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम् ।\nडमड्डमड्डमड्डमन्निनादवड्डमर्वयं चकार चण्डताण्डवं तनोतु नः शिवः शिवम् ॥',
          meaning: 'जिनके जटा रूपी वन से बहती हुई गंगा की धाराएं कंठ को पवित्र कर रही हैं, वे भगवान शिव हमारा कल्याण करें।',
          benefit: 'शत्रु बाधा निवारण, आत्मविश्वास व ऊर्जा की प्राप्ति।'
        };
      }
      return {
        title: 'महामृत्युंजय मन्त्र (ऋग्वेद ७.५९.१२)',
        deity: 'भगवान त्र्यम्बक (महाकाल)',
        sanskrit: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।\nउर्वारुकमिव बन्धनान्मृत्य pushyam mukshiya maamritat ॥',
        meaning: 'हम तीन नेत्रों वाले भगवान शिव की आराधना करते हैं, जो सुगंधित हैं और सभी प्राणियों का पोषण करते हैं।',
        benefit: 'अकाल मृत्यु से रक्षा, मानसिक शान्ति व दीर्घायु।'
      };
    }

    case 'get_muhurat': {
      return {
        type: 'विवाह व मांगलिक शुभ मुहूर्त',
        windows: [
          { date: '२७ नवम्बर २०२६', tithi: 'मार्गशीर्ष शुक्ल द्वितीया', nakshatra: 'रोहिणी', auspiciousTime: 'सायं ०६:२० – रात्रि १०:४५', rating: '⭐⭐⭐⭐⭐ सर्वोत्तम' },
          { date: '०२ दिसम्बर २०२६', tithi: 'मार्गशीर्ष शुक्ल सप्तमी', nakshatra: 'उत्तराफाल्गुनी', auspiciousTime: 'रात्रि ०८:१५ – १२:३०', rating: '⭐⭐⭐⭐ अति शुभ' }
        ]
      };
    }

    default:
      return { status: 'unknown_tool' };
  }
}
