'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft,
  User, 
  Phone, 
  Video, 
  FileText, 
  Award, 
  Bot, 
  Lock 
} from 'lucide-react';
import { getActiveProfile } from '@/lib/profileStore';
import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics';
import TrustBar from '@/components/visual/TrustBar';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import AIGuruChatbotModal from '@/components/consultation/AIGuruChatbotModal';
import HelpDeskCtaBanner from '@/components/helpdesk/HelpDeskCtaBanner';
import { chitiSensory } from '@/lib/chitiAudio';

// Loads the Razorpay Checkout script once
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

// AstroTalk-style example questions — one tap fills the textarea
const EXAMPLE_QUESTIONS = [
  'शादी कब होगी?',
  'नौकरी कब लगेगी?',
  'व्यापार में निवेश का शुभ योग?',
  'संतान संबंधी प्रश्न',
  'स्वास्थ्य चिंता का समाधान',
  'ग्रह शांति का उपाय?',
];

export default function AskQuestionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [isAiGuruOpen, setIsAiGuruOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'WRITTEN' | 'VOICE' | 'VIDEO' | 'PARIVAAR'>('WRITTEN');

  // Progressive 3-step journey: प्रश्न → जन्म विवरण → परामर्श एवं दक्षिणा
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    birthDate: '',
    birthTime: '',
    birthCity: 'Varanasi',
    birthLat: 25.3176,
    birthLon: 82.9739,
    timezone: 5.5,
    customerQuestion: '',
  });

  const tierPricing: Record<string, { amount: number; titleHi: string; titleEn: string; desc: string; descHi: string }> = {
    WRITTEN: {
      amount: 501,
      titleHi: 'लिखित विद्वत्-परामर्श पत्र',
      titleEn: 'Written Scholar Folio',
      desc: 'Verified PDF folio signed by Banaras scholar with planetary remedies',
      descHi: 'बनारस के विद्वान द्वारा हस्ताक्षरित सत्यापित PDF पत्र — ग्रह उपाय सहित'
    },
    VOICE: {
      amount: 1100,
      titleHi: 'गोपनीय प्रत्यक्ष वॉयस कॉल (15m)',
      titleEn: 'Encrypted Voice Call (15m)',
      desc: 'CallMe4 E2EE Number-Masked Audio Call with senior Pandit',
      descHi: 'CallMe4 एन्क्रिप्टेड नंबर-मास्क्ड ऑडियो कॉल — वरिष्ठ पंडित जी के साथ'
    },
    VIDEO: {
      amount: 1500,
      titleHi: 'साक्षात् वीडियो दर्शन (20m)',
      titleEn: 'HD Video Darshan Consult',
      desc: 'HD Video + Synchronized Live Kundali Review',
      descHi: 'HD वीडियो + सिंक्रनाइज़्ड लाइव कुण्डली समीक्षा'
    },
    PARIVAAR: {
      amount: 2100,
      titleHi: 'पारिवारिक कुण्डली महा-सत्र (30m)',
      titleEn: 'Parivaar Masterclass (30m)',
      desc: 'Full Family Multi-Chart Deep-Dive & Varshaphal',
      descHi: 'पूरे परिवार की बहु-कुण्डली गहन समीक्षा व वार्षिक फल (वर्षाफल)'
    },
  };

  // Prefill from active profile (returning visitor — saved Kundali flows in)
  useEffect(() => {
    const p = getActiveProfile();
    if (!p) return;
    setForm(f => ({
      ...f,
      customerName: f.customerName || p.name || '',
      birthDate: f.birthDate || p.birthDate || f.birthDate,
      birthTime: f.birthTime || p.birthTime || f.birthTime,
      birthCity: f.birthCity || p.birthCity || f.birthCity,
      birthLat: f.birthLat || p.lat || f.birthLat,
      birthLon: f.birthLon || p.lng || f.birthLon,
      timezone: f.timezone || p.tz || f.timezone,
    }));
  }, []);

  const setField = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  // Funnel instrumentation — which step do seekers reach/drop at
  useEffect(() => {
    analytics.track(ANALYTICS_EVENTS.ASK_STEP_VIEWED, { step });
  }, [step]);

  const validateStep = (s: 1 | 2 | 3): boolean => {
    const e: Record<string, string> = {};
    if (s === 1 && !form.customerQuestion.trim()) {
      e.customerQuestion = 'कृपया अपना प्रश्न लिखें — या नीचे दिए उदाहरण पर टैप करें।';
    }
    if (s === 2) {
      if (!form.customerName.trim()) e.customerName = 'कृपया अपना नाम लिखें।';
      if (!form.birthDate) e.birthDate = 'कृपया जन्म तिथि चुनें।';
      if (!form.birthTime && !birthTimeUnknown) e.birthTime = 'कृपया जन्म समय चुनें, या "समय नहीं पता" चुनें।';
    }
    if (s === 3) {
      if (!form.customerPhone.trim() || form.customerPhone.replace(/\D/g, '').length < 10) {
        e.customerPhone = 'कृपया वैध व्हाट्सएप/फोन नम्बर लिखें (कम से कम 10 अंक)।';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    chitiSensory.playTick();
    if (!validateStep(step)) return;
    setStep(s => (s === 1 ? 2 : s === 2 ? 3 : 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    chitiSensory.playTick();
    setStep(s => (s === 1 ? 1 : s === 2 ? 1 : 2));
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      // Jump to the first step that has an error
      if (!form.customerQuestion.trim()) setStep(1);
      else if (!form.customerName.trim() || !form.birthDate) setStep(2);
      else setStep(3);
      return;
    }

    setSubmitting(true);
    chitiSensory.playTick();
    const config = tierPricing[selectedTier];

    try {
      // Step 1: Create Order on Server
      const res = await fetch('/api/astrology/consultations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthTime: birthTimeUnknown ? '12:00' : form.birthTime,
          consultationMode: selectedTier,
          amount: config.amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ submit: data.error || 'ऑर्डर बनाने में त्रुटि — कृपया पुनः प्रयास करें।' });
        return;
      }

      // Step 2: Open Razorpay Gateway
      const Razorpay = await loadRazorpayCheckout();
      if (!Razorpay || !data.checkoutEnabled) {
        // Fallback simulation / test confirmation
        if (selectedTier === 'WRITTEN') {
          router.push(`/ask/success/${data.consultationId || data.orderId || 'CT-4821'}`);
        } else {
          router.push(`/consultation/room/${data.consultationId || 'CT-4821'}?mode=${selectedTier.toLowerCase()}&role=devotee`);
        }
        return;
      }

      const options = {
        key: data.razorpayKeyId || 'rzp_test_placeholder',
        amount: (data.amount || config.amount) * 100,
        currency: data.currency || 'INR',
        name: 'CosmicTantra',
        description: `${config.titleEn} (Banaras Scholar Tradition)`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: form.customerName,
          contact: form.customerPhone,
          email: form.customerEmail,
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

            if (selectedTier === 'WRITTEN') {
              router.push(`/ask/success/${data.consultationId}`);
            } else {
              router.push(`/consultation/room/${data.consultationId}?mode=${selectedTier.toLowerCase()}&role=devotee`);
            }
          } catch {
            router.push(`/consultation/room/${data.consultationId}?mode=${selectedTier.toLowerCase()}&role=devotee`);
          }
        },
      };

      const rzpInstance = new Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      setErrors({ submit: 'नेटवर्क त्रुटि — कृपया पुनः प्रयास करें।' });
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = [
    { n: 1, label: 'प्रश्न' },
    { n: 2, label: 'जन्म विवरण' },
    { n: 3, label: 'परामर्श एवं दक्षिणा' },
  ];

  const inputCls = (field: string) =>
    `w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D] ${
      errors[field] ? 'border-red-500/70' : 'border-black/10 dark:border-white/10'
    }`;

  return (
    <CosmicTantraShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center">

        <TrustBar />

        {/* Header */}
        <div className="mt-8 text-center max-w-xl">
          <div className="text-[10px] tracking-[3px] text-[#8E6F1D] dark:text-[#F0C968] font-mono-data font-bold uppercase">
            काशी विद्वत्-परम्परा • VEDIC SCHOLAR BENCH
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold mt-2">
            विद्वान् ज्योतिषी परामर्श
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#696256] dark:text-[#9E988D]">
            काशी हिन्दू विश्वविद्यालय एवं पारम्परिक वैदिक पीठ के प्रतिष्ठित विद्वानों से व्यक्तिगत कुण्डली परामर्श।
            AI पूर्व-गणना (Pre-Context) एवं CallMe4 100% गोपनीय कॉलिंग।
          </p>
        </div>

        {/* 3-Step Progress Indicator */}
        <div className="mt-6 mb-2 w-full max-w-xl flex items-center justify-between px-1" aria-label="प्रगति">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <button
                type="button"
                onClick={() => { if (s.n < step) { chitiSensory.playTick(); setStep(s.n as 1 | 2 | 3); } }}
                className={`flex items-center gap-2 ${s.n <= step ? 'text-[#8E6F1D] dark:text-[#F0C968]' : 'text-[#696256]/60 dark:text-[#9E988D]/60'} ${s.n < step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-mono-data border ${
                    s.n < step
                      ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black border-transparent'
                      : s.n === step
                        ? 'border-[#8E6F1D] dark:border-[#D4AF37] bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10'
                        : 'border-black/15 dark:border-white/15'
                  }`}
                >
                  {s.n < step ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </span>
                <span className="text-[10px] sm:text-xs font-bold font-mono-data">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${s.n < step ? 'bg-[#8E6F1D] dark:bg-[#D4AF37]' : 'bg-black/10 dark:bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ═══════════ STEP 1 — YOUR QUESTION ═══════════ */}
        {step === 1 && (
          <div className="max-w-xl w-full mt-4 space-y-4">
            <div className="bg-white dark:bg-[#0E101D] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl text-left space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#696256] dark:text-[#9E988D] mb-2">
                  पंडित जी हेतु आपका मुख्य प्रश्न या परिस्थिति *
                </label>
                <textarea
                  rows={4}
                  autoFocus
                  className={inputCls('customerQuestion') + ' leading-relaxed'}
                  value={form.customerQuestion}
                  onChange={e => setField('customerQuestion', e.target.value)}
                  placeholder="उदा. व्यापार में नया निवेश व साझेदारी करने हेतु आगामी ६ माह में क्या शुभ योग हैं?"
                />
                {errors.customerQuestion && (
                  <p className="mt-1.5 text-[11px] text-red-500 font-medium">{errors.customerQuestion}</p>
                )}
              </div>

              <div>
                <div className="text-[10px] font-bold text-[#696256] dark:text-[#9E988D] uppercase tracking-wider mb-2">
                  एक टैप में प्रश्न चुनें:
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_QUESTIONS.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { chitiSensory.playTick(); setField('customerQuestion', q); }}
                      className="px-3 py-1.5 rounded-full border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-[#8E6F1D]/5 dark:bg-[#D4AF37]/10 text-[11px] font-bold text-[#1C1917] dark:text-[#F0C968] hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={goNext}
                className="w-full py-3.5 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform cursor-pointer shadow-md"
              >
                <span>आगे बढ़ें — जन्म विवरण →</span>
              </button>
            </div>

            {/* Free alternative — AI Guru (contextual, secondary) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#8E6F1D]/15 via-[#FAF7F2] to-[#D4AF37]/20 dark:from-[#D4AF37]/15 dark:via-[#0E101D] dark:to-[#8E6F1D]/20 border-2 border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8E6F1D] to-[#D4AF37] flex items-center justify-center text-white shadow-md shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#1C1917] dark:text-white">
                    <span>पहले मुफ़्त पूछना चाहते हैं?</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">मुफ़्त</span>
                  </div>
                  <p className="text-[11px] text-[#696256] dark:text-[#9E988D]">
                    AI गुरु से वार्तालाप प्रारम्भ करें — त्वरित वैदिक पल्स रिपोर्ट पाएं।
                  </p>
                </div>
              </div>
              <button
                onClick={() => { chitiSensory.playTick(); setIsAiGuruOpen(true); }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border-2 border-[#8E6F1D] dark:border-[#D4AF37] text-[#8E6F1D] dark:text-[#F0C968] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#8E6F1D]/10 dark:hover:bg-[#D4AF37]/10 transition-colors cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI गुरु से पूछें →</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 2 — BIRTH DETAILS ═══════════ */}
        {step === 2 && (
          <div className="max-w-xl w-full mt-4">
            <div className="bg-white dark:bg-[#0E101D] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl text-left space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#696256] dark:text-[#9E988D] mb-1">
                  आपका पूरा नाम (Full Name) *
                </label>
                <input
                  type="text"
                  autoFocus
                  className={inputCls('customerName')}
                  value={form.customerName}
                  onChange={e => setField('customerName', e.target.value)}
                  placeholder="उदा. राहुल शर्मा"
                />
                {errors.customerName && <p className="mt-1.5 text-[11px] text-red-500 font-medium">{errors.customerName}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">जन्म तिथि *</label>
                  <input
                    type="date"
                    className={inputCls('birthDate')}
                    value={form.birthDate}
                    onChange={e => setField('birthDate', e.target.value)}
                  />
                  {errors.birthDate && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.birthDate}</p>}
                </div>
                <div>
                  <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">जन्म समय *</label>
                  <input
                    type="time"
                    disabled={birthTimeUnknown}
                    className={inputCls('birthTime') + ' disabled:opacity-60'}
                    value={birthTimeUnknown ? '12:00' : form.birthTime}
                    onChange={e => setField('birthTime', e.target.value)}
                  />
                  <label className="flex items-start gap-1.5 mt-1.5 text-[10px] text-[#696256] dark:text-[#9E988D] cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={birthTimeUnknown}
                      onChange={(e) => {
                        setBirthTimeUnknown(e.target.checked);
                        setField('birthTime', e.target.checked ? '12:00' : '');
                      }}
                      className="mt-0.5 cursor-pointer accent-[#8E6F1D]"
                    />
                    <span>समय नहीं पता</span>
                  </label>
                  {errors.birthTime && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.birthTime}</p>}
                </div>
                <div>
                  <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">जन्म स्थान *</label>
                  <input
                    type="text"
                    className={inputCls('birthCity')}
                    value={form.birthCity}
                    onChange={e => setField('birthCity', e.target.value)}
                    placeholder="Varanasi"
                  />
                </div>
              </div>

              {birthTimeUnknown && (
                <p className="text-[11px] leading-relaxed text-[#A6461D] dark:text-[#E2825B] font-medium bg-amber-500/5 border border-amber-500/25 rounded-xl p-3">
                  ⓘ बिना समय के चन्द्र राशि व नक्षत्र शुद्ध रहते हैं, परन्तु लग्न सटीक नहीं होगा — पंडित जी आपके साथ जन्म समय शोधन (rectification) करेंगे।
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  onClick={goBack}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-black/15 dark:border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 hover:border-[#8E6F1D] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>वापस</span>
                </button>
                <button
                  onClick={goNext}
                  className="w-full sm:flex-1 py-3.5 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform cursor-pointer shadow-md"
                >
                  <span>आगे बढ़ें — परामर्श चुनें →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 3 — PACKAGE, CONTACT & DAKSHINA ═══════════ */}
        {step === 3 && (
          <div className="max-w-xl w-full mt-4 space-y-4">
            {/* Recap */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#12141F] border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 text-left">
              <div className="text-[10px] font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider mb-2">
                आपका प्रश्न (सारांश)
              </div>
              <p className="text-xs text-[#1C1917] dark:text-white leading-relaxed line-clamp-3">“{form.customerQuestion}”</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono-data font-bold">
                <span className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">{form.customerName || '—'}</span>
                <span className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">{form.birthDate || '—'}</span>
                <span className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">{birthTimeUnknown ? 'समय अज्ञात' : form.birthTime}</span>
                <span className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">{form.birthCity || '—'}</span>
              </div>
            </div>

            {/* Package selector */}
            <div className="space-y-2 text-left">
              <div className="text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
                परामर्श पैकेज चुनें (Select Package):
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(tierPricing).map(([key, item]) => {
                  const isSelected = selectedTier === key;
                  return (
                    <div
                      key={key}
                      onClick={() => { chitiSensory.playTick(); setSelectedTier(key as any); }}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#8E6F1D] dark:border-[#D4AF37] bg-[#FAF7F2] dark:bg-[#151828] shadow-md'
                          : 'border-black/10 dark:border-white/10 bg-white dark:bg-[#0E101D] hover:border-[#8E6F1D]/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#1C1917] dark:text-white">
                            {item.titleHi}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968] shrink-0" />}
                        </div>
                        <p className="text-[10px] text-[#696256] dark:text-[#9E988D] line-clamp-2">
                          {item.descHi}
                        </p>
                      </div>
                      <div className="mt-2 text-base font-bold font-mono-data text-[#8E6F1D] dark:text-[#F0C968]">
                        ₹{item.amount}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white dark:bg-[#0E101D] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl text-left space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#696256] dark:text-[#9E988D] mb-1">
                    व्हाट्सएप / फोन नम्बर (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    className={inputCls('customerPhone')}
                    value={form.customerPhone}
                    onChange={e => setField('customerPhone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                  {errors.customerPhone && <p className="mt-1.5 text-[11px] text-red-500 font-medium">{errors.customerPhone}</p>}
                  <span className="text-[10px] text-[#696256] dark:text-[#9E988D]">🔒 100% CallMe4 सुरक्षित — पंडित जी को नम्बर नहीं दिखता</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#696256] dark:text-[#9E988D] mb-1">
                    ईमेल (लिखित पत्र प्राप्ति हेतु)
                  </label>
                  <input
                    type="email"
                    className={inputCls('customerEmail')}
                    value={form.customerEmail}
                    onChange={e => setField('customerEmail', e.target.value)}
                    placeholder="name@gmail.com"
                  />
                </div>
              </div>

              {errors.submit && (
                <p className="text-[11px] text-red-500 font-medium bg-red-500/5 border border-red-500/25 rounded-xl p-3">{errors.submit}</p>
              )}

              <div className="pt-3 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-[#696256] dark:text-[#9E988D]">कुल दक्षिणा राशि (Razorpay UPI / Cards):</div>
                  <div className="text-2xl font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                    ₹{tierPricing[selectedTier].amount}
                  </div>
                  <div className="text-[10px] text-[#696256] dark:text-[#9E988D]">नियत दक्षिणा — कोई प्रति-मिनट शुल्क नहीं, कोई छिपा शुल्क नहीं।</div>
                </div>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch gap-2">
                  <button
                    onClick={goBack}
                    className="px-5 py-3 rounded-2xl border border-black/15 dark:border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 hover:border-[#8E6F1D] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>वापस</span>
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3.5 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <span>{submitting ? 'प्रक्रिया जारी...' : `दक्षिणा ₹${tierPricing[selectedTier].amount} दें एवं परामर्श प्रारम्भ करें →`}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Contextual free help at the moment of payment */}
            <HelpDeskCtaBanner source="ASK" topic={form.customerQuestion} />
          </div>
        )}

        {/* AI GURU CHATBOT MODAL INSTANCE */}
        <AIGuruChatbotModal
          isOpen={isAiGuruOpen}
          onClose={() => setIsAiGuruOpen(false)}
          lang="hi"
          onConsultationBooked={(cId, mode) => {
            setIsAiGuruOpen(false);
            if (mode === 'WRITTEN') {
              router.push(`/ask/success/${cId}`);
            } else {
              router.push(`/consultation/room/${cId}?mode=${mode.toLowerCase()}&role=devotee`);
            }
          }}
        />

      </div>
    </CosmicTantraShell>
  );
}
