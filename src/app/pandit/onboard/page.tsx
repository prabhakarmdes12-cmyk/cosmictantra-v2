'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Sparkles, 
  Award, 
  BookOpen, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  DollarSign, 
  Building, 
  FileText, 
  Upload,
  Clock,
  Lock
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';

export default function PanditOnboardPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    honorific: 'Pt.',
    fullName: '',
    phone: '',
    email: '',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    sampradaya: 'Banaras Hindu University (BHU)',
    experienceYears: '12',
    specialties: ['Parashari Jyotish', 'Muhurat Calculation', 'Vedic Upaya & Yantra'],
    languages: ['Hindi', 'Sanskrit', 'English'],
    payoutUpiId: '',
    payoutAccountNo: '',
    payoutIfsc: '',
    bio: '',
    agreeTerms: true,
  });

  const availableSpecialties = [
    'Parashari Jyotish',
    'Jaimini Sutras',
    'Prashna Kundali (Horary)',
    'Muhurat Calculation',
    'Vedic Upaya & Yantra',
    'Kundali Milan & Compatibility',
    'Medical Astrology (Ayur-Jyotish)',
    'Vastu Shastra',
  ];

  const availableLanguages = [
    'Hindi',
    'Sanskrit',
    'English',
    'Bengali',
    'Marathi',
    'Gujarati',
    'Tamil',
    'Telugu',
  ];

  const toggleSpecialty = (spec: string) => {
    chitiSensory.playTick();
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter(s => s !== spec)
        : [...prev.specialties, spec]
    }));
  };

  const toggleLanguage = (lang: string) => {
    chitiSensory.playTick();
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.payoutUpiId) {
      alert('कृपया अपना नाम, फोन नंबर एवं UPI ID अनिवार्य रूप से भरें।');
      return;
    }

    setSubmitting(true);
    chitiSensory.playTick();

    try {
      const res = await fetch('/api/astrology/practitioners/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Show success
      chitiSensory.playBell();
      setSubmitted(true);
    } catch (err) {
      chitiSensory.playBell();
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CosmicTantraShell shellMode="scholar" footerMode="full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-mono-data">
        
        {/* HERO BANNER */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>काशी विद्वत्-परिषद् • PANDIT ONBOARDING NETWORK</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-[#1C1917] dark:text-white">
            विद्वान् ज्योतिषी ऑनबोर्डिंग पोर्टल
          </h1>

          <p className="text-xs sm:text-sm text-[#696256] dark:text-[#9E988D] max-w-2xl mx-auto leading-relaxed">
            भारत के प्रतिष्ठित वैदिक विद्वानों, आचार्यों एवं ज्योतिषविदों को प्रत्यक्ष परामर्श व दैनिक आय अर्जन हेतु आमंत्रित किया जाता है। AI पूर्व-गणना (Pre-Context) एवं CallMe4 100% गोपनीय कॉलिंग प्रणाली।
          </p>
        </div>

        {/* 3 VALUE CARDS FOR SCHOLARS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 space-y-2 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
              ⚡
            </div>
            <div className="font-bold text-sm text-[#1C1917] dark:text-white">AI पूर्व-तैयार कुण्डली</div>
            <p className="text-[11px] text-[#696256] dark:text-[#9E988D] leading-relaxed">
              कॉल से पूर्व ही जातक का जन्म विवरण, ग्रह स्थिति, दशा व प्राथमिक फलकथन आपकी स्क्रीन पर उपलब्ध रहता है।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0E101D] border border-emerald-500/25 dark:border-emerald-500/30 space-y-2 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              🔒
            </div>
            <div className="font-bold text-sm text-[#1C1917] dark:text-white">100% गोपनीय कॉलिंग</div>
            <p className="text-[11px] text-[#696256] dark:text-[#9E988D] leading-relaxed">
              CallMe4 सुरक्षित प्रणाली — आपका व्यक्तिगत फोन नम्बर या व्हाट्सएप कभी भी जातक को प्रदर्शित नहीं होता।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0E101D] border border-indigo-500/25 dark:border-indigo-500/30 space-y-2 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
              💳
            </div>
            <div className="font-bold text-sm text-[#1C1917] dark:text-white">८०% सम्मानजनक आय</div>
            <p className="text-[11px] text-[#696256] dark:text-[#9E988D] leading-relaxed">
              प्रत्येक १५-मिनट कॉल पर ₹८८० एवं लिखित पत्र पर ₹४०० की सीधी दैनिक UPI सेटलमेंट (Razorpay Route)।
            </p>
          </div>
        </div>

        {/* MAIN REGISTRATION FORM OR SUCCESS */}
        {submitted ? (
          <div className="bg-white dark:bg-[#0E101D] border border-emerald-500/40 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white">
                पंडित ऑनबोर्डिंग आवेदन स्वीकृत हुआ!
              </h3>
              <p className="text-xs sm:text-sm text-[#696256] dark:text-[#9E988D] max-w-md mx-auto leading-relaxed">
                प्रणाम {formData.honorific} {formData.fullName} जी! आपका विद्वत् प्रोफाइल काशी विद्यापीठ सत्यापन टीम को प्रेषित हो चुका है। आप तत्काल अपने विद्वान् कार्यस्थल (Scholar Workbench) का परीक्षण कर सकते हैं:
              </p>
            </div>

            <div className="pt-3">
              <Link
                href="/pandit/workspace"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs shadow-lg hover:scale-105 transition-all"
              >
                <span>विद्वान् कार्यस्थल खोलें (Open Pandit Workbench) →</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
            
            <div className="border-b border-black/10 dark:border-white/10 pb-3 flex items-center justify-between">
              <h2 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-white">
                विद्वान् पंजीकरण विवरण
              </h2>
              <span className="text-xs text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                चरण १ / १
              </span>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">उपाधि (Title) *</label>
                <select
                  value={formData.honorific}
                  onChange={(e) => setFormData({ ...formData, honorific: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs font-bold text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                >
                  <option value="Pt.">पंडित (Pt.)</option>
                  <option value="Acharya">आचार्य (Acharya)</option>
                  <option value="Shastri">शास्त्री (Shastri)</option>
                  <option value="Jyotishacharya">ज्योतिषाचार्य (Jyotishacharya)</option>
                  <option value="Dr.">डॉक्टर (Dr. - Ph.D Jyotish)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">पूरा नाम (Full Legal Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. विद्यानंद शास्त्री"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                />
              </div>
            </div>

            {/* Contact & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">व्हाट्सएप / फोन नम्बर (Verification Only) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                />
                <span className="text-[10px] text-[#696256] dark:text-[#9E988D]">जातक को कभी दिखाई नहीं देगा (100% Masked)</span>
              </div>

              <div>
                <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">ईमेल पता (Email)</label>
                <input
                  type="email"
                  placeholder="vidyanand@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                />
              </div>
            </div>

            {/* Institution & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">संस्थान / परम्परा (Institution / Math) *</label>
                <select
                  value={formData.sampradaya}
                  onChange={(e) => setFormData({ ...formData, sampradaya: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                >
                  <option value="Banaras Hindu University (BHU)">काशी हिन्दू विश्वविद्यालय (BHU, Varanasi)</option>
                  <option value="Sampurnanand Sanskrit University">सम्पूर्णानन्द संस्कृत विश्वविद्यालय (Varanasi)</option>
                  <option value="Traditional Kashi Gurukul">पारम्परिक काशी वैदिक गुरुकुल</option>
                  <option value="Ujjain Maharshi Sandipani">महर्षि सांदीपनि राष्ट्रीय वेद विद्या प्रतिष्ठान (Ujjain)</option>
                  <option value="Haridwar Gurukul Kangri">गुरुकुल कांगड़ी विश्वविद्यालय (Haridwar)</option>
                  <option value="Ayodhya Vidvat Mandal">अयोध्या धाम विद्वत् परिषद्</option>
                </select>
              </div>

              <div>
                <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">ज्योतिष अनुभव (वर्षों में) *</label>
                <input
                  type="number"
                  required
                  min="3"
                  max="60"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                />
              </div>
            </div>

            {/* Specialties Selector */}
            <div className="space-y-2">
              <label className="block text-xs text-[#696256] dark:text-[#9E988D] font-bold">
                मुख्य ज्योतिष विधाएं (Specialties) *
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSpecialties.map(s => {
                  const isSelected = formData.specialties.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSpecialty(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#080A10] shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 text-[#696256] dark:text-[#9E988D] hover:bg-black/10'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Payout / UPI Details */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#8E6F1D] dark:text-[#F0C968]">
                <DollarSign className="w-4 h-4" />
                <span>दैनिक आय भुगतान विवरण (Daily Razorpay Route Payout) *</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">UPI ID (त्वरित दैनिक ट्रांसफर हेतु) *</label>
                  <input
                    type="text"
                    required
                    placeholder="vidyanand@upi या 9876543210@paytm"
                    value={formData.payoutUpiId}
                    onChange={(e) => setFormData({ ...formData, payoutUpiId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                  />
                </div>
                <div>
                  <label className="block text-[#696256] dark:text-[#9E988D] font-bold mb-1">बैंक खाता संख्या (वैकल्पिक)</label>
                  <input
                    type="text"
                    placeholder="123456789012"
                    value={formData.payoutAccountNo}
                    onChange={(e) => setFormData({ ...formData, payoutAccountNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#8E6F1D]"
                  />
                </div>
              </div>
            </div>

            {/* Terms Agreement & Submit */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-xs text-[#696256] dark:text-[#9E988D] cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="rounded border-black/20 text-[#8E6F1D]"
                />
                <span>मैं काशी विद्वत् आचार संहिता एवं गोपनीयता मानकों का पालन करने हेतु सहमत हूँ।</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'सत्यापन जारी...' : 'विद्वान् पंजीकरण पूर्ण करें →'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </CosmicTantraShell>
  );
}
