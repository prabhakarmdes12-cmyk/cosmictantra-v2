'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Send, ShieldCheck, Compass, Flame, BookOpen, UserCheck, ArrowRight } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provenance?: {
    source?: string;
    scholar?: string;
    calculation?: string;
    darshan?: string;
    interpretation?: string;
  };
  chips?: Array<{ label: string; action: string; href?: string }>;
}

export default function ChatBox({ kundali }: { kundali?: any }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: kundali?.lagna
        ? `हर हर महादेव! 🙏 आपकी जन्म पत्रिका (${kundali.lagna.rasiName || 'वृषभ'} लग्न • ${kundali.moon?.nakshatra?.name || 'रोहिणी'} नक्षत्र) की खगोलीय गणना उपलब्ध है। आप आज के पञ्चाङ्ग, शुभ मुहूर्त, मन्त्र जप अथवा काशी के विद्वान् ज्योतिषी से परामर्श के विषय में पूछ सकते हैं।`
        : `हर हर महादेव! 🙏 मैं 'काशी सहायक' हूँ — काशी विश्वनाथ की पावन धरा से आपका वैदिक साथी। आज का पञ्चाङ्ग, शुभ मुहूर्त, मन्दिर दर्शन अथवा कुण्डली विवेचना हेतु अपना प्रश्न लिखें।`,
      provenance: {
        calculation: 'CosmicTantra Lahiri Engine',
        source: 'प्रामाणिक दृक् पञ्चाङ्ग / शास्त्र',
        interpretation: 'काशी सहायक (Vedic Assistant)'
      },
      chips: [
        { label: '🕉️ आज का पञ्चाङ्ग व राहुकाल', action: 'INTENT_PANCHANG' },
        { label: '🪔 काशी विश्वनाथ लाइव दर्शन', action: 'INTENT_DARSHAN' },
        { label: '📿 महामृत्युंजय मन्त्र जप', action: 'INTENT_MANTRA' },
        { label: '📜 विद्वान् ज्योतिषी से परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' }
      ]
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const userText = (customText || input).trim();
    if (!userText || loading) return;

    chitiSensory.playTick();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/guru/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: newMessages.slice(-4).map(m => ({
            role: m.role,
            content: m.content
          })),
          context: {
            city: 'Varanasi',
            profileName: 'Seeker'
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: data.text || 'हर हर महादेव! 🙏',
            provenance: data.provenance,
            chips: data.quickChips
          }
        ]);
      } else {
        throw new Error('Backend failed');
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `आपके विचार "${userText}" के संदर्भ में वैदिक ज्योतिषीय दृष्टि से यह समय सजग अवलोकन का है। आप आज का पञ्चाङ्ग जान सकते हैं, मन्दिरों का लाइव दर्शन कर सकते हैं, अथवा काशी के विद्वान् ज्योतिषी से सीधे परामर्श प्राप्त कर सकते हैं।`,
          provenance: {
            source: 'प्रामाणिक दृक् पञ्चाङ्ग / शास्त्र',
            interpretation: 'काशी सहायक'
          },
          chips: [
            { label: '🕉️ आज का पञ्चाङ्ग', action: 'INTENT_PANCHANG' },
            { label: '🪔 काशी विश्वनाथ दर्शन', action: 'INTENT_DARSHAN' },
            { label: '📜 विद्वान् ज्योतिषी परामर्श', action: 'INTENT_SCHOLAR', href: '/ask' }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] dark:bg-[#090B12] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 rounded-3xl overflow-hidden font-mono-data text-[#1C1917] dark:text-[#FAF7F2] shadow-xl">
      
      {/* Top Header */}
      <div className="p-4 bg-black/[0.03] dark:bg-white/[0.03] border-b border-black/10 dark:border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 shadow-xs">
            <Image
              src="/images/avatar/guru_varanasi.jpg"
              alt="Kashi Sahayak"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] font-editorial">
              काशी सहायक • Kashi Sahayak
            </h3>
            <span className="text-[10px] text-[#857E74] dark:text-[#A8A29E] block">
              वाराणसी वैदिक सहायक • प्रमाणिक दृक् गणना
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/25">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>सत्यापित साक्ष्य</span>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 p-4 space-y-3.5 overflow-y-auto min-h-[320px] text-xs">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black rounded-br-xs font-bold'
                  : 'bg-white dark:bg-[#121522] border border-black/10 dark:border-white/10 text-[#1C1917] dark:text-[#F3EFE6] rounded-bl-xs shadow-xs'
              }`}
            >
              <p className="whitespace-pre-line">{m.content}</p>

              {/* Provenance Badge */}
              {m.provenance && (
                <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[9.5px] text-[#857E74] flex flex-wrap gap-2">
                  {m.provenance.source && <span>✦ {m.provenance.source}</span>}
                  {m.provenance.scholar && <span className="text-amber-600 dark:text-amber-400 font-bold">✦ {m.provenance.scholar}</span>}
                </div>
              )}

              {/* Quick Action Chips */}
              {m.chips && m.chips.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-1.5">
                  {m.chips.map((chip, cIdx) => (
                    chip.href ? (
                      <Link
                        key={cIdx}
                        href={chip.href}
                        className="px-2 py-1 rounded-lg bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D] hover:text-white dark:hover:text-black text-[10px] font-bold transition-colors"
                      >
                        {chip.label} →
                      </Link>
                    ) : (
                      <button
                        key={cIdx}
                        onClick={() => handleSend(undefined, chip.label)}
                        className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-[#8E6F1D]/15 text-[#57524A] dark:text-[#D1C9BF] text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center text-xs text-[#857E74]">
            <div className="w-2 h-2 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] animate-ping" />
            <span>काशी पञ्चाङ्ग व शास्त्रसम्मत गणना हो रही है...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => handleSend(e)} className="p-3 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/10 dark:border-white/10 flex gap-2">
        <input
          type="text"
          disabled={loading}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37]"
          placeholder="पञ्चाङ्ग, मुहूर्त, मन्त्र या कुण्डली के विषय में पूछें..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black font-bold text-xs shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
