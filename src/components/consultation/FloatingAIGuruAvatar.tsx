'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Menu,
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
  AlertTriangle,
  RotateCcw,
  Bell,
  BellOff
} from 'lucide-react';
import { getActiveProfile, upsertProfile, setActiveProfileId } from '@/lib/profileStore';
import { parseBirthTime, parseBirthDate, resolveBirthCity, CityChoice } from '@/lib/ai/intakeParsing';
import { CITIES } from '@/lib/cities';
import { calculateKundali } from '@/lib/astrologyEngine';
import { getCanonicalPanchangBundle, DEFAULT_LOCATION } from '@/lib/panchangFactBundle';
import { chitiSensory, playBell, playConch, playDiya, playFlowerDrop, playTick } from '@/lib/chitiAudio';
import { MOOD_OPTIONS, MOOD_QUESTION_HI, getMoodById } from '@/lib/ai/moodOptions';
import { resolveDeterministicKashiIntent } from '@/lib/ai/kashiIntentEngine';
import { buildScholarHandoverPacket, type ScholarHandoverPacket } from '@/lib/kashi/scholarHandover';
import { KASHI_JOURNEY_CONTEXT_EVENT, type KashiJourneyContext } from '@/lib/kashi/journeyContext';
import {
  createConversationState, normalizeUtterance, matchIntent, extractEntities, applyEntities,
  suspendFlow, resumeFlow, resumePromptHi, nextMissingSlot, INTAKE_SLOT_QUESTION_HI,
  routeFollowUp, recordFact, detectLifeConcern, lifeConcernReply, LIFE_PATHWAY_CHIPS,
  nextBestActions, INTERRUPTING_INTENTS, INTENT_LABEL_HI,
  normalizeBirthDateInput, normalizeBirthTimeInput,
  type ConversationState, type ConversationalIntent, type FlowFrame,
} from '@/lib/kashi/conversationCore';
import { useKashiSahayak } from '@/hooks/useKashiSahayak';
import { KashiComposer } from '@/components/kashi/KashiComposer';
import {
  GRANTH_RECITALS, recitalById, loadRecitalUnits, loadRecitalPassages, recitalSpeech,
  type RecitalPassage,
} from '@/lib/kashi/granthRecitals';
import { KashiVerseCard } from '@/components/kashi/KashiVerseCard';
import { KashiClarification, KashiQuickActions } from '@/components/kashi/KashiClarification';
import type { EmotionId } from '@/lib/kashi/emotionalSupport';
import { ScriptureInsight, SCRIPTURE_WISDOM_REGISTRY, findScriptureInsight } from '@/lib/ai/scriptureMap';
import type { ConversationPanchangContext } from '@/lib/ai/dateIntelligence';

/** Existing mood chips -> Kashi emotional-support paths. */
const MOOD_TO_EMOTION: Record<string, EmotionId> = {
  MOOD_CALM: 'spiritual',
  MOOD_ANXIOUS: 'anxiety',
  MOOD_SAD: 'sadness',
  MOOD_ANGRY: 'anger',
  MOOD_CONFUSED: 'confusion',
  MOOD_TIRED: 'stress',
};
import { useKashiVoice } from '@/lib/ai/useKashiVoice';
import { shouldAutoAdvance, speechRateFor } from '@/lib/granth/session';
import { getChatSafetyReply } from '@/lib/ai/chatSafety';

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
  speakText?: string;
  timestamp: string;
  provenance?: ProvenanceMeta;
  scriptureCard?: ScriptureInsight;
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
    /** Executive 6-Dimension Life Gauges — same kernel /report uses. */
    gauges?: Array<{ titleHi: string; score: number; levelHi: string }>;
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
  recitalCard?: {
    recitalId: string;
    recitalTitleHi: string;
    unitLabelHi: string;
    passages: RecitalPassage[];
    readerHref?: string;
  };
  quickChips?: Array<{ label: string; action: string; href?: string }>;
}

const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
function toHindiDigits(str: string | number | undefined): string {
  if (!str) return '';
  return String(str).replace(/[0-9]/g, (d) => HINDI_DIGITS[parseInt(d, 10)]);
}

// ---------------------------------------------------------------------
// Capability Quick-Chips — "what do you need today?" (shown right after
// the emotional check-in so the seeker sees every offering at a glance)
// ---------------------------------------------------------------------
const CAPABILITY_CHIPS: Array<{ label: string; action: string; href?: string }> = [
  { label: '🕉️ आज का पञ्चाङ्ग व राहुकाल', action: 'INTENT_PANCHANG' },
  { label: '🪔 काशी विश्वनाथ व गंगा आरती दर्शन', action: 'INTENT_DARSHAN_KASHI' },
  { label: '🔮 मेरी कुण्डली व दशा (Intake)', action: 'START_INTAKE' },
  { label: '💍 विवाह व शुभ मुहूर्त', action: 'INTENT_MUHURTA' },
  { label: '📿 महामृत्युंजय मन्त्र व १०८ जप', action: 'INTENT_MANTRA_MRITYUNJAYA' },
  { label: '🚩 काशी यात्रा योजना (Sacred Journey)', action: 'INTENT_JOURNEY_KASHI' },
  { label: '📜 विद्वान् ज्योतिषी से परामर्श', action: 'INTENT_SCHOLAR' },
  { label: '📖 ग्रंथ पाठ व स्वर-वाचन (८ शास्त्र)', action: 'GRANTH_MENU' },
  { label: '📞 पंडित जी से सीधी बात (VIP Concierge)', action: 'OPEN_CONCIERGE' },
];

// Deterministic intent chips that must keep the conversation moving. These map
// to the exact phrases the Kashi intent engine resolves, so every one of them
// (greeting chips AND engine follow-up chips) produces a verified guru reply
// with fresh quick-chips instead of silently stalling.
const GATEWAY_INTENT_PHRASES: Record<string, string> = {
  INTENT_ABHIJIT: 'आज का शुभ अभिजित मुहूर्त',
  INTENT_RAHU: 'आज का राहुकाल',
  INTENT_RAHU_TOMORROW: 'कल का राहुकाल',
  INTENT_NEXT_EKADASHI: 'अगली एकादशी कब है?',
  INTENT_NEXT_PRADOSH: 'अगला प्रदोष कब है?',
  INTENT_NEXT_PURNIMA: 'अगली पूर्णिमा कब है?',
  INTENT_SACRED_DAYS: 'पास में कौन से प्रमुख व्रत हैं?',
  INTENT_NAKSHATRA: 'आज का नक्षत्र क्या है?',
  INTENT_MOON_SIGN: 'आज चन्द्र राशि क्या है?',
  INTENT_TITHI: 'आज की तिथि क्या है?',
  INTENT_PANCHANG_TOMORROW: 'कल का पञ्चाङ्ग',
};

// -------------------------------------------------------------
// VIP Concierge — the human handoff.
//
// The number is the hotline the consultation desk publishes. It appears in
// exactly two places: the tel: link and the wa.me link, both derived from
// these constants so a correction is a one-line change, never a hunt.
// -------------------------------------------------------------
const VIP_CONCIERGE_PHONE_DISPLAY = '+91 99729 34937';
const VIP_CONCIERGE_TEL = 'tel:+919972934937';
const VIP_CONCIERGE_WA = 'https://wa.me/919972934937';
/** The शान्ति अभ्यास the life-concern pathway offers: three steps, no claims. */
const SHANTI_PRACTICE_HI = [
  'चार-सात-आठ श्वास: चार गिनते हुए भीतर, सात रोकें, आठ में धीरे छोड़ें — तीन बार।',
  'एक बार ॐ ध्वनि सुनकर उसी लय में तीन उच्चारण कीजिए (नीचे बटन है)।',
  'दिन का एक निश्चित कोना चुनिए — पाँच मिनट, वही स्थान, वही समय। स्थिरता ही अभ्यास है।',
].join('\n');

const VIP_CONCIERGE_ROADMAP_HI = [
  'पंडित जी को कॉल या WhatsApp कीजिए — अपनी कुंडली व प्रश्न एक वाक्य में बताइए।',
  'WhatsApp पर ही ₹501 का सुरक्षित भुगतान लिंक प्राप्त कीजिए (UPI / कार्ड)।',
  'भुगतान के पश्चात पंडित जी का ग्रुप कॉल निश्चित होता है — आप, पंडित जी और सहायक।',
  'कॉल के बाद आपकी कुंडली PDF तथा Google Drive ऑडियो रिकॉर्डिंग WhatsApp पर भेजी जाती है।',
  'इसके पश्चात गोचर व दशा परिवर्तन पर निःशुल्क अपडेट संदेश मिलते रहते हैं।',
];

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
  const [tooltipText, setTooltipText] = useState('हर हर महादेव! जय माँ तारा! काशी सहायक से पूछें 🙏');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlayingOm, setIsPlayingOm] = useState(false);
  const [offeredDiyaMsgIds, setOfferedDiyaMsgIds] = useState<Record<string, boolean>>({});
  const [offeredFlowersMsgIds, setOfferedFlowersMsgIds] = useState<Record<string, boolean>>({});
  const [chatFlowers, setChatFlowers] = useState<Record<string, Array<{ id: number; x: number; icon: string; size: number; duration: string; delay: string; rot: number }>>>({});
  const [darshanVideoMuted, setDarshanVideoMuted] = useState<Record<string, boolean>>({});
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
    birthLat: 25.3176,
    birthLon: 82.9739,
    birthTz: 5.5,
    domain: 'करियर व व्यापार',
    question: '',
    mood: '', // seeker's emotional state from the greeting check-in
  });

  /**
   * Intake confirmations are carried INSIDE the quick-chip actions
   * themselves ("CONFIRM_INTAKE_date::1996-08-15"), so even chips from
   * older messages always confirm exactly the value they display — no
   * shared mutable pending-state races.
   */

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  // -----------------------------------------------------------------
  // Granth reading session (device-local).
  //
  // The chat route returns an updated reading session and the cancellation
  // tokens it invalidated. We persist the session in localStorage so a reader
  // can continue after a refresh — this is DEVICE-LOCAL ONLY: it is not an
  // account-backed, cross-device sync.
  // -----------------------------------------------------------------
  const READING_SESSION_KEY = 'cosmictantra_granth_reading_session_v1';
  const readingSessionRef = useRef<any>(null);
  /**
   * True only while a stored passage has been spoken and the NEXT stored
   * passage should follow automatically. Set from the server's own session
   * state (never guessed locally) and cleared on pause, stop, explain,
   * completion, mute or close — so reading can never run away unattended.
   */
  const readingAutoAdvanceRef = useRef(false);
  /** Re-entrancy guard for the auto-advance request. */
  const advancingRef = useRef(false);
  const advanceReadingRef = useRef<null | (() => Promise<void>)>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(READING_SESSION_KEY);
      if (saved) readingSessionRef.current = JSON.parse(saved);
    } catch {
      // Storage unavailable or corrupt: start without a saved position.
    }
  }, []);

  const voice = useKashiVoice();
  const [inputVal, setInputVal] = useState('');
  const [panchangContext, setPanchangContext] = useState<ConversationPanchangContext | null>(null);
  /** VIP concierge modal — the human handoff out of the chat. */
  const [conciergeOpen, setConciergeOpen] = useState(false);
  /**
   * ScholarHandoverPacket: generated the moment the kundli intake completes,
   * so the human pandit receives seeker + birth data + engine summary +
   * question in one quotable packet instead of re-asking everything.
   */
  const [handoverPacket, setHandoverPacket] = useState<ScholarHandoverPacket | null>(null);
  /** Which recital passage is currently speaking, so the card can show it. */
  const [recitalPlay, setRecitalPlay] = useState<{ msgId: string; index: number } | null>(null);
  /**
   * V3 conversation state: subject, date, location, domain, intent, the last
   * delivered fact, the suspended flow and the detail level. A ref because it
   * mutates per utterance without re-rendering the whole drawer; the chips it
   * produces are stamped onto the messages themselves.
   */
  const convStateRef = useRef<ConversationState>(createConversationState());
  const [lastSpeakableMsg, setLastSpeakableMsg] = useState<ChatMessage | null>(null);
  const activeCityRef = useRef<any>(null);
  /** Sprint C §12: structured journey context (chart id / dasha ids / evidence ids / language / statuses). */
  const journeyCtxRef = useRef<KashiJourneyContext | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  /** Mirrors isOpen for callbacks (speech completion) that outlive a render. */
  const isOpenRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (!isOpen) readingAutoAdvanceRef.current = false;
  }, [isOpen]);

  // Listen for Cosmic Now location changes
  useEffect(() => {
    const handleLoc = (e: any) => {
      if (e.detail?.city) {
        activeCityRef.current = e.detail.city;
        setPanchangContext((prev: ConversationPanchangContext | null) => prev ? {
          ...prev,
          location: {
            name: e.detail.city.name,
            nameHi: e.detail.city.nameHi,
            lat: e.detail.city.lat,
            lng: e.detail.city.lon || e.detail.city.lng,
            tz: e.detail.city.tz || 5.5
          }
        } : null);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cosmictantra:location_changed', handleLoc);
      try {
        const stored = window.localStorage.getItem('cosmictantra_active_city');
        if (stored) activeCityRef.current = JSON.parse(stored);
      } catch {}
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cosmictantra:location_changed', handleLoc);
      }
    };
  }, []);

  // Time-aware greeting — always capability-led and feeling-first so the
  // seeker instantly knows what Kashi Sahayak offers and feels invited to
  // share their inner state before any question.
  useEffect(() => {
    const hour = new Date().getHours();
    let salutation = 'हर हर महादेव! जय माँ तारा! 🙏 पञ्चाङ्ग • दर्शन • कुण्डली • विद्वान् परामर्श — बताइए, आज मन कैसा है?';
    if (hour >= 5 && hour < 11) {
      salutation = 'सुप्रभात! ☀️ जय माँ तारा! आज का पञ्चाङ्ग व ब्रह्म मुहूर्त तैयार है 🙏 बताइए, आज मन कैसा है?';
    } else if (hour >= 11 && hour < 17) {
      salutation = 'नमस्कार! ⚡ जय माँ तारा! राहुकाल • शुभ मुहूर्त • विद्वान् परामर्श — आज आपका मन कैसा है? 🙏';
    } else if (hour >= 17 && hour < 22) {
      salutation = 'शुभ संध्या! 🪔 जय माँ तारा! गंगा महाआरती लाइव दर्शन व मन की बात — आज आप कैसा महसूस कर रहे हैं?';
    } else {
      salutation = 'हर हर महादेव! जय माँ तारा! 🌙 कल का पञ्चाङ्ग, ग्रह स्थिति व विद्वान् मार्गदर्शन — मन की बात कहिए 🙏';
    }
    setTooltipText(salutation);

    const t = setTimeout(() => {
      setShowGreetingTooltip(true);
    }, 2500);

    return () => clearTimeout(t);
  }, []);

  // Prefill active profile if available (name + real birth coordinates)
  useEffect(() => {
    const p = getActiveProfile();
    if (p && p.name) {
      setSeekerData(prev => ({
        ...prev,
        name: p.name || prev.name,
        birthDate: p.birthDate || prev.birthDate,
        birthTime: p.birthTime || prev.birthTime,
        birthCity: p.birthCity || prev.birthCity,
        birthLat: p.lat ?? prev.birthLat,
        birthLon: p.lng ?? prev.birthLon,
        birthTz: p.tz ?? prev.birthTz,
      }));
    }
  }, []);

  // -------------------------------------------------------------------
  // SESSION MEMORY — the chatbot remembers the seeker across page loads:
  // conversation, intake state and seeker details persist locally
  // (DPDP-conscious: localStorage only). The ↺ header button starts fresh.
  // -------------------------------------------------------------------
  const SESSION_KEY = 'kashi-chat-session-v1';
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved.savedAt || Date.now() - Date.parse(saved.savedAt) > 7 * 86400000 ||
        !Number.isFinite(Date.parse(saved.savedAt))) {
        window.localStorage.removeItem(SESSION_KEY);
        return;
      }
      if (Array.isArray(saved?.messages) && saved.messages.length > 0) {
        const restored = saved.messages.slice(-60);
        setChatMessages(restored);
        // Don't re-announce the restored last reply aloud on reopen
        const last = restored[restored.length - 1];
        if (last?.sender === 'GURU') lastSpokenIdRef.current = last.id;
        if (saved.seekerData) setSeekerData(prev => ({ ...prev, ...saved.seekerData }));
        if (saved.intakeStep) setIntakeStep(saved.intakeStep);
      }
    } catch {
      // ignore corrupted session storage
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === 'undefined' || chatMessages.length === 0) return;
    try {
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          messages: chatMessages.slice(-60),
          seekerData,
          intakeStep,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // storage full or blocked — non-fatal
    }
  }, [chatMessages, seekerData, intakeStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResetSession = () => {
    playClick();
    voice.stop();
    readingAutoAdvanceRef.current = false;
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setChatMessages([]);
    setIntakeStep('IDLE');
    setOfferedDiyaMsgIds({});
    setOfferedFlowersMsgIds({});
    setActiveDarshanVideoMsgIds({});
    setIsOpen(false); // next open greets fresh (profile still prefilled)
  };

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  // Kashi Sahayak reads his new replies aloud (voice toggle in header)
  const lastSpokenIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen || chatMessages.length === 0) return;
    const last = chatMessages[chatMessages.length - 1];
    const toSpeak = last?.speakText || last?.text;
    if (last && last.sender === 'GURU' && toSpeak && last.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = last.id;
      const session = readingSessionRef.current;
      const shouldAdvance = readingAutoAdvanceRef.current === true;
      voice.speak(toSpeak, {
        // The reading session's own speed ("धीरे पढ़ो" → 0.9×) is applied to
        // speech; without it a speed change would change nothing audible.
        rate: speechRateFor(session),
        onDone: () => {
          // Fires only when this message finished speaking on its own: stop()
          // cancels it, which is what pause/mute rely on.
          if (!shouldAdvance) return;
          const advance = advanceReadingRef.current;
          if (advance) void advance();
        },
      });
    }
  }, [chatMessages, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const activeLoc = activeCityRef.current || seekerData.birthCity || DEFAULT_LOCATION;
      const bundle = getCanonicalPanchangBundle(new Date(), activeLoc);
      const locLabel = bundle.location.nameHi || bundle.location.name;

      const greetingText =
        `हर हर महादेव! जय माँ तारा! 🙏\n\n` +
        `आज आप कैसा महसूस कर रहे हैं? मन में कोई चिन्ता, दुविधा या संशय हो, अथवा आज के पञ्चाङ्ग, शुभ समय या किसी कार्य के लिए मार्गदर्शन चाहिए — निसंकोच कहें। मैं आपके साथ हूँ, पूरे ध्यान से सुन रही हूँ।\n\n` +
        `जिज्ञासा हो या चिन्ता — काशी में कोई प्रश्न छोटा नहीं। पहले मन की स्थिति बताइए, फिर विषय चुनिए या लिखिए।\n\n` +
        `आज की मुख्य खगोलीय स्थिति (${locLabel}):\n` +
        `• तिथि: ${bundle.tithi.fullNameHi}\n` +
        `• राहुकाल: ${bundle.timings.rahuKalam}\n` +
        `• शुभ अभिजित मुहूर्त: ${bundle.timings.abhijitMuhurat}`;

      const speakGreeting = `हर हर महादेव! जय माँ तारा! आज आप कैसा महसूस कर रहे हैं? मन में कोई चिंता हो या आज के पंचांग और शुभ समय की जानकारी चाहिए, निसंकोच बताइए। मैं पूरे ध्यान से सुन रही हूँ।`;

      const initialMsg: ChatMessage = {
        id: 'welcome-1',
        sender: 'GURU',
        text: greetingText,
        speakText: speakGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provenance: {
          calculation: bundle.provenance.calculationEngine,
          location: bundle.location.name,
          source: bundle.provenance.source,
          interpretation: 'काशी सहायक • भाव-संवेदनशील व प्रत्यक्ष दृक्-गणित'
        },
        quickChips: [
          ...MOOD_OPTIONS.map((m) => ({ label: m.chipLabel, action: m.id })),
          { label: '✨ आज का शुभ समय', action: 'INTENT_ABHIJIT' },
          { label: '🕒 आज का राहुकाल', action: 'INTENT_RAHU' },
          { label: '🙏 अगली एकादशी', action: 'INTENT_NEXT_EKADASHI' },
          { label: '📅 कल का पञ्चाङ्ग', action: 'INTENT_PANCHANG_TOMORROW' },
          { label: '⏩ सीधे विषय पर चलें', action: 'SKIP_MOOD' },
        ],
      };

      setChatMessages([initialMsg]);
      setLastSpeakableMsg(initialMsg);
      setPanchangContext({
        referenceDate: bundle.date,
        location: bundle.location,
        source: 'COSMIC_NOW'
      });
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
    if (soundEnabled) chitiSensory.playTick();
  };

  const handleOfferDiya = (msgId: string) => {
    playDiya();
    setOfferedDiyaMsgIds(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleOfferFlowers = (msgId: string) => {
    playFlowerDrop();
    setOfferedFlowersMsgIds(prev => ({ ...prev, [msgId]: true }));
    const icons = ['🌸', '🌺', '🌼', '🍃', '🏵️', '🌹', '🪷', '🌷', '🌿', '✨'];
    const newBatch = Array.from({ length: 36 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: Math.floor(Math.random() * 92) + 4,
      icon: icons[Math.floor(Math.random() * icons.length)],
      size: Math.floor(Math.random() * 12) + 16,
      duration: (2.2 + Math.random() * 1.5).toFixed(2),
      delay: (Math.random() * 0.7).toFixed(2),
      rot: Math.floor(Math.random() * 720) - 360,
    }));
    setChatFlowers(prev => ({ ...prev, [msgId]: [...(prev[msgId] || []), ...newBatch] }));
    setTimeout(() => {
      setChatFlowers(prev => ({
        ...prev,
        [msgId]: (prev[msgId] || []).filter(f => !newBatch.some(nb => nb.id === f.id))
      }));
      setOfferedFlowersMsgIds(prev => ({ ...prev, [msgId]: false }));
    }, 4200);
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
    const loc = panchangContext?.location || DEFAULT_LOCATION;
    const date = panchangContext?.referenceDate ? new Date(`${panchangContext.referenceDate}T12:00:00`) : new Date();
    const bundle = getCanonicalPanchangBundle(date, loc);
    const dateStr = bundle.date;
    const locNameHi = bundle.location.nameHi || bundle.location.name;

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: `हर हर महादेव! 🙏 आज की प्रत्यक्ष खगोलीय गणना (${locNameHi} अनुसार):\n\nआज ${bundle.date} (${bundle.weekdayNameHi}) है। तिथि: ${bundle.tithi.fullNameHi}।\n\nराहुकाल: ${bundle.timings.rahuKalam}। अभिजित मुहूर्त: ${bundle.timings.abhijitMuhurat}।`,
          speakText: `${locNameHi} में आज तिथि ${bundle.tithi.fullNameHi} है। राहुकाल ${bundle.timings.rahuKalam} रहेगा।`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provenance: {
            calculation: bundle.provenance.calculationEngine,
            location: bundle.provenance.locationStr,
            source: bundle.provenance.source,
            interpretation: 'काशी सहायक'
          },
          panchangCard: {
            dateStr,
            tithi: bundle.tithi.fullNameHi,
            tithiPaksha: bundle.tithi.pakshaHi,
            nakshatra: bundle.nakshatra.nameHi,
            pada: bundle.nakshatra.pada,
            yoga: bundle.yoga.nameHi,
            karana: bundle.karana.nameHi,
            rahuKaal: bundle.timings.rahuKalam,
            abhijitMuhurat: bundle.timings.abhijitMuhurat,
            isRahuNow: bundle.timings.isRahuNow,
            recommendation: bundle.timings.isRahuNow 
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
              { label: '📞 ₹1,100 सभा (Web/Phone Sabha)', price: '₹1,100', mode: 'VOICE', href: '/ask' },
              { label: '📹 ₹1,500 साक्षात् दर्शन (Video Sabha)', price: '₹1,500', mode: 'VIDEO', href: '/ask' }
            ]
          },
          quickChips: [
            { label: '📜 ₹501 लिखित परामर्श पत्र चुनें', action: 'OPEN_CHECKOUT_WRITTEN', href: '/ask' },
            { label: '📞 ₹1,100 सभा परामर्श (Web/Phone)', action: 'OPEN_CHECKOUT_VOICE', href: '/ask' },
            { label: '🌸 आज का पञ्चाङ्ग देखें', action: 'INTENT_PANCHANG' }
          ]
        }
      ]);
    }, 400);
  };

  // -------------------------------------------------------------------
  const kashi = useKashiSahayak();
  const [verseDismissed, setVerseDismissed] = useState(false);

  const handleListenVerse = (passage: any) => {
    playClick();
    if (!passage) return;
    const verseText = passage.original || passage.verse || '';
    const meaningText = passage.meaning || passage.meaningHi || '';
    const recitation = `${verseText}। भावार्थ: ${meaningText}`;

    voice.speak(recitation, { rate: 0.82 });
    kashi.control('resume');

    const msgObj: ChatMessage = {
      id: `verse-${Date.now()}`,
      sender: 'GURU',
      text: recitation,
      speakText: recitation,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setLastSpeakableMsg(msgObj);
  };

  useEffect(() => {
    if (kashi.pendingVerse) {
      setVerseDismissed(false);
      setTimeout(() => {
        chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [kashi.pendingVerse]);

  // -------------------------------------------------------------------
  // Emotional check-in: the seeker taps a mood chip, Kashi Sahayak
  // acknowledges the feeling warmly, anchors an authentic shastra wisdom
  // card (single truth via kashi.pendingVerse), and reveals capabilities.
  // -------------------------------------------------------------------
  const handleMoodSelection = (moodId: string) => {
    const mood = moodId === 'SKIP_MOOD' ? null : getMoodById(moodId);
    if (mood) {
      setSeekerData(prev => ({ ...prev, mood: mood.speakLabel }));
    }

    const emotion = MOOD_TO_EMOTION[moodId];
    const insight =
      mood && mood.insightId
        ? SCRIPTURE_WISDOM_REGISTRY.find((s) => s.id === mood.insightId) || null
        : null;

    const acknowledgement =
      (emotion && kashi.lastResponse?.acknowledgement) ||
      (mood ? mood.acknowledgeHi : 'बहुत अच्छा! 🙏 चलिए सीधे मुख्य विषय पर चलते हैं।');

    // To prevent duplicate quotes ("two quotes, one blocking view"),
    // if an emotion produces a pendingVerse in the companion card, do NOT also attach scriptureCard inline.
    const shouldAttachScriptureCard = !emotion && !!insight;

    // Recite the shloka immediately when suggesting it!
    const activeVerse = kashi.pendingVerse || (insight ? { original: insight.verse, meaning: insight.meaningHi } : null);
    const shlokaRecitation = activeVerse
      ? `। शास्त्र का श्लोक सुनिए: ${activeVerse.original}। इसका भावार्थ है: ${activeVerse.meaning || ''}`
      : '';
    const speakText = `${acknowledgement}${shlokaRecitation}`;

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: 'GURU',
          text: `${acknowledgement}\n\nमैं इस भावना को पूरी सहानुभूति से समझती हूँ — और यही काशी की परम्परा है, पहले मन की बात सुनो, तब मार्ग बताओ।\n\nऔर बताइए — इस भावना के साथ आज किस विषय में सहायता चाहिए? नीचे से चुन सकते हैं या अपनी बात सीधे लिख सकते हैं। जब तक मन हल्का न हो, चलते रहिए।`,
          speakText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ...(shouldAttachScriptureCard ? { scriptureCard: insight } : {}),
          provenance: insight
            ? { source: insight.sourceGrantha, interpretation: 'काशी सहायक • भाव-संवेदन (Mood-Aware)' }
            : { interpretation: 'काशी सहायक • भाव-संवेदन (Mood-Aware)' },
          quickChips: CAPABILITY_CHIPS,
        },
      ]);
    }, 400);
  };

  /* ---------------------------------------------------------------
   * Main menu, granth recitation and the concierge handoff.
   * --------------------------------------------------------------- */
  const pushGuruMessage = (partial: { text: string } & Partial<ChatMessage>) => {
    const msg: ChatMessage = {
      id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: 'GURU',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...partial,
    };
    setChatMessages(prev => [...prev, msg]);
    return msg;
  };

  /** /report carries the seeker's own birth data, so the download opens on
   *  THEIR chart rather than an empty form. */
  const reportHrefForSeeker = () => {
    const q = new URLSearchParams();
    if (seekerData.name) q.set('name', seekerData.name);
    if (seekerData.birthDate) q.set('birthDate', seekerData.birthDate);
    if (seekerData.birthTime) q.set('birthTime', seekerData.birthTime);
    if (seekerData.birthCity) q.set('locationName', seekerData.birthCity);
    q.set('lat', String(seekerData.birthLat));
    q.set('lng', String(seekerData.birthLon));
    q.set('tz', 'Asia/Kolkata');
    return `/report?${q.toString()}`;
  };

  const conciergeWhatsAppHref = () => {
    // When the intake has completed, prefill the FULL ScholarHandoverPacket so
    // the seeker forwards seeker+chart+question context in one tap; otherwise
    // fall back to the short request line.
    const text = handoverPacket
      ? handoverPacket.whatsappText
      : `हर हर महादेव 🙏 मैं ${seekerData.name || 'साधक'} हूँ। CosmicTantra कुंडली परामर्श हेतु ₹501 भुगतान लिंक व पंडित जी के कॉल का अनुरोध है। प्रश्न: ${seekerData.question || 'कुंडली विश्लेषण'}`;
    return `${VIP_CONCIERGE_WA}?text=${encodeURIComponent(text)}`;
  };

  const postMainMenu = () => {
    pushGuruMessage({
      text: 'हर हर महादेव! 🙏 यह रहा मुख्य मेन्यू — काशी सहायक की हर सेवा एक tap पर:',
      quickChips: [
        { label: '📖 ग्रंथ पाठ व स्वर-वाचन (८ शास्त्र)', action: 'GRANTH_MENU' },
        { label: '🔮 मेरी कुण्डली व दशा (Intake)', action: 'START_INTAKE' },
        ...CAPABILITY_CHIPS.filter((c) => c.action !== 'START_INTAKE'),
        { label: '📞 पंडित जी से सीधी बात (VIP Concierge)', action: 'OPEN_CONCIERGE' },
      ],
    });
  };

  const postGranthMenu = () => {
    pushGuruMessage({
      text: '📖 ग्रंथ पाठ कक्ष — आठ शास्त्र, प्रामाणिक मूल पाठ व स्वर-वाचन। किसे सुनना है?',
      quickChips: GRANTH_RECITALS.map((r) => ({
        label: `${r.titleHi} • ${r.structureHi}`,
        action: `GRANTH_PICK_${r.id}`,
      })),
    });
  };

  const openRecital = async (recitalId: string, unitId?: string) => {
    const recital = recitalById(recitalId);
    if (!recital) return;
    const units = await loadRecitalUnits(recitalId);
    if (units.length === 0) {
      pushGuruMessage({ text: `क्षमा करें ${seekerData.name || 'साधक'} जी — ${recital.titleHi} का पाठ इस समय उपलब्ध नहीं है। ग्रंथ सूची से दूसरा शास्त्र चुनिए।`, quickChips: [{ label: '📖 ग्रंथ सूची', action: 'GRANTH_MENU' }] });
      return;
    }
    if (!unitId && units.length > 1) {
      pushGuruMessage({
        text: `${recital.titleHi} — ${recital.structureHi}। कौन सा खण्ड सुनना है?`,
        quickChips: units.map((u) => ({ label: u.labelHi, action: `GRANTH_UNIT_${recitalId}__${u.id}` })),
      });
      return;
    }
    const unit = units.find((u) => u.id === unitId) ?? units[0];
    const passages = await loadRecitalPassages(recitalId, unit.id, 2);
    if (passages.length === 0) {
      pushGuruMessage({ text: `${recital.titleHi} के इस खण्ड का पाठ अभी लोड नहीं हो सका। कृपया दूसरा खण्ड चुनिए।`, quickChips: [{ label: '📖 ग्रंथ सूची', action: 'GRANTH_MENU' }] });
      return;
    }
    pushGuruMessage({
      text: `🎧 ${recital.titleHi} • ${unit.labelHi} — मूल पाठ नीचे है; ▶ दबाइए और सुनिए:`,
      recitalCard: {
        recitalId,
        recitalTitleHi: recital.titleHi,
        unitLabelHi: unit.labelHi,
        passages,
        readerHref: recital.readerHref,
      },
      quickChips: [
        { label: '📖 ग्रंथ सूची पर लौटें', action: 'GRANTH_MENU' },
        ...(recital.readerHref ? [{ label: '📜 सम्पूर्ण पाठ पढ़ें', action: 'NAV_READER', href: recital.readerHref }] : []),
        { label: '️ मुख्य मेन्यू', action: 'MAIN_MENU' },
      ],
    });
  };

  const playRecitalPassage = (msg: ChatMessage, index: number) => {
    const p = msg.recitalCard?.passages[index];
    if (!p) return;
    playClick();
    setRecitalPlay({ msgId: msg.id, index });
    voice.speak(recitalSpeech(p), { rate: 0.8 });
  };

  const playRecitalNext = (msg: ChatMessage) => {
    const total = msg.recitalCard?.passages.length ?? 0;
    const current = recitalPlay && recitalPlay.msgId === msg.id ? recitalPlay.index : -1;
    const next = current + 1 < total ? current + 1 : 0;
    playRecitalPassage(msg, next);
  };

  const stopRecital = () => {
    playClick();
    voice.stop();
    setRecitalPlay(null);
  };

  /** The live intake, as a resumable flow frame. */
  const intakeFrame = (): FlowFrame => ({
    kind: 'INTAKE',
    step: intakeStep,
    slots: {
      name: seekerData.name, birthDate: seekerData.birthDate, birthTime: seekerData.birthTime,
      birthCity: seekerData.birthCity, question: seekerData.question,
    },
    labelHi: 'कुंडली इन्टेक',
  });

  const postFollowUp = (reply: { text: string; speakText: string }) => {
    pushGuruMessage({
      text: reply.text,
      speakText: reply.speakText,
      quickChips: nextBestActions(convStateRef.current),
    });
  };

  /**
   * Deterministic router for follow-ups and resume. Returns true when the
   * utterance was consumed here, so the caller must not fall through to the
   * slot processors or the gateway.
   */
  const handleFollowUpIntent = (intent: ConversationalIntent): boolean => {
    const st = convStateRef.current;
    if (intent === 'RESUME_FLOW') {
      const r = resumeFlow(st);
      if (!r) {
        const reply = routeFollowUp('RESUME_FLOW', st);
        if (reply) postFollowUp(reply);
        return true;
      }
      convStateRef.current = r.state;
      if (r.frame.kind === 'INTAKE') {
        setSeekerData(prev => ({ ...prev, ...r.frame.slots }));
        setIntakeStep(r.frame.step as typeof intakeStep);
        const slot = nextMissingSlot(r.frame.slots);
        pushGuruMessage({
          text: `${resumePromptHi(r.frame)} ${slot ? INTAKE_SLOT_QUESTION_HI[slot] : 'सभी विवरण पूर्ण हैं — धन्यवाद!'}`,
          quickChips: nextBestActions(r.state),
        });
      } else {
        pushGuruMessage({ text: `${resumePromptHi(r.frame)} जारी रखते हैं।`, quickChips: nextBestActions(r.state) });
      }
      return true;
    }
    const reply = routeFollowUp(intent, st);
    if (reply) {
      postFollowUp(reply);
      return true;
    }
    if (intent === 'FOLLOWUP_THAT_DAY' && st.activeDate) {
      const label = st.activeDateLabelHi;
      const q = label === 'कल' ? 'कल का पंचांग'
        : label === 'परसों' ? 'परसों का पंचांग'
        : label === 'आज' ? 'आज का पंचांग'
        : `${st.activeDate} का पंचांग`;
      void postGuru(q);
      return true;
    }
    return false;
  };

  const handleChipClick = (chip: { label: string; action: string; href?: string }) => {
    playClick();

    // Kashi Sahayak: a mood chip is a direct user gesture, so the companion
    // produces acknowledgement + a verified passage for that feeling.
    const emotion = MOOD_TO_EMOTION[chip.action];
    if (emotion) kashi.selectEmotion(emotion, chip.label);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text: chip.label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);

    // Emotional check-in chips (greeting flow)
    if (chip.action.startsWith('MOOD_') || chip.action === 'SKIP_MOOD') {
      handleMoodSelection(chip.action);
      return;
    }

    if (chip.action === 'MAIN_MENU') {
      playClick();
      postMainMenu();
      return;
    }

    // Conversation-core chips: follow-ups on the active fact, resume, and the
    // humane pathways offered after a life concern.
    if (chip.action === 'FOLLOWUP_WHY' || chip.action === 'FOLLOWUP_MEANING' || chip.action === 'FOLLOWUP_UNTIL'
      || chip.action === 'FOLLOWUP_THAT_DAY' || chip.action === 'FOLLOWUP_SUBJECT_RASHI' || chip.action === 'RESUME_FLOW') {
      handleFollowUpIntent(chip.action as ConversationalIntent);
      return;
    }

    if (chip.action === 'LIFE_PATH_TALK') {
      pushGuruMessage({
        text: 'मैं पूरी तरह सुन रहा हूँ — मन की बात खुलकर कहिए, कोई क्रम नहीं, कोई जल्दी नहीं।',
        quickChips: MOOD_OPTIONS.map((m) => ({ label: m.chipLabel, action: m.id })),
      });
      return;
    }
    if (chip.action === 'LIFE_PATH_TIME') {
      handlePanchangQuery();
      return;
    }
    if (chip.action === 'LIFE_PATH_SHANTI') {
      pushGuruMessage({
        text: `🕉️ शान्ति अभ्यास — तीन छोटे चरण:\n${SHANTI_PRACTICE_HI}`,
        quickChips: [
          { label: '🕉️  ध्वनि सुनें', action: 'PLAY_OM' },
          { label: '📿 जप माला खोलें', action: 'NAV_JAPA', href: '/remedy-tracker' },
          { label: '🗂️ मुख्य मेन्यू', action: 'MAIN_MENU' },
        ],
      });
      return;
    }
    if (chip.action === 'LIFE_PATH_JAPA') {
      handleNavigate('/remedy-tracker');
      return;
    }
    if (chip.action === 'LIFE_PATH_DARSHAN') {
      handleDarshanQuery('काशी');
      return;
    }
    if (chip.action === 'PLAY_OM') {
      handlePlayOmChant();
      return;
    }

    if (chip.action === 'GRANTH_MENU') {
      postGranthMenu();
      return;
    }

    if (chip.action.startsWith('GRANTH_PICK_')) {
      void openRecital(chip.action.slice('GRANTH_PICK_'.length));
      return;
    }

    if (chip.action.startsWith('GRANTH_UNIT_')) {
      const [recitalId, unitId] = chip.action.slice('GRANTH_UNIT_'.length).split('__');
      void openRecital(recitalId, unitId);
      return;
    }

    if (chip.action === 'OPEN_CONCIERGE') {
      playClick();
      setConciergeOpen(true);
      return;
    }

    if (chip.action === 'NAV_READER' && chip.href) {
      handleNavigate(chip.href);
      return;
    }

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

    // Deterministic intent chips (greeting + engine follow-up chips): route
    // them through the gateway so each one yields a verified guru reply with
    // fresh quick-chips. Without this, tapping these chips stalls the flow.
    const gatewayPhrase = GATEWAY_INTENT_PHRASES[chip.action];
    if (gatewayPhrase) {
      void postGuru(gatewayPhrase);
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
      // The chosen domain becomes the conversation's activeDomain (Module 2).
      convStateRef.current = applyEntities(convStateRef.current, { domain: chip.action.replace('SET_DOMAIN_', '') });
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

    // Intake re-confirmation chips — the canonical value is embedded in the
    // action itself, so the chip always commits exactly the value it shows.
    if (chip.action.startsWith('CONFIRM_INTAKE_')) {
      const rest = chip.action.replace('CONFIRM_INTAKE_', '');
      const sepIdx = rest.indexOf('::');
      const kind = (sepIdx >= 0 ? rest.slice(0, sepIdx) : rest) as 'date' | 'time';
      const value = sepIdx >= 0 ? rest.slice(sepIdx + 2) : '';
      confirmPendingIntake(kind, value);
      return;
    }
    if (chip.action.startsWith('RETRY_INTAKE_')) {
      retryIntake(chip.action.replace('RETRY_INTAKE_', ''));
      return;
    }
    if (chip.action.startsWith('CHOOSE_CITY_')) {
      chooseCity(chip.action.replace('CHOOSE_CITY_', ''));
      return;
    }

    // Granth reader controls: reuse the same conversational commands the
    // gateway understands, so the chips and free text behave identically.
    if (chip.action.startsWith('READER_')) {
      const phrase =
        chip.action === 'READER_CONTINUE' ? 'आगे पढ़ो'
          : chip.action === 'READER_PAUSE' ? 'रुको'
            : chip.action === 'READER_EXPLAIN' ? 'यह समझाओ'
              : null;
      if (phrase) {
        // Pass the phrase in: no state round-trip, so the command that is sent
        // is always the command the chip shows.
        void handleSendMessage(undefined, phrase);
      }
      return;
    }

    if (chip.action === 'NAV_REPORT_DOWNLOAD' || chip.action === 'NAV_REPORT') {
      handleNavigate('/report');
      return;
    }
    if (chip.action === 'OPEN_CHECKOUT_EXPLANATION' || chip.action === 'OPEN_CHECKOUT_WRITTEN') {
      handleNavigate('/ask?tier=WRITTEN');
      return;
    }
    if (chip.action === 'OPEN_CHECKOUT_VOICE') {
      handleNavigate('/ask?tier=VOICE');
      return;
    }
    if (chip.action === 'INTENT_ABHIJIT' || chip.action === 'INTENT_PANCHANG') {
      void postGuru(chip.label);
      return;
    }

    if (chip.action === 'SELECT_DATE_SAMPLE') {
      if (intakeStep !== 'ASK_BIRTH_DATE') return;
      processDateInput(chip.label, true); // explicit tap = already confirmed
    } else if (chip.action === 'SELECT_TIME_SAMPLE') {
      if (intakeStep !== 'ASK_BIRTH_TIME') return;
      processTimeInput(chip.label, true);
    } else {
      // Universal safety net: if any chip action has no dedicated handler,
      // dispatch it to postGuru so the conversation never stalls!
      void postGuru(chip.label);
    }
  };

  // -------------------------------------------------------------------
  // Guided intake — natural-language tolerant parsing + re-confirmation
  // "2.20" → 02:20 AM, "bilaspur ,cg" → Bilaspur, Chhattisgarh. Every typed
  // value is echoed back with ✅ confirm / ✏️ correct chips (or city
  // suggestions) before anything is committed to the seeker's profile.
  // -------------------------------------------------------------------
  const pushGuruMsg = (partial: Partial<ChatMessage>) => {
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender: 'GURU',
          text: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ...partial,
        } as ChatMessage,
      ]);
    }, 400);
  };

  const askBirthTimeMsg = () => {
    pushGuruMsg({
      text: 'बहुत अच्छा 🙏 अब आपका जन्म समय बताइए — जैसे 10:30 AM, "14:45", "2.20" या "शाम 7 बजे" (नीचे त्वरित समय भी चुन सकते हैं):',
      quickChips: [
        { label: '06:00 (प्रातः)', action: 'SELECT_TIME_SAMPLE' },
        { label: '10:30 (सुबह)', action: 'SELECT_TIME_SAMPLE' },
        { label: '12:00 (दोपहर)', action: 'SELECT_TIME_SAMPLE' },
        { label: '18:00 (सायं)', action: 'SELECT_TIME_SAMPLE' },
        { label: '21:00 (रात्रि)', action: 'SELECT_TIME_SAMPLE' },
      ],
    });
  };

  const askBirthCityMsg = () => {
    pushGuruMsg({
      text: 'उत्तम। अब आपका जन्म स्थान बताइए — शहर या कस्बे का नाम लिखें (जैसे "bilaspur ,cg" या "पटना बिहार" — मैं सटीक अक्षांश-रेखांश स्वयं पहचान लूँगी):',
      quickChips: [
        { label: '🏛️ Varanasi (काशी)', action: 'CHOOSE_CITY_varanasi' },
        { label: 'Patna (Bihar)', action: 'CHOOSE_CITY_patna' },
        { label: 'New Delhi', action: 'CHOOSE_CITY_delhi' },
        { label: 'Mumbai', action: 'CHOOSE_CITY_mumbai' },
        { label: 'Bilaspur (CG)', action: 'CHOOSE_CITY_bilaspur-cg' },
        { label: 'Lucknow (UP)', action: 'CHOOSE_CITY_lucknow' },
        { label: 'Bengaluru', action: 'CHOOSE_CITY_bengaluru' },
      ],
    });
  };

  const askQuestionMsg = () => {
    pushGuruMsg({
      text: 'सब कुछ दर्ज हो गया 🙏 अब कृपया अपना वह मुख्य प्रश्न या परिस्थिति विस्तार से लिखें, जिस पर आप काशी के वरिष्ठ विद्वान् से समाधान चाहते हैं:',
    });
  };

  /**
   * Commits the seeker's details into the CosmicTantra profile store so the
   * WHOLE site (daily panchang, dashboard, calendar, kundali pages) shows
   * their real data instead of demo values. Updates the existing active
   * profile when it's the same person; creates one for a new seeker.
   */
  const persistSeekerProfile = (override?: Partial<typeof seekerData>) => {
    const d = { ...seekerData, ...(override || {}) };
    if (!d.name || !parseBirthDate(d.birthDate).ok || !parseBirthTime(d.birthTime).ok ||
      !Number.isFinite(d.birthLat) || !Number.isFinite(d.birthLon)) return;
    try {
      const existing = getActiveProfile();
      const samePerson =
        !!existing?.name && existing.name.trim().toLowerCase() === d.name.trim().toLowerCase() &&
        existing.birthDate === d.birthDate && existing.birthTime === d.birthTime &&
        existing.lat === d.birthLat && existing.lng === d.birthLon;
      const saved = upsertProfile({
        id: samePerson ? existing!.id : undefined,
        name: d.name,
        relation: samePerson ? existing!.relation || 'Self' : 'Self',
        birthDate: d.birthDate,
        birthTime: d.birthTime,
        birthCity: d.birthCity,
        lat: d.birthLat,
        lng: d.birthLon,
        tz: d.birthTz || 5.5,
      } as any);
      setActiveProfileId(saved.id);

      // Keep cosmictantra_active_kundli synced for /report and all other Kundli calculations
      if (typeof window !== 'undefined') {
        const kundliPayload = {
          name: d.name,
          birthDate: d.birthDate,
          birthTime: d.birthTime,
          city: d.birthCity,
          locationName: d.birthCity,
          latitude: d.birthLat,
          longitude: d.birthLon,
          timezone: d.birthTz || 5.5,
          source: 'SEEKER_INTAKE'
        };
        localStorage.setItem('cosmictantra_active_kundli', JSON.stringify(kundliPayload));
      }
    } catch (err) {
      console.warn('Profile persist failed:', err);
    }
  };

  const processDateInput = (dob: string, trusted: boolean = false) => {
    const parsed = parseBirthDate(dob);
    if (!parsed.ok) {
      pushGuruMsg({
        text: `क्षमा करें 🙏 "${dob}" तिथि समझ नहीं आई। कृपया इस रूप में लिखें — 1996-08-15, 15/08/1996 या "15 अगस्त 1996":`,
        quickChips: [
          { label: '1995-06-15', action: 'SELECT_DATE_SAMPLE' },
          { label: '1998-08-10', action: 'SELECT_DATE_SAMPLE' },
          { label: '2000-01-25', action: 'SELECT_DATE_SAMPLE' },
        ],
      });
      return;
    }
    if (!trusted) {
      // Re-confirm before committing — devotees often mistype. The parsed
      // value travels inside the chip action, so this chip always confirms
      // exactly the date it displays.
      pushGuruMsg({
        text: `मैं आपकी जन्म तिथि ${parsed.labelHi} (${parsed.labelEn}) के रूप में समझ रही हूँ — क्या यह सही है?`,
        quickChips: [
          { label: `✅ हाँ — ${parsed.labelHi}`, action: `CONFIRM_INTAKE_date::${parsed.iso}` },
          { label: '✏️ नहीं, दुबारा लिखूँगी/लिखूँगा', action: 'RETRY_INTAKE_date' },
        ],
      });
      return;
    }
    setSeekerData(prev => ({ ...prev, birthDate: parsed.iso! }));
    setIntakeStep('ASK_BIRTH_TIME');
    askBirthTimeMsg();
  };

  const processTimeInput = (timeStr: string, trusted: boolean = false) => {
    const parsed = parseBirthTime(timeStr);
    if (!parsed.ok) {
      pushGuruMsg({
        text: `क्षमा करें 🙏 "${timeStr}" समय समझ नहीं आया। कृपया इस रूप में लिखें — 2:20 AM, 14:45, "2.20" या "शाम 7 बजे":`,
        quickChips: [
          { label: '06:00 (प्रातः)', action: 'SELECT_TIME_SAMPLE' },
          { label: '10:30 (सुबह)', action: 'SELECT_TIME_SAMPLE' },
          { label: '18:00 (सायं)', action: 'SELECT_TIME_SAMPLE' },
        ],
      });
      return;
    }
    if (!trusted) {
      pushGuruMsg({
        text: `मैं जन्म समय ${parsed.label} के रूप में समझ रही हूँ — क्या यह सही है?`,
        quickChips: [
          { label: `✅ हाँ — ${parsed.label}`, action: `CONFIRM_INTAKE_time::${parsed.time24}` },
          { label: '✏️ नहीं, दुबारा लिखूँगी/लिखूँगा', action: 'RETRY_INTAKE_time' },
        ],
      });
      return;
    }
    setSeekerData(prev => ({ ...prev, birthTime: parsed.time24! }));
    setIntakeStep('ASK_BIRTH_CITY');
    askBirthCityMsg();
  };

  const processCityInput = (cityStr: string) => {
    const res = resolveBirthCity(cityStr);

    if (res.status === 'none') {
      pushGuruMsg({
        text: `क्षमा करें 🙏 मैं "${cityStr}" को पहचान नहीं पाई। कृपया निकटतम बड़े शहर व राज्य का नाम लिखें — जैसे "Bilaspur, CG" या "पटना बिहार"। अंग्रेज़ी या हिन्दी — दोनों चलेंगे:`,
        quickChips: [
          { label: '🏛️ Varanasi (काशी)', action: 'CHOOSE_CITY_varanasi' },
          { label: 'Patna (Bihar)', action: 'CHOOSE_CITY_patna' },
          { label: 'New Delhi', action: 'CHOOSE_CITY_delhi' },
          { label: 'Bilaspur (CG)', action: 'CHOOSE_CITY_bilaspur-cg' },
        ],
      });
      return;
    }

    if (res.status === 'choices') {
      pushGuruMsg({
        text: `"${cityStr}" से मुझे ये स्थान मिले — कृपया अपना सही जन्म स्थान चुनें (ताकि अक्षांश-रेखांश सटीक रहे):`,
        quickChips: [
          ...res.choices.map((c) => ({
            label: `${c.name}, ${c.state}${c.country !== 'India' ? ' (' + c.country + ')' : ''}`,
            action: `CHOOSE_CITY_${c.id}`,
          })),
          { label: '✏️ इनमें से कोई नहीं — दुबारा लिखें', action: 'RETRY_INTAKE_city' },
        ],
      });
      return;
    }

    // exact — still re-confirm, since coordinates drive the kundali math
    const c = res.primary!;
    pushGuruMsg({
      text: `मैं "${cityStr}" को ${c.name}, ${c.state} (अक्षांश ${c.lat}°N, रेखांश ${c.lng}°E) के रूप में समझ रही हूँ — क्या यह सही है?`,
      quickChips: [
        { label: `✅ हाँ — ${c.name}, ${c.state}`, action: `CHOOSE_CITY_${c.id}` },
        { label: '✏️ नहीं, दुबारा लिखूँगी/लिखूँगा', action: 'RETRY_INTAKE_city' },
      ],
    });
  };

  /** Commit a city picked from a suggestion/confirm chip (explicit = confirmed). */
  const chooseCity = (cityId: string) => {
    if (intakeStep !== 'ASK_BIRTH_CITY') return;
    // STRICT match — never silently fall back to a default city, the picked
    // coordinates drive the kundali calculation.
    const c = CITIES.find((x) => x.id === cityId) as CityChoice | undefined;
    if (!c || !cityId) return;
    const next = {
      birthCity: `${c.name}, ${c.state}`,
      birthLat: c.lat,
      birthLon: c.lng,
      birthTz: c.tz ?? 5.5,
    };
    setSeekerData(prev => ({ ...prev, ...next }));
    setIntakeStep('ASK_QUESTION');
    pushGuruMsg({
      text: `धन्यवाद 🙏 जन्म स्थान ${c.name}, ${c.state} दर्ज हो गया — अब आपकी कुण्डली सटीक अक्षांश-रेखांश (${c.lat}°N, ${c.lng}°E) से बनेगी।`,
    });
    askQuestionMsg();
  };

  /** Confirm a typed date/time — the canonical value rides inside the chip. */
  const confirmPendingIntake = (kind: 'date' | 'time', value: string) => {
    if ((kind === 'date' && intakeStep !== 'ASK_BIRTH_DATE') ||
      (kind === 'time' && intakeStep !== 'ASK_BIRTH_TIME')) return;
    if (!value) return;
    if (kind === 'date') {
      setSeekerData(prev => ({ ...prev, birthDate: value }));
      setIntakeStep('ASK_BIRTH_TIME');
      pushGuruMsg({ text: 'धन्यवाद 🙏 जन्म तिथि दर्ज हो गई।' });
      askBirthTimeMsg();
    } else {
      setSeekerData(prev => ({ ...prev, birthTime: value }));
      setIntakeStep('ASK_BIRTH_CITY');
      pushGuruMsg({ text: 'धन्यवाद 🙏 जन्म समय दर्ज हो गया।' });
      askBirthCityMsg();
    }
  };

  const retryIntake = (kind: string) => {
    if ((kind === 'date' && intakeStep !== 'ASK_BIRTH_DATE') ||
      (kind === 'time' && intakeStep !== 'ASK_BIRTH_TIME') ||
      (kind === 'city' && intakeStep !== 'ASK_BIRTH_CITY')) return;
    if (kind === 'date') {
      pushGuruMsg({
        text: 'कोई बात नहीं 🙏 कृपया जन्म तिथि दुबारा लिखें — 1996-08-15, 15/08/1996 या "15 अगस्त 1996":',
        quickChips: [
          { label: '1995-06-15', action: 'SELECT_DATE_SAMPLE' },
          { label: '1998-08-10', action: 'SELECT_DATE_SAMPLE' },
        ],
      });
    } else if (kind === 'time') {
      pushGuruMsg({
        text: 'कोई बात नहीं 🙏 कृपया जन्म समय दुबारा लिखें — जैसे 2:20 PM, 14:45 या "रात 10:30":',
        quickChips: [
          { label: '06:00 (प्रातः)', action: 'SELECT_TIME_SAMPLE' },
          { label: '18:00 (सायं)', action: 'SELECT_TIME_SAMPLE' },
        ],
      });
    } else {
      pushGuruMsg({
        text: 'कोई बात नहीं 🙏 कृपया अपना जन्म स्थान दुबारा लिखें — शहर व राज्य (जैसे "Bilaspur, Chhattisgarh"):',
      });
    }
  };

  /**
   * One round trip to /api/guru/chat: sends the current reading session,
   * stores the returned session, and appends the assistant's reply.
   *
   * Also decides whether speech completion should pull the NEXT stored passage:
   * only when the SERVER reports state 'reading' AND another passage is queued.
   * Pause / explain / completion / a rejected session all leave it off, so
   * "continue" can never loop on its own.
   */
  const postGuru = async (text: string): Promise<boolean> => {
    try {
      const activeLoc = activeCityRef.current || seekerData.birthCity || 'Dhanbad, JH';
      const cityName = panchangContext?.location?.name || (typeof activeLoc === 'string' ? activeLoc : activeLoc.name);

      const res = await fetch('/api/guru/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatMessages.slice(-6).map(m => ({
            role: m.sender === 'USER' ? 'user' : 'assistant',
            content: m.text
          })),
          context: {
            city: cityName,
            profileName: seekerData.name,
            readingSession: readingSessionRef.current,
            panchangContext: panchangContext || undefined
          }
        })
      });

      if (!res.ok) return false;
      const data = await res.json();

      if (data.panchangContext) {
        setPanchangContext(data.panchangContext);
      }

      // Stale-audio guard: any token the server invalidated must not keep
      // playing, so outstanding speech for the previous turn is stopped.
      if (Array.isArray(data.cancelledReadingTokens) && data.cancelledReadingTokens.length > 0) {
        voice.stop();
      }

      const session = data.readingSession ?? null;
      if (session) {
        readingSessionRef.current = session;
        try {
          localStorage.setItem(READING_SESSION_KEY, JSON.stringify(session));
        } catch {
          // Storage full or blocked: the in-memory session still works.
        }
      }

      // Auto-advance is driven by the server's own state (shared rule, also
      // unit-tested) — never assumed here.
      const passages = data.structuredCard?.granthReadCard?.passages ?? [];
      readingAutoAdvanceRef.current = shouldAutoAdvance(session, passages.length);

      const newMsg: ChatMessage = {
        id: `g-${Date.now()}`,
        sender: 'GURU',
        text: data.text || 'हर हर महादेव! 🙏',
        speakText: data.speakText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provenance: data.provenance,
        ...(data.structuredCard || {}),
        quickChips: data.quickChips || [
          { label: '✨ आज का शुभ समय', action: 'INTENT_ABHIJIT' },
          { label: '🕒 आज का राहुकाल', action: 'INTENT_RAHU' },
          { label: '🙏 अगली एकादशी', action: 'INTENT_NEXT_EKADASHI' },
          { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' }
        ]
      };

      // The delivered answer becomes the conversation's active fact, so
      // क्यों? / मतलब? / कब तक? have something concrete to point at; and the
      // follow-up chips ride along with the engine's own chips.
      if (typeof data.intent === 'string' && /^GET_/.test(data.intent)) {
        convStateRef.current = recordFact(convStateRef.current, {
          intent: data.intent,
          labelHi: INTENT_LABEL_HI[data.intent] ?? data.intent,
          valueHi: String(data.text || '').split('।')[0] + '।',
          dateIso: data.panchangContext?.referenceDate,
          locationHi: data.panchangContext?.location?.name,
        });
        const seen = new Set((newMsg.quickChips ?? []).map((c) => c.action));
        for (const chip of nextBestActions(convStateRef.current)) {
          if (!seen.has(chip.action)) {
            seen.add(chip.action);
            newMsg.quickChips = [...(newMsg.quickChips ?? []), chip];
          }
        }
      }

      setChatMessages(prev => [...prev, newMsg]);
      setLastSpeakableMsg(newMsg);
      return true;
    } catch (e) {
      console.warn('/api/guru/chat fetch fallback:', e);
      readingAutoAdvanceRef.current = false;
      return false;
    }
  };

  /**
   * Ask the server for the next stored passage (the same command the
   * "आगे पढ़ो" chip sends). Called when a passage has finished being spoken.
   */
  const advanceReading = async (): Promise<void> => {
    if (advancingRef.current) return;
    // Never keep reading into a closed panel: speech completion can land after
    // the user has closed the chat.
    if (!isOpenRef.current) {
      readingAutoAdvanceRef.current = false;
      return;
    }
    const before = readingSessionRef.current;
    if (!before || before.state !== 'reading') {
      readingAutoAdvanceRef.current = false;
      return;
    }
    advancingRef.current = true;
    try {
      const delivered = await postGuru('आगे पढ़ो');
      const after = readingSessionRef.current;
      // No progress (same cursor, no session, or the server declined) → stop
      // pulling, instead of asking again forever.
      if (!delivered || !after || after.cursorIndex === before.cursorIndex) {
        readingAutoAdvanceRef.current = false;
      }
    } finally {
      advancingRef.current = false;
    }
  };

  useEffect(() => {
    advanceReadingRef.current = advanceReading;
  }, [advanceReading]);

  /**
   * Send a message.
   *
   * `commandText` lets a caller (quick chips, reader controls, auto-advance)
   * send an explicit phrase. It is REQUIRED for those paths: setting React
   * state and then reading it in the same tick would send the previous, stale
   * input value instead.
   */
  const handleSendMessage = async (e?: React.FormEvent, commandText?: string) => {
    if (e) e.preventDefault();
    const raw = commandText ?? inputVal;
    const text = raw.trim();
    if (!text) return;

    // Check for local voice replay command (no network roundtrip, no duplicate message)
    const isReplayCommand = /^(फिर से बोलो|दोबारा सुनाओ|दोबारा बोलो|फिर से सुनाओ|repeat|say that again|replay)$/i.test(text);
    if (isReplayCommand) {
      if (lastSpeakableMsg) {
        voice.speak(lastSpeakableMsg.speakText || lastSpeakableMsg.text);
      }
      setInputVal('');
      return;
    }

    playClick();
    setInputVal('');

    const newMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, newMsg]);

    const safetyReply = getChatSafetyReply(text);
    if (safetyReply) {
      voice.stop();
      setChatMessages(prev => [...prev, {
        id: `safety-${Date.now()}`, sender: 'GURU', text: safetyReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      return;
    }

    // -----------------------------------------------------------------
    // V3 conversation core: entities → matcher → life concerns → follow-ups
    // → interruption-safe intake. All deterministic; no model in the loop.
    // -----------------------------------------------------------------
    const norm = normalizeUtterance(text);
    convStateRef.current = applyEntities(convStateRef.current, extractEntities(norm));
    const coreMatch = matchIntent(norm);

    const concern = coreMatch ? detectLifeConcern(coreMatch.intent) : null;
    if (concern) {
      voice.stop();
      const reply = lifeConcernReply(concern, seekerData.name);
      pushGuruMessage({ text: reply.text, speakText: reply.speakText, quickChips: [...LIFE_PATHWAY_CHIPS] });
      return;
    }

    if (coreMatch && (coreMatch.intent === 'DETAIL_SHORT' || coreMatch.intent === 'DETAIL_PANDIT')) {
      const lvl = convStateRef.current.detailLevel;
      pushGuruMessage({
        text: lvl === 'SHORT'
          ? 'ठीक है — अब उत्तर संक्षेप में: एक वाक्य, मान और स्रोत। फिर भी विस्तार चाहिए तो कहिए "विस्तार से"।'
          : 'ठीक है — अब पंडित-स्तर पर उत्तर दूँगा: सूक्त, नियम और गणना-क्रम सहित।',
        quickChips: nextBestActions(convStateRef.current),
      });
      return;
    }

    if (coreMatch && handleFollowUpIntent(coreMatch.intent)) {
      return;
    }

    // Interruption rule: while a flow is live, a factual question or a
    // follow-up is ANSWERED FULLY and the flow is suspended, never eaten as a
    // slot answer. "आज राहुकाल क्या है?" mid-birth-time must get its raahu
    // kaal, and the birth-time step must still be there afterwards.
    const intakeActive = intakeStep !== 'IDLE' && intakeStep !== 'COMPLETED';
    if (intakeActive) {
      const factual = resolveDeterministicKashiIntent(text, panchangContext ?? undefined);
      const interrupting = (coreMatch !== null && INTERRUPTING_INTENTS.has(coreMatch.intent)) || factual !== null;
      if (interrupting) {
        const frame = intakeFrame();
        convStateRef.current = suspendFlow(convStateRef.current, frame);
        setIntakeStep('IDLE');
        const nudge = () => pushGuruMessage({
          text: `${resumePromptHi(frame)} जब तैयार हों, "वापस" लिखिए या नीचे का बटन चुनिए — वहीं प्रश्न दोहराऊँगा जहाँ रुके थे।`,
          quickChips: [
            { label: `↩️ वापस — ${frame.labelHi} जारी रखें`, action: 'RESUME_FLOW' },
            ...nextBestActions(convStateRef.current),
          ],
        });
        if (factual) {
          void postGuru(text).then(nudge);
        } else if (coreMatch) {
          handleFollowUpIntent(coreMatch.intent);
          nudge();
        }
        return;
      }
    }

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
      persistSeekerProfile(); // safety net — profile active across the whole site

      // Compute deterministic Vedic Ephemeris
      let lagnaName = 'वृषभ (Vrishabha)';
      let nakshatraName = 'रोहिणी (Rohini)';
      let dashaStr = 'चन्द्र • गुरु';

      try {
        const kundali = calculateKundali({
          birthDate: seekerData.birthDate || '1995-06-15',
          birthTime: seekerData.birthTime || '10:30',
          latitude: Number(seekerData.birthLat ?? 25.5941),
          longitude: Number(seekerData.birthLon ?? 85.1376),
          timezone: Number(seekerData.birthTz ?? 5.5),
          locationName: seekerData.birthCity || 'Varanasi'
        });

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

      // Build the VIP handover packet now — the scholar must never restart
      // the intake. Deterministic; same seeker + pulse ⇒ same packet id.
      const transitStatusEarly = isCautionDay ? 'CAUTION_DAY' as const : 'POWER_DAY' as const;
      const transitMessageEarly = isCautionDay
        ? 'आज का दिन सतर्कता दिवस (Caution Window) है — चन्द्रमा के गोचर व राहुकाल के कारण नए वित्तीय या उग्र निर्णयों में धैर्य रखें।'
        : 'आज का दिन शुभ सिद्धि योग (Power Window) है — गुरु-चन्द्र की अनुकूल दृष्टि से सोचे गए कार्यों में प्रगति का योग है।';
      setHandoverPacket(buildScholarHandoverPacket({
        seeker: {
          name: seekerData.name,
          birthDate: seekerData.birthDate,
          birthTime: seekerData.birthTime,
          birthCity: seekerData.birthCity,
          lat: seekerData.birthLat,
          lon: seekerData.birthLon,
          question: text,
        },
        pulse: {
          lagna: lagnaName,
          nakshatra: nakshatraName,
          dasha: dashaStr,
          transitStatus: transitStatusEarly,
          transitMessage: transitMessageEarly,
          recommendation: isCautionDay
            ? 'महामृत्युंजय जप एवं काशी विश्वनाथ लाइव दर्शन; प्रश्न पर पंडित परामर्श पत्र व कॉल।'
            : 'शुभ समय सक्रिय है — प्रश्न का समाधान पंडित जी से प्रत्यक्ष परामर्श में शीघ्र सम्भव।',
        },
      }));

      const transitStatus = isCautionDay ? 'CAUTION_DAY' : 'POWER_DAY';
      const transitMessage = isCautionDay
        ? '⚠️ आज का दिन सतर्कता दिवस (Caution Window) है — चन्द्रमा के गोचर व राहुकाल के कारण नए वित्तीय या उग्र निर्णयों में धैर्य रखें।'
        : '✨ आज का दिन शुभ सिद्धि योग (Power Window) है — गुरु-चन्द्र की अनुकूल दृष्टि से सोचे गए कार्यों में प्रगति का योग है।';

      setTimeout(async () => {
        // Executive Life Gauges (Module 4): computed from the same canonical
        // kernel /report uses, via dynamic import so the chat bundle stays
        // light and a kernel failure costs only the gauge strip — never the
        // pulse card itself.
        let gauges: Array<{ titleHi: string; score: number; levelHi: string }> | undefined;
        try {
          const isoDate = normalizeBirthDateInput(seekerData.birthDate || '');
          const hhmm = normalizeBirthTimeInput(seekerData.birthTime || '');
          if (isoDate && hhmm) {
            const [{ getCanonicalJyotishSnapshot }, { computeExecutiveLifeDimensions }] = await Promise.all([
              import('@/lib/jyotish/canonicalSnapshot'),
              import('@/lib/jyotish/executiveLifeGauge'),
            ]);
            const snapshot = getCanonicalJyotishSnapshot({
              birthDate: isoDate,
              birthTime: hhmm,
              latitude: Number(seekerData.birthLat ?? 25.5941),
              longitude: Number(seekerData.birthLon ?? 85.1376),
              timezone: Number(seekerData.birthTz ?? 5.5),
              locationName: seekerData.birthCity || 'Varanasi',
            });
            const dims = computeExecutiveLifeDimensions(snapshot);
            if (Array.isArray(dims) && dims.length > 0) {
              gauges = dims.map((d) => ({ titleHi: d.titleHi, score: Math.round(d.score), levelHi: d.levelHi }));
            }
          }
        } catch (gaugeErr) {
          console.warn('Executive gauges unavailable for pulse card:', gaugeErr);
        }
        const topGauge = gauges ? gauges.slice().sort((a, b) => b.score - a.score)[0] : undefined;

        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `चिन्ता न करें ${seekerData.name || ''} जी! 🙏 हर कठिन परिस्थिति का शास्त्रसम्मत समाधान सम्भव है। मैंने आपकी कुण्डली की खगोलीय गणना व आज के गोचर का मिलान पूर्ण कर लिया है:`,
            // "Recite and display" (Module 4): the pulse is spoken, not just shown.
            speakText: `${seekerData.name ? `${seekerData.name} जी, ` : ''}आपकी खगोलीय गणना पूर्ण हुई। आपका लग्न ${lagnaName.split(' (')[0]} है, चन्द्र नक्षत्र ${nakshatraName.split(' (')[0]} है और वर्तमान दशा ${dashaStr} चल रही है। ${isCautionDay ? 'आज सतर्कता दिवस है — नए वित्तीय या उग्र निर्णयों में धैर्य रखें।' : 'आज शुभ सिद्धि योग है — सोचे हुए कार्यों में प्रगति का योग है।'}${topGauge ? ` आपका ${topGauge.titleHi} आयाम ${topGauge.score} प्रतिशत पर ${topGauge.levelHi} है।` : ''} पूर्ण कुण्डली के लिए पहला बटन, और पंडित जी से सीधी बात के लिए दूसरा बटन चुनिए।`,
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
              gauges,
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
                { label: '📥 ₹20 सम्पूर्ण कुण्डली PDF', price: '₹20', mode: 'KUNDLI_PDF', href: '/report' },
                { label: '📜 ₹501 कुण्डली + 10-15m व्याख्या', price: '₹501', mode: 'WRITTEN', href: '/ask?tier=WRITTEN' },
                { label: '📞 ₹1,100 सभा परामर्श (30m)', price: '₹1,100', mode: 'VOICE', href: '/ask?tier=VOICE' }
              ]
            },
            quickChips: [
              { label: '📥 सम्पूर्ण कुण्डली PDF (₹20)', action: 'NAV_REPORT_DOWNLOAD', href: '/report' },
              { label: '📜 ₹501 कुण्डली + 10-15 मिनट व्याख्या', action: 'OPEN_CHECKOUT_EXPLANATION', href: '/ask?tier=WRITTEN' },
              { label: '📞 ₹1,100 सभा परामर्श (विद्वान् कॉल)', action: 'OPEN_CHECKOUT_VOICE', href: '/ask?tier=VOICE' },
              { label: '✨ आज का गोचर व शुभ मुहूर्त', action: 'INTENT_ABHIJIT' },
              { label: '📞 पंडित जी से सीधी बात (VIP Concierge)', action: 'OPEN_CONCIERGE' },
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

    if (matchedIntent === 'INTENT_PANCHANG' || matchedIntent === 'INTENT_MUHURTA') {
      void postGuru(text);
      return;
    } else if (matchedIntent === 'INTENT_DARSHAN') {
      handleDarshanQuery(text);
    } else if (matchedIntent === 'INTENT_JOURNEY_KASHI') {
      handleKashiJourneyQuery();
    } else if (matchedIntent === 'INTENT_MANTRA') {
      handleMantraQuery(text);
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
      // Feeling-first fast path: if the seeker typed their emotional state
      // (e.g. "aaj mann bahut udaas hai", "मुझे डर लग रहा है"), Kashi Sahayak
      // understands instantly from the local emotion-keyword engine — no
      // network roundtrip — and responds with an empathetic shastra-anchored
      // bridge plus the full capability offering.
      const localInsight = findScriptureInsight(text);
      if (localInsight) {
        setSeekerData(prev => (prev.mood ? prev : { ...prev, mood: localInsight.situation }));
        const recitation = `${localInsight.verse}। भावार्थ: ${localInsight.meaningHi}`;
        const speakText = `${localInsight.kashiSahayakBridge}। शास्त्र का श्लोक सुनिए: ${recitation}`;
        setTimeout(() => {
          setChatMessages(prev => [
            ...prev,
            {
              id: `g-${Date.now()}`,
              sender: 'GURU',
              text: `${localInsight.kashiSahayakBridge}\n\nऔर बताइए — इस भावना के साथ आज किस विषय में सहायता चाहिए? नीचे से चुनें या विस्तार से लिखें:`,
              speakText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              scriptureCard: localInsight,
              provenance: {
                source: localInsight.sourceGrantha,
                interpretation: 'काशी सहायक • भाव-संवेदन (Mood-Aware)',
              },
              quickChips: CAPABILITY_CHIPS,
            },
          ]);
        }, 400);
        return;
      }

      // General Query -> Call /api/guru/chat backend AI Gateway with deterministic fallback
      const delivered = await postGuru(text);
      if (delivered) return;

      // Fallback
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `आपके विचार "${text}" के संदर्भ में वैदिक ज्योतिषीय दृष्टि से यह समय सजग अवलोकन का है। मैं आपके लिए आज का पञ्चाङ्ग निकाल सकती हूँ, महातीर्थों का साक्षात् लाइव दर्शन करा सकती हूँ, या काशी के विद्वान् ज्योतिषी से आपकी कुण्डली की विवेचना करा सकती हूँ।`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            provenance: {
              interpretation: 'काशी सहायक • AI-Assisted',
              source: 'CosmicTantra Universal Router'
            },
            quickChips: CAPABILITY_CHIPS,
          },
        ]);
      }, 400);
    }
  };

  // Sprint C §12/§13 — additive bridge: conversion surfaces hand structured
  // context (chart id, dasha ids, evidence ids, language, validation statuses).
  // The assistant only opens and runs its OWN deterministic pipeline with the
  // user's question; it never recalculates astrology from this payload.
  const handleSendRef = useRef<((text: string) => void) | null>(null);
  handleSendRef.current = (text: string) => { void handleSendMessage(undefined, text); };
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onJourneyContext = (e: Event) => {
      const ctx = (e as CustomEvent<KashiJourneyContext>).detail;
      if (!ctx || ctx.contractVersion !== 'kashi-journey-context-v1') return;
      journeyCtxRef.current = ctx;
      setIsOpen(true);
      if (ctx.question) {
        window.setTimeout(() => handleSendRef.current?.(ctx.question as string), 350);
      }
    };
    window.addEventListener(KASHI_JOURNEY_CONTEXT_EVENT, onJourneyContext);
    return () => window.removeEventListener(KASHI_JOURNEY_CONTEXT_EVENT, onJourneyContext);
  }, []);

  return (
    <>
      {/* FLOATING KASHI SAHAYAK AVATAR BUTTON (Fixed Bottom-Right) */}
      {/* `ct-avatar-root` lets the navigation shell lift the FAB above the mobile bottom bar without redesigning the assistant. */}
      <div className="ct-avatar-root fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end pointer-events-auto font-mono-data">
        
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
                  src="/images/avatar/kashi_sahayak_apsara.jpg"
                  alt="Kashi Sahayak Avatar"
                  fill
                  sizes="36px"
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
                src="/images/avatar/kashi_sahayak_apsara.jpg"
                alt="Kashi Sahayak Avatar"
                fill
                sizes="64px"
                className="object-cover"
              />
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black" />
            </div>
          )}
        </button>
      </div>

      {/* EXPANDED INTERACTIVE SACRED CONCIERGE CHAT DRAWER */}
      {isOpen && (
        <div className="ct-kashi-panel fixed inset-x-3 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto sm:w-[460px] max-h-[85vh] sm:max-h-[660px] h-[620px] bg-white/95 dark:bg-[#0C0E1A]/95 backdrop-blur-2xl border-2 border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden font-mono-data animate-in zoom-in-95 duration-200">
          
          {/* Top Sanctum Header with Banaras Avatar */}
          <div className="p-3 px-4 bg-gradient-to-r from-[#8E6F1D]/15 via-[#FAF7F2] to-[#D4AF37]/20 dark:from-[#D4AF37]/15 dark:via-[#121526] dark:to-[#8E6F1D]/20 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow-md">
                <Image
                  src="/images/avatar/kashi_sahayak_apsara.jpg"
                  alt="Kashi Sahayak"
                  fill
                  sizes="40px"
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
              {/* Persistent Main Menu: one tap back to every offering, from
                  any depth of the conversation. It never scrolls away. */}
              <button
                onClick={() => { playClick(); postMainMenu(); }}
                className="px-2 py-1.5 rounded-xl bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 text-[#8E6F1D] dark:text-[#F0C968] text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-[#8E6F1D]/25 dark:hover:bg-[#D4AF37]/25"
                title="मुख्य मेन्यू — सभी सेवाएँ एक tap पर"
              >
                <Menu className="w-3.5 h-3.5" />
                <span>मुख्य मेन्यू</span>
              </button>

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

              {/* Chimes & Sound FX Toggle (Bell) */}
              <button
                onClick={() => { playClick(); setSoundEnabled(!soundEnabled); }}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
                title={soundEnabled ? 'ध्वनि प्रभाव बन्द करें (Mute Chimes)' : 'ध्वनि प्रभाव चालू करें (Unmute Chimes)'}
              >
                {soundEnabled ? <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <BellOff className="w-3.5 h-3.5 text-rose-400" />}
              </button>

              {/* Kashi Sahayak Voice (TTS) Toggle */}
              <button
                onClick={() => { playClick(); voice.toggleVoice(); }}
                className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                  voice.voiceEnabled
                    ? 'bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#F0C968]'
                    : 'bg-black/5 dark:bg-white/5 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white'
                }`}
                title={voice.voiceEnabled ? 'काशी सहायक वाणी बंद करें (Mute Voice)' : 'काशी सहायक वाणी चालू करें (Enable Voice)'}
              >
                {voice.voiceEnabled
                  ? <Volume2 className="w-3.5 h-3.5" />
                  : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
              </button>

              {/* Fresh session (clears remembered chat & seeker intake) */}
              <button
                onClick={handleResetSession}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
                title="नया सत्र आरम्भ करें (Start Fresh — clears this chat's memory)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
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
                        src="/images/avatar/kashi_sahayak_apsara.jpg"
                        alt="Kashi Sahayak"
                        fill
                        sizes="28px"
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
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-line flex-1">{msg.text}</p>
                      {msg.sender === 'GURU' && (
                        <button
                          type="button"
                          onClick={() => voice.speak(msg.speakText || msg.text)}
                          className="p-1 rounded-md text-[#8E6F1D] dark:text-[#F0C968] hover:bg-black/5 dark:hover:bg-white/10 shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                          title="यह सन्देश सुनें"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

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

                    {/* Authentic Sacred Scripture Wisdom Card (Gita / Ramcharitmanas / Vedas) */}
                    {msg.scriptureCard && (
                      <div className="mt-3 p-4 rounded-2xl bg-gradient-to-b from-[#8E6F1D]/10 to-transparent dark:from-[#D4AF37]/15 dark:to-[#0A0C14] border border-[#8E6F1D]/35 dark:border-[#D4AF37]/40 space-y-3 text-left shadow-lg">
                        <div className="border-b border-black/10 dark:border-white/10 pb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black font-mono-data font-bold text-[9px] uppercase tracking-wider">
                              {msg.scriptureCard.sourceType}
                            </span>
                            <span className="font-editorial text-xs sm:text-sm font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                              {msg.scriptureCard.sourceGrantha}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono-data text-[#857E74]">
                            {msg.scriptureCard.situation}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#8E6F1D]/10 dark:bg-black/50 border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 text-center shadow-inner">
                          <p className="font-editorial font-bold text-sm sm:text-base text-[#8E6F1D] dark:text-[#F0C968] leading-relaxed whitespace-pre-line">
                            {msg.scriptureCard.verse}
                          </p>
                          {msg.scriptureCard.transliteration && (
                            <p className="font-mono-data text-[10px] text-[#857E74] dark:text-[#A8A29E] mt-2 italic">
                              {msg.scriptureCard.transliteration}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1 text-xs font-mono-data leading-relaxed">
                          <p className="text-[#1C1917] dark:text-[#FAF7F2]">
                            <strong className="text-[#8E6F1D] dark:text-[#F0C968]">भावार्थ:</strong> {msg.scriptureCard.meaningHi}
                          </p>
                          <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] italic">
                            {msg.scriptureCard.meaningEn}
                          </p>
                        </div>

                        {msg.scriptureCard.suggestedAction && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] flex items-start gap-2">
                            <span className="shrink-0">✦</span>
                            <span><strong>शास्त्रसम्मत उपाय:</strong> {msg.scriptureCard.suggestedAction}</span>
                          </div>
                        )}

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (msg.scriptureCard) {
                                handleListenVerse({ original: msg.scriptureCard.verse, meaning: msg.scriptureCard.meaningHi });
                              }
                            }}
                            className="w-full py-2.5 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>{voice.isSpeaking ? '⏸ श्लोक रोकें' : 'श्लोक सुनें'}</span>
                          </button>
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
                              type="button"
                              onClick={() => { playClick(); setActiveDarshanVideoMsgIds(prev => ({ ...prev, [msg.id]: false })); }}
                              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                !activeDarshanVideoMsgIds[msg.id] ? 'bg-[#8E6F1D] text-white shadow-xs' : 'text-white/60 hover:text-white'
                              }`}
                            >
                              🕉️ गर्भगृह
                            </button>
                            <button
                              type="button"
                              onClick={() => { handlePlayDiyaBell(); setActiveDarshanVideoMsgIds(prev => ({ ...prev, [msg.id]: true })); }}
                              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                activeDarshanVideoMsgIds[msg.id] ? 'bg-[#8E6F1D] text-white shadow-xs' : 'text-white/60 hover:text-white'
                              }`}
                            >
                              ▶ वीडियो
                            </button>
                          </div>
                        </div>

                        {/* Live Stream Screen OR HD Sanctum Window */}
                        <div className={`relative w-full h-52 rounded-xl overflow-hidden bg-black border transition-all duration-500 group shadow-inner ${
                          offeredDiyaMsgIds[msg.id]
                            ? 'border-amber-400/90 ring-2 ring-amber-400/80 shadow-[inset_0_0_35px_rgba(245,158,11,0.5),0_0_25px_rgba(251,191,36,0.6)]'
                            : 'border-white/10'
                        }`}>
                          {activeDarshanVideoMsgIds[msg.id] ? (
                            <div className="relative w-full h-full bg-black">
                              <video
                                key={`darshan-video-${msg.id}`}
                                src="/kashi-hero-video.mp4"
                                autoPlay
                                loop
                                muted={darshanVideoMuted[msg.id] !== false}
                                playsInline
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 pointer-events-none z-20">
                                <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[9px] font-mono-data font-bold flex items-center gap-1 shadow-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  साक्षात् परिसर व आरती (HD Ambient)
                                </span>
                              </div>

                              {/* Video Sound Toggle Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  playTick();
                                  setDarshanVideoMuted(prev => ({
                                    ...prev,
                                    [msg.id]: prev[msg.id] === false ? true : false
                                  }));
                                }}
                                className="absolute top-2 right-2 z-30 px-2 py-0.5 rounded-full bg-black/75 hover:bg-black/90 text-white text-[9px] font-mono-data font-bold border border-white/20 flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-md backdrop-blur-xs"
                                title={darshanVideoMuted[msg.id] === false ? "ध्वनि म्यूट करें" : "ध्वनि चालू करें"}
                              >
                                {darshanVideoMuted[msg.id] === false ? (
                                  <>
                                    <Volume2 className="w-3 h-3 text-emerald-400" />
                                    <span>ध्वनि चालू</span>
                                  </>
                                ) : (
                                  <>
                                    <VolumeX className="w-3 h-3 text-rose-400" />
                                    <span>ध्वनि म्यूट</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <>
                              <Image
                                src={msg.inChatDarshan.image || '/images/darshan/kashi-vishwanath.jpg'}
                                alt={msg.inChatDarshan.templeName}
                                fill
                                sizes="(max-width: 768px) 100vw, 400px"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              
                              {/* Sacred Ambient Vignette & Gradient */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/25 pointer-events-none" />

                              <div className="absolute top-2 left-2 pointer-events-none z-20">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-mono-data font-bold flex items-center gap-1 shadow-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  साक्षात् गर्भगृह दर्शन • कपाट खुले हैं
                                </span>
                              </div>

                              {/* Subtle non-obstructive bottom-right video switch button */}
                              <div className="absolute bottom-2 right-2 z-20">
                                <button
                                  type="button"
                                  onClick={() => { playTick(); setActiveDarshanVideoMsgIds(prev => ({ ...prev, [msg.id]: true })); }}
                                  className="px-2 py-0.5 rounded-full bg-black/75 hover:bg-black/90 border border-white/20 text-white text-[9px] font-mono-data font-bold flex items-center gap-1 shadow-md backdrop-blur-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                                  title="परिसर वीडियो दर्शन चलाएं"
                                >
                                  <Play className="w-2.5 h-2.5 fill-white text-white" />
                                  <span>परिसर वीडियो</span>
                                </button>
                              </div>
                            </>
                          )}

                          {/* Keyframe animation for falling flower cascade */}
                          <style>{`
                            @keyframes flowerCascadeChat {
                              0% {
                                transform: translateY(0px) rotate(0deg) scale(0.7);
                                opacity: 0;
                              }
                              10% {
                                opacity: 1;
                                transform: translateY(18px) rotate(30deg) scale(1.05);
                              }
                              85% {
                                opacity: 0.95;
                              }
                              100% {
                                transform: translateY(220px) rotate(360deg) scale(0.85);
                                opacity: 0;
                              }
                            }
                          `}</style>

                          {/* Falling Sacred Flower Petals Shower (Matches /darshan page) */}
                          {chatFlowers[msg.id]?.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                              {chatFlowers[msg.id].map((f) => (
                                <div
                                  key={f.id}
                                  className="absolute select-none pointer-events-none"
                                  style={{
                                    left: `${f.x}%`,
                                    top: `-20px`,
                                    fontSize: `${f.size}px`,
                                    animation: `flowerCascadeChat ${f.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                                    animationDelay: `${f.delay}s`,
                                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))',
                                  }}
                                >
                                  {f.icon}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sacred Deep Daan Border Illumination & Corner Mahadeeps (Matches /darshan page) */}
                          {offeredDiyaMsgIds[msg.id] && (
                            <div className="absolute inset-0 pointer-events-none z-30 select-none">
                              {/* 4 Auspicious Corner Mahadeeps */}
                              <div className="absolute top-1.5 left-2 text-base filter drop-shadow-[0_0_12px_rgba(251,191,36,1)] animate-bounce">🪔</div>
                              <div className="absolute top-1.5 right-2 text-base filter drop-shadow-[0_0_12px_rgba(251,191,36,1)] animate-bounce">🪔</div>
                              <div className="absolute bottom-6 left-2 text-base filter drop-shadow-[0_0_12px_rgba(251,191,36,1)] animate-bounce">🪔</div>
                              <div className="absolute bottom-6 right-2 text-base filter drop-shadow-[0_0_12px_rgba(251,191,36,1)] animate-bounce">🪔</div>

                              {/* Top Perimeter Diya Garland */}
                              <div className="absolute top-1 inset-x-10 flex justify-around items-center">
                                {['🪔', '🪔', '🪔', '🪔'].map((d, i) => (
                                  <span key={i} className="text-xs filter drop-shadow-[0_0_8px_rgba(251,191,36,1)] animate-pulse" style={{ animationDuration: `${1.1 + i * 0.25}s` }}>
                                    {d}
                                  </span>
                                ))}
                              </div>

                              {/* Center Sacred Diya Badge */}
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/85 px-2.5 py-0.5 rounded-full border border-amber-400/60 shadow-lg animate-fade-in">
                                <span className="text-xs animate-pulse">🪔</span>
                                <span className="text-[10px] font-mono-data font-bold text-amber-300">
                                  दीप प्रज्वलित • हर हर महादेव!
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Location & Timings Badge */}
                          <div className="absolute bottom-2 left-2 flex items-center text-[10px] text-white/95 font-semibold drop-shadow-md pointer-events-none z-20">
                            <span>{msg.inChatDarshan.location}</span>
                          </div>
                        </div>

                        {/* Sacred Interactive Ritual Control Actions (4 buttons) */}
                        <div className="grid grid-cols-4 gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleOfferDiya(msg.id);
                            }}
                            className={`py-1.5 px-1 rounded-xl text-[11px] font-mono-data font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95 ${
                              offeredDiyaMsgIds[msg.id]
                                ? 'bg-amber-500 text-black border-amber-400 font-black shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                                : 'bg-white/10 hover:bg-amber-500/20 text-amber-200 border-amber-500/30'
                            }`}
                          >
                            <span>🪔</span>
                            <span>{offeredDiyaMsgIds[msg.id] ? 'दीप अर्पित' : 'दीप दान'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleOfferFlowers(msg.id);
                            }}
                            className={`py-1.5 px-1 rounded-xl text-[11px] font-mono-data font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95 ${
                              offeredFlowersMsgIds[msg.id]
                                ? 'bg-rose-500 text-white border-rose-400 font-black shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                                : 'bg-white/10 hover:bg-rose-500/20 text-rose-200 border-rose-500/30'
                            }`}
                          >
                            <span>🌸</span>
                            <span>{offeredFlowersMsgIds[msg.id] ? 'पुष्प अर्पित' : 'पुष्प अर्पण'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { playBell(); }}
                            className="py-1.5 px-1 rounded-xl text-[11px] font-mono-data font-bold border border-white/10 bg-white/10 hover:bg-amber-500/20 text-amber-200 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                            title="घंटी बजाएं"
                          >
                            <span>🔔</span>
                            <span>घंटी</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { playConch(); }}
                            className="py-1.5 px-1 rounded-xl text-[11px] font-mono-data font-bold border border-white/10 bg-white/10 hover:bg-amber-500/20 text-amber-200 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                            title="शंखनाद करें"
                          >
                            <span>🐚</span>
                            <span>शंख</span>
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
                            <span>साक्षात् महाआरती लाइव देखें (आधिकारिक यूट्यूब)</span>
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

                        {/* Executive 6-Dimension Life Gauges (Module 4) */}
                        {msg.pulseCard.gauges && msg.pulseCard.gauges.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 space-y-1.5">
                            <div className="text-[10.5px] font-bold text-[#8E6F1D] dark:text-[#F0C968] font-editorial">
                              षड्-आयामी जीवन मापक (Executive Life Gauges)
                            </div>
                            {msg.pulseCard.gauges.map((g, gi) => (
                              <div key={gi} className="flex items-center gap-2">
                                <span className="w-28 shrink-0 text-[10px] text-[#44403C] dark:text-[#D1C9BF] truncate" title={g.titleHi}>{g.titleHi}</span>
                                <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37]"
                                    style={{ width: `${Math.max(4, Math.min(100, g.score))}%` }}
                                  />
                                </div>
                                <span className="w-24 shrink-0 text-right text-[9.5px] text-[#696256] dark:text-[#9E988D]">{g.score}% • {g.levelHi}</span>
                              </div>
                            ))}
                          </div>
                        )}

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

                        {/* The two doors out of the pulse: the full qualified
                            chart, or a human Pandit. Nothing else competes
                            with them on this card. */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleNavigate(reportHrefForSeeker())}
                            className="px-2 py-2 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] text-[11px] font-bold cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                          >
                            📥 पूर्ण कुण्डली देखें
                          </button>
                          <button
                            onClick={() => { playClick(); setConciergeOpen(true); }}
                            className="px-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer active:scale-95 transition-all"
                          >
                            📞 ज्योतिषी से बात करें
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Granth Recitation Card: mūla text + playback */}
                    {msg.recitalCard && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#0A0C14] border border-[#8E6F1D]/40 space-y-2.5 text-left">
                        <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-1.5">
                          <span className="font-editorial text-xs sm:text-sm font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                            🎧 {msg.recitalCard.recitalTitleHi}
                          </span>
                          <span className="text-[10px] text-[#696256] dark:text-[#9E988D] shrink-0">
                            {msg.recitalCard.unitLabelHi}
                          </span>
                        </div>

                        {msg.recitalCard.passages.map((passage, pi) => {
                          const active = recitalPlay?.msgId === msg.id && recitalPlay.index === pi;
                          return (
                            <div
                              key={`${msg.id}-p${pi}`}
                              className={`p-2.5 rounded-xl border transition-colors ${
                                active
                                  ? 'border-amber-500 bg-amber-500/10'
                                  : 'border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5'
                              }`}
                            >
                              <div className="text-[10px] font-bold text-[#8E6F1D] dark:text-[#F0C968]">{passage.ref}</div>
                              <div className="font-serif text-[13px] leading-relaxed whitespace-pre-line text-[#1C1917] dark:text-white mt-0.5">
                                {passage.sanskrit}
                              </div>
                              <div className="text-[11px] text-[#696256] dark:text-[#9E988D] mt-1 leading-relaxed">
                                {passage.hindi}
                              </div>
                              <button
                                onClick={() => (active ? stopRecital() : playRecitalPassage(msg, pi))}
                                className="mt-1.5 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-[10px] font-bold text-[#8E6F1D] dark:text-[#F0C968] cursor-pointer hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all"
                              >
                                {active ? '⏹ इस पद को रोकें' : '▶ इस पद को सुनें'}
                              </button>
                            </div>
                          );
                        })}

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => playRecitalPassage(msg, 0)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] text-[10px] font-bold cursor-pointer active:scale-95"
                          >
                            ▶ पाठ आरम्भ
                          </button>
                          <button
                            onClick={() => playRecitalNext(msg)}
                            className="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-[10px] font-bold text-[#1C1917] dark:text-white cursor-pointer active:scale-95"
                          >
                            ⏭ अगला पद
                          </button>
                          <button
                            onClick={stopRecital}
                            className="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-[10px] font-bold text-[#1C1917] dark:text-white cursor-pointer active:scale-95"
                          >
                            ⏹ रोकें
                          </button>
                        </div>
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
          {/* KASHI SAHAYAK — verified passage, clarification, quick actions */}
          <div data-testid="kashi-companion" data-revision={kashi.revision} className="px-3 pt-2 space-y-2">
            {kashi.lastResponse?.guidance === 'safety' && (
              <div data-testid="kashi-safety" role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs">
                {kashi.lastResponse.acknowledgement}
              </div>
            )}
            {kashi.pendingVerse && !verseDismissed ? (
              <KashiVerseCard
                passage={kashi.pendingVerse}
                reflection={kashi.lastResponse?.reflection || undefined}
                language="hi"
                autoplayAllowed={false}
                onListen={() => handleListenVerse(kashi.pendingVerse)}
                isPlaying={voice.isSpeaking}
                onDismiss={() => setVerseDismissed(true)}
                unresolvedReason={kashi.lastResponse?.unresolvedReason ?? null}
              />
            ) : kashi.lastResponse?.unresolvedReason ? (
              <div data-testid="kashi-no-passage" className="p-3 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-xs">
                {kashi.lastResponse.unresolvedReason}
              </div>
            ) : null}
            {kashi.voiceState === 'uncertain' && (
              <KashiClarification
                choices={kashi.clarification}
                language="hi"
                onChoose={(choice) => kashi.sendText(choice)}
                onRetryVoice={kashi.startListening}
                onTypeInstead={kashi.cancelListening}
              />
            )}
            {Boolean(kashi.pendingVerse || kashi.session.passageRef || kashi.session.cursor > 0) && (
              <KashiQuickActions
                actions={kashi.quickActions}
                onAction={(a) => {
                  if (a === 'रोकें') kashi.control('stop');
                  else if (a === 'आगे पढ़ें') kashi.control('advance');
                  else if (a === 'फिर से सुनाएं') kashi.control('repeat');
                  else if (a === 'केवल मुझसे बात करें') kashi.sendText('बस मुझसे बात करो');
                }}
              />
            )}
          </div>

          {/* Persistent Audio Replay Control Bar */}
          {lastSpeakableMsg && (
            <div className="px-3 py-1.5 bg-amber-500/10 dark:bg-amber-500/5 border-t border-amber-500/20 flex items-center justify-between text-xs font-mono-data">
              <div className="flex items-center gap-1.5 text-[#8E6F1D] dark:text-[#F0C968] font-bold text-[11px]">
                <Volume2 className="w-3.5 h-3.5" />
                <span>वाणी नियंत्रण</span>
              </div>
              <div className="flex items-center gap-1.5">
                {voice.isSpeaking ? (
                  <>
                    <button
                      type="button"
                      onClick={() => voice.pause()}
                      className="px-2 py-0.5 rounded bg-white dark:bg-[#121522] border border-amber-500/30 hover:bg-amber-500/20 text-[#8E6F1D] dark:text-[#F0C968] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Pause className="w-3 h-3" />
                      <span>रोकें</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => voice.stop()}
                      className="px-2 py-0.5 rounded bg-white dark:bg-[#121522] border border-black/10 text-rose-500 text-[10px] font-bold cursor-pointer"
                    >
                      बंद करें
                    </button>
                  </>
                ) : voice.isPaused ? (
                  <>
                    <button
                      type="button"
                      onClick={() => voice.resume()}
                      className="px-2 py-0.5 rounded bg-white dark:bg-[#121522] border border-amber-500/30 hover:bg-amber-500/20 text-[#8E6F1D] dark:text-[#F0C968] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>जारी रखें</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => voice.stop()}
                      className="px-2 py-0.5 rounded bg-white dark:bg-[#121522] border border-black/10 text-rose-500 text-[10px] font-bold cursor-pointer"
                    >
                      बंद करें
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (lastSpeakableMsg) {
                        voice.speak(lastSpeakableMsg.speakText || lastSpeakableMsg.text);
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-[#121522] border border-amber-500/30 hover:bg-amber-500/20 text-[#8E6F1D] dark:text-[#F0C968] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>🔊 फिर से सुनें</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="p-2.5 sm:p-3 bg-[#FAF7F2] dark:bg-[#121526] border-t border-black/10 dark:border-white/10 shrink-0">
            <KashiComposer
              language="hi"
              voiceState={kashi.voiceState}
              transcript={kashi.transcript}
              canAutoSend={kashi.canAutoSend}
              muted={kashi.session.muted}
              speaking={false}
              value={inputVal}
              onValueChange={(v) => { setInputVal(v); kashi.editTranscript(v); }}
              onSend={() => {
                const typed = (kashi.transcript || inputVal).trim();
                if (typed) kashi.sendText(typed);
                setInputVal('');
                void handleSendMessage();
              }}
              onMicPress={() => (kashi.voiceState === 'listening' ? kashi.stopListening() : kashi.startListening())}
              onCancelListening={kashi.cancelListening}
              onToggleMute={() => kashi.control(kashi.session.muted ? 'unmute' : 'mute')}
              onStopSpeaking={() => kashi.control('stop')}
            />
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------
          VIP Concierge modal — the human handoff.
          Call and WhatsApp first, then the five-step roadmap so a first-time
          seeker knows exactly what ₹501 buys before paying anything.
          ------------------------------------------------------------------ */}
      {conciergeOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConciergeOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="VIP Concierge — पंडित जी से सीधी बात"
        >
          <div
            className="w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0C0E1A] border-2 border-[#D4AF37]/60 p-5 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-editorial text-base font-bold text-[#1C1917] dark:text-white">
                  📞 VIP Concierge — पंडित जी से सीधी बात
                </h3>
                <p className="text-[11px] text-[#696256] dark:text-[#9E988D] mt-0.5">
                  काशी विद्वत् परिषद् • मानव ज्योतिषी, AI नहीं
                </p>
              </div>
              <button
                onClick={() => setConciergeOpen(false)}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-[#696256] dark:text-[#9E988D] cursor-pointer"
                title="बंद करें"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <a
              href={VIP_CONCIERGE_TEL}
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
            >
              📞 कॉल करें {VIP_CONCIERGE_PHONE_DISPLAY}
            </a>
            <a
              href={conciergeWhatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold active:scale-95 transition-all"
            >
              💬 WhatsApp पर संदेश भेजें (पूर्व-भरा हुआ)
            </a>

            <div className="rounded-2xl bg-[#FAF7F2] dark:bg-[#121526] border border-black/10 dark:border-white/10 p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="text-[11px] font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                  🗂️ ScholarHandoverPacket — पंडित जी के लिए तैयार सारांश
                </div>
                {handoverPacket && (
                  <button
                    onClick={() => {
                      playClick();
                      void navigator.clipboard?.writeText(handoverPacket.whatsappText);
                    }}
                    className="shrink-0 px-2 py-1 rounded-lg bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 text-[10px] font-bold text-[#8E6F1D] dark:text-[#F0C968] cursor-pointer"
                    title="पूरा पैकेट कॉपी करें"
                  >
                    📋 कॉपी करें
                  </button>
                )}
              </div>
              {handoverPacket ? (
                <div className="space-y-1 text-[10.5px] text-[#44403C] dark:text-[#D1C9BF] leading-relaxed max-h-40 overflow-y-auto pr-1">
                  <div className="font-mono text-[10px] text-[#696256] dark:text-[#9E988D]">{handoverPacket.packetId}</div>
                  {handoverPacket.displayLines.map((line, i) => (
                    <div key={i} className={line.startsWith('•') ? '' : 'font-bold text-[#1C1917] dark:text-white mt-1'}>
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10.5px] text-[#696256] dark:text-[#9E988D] leading-relaxed">
                  कुंडली इन्टेक (नाम → जन्म विवरण → प्रश्न) पूरा होते ही यह पैकेट स्वतः बन जाएगा और
                  WhatsApp संदेश में भी जुड़ जाएगा। तब तक कृपया पंडित जी को जन्म विवरण व प्रश्न बता दें।
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-[#FAF7F2] dark:bg-[#121526] border border-black/10 dark:border-white/10 p-3">
              <div className="text-[11px] font-bold text-[#8E6F1D] dark:text-[#F0C968] mb-1.5">
                परामर्श की पाँच चरण यात्रा
              </div>
              <ol className="space-y-1.5 text-[11px] text-[#44403C] dark:text-[#D1C9BF] leading-relaxed list-decimal list-inside">
                {VIP_CONCIERGE_ROADMAP_HI.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <p className="text-[10px] text-[#696256] dark:text-[#9E988D] leading-relaxed">
              भुगतान केवल आधिकारिक WhatsApp लिंक पर ही कीजिए। काशी सहायक कभी भी OTP,
              बैंक विवरण या किसी अन्य चैनल पर भुगतान नहीं माँगता।
            </p>
          </div>
        </div>
      )}
    </>
  );
}
