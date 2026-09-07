'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Phone, 
  Video, 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft, 
  X, 
  RotateCcw,
  Award,
  Volume2,
  VolumeX,
  Compass,
  Heart,
  MessageSquare,
  ChevronRight,
  Sun,
  Moon,
  BookOpen,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { getActiveProfile, getProfiles, upsertProfile, setActiveProfileId } from '@/lib/profileStore';
import { chitiSensory } from '@/lib/chitiAudio';
import { calculateKundali } from '@/lib/astrologyEngine';
import { getCanonicalPanchangBundle } from '@/lib/panchangFactBundle';
import { useKashiVoice } from '@/lib/ai/useKashiVoice';
import { getChatSafetyReply } from '@/lib/ai/chatSafety';
import { findScriptureInsight } from '@/lib/ai/scriptureMap';
import { parseBirthTime, parseBirthDate, resolveBirthCity, CityChoice } from '@/lib/ai/intakeParsing';
import { useKashiSahayak } from '@/hooks/useKashiSahayak';
import { KashiComposer } from '@/components/kashi/KashiComposer';
import { KashiVerseCard } from '@/components/kashi/KashiVerseCard';
import { KashiClarification, KashiQuickActions } from '@/components/kashi/KashiClarification';
import type { EmotionId } from '@/lib/kashi/emotionalSupport';

// Loads Razorpay Checkout dynamically
let rzpScriptPromise: Promise<any> | null = null;
function loadRazorpayCheckout() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const w = window as any;
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  if (!rzpScriptPromise) {
    rzpScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve((window as any).Razorpay);
      s.onerror = () => reject(new Error('Razorpay checkout failed to load'));
      document.body.appendChild(s);
    });
  }
  return rzpScriptPromise;
}

interface Message {
  id: string;
  sender: 'GURU_AI' | 'USER';
  text: string;
  speakText?: string;
  timestamp: string;
  isPulseReport?: boolean;
  pulseData?: any;
  isPanchangCard?: boolean;
  panchangData?: any;
  isPanditCard?: boolean;
  panditData?: any;
}

interface AIGuruChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'hi';
  onConsultationBooked?: (consultationId: string, mode: 'WRITTEN' | 'VOICE' | 'VIDEO') => void;
}

const LIFE_DOMAINS = [
  { id: 'CAREER', labelEn: '💼 Career, Job & Business', labelHi: '💼 आजीविका, व्यवसाय व धन वृद्धि' },
  { id: 'MARRIAGE', labelEn: '💍 Marriage, Love & Kundali Milan', labelHi: '💍 विवाह, प्रेम संबंध व दाम्पत्य' },
  { id: 'HEALTH', labelEn: '🌿 Health, Longevity & Ayur-Veda', labelHi: '🌿 स्वास्थ्य, दीर्घायु व मानसिक शांति' },
  { id: 'UPAYA', labelEn: '🪔 Spiritual Dharma, Graha Dosh & Upaya', labelHi: '🪔 ग्रह दोष शान्ति, यन्त्र व वैदिक उपाय' },
  { id: 'PROPERTY', labelEn: '🏛️ Property, Court & Family Peace', labelHi: '🏛️ भूमि, भवन, न्यायालय व पारिवारिक सुख' },
];

export default function AIGuruChatbotModal({
  isOpen,
  onClose,
  lang = 'hi',
  onConsultationBooked
}: AIGuruChatbotModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const voice = useKashiVoice();
  const [step, setStep] = useState<'WELCOME' | 'NAME' | 'BIRTH_DATE' | 'BIRTH_TIME' | 'BIRTH_PLACE' | 'DOMAIN' | 'QUESTION' | 'CALCULATING' | 'PACKAGE_SELECT' | 'CONFIRMED'>('WELCOME');
  
  const [gridCollapsed, setGridCollapsed] = useState(false);
  const [showServicesSheet, setShowServicesSheet] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    gender: 'MALE',
    phone: '',
    email: '',
    birthDate: '1995-06-15',
    birthTime: '10:30',
    birthPlace: 'Varanasi, UP',
    birthLat: 25.3176,
    birthLon: 82.9739,
    timezone: 5.5,
    domain: 'CAREER',
    question: '',
    mood: '',
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pulseReport, setPulseReport] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<'WRITTEN' | 'VOICE' | 'VIDEO' | 'PARIVAAR'>('VOICE');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState('');

  const [pendingConfirm, setPendingConfirm] = useState<{
    kind: 'date' | 'time' | 'place';
    value: string;
    label: string;
    lat?: number;
    lng?: number;
    tz?: number;
    suggestions?: CityChoice[];
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, step, gridCollapsed]);

  // Voice read aloud
  const lastSpokenIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;
    const last = messages[messages.length - 1];
    const toSpeak = last?.speakText || last?.text;
    if (last && last.sender === 'GURU_AI' && toSpeak && last.id !== lastSpokenIdRef.current && !last.isPanditCard) {
      lastSpokenIdRef.current = last.id;
      voice.speak(toSpeak);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const MODAL_SESSION_KEY = 'kashi-consult-session-v2';

  const resetConsultSession = () => {
    chitiSensory.playTick();
    voice.stop();
    try {
      window.localStorage.removeItem(MODAL_SESSION_KEY);
    } catch {
      // ignore
    }
    setMessages([]);
    setStep('WELCOME');
    setGridCollapsed(false);
    setShowServicesSheet(false);
    setPendingConfirm(null);
    setPulseReport(null);
    setCreatedCaseId('');
    setIsProcessingPayment(false);
    setSelectedTier('VOICE');
    setUserData({
      name: '', gender: 'MALE', phone: '', email: '',
      birthDate: '1995-06-15', birthTime: '10:30', birthPlace: 'Varanasi, UP',
      birthLat: 25.3176, birthLon: 82.9739, timezone: 5.5,
      domain: 'CAREER', question: '', mood: '',
    });
  };

  // Persist conversation
  useEffect(() => {
    if (typeof window === 'undefined' || messages.length === 0) return;
    try {
      if (step === 'CONFIRMED') {
        window.localStorage.removeItem(MODAL_SESSION_KEY);
        return;
      }
      window.localStorage.setItem(
        MODAL_SESSION_KEY,
        JSON.stringify({
          messages: messages.slice(-80),
          step,
          gridCollapsed,
          userData,
          pulseReport,
          createdCaseId,
          pendingConfirm,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // storage full/blocked
    }
  }, [messages, step, gridCollapsed, userData, pulseReport, createdCaseId, pendingConfirm]);

  // Initial greeting setup
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      try {
        const raw = window.localStorage.getItem(MODAL_SESSION_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved?.messages) && saved.messages.length > 0 && saved.step !== 'CONFIRMED' &&
            Number.isFinite(Date.parse(saved.savedAt)) && Date.now() - Date.parse(saved.savedAt) < 7 * 86400000) {
            setMessages(saved.messages.slice(-80));
            if (saved.step) setStep(saved.step === 'CALCULATING' ? 'QUESTION' : saved.step);
            if (saved.gridCollapsed !== undefined) setGridCollapsed(saved.gridCollapsed);
            if (saved.pendingConfirm) setPendingConfirm(saved.pendingConfirm);
            if (saved.userData) setUserData(prev => ({ ...prev, ...saved.userData }));
            if (saved.pulseReport) setPulseReport(saved.pulseReport);
            if (saved.createdCaseId) setCreatedCaseId(saved.createdCaseId);
            return;
          }
        }
      } catch {
        // fallthrough
      }

      const activeProfile = getActiveProfile();
      if (activeProfile && activeProfile.name) {
        setUserData(prev => ({
          ...prev,
          name: activeProfile.name || '',
          birthDate: activeProfile.birthDate || prev.birthDate,
          birthTime: activeProfile.birthTime || prev.birthTime,
          birthPlace: activeProfile.birthCity || prev.birthPlace,
          birthLat: activeProfile.lat || prev.birthLat,
          birthLon: activeProfile.lng || prev.birthLon,
          timezone: activeProfile.tz ?? prev.timezone,
        }));
      }

      const greetingText = lang === 'hi'
        ? "नमस्ते! 🙏\nमैं काशी सहायक हूँ।\nमैं आपकी कुंडली, पंचांग, मुहूर्त, विवाह मिलान और जीवन के महत्वपूर्ण प्रश्नों में सहायता कर सकती हूँ।"
        : "Namaste! 🙏\nI am Kashi Sahayak.\nI can assist you with your birth chart, panchang, muhurat, marriage compatibility, and essential life inquiries.";

      const promptText = lang === 'hi'
        ? "आज आप क्या जानना चाहते हैं?"
        : "What would you like to explore today?";

      setMessages([
        {
          id: 'msg-greeting',
          sender: 'GURU_AI',
          text: greetingText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: 'msg-subprompt',
          sender: 'GURU_AI',
          text: promptText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setStep('WELCOME');
      setGridCollapsed(false);
    }
  }, [isOpen, lang, messages.length]);

  if (!isOpen) return null;

  const kashi = useKashiSahayak();
  const [verseDismissed, setVerseDismissed] = useState(false);

  const handleListenVerse = (passage: any) => {
    chitiSensory.playTick();
    if (!passage) return;
    const verseText = passage.original || passage.verse || '';
    const meaningText = passage.meaning || passage.meaningHi || '';
    const recitation = `${verseText}। भावार्थ: ${meaningText}`;
    voice.speak(recitation, { rate: 0.82 });
    kashi.control('resume');
  };

  useEffect(() => {
    if (kashi.pendingVerse) {
      setVerseDismissed(false);
    }
  }, [kashi.pendingVerse]);

  // Handle Quick Suggestions Grid Taps
  const handleGridAction = (actionKey: string) => {
    chitiSensory.playTick();
    setGridCollapsed(true);

    if (actionKey === 'KUNDLI') {
      const activeProfile = getActiveProfile();
      const userMsgText = lang === 'hi' ? 'मेरी कुंडली बताओ' : 'Show my Kundli chart';
      setMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'USER',
          text: userMsgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);

      if (activeProfile && activeProfile.name) {
        runVedicCalculationAndDeliverPulse('सामान्य कुण्डली व ग्रह विश्लेषण');
      } else {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [
            ...prev,
            {
              id: `guru-${Date.now()}`,
              sender: 'GURU_AI',
              text: lang === 'hi'
                ? 'शुभम्! आपकी कुण्डली की प्रत्यक्ष खगोलीय गणना हेतु कृपया अपना शुभ नाम बताएँ:'
                : 'Auspicious! Please tell me your full name to generate your birth chart:',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
          setStep('NAME');
        }, 500);
      }
    } else if (actionKey === 'QUESTION') {
      setMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'USER',
          text: lang === 'hi' ? 'मुझे एक प्रश्न पूछना है' : 'I have a question',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `guru-${Date.now() + 1}`,
          sender: 'GURU_AI',
          text: lang === 'hi'
            ? 'कृपया नीचे परामर्श विषय चुनें या सीधे अपना प्रश्न लिखें:'
            : 'Please select a topic or type your question directly below:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setStep('DOMAIN');
    } else if (actionKey === 'MILAN') {
      setMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'USER',
          text: lang === 'hi' ? 'विवाह मिलान देखना है' : 'Check Kundali Milan',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `guru-${Date.now() + 1}`,
          sender: 'GURU_AI',
          text: lang === 'hi'
            ? 'विवाह मिलान (गुण मिलान व अष्टकूट विश्लेषण) हेतु वर एवं वधू के नाम व जन्म विवरण की आवश्यकता होती है। आप अपना प्रश्न या विवरण यहाँ लिखें:'
            : 'For Kundali Milan (Ashtakoot Guna matching), please share the birth details of both partners below:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setStep('QUESTION');
    } else if (actionKey === 'PANCHANG') {
      const todayPanchang = getCanonicalPanchangBundle(new Date(), { name: 'Varanasi', lat: 25.3176, lng: 82.9739, tz: 5.5 });
      setMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'USER',
          text: lang === 'hi' ? 'आज का पंचांग देखना है' : 'Show today\'s Panchang',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `guru-panchang-${Date.now() + 1}`,
          sender: 'GURU_AI',
          text: lang === 'hi'
            ? `📅 आज का श्री काशी विश्वनाथ पञ्चाङ्ग (${todayPanchang.date}):\n\n• तिथि: ${todayPanchang.tithi.fullNameHi}\n• नक्षत्र: ${todayPanchang.nakshatra.nameHi}\n• वार: ${todayPanchang.weekdayNameHi}\n• सूर्योदय: ${todayPanchang.sun.sunrise} | सूर्यास्त: ${todayPanchang.sun.sunset}\n• राहुकाल: ${todayPanchang.timings.rahuKalam}\n• अभिजित मुहूर्त: ${todayPanchang.timings.abhijitMuhurat}`
            : `📅 Today's Vedic Panchang (${todayPanchang.date}):\n\n• Tithi: ${todayPanchang.tithi.fullName}\n• Nakshatra: ${todayPanchang.nakshatra.name}\n• Day: ${todayPanchang.weekdayName}\n• Sunrise: ${todayPanchang.sun.sunrise} | Sunset: ${todayPanchang.sun.sunset}\n• Rahu Kaal: ${todayPanchang.timings.rahuKalam}\n• Abhijit Muhurat: ${todayPanchang.timings.abhijitMuhurat}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isPanchangCard: true,
          panchangData: todayPanchang,
        }
      ]);
    } else if (actionKey === 'PANDIT') {
      setMessages(prev => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'USER',
          text: lang === 'hi' ? 'पंडित जी से बात करनी है' : 'I want to speak with a Pandit',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `guru-pandit-${Date.now() + 1}`,
          sender: 'GURU_AI',
          text: lang === 'hi'
            ? 'काशी के मुख्य ज्योतिषाचार्य प्रत्यक्ष परामर्श हेतु उपलब्ध हैं:'
            : 'Our senior Banaras Scholar is available for immediate consultation:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isPanditCard: true,
          panditData: {
            name: 'पं. विद्यानन्द शास्त्री',
            tradition: 'वाराणसी परम्परा • काशी विद्वत् परिषद',
            specialties: 'विवाह • कुंडली • मुहूर्त • ग्रह शान्ति',
            status: 'अभी उपलब्ध',
            duration: '15 मिनट',
            price: 1100,
          }
        }
      ]);
      setStep('PACKAGE_SELECT');
    } else if (actionKey === 'MORE_SERVICES') {
      setShowServicesSheet(true);
    }
  };

  const handleSecondaryService = (title: string, msgText: string) => {
    chitiSensory.playTick();
    setShowServicesSheet(false);
    setGridCollapsed(true);

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'USER',
        text: msgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: `guru-${Date.now() + 1}`,
        sender: 'GURU_AI',
        text: lang === 'hi'
          ? `शुभम्! "${title}" हेतु काशी के सत्यापित अनुष्ठानिक विद्वानों द्वारा विशेष सेवा उपलब्ध है। कृपया अपना विशिष्ट संकल्प या विवरण लिखें:`
          : `Auspicious! Special services for "${title}" are available through our Banaras scholars. Please share your details:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setStep('QUESTION');
  };

  const confirmPendingInput = (cityPick?: CityChoice) => {
    chitiSensory.playTick();
    const p = pendingConfirm;
    if (!p && !cityPick) return;

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      if (cityPick || p?.kind === 'place') {
        const c = cityPick;
        const placeValue = c ? `${c.name}, ${c.state}` : p!.value;
        const lat = c ? c.lat : p!.lat;
        const lng = c ? c.lng : p!.lng;
        const tz = c ? c.tz : p!.tz;
        setUserData(prev => ({
          ...prev,
          birthPlace: placeValue,
          birthLat: lat ?? prev.birthLat,
          birthLon: lng ?? prev.birthLon,
          timezone: tz ?? prev.timezone,
        }));
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: lang === 'hi'
              ? `धन्यवाद 🙏 जन्म स्थान ${placeValue} दर्ज हो गया।\n\nअब कृपया नीचे दिए गए विकल्पों में से अपना मुख्य विषय चुनें:`
              : `Thank you 🙏 Birth place ${placeValue} recorded.\n\nNow please select the core life domain for your consultation:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setPendingConfirm(null);
        setStep('DOMAIN');
        return;
      }

      if (p!.kind === 'date') {
        setUserData(prev => ({ ...prev, birthDate: p!.value }));
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: lang === 'hi'
              ? `धन्यवाद 🙏 जन्म तिथि ${p!.label} दर्ज हो गई।\n\nअब कृपया अपना जन्म समय बताएं (जैसे 2:20 AM, 14:45 या "शाम 7 बजे"):`
              : `Thank you 🙏 Birth date ${p!.label} recorded.\n\nNow your birth time (e.g. 2:20 AM, 14:45, or "7 PM"):`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setPendingConfirm(null);
        setStep('BIRTH_TIME');
        return;
      }

      setUserData(prev => ({ ...prev, birthTime: p!.value }));
      setMessages(prev => [
        ...prev,
        {
          id: `guru-${Date.now()}`,
          sender: 'GURU_AI',
          text: lang === 'hi'
            ? `धन्यवाद 🙏 जन्म समय ${p!.label} दर्ज हो गया।\n\nअब कृपया अपना जन्म स्थान बताएं (जैसे "वाराणसी" या "Bilaspur, CG"):`
            : `Thank you 🙏 Birth time ${p!.label} recorded.\n\nNow please tell me your birth place (e.g. "Varanasi" or "Bilaspur, CG"):`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setPendingConfirm(null);
      setStep('BIRTH_PLACE');
    }, 400);
  };

  const correctPendingInput = () => {
    chitiSensory.playTick();
    const p = pendingConfirm;
    setPendingConfirm(null);
    if (!p) return;
    const reask = {
      date: lang === 'hi' ? 'कृपया जन्म तिथि दुबारा लिखें (जैसे 1996-08-15):' : 'Please retype birth date (e.g. 1996-08-15):',
      time: lang === 'hi' ? 'कृपया जन्म समय दुबारा लिखें (जैसे 2:20 PM):' : 'Please retype birth time (e.g. 2:20 PM):',
      place: lang === 'hi' ? 'कृपया जन्म स्थान दुबारा लिखें (शहर व राज्य):' : 'Please retype birth place (city and state):',
    }[p.kind];
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `guru-${Date.now()}`,
          sender: 'GURU_AI',
          text: reask,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }, 400);
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    chitiSensory.playTick();
    setGridCollapsed(true);
    const currentInput = inputText.trim();
    setInputText('');

    const newMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: currentInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);

    const safetyReply = getChatSafetyReply(currentInput, lang);
    if (safetyReply) {
      voice.stop();
      setPendingConfirm(null);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `safety-${Date.now()}`, sender: 'GURU_AI', text: safetyReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      return;
    }

    if (step === 'NAME') {
      setUserData(prev => ({ ...prev, name: currentInput }));
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: lang === 'hi'
              ? `शुभम् ${currentInput} जी! कृपया अपनी जन्म तिथि (YYYY-MM-DD) बताएं:`
              : `Greetings, ${currentInput}! Please provide your Date of Birth (YYYY-MM-DD):`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setStep('BIRTH_DATE');
      }, 500);
    } else if (step === 'BIRTH_DATE') {
      const parsed = parseBirthDate(currentInput);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        if (!parsed.ok) {
          setPendingConfirm(null);
          setMessages(prev => [
            ...prev,
            {
              id: `guru-${Date.now()}`,
              sender: 'GURU_AI',
              text: lang === 'hi'
                ? `क्षमा करें 🙏 "${currentInput}" तिथि समझ नहीं आई। कृपया 1996-08-15 या 15/08/1996 के रूप में लिखें:`
                : `Sorry 🙏 I could not read "${currentInput}" as a date. Please use 1996-08-15 or 15/08/1996:`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
          return;
        }
        setPendingConfirm({ kind: 'date', value: parsed.iso!, label: lang === 'hi' ? parsed.labelHi! : parsed.labelEn! });
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: lang === 'hi'
              ? `जन्म तिथि ${parsed.labelHi} (${parsed.iso}) समझी गई — क्या यह सही है?`
              : `Date of birth read as ${parsed.labelEn} (${parsed.iso}) — is this correct?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }, 400);
    } else if (step === 'BIRTH_TIME') {
      const parsed = parseBirthTime(currentInput);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        if (!parsed.ok) {
          setPendingConfirm(null);
          setMessages(prev => [
            ...prev,
            {
              id: `guru-${Date.now()}`,
              sender: 'GURU_AI',
              text: lang === 'hi'
                ? `क्षमा करें 🙏 "${currentInput}" समय समझ नहीं आया। कृपया 2:20 AM या 14:45 के रूप में लिखें:`
                : `Sorry 🙏 Could not read "${currentInput}" as a time. Please use 2:20 AM or 14:45:`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
          return;
        }
        setPendingConfirm({ kind: 'time', value: parsed.time24!, label: lang === 'hi' ? parsed.label! : parsed.labelEn! });
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: lang === 'hi'
              ? `जन्म समय ${parsed.label} (${parsed.time24}) समझा गया — क्या यह सही है?`
              : `Birth time read as ${parsed.labelEn} (${parsed.time24}) — is this correct?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }, 400);
    } else if (step === 'BIRTH_PLACE') {
      const res = resolveBirthCity(currentInput);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        if (res.status === 'none') {
          setPendingConfirm(null);
          setMessages(prev => [
            ...prev,
            {
              id: `guru-${Date.now()}`,
              sender: 'GURU_AI',
              text: lang === 'hi'
                ? `क्षमा करें 🙏 "${currentInput}" स्थान नहीं मिला। निकटतम बड़े शहर का नाम लिखें (जैसे "वाराणसी" या "Bilaspur, CG"):`
                : `Sorry 🙏 Could not resolve "${currentInput}". Please name nearest major city (e.g. "Varanasi"):`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
          return;
        }
        if (res.status === 'choices') {
          setPendingConfirm({ kind: 'place', value: '', label: '', suggestions: res.choices });
          setMessages(prev => [
            ...prev,
            {
              id: `guru-${Date.now()}`,
              sender: 'GURU_AI',
              text: lang === 'hi' ? 'कृपया अपना सही जन्म स्थान चुनें:' : 'Please choose your exact birth place:',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
          return;
        }
        const c = res.primary!;
        setPendingConfirm({ kind: 'place', value: `${c.name}, ${c.state}`, label: `${c.name}, ${c.state}`, lat: c.lat, lng: c.lng, tz: c.tz });
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: lang === 'hi'
              ? `जन्म स्थान ${c.name}, ${c.state} समझा गया — क्या यह सही है?`
              : `Birth place read as ${c.name}, ${c.state} — is this correct?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }, 400);
    } else {
      setUserData(prev => ({ ...prev, question: currentInput }));
      runVedicCalculationAndDeliverPulse(currentInput);
    }
  };

  const handleSelectDomain = (domainId: string, domainLabel: string) => {
    chitiSensory.playTick();
    setUserData(prev => ({ ...prev, domain: domainId }));

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'USER',
        text: domainLabel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: `guru-${Date.now() + 1}`,
        sender: 'GURU_AI',
        text: lang === 'hi'
          ? `कृपया अपना विशिष्ट प्रश्न यहाँ लिखें, ताकि खगोलीय विश्लेषण कर विद्वान् को भेजा जा सके:`
          : `Please describe your specific question so we can analyze your ephemeris and inform the scholar:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setStep('QUESTION');
  };

  const runVedicCalculationAndDeliverPulse = (seekerQuestion: string) => {
    setStep('CALCULATING');
    setIsTyping(true);

    try {
      const existing = getActiveProfile();
      const samePerson =
        !!existing?.name &&
        !!userData.name &&
        existing.name.trim().toLowerCase() === userData.name.trim().toLowerCase() &&
        existing.birthDate === userData.birthDate && existing.birthTime === userData.birthTime;
      const saved = upsertProfile({
        id: samePerson ? existing!.id : undefined,
        name: userData.name || 'जिज्ञासु',
        relation: samePerson ? (existing as any).relation || 'Self' : 'Self',
        birthDate: userData.birthDate,
        birthTime: userData.birthTime,
        birthCity: userData.birthPlace,
        lat: userData.birthLat,
        lng: userData.birthLon,
        tz: userData.timezone,
      } as any);
      setActiveProfileId(saved.id);
    } catch (persistErr) {
      console.warn('Seeker profile persist failed:', persistErr);
    }

    setTimeout(() => {
      let chart: any = null;
      try {
        chart = calculateKundali(
          userData.birthDate,
          userData.birthTime,
          userData.birthLat,
          userData.birthLon,
          userData.timezone
        );
      } catch (err) {
        chart = {
          lagna: { rasiName: 'Vrishabha (Taurus)', nakshatra: { name: 'Rohini' } },
          planets: {
            Moon: { rasiName: 'Vrishabha', nakshatra: { name: 'Rohini', pada: 2 } },
            Sun: { rasiName: 'Mithuna' },
            Jupiter: { rasiName: 'Mesha', status: 'Exalted' },
          }
        };
      }

      const lagnaName = chart?.lagna?.rasiName || 'Vrishabha (वृषभ)';
      const moonRashi = chart?.planets?.Moon?.rasiName || 'Vrishabha (वृषभ)';
      const nakshatra = chart?.planets?.Moon?.nakshatra?.name || 'Rohini (रोहिणी)';
      const dasha = 'Moon Mahadasha • Jupiter Antardasha';

      const pulseResult = {
        lagna: lagnaName,
        moonRashi,
        nakshatra,
        dasha,
        question: seekerQuestion,
        coreTension: lang === 'hi'
          ? 'वर्तमान में गुरु-चन्द्र युति आपके कर्म भाव को सक्रिय कर रही है।'
          : 'Active Moon-Jupiter alignment activates the 10th house.',
        auspiciousWindow: lang === 'hi' ? 'अक्टूबर २०२६ से मार्च २०२७' : 'October 2026 to March 2027',
        preliminaryInsight: lang === 'hi'
          ? `आपकी कुण्डली में चन्द्र-गुरु की अंतर्दशा शुभता दर्शा रही है। वरिष्ठ विद्वान् द्वारा प्रत्यक्ष विश्लेषण अनुशंसित है।`
          : `Moon-Jupiter Antardasha supports major growth. Verified scholar consultation is recommended for final timing.`
      };

      setPulseReport(pulseResult);
      setIsTyping(false);

      const pulseDeliveryText = lang === 'hi'
        ? `🌟 आपकी कुण्डली की प्रत्यक्ष गणना सम्पन्न हुई:`
        : `🌟 Astronomical Ephemeris Calculated:`;

      setMessages(prev => [
        ...prev,
        {
          id: `guru-pulse-${Date.now()}`,
          sender: 'GURU_AI',
          text: pulseDeliveryText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isPulseReport: true,
          pulseData: pulseResult,
        },
        {
          id: `guru-pandit-${Date.now() + 1}`,
          sender: 'GURU_AI',
          text: lang === 'hi'
            ? 'काशी के वरिष्ठ विद्वान् ज्योतिषी इस कुण्डली का प्रत्यक्ष विवेचन करने हेतु उपलब्ध हैं:'
            : 'Our senior Banaras Scholar is available to conduct a deep consultation:',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isPanditCard: true,
          panditData: {
            name: 'पं. विद्यानन्द शास्त्री',
            tradition: 'वाराणसी परम्परा • काशी विद्वत् परिषद',
            specialties: 'विवाह • कुंडली • मुहूर्त • ग्रह शान्ति',
            status: 'अभी उपलब्ध',
            duration: '15 मिनट',
            price: 1100,
          }
        }
      ]);

      setStep('PACKAGE_SELECT');
    }, 1200);
  };

  const handleProceedToPayment = async (tier: 'WRITTEN' | 'VOICE' | 'VIDEO' | 'PARIVAAR') => {
    chitiSensory.playTick();
    setSelectedTier(tier);
    setIsProcessingPayment(true);

    const tierPricing: Record<string, { amount: number; nameHi: string; nameEn: string }> = {
      WRITTEN: { amount: 501, nameHi: 'लिखित विद्वत्-परामर्श पत्र', nameEn: 'Written Scholar Folio' },
      VOICE: { amount: 1100, nameHi: 'गोपनीय प्रत्यक्ष वॉयस कॉल (15 min)', nameEn: 'Encrypted Voice Call (15m)' },
      VIDEO: { amount: 1500, nameHi: 'साक्षात् वीडियो दर्शन परामर्श (20 min)', nameEn: 'HD Video Darshan Consult (20m)' },
      PARIVAAR: { amount: 2100, nameHi: 'पारिवारिक कुण्डली महा-विवेचन (30 min)', nameEn: 'Parivaar Masterclass (30m)' },
    };

    const config = tierPricing[tier];

    try {
      const res = await fetch('/api/astrology/consultations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: userData.name || 'जिज्ञासु भक्त',
          customerPhone: userData.phone || '+919876543210',
          customerEmail: userData.email,
          customerQuestion: userData.question,
          customerMood: userData.mood || undefined,
          birthDate: userData.birthDate,
          birthTime: userData.birthTime,
          birthCity: userData.birthPlace,
          birthLat: userData.birthLat,
          birthLon: userData.birthLon,
          timezone: userData.timezone,
          consultationMode: tier,
          amount: config.amount,
          pulseDossier: pulseReport,
        }),
      });

      const data = await res.json();
      const caseId = data.consultationId || `CT-${Date.now().toString().slice(-6)}`;
      setCreatedCaseId(caseId);

      const Razorpay = await loadRazorpayCheckout();
      if (!Razorpay || !data.checkoutEnabled) {
        completeConsultationBooking(caseId, tier);
        return;
      }

      const options = {
        key: data.razorpayKeyId || 'rzp_test_placeholder',
        amount: data.amount ? data.amount * 100 : config.amount * 100,
        currency: 'INR',
        name: 'CosmicTantra',
        description: `${config.nameEn} • Banaras Tradition`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: userData.name,
          contact: userData.phone,
          email: userData.email,
        },
        theme: {
          color: '#8E6F1D',
        },
        handler: async function (response: any) {
          try {
            await fetch('/api/astrology/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                consultationId: data.consultationId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            completeConsultationBooking(caseId, tier);
          } catch {
            completeConsultationBooking(caseId, tier);
          }
        },
        modal: {
          ondismiss: () => setIsProcessingPayment(false)
        }
      };

      const rzpInstance = new Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      console.error(err);
      completeConsultationBooking(`CT-${Date.now().toString().slice(-6)}`, tier);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const completeConsultationBooking = (caseId: string, tier: 'WRITTEN' | 'VOICE' | 'VIDEO' | 'PARIVAAR') => {
    chitiSensory.playTick();
    setStep('CONFIRMED');

    const confirmationText = lang === 'hi'
      ? `🎉 आपका परामर्श आदेश (Case ID: ${caseId}) दर्ज हो चुका है। विद्वान् ज्योतिषी को विवरण भेज दिया गया है।`
      : `🎉 Consultation (Case ID: ${caseId}) confirmed. Details sent to Banaras Scholar.`;

    setMessages(prev => [
      ...prev,
      {
        id: `confirm-${Date.now()}`,
        sender: 'GURU_AI',
        text: confirmationText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);

    if (onConsultationBooked) {
      onConsultationBooked(caseId, tier === 'PARIVAAR' ? 'VIDEO' : tier);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] w-full h-[100dvh] bg-[#FAF7F2] dark:bg-[#080A10] flex flex-col font-mono-data overflow-hidden animate-in fade-in duration-200">
      
      {/* TOP HEADER */}
      <div className="pt-[env(safe-area-inset-top)] bg-gradient-to-r from-[#8E6F1D]/15 via-[#FAF7F2] to-[#8E6F1D]/15 dark:from-[#D4AF37]/15 dark:via-[#080A10] dark:to-[#D4AF37]/15 border-b border-black/10 dark:border-white/10 shrink-0">
        <div className="p-3 sm:p-4 px-4 sm:px-6 flex items-center justify-between gap-2">
          
          {/* Left Element: Back arrow + Avatar + Title + Clean Subtitle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { chitiSensory.playTick(); onClose(); }}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#1C1917] dark:text-white transition-all cursor-pointer"
              title={lang === 'hi' ? 'वापस जाएँ' : 'Back'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8E6F1D] to-[#D4AF37] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                🕉️
              </div>
              <div>
                <div className="font-bold text-sm text-[#1C1917] dark:text-white leading-tight">
                  {lang === 'hi' ? 'काशी सहायक' : 'Kashi Sahayak'}
                </div>
                <p className="text-[11px] text-[#696256] dark:text-[#9E988D] leading-tight">
                  {lang === 'hi' ? 'वैदिक ज्योतिष सहायक' : 'Vedic Astrology Assistant'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Element: Clean Reset, Voice, Close */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={resetConsultSession}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white transition-all cursor-pointer"
              title={lang === 'hi' ? 'सत्र रीसेट करें' : 'Reset session'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => { chitiSensory.playTick(); voice.toggleVoice(); }}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white transition-all cursor-pointer"
              title={voice.voiceEnabled ? 'आवाज़ बंद करें' : 'आवाज़ चालू करें'}
            >
              {voice.voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => { chitiSensory.playTick(); onClose(); }}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white transition-all cursor-pointer"
              title={lang === 'hi' ? 'चैट बंद करें' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* CHAT MESSAGES & CONVERSATION AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%]">
              {msg.sender === 'GURU_AI' && (
                <div className="w-7 h-7 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] flex items-center justify-center shrink-0 text-xs font-bold shadow-xs mt-1">
                  🕉️
                </div>
              )}

              <div className="space-y-2.5 w-full">
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'USER'
                      ? 'bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 border border-[#8E6F1D]/30 text-[#1C1917] dark:text-[#EFECE6] font-medium rounded-br-xs shadow-xs'
                      : 'bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-[#1C1917] dark:text-[#EFECE6] rounded-bl-xs shadow-xs'
                  }`}
                >
                  {msg.text}

                  {/* EMBEDDED INSTANT AI PULSE REPORT CARD */}
                  {msg.isPulseReport && msg.pulseData && (
                    <div className="mt-3 p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="font-bold text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{lang === 'hi' ? 'प्रारम्भिक खगोलीय स्थिति (Vedic Pulse)' : 'Vedic Ephemeris Pulse'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono-data text-[10px] font-bold">
                          Deterministic
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/5">
                          <span className="text-[#696256] dark:text-[#9E988D] block">लग्न (Ascendant):</span>
                          <strong className="text-[#1C1917] dark:text-white">{msg.pulseData.lagna}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/5">
                          <span className="text-[#696256] dark:text-[#9E988D] block">चन्द्र राशि व नक्षत्र:</span>
                          <strong className="text-[#1C1917] dark:text-white">{msg.pulseData.moonRashi} ({msg.pulseData.nakshatra})</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/5 col-span-2 sm:col-span-1">
                          <span className="text-[#696256] dark:text-[#9E988D] block">सक्रिय दशा:</span>
                          <strong className="text-[#8E6F1D] dark:text-[#F0C968]">{msg.pulseData.dasha}</strong>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#78350F] dark:text-[#FDE68A] text-[11px] leading-relaxed">
                        <span className="font-bold">प्राथमिक फलकथन: </span>
                        {msg.pulseData.preliminaryInsight}
                      </div>
                    </div>
                  )}

                  {/* EMBEDDED PANCHANG CARD */}
                  {msg.isPanchangCard && msg.panchangData && (
                    <div className="mt-3 p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 space-y-2 text-xs">
                      <div className="font-bold text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5 border-b border-black/10 dark:border-white/10 pb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>श्री काशी विश्वनाथ पञ्चाङ्ग • {msg.panchangData.date}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-white/60 dark:bg-white/5">
                          <span className="opacity-70 block">तिथि:</span>
                          <strong>{msg.panchangData.tithi.fullNameHi}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white/60 dark:bg-white/5">
                          <span className="opacity-70 block">नक्षत्र:</span>
                          <strong>{msg.panchangData.nakshatra.nameHi}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white/60 dark:bg-white/5">
                          <span className="opacity-70 block">सूर्योदय / सूर्यास्त:</span>
                          <strong>{msg.panchangData.sun.sunrise} / {msg.panchangData.sun.sunset}</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white/60 dark:bg-white/5">
                          <span className="opacity-70 block">राहुकाल:</span>
                          <strong className="text-rose-600 dark:text-rose-400">{msg.panchangData.timings.rahuKalam}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* STRUCTURED PANDIT RECOMMENDATION CARD */}
                {msg.isPanditCard && msg.panditData && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#121522] border-2 border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 shadow-md space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-[#8E6F1D] text-white flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
                          🕉️
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#1C1917] dark:text-white">
                            {msg.panditData.name}
                          </h4>
                          <p className="text-[11px] text-[#696256] dark:text-[#9E988D]">
                            {msg.panditData.tradition}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{msg.panditData.status}</span>
                            </span>
                            <span className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968] font-medium">
                              • {msg.panditData.specialties}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-[#696256] dark:text-[#9E988D] block">{msg.panditData.duration}</span>
                        <span className="font-bold text-base text-[#8E6F1D] dark:text-[#F0C968] font-mono-data">
                          ₹{msg.panditData.price.toLocaleString('hi-IN')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleProceedToPayment('VOICE')}
                      disabled={isProcessingPayment}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{isProcessingPayment ? 'प्रक्रिया जारी है...' : `पंडित जी से बात करें (₹${msg.panditData.price.toLocaleString('hi-IN')})`}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-[#696256] dark:text-[#9E988D] mt-1 px-9">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {/* COMPACT SERVICE SUGGESTION GRID */}
        {!gridCollapsed && messages.length <= 3 && step === 'WELCOME' && (
          <div className="pt-2 pb-4 space-y-3 animate-in fade-in duration-300">
            <div className="text-xs font-bold text-[#696256] dark:text-[#9E988D]">
              {lang === 'hi' ? 'त्वरित विकल्प चुनें:' : 'Quick Options:'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleGridAction('KUNDLI')}
                className="p-3 rounded-2xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] text-left transition-all cursor-pointer hover:shadow-md active:scale-98 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <Compass className="w-4 h-4" />
                  <span>मेरी कुंडली देखें</span>
                </div>
                <p className="text-[10px] text-[#696256] dark:text-[#9E988D] mt-1">
                  जन्म कुंडली व विस्तृत विश्लेषण
                </p>
              </button>

              <button
                onClick={() => handleGridAction('QUESTION')}
                className="p-3 rounded-2xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] text-left transition-all cursor-pointer hover:shadow-md active:scale-98 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <MessageSquare className="w-4 h-4" />
                  <span>कोई प्रश्न पूछें</span>
                </div>
                <p className="text-[10px] text-[#696256] dark:text-[#9E988D] mt-1">
                  जीवन के किसी भी विषय पर
                </p>
              </button>

              <button
                onClick={() => handleGridAction('MILAN')}
                className="p-3 rounded-2xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] text-left transition-all cursor-pointer hover:shadow-md active:scale-98 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                  <Heart className="w-4 h-4" />
                  <span>विवाह मिलान</span>
                </div>
                <p className="text-[10px] text-[#696256] dark:text-[#9E988D] mt-1">
                  गुण मिलान व सहगणिता
                </p>
              </button>

              <button
                onClick={() => handleGridAction('PANCHANG')}
                className="p-3 rounded-2xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] text-left transition-all cursor-pointer hover:shadow-md active:scale-98 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>आज का पंचांग</span>
                </div>
                <p className="text-[10px] text-[#696256] dark:text-[#9E988D] mt-1">
                  तिथि, मुहूर्त, राहुकाल आदि
                </p>
              </button>

              <button
                onClick={() => handleGridAction('PANDIT')}
                className="p-3 rounded-2xl bg-white dark:bg-[#121522] border border border-emerald-500/40 hover:border-emerald-500 text-left transition-all cursor-pointer hover:shadow-md active:scale-98 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  <Phone className="w-4 h-4" />
                  <span>पंडित जी से बात करें</span>
                </div>
                <p className="text-[10px] text-[#696256] dark:text-[#9E988D] mt-1">
                  विशेषज्ञ परामर्श (₹1,100)
                </p>
              </button>

              <button
                onClick={() => handleGridAction('MORE_SERVICES')}
                className="p-3 rounded-2xl bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 text-left transition-all cursor-pointer hover:shadow-md active:scale-98 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[#8E6F1D] dark:text-[#F0C968] font-bold text-xs">
                  <span>और सेवाएँ देखें</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <p className="text-[10px] text-[#696256] dark:text-[#9E988D] mt-1">
                  मंत्र, पाठ, यात्रा व अनुष्ठान
                </p>
              </button>
            </div>
          </div>
        )}

        {/* TYPING INDICATOR */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] flex items-center justify-center text-xs font-bold">
              🕉️
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* RE-CONFIRM CHIPS */}
        {pendingConfirm && (
          <div className="space-y-2 pt-2 animate-in fade-in">
            {pendingConfirm.suggestions && pendingConfirm.suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {pendingConfirm.suggestions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => confirmPendingInput(c)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-[#121522] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#080A10] text-xs font-bold text-[#1C1917] dark:text-white transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    📍 {c.name}, {c.state}{c.country !== 'India' ? ` (${c.country})` : ''}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {!pendingConfirm.suggestions && (
                <button
                  onClick={() => confirmPendingInput()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
                >
                  {lang === 'hi'
                    ? `✅ हाँ, सही है${pendingConfirm.label ? ` — ${pendingConfirm.label}` : ''}`
                    : `✅ Yes, correct${pendingConfirm.label ? ` — ${pendingConfirm.label}` : ''}`}
                </button>
              )}
              <button
                onClick={correctPendingInput}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#121522] border border-black/15 dark:border-white/15 hover:border-rose-400 text-xs font-bold text-[#1C1917] dark:text-white transition-all cursor-pointer active:scale-95"
              >
                {lang === 'hi' ? '✏️ नहीं, दुबारा लिखूँगा/लिखूँगी' : '✏️ No, retype'}
              </button>
            </div>
          </div>
        )}

        {/* DOMAIN SELECTOR */}
        {step === 'DOMAIN' && (
          <div className="space-y-2 pt-2 animate-in fade-in">
            <div className="text-xs text-[#696256] dark:text-[#9E988D] font-bold">
              {lang === 'hi' ? 'परामर्श विषय का चयन करें:' : 'Select Consultation Category:'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LIFE_DOMAINS.map(d => (
                <button
                  key={d.id}
                  onClick={() => handleSelectDomain(d.id, lang === 'hi' ? d.labelHi : d.labelEn)}
                  className="p-3 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] text-left text-xs font-bold text-[#1C1917] dark:text-white transition-all cursor-pointer hover:shadow-md active:scale-98"
                >
                  {lang === 'hi' ? d.labelHi : d.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PACKAGE SELECTOR (SCHOLAR TIERS) */}
        {step === 'PACKAGE_SELECT' && (
          <div className="space-y-3 pt-3 animate-in zoom-in-95">
            <div className="text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{lang === 'hi' ? 'परामर्श माध्यम चुनें:' : 'Select Consultation Mode:'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* TIER 1: Written Folio (₹501) */}
              <div 
                onClick={() => handleProceedToPayment('WRITTEN')}
                className="p-4 rounded-2xl border-2 border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 bg-white dark:bg-[#121522] hover:border-[#8E6F1D] hover:shadow-lg transition-all cursor-pointer relative group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37]" />
                      <span className="font-bold text-xs text-[#1C1917] dark:text-white">
                        {lang === 'hi' ? 'लिखित विद्वत् पत्र' : 'Written Scholar Folio'}
                      </span>
                    </div>
                    <span className="font-bold text-sm font-mono-data text-[#8E6F1D] dark:text-[#F0C968]">₹501</span>
                  </div>
                  <p className="text-[11px] text-[#696256] dark:text-[#9E988D] leading-relaxed">
                    {lang === 'hi'
                      ? 'काशी के विद्वान् द्वारा हस्तलिखित व डिजिटल हस्ताक्षरित विस्तृत पत्र (४-१२ घंटे में)'
                      : 'Verified PDF folio signed by Banaras scholar within 4-12 hours.'}
                  </p>
                </div>
                <button className="mt-3 w-full py-2 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center justify-center gap-1">
                  <span>{lang === 'hi' ? '₹५०१ दक्षिणा दें →' : 'Book Folio ₹501 →'}</span>
                </button>
              </div>

              {/* TIER 2: Encrypted Voice Call (₹1,100) */}
              <div 
                onClick={() => handleProceedToPayment('VOICE')}
                className="p-4 rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10 hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer relative group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-xs text-[#1C1917] dark:text-white">
                        {lang === 'hi' ? 'प्रत्यक्ष वॉयस कॉल (15 min)' : 'Direct Voice Call'}
                      </span>
                    </div>
                    <span className="font-bold text-sm font-mono-data text-emerald-700 dark:text-emerald-400">₹1,100</span>
                  </div>
                  <p className="text-[11px] text-[#696256] dark:text-[#9E988D] leading-relaxed">
                    {lang === 'hi'
                      ? 'विद्वान् से प्रत्यक्ष गोपनीय वॉयस कॉल। पूर्व-तैयार कुण्डली विश्लेषण।'
                      : 'Direct audio call with senior Pandit. 100% number-masked privacy.'}
                  </p>
                </div>
                <button className="mt-3 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1">
                  <span>{lang === 'hi' ? 'कॉल करें (₹१,१००) →' : 'Start Call ₹1,100 →'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP: CONFIRMED */}
        {step === 'CONFIRMED' && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>{lang === 'hi' ? 'परामर्श कक्ष तैयार है • Case ID: ' + createdCaseId : 'Consultation Chamber Ready • Case ID: ' + createdCaseId}</span>
            </div>
            <p className="text-[#44403C] dark:text-[#D1C9BF] text-xs leading-relaxed">
              {selectedTier === 'WRITTEN'
                ? (lang === 'hi' ? 'आपका लिखित पत्र विद्वान् द्वारा तैयार किया जा रहा है।' : 'Your written folio is being prepared by our scholar.')
                : (lang === 'hi' ? 'आपका गोपनीय परामर्श कक्ष सक्रिय हो गया है। सीधे कक्ष में प्रवेश करें:' : 'Your consultation room is active. Enter the private room:')
              }
            </p>
            <div className="flex gap-2 pt-1">
              {selectedTier === 'WRITTEN' ? (
                <a
                  href="/report"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-center text-xs flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'लिखित पत्र देखें →' : 'View Written Folio →'}</span>
                </a>
              ) : (
                <a
                  href={`/consultation/room/${createdCaseId}?mode=${selectedTier.toLowerCase()}&role=devotee`}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <Phone className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'कक्ष में प्रवेश करें →' : 'Enter Chamber →'}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* KASHI SAHAYAK COMPANION VERSE / CLARIFICATION */}
        <div data-testid="kashi-companion" data-revision={kashi.revision}>
          {kashi.lastResponse?.guidance === 'safety' && (
            <div data-testid="kashi-safety" role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs">
              {kashi.lastResponse.acknowledgement}
            </div>
          )}
          {kashi.pendingVerse && !verseDismissed ? (
            <KashiVerseCard
              passage={kashi.pendingVerse}
              reflection={kashi.lastResponse?.reflection || undefined}
              language={lang === 'hi' ? 'hi' : 'en'}
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
              language={lang === 'hi' ? 'hi' : 'en'}
              onChoose={(choice) => kashi.sendText(choice)}
              onRetryVoice={kashi.startListening}
              onTypeInstead={kashi.cancelListening}
            />
          )}
          <KashiQuickActions
            actions={kashi.quickActions}
            onAction={(a) => {
              if (a === 'रोकें') kashi.control('stop');
              else if (a === 'आगे पढ़ें') kashi.control('advance');
              else if (a === 'फिर से सुनाएं') kashi.control('repeat');
              else if (a === 'केवल मुझसे बात करें') kashi.sendText('बस मुझसे बात करो');
            }}
          />
        </div>

        <div ref={chatEndRef} />
      </div>

      {/* SECONDARY SERVICES BOTTOM SHEET LAUNCHER */}
      {showServicesSheet && (
        <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-[#0E101D] border-t border-[#8E6F1D]/40 rounded-t-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <h3 className="font-bold text-sm text-[#1C1917] dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>{lang === 'hi' ? 'अन्य वैदिक सेवाएँ' : 'Sacred Vedic Services'}</span>
              </h3>
              <button
                onClick={() => setShowServicesSheet(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#696256] dark:text-[#9E988D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleSecondaryService('महामृत्युंजय मंत्र व जप', 'महामृत्युंजय मंत्र व जप की जानकारी चाहिए')}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#121522] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-xs text-[#1C1917] dark:text-white flex items-center gap-1.5">
                  <span>🕉️</span>
                  <span>महामृत्युंजय मंत्र व जप</span>
                </div>
                <p className="text-[11px] text-[#696256] dark:text-[#9E988D] mt-1">
                  आरोग्य, भय-मुक्ति व ऊर्जा सञ्चार
                </p>
              </button>

              <button
                onClick={() => handleSecondaryService('ग्रंथ पाठ व स्वर-वाचन', 'ग्रंथ पाठ व स्वर-वाचन की जानकारी चाहिए')}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#121522] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-xs text-[#1C1917] dark:text-white flex items-center gap-1.5">
                  <span>📜</span>
                  <span>ग्रंथ पाठ व स्वर-वाचन</span>
                </div>
                <p className="text-[11px] text-[#696256] dark:text-[#9E988D] mt-1">
                  वेद, उपनिषद्, भगवद्गीता व ८ शास्त्र
                </p>
              </button>

              <button
                onClick={() => handleSecondaryService('काशी यात्रा योजना', 'काशी यात्रा योजना की जानकारी चाहिए')}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#121522] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-xs text-[#1C1917] dark:text-white flex items-center gap-1.5">
                  <span>🚩</span>
                  <span>काशी यात्रा योजना</span>
                </div>
                <p className="text-[11px] text-[#696256] dark:text-[#9E988D] mt-1">
                  विश्वनाथ मन्दिर, काल भैरव व घाट
                </p>
              </button>

              <button
                onClick={() => handleSecondaryService('वैदिक पूजा व अनुष्ठान', 'वैदिक पूजा व अनुष्ठान की जानकारी चाहिए')}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#121522] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-xs text-[#1C1917] dark:text-white flex items-center gap-1.5">
                  <span>🪔</span>
                  <span>वैदिक पूजा व अनुष्ठान</span>
                </div>
                <p className="text-[11px] text-[#696256] dark:text-[#9E988D] mt-1">
                  संकल्प, नवग्रह शान्ति व रुद्राभिषेक
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM INPUT BAR */}
      <form
        onSubmit={handleSendText}
        className="p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white dark:bg-[#0E101D] border-t border-black/10 dark:border-white/10 flex items-center gap-2 shrink-0 max-w-4xl mx-auto w-full"
      >
        <div className="flex-1">
          <KashiComposer
            language={lang === 'hi' ? 'hi' : 'en'}
            voiceState={kashi.voiceState}
            transcript={kashi.transcript}
            canAutoSend={kashi.canAutoSend}
            muted={kashi.session.muted}
            speaking={false}
            value={inputText}
            onValueChange={(v) => { setInputText(v); kashi.editTranscript(v); }}
            onSend={() => {
              const committed = kashi.commitTranscript();
              const typed = (committed ?? inputText ?? '').trim();
              if (typed) kashi.sendText(typed);
              setInputText('');
              void handleSendText();
            }}
            onMicPress={() => (kashi.voiceState === 'listening' ? kashi.stopListening() : kashi.startListening())}
            onCancelListening={kashi.cancelListening}
            onToggleMute={() => kashi.control(kashi.session.muted ? 'unmute' : 'mute')}
            onStopSpeaking={() => kashi.control('stop')}
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-3 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] disabled:opacity-40 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
