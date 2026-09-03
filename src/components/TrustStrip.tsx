'use client';

/**
 * SPRINT C §5 — TRUST STRIP.
 *
 * Four compact trust ideas below the hero. The factual "declared
 * conventions" line is read READ-ONLY from the engine's own convention
 * manifest (never claimed by UI copy). No custom ayanamsha maths here.
 */

import React, { useMemo } from 'react';
import { Calculator, ScrollText, SeparatorHorizontal, Users } from 'lucide-react';
import { buildConventionSnapshotMetadata, DEFAULT_PRESET } from '@/lib/jyotish/conventionCenter';
import { resolveAstronomyProvider } from '@/lib/astronomy/astronomyProvider';
import { TRANSLATIONS } from '@/lib/translations';

export default function TrustStrip({ lang = 'en' }: { lang?: string }) {
  const t = (TRANSLATIONS[lang] || TRANSLATIONS.en).conversion || TRANSLATIONS.en.conversion;
  const isHi = lang === 'hi';
  const cv = (k: string) => (isHi ? t[`${k}Hi`] || t[k] : t[k]);

  const engineFacts = useMemo(() => {
    let summaryLine = '';
    let provider = '';
    try {
      const meta = buildConventionSnapshotMetadata(DEFAULT_PRESET.id);
      summaryLine = meta.conventionRegistry.summaryLines?.[0] || '';
      const d = resolveAstronomyProvider().descriptor;
      provider = `${d.providerId} · ${d.validationStatus}`;
    } catch {
      // engine metadata unavailable — the strip simply shows the four ideas
    }
    return { summaryLine, provider };
  }, []);

  const items = [
    { icon: Calculator, title: cv('trustCalculatedTitle'), desc: cv('trustCalculatedDesc') },
    { icon: ScrollText, title: cv('trustConventionsTitle'), desc: cv('trustConventionsDesc') },
    { icon: SeparatorHorizontal, title: cv('trustInterpretationTitle'), desc: cv('trustInterpretationDesc') },
    { icon: Users, title: cv('trustHumanTitle'), desc: cv('trustHumanDesc') },
  ];

  return (
    <section
      data-testid="trust-strip"
      aria-label={isHi ? 'विश्वास के मूल सिद्धान्त' : 'How CosmicTantra earns trust'}
      className="border-b border-[#E5D7BC]/70 bg-[#F6EFE0]/60"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl border border-[#E5D7BC] bg-white/70 p-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#8E6F1D]" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-editorial font-bold text-[#1C1917]">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-[#57524A]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        {(engineFacts.summaryLine || engineFacts.provider) && (
          <p data-testid="trust-engine-metadata" className="mt-4 text-[10px] font-mono-data text-[#696256] text-center">
            {engineFacts.summaryLine}
            {engineFacts.summaryLine && engineFacts.provider ? ' · ' : ''}
            {engineFacts.provider}
          </p>
        )}
      </div>
    </section>
  );
}
