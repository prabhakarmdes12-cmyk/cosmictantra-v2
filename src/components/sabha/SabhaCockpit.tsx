'use client';

import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Globe, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Award,
  Activity
} from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';
import { ConsultationSession, TransportChannel } from '@/lib/sabha/types';
import { dispatchChartEvent, saveConsultationRecord } from '@/lib/sabha/orchestrator';
import { SabhaTimerEngine } from '@/lib/sabha/timer';

interface SabhaCockpitProps {
  session: ConsultationSession;
  role: 'SCHOLAR' | 'DEVOTEE';
  onComplete?: (session: ConsultationSession) => void;
}

export default function SabhaCockpit({ session, role, onComplete }: SabhaCockpitProps) {
  const [currentSession, setCurrentSession] = useState<ConsultationSession>(session);
  const [activeChannel, setActiveChannel] = useState<TransportChannel>(session.transportChannel);
  const [focusedBhava, setFocusedBhava] = useState<number | null>(session.currentChartFocus?.bhavaNumber || 10);
  const [focusedPlanet, setFocusedPlanet] = useState<string | null>(session.currentChartFocus?.planet || 'JUPITER');
  const [scholarNoteInput, setScholarNoteInput] = useState<string>(session.scholarRecord?.finalInterpretation || '');
  const [prescribedUpayas, setPrescribedUpayas] = useState<string[]>(session.scholarRecord?.prescribedUpayas || []);
  const [recommendedWindow, setRecommendedWindow] = useState<string>(session.scholarRecord?.recommendedMuhuratWindow || '२७ नवम्बर – १५ दिसम्बर २०२६');
  const [isRecordAudioConsent, setIsRecordAudioConsent] = useState<boolean>(session.consent?.optionalRecording || false);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(session.state === 'COMPLETED');
  const [showPstnNotice, setShowPstnNotice] = useState<boolean>(false);
  const [timerState, setTimerState] = useState(() => SabhaTimerEngine.computeTimerState(session));

  // Server-authoritative timer interval
  useEffect(() => {
    if (isSessionComplete) return;
    const interval = setInterval(() => {
      const state = SabhaTimerEngine.computeTimerState(currentSession);
      setTimerState(state);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession, isSessionComplete]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Broadcast chart event
  const handleFocusBhava = (bhavaNum: number) => {
    chitiSensory.playTick();
    setFocusedBhava(bhavaNum);
    dispatchChartEvent(currentSession.sessionId, {
      type: 'BHAVA_FOCUS',
      target: { bhavaNumber: bhavaNum }
    });
  };

  const handleFocusPlanet = (planet: string) => {
    chitiSensory.playTick();
    setFocusedPlanet(planet);
    dispatchChartEvent(currentSession.sessionId, {
      type: 'PLANET_FOCUS',
      target: { planet }
    });
  };

  const handleAddUpaya = (upaya: string) => {
    chitiSensory.playTick();
    if (!prescribedUpayas.includes(upaya)) {
      const updated = [...prescribedUpayas, upaya];
      setPrescribedUpayas(updated);
      currentSession.scholarRecord.prescribedUpayas = updated;
      saveConsultationRecord(currentSession);
    }
  };

  const handleSwitchToPstn = () => {
    chitiSensory.playTick();
    setActiveChannel('PSTN_PHONE');
    setShowPstnNotice(true);
    setCurrentSession(prev => ({
      ...prev,
      transportChannel: 'PSTN_PHONE',
      activeTransport: 'PSTN_PHONE'
    }));
  };

  const handleExtendTenMinutes = () => {
    chitiSensory.playTick();
    setCurrentSession(prev => {
      const updated = { ...prev, extensionSeconds: (prev.extensionSeconds || 0) + 600 };
      saveConsultationRecord(updated);
      return updated;
    });
  };

  const handleFinalApprove = () => {
    chitiSensory.playTick();
    const updated: ConsultationSession = {
      ...currentSession,
      state: 'COMPLETED',
      endedAt: Date.now(),
      scholarRecord: {
        ...currentSession.scholarRecord,
        finalInterpretation: scholarNoteInput,
        prescribedUpayas,
        recommendedMuhuratWindow: recommendedWindow,
        approvedAt: Date.now()
      },
      consent: {
        ...currentSession.consent,
        optionalRecording: isRecordAudioConsent
      }
    };
    setCurrentSession(updated);
    saveConsultationRecord(updated);
    setIsSessionComplete(true);
    if (onComplete) onComplete(updated);
  };

  const timerWarning = timerState.remainingSeconds <= 120 && timerState.remainingSeconds > 30;
  const timerConcluding = timerState.remainingSeconds <= 30 && timerState.remainingSeconds > 0;
  const timerGrace = timerState.isGracePeriod;

  return (
    <div className="w-full max-w-7xl mx-auto rounded-3xl bg-[#FAF7F2] dark:bg-[#07080C] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 shadow-2xl overflow-hidden font-mono-data text-[#1C1917] dark:text-[#FAF7F2]">
      
      {/* 1. TOP HEADER & TELEMETRY BAR */}
      <div className="p-4 sm:p-5 border-b border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Session ID & Seeker Identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 flex items-center justify-center text-[#8E6F1D] dark:text-[#F0C968] shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">
                {currentSession.beneficiary.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-bold">
                {currentSession.profile.cosmicId}
              </span>
              {currentSession.payer.id !== currentSession.beneficiary.id && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 text-[9px] font-bold hidden sm:inline">
                  परिवार सहायता: {currentSession.payer.name}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#857E74] dark:text-[#A8A29E] mt-0.5">
              विषय: <span className="font-bold text-[#1C1917] dark:text-[#EFECE6]">{currentSession.question}</span> • दक्षिणा: ₹{currentSession.payment.amountInr}
            </div>
          </div>
        </div>

        {/* Center: Live Server-Authoritative Timer */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${
            timerGrace 
              ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
              : timerConcluding 
              ? 'bg-amber-500/20 border-amber-500 text-amber-500 animate-pulse'
              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-[#8E6F1D] dark:text-[#F0C968]'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm sm:text-base font-bold tracking-wider">
              {formatTimer(timerState.remainingSeconds)}
            </span>
          </div>

          {timerState.remainingSeconds <= 300 && !isSessionComplete && (
            <button
              onClick={handleExtendTenMinutes}
              className="px-3 py-2 rounded-2xl bg-[#8E6F1D] hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              +१० मिनट जोड़ें
            </button>
          )}
        </div>

        {/* Right: Active Transport Mode & PSTN Fallback */}
        <div className="flex items-center gap-2">
          {activeChannel === 'WEB_RTC' ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold">
                <Globe className="w-3.5 h-3.5" />
                <span>Web Sabha (WebRTC)</span>
              </span>
              <button
                onClick={handleSwitchToPstn}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:border-amber-500 text-[11px] text-[#857E74] hover:text-amber-500 transition-all cursor-pointer"
                title="कमज़ोर इंटरनेट होने पर सामान्य फ़ोन कॉल पर स्विच करें"
              >
                <Phone className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline">फ़ोन कॉल पर स्विच</span>
              </button>
            </div>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold">
              <Phone className="w-3.5 h-3.5" />
              <span>Phone Sabha (Exotel Masked PSTN)</span>
            </span>
          )}

          {/* Privacy Consent Tag */}
          <div className="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[10px] text-[#857E74] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>रिकॉर्डिंग: बन्द (गोपनीय)</span>
          </div>
        </div>

      </div>

      {/* 2. PSTN ALERT NOTICE */}
      {showPstnNotice && (
        <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-3 px-6">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>
              <strong>सामान्य फ़ोन कॉल सक्रिय:</strong> पंडित जी का कॉल आपके पंजीकृत मोबाइल ({currentSession.beneficiary.phoneMasked}) पर सुरक्षित वर्चुअल नम्बर से आ रहा है।
            </span>
          </div>
          <button onClick={() => setShowPstnNotice(false)} className="text-xs font-bold underline">
            समझ गए
          </button>
        </div>
      )}

      {/* 3. MAIN COCKPIT BODY */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Interactive Kundali & Semantic Chart Sync (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-editorial text-sm font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                जन्म कुण्डली व भाव संरेखण (Live Sync)
              </span>
              <span className="text-[10px] text-[#857E74]">
                लग्न: {currentSession.evidence.lagnaSign}
              </span>
            </div>

            {/* Clickable Bhavas */}
            <div className="relative w-full aspect-square max-w-[320px] mx-auto border-2 border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 rounded-2xl p-2 bg-[#FAF7F2] dark:bg-[#0E1017] shadow-inner grid grid-cols-3 grid-rows-3 gap-1 text-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].slice(0, 9).map((bNum) => {
                const isFocused = focusedBhava === bNum;
                return (
                  <button
                    key={bNum}
                    onClick={() => handleFocusBhava(bNum)}
                    className={`p-1 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isFocused
                        ? 'bg-[#8E6F1D]/20 dark:bg-[#D4AF37]/30 border-[#8E6F1D] dark:border-[#D4AF37] shadow-md scale-105'
                        : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:border-[#8E6F1D]/40'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                      {bNum}म भाव
                    </span>
                    <span className="text-[9px] text-[#857E74] dark:text-[#A8A29E]">
                      {bNum === 10 ? 'गुरु • कर्म' : bNum === 1 ? 'लग्न' : bNum === 7 ? 'सप्तम' : 'गृह'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Planet Selection Strip */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-1 text-[10px]">
              <span className="text-[#857E74] shrink-0">ग्रह संरेखण:</span>
              {['SUN', 'MOON', 'MARS', 'JUPITER', 'VENUS', 'SATURN', 'RAHU'].map(p => (
                <button
                  key={p}
                  onClick={() => handleFocusPlanet(p)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    focusedPlanet === p
                      ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black shadow-xs'
                      : 'bg-black/5 dark:bg-white/5 text-[#857E74]'
                  }`}
                >
                  {p === 'JUPITER' ? 'गुरु' : p === 'MOON' ? 'चन्द्र' : p === 'SUN' ? 'सूर्य' : p}
                </button>
              ))}
            </div>

            {/* Dasha & Transit Status */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
              <div className="flex justify-between font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                <span>सक्रिय दशा:</span>
                <span>{currentSession.evidence.vimshottariDasha.mahadasha} महादशा • {currentSession.evidence.vimshottariDasha.antardasha} अन्तर्दशा</span>
              </div>
              <div className="text-[10.5px] text-[#57524A] dark:text-[#D1C9BF]">
                ✦ गोचर: गुरु गोचर १०म भाव (कर्म क्षेत्र)
              </div>
            </div>

          </div>
        </div>

        {/* CENTER COLUMN: AI Copilot Evidence Sidecar (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3 shadow-sm h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>AI को-पायलट साक्ष्य (Scholar Copilot)</span>
              </div>
              <p className="text-[11px] text-[#857E74] leading-relaxed">
                पंडित जी के अवलोकनार्थ खगोलीय साक्ष्य (निर्णय पूर्णतः पंडित जी का है):
              </p>

              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] space-y-1.5 text-[#57524A] dark:text-[#D1C9BF]">
                <div>• गुरु अन्तर्दशा प्रारम्भ: <strong>२७ नवम्बर २०२६</strong></div>
                <div>• १०वें भाव पर गुरु गोचर की शुभ दृष्टि</div>
                <div>• जातक प्रश्न: {currentSession.question}</div>
              </div>
            </div>

            {/* Quick Note Action */}
            <button
              onClick={() => {
                chitiSensory.playTick();
                setScholarNoteInput((prev: string) => prev + '\n• गुरु अन्तर्दशा में व्यापार विस्तार अनुकूल।');
              }}
              className="w-full py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#8E6F1D]/15 text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] transition-colors cursor-pointer"
            >
              + साक्ष्य को नोट्स में जोड़ें
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Scholar Notes & Prescription Suite (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-editorial text-sm font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                पंडित जी की लिखित विवेचना (Folio Notes)
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                अक्षुण्ण अभिलेख
              </span>
            </div>

            <textarea
              value={scholarNoteInput}
              onChange={(e) => setScholarNoteInput(e.target.value)}
              placeholder="परामर्श के मुख्य निष्कर्ष, सलाह और दिशा निर्देश लिखें..."
              rows={4}
              className="w-full p-3 rounded-xl bg-black/[0.02] dark:bg-black/40 border border-black/10 dark:border-white/10 text-xs font-mono-data focus:outline-none focus:border-[#8E6F1D] transition-all leading-relaxed"
            />

            {/* Upaya Selection */}
            <div>
              <span className="text-[11px] font-bold text-[#857E74] block mb-1.5">
                विहित शास्त्रसम्मत उपाय (+1 Click Add):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'भीमसेनी कपूर नित्य सांध्य आरती',
                  'गुरुवार गौ-सेवा व चने की दाल दान',
                  'महामृत्युंजय मन्त्र १०८ जप',
                  'श्री सूक्त पाठ'
                ].map((u) => (
                  <button
                    key={u}
                    onClick={() => handleAddUpaya(u)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      prescribedUpayas.includes(u)
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 font-bold'
                        : 'bg-black/5 dark:bg-white/5 border-black/5 text-[#857E74] hover:border-amber-500'
                    }`}
                  >
                    + {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommended Muhurat Window */}
            <div>
              <span className="text-[11px] font-bold text-[#857E74] block mb-1">
                आगामी शुभ मुहूर्त / अनुवर्ती काल:
              </span>
              <input
                type="text"
                value={recommendedWindow}
                onChange={(e) => setRecommendedWindow(e.target.value)}
                className="w-full p-2 rounded-xl bg-black/[0.02] dark:bg-black/40 border border-black/10 dark:border-white/10 text-xs font-mono-data focus:outline-none focus:border-[#8E6F1D]"
              />
            </div>

            {/* Final Approve & Deliver Button */}
            <button
              onClick={handleFinalApprove}
              disabled={isSessionComplete}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] hover:opacity-90 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSessionComplete ? 'परामर्श अभिलेख स्वीकृत एवं प्रेषित' : 'परामर्श पूर्ण करें व भक्त वॉल्ट में भेजें'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
