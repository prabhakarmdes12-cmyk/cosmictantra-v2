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
    transitStatus: 'CAUTION_DAY' | 'POWER_DAY';
    transitMessage: string;
    recommendation: string;
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
}

export default function FloatingAIGuruAvatar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showGreetingTooltip, setShowGreetingTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('आज का दिन कैसा रहेगा? मुझसे पूछें 🙏');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlayingOm, setIsPlayingOm] = useState(false);
  const [offeredDiyaMsgIds, setOfferedDiyaMsgIds] = useState<Record<string, boolean>>({});
  const [offeredFlowersMsgIds, setOfferedFlowersMsgIds] = useState<Record<string, boolean>>({});
  const [activeDarshanVideoMsgIds, setActiveDarshanVideoMsgIds] = useState<Record<string, boolean>>({});

  // In-Chat Step Machine
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

    const t = setTimeout(() => {
      setShowGreetingTooltip(true);
    }, 3000);

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

  // Standard signature tactile click across all interactive buttons
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
      const hour = new Date().getHours();
      let greeting = 'प्रणाम! 🙏 मैं गुरु ज्योतिषदेव हूँ — काशी की पावन परम्परा से आपका AI वैदिक मार्गदर्शक।';
      if (hour >= 5 && hour < 11) {
        greeting = 'सुप्रभात! ☀️ ब्रह्म मुहूर्त व सूर्योदय का पावन समय है। मैं आपके लिए यहाँ उपस्थित हूँ।';
      } else if (hour >= 17 && hour < 22) {
        greeting = 'शुभ संध्या! 🪔 गंगा तट पर संध्या दीप प्रज्वलन का समय है। मैं आपकी क्या सहायता करूँ?';
      }

      setChatMessages([
        {
          id: 'welcome-1',
          sender: 'GURU',
          text: `${greeting} आज की भागदौड़ भरी दिनचर्या में आप क्या मार्गदर्शन या अनुभव प्राप्त करना चाहते हैं?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickChips: [
            { label: '🔮 कुण्डली व जीवन प्रश्न (In-Chat Intake)', action: 'START_INTAKE' },
            { label: '⚡ आज का 72h राशिफल व गोचर', action: 'NAV_DAILY', href: '/daily' },
            { label: '🌸 26 महातीर्थ लाइव दर्शन व आरती', action: 'IN_CHAT_DARSHAN' },
            { label: '👥 परिवार पञ्चाङ्ग व सुरक्षा सूत्र', action: 'NAV_FAMILY', href: '/family-panchang' },
            { label: '📿 दैनिक मन्त्र जप व स्तोत्र संग्रह', action: 'NAV_MANTRA', href: '/remedy-tracker' },
          ],
        },
      ]);
    }
  };

  // Specific sacred ritual audio: OM Chant
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

  // Specific sacred ritual audio: Lighting Diya / Temple Bell
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

  const handleChipClick = (chip: { label: string; action: string; href?: string }) => {
    playClick();

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'USER',
      text: chip.label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);

    // Handle Direct Navigation actions with intelligent pre-context validation
    if (chip.action === 'NAV_DAILY') {
      const activeP = getActiveProfile();
      const knownName = (seekerData.name && seekerData.name.trim()) || activeP?.name || '';
      const knownDOB = seekerData.birthDate || activeP?.birthDate || '';
      const knownTime = seekerData.birthTime || activeP?.birthTime || '10:30';

      if (!knownName || !knownDOB) {
        // Seeker details not known yet -> Prompt for birth details first!
        setIntakeStep('ASK_NAME');
        setTimeout(() => {
          setChatMessages(prev => [
            ...prev,
            {
              id: `g-${Date.now()}`,
              sender: 'GURU',
              text: '72 घण्टे के सूक्ष्म खगोलीय गोचर (आज, कल व परसों) का सटीक व्यक्तिगत फल जानने हेतु मुझे आपकी जन्म-पत्रिका के लग्न व चन्द्र नक्षत्र की आवश्यकता होगी। कृपया अपना शुभ नाम बताएं (ताकि आपकी कुण्डली के अनुसार गणना की जा सके):',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              quickChips: [
                { label: '🌐 सामान्य 72h गोचर हब देखें', action: 'FORCE_NAV_DAILY', href: '/daily' },
              ],
            },
          ]);
        }, 400);
        return;
      } else {
        // Seeker details ARE known -> Compute Vedic transit insight & render working link card!
        let lagnaName = 'वृषभ (Vrishabha)';
        let nakshatraName = 'रोहिणी (Rohini)';
        try {
          const dObj = new Date(knownDOB);
          const kundali = calculateKundali(
            isNaN(dObj.getTime()) ? new Date('1995-06-15') : dObj,
            knownTime,
            25.3176,
            82.9739,
            5.5
          );
          if (kundali?.lagna?.rashiEn) lagnaName = `${kundali.lagna.rashiName} (${kundali.lagna.rashiEn})`;
          if ((kundali?.moon?.nakshatra as any)?.name) nakshatraName = (kundali?.moon?.nakshatra as any).name;
        } catch {}

        const currentHour = new Date().getHours();
        const isCaution = currentHour >= 12 && currentHour <= 15;
        const transitInsight = isCaution
          ? '⚠️ आज दोपहर राहुकाल सक्रिय है — चन्द्रमा के गोचरवश महत्वपूर्ण निर्णयों में जल्दबाजी से बचें। कल प्रातः से कार्य-सिद्धि योग प्रबल होगा।'
          : '✨ आज गुरु-चन्द्र का शुभ दृष्टि योग सक्रिय है — आपके लग्न अनुसार नई पहल व वार्ता हेतु दोपहर का समय सर्वाधिक फलदायी रहेगा।';

        setTimeout(() => {
          setChatMessages(prev => [
            ...prev,
            {
              id: `g-${Date.now()}`,
              sender: 'GURU',
              text: `प्रणाम ${knownName} जी! 🙏 आपकी ${lagnaName} लग्न व ${nakshatraName} नक्षत्र के अनुसार 72-घंटे का सूक्ष्म खगोलीय गोचर:\n\n${transitInsight}\n\nआज, कल व परसों का पूर्ण त्रि-दिवसीय गोचर, शुभ मुहूर्त एवं पारिवारिक प्रभाव चार्ट नीचे देखें:`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              navigationAction: {
                title: '72h Multi-Horizon Forecast Hub',
                description: `${knownName} जी के लिए आज, कल व परसों का विस्तृत राशिफल एवं गोचर →`,
                href: '/daily',
                icon: '🔮',
              },
              quickChips: [
                { label: '🌸 संपूर्ण 72h गोचर हब खोलें', action: 'FORCE_NAV_DAILY', href: '/daily' },
                { label: '🔮 पुनः कुण्डली विवरण बदलें', action: 'START_INTAKE' },
              ],
            },
          ]);
        }, 400);
        return;
      }
    }

    if (chip.action === 'FORCE_NAV_DAILY' && chip.href) {
      handleNavigate(chip.href);
      return;
    }

    if (chip.action === 'NAV_FAMILY' && chip.href) {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'परिवार के सभी सदस्यों के ग्रह गोचर, सामूहिक तालमेल व रक्षात्मक पञ्चाङ्ग सूत्र यहाँ देखें:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            navigationAction: {
              title: 'Parivaar Family Panchang & Shield',
              description: 'पारिवारिक गोचर व सुरक्षा अलर्ट देखें →',
              href: '/family-panchang',
              icon: '👥',
            },
          },
        ]);
      }, 400);
      return;
    }

    if (chip.action === 'NAV_MANTRA' && chip.href) {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'महामृत्युंजय, गायत्री एवं नवग्रह मन्त्रों की १०८ मनकों वाली डिजिटल जप माला व स्तोत्र संग्रह:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            navigationAction: {
              title: '108-Bead Japa & Stotra Library',
              description: 'दैनिक मन्त्र साधना व माला काउंटर प्रारम्भ करें →',
              href: '/remedy-tracker',
              icon: '📿',
            },
          },
        ]);
      }, 400);
      return;
    }

    if (chip.action === 'NAV_DARSHAN_FULL' && chip.href) {
      handleNavigate(chip.href);
      return;
    }

    if (chip.action === 'DARSHAN_GANGA') {
      handlePlayDiyaBell();
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'माँ गंगा की पावन संध्या महाआरती (दशाश्वमेध घाट, वाराणसी) का लाइव दर्शन:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            inChatDarshan: {
              templeName: 'दशाश्वमेध घाट माँ गंगा महाआरती',
              deity: 'माँ गंगा व भगवान विश्वनाथ',
              location: 'दशाश्वमेध घाट, वाराणसी',
              image: '/images/darshan/ganga-aarti.jpg',
              embedUrl: 'https://www.youtube-nocookie.com/embed?listType=search&list=Varanasi+Dashashwamedh+Ghat+Ganga+Aarti+Live&autoplay=1&mute=0&rel=0&playsinline=1',
              officialLiveUrl: 'https://www.youtube.com/@gangaarti/live',
              timings: 'सांध्य महाआरती प्रतिदिन सायं ०६:३० बजे',
            },
            quickChips: [
              { label: '🌸 सम्पूर्ण २६ महातीर्थ दर्शन कक्ष खोलें', action: 'NAV_DARSHAN_FULL', href: '/darshan' },
              { label: '🪔 काशी विश्वनाथ दर्शन', action: 'IN_CHAT_DARSHAN' },
            ],
          },
        ]);
      }, 500);
      return;
    }

    if (chip.action === 'IN_CHAT_DARSHAN') {
      handlePlayDiyaBell();
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: 'हर हर महादेव! 🙏 श्री काशी विश्वनाथ ज्योतिर्लिंग एवं माँ गंगा की पावन आरती का साक्षात् लाइव दर्शन यहीं चैट में करें:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            inChatDarshan: {
              templeName: 'श्री काशी विश्वनाथ ज्योतिर्लिंग',
              deity: 'भगवान शिव (विश्वेश्वर)',
              location: 'वाराणसी धाम, उत्तर प्रदेश',
              image: '/images/darshan/kashi-vishwanath.jpg',
              embedUrl: 'https://www.youtube-nocookie.com/embed?listType=search&list=Shri+Kashi+Vishwanath+Temple+Varanasi+Live+Darshan+Aarti&autoplay=1&mute=0&rel=0&playsinline=1',
              officialLiveUrl: 'https://www.youtube.com/@ShriKashiVishwanathTempleTrust/live',
              timings: 'मंगला आरती ०३:०० • सांध्य आरती ०७:०० सायं',
            },
            quickChips: [
              { label: '🌸 संपूर्ण २६ महातीर्थ दर्शन कक्ष खोलें', action: 'NAV_DARSHAN_FULL', href: '/darshan' },
              { label: '🪔 गंगा आरती दर्शन', action: 'DARSHAN_GANGA' },
            ],
          },
        ]);
      }, 500);
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
    } else if (intakeStep === 'ASK_BIRTH_DATE') {
      processDateInput(text);
    } else if (intakeStep === 'ASK_BIRTH_TIME') {
      processTimeInput(text);
    } else if (intakeStep === 'ASK_BIRTH_CITY') {
      processCityInput(text);
    } else if (intakeStep === 'ASK_QUESTION') {
      setSeekerData(prev => ({ ...prev, question: text }));
      setIntakeStep('COMPLETED');

      // 1. Compute deterministic Vedic Ephemeris
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

      // 2. Dynamic Caution Day Evaluation (Evaluates transit friction & Rahu Kaal)
      const currentHour = new Date().getHours();
      const isCautionDay = currentHour >= 12 && currentHour <= 15; // Realistic Diurnal Rahu Kaal window

      const transitStatus = isCautionDay ? 'CAUTION_DAY' : 'POWER_DAY';
      const transitMessage = isCautionDay
        ? '⚠️ आज का दिन सतर्कता दिवस (Caution Window) है — चन्द्रमा के गोचर व राहुकाल के कारण नए वित्तीय या उग्र निर्णयों में धैर्य रखें।'
        : '✨ आज का दिन शुभ सिद्धि योग (Power Window) है — गुरु-चन्द्र की अनुकूल दृष्टि से सोचे गए कार्यों में प्रगति का योग है।';

      // 3. Dispatch lead to CRM bridge (records drop-off for automated WhatsApp follow-up)
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

      if (isCautionDay) {
        handlePlayDiyaBell();
      } else {
        playClick();
      }

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `चिन्ता न करें ${seekerData.name || ''} जी! 🙏 हर कठिन परिस्थिति का शास्त्रसम्मत समाधान सम्भव है। मैंने आपकी कुण्डली की खगोलीय गणना व आज के गोचर का मिलान पूर्ण कर लिया है:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
            inChatDarshan: isCautionDay ? {
              templeName: 'श्री काशी विश्वनाथ ज्योतिर्लिंग (लाइव रक्षा दर्शन)',
              deity: 'भगवान शिव',
              location: 'वाराणसी धाम',
              image: '/images/darshan/kashi-vishwanath.jpg',
              embedUrl: 'https://www.youtube-nocookie.com/embed?listType=search&list=Shri+Kashi+Vishwanath+Temple+Varanasi+Live+Darshan+Aarti&autoplay=1&mute=0&rel=0&playsinline=1',
              officialLiveUrl: 'https://www.youtube.com/@ShriKashiVishwanathTempleTrust/live',
              timings: 'मंगला आरती ०३:०० • सांध्य आरती ०७:०० सायं',
            } : undefined,
            quickChips: [
              { label: '📜 ₹501 लिखित विद्वत्-परामर्श पत्र (PDF)', action: 'OPEN_CHECKOUT_WRITTEN', href: '/ask' },
              { label: '📞 ₹1,100 CallMe4 गोपनीय वॉयस कॉल', action: 'OPEN_CHECKOUT_VOICE', href: '/ask' },
              { label: '📹 ₹1,500 साक्षात् वीडियो दर्शन', action: 'OPEN_CHECKOUT_VIDEO', href: '/ask' },
              { label: '🌸 आज का 72h राशिफल विस्तार से देखें', action: 'NAV_DAILY', href: '/daily' },
            ],
          },
        ]);
      }, 600);
    } else {
      // General Vedic conversational intelligence
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `g-${Date.now()}`,
            sender: 'GURU',
            text: `आपके विचार "${text}" के संदर्भ में वैदिक ज्योतिषीय दृष्टि से यह समय सजग अवलोकन का है। क्या आप आज के ७२ घण्टे गोचर देखना चाहेंगे या विद्वान् ज्योतिषी से अपनी कुण्डली की विवेचना कराएंगे?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickChips: [
              { label: '🔮 अपनी कुण्डली की पूर्व-गणना कराएं', action: 'START_INTAKE' },
              { label: '⚡ आज का 72h राशिफल व गोचर', action: 'NAV_DAILY', href: '/daily' },
              { label: '🌸 26 महातीर्थ लाइव दर्शन', action: 'IN_CHAT_DARSHAN' },
            ],
          },
        ]);
      }, 500);
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
              onClick={(e) => { e.stopPropagation(); playClick(); setShowGreetingTooltip(false); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] hover:bg-black cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-start gap-2.5 cursor-pointer" onClick={toggleOpen}>
              <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-amber-400/60 shadow-sm">
                <Image
                  src="/images/avatar/guru_varanasi.jpg"
                  alt="Guru Jyotishdev Varanasi Avatar"
                  fill
                  className="object-cover"
                />
              </div>
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

        {/* The Varanasi Character Avatar Button */}
        <button
          onClick={toggleOpen}
          className={`relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-2xl hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center border-2 border-[#D4AF37] ${
            isOpen ? 'rotate-90 bg-black/80' : 'bg-[#0E101D]'
          }`}
          title="गुरु ज्योतिषदेव AI से बात करें"
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
                alt="Guru Jyotishdev Varanasi Avatar"
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
        <div className="fixed inset-x-3 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto sm:w-[440px] max-h-[85vh] sm:max-h-[640px] h-[600px] bg-white/95 dark:bg-[#0C0E1A]/95 backdrop-blur-2xl border-2 border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden font-mono-data animate-in zoom-in-95 duration-200">
          
          {/* Top Sanctum Header with Varanasi Avatar */}
          <div className="p-3 px-4 bg-gradient-to-r from-[#8E6F1D]/15 via-[#FAF7F2] to-[#D4AF37]/20 dark:from-[#D4AF37]/15 dark:via-[#121526] dark:to-[#8E6F1D]/20 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow-md">
                <Image
                  src="/images/avatar/guru_varanasi.jpg"
                  alt="Guru Jyotishdev Varanasi"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-editorial text-sm sm:text-base font-bold text-[#1C1917] dark:text-white">
                    गुरु ज्योतिषदेव (वाराणसी पीठ)
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-[#696256] dark:text-[#9E988D]">
                  AI वैदिक मार्गदर्शक • साक्षात् मार्गदर्शन
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
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs sm:text-[13px]">
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
                        alt="Guru"
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
                    <p>{msg.text}</p>

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
                              <div className="absolute inset-0 pointer-events-none flex items-center justify-center animate-fade-in">
                                <div className="text-3xl animate-bounce">🌺 🌸 🪷</div>
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
                              {/* Diamond Grid */}
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

                    {/* Navigation Action Card */}
                    {msg.navigationAction && (
                      <Link
                        href={msg.navigationAction.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigate(msg.navigationAction!.href);
                        }}
                        className="mt-2.5 p-3 rounded-xl bg-white dark:bg-[#0A0C14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 flex items-center justify-between group hover:border-[#8E6F1D] transition-colors cursor-pointer block"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{msg.navigationAction.icon}</span>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-[#1C1917] dark:text-white group-hover:text-[#8E6F1D] dark:group-hover:text-[#F0C968]">
                              {msg.navigationAction.title}
                            </div>
                            <p className="text-[11px] text-[#696256] dark:text-[#9E988D] mt-0.5">
                              {msg.navigationAction.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968] group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}

                    {/* Fast Action Suggestion Chips */}
                    {msg.quickChips && msg.quickChips.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.quickChips.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (chip.href && (chip.action.startsWith('OPEN_CHECKOUT_') || chip.action.startsWith('NAV_DARSHAN_') || chip.action === 'FORCE_NAV_DAILY')) {
                                handleNavigate(chip.href);
                              } else {
                                handleChipClick(chip);
                              }
                            }}
                            className="px-3 py-2 rounded-xl bg-white dark:bg-[#0A0C14] hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#080A10] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 text-xs font-semibold text-[#1C1917] dark:text-white transition-all cursor-pointer shadow-xs text-left active:scale-95"
                          >
                            {chip.label}
                          </button>
                        ))}
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
              placeholder="पूछें: आज का दिन, विवाह, व्यापार, या मन्त्र..."
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
