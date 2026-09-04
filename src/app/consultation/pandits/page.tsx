'use client';

/**
 * FREE CALL DIRECTORY — the customer-facing entry point for the ONE call
 * primitive (ConsultationSession + initiationMode):
 *
 *   • "मुफ्त कॉल करें" (Free Call) on any Pandit card → creates a session with
 *     initiationMode: 'DIRECT' → customer is taken straight to the call room;
 *     the Pandit's device rings; ZERO Customer-Care intervention (TEST B).
 *
 *   • "केयर-सहायता मुफ्त कॉल" banner → creates a session with
 *     initiationMode: 'CARE_ASSISTED' and routes it to the Care queue; a Care
 *     operator assigns + dispatches a verified Pandit; the operator then drops
 *     out and never touches the media plane (TEST A).
 *
 * ZERO PII: this page lists display names only. Real phone numbers never exist
 * on this surface (CALL_SECURITY_MODEL.md §3.1). FREE ONLY: no pricing, no
 * wallet, no per-minute deductions anywhere.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone,
  ShieldCheck,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  Headset,
  Languages,
  MapPin,
  Award,
  Lock
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';

interface ScholarListing {
  scholarId: string;
  name: string;
  title: string;
  tradition: string;
  city: string;
  languages: string[];
  specialities: string[];
  experienceYears: number;
  glyph: string;
}

export default function FreeCallDirectoryPage() {
  const router = useRouter();
  const [scholars, setScholars] = useState<ScholarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [assistedBusy, setAssistedBusy] = useState(false);
  const [assistResult, setAssistResult] = useState<{ sessionId: string; joinUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/sabha/directory', { cache: 'no-store' });
        const data = await res.json();
        if (data?.ok) setScholars(data.scholars || []);
      } catch {
        setError('निर्देशिका लोड नहीं हो सकी।');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** TEST B path — DIRECT: profile → Free Call → session → room (zero Care). */
  const handleFreeCall = async (scholarId: string) => {
    if (callingId) return;
    chitiSensory.playTick();
    setCallingId(scholarId);
    setError(null);
    try {
      const res = await fetch('/api/sabha/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiationMode: 'DIRECT',
          consultantId: scholarId,
          mediaType: 'AUDIO'
        })
      });
      const data = await res.json();
      if (data?.ok && data.customerRoomUrl) {
        router.push(data.customerRoomUrl as string);
        return;
      }
      setError(data?.error || 'मुफ्त कॉल प्रारंभ नहीं हो सकी।');
    } catch {
      setError('नेटवर्क त्रुटि — कृपया पुनः प्रयास करें।');
    } finally {
      setCallingId(null);
    }
  };

  /** TEST A path — CARE_ASSISTED: request lands in the Care queue. */
  const handleAssistedCall = async () => {
    if (assistedBusy) return;
    chitiSensory.playTick();
    setAssistedBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/sabha/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiationMode: 'CARE_ASSISTED',
          mediaType: 'AUDIO',
          intakeByOperatorId: 'CARE_QUEUE_AUTO_INTAKE'
        })
      });
      const data = await res.json();
      if (data?.ok) {
        setAssistResult({ sessionId: data.sessionId, joinUrl: data.customerRoomUrl });
      } else {
        setError(data?.error || 'अनुरोध पंजीकृत नहीं हो सका।');
      }
    } catch {
      setError('नेटवर्क त्रुटि — कृपया पुनः प्रयास करें।');
    } finally {
      setAssistedBusy(false);
    }
  };

  return (
    <CosmicTantraShell shellMode="public" footerMode="full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 font-mono-data">
        {/* Header */}
        <div className="text-center space-y-3 pb-8 border-b border-[#8E6F1D]/20">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>सम्पूर्ण निःशुल्क • १५ मिनट • १:१ निजी कॉल</span>
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] dark:text-white">
            सत्यापित पंडितों से <span className="text-[#8E6F1D] dark:text-[#D4AF37]">मुफ्त कॉल</span>
          </h1>
          <p className="text-xs text-[#696256] dark:text-[#9E988D] max-w-2xl mx-auto leading-relaxed">
            DTLS-SRTP एन्क्रिप्टेड वाणी परामर्श • वास्तविक फ़ोन नंबर कभी साझा नहीं होते • कोई रिकॉर्डिंग नहीं • कोई भुगतान नहीं
          </p>
        </div>

        {/* Care-Assisted Routing (routing layer — never media) */}
        <div className="mt-6 p-5 rounded-3xl bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 shrink-0">
                <Headset className="w-5 h-5 text-amber-600 dark:text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-[#1C1917] dark:text-white">
                  अनिश्चित हैं? केयर टीम आपके लिए सही पंडित चुनेगी
                </h2>
                <p className="text-[11px] text-[#696256] dark:text-[#9E988D] mt-1 leading-relaxed">
                  अनुरोध केयर कतार में जाएगा → ऑपरेटर सत्यापित पंडित आवंटित करेगा → दोनों ओर कॉल बजेगी।
                  ऑपरेटर कॉल में शामिल <strong>नहीं</strong> होता — कॉल पूर्णतः निजी १:१ रहती है।
                </p>
              </div>
            </div>
            <button
              onClick={handleAssistedCall}
              disabled={assistedBusy || !!assistResult}
              className="shrink-0 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-60 cursor-pointer"
            >
              {assistedBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Headset className="w-4 h-4" />}
              <span>{assistResult ? 'कतार में पंजीकृत ✓' : 'केयर-सहायता मुफ्त कॉल'}</span>
            </button>
          </div>

          {assistResult && (
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>आपका अनुरोध केयर कतार में है • सत्र: {assistResult.sessionId}</span>
              </div>
              <p className="text-[11px] opacity-90">
                केयर ऑपरेटर पंडित आवंटित कर कॉल भेजेंगे — आपके फ़ोन/टैब पर घंटी बजेगी। इसी टैब में रहें या
                वापस आने के लिए नीचे लिंक खोलें।
              </p>
              <a
                href={assistResult.joinUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
              >
                <Phone className="w-3 h-3" />
                वेटिंग रूम में प्रवेश करें
              </a>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* DIRECT Free Call directory */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 rounded-3xl border border-dashed border-black/10 dark:border-white/10 animate-pulse space-y-3">
                <div className="h-10 w-10 rounded-full bg-black/5 dark:bg-white/10" />
                <div className="h-3 w-2/3 bg-black/5 dark:bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-black/5 dark:bg-white/10 rounded" />
                <div className="h-9 bg-black/5 dark:bg-white/10 rounded-xl" />
              </div>
            ))
          ) : (
            scholars.map(s => (
              <div
                key={s.scholarId}
                className="p-5 rounded-3xl bg-white dark:bg-[#0E101D] border border-black/10 dark:border-white/10 hover:border-[#8E6F1D]/50 dark:hover:border-[#D4AF37]/50 shadow-sm hover:shadow-lg transition-all flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#8E6F1D] to-[#D4AF37] flex items-center justify-center text-xl text-white shadow">
                    {s.glyph}
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    सत्यापित विद्वान्
                  </span>
                </div>

                <div>
                  <h3 className="font-editorial font-bold text-base text-[#1C1917] dark:text-white">{s.name}</h3>
                  <p className="text-[11px] text-[#696256] dark:text-[#9E988D] mt-0.5">{s.title}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[#57524A] dark:text-[#D1C9BF]">
                    <MapPin className="w-2.5 h-2.5" /> {s.city}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[#57524A] dark:text-[#D1C9BF]">
                    <Award className="w-2.5 h-2.5" /> {s.experienceYears}+ वर्ष
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[#57524A] dark:text-[#D1C9BF]">
                    <Languages className="w-2.5 h-2.5" /> {s.languages.slice(0, 2).join(', ')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 text-[10px] text-[#857E74]">
                  {s.specialities.slice(0, 3).map(sp => (
                    <span key={sp} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      {sp}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-2">
                  <button
                    onClick={() => handleFreeCall(s.scholarId)}
                    disabled={callingId !== null}
                    className="w-full py-3 rounded-2xl bg-[#8E6F1D] hover:bg-[#75601a] dark:bg-[#D4AF37] dark:hover:bg-[#c5a231] text-white dark:text-[#080A10] font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
                  >
                    {callingId === s.scholarId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Phone className="w-3.5 h-3.5" />
                    )}
                    <span>मुफ्त कॉल करें (Free Call)</span>
                  </button>
                  <p className="mt-2 text-center text-[9px] text-[#857E74] flex items-center justify-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <Clock className="w-2.5 h-2.5" /> १५ मिनट निःशुल्क • नंबर मास्क्ड • शून्य रिकॉर्डिंग
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </CosmicTantraShell>
  );
}
