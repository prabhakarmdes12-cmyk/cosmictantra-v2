'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, CheckCircle2, Circle, ArrowRight, Sparkles, Users, Sun } from 'lucide-react';
import { getProfiles } from '@/lib/profileStore';
import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics';
import { chitiSensory } from '@/lib/chitiAudio';

/**
 * FirstSessionChecklist — a dismissible 3-task activation card for new visitors.
 * Shown on the home page only while tasks remain; auto-hides once all are done
 * or the visitor dismisses it. This is the activation rail from
 * docs/NEW_USER_UX_AUDIT_AND_JOURNEY_SIMPLIFICATION.md §5 (P2 #15).
 */
const DISMISS_KEY = 'cosmictantra_checklist_dismissed';
const DIGEST_SEEN_KEY = 'cosmictantra_digest_seen';

export default function FirstSessionChecklist({ lang = 'hi' }: { lang?: 'en' | 'hi' }) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true); // hidden until mounted (no SSR flash)
  const [hasKundali, setHasKundali] = useState(false);
  const [hasFamily, setHasFamily] = useState(false);
  const [digestSeen, setDigestSeen] = useState(false);
  const isHi = lang === 'hi';

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
      setDigestSeen(localStorage.getItem(DIGEST_SEEN_KEY) === '1');
      const profiles = getProfiles();
      setHasKundali(profiles.some((p: any) => p.birthDate));
      setHasFamily(profiles.length >= 2);
    } catch {}
    setMounted(true);
  }, []);

  // Re-check when returning to the tab (e.g., back from /family or the Kundali form)
  useEffect(() => {
    if (!mounted) return;
    const onFocus = () => {
      try {
        const profiles = getProfiles();
        setHasKundali(profiles.some((p: any) => p.birthDate));
        setHasFamily(profiles.length >= 2);
        setDigestSeen(localStorage.getItem(DIGEST_SEEN_KEY) === '1');
      } catch {}
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [mounted]);

  if (!mounted || dismissed) return null;

  const tasks = [
    {
      key: 'kundali',
      icon: Sparkles,
      done: hasKundali,
      href: '/#kundali-section',
      label: isHi ? 'अपनी निःशुल्क जन्म कुण्डली बनाएं (30 सेकंड)' : 'Make your free Kundali (30 seconds)',
    },
    {
      key: 'family',
      icon: Users,
      done: hasFamily,
      href: '/family',
      label: isHi ? 'परिवार के सदस्य जोड़ें (माता-पिता, जीवनसाथी)' : 'Add family members (parents, spouse)',
    },
    {
      key: 'digest',
      icon: Sun,
      done: digestSeen,
      href: '/morning-digest',
      label: isHi ? 'सुबह का पञ्चाङ्ं WhatsApp संदेश देखें' : 'See the morning WhatsApp Panchang digest',
      onClick: () => {
        try { localStorage.setItem(DIGEST_SEEN_KEY, '1'); } catch {}
        setDigestSeen(true);
      },
    },
  ];

  const doneCount = tasks.filter(t => t.done).length;
  const allDone = doneCount === tasks.length;

  const handleDismiss = () => {
    chitiSensory.playTick();
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setDismissed(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className="relative max-w-2xl mx-auto rounded-2xl bg-white/90 dark:bg-[#0B0D16]/90 backdrop-blur-xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 shadow-lg p-4 sm:p-5">
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-[#857E74] dark:text-[#7A746B] hover:text-[#1C1917] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={isHi ? 'छिपाएं' : 'Dismiss'}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center justify-between gap-3 mb-3 pr-6">
          <div className="text-[10px] font-mono-data font-bold uppercase tracking-[0.18em] text-[#8E6F1D] dark:text-[#F0C968]">
            {allDone
              ? (isHi ? '✓ आपकी यात्रा तैयार है' : '✓ You\u2019re all set')
              : (isHi ? 'शुरुआत करें — अपनी यात्रा' : 'Get started — your journey')}
          </div>
          <div className="text-[10px] font-mono-data font-bold text-[#696256] dark:text-[#9E988D]">
            {doneCount}/{tasks.length}
          </div>
        </div>

        <div className="space-y-1.5">
          {tasks.map(({ key, icon: Icon, done, href, label, onClick }) => (
            <Link
              key={key}
              href={href}
              onClick={() => {
                chitiSensory.playTick();
                analytics.track(ANALYTICS_EVENTS.CHECKLIST_TASK_CLICKED, { task: key });
                if (onClick) onClick();
              }}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer ${
                done
                  ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
                  : 'border-black/[0.07] dark:border-white/[0.08] hover:border-[#8E6F1D]/50 dark:hover:border-[#D4AF37]/50 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[#B7B1A6] shrink-0" />
              )}
              <span className={`flex-1 text-xs font-medium ${done ? 'text-[#57524A] dark:text-[#9E988D] line-through' : 'text-[#1C1917] dark:text-[#EFECE6]'}`}>
                {label}
              </span>
              <Icon className={`w-3.5 h-3.5 shrink-0 ${done ? 'text-emerald-600/60' : 'text-[#8E6F1D] dark:text-[#F0C968]'}`} />
              {!done && <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#B7B1A6] hidden sm:block" />}
            </Link>
          ))}
        </div>

        {!allDone && (
          <p className="mt-3 text-[10px] text-[#857E74] dark:text-[#7A746B] leading-relaxed">
            {isHi
              ? 'ⓘ कुण्डली बनाते ही आपका Cosmic ID स्वतः बन जाता है — कोई खाता, कोई OTP नहीं।'
              : 'ⓘ Making your Kundali automatically creates your Cosmic ID — no account, no OTP.'}
          </p>
        )}
      </div>
    </div>
  );
}
