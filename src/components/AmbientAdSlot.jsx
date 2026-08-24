'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Ambient AdSlot — renders ONLY when NEXT_PUBLIC_ADSENSE_CLIENT and
 * NEXT_PUBLIC_ADSENSE_SLOT are configured (i.e. after AdSense approval).
 * Intended for free utility pages (panchang, rashifal, numerology, library,
 * darshan) — NEVER on /, /ask, checkout or consultation surfaces.
 */
export default function AmbientAdSlot({ className = '' }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT;
  const ref = useRef(null);

  useEffect(() => {
    if (!client || !slot || typeof window === 'undefined') return;
    try {
      const w = window;
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense push failed', e);
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <div className={`my-8 min-h-[90px] ${className}`}>
      <span className="block text-[9px] uppercase tracking-widest text-[#9A958C] dark:text-[#5A5750] mb-1.5 text-center">Sponsored</span>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
        ref={ref}
      />
    </div>
  );
}
