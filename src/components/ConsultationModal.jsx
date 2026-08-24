import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { chitiSensory } from '../lib/chitiAudio';

export default function ConsultationModal({
  isOpen,
  onClose,
  initialQuestion = '',
  kundaliData,
  lang = 'en',
  theme = 'dark'
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: kundaliData?.meta?.birthDate || '1995-05-15',
    birthTime: kundaliData?.meta?.birthTime || '14:30',
    birthPlace: kundaliData?.meta?.locationName || 'Dhanbad, Jharkhand',
    category: 'Career & Business Decision',
    question: initialQuestion || '',
    language: lang === 'hi' ? 'Hindi (शुद्ध हिंदी विवेचना)' : 'English Synthesis'
  });

  const [step, setStep] = useState('FORM'); // 'FORM' | 'CONFIRM' | 'SUCCESS'

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    chitiSensory.playTick();
    analytics.track(ANALYTICS_EVENTS.CHECKOUT_STARTED, { category: formData.category });
    setStep('CONFIRM');
  };

  const handleCompleteOrder = () => {
    chitiSensory.playTick();
    analytics.track(ANALYTICS_EVENTS.PAYMENT_COMPLETED, { amount: 199, category: formData.category });
    setStep('SUCCESS');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-black/[0.1] dark:border-white/[0.1] p-6 sm:p-7 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto font-mono-data">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
          <div>
            <div className="text-[9px] uppercase text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
              {lang === 'hi' ? 'लिखित विद्वत्-परामर्श • निश्चित दक्षिणा ₹१९९' : 'FOCUSED WRITTEN COUNSEL • ₹199'}
            </div>
            <h3 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-[#EFECE6] mt-0.5">
              {lang === 'hi' ? 'काशी के विद्वान् से परामर्श प्राप्त करें' : 'Consult a Practicing Scholar'}
            </h3>
          </div>
          <button 
            onClick={() => {
              chitiSensory.playTick();
              onClose();
            }}
            className="p-1 rounded text-[#857E74] dark:text-[#8E8A82] hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'FORM' && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Identity Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[#57524A] dark:text-[#8E8A82] font-bold">
                  {lang === 'hi' ? 'पूरा नाम' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'hi' ? 'आपका नाम' : 'Your Name'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#57524A] dark:text-[#8E8A82] font-bold">
                  {lang === 'hi' ? 'ईमेल (परामर्श पत्र प्राप्ति हेतु)' : 'Email (For Written Report)'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Birth Details */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.06] dark:border-white/[0.06] space-y-2.5">
              <div className="text-[10px] text-[#8E6F1D] dark:text-[#D4AF37] flex items-center justify-between font-bold">
                <span>{lang === 'hi' ? 'जन्म विवरण (सटीक निरयण खगोल गणना हेतु)' : 'Exact Birth Coordinates (For Deterministic Ephemeris)'}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[#857E74] dark:text-[#6B6760] text-[10px]">{lang === 'hi' ? 'जन्म तिथि' : 'Date of Birth'}</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0B0C11] border border-black/[0.08] dark:border-white/[0.08] text-xs text-[#1C1917] dark:text-[#EFECE6]"
                  />
                </div>
                <div>
                  <label className="text-[#857E74] dark:text-[#6B6760] text-[10px]">{lang === 'hi' ? 'जन्म समय' : 'Time of Birth'}</label>
                  <input
                    type="time"
                    required
                    value={formData.birthTime}
                    onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0B0C11] border border-black/[0.08] dark:border-white/[0.08] text-xs text-[#1C1917] dark:text-[#EFECE6]"
                  />
                </div>
                <div>
                  <label className="text-[#857E74] dark:text-[#6B6760] text-[10px]">{lang === 'hi' ? 'जन्म स्थान' : 'Birth Place'}</label>
                  <input
                    type="text"
                    required
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0B0C11] border border-black/[0.08] dark:border-white/[0.08] text-xs text-[#1C1917] dark:text-[#EFECE6]"
                  />
                </div>
              </div>
            </div>

            {/* Category & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[#57524A] dark:text-[#8E8A82] font-bold">
                  {lang === 'hi' ? 'निर्णय कार्यक्षेत्र' : 'Decision Domain'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6]"
                >
                  <option>Career & Business Decision</option>
                  <option>Marriage & Relationship Guidance</option>
                  <option>Personalised Muhurat Selection</option>
                  <option>Dasha Transition & Timing</option>
                  <option>Health & Ancestral Remedies</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[#57524A] dark:text-[#8E8A82] font-bold">
                  {lang === 'hi' ? 'परामर्श भाषा' : 'Report Delivery Language'}
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6]"
                >
                  <option>Hindi (शुद्ध हिंदी विवेचना)</option>
                  <option>English Synthesis</option>
                  <option>Marathi (मराठी)</option>
                  <option>Gujarati (ગુજરાતી)</option>
                  <option>Bengali (বাংলা)</option>
                </select>
              </div>
            </div>

            {/* Specific Question */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[#57524A] dark:text-[#8E8A82] font-bold">
                  {lang === 'hi' ? 'आपका विशिष्ट प्रश्न' : 'Your Specific Question'}
                </label>
                <span className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5]">
                  {lang === 'hi' ? 'यथासम्भव स्पष्ट लिखें' : 'Be as precise as possible'}
                </span>
              </div>
              <textarea
                required
                rows={3}
                placeholder={lang === 'hi' ? 'उदा. मैं अक्टूबर में नया उद्यम आरम्भ करने की योजना बना रहा हूँ। मेरे दशमेश एवं गुरु दशा के अनुसार यह समय कैसा रहेगा?' : 'Example: I am considering switching to a new venture in October. What does my 10th lord and active Dasha indicate?'}
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Price Row */}
            <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-[#1C1917] dark:text-[#EFECE6]">
                  {lang === 'hi' ? 'निश्चित दक्षिणा: ₹१९९' : 'Honorarium: ₹199'}
                </div>
                <div className="text-[10px] text-[#857E74] dark:text-[#6B6760]">
                  {lang === 'hi' ? 'खगोलीय गणना + विद्वत्-विवेचन पत्र सम्मिलित' : 'Includes Sidereal Ephemeris + Scholar Review'}
                </div>
              </div>
              <span className="text-[11px] text-[#0F6B43] dark:text-[#34d399] font-bold">
                {lang === 'hi' ? 'कोई अप्रत्यक्ष शुल्क नहीं' : 'No Hidden Fees'}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-[#060709] font-bold text-xs uppercase tracking-wider hover:bg-[#E5C378] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{lang === 'hi' ? 'समीक्षा हेतु आगे बढ़ें →' : 'Proceed to Review Summary →'}</span>
            </button>
          </form>
        )}

        {step === 'CONFIRM' && (
          <div className="space-y-4 animate-in fade-in text-xs">
            <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.08] dark:border-white/[0.08] space-y-2.5">
              <div className="font-bold text-sm text-[#1C1917] dark:text-[#EFECE6] pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
                {lang === 'hi' ? 'परामर्श सारांश' : 'Consultation Summary'}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[#57524A] dark:text-[#AAA49A]">
                <div><span className="text-[#857E74] dark:text-[#6B6760]">{lang === 'hi' ? 'जिज्ञासु:' : 'Seeker:'}</span> {formData.name}</div>
                <div><span className="text-[#857E74] dark:text-[#6B6760]">{lang === 'hi' ? 'ईमेल:' : 'Email:'}</span> {formData.email}</div>
                <div><span className="text-[#857E74] dark:text-[#6B6760]">{lang === 'hi' ? 'जन्म समय:' : 'Birth:'}</span> {formData.birthDate} at {formData.birthTime}</div>
                <div><span className="text-[#857E74] dark:text-[#6B6760]">{lang === 'hi' ? 'स्थान:' : 'Place:'}</span> {formData.birthPlace}</div>
                <div><span className="text-[#857E74] dark:text-[#6B6760]">{lang === 'hi' ? 'क्षेत्र:' : 'Domain:'}</span> {formData.category}</div>
                <div><span className="text-[#857E74] dark:text-[#6B6760]">{lang === 'hi' ? 'भाषा:' : 'Language:'}</span> {formData.language}</div>
              </div>
              <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <span className="text-[#857E74] dark:text-[#6B6760] block mb-1">{lang === 'hi' ? 'आपका प्रश्न:' : 'Your Inquiry:'}</span>
                <p className="text-xs font-semibold text-[#1C1917] dark:text-[#EFECE6] italic">"{formData.question}"</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#EBF7F0] dark:bg-[#08120c] border border-[#10b981]/30 text-xs text-[#0F6B43] dark:text-[#34d399] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{lang === 'hi' ? 'काशी हिन्दू विश्वविद्यालय विद्वत्-परम्परा के विद्वान् द्वारा २४ घण्टे में लिखित पत्र प्राप्ति।' : 'Assigned to Senior Scholar (Banaras Tradition). Written report within 24 hours.'}</span>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setStep('FORM')}
                className="px-4 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#0B0C11] border border-black/[0.08] dark:border-white/[0.08] text-xs text-[#1C1917] dark:text-[#EFECE6]"
              >
                {lang === 'hi' ? 'संशोधन करें' : 'Edit'}
              </button>
              <button
                onClick={handleCompleteOrder}
                className="flex-1 py-2.5 rounded-lg bg-[#D4AF37] text-[#060709] font-bold text-xs uppercase tracking-wider hover:bg-[#E5C378] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>{lang === 'hi' ? 'पुष्टि करें एवं परामर्श भेजें (₹१९९)' : 'Confirm & Request Consultation (₹199)'}</span>
              </button>
            </div>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#10b981]/20 border border-[#10b981] text-[#0F6B43] dark:text-[#34d399] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
              {lang === 'hi' ? 'प्रश्न विद्वान् के पास प्रेषित हो चुका है' : 'Inquiry Submitted to Scholar'}
            </h4>
            <p className="text-xs text-[#57524A] dark:text-[#8E8A82] max-w-sm mx-auto leading-relaxed">
              {lang === 'hi'
                ? `आपकी कुण्डली का खगोलीय विवरण दर्ज हो चुका है। हस्ताक्षरित परामर्श पत्र आपके ईमेल ${formData.email} पर प्रेषित किया जाएगा।`
                : `Your chart parameters and inquiry have been registered. You will receive your complete written folio at ${formData.email}.`
              }
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  onClose();
                }}
                className="px-5 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#101218] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 text-xs font-bold text-[#8E6F1D] dark:text-[#D4AF37]"
              >
                {lang === 'hi' ? 'मुख्य पृष्ठ पर लौटें' : 'Back to Homepage'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
