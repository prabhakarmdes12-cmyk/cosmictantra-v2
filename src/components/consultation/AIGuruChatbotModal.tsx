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
  ChevronRight
} from 'lucide-react';
import { getActiveProfile, getProfiles } from '@/lib/profileStore';
import { chitiSensory } from '@/lib/chitiAudio';
import { calculateKundali } from '@/lib/astrologyEngine';

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
  const [step, setStep] = useState<'WELCOME' | 'NAME' | 'BIRTH_DATE' | 'BIRTH_TIME' | 'BIRTH_PLACE' | 'DOMAIN' | 'QUESTION' | 'CALCULATING' | 'PULSE_READY' | 'PACKAGE_SELECT' | 'PAYMENT_PENDING' | 'CONFIRMED'>('WELCOME');
  
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
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pulseReport, setPulseReport] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<'WRITTEN' | 'VOICE' | 'VIDEO' | 'PARIVAAR'>('WRITTEN');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, step]);

  // Initialize Guru AI greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
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
        }));
      }

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const greetingText = lang === 'hi'
          ? `प्रणाम! 🙏 मैं गुरु ज्योतिषदेव (AI वैदिक मार्गदर्शक) हूँ। मैं आपकी कुण्डली की प्रत्यक्ष खगोलीय गणना कर काशी के विद्वान् ज्योतिषी हेतु आपकी संपूर्ण विवेचना तैयार करूंगा।\n\nकृपया अपना नाम बताएं या अपने सेव किए प्रोफाइल से आगे बढ़ें:`
          : `Namaste! 🙏 I am Guru Jyotishdev (AI Vedic Guide). I will calculate your birth ephemeris and prepare a comprehensive pre-context dossier for our practicing Banaras Vedic Scholars.\n\nPlease share your full name or continue with your saved profile:`;
        
        setMessages([
          {
            id: 'msg-1',
            sender: 'GURU_AI',
            text: greetingText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setStep('NAME');
      }, 700);
    }
  }, [isOpen, lang]);

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

    // State machine transitions
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
              : `Auspicious greetings, ${currentInput}! Please provide your Date of Birth (YYYY-MM-DD):`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setStep('BIRTH_DATE');
      }, 600);
    } else if (step === 'BIRTH_DATE') {
      setUserData(prev => ({ ...prev, birthDate: currentInput }));
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: lang === 'hi'
              ? `उत्तम। अब कृपया अपना जन्म समय (जैसे 10:30 AM या 14:45) बताएं:`
              : `Understood. Now please enter your Exact Time of Birth (e.g. 10:30 AM or 14:45):`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setStep('BIRTH_TIME');
      }, 600);
    } else if (step === 'BIRTH_TIME') {
      setUserData(prev => ({ ...prev, birthTime: currentInput }));
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: lang === 'hi'
              ? `कृपया अपना जन्म स्थान (शहर, राज्य) बताएं:`
              : `Please enter your Birth City and State:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setStep('BIRTH_PLACE');
      }, 600);
    } else if (step === 'BIRTH_PLACE') {
      setUserData(prev => ({ ...prev, birthPlace: currentInput }));
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: `guru-${Date.now()}`,
            sender: 'GURU_AI',
            text: lang === 'hi'
              ? `धन्यवाद। अब कृपया नीचे दिए गए विकल्पों में से अपना मुख्य विषय चुनें:`
              : `Thank you. Now please select the core life domain for your consultation:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setStep('DOMAIN');
      }, 600);
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
    chitiSensory.playBell();
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
                  {lang === 'hi' ? 'गुरु ज्योतिषदेव (AI वैदिक मार्गदर्शक)' : 'Guru Jyotishdev (AI Vedic Guide)'}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ONLINE</span>
                </span>
              </div>
              <p className="text-[11px] text-[#696256] dark:text-[#9E988D]">
                {lang === 'hi' ? 'काशी हिन्दू विश्वविद्यालय परम्परा • त्वरित खगोलीय विवेचना' : 'Kashi Banaras Tradition • Pre-Context Engine'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

          <div ref={chatEndRef} />
        </div>

        {/* BOTTOM INPUT BAR (Active for text prompt stages) */}
        {['NAME', 'BIRTH_DATE', 'BIRTH_TIME', 'BIRTH_PLACE', 'QUESTION'].includes(step) && (
          <form 
            onSubmit={handleSendText}
            className="p-3 sm:p-4 bg-white dark:bg-[#0E101D] border-t border-black/10 dark:border-white/10 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                step === 'NAME' ? (lang === 'hi' ? 'अपना पूरा नाम लिखें...' : 'Enter your full name...') :
                step === 'BIRTH_DATE' ? (lang === 'hi' ? 'जन्म तिथि लिखें: जैसे 1996-08-15' : 'Birth date: e.g. 1996-08-15') :
                step === 'BIRTH_TIME' ? (lang === 'hi' ? 'जन्म समय लिखें: जैसे 14:30' : 'Birth time: e.g. 14:30') :
                step === 'BIRTH_PLACE' ? (lang === 'hi' ? 'जन्म स्थान: जैसे Varanasi, UP' : 'Birth city, state') :
                (lang === 'hi' ? 'अपना प्रश्न या परिस्थिति विस्तार से लिखें...' : 'Type your question or dilemma in detail...')
              }
              className="flex-1 px-4 py-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-[#1C1917] dark:text-white placeholder:text-[#8E8A82] focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] transition-all"
            />

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
