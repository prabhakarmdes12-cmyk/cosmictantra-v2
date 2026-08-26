'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            // Service worker successfully registered
          },
          (err) => {
            // Registration failed
          }
        );
      });
    }

    // 2. Capture beforeinstallprompt event
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed before
      const dismissed = localStorage.getItem('cosmictantra_pwa_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    chitiSensory.playBell();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    chitiSensory.playTick();
    setShowBanner(false);
    localStorage.setItem('cosmictantra_pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-[9998] max-w-sm bg-[#0E101D]/95 text-white backdrop-blur-xl border border-[#8E6F1D]/50 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8E6F1D] to-[#D4AF37] p-2 flex items-center justify-center shrink-0 shadow-lg">
            <Smartphone className="w-5 h-5 text-black" />
          </div>
          <div>
            <h4 className="font-editorial text-sm font-bold text-[#F0C968] flex items-center gap-1">
              <span>Install CosmicTantra App</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </h4>
            <p className="text-[11px] font-mono-data text-[#D1C9BF] leading-tight mt-0.5">
              Access 72h Horoscopes, Observatory, and Panchang directly from your home screen offline.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[#78716C] hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
        <button
          onClick={handleInstall}
          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] hover:from-[#A88424] hover:to-[#E5C378] text-black font-mono-data font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App (PWA)</span>
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-2 rounded-xl text-xs font-mono-data text-[#D1C9BF] hover:text-white cursor-pointer"
        >
          Later
        </button>
      </div>
    </div>
  );
}
