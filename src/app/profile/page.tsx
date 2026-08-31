'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  CheckCircle, 
  User, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Heart, 
  Sparkles, 
  Calendar, 
  ShoppingBag, 
  FileText, 
  Bell, 
  Download, 
  Check, 
  X,
  Compass,
  ArrowRight
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { 
  getProfiles, 
  saveProfiles, 
  upsertProfile, 
  removeProfile, 
  getActiveProfileId, 
  setActiveProfileId,
  generateCosmicId,
  RELATIONS
} from '@/lib/profileStore';
import { chitiSensory } from '@/lib/chitiAudio';

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PROFILES' | 'ORDERS' | 'NOTIFICATIONS' | 'PRIVACY'>('PROFILES');
  
  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formRelation, setFormRelation] = useState('Self');
  const [formBirthDate, setFormBirthDate] = useState('1994-08-15');
  const [formBirthTime, setFormBirthTime] = useState('06:30');
  const [formBirthCity, setFormBirthCity] = useState('Varanasi');
  const [formGotra, setFormGotra] = useState('Kashyap');
  const [formGender, setFormGender] = useState('Female');

  // Phone OTP state
  const [phone, setPhone] = useState('+91 98765 43210');
  const [isVerified, setIsVerified] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Notification toggles
  const [dailyPanchangAlert, setDailyPanchangAlert] = useState(true);
  const [fastingAlerts, setFastingAlerts] = useState(true);
  const [grahaTransitAlerts, setGrahaTransitAlerts] = useState(true);

  // Load profiles on mount
  useEffect(() => {
    try {
      const stored = getProfiles();
      if (stored && stored.length > 0) {
        setProfiles(stored);
        setActiveId(getActiveProfileId() || stored[0].id);
      } else {
        // Seed initial default profile
        const defaultProf = {
          id: 'pf_default_1',
          cosmicId: 'CT-7708',
          name: 'प्रिया शर्मा (Priya Sharma)',
          relation: 'Self',
          birthDate: '1994-08-15',
          birthTime: '06:30',
          birthCity: 'Varanasi',
          gotra: 'कश्यप (Kashyap)',
          gender: 'Female',
          rashi: 'वृश्चिक (Scorpio)',
          nakshatra: 'अनुराधा (Anuradha - पद 2)',
          lagna: 'सिंह (Leo)'
        };
        upsertProfile(defaultProf);
        setProfiles([defaultProf]);
        setActiveId(defaultProf.id);
      }
    } catch {}
  }, []);

  const handleOpenAddModal = () => {
    chitiSensory.playTick();
    setEditingProfile(null);
    setFormName('अमित शर्मा (Amit Sharma)');
    setFormRelation('Spouse');
    setFormBirthDate('1992-05-20');
    setFormBirthTime('14:15');
    setFormBirthCity('Kashi');
    setFormGotra('Vatsa');
    setFormGender('Male');
    setModalOpen(true);
  };

  const handleOpenEditModal = (p: any) => {
    chitiSensory.playTick();
    setEditingProfile(p);
    setFormName(p.name);
    setFormRelation(p.relation);
    setFormBirthDate(p.birthDate);
    setFormBirthTime(p.birthTime);
    setFormBirthCity(p.birthCity);
    setFormGotra(p.gotra || 'Kashyap');
    setFormGender(p.gender || 'Female');
    setModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    chitiSensory.playTick();

    const saved = upsertProfile({
      id: editingProfile?.id,
      cosmicId: editingProfile?.cosmicId || generateCosmicId(),
      name: formName,
      relation: formRelation,
      birthDate: formBirthDate,
      birthTime: formBirthTime,
      birthCity: formBirthCity,
      gotra: formGotra,
      gender: formGender,
      rashi: formRelation === 'Spouse' ? 'मेष (Aries)' : 'धनु (Sagittarius)',
      nakshatra: formRelation === 'Spouse' ? 'अश्विनी (Ashwini)' : 'मूल (Moola)',
      lagna: 'वृश्चिक (Scorpio)'
    });

    const updated = getProfiles();
    setProfiles(updated);
    if (!activeId) setActiveId(saved.id);
    setModalOpen(false);
  };

  const handleDeleteProfile = (id: string) => {
    chitiSensory.playTick();
    removeProfile(id);
    const updated = getProfiles();
    setProfiles(updated);
    if (activeId === id && updated.length > 0) {
      setActiveId(updated[0].id);
    }
  };

  const handleSelectActive = (id: string) => {
    chitiSensory.playTick();
    setActiveProfileId(id);
    setActiveId(id);
  };

  // Export JSON Vault
  const handleExportVault = () => {
    chitiSensory.playTick();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profiles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CosmicTantra_Family_Vault_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // DPDP Purge
  const handleClearAll = () => {
    if (confirm('क्या आप अपने समस्त पारिवारिक जन्म विवरण हटाना चाहते हैं? (Right to be Forgotten)')) {
      chitiSensory.playTick();
      saveProfiles([]);
      setProfiles([]);
      localStorage.removeItem('cosmictantra_pooja_cart');
    }
  };

  return (
    <CosmicTantraShell>
      <div className="py-4 sm:py-8 px-3 sm:px-6 lg:px-8 mx-auto max-w-6xl space-y-6">
        
        {/* Top Header Card */}
        <div className="rounded-3xl bg-gradient-to-r from-[#1A140A] via-[#2A1D0B] to-[#120D05] border border-[#8E6F1D]/40 p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8E6F1D]/25 border border-amber-400/40 text-amber-300 text-xs font-mono-data font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>CONSENT-BASED SECURE IDENTITY • DPDP COMPLIANT</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#FAF7F2]">
              Parivaar & Devotee Vault
            </h1>

            <p className="text-xs sm:text-sm font-mono-data text-[#D1C9BF] leading-relaxed">
              Your charts, family profiles, and consultations under one secure Cosmic ID. Designed with consent-based data collection & privacy controls.
            </p>
          </div>

          {/* Cosmic ID Badge */}
          <div className="bg-black/40 border border-white/15 p-4 rounded-2xl shrink-0 text-center space-y-1">
            <div className="text-[10px] font-mono-data text-amber-400 font-bold uppercase tracking-widest">
              PRIMARY COSMIC ID
            </div>
            <div className="font-editorial text-2xl font-bold text-white tracking-wider">
              {profiles.find(p => p.id === activeId)?.cosmicId || 'CT-7708'}
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono-data font-bold">
              <CheckCircle className="w-3 h-3" />
              <span>{phone} (Verified)</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-black/10 dark:border-white/10 pb-3">
          <button
            onClick={() => { chitiSensory.playTick(); setActiveTab('PROFILES'); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PROFILES'
                ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-black shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-[#44403C] dark:text-[#D1C9BF]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>पारिवारिक कुण्डली वॉल्ट ({profiles.length})</span>
          </button>

          <button
            onClick={() => { chitiSensory.playTick(); setActiveTab('ORDERS'); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ORDERS'
                ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-black shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-[#44403C] dark:text-[#D1C9BF]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ई-पूजा व सामग्री ऑर्डर इतिहास</span>
          </button>

          <button
            onClick={() => { chitiSensory.playTick(); setActiveTab('NOTIFICATIONS'); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'NOTIFICATIONS'
                ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-black shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-[#44403C] dark:text-[#D1C9BF]'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>पञ्चाङ्ग व व्रत सूचना सेटिंग्स</span>
          </button>

          <button
            onClick={() => { chitiSensory.playTick(); setActiveTab('PRIVACY'); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono-data font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PRIVACY'
                ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-black shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-[#44403C] dark:text-[#D1C9BF]'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>डेटा बैकअप व गोपनीयता</span>
          </button>
        </div>

        {/* TAB 1: FAMILY PROFILES VAULT */}
        {activeTab === 'PROFILES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">
                  Family Members & Birth Profiles
                </h3>
                <p className="text-xs font-mono-data text-[#78716C]">
                  Select active person to synchronize Kundali, 72h forecast, and temple sankalpa across the platform.
                </p>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-[#8E6F1D] hover:bg-[#A88424] text-white text-xs font-mono-data font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>नया सदस्य जोड़ें (Add Member)</span>
              </button>
            </div>

            {/* Profiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((p) => {
                const isActive = p.id === activeId;
                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-3xl border transition-all duration-300 space-y-4 relative ${
                      isActive
                        ? 'bg-white dark:bg-[#0E101D] border-[#8E6F1D] dark:border-[#D4AF37] shadow-xl ring-2 ring-[#8E6F1D]/20'
                        : 'bg-white/70 dark:bg-[#0A0C16] border-black/10 dark:border-white/10 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono-data font-bold">
                        सक्रिय (Active) ✓
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 flex items-center justify-center text-xl shrink-0 font-editorial font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                        {p.relation === 'Self' ? '👤' : p.relation === 'Spouse' ? '💍' : p.relation === 'Mother' ? '🌸' : '👥'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] font-bold uppercase">
                          {p.relation} • {p.cosmicId}
                        </div>
                        <h4 className="font-editorial text-base font-bold text-[#1C1917] dark:text-white line-clamp-1">
                          {p.name}
                        </h4>
                        <div className="text-xs font-mono-data text-[#78716C]">
                          {p.birthDate} • {p.birthTime} ({p.birthCity})
                        </div>
                      </div>
                    </div>

                    {/* Natal Matrix Summary */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono-data pt-2 border-t border-black/5 dark:border-white/5">
                      <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#161826]">
                        <span className="text-[10px] text-[#78716C] block">राशि (Moon Sign)</span>
                        <strong className="text-[#1C1917] dark:text-white">{p.rashi || 'वृश्चिक'}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#161826]">
                        <span className="text-[10px] text-[#78716C] block">नक्षत्र (Nakshatra)</span>
                        <strong className="text-[#1C1917] dark:text-white">{p.nakshatra || 'अनुराधा'}</strong>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2">
                      {!isActive ? (
                        <button
                          onClick={() => handleSelectActive(p.id)}
                          className="flex-1 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#8E6F1D] hover:text-white text-xs font-mono-data font-bold transition-all cursor-pointer"
                        >
                          सक्रिय चुनें (Make Active)
                        </button>
                      ) : (
                        <Link
                          href="/daily"
                          className="flex-1 py-1.5 rounded-xl bg-[#8E6F1D] text-white text-xs font-mono-data font-bold text-center shadow-xs"
                        >
                          ७२h राशिफल देखें →
                        </Link>
                      )}

                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-2 rounded-xl text-[#78716C] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        title="Edit Profile"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {profiles.length > 1 && (
                        <button
                          onClick={() => handleDeleteProfile(p.id)}
                          className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SPIRITUAL ORDERS & E-PUJA HISTORY */}
        {activeTab === 'ORDERS' && (
          <div className="bg-white dark:bg-[#0E101D] p-6 rounded-3xl border border-black/10 dark:border-white/10 shadow-xl space-y-4">
            <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#8E6F1D] dark:text-[#F0C968]" />
              <span>आपके पावन संकल्प एवं पूजा सामग्री ऑर्डर (Orders History)</span>
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono-data font-bold">
                      DELIVERED ✓
                    </span>
                    <span className="text-xs font-mono-data text-[#78716C]">Order #CT-SAMAGRI-8821</span>
                  </div>
                  <h4 className="font-editorial text-sm font-bold text-[#1C1917] dark:text-white">
                    पीतल अखण्ड दीप + असली भीमसेनी कपूर + A2 देशी गौघृत
                  </h4>
                  <p className="text-xs font-mono-data text-[#78716C]">
                    संकल्प: प्रिया शर्मा (कश्यप गोत्र) • काशी विश्वनाथ अभिषेक
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-editorial text-base font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                    ₹1,847
                  </div>
                  <span className="text-[10px] font-mono-data text-emerald-600">Dispatched via Speed Post</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-mono-data font-bold">
                      E-PUJA COMPLETED ✓
                    </span>
                    <span className="text-xs font-mono-data text-[#78716C]">Sankalpa #CT-PUJA-4019</span>
                  </div>
                  <h4 className="font-editorial text-sm font-bold text-[#1C1917] dark:text-white">
                    श्री महाकालेश्वर ज्योतिर्लिंग भस्म आरती विशेष सङ्कल्प
                  </h4>
                  <p className="text-xs font-mono-data text-[#78716C]">
                    पं. विद्यानन्द शास्त्री द्वारा सम्पन्न • प्रसाद प्रेषित
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Link
                    href="/report"
                    className="px-3 py-1.5 rounded-xl bg-[#8E6F1D] text-white text-xs font-mono-data font-bold inline-block"
                  >
                    प्रमाण पत्र (PDF) देखें
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATION & PANCHANG REMINDER SETTINGS */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="bg-white dark:bg-[#0E101D] p-6 rounded-3xl border border-black/10 dark:border-white/10 shadow-xl space-y-4">
            <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#8E6F1D] dark:text-[#F0C968]" />
              <span>दैनिक पञ्चाङ्ग व व्रत सूचना सेटिंग्स (Alert Preferences)</span>
            </h3>

            <div className="space-y-3 text-xs font-mono-data">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-editorial text-sm font-bold text-[#1C1917] dark:text-white">
                    🌅 प्रातःकालीन दैनिक पञ्चाङ्ग (Daily Morning Panchang Alert)
                  </h4>
                  <p className="text-[#78716C] mt-0.5">
                    Send daily Tithi, Nakshatra, Rahu Kaal, and Shubh Muhurat at 06:00 AM.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={dailyPanchangAlert}
                  onChange={(e) => setDailyPanchangAlert(e.target.checked)}
                  className="w-5 h-5 accent-[#8E6F1D] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-editorial text-sm font-bold text-[#1C1917] dark:text-white">
                    🪔 एकादशी, पूर्णिमा व प्रदोष व्रत स्मरण (Fasting Alerts)
                  </h4>
                  <p className="text-[#78716C] mt-0.5">
                    Receive 24-hour advance reminder before major Vrat and Tithi parana windows.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={fastingAlerts}
                  onChange={(e) => setFastingAlerts(e.target.checked)}
                  className="w-5 h-5 accent-[#8E6F1D] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-editorial text-sm font-bold text-[#1C1917] dark:text-white">
                    🪐 महत्वपूर्ण ग्रह गोचर व वक्री सूचना (Planetary Transit Alerts)
                  </h4>
                  <p className="text-[#78716C] mt-0.5">
                    Alerts on Surya Sankranti, Guru/Shani Gochara, and Lunar Ingress for your Janma Rashi.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={grahaTransitAlerts}
                  onChange={(e) => setGrahaTransitAlerts(e.target.checked)}
                  className="w-5 h-5 accent-[#8E6F1D] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DATA BACKUP & PRIVACY (DPDP) */}
        {activeTab === 'PRIVACY' && (
          <div className="bg-white dark:bg-[#0E101D] p-6 rounded-3xl border border-black/10 dark:border-white/10 shadow-xl space-y-4">
            <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#8E6F1D] dark:text-[#F0C968]" />
              <span>DPDP Privacy & Local Data Sovereign Controls</span>
            </h3>

            <p className="text-xs font-mono-data text-[#78716C] leading-relaxed">
              CosmicTantra is architected with complete client-side data sovereignty. No birth parameters or family records are transmitted or sold to third parties without your explicit consent.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleExportVault}
                className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-[#8E6F1D]/15 border border-black/10 dark:border-white/10 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968]" />
                <span>पारिवारिक वॉल्ट बैकअप (Export JSON)</span>
              </button>

              <button
                onClick={handleClearAll}
                className="p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-mono-data font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>समस्त डेटा हटाएं (Right to be Forgotten)</span>
              </button>
            </div>
          </div>
        )}

        {/* ADD / EDIT PROFILE MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/40 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">
                  {editingProfile ? 'कुण्डली विवरण सम्पादित करें' : 'नया पारिवारिक सदस्य जोड़ें'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-[#78716C] hover:text-black dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs font-mono-data">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#78716C] mb-1">पूरा नाम (Full Name)</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. अमित शर्मा"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#78716C] mb-1">सम्बन्ध (Relation)</label>
                    <select
                      value={formRelation}
                      onChange={(e) => setFormRelation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                    >
                      {RELATIONS.map(rel => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#78716C] mb-1">जन्म तिथि (Date of Birth)</label>
                    <input
                      type="date"
                      required
                      value={formBirthDate}
                      onChange={(e) => setFormBirthDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#78716C] mb-1">जन्म समय (Time of Birth)</label>
                    <input
                      type="time"
                      required
                      value={formBirthTime}
                      onChange={(e) => setFormBirthTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#78716C] mb-1">जन्म स्थान (City / Town)</label>
                    <input
                      type="text"
                      required
                      value={formBirthCity}
                      onChange={(e) => setFormBirthCity(e.target.value)}
                      placeholder="e.g. Varanasi, Delhi"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#78716C] mb-1">गोत्र (Gotra - optional)</label>
                    <input
                      type="text"
                      value={formGotra}
                      onChange={(e) => setFormGotra(e.target.value)}
                      placeholder="e.g. कश्यप / वत्स"
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#161826] outline-none focus:border-[#8E6F1D]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#8E6F1D] hover:bg-[#A88424] text-white font-bold flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer mt-4"
                >
                  <Check className="w-4 h-4" />
                  <span>सुरक्षित सहेजें (Save Profile)</span>
                </button>
              </form>

            </div>
          </div>
        )}

      </div>
    </CosmicTantraShell>
  );
}
