'use client';

/**
 * KASHI SAHAYAK — verified passage card.
 *
 * Shows the original verse, the exact source, the stored meaning (kept
 * visually separate from the original) and the practical reflection. When
 * autoplay is blocked, the prominent "श्लोक सुनें" action is shown instead of
 * starting playback silently. Nothing about the passage is invented: every
 * field comes from the canonical store via the resolved passage object.
 */

import type { VerifiedPassage } from '@/lib/kashi/emotionalSupport';
import { LISTEN_VERSE_LABEL } from '@/lib/kashi/interaction';

export interface KashiVerseCardProps {
  passage: VerifiedPassage;
  reflection?: string;
  language: 'hi' | 'en';
  autoplayAllowed: boolean;
  onListen: () => void;
  /** Shown when the store could not provide a passage for this feeling. */
  unresolvedReason?: string | null;
}

export function KashiVerseCard(props: KashiVerseCardProps) {
  const { passage, reflection, language, autoplayAllowed, onListen, unresolvedReason } = props;

  if (!passage) {
    return unresolvedReason ? (
      <div
        data-testid="kashi-no-passage"
        className="p-3 rounded-xl bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-xs"
      >
        {unresolvedReason}
      </div>
    ) : null;
  }

  return (
    <div
      data-testid="kashi-verse-card"
      className="p-3.5 rounded-2xl bg-white dark:bg-[#121522] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 space-y-2"
    >
      <div data-testid="kashi-verse-original" className="text-sm leading-relaxed whitespace-pre-line">
        {passage.original}
      </div>

      <div data-testid="kashi-verse-source" className="text-[11px] text-[#696256] dark:text-[#9E988D]">
        {passage.book} · {passage.sectionTitle || passage.sectionId} · {passage.verseId}
        {passage.sourceLine ? ` · ${passage.sourceLine}` : ''}
      </div>

      {passage.meaning && (
        <div data-testid="kashi-verse-meaning" className="text-xs leading-relaxed border-t border-black/5 dark:border-white/10 pt-2">
          <span className="block text-[10px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
            {language === 'hi' ? 'अर्थ' : 'Meaning'}
          </span>
          {passage.meaning}
        </div>
      )}

      {reflection ? (
        <div data-testid="kashi-verse-reflection" className="text-xs italic">
          {reflection}
        </div>
      ) : null}

      {!autoplayAllowed && (
        <button
          type="button"
          data-testid="kashi-listen-verse"
          onClick={onListen}
          className="w-full py-2.5 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] text-sm font-bold"
        >
          {LISTEN_VERSE_LABEL}
        </button>
      )}

      <div className="text-[9px] opacity-60 break-all">
        {language === 'hi' ? 'प्रमाणिकता' : 'provenance'}: {passage.provenance}
      </div>
    </div>
  );
}
