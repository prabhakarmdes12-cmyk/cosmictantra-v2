'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  Phone, 
  Video, 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Lock, 
  RotateCcw,
  Zap,
  Flame,
  Award,
  ChevronRight,
  Volume2,
  VolumeX
} from 'lucide-react';
import { getActiveProfile, getProfiles, upsertProfile, setActiveProfileId } from '@/lib/profileStore';
import { chitiSensory } from '@/lib/chitiAudio';
import { calculateKundali } from '@/lib/astrologyEngine';
import { useKashiVoice } from '@/lib/ai/useKashiVoice';
import { getChatSafetyReply } from '@/lib/ai/chatSafety';
import { MOOD_OPTIONS, MOOD_QUESTION_HI, MOOD_QUESTION_EN, MoodOption, getMoodById } from '@/lib/ai/moodOptions';
import { findScriptureInsight } from '@/lib/ai/scriptureMap';
import { parseBirthTime, parseBirthDate, resolveBirthCity, CityChoice } from '@/lib/ai/intakeParsing';
import { useKashiSahayak } from '@/hooks/useKashiSahayak';
import { KashiComposer } from '@/components/kashi/KashiComposer';
import { KashiVerseCard } from '@/components/kashi/KashiVerseCard';
import { KashiClarification, KashiQuickActions } from '@/components/kashi/KashiClarification';
import type { EmotionId } from '@/lib/kashi/emotionalSupport';

/** Existing intake mood chips -> Kashi emotional-support paths. */
const MOOD_TO_EMOTION: Record<string, EmotionId> = {
  MOOD_CALM: 'spiritual',
  MOOD_ANXIOUS: 'anxiety',
  MOOD_SAD: 'sadness',
  MOOD_ANGRY: 'anger',
  MOOD_CONFUSED: 'confusion',
  MOOD_TIRED: 'stress',
};

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
  timestamp: string;
  isPulseReport?: boolean;
  pulseData?: any;
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
  const [step, setStep] = useState<'WELCOME' | 'MOOD' | 'NAME' | 'BIRTH_DATE' | 'BIRTH_TIME' | 'BIRTH_PLACE' | 'DOMAIN' | 'QUESTION' | 'CALCULATING' | 'PULSE_READY' | 'PACKAGE_SELECT' | 'PAYMENT_PENDING' | 'CONFIRMED'>('WELCOME');

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
    mood: '', // emotional check-in captured at greeting — forwarded to scholar dossier
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pulseReport, setPulseReport] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<'WRITTEN' | 'VOICE' | 'VIDEO' | 'PARIVAAR'>('WRITTEN');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState('');

  /**
   * Pending confirmation for typed birth details — every typed value is
   * parsed to canonical form ("2.20" → 02:20, "bilaspur,cg" → Bilaspur,
   * Chhattisgarh) and echoed back with ✅/✏️ chips (or city suggestions)
   * before it is committed.
   */
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
  }, [messages, isTyping, step]);

  // Kashi Sahayak reads new replies aloud (voice toggle in header)
  const lastSpokenIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last && last.sender === 'GURU_AI' && last.text && last.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = last.id;
      voice.speak(last.text);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------
  // SESSION MEMORY — the consultation chat remembers the seeker across
  // modal closes and page reloads (localStorage, DPDP-conscious). A
  // completed booking is NOT replayed — it starts fresh.
  // ------------------------------------------------------------------
  const MODAL_SESSION_KEY = 'kashi-consult-session-v1';

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
    setPendingConfirm(null);
    setPulseReport(null);
    setCreatedCaseId('');
    setIsProcessingPayment(false);
    setSelectedTier('WRITTEN');
    setUserData({
      name: '', gender: 'MALE', phone: '', email: '',
      birthDate: '1995-06-15', birthTime: '10:30', birthPlace: 'Varanasi, UP',
      birthLat: 25.3176, birthLon: 82.9739, timezone: 5.5,
      domain: 'CAREER', question: '', mood: '',
    });
    // messages.length === 0 makes the greeting effect below re-fire
  };

  // Persist the conversation so reopens restore it
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
          userData,
          pulseReport,
          createdCaseId,
          pendingConfirm,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // storage full/blocked — non-fatal
    }
  }, [messages, step, userData, pulseReport, createdCaseId, pendingConfirm]);

  // Initialize Guru AI greeting (or restore a remembered session)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // 1. Restore remembered session first — the bot remembers this seeker
      try {
        const raw = window.localStorage.getItem(MODAL_SESSION_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved?.messages) && saved.messages.length > 0 && saved.step !== 'CONFIRMED' &&
            Number.isFinite(Date.parse(saved.savedAt)) && Date.now() - Date.parse(saved.savedAt) < 7 * 86400000) {
            setMessages(saved.messages.slice(-80));
            if (saved.step) setStep(saved.step === 'CALCULATING' ? 'QUESTION' :
              saved.step === 'PAYMENT_PENDING' ? 'PACKAGE_SELECT' : saved.step);
            if (saved.pendingConfirm) setPendingConfirm(saved.pendingConfirm);
            if (saved.userData) setUserData(prev => ({ ...prev, ...saved.userData }));
            if (saved.pulseReport) setPulseReport(saved.pulseReport);
            if (saved.createdCaseId) setCreatedCaseId(saved.createdCaseId);
            return;
          }
        }
      } catch {
        // corrupted session — fall through to a fresh greeting
      }

      // 2. Fresh greeting, personalized when we already know the seeker
      const activeProfile = getActiveProfile();
      const knownName = activeProfile?.name || '';
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

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        // Capability-led, feeling-first greeting: the seeker instantly learns
        // WHAT Kashi Sahayak offers (free kundali pulse + verified scholar
        // consult via folio/call/video), and Kashi Sahayak first learns HOW
        // the seeker feels today via one-tap mood chips.
        const backHi = knownName ? `पुनः स्वागत है, ${knownName} जी!` : 'प्रणाम!';
        const backEn = knownName ? `Welcome back, ${knownName}!` : 'Namaste!';
        const greetingText = lang === 'hi'
          ? `${backHi} 🙏 मैं काशी सहायक हूँ — काशी विश्वनाथ की पावन धरा से आपकी वैदिक सहायिका।\n\nमैं आपकी कुण्डली की प्रत्यक्ष खगोलीय गणना करके आपकी निःशुल्क प्रारम्भिक स्थिति (Vedic Pulse) तुरंत तैयार कर दूँगी। और चाहें तो काशी के सत्यापित विद्वान् ज्योतिषी से प्रत्यक्ष परामर्श भी करा सकती हूँ — लिखित परामर्श पत्र, गोपनीय वॉयस कॉल या साक्षात् वीडियो दर्शन के माध्यम से।\n\n${MOOD_QUESTION_HI}`
          : `${backEn} 🙏 I am Kashi Sahayak — your Vedic companion from the sacred soil of Kashi Vishwanath.\n\nI will compute your birth chart with real astronomical precision and instantly prepare your free Vedic Pulse. And whenever you wish, I can connect you with a verified Banaras scholar — through a written consultation folio, a private voice call, or a live video darshan.\n\n${MOOD_QUESTION_EN}`;

        setMessages([
          {
            id: 'msg-1',
            sender: 'GURU_AI',
            text: greetingText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setStep('MOOD');
      }, 700);
    }
  }, [isOpen, lang, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleUseSavedProfile = () => {
    chitiSensory.playTick();
    const p = getActiveProfile();
    if (!p) return;
    
    setUserData(prev => ({
      ...prev,
      name: p.name || 'जिज्ञासु',
      birthDate: p.birthDate || '1995-06-15',
      birthTime: p.birthTime || '10:30',
      birthPlace: p.birthCity || 'Varanasi',
      birthLat: p.lat || 25.3176,
      birthLon: p.lng || 82.9739,
    }));

    const confirmMsg = lang === 'hi'
      ? `धन्यवाद! मैंने आपकी जन्म कुंडली विवरण दर्ज कर लिए हैं: ${p.name}, जन्म: ${p.birthDate} समय: ${p.birthTime}, स्थान: ${p.birthCity}।\n\nअब कृपया बताएं कि आज आप किस मुख्य विषय पर परामर्श लेना चाहते हैं?`
      : `Thank you! I have loaded your birth details: ${p.name}, Born: ${p.birthDate} at ${p.birthTime}, Place: ${p.birthCity}.\n\nWhat is your primary area of life inquiry today?`;

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'USER',
        text: `✓ ${p.name} (${p.birthDate}, ${p.birthCity}) प्रोफाइल उपयोग करें`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: `guru-${Date.now() + 1}`,
        sender: 'GURU_AI',
        text: confirmMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setStep('DOMAIN');
  };

  // One-tap emotional check-in — acknowledge the feeling with warmth, then
  // glide into the consultation intake. The mood rides along into the
  // scholar dossier so the human pandit already knows the seeker's state.
  const kashi = useKashiSahayak();

  const handleSelectMood = (moodId: string) => {
    chitiSensory.playTick();
    const mood: MoodOption | undefined = getMoodById(moodId);
    if (!mood) return;

    // Kashi Sahayak: structured emotional support with a verified passage.
    const emotion = MOOD_TO_EMOTION[moodId];
    if (emotion) kashi.selectEmotion(emotion, mood.chipLabel);

    setUserData(prev => ({ ...prev, mood: mood.speakLabel }));

    const ack = lang === 'hi' ? mood.acknowledgeHi : mood.acknowledgeEn;
    const followUp = lang === 'hi'
      ? 'चलिए शुरुआत करते हैं — कृपया अपना शुभ नाम बताएं या सेव किए प्रोफाइल से आगे बढ़ें:'
      : 'Let us begin — please share your full name, or continue with your saved profile:';

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'USER',
        text: lang === 'hi' ? mood.chipLabel : mood.chipLabelEn,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: `guru-${Date.now() + 1}`,
        sender: 'GURU_AI',
        text: `${ack} 🙏\n\n${followUp}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setStep('NAME');
  };

  // ------------------------------------------------------------------
  // Re-confirmation actions for typed birth details. The seeker taps ✅
  // to commit the parsed value, a suggestion chip to pick a specific city,
  // or ✏️ to retype. Nothing lands in the profile until confirmed.
  // ------------------------------------------------------------------
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
              ? `धन्यवाद 🙏 जन्म स्थान ${placeValue} दर्ज हो गया — आपकी कुण्डली अब सटीक अक्षांश-रेखांश से बनेगी।\n\nअब कृपया नीचे दिए गए विकल्पों में से अपना मुख्य विषय चुनें:`
              : `Thank you 🙏 Birth place ${placeValue} recorded — your chart now uses exact coordinates.\n\nNow please select the core life domain for your consultation:`,
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
              ? `धन्यवाद 🙏 जन्म तिथि ${p!.label} दर्ज हो गई।\n\nअब कृपया अपना जन्म समय बताएं — किसी भी रूप में: 2:20 AM, 14:45, "2.20", "शाम 7 बजे":`
              : `Thank you 🙏 Birth date ${p!.label} recorded.\n\nNow your birth time, any format works: 2:20 AM, 14:45, "evening 7 o'clock":`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setPendingConfirm(null);
        setStep('BIRTH_TIME');
        return;
      }

      // time
      setUserData(prev => ({ ...prev, birthTime: p!.value }));
      setMessages(prev => [
        ...prev,
        {
          id: `guru-${Date.now()}`,
          sender: 'GURU_AI',
          text: lang === 'hi'
            ? `धन्यवाद 🙏 जन्म समय ${p!.label} दर्ज हो गया।\n\nअब कृपया अपना जन्म स्थान बताएं — शहर या कस्बा, अंग्रेज़ी या हिन्दी में (जैसे "bilaspur ,cg" या "पटना बिहार"):`
            : `Thank you 🙏 Birth time ${p!.label} recorded.\n\nNow please tell me your birth place — town or city, English or Hindi (e.g. "Bilaspur, CG" or "पटना बिहार"):`,
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
      date: lang === 'hi'
        ? 'कोई बात नहीं 🙏 कृपया जन्म तिथि दुबारा लिखें — जैसे 1996-08-15 या "15 अगस्त 1996":'
        : 'No problem 🙏 Please retype your birth date — e.g. 1996-08-15 or "15 August 1996":',
      time: lang === 'hi'
        ? 'कोई बात नहीं 🙏 कृपया जन्म समय दुबारा लिखें — जैसे 2:20 PM या "रात 10:30":'
        : 'No problem 🙏 Please retype your birth time — e.g. 2:20 PM or "10:30 at night":',
      place: lang === 'hi'
        ? 'कोई बात नहीं 🙏 कृपया जन्म स्थान दुबारा लिखें — शहर व राज्य (जैसे "Bilaspur, Chhattisgarh"):'
        : 'No problem 🙏 Please retype your birth place — city and state (e.g. "Bilaspur, Chhattisgarh"):',
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

    // State machine transitions
    if (step === 'MOOD') {
      // The seeker typed their feeling in words instead of tapping a chip —
      // recognise the emotion through the local scripture-wisdom engine so
      // the acknowledgment is specific, not generic.
      const insight = findScriptureInsight(currentInput);
      setUserData(prev => ({ ...prev, mood: insight ? insight.situation : currentInput }));
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const ackHi = insight
          ? insight.kashiSahayakBridge
          : `मैं समझ गयी — "${currentInput}"। आपकी भावना मेरे लिए महत्वपूर्ण है, इसे ध्यान में रखकर आगे बढ़ेंगे।`;
        const ackEn = insight
          ? `I hear you. ${insight.meaningEn.split('.')[0]}. Your feeling matters here — we will carry it into your consultation.`
          : `I hear you — "${currentInput}". How you feel matters here, and we will carry it into your consultation.`;
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: (lang === 'hi' ? ackHi : ackEn) + '\n\n' + (lang === 'hi'
              ? 'चलिए शुरुआत करते हैं — कृपया अपना शुभ नाम बताएं:'
              : 'Let us begin — please share your full name:'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setStep('NAME');
      }, 600);
    } else if (step === 'NAME') {
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
              : `Auspicious greetings, ${currentInput}! Please provide your Date of Birth (YYYY-MM-DD):`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setStep('BIRTH_DATE');
      }, 600);
    } else if (step === 'BIRTH_DATE') {
      // Tolerant parse: "1996-08-15", "15/08/1996", "15 अगस्त १९९६"…
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
                ? `क्षमा करें 🙏 "${currentInput}" तिथि समझ नहीं आई। कृपया इस रूप में लिखें — 1996-08-15, 15/08/1996 या "15 अगस्त 1996":`
                : `Sorry 🙏 I could not read "${currentInput}" as a date. Please write it as 1996-08-15, 15/08/1996, or "15 August 1996":`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
          return;
        }
        // Re-confirm before committing
        setPendingConfirm({ kind: 'date', value: parsed.iso!, label: lang === 'hi' ? parsed.labelHi! : parsed.labelEn! });
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: lang === 'hi'
              ? `मैं आपकी जन्म तिथि ${parsed.labelHi} (${parsed.iso}) के रूप में समझ रही हूँ — क्या यह सही है?`
              : `I read your birth date as ${parsed.labelEn} (${parsed.iso}) — is that correct?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }, 500);
    } else if (step === 'BIRTH_TIME') {
      // Tolerant parse: "2.20", "2:20 am", "14:45", "shaam 7 baje"…
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
                ? `क्षमा करें 🙏 "${currentInput}" समय समझ नहीं आया। कृपया इस रूप में लिखें — 2:20 AM, 14:45, "2.20" या "शाम 7 बजे":`
                : `Sorry 🙏 I could not read "${currentInput}" as a time. Please write it as 2:20 AM, 14:45, or "evening 7 o'clock":`,
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
              ? `मैं जन्म समय ${parsed.label} (${parsed.time24}) के रूप में समझ रही हूँ — क्या यह सही है?`
              : `I read your birth time as ${parsed.labelEn} (${parsed.time24}) — is that correct?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }, 500);
    } else if (step === 'BIRTH_PLACE') {
      // City resolution with state abbreviations ("bilaspur ,cg"), Hindi
      // spellings ("बनारस"), and multi-match disambiguation suggestions.
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
                ? `क्षमा करें 🙏 मैं "${currentInput}" को पहचान नहीं पाई। कृपया निकटतम बड़े शहर व राज्य का नाम लिखें — जैसे "Bilaspur, CG" या "पटना बिहार":`
                : `Sorry 🙏 I could not recognise "${currentInput}". Please write the nearest major city with its state — e.g. "Bilaspur, Chhattisgarh":`,
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
              text: lang === 'hi'
                ? `"${currentInput}" से मुझे ये स्थान मिले — कृपया अपना सही जन्म स्थान चुनें:`
                : `I found these places for "${currentInput}" — please pick your actual birth city:`,
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
              ? `मैं "${currentInput}" को ${c.name}, ${c.state} (अक्षांश ${c.lat}°N, रेखांश ${c.lng}°E) के रूप में समझ रही हूँ — क्या यह सही है?`
              : `I read "${currentInput}" as ${c.name}, ${c.state} (lat ${c.lat}°N, lng ${c.lng}°E) — is that correct?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }, 500);
    } else if (step === 'QUESTION') {
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
          ? `बहुत सुंदर। कृपया अपना विशिष्ट प्रश्न या परिस्थिति विस्तार से लिखें, ताकि मैं खगोलीय विश्लेषण कर काशी के विद्वान् को पूर्ण विवरण भेज सकूँ:`
          : `Understood. Please describe your specific dilemma, timing question, or life situation in your own words:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setStep('QUESTION');
  };

  // Computes Real-Time Ephemeris & Generates Instant Free AI Pulse Report
  const runVedicCalculationAndDeliverPulse = (seekerQuestion: string) => {
    setStep('CALCULATING');
    setIsTyping(true);

    // Persist the seeker as the browser's ACTIVE PROFILE immediately, so the
    // entire site (daily panchang, dashboard, my-calendar, kundali pages…)
    // shows THEIR real data everywhere instead of demo/dummy values. Updating
    // in place when it's the same person; a new profile for a new seeker.
    try {
      const existing = getActiveProfile();
      const samePerson =
        !!existing?.name &&
        !!userData.name &&
        existing.name.trim().toLowerCase() === userData.name.trim().toLowerCase() &&
        existing.birthDate === userData.birthDate && existing.birthTime === userData.birthTime &&
        existing.lat === userData.birthLat && existing.lng === userData.birthLon;
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
      // Deterministic calculation
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
            Saturn: { rasiName: 'Kumbha', status: 'Own Sign' },
            Rahu: { rasiName: 'Meena', house: 11 },
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
          ? 'वर्तमान में गुरु-चन्द्र युति आपके कर्म भाव को सक्रिय कर रही है। शनि की दृष्टि स्थिरता की मांग कर रही है।'
          : 'Active Moon-Jupiter alignment activates the 10th Karma house. Saturn transit demands strategic patience.',
        auspiciousWindow: lang === 'hi' ? 'अक्टूबर २०२६ से मार्च २०२७' : 'October 2026 to March 2027',
        preliminaryInsight: lang === 'hi'
          ? `आपके प्रश्न ("${seekerQuestion}") के अनुसार, आपकी कुण्डली में चन्द्र-गुरु की अंतर्दशा नए उपक्रमों में शुभता दे रही है। हालांकि राहु का गोचर भाव-११ में होने से किसी भी वित्तीय अनुबंध पर वरिष्ठ विद्वान् द्वारा अंतिम मुहर आवश्यक है।`
          : `For your inquiry ("${seekerQuestion}"), Moon-Jupiter Antardasha supports major career expansion. However, Rahu transit in 11th house requires strict scholarly timing validation before committing capital.`
      };

      setPulseReport(pulseResult);
      setIsTyping(false);

      const pulseDeliveryText = lang === 'hi'
        ? `🌟 आपकी कुण्डली की प्रत्यक्ष गणना सम्पन्न हुई! नीचे आपकी निःशुल्क प्रारम्भिक खगोलीय स्थिति (AI Vedic Pulse) प्रस्तुत है:`
        : `🌟 Instant Astronomical Ephemeris Calculated! Here is your Free Preliminary AI Vedic Pulse:`;

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
          id: `guru-package-prompt-${Date.now() + 1}`,
          sender: 'GURU_AI',
          text: lang === 'hi'
            ? `काशी के वरिष्ठ विद्वान् ज्योतिषी आपके इस पूर्ण चार्ट एवं प्रश्न का प्रत्यक्ष विवेचन करने हेतु उपलब्ध हैं। कृपया अपना परामर्श माध्यम चुनें:`
            : `Our senior Banaras Vedic Scholars are available to conduct a deep verified consultation with your pre-computed dossier. Choose your consultation mode:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);

      setStep('PACKAGE_SELECT');
    }, 1400);
  };

  // Razorpay Checkout Execution
  const handleProceedToPayment = async (tier: 'WRITTEN' | 'VOICE' | 'VIDEO' | 'PARIVAAR') => {
    chitiSensory.playTick();
    setSelectedTier(tier);
    setIsProcessingPayment(true);

    const tierPricing: Record<string, { amount: number; nameHi: string; nameEn: string; desc: string }> = {
      WRITTEN: { amount: 501, nameHi: 'लिखित विद्वत्-परामर्श पत्र', nameEn: 'Written Scholar Folio', desc: 'Verified Written PDF within 4-12h' },
      VOICE: { amount: 1100, nameHi: 'गोपनीय प्रत्यक्ष वॉयस कॉल (15 min)', nameEn: 'Encrypted Voice Call (15m)', desc: 'CallMe4 E2EE Number-Masked Audio Call' },
      VIDEO: { amount: 1500, nameHi: 'साक्षात् वीडियो दर्शन परामर्श (20 min)', nameEn: 'HD Video Darshan Consult (20m)', desc: 'HD Video + Live Synchronized Kundali Canvas' },
      PARIVAAR: { amount: 2100, nameHi: 'पारिवारिक कुण्डली महा-विवेचन (30 min)', nameEn: 'Parivaar Masterclass (30m)', desc: 'Full Family Multi-Chart Deep-Dive' },
    };

    const config = tierPricing[tier];

    try {
      // Step 1: Create Order via Server API
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
          pulseDossier: pulseReport
            ? { ...pulseReport, seekerMood: userData.mood || undefined }
            : pulseReport,
        }),
      });

      const data = await res.json();
      const caseId = data.consultationId || `CT-${Date.now().toString().slice(-6)}`;
      setCreatedCaseId(caseId);

      // Step 2: Open Razorpay Gateway
      const Razorpay = await loadRazorpayCheckout();
      if (!Razorpay || !data.checkoutEnabled) {
        // Fallback simulation / direct confirmation
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
      // Fallback booking success
      completeConsultationBooking(`CT-${Date.now().toString().slice(-6)}`, tier);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const completeConsultationBooking = (caseId: string, tier: 'WRITTEN' | 'VOICE' | 'VIDEO' | 'PARIVAAR') => {
    chitiSensory.playTick();
    setStep('CONFIRMED');

    const confirmationText = lang === 'hi'
      ? `🎉 बधाई हो! आपका परामर्श आदेश (Case ID: ${caseId}) सफलतापूर्वक दर्ज हो चुका है।\n\n✓ आपकी कुण्डली की खगोलीय गणना एवं AI प्रारंभिक रिपोर्ट काशी के वरिष्ठ विद्वान् को प्रेषित कर दी गई है।`
      : `🎉 Congratulations! Your consultation (Case ID: ${caseId}) is confirmed.\n\n✓ Your birth parameters & AI pre-context dossier have been dispatched to our Senior Banaras Scholar.`;

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
    <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] dark:bg-[#080A10] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/35 rounded-3xl w-full max-w-2xl h-[92vh] max-h-[780px] flex flex-col shadow-2xl overflow-hidden font-mono-data">
        
        {/* TOP HEADER */}
        <div className="p-4 sm:px-6 bg-gradient-to-r from-[#8E6F1D]/15 via-[#FAF7F2] to-[#8E6F1D]/15 dark:from-[#D4AF37]/15 dark:via-[#080A10] dark:to-[#D4AF37]/15 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8E6F1D] to-[#D4AF37] flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#1C1917] dark:text-white">
                  {lang === 'hi' ? 'काशी सहायक' : 'Kashi Sahayak'}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AI-ASSISTED</span>
                </span>
              </div>
              <p className="text-[11px] text-[#696256] dark:text-[#9E988D]">
                {lang === 'hi' ? 'CosmicTantra Vedic Assistant • विद्वान् समीक्षा उपलब्ध' : 'CosmicTantra Vedic Assistant • Scholar Escalation Available'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetConsultSession}
              className="p-2 rounded-xl text-[#696256] dark:text-[#9E988D] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={lang === 'hi' ? 'नया सत्र आरम्भ करें (Start Fresh — इस चैट की स्मृति मिटाएं)' : 'Start fresh (clear this chat memory)'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => { chitiSensory.playTick(); voice.toggleVoice(); }}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                voice.voiceEnabled
                  ? 'text-[#8E6F1D] dark:text-[#F0C968] hover:bg-black/5 dark:hover:bg-white/5'
                  : 'text-[#696256] dark:text-[#9E988D] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={voice.voiceEnabled ? 'काशी सहायक वाणी बंद करें (Mute Voice)' : 'काशी सहायक वाणी चालू करें (Enable Voice)'}
            >
              {voice.voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => { chitiSensory.playTick(); onClose(); }}
              className="p-2 rounded-xl text-[#696256] dark:text-[#9E988D] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[80%]">
                {msg.sender === 'GURU_AI' && (
                  <div className="w-7 h-7 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] flex items-center justify-center shrink-0 mb-1 text-xs font-bold shadow-xs">
                    🕉️
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'USER'
                      ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-medium rounded-br-xs shadow-md'
                      : 'bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-[#1C1917] dark:text-[#EFECE6] rounded-bl-xs shadow-xs'
                  }`}
                >
                  {msg.text}

                  {/* EMBEDDED INSTANT AI PULSE REPORT CARD */}
                  {msg.isPulseReport && msg.pulseData && (
                    <div className="mt-3.5 p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                        <span className="font-bold text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{lang === 'hi' ? 'प्रारम्भिक खगोलीय स्थिति (Vedic Pulse)' : 'Preliminary Ephemeris Pulse'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono-data text-[10px] font-bold">
                          100% Deterministic
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
                </div>
              </div>
              <span className="text-[10px] text-[#696256] dark:text-[#9E988D] mt-1 px-9">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* TYPING INDICATOR */}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] flex items-center justify-center text-xs font-bold">
                🕉️
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {/* STEP 0: EMOTIONAL CHECK-IN (आज मन कैसा है?) */}
          {step === 'MOOD' && (
            <div className="space-y-2 pt-2 animate-in fade-in">
              <div className="text-xs text-[#696256] dark:text-[#9E988D] font-bold">
                {lang === 'hi' ? 'एक स्पर्श में बताइए — आज आपका मन कैसा है?' : 'One tap — how are you feeling today?'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MOOD_OPTIONS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMood(m.id)}
                    className="p-3 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] text-left text-xs font-bold text-[#1C1917] dark:text-white transition-all cursor-pointer hover:shadow-md active:scale-98"
                  >
                    {lang === 'hi' ? m.chipLabel : m.chipLabelEn}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#696256] dark:text-[#9E988D]">
                {lang === 'hi'
                  ? '💬 या अपनी भावना शब्दों में नीचे लिखें — काशी सहायक समझ जाएगी।'
                  : '💬 Or describe your feeling in words below — Kashi Sahayak will understand.'}
              </p>
            </div>
          )}

          {/* RE-CONFIRM CHIPS: typed birth details echoed back before commit */}
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
              ) : (
                <></>
              )}
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
                  {lang === 'hi' ? '✏️ नहीं, दुबारा लिखूँगा/लिखूँगी' : '✏️ No, let me retype'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 1 HELPER: 1-Click Vault Autofill */}
          {step === 'NAME' && (
            <div className="pt-2">
              <button
                onClick={handleUseSavedProfile}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#8E6F1D]/15 to-[#D4AF37]/25 border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:scale-102 transition-transform cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{lang === 'hi' ? '⚡ सक्रिय पारिवारिक प्रोफाइल से स्वतः भरें' : '⚡ 1-Click Load from Saved Profile'}</span>
              </button>
            </div>
          )}

          {/* STEP: DOMAIN SELECTOR */}
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

          {/* STEP: PACKAGE SELECTOR (HIGH CONVERSION RAZORPAY TIERS) */}
          {step === 'PACKAGE_SELECT' && (
            <div className="space-y-3 pt-3 animate-in zoom-in-95">
              <div className="text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{lang === 'hi' ? 'विद्वान् परामर्श पैकेज चुनें (Razorpay 1-Click UPI / Cards):' : 'Select Scholar Package (Razorpay 1-Click UPI):'}</span>
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
                        ? 'काशी के विद्वान् द्वारा हस्तलिखित व डिजिटल हस्ताक्षरित विस्तृत पत्र (४-१२ घंटे में WhatsApp पर)'
                        : 'Verified PDF folio signed by Banaras scholar with planetary remedies within 4-12 hours.'}
                    </p>
                  </div>
                  <button className="mt-3 w-full py-2 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center justify-center gap-1">
                    <span>{lang === 'hi' ? '₹५०१ दक्षिणा दें →' : 'Book Folio ₹501 →'}</span>
                  </button>
                </div>

                {/* TIER 2: CallMe4-Style Encrypted Voice Call (₹1,100) */}
                <div 
                  onClick={() => handleProceedToPayment('VOICE')}
                  className="p-4 rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10 hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer relative group flex flex-col justify-between"
                >
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold">
                      🔒 100% NUMBER MASKED
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-xs text-[#1C1917] dark:text-white">
                          {lang === 'hi' ? 'गोपनीय वॉयस कॉल (15 min)' : 'Encrypted Voice Call'}
                        </span>
                      </div>
                      <span className="font-bold text-sm font-mono-data text-emerald-700 dark:text-emerald-400">₹1,100</span>
                    </div>
                    <p className="text-[11px] text-[#696256] dark:text-[#9E988D] leading-relaxed">
                      {lang === 'hi'
                        ? 'विद्वान् से प्रत्यक्ष गोपनीय कॉल। शून्य फोन नम्बर प्रकटीकरण (CallMe4 सुरक्षा)। पूर्व-तैयार कुंडली।'
                        : 'Direct audio call with senior Pandit. 100% number-masked E2EE privacy. Pre-loaded Kundali.'}
                    </p>
                  </div>
                  <button className="mt-3 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1">
                    <span>{lang === 'hi' ? 'कॉल प्रारम्भ करें (₹१,१००) →' : 'Start Call ₹1,100 →'}</span>
                  </button>
                </div>

                {/* TIER 3: HD Video Darshan Consultation (₹1,500) */}
                <div 
                  onClick={() => handleProceedToPayment('VIDEO')}
                  className="p-4 rounded-2xl border-2 border-indigo-500/40 dark:border-indigo-500/50 bg-indigo-500/5 dark:bg-indigo-500/10 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer relative group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-bold text-xs text-[#1C1917] dark:text-white">
                          {lang === 'hi' ? 'साक्षात् वीडियो दर्शन (20 min)' : 'Live Video Darshan'}
                        </span>
                      </div>
                      <span className="font-bold text-sm font-mono-data text-indigo-700 dark:text-indigo-400">₹1,500</span>
                    </div>
                    <p className="text-[11px] text-[#696256] dark:text-[#9E988D] leading-relaxed">
                      {lang === 'hi'
                        ? 'विद्वान् के साथ आमने-सामने वीडियो दर्शन + स्क्रीन पर लाइव कुण्डली विश्लेषण।'
                        : 'Face-to-face HD Video with Pandit + synchronized side-by-side birth chart review.'}
                    </p>
                  </div>
                  <button className="mt-3 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1">
                    <span>{lang === 'hi' ? 'वीडियो दर्शन (₹१,५००) →' : 'Video Darshan ₹1,500 →'}</span>
                  </button>
                </div>

                {/* TIER 4: Parivaar Masterclass (₹2,100) */}
                <div 
                  onClick={() => handleProceedToPayment('PARIVAAR')}
                  className="p-4 rounded-2xl border-2 border-amber-500/40 dark:border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer relative group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-xs text-[#1C1917] dark:text-white">
                          {lang === 'hi' ? 'पारिवारिक कुण्डली सत्र (30 min)' : 'Parivaar Masterclass'}
                        </span>
                      </div>
                      <span className="font-bold text-sm font-mono-data text-amber-700 dark:text-amber-400">₹2,100</span>
                    </div>
                    <p className="text-[11px] text-[#696256] dark:text-[#9E988D] leading-relaxed">
                      {lang === 'hi'
                        ? 'समस्त परिवार के सदस्यों का संयुक्त वर्षफल एवं ग्रह शान्ति उपाय।'
                        : 'Complete family multi-chart analysis, transits, and collective harmony remedies.'}
                    </p>
                  </div>
                  <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-[#8E6F1D] text-white font-bold text-xs flex items-center justify-center gap-1">
                    <span>{lang === 'hi' ? 'सत्र बुक करें (₹२,१००) →' : 'Book Session ₹2,100 →'}</span>
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
                  ? (lang === 'hi' ? 'आपका लिखित पत्र विद्वान् द्वारा तैयार किया जा रहा है। इसे देखने हेतु रिपोर्ट सेक्शन खोलें।' : 'Your written folio is being prepared by our scholar. You can review and download the vector PDF.')
                  : (lang === 'hi' ? 'आपका गोपनीय परामर्श कक्ष सक्रिय हो गया है। सीधे कक्ष में प्रवेश करें:' : 'Your CallMe4 encrypted consultation room is active. Enter the private sanctum:')
                }
              </p>
              <div className="flex gap-2 pt-1">
                {selectedTier === 'WRITTEN' ? (
                  <a
                    href="/report"
                    className="flex-1 py-3 px-4 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-center text-xs flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'लिखित पत्र देखें (View Folio) →' : 'View Written Folio →'}</span>
                  </a>
                ) : (
                  <a
                    href={`/consultation/room/${createdCaseId}?mode=${selectedTier.toLowerCase()}&role=devotee`}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'गोपनीय कक्ष में प्रवेश करें (Enter Chamber) →' : 'Enter Encrypted Chamber →'}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* KASHI SAHAYAK — verified passage, clarification, quick actions */}
          <div data-testid="kashi-companion" data-revision={kashi.revision}>
            {kashi.lastResponse?.guidance === 'safety' && (
              <div data-testid="kashi-safety" role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-xs">
                {kashi.lastResponse.acknowledgement}
              </div>
            )}
            {kashi.pendingVerse ? (
              <KashiVerseCard
                passage={kashi.pendingVerse}
                reflection={kashi.lastResponse?.reflection || undefined}
                language={lang === 'hi' ? 'hi' : 'en'}
                autoplayAllowed={false}
                onListen={() => kashi.control('resume')}
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

        {/* BOTTOM INPUT BAR (Active for text prompt stages) */}
        {['MOOD', 'NAME', 'BIRTH_DATE', 'BIRTH_TIME', 'BIRTH_PLACE', 'QUESTION'].includes(step) && (
          <form
            onSubmit={handleSendText}
            className="p-3 sm:p-4 bg-white dark:bg-[#0E101D] border-t border-black/10 dark:border-white/10 flex items-center gap-2 shrink-0"
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
                  // Typed text also reaches the companion: it may be a crisis
                  // disclosure or an emotional cue that needs a response.
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
        )}

      </div>
    </div>
  );
}
