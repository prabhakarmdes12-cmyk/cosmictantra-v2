'use client';

import React, { useState } from 'react';
import { Sparkles, Send, User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { buildSystemPrompt } from '@/engines/guruAI.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatBox({ kundali }: { kundali?: any }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: kundali?.lagna
        ? `Namaste! I have analyzed your birth chart (${kundali.lagna.rasiName} Lagna). You have 3 free AI insights. Ask me anything about your planetary placement!`
        : `Namaste! I am your AI Jyotish Assistant. Enter your birth details or ask a question about your planetary transit!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [questionsCount, setQuestionsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const maxFreeQuestions = 3;
  const isLimitReached = questionsCount >= maxFreeQuestions;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || isLimitReached) return;

    const userText = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const nextCount = questionsCount + 1;
    setQuestionsCount(nextCount);

    try {
      // Simulate/call Claude API or structured response
      setTimeout(() => {
        let reply = '';
        if (kundali?.lagna) {
          reply = `Based on your ${kundali.lagna.rasiName} Lagna and current Dasha alignment, "${userText}" requires strategic focus. The planetary influence in your 10th house indicates major progress when aligned with proper remedies.`;
        } else {
          reply = `Vedic Jyotish teaches that every challenge contains a divine lesson. For your question regarding "${userText}", aligning your actions with daily Panchang muhurtas will bring auspicious results.`;
        }

        setMessages([...newMessages, { role: 'assistant', content: reply }]);
        setLoading(false);
      }, 800);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0A1E] border border-purple-500/30 rounded-2xl overflow-hidden font-body shadow-[0_4px_30px_rgba(124,58,237,0.15)]">
      {/* Top Bar */}
      <div className="p-4 bg-purple-950/60 border-b border-purple-500/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#F59E0B] flex items-center justify-center text-sm">
            🧘
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Guru AI Assistant</h3>
            <span className="text-[10px] text-[#A78BFA]">Vedic Astrology Intelligence</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[#F59E0B] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            {Math.max(0, maxFreeQuestions - questionsCount)} / {maxFreeQuestions} Free Questions Left
          </span>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[300px] text-xs">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-xs shrink-0">
                🧘
              </div>
            )}
            <div
              className={`p-3 rounded-xl max-w-[82%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#7C3AED] text-white font-medium rounded-tr-none'
                  : 'bg-black/40 border border-purple-500/20 text-[#E2D9F3] rounded-tl-none'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center text-xs text-[#9CA3AF]">
            <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-ping" />
            <span>Guru AI is contemplating the cosmos...</span>
          </div>
        )}

        {/* Limit Reached Escalation Banner */}
        {isLimitReached && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/60 via-purple-950/40 to-black border-2 border-[#F59E0B]/50 text-center space-y-3 animate-fade-in my-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#F59E0B] uppercase">
              <Lock className="w-4 h-4" /> Unlocked Initial AI Insights
            </div>
            <p className="text-xs text-[#D1D5DB] leading-relaxed">
              For authoritative personal guidance, verified remedies, and human-checked written consultation on critical decisions:
            </p>
            <Link
              href="/ask"
              className="chiti-btn-primary py-3 px-6 text-xs w-full justify-center bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              Consult Senior Pandit Ji — ₹501 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-black/60 border-t border-purple-500/20 flex gap-2">
        <input
          type="text"
          disabled={isLimitReached || loading}
          className="chiti-input text-xs py-2.5 flex-1"
          placeholder={isLimitReached ? 'Free questions limit reached. Consult Pandit Ji above.' : 'Ask Guru AI a question about your chart...'}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={isLimitReached || loading || !input.trim()}
          className="chiti-btn-primary py-2.5 px-4 text-xs shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
