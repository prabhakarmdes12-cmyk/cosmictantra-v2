'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

/**
 * InfoTip — plain-language ⓘ glossary for first-time visitors.
 * Bilingual (hi/en), tap-to-toggle, closes on outside click.
 * Keeps the expert telemetry honest without hiding it.
 */
const GLOSSARY: Record<string, { hi: string; en: string }> = {
  tithi: {
    hi: 'तिथि = चन्द्रमा की कला। पूने से अमावस्या तक 30 चन्द्र-दिवस — व्रत, त्योहार व शुभ कार्य इसी से तय होते हैं।',
    en: 'Tithi = the Moon\u2019s phase. 30 lunar days from new moon to full — festivals, vrats & muhurats follow it.'
  },
  nakshatra: {
    hi: 'नक्षत्र = चन्द्रमा जिस तारे-मंडल में है (कुल 27)। आपके जन्म का नक्षत्र स्वभाव व नामाक्षर बताता है।',
    en: 'Nakshatra = the Moon\u2019s star-mansion (27 in all). Your birth Nakshatra shapes temperament & name syllables.'
  },
  yoga: {
    hi: 'योग = सूर्य-चन्द्र की कोणीय दूरी से बना दिन का भाव — शुभ या चुनौतीपूर्ण प्रवृत्ति का सूचक।',
    en: 'Yoga = the day\u2019s tone from the Sun-Moon angular distance — auspicious or challenging.'
  },
  karana: {
    hi: 'करण = तिथि का आधा भाग। गणना में सूक्ष्म समय-खंड बताता है।',
    en: 'Karana = half of a tithi — a finer time segment in the calculation.'
  },
  rahuKaal: {
    hi: 'राहु काल = दिन का वह समय जब नए कार्य, यात्रा व व्यापार आरम्भ करने से बचना चाहिए।',
    en: 'Rahu Kaal = the daily window to avoid starting new work, travel or deals.'
  },
  lagna: {
    hi: 'लग्न = जन्म के क्षण पूर्वी क्षितिज में उदित राशि — स्वभाव, शरीर व जीवन-दृष्टि का मूल।',
    en: 'Lagna (Ascendant) = the sign rising on the eastern horizon at birth — the chart\u2019s foundation.'
  },
  ayanamsha: {
    hi: 'अयनांश = उत्तरायण-दक्षिणायण के कारण नक्षत्रों की अक्षांशीय अंतर — लाहिरी (चित्रा पक्ष) मानक।',
    en: 'Ayanamsha = the precession offset fixing star positions; Lahiri (Chitra Paksha) is the Indian standard.'
  },
  dasha: {
    hi: 'दशा = ग्रहों के अनुसार जीवन के अध्याय। वर्तमान महादशा बताती है कि जीवन में अभी किस ग्रह का प्रभाव है।',
    en: 'Dasha = planetary life-chapters. The current Mahadasha shows which planet is steering your life now.'
  }
};

export default function InfoTip({ term, lang = 'hi' }: { term: keyof typeof GLOSSARY | string; lang?: 'en' | 'hi' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const entry = GLOSSARY[term];
  if (!entry) return null;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/25 text-[8px] font-bold text-[#696256] dark:text-[#9E988D] hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] hover:text-[#8E6F1D] dark:hover:text-[#F0C968] transition-colors cursor-pointer ml-1"
        aria-label={lang === 'hi' ? `${term} का अर्थ जानें` : `What is ${term}?`}
        title={lang === 'hi' ? 'अर्थ देखें' : 'What is this?'}
      >
        <Info className="w-2.5 h-2.5" />
      </button>

      {open && (
        <span className="absolute left-0 top-5 z-[70] w-52 p-2.5 rounded-xl bg-white/98 dark:bg-[#0E101D]/98 backdrop-blur-xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 shadow-2xl text-[10px] leading-relaxed font-medium text-[#1C1917] dark:text-[#EFECE6] normal-case tracking-normal animate-in fade-in zoom-in-95 duration-150">
          {lang === 'hi' ? entry.hi : entry.en}
        </span>
      )}
    </span>
  );
}
