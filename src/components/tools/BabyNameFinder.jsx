'use client';

import React, { useState } from 'react';
import { Baby, Sparkles } from 'lucide-react';
import { NAKSHATRA_NAMES } from '../../lib/astrologyEngine';
import { nameNumber } from '../../lib/numerology';
import { chitiSensory } from '../../lib/chitiAudio';

/**
 * Baby name finder by birth Nakshatra (Janma Nakshatra syllable tradition).
 * Syllable sets are the classical Namakshara mappings used in naming
 * ceremonies (approximate transliterations).
 */
const SYLLABLES = {
  Ashwini: ['Chu', 'Che', 'Cho', 'La'],
  Bharani: ['Li', 'Lu', 'Le', 'Lo'],
  Krittika: ['A', 'I', 'U', 'E'],
  Rohini: ['O', 'Va', 'Vi', 'Vu'],
  Mrigashira: ['Ve', 'Vo', 'Ka', 'Ki'],
  Ardra: ['Ku', 'Gha', 'Nga', 'Chha'],
  Punarvasu: ['Ke', 'Ko', 'Ha', 'Hi'],
  Pushya: ['Hu', 'He', 'Ho', 'Da'],
  Ashlesha: ['Di', 'Du', 'De', 'Do'],
  Magha: ['Ma', 'Mi', 'Mu', 'Me'],
  'Purva Phalguni': ['Mo', 'Ta', 'Ti', 'Tu'],
  'Uttara Phalguni': ['Te', 'To', 'Pa', 'Pi'],
  Hasta: ['Pu', 'Sha', 'Na', 'Tha'],
  Chitra: ['Pe', 'Po', 'Ra', 'Ri'],
  Swati: ['Ru', 'Re', 'Ro', 'Ta'],
  Vishakha: ['Ti', 'Tu', 'Te', 'To'],
  Anuradha: ['Na', 'Ni', 'Nu', 'Ne'],
  Jyeshtha: ['No', 'Ya', 'Yi', 'Yu'],
  Mula: ['Ye', 'Yo', 'Bha', 'Bhi'],
  'Purva Ashadha': ['Bhu', 'Dha', 'Pha', 'Dha'],
  'Uttara Ashadha': ['Bhe', 'Bho', 'Ja', 'Ji'],
  Shravana: ['Khi', 'Khu', 'Khe', 'Kho'],
  Dhanishtha: ['Ga', 'Gi', 'Gu', 'Ge'],
  Shatabhisha: ['Go', 'Sa', 'Si', 'Su'],
  'Purva Bhadrapada': ['Se', 'So', 'Da', 'Di'],
  'Uttara Bhadrapada': ['Du', 'Tha', 'Jha', 'Na'],
  Revati: ['De', 'Do', 'Cha', 'Chi'],
};

const SUGGESTIONS = {
  Ashwini: ['Chaitanya', 'Charvi', 'Chinmay', 'Lakshya', 'Chetan'],
  Bharani: ['Likhit', 'Lila', 'Lipika', 'Lohit'],
  Krittika: ['Aarav', 'Anaya', 'Ishaan', 'Urvi', 'Aarohi'],
  Rohini: ['Ojasvi', 'Vanya', 'Vihaan', 'Vidhi', 'Ovi'],
  Mrigashira: ['Vedant', 'Veda', 'Kavya', 'Krishna', 'Veyom'],
  Ardra: ['Kunal', 'Kushal', 'Ghanshyam', 'Chhavi'],
  Punarvasu: ['Keshav', 'Harsh', 'Ketan', 'Harini', 'Hriday'],
  Pushya: ['Harshit', 'Hema', 'Heta', 'Darsh', 'Himanshu'],
  Ashlesha: ['Divya', 'Deeksha', 'Devansh', 'Dhairya'],
  Magha: ['Manav', 'Mahika', 'Mihir', 'Meera', 'Madhav'],
  'Purva Phalguni': ['Mohit', 'Tanvi', 'Tia', 'Tanish'],
  'Uttara Phalguni': ['Tejas', 'Tara', 'Pooja', 'Palak', 'Pranav'],
  Hasta: ['Pulkit', 'Shreya', 'Nandini', 'Tanmay'],
  Chitra: ['Peyush', 'Priya', 'Ritvik', 'Riya'],
  Swati: ['Rudra', 'Reva', 'Rohan', 'Riya', 'Tara'],
  Vishakha: ['Tejasvi', 'Tulsi', 'Tanush', 'Tanya'],
  Anuradha: ['Nakul', 'Nitya', 'Nishant', 'Neha'],
  Jyeshtha: ['Yash', 'Yuvraj', 'Yamini', 'Yogesh'],
  Mula: ['Bhadra', 'Bhavya', 'Yogita', 'Yash'],
  'Purva Ashadha': ['Bhuvan', 'Dharm', 'Parth', 'Dhaval'],
  'Uttara Ashadha': ['Bheem', 'Jaya', 'Jatin', 'Jiya'],
  Shravana: ['Khushi', 'Kheer', 'Khyati', 'Kirti'],
  Dhanishtha: ['Gaurav', 'Gauri', 'Gunjan', 'Geet'],
  Shatabhisha: ['Gopal', 'Sahil', 'Siddhi', 'Sivan'],
  'Purva Bhadrapada': ['Sarthak', 'Soham', 'Daksh', 'Devyani'],
  'Uttara Bhadrapada': ['Dushyant', 'Jhanvi', 'Naksh', 'Dhruv'],
  Revati: ['Devika', 'Dolly', 'Charu', 'Chehak'],
};

const BOY = ['Aarav', 'Vihaan', 'Arjun', 'Aditya', 'Kabir', 'Reyansh', 'Dhruv', 'Ishaan', 'Krishna', 'Rudra'];
const GIRL = ['Aanya', 'Kiara', 'Anaya', 'Diya', 'Myra', 'Saanvi', 'Ira', 'Avni', 'Riya', 'Navya'];

function pickSeeded(arr, seed) {
  const idx = Math.abs(seed) % arr.length;
  return arr.slice(idx).concat(arr.slice(0, idx));
}

export default function BabyNameFinder({ lang = 'en' }) {
  const [nakshatra, setNakshatra] = useState(NAKSHATRA_NAMES[13]); // Hasta
  const [gender, setGender] = useState('any');
  const [names, setNames] = useState([]);
  const hi = lang === 'hi';

  const handleFind = (e) => {
    e.preventDefault();
    chitiSensory.playTick();
    const seed = nakshatra.length * 7 + (gender === 'boy' ? 3 : gender === 'girl' ? 5 : 0);
    const base = NAKSHATRA_NAMES.indexOf(nakshatra);
    const syl = (SYLLABLES[nakshatra] || ['A'])[0];
    let pool = (SUGGESTIONS[nakshatra] || [])
      .concat(gender === 'boy' ? BOY : gender === 'girl' ? GIRL : BOY.concat(GIRL));
    pool = Array.from(new Set(pool));
    const ranked = pickSeeded(pool, seed)
      .map((n, i) => {
        const nn = nameNumber(n, 'chaldean');
        return { name: n, number: nn.number, planet: nn.planet, startsWithSyllable: n.toUpperCase().startsWith(syl), score: 100 - i * 2 + (n.toUpperCase().startsWith(syl) ? 5 : 0) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
    setNames(ranked);
  };

  return (
    <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-5 text-left">
      <div className="flex items-center gap-2 text-[#8E6F1D] dark:text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold">
        <Baby className="w-4 h-4" />
        {hi ? 'जन्म नक्षत्र अनुसार नाम' : 'Baby Names by Janma Nakshatra'}
      </div>
      <form onSubmit={handleFind} className="grid sm:grid-cols-3 gap-3">
        <select value={nakshatra} onChange={e => setNakshatra(e.target.value)}
          className="rounded-xl bg-[#FFFFFF] dark:bg-[#0A0C12] border border-black/[0.08] dark:border-white/[0.1] px-3 py-3 text-sm text-[#1C1917] dark:text-[#EFECE6]">
          {NAKSHATRA_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={gender} onChange={e => setGender(e.target.value)}
          className="rounded-xl bg-[#FFFFFF] dark:bg-[#0A0C12] border border-black/[0.08] dark:border-white/[0.1] px-3 py-3 text-sm text-[#1C1917] dark:text-[#EFECE6]">
          <option value="any">{hi ? 'कोई भी' : 'Any'}</option>
          <option value="boy">{hi ? 'लड़का' : 'Boy'}</option>
          <option value="girl">{hi ? 'लड़की' : 'Girl'}</option>
        </select>
        <button type="submit"
          className="py-3 rounded-xl bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] text-[#060709] font-bold text-sm flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" /> {hi ? 'नाम खोजें' : 'Find Names'}
        </button>
      </form>

      {names.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#4848A8] dark:text-[#8B8BF5] font-bold mb-3">
            {hi ? `सुझाव — ${nakshatra} (प्रथम अक्षर: ${(SYLLABLES[nakshatra] || ['A']).join(', ')})` : `Suggestions for ${nakshatra} (starting syllables: ${(SYLLABLES[nakshatra] || ['A']).join(', ')})`}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {names.map(n => (
              <div key={n.name} className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-[#FAF7F2] dark:bg-[#0A0C12]">
                <div className="font-bold text-sm text-[#1C1917] dark:text-[#EFECE6]">{n.name}</div>
                <div className="text-[10px] text-[#57524A] dark:text-[#AAA49A] mt-1 font-mono-data">
                  {n.number} · {n.planet}
                  {n.startsWithSyllable && <span className="ml-1 text-[#10B981]">✓</span>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#857E74] dark:text-[#8E8A82] mt-3">
            {hi ? 'सुझाव सांकेतिक हैं — नामकरण संस्कार से पूर्व विद्वान से पुष्टि कराएँ।' : 'Suggestions are indicative — confirm with a scholar before the Namkaran ceremony.'}
          </p>
        </div>
      )}
    </div>
  );
}
