'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Clock, 
  CheckCircle2, 
  Phone, 
  Video, 
  FileText, 
  ChevronRight, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  Flame,
  ShieldCheck,
  Compass,
  Calendar,
  ShoppingBag,
  HeartHandshake
} from 'lucide-react';
import { getActiveProfile } from '@/lib/profileStore';
import { calculateKundali } from '@/lib/astrologyEngine';
import { chitiSensory } from '@/lib/chitiAudio';

interface ChatMessage {
  id: string;
  sender: 'GURU' | 'USER' | 'SYSTEM';
  text: string;
  timestamp: string;
  quickChips?: Array<{ label: string; action: string; href?: string }>;
  pulseCard?: {
    lagna: string;
    nakshatra: string;
    dasha: string;
    recommendation: string;
  };
  navigationAction?: {
    title: string;
    description: string;
    href: string;
    icon: string;
  };
}

export default function FloatingAIGuruAvatar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showGreetingTooltip, setShowGreetingTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('आज का दिन कैसा रहेगा? मुझसे पूछें 🙏');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Conversational Form State
  const [intakeStep, setIntakeStep] = useState<
    'IDLE' | 'SELECT_DOMAIN' | 'ASK_NAME' | 'ASK_PHONE' | 'ASK_BIRTH_DATE' | 'ASK_BIRTH_TIME' | 'ASK_BIRTH_CITY' | 'ASK_QUESTION' | 'PULSE_GENERATED'
  >('IDLE');

  const [seekerData, setSeekerData] = useState({
    name: '',
    phone: '',
    birthDate: '1995-06-15',
    birthTime: '10:30',
    birthCity: 'Varanasi',
    domain: 'Career & Business',
    question: '',
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Time-aware greeting
  useEffect(() => {
    const hour = new Date().getHours();
    let salutation = 'प्रणाम! 🙏 आज का दिन कैसा रहेगा?';
    if (hour >= 5 && hour < 11) {
      salutation = 'सुप्रभात! ☀️ आज का शुभ मुहूर्त व ७२h गोचर देखें 🙏';
    } else if (hour >= 11 && hour < 17) {
      salutation = 'नमस्ते! ⚡ आज के कार्य व पञ्चाङ्ग का पूर्व-अवलोकन करें 🙏';
    } else if (hour >= 17 && hour < 22) {
      salutation = 'शुभ संध्या! 🪔 काशी विश्वनाथ लाइव संध्या आरती दर्शन करें 🌸';
    } else {
      salutation = 'हर हर महादेव! 🌙 कल के दिन की ग्रह स्थिति जानें 🙏';
    }
    setTooltipText(salutation);

    // Show tooltip 3 seconds after load
    const t = setTimeout(() => {
      setShowGreetingTooltip(true);
    }, 3000);

    return () => clearTimeout(t);
  }, []);

  // Prefill active profile if available
  useEffect(() => {
    const p = getActiveProfile();
    if (p) {
      setSeekerData(prev => ({
        ...prev,
        name: p.name || prev.name,
        birthDate: p.birthDate || prev.birthDate,
        birthTime: p.birthTime || prev.birthTime,
        birthCity: p.birthCity || prev.birthCity,
      }));
    }
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const toggleOpen = () => {
    if (soundEnabled) chitiSensory.playBell();
    setShowGreetingTooltip(false);
    setIsOpen(!isOpen);

    if (!isOpen && chatMessages.length === 0) {
      // Initialize welcoming dialogue
      const hour = new Date().getHours();
      let greeting = 'प्रणाम! 🙏 मैं गुरु ज्योतिषदेव हूँ — आपका AI वैदिक मार्गदर्शक।';
      if (hour >= 5 && hour < 11) {
        greeting = 'सुप्रभात! ☀️ ब्रह्म मुहूर्त व सूर्योदय का पावन समय है। मैं आपकी क्या सहायता करूँ?';
      } else if (hour >= 17 && hour < 22) {
        greeting = 'शुभ संध्या! 🪔 संध्या दीप प्रज्वलन का समय है। मैं आपकी क्या सहायता करूँ?';
      }

      setChatMessages([
        {
          id: 'welcome-1',
          sender: 'GURU',
          text: `${greeting} आज 2026 की आधुनिक व्यस्त दिनचर्या में आप क्या जानना या अनुभव करना चाहते हैं?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickChips: [
            { label: '⚡ आज का 72h राशिफल व गोचर', action: 'NAV_DAILY', href: '/daily' },
            { label: '🌸 26 महातीर्थ लाइव दर्शन व आरती', action: 'NAV_DARSHAN', href: '/darshan' },
            { label: '🔮 विद्वान् ज्योतिषी परामर्श (Pre-Context)', action: 'START_INTAKE' },
            { label: '👥 परिवार पञ्चाङ्ग व सुरक्षा', action: 'NAV_FAMILY', href: '/family-panchang' },
            { label: '📿 दैनिक मन्त्र जप व स्तोत्र', action: 'NAV_MANTRA', href: '/remedy-tracker' },
          ],
        },
      ]);
    }
  };

  const handleChipClick = (chip: { label: string; action: string; href?: string }) => {
    if (soundEnabled) chitiSensory.playTick();

    // Add user message
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text: chip.label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);

    // Action routing
    if (chip.action === 'NAV_DAILY') {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'आज के दिन की तीन खगोलीय अवधियां (आज, कल, परसों), सप्ताह का सर्वोच्च दिन (Peak Day) और संक्रान्ति गोचर तैयार है:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            navigationAction: {
              title: '72h Multi-Horizon Forecast Hub',
              description: 'आज, कल व परसों की विस्तृत ग्रह स्थिति व कार्य अनुकूलता देखें →',
              href: '/daily',
              icon: '🔮',
            },
          },
        ]);
      }, 500);
    } else if (chip.action === 'NAV_DARSHAN') {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'काशी विश्वनाथ, महाकालेश्वर, केदारनाथ, सोमनाथ एवं माँ गंगा की 24x7 लाइव आरती व ई-पूजा दर्शन कक्ष सक्रिय है:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            navigationAction: {
              title: '26 Sacred Temples Live Sanctum',
              description: 'लाइव तीर्थ दर्शन करें, वर्चुअल दीप प्रज्वलित करें एवं संकल्प लें →',
              href: '/darshan',
              icon: '🌸',
            },
          },
        ]);
      }, 500);
    } else if (chip.action === 'NAV_FAMILY') {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'आपके सम्पूर्ण परिवार के सदस्यों के समन्वित गोचर, सामूहिक तालमेल स्कोर एवं रक्षात्मक अलर्ट तैयार हैं:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            navigationAction: {
              title: 'Parivaar Family Panchang & Shield',
              description: 'पारिवारिक गोचर व सुरक्षा सूत्र देखें →',
              href: '/family-panchang',
              icon: '👥',
            },
          },
        ]);
      }, 500);
    } else if (chip.action === 'NAV_MANTRA') {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'महामृत्युंजय, गायत्री एवं नवग्रह मन्त्रों की 108 मनकों वाली डिजिटल जप माला व स्तोत्र संग्रह:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            navigationAction: {
              title: '108-Bead Japa & Stotra Library',
              description: 'दैनिक मन्त्र साधना व माला काउंटर प्रारम्भ करें →',
              href: '/remedy-tracker',
              icon: '📿',
            },
          },
        ]);
      }, 500);
    } else if (chip.action === 'START_INTAKE') {
      setIntakeStep('SELECT_DOMAIN');
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'उत्तम विचार! 🙏 आपके प्रश्न की कुण्डली गणना हेतु सबसे पहले बताएं कि आपका मुख्य विषय क्या है?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickChips: [
              { label: '💼 करियर, व्यापार व धन लाभ', action: 'SET_DOMAIN_CAREER' },
              { label: '💍 विवाह, सम्बंध व दाम्पत्य', action: 'SET_DOMAIN_MARRIAGE' },
              { label: '🌿 स्वास्थ्य, ऊर्जा व आयुर्-ज्योतिष', action: 'SET_DOMAIN_HEALTH' },
              { label: '🪔 राहु-केतु, कालसर्प व ग्रह शान्ति', action: 'SET_DOMAIN_REMEDY' },
              { label: '🏡 भूमि, भवन, विदेश यात्रा व विवाद', action: 'SET_DOMAIN_PROPERTY' },
            ],
          },
        ]);
      }, 500);
    } else if (chip.action.startsWith('SET_DOMAIN_')) {
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
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    if (soundEnabled) chitiSensory.playTick();
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
      setIntakeStep('ASK_PHONE');
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `प्रणाम ${text} जी! 🙏 कृपया अपना व्हाट्सएप / फोन नम्बर दर्ज करें (🔒 CallMe4 100% गोपनीय — यह पंडित जी को कभी प्रदर्शित नहीं होता):`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 500);
    } else if (intakeStep === 'ASK_PHONE') {
      setSeekerData(prev => ({ ...prev, phone: text }));
      setIntakeStep('ASK_QUESTION');
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `धन्यवाद! अब कृपया वह मुख्य प्रश्न या परिस्थिति विस्तार से लिखें, जिस पर आप काशी के विद्वान् से मार्गदर्शन चाहते हैं:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 500);
    } else if (intakeStep === 'ASK_QUESTION') {
      setSeekerData(prev => ({ ...prev, question: text }));
      setIntakeStep('PULSE_GENERATED');

      // Compute deterministic Vedic Ephemeris
      const kundali = calculateKundali(
        new Date(seekerData.birthDate),
        seekerData.birthTime || '10:30',
        25.3176, // Default Varanasi coordinates
        82.9739,
        5.5
      );

      const lagnaName = kundali?.lagna?.rashiEn ? `${kundali.lagna.rashiName} (${kundali.lagna.rashiEn})` : 'Vrishabha (Taurus)';
      const nakshatraName = (kundali?.moon?.nakshatra as any)?.name || 'Rohini';
      const dashaStr = (kundali as any)?.dasha ? `${(kundali as any).dasha.major} • ${(kundali as any).dasha.minor}` : 'चन्द्र • गुरु';

      // Dispatch lead to CRM bridge (records drop-off for automated WhatsApp follow-up)
      try {
        fetch('/api/astrology/leads/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...seekerData,
            question: text,
            lagna: lagnaName,
            nakshatra: nakshatraName,
            dasha: dashaStr,
          }),
        }).catch(() => {});
      } catch {}

      if (soundEnabled) chitiSensory.playBell();

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `शानदार! मैंने आपकी कुण्डली की खगोलीय गणना पूर्ण कर ली है। आपकी प्रारम्भिक वैदिक पल्स रिपोर्ट यहाँ प्रस्तुत है:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pulseCard: {
              lagna: lagnaName,
              nakshatra: nakshatraName,
              dasha: dashaStr,
              recommendation: `आपकी वर्तमान ${dashaStr} दशा आपके ${seekerData.domain} हेतु महत्वपूर्ण परिवर्तन योग निर्मित कर रही है। काशी के वरिष्ठ विद्वान् पंडित विद्यानंद शास्त्री जी इस प्रश्न पर विस्तृत फलकथन व उपाय समाधान प्रदान करेंगे।`,
            },
            quickChips: [
              { label: '📜 ₹501 लिखित विद्वत्-परामर्श पत्र (PDF)', action: 'OPEN_CHECKOUT_WRITTEN', href: '/ask' },
              { label: '📞 ₹1,100 गोपनीय वॉयस कॉल (15 Min)', action: 'OPEN_CHECKOUT_VOICE', href: '/ask' },
              { label: '📹 ₹1,500 साक्षात् वीडियो दर्शन (20 Min)', action: 'OPEN_CHECKOUT_VIDEO', href: '/ask' },
            ],
          },
        ]);
      }, 700);
    } else {
      // General Vedic conversational intelligence
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `आपके प्रश्न "${text}" के संदर्भ में वैदिक ज्योतिषीय दृष्टि से यह समय गहन अवलोकन का है। क्या आप आज के ७२ घण्टे गोचर देखना चाहेंगे या विद्वान् ज्योतिषी से प्रत्यक्ष परामर्श लेंगे?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickChips: [
              { label: '🔮 विद्वान् ज्योतिषी परामर्श शुरू करें', action: 'START_INTAKE' },
              { label: '⚡ 72h गोचर व राशिफल देखें', action: 'NAV_DAILY', href: '/daily' },
              { label: '🌸 लाइव मन्दिर दर्शन', action: 'NAV_DARSHAN', href: '/darshan' },
            ],
          },
        ]);
      }, 600);
    }
  };

  return (
    <>
      {/* FLOATING GURU AVATAR BUTTON (Fixed Bottom-Right) */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end pointer-events-auto font-mono-data">
        
        {/* Dynamic Contextual Tooltip Greeting */}
        {!isOpen && showGreetingTooltip && (
          <div className="mb-2 max-w-xs p-3 rounded-2xl bg-white/95 dark:bg-[#0E101D]/95 backdrop-blur-xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300 relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowGreetingTooltip(false); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] hover:bg-black"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-start gap-2.5 cursor-pointer" onClick={toggleOpen}>
              <span className="text-xl shrink-0">🪔</span>
              <div>
                <div className="text-[10px] font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
                  गुरु ज्योतिषदेव (AI वैदिक मार्गदर्शक)
                </div>
                <p className="text-xs font-medium text-[#1C1917] dark:text-white mt-0.5 leading-snug">
                  {tooltipText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* The Golden Aura Avatar Button */}
        <button
          onClick={toggleOpen}
          className={`relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-[#8E6F1D] via-[#B8860B] to-[#D4AF37] text-white shadow-2xl hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center border-2 border-amber-300/60 ${
            isOpen ? 'rotate-90 bg-black/80' : ''
          }`}
          title="गुरु ज्योतिषदेव AI से बात करें"
        >
          {/* Subtle Breathing Halo Ring */}
          {!isOpen && (
            <div className="absolute -inset-2 rounded-full border-2 border-[#D4AF37]/40 animate-ping pointer-events-none" />
          )}

          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="flex items-center justify-center relative">
              <span className="text-2xl sm:text-3xl">🪔</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
            </div>
          )}
        </button>
      </div>

      {/* EXPANDED INTERACTIVE SACRED CONCIERGE CHAT DRAWER */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto sm:w-[420px] max-h-[85vh] sm:max-h-[620px] h-[580px] bg-white/95 dark:bg-[#0C0E1A]/95 backdrop-blur-2xl border-2 border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden font-mono-data animate-in zoom-in-95 duration-200">
          
          {/* Top Sanctum Header */}
          <div className="p-3.5 px-4 bg-gradient-to-r from-[#8E6F1D]/15 via-[#FAF7F2] to-[#D4AF37]/20 dark:from-[#D4AF37]/15 dark:via-[#121526] dark:to-[#8E6F1D]/20 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#8E6F1D] to-[#D4AF37] flex items-center justify-center text-white text-lg shadow-md">
                🪔
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#1C1917] dark:text-white">
                    गुरु ज्योतिषदेव
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-[10px] text-[#696256] dark:text-[#9E988D]">
                  AI वैदिक मार्गदर्शक • 100% निःशुल्क प्रारम्भ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white"
                title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
              </button>

              <button
                onClick={toggleOpen}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                    msg.sender === 'USER'
                      ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] rounded-br-xs font-medium'
                      : 'bg-[#FAF7F2] dark:bg-[#151829] border border-black/10 dark:border-white/10 text-[#1C1917] dark:text-white rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Navigation Action Card */}
                  {msg.navigationAction && (
                    <Link
                      href={msg.navigationAction.href}
                      onClick={() => setIsOpen(false)}
                      className="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-[#0A0C14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 flex items-center justify-between group hover:border-[#8E6F1D] transition-colors block"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{msg.navigationAction.icon}</span>
                        <div>
                          <div className="font-bold text-[11px] text-[#1C1917] dark:text-white group-hover:text-[#8E6F1D] dark:group-hover:text-[#F0C968]">
                            {msg.navigationAction.title}
                          </div>
                          <p className="text-[9px] text-[#696256] dark:text-[#9E988D]">
                            {msg.navigationAction.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#F0C968] group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}

                  {/* Instant Free Vedic Pulse Card */}
                  {msg.pulseCard && (
                    <div className="mt-3 p-3 rounded-2xl bg-white dark:bg-[#0A0C14] border border-amber-500/40 space-y-2 text-left">
                      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-1.5">
                        <span className="font-bold text-[11px] text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>वैदिक पल्स पूर्व-गणना (Pre-Context)</span>
                        </span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ Calculated
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5">
                          <span className="text-[8px] text-[#696256] dark:text-[#9E988D] block">लग्न</span>
                          <strong className="text-[#1C1917] dark:text-white">{msg.pulseCard.lagna}</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5">
                          <span className="text-[8px] text-[#696256] dark:text-[#9E988D] block">नक्षत्र</span>
                          <strong className="text-[#1C1917] dark:text-white">{msg.pulseCard.nakshatra}</strong>
                        </div>
                        <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5">
                          <span className="text-[8px] text-[#696256] dark:text-[#9E988D] block">सक्रिय दशा</span>
                          <strong className="text-[#8E6F1D] dark:text-[#F0C968]">{msg.pulseCard.dasha}</strong>
                        </div>
                      </div>

                      <p className="text-[10px] text-[#44403C] dark:text-[#D1C9BF] leading-relaxed italic bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        {msg.pulseCard.recommendation}
                      </p>
                    </div>
                  )}

                  {/* Fast Action Suggestion Chips */}
                  {msg.quickChips && msg.quickChips.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.quickChips.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (chip.href && chip.action.startsWith('OPEN_CHECKOUT_')) {
                              router.push(chip.href);
                              setIsOpen(false);
                            } else {
                              handleChipClick(chip);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0A0C14] hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#080A10] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 text-[10px] font-bold text-[#1C1917] dark:text-white transition-all cursor-pointer shadow-xs text-left"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[8px] text-[#696256] dark:text-[#9E988D] mt-0.5 px-1.5">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={chatScrollRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-[#FAF7F2] dark:bg-[#121526] border-t border-black/10 dark:border-white/10 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="पूछें: आज का दिन, विवाह, व्यापार, या मन्त्र..."
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white focus:outline-none focus:border-[#8E6F1D]"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="p-2 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
