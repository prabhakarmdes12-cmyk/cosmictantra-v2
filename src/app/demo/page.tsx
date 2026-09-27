'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  HeartHandshake,
  LogOut,
  MessageCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
} from 'lucide-react';
import CosmicTantraLogo from '@/components/visual/CosmicTantraLogo';

type ConceptId = 'today' | 'chart' | 'expert';

type Concept = {
  id: ConceptId;
  number: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  description: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  routeLabel: string;
  stats: { label: string; value: string }[];
  tags: string[];
};

const CONCEPTS: Concept[] = [
  {
    id: 'today',
    number: '01',
    eyebrow: 'UNDERSTAND TODAY',
    title: 'Your day, read clearly.',
    shortTitle: 'Vedic Now',
    description: 'See the living Panchang in one calm glance — what is active, what to avoid, and where the day is opening for you.',
    color: 'amber',
    icon: Sun,
    route: '/daily',
    routeLabel: "Open today's Panchang",
    stats: [
      { label: 'Tithi', value: 'Shukla Dashami' },
      { label: 'Nakshatra', value: 'Hasta' },
      { label: 'Rahu Kaal', value: '13:52 – 15:25' },
    ],
    tags: ['Location-aware', 'Live timing', 'Daily guidance'],
  },
  {
    id: 'chart',
    number: '02',
    eyebrow: 'UNDERSTAND MY CHART',
    title: 'Your lifetime geometry, decoded.',
    shortTitle: 'My Kundli',
    description: 'Move from raw birth details to a precise sidereal chart, a readable life-timing view, and a record you can return to.',
    color: 'violet',
    icon: Compass,
    route: '/kundli',
    routeLabel: 'Open my Kundli',
    stats: [
      { label: 'Lagna', value: 'Vrishabha · Taurus' },
      { label: 'Moon', value: 'Mithuna · Gemini' },
      { label: 'Current dasha', value: 'Moon · Saturn' },
    ],
    tags: ['Lahiri sidereal', 'North Indian chart', 'Sample profile'],
  },
  {
    id: 'expert',
    number: '03',
    eyebrow: 'ASK AN EXPERT',
    title: 'One question. Human guidance.',
    shortTitle: 'Scholar Guidance',
    description: 'When a life question needs context, send one focused brief to a verified Vedic scholar — not a noisy call marketplace.',
    color: 'rose',
    icon: MessageCircle,
    route: '/ask',
    routeLabel: 'Ask a scholar',
    stats: [
      { label: 'Written folio', value: 'From ₹501' },
      { label: 'Voice Sabha', value: 'Private & masked' },
      { label: 'Delivery', value: 'Scholar reviewed' },
    ],
    tags: ['One focused question', 'Human review', 'Private by design'],
  },
];

function MiniKundli() {
  return (
    <svg viewBox="0 0 220 220" className="h-44 w-44" role="img" aria-label="Sample North Indian Kundli chart">
      <rect x="12" y="12" width="196" height="196" rx="6" fill="rgba(212,175,55,.06)" stroke="rgba(240,201,104,.58)" strokeWidth="1.5" />
      <path d="M12 12L110 110L208 12M208 208L110 110L12 208M12 12L208 208M208 12L12 208" fill="none" stroke="rgba(240,201,104,.58)" strokeWidth="1.5" />
      <path d="M110 12V208M12 110H208" fill="none" stroke="rgba(240,201,104,.25)" strokeWidth="1" />
      <circle cx="110" cy="110" r="8" fill="#F0C968" opacity=".9" />
      <g fill="#F6E8B0" fontFamily="Inter, sans-serif" fontSize="9" textAnchor="middle">
        <text x="110" y="63">Su  Mo</text>
        <text x="163" y="38">Ve</text>
        <text x="178" y="112">Ju</text>
        <text x="163" y="188">Sa</text>
        <text x="58" y="188">Ma</text>
        <text x="42" y="112">Me</text>
        <text x="58" y="38">Ra</text>
        <text x="110" y="153">Ke</text>
      </g>
    </svg>
  );
}

function ConceptIcon({ concept, active = false }: { concept: Concept; active?: boolean }) {
  const Icon = concept.icon;
  const colorClass = concept.color === 'amber'
    ? 'text-[#F0C968] bg-[#D4AF37]/15 border-[#D4AF37]/30'
    : concept.color === 'violet'
      ? 'text-[#C6B5FF] bg-[#7C5CFF]/15 border-[#7C5CFF]/30'
      : 'text-[#FFB1B1] bg-[#D96B72]/15 border-[#D96B72]/30';

  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${colorClass} ${active ? 'shadow-[0_0_24px_rgba(240,201,104,.16)]' : ''}`}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

export default function DemoHubPage() {
  const router = useRouter();
  const [activeId, setActiveId] = useState<ConceptId>('today');
  const [currentTime, setCurrentTime] = useState('');
  const [sessionName, setSessionName] = useState('Aarav Mehta');
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cosmictantra_demo_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSessionName(parsed?.name || 'Aarav Mehta');
        setSignedIn(true);
      }
    } catch {
      // Keep the preview usable when storage is disabled.
    }

    const updateTime = () => {
      setCurrentTime(
        new Intl.DateTimeFormat('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata',
        }).format(new Date())
      );
    };
    updateTime();
    const timer = window.setInterval(updateTime, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const activeConcept = useMemo(
    () => CONCEPTS.find((concept) => concept.id === activeId) || CONCEPTS[0],
    [activeId]
  );

  const signOut = () => {
    try {
      localStorage.removeItem('cosmictantra_demo_session');
    } catch {}
    setSignedIn(false);
    router.push('/login');
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#07080C] text-[#F4F0E8] selection:bg-[#D4AF37]/30">
      <div className="pointer-events-none fixed inset-0 opacity-60" aria-hidden="true">
        <div className="absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-[#2B1D58]/35 blur-[120px]" />
        <div className="absolute right-[-140px] top-[38%] h-[500px] w-[500px] rounded-full bg-[#7A3B28]/20 blur-[130px]" />
        <div className="absolute bottom-[-220px] left-[34%] h-[520px] w-[520px] rounded-full bg-[#B08419]/10 blur-[140px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.09] bg-[#07080C]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/demo" aria-label="CosmicTantra demo home">
            <span className="dark">
              <CosmicTantraLogo size="md" subtitle="DEMO OBSERVATORY" />
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" />
              Prototype live
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[#C7C0B5] sm:flex">
              <UserRound className="h-3.5 w-3.5 text-[#F0C968]" />
              {signedIn ? sessionName : 'Guest preview'}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-[#B9B1A5] transition hover:border-[#D4AF37]/50 hover:text-[#F0C968]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <section className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/[0.08] px-3 py-1.5 font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#F0C968]">
              <Sparkles className="h-3.5 w-3.5" />
              Three concepts · one calm home
            </div>
            <h1 className="font-editorial text-4xl font-bold leading-[1.08] tracking-tight text-[#FBF8F1] sm:text-6xl lg:text-7xl">
              Vedic clarity,
              <span className="block text-[#D4AF37]">without the noise.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#B9B1A5] sm:text-lg">
              A focused demo of the three product promises: understand today, understand your chart, and ask an expert when the answer needs a human mind.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-right backdrop-blur-md">
            <div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.17em] text-[#8E877B]">Kashi reference time</div>
            <div className="mt-1 flex items-center justify-end gap-2 font-mono-data text-2xl font-bold text-[#F0C968]">
              <Clock3 className="h-5 w-5" />
              {currentTime || '— — : — —'}
            </div>
            <div className="mt-1 text-xs text-[#8E877B]">Sample view · Asia/Kolkata</div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-3" aria-label="Three product concepts">
          {CONCEPTS.map((concept) => {
            const isActive = activeId === concept.id;
            return (
              <article
                key={concept.id}
                className={`group relative overflow-hidden rounded-[26px] border p-5 transition duration-300 sm:p-6 ${
                  isActive
                    ? 'border-[#D4AF37]/55 bg-white/[0.09] shadow-[0_20px_80px_rgba(0,0,0,.22)]'
                    : 'border-white/10 bg-white/[0.035] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl ${concept.color === 'amber' ? 'bg-[#D4AF37]/15' : concept.color === 'violet' ? 'bg-[#7C5CFF]/15' : 'bg-[#D96B72]/15'}`} />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <ConceptIcon concept={concept} active={isActive} />
                    <span className="font-mono-data text-xs font-bold tracking-[0.16em] text-[#8E877B]">{concept.number}</span>
                  </div>
                  <p className="mt-6 font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#A99B7A]">{concept.eyebrow}</p>
                  <button
                    type="button"
                    onClick={() => setActiveId(concept.id)}
                    className="mt-2 text-left font-editorial text-2xl font-bold leading-tight text-[#F7F3EA] outline-none transition hover:text-[#F0C968] focus-visible:text-[#F0C968]"
                    aria-pressed={isActive}
                  >
                    {concept.title}
                  </button>
                  <p className="mt-3 min-h-[84px] text-sm leading-6 text-[#B9B1A5]">{concept.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {concept.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-[10px] font-semibold text-[#C7C0B5]">{tag}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveId(concept.id)}
                    className={`mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl text-xs font-bold transition ${isActive ? 'bg-[#D4AF37] text-[#17130A] hover:bg-[#F0C968]' : 'border border-white/10 bg-white/[0.04] text-[#E0D8CB] hover:border-[#D4AF37]/40 hover:text-[#F0C968]'}`}
                  >
                    {isActive ? 'Focused concept' : 'Explore this concept'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-[#D4AF37]/25 bg-gradient-to-br from-[#13182A] via-[#0D101B] to-[#150D16] shadow-[0_24px_90px_rgba(0,0,0,.3)]" aria-live="polite">
          <div className="grid lg:grid-cols-[1.08fr_.92fr]">
            <div className="relative overflow-hidden p-6 sm:p-9 lg:p-11">
              <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: "url('/varanasi-ghats-hero.jpg')", backgroundPosition: 'center', backgroundSize: 'cover', mixBlendMode: 'soft-light' }} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#13182A] via-[#13182A]/95 to-[#13182A]/60" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-3">
                  <ConceptIcon concept={activeConcept} active />
                  <div>
                    <p className="font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#F0C968]">Focused route · {activeConcept.number}</p>
                    <h2 className="mt-1 font-editorial text-3xl font-bold text-[#FBF8F1]">{activeConcept.shortTitle}</h2>
                  </div>
                </div>
                <p className="mt-7 max-w-xl text-base leading-7 text-[#D2C9BA]">{activeConcept.description}</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {activeConcept.stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-3.5">
                      <div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.12em] text-[#8E877B]">{stat.label}</div>
                      <div className="mt-1.5 text-sm font-semibold text-[#F5EEE1]">{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href={activeConcept.route} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F0C968] px-5 py-3 text-sm font-bold text-[#17130A] transition hover:-translate-y-0.5 hover:bg-[#FFE09A]">
                    {activeConcept.routeLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-[#DDD4C7] transition hover:border-[#D4AF37]/50 hover:text-[#F0C968]">
                    Return to observatory
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex min-h-[340px] items-center justify-center border-t border-white/10 bg-black/20 p-6 lg:border-l lg:border-t-0">
              {activeId === 'today' && (
                <div className="w-full max-w-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F0C968]"><Sun className="h-4 w-4" /> Shubh day pulse</span>
                    <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">FAVOURABLE</span>
                  </div>
                  <div className="rounded-[26px] border border-[#D4AF37]/20 bg-[#151624]/80 p-5 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div><div className="text-xs text-[#9C9489]">Wednesday · 27 Sep 2026</div><div className="mt-1 font-editorial text-2xl font-bold text-[#F8F1DE]">A day for steady moves</div></div>
                      <CalendarDays className="h-7 w-7 text-[#F0C968]" />
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#9C7718] to-[#F0C968]" /></div>
                    <div className="mt-2 flex justify-between text-[10px] font-semibold text-[#958D81]"><span>Rahu Kaal 13:52</span><span>Abhijit 11:57</span></div>
                    <p className="mt-5 text-sm leading-6 text-[#C9C0B2]">Protect the first deep-work window. Keep important conversations after the noon transition.</p>
                  </div>
                </div>
              )}
              {activeId === 'chart' && (
                <div className="flex w-full max-w-sm flex-col items-center">
                  <div className="mb-3 flex w-full items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-[#C6B5FF]"><span className="flex items-center gap-2"><Compass className="h-4 w-4" /> Sample Kundli</span><span className="font-mono-data text-[10px] text-[#8E877B]">SIDEREAL</span></div>
                  <MiniKundli />
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#BDB3D8]"><ShieldCheck className="h-4 w-4 text-[#B49CFF]" /> Calculated with Lahiri ayanamsha</div>
                </div>
              )}
              {activeId === 'expert' && (
                <div className="w-full max-w-sm">
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#FFB1B1]"><MessageCircle className="h-4 w-4" /> Scholar brief</div>
                  <div className="rounded-[26px] border border-[#D96B72]/25 bg-[#21151D]/80 p-5">
                    <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D96B72]/15 text-xl">ॐ</div><div><div className="font-semibold text-[#FFF2EE]">Your question, made precise</div><div className="text-xs text-[#B8A29F]">A focused handoff to a verified scholar</div></div></div>
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[#D9C8C5]">“What should I prioritise in my next career move?”</div>
                    <div className="mt-4 flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 text-emerald-300"><Check className="h-3.5 w-3.5" /> Brief ready</span><span className="text-[#B8A29F]">Written folio · ₹501</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4"><ShieldCheck className="h-5 w-5 text-[#F0C968]" /><div><div className="text-sm font-semibold">Consent-first</div><div className="mt-0.5 text-xs text-[#948C80]">Your birth data stays in your control.</div></div></div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4"><HeartHandshake className="h-5 w-5 text-[#F0C968]" /><div><div className="text-sm font-semibold">Human where it matters</div><div className="mt-0.5 text-xs text-[#948C80]">Scholar context, not call-centre noise.</div></div></div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4"><Moon className="h-5 w-5 text-[#F0C968]" /><div><div className="text-sm font-semibold">Built for return visits</div><div className="mt-0.5 text-xs text-[#948C80]">A calm daily rhythm, not a one-off reading.</div></div></div>
        </section>
      </div>
    </main>
  );
}
