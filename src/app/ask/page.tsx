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
  User, 
  Phone, 
  Video, 
  FileText, 
  Award, 
  Bot, 
  Lock 
} from 'lucide-react';
import { getActiveProfile } from '@/lib/profileStore';
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

export default function AskQuestionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showOtpHint, setShowOtpHint] = useState(false);
  const [isAiGuruOpen, setIsAiGuruOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'WRITTEN' | 'VOICE' | 'VIDEO' | 'PARIVAAR'>('WRITTEN');

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    birthDate: '1995-06-15',
    birthTime: '10:30',
    birthCity: 'Varanasi',
    birthLat: 25.3176,
    birthLon: 82.9739,
    timezone: 5.5,
    customerQuestion: '',
  });

  const tierPricing: Record<string, { amount: number; titleHi: string; titleEn: string; desc: string }> = {
    WRITTEN: { amount: 501, titleHi: 'लिखित विद्वत्-परामर्श पत्र', titleEn: 'Written Scholar Folio', desc: 'Verified PDF folio signed by Banaras scholar with planetary remedies' },
    VOICE: { amount: 1100, titleHi: 'गोपनीय प्रत्यक्ष वॉयस कॉल (15m)', titleEn: 'Encrypted Voice Call (15m)', desc: 'CallMe4 E2EE Number-Masked Audio Call with senior Pandit' },
    VIDEO: { amount: 1500, titleHi: 'साक्षात् वीडियो दर्शन (20m)', titleEn: 'HD Video Darshan Consult', desc: 'HD Video + Synchronized Live Kundali Review' },
    PARIVAAR: { amount: 2100, titleHi: 'पारिवारिक कुण्डली महा-सत्र (30m)', titleEn: 'Parivaar Masterclass (30m)', desc: 'Full Family Multi-Chart Deep-Dive & Varshaphal' },
  };

  // Prefill from active profile
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.customerQuestion) {
      alert('कृपया अपना नाम, व्हाट्सएप नंबर एवं प्रश्न अनिवार्य रूप से भरें।');
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
          consultationMode: selectedTier,
          amount: config.amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create consultation order');
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
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CosmicTantraShell>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col items-center font-mono-data">
        <TrustBar />

        {/* Header */}
        <div className="max-w-xl w-full mb-6 text-center mt-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>काशी विद्वत्-परम्परा • VEDIC SCHOLAR BENCH</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-[#1C1917] dark:text-white">
            विद्वान् ज्योतिषी परामर्श
          </h1>

          <p className="text-xs sm:text-sm text-[#696256] dark:text-[#9E988D] leading-relaxed">
            काशी हिन्दू विश्वविद्यालय एवं पारम्परिक वैदिक पीठ के प्रतिष्ठित विद्वानों से व्यक्तिगत कुण्डली परामर्श। AI पूर्व-गणना (Pre-Context) एवं CallMe4 100% गोपनीय कॉलिंग।
          </p>
        </div>

        {/* PROMINENT AI GURU CHATBOT CTA BANNER */}
        <div className="max-w-xl w-full mb-8 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#8E6F1D]/15 via-[#FAF7F2] to-[#D4AF37]/20 dark:from-[#D4AF37]/15 dark:via-[#0E101D] dark:to-[#8E6F1D]/20 border-2 border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8E6F1D] to-[#D4AF37] flex items-center justify-center text-white text-xl shadow-md shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1C1917] dark:text-white">
                <span>AI गुरु के साथ चैट वार्तालाप</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">
                  मुफ़्त प्रारम्भ
                </span>
              </div>
              <p className="text-[11px] text-[#696256] dark:text-[#9E988D]">
                चैट में विवरण दें, त्वरित वैदिक पल्स रिपोर्ट पाएं और सीधे पंडित जी से जुड़ें।
              </p>
            </div>
          </div>

          <button
            onClick={() => { chitiSensory.playTick(); setIsAiGuruOpen(true); }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center justify-center gap-2 hover:scale-105 transition-transform cursor-pointer shadow-md shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI गुरु वार्तालाप प्रारम्भ करें →</span>
          </button>
        </div>

        {/* Free WhatsApp Help Desk Direct CTA */}
        <div className="max-w-xl w-full mb-6">
          <HelpDeskCtaBanner source="ASK" topic={form.customerQuestion} />
        </div>

        {/* 4 SERVICE TIERS SELECTOR */}
        <div className="max-w-xl w-full mb-6 space-y-2 text-left">
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
                    </div>
                    <p className="text-[10px] text-[#696256] dark:text-[#9E988D] line-clamp-2">
                      {item.desc}
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

        {/* DIRECT ORDER FORM */}
        <div className="max-w-xl w-full bg-white dark:bg-[#0E101D] border border-black/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl text-left">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-[#696256] dark:text-[#9E988D] mb-1">
                आपका पूरा नाम (Full Name) *
              </label>
              <input
                type="text"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })}
                placeholder="उदा. राहुल शर्मा"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#696256] dark:text-[#9E988D] mb-1">
                  व्हाट्सएप / फोन नम्बर (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                  value={form.customerPhone}
                  onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
                <span className="text-[10px] text-[#696256] dark:text-[#9E988D]">🔒 100% CallMe4 सुरक्षित — पंडित जी को नम्बर नहीं दिखता</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#696256] dark:text-[#9E988D] mb-1">
                  ईमेल (लिखित पत्र प्राप्ति हेतु)
                </label>
                <input
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                  value={form.customerEmail}
                  onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                  placeholder="name@gmail.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">जन्म तिथि *</label>
                <input
                  type="date"
                  required
                  className="w-full px-2.5 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                  value={form.birthDate}
                  onChange={e => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">जन्म समय *</label>
                <input
                  type="time"
                  required
                  className="w-full px-2.5 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                  value={form.birthTime}
                  onChange={e => setForm({ ...form, birthTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">जन्म स्थान *</label>
                <input
                  type="text"
                  required
                  className="w-full px-2.5 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                  value={form.birthCity}
                  onChange={e => setForm({ ...form, birthCity: e.target.value })}
                  placeholder="Varanasi"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#696256] dark:text-[#9E988D] mb-1">
                पंडित जी हेतु आपका मुख्य प्रश्न या परिस्थिति *
              </label>
              <textarea
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D] leading-relaxed"
                value={form.customerQuestion}
                onChange={e => setForm({ ...form, customerQuestion: e.target.value })}
                placeholder="उदा. व्यापार में नया निवेश व साझेदारी करने हेतु आगामी ६ माह में क्या शुभ योग हैं?"
              />
            </div>

            {/* Submit Bar */}
            <div className="pt-3 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-[11px] text-[#696256] dark:text-[#9E988D]">कुल दक्षिणा राशि (Razorpay UPI / Cards):</div>
                <div className="text-2xl font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                  ₹{tierPricing[selectedTier].amount}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'प्रक्रिया जारी...' : `दक्षिणा ₹${tierPricing[selectedTier].amount} दें एवं परामर्श प्रारम्भ करें →`}</span>
              </button>
            </div>

          </form>
        </div>

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
