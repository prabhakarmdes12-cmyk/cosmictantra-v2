'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  X,
  Phone,
  Video,
  MessageSquare,
  ShoppingBag,
  Plus,
  ExternalLink,
  Award,
  AlertCircle,
  Search,
  Check,
  RotateCcw,
  Play,
  Pause,
  User,
  MapPin,
  Calendar,
  Lock,
  Send,
  DollarSign
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';
import { CITIES } from '@/lib/cities';
import { getCurrentGpsLocation } from '@/lib/location';

export interface HelpDeskCase {
  id: string;
  contactPhone: string;
  callerName: string;
  subjectName: string;
  relationship: string;
  topic: string;
  userQuestionVerbatim: string;
  birthDate: string;
  birthTime: string;
  birthTimeConfidence: 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
  birthPlace: string;
  lat: number;
  lng: number;
  tz: number;
  serviceId: 'CONSULT_15' | 'CONSULT_30' | 'KUNDLI_REVIEW' | 'MUHURTA';
  serviceName: string;
  amount: number;
  status: 'NEW' | 'INTAKE_COMPLETE' | 'PAYMENT_PENDING' | 'PAYMENT_VERIFIED' | 'SCHOLAR_ASSIGNED' | 'IN_CONSULTATION' | 'COMPLETED' | 'MISSED';
  paymentId?: string;
  paymentVerifiedAt?: string;
  assignedScholar?: string;
  lagna: string;
  moonSign: string;
  dasha: string;
  createdAt: string;
  // Scholar Consultation Notes (4 Quadrants)
  notes?: {
    calculatedAstrology: string;
    scholarInterpretation: string;
    userReportedFact: string;
    traditionalRemedy: string;
  };
}

const INITIAL_CASES: HelpDeskCase[] = [
  {
    id: 'CT-C-20260828-00192',
    contactPhone: '+91 98351 44921',
    callerName: 'Rajesh Sharma',
    subjectName: 'Rahul Sharma (Son)',
    relationship: 'Father calling for Son',
    topic: 'Career / Business Pivot',
    userQuestionVerbatim: 'I have been running a manufacturing business for 14 months. Revenue is stagnant. Should I continue with expansion or pivot back to an IT job?',
    birthDate: '1995-08-14',
    birthTime: '14:30',
    birthTimeConfidence: 'EXACT',
    birthPlace: 'Dhanbad, Jharkhand',
    lat: 23.7957,
    lng: 86.4304,
    tz: 5.5,
    serviceId: 'CONSULT_15',
    serviceName: '15-Minute Senior Vedic Consultation',
    amount: 501,
    status: 'PAYMENT_VERIFIED',
    paymentId: 'pay_RZP987123490',
    paymentVerifiedAt: '28 Aug 2026, 19:42 IST',
    assignedScholar: 'Pt. Vidyanand Shastri',
    lagna: 'Vrischika (Scorpio • Anuradha Pada 3)',
    moonSign: 'Meena (Pisces • Revati Pada 1)',
    dasha: 'Jupiter Mahadasha • Saturn Antardasha (Active)',
    createdAt: '28 Aug 2026, 19:35',
    notes: {
      calculatedAstrology: '10th Lord Sun exalted in Aries in D9 Navamsha. Saturn transiting 4th from Moon in natal Aquarius.',
      scholarInterpretation: 'Current Saturn sub-period tests foundational endurance. Breakthrough begins post-December 2026 Jupiter transit.',
      userReportedFact: 'Started business with initial seed debt in July 2025.',
      traditionalRemedy: 'Aditya Hridaya Stotra at sunrise + Pure Brass Surya Yantra.'
    }
  },
  {
    id: 'CT-C-20260828-00193',
    contactPhone: '+91 94311 88320',
    callerName: 'Priya Verma',
    subjectName: 'Priya Verma (Self)',
    relationship: 'Self',
    topic: 'Marriage & Kundali Milan',
    userQuestionVerbatim: 'We are matching charts for marriage. Prospective alliance has Mars in 8th house. Is there acute Manglik Dosha?',
    birthDate: '1998-03-22',
    birthTime: '06:45',
    birthTimeConfidence: 'EXACT',
    birthPlace: 'Varanasi, Uttar Pradesh',
    lat: 25.3176,
    lng: 82.9739,
    tz: 5.5,
    serviceId: 'CONSULT_15',
    serviceName: '15-Minute Senior Vedic Consultation',
    amount: 501,
    status: 'PAYMENT_PENDING',
    lagna: 'Meena (Pisces)',
    moonSign: 'Dhanu (Sagittarius)',
    dasha: 'Mercury Mahadasha • Venus Antardasha',
    createdAt: '28 Aug 2026, 19:50'
  }
];

export default function PanditWorkspace() {
  const [activeTab, setActiveTab] = useState<'HELP_DESK' | 'SCHOLAR_DESK'>('HELP_DESK');
  const [cases, setCases] = useState<HelpDeskCase[]>(INITIAL_CASES);
  const [selectedCase, setSelectedCase] = useState<HelpDeskCase>(INITIAL_CASES[0]);

  // Intake Form State (Junior Pandit)
  const [phoneInput, setPhoneInput] = useState('');
  const [callerNameInput, setCallerNameInput] = useState('');
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [relationshipInput, setRelationshipInput] = useState('Self');
  const [topicInput, setTopicInput] = useState('Career');
  const [questionVerbatim, setQuestionVerbatim] = useState('');
  const [dobInput, setDobInput] = useState('1996-05-15');
  const [tobInput, setTobInput] = useState('10:30');
  const [confidenceInput, setConfidenceInput] = useState<'EXACT' | 'APPROXIMATE' | 'UNKNOWN'>('EXACT');
  const [selectedCityId, setSelectedCityId] = useState('dhanbad');
  const [serviceSelected, setServiceSelected] = useState<'CONSULT_15' | 'CONSULT_30'>('CONSULT_15');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Scholar Consultation Timer (15:00)
  const [timerActive, setTimerActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [consultationStatus, setConsultationStatus] = useState<'NOT_STARTED' | 'CONNECTED' | 'COMPLETED' | 'MISSED'>('NOT_STARTED');

  // Scholar Notes Form
  const [calcAstro, setCalcAstro] = useState(selectedCase?.notes?.calculatedAstrology || '');
  const [scholarInterp, setScholarInterp] = useState(selectedCase?.notes?.scholarInterpretation || '');
  const [userFact, setUserFact] = useState(selectedCase?.notes?.userReportedFact || '');
  const [tradRemedy, setTradRemedy] = useState(selectedCase?.notes?.traditionalRemedy || '');

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (timerActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && timerActive) {
      setTimerActive(false);
      chitiSensory.playBell();
    }
    return () => clearInterval(interval);
  }, [timerActive, secondsRemaining]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Create new intake case
  const handleCreateIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionVerbatim.trim()) {
      alert('Mandatory: Please record user question verbatim before generating consultation order.');
      return;
    }

    chitiSensory.playTick();
    const city = CITIES.find(c => c.id === selectedCityId) || CITIES[0];
    const newCase: HelpDeskCase = {
      id: `CT-C-${Date.now().toString().substring(4, 12)}`,
      contactPhone: phoneInput || '+91 99729 34937',
      callerName: callerNameInput || 'Devotee',
      subjectName: subjectNameInput || callerNameInput || 'Devotee',
      relationship: relationshipInput,
      topic: topicInput,
      userQuestionVerbatim: questionVerbatim,
      birthDate: dobInput,
      birthTime: tobInput,
      birthTimeConfidence: confidenceInput,
      birthPlace: `${city.name}, ${city.state}`,
      lat: city.lat,
      lng: city.lng,
      tz: city.tz,
      serviceId: serviceSelected,
      serviceName: serviceSelected === 'CONSULT_15' ? '15-Minute Senior Vedic Consultation' : '30-Minute In-Depth Vedic Consultation',
      amount: serviceSelected === 'CONSULT_15' ? 501 : 1100,
      status: 'PAYMENT_PENDING',
      lagna: 'Dhanu (Sagittarius • Mula)',
      moonSign: 'Mesha (Aries • Bharani)',
      dasha: 'Jupiter Mahadasha • Mercury Antardasha',
      createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setCases([newCase, ...cases]);
    setSelectedCase(newCase);
    alert(`Consultation Order ${newCase.id} created! Payment Link ready to send on WhatsApp.`);
  };

  // Simulate Razorpay Webhook Payment Confirmation
  const handleSimulatePaymentWebhook = () => {
    if (!selectedCase) return;
    setIsVerifyingPayment(true);
    chitiSensory.playTick();

    setTimeout(() => {
      setIsVerifyingPayment(false);
      chitiSensory.playBell();
      const updated = {
        ...selectedCase,
        status: 'PAYMENT_VERIFIED' as const,
        paymentId: `pay_RZP${Math.floor(10000000 + Math.random() * 90000000)}`,
        paymentVerifiedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'
      };
      setSelectedCase(updated);
      setCases(cases.map(c => (c.id === updated.id ? updated : c)));
    }, 1200);
  };

  // Assign Scholar
  const handleAssignScholar = (scholarName: string) => {
    chitiSensory.playTick();
    const updated = {
      ...selectedCase,
      status: 'SCHOLAR_ASSIGNED' as const,
      assignedScholar: scholarName
    };
    setSelectedCase(updated);
    setCases(cases.map(c => (c.id === updated.id ? updated : c)));
    alert(`Scholar Assigned: ${scholarName}. Case transferred to Scholar Workspace. Free WhatsApp help call can now conclude.`);
  };

  // Scholar Connected - Start Session
  const handleStartConsultation = () => {
    chitiSensory.playBell();
    setConsultationStatus('CONNECTED');
    setTimerActive(true);
    setSecondsRemaining(selectedCase.serviceId === 'CONSULT_30' ? 30 * 60 : 15 * 60);
    const updated = { ...selectedCase, status: 'IN_CONSULTATION' as const };
    setSelectedCase(updated);
    setCases(cases.map(c => (c.id === updated.id ? updated : c)));
  };

  // Scholar Customer No Answer
  const handleCustomerNoAnswer = () => {
    chitiSensory.playTick();
    setTimerActive(false);
    setConsultationStatus('MISSED');
    const updated = { ...selectedCase, status: 'MISSED' as const };
    setSelectedCase(updated);
    setCases(cases.map(c => (c.id === updated.id ? updated : c)));
    alert('Customer Did Not Answer recorded. Consultation marked MISSED (Time not consumed). Devotee notified for reschedule.');
  };

  // Save 4-Quadrant Notes
  const handleSaveNotes = () => {
    chitiSensory.playBell();
    const updated = {
      ...selectedCase,
      status: 'COMPLETED' as const,
      notes: {
        calculatedAstrology: calcAstro,
        scholarInterpretation: scholarInterp,
        userReportedFact: userFact,
        traditionalRemedy: tradRemedy
      }
    };
    setSelectedCase(updated);
    setCases(cases.map(c => (c.id === updated.id ? updated : c)));
    alert('Consultation Folio successfully recorded & archived!');
  };

  return (
    <CosmicTantraShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TOP COCKPIT HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0F1222] border border-[#8E6F1D]/40 text-white shadow-xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-mono-data font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>COCKPIT • CANONICAL HELP DESK: +91 9972934937</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-[#FAF7F2]">
              {activeTab === 'HELP_DESK' ? 'Junior Pandit Help Desk & Intake Desk' : 'Senior Scholar Paid Consultation Workspace'}
            </h1>
            <p className="text-xs font-mono-data text-[#D1C9BF]">
              {activeTab === 'HELP_DESK' 
                ? 'Triage inbound WhatsApp calls, collect verbatim concern, generate consultation order & verify server payments.'
                : 'Receive verified intake case briefs, track 15-minute consultation timer, and record 4-quadrant astrological folios.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl bg-black/40 border border-white/10 shrink-0">
            <button
              onClick={() => { chitiSensory.playTick(); setActiveTab('HELP_DESK'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'HELP_DESK'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>1. Help Desk Intake</span>
            </button>

            <button
              onClick={() => { chitiSensory.playTick(); setActiveTab('SCHOLAR_DESK'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'SCHOLAR_DESK'
                  ? 'bg-[#D4AF37] text-black shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>2. Scholar Paid Desk</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: JUNIOR PANDIT HELP DESK INTAKE & PAYMENT VERIFICATION               */}
        {/* ========================================================================= */}
        {activeTab === 'HELP_DESK' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: Live Cases Queue (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-3xl bg-white dark:bg-[#0E101D] border border-black/10 dark:border-white/10 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" />
                    <span>Inbound Cases Queue</span>
                  </h3>
                  <span className="text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                    {cases.length} Total
                  </span>
                </div>

                <div className="space-y-2">
                  {cases.map(c => {
                    const isSelected = selectedCase?.id === c.id;
                    const isPaid = c.status === 'PAYMENT_VERIFIED' || c.status === 'SCHOLAR_ASSIGNED';
                    return (
                      <div
                        key={c.id}
                        onClick={() => { chitiSensory.playTick(); setSelectedCase(c); }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 shadow-md'
                            : 'border-black/5 dark:border-white/5 bg-[#FAF7F2] dark:bg-[#151828] hover:border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono-data font-bold text-xs text-[#1C1917] dark:text-white">
                            {c.callerName}
                          </span>
                          <span className={`text-[10px] font-mono-data px-2 py-0.5 rounded-full font-bold ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono-data text-[#696256] dark:text-[#9E988D] truncate">
                          📞 {c.contactPhone} • ₹{c.amount}
                        </div>

                        <div className="text-[11px] font-editorial text-[#1C1917] dark:text-[#FAF7F2] line-clamp-1 italic">
                          "{c.userQuestionVerbatim}"
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Guided Intake Form & Payment Link Cockpit (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Screen 1: New Caller Intake */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0E101D] border border-black/10 dark:border-white/10 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
                  <div>
                    <h2 className="text-xl font-editorial font-bold text-[#1C1917] dark:text-white">
                      New Help Desk Interaction & Intake
                    </h2>
                    <p className="text-xs font-mono-data text-[#696256] dark:text-[#9E988D]">
                      Collect caller phone, separate contact from subject profile, record question verbatim, and generate order.
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono-data text-xs font-bold border border-amber-500/20">
                    Role: HELP_DESK_COORDINATOR
                  </span>
                </div>

                <form onSubmit={handleCreateIntake} className="space-y-4">
                  {/* Contact vs Person Profile Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">
                        Caller Phone (WhatsApp) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98351 XXXXX"
                        value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono-data outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">
                        Caller Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Rajesh Sharma"
                        value={callerNameInput}
                        onChange={e => setCallerNameInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono-data outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">
                        Subject / Relationship
                      </label>
                      <input
                        type="text"
                        placeholder="Son (Rahul Sharma)"
                        value={relationshipInput}
                        onChange={e => setRelationshipInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono-data outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Mandatory Verbatim Question */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono-data font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>USER'S QUESTION — VERBATIM (Mandatory for Consultations) *</span>
                      </label>
                      <span className="text-[10px] font-mono-data text-[#9E988D]">
                        Do not reduce to a single category
                      </span>
                    </div>
                    <textarea
                      required
                      rows={2}
                      placeholder='e.g. "I have been running a business for one year. Progress is slow. Should I continue or return to a job?"'
                      value={questionVerbatim}
                      onChange={e => setQuestionVerbatim(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-amber-500/30 text-xs font-mono-data outline-none focus:border-amber-500 leading-relaxed"
                    />
                  </div>

                  {/* Birth Details & Deterministic Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">
                        Birth Date
                      </label>
                      <input
                        type="date"
                        value={dobInput}
                        onChange={e => setDobInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono-data outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">
                        Birth Time
                      </label>
                      <input
                        type="time"
                        value={tobInput}
                        onChange={e => setTobInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono-data outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">
                        Time Confidence
                      </label>
                      <select
                        value={confidenceInput}
                        onChange={e => setConfidenceInput(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono-data outline-none focus:border-amber-500"
                      >
                        <option value="EXACT">EXACT (±5 mins)</option>
                        <option value="APPROXIMATE">APPROXIMATE (±1 hr)</option>
                        <option value="UNKNOWN">UNKNOWN</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">
                        Birth City (350+ Cities)
                      </label>
                      <select
                        value={selectedCityId}
                        onChange={e => setSelectedCityId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono-data outline-none focus:border-amber-500"
                      >
                        {CITIES.slice(0, 30).map(c => (
                          <option key={c.id} value={c.id}>{c.name}, {c.state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Standardized Canonical Service Catalog */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">
                      Recommended Canonical Service *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => setServiceSelected('CONSULT_15')}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          serviceSelected === 'CONSULT_15'
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-black/10 dark:border-white/10'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-[#1C1917] dark:text-white">
                            CONSULT_15 (15-Minute Senior Consultation)
                          </div>
                          <div className="text-[11px] text-[#696256] dark:text-[#9E988D]">
                            Focused question + verified chart handoff
                          </div>
                        </div>
                        <div className="text-base font-mono-data font-bold text-amber-500">
                          ₹501
                        </div>
                      </div>

                      <div
                        onClick={() => setServiceSelected('CONSULT_30')}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          serviceSelected === 'CONSULT_30'
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-black/10 dark:border-white/10'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-[#1C1917] dark:text-white">
                            CONSULT_30 (30-Minute Complete Consultation)
                          </div>
                          <div className="text-[11px] text-[#696256] dark:text-[#9E988D]">
                            Multi-area life review + remedial roadmap
                          </div>
                        </div>
                        <div className="text-base font-mono-data font-bold text-amber-500">
                          ₹1,100
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-mono-data font-bold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Create Consultation Order & Generate Payment Link</span>
                  </button>
                </form>
              </div>

              {/* Active Case Review & Razorpay Webhook Simulator */}
              {selectedCase && (
                <div className="p-6 rounded-3xl bg-[#0F1222] border border-[#8E6F1D]/50 text-white shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <div className="text-xs font-mono-data text-amber-400 font-bold">
                        ACTIVE CONSULTATION ORDER: {selectedCase.id}
                      </div>
                      <h3 className="text-lg font-editorial font-bold text-[#FAF7F2]">
                        {selectedCase.subjectName} • {selectedCase.serviceName} (₹{selectedCase.amount})
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedCase.status === 'PAYMENT_VERIFIED' || selectedCase.status === 'SCHOLAR_ASSIGNED' ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono-data font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>PAYMENT VERIFIED (Razorpay Server Webhook)</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono-data font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>PAYMENT PENDING (₹{selectedCase.amount})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Verbatim Question Banner */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono-data space-y-1">
                    <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                      Caller's Verbatim Question:
                    </span>
                    <p className="text-[#E7E5E4] italic leading-relaxed">
                      "{selectedCase.userQuestionVerbatim}"
                    </p>
                  </div>

                  {/* Payment Verification & Scholar Handoff Action Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    
                    {/* Payment Simulator */}
                    <div className="p-4 rounded-2xl bg-[#161B30] border border-white/10 space-y-2.5">
                      <div className="text-xs font-mono-data font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Razorpay Server Webhook Verification</span>
                      </div>
                      <p className="text-[11px] font-mono-data text-[#9E988D]">
                        Strict invariant INV_PAY_001: Front-end cannot authorize paid session without signed server webhook verification.
                      </p>
                      
                      {selectedCase.status === 'PAYMENT_PENDING' ? (
                        <button
                          type="button"
                          onClick={handleSimulatePaymentWebhook}
                          disabled={isVerifyingPayment}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono-data font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isVerifyingPayment ? 'Verifying HMAC Signature...' : `Simulate Customer Paid ₹${selectedCase.amount} on UPI`}
                        </button>
                      ) : (
                        <div className="text-xs font-mono-data text-emerald-300 font-bold">
                          ✓ Txn ID: {selectedCase.paymentId} ({selectedCase.paymentVerifiedAt})
                        </div>
                      )}
                    </div>

                    {/* Scholar Assignment */}
                    <div className="p-4 rounded-2xl bg-[#161B30] border border-white/10 space-y-2.5">
                      <div className="text-xs font-mono-data font-bold text-[#F0C968] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>Assign Senior Scholar</span>
                      </div>
                      <p className="text-[11px] font-mono-data text-[#9E988D]">
                        Unlocks only after server-verified payment evidence.
                      </p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={selectedCase.status === 'PAYMENT_PENDING'}
                          onClick={() => handleAssignScholar('Pt. Vidyanand Shastri')}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-mono-data font-bold shadow-md transition-all flex items-center justify-center gap-1.5 ${
                            selectedCase.status === 'PAYMENT_PENDING'
                              ? 'bg-white/10 text-white/40 cursor-not-allowed'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black cursor-pointer hover:from-amber-400 hover:to-amber-500'
                          }`}
                        >
                          <span>Pt. Vidyanand Shastri (Varanasi)</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SENIOR SCHOLAR PAID CONSULTATION WORKSPACE                          */}
        {/* ========================================================================= */}
        {activeTab === 'SCHOLAR_DESK' && (
          <div className="space-y-6">
            
            {/* SCHOLAR CASE BRIEF & 15:00 CONSULTATION TIMER */}
            <div className="p-6 rounded-3xl bg-[#0F1222] border border-[#8E6F1D]/50 text-white shadow-2xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono-data font-bold">
                    <span>SCHOLAR CASE BRIEF • ZERO REPEATED INTAKE</span>
                  </div>
                  <h2 className="text-2xl font-editorial font-bold text-[#FAF7F2] mt-1">
                    {selectedCase.subjectName} ({selectedCase.relationship})
                  </h2>
                  <div className="text-xs font-mono-data text-[#D1C9BF] flex flex-wrap gap-4 mt-1">
                    <span>📞 {selectedCase.contactPhone}</span>
                    <span>📍 {selectedCase.birthPlace}</span>
                    <span>🎂 {selectedCase.birthDate} ({selectedCase.birthTime})</span>
                    <span>✨ {selectedCase.lagna}</span>
                  </div>
                </div>

                {/* Consultation Timer Instrument */}
                <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/40 text-center space-y-1 min-w-[200px]">
                  <div className="text-[10px] font-mono-data text-amber-400 uppercase font-bold tracking-wider">
                    Paid Consultation Timer
                  </div>
                  <div className={`text-3xl font-mono-data font-bold tracking-widest ${
                    secondsRemaining <= 120 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                  }`}>
                    {formatTimer(secondsRemaining)}
                  </div>
                  <div className="text-[10px] font-mono-data text-[#9E988D]">
                    {secondsRemaining <= 120 && secondsRemaining > 0
                      ? '⚠️ 2-Minute Policy Warning'
                      : timerActive
                      ? 'Session in Progress'
                      : 'Not Started'}
                  </div>
                </div>
              </div>

              {/* Mandatory Verbatim Question Display */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="text-xs font-mono-data font-bold text-amber-300 uppercase tracking-wider">
                  Devotee's Exact Question (From Help Desk Intake):
                </div>
                <p className="text-sm font-editorial text-white leading-relaxed italic">
                  "{selectedCase.userQuestionVerbatim}"
                </p>
              </div>

              {/* Scholar Action Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {consultationStatus === 'NOT_STARTED' && (
                  <>
                    <button
                      type="button"
                      onClick={handleStartConsultation}
                      className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono-data font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
                    >
                      <Play className="w-4 h-4" />
                      <span>Customer Connected — Start Paid Session (15:00)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCustomerNoAnswer}
                      className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-mono-data font-bold text-white flex items-center gap-2 cursor-pointer"
                    >
                      <X className="w-4 h-4 text-rose-400" />
                      <span>Customer Did Not Answer (Missed Call)</span>
                    </button>
                  </>
                )}

                {consultationStatus === 'CONNECTED' && (
                  <button
                    type="button"
                    onClick={() => setTimerActive(!timerActive)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono-data font-bold text-white flex items-center gap-2 cursor-pointer"
                  >
                    {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{timerActive ? 'Pause Timer' : 'Resume Timer'}</span>
                  </button>
                )}
              </div>

              {/* 4-QUADRANT STRUCTURED CONSULTATION FOLIO NOTES */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-editorial font-bold text-white">
                    4-Quadrant Structured Astrological Folio
                  </h3>
                  <span className="text-[11px] font-mono-data text-[#9E988D]">
                    Do not mix calculations with interpretation or user facts
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Quadrant 1: Calculated Astrology */}
                  <div className="p-4 rounded-2xl bg-[#161B30] border border-white/10 space-y-1.5">
                    <label className="text-xs font-mono-data font-bold text-amber-400">
                      1. CALCULATED_ASTROLOGY (Source Planetary Truth)
                    </label>
                    <textarea
                      rows={3}
                      value={calcAstro}
                      onChange={e => setCalcAstro(e.target.value)}
                      placeholder="e.g. 10th Lord Sun exalted in Aries in D9 Navamsha. Saturn transiting 4th from Moon in natal Aquarius."
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono-data text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Quadrant 2: Scholar Interpretation */}
                  <div className="p-4 rounded-2xl bg-[#161B30] border border-white/10 space-y-1.5">
                    <label className="text-xs font-mono-data font-bold text-emerald-400">
                      2. SCHOLAR_INTERPRETATION (Vedic Guidance)
                    </label>
                    <textarea
                      rows={3}
                      value={scholarInterp}
                      onChange={e => setScholarInterp(e.target.value)}
                      placeholder="e.g. Current Saturn sub-period tests foundational endurance. Breakthrough begins post-December 2026."
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono-data text-white outline-none focus:border-emerald-400"
                    />
                  </div>

                  {/* Quadrant 3: User Reported Fact */}
                  <div className="p-4 rounded-2xl bg-[#161B30] border border-white/10 space-y-1.5">
                    <label className="text-xs font-mono-data font-bold text-sky-400">
                      3. USER_REPORTED_FACT (Seeker Context)
                    </label>
                    <textarea
                      rows={3}
                      value={userFact}
                      onChange={e => setUserFact(e.target.value)}
                      placeholder="e.g. Started business with initial seed debt in July 2025."
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono-data text-white outline-none focus:border-sky-400"
                    />
                  </div>

                  {/* Quadrant 4: Traditional Remedy */}
                  <div className="p-4 rounded-2xl bg-[#161B30] border border-white/10 space-y-1.5">
                    <label className="text-xs font-mono-data font-bold text-rose-400">
                      4. TRADITIONAL_REMEDY (Non-Extortive Upaya)
                    </label>
                    <textarea
                      rows={3}
                      value={tradRemedy}
                      onChange={e => setTradRemedy(e.target.value)}
                      placeholder="e.g. Daily Aditya Hridaya Stotra recitation at sunrise + Pure Brass Surya Yantra."
                      className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono-data text-white outline-none focus:border-rose-400"
                    />
                  </div>

                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono-data font-bold text-xs shadow-lg cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conclude Consultation & Record Verified Folio</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </CosmicTantraShell>
  );
}
