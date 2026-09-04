'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import IncomingFreeCallsPanel from '@/components/sabha/IncomingFreeCallsPanel';
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
  status: 'NEW' | 'INTAKE_IN_PROGRESS' | 'INTAKE_COMPLETE' | 'PAYMENT_PENDING' | 'PAYMENT_VERIFIED' | 'SCHOLAR_ASSIGNMENT_PENDING' | 'SCHOLAR_ASSIGNED' | 'CALLBACK_PENDING' | 'CONNECTED' | 'IN_CONSULTATION' | 'COMPLETED' | 'CUSTOMER_UNREACHABLE' | 'PAYMENT_FAILED' | 'SCHOLAR_UNAVAILABLE' | 'CANCELLED';
  paymentId?: string;
  paymentVerifiedAt?: string;
  assignedScholar?: string;
  practitionerId?: string;
  lagna: string;
  moonSign: string;
  dasha: string;
  createdAt: string;
  notes?: {
    calculatedAstrology?: string;
    scholarInterpretation?: string;
    userReportedFact?: string;
    traditionalRemedy?: string;
  };
}

function PanditWorkspaceInner() {
  const searchParams = useSearchParams();
  const scholarIdParam = searchParams?.get('scholarId') || '';
  const isDedicatedPandit = Boolean(scholarIdParam);

  const [activeTab, setActiveTab] = useState<'HELP_DESK' | 'SCHOLAR_DESK'>(
    isDedicatedPandit ? 'SCHOLAR_DESK' : 'HELP_DESK'
  );
  const [scholarDetails, setScholarDetails] = useState<{ name: string; city: string; title: string } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [cases, setCases] = useState<HelpDeskCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<HelpDeskCase | null>(null);
  const [scholars, setScholars] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [operatorAccess, setOperatorAccess] = useState(false);

  useEffect(() => {
    if (scholarIdParam) {
      fetch('/api/sabha/directory', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          const found = (d?.scholars || []).find((s: any) => s.scholarId === scholarIdParam);
          if (found) {
            setScholarDetails({ name: found.name, city: found.city, title: found.title });
          }
        })
        .catch(() => {});
    }
  }, [scholarIdParam]);

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
  const [calcAstro, setCalcAstro] = useState('');
  const [scholarInterp, setScholarInterp] = useState('');
  const [userFact, setUserFact] = useState('');
  const [tradRemedy, setTradRemedy] = useState('');

  const [services, setServices] = useState<Array<{ id?: string; code: string; name: string; durationMinutes: number; priceInr: number }>>([
    { code: 'CONSULT_15', name: '15-Minute Senior Vedic Consultation', durationMinutes: 15, priceInr: 501 },
    { code: 'CONSULT_30', name: '30-Minute In-Depth Vedic Consultation', durationMinutes: 30, priceInr: 1100 }
  ]);

  // Fetch live cases, services & scholars from database API
  const fetchLiveCases = async () => {
    try {
      setIsLoading(true);

      // Fetch dynamic service catalog
      const sRes = await fetch('/api/astrology/services');
      const sData = await sRes.json();
      if (sData.success && Array.isArray(sData.services)) {
        setServices(sData.services);
      }

      const res = await fetch('/api/astrology/consultations');
      const data = await res.json();
      setOperatorAccess(Boolean(data.authenticated));
      if (data.success && Array.isArray(data.consultations)) {
        const mapped: HelpDeskCase[] = data.consultations.map((c: any) => ({
          id: c.id,
          contactPhone: c.callerPhone || c.customerPhone || '+91 9972934937',
          callerName: c.callerName || c.customerName || 'Devotee',
          subjectName: c.customerName || 'Devotee',
          relationship: c.relationship || 'Self',
          topic: 'General Consultation',
          userQuestionVerbatim: c.customerQuestion || '',
          birthDate: c.birthDate ? new Date(c.birthDate).toISOString().split('T')[0] : '1996-05-15',
          birthTime: c.birthTime || '10:30',
          birthTimeConfidence: (c.birthTimeConfidence as any) || 'EXACT',
          birthPlace: c.birthCity || 'Patna',
          lat: c.birthLat || 25.5941,
          lng: c.birthLon || 85.1376,
          tz: c.timezone || 5.5,
          serviceId: c.amount === 1100 ? 'CONSULT_30' : 'CONSULT_15',
          serviceName: c.amount === 1100 ? '30-Minute In-Depth Vedic Consultation' : '15-Minute Senior Vedic Consultation',
          amount: c.amount || 501,
          status: c.status,
          paymentId: c.paymentProvider,
          paymentVerifiedAt: c.updatedAt,
          assignedScholar: c.practitioner?.displayName || c.practitioner?.fullName,
          practitionerId: c.practitionerId,
          lagna: 'Vrischika (Scorpio)',
          moonSign: 'Meena (Pisces)',
          dasha: 'Jupiter Mahadasha • Saturn Antardasha',
          createdAt: new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          notes: c.consultationNotes || undefined
        }));

        setCases(mapped);
        if (mapped.length > 0 && !selectedCase) {
          setSelectedCase(mapped[0]);
        }
      }

      // Fetch active practitioners (isolated from production fixtures)
      const pRes = await fetch('/api/astrology/practitioners');
      const pData = await pRes.json();
      if (pData.success && Array.isArray(pData.consultants)) {
        setScholars(pData.consultants.map((p: any) => ({
          id: p.id,
          name: p.displayName || p.fullName || 'Pandit Ji',
          specialty: p.specialty || 'Vedic Astrology'
        })));
      }
    } catch (err) {
      console.error('Failed to load live cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveCases();
  }, []);

  // Sync notes when selected case changes
  useEffect(() => {
    if (selectedCase) {
      setCalcAstro(selectedCase.notes?.calculatedAstrology || '');
      setScholarInterp(selectedCase.notes?.scholarInterpretation || '');
      setUserFact(selectedCase.notes?.userReportedFact || '');
      setTradRemedy(selectedCase.notes?.traditionalRemedy || '');
    }
  }, [selectedCase]);

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

  // Create new intake case (Persisted in Neon DB)
  const handleCreateIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionVerbatim.trim()) {
      alert('Mandatory: Please record user question verbatim before generating consultation order.');
      return;
    }

    chitiSensory.playTick();
    const city = CITIES.find(c => c.id === selectedCityId) || CITIES[0];
    const selectedSrv = services.find(s => s.code === serviceSelected) || services[0] || { priceInr: 501 };
    const amount = selectedSrv.priceInr;

    try {
      const res = await fetch('/api/astrology/consultations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: subjectNameInput || callerNameInput || 'Devotee',
          customerPhone: phoneInput || '+91 9972934937',
          callerPhone: phoneInput || '+91 9972934937',
          callerName: callerNameInput || 'Devotee',
          relationship: relationshipInput,
          customerQuestion: questionVerbatim,
          birthDate: dobInput,
          birthTime: tobInput,
          birthCity: `${city.name}, ${city.state}`,
          birthLat: city.lat,
          birthLon: city.lng,
          timezone: city.tz,
          amount,
          consultationMode: 'VOICE'
        })
      });

      const data = await res.json();
      const createdId = data.consultationId || data.consultation?.id;
      if (data.success && createdId) {
        await fetchLiveCases();
        const createdCase = {
          id: createdId,
          contactPhone: phoneInput || '+91 9972934937',
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
          amount,
          status: 'PAYMENT_PENDING' as const,
          lagna: 'Dhanu (Sagittarius)',
          moonSign: 'Mesha (Aries)',
          dasha: 'Jupiter Mahadasha',
          createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
        setSelectedCase(createdCase);
      }
    } catch (err: any) {
      console.error('Failed to save intake case to database:', err);
    }
  };

  // Trigger Verified Webhook via Real Cryptographic HMAC SHA-256 Signature
  const handleSimulatePaymentWebhook = async () => {
    if (!selectedCase) return;
    setIsVerifyingPayment(true);
    chitiSensory.playTick();

    try {
      const payload = {
        consultationId: selectedCase.id,
        paymentId: `pay_test_${Date.now()}`
      };
      const rawPayload = JSON.stringify(payload);

      // 1. Get real HMAC SHA-256 signature from test signing helper
      const signRes = await fetch('/api/astrology/payments/sign-test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: rawPayload
      });
      const signData = await signRes.json();

      // 2. Deliver webhook with official x-razorpay-signature header (No bypass headers)
      const res = await fetch('/api/astrology/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signData.signature || ''
        },
        body: rawPayload
      });

      const data = await res.json();
      if (data.success) {
        chitiSensory.playTick();
        await fetchLiveCases();
        setSelectedCase(prev => prev ? { ...prev, status: 'PAYMENT_VERIFIED' } : null);
      } else {
        console.error('Webhook error:', data.error);
      }
    } catch (err: any) {
      console.error('Payment webhook verification failed:', err.message);
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Assign Scholar via Server State Machine
  const handleAssignScholar = async (scholarId: string, scholarName: string) => {
    if (!selectedCase) return;
    chitiSensory.playTick();

    try {
      const res = await fetch(`/api/astrology/consultations/${selectedCase.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextStatus: 'SCHOLAR_ASSIGNED',
          actorType: 'HELP_DESK_COORDINATOR',
          assignedScholarId: scholarId,
          metadata: { scholarName }
        })
      });

      const data = await res.json();
      if (data.success) {
        await fetchLiveCases();
        setSelectedCase(prev => prev ? { ...prev, status: 'SCHOLAR_ASSIGNED', assignedScholar: scholarName } : null);
      } else {
        console.error('Failed to assign scholar:', data.error);
      }
    } catch (err: any) {
      console.error('Error during scholar assignment:', err.message);
    }
  };

  // Scholar Connected - Start Session (Explicit Server Transition)
  const handleStartConsultation = async () => {
    if (!selectedCase) return;
    chitiSensory.playTick();

    try {
      const res = await fetch(`/api/astrology/consultations/${selectedCase.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextStatus: 'CONNECTED',
          actorType: 'SCHOLAR'
        })
      });

      const data = await res.json();
      if (data.success) {
        setConsultationStatus('CONNECTED');
        setTimerActive(true);
        setSecondsRemaining(selectedCase.serviceId === 'CONSULT_30' ? 30 * 60 : 15 * 60);
        setSelectedCase(prev => prev ? { ...prev, status: 'IN_CONSULTATION' } : null);
      }
    } catch (err: any) {
      console.error('Failed to connect consultation:', err.message);
    }
  };

  // Scholar Customer No Answer (Server Transition)
  const handleCustomerNoAnswer = async () => {
    if (!selectedCase) return;
    chitiSensory.playTick();
    setTimerActive(false);

    try {
      const res = await fetch(`/api/astrology/consultations/${selectedCase.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextStatus: 'CUSTOMER_UNREACHABLE',
          actorType: 'SCHOLAR',
          reason: 'Customer did not answer callback on WhatsApp.'
        })
      });

      const data = await res.json();
      if (data.success) {
        setConsultationStatus('MISSED');
        setSelectedCase(prev => prev ? { ...prev, status: 'CUSTOMER_UNREACHABLE' } : null);
      }
    } catch (err: any) {
      console.error('Failed to record unreachable status:', err.message);
    }
  };

  // Save 4-Quadrant Notes & Complete Session (Server State Machine)
  const handleSaveNotes = async () => {
    if (!selectedCase) return;
    chitiSensory.playTick();

    try {
      const durationSec = (selectedCase.serviceId === 'CONSULT_30' ? 30 * 60 : 15 * 60) - secondsRemaining;
      const res = await fetch(`/api/astrology/consultations/${selectedCase.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextStatus: 'COMPLETED',
          actorType: 'SCHOLAR',
          sessionDurationSec: durationSec > 0 ? durationSec : 900,
          notes: {
            calculatedAstrology: calcAstro,
            scholarInterpretation: scholarInterp,
            userReportedFact: userFact,
            traditionalRemedy: tradRemedy
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        await fetchLiveCases();
        setSelectedCase(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
      } else {
        console.error('Failed to save notes:', data.error);
      }
    } catch (err: any) {
      console.error('Error saving notes:', err.message);
    }
  };

  return (
    <CosmicTantraShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* INCOMING FREE CALLS (Secure Call Engine P1 — ring & accept, 1:1 WebRTC) */}
        {isOnline ? (
          <IncomingFreeCallsPanel scholarId={scholarIdParam || 'ALL'} />
        ) : (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-400/30 text-rose-200 text-xs font-mono-data flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>⏸️ आपकी सेवा अभी अवकाश (Offline) पर है। नए कॉल प्राप्त करने के लिए ऑनलाइन मोड चालू करें।</span>
            </span>
            <button
              onClick={() => { chitiSensory.playTick(); setIsOnline(true); }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono-data font-bold text-xs cursor-pointer shadow-md"
            >
              ऑनलाइन सेवा चालू करें
            </button>
          </div>
        )}

        {/* TOP COCKPIT / PANDIT HEADER */}
        {isDedicatedPandit ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0F1222] border border-[#8E6F1D]/40 text-white shadow-xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-mono-data font-bold">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>पंडित जी का कार्यक्षेत्र • ID: {scholarIdParam}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-[#FAF7F2]">
                {scholarDetails?.name || 'पं. ज्योतिषी'} • {scholarDetails?.city || 'वाराणसी'}
              </h1>
              <p className="text-xs font-mono-data text-[#D1C9BF]">
                {scholarDetails?.title || 'वरिष्ठ वैदिक ज्योतिर्विद'} • प्रत्यक्ष निःशुल्क एवं सशुल्क परामर्श कक्ष
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { chitiSensory.playTick(); setIsOnline(!isOnline); }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-md ${
                  isOnline 
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30'
                    : 'bg-rose-500/20 border-rose-400/40 text-rose-300 hover:bg-rose-500/30'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                <span>{isOnline ? '🟢 सेवा में उपस्थित (Online)' : '⏸️ अवकाश पर (Offline)'}</span>
              </button>
            </div>
          </div>
        ) : (
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
        )}

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

                {!operatorAccess && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-600 dark:text-amber-400">
                    Case-level details require authenticated operator access. Aggregate statistics are shown.
                  </div>
                )}

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
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">
                        Recommended Canonical Service *
                      </label>
                      <span className="text-[10px] font-mono-data text-amber-500/80">
                        Dynamic Database Catalog
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.map(s => {
                        const isSelected = serviceSelected === s.code;
                        return (
                          <div
                            key={s.code}
                            onClick={() => setServiceSelected(s.code as any)}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                                : 'border-black/10 dark:border-white/10 hover:border-amber-500/30'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold text-[#1C1917] dark:text-white">
                                {s.code} ({s.durationMinutes}-Minute Consultation)
                              </div>
                              <div className="text-[11px] text-[#696256] dark:text-[#9E988D]">
                                {s.name}
                              </div>
                            </div>
                            <div className="text-base font-mono-data font-bold text-amber-500">
                              ₹{s.priceInr.toLocaleString('en-IN')}
                            </div>
                          </div>
                        );
                      })}
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
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={handleSimulatePaymentWebhook}
                            disabled={isVerifyingPayment}
                            className="w-full py-2 px-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/30 text-white font-mono-data font-bold text-[11px] shadow-md cursor-pointer flex items-center justify-center gap-2"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{isVerifyingPayment ? 'Verifying HMAC Signature...' : `[TEST RUNNER] Simulate Razorpay Signed Webhook (₹${selectedCase.amount})`}</span>
                          </button>
                          <p className="text-[10px] text-zinc-400 italic">
                            * In production, this state is triggered exclusively by Razorpay server webhook signature verification.
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs font-mono-data text-emerald-300 font-bold">
                          ✓ Payment Verified: {selectedCase.paymentId || 'RAZORPAY_VERIFIED'} ({selectedCase.paymentVerifiedAt})
                        </div>
                      )}
                    </div>

                    {/* Scholar Assignment */}
                    <div className="p-4 rounded-2xl bg-[#161B30] border border-white/10 space-y-2.5">
                      <div className="text-xs font-mono-data font-bold text-[#F0C968] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>Assign Senior Scholar (Configured Practitioners)</span>
                      </div>
                      <p className="text-[11px] font-mono-data text-[#9E988D]">
                        Unlocks only after server-verified payment evidence (INV_PAY_001).
                      </p>

                      <div className="flex flex-col gap-2">
                        {scholars.length > 0 ? (
                          scholars.map(scholar => (
                            <button
                              key={scholar.id}
                              type="button"
                              disabled={selectedCase.status === 'PAYMENT_PENDING'}
                              onClick={() => handleAssignScholar(scholar.id, scholar.name)}
                              className={`w-full py-2.5 px-3 rounded-xl text-xs font-mono-data font-bold shadow-md transition-all flex items-center justify-between ${
                                selectedCase.status === 'PAYMENT_PENDING'
                                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                                  : selectedCase.assignedScholar === scholar.name
                                  ? 'bg-emerald-600 text-white cursor-pointer'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black cursor-pointer hover:from-amber-400 hover:to-amber-500'
                              }`}
                            >
                              <span>{scholar.name} ({scholar.specialty})</span>
                              {selectedCase.assignedScholar === scholar.name ? <span>✓ Assigned</span> : <span>Assign →</span>}
                            </button>
                          ))
                        ) : (
                          <button
                            type="button"
                            disabled={selectedCase.status === 'PAYMENT_PENDING'}
                            onClick={() => handleAssignScholar('scholar_default', 'Pt. Vidyanand Shastri')}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-mono-data font-bold shadow-md transition-all flex items-center justify-center gap-1.5 ${
                              selectedCase.status === 'PAYMENT_PENDING'
                                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black cursor-pointer hover:from-amber-400 hover:to-amber-500'
                            }`}
                          >
                            <span>Pt. Vidyanand Shastri (Varanasi Lineage)</span>
                          </button>
                        )}
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
            {selectedCase ? (
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
            ) : (
              <div className="p-12 text-center rounded-3xl bg-[#0F1222] border border-white/10 text-white space-y-3">
                <Award className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="text-xl font-editorial font-bold">No Active Consultation Selected</h3>
                <p className="text-xs font-mono-data text-[#9E988D]">
                  Select a verified consultation case from the Help Desk queue to review the case brief and begin the paid session.
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </CosmicTantraShell>
  );
}

export default function PanditWorkspace() {
  return (
    <Suspense
      fallback={
        <CosmicTantraShell>
          <div className="max-w-7xl mx-auto px-4 py-20 text-center text-amber-300 font-mono-data text-sm">
            पंडित कार्यक्षेत्र लोड हो रहा है...
          </div>
        </CosmicTantraShell>
      }
    >
      <PanditWorkspaceInner />
    </Suspense>
  );
}
