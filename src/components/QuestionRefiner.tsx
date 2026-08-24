'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowRight, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const EXAMPLES = [
  {
    category: 'Career & Business',
    bad: 'Tell me when I will be rich.',
    good: 'I am considering expanding my retail business to a second location. What patterns in my chart should I examine before committing capital this quarter?',
  },
  {
    category: 'Job & Career Transition',
    bad: 'Will I get a new job soon?',
    good: 'I have two job offers on the table. What does my current Dasha period suggest regarding leadership roles vs stability?',
  },
  {
    category: 'Marriage & Relationships',
    bad: 'When will I get married?',
    good: 'What does my 7th house lord alignment and current Dasha indicate regarding timing for marriage commitment in 2026?',
  },
  {
    category: 'Life & Remedies',
    bad: 'Fix all my problems.',
    good: 'I am experiencing persistent delays in financial growth. What planetary remedies align best with my natal Moon Nakshatra?',
  },
];

export default function QuestionRefiner() {
  const [customQuestion, setCustomQuestion] = useState('');

  const handleRefineClick = () => {
    trackEvent('QUESTION_REFINER_OPENED', { questionLength: customQuestion.length });
  };

  return (
    <section className="py-16 px-4 max-w-5xl mx-auto border-b border-purple-500/20 font-body">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest">
          CONSULTATION PREPARATION
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
          The quality of the question matters.
        </h2>
        <p className="text-xs sm:text-sm text-[#9CA3AF]">
          Vedic Jyotish yields the most profound guidance when provided with a focused, decision-oriented question.
        </p>
      </div>

      {/* 4 Comparative Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {EXAMPLES.map((ex, idx) => (
          <div key={idx} className="chiti-card p-5 space-y-3 bg-black/60">
            <div className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider font-display border-b border-white/5 pb-2">
              {ex.category}
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 flex items-start gap-2">
                <XCircle className="w-4 h-4 text-[#F87171] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#F87171] uppercase font-bold block">Vague Question</span>
                  <span className="text-[#D1D5DB]">"{ex.bad}"</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6EE7B7] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#6EE7B7] uppercase font-bold block">Focused Decision Question</span>
                  <span className="text-white font-medium">"{ex.good}"</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Helper CTA */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/50 via-black to-purple-950/50 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white font-display">Ready to submit your focused question?</h3>
          <p className="text-xs text-[#9CA3AF]">
            Our submission page helps you structure your birth details and exact question for Pandit Ji.
          </p>
        </div>

        <Link
          href="/ask"
          onClick={handleRefineClick}
          className="chiti-btn-primary py-3 px-6 text-xs font-bold shrink-0"
        >
          Formulate My Question — ₹199 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
