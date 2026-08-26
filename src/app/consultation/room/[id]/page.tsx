'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Send, 
  Lock, 
  User, 
  Layers, 
  Flame, 
  ChevronRight, 
  ArrowLeft, 
  PlusCircle, 
  Download,
  ShoppingBag,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';

interface ChatMessage {
  id: string;
  sender: 'DEVOTEE' | 'PANDIT' | 'SYSTEM';
  text: string;
  timestamp: string;
  upayaProduct?: {
    name: string;
    price: number;
    url: string;
  };
}

export default function EncryptedConsultationRoom() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const caseId = (params?.id as string) || 'CT-2026-0825-001';
  const initialMode = (searchParams?.get('mode') as 'voice' | 'video' | 'chat') || 'voice';
  const userRole = (searchParams?.get('role') as 'devotee' | 'pandit') || 'devotee';

  const [activeMode, setActiveMode] = useState<'voice' | 'video' | 'chat'>(initialMode);
  const [callStatus, setCallStatus] = useState<'CONNECTING' | 'CONNECTED' | 'ENDED'>('CONNECTING');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(activeMode === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [timeRemainingSec, setTimeRemainingSec] = useState(15 * 60); // 15 minutes session
  const [showKundaliDrawer, setShowKundaliDrawer] = useState(true);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'sys-1',
      sender: 'SYSTEM',
      text: '🔒 256-Bit DTLS-SRTP End-to-End Encrypted Room initialized. Real phone numbers are masked on both ends.',
      timestamp: '10:00 AM'
    },
    {
      id: 'p-1',
      sender: 'PANDIT',
      text: 'प्रणाम! 🙏 मैंने आपकी कुण्डली की खगोलीय स्थिति (वृषभ लग्न, रोहिणी नक्षत्र, चन्द्र-गुरु दशा) का पूर्व-अवलोकन कर लिया है। आपका स्वागत है।',
      timestamp: '10:01 AM'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto connect simulation
  useEffect(() => {
    const t = setTimeout(() => {
      setCallStatus('CONNECTED');
      chitiSensory.playBell();
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (callStatus !== 'CONNECTED') return;

    const interval = setInterval(() => {
      setTimeRemainingSec(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCallStatus('ENDED');
          return 0;
        }
        if (prev === 60) {
          chitiSensory.playBell(); // 1 minute warning chime
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [callStatus]);

  // Scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    chitiSensory.playTick();
    setCallStatus('ENDED');
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim()) return;

    chitiSensory.playTick();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: userRole === 'pandit' ? 'PANDIT' : 'DEVOTEE',
      text: inputMsg.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, newMsg]);
    setInputMsg('');

    // If devotee sends message, simulate Pandit reply with prescribed samagri
    if (userRole === 'devotee') {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: `p-reply-${Date.now()}`,
            sender: 'PANDIT',
            text: 'आपकी चन्द्र-गुरु युति में राहु दोष निवारण हेतु शुद्ध भीमसेनी कपूर एवं तांबे के श्रीयन्त्र का दैनिक पूजन अत्यंत फलदायी रहेगा। मैंने आपके लिए उपयुक्त सामग्री जोड़ दी है:',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            upayaProduct: {
              name: 'प्राकृतिक भीमसेनी कपूर (100g) + शुद्ध A2 गाय घी दिया',
              price: 349,
              url: '/store'
            }
          }
        ]);
      }, 2000);
    }
  };

  return (
    <CosmicTantraShell shellMode="minimal" footerMode="none">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 h-[calc(100vh-80px)] flex flex-col font-mono-data">
        
        {/* PRIVACY & SECURITY TOP BAR */}
        <div className="p-3 sm:px-5 bg-white dark:bg-[#0A0C14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0 mb-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-[#696256] dark:text-[#9E988D] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-[#1C1917] dark:text-white">
                  परामर्श कक्ष • Case #{caseId}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  <Lock className="w-2.5 h-2.5" />
                  <span>256-BIT E2EE (CALLME4 MASKED)</span>
                </span>
              </div>
              <p className="text-[11px] text-[#696256] dark:text-[#9E988D] hidden sm:block">
                पंडित विद्यानंद शास्त्री (काशी हिन्दू विश्वविद्यालय) • शून्य फोन नम्बर प्रकटीकरण
              </p>
            </div>
          </div>

          {/* Session Timer & Extender */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              timeRemainingSec < 120
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 animate-pulse'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{callStatus === 'CONNECTED' ? formatTimer(timeRemainingSec) : 'Connecting...'}</span>
            </div>

            <button
              onClick={() => {
                chitiSensory.playTick();
                setTimeRemainingSec(prev => prev + 600); // Add 10 mins
                alert('Session extended by +10 minutes (₹500 added to folio).');
              }}
              className="px-3 py-1.5 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center gap-1 hover:scale-102 transition-transform cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+10 Min (₹500)</span>
            </button>
          </div>
        </div>

        {/* MAIN SPLIT STAGE: Left Media Stream + Right Synchronized Kundali & Chat */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
          
          {/* LEFT: INTERACTIVE CALL / VIDEO / AUDIO STAGE (7 COLS) */}
          <div className="lg:col-span-7 bg-[#07080D] border border-black/10 dark:border-white/10 rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            
            {/* Ambient Spiritual Aura Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#8E6F1D]/10 via-transparent to-black/60 pointer-events-none" />

            {/* Top Mode Selector Tabs */}
            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl">
                <button
                  onClick={() => { chitiSensory.playTick(); setActiveMode('voice'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMode === 'voice' ? 'bg-[#8E6F1D] text-white shadow-md' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Voice Call</span>
                </button>

                <button
                  onClick={() => { chitiSensory.playTick(); setActiveMode('video'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMode === 'video' ? 'bg-indigo-600 text-white shadow-md' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Darshan</span>
                </button>
              </div>

              <button
                onClick={() => setShowKundaliDrawer(!showKundaliDrawer)}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-white/20 transition-colors lg:hidden"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>{showKundaliDrawer ? 'Hide Kundali' : 'View Kundali'}</span>
              </button>
            </div>

            {/* MIDDLE: STAGE CANVAS */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-4">
              
              {activeMode === 'voice' ? (
                // === 1. MASKED VOICE CALL INTERFACE ===
                <div className="text-center space-y-6 animate-in zoom-in-95">
                  <div className="relative mx-auto">
                    {/* Pulsing Audio Ring */}
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#8E6F1D] to-[#D4AF37] flex items-center justify-center text-white text-3xl sm:text-4xl shadow-2xl animate-pulse">
                      🕉️
                    </div>
                    <div className="absolute -inset-3 rounded-full border border-amber-400/30 animate-ping" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-bold font-editorial text-white">
                      पंडित विद्यानंद शास्त्री (वाराणसी)
                    </h3>
                    <p className="text-xs text-amber-300/80">
                      {callStatus === 'CONNECTED' ? '🎙️ साक्षात् गोपनीय संवाद गतिमान (E2EE Active)' : 'कॉल जोड़ी जा रही है...'}
                    </p>
                  </div>

                  {/* Audio Waveform Simulator */}
                  <div className="flex items-center justify-center gap-1 h-10">
                    {[40, 65, 80, 45, 90, 100, 70, 85, 60, 95, 50, 75, 90, 60, 40].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${callStatus === 'CONNECTED' ? h : 15}%` }}
                        className="w-1.5 bg-gradient-to-t from-amber-500 to-amber-200 rounded-full transition-all duration-150"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                // === 2. HD VIDEO DARSHAN INTERFACE ===
                <div className="w-full h-full rounded-2xl overflow-hidden relative border border-white/10 bg-[#0F111A] flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-24 h-24 rounded-full bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-3xl mx-auto text-white">
                      🪔
                    </div>
                    <div className="text-white font-bold text-sm">पंडित विद्यानंद शास्त्री (Kashi Sanctum)</div>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                      HD Video Darshan Stream Active
                    </span>
                  </div>

                  {/* Devotee PiP Window */}
                  <div className="absolute bottom-4 right-4 w-28 h-36 rounded-xl bg-black/80 border border-white/20 p-2 flex flex-col items-center justify-center text-center shadow-lg">
                    <User className="w-6 h-6 text-white/60 mb-1" />
                    <span className="text-[10px] text-white/80 font-bold">आप (Devotee)</span>
                    <span className="text-[9px] text-emerald-400">Camera On</span>
                  </div>
                </div>
              )}

            </div>

            {/* BOTTOM CALL CONTROLS DOCK */}
            <div className="relative z-10 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center gap-4 sm:gap-6">
              {/* Mic Mute */}
              <button
                onClick={() => { chitiSensory.playTick(); setIsMuted(!isMuted); }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  isMuted ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle */}
              <button
                onClick={() => { chitiSensory.playTick(); setIsVideoOn(!isVideoOn); setActiveMode(isVideoOn ? 'voice' : 'video'); }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  !isVideoOn ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                }`}
                title={isVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Speaker Toggle */}
              <button
                onClick={() => { chitiSensory.playTick(); setIsSpeakerOn(!isSpeakerOn); }}
                className="p-3.5 rounded-2xl border bg-white/10 border-white/15 text-white hover:bg-white/20 transition-all cursor-pointer active:scale-95"
                title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-white/50" />}
              </button>

              {/* End Call Action */}
              <button
                onClick={handleEndCall}
                className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>कॉल समाप्त (End)</span>
              </button>
            </div>

          </div>

          {/* RIGHT: SYNCHRONIZED KUNDALI CANVAS + ENCRYPTED CHAT (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-3 h-full min-h-0">
            
            {/* 1. SYNCHRONIZED KUNDALI & PRE-CONTEXT DOSSIER ACCORDION */}
            {showKundaliDrawer && (
              <div className="bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-3xl p-4 shadow-md space-y-3 shrink-0">
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                  <span className="font-bold text-xs text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>लाइव कुण्डली व पूर्व-विवेचना (Dossier)</span>
                  </span>
                  <span className="text-[10px] text-[#696256] dark:text-[#9E988D]">
                    100% Synced
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">लग्न</span>
                    <strong className="text-[#1C1917] dark:text-white">वृषभ (Taurus)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">नक्षत्र</span>
                    <strong className="text-[#1C1917] dark:text-white">रोहिणी (प २)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">दशा</span>
                    <strong className="text-[#8E6F1D] dark:text-[#F0C968]">चन्द्र • गुरु</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-[#78350F] dark:text-[#FDE68A] leading-tight">
                  <strong>मुख्य प्रश्न: </strong> "व्यापार में नया निवेश व विस्तार हेतु शुभ समय क्या रहेगा?"
                </div>
              </div>
            )}

            {/* 2. REAL-TIME ENCRYPTED CHAT THREAD */}
            <div className="flex-1 bg-white dark:bg-[#0E101D] border border-black/10 dark:border-white/10 rounded-3xl flex flex-col shadow-md overflow-hidden min-h-0">
              
              <div className="p-3 bg-[#FAF7F2] dark:bg-[#121522] border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                <span className="font-bold text-xs text-[#1C1917] dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                  <span>गोपनीय संवाद (E2EE Chat)</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ● Real-time
                </span>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                {chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === 'DEVOTEE' ? 'items-end' : m.sender === 'PANDIT' ? 'items-start' : 'items-center'
                    }`}
                  >
                    {m.sender === 'SYSTEM' ? (
                      <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[10px] text-[#696256] dark:text-[#9E988D] text-center max-w-[90%]">
                        {m.text}
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                          m.sender === 'DEVOTEE'
                            ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] rounded-br-xs'
                            : 'bg-[#FAF7F2] dark:bg-[#151828] border border-black/10 dark:border-white/10 text-[#1C1917] dark:text-white rounded-bl-xs'
                        }`}
                      >
                        <div className="font-bold text-[10px] opacity-75 mb-0.5">
                          {m.sender === 'PANDIT' ? 'पंडित विद्यानंद शास्त्री' : 'आप'}
                        </div>
                        <p>{m.text}</p>

                        {/* Prescribed Samagri Card */}
                        {m.upayaProduct && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-[#0A0C14] border border-amber-500/30 space-y-1.5 text-left">
                            <div className="flex items-center justify-between font-bold text-[11px] text-[#1C1917] dark:text-white">
                              <span className="flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3 text-amber-500" />
                                <span>{m.upayaProduct.name}</span>
                              </span>
                              <span className="text-amber-600 dark:text-amber-400">₹{m.upayaProduct.price}</span>
                            </div>
                            <Link
                              href={m.upayaProduct.url}
                              target="_blank"
                              className="block w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg text-center shadow-xs"
                            >
                              पूजा स्टोर से सीधे मंगवाएं (Express Delivery) →
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                    <span className="text-[9px] text-[#696256] dark:text-[#9E988D] mt-0.5 px-2">
                      {m.timestamp}
                    </span>
                  </div>
                ))}
                <div ref={chatScrollRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-2.5 bg-[#FAF7F2] dark:bg-[#121522] border-t border-black/10 dark:border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="संदेश लिखें या प्रश्न पूछें..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white focus:outline-none focus:border-[#8E6F1D]"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim()}
                  className="p-2 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>

          </div>

        </div>

      </div>
    </CosmicTantraShell>
  );
}
