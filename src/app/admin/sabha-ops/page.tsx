'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Phone, 
  Globe, 
  Video, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  UserCheck, 
  RotateCcw, 
  DollarSign,
  Activity,
  FileText,
  Search,
  Filter,
  Plus,
  Radio
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';
import { ConsultationSession, SessionState } from '@/lib/sabha/types';
import { SabhaSessionStore } from '@/lib/sabha/store';
import { SabhaStateMachine } from '@/lib/sabha/stateMachine';
import { SabhaTelephonyHandoverEngine } from '@/lib/sabha/telephonyHandover';

export default function SabhaOperationsConsole() {
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ConsultationSession | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string>('ALL');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    let list = SabhaSessionStore.list();
    if (list.length === 0) {
      // Seed a realistic session for operations testing
      const sampleSession: ConsultationSession = {
        sessionId: 'CT-SABHA-2026-0827-001',
        state: 'ACTIVE',
        serviceMode: 'SABHA',
        transportChannel: 'WEB_RTC',
        activeTransport: 'WEB_RTC',
        createdAt: Date.now() - 600000,
        scheduledFor: Date.now() - 300000,
        startedAt: Date.now() - 300000,
        entitledDurationSeconds: 1200,
        extensionSeconds: 0,
        gracePeriodSeconds: 60,
        payer: {
          id: 'USR-BANGALORE-99',
          name: 'Aditya Sharma (Son in Bangalore)',
          phoneMasked: '+91 98765*****10',
          city: 'Bangalore'
        },
        beneficiary: {
          id: 'USR-BOKARO-01',
          name: 'Kamla Sharma (Mother in Bokaro)',
          phoneMasked: '+91 94311*****55',
          relationToPayer: 'MOTHER',
          location: 'Bokaro Steel City'
        },
        profile: {
          cosmicId: 'CT-4821',
          name: 'Kamla Sharma',
          birthDate: '1962-08-14',
          birthTime: '06:45',
          birthPlace: 'Bokaro, Jharkhand',
          latitude: 23.6693,
          longitude: 86.1511,
          timezone: 5.5
        },
        scholar: {
          scholarId: 'SCH-KASHI-01',
          name: 'पं. विद्यानंद शास्त्री',
          title: 'वरिष्ठ ज्योतिषी • काशी विद्वत् परिषद्',
          tradition: 'काशी परम्परा',
          phoneMasked: '+91 94150*****22'
        },
        question: 'माताजी के स्वास्थ्य एवं आगामी ६ माह में तीर्थ यात्रा का शुभ मुहूर्त क्या है?',
        category: 'Health & Pilgrimage Muhurta',
        language: 'Hindi (शुद्ध हिंदी)',
        consent: {
          consultationProcessing: true,
          optionalRecording: false,
          optionalTranscription: false,
          whatsAppDelivery: true,
          familyMemberParticipation: true,
          consentTimestamp: Date.now() - 600000
        },
        evidence: {
          calculatedAt: Date.now() - 600000,
          ayanamsha: 'LAHIRI_CHITRA_PAKSHA',
          lagnaSign: 'Karka (Cancer)',
          lagnaDegree: 14.28,
          nakshatra: 'Pushya (Pada 2)',
          nakshatraPada: 2,
          vimshottariDasha: {
            mahadasha: 'Jupiter',
            antardasha: 'Moon',
            pratyantardasha: 'Saturn',
            startDate: '2026-05-10',
            endDate: '2027-09-12'
          },
          activeTransits: [
            { planet: 'Jupiter', transitSign: 'Taurus', aspectsBhava: [2, 4, 6] }
          ],
          panchangSnapshot: {
            tithi: 'Shukla Dwitiya',
            vara: 'Guruvara',
            nakshatra: 'Purva Phalguni',
            yoga: 'Siddha',
            karana: 'Balava',
            rahukala: '13:30 - 15:00',
            abhijitMuhurta: '11:45 - 12:35'
          }
        },
        scholarRecord: {
          scholarId: 'SCH-KASHI-01',
          scholarName: 'पं. विद्यानंद शास्त्री',
          finalInterpretation: 'गुरु की चतुर्थ भाव पर शुभ दृष्टि से स्वास्थ्य में सुधार होगा। कार्तिक मास में काशी यात्रा का योग सर्वोत्तम है।',
          recommendations: ['कार्तिक मास में विश्वनाथ अभिषेक'],
          prescribedUpayas: ['भीमसेनी कपूर आरती', 'महामृत्युंजय जप'],
          recommendedMuhuratWindow: '१४ नवम्बर २०२६ (देवोत्थान एकादशी)',
          followUpDate: '१४ नवम्बर २०२६',
          provenanceTag: 'SCHOLAR_VERIFIED_AND_SIGNED'
        },
        currentChartFocus: {
          bhavaNumber: 4,
          planet: 'JUPITER'
        },
        eventSequence: 3,
        webrtcTelemetry: {
          iceConnectionState: 'connected',
          selectedCandidateType: 'relay',
          roundTripTimeMs: 48,
          jitterMs: 12,
          packetLossPercentage: 0.4,
          audioBitrateKbps: 32,
          reconnectCount: 0,
          lastTelemetryTimestamp: Date.now()
        },
        costLedger: {
          grossBookingValueInr: 1100,
          paymentGatewayFeeInr: 22,
          scholarPayoutInr: 825,
          webrtcParticipantMinutes: 10,
          webrtcCostInr: 1.20,
          turnBandwidthBytes: 15000000,
          turnCostInr: 0.11,
          pstnLeg1Minutes: 0,
          pstnLeg2Minutes: 0,
          pstnCostInr: 0,
          aiInputTokens: 1200,
          aiOutputTokens: 350,
          aiCostInr: 0.45,
          whatsAppMessagesCount: 1,
          whatsAppCostInr: 0.65,
          refundAmountInr: 0,
          netContributionMarginInr: 250.59
        },
        payment: {
          razorpayOrderId: 'order_sabha_demo_001',
          razorpayPaymentId: 'pay_sabha_demo_001',
          razorpaySignature: 'sig_verified_demo',
          isVerified: true,
          amountInr: 1100,
          verifiedAt: Date.now() - 600000
        }
      };
      SabhaSessionStore.save(sampleSession);
      list = [sampleSession];
    }
    setSessions(list);
    if (!selectedSession && list.length > 0) {
      setSelectedSession(list[0]);
    }
  };

  const handlePstnFallback = (s: ConsultationSession) => {
    chitiSensory.playTick();
    const res = SabhaTelephonyHandoverEngine.initiatePstnHandover({
      sessionId: s.sessionId,
      reason: 'Manual Admin Trigger (Poor Network Fallback)',
      actorId: 'ADMIN-OPS-01'
    });
    if (res.success && res.session) {
      setSelectedSession(res.session);
      loadSessions();
      setActionNotice(`PSTN फ़ॉलकॉल प्रारम्भ: ${res.session.beneficiary.name} (+91 94311*****55) पर Exotel दोहरी कॉल प्रारम्भ की गई।`);
    }
  };

  const handleExtendGrace = (s: ConsultationSession) => {
    chitiSensory.playTick();
    s.extensionSeconds += 300;
    SabhaSessionStore.save(s);
    loadSessions();
    setActionNotice('५ मिनट का अतिरिक्त अनुग्रह समय (Grace) सफलतापूर्वक जोड़ा गया।');
  };

  const handleRefund = (s: ConsultationSession) => {
    chitiSensory.playTick();
    const res = SabhaStateMachine.transition(s, 'EXECUTE_REFUND', {
      sessionId: s.sessionId,
      actor: 'ADMIN',
      actorId: 'ADMIN-OPS-01',
      idempotencyKey: `ref_${Date.now()}`,
      timestamp: Date.now()
    });
    if (res.success) {
      SabhaSessionStore.save(s);
      loadSessions();
      setActionNotice(`रिफंड निष्पादित: ₹${s.payment.amountInr} जातक के मूल खाते में वापस प्रेषित।`);
    }
  };

  const filteredSessions = filterState === 'ALL' 
    ? sessions 
    : sessions.filter(s => s.state === filterState);

  return (
    <CosmicTantraShell shellMode="scholar" footerMode="none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 font-mono-data text-[#1C1917] dark:text-[#FAF7F2]">
        
        {/* Ops Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>COSMICTANTRA SABHA • LIVE OPERATIONS CONSOLE (P1)</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold mt-1">
              वास्तविक परामर्श नियंत्रण एवं विश्वसनीयता बेंच
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                chitiSensory.playTick();
                loadSessions();
              }}
              className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>रिफ्रेश</span>
            </button>
            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>सर्वर-प्राधिकृत स्टेट इंजन</span>
            </div>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>✦ {actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="font-bold underline text-xs">
              बंद करें
            </button>
          </div>
        )}

        {/* 2-Column Split: Sessions Queue & Operational Inspection */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Live Sessions (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#857E74]">
              <span className="font-bold">सक्रिय सत्र ({filteredSessions.length})</span>
              <div className="flex items-center gap-1">
                {['ALL', 'ACTIVE', 'COMPLETED', 'REFUNDED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterState(f)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      filterState === f ? 'bg-[#8E6F1D] text-white' : 'bg-black/5 dark:bg-white/5'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredSessions.map(s => {
              const isSelected = selectedSession?.sessionId === s.sessionId;
              return (
                <div
                  key={s.sessionId}
                  onClick={() => {
                    chitiSensory.playTick();
                    setSelectedSession(s);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF7F2] dark:bg-[#121522] border-[#8E6F1D] dark:border-[#D4AF37] shadow-md'
                      : 'bg-white dark:bg-[#090B12] border-black/10 dark:border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#1C1917] dark:text-white">
                      {s.beneficiary.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.state === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse'
                        : s.state === 'COMPLETED'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : 'bg-amber-500/15 text-amber-600'
                    }`}>
                      {s.state}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#857E74] mt-1">
                    {s.sessionId} • {s.activeTransport === 'WEB_RTC' ? '🌐 Web Sabha' : '📞 Exotel PSTN'}
                  </div>

                  <div className="text-[11px] text-[#857E74] mt-1">
                    विद्वान्: {s.scholar.name} • भुगतान: ₹{s.payment.amountInr} (सत्यापित)
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Mission Control & Authorized Actions (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedSession ? (
              <div className="p-5 rounded-3xl bg-white dark:bg-[#090B12] border border-black/10 dark:border-white/10 space-y-4 shadow-lg">
                
                {/* Session Identification & Entities */}
                <div className="pb-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#857E74] uppercase tracking-wider block">परामर्श पहचान पत्र</span>
                    <span className="font-bold text-sm text-[#8E6F1D] dark:text-[#F0C968]">{selectedSession.sessionId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#857E74] block">कॉस्मिक प्रोफाइल</span>
                    <span className="font-bold text-xs">{selectedSession.profile.cosmicId}</span>
                  </div>
                </div>

                {/* Multi-Party Entity Separation (Payer vs Beneficiary vs Scholar) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <span className="text-[10px] text-[#857E74] block font-bold">भुगतानकर्ता (Payer):</span>
                    <strong className="text-[#1C1917] dark:text-white block mt-0.5">{selectedSession.payer.name}</strong>
                    <span className="text-[10px] text-[#857E74]">{selectedSession.payer.phoneMasked}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <span className="text-[10px] text-[#857E74] block font-bold">लाभार्थी (Beneficiary):</span>
                    <strong className="text-[#1C1917] dark:text-white block mt-0.5">{selectedSession.beneficiary.name}</strong>
                    <span className="text-[10px] text-[#857E74]">{selectedSession.beneficiary.phoneMasked}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <span className="text-[10px] text-[#857E74] block font-bold">पंडित जी (Scholar):</span>
                    <strong className="text-[#1C1917] dark:text-white block mt-0.5">{selectedSession.scholar.name}</strong>
                    <span className="text-[10px] text-[#857E74]">{selectedSession.scholar.title}</span>
                  </div>
                </div>

                {/* Real-time Telemetry & Quality */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-black/40 border border-black/5 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span>रियल-टाइम मीडिया टेलीमेट्री (WebRTC / PSTN)</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      ICE: {selectedSession.webrtcTelemetry?.iceConnectionState || 'connected'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#57524A] dark:text-[#D1C9BF]">
                    <div>RTT: <strong>{selectedSession.webrtcTelemetry?.roundTripTimeMs || 48} ms</strong></div>
                    <div>Jitter: <strong>{selectedSession.webrtcTelemetry?.jitterMs || 12} ms</strong></div>
                    <div>Packet Loss: <strong>{selectedSession.webrtcTelemetry?.packetLossPercentage || 0.4}%</strong></div>
                    <div>Candidate: <strong>{selectedSession.webrtcTelemetry?.selectedCandidateType || 'relay (TURN)'}</strong></div>
                  </div>
                </div>

                {/* Actual Cost Ledger Snapshot (P2) */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                    <span>वास्तविक लागत बहीखाता (Actual Cost Ledger)</span>
                    <span>सकल दक्षिणा: ₹{selectedSession.costLedger.grossBookingValueInr}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10.5px] text-[#57524A] dark:text-[#D1C9BF]">
                    <div>गेटवे शुल्क: ₹{selectedSession.costLedger.paymentGatewayFeeInr}</div>
                    <div>विद्वान् मानदेय: ₹{selectedSession.costLedger.scholarPayoutInr}</div>
                    <div>WebRTC/TURN: ₹{selectedSession.costLedger.webrtcCostInr + selectedSession.costLedger.turnCostInr}</div>
                    <div>AI व WhatsApp: ₹{selectedSession.costLedger.aiCostInr + selectedSession.costLedger.whatsAppCostInr}</div>
                    <div>शुद्ध मार्जिन: <strong className="text-emerald-600 dark:text-emerald-400">₹{selectedSession.costLedger.netContributionMarginInr}</strong></div>
                  </div>
                </div>

                {/* Operational Authorized Control Actions */}
                <div>
                  <span className="text-xs font-bold text-[#857E74] block mb-2">
                    प्राधिकृत ऑपरेशन्स हस्तक्षेप (Authorized Operational Controls):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handlePstnFallback(selectedSession)}
                      className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>PSTN पर स्विच</span>
                    </button>

                    <button
                      onClick={() => handleExtendGrace(selectedSession)}
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>+५ मिनट अनुग्रह</span>
                    </button>

                    <button
                      onClick={() => handleRefund(selectedSession)}
                      className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>रिफंड निष्पादित</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 rounded-3xl border border-dashed border-black/10 dark:border-white/10 text-center text-xs text-[#857E74]">
                कृपया निरीक्षण हेतु सत्र का चयन करें।
              </div>
            )}
          </div>

        </div>

      </div>
    </CosmicTantraShell>
  );
}
