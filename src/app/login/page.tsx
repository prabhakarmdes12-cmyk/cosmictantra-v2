'use client';

import React, { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import CosmicTantraLogo, { CosmicTantraEmblem } from '@/components/visual/CosmicTantraLogo';

const DEMO_EMAIL = 'demo@cosmictantra.app';
const DEMO_PASSWORD = 'demo123';

const demoHighlights = [
  'A live Vedic day view, tuned to your location',
  'A clear path to your personal Kundli',
  'Human guidance when a question needs context',
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const beginDemo = (nextEmail = DEMO_EMAIL, nextPassword = DEMO_PASSWORD) => {
    if (!nextEmail.trim() || !nextPassword.trim()) {
      setError('Enter an email and password to continue.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // This is intentionally a local-only demo session. No credentials leave
    // the browser and no real account is created by this prototype.
    try {
      localStorage.setItem(
        'cosmictantra_demo_session',
        JSON.stringify({
          email: nextEmail.trim(),
          name: 'Aarav Mehta',
          cosmicId: 'CT-DEMO-4821',
          signedInAt: new Date().toISOString(),
        })
      );
      // Seed an explicitly labelled sample chart so the three demo routes have
      // useful context. Production authentication would replace this client
      // storage hand-off with the account service.
      localStorage.setItem(
        'cosmictantra_active_kundli',
        JSON.stringify({
          name: 'Aarav Mehta',
          birthDate: '1995-06-15',
          birthTime: '10:30',
          latitude: 25.3176,
          longitude: 82.9739,
          timezone: 5.5,
          locationName: 'Varanasi, Uttar Pradesh',
          demo: true,
        })
      );
    } catch {
      // The prototype should still be navigable when storage is unavailable.
    }

    window.setTimeout(() => router.push('/demo'), 180);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    beginDemo(email, password);
  };

  const useDemoAccount = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    beginDemo();
  };

  return (
    <main className="min-h-screen bg-[#07080C] text-white selection:bg-[#D4AF37]/30">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section
          className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between"
          style={{
            backgroundImage:
              "linear-gradient(115deg, rgba(5, 7, 13, .97) 5%, rgba(8, 11, 23, .8) 55%, rgba(8, 11, 23, .35)), url('/varanasi-ghats-hero.jpg')",
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(212,175,55,.22),transparent_32%),linear-gradient(to_top,rgba(5,7,13,.96),transparent_55%)]" />
          <div className="relative z-10 flex items-center gap-3 px-10 py-9">
            <CosmicTantraEmblem className="h-11 w-11" />
            <div>
              <div className="font-editorial text-lg font-bold tracking-[0.18em] text-[#F5F2EB]">COSMICTANTRA</div>
              <div className="font-mono-data text-[9px] font-bold tracking-[0.3em] text-[#D4AF37]">VEDIC PRECISION</div>
            </div>
          </div>

          <div className="relative z-10 max-w-xl px-10 pb-14 xl:px-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#07080C]/45 px-3 py-1.5 font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#F0C968] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              A calmer way to begin
            </div>
            <h1 className="max-w-lg font-editorial text-4xl font-bold leading-[1.08] tracking-tight text-[#F8F4EA] xl:text-6xl">
              Start with what you need to understand.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#D1C9BF]">
              One thoughtful workspace for today&apos;s timing, your lifetime chart, and guidance from a real Vedic scholar.
            </p>
            <ul className="mt-8 space-y-3">
              {demoHighlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-3 text-sm text-[#ECE5D7]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[#F0C968]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex min-h-screen flex-col bg-[#F8F5EF] text-[#1C1917]">
          <div className="flex items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
            <Link href="/" className="lg:hidden" aria-label="CosmicTantra home">
              <CosmicTantraLogo size="sm" />
            </Link>
            <div className="ml-auto flex items-center gap-3 text-xs font-semibold text-[#6B645A]">
              <span className="hidden sm:inline">New here?</span>
              <Link href="/" className="rounded-full border border-[#8E6F1D]/30 px-3.5 py-2 text-[#735A17] transition hover:bg-[#8E6F1D]/10">
                Explore first
              </Link>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-14 sm:px-8 lg:px-12">
            <div className="mb-8 lg:hidden">
              <p className="font-mono-data text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E6F1D]">CosmicTantra demo</p>
              <h1 className="mt-3 font-editorial text-3xl font-bold leading-tight">Your observatory awaits.</h1>
            </div>

            <div className="mb-8 hidden lg:block">
              <p className="font-mono-data text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E6F1D]">Secure entry · prototype</p>
              <h2 className="mt-3 font-editorial text-4xl font-bold leading-tight text-[#211D19]">Welcome back.</h2>
              <p className="mt-3 text-sm leading-6 text-[#6B645A]">Sign in to continue to your three-part CosmicTantra demo.</p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-[28px] border border-[#8E6F1D]/20 bg-white p-6 shadow-[0_20px_60px_rgba(58,43,17,.1)] sm:p-8" aria-label="Demo sign in form">
              <div className="mb-6 flex items-center gap-3 border-b border-[#1C1917]/[0.08] pb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8E6F1D]/10 text-[#8E6F1D]">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#211D19]">Sign in to your desk</h3>
                  <p className="text-xs text-[#797065]">Demo access is instant and local-only.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B645A]">Email</span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9183]" />
                    <input
                      data-testid="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={DEMO_EMAIL}
                      className="min-h-12 w-full rounded-2xl border border-[#8E6F1D]/20 bg-[#FCFAF6] py-3 pl-10 pr-4 text-sm text-[#211D19] outline-none transition placeholder:text-[#A9A094] focus:border-[#8E6F1D] focus:ring-4 focus:ring-[#8E6F1D]/10"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B645A]">Password</span>
                  <span className="relative block">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9183]" />
                    <input
                      data-testid="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={DEMO_PASSWORD}
                      className="min-h-12 w-full rounded-2xl border border-[#8E6F1D]/20 bg-[#FCFAF6] py-3 pl-10 pr-12 text-sm text-[#211D19] outline-none transition placeholder:text-[#A9A094] focus:border-[#8E6F1D] focus:ring-4 focus:ring-[#8E6F1D]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#857A6C] transition hover:bg-[#8E6F1D]/10 hover:text-[#735A17]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
              </div>

              {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{error}</p>}

              <button
                data-testid="login-submit"
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1C1917] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#8E6F1D] disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? 'Opening your desk…' : 'Continue to demo'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#A29A8E]">
                <span className="h-px flex-1 bg-[#1C1917]/10" />
                or
                <span className="h-px flex-1 bg-[#1C1917]/10" />
              </div>

              <button
                data-testid="use-demo-account"
                type="button"
                onClick={useDemoAccount}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#8E6F1D]/35 bg-[#FFFDF8] px-5 py-3 text-sm font-bold text-[#735A17] transition hover:border-[#8E6F1D] hover:bg-[#8E6F1D]/10"
              >
                <Sparkles className="h-4 w-4" />
                Use demo account
              </button>
            </form>

            <div className="mt-6 flex items-start gap-2.5 text-xs leading-5 text-[#7B7368]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8E6F1D]" />
              <p>This preview uses local browser storage only. It is not a real account or payment flow.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
