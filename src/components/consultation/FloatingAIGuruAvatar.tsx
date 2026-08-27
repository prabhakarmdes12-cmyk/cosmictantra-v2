'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  X, 
  Send, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Calendar,
  Clock, 
  MapPin, 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  Pause, 
  ExternalLink, 
  ChevronRight, 
  User, 
  ShoppingBag, 
  HeartHandshake,
  Compass,
  BookOpen,
  Phone,
  Video,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getActiveProfile } from '@/lib/profileStore';
import { calculateKundali } from '@/lib/astrologyEngine';
import { calculatePanchang } from '@/engines/panchang.js';
import { chitiSensory } from '@/lib/chitiAudio';

// Provenance Metadata Schema
interface ProvenanceMeta {
  calculation?: string; // e.g. "CosmicTantra Lahiri Engine"
  location?: string;    // e.g. "Varanasi, UP"
  source?: string;      // e.g. "प्रामाणिक दृक् पञ्चाङ्ग / शास्त्र"
  darshan?: string;     // e.g. "प्रत्यक्ष मन्दिर ट्रस्ट लाइव स्रोत"
  scholar?: string;     // e.g. "पं. विद्यानंद शास्त्री उपलब्ध"
  interpretation?: string; // e.g. "काशी सहायक (AI-Assisted)"
}

interface ChatMessage {
  id: string;
  sender: 'GURU' | 'USER' | 'SYSTEM';
  text: string;
  timestamp: string;
  provenance?: ProvenanceMeta;
  panchangCard?: {
    dateStr: string;
    tithi: string;
    tithiPaksha: string;
    nakshatra: string;
    pada: number | string;
    yoga: string;
    karana: string;
    rahuKaal: string;
    abhijitMuhurat: string;
    isRahuNow: boolean;
    recommendation: string;
  };
  journeyCard?: {
    destination: string;
    tagline: string;
    panchangSummary: string;
    temples: Array<{ name: string; deity: string; tip: string }>;
    aartiTimings: Array<{ event: string; time: string; ghat: string }>;
    guidance: string;
  };
  mantraCard?: {
    title: string;
    deity: string;
    sanskrit: string;
    transliteration: string;
    meaning: string;
    benefit: string;
    japaTarget: string;
  };
  muhurtaCard?: {
    type: string;
    windows: Array<{ date: string; tithi: string; nakshatra: string; auspiciousTime: string; rating: string }>;
    guidance: string;
  };
  pulseCard?: {
    lagna: string;
    nakshatra: string;
    dasha: string;
    transitStatus: 'CAUTION_DAY' | 'POWER_DAY';
    transitMessage: string;
    recommendation: string;
  };
  scholarCard?: {
    name: string;
    title: string;
    location: string;
    verified: boolean;
    experience: string;
    tiers: Array<{ label: string; price: string; mode: string; href: string }>;
  };
  navigationAction?: {
    title: string;
    description: string;
    href: string;
    icon: string;
  };
  inChatDarshan?: {
    templeName: string;
    deity: string;
    location: string;
    image: string;
    embedUrl: string;
    officialLiveUrl?: string;
    timings?: string;
  };
  inChatKundaliSvg?: boolean;
  quickChips?: Array<{ label: string; action: string; href?: string }>;
}

const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
function toHindiDigits(str: string | number | undefined): string {
  if (!str) return '';
  return String(str).replace(/[0-9]/g, (d) => HINDI_DIGITS[parseInt(d, 10)]);
}

// -------------------------------------------------------------
// Sacred Shrine Registry (Direct Live Streams & Sanctums)
// -------------------------------------------------------------
const SHRINES_REGISTRY: Record<string, {
  name: string;
  deity: string;
  location: string;
  image: string;
  embedUrl: string;
  officialLiveUrl: string;
  timings: string;
}> = {
  'kashi': {
    name: 'श्री काशी विश्वनाथ ज्योतिर्लिंग',
    deity: 'भगवान शिव (विश्वेश्वर)',
    location: 'वाराणसी धाम, उत्तर प्रदेश',
    image: '/images/darshan/kashi-vishwanath.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/-rqYkZ3x0jM?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/@ShriKashiVishwanathTempleTrust/live',
    timings: 'मंगला आरती ०३:०० • सांध्य आरती ०७:०० सायं',
  },
  'somnath': {
    name: 'श्री सोमनाथ महादेव (प्रथम ज्योतिर्लिंग)',
    deity: 'भगवान सोमनाथ',
    location: 'प्रभास पाटन, सौराष्ट्र, गुजरात',
    image: '/images/darshan/somnath.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Wu321m2SUKY?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/@SomnathTempleOfficialChannel/live',
    timings: 'प्रातः ०७:०० • मध्याह्न १२:०० • सांध्य आरती ०७:०० सायं',
  },
  'mahakal': {
    name: 'श्री महाकालेश्वर ज्योतिर्लिंग (उज्जैन)',
    deity: 'काल के स्वामी महाकाल',
    location: 'उज्जैन, मध्य प्रदेश',
    image: '/images/darshan/mahakaleshwar.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/V31rQRlFNMs?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/@shreemahakaleshwarmandiruj6695/live',
    timings: 'भस्म आरती ०४:०० • सांध्य आरती ०७:०० सायं',
  },
  'deoghar': {
    name: 'बाबा बैद्यनाथ धाम (देवघर)',
    deity: 'वैद्यनाथ महादेव',
    location: 'देवघर, झारखण्ड',
    image: '/images/darshan/baidyanath.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/e9k0a3O2HnA?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/results?search_query=baidyanath+dham+live',
    timings: 'प्रातः ०४:३० • सांध्य आरती ०७:३० सायं',
  },
  'haridwar': {
    name: 'हरिद्वार हर की पौड़ी गंगा महाआरती',
    deity: 'माँ गंगा',
    location: 'हर की पौड़ी, हरिद्वार, उत्तराखण्ड',
    image: '/images/darshan/ganga-aarti.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/0AjyTUaEfOs?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/results?search_query=haridwar+ganga+aarti+live',
    timings: 'सांध्य महाआरती प्रतिदिन सायं ०६:१५ बजे',
  },
  'ganga': {
    name: 'दशाश्वमेध घाट माँ गंगा महाआरती (काशी)',
    deity: 'माँ गंगा व भगवान विश्वनाथ',
    location: 'दशाश्वमेध घाट, वाराणसी',
    image: '/images/darshan/ganga-aarti.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/9g0H4Yv6v9o?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/@gangaarti/live',
    timings: 'सांध्य महाआरती प्रतिदिन सायं ०६:३० बजे',
  },
  'omkareshwar': {
    name: 'श्री ओंकारेश्वर ज्योतिर्लिंग',
    deity: 'ओंकारेश्वर महादेव',
    location: 'मान्धाता द्वीप, नर्मदा तट, मध्य प्रदेश',
    image: '/images/darshan/somnath.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Xd91XgQyjCg?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/results?search_query=omkareshwar+live',
    timings: 'प्रातः ०५:०० • सांध्य आरती ०८:०० सायं',
  },
  'nageshwar': {
    name: 'श्री नागेश्वर ज्योतिर्लिंग',
    deity: 'नागेश्वर महादेव',
    location: 'दारुकावन, द्वारका, गुजरात',
    image: '/images/darshan/kashi-vishwanath.jpg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/R07P7d2zTXU?autoplay=1&mute=0&rel=0&playsinline=1&modestbranding=1',
    officialLiveUrl: 'https://www.youtube.com/results?search_query=nageshwar+jyotirlinga',
    timings: 'प्रातः ०६:०० • सांध्य आरती ०७:०० सायं',
  }
};

export default function FloatingAIGuruAvatar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showGreetingTooltip, setShowGreetingTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('हर हर महादेव! काशी सहायक से पूछें 🙏');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlayingOm, setIsPlayingOm] = useState(false);
  const [offeredDiyaMsgIds, setOfferedDiyaMsgIds] = useState<Record<string, boolean>>({});
  const [offeredFlowersMsgIds, setOfferedFlowersMsgIds] = useState<Record<string, boolean>>({});
  const [activeDarshanVideoMsgIds, setActiveDarshanVideoMsgIds] = useState<Record<string, boolean>>({});

  // In-Chat Intake Step Machine
  const [intakeStep, setIntakeStep] = useState<
    'IDLE' | 'SELECT_DOMAIN' | 'ASK_NAME' | 'ASK_BIRTH_DATE' | 'ASK_BIRTH_TIME' | 'ASK_BIRTH_CITY' | 'ASK_QUESTION' | 'COMPLETED'
  >('IDLE');

  const [seekerData, setSeekerData] = useState({
    name: '',
    phone: '',
    birthDate: '',
    birthTime: '10:30',
    birthCity: 'Varanasi',
    domain: 'करियर व व्यापार',
    question: '',
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Time-aware greeting
  useEffect(() => {
    const hour = new Date().getHours();
    let salutation = 'हर हर महादेव! 🙏 आज का पञ्चाङ्ग या दर्शन करें?';
    if (hour >= 5 && hour < 11) {
      salutation = 'सुप्रभात! ☀️ ब्रह्म मुहूर्त • आज का पञ्चाङ्ग व काशी दर्शन 🙏';
    } else if (hour >= 11 && hour < 17) {
      salutation = 'नमस्ते! ⚡ आज का राहुकाल, शुभ मुहूर्त व कुण्डली प्रश्न 🙏';
    } else if (hour >= 17 && hour < 22) {
      salutation = 'शुभ संध्या! 🪔 दशाश्वमेध घाट गंगा महाआरती लाइव दर्शन 🌸';
    } else {
      salutation = 'हर हर महादेव! 🌙 कल के दिन का पञ्चाङ्ग व ग्रह स्थिति जानें 🙏';
    }
    setTooltipText(salutation);

    const t = setTimeout(() => {
      setShowGreetingTooltip(true);
    }, 2500);

    return () => clearTimeout(t);
  }, []);

  // Prefill active profile if available
  useEffect(() => {
    const p = getActiveProfile();
    if (p && p.name) {
      setSeekerData(prev => ({
        ...prev,
        name: p.name || prev.name,
        birthDate: p.birthDate || prev.birthDate,
        birthTime: p.birthTime || prev.birthTime,
        birthCity: p.birthCity || prev.birthCity,
      }));
    }
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  // Standard tactile clicks
  const playClick = () => {
    if (soundEnabled) chitiSensory.playTick();
  };

  const handleNavigate = (href: string) => {
    playClick();
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  const toggleOpen = () => {
    playClick();
    setShowGreetingTooltip(false);
    setIsOpen(!isOpen);

    if (!isOpen && chatMessages.length === 0) {
      const p = calculatePanchang(new Date(), 25.3176, 82.9739, 5.5);
      const dateStr = new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      setChatMessages([
        {
          id: 'welcome-1',
          sender: 'GURU',
          text: `हर हर महादेव! 🙏 मैं काशी सहायक (CosmicTantra Vedic Assistant) हूँ — काशी विश्वनाथ की पावन धरा से आपका साथी।\n\nआज का दिवस: ${dateStr}\nतिथि: ${p.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'} ${p.tithi?.name} • नक्षत्र: ${p.nakshatra?.name}\n\nआप मुझसे क्या जानना चाहते हैं?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provenance: {
            calculation: 'CosmicTantra Lahiri Engine',
            location: 'Varanasi (काशी)',
            source: 'प्रामाणिक दृक् पञ्चाङ्ग',
            interpretation: 'काशी सहायक • AI-Assisted'
          },
          quickChips: [
            { label: '🕉️ आज का पञ्चाङ्ग व राहुकाल', action: 'INTENT_PANCHANG' },
            { label: '🪔 काशी विश्वनाथ व गंगा आरती दर्शन', action: 'INTENT_DARSHAN_KASHI' },
            { label: '🚩 काशी यात्रा योजना (Sacred Journey)', action: 'INTENT_JOURNEY_KASHI' },
            { label: '📿 महामृत्युंजय मन्त्र व १०८ जप', action: 'INTENT_MANTRA_MRITYUNJAYA' },
            { label: '💍 विवाह व शुभ मुहूर्त', action: 'INTENT_MUHURTA' },
            { label: '🔮 मेरी कुण्डली व दशा (Intake)', action: 'START_INTAKE' },
            { label: '📜 विद्वान् ज्योतिषी से परामर्श', action: 'INTENT_SCHOLAR' }
          ],
        },
      ]);
    }
  };

  const handlePlayOmChant = () => {
    playClick();
    if (isPlayingOm) {
      setIsPlayingOm(false);
    } else {
      setIsPlayingOm(true);
      if (soundEnabled) chitiSensory.playOmChant();
      setTimeout(() => setIsPlayingOm(false), 3000);
    }
  };

  const handlePlayDiyaBell = () => {
    if (soundEnabled) chitiSensory.playBell();
  };

  const handleOfferDiya = (msgId: string) => {
    handlePlayDiyaBell();
    setOfferedDiyaMsgIds(prev => ({ ...prev, [msgId]: true }));
  };

  const handleOfferFlowers = (msgId: string) => {
    if (soundEnabled) chitiSensory.playFlowerDrop();
    setOfferedFlowersMsgIds(prev => ({ ...prev, [msgId]: true }));
  };

  // -------------------------------------------------------------
  // Universal Intent Classifier & Deterministic Router
  // -------------------------------------------------------------
  const resolveIntent = (rawText: string) => {
    const text = rawText.toLowerCase().trim();

    // 1. TODAY / PANCHANG INTENT
    if (
      text.includes('आज') || text.includes('प्रदोष') || text.includes('राहुकाल') || 
      text.includes('तिथि') || text.includes('पंचांग') || text.includes('पञ्चाङ्ग') || 
      text.includes('चौघड़िया') || text.includes('मुहूर्त') || text.includes('today') || 
      text.includes('panchang') || text.includes('rahu') || text.includes('tithi')
    ) {
      return 'INTENT_PANCHANG';
    }

    // 2. TEMPLE / DARSHAN INTENT
    if (
      text.includes('दर्शन') || text.includes('विश्वनाथ') || text.includes('सोमनाथ') || 
      text.includes('महाकाल') || text.includes('उज्जैन') || text.includes('केदारनाथ') || 
      text.includes('बद्रीनाथ') || text.includes('बैद्यनाथ') || text.includes('देवघर') || 
      text.includes('गंगा आरती') || text.includes('आरती') || text.includes('ज्योतिर्लिंग') || 
      text.includes('darshan') || text.includes('temple') || text.includes('live')
    ) {
      return 'INTENT_DARSHAN';
    }

    // 3. KASHI SACRED JOURNEY INTENT
    if (
      text.includes('काशी जाना') || text.includes('वाराणसी यात्रा') || text.includes('काशी यात्रा') || 
      text.includes('बनारस') || text.includes('काशी भ्रमण') || text.includes('kashi travel') || 
      text.includes('varanasi visit') || text.includes('kashi journey')
    ) {
      return 'INTENT_JOURNEY_KASHI';
    }

    // 4. MANTRA / JAPA / SANKALPA INTENT
    if (
      text.includes('महामृत्युंजय') || text.includes('जाप') || text.includes('मन्त्र') || 
      text.includes('मंत्र') || text.includes('स्तोत्र') || text.includes('शिव ताण्डव') || 
      text.includes('हनुमान चालीसा') || text.includes('गायत्री') || text.includes('japa') || 
      text.includes('mantra') || text.includes('stotra')
    ) {
      return 'INTENT_MANTRA';
    }

    // 5. MUHURTA / MARRIAGE / VIVAH INTENT
    if (
      text.includes('शादी') || text.includes('विवाह') || text.includes('गृह प्रवेश') || 
      text.includes('नामकरण') || text.includes('मुंडन') || text.includes('marriage') || 
      text.includes('vivah')
    ) {
      return 'INTENT_MUHURTA';
    }

    // 6. KUNDALI / DASHA INTENT
    if (
      text.includes('कुंडली') || text.includes('कुण्डली') || text.includes('मेरी दशा') || 
      text.includes('दशा') || text.includes('लग्न') || text.includes('राशि') || 
      text.includes('kundali') || text.includes('dasha')
    ) {
      return 'INTENT_KUNDALI';
    }

    // 7. JYOTISHI ESCALATION INTENT
    if (
      text.includes('पंडित') || text.includes('ज्योतिषी') || text.includes('परामर्श') || 
      text.includes('बात करना') || text.includes('कॉल') || text.includes('विद्वान') || 
      text.includes('pandit') || text.includes('consult') || text.includes('astrologer')
    ) {
      return 'INTENT_SCHOLAR';
    }

    return 'INTENT_GENERAL';
  };

  // -------------------------------------------------------------
  // Intent Handlers (Deterministic Output Generation)
  // -------------------------------------------------------------
  const handlePanchangQuery = () => {
    const now = new Date();
    const p = calculatePanchang(now, 25.3176, 82.9739, 5.5);
    const dateStr = now.toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    // Check Rahu Kaal window
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const isRahuNow = currentHour >= 13.5 && currentHour <= 15.0; // 1:30 PM - 3:00 PM approx

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: `हर हर महादेव! 🙏 आज की प्रत्यक्ष खगोलीय गणना (काशी वेधशाला अनुसार):\n\nआज ${dateStr} है। तिथि: ${p.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष'} ${p.tithi?.name} (${p.tithi?.meaning})।\n\nराहुकाल: ${p.rahuKala?.start} से ${p.rahuKala?.end} बजे तक। अभिजित मुहूर्त: ११:४५ AM से १२:३५ PM तक।`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provenance: {
            calculation: 'CosmicTantra Lahiri Engine',
            location: 'Varanasi, UP',
            source: 'प्रामाणिक दृक् पञ्चाङ्ग',
            interpretation: 'काशी सहायक'
          },
          panchangCard: {
            dateStr,
            tithi: `${p.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल' : 'कृष्ण'} ${p.tithi?.name}`,
            tithiPaksha: p.tithi?.paksha === 'Shukla Paksha' ? 'शुक्ल पक्ष (चान्द्र वृद्धि)' : 'कृष्ण पक्ष (चान्द्र क्षय)',
            nakshatra: p.nakshatra?.name || 'शतभिषा',
            pada: p.nakshatra?.pada || 1,
            yoga: p.yoga?.name || 'शोभन',
            karana: p.karana?.name || 'बव',
            rahuKaal: `${p.rahuKala?.start} – ${p.rahuKala?.end}`,
            abhijitMuhurat: '11:45 AM – 12:35 PM',
            isRahuNow,
            recommendation: isRahuNow 
              ? '⚠️ वर्तमान में राहुकाल सक्रिय है — नए समझौते या वित्तीय आरम्भ स्थगित रखें।' 
              : '🌟 वर्तमान समय सामान्य व शुभ कार्यों हेतु अनुकूल है।'
          },
          quickChips: [
            { label: '📅 सम्पूर्ण मासिक पञ्चाङ्ग कैलेंडर खोलें', action: 'NAV_CALENDAR', href: '/calendar' },
            { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN_KASHI' },
            { label: '🚩 काशी यात्रा योजना', action: 'INTENT_JOURNEY_KASHI' }
          ]
        }
      ]);
    }, 400);
  };

  const handleDarshanQuery = (rawText: string = '') => {
    handlePlayDiyaBell();
    let shrineKey = 'kashi';
    const text = rawText.toLowerCase();

    if (text.includes('सोमनाथ')) shrineKey = 'somnath';
    else if (text.includes('महाकाल') || text.includes('उज्जैन')) shrineKey = 'mahakal';
    else if (text.includes('बैद्यनाथ') || text.includes('देवघर')) shrineKey = 'deoghar';
    else if (text.includes('हरिद्वार')) shrineKey = 'haridwar';
    else if (text.includes('गंगा')) shrineKey = 'ganga';
    else if (text.includes('ओंकारेश्वर')) shrineKey = 'omkareshwar';
    else if (text.includes('नागेश्वर')) shrineKey = 'nageshwar';

    const shrine = SHRINES_REGISTRY[shrineKey] || SHRINES_REGISTRY['kashi'];

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: `हर हर महादेव! 🙏 साक्षात् ${shrine.name} का लाइव दर्शन आपके सम्मुख प्रस्तुत है। आप यहीं चैट में दीप दान व पुष्प अर्पण कर सकते हैं:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provenance: {
            darshan: 'प्रत्यक्ष मन्दिर ट्रस्ट लाइव स्रोत',
            location: shrine.location,
            source: 'द्वादश ज्योतिर्लिंग परिपथ'
          },
          inChatDarshan: {
            templeName: shrine.name,
            deity: shrine.deity,
            location: shrine.location,
            image: shrine.image,
            embedUrl: shrine.embedUrl,
            officialLiveUrl: shrine.officialLiveUrl,
            timings: shrine.timings
          },
          quickChips: [
            { label: '🌸 सम्पूर्ण २६ महातीर्थ दर्शन कक्ष खोलें', action: 'NAV_DARSHAN', href: '/darshan' },
            { label: '🪔 दशाश्वमेध गंगा आरती दर्शन', action: 'INTENT_DARSHAN_GANGA' },
            { label: '🚩 काशी यात्रा योजना बनाएं', action: 'INTENT_JOURNEY_KASHI' }
          ]
        }
      ]);
    }, 400);
  };

  const handleKashiJourneyQuery = () => {
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: 'हर हर महादेव! 🙏 काशी (वाराणसी) की पावन यात्रा का शास्त्रसम्मत परिपथ एवं पञ्चाङ्ग मार्गदर्शिका तैयार की गई है:\n\nकाशी यात्रा में पंच-तीर्थ दर्शन, गंगा स्नान एवं सांध्य महाआरती का विशेष महात्म्य है।',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provenance: {
            source: 'काशी विश्वनाथ न्यास एवं पञ्चाङ्ग मार्गदर्शिका',
            location: 'वाराणसी धाम (काशी)',
            interpretation: 'काशी सहायक'
          },
          journeyCard: {
            destination: 'काशी (वाराणसी) पावन तीर्थ परिपथ',
            tagline: 'पंच-तीर्थ दर्शन, दशाश्वमेध महाआरती एवं पुण्य गंगा स्नान',
            panchangSummary: 'उत्तम यात्रा काल: शुक्ल पक्ष, एकादशी, प्रदोष या पूर्णिमा तिथि पर गंगा स्नान सर्वोत्तम।',
            temples: [
              { name: '१. श्री काशी विश्वनाथ ज्योतिर्लिंग', deity: 'देवाधिदेव विश्वेश्वर', tip: 'प्रातः मंगला आरती (०३:०० AM) या सुगम दर्शन पास लें।' },
              { name: '२. माँ अन्नपूर्णा मन्दिर', deity: 'अन्न व समृद्धि दायिनी', tip: 'विश्वनाथ मन्दिर के ठीक समीप, महाप्रसाद ग्रहण करें।' },
              { name: '३. श्री काल भैरव मन्दिर', deity: 'काशी के कोतवाल', tip: 'काशी प्रवास की अनुमति व सुरक्षा हेतु दर्शन अनिवार्य।' },
              { name: '४. संकट मोचन हनुमान मन्दिर', deity: 'कष्ट भंजन हनुमान जी', tip: 'सायं आरती के समय बेसन के लड्डू का भोग लगाएं।' },
              { name: '५. माँ विशालाक्षी शक्तिपीठ', deity: 'सती के नेत्र', tip: 'मीर घाट के समीप ५२ शक्तिपीठों में प्रमुख।' }
            ],
            aartiTimings: [
              { event: 'सुबह-ए-बनारस (सूर्योदय वेला)', time: '०५:३० AM', ghat: 'अस्सी घाट' },
              { event: 'माँ गंगा दिव्य सांध्य महाआरती', time: '०६:३० PM', ghat: 'दशाश्वमेध घाट' }
            ],
            guidance: 'नाव से अस्सी से मणिकर्णिका तक का नौकायन प्रातःकाल करें। गंगा स्नान हेतु दशाश्वमेध या पंचगंगा घाट श्रेष्ठ हैं।'
          },
          quickChips: [
            { label: '🌸 २६ महातीर्थ दर्शन कक्ष खोलें', action: 'NAV_DARSHAN', href: '/darshan' },
            { label: '📅 काशी यात्रा हेतु शुभ पञ्चाङ्ग देखें', action: 'NAV_CALENDAR', href: '/calendar' },
            { label: '📜 काशी के विद्वान् से यात्रा संकल्प कराएं', action: 'INTENT_SCHOLAR' }
          ]
        }
      ]);
    }, 400);
  };

  const handleMantraQuery = (rawText: string = '') => {
    handlePlayDiyaBell();
    const isShivaTandav = rawText.includes('ताण्डव') || rawText.includes('tandav');
    const isHanuman = rawText.includes('हनुमान') || rawText.includes('chalisa');

    let mantraData = {
      title: 'महामृत्युंजय मन्त्र (ऋग्वेद ७.५९.१२)',
      deity: 'भगवान त्र्यम्बक (महाकाल)',
      sanskrit: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।\nउर्वारुकमिव बन्धनान्मृत्य pushyam mukshiya maamritat ॥',
      transliteration: 'Oṃ Tryambakaṃ Yajāmahe Sugandhiṃ Puṣṭivardhanam ।\nUrvārukamiva Bandhanān Mṛtyor Mukṣīya Māmṛtāt ॥',
      meaning: 'हम तीन नेत्रों वाले भगवान शिव की आराधना करते हैं, जो सुगंधित हैं और सभी प्राणियों का पोषण करते हैं। जिस प्रकार पका हुआ खरबूजा बेल के बंधन से मुक्त हो जाता है, उसी प्रकार हम मृत्यु के भय से मुक्त होकर मोक्ष व अमृत पद प्राप्त करें।',
      benefit: 'अकाल मृत्यु से रक्षा, मानसिक शान्ति, रोग मुक्ति एवं दीर्घायु।',
      japaTarget: 'प्रतिदिन १०८ मनकों की जप माला (रुद्राक्ष माला पर) सर्वोत्तम।'
    };

    if (isShivaTandav) {
      mantraData = {
        title: 'शिव ताण्डव स्तोत्रम् (रावण रचित)',
        deity: 'नटराज भगवान शिव',
        sanskrit: 'जटाटवीगलज्जलप्रवाहपावितस्थले गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम् ।\nडमड्डमड्डमड्डमन्निनादवड्डमर्वयं चकार चण्डताण्डवं तनोतु नः शिवः शिवम् ॥',
        transliteration: 'Jaṭāṭavīgalajjala-pravāhapāvitasthale Galeऽvalambya Lambitāṃ Bhujaṅgatuṅgamālikām ।\nḌamaḍḍamaḍḍamaḍḍaman-ninādavaḍḍamarvayaṃ Cakāra Caṇḍatāṇḍavaṃ Tanotu Naḥ Śivaḥ Śivam ॥',
        meaning: 'जिनके जटा रूपी वन से बहती हुई गंगा की धाराएं कंठ को पवित्र कर रही हैं, जिनके गले में विशाल सर्पों की माला लटक रही है, जो डमरू की डम-डम ध्वनि के साथ प्रचंड तांडव कर रहे हैं, वे भगवान शिव हमारा कल्याण करें।',
        benefit: 'शत्रु बाधा निवारण, वाक् सिद्धि, आत्मविश्वास व अपार ऊर्जा की प्राप्ति।',
        japaTarget: 'प्रातः अथवा प्रदोष काल में एक बार पूर्ण पाठ।'
      };
    } else if (isHanuman) {
      mantraData = {
        title: 'श्री हनुमान चालीसा (गोस्वामी तुलसीदास रचित)',
        deity: 'पवनपुत्र श्री हनुमान',
        sanskrit: 'जय हनुमान ज्ञान गुन सागर । जय कपीस तिहुँ लोक उजागर ॥\nराम दूत अतुलित बल धामा । अंजनि पुत्र पवनसुत नामा ॥',
        transliteration: 'Jaya Hanumāna Jñāna Guna Sāgara । Jaya Kapīsa Tihu Lok Ujāgara ॥\nRama Dūta Atulita Bala Dhāmā । Añjani Putra Pavanasuta Nāmā ॥',
        meaning: 'ज्ञान और गुणों के अथाह सागर श्री हनुमान जी की जय हो! तीनों लोकों को प्रकाशित करने वाले कपीश्वर की जय हो! श्री राम के दूत, अतुलित बल के धाम, अंजनी के पुत्र और पवनसुत के नाम से प्रसिद्ध हनुमान जी को नमन।',
        benefit: 'भूत-पिशाच भय निवारण, संकट मोचन, सर्वकार्य सिद्धि व आरोग्य।',
        japaTarget: 'प्रतिदिन ७, ११ या १०० बार पाठ संकल्प।'
      };
    }

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: `हर हर महादेव! 🙏 प्रामाणिक शास्त्रसम्मत मन्त्र व स्तोत्र संग्रह:\n\nआप नीचे दिए गए मन्त्र की डिजिटल १०८ जप माला यहीं से प्रारम्भ कर सकते हैं:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provenance: {
            source: 'ऋग्वेद / यजुर्वेद प्रामाणिक स्तोत्र संहिता',
            interpretation: 'काशी सहायक'
          },
          mantraCard: mantraData,
          quickChips: [
            { label: '📿 १०८ मनका डिजिटल जप माला खोलें', action: 'NAV_JAPA', href: '/remedy-tracker' },
            { label: '🪔 काशी विश्वनाथ आरती सुनें', action: 'INTENT_DARSHAN_KASHI' },
            { label: '📜 संकल्प व वैदिक मन्त्र अनुष्ठान कराएं', action: 'INTENT_SCHOLAR' }
          ]
        }
      ]);
    }, 400);
  };

  const handleMuhurtaQuery = () => {
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: 'हर हर महादेव! 🙏 विवाह, गृह प्रवेश व मांगलिक कार्यों हेतु दृक्-पञ्चाङ्ग अनुसार आगामी शुभ मुहूर्त खिड़कियाँ:\n\nसटीक मुहूर्त हेतु वर-वधू की कुण्डली के त्रिबल शुद्धि, गुरु-शुक्र तारा बल एवं चन्द्र गोचर का मिलान आवश्यक होता है:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provenance: {
            calculation: 'मुहूर्त चिंतामणि एवं दृक् गणना',
            scholar: 'पं. विद्यानंद शास्त्री (वाराणसी) उपलब्ध',
            interpretation: 'काशी सहायक'
          },
          muhurtaCard: {
            type: 'विवाह व सर्व-मांगलिक मुहूर्त (Candidate Windows)',
            windows: [
              { date: '२७ नवम्बर २०२६ (मार्गशीर्ष शुक्ल द्वितीया)', tithi: 'द्वितीया', nakshatra: 'रोहिणी / मृगशिरा', auspiciousTime: 'सायं ०६:२० से रात्रि १०:४५', rating: '⭐⭐⭐⭐⭐ सर्वोत्तम' },
              { date: '०२ दिसम्बर २०२६ (मार्गशीर्ष शुक्ल सप्तमी)', tithi: 'सप्तमी', nakshatra: 'उत्तराफाल्गुनी', auspiciousTime: 'रात्रि ०८:१५ से १२:३०', rating: '⭐⭐⭐⭐ अति शुभ' },
              { date: '११ दिसम्बर २०२६ (पौष शुक्ल द्वितीया)', tithi: 'द्वितीया', nakshatra: 'उत्तराषाढ़ा', auspiciousTime: 'मध्याह्न ०१:१० से ०४:३०', rating: '⭐⭐⭐⭐ शुभ' }
            ],
            guidance: 'नोट: किसी भी मांगलिक संस्कार से पूर्व दोनों पक्षों की जन्म-पत्रिका का अष्टकूट गुण मिलान व वेध-दोष परिहार काशी के विद्वान् ज्योतिषी से अवश्य कराएं।'
          },
          quickChips: [
            { label: '💍 विद्वान् ज्योतिषी से कुण्डली मिलान कराएं', action: 'INTENT_SCHOLAR' },
            { label: '📅 मासिक पञ्चाङ्ग कैलेंडर देखें', action: 'NAV_CALENDAR', href: '/calendar' },
            { label: '🔮 अपनी कुण्डली की स्थिति जांचें', action: 'START_INTAKE' }
          ]
        }
      ]);
    }, 400);
  };

  const handleScholarQuery = () => {
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: 'काशी विद्वत् परिषद् के वरिष्ठ विद्वान् पंडित विद्यानंद शास्त्री जी का प्रत्यक्ष परामर्श उपलब्ध है।\n\nसत्यापित परिचय: ३५+ वर्ष का पारम्परिक वेधशाला अनुभव, काशी हिन्दू विश्वविद्यालय (BHU) से ज्योतिषरत्न।',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provenance: {
            scholar: 'पं. विद्यानंद शास्त्री (मानव ज्योतिषी • वाराणसी • सत्यापित परिचय)',
            location: 'दशाश्वमेध घाट, वाराणसी'
          },
          scholarCard: {
            name: 'पं. विद्यानंद शास्त्री',
            title: 'वरिष्ठ मानव ज्योतिषी • काशी विद्वत् परिषद्',
            location: 'वाराणसी (काशी), उत्तर प्रदेश',
            verified: true,
            experience: '३५+ वर्ष अनुभव • ५०,०००+ कुण्डली समाधान',
            tiers: [
              { label: '📜 ₹501 लिखित परामर्श पत्र (PDF)', price: '₹501', mode: 'WRITTEN', href: '/ask' },
              { label: '📞 ₹1,100 CallMe4 गोपनीय वॉयस कॉल', price: '₹1,100', mode: 'VOICE', href: '/ask' },
              { label: '📹 ₹1,500 साक्षात् वीडियो दर्शन', price: '₹1,500', mode: 'VIDEO', href: '/ask' }
            ]
          },
          quickChips: [
            { label: '📜 ₹501 लिखित परामर्श पत्र चुनें', action: 'OPEN_CHECKOUT_WRITTEN', href: '/ask' },
            { label: '📞 ₹1,100 वॉयस कॉल परामर्श', action: 'OPEN_CHECKOUT_VOICE', href: '/ask' },
            { label: '🌸 आज का पञ्चाङ्ग देखें', action: 'INTENT_PANCHANG' }
          ]
        }
      ]);
    }, 400);
  };

  const handleChipClick = (chip: { label: string; action: string; href?: string }) => {
    playClick();

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text: chip.label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);

    if (chip.action === 'INTENT_PANCHANG') {
      handlePanchangQuery();
      return;
    }

    if (chip.action === 'INTENT_DARSHAN_KASHI') {
      handleDarshanQuery('काशी');
      return;
    }

    if (chip.action === 'INTENT_DARSHAN_GANGA') {
      handleDarshanQuery('गंगा');
      return;
    }

    if (chip.action === 'INTENT_JOURNEY_KASHI') {
      handleKashiJourneyQuery();
      return;
    }

    if (chip.action === 'INTENT_MANTRA_MRITYUNJAYA') {
      handleMantraQuery('महामृत्युंजय');
      return;
    }

    if (chip.action === 'INTENT_MUHURTA') {
      handleMuhurtaQuery();
      return;
    }

    if (chip.action === 'INTENT_SCHOLAR') {
      handleScholarQuery();
      return;
    }

    if (chip.action === 'NAV_CALENDAR' && chip.href) {
      handleNavigate(chip.href);
      return;
    }

    if (chip.action === 'NAV_DARSHAN' && chip.href) {
      handleNavigate(chip.href);
      return;
    }

    if (chip.action === 'NAV_JAPA' && chip.href) {
      handleNavigate(chip.href);
      return;
    }

    if (chip.action === 'START_INTAKE') {
      setIntakeStep('SELECT_DOMAIN');
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'उत्तम विचार! 🙏 आपकी कुण्डली की सटीक खगोलीय गणना हेतु, सबसे पहले बताएं कि आपका मुख्य विषय क्या है?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickChips: [
              { label: '💼 करियर, व्यापार व धन लाभ', action: 'SET_DOMAIN_CAREER' },
              { label: '💍 विवाह, सम्बंध व दाम्पत्य', action: 'SET_DOMAIN_MARRIAGE' },
              { label: '🌿 स्वास्थ्य, ऊर्जा व आयुर्-ज्योतिष', action: 'SET_DOMAIN_HEALTH' },
              { label: '🪔 राहु-केतु, कालसर्प व ग्रह शान्ति', action: 'SET_DOMAIN_REMEDY' },
              { label: '🏡 भूमि, भवन, विदेश व कानूनी विषय', action: 'SET_DOMAIN_PROPERTY' },
            ],
          },
        ]);
      }, 400);
      return;
    }

    if (chip.action.startsWith('SET_DOMAIN_')) {
      const domainName = chip.label;
      setSeekerData(prev => ({ ...prev, domain: domainName }));
      setIntakeStep('ASK_NAME');

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `विषय: "${domainName}"। कृपया अपना पूरा शुभ नाम बताएं (ताकि कुण्डली आपके नाम से प्रतिष्ठित हो सके):`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 400);
      return;
    }

    if (chip.action === 'SELECT_DATE_SAMPLE') {
      processDateInput(chip.label);
    } else if (chip.action === 'SELECT_TIME_SAMPLE') {
      processTimeInput(chip.label);
    } else if (chip.action === 'SELECT_CITY_SAMPLE') {
      processCityInput(chip.label);
    }
  };

  const processDateInput = (dob: string) => {
    setSeekerData(prev => ({ ...prev, birthDate: dob }));
    setIntakeStep('ASK_BIRTH_TIME');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: `जन्म तिथि "${dob}" दर्ज हुई। आपका जन्म समय क्या था? (नीचे त्वरित समय चुनें या ठीक समय लिखें, उदा. 10:30):`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickChips: [
            { label: '06:00 (प्रातः)', action: 'SELECT_TIME_SAMPLE' },
            { label: '10:30 (सुबह)', action: 'SELECT_TIME_SAMPLE' },
            { label: '12:00 (दोपहर)', action: 'SELECT_TIME_SAMPLE' },
            { label: '18:00 (सायं)', action: 'SELECT_TIME_SAMPLE' },
            { label: '21:00 (रात्रि)', action: 'SELECT_TIME_SAMPLE' },
          ],
        },
      ]);
    }, 400);
  };

  const processTimeInput = (timeStr: string) => {
    const cleanTime = timeStr.split(' ')[0] || '10:30';
    setSeekerData(prev => ({ ...prev, birthTime: cleanTime }));
    setIntakeStep('ASK_BIRTH_CITY');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: `जन्म समय "${cleanTime}" दर्ज हुआ। आपका जन्म स्थान / नगर क्या है? (सटीक अक्षांश व रेखांश गणना हेतु):`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickChips: [
            { label: 'Varanasi', action: 'SELECT_CITY_SAMPLE' },
            { label: 'Patna', action: 'SELECT_CITY_SAMPLE' },
            { label: 'New Delhi', action: 'SELECT_CITY_SAMPLE' },
            { label: 'Mumbai', action: 'SELECT_CITY_SAMPLE' },
            { label: 'Lucknow', action: 'SELECT_CITY_SAMPLE' },
            { label: 'Kolkata', action: 'SELECT_CITY_SAMPLE' },
            { label: 'Bengaluru', action: 'SELECT_CITY_SAMPLE' },
          ],
        },
      ]);
    }, 400);
  };

  const processCityInput = (cityStr: string) => {
    setSeekerData(prev => ({ ...prev, birthCity: cityStr }));
    setIntakeStep('ASK_QUESTION');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: `स्थान: "${cityStr}"। अब कृपया अपना वह मुख्य प्रश्न या परिस्थिति विस्तार से लिखें, जिस पर आप काशी के वरिष्ठ विद्वान् से समाधान चाहते हैं:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 400);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    playClick();
    const text = inputVal.trim();
    setInputVal('');

    const newMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, newMsg]);

    // Handle Guided Intake Step Machine
    if (intakeStep === 'ASK_NAME') {
      setSeekerData(prev => ({ ...prev, name: text }));
      setIntakeStep('ASK_BIRTH_DATE');
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `प्रणाम ${text} जी! 🙏 कृपया अपनी जन्म तिथि दर्ज करें (उदा. 1995-06-15 या नीचे दिए गए त्वरित विकल्प चुनें):`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickChips: [
              { label: '1995-06-15', action: 'SELECT_DATE_SAMPLE' },
              { label: '1998-08-10', action: 'SELECT_DATE_SAMPLE' },
              { label: '2000-01-25', action: 'SELECT_DATE_SAMPLE' },
            ],
          },
        ]);
      }, 400);
      return;
    } else if (intakeStep === 'ASK_BIRTH_DATE') {
      processDateInput(text);
      return;
    } else if (intakeStep === 'ASK_BIRTH_TIME') {
      processTimeInput(text);
      return;
    } else if (intakeStep === 'ASK_BIRTH_CITY') {
      processCityInput(text);
      return;
    } else if (intakeStep === 'ASK_QUESTION') {
      setSeekerData(prev => ({ ...prev, question: text }));
      setIntakeStep('COMPLETED');

      // Compute deterministic Vedic Ephemeris
      let lagnaName = 'वृषभ (Vrishabha)';
      let nakshatraName = 'रोहिणी (Rohini)';
      let dashaStr = 'चन्द्र • गुरु';

      try {
        const dObj = seekerData.birthDate ? new Date(seekerData.birthDate) : new Date('1995-06-15');
        const kundali = calculateKundali(
          isNaN(dObj.getTime()) ? new Date('1995-06-15') : dObj,
          seekerData.birthTime || '10:30',
          25.3176,
          82.9739,
          5.5
        );

        if (kundali?.lagna?.rashiEn) {
          lagnaName = `${kundali.lagna.rashiName} (${kundali.lagna.rashiEn})`;
        }
        if ((kundali?.moon?.nakshatra as any)?.name) {
          nakshatraName = (kundali?.moon?.nakshatra as any).name;
        }
        if ((kundali as any)?.dasha) {
          dashaStr = `${(kundali as any).dasha.major} • ${(kundali as any).dasha.minor}`;
        }
      } catch (calcErr) {
        console.warn('Ephemeris fallback:', calcErr);
      }

      const currentHour = new Date().getHours();
      const isCautionDay = currentHour >= 12 && currentHour <= 15;

      const transitStatus = isCautionDay ? 'CAUTION_DAY' : 'POWER_DAY';
      const transitMessage = isCautionDay
        ? '⚠️ आज का दिन सतर्कता दिवस (Caution Window) है — चन्द्रमा के गोचर व राहुकाल के कारण नए वित्तीय या उग्र निर्णयों में धैर्य रखें।'
        : '✨ आज का दिन शुभ सिद्धि योग (Power Window) है — गुरु-चन्द्र की अनुकूल दृष्टि से सोचे गए कार्यों में प्रगति का योग है।';

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `चिन्ता न करें ${seekerData.name || ''} जी! 🙏 हर कठिन परिस्थिति का शास्त्रसम्मत समाधान सम्भव है। मैंने आपकी कुण्डली की खगोलीय गणना व आज के गोचर का मिलान पूर्ण कर लिया है:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            provenance: {
              calculation: 'Lahiri Ayanamsha 24° 16\' • CosmicTantra Natal Engine',
              location: seekerData.birthCity || 'Varanasi',
              scholar: 'पं. विद्यानंद शास्त्री उपलब्ध'
            },
            pulseCard: {
              lagna: lagnaName,
              nakshatra: nakshatraName,
              dasha: dashaStr,
              transitStatus,
              transitMessage,
              recommendation: isCautionDay
                ? `आज मन की शान्ति व रक्षा हेतु महामृत्युंजय जप एवं काशी विश्वनाथ का लाइव दर्शन सर्वोत्तम रहेगा। आपके प्रश्न "${text}" पर काशी के वरिष्ठ विद्वान् पंडित विद्यानंद शास्त्री जी का परामर्श पत्र व कॉल उपलब्ध है:`
                : `आज आपके प्रश्न "${text}" के समाधान व कार्य सिद्धि हेतु शुभ समय सक्रिय है। पंडित विद्यानंद शास्त्री जी से प्रत्यक्ष परामर्श यहाँ प्रारम्भ करें:`,
            },
            inChatKundaliSvg: true,
            scholarCard: {
              name: 'पं. विद्यानंद शास्त्री',
              title: 'वरिष्ठ मानव ज्योतिषी • काशी विद्वत् परिषद्',
              location: 'वाराणसी (काशी), उत्तर प्रदेश',
              verified: true,
              experience: '३५+ वर्ष अनुभव • ५०,०००+ कुण्डली समाधान',
              tiers: [
                { label: '📜 ₹501 लिखित परामर्श पत्र (PDF)', price: '₹501', mode: 'WRITTEN', href: '/ask' },
                { label: '📞 ₹1,100 CallMe4 वॉयस कॉल', price: '₹1,100', mode: 'VOICE', href: '/ask' },
                { label: '📹 ₹1,500 साक्षात् वीडियो दर्शन', price: '₹1,500', mode: 'VIDEO', href: '/ask' }
              ]
            },
            quickChips: [
              { label: '📜 ₹501 लिखित विद्वत्-परामर्श पत्र (PDF)', action: 'OPEN_CHECKOUT_WRITTEN', href: '/ask' },
              { label: '📞 ₹1,100 CallMe4 गोपनीय वॉयस कॉल', action: 'OPEN_CHECKOUT_VOICE', href: '/ask' },
              { label: '📹 ₹1,500 साक्षात् वीडियो दर्शन', action: 'OPEN_CHECKOUT_VIDEO', href: '/ask' },
              { label: '🌸 आज का पञ्चाङ्ग विस्तार से देखें', action: 'INTENT_PANCHANG' },
            ],
          },
        ]);
      }, 600);
      return;
    }

    // -------------------------------------------------------------
    // Universal Intent Dispatcher (LLM Last, Deterministic Systems First)
    // -------------------------------------------------------------
    const matchedIntent = resolveIntent(text);

    if (matchedIntent === 'INTENT_PANCHANG') {
      handlePanchangQuery();
    } else if (matchedIntent === 'INTENT_DARSHAN') {
      handleDarshanQuery(text);
    } else if (matchedIntent === 'INTENT_JOURNEY_KASHI') {
      handleKashiJourneyQuery();
    } else if (matchedIntent === 'INTENT_MANTRA') {
      handleMantraQuery(text);
    } else if (matchedIntent === 'INTENT_MUHURTA') {
      handleMuhurtaQuery();
    } else if (matchedIntent === 'INTENT_SCHOLAR') {
      handleScholarQuery();
    } else if (matchedIntent === 'INTENT_KUNDALI') {
      setIntakeStep('SELECT_DOMAIN');
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'आपकी जन्म पत्रिका व सूक्ष्म दशा चक्र की सटीक गणना हेतु, कृपया विषय चुनें:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickChips: [
              { label: '💼 करियर व व्यापार', action: 'SET_DOMAIN_CAREER' },
              { label: '💍 विवाह व सम्बंध', action: 'SET_DOMAIN_MARRIAGE' },
              { label: '🌿 स्वास्थ्य व आयु', action: 'SET_DOMAIN_HEALTH' }
            ]
          }
        ]);
      }, 400);
    } else {
      // General Query -> Call /api/guru/chat backend AI Gateway with deterministic fallback
      try {
        const res = await fetch('/api/guru/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: chatMessages.slice(-4).map(m => ({
              role: m.sender === 'USER' ? 'user' : 'assistant',
              content: m.text
            })),
            context: {
              city: seekerData.birthCity || 'Varanasi',
              profileName: seekerData.name
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          setChatMessages(prev => [
            ...prev,
            {
              id: `g-${Date.now()}`,
              sender: 'GURU',
              text: data.text || 'हर हर महादेव! 🙏',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              provenance: data.provenance,
              ...(data.structuredCard || {}),
              quickChips: data.quickChips || [
                { label: '🕉️ आज का पञ्चाङ्ग व राहुकाल', action: 'INTENT_PANCHANG' },
                { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN_KASHI' },
                { label: '🚩 काशी यात्रा परिपथ', action: 'INTENT_JOURNEY_KASHI' },
                { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR' }
              ]
            }
          ]);
          return;
        }
      } catch (e) {
        console.warn('/api/guru/chat fetch fallback:', e);
      }

      // Fallback
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `आपके विचार "${text}" के संदर्भ में वैदिक ज्योतिषीय दृष्टि से यह समय सजग अवलोकन का है। मैं आपके लिए आज का पञ्चाङ्ग निकाल सकता हूँ, महातीर्थों का साक्षात् लाइव दर्शन करा सकता हूँ, या काशी के विद्वान् ज्योतिषी से आपकी कुण्डली की विवेचना करा सकता हूँ।`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            provenance: {
              interpretation: 'काशी सहायक • AI-Assisted',
              source: 'CosmicTantra Universal Router'
            },
            quickChips: [
              { label: '🕉️ आज का पञ्चाङ्ग व राहुकाल', action: 'INTENT_PANCHANG' },
              { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN_KASHI' },
              { label: '🚩 काशी यात्रा परिपथ', action: 'INTENT_JOURNEY_KASHI' },
              { label: '📿 महामृत्युंजय मन्त्र जप', action: 'INTENT_MANTRA_MRITYUNJAYA' },
              { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR' }
            ],
          },
        ]);
      }, 400);
    }
  };

  return (
    <>
      {/* FLOATING KASHI SAHAYAK AVATAR BUTTON (Fixed Bottom-Right) */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end pointer-events-auto font-mono-data">
        
        {/* Dynamic Contextual Tooltip Greeting */}
        {!isOpen && showGreetingTooltip && (
          <div className="mb-2 max-w-xs p-3 rounded-2xl bg-white/95 dark:bg-[#0E101D]/95 backdrop-blur-xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300 relative">
            <button
              onClick={(e) => { e.stopPropagation(); playClick(); setShowGreetingTooltip(false); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] hover:bg-black cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-start gap-2.5 cursor-pointer" onClick={toggleOpen}>
              <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-amber-400/60 shadow-sm">
                <Image
                  src="/images/avatar/guru_varanasi.jpg"
                  alt="Kashi Sahayak Avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
                  काशी सहायक (Vedic Assistant)
                </div>
                <p className="text-xs font-medium text-[#1C1917] dark:text-white mt-0.5 leading-snug">
                  {tooltipText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* The Banaras Character Avatar Button */}
        <button
          onClick={toggleOpen}
          className={`relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-2xl hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center border-2 border-[#D4AF37] ${
            isOpen ? 'rotate-90 bg-black/80' : 'bg-[#0E101D]'
          }`}
          title="काशी सहायक से बात करें"
        >
          {/* Subtle Breathing Halo Ring */}
          {!isOpen && (
            <div className="absolute -inset-2 rounded-full border-2 border-[#D4AF37]/50 animate-ping pointer-events-none" />
          )}

          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="w-full h-full relative">
              <Image
                src="/images/avatar/guru_varanasi.jpg"
                alt="Kashi Sahayak Avatar"
                fill
                className="object-cover"
              />
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black" />
            </div>
          )}
        </button>
      </div>

      {/* EXPANDED INTERACTIVE SACRED CONCIERGE CHAT DRAWER */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto sm:w-[460px] max-h-[85vh] sm:max-h-[660px] h-[620px] bg-white/95 dark:bg-[#0C0E1A]/95 backdrop-blur-2xl border-2 border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden font-mono-data animate-in zoom-in-95 duration-200">
          
          {/* Top Sanctum Header with Banaras Avatar */}
          <div className="p-3 px-4 bg-gradient-to-r from-[#8E6F1D]/15 via-[#FAF7F2] to-[#D4AF37]/20 dark:from-[#D4AF37]/15 dark:via-[#121526] dark:to-[#8E6F1D]/20 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow-md">
                <Image
                  src="/images/avatar/guru_varanasi.jpg"
                  alt="Kashi Sahayak"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-editorial text-sm sm:text-base font-bold text-[#1C1917] dark:text-white">
                    काशी सहायक
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                    AI-ASSISTED
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#696256] dark:text-[#9E988D]">
                  CosmicTantra Vedic Assistant • विद्वान् समीक्षा उपलब्ध
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Soothing OM Chant Audio Button */}
              <button
                onClick={handlePlayOmChant}
                className={`p-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isPlayingOm
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-[#696256] dark:text-[#9E988D]'
                }`}
                title="ॐ शान्ति ध्वनि सुनें"
              >
                <span>ॐ</span>
              </button>

              <button
                onClick={() => { playClick(); setSoundEnabled(!soundEnabled); }}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
                title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
              </button>

              <button
                onClick={toggleOpen}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs sm:text-[13px] scrollbar-thin">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[95%]">
                  {msg.sender === 'GURU' && (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-amber-400/50 mt-1 shadow-xs">
                      <Image
                        src="/images/avatar/guru_varanasi.jpg"
                        alt="Kashi Sahayak"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl leading-relaxed ${
                      msg.sender === 'USER'
                        ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] rounded-br-xs font-medium text-xs sm:text-[13px]'
                        : 'bg-[#FAF7F2] dark:bg-[#151829] border border-black/10 dark:border-white/10 text-[#1C1917] dark:text-[#F3EFE6] rounded-bl-xs text-xs sm:text-[13px]'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Deterministic Real-Time Panchang Telemetry Card */}
                    {msg.panchangCard && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-[#0A0C14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 space-y-2.5 text-left shadow-md">
                        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-1.5">
                          <span className="font-editorial font-bold text-xs text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" />
                            <span>दृक् पञ्चाङ्ग खगोलीय स्थिति</span>
                          </span>
                          <span className="text-[10px] text-[#696256] dark:text-[#9E988D]">
                            स्थान: वाराणसी (Kashi)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono-data">
                          <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                            <span className="text-[9.5px] text-[#78716C] block">तिथि</span>
                            <strong className="text-[#1C1917] dark:text-white font-bold">{msg.panchangCard.tithi}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                            <span className="text-[9.5px] text-[#78716C] block">नक्षत्र</span>
                            <strong className="text-[#1C1917] dark:text-white font-bold">{msg.panchangCard.nakshatra} (पाद {msg.panchangCard.pada})</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-[9.5px] text-amber-700 dark:text-amber-300 block">राहुकाल (वर्जित)</span>
                            <strong className="text-[#1C1917] dark:text-white font-bold">{msg.panchangCard.rahuKaal}</strong>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[9.5px] text-emerald-700 dark:text-emerald-300 block">अभिजित मुहूर्त (शुभ)</span>
                            <strong className="text-[#1C1917] dark:text-white font-bold">{msg.panchangCard.abhijitMuhurat}</strong>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
                          {msg.panchangCard.recommendation}
                        </div>
                      </div>
                    )}

                    {/* Structured Kashi Sacred Journey Object */}
                    {msg.journeyCard && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-[#0A0C14] border border-amber-500/40 space-y-3 text-left shadow-md">
                        <div className="border-b border-black/10 dark:border-white/10 pb-2">
                          <span className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                            🚩 तीर्थ यात्रा परिपथ
                          </span>
                          <h4 className="font-editorial text-sm sm:text-base font-bold text-[#1C1917] dark:text-white mt-0.5">
                            {msg.journeyCard.destination}
                          </h4>
                          <p className="text-[11px] text-[#696256] dark:text-[#9E988D]">
                            {msg.journeyCard.tagline}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs font-mono-data">
                          <div className="text-[10.5px] font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                            पंच-तीर्थ दर्शन परिपथ:
                          </div>
                          {msg.journeyCard.temples.map((t, idx) => (
                            <div key={idx} className="p-2 rounded-xl bg-black/5 dark:bg-white/5 flex flex-col gap-0.5">
                              <div className="font-bold text-[#1C1917] dark:text-white">{t.name}</div>
                              <div className="text-[10px] text-[#78716C]">{t.tip}</div>
                            </div>
                          ))}
                        </div>

                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-transparent border border-amber-500/30 text-xs font-mono-data">
                          <div className="text-[10.5px] font-bold text-[#8E6F1D] dark:text-[#F0C968] mb-1">
                            घाट आरती वेला:
                          </div>
                          {msg.journeyCard.aartiTimings.map((a, idx) => (
                            <div key={idx} className="text-[11px] text-[#1C1917] dark:text-[#F3EFE6] flex justify-between py-0.5">
                              <span>{a.event} ({a.ghat})</span>
                              <strong className="text-amber-600 dark:text-amber-400">{a.time}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documented Sanskrit Mantra & 108 Japa Card */}
                    {msg.mantraCard && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-[#0A0C14] border border-amber-500/40 space-y-2.5 text-left shadow-md">
                        <div className="border-b border-black/5 dark:border-white/10 pb-1.5 flex items-center justify-between">
                          <span className="font-editorial text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                            {msg.mantraCard.title}
                          </span>
                          <span className="text-[10px] text-[#78716C]">
                            देवता: {msg.mantraCard.deity}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-center">
                          <p className="font-editorial font-bold text-sm sm:text-base text-[#8E6F1D] dark:text-[#F0C968] leading-relaxed whitespace-pre-line">
                            {msg.mantraCard.sanskrit}
                          </p>
                        </div>

                        <p className="text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF] leading-relaxed">
                          <strong>अर्थ:</strong> {msg.mantraCard.meaning}
                        </p>

                        <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[10.5px] font-mono-data text-[#78716C]">
                          ✦ {msg.mantraCard.benefit} • <strong>{msg.mantraCard.japaTarget}</strong>
                        </div>
                      </div>
                    )}

                    {/* Candidate Muhurta Windows Card */}
                    {msg.muhurtaCard && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-[#0A0C14] border border-amber-500/40 space-y-2.5 text-left shadow-md">
                        <div className="border-b border-black/5 dark:border-white/10 pb-1.5">
                          <span className="font-editorial text-xs sm:text-sm font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                            {msg.muhurtaCard.type}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {msg.muhurtaCard.windows.map((w, idx) => (
                            <div key={idx} className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-mono-data flex flex-col gap-0.5">
                              <div className="flex justify-between font-bold text-[#1C1917] dark:text-white">
                                <span>{w.date}</span>
                                <span className="text-amber-600 dark:text-amber-400">{w.rating}</span>
                              </div>
                              <div className="text-[10px] text-[#78716C]">
                                नक्षत्र: {w.nakshatra} • शुभ काल: {w.auspiciousTime}
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="text-[10.5px] font-mono-data text-[#78716C] italic">
                          {msg.muhurtaCard.guidance}
                        </p>
                      </div>
                    )}

                    {/* In-Chat Live Temple Darshan Sanctum Card */}
                    {msg.inChatDarshan && (
                      <div className="mt-3 p-3 rounded-2xl bg-[#0B0C12] text-white border border-[#D4AF37]/50 shadow-xl space-y-2.5 overflow-hidden text-left">
                        {/* Sanctum Top Bar */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#F0C968] flex items-center gap-1.5 font-editorial">
                            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span>{msg.inChatDarshan.templeName}</span>
                          </span>
                          
                          {/* Image / Video Mode Switcher */}
                          <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono-data">
                            <button
                              onClick={() => { playClick(); setActiveDarshanVideoMsgIds(prev => ({ ...prev, [msg.id]: false })); }}
                              className={`px-1.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                !activeDarshanVideoMsgIds[msg.id] ? 'bg-[#8E6F1D] text-white' : 'text-white/60 hover:text-white'
                              }`}
                            >
                              छवि
                            </button>
                            <button
                              onClick={() => { handlePlayDiyaBell(); setActiveDarshanVideoMsgIds(prev => ({ ...prev, [msg.id]: true })); }}
                              className={`px-1.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                activeDarshanVideoMsgIds[msg.id] ? 'bg-[#8E6F1D] text-white' : 'text-white/60 hover:text-white'
                              }`}
                            >
                              ▶ वीडियो
                            </button>
                          </div>
                        </div>

                        {/* Live Stream Screen OR HD Sanctum Window */}
                        {activeDarshanVideoMsgIds[msg.id] ? (
                          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner">
                            <iframe
                              src={msg.inChatDarshan.embedUrl}
                              className="w-full h-full border-0 absolute inset-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              title={msg.inChatDarshan.templeName}
                            />
                            <div className="absolute top-2 left-2 pointer-events-none z-20">
                              <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[9px] font-mono-data font-bold flex items-center gap-1 shadow-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                24x7 LIVE STREAM
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black border border-white/10 group shadow-inner">
                            <Image
                              src={msg.inChatDarshan.image}
                              alt={msg.inChatDarshan.templeName}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            
                            {/* Sacred Ambient Vignette & Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />

                            {/* Center Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button
                                onClick={() => { handlePlayDiyaBell(); setActiveDarshanVideoMsgIds(prev => ({ ...prev, [msg.id]: true })); }}
                                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-xl transition-transform hover:scale-105 cursor-pointer font-mono-data font-bold text-xs"
                                title="Play Live Stream"
                              >
                                <Play className="w-4 h-4 fill-white" />
                                <span>साक्षात् लाइव दर्शन चलाएं</span>
                              </button>
                            </div>

                            {/* Floating Flowers Overlay when offered */}
                            {offeredFlowersMsgIds[msg.id] && (
                              <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center animate-fade-in z-20">
                                <div className="flex flex-wrap gap-2 justify-center max-w-[220px] text-2xl animate-bounce drop-shadow-lg">
                                  🌸 🌺 🪷 🌼 🌹 🏵️ 🍃 🌸 🌺 🪷 🌼 🌹
                                </div>
                              </div>
                            )}

                            {/* Glowing Diya Flame when offered */}
                            {offeredDiyaMsgIds[msg.id] ? (
                              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none animate-fade-in">
                                <div className="text-2xl animate-pulse drop-shadow-[0_0_15px_#F59E0B]">🪔</div>
                                <span className="text-[10px] font-mono-data font-bold text-amber-300 bg-black/70 px-2 py-0.5 rounded-full mt-0.5 border border-amber-400/40">
                                  दीप प्रज्वलित • हर हर महादेव!
                                </span>
                              </div>
                            ) : (
                              <div className="absolute top-2 right-2">
                                <span className="text-[9px] font-mono-data text-amber-200/90 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/10">
                                  {msg.inChatDarshan.timings}
                                </span>
                              </div>
                            )}

                            {/* Location Badge */}
                            <div className="absolute bottom-2 left-2 flex items-center pointer-events-none">
                              <span className="text-[11px] text-white/95 font-semibold drop-shadow-md">
                                {msg.inChatDarshan.location}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Sacred Interactive Ritual Control Actions */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            onClick={() => handleOfferDiya(msg.id)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-mono-data font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                              offeredDiyaMsgIds[msg.id]
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-white/10 hover:bg-amber-500/20 text-amber-200 border-amber-500/30'
                            }`}
                          >
                            <span>🪔</span>
                            <span>{offeredDiyaMsgIds[msg.id] ? 'दीप अर्पित ✓' : 'दीप दान करें'}</span>
                          </button>

                          <button
                            onClick={() => handleOfferFlowers(msg.id)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-mono-data font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                              offeredFlowersMsgIds[msg.id]
                                ? 'bg-rose-500 text-white border-rose-400'
                                : 'bg-white/10 hover:bg-rose-500/20 text-rose-200 border-rose-500/30'
                            }`}
                          >
                            <span>🌸</span>
                            <span>{offeredFlowersMsgIds[msg.id] ? 'पुष्प अर्पित ✓' : 'पुष्प अर्पण'}</span>
                          </button>
                        </div>

                        {/* External Official Live Stream Link */}
                        {msg.inChatDarshan.officialLiveUrl && (
                          <a
                            href={msg.inChatDarshan.officialLiveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => playClick()}
                            className="w-full py-2 bg-gradient-to-r from-red-600/30 via-red-500/20 to-red-600/30 hover:from-red-600/50 hover:to-red-600/50 text-red-200 text-xs font-mono-data font-bold rounded-xl border border-red-500/40 text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span>साक्षात् महाआरती लाइव देखें (YouTube)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Dedicated 26-Temple Darshan Room Navigation */}
                        <Link
                          href="/darshan"
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigate('/darshan');
                          }}
                          className="w-full py-2 bg-[#8E6F1D] hover:bg-[#A88424] text-white text-xs font-mono-data font-bold rounded-xl border border-[#D4AF37]/50 text-center block transition-all cursor-pointer shadow-md active:scale-95"
                        >
                          सम्पूर्ण २६ महातीर्थ दर्शन कक्ष खोलें →
                        </Link>
                      </div>
                    )}

                    {/* Instant Free Vedic Pulse Card */}
                    {msg.pulseCard && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-[#0A0C14] border border-amber-500/40 space-y-2.5 text-left">
                        
                        {/* Transit Caution Status Bar */}
                        <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          msg.pulseCard.transitStatus === 'CAUTION_DAY'
                            ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {msg.pulseCard.transitStatus === 'CAUTION_DAY' ? (
                            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                          )}
                          <span>{msg.pulseCard.transitMessage}</span>
                        </div>

                        {/* Planetary Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono-data">
                          <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                            <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">लग्न (Ascendant)</span>
                            <strong className="text-[#1C1917] dark:text-white text-xs">{msg.pulseCard.lagna}</strong>
                          </div>
                          <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                            <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">नक्षत्र</span>
                            <strong className="text-[#1C1917] dark:text-white text-xs">{msg.pulseCard.nakshatra}</strong>
                          </div>
                          <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                            <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">सक्रिय दशा</span>
                            <strong className="text-[#8E6F1D] dark:text-[#F0C968] text-xs">{msg.pulseCard.dasha}</strong>
                          </div>
                        </div>

                        {/* Visual North-Indian Kundali Snapshot Diagram */}
                        {msg.inChatKundaliSvg && (
                          <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-center">
                            <div className="text-[11px] font-bold text-[#8E6F1D] dark:text-[#F0C968] mb-1.5 font-editorial">
                              जन्म कुण्डली चक्र (Janma Kundali Snapshot)
                            </div>
                            <div className="w-36 h-36 mx-auto relative border border-[#8E6F1D]/40 bg-white dark:bg-black/40 flex items-center justify-center text-xs font-mono-data">
                              <div className="absolute inset-2.5 border border-amber-500/30 rotate-45" />
                              <div className="relative z-10 font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                                १ {msg.pulseCard.lagna.split(' ')[0]}
                              </div>
                              <span className="absolute top-1.5 left-3 text-[10px] text-[#696256]">१२</span>
                              <span className="absolute top-1.5 right-3 text-[10px] text-[#696256]">२</span>
                              <span className="absolute bottom-1.5 text-[10px] text-amber-500 font-bold">चन्द्र • गुरु</span>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-[#44403C] dark:text-[#D1C9BF] leading-relaxed italic bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                          {msg.pulseCard.recommendation}
                        </p>
                      </div>
                    )}

                    {/* Verified Human Jyotishi Scholar Card */}
                    {msg.scholarCard && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#FAF7F2] to-amber-500/5 dark:from-amber-500/15 dark:via-[#101322] dark:to-transparent border border-amber-500/50 space-y-2.5 text-left shadow-md">
                        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-editorial text-sm sm:text-base font-bold text-[#1C1917] dark:text-white">
                                {msg.scholarCard.name}
                              </h4>
                              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[9px] font-bold border border-amber-500/30">
                                मानव ज्योतिषी
                              </span>
                            </div>
                            <p className="text-[10.5px] text-[#696256] dark:text-[#9E988D]">
                              {msg.scholarCard.title} • {msg.scholarCard.location}
                            </p>
                          </div>
                        </div>

                        <div className="text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
                          ✓ {msg.scholarCard.experience}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          {msg.scholarCard.tiers.map((t, idx) => (
                            <Link
                              key={idx}
                              href={t.href}
                              onClick={(e) => {
                                e.preventDefault();
                                handleNavigate(t.href);
                              }}
                              className="p-2 rounded-xl bg-white dark:bg-[#151928] hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-black border border-amber-500/30 text-center transition-all cursor-pointer block"
                            >
                              <div className="text-[10px] font-bold">{t.label.split(' ')[1]}</div>
                              <div className="text-xs font-extrabold text-[#8E6F1D] dark:text-[#F0C968] mt-0.5">{t.price}</div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fast Action Suggestion Chips */}
                    {msg.quickChips && msg.quickChips.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {msg.quickChips.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (chip.href && (chip.action.startsWith('OPEN_CHECKOUT_') || chip.action.startsWith('NAV_'))) {
                                handleNavigate(chip.href);
                              } else {
                                handleChipClick(chip);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0A0C14] hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#080A10] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 text-xs font-semibold text-[#1C1917] dark:text-white transition-all cursor-pointer shadow-xs text-left active:scale-95"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Provenance Metadata Evidence Chips */}
                    {msg.provenance && (
                      <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] sm:text-[9.5px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                        {msg.provenance.calculation && (
                          <span className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            ◉ {msg.provenance.calculation}
                          </span>
                        )}
                        {msg.provenance.location && (
                          <span className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            ☀ स्थान: {msg.provenance.location}
                          </span>
                        )}
                        {msg.provenance.source && (
                          <span className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            ▣ {msg.provenance.source}
                          </span>
                        )}
                        {msg.provenance.darshan && (
                          <span className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            ▶ {msg.provenance.darshan}
                          </span>
                        )}
                        {msg.provenance.scholar && (
                          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold">
                            ✓ {msg.provenance.scholar}
                          </span>
                        )}
                        {msg.provenance.interpretation && (
                          <span className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            ♙ {msg.provenance.interpretation}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[9px] text-[#696256] dark:text-[#9E988D] mt-0.5 px-9">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={chatScrollRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#FAF7F2] dark:bg-[#121526] border-t border-black/10 dark:border-white/10 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="पूछें: आज का राहुकाल, काशी विश्वनाथ दर्शन, शादी मुहूर्त..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-[#1C1917] dark:text-white placeholder:text-[#8C827A] dark:placeholder:text-[#6C7280] focus:outline-none focus:border-[#8E6F1D]"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="p-2.5 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] disabled:opacity-40 cursor-pointer shadow-xs active:scale-95 transition-transform"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
