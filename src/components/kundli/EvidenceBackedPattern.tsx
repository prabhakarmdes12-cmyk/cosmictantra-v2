'use client';

/**
 * EvidenceBackedPattern - CosmicTantra 2027 UI/UX
 * 
 * Replaces synthetic percentile scores with grounded classical patterns
 * as specified in UI_UX_DESIGN_DIRECTION_2027.md Section 5.
 * 
 * Anti-Pattern: Scores like "Executive Will: 96%" or "Relationship Sensitivity: 84%"
 * look mathematically authoritative but lack clear meaning and risk
 * resembling gamified personality quizzes.
 * 
 * The New Standard: Evidence-Backed Patterns that link to underlying chart factors.
 */

import React from 'react';
import { Compass, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export interface ClassicalEvidence {
  /** Sanskrit term for the classical factor */
  sanskritTerm: string;
  /** Hindi/English description */
  description: string;
  /** The astrological calculation/formula */
  calculation: string;
  /** Source text reference */
  sourceText?: string;
}

export interface EvidenceBackedPatternProps {
  /** Pattern title (e.g., "Professional Drive & Responsibility") */
  title: string;
  titleHi?: string;
  /** Strength level indicator */
  strength: 'STRONGLY_REPRESENTED' | 'MODERATELY_REPRESENTED' | 'SUBTLY_PRESENT' | 'LIMITED_EXPRESSION';
  /** Classical evidence factors that back this pattern */
  evidences: ClassicalEvidence[];
  /** Current Vimshottari activation if applicable */
  currentDasha?: string;
  /** Navigation action */
  onViewEvidence?: () => void;
  onAskPandit?: () => void;
  /** Language preference */
  lang?: 'en' | 'hi';
}

const STRENGTH_CONFIG = {
  STRONGLY_REPRESENTED: {
    label: 'Strongly Represented',
    labelHi: 'प्रबल रूप से प्रतिनिधित्व',
    icon: ShieldCheck,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/30',
    barClass: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    barWidth: '100%',
  },
  MODERATELY_REPRESENTED: {
    label: 'Moderately Represented',
    labelHi: 'मध्यम रूप से प्रतिनिधित्व',
    icon: Compass,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/30',
    barClass: 'bg-gradient-to-r from-amber-500 to-amber-400',
    barWidth: '66%',
  },
  SUBTLY_PRESENT: {
    label: 'Subtly Present',
    labelHi: 'सूक्ष्म रूप से उपस्थित',
    icon: Compass,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/10 border-blue-500/30',
    barClass: 'bg-gradient-to-r from-blue-500 to-blue-400',
    barWidth: '40%',
  },
  LIMITED_EXPRESSION: {
    label: 'Limited Expression',
    labelHi: 'सीमित अभिव्यक्ति',
    icon: AlertTriangle,
    colorClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-500/10 border-slate-500/30',
    barClass: 'bg-gradient-to-r from-slate-500 to-slate-400',
    barWidth: '20%',
  },
};

export default function EvidenceBackedPattern({
  title,
  titleHi,
  strength,
  evidences,
  currentDasha,
  onViewEvidence,
  onAskPandit,
  lang = 'en',
}: EvidenceBackedPatternProps) {
  const config = STRENGTH_CONFIG[strength];
  const StrengthIcon = config.icon;
  const displayTitle = lang === 'hi' && titleHi ? titleHi : title;

  return (
    <div className={`rounded-2xl border p-4 ${config.bgClass} transition-all`}>
      {/* Header: Title + Strength Indicator */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <h4 className="font-editorial font-bold text-base text-[#1C1917] dark:text-white leading-tight">
            {displayTitle}
          </h4>
          <div className={`flex items-center gap-1.5 mt-1 ${config.colorClass}`}>
            <StrengthIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-mono-data font-semibold">
              {lang === 'hi' ? config.labelHi : config.label}
            </span>
          </div>
        </div>
        
        {/* Strength Bar (visual indicator, not a percentile) */}
        <div className="w-16 shrink-0">
          <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div 
              className={`h-full rounded-full ${config.barClass}`}
              style={{ width: config.barWidth }}
            />
          </div>
        </div>
      </div>

      {/* Classical Evidence Section */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-1.5 text-[10px] font-mono-data uppercase tracking-wider text-[#857E74] dark:text-[#A8A29E]">
          <Compass className="w-3 h-3" />
          <span>Classical Evidence (शास्त्रीय साक्ष्य)</span>
        </div>
        
        <div className="space-y-1.5">
          {evidences.map((evidence, idx) => (
            <div 
              key={idx}
              className="p-2.5 rounded-xl bg-white/50 dark:bg-black/30 border border-black/5 dark:border-white/5"
            >
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold text-xs mt-0.5">•</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-[#1C1917] dark:text-white">
                    {evidence.sanskritTerm}
                  </span>
                  <span className="text-[#57524A] dark:text-[#D1C9BF] text-sm">
                    {' — '}{evidence.description}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 pl-4 text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                <span className="text-[#8E6F1D] dark:text-[#D4AF37]">⌖</span>{' '}
                {evidence.calculation}
                {evidence.sourceText && (
                  <span className="ml-2 italic">({evidence.sourceText})</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Dasha Indicator */}
      {currentDasha && (
        <div className="mb-4 p-2.5 rounded-xl bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10 border border-[#8E6F1D]/20 dark:border-[#D4AF37]/20">
          <span className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
            Current Vimshottari Activation
          </span>
          <p className="text-sm font-semibold text-[#1C1917] dark:text-white mt-0.5">
            {currentDasha}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
        {onViewEvidence && (
          <button
            onClick={onViewEvidence}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0E101D] border border-black/10 dark:border-white/10 text-xs font-mono-data font-semibold text-[#1C1917] dark:text-white hover:bg-[#8E6F1D]/10 dark:hover:bg-[#D4AF37]/10 hover:border-[#8E6F1D]/30 dark:hover:border-[#D4AF37]/30 transition-all cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
            <span>View Astronomical Evidence →</span>
          </button>
        )}
        
        {onAskPandit && (
          <button
            onClick={onAskPandit}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#06070B] text-xs font-mono-data font-semibold hover:opacity-90 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ask a Pandit →</span>
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PRE-BUILT PATTERN TEMPLATES
// =============================================================================

/**
 * Template for common Jyotish patterns with their classical evidence
 */
export const EVIDENCE_BACKED_PATTERN_TEMPLATES = {
  PROFESSIONAL_DRIVE: {
    title: 'Professional Drive & Responsibility',
    titleHi: 'व्यावसायिक ऊर्जा व कर्तव्य',
    strength: 'STRONGLY_REPRESENTED' as const,
    evidences: [
      {
        sanskritTerm: 'Saturn in 10th House (Digbala)',
        description: 'Career orientation and worldly achievements',
        calculation: 'Saturn → 10th Bhava (10°52\' Capricorn)',
        sourceText: 'BPHS Chapter 9',
      },
      {
        sanskritTerm: '10th Lord Jupiter in Kendra',
        description: 'Leadership qualities and wisdom in career',
        calculation: 'Jupiter (10th Lord) → Jupiter in 1st House (Own sign)',
        sourceText: 'Phaldeepika Chapter 17',
      },
      {
        sanskritTerm: 'Current Vimshottari Activation',
        description: 'Period currently activating career indicators',
        calculation: 'Jupiter–Saturn Mahadasha',
        sourceText: 'Vimshottari Dasha System',
      },
    ],
  },
  
  RELATIONSHIP_HARMONY: {
    title: 'Relationship Harmony & Partnership',
    titleHi: 'सम्बंध सामंजस्य और साथी',
    strength: 'MODERATELY_REPRESENTED' as const,
    evidences: [
      {
        sanskritTerm: 'Venus in 7th House',
        description: 'Natural significator of marriage and partnerships',
        calculation: 'Venus → 7th Bhava (Libra 15°30\')',
        sourceText: 'BPHS Chapter 30',
      },
      {
        sanskritTerm: '7th Lord Moon in Benefic Association',
        description: 'Emotional balance in relationships',
        calculation: 'Moon (7th Lord) → Trine aspect from Jupiter',
        sourceText: 'Saravali Chapter 46',
      },
    ],
  },
  
  SPIRITUAL_GROWTH: {
    title: 'Spiritual Growth & Liberation',
    titleHi: 'आध्यात्मिक विकास और मोक्ष',
    strength: 'STRONGLY_REPRESENTED' as const,
    evidences: [
      {
        sanskritTerm: 'Jupiter in 9th House (Own sign)',
        description: 'Dharma, wisdom, and spiritual fortune',
        calculation: 'Jupiter → 9th Bhava (Sagittarius 22°15\')',
        sourceText: 'BPHS Chapter 11',
      },
      {
        sanskritTerm: 'Ketu in 12th House',
        description: 'Detachment and spiritual liberation',
        calculation: 'Ketu → 12th Bhava (Pisces 8°45\')',
        sourceText: 'Phaldeepika Chapter 28',
      },
      {
        sanskritTerm: 'Current Vimshottari Activation',
        description: 'Spiritual period activation',
        calculation: 'Ketu–Jupiter Antardasha',
        sourceText: 'Vimshottari Dasha System',
      },
    ],
  },
  
  MENTAL_CLARITY: {
    title: 'Mental Clarity & Communication',
    titleHi: 'मानसिक स्पष्टता और संचार',
    strength: 'MODERATELY_REPRESENTED' as const,
    evidences: [
      {
        sanskritTerm: 'Mercury in Own Sign or Exaltation',
        description: 'Intellectual acuity and communication',
        calculation: 'Mercury → Virgo 5°20\' (Exalted)',
        sourceText: 'BPHS Chapter 14',
      },
      {
        sanskritTerm: '3rd House Strength (Communication)',
        description: 'Courage to express and communicate',
        calculation: 'Mars (3rd Lord) in 11th House (Friend sign)',
        sourceText: 'Saravali Chapter 36',
      },
    ],
  },
  
  FINANCIAL_STABILITY: {
    title: 'Financial Stability & Abundance',
    titleHi: 'वित्तीय स्थिरता और समृद्धि',
    strength: 'SUBTLY_PRESENT' as const,
    evidences: [
      {
        sanskritTerm: '2nd House Lord in Own/Exalted Sign',
        description: 'Accumulation of wealth and family resources',
        calculation: 'Venus (2nd Lord) → Taurus 12°30\'',
        sourceText: 'BPHS Chapter 10',
      },
      {
        sanskritTerm: '11th House Lord Conjoining Jupiter',
        description: 'Income gains and fulfillment of desires',
        calculation: 'Mars (11th Lord) + Jupiter Conjunction',
        sourceText: 'Phaldeepika Chapter 17',
      },
    ],
  },
};
